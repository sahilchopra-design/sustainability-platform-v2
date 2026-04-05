import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, PieChart, Pie, Cell } from 'recharts';

const T = { bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb', orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a', font:"'DM Sans','SF Pro Display',system-ui,sans-serif", mono:"'JetBrains Mono','SF Mono','Fira Code',monospace" };
const TABS = ['Report Builder','UK Stewardship Code 2020','ICGN Principles','PRI Signatory Reporting','Case Study Generator','Export Centre'];

const UK_PRINCIPLES = [
  { principle:'P1: Purpose & Governance', compliance:92, evidence:88 },
  { principle:'P2: Governance & Resources', compliance:85, evidence:80 },
  { principle:'P3: Conflicts of Interest', compliance:90, evidence:86 },
  { principle:'P4: Market-wide Risks', compliance:78, evidence:72 },
  { principle:'P5: Review & Assurance', compliance:72, evidence:65 },
  { principle:'P6: Client Needs', compliance:88, evidence:82 },
  { principle:'P7: ESG Integration', compliance:82, evidence:78 },
  { principle:'P8: Monitoring Service Providers', compliance:68, evidence:60 },
  { principle:'P9: Engagement', compliance:85, evidence:80 },
  { principle:'P10: Collaboration', compliance:78, evidence:72 },
  { principle:'P11: Escalation', compliance:75, evidence:70 },
  { principle:'P12: Exercising Rights', compliance:88, evidence:84 },
];

const ICGN_DATA = [
  { principle:'Internal Governance', score:85 },
  { principle:'Investment Integration', score:78 },
  { principle:'Engagement', score:82 },
  { principle:'Voting', score:88 },
  { principle:'Collaboration', score:72 },
  { principle:'Reporting', score:80 },
  { principle:'Conflicts Mgmt', score:90 },
];

const PRI_SCORES = [
  { module:'Investment & Stewardship Policy', score:4, maxScore:5 },
  { module:'Direct – Listed Equity', score:4, maxScore:5 },
  { module:'Direct – Fixed Income', score:3, maxScore:5 },
  { module:'Direct – Real Estate', score:3, maxScore:5 },
  { module:'Indirect – Manager Selection', score:4, maxScore:5 },
  { module:'Confidence Building Measures', score:4, maxScore:5 },
];

const CASE_STUDIES = [
  { id:1, title:'Shell Climate Transition Plan', company:'Shell plc', theme:'Emissions Targets', status:'Published', engagementType:'Collaborative', outcome:'Company strengthened 2030 targets' },
  { id:2, title:'Barclays Fossil Fuel Financing', company:'Barclays', theme:'Climate Finance', status:'Draft', engagementType:'Individual', outcome:'Reduced fossil lending 15%' },
  { id:3, title:'Glencore Just Transition', company:'Glencore', theme:'Just Transition', status:'Published', engagementType:'Collaborative', outcome:'JT plan adopted for SA operations' },
  { id:4, title:'Toyota EV Strategy', company:'Toyota', theme:'Technology Transition', status:'In Review', engagementType:'Individual', outcome:'Accelerated BEV timeline' },
];

const REPORTS = [
  { name:'Annual Stewardship Report 2024', template:'UK Stewardship Code', status:'Draft', sections:12, completePct:72 },
  { name:'PRI Annual Assessment 2024', template:'PRI Framework', status:'In Progress', sections:6, completePct:58 },
  { name:'Climate Voting Report Q4', template:'Custom', status:'Complete', sections:8, completePct:100 },
  { name:'Engagement Impact Summary', template:'ICGN Principles', status:'Draft', sections:7, completePct:45 },
];

export default function StewardshipReportGeneratorPage() {
  const [tab, setTab] = useState(0);
  const [watchlist, setWatchlist] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('UK Stewardship Code 2020');

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
              <span style={{ background:T.navy, color:'#fff', fontFamily:T.mono, fontSize:11, padding:'3px 10px', borderRadius:4 }}>EP-CP3</span>
              <span style={{ fontFamily:T.mono, fontSize:11, color:T.textMut }}>STEWARDSHIP REPORT GENERATOR</span>
            </div>
            <h1 style={{ fontSize:22, fontWeight:700, color:T.navy, margin:'6px 0 2px' }}>Stewardship Report Generator</h1>
            <p style={{ color:T.textSec, fontSize:13, margin:0 }}>UK Stewardship Code, ICGN Principles & PRI reporting templates</p>
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
            {card('Active Reports', REPORTS.length.toString(), 'In pipeline', T.navy)}
            {card('Templates', '3', 'UK SC / ICGN / PRI', T.gold)}
            {card('Case Studies', CASE_STUDIES.length.toString(), 'Generated', T.green)}
            {card('Avg Completion', Math.round(REPORTS.reduce((s,r)=>s+r.completePct,0)/REPORTS.length)+'%', 'Across all reports', T.blue)}
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, overflowX:'auto' }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Report Pipeline</h3>
            <table style={{ width:'100%', borderCollapse:'collapse', minWidth:700 }}>
              <thead><tr>{['Report','Template','Status','Sections','Progress'].map(h => <th key={h} style={{ padding:'8px 12px', textAlign:'left', borderBottom:`2px solid ${T.border}`, fontFamily:T.mono, fontSize:11, color:T.navy }}>{h}</th>)}</tr></thead>
              <tbody>{REPORTS.map((r, i) => (
                <tr key={i} style={{ borderBottom:`1px solid ${T.border}` }}>
                  <td style={{ padding:'8px 12px', fontSize:13, fontWeight:600 }}>{r.name}</td>
                  <td style={{ padding:'8px 12px', fontSize:13 }}>{r.template}</td>
                  <td style={{ padding:'8px 12px' }}><span style={{ padding:'2px 8px', borderRadius:4, fontSize:11, fontFamily:T.mono, background:r.status==='Complete'?T.green+'18':r.status==='Draft'?T.amber+'18':T.blue+'18', color:r.status==='Complete'?T.green:r.status==='Draft'?T.amber:T.blue }}>{r.status}</span></td>
                  <td style={{ padding:'8px 12px', fontFamily:T.mono, fontSize:13 }}>{r.sections}</td>
                  <td style={{ padding:'8px 12px' }}><div style={{ display:'flex', alignItems:'center', gap:8 }}><div style={{ flex:1, height:8, background:T.border, borderRadius:4 }}><div style={{ width:r.completePct+'%', height:'100%', background:r.completePct===100?T.green:T.gold, borderRadius:4 }} /></div><span style={{ fontFamily:T.mono, fontSize:11 }}>{r.completePct}%</span></div></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>UK Stewardship Code 2020 — 12 Principles Compliance</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={UK_PRINCIPLES} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize:11, fontFamily:T.mono }} />
              <YAxis type="category" dataKey="principle" width={200} tick={{ fontSize:9, fontFamily:T.mono }} />
              <Tooltip /><Legend />
              <Bar dataKey="compliance" fill={T.navy} name="Compliance %" />
              <Bar dataKey="evidence" fill={T.gold} name="Evidence Strength %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 2 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>ICGN Global Stewardship Principles</h3>
          <ResponsiveContainer width="100%" height={350}>
            <RadarChart data={ICGN_DATA}>
              <PolarGrid stroke={T.border} />
              <PolarAngleAxis dataKey="principle" tick={{ fontSize:10, fontFamily:T.mono }} />
              <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize:9 }} />
              <Radar dataKey="score" stroke={T.gold} fill={T.gold} fillOpacity={0.3} name="Score" />
              <Tooltip /><Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 3 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>PRI Annual Assessment Scores (out of 5)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={PRI_SCORES}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="module" tick={{ fontSize:9, fontFamily:T.mono, angle:-15, textAnchor:'end' }} height={50} />
              <YAxis tick={{ fontSize:11, fontFamily:T.mono }} domain={[0, 5]} />
              <Tooltip /><Legend />
              <Bar dataKey="score" fill={T.navy} name="Score" />
              <Bar dataKey="maxScore" fill={T.border} name="Max" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 4 && (
        <div>
          {CASE_STUDIES.map((cs, i) => (
            <div key={i} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20, marginBottom:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:8 }}>
                <div>
                  <h3 style={{ fontSize:16, fontWeight:700, color:T.navy, margin:0 }}>{cs.title}</h3>
                  <div style={{ fontFamily:T.mono, fontSize:11, color:T.textMut, marginTop:4 }}>{cs.company} · {cs.theme} · {cs.engagementType}</div>
                </div>
                <span style={{ padding:'4px 10px', borderRadius:4, fontSize:11, fontFamily:T.mono, background:cs.status==='Published'?T.green+'18':cs.status==='Draft'?T.amber+'18':T.blue+'18', color:cs.status==='Published'?T.green:cs.status==='Draft'?T.amber:T.blue }}>{cs.status}</span>
              </div>
              <div style={{ marginTop:10, padding:10, background:T.bg, borderRadius:6, fontSize:13, color:T.textSec }}><strong>Outcome:</strong> {cs.outcome}</div>
            </div>
          ))}
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, marginTop:16 }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Case Study Themes</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={[{ name:'Emissions', value:2 },{ name:'Finance', value:1 },{ name:'Just Transition', value:1 },{ name:'Technology', value:1 }]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {[T.navy, T.gold, T.green, T.blue].map((c, i) => <Cell key={i} fill={c} />)}
                </Pie><Tooltip /><Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 5 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
          <h3 style={{ fontSize:16, fontWeight:600, color:T.navy, marginBottom:16 }}>Export Centre</h3>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:16 }}>
            {['PDF Report','Word Document','Structured Data (JSON)','PowerPoint Summary'].map((fmt, i) => (
              <div key={i} style={{ background:T.bg, border:`1px solid ${T.border}`, borderRadius:8, padding:16, textAlign:'center', cursor:'pointer' }}>
                <div style={{ fontSize:32, marginBottom:8 }}>{['📄','📝','📊','📑'][i]}</div>
                <div style={{ fontWeight:600, color:T.navy, fontSize:14 }}>{fmt}</div>
                <div style={{ fontSize:11, color:T.textMut, marginTop:4 }}>Click to generate</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop:20, padding:12, background:T.amber+'10', border:`1px solid ${T.amber}30`, borderRadius:6, fontSize:12, color:T.textSec }}>
            Reports are auto-populated from engagement data. Select a template, review populated content, and export in your preferred format.
          </div>
        </div>
      )}

      <div style={{ marginTop:24, padding:16, background:T.navy+'08', border:`1px solid ${T.navy}20`, borderRadius:8 }}>
        <div style={{ fontFamily:T.mono, fontSize:11, color:T.navy, fontWeight:600, marginBottom:4 }}>REFERENCE DATA</div>
        <div style={{ fontSize:12, color:T.textSec, lineHeight:1.6 }}>
          UK Stewardship Code 2020 (FRC) · ICGN Global Stewardship Principles 2020 · PRI Reporting Framework 2024 · EFAMA Stewardship Code · Japan Stewardship Code
        </div>
      </div>
    </div>
  );
}
