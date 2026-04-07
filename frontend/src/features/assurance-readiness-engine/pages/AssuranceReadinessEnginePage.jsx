import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const T = { bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb', orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a', card:'#ffffff',sub:'#5c6b7e',indigo:'#4f46e5',font:"'DM Sans','SF Pro Display',system-ui,sans-serif", mono:"'JetBrains Mono','SF Mono','Fira Code',monospace" };
const TABS = ['Readiness Dashboard','ISAE 3000/3410 Checklist','Evidence Strength Scoring','Control Testing','Audit Trail Completeness','Assurance Provider Comparison'];

const READINESS = [
  { dimension:'Evidence Availability', score:72 },{ dimension:'Internal Controls', score:65 },{ dimension:'Data Lineage', score:58 },
  { dimension:'Methodology Documentation', score:78 },{ dimension:'Process Maturity', score:68 },{ dimension:'Third-Party Verification', score:52 },
  { dimension:'IT Systems', score:62 },
];

const CHECKLIST = [
  { item:'Management assertion documented', category:'ISAE 3000', status:'Complete', strength:88 },
  { item:'Criteria clearly defined', category:'ISAE 3000', status:'Complete', strength:85 },
  { item:'Evidence sufficient & appropriate', category:'ISAE 3000', status:'In Progress', strength:62 },
  { item:'Internal controls tested', category:'ISAE 3000', status:'In Progress', strength:55 },
  { item:'GHG inventory boundary defined', category:'ISAE 3410', status:'Complete', strength:82 },
  { item:'Scope 1 calculations verified', category:'ISAE 3410', status:'Complete', strength:90 },
  { item:'Scope 2 methodology documented', category:'ISAE 3410', status:'Complete', strength:85 },
  { item:'Scope 3 categories assessed', category:'ISAE 3410', status:'In Progress', strength:48 },
  { item:'Emission factors sourced', category:'ISAE 3410', status:'Complete', strength:88 },
  { item:'Uncertainty analysis performed', category:'ISAE 3410', status:'Draft', strength:32 },
  { item:'Restatement policy documented', category:'ISAE 3000', status:'Draft', strength:35 },
  { item:'Materiality threshold defined', category:'ISAE 3000', status:'Complete', strength:80 },
];

const ASSURANCE_LEVELS = [
  { level:'Limited Assurance', evidence:60, controls:50, documentation:65, cost:85 },
  { level:'Reasonable Assurance', evidence:90, controls:85, documentation:92, cost:250 },
];

const PROVIDERS = [
  { name:'Deloitte', type:'Big 4', experience:95, coverage:92, avgCostK:280, specialization:85 },
  { name:'PwC', type:'Big 4', experience:92, coverage:90, avgCostK:265, specialization:88 },
  { name:'EY', type:'Big 4', experience:90, coverage:88, avgCostK:255, specialization:82 },
  { name:'KPMG', type:'Big 4', experience:88, coverage:85, avgCostK:245, specialization:80 },
  { name:'Bureau Veritas', type:'Specialist', experience:82, coverage:78, avgCostK:145, specialization:92 },
  { name:'SGS', type:'Specialist', experience:80, coverage:75, avgCostK:135, specialization:90 },
  { name:'DNV', type:'Specialist', experience:85, coverage:80, avgCostK:155, specialization:95 },
];

const TRAIL = [
  { area:'Scope 1 Emissions', completeness:92, gaps:1, lastUpdated:'2025-03-15' },
  { area:'Scope 2 Emissions', completeness:88, gaps:2, lastUpdated:'2025-03-15' },
  { area:'Scope 3 Emissions', completeness:45, gaps:8, lastUpdated:'2025-02-28' },
  { area:'Energy Consumption', completeness:85, gaps:2, lastUpdated:'2025-03-10' },
  { area:'Water Usage', completeness:62, gaps:5, lastUpdated:'2025-01-31' },
  { area:'Waste Generation', completeness:55, gaps:6, lastUpdated:'2025-02-15' },
];

export default function AssuranceReadinessEnginePage() {
  const [tab, setTab] = useState(0);
  const [watchlist, setWatchlist] = useState(false);

  const overallScore = Math.round(READINESS.reduce((s,r)=>s+r.score,0)/READINESS.length);

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
              <span style={{ background:T.navy, color:'#fff', fontFamily:T.mono, fontSize:11, padding:'3px 10px', borderRadius:4 }}>EP-CR3</span>
              <span style={{ fontFamily:T.mono, fontSize:11, color:T.textMut }}>ASSURANCE READINESS ENGINE</span>
            </div>
            <h1 style={{ fontSize:22, fontWeight:700, color:T.navy, margin:'6px 0 2px' }}>Assurance Readiness Assessment</h1>
            <p style={{ color:T.textSec, fontSize:13, margin:0 }}>ISAE 3000/3410 checklist, evidence scoring & provider comparison</p>
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
            {card('Overall Readiness', overallScore+'/100', overallScore>=70?'Ready for limited':'Needs work', overallScore>=70?T.green:T.amber)}
            {card('Checklist Items', CHECKLIST.length.toString(), CHECKLIST.filter(c=>c.status==='Complete').length+' complete', T.navy)}
            {card('Audit Trail Gaps', TRAIL.reduce((s,t)=>s+t.gaps,0).toString(), 'Across '+TRAIL.length+' areas', T.red)}
            {card('Target Level', 'Limited', 'Moving to Reasonable 2026', T.gold)}
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Readiness by Dimension</h3>
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={READINESS}><PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="dimension" tick={{ fontSize:9, fontFamily:T.mono }}/><PolarRadiusAxis domain={[0,100]} tick={{ fontSize:9 }}/>
                <Radar dataKey="score" stroke={T.gold} fill={T.gold} fillOpacity={0.3}/><Tooltip/>
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, overflowX:'auto' }}>
          <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>ISAE 3000/3410 Checklist</h3>
          <table style={{ width:'100%', borderCollapse:'collapse', minWidth:700 }}>
            <thead><tr>{['Item','Standard','Status','Strength'].map(h=><th key={h} style={{ padding:'8px 12px', textAlign:'left', borderBottom:`2px solid ${T.border}`, fontFamily:T.mono, fontSize:11, color:T.navy }}>{h}</th>)}</tr></thead>
            <tbody>{CHECKLIST.map((c,i)=>(
              <tr key={i} style={{ borderBottom:`1px solid ${T.border}` }}>
                <td style={{ padding:'8px 12px', fontSize:13 }}>{c.item}</td>
                <td style={{ padding:'8px 12px', fontFamily:T.mono, fontSize:11 }}>{c.category}</td>
                <td style={{ padding:'8px 12px' }}><span style={{ padding:'2px 8px', borderRadius:4, fontSize:11, fontFamily:T.mono, background:c.status==='Complete'?T.green+'18':c.status==='In Progress'?T.blue+'18':T.amber+'18', color:c.status==='Complete'?T.green:c.status==='In Progress'?T.blue:T.amber }}>{c.status}</span></td>
                <td style={{ padding:'8px 12px' }}><div style={{ display:'flex', alignItems:'center', gap:8 }}><div style={{ flex:1, height:8, background:T.border, borderRadius:4, maxWidth:120 }}><div style={{ width:c.strength+'%', height:'100%', background:c.strength>=75?T.green:c.strength>=50?T.amber:T.red, borderRadius:4 }}/></div><span style={{ fontFamily:T.mono, fontSize:11 }}>{c.strength}%</span></div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {tab === 2 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Evidence Strength by Checklist Item</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={CHECKLIST} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" domain={[0,100]} tick={{ fontSize:11, fontFamily:T.mono }}/><YAxis type="category" dataKey="item" width={220} tick={{ fontSize:8, fontFamily:T.mono }}/><Tooltip/>
              <Bar dataKey="strength" name="Strength %">{CHECKLIST.map((c,i)=><Cell key={i} fill={c.strength>=75?T.green:c.strength>=50?T.amber:T.red}/>)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 3 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Limited vs Reasonable Assurance Requirements</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ASSURANCE_LEVELS}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="level" tick={{ fontSize:11, fontFamily:T.mono }}/><YAxis tick={{ fontSize:11, fontFamily:T.mono }}/><Tooltip/><Legend/>
              <Bar dataKey="evidence" fill={T.navy} name="Evidence Required %"/>
              <Bar dataKey="controls" fill={T.gold} name="Controls Required %"/>
              <Bar dataKey="documentation" fill={T.green} name="Documentation %"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 4 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Audit Trail Completeness by Area</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={TRAIL}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="area" tick={{ fontSize:9, fontFamily:T.mono, angle:-15, textAnchor:'end' }} height={50}/><YAxis tick={{ fontSize:11, fontFamily:T.mono }} domain={[0,100]}/><Tooltip/><Legend/>
              <Bar dataKey="completeness" fill={T.green} name="Completeness %"/>
              <Bar dataKey="gaps" fill={T.red} name="# Gaps"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 5 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Assurance Provider Comparison</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={PROVIDERS}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{ fontSize:10, fontFamily:T.mono }}/><YAxis tick={{ fontSize:11, fontFamily:T.mono }}/><Tooltip/><Legend/>
              <Bar dataKey="experience" fill={T.navy} name="Experience"/>
              <Bar dataKey="specialization" fill={T.gold} name="ESG Specialization"/>
              <Bar dataKey="coverage" fill={T.green} name="Coverage"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div style={{ marginTop:24, padding:16, background:T.navy+'08', border:`1px solid ${T.navy}20`, borderRadius:8 }}>
        <div style={{ fontFamily:T.mono, fontSize:11, color:T.navy, fontWeight:600, marginBottom:4 }}>REFERENCE DATA</div>
        <div style={{ fontSize:12, color:T.textSec, lineHeight:1.6 }}>
          ISAE 3000 (Revised) · ISAE 3410 GHG Statements · IAASB Sustainability Assurance Standards (ISSA 5000) · CSRD Assurance Requirements · Accountancy Europe Sustainability Assurance Guide
        </div>
      </div>
    </div>
  );
}
