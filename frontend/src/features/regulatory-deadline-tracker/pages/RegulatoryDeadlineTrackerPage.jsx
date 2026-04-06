import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend, ReferenceLine, PieChart, Pie
} from 'recharts';

const T = {
  bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c',
  gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626',
  green:'#16a34a', amber:'#d97706', blue:'#2563eb', orange:'#ea580c',
  purple:'#7c3aed', teal:'#0891b2',
  font:"'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"
};

function sr(seed){let x=Math.sin(seed*9301+49297)*49297;return x-Math.floor(x);}

const JURISDICTIONS = [
  {code:'EU',name:'EU CSRD',flag:'\uD83C\uDDEA\uD83C\uDDFA'},{code:'UK',name:'UK TPT',flag:'\uD83C\uDDEC\uD83C\uDDE7'},
  {code:'US',name:'US SEC',flag:'\uD83C\uDDFA\uD83C\uDDF8'},{code:'HK',name:'HK ESG',flag:'\uD83C\uDDED\uD83C\uDDF0'},
  {code:'SG',name:'SG MAS',flag:'\uD83C\uDDF8\uD83C\uDDEC'},{code:'AU',name:'AU AASB',flag:'\uD83C\uDDE6\uD83C\uDDFA'},
  {code:'JP',name:'JP SSBJ',flag:'\uD83C\uDDEF\uD83C\uDDF5'},{code:'KR',name:'KR K-ESG',flag:'\uD83C\uDDF0\uD83C\uDDF7'},
  {code:'IN',name:'IN BRSR',flag:'\uD83C\uDDEE\uD83C\uDDF3'},{code:'BR',name:'BR ISSB',flag:'\uD83C\uDDE7\uD83C\uDDF7'},
  {code:'CA',name:'CA CSA',flag:'\uD83C\uDDE8\uD83C\uDDE6'},{code:'ZA',name:'ZA JSE',flag:'\uD83C\uDDFF\uD83C\uDDE6'}
];

const FRAMEWORKS = ['TCFD','ISSB S1','ISSB S2','CSRD ESRS E1','CSRD ESRS E2','EU Taxonomy','TNFD','CDP Climate','CDP Water','GRI 305'];
const STATUSES = ['ON_TRACK','AT_RISK','OVERDUE','SUBMITTED','NOT_APPLICABLE'];

const DEADLINES = Array.from({length:25},(_,i)=>{
  const j = JURISDICTIONS[i%12];
  const f = FRAMEWORKS[Math.floor(sr(i+100)*FRAMEWORKS.length)];
  const stat = STATUSES[Math.min(4,Math.floor(sr(i+110)*4.5))];
  const month = 4+Math.floor(sr(i+120)*9);
  const day = 1+Math.floor(sr(i+130)*28);
  const daysLeft = Math.floor((new Date(2026,month-1,day)-new Date(2026,3,4))/(86400000));
  return {
    id:`DL-${String(i+1).padStart(3,'0')}`, jurisdiction:j.code, jName:j.name, flag:j.flag,
    framework:f, status:stat, deadline:`2026-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`,
    daysLeft, completeness:Math.round(sr(i+140)*100),
    responsible:['A. Mueller','J. Tanaka','R. Gupta','S. Kim','L. Santos','M. Okafor','P. Dubois'][Math.floor(sr(i+150)*7)],
    reviewer:['VP Compliance','CFO','Head ESG','Legal Counsel','Board Secretary'][Math.floor(sr(i+160)*5)],
    approver:['CEO','Board Chair','CFO','CRO'][Math.floor(sr(i+170)*4)],
    gaps:Math.floor(sr(i+180)*6), version:`v${1+Math.floor(sr(i+190)*4)}.${Math.floor(sr(i+195)*10)}`
  };
});

const SUBMISSIONS = Array.from({length:12},(_,i)=>({
  id:`SUB-${i+1}`, framework:FRAMEWORKS[i%10], jurisdiction:JURISDICTIONS[i%12].code,
  date:`2025-${String(1+Math.floor(sr(i+500)*12)).padStart(2,'0')}-${String(1+Math.floor(sr(i+510)*28)).padStart(2,'0')}`,
  version:`v${1+Math.floor(sr(i+520)*3)}.${Math.floor(sr(i+525)*10)}`, status:'Accepted',
  pages:Math.round(20+sr(i+530)*180), reviewer:['External Auditor','Legal','Compliance'][Math.floor(sr(i+540)*3)]
}));

const statColor = s => s==='ON_TRACK'?T.green:s==='AT_RISK'?T.amber:s==='OVERDUE'?T.red:s==='SUBMITTED'?T.teal:T.textMut;
const TABS = ['Calendar View','Deadline Matrix','Jurisdiction Status','Gap Analysis','Task Assignment','Submission History'];

export default function RegulatoryDeadlineTrackerPage(){
  const [tab,setTab]=useState(0);
  const [selJuris,setSelJuris]=useState('ALL');
  const [selFramework,setSelFramework]=useState('ALL');
  const [selStatus,setSelStatus]=useState('ALL');

  const filtered = useMemo(()=>DEADLINES.filter(d=>
    (selJuris==='ALL'||d.jurisdiction===selJuris)&&
    (selFramework==='ALL'||d.framework===selFramework)&&
    (selStatus==='ALL'||d.status===selStatus)
  ),[selJuris,selFramework,selStatus]);

  const statusCounts = useMemo(()=>STATUSES.reduce((a,s)=>{a[s]=DEADLINES.filter(d=>d.status===s).length;return a;},{}),[]);

  const badge = {display:'inline-block',padding:'2px 10px',borderRadius:12,fontSize:11,fontWeight:700,fontFamily:T.mono,color:'#fff'};
  const card = {background:T.surface,borderRadius:14,border:`1px solid ${T.border}`,padding:20,marginBottom:16};
  const th = {padding:'8px 12px',textAlign:'left',fontSize:12,fontFamily:T.mono,color:T.textSec,borderBottom:`2px solid ${T.border}`};
  const td = {padding:'8px 12px',fontSize:12,borderBottom:`1px solid ${T.border}`};
  const kpiBox = {background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:'16px 20px',textAlign:'center',flex:1,minWidth:130};

  const filterBar = () => (
    <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
      <select value={selJuris} onChange={e=>setSelJuris(e.target.value)} style={{padding:'6px 12px',borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.mono}}>
        <option value="ALL">All Jurisdictions</option>
        {JURISDICTIONS.map(j=><option key={j.code} value={j.code}>{j.flag} {j.name}</option>)}
      </select>
      <select value={selFramework} onChange={e=>setSelFramework(e.target.value)} style={{padding:'6px 12px',borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.mono}}>
        <option value="ALL">All Frameworks</option>
        {FRAMEWORKS.map(f=><option key={f} value={f}>{f}</option>)}
      </select>
      <select value={selStatus} onChange={e=>setSelStatus(e.target.value)} style={{padding:'6px 12px',borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.mono}}>
        <option value="ALL">All Statuses</option>
        {STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
      </select>
    </div>
  );

  const renderCalendar = () => {
    const months = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const byMonth = months.map((m,mi)=>({month:m,deadlines:filtered.filter(d=>{const dm=parseInt(d.deadline.split('-')[1]);return dm===mi+4;})}));
    return (
      <div>
        {filterBar()}
        <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:20}}>
          {[{l:'Total Deadlines',v:DEADLINES.length,c:T.navy},{l:'On Track',v:statusCounts.ON_TRACK,c:T.green},{l:'At Risk',v:statusCounts.AT_RISK,c:T.amber},{l:'Overdue',v:statusCounts.OVERDUE,c:T.red},{l:'Submitted',v:statusCounts.SUBMITTED,c:T.teal}].map((k,i)=>(
            <div key={i} style={kpiBox}><div style={{fontSize:10,color:T.textMut,fontFamily:T.mono}}>{k.l}</div><div style={{fontSize:24,fontWeight:700,color:k.c,fontFamily:T.mono}}>{k.v}</div></div>
          ))}
        </div>
        <div style={card}>
          <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:16}}>Deadline Timeline</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={byMonth.map(m=>({month:m.month,ON_TRACK:m.deadlines.filter(d=>d.status==='ON_TRACK').length,AT_RISK:m.deadlines.filter(d=>d.status==='AT_RISK').length,OVERDUE:m.deadlines.filter(d=>d.status==='OVERDUE').length,SUBMITTED:m.deadlines.filter(d=>d.status==='SUBMITTED').length}))}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="month"/><YAxis/>
              <Tooltip/><Legend/>
              <Bar dataKey="ON_TRACK" stackId="a" fill={T.green}/><Bar dataKey="AT_RISK" stackId="a" fill={T.amber}/>
              <Bar dataKey="OVERDUE" stackId="a" fill={T.red}/><Bar dataKey="SUBMITTED" stackId="a" fill={T.teal}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        {filtered.filter(d=>d.daysLeft>0&&d.daysLeft<=30).length>0&&(
          <div style={{...card,background:T.amber+'08',borderColor:T.amber+'40'}}>
            <div style={{fontSize:13,fontWeight:700,color:T.amber,marginBottom:8}}>Imminent Deadlines (next 30 days)</div>
            {filtered.filter(d=>d.daysLeft>0&&d.daysLeft<=30).sort((a,b)=>a.daysLeft-b.daysLeft).map((d,i)=>(
              <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:`1px solid ${T.border}`}}>
                <span style={{fontSize:12}}>{d.flag} {d.framework} ({d.jName})</span>
                <span style={{fontFamily:T.mono,fontSize:12,color:d.daysLeft<=7?T.red:T.amber,fontWeight:700}}>{d.daysLeft} days | {d.deadline}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderMatrix = () => (
    <div style={card}>
      <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Deadline Matrix: Frameworks x Jurisdictions</div>
      <div style={{overflowX:'auto'}}>
        <table style={{borderCollapse:'collapse',width:'100%',fontSize:10,fontFamily:T.mono}}>
          <thead><tr><th style={th}>Framework</th>{JURISDICTIONS.map(j=><th key={j.code} style={{...th,textAlign:'center',minWidth:70}}>{j.flag}<br/>{j.code}</th>)}</tr></thead>
          <tbody>{FRAMEWORKS.map((f,fi)=>(
            <tr key={fi}><td style={{...td,fontWeight:600,whiteSpace:'nowrap'}}>{f}</td>
              {JURISDICTIONS.map((j,ji)=>{
                const dl=DEADLINES.find(d=>d.framework===f&&d.jurisdiction===j.code);
                return <td key={ji} style={{...td,textAlign:'center',background:dl?statColor(dl.status)+'15':'transparent',color:dl?statColor(dl.status):T.textMut,fontWeight:dl?700:400}}>
                  {dl?dl.deadline.slice(5):'--'}
                </td>;
              })}
            </tr>))}</tbody>
        </table>
      </div>
    </div>
  );

  const renderJurisdiction = () => (
    <div>
      {filterBar()}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:16}}>
        {JURISDICTIONS.filter(j=>selJuris==='ALL'||j.code===selJuris).map((j,i)=>{
          const jdls=DEADLINES.filter(d=>d.jurisdiction===j.code);
          const onTrack=jdls.filter(d=>d.status==='ON_TRACK').length;
          const atRisk=jdls.filter(d=>d.status==='AT_RISK').length;
          const overdue=jdls.filter(d=>d.status==='OVERDUE').length;
          return (
            <div key={i} style={card}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                <div style={{fontSize:15,fontWeight:700,color:T.navy}}>{j.flag} {j.name}</div>
                <span style={{...badge,background:overdue>0?T.red:atRisk>0?T.amber:T.green}}>{overdue>0?'ACTION':'OK'}</span>
              </div>
              <div style={{display:'flex',gap:12,marginBottom:8}}>
                <span style={{fontSize:11,color:T.green}}>On Track: {onTrack}</span>
                <span style={{fontSize:11,color:T.amber}}>At Risk: {atRisk}</span>
                <span style={{fontSize:11,color:T.red}}>Overdue: {overdue}</span>
              </div>
              <div style={{height:6,borderRadius:3,background:T.border,overflow:'hidden',display:'flex'}}>
                <div style={{width:`${onTrack/Math.max(jdls.length,1)*100}%`,background:T.green}}/>
                <div style={{width:`${atRisk/Math.max(jdls.length,1)*100}%`,background:T.amber}}/>
                <div style={{width:`${overdue/Math.max(jdls.length,1)*100}%`,background:T.red}}/>
              </div>
              <div style={{marginTop:8,fontSize:10,color:T.textMut,fontFamily:T.mono}}>Total: {jdls.length} deadlines</div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderGapAnalysis = () => (
    <div>
      <div style={card}>
        <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:16}}>Framework Gap Analysis</div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={FRAMEWORKS.map(f=>{const fds=DEADLINES.filter(d=>d.framework===f);return {framework:f,avgCompleteness:fds.length?Math.round(fds.reduce((a,d)=>a+d.completeness,0)/fds.length):0,gaps:fds.reduce((a,d)=>a+d.gaps,0)};})}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="framework" tick={{fontSize:9}} angle={-20}/>
            <YAxis yAxisId="left" domain={[0,100]}/><YAxis yAxisId="right" orientation="right"/>
            <Tooltip/><Legend/>
            <Bar yAxisId="left" dataKey="avgCompleteness" name="Completeness %" fill={T.green} radius={[4,4,0,0]}/>
            <Bar yAxisId="right" dataKey="gaps" name="Open Gaps" fill={T.red} radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={card}>
        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Gap Detail by Deadline</div>
        <table style={{borderCollapse:'collapse',width:'100%',fontSize:12}}>
          <thead><tr>{['Deadline','Framework','Jurisdiction','Completeness','Gaps','Status'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>{filtered.filter(d=>d.gaps>0).sort((a,b)=>b.gaps-a.gaps).map((d,i)=>(
            <tr key={i}>
              <td style={{...td,fontFamily:T.mono}}>{d.deadline}</td><td style={td}>{d.framework}</td>
              <td style={td}>{d.flag} {d.jurisdiction}</td>
              <td style={td}><div style={{display:'flex',alignItems:'center',gap:8}}><div style={{width:60,height:6,borderRadius:3,background:T.border,overflow:'hidden'}}><div style={{width:`${d.completeness}%`,height:'100%',background:d.completeness>=80?T.green:d.completeness>=50?T.amber:T.red}}/></div><span style={{fontFamily:T.mono,fontSize:11}}>{d.completeness}%</span></div></td>
              <td style={{...td,color:T.red,fontWeight:700,fontFamily:T.mono}}>{d.gaps}</td>
              <td style={td}><span style={{...badge,background:statColor(d.status)}}>{d.status}</span></td>
            </tr>))}</tbody>
        </table>
      </div>
    </div>
  );

  const renderTasks = () => (
    <div style={card}>
      <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:16}}>Task Assignment Matrix</div>
      <table style={{borderCollapse:'collapse',width:'100%',fontSize:12}}>
        <thead><tr>{['Deadline ID','Framework','Jurisdiction','Responsible','Reviewer','Approver','Due','Completeness','Status'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
        <tbody>{filtered.map((d,i)=>(
          <tr key={i} style={{background:i%2===0?'transparent':T.bg+'80'}}>
            <td style={{...td,fontFamily:T.mono,color:T.textMut}}>{d.id}</td>
            <td style={{...td,fontWeight:600}}>{d.framework}</td>
            <td style={td}>{d.flag} {d.jurisdiction}</td>
            <td style={td}>{d.responsible}</td><td style={td}>{d.reviewer}</td><td style={td}>{d.approver}</td>
            <td style={{...td,fontFamily:T.mono,color:d.daysLeft<=14?T.red:T.navy}}>{d.deadline}</td>
            <td style={td}><div style={{width:50,height:6,borderRadius:3,background:T.border,overflow:'hidden'}}><div style={{width:`${d.completeness}%`,height:'100%',background:T.green}}/></div></td>
            <td style={td}><span style={{...badge,background:statColor(d.status)}}>{d.status}</span></td>
          </tr>))}</tbody>
      </table>
    </div>
  );

  const renderHistory = () => (
    <div style={card}>
      <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:16}}>Submission History</div>
      <table style={{borderCollapse:'collapse',width:'100%',fontSize:12}}>
        <thead><tr>{['ID','Framework','Jurisdiction','Submission Date','Version','Pages','Reviewer','Status'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
        <tbody>{SUBMISSIONS.map((s,i)=>(
          <tr key={i}>
            <td style={{...td,fontFamily:T.mono,color:T.textMut}}>{s.id}</td>
            <td style={{...td,fontWeight:600}}>{s.framework}</td>
            <td style={td}>{JURISDICTIONS.find(j=>j.code===s.jurisdiction)?.flag} {s.jurisdiction}</td>
            <td style={{...td,fontFamily:T.mono}}>{s.date}</td>
            <td style={{...td,fontFamily:T.mono,color:T.blue}}>{s.version}</td>
            <td style={{...td,fontFamily:T.mono}}>{s.pages}</td>
            <td style={td}>{s.reviewer}</td>
            <td style={td}><span style={{...badge,background:T.green}}>{s.status}</span></td>
          </tr>))}</tbody>
      </table>
      <div style={{marginTop:16,padding:14,borderRadius:10,background:T.teal+'08',border:`1px solid ${T.teal}30`}}>
        <div style={{fontSize:12,fontWeight:700,color:T.teal,marginBottom:6}}>Version Comparison</div>
        <div style={{fontSize:11,color:T.textSec}}>Select two submission versions to compare disclosure content, data completeness, and metric changes. Each submission is versioned with full audit trail for regulatory assurance.</div>
      </div>
    </div>
  );

  return (
    <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:'24px 32px'}}>
      <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:8}}>
        <div style={{background:T.navy,color:'#fff',padding:'6px 16px',borderRadius:10,fontFamily:T.mono,fontSize:13,fontWeight:700,border:`2px solid ${T.gold}`}}>EP-CY3</div>
        <div>
          <h1 style={{margin:0,fontSize:26,fontWeight:800,color:T.navy}}>Regulatory Deadline Tracker</h1>
          <p style={{margin:0,fontSize:13,color:T.textSec}}>Multi-jurisdiction regulatory deadline management | 12 jurisdictions | {DEADLINES.length} deadlines</p>
        </div>
      </div>
      <div style={{display:'flex',gap:4,marginBottom:20,borderBottom:`2px solid ${T.border}`,paddingBottom:0}}>
        {TABS.map((t,i)=>(
          <button key={i} onClick={()=>setTab(i)} style={{padding:'10px 18px',border:'none',borderBottom:tab===i?`3px solid ${T.gold}`:'3px solid transparent',background:'transparent',cursor:'pointer',fontSize:13,fontWeight:tab===i?700:500,color:tab===i?T.navy:T.textSec,fontFamily:T.font}}>{t}</button>
        ))}
      </div>
      {tab===0&&renderCalendar()}
      {tab===1&&renderMatrix()}
      {tab===2&&renderJurisdiction()}
      {tab===3&&renderGapAnalysis()}
      {tab===4&&renderTasks()}
      {tab===5&&renderHistory()}
      <div style={{marginTop:24,padding:14,borderRadius:10,background:T.navy+'08',border:`1px solid ${T.navy}20`,fontSize:11,color:T.textSec}}>
        <strong>Coverage:</strong> EU CSRD (ESRS E1-E5), UK TPT Framework, US SEC Climate Rule, HK HKEX ESG Guide, SG MAS Environmental Risk, AU AASB S1/S2, JP SSBJ Standards, KR K-ESG Disclosure, IN BRSR Core/Leadership, BR CVM ISSB Adoption, CA CSA Climate Disclosure, ZA JSE Sustainability. Deadlines sourced from official regulatory calendars. Gap analysis aligned to IFRS S1/S2 baseline requirements.
      </div>
    </div>
  );
}
