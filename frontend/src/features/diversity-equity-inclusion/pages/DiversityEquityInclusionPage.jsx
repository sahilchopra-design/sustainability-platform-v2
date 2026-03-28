import React, { useState } from 'react';
import { AreaChart, Area, BarChart, Bar, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
const ACCENT = '#a855f7';
const tip = { contentStyle:{ background:T.surface, border:'1px solid '+T.border, borderRadius:8, color:T.text }, labelStyle:{ color:T.textSec } };
const sr = s => { let x = Math.sin(s+1)*10000; return x - Math.floor(x); };

const COMPANIES = ['Apex','Birch','Crest','Delta','Ember','Forge','Grove','Helios'];

const overviewData = COMPANIES.map((c,i) => ({
  company: c,
  femaleLead: Math.round(20 + sr(i*7)*25),
  ethnicDiv: Math.round(12 + sr(i*11)*22),
  disability: +(2 + sr(i*13)*3).toFixed(1),
  lgbtq: +(3 + sr(i*17)*4).toFixed(1),
  payEquity: +(0.82 + sr(i*19)*0.16).toFixed(2),
  deiBudget: +(1.2 + sr(i*23)*4.8).toFixed(1),
}));

const femaleTrend = Array.from({length:24},(_,i) => ({ month:`M${i+1}`, pct: +(24 + sr(i*3)*10).toFixed(1) }));

const SECTORS = ['Energy','Finance','Tech','Health','Retail','Industrials','Materials','Utilities'];
const genderData = SECTORS.map((s,i) => ({
  sector: s,
  board: Math.round(22 + sr(i*5)*20),
  senior: Math.round(18 + sr(i*8)*28),
  total: Math.round(35 + sr(i*12)*30),
  payGap: Math.round(8 + sr(i*9)*18),
  matLeave: Math.round(16 + sr(i*6)*26),
  patLeave: Math.round(2 + sr(i*4)*12),
  flexWork: Math.round(40 + sr(i*7)*45),
}));

const payGapTrend = Array.from({length:24},(_,i) => ({ month:`M${i+1}`, gap: +(18 - i*0.3 + sr(i*5)*2).toFixed(1) }));

const ethData = COMPANIES.map((c,i) => ({
  company: c,
  board: Math.round(8 + sr(i*6)*18),
  leadership: Math.round(10 + sr(i*9)*18),
  total: Math.round(18 + sr(i*11)*22),
  ethPayGap: Math.round(4 + sr(i*8)*12),
  ergs: Math.round(2 + sr(i*5)*6),
  training: Math.round(55 + sr(i*14)*40),
}));

const disabilityData = COMPANIES.map((c,i) => ({
  company: c,
  empPct: +(3 + sr(i*7)*9).toFixed(1),
  adjustments: Math.round(70 + sr(i*9)*28),
  confident: sr(i*3) > 0.4 ? 'Yes' : 'No',
  access: Math.round(60 + sr(i*11)*38),
}));

const lgbtqData = COMPANIES.map((c,i) => ({
  company: c,
  cei: Math.round(55 + sr(i*8)*45),
  ssBenefits: sr(i*5) > 0.35 ? 'Yes' : 'No',
  policies: Math.round(4 + sr(i*7)*10),
  pride: sr(i*11) > 0.3 ? 'Yes' : 'No',
}));

const FRAMEWORKS = [
  { name:'EU Pay Transparency', jurisdiction:'EU', mandatory:'2026', scope:'250+ employees', disclosure:'Gender pay gap by job category', penalty:'Up to 3% payroll', freq:'Annual' },
  { name:'UK Gender Pay Gap', jurisdiction:'UK', mandatory:'2017', scope:'250+ employees', disclosure:'6 pay gap metrics', penalty:'Unlimited fine', freq:'Annual' },
  { name:'CSRD Social Taxonomy', jurisdiction:'EU', mandatory:'2024', scope:'500+ (large PIEs)', disclosure:'Workforce diversity KPIs', penalty:'Public censure', freq:'Annual' },
  { name:'US EEO-1 Reporting', jurisdiction:'USA', mandatory:'1966', scope:'100+ employees', disclosure:'Race/gender by job category', penalty:'EEOC action', freq:'Annual' },
  { name:'California SB 54', jurisdiction:'USA-CA', mandatory:'2023', scope:'VC firms', disclosure:'Diversity of portfolio founders', penalty:'$10K–$100K', freq:'Annual' },
  { name:'Nasdaq Board Diversity', jurisdiction:'USA', mandatory:'2022', scope:'Nasdaq-listed', disclosure:'Board diversity matrix', penalty:'Delisting risk', freq:'Annual' },
];

const complianceData = FRAMEWORKS.map((f,i) => ({ name: f.name.split(' ').slice(0,2).join(' '), rate: Math.round(52 + sr(i*9)*44) }));

const TABS = ['Overview','Gender Analytics','Ethnicity & Inclusion','Disability & LGBTQ+','DEI Regulation'];

const StatCard = ({ label, value }) => (
  <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:'16px 20px', flex:1, minWidth:160 }}>
    <div style={{ color:T.textSec, fontSize:12, marginBottom:6 }}>{label}</div>
    <div style={{ color:ACCENT, fontSize:22, fontWeight:700 }}>{value}</div>
  </div>
);

const SummStat = ({ label, value }) => (
  <div style={{ background:T.navy, border:`1px solid ${T.border}`, borderRadius:8, padding:'12px 16px', flex:1, textAlign:'center' }}>
    <div style={{ color:ACCENT, fontSize:18, fontWeight:700 }}>{value}</div>
    <div style={{ color:T.textSec, fontSize:11, marginTop:4 }}>{label}</div>
  </div>
);

const Th = ({ children }) => <th style={{ color:T.textSec, fontSize:11, fontWeight:600, padding:'8px 12px', textAlign:'left', borderBottom:`1px solid ${T.border}` }}>{children}</th>;
const Td = ({ children, accent }) => <td style={{ color: accent ? ACCENT : T.text, fontSize:12, padding:'8px 12px', borderBottom:`1px solid ${T.border}22` }}>{children}</td>;

export default function DiversityEquityInclusionPage() {
  const [tab, setTab] = useState(0);

  return (
    <div style={{ background:T.bg, minHeight:'100vh', fontFamily:T.font, color:T.text, padding:24 }}>
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontSize:22, fontWeight:700, margin:0 }}>Diversity, Equity & Inclusion Analytics</h1>
        <p style={{ color:T.textSec, fontSize:13, margin:'4px 0 0' }}>EP-AE6 — Workforce diversity metrics, pay equity, inclusion benchmarks & regulatory compliance</p>
      </div>

      <div style={{ display:'flex', gap:0, borderBottom:`1px solid ${T.border}`, marginBottom:24 }}>
        {TABS.map((t,i) => (
          <button key={t} onClick={() => setTab(i)} style={{ background:'none', border:'none', color: tab===i ? ACCENT : T.textSec, fontSize:13, fontWeight: tab===i ? 700 : 400, padding:'10px 18px', cursor:'pointer', borderBottom: tab===i ? `2px solid ${ACCENT}` : '2px solid transparent', marginBottom:-1 }}>{t}</button>
        ))}
      </div>

      {tab === 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            <StatCard label="Women in Leadership" value="29%" />
            <StatCard label="Pay Gap: Global Avg" value="13%" />
            <StatCard label="Ethnic Minority Execs" value="14%" />
            <StatCard label="DEI ROI — Innovation" value="+19%" />
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16 }}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Company DEI Scorecard</div>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr><Th>Company</Th><Th>Female Lead %</Th><Th>Ethnic Div %</Th><Th>Disability Score</Th><Th>LGBTQ+ Index</Th><Th>Pay Equity</Th><Th>DEI Budget ($M)</Th></tr></thead>
              <tbody>{overviewData.map(r => (
                <tr key={r.company}><Td>{r.company}</Td><Td accent>{r.femaleLead}%</Td><Td>{r.ethnicDiv}%</Td><Td>{r.disability}</Td><Td>{r.lgbtq}</Td><Td>{r.payEquity}</Td><Td>${r.deiBudget}M</Td></tr>
              ))}</tbody>
            </table>
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16 }}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Female Leadership Representation — 24-Month Trend</div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={femaleTrend}><CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="month" tick={{ fill:T.textMut, fontSize:10 }} />
                <YAxis tick={{ fill:T.textMut, fontSize:10 }} domain={[22,36]} unit="%" />
                <Tooltip {...tip} />
                <Area type="monotone" dataKey="pct" stroke={ACCENT} fill={ACCENT+'33'} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16 }}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Gender Metrics by Sector</div>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr><Th>Sector</Th><Th>Board F%</Th><Th>Senior F%</Th><Th>Total F%</Th><Th>Pay Gap%</Th><Th>Mat. Leave (wk)</Th><Th>Pat. Leave (wk)</Th><Th>Flex Work%</Th></tr></thead>
              <tbody>{genderData.map(r => (
                <tr key={r.sector}><Td>{r.sector}</Td><Td accent>{r.board}%</Td><Td>{r.senior}%</Td><Td>{r.total}%</Td><Td>{r.payGap}%</Td><Td>{r.matLeave}</Td><Td>{r.patLeave}</Td><Td>{r.flexWork}%</Td></tr>
              ))}</tbody>
            </table>
          </div>
          <div style={{ display:'flex', gap:16 }}>
            <div style={{ flex:1, background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16 }}>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Female Senior Leadership % by Sector</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={genderData}><CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="sector" tick={{ fill:T.textMut, fontSize:10 }} />
                  <YAxis tick={{ fill:T.textMut, fontSize:10 }} unit="%" />
                  <Tooltip {...tip} />
                  <Bar dataKey="senior">
                    {genderData.map((d,i) => <Cell key={i} fill={d.senior>35 ? T.green : d.senior>25 ? T.amber : ACCENT} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex:1, background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16 }}>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Gender Pay Gap Closure — 24 Months</div>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={payGapTrend}><CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="month" tick={{ fill:T.textMut, fontSize:10 }} />
                  <YAxis tick={{ fill:T.textMut, fontSize:10 }} unit="%" />
                  <Tooltip {...tip} />
                  <Line type="monotone" dataKey="gap" stroke={T.amber} dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ display:'flex', gap:12 }}>
            <SummStat label="Sectors at Parity" value="2 / 8" />
            <SummStat label="Avg Gender Pay Gap" value="13%" />
            <SummStat label="Parental Leave Gender Gap" value="18 wks" />
          </div>
        </div>
      )}

      {tab === 2 && (
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16 }}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Ethnicity & Inclusion by Company</div>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr><Th>Company</Th><Th>Board EM%</Th><Th>Leadership EM%</Th><Th>Total EM%</Th><Th>Eth. Pay Gap%</Th><Th>ERGs</Th><Th>Anti-racism Training%</Th></tr></thead>
              <tbody>{ethData.map(r => (
                <tr key={r.company}><Td>{r.company}</Td><Td accent>{r.board}%</Td><Td>{r.leadership}%</Td><Td>{r.total}%</Td><Td>{r.ethPayGap}%</Td><Td>{r.ergs}</Td><Td>{r.training}%</Td></tr>
              ))}</tbody>
            </table>
          </div>
          <div style={{ display:'flex', gap:16 }}>
            <div style={{ flex:2, background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16 }}>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Ethnic Minority Leadership % by Company</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={ethData}><CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="company" tick={{ fill:T.textMut, fontSize:10 }} />
                  <YAxis tick={{ fill:T.textMut, fontSize:10 }} unit="%" />
                  <Tooltip {...tip} />
                  <Bar dataKey="leadership">
                    {ethData.map((d,i) => <Cell key={i} fill={d.leadership>20 ? T.green : d.leadership>12 ? T.amber : ACCENT} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex:1, background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16 }}>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Compliance Frameworks</div>
              {[{ name:'Parker Review', status:'12/35 FTSE met' },{ name:'30% Club', status:'Signatory: 48 firms' },{ name:'OneTen Coalition', status:'1M hires by 2030' }].map(f => (
                <div key={f.name} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:`1px solid ${T.border}22` }}>
                  <span style={{ fontSize:12, color:T.text }}>{f.name}</span>
                  <span style={{ fontSize:11, color:T.sage }}>{f.status}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display:'flex', gap:12 }}>
            <SummStat label="FTSE 100 Ethnic Minority CEOs" value="6" />
            <SummStat label="Fortune 500 Black CEOs" value="8" />
            <SummStat label="Avg Ethnicity Pay Gap" value="8%" />
          </div>
        </div>
      )}

      {tab === 3 && (
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          <div style={{ display:'flex', gap:16 }}>
            <div style={{ flex:1, background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16 }}>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Disability Inclusion by Company</div>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead><tr><Th>Company</Th><Th>Emp%</Th><Th>Adjustments%</Th><Th>Confident</Th><Th>Access Score</Th></tr></thead>
                <tbody>{disabilityData.map(r => (
                  <tr key={r.company}><Td>{r.company}</Td><Td accent>{r.empPct}%</Td><Td>{r.adjustments}%</Td><Td>{r.confident}</Td><Td>{r.access}</Td></tr>
                ))}</tbody>
              </table>
            </div>
            <div style={{ flex:1, background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16 }}>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>LGBTQ+ Inclusion by Company</div>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead><tr><Th>Company</Th><Th>CEI Score</Th><Th>SS Benefits</Th><Th>Policies</Th><Th>Pride ERG</Th></tr></thead>
                <tbody>{lgbtqData.map(r => (
                  <tr key={r.company}><Td>{r.company}</Td><Td accent>{r.cei}</Td><Td>{r.ssBenefits}</Td><Td>{r.policies}</Td><Td>{r.pride}</Td></tr>
                ))}</tbody>
              </table>
            </div>
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16 }}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Corporate Equality Index (CEI) Scores</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={lgbtqData}><CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="company" tick={{ fill:T.textMut, fontSize:10 }} />
                <YAxis tick={{ fill:T.textMut, fontSize:10 }} domain={[0,100]} />
                <Tooltip {...tip} />
                <Bar dataKey="cei">
                  {lgbtqData.map((d,i) => <Cell key={i} fill={d.cei>90 ? T.green : d.cei>70 ? T.amber : ACCENT} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display:'flex', gap:12 }}>
            <SummStat label="Avg CEI Score" value="72" />
            <SummStat label="Fortune 500 Perfect CEI" value="317" />
            <SummStat label="Countries with LGBTQ+ Workplace Protection" value="67" />
          </div>
        </div>
      )}

      {tab === 4 && (
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            {FRAMEWORKS.map(f => (
              <div key={f.name} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16, flex:'1 1 280px' }}>
                <div style={{ color:ACCENT, fontSize:13, fontWeight:700, marginBottom:6 }}>{f.name}</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px 12px', fontSize:11 }}>
                  {[['Jurisdiction',f.jurisdiction],['Mandatory From',f.mandatory],['Scope',f.scope],['Key Disclosure',f.disclosure],['Penalty',f.penalty],['Frequency',f.freq]].map(([k,v]) => (
                    <React.Fragment key={k}><span style={{ color:T.textMut }}>{k}</span><span style={{ color:T.text }}>{v}</span></React.Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16 }}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Reporting Compliance Rate by Framework</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={complianceData}><CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fill:T.textMut, fontSize:10 }} />
                <YAxis tick={{ fill:T.textMut, fontSize:10 }} unit="%" domain={[0,100]} />
                <Tooltip {...tip} />
                <Bar dataKey="rate">
                  {complianceData.map((d,i) => <Cell key={i} fill={d.rate>80 ? T.green : d.rate>60 ? T.amber : ACCENT} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display:'flex', gap:12 }}>
            <SummStat label="Mandatory DEI Reporters Globally" value="14,000+" />
            <SummStat label="Avg Disclosure Improvement YoY" value="+12%" />
            <SummStat label="Companies with DEI Targets Linked to Pay" value="34%" />
          </div>
        </div>
      )}
    </div>
  );
}
