import React,{useState,useMemo} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,PieChart,Pie,Cell,Legend,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

/* ── Constants ─────────────────────────────────────────── */
const TABS=['ESG Underwriting Scorecard','Risk Selection','Portfolio ESG Profile','Regulatory Compliance'];
const SECTORS=['Oil & Gas','Coal Mining','Power Generation','Chemicals','Manufacturing','Transportation','Real Estate','Agriculture','Financial Services','Technology','Healthcare','Retail'];
const ESG_CRITERIA=['Carbon Intensity','Biodiversity Impact','Water Stress','Waste Management','Employee Safety','Labour Rights','Supply Chain Ethics','Board Governance','Anti-Corruption','Climate Strategy','Community Impact','Data Privacy'];
const POLICY_TYPES=['Property','Casualty','Marine','Energy','Aviation','D&O','E&O','Cyber','Environmental Liability','Product Liability','Workers Comp','General Liability'];
const RISK_RATINGS=['Very Low','Low','Medium','High','Very High'];
const PIE_COLORS=[T.navy,T.gold,T.sage,T.red,T.navyL,T.amber,'#6366f1','#0891b2','#a855f7','#ec4899',T.sageL,T.goldL];

/* ── Seeded Data: 80 Policies ──────────────────────────── */
const POLICIES=Array.from({length:80},(_,i)=>{
  const s1=sr(i*11+1);const s2=sr(i*11+2);const s3=sr(i*11+3);const s4=sr(i*11+4);const s5=sr(i*11+5);const s6=sr(i*11+6);const s7=sr(i*11+7);const s8=sr(i*11+8);
  const sector=SECTORS[Math.floor(s1*SECTORS.length)];
  const policyType=POLICY_TYPES[Math.floor(s2*POLICY_TYPES.length)];
  const premium=Math.round(50+s3*950);
  const limit=Math.round(premium*2+s4*premium*8);
  const eScores=ESG_CRITERIA.map((_c,ci)=>Math.round(20+sr(i*13+ci*7)*80));
  const esgScore=Math.round(eScores.reduce((a,b)=>a+b,0)/eScores.length);
  const envScore=Math.round((eScores[0]+eScores[1]+eScores[2]+eScores[3])/4);
  const socScore=Math.round((eScores[4]+eScores[5]+eScores[6]+eScores[10])/4);
  const govScore=Math.round((eScores[7]+eScores[8]+eScores[9]+eScores[11])/4);
  const riskRating=esgScore<30?'Very High':esgScore<45?'High':esgScore<60?'Medium':esgScore<75?'Low':'Very Low';
  const recommendation=esgScore<30?'Decline':esgScore<45?'Refer':esgScore<60?'Accept w/ Conditions':'Accept';
  const fossilFuelExposure=sector==='Oil & Gas'||sector==='Coal Mining'?+(60+s5*35).toFixed(1):sector==='Power Generation'?+(20+s5*40).toFixed(1):+(s5*15).toFixed(1);
  const transitionRisk=+(1+s6*9).toFixed(1);
  const physicalRisk=+(1+s7*9).toFixed(1);
  const litigationRisk=+(1+s8*9).toFixed(1);
  const lossRatio=+(0.2+s1*0.6).toFixed(2);
  const client=`Client-${String(i+1).padStart(3,'0')}`;
  const country=['US','UK','DE','JP','AU','CA','FR','BR','IN','SG'][Math.floor(s2*10)];
  return {id:i+1,client,sector,policyType,premium,limit,esgScore,envScore,socScore,govScore,eScores,riskRating,recommendation,fossilFuelExposure,transitionRisk,physicalRisk,litigationRisk,lossRatio,country,status:s3>0.15?'Active':'Under Review'};
});

/* ── Exclusion Lists ─────────────────────────────────── */
const EXCLUSION_LISTS=[
  {category:'Thermal Coal',description:'Companies with >30% revenue from thermal coal mining or >30% power from coal',threshold:'30% revenue',affected:POLICIES.filter(p=>p.sector==='Coal Mining').length,status:'Active'},
  {category:'Arctic Drilling',description:'Upstream oil & gas exploration in Arctic regions',threshold:'Any involvement',affected:Math.round(POLICIES.filter(p=>p.sector==='Oil & Gas').length*0.3),status:'Active'},
  {category:'Tar Sands',description:'Oil sands extraction and pipeline projects',threshold:'Any new projects',affected:Math.round(POLICIES.filter(p=>p.sector==='Oil & Gas').length*0.2),status:'Active'},
  {category:'Controversial Weapons',description:'Cluster munitions, anti-personnel mines, nuclear weapons',threshold:'Zero tolerance',affected:0,status:'Active'},
  {category:'Deforestation',description:'Companies linked to illegal deforestation',threshold:'Any involvement',affected:Math.round(POLICIES.filter(p=>p.sector==='Agriculture').length*0.25),status:'Active'},
  {category:'Tobacco',description:'Tobacco manufacturing (not retail)',threshold:'Any manufacturing',affected:0,status:'Active'},
  {category:'Deep Sea Mining',description:'Deep ocean floor mining operations',threshold:'Any involvement',affected:0,status:'Under Review'},
  {category:'New Coal Power',description:'New unabated coal-fired power plant construction',threshold:'Zero tolerance',affected:Math.round(POLICIES.filter(p=>p.sector==='Power Generation').length*0.15),status:'Active'},
];

/* ── Regulatory Data ─────────────────────────────────── */
const REGULATIONS=[
  {reg:'Solvency II Climate',jurisdiction:'EU',status:'Mandatory',deadline:'2025-01-01',compliance:78,requirements:['ORSA climate scenarios','Climate risk materiality','Prudent person + ESG','Stewardship reporting'],gap:'ORSA scenario analysis incomplete'},
  {reg:'EIOPA Opinions',jurisdiction:'EU',status:'Mandatory',deadline:'2024-12-31',compliance:72,requirements:['Integration in risk mgmt','Underwriting strategy','Investment policy','Climate stress testing'],gap:'Underwriting integration partial'},
  {reg:'PRA SS3/19',jurisdiction:'UK',status:'Mandatory',deadline:'2024-06-30',compliance:85,requirements:['Board-level climate governance','Scenario analysis','Risk appetite','Disclosure alignment'],gap:'Long-horizon scenario weak'},
  {reg:'NAIC Climate Risk',jurisdiction:'US',status:'Voluntary',deadline:'2025-12-31',compliance:60,requirements:['Climate risk survey','Financial impact assessment','Risk management disclosure','Transition plan'],gap:'Multi-state compliance gap'},
  {reg:'TCFD Insurance',jurisdiction:'Global',status:'Recommended',deadline:'2025-06-30',compliance:88,requirements:['Governance disclosure','Strategy scenarios','Risk management process','Metrics and targets'],gap:'Scope 3 metrics partial'},
  {reg:'IFRS S2 Climate',jurisdiction:'Global',status:'Mandatory (2025)',deadline:'2025-01-01',compliance:65,requirements:['Climate-related risks/opportunities','Physical risk assessment','Transition risk assessment','Climate resilience'],gap:'Climate resilience assessment needed'},
  {reg:'UN PSI Framework',jurisdiction:'Global',status:'Voluntary',deadline:'Ongoing',compliance:70,requirements:['ESG in underwriting','Client engagement','Awareness building','Public disclosure'],gap:'Client engagement tracking'},
  {reg:'EU SFDR (Insurance)',jurisdiction:'EU',status:'Mandatory',deadline:'2024-01-01',compliance:82,requirements:['PAI indicators','Product classification','Pre-contractual disclosure','Website disclosure'],gap:'PAI data completeness 74%'},
];

/* ── Engagement Data ─────────────────────────────────── */
const ENGAGEMENT_ACTIONS=['Send ESG questionnaire','Request climate disclosure','Mandate transition plan','Apply premium surcharge','Add exclusion clause','Set improvement timeline','Escalate to decline','Partner on risk mitigation'];

/* ── Styles ─────────────────────────────────────────── */
const S={
  page:{fontFamily:T.font,background:T.bg,color:T.text,minHeight:'100vh',padding:'24px'},
  header:{marginBottom:20},
  h1:{fontSize:22,fontWeight:700,margin:0,color:T.navy},
  sub:{fontSize:13,color:T.textSec,marginTop:4,fontFamily:T.mono},
  tabs:{display:'flex',gap:0,borderBottom:`2px solid ${T.border}`,marginBottom:20},
  tab:(a)=>({padding:'10px 20px',fontSize:13,fontWeight:a?700:500,color:a?T.gold:T.textSec,borderBottom:a?`2px solid ${T.gold}`:'2px solid transparent',cursor:'pointer',background:'none',border:'none',fontFamily:T.font,marginBottom:-2}),
  card:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:16,marginBottom:16},
  cardTitle:{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12},
  grid2:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16},
  grid3:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16},
  grid4:{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12},
  kpi:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:14,textAlign:'center'},
  kpiVal:{fontSize:22,fontWeight:700,color:T.navy,fontFamily:T.mono},
  kpiLbl:{fontSize:11,color:T.textSec,marginTop:4},
  table:{width:'100%',borderCollapse:'collapse',fontSize:12,fontFamily:T.mono},
  th:{textAlign:'left',padding:'8px 10px',borderBottom:`2px solid ${T.border}`,color:T.textSec,fontWeight:600,fontSize:11,position:'sticky',top:0,background:T.surface},
  td:{padding:'7px 10px',borderBottom:`1px solid ${T.border}`,whiteSpace:'nowrap'},
  badge:(c)=>({display:'inline-block',padding:'2px 8px',borderRadius:4,fontSize:10,fontWeight:600,background:c===T.red?'#fef2f2':c===T.amber?'#fffbeb':c===T.green?'#f0fdf4':'#eff6ff',color:c}),
  btn:(a)=>({padding:'6px 14px',fontSize:12,fontWeight:600,borderRadius:6,border:a?'none':`1px solid ${T.border}`,background:a?T.navy:T.surface,color:a?'#fff':T.text,cursor:'pointer',fontFamily:T.font}),
  select:{padding:'6px 10px',fontSize:12,borderRadius:6,border:`1px solid ${T.border}`,background:T.surface,color:T.text,fontFamily:T.font},
  scroll:{maxHeight:420,overflowY:'auto'},
  dot:(c)=>({width:8,height:8,borderRadius:'50%',background:c,display:'inline-block'}),
  heatCell:(v)=>({padding:'6px 8px',textAlign:'center',fontSize:11,fontWeight:600,fontFamily:T.mono,background:v>=70?'#dcfce7':v>=50?'#fef3c7':v>=30?'#fed7aa':'#fecaca',color:v>=70?T.green:v>=50?T.amber:v>=30?'#c2410c':T.red,borderRadius:4}),
  progressBar:(v,max,c)=>({height:6,borderRadius:3,background:T.border,position:'relative',overflow:'hidden'}),
  progressFill:(v,c)=>({height:6,borderRadius:3,background:c,width:`${v}%`,position:'absolute',top:0,left:0}),
  chip:(a)=>({display:'inline-block',padding:'3px 10px',borderRadius:12,fontSize:11,fontWeight:600,background:a?T.navy:'transparent',color:a?'#fff':T.textSec,border:a?'none':`1px solid ${T.border}`,cursor:'pointer',marginRight:4}),
};

/* ── Component ─────────────────────────────────────────── */
export default function UnderwritingEsgPage(){
  const [tab,setTab]=useState(0);
  const [sectorFilter,setSectorFilter]=useState('All');
  const [ratingFilter,setRatingFilter]=useState('All');
  const [sortCol,setSortCol]=useState('esgScore');
  const [sortDir,setSortDir]=useState('desc');
  const [policyPage,setPolicyPage]=useState(0);
  const [selectedPolicy,setSelectedPolicy]=useState(null);
  const [recFilter,setRecFilter]=useState('All');
  const [engagementSector,setEngagementSector]=useState('All');
  const [regFilter,setRegFilter]=useState('All');
  const [complianceView,setComplianceView]=useState('table');

  const filteredPolicies=useMemo(()=>{
    let f=[...POLICIES];
    if(sectorFilter!=='All')f=f.filter(p=>p.sector===sectorFilter);
    if(ratingFilter!=='All')f=f.filter(p=>p.riskRating===ratingFilter);
    if(recFilter!=='All')f=f.filter(p=>p.recommendation===recFilter);
    f.sort((a,b)=>sortDir==='asc'?a[sortCol]-b[sortCol]:b[sortCol]-a[sortCol]);
    return f;
  },[sectorFilter,ratingFilter,recFilter,sortCol,sortDir]);

  const portfolioStats=useMemo(()=>{
    const avgESG=Math.round(POLICIES.reduce((a,b)=>a+b.esgScore,0)/POLICIES.length);
    const avgEnv=Math.round(POLICIES.reduce((a,b)=>a+b.envScore,0)/POLICIES.length);
    const avgSoc=Math.round(POLICIES.reduce((a,b)=>a+b.socScore,0)/POLICIES.length);
    const avgGov=Math.round(POLICIES.reduce((a,b)=>a+b.govScore,0)/POLICIES.length);
    const totalPremium=POLICIES.reduce((a,b)=>a+b.premium,0);
    const totalLimit=POLICIES.reduce((a,b)=>a+b.limit,0);
    const declines=POLICIES.filter(p=>p.recommendation==='Decline').length;
    const refers=POLICIES.filter(p=>p.recommendation==='Refer').length;
    const avgFossil=+(POLICIES.reduce((a,b)=>a+b.fossilFuelExposure,0)/POLICIES.length).toFixed(1);
    return {avgESG,avgEnv,avgSoc,avgGov,totalPremium,totalLimit,declines,refers,avgFossil,policyCount:POLICIES.length};
  },[]);

  const sectorESG=useMemo(()=>{
    return SECTORS.map(s=>{
      const policies=POLICIES.filter(p=>p.sector===s);
      if(!policies.length)return null;
      return {sector:s,avg:Math.round(policies.reduce((a,b)=>a+b.esgScore,0)/policies.length),count:policies.length,premium:policies.reduce((a,b)=>a+b.premium,0),fossil:+(policies.reduce((a,b)=>a+b.fossilFuelExposure,0)/policies.length).toFixed(1)};
    }).filter(Boolean).sort((a,b)=>b.avg-a.avg);
  },[]);

  const recDistribution=useMemo(()=>{
    const recs=['Accept','Accept w/ Conditions','Refer','Decline'];
    return recs.map(r=>({name:r,value:POLICIES.filter(p=>p.recommendation===r).length}));
  },[]);

  const radarData=useMemo(()=>{
    return ESG_CRITERIA.map((c,i)=>({criteria:c.length>12?c.substring(0,12)+'..':c,portfolio:Math.round(POLICIES.reduce((a,b)=>a+b.eScores[i],0)/POLICIES.length),benchmark:50+Math.round(sr(i*31)*30)}));
  },[]);

  const PAGE_SIZE=12;
  const policyPages=Math.ceil(filteredPolicies.length/PAGE_SIZE);
  const pagedPolicies=filteredPolicies.slice(policyPage*PAGE_SIZE,(policyPage+1)*PAGE_SIZE);

  const handleSort=(col)=>{if(sortCol===col)setSortDir(d=>d==='asc'?'desc':'asc');else{setSortCol(col);setSortDir('desc');}setPolicyPage(0);};
  const recColor=(r)=>r==='Accept'?T.green:r==='Accept w/ Conditions'?T.sage:r==='Refer'?T.amber:T.red;
  const ratingColor=(r)=>r==='Very Low'?T.green:r==='Low'?T.sage:r==='Medium'?T.amber:r==='High'?'#c2410c':T.red;

  /* ── Tab 1: ESG Underwriting Scorecard ───────────── */
  const renderScorecard=()=>(
    <div>
      <div style={S.grid4}>
        {[{l:'Avg ESG Score',v:`${portfolioStats.avgESG}/100`,c:portfolioStats.avgESG>=60?T.green:T.amber},{l:'Total Premium',v:`$${(portfolioStats.totalPremium/1000).toFixed(1)}B`},{l:'Policies',v:portfolioStats.policyCount},{l:'Decline Rate',v:`${((portfolioStats.declines/portfolioStats.policyCount)*100).toFixed(1)}%`,c:T.red},{l:'Env Score',v:`${portfolioStats.avgEnv}/100`},{l:'Social Score',v:`${portfolioStats.avgSoc}/100`},{l:'Gov Score',v:`${portfolioStats.avgGov}/100`},{l:'Avg Fossil Exp.',v:`${portfolioStats.avgFossil}%`}].map((k,i)=>(
          <div key={i} style={S.kpi}><div style={{...S.kpiVal,color:k.c||T.navy}}>{k.v}</div><div style={S.kpiLbl}>{k.l}</div></div>
        ))}
      </div>
      <div style={{...S.grid2,marginTop:16}}>
        <div style={S.card}>
          <div style={S.cardTitle}>ESG Score by Sector</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sectorESG} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" domain={[0,100]} tick={{fontSize:10}}/><YAxis dataKey="sector" type="category" tick={{fontSize:10}} width={110}/><Tooltip contentStyle={{fontSize:11,fontFamily:T.mono}}/><Bar dataKey="avg" name="Avg ESG Score">{sectorESG.map((e,i)=><Cell key={i} fill={e.avg>=60?T.green:e.avg>=45?T.amber:T.red}/>)}</Bar></BarChart>
          </ResponsiveContainer>
        </div>
        <div style={S.card}>
          <div style={S.cardTitle}>Portfolio ESG Radar vs Benchmark</div>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}><PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="criteria" tick={{fontSize:9}}/><PolarRadiusAxis angle={90} domain={[0,100]} tick={{fontSize:9}}/><Radar name="Portfolio" dataKey="portfolio" stroke={T.navy} fill={T.navy} fillOpacity={0.3}/><Radar name="Benchmark" dataKey="benchmark" stroke={T.gold} fill={T.gold} fillOpacity={0.15}/><Legend wrapperStyle={{fontSize:11}}/><Tooltip contentStyle={{fontSize:11}}/></RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{display:'flex',gap:12,marginBottom:12,flexWrap:'wrap',alignItems:'center'}}>
        <select style={S.select} value={sectorFilter} onChange={e=>{setSectorFilter(e.target.value);setPolicyPage(0);}}>
          <option value="All">All Sectors</option>{SECTORS.map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        <select style={S.select} value={ratingFilter} onChange={e=>{setRatingFilter(e.target.value);setPolicyPage(0);}}>
          <option value="All">All Ratings</option>{RISK_RATINGS.map(r=><option key={r} value={r}>{r}</option>)}
        </select>
        <span style={{fontSize:12,color:T.textSec}}>{filteredPolicies.length} policies</span>
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>Policy ESG Scorecard</div>
        <div style={S.scroll}>
          <table style={S.table}>
            <thead><tr>{[['client','Client'],['sector','Sector'],['policyType','Type'],['premium','Premium ($K)'],['esgScore','ESG'],['envScore','Env'],['socScore','Soc'],['govScore','Gov'],['riskRating','Risk'],['recommendation','Rec.'],['fossilFuelExposure','Fossil %']].map(([k,h])=>(
              <th key={k} style={{...S.th,cursor:'pointer'}} onClick={()=>handleSort(k)}>{h}{sortCol===k?(sortDir==='asc'?' ↑':' ↓'):''}</th>
            ))}</tr></thead>
            <tbody>{pagedPolicies.map((p,i)=>(
              <tr key={p.id} style={{background:i%2?T.surfaceH:'transparent',cursor:'pointer'}} onClick={()=>setSelectedPolicy(selectedPolicy===p.id?null:p.id)}>
                <td style={S.td}>{p.client}</td><td style={S.td}>{p.sector}</td><td style={S.td}>{p.policyType}</td>
                <td style={{...S.td,fontWeight:600}}>{p.premium}</td>
                <td style={S.td}><span style={S.heatCell(p.esgScore)}>{p.esgScore}</span></td>
                <td style={S.td}><span style={S.heatCell(p.envScore)}>{p.envScore}</span></td>
                <td style={S.td}><span style={S.heatCell(p.socScore)}>{p.socScore}</span></td>
                <td style={S.td}><span style={S.heatCell(p.govScore)}>{p.govScore}</span></td>
                <td style={S.td}><span style={S.badge(ratingColor(p.riskRating))}>{p.riskRating}</span></td>
                <td style={S.td}><span style={S.badge(recColor(p.recommendation))}>{p.recommendation}</span></td>
                <td style={S.td}>{p.fossilFuelExposure}%</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        {selectedPolicy&&(()=>{const p=POLICIES.find(x=>x.id===selectedPolicy);if(!p)return null;return(
          <div style={{marginTop:12,padding:14,background:T.surfaceH,borderRadius:8,border:`1px solid ${T.border}`}}>
            <div style={{fontSize:13,fontWeight:700,marginBottom:8}}>{p.client} — Detailed ESG Assessment</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:6}}>
              {ESG_CRITERIA.map((c,ci)=>(
                <div key={c} style={{textAlign:'center'}}>
                  <div style={S.heatCell(p.eScores[ci])}>{p.eScores[ci]}</div>
                  <div style={{fontSize:9,color:T.textSec,marginTop:2}}>{c}</div>
                </div>
              ))}
            </div>
            <div style={{marginTop:10,display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,fontSize:11}}>
              <div>Transition Risk: <strong>{p.transitionRisk}/10</strong></div>
              <div>Physical Risk: <strong>{p.physicalRisk}/10</strong></div>
              <div>Litigation Risk: <strong>{p.litigationRisk}/10</strong></div>
            </div>
          </div>
        );})()}
        <div style={{display:'flex',gap:8,marginTop:10,alignItems:'center',justifyContent:'space-between'}}>
          <span style={{fontSize:11,color:T.textSec}}>Page {policyPage+1} of {policyPages}</span>
          <div style={{display:'flex',gap:4}}>
            <button style={S.btn(false)} disabled={policyPage===0} onClick={()=>setPolicyPage(p=>p-1)}>← Prev</button>
            <button style={S.btn(false)} disabled={policyPage>=policyPages-1} onClick={()=>setPolicyPage(p=>p+1)}>Next →</button>
          </div>
        </div>
      </div>
    </div>
  );

  /* ── Tab 2: Risk Selection ───────────────────────── */
  const renderRiskSelection=()=>(
    <div>
      <div style={S.grid3}>
        <div style={S.card}>
          <div style={S.cardTitle}>Recommendation Distribution</div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart><Pie data={recDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" label={({name,value})=>`${name}: ${value}`}>{recDistribution.map((e,i)=><Cell key={i} fill={[T.green,T.sage,T.amber,T.red][i]}/>)}</Pie><Tooltip contentStyle={{fontSize:11}}/></PieChart>
          </ResponsiveContainer>
        </div>
        <div style={S.card}>
          <div style={S.cardTitle}>Fossil Fuel Phase-Out Progress</div>
          {['Coal Mining','Oil & Gas','Power Generation'].map(s=>{
            const policies=POLICIES.filter(p=>p.sector===s);
            const avgFossil=policies.length?policies.reduce((a,b)=>a+b.fossilFuelExposure,0)/policies.length:0;
            const target=s==='Coal Mining'?0:s==='Oil & Gas'?20:15;
            return (
              <div key={s} style={{marginBottom:12}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:11,marginBottom:4}}>
                  <span style={{fontWeight:600}}>{s}</span>
                  <span style={{color:T.textSec}}>{avgFossil.toFixed(1)}% → Target {target}%</span>
                </div>
                <div style={{height:8,borderRadius:4,background:T.border,position:'relative'}}>
                  <div style={{height:8,borderRadius:4,background:avgFossil>40?T.red:avgFossil>20?T.amber:T.green,width:`${Math.min(100,avgFossil)}%`,position:'absolute',top:0}}/>
                  <div style={{position:'absolute',left:`${target}%`,top:-2,width:2,height:12,background:T.navy}}/>
                </div>
              </div>
            );
          })}
          <div style={{marginTop:12,padding:8,background:'#fffbeb',borderRadius:6,fontSize:11,color:T.amber}}>
            Phase-out timeline: Coal 2030 | Arctic O&G 2025 | Tar sands 2028 | Unabated gas 2035
          </div>
        </div>
        <div style={S.card}>
          <div style={S.cardTitle}>Risk Selection Summary</div>
          <div style={{display:'grid',gap:8}}>
            {[{l:'Accepted',v:POLICIES.filter(p=>p.recommendation==='Accept').length,c:T.green},{l:'Conditional Accept',v:POLICIES.filter(p=>p.recommendation==='Accept w/ Conditions').length,c:T.sage},{l:'Referred',v:POLICIES.filter(p=>p.recommendation==='Refer').length,c:T.amber},{l:'Declined',v:POLICIES.filter(p=>p.recommendation==='Decline').length,c:T.red}].map((m,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:8,background:T.surfaceH,borderRadius:6,borderLeft:`3px solid ${m.c}`}}>
                <div style={{fontSize:20,fontWeight:700,color:m.c,fontFamily:T.mono,width:40}}>{m.v}</div>
                <div style={{fontSize:12}}>{m.l}</div>
                <div style={{marginLeft:'auto',fontSize:11,color:T.textSec}}>{((m.v/POLICIES.length)*100).toFixed(0)}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>ESG Exclusion Lists</div>
        <div style={S.scroll}>
          <table style={S.table}>
            <thead><tr>{['Category','Description','Threshold','Affected Policies','Status'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>{EXCLUSION_LISTS.map((e,i)=>(
              <tr key={i} style={{background:i%2?T.surfaceH:'transparent'}}>
                <td style={{...S.td,fontWeight:600}}>{e.category}</td>
                <td style={{...S.td,whiteSpace:'normal',maxWidth:300}}>{e.description}</td>
                <td style={S.td}>{e.threshold}</td>
                <td style={S.td}><span style={S.badge(e.affected>5?T.red:e.affected>0?T.amber:T.green)}>{e.affected}</span></td>
                <td style={S.td}><span style={S.badge(e.status==='Active'?T.green:T.amber)}>{e.status}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>Referred Policies — Action Required</div>
        <div style={{display:'flex',gap:4,marginBottom:10,flexWrap:'wrap'}}>
          {['All','Refer','Decline','Accept w/ Conditions'].map(r=><button key={r} style={S.chip(recFilter===r)} onClick={()=>{setRecFilter(r);setPolicyPage(0);}}>{r}</button>)}
        </div>
        <div style={S.scroll}>
          <table style={S.table}>
            <thead><tr>{['Client','Sector','ESG Score','Recommendation','Key Concern','Suggested Action'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>{filteredPolicies.filter(p=>p.recommendation!=='Accept').slice(0,20).map((p,i)=>{
              const concern=p.envScore<40?'Environmental risk high':p.socScore<40?'Social risk concerns':p.govScore<40?'Governance weakness':'Fossil fuel exposure';
              const action=ENGAGEMENT_ACTIONS[Math.floor(sr(p.id*71)*ENGAGEMENT_ACTIONS.length)];
              return (
                <tr key={p.id} style={{background:i%2?T.surfaceH:'transparent'}}>
                  <td style={S.td}>{p.client}</td><td style={S.td}>{p.sector}</td>
                  <td style={S.td}><span style={S.heatCell(p.esgScore)}>{p.esgScore}</span></td>
                  <td style={S.td}><span style={S.badge(recColor(p.recommendation))}>{p.recommendation}</span></td>
                  <td style={S.td}>{concern}</td>
                  <td style={{...S.td,fontSize:11}}>{action}</td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      </div>
    </div>
  );

  /* ── Tab 3: Portfolio ESG Profile ─────────────────── */
  const renderPortfolioProfile=()=>(
    <div>
      <div style={S.grid2}>
        <div style={S.card}>
          <div style={S.cardTitle}>Sector Composition (by Premium)</div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart><Pie data={SECTORS.map(s=>{const ps=POLICIES.filter(p=>p.sector===s);return {name:s,value:ps.reduce((a,b)=>a+b.premium,0)};}).filter(x=>x.value>0)} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`}>{SECTORS.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}</Pie><Tooltip contentStyle={{fontSize:11}}/></PieChart>
          </ResponsiveContainer>
        </div>
        <div style={S.card}>
          <div style={S.cardTitle}>Transition Risk Exposure by Sector</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sectorESG.map(s=>({...s,transitionRisk:+(POLICIES.filter(p=>p.sector===s.sector).reduce((a,b)=>a+b.transitionRisk,0)/POLICIES.filter(p=>p.sector===s.sector).length).toFixed(1)}))}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="sector" tick={{fontSize:9}} angle={-25} textAnchor="end" height={60}/><YAxis tick={{fontSize:10}}/><Tooltip contentStyle={{fontSize:11,fontFamily:T.mono}}/><Legend wrapperStyle={{fontSize:11}}/><Bar dataKey="avg" name="ESG Score" fill={T.sage}/><Bar dataKey="transitionRisk" name="Transition Risk" fill={T.red}/></BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>Aggregate ESG Quality Distribution</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={[{range:'0-20',count:POLICIES.filter(p=>p.esgScore<20).length},{range:'20-40',count:POLICIES.filter(p=>p.esgScore>=20&&p.esgScore<40).length},{range:'40-60',count:POLICIES.filter(p=>p.esgScore>=40&&p.esgScore<60).length},{range:'60-80',count:POLICIES.filter(p=>p.esgScore>=60&&p.esgScore<80).length},{range:'80-100',count:POLICIES.filter(p=>p.esgScore>=80).length}]}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="range" tick={{fontSize:10}}/><YAxis tick={{fontSize:10}}/><Tooltip contentStyle={{fontSize:11}}/><Bar dataKey="count" name="Policy Count">{[T.red,'#c2410c',T.amber,T.sage,T.green].map((c,i)=><Cell key={i} fill={c}/>)}</Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={S.grid2}>
        <div style={S.card}>
          <div style={S.cardTitle}>E/S/G Pillar Breakdown</div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={sectorESG.slice(0,8).map(s=>{const ps=POLICIES.filter(p=>p.sector===s.sector);return {sector:s.sector,env:Math.round(ps.reduce((a,b)=>a+b.envScore,0)/ps.length),soc:Math.round(ps.reduce((a,b)=>a+b.socScore,0)/ps.length),gov:Math.round(ps.reduce((a,b)=>a+b.govScore,0)/ps.length)};})}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="sector" tick={{fontSize:9}} angle={-20} textAnchor="end" height={55}/><YAxis tick={{fontSize:10}} domain={[0,100]}/><Tooltip contentStyle={{fontSize:11}}/><Legend wrapperStyle={{fontSize:11}}/><Bar dataKey="env" name="Environmental" fill={T.sage}/><Bar dataKey="soc" name="Social" fill={T.gold}/><Bar dataKey="gov" name="Governance" fill={T.navy}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={S.card}>
          <div style={S.cardTitle}>Engagement Pipeline</div>
          <div style={{display:'grid',gap:6}}>
            {['ESG questionnaire sent','Awaiting climate disclosure','Improvement plan agreed','Under monitoring','Engagement successful'].map((stage,si)=>{
              const count=Math.round(3+sr(si*59)*12);
              return (
                <div key={stage} style={{display:'flex',alignItems:'center',gap:10,padding:8,background:T.surfaceH,borderRadius:6}}>
                  <div style={{width:28,height:28,borderRadius:'50%',background:T.navy,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700}}>{count}</div>
                  <div style={{fontSize:12}}>{stage}</div>
                  <div style={{marginLeft:'auto',fontSize:10,color:T.textSec}}>{si===0?'Week 1':si===1?'Week 2-4':si===2?'Week 4-8':si===3?'Ongoing':'Complete'}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  /* ── Tab 4: Regulatory Compliance ─────────────────── */
  const renderRegulatory=()=>(
    <div>
      <div style={S.grid4}>
        {[{l:'Avg Compliance',v:`${Math.round(REGULATIONS.reduce((a,b)=>a+b.compliance,0)/REGULATIONS.length)}%`},{l:'Mandatory Regs',v:REGULATIONS.filter(r=>r.status.includes('Mandatory')).length},{l:'Critical Gaps',v:REGULATIONS.filter(r=>r.compliance<70).length,c:T.red},{l:'Jurisdictions',v:new Set(REGULATIONS.map(r=>r.jurisdiction)).size}].map((k,i)=>(
          <div key={i} style={S.kpi}><div style={{...S.kpiVal,color:k.c||T.navy}}>{k.v}</div><div style={S.kpiLbl}>{k.l}</div></div>
        ))}
      </div>
      <div style={{display:'flex',gap:8,marginBottom:12}}>
        {['table','cards'].map(v=><button key={v} style={S.btn(complianceView===v)} onClick={()=>setComplianceView(v)}>{v==='table'?'Table View':'Card View'}</button>)}
      </div>
      {complianceView==='table'?(
        <div style={S.card}>
          <div style={S.cardTitle}>Regulatory Compliance Dashboard</div>
          <div style={S.scroll}>
            <table style={S.table}>
              <thead><tr>{['Regulation','Jurisdiction','Status','Deadline','Compliance','Key Gap'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>{REGULATIONS.map((r,i)=>(
                <tr key={i} style={{background:i%2?T.surfaceH:'transparent'}}>
                  <td style={{...S.td,fontWeight:600}}>{r.reg}</td>
                  <td style={S.td}>{r.jurisdiction}</td>
                  <td style={S.td}><span style={S.badge(r.status.includes('Mandatory')?T.navy:T.textSec)}>{r.status}</span></td>
                  <td style={S.td}>{r.deadline}</td>
                  <td style={S.td}>
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <div style={{width:60,height:6,borderRadius:3,background:T.border}}>
                        <div style={{height:6,borderRadius:3,background:r.compliance>=80?T.green:r.compliance>=60?T.amber:T.red,width:`${r.compliance}%`}}/>
                      </div>
                      <span style={{fontSize:11,fontFamily:T.mono,color:r.compliance>=80?T.green:r.compliance>=60?T.amber:T.red}}>{r.compliance}%</span>
                    </div>
                  </td>
                  <td style={{...S.td,fontSize:11,color:T.red}}>{r.gap}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      ):(
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12}}>
          {REGULATIONS.map((r,i)=>(
            <div key={i} style={{...S.card,borderLeft:`3px solid ${r.compliance>=80?T.green:r.compliance>=60?T.amber:T.red}`}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <div><div style={{fontSize:14,fontWeight:700,color:T.navy}}>{r.reg}</div><div style={{fontSize:11,color:T.textSec}}>{r.jurisdiction} · {r.status}</div></div>
                <div style={{fontSize:24,fontWeight:700,fontFamily:T.mono,color:r.compliance>=80?T.green:r.compliance>=60?T.amber:T.red}}>{r.compliance}%</div>
              </div>
              <div style={{marginTop:8,fontSize:11}}>
                <div style={{color:T.textSec,marginBottom:4}}>Requirements:</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:4}}>{r.requirements.map((req,ri)=><span key={ri} style={{padding:'2px 6px',background:T.surfaceH,borderRadius:4,fontSize:10}}>{req}</span>)}</div>
              </div>
              <div style={{marginTop:8,padding:6,background:'#fef2f2',borderRadius:4,fontSize:10,color:T.red}}>Gap: {r.gap}</div>
              <div style={{marginTop:6,fontSize:10,color:T.textMut}}>Deadline: {r.deadline}</div>
            </div>
          ))}
        </div>
      )}
      <div style={S.card}>
        <div style={S.cardTitle}>Compliance Trend (12 Months)</div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m,i)=>({month:m,solvencyII:65+Math.round(sr(i*61)*20),praSSS:70+Math.round(sr(i*67)*18),tcfd:72+Math.round(sr(i*73)*20),naic:50+Math.round(sr(i*79)*25)}))}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="month" tick={{fontSize:10}}/><YAxis tick={{fontSize:10}} domain={[0,100]}/><Tooltip contentStyle={{fontSize:11}}/><Legend wrapperStyle={{fontSize:11}}/><Bar dataKey="solvencyII" name="Solvency II" fill={T.navy}/><Bar dataKey="praSSS" name="PRA SS3/19" fill={T.gold}/><Bar dataKey="tcfd" name="TCFD" fill={T.sage}/><Bar dataKey="naic" name="NAIC" fill={T.amber}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.h1}>ESG Underwriting Intelligence</h1>
        <div style={S.sub}>EP-AR2 · {POLICIES.length} policies · {ESG_CRITERIA.length} ESG criteria · {SECTORS.length} sectors · Risk selection & compliance</div>
      </div>
      <div style={S.tabs}>
        {TABS.map((t,i)=><button key={t} style={S.tab(tab===i)} onClick={()=>setTab(i)}>{t}</button>)}
      </div>
      {tab===0&&renderScorecard()}
      {tab===1&&renderRiskSelection()}
      {tab===2&&renderPortfolioProfile()}
      {tab===3&&renderRegulatory()}
    </div>
  );
}
