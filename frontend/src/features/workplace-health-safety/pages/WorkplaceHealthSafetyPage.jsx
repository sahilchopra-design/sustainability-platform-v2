import React, { useState } from 'react';
import { AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const ACCENT = '#ea580c';
const tip = { contentStyle:{ background:T.surface, border:'1px solid '+T.border, borderRadius:8, color:T.text }, labelStyle:{ color:T.textSec } };
const sr = s => { let x = Math.sin(s+1)*10000; return x - Math.floor(x); };

const TABS = ['Overview','Incident Analytics','Corporate Benchmarking','Mental Health & Wellbeing','Regulatory Standards'];

const SECTORS = [
  { name:'Construction',    fatRate:17.2, trir:3.8, ldr:142, iso:28 },
  { name:'Mining',          fatRate:22.1, trir:4.2, ldr:198, iso:35 },
  { name:'Agriculture',     fatRate:18.9, trir:3.5, ldr:165, iso:18 },
  { name:'Manufacturing',   fatRate:8.4,  trir:2.9, ldr:98,  iso:52 },
  { name:'Transport',       fatRate:14.3, trir:3.1, ldr:128, iso:41 },
  { name:'Oil & Gas',       fatRate:11.7, trir:2.4, ldr:87,  iso:67 },
  { name:'Healthcare',      fatRate:3.2,  trir:4.8, ldr:201, iso:44 },
  { name:'Fishing',         fatRate:29.4, trir:5.1, ldr:230, iso:12 },
];

const TREND_DATA = Array.from({length:24}, (_,i) => ({
  month: `M${i+1}`,
  incidents: Math.round(4200 + sr(i*3)*800 - i*12),
  fatalities: Math.round(180 + sr(i*7)*40 - i*0.5),
}));

const INCIDENT_TYPES = [
  { name:'Falls from Height',     incidents:2.1, fatalShare:28, costK:94,  roi:4.2 },
  { name:'Machinery Contact',     incidents:1.8, fatalShare:22, costK:112, roi:3.8 },
  { name:'Hazardous Substance',   incidents:3.4, fatalShare:8,  costK:78,  roi:5.1 },
  { name:'Musculoskeletal',       incidents:8.7, fatalShare:1,  costK:34,  roi:6.4 },
  { name:'Mental Health',         incidents:12.3,fatalShare:3,  costK:41,  roi:7.2 },
  { name:'Vehicle',               incidents:2.9, fatalShare:31, costK:138, roi:3.5 },
  { name:'Electrical',            incidents:0.7, fatalShare:19, costK:87,  roi:4.8 },
  { name:'Thermal/Fire',          incidents:1.1, fatalShare:15, costK:103, roi:4.1 },
];

const LEADING_INDICATORS = ['Near-miss reporting rate','Safety audit completion %','Training compliance rate','Hazard identification count','Leadership safety walks','Safety culture survey score'];
const LAGGING_INDICATORS = ['Total Recordable Incident Rate','Lost Time Injury Frequency Rate','Fatality count','Days away from work','Workers compensation cost','Regulatory citations'];

const COMPANIES = [
  { name:'Company A', sector:'Mining',       trir:4.1, ltifr:3.2, fats:2.3, nmr:62,  iso:false, hspct:0.8 },
  { name:'Company B', sector:'Construction', trir:3.4, ltifr:2.8, fats:1.7, nmr:71,  iso:false, hspct:1.1 },
  { name:'Company C', sector:'Oil & Gas',    trir:1.9, ltifr:1.4, fats:0.3, nmr:88,  iso:true,  hspct:2.4 },
  { name:'Company D', sector:'Manufacturing',trir:2.6, ltifr:1.9, fats:0.7, nmr:79,  iso:true,  hspct:1.6 },
  { name:'Company E', sector:'Transport',    trir:2.9, ltifr:2.3, fats:1.1, nmr:74,  iso:false, hspct:1.3 },
  { name:'Company F', sector:'Healthcare',   trir:1.3, ltifr:0.9, fats:0.0, nmr:91,  iso:true,  hspct:1.9 },
  { name:'Company G', sector:'Agriculture',  trir:3.7, ltifr:2.9, fats:1.9, nmr:58,  iso:false, hspct:0.6 },
  { name:'Company H', sector:'Oil & Gas',    trir:1.1, ltifr:0.7, fats:0.0, nmr:96,  iso:true,  hspct:2.8 },
];

const MH_FACTORS = [
  { name:'Burnout',               prevalence:42, costBn:322, absDays:18, legal:7.8 },
  { name:'Harassment & Bullying', prevalence:23, costBn:98,  absDays:24, legal:9.2 },
  { name:'Job Insecurity',        prevalence:31, costBn:142, absDays:12, legal:4.1 },
  { name:'Overwork (>48hr/wk)',   prevalence:28, costBn:187, absDays:9,  legal:5.6 },
  { name:'Discrimination',        prevalence:18, costBn:76,  absDays:21, legal:9.7 },
  { name:'Isolation/Remote Work', prevalence:35, costBn:114, absDays:14, legal:3.2 },
];

const WHO_CHECKLIST = [
  'Mental health policy integrated into OSH management system',
  'Psychosocial risk assessment conducted annually',
  'Return-to-work program for mental health absences',
  'Manager training on mental health first aid',
  'Employee Assistance Programme (EAP) available',
  'Anonymous reporting channel for psychological hazards',
];

const PRESENTEEISM_TREND = Array.from({length:24}, (_,i) => ({
  month:`M${i+1}`,
  cost: Math.round(280 + sr(i*5)*60 + i*4),
}));

const REGULATIONS = [
  { name:'ISO 45001:2018',                     juris:'Global',     scope:'All sectors', key:'PDCA OHS management system', penalty:'N/A (certification loss)', enf:'Third-party audit',     compliance:64 },
  { name:'ILO OSH Convention 155',             juris:'187 member states', scope:'All workplaces', key:'National OSH policy & programmes', penalty:'Varies by state', enf:'Labour inspectorates', compliance:71 },
  { name:'EU OSH Framework Directive',         juris:'EU/EEA',     scope:'All employers', key:'Risk assessment & worker consultation', penalty:'Up to €1.5M',   enf:'National labour inspectors', compliance:82 },
  { name:'US OSHA General Duty',               juris:'USA',        scope:'Multi-employer sites', key:'Free of recognised serious hazards', penalty:'Up to $156k', enf:'OSHA inspections',     compliance:77 },
  { name:'UK Health & Safety at Work Act',     juris:'UK',         scope:'All employers', key:'So far as reasonably practicable', penalty:'Unlimited fine',    enf:'HSE inspectorate',       compliance:88 },
  { name:'Australia WHS Act',                  juris:'Australia',  scope:'Persons conducting business', key:'Primary duty of care', penalty:'Up to AU$3M', enf:'Safe Work Australia',    compliance:85 },
];

const StatCard = ({ label, value }) => (
  <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:'14px 18px', flex:'1 1 180px' }}>
    <div style={{ fontSize:11, color:T.textMut, marginBottom:4 }}>{label}</div>
    <div style={{ fontSize:20, fontWeight:700, color:ACCENT }}>{value}</div>
  </div>
);

export default function WorkplaceHealthSafetyPage() {
  const [tab, setTab] = useState(0);

  return (
    <div style={{ background:T.bg, minHeight:'100vh', fontFamily:T.font, color:T.text, padding:'24px' }}>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:22, fontWeight:700, marginBottom:4 }}>Workplace Health & Safety Analytics</div>
        <div style={{ fontSize:13, color:T.textSec }}>EP-AD6 · ILO data · ISO 45001 · Global OSH benchmarking</div>
      </div>

      {/* Tab Bar */}
      <div style={{ display:'flex', gap:0, borderBottom:`1px solid ${T.border}`, marginBottom:24 }}>
        {TABS.map((t,i) => (
          <button key={i} onClick={()=>setTab(i)} style={{ background:'none', border:'none', padding:'10px 16px', cursor:'pointer', fontSize:13, color: tab===i ? T.text : T.textMut, borderBottom: tab===i ? `2px solid ${ACCENT}` : '2px solid transparent', fontFamily:T.font }}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab 1 — Overview */}
      {tab===0 && (
        <div>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:24 }}>
            <StatCard label="Global Deaths/Year (ILO)" value="2.78M" />
            <StatCard label="Annual Economic Cost" value="$3.9T" />
            <StatCard label="TRIR Benchmark" value="1.8" />
            <StatCard label="ISO 45001 Certified" value="45,000+" />
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16, marginBottom:24 }}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>High-Risk Sectors — OSH Profile</div>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr style={{ color:T.textMut }}>
                  {['Sector','Fatality Rate (per 100k)','TRIR','Lost Day Rate','ISO 45001 Adoption %'].map(h=>(
                    <th key={h} style={{ textAlign:'left', padding:'6px 10px', borderBottom:`1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SECTORS.map((r,i) => (
                  <tr key={i} style={{ borderBottom:`1px solid ${T.border}` }}>
                    <td style={{ padding:'7px 10px', color:T.text }}>{r.name}</td>
                    <td style={{ padding:'7px 10px', color: r.fatRate>20 ? T.red : r.fatRate>10 ? T.amber : T.green }}>{r.fatRate}</td>
                    <td style={{ padding:'7px 10px', color: r.trir>4 ? T.red : r.trir>2.5 ? T.amber : T.green }}>{r.trir}</td>
                    <td style={{ padding:'7px 10px', color:T.textSec }}>{r.ldr}</td>
                    <td style={{ padding:'7px 10px', color:T.textSec }}>{r.iso}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16 }}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Global Workplace Incident Trend (24 months)</div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={TREND_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="month" tick={{ fill:T.textMut, fontSize:10 }} interval={3} />
                <YAxis tick={{ fill:T.textMut, fontSize:10 }} />
                <Tooltip {...tip} />
                <Area type="monotone" dataKey="incidents" stroke={ACCENT} fill={ACCENT} fillOpacity={0.15} name="Incidents" />
                <Area type="monotone" dataKey="fatalities" stroke={T.red} fill={T.red} fillOpacity={0.1} name="Fatalities" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 2 — Incident Analytics */}
      {tab===1 && (
        <div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16, marginBottom:24 }}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Incident Types — Annual Volume & Cost Profile</div>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr style={{ color:T.textMut }}>
                  {['Type','Annual Incidents (M)','Fatal Share %','Avg Cost/Incident ($k)','Prevention ROI'].map(h=>(
                    <th key={h} style={{ textAlign:'left', padding:'6px 10px', borderBottom:`1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {INCIDENT_TYPES.map((r,i) => (
                  <tr key={i} style={{ borderBottom:`1px solid ${T.border}` }}>
                    <td style={{ padding:'7px 10px', color:T.text }}>{r.name}</td>
                    <td style={{ padding:'7px 10px', color:T.textSec }}>{r.incidents}</td>
                    <td style={{ padding:'7px 10px', color: r.fatalShare>20 ? T.red : r.fatalShare>10 ? T.amber : T.green }}>{r.fatalShare}%</td>
                    <td style={{ padding:'7px 10px', color:T.textSec }}>${r.costK}k</td>
                    <td style={{ padding:'7px 10px', color:T.sage }}>{r.roi}x</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16, marginBottom:24 }}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Annual Incident Volume by Type</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={INCIDENT_TYPES} margin={{ left:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fill:T.textMut, fontSize:9 }} />
                <YAxis tick={{ fill:T.textMut, fontSize:10 }} />
                <Tooltip {...tip} />
                <Bar dataKey="incidents" name="Incidents (M)">
                  {INCIDENT_TYPES.map((d,i) => (
                    <Cell key={i} fill={ d.fatalShare>20 ? T.red : d.fatalShare>10 ? T.amber : T.green } />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display:'flex', gap:16 }}>
            <div style={{ flex:1, background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16 }}>
              <div style={{ fontSize:13, fontWeight:600, color:T.green, marginBottom:10 }}>Leading Indicators</div>
              {LEADING_INDICATORS.map((li,i) => <div key={i} style={{ fontSize:12, color:T.textSec, padding:'4px 0', borderBottom:`1px solid ${T.border}` }}>{li}</div>)}
            </div>
            <div style={{ flex:1, background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16 }}>
              <div style={{ fontSize:13, fontWeight:600, color:T.amber, marginBottom:10 }}>Lagging Indicators</div>
              {LAGGING_INDICATORS.map((li,i) => <div key={i} style={{ fontSize:12, color:T.textSec, padding:'4px 0', borderBottom:`1px solid ${T.border}` }}>{li}</div>)}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3 — Corporate Benchmarking */}
      {tab===2 && (
        <div>
          <div style={{ display:'flex', gap:12, marginBottom:24 }}>
            <StatCard label="Industry Avg TRIR" value="2.6" />
            <StatCard label="ISO 45001 Certified" value="50%" />
            <StatCard label="Avg H&S Training (hrs/yr)" value="32" />
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16, marginBottom:24 }}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Corporate H&S Benchmarks</div>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr style={{ color:T.textMut }}>
                  {['Company','Sector','TRIR','LTIFR','Fatalities (3yr avg)','Near-Miss Rate %','ISO 45001','H&S Spend % Rev'].map(h=>(
                    <th key={h} style={{ textAlign:'left', padding:'6px 8px', borderBottom:`1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPANIES.map((r,i) => (
                  <tr key={i} style={{ borderBottom:`1px solid ${T.border}` }}>
                    <td style={{ padding:'7px 8px', color:T.text }}>{r.name}</td>
                    <td style={{ padding:'7px 8px', color:T.textSec }}>{r.sector}</td>
                    <td style={{ padding:'7px 8px', color: r.trir>3 ? T.red : r.trir>1.5 ? T.amber : T.green }}>{r.trir}</td>
                    <td style={{ padding:'7px 8px', color:T.textSec }}>{r.ltifr}</td>
                    <td style={{ padding:'7px 8px', color: r.fats>1.5 ? T.red : r.fats>0.5 ? T.amber : T.green }}>{r.fats}</td>
                    <td style={{ padding:'7px 8px', color:T.textSec }}>{r.nmr}%</td>
                    <td style={{ padding:'7px 8px', color: r.iso ? T.green : T.red }}>{r.iso ? 'Yes' : 'No'}</td>
                    <td style={{ padding:'7px 8px', color:T.textSec }}>{r.hspct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16 }}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>TRIR by Company</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={COMPANIES}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fill:T.textMut, fontSize:10 }} />
                <YAxis tick={{ fill:T.textMut, fontSize:10 }} />
                <Tooltip {...tip} />
                <Bar dataKey="trir" name="TRIR">
                  {COMPANIES.map((d,i) => (
                    <Cell key={i} fill={ d.trir>3.0 ? T.red : d.trir>1.5 ? T.amber : T.green } />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 4 — Mental Health & Wellbeing */}
      {tab===3 && (
        <div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16, marginBottom:24 }}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Mental Health Risk Factors in the Workplace</div>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr style={{ color:T.textMut }}>
                  {['Risk Factor','Prevalence %','Productivity Cost ($bn/yr)','Absenteeism Days','Legal Exposure (1–10)'].map(h=>(
                    <th key={h} style={{ textAlign:'left', padding:'6px 10px', borderBottom:`1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MH_FACTORS.map((r,i) => (
                  <tr key={i} style={{ borderBottom:`1px solid ${T.border}` }}>
                    <td style={{ padding:'7px 10px', color:T.text }}>{r.name}</td>
                    <td style={{ padding:'7px 10px', color: r.prevalence>35 ? T.red : r.prevalence>25 ? T.amber : T.green }}>{r.prevalence}%</td>
                    <td style={{ padding:'7px 10px', color:T.textSec }}>${r.costBn}bn</td>
                    <td style={{ padding:'7px 10px', color:T.textSec }}>{r.absDays}</td>
                    <td style={{ padding:'7px 10px', color: r.legal>8 ? T.red : r.legal>5 ? T.amber : T.green }}>{r.legal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display:'flex', gap:16, marginBottom:24 }}>
            <div style={{ flex:1, background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16 }}>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Prevalence % by Risk Factor</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={MH_FACTORS}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fill:T.textMut, fontSize:8 }} />
                  <YAxis tick={{ fill:T.textMut, fontSize:10 }} />
                  <Tooltip {...tip} />
                  <Bar dataKey="prevalence" name="Prevalence %">
                    {MH_FACTORS.map((d,i) => (
                      <Cell key={i} fill={ d.prevalence>35 ? T.red : d.prevalence>25 ? T.amber : T.green } />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex:1, background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16 }}>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:10 }}>WHO Workplace Mental Health Guidelines 2022</div>
              {WHO_CHECKLIST.map((item,i) => (
                <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:8, padding:'5px 0', borderBottom:`1px solid ${T.border}`, fontSize:12 }}>
                  <span style={{ color:T.green, marginTop:1 }}>✓</span>
                  <span style={{ color:T.textSec }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16 }}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Presenteeism Cost Trend (24 months, $bn)</div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={PRESENTEEISM_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="month" tick={{ fill:T.textMut, fontSize:10 }} interval={3} />
                <YAxis tick={{ fill:T.textMut, fontSize:10 }} />
                <Tooltip {...tip} />
                <Area type="monotone" dataKey="cost" stroke={T.teal} fill={T.teal} fillOpacity={0.15} name="Cost ($bn)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 5 — Regulatory Standards */}
      {tab===4 && (
        <div>
          <div style={{ display:'flex', gap:12, marginBottom:24 }}>
            <StatCard label="Global OSH Inspection Rate" value="22%" />
            <StatCard label="Average Regulatory Fine" value="$47k" />
            <StatCard label="Countries with National OSH Policy" value="91%" />
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:12, marginBottom:24 }}>
            {REGULATIONS.map((r,i) => (
              <div key={i} style={{ flex:'1 1 280px', background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:14 }}>
                <div style={{ fontSize:13, fontWeight:700, color:ACCENT, marginBottom:6 }}>{r.name}</div>
                <div style={{ fontSize:11, color:T.textMut, marginBottom:2 }}>Jurisdiction: <span style={{ color:T.textSec }}>{r.juris}</span></div>
                <div style={{ fontSize:11, color:T.textMut, marginBottom:2 }}>Scope: <span style={{ color:T.textSec }}>{r.scope}</span></div>
                <div style={{ fontSize:11, color:T.textMut, marginBottom:2 }}>Key Req: <span style={{ color:T.textSec }}>{r.key}</span></div>
                <div style={{ fontSize:11, color:T.textMut, marginBottom:2 }}>Penalty: <span style={{ color:T.red }}>{r.penalty}</span></div>
                <div style={{ fontSize:11, color:T.textMut }}>Enforcement: <span style={{ color:T.textSec }}>{r.enf}</span></div>
              </div>
            ))}
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16 }}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Compliance Rate by Jurisdiction</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={REGULATIONS}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fill:T.textMut, fontSize:9 }} />
                <YAxis tick={{ fill:T.textMut, fontSize:10 }} domain={[0,100]} />
                <Tooltip {...tip} />
                <Bar dataKey="compliance" name="Compliance %">
                  {REGULATIONS.map((d,i) => (
                    <Cell key={i} fill={ d.compliance>=80 ? T.green : d.compliance>=65 ? T.amber : T.red } />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
