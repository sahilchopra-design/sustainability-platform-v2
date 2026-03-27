import React, { useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const sr = s => { let x = Math.sin(s+1)*10000; return x - Math.floor(x); };

const T = {
  bg:'#0f172a', surface:'#1e293b', border:'#334155', navy:'#1e3a5f',
  gold:'#f59e0b', sage:'#10b981', text:'#f1f5f9', textSec:'#94a3b8',
  textMut:'#64748b', red:'#ef4444', green:'#10b981', amber:'#f59e0b',
  teal:'#14b8a6', font:"'Inter',sans-serif"
};
const ACCENT = '#8b5cf6';

const tip = {
  contentStyle:{ background:T.surface, border:'1px solid '+T.border, borderRadius:8, color:T.text },
  labelStyle:{ color:T.textSec }
};

// Tab 1 data
const countryWageData = [
  { country:'Bangladesh', minWage:0.68, ankBench:2.85, gap:76, unionDensity:4, cbCoverage:6 },
  { country:'India',      minWage:1.12, ankBench:2.60, gap:57, unionDensity:9, cbCoverage:12 },
  { country:'Vietnam',    minWage:1.43, ankBench:2.90, gap:51, unionDensity:11, cbCoverage:18 },
  { country:'Indonesia',  minWage:1.55, ankBench:2.75, gap:44, unionDensity:8, cbCoverage:14 },
  { country:'Brazil',     minWage:2.10, ankBench:3.40, gap:38, unionDensity:17, cbCoverage:39 },
  { country:'Mexico',     minWage:1.92, ankBench:3.10, gap:38, unionDensity:13, cbCoverage:28 },
  { country:'Philippines',minWage:1.78, ankBench:2.95, gap:40, unionDensity:10, cbCoverage:16 },
  { country:'Germany',    minWage:13.80, ankBench:14.50, gap:5, unionDensity:16, cbCoverage:56 },
];

const wageTrendData = Array.from({length:24},(_,i)=>({
  month:`M${i+1}`,
  gap: +(53 - i*0.4 + (sr(i*7)-0.5)*3).toFixed(1)
}));

// Tab 2 data
const sectorData = [
  { sector:'Retail',         median:10.2, bench:14.5, gap:30, fmRatio:0.82, perm:55, temp:30, gig:15 },
  { sector:'Hospitality',    median:8.9,  bench:14.5, gap:39, fmRatio:0.78, perm:40, temp:35, gig:25 },
  { sector:'Agriculture',    median:7.4,  bench:13.8, gap:46, fmRatio:0.71, perm:30, temp:50, gig:20 },
  { sector:'Garments',       median:6.8,  bench:13.5, gap:50, fmRatio:0.68, perm:45, temp:40, gig:15 },
  { sector:'Electronics Mfg',median:9.1,  bench:14.2, gap:36, fmRatio:0.77, perm:60, temp:30, gig:10 },
  { sector:'Healthcare',     median:16.5, bench:18.0, gap:8,  fmRatio:0.91, perm:70, temp:25, gig:5 },
  { sector:'Construction',   median:12.8, bench:15.5, gap:17, fmRatio:0.88, perm:50, temp:35, gig:15 },
  { sector:'Transport',      median:13.2, bench:15.0, gap:12, fmRatio:0.85, perm:55, temp:30, gig:15 },
  { sector:'Finance',        median:28.5, bench:18.0, gap:0,  fmRatio:0.79, perm:80, temp:15, gig:5 },
  { sector:'Tech',           median:42.0, bench:20.0, gap:0,  fmRatio:0.83, perm:75, temp:15, gig:10 },
];

// Tab 3 data
const corporateData = [
  { co:'Co. A', commitment:'Full',    scope:'Supply Chain',  targetYear:2025, anker:true,  verified:true,  score:88 },
  { co:'Co. B', commitment:'Partial', scope:'Own Employees', targetYear:2026, anker:false, verified:true,  score:64 },
  { co:'Co. C', commitment:'Full',    scope:'Supply Chain',  targetYear:2026, anker:true,  verified:true,  score:91 },
  { co:'Co. D', commitment:'None',    scope:'—',             targetYear:null, anker:false, verified:false, score:18 },
  { co:'Co. E', commitment:'Partial', scope:'Own Employees', targetYear:2027, anker:false, verified:false, score:45 },
  { co:'Co. F', commitment:'Partial', scope:'Supply Chain',  targetYear:2027, anker:true,  verified:false, score:58 },
  { co:'Co. G', commitment:'None',    scope:'—',             targetYear:null, anker:false, verified:false, score:22 },
  { co:'Co. H', commitment:'Full',    scope:'Supply Chain',  targetYear:2025, anker:true,  verified:true,  score:84 },
];

// Tab 4 data
const regulationData = [
  { name:'EU Pay Transparency', jurisdiction:'EU (27 states)', from:'2026', scope:'50+ employees', req:'Pay range disclosure & gender gap reporting', penalty:'Fines up to 3% payroll', compliance:42 },
  { name:'UK Gender Pay Gap',   jurisdiction:'United Kingdom',  from:'2017', scope:'250+ employees', req:'Annual gender pay gap publication', penalty:'Enforcement action + naming', compliance:87 },
  { name:'US Pay Data',         jurisdiction:'United States',   from:'2019', scope:'100+ employees', req:'EEO-1 Component 2 pay data', penalty:'EEOC enforcement', compliance:74 },
  { name:'AU Pay Secrecy Ban',  jurisdiction:'Australia',       from:'2023', scope:'All employees', req:'Ban on pay secrecy clauses', penalty:'Civil penalties AUD 94k', compliance:61 },
  { name:'Canada Pay Equity',   jurisdiction:'Canada (federal)',from:'2021', scope:'10+ employees', req:'Pay equity plan & posting', penalty:'Fines up to CAD 50k', compliance:55 },
  { name:'Norway Pay Disclosure',jurisdiction:'Norway',         from:'2024', scope:'Listed companies', req:'Individual salary disclosure on request', penalty:'Supervisory sanctions', compliance:68 },
];

const payTrendData = Array.from({length:24},(_,i)=>({
  month:`M${i+1}`,
  companies: Math.round(1800 + i*55 + (sr(i*11)-0.5)*80)
}));

// Tab 5 data
const conventions = ['Forced Labour','Child Labour','Discrimination','Freedom of Assoc.','Collective Barg.','Equal Pay','Safe Work','Non-Harassment'];
const ilo10Countries = [
  { country:'Germany',     ratified:8, score:84 },
  { country:'France',      ratified:8, score:81 },
  { country:'Sweden',      ratified:8, score:90 },
  { country:'Brazil',      ratified:7, score:65 },
  { country:'India',       ratified:6, score:52 },
  { country:'China',       ratified:5, score:47 },
  { country:'Bangladesh',  ratified:6, score:38 },
  { country:'USA',         ratified:5, score:70 },
  { country:'Indonesia',   ratified:6, score:44 },
  { country:'Vietnam',     ratified:5, score:41 },
];

const TABS = ['Overview','Wage Gap Analysis','Corporate Commitments','Pay Transparency','Labour Rights Index'];

const StatCard = ({ label, value, sub, accent }) => (
  <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:'16px 20px', flex:1, minWidth:170 }}>
    <div style={{ fontSize:22, fontWeight:700, color: accent || ACCENT, marginBottom:4 }}>{value}</div>
    <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:2 }}>{label}</div>
    {sub && <div style={{ fontSize:11, color:T.textMut }}>{sub}</div>}
  </div>
);

const Badge = ({ v }) => {
  const col = v==='Full'?T.green:v==='Partial'?T.amber:T.red;
  return <span style={{ background:col+'22', color:col, borderRadius:4, padding:'2px 8px', fontSize:11, fontWeight:600 }}>{v}</span>;
};

const gapColor = g => g>40?T.red:g>20?T.amber:T.green;

export default function LivingWageTrackerPage() {
  const [tab, setTab] = useState(0);

  return (
    <div style={{ background:T.bg, minHeight:'100vh', fontFamily:T.font, color:T.text, padding:'24px' }}>
      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:22, fontWeight:700, color:T.text }}>Living Wage & Labour Standards Tracker</div>
        <div style={{ fontSize:13, color:T.textSec, marginTop:4 }}>EP-AD3 · Anker Methodology · ILO Core Standards · Pay Transparency Regulation</div>
      </div>

      {/* Tab Bar */}
      <div style={{ display:'flex', gap:0, borderBottom:`1px solid ${T.border}`, marginBottom:24 }}>
        {TABS.map((t,i)=>(
          <button key={t} onClick={()=>setTab(i)} style={{
            background:'none', border:'none', color: tab===i?T.text:T.textSec,
            fontFamily:T.font, fontSize:13, fontWeight: tab===i?600:400,
            padding:'10px 18px', cursor:'pointer', borderBottom: tab===i?`2px solid ${ACCENT}`:'2px solid transparent',
            marginBottom:-1
          }}>{t}</button>
        ))}
      </div>

      {/* Tab 1 — Overview */}
      {tab===0 && (
        <div>
          <div style={{ display:'flex', gap:16, flexWrap:'wrap', marginBottom:24 }}>
            <StatCard value="53%" label="Workers Below Living Wage" sub="Global estimate, Anker methodology" />
            <StatCard value="67" label="Anker Benchmark Countries" sub="Living wage data available" accent={T.teal} />
            <StatCard value="2026" label="EU Pay Transparency" sub="Directive enforcement date" accent={T.amber} />
            <StatCard value="13%" label="Gender Pay Gap" sub="Global average, unadjusted" accent={T.red} />
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
            {/* Country table */}
            <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:20 }}>
              <div style={{ fontSize:14, fontWeight:600, marginBottom:14 }}>Country Wage Benchmark Comparison</div>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                <thead>
                  <tr style={{ color:T.textMut }}>
                    {['Country','Min Wage','Anker LW','Gap %','Union %','CB Cov %'].map(h=>(
                      <th key={h} style={{ textAlign:'left', padding:'6px 8px', borderBottom:`1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {countryWageData.map((r,i)=>(
                    <tr key={r.country} style={{ background: i%2===0?'transparent':'#ffffff06' }}>
                      <td style={{ padding:'7px 8px', color:T.text, fontWeight:500 }}>{r.country}</td>
                      <td style={{ padding:'7px 8px', color:T.textSec }}>${r.minWage}</td>
                      <td style={{ padding:'7px 8px', color:T.textSec }}>${r.ankBench}</td>
                      <td style={{ padding:'7px 8px', color:gapColor(r.gap), fontWeight:600 }}>{r.gap}%</td>
                      <td style={{ padding:'7px 8px', color:T.textSec }}>{r.unionDensity}%</td>
                      <td style={{ padding:'7px 8px', color:T.textSec }}>{r.cbCoverage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Area chart */}
            <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:20 }}>
              <div style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>Global Living Wage Gap — 24 Month Trend</div>
              <div style={{ fontSize:11, color:T.textMut, marginBottom:14 }}>% of workers below living wage benchmark</div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={wageTrendData}>
                  <defs>
                    <linearGradient id="wgGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={ACCENT} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={ACCENT} stopOpacity={0.02}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                  <XAxis dataKey="month" tick={{fill:T.textMut,fontSize:10}} interval={5}/>
                  <YAxis tick={{fill:T.textMut,fontSize:10}} domain={[44,58]}/>
                  <Tooltip {...tip}/>
                  <Area type="monotone" dataKey="gap" stroke={ACCENT} fill="url(#wgGrad)" dot={false} name="Gap %"/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2 — Wage Gap Analysis */}
      {tab===1 && (
        <div>
          <div style={{ display:'flex', gap:16, marginBottom:20 }}>
            <StatCard value="7/10" label="Sectors Below Living Wage" sub="Based on Anker benchmark" />
            <StatCard value="$3.20/hr" label="Avg Wage Gap" sub="Median worker shortfall" accent={T.red} />
            <StatCard value="16%" label="Gig Economy Share" sub="Avg across tracked sectors" accent={T.amber} />
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
            {/* Bar chart */}
            <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:20 }}>
              <div style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>Wage Gap % by Sector</div>
              <div style={{ fontSize:11, color:T.textMut, marginBottom:14 }}>Red &gt;40% · Amber &gt;20% · Green otherwise</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={sectorData} layout="vertical" margin={{left:10}}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                  <XAxis type="number" tick={{fill:T.textMut,fontSize:10}} domain={[0,60]}/>
                  <YAxis type="category" dataKey="sector" tick={{fill:T.textSec,fontSize:10}} width={100}/>
                  <Tooltip {...tip} formatter={v=>`${v}%`}/>
                  <Bar dataKey="gap" name="Gap %" radius={[0,4,4,0]}>
                    {sectorData.map((d,i)=>(
                      <Cell key={i} fill={gapColor(d.gap)}/>
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Sector detail table */}
            <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:20 }}>
              <div style={{ fontSize:14, fontWeight:600, marginBottom:14 }}>Sector Detail — Wages & Contract Types</div>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
                  <thead>
                    <tr style={{ color:T.textMut }}>
                      {['Sector','Median','Bench','F/M Ratio','Perm%','Temp%','Gig%'].map(h=>(
                        <th key={h} style={{ textAlign:'left', padding:'5px 6px', borderBottom:`1px solid ${T.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sectorData.map((r,i)=>(
                      <tr key={r.sector} style={{ background: i%2===0?'transparent':'#ffffff06' }}>
                        <td style={{ padding:'6px', color:T.text, fontWeight:500 }}>{r.sector}</td>
                        <td style={{ padding:'6px', color:T.textSec }}>${r.median}</td>
                        <td style={{ padding:'6px', color:T.textSec }}>${r.bench}</td>
                        <td style={{ padding:'6px', color: r.fmRatio<0.8?T.amber:T.green }}>{r.fmRatio}</td>
                        <td style={{ padding:'6px', color:T.textSec }}>{r.perm}%</td>
                        <td style={{ padding:'6px', color:T.textSec }}>{r.temp}%</td>
                        <td style={{ padding:'6px', color: r.gig>=20?T.amber:T.textSec }}>{r.gig}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3 — Corporate Commitments */}
      {tab===2 && (
        <div>
          <div style={{ display:'flex', gap:16, marginBottom:20 }}>
            <StatCard value="25%" label="Full Commitment" sub="Living wage for supply chain" accent={T.green} />
            <StatCard value="45%" label="Partial Commitment" sub="Own employees only or no target" accent={T.amber} />
            <StatCard value="30%" label="No Commitment" sub="No living wage policy disclosed" accent={T.red} />
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
            {/* Corporate table */}
            <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:20 }}>
              <div style={{ fontSize:14, fontWeight:600, marginBottom:14 }}>Corporate Living Wage Commitments</div>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                <thead>
                  <tr style={{ color:T.textMut }}>
                    {['Company','Status','Scope','Target','Anker','Verified'].map(h=>(
                      <th key={h} style={{ textAlign:'left', padding:'6px 8px', borderBottom:`1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {corporateData.map((r,i)=>(
                    <tr key={r.co} style={{ background: i%2===0?'transparent':'#ffffff06' }}>
                      <td style={{ padding:'7px 8px', fontWeight:600, color:T.text }}>{r.co}</td>
                      <td style={{ padding:'7px 8px' }}><Badge v={r.commitment}/></td>
                      <td style={{ padding:'7px 8px', color:T.textSec, fontSize:11 }}>{r.scope}</td>
                      <td style={{ padding:'7px 8px', color: r.targetYear?ACCENT:T.textMut }}>{r.targetYear||'—'}</td>
                      <td style={{ padding:'7px 8px', color: r.anker?T.green:T.textMut }}>{r.anker?'Yes':'No'}</td>
                      <td style={{ padding:'7px 8px', color: r.verified?T.green:T.textMut }}>{r.verified?'Yes':'No'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Disclosure scores */}
            <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:20 }}>
              <div style={{ fontSize:14, fontWeight:600, marginBottom:14 }}>Disclosure Score & Initiative Membership</div>
              {corporateData.map(r=>(
                <div key={r.co} style={{ marginBottom:14 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                    <span style={{ fontSize:12, fontWeight:600, color:T.text }}>{r.co}</span>
                    <span style={{ fontSize:12, color: r.score>=70?T.green:r.score>=40?T.amber:T.red, fontWeight:700 }}>{r.score}%</span>
                  </div>
                  <div style={{ background:T.border, borderRadius:4, height:7 }}>
                    <div style={{ width:`${r.score}%`, height:'100%', borderRadius:4, background: r.score>=70?T.green:r.score>=40?T.amber:T.red }}/>
                  </div>
                  <div style={{ display:'flex', gap:8, marginTop:4 }}>
                    {r.anker && <span style={{ fontSize:10, color:ACCENT }}>ACT Initiative</span>}
                    {r.verified && <span style={{ fontSize:10, color:T.teal }}>Fair Wage Network</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4 — Pay Transparency Regulation */}
      {tab===3 && (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:20 }}>
            {regulationData.map(r=>(
              <div key={r.name} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16 }}>
                <div style={{ fontSize:13, fontWeight:700, color:ACCENT, marginBottom:4 }}>{r.name}</div>
                <div style={{ fontSize:11, color:T.textSec, marginBottom:6 }}>{r.jurisdiction} · Mandatory from {r.from}</div>
                <div style={{ fontSize:11, color:T.textMut, marginBottom:4 }}><span style={{color:T.text,fontWeight:500}}>Scope:</span> {r.scope}</div>
                <div style={{ fontSize:11, color:T.textMut, marginBottom:4 }}><span style={{color:T.text,fontWeight:500}}>Req:</span> {r.req}</div>
                <div style={{ fontSize:11, color:T.amber }}>{r.penalty}</div>
              </div>
            ))}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
            <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:20 }}>
              <div style={{ fontSize:14, fontWeight:600, marginBottom:14 }}>Reporting Compliance Rate by Jurisdiction</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={regulationData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                  <XAxis dataKey="name" tick={{fill:T.textMut,fontSize:9}} angle={-15} textAnchor="end" height={50}/>
                  <YAxis tick={{fill:T.textMut,fontSize:10}} domain={[0,100]}/>
                  <Tooltip {...tip} formatter={v=>`${v}%`}/>
                  <Bar dataKey="compliance" name="Compliance %" radius={[4,4,0,0]}>
                    {regulationData.map((d,i)=>(
                      <Cell key={i} fill={d.compliance>=75?T.green:d.compliance>=50?T.amber:T.red}/>
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:20 }}>
              <div style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>Companies Reporting Pay Data — 24 Months</div>
              <div style={{ fontSize:11, color:T.textMut, marginBottom:14 }}>Cumulative count across tracked jurisdictions</div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={payTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                  <XAxis dataKey="month" tick={{fill:T.textMut,fontSize:10}} interval={5}/>
                  <YAxis tick={{fill:T.textMut,fontSize:10}}/>
                  <Tooltip {...tip}/>
                  <Line type="monotone" dataKey="companies" stroke={T.teal} dot={false} strokeWidth={2} name="Companies"/>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5 — Labour Rights Index */}
      {tab===4 && (
        <div>
          <div style={{ display:'flex', gap:16, marginBottom:20 }}>
            <StatCard value="78%" label="Global ILO Ratification Rate" sub="8 core conventions avg" accent={T.teal} />
            <StatCard value="Sweden · Germany · France" label="Best Practice Countries" sub="Full ratification + high implementation" accent={T.green} />
            <StatCard value="Vietnam · China · Indonesia" label="Worst Performers" sub="Low implementation scores" accent={T.red} />
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
            <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:20 }}>
              <div style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>ILO Implementation Score by Country</div>
              <div style={{ fontSize:11, color:T.textMut, marginBottom:14 }}>0–100 scale · Green ≥70 · Amber ≥50 · Red otherwise</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={ilo10Countries} layout="vertical" margin={{left:10}}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                  <XAxis type="number" tick={{fill:T.textMut,fontSize:10}} domain={[0,100]}/>
                  <YAxis type="category" dataKey="country" tick={{fill:T.textSec,fontSize:10}} width={90}/>
                  <Tooltip {...tip}/>
                  <Bar dataKey="score" name="Implementation Score" radius={[0,4,4,0]}>
                    {ilo10Countries.map((d,i)=>(
                      <Cell key={i} fill={d.score>=70?T.green:d.score>=50?T.amber:T.red}/>
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* ILO conventions table */}
            <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:20 }}>
              <div style={{ fontSize:14, fontWeight:600, marginBottom:14 }}>ILO Core Conventions — Ratification Status</div>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
                <thead>
                  <tr style={{ color:T.textMut }}>
                    <th style={{ textAlign:'left', padding:'5px 6px', borderBottom:`1px solid ${T.border}` }}>Country</th>
                    <th style={{ textAlign:'center', padding:'5px 6px', borderBottom:`1px solid ${T.border}` }}>Ratified</th>
                    <th style={{ textAlign:'left', padding:'5px 6px', borderBottom:`1px solid ${T.border}` }}>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {ilo10Countries.map((r,i)=>(
                    <tr key={r.country} style={{ background: i%2===0?'transparent':'#ffffff06' }}>
                      <td style={{ padding:'7px 6px', color:T.text, fontWeight:500 }}>{r.country}</td>
                      <td style={{ padding:'7px 6px', textAlign:'center', color: r.ratified===8?T.green:r.ratified>=6?T.amber:T.red, fontWeight:700 }}>{r.ratified}/8</td>
                      <td style={{ padding:'7px 6px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div style={{ flex:1, background:T.border, borderRadius:4, height:6 }}>
                            <div style={{ width:`${r.score}%`, height:'100%', borderRadius:4, background: r.score>=70?T.green:r.score>=50?T.amber:T.red }}/>
                          </div>
                          <span style={{ color: r.score>=70?T.green:r.score>=50?T.amber:T.red, fontWeight:700, minWidth:28 }}>{r.score}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ marginTop:14, padding:12, background:'#ffffff08', borderRadius:8 }}>
                <div style={{ fontSize:11, fontWeight:600, color:T.text, marginBottom:6 }}>Core ILO Conventions Tracked</div>
                {conventions.map((c,i)=>(
                  <div key={c} style={{ fontSize:10, color:T.textMut, padding:'2px 0' }}>C{i+1}. {c}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
