import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell, ReferenceLine
} from 'recharts';

const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const T = {
  bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c',
  navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae',
  red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb',
  orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a',
  card:'#ffffff',sub:'#5c6b7e',indigo:'#4f46e5',font:"'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"
};

const MODELS = [
  { id:'M1', name:'Transition Score Ensemble', version:'v3.0', status:'Production', rmse:3.8, r2:0.92, auc:0.94, lastTrained:'2026-03-28', owner:'ML Team', riskTier:'High', psi:0.08, featurePsi:0.12 },
  { id:'M2', name:'Anomaly Detection (IF)', version:'v2.1', status:'Production', rmse:null, r2:null, auc:0.88, lastTrained:'2026-03-25', owner:'ML Team', riskTier:'High', psi:0.05, featurePsi:0.09 },
  { id:'M3', name:'Cluster Segmentation', version:'v1.8', status:'Production', rmse:null, r2:null, auc:null, lastTrained:'2026-03-20', owner:'Data Science', riskTier:'Medium', psi:0.11, featurePsi:0.15 },
  { id:'M4', name:'NLP Disclosure Parser', version:'v2.5', status:'Production', rmse:null, r2:null, auc:0.91, lastTrained:'2026-03-15', owner:'NLP Team', riskTier:'High', psi:0.18, featurePsi:0.22 },
  { id:'M5', name:'Scenario Predictor', version:'v1.2', status:'Staging', rmse:4.5, r2:0.87, auc:0.89, lastTrained:'2026-04-01', owner:'ML Team', riskTier:'Medium', psi:0.06, featurePsi:0.08 },
  { id:'M6', name:'Feature Store Pipeline', version:'v4.0', status:'Production', rmse:null, r2:null, auc:null, lastTrained:'2026-04-04', owner:'Data Eng', riskTier:'Low', psi:0.03, featurePsi:0.04 },
];

const PERF_TREND = ['2025-Q1','2025-Q2','2025-Q3','2025-Q4','2026-Q1'].map((q,i) => ({
  q, rmse: Math.round((4.2-i*0.1+(sr(i * 10) * 2 - 1)*0.15)*100)/100,
  r2: Math.round((0.88+i*0.01+(sr(i * 510) * 2 - 1)*0.005)*100)/100
}));

const SHAP_FEATURES = [
  { feature:'climate_transition', importance:0.18 },
  { feature:'env_score', importance:0.14 },
  { feature:'green_capex_pct', importance:0.12 },
  { feature:'sbti_alignment', importance:0.10 },
  { feature:'gov_score', importance:0.09 },
  { feature:'emissions_intensity', importance:0.08 },
  { feature:'climate_velocity', importance:0.07 },
  { feature:'soc_score', importance:0.06 },
  { feature:'lobbying_score', importance:0.05 },
  { feature:'board_diversity', importance:0.04 },
];

const COMPLIANCE_CHECKLIST = [
  { category:'Model Documentation', items:[
    {name:'Model purpose & scope',status:'Complete'},
    {name:'Training data description',status:'Complete'},
    {name:'Feature engineering documentation',status:'Complete'},
    {name:'Performance metrics & thresholds',status:'Complete'},
  ]},
  { category:'Validation', items:[
    {name:'Independent model validation',status:'Complete'},
    {name:'Out-of-sample testing',status:'Complete'},
    {name:'Stress testing & sensitivity',status:'In Progress'},
    {name:'Benchmark comparison',status:'Complete'},
  ]},
  { category:'Ongoing Monitoring', items:[
    {name:'Performance degradation alerts',status:'Complete'},
    {name:'Data drift detection',status:'Complete'},
    {name:'Feature importance stability',status:'In Progress'},
    {name:'Quarterly model review',status:'Scheduled'},
  ]},
  { category:'Risk Management', items:[
    {name:'Model risk classification',status:'Complete'},
    {name:'Limitation documentation',status:'Complete'},
    {name:'Fallback procedures',status:'Complete'},
    {name:'Model change management',status:'Complete'},
  ]},
];

const EU_AI_ACT = [
  { requirement:'Risk Classification', status:'Compliant', detail:'High-risk AI system (financial services credit scoring)', color:T.green },
  { requirement:'Technical Documentation', status:'Compliant', detail:'Comprehensive model cards for all production models', color:T.green },
  { requirement:'Data Governance', status:'Partial', detail:'Training data quality framework in place; bias testing in progress', color:T.amber },
  { requirement:'Transparency', status:'Compliant', detail:'SHAP explainability for all predictions; model cards public', color:T.green },
  { requirement:'Human Oversight', status:'Compliant', detail:'Human-in-the-loop for all anomaly confirmations; override capability', color:T.green },
  { requirement:'Accuracy & Robustness', status:'Compliant', detail:'Continuous monitoring with automated degradation alerts', color:T.green },
  { requirement:'Record-Keeping', status:'Partial', detail:'Audit trail for predictions; logging infrastructure being enhanced', color:T.amber },
  { requirement:'Registration', status:'Pending', detail:'EU AI Act database registration pending (effective 2026-08-02)', color:T.orange },
];

const TABS = ['Model Inventory','Performance Monitoring','Drift Detection','Explainability Report','Compliance Status','EU AI Act Alignment'];

const Badge = ({code,label}) => <div style={{display:'inline-flex',alignItems:'center',gap:6,padding:'4px 12px',border:`1.5px solid ${T.gold}`,borderRadius:6,fontSize:11,fontFamily:T.mono,color:T.navy,background:`${T.gold}15`}}><span style={{fontWeight:700}}>{code}</span><span style={{color:T.textSec}}>{label}</span></div>;
const Card = ({children,style}) => <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20,...style}}>{children}</div>;
const KPI = ({label,value,sub,color=T.navy}) => <div style={{textAlign:'center'}}><div style={{fontSize:22,fontWeight:700,color,fontFamily:T.mono}}>{value}</div><div style={{fontSize:11,color:T.textSec,marginTop:2}}>{label}</div>{sub&&<div style={{fontSize:10,color:T.textMut}}>{sub}</div>}</div>;

export default function MlGovernanceDashboardPage() {
  const [tab, setTab] = useState(0);
  const [selModel, setSelModel] = useState('M1');
  const [bookmarks, setBookmarks] = useState([]);

  const model = MODELS.find(m=>m.id===selModel);

  const renderInventory = () => (
    <Card>
      <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:12}}>Deployed Model Inventory</div>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
          <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>
            {['Model','Version','Status','Risk Tier','RMSE','R2','AUC','Last Trained','Owner'].map(h => <th key={h} style={{textAlign:'left',padding:'8px 8px',color:T.textSec,fontWeight:600,fontSize:11}}>{h}</th>)}
          </tr></thead>
          <tbody>
            {MODELS.map(m => (
              <tr key={m.id} style={{borderBottom:`1px solid ${T.border}`,cursor:'pointer',background:selModel===m.id?`${T.navy}06`:'transparent'}} onClick={()=>setSelModel(m.id)}>
                <td style={{padding:'8px 8px',fontWeight:600,color:T.navy}}>{m.name}</td>
                <td style={{padding:'8px 8px',fontFamily:T.mono,fontSize:11}}>{m.version}</td>
                <td style={{padding:'8px 8px'}}><span style={{padding:'2px 8px',borderRadius:4,fontSize:10,fontWeight:600,background:m.status==='Production'?`${T.green}15`:`${T.amber}15`,color:m.status==='Production'?T.green:T.amber}}>{m.status}</span></td>
                <td style={{padding:'8px 8px'}}><span style={{padding:'2px 8px',borderRadius:4,fontSize:10,fontWeight:600,background:m.riskTier==='High'?`${T.red}15`:m.riskTier==='Medium'?`${T.amber}15`:`${T.green}15`,color:m.riskTier==='High'?T.red:m.riskTier==='Medium'?T.amber:T.green}}>{m.riskTier}</span></td>
                <td style={{padding:'8px 8px',fontFamily:T.mono}}>{m.rmse||'N/A'}</td>
                <td style={{padding:'8px 8px',fontFamily:T.mono}}>{m.r2||'N/A'}</td>
                <td style={{padding:'8px 8px',fontFamily:T.mono}}>{m.auc||'N/A'}</td>
                <td style={{padding:'8px 8px',fontFamily:T.mono,fontSize:10,color:T.textMut}}>{m.lastTrained}</td>
                <td style={{padding:'8px 8px',fontSize:11,color:T.textSec}}>{m.owner}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );

  const renderPerformance = () => (
    <Card>
      <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:12}}>Performance Monitoring: RMSE & R-squared Trend</div>
      <ResponsiveContainer width="100%" height={340}>
        <LineChart data={PERF_TREND}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
          <XAxis dataKey="q" tick={{fontSize:11,fill:T.textSec}} />
          <YAxis yAxisId="left" domain={[3,5]} tick={{fontSize:11,fill:T.textSec}} label={{value:'RMSE',angle:-90,position:'insideLeft',fontSize:10}} />
          <YAxis yAxisId="right" orientation="right" domain={[0.85,0.95]} tick={{fontSize:11,fill:T.textSec}} label={{value:'R2',angle:90,position:'insideRight',fontSize:10}} />
          <Tooltip contentStyle={{borderRadius:8,border:`1px solid ${T.border}`,fontFamily:T.font,fontSize:12}} />
          <Legend />
          <Line yAxisId="left" type="monotone" dataKey="rmse" name="RMSE" stroke={T.red} strokeWidth={2} dot={{r:4}} />
          <Line yAxisId="right" type="monotone" dataKey="r2" name="R-squared" stroke={T.green} strokeWidth={2} dot={{r:4}} />
          <ReferenceLine yAxisId="left" y={4.5} stroke={T.red} strokeDasharray="4 4" label={{value:'RMSE Alert',fill:T.red,fontSize:9}} />
        </LineChart>
      </ResponsiveContainer>
      <div style={{padding:10,background:`${T.green}08`,borderRadius:6,marginTop:12,fontSize:11,color:T.textSec}}>
        All performance metrics within acceptable thresholds. RMSE trending downward (4.2 to 3.8 over 5 quarters). No degradation alerts triggered.
      </div>
    </Card>
  );

  const renderDrift = () => (
    <Card>
      <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:12}}>Drift Detection: PSI (Population Stability Index)</div>
      <div style={{marginBottom:12,fontSize:11,color:T.textSec}}>PSI threshold: &gt;0.25 = significant drift (retrain required) | 0.10-0.25 = moderate drift (monitor) | &lt;0.10 = stable</div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={MODELS}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
          <XAxis dataKey="name" tick={{fontSize:9,fill:T.textSec}} />
          <YAxis domain={[0,0.3]} tick={{fontSize:11,fill:T.textSec}} />
          <Tooltip contentStyle={{borderRadius:8,border:`1px solid ${T.border}`,fontFamily:T.font,fontSize:12}} />
          <Legend />
          <ReferenceLine y={0.25} stroke={T.red} strokeDasharray="4 4" label={{value:'Retrain',fill:T.red,fontSize:9}} />
          <ReferenceLine y={0.10} stroke={T.amber} strokeDasharray="4 4" label={{value:'Monitor',fill:T.amber,fontSize:9}} />
          <Bar dataKey="psi" name="Prediction PSI" radius={[4,4,0,0]}>
            {MODELS.map((m,i) => <Cell key={i} fill={m.psi>0.25?T.red:m.psi>0.10?T.amber:T.green} />)}
          </Bar>
          <Bar dataKey="featurePsi" name="Feature PSI" radius={[4,4,0,0]}>
            {MODELS.map((m,i) => <Cell key={i} fill={m.featurePsi>0.25?T.red:m.featurePsi>0.10?T.amber:T.green} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginTop:16}}>
        {MODELS.filter(m=>m.featurePsi>0.10).map(m => (
          <div key={m.id} style={{padding:10,border:`1px solid ${T.amber}30`,borderRadius:8,background:`${T.amber}06`}}>
            <div style={{fontSize:12,fontWeight:600,color:T.amber}}>Moderate Drift</div>
            <div style={{fontSize:11,color:T.navy,fontWeight:500}}>{m.name}</div>
            <div style={{fontSize:10,color:T.textMut}}>Feature PSI: {m.featurePsi}</div>
          </div>
        ))}
      </div>
    </Card>
  );

  const renderExplainability = () => (
    <div>
      <Card>
        <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:12}}>SHAP Feature Importance (Top 10)</div>
        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={SHAP_FEATURES} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis type="number" domain={[0,0.20]} tick={{fontSize:11,fill:T.textSec}} />
            <YAxis dataKey="feature" type="category" width={140} tick={{fontSize:10,fontFamily:T.mono,fill:T.textSec}} />
            <Tooltip contentStyle={{borderRadius:8,border:`1px solid ${T.border}`,fontFamily:T.font,fontSize:12}} />
            <Bar dataKey="importance" name="Mean |SHAP|" fill={T.navy} radius={[0,4,4,0]} barSize={14}>
              {SHAP_FEATURES.map((f,i) => <Cell key={i} fill={i<3?T.navy:i<6?T.blue:T.teal} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
      <div style={{marginTop:16,padding:14,background:`${T.blue}08`,border:`1px solid ${T.blue}25`,borderRadius:8}}>
        <div style={{fontSize:12,fontWeight:600,color:T.blue,marginBottom:4}}>Explainability Summary</div>
        <div style={{fontSize:11,color:T.textSec}}>Top 3 features (climate_transition, env_score, green_capex_pct) account for 44% of total model output variance. SHAP values computed using TreeSHAP for gradient-boosted models and KernelSHAP for neural network. Partial dependence plots available for each feature on request.</div>
      </div>
    </div>
  );

  const renderCompliance = () => (
    <div>
      {COMPLIANCE_CHECKLIST.map(cat => (
        <Card key={cat.category} style={{marginBottom:12}}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:10}}>{cat.category}</div>
          {cat.items.map((item,i) => (
            <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 0',borderBottom:i<cat.items.length-1?`1px solid ${T.border}`:'none'}}>
              <span style={{fontSize:12,color:T.textSec}}>{item.name}</span>
              <span style={{padding:'2px 8px',borderRadius:4,fontSize:10,fontWeight:600,background:item.status==='Complete'?`${T.green}15`:item.status==='In Progress'?`${T.amber}15`:`${T.blue}15`,color:item.status==='Complete'?T.green:item.status==='In Progress'?T.amber:T.blue}}>{item.status}</span>
            </div>
          ))}
        </Card>
      ))}
      <div style={{padding:12,background:`${T.green}08`,borderRadius:8,fontSize:11,color:T.textSec}}>
        Compliance framework aligned with Fed SR 11-7 (Supervisory Guidance on Model Risk Management). 14 of 16 checklist items complete. 2 items in progress with expected completion by 2026-04-30.
      </div>
    </div>
  );

  const renderEuAiAct = () => (
    <Card>
      <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:12}}>EU AI Act Alignment Assessment</div>
      <div style={{marginBottom:16,padding:12,background:`${T.navy}08`,borderRadius:8}}>
        <div style={{fontSize:12,fontWeight:600,color:T.navy}}>Classification: High-Risk AI System</div>
        <div style={{fontSize:11,color:T.textSec,marginTop:4}}>Financial services AI systems used for creditworthiness assessment and risk scoring fall under Annex III, Category 5(b) of the EU AI Act. Full compliance required by August 2, 2026.</div>
      </div>
      {EU_AI_ACT.map((req,i) => (
        <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 0',borderBottom:`1px solid ${T.border}`}}>
          <div style={{flex:1}}>
            <div style={{fontWeight:600,fontSize:13,color:T.navy}}>{req.requirement}</div>
            <div style={{fontSize:11,color:T.textSec,marginTop:2}}>{req.detail}</div>
          </div>
          <span style={{padding:'3px 12px',borderRadius:4,fontSize:10,fontWeight:600,background:`${req.color}15`,color:req.color,whiteSpace:'nowrap',marginLeft:12}}>{req.status}</span>
        </div>
      ))}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginTop:20}}>
        <div style={{padding:12,border:`1px solid ${T.green}`,borderRadius:8,textAlign:'center'}}>
          <div style={{fontSize:22,fontWeight:700,fontFamily:T.mono,color:T.green}}>5</div>
          <div style={{fontSize:11,color:T.textSec}}>Compliant</div>
        </div>
        <div style={{padding:12,border:`1px solid ${T.amber}`,borderRadius:8,textAlign:'center'}}>
          <div style={{fontSize:22,fontWeight:700,fontFamily:T.mono,color:T.amber}}>2</div>
          <div style={{fontSize:11,color:T.textSec}}>Partial</div>
        </div>
        <div style={{padding:12,border:`1px solid ${T.orange}`,borderRadius:8,textAlign:'center'}}>
          <div style={{fontSize:22,fontWeight:700,fontFamily:T.mono,color:T.orange}}>1</div>
          <div style={{fontSize:11,color:T.textSec}}>Pending</div>
        </div>
      </div>
    </Card>
  );

  const panels = [renderInventory, renderPerformance, renderDrift, renderExplainability, renderCompliance, renderEuAiAct];

  return (
    <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:24}}>
      <div style={{maxWidth:1400,margin:'0 auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20}}>
          <div>
            <Badge code="EP-CX6" label="ML Governance Dashboard" />
            <h1 style={{fontSize:22,fontWeight:700,color:T.navy,margin:'12px 0 4px'}}>ML Model Governance & Explainability</h1>
            <p style={{fontSize:13,color:T.textSec,margin:0}}>Model inventory, drift detection (PSI), SHAP explainability, SR 11-7 compliance, EU AI Act alignment</p>
          </div>
          <div style={{display:'flex',gap:16}}>
            <KPI label="Models" value={MODELS.length} sub="deployed" />
            <KPI label="Drift Alerts" value={MODELS.filter(m=>m.featurePsi>0.10).length} sub="moderate" color={T.amber} />
            <KPI label="EU AI Act" value="75%" sub="compliant" color={T.green} />
          </div>
        </div>
        <div style={{display:'flex',gap:4,borderBottom:`2px solid ${T.border}`,marginBottom:20}}>
          {TABS.map((t,i) => <button key={i} onClick={()=>setTab(i)} style={{padding:'10px 18px',border:'none',borderBottom:`2px solid ${tab===i?T.gold:'transparent'}`,background:'transparent',color:tab===i?T.navy:T.textMut,fontWeight:tab===i?600:400,fontSize:13,fontFamily:T.font,cursor:'pointer',marginBottom:-2}}>{t}</button>)}
        </div>
        {panels[tab]()}
        <div style={{marginTop:20,padding:14,background:`${T.gold}08`,border:`1px solid ${T.gold}30`,borderRadius:8}}>
          <div style={{fontSize:12,fontWeight:600,color:T.gold,marginBottom:4}}>Governance Framework</div>
          <div style={{fontSize:11,color:T.textSec}}>Model governance follows a three-lines-of-defense framework: (1) Model developers own accuracy and documentation, (2) Model validation team provides independent challenge, (3) Internal audit reviews the governance process. PSI (Population Stability Index) computed monthly on production data vs training distribution. EU AI Act compliance assessment updated quarterly per Article 9 risk management requirements.</div>
        </div>
      </div>
    </div>
  );
}
