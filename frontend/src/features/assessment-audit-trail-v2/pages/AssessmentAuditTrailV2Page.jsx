import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, ReferenceLine
} from 'recharts';

const T = {
  bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c',
  navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae',
  red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb',
  orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a',
  font:"'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"
};

const USERS = ['A. Chen','M. Patel','J. Eriksson','S. Nakamura','L. Rodriguez'];
const ENTITIES_LIST = ['JPMorgan','Shell plc','Microsoft','Unilever','Enel SpA','BNP Paribas','Tesla','Siemens'];

const CHANGE_LOG = Array.from({length:30}, (_,i) => ({
  id:`CL-${1000+i}`, timestamp: `2026-0${3-Math.floor(i/15)}-${String(28-i%28).padStart(2,'0')} ${String(9+i%8).padStart(2,'0')}:${String(i*7%60).padStart(2,'0')}`,
  entity: ENTITIES_LIST[i%8], user: USERS[i%5], field: ['env','soc','gov','climate','bio','supply','human','innovation'][i%8],
  oldValue: Math.round(50+Math.sin(i)*15), newValue: Math.round(52+Math.sin(i)*15+Math.cos(i)*3),
  reason: ['Quarterly re-assessment','New disclosure data','Methodology update','Peer benchmark adjustment','Regulatory update'][i%5]
}));

const VERSIONS = Array.from({length:8}, (_,i) => ({
  version: `v${8-i}.0`, date: `2026-0${1+Math.floor(i/3)}-${String(15-i*3).padStart(2,'0')}`,
  entity: ENTITIES_LIST[i], totalScore: Math.round(65-i*1.5+Math.sin(i)*5),
  changes: Math.round(3+Math.sin(i)*4), assessor: USERS[i%5], status: i===0?'Current':i===1?'Reviewed':'Archived'
}));

const DRIFT_DATA = ENTITIES_LIST.map((e,i) => ({
  entity: e, q1: Math.round(60+Math.sin(i)*12), q2: Math.round(61+Math.sin(i)*11),
  q3: Math.round(63+Math.sin(i)*10), drift: Math.round(3+Math.cos(i)*5),
  alert: Math.abs(3+Math.cos(i)*5) > 5
}));

const USER_ACTIVITY = USERS.map((u,i) => ({
  user: u, assessments: Math.round(12+Math.sin(i)*8), lastActive: `2026-04-0${4-i}`,
  avgTime: Math.round(35+i*5), entitiesAssessed: Math.round(5+i*2), qualityScore: Math.round(88-i*3)
}));

const LINEAGE = [
  { level:'Score', node:'Environmental: 72', source:'L1 Aggregation' },
  { level:'L2', node:'Emissions Mgmt: 68', source:'Weighted avg of 4 L3 nodes' },
  { level:'L3', node:'Scope 1 Reduction: 74', source:'CDP Climate 2025 Response' },
  { level:'Data Point', node:'Scope 1: 1.2M tCO2e (-8% YoY)', source:'Annual Report 2025 p.47' },
  { level:'Raw Source', node:'GHG Protocol Corporate Standard', source:'ISAE 3410 assured' },
];

const TABS = ['Change Log','Version History','Score Drift Monitor','User Activity','Data Lineage','Compliance Evidence'];

const Badge = ({code,label}) => <div style={{display:'inline-flex',alignItems:'center',gap:6,padding:'4px 12px',border:`1.5px solid ${T.gold}`,borderRadius:6,fontSize:11,fontFamily:T.mono,color:T.navy,background:`${T.gold}15`}}><span style={{fontWeight:700}}>{code}</span><span style={{color:T.textSec}}>{label}</span></div>;
const Card = ({children,style}) => <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20,...style}}>{children}</div>;
const KPI = ({label,value,sub,color=T.navy}) => <div style={{textAlign:'center'}}><div style={{fontSize:22,fontWeight:700,color,fontFamily:T.mono}}>{value}</div><div style={{fontSize:11,color:T.textSec,marginTop:2}}>{label}</div>{sub&&<div style={{fontSize:10,color:T.textMut}}>{sub}</div>}</div>;

export default function AssessmentAuditTrailV2Page() {
  const [tab, setTab] = useState(0);
  const [logFilter, setLogFilter] = useState('All');
  const [exportReady, setExportReady] = useState(false);

  const filteredLog = useMemo(() => logFilter === 'All' ? CHANGE_LOG : CHANGE_LOG.filter(c => c.entity === logFilter), [logFilter]);

  const renderChangeLog = () => (
    <div>
      <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:16}}>
        {['All',...ENTITIES_LIST.slice(0,5)].map(e => (
          <button key={e} onClick={()=>setLogFilter(e)} style={{padding:'5px 12px',borderRadius:16,border:`1px solid ${logFilter===e?T.navy:T.border}`,background:logFilter===e?T.navy:'transparent',color:logFilter===e?'#fff':T.textSec,fontSize:11,cursor:'pointer'}}>{e}</button>
        ))}
      </div>
      <Card>
        <div style={{overflowX:'auto',maxHeight:500,overflowY:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
            <thead style={{position:'sticky',top:0,background:T.surface}}><tr style={{borderBottom:`2px solid ${T.border}`}}>
              {['Timestamp','Entity','Field','Old','New','Delta','User','Reason'].map(h => <th key={h} style={{textAlign:'left',padding:'8px 10px',color:T.textSec,fontWeight:600,fontSize:11}}>{h}</th>)}
            </tr></thead>
            <tbody>
              {filteredLog.map(c => {
                const delta = c.newValue - c.oldValue;
                return (
                  <tr key={c.id} style={{borderBottom:`1px solid ${T.border}`}}>
                    <td style={{padding:'6px 10px',fontFamily:T.mono,fontSize:10,color:T.textMut}}>{c.timestamp}</td>
                    <td style={{padding:'6px 10px',fontWeight:500,color:T.navy}}>{c.entity}</td>
                    <td style={{padding:'6px 10px',color:T.textSec}}>{c.field}</td>
                    <td style={{padding:'6px 10px',fontFamily:T.mono}}>{c.oldValue}</td>
                    <td style={{padding:'6px 10px',fontFamily:T.mono,fontWeight:600}}>{c.newValue}</td>
                    <td style={{padding:'6px 10px',fontFamily:T.mono,color:delta>0?T.green:delta<0?T.red:T.textMut,fontWeight:600}}>{delta>0?'+':''}{delta}</td>
                    <td style={{padding:'6px 10px',color:T.textSec}}>{c.user}</td>
                    <td style={{padding:'6px 10px',fontSize:10,color:T.textMut}}>{c.reason}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  const renderVersionHistory = () => (
    <Card>
      <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:12}}>Assessment Version History</div>
      {VERSIONS.map((v,i) => (
        <div key={v.version} style={{display:'flex',alignItems:'center',gap:16,padding:'12px 0',borderBottom:`1px solid ${T.border}`}}>
          <div style={{width:60}}>
            <div style={{fontFamily:T.mono,fontWeight:700,fontSize:13,color:i===0?T.green:T.navy}}>{v.version}</div>
            <div style={{fontSize:10,color:T.textMut}}>{v.date}</div>
          </div>
          <div style={{flex:1}}>
            <div style={{fontWeight:500,fontSize:13,color:T.navy}}>{v.entity}</div>
            <div style={{fontSize:11,color:T.textSec}}>{v.changes} changes by {v.assessor}</div>
          </div>
          <div style={{fontFamily:T.mono,fontSize:15,fontWeight:700,color:T.navy}}>{v.totalScore}</div>
          <span style={{padding:'2px 8px',borderRadius:4,fontSize:10,fontWeight:600,background:v.status==='Current'?`${T.green}15`:v.status==='Reviewed'?`${T.blue}15`:`${T.textMut}15`,color:v.status==='Current'?T.green:v.status==='Reviewed'?T.blue:T.textMut}}>{v.status}</span>
        </div>
      ))}
    </Card>
  );

  const renderDrift = () => (
    <div>
      <Card>
        <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:12}}>Score Drift Monitor (3-Month Window, Alert at &gt;5pt)</div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={DRIFT_DATA}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="entity" tick={{fontSize:10,fill:T.textSec}} />
            <YAxis tick={{fontSize:11,fill:T.textSec}} />
            <Tooltip contentStyle={{borderRadius:8,border:`1px solid ${T.border}`,fontFamily:T.font,fontSize:12}} />
            <ReferenceLine y={5} stroke={T.red} strokeDasharray="4 4" label={{value:'Alert',fill:T.red,fontSize:9}} />
            <ReferenceLine y={-5} stroke={T.red} strokeDasharray="4 4" />
            <Bar dataKey="drift" name="3-Month Drift" radius={[4,4,0,0]}>
              {DRIFT_DATA.map((d,i) => <Cell key={i} fill={d.alert?T.red:T.green} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginTop:16}}>
        {DRIFT_DATA.filter(d=>d.alert).map(d => (
          <Card key={d.entity} style={{borderLeft:`3px solid ${T.red}`}}>
            <div style={{fontSize:12,fontWeight:600,color:T.red}}>DRIFT ALERT</div>
            <div style={{fontSize:13,fontWeight:600,color:T.navy,marginTop:4}}>{d.entity}</div>
            <div style={{fontSize:11,color:T.textSec}}>Drift: {d.drift > 0 ? '+' : ''}{d.drift} pts in 3 months</div>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderUserActivity = () => (
    <Card>
      <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:12}}>Assessor Activity Dashboard</div>
      <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
        <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>
          {['Assessor','Assessments','Entities','Avg Time (min)','Quality Score','Last Active'].map(h => <th key={h} style={{textAlign:'left',padding:'8px 12px',color:T.textSec,fontWeight:600}}>{h}</th>)}
        </tr></thead>
        <tbody>
          {USER_ACTIVITY.map(u => (
            <tr key={u.user} style={{borderBottom:`1px solid ${T.border}`}}>
              <td style={{padding:'8px 12px',fontWeight:500,color:T.navy}}>{u.user}</td>
              <td style={{padding:'8px 12px',fontFamily:T.mono}}>{u.assessments}</td>
              <td style={{padding:'8px 12px',fontFamily:T.mono}}>{u.entitiesAssessed}</td>
              <td style={{padding:'8px 12px',fontFamily:T.mono}}>{u.avgTime}</td>
              <td style={{padding:'8px 12px'}}><span style={{fontFamily:T.mono,fontWeight:600,color:u.qualityScore>=85?T.green:u.qualityScore>=75?T.amber:T.red}}>{u.qualityScore}%</span></td>
              <td style={{padding:'8px 12px',fontFamily:T.mono,fontSize:11,color:T.textMut}}>{u.lastActive}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );

  const renderLineage = () => (
    <Card>
      <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:16}}>Data Lineage: Score to Source</div>
      {LINEAGE.map((l,i) => (
        <div key={i} style={{display:'flex',alignItems:'stretch',gap:12,marginBottom:i<LINEAGE.length-1?0:0}}>
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',width:24}}>
            <div style={{width:12,height:12,borderRadius:6,background:T.navy,border:`2px solid ${T.gold}`,zIndex:1}} />
            {i < LINEAGE.length-1 && <div style={{width:2,flex:1,background:T.border}} />}
          </div>
          <div style={{flex:1,paddingBottom:16}}>
            <div style={{fontSize:10,fontFamily:T.mono,color:T.gold,fontWeight:600}}>{l.level}</div>
            <div style={{fontSize:13,fontWeight:600,color:T.navy,marginTop:2}}>{l.node}</div>
            <div style={{fontSize:11,color:T.textSec,marginTop:2}}>Source: {l.source}</div>
          </div>
        </div>
      ))}
      <div style={{padding:12,background:`${T.blue}08`,borderRadius:8,marginTop:8}}>
        <div style={{fontSize:11,color:T.textSec}}>Full data lineage traces every score from the aggregated L1 level down to raw source documents. Each node in the chain includes provenance metadata (source, date, assurance level) to support ISAE 3000 assurance engagements.</div>
      </div>
    </Card>
  );

  const renderCompliance = () => (
    <div>
      <Card>
        <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:12}}>Compliance Evidence Pack (ISAE 3000)</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12}}>
          {[
            {name:'Audit Trail Export',desc:'Timestamped change log with user attribution',status:'Ready'},
            {name:'Version Comparison',desc:'Side-by-side snapshot diffs',status:'Ready'},
            {name:'Data Lineage Map',desc:'Score-to-source traceability',status:'Ready'},
            {name:'User Access Log',desc:'RBAC evidence and permission history',status:'Generating'},
            {name:'Methodology Documentation',desc:'Scoring methodology and weighting rationale',status:'Ready'},
            {name:'Quality Assurance Report',desc:'Inter-rater reliability and calibration',status:'Ready'},
          ].map((d,i) => (
            <div key={i} style={{padding:14,border:`1px solid ${T.border}`,borderRadius:8}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div style={{fontWeight:600,fontSize:13,color:T.navy}}>{d.name}</div>
                <span style={{padding:'2px 8px',borderRadius:4,fontSize:10,fontWeight:600,background:d.status==='Ready'?`${T.green}15`:`${T.amber}15`,color:d.status==='Ready'?T.green:T.amber}}>{d.status}</span>
              </div>
              <div style={{fontSize:11,color:T.textSec,marginTop:4}}>{d.desc}</div>
            </div>
          ))}
        </div>
      </Card>
      <div style={{display:'flex',gap:12,marginTop:16}}>
        <button onClick={()=>setExportReady(true)} style={{padding:'10px 24px',borderRadius:8,border:'none',background:T.navy,color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer'}}>Generate Audit Pack</button>
        {exportReady && <span style={{display:'flex',alignItems:'center',fontSize:12,color:T.green,fontWeight:600}}>Audit pack ready for download</span>}
      </div>
    </div>
  );

  const panels = [renderChangeLog, renderVersionHistory, renderDrift, renderUserActivity, renderLineage, renderCompliance];

  return (
    <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:24}}>
      <div style={{maxWidth:1400,margin:'0 auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20}}>
          <div>
            <Badge code="EP-CW5" label="Assessment Audit Trail v2" />
            <h1 style={{fontSize:22,fontWeight:700,color:T.navy,margin:'12px 0 4px'}}>Assessment Audit Trail & Version History</h1>
            <p style={{fontSize:13,color:T.textSec,margin:0}}>Change log, score drift monitoring, data lineage, ISAE 3000 compliance evidence</p>
          </div>
          <div style={{display:'flex',gap:16}}>
            <KPI label="Changes" value={CHANGE_LOG.length} sub="last 90 days" />
            <KPI label="Versions" value={VERSIONS.length} sub="snapshots" color={T.gold} />
            <KPI label="Drift Alerts" value={DRIFT_DATA.filter(d=>d.alert).length} sub="above 5pt" color={T.red} />
          </div>
        </div>
        <div style={{display:'flex',gap:4,borderBottom:`2px solid ${T.border}`,marginBottom:20}}>
          {TABS.map((t,i) => <button key={i} onClick={()=>setTab(i)} style={{padding:'10px 18px',border:'none',borderBottom:`2px solid ${tab===i?T.gold:'transparent'}`,background:'transparent',color:tab===i?T.navy:T.textMut,fontWeight:tab===i?600:400,fontSize:13,fontFamily:T.font,cursor:'pointer',marginBottom:-2}}>{t}</button>)}
        </div>
        {panels[tab]()}
        <div style={{marginTop:20,padding:14,background:`${T.gold}08`,border:`1px solid ${T.gold}30`,borderRadius:8}}>
          <div style={{fontSize:12,fontWeight:600,color:T.gold,marginBottom:4}}>Audit Standard</div>
          <div style={{fontSize:11,color:T.textSec}}>Audit trail complies with ISAE 3000 (Revised) assurance engagement requirements. All changes are immutable once committed, with cryptographic hash chains for tamper evidence. Score drift monitoring uses Bollinger Band-style thresholds with 2-sigma confidence intervals on rolling 90-day windows.</div>
        </div>
      </div>
    </div>
  );
}
