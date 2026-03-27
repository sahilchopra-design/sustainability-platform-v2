import React, { useState } from 'react';
import { AreaChart, Area, BarChart, Bar, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const T = { bg:'#0f172a', surface:'#1e293b', border:'#334155', navy:'#1e3a5f', gold:'#f59e0b', sage:'#10b981', text:'#f1f5f9', textSec:'#94a3b8', textMut:'#64748b', red:'#ef4444', green:'#10b981', amber:'#f59e0b', teal:'#14b8a6', font:"'Inter',sans-serif" };
const ACCENT = '#0ea5e9';
const tip = { contentStyle:{ background:T.surface, border:'1px solid '+T.border, borderRadius:8, color:T.text }, labelStyle:{ color:T.textSec } };
const sr = s => { let x = Math.sin(s+1)*10000; return x - Math.floor(x); };

const TABS = ['Overview','Campaign Database','Proxy Voting','Resolution Tracker','Engagement Outcomes'];

const MONTHS_24 = Array.from({length:24},(_,i)=>{const d=new Date(2022,3+i);return d.toLocaleString('default',{month:'short',year:'2-digit'});});

const campaignTrend = MONTHS_24.map((m,i)=>({ month:m, campaigns: Math.round(28+sr(i*3)*22) }));

const recentCampaigns = [
  {activist:'Activist A',target:'Company A',demand:'Board Refresh',type:'Governance',status:'Won',value:4.2},
  {activist:'Activist B',target:'Company B',demand:'Net Zero Commitment',type:'ESG',status:'Ongoing',value:8.7},
  {activist:'Activist C',target:'Company C',demand:'Strategic Review',type:'Financial',status:'Won',value:12.1},
  {activist:'Activist D',target:'Company D',demand:'Deforestation Policy',type:'ESG',status:'Withdrawn',value:3.5},
  {activist:'Activist E',target:'Company E',demand:'CEO Replacement',type:'Governance',status:'Lost',value:6.8},
  {activist:'Activist F',target:'Company F',demand:'Climate Disclosure',type:'ESG',status:'Won',value:9.3},
  {activist:'Activist G',target:'Company G',demand:'Capital Return',type:'Financial',status:'Ongoing',value:5.4},
  {activist:'Activist H',target:'Company H',demand:'Supply Chain Audit',type:'ESG',status:'Won',value:2.9},
];

const campaigns = [
  {activist:'Elliott',sector:'Energy',demand:'Strategy',esg:'N',seats:3,settled:'Y'},
  {activist:'Starboard',sector:'Technology',demand:'Board Change',esg:'N',seats:2,settled:'N'},
  {activist:'Engine No. 1',sector:'Oil & Gas',demand:'ESG',esg:'Y',seats:3,settled:'Y'},
  {activist:'Follow This',sector:'Energy',demand:'ESG',esg:'Y',seats:0,settled:'N'},
  {activist:'Bluebell',sector:'Consumer',demand:'Strategy',esg:'Y',seats:1,settled:'Y'},
  {activist:'Third Point',sector:'Financials',demand:'M&A',esg:'N',seats:2,settled:'Y'},
  {activist:'Jana Partners',sector:'Tech',demand:'ESG',esg:'Y',seats:1,settled:'Y'},
  {activist:'ValueAct',sector:'Healthcare',demand:'Board Change',esg:'N',seats:2,settled:'N'},
  {activist:'Sachem Head',sector:'Industrials',demand:'Capital Return',esg:'N',seats:0,settled:'Y'},
  {activist:'Ancora',sector:'Auto',demand:'Strategy',esg:'Y',seats:1,settled:'Y'},
];

const demandTypes = [
  {demand:'Strategy',count:38},
  {demand:'Board Change',count:29},
  {demand:'ESG',count:47},
  {demand:'M&A',count:21},
  {demand:'Capital Return',count:33},
];
const DEMAND_COLORS = [ACCENT, T.amber, T.green, T.teal, T.gold];

const investors = [
  {name:'BlackRock',aum:10.0,esgVote:82,sayOnPay:18,climate:74,meetings:2800},
  {name:'Vanguard',aum:8.1,esgVote:71,sayOnPay:12,climate:61,meetings:1900},
  {name:'State Street',aum:4.1,esgVote:85,sayOnPay:22,climate:79,meetings:1400},
  {name:'Norges Bank',aum:1.6,esgVote:91,sayOnPay:31,climate:88,meetings:3200},
  {name:'CalPERS',aum:0.46,esgVote:94,sayOnPay:38,climate:92,meetings:780},
  {name:'AP Funds',aum:0.2,esgVote:89,sayOnPay:27,climate:85,meetings:620},
  {name:'LGIM',aum:1.8,esgVote:88,sayOnPay:29,climate:83,meetings:1100},
  {name:'Amundi',aum:2.0,esgVote:76,sayOnPay:19,climate:68,meetings:940},
];

const esgSupportTrend = MONTHS_24.map((m,i)=>({ month:m, support: Math.round(42+sr(i*7)*18) }));

const resolutions = [
  {type:'Climate Target Setting',filed:142,support:48,majority:31,implemented:24},
  {type:'Board Diversity',filed:98,support:61,majority:52,implemented:38},
  {type:'Executive Pay',filed:134,support:39,majority:28,implemented:19},
  {type:'Deforestation',filed:67,support:44,majority:29,implemented:22},
  {type:'Lobbying Disclosure',filed:89,support:52,majority:43,implemented:31},
  {type:'Political Donations',filed:74,support:35,majority:21,implemented:15},
  {type:'Human Rights DD',filed:81,support:41,majority:26,implemented:20},
  {type:'Net Zero by 2050',filed:127,support:57,majority:46,implemented:33},
];

const engagements = [
  {company:'Company A',issue:'Scope 3 Emissions',duration:'8 months',outcome:'Policy Change',value:2.1,scoreImprove:5.2},
  {company:'Company B',issue:'Board Gender Diversity',duration:'5 months',outcome:'Board Appointment',value:0.8,scoreImprove:3.8},
  {company:'Company C',issue:'Supply Chain Labour',duration:'12 months',outcome:'Disclosure Improvement',value:1.4,scoreImprove:4.5},
  {company:'Company D',issue:'Water Stewardship',duration:'7 months',outcome:'Policy Change',value:0.6,scoreImprove:3.1},
  {company:'Company E',issue:'Deforestation Risk',duration:'10 months',outcome:'No Change',value:0.0,scoreImprove:0.4},
  {company:'Company F',issue:'Executive Pay Alignment',duration:'6 months',outcome:'Disclosure Improvement',value:1.2,scoreImprove:2.9},
];

const esgScoreTrend = MONTHS_24.map((m,i)=>({ month:m, score: +(42+sr(i*5)*6+i*0.25).toFixed(1) }));

const priItems = [
  'Principle 1: Active ownership integrated into investment policy',
  'Principle 2: Voting policy publicly disclosed and applied',
  'Principle 3: Engagement activities reported annually',
  'Principle 4: Collaborative engagement initiatives participated in',
  'Principle 5: Conflicts of interest managed and disclosed',
  'Principle 6: Stewardship activities subject to periodic review',
];

const statusColor = s => s==='Won'?T.green:s==='Ongoing'?ACCENT:s==='Withdrawn'?T.amber:T.red;
const outcomeColor = o => o==='Policy Change'?T.green:o==='Board Appointment'?ACCENT:o==='Disclosure Improvement'?T.teal:T.textMut;

const Card = ({label,value,sub})=>(
  <div style={{background:T.surface,border:'1px solid '+T.border,borderRadius:10,padding:'18px 20px',flex:1,minWidth:160}}>
    <div style={{fontSize:22,fontWeight:700,color:ACCENT}}>{value}</div>
    <div style={{fontSize:13,color:T.text,marginTop:4}}>{label}</div>
    {sub&&<div style={{fontSize:11,color:T.textMut,marginTop:2}}>{sub}</div>}
  </div>
);

const Stat = ({label,value})=>(
  <div style={{background:T.navy,border:'1px solid '+T.border,borderRadius:8,padding:'14px 18px',textAlign:'center'}}>
    <div style={{fontSize:20,fontWeight:700,color:ACCENT}}>{value}</div>
    <div style={{fontSize:12,color:T.textSec,marginTop:3}}>{label}</div>
  </div>
);

export default function ShareholderActivismPage() {
  const [tab, setTab] = useState(0);

  return (
    <div style={{background:T.bg,minHeight:'100vh',fontFamily:T.font,color:T.text,padding:'24px'}}>
      <div style={{marginBottom:24}}>
        <h1 style={{fontSize:24,fontWeight:700,margin:0}}>Shareholder Activism &amp; Engagement</h1>
        <p style={{color:T.textSec,margin:'4px 0 0',fontSize:14}}>EP-AE3 · Campaign tracking, proxy voting, and engagement outcomes</p>
      </div>

      {/* Tab Bar */}
      <div style={{display:'flex',gap:0,borderBottom:'1px solid '+T.border,marginBottom:24}}>
        {TABS.map((t,i)=>(
          <button key={t} onClick={()=>setTab(i)} style={{background:'none',border:'none',borderBottom:tab===i?'2px solid '+ACCENT:'2px solid transparent',color:tab===i?ACCENT:T.textSec,cursor:'pointer',fontFamily:T.font,fontSize:13,fontWeight:600,padding:'10px 18px',transition:'color .2s'}}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab 1 — Overview */}
      {tab===0&&(
        <div style={{display:'flex',flexDirection:'column',gap:20}}>
          <div style={{display:'flex',gap:14,flexWrap:'wrap'}}>
            <Card label="Activist Campaigns 2023" value="847" />
            <Card label="AUM Activists" value="$380bn" />
            <Card label="ESG Proposals" value="62%" sub="of all campaigns" />
            <Card label="Success Rate" value="43%" />
          </div>
          <div style={{background:T.surface,border:'1px solid '+T.border,borderRadius:10,padding:20}}>
            <div style={{fontSize:14,fontWeight:600,marginBottom:12}}>Recent Campaigns</div>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
              <thead>
                <tr style={{color:T.textSec,borderBottom:'1px solid '+T.border}}>
                  {['Activist','Target','Demand','Type','Status','Value ($bn)'].map(h=>(
                    <th key={h} style={{textAlign:'left',padding:'6px 10px',fontWeight:600}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentCampaigns.map((r,i)=>(
                  <tr key={i} style={{borderBottom:'1px solid '+T.border+'44'}}>
                    <td style={{padding:'8px 10px'}}>{r.activist}</td>
                    <td style={{padding:'8px 10px',color:T.textSec}}>{r.target}</td>
                    <td style={{padding:'8px 10px'}}>{r.demand}</td>
                    <td style={{padding:'8px 10px'}}><span style={{background:r.type==='ESG'?T.green+'22':r.type==='Governance'?ACCENT+'22':T.amber+'22',color:r.type==='ESG'?T.green:r.type==='Governance'?ACCENT:T.amber,borderRadius:4,padding:'2px 8px',fontSize:11}}>{r.type}</span></td>
                    <td style={{padding:'8px 10px'}}><span style={{color:statusColor(r.status),fontWeight:600}}>{r.status}</span></td>
                    <td style={{padding:'8px 10px',color:ACCENT}}>{r.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{background:T.surface,border:'1px solid '+T.border,borderRadius:10,padding:20}}>
            <div style={{fontSize:14,fontWeight:600,marginBottom:12}}>Campaign Count Trend (24-Month)</div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={campaignTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="month" tick={{fill:T.textMut,fontSize:11}} interval={3} />
                <YAxis tick={{fill:T.textMut,fontSize:11}} />
                <Tooltip {...tip} />
                <Area type="monotone" dataKey="campaigns" stroke={ACCENT} fill={ACCENT+'33'} name="Campaigns" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 2 — Campaign Database */}
      {tab===1&&(
        <div style={{display:'flex',flexDirection:'column',gap:20}}>
          <div style={{display:'flex',gap:14,flexWrap:'wrap'}}>
            <Stat label="Avg Campaign Duration" value="14 mo" />
            <Stat label="Board Seats Won" value="234" />
            <Stat label="ESG Settlements" value="41%" />
          </div>
          <div style={{background:T.surface,border:'1px solid '+T.border,borderRadius:10,padding:20}}>
            <div style={{fontSize:14,fontWeight:600,marginBottom:12}}>Active Campaigns</div>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
              <thead>
                <tr style={{color:T.textSec,borderBottom:'1px solid '+T.border}}>
                  {['Activist','Sector','Demand','ESG Focus','Board Seats','Settled'].map(h=>(
                    <th key={h} style={{textAlign:'left',padding:'6px 10px',fontWeight:600}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c,i)=>(
                  <tr key={i} style={{borderBottom:'1px solid '+T.border+'44'}}>
                    <td style={{padding:'8px 10px',fontWeight:600}}>{c.activist}</td>
                    <td style={{padding:'8px 10px',color:T.textSec}}>{c.sector}</td>
                    <td style={{padding:'8px 10px'}}>{c.demand}</td>
                    <td style={{padding:'8px 10px'}}><span style={{color:c.esg==='Y'?T.green:T.textMut,fontWeight:600}}>{c.esg==='Y'?'Yes':'No'}</span></td>
                    <td style={{padding:'8px 10px',color:ACCENT}}>{c.seats}</td>
                    <td style={{padding:'8px 10px'}}><span style={{color:c.settled==='Y'?T.green:T.amber,fontWeight:600}}>{c.settled==='Y'?'Yes':'No'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{background:T.surface,border:'1px solid '+T.border,borderRadius:10,padding:20}}>
            <div style={{fontSize:14,fontWeight:600,marginBottom:12}}>Campaigns by Demand Type</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={demandTypes}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="demand" tick={{fill:T.textMut,fontSize:12}} />
                <YAxis tick={{fill:T.textMut,fontSize:11}} />
                <Tooltip {...tip} />
                <Bar dataKey="count" name="Campaigns" radius={[4,4,0,0]}>
                  {demandTypes.map((_,i)=><Cell key={i} fill={DEMAND_COLORS[i%DEMAND_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 3 — Proxy Voting */}
      {tab===2&&(
        <div style={{display:'flex',flexDirection:'column',gap:20}}>
          <div style={{background:T.surface,border:'1px solid '+T.border,borderRadius:10,padding:20}}>
            <div style={{fontSize:14,fontWeight:600,marginBottom:12}}>Institutional Investor Voting Profiles</div>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
              <thead>
                <tr style={{color:T.textSec,borderBottom:'1px solid '+T.border}}>
                  {['Investor','AUM ($T)','ESG Vote %','Say-on-Pay Opp %','Climate Res %','Engagements/yr'].map(h=>(
                    <th key={h} style={{textAlign:'left',padding:'6px 10px',fontWeight:600}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {investors.map((inv,i)=>(
                  <tr key={i} style={{borderBottom:'1px solid '+T.border+'44'}}>
                    <td style={{padding:'8px 10px',fontWeight:600}}>{inv.name}</td>
                    <td style={{padding:'8px 10px',color:T.textSec}}>{inv.aum}</td>
                    <td style={{padding:'8px 10px',color:inv.esgVote>=80?T.green:inv.esgVote>=60?T.amber:ACCENT,fontWeight:600}}>{inv.esgVote}%</td>
                    <td style={{padding:'8px 10px'}}>{inv.sayOnPay}%</td>
                    <td style={{padding:'8px 10px',color:ACCENT}}>{inv.climate}%</td>
                    <td style={{padding:'8px 10px',color:T.textSec}}>{inv.meetings.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{background:T.surface,border:'1px solid '+T.border,borderRadius:10,padding:20}}>
            <div style={{fontSize:14,fontWeight:600,marginBottom:12}}>ESG Vote Rate by Investor</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={investors}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{fill:T.textMut,fontSize:11}} />
                <YAxis domain={[0,100]} tick={{fill:T.textMut,fontSize:11}} unit="%" />
                <Tooltip {...tip} formatter={v=>[v+'%','ESG Vote Rate']} />
                <Bar dataKey="esgVote" name="ESG Vote %" radius={[4,4,0,0]}>
                  {investors.map((inv,i)=><Cell key={i} fill={inv.esgVote>=80?T.green:inv.esgVote>=60?T.amber:ACCENT} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{background:T.surface,border:'1px solid '+T.border,borderRadius:10,padding:20}}>
            <div style={{fontSize:14,fontWeight:600,marginBottom:12}}>ESG Resolution Support Trend (24-Month)</div>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={esgSupportTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="month" tick={{fill:T.textMut,fontSize:11}} interval={3} />
                <YAxis tick={{fill:T.textMut,fontSize:11}} unit="%" />
                <Tooltip {...tip} formatter={v=>[v+'%','Support']} />
                <Line type="monotone" dataKey="support" stroke={T.green} dot={false} strokeWidth={2} name="Support %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 4 — Resolution Tracker */}
      {tab===3&&(
        <div style={{display:'flex',flexDirection:'column',gap:20}}>
          <div style={{display:'flex',gap:14,flexWrap:'wrap'}}>
            <Stat label="Total ESG Resolutions 2023" value="812" />
            <Stat label="Avg Support" value="34%" />
            <Stat label="Implemented Post-Vote" value="28%" />
          </div>
          <div style={{background:T.surface,border:'1px solid '+T.border,borderRadius:10,padding:20}}>
            <div style={{fontSize:14,fontWeight:600,marginBottom:12}}>Shareholder Resolution Types</div>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
              <thead>
                <tr style={{color:T.textSec,borderBottom:'1px solid '+T.border}}>
                  {['Resolution Type','Filed 2023','Avg Support %','Majority Votes %','Implementation %'].map(h=>(
                    <th key={h} style={{textAlign:'left',padding:'6px 10px',fontWeight:600}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {resolutions.map((r,i)=>(
                  <tr key={i} style={{borderBottom:'1px solid '+T.border+'44'}}>
                    <td style={{padding:'8px 10px',fontWeight:600}}>{r.type}</td>
                    <td style={{padding:'8px 10px',color:T.textSec}}>{r.filed}</td>
                    <td style={{padding:'8px 10px',color:r.support>=50?T.green:r.support>=30?T.amber:ACCENT,fontWeight:600}}>{r.support}%</td>
                    <td style={{padding:'8px 10px'}}>{r.majority}%</td>
                    <td style={{padding:'8px 10px',color:T.teal}}>{r.implemented}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{background:T.surface,border:'1px solid '+T.border,borderRadius:10,padding:20}}>
            <div style={{fontSize:14,fontWeight:600,marginBottom:12}}>Avg Support % by Resolution Type</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={resolutions} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" domain={[0,80]} tick={{fill:T.textMut,fontSize:11}} unit="%" />
                <YAxis type="category" dataKey="type" tick={{fill:T.textMut,fontSize:10}} width={140} />
                <Tooltip {...tip} formatter={v=>[v+'%','Avg Support']} />
                <Bar dataKey="support" name="Avg Support %" radius={[0,4,4,0]}>
                  {resolutions.map((r,i)=><Cell key={i} fill={r.support>=50?T.green:r.support>=30?T.amber:ACCENT} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 5 — Engagement Outcomes */}
      {tab===4&&(
        <div style={{display:'flex',flexDirection:'column',gap:20}}>
          <div style={{display:'flex',gap:14,flexWrap:'wrap'}}>
            <Stat label="Companies Engaged 2023" value="2,847" />
            <Stat label="Successful Outcomes" value="67%" />
            <Stat label="Avg ESG Score Improvement" value="+4.2 pts" />
          </div>
          <div style={{background:T.surface,border:'1px solid '+T.border,borderRadius:10,padding:20}}>
            <div style={{fontSize:14,fontWeight:600,marginBottom:12}}>Engagement Case Studies</div>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
              <thead>
                <tr style={{color:T.textSec,borderBottom:'1px solid '+T.border}}>
                  {['Company','Issue Raised','Duration','Outcome','Value ($bn)','ESG Score +'].map(h=>(
                    <th key={h} style={{textAlign:'left',padding:'6px 10px',fontWeight:600}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {engagements.map((e,i)=>(
                  <tr key={i} style={{borderBottom:'1px solid '+T.border+'44'}}>
                    <td style={{padding:'8px 10px',fontWeight:600}}>{e.company}</td>
                    <td style={{padding:'8px 10px',color:T.textSec}}>{e.issue}</td>
                    <td style={{padding:'8px 10px'}}>{e.duration}</td>
                    <td style={{padding:'8px 10px'}}><span style={{color:outcomeColor(e.outcome),fontWeight:600}}>{e.outcome}</span></td>
                    <td style={{padding:'8px 10px',color:ACCENT}}>{e.value>0?e.value:'—'}</td>
                    <td style={{padding:'8px 10px',color:e.scoreImprove>=4?T.green:T.amber}}>+{e.scoreImprove}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{background:T.surface,border:'1px solid '+T.border,borderRadius:10,padding:20}}>
            <div style={{fontSize:14,fontWeight:600,marginBottom:12}}>Portfolio ESG Score Improvement (24-Month)</div>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={esgScoreTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="month" tick={{fill:T.textMut,fontSize:11}} interval={3} />
                <YAxis tick={{fill:T.textMut,fontSize:11}} domain={['auto','auto']} />
                <Tooltip {...tip} formatter={v=>[v,'ESG Score']} />
                <Line type="monotone" dataKey="score" stroke={T.sage} dot={false} strokeWidth={2} name="ESG Score" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{background:T.surface,border:'1px solid '+T.border,borderRadius:10,padding:20}}>
            <div style={{fontSize:14,fontWeight:600,marginBottom:12}}>PRI Responsible Investment Stewardship Compliance</div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {priItems.map((item,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',background:T.navy,borderRadius:6,fontSize:13}}>
                  <span style={{color:T.green,fontWeight:700,fontSize:15}}>✓</span>
                  <span style={{color:T.text}}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
