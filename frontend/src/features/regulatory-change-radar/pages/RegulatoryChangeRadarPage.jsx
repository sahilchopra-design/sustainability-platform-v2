import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';

const T = { bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb', orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a', font:"'DM Sans','SF Pro Display',system-ui,sans-serif", mono:"'JetBrains Mono','SF Mono','Fira Code',monospace" };
const TABS = ['Radar Dashboard','Active Consultations','Upcoming Effective Dates','Impact Assessment','Response Tracker','Regulatory Intelligence Feed'];

const CHANGES = [
  { id:1, title:'CSRD Wave 2 Implementation', jurisdiction:'EU', status:'Effective', impact:'High', modulesAffected:8, deadline:'2025-01-01', category:'Disclosure' },
  { id:2, title:'SEC Climate Disclosure (Stayed)', jurisdiction:'US', status:'Stayed', impact:'High', modulesAffected:5, deadline:'2025-06-30', category:'Disclosure' },
  { id:3, title:'ISSB S2 Adoption (Australia)', jurisdiction:'AU', status:'Effective', impact:'Medium', modulesAffected:4, deadline:'2025-07-01', category:'Disclosure' },
  { id:4, title:'EU CBAM Phase 2', jurisdiction:'EU', status:'Upcoming', impact:'High', modulesAffected:6, deadline:'2026-01-01', category:'Carbon Pricing' },
  { id:5, title:'UK TPT Framework Mandatory', jurisdiction:'UK', status:'Consultation', impact:'Medium', modulesAffected:3, deadline:'2026-04-01', category:'Transition Planning' },
  { id:6, title:'EU Deforestation Regulation', jurisdiction:'EU', status:'Effective', impact:'Medium', modulesAffected:4, deadline:'2025-01-01', category:'Supply Chain' },
  { id:7, title:'SSBJ Standards Final', jurisdiction:'JP', status:'Upcoming', impact:'Medium', modulesAffected:3, deadline:'2025-04-01', category:'Disclosure' },
  { id:8, title:'HKEX Enhanced ESG Guide', jurisdiction:'HK', status:'Effective', impact:'Medium', modulesAffected:3, deadline:'2025-01-01', category:'Disclosure' },
  { id:9, title:'EU Green Claims Directive', jurisdiction:'EU', status:'Consultation', impact:'Medium', modulesAffected:5, deadline:'2026-06-01', category:'Marketing' },
  { id:10, title:'Basel III.1 Climate Risk', jurisdiction:'Global', status:'Upcoming', impact:'High', modulesAffected:7, deadline:'2025-07-01', category:'Risk Management' },
];

const CONSULTATIONS = [
  { title:'UK TPT Mandatory Disclosure', jurisdiction:'UK', closeDate:'2025-06-30', responded:true },
  { title:'EU Green Claims Directive', jurisdiction:'EU', closeDate:'2025-09-15', responded:false },
  { title:'MAS Climate Stress Test', jurisdiction:'SG', closeDate:'2025-07-31', responded:false },
  { title:'APRA CPG 229 Update', jurisdiction:'AU', closeDate:'2025-08-15', responded:true },
  { title:'SEC Scope 3 Guidance', jurisdiction:'US', closeDate:'2025-10-01', responded:false },
];

const IMPACT_BY_CAT = [
  { category:'Disclosure', count:15, avgImpact:82 },
  { category:'Carbon Pricing', count:8, avgImpact:78 },
  { category:'Transition Planning', count:6, avgImpact:72 },
  { category:'Risk Management', count:5, avgImpact:85 },
  { category:'Supply Chain', count:4, avgImpact:65 },
  { category:'Marketing', count:3, avgImpact:55 },
];

const FEED = [
  { date:'2025-03-28', title:'EFRAG publishes ESRS implementation guidance update', type:'Guidance', jurisdiction:'EU' },
  { date:'2025-03-25', title:'SEC stays climate disclosure rule pending court review', type:'Enforcement', jurisdiction:'US' },
  { date:'2025-03-22', title:'ISSB publishes adoption guide for emerging markets', type:'Standard', jurisdiction:'Global' },
  { date:'2025-03-18', title:'UK FCA consults on anti-greenwashing rule enforcement', type:'Consultation', jurisdiction:'UK' },
  { date:'2025-03-15', title:'Japan SSBJ finalizes sustainability disclosure standards', type:'Standard', jurisdiction:'JP' },
  { date:'2025-03-10', title:'EU Parliament approves CBAM Phase 2 timeline', type:'Legislation', jurisdiction:'EU' },
];

const STATUS_COLORS = { Effective:T.green, Upcoming:T.blue, Consultation:T.amber, Stayed:T.red };
const IMPACT_COLORS = { High:T.red, Medium:T.amber, Low:T.green };

export default function RegulatoryChangeRadarPage() {
  const [tab, setTab] = useState(0);
  const [jurisdictionFilter, setJurisdictionFilter] = useState('All');
  const [watchlist, setWatchlist] = useState(false);
  const [alertSub, setAlertSub] = useState(false);

  const jurisdictions = [...new Set(CHANGES.map(c => c.jurisdiction))];
  const filtered = useMemo(() => jurisdictionFilter === 'All' ? CHANGES : CHANGES.filter(c => c.jurisdiction === jurisdictionFilter), [jurisdictionFilter]);

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
              <span style={{ background:T.navy, color:'#fff', fontFamily:T.mono, fontSize:11, padding:'3px 10px', borderRadius:4 }}>EP-CR5</span>
              <span style={{ fontFamily:T.mono, fontSize:11, color:T.textMut }}>REGULATORY CHANGE RADAR</span>
            </div>
            <h1 style={{ fontSize:22, fontWeight:700, color:T.navy, margin:'6px 0 2px' }}>Regulatory Change Radar & Horizon Scanner</h1>
            <p style={{ color:T.textSec, fontSize:13, margin:0 }}>50 active regulatory changes tracked globally with impact assessment</p>
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

      <div style={{ marginBottom:12 }}>
        <select value={jurisdictionFilter} onChange={e=>setJurisdictionFilter(e.target.value)} style={{ padding:'6px 12px', borderRadius:6, border:`1px solid ${T.border}`, fontFamily:T.font, fontSize:13 }}>
          <option value="All">All Jurisdictions</option>{jurisdictions.map(j=><option key={j} value={j}>{j}</option>)}
        </select>
      </div>

      {tab === 0 && (
        <div>
          <div style={{ display:'flex', gap:16, marginBottom:20, flexWrap:'wrap' }}>
            {card('Changes Tracked', filtered.length.toString(), 'Active regulatory changes', T.navy)}
            {card('High Impact', filtered.filter(c=>c.impact==='High').length.toString(), 'Significant changes', T.red)}
            {card('Open Consultations', CONSULTATIONS.length.toString(), CONSULTATIONS.filter(c=>c.responded).length+' responded', T.amber)}
            {card('Modules Affected', Math.max(...filtered.map(c=>c.modulesAffected)).toString(), 'Max per change', T.blue)}
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', minWidth:800 }}>
              <thead><tr>{['Title','Jurisdiction','Status','Impact','Modules','Deadline'].map(h=><th key={h} style={{ padding:'8px 12px', textAlign:'left', borderBottom:`2px solid ${T.border}`, fontFamily:T.mono, fontSize:11, color:T.navy }}>{h}</th>)}</tr></thead>
              <tbody>{filtered.map((c,i)=>(
                <tr key={i} style={{ borderBottom:`1px solid ${T.border}` }}>
                  <td style={{ padding:'8px 12px', fontSize:13, fontWeight:600 }}>{c.title}</td>
                  <td style={{ padding:'8px 12px', fontFamily:T.mono, fontSize:12 }}>{c.jurisdiction}</td>
                  <td style={{ padding:'8px 12px' }}><span style={{ padding:'2px 8px', borderRadius:4, fontSize:11, fontFamily:T.mono, background:(STATUS_COLORS[c.status]||T.textMut)+'18', color:STATUS_COLORS[c.status]||T.textMut }}>{c.status}</span></td>
                  <td style={{ padding:'8px 12px' }}><span style={{ padding:'2px 8px', borderRadius:4, fontSize:11, fontFamily:T.mono, background:(IMPACT_COLORS[c.impact]||T.textMut)+'18', color:IMPACT_COLORS[c.impact]||T.textMut }}>{c.impact}</span></td>
                  <td style={{ padding:'8px 12px', fontFamily:T.mono, fontSize:13 }}>{c.modulesAffected}</td>
                  <td style={{ padding:'8px 12px', fontFamily:T.mono, fontSize:12 }}>{c.deadline}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div>{CONSULTATIONS.map((c,i)=>(
          <div key={i} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, marginBottom:12, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
            <div><div style={{ fontWeight:600, color:T.navy, fontSize:14 }}>{c.title}</div><div style={{ fontFamily:T.mono, fontSize:11, color:T.textMut }}>{c.jurisdiction} · Close: {c.closeDate}</div></div>
            <span style={{ padding:'4px 10px', borderRadius:4, fontSize:11, fontFamily:T.mono, background:c.responded?T.green+'18':T.amber+'18', color:c.responded?T.green:T.amber }}>{c.responded?'Responded':'Pending'}</span>
          </div>
        ))}</div>
      )}

      {tab === 2 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Regulatory Milestones Calendar</h3>
          <div style={{ display:'grid', gap:12 }}>
            {filtered.sort((a,b)=>a.deadline.localeCompare(b.deadline)).map((c,i)=>(
              <div key={i} style={{ display:'flex', alignItems:'center', gap:16, padding:12, background:T.bg, borderRadius:8, borderLeft:`4px solid ${STATUS_COLORS[c.status]||T.textMut}` }}>
                <div style={{ fontFamily:T.mono, fontSize:13, fontWeight:700, color:T.navy, minWidth:100 }}>{c.deadline}</div>
                <div style={{ flex:1 }}><div style={{ fontSize:13, fontWeight:600, color:T.navy }}>{c.title}</div><div style={{ fontSize:11, color:T.textMut }}>{c.jurisdiction}</div></div>
                <span style={{ padding:'2px 8px', borderRadius:4, fontSize:11, fontFamily:T.mono, background:(IMPACT_COLORS[c.impact])+'18', color:IMPACT_COLORS[c.impact] }}>{c.impact}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 3 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Impact by Regulatory Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={IMPACT_BY_CAT}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="category" tick={{ fontSize:10, fontFamily:T.mono }}/><YAxis yAxisId="left" tick={{ fontSize:11, fontFamily:T.mono }}/><YAxis yAxisId="right" orientation="right" tick={{ fontSize:11, fontFamily:T.mono }}/><Tooltip/><Legend/>
              <Bar yAxisId="left" dataKey="count" fill={T.navy} name="# Changes"/>
              <Bar yAxisId="right" dataKey="avgImpact" fill={T.gold} name="Avg Impact Score"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 4 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Status Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart><Pie data={[{name:'Effective',value:filtered.filter(c=>c.status==='Effective').length},{name:'Upcoming',value:filtered.filter(c=>c.status==='Upcoming').length},{name:'Consultation',value:filtered.filter(c=>c.status==='Consultation').length},{name:'Stayed',value:filtered.filter(c=>c.status==='Stayed').length}]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
              {[T.green,T.blue,T.amber,T.red].map((c,i)=><Cell key={i} fill={c}/>)}
            </Pie><Tooltip/><Legend/></PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 5 && (
        <div>{FEED.map((f,i)=>(
          <div key={i} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, marginBottom:12 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:8 }}>
              <div><div style={{ fontWeight:600, color:T.navy, fontSize:14 }}>{f.title}</div><div style={{ fontFamily:T.mono, fontSize:11, color:T.textMut, marginTop:4 }}>{f.date} · {f.jurisdiction}</div></div>
              <span style={{ padding:'4px 10px', borderRadius:4, fontSize:11, fontFamily:T.mono, background:T.blue+'18', color:T.blue }}>{f.type}</span>
            </div>
          </div>
        ))}</div>
      )}

      <div style={{ marginTop:24, padding:16, background:T.navy+'08', border:`1px solid ${T.navy}20`, borderRadius:8 }}>
        <div style={{ fontFamily:T.mono, fontSize:11, color:T.navy, fontWeight:600, marginBottom:4 }}>REFERENCE DATA</div>
        <div style={{ fontSize:12, color:T.textSec, lineHeight:1.6 }}>
          Grantham Research Institute on Climate Change & the Law · Climate Change Laws of the World · NGFS Regulatory Directory · Thomson Reuters Regulatory Intelligence · PRI Regulation Database
        </div>
      </div>
    </div>
  );
}
