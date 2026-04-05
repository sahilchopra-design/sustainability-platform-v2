import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell, ReferenceLine, PieChart, Pie
} from 'recharts';

const T = {
  bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c',
  navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae',
  red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb',
  orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a',
  font:"'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"
};

const ENTITY_TYPES = ['FI','Energy','Corporate'];
const L1_TOPICS = ['Environmental','Social','Governance','Climate','Biodiversity','Supply Chain','Human Rights','Innovation'];
const TYPE_COLORS = { FI:T.navy, Energy:T.orange, Corporate:T.blue };

const ENTITIES = Array.from({length:15}, (_,i) => {
  const type = ENTITY_TYPES[i%3];
  const base = type==='FI'?68:type==='Energy'?48:72;
  return {
    id:`E${i+1}`, name:['JPMorgan','Shell','Microsoft','HSBC','TotalEnergies','Unilever','Allianz','Enel','Siemens','BNP','BP','Nestle','BlackRock','NextEra','Tesla'][i],
    type, scores: L1_TOPICS.map((_,ti) => Math.round(base + Math.sin(i*2.3+ti)*18)),
    trend: [0.8,1.2,-0.3,0.5,1.8,-0.5,0.9,1.1,0.7,0.4,-0.8,0.3,1.5,2.1,1.7][i]
  };
});

const ALERTS = [
  { id:'AL1', type:'Score Deterioration', entity:'Shell', message:'Environmental score dropped 6pts in Q1-26', severity:'high', date:'2026-04-02' },
  { id:'AL2', type:'Data Quality', entity:'TotalEnergies', message:'Scope 3 data completeness below 40%', severity:'medium', date:'2026-04-01' },
  { id:'AL3', type:'Regulatory', entity:'All FIs', message:'ECB supervisory expectations deadline in 45 days', severity:'high', date:'2026-03-28' },
  { id:'AL4', type:'Score Deterioration', entity:'BP', message:'Climate score dropped 5pts after net-zero target revision', severity:'high', date:'2026-03-25' },
  { id:'AL5', type:'Data Quality', entity:'Nestle', message:'Supply chain audit coverage data stale (>6 months)', severity:'low', date:'2026-03-20' },
  { id:'AL6', type:'Regulatory', entity:'All Corporates', message:'CSRD ESRS E1 disclosure deadline approaching', severity:'medium', date:'2026-03-15' },
];

const TREND_DATA = ['Q1-25','Q2-25','Q3-25','Q4-25','Q1-26'].map((q,qi) => ({
  q, FI: Math.round(65+qi*1.2), Energy: Math.round(45+qi*1.8), Corporate: Math.round(70+qi*1.0), Platform: Math.round(60+qi*1.3)
}));

const TABS = ['Platform KPIs','Entity Type Comparison','Risk Heat Map','Alert Center','Trend Intelligence','Board Pack'];

const Badge = ({code,label}) => <div style={{display:'inline-flex',alignItems:'center',gap:6,padding:'4px 12px',border:`1.5px solid ${T.gold}`,borderRadius:6,fontSize:11,fontFamily:T.mono,color:T.navy,background:`${T.gold}15`}}><span style={{fontWeight:700}}>{code}</span><span style={{color:T.textSec}}>{label}</span></div>;
const Card = ({children,style}) => <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20,...style}}>{children}</div>;
const KPI = ({label,value,sub,color=T.navy}) => <div style={{textAlign:'center'}}><div style={{fontSize:22,fontWeight:700,color,fontFamily:T.mono}}>{value}</div><div style={{fontSize:11,color:T.textSec,marginTop:2}}>{label}</div>{sub&&<div style={{fontSize:10,color:T.textMut}}>{sub}</div>}</div>;

export default function CrossEntityIntelligenceDashboardPage() {
  const [tab, setTab] = useState(0);
  const [dismissedAlerts, setDismissedAlerts] = useState([]);

  const avgByType = useMemo(() => ENTITY_TYPES.map(type => {
    const ents = ENTITIES.filter(e=>e.type===type);
    const avgScores = L1_TOPICS.map((_,ti) => Math.round(ents.reduce((a,e)=>a+e.scores[ti],0)/ents.length));
    return { type, avg: Math.round(avgScores.reduce((a,b)=>a+b,0)/avgScores.length), scores: avgScores, count: ents.length };
  }), []);

  const platformAvg = useMemo(() => Math.round(ENTITIES.reduce((a,e)=>a+e.scores.reduce((b,c)=>b+c,0)/8,0)/ENTITIES.length), []);

  const heatMapData = useMemo(() => ENTITIES.map(e => ({ name:e.name, type:e.type, scores: Object.fromEntries(L1_TOPICS.map((t,i)=>[t,e.scores[i]])) })), []);

  const distData = useMemo(() => {
    const buckets = [{ range:'0-25', count:0 },{ range:'26-50', count:0 },{ range:'51-75', count:0 },{ range:'76-100', count:0 }];
    ENTITIES.forEach(e => {
      const avg = Math.round(e.scores.reduce((a,b)=>a+b,0)/8);
      if(avg<=25) buckets[0].count++; else if(avg<=50) buckets[1].count++; else if(avg<=75) buckets[2].count++; else buckets[3].count++;
    });
    return buckets;
  }, []);

  const comparisonRadar = useMemo(() => L1_TOPICS.map((t,ti) => {
    const row = { topic: t };
    avgByType.forEach(at => { row[at.type] = at.scores[ti]; });
    return row;
  }), [avgByType]);

  const renderPlatformKPIs = () => (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:16,marginBottom:20}}>
        <Card style={{textAlign:'center',borderTop:`3px solid ${T.navy}`}}>
          <div style={{fontSize:28,fontWeight:700,fontFamily:T.mono,color:T.navy}}>15</div>
          <div style={{fontSize:12,color:T.textSec}}>Entities Assessed</div>
        </Card>
        <Card style={{textAlign:'center',borderTop:`3px solid ${T.gold}`}}>
          <div style={{fontSize:28,fontWeight:700,fontFamily:T.mono,color:T.gold}}>94%</div>
          <div style={{fontSize:12,color:T.textSec}}>Taxonomy Coverage</div>
        </Card>
        <Card style={{textAlign:'center',borderTop:`3px solid ${T.teal}`}}>
          <div style={{fontSize:28,fontWeight:700,fontFamily:T.mono,color:T.teal}}>{platformAvg}</div>
          <div style={{fontSize:12,color:T.textSec}}>Platform Avg Score</div>
        </Card>
        <Card style={{textAlign:'center',borderTop:`3px solid ${T.green}`}}>
          <div style={{fontSize:28,fontWeight:700,fontFamily:T.mono,color:T.green}}>+1.3</div>
          <div style={{fontSize:12,color:T.textSec}}>Quarterly Improvement</div>
        </Card>
        <Card style={{textAlign:'center',borderTop:`3px solid ${T.red}`}}>
          <div style={{fontSize:28,fontWeight:700,fontFamily:T.mono,color:T.red}}>{ALERTS.filter(a=>a.severity==='high').length}</div>
          <div style={{fontSize:12,color:T.textSec}}>High-Priority Alerts</div>
        </Card>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        <Card>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>Score Distribution</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={distData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="range" tick={{fontSize:11,fill:T.textSec}} />
              <YAxis tick={{fontSize:11,fill:T.textSec}} />
              <Tooltip />
              <Bar dataKey="count" fill={T.navy} radius={[4,4,0,0]}>
                {distData.map((d,i) => <Cell key={i} fill={[T.red,T.amber,T.blue,T.green][i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>Entity Type Breakdown</div>
          {avgByType.map(at => (
            <div key={at.type} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:`1px solid ${T.border}`}}>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <div style={{width:10,height:10,borderRadius:5,background:TYPE_COLORS[at.type]}} />
                <span style={{fontWeight:500,color:T.navy}}>{at.type}</span>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <span style={{fontSize:11,color:T.textMut}}>{at.count} entities</span>
                <span style={{fontFamily:T.mono,fontWeight:700,color:TYPE_COLORS[at.type]}}>{at.avg}</span>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );

  const renderEntityTypeComparison = () => (
    <Card>
      <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:12}}>Entity Type Comparison: FI vs Energy vs Corporate (8 L1 Topics)</div>
      <ResponsiveContainer width="100%" height={400}>
        <RadarChart data={comparisonRadar}>
          <PolarGrid stroke={T.border} />
          <PolarAngleAxis dataKey="topic" tick={{fontSize:10,fill:T.textSec}} />
          <PolarRadiusAxis domain={[0,100]} tick={{fontSize:9,fill:T.textMut}} />
          {ENTITY_TYPES.map(type => <Radar key={type} name={type} dataKey={type} stroke={TYPE_COLORS[type]} fill={TYPE_COLORS[type]} fillOpacity={0.1} strokeWidth={2} />)}
          <Legend />
          <Tooltip />
        </RadarChart>
      </ResponsiveContainer>
    </Card>
  );

  const scoreColor = (s) => s>=70?T.green:s>=50?`${T.amber}`:s>=30?T.orange:T.red;

  const renderHeatMap = () => (
    <Card>
      <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:12}}>Risk Heat Map: 15 Entities x 8 L1 Topics</div>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
          <thead><tr>
            <th style={{textAlign:'left',padding:'6px 8px',color:T.textSec,fontWeight:600,minWidth:100}}>Entity</th>
            {L1_TOPICS.map(t => <th key={t} style={{textAlign:'center',padding:'6px 4px',color:T.textSec,fontWeight:600,fontSize:9,minWidth:70}}>{t}</th>)}
          </tr></thead>
          <tbody>
            {heatMapData.map(e => (
              <tr key={e.name}>
                <td style={{padding:'6px 8px',fontWeight:500,color:T.navy,borderBottom:`1px solid ${T.border}`}}>
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    <div style={{width:6,height:6,borderRadius:3,background:TYPE_COLORS[e.type]}} />
                    {e.name}
                  </div>
                </td>
                {L1_TOPICS.map(t => (
                  <td key={t} style={{textAlign:'center',padding:'4px',borderBottom:`1px solid ${T.border}`}}>
                    <div style={{padding:'4px 0',borderRadius:4,background:`${scoreColor(e.scores[t])}18`,color:scoreColor(e.scores[t]),fontFamily:T.mono,fontWeight:600,fontSize:11}}>{e.scores[t]}</div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );

  const renderAlerts = () => (
    <Card>
      <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:12}}>Alert Center</div>
      {ALERTS.filter(a=>!dismissedAlerts.includes(a.id)).map(a => (
        <div key={a.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 0',borderBottom:`1px solid ${T.border}`}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <div style={{width:8,height:8,borderRadius:4,background:a.severity==='high'?T.red:a.severity==='medium'?T.amber:T.blue}} />
            <div>
              <div style={{fontWeight:600,fontSize:12,color:T.navy}}>{a.type}: {a.entity}</div>
              <div style={{fontSize:11,color:T.textSec,marginTop:2}}>{a.message}</div>
              <div style={{fontSize:10,color:T.textMut,marginTop:2}}>{a.date}</div>
            </div>
          </div>
          <div style={{display:'flex',gap:8}}>
            <span style={{padding:'2px 8px',borderRadius:4,fontSize:10,fontWeight:600,background:a.severity==='high'?`${T.red}15`:a.severity==='medium'?`${T.amber}15`:`${T.blue}15`,color:a.severity==='high'?T.red:a.severity==='medium'?T.amber:T.blue}}>{a.severity}</span>
            <button onClick={()=>setDismissedAlerts(d=>[...d,a.id])} style={{padding:'2px 8px',borderRadius:4,border:`1px solid ${T.border}`,background:'transparent',fontSize:10,cursor:'pointer',color:T.textMut}}>Dismiss</button>
          </div>
        </div>
      ))}
    </Card>
  );

  const renderTrend = () => (
    <Card>
      <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:12}}>Platform-Wide Score Trajectory</div>
      <ResponsiveContainer width="100%" height={340}>
        <AreaChart data={TREND_DATA}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
          <XAxis dataKey="q" tick={{fontSize:11,fill:T.textSec}} />
          <YAxis domain={[40,80]} tick={{fontSize:11,fill:T.textSec}} />
          <Tooltip contentStyle={{borderRadius:8,border:`1px solid ${T.border}`,fontFamily:T.font,fontSize:12}} />
          <Legend />
          <Area type="monotone" dataKey="Platform" stroke={T.gold} fill={`${T.gold}20`} strokeWidth={2} />
          <Area type="monotone" dataKey="FI" stroke={T.navy} fill={`${T.navy}10`} strokeWidth={1.5} />
          <Area type="monotone" dataKey="Energy" stroke={T.orange} fill={`${T.orange}10`} strokeWidth={1.5} />
          <Area type="monotone" dataKey="Corporate" stroke={T.blue} fill={`${T.blue}10`} strokeWidth={1.5} />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );

  const renderBoardPack = () => (
    <div>
      <Card style={{borderLeft:`3px solid ${T.gold}`}}>
        <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:8}}>Executive Board Pack Generator</div>
        <div style={{fontSize:12,color:T.textSec,marginBottom:16}}>2-page executive summary with key platform metrics, risk highlights, and recommended actions.</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12}}>
          {[
            {section:'Portfolio Overview',items:['15 entities, 3 types','Platform avg: '+platformAvg,'Coverage: 94% taxonomy']},
            {section:'Risk Highlights',items:[`${ALERTS.filter(a=>a.severity==='high').length} high-priority alerts`,'Energy sector underperforming','3 entities with score drift >5pts']},
            {section:'Regulatory Readiness',items:['ECB deadline in 45 days','CSRD ESRS E1 gap: 2 entities','ISSB S2 compliance: 80%']},
            {section:'Recommended Actions',items:['Escalate Energy sector engagement','Complete CSRD gap remediation','Review Shell & BP transition plans']},
          ].map(s => (
            <div key={s.section} style={{padding:14,border:`1px solid ${T.border}`,borderRadius:8}}>
              <div style={{fontWeight:600,fontSize:13,color:T.navy,marginBottom:8}}>{s.section}</div>
              {s.items.map((item,i) => (
                <div key={i} style={{fontSize:11,color:T.textSec,padding:'3px 0',display:'flex',alignItems:'center',gap:6}}>
                  <div style={{width:4,height:4,borderRadius:2,background:T.gold}} />
                  {item}
                </div>
              ))}
            </div>
          ))}
        </div>
        <button style={{marginTop:16,padding:'10px 24px',borderRadius:8,border:'none',background:T.navy,color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer'}}>Generate Board Pack PDF</button>
      </Card>
    </div>
  );

  const panels = [renderPlatformKPIs, renderEntityTypeComparison, renderHeatMap, renderAlerts, renderTrend, renderBoardPack];

  return (
    <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:24}}>
      <div style={{maxWidth:1400,margin:'0 auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20}}>
          <div>
            <Badge code="EP-CW6" label="Cross-Entity Intelligence Dashboard" />
            <h1 style={{fontSize:22,fontWeight:700,color:T.navy,margin:'12px 0 4px'}}>Cross-Entity Intelligence Dashboard</h1>
            <p style={{fontSize:13,color:T.textSec,margin:0}}>Executive dashboard: KPIs, heat map, alerts, trend intelligence, board pack</p>
          </div>
          <div style={{display:'flex',gap:16}}>
            <KPI label="Entities" value="15" sub="3 types" />
            <KPI label="Avg Score" value={platformAvg} sub="platform-wide" color={T.gold} />
            <KPI label="Alerts" value={ALERTS.length} sub={`${ALERTS.filter(a=>a.severity==='high').length} high`} color={T.red} />
          </div>
        </div>
        <div style={{display:'flex',gap:4,borderBottom:`2px solid ${T.border}`,marginBottom:20}}>
          {TABS.map((t,i) => <button key={i} onClick={()=>setTab(i)} style={{padding:'10px 18px',border:'none',borderBottom:`2px solid ${tab===i?T.gold:'transparent'}`,background:'transparent',color:tab===i?T.navy:T.textMut,fontWeight:tab===i?600:400,fontSize:13,fontFamily:T.font,cursor:'pointer',marginBottom:-2}}>{t}</button>)}
        </div>
        {panels[tab]()}
        <div style={{marginTop:20,padding:14,background:`${T.gold}08`,border:`1px solid ${T.gold}30`,borderRadius:8}}>
          <div style={{fontSize:12,fontWeight:600,color:T.gold,marginBottom:4}}>Dashboard Notes</div>
          <div style={{fontSize:11,color:T.textSec}}>Platform KPIs refresh daily at 06:00 UTC. Heat map colors use RAGBI (Red-Amber-Green-Blue-Indigo) scale calibrated to sector-specific percentile benchmarks. Alerts are triggered by configurable rules engine with severity escalation matrix. Board pack follows TCFD recommended disclosure framework.</div>
        </div>
      </div>
    </div>
  );
}
