import React, { useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';

const T = { bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb', orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a', card:'#ffffff',sub:'#5c6b7e',indigo:'#4f46e5',font:"'DM Sans','SF Pro Display',system-ui,sans-serif", mono:"'JetBrains Mono','SF Mono','Fira Code',monospace" };
const TABS = ['Integration Overview','Alpha Attribution','Risk Reduction Evidence','Client Reporting','Process Maturity','Continuous Improvement'];

const ALPHA_DATA = [
  { year:2020, portfolio:8.2, benchmark:7.1, esgAlpha:1.1 },
  { year:2021, portfolio:18.5, benchmark:16.8, esgAlpha:1.7 },
  { year:2022, portfolio:-12.4, benchmark:-15.2, esgAlpha:2.8 },
  { year:2023, portfolio:14.8, benchmark:12.5, esgAlpha:2.3 },
  { year:2024, portfolio:11.2, benchmark:9.8, esgAlpha:1.4 },
  { year:2025, portfolio:6.5, benchmark:5.2, esgAlpha:1.3 },
];

const RISK_DATA = [
  { metric:'Max Drawdown', portfolio:-18.2, benchmark:-24.5, benefit:6.3 },
  { metric:'Volatility (ann.)', portfolio:14.8, benchmark:17.2, benefit:2.4 },
  { metric:'VaR (95%)', portfolio:-2.1, benchmark:-2.8, benefit:0.7 },
  { metric:'Sharpe Ratio', portfolio:0.82, benchmark:0.65, benefit:0.17 },
  { metric:'Sortino Ratio', portfolio:1.15, benchmark:0.88, benefit:0.27 },
];

const MATURITY = [
  { dimension:'Policy & Framework', score:82 },
  { dimension:'Research Integration', score:78 },
  { dimension:'Portfolio Construction', score:72 },
  { dimension:'Risk Management', score:85 },
  { dimension:'Stewardship', score:88 },
  { dimension:'Reporting', score:75 },
  { dimension:'Governance', score:80 },
];

const PRI_SCORES = [
  { year:2021, score:72 },
  { year:2022, score:78 },
  { year:2023, score:82 },
  { year:2024, score:85 },
  { year:2025, score:88 },
];

const ASSET_CLASS = [
  { assetClass:'Listed Equity', depth:'Deep', coverage:95, score:88 },
  { assetClass:'Fixed Income', depth:'Moderate', coverage:82, score:72 },
  { assetClass:'Real Estate', depth:'Developing', coverage:65, score:58 },
  { assetClass:'Private Equity', depth:'Moderate', coverage:70, score:65 },
  { assetClass:'Infrastructure', depth:'Developing', coverage:55, score:52 },
  { assetClass:'Sovereign', depth:'Basic', coverage:48, score:42 },
];

const CLIENT_METRICS = [
  { metric:'Portfolio Carbon Intensity', value:'125 tCO₂e/$M', target:'< 150', status:'On Track' },
  { metric:'ESG Score (Weighted)', value:'72/100', target:'> 65', status:'On Track' },
  { metric:'Green Revenue %', value:'28%', target:'> 25%', status:'On Track' },
  { metric:'Controversy Incidents', value:'3', target:'< 5', status:'On Track' },
  { metric:'EU Taxonomy Alignment', value:'18%', target:'> 15%', status:'On Track' },
  { metric:'Active Engagements', value:'15', target:'> 10', status:'On Track' },
];

export default function EsgIntegrationDashboardPage() {
  const [tab, setTab] = useState(0);
  const [watchlist, setWatchlist] = useState(false);
  const [alertSub, setAlertSub] = useState(false);

  const card = (title, value, sub, color) => (
    <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, flex:1, minWidth:150 }}>
      <div style={{ fontFamily:T.mono, fontSize:11, color:T.textMut, textTransform:'uppercase', letterSpacing:1 }}>{title}</div>
      <div style={{ fontSize:28, fontWeight:700, color:color||T.navy, marginTop:4 }}>{value}</div>
      {sub && <div style={{ fontSize:12, color:T.textSec, marginTop:2 }}>{sub}</div>}
    </div>
  );

  const avgAlpha = (ALPHA_DATA.reduce((s, d) => s + d.esgAlpha, 0) / ALPHA_DATA.length).toFixed(1);

  return (
    <div style={{ fontFamily:T.font, background:T.bg, minHeight:'100vh', padding:24 }}>
      <div style={{ background:T.surface, border:`2px solid ${T.gold}`, borderRadius:12, padding:'20px 28px', marginBottom:20 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ background:T.navy, color:'#fff', fontFamily:T.mono, fontSize:11, padding:'3px 10px', borderRadius:4 }}>EP-CP6</span>
              <span style={{ fontFamily:T.mono, fontSize:11, color:T.textMut }}>ESG INTEGRATION DASHBOARD</span>
            </div>
            <h1 style={{ fontSize:22, fontWeight:700, color:T.navy, margin:'6px 0 2px' }}>ESG Integration Effectiveness</h1>
            <p style={{ color:T.textSec, fontSize:13, margin:0 }}>Alpha attribution, risk reduction & process maturity measurement</p>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => setWatchlist(!watchlist)} style={{ padding:'6px 14px', borderRadius:6, border:`1px solid ${watchlist?T.gold:T.border}`, background:watchlist?T.gold+'18':T.surface, color:T.navy, fontFamily:T.font, fontSize:12, cursor:'pointer' }}>{watchlist?'★ Watchlisted':'☆ Watchlist'}</button>
            <button onClick={() => setAlertSub(!alertSub)} style={{ padding:'6px 14px', borderRadius:6, border:`1px solid ${alertSub?T.green:T.border}`, background:alertSub?T.green+'18':T.surface, color:T.navy, fontFamily:T.font, fontSize:12, cursor:'pointer' }}>{alertSub?'🔔 Subscribed':'🔕 Alerts'}</button>
            <button style={{ padding:'6px 14px', borderRadius:6, border:`1px solid ${T.border}`, background:T.surface, color:T.navy, fontFamily:T.font, fontSize:12, cursor:'pointer' }}>⬇ Export</button>
          </div>
        </div>
      </div>

      <div style={{ display:'flex', gap:4, marginBottom:20, flexWrap:'wrap' }}>
        {TABS.map((t, i) => <button key={i} onClick={() => setTab(i)} style={{ padding:'8px 16px', borderRadius:6, border:`1px solid ${tab===i?T.gold:T.border}`, background:tab===i?T.gold+'18':T.surface, color:tab===i?T.navy:T.textSec, fontWeight:tab===i?600:400, fontFamily:T.font, fontSize:13, cursor:'pointer' }}>{t}</button>)}
      </div>

      {tab === 0 && (
        <div>
          <div style={{ display:'flex', gap:16, marginBottom:20, flexWrap:'wrap' }}>
            {card('Avg ESG Alpha', avgAlpha + '%', 'Annual excess return', T.green)}
            {card('Drawdown Benefit', '6.3%', 'vs benchmark', T.blue)}
            {card('PRI Score (2025)', '88/100', 'Assessment score', T.gold)}
            {card('Asset Classes', '6', 'Integrated', T.navy)}
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Portfolio vs Benchmark Returns (%)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ALPHA_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize:11, fontFamily:T.mono }} />
                <YAxis tick={{ fontSize:11, fontFamily:T.mono }} />
                <Tooltip /><Legend />
                <Bar dataKey="portfolio" fill={T.navy} name="Portfolio %" />
                <Bar dataKey="benchmark" fill={T.textMut} name="Benchmark %" />
                <Bar dataKey="esgAlpha" fill={T.green} name="ESG Alpha %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>ESG Alpha Attribution Over Time</h3>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={ALPHA_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize:11, fontFamily:T.mono }} />
              <YAxis tick={{ fontSize:11, fontFamily:T.mono }} />
              <Tooltip /><Legend />
              <Area type="monotone" dataKey="esgAlpha" fill={T.green+'30'} stroke={T.green} strokeWidth={2} name="ESG Alpha %" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 2 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, overflowX:'auto' }}>
          <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Risk Metrics: Portfolio vs Benchmark</h3>
          <table style={{ width:'100%', borderCollapse:'collapse', minWidth:600 }}>
            <thead><tr>{['Metric','Portfolio','Benchmark','ESG Benefit'].map(h => <th key={h} style={{ padding:'8px 12px', textAlign:'left', borderBottom:`2px solid ${T.border}`, fontFamily:T.mono, fontSize:11, color:T.navy }}>{h}</th>)}</tr></thead>
            <tbody>{RISK_DATA.map((r, i) => (
              <tr key={i} style={{ borderBottom:`1px solid ${T.border}` }}>
                <td style={{ padding:'8px 12px', fontSize:13, fontWeight:600 }}>{r.metric}</td>
                <td style={{ padding:'8px 12px', fontFamily:T.mono, fontSize:13 }}>{r.portfolio}</td>
                <td style={{ padding:'8px 12px', fontFamily:T.mono, fontSize:13 }}>{r.benchmark}</td>
                <td style={{ padding:'8px 12px', fontFamily:T.mono, fontSize:13, color:T.green, fontWeight:600 }}>+{r.benefit}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {tab === 3 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Client ESG Reporting Metrics</h3>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:12 }}>
            {CLIENT_METRICS.map((m, i) => (
              <div key={i} style={{ background:T.bg, border:`1px solid ${T.border}`, borderRadius:8, padding:14 }}>
                <div style={{ fontWeight:600, color:T.navy, fontSize:14 }}>{m.metric}</div>
                <div style={{ fontSize:24, fontWeight:700, color:T.navy, marginTop:4 }}>{m.value}</div>
                <div style={{ display:'flex', justifyContent:'space-between', marginTop:8 }}>
                  <span style={{ fontFamily:T.mono, fontSize:11, color:T.textMut }}>Target: {m.target}</span>
                  <span style={{ padding:'2px 8px', borderRadius:4, fontSize:11, fontFamily:T.mono, background:T.green+'18', color:T.green }}>{m.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 4 && (
        <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
          <div style={{ flex:1, background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, minWidth:300 }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Process Maturity Dimensions</h3>
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={MATURITY}>
                <PolarGrid stroke={T.border} />
                <PolarAngleAxis dataKey="dimension" tick={{ fontSize:9, fontFamily:T.mono }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize:9 }} />
                <Radar dataKey="score" stroke={T.gold} fill={T.gold} fillOpacity={0.3} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ flex:1, background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, minWidth:300 }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Integration Depth by Asset Class</h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={ASSET_CLASS}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="assetClass" tick={{ fontSize:9, fontFamily:T.mono, angle:-15, textAnchor:'end' }} height={50} />
                <YAxis tick={{ fontSize:11, fontFamily:T.mono }} domain={[0, 100]} />
                <Tooltip /><Legend />
                <Bar dataKey="coverage" fill={T.navy} name="Coverage %" />
                <Bar dataKey="score" fill={T.gold} name="Depth Score" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 5 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>PRI Assessment Score Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={PRI_SCORES}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize:11, fontFamily:T.mono }} />
              <YAxis tick={{ fontSize:11, fontFamily:T.mono }} domain={[60, 100]} />
              <Tooltip /><Legend />
              <Line dataKey="score" stroke={T.gold} strokeWidth={3} name="PRI Score" dot={{ r:5, fill:T.gold }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div style={{ marginTop:24, padding:16, background:T.navy+'08', border:`1px solid ${T.navy}20`, borderRadius:8 }}>
        <div style={{ fontFamily:T.mono, fontSize:11, color:T.navy, fontWeight:600, marginBottom:4 }}>REFERENCE DATA</div>
        <div style={{ fontSize:12, color:T.textSec, lineHeight:1.6 }}>
          PRI Annual Assessment Framework 2024 · CFA Institute ESG Integration Handbook · GSIA Global Sustainable Investment Review · Fama-French ESG Factor Model · MSCI ESG Research
        </div>
      </div>
    </div>
  );
}
