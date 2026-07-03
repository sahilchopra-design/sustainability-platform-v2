import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, ScatterChart, Scatter, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';

const T = {bg:'#f4f6f9',surface:'#ffffff',surfaceH:'#eef1f6',border:'#e3e8ef',borderL:'#cfd6e0',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const hashStr = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i); return Math.abs(h); };

const SECTORS = ['Energy','Financials','Materials','Industrials','Technology','Healthcare','Utilities','Real Estate','Consumer','Agriculture'];
const REGIONS = ['North America','Europe','Asia Pacific','Emerging Markets','Latin America'];

const ENTITIES = Array.from({length:40},(_,i)=>{
  const s = hashStr(`entity_${i}`);
  return {
    id:`E${String(i+1).padStart(2,'0')}`,
    name:['NovaCorp','GreenAxis','BluePeak','TerraFin','EcoVault','CarbonMark','SolarEdge','WindPath','AquaFlow','BioNova','ClimaTech','EcoSphere','GreenBridge','NatureBase','SkyLimit','OceanCore','ForestWall','RiverBank','MtnPeak','ValleyTech','DesertSun','ArcticFlow','CoralPath','PrairieAg','TundraRes','MangroveF','ClearWater','BrightSky','DarkMatter','LightPath','StoneEdge','IronBridge','GoldMine','SilverLake','BronzeWall','CopperTop','ZincCore','LeadFree','TinPath','AlumBase'][i],
    sector:SECTORS[Math.floor(sr(s*7)*10)],
    region:REGIONS[Math.floor(sr(s*11)*5)],
    esg_score:40+sr(s*3)*55,
    ghg_intensity:sr(s*5)*400+10,
    revenue:sr(s*7)*50+1,
    debt_ratio:sr(s*11)*0.7+0.1,
    controversy_count:Math.floor(sr(s*13)*8),
    board_diversity:sr(s*17)*0.6+0.2,
    water_stress:sr(s*19)*5,
    biodiversity_exposure:sr(s*23)*10,
    supply_chain_risk:sr(s*29)*100,
    audit_quality:sr(s*31)*5+1,
    disclosure_score:sr(s*37)*90+10,
    sbti_status:sr(s*41)>0.6?1:0,
    taxonomy_alignment:sr(s*43)*100,
    sentiment_score:sr(s*47)*2-1,
    analyst_materiality:sr(s*53)*100,
    ml_materiality:sr(s*59)*100,
    anomaly_score:sr(s*61)*2-1,
  };
});

const LDA_TOPICS = [
  {id:0,name:'Climate Transition Risk',coherence:0.82,words:['carbon','emissions','transition','stranded','fossil','renewable','policy','regulation']},
  {id:1,name:'Supply Chain ESG',coherence:0.76,words:['supplier','sourcing','labor','human','rights','audits','traceability','certification']},
  {id:2,name:'Water & Biodiversity',coherence:0.79,words:['water','stress','biodiversity','land','use','ecosystems','species','pollution']},
  {id:3,name:'Governance & Disclosure',coherence:0.88,words:['board','diversity','audit','disclosure','transparency','remuneration','independence','oversight']},
  {id:4,name:'Physical Climate Hazard',coherence:0.74,words:['flooding','drought','heat','extreme','weather','resilience','adaptation','infrastructure']},
  {id:5,name:'Green Finance & Taxonomy',coherence:0.71,words:['taxonomy','sustainable','bond','green','finance','EU','SFDR','alignment']},
  {id:6,name:'Social Impact & DEI',coherence:0.69,words:['social','equality','diversity','inclusion','community','wages','safety','wellbeing']},
  {id:7,name:'Technology & Innovation',coherence:0.77,words:['innovation','R&D','technology','automation','AI','digitalization','patent','disruption']},
];

const CLUSTERS = [
  {id:0,name:'High Materiality Risk',color:'#dc2626',centroid:{esg:35,ghg:380,disclosure:30,risk:85}},
  {id:1,name:'Transition Leaders',color:'#16a34a',centroid:{esg:82,ghg:45,disclosure:88,risk:20}},
  {id:2,name:'Moderate Performers',color:'#d97706',centroid:{esg:58,ghg:150,disclosure:62,risk:50}},
  {id:3,name:'Disclosure Laggards',color:'#7c3aed',centroid:{esg:55,ghg:120,disclosure:28,risk:60}},
  {id:4,name:'Sector Outliers',color:'#0891b2',centroid:{esg:48,ghg:210,disclosure:55,risk:72}},
];

const MODELS = [
  {name:'Random Forest',accuracy:0.847,precision:0.841,recall:0.839,f1:0.840,auc:0.912,weight:0.35},
  {name:'Gradient Boosting',accuracy:0.863,precision:0.858,recall:0.855,f1:0.856,auc:0.924,weight:0.30},
  {name:'LightGBM',accuracy:0.871,precision:0.867,recall:0.862,f1:0.864,auc:0.931,weight:0.25},
  {name:'Logistic Regression',accuracy:0.784,precision:0.779,recall:0.771,f1:0.775,auc:0.863,weight:0.10},
];

const FEATURES = [
  {name:'GHG Intensity',importance:0.187,category:'Climate',type:'continuous'},
  {name:'Disclosure Score',importance:0.163,category:'Governance',type:'continuous'},
  {name:'ESG Score',importance:0.148,category:'ESG',type:'continuous'},
  {name:'Taxonomy Alignment',importance:0.121,category:'Regulatory',type:'continuous'},
  {name:'Supply Chain Risk',importance:0.098,category:'Social',type:'continuous'},
  {name:'Sentiment Score',importance:0.087,category:'Market',type:'continuous'},
  {name:'Board Diversity',importance:0.074,category:'Governance',type:'continuous'},
  {name:'Water Stress',importance:0.068,category:'Environment',type:'continuous'},
  {name:'SBTi Status',importance:0.051,category:'Climate',type:'binary'},
  {name:'Controversy Count',importance:0.048,category:'Governance',type:'integer'},
  {name:'Debt Ratio',importance:0.041,category:'Financial',type:'continuous'},
  {name:'Revenue',importance:0.038,category:'Financial',type:'continuous'},
  {name:'Audit Quality',importance:0.036,category:'Governance',type:'continuous'},
  {name:'Biodiversity Exposure',importance:0.029,category:'Environment',type:'continuous'},
  {name:'Analyst Materiality',importance:0.027,category:'Market',type:'continuous'},
];

const DRIFT_LOG = Array.from({length:12},(_,i)=>({
  month:`2025-${String(i+1).padStart(2,'0')}`,
  psi_ghg:0.05+sr(i*7)*0.15,
  psi_esg:0.03+sr(i*11)*0.12,
  psi_disclosure:0.04+sr(i*13)*0.10,
  psi_sentiment:0.08+sr(i*17)*0.20,
  concept_drift:sr(i*19)*0.3,
  triggered:sr(i*23)>0.75,
}));

const RETRAINING_LOG = Array.from({length:8},(_,i)=>({
  id:i+1,
  date:`2025-${String(Math.floor(i*1.5)+1).padStart(2,'0')}-15`,
  trigger:['PSI breach','Concept drift','Scheduled','Data refresh','Manual','PSI breach','Concept drift','Scheduled'][i],
  accuracy_before:0.78+sr(i*7)*0.08,
  accuracy_after:0.83+sr(i*11)*0.06,
  samples_added:Math.floor(500+sr(i*13)*2000),
  duration_min:Math.floor(15+sr(i*17)*45),
}));

const TABS = ['Overview','LDA Topics','K-Means Clusters','Classification','Anomaly Detection','Feature Importance','Threshold Opt.','Double Materiality','Ensemble Voting','Risk Trajectory','Sector Benchmarks','Transfer Learning','Model Drift','Interpretability'];

const pill=(label,color='#1b3a5c')=>(<span style={{background:color+'18',color,border:`1px solid ${color}40`,borderRadius:4,padding:'2px 8px',fontSize:11,fontFamily:T.mono,fontWeight:600}}>{label}</span>);
const KpiCard=({label,value,sub,color=T.navy})=>(<div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:'14px 18px',minWidth:130}}><div style={{fontSize:11,color:T.textMut,fontFamily:T.mono,marginBottom:4}}>{label}</div><div style={{fontSize:22,fontWeight:700,color,fontFamily:T.mono}}>{value}</div>{sub&&<div style={{fontSize:10,color:T.textMut,marginTop:2}}>{sub}</div>}</div>);
const Section=({title,children})=>(<div style={{marginBottom:28}}><div style={{fontSize:13,fontWeight:700,color:T.navy,borderBottom:`2px solid ${T.gold}`,paddingBottom:6,marginBottom:14,fontFamily:T.mono,letterSpacing:'0.04em'}}>{title}</div>{children}</div>);

const clusterAssign = (entity, k) => {
  const seeds = [hashStr(entity.id+'cluster'), hashStr(entity.sector+'k'+k)];
  return Math.floor(sr(seeds[0]*7+k) * k);
};

export default function DmeMlMaterialityPage() {
  const [tab, setTab] = useState(0);
  const [selectedEntity, setSelectedEntity] = useState('E01');
  const [clusterK, setClusterK] = useState(5);
  const [anomalyThreshold, setAnomalyThreshold] = useState(0.5);
  const [materialityThreshold, setMaterialityThreshold] = useState(50);
  const [sectorFilter, setSectorFilter] = useState('All');
  const [ensembleWeights, setEnsembleWeights] = useState({RF:0.35,GBM:0.30,LGBM:0.25,LR:0.10});

  const filteredEntities = useMemo(()=>sectorFilter==='All'?ENTITIES:ENTITIES.filter(e=>e.sector===sectorFilter),[sectorFilter]);

  const entityAssignments = useMemo(()=>ENTITIES.map(e=>({...e,cluster:clusterAssign(e,clusterK)})),[clusterK]);

  const clusterStats = useMemo(()=>{
    return Array.from({length:clusterK},(_,ci)=>{
      const members = entityAssignments.filter(e=>e.cluster===ci);
      const n = members.length || 1;
      const avgMat = members.reduce((s,e)=>s+e.ml_materiality,0)/n;
      const avgEsg = members.reduce((s,e)=>s+e.esg_score,0)/n;
      const sse = members.reduce((s,e)=>s+(e.ml_materiality-avgMat)**2,0);
      return {id:ci,count:members.length,avgMat,avgEsg,sse,color:CLUSTERS[ci%5].color,name:CLUSTERS[ci%5].name};
    });
  },[entityAssignments,clusterK]);

  const ldaDocTopics = useMemo(()=>ENTITIES.map(e=>{
    const h = hashStr(e.id+'lda');
    const raw = LDA_TOPICS.map((_,ti)=>sr(h*7+ti*13));
    const sum = raw.reduce((a,b)=>a+b,0)||1;
    return {id:e.id,name:e.name,topics:raw.map(v=>+(v/sum*100).toFixed(1))};
  }),[]);

  const anomalyFlagged = useMemo(()=>ENTITIES.filter(e=>Math.abs(e.anomaly_score)>anomalyThreshold),[anomalyThreshold]);

  const confusionMatrix = useMemo(()=>{
    const classes = ['High','Medium','Low'];
    const mat = [[0,0,0],[0,0,0],[0,0,0]];
    ENTITIES.forEach(e=>{
      const trueClass = e.ml_materiality>66?0:e.ml_materiality>33?1:2;
      const h = hashStr(e.id+'conf');
      const noise = sr(h*7);
      const predClass = noise>0.85?(trueClass+1)%3:trueClass;
      mat[trueClass][predClass]++;
    });
    return {mat,classes};
  },[]);

  const thresholdCurve = useMemo(()=>Array.from({length:20},(_,i)=>{
    const t = i*5;
    const positives = ENTITIES.filter(e=>e.ml_materiality>t).length;
    const total = ENTITIES.length||1;
    const tp = ENTITIES.filter(e=>e.ml_materiality>t&&e.analyst_materiality>50).length;
    const fp = positives-tp;
    const fn = ENTITIES.filter(e=>e.ml_materiality<=t&&e.analyst_materiality>50).length;
    const precision = positives>0?tp/positives:1;
    const recall = (tp+fn)>0?tp/(tp+fn):0;
    const f1 = (precision+recall)>0?2*precision*recall/(precision+recall):0;
    return {threshold:t,precision:+precision.toFixed(3),recall:+recall.toFixed(3),f1:+f1.toFixed(3),fpr:+(fp/total).toFixed(3)};
  }),[]);

  const doubleMatTopics = useMemo(()=>LDA_TOPICS.flatMap((t,ti)=>Array.from({length:4},(_,j)=>{
    const h = hashStr(t.name+j);
    return {name:`${t.name.slice(0,12)} ${j+1}`,inside_out:20+sr(h*7)*75,outside_in:15+sr(h*11)*80,size:8+sr(h*13)*20,topic:ti};
  })),[]);

  const trajectoryData = useMemo(()=>{
    const entity = ENTITIES.find(e=>e.id===selectedEntity)||ENTITIES[0];
    const h = hashStr(entity.id+'traj');
    return Array.from({length:24},(_,q)=>{
      const base = entity.ml_materiality;
      const trend = sr(h*7+q)*20-10;
      const score = Math.max(0,Math.min(100,base+trend));
      return {quarter:`Q${(q%4)+1}'${22+Math.floor(q/4)}`,score:+score.toFixed(1),upper:+Math.min(100,score+sr(h*11+q)*8).toFixed(1),lower:+Math.max(0,score-sr(h*13+q)*8).toFixed(1)};
    });
  },[selectedEntity]);

  const sectorBenchmarks = useMemo(()=>SECTORS.map(sec=>{
    const members = ENTITIES.filter(e=>e.sector===sec);
    const scores = [...members.map(e=>e.ml_materiality)].sort((a,b)=>a-b);
    const n = scores.length||1;
    const avg = scores.reduce((s,v)=>s+v,0)/n;
    const p25 = scores[Math.floor(n*0.25)]||0;
    const p75 = scores[Math.floor(n*0.75)]||0;
    const p95 = scores[Math.floor(n*0.95)]||0;
    return {sector:sec,avg:+avg.toFixed(1),p25:+p25.toFixed(1),p75:+p75.toFixed(1),p95:+p95.toFixed(1),count:members.length};
  }),[]);

  const transferData = useMemo(()=>SECTORS.map((sec,si)=>{
    const h = hashStr(sec+'transfer');
    return {sector:sec,baseline:+(0.72+sr(h*7)*0.08).toFixed(3),fine_tuned:+(0.82+sr(h*11)*0.08).toFixed(3),samples:Math.floor(100+sr(h*13)*900)};
  }),[]);

  const ensembleVoting = useMemo(()=>ENTITIES.slice(0,10).map(e=>{
    const h = hashStr(e.id+'ensemble');
    const rf = e.ml_materiality>60?'High':e.ml_materiality>35?'Medium':'Low';
    const gbm = sr(h*7)>0.15?rf:(rf==='High'?'Medium':'Low');
    const lgbm = sr(h*11)>0.12?rf:(rf==='Medium'?'High':rf);
    const lr = sr(h*13)>0.25?rf:(rf==='High'?'Medium':(rf==='Low'?'Medium':rf));
    const votes = [rf,gbm,lgbm,lr];
    const agree = votes.every(v=>v===votes[0]);
    const majority=[...votes].sort((a,b)=>votes.filter(v=>v===b).length-votes.filter(v=>v===a).length)[0];
    return {id:e.id,name:e.name,rf,gbm,lgbm,lr,majority,agree};
  }),[]);

  const limeExplanations = useMemo(()=>{
    const targets = ENTITIES.slice(0,5);
    return targets.map(e=>{
      const h = hashStr(e.id+'lime');
      const contribs = FEATURES.slice(0,8).map((f,fi)=>({
        feature:f.name,
        contribution:(sr(h*7+fi)*2-1)*f.importance*40,
        value:fi===0?e.ghg_intensity.toFixed(0):fi===1?e.disclosure_score.toFixed(0):fi===2?e.esg_score.toFixed(0):'—',
      }));
      const counterfactual = contribs.filter(c=>c.contribution<0).map(c=>`Increase ${c.feature}`).slice(0,2).join(', ')||'None needed';
      return {id:e.id,name:e.name,label:e.ml_materiality>66?'High':e.ml_materiality>33?'Medium':'Low',score:e.ml_materiality.toFixed(1),contribs,counterfactual};
    });
  },[]);

  // Full entity ML score table with all 15 features
  const fullEntityTable = useMemo(()=>
    [...ENTITIES].sort((a,b)=>b.ml_materiality-a.ml_materiality)
  ,[]);

  // Materiality regime classification per entity
  const regimeClassify = (score, velocity) => {
    if(score>75&&velocity>0) return {label:'Escalating High',color:T.red};
    if(score>66) return {label:'High Risk',color:T.red};
    if(score>50&&velocity>2) return {label:'Emerging Risk',color:'#ea580c'};
    if(score>33) return {label:'Watch',color:T.amber};
    return {label:'Managed',color:T.green};
  };

  // Silhouette scores per entity (approximation)
  const silhouetteScores = useMemo(()=>entityAssignments.map(e=>{
    const h = hashStr(e.id+'sil'+clusterK);
    const a = sr(h*7)*0.4+0.1;
    const b = sr(h*11)*0.5+0.3;
    const sil = (b-a)/Math.max(0.0001,Math.max(a,b));
    return {id:e.id,name:e.name,cluster:e.cluster,silhouette:+sil.toFixed(3)};
  }),[entityAssignments,clusterK]);

  const avgSilhouette = silhouetteScores.length
    ? +(silhouetteScores.reduce((s,e)=>s+e.silhouette,0)/silhouetteScores.length).toFixed(3)
    : 0;

  // Feature interaction heatmap data
  const featureInteraction = useMemo(()=>{
    const top5 = FEATURES.slice(0,5);
    return top5.map((fi,ri)=>({
      feature:fi.name,
      ...Object.fromEntries(top5.map((fj,ci)=>{
        const h = hashStr(fi.name+'x'+fj.name+'interact');
        return [fj.name,ri===ci?fi.importance:+(sr(h*7)*fi.importance*fj.importance*20).toFixed(4)];
      }))
    }));
  },[]);

  // Gibbs-sample style topic word probabilities
  const topicWordMatrix = useMemo(()=>LDA_TOPICS.map(t=>{
    const h = hashStr(t.name+'wm');
    return {
      topic:t.name.slice(0,14),
      words:t.words.map((w,wi)=>({word:w,prob:+(sr(h*7+wi*13)*0.3+0.05).toFixed(3)}))
    };
  }),[]);

  // Sector-level average anomaly rates
  const sectorAnomalyRates = useMemo(()=>SECTORS.map(sec=>{
    const members = ENTITIES.filter(e=>e.sector===sec);
    const n = members.length||1;
    const flagged = members.filter(e=>Math.abs(e.anomaly_score)>anomalyThreshold).length;
    return {sector:sec,rate:+(flagged/n*100).toFixed(1),count:flagged,total:members.length};
  }),[anomalyThreshold]);

  // Per-entity model disagreement investigaton queue
  const disagreementQueue = useMemo(()=>{
    return ENTITIES.map(e=>{
      const h = hashStr(e.id+'disagree');
      const rf = e.ml_materiality>60?'High':e.ml_materiality>35?'Medium':'Low';
      const gbm = sr(h*7)>0.15?rf:(rf==='High'?'Medium':'Low');
      const lgbm = sr(h*11)>0.12?rf:(rf==='Medium'?'High':rf);
      const lr = sr(h*13)>0.25?rf:(rf==='High'?'Medium':(rf==='Low'?'Medium':rf));
      const votes = [rf,gbm,lgbm,lr];
      const uniqueVotes = new Set(votes).size;
      const agree = uniqueVotes===1;
      const priority = !agree&&(votes.filter(v=>v==='High').length>0)?'High Priority':!agree?'Medium Priority':'Aligned';
      return {...e,rf,gbm,lgbm,lr,agree,priority};
    }).filter(e=>!e.agree);
  },[]);

  // Materiality trajectory velocity for all entities (last 4 quarters delta)
  const velocityData = useMemo(()=>ENTITIES.map(e=>{
    const h = hashStr(e.id+'vel');
    const q1 = e.ml_materiality + sr(h*7)*20-10;
    const q0 = e.ml_materiality + sr(h*11)*20-10;
    return {id:e.id,name:e.name,sector:e.sector,current:+e.ml_materiality.toFixed(1),velocity:+(q1-q0).toFixed(2),trend:q1>q0?'Rising':'Falling'};
  }),[]);

  // ROC curve data
  const rocCurve = useMemo(()=>Array.from({length:21},(_,i)=>{
    const t = i/20;
    const h = hashStr(`roc_${i}`);
    const tpr = Math.min(1,t+sr(h*7)*0.2+0.1);
    const fpr = Math.max(0,t-sr(h*11)*0.3+0.05);
    return {fpr:+fpr.toFixed(3),tpr:+tpr.toFixed(3)};
  }).sort((a,b)=>a.fpr-b.fpr),[]);

  // PSI per feature heatmap
  const psiHeatmap = useMemo(()=>FEATURES.slice(0,8).map(f=>({
    feature:f.name,
    ...Object.fromEntries(DRIFT_LOG.slice(0,6).map(d=>([d.month,+(sr(hashStr(f.name+d.month)*7)*0.25).toFixed(3)])))
  })),[]);

  const clusterColors = ['#dc2626','#16a34a','#d97706','#7c3aed','#0891b2','#db2777','#ea580c','#65a30d'];

  const labelColor = (label) => label==='High'?T.red:label==='Medium'?T.amber:T.green;

  const s = {
    page:{minHeight:'100vh',background:T.bg,fontFamily:T.font,color:T.text,padding:'0 0 40px'},
    header:{background:T.navy,padding:'18px 32px',borderBottom:`3px solid ${T.gold}`},
    headerTitle:{color:'#fff',fontSize:20,fontWeight:700,letterSpacing:'0.02em'},
    headerSub:{color:T.goldL,fontSize:12,fontFamily:T.mono,marginTop:2},
    body:{padding:'0 32px'},
    tabBar:{display:'flex',gap:0,overflowX:'auto',background:T.surface,borderBottom:`1px solid ${T.border}`,paddingLeft:32},
    tabBtn:(active)=>({padding:'10px 16px',border:'none',borderBottom:active?`2px solid ${T.gold}`:'2px solid transparent',background:'none',color:active?T.navy:T.textMut,fontFamily:T.font,fontSize:12,fontWeight:active?700:400,cursor:'pointer',whiteSpace:'nowrap'}),
    kpiRow:{display:'flex',gap:12,flexWrap:'wrap',padding:'20px 0 8px'},
    table:{width:'100%',borderCollapse:'collapse',fontSize:12},
    th:{background:T.surfaceH,padding:'8px 10px',textAlign:'left',fontWeight:600,color:T.navy,borderBottom:`1px solid ${T.border}`,fontFamily:T.mono,fontSize:11},
    td:{padding:'7px 10px',borderBottom:`1px solid ${T.border}`,color:T.textSec},
    card:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:18,marginBottom:16},
  };

  const totalAnomalies = anomalyFlagged.length;
  const avgMlScore = ENTITIES.length?+(ENTITIES.reduce((s,e)=>s+e.ml_materiality,0)/ENTITIES.length).toFixed(1):0;
  const ensembleAcc = +(MODELS.reduce((s,m)=>s+m.accuracy*m.weight,0)).toFixed(3);

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div>
            <div style={s.headerTitle}>DME Risk Intelligence › ML Materiality Engine</div>
            <div style={s.headerSub}>Dynamic Materiality Scoring · LDA · K-Means · Random Forest · Anomaly Detection · SHAP</div>
          </div>
          <div style={{marginLeft:'auto',display:'flex',gap:8,alignItems:'center'}}>
            {pill('EP-U10','#c5a96a')}
            {pill('ML-DRIVEN','#5a8a6a')}
            {pill('40 ENTITIES','#2c5a8c')}
          </div>
        </div>
      </div>

      <div style={s.kpiRow.padding?s.kpiRow:{...s.kpiRow,padding:'20px 32px 8px'}}>
        <div style={{display:'flex',gap:12,flexWrap:'wrap',padding:'20px 32px 0'}}>
          <KpiCard label="ENTITIES SCORED" value={ENTITIES.length} sub="40 companies" />
          <KpiCard label="ENSEMBLE ACCURACY" value={`${(ensembleAcc*100).toFixed(1)}%`} sub="Weighted avg" color={T.green} />
          <KpiCard label="TOPICS MODELLED" value={LDA_TOPICS.length} sub="LDA topics" color={T.navyL} />
          <KpiCard label="CLUSTER COUNT" value={clusterK} sub="K-Means k" color={T.amber} />
          <KpiCard label="ANOMALIES DETECTED" value={totalAnomalies} sub={`Threshold: ${anomalyThreshold.toFixed(2)}`} color={T.red} />
          <KpiCard label="AVG MATERIALITY" value={avgMlScore} sub="ML score /100" color={T.sage} />
          <KpiCard label="FEATURE COUNT" value={FEATURES.length} sub="Input dimensions" color={T.gold} />
        </div>
      </div>

      <div style={s.tabBar}>
        {TABS.map((t,i)=><button key={i} style={s.tabBtn(tab===i)} onClick={()=>setTab(i)}>{t}</button>)}
      </div>

      <div style={{padding:'24px 32px'}}>

        {tab===0&&(
          <div>
            <div style={{display:'flex',gap:16,marginBottom:8,flexWrap:'wrap'}}>
              <div style={{flex:'1 1 280px'}}>
                <Section title="PORTFOLIO MATERIALITY DISTRIBUTION">
                  <div style={s.card}>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={Array.from({length:10},(_,i)=>({range:`${i*10}-${i*10+10}`,count:ENTITIES.filter(e=>e.ml_materiality>=i*10&&e.ml_materiality<i*10+10).length}))}>
                        <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                        <XAxis dataKey="range" tick={{fontSize:10}} />
                        <YAxis tick={{fontSize:10}} />
                        <Tooltip />
                        <Bar dataKey="count" fill={T.navyL} radius={[3,3,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Section>
              </div>
              <div style={{flex:'1 1 280px'}}>
                <Section title="MODEL ENSEMBLE PERFORMANCE">
                  <div style={s.card}>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={MODELS} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                        <XAxis type="number" domain={[0.7,1]} tick={{fontSize:10}} />
                        <YAxis dataKey="name" type="category" tick={{fontSize:10}} width={110} />
                        <Tooltip formatter={v=>(v*100).toFixed(1)+'%'} />
                        <Bar dataKey="accuracy" fill={T.gold} radius={[0,3,3,0]} name="Accuracy" />
                        <Bar dataKey="auc" fill={T.sage} radius={[0,3,3,0]} name="AUC" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Section>
              </div>
            </div>
            <Section title="TOP-10 ENTITIES BY ML MATERIALITY SCORE">
              <div style={s.card}>
                <table style={s.table}>
                  <thead><tr><th style={s.th}>Entity</th><th style={s.th}>Sector</th><th style={s.th}>Region</th><th style={s.th}>ML Score</th><th style={s.th}>ESG Score</th><th style={s.th}>GHG Intensity</th><th style={s.th}>Disclosure</th><th style={s.th}>Regime</th><th style={s.th}>Anomaly</th></tr></thead>
                  <tbody>
                    {[...ENTITIES].sort((a,b)=>b.ml_materiality-a.ml_materiality).slice(0,10).map(e=>{
                      const h=hashStr(e.id+'vel2');
                      const vel=sr(h*7)*20-10;
                      const regime=regimeClassify(e.ml_materiality,vel);
                      return (
                        <tr key={e.id} style={{cursor:'pointer'}} onClick={()=>{setSelectedEntity(e.id);setTab(9);}}>
                          <td style={s.td}><span style={{fontFamily:T.mono,fontWeight:700,color:T.navy}}>{e.id}</span> {e.name}</td>
                          <td style={s.td}>{e.sector}</td>
                          <td style={s.td}>{e.region}</td>
                          <td style={s.td}><span style={{fontFamily:T.mono,fontWeight:700,color:e.ml_materiality>66?T.red:e.ml_materiality>33?T.amber:T.green}}>{e.ml_materiality.toFixed(1)}</span></td>
                          <td style={{...s.td,fontFamily:T.mono}}>{e.esg_score.toFixed(1)}</td>
                          <td style={{...s.td,fontFamily:T.mono,color:e.ghg_intensity>250?T.red:T.textSec}}>{e.ghg_intensity.toFixed(0)}</td>
                          <td style={{...s.td,fontFamily:T.mono,color:e.disclosure_score<40?T.amber:T.green}}>{e.disclosure_score.toFixed(0)}%</td>
                          <td style={s.td}>{pill(regime.label,regime.color)}</td>
                          <td style={s.td}>{pill(Math.abs(e.anomaly_score)>anomalyThreshold?'OUTLIER':'Normal',Math.abs(e.anomaly_score)>anomalyThreshold?T.red:T.sage)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Section>
            <Section title="FULL ENTITY REGISTER — ALL 40 COMPANIES">
              <div style={s.card}>
                <table style={s.table}>
                  <thead><tr><th style={s.th}>ID</th><th style={s.th}>Name</th><th style={s.th}>Sector</th><th style={s.th}>Region</th><th style={s.th}>ML Score</th><th style={s.th}>ESG</th><th style={s.th}>GHG</th><th style={s.th}>Disclosure</th><th style={s.th}>SBTi</th><th style={s.th}>Taxonomy %</th><th style={s.th}>Sentiment</th><th style={s.th}>Board Div.</th></tr></thead>
                  <tbody>
                    {fullEntityTable.map(e=>(
                      <tr key={e.id} style={{cursor:'pointer'}} onClick={()=>{setSelectedEntity(e.id);setTab(9);}}>
                        <td style={{...s.td,fontFamily:T.mono,fontWeight:700,color:T.navy}}>{e.id}</td>
                        <td style={s.td}>{e.name}</td>
                        <td style={s.td}><span style={{fontSize:10,color:T.textMut}}>{e.sector}</span></td>
                        <td style={s.td}><span style={{fontSize:10,color:T.textMut}}>{e.region}</span></td>
                        <td style={{...s.td,fontFamily:T.mono,fontWeight:700,color:e.ml_materiality>66?T.red:e.ml_materiality>33?T.amber:T.green}}>{e.ml_materiality.toFixed(1)}</td>
                        <td style={{...s.td,fontFamily:T.mono}}>{e.esg_score.toFixed(1)}</td>
                        <td style={{...s.td,fontFamily:T.mono,color:e.ghg_intensity>250?T.red:T.textSec}}>{e.ghg_intensity.toFixed(0)}</td>
                        <td style={{...s.td,fontFamily:T.mono}}>{e.disclosure_score.toFixed(0)}%</td>
                        <td style={s.td}>{e.sbti_status?pill('YES',T.green):pill('NO',T.textMut)}</td>
                        <td style={{...s.td,fontFamily:T.mono}}>{e.taxonomy_alignment.toFixed(0)}%</td>
                        <td style={{...s.td,fontFamily:T.mono,color:e.sentiment_score>0?T.green:T.red}}>{e.sentiment_score>0?'+':''}{e.sentiment_score.toFixed(2)}</td>
                        <td style={{...s.td,fontFamily:T.mono}}>{(e.board_diversity*100).toFixed(0)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
            <Section title="SCORE VELOCITY — RISING vs FALLING ENTITIES">
              <div style={s.card}>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={[...velocityData].sort((a,b)=>b.velocity-a.velocity).slice(0,20)}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="id" tick={{fontSize:9}} />
                    <YAxis tick={{fontSize:10}} />
                    <Tooltip formatter={v=>v.toFixed(2)} />
                    <ReferenceLine y={0} stroke={T.border} />
                    <Bar dataKey="velocity" name="Score Velocity" radius={[2,2,0,0]}>
                      {[...velocityData].sort((a,b)=>b.velocity-a.velocity).slice(0,20).map((d,i)=><Cell key={i} fill={d.velocity>0?T.red:T.green} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Section>
            <Section title="PORTFOLIO RISK SUMMARY PANEL">
              <div style={s.card}>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16}}>
                  {[
                    {title:'High Risk Entities',value:ENTITIES.filter(e=>e.ml_materiality>66).length,total:40,color:T.red,desc:'ML score > 66'},
                    {title:'Watch List',value:ENTITIES.filter(e=>e.ml_materiality>33&&e.ml_materiality<=66).length,total:40,color:T.amber,desc:'ML score 33–66'},
                    {title:'Managed / Low Risk',value:ENTITIES.filter(e=>e.ml_materiality<=33).length,total:40,color:T.green,desc:'ML score ≤ 33'},
                    {title:'With SBTi Commitment',value:ENTITIES.filter(e=>e.sbti_status===1).length,total:40,color:T.sage,desc:'Confirmed targets'},
                    {title:'Disclosure Leaders',value:ENTITIES.filter(e=>e.disclosure_score>75).length,total:40,color:T.navyL,desc:'Score > 75%'},
                    {title:'High GHG Intensity',value:ENTITIES.filter(e=>e.ghg_intensity>250).length,total:40,color:'#ea580c',desc:'> 250 tCO2e/$M'},
                  ].map(item=>(
                    <div key={item.title} style={{background:T.surfaceH,borderRadius:8,padding:14,borderLeft:`4px solid ${item.color}`}}>
                      <div style={{fontSize:11,color:T.textMut,marginBottom:4}}>{item.title}</div>
                      <div style={{fontSize:24,fontWeight:700,color:item.color,fontFamily:T.mono}}>{item.value}<span style={{fontSize:13,color:T.textMut}}>/{item.total}</span></div>
                      <div style={{marginTop:6,background:T.border,borderRadius:2,height:4}}>
                        <div style={{width:`${(item.value/item.total*100).toFixed(0)}%`,height:'100%',background:item.color,borderRadius:2}} />
                      </div>
                      <div style={{fontSize:10,color:T.textMut,marginTop:4}}>{item.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Section>
          </div>
        )}

        {tab===1&&(
          <div>
            <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:16}}>
              <KpiCard label="TOPICS" value={LDA_TOPICS.length} sub="LDA topics extracted" />
              <KpiCard label="VOCAB SIZE" value="64" sub="Unique terms" color={T.navyL} />
              <KpiCard label="AVG COHERENCE" value={(LDA_TOPICS.reduce((s,t)=>s+t.coherence,0)/LDA_TOPICS.length).toFixed(3)} sub="PMI-style" color={T.gold} />
              <KpiCard label="TOP TOPIC" value={[...LDA_TOPICS].sort((a,b)=>b.coherence-a.coherence)[0]?.name.slice(0,14)||''} sub="Highest coherence" color={T.sage} />
              <KpiCard label="ENTITIES" value={ENTITIES.length} sub="Documents modeled" color={T.amber} />
              <KpiCard label="ITERATIONS" value="500" sub="Gibbs sampling" color={T.textSec} />
            </div>
            <Section title="LDA TOPIC MODELING — 8 TOPICS ACROSS 40 ENTITIES">
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:12,marginBottom:16}}>
                {LDA_TOPICS.map(t=>(
                  <div key={t.id} style={{...s.card,borderLeft:`4px solid ${T.gold}`,padding:14}}>
                    <div style={{fontWeight:700,color:T.navy,marginBottom:4,fontSize:13}}>{t.name}</div>
                    <div style={{fontSize:11,color:T.textMut,marginBottom:6,fontFamily:T.mono}}>Coherence (PMI): {t.coherence.toFixed(2)}</div>
                    <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                      {t.words.map(w=><span key={w} style={{background:T.surfaceH,border:`1px solid ${T.border}`,borderRadius:3,padding:'1px 6px',fontSize:10,color:T.navy,fontFamily:T.mono}}>{w}</span>)}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
            <Section title="DOCUMENT-TOPIC MATRIX (TOP 15 ENTITIES)">
              <div style={s.card}>
                <table style={s.table}>
                  <thead><tr><th style={s.th}>Entity</th>{LDA_TOPICS.map(t=><th key={t.id} style={s.th}>{t.name.slice(0,12)}</th>)}</tr></thead>
                  <tbody>
                    {ldaDocTopics.slice(0,15).map(d=>(
                      <tr key={d.id}>
                        <td style={{...s.td,fontFamily:T.mono,fontWeight:700,color:T.navy}}>{d.id}</td>
                        {d.topics.map((v,ti)=>(
                          <td key={ti} style={{...s.td,background:`${T.navyL}${Math.floor(v/100*160).toString(16).padStart(2,'0')}`,color:v>50?'#fff':T.text,fontFamily:T.mono,textAlign:'center'}}>{v.toFixed(0)}%</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
            <Section title="TOPIC COHERENCE SCORES">
              <div style={s.card}>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={LDA_TOPICS} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis type="number" domain={[0,1]} tick={{fontSize:10}} />
                    <YAxis dataKey="name" type="category" width={160} tick={{fontSize:10}} />
                    <Tooltip formatter={v=>v.toFixed(3)} />
                    <Bar dataKey="coherence" fill={T.gold} radius={[0,4,4,0]} name="PMI Coherence" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Section>
            <Section title="TOPIC-WORD PROBABILITY MATRIX (GIBBS-SAMPLE STYLE)">
              <div style={s.card}>
                <div style={{overflowX:'auto'}}>
                  <table style={s.table}>
                    <thead>
                      <tr>
                        <th style={s.th}>Topic</th>
                        {topicWordMatrix[0]&&topicWordMatrix[0].words.map(w=><th key={w.word} style={s.th}>{w.word}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {topicWordMatrix.map(t=>(
                        <tr key={t.topic}>
                          <td style={{...s.td,fontFamily:T.mono,fontWeight:700,color:T.navy,whiteSpace:'nowrap'}}>{t.topic}</td>
                          {t.words.map(w=>{
                            const intensity = Math.floor(w.prob/0.35*200);
                            return (
                              <td key={w.word} style={{...s.td,textAlign:'center',fontFamily:T.mono,fontSize:10,background:`rgba(197,169,106,${w.prob/0.35*0.6})`,color:w.prob>0.2?T.navy:T.textSec}}>{w.prob.toFixed(3)}</td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{marginTop:8,fontSize:11,color:T.textMut,fontFamily:T.mono}}>Cell values = P(word|topic) — higher values indicate stronger topic-word association. Seed: Gibbs-style sr() PRNG.</div>
              </div>
            </Section>
          </div>
        )}

        {tab===2&&(
          <div>
            <div style={{display:'flex',gap:16,alignItems:'center',marginBottom:16}}>
              <label style={{fontFamily:T.mono,fontSize:12,color:T.navy}}>Cluster count (k):</label>
              <input type="range" min={2} max={8} value={clusterK} onChange={e=>setClusterK(+e.target.value)} style={{width:160}} />
              <span style={{fontFamily:T.mono,fontWeight:700,color:T.gold}}>{clusterK}</span>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
              <Section title="CLUSTER SCATTER (PCA 2D PROJECTION)">
                <div style={s.card}>
                  <ResponsiveContainer width="100%" height={280}>
                    <ScatterChart>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="esg_score" name="ESG Score" tick={{fontSize:10}} label={{value:'ESG Score',position:'bottom',fontSize:10}} />
                      <YAxis dataKey="ml_materiality" name="ML Materiality" tick={{fontSize:10}} label={{value:'ML Materiality',angle:-90,position:'left',fontSize:10}} />
                      <Tooltip cursor={{strokeDasharray:'3 3'}} content={({payload})=>{
                        if(!payload||!payload[0]) return null;
                        const d=payload[0].payload;
                        return <div style={{background:T.surface,border:`1px solid ${T.border}`,padding:8,borderRadius:4,fontSize:11}}><div style={{fontWeight:700}}>{d.name}</div><div>ESG: {d.esg_score.toFixed(1)}</div><div>ML Score: {d.ml_materiality.toFixed(1)}</div><div>Cluster: {d.cluster}</div></div>;
                      }} />
                      {Array.from({length:clusterK},(_,ci)=>(
                        <Scatter key={ci} data={entityAssignments.filter(e=>e.cluster===ci)} fill={clusterColors[ci%8]} name={`Cluster ${ci}`} />
                      ))}
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </Section>
              <Section title="CLUSTER STATISTICS">
                <div style={s.card}>
                  <table style={s.table}>
                    <thead><tr><th style={s.th}>Cluster</th><th style={s.th}>Entities</th><th style={s.th}>Avg ML Score</th><th style={s.th}>Avg ESG</th><th style={s.th}>SSE</th></tr></thead>
                    <tbody>
                      {clusterStats.map(c=>(
                        <tr key={c.id}>
                          <td style={s.td}><span style={{color:c.color,fontWeight:700,fontFamily:T.mono}}>C{c.id}</span> {c.name}</td>
                          <td style={{...s.td,fontFamily:T.mono}}>{c.count}</td>
                          <td style={{...s.td,fontFamily:T.mono,color:c.avgMat>66?T.red:c.avgMat>33?T.amber:T.green}}>{c.avgMat.toFixed(1)}</td>
                          <td style={{...s.td,fontFamily:T.mono}}>{c.avgEsg.toFixed(1)}</td>
                          <td style={{...s.td,fontFamily:T.mono}}>{c.sse.toFixed(0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Section>
            </div>
            <Section title="CLUSTER PROFILE RADAR">
              <div style={s.card}>
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={[{axis:'ESG'},{axis:'GHG'},{axis:'Disclosure'},{axis:'Supply Chain'},{axis:'Sentiment'}]}>
                    <PolarGrid stroke={T.border} />
                    <PolarAngleAxis dataKey="axis" tick={{fontSize:10}} />
                    <PolarRadiusAxis tick={{fontSize:8}} />
                    {clusterStats.slice(0,3).map(c=>(
                      <Radar key={c.id} name={c.name} dataKey={`val_${c.id}`} stroke={c.color} fill={c.color} fillOpacity={0.15} />
                    ))}
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </Section>
            <Section title={`SILHOUETTE SCORES BY ENTITY (Avg: ${avgSilhouette})`}>
              <div style={s.card}>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={[...silhouetteScores].sort((a,b)=>b.silhouette-a.silhouette)}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="id" tick={{fontSize:8}} interval={2} />
                    <YAxis domain={[-1,1]} tick={{fontSize:10}} />
                    <Tooltip formatter={v=>v.toFixed(3)} />
                    <ReferenceLine y={0} stroke={T.border} />
                    <ReferenceLine y={avgSilhouette} stroke={T.gold} strokeDasharray="4 4" label={{value:'Avg',fontSize:9,fill:T.gold}} />
                    <Bar dataKey="silhouette" name="Silhouette" radius={[2,2,0,0]}>
                      {[...silhouetteScores].sort((a,b)=>b.silhouette-a.silhouette).map((d,i)=><Cell key={i} fill={d.silhouette>0.5?T.green:d.silhouette>0?T.sage:T.red} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div style={{marginTop:8,fontSize:11,color:T.textMut}}>Silhouette score &gt; 0.5: well-separated · 0–0.5: overlapping · &lt; 0: misclassified. Average: {avgSilhouette}</div>
              </div>
            </Section>
            <Section title="WITHIN-CLUSTER SSE BY K VALUE">
              <div style={s.card}>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={Array.from({length:7},(_,ki)=>{
                    const k=ki+2;
                    const sse=Array.from({length:k},(_,ci)=>{
                      const members=entityAssignments.filter(e=>e.cluster%k===ci);
                      const n=members.length||1;
                      const avg=members.reduce((s,e)=>s+e.ml_materiality,0)/n;
                      return members.reduce((s,e)=>s+(e.ml_materiality-avg)**2,0);
                    }).reduce((a,b)=>a+b,0);
                    return {k,sse:+sse.toFixed(0)};
                  })}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="k" tick={{fontSize:10}} label={{value:'k (clusters)',position:'bottom',fontSize:10}} />
                    <YAxis tick={{fontSize:10}} />
                    <Tooltip />
                    <ReferenceLine x={clusterK} stroke={T.gold} strokeDasharray="4 4" label={{value:'Current k',fontSize:9,fill:T.gold}} />
                    <Line type="monotone" dataKey="sse" stroke={T.navyL} name="Within-Cluster SSE" dot={{fill:T.navyL}} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
                <div style={{fontSize:11,color:T.textMut,marginTop:4}}>Elbow method: optimal k where SSE reduction rate slows significantly.</div>
              </div>
            </Section>
          </div>
        )}

        {tab===3&&(
          <div>
            <Section title="CONFUSION MATRIX (3-CLASS: HIGH / MEDIUM / LOW)">
              <div style={s.card}>
                <div style={{display:'inline-block'}}>
                  <div style={{display:'grid',gridTemplateColumns:`80px repeat(3,80px)`,gap:2}}>
                    <div />
                    {confusionMatrix.classes.map(c=><div key={c} style={{textAlign:'center',fontFamily:T.mono,fontWeight:700,fontSize:12,color:T.navy,padding:6}}>{c}</div>)}
                    {confusionMatrix.classes.map((trueC,ri)=>[
                      <div key={`r${ri}`} style={{fontFamily:T.mono,fontWeight:700,fontSize:12,color:T.navy,padding:6,display:'flex',alignItems:'center'}}>{trueC}</div>,
                      ...confusionMatrix.mat[ri].map((v,ci)=>(
                        <div key={`${ri}-${ci}`} style={{background:ri===ci?T.sage+'33':T.red+'15',border:`1px solid ${T.border}`,borderRadius:4,padding:12,textAlign:'center',fontFamily:T.mono,fontWeight:700,fontSize:16,color:ri===ci?T.green:T.red}}>{v}</div>
                      ))
                    ])}
                  </div>
                </div>
                <div style={{marginTop:12,fontSize:11,color:T.textMut}}>Rows = True Class · Columns = Predicted Class · Diagonal = Correct predictions</div>
              </div>
            </Section>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
              <Section title="CLASSIFICATION REPORT (PER CLASS)">
                <div style={s.card}>
                  <table style={s.table}>
                    <thead><tr><th style={s.th}>Class</th><th style={s.th}>Precision</th><th style={s.th}>Recall</th><th style={s.th}>F1</th><th style={s.th}>Support</th></tr></thead>
                    <tbody>
                      {MODELS[0]&&['High','Medium','Low'].map((cls,ci)=>{
                        const h=hashStr(cls+'report');
                        return <tr key={cls}><td style={s.td}>{pill(cls,labelColor(cls))}</td><td style={{...s.td,fontFamily:T.mono}}>{(0.78+sr(h*7)*0.15).toFixed(3)}</td><td style={{...s.td,fontFamily:T.mono}}>{(0.76+sr(h*11)*0.15).toFixed(3)}</td><td style={{...s.td,fontFamily:T.mono}}>{(0.77+sr(h*13)*0.15).toFixed(3)}</td><td style={{...s.td,fontFamily:T.mono}}>{Math.floor(10+sr(h*17)*20)}</td></tr>;
                      })}
                    </tbody>
                  </table>
                </div>
              </Section>
              <Section title="MODEL LEARNING CURVE">
                <div style={s.card}>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={Array.from({length:10},(_,i)=>({samples:(i+1)*50,train:+(0.92-sr(i*7)*0.15).toFixed(3),val:+(0.70+sr(i*11)*0.15).toFixed(3)}))}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="samples" tick={{fontSize:10}} label={{value:'Training Samples',position:'bottom',fontSize:10}} />
                      <YAxis domain={[0.5,1]} tick={{fontSize:10}} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="train" stroke={T.navy} name="Train Acc" dot={false} strokeWidth={2} />
                      <Line type="monotone" dataKey="val" stroke={T.gold} name="Val Acc" dot={false} strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Section>
            </div>
            <Section title="RANDOM FOREST FEATURE IMPORTANCE">
              <div style={s.card}>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={[...FEATURES].sort((a,b)=>b.importance-a.importance).slice(0,10)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis type="number" tick={{fontSize:10}} />
                    <YAxis dataKey="name" type="category" width={140} tick={{fontSize:10}} />
                    <Tooltip formatter={v=>v.toFixed(3)} />
                    <Bar dataKey="importance" fill={T.navyL} radius={[0,4,4,0]} name="Importance" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Section>
            <Section title="ROC CURVE (ENSEMBLE MODEL)">
              <div style={s.card}>
                <div style={{display:'flex',gap:16}}>
                  <div style={{flex:1}}>
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={rocCurve}>
                        <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                        <XAxis dataKey="fpr" tick={{fontSize:10}} label={{value:'False Positive Rate',position:'bottom',fontSize:10}} />
                        <YAxis domain={[0,1]} tick={{fontSize:10}} label={{value:'True Positive Rate',angle:-90,position:'left',fontSize:10}} />
                        <Tooltip formatter={v=>v.toFixed(3)} />
                        <ReferenceLine data={[{fpr:0,tpr:0},{fpr:1,tpr:1}]} stroke={T.border} strokeDasharray="4 4" />
                        <Line type="monotone" dataKey="tpr" stroke={T.gold} name="ROC" dot={false} strokeWidth={2.5} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{width:200,display:'flex',flexDirection:'column',gap:12}}>
                    {MODELS.map(m=>(
                      <div key={m.name} style={{background:T.surfaceH,borderRadius:6,padding:10}}>
                        <div style={{fontSize:11,fontWeight:700,color:T.navy,marginBottom:4}}>{m.name}</div>
                        <div style={{fontSize:12,fontFamily:T.mono,color:T.gold}}>AUC: {m.auc.toFixed(3)}</div>
                        <div style={{fontSize:10,color:T.textMut}}>Weight: {(m.weight*100).toFixed(0)}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Section>
          </div>
        )}

        {tab===4&&(
          <div>
            <div style={{display:'flex',gap:16,alignItems:'center',marginBottom:16,flexWrap:'wrap'}}>
              <label style={{fontFamily:T.mono,fontSize:12,color:T.navy}}>Anomaly threshold (|score| &gt;):</label>
              <input type="range" min={0} max={1} step={0.05} value={anomalyThreshold} onChange={e=>setAnomalyThreshold(+e.target.value)} style={{width:160}} />
              <span style={{fontFamily:T.mono,fontWeight:700,color:T.red}}>{anomalyThreshold.toFixed(2)}</span>
              <span style={{fontFamily:T.mono,fontSize:12,color:T.textMut}}>→ {totalAnomalies} flagged</span>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
              <Section title="ISOLATION FOREST SCORE DISTRIBUTION">
                <div style={s.card}>
                  <ResponsiveContainer width="100%" height={240}>
                    <ScatterChart>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="ml_materiality" name="ML Materiality" tick={{fontSize:10}} />
                      <YAxis dataKey="anomaly_score" name="Anomaly Score" tick={{fontSize:10}} />
                      <ReferenceLine y={anomalyThreshold} stroke={T.red} strokeDasharray="4 4" label={{value:'Threshold',fontSize:9,fill:T.red}} />
                      <ReferenceLine y={-anomalyThreshold} stroke={T.red} strokeDasharray="4 4" />
                      <Tooltip content={({payload})=>{if(!payload||!payload[0])return null;const d=payload[0].payload;return <div style={{background:T.surface,border:`1px solid ${T.border}`,padding:8,borderRadius:4,fontSize:11}}><div style={{fontWeight:700}}>{d.name}</div><div>Anomaly: {d.anomaly_score.toFixed(3)}</div></div>;}} />
                      <Scatter data={ENTITIES} fill={T.navyL} name="Entities">
                        {ENTITIES.map((e,i)=><Cell key={i} fill={Math.abs(e.anomaly_score)>anomalyThreshold?T.red:T.navyL} />)}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </Section>
              <Section title="LOF-STYLE LOCAL DENSITY RATIO">
                <div style={s.card}>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={[...ENTITIES].sort((a,b)=>Math.abs(b.anomaly_score)-Math.abs(a.anomaly_score)).slice(0,12)}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="id" tick={{fontSize:9}} />
                      <YAxis tick={{fontSize:10}} />
                      <Tooltip />
                      <Bar dataKey="anomaly_score" name="Anomaly Score" radius={[3,3,0,0]}>
                        {[...ENTITIES].sort((a,b)=>Math.abs(b.anomaly_score)-Math.abs(a.anomaly_score)).slice(0,12).map((e,i)=><Cell key={i} fill={Math.abs(e.anomaly_score)>anomalyThreshold?T.red:T.sage} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Section>
            </div>
            <Section title="FLAGGED OUTLIERS TABLE">
              <div style={s.card}>
                <table style={s.table}>
                  <thead><tr><th style={s.th}>ID</th><th style={s.th}>Name</th><th style={s.th}>Sector</th><th style={s.th}>Anomaly Score</th><th style={s.th}>ML Materiality</th><th style={s.th}>ESG Score</th><th style={s.th}>GHG Intensity</th><th style={s.th}>Controversy</th><th style={s.th}>Status</th></tr></thead>
                  <tbody>
                    {anomalyFlagged.length===0?<tr><td colSpan={9} style={{...s.td,textAlign:'center',color:T.textMut}}>No outliers at current threshold</td></tr>:anomalyFlagged.map(e=>(
                      <tr key={e.id}>
                        <td style={{...s.td,fontFamily:T.mono,fontWeight:700,color:T.red}}>{e.id}</td>
                        <td style={s.td}>{e.name}</td>
                        <td style={s.td}>{e.sector}</td>
                        <td style={{...s.td,fontFamily:T.mono,color:T.red}}>{e.anomaly_score.toFixed(3)}</td>
                        <td style={{...s.td,fontFamily:T.mono}}>{e.ml_materiality.toFixed(1)}</td>
                        <td style={{...s.td,fontFamily:T.mono}}>{e.esg_score.toFixed(1)}</td>
                        <td style={{...s.td,fontFamily:T.mono,color:e.ghg_intensity>250?T.red:T.textSec}}>{e.ghg_intensity.toFixed(0)}</td>
                        <td style={{...s.td,fontFamily:T.mono,color:e.controversy_count>5?T.red:T.textSec}}>{e.controversy_count}</td>
                        <td style={s.td}>{pill('OUTLIER',T.red)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
            <Section title="SECTOR ANOMALY RATES">
              <div style={s.card}>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={sectorAnomalyRates}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="sector" tick={{fontSize:9}} angle={-20} textAnchor="end" height={40} />
                    <YAxis tick={{fontSize:10}} unit="%" />
                    <Tooltip formatter={v=>`${v}%`} />
                    <Bar dataKey="rate" name="Anomaly Rate %" radius={[3,3,0,0]}>
                      {sectorAnomalyRates.map((d,i)=><Cell key={i} fill={d.rate>50?T.red:d.rate>25?T.amber:T.sage} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Section>
          </div>
        )}

        {tab===5&&(
          <div>
            <Section title="SHAP-STYLE FEATURE IMPORTANCE (GLOBAL)">
              <div style={s.card}>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={[...FEATURES].sort((a,b)=>b.importance-a.importance)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis type="number" tick={{fontSize:10}} />
                    <YAxis dataKey="name" type="category" width={160} tick={{fontSize:10}} />
                    <Tooltip formatter={v=>v.toFixed(4)} />
                    <Bar dataKey="importance" name="SHAP Importance" radius={[0,4,4,0]}>
                      {[...FEATURES].sort((a,b)=>b.importance-a.importance).map((f,i)=><Cell key={i} fill={f.category==='Climate'?T.red:f.category==='Governance'?T.navyL:f.category==='ESG'?T.sage:f.category==='Regulatory'?T.gold:T.textSec} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div style={{display:'flex',gap:12,marginTop:8,flexWrap:'wrap'}}>
                  {['Climate','Governance','ESG','Regulatory','Other'].map((cat,i)=><span key={cat} style={{fontSize:11,color:[T.red,T.navyL,T.sage,T.gold,T.textSec][i],fontFamily:T.mono}}>{['■','■','■','■','■'][i]} {cat}</span>)}
                </div>
              </div>
            </Section>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
              <Section title="FEATURE CATEGORY BREAKDOWN">
                <div style={s.card}>
                  <table style={s.table}>
                    <thead><tr><th style={s.th}>Feature</th><th style={s.th}>Category</th><th style={s.th}>Type</th><th style={s.th}>Importance</th><th style={s.th}>Cumulative</th><th style={s.th}>Rank</th></tr></thead>
                    <tbody>
                      {[...FEATURES].sort((a,b)=>b.importance-a.importance).map((f,i,arr)=>{
                        const cumulative=arr.slice(0,i+1).reduce((s,x)=>s+x.importance,0);
                        return (
                          <tr key={f.name}>
                            <td style={s.td}>{f.name}</td>
                            <td style={s.td}>{pill(f.category,f.category==='Climate'?T.red:f.category==='Governance'?T.navyL:f.category==='ESG'?T.sage:f.category==='Regulatory'?T.gold:T.textSec)}</td>
                            <td style={{...s.td,fontFamily:T.mono,fontSize:10}}>{f.type}</td>
                            <td style={{...s.td,fontFamily:T.mono,color:T.navy}}>{f.importance.toFixed(4)}</td>
                            <td style={s.td}>
                              <div style={{display:'flex',alignItems:'center',gap:6}}>
                                <div style={{width:80,background:T.surfaceH,borderRadius:2,height:8}}>
                                  <div style={{width:`${Math.min(100,(cumulative*100).toFixed(0))}%`,height:'100%',background:T.gold,borderRadius:2}} />
                                </div>
                                <span style={{fontFamily:T.mono,fontSize:10,color:T.textMut}}>{(cumulative*100).toFixed(0)}%</span>
                              </div>
                            </td>
                            <td style={{...s.td,fontFamily:T.mono,color:T.gold}}>#{i+1}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Section>
              <Section title="FEATURE CORRELATION HEATMAP (TOP 6)">
                <div style={s.card}>
                  {(() => {
                    const top6 = FEATURES.slice(0,6);
                    return (
                      <div style={{overflowX:'auto'}}>
                        <table style={s.table}>
                          <thead><tr><th style={s.th} />{top6.map(f=><th key={f.name} style={{...s.th,fontSize:9}}>{f.name.slice(0,10)}</th>)}</tr></thead>
                          <tbody>
                            {top6.map((fi,ri)=>(
                              <tr key={fi.name}>
                                <td style={{...s.td,fontFamily:T.mono,fontSize:9,fontWeight:700}}>{fi.name.slice(0,10)}</td>
                                {top6.map((fj,ci)=>{
                                  const h=hashStr(fi.name+fj.name);
                                  const corr=ri===ci?1:(sr(h*7)*2-1)*0.8;
                                  const abs=Math.abs(corr);
                                  const bg=corr>0?`rgba(92,138,106,${abs*0.7})`:`rgba(220,38,38,${abs*0.7})`;
                                  return <td key={ci} style={{...s.td,background:bg,textAlign:'center',fontFamily:T.mono,fontSize:10,color:abs>0.5?'#fff':T.text}}>{corr.toFixed(2)}</td>;
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </div>
              </Section>
            </div>
            <Section title="SHAP INTERACTION HEATMAP (TOP 5 FEATURES)">
              <div style={s.card}>
                <div style={{overflowX:'auto'}}>
                  <table style={s.table}>
                    <thead>
                      <tr>
                        <th style={s.th}>Feature</th>
                        {FEATURES.slice(0,5).map(f=><th key={f.name} style={{...s.th,fontSize:9,textAlign:'center'}}>{f.name.slice(0,12)}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {featureInteraction.map((row,ri)=>(
                        <tr key={row.feature}>
                          <td style={{...s.td,fontFamily:T.mono,fontWeight:700,color:T.navy,fontSize:11}}>{row.feature.slice(0,14)}</td>
                          {FEATURES.slice(0,5).map((fj,ci)=>{
                            const v=row[fj.name]||0;
                            const isMain=ri===ci;
                            return (
                              <td key={fj.name} style={{...s.td,textAlign:'center',fontFamily:T.mono,fontSize:10,background:isMain?`${T.gold}40`:v>0.01?`${T.sage}${Math.floor(v/0.04*200).toString(16).padStart(2,'0')}`:'transparent',color:isMain?T.navy:T.textSec,fontWeight:isMain?700:400}}>{isMain?v.toFixed(3):(v*100).toFixed(1)+'%'}</td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{marginTop:8,fontSize:11,color:T.textMut}}>Diagonal = main effect (SHAP importance). Off-diagonal = pairwise interaction strength. Interaction = joint SHAP contribution above additive baseline.</div>
              </div>
            </Section>
            <Section title="CATEGORY-LEVEL IMPORTANCE ROLLUP">
              <div style={s.card}>
                <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
                  {['Climate','Governance','ESG','Regulatory','Financial','Market','Social','Environment'].map(cat=>{
                    const catFeatures = FEATURES.filter(f=>f.category===cat);
                    const totalImp = catFeatures.reduce((s,f)=>s+f.importance,0);
                    const catColor = cat==='Climate'?T.red:cat==='Governance'?T.navyL:cat==='ESG'?T.sage:cat==='Regulatory'?T.gold:cat==='Financial'?T.amber:T.textSec;
                    return (
                      <div key={cat} style={{background:T.surfaceH,border:`1px solid ${T.border}`,borderRadius:8,padding:12,minWidth:120,borderTop:`3px solid ${catColor}`}}>
                        <div style={{fontSize:11,fontWeight:700,color:catColor,marginBottom:4,fontFamily:T.mono}}>{cat}</div>
                        <div style={{fontSize:18,fontWeight:700,color:T.navy,fontFamily:T.mono}}>{(totalImp*100).toFixed(1)}%</div>
                        <div style={{fontSize:10,color:T.textMut}}>{catFeatures.length} feature{catFeatures.length!==1?'s':''}</div>
                        <div style={{marginTop:6,display:'flex',gap:2}}>
                          {catFeatures.map(f=><div key={f.name} title={f.name} style={{height:4,flex:f.importance,background:catColor,borderRadius:2}} />)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Section>
          </div>
        )}

        {tab===6&&(
          <div>
            <div style={{display:'flex',gap:16,alignItems:'center',marginBottom:16}}>
              <label style={{fontFamily:T.mono,fontSize:12,color:T.navy}}>Materiality threshold:</label>
              <input type="range" min={0} max={100} value={materialityThreshold} onChange={e=>setMaterialityThreshold(+e.target.value)} style={{width:200}} />
              <span style={{fontFamily:T.mono,fontWeight:700,color:T.gold}}>{materialityThreshold}</span>
            </div>
            <Section title="THRESHOLD TRADE-OFF CURVE (PRECISION / RECALL / F1)">
              <div style={s.card}>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={thresholdCurve}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="threshold" tick={{fontSize:10}} label={{value:'Materiality Threshold',position:'bottom',fontSize:10}} />
                    <YAxis domain={[0,1]} tick={{fontSize:10}} />
                    <Tooltip />
                    <Legend />
                    <ReferenceLine x={materialityThreshold} stroke={T.gold} strokeDasharray="4 4" label={{value:'Current',fontSize:9,fill:T.gold}} />
                    <Line type="monotone" dataKey="precision" stroke={T.navyL} name="Precision" dot={false} strokeWidth={2} />
                    <Line type="monotone" dataKey="recall" stroke={T.sage} name="Recall" dot={false} strokeWidth={2} />
                    <Line type="monotone" dataKey="f1" stroke={T.gold} name="F1 Score" dot={false} strokeWidth={2.5} />
                    <Line type="monotone" dataKey="fpr" stroke={T.red} name="FPR" dot={false} strokeWidth={1.5} strokeDasharray="4 4" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Section>
            <Section title="OPTIMAL THRESHOLD ANALYSIS">
              <div style={s.card}>
                {(() => {
                  const opt = thresholdCurve.reduce((best,pt)=>pt.f1>best.f1?pt:best,thresholdCurve[0]);
                  return (
                    <div style={{display:'flex',gap:24,flexWrap:'wrap'}}>
                      <div><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut}}>Optimal Threshold</div><div style={{fontFamily:T.mono,fontSize:24,fontWeight:700,color:T.gold}}>{opt.threshold}</div></div>
                      <div><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut}}>Best F1</div><div style={{fontFamily:T.mono,fontSize:24,fontWeight:700,color:T.green}}>{opt.f1.toFixed(3)}</div></div>
                      <div><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut}}>Precision @ Opt</div><div style={{fontFamily:T.mono,fontSize:24,fontWeight:700,color:T.navyL}}>{opt.precision.toFixed(3)}</div></div>
                      <div><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut}}>Recall @ Opt</div><div style={{fontFamily:T.mono,fontSize:24,fontWeight:700,color:T.sage}}>{opt.recall.toFixed(3)}</div></div>
                      <div><div style={{fontFamily:T.mono,fontSize:11,color:T.textMut}}>FPR @ Opt</div><div style={{fontFamily:T.mono,fontSize:24,fontWeight:700,color:T.red}}>{opt.fpr.toFixed(3)}</div></div>
                    </div>
                  );
                })()}
              </div>
            </Section>
            <Section title="THRESHOLD SENSITIVITY TABLE">
              <div style={s.card}>
                <table style={s.table}>
                  <thead>
                    <tr>
                      <th style={s.th}>Threshold</th>
                      <th style={s.th}>Precision</th>
                      <th style={s.th}>Recall</th>
                      <th style={s.th}>F1 Score</th>
                      <th style={s.th}>FPR</th>
                      <th style={s.th}>Entities Flagged</th>
                      <th style={s.th}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {thresholdCurve.filter((_,i)=>i%2===0).map(pt=>{
                      const flagged = ENTITIES.filter(e=>e.ml_materiality>pt.threshold).length;
                      const isOpt = thresholdCurve.reduce((best,x)=>x.f1>best.f1?x:best,thresholdCurve[0]).threshold===pt.threshold;
                      const isCurrent = pt.threshold===Math.round(materialityThreshold/5)*5;
                      return (
                        <tr key={pt.threshold} style={{background:isOpt?`${T.gold}15`:isCurrent?`${T.navyL}10`:'transparent'}}>
                          <td style={{...s.td,fontFamily:T.mono,fontWeight:700,color:T.navy}}>{pt.threshold}</td>
                          <td style={{...s.td,fontFamily:T.mono,color:pt.precision>0.8?T.green:T.amber}}>{pt.precision.toFixed(3)}</td>
                          <td style={{...s.td,fontFamily:T.mono,color:pt.recall>0.8?T.green:T.amber}}>{pt.recall.toFixed(3)}</td>
                          <td style={{...s.td,fontFamily:T.mono,fontWeight:700,color:pt.f1>0.8?T.green:pt.f1>0.6?T.amber:T.red}}>{pt.f1.toFixed(3)}</td>
                          <td style={{...s.td,fontFamily:T.mono,color:pt.fpr>0.3?T.red:T.textSec}}>{pt.fpr.toFixed(3)}</td>
                          <td style={{...s.td,fontFamily:T.mono}}>{flagged}</td>
                          <td style={s.td}>
                            {isOpt&&pill('OPTIMAL',T.gold)}
                            {isCurrent&&!isOpt&&pill('CURRENT',T.navyL)}
                            {!isOpt&&!isCurrent&&<span style={{fontSize:10,color:T.textMut}}>—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Section>
          </div>
        )}

        {tab===7&&(
          <div>
            <Section title="DOUBLE MATERIALITY MATRIX — IMPACT × FINANCIAL">
              <div style={s.card}>
                <div style={{marginBottom:8,fontSize:12,color:T.textMut}}>X-axis: Outside-In (Financial Materiality) · Y-axis: Inside-Out (Impact Materiality) · Size: Scope × Severity</div>
                <ResponsiveContainer width="100%" height={380}>
                  <ScatterChart margin={{top:20,right:20,bottom:30,left:20}}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="outside_in" name="Financial Materiality" type="number" domain={[0,100]} tick={{fontSize:10}} label={{value:'Financial Materiality (Outside-In)',position:'bottom',fontSize:10}} />
                    <YAxis dataKey="inside_out" name="Impact Materiality" type="number" domain={[0,100]} tick={{fontSize:10}} label={{value:'Impact Materiality (Inside-Out)',angle:-90,position:'left',fontSize:10}} />
                    <ReferenceLine x={50} stroke={T.border} strokeDasharray="4 4" />
                    <ReferenceLine y={50} stroke={T.border} strokeDasharray="4 4" />
                    <Tooltip content={({payload})=>{if(!payload||!payload[0])return null;const d=payload[0].payload;return <div style={{background:T.surface,border:`1px solid ${T.border}`,padding:8,borderRadius:4,fontSize:11}}><div style={{fontWeight:700}}>{d.name}</div><div>Financial: {d.outside_in.toFixed(1)}</div><div>Impact: {d.inside_out.toFixed(1)}</div></div>;}} />
                    <Scatter data={doubleMatTopics} name="Topics">
                      {doubleMatTopics.map((d,i)=><Cell key={i} fill={d.inside_out>50&&d.outside_in>50?T.red:d.inside_out>50?T.amber:d.outside_in>50?T.navyL:T.sage} />)}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
                <div style={{display:'flex',gap:16,marginTop:8,flexWrap:'wrap'}}>
                  {[{color:T.red,label:'Dual Material (Priority)'},{color:T.amber,label:'Impact Material'},{color:T.navyL,label:'Financially Material'},{color:T.sage,label:'Low Priority'}].map(x=><span key={x.label} style={{fontSize:11,color:x.color,fontFamily:T.mono}}>■ {x.label}</span>)}
                </div>
              </div>
            </Section>
            <Section title="DOUBLE MATERIALITY QUADRANT SUMMARY">
              <div style={s.card}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:12,marginBottom:12}}>
                  {[
                    {label:'Dual Material',desc:'High Impact & High Financial',color:T.red,topics:doubleMatTopics.filter(t=>t.inside_out>50&&t.outside_in>50)},
                    {label:'Impact Material',desc:'High Impact only',color:T.amber,topics:doubleMatTopics.filter(t=>t.inside_out>50&&t.outside_in<=50)},
                    {label:'Financially Material',desc:'High Financial only',color:T.navyL,topics:doubleMatTopics.filter(t=>t.inside_out<=50&&t.outside_in>50)},
                    {label:'Low Priority',desc:'Low on both axes',color:T.sage,topics:doubleMatTopics.filter(t=>t.inside_out<=50&&t.outside_in<=50)},
                  ].map(q=>(
                    <div key={q.label} style={{background:T.surfaceH,border:`2px solid ${q.color}40`,borderRadius:8,padding:12}}>
                      <div style={{fontWeight:700,color:q.color,fontSize:13,marginBottom:4}}>{q.label}</div>
                      <div style={{fontSize:10,color:T.textMut,marginBottom:8}}>{q.desc}</div>
                      <div style={{fontSize:22,fontWeight:700,color:q.color,fontFamily:T.mono,marginBottom:6}}>{q.topics.length}</div>
                      <div style={{fontSize:10,color:T.textSec}}>topics in quadrant</div>
                      <div style={{marginTop:8,display:'flex',flexDirection:'column',gap:2}}>
                        {q.topics.slice(0,3).map(t=>(
                          <div key={t.name} style={{fontSize:10,color:T.textSec,background:T.surface,borderRadius:3,padding:'2px 6px',fontFamily:T.mono}}>{t.name.slice(0,18)}</div>
                        ))}
                        {q.topics.length>3&&<div style={{fontSize:10,color:T.textMut}}>+{q.topics.length-3} more</div>}
                      </div>
                    </div>
                  ))}
                </div>
                <table style={s.table}>
                  <thead><tr><th style={s.th}>Topic Name</th><th style={s.th}>LDA Topic</th><th style={s.th}>Inside-Out (Impact)</th><th style={s.th}>Outside-In (Financial)</th><th style={s.th}>Quadrant</th></tr></thead>
                  <tbody>
                    {[...doubleMatTopics].sort((a,b)=>(b.inside_out+b.outside_in)-(a.inside_out+a.outside_in)).slice(0,15).map((t,i)=>{
                      const quadrant = t.inside_out>50&&t.outside_in>50?'Dual Material':t.inside_out>50?'Impact Material':t.outside_in>50?'Financially Material':'Low Priority';
                      const qColor = quadrant==='Dual Material'?T.red:quadrant==='Impact Material'?T.amber:quadrant==='Financially Material'?T.navyL:T.sage;
                      return (
                        <tr key={i}>
                          <td style={s.td}>{t.name}</td>
                          <td style={s.td}>{pill(LDA_TOPICS[t.topic]?.name.slice(0,16)||'',T.navyL)}</td>
                          <td style={{...s.td,fontFamily:T.mono,color:t.inside_out>50?T.amber:T.textSec}}>{t.inside_out.toFixed(1)}</td>
                          <td style={{...s.td,fontFamily:T.mono,color:t.outside_in>50?T.navyL:T.textSec}}>{t.outside_in.toFixed(1)}</td>
                          <td style={s.td}>{pill(quadrant,qColor)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Section>
          </div>
        )}

        {tab===8&&(
          <div>
            <Section title="ENSEMBLE MODEL VOTING — 10 ENTITIES SAMPLE">
              <div style={s.card}>
                <table style={s.table}>
                  <thead><tr><th style={s.th}>Entity</th><th style={s.th}>Random Forest</th><th style={s.th}>Gradient Boosting</th><th style={s.th}>LightGBM</th><th style={s.th}>Logistic Reg.</th><th style={s.th}>Majority Vote</th><th style={s.th}>Agreement</th></tr></thead>
                  <tbody>
                    {ensembleVoting.map(e=>(
                      <tr key={e.id}>
                        <td style={{...s.td,fontFamily:T.mono,fontWeight:700,color:T.navy}}>{e.id} {e.name.slice(0,8)}</td>
                        {[e.rf,e.gbm,e.lgbm,e.lr].map((v,i)=><td key={i} style={s.td}>{pill(v,labelColor(v))}</td>)}
                        <td style={s.td}>{pill(e.majority,labelColor(e.majority))}</td>
                        <td style={s.td}>{e.agree?pill('AGREE',T.green):pill('DISAGREE',T.amber)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
            <Section title="MODEL WEIGHT CONFIGURATION">
              <div style={s.card}>
                <div style={{display:'flex',gap:24,flexWrap:'wrap'}}>
                  {[{key:'RF',label:'Random Forest'},{key:'GBM',label:'Gradient Boosting'},{key:'LGBM',label:'LightGBM'},{key:'LR',label:'Logistic Reg.'}].map(m=>(
                    <div key={m.key}>
                      <div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:4}}>{m.label}</div>
                      <input type="range" min={0} max={1} step={0.05} value={ensembleWeights[m.key]} onChange={ev=>{const v=+ev.target.value;setEnsembleWeights(w=>({...w,[m.key]:v}));}} style={{width:120}} />
                      <span style={{fontFamily:T.mono,fontWeight:700,color:T.gold,marginLeft:8}}>{(ensembleWeights[m.key]*100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
                <div style={{marginTop:12,fontFamily:T.mono,fontSize:11,color:T.textMut}}>Total weight: {(Object.values(ensembleWeights).reduce((a,b)=>a+b,0)*100).toFixed(0)}% (normalize to 100% in production)</div>
              </div>
            </Section>
            <Section title="PER-MODEL PERFORMANCE COMPARISON">
              <div style={s.card}>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={MODELS}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="name" tick={{fontSize:10}} />
                    <YAxis domain={[0.7,1]} tick={{fontSize:10}} />
                    <Tooltip formatter={v=>(v*100).toFixed(2)+'%'} />
                    <Legend />
                    <Bar dataKey="accuracy" fill={T.navyL} name="Accuracy" />
                    <Bar dataKey="f1" fill={T.gold} name="F1 Score" />
                    <Bar dataKey="auc" fill={T.sage} name="AUC-ROC" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Section>
            <Section title="DISAGREEMENT INVESTIGATION QUEUE">
              <div style={s.card}>
                {disagreementQueue.length===0?(
                  <div style={{textAlign:'center',color:T.textMut,padding:20,fontFamily:T.mono}}>All entities in full model agreement</div>
                ):(
                  <table style={s.table}>
                    <thead><tr><th style={s.th}>Entity</th><th style={s.th}>Sector</th><th style={s.th}>ML Score</th><th style={s.th}>RF</th><th style={s.th}>GBM</th><th style={s.th}>LightGBM</th><th style={s.th}>Log. Reg.</th><th style={s.th}>Priority</th></tr></thead>
                    <tbody>
                      {disagreementQueue.slice(0,15).map(e=>(
                        <tr key={e.id}>
                          <td style={{...s.td,fontFamily:T.mono,fontWeight:700,color:T.navy}}>{e.id} {e.name}</td>
                          <td style={s.td}>{e.sector}</td>
                          <td style={{...s.td,fontFamily:T.mono}}>{e.ml_materiality.toFixed(1)}</td>
                          {[e.rf,e.gbm,e.lgbm,e.lr].map((v,i)=><td key={i} style={s.td}>{pill(v,labelColor(v))}</td>)}
                          <td style={s.td}>{pill(e.priority,e.priority==='High Priority'?T.red:T.amber)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </Section>
          </div>
        )}

        {tab===9&&(
          <div>
            <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:16,flexWrap:'wrap'}}>
              <label style={{fontFamily:T.mono,fontSize:12,color:T.navy}}>Entity:</label>
              <select value={selectedEntity} onChange={e=>setSelectedEntity(e.target.value)} style={{fontFamily:T.mono,fontSize:12,border:`1px solid ${T.border}`,borderRadius:4,padding:'4px 8px',color:T.navy}}>
                {ENTITIES.map(e=><option key={e.id} value={e.id}>{e.id} — {e.name}</option>)}
              </select>
              {pill(ENTITIES.find(e=>e.id===selectedEntity)?.sector||'','#2c5a8c')}
            </div>
            <Section title="24-QUARTER ML MATERIALITY TRAJECTORY">
              <div style={s.card}>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trajectoryData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="quarter" tick={{fontSize:9}} interval={2} />
                    <YAxis domain={[0,100]} tick={{fontSize:10}} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="upper" stroke={T.border} name="+1σ" dot={false} strokeDasharray="3 3" strokeWidth={1} />
                    <Line type="monotone" dataKey="score" stroke={T.navy} name="ML Score" dot={false} strokeWidth={2.5} />
                    <Line type="monotone" dataKey="lower" stroke={T.border} name="-1σ" dot={false} strokeDasharray="3 3" strokeWidth={1} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Section>
            <Section title="SCORE VELOCITY & REGIME">
              <div style={s.card}>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={trajectoryData.map((d,i)=>({...d,velocity:i>0?+(d.score-trajectoryData[i-1].score).toFixed(2):0}))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="quarter" tick={{fontSize:9}} interval={3} />
                    <YAxis tick={{fontSize:10}} />
                    <Tooltip />
                    <ReferenceLine y={0} stroke={T.border} />
                    <Bar dataKey="velocity" name="Score Velocity" radius={[2,2,0,0]}>
                      {trajectoryData.map((d,i)=>{
                        const vel=i>0?d.score-trajectoryData[i-1].score:0;
                        return <Cell key={i} fill={vel>0?T.red:T.green} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Section>
            <Section title="TRAJECTORY STATISTICS — SELECTED ENTITY">
              {(() => {
                const entity = ENTITIES.find(e=>e.id===selectedEntity)||ENTITIES[0];
                const scores = trajectoryData.map(d=>d.score);
                const n = scores.length||1;
                const avg = scores.reduce((s,v)=>s+v,0)/n;
                const minScore = Math.min(...scores);
                const maxScore = Math.max(...scores);
                const lastQ = scores[scores.length-1]||0;
                const firstQ = scores[0]||0;
                const drift = lastQ-firstQ;
                const stdDev = Math.sqrt(scores.reduce((s,v)=>s+(v-avg)**2,0)/n);
                const risingQ = trajectoryData.filter((_,i)=>i>0&&trajectoryData[i].score>trajectoryData[i-1].score).length;
                return (
                  <div style={s.card}>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
                      {[
                        {label:'Current Score',value:lastQ.toFixed(1),color:lastQ>66?T.red:lastQ>33?T.amber:T.green},
                        {label:'24Q Average',value:avg.toFixed(1),color:T.navy},
                        {label:'Min Score',value:minScore.toFixed(1),color:T.green},
                        {label:'Max Score',value:maxScore.toFixed(1),color:T.red},
                        {label:'Total Drift',value:`${drift>0?'+':''}${drift.toFixed(1)}`,color:drift>0?T.red:T.green},
                        {label:'Std Deviation',value:stdDev.toFixed(2),color:T.textSec},
                        {label:'Rising Quarters',value:`${risingQ}/23`,color:risingQ>12?T.red:T.green},
                        {label:'SBTi Status',value:entity.sbti_status?'Yes':'No',color:entity.sbti_status?T.green:T.textMut},
                      ].map(item=>(
                        <div key={item.label} style={{background:T.surfaceH,borderRadius:6,padding:10}}>
                          <div style={{fontSize:10,color:T.textMut,fontFamily:T.mono,marginBottom:4}}>{item.label}</div>
                          <div style={{fontSize:16,fontWeight:700,color:item.color,fontFamily:T.mono}}>{item.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </Section>
          </div>
        )}

        {tab===10&&(
          <div>
            <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:16}}>
              <label style={{fontFamily:T.mono,fontSize:12,color:T.navy}}>Sector filter:</label>
              <select value={sectorFilter} onChange={e=>setSectorFilter(e.target.value)} style={{fontFamily:T.mono,fontSize:12,border:`1px solid ${T.border}`,borderRadius:4,padding:'4px 8px',color:T.navy}}>
                <option value="All">All Sectors</option>
                {SECTORS.map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <Section title="SECTOR MATERIALITY BENCHMARKS">
              <div style={s.card}>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={sectorBenchmarks}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="sector" tick={{fontSize:9}} angle={-30} textAnchor="end" height={50} />
                    <YAxis domain={[0,100]} tick={{fontSize:10}} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="p25" fill={T.sage+'80'} name="P25" stackId="range" />
                    <Bar dataKey="avg" fill={T.navyL} name="Average" />
                    <Bar dataKey="p75" fill={T.amber+'80'} name="P75" />
                    <Bar dataKey="p95" fill={T.red+'80'} name="P95" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Section>
            <Section title="SECTOR HEAT TABLE">
              <div style={s.card}>
                <table style={s.table}>
                  <thead><tr><th style={s.th}>Sector</th><th style={s.th}>Entities</th><th style={s.th}>Avg ML Score</th><th style={s.th}>P25</th><th style={s.th}>P75</th><th style={s.th}>P95</th><th style={s.th}>Score Bar</th><th style={s.th}>Risk Tier</th></tr></thead>
                  <tbody>
                    {[...sectorBenchmarks].sort((a,b)=>b.avg-a.avg).map(sb=>(
                      <tr key={sb.sector}>
                        <td style={{padding:'7px 10px',borderBottom:`1px solid ${T.border}`,color:T.textSec,fontWeight:600}}>{sb.sector}</td>
                        <td style={{padding:'7px 10px',borderBottom:`1px solid ${T.border}`,color:T.textSec,fontFamily:T.mono}}>{sb.count}</td>
                        <td style={{padding:'7px 10px',borderBottom:`1px solid ${T.border}`,color:sb.avg>66?T.red:sb.avg>45?T.amber:T.green,fontFamily:T.mono,fontWeight:700}}>{sb.avg}</td>
                        <td style={{padding:'7px 10px',borderBottom:`1px solid ${T.border}`,color:T.textSec,fontFamily:T.mono}}>{sb.p25}</td>
                        <td style={{padding:'7px 10px',borderBottom:`1px solid ${T.border}`,color:T.textSec,fontFamily:T.mono}}>{sb.p75}</td>
                        <td style={{padding:'7px 10px',borderBottom:`1px solid ${T.border}`,color:T.red,fontFamily:T.mono}}>{sb.p95}</td>
                        <td style={{padding:'7px 10px',borderBottom:`1px solid ${T.border}`}}>
                          <div style={{background:T.surfaceH,borderRadius:3,height:8,width:120}}>
                            <div style={{width:`${sb.avg}%`,height:'100%',background:sb.avg>66?T.red:sb.avg>45?T.amber:T.green,borderRadius:3}} />
                          </div>
                        </td>
                        <td style={{padding:'7px 10px',borderBottom:`1px solid ${T.border}`,color:T.textSec}}>{pill(sb.avg>66?'HIGH RISK':sb.avg>45?'ELEVATED':'LOWER RISK',sb.avg>66?T.red:sb.avg>45?T.amber:T.green)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
            <Section title="ENTITY vs SECTOR POSITIONING">
              <div style={s.card}>
                <div style={{marginBottom:8,fontSize:12,color:T.textMut}}>Each entity's ML score relative to its sector average. Positive = above-sector-average materiality risk.</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={[...filteredEntities].map(e=>{
                    const secAvg=sectorBenchmarks.find(sb=>sb.sector===e.sector)?.avg||50;
                    return {id:e.id,name:e.name,deviation:+(e.ml_materiality-secAvg).toFixed(1),score:e.ml_materiality};
                  }).sort((a,b)=>b.deviation-a.deviation).slice(0,20)}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="id" tick={{fontSize:9}} />
                    <YAxis tick={{fontSize:10}} />
                    <Tooltip formatter={v=>`${v>0?'+':''}${v.toFixed(1)} vs sector`} />
                    <ReferenceLine y={0} stroke={T.border} strokeWidth={2} />
                    <Bar dataKey="deviation" name="vs Sector Avg" radius={[2,2,0,0]}>
                      {[...filteredEntities].map(e=>{
                        const secAvg=sectorBenchmarks.find(sb=>sb.sector===e.sector)?.avg||50;
                        return e.ml_materiality-secAvg;
                      }).sort((a,b)=>b-a).slice(0,20).map((v,i)=><Cell key={i} fill={v>5?T.red:v>0?T.amber:T.green} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Section>
          </div>
        )}

        {tab===11&&(
          <div>
            <Section title="TRANSFER LEARNING — BASELINE vs FINE-TUNED ACCURACY BY SECTOR">
              <div style={s.card}>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={transferData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis type="number" domain={[0.6,1]} tick={{fontSize:10}} tickFormatter={v=>`${(v*100).toFixed(0)}%`} />
                    <YAxis dataKey="sector" type="category" width={100} tick={{fontSize:10}} />
                    <Tooltip formatter={v=>`${(v*100).toFixed(2)}%`} />
                    <Legend />
                    <Bar dataKey="baseline" fill={T.textMut} name="Baseline" radius={[0,3,3,0]} />
                    <Bar dataKey="fine_tuned" fill={T.gold} name="Fine-tuned" radius={[0,3,3,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Section>
            <Section title="DATA EFFICIENCY CURVE — PERFORMANCE vs LABELED SAMPLES">
              <div style={s.card}>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={Array.from({length:10},(_,i)=>({samples:(i+1)*100,baseline:+(0.72+sr(i*7)*0.02).toFixed(3),fine_tuned:+(0.72+sr(i*11)*0.04+i*0.012).toFixed(3)}))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="samples" tick={{fontSize:10}} label={{value:'Labeled Samples',position:'bottom',fontSize:10}} />
                    <YAxis domain={[0.6,1]} tick={{fontSize:10}} tickFormatter={v=>`${(v*100).toFixed(0)}%`} />
                    <Tooltip formatter={v=>`${(v*100).toFixed(2)}%`} />
                    <Legend />
                    <Line type="monotone" dataKey="baseline" stroke={T.textMut} name="Baseline" dot={false} strokeDasharray="4 4" strokeWidth={1.5} />
                    <Line type="monotone" dataKey="fine_tuned" stroke={T.gold} name="Fine-tuned" dot={false} strokeWidth={2.5} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Section>
            <Section title="SECTOR FINE-TUNING SUMMARY">
              <div style={s.card}>
                <table style={s.table}>
                  <thead><tr><th style={s.th}>Sector</th><th style={s.th}>Baseline Acc.</th><th style={s.th}>Fine-tuned Acc.</th><th style={s.th}>Gain</th><th style={s.th}>Samples Used</th><th style={s.th}>Status</th></tr></thead>
                  <tbody>
                    {transferData.map(d=>{
                      const gain=(d.fine_tuned-d.baseline)*100;
                      return (
                        <tr key={d.sector}>
                          <td style={{padding:'7px 10px',borderBottom:`1px solid ${T.border}`,color:T.textSec,fontWeight:600}}>{d.sector}</td>
                          <td style={{padding:'7px 10px',borderBottom:`1px solid ${T.border}`,color:T.textSec,fontFamily:T.mono}}>{(d.baseline*100).toFixed(2)}%</td>
                          <td style={{padding:'7px 10px',borderBottom:`1px solid ${T.border}`,color:T.green,fontFamily:T.mono,fontWeight:700}}>{(d.fine_tuned*100).toFixed(2)}%</td>
                          <td style={{padding:'7px 10px',borderBottom:`1px solid ${T.border}`,color:T.green,fontFamily:T.mono}}>+{gain.toFixed(2)}pp</td>
                          <td style={{padding:'7px 10px',borderBottom:`1px solid ${T.border}`,color:T.textSec,fontFamily:T.mono}}>{d.samples}</td>
                          <td style={{padding:'7px 10px',borderBottom:`1px solid ${T.border}`}}>{pill(gain>5?'LARGE GAIN':gain>2?'MODERATE':'MARGINAL',gain>5?T.green:gain>2?T.amber:T.textMut)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div style={{marginTop:12,background:T.surfaceH,borderRadius:6,padding:12,borderLeft:`3px solid ${T.navyL}`}}>
                  <div style={{fontWeight:700,color:T.navy,fontSize:12,marginBottom:4,fontFamily:T.mono}}>TRANSFER LEARNING METHODOLOGY</div>
                  <div style={{fontSize:11,color:T.textSec,lineHeight:1.7}}>Base model pre-trained on 10,000+ cross-sector ESG disclosures (2018–2024). Sector-specific fine-tuning uses labeled materiality assessments sourced from SASB standards, GRI material topics, and analyst ratings. Fine-tuning applies a frozen base encoder (last 2 layers unfrozen) with learning rate 1e-4 for 20 epochs. Data efficiency threshold: minimum 50 labeled samples per sector for stable fine-tuning. Sectors below threshold use base model + calibration platt scaling.</div>
                </div>
              </div>
            </Section>
          </div>
        )}

        {tab===12&&(
          <div>
            <Section title="POPULATION STABILITY INDEX (PSI) — 12-MONTH DRIFT LOG">
              <div style={s.card}>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={DRIFT_LOG}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="month" tick={{fontSize:9}} />
                    <YAxis tick={{fontSize:10}} />
                    <Tooltip />
                    <Legend />
                    <ReferenceLine y={0.1} stroke={T.amber} strokeDasharray="4 4" label={{value:'Warn (0.10)',fontSize:9,fill:T.amber}} />
                    <ReferenceLine y={0.2} stroke={T.red} strokeDasharray="4 4" label={{value:'Alert (0.20)',fontSize:9,fill:T.red}} />
                    <Line type="monotone" dataKey="psi_ghg" stroke={T.red} name="GHG PSI" dot={false} strokeWidth={2} />
                    <Line type="monotone" dataKey="psi_esg" stroke={T.navyL} name="ESG PSI" dot={false} strokeWidth={2} />
                    <Line type="monotone" dataKey="psi_disclosure" stroke={T.sage} name="Disclosure PSI" dot={false} strokeWidth={2} />
                    <Line type="monotone" dataKey="psi_sentiment" stroke={T.gold} name="Sentiment PSI" dot={false} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Section>
            <Section title="CONCEPT DRIFT INDEX">
              <div style={s.card}>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={DRIFT_LOG}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="month" tick={{fontSize:9}} />
                    <YAxis domain={[0,0.4]} tick={{fontSize:10}} />
                    <Tooltip />
                    <ReferenceLine y={0.2} stroke={T.red} strokeDasharray="4 4" label={{value:'Trigger',fontSize:9,fill:T.red}} />
                    <Bar dataKey="concept_drift" name="Concept Drift" radius={[3,3,0,0]}>
                      {DRIFT_LOG.map((d,i)=><Cell key={i} fill={d.concept_drift>0.2?T.red:d.concept_drift>0.1?T.amber:T.sage} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Section>
            <Section title="RETRAINING EVENT LOG">
              <div style={s.card}>
                <table style={s.table}>
                  <thead><tr><th style={s.th}>#</th><th style={s.th}>Date</th><th style={s.th}>Trigger</th><th style={s.th}>Acc. Before</th><th style={s.th}>Acc. After</th><th style={s.th}>Gain</th><th style={s.th}>Samples Added</th><th style={s.th}>Duration (min)</th></tr></thead>
                  <tbody>
                    {RETRAINING_LOG.map(r=>(
                      <tr key={r.id}>
                        <td style={{padding:'7px 10px',borderBottom:`1px solid ${T.border}`,color:T.textSec,fontFamily:T.mono}}>{r.id}</td>
                        <td style={{padding:'7px 10px',borderBottom:`1px solid ${T.border}`,color:T.textSec,fontFamily:T.mono}}>{r.date}</td>
                        <td style={{padding:'7px 10px',borderBottom:`1px solid ${T.border}`,color:T.textSec}}>{pill(r.trigger,r.trigger.includes('PSI')?T.red:r.trigger==='Scheduled'?T.navyL:T.amber)}</td>
                        <td style={{padding:'7px 10px',borderBottom:`1px solid ${T.border}`,color:T.textSec,fontFamily:T.mono}}>{(r.accuracy_before*100).toFixed(2)}%</td>
                        <td style={{padding:'7px 10px',borderBottom:`1px solid ${T.border}`,color:T.green,fontFamily:T.mono}}>{(r.accuracy_after*100).toFixed(2)}%</td>
                        <td style={{padding:'7px 10px',borderBottom:`1px solid ${T.border}`,color:T.green,fontFamily:T.mono}}>+{((r.accuracy_after-r.accuracy_before)*100).toFixed(2)}pp</td>
                        <td style={{padding:'7px 10px',borderBottom:`1px solid ${T.border}`,color:T.textSec,fontFamily:T.mono}}>{r.samples_added.toLocaleString()}</td>
                        <td style={{padding:'7px 10px',borderBottom:`1px solid ${T.border}`,color:T.textSec,fontFamily:T.mono}}>{r.duration_min}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
            <Section title="PSI FEATURE HEATMAP — 6-MONTH WINDOW">
              <div style={s.card}>
                <div style={{overflowX:'auto'}}>
                  <table style={s.table}>
                    <thead>
                      <tr>
                        <th style={s.th}>Feature</th>
                        {DRIFT_LOG.slice(0,6).map(d=><th key={d.month} style={s.th}>{d.month}</th>)}
                        <th style={s.th}>Max PSI</th>
                        <th style={s.th}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {psiHeatmap.map(row=>{
                        const vals = DRIFT_LOG.slice(0,6).map(d=>row[d.month]||0);
                        const maxPsi = Math.max(...vals);
                        return (
                          <tr key={row.feature}>
                            <td style={{...s.td,fontFamily:T.mono,fontWeight:600,color:T.navy}}>{row.feature}</td>
                            {vals.map((v,vi)=>(
                              <td key={vi} style={{...s.td,textAlign:'center',fontFamily:T.mono,fontSize:10,background:v>0.2?T.red+'30':v>0.1?T.amber+'30':T.green+'20',color:v>0.2?T.red:v>0.1?T.amber:T.green}}>{v.toFixed(3)}</td>
                            ))}
                            <td style={{...s.td,fontFamily:T.mono,fontWeight:700,color:maxPsi>0.2?T.red:maxPsi>0.1?T.amber:T.green}}>{maxPsi.toFixed(3)}</td>
                            <td style={s.td}>{pill(maxPsi>0.2?'DRIFT ALERT':maxPsi>0.1?'WARN':'STABLE',maxPsi>0.2?T.red:maxPsi>0.1?T.amber:T.green)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div style={{marginTop:8,fontSize:11,color:T.textMut}}>PSI &gt; 0.20 → Retrain triggered · PSI 0.10–0.20 → Monitor closely · PSI &lt; 0.10 → Stable</div>
              </div>
            </Section>
          </div>
        )}

        {tab===13&&(
          <div>
            <Section title="LIME LOCAL EXPLANATIONS — 5 ENTITY DEEP-DIVE">
              {limeExplanations.map(exp=>(
                <div key={exp.id} style={{...s.card,marginBottom:16}}>
                  <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:12}}>
                    <span style={{fontFamily:T.mono,fontWeight:700,fontSize:14,color:T.navy}}>{exp.id}</span>
                    <span style={{fontWeight:600}}>{exp.name}</span>
                    {pill(exp.label,labelColor(exp.label))}
                    <span style={{fontFamily:T.mono,fontSize:12,color:T.textMut}}>ML Score: {exp.score}</span>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                    <div>
                      <div style={{fontSize:11,fontWeight:600,color:T.navy,marginBottom:6,fontFamily:T.mono}}>FEATURE CONTRIBUTIONS</div>
                      {exp.contribs.map(c=>(
                        <div key={c.feature} style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                          <div style={{width:120,fontSize:10,color:T.textSec,flexShrink:0}}>{c.feature}</div>
                          <div style={{flex:1,background:T.surfaceH,borderRadius:3,height:14,overflow:'hidden'}}>
                            <div style={{width:`${Math.min(100,Math.abs(c.contribution))}%`,height:'100%',background:c.contribution>0?T.red:T.green,borderRadius:3}} />
                          </div>
                          <div style={{width:50,fontSize:10,fontFamily:T.mono,color:c.contribution>0?T.red:T.green,textAlign:'right'}}>{c.contribution>0?'+':''}{c.contribution.toFixed(1)}</div>
                        </div>
                      ))}
                    </div>
                    <div>
                      <div style={{fontSize:11,fontWeight:600,color:T.navy,marginBottom:6,fontFamily:T.mono}}>COUNTERFACTUAL CHANGES</div>
                      <div style={{background:T.surfaceH,borderRadius:6,padding:10,fontSize:12,color:T.textSec,borderLeft:`3px solid ${T.gold}`}}>{exp.counterfactual||'Classification stable — no single feature change alters outcome.'}</div>
                      <div style={{marginTop:12,fontSize:11,fontWeight:600,color:T.navy,marginBottom:4,fontFamily:T.mono}}>MODEL CARD SNIPPET</div>
                      <div style={{fontSize:10,color:T.textMut,lineHeight:1.5}}>Training data: 2020–2025 ESG filings · Algorithm: RF+GBM ensemble · Features: {FEATURES.length} · Last retrain: {RETRAINING_LOG[RETRAINING_LOG.length-1]?.date||'—'} · Bias audit: Passed</div>
                    </div>
                  </div>
                </div>
              ))}
            </Section>
            <Section title="MODEL CARD — ENSEMBLE ML MATERIALITY ENGINE">
              <div style={s.card}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16,marginBottom:16}}>
                  <div>
                    <div style={{fontWeight:700,color:T.navy,fontSize:12,marginBottom:8,fontFamily:T.mono}}>MODEL DETAILS</div>
                    {[
                      ['Model type','Weighted Ensemble (RF + GBM + LightGBM + LR)'],
                      ['Task','3-class materiality classification'],
                      ['Features',`${FEATURES.length} input dimensions`],
                      ['Training data','ESG filings 2020–2025, 40+ sectors'],
                      ['Version','v2.4.1'],
                      ['Last retrained',RETRAINING_LOG[RETRAINING_LOG.length-1]?.date||'—'],
                    ].map(([k,v])=>(
                      <div key={k} style={{display:'flex',gap:8,marginBottom:4}}>
                        <div style={{fontSize:11,color:T.textMut,width:120,flexShrink:0,fontFamily:T.mono}}>{k}</div>
                        <div style={{fontSize:11,color:T.textSec}}>{v}</div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div style={{fontWeight:700,color:T.navy,fontSize:12,marginBottom:8,fontFamily:T.mono}}>PERFORMANCE METRICS</div>
                    {MODELS.map(m=>(
                      <div key={m.name} style={{marginBottom:8}}>
                        <div style={{fontSize:11,fontWeight:600,color:T.navy,marginBottom:2}}>{m.name}</div>
                        <div style={{display:'flex',gap:12}}>
                          {[['Acc',m.accuracy],['P',m.precision],['R',m.recall],['F1',m.f1],['AUC',m.auc]].map(([lbl,val])=>(
                            <div key={lbl} style={{textAlign:'center'}}>
                              <div style={{fontSize:10,color:T.textMut,fontFamily:T.mono}}>{lbl}</div>
                              <div style={{fontSize:11,fontWeight:700,color:T.navyL,fontFamily:T.mono}}>{(val*100).toFixed(1)}%</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div style={{fontWeight:700,color:T.navy,fontSize:12,marginBottom:8,fontFamily:T.mono}}>BIAS & FAIRNESS AUDIT</div>
                    {[
                      {check:'Sector bias test',status:'PASSED',color:T.green},
                      {check:'Region bias test',status:'PASSED',color:T.green},
                      {check:'Size bias (large vs SME)',status:'WARN',color:T.amber},
                      {check:'Data completeness',status:'PASSED',color:T.green},
                      {check:'Label quality audit',status:'PASSED',color:T.green},
                      {check:'Calibration test',status:'PASSED',color:T.green},
                    ].map(item=>(
                      <div key={item.check} style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4,padding:'3px 0',borderBottom:`1px solid ${T.border}`}}>
                        <span style={{fontSize:11,color:T.textSec}}>{item.check}</span>
                        {pill(item.status,item.color)}
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{background:T.surfaceH,borderRadius:6,padding:12,borderLeft:`3px solid ${T.gold}`}}>
                  <div style={{fontWeight:700,color:T.navy,fontSize:12,marginBottom:6,fontFamily:T.mono}}>USAGE GUIDANCE & LIMITATIONS</div>
                  <div style={{fontSize:11,color:T.textSec,lineHeight:1.7}}>
                    This model is intended for internal ESG materiality prioritization only. It should not be used as the sole basis for regulatory reporting (CSRD/SFDR/ISSB). Performance may degrade for companies with fewer than 2 years of ESG disclosure history. Size bias toward large-cap entities detected — apply manual review for SME classifications. Model outputs are probabilistic; confidence intervals should be considered. Retrain trigger: PSI &gt; 0.20 on any primary feature or concept drift index &gt; 0.20.
                  </div>
                </div>
              </div>
            </Section>
            <Section title="AUDIT LOG">
              <div style={s.card}>
                <table style={s.table}>
                  <thead><tr><th style={s.th}>Timestamp</th><th style={s.th}>Event</th><th style={s.th}>User</th><th style={s.th}>Entity</th><th style={s.th}>Action</th><th style={s.th}>Status</th></tr></thead>
                  <tbody>
                    {Array.from({length:12},(_,i)=>{
                      const h=hashStr(`audit_${i}`);
                      const events=['Prediction run','Model retrain','Feature update','Score override','Threshold change','Explanation requested','Export triggered','Model deployed','Bias audit','Calibration check','Data refresh','Drift check'];
                      const users=['analyst@firm.com','quant@firm.com','risk@firm.com','admin@firm.com','compliance@firm.com'];
                      const actions=['Automated ML pipeline execution','Manual review override','Regulatory disclosure check','Scheduled batch inference','Feature engineering update','Stakeholder report generation'];
                      const entity=ENTITIES[Math.floor(sr(h*7)*40)];
                      return (
                        <tr key={i}>
                          <td style={{padding:'7px 10px',borderBottom:`1px solid ${T.border}`,color:T.textSec,fontFamily:T.mono,fontSize:10}}>2026-04-{String(Math.max(1,17-i)).padStart(2,'0')} {String(9+i%12).padStart(2,'0')}:23:14</td>
                          <td style={{padding:'7px 10px',borderBottom:`1px solid ${T.border}`,color:T.textSec}}>{events[i%12]}</td>
                          <td style={{padding:'7px 10px',borderBottom:`1px solid ${T.border}`,color:T.textSec,fontFamily:T.mono,fontSize:10}}>{users[Math.floor(sr(h*11)*5)]}</td>
                          <td style={{padding:'7px 10px',borderBottom:`1px solid ${T.border}`,color:T.navy,fontFamily:T.mono}}>{entity.id}</td>
                          <td style={{padding:'7px 10px',borderBottom:`1px solid ${T.border}`,color:T.textSec,fontSize:11}}>{actions[Math.floor(sr(h*13)*6)]}</td>
                          <td style={{padding:'7px 10px',borderBottom:`1px solid ${T.border}`}}>{pill(sr(h*17)>0.1?'SUCCESS':'WARN',sr(h*17)>0.1?T.green:T.amber)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Section>
          </div>
        )}

      </div>
    </div>
  );
}
