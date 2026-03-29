import React, { useState } from 'react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const ACCENT = '#0f766e';
const tip = { contentStyle:{ background:T.surface, border:'1px solid '+T.border, borderRadius:8, color:T.text }, labelStyle:{ color:T.textSec } };
const sr = s => { let x = Math.sin(s+1)*10000; return x - Math.floor(x); };

const INSTITUTIONS = [
  { name:'BlackRock', meetings:17500, forMgmt:82, against:14, abstain:4, esg:88 },
  { name:'Vanguard', meetings:15200, forMgmt:79, against:17, abstain:4, esg:84 },
  { name:'State Street', meetings:12800, forMgmt:76, against:20, abstain:4, esg:91 },
  { name:'Norges Bank', meetings:9600, forMgmt:68, against:28, abstain:4, esg:95 },
  { name:'Fidelity', meetings:11300, forMgmt:85, against:12, abstain:3, esg:76 },
  { name:'T. Rowe Price', meetings:8700, forMgmt:80, against:16, abstain:4, esg:80 },
  { name:'CalPERS', meetings:6200, forMgmt:71, against:25, abstain:4, esg:93 },
  { name:'APG Asset Mgmt', meetings:5400, forMgmt:65, against:31, abstain:4, esg:97 },
];

const ESG_TREND = Array.from({length:24}, (_,i) => ({ month:`M${i+1}`, filings: Math.round(180 + sr(i*3)*120 + i*8) }));

const POLICIES = [
  { inv:'ISS', climate:'Support', diversity:'Support', execPay:'Case-by-Case', shrRights:'Support', polDon:'Case-by-Case', humanRts:'Support' },
  { inv:'Glass Lewis', climate:'Support', diversity:'Support', execPay:'Case-by-Case', shrRights:'Support', polDon:'Oppose', humanRts:'Support' },
  { inv:'BlackRock', climate:'Support', diversity:'Support', execPay:'Case-by-Case', shrRights:'Case-by-Case', polDon:'Oppose', humanRts:'Case-by-Case' },
  { inv:'Vanguard', climate:'Case-by-Case', diversity:'Support', execPay:'Case-by-Case', shrRights:'Case-by-Case', polDon:'Oppose', humanRts:'Case-by-Case' },
  { inv:'State Street', climate:'Support', diversity:'Support', execPay:'Support', shrRights:'Support', polDon:'Oppose', humanRts:'Support' },
  { inv:'Norges Bank', climate:'Support', diversity:'Support', execPay:'Support', shrRights:'Support', polDon:'Oppose', humanRts:'Support' },
];
const POLICY_COLS = ['climate','diversity','execPay','shrRights','polDon','humanRts'];
const POLICY_LABELS = { climate:'Climate', diversity:'Board Diversity', execPay:'Executive Pay', shrRights:'Shareholder Rights', polDon:'Political Donations', humanRts:'Human Rights' };

const INVESTOR_ESG_RATES = POLICIES.map((p,i) => ({ name:p.inv, rate: Math.round(60 + sr(i*7)*35) }));

const RESOLUTION_CATS = [
  { cat:'Environmental', filed:412, support:58, majority:71, mgmtRec:'Against', trend:'↑' },
  { cat:'Social', filed:287, support:44, majority:52, mgmtRec:'Against', trend:'↑' },
  { cat:'Governance', filed:534, support:63, majority:78, mgmtRec:'For', trend:'→' },
  { cat:'Exec Compensation', filed:189, support:36, majority:41, mgmtRec:'Against', trend:'↑' },
  { cat:'Board Elections', filed:2180, support:88, majority:97, mgmtRec:'For', trend:'→' },
  { cat:'Capital Allocation', filed:143, support:52, majority:61, mgmtRec:'For', trend:'↓' },
  { cat:'M&A', filed:78, support:71, majority:85, mgmtRec:'For', trend:'↓' },
  { cat:'Auditor Ratification', filed:1860, support:92, majority:99, mgmtRec:'For', trend:'→' },
];

const CLIMATE_RES_TREND = Array.from({length:24}, (_,i) => ({ month:`M${i+1}`, support: Math.round(38 + sr(i*5)*18 + i*0.8) }));

const SOP_COMPANIES = [
  { co:'Company A', ceoPay:18.4, result:94, rec:'For', drivers:'None', response:'Maintained' },
  { co:'Company B', ceoPay:32.1, result:67, rec:'Against', drivers:'Excessive quantum', response:'Cap introduced' },
  { co:'Company C', ceoPay:11.2, result:91, rec:'For', drivers:'None', response:'Maintained' },
  { co:'Company D', ceoPay:24.7, result:51, rec:'Against', drivers:'Peer misalignment', response:'Redesigned' },
  { co:'Company E', ceoPay:9.8, result:96, rec:'For', drivers:'None', response:'Maintained' },
  { co:'Company F', ceoPay:41.3, result:38, rec:'Against', drivers:'No performance link', response:'Clawback added' },
  { co:'Company G', ceoPay:15.6, result:82, rec:'For', drivers:'Minor concern', response:'Disclosed metrics' },
  { co:'Company H', ceoPay:28.9, result:72, rec:'Against', drivers:'Discretionary awards', response:'Policy revised' },
];

const OPPOSITION_DRIVERS = [
  { driver:'Excessive quantum', count:142 },
  { driver:'Peer misalignment', count:118 },
  { driver:'No performance link', count:97 },
  { driver:'Discretionary awards', count:74 },
  { driver:'Retention focus', count:61 },
];

const STEWARDSHIP_CODES = [
  { code:'UK Stewardship Code 2020', jurisdiction:'United Kingdom', signatories:254, reporting:'Annual', updated:'2020', principles:['Purpose, strategy & culture','Stewardship activities reporting','Environmental & social issues'] },
  { code:'Japan Stewardship Code', jurisdiction:'Japan', signatories:327, reporting:'Annual', updated:'2020', principles:['Clear stewardship policy','Monitoring investees','Constructive dialogue'] },
  { code:'EU Shareholders Rights Dir II', jurisdiction:'European Union', signatories:891, reporting:'Public disclosure', updated:'2019', principles:['Engagement policy disclosure','Vote disclosure','Conflicts of interest'] },
  { code:'PRI Stewardship Blueprint', jurisdiction:'Global', signatories:5300, reporting:'Annual PRI report', updated:'2022', principles:['Active ownership integration','Collaborative engagement','ESG incorporation'] },
  { code:'ICGN Global Stewardship', jurisdiction:'Global', signatories:220, reporting:'Voluntary', updated:'2023', principles:['Fiduciary duties','Proportionate engagement','Transparency & accountability'] },
  { code:'Australian Stewardship Code', jurisdiction:'Australia', signatories:147, reporting:'Annual', updated:'2017', principles:['Clear stewardship policy','Active ownership','Transparent reporting'] },
];

const policyColor = v => v === 'Support' ? T.green : v === 'Oppose' ? T.red : T.amber;

const StatCard = ({ label, value }) => (
  <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:'14px 18px', flex:1 }}>
    <div style={{ color:ACCENT, fontSize:22, fontWeight:700 }}>{value}</div>
    <div style={{ color:T.textSec, fontSize:12, marginTop:4 }}>{label}</div>
  </div>
);

const TABS = ['Overview','Voting Policy Comparison','Resolution Categories','Say-on-Pay Tracker','Stewardship Codes'];

export default function ProxyVotingIntelPage() {
  const [tab, setTab] = useState(0);

  return (
    <div style={{ background:T.bg, minHeight:'100vh', fontFamily:T.font, color:T.text, padding:'24px' }}>
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontSize:22, fontWeight:700, color:T.text, margin:0 }}>Proxy Voting & Stewardship Intelligence</h1>
        <p style={{ color:T.textSec, fontSize:13, marginTop:4 }}>Institutional voting patterns, policy benchmarks, and stewardship frameworks</p>
      </div>

      <div style={{ display:'flex', gap:4, borderBottom:`1px solid ${T.border}`, marginBottom:24 }}>
        {TABS.map((t,i) => (
          <button key={i} onClick={() => setTab(i)} style={{ background:'none', border:'none', color: tab===i ? ACCENT : T.textSec, fontFamily:T.font, fontSize:13, fontWeight: tab===i ? 700 : 400, padding:'8px 14px', cursor:'pointer', borderBottom: tab===i ? `2px solid ${ACCENT}` : '2px solid transparent' }}>
            {t}
          </button>
        ))}
      </div>

      {tab === 0 && (
        <div>
          <div style={{ display:'flex', gap:12, marginBottom:24 }}>
            <StatCard label="Meetings Tracked" value="21,000+" />
            <StatCard label="ESG Resolutions YoY" value="+34%" />
            <StatCard label="Avg Against Management" value="8.2%" />
            <StatCard label="Majority Votes Passed" value="127" />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Institutional Investor Voting Summary</div>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                <thead>
                  <tr style={{ color:T.textSec }}>
                    {['Investor','Meetings','For Mgmt %','Against %','Abstain %','ESG Score'].map(h => (
                      <th key={h} style={{ textAlign:'left', padding:'4px 8px', borderBottom:`1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {INSTITUTIONS.map((r,i) => (
                    <tr key={i} style={{ borderBottom:`1px solid ${T.border}` }}>
                      <td style={{ padding:'6px 8px', fontWeight:600 }}>{r.name}</td>
                      <td style={{ padding:'6px 8px', color:T.textSec }}>{r.meetings.toLocaleString()}</td>
                      <td style={{ padding:'6px 8px', color:T.green }}>{r.forMgmt}%</td>
                      <td style={{ padding:'6px 8px', color:T.red }}>{r.against}%</td>
                      <td style={{ padding:'6px 8px', color:T.amber }}>{r.abstain}%</td>
                      <td style={{ padding:'6px 8px' }}><span style={{ background:ACCENT, color:'#fff', borderRadius:4, padding:'2px 6px' }}>{r.esg}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>ESG Resolution Filing Trend (24 Months)</div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={ESG_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="month" tick={{ fill:T.textMut, fontSize:10 }} interval={3} />
                  <YAxis tick={{ fill:T.textMut, fontSize:10 }} />
                  <Tooltip {...tip} />
                  <Area type="monotone" dataKey="filings" stroke={ACCENT} fill={ACCENT} fillOpacity={0.2} name="Filings" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, marginBottom:16 }}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Voting Policy Comparison by Topic</div>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr style={{ color:T.textSec }}>
                  <th style={{ textAlign:'left', padding:'4px 8px', borderBottom:`1px solid ${T.border}` }}>Investor</th>
                  {POLICY_COLS.map(c => <th key={c} style={{ textAlign:'center', padding:'4px 8px', borderBottom:`1px solid ${T.border}` }}>{POLICY_LABELS[c]}</th>)}
                </tr>
              </thead>
              <tbody>
                {POLICIES.map((p,i) => (
                  <tr key={i} style={{ borderBottom:`1px solid ${T.border}` }}>
                    <td style={{ padding:'6px 8px', fontWeight:600 }}>{p.inv}</td>
                    {POLICY_COLS.map(c => (
                      <td key={c} style={{ padding:'6px 8px', textAlign:'center' }}>
                        <span style={{ background: policyColor(p[c])+'22', color: policyColor(p[c]), borderRadius:4, padding:'2px 8px', fontSize:11 }}>{p[c]}</span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Overall ESG Vote Support Rate by Investor</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={INVESTOR_ESG_RATES}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fill:T.textMut, fontSize:11 }} />
                <YAxis tick={{ fill:T.textMut, fontSize:11 }} domain={[0,100]} />
                <Tooltip {...tip} />
                <Bar dataKey="rate" name="ESG Support %">
                  {INVESTOR_ESG_RATES.map((d,i) => <Cell key={i} fill={d.rate >= 80 ? T.green : d.rate >= 65 ? T.amber : ACCENT} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 2 && (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
            <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Resolution Categories — 2023 Filing Data</div>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                <thead>
                  <tr style={{ color:T.textSec }}>
                    {['Category','Filed','Support %','Majority %','Mgmt Rec','Trend'].map(h => (
                      <th key={h} style={{ textAlign:'left', padding:'4px 6px', borderBottom:`1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {RESOLUTION_CATS.map((r,i) => (
                    <tr key={i} style={{ borderBottom:`1px solid ${T.border}` }}>
                      <td style={{ padding:'5px 6px', fontWeight:600 }}>{r.cat}</td>
                      <td style={{ padding:'5px 6px', color:T.textSec }}>{r.filed}</td>
                      <td style={{ padding:'5px 6px', color: r.support >= 50 ? T.green : T.amber }}>{r.support}%</td>
                      <td style={{ padding:'5px 6px' }}>{r.majority}%</td>
                      <td style={{ padding:'5px 6px', color: r.mgmtRec === 'For' ? T.green : T.red }}>{r.mgmtRec}</td>
                      <td style={{ padding:'5px 6px' }}>{r.trend}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Avg Support % by Category</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={RESOLUTION_CATS} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fill:T.textMut, fontSize:10 }} domain={[0,100]} />
                  <YAxis type="category" dataKey="cat" tick={{ fill:T.textMut, fontSize:10 }} width={110} />
                  <Tooltip {...tip} />
                  <Bar dataKey="support" name="Support %">
                    {RESOLUTION_CATS.map((d,i) => <Cell key={i} fill={d.support > 50 ? T.green : d.support > 30 ? T.amber : T.teal} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Climate Resolution Support Trend (24 Months)</div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={CLIMATE_RES_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="month" tick={{ fill:T.textMut, fontSize:10 }} interval={3} />
                <YAxis tick={{ fill:T.textMut, fontSize:10 }} domain={[30,70]} />
                <Tooltip {...tip} />
                <Line type="monotone" dataKey="support" stroke={T.teal} strokeWidth={2} dot={false} name="Support %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 3 && (
        <div>
          <div style={{ display:'flex', gap:12, marginBottom:16 }}>
            <StatCard label="Failed Say-on-Pay Votes (2023)" value="34" />
            <StatCard label="Avg Opposition" value="11.2%" />
            <StatCard label="Companies Changed Pay Post-Vote" value="28%" />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'3fr 2fr', gap:16, marginBottom:16 }}>
            <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Say-on-Pay Results by Company</div>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                <thead>
                  <tr style={{ color:T.textSec }}>
                    {['Company','CEO Pay ($M)','Result %','Proxy Rec','Opposition Drivers','Mgmt Response'].map(h => (
                      <th key={h} style={{ textAlign:'left', padding:'4px 6px', borderBottom:`1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SOP_COMPANIES.map((r,i) => (
                    <tr key={i} style={{ borderBottom:`1px solid ${T.border}` }}>
                      <td style={{ padding:'5px 6px', fontWeight:600 }}>{r.co}</td>
                      <td style={{ padding:'5px 6px' }}>{r.ceoPay}</td>
                      <td style={{ padding:'5px 6px', color: r.result >= 90 ? T.green : r.result >= 75 ? T.amber : T.red }}>{r.result}%</td>
                      <td style={{ padding:'5px 6px', color: r.rec === 'For' ? T.green : T.red }}>{r.rec}</td>
                      <td style={{ padding:'5px 6px', color:T.textSec }}>{r.drivers}</td>
                      <td style={{ padding:'5px 6px', color:T.teal }}>{r.response}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Say-on-Pay Support %</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={SOP_COMPANIES}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="co" tick={{ fill:T.textMut, fontSize:10 }} />
                  <YAxis tick={{ fill:T.textMut, fontSize:10 }} domain={[0,100]} />
                  <Tooltip {...tip} />
                  <Bar dataKey="result" name="Support %">
                    {SOP_COMPANIES.map((d,i) => <Cell key={i} fill={d.result >= 90 ? T.green : d.result >= 75 ? T.amber : T.red} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div style={{ fontSize:13, fontWeight:600, marginTop:16, marginBottom:8 }}>Key Opposition Drivers</div>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                <thead>
                  <tr><th style={{ textAlign:'left', color:T.textSec, padding:'3px 6px', borderBottom:`1px solid ${T.border}` }}>Driver</th><th style={{ textAlign:'right', color:T.textSec, padding:'3px 6px', borderBottom:`1px solid ${T.border}` }}>Cases</th></tr>
                </thead>
                <tbody>
                  {OPPOSITION_DRIVERS.map((d,i) => (
                    <tr key={i} style={{ borderBottom:`1px solid ${T.border}` }}>
                      <td style={{ padding:'4px 6px' }}>{d.driver}</td>
                      <td style={{ padding:'4px 6px', textAlign:'right', color:T.amber }}>{d.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 4 && (
        <div>
          <div style={{ display:'flex', gap:12, marginBottom:16 }}>
            <StatCard label="Total PRI Signatories" value="5,300+" />
            <StatCard label="AUM Covered" value="$120T" />
            <StatCard label="Codes Requiring Public Reporting" value="5 / 6" />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {STEWARDSHIP_CODES.map((c,i) => (
                <div key={i} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:14 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                    <div style={{ fontWeight:600, fontSize:13 }}>{c.code}</div>
                    <span style={{ background:ACCENT+'33', color:ACCENT, borderRadius:4, padding:'2px 7px', fontSize:11 }}>{c.jurisdiction}</span>
                  </div>
                  <ul style={{ margin:'0 0 8px 0', paddingLeft:16, color:T.textSec, fontSize:12 }}>
                    {c.principles.map((p,j) => <li key={j} style={{ marginBottom:2 }}>{p}</li>)}
                  </ul>
                  <div style={{ display:'flex', gap:16, fontSize:12, color:T.textMut }}>
                    <span>Signatories: <strong style={{ color:T.text }}>{c.signatories.toLocaleString()}</strong></span>
                    <span>Reporting: <strong style={{ color:T.text }}>{c.reporting}</strong></span>
                    <span>Updated: <strong style={{ color:T.text }}>{c.updated}</strong></span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Signatory Count by Stewardship Code</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={STEWARDSHIP_CODES} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fill:T.textMut, fontSize:10 }} />
                  <YAxis type="category" dataKey="code" tick={{ fill:T.textMut, fontSize:10 }} width={150} />
                  <Tooltip {...tip} />
                  <Bar dataKey="signatories" name="Signatories">
                    {STEWARDSHIP_CODES.map((d,i) => <Cell key={i} fill={[ACCENT, T.teal, T.green, T.amber, T.sage, T.gold][i % 6]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
