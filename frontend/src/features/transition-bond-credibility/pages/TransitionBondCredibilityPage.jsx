import React, { useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, PieChart, Pie, Cell } from 'recharts';

const T = { bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb', orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a', font:"'DM Sans','SF Pro Display',system-ui,sans-serif", mono:"'JetBrains Mono','SF Mono','Fira Code',monospace" };
const TABS = ['Bond Universe','KPI Strength Scoring','Coupon Step-Up Probability','Use of Proceeds Verification','Issuer Transition Plan Cross-Check','Peer Comparison'];

const BONDS = [
  { issuer:'Enel', type:'SLB', kpiScore:78, stepUpBps:25, pMiss:0.35, expectedCost:8.75, uopDeployed:82, planScore:72, amount:1.5, coupon:3.85 },
  { issuer:'Holcim', type:'SLB', kpiScore:85, stepUpBps:50, pMiss:0.22, expectedCost:11.0, uopDeployed:88, planScore:80, amount:0.8, coupon:4.12 },
  { issuer:'Chanel', type:'SLB', kpiScore:55, stepUpBps:12.5, pMiss:0.58, expectedCost:7.25, uopDeployed:45, planScore:42, amount:0.6, coupon:2.95 },
  { issuer:'Tesco', type:'SLB', kpiScore:72, stepUpBps:25, pMiss:0.30, expectedCost:7.5, uopDeployed:78, planScore:68, amount:0.5, coupon:3.65 },
  { issuer:'Suzano', type:'SLB', kpiScore:82, stepUpBps:37.5, pMiss:0.25, expectedCost:9.38, uopDeployed:85, planScore:75, amount:1.2, coupon:4.25 },
  { issuer:'Etihad', type:'Transition', kpiScore:48, stepUpBps:0, pMiss:0.65, expectedCost:0, uopDeployed:35, planScore:38, amount:0.6, coupon:5.10 },
  { issuer:'JBS', type:'SLB', kpiScore:42, stepUpBps:25, pMiss:0.72, expectedCost:18.0, uopDeployed:28, planScore:32, amount:1.0, coupon:5.85 },
  { issuer:'Repsol', type:'Transition', kpiScore:62, stepUpBps:0, pMiss:0.45, expectedCost:0, uopDeployed:58, planScore:55, amount:0.8, coupon:4.48 },
  { issuer:'ANA Holdings', type:'Transition', kpiScore:58, stepUpBps:0, pMiss:0.52, expectedCost:0, uopDeployed:52, planScore:48, amount:0.5, coupon:3.22 },
  { issuer:'CaixaBank', type:'SLB', kpiScore:75, stepUpBps:25, pMiss:0.28, expectedCost:7.0, uopDeployed:80, planScore:70, amount:1.0, coupon:3.95 },
  { issuer:'Novartis', type:'SLB', kpiScore:88, stepUpBps:50, pMiss:0.18, expectedCost:9.0, uopDeployed:92, planScore:82, amount:2.0, coupon:3.55 },
  { issuer:'Pemex', type:'Transition', kpiScore:32, stepUpBps:0, pMiss:0.82, expectedCost:0, uopDeployed:22, planScore:25, amount:1.5, coupon:7.25 },
];

const KPI_DIMS = [
  { dim:'Ambition', avg:65 },{ dim:'Materiality', avg:72 },{ dim:'Measurability', avg:78 },
  { dim:'Externally Verified', avg:58 },{ dim:'Science-Based', avg:52 },{ dim:'Baseline Transparency', avg:68 },
];

export default function TransitionBondCredibilityPage() {
  const [tab, setTab] = useState(0);
  const [typeFilter, setTypeFilter] = useState('All');
  const [watchlist, setWatchlist] = useState(false);

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
              <span style={{ background:T.navy, color:'#fff', fontFamily:T.mono, fontSize:11, padding:'3px 10px', borderRadius:4 }}>EP-CQ2</span>
              <span style={{ fontFamily:T.mono, fontSize:11, color:T.textMut }}>TRANSITION BOND CREDIBILITY</span>
            </div>
            <h1 style={{ fontSize:22, fontWeight:700, color:T.navy, margin:'6px 0 2px' }}>Transition Bond KPI Credibility Engine</h1>
            <p style={{ color:T.textSec, fontSize:13, margin:0 }}>KPI scoring, step-up probability & use-of-proceeds verification</p>
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

      <div style={{ marginBottom:12 }}>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ padding:'6px 12px', borderRadius:6, border:`1px solid ${T.border}`, fontFamily:T.font, fontSize:13 }}>
          <option value="All">All Types</option><option value="SLB">SLB</option><option value="Transition">Transition</option>
        </select>
      </div>

      {tab === 0 && (
        <div>
          <div style={{ display:'flex', gap:16, marginBottom:20, flexWrap:'wrap' }}>
            {card('Bonds Tracked', filtered.length.toString(), 'SLB + Transition', T.navy)}
            {card('Avg KPI Score', Math.round(filtered.reduce((s,b)=>s+b.kpiScore,0)/filtered.length)+'/100', 'Credibility score', T.gold)}
            {card('Total Volume', '$'+filtered.reduce((s,b)=>s+b.amount,0).toFixed(1)+'B', 'Outstanding', T.green)}
            {card('High Credibility', filtered.filter(b=>b.kpiScore>=75).length.toString(), 'KPI ≥ 75', T.blue)}
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', minWidth:800 }}>
              <thead><tr>{['Issuer','Type','KPI Score','Step-Up (bps)','P(Miss)','UoP Deploy %','Plan Score'].map(h => <th key={h} style={{ padding:'8px 12px', textAlign:'left', borderBottom:`2px solid ${T.border}`, fontFamily:T.mono, fontSize:11, color:T.navy }}>{h}</th>)}</tr></thead>
              <tbody>{filtered.map((b, i) => (
                <tr key={i} style={{ borderBottom:`1px solid ${T.border}` }}>
                  <td style={{ padding:'8px 12px', fontSize:13, fontWeight:600 }}>{b.issuer}</td>
                  <td style={{ padding:'8px 12px' }}><span style={{ padding:'2px 8px', borderRadius:4, fontSize:11, fontFamily:T.mono, background:b.type==='SLB'?T.blue+'18':T.purple+'18', color:b.type==='SLB'?T.blue:T.purple }}>{b.type}</span></td>
                  <td style={{ padding:'8px 12px', fontFamily:T.mono, fontSize:13, color:b.kpiScore>=75?T.green:b.kpiScore>=50?T.amber:T.red }}>{b.kpiScore}</td>
                  <td style={{ padding:'8px 12px', fontFamily:T.mono, fontSize:13 }}>{b.stepUpBps || '—'}</td>
                  <td style={{ padding:'8px 12px', fontFamily:T.mono, fontSize:13, color:b.pMiss>=0.5?T.red:b.pMiss>=0.3?T.amber:T.green }}>{(b.pMiss*100).toFixed(0)}%</td>
                  <td style={{ padding:'8px 12px', fontFamily:T.mono, fontSize:13 }}>{b.uopDeployed}%</td>
                  <td style={{ padding:'8px 12px', fontFamily:T.mono, fontSize:13, color:b.planScore>=70?T.green:b.planScore>=50?T.amber:T.red }}>{b.planScore}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
          <div style={{ flex:1, background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, minWidth:350 }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>KPI Strength Score by Issuer</h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={filtered.sort((a,b)=>b.kpiScore-a.kpiScore)}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="issuer" tick={{ fontSize:10, fontFamily:T.mono }} />
                <YAxis tick={{ fontSize:11, fontFamily:T.mono }} domain={[0,100]} />
                <Tooltip />
                <Bar dataKey="kpiScore" name="KPI Score">{filtered.sort((a,b)=>b.kpiScore-a.kpiScore).map((b,i)=><Cell key={i} fill={b.kpiScore>=75?T.green:b.kpiScore>=50?T.amber:T.red}/>)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ flex:1, background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, minWidth:300 }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>KPI Quality Dimensions (Average)</h3>
            <ResponsiveContainer width="100%" height={350}>
              <RadarChart data={KPI_DIMS}>
                <PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="dim" tick={{ fontSize:10, fontFamily:T.mono }}/><PolarRadiusAxis domain={[0,100]} tick={{ fontSize:9 }}/>
                <Radar dataKey="avg" stroke={T.gold} fill={T.gold} fillOpacity={0.3}/><Tooltip/>
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 2 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>P(Miss KPI) x Step-Up = Expected Cost (bps)</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={filtered.filter(b=>b.stepUpBps>0)}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="issuer" tick={{ fontSize:11, fontFamily:T.mono }} />
              <YAxis yAxisId="left" tick={{ fontSize:11, fontFamily:T.mono }}/><YAxis yAxisId="right" orientation="right" tick={{ fontSize:11, fontFamily:T.mono }}/>
              <Tooltip /><Legend />
              <Bar yAxisId="left" dataKey="stepUpBps" fill={T.navy} name="Step-Up (bps)"/>
              <Bar yAxisId="right" dataKey="expectedCost" fill={T.red} name="Expected Cost (bps)"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 3 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Use of Proceeds Deployment %</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={filtered.sort((a,b)=>b.uopDeployed-a.uopDeployed)}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="issuer" tick={{ fontSize:11, fontFamily:T.mono }} />
              <YAxis tick={{ fontSize:11, fontFamily:T.mono }} domain={[0,100]} />
              <Tooltip />
              <Bar dataKey="uopDeployed" name="Deployed %">{filtered.sort((a,b)=>b.uopDeployed-a.uopDeployed).map((b,i)=><Cell key={i} fill={b.uopDeployed>=80?T.green:b.uopDeployed>=50?T.amber:T.red}/>)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 4 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Transition Plan Score vs KPI Score</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={filtered}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="issuer" tick={{ fontSize:10, fontFamily:T.mono }} />
              <YAxis tick={{ fontSize:11, fontFamily:T.mono }} domain={[0,100]} />
              <Tooltip /><Legend />
              <Bar dataKey="kpiScore" fill={T.navy} name="KPI Score"/>
              <Bar dataKey="planScore" fill={T.gold} name="Plan Score"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 5 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Credibility Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={[{name:'High (≥75)',value:filtered.filter(b=>b.kpiScore>=75).length},{name:'Medium (50-74)',value:filtered.filter(b=>b.kpiScore>=50&&b.kpiScore<75).length},{name:'Low (<50)',value:filtered.filter(b=>b.kpiScore<50).length}]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                {[T.green,T.amber,T.red].map((c,i)=><Cell key={i} fill={c}/>)}
              </Pie><Tooltip/><Legend/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      <div style={{ marginTop:24, padding:16, background:T.navy+'08', border:`1px solid ${T.navy}20`, borderRadius:8 }}>
        <div style={{ fontFamily:T.mono, fontSize:11, color:T.navy, fontWeight:600, marginBottom:4 }}>REFERENCE DATA</div>
        <div style={{ fontSize:12, color:T.textSec, lineHeight:1.6 }}>
          ICMA Sustainability-Linked Bond Principles · Climate Bonds Initiative Transition Criteria · OECD Guidance on Transition Finance · EU Green Bond Standard Regulation
        </div>
      </div>
    </div>
  );
}
