import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const T = { bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb', orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a', font:"'DM Sans','SF Pro Display',system-ui,sans-serif", mono:"'JetBrains Mono','SF Mono','Fira Code',monospace" };
const TABS = ['ESRS Overview','E1 Climate Change','E2 Pollution','E3 Water & Marine','E4 Biodiversity','E5 Circular Economy'];

const ESRS_OVERVIEW = [
  { standard:'E1 Climate', drs:12, datapoints:40, complete:68, financial:75, impact:82 },
  { standard:'E2 Pollution', drs:6, datapoints:18, complete:42, financial:55, impact:62 },
  { standard:'E3 Water', drs:5, datapoints:15, complete:38, financial:48, impact:58 },
  { standard:'E4 Biodiversity', drs:6, datapoints:22, complete:28, financial:42, impact:55 },
  { standard:'E5 Circular', drs:6, datapoints:20, complete:35, financial:50, impact:52 },
];

const E1_DRS = [
  { dr:'E1-1 Transition Plan', status:'Complete', score:85 },{ dr:'E1-2 Policies', status:'Complete', score:82 },
  { dr:'E1-3 Actions', status:'Complete', score:78 },{ dr:'E1-4 Targets', status:'In Progress', score:65 },
  { dr:'E1-5 Energy Consumption', status:'Complete', score:90 },{ dr:'E1-6 GHG Emissions (S1+S2)', status:'Complete', score:88 },
  { dr:'E1-7 GHG Removals', status:'In Progress', score:55 },{ dr:'E1-8 Internal Carbon Pricing', status:'Draft', score:42 },
  { dr:'E1-9 Financial Effects', status:'In Progress', score:60 },
];

const E2_DRS = [
  { dr:'E2-1 Policies', status:'Draft', score:45 },{ dr:'E2-2 Actions', status:'Draft', score:38 },
  { dr:'E2-3 Targets', status:'Not Started', score:15 },{ dr:'E2-4 Pollutants', status:'In Progress', score:52 },
  { dr:'E2-5 Substances of Concern', status:'Draft', score:35 },{ dr:'E2-6 Financial Effects', status:'Not Started', score:10 },
];

const E3_DRS = [
  { dr:'E3-1 Policies', status:'Draft', score:40 },{ dr:'E3-2 Actions', status:'Draft', score:35 },
  { dr:'E3-3 Targets', status:'Not Started', score:12 },{ dr:'E3-4 Water Consumption', status:'In Progress', score:48 },
  { dr:'E3-5 Financial Effects', status:'Not Started', score:8 },
];

const E4_DRS = [
  { dr:'E4-1 Transition Plan', status:'Not Started', score:10 },{ dr:'E4-2 Policies', status:'Draft', score:28 },
  { dr:'E4-3 Actions', status:'Not Started', score:15 },{ dr:'E4-4 Targets', status:'Not Started', score:8 },
  { dr:'E4-5 Impact Metrics', status:'Draft', score:32 },{ dr:'E4-6 Financial Effects', status:'Not Started', score:5 },
];

const E5_DRS = [
  { dr:'E5-1 Policies', status:'Draft', score:38 },{ dr:'E5-2 Actions', status:'Draft', score:32 },
  { dr:'E5-3 Targets', status:'Not Started', score:12 },{ dr:'E5-4 Resource Inflows', status:'In Progress', score:42 },
  { dr:'E5-5 Resource Outflows', status:'Draft', score:35 },{ dr:'E5-6 Financial Effects', status:'Not Started', score:8 },
];

const STATUS_COLORS = { 'Complete':T.green, 'In Progress':T.blue, 'Draft':T.amber, 'Not Started':T.red };

const renderDRTab = (drs, title) => (
  <div>
    <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, marginBottom:16 }}>
      <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>{title} — Disclosure Requirements</h3>
      <ResponsiveContainer width="100%" height={Math.max(250, drs.length * 35)}>
        <BarChart data={drs} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" domain={[0,100]} tick={{ fontSize:11, fontFamily:T.mono }}/><YAxis type="category" dataKey="dr" width={200} tick={{ fontSize:9, fontFamily:T.mono }}/><Tooltip/>
          <Bar dataKey="score" name="Completeness %">{drs.map((d,i)=><Cell key={i} fill={STATUS_COLORS[d.status]||T.textMut}/>)}</Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
    <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, overflowX:'auto' }}>
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead><tr>{['Disclosure Requirement','Status','Completeness'].map(h=><th key={h} style={{ padding:'8px 12px', textAlign:'left', borderBottom:`2px solid ${T.border}`, fontFamily:T.mono, fontSize:11, color:T.navy }}>{h}</th>)}</tr></thead>
        <tbody>{drs.map((d,i)=>(
          <tr key={i} style={{ borderBottom:`1px solid ${T.border}` }}>
            <td style={{ padding:'8px 12px', fontSize:13, fontWeight:600 }}>{d.dr}</td>
            <td style={{ padding:'8px 12px' }}><span style={{ padding:'2px 8px', borderRadius:4, fontSize:11, fontFamily:T.mono, background:(STATUS_COLORS[d.status]||T.textMut)+'18', color:STATUS_COLORS[d.status]||T.textMut }}>{d.status}</span></td>
            <td style={{ padding:'8px 12px' }}><div style={{ display:'flex', alignItems:'center', gap:8 }}><div style={{ flex:1, height:8, background:T.border, borderRadius:4, maxWidth:200 }}><div style={{ width:d.score+'%', height:'100%', background:STATUS_COLORS[d.status]||T.textMut, borderRadius:4 }}/></div><span style={{ fontFamily:T.mono, fontSize:11 }}>{d.score}%</span></div></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  </div>
);

export default function CsrdEsrsFullSuitePage() {
  const [tab, setTab] = useState(0);
  const [watchlist, setWatchlist] = useState(false);

  const totalDrs = ESRS_OVERVIEW.reduce((s,e)=>s+e.drs,0);
  const totalDps = ESRS_OVERVIEW.reduce((s,e)=>s+e.datapoints,0);
  const avgComplete = Math.round(ESRS_OVERVIEW.reduce((s,e)=>s+e.complete,0)/ESRS_OVERVIEW.length);

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
              <span style={{ background:T.navy, color:'#fff', fontFamily:T.mono, fontSize:11, padding:'3px 10px', borderRadius:4 }}>EP-CR1</span>
              <span style={{ fontFamily:T.mono, fontSize:11, color:T.textMut }}>CSRD ESRS FULL SUITE</span>
            </div>
            <h1 style={{ fontSize:22, fontWeight:700, color:T.navy, margin:'6px 0 2px' }}>CSRD ESRS E1-E5 Double Materiality Suite</h1>
            <p style={{ color:T.textSec, fontSize:13, margin:0 }}>{totalDrs} disclosure requirements · {totalDps} datapoints · Double materiality IRO assessment</p>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => setWatchlist(!watchlist)} style={{ padding:'6px 14px', borderRadius:6, border:`1px solid ${watchlist?T.gold:T.border}`, background:watchlist?T.gold+'18':T.surface, color:T.navy, fontFamily:T.font, fontSize:12, cursor:'pointer' }}>{watchlist?'★ Watchlisted':'☆ Watchlist'}</button>
            <button style={{ padding:'6px 14px', borderRadius:6, border:`1px solid ${T.border}`, background:T.surface, color:T.navy, fontFamily:T.font, fontSize:12, cursor:'pointer' }}>⬇ Export</button>
            <button style={{ padding:'6px 14px', borderRadius:6, border:`1px solid ${T.border}`, background:T.surface, color:T.navy, fontFamily:T.font, fontSize:12, cursor:'pointer' }}>🔖 Bookmark</button>
            <span style={{ padding:'6px 14px', borderRadius:6, background:T.teal+'15', color:T.teal, fontFamily:T.mono, fontSize:11 }}>👥 6 viewing</span>
          </div>
        </div>
      </div>

      <div style={{ display:'flex', gap:4, marginBottom:20, flexWrap:'wrap' }}>
        {TABS.map((t, i) => <button key={i} onClick={() => setTab(i)} style={{ padding:'8px 16px', borderRadius:6, border:`1px solid ${tab===i?T.gold:T.border}`, background:tab===i?T.gold+'18':T.surface, color:tab===i?T.navy:T.textSec, fontWeight:tab===i?600:400, fontFamily:T.font, fontSize:13, cursor:'pointer' }}>{t}</button>)}
      </div>

      {tab === 0 && (
        <div>
          <div style={{ display:'flex', gap:16, marginBottom:20, flexWrap:'wrap' }}>
            {card('Total DRs', totalDrs.toString(), 'Across E1-E5', T.navy)}
            {card('Datapoints', totalDps.toString(), 'Required disclosures', T.gold)}
            {card('Avg Completeness', avgComplete+'%', 'Across all standards', avgComplete>=60?T.green:T.amber)}
            {card('E1 Climate', ESRS_OVERVIEW[0].complete+'%', 'Most complete', T.blue)}
          </div>
          <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
            <div style={{ flex:1, background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, minWidth:350 }}>
              <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Completeness by Standard</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={ESRS_OVERVIEW}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="standard" tick={{ fontSize:10, fontFamily:T.mono }}/><YAxis tick={{ fontSize:11, fontFamily:T.mono }} domain={[0,100]}/><Tooltip/>
                  <Bar dataKey="complete" name="Completeness %">{ESRS_OVERVIEW.map((e,i)=><Cell key={i} fill={e.complete>=60?T.green:e.complete>=35?T.amber:T.red}/>)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex:1, background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, minWidth:300 }}>
              <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Double Materiality: Financial vs Impact</h3>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={ESRS_OVERVIEW}><PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="standard" tick={{ fontSize:9, fontFamily:T.mono }}/><PolarRadiusAxis domain={[0,100]} tick={{ fontSize:9 }}/>
                  <Radar dataKey="financial" stroke={T.navy} fill={T.navy} fillOpacity={0.2} name="Financial Materiality"/>
                  <Radar dataKey="impact" stroke={T.green} fill={T.green} fillOpacity={0.2} name="Impact Materiality"/>
                  <Tooltip/><Legend/>
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 1 && renderDRTab(E1_DRS, 'ESRS E1 — Climate Change')}
      {tab === 2 && renderDRTab(E2_DRS, 'ESRS E2 — Pollution')}
      {tab === 3 && renderDRTab(E3_DRS, 'ESRS E3 — Water & Marine Resources')}
      {tab === 4 && renderDRTab(E4_DRS, 'ESRS E4 — Biodiversity & Ecosystems')}
      {tab === 5 && renderDRTab(E5_DRS, 'ESRS E5 — Circular Economy')}

      <div style={{ marginTop:24, padding:16, background:T.navy+'08', border:`1px solid ${T.navy}20`, borderRadius:8 }}>
        <div style={{ fontFamily:T.mono, fontSize:11, color:T.navy, fontWeight:600, marginBottom:4 }}>REFERENCE DATA</div>
        <div style={{ fontSize:12, color:T.textSec, lineHeight:1.6 }}>
          EFRAG ESRS Standards (2023) · EU Corporate Sustainability Reporting Directive 2022/2464 · ESRS Implementation Guidance · Double Materiality Assessment (EFRAG IG-1)
        </div>
      </div>
    </div>
  );
}
