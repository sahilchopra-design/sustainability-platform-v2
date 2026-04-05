import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

const T = { bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb', orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a', font:"'DM Sans','SF Pro Display',system-ui,sans-serif", mono:"'JetBrains Mono','SF Mono','Fira Code',monospace" };
const TABS = ['Impact Bond Universe','Outcome Measurement','Social Return on Investment','Additionality Assessment','Impact Reporting','Investor Dashboard'];

const BONDS = [
  { name:'Peterborough SIB', type:'SIB', amount:5, sroi:3.2, outcomeActual:82, outcomeTarget:75, additionality:85, sector:'Criminal Justice', country:'UK' },
  { name:'DC Water EIB', type:'EIB', amount:25, sroi:2.8, outcomeActual:78, outcomeTarget:80, additionality:72, sector:'Water/Env', country:'USA' },
  { name:'IFFIm Vaccine Bond', type:'Development', amount:6500, sroi:4.5, outcomeActual:95, outcomeTarget:90, additionality:92, sector:'Health', country:'Global' },
  { name:'Educate Girls DIB', type:'DIB', amount:0.27, sroi:5.8, outcomeActual:116, outcomeTarget:100, additionality:88, sector:'Education', country:'India' },
  { name:'Village Enterprise DIB', type:'DIB', amount:1.8, sroi:4.2, outcomeActual:92, outcomeTarget:85, additionality:82, sector:'Poverty', country:'Uganda' },
  { name:'South Carolina Nurse SIB', type:'SIB', amount:17, sroi:3.5, outcomeActual:88, outcomeTarget:82, additionality:78, sector:'Health', country:'USA' },
  { name:'IBRD Sustainability Bond', type:'Sustainability', amount:3000, sroi:2.5, outcomeActual:72, outcomeTarget:70, additionality:68, sector:'Multi', country:'Global' },
  { name:'Cameroon Cataract Bond', type:'DIB', amount:2, sroi:6.2, outcomeActual:105, outcomeTarget:95, additionality:90, sector:'Health', country:'Cameroon' },
  { name:'Finland Wellbeing SIB', type:'SIB', amount:12, sroi:3.8, outcomeActual:85, outcomeTarget:80, additionality:75, sector:'Wellbeing', country:'Finland' },
  { name:'Chile Climate Bond', type:'Sustainability', amount:2000, sroi:2.2, outcomeActual:68, outcomeTarget:65, additionality:62, sector:'Climate', country:'Chile' },
  { name:'Colombia Peace Bond', type:'SIB', amount:8, sroi:4.0, outcomeActual:90, outcomeTarget:82, additionality:85, sector:'Peace', country:'Colombia' },
  { name:'UK Homelessness SIB', type:'SIB', amount:4.2, sroi:3.6, outcomeActual:86, outcomeTarget:80, additionality:80, sector:'Housing', country:'UK' },
  { name:'World Bank Green Bond', type:'Sustainability', amount:4500, sroi:2.0, outcomeActual:75, outcomeTarget:72, additionality:65, sector:'Climate', country:'Global' },
  { name:'India Swachh Bond', type:'Development', amount:150, sroi:3.0, outcomeActual:78, outcomeTarget:75, additionality:72, sector:'Sanitation', country:'India' },
  { name:'Kenya Education SIB', type:'DIB', amount:3.5, sroi:5.0, outcomeActual:98, outcomeTarget:90, additionality:88, sector:'Education', country:'Kenya' },
];

const SROI_DIMS = [
  { dim:'Social Value Created', score:82 },{ dim:'Cost Efficiency', score:75 },{ dim:'Beneficiary Reach', score:88 },
  { dim:'Outcome Sustainability', score:68 },{ dim:'Stakeholder Satisfaction', score:78 },{ dim:'Scalability', score:62 },
];

const TYPE_DIST = [{ name:'SIB', value:5 },{ name:'DIB', value:4 },{ name:'Sustainability', value:3 },{ name:'Development', value:2 },{ name:'EIB', value:1 }];
const TYPE_COLORS = [T.navy, T.green, T.gold, T.blue, T.teal];

export default function ImpactBondAnalyticsPage() {
  const [tab, setTab] = useState(0);
  const [typeFilter, setTypeFilter] = useState('All');
  const [watchlist, setWatchlist] = useState(false);

  const types = [...new Set(BONDS.map(b => b.type))];
  const filtered = typeFilter === 'All' ? BONDS : BONDS.filter(b => b.type === typeFilter);

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
              <span style={{ background:T.navy, color:'#fff', fontFamily:T.mono, fontSize:11, padding:'3px 10px', borderRadius:4 }}>EP-CQ6</span>
              <span style={{ fontFamily:T.mono, fontSize:11, color:T.textMut }}>IMPACT BOND ANALYTICS</span>
            </div>
            <h1 style={{ fontSize:22, fontWeight:700, color:T.navy, margin:'6px 0 2px' }}>Social & Sustainability Impact Bond Analytics</h1>
            <p style={{ color:T.textSec, fontSize:13, margin:0 }}>SROI calculation, outcome tracking & additionality assessment</p>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => setWatchlist(!watchlist)} style={{ padding:'6px 14px', borderRadius:6, border:`1px solid ${watchlist?T.gold:T.border}`, background:watchlist?T.gold+'18':T.surface, color:T.navy, fontFamily:T.font, fontSize:12, cursor:'pointer' }}>{watchlist?'★ Watchlisted':'☆ Watchlist'}</button>
            <button style={{ padding:'6px 14px', borderRadius:6, border:`1px solid ${T.border}`, background:T.surface, color:T.navy, fontFamily:T.font, fontSize:12, cursor:'pointer' }}>⬇ Export</button>
            <button style={{ padding:'6px 14px', borderRadius:6, border:`1px solid ${T.border}`, background:T.surface, color:T.navy, fontFamily:T.font, fontSize:12, cursor:'pointer' }}>🔖 Bookmark</button>
            <span style={{ padding:'6px 14px', borderRadius:6, background:T.teal+'15', color:T.teal, fontFamily:T.mono, fontSize:11 }}>👥 2 viewing</span>
          </div>
        </div>
      </div>

      <div style={{ display:'flex', gap:4, marginBottom:20, flexWrap:'wrap' }}>
        {TABS.map((t, i) => <button key={i} onClick={() => setTab(i)} style={{ padding:'8px 16px', borderRadius:6, border:`1px solid ${tab===i?T.gold:T.border}`, background:tab===i?T.gold+'18':T.surface, color:tab===i?T.navy:T.textSec, fontWeight:tab===i?600:400, fontFamily:T.font, fontSize:13, cursor:'pointer' }}>{t}</button>)}
      </div>

      <div style={{ marginBottom:12 }}>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ padding:'6px 12px', borderRadius:6, border:`1px solid ${T.border}`, fontFamily:T.font, fontSize:13 }}>
          <option value="All">All Types</option>{types.map(t=><option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {tab === 0 && (
        <div>
          <div style={{ display:'flex', gap:16, marginBottom:20, flexWrap:'wrap' }}>
            {card('Bonds Tracked', filtered.length.toString(), '5 instrument types', T.navy)}
            {card('Avg SROI', (filtered.reduce((s,b)=>s+b.sroi,0)/filtered.length).toFixed(1)+'x', 'Social value per $', T.green)}
            {card('Outcome Hit Rate', Math.round(filtered.filter(b=>b.outcomeActual>=b.outcomeTarget).length/filtered.length*100)+'%', 'Meeting targets', T.gold)}
            {card('Avg Additionality', Math.round(filtered.reduce((s,b)=>s+b.additionality,0)/filtered.length)+'/100', 'Impact beyond BAU', T.blue)}
          </div>
          <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
            <div style={{ flex:2, background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, minWidth:400 }}>
              <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>SROI by Bond</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={filtered.sort((a,b)=>b.sroi-a.sroi)}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{ fontSize:8, fontFamily:T.mono, angle:-25, textAnchor:'end' }} height={60}/><YAxis tick={{ fontSize:11, fontFamily:T.mono }}/><Tooltip/>
                  <Bar dataKey="sroi" name="SROI (x)">{filtered.sort((a,b)=>b.sroi-a.sroi).map((b,i)=><Cell key={i} fill={b.sroi>=4?T.green:b.sroi>=2.5?T.gold:T.amber}/>)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex:1, background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, minWidth:260 }}>
              <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Bond Type Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart><Pie data={TYPE_DIST} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>{TYPE_DIST.map((_,i)=><Cell key={i} fill={TYPE_COLORS[i]}/>)}</Pie><Tooltip/><Legend/></PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Actual vs Target Outcomes (%)</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={filtered}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{ fontSize:8, fontFamily:T.mono, angle:-25, textAnchor:'end' }} height={60}/><YAxis tick={{ fontSize:11, fontFamily:T.mono }}/><Tooltip/><Legend/>
              <Bar dataKey="outcomeTarget" fill={T.textMut} name="Target %"/>
              <Bar dataKey="outcomeActual" fill={T.green} name="Actual %"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 2 && (
        <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
          <div style={{ flex:1, background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, minWidth:300 }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>SROI Quality Dimensions</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={SROI_DIMS}><PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="dim" tick={{ fontSize:9, fontFamily:T.mono }}/><PolarRadiusAxis domain={[0,100]} tick={{ fontSize:9 }}/>
                <Radar dataKey="score" stroke={T.gold} fill={T.gold} fillOpacity={0.3}/><Tooltip/>
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ flex:1, background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, minWidth:300 }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>SROI Ratio Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={filtered.sort((a,b)=>b.sroi-a.sroi).slice(0,8)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" tick={{ fontSize:11, fontFamily:T.mono }}/><YAxis type="category" dataKey="name" width={150} tick={{ fontSize:9, fontFamily:T.mono }}/><Tooltip/>
                <Bar dataKey="sroi" fill={T.green} name="SROI (x)"/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 3 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Additionality Score by Bond</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={filtered.sort((a,b)=>b.additionality-a.additionality)}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{ fontSize:8, fontFamily:T.mono, angle:-25, textAnchor:'end' }} height={60}/><YAxis tick={{ fontSize:11, fontFamily:T.mono }} domain={[0,100]}/><Tooltip/>
              <Bar dataKey="additionality" name="Additionality Score">{filtered.sort((a,b)=>b.additionality-a.additionality).map((b,i)=><Cell key={i} fill={b.additionality>=80?T.green:b.additionality>=60?T.gold:T.amber}/>)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 4 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, overflowX:'auto' }}>
          <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Impact Reporting Summary</h3>
          <table style={{ width:'100%', borderCollapse:'collapse', minWidth:800 }}>
            <thead><tr>{['Bond','Type','Sector','Country','SROI','Outcome %','Additionality'].map(h=><th key={h} style={{ padding:'8px 12px', textAlign:'left', borderBottom:`2px solid ${T.border}`, fontFamily:T.mono, fontSize:11, color:T.navy }}>{h}</th>)}</tr></thead>
            <tbody>{filtered.map((b,i)=>(
              <tr key={i} style={{ borderBottom:`1px solid ${T.border}` }}>
                <td style={{ padding:'8px 12px', fontSize:13, fontWeight:600 }}>{b.name}</td>
                <td style={{ padding:'8px 12px', fontSize:13 }}>{b.type}</td>
                <td style={{ padding:'8px 12px', fontSize:13 }}>{b.sector}</td>
                <td style={{ padding:'8px 12px', fontSize:13 }}>{b.country}</td>
                <td style={{ padding:'8px 12px', fontFamily:T.mono, fontSize:13, color:T.green }}>{b.sroi}x</td>
                <td style={{ padding:'8px 12px', fontFamily:T.mono, fontSize:13, color:b.outcomeActual>=b.outcomeTarget?T.green:T.red }}>{b.outcomeActual}%</td>
                <td style={{ padding:'8px 12px', fontFamily:T.mono, fontSize:13 }}>{b.additionality}/100</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {tab === 5 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Investor Portfolio: SROI vs Additionality</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={filtered}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{ fontSize:8, fontFamily:T.mono, angle:-25, textAnchor:'end' }} height={60}/><YAxis tick={{ fontSize:11, fontFamily:T.mono }}/><Tooltip/><Legend/>
              <Bar dataKey="sroi" fill={T.gold} name="SROI (x)"/>
              <Bar dataKey="additionality" fill={T.navy} name="Additionality"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div style={{ marginTop:24, padding:16, background:T.navy+'08', border:`1px solid ${T.navy}20`, borderRadius:8 }}>
        <div style={{ fontFamily:T.mono, fontSize:11, color:T.navy, fontWeight:600, marginBottom:4 }}>REFERENCE DATA</div>
        <div style={{ fontSize:12, color:T.textSec, lineHeight:1.6 }}>
          Social Finance Global SIB Database · Global Impact Investing Network (GIIN) IRIS+ · ICMA Social Bond Principles · Brookings Global Impact Bond Database · OECD Social Impact Investment Reports
        </div>
      </div>
    </div>
  );
}
