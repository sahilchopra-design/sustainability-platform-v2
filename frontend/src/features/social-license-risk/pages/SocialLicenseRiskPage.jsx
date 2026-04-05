import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

const T = { bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb', orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a', font:"'DM Sans','SF Pro Display',system-ui,sans-serif", mono:"'JetBrains Mono','SF Mono','Fira Code',monospace" };
const TABS = ['Social License Dashboard','Community Benefit Tracking','FPIC Compliance','Project Timeline Risk','Protest & Litigation Monitor','Stakeholder Map'];

const PROJECTS = [
  { id:1, name:'Atacama Solar Farm', country:'Chile', sector:'Solar', slScore:78, benefitDelivered:82, fpic:'Obtained', delayYrs:0.5, protests:2, litigations:0, jobsPromised:450, jobsDelivered:380, revenueSharePct:2.5, revenueShareDelivered:2.1 },
  { id:2, name:'Pilbara Wind Complex', country:'Australia', sector:'Wind', slScore:85, benefitDelivered:91, fpic:'Obtained', delayYrs:0.2, protests:0, litigations:0, jobsPromised:320, jobsDelivered:310, revenueSharePct:3.0, revenueShareDelivered:3.0 },
  { id:3, name:'Niger Delta Gas Flare', country:'Nigeria', sector:'Gas', slScore:32, benefitDelivered:28, fpic:'Not Sought', delayYrs:4.2, protests:18, litigations:5, jobsPromised:200, jobsDelivered:45, revenueSharePct:1.5, revenueShareDelivered:0.3 },
  { id:4, name:'Oyu Tolgoi Copper', country:'Mongolia', sector:'Mining', slScore:48, benefitDelivered:41, fpic:'Pending', delayYrs:3.1, protests:12, litigations:3, jobsPromised:1200, jobsDelivered:680, revenueSharePct:5.0, revenueShareDelivered:2.8 },
  { id:5, name:'Adani Carmichael', country:'Australia', sector:'Coal', slScore:25, benefitDelivered:35, fpic:'Contested', delayYrs:5.0, protests:45, litigations:8, jobsPromised:10000, jobsDelivered:2100, revenueSharePct:0, revenueShareDelivered:0 },
  { id:6, name:'Cerrejón Mine', country:'Colombia', sector:'Coal', slScore:38, benefitDelivered:32, fpic:'Withheld', delayYrs:3.8, protests:24, litigations:6, jobsPromised:800, jobsDelivered:350, revenueSharePct:2.0, revenueShareDelivered:0.8 },
  { id:7, name:'Hornsea Three Offshore', country:'UK', sector:'Wind', slScore:72, benefitDelivered:68, fpic:'N/A', delayYrs:1.2, protests:3, litigations:1, jobsPromised:580, jobsDelivered:420, revenueSharePct:1.0, revenueShareDelivered:0.9 },
  { id:8, name:'Lake Turkana Wind', country:'Kenya', sector:'Wind', slScore:62, benefitDelivered:55, fpic:'Partial', delayYrs:2.1, protests:8, litigations:2, jobsPromised:300, jobsDelivered:185, revenueSharePct:1.5, revenueShareDelivered:1.0 },
  { id:9, name:'Trans Mountain Pipeline', country:'Canada', sector:'Oil', slScore:30, benefitDelivered:22, fpic:'Contested', delayYrs:4.5, protests:38, litigations:7, jobsPromised:5500, jobsDelivered:2800, revenueSharePct:0, revenueShareDelivered:0 },
  { id:10, name:'Noor Ouarzazate Solar', country:'Morocco', sector:'Solar', slScore:81, benefitDelivered:78, fpic:'Obtained', delayYrs:0.3, protests:1, litigations:0, jobsPromised:600, jobsDelivered:540, revenueSharePct:2.0, revenueShareDelivered:1.8 },
  { id:11, name:'Simandou Iron Ore', country:'Guinea', sector:'Mining', slScore:42, benefitDelivered:30, fpic:'Pending', delayYrs:3.5, protests:15, litigations:4, jobsPromised:4000, jobsDelivered:900, revenueSharePct:3.5, revenueShareDelivered:1.2 },
  { id:12, name:'Willow Oil Project', country:'USA', sector:'Oil', slScore:35, benefitDelivered:18, fpic:'Contested', delayYrs:3.8, protests:22, litigations:4, jobsPromised:2500, jobsDelivered:400, revenueSharePct:0, revenueShareDelivered:0 },
  { id:13, name:'Baltic Pipe Gas', country:'Denmark', sector:'Gas', slScore:68, benefitDelivered:72, fpic:'N/A', delayYrs:0.8, protests:4, litigations:1, jobsPromised:180, jobsDelivered:165, revenueSharePct:0, revenueShareDelivered:0 },
  { id:14, name:'Quellaveco Copper', country:'Peru', sector:'Mining', slScore:56, benefitDelivered:60, fpic:'Obtained', delayYrs:2.0, protests:9, litigations:2, jobsPromised:900, jobsDelivered:620, revenueSharePct:4.0, revenueShareDelivered:3.2 },
  { id:15, name:'Gansu Wind Corridor', country:'China', sector:'Wind', slScore:70, benefitDelivered:65, fpic:'N/A', delayYrs:0.5, protests:2, litigations:0, jobsPromised:1500, jobsDelivered:1280, revenueSharePct:0, revenueShareDelivered:0 },
];

const STAKEHOLDERS = [
  { name:'Local Community', influence:90, interest:95, stance:'Mixed' },
  { name:'Indigenous Groups', influence:75, interest:98, stance:'Critical' },
  { name:'Local Government', influence:85, interest:72, stance:'Supportive' },
  { name:'National Regulator', influence:95, interest:60, stance:'Neutral' },
  { name:'NGOs / Activists', influence:70, interest:88, stance:'Opposed' },
  { name:'Project Developer', influence:80, interest:95, stance:'Supportive' },
  { name:'Investors / Lenders', influence:88, interest:78, stance:'Cautious' },
  { name:'Media', influence:65, interest:70, stance:'Watchful' },
];

const FPIC_STATUS = [{ name:'Obtained', value:4 },{ name:'Pending', value:2 },{ name:'Contested', value:3 },{ name:'Withheld', value:1 },{ name:'Not Sought', value:1 },{ name:'N/A', value:4 }];
const FPIC_COLORS = [T.green, T.amber, T.orange, T.red, '#991b1b', T.textMut];

export default function SocialLicenseRiskPage() {
  const [tab, setTab] = useState(0);
  const [sectorFilter, setSectorFilter] = useState('All');
  const [watchlist, setWatchlist] = useState(false);

  const filtered = useMemo(() => sectorFilter === 'All' ? PROJECTS : PROJECTS.filter(p => p.sector === sectorFilter), [sectorFilter]);
  const sectors = [...new Set(PROJECTS.map(p => p.sector))];
  const avgSL = Math.round(filtered.reduce((s, p) => s + p.slScore, 0) / filtered.length);
  const totalProtests = filtered.reduce((s, p) => s + p.protests, 0);

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
              <span style={{ background:T.navy, color:'#fff', fontFamily:T.mono, fontSize:11, padding:'3px 10px', borderRadius:4 }}>EP-CO2</span>
              <span style={{ fontFamily:T.mono, fontSize:11, color:T.textMut }}>SOCIAL LICENSE RISK</span>
            </div>
            <h1 style={{ fontSize:22, fontWeight:700, color:T.navy, margin:'6px 0 2px' }}>Social License & Community Risk</h1>
            <p style={{ color:T.textSec, fontSize:13, margin:0 }}>Community benefit agreements, FPIC compliance & social opposition tracking</p>
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
        <select value={sectorFilter} onChange={e => setSectorFilter(e.target.value)} style={{ padding:'6px 12px', borderRadius:6, border:`1px solid ${T.border}`, fontFamily:T.font, fontSize:13 }}>
          <option value="All">All Sectors</option>
          {sectors.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {tab === 0 && (
        <div>
          <div style={{ display:'flex', gap:16, marginBottom:20, flexWrap:'wrap' }}>
            {card('Avg Social License Score', avgSL + '/100', avgSL >= 60 ? 'Acceptable' : 'At Risk', avgSL >= 60 ? T.green : T.red)}
            {card('Projects Tracked', filtered.length, 'Active projects', T.navy)}
            {card('Total Protests', totalProtests, 'Cumulative events', T.red)}
            {card('FPIC Obtained', PROJECTS.filter(p => p.fpic === 'Obtained').length, 'Of 15 projects', T.green)}
          </div>
          <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
            <div style={{ flex:2, background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, minWidth:400 }}>
              <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Social License Score by Project</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={filtered} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize:11, fontFamily:T.mono }} />
                  <YAxis type="category" dataKey="name" width={150} tick={{ fontSize:10, fontFamily:T.mono }} />
                  <Tooltip />
                  <Bar dataKey="slScore" name="SL Score">{filtered.map((p, i) => <Cell key={i} fill={p.slScore >= 70 ? T.green : p.slScore >= 50 ? T.amber : T.red} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex:1, background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, minWidth:260 }}>
              <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>FPIC Status Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={FPIC_STATUS} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                    {FPIC_STATUS.map((_, i) => <Cell key={i} fill={FPIC_COLORS[i]} />)}
                  </Pie>
                  <Tooltip /><Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, marginBottom:16 }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Jobs: Promised vs Delivered</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={filtered}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize:9, fontFamily:T.mono, angle:-30, textAnchor:'end' }} height={70} />
                <YAxis tick={{ fontSize:11, fontFamily:T.mono }} />
                <Tooltip /><Legend />
                <Bar dataKey="jobsPromised" fill={T.navy} name="Promised" />
                <Bar dataKey="jobsDelivered" fill={T.green} name="Delivered" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Revenue Share: Committed vs Actual (%)</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={filtered.filter(p => p.revenueSharePct > 0)}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize:9, fontFamily:T.mono, angle:-20, textAnchor:'end' }} height={60} />
                <YAxis tick={{ fontSize:11, fontFamily:T.mono }} domain={[0, 6]} />
                <Tooltip /><Legend />
                <Bar dataKey="revenueSharePct" fill={T.gold} name="Committed %" />
                <Bar dataKey="revenueShareDelivered" fill={T.green} name="Delivered %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 2 && (
        <div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, overflowX:'auto' }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>FPIC Compliance Status</h3>
            <table style={{ width:'100%', borderCollapse:'collapse', minWidth:700 }}>
              <thead><tr>{['Project','Country','Sector','FPIC Status','SL Score','Protests'].map(h => <th key={h} style={{ padding:'8px 12px', textAlign:'left', borderBottom:`2px solid ${T.border}`, fontFamily:T.mono, fontSize:11, color:T.navy }}>{h}</th>)}</tr></thead>
              <tbody>{filtered.map((p, i) => (
                <tr key={i} style={{ borderBottom:`1px solid ${T.border}` }}>
                  <td style={{ padding:'8px 12px', fontSize:13, fontWeight:600 }}>{p.name}</td>
                  <td style={{ padding:'8px 12px', fontSize:13 }}>{p.country}</td>
                  <td style={{ padding:'8px 12px', fontSize:13 }}>{p.sector}</td>
                  <td style={{ padding:'8px 12px' }}><span style={{ padding:'2px 8px', borderRadius:4, fontSize:11, fontFamily:T.mono, background:p.fpic==='Obtained'?T.green+'18':p.fpic==='Pending'?T.amber+'18':p.fpic==='N/A'?T.textMut+'18':T.red+'18', color:p.fpic==='Obtained'?T.green:p.fpic==='Pending'?T.amber:p.fpic==='N/A'?T.textMut:T.red }}>{p.fpic}</span></td>
                  <td style={{ padding:'8px 12px', fontSize:13, fontFamily:T.mono }}>{p.slScore}</td>
                  <td style={{ padding:'8px 12px', fontSize:13, fontFamily:T.mono, color:p.protests>10?T.red:p.protests>3?T.amber:T.green }}>{p.protests}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 3 && (
        <div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, marginBottom:16 }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Social Opposition Delay (Years Added)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={filtered.sort((a, b) => b.delayYrs - a.delayYrs)}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize:9, fontFamily:T.mono, angle:-30, textAnchor:'end' }} height={70} />
                <YAxis tick={{ fontSize:11, fontFamily:T.mono }} label={{ value:'Years', angle:-90, position:'insideLeft' }} />
                <Tooltip />
                <Bar dataKey="delayYrs" name="Delay (years)">{filtered.map((p, i) => <Cell key={i} fill={p.delayYrs > 3 ? T.red : p.delayYrs > 1.5 ? T.amber : T.green} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>SL Score vs Delay Correlation</h3>
            <ResponsiveContainer width="100%" height={280}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="slScore" name="SL Score" tick={{ fontSize:11, fontFamily:T.mono }} />
                <YAxis dataKey="delayYrs" name="Delay (yrs)" tick={{ fontSize:11, fontFamily:T.mono }} />
                <ZAxis dataKey="protests" range={[40, 400]} name="Protests" />
                <Tooltip cursor={{ strokeDasharray:'3 3' }} />
                <Scatter data={filtered} fill={T.navy} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 4 && (
        <div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, marginBottom:16 }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Protests & Litigations by Project</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={filtered.sort((a, b) => b.protests - a.protests)}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize:9, fontFamily:T.mono, angle:-30, textAnchor:'end' }} height={70} />
                <YAxis tick={{ fontSize:11, fontFamily:T.mono }} />
                <Tooltip /><Legend />
                <Bar dataKey="protests" fill={T.orange} name="Protests" />
                <Bar dataKey="litigations" fill={T.red} name="Litigations" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Benefit Delivery vs Social License Score</h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={filtered.sort((a, b) => a.slScore - b.slScore)}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize:9, fontFamily:T.mono, angle:-20, textAnchor:'end' }} height={60} />
                <YAxis tick={{ fontSize:11, fontFamily:T.mono }} />
                <Tooltip /><Legend />
                <Line dataKey="slScore" stroke={T.navy} strokeWidth={2} name="SL Score" dot={{ r:3 }} />
                <Line dataKey="benefitDelivered" stroke={T.green} strokeWidth={2} name="Benefit Delivered %" dot={{ r:3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 5 && (
        <div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Stakeholder Influence-Interest Map</h3>
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={STAKEHOLDERS}>
                <PolarGrid stroke={T.border} />
                <PolarAngleAxis dataKey="name" tick={{ fontSize:10, fontFamily:T.mono }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize:9 }} />
                <Radar name="Influence" dataKey="influence" stroke={T.navy} fill={T.navy} fillOpacity={0.2} />
                <Radar name="Interest" dataKey="interest" stroke={T.gold} fill={T.gold} fillOpacity={0.2} />
                <Legend /><Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:12, marginTop:16 }}>
            {STAKEHOLDERS.map((s, i) => (
              <div key={i} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:12 }}>
                <div style={{ fontWeight:600, color:T.navy, fontSize:14 }}>{s.name}</div>
                <div style={{ fontFamily:T.mono, fontSize:11, color:T.textMut, marginTop:4 }}>Influence: {s.influence} · Interest: {s.interest}</div>
                <div style={{ marginTop:4 }}><span style={{ padding:'2px 8px', borderRadius:4, fontSize:11, fontFamily:T.mono, background:s.stance==='Supportive'?T.green+'18':s.stance==='Opposed'||s.stance==='Critical'?T.red+'18':T.amber+'18', color:s.stance==='Supportive'?T.green:s.stance==='Opposed'||s.stance==='Critical'?T.red:T.amber }}>{s.stance}</span></div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop:24, padding:16, background:T.navy+'08', border:`1px solid ${T.navy}20`, borderRadius:8 }}>
        <div style={{ fontFamily:T.mono, fontSize:11, color:T.navy, fontWeight:600, marginBottom:4 }}>REFERENCE DATA</div>
        <div style={{ fontSize:12, color:T.textSec, lineHeight:1.6 }}>
          IFC Performance Standards (PS1-PS8) · UN Declaration on the Rights of Indigenous Peoples (UNDRIP) · Equator Principles · ICMM Mining Principles · Social License to Operate Index (Thomson & Boutilier 2011)
        </div>
      </div>
    </div>
  );
}
