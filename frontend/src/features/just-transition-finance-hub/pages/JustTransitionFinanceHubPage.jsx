import React, { useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

const T = { bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb', orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a', font:"'DM Sans','SF Pro Display',system-ui,sans-serif", mono:"'JetBrains Mono','SF Mono','Fira Code',monospace" };
const TABS = ['Finance Overview','JTF Instruments','Sovereign JT Bonds','JETP Tracker','MDB JT Programmes','Impact Measurement'];

const INSTRUMENTS = [
  { name:'EU Just Transition Fund', type:'Grant/Loan', amountBn:17.5, region:'EU', status:'Active', disbursedPct:42 },
  { name:'JETP South Africa', type:'Concessional Loan', amountBn:8.5, region:'South Africa', status:'Active', disbursedPct:18 },
  { name:'JETP Indonesia', type:'Blended Finance', amountBn:20.0, region:'Indonesia', status:'Active', disbursedPct:8 },
  { name:'JETP Vietnam', type:'Concessional Loan', amountBn:15.5, region:'Vietnam', status:'Structuring', disbursedPct:2 },
  { name:'JETP Senegal', type:'Concessional Loan', amountBn:2.5, region:'Senegal', status:'Announced', disbursedPct:0 },
  { name:'UK Transition Fund', type:'Grant', amountBn:1.2, region:'UK', status:'Active', disbursedPct:65 },
  { name:'Germany Coal Regions', type:'Grant/Subsidy', amountBn:14.0, region:'Germany', status:'Active', disbursedPct:38 },
  { name:'Canada Coal Transition', type:'Grant/Loan', amountBn:2.8, region:'Canada', status:'Active', disbursedPct:55 },
];

const BONDS = [
  { issuer:'Republic of Chile', amount:2.0, coupon:4.25, tenor:10, framework:'ICMA JT', rating:'A', year:2024 },
  { issuer:'Republic of Indonesia', amount:1.5, coupon:5.10, tenor:7, framework:'ASEAN JT', rating:'BBB', year:2025 },
  { issuer:'European Investment Bank', amount:3.0, coupon:2.85, tenor:15, framework:'EU JTM', rating:'AAA', year:2024 },
  { issuer:'South Africa (SOE)', amount:1.0, coupon:8.50, tenor:5, framework:'JETP Aligned', rating:'BB', year:2025 },
  { issuer:'Republic of Poland', amount:1.5, coupon:4.80, tenor:10, framework:'EU JTF', rating:'A-', year:2024 },
];

const MDB_PROGRAMMES = [
  { mdb:'World Bank', programme:'Coal Mine Closure', amountBn:4.2, countries:8, jobsTarget:45000, status:'Active' },
  { mdb:'ADB', programme:'Energy Transition Mechanism', amountBn:3.8, countries:5, jobsTarget:32000, status:'Active' },
  { mdb:'AfDB', programme:'Africa JT Facility', amountBn:1.5, countries:12, jobsTarget:28000, status:'Pilot' },
  { mdb:'EBRD', programme:'Green Economy Trans.', amountBn:2.8, countries:15, jobsTarget:52000, status:'Active' },
  { mdb:'IDB', programme:'LAC Just Transition', amountBn:1.2, countries:6, jobsTarget:18000, status:'Design' },
];

const IMPACT_DATA = [
  { year:2022, jobsTransitioned:12000, emissionsAvoided:8.5, wellbeingIndex:62 },
  { year:2023, jobsTransitioned:28000, emissionsAvoided:22.0, wellbeingIndex:64 },
  { year:2024, jobsTransitioned:52000, emissionsAvoided:45.0, wellbeingIndex:67 },
  { year:2025, jobsTransitioned:85000, emissionsAvoided:72.0, wellbeingIndex:70 },
];

const FLOW_DATA = [
  { source:'Public Finance', value:42 },
  { source:'MDB Lending', value:28 },
  { source:'Private Capital', value:18 },
  { source:'Philanthropic', value:8 },
  { source:'Sovereign Bonds', value:4 },
];

const PALETTE = [T.navy, T.gold, T.green, T.blue, T.orange, T.purple, T.teal, T.sage];

export default function JustTransitionFinanceHubPage() {
  const [tab, setTab] = useState(0);
  const [watchlist, setWatchlist] = useState(false);
  const [alertSub, setAlertSub] = useState(false);

  const totalFinance = INSTRUMENTS.reduce((s, i) => s + i.amountBn, 0);

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
              <span style={{ background:T.navy, color:'#fff', fontFamily:T.mono, fontSize:11, padding:'3px 10px', borderRadius:4 }}>EP-CO6</span>
              <span style={{ fontFamily:T.mono, fontSize:11, color:T.textMut }}>JUST TRANSITION FINANCE HUB</span>
            </div>
            <h1 style={{ fontSize:22, fontWeight:700, color:T.navy, margin:'6px 0 2px' }}>Just Transition Finance Hub</h1>
            <p style={{ color:T.textSec, fontSize:13, margin:0 }}>JTF instruments, JETP deals, sovereign bonds & MDB programmes</p>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => setWatchlist(!watchlist)} style={{ padding:'6px 14px', borderRadius:6, border:`1px solid ${watchlist?T.gold:T.border}`, background:watchlist?T.gold+'18':T.surface, color:T.navy, fontFamily:T.font, fontSize:12, cursor:'pointer' }}>{watchlist?'★ Watchlisted':'☆ Watchlist'}</button>
            <button onClick={() => setAlertSub(!alertSub)} style={{ padding:'6px 14px', borderRadius:6, border:`1px solid ${alertSub?T.green:T.border}`, background:alertSub?T.green+'18':T.surface, color:T.navy, fontFamily:T.font, fontSize:12, cursor:'pointer' }}>{alertSub?'🔔 Subscribed':'🔕 Alerts'}</button>
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
            {card('Total JT Finance', '$' + totalFinance.toFixed(1) + 'B', 'Committed globally', T.navy)}
            {card('JETP Deals', '5', '$46.5B total', T.green)}
            {card('Sovereign JT Bonds', '$' + BONDS.reduce((s, b) => s + b.amount, 0).toFixed(1) + 'B', BONDS.length + ' issuances', T.gold)}
            {card('MDB Programmes', MDB_PROGRAMMES.length.toString(), MDB_PROGRAMMES.reduce((s, m) => s + m.countries, 0) + ' countries', T.blue)}
          </div>
          <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
            <div style={{ flex:2, background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, minWidth:400 }}>
              <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Finance by Instrument ($B)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={INSTRUMENTS} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize:11, fontFamily:T.mono }} />
                  <YAxis type="category" dataKey="name" width={160} tick={{ fontSize:9, fontFamily:T.mono }} />
                  <Tooltip formatter={v => '$' + v + 'B'} />
                  <Bar dataKey="amountBn" name="Amount ($B)">{INSTRUMENTS.map((_, i) => <Cell key={i} fill={PALETTE[i]} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex:1, background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, minWidth:260 }}>
              <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Capital Source Mix</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={FLOW_DATA} dataKey="value" nameKey="source" cx="50%" cy="50%" outerRadius={90} label>
                    {FLOW_DATA.map((_, i) => <Cell key={i} fill={PALETTE[i]} />)}
                  </Pie><Tooltip /><Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, overflowX:'auto' }}>
          <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>JTF Instrument Details</h3>
          <table style={{ width:'100%', borderCollapse:'collapse', minWidth:800 }}>
            <thead><tr>{['Instrument','Type','Amount ($B)','Region','Status','Disbursed %'].map(h => <th key={h} style={{ padding:'8px 12px', textAlign:'left', borderBottom:`2px solid ${T.border}`, fontFamily:T.mono, fontSize:11, color:T.navy }}>{h}</th>)}</tr></thead>
            <tbody>{INSTRUMENTS.map((inst, i) => (
              <tr key={i} style={{ borderBottom:`1px solid ${T.border}`, background:i%2===0?'transparent':T.bg }}>
                <td style={{ padding:'8px 12px', fontSize:13, fontWeight:600 }}>{inst.name}</td>
                <td style={{ padding:'8px 12px', fontSize:13 }}>{inst.type}</td>
                <td style={{ padding:'8px 12px', fontSize:13, fontFamily:T.mono }}>${inst.amountBn}B</td>
                <td style={{ padding:'8px 12px', fontSize:13 }}>{inst.region}</td>
                <td style={{ padding:'8px 12px' }}><span style={{ padding:'2px 8px', borderRadius:4, fontSize:11, fontFamily:T.mono, background:inst.status==='Active'?T.green+'18':inst.status==='Structuring'?T.amber+'18':T.blue+'18', color:inst.status==='Active'?T.green:inst.status==='Structuring'?T.amber:T.blue }}>{inst.status}</span></td>
                <td style={{ padding:'8px 12px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ flex:1, height:8, background:T.border, borderRadius:4 }}><div style={{ width:inst.disbursedPct+'%', height:'100%', background:T.green, borderRadius:4 }} /></div>
                    <span style={{ fontFamily:T.mono, fontSize:11 }}>{inst.disbursedPct}%</span>
                  </div>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {tab === 2 && (
        <div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, marginBottom:16 }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Sovereign JT Bond Issuances</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={BONDS}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="issuer" tick={{ fontSize:9, fontFamily:T.mono, angle:-15, textAnchor:'end' }} height={50} />
                <YAxis tick={{ fontSize:11, fontFamily:T.mono }} />
                <Tooltip formatter={v => '$' + v + 'B'} /><Legend />
                <Bar dataKey="amount" fill={T.gold} name="Amount ($B)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Coupon Rate vs Tenor</h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={BONDS}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="issuer" tick={{ fontSize:9, fontFamily:T.mono }} />
                <YAxis yAxisId="left" tick={{ fontSize:11, fontFamily:T.mono }} /><YAxis yAxisId="right" orientation="right" tick={{ fontSize:11, fontFamily:T.mono }} />
                <Tooltip /><Legend />
                <Line yAxisId="left" dataKey="coupon" stroke={T.red} strokeWidth={2} name="Coupon %" dot={{ r:4 }} />
                <Line yAxisId="right" dataKey="tenor" stroke={T.navy} strokeWidth={2} name="Tenor (yrs)" dot={{ r:4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 3 && (
        <div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, marginBottom:16 }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>JETP Commitments ($B)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={INSTRUMENTS.filter(i => i.name.startsWith('JETP'))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="region" tick={{ fontSize:11, fontFamily:T.mono }} />
                <YAxis tick={{ fontSize:11, fontFamily:T.mono }} />
                <Tooltip formatter={v => '$' + v + 'B'} /><Legend />
                <Bar dataKey="amountBn" fill={T.navy} name="Committed ($B)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>JETP Disbursement Progress</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={INSTRUMENTS.filter(i => i.name.startsWith('JETP'))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="region" tick={{ fontSize:11, fontFamily:T.mono }} />
                <YAxis tick={{ fontSize:11, fontFamily:T.mono }} domain={[0, 100]} />
                <Tooltip formatter={v => v + '%'} />
                <Bar dataKey="disbursedPct" name="Disbursed %">{INSTRUMENTS.filter(i => i.name.startsWith('JETP')).map((inst, i) => <Cell key={i} fill={inst.disbursedPct > 10 ? T.green : T.amber} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 4 && (
        <div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, marginBottom:16 }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>MDB JT Programme Lending ($B)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={MDB_PROGRAMMES}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="mdb" tick={{ fontSize:11, fontFamily:T.mono }} />
                <YAxis tick={{ fontSize:11, fontFamily:T.mono }} />
                <Tooltip /><Legend />
                <Bar dataKey="amountBn" fill={T.blue} name="Amount ($B)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(250px, 1fr))', gap:12 }}>
            {MDB_PROGRAMMES.map((m, i) => (
              <div key={i} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:14 }}>
                <div style={{ fontWeight:600, color:T.navy, fontSize:14 }}>{m.mdb}</div>
                <div style={{ fontSize:12, color:T.textSec, marginTop:2 }}>{m.programme}</div>
                <div style={{ display:'flex', gap:12, marginTop:8, flexWrap:'wrap' }}>
                  <span style={{ fontFamily:T.mono, fontSize:11, color:T.blue }}>${m.amountBn}B</span>
                  <span style={{ fontFamily:T.mono, fontSize:11, color:T.textSec }}>{m.countries} countries</span>
                  <span style={{ fontFamily:T.mono, fontSize:11, color:T.green }}>{m.jobsTarget.toLocaleString()} jobs target</span>
                </div>
                <span style={{ marginTop:8, display:'inline-block', padding:'2px 8px', borderRadius:4, fontSize:11, fontFamily:T.mono, background:m.status==='Active'?T.green+'18':T.amber+'18', color:m.status==='Active'?T.green:T.amber }}>{m.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 5 && (
        <div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, marginBottom:16 }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Impact Metrics Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={IMPACT_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize:11, fontFamily:T.mono }} />
                <YAxis yAxisId="left" tick={{ fontSize:11, fontFamily:T.mono }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize:11, fontFamily:T.mono }} />
                <Tooltip /><Legend />
                <Line yAxisId="left" dataKey="jobsTransitioned" stroke={T.green} strokeWidth={2} name="Jobs Transitioned (000s)" dot={{ r:4 }} />
                <Line yAxisId="left" dataKey="emissionsAvoided" stroke={T.navy} strokeWidth={2} name="Emissions Avoided (MtCO₂)" dot={{ r:4 }} />
                <Line yAxisId="right" dataKey="wellbeingIndex" stroke={T.gold} strokeWidth={2} name="Community Wellbeing Index" dot={{ r:4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Cumulative Jobs Transitioned</h3>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={IMPACT_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize:11, fontFamily:T.mono }} />
                <YAxis tick={{ fontSize:11, fontFamily:T.mono }} />
                <Tooltip /><Legend />
                <Area type="monotone" dataKey="jobsTransitioned" fill={T.green+'30'} stroke={T.green} name="Jobs (000s)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div style={{ marginTop:24, padding:16, background:T.navy+'08', border:`1px solid ${T.navy}20`, borderRadius:8 }}>
        <div style={{ fontFamily:T.mono, fontSize:11, color:T.navy, fontWeight:600, marginBottom:4 }}>REFERENCE DATA</div>
        <div style={{ fontSize:12, color:T.textSec, lineHeight:1.6 }}>
          EU Just Transition Mechanism · JETP Secretariat Reports · Climate Investment Funds · World Bank Climate Finance Data · OECD DAC Climate-Related Finance · Grantham Research Institute on JT Finance
        </div>
      </div>
    </div>
  );
}
