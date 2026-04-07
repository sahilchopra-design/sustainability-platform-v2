import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, LineChart, Line } from 'recharts';

const T = { bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb', orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a', card:'#ffffff',sub:'#5c6b7e',indigo:'#4f46e5',font:"'DM Sans','SF Pro Display',system-ui,sans-serif", mono:"'JetBrains Mono','SF Mono','Fira Code',monospace" };
const TABS = ['FPIC Dashboard','Consent Status by Project','Rights Framework Compliance','Cultural Heritage Impact','Benefit Sharing Agreements','Grievance Mechanism'];

const PROJECTS = [
  { id:1, name:'Atacama Lithium', country:'Chile', community:'Atacameno', fpic:'Obtained', undrip:92, ilo169:88, ifcPs7:85, sacredSites:1, tkImpact:'Low', revPct:3.5, empGuarantee:120, infraCommit:'School + Road', grievances:2, resolved:2 },
  { id:2, name:'Pilbara Iron Ore Exp.', country:'Australia', community:'Yindjibarndi', fpic:'Contested', undrip:45, ilo169:38, ifcPs7:42, sacredSites:4, tkImpact:'High', revPct:2.0, empGuarantee:80, infraCommit:'Housing', grievances:15, resolved:6 },
  { id:3, name:'Trans Mountain Ext.', country:'Canada', community:'Secwepemc', fpic:'Withheld', undrip:32, ilo169:28, ifcPs7:30, sacredSites:6, tkImpact:'Critical', revPct:0, empGuarantee:0, infraCommit:'None', grievances:28, resolved:4 },
  { id:4, name:'REDD+ Kalimantan', country:'Indonesia', community:'Dayak', fpic:'Pending', undrip:58, ilo169:55, ifcPs7:60, sacredSites:3, tkImpact:'Medium', revPct:5.0, empGuarantee:200, infraCommit:'Health Centre', grievances:8, resolved:5 },
  { id:5, name:'Simandou Rail', country:'Guinea', community:'Toma/Kissi', fpic:'Not Sought', undrip:18, ilo169:12, ifcPs7:15, sacredSites:8, tkImpact:'Critical', revPct:0, empGuarantee:0, infraCommit:'None', grievances:32, resolved:3 },
  { id:6, name:'Noor Solar III', country:'Morocco', community:'Amazigh', fpic:'Obtained', undrip:78, ilo169:72, ifcPs7:80, sacredSites:0, tkImpact:'Low', revPct:2.5, empGuarantee:60, infraCommit:'Water + School', grievances:3, resolved:3 },
  { id:7, name:'Cerro de Pasco Mine', country:'Peru', community:'Quechua', fpic:'Pending', undrip:52, ilo169:65, ifcPs7:48, sacredSites:5, tkImpact:'High', revPct:4.0, empGuarantee:150, infraCommit:'Hospital', grievances:18, resolved:9 },
  { id:8, name:'Dakota Access Spur', country:'USA', community:'Standing Rock Sioux', fpic:'Withheld', undrip:25, ilo169:20, ifcPs7:22, sacredSites:7, tkImpact:'Critical', revPct:0, empGuarantee:0, infraCommit:'None', grievances:42, resolved:5 },
  { id:9, name:'Lake Turkana Wind II', country:'Kenya', community:'Rendille/Samburu', fpic:'Partial', undrip:55, ilo169:48, ifcPs7:52, sacredSites:2, tkImpact:'Medium', revPct:1.5, empGuarantee:45, infraCommit:'Borehole', grievances:12, resolved:7 },
  { id:10, name:'Oyu Tolgoi Phase 2', country:'Mongolia', community:'Herder Communities', fpic:'Contested', undrip:42, ilo169:35, ifcPs7:40, sacredSites:3, tkImpact:'High', revPct:3.0, empGuarantee:200, infraCommit:'Pasture Rehab', grievances:22, resolved:10 },
  { id:11, name:'Quellaveco Water', country:'Peru', community:'Quechua/Aymara', fpic:'Obtained', undrip:82, ilo169:85, ifcPs7:78, sacredSites:1, tkImpact:'Low', revPct:4.5, empGuarantee:180, infraCommit:'Water System', grievances:5, resolved:5 },
  { id:12, name:'Adani Forest Clear', country:'Australia', community:'Wangan/Jagalingou', fpic:'Withheld', undrip:15, ilo169:10, ifcPs7:12, sacredSites:9, tkImpact:'Critical', revPct:0, empGuarantee:0, infraCommit:'None', grievances:38, resolved:2 },
  { id:13, name:'Belo Monte Dam', country:'Brazil', community:'Juruna/Arara', fpic:'Not Sought', undrip:22, ilo169:18, ifcPs7:20, sacredSites:5, tkImpact:'Critical', revPct:0.5, empGuarantee:30, infraCommit:'Partial Road', grievances:45, resolved:8 },
  { id:14, name:'Salween Dam', country:'Myanmar', community:'Karen/Shan', fpic:'Not Sought', undrip:10, ilo169:8, ifcPs7:10, sacredSites:12, tkImpact:'Critical', revPct:0, empGuarantee:0, infraCommit:'None', grievances:55, resolved:0 },
  { id:15, name:'Sami Wind Farm', country:'Norway', community:'Sami', fpic:'Obtained', undrip:88, ilo169:90, ifcPs7:85, sacredSites:1, tkImpact:'Low', revPct:4.0, empGuarantee:25, infraCommit:'Cultural Centre', grievances:4, resolved:4 },
  { id:16, name:'Greenland REE Mine', country:'Greenland', community:'Inuit', fpic:'Pending', undrip:65, ilo169:60, ifcPs7:62, sacredSites:2, tkImpact:'Medium', revPct:6.0, empGuarantee:80, infraCommit:'Training Centre', grievances:6, resolved:4 },
  { id:17, name:'Maori Geothermal', country:'New Zealand', community:'Maori/Ngati Tahu', fpic:'Obtained', undrip:95, ilo169:92, ifcPs7:90, sacredSites:0, tkImpact:'Low', revPct:8.0, empGuarantee:40, infraCommit:'Community Fund', grievances:1, resolved:1 },
  { id:18, name:'Willow AK Oil', country:'USA', community:'Inupiat', fpic:'Contested', undrip:38, ilo169:30, ifcPs7:35, sacredSites:3, tkImpact:'High', revPct:1.0, empGuarantee:50, infraCommit:'None', grievances:20, resolved:6 },
  { id:19, name:'Borneo Palm Clear', country:'Malaysia', community:'Penan', fpic:'Not Sought', undrip:12, ilo169:8, ifcPs7:10, sacredSites:6, tkImpact:'Critical', revPct:0, empGuarantee:0, infraCommit:'None', grievances:35, resolved:2 },
  { id:20, name:'Lapland Wind Farm', country:'Finland', community:'Sami', fpic:'Partial', undrip:70, ilo169:68, ifcPs7:72, sacredSites:1, tkImpact:'Medium', revPct:3.0, empGuarantee:15, infraCommit:'Reindeer Fence', grievances:7, resolved:5 },
];

const FPIC_DIST = [{ name:'Obtained', value:5 },{ name:'Pending', value:3 },{ name:'Contested', value:3 },{ name:'Withheld', value:3 },{ name:'Not Sought', value:4 },{ name:'Partial', value:2 }];
const FPIC_COLORS = [T.green, T.amber, T.orange, T.red, '#991b1b', T.blue];

export default function IndigenousRightsFpicPage() {
  const [tab, setTab] = useState(0);
  const [fpicFilter, setFpicFilter] = useState('All');
  const [watchlist, setWatchlist] = useState(false);
  const [alertSub, setAlertSub] = useState(false);

  const filtered = useMemo(() => fpicFilter === 'All' ? PROJECTS : PROJECTS.filter(p => p.fpic === fpicFilter), [fpicFilter]);

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
              <span style={{ background:T.navy, color:'#fff', fontFamily:T.mono, fontSize:11, padding:'3px 10px', borderRadius:4 }}>EP-CO4</span>
              <span style={{ fontFamily:T.mono, fontSize:11, color:T.textMut }}>INDIGENOUS RIGHTS & FPIC</span>
            </div>
            <h1 style={{ fontSize:22, fontWeight:700, color:T.navy, margin:'6px 0 2px' }}>Indigenous Rights & FPIC Tracker</h1>
            <p style={{ color:T.textSec, fontSize:13, margin:0 }}>Free Prior and Informed Consent compliance across 20 projects in indigenous territories</p>
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
        <select value={fpicFilter} onChange={e => setFpicFilter(e.target.value)} style={{ padding:'6px 12px', borderRadius:6, border:`1px solid ${T.border}`, fontFamily:T.font, fontSize:13 }}>
          <option value="All">All FPIC Statuses</option>
          {['Obtained','Pending','Contested','Withheld','Not Sought','Partial'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {tab === 0 && (
        <div>
          <div style={{ display:'flex', gap:16, marginBottom:20, flexWrap:'wrap' }}>
            {card('Projects Tracked', filtered.length, 'In indigenous territories', T.navy)}
            {card('Consent Obtained', PROJECTS.filter(p => p.fpic === 'Obtained').length, 'Full FPIC', T.green)}
            {card('Consent Withheld / Not Sought', PROJECTS.filter(p => p.fpic === 'Withheld' || p.fpic === 'Not Sought').length, 'High risk', T.red)}
            {card('Total Grievances', PROJECTS.reduce((s, p) => s + p.grievances, 0), PROJECTS.reduce((s, p) => s + p.resolved, 0) + ' resolved', T.amber)}
          </div>
          <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
            <div style={{ flex:1, background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, minWidth:300 }}>
              <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>FPIC Status Distribution</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart><Pie data={FPIC_DIST} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>{FPIC_DIST.map((_, i) => <Cell key={i} fill={FPIC_COLORS[i]} />)}</Pie><Tooltip /><Legend /></PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex:1, background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, minWidth:300 }}>
              <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Avg Framework Compliance</h3>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={[{ framework:'UNDRIP', score:Math.round(PROJECTS.reduce((s,p)=>s+p.undrip,0)/20) },{ framework:'ILO 169', score:Math.round(PROJECTS.reduce((s,p)=>s+p.ilo169,0)/20) },{ framework:'IFC PS7', score:Math.round(PROJECTS.reduce((s,p)=>s+p.ifcPs7,0)/20) }]}>
                  <PolarGrid stroke={T.border} />
                  <PolarAngleAxis dataKey="framework" tick={{ fontSize:11, fontFamily:T.mono }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize:9 }} />
                  <Radar dataKey="score" stroke={T.gold} fill={T.gold} fillOpacity={0.3} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', minWidth:900 }}>
            <thead><tr>{['Project','Country','Community','FPIC Status','Sacred Sites','TK Impact','Grievances'].map(h => <th key={h} style={{ padding:'8px 12px', textAlign:'left', borderBottom:`2px solid ${T.border}`, fontFamily:T.mono, fontSize:11, color:T.navy }}>{h}</th>)}</tr></thead>
            <tbody>{filtered.map((p, i) => (
              <tr key={i} style={{ borderBottom:`1px solid ${T.border}`, background:i%2===0?'transparent':T.bg }}>
                <td style={{ padding:'8px 12px', fontSize:13, fontWeight:600 }}>{p.name}</td>
                <td style={{ padding:'8px 12px', fontSize:13 }}>{p.country}</td>
                <td style={{ padding:'8px 12px', fontSize:13 }}>{p.community}</td>
                <td style={{ padding:'8px 12px' }}><span style={{ padding:'2px 8px', borderRadius:4, fontSize:11, fontFamily:T.mono, background:p.fpic==='Obtained'?T.green+'18':p.fpic==='Pending'||p.fpic==='Partial'?T.amber+'18':T.red+'18', color:p.fpic==='Obtained'?T.green:p.fpic==='Pending'||p.fpic==='Partial'?T.amber:T.red }}>{p.fpic}</span></td>
                <td style={{ padding:'8px 12px', fontSize:13, fontFamily:T.mono, color:p.sacredSites>5?T.red:T.textSec }}>{p.sacredSites}</td>
                <td style={{ padding:'8px 12px' }}><span style={{ padding:'2px 8px', borderRadius:4, fontSize:11, background:p.tkImpact==='Low'?T.green+'18':p.tkImpact==='Medium'?T.amber+'18':T.red+'18', color:p.tkImpact==='Low'?T.green:p.tkImpact==='Medium'?T.amber:T.red }}>{p.tkImpact}</span></td>
                <td style={{ padding:'8px 12px', fontSize:13, fontFamily:T.mono }}>{p.grievances} ({p.resolved} resolved)</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {tab === 2 && (
        <div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Framework Compliance Scores</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={filtered} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize:11, fontFamily:T.mono }} />
                <YAxis type="category" dataKey="name" width={140} tick={{ fontSize:9, fontFamily:T.mono }} />
                <Tooltip /><Legend />
                <Bar dataKey="undrip" fill={T.navy} name="UNDRIP" />
                <Bar dataKey="ilo169" fill={T.gold} name="ILO 169" />
                <Bar dataKey="ifcPs7" fill={T.green} name="IFC PS7" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 3 && (
        <div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, marginBottom:16 }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Sacred Sites at Risk by Project</h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={filtered.sort((a, b) => b.sacredSites - a.sacredSites)}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize:9, fontFamily:T.mono, angle:-30, textAnchor:'end' }} height={70} />
                <YAxis tick={{ fontSize:11, fontFamily:T.mono }} />
                <Tooltip />
                <Bar dataKey="sacredSites" name="Sacred Sites">{filtered.map((p, i) => <Cell key={i} fill={p.sacredSites > 5 ? T.red : p.sacredSites > 2 ? T.amber : T.green} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Traditional Knowledge Impact Distribution</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={[{ name:'Low', value:filtered.filter(p=>p.tkImpact==='Low').length },{ name:'Medium', value:filtered.filter(p=>p.tkImpact==='Medium').length },{ name:'High', value:filtered.filter(p=>p.tkImpact==='High').length },{ name:'Critical', value:filtered.filter(p=>p.tkImpact==='Critical').length }]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {[T.green, T.amber, T.orange, T.red].map((c, i) => <Cell key={i} fill={c} />)}
                </Pie><Tooltip /><Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 4 && (
        <div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Benefit Sharing: Revenue % & Employment Guarantees</h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={filtered.filter(p => p.revPct > 0)}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize:9, fontFamily:T.mono, angle:-30, textAnchor:'end' }} height={70} />
                <YAxis yAxisId="left" tick={{ fontSize:11, fontFamily:T.mono }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize:11, fontFamily:T.mono }} />
                <Tooltip /><Legend />
                <Bar yAxisId="left" dataKey="revPct" fill={T.gold} name="Revenue Share %" />
                <Bar yAxisId="right" dataKey="empGuarantee" fill={T.navy} name="Jobs Guaranteed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 5 && (
        <div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, marginBottom:16 }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Grievances Filed vs Resolved</h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={filtered.sort((a, b) => b.grievances - a.grievances)}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize:9, fontFamily:T.mono, angle:-30, textAnchor:'end' }} height={70} />
                <YAxis tick={{ fontSize:11, fontFamily:T.mono }} />
                <Tooltip /><Legend />
                <Bar dataKey="grievances" fill={T.red} name="Filed" />
                <Bar dataKey="resolved" fill={T.green} name="Resolved" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Resolution Rate</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={filtered.map(p => ({ name:p.name, rate:p.grievances>0?Math.round(p.resolved/p.grievances*100):0 }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize:9, fontFamily:T.mono, angle:-30, textAnchor:'end' }} height={70} />
                <YAxis tick={{ fontSize:11, fontFamily:T.mono }} domain={[0, 100]} />
                <Tooltip formatter={v => v + '%'} />
                <Bar dataKey="rate" name="Resolution %">{filtered.map((p, i) => { const rate = p.grievances > 0 ? p.resolved / p.grievances * 100 : 0; return <Cell key={i} fill={rate >= 80 ? T.green : rate >= 50 ? T.amber : T.red} />; })}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div style={{ marginTop:24, padding:16, background:T.navy+'08', border:`1px solid ${T.navy}20`, borderRadius:8 }}>
        <div style={{ fontFamily:T.mono, fontSize:11, color:T.navy, fontWeight:600, marginBottom:4 }}>REFERENCE DATA</div>
        <div style={{ fontSize:12, color:T.textSec, lineHeight:1.6 }}>
          UN Declaration on the Rights of Indigenous Peoples (UNDRIP) · ILO Convention 169 · IFC Performance Standard 7 · UN-REDD Programme FPIC Guidelines · Cultural Heritage Impact Assessment (CHIA) Protocol
        </div>
      </div>
    </div>
  );
}
