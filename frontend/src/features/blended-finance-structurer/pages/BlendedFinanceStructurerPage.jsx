import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';

const T = { bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb', orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a', font:"'DM Sans','SF Pro Display',system-ui,sans-serif", mono:"'JetBrains Mono','SF Mono','Fira Code',monospace" };
const TABS = ['Structure Builder','Tranche Designer','Risk-Return by Layer','DFI Catalytic Ratio','Impact-Financial Frontier','Deal Pipeline'];

const DEALS = [
  { name:'Saharan Solar Fund', type:'Renewable Energy', totalMn:250, firstLoss:25, mezzanine:75, senior:150, catalytic:6.0, irr:8.2, impact:85, stage:'Structuring' },
  { name:'Blue Carbon Trust', type:'Nature-Based', totalMn:120, firstLoss:20, mezzanine:40, senior:60, catalytic:4.0, irr:6.5, impact:92, stage:'Closed' },
  { name:'EM Adaptation Fund', type:'Adaptation Infra', totalMn:400, firstLoss:60, mezzanine:120, senior:220, catalytic:5.7, irr:7.8, impact:78, stage:'Fundraising' },
  { name:'E-Mobility Africa', type:'Clean Transport', totalMn:180, firstLoss:18, mezzanine:54, senior:108, catalytic:8.0, irr:9.5, impact:72, stage:'Structuring' },
  { name:'Green Retrofit EMEA', type:'Energy Efficiency', totalMn:320, firstLoss:32, mezzanine:96, senior:192, catalytic:8.0, irr:7.2, impact:82, stage:'Closed' },
];

const TRANCHES = [
  { layer:'First-Loss (DFI/Philanthropy)', returnPct:0, riskLevel:95, protectionPct:100 },
  { layer:'Mezzanine (Impact Investors)', returnPct:6.5, riskLevel:55, protectionPct:60 },
  { layer:'Senior (Commercial)', returnPct:4.2, riskLevel:15, protectionPct:0 },
];

const CATALYTIC_TREND = [
  { year:2020, ratio:3.2 },{ year:2021, ratio:3.8 },{ year:2022, ratio:4.5 },
  { year:2023, ratio:5.2 },{ year:2024, ratio:6.1 },{ year:2025, ratio:6.8 },
];

const FRONTIER_DATA = [
  { impact:95, financial:2.0 },{ impact:88, financial:4.5 },{ impact:82, financial:6.0 },
  { impact:75, financial:7.5 },{ impact:68, financial:8.2 },{ impact:55, financial:9.5 },
  { impact:42, financial:10.8 },
];

export default function BlendedFinanceStructurerPage() {
  const [tab, setTab] = useState(0);
  const [firstLossPct, setFirstLossPct] = useState(10);
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
              <span style={{ background:T.navy, color:'#fff', fontFamily:T.mono, fontSize:11, padding:'3px 10px', borderRadius:4 }}>EP-CQ3</span>
              <span style={{ fontFamily:T.mono, fontSize:11, color:T.textMut }}>BLENDED FINANCE STRUCTURER</span>
            </div>
            <h1 style={{ fontSize:22, fontWeight:700, color:T.navy, margin:'6px 0 2px' }}>Blended Finance Structuring Tool</h1>
            <p style={{ color:T.textSec, fontSize:13, margin:0 }}>Tranche design, catalytic ratios & impact-financial frontier</p>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => setWatchlist(!watchlist)} style={{ padding:'6px 14px', borderRadius:6, border:`1px solid ${watchlist?T.gold:T.border}`, background:watchlist?T.gold+'18':T.surface, color:T.navy, fontFamily:T.font, fontSize:12, cursor:'pointer' }}>{watchlist?'★ Watchlisted':'☆ Watchlist'}</button>
            <button style={{ padding:'6px 14px', borderRadius:6, border:`1px solid ${T.border}`, background:T.surface, color:T.navy, fontFamily:T.font, fontSize:12, cursor:'pointer' }}>⬇ Export</button>
            <button style={{ padding:'6px 14px', borderRadius:6, border:`1px solid ${T.border}`, background:T.surface, color:T.navy, fontFamily:T.font, fontSize:12, cursor:'pointer' }}>🔖 Bookmark</button>
          </div>
        </div>
      </div>

      <div style={{ display:'flex', gap:4, marginBottom:20, flexWrap:'wrap' }}>
        {TABS.map((t, i) => <button key={i} onClick={() => setTab(i)} style={{ padding:'8px 16px', borderRadius:6, border:`1px solid ${tab===i?T.gold:T.border}`, background:tab===i?T.gold+'18':T.surface, color:tab===i?T.navy:T.textSec, fontWeight:tab===i?600:400, fontFamily:T.font, fontSize:13, cursor:'pointer' }}>{t}</button>)}
      </div>

      {tab === 0 && (
        <div>
          <div style={{ display:'flex', gap:16, marginBottom:20, flexWrap:'wrap' }}>
            {card('Total Pipeline', '$' + (DEALS.reduce((s,d)=>s+d.totalMn,0)/1000).toFixed(2) + 'B', DEALS.length + ' deals', T.navy)}
            {card('Avg Catalytic Ratio', DEALS.reduce((s,d)=>s+d.catalytic,0)/DEALS.length + 'x', '$1 concessional', T.green)}
            {card('Closed Deals', DEALS.filter(d=>d.stage==='Closed').length.toString(), 'Successfully structured', T.gold)}
            {card('Avg Impact Score', Math.round(DEALS.reduce((s,d)=>s+d.impact,0)/DEALS.length)+'/100', 'Development impact', T.blue)}
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Deal Tranche Structure ($M)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={DEALS}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize:9, fontFamily:T.mono, angle:-15, textAnchor:'end' }} height={50} />
                <YAxis tick={{ fontSize:11, fontFamily:T.mono }} />
                <Tooltip /><Legend />
                <Bar dataKey="firstLoss" stackId="a" fill={T.red} name="First-Loss" />
                <Bar dataKey="mezzanine" stackId="a" fill={T.amber} name="Mezzanine" />
                <Bar dataKey="senior" stackId="a" fill={T.green} name="Senior" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
          <h3 style={{ fontSize:16, fontWeight:600, color:T.navy, marginBottom:16 }}>Interactive Tranche Sizer</h3>
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:12, color:T.textSec }}>First-Loss %: </label>
            <input type="range" min="5" max="25" value={firstLossPct} onChange={e => setFirstLossPct(Number(e.target.value))} />
            <span style={{ fontFamily:T.mono, fontSize:13, color:T.navy, marginLeft:8 }}>{firstLossPct}%</span>
          </div>
          <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
            {[{ name:'First-Loss', pct:firstLossPct, color:T.red, investor:'DFI / Philanthropy' },
              { name:'Mezzanine', pct:30, color:T.amber, investor:'Impact Investors' },
              { name:'Senior', pct:100-firstLossPct-30, color:T.green, investor:'Commercial Banks' }].map((t,i)=>(
              <div key={i} style={{ flex:1, minWidth:180, background:t.color+'10', border:`2px solid ${t.color}`, borderRadius:8, padding:16 }}>
                <div style={{ fontSize:16, fontWeight:700, color:t.color }}>{t.name}</div>
                <div style={{ fontSize:28, fontWeight:700, color:T.navy, marginTop:4 }}>{t.pct}%</div>
                <div style={{ fontSize:12, color:T.textSec, marginTop:4 }}>{t.investor}</div>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={240} style={{ marginTop:16 }}>
            <BarChart data={TRANCHES}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="layer" tick={{ fontSize:9, fontFamily:T.mono }}/><YAxis tick={{ fontSize:11, fontFamily:T.mono }}/>
              <Tooltip/><Legend/>
              <Bar dataKey="returnPct" fill={T.green} name="Expected Return %"/>
              <Bar dataKey="riskLevel" fill={T.red} name="Risk Level"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 2 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>IRR by Deal & Tranche Structure</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={DEALS}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="name" tick={{ fontSize:9, fontFamily:T.mono, angle:-15, textAnchor:'end' }} height={50}/>
              <YAxis tick={{ fontSize:11, fontFamily:T.mono }}/>
              <Tooltip/><Legend/>
              <Bar dataKey="irr" fill={T.gold} name="Blended IRR %"/>
              <Bar dataKey="catalytic" fill={T.navy} name="Catalytic Ratio (x)"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 3 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Catalytic Ratio Trend ($1 Concessional Mobilizes)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={CATALYTIC_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="year" tick={{ fontSize:11, fontFamily:T.mono }}/><YAxis tick={{ fontSize:11, fontFamily:T.mono }}/>
              <Tooltip/><Legend/>
              <Area type="monotone" dataKey="ratio" fill={T.green+'30'} stroke={T.green} strokeWidth={2} name="Catalytic Ratio (x)"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 4 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Impact-Financial Frontier</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={FRONTIER_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="financial" tick={{ fontSize:11, fontFamily:T.mono }} label={{ value:'Financial Return %', position:'bottom', style:{fontSize:11} }}/>
              <YAxis tick={{ fontSize:11, fontFamily:T.mono }} label={{ value:'Impact Score', angle:-90, position:'insideLeft', style:{fontSize:11} }}/>
              <Tooltip/><Legend/>
              <Line dataKey="impact" stroke={T.gold} strokeWidth={2} name="Impact Score" dot={{ r:5 }}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 5 && (
        <div>
          {DEALS.map((d,i)=>(
            <div key={i} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, marginBottom:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap' }}>
                <div>
                  <div style={{ fontWeight:600, color:T.navy, fontSize:15 }}>{d.name}</div>
                  <div style={{ fontFamily:T.mono, fontSize:11, color:T.textMut }}>{d.type} · ${d.totalMn}M · {d.catalytic}x catalytic</div>
                </div>
                <span style={{ padding:'4px 10px', borderRadius:4, fontSize:11, fontFamily:T.mono, background:d.stage==='Closed'?T.green+'18':d.stage==='Fundraising'?T.blue+'18':T.amber+'18', color:d.stage==='Closed'?T.green:d.stage==='Fundraising'?T.blue:T.amber }}>{d.stage}</span>
              </div>
              <div style={{ display:'flex', gap:16, marginTop:8 }}>
                <span style={{ fontFamily:T.mono, fontSize:11, color:T.green }}>IRR: {d.irr}%</span>
                <span style={{ fontFamily:T.mono, fontSize:11, color:T.navy }}>Impact: {d.impact}/100</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop:24, padding:16, background:T.navy+'08', border:`1px solid ${T.navy}20`, borderRadius:8 }}>
        <div style={{ fontFamily:T.mono, fontSize:11, color:T.navy, fontWeight:600, marginBottom:4 }}>REFERENCE DATA</div>
        <div style={{ fontSize:12, color:T.textSec, lineHeight:1.6 }}>
          Convergence Blended Finance Database · OECD DAC Blended Finance Principles · IFC Blended Finance Toolkit · World Bank Maximizing Finance for Development
        </div>
      </div>
    </div>
  );
}
