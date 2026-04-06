import React, { useState, useMemo } from 'react';
import {

  BarChart, Bar, LineChart, Line, ScatterChart, Scatter, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, ReferenceLine, ZAxis
} from 'recharts';

const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const T = {
  bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c',
  navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae',
  red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb',
  orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a',
  font:"'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"
};

const ENTITIES = Array.from({length:15}, (_,i) => ({
  id:`E${i+1}`, name:['JPMorgan','Shell','Microsoft','HSBC','TotalEnergies','Unilever','Allianz','Enel','Siemens','BNP','BP','Nestle','BlackRock','NextEra','Tesla'][i],
  sector:['Banking','Oil & Gas','Tech','Banking','Oil & Gas','Consumer','Insurance','Utilities','Industrials','Banking','Oil & Gas','Consumer','Asset Mgmt','Renewables','Automotive'][i],
  score: Math.round(60+(sr(i * 23) * 2 - 1)*20),
  peerAvg: Math.round(62+(sr(i * 23) * 2 - 1)*12),
  anomalyScore: Math.round(Math.max(0, (sr(i * 17) * 2 - 1)*100))/100,
  isAnomaly: [false,false,false,false,true,false,false,false,false,false,true,false,false,false,true][i],
  outlierTopics: i===4?['Climate (-22 vs peer)','Biodiversity (-18 vs peer)']:i===10?['Environmental (-25 vs peer)','Governance (-15 vs peer)']:i===14?['Social (-30 vs peer)','Governance (-28 vs peer)']:[],
}));

const ALERT_HISTORY = Array.from({length:12}, (_,i) => ({
  id:`AH-${i+1}`, date:`2026-0${3-Math.floor(i/6)}-${String(28-i%28*2).padStart(2,'0')}`,
  entity:['TotalEnergies','BP','Tesla','Shell','Nestle','HSBC','TotalEnergies','BP','Tesla','Siemens','BlackRock','Enel'][i],
  type:i<3?'Confirmed Anomaly':'False Positive',
  resolution:i<3?'Under Review':i<6?'Dismissed':'Resolved',
  score: Math.round(0.6+(sr(i * 10) * 2 - 1)*0.3,2)
}));

const FPR_DATA = ['2025-Q1','2025-Q2','2025-Q3','2025-Q4','2026-Q1'].map((q,i) => ({
  q, confirmed: Math.round(5+i*0.5), falsePositive: Math.round(3-i*0.4), fpr: Math.round((3-i*0.4)/(8+i*0.1)*100)
}));

const TABS = ['Anomaly Scanner','Isolation Forest Config','Flagged Entities','Investigation Workflow','Alert History','False Positive Rate'];

const Badge = ({code,label}) => <div style={{display:'inline-flex',alignItems:'center',gap:6,padding:'4px 12px',border:`1.5px solid ${T.gold}`,borderRadius:6,fontSize:11,fontFamily:T.mono,color:T.navy,background:`${T.gold}15`}}><span style={{fontWeight:700}}>{code}</span><span style={{color:T.textSec}}>{label}</span></div>;
const Card = ({children,style}) => <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20,...style}}>{children}</div>;
const KPI = ({label,value,sub,color=T.navy}) => <div style={{textAlign:'center'}}><div style={{fontSize:22,fontWeight:700,color,fontFamily:T.mono}}>{value}</div><div style={{fontSize:11,color:T.textSec,marginTop:2}}>{label}</div>{sub&&<div style={{fontSize:10,color:T.textMut}}>{sub}</div>}</div>;

export default function AnomalyDetectionEnginePage() {
  const [tab, setTab] = useState(0);
  const [contamination, setContamination] = useState(0.05);
  const [maxFeatures, setMaxFeatures] = useState(0.8);
  const [alerts, setAlerts] = useState([]);

  const flagged = useMemo(() => ENTITIES.filter(e => e.isAnomaly), []);
  const scatterData = useMemo(() => ENTITIES.map(e => ({
    name:e.name, x:e.score, y:e.peerAvg, anomaly:e.isAnomaly?1:0, size:e.isAnomaly?200:80
  })), []);

  const renderScanner = () => (
    <div>
      <Card>
        <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:12}}>Anomaly Scanner: Score vs Sector Peer Average</div>
        <ResponsiveContainer width="100%" height={360}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="x" name="Entity Score" tick={{fontSize:11,fill:T.textSec}} label={{value:'Entity Score',position:'bottom',fontSize:11,fill:T.textSec}} />
            <YAxis dataKey="y" name="Peer Average" tick={{fontSize:11,fill:T.textSec}} label={{value:'Peer Avg',angle:-90,position:'insideLeft',fontSize:11,fill:T.textSec}} />
            <ZAxis dataKey="size" range={[60,300]} />
            <Tooltip content={({payload})=>{
              if(!payload?.length) return null;
              const d=payload[0].payload;
              return <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:10,fontSize:12,fontFamily:T.font}}>
                <div style={{fontWeight:600,color:T.navy}}>{d.name}</div>
                <div style={{color:T.textSec}}>Score: {d.x} | Peer: {d.y}</div>
                {d.anomaly?<div style={{color:T.red,fontWeight:600}}>ANOMALY</div>:null}
              </div>;
            }} />
            <Scatter data={scatterData.filter(d=>!d.anomaly)} fill={T.blue} />
            <Scatter data={scatterData.filter(d=>d.anomaly)} fill={T.red} shape="diamond" />
            <ReferenceLine segment={[{x:30,y:30},{x:90,y:90}]} stroke={T.textMut} strokeDasharray="4 4" />
          </ScatterChart>
        </ResponsiveContainer>
        <div style={{fontSize:11,color:T.textMut,marginTop:8}}>Entities below the diagonal diverge negatively from sector peers. Diamond markers indicate detected anomalies. Contamination rate: {(contamination*100).toFixed(0)}%.</div>
      </Card>
    </div>
  );

  const renderConfig = () => (
    <Card>
      <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:16}}>Isolation Forest Configuration</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24}}>
        <div>
          <label style={{fontSize:12,color:T.textSec,display:'block',marginBottom:8}}>Contamination Rate: {(contamination*100).toFixed(1)}%</label>
          <input type="range" min={0.01} max={0.10} step={0.01} value={contamination} onChange={e=>setContamination(+e.target.value)} style={{width:'100%'}} />
          <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:T.textMut}}><span>1% (strict)</span><span>10% (lenient)</span></div>
        </div>
        <div>
          <label style={{fontSize:12,color:T.textSec,display:'block',marginBottom:8}}>Max Features: {(maxFeatures*100).toFixed(0)}%</label>
          <input type="range" min={0.3} max={1.0} step={0.1} value={maxFeatures} onChange={e=>setMaxFeatures(+e.target.value)} style={{width:'100%'}} />
          <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:T.textMut}}><span>30%</span><span>100%</span></div>
        </div>
      </div>
      <div style={{marginTop:20,display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
        {[
          {label:'n_estimators',value:'100',desc:'Number of base estimators'},
          {label:'max_samples',value:'auto',desc:'Samples per tree'},
          {label:'contamination',value:`${(contamination*100).toFixed(1)}%`,desc:'Expected anomaly fraction'},
          {label:'max_features',value:`${(maxFeatures*100).toFixed(0)}%`,desc:'Features per split'},
        ].map(p => (
          <div key={p.label} style={{padding:12,border:`1px solid ${T.border}`,borderRadius:8}}>
            <div style={{fontFamily:T.mono,fontSize:11,color:T.gold,fontWeight:600}}>{p.label}</div>
            <div style={{fontFamily:T.mono,fontSize:16,fontWeight:700,color:T.navy,margin:'4px 0'}}>{p.value}</div>
            <div style={{fontSize:10,color:T.textMut}}>{p.desc}</div>
          </div>
        ))}
      </div>
      <button style={{marginTop:16,padding:'10px 24px',borderRadius:8,border:'none',background:T.navy,color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer'}}>Re-Run Isolation Forest</button>
    </Card>
  );

  const renderFlagged = () => (
    <Card>
      <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:12}}>Flagged Entities ({flagged.length} anomalies)</div>
      {flagged.map(e => (
        <div key={e.id} style={{padding:16,border:`1px solid ${T.red}30`,borderRadius:8,marginBottom:12,background:`${T.red}04`}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
            <div>
              <span style={{fontWeight:700,fontSize:14,color:T.navy}}>{e.name}</span>
              <span style={{fontSize:11,color:T.textMut,marginLeft:8}}>{e.sector}</span>
            </div>
            <span style={{padding:'3px 10px',borderRadius:4,fontSize:10,fontWeight:700,background:`${T.red}15`,color:T.red}}>ANOMALY</span>
          </div>
          <div style={{display:'flex',gap:16,marginBottom:8}}>
            <div><span style={{fontSize:11,color:T.textSec}}>Score: </span><span style={{fontFamily:T.mono,fontWeight:600}}>{e.score}</span></div>
            <div><span style={{fontSize:11,color:T.textSec}}>Peer Avg: </span><span style={{fontFamily:T.mono,fontWeight:600}}>{e.peerAvg}</span></div>
            <div><span style={{fontSize:11,color:T.textSec}}>Deviation: </span><span style={{fontFamily:T.mono,fontWeight:600,color:T.red}}>{e.score-e.peerAvg}</span></div>
          </div>
          <div style={{fontSize:11,color:T.textSec}}>Outlier topics: {e.outlierTopics.join(', ')}</div>
          <button onClick={()=>setAlerts(a=>a.includes(e.id)?a.filter(x=>x!==e.id):[...a,e.id])} style={{marginTop:8,padding:'4px 12px',borderRadius:4,border:`1px solid ${alerts.includes(e.id)?T.red:T.border}`,background:alerts.includes(e.id)?`${T.red}15`:'transparent',fontSize:11,cursor:'pointer',color:alerts.includes(e.id)?T.red:T.textMut}}>{alerts.includes(e.id)?'Alert Active':'Set Alert'}</button>
        </div>
      ))}
    </Card>
  );

  const renderInvestigation = () => (
    <div>
      {flagged.map(e => (
        <Card key={e.id} style={{marginBottom:16,borderLeft:`3px solid ${T.red}`}}>
          <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:12}}>Investigation: {e.name}</div>
          <div style={{fontSize:12,color:T.textSec,marginBottom:12}}>Taxonomy nodes contributing to anomaly detection:</div>
          {e.outlierTopics.map((ot,i) => (
            <div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 0',borderBottom:`1px solid ${T.border}`}}>
              <div style={{width:8,height:8,borderRadius:4,background:T.red}} />
              <span style={{fontSize:12,color:T.navy,fontWeight:500}}>{ot}</span>
            </div>
          ))}
          <div style={{marginTop:12,display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
            {['Confirm Anomaly','Dismiss (False Positive)','Escalate to Review'].map((action,i) => (
              <button key={i} style={{padding:'8px 12px',borderRadius:6,border:`1px solid ${i===0?T.red:i===1?T.amber:T.blue}`,background:'transparent',fontSize:11,cursor:'pointer',color:i===0?T.red:i===1?T.amber:T.blue,fontWeight:600}}>{action}</button>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );

  const renderAlertHistory = () => (
    <Card>
      <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:12}}>Alert History (Past 6 Months)</div>
      <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
        <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>
          {['Date','Entity','Type','Score','Resolution'].map(h => <th key={h} style={{textAlign:'left',padding:'8px 12px',color:T.textSec,fontWeight:600}}>{h}</th>)}
        </tr></thead>
        <tbody>
          {ALERT_HISTORY.map(a => (
            <tr key={a.id} style={{borderBottom:`1px solid ${T.border}`}}>
              <td style={{padding:'6px 12px',fontFamily:T.mono,fontSize:11,color:T.textMut}}>{a.date}</td>
              <td style={{padding:'6px 12px',fontWeight:500,color:T.navy}}>{a.entity}</td>
              <td style={{padding:'6px 12px'}}><span style={{padding:'2px 8px',borderRadius:4,fontSize:10,fontWeight:600,background:a.type==='Confirmed Anomaly'?`${T.red}15`:`${T.amber}15`,color:a.type==='Confirmed Anomaly'?T.red:T.amber}}>{a.type}</span></td>
              <td style={{padding:'6px 12px',fontFamily:T.mono}}>{a.score}</td>
              <td style={{padding:'6px 12px'}}><span style={{padding:'2px 8px',borderRadius:4,fontSize:10,background:a.resolution==='Resolved'?`${T.green}15`:a.resolution==='Under Review'?`${T.blue}15`:`${T.textMut}15`,color:a.resolution==='Resolved'?T.green:a.resolution==='Under Review'?T.blue:T.textMut}}>{a.resolution}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );

  const renderFPR = () => (
    <Card>
      <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:12}}>False Positive Rate Tracking</div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={FPR_DATA}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
          <XAxis dataKey="q" tick={{fontSize:11,fill:T.textSec}} />
          <YAxis tick={{fontSize:11,fill:T.textSec}} />
          <Tooltip contentStyle={{borderRadius:8,border:`1px solid ${T.border}`,fontFamily:T.font,fontSize:12}} />
          <Legend />
          <Bar dataKey="confirmed" name="Confirmed Anomalies" fill={T.red} radius={[4,4,0,0]} />
          <Bar dataKey="falsePositive" name="False Positives" fill={T.amber} radius={[4,4,0,0]} />
        </BarChart>
      </ResponsiveContainer>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginTop:16}}>
        <div style={{padding:12,border:`1px solid ${T.border}`,borderRadius:8,textAlign:'center'}}>
          <div style={{fontSize:20,fontWeight:700,fontFamily:T.mono,color:T.green}}>62%</div>
          <div style={{fontSize:11,color:T.textSec}}>Precision (confirmed/total)</div>
        </div>
        <div style={{padding:12,border:`1px solid ${T.border}`,borderRadius:8,textAlign:'center'}}>
          <div style={{fontSize:20,fontWeight:700,fontFamily:T.mono,color:T.green}}>38%</div>
          <div style={{fontSize:11,color:T.textSec}}>False Positive Rate</div>
        </div>
        <div style={{padding:12,border:`1px solid ${T.border}`,borderRadius:8,textAlign:'center'}}>
          <div style={{fontSize:20,fontWeight:700,fontFamily:T.mono,color:T.green}}>-12pp</div>
          <div style={{fontSize:11,color:T.textSec}}>FPR improvement (YoY)</div>
        </div>
      </div>
    </Card>
  );

  const panels = [renderScanner, renderConfig, renderFlagged, renderInvestigation, renderAlertHistory, renderFPR];

  return (
    <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:24}}>
      <div style={{maxWidth:1400,margin:'0 auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20}}>
          <div>
            <Badge code="EP-CX3" label="Anomaly Detection Engine" />
            <h1 style={{fontSize:22,fontWeight:700,color:T.navy,margin:'12px 0 4px'}}>Anomaly & Outlier Detection Engine</h1>
            <p style={{fontSize:13,color:T.textSec,margin:0}}>Isolation Forest scanner with investigation workflow, alert history, FPR tracking</p>
          </div>
          <div style={{display:'flex',gap:16}}>
            <KPI label="Scanned" value="15" sub="entities" />
            <KPI label="Anomalies" value={flagged.length} sub="flagged" color={T.red} />
            <KPI label="FPR" value="38%" sub="improving" color={T.amber} />
          </div>
        </div>
        <div style={{display:'flex',gap:4,borderBottom:`2px solid ${T.border}`,marginBottom:20}}>
          {TABS.map((t,i) => <button key={i} onClick={()=>setTab(i)} style={{padding:'10px 18px',border:'none',borderBottom:`2px solid ${tab===i?T.gold:'transparent'}`,background:'transparent',color:tab===i?T.navy:T.textMut,fontWeight:tab===i?600:400,fontSize:13,fontFamily:T.font,cursor:'pointer',marginBottom:-2}}>{t}</button>)}
        </div>
        {panels[tab]()}
        <div style={{marginTop:20,padding:14,background:`${T.gold}08`,border:`1px solid ${T.gold}30`,borderRadius:8}}>
          <div style={{fontSize:12,fontWeight:600,color:T.gold,marginBottom:4}}>Algorithm Reference</div>
          <div style={{fontSize:11,color:T.textSec}}>Isolation Forest (Liu, Ting & Zhou 2008) detects anomalies by measuring how easily data points can be isolated via random partitioning. Anomaly score s(x,n) in [0,1] where scores near 1 indicate anomalies. Contamination parameter controls expected fraction of outliers. Investigation workflow follows a 3-step confirm/dismiss/escalate protocol with mandatory human-in-the-loop review.</div>
        </div>
      </div>
    </div>
  );
}
