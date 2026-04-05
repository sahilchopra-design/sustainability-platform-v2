import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

const T = { bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb', orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a', font:"'DM Sans','SF Pro Display',system-ui,sans-serif", mono:"'JetBrains Mono','SF Mono','Fira Code',monospace" };
const TABS = ['Loan Portfolio Dashboard','GLP/SLLP Alignment','Margin Ratchet Modeler','Borrower Assessment','Covenant Design','Reporting Templates'];

const LOANS = [
  { borrower:'Vestas Wind', type:'Green', amount:500, margin:185, glpAligned:true, sllpAligned:false, kpi:'N/A', ratchetBps:0, score:82 },
  { borrower:'Orsted', type:'SLL', amount:800, margin:165, glpAligned:false, sllpAligned:true, kpi:'Scope 1+2 -50% by 2030', ratchetBps:15, score:88 },
  { borrower:'Holcim', type:'SLL', amount:1200, margin:210, glpAligned:false, sllpAligned:true, kpi:'CO2/tonne cement -20%', ratchetBps:12, score:72 },
  { borrower:'Enel', type:'SLL', amount:2000, margin:145, glpAligned:false, sllpAligned:true, kpi:'Renewable capacity 80%', ratchetBps:20, score:85 },
  { borrower:'SSE plc', type:'Green', amount:600, margin:175, glpAligned:true, sllpAligned:false, kpi:'N/A', ratchetBps:0, score:78 },
  { borrower:'CaixaBank', type:'SLL', amount:1500, margin:155, glpAligned:false, sllpAligned:true, kpi:'Green asset ratio 15%', ratchetBps:10, score:75 },
  { borrower:'Schneider', type:'SLL', amount:900, margin:170, glpAligned:false, sllpAligned:true, kpi:'Carbon neutral ops 2025', ratchetBps:18, score:90 },
  { borrower:'Iberdrola', type:'Green', amount:1100, margin:160, glpAligned:true, sllpAligned:false, kpi:'N/A', ratchetBps:0, score:80 },
];

const RATCHET_SIM = [
  { year:2025, base:210, ifMet:198, ifMissed:222 },{ year:2026, base:210, ifMet:186, ifMissed:234 },
  { year:2027, base:210, ifMet:174, ifMissed:246 },{ year:2028, base:210, ifMet:162, ifMissed:258 },
  { year:2029, base:210, ifMet:150, ifMissed:270 },
];

const COVENANTS = [
  { kpi:'GHG Reduction Target', frequency:'Annual', threshold:'-5% YoY', prevalence:85 },
  { kpi:'Renewable Energy %', frequency:'Semi-Annual', threshold:'>50%', prevalence:62 },
  { kpi:'Water Intensity', frequency:'Annual', threshold:'-3% YoY', prevalence:35 },
  { kpi:'Board Gender Diversity', frequency:'Annual', threshold:'>30%', prevalence:48 },
  { kpi:'Lost Time Injury Rate', frequency:'Quarterly', threshold:'<0.5', prevalence:42 },
  { kpi:'Green Revenue Share', frequency:'Annual', threshold:'>25%', prevalence:55 },
];

const TYPE_DIST = [{ name:'Green Loan', value:3 },{ name:'Sustainability-Linked', value:5 }];

export default function GreenLoanFrameworkPage() {
  const [tab, setTab] = useState(0);
  const [ratchetBps, setRatchetBps] = useState(12);
  const [watchlist, setWatchlist] = useState(false);

  const totalVolume = LOANS.reduce((s,l)=>s+l.amount,0);
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
              <span style={{ background:T.navy, color:'#fff', fontFamily:T.mono, fontSize:11, padding:'3px 10px', borderRadius:4 }}>EP-CQ5</span>
              <span style={{ fontFamily:T.mono, fontSize:11, color:T.textMut }}>GREEN LOAN FRAMEWORK</span>
            </div>
            <h1 style={{ fontSize:22, fontWeight:700, color:T.navy, margin:'6px 0 2px' }}>Green & Sustainability-Linked Loan Framework</h1>
            <p style={{ color:T.textSec, fontSize:13, margin:0 }}>GLP/SLLP compliance, margin ratchet modelling & covenant design</p>
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
            {card('Portfolio Volume', '$'+(totalVolume/1000).toFixed(1)+'B', LOANS.length+' loans', T.navy)}
            {card('Green Loans', LOANS.filter(l=>l.type==='Green').length.toString(), 'GLP aligned', T.green)}
            {card('SLL Loans', LOANS.filter(l=>l.type==='SLL').length.toString(), 'SLLP aligned', T.blue)}
            {card('Avg Borrower Score', Math.round(LOANS.reduce((s,l)=>s+l.score,0)/LOANS.length)+'/100', 'ESG assessment', T.gold)}
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', minWidth:800 }}>
              <thead><tr>{['Borrower','Type','Amount ($M)','Margin (bps)','KPI','Ratchet (bps)','Score'].map(h=><th key={h} style={{ padding:'8px 12px', textAlign:'left', borderBottom:`2px solid ${T.border}`, fontFamily:T.mono, fontSize:11, color:T.navy }}>{h}</th>)}</tr></thead>
              <tbody>{LOANS.map((l,i)=>(
                <tr key={i} style={{ borderBottom:`1px solid ${T.border}` }}>
                  <td style={{ padding:'8px 12px', fontSize:13, fontWeight:600 }}>{l.borrower}</td>
                  <td style={{ padding:'8px 12px' }}><span style={{ padding:'2px 8px', borderRadius:4, fontSize:11, fontFamily:T.mono, background:l.type==='Green'?T.green+'18':T.blue+'18', color:l.type==='Green'?T.green:T.blue }}>{l.type}</span></td>
                  <td style={{ padding:'8px 12px', fontFamily:T.mono, fontSize:13 }}>{l.amount}</td>
                  <td style={{ padding:'8px 12px', fontFamily:T.mono, fontSize:13 }}>{l.margin}</td>
                  <td style={{ padding:'8px 12px', fontSize:12, maxWidth:200, overflow:'hidden', textOverflow:'ellipsis' }}>{l.kpi}</td>
                  <td style={{ padding:'8px 12px', fontFamily:T.mono, fontSize:13 }}>{l.ratchetBps||'—'}</td>
                  <td style={{ padding:'8px 12px', fontFamily:T.mono, fontSize:13, color:l.score>=80?T.green:l.score>=60?T.amber:T.red }}>{l.score}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
          <div style={{ flex:1, background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, minWidth:300 }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Loan Type Distribution</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart><Pie data={TYPE_DIST} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>{[T.green,T.blue].map((c,i)=><Cell key={i} fill={c}/>)}</Pie><Tooltip/><Legend/></PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ flex:1, background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, minWidth:300 }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Loan Amount by Borrower ($M)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={LOANS}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="borrower" tick={{ fontSize:9, fontFamily:T.mono, angle:-20, textAnchor:'end' }} height={50}/><YAxis tick={{ fontSize:11, fontFamily:T.mono }}/><Tooltip/>
                <Bar dataKey="amount" name="Amount ($M)">{LOANS.map((l,i)=><Cell key={i} fill={l.type==='Green'?T.green:T.blue}/>)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 2 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <div style={{ marginBottom:12, display:'flex', gap:12, alignItems:'center' }}>
            <label style={{ fontSize:12, color:T.textSec }}>Ratchet Step (bps):</label>
            <input type="range" min="5" max="25" value={ratchetBps} onChange={e=>setRatchetBps(Number(e.target.value))}/>
            <span style={{ fontFamily:T.mono, fontSize:13, color:T.navy }}>{ratchetBps} bps</span>
          </div>
          <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Margin Trajectory: If KPI Met vs Missed</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={RATCHET_SIM.map(d=>({...d, ifMet:d.base-(d.base-d.ifMet)*ratchetBps/12, ifMissed:d.base+(d.ifMissed-d.base)*ratchetBps/12}))}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="year" tick={{ fontSize:11, fontFamily:T.mono }}/><YAxis tick={{ fontSize:11, fontFamily:T.mono }}/><Tooltip/><Legend/>
              <Line dataKey="base" stroke={T.textMut} strokeWidth={2} name="Base Margin" strokeDasharray="5 5"/>
              <Line dataKey="ifMet" stroke={T.green} strokeWidth={2} name="If KPI Met" dot={{ r:4 }}/>
              <Line dataKey="ifMissed" stroke={T.red} strokeWidth={2} name="If KPI Missed" dot={{ r:4 }}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 3 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Borrower ESG Assessment Scores</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={LOANS.sort((a,b)=>b.score-a.score)}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="borrower" tick={{ fontSize:10, fontFamily:T.mono }}/><YAxis tick={{ fontSize:11, fontFamily:T.mono }} domain={[0,100]}/><Tooltip/>
              <Bar dataKey="score" name="ESG Score">{LOANS.sort((a,b)=>b.score-a.score).map((l,i)=><Cell key={i} fill={l.score>=80?T.green:l.score>=65?T.gold:T.amber}/>)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 4 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>ESG KPI Covenant Prevalence</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={COVENANTS} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" domain={[0,100]} tick={{ fontSize:11, fontFamily:T.mono }}/><YAxis type="category" dataKey="kpi" width={160} tick={{ fontSize:9, fontFamily:T.mono }}/><Tooltip/>
              <Bar dataKey="prevalence" fill={T.navy} name="Prevalence %"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 5 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
          <h3 style={{ fontSize:16, fontWeight:600, color:T.navy, marginBottom:16 }}>Reporting Templates</h3>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:16 }}>
            {['GLP Annual Report','SLLP KPI Verification','Margin Ratchet Confirmation','Green Loan Impact Report'].map((t,i)=>(
              <div key={i} style={{ background:T.bg, border:`1px solid ${T.border}`, borderRadius:8, padding:16, textAlign:'center', cursor:'pointer' }}>
                <div style={{ fontSize:32, marginBottom:8 }}>{['📄','📋','📊','🌱'][i]}</div>
                <div style={{ fontWeight:600, color:T.navy, fontSize:14 }}>{t}</div>
                <div style={{ fontSize:11, color:T.textMut, marginTop:4 }}>Auto-generated template</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop:24, padding:16, background:T.navy+'08', border:`1px solid ${T.navy}20`, borderRadius:8 }}>
        <div style={{ fontFamily:T.mono, fontSize:11, color:T.navy, fontWeight:600, marginBottom:4 }}>REFERENCE DATA</div>
        <div style={{ fontSize:12, color:T.textSec, lineHeight:1.6 }}>
          LMA/APLMA Green Loan Principles 2023 · LMA Sustainability-Linked Loan Principles 2023 · ICMA-LMA Guidance on SLL KPIs · European Banking Authority Green Loan Guidance
        </div>
      </div>
    </div>
  );
}
