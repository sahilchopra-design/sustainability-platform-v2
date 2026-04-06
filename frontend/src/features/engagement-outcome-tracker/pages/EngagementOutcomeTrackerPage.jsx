import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, AreaChart, Area } from 'recharts';

const T = { bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb', orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a', font:"'DM Sans','SF Pro Display',system-ui,sans-serif", mono:"'JetBrains Mono','SF Mono','Fira Code',monospace" };
const TABS = ['Engagement Dashboard','CA100+ Progress','Milestone Tracking','Escalation History','Collaborative Engagement','Impact Attribution'];

const ENGAGEMENTS = [
  { id:1, company:'Shell plc', sector:'Oil & Gas', status:'Active', milestone:'Action Taken', escalation:'Enhanced', ca100:true, nzScore:52, indicators:6 },
  { id:2, company:'TotalEnergies', sector:'Oil & Gas', status:'Active', milestone:'Commitment Made', escalation:'Dialogue', ca100:true, nzScore:48, indicators:5 },
  { id:3, company:'BP plc', sector:'Oil & Gas', status:'Active', milestone:'Verified', escalation:'Dialogue', ca100:true, nzScore:61, indicators:7 },
  { id:4, company:'Exxon Mobil', sector:'Oil & Gas', status:'Active', milestone:'Meeting Held', escalation:'Vote Against', ca100:true, nzScore:28, indicators:3 },
  { id:5, company:'Chevron', sector:'Oil & Gas', status:'Active', milestone:'Letter Sent', escalation:'Public Statement', ca100:true, nzScore:32, indicators:3 },
  { id:6, company:'Glencore', sector:'Mining', status:'Active', milestone:'Action Taken', escalation:'Enhanced', ca100:true, nzScore:55, indicators:6 },
  { id:7, company:'BHP Group', sector:'Mining', status:'Active', milestone:'Verified', escalation:'Dialogue', ca100:true, nzScore:68, indicators:8 },
  { id:8, company:'Rio Tinto', sector:'Mining', status:'Active', milestone:'Commitment Made', escalation:'Dialogue', ca100:true, nzScore:62, indicators:7 },
  { id:9, company:'ArcelorMittal', sector:'Steel', status:'Active', milestone:'Meeting Held', escalation:'Enhanced', ca100:true, nzScore:42, indicators:4 },
  { id:10, company:'HeidelbergCement', sector:'Cement', status:'Active', milestone:'Action Taken', escalation:'Dialogue', ca100:true, nzScore:58, indicators:6 },
  { id:11, company:'Volkswagen', sector:'Auto', status:'Active', milestone:'Commitment Made', escalation:'Dialogue', ca100:false, nzScore:65, indicators:7 },
  { id:12, company:'Samsung Elec.', sector:'Tech', status:'Active', milestone:'Letter Sent', escalation:'Dialogue', ca100:false, nzScore:38, indicators:4 },
  { id:13, company:'POSCO', sector:'Steel', status:'Active', milestone:'Meeting Held', escalation:'Enhanced', ca100:true, nzScore:35, indicators:3 },
  { id:14, company:'Holcim', sector:'Cement', status:'Closed', milestone:'Verified', escalation:'Dialogue', ca100:false, nzScore:72, indicators:8 },
  { id:15, company:'Duke Energy', sector:'Utilities', status:'Active', milestone:'Commitment Made', escalation:'Vote Against', ca100:true, nzScore:45, indicators:5 },
];

const MILESTONES_DIST = [{ name:'Letter Sent', value:2 },{ name:'Meeting Held', value:3 },{ name:'Commitment Made', value:4 },{ name:'Action Taken', value:3 },{ name:'Verified', value:3 }];
const MILESTONE_COLORS = [T.textMut, T.amber, T.blue, T.green, T.navy];

const ESCALATION_DIST = [{ name:'Dialogue', value:8 },{ name:'Enhanced', value:4 },{ name:'Vote Against', value:2 },{ name:'Public Statement', value:1 }];
const ESC_COLORS = [T.green, T.amber, T.orange, T.red];

const CA100_INDICATORS = [
  { indicator:'Net Zero by 2050', met:8, partial:3, notMet:4 },
  { indicator:'Short-term Targets', met:5, partial:5, notMet:5 },
  { indicator:'Capex Alignment', met:4, partial:4, notMet:7 },
  { indicator:'Scope 3 Disclosure', met:6, partial:4, notMet:5 },
  { indicator:'Lobbying Alignment', met:3, partial:3, notMet:9 },
  { indicator:'Just Transition Plan', met:2, partial:5, notMet:8 },
  { indicator:'TCFD Reporting', met:9, partial:4, notMet:2 },
  { indicator:'Board Oversight', met:7, partial:5, notMet:3 },
  { indicator:'Executive Remuneration', met:4, partial:6, notMet:5 },
  { indicator:'Methane Targets', met:5, partial:3, notMet:7 },
];

const COLLAB = [
  { initiative:'CA100+ Oil & Gas', partners:12, assetsAum:8.5, yearsActive:5 },
  { initiative:'IIGCC Net Zero', partners:8, assetsAum:12.2, yearsActive:3 },
  { initiative:'ShareAction Health', partners:15, assetsAum:4.8, yearsActive:4 },
  { initiative:'FAIRR Proteins', partners:10, assetsAum:6.1, yearsActive:6 },
  { initiative:'CDP Non-Disclosure', partners:20, assetsAum:18.5, yearsActive:8 },
];

export default function EngagementOutcomeTrackerPage() {
  const [tab, setTab] = useState(0);
  const [sectorFilter, setSectorFilter] = useState('All');
  const [watchlist, setWatchlist] = useState(false);

  const sectors = [...new Set(ENGAGEMENTS.map(e => e.sector))];
  const filtered = useMemo(() => sectorFilter === 'All' ? ENGAGEMENTS : ENGAGEMENTS.filter(e => e.sector === sectorFilter), [sectorFilter]);

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
              <span style={{ background:T.navy, color:'#fff', fontFamily:T.mono, fontSize:11, padding:'3px 10px', borderRadius:4 }}>EP-CP1</span>
              <span style={{ fontFamily:T.mono, fontSize:11, color:T.textMut }}>ENGAGEMENT OUTCOME TRACKER</span>
            </div>
            <h1 style={{ fontSize:22, fontWeight:700, color:T.navy, margin:'6px 0 2px' }}>Engagement Outcome Tracker</h1>
            <p style={{ color:T.textSec, fontSize:13, margin:0 }}>30 engagements across 20 companies with CA100+ benchmark tracking</p>
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

      <div style={{ marginBottom:12 }}>
        <select value={sectorFilter} onChange={e => setSectorFilter(e.target.value)} style={{ padding:'6px 12px', borderRadius:6, border:`1px solid ${T.border}`, fontFamily:T.font, fontSize:13 }}>
          <option value="All">All Sectors</option>
          {sectors.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {tab === 0 && (
        <div>
          <div style={{ display:'flex', gap:16, marginBottom:20, flexWrap:'wrap' }}>
            {card('Active Engagements', ENGAGEMENTS.filter(e => e.status === 'Active').length, 'Across ' + sectors.length + ' sectors', T.navy)}
            {card('CA100+ Companies', ENGAGEMENTS.filter(e => e.ca100).length, 'Focus companies', T.green)}
            {card('Verified Outcomes', ENGAGEMENTS.filter(e => e.milestone === 'Verified').length, 'Confirmed actions', T.gold)}
            {card('Avg NZ Score', filtered.length ? Math.round(filtered.reduce((s, e) => s + e.nzScore, 0) / filtered.length) : 0, 'Net Zero benchmark', T.blue)}
          </div>
          <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
            <div style={{ flex:1, background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, minWidth:300 }}>
              <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Milestone Distribution</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart><Pie data={MILESTONES_DIST} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>{MILESTONES_DIST.map((_, i) => <Cell key={i} fill={MILESTONE_COLORS[i]} />)}</Pie><Tooltip /><Legend /></PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex:1, background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, minWidth:300 }}>
              <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Escalation Status</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart><Pie data={ESCALATION_DIST} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>{ESCALATION_DIST.map((_, i) => <Cell key={i} fill={ESC_COLORS[i]} />)}</Pie><Tooltip /><Legend /></PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>CA100+ Net Zero Benchmark (10 Indicators)</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={CA100_INDICATORS} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{ fontSize:11, fontFamily:T.mono }} />
              <YAxis type="category" dataKey="indicator" width={150} tick={{ fontSize:9, fontFamily:T.mono }} />
              <Tooltip /><Legend />
              <Bar dataKey="met" stackId="a" fill={T.green} name="Met" />
              <Bar dataKey="partial" stackId="a" fill={T.amber} name="Partial" />
              <Bar dataKey="notMet" stackId="a" fill={T.red} name="Not Met" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 2 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, overflowX:'auto' }}>
          <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Engagement Milestones</h3>
          <table style={{ width:'100%', borderCollapse:'collapse', minWidth:800 }}>
            <thead><tr>{['Company','Sector','CA100+','Milestone','Escalation','NZ Score','Indicators Met'].map(h => <th key={h} style={{ padding:'8px 12px', textAlign:'left', borderBottom:`2px solid ${T.border}`, fontFamily:T.mono, fontSize:11, color:T.navy }}>{h}</th>)}</tr></thead>
            <tbody>{filtered.map((e, i) => (
              <tr key={i} style={{ borderBottom:`1px solid ${T.border}`, background:i%2===0?'transparent':T.bg }}>
                <td style={{ padding:'8px 12px', fontSize:13, fontWeight:600 }}>{e.company}</td>
                <td style={{ padding:'8px 12px', fontSize:13 }}>{e.sector}</td>
                <td style={{ padding:'8px 12px', fontSize:13 }}>{e.ca100 ? '✓' : '—'}</td>
                <td style={{ padding:'8px 12px' }}><span style={{ padding:'2px 8px', borderRadius:4, fontSize:11, fontFamily:T.mono, background:e.milestone==='Verified'?T.green+'18':e.milestone==='Action Taken'?T.blue+'18':T.amber+'18', color:e.milestone==='Verified'?T.green:e.milestone==='Action Taken'?T.blue:T.amber }}>{e.milestone}</span></td>
                <td style={{ padding:'8px 12px' }}><span style={{ padding:'2px 8px', borderRadius:4, fontSize:11, fontFamily:T.mono, background:e.escalation==='Dialogue'?T.green+'18':e.escalation==='Enhanced'?T.amber+'18':T.red+'18', color:e.escalation==='Dialogue'?T.green:e.escalation==='Enhanced'?T.amber:T.red }}>{e.escalation}</span></td>
                <td style={{ padding:'8px 12px', fontFamily:T.mono, fontSize:13, color:e.nzScore>=60?T.green:e.nzScore>=40?T.amber:T.red }}>{e.nzScore}/100</td>
                <td style={{ padding:'8px 12px', fontFamily:T.mono, fontSize:13 }}>{e.indicators}/10</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {tab === 3 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>NZ Score by Escalation Level</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={filtered.sort((a, b) => a.nzScore - b.nzScore)}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="company" tick={{ fontSize:9, fontFamily:T.mono, angle:-25, textAnchor:'end' }} height={60} />
              <YAxis tick={{ fontSize:11, fontFamily:T.mono }} domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="nzScore" name="NZ Score">{filtered.sort((a, b) => a.nzScore - b.nzScore).map((e, i) => <Cell key={i} fill={e.escalation==='Dialogue'?T.green:e.escalation==='Enhanced'?T.amber:T.red} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 4 && (
        <div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, marginBottom:16 }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Collaborative Initiatives: Partners & AUM ($T)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={COLLAB}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="initiative" tick={{ fontSize:9, fontFamily:T.mono, angle:-15, textAnchor:'end' }} height={50} />
                <YAxis yAxisId="left" tick={{ fontSize:11, fontFamily:T.mono }} /><YAxis yAxisId="right" orientation="right" tick={{ fontSize:11, fontFamily:T.mono }} />
                <Tooltip /><Legend />
                <Bar yAxisId="left" dataKey="partners" fill={T.navy} name="Partners" />
                <Bar yAxisId="right" dataKey="assetsAum" fill={T.gold} name="AUM ($T)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(250px, 1fr))', gap:12 }}>
            {COLLAB.map((c, i) => (
              <div key={i} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:14 }}>
                <div style={{ fontWeight:600, color:T.navy, fontSize:14 }}>{c.initiative}</div>
                <div style={{ fontFamily:T.mono, fontSize:11, color:T.textMut, marginTop:4 }}>{c.partners} partners · ${c.assetsAum}T AUM · {c.yearsActive} years</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 5 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Indicators Met by Company</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={filtered.sort((a, b) => b.indicators - a.indicators)}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="company" tick={{ fontSize:9, fontFamily:T.mono, angle:-25, textAnchor:'end' }} height={60} />
              <YAxis tick={{ fontSize:11, fontFamily:T.mono }} domain={[0, 10]} />
              <Tooltip />
              <Bar dataKey="indicators" name="Indicators Met (of 10)">{filtered.map((e, i) => <Cell key={i} fill={e.indicators >= 7 ? T.green : e.indicators >= 4 ? T.amber : T.red} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div style={{ marginTop:24, padding:16, background:T.navy+'08', border:`1px solid ${T.navy}20`, borderRadius:8 }}>
        <div style={{ fontFamily:T.mono, fontSize:11, color:T.navy, fontWeight:600, marginBottom:4 }}>REFERENCE DATA</div>
        <div style={{ fontSize:12, color:T.textSec, lineHeight:1.6 }}>
          Climate Action 100+ Net Zero Company Benchmark · IIGCC Net Zero Stewardship Toolkit · PRI Stewardship Guides · ShareAction Voting Matters Report · Transition Pathway Initiative (TPI) Assessments
        </div>
      </div>
    </div>
  );
}
