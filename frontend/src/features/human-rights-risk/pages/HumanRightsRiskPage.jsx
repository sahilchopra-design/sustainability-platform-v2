import React, { useState } from 'react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const T = {
  bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7',
  border:'#e5e0d8', borderL:'#d5cfc5',
  navy:'#1b3a5c', navyL:'#2c5a8c',
  gold:'#c5a96a', goldL:'#d4be8a',
  sage:'#5a8a6a', sageL:'#7ba67d', teal:'#5a8a6a',
  text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae',
  red:'#dc2626', green:'#16a34a', amber:'#d97706',
  card:'0 1px 4px rgba(27,58,92,0.06)',
  cardH:'0 4px 16px rgba(27,58,92,0.1)',
  font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif",
};
const ACCENT = '#dc2626';
const tip = { contentStyle:{ background:T.surface, border:'1px solid '+T.border, borderRadius:8, color:T.text }, labelStyle:{ color:T.textSec } };
const sr = s => { let x = Math.sin(s+1)*10000; return x - Math.floor(x); };

const MONTHS = ['Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb'];

const slaveryTrend = MONTHS.map((m,i) => ({ month: m, incidents: Math.round(80 + sr(i*3)*60 + i*1.5) }));

const sectors = [
  { name:'Apparel', forced: 8.7, child: 12.4, tiers: 4, ungp: 34 },
  { name:'Electronics', forced: 7.9, child: 8.1, tiers: 5, ungp: 41 },
  { name:'Agriculture', forced: 8.2, child: 18.6, tiers: 3, ungp: 29 },
  { name:'Mining', forced: 7.5, child: 11.2, tiers: 3, ungp: 38 },
  { name:'Construction', forced: 6.8, child: 7.4, tiers: 2, ungp: 45 },
  { name:'Fishing', forced: 9.1, child: 9.8, tiers: 2, ungp: 22 },
  { name:'Domestic Work', forced: 8.4, child: 14.3, tiers: 1, ungp: 18 },
  { name:'Manufacturing', forced: 6.3, child: 6.9, tiers: 4, ungp: 52 },
];

const regulations = [
  { name:'EU CSDDD', jurisdiction:'EU', status:'Enacted', scope:'500+ employees', obligation:'Full value-chain DD', penalty:'5% revenue', effective:'2024' },
  { name:'German LkSG', jurisdiction:'Germany', status:'Active', scope:'1,000+ employees', obligation:'Direct supplier DD', penalty:'2% revenue', effective:'2023' },
  { name:'French Duty of Vigilance', jurisdiction:'France', status:'Active', scope:'5,000+ employees', obligation:'Vigilance plan required', penalty:'Civil liability', effective:'2017' },
  { name:'Norwegian Transparency Act', jurisdiction:'Norway', status:'Active', scope:'250+ employees', obligation:'DD & public reporting', penalty:'Fines + orders', effective:'2022' },
  { name:'UK Modern Slavery Act', jurisdiction:'UK', status:'Active', scope:'£36M+ turnover', obligation:'Annual statement', penalty:'Reputational only', effective:'2015' },
  { name:'Australian MSA', jurisdiction:'Australia', status:'Active', scope:'AUD$100M+ revenue', obligation:'Annual report', penalty:'Civil penalties', effective:'2018' },
  { name:'US UFLPA', jurisdiction:'USA', status:'Active', scope:'All importers', obligation:'Rebuttable presumption', penalty:'Import ban', effective:'2022' },
  { name:'California SB 657', jurisdiction:'USA/CA', status:'Active', scope:'$100M+ revenue', obligation:'Supply chain disclosure', penalty:'Civil fines', effective:'2012' },
];

const countries = [
  { name:'China', overall:7.8, forced:7.9, child:5.2, foa:1.8, remedy:3.1 },
  { name:'India', overall:6.9, forced:6.4, child:7.1, foa:3.2, remedy:4.0 },
  { name:'Bangladesh', overall:7.2, forced:6.8, child:6.9, foa:2.4, remedy:3.6 },
  { name:'Vietnam', overall:6.4, forced:6.1, child:5.8, foa:2.0, remedy:4.2 },
  { name:'Myanmar', overall:8.9, forced:8.7, child:7.8, foa:1.2, remedy:2.1 },
  { name:'Indonesia', overall:6.1, forced:5.9, child:6.2, foa:3.4, remedy:4.5 },
  { name:'Brazil', overall:5.8, forced:5.6, child:5.4, foa:4.1, remedy:5.2 },
  { name:'Turkey', overall:5.4, forced:5.1, child:4.8, foa:2.8, remedy:4.8 },
  { name:'Mexico', overall:5.9, forced:5.7, child:5.6, foa:3.6, remedy:4.9 },
  { name:'Ethiopia', overall:7.1, forced:6.9, child:8.2, foa:2.2, remedy:2.8 },
];

const companies = [
  { id:'A', sector:'Apparel', maturity:4, audits:320, grievance:'Y', fund:12.4, disclosure:78 },
  { id:'B', sector:'Electronics', maturity:3, audits:180, grievance:'Y', fund:8.1, disclosure:62 },
  { id:'C', sector:'Agriculture', maturity:2, audits:95, grievance:'N', fund:2.3, disclosure:41 },
  { id:'D', sector:'Mining', maturity:3, audits:140, grievance:'Y', fund:6.7, disclosure:55 },
  { id:'E', sector:'Construction', maturity:1, audits:40, grievance:'N', fund:0.8, disclosure:28 },
  { id:'F', sector:'Retail', maturity:4, audits:410, grievance:'Y', fund:15.2, disclosure:82 },
  { id:'G', sector:'Food & Bev', maturity:2, audits:120, grievance:'N', fund:3.4, disclosure:37 },
  { id:'H', sector:'Manufacturing', maturity:5, audits:520, grievance:'Y', fund:22.6, disclosure:91 },
];

const cases = [
  { name:'Total/Sherpa', jurisdiction:'France', year:2019, allegation:'Forced labour Myanmar', outcome:'Settled', exposure:45 },
  { name:'KiK', jurisdiction:'Germany', year:2016, allegation:'Factory fire liability', outcome:'Dismissed', exposure:5 },
  { name:'Vedanta/Lungowe', jurisdiction:'UK', year:2019, allegation:'Pollution & community rights', outcome:'Settled £190M', exposure:250 },
  { name:'Apple/Cobalt', jurisdiction:'USA', year:2019, allegation:'Child labour cobalt mining', outcome:'Ongoing', exposure:120 },
  { name:'Nestlé/Cocoa', jurisdiction:'USA', year:2021, allegation:'Child labour cocoa supply', outcome:'SCOTUS dismissed', exposure:30 },
  { name:'Shell/Nigeria', jurisdiction:'Netherlands', year:2021, allegation:'Oil spill community harm', outcome:'Shell liable', exposure:500 },
];

const litigationTrend = MONTHS.map((m,i) => ({ month: m, cases: Math.round(30 + sr(i*7)*25 + i*1.2) }));

const riskColor = v => v > 7 ? T.red : v > 4 ? T.amber : T.green;
const matColor = v => v >= 4 ? T.green : v >= 2 ? T.amber : T.red;
const TABS = ['Overview','Due Diligence','Country Risk','Corporate Compliance','Litigation'];

export default function HumanRightsRiskPage() {
  const [tab, setTab] = useState(0);

  return (
    <div style={{ background:T.bg, minHeight:'100vh', color:T.text, fontFamily:T.font, padding:24 }}>
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontSize:22, fontWeight:700, margin:0 }}>Human Rights &amp; Supply Chain Risk</h1>
        <p style={{ color:T.textSec, margin:'4px 0 0', fontSize:13 }}>EP-AD2 · UNGP, CSDDD, LkSG &amp; Modern Slavery Frameworks</p>
      </div>

      {/* Tab Bar */}
      <div style={{ display:'flex', gap:4, borderBottom:'1px solid '+T.border, marginBottom:24 }}>
        {TABS.map((t,i) => (
          <button key={t} onClick={() => setTab(i)} style={{ background:'none', border:'none', color: tab===i ? T.text : T.textSec, padding:'8px 16px', cursor:'pointer', borderBottom: tab===i ? '2px solid '+ACCENT : '2px solid transparent', fontSize:13, fontWeight: tab===i ? 600 : 400 }}>{t}</button>
        ))}
      </div>

      {/* Tab 1 — Overview */}
      {tab === 0 && (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 }}>
            {[['40.3M','Modern Slaves'],['160M','Child Labourers'],['EU CSDDD','Enacted 2024'],['UNGPs','93 Countries']].map(([v,l]) => (
              <div key={l} style={{ background:T.surface, border:'1px solid '+T.border, borderRadius:8, padding:16 }}>
                <div style={{ fontSize:22, fontWeight:700, color:ACCENT }}>{v}</div>
                <div style={{ fontSize:12, color:T.textSec, marginTop:4 }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{ background:T.surface, border:'1px solid '+T.border, borderRadius:8, padding:16, marginBottom:24 }}>
            <h3 style={{ margin:'0 0 12px', fontSize:14 }}>High-Risk Sector Exposure</h3>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr style={{ color:T.textSec }}>
                  {['Sector','Forced Labour Risk','Child Labour %','Supply Tiers','UNGP Alignment %'].map(h => (
                    <th key={h} style={{ textAlign:'left', padding:'6px 8px', borderBottom:'1px solid '+T.border }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sectors.map(s => (
                  <tr key={s.name} style={{ borderBottom:'1px solid '+T.border }}>
                    <td style={{ padding:'6px 8px', fontWeight:600 }}>{s.name}</td>
                    <td style={{ padding:'6px 8px', color: riskColor(s.forced) }}>{s.forced.toFixed(1)}</td>
                    <td style={{ padding:'6px 8px' }}>{s.child.toFixed(1)}%</td>
                    <td style={{ padding:'6px 8px' }}>{s.tiers}</td>
                    <td style={{ padding:'6px 8px', color:T.textSec }}>{s.ungp}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ background:T.surface, border:'1px solid '+T.border, borderRadius:8, padding:16 }}>
            <h3 style={{ margin:'0 0 12px', fontSize:14 }}>Modern Slavery Incident Trend (24 Months)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={slaveryTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="month" tick={{ fill:T.textSec, fontSize:11 }} />
                <YAxis tick={{ fill:T.textSec, fontSize:11 }} />
                <Tooltip {...tip} />
                <Area type="monotone" dataKey="incidents" stroke={ACCENT} fill={ACCENT} fillOpacity={0.15} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 2 — Due Diligence */}
      {tab === 1 && (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:24 }}>
            {[['12','Mandatory DD Jurisdictions'],['50,000+','Companies in Scope'],['$4.2M','Avg Compliance Cost']].map(([v,l]) => (
              <div key={l} style={{ background:T.surface, border:'1px solid '+T.border, borderRadius:8, padding:16 }}>
                <div style={{ fontSize:22, fontWeight:700, color:ACCENT }}>{v}</div>
                <div style={{ fontSize:12, color:T.textSec, marginTop:4 }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12 }}>
            {regulations.map(r => (
              <div key={r.name} style={{ background:T.surface, border:'1px solid '+T.border, borderRadius:8, padding:14 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                  <span style={{ fontWeight:700, fontSize:13 }}>{r.name}</span>
                  <span style={{ background: r.status==='Enacted' ? ACCENT+'33' : T.navy, color: r.status==='Enacted' ? ACCENT : T.teal, fontSize:11, padding:'2px 8px', borderRadius:12 }}>{r.status}</span>
                </div>
                <div style={{ fontSize:11, color:T.textSec, lineHeight:1.8 }}>
                  <div><span style={{ color:T.textMut }}>Jurisdiction:</span> {r.jurisdiction}</div>
                  <div><span style={{ color:T.textMut }}>Scope:</span> {r.scope}</div>
                  <div><span style={{ color:T.textMut }}>Obligation:</span> {r.obligation}</div>
                  <div><span style={{ color:T.textMut }}>Penalty:</span> <span style={{ color:T.amber }}>{r.penalty}</span></div>
                  <div><span style={{ color:T.textMut }}>Effective:</span> {r.effective}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3 — Country Risk Matrix */}
      {tab === 2 && (
        <div>
          <div style={{ background:T.surface, border:'1px solid '+T.border, borderRadius:8, padding:16, marginBottom:24 }}>
            <h3 style={{ margin:'0 0 12px', fontSize:14 }}>Country HR Risk Scores (0–10 scale)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={countries} margin={{ top:4, right:16, left:0, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fill:T.textSec, fontSize:11 }} />
                <YAxis domain={[0,10]} tick={{ fill:T.textSec, fontSize:11 }} />
                <Tooltip {...tip} />
                <Bar dataKey="overall" radius={[3,3,0,0]}>
                  {countries.map((c,i) => <Cell key={i} fill={riskColor(c.overall)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display:'flex', gap:16, marginTop:8, fontSize:11, color:T.textSec }}>
              {[['High Risk (>7)',T.red],['Medium (4–7)',T.amber],['Lower (<4)',T.green]].map(([l,c]) => (
                <span key={l}><span style={{ display:'inline-block', width:10, height:10, background:c, borderRadius:2, marginRight:4 }} />{l}</span>
              ))}
              <span style={{ marginLeft:'auto' }}>ITUC Global Rights Index: 1 (best) — 5+ (no guarantee)</span>
            </div>
          </div>
          <div style={{ background:T.surface, border:'1px solid '+T.border, borderRadius:8, padding:16 }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr style={{ color:T.textSec }}>
                  {['Country','Overall','Forced Labour','Child Labour','Freedom Assoc.','Remedy Access'].map(h => (
                    <th key={h} style={{ textAlign:'left', padding:'6px 8px', borderBottom:'1px solid '+T.border }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {countries.map(c => (
                  <tr key={c.name} style={{ borderBottom:'1px solid '+T.border }}>
                    <td style={{ padding:'6px 8px', fontWeight:600 }}>{c.name}</td>
                    <td style={{ padding:'6px 8px', color:riskColor(c.overall), fontWeight:600 }}>{c.overall}</td>
                    <td style={{ padding:'6px 8px', color:riskColor(c.forced) }}>{c.forced}</td>
                    <td style={{ padding:'6px 8px', color:riskColor(c.child) }}>{c.child}</td>
                    <td style={{ padding:'6px 8px', color:T.textSec }}>{c.foa}</td>
                    <td style={{ padding:'6px 8px', color:T.textSec }}>{c.remedy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4 — Corporate Compliance */}
      {tab === 3 && (
        <div>
          <div style={{ display:'flex', gap:16, marginBottom:16, fontSize:12, color:T.textSec }}>
            {['Protect','Respect','Remedy'].map(p => (
              <div key={p} style={{ background:T.navy, border:'1px solid '+T.border, borderRadius:6, padding:'6px 16px', color:T.teal, fontWeight:600 }}>UNGP: {p}</div>
            ))}
          </div>
          <div style={{ background:T.surface, border:'1px solid '+T.border, borderRadius:8, padding:16, marginBottom:24 }}>
            <h3 style={{ margin:'0 0 12px', fontSize:14 }}>Disclosure Scores by Company</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={companies} margin={{ top:4, right:16, left:0, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="id" tick={{ fill:T.textSec, fontSize:11 }} />
                <YAxis domain={[0,100]} tick={{ fill:T.textSec, fontSize:11 }} />
                <Tooltip {...tip} />
                <Bar dataKey="disclosure" radius={[3,3,0,0]}>
                  {companies.map((c,i) => <Cell key={i} fill={c.disclosure >= 70 ? T.green : c.disclosure >= 45 ? T.amber : T.red} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background:T.surface, border:'1px solid '+T.border, borderRadius:8, padding:16 }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr style={{ color:T.textSec }}>
                  {['Co.','Sector','DD Maturity','Audits/yr','Grievance','Fund $M','Disclosure'].map(h => (
                    <th key={h} style={{ textAlign:'left', padding:'6px 8px', borderBottom:'1px solid '+T.border }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {companies.map(c => (
                  <tr key={c.id} style={{ borderBottom:'1px solid '+T.border }}>
                    <td style={{ padding:'6px 8px', fontWeight:700 }}>{c.id}</td>
                    <td style={{ padding:'6px 8px', color:T.textSec }}>{c.sector}</td>
                    <td style={{ padding:'6px 8px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <div style={{ width:60, height:6, background:T.border, borderRadius:3 }}>
                          <div style={{ width:(c.maturity/5*100)+'%', height:'100%', background:matColor(c.maturity), borderRadius:3 }} />
                        </div>
                        <span style={{ color:matColor(c.maturity) }}>{c.maturity}/5</span>
                      </div>
                    </td>
                    <td style={{ padding:'6px 8px' }}>{c.audits}</td>
                    <td style={{ padding:'6px 8px', color: c.grievance==='Y' ? T.green : T.red }}>{c.grievance}</td>
                    <td style={{ padding:'6px 8px' }}>{c.fund}</td>
                    <td style={{ padding:'6px 8px', color: c.disclosure>=70 ? T.green : c.disclosure>=45 ? T.amber : T.red }}>{c.disclosure}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5 — Litigation */}
      {tab === 4 && (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:24 }}>
            {[['847','HR Cases Filed 2023'],['$28M','Avg Settlement'],['23%','Cases Won by Plaintiffs']].map(([v,l]) => (
              <div key={l} style={{ background:T.surface, border:'1px solid '+T.border, borderRadius:8, padding:16 }}>
                <div style={{ fontSize:22, fontWeight:700, color:ACCENT }}>{v}</div>
                <div style={{ fontSize:12, color:T.textSec, marginTop:4 }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12, marginBottom:24 }}>
            {cases.map(c => (
              <div key={c.name} style={{ background:T.surface, border:'1px solid '+T.border, borderRadius:8, padding:14 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                  <span style={{ fontWeight:700, fontSize:13 }}>{c.name}</span>
                  <span style={{ fontSize:11, color:T.textSec }}>{c.year}</span>
                </div>
                <div style={{ fontSize:11, color:T.textSec, lineHeight:1.8 }}>
                  <div><span style={{ color:T.textMut }}>Jurisdiction:</span> {c.jurisdiction}</div>
                  <div><span style={{ color:T.textMut }}>Allegation:</span> {c.allegation}</div>
                  <div><span style={{ color:T.textMut }}>Outcome:</span> <span style={{ color: c.outcome.includes('Settled') || c.outcome.includes('liable') ? T.amber : T.textSec }}>{c.outcome}</span></div>
                  <div><span style={{ color:T.textMut }}>Exposure:</span> <span style={{ color:ACCENT }}>${c.exposure}M</span></div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ background:T.surface, border:'1px solid '+T.border, borderRadius:8, padding:16 }}>
            <h3 style={{ margin:'0 0 12px', fontSize:14 }}>HR Litigation Trend (24 Months)</h3>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={litigationTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="month" tick={{ fill:T.textSec, fontSize:11 }} />
                <YAxis tick={{ fill:T.textSec, fontSize:11 }} />
                <Tooltip {...tip} />
                <Line type="monotone" dataKey="cases" stroke={ACCENT} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
