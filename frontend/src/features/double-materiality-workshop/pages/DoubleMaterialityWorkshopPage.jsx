import React,{useState,useMemo} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,ScatterChart,Scatter,Cell,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis,Legend} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',purple:'#7c3aed',teal:'#0e7490',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

const ESRS_TOPICS=[
  {id:'E1',name:'Climate Change',pillar:'E',standard:'ESRS E1',subtopics:['Climate adaptation','Climate mitigation','Energy'],color:'#0891b2',mandatory:true},
  {id:'E2',name:'Pollution',pillar:'E',standard:'ESRS E2',subtopics:['Air pollution','Water pollution','Soil pollution','Substances of concern'],color:'#7c3aed',mandatory:false},
  {id:'E3',name:'Water & Marine',pillar:'E',standard:'ESRS E3',subtopics:['Water consumption','Water withdrawals','Marine resources'],color:'#0e7490',mandatory:false},
  {id:'E4',name:'Biodiversity & Ecosystems',pillar:'E',standard:'ESRS E4',subtopics:['Direct drivers','Impacts on ecosystem','Dependency on ecosystem'],color:'#16a34a',mandatory:false},
  {id:'E5',name:'Resource Use & Circular Economy',pillar:'E',standard:'ESRS E5',subtopics:['Resource inflows','Resource outflows','Waste'],color:'#b45309',mandatory:false},
  {id:'S1',name:'Own Workforce',pillar:'S',standard:'ESRS S1',subtopics:['Working conditions','Equal treatment','Other work-related rights'],color:'#dc2626',mandatory:false},
  {id:'S2',name:'Value Chain Workers',pillar:'S',standard:'ESRS S2',subtopics:['Working conditions','Equal treatment','Other work-related rights'],color:'#ea580c',mandatory:false},
  {id:'S3',name:'Affected Communities',pillar:'S',standard:'ESRS S3',subtopics:['Communities economic/social rights','Communities civil/political rights','Indigenous peoples rights'],color:'#d97706',mandatory:false},
  {id:'S4',name:'Consumers & End-users',pillar:'S',standard:'ESRS S4',subtopics:['Consumer information','Personal safety','Social inclusion'],color:'#c5a96a',mandatory:false},
  {id:'G1',name:'Business Conduct',pillar:'G',standard:'ESRS G1',subtopics:['Corporate culture','Whistleblower protection','Bribery & corruption','Lobbying','Supplier relationships'],color:'#6366f1',mandatory:true},
];

const IRO_TYPES=['Actual Negative Impact','Potential Negative Impact','Actual Positive Impact','Potential Positive Impact','Risk','Opportunity'];

const genTopicScores=(n)=>ESRS_TOPICS.map((t,ti)=>({
  ...t,
  impact:+(sr(n*31+ti*7)*3.5+1).toFixed(1),
  financial:+(sr(n*37+ti*11)*3.5+1).toFixed(1),
  completeness:Math.floor(sr(n*41+ti*5)*50+45),
  iros:IRO_TYPES.map((iro,ii)=>({type:iro,score:+(sr(n*43+ti*13+ii*7)*3+1).toFixed(1),identified:sr(n*47+ti*17+ii*11)>0.45})),
  dpCoverage:Math.floor(sr(n*53+ti*19)*40+55),
  stakeholders:['Own assessment','Employee survey','External consultant','Sector benchmarks'].filter((_,si)=>sr(n*59+ti*23+si*7)>0.4),
}));

const SECTOR_SCORES=genTopicScores(1);

const NACE_TRIGGERS={E1:['B','C','D','E'],E2:['B','C','D'],E3:['A','B','C'],E4:['A','B','F'],E5:['C','E','G'],S1:['ALL'],S2:['ALL'],S3:['A','B','F'],S4:['G','H','I'],G1:['ALL']};

const pill=(color,text,sm)=>({display:'inline-block',padding:sm?'1px 7px':'2px 10px',borderRadius:10,fontSize:sm?10:11,fontWeight:600,background:color+'18',color,border:`1px solid ${color}30`});
const scoreColor=(s)=>s>=3.5?T.red:s>=2.5?T.amber:s>=1.5?T.gold:T.green;
const matQuadrant=(imp,fin)=>{
  if(imp>=2.5&&fin>=2.5)return{label:'Material (Both)',color:T.red};
  if(imp>=2.5)return{label:'Impact Material',color:'#ea580c'};
  if(fin>=2.5)return{label:'Financial Material',color:T.amber};
  return{label:'Not Material',color:T.textMut};
};

export default function DoubleMaterialityWorkshopPage(){
  const [tab,setTab]=useState(0);
  const TABS=['Materiality Assessment','IRO Registry','Materiality Matrix','ESRS Gap Analysis'];

  return(
    <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:24,color:T.text}}>
      <div style={{maxWidth:1440,margin:'0 auto'}}>
        <div style={{marginBottom:24}}>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:6}}>
            <span style={{fontFamily:T.mono,fontSize:11,color:T.gold,fontWeight:700,background:T.navy,padding:'3px 10px',borderRadius:4}}>EP-AZ1</span>
            <span style={{fontFamily:T.mono,fontSize:11,color:T.textMut}}>CSRD · ESRS 1 · EFRAG IG 1 · DOUBLE MATERIALITY ASSESSMENT WORKSHOP</span>
          </div>
          <h1 style={{fontSize:26,fontWeight:700,color:T.navy,margin:0}}>Double Materiality Workshop</h1>
          <p style={{color:T.textSec,fontSize:14,margin:'4px 0 0'}}>ESRS 1 impact & financial materiality — IRO identification, materiality matrix, and ESRS gap scoring</p>
        </div>
        <div style={{display:'flex',gap:4,marginBottom:24,background:T.surface,borderRadius:10,padding:4,border:`1px solid ${T.border}`}}>
          {TABS.map((t,i)=>(
            <button key={i} onClick={()=>setTab(i)} style={{flex:1,padding:'10px 16px',borderRadius:8,border:'none',cursor:'pointer',fontSize:13,fontWeight:tab===i?700:500,background:tab===i?T.navy:'transparent',color:tab===i?'#fff':T.textSec,transition:'all 0.2s'}}>
              {t}
            </button>
          ))}
        </div>
        {tab===0&&<MaterialityAssessment scores={SECTOR_SCORES}/>}
        {tab===1&&<IroRegistry scores={SECTOR_SCORES}/>}
        {tab===2&&<MaterialityMatrix scores={SECTOR_SCORES}/>}
        {tab===3&&<EsrsGapAnalysis scores={SECTOR_SCORES}/>}
      </div>
    </div>
  );
}

/* ===== TAB 1: MATERIALITY ASSESSMENT ===== */
function MaterialityAssessment({scores}){
  const [selected,setSelected]=useState(null);
  const [editTopic,setEditTopic]=useState(null);
  const [localScores,setLocalScores]=useState(()=>scores.map(s=>({...s})));

  const material=localScores.filter(s=>s.impact>=2.5||s.financial>=2.5).length;
  const bothMaterial=localScores.filter(s=>s.impact>=2.5&&s.financial>=2.5).length;
  const avgImpact=+(localScores.reduce((a,s)=>a+s.impact,0)/ Math.max(1, localScores.length)).toFixed(1);
  const avgFinancial=+(localScores.reduce((a,s)=>a+s.financial,0)/ Math.max(1, localScores.length)).toFixed(1);

  const updateScore=(id,field,val)=>{
    setLocalScores(prev=>prev.map(s=>s.id===id?{...s,[field]:+val}:s));
  };

  const pillarGroups=[
    {pillar:'E',label:'Environmental',topics:localScores.filter(s=>s.pillar==='E'),color:'#16a34a'},
    {pillar:'S',label:'Social',topics:localScores.filter(s=>s.pillar==='S'),color:'#dc2626'},
    {pillar:'G',label:'Governance',topics:localScores.filter(s=>s.pillar==='G'),color:'#6366f1'},
  ];

  return(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:24}}>
        {[
          {label:'Material Topics',value:material,sub:`of ${ESRS_TOPICS.length} ESRS topics`,color:T.red},
          {label:'Doubly Material',value:bothMaterial,sub:'Impact + Financial both ≥2.5',color:'#ea580c'},
          {label:'Avg Impact Score',value:avgImpact+'/5',sub:'EFRAG IG 1 scale',color:scoreColor(avgImpact)},
          {label:'Avg Financial Score',value:avgFinancial+'/5',sub:'Risk + Opportunity',color:scoreColor(avgFinancial)},
        ].map((kpi,i)=>(
          <div key={i} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:'16px 20px'}}>
            <div style={{fontSize:11,fontWeight:600,color:T.textMut,textTransform:'uppercase',letterSpacing:0.5,marginBottom:6}}>{kpi.label}</div>
            <div style={{fontSize:26,fontWeight:700,color:kpi.color,fontFamily:T.mono}}>{kpi.value}</div>
            <div style={{fontSize:12,color:T.textSec,marginTop:2}}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 380px',gap:20,marginBottom:20}}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:4}}>Impact vs Financial Materiality — All ESRS Topics</div>
          <div style={{fontSize:12,color:T.textSec,marginBottom:16}}>Scores 1–5 · Threshold: 2.5 · Click row to expand IRO detail</div>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
            <thead>
              <tr style={{borderBottom:`2px solid ${T.border}`}}>
                {['Topic','Standard','Impact Mat.','Financial Mat.','Quadrant','Completeness','Mandatory'].map(h=>(
                  <th key={h} style={{padding:'8px 12px',textAlign:'left',fontSize:10,fontWeight:700,color:T.textMut,textTransform:'uppercase',letterSpacing:0.4}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {localScores.map(s=>{
                const q=matQuadrant(s.impact,s.financial);
                const expanded=selected===s.id;
                return(
                  <React.Fragment key={s.id}>
                    <tr onClick={()=>setSelected(expanded?null:s.id)} style={{borderBottom:`1px solid ${T.borderL}`,cursor:'pointer',background:expanded?T.surfaceH:'transparent'}}>
                      <td style={{padding:'10px 12px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <span style={{width:10,height:10,borderRadius:'50%',background:s.color,display:'inline-block',flexShrink:0}}/>
                          <span style={{fontWeight:700,color:T.navy,fontSize:13}}>{s.id}</span>
                          <span style={{fontSize:12,color:T.textSec}}>{s.name}</span>
                        </div>
                      </td>
                      <td style={{padding:'10px 12px',fontFamily:T.mono,fontSize:11,color:T.textMut}}>{s.standard}</td>
                      <td style={{padding:'10px 12px'}}>
                        {editTopic===s.id?(
                          <input type="number" min={1} max={5} step={0.1} value={s.impact} onChange={e=>updateScore(s.id,'impact',e.target.value)} onClick={e=>e.stopPropagation()} style={{width:60,padding:'3px 6px',borderRadius:4,border:`1px solid ${T.border}`,fontFamily:T.mono,fontSize:12}}/>
                        ):(
                          <span style={{fontFamily:T.mono,fontWeight:700,fontSize:14,color:scoreColor(s.impact)}}>{s.impact}</span>
                        )}
                      </td>
                      <td style={{padding:'10px 12px'}}>
                        {editTopic===s.id?(
                          <input type="number" min={1} max={5} step={0.1} value={s.financial} onChange={e=>updateScore(s.id,'financial',e.target.value)} onClick={e=>e.stopPropagation()} style={{width:60,padding:'3px 6px',borderRadius:4,border:`1px solid ${T.border}`,fontFamily:T.mono,fontSize:12}}/>
                        ):(
                          <span style={{fontFamily:T.mono,fontWeight:700,fontSize:14,color:scoreColor(s.financial)}}>{s.financial}</span>
                        )}
                      </td>
                      <td style={{padding:'10px 12px'}}><span style={pill(q.color,q.label,true)}>{q.label}</span></td>
                      <td style={{padding:'10px 12px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:6}}>
                          <div style={{width:60,height:5,background:T.borderL,borderRadius:3,overflow:'hidden'}}>
                            <div style={{width:s.completeness+'%',height:'100%',background:s.completeness>=75?T.green:s.completeness>=50?T.amber:T.red,borderRadius:3}}/>
                          </div>
                          <span style={{fontFamily:T.mono,fontSize:11,color:T.textSec}}>{s.completeness}%</span>
                        </div>
                      </td>
                      <td style={{padding:'10px 12px',textAlign:'center'}}>
                        <span style={pill(s.mandatory?T.navy:T.textMut,s.mandatory?'Yes':'No',true)}>{s.mandatory?'Yes':'No'}</span>
                      </td>
                    </tr>
                    {expanded&&(
                      <tr style={{background:T.surfaceH}}>
                        <td colSpan={7} style={{padding:'12px 20px'}}>
                          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                            <div>
                              <div style={{fontSize:11,fontWeight:700,color:T.textMut,marginBottom:8}}>SUB-TOPICS</div>
                              <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                                {s.subtopics.map((st,i)=><span key={i} style={pill(s.color,st,true)}>{st}</span>)}
                              </div>
                              <div style={{fontSize:11,fontWeight:700,color:T.textMut,marginBottom:8,marginTop:12}}>NACE TRIGGERS</div>
                              <div style={{fontFamily:T.mono,fontSize:12,color:T.navy}}>{(NACE_TRIGGERS[s.id]||[]).join(', ')}</div>
                            </div>
                            <div>
                              <div style={{fontSize:11,fontWeight:700,color:T.textMut,marginBottom:8}}>STAKEHOLDER INPUTS</div>
                              <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                                {s.stakeholders.map((sk,i)=><span key={i} style={pill(T.teal,sk,true)}>{sk}</span>)}
                              </div>
                              <div style={{marginTop:12}}>
                                <button onClick={e=>{e.stopPropagation();setEditTopic(editTopic===s.id?null:s.id);}} style={{padding:'6px 14px',borderRadius:6,background:T.navy,color:'#fff',border:'none',cursor:'pointer',fontSize:12,fontWeight:600}}>
                                  {editTopic===s.id?'Save Scores':'Edit Scores'}
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        <div>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20,marginBottom:16}}>
            <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:16}}>Materiality by Pillar</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={pillarGroups.map(pg=>({pillar:pg.label,impact:+(pg.topics.reduce((a,t)=>a+t.impact,0)/pg.topics.length).toFixed(1),financial:+(pg.topics.reduce((a,t)=>a+t.financial,0)/pg.topics.length).toFixed(1)}))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                <XAxis dataKey="pillar" style={{fontSize:12}}/>
                <YAxis domain={[0,5]} style={{fontSize:11}}/>
                <Tooltip/>
                <Legend/>
                <Bar dataKey="impact" name="Impact" fill={T.red} radius={[4,4,0,0]}/>
                <Bar dataKey="financial" name="Financial" fill={T.navy} radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
            <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Assessment Summary</div>
            {[
              {label:'Topics assessed',value:`${ESRS_TOPICS.length}/10`},
              {label:'Impact material (≥2.5)',value:localScores.filter(s=>s.impact>=2.5).length},
              {label:'Financially material (≥2.5)',value:localScores.filter(s=>s.financial>=2.5).length},
              {label:'Mandatory disclosures',value:localScores.filter(s=>s.mandatory).length},
              {label:'Avg data completeness',value:Math.round(localScores.reduce((a,s)=>a+s.completeness,0)/ Math.max(1, localScores.length))+'%'},
              {label:'EFRAG IG 1 compliant',value:localScores.filter(s=>s.stakeholders.length>=2).length+' topics'},
            ].map((f,i)=>(
              <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'8px 12px',background:i%2===0?T.surfaceH:'transparent',borderRadius:6,marginBottom:2}}>
                <span style={{fontSize:12,color:T.textSec}}>{f.label}</span>
                <span style={{fontFamily:T.mono,fontSize:13,fontWeight:700,color:T.navy}}>{f.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===== TAB 2: IRO REGISTRY ===== */
function IroRegistry({scores}){
  const [selTopic,setSelTopic]=useState('E1');
  const [typeFilter,setTypeFilter]=useState('All');

  const topic=scores.find(s=>s.id===selTopic)||scores[0];
  const allIros=scores.flatMap(s=>s.iros.filter(i=>i.identified).map(i=>({...i,topic:s.id,topicName:s.name,topicColor:s.color})));
  const filtered=typeFilter==='All'?allIros:allIros.filter(i=>i.type===typeFilter);

  const iroTypeCounts=IRO_TYPES.map(t=>({type:t,count:allIros.filter(i=>i.type===t).length}));
  const iroTypeColor=(t)=>t.includes('Negative')||t==='Risk'?T.red:t.includes('Positive')||t==='Opportunity'?T.green:T.amber;

  return(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:24}}>
        {[
          {label:'Total IROs Identified',value:allIros.length,sub:'Across all ESRS topics',color:T.navy},
          {label:'Risks & Neg. Impacts',value:allIros.filter(i=>i.type.includes('Negative')||i.type==='Risk').length,sub:'Require action plans',color:T.red},
          {label:'Opportunities',value:allIros.filter(i=>i.type==='Opportunity').length,sub:'Positive impacts',color:T.green},
        ].map((kpi,i)=>(
          <div key={i} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:'16px 20px'}}>
            <div style={{fontSize:11,fontWeight:600,color:T.textMut,textTransform:'uppercase',letterSpacing:0.5,marginBottom:6}}>{kpi.label}</div>
            <div style={{fontSize:26,fontWeight:700,color:kpi.color,fontFamily:T.mono}}>{kpi.value}</div>
            <div style={{fontSize:12,color:T.textSec,marginTop:2}}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'280px 1fr',gap:20,marginBottom:20}}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>IRO Type Distribution</div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {iroTypeCounts.map((tc,i)=>(
              <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'7px 10px',background:T.surfaceH,borderRadius:7}}>
                <span style={{fontSize:11,color:T.text}}>{tc.type}</span>
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  <div style={{width:40,height:4,background:T.borderL,borderRadius:2,overflow:'hidden'}}>
                    <div style={{width:(allIros.length?tc.count/allIros.length*100:0)+'%',height:'100%',background:iroTypeColor(tc.type),borderRadius:2}}/>
                  </div>
                  <span style={{fontFamily:T.mono,fontSize:12,fontWeight:700,color:iroTypeColor(tc.type),minWidth:16}}>{tc.count}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{marginTop:16,borderTop:`1px solid ${T.border}`,paddingTop:12}}>
            <div style={{fontSize:11,fontWeight:700,color:T.textMut,marginBottom:8}}>FILTER BY TOPIC</div>
            {scores.map(s=>(
              <div key={s.id} onClick={()=>setSelTopic(s.id)} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 8px',borderRadius:6,cursor:'pointer',background:selTopic===s.id?T.navy:'transparent',marginBottom:2}}>
                <span style={{width:8,height:8,borderRadius:'50%',background:s.color,flexShrink:0}}/>
                <span style={{fontSize:12,color:selTopic===s.id?'#fff':T.text,fontWeight:selTopic===s.id?700:400}}>{s.id} {s.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
          <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
            <div style={{fontSize:13,fontWeight:700,color:T.navy}}>IRO Register</div>
            <div style={{display:'flex',gap:6,marginLeft:'auto'}}>
              {['All',...IRO_TYPES].map(t=>(
                <button key={t} onClick={()=>setTypeFilter(t)} style={{padding:'4px 10px',borderRadius:6,border:'none',cursor:'pointer',fontSize:11,fontWeight:typeFilter===t?700:400,background:typeFilter===t?T.navy:'transparent',color:typeFilter===t?'#fff':T.textSec}}>
                  {t==='All'?'All':t.split(' ').slice(-1)[0]}
                </button>
              ))}
            </div>
          </div>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
            <thead>
              <tr style={{borderBottom:`2px solid ${T.border}`}}>
                {['Topic','IRO Type','Severity Score','Time Horizon','Reversibility','Action Required'].map(h=>(
                  <th key={h} style={{padding:'7px 10px',textAlign:'left',fontSize:10,fontWeight:700,color:T.textMut,textTransform:'uppercase',letterSpacing:0.4}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((iro,i)=>(
                <tr key={i} style={{borderBottom:`1px solid ${T.borderL}`}}>
                  <td style={{padding:'9px 10px'}}>
                    <span style={{display:'inline-flex',alignItems:'center',gap:5}}>
                      <span style={{width:8,height:8,borderRadius:'50%',background:iro.topicColor,display:'inline-block'}}/>
                      <span style={{fontFamily:T.mono,fontSize:11,fontWeight:700,color:T.navy}}>{iro.topic}</span>
                    </span>
                  </td>
                  <td style={{padding:'9px 10px'}}><span style={pill(iroTypeColor(iro.type),iro.type,true)}>{iro.type}</span></td>
                  <td style={{padding:'9px 10px',fontFamily:T.mono,fontWeight:700,color:scoreColor(iro.score)}}>{iro.score}/5</td>
                  <td style={{padding:'9px 10px',fontSize:11,color:T.textSec}}>
                    {['Short-term (<1yr)','Medium-term (1-5yr)','Long-term (>5yr)'][Math.floor(sr(i*31+7)*3)]}
                  </td>
                  <td style={{padding:'9px 10px'}}><span style={pill(sr(i*37+11)>0.5?T.red:T.amber,sr(i*37+11)>0.5?'Irreversible':'Reversible',true)}>{sr(i*37+11)>0.5?'Irreversible':'Reversible'}</span></td>
                  <td style={{padding:'9px 10px'}}>
                    {iro.type.includes('Negative')||iro.type==='Risk'
                      ?<span style={pill(T.red,'Action Plan Required',true)}>Action Plan</span>
                      :<span style={pill(T.green,'Monitor',true)}>Monitor</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ===== TAB 3: MATERIALITY MATRIX ===== */
function MaterialityMatrix({scores}){
  const [hovered,setHovered]=useState(null);

  const scatterData=scores.map(s=>({id:s.id,name:s.name,x:s.financial,y:s.impact,color:s.color,pillar:s.pillar}));

  const quadrants=[
    {x:2.5,y:2.5,label:'Doubly Material',color:T.red,desc:'Disclose under both impact & financial materiality'},
    {x:0,y:2.5,label:'Impact Only',color:'#ea580c',desc:'Material for impact reporting — ESRS mandatory'},
    {x:2.5,y:0,label:'Financial Only',color:T.amber,desc:'Material for financial risk/opportunity disclosure'},
    {x:0,y:0,label:'Not Material',color:T.textMut,desc:'May omit with documented justification (ESRS 1 §31)'},
  ];

  return(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:24}}>
        {quadrants.map((q,i)=>(
          <div key={i} style={{background:T.surface,border:`2px solid ${q.color}30`,borderRadius:12,padding:'14px 18px'}}>
            <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:8}}>
              <span style={{width:10,height:10,borderRadius:'50%',background:q.color,flexShrink:0}}/>
              <span style={{fontWeight:700,color:T.navy,fontSize:13}}>{q.label}</span>
            </div>
            <div style={{fontSize:26,fontWeight:700,color:q.color,fontFamily:T.mono,marginBottom:4}}>
              {scores.filter(s=>(q.label==='Doubly Material'?(s.impact>=2.5&&s.financial>=2.5):q.label==='Impact Only'?(s.impact>=2.5&&s.financial<2.5):q.label==='Financial Only'?(s.financial>=2.5&&s.impact<2.5):(s.impact<2.5&&s.financial<2.5))).length}
            </div>
            <div style={{fontSize:11,color:T.textSec}}>{q.desc}</div>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 340px',gap:20}}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:4}}>Materiality Matrix — EFRAG IG 1</div>
          <div style={{fontSize:12,color:T.textSec,marginBottom:8}}>X-axis: Financial Materiality · Y-axis: Impact Materiality · Threshold: 2.5</div>
          <div style={{position:'relative',background:T.surfaceH,borderRadius:10,height:360,border:`1px solid ${T.border}`,overflow:'hidden'}}>
            {/* Quadrant backgrounds */}
            <div style={{position:'absolute',left:'50%',top:0,right:0,bottom:'50%',background:T.amber+'10'}}/>
            <div style={{position:'absolute',left:0,top:0,right:'50%',bottom:'50%',background:T.red+'10'}}/>
            <div style={{position:'absolute',left:0,top:'50%',right:'50%',bottom:0,background:'#ea580c10'}}/>
            {/* Threshold lines */}
            <div style={{position:'absolute',left:'50%',top:0,bottom:0,borderLeft:`1px dashed ${T.borderL}`,pointerEvents:'none'}}/>
            <div style={{position:'absolute',left:0,right:0,top:'50%',borderTop:`1px dashed ${T.borderL}`,pointerEvents:'none'}}/>
            {/* Quadrant labels */}
            <div style={{position:'absolute',top:8,left:8,fontSize:10,color:T.red,fontWeight:700,opacity:0.6}}>DOUBLY MATERIAL</div>
            <div style={{position:'absolute',top:8,right:8,fontSize:10,color:T.amber,fontWeight:700,opacity:0.6}}>FINANCIAL ONLY</div>
            <div style={{position:'absolute',bottom:8,left:8,fontSize:10,color:'#ea580c',fontWeight:700,opacity:0.6}}>IMPACT ONLY</div>
            <div style={{position:'absolute',bottom:8,right:8,fontSize:10,color:T.textMut,fontWeight:700,opacity:0.6}}>NOT MATERIAL</div>
            {/* Axis labels */}
            <div style={{position:'absolute',bottom:2,left:'50%',transform:'translateX(-50%)',fontSize:10,color:T.textMut}}>Financial Materiality →</div>
            {/* Dots */}
            {scatterData.map(d=>{
              const x=((d.x-1)/4)*80+10;
              const y=100-((d.y-1)/4)*80-10;
              return(
                <div key={d.id} onMouseEnter={()=>setHovered(d)} onMouseLeave={()=>setHovered(null)}
                  style={{position:'absolute',left:`${x}%`,top:`${y}%`,transform:'translate(-50%,-50%)',width:28,height:28,borderRadius:'50%',background:d.color,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',border:`2px solid white`,boxShadow:'0 1px 4px rgba(0,0,0,0.2)',transition:'transform 0.15s',zIndex:hovered?.id===d.id?10:1,transform:hovered?.id===d.id?'translate(-50%,-50%) scale(1.3)':'translate(-50%,-50%)'}}>
                  <span style={{fontSize:9,fontWeight:700,color:'#fff'}}>{d.id}</span>
                </div>
              );
            })}
            {hovered&&(
              <div style={{position:'absolute',top:8,right:8,background:T.navy,color:'#fff',padding:'8px 12px',borderRadius:8,fontSize:12,minWidth:160,zIndex:20}}>
                <div style={{fontWeight:700}}>{hovered.id} — {hovered.name}</div>
                <div style={{fontSize:11,marginTop:4,opacity:0.8}}>Impact: {hovered.y} · Financial: {hovered.x}</div>
                <div style={{fontSize:11,opacity:0.7}}>{matQuadrant(hovered.y,hovered.x).label}</div>
              </div>
            )}
          </div>
        </div>

        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:16}}>Topic Scores</div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {scatterData.sort((a,b)=>(b.x+b.y)-(a.x+a.y)).map(d=>{
              const q=matQuadrant(d.y,d.x);
              return(
                <div key={d.id} style={{padding:'10px 12px',background:T.surfaceH,borderRadius:8,border:`1px solid ${T.borderL}`}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <span style={{width:10,height:10,borderRadius:'50%',background:d.color,display:'inline-block'}}/>
                      <span style={{fontWeight:700,color:T.navy,fontSize:12}}>{d.id}</span>
                      <span style={{fontSize:11,color:T.textSec}}>{d.name}</span>
                    </div>
                    <span style={pill(q.color,q.label.split(' ')[0],true)}>{q.label.split(' ')[0]}</span>
                  </div>
                  <div style={{display:'flex',gap:12}}>
                    <div style={{flex:1}}>
                      <div style={{fontSize:9,color:T.textMut,marginBottom:2}}>IMPACT</div>
                      <div style={{height:4,background:T.borderL,borderRadius:2,overflow:'hidden'}}>
                        <div style={{width:(d.y/5*100)+'%',height:'100%',background:scoreColor(d.y),borderRadius:2}}/>
                      </div>
                      <div style={{fontSize:10,fontFamily:T.mono,color:scoreColor(d.y),marginTop:2}}>{d.y}/5</div>
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:9,color:T.textMut,marginBottom:2}}>FINANCIAL</div>
                      <div style={{height:4,background:T.borderL,borderRadius:2,overflow:'hidden'}}>
                        <div style={{width:(d.x/5*100)+'%',height:'100%',background:scoreColor(d.x),borderRadius:2}}/>
                      </div>
                      <div style={{fontSize:10,fontFamily:T.mono,color:scoreColor(d.x),marginTop:2}}>{d.x}/5</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===== TAB 4: ESRS GAP ANALYSIS ===== */
function EsrsGapAnalysis({scores}){
  const mandatory_dps=[
    {esrs:'ESRS 2',dp:'GOV-1',title:'Governance structure & board oversight',required:true,covered:sr(11+7)>0.4},
    {esrs:'ESRS 2',dp:'GOV-2',title:'Management roles in sustainability',required:true,covered:sr(11+11)>0.5},
    {esrs:'ESRS 2',dp:'GOV-3',title:'Sustainability in corporate strategy',required:true,covered:sr(11+13)>0.45},
    {esrs:'ESRS 2',dp:'GOV-4',title:'Statement on due diligence',required:true,covered:sr(11+17)>0.55},
    {esrs:'ESRS 2',dp:'GOV-5',title:'Risk management & internal controls',required:true,covered:sr(11+19)>0.4},
    {esrs:'ESRS 2',dp:'SBM-1',title:'Strategy, business model & value chain',required:true,covered:sr(11+23)>0.5},
    {esrs:'ESRS 2',dp:'SBM-2',title:'Interests & views of stakeholders',required:true,covered:sr(11+29)>0.45},
    {esrs:'ESRS 2',dp:'SBM-3',title:'Material impacts, risks & opportunities',required:true,covered:sr(11+31)>0.4},
    {esrs:'ESRS E1',dp:'E1-1',title:'Transition plan for climate change mitigation',required:true,covered:sr(11+37)>0.5},
    {esrs:'ESRS E1',dp:'E1-2',title:'Policies related to climate change',required:true,covered:sr(11+41)>0.55},
    {esrs:'ESRS E1',dp:'E1-3',title:'Actions and resources (climate)',required:true,covered:sr(11+43)>0.4},
    {esrs:'ESRS E1',dp:'E1-4',title:'Targets related to climate change',required:true,covered:sr(11+47)>0.5},
    {esrs:'ESRS E1',dp:'E1-5',title:'Energy consumption & mix',required:true,covered:sr(11+53)>0.45},
    {esrs:'ESRS E1',dp:'E1-6',title:'Gross Scopes 1, 2, 3 & total GHG emissions',required:true,covered:sr(11+59)>0.5},
    {esrs:'ESRS E1',dp:'E1-7',title:'GHG removals and carbon credits',required:false,covered:sr(11+61)>0.6},
    {esrs:'ESRS E1',dp:'E1-8',title:'Internal carbon pricing',required:false,covered:sr(11+67)>0.55},
    {esrs:'ESRS G1',dp:'G1-1',title:'Business conduct policies',required:true,covered:sr(11+71)>0.5},
    {esrs:'ESRS G1',dp:'G1-4',title:'Incidents of corruption or bribery',required:true,covered:sr(11+73)>0.45},
    {esrs:'ESRS G1',dp:'G1-5',title:'Political influence & lobbying',required:false,covered:sr(11+79)>0.55},
    {esrs:'ESRS G1',dp:'G1-6',title:'Payment practices',required:true,covered:sr(11+83)>0.5},
    {esrs:'ESRS S1',dp:'S1-1',title:'Policies related to own workforce',required:false,covered:sr(11+89)>0.4},
    {esrs:'ESRS S1',dp:'S1-6',title:'Characteristics of non-employee workers',required:false,covered:sr(11+97)>0.5},
    {esrs:'ESRS S1',dp:'S1-7',title:'Characteristics of employees',required:true,covered:sr(11+101)>0.45},
  ];

  const esrsGroups=['ESRS 2','ESRS E1','ESRS E2','ESRS G1','ESRS S1'];
  const grouped=esrsGroups.map(g=>({
    esrs:g,
    total:mandatory_dps.filter(dp=>dp.esrs===g).length,
    covered:mandatory_dps.filter(dp=>dp.esrs===g&&dp.covered).length,
  }));

  const totalRequired=mandatory_dps.filter(dp=>dp.required).length;
  const coveredRequired=mandatory_dps.filter(dp=>dp.required&&dp.covered).length;
  const totalOptional=mandatory_dps.filter(dp=>!dp.required).length;
  const coveredOptional=mandatory_dps.filter(dp=>!dp.required&&dp.covered).length;

  return(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:24}}>
        {[
          {label:'Mandatory DPs Covered',value:`${coveredRequired}/${totalRequired}`,color:coveredRequired/totalRequired>=0.8?T.green:T.amber},
          {label:'Optional DPs Covered',value:`${coveredOptional}/${totalOptional}`,color:T.navy},
          {label:'Overall Gap',value:Math.round((mandatory_dps.length-mandatory_dps.filter(dp=>dp.covered).length)/ Math.max(1, mandatory_dps.length)*100)+'%',color:T.red},
          {label:'CSRD Readiness',value:Math.round(mandatory_dps.filter(dp=>dp.covered).length/ Math.max(1, mandatory_dps.length)*100)+'%',color:T.green},
        ].map((kpi,i)=>(
          <div key={i} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:'16px 20px'}}>
            <div style={{fontSize:11,fontWeight:600,color:T.textMut,textTransform:'uppercase',letterSpacing:0.5,marginBottom:6}}>{kpi.label}</div>
            <div style={{fontSize:26,fontWeight:700,color:kpi.color,fontFamily:T.mono}}>{kpi.value}</div>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 300px',gap:20}}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:16}}>ESRS Data Point Coverage</div>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
            <thead>
              <tr style={{borderBottom:`2px solid ${T.border}`}}>
                {['ESRS Standard','DP Reference','Data Point','Required','Status'].map(h=>(
                  <th key={h} style={{padding:'7px 10px',textAlign:'left',fontSize:10,fontWeight:700,color:T.textMut,textTransform:'uppercase',letterSpacing:0.4}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mandatory_dps.map((dp,i)=>(
                <tr key={i} style={{borderBottom:`1px solid ${T.borderL}`,background:dp.covered?'transparent':T.red+'05'}}>
                  <td style={{padding:'9px 10px',fontFamily:T.mono,fontSize:11,fontWeight:700,color:T.navy}}>{dp.esrs}</td>
                  <td style={{padding:'9px 10px',fontFamily:T.mono,fontSize:11,color:T.gold,fontWeight:700}}>{dp.dp}</td>
                  <td style={{padding:'9px 10px',fontSize:12,color:T.text}}>{dp.title}</td>
                  <td style={{padding:'9px 10px'}}><span style={pill(dp.required?T.red:T.textMut,dp.required?'Mandatory':'Optional',true)}>{dp.required?'Mandatory':'Optional'}</span></td>
                  <td style={{padding:'9px 10px'}}>{dp.covered?<span style={pill(T.green,'✓ Covered',true)}>✓ Covered</span>:<span style={pill(T.red,'✗ Gap',true)}>✗ Gap</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:16}}>Coverage by ESRS Standard</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={grouped} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis type="number" domain={[0,10]} style={{fontSize:10}}/>
              <YAxis type="category" dataKey="esrs" width={70} style={{fontSize:10}}/>
              <Tooltip/>
              <Legend/>
              <Bar dataKey="covered" name="Covered" fill={T.green} radius={[0,4,4,0]}/>
              <Bar dataKey="total" name="Total" fill={T.borderL} radius={[0,4,4,0]}/>
            </BarChart>
          </ResponsiveContainer>
          <div style={{marginTop:16,padding:'12px 14px',background:T.navy+'0a',borderRadius:8,borderLeft:`3px solid ${T.gold}`}}>
            <div style={{fontSize:11,fontWeight:700,color:T.navy,marginBottom:3}}>Omission Justification (ESRS 1 §31)</div>
            <div style={{fontSize:12,color:T.textSec}}>Topics omitted as not material must be justified via documented assessment per EFRAG IG 1. Retain evidence for auditor review.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
