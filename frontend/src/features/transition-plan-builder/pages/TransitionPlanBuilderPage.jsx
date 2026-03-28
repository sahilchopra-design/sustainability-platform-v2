import React,{useState,useMemo,useCallback} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,PieChart,Pie,Cell,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis,AreaChart,Area,Legend} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

const SECTORS=['Power','Steel','Cement','Oil & Gas','Aviation','Shipping','Agriculture','Real Estate','Automotive','Chemicals'];
const TPT_STEPS=['Ambition','Action','Accountability','Governance','Basis'];
const QUARTERS=['Q1-23','Q2-23','Q3-23','Q4-23','Q1-24','Q2-24','Q3-24','Q4-24','Q1-25','Q2-25','Q3-25','Q4-25'];

const TPT_ELEMENTS=['Net Zero Target','Interim Milestones','Scope 1 Plan','Scope 2 Plan','Scope 3 Plan','CapEx Alignment','Revenue Alignment','Just Transition','Board Oversight','Risk Management','Metrics & KPIs','Verification'];

const SECTOR_TEMPLATES={
  Power:{milestones:['Coal phase-out by 2030','50% renewables by 2027','Grid storage 2GWh by 2028'],phaseOut:'Coal by 2030, Gas peakers by 2040',levers:['Renewable expansion','Battery storage','Grid modernization','Demand response'],capex:'$2.1B over 10yr',intensity:'0.42 tCO2/MWh baseline'},
  Steel:{milestones:['DRI-EAF pilot by 2027','Green hydrogen supply 2029','50% scrap-based by 2028'],phaseOut:'BF-BOF by 2035',levers:['Electric arc furnace','Green hydrogen DRI','Scrap recycling','CCUS retrofit'],capex:'$3.8B over 12yr',intensity:'1.85 tCO2/t-steel baseline'},
  Cement:{milestones:['Clinker ratio <65% by 2027','CCUS operational 2030','Alternative fuels 40% by 2028'],phaseOut:'Unabated kilns by 2040',levers:['Clinker substitution','Alternative fuels','CCUS','Novel binders'],capex:'$1.9B over 10yr',intensity:'0.63 tCO2/t-cement baseline'},
  'Oil & Gas':{milestones:['Zero routine flaring 2025','Methane intensity <0.2% by 2027','30% clean energy CapEx by 2030'],phaseOut:'Upstream expansion halt 2028',levers:['Methane reduction','Electrification','CCS','Diversification to clean energy'],capex:'$5.2B over 15yr',intensity:'22.4 kgCO2e/boe baseline'},
  Aviation:{milestones:['SAF 10% blend by 2028','Fleet efficiency +20% by 2030','Carbon-neutral ground ops 2026'],phaseOut:'Oldest fleet types by 2028',levers:['Sustainable aviation fuel','Fleet renewal','Operational efficiency','Carbon offsets bridge'],capex:'$4.1B over 12yr',intensity:'89g CO2/RPK baseline'},
  Shipping:{milestones:['LNG fleet 30% by 2028','Green corridor participation 2027','Shore power all ports 2026'],phaseOut:'HFO-only vessels by 2030',levers:['Alternative fuels (LNG/ammonia)','Wind-assist','Speed optimization','Shore power'],capex:'$2.7B over 10yr',intensity:'12.1g CO2/t-km baseline'},
  Agriculture:{milestones:['Regenerative practices 50% by 2028','Precision fertilizer 2027','Deforestation-free supply chain 2026'],phaseOut:'Conventional tillage by 2030',levers:['Regenerative agriculture','Precision farming','Methane capture','Supply chain traceability'],capex:'$0.8B over 8yr',intensity:'4.2 tCO2e/ha baseline'},
  'Real Estate':{milestones:['All new builds net-zero 2027','Retrofit 30% portfolio by 2029','100% renewable electricity 2026'],phaseOut:'Gas boilers by 2035',levers:['Deep retrofit','Heat pumps','On-site renewables','Smart building systems'],capex:'$1.4B over 10yr',intensity:'45 kgCO2/sqm baseline'},
  Automotive:{milestones:['50% BEV sales by 2028','ICE phase-out plan 2030','Supply chain Scope 3 mapped 2027'],phaseOut:'Pure ICE models by 2032',levers:['BEV transition','Battery gigafactories','Lightweight materials','Circular supply chain'],capex:'$6.3B over 10yr',intensity:'127g CO2/km fleet avg baseline'},
  Chemicals:{milestones:['Circular feedstock 25% by 2028','Process electrification 40% by 2030','Green hydrogen integration 2029'],phaseOut:'Steam crackers (unabated) by 2038',levers:['Feedstock switch','Process electrification','Green hydrogen','Chemical recycling'],capex:'$3.1B over 12yr',intensity:'1.52 tCO2/t-product baseline'}
};

const STEP_FIELDS={
  Ambition:[{id:'nzTarget',label:'Net-Zero Target Year',type:'select',options:['2040','2045','2050','2060']},{id:'interimTarget',label:'Interim Target (% reduction by 2030)',type:'number'},{id:'baselineYear',label:'Baseline Year',type:'select',options:['2019','2020','2021','2022']},{id:'scope',label:'Scope Coverage',type:'select',options:['Scope 1+2','Scope 1+2+3','All Scopes + Value Chain']}],
  Action:[{id:'keyLevers',label:'Key Decarbonisation Levers (comma-separated)',type:'text'},{id:'capexCommit',label:'CapEx Commitment ($M)',type:'number'},{id:'timeline',label:'Implementation Timeline',type:'select',options:['3 years','5 years','7 years','10 years']},{id:'techPathway',label:'Technology Pathway',type:'text'}],
  Accountability:[{id:'metrics',label:'Key Metrics & KPIs (comma-separated)',type:'text'},{id:'reporting',label:'Reporting Framework',type:'select',options:['TPT','TCFD','ISSB','CDP','GRI']},{id:'verification',label:'Third-Party Verification',type:'select',options:['Annual audit','Biennial audit','Self-assessed','SBTi validated']},{id:'escalation',label:'Escalation Mechanism',type:'text'}],
  Governance:[{id:'boardOversight',label:'Board Oversight Structure',type:'select',options:['Dedicated committee','ESG sub-committee','Full board quarterly','Audit committee']},{id:'mgmtIncentives',label:'Management Incentives Linked (%)',type:'number'},{id:'skillsTraining',label:'Climate Skills Training',type:'select',options:['Annual mandatory','Biennial','Ad-hoc','None planned']},{id:'stakeholderEngage',label:'Stakeholder Engagement Plan',type:'text'}],
  Basis:[{id:'scenario',label:'Scenario Analysis',type:'select',options:['IEA NZE 2050','NGFS Orderly','NGFS Disorderly','Custom']},{id:'assumptions',label:'Key Assumptions',type:'text'},{id:'dataQuality',label:'Data Quality Score',type:'select',options:['High (>80% primary)','Medium (50-80%)','Low (<50%)','Estimated']},{id:'limitations',label:'Known Limitations',type:'text'}]
};

const genCompanies=(count)=>{
  const prefixes=['Global','Trans','Apex','Nova','Prime','Stellar','Vertex','Omni','Crest','Meridian','Pacific','Atlantic','Nordic','Alpine','Quantum','Nexus','Pinnacle','Summit','Horizon','Zenith'];
  const suffixes=['Energy','Steel Corp','Materials','Petroleum','Air','Maritime','AgriFoods','Properties','Motors','ChemCo','Power','Metals','Industries','Resources','Holdings','Solutions','Group','Systems','Capital','Dynamics'];
  const companies=[];
  for(let i=0;i<count;i++){
    const s=sr(i*7+3);const s2=sr(i*13+7);const s3=sr(i*19+11);const s4=sr(i*23+17);
    const sector=SECTORS[Math.floor(s*SECTORS.length)];
    const name=prefixes[Math.floor(s2*prefixes.length)]+' '+suffixes[Math.floor(s3*suffixes.length)];
    const readiness=Math.floor(s4*100);
    const elements=TPT_ELEMENTS.map((_,ei)=>{const v=sr(i*31+ei*7);return v>0.3?Math.floor(v*100):0;});
    const qData=QUARTERS.map((_,qi)=>Math.floor(sr(i*41+qi*11)*100));
    companies.push({id:i,name,sector,readiness,elements,qData,
      revenue:Math.floor(sr(i*47+5)*50+1)+'B',
      country:['US','UK','DE','JP','CN','FR','AU','CA','BR','KR'][Math.floor(sr(i*53+9)*10)],
      sbtiStatus:['Committed','Target Set','No Commitment','In Progress'][Math.floor(sr(i*59+13)*4)],
      emissionsScope1:Math.floor(sr(i*61+3)*5000+500),
      emissionsScope2:Math.floor(sr(i*67+7)*2000+200),
    });
  }
  return companies;
};

const COMPANIES=genCompanies(150);

const PRE_PLANS=Array.from({length:30},(_,i)=>{
  const s=sr(i*97+31);const s2=sr(i*83+47);
  return{
    id:i,company:COMPANIES[i].name,sector:COMPANIES[i].sector,
    status:['Draft','Submitted','Approved','Under Review'][Math.floor(s*4)],
    readiness:Math.floor(s2*60+40),
    lastUpdated:`2025-${String(Math.floor(sr(i*71+5)*12)+1).padStart(2,'0')}-${String(Math.floor(sr(i*79+9)*28)+1).padStart(2,'0')}`,
    completedSteps:Math.floor(sr(i*89+3)*5)+1
  };
});

const pill=(color,text)=>({display:'inline-block',padding:'2px 10px',borderRadius:12,fontSize:11,fontWeight:600,background:color+'18',color,border:`1px solid ${color}30`});

export default function TransitionPlanBuilderPage(){
  const [tab,setTab]=useState(0);
  const TABS=['Plan Builder Wizard','Sector Templates','Gap Analysis','Portfolio Transition Readiness'];

  return(
    <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:24,color:T.text}}>
      <div style={{maxWidth:1440,margin:'0 auto'}}>
        <div style={{marginBottom:24}}>
          <h1 style={{fontSize:26,fontWeight:700,color:T.navy,margin:0}}>Transition Plan Builder</h1>
          <p style={{color:T.textSec,fontSize:14,margin:'4px 0 0'}}>TPT-aligned entity-level transition plan construction, sector templates & gap analysis</p>
        </div>
        <div style={{display:'flex',gap:4,marginBottom:24,background:T.surface,borderRadius:10,padding:4,border:`1px solid ${T.border}`}}>
          {TABS.map((t,i)=>(
            <button key={i} onClick={()=>setTab(i)} style={{flex:1,padding:'10px 16px',borderRadius:8,border:'none',cursor:'pointer',fontSize:13,fontWeight:tab===i?700:500,background:tab===i?T.navy:'transparent',color:tab===i?'#fff':T.textSec,transition:'all 0.2s'}}>
              {t}
            </button>
          ))}
        </div>
        {tab===0&&<PlanBuilderWizard/>}
        {tab===1&&<SectorTemplates/>}
        {tab===2&&<GapAnalysis/>}
        {tab===3&&<PortfolioReadiness/>}
      </div>
    </div>
  );
}

/* ====================== TAB 1: PLAN BUILDER WIZARD ====================== */
function PlanBuilderWizard(){
  const [step,setStep]=useState(0);
  const [formData,setFormData]=useState({});
  const [selectedSector,setSelectedSector]=useState('Power');
  const [viewingPlan,setViewingPlan]=useState(null);
  const [showPlans,setShowPlans]=useState(false);
  const [validationErrors,setValidationErrors]=useState({});

  const updateField=useCallback((id,val)=>{
    setFormData(prev=>({...prev,[id]:val}));
    setValidationErrors(prev=>{const n={...prev};delete n[id];return n;});
  },[]);

  const validateStep=useCallback(()=>{
    const fields=STEP_FIELDS[TPT_STEPS[step]];
    const errors={};
    fields.forEach(f=>{if(!formData[f.id]||formData[f.id]==='')errors[f.id]='Required';});
    setValidationErrors(errors);
    return Object.keys(errors).length===0;
  },[step,formData]);

  const readinessScore=useMemo(()=>{
    const totalFields=TPT_STEPS.reduce((acc,s)=>acc+STEP_FIELDS[s].length,0);
    const filled=Object.values(formData).filter(v=>v&&v!=='').length;
    return Math.min(100,Math.round((filled/totalFields)*100));
  },[formData]);

  const handleNext=()=>{if(validateStep()&&step<4)setStep(step+1);};
  const handleBack=()=>{if(step>0)setStep(step-1);};

  const sectorTemplate=SECTOR_TEMPLATES[selectedSector];

  return(
    <div style={{display:'grid',gridTemplateColumns:'280px 1fr',gap:20}}>
      {/* Left sidebar */}
      <div style={{display:'flex',flexDirection:'column',gap:16}}>
        {/* Progress */}
        <div style={{background:T.surface,borderRadius:12,padding:20,border:`1px solid ${T.border}`}}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>Plan Progress</div>
          {TPT_STEPS.map((s,i)=>(
            <div key={i} onClick={()=>setStep(i)} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 10px',borderRadius:8,cursor:'pointer',background:step===i?T.navy+'10':'transparent',marginBottom:4}}>
              <div style={{width:28,height:28,borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,background:i<step?T.green:step===i?T.navy:T.border,color:i<=step?'#fff':T.textMut}}>{i<step?'\u2713':i+1}</div>
              <div style={{fontSize:13,fontWeight:step===i?700:500,color:step===i?T.navy:T.textSec}}>{s}</div>
            </div>
          ))}
        </div>

        {/* Readiness score */}
        <div style={{background:T.surface,borderRadius:12,padding:20,border:`1px solid ${T.border}`,textAlign:'center'}}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>Readiness Score</div>
          <div style={{position:'relative',width:100,height:100,margin:'0 auto'}}>
            <svg viewBox="0 0 100 100" style={{transform:'rotate(-90deg)'}}>
              <circle cx="50" cy="50" r="42" fill="none" stroke={T.border} strokeWidth="8"/>
              <circle cx="50" cy="50" r="42" fill="none" stroke={readinessScore>=70?T.green:readinessScore>=40?T.amber:T.red} strokeWidth="8" strokeDasharray={`${readinessScore*2.64} 264`} strokeLinecap="round"/>
            </svg>
            <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',fontSize:22,fontWeight:700,color:T.navy}}>{readinessScore}%</div>
          </div>
          <div style={{fontSize:11,color:T.textMut,marginTop:8}}>{readinessScore>=70?'Strong alignment':'Needs more detail'}</div>
        </div>

        {/* Sector picker */}
        <div style={{background:T.surface,borderRadius:12,padding:20,border:`1px solid ${T.border}`}}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Sector Template</div>
          <select value={selectedSector} onChange={e=>setSelectedSector(e.target.value)} style={{width:'100%',padding:'8px 10px',borderRadius:8,border:`1px solid ${T.border}`,fontSize:13,fontFamily:T.font,color:T.text,background:T.surface}}>
            {SECTORS.map(s=><option key={s}>{s}</option>)}
          </select>
          <div style={{marginTop:10,fontSize:11,color:T.textSec}}>
            <div><b>Phase-out:</b> {sectorTemplate.phaseOut}</div>
            <div style={{marginTop:4}}><b>CapEx:</b> {sectorTemplate.capex}</div>
          </div>
        </div>

        {/* View pre-built plans */}
        <button onClick={()=>setShowPlans(!showPlans)} style={{padding:'10px 16px',borderRadius:10,border:`1px solid ${T.border}`,background:T.surface,cursor:'pointer',fontSize:13,fontWeight:600,color:T.navy,fontFamily:T.font}}>
          {showPlans?'Hide':'View'} Pre-Built Plans ({PRE_PLANS.length})
        </button>
      </div>

      {/* Main content */}
      <div>
        {showPlans?(
          <div style={{background:T.surface,borderRadius:12,padding:24,border:`1px solid ${T.border}`}}>
            <div style={{fontSize:16,fontWeight:700,color:T.navy,marginBottom:16}}>Pre-Built Transition Plans</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
              {PRE_PLANS.map(p=>(
                <div key={p.id} onClick={()=>setViewingPlan(viewingPlan===p.id?null:p.id)} style={{padding:14,borderRadius:10,border:`1px solid ${viewingPlan===p.id?T.navy:T.border}`,cursor:'pointer',background:viewingPlan===p.id?T.navy+'08':T.surface,transition:'all 0.2s'}}>
                  <div style={{fontSize:13,fontWeight:600,color:T.navy}}>{p.company}</div>
                  <div style={{fontSize:11,color:T.textSec,marginTop:2}}>{p.sector}</div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:8}}>
                    <span style={pill(p.status==='Approved'?T.green:p.status==='Draft'?T.amber:T.navyL,p.status)}>{p.status}</span>
                    <span style={{fontSize:12,fontWeight:700,color:p.readiness>=70?T.green:T.amber}}>{p.readiness}%</span>
                  </div>
                  <div style={{fontSize:10,color:T.textMut,marginTop:6}}>Updated: {p.lastUpdated} | Steps: {p.completedSteps}/5</div>
                  {viewingPlan===p.id&&(
                    <div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${T.border}`,fontSize:11,color:T.textSec}}>
                      <div style={{marginBottom:4}}><b>Sector milestones:</b></div>
                      {(SECTOR_TEMPLATES[p.sector]||SECTOR_TEMPLATES.Power).milestones.map((m,mi)=>(<div key={mi} style={{paddingLeft:8}}>- {m}</div>))}
                      <div style={{marginTop:6}}><b>Key levers:</b> {(SECTOR_TEMPLATES[p.sector]||SECTOR_TEMPLATES.Power).levers.join(', ')}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ):(
          <div style={{background:T.surface,borderRadius:12,padding:28,border:`1px solid ${T.border}`}}>
            {/* Step header */}
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <div>
                <div style={{fontSize:18,fontWeight:700,color:T.navy}}>Step {step+1}: {TPT_STEPS[step]}</div>
                <div style={{fontSize:12,color:T.textSec,marginTop:2}}>Complete all fields to advance. Sector: {selectedSector}</div>
              </div>
              <div style={{display:'flex',gap:2}}>
                {TPT_STEPS.map((_,i)=>(
                  <div key={i} style={{width:40,height:4,borderRadius:2,background:i<=step?T.navy:T.border}}/>
                ))}
              </div>
            </div>

            {/* Form fields */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:24}}>
              {STEP_FIELDS[TPT_STEPS[step]].map(f=>(
                <div key={f.id}>
                  <label style={{fontSize:12,fontWeight:600,color:T.textSec,display:'block',marginBottom:4}}>{f.label}</label>
                  {f.type==='select'?(
                    <select value={formData[f.id]||''} onChange={e=>updateField(f.id,e.target.value)} style={{width:'100%',padding:'10px 12px',borderRadius:8,border:`1px solid ${validationErrors[f.id]?T.red:T.border}`,fontSize:13,fontFamily:T.font,color:T.text,background:T.surface}}>
                      <option value="">Select...</option>
                      {f.options.map(o=><option key={o} value={o}>{o}</option>)}
                    </select>
                  ):f.type==='number'?(
                    <input type="number" value={formData[f.id]||''} onChange={e=>updateField(f.id,e.target.value)} style={{width:'100%',padding:'10px 12px',borderRadius:8,border:`1px solid ${validationErrors[f.id]?T.red:T.border}`,fontSize:13,fontFamily:T.font,color:T.text,background:T.surface,boxSizing:'border-box'}}/>
                  ):(
                    <input type="text" value={formData[f.id]||''} onChange={e=>updateField(f.id,e.target.value)} placeholder={f.id==='keyLevers'?(SECTOR_TEMPLATES[selectedSector]||SECTOR_TEMPLATES.Power).levers.join(', '):''} style={{width:'100%',padding:'10px 12px',borderRadius:8,border:`1px solid ${validationErrors[f.id]?T.red:T.border}`,fontSize:13,fontFamily:T.font,color:T.text,background:T.surface,boxSizing:'border-box'}}/>
                  )}
                  {validationErrors[f.id]&&<div style={{fontSize:11,color:T.red,marginTop:2}}>{validationErrors[f.id]}</div>}
                </div>
              ))}
            </div>

            {/* Sector-specific hints */}
            <div style={{background:T.bg,borderRadius:10,padding:16,marginBottom:20,border:`1px solid ${T.border}`}}>
              <div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:6}}>Sector Guidance: {selectedSector}</div>
              <div style={{fontSize:12,color:T.textSec,lineHeight:1.6}}>
                <div><b>Milestones:</b> {sectorTemplate.milestones.join(' | ')}</div>
                <div><b>Key Levers:</b> {sectorTemplate.levers.join(', ')}</div>
                <div><b>Intensity:</b> {sectorTemplate.intensity}</div>
              </div>
            </div>

            {/* Navigation */}
            <div style={{display:'flex',justifyContent:'space-between'}}>
              <button onClick={handleBack} disabled={step===0} style={{padding:'10px 24px',borderRadius:8,border:`1px solid ${T.border}`,background:step===0?T.bg:T.surface,cursor:step===0?'default':'pointer',fontSize:13,fontWeight:600,color:step===0?T.textMut:T.navy,fontFamily:T.font,opacity:step===0?0.5:1}}>Back</button>
              <button onClick={handleNext} style={{padding:'10px 24px',borderRadius:8,border:'none',background:step===4?T.green:T.navy,cursor:'pointer',fontSize:13,fontWeight:600,color:'#fff',fontFamily:T.font}}>
                {step===4?'Submit Plan':'Next Step'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ====================== TAB 2: SECTOR TEMPLATES ====================== */
function SectorTemplates(){
  const [selected,setSelected]=useState(null);
  const [compare,setCompare]=useState(null);
  const [editMode,setEditMode]=useState(false);
  const [editData,setEditData]=useState({});
  const [compareMode,setCompareMode]=useState(false);

  const sectorMetrics=useMemo(()=>SECTORS.map((s,i)=>{
    const tpl=SECTOR_TEMPLATES[s];
    return{
      sector:s,capex:parseFloat(tpl.capex.replace(/[^0-9.]/g,'')),
      milestoneCount:tpl.milestones.length,leverCount:tpl.levers.length,
      readiness:Math.floor(sr(i*37+19)*40+50),
      companies:COMPANIES.filter(c=>c.sector===s).length,
      avgScore:Math.floor(COMPANIES.filter(c=>c.sector===s).reduce((a,c)=>a+c.readiness,0)/Math.max(1,COMPANIES.filter(c=>c.sector===s).length)),
    };
  }),[]);

  const capexChart=useMemo(()=>sectorMetrics.map(m=>({name:m.sector.length>8?m.sector.substring(0,8)+'..':m.sector,capex:m.capex,companies:m.companies})),[sectorMetrics]);

  const handleSelectSector=(s)=>{
    if(compareMode&&selected){setCompare(s===compare?null:s);}
    else{setSelected(s===selected?null:s);setCompare(null);setEditMode(false);setEditData({});}
  };

  const handleEditField=(field,val)=>{setEditData(prev=>({...prev,[field]:val}));};

  const getTemplateData=(s)=>{
    const base=SECTOR_TEMPLATES[s];
    if(s===selected&&editMode&&Object.keys(editData).length>0){
      return{...base,...editData,milestones:editData.milestones?editData.milestones.split('|'):base.milestones,levers:editData.levers?editData.levers.split(','):base.levers};
    }
    return base;
  };

  const radarData=useMemo(()=>{
    if(!selected)return[];
    const dims=['CapEx Scale','Tech Maturity','Policy Alignment','Timeline Feasibility','Supply Chain Ready','Workforce Transition'];
    return dims.map((d,i)=>({
      dim:d,
      [selected]:Math.floor(sr(SECTORS.indexOf(selected)*17+i*11)*50+40),
      ...(compare?{[compare]:Math.floor(sr(SECTORS.indexOf(compare)*17+i*11)*50+40)}:{})
    }));
  },[selected,compare]);

  return(
    <div>
      {/* Controls */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div style={{fontSize:14,color:T.textSec}}>{selected?`Selected: ${selected}`:'Click a sector to view template'}{compare?` vs ${compare}`:''}</div>
        <button onClick={()=>{setCompareMode(!compareMode);setCompare(null);}} style={{padding:'8px 16px',borderRadius:8,border:`1px solid ${compareMode?T.navy:T.border}`,background:compareMode?T.navy+'10':T.surface,cursor:'pointer',fontSize:12,fontWeight:600,color:T.navy,fontFamily:T.font}}>
          {compareMode?'Exit Compare':'Compare Mode'}
        </button>
      </div>

      {/* CapEx chart */}
      <div style={{background:T.surface,borderRadius:12,padding:20,border:`1px solid ${T.border}`,marginBottom:20}}>
        <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:12}}>Sector CapEx Requirements ($B)</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={capexChart}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="name" tick={{fontSize:10,fill:T.textSec}} axisLine={{stroke:T.border}}/>
            <YAxis tick={{fontSize:10,fill:T.textSec}} axisLine={{stroke:T.border}}/>
            <Tooltip contentStyle={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,fontSize:12,fontFamily:T.font}}/>
            <Bar dataKey="capex" fill={T.navy} radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Sector cards grid */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12,marginBottom:20}}>
        {SECTORS.map((s,i)=>{
          const m=sectorMetrics[i];
          const isSelected=s===selected||s===compare;
          return(
            <div key={s} onClick={()=>handleSelectSector(s)} style={{padding:16,borderRadius:10,border:`2px solid ${isSelected?T.navy:T.border}`,background:isSelected?T.navy+'08':T.surface,cursor:'pointer',transition:'all 0.2s'}}>
              <div style={{fontSize:13,fontWeight:700,color:T.navy}}>{s}</div>
              <div style={{fontSize:11,color:T.textSec,marginTop:4}}>{m.companies} companies</div>
              <div style={{display:'flex',justifyContent:'space-between',marginTop:8}}>
                <div style={{fontSize:10,color:T.textMut}}>Avg Score</div>
                <div style={{fontSize:13,fontWeight:700,color:m.avgScore>=60?T.green:T.amber}}>{m.avgScore}%</div>
              </div>
              <div style={{marginTop:6,height:4,borderRadius:2,background:T.border}}>
                <div style={{height:4,borderRadius:2,background:m.avgScore>=60?T.green:T.amber,width:`${m.avgScore}%`}}/>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected sector detail */}
      {selected&&(
        <div style={{display:'grid',gridTemplateColumns:compare?'1fr 1fr':'1fr 350px',gap:20}}>
          {[selected,compare].filter(Boolean).map(sec=>{
            const tpl=getTemplateData(sec);
            return(
              <div key={sec} style={{background:T.surface,borderRadius:12,padding:24,border:`1px solid ${T.border}`}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                  <div style={{fontSize:16,fontWeight:700,color:T.navy}}>{sec} Template</div>
                  {sec===selected&&!compare&&(
                    <button onClick={()=>setEditMode(!editMode)} style={{padding:'6px 14px',borderRadius:8,border:`1px solid ${T.border}`,background:editMode?T.gold+'15':T.surface,cursor:'pointer',fontSize:12,fontWeight:600,color:T.navy,fontFamily:T.font}}>
                      {editMode?'View Mode':'Edit Template'}
                    </button>
                  )}
                </div>

                {editMode&&sec===selected?(
                  <div style={{display:'flex',flexDirection:'column',gap:12}}>
                    <div>
                      <label style={{fontSize:11,fontWeight:600,color:T.textSec}}>Phase-Out Plan</label>
                      <input value={editData.phaseOut||tpl.phaseOut} onChange={e=>handleEditField('phaseOut',e.target.value)} style={{width:'100%',padding:'8px 10px',borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font,color:T.text,boxSizing:'border-box'}}/>
                    </div>
                    <div>
                      <label style={{fontSize:11,fontWeight:600,color:T.textSec}}>CapEx Requirement</label>
                      <input value={editData.capex||tpl.capex} onChange={e=>handleEditField('capex',e.target.value)} style={{width:'100%',padding:'8px 10px',borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font,color:T.text,boxSizing:'border-box'}}/>
                    </div>
                    <div>
                      <label style={{fontSize:11,fontWeight:600,color:T.textSec}}>Milestones (pipe-separated)</label>
                      <textarea value={editData.milestones||tpl.milestones.join('|')} onChange={e=>handleEditField('milestones',e.target.value)} rows={3} style={{width:'100%',padding:'8px 10px',borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font,color:T.text,boxSizing:'border-box',resize:'vertical'}}/>
                    </div>
                    <div>
                      <label style={{fontSize:11,fontWeight:600,color:T.textSec}}>Key Levers (comma-separated)</label>
                      <input value={editData.levers||tpl.levers.join(',')} onChange={e=>handleEditField('levers',e.target.value)} style={{width:'100%',padding:'8px 10px',borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font,color:T.text,boxSizing:'border-box'}}/>
                    </div>
                  </div>
                ):(
                  <div>
                    <div style={{marginBottom:14}}>
                      <div style={{fontSize:12,fontWeight:600,color:T.textSec,marginBottom:4}}>Milestones</div>
                      {tpl.milestones.map((m,mi)=>(
                        <div key={mi} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 0',borderBottom:`1px solid ${T.bg}`}}>
                          <div style={{width:6,height:6,borderRadius:3,background:T.navy}}/>
                          <span style={{fontSize:12,color:T.text}}>{m}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{marginBottom:14}}>
                      <div style={{fontSize:12,fontWeight:600,color:T.textSec,marginBottom:4}}>Phase-Out</div>
                      <div style={{fontSize:12,color:T.text}}>{tpl.phaseOut}</div>
                    </div>
                    <div style={{marginBottom:14}}>
                      <div style={{fontSize:12,fontWeight:600,color:T.textSec,marginBottom:4}}>Key Levers</div>
                      <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                        {tpl.levers.map((l,li)=>(<span key={li} style={{...pill(T.navy,''),fontSize:11,padding:'3px 10px'}}>{l}</span>))}
                      </div>
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                      <div style={{padding:10,borderRadius:8,background:T.bg}}>
                        <div style={{fontSize:10,color:T.textMut}}>CapEx Requirement</div>
                        <div style={{fontSize:15,fontWeight:700,color:T.navy}}>{tpl.capex}</div>
                      </div>
                      <div style={{padding:10,borderRadius:8,background:T.bg}}>
                        <div style={{fontSize:10,color:T.textMut}}>Baseline Intensity</div>
                        <div style={{fontSize:15,fontWeight:700,color:T.navy}}>{tpl.intensity}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Radar comparison */}
          {!compare&&(
            <div style={{background:T.surface,borderRadius:12,padding:20,border:`1px solid ${T.border}`}}>
              <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:12}}>Template Maturity Dimensions</div>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke={T.border}/>
                  <PolarAngleAxis dataKey="dim" tick={{fontSize:10,fill:T.textSec}}/>
                  <PolarRadiusAxis tick={{fontSize:9,fill:T.textMut}} domain={[0,100]}/>
                  <Radar name={selected} dataKey={selected} stroke={T.navy} fill={T.navy} fillOpacity={0.2}/>
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}
          {compare&&(
            <div style={{gridColumn:'1/-1',background:T.surface,borderRadius:12,padding:20,border:`1px solid ${T.border}`}}>
              <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:12}}>Comparison: {selected} vs {compare}</div>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke={T.border}/>
                  <PolarAngleAxis dataKey="dim" tick={{fontSize:10,fill:T.textSec}}/>
                  <PolarRadiusAxis tick={{fontSize:9,fill:T.textMut}} domain={[0,100]}/>
                  <Radar name={selected} dataKey={selected} stroke={T.navy} fill={T.navy} fillOpacity={0.2}/>
                  <Radar name={compare} dataKey={compare} stroke={T.gold} fill={T.gold} fillOpacity={0.2}/>
                  <Legend wrapperStyle={{fontSize:12}}/>
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ====================== TAB 3: GAP ANALYSIS ====================== */
function GapAnalysis(){
  const [selectedCompany,setSelectedCompany]=useState(null);
  const [searchTerm,setSearchTerm]=useState('');
  const [sectorFilter,setSectorFilter]=useState('All');

  const filteredCompanies=useMemo(()=>{
    return COMPANIES.filter(c=>{
      const matchSearch=!searchTerm||c.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchSector=sectorFilter==='All'||c.sector===sectorFilter;
      return matchSearch&&matchSector;
    });
  },[searchTerm,sectorFilter]);

  const company=selectedCompany!==null?COMPANIES.find(c=>c.id===selectedCompany):null;

  const radarData=useMemo(()=>{
    if(!company)return[];
    return TPT_ELEMENTS.map((el,i)=>({element:el.length>12?el.substring(0,12)+'..':el,fullName:el,score:company.elements[i],benchmark:Math.floor(sr(i*29+77)*30+55)}));
  },[company]);

  const missingElements=useMemo(()=>{
    if(!company)return[];
    return TPT_ELEMENTS.map((el,i)=>({element:el,score:company.elements[i],gap:100-company.elements[i]})).filter(e=>e.score<50).sort((a,b)=>a.score-b.score);
  },[company]);

  const peers=useMemo(()=>{
    if(!company)return[];
    return COMPANIES.filter(c=>c.sector===company.sector&&c.id!==company.id).sort((a,b)=>Math.abs(a.readiness-company.readiness)-Math.abs(b.readiness-company.readiness)).slice(0,5);
  },[company]);

  const remediations=useMemo(()=>{
    if(!missingElements.length)return[];
    const recs={
      'Net Zero Target':'Set a science-based net-zero target validated by SBTi, covering all material scopes',
      'Interim Milestones':'Define 5-year interim reduction milestones with quantified absolute and intensity targets',
      'Scope 1 Plan':'Develop detailed Scope 1 abatement roadmap with technology pathways and investment timeline',
      'Scope 2 Plan':'Establish RE100-aligned procurement strategy and PPA pipeline for 100% renewable electricity',
      'Scope 3 Plan':'Map value chain emissions hotspots and engage top 20 suppliers on decarbonisation targets',
      'CapEx Alignment':'Align capital expenditure with Paris-aligned pathway, disclose % green vs brown CapEx',
      'Revenue Alignment':'Classify revenue streams against EU Taxonomy and quantify green revenue share trajectory',
      'Just Transition':'Develop just transition strategy covering workforce reskilling, community engagement, and social safeguards',
      'Board Oversight':'Establish dedicated board sustainability committee with climate-competent directors',
      'Risk Management':'Integrate climate scenario analysis into enterprise risk framework per TCFD recommendations',
      'Metrics & KPIs':'Define comprehensive KPI dashboard with leading/lagging indicators, tied to executive remuneration',
      'Verification':'Engage independent third-party assurance provider for annual limited/reasonable assurance on climate data'
    };
    return missingElements.map(e=>({...e,recommendation:recs[e.element]||'Develop a comprehensive strategy for this TPT element'}));
  },[missingElements]);

  const complianceTimeline=useMemo(()=>{
    if(!company)return[];
    return QUARTERS.map((q,i)=>({quarter:q,coverage:Math.min(100,Math.floor(sr(company.id*43+i*13)*15+company.readiness*(1+i*0.06))),target:Math.min(100,50+i*4.5)}));
  },[company]);

  const peerCompareData=useMemo(()=>{
    if(!company||!peers.length)return[];
    return TPT_ELEMENTS.map((el,i)=>({
      element:el.length>10?el.substring(0,10)+'..':el,
      [company.name]:company.elements[i],
      peerAvg:Math.floor(peers.reduce((a,p)=>a+p.elements[i],0)/peers.length)
    }));
  },[company,peers]);

  return(
    <div>
      {/* Search & filter */}
      <div style={{display:'flex',gap:12,marginBottom:20}}>
        <input value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} placeholder="Search company..." style={{flex:1,padding:'10px 14px',borderRadius:10,border:`1px solid ${T.border}`,fontSize:13,fontFamily:T.font,color:T.text,background:T.surface}}/>
        <select value={sectorFilter} onChange={e=>setSectorFilter(e.target.value)} style={{padding:'10px 14px',borderRadius:10,border:`1px solid ${T.border}`,fontSize:13,fontFamily:T.font,color:T.text,background:T.surface}}>
          <option value="All">All Sectors</option>
          {SECTORS.map(s=><option key={s}>{s}</option>)}
        </select>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'300px 1fr',gap:20}}>
        {/* Company list */}
        <div style={{background:T.surface,borderRadius:12,padding:16,border:`1px solid ${T.border}`,maxHeight:700,overflowY:'auto'}}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:10}}>Companies ({filteredCompanies.length})</div>
          {filteredCompanies.slice(0,40).map(c=>(
            <div key={c.id} onClick={()=>setSelectedCompany(c.id)} style={{padding:'10px 12px',borderRadius:8,cursor:'pointer',background:selectedCompany===c.id?T.navy+'10':'transparent',borderBottom:`1px solid ${T.bg}`,transition:'all 0.15s'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div>
                  <div style={{fontSize:12,fontWeight:600,color:T.navy}}>{c.name}</div>
                  <div style={{fontSize:10,color:T.textMut}}>{c.sector} | {c.country}</div>
                </div>
                <div style={{fontSize:13,fontWeight:700,color:c.readiness>=70?T.green:c.readiness>=40?T.amber:T.red}}>{c.readiness}%</div>
              </div>
            </div>
          ))}
        </div>

        {/* Analysis panel */}
        {company?(
          <div style={{display:'flex',flexDirection:'column',gap:16}}>
            {/* Header */}
            <div style={{background:T.surface,borderRadius:12,padding:20,border:`1px solid ${T.border}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <div style={{fontSize:18,fontWeight:700,color:T.navy}}>{company.name}</div>
                <div style={{fontSize:12,color:T.textSec}}>{company.sector} | Revenue: ${company.revenue} | {company.country} | SBTi: {company.sbtiStatus}</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:28,fontWeight:700,color:company.readiness>=70?T.green:company.readiness>=40?T.amber:T.red}}>{company.readiness}%</div>
                <div style={{fontSize:11,color:T.textMut}}>TPT Readiness</div>
              </div>
            </div>

            {/* Radar + Missing elements */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
              <div style={{background:T.surface,borderRadius:12,padding:20,border:`1px solid ${T.border}`}}>
                <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:8}}>TPT Element Coverage</div>
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke={T.border}/>
                    <PolarAngleAxis dataKey="element" tick={{fontSize:9,fill:T.textSec}}/>
                    <PolarRadiusAxis tick={{fontSize:8,fill:T.textMut}} domain={[0,100]}/>
                    <Radar name="Score" dataKey="score" stroke={T.navy} fill={T.navy} fillOpacity={0.25}/>
                    <Radar name="Benchmark" dataKey="benchmark" stroke={T.gold} fill={T.gold} fillOpacity={0.1} strokeDasharray="4 4"/>
                    <Legend wrapperStyle={{fontSize:11}}/>
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div style={{background:T.surface,borderRadius:12,padding:20,border:`1px solid ${T.border}`}}>
                <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:8}}>Missing / Weak Elements ({missingElements.length})</div>
                <div style={{maxHeight:260,overflowY:'auto'}}>
                  {missingElements.map((e,i)=>(
                    <div key={i} style={{padding:'8px 0',borderBottom:`1px solid ${T.bg}`}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                        <span style={{fontSize:12,fontWeight:600,color:T.text}}>{e.element}</span>
                        <span style={{fontSize:12,fontWeight:700,color:e.score===0?T.red:T.amber}}>{e.score}%</span>
                      </div>
                      <div style={{marginTop:4,height:4,borderRadius:2,background:T.border}}>
                        <div style={{height:4,borderRadius:2,background:e.score===0?T.red:T.amber,width:`${e.score}%`,transition:'width 0.3s'}}/>
                      </div>
                    </div>
                  ))}
                  {missingElements.length===0&&<div style={{fontSize:12,color:T.green,padding:16,textAlign:'center'}}>All elements above threshold</div>}
                </div>
              </div>
            </div>

            {/* Remediation recommendations */}
            {remediations.length>0&&(
              <div style={{background:T.surface,borderRadius:12,padding:20,border:`1px solid ${T.border}`}}>
                <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:12}}>Remediation Recommendations</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                  {remediations.map((r,i)=>(
                    <div key={i} style={{padding:14,borderRadius:10,background:T.bg,border:`1px solid ${T.border}`}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                        <span style={{fontSize:12,fontWeight:700,color:T.navy}}>{r.element}</span>
                        <span style={{...pill(r.score===0?T.red:T.amber,''),fontSize:10,padding:'2px 8px'}}>Gap: {r.gap}%</span>
                      </div>
                      <div style={{fontSize:11,color:T.textSec,lineHeight:1.5}}>{r.recommendation}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Peer comparison */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
              <div style={{background:T.surface,borderRadius:12,padding:20,border:`1px solid ${T.border}`}}>
                <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:12}}>Peer Comparison (5 Closest)</div>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                  <thead>
                    <tr style={{borderBottom:`2px solid ${T.border}`}}>
                      <th style={{textAlign:'left',padding:'6px 8px',color:T.textSec,fontWeight:600}}>Company</th>
                      <th style={{textAlign:'right',padding:'6px 8px',color:T.textSec,fontWeight:600}}>Readiness</th>
                      <th style={{textAlign:'right',padding:'6px 8px',color:T.textSec,fontWeight:600}}>SBTi</th>
                      <th style={{textAlign:'right',padding:'6px 8px',color:T.textSec,fontWeight:600}}>Delta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {peers.map(p=>(
                      <tr key={p.id} style={{borderBottom:`1px solid ${T.bg}`,cursor:'pointer'}} onClick={()=>setSelectedCompany(p.id)}>
                        <td style={{padding:'8px',fontWeight:500,color:T.navy}}>{p.name}</td>
                        <td style={{padding:'8px',textAlign:'right',fontWeight:700,color:p.readiness>=70?T.green:p.readiness>=40?T.amber:T.red}}>{p.readiness}%</td>
                        <td style={{padding:'8px',textAlign:'right',color:T.textSec}}>{p.sbtiStatus}</td>
                        <td style={{padding:'8px',textAlign:'right',fontWeight:600,color:p.readiness>company.readiness?T.green:T.red}}>{p.readiness>company.readiness?'+':''}{p.readiness-company.readiness}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{background:T.surface,borderRadius:12,padding:20,border:`1px solid ${T.border}`}}>
                <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:12}}>Timeline to Full Compliance</div>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={complianceTimeline}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                    <XAxis dataKey="quarter" tick={{fontSize:9,fill:T.textSec}} axisLine={{stroke:T.border}}/>
                    <YAxis tick={{fontSize:9,fill:T.textSec}} domain={[0,100]} axisLine={{stroke:T.border}}/>
                    <Tooltip contentStyle={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,fontSize:11,fontFamily:T.font}}/>
                    <Area type="monotone" dataKey="coverage" stroke={T.navy} fill={T.navy} fillOpacity={0.15} name="Projected Coverage"/>
                    <Area type="monotone" dataKey="target" stroke={T.gold} fill={T.gold} fillOpacity={0.08} strokeDasharray="5 5" name="Target Path"/>
                    <Legend wrapperStyle={{fontSize:11}}/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* vs Peer bar chart */}
            <div style={{background:T.surface,borderRadius:12,padding:20,border:`1px solid ${T.border}`}}>
              <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:12}}>Element Scores vs Peer Average</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={peerCompareData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                  <XAxis dataKey="element" tick={{fontSize:9,fill:T.textSec}} axisLine={{stroke:T.border}}/>
                  <YAxis tick={{fontSize:9,fill:T.textSec}} domain={[0,100]} axisLine={{stroke:T.border}}/>
                  <Tooltip contentStyle={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,fontSize:11,fontFamily:T.font}}/>
                  <Bar dataKey={company.name} fill={T.navy} radius={[3,3,0,0]}/>
                  <Bar dataKey="peerAvg" fill={T.gold} radius={[3,3,0,0]}/>
                  <Legend wrapperStyle={{fontSize:11}}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ):(
          <div style={{background:T.surface,borderRadius:12,padding:60,border:`1px solid ${T.border}`,textAlign:'center'}}>
            <div style={{fontSize:48,marginBottom:12,opacity:0.3}}>&#9776;</div>
            <div style={{fontSize:16,fontWeight:600,color:T.navy}}>Select a Company</div>
            <div style={{fontSize:13,color:T.textSec,marginTop:4}}>Choose from the list to view TPT gap analysis</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ====================== TAB 4: PORTFOLIO TRANSITION READINESS ====================== */
function PortfolioReadiness(){
  const [sectorFilter,setSectorFilter]=useState('All');
  const [running,setRunning]=useState(false);
  const [progress,setProgress]=useState(0);
  const [sortCol,setSortCol]=useState('readiness');
  const [sortDir,setSortDir]=useState('desc');
  const [hoveredCell,setHoveredCell]=useState(null);

  const filtered=useMemo(()=>{
    let list=sectorFilter==='All'?COMPANIES:COMPANIES.filter(c=>c.sector===sectorFilter);
    list=[...list].sort((a,b)=>{
      const mul=sortDir==='asc'?1:-1;
      if(sortCol==='name')return mul*a.name.localeCompare(b.name);
      if(sortCol==='sector')return mul*a.sector.localeCompare(b.sector);
      return mul*(a[sortCol]-b[sortCol]);
    });
    return list;
  },[sectorFilter,sortCol,sortDir]);

  const tierDistribution=useMemo(()=>{
    const tiers=[{name:'Leader (80-100%)',min:80,color:T.green},{name:'Advanced (60-79%)',min:60,color:T.sage},{name:'Developing (40-59%)',min:40,color:T.amber},{name:'Lagging (20-39%)',min:20,color:'#e07020'},{name:'No Plan (<20%)',min:0,color:T.red}];
    return tiers.map(t=>({...t,value:filtered.filter(c=>c.readiness>=t.min&&(t.min===80||c.readiness<t.min+20)).length}));
  },[filtered]);

  const top10=useMemo(()=>[...filtered].sort((a,b)=>b.readiness-a.readiness).slice(0,10),[filtered]);
  const bottom10=useMemo(()=>[...filtered].sort((a,b)=>a.readiness-b.readiness).slice(0,10),[filtered]);

  const sectorAvg=useMemo(()=>SECTORS.map(s=>{
    const cs=COMPANIES.filter(c=>c.sector===s);
    return{sector:s.length>8?s.substring(0,8)+'..':s,fullSector:s,avg:Math.floor(cs.reduce((a,c)=>a+c.readiness,0)/Math.max(cs.length,1)),count:cs.length};
  }),[]);

  const quarterlyTrend=useMemo(()=>QUARTERS.map((q,qi)=>({
    quarter:q,
    avgReadiness:Math.floor(COMPANIES.reduce((a,c)=>a+c.qData[qi],0)/COMPANIES.length),
    p75:Math.floor(COMPANIES.map(c=>c.qData[qi]).sort((a,b)=>b-a)[Math.floor(COMPANIES.length*0.25)]),
    p25:Math.floor(COMPANIES.map(c=>c.qData[qi]).sort((a,b)=>b-a)[Math.floor(COMPANIES.length*0.75)])
  })),[]);

  const handleRun=()=>{
    setRunning(true);setProgress(0);
    const iv=setInterval(()=>{
      setProgress(p=>{if(p>=100){clearInterval(iv);setRunning(false);return 100;}return p+2;});
    },60);
  };

  const handleSort=(col)=>{
    if(sortCol===col)setSortDir(d=>d==='asc'?'desc':'asc');
    else{setSortCol(col);setSortDir('desc');}
  };

  const exportCSV=()=>{
    const header='Company,Sector,Country,Readiness,SBTi Status,Revenue,Scope1,Scope2\n';
    const rows=filtered.map(c=>`"${c.name}","${c.sector}","${c.country}",${c.readiness},"${c.sbtiStatus}","${c.revenue}",${c.emissionsScope1},${c.emissionsScope2}`).join('\n');
    const blob=new Blob([header+rows],{type:'text/csv'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download='portfolio_transition_readiness.csv';a.click();
    URL.revokeObjectURL(url);
  };

  const heatmapColor=(val)=>{
    if(val>=80)return T.green+'30';
    if(val>=60)return T.sage+'25';
    if(val>=40)return T.amber+'25';
    if(val>=20)return '#e0702025';
    return T.red+'25';
  };

  const SortIcon=({col})=>{
    if(sortCol!==col)return <span style={{opacity:0.3,fontSize:10}}> &#9650;&#9660;</span>;
    return <span style={{fontSize:10,color:T.navy}}> {sortDir==='asc'?'\u25B2':'\u25BC'}</span>;
  };

  return(
    <div>
      {/* Controls row */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div style={{display:'flex',gap:12,alignItems:'center'}}>
          <select value={sectorFilter} onChange={e=>setSectorFilter(e.target.value)} style={{padding:'8px 14px',borderRadius:10,border:`1px solid ${T.border}`,fontSize:13,fontFamily:T.font,color:T.text,background:T.surface}}>
            <option value="All">All Sectors ({COMPANIES.length})</option>
            {SECTORS.map(s=><option key={s} value={s}>{s} ({COMPANIES.filter(c=>c.sector===s).length})</option>)}
          </select>
          <div style={{fontSize:13,color:T.textSec}}>Showing {filtered.length} companies</div>
        </div>
        <div style={{display:'flex',gap:10}}>
          <button onClick={handleRun} disabled={running} style={{padding:'8px 20px',borderRadius:8,border:'none',background:running?T.textMut:T.navy,cursor:running?'default':'pointer',fontSize:13,fontWeight:600,color:'#fff',fontFamily:T.font,display:'flex',alignItems:'center',gap:8}}>
            {running&&<span style={{display:'inline-block',width:14,height:14,border:`2px solid #fff`,borderTopColor:'transparent',borderRadius:'50%',animation:'spin 1s linear infinite'}}/>}
            {running?`Assessing... ${progress}%`:'Run Bulk Assessment'}
          </button>
          <button onClick={exportCSV} style={{padding:'8px 16px',borderRadius:8,border:`1px solid ${T.border}`,background:T.surface,cursor:'pointer',fontSize:13,fontWeight:600,color:T.navy,fontFamily:T.font}}>Export CSV</button>
        </div>
      </div>

      {running&&(
        <div style={{marginBottom:16,height:6,borderRadius:3,background:T.border,overflow:'hidden'}}>
          <div style={{height:6,borderRadius:3,background:`linear-gradient(90deg,${T.navy},${T.gold})`,width:`${progress}%`,transition:'width 0.1s'}}/>
        </div>
      )}

      {/* Summary cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12,marginBottom:20}}>
        {[
          {label:'Avg Readiness',value:Math.floor(filtered.reduce((a,c)=>a+c.readiness,0)/Math.max(filtered.length,1))+'%',color:T.navy},
          {label:'Leaders (80%+)',value:filtered.filter(c=>c.readiness>=80).length,color:T.green},
          {label:'Developing',value:filtered.filter(c=>c.readiness>=40&&c.readiness<60).length,color:T.amber},
          {label:'Lagging (<40%)',value:filtered.filter(c=>c.readiness<40).length,color:T.red},
          {label:'SBTi Committed',value:filtered.filter(c=>c.sbtiStatus==='Target Set'||c.sbtiStatus==='Committed').length,color:T.sage}
        ].map((m,i)=>(
          <div key={i} style={{background:T.surface,borderRadius:12,padding:16,border:`1px solid ${T.border}`,textAlign:'center'}}>
            <div style={{fontSize:10,color:T.textMut,textTransform:'uppercase',letterSpacing:0.5}}>{m.label}</div>
            <div style={{fontSize:24,fontWeight:700,color:m.color,marginTop:4}}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16,marginBottom:20}}>
        {/* Tier distribution pie */}
        <div style={{background:T.surface,borderRadius:12,padding:20,border:`1px solid ${T.border}`}}>
          <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:8}}>Readiness Tier Distribution</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={tierDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                {tierDistribution.map((t,i)=><Cell key={i} fill={t.color}/>)}
              </Pie>
              <Tooltip contentStyle={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,fontSize:11,fontFamily:T.font}}/>
              <Legend wrapperStyle={{fontSize:10}}/>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Sector averages */}
        <div style={{background:T.surface,borderRadius:12,padding:20,border:`1px solid ${T.border}`}}>
          <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:8}}>Sector Average Readiness</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={sectorAvg} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis type="number" domain={[0,100]} tick={{fontSize:9,fill:T.textSec}} axisLine={{stroke:T.border}}/>
              <YAxis type="category" dataKey="sector" tick={{fontSize:9,fill:T.textSec}} width={70} axisLine={{stroke:T.border}}/>
              <Tooltip contentStyle={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,fontSize:11,fontFamily:T.font}}/>
              <Bar dataKey="avg" fill={T.navy} radius={[0,4,4,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Quarterly trend */}
        <div style={{background:T.surface,borderRadius:12,padding:20,border:`1px solid ${T.border}`}}>
          <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:8}}>Quarterly Readiness Trend</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={quarterlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="quarter" tick={{fontSize:9,fill:T.textSec}} axisLine={{stroke:T.border}}/>
              <YAxis tick={{fontSize:9,fill:T.textSec}} domain={[0,100]} axisLine={{stroke:T.border}}/>
              <Tooltip contentStyle={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,fontSize:11,fontFamily:T.font}}/>
              <Area type="monotone" dataKey="p75" stroke="none" fill={T.navy} fillOpacity={0.08} name="P75"/>
              <Area type="monotone" dataKey="avgReadiness" stroke={T.navy} fill={T.navy} fillOpacity={0.15} name="Average"/>
              <Area type="monotone" dataKey="p25" stroke="none" fill={T.red} fillOpacity={0.06} name="P25"/>
              <Legend wrapperStyle={{fontSize:10}}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top/Bottom 10 tables */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        {[{label:'Top 10 — Most Ready',data:top10,color:T.green},{label:'Bottom 10 — Least Ready',data:bottom10,color:T.red}].map((block,bi)=>(
          <div key={bi} style={{background:T.surface,borderRadius:12,padding:20,border:`1px solid ${T.border}`}}>
            <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:10}}>{block.label}</div>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead>
                <tr style={{borderBottom:`2px solid ${T.border}`}}>
                  <th style={{textAlign:'left',padding:'6px 8px',color:T.textSec,fontWeight:600,fontSize:11}}>#</th>
                  <th style={{textAlign:'left',padding:'6px 8px',color:T.textSec,fontWeight:600,fontSize:11}}>Company</th>
                  <th style={{textAlign:'left',padding:'6px 8px',color:T.textSec,fontWeight:600,fontSize:11}}>Sector</th>
                  <th style={{textAlign:'right',padding:'6px 8px',color:T.textSec,fontWeight:600,fontSize:11}}>Readiness</th>
                  <th style={{textAlign:'right',padding:'6px 8px',color:T.textSec,fontWeight:600,fontSize:11}}>SBTi</th>
                </tr>
              </thead>
              <tbody>
                {block.data.map((c,i)=>(
                  <tr key={c.id} style={{borderBottom:`1px solid ${T.bg}`}}>
                    <td style={{padding:'6px 8px',color:T.textMut,fontSize:11}}>{i+1}</td>
                    <td style={{padding:'6px 8px',fontWeight:500,color:T.navy}}>{c.name}</td>
                    <td style={{padding:'6px 8px',color:T.textSec}}>{c.sector}</td>
                    <td style={{padding:'6px 8px',textAlign:'right'}}>
                      <span style={{fontWeight:700,color:block.color}}>{c.readiness}%</span>
                    </td>
                    <td style={{padding:'6px 8px',textAlign:'right',color:T.textSec,fontSize:11}}>{c.sbtiStatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {/* Heatmap */}
      <div style={{background:T.surface,borderRadius:12,padding:20,border:`1px solid ${T.border}`}}>
        <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:4}}>Portfolio Heatmap — 150 Companies x 12 Quarters</div>
        <div style={{fontSize:11,color:T.textSec,marginBottom:12}}>Color intensity represents transition readiness score per quarter. Hover for details.</div>

        {/* Legend */}
        <div style={{display:'flex',gap:16,marginBottom:12,fontSize:10,color:T.textSec}}>
          {[{label:'80-100%',color:T.green+'30'},{label:'60-79%',color:T.sage+'25'},{label:'40-59%',color:T.amber+'25'},{label:'20-39%',color:'#e0702025'},{label:'<20%',color:T.red+'25'}].map((l,i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',gap:4}}>
              <div style={{width:14,height:10,borderRadius:2,background:l.color,border:`1px solid ${T.border}`}}/>
              {l.label}
            </div>
          ))}
        </div>

        <div style={{overflowX:'auto',maxHeight:500,overflowY:'auto'}}>
          <table style={{borderCollapse:'collapse',fontSize:10,width:'100%',minWidth:900}}>
            <thead>
              <tr>
                <th style={{position:'sticky',left:0,background:T.surface,zIndex:2,padding:'4px 8px',textAlign:'left',fontSize:10,color:T.textSec,borderBottom:`1px solid ${T.border}`,minWidth:140,cursor:'pointer'}} onClick={()=>handleSort('name')}>
                  Company<SortIcon col="name"/>
                </th>
                <th style={{padding:'4px 6px',fontSize:10,color:T.textSec,borderBottom:`1px solid ${T.border}`,cursor:'pointer',minWidth:65}} onClick={()=>handleSort('sector')}>
                  Sector<SortIcon col="sector"/>
                </th>
                {QUARTERS.map(q=>(
                  <th key={q} style={{padding:'4px 4px',fontSize:9,color:T.textMut,borderBottom:`1px solid ${T.border}`,textAlign:'center',minWidth:42}}>{q}</th>
                ))}
                <th style={{padding:'4px 6px',fontSize:10,color:T.textSec,borderBottom:`1px solid ${T.border}`,textAlign:'right',cursor:'pointer',minWidth:55}} onClick={()=>handleSort('readiness')}>
                  Score<SortIcon col="readiness"/>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0,150).map(c=>(
                <tr key={c.id}>
                  <td style={{position:'sticky',left:0,background:T.surface,zIndex:1,padding:'3px 8px',fontSize:10,fontWeight:500,color:T.navy,borderBottom:`1px solid ${T.bg}`,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:140}}>{c.name}</td>
                  <td style={{padding:'3px 6px',fontSize:9,color:T.textSec,borderBottom:`1px solid ${T.bg}`}}>{c.sector.substring(0,8)}</td>
                  {c.qData.map((v,qi)=>{
                    const cellKey=`${c.id}-${qi}`;
                    return(
                      <td key={qi} onMouseEnter={()=>setHoveredCell(cellKey)} onMouseLeave={()=>setHoveredCell(null)} style={{padding:'2px',borderBottom:`1px solid ${T.bg}`,textAlign:'center',position:'relative'}}>
                        <div style={{width:'100%',height:18,borderRadius:3,background:heatmapColor(v),display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,fontWeight:600,color:T.textSec,cursor:'default',border:hoveredCell===cellKey?`1px solid ${T.navy}`:'1px solid transparent'}}>
                          {v}
                        </div>
                      </td>
                    );
                  })}
                  <td style={{padding:'3px 6px',textAlign:'right',fontSize:11,fontWeight:700,color:c.readiness>=70?T.green:c.readiness>=40?T.amber:T.red,borderBottom:`1px solid ${T.bg}`}}>{c.readiness}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inline CSS for spinner animation */}
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
