import React, { useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const ACCENT = '#be123c';
const tip = {
  contentStyle:{ background:T.surface, border:'1px solid '+T.border, borderRadius:8, color:T.text },
  labelStyle:{ color:T.textSec }
};

const sr = s => { let x = Math.sin(s+1)*10000; return x - Math.floor(x); };

const TABS = ['Overview','Supply Chain Screening','Corporate Disclosure','Regulatory Enforcement','ILO Indicators & Remediation'];

const HIGH_RISK_COUNTRIES = [
  { country:'North Korea',    prevalence:'104.6',  govResponse:2,  recruitRisk:'Critical', walkFree:1  },
  { country:'Eritrea',        prevalence:'93.0',   govResponse:3,  recruitRisk:'Critical', walkFree:2  },
  { country:'Mauritania',     prevalence:'32.0',   govResponse:4,  recruitRisk:'High',     walkFree:3  },
  { country:'Saudi Arabia',   prevalence:'21.3',   govResponse:5,  recruitRisk:'High',     walkFree:5  },
  { country:'Turkey',         prevalence:'15.7',   govResponse:5,  recruitRisk:'High',     walkFree:9  },
  { country:'Russia',         prevalence:'14.9',   govResponse:4,  recruitRisk:'High',     walkFree:8  },
  { country:'Afghanistan',    prevalence:'22.2',   govResponse:3,  recruitRisk:'Critical', walkFree:6  },
  { country:'UAE',            prevalence:'17.8',   govResponse:4,  recruitRisk:'High',     walkFree:12 },
];

const INCIDENT_TREND = Array.from({length:24}, (_,i) => ({
  month:`M${i+1}`,
  incidents: Math.round(80 + sr(i*7)*60 + i*3.5)
}));

const SUPPLY_CHAINS = [
  { commodity:'Cotton (Xinjiang)',    risk:9.4, traceability:'Very Low', banned:true,  regulation:'UFLPA 2022',      exposure:28.5 },
  { commodity:'Cobalt (DRC)',         risk:8.7, traceability:'Low',      banned:false, regulation:'EU CSRD',         exposure:14.2 },
  { commodity:'Palm Oil (Malaysia)',  risk:7.9, traceability:'Low',      banned:false, regulation:'EU EUDR 2023',    exposure:11.8 },
  { commodity:'Seafood (Thailand)',   risk:8.2, traceability:'Medium',   banned:false, regulation:'US TVPRA',        exposure:6.4  },
  { commodity:'Tomatoes (Italy)',     risk:6.1, traceability:'Medium',   banned:false, regulation:'EU FLR 2024',     exposure:3.2  },
  { commodity:'Cocoa (Côte d\'Ivoire)',risk:7.3,traceability:'Low',      banned:false, regulation:'EU CSDD',         exposure:9.7  },
  { commodity:'Garments (Myanmar)',   risk:9.1, traceability:'Very Low', banned:true,  regulation:'UFLPA / UK MSA',  exposure:7.6  },
  { commodity:'Solar Panels (Xinjiang)',risk:9.6,traceability:'Very Low',banned:true,  regulation:'UFLPA 2022',      exposure:32.1 },
  { commodity:'Rubber (Laos)',        risk:5.8, traceability:'Medium',   banned:false, regulation:'EU EUDR 2023',    exposure:2.9  },
  { commodity:'Tea (Assam)',          risk:6.5, traceability:'Medium',   banned:false, regulation:'UK MSA 2015',     exposure:1.8  },
];

const COMPANIES = [
  { id:'A', score:87, tiers:4, grievance:'Effective',      remediation:'Full',    yoy:'+12' },
  { id:'B', score:71, tiers:3, grievance:'Partial',        remediation:'Partial', yoy:'+7'  },
  { id:'C', score:58, tiers:2, grievance:'Partial',        remediation:'Partial', yoy:'+3'  },
  { id:'D', score:44, tiers:2, grievance:'Weak',           remediation:'Limited', yoy:'-2'  },
  { id:'E', score:36, tiers:1, grievance:'Weak',           remediation:'None',    yoy:'+1'  },
  { id:'F', score:27, tiers:1, grievance:'None',           remediation:'None',    yoy:'0'   },
  { id:'G', score:18, tiers:1, grievance:'None',           remediation:'None',    yoy:'-4'  },
  { id:'H', score:12, tiers:0, grievance:'None',           remediation:'None',    yoy:'-8'  },
];

const ENFORCEMENT_ACTIONS = [
  { action:'CBP/UFLPA – Apple Suppliers',       agency:'US CBP',        year:2023, value:420, outcome:'Detention + Rebuttable Presumption', precedent:'First major tech co. UFLPA action' },
  { action:'UK GLAA – Horticulture Sweep',      agency:'UK GLAA',       year:2023, value:18,  outcome:'12 prosecutions, licences revoked',  precedent:'First multi-county operation'       },
  { action:'Australia ABF Operation Jardena',   agency:'AU ABF',        year:2023, value:9,   outcome:'Visa cancellations, seizures',       precedent:'Cross-agency maritime model'        },
  { action:'EU Customs Pilot – Solar Goods',    agency:'EU DG TAXUD',   year:2024, value:310, outcome:'Goods detained at 6 EU ports',       precedent:'Precursor to EU FLR enforcement'    },
  { action:'France – Duty of Vigilance Ruling', agency:'Paris Court',   year:2023, value:55,  outcome:'Injunction issued against exporter', precedent:'First binding court remedy'         },
  { action:'Germany LkSG First Cases',          agency:'BAFA Germany',  year:2024, value:30,  outcome:'Fines issued; audit requirements',   precedent:'LkSG civil liability pathway'       },
];

const ENFORCEMENT_TREND = Array.from({length:24}, (_,i) => ({
  month:`M${i+1}`,
  actions: Math.round(12 + sr(i*11)*15 + i*1.8)
}));

const ILO_INDICATORS = [
  { indicator:'Abuse of vulnerability',      prevalence:68, difficulty:'Hard',   costIndex:7.2 },
  { indicator:'Deception',                   prevalence:54, difficulty:'Medium', costIndex:5.8 },
  { indicator:'Restriction of movement',     prevalence:47, difficulty:'Medium', costIndex:6.1 },
  { indicator:'Isolation',                   prevalence:38, difficulty:'Hard',   costIndex:4.9 },
  { indicator:'Physical & sexual violence',  prevalence:29, difficulty:'Hard',   costIndex:8.5 },
  { indicator:'Intimidation & threats',      prevalence:52, difficulty:'Medium', costIndex:5.3 },
  { indicator:'Retention of ID documents',   prevalence:61, difficulty:'Easy',   costIndex:3.2 },
  { indicator:'Withholding of wages',        prevalence:73, difficulty:'Easy',   costIndex:4.1 },
  { indicator:'Debt bondage',                prevalence:45, difficulty:'Hard',   costIndex:9.0 },
  { indicator:'Abusive working conditions',  prevalence:66, difficulty:'Medium', costIndex:5.5 },
  { indicator:'Excessive overtime',          prevalence:81, difficulty:'Easy',   costIndex:2.8 },
];

const REMEDIATION_STEPS = [
  { step:'Identify',   desc:'Worker voice surveys, audit triangulation, grievance channel analysis' },
  { step:'Engage',     desc:'Direct worker engagement, union consultation, community liaison'       },
  { step:'Remediate',  desc:'Back-pay, document return, freedom of movement restoration'            },
  { step:'Monitor',    desc:'Ongoing KPI tracking, third-party verification, hotline monitoring'    },
  { step:'Report',     desc:'Public disclosure, regulator notification, benchmark submission'       },
];

const riskColor = v => v > 7 ? T.red : v > 4 ? T.amber : T.green;
const discColor = v => v >= 70 ? T.green : v >= 40 ? T.amber : T.red;
const prevColor = v => v >= 60 ? T.red : v >= 40 ? T.amber : T.green;

const Card = ({ label, value, sub }) => (
  <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:'16px 20px', flex:1, minWidth:160 }}>
    <div style={{ fontSize:22, fontWeight:700, color:ACCENT }}>{value}</div>
    <div style={{ fontSize:13, color:T.text, marginTop:4 }}>{label}</div>
    {sub && <div style={{ fontSize:11, color:T.textMut, marginTop:2 }}>{sub}</div>}
  </div>
);

const Badge = ({ v, label }) => (
  <span style={{ background: riskColor(v)+'22', color: riskColor(v), border:`1px solid ${riskColor(v)}44`, borderRadius:6, padding:'2px 8px', fontSize:11, fontWeight:600 }}>{label||v}</span>
);

export default function ModernSlaveryIntelPage() {
  const [tab, setTab] = useState(0);

  return (
    <div style={{ background:T.bg, minHeight:'100vh', fontFamily:T.font, color:T.text, padding:'24px' }}>
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontSize:22, fontWeight:700, margin:0 }}>Modern Slavery & Forced Labour Intelligence</h1>
        <p style={{ color:T.textSec, margin:'4px 0 0', fontSize:13 }}>EP-AD4 — Walk Free / ILO / UFLPA / EU Forced Labour Regulation</p>
      </div>

      {/* Tab bar */}
      <div style={{ display:'flex', gap:4, borderBottom:`1px solid ${T.border}`, marginBottom:24, flexWrap:'wrap' }}>
        {TABS.map((t,i) => (
          <button key={t} onClick={() => setTab(i)} style={{
            background:'none', border:'none', color: tab===i ? T.text : T.textMut,
            padding:'8px 14px', fontSize:13, fontWeight: tab===i ? 600 : 400,
            borderBottom: tab===i ? `2px solid ${ACCENT}` : '2px solid transparent',
            cursor:'pointer', whiteSpace:'nowrap'
          }}>{t}</button>
        ))}
      </div>

      {/* Tab 1 — Overview */}
      {tab===0 && (
        <div>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:24 }}>
            <Card label="Victims Globally"        value="40.3M"     sub="ILO 2022 estimate" />
            <Card label="Annual Profit Generated" value="$236bn"    sub="From forced labour" />
            <Card label="US UFLPA Enacted"        value="2022"      sub="Uyghur Forced Labour Prevention Act" />
            <Card label="Walk Free Index Coverage" value="167 Countries" sub="Global Slavery Index" />
          </div>

          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16, marginBottom:24 }}>
            <h3 style={{ margin:'0 0 12px', fontSize:14, color:T.textSec }}>Highest-Risk Countries</h3>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ color:T.textMut }}>
                  {['Country','Prevalence (per 1000)','Gov Response','Recruit Risk','Walk Free Rank'].map(h => (
                    <th key={h} style={{ textAlign:'left', padding:'6px 10px', borderBottom:`1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HIGH_RISK_COUNTRIES.map(r => (
                  <tr key={r.country} style={{ borderBottom:`1px solid ${T.border}22` }}>
                    <td style={{ padding:'7px 10px', fontWeight:600 }}>{r.country}</td>
                    <td style={{ padding:'7px 10px', color:T.amber }}>{r.prevalence}</td>
                    <td style={{ padding:'7px 10px' }}>{r.govResponse}/10</td>
                    <td style={{ padding:'7px 10px' }}>
                      <span style={{ color: r.recruitRisk==='Critical' ? T.red : T.amber, fontWeight:600 }}>{r.recruitRisk}</span>
                    </td>
                    <td style={{ padding:'7px 10px', color:T.textSec }}>#{r.walkFree}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16 }}>
            <h3 style={{ margin:'0 0 12px', fontSize:14, color:T.textSec }}>Detected Forced Labour Incidents (24 months)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={INCIDENT_TREND}>
                <defs>
                  <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={ACCENT} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={ACCENT} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="month" tick={{ fill:T.textMut, fontSize:10 }} />
                <YAxis tick={{ fill:T.textMut, fontSize:10 }} />
                <Tooltip {...tip} />
                <Area type="monotone" dataKey="incidents" stroke={ACCENT} fill="url(#incGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 2 — Supply Chain Screening */}
      {tab===1 && (
        <div>
          <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
            {['UFLPA (US 2022)','EU Forced Labour Regulation (2024)','UK Import Goods Act'].map(r => (
              <span key={r} style={{ background:ACCENT+'22', border:`1px solid ${ACCENT}44`, color:T.text, borderRadius:6, padding:'4px 12px', fontSize:12 }}>{r}</span>
            ))}
          </div>

          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16, marginBottom:24 }}>
            <h3 style={{ margin:'0 0 12px', fontSize:14, color:T.textSec }}>Commodity Supply Chain Risk Screening</h3>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr style={{ color:T.textMut }}>
                  {['Commodity','FL Risk','Traceability','Import Ban','Key Regulation','Exposure ($bn)'].map(h => (
                    <th key={h} style={{ textAlign:'left', padding:'6px 8px', borderBottom:`1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SUPPLY_CHAINS.map(s => (
                  <tr key={s.commodity} style={{ borderBottom:`1px solid ${T.border}22` }}>
                    <td style={{ padding:'7px 8px', fontWeight:600 }}>{s.commodity}</td>
                    <td style={{ padding:'7px 8px' }}><Badge v={s.risk} label={s.risk.toFixed(1)} /></td>
                    <td style={{ padding:'7px 8px', color:T.textSec }}>{s.traceability}</td>
                    <td style={{ padding:'7px 8px' }}>
                      {s.banned
                        ? <span style={{ color:T.red, fontWeight:600 }}>YES</span>
                        : <span style={{ color:T.textMut }}>No</span>}
                    </td>
                    <td style={{ padding:'7px 8px', color:T.textSec }}>{s.regulation}</td>
                    <td style={{ padding:'7px 8px', color:T.amber }}>${s.exposure}bn</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16 }}>
            <h3 style={{ margin:'0 0 12px', fontSize:14, color:T.textSec }}>Forced Labour Risk Scores by Commodity</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={SUPPLY_CHAINS} layout="vertical" margin={{ left:140, right:20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" domain={[0,10]} tick={{ fill:T.textMut, fontSize:10 }} />
                <YAxis type="category" dataKey="commodity" tick={{ fill:T.text, fontSize:10 }} width={140} />
                <Tooltip {...tip} />
                <Bar dataKey="risk" radius={[0,4,4,0]}>
                  {SUPPLY_CHAINS.map((s,i) => <Cell key={i} fill={riskColor(s.risk)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 3 — Corporate Disclosure Quality */}
      {tab===2 && (
        <div>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:24 }}>
            <Card label="Avg Disclosure Score"        value="42/100"  sub="Walk Free / KnowTheChain benchmark" />
            <Card label="Companies with No Statement" value="18%"     sub="FTSE 350 sample" />
            <Card label="Top Performer Score"         value="87/100"  sub="Company A" />
          </div>

          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16, marginBottom:24 }}>
            <h3 style={{ margin:'0 0 12px', fontSize:14, color:T.textSec }}>Disclosure Quality by Company</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={COMPANIES}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="id" tick={{ fill:T.textMut, fontSize:11 }} />
                <YAxis domain={[0,100]} tick={{ fill:T.textMut, fontSize:10 }} />
                <Tooltip {...tip} />
                <Bar dataKey="score" radius={[4,4,0,0]}>
                  {COMPANIES.map((c,i) => <Cell key={i} fill={discColor(c.score)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16 }}>
            <h3 style={{ margin:'0 0 12px', fontSize:14, color:T.textSec }}>Company Disclosure Detail</h3>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr style={{ color:T.textMut }}>
                  {['Co.','Score','Supplier Tiers','Grievance Mechanism','Remediation','YoY'].map(h => (
                    <th key={h} style={{ textAlign:'left', padding:'6px 10px', borderBottom:`1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPANIES.map(c => (
                  <tr key={c.id} style={{ borderBottom:`1px solid ${T.border}22` }}>
                    <td style={{ padding:'7px 10px', fontWeight:700, color:ACCENT }}>Co. {c.id}</td>
                    <td style={{ padding:'7px 10px' }}>
                      <span style={{ color: discColor(c.score), fontWeight:600 }}>{c.score}</span>
                    </td>
                    <td style={{ padding:'7px 10px', color:T.textSec }}>{c.tiers > 0 ? `${c.tiers} tiers` : 'None'}</td>
                    <td style={{ padding:'7px 10px', color:T.textSec }}>{c.grievance}</td>
                    <td style={{ padding:'7px 10px', color:T.textSec }}>{c.remediation}</td>
                    <td style={{ padding:'7px 10px', color: c.yoy.startsWith('+') ? T.green : c.yoy.startsWith('-') ? T.red : T.textMut }}>{c.yoy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4 — Regulatory Enforcement */}
      {tab===3 && (
        <div>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:24 }}>
            <Card label="UFLPA Detentions Value" value="$2.1bn"  sub="Cumulative 2022–2024" />
            <Card label="Successful Prosecutions" value="34%"    sub="Global enforcement sample" />
            <Card label="Avg Fine Issued"         value="$87M"   sub="Across major cases" />
          </div>

          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16, marginBottom:24 }}>
            <h3 style={{ margin:'0 0 12px', fontSize:14, color:T.textSec }}>Major Enforcement Actions</h3>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr style={{ color:T.textMut }}>
                  {['Action','Agency','Year','Value ($M)','Outcome','Precedent Set'].map(h => (
                    <th key={h} style={{ textAlign:'left', padding:'6px 8px', borderBottom:`1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ENFORCEMENT_ACTIONS.map(e => (
                  <tr key={e.action} style={{ borderBottom:`1px solid ${T.border}22` }}>
                    <td style={{ padding:'7px 8px', fontWeight:600 }}>{e.action}</td>
                    <td style={{ padding:'7px 8px', color:T.textSec }}>{e.agency}</td>
                    <td style={{ padding:'7px 8px', color:T.textMut }}>{e.year}</td>
                    <td style={{ padding:'7px 8px', color:T.amber }}>${e.value}M</td>
                    <td style={{ padding:'7px 8px', color:T.textSec, fontSize:11 }}>{e.outcome}</td>
                    <td style={{ padding:'7px 8px', color:T.teal, fontSize:11 }}>{e.precedent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16 }}>
            <h3 style={{ margin:'0 0 12px', fontSize:14, color:T.textSec }}>Global Enforcement Actions Trend (24 months)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={ENFORCEMENT_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="month" tick={{ fill:T.textMut, fontSize:10 }} />
                <YAxis tick={{ fill:T.textMut, fontSize:10 }} />
                <Tooltip {...tip} />
                <Line type="monotone" dataKey="actions" stroke={ACCENT} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 5 — ILO Indicators & Remediation */}
      {tab===4 && (
        <div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16, marginBottom:24 }}>
            <h3 style={{ margin:'0 0 12px', fontSize:14, color:T.textSec }}>ILO Forced Labour Indicators — Supply Chain Prevalence</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={ILO_INDICATORS} layout="vertical" margin={{ left:185, right:20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" domain={[0,100]} tick={{ fill:T.textMut, fontSize:10 }} unit="%" />
                <YAxis type="category" dataKey="indicator" tick={{ fill:T.text, fontSize:10 }} width={185} />
                <Tooltip {...tip} formatter={v => [`${v}%`,'Prevalence']} />
                <Bar dataKey="prevalence" radius={[0,4,4,0]}>
                  {ILO_INDICATORS.map((d,i) => <Cell key={i} fill={prevColor(d.prevalence)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16, marginBottom:24 }}>
            <h3 style={{ margin:'0 0 12px', fontSize:14, color:T.textSec }}>ILO Indicator Detail</h3>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr style={{ color:T.textMut }}>
                  {['Indicator','Prevalence (%)','Detection Difficulty','Remediation Cost Index'].map(h => (
                    <th key={h} style={{ textAlign:'left', padding:'6px 10px', borderBottom:`1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ILO_INDICATORS.map(r => (
                  <tr key={r.indicator} style={{ borderBottom:`1px solid ${T.border}22` }}>
                    <td style={{ padding:'7px 10px' }}>{r.indicator}</td>
                    <td style={{ padding:'7px 10px', color: prevColor(r.prevalence), fontWeight:600 }}>{r.prevalence}%</td>
                    <td style={{ padding:'7px 10px', color: r.difficulty==='Hard' ? T.red : r.difficulty==='Medium' ? T.amber : T.green }}>{r.difficulty}</td>
                    <td style={{ padding:'7px 10px', color:T.textSec }}>{r.costIndex.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <h3 style={{ margin:'0 0 12px', fontSize:14, color:T.textSec }}>Remediation Framework</h3>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              {REMEDIATION_STEPS.map((s,i) => (
                <div key={s.step} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:'14px 16px', flex:1, minWidth:150 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                    <div style={{ background:ACCENT, color:'#fff', borderRadius:'50%', width:22, height:22, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0 }}>{i+1}</div>
                    <span style={{ fontWeight:700, fontSize:13, color:T.text }}>{s.step}</span>
                  </div>
                  <p style={{ fontSize:11, color:T.textSec, margin:0, lineHeight:1.5 }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
