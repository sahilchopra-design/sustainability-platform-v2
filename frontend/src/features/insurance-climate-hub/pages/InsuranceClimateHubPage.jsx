import React,{useState,useMemo,useCallback} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,PieChart,Pie,Cell,AreaChart,Area,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis,Legend,LineChart,Line} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

/* ── Constants ─────────────────────────────────────────── */
const TABS=['Executive Dashboard','Unified Portfolio View','Engagement Pipeline','Board Report'];
const SUB_MODULES=[
  {id:'AR1',name:'Catastrophe Modelling',icon:'🌊',color:T.navy,description:'Peril analytics, AAL/PML, exceedance curves, scenario builder',metrics:{assets:100,perils:8,countries:30}},
  {id:'AR2',name:'ESG Underwriting',icon:'📋',color:T.gold,description:'ESG scoring, risk selection, exclusion lists, regulatory compliance',metrics:{policies:80,criteria:12,sectors:12}},
  {id:'AR3',name:'Parametric Insurance',icon:'📡',color:T.sage,description:'Trigger calibration, basis risk, sovereign risk transfer, adaptation',metrics:{products:60,triggers:6,countries:25}},
  {id:'AR4',name:'Reinsurance Climate',icon:'🔄',color:T.red,description:'Treaty portfolio, climate-adjusted pricing, ILS & cat bonds',metrics:{treaties:40,reinsurers:20,catBonds:30}},
  {id:'AR5',name:'Insurance Transition',icon:'🎯',color:T.amber,description:'Net-zero targets, fossil fuel phase-out, green products, disclosure',metrics:{insurers:50,greenProducts:40,frameworks:8}},
];
const PIE_COLORS=[T.navy,T.gold,T.sage,T.red,T.navyL,T.amber,'#6366f1','#0891b2'];
const PERIODS=['Q4 2024','Q3 2024','Q2 2024','Q1 2024','FY 2023'];
const BOARD_SECTIONS=['Executive Summary','Cat Model & Peril Risk','ESG Underwriting','Parametric Insurance','Reinsurance & ILS','Insurance Transition','Regulatory Compliance','Recommendations'];
const AUDIENCE_TYPES=['Board of Directors','CRO / Risk Committee','Underwriting Committee','Investment Committee','Regulator Submission'];
const ENGAGEMENT_STAGES=['Identified','Contacted','Questionnaire Sent','Under Review','Improvement Plan','Monitoring','Escalated','Closed'];
const STAGE_COLORS=[T.textMut,T.navyL,T.gold,T.amber,T.sage,T.teal,T.red,T.green];

/* ── KPI Data ──────────────────────────────────────────── */
const KPI_DATA={
  'Q4 2024':{aal:'$847M',pml100:'$12.4B',esgScore:58,avgLR:'42%',greenRatio:'8.7%',fossilExp:'12.3%',catBonds:'$4.2B',basisRisk:'18%',compliance:'74%',nziaMembers:28,treaties:40,parametrics:60},
  'Q3 2024':{aal:'$891M',pml100:'$12.8B',esgScore:55,avgLR:'44%',greenRatio:'7.9%',fossilExp:'13.8%',catBonds:'$3.9B',basisRisk:'19%',compliance:'71%',nziaMembers:25,treaties:38,parametrics:55},
  'Q2 2024':{aal:'$934M',pml100:'$13.1B',esgScore:52,avgLR:'46%',greenRatio:'7.1%',fossilExp:'15.1%',catBonds:'$3.5B',basisRisk:'21%',compliance:'68%',nziaMembers:22,treaties:35,parametrics:50},
  'Q1 2024':{aal:'$960M',pml100:'$13.5B',esgScore:50,avgLR:'48%',greenRatio:'6.5%',fossilExp:'16.2%',catBonds:'$3.2B',basisRisk:'22%',compliance:'65%',nziaMembers:20,treaties:33,parametrics:48},
  'FY 2023':{aal:'$1,020M',pml100:'$14.0B',esgScore:47,avgLR:'51%',greenRatio:'5.8%',fossilExp:'18.5%',catBonds:'$2.8B',basisRisk:'24%',compliance:'60%',nziaMembers:18,treaties:30,parametrics:42},
};

const KPI_META=[
  {id:'aal',label:'Portfolio AAL',target:'$750M',trend:'down',module:'AR1'},
  {id:'pml100',label:'PML 1-in-100',target:'$10B',trend:'down',module:'AR1'},
  {id:'esgScore',label:'Avg ESG Score',target:'65',trend:'up',module:'AR2'},
  {id:'avgLR',label:'Avg Loss Ratio',target:'40%',trend:'down',module:'AR2'},
  {id:'greenRatio',label:'Green Premium Ratio',target:'12%',trend:'up',module:'AR5'},
  {id:'fossilExp',label:'Fossil Fuel Exposure',target:'8%',trend:'down',module:'AR5'},
  {id:'catBonds',label:'Cat Bond Capacity',target:'$5B',trend:'up',module:'AR4'},
  {id:'basisRisk',label:'Avg Basis Risk',target:'15%',trend:'down',module:'AR3'},
  {id:'compliance',label:'Reg Compliance',target:'85%',trend:'up',module:'AR2'},
  {id:'nziaMembers',label:'NZIA Members',target:'35',trend:'up',module:'AR5'},
  {id:'treaties',label:'Active Treaties',target:'45',trend:'up',module:'AR4'},
  {id:'parametrics',label:'Parametric Products',target:'75',trend:'up',module:'AR3'},
];

/* ── Alerts ─────────────────────────────────────────────── */
const INITIAL_ALERTS=[
  {id:1,level:'red',module:'AR1',text:'Hurricane AAL increased 12% QoQ — climate uplift exceeding model assumptions',owner:'Head of Cat Modelling',note:'',timestamp:'2024-12-18 09:15'},
  {id:2,level:'red',module:'AR2',text:'3 fossil fuel policies exceed new exclusion thresholds — immediate review required',owner:'Head of Underwriting',note:'',timestamp:'2024-12-17 14:30'},
  {id:3,level:'amber',module:'AR4',text:'Reinsurance capacity tightening in Florida windstorm — ROL up 18%',owner:'Reinsurance Mgr',note:'',timestamp:'2024-12-16 11:00'},
  {id:4,level:'amber',module:'AR3',text:'Basis risk on NDVI products above 25% threshold — recalibration needed',owner:'Parametric Lead',note:'',timestamp:'2024-12-15 16:45'},
  {id:5,level:'green',module:'AR5',text:'Green premium ratio reached 8.7% — on track for 12% target by 2025',owner:'Chief Sustainability',note:'',timestamp:'2024-12-14 10:20'},
  {id:6,level:'red',module:'AR2',text:'ESG portfolio score declined in Energy sector — 4 policies need re-scoring',owner:'ESG Analyst',note:'',timestamp:'2024-12-13 13:15'},
  {id:7,level:'amber',module:'AR1',text:'Earthquake PML concentration in Japan exceeds 15% of portfolio TIV',owner:'Exposure Mgr',note:'',timestamp:'2024-12-12 09:30'},
  {id:8,level:'green',module:'AR4',text:'3 new cat bonds placed successfully — $380M additional capacity secured',owner:'ILS Manager',note:'',timestamp:'2024-12-11 15:00'},
  {id:9,level:'amber',module:'AR5',text:'NZIA reporting deadline approaching — 2 insurers missing transition plans',owner:'Engagement Lead',note:'',timestamp:'2024-12-10 11:45'},
  {id:10,level:'green',module:'AR3',text:'CCRIF parametric payout executed in 10 days — fastest response this year',owner:'Parametric Lead',note:'',timestamp:'2024-12-09 08:00'},
  {id:11,level:'red',module:'AR2',text:'PRA SS3/19 compliance gap identified — ORSA scenarios need urgent update',owner:'Compliance',note:'',timestamp:'2024-12-08 14:20'},
  {id:12,level:'amber',module:'AR1',text:'Wildfire model update available — historical losses underpredicted by 22%',owner:'Model Validation',note:'',timestamp:'2024-12-07 10:30'},
  {id:13,level:'green',module:'AR5',text:'5 insurers committed to coal underwriting phase-out by 2027',owner:'Engagement Lead',note:'',timestamp:'2024-12-06 16:00'},
  {id:14,level:'amber',module:'AR4',text:'Climate-adjusted technical price exceeds market rate on 8 treaties',owner:'Pricing Actuary',note:'',timestamp:'2024-12-05 12:15'},
  {id:15,level:'red',module:'AR3',text:'Flood parametric product in Bangladesh missed payout — trigger threshold review',owner:'Product Dev',note:'',timestamp:'2024-12-04 09:45'},
  {id:16,level:'green',module:'AR2',text:'ESG underwriting guidelines updated — new biodiversity criteria added',owner:'Policy Team',note:'',timestamp:'2024-12-03 11:30'},
  {id:17,level:'amber',module:'AR1',text:'Winter storm accumulation in Northern Europe above seasonal norm',owner:'Exposure Mgr',note:'',timestamp:'2024-12-02 14:00'},
  {id:18,level:'green',module:'AR4',text:'Retrocession capacity renewed at improved terms — 5% ROL reduction',owner:'Retro Manager',note:'',timestamp:'2024-12-01 10:00'},
  {id:19,level:'red',module:'AR5',text:'EIOPA opinion gaps — 3 entities below minimum compliance threshold',owner:'Compliance',note:'',timestamp:'2024-11-30 15:30'},
  {id:20,level:'amber',module:'AR3',text:'New satellite data source available for NDVI triggers — evaluation pending',owner:'Data Science',note:'',timestamp:'2024-11-29 08:45'},
];

/* ── Unified Portfolio Items ───────────────────────────── */
const PORTFOLIO_ITEMS=Array.from({length:60},(_,i)=>{
  const s1=sr(i*31+1);const s2=sr(i*31+2);const s3=sr(i*31+3);const s4=sr(i*31+4);const s5=sr(i*31+5);
  const types=['Policy','Treaty','Parametric Product','Cat Bond','Green Product'];
  const type=types[Math.floor(s1*types.length)];
  const module=type==='Policy'?'AR2':type==='Treaty'?'AR4':type==='Parametric Product'?'AR3':type==='Cat Bond'?'AR4':'AR5';
  const value=Math.round(5+s2*200);
  const esgScore=Math.round(20+s3*75);
  const climateRisk=+(1+s4*9).toFixed(1);
  const status=s5>0.2?'Active':'Under Review';
  const counterparty=['Munich Re','Swiss Re','Allianz','AXA','Zurich','Tokio Marine','Generali','SCOR','QBE','Suncorp','CCRIF','ARC','Lloyd\'s','Hannover','Everest'][Math.floor(s1*15)];
  const peril=['Hurricane','Earthquake','Flood','Wildfire','Multi-Peril','N/A'][Math.floor(s2*6)];
  const region=['North America','Europe','Asia Pacific','Caribbean','Africa','Global'][Math.floor(s3*6)];
  return {id:i+1,name:`${type.split(' ')[0]}-${String(i+1).padStart(3,'0')}`,type,module,value,esgScore,climateRisk,status,counterparty,peril,region};
});

/* ── Engagement Data ───────────────────────────────────── */
const ENGAGEMENTS=Array.from({length:40},(_,i)=>{
  const s1=sr(i*37+1);const s2=sr(i*37+2);const s3=sr(i*37+3);const s4=sr(i*37+4);const s5=sr(i*37+5);const s6=sr(i*37+6);
  const stageIdx=Math.floor(s1*ENGAGEMENT_STAGES.length);
  const entity=['Munich Re','Swiss Re','Allianz','AXA','Zurich','Tokio Marine','Generali','QBE','Suncorp','SCOR','Hannover','Everest','Fairfax','Markel','Arch','Aviva','Legal & General','Prudential','Aegon','Storebrand','KLP','Mapfre','Sampo','Tryg','Gjensidige','NN Group','Baloise','Helvetia','MAIF','Covea','Groupama','CNP','IAG','MS&AD','Sompo','Samsung Life','Ping An','AIA','Manulife','Sun Life'][i];
  const topic=['Fossil fuel phase-out','Climate transition plan','ESG underwriting criteria','TCFD disclosure','SBTi commitment','Green product development','Cat model update','Parametric calibration'][Math.floor(s2*8)];
  const priority=s3>0.6?'High':s3>0.3?'Medium':'Low';
  const owner=['ESG Lead','Engagement Mgr','Head of UW','CRO','Compliance','Sustainability Dir'][Math.floor(s4*6)];
  const nextAction=['Follow-up call','Review submission','Send questionnaire','Escalation review','Monitor progress','Close engagement'][Math.floor(s5*6)];
  const daysOpen=Math.round(5+s6*120);
  return {id:i+1,entity,topic,stage:ENGAGEMENT_STAGES[stageIdx],stageIdx,priority,owner,nextAction,daysOpen,lastUpdate:`${2024}-${String(11+Math.floor(s1*2)).padStart(2,'0')}-${String(1+Math.floor(s2*28)).padStart(2,'0')}`};
});

/* ── Loss Ratio Trend ──────────────────────────────────── */
const LR_TREND=[{q:'Q1-23',cat:55,nonCat:38,combined:48},{q:'Q2-23',cat:48,nonCat:36,combined:43},{q:'Q3-23',cat:62,nonCat:35,combined:51},{q:'Q4-23',cat:45,nonCat:34,combined:40},{q:'Q1-24',cat:52,nonCat:33,combined:44},{q:'Q2-24',cat:58,nonCat:32,combined:46},{q:'Q3-24',cat:42,nonCat:31,combined:38},{q:'Q4-24',cat:50,nonCat:30,combined:42}];

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
  grid6:{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:10},
  kpi:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:12,textAlign:'center'},
  kpiVal:{fontSize:20,fontWeight:700,color:T.navy,fontFamily:T.mono},
  kpiLbl:{fontSize:10,color:T.textSec,marginTop:2},
  kpiTarget:{fontSize:9,color:T.textMut,marginTop:1},
  table:{width:'100%',borderCollapse:'collapse',fontSize:12,fontFamily:T.mono},
  th:{textAlign:'left',padding:'8px 10px',borderBottom:`2px solid ${T.border}`,color:T.textSec,fontWeight:600,fontSize:11,position:'sticky',top:0,background:T.surface},
  td:{padding:'7px 10px',borderBottom:`1px solid ${T.border}`,whiteSpace:'nowrap'},
  badge:(c)=>({display:'inline-block',padding:'2px 8px',borderRadius:4,fontSize:10,fontWeight:600,background:c===T.red?'#fef2f2':c===T.amber?'#fffbeb':c===T.green?'#f0fdf4':'#eff6ff',color:c}),
  btn:(a)=>({padding:'6px 14px',fontSize:12,fontWeight:600,borderRadius:6,border:a?'none':`1px solid ${T.border}`,background:a?T.navy:T.surface,color:a?'#fff':T.text,cursor:'pointer',fontFamily:T.font}),
  select:{padding:'6px 10px',fontSize:12,borderRadius:6,border:`1px solid ${T.border}`,background:T.surface,color:T.text,fontFamily:T.font},
  scroll:{maxHeight:420,overflowY:'auto'},
  chip:(a)=>({display:'inline-block',padding:'3px 10px',borderRadius:12,fontSize:11,fontWeight:600,background:a?T.navy:'transparent',color:a?'#fff':T.textSec,border:a?'none':`1px solid ${T.border}`,cursor:'pointer',marginRight:4}),
  alertDot:(l)=>({width:10,height:10,borderRadius:'50%',background:l==='red'?T.red:l==='amber'?T.amber:T.green,flexShrink:0}),
  heatCell:(v)=>({padding:'4px 8px',textAlign:'center',fontSize:11,fontWeight:600,fontFamily:T.mono,background:v>=70?'#dcfce7':v>=50?'#fef3c7':v>=30?'#fed7aa':'#fecaca',color:v>=70?T.green:v>=50?T.amber:v>=30?'#c2410c':T.red,borderRadius:4}),
};

/* ── Component ─────────────────────────────────────────── */
export default function InsuranceClimateHubPage(){
  const [tab,setTab]=useState(0);
  const [period,setPeriod]=useState('Q4 2024');
  const [alertFilter,setAlertFilter]=useState('all');
  const [alerts,setAlerts]=useState(INITIAL_ALERTS);
  const [alertNotes,setAlertNotes]=useState({});
  const [portfolioType,setPortfolioType]=useState('All');
  const [portfolioSort,setPortfolioSort]=useState('value');
  const [portfolioPage,setPortfolioPage]=useState(0);
  const [engagementStage,setEngagementStage]=useState('All');
  const [engagementSort,setEngagementSort]=useState('daysOpen');
  const [engPage,setEngPage]=useState(0);
  const [boardAudience,setBoardAudience]=useState(0);
  const [boardSections,setBoardSections]=useState(BOARD_SECTIONS.map(()=>true));
  const [showPrintView,setShowPrintView]=useState(false);

  const currentKPIs=useMemo(()=>KPI_DATA[period],[period]);

  const filteredAlerts=useMemo(()=>{
    if(alertFilter==='all')return alerts;
    return alerts.filter(a=>a.level===alertFilter);
  },[alerts,alertFilter]);

  const filteredPortfolio=useMemo(()=>{
    let f=[...PORTFOLIO_ITEMS];
    if(portfolioType!=='All')f=f.filter(p=>p.type===portfolioType);
    f.sort((a,b)=>b[portfolioSort]-a[portfolioSort]);
    return f;
  },[portfolioType,portfolioSort]);

  const filteredEngagements=useMemo(()=>{
    let f=[...ENGAGEMENTS];
    if(engagementStage!=='All')f=f.filter(e=>e.stage===engagementStage);
    f.sort((a,b)=>b[engagementSort]-a[engagementSort]);
    return f;
  },[engagementStage,engagementSort]);

  const engagementStats=useMemo(()=>{
    return ENGAGEMENT_STAGES.map((s,i)=>({stage:s,count:ENGAGEMENTS.filter(e=>e.stage===s).length,color:STAGE_COLORS[i]}));
  },[]);

  const PAGE_SIZE=12;
  const portfolioPages=Math.ceil(filteredPortfolio.length/PAGE_SIZE);
  const pagedPortfolio=filteredPortfolio.slice(portfolioPage*PAGE_SIZE,(portfolioPage+1)*PAGE_SIZE);
  const engPages=Math.ceil(filteredEngagements.length/PAGE_SIZE);
  const pagedEngagements=filteredEngagements.slice(engPage*PAGE_SIZE,(engPage+1)*PAGE_SIZE);

  const dismissAlert=useCallback((id)=>{setAlerts(prev=>prev.filter(a=>a.id!==id));},[]);
  const toggleSection=useCallback((idx)=>{setBoardSections(prev=>{const n=[...prev];n[idx]=!n[idx];return n;});},[]);

  const generateCSV=useCallback(()=>{
    const headers=['Module','KPI','Current','Target','Status'];
    const rows=KPI_META.map(k=>[k.module,k.label,currentKPIs[k.id],k.target,k.trend==='up'?'Improving':'Watch']);
    const csv=[headers,...rows].map(r=>r.join(',')).join('\n');
    const blob=new Blob([csv],{type:'text/csv'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download=`insurance_climate_hub_${period.replace(/\s/g,'_')}.csv`;a.click();URL.revokeObjectURL(url);
  },[currentKPIs,period]);

  /* ── Tab 1: Executive Dashboard ──────────────────── */
  const renderDashboard=()=>(
    <div>
      <div style={{display:'flex',gap:8,marginBottom:16,alignItems:'center'}}>
        <span style={{fontSize:12,fontWeight:600}}>Period:</span>
        {PERIODS.map(p=><button key={p} style={S.chip(period===p)} onClick={()=>setPeriod(p)}>{p}</button>)}
      </div>
      <div style={S.grid6}>
        {KPI_META.map((k,i)=>{
          const val=currentKPIs[k.id];
          const isGood=(k.trend==='up'&&typeof val==='number'&&val>50)||(k.trend==='down'&&typeof val==='string'&&val.includes('%')&&parseFloat(val)<50);
          return (
            <div key={i} style={S.kpi}>
              <div style={{...S.kpiVal,fontSize:16,color:isGood?T.green:T.navy}}>{val}</div>
              <div style={S.kpiLbl}>{k.label}</div>
              <div style={S.kpiTarget}>Target: {k.target}</div>
              <div style={{fontSize:9,color:T.textMut}}>{k.module}</div>
            </div>
          );
        })}
      </div>
      <div style={{...S.grid2,marginTop:16}}>
        <div style={S.card}>
          <div style={S.cardTitle}>Sub-Module Cards</div>
          {SUB_MODULES.map((m,i)=>(
            <div key={i} style={{padding:12,marginBottom:8,background:T.surfaceH,borderRadius:8,borderLeft:`3px solid ${m.color}`}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div style={{fontSize:13,fontWeight:700}}>{m.icon} {m.name}</div>
                <span style={S.badge(m.color)}>{m.id}</span>
              </div>
              <div style={{fontSize:10,color:T.textSec,marginTop:4}}>{m.description}</div>
              <div style={{display:'flex',gap:12,marginTop:6,fontSize:10}}>
                {Object.entries(m.metrics).map(([k,v])=>(
                  <span key={k} style={{color:T.textSec}}>{k}: <strong style={{color:T.navy}}>{v}</strong></span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>Loss Ratio Trend</div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={LR_TREND}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="q" tick={{fontSize:10}}/><YAxis tick={{fontSize:10}} domain={[20,70]}/><Tooltip contentStyle={{fontSize:11}}/><Legend wrapperStyle={{fontSize:11}}/><Area type="monotone" dataKey="cat" name="Cat Loss Ratio %" stroke={T.red} fill={T.red} fillOpacity={0.15}/><Area type="monotone" dataKey="nonCat" name="Non-Cat LR %" stroke={T.sage} fill={T.sage} fillOpacity={0.15}/><Line type="monotone" dataKey="combined" name="Combined %" stroke={T.navy} strokeWidth={2}/></AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={S.card}>
            <div style={S.cardTitle}>Peril Distribution (AAL)</div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart><Pie data={['Hurricane','Earthquake','Flood','Wildfire','Tornado','Hail','Winter Storm','Tsunami'].map((p,i)=>({name:p,value:Math.round(50+sr(i*41)*200)}))} cx="50%" cy="50%" innerRadius={35} outerRadius={70} dataKey="value" label={({name,percent})=>`${name.split(' ')[0]} ${(percent*100).toFixed(0)}%`}>{PIE_COLORS.map((c,i)=><Cell key={i} fill={c}/>)}</Pie><Tooltip contentStyle={{fontSize:11}}/></PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div style={S.card}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <div style={S.cardTitle}>Alerts ({filteredAlerts.length})</div>
          <div style={{display:'flex',gap:4}}>
            {['all','red','amber','green'].map(f=><button key={f} style={S.chip(alertFilter===f)} onClick={()=>setAlertFilter(f)}>{f==='all'?'All':f.charAt(0).toUpperCase()+f.slice(1)} ({f==='all'?alerts.length:alerts.filter(a=>a.level===f).length})</button>)}
          </div>
        </div>
        <div style={{...S.scroll,maxHeight:300}}>
          {filteredAlerts.map(a=>(
            <div key={a.id} style={{display:'flex',gap:10,alignItems:'flex-start',padding:8,marginBottom:4,background:T.surfaceH,borderRadius:6}}>
              <div style={S.alertDot(a.level)}/>
              <div style={{flex:1}}>
                <div style={{fontSize:12}}><span style={S.badge(a.module==='AR1'?T.navy:a.module==='AR2'?T.gold:a.module==='AR3'?T.sage:a.module==='AR4'?T.red:T.amber)}>{a.module}</span> {a.text}</div>
                <div style={{fontSize:10,color:T.textMut,marginTop:2}}>Owner: {a.owner} · {a.timestamp}</div>
              </div>
              <button style={{...S.btn(false),padding:'3px 8px',fontSize:10}} onClick={()=>dismissAlert(a.id)}>Dismiss</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  /* ── Tab 2: Unified Portfolio ────────────────────── */
  const renderUnifiedPortfolio=()=>(
    <div>
      <div style={{display:'flex',gap:12,marginBottom:12,flexWrap:'wrap',alignItems:'center'}}>
        <select style={S.select} value={portfolioType} onChange={e=>{setPortfolioType(e.target.value);setPortfolioPage(0);}}>
          <option value="All">All Types</option>{['Policy','Treaty','Parametric Product','Cat Bond','Green Product'].map(t=><option key={t} value={t}>{t}</option>)}
        </select>
        <span style={{fontSize:12,fontWeight:600}}>Sort:</span>
        {['value','esgScore','climateRisk'].map(s=><button key={s} style={S.btn(portfolioSort===s)} onClick={()=>setPortfolioSort(s)}>{s==='climateRisk'?'Climate Risk':s==='esgScore'?'ESG Score':'Value'}</button>)}
        <span style={{fontSize:12,color:T.textSec}}>{filteredPortfolio.length} items</span>
      </div>
      <div style={S.grid3}>
        {['Policy','Treaty','Parametric Product','Cat Bond','Green Product'].map((t,i)=>{
          const items=PORTFOLIO_ITEMS.filter(p=>p.type===t);
          return (
            <div key={t} style={S.kpi}>
              <div style={{...S.kpiVal,fontSize:18}}>{items.length}</div>
              <div style={S.kpiLbl}>{t}s</div>
              <div style={{fontSize:10,color:T.textSec}}>${items.reduce((a,b)=>a+b.value,0).toLocaleString()}M</div>
            </div>
          );
        })}
        <div style={S.kpi}>
          <div style={{...S.kpiVal,fontSize:18}}>{PORTFOLIO_ITEMS.length}</div>
          <div style={S.kpiLbl}>Total Items</div>
          <div style={{fontSize:10,color:T.textSec}}>Cross-module</div>
        </div>
      </div>
      <div style={{...S.card,marginTop:16}}>
        <div style={S.cardTitle}>Unified Portfolio ({filteredPortfolio.length} items)</div>
        <div style={S.scroll}>
          <table style={S.table}>
            <thead><tr>{['Name','Type','Module','Counterparty','Region','Peril','Value ($M)','ESG Score','Climate Risk','Status'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>{pagedPortfolio.map((p,i)=>(
              <tr key={p.id} style={{background:i%2?T.surfaceH:'transparent'}}>
                <td style={S.td}>{p.name}</td><td style={S.td}>{p.type}</td>
                <td style={S.td}><span style={S.badge(SUB_MODULES.find(m=>m.id===p.module)?.color||T.navy)}>{p.module}</span></td>
                <td style={S.td}>{p.counterparty}</td><td style={S.td}>{p.region}</td><td style={S.td}>{p.peril}</td>
                <td style={{...S.td,fontWeight:600}}>{p.value}</td>
                <td style={S.td}><span style={S.heatCell(p.esgScore)}>{p.esgScore}</span></td>
                <td style={S.td}><span style={S.badge(p.climateRisk>7?T.red:p.climateRisk>4?T.amber:T.green)}>{p.climateRisk}/10</span></td>
                <td style={S.td}><span style={S.badge(p.status==='Active'?T.green:T.amber)}>{p.status}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div style={{display:'flex',gap:8,marginTop:10,alignItems:'center',justifyContent:'space-between'}}>
          <span style={{fontSize:11,color:T.textSec}}>Page {portfolioPage+1} of {portfolioPages}</span>
          <div style={{display:'flex',gap:4}}>
            <button style={S.btn(false)} disabled={portfolioPage===0} onClick={()=>setPortfolioPage(p=>p-1)}>← Prev</button>
            <button style={S.btn(false)} disabled={portfolioPage>=portfolioPages-1} onClick={()=>setPortfolioPage(p=>p+1)}>Next →</button>
          </div>
        </div>
      </div>
      <div style={S.grid2}>
        <div style={S.card}>
          <div style={S.cardTitle}>Value Distribution by Type</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={['Policy','Treaty','Parametric Product','Cat Bond','Green Product'].map(t=>{const items=PORTFOLIO_ITEMS.filter(p=>p.type===t);return {type:t.split(' ')[0],value:items.reduce((a,b)=>a+b.value,0),count:items.length};})}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="type" tick={{fontSize:10}}/><YAxis tick={{fontSize:10}}/><Tooltip contentStyle={{fontSize:11}}/><Bar dataKey="value" name="Value ($M)">{PIE_COLORS.slice(0,5).map((c,i)=><Cell key={i} fill={c}/>)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={S.card}>
          <div style={S.cardTitle}>Cross-Module Risk Radar</div>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={SUB_MODULES.map(m=>{const items=PORTFOLIO_ITEMS.filter(p=>p.module===m.id);const avg=items.length?items.reduce((a,b)=>a+b.climateRisk,0)/items.length:0;return {module:m.id,risk:+avg.toFixed(1),esg:items.length?Math.round(items.reduce((a,b)=>a+b.esgScore,0)/items.length):0};})}>
              <PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="module" tick={{fontSize:10}}/><PolarRadiusAxis angle={90} domain={[0,10]} tick={{fontSize:9}}/><Radar name="Climate Risk" dataKey="risk" stroke={T.red} fill={T.red} fillOpacity={0.2}/><Legend wrapperStyle={{fontSize:11}}/><Tooltip contentStyle={{fontSize:11}}/>
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  /* ── Tab 3: Engagement Pipeline ──────────────────── */
  const renderEngagement=()=>(
    <div>
      <div style={S.card}>
        <div style={S.cardTitle}>Engagement Funnel</div>
        <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
          {engagementStats.map((s,i)=>(
            <div key={i} style={{flex:1,minWidth:80,textAlign:'center',padding:8,background:T.surfaceH,borderRadius:6,borderTop:`3px solid ${s.color}`}}>
              <div style={{fontSize:20,fontWeight:700,color:s.color,fontFamily:T.mono}}>{s.count}</div>
              <div style={{fontSize:9,color:T.textSec}}>{s.stage}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{display:'flex',gap:12,marginBottom:12,flexWrap:'wrap',alignItems:'center'}}>
        <select style={S.select} value={engagementStage} onChange={e=>{setEngagementStage(e.target.value);setEngPage(0);}}>
          <option value="All">All Stages</option>{ENGAGEMENT_STAGES.map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        <span style={{fontSize:12,fontWeight:600}}>Sort:</span>
        {['daysOpen','stageIdx'].map(s=><button key={s} style={S.btn(engagementSort===s)} onClick={()=>setEngagementSort(s)}>{s==='daysOpen'?'Days Open':'Stage'}</button>)}
        <span style={{fontSize:12,color:T.textSec}}>{filteredEngagements.length} engagements</span>
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>Engagement Pipeline ({filteredEngagements.length} engagements)</div>
        <div style={S.scroll}>
          <table style={S.table}>
            <thead><tr>{['Entity','Topic','Stage','Priority','Owner','Days Open','Next Action','Last Update'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>{pagedEngagements.map((e,i)=>(
              <tr key={e.id} style={{background:i%2?T.surfaceH:'transparent'}}>
                <td style={{...S.td,fontWeight:600}}>{e.entity}</td><td style={{...S.td,fontSize:11}}>{e.topic}</td>
                <td style={S.td}><span style={S.badge(STAGE_COLORS[e.stageIdx])}>{e.stage}</span></td>
                <td style={S.td}><span style={S.badge(e.priority==='High'?T.red:e.priority==='Medium'?T.amber:T.green)}>{e.priority}</span></td>
                <td style={S.td}>{e.owner}</td>
                <td style={S.td}><span style={S.badge(e.daysOpen>90?T.red:e.daysOpen>30?T.amber:T.green)}>{e.daysOpen}d</span></td>
                <td style={{...S.td,fontSize:11}}>{e.nextAction}</td>
                <td style={S.td}>{e.lastUpdate}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div style={{display:'flex',gap:8,marginTop:10,alignItems:'center',justifyContent:'space-between'}}>
          <span style={{fontSize:11,color:T.textSec}}>Page {engPage+1} of {engPages}</span>
          <div style={{display:'flex',gap:4}}>
            <button style={S.btn(false)} disabled={engPage===0} onClick={()=>setEngPage(p=>p-1)}>← Prev</button>
            <button style={S.btn(false)} disabled={engPage>=engPages-1} onClick={()=>setEngPage(p=>p+1)}>Next →</button>
          </div>
        </div>
      </div>
      <div style={S.grid2}>
        <div style={S.card}>
          <div style={S.cardTitle}>Engagements by Stage</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={engagementStats}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="stage" tick={{fontSize:8}} angle={-25} textAnchor="end" height={55}/><YAxis tick={{fontSize:10}}/><Tooltip contentStyle={{fontSize:11}}/><Bar dataKey="count" name="Count">{engagementStats.map((s,i)=><Cell key={i} fill={s.color}/>)}</Bar></BarChart>
          </ResponsiveContainer>
        </div>
        <div style={S.card}>
          <div style={S.cardTitle}>Priority Distribution</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart><Pie data={['High','Medium','Low'].map(p=>({name:p,value:ENGAGEMENTS.filter(e=>e.priority===p).length}))} cx="50%" cy="50%" innerRadius={40} outerRadius={80} dataKey="value" label={({name,value})=>`${name}: ${value}`}>{[T.red,T.amber,T.green].map((c,i)=><Cell key={i} fill={c}/>)}</Pie><Tooltip contentStyle={{fontSize:11}}/></PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  /* ── Tab 4: Board Report ─────────────────────────── */
  const renderBoardReport=()=>(
    <div>
      <div style={{display:'flex',gap:12,marginBottom:16,alignItems:'center',flexWrap:'wrap'}}>
        <span style={{fontSize:12,fontWeight:600}}>Audience:</span>
        {AUDIENCE_TYPES.map((a,i)=><button key={a} style={S.btn(boardAudience===i)} onClick={()=>setBoardAudience(i)}>{a}</button>)}
      </div>
      <div style={{display:'flex',gap:8,marginBottom:16}}>
        <button style={S.btn(true)} onClick={generateCSV}>Export CSV</button>
        <button style={S.btn(false)} onClick={()=>setShowPrintView(!showPrintView)}>{showPrintView?'Edit View':'Print Preview'}</button>
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>Report Sections</div>
        <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:12}}>
          {BOARD_SECTIONS.map((s,i)=>(
            <button key={s} style={{...S.chip(boardSections[i]),opacity:boardSections[i]?1:0.5}} onClick={()=>toggleSection(i)}>{s}</button>
          ))}
        </div>
      </div>
      {showPrintView?(
        <div style={{...S.card,padding:24,maxWidth:800,margin:'0 auto'}}>
          <div style={{textAlign:'center',marginBottom:20}}>
            <div style={{fontSize:20,fontWeight:700,color:T.navy}}>Insurance & Underwriting Climate Analytics</div>
            <div style={{fontSize:13,color:T.textSec}}>Board Report — {period} | Prepared for: {AUDIENCE_TYPES[boardAudience]}</div>
            <div style={{fontSize:11,color:T.textMut}}>Generated: {new Date().toISOString().split('T')[0]}</div>
          </div>
          {BOARD_SECTIONS.map((s,i)=>{
            if(!boardSections[i])return null;
            return (
              <div key={i} style={{marginBottom:20,paddingBottom:16,borderBottom:`1px solid ${T.border}`}}>
                <div style={{fontSize:16,fontWeight:700,color:T.navy,marginBottom:8}}>{i+1}. {s}</div>
                <div style={{fontSize:12,color:T.textSec,lineHeight:1.6}}>
                  {i===0&&`Portfolio AAL stands at ${currentKPIs.aal} against a target of $750M. The average ESG underwriting score is ${currentKPIs.esgScore}/100 with ${currentKPIs.compliance} regulatory compliance. Green premium ratio has reached ${currentKPIs.greenRatio}, trending toward the 12% target. ${alerts.filter(a=>a.level==='red').length} critical alerts require immediate attention.`}
                  {i===1&&`Catastrophe modelling covers 100 insured assets across 8 perils and 30 countries. The PML at 1-in-100 return period is ${currentKPIs.pml100}. Climate uplift factors range from 5-45% depending on peril and SSP pathway. Hurricane and wildfire show the highest climate sensitivity.`}
                  {i===2&&`ESG underwriting scorecard covers ${currentKPIs.esgScore>55?80:75} active policies across 12 sectors. ${INITIAL_ALERTS.filter(a=>a.module==='AR2'&&a.level==='red').length} policies flagged for exclusion review. Fossil fuel exposure stands at ${currentKPIs.fossilExp} against an 8% target.`}
                  {i===3&&`${currentKPIs.parametrics} parametric products are active across 6 trigger types and 25 countries. Average basis risk is ${currentKPIs.basisRisk}. CCRIF and ARC sovereign schemes show strong performance with sub-21-day payout times.`}
                  {i===4&&`${currentKPIs.treaties} active reinsurance treaties with ${currentKPIs.catBonds} in cat bond capacity. Climate-adjusted pricing shows 15-35% uplift required depending on peril and region. ILS market expanding with increased climate risk premium.`}
                  {i===5&&`${currentKPIs.nziaMembers} NZIA member insurers tracked. Green premium ratio at ${currentKPIs.greenRatio}. Coal phase-out commitments accelerating with ${INITIAL_ALERTS.filter(a=>a.module==='AR5'&&a.level==='green').length} positive developments this quarter.`}
                  {i===6&&`Overall regulatory compliance at ${currentKPIs.compliance}. Key gaps in ORSA climate scenarios (PRA SS3/19) and EIOPA opinion integration. NAIC multi-state alignment remains challenging.`}
                  {i===7&&`Recommendations: (1) Accelerate ORSA climate scenario development, (2) Review fossil fuel exclusion thresholds, (3) Expand parametric product range for climate adaptation, (4) Increase green premium ratio through product innovation.`}
                </div>
              </div>
            );
          })}
        </div>
      ):(
        <div>
          <div style={S.grid2}>
            <div style={S.card}>
              <div style={S.cardTitle}>KPI Summary for {AUDIENCE_TYPES[boardAudience]}</div>
              <div style={S.scroll}>
                <table style={S.table}>
                  <thead><tr>{['Module','KPI','Current','Target','Trend','Status'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
                  <tbody>{KPI_META.map((k,i)=>{
                    const val=currentKPIs[k.id];
                    return (
                      <tr key={i} style={{background:i%2?T.surfaceH:'transparent'}}>
                        <td style={S.td}><span style={S.badge(SUB_MODULES.find(m=>m.id===k.module)?.color||T.navy)}>{k.module}</span></td>
                        <td style={S.td}>{k.label}</td><td style={{...S.td,fontWeight:600}}>{val}</td>
                        <td style={S.td}>{k.target}</td>
                        <td style={S.td}>{k.trend==='up'?'↑':'↓'}</td>
                        <td style={S.td}><span style={S.badge(T.green)}>On Track</span></td>
                      </tr>
                    );
                  })}</tbody>
                </table>
              </div>
            </div>
            <div style={S.card}>
              <div style={S.cardTitle}>Module Health Radar</div>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={SUB_MODULES.map((m,i)=>({module:m.id,health:60+Math.round(sr(i*97)*35),target:80}))}>
                  <PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="module" tick={{fontSize:10}}/><PolarRadiusAxis angle={90} domain={[0,100]} tick={{fontSize:9}}/><Radar name="Current Health" dataKey="health" stroke={T.navy} fill={T.navy} fillOpacity={0.3}/><Radar name="Target" dataKey="target" stroke={T.gold} fill={T.gold} fillOpacity={0.1}/><Legend wrapperStyle={{fontSize:11}}/><Tooltip contentStyle={{fontSize:11}}/>
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={S.card}>
            <div style={S.cardTitle}>Quarterly Trend</div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={PERIODS.map(p=>{const d=KPI_DATA[p];return {period:p,esg:d.esgScore,compliance:parseInt(d.compliance),greenRatio:parseFloat(d.greenRatio)};}).reverse()}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="period" tick={{fontSize:10}}/><YAxis tick={{fontSize:10}}/><Tooltip contentStyle={{fontSize:11}}/><Legend wrapperStyle={{fontSize:11}}/><Line type="monotone" dataKey="esg" name="ESG Score" stroke={T.navy} strokeWidth={2}/><Line type="monotone" dataKey="compliance" name="Compliance %" stroke={T.sage} strokeWidth={2}/><Line type="monotone" dataKey="greenRatio" name="Green Ratio %" stroke={T.gold} strokeWidth={2}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.h1}>Insurance & Underwriting Climate Hub</h1>
        <div style={S.sub}>EP-AR6 · 5 sub-modules · 12 KPIs · {alerts.length} alerts · {ENGAGEMENTS.length} engagements · Board reporting</div>
      </div>
      <div style={S.tabs}>
        {TABS.map((t,i)=><button key={t} style={S.tab(tab===i)} onClick={()=>setTab(i)}>{t}</button>)}
      </div>
      {tab===0&&renderDashboard()}
      {tab===1&&renderUnifiedPortfolio()}
      {tab===2&&renderEngagement()}
      {tab===3&&renderBoardReport()}
    </div>
  );
}
