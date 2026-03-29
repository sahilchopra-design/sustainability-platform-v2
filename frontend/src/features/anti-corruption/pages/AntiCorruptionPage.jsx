import React, { useState } from 'react';
import { AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const ACCENT = '#dc2626';
const tip = { contentStyle:{ background:T.surface, border:'1px solid '+T.border, borderRadius:8, color:T.text }, labelStyle:{ color:T.textSec } };
const sr = s => { let x = Math.sin(s+1)*10000; return x - Math.floor(x); };

const ENFORCEMENT_TREND = Array.from({length:24}, (_,i) => ({
  month: `M${i+1}`,
  actions: Math.round(18 + sr(i*7)*22),
  fines: Math.round(200 + sr(i*13)*800),
}));

const COUNTRY_CPI = [
  { country:'Denmark',   cpi:90, region:'Europe' },
  { country:'Finland',   cpi:87, region:'Europe' },
  { country:'Singapore', cpi:83, region:'Asia' },
  { country:'Germany',   cpi:78, region:'Europe' },
  { country:'UK',        cpi:71, region:'Europe' },
  { country:'India',     cpi:40, region:'Asia' },
  { country:'Brazil',    cpi:36, region:'Americas' },
  { country:'Russia',    cpi:26, region:'Europe' },
  { country:'Nigeria',   cpi:25, region:'Africa' },
  { country:'Somalia',   cpi:11, region:'Africa' },
];

const ENFORCEMENT_CASES = [
  { company:'Airbus',        law:'Sapin II / FCPA', jurisdiction:'France/US/UK', fine:4000, dpa:'DPA', year:2020, sector:'Aerospace' },
  { company:'Goldman Sachs', law:'FCPA',            jurisdiction:'US',           fine:2900, dpa:'DPA', year:2020, sector:'Finance' },
  { company:'Siemens',       law:'FCPA / StGB',     jurisdiction:'US/Germany',   fine:1600, dpa:'DPA', year:2008, sector:'Industrials' },
  { company:'Glencore',      law:'FCPA',            jurisdiction:'US/UK',        fine:1500, dpa:'DPA', year:2022, sector:'Commodities' },
  { company:'Ericsson',      law:'FCPA',            jurisdiction:'US',           fine:1060, dpa:'Guilty', year:2022, sector:'Technology' },
  { company:'Credit Suisse', law:'FCPA',            jurisdiction:'US',           fine:475,  dpa:'DPA', year:2021, sector:'Finance' },
  { company:'ABB',           law:'FCPA',            jurisdiction:'US',           fine:315,  dpa:'DPA', year:2022, sector:'Industrials' },
  { company:'Vitol',         law:'FCPA',            jurisdiction:'US',           fine:164,  dpa:'DPA', year:2020, sector:'Energy' },
];

const COUNTRY_RISK = [
  { country:'Venezuela', cpi:13, bribery:82, procurement:91, judicial:18, pressFreedom:159, rating:'Critical' },
  { country:'Yemen',     cpi:16, bribery:78, procurement:88, judicial:21, pressFreedom:167, rating:'Critical' },
  { country:'Nigeria',   cpi:25, bribery:71, procurement:79, judicial:29, pressFreedom:112, rating:'Very High' },
  { country:'Russia',    cpi:26, bribery:68, procurement:74, judicial:25, pressFreedom:164, rating:'Very High' },
  { country:'Bangladesh',cpi:25, bribery:66, procurement:72, judicial:32, pressFreedom:163, rating:'Very High' },
  { country:'Mexico',    cpi:31, bribery:58, procurement:65, judicial:38, pressFreedom:121, rating:'High' },
  { country:'Indonesia', cpi:34, bribery:54, procurement:61, judicial:42, pressFreedom:108, rating:'High' },
  { country:'India',     cpi:40, bribery:47, procurement:55, judicial:48, pressFreedom:161, rating:'Elevated' },
  { country:'Brazil',    cpi:36, bribery:51, procurement:59, judicial:44, pressFreedom:99,  rating:'High' },
  { country:'Turkey',    cpi:34, bribery:53, procurement:63, judicial:37, pressFreedom:158, rating:'High' },
];

const CORPORATE_CONTROLS = [
  { company:'Company A', iso:true,  training:91, diligence:88, hotline:true,  audit:82, gri:78 },
  { company:'Company B', iso:true,  training:85, diligence:79, hotline:true,  audit:76, gri:71 },
  { company:'Company C', iso:false, training:67, diligence:61, hotline:true,  audit:58, gri:54 },
  { company:'Company D', iso:true,  training:88, diligence:82, hotline:true,  audit:79, gri:82 },
  { company:'Company E', iso:false, training:52, diligence:44, hotline:false, audit:41, gri:38 },
  { company:'Company F', iso:true,  training:79, diligence:74, hotline:true,  audit:71, gri:66 },
  { company:'Company G', iso:false, training:61, diligence:55, hotline:true,  audit:52, gri:47 },
  { company:'Company H', iso:true,  training:94, diligence:91, hotline:true,  audit:88, gri:85 },
];

const CONTROLS_SCORE = CORPORATE_CONTROLS.map(c => ({
  company: c.company,
  score: Math.round((c.training + c.diligence + c.audit + c.gri + (c.iso ? 100 : 0) + (c.hotline ? 100 : 0)) / 6),
}));

const BEST_PRACTICES = [
  'Tone from the top — Board & C-suite commitment',
  'Periodic corruption risk assessment',
  'Third-party due diligence programme',
  'Gifts, hospitality & facilitation payment controls',
  'Annual anti-bribery training (all staff)',
  'Confidential whistleblower reporting channel',
  'Continuous monitoring & transaction screening',
  'Regular independent programme review & update',
];

const LAWS = [
  { name:'US FCPA',               jurisdiction:'US',    scope:'Foreign',    facilitation:'Exempt', liability:'Fault',  penalty:'$25M / 20yr', keyReq:'Accounting provisions', signatories:null, count:44 },
  { name:'UK Bribery Act 2010',   jurisdiction:'UK',    scope:'Foreign+Dom',facilitation:'No',     liability:'Strict', penalty:'Unlimited',   keyReq:'Adequate procedures defence', signatories:null, count:41 },
  { name:'France Sapin II',       jurisdiction:'France',scope:'Foreign+Dom',facilitation:'No',     liability:'Fault',  penalty:'€10M / 3x gain', keyReq:'Compliance programme mandatory', signatories:null, count:38 },
  { name:'Germany LkSG',          jurisdiction:'Germany',scope:'Supply Chain',facilitation:'No',   liability:'Fault',  penalty:'€8M / 2% turnover', keyReq:'Supply chain due diligence', signatories:null, count:32 },
  { name:'OECD Anti-Bribery Conv',jurisdiction:'OECD',  scope:'Foreign',    facilitation:'N/A',   liability:'Mixed',  penalty:'Varies',      keyReq:'Criminalise foreign bribery', signatories:44, count:44 },
  { name:'UNCAC',                 jurisdiction:'UN',    scope:'Foreign+Dom',facilitation:'N/A',    liability:'Mixed',  penalty:'Varies',      keyReq:'Asset recovery & prevention', signatories:189, count:189 },
];

const Card = ({label, value, sub}) => (
  <div style={{background:T.surface, border:'1px solid '+T.border, borderRadius:10, padding:'16px 20px', flex:1, minWidth:180}}>
    <div style={{color:T.textSec, fontSize:12, marginBottom:6}}>{label}</div>
    <div style={{color:ACCENT, fontSize:22, fontWeight:700}}>{value}</div>
    {sub && <div style={{color:T.textMut, fontSize:11, marginTop:4}}>{sub}</div>}
  </div>
);

const StatRow = ({items}) => (
  <div style={{display:'flex', gap:12, marginBottom:20, flexWrap:'wrap'}}>
    {items.map((s,i) => <Card key={i} label={s.label} value={s.value} sub={s.sub}/>)}
  </div>
);

const TABS = ['Overview','Regulatory Enforcement','Country Risk Matrix','Corporate Controls','Legislative Landscape'];

export default function AntiCorruptionPage() {
  const [tab, setTab] = useState(0);

  return (
    <div style={{background:T.bg, minHeight:'100vh', fontFamily:T.font, color:T.text, padding:24}}>
      <div style={{marginBottom:24}}>
        <h1 style={{fontSize:22, fontWeight:700, margin:0}}>Anti-Corruption & Bribery Intelligence</h1>
        <p style={{color:T.textSec, fontSize:13, marginTop:4}}>EP-AE4 · Transparency International · FCPA · UK Bribery Act · Sapin II</p>
      </div>

      <div style={{display:'flex', gap:0, borderBottom:'1px solid '+T.border, marginBottom:24}}>
        {TABS.map((t,i) => (
          <button key={i} onClick={()=>setTab(i)} style={{background:'none', border:'none', color: tab===i ? T.text : T.textSec, padding:'10px 18px', cursor:'pointer', fontSize:13, fontWeight: tab===i ? 700 : 400, borderBottom: tab===i ? '2px solid '+ACCENT : '2px solid transparent', transition:'all .2s'}}>
            {t}
          </button>
        ))}
      </div>

      {tab === 0 && (
        <div>
          <StatRow items={[
            {label:'CPI Score (Global Avg)', value:'43/100', sub:'Transparency International 2023'},
            {label:'Annual Bribery Cost', value:'$3.6T', sub:'World Economic Forum estimate'},
            {label:'FCPA Fines 2023', value:'$2.8bn', sub:'DOJ & SEC combined'},
            {label:'ISO 37001 Certified', value:'8,200', sub:'Organisations worldwide'},
          ]}/>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
            <div style={{background:T.surface, border:'1px solid '+T.border, borderRadius:10, padding:16}}>
              <div style={{fontWeight:600, marginBottom:12, fontSize:14}}>CPI Rankings — Selected Countries (2023)</div>
              <table style={{width:'100%', borderCollapse:'collapse', fontSize:13}}>
                <thead><tr style={{color:T.textSec}}><th style={{textAlign:'left', paddingBottom:8}}>Country</th><th style={{textAlign:'right', paddingBottom:8}}>CPI</th><th style={{textAlign:'right', paddingBottom:8}}>Region</th></tr></thead>
                <tbody>
                  {COUNTRY_CPI.map((r,i)=>(
                    <tr key={i} style={{borderTop:'1px solid '+T.border}}>
                      <td style={{padding:'7px 0'}}>{r.country}</td>
                      <td style={{textAlign:'right', color: r.cpi>=70 ? T.green : r.cpi>=50 ? T.amber : T.red, fontWeight:600}}>{r.cpi}</td>
                      <td style={{textAlign:'right', color:T.textMut}}>{r.region}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{background:T.surface, border:'1px solid '+T.border, borderRadius:10, padding:16}}>
              <div style={{fontWeight:600, marginBottom:12, fontSize:14}}>Global Enforcement Actions — 24-Month Trend</div>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={ENFORCEMENT_TREND} margin={{top:4, right:8, left:-20, bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                  <XAxis dataKey="month" tick={{fill:T.textMut, fontSize:10}} interval={5}/>
                  <YAxis tick={{fill:T.textMut, fontSize:10}}/>
                  <Tooltip {...tip}/>
                  <Area type="monotone" dataKey="actions" stroke={ACCENT} fill={ACCENT} fillOpacity={0.2} name="Actions"/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div>
          <StatRow items={[
            {label:'Total FCPA Fines 2019–2023', value:'$14.8bn', sub:'DOJ/SEC enforcement'},
            {label:'Avg DPA Length', value:'3.2 yrs', sub:'Deferred prosecution agreements'},
            {label:'Corporate Recidivism Rate', value:'18%', sub:'Re-offence within 10 years'},
          ]}/>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
            <div style={{background:T.surface, border:'1px solid '+T.border, borderRadius:10, padding:16}}>
              <div style={{fontWeight:600, marginBottom:12, fontSize:14}}>Major Enforcement Actions</div>
              <table style={{width:'100%', borderCollapse:'collapse', fontSize:12}}>
                <thead><tr style={{color:T.textSec}}>{['Company','Law','Fine ($M)','Type','Year','Sector'].map(h=><th key={h} style={{textAlign:'left', paddingBottom:8, paddingRight:8}}>{h}</th>)}</tr></thead>
                <tbody>
                  {ENFORCEMENT_CASES.map((r,i)=>(
                    <tr key={i} style={{borderTop:'1px solid '+T.border}}>
                      <td style={{padding:'6px 0', fontWeight:600}}>{r.company}</td>
                      <td style={{paddingRight:8, color:T.textSec}}>{r.law}</td>
                      <td style={{paddingRight:8, color: r.fine>1000 ? T.red : r.fine>200 ? T.amber : T.green, fontWeight:700}}>{r.fine.toLocaleString()}</td>
                      <td style={{paddingRight:8, color:T.textMut}}>{r.dpa}</td>
                      <td style={{paddingRight:8}}>{r.year}</td>
                      <td style={{color:T.textMut}}>{r.sector}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{background:T.surface, border:'1px solid '+T.border, borderRadius:10, padding:16}}>
              <div style={{fontWeight:600, marginBottom:12, fontSize:14}}>Fine Amounts by Case ($M)</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={ENFORCEMENT_CASES} margin={{top:4, right:8, left:-10, bottom:40}}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                  <XAxis dataKey="company" tick={{fill:T.textMut, fontSize:10}} angle={-35} textAnchor="end"/>
                  <YAxis tick={{fill:T.textMut, fontSize:10}}/>
                  <Tooltip {...tip} formatter={v=>[`$${v.toLocaleString()}M`,'Fine']}/>
                  <Bar dataKey="fine" radius={[4,4,0,0]}>
                    {ENFORCEMENT_CASES.map((e,i)=>(
                      <Cell key={i} fill={e.fine>1000 ? T.red : e.fine>200 ? T.amber : T.green}/>
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 2 && (
        <div>
          <StatRow items={[
            {label:'Countries Below CPI 50', value:'68%', sub:'Of 180 ranked nations'},
            {label:'G20 Average CPI', value:'54', sub:'Transparency International'},
            {label:'OECD Average CPI', value:'67', sub:'Member states avg 2023'},
          ]}/>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
            <div style={{background:T.surface, border:'1px solid '+T.border, borderRadius:10, padding:16}}>
              <div style={{fontWeight:600, marginBottom:12, fontSize:14}}>High-Risk Jurisdiction Heat Map</div>
              <table style={{width:'100%', borderCollapse:'collapse', fontSize:11}}>
                <thead><tr style={{color:T.textSec}}>{['Country','CPI','Bribery%','Procurement','Judicial','Press Rank','Rating'].map(h=><th key={h} style={{textAlign:'left', paddingBottom:8, paddingRight:6}}>{h}</th>)}</tr></thead>
                <tbody>
                  {COUNTRY_RISK.map((r,i)=>{
                    const bg = r.rating==='Critical'?'rgba(220,38,38,0.15)':r.rating==='Very High'?'rgba(239,68,68,0.1)':r.rating==='High'?'rgba(245,158,11,0.1)':'rgba(16,185,129,0.08)';
                    return (
                      <tr key={i} style={{borderTop:'1px solid '+T.border, background:bg}}>
                        <td style={{padding:'5px 0', fontWeight:600}}>{r.country}</td>
                        <td style={{color: r.cpi<30 ? T.red : T.amber, fontWeight:700}}>{r.cpi}</td>
                        <td style={{color:T.textSec}}>{r.bribery}%</td>
                        <td style={{color:T.textSec}}>{r.procurement}</td>
                        <td style={{color:T.textSec}}>{r.judicial}</td>
                        <td style={{color:T.textMut}}>{r.pressFreedom}</td>
                        <td style={{color: r.rating==='Critical'?T.red:r.rating==='Very High'?'#f87171':r.rating==='High'?T.amber:T.green, fontWeight:600, fontSize:10}}>{r.rating}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{background:T.surface, border:'1px solid '+T.border, borderRadius:10, padding:16}}>
              <div style={{fontWeight:600, marginBottom:12, fontSize:14}}>CPI Scores — High-Risk Countries</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={COUNTRY_RISK} margin={{top:4, right:8, left:-10, bottom:40}}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                  <XAxis dataKey="country" tick={{fill:T.textMut, fontSize:10}} angle={-35} textAnchor="end"/>
                  <YAxis tick={{fill:T.textMut, fontSize:10}} domain={[0,100]}/>
                  <Tooltip {...tip}/>
                  <Bar dataKey="cpi" radius={[4,4,0,0]} name="CPI Score">
                    {COUNTRY_RISK.map((c,i)=>(
                      <Cell key={i} fill={c.cpi<40 ? T.red : c.cpi<60 ? T.amber : T.green}/>
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 3 && (
        <div>
          <StatRow items={[
            {label:'Fortune 500 with ISO 37001', value:'23%', sub:'Anti-bribery management systems'},
            {label:'Avg Training Coverage', value:'71%', sub:'Across surveyed corporates'},
            {label:'Whistleblower Hotline Adoption', value:'84%', sub:'S&P 500 companies'},
          ]}/>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
            <div style={{background:T.surface, border:'1px solid '+T.border, borderRadius:10, padding:16}}>
              <div style={{fontWeight:600, marginBottom:12, fontSize:14}}>Corporate Controls Assessment</div>
              <table style={{width:'100%', borderCollapse:'collapse', fontSize:12}}>
                <thead><tr style={{color:T.textSec}}>{['Company','ISO','Training%','3P DD%','Hotline','Audit','GRI 205%'].map(h=><th key={h} style={{textAlign:'left', paddingBottom:8, paddingRight:8}}>{h}</th>)}</tr></thead>
                <tbody>
                  {CORPORATE_CONTROLS.map((r,i)=>(
                    <tr key={i} style={{borderTop:'1px solid '+T.border}}>
                      <td style={{padding:'6px 0', fontWeight:600}}>{r.company}</td>
                      <td style={{color: r.iso ? T.green : T.red}}>{r.iso ? 'Yes' : 'No'}</td>
                      <td style={{color: r.training>=80 ? T.green : r.training>=60 ? T.amber : T.red}}>{r.training}</td>
                      <td style={{color: r.diligence>=75 ? T.green : r.diligence>=55 ? T.amber : T.red}}>{r.diligence}</td>
                      <td style={{color: r.hotline ? T.green : T.red}}>{r.hotline ? 'Yes' : 'No'}</td>
                      <td style={{color:T.textSec}}>{r.audit}</td>
                      <td style={{color:T.textSec}}>{r.gri}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{marginTop:16}}>
                <div style={{fontWeight:600, fontSize:13, marginBottom:8}}>Best Practice Checklist</div>
                {BEST_PRACTICES.map((bp,i)=>(
                  <div key={i} style={{display:'flex', alignItems:'center', gap:8, padding:'4px 0', fontSize:12, color:T.textSec}}>
                    <span style={{color:T.green, fontSize:14}}>✓</span>{bp}
                  </div>
                ))}
              </div>
            </div>
            <div style={{background:T.surface, border:'1px solid '+T.border, borderRadius:10, padding:16}}>
              <div style={{fontWeight:600, marginBottom:12, fontSize:14}}>Overall Controls Score by Company</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={CONTROLS_SCORE} margin={{top:4, right:8, left:-10, bottom:20}}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                  <XAxis dataKey="company" tick={{fill:T.textMut, fontSize:10}}/>
                  <YAxis tick={{fill:T.textMut, fontSize:10}} domain={[0,100]}/>
                  <Tooltip {...tip} formatter={v=>[`${v}%`,'Controls Score']}/>
                  <Bar dataKey="score" radius={[4,4,0,0]} name="Controls Score">
                    {CONTROLS_SCORE.map((c,i)=>(
                      <Cell key={i} fill={c.score>=75 ? T.green : c.score>=55 ? T.amber : T.red}/>
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 4 && (
        <div>
          <StatRow items={[
            {label:'UNCAC Signatories', value:'189', sub:'UN Convention Against Corruption'},
            {label:'OECD Convention Parties', value:'44', sub:'Anti-Bribery Convention members'},
            {label:'Corporate Criminal Liability', value:'62%', sub:'Countries with law for bribery'},
          ]}/>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
            <div style={{display:'flex', flexDirection:'column', gap:12}}>
              {LAWS.map((l,i)=>(
                <div key={i} style={{background:T.surface, border:'1px solid '+T.border, borderRadius:10, padding:14}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
                    <span style={{fontWeight:700, fontSize:13}}>{l.name}</span>
                    <span style={{background:ACCENT, color:'#fff', borderRadius:4, padding:'2px 8px', fontSize:11}}>{l.jurisdiction}</span>
                  </div>
                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6, fontSize:11}}>
                    <div><span style={{color:T.textMut}}>Scope: </span><span style={{color:T.text}}>{l.scope}</span></div>
                    <div><span style={{color:T.textMut}}>Facilitation: </span><span style={{color: l.facilitation==='No'?T.red:T.amber}}>{l.facilitation}</span></div>
                    <div><span style={{color:T.textMut}}>Liability: </span><span style={{color: l.liability==='Strict'?T.red:T.text}}>{l.liability}</span></div>
                    <div><span style={{color:T.textMut}}>Max Penalty: </span><span style={{color:T.text}}>{l.penalty}</span></div>
                    <div style={{gridColumn:'span 2'}}><span style={{color:T.textMut}}>Key Req: </span><span style={{color:T.textSec}}>{l.keyReq}</span></div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{background:T.surface, border:'1px solid '+T.border, borderRadius:10, padding:16}}>
              <div style={{fontWeight:600, marginBottom:12, fontSize:14}}>Signatories / Compliance Count per Framework</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={LAWS} margin={{top:4, right:8, left:-10, bottom:60}}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                  <XAxis dataKey="name" tick={{fill:T.textMut, fontSize:9}} angle={-35} textAnchor="end" interval={0}/>
                  <YAxis tick={{fill:T.textMut, fontSize:10}}/>
                  <Tooltip {...tip} formatter={v=>[v,'Count']}/>
                  <Bar dataKey="count" radius={[4,4,0,0]} name="Count">
                    {LAWS.map((l,i)=>(
                      <Cell key={i} fill={l.count>=100 ? T.green : l.count>=40 ? T.amber : T.teal}/>
                    ))}
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
