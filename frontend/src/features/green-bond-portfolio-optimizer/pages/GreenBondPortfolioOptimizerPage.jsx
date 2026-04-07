import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, BarChart, Bar, Cell, AreaChart, Area } from 'recharts';

const T = { bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb', orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a', card:'#ffffff',sub:'#5c6b7e',indigo:'#4f46e5',font:"'DM Sans','SF Pro Display',system-ui,sans-serif", mono:"'JetBrains Mono','SF Mono','Fira Code',monospace" };
const TABS = ['Optimizer Dashboard','Efficient Frontier','Greenium Impact','Duration Matching','Benchmark Tracking Error','Constraint Builder'];

const FRONTIER = [
  { risk:2.1, retBase:2.8, retGreen:2.6 },{ risk:3.2, retBase:3.5, retGreen:3.2 },{ risk:4.0, retBase:4.1, retGreen:3.8 },
  { risk:5.1, retBase:4.8, retGreen:4.5 },{ risk:6.2, retBase:5.4, retGreen:5.0 },{ risk:7.5, retBase:5.9, retGreen:5.5 },
  { risk:8.8, retBase:6.3, retGreen:5.9 },{ risk:10.2, retBase:6.6, retGreen:6.2 },
];

const GREENIUM = [
  { sector:'Sovereign', conventional:3.85, green:3.72, greenium:-13 },
  { sector:'Supranational', conventional:3.42, green:3.28, greenium:-14 },
  { sector:'Corporate IG', conventional:4.55, green:4.38, greenium:-17 },
  { sector:'Corporate HY', conventional:6.82, green:6.58, greenium:-24 },
  { sector:'Utility', conventional:4.12, green:3.95, greenium:-17 },
  { sector:'Financial', conventional:4.28, green:4.15, greenium:-13 },
];

const BONDS = [
  { name:'EU Green Bond 2032', yield:3.12, duration:7.2, taxonomy:98, sector:'Sovereign', weight:8.5 },
  { name:'EIB Climate 2030', yield:2.85, duration:5.8, taxonomy:100, sector:'Supranational', weight:7.2 },
  { name:'Orsted Green 2031', yield:3.45, duration:6.5, taxonomy:92, sector:'Corporate', weight:5.8 },
  { name:'Iberdrola Green 2029', yield:3.28, duration:4.8, taxonomy:88, sector:'Utility', weight:6.1 },
  { name:'BNP Paribas Green 2028', yield:3.55, duration:3.8, taxonomy:82, sector:'Financial', weight:4.5 },
  { name:'Republic of Chile 2034', yield:4.25, duration:8.5, taxonomy:78, sector:'Sovereign', weight:5.2 },
  { name:'World Bank Green 2027', yield:2.65, duration:2.8, taxonomy:100, sector:'Supranational', weight:8.8 },
  { name:'Enel Green 2033', yield:3.68, duration:7.8, taxonomy:85, sector:'Utility', weight:4.2 },
];

const DURATION_TARGET = [
  { month:'Jan', portfolio:5.8, target:6.0 },{ month:'Feb', portfolio:5.9, target:6.0 },{ month:'Mar', portfolio:6.1, target:6.0 },
  { month:'Apr', portfolio:5.7, target:6.0 },{ month:'May', portfolio:6.2, target:6.0 },{ month:'Jun', portfolio:5.9, target:6.0 },
  { month:'Jul', portfolio:6.0, target:6.0 },{ month:'Aug', portfolio:5.8, target:6.0 },{ month:'Sep', portfolio:6.1, target:6.0 },
  { month:'Oct', portfolio:5.9, target:6.0 },{ month:'Nov', portfolio:6.0, target:6.0 },{ month:'Dec', portfolio:5.8, target:6.0 },
];

const TE_DATA = [
  { month:'Jan', te:0.12 },{ month:'Feb', te:0.15 },{ month:'Mar', te:0.18 },{ month:'Apr', te:0.14 },
  { month:'May', te:0.22 },{ month:'Jun', te:0.19 },{ month:'Jul', te:0.16 },{ month:'Aug', te:0.21 },
  { month:'Sep', te:0.17 },{ month:'Oct', te:0.14 },{ month:'Nov', te:0.13 },{ month:'Dec', te:0.15 },
];

export default function GreenBondPortfolioOptimizerPage() {
  const [tab, setTab] = useState(0);
  const [minTaxonomy, setMinTaxonomy] = useState(80);
  const [durationTarget, setDurationTarget] = useState(6.0);
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
              <span style={{ background:T.navy, color:'#fff', fontFamily:T.mono, fontSize:11, padding:'3px 10px', borderRadius:4 }}>EP-CQ1</span>
              <span style={{ fontFamily:T.mono, fontSize:11, color:T.textMut }}>GREEN BOND PORTFOLIO OPTIMIZER</span>
            </div>
            <h1 style={{ fontSize:22, fontWeight:700, color:T.navy, margin:'6px 0 2px' }}>Green Bond Portfolio Optimizer</h1>
            <p style={{ color:T.textSec, fontSize:13, margin:0 }}>Mean-variance optimization with greenium, taxonomy alignment & duration constraints</p>
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
            {card('Bond Universe', '50', 'Green bonds', T.navy)}
            {card('Avg Greenium', '-16 bps', 'vs conventional', T.green)}
            {card('Portfolio Duration', '5.9 yrs', 'Target: 6.0', T.gold)}
            {card('Taxonomy Alignment', '89%', 'EU Taxonomy', T.blue)}
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, overflowX:'auto' }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Optimized Bond Allocations</h3>
            <table style={{ width:'100%', borderCollapse:'collapse', minWidth:700 }}>
              <thead><tr>{['Bond','Yield %','Duration','Taxonomy %','Sector','Weight %'].map(h => <th key={h} style={{ padding:'8px 12px', textAlign:'left', borderBottom:`2px solid ${T.border}`, fontFamily:T.mono, fontSize:11, color:T.navy }}>{h}</th>)}</tr></thead>
              <tbody>{BONDS.filter(b => b.taxonomy >= minTaxonomy).map((b, i) => (
                <tr key={i} style={{ borderBottom:`1px solid ${T.border}` }}>
                  <td style={{ padding:'8px 12px', fontSize:13, fontWeight:600 }}>{b.name}</td>
                  <td style={{ padding:'8px 12px', fontFamily:T.mono, fontSize:13 }}>{b.yield}%</td>
                  <td style={{ padding:'8px 12px', fontFamily:T.mono, fontSize:13 }}>{b.duration}</td>
                  <td style={{ padding:'8px 12px', fontFamily:T.mono, fontSize:13, color:b.taxonomy>=90?T.green:T.amber }}>{b.taxonomy}%</td>
                  <td style={{ padding:'8px 12px', fontSize:13 }}>{b.sector}</td>
                  <td style={{ padding:'8px 12px', fontFamily:T.mono, fontSize:13 }}>{b.weight}%</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Efficient Frontier: Unconstrained vs Green Constrained</h3>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={FRONTIER}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="risk" tick={{ fontSize:11, fontFamily:T.mono }} label={{ value:'Risk (Vol %)', position:'bottom', style:{ fontSize:11 } }} />
              <YAxis tick={{ fontSize:11, fontFamily:T.mono }} label={{ value:'Return %', angle:-90, position:'insideLeft', style:{ fontSize:11 } }} />
              <Tooltip /><Legend />
              <Line dataKey="retBase" stroke={T.navy} strokeWidth={2} name="Unconstrained" dot={{ r:4 }} />
              <Line dataKey="retGreen" stroke={T.green} strokeWidth={2} name="Green Constrained" dot={{ r:4 }} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 2 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Greenium by Sector (bps)</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={GREENIUM}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="sector" tick={{ fontSize:11, fontFamily:T.mono }} />
              <YAxis tick={{ fontSize:11, fontFamily:T.mono }} />
              <Tooltip /><Legend />
              <Bar dataKey="conventional" fill={T.navy} name="Conventional Yield %" />
              <Bar dataKey="green" fill={T.green} name="Green Yield %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 3 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <div style={{ marginBottom:12, display:'flex', gap:12, alignItems:'center' }}>
            <label style={{ fontSize:12, color:T.textSec }}>Duration Target:</label>
            <input type="range" min="3" max="10" step="0.5" value={durationTarget} onChange={e => setDurationTarget(Number(e.target.value))} />
            <span style={{ fontFamily:T.mono, fontSize:13, color:T.navy }}>{durationTarget.toFixed(1)} yrs</span>
          </div>
          <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Portfolio Duration vs Target</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={DURATION_TARGET}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="month" tick={{ fontSize:11, fontFamily:T.mono }} />
              <YAxis tick={{ fontSize:11, fontFamily:T.mono }} domain={[5, 7]} />
              <Tooltip /><Legend />
              <Line dataKey="portfolio" stroke={T.navy} strokeWidth={2} name="Portfolio Duration" dot={{ r:3 }} />
              <Line dataKey="target" stroke={T.gold} strokeWidth={2} name="Target" strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 4 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Tracking Error vs Bloomberg Green Bond Index (%)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={TE_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="month" tick={{ fontSize:11, fontFamily:T.mono }} />
              <YAxis tick={{ fontSize:11, fontFamily:T.mono }} domain={[0, 0.3]} />
              <Tooltip /><Legend />
              <Area type="monotone" dataKey="te" fill={T.amber+'30'} stroke={T.amber} strokeWidth={2} name="Tracking Error %" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 5 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
          <h3 style={{ fontSize:16, fontWeight:600, color:T.navy, marginBottom:16 }}>Constraint Builder</h3>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:16 }}>
            <div style={{ padding:14, background:T.bg, borderRadius:8 }}>
              <label style={{ fontSize:12, fontWeight:600, color:T.navy }}>Min Taxonomy Alignment %</label>
              <input type="range" min="0" max="100" value={minTaxonomy} onChange={e => setMinTaxonomy(Number(e.target.value))} style={{ width:'100%', marginTop:8 }} />
              <span style={{ fontFamily:T.mono, fontSize:13, color:T.navy }}>{minTaxonomy}%</span>
            </div>
            <div style={{ padding:14, background:T.bg, borderRadius:8 }}>
              <label style={{ fontSize:12, fontWeight:600, color:T.navy }}>Max Sector Concentration</label>
              <input type="range" min="10" max="50" defaultValue={25} style={{ width:'100%', marginTop:8 }} />
              <span style={{ fontFamily:T.mono, fontSize:13, color:T.navy }}>25%</span>
            </div>
            <div style={{ padding:14, background:T.bg, borderRadius:8 }}>
              <label style={{ fontSize:12, fontWeight:600, color:T.navy }}>Duration Target ± Range</label>
              <input type="range" min="0.1" max="2.0" step="0.1" defaultValue={0.5} style={{ width:'100%', marginTop:8 }} />
              <span style={{ fontFamily:T.mono, fontSize:13, color:T.navy }}>±0.5 yrs</span>
            </div>
            <div style={{ padding:14, background:T.bg, borderRadius:8 }}>
              <label style={{ fontSize:12, fontWeight:600, color:T.navy }}>Max Tracking Error</label>
              <input type="range" min="0.1" max="1.0" step="0.05" defaultValue={0.25} style={{ width:'100%', marginTop:8 }} />
              <span style={{ fontFamily:T.mono, fontSize:13, color:T.navy }}>0.25%</span>
            </div>
          </div>
          <button style={{ marginTop:16, padding:'10px 24px', borderRadius:6, background:T.navy, color:'#fff', fontFamily:T.font, fontSize:14, fontWeight:600, border:'none', cursor:'pointer' }}>Run Optimization</button>
        </div>
      )}

      <div style={{ marginTop:24, padding:16, background:T.navy+'08', border:`1px solid ${T.navy}20`, borderRadius:8 }}>
        <div style={{ fontFamily:T.mono, fontSize:11, color:T.navy, fontWeight:600, marginBottom:4 }}>REFERENCE DATA</div>
        <div style={{ fontSize:12, color:T.textSec, lineHeight:1.6 }}>
          ICMA Green Bond Principles 2024 · Climate Bonds Initiative Standards · Bloomberg MSCI Green Bond Index · EU Green Bond Standard · Greenium Research (Zerbib 2019, Kapraun & Scheins 2022)
        </div>
      </div>
    </div>
  );
}
