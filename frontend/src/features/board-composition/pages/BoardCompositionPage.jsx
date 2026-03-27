import React, { useState } from 'react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, ResponsiveContainer } from 'recharts';

const T = { bg:'#0f172a', surface:'#1e293b', border:'#334155', navy:'#1e3a5f', gold:'#f59e0b', sage:'#10b981', text:'#f1f5f9', textSec:'#94a3b8', textMut:'#64748b', red:'#ef4444', green:'#10b981', amber:'#f59e0b', teal:'#14b8a6', font:"'Inter',sans-serif" };
const ACCENT = '#6366f1';
const tip = { contentStyle:{ background:T.surface, border:'1px solid '+T.border, borderRadius:8, color:T.text }, labelStyle:{ color:T.textSec } };
const sr = s => { let x = Math.sin(s+1)*10000; return x - Math.floor(x); };

const COMPANIES = ['Alpha','Beta','Gamma','Delta','Epsilon','Zeta','Eta','Theta'];

const OVERVIEW_TABLE = COMPANIES.map((c,i) => ({
  company: c,
  boardSize: 9 + Math.round(sr(i*7)*6),
  femaleP: Math.round(25 + sr(i*13)*25),
  independentP: Math.round(65 + sr(i*17)*25),
  avgAge: Math.round(54 + sr(i*11)*12),
  avgTenure: parseFloat((5 + sr(i*19)*8).toFixed(1)),
  esgCommittee: sr(i*23) > 0.4 ? 'Y' : 'N',
}));

const FEMALE_TREND = Array.from({length:24},(_,i) => ({
  month: `M${i+1}`,
  pct: parseFloat((28 + sr(i*3)*12).toFixed(1)),
}));

const DIVERSITY_DIMS = [
  { dim:'Gender', current:34, leading:45, target:40, },
  { dim:'Age', current:28, leading:40, target:33, },
  { dim:'Nationality', current:42, leading:60, target:50, },
  { dim:'Ethnicity', current:18, leading:35, target:25, },
  { dim:'Skill Mix', current:55, leading:75, target:65, },
  { dim:'Independence', current:78, leading:90, target:80, },
];

const SKILL_AREAS = ['Financial','ESG/Sustainability','Technology','Industry','International','Risk','Legal/Reg','Strategy'];

const SKILLS_TABLE = COMPANIES.map((c,i) => {
  const row = { company: c };
  SKILL_AREAS.forEach((s,j) => { row[s] = Math.round(40 + sr(i*7+j*3)*55); });
  return row;
});

const SKILL_AVGS = SKILL_AREAS.map((s,j) => ({
  skill: s,
  avg: Math.round(SKILLS_TABLE.reduce((a,r)=>a+r[s],0)/COMPANIES.length),
}));

const TENURE_BANDS = [
  { band:'<2 yrs', count:42, indepRisk:'Low', entScore:12, view:'Fresh' },
  { band:'2–4 yrs', count:68, indepRisk:'Low', entScore:22, view:'Fresh' },
  { band:'4–6 yrs', count:95, indepRisk:'Moderate', entScore:41, view:'Balanced' },
  { band:'6–9 yrs', count:78, indepRisk:'Moderate', entScore:58, view:'Balanced' },
  { band:'9–12 yrs', count:47, indepRisk:'High', entScore:74, view:'Stale' },
  { band:'12+ yrs', count:29, indepRisk:'Very High', entScore:91, view:'Stale' },
];

const TURNOVER_TREND = Array.from({length:24},(_,i) => ({
  month: `M${i+1}`,
  rate: parseFloat((8 + sr(i*5)*10).toFixed(1)),
}));

const FRAMEWORKS = [
  { name:'EU CSRD', jurisdiction:'EU', req:'Board sustainability oversight & disclosure', comply:'Y', penalty:'Admin fines up to 10M EUR', date:'2024' },
  { name:'UK CGC', jurisdiction:'UK', req:'Diversity policy & annual reporting', comply:'Y', penalty:'Explain deviation', date:'2018 (rev 2024)' },
  { name:'NYSE/Nasdaq', jurisdiction:'US', req:'Minimum 1 diverse director (Nasdaq)', comply:'Y', penalty:'Delisting risk', date:'2022' },
  { name:'ISS Policy', jurisdiction:'Global', req:'30% gender diversity threshold', comply:'N', penalty:'Against-vote recommendation', date:'2023' },
  { name:'Glass Lewis', jurisdiction:'Global', req:'Board gender diversity ≥30%', comply:'N', penalty:'Withhold recommendation', date:'2023' },
  { name:'EU Gender Directive', jurisdiction:'EU', req:'40% female non-exec directors', comply:'N', penalty:'Annulment of appointments', date:'2026' },
];

const FRAMEWORK_COMPLIANCE = FRAMEWORKS.map(f => ({ name:f.name, rate: f.comply==='Y'?Math.round(72+sr(FRAMEWORKS.indexOf(f)*9)*20):Math.round(35+sr(FRAMEWORKS.indexOf(f)*11)*25) }));

const TABS = ['Overview','Diversity Analytics','Skills Matrix','Tenure & Refreshment','Regulatory'];

const Card = ({label,value,sub}) => (
  <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:'18px 22px',flex:1,minWidth:180}}>
    <div style={{color:T.textSec,fontSize:12,marginBottom:6}}>{label}</div>
    <div style={{color:ACCENT,fontSize:22,fontWeight:700}}>{value}</div>
    {sub && <div style={{color:T.textMut,fontSize:11,marginTop:4}}>{sub}</div>}
  </div>
);

const skillColor = v => v>=75?T.green:v>=50?T.amber:T.red;
const tenureColor = b => ['<2 yrs','2–4 yrs','4–6 yrs'].includes(b)?T.green:['6–9 yrs'].includes(b)?T.amber:T.red;
const viewBadge = v => v==='Fresh'?T.green:v==='Balanced'?T.amber:T.red;

export default function BoardCompositionPage() {
  const [tab, setTab] = useState(0);

  return (
    <div style={{background:T.bg,minHeight:'100vh',fontFamily:T.font,color:T.text,padding:'28px 32px'}}>
      <div style={{marginBottom:24}}>
        <h1 style={{fontSize:24,fontWeight:700,margin:0}}>Board Composition &amp; Effectiveness</h1>
        <p style={{color:T.textSec,fontSize:13,marginTop:6}}>EP-AE1 · Director diversity, skills, tenure and regulatory alignment across portfolio</p>
      </div>

      <div style={{display:'flex',gap:0,borderBottom:`1px solid ${T.border}`,marginBottom:28}}>
        {TABS.map((t,i) => (
          <button key={t} onClick={()=>setTab(i)} style={{background:'none',border:'none',color:tab===i?T.text:T.textSec,fontFamily:T.font,fontSize:13,fontWeight:tab===i?600:400,padding:'10px 20px',cursor:'pointer',borderBottom:tab===i?`2px solid ${ACCENT}`:'2px solid transparent',transition:'color .2s'}}>
            {t}
          </button>
        ))}
      </div>

      {tab===0 && (
        <div>
          <div style={{display:'flex',gap:16,marginBottom:28,flexWrap:'wrap'}}>
            <Card label="Female Directors (MSCI)" value="34%" sub="Global large-cap average" />
            <Card label="Avg Board Size" value="11.2" sub="S&P 500 benchmark" />
            <Card label="Independent Directors" value="78%" sub="Portfolio weighted avg" />
            <Card label="Avg Tenure" value="8.4 Yrs" sub="Across sample" />
          </div>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20,marginBottom:28,overflowX:'auto'}}>
            <div style={{fontWeight:600,marginBottom:14}}>Board Composition by Company</div>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
              <thead>
                <tr>{['Company','Board Size','Female %','Independent %','Avg Age','Avg Tenure','ESG Cmte'].map(h=>(
                  <th key={h} style={{textAlign:'left',color:T.textSec,padding:'6px 12px',borderBottom:`1px solid ${T.border}`}}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {OVERVIEW_TABLE.map((r,i) => (
                  <tr key={i} style={{borderBottom:`1px solid ${T.border}`}}>
                    <td style={{padding:'8px 12px',fontWeight:500}}>{r.company}</td>
                    <td style={{padding:'8px 12px'}}>{r.boardSize}</td>
                    <td style={{padding:'8px 12px',color:r.femaleP>=40?T.green:r.femaleP>=30?T.amber:T.red}}>{r.femaleP}%</td>
                    <td style={{padding:'8px 12px'}}>{r.independentP}%</td>
                    <td style={{padding:'8px 12px'}}>{r.avgAge}</td>
                    <td style={{padding:'8px 12px'}}>{r.avgTenure} yrs</td>
                    <td style={{padding:'8px 12px'}}><span style={{color:r.esgCommittee==='Y'?T.green:T.red,fontWeight:600}}>{r.esgCommittee}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}>
            <div style={{fontWeight:600,marginBottom:14}}>Female Board Representation — 24-Month Trend</div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={FEMALE_TREND} margin={{top:5,right:20,left:0,bottom:0}}>
                <defs><linearGradient id="fGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={ACCENT} stopOpacity={0.3}/><stop offset="95%" stopColor={ACCENT} stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="month" tick={{fill:T.textSec,fontSize:11}} interval={5}/>
                <YAxis tick={{fill:T.textSec,fontSize:11}} domain={[25,45]} unit="%"/>
                <Tooltip {...tip}/>
                <Area type="monotone" dataKey="pct" stroke={ACCENT} fill="url(#fGrad)" strokeWidth={2} name="Female %"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab===1 && (
        <div>
          <div style={{display:'flex',gap:16,marginBottom:28,flexWrap:'wrap'}}>
            <Card label="EU 40% Target Compliance" value="38%" sub="Of portfolio companies" />
            <Card label="FTSE 350 Ethnic Diversity" value="16%" sub="Parker Review target: 16%" />
            <Card label="S&P 500 Avg Female" value="32%" sub="Board seats 2025" />
          </div>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20,marginBottom:28,overflowX:'auto'}}>
            <div style={{fontWeight:600,marginBottom:14}}>Diversity Dimensions — Current vs Target</div>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13,marginBottom:20}}>
              <thead>
                <tr>{['Dimension','Current %','Leading Practice %','Reg Target %','Gap to Target'].map(h=>(
                  <th key={h} style={{textAlign:'left',color:T.textSec,padding:'6px 12px',borderBottom:`1px solid ${T.border}`}}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {DIVERSITY_DIMS.map((d,i) => (
                  <tr key={i} style={{borderBottom:`1px solid ${T.border}`}}>
                    <td style={{padding:'8px 12px',fontWeight:500}}>{d.dim}</td>
                    <td style={{padding:'8px 12px',color:d.current>=d.target?T.green:T.amber}}>{d.current}%</td>
                    <td style={{padding:'8px 12px',color:T.teal}}>{d.leading}%</td>
                    <td style={{padding:'8px 12px'}}>{d.target}%</td>
                    <td style={{padding:'8px 12px',color:d.current>=d.target?T.green:T.red,fontWeight:600}}>{d.current>=d.target?'Met':'-'+(d.target-d.current)+'pp'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={DIVERSITY_DIMS} margin={{top:5,right:20,left:0,bottom:5}}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="dim" tick={{fill:T.textSec,fontSize:11}}/>
                <YAxis tick={{fill:T.textSec,fontSize:11}} unit="%"/>
                <Tooltip {...tip}/>
                <Legend wrapperStyle={{color:T.textSec,fontSize:12}}/>
                <Bar dataKey="current" name="Current %" fill={ACCENT} radius={[4,4,0,0]}/>
                <Bar dataKey="target" name="Target %" fill={T.amber} radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab===2 && (
        <div>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20,marginBottom:28,overflowX:'auto'}}>
            <div style={{fontWeight:600,marginBottom:14}}>Skills &amp; Expertise Heatmap</div>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead>
                <tr>
                  <th style={{textAlign:'left',color:T.textSec,padding:'6px 10px',borderBottom:`1px solid ${T.border}`}}>Company</th>
                  {SKILL_AREAS.map(s=><th key={s} style={{color:T.textSec,padding:'6px 8px',borderBottom:`1px solid ${T.border}`,textAlign:'center',minWidth:70}}>{s}</th>)}
                </tr>
              </thead>
              <tbody>
                {SKILLS_TABLE.map((r,i) => (
                  <tr key={i} style={{borderBottom:`1px solid ${T.border}`}}>
                    <td style={{padding:'7px 10px',fontWeight:500}}>{r.company}</td>
                    {SKILL_AREAS.map(s=>(
                      <td key={s} style={{padding:'7px 8px',textAlign:'center'}}>
                        <span style={{background:skillColor(r[s])+'22',color:skillColor(r[s]),borderRadius:4,padding:'2px 8px',fontWeight:600,fontSize:12}}>{r[s]}</span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}>
            <div style={{fontWeight:600,marginBottom:14}}>Avg Skill Coverage Score by Area</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={SKILL_AVGS} margin={{top:5,right:20,left:0,bottom:5}}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="skill" tick={{fill:T.textSec,fontSize:11}}/>
                <YAxis tick={{fill:T.textSec,fontSize:11}} domain={[0,100]}/>
                <Tooltip {...tip}/>
                <Bar dataKey="avg" name="Avg Score" radius={[4,4,0,0]}>
                  {SKILL_AVGS.map((e,i) => <Cell key={i} fill={skillColor(e.avg)}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{marginTop:16,color:T.textSec,fontSize:12}}>Key gaps: ESG/Sustainability and Technology are most underrepresented (&lt;55 avg) across sample companies.</div>
          </div>
        </div>
      )}

      {tab===3 && (
        <div>
          <div style={{display:'flex',gap:16,marginBottom:28,flexWrap:'wrap'}}>
            <Card label="Avg Tenure" value="8.4 Yrs" sub="Portfolio sample" />
            <Card label="Overboarded Directors" value="12%" sub=">4 public boards" />
            <Card label="Succession Plan Coverage" value="67%" sub="Key board seats" />
          </div>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20,marginBottom:28,overflowX:'auto'}}>
            <div style={{fontWeight:600,marginBottom:14}}>Director Tenure Distribution</div>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13,marginBottom:20}}>
              <thead>
                <tr>{['Tenure Band','Count','Indep. Risk','Entrenchment Score','Governance View'].map(h=>(
                  <th key={h} style={{textAlign:'left',color:T.textSec,padding:'6px 12px',borderBottom:`1px solid ${T.border}`}}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {TENURE_BANDS.map((r,i) => (
                  <tr key={i} style={{borderBottom:`1px solid ${T.border}`}}>
                    <td style={{padding:'8px 12px',fontWeight:500}}>{r.band}</td>
                    <td style={{padding:'8px 12px'}}>{r.count}</td>
                    <td style={{padding:'8px 12px',color:r.indepRisk==='Low'?T.green:r.indepRisk==='Moderate'?T.amber:T.red}}>{r.indepRisk}</td>
                    <td style={{padding:'8px 12px'}}>{r.entScore}</td>
                    <td style={{padding:'8px 12px'}}><span style={{color:viewBadge(r.view),fontWeight:600}}>{r.view}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={TENURE_BANDS} margin={{top:5,right:20,left:0,bottom:5}}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="band" tick={{fill:T.textSec,fontSize:11}}/>
                <YAxis tick={{fill:T.textSec,fontSize:11}}/>
                <Tooltip {...tip}/>
                <Bar dataKey="count" name="Directors" radius={[4,4,0,0]}>
                  {TENURE_BANDS.map((r,i) => <Cell key={i} fill={tenureColor(r.band)}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}>
            <div style={{fontWeight:600,marginBottom:14}}>Board Turnover Rate — 24-Month Trend</div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={TURNOVER_TREND} margin={{top:5,right:20,left:0,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="month" tick={{fill:T.textSec,fontSize:11}} interval={5}/>
                <YAxis tick={{fill:T.textSec,fontSize:11}} unit="%"/>
                <Tooltip {...tip}/>
                <Line type="monotone" dataKey="rate" stroke={T.teal} strokeWidth={2} dot={false} name="Turnover %"/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab===4 && (
        <div>
          <div style={{display:'flex',gap:16,marginBottom:28,flexWrap:'wrap'}}>
            <Card label="Jurisdictions with Gender Quotas" value="18" sub="As of 2025" />
            <Card label="Avg ISS Board Score" value="7.2/10" sub="Portfolio sample" />
            <Card label="Proxy Advisor Alignment" value="74%" sub="ISS + Glass Lewis combined" />
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))',gap:16,marginBottom:28}}>
            {FRAMEWORKS.map((f,i) => (
              <div key={i} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:18}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
                  <div style={{fontWeight:600,fontSize:14}}>{f.name}</div>
                  <span style={{background:f.comply==='Y'?T.green+'22':T.red+'22',color:f.comply==='Y'?T.green:T.red,borderRadius:4,padding:'2px 8px',fontSize:11,fontWeight:700}}>{f.comply==='Y'?'Compliant':'Non-Compliant'}</span>
                </div>
                <div style={{color:T.textSec,fontSize:12,marginBottom:6}}><span style={{color:T.textMut}}>Jurisdiction:</span> {f.jurisdiction}</div>
                <div style={{color:T.textSec,fontSize:12,marginBottom:6}}><span style={{color:T.textMut}}>Requirement:</span> {f.req}</div>
                <div style={{color:T.textSec,fontSize:12,marginBottom:6}}><span style={{color:T.textMut}}>Consequence:</span> {f.penalty}</div>
                <div style={{color:T.textMut,fontSize:11}}>Effective: {f.date}</div>
              </div>
            ))}
          </div>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}>
            <div style={{fontWeight:600,marginBottom:14}}>Compliance Rate by Framework</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={FRAMEWORK_COMPLIANCE} margin={{top:5,right:20,left:0,bottom:5}}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="name" tick={{fill:T.textSec,fontSize:11}}/>
                <YAxis tick={{fill:T.textSec,fontSize:11}} domain={[0,100]} unit="%"/>
                <Tooltip {...tip}/>
                <Bar dataKey="rate" name="Compliance %" radius={[4,4,0,0]}>
                  {FRAMEWORK_COMPLIANCE.map((e,i) => <Cell key={i} fill={e.rate>=70?T.green:e.rate>=50?T.amber:T.red}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
