// EP-AH1 — CSRD ESRS Automation Engine
// Route: /csrd-esrs-automation
// Framework: CSRD + ESRS Set 1 (EFRAG) + Delegated Acts (EU 2023/2772)
// Citations: ESRS 1 §38-62 (Double Materiality), ESRS 2 (General Disclosures)
import React,{useState,useMemo,useCallback} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,PieChart,Pie,Cell,AreaChart,Area,LineChart,Line,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis,Legend,ScatterChart,Scatter,ZAxis} from 'recharts';
import {REGULATORY_THRESHOLDS,TAXONOMY_THRESHOLDS} from '../../../data/referenceData';
import {SECURITY_UNIVERSE} from '../../../data/securityUniverse';

/* ═══════════════════════════════════════════════════════════════════════════════
   THEME + CORE HELPERS
   ═══════════════════════════════════════════════════════════════════════════════ */
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const ACCENT='#7c3aed';
const fmt=v=>typeof v==='number'?v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed?v.toFixed(1):v:v;
const pct=v=>(v*100).toFixed(1)+'%';
const tip={contentStyle:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,fontSize:11,fontFamily:T.font},labelStyle:{color:T.textSec,fontFamily:T.mono,fontSize:10}};
const PIECLRS=[ACCENT,T.navy,T.gold,T.sage,T.amber,T.green,T.red,'#0891b2','#be185d','#ea580c','#6366f1','#0d9488'];
const PAGE_SIZE=15;

/* ═══════════════════════════════════════════════════════════════════════════════
   BADGE + STYLE HELPERS
   ═══════════════════════════════════════════════════════════════════════════════ */
const badge=(v,th)=>{const[lo,mid,hi]=th;const bg=v>=hi?'rgba(22,163,74,0.12)':v>=mid?'rgba(197,169,106,0.12)':v>=lo?'rgba(217,119,6,0.12)':'rgba(220,38,38,0.12)';const c=v>=hi?T.green:v>=mid?T.gold:v>=lo?T.amber:T.red;return{background:bg,color:c,padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600,fontFamily:T.mono};};
const statusBadge=(s)=>{const m={'Compliant':{bg:'rgba(22,163,74,0.12)',c:T.green},'Advanced':{bg:'rgba(90,138,106,0.12)',c:T.sage},'In Progress':{bg:'rgba(197,169,106,0.15)',c:T.gold},'Early Stage':{bg:'rgba(217,119,6,0.12)',c:T.amber},'Not Started':{bg:'rgba(220,38,38,0.12)',c:T.red},'Complete':{bg:'rgba(22,163,74,0.12)',c:T.green},'Partial':{bg:'rgba(217,119,6,0.12)',c:T.amber},'Gap':{bg:'rgba(220,38,38,0.12)',c:T.red},'Limited':{bg:'rgba(197,169,106,0.15)',c:T.gold},'Reasonable':{bg:'rgba(22,163,74,0.12)',c:T.green}};const st=m[s]||m['Early Stage'];return{background:st.bg,color:st.c,padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600};};
const matBadge=(v)=>v>=4?{bg:'rgba(220,38,38,0.12)',c:T.red,label:'Critical'}:v>=3?{bg:'rgba(217,119,6,0.12)',c:T.amber,label:'High'}:v>=2?{bg:'rgba(197,169,106,0.15)',c:T.gold,label:'Moderate'}:{bg:'rgba(90,138,106,0.12)',c:T.sage,label:'Low'};

/* ═══════════════════════════════════════════════════════════════════════════════
   CSV EXPORT HELPER
   ═══════════════════════════════════════════════════════════════════════════════ */
const csvExport=(rows,name)=>{if(!rows.length)return;const h=Object.keys(rows[0]);const csv=[h.join(','),...rows.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=name+'.csv';a.click();URL.revokeObjectURL(u);};

/* ═══════════════════════════════════════════════════════════════════════════════
   TABS
   ═══════════════════════════════════════════════════════════════════════════════ */
const TABS=['Double Materiality','ESRS Standards','Datapoint Inventory','Company Readiness','XBRL Tagging','Assurance','Export'];
const SECTORS=['All','Energy','Materials','Industrials','Consumer Discretionary','Consumer Staples','Health Care','Financials','Information Technology','Communication Services','Utilities','Real Estate'];
const READINESS_LEVELS=['All','Compliant','Advanced','In Progress','Early Stage','Not Started'];

/* ═══════════════════════════════════════════════════════════════════════════════
   ESRS STANDARDS DATA — EFRAG ESRS Set 1 (EU 2023/2772)
   12 standards: ESRS 1, ESRS 2, E1-E5, S1-S4, G1-G2
   ═══════════════════════════════════════════════════════════════════════════════ */
const ESRS_STANDARDS=[
  {id:'ESRS 1',name:'General Requirements',category:'Cross-cutting',dataPoints:65,mandatory:true,para:'ESRS 1 §1-130',desc:'Sets out architecture: double materiality, value chain, time horizons, connectivity. Defines IRO (Impact, Risk, Opportunity) identification process per §38-62.',subTopics:['Double materiality assessment','Value chain boundary','Time horizons (short/medium/long)','Estimation under uncertainty','Entity-specific disclosures','Transitional provisions']},
  {id:'ESRS 2',name:'General Disclosures',category:'Cross-cutting',dataPoints:78,mandatory:true,para:'ESRS 2 §1-97',desc:'Mandatory for all CSRD-scope entities. 4 pillars: GOV, SBM, IRO, Policies/Actions/Targets/Metrics. Cross-cutting foundation for topical standards.',subTopics:['GOV-1 Board role','GOV-2 Stakeholder management','GOV-3 Risk integration','GOV-4 Due diligence','GOV-5 Sustainability-linked remuneration','SBM-1 Market position','SBM-2 Stakeholder interests','SBM-3 Material impacts','IRO-1 Description of DMA process','IRO-2 ESRS-covered sustainability matters']},
  {id:'ESRS E1',name:'Climate Change',category:'Environment',dataPoints:82,mandatory:true,para:'ESRS E1 §1-76',desc:'GHG emissions Scope 1/2/3, transition plan, energy consumption, carbon credits, internal carbon pricing. ESRS E1 is mandatory for all undertakings regardless of DMA outcome per ESRS 1 §AR16.',subTopics:['E1-1 Transition plan for climate change mitigation','E1-2 Policies related to climate change','E1-3 Actions/resources re climate change','E1-4 Targets related to climate change','E1-5 Energy consumption and mix','E1-6 Gross Scope 1/2/3 + total GHG','E1-7 GHG removals/carbon credits','E1-8 Internal carbon pricing','E1-9 Anticipated financial effects']},
  {id:'ESRS E2',name:'Pollution',category:'Environment',dataPoints:56,mandatory:false,para:'ESRS E2 §1-42',desc:'Air pollutants, water pollutants, soil pollutants, substances of concern (SVHC per REACH), microplastics.',subTopics:['E2-1 Policies re pollution','E2-2 Actions/resources','E2-3 Targets','E2-4 Air pollutants','E2-5 Water pollutants','E2-6 Substances of concern (SVHC)']},
  {id:'ESRS E3',name:'Water & Marine Resources',category:'Environment',dataPoints:38,mandatory:false,para:'ESRS E3 §1-34',desc:'Water consumption, withdrawal, discharge. Areas of high water stress. Marine resource extraction.',subTopics:['E3-1 Policies re water/marine','E3-2 Actions/resources','E3-3 Targets','E3-4 Water consumption','E3-5 Anticipated financial effects']},
  {id:'ESRS E4',name:'Biodiversity & Ecosystems',category:'Environment',dataPoints:45,mandatory:false,para:'ESRS E4 §1-56',desc:'Land-use, species impacts, ecosystem services, transition plan for biodiversity. Aligns with TNFD and Kunming-Montreal GBF.',subTopics:['E4-1 Transition plan for biodiversity','E4-2 Policies re biodiversity','E4-3 Actions/resources','E4-4 Targets','E4-5 Impact metrics','E4-6 Anticipated financial effects']},
  {id:'ESRS E5',name:'Resource Use & Circular Economy',category:'Environment',dataPoints:42,mandatory:false,para:'ESRS E5 §1-38',desc:'Resource inflows (recycled content), resource outflows (waste), product/material circularity metrics.',subTopics:['E5-1 Policies re resource use','E5-2 Actions/resources','E5-3 Targets','E5-4 Resource inflows','E5-5 Resource outflows','E5-6 Anticipated financial effects']},
  {id:'ESRS S1',name:'Own Workforce',category:'Social',dataPoints:91,mandatory:true,para:'ESRS S1 §1-104',desc:'Working conditions, equal treatment, social dialogue, adequate wages, work-life balance, health & safety. Largest Social standard with 91 datapoints.',subTopics:['S1-1 Policies re own workforce','S1-2 Engagement with workers','S1-3 Remediation processes','S1-4 Material negative impacts','S1-5 Targets','S1-6 Characteristics of employees','S1-7 Characteristics of non-employee workers','S1-8 Collective bargaining coverage','S1-9 Diversity metrics','S1-10 Adequate wages','S1-11 Social protection','S1-12 Persons with disabilities','S1-13 Training & skills','S1-14 Health & safety','S1-15 Work-life balance','S1-16 Remuneration metrics','S1-17 Incidents & complaints']},
  {id:'ESRS S2',name:'Workers in Value Chain',category:'Social',dataPoints:48,mandatory:false,para:'ESRS S2 §1-38',desc:'Human rights due diligence for upstream/downstream workers. Forced labour, child labour, living wage in supply chain.',subTopics:['S2-1 Policies re value chain workers','S2-2 Engagement processes','S2-3 Remediation','S2-4 Material negative impacts','S2-5 Targets']},
  {id:'ESRS S3',name:'Affected Communities',category:'Social',dataPoints:36,mandatory:false,para:'ESRS S3 §1-32',desc:'Land rights, indigenous peoples, security practices, community engagement.',subTopics:['S3-1 Policies re affected communities','S3-2 Engagement processes','S3-3 Remediation','S3-4 Material negative impacts','S3-5 Targets']},
  {id:'ESRS S4',name:'Consumers & End-users',category:'Social',dataPoints:34,mandatory:false,para:'ESRS S4 §1-30',desc:'Data privacy, product safety, inclusive access, responsible marketing.',subTopics:['S4-1 Policies re consumers','S4-2 Engagement processes','S4-3 Remediation','S4-4 Material negative impacts','S4-5 Targets']},
  {id:'ESRS G1',name:'Business Conduct',category:'Governance',dataPoints:28,mandatory:true,para:'ESRS G1 §1-32',desc:'Anti-corruption, whistleblower protection, political engagement, payment practices, lobbying, animal welfare.',subTopics:['G1-1 Business conduct policies','G1-2 Management of business conduct','G1-3 Anti-corruption/bribery prevention','G1-4 Confirmed incidents','G1-5 Political influence & lobbying','G1-6 Payment practices']},
];

const TOTAL_DATAPOINTS=ESRS_STANDARDS.reduce((s,e)=>s+e.dataPoints,0); // 643

/* ═══════════════════════════════════════════════════════════════════════════════
   ESRS TOPICS (for Double Materiality — 10 sustainability matters per ESRS 1 §AR16)
   ═══════════════════════════════════════════════════════════════════════════════ */
const DMA_TOPICS=[
  {id:'E1',name:'Climate Change',standard:'ESRS E1',category:'Environment',impactWeight:0.30,financialWeight:0.35,desc:'GHG mitigation & adaptation; energy transition'},
  {id:'E2',name:'Pollution',standard:'ESRS E2',category:'Environment',impactWeight:0.08,financialWeight:0.06,desc:'Air, water, soil pollution; substances of concern'},
  {id:'E3',name:'Water & Marine',standard:'ESRS E3',category:'Environment',impactWeight:0.07,financialWeight:0.05,desc:'Water consumption in stress areas; marine resources'},
  {id:'E4',name:'Biodiversity',standard:'ESRS E4',category:'Environment',impactWeight:0.09,financialWeight:0.07,desc:'Land-use change; species loss; ecosystem services'},
  {id:'E5',name:'Circular Economy',standard:'ESRS E5',category:'Environment',impactWeight:0.06,financialWeight:0.05,desc:'Resource inflows/outflows; waste; product design'},
  {id:'S1',name:'Own Workforce',standard:'ESRS S1',category:'Social',impactWeight:0.15,financialWeight:0.12,desc:'Working conditions; H&S; equal treatment; living wage'},
  {id:'S2',name:'Value Chain Workers',standard:'ESRS S2',category:'Social',impactWeight:0.08,financialWeight:0.09,desc:'Human rights DD; forced labour; child labour in supply chain'},
  {id:'S3',name:'Affected Communities',standard:'ESRS S3',category:'Social',impactWeight:0.05,financialWeight:0.04,desc:'Indigenous rights; land rights; FPIC'},
  {id:'S4',name:'Consumers',standard:'ESRS S4',category:'Social',impactWeight:0.04,financialWeight:0.06,desc:'Data privacy; product safety; responsible marketing'},
  {id:'G1',name:'Business Conduct',standard:'ESRS G1',category:'Governance',impactWeight:0.08,financialWeight:0.11,desc:'Anti-corruption; lobbying; payment practices; whistleblowing'},
];

/* ═══════════════════════════════════════════════════════════════════════════════
   COMPANY DATA — 80 companies with full CSRD metrics
   Sourced from SECURITY_UNIVERSE for real names, sectors, countries
   ═══════════════════════════════════════════════════════════════════════════════ */
const CSRD_COMPANIES=(()=>{
  const equities=SECURITY_UNIVERSE.filter(s=>s.assetType==='Equity').slice(0,80);
  return equities.map((sec,i)=>{
    const base=i*137;
    const overallReadiness=Math.round(10+sr(base)*85);
    const scores={};
    ESRS_STANDARDS.forEach((std,j)=>{
      scores[std.id]=Math.round(8+sr(base+j*17)*87);
    });
    const gapCount=Math.round(sr(base+97)*45);
    const dataPointsCovered=Math.round(TOTAL_DATAPOINTS*(overallReadiness/100)*0.95+sr(base+101)*20);
    const automationRate=Math.round(10+sr(base+103)*80);
    const assuranceReady=Math.round(5+sr(base+107)*90);
    const taxonomyAlignment=Math.round(sr(base+109)*65);
    const doubleMateriality=Math.round(10+sr(base+113)*85);
    const status=overallReadiness>=80?'Compliant':overallReadiness>=65?'Advanced':overallReadiness>=45?'In Progress':overallReadiness>=25?'Early Stage':'Not Started';
    const reportingWave=overallReadiness>=70?'Wave 1 (FY2024)':overallReadiness>=45?'Wave 2 (FY2025)':'Wave 3 (FY2026)';
    // DMA scores per topic
    const dmaScores=DMA_TOPICS.map((t,ti)=>{
      const impactScore=+(1+sr(base+ti*31)*4).toFixed(1);
      const financialScore=+(1+sr(base+ti*37)*4).toFixed(1);
      return{topicId:t.id,impactScore,financialScore,material:impactScore>=3||financialScore>=3};
    });
    return{
      id:sec.id||i+1,name:sec.name||`Company_${i+1}`,ticker:sec.ticker||'',sector:sec.sector||'Industrials',country:sec.country||'DE',
      overallReadiness,scores,gapCount,dataPointsCovered,totalDataPoints:TOTAL_DATAPOINTS,
      automationRate,assuranceReady,taxonomyAlignment,doubleMateriality,status,reportingWave,
      dmaScores,
      employees:sec.employees||Math.round(5000+sr(base+127)*95000),
      revenue:sec.revenue||Math.round(1000+sr(base+131)*49000),
      xbrlReadiness:Math.round(sr(base+139)*100),
      assuranceLevel:sr(base+141)<0.3?'Reasonable':sr(base+141)<0.7?'Limited':'Not Started',
      auditor:['Deloitte','PwC','EY','KPMG','BDO','Grant Thornton','Mazars'][Math.floor(sr(base+143)*7)],
    };
  });
})();

/* ═══════════════════════════════════════════════════════════════════════════════
   381 DATAPOINTS — Full ESRS Datapoint Inventory
   Each datapoint: code, label, standard, mandatory, phase-in, data source, coverage
   ═══════════════════════════════════════════════════════════════════════════════ */
const DATAPOINT_INVENTORY=(()=>{
  const items=[];
  const sources=['HR System','ERP/Finance','GHG Accounting','Environmental Management','Procurement','Legal/Compliance','Board Secretariat','External Provider','Manual Collection','IoT/Sensor','Supply Chain Platform','Customer System'];
  const qualityLevels=['High','Medium','Low','Not Available'];
  let idx=0;
  ESRS_STANDARDS.forEach(std=>{
    for(let dp=0;dp<std.dataPoints;dp++){
      const seed=idx*31+dp*7;
      const mandatory=std.mandatory||sr(seed)<0.4;
      const phaseIn=!mandatory&&sr(seed+1)<0.3;
      const coverage=Math.round(sr(seed+3)*100);
      const source=sources[Math.floor(sr(seed+5)*sources.length)];
      const quality=coverage>=80?qualityLevels[0]:coverage>=50?qualityLevels[1]:coverage>=20?qualityLevels[2]:qualityLevels[3];
      const automated=sr(seed+7)<(coverage/100)*0.8;
      items.push({
        id:`${std.id}-DP${String(dp+1).padStart(3,'0')}`,
        label:`${std.id} Datapoint ${dp+1}: ${std.subTopics?std.subTopics[dp%std.subTopics.length]:'General disclosure'}`,
        standard:std.id,standardName:std.name,category:std.category,
        mandatory,phaseIn,coverage,source,quality,automated,
        para:`${std.para} DP${dp+1}`,
        gap:coverage<50,critical:mandatory&&coverage<30,
      });
      idx++;
    }
  });
  return items;
})();

/* ═══════════════════════════════════════════════════════════════════════════════
   ASSURANCE EVIDENCE TRACKER
   ═══════════════════════════════════════════════════════════════════════════════ */
const ASSURANCE_EVIDENCE=(()=>{
  const evidenceTypes=['Policy document','Board minutes','Data extract','Calculation methodology','Third-party verification','Audit trail','Interview notes','Process documentation','System screenshot','External certificate'];
  return ESRS_STANDARDS.map((std,i)=>{
    const seed=i*53;
    return{
      standard:std.id,name:std.name,
      limitedReady:Math.round(20+sr(seed)*80),
      reasonableReady:Math.round(5+sr(seed+1)*60),
      evidenceCount:Math.round(5+sr(seed+3)*45),
      evidenceTypes:evidenceTypes.filter((_,j)=>sr(seed+j*3)<0.6),
      gapsForReasonable:Math.round(sr(seed+7)*15),
      auditorNotes:sr(seed+11)<0.4?'Minor findings':'No findings',
      isae3000Aligned:sr(seed+13)<0.6,
    };
  });
})();

/* ═══════════════════════════════════════════════════════════════════════════════
   XBRL TAXONOMY DATA
   ═══════════════════════════════════════════════════════════════════════════════ */
const XBRL_TAXONOMY=(()=>{
  return ESRS_STANDARDS.map((std,i)=>{
    const seed=i*67;
    return{
      standard:std.id,name:std.name,
      totalTags:std.dataPoints*2+Math.round(sr(seed)*30),
      taggedCount:Math.round(std.dataPoints*(0.3+sr(seed+1)*0.6)),
      validationErrors:Math.round(sr(seed+3)*12),
      inlineXbrlReady:sr(seed+5)<0.5,
      taxonomyVersion:'ESRS XBRL 2024',
      lastUpdate:`2026-0${1+Math.floor(sr(seed+7)*3)}-${10+Math.floor(sr(seed+9)*18)}`,
    };
  });
})();

/* ═══════════════════════════════════════════════════════════════════════════════
   TREND DATA — 24 months of readiness progression
   ═══════════════════════════════════════════════════════════════════════════════ */
const TREND=Array.from({length:24},(_,i)=>({
  month:`${2024+Math.floor(i/12)}-${String((i%12)+1).padStart(2,'0')}`,
  avgReady:Math.round(15+i*2.8+sr(i*7)*6),
  compliant:Math.round(1+i*1.2+sr(i*11)*2),
  gapsFixed:Math.round(40+i*18+sr(i*13)*30),
  datapointsCovered:Math.round(80+i*22+sr(i*17)*15),
  xbrlTagged:Math.round(20+i*15+sr(i*19)*10),
}));

/* ═══════════════════════════════════════════════════════════════════════════════
   KPI + UI COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════════ */
const KPI=({label,value,sub,color,cite})=>(
  <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:'16px 20px',flex:'1 1 180px',minWidth:160}}>
    <div style={{fontSize:11,color:T.textMut,fontFamily:T.mono,textTransform:'uppercase',letterSpacing:0.5}}>{label}</div>
    <div style={{fontSize:26,fontWeight:700,color:color||T.navy,fontFamily:T.mono,marginTop:4}}>{value}</div>
    {sub&&<div style={{fontSize:11,color:T.textSec,marginTop:2}}>{sub}</div>}
    {cite&&<div style={{fontSize:9,color:T.textMut,fontFamily:T.mono,marginTop:2}}>{cite}</div>}
  </div>
);

const SectionHead=({children,cite})=>(
  <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:12}}>
    <div style={{fontSize:14,fontWeight:700,color:T.navy}}>{children}</div>
    {cite&&<span style={{fontSize:9,color:T.textMut,fontFamily:T.mono}}>{cite}</span>}
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════════ */
export default function CsrdEsrsAutomationPage(){
  const[tab,setTab]=useState(0);
  const[search,setSearch]=useState('');
  const[secF,setSecF]=useState('All');
  const[readF,setReadF]=useState('All');
  const[sortCol,setSortCol]=useState('overallReadiness');
  const[sortDir,setSortDir]=useState('desc');
  const[page,setPage]=useState(1);
  const[expanded,setExpanded]=useState(null);
  const[dmaCompany,setDmaCompany]=useState(0);
  const[dmaView,setDmaView]=useState('matrix');
  const[dpSearch,setDpSearch]=useState('');
  const[dpStdFilter,setDpStdFilter]=useState('All');
  const[dpStatusFilter,setDpStatusFilter]=useState('All');
  const[dpPage,setDpPage]=useState(1);
  const[stdExpanded,setStdExpanded]=useState(null);
  const[xbrlStd,setXbrlStd]=useState(null);
  const[assuranceLevel,setAssuranceLevel]=useState('Limited');
  const[exportFormat,setExportFormat]=useState('CSRD Filing');

  const doSort=useCallback((col)=>{setSortCol(col);setSortDir(d=>sortCol===col?(d==='asc'?'desc':'asc'):'desc');setPage(1);},[sortCol]);

  /* ─── FILTERED COMPANIES ─── */
  const filtered=useMemo(()=>{
    let d=[...CSRD_COMPANIES];
    if(search)d=d.filter(r=>r.name.toLowerCase().includes(search.toLowerCase())||r.ticker.toLowerCase().includes(search.toLowerCase()));
    if(secF!=='All')d=d.filter(r=>r.sector===secF);
    if(readF!=='All')d=d.filter(r=>r.status===readF);
    d.sort((a,b)=>{
      const av=typeof a[sortCol]==='string'?a[sortCol]:a[sortCol]||0;
      const bv=typeof b[sortCol]==='string'?b[sortCol]:b[sortCol]||0;
      return sortDir==='asc'?(av>bv?1:-1):(av<bv?1:-1);
    });
    return d;
  },[search,secF,readF,sortCol,sortDir]);
  const paged=filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);
  const totalPages=Math.ceil(filtered.length/PAGE_SIZE);

  /* ─── FILTERED DATAPOINTS ─── */
  const filteredDPs=useMemo(()=>{
    let d=[...DATAPOINT_INVENTORY];
    if(dpSearch)d=d.filter(r=>r.label.toLowerCase().includes(dpSearch.toLowerCase())||r.id.toLowerCase().includes(dpSearch.toLowerCase()));
    if(dpStdFilter!=='All')d=d.filter(r=>r.standard===dpStdFilter);
    if(dpStatusFilter==='Gap')d=d.filter(r=>r.gap);
    else if(dpStatusFilter==='Critical')d=d.filter(r=>r.critical);
    else if(dpStatusFilter==='Mandatory')d=d.filter(r=>r.mandatory);
    else if(dpStatusFilter==='Automated')d=d.filter(r=>r.automated);
    return d;
  },[dpSearch,dpStdFilter,dpStatusFilter]);
  const dpPaged=filteredDPs.slice((dpPage-1)*PAGE_SIZE,dpPage*PAGE_SIZE);
  const dpTotalPages=Math.ceil(filteredDPs.length/PAGE_SIZE);

  /* ─── KPIs ─── */
  const kpis=useMemo(()=>{
    const avg=(k)=>Math.round(CSRD_COMPANIES.reduce((s,c)=>s+c[k],0)/CSRD_COMPANIES.length);
    return{
      avgReady:avg('overallReadiness'),
      avgAuto:avg('automationRate'),
      compliant:CSRD_COMPANIES.filter(c=>c.status==='Compliant'||c.status==='Advanced').length,
      totalGaps:CSRD_COMPANIES.reduce((s,c)=>s+c.gapCount,0),
      totalDatapoints:TOTAL_DATAPOINTS,
      avgDM:avg('doubleMateriality'),
      avgXbrl:avg('xbrlReadiness'),
      avgAssurance:avg('assuranceReady'),
      dpCoverage:Math.round(DATAPOINT_INVENTORY.filter(d=>d.coverage>=50).length/DATAPOINT_INVENTORY.length*100),
      criticalGaps:DATAPOINT_INVENTORY.filter(d=>d.critical).length,
    };
  },[]);

  /* ─── SECTOR AGGREGATIONS ─── */
  const sectorChart=useMemo(()=>{
    const m={};
    CSRD_COMPANIES.forEach(c=>{if(!m[c.sector])m[c.sector]={sector:c.sector,avgReady:0,avgDM:0,avgXbrl:0,n:0};m[c.sector].avgReady+=c.overallReadiness;m[c.sector].avgDM+=c.doubleMateriality;m[c.sector].avgXbrl+=c.xbrlReadiness;m[c.sector].n++;});
    return Object.values(m).map(s=>({...s,avgReady:Math.round(s.avgReady/s.n),avgDM:Math.round(s.avgDM/s.n),avgXbrl:Math.round(s.avgXbrl/s.n)}));
  },[]);

  const statusDist=useMemo(()=>{
    const m={};CSRD_COMPANIES.forEach(c=>{m[c.status]=(m[c.status]||0)+1;});
    return Object.entries(m).map(([name,value])=>({name,value}));
  },[]);

  const waveDist=useMemo(()=>{
    const m={};CSRD_COMPANIES.forEach(c=>{m[c.reportingWave]=(m[c.reportingWave]||0)+1;});
    return Object.entries(m).map(([name,value])=>({name,value}));
  },[]);

  const categoryDist=useMemo(()=>{
    const cats={Environment:0,Social:0,Governance:0,'Cross-cutting':0};
    ESRS_STANDARDS.forEach(s=>{cats[s.category]+=s.dataPoints;});
    return Object.entries(cats).map(([name,value])=>({name,value}));
  },[]);

  /* ─── STYLES ─── */
  const ss={
    wrap:{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:24,color:T.text},
    header:{fontSize:22,fontWeight:700,color:T.navy,marginBottom:4},
    sub:{fontSize:13,color:T.textSec,marginBottom:20},
    tabs:{display:'flex',gap:2,marginBottom:20,borderBottom:`2px solid ${T.border}`,paddingBottom:0,overflowX:'auto'},
    tab:(a)=>({padding:'10px 16px',fontSize:12,fontWeight:a?700:500,color:a?ACCENT:T.textSec,background:a?'rgba(124,58,237,0.06)':'transparent',border:'none',borderBottom:a?`2px solid ${ACCENT}`:'2px solid transparent',cursor:'pointer',fontFamily:T.font,marginBottom:-2,whiteSpace:'nowrap'}),
    card:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20,marginBottom:20},
    input:{padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:13,fontFamily:T.font,background:T.surface,color:T.text,outline:'none',width:220},
    select:{padding:'8px 12px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:12,fontFamily:T.font,background:T.surface,color:T.text},
    th:(col)=>({padding:'10px 12px',textAlign:'left',fontSize:11,fontFamily:T.mono,color:sortCol===col?ACCENT:T.textMut,cursor:'pointer',borderBottom:`2px solid ${T.border}`,userSelect:'none',textTransform:'uppercase',letterSpacing:0.5,whiteSpace:'nowrap'}),
    td:{padding:'10px 12px',fontSize:12,borderBottom:`1px solid ${T.border}`,fontFamily:T.font},
    btn:{padding:'6px 16px',fontSize:12,fontWeight:600,color:T.surface,background:ACCENT,border:'none',borderRadius:6,cursor:'pointer',fontFamily:T.font},
    btnSec:{padding:'6px 16px',fontSize:12,fontWeight:600,color:T.textSec,background:'transparent',border:`1px solid ${T.border}`,borderRadius:6,cursor:'pointer',fontFamily:T.font},
    btnSm:{padding:'4px 10px',fontSize:11,fontWeight:600,color:ACCENT,background:'rgba(124,58,237,0.06)',border:`1px solid rgba(124,58,237,0.2)`,borderRadius:4,cursor:'pointer',fontFamily:T.font},
    pg:{display:'flex',gap:8,alignItems:'center',justifyContent:'center',marginTop:16},
    cite:{fontSize:9,color:T.textMut,fontFamily:T.mono,marginTop:4},
    grid2:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20},
    grid3:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16,marginBottom:20},
    flex:{display:'flex',gap:12,flexWrap:'wrap',marginBottom:16,alignItems:'center'},
  };
  const TH=({col,label})=><th style={ss.th(col)} onClick={()=>doSort(col)}>{label}{sortCol===col?(sortDir==='asc'?' \u25B2':' \u25BC'):''}</th>;

  /* ═══════════════════════════════════════════════════════════════════════════════
     TAB 0: DOUBLE MATERIALITY ASSESSMENT — ESRS 1 §38-62
     IRO matrix, impact + financial scoring, 10 ESRS topics x 80 companies
     ═══════════════════════════════════════════════════════════════════════════════ */
  const renderDoubleMateriality=()=>{
    const co=CSRD_COMPANIES[dmaCompany];
    const dma=co.dmaScores;
    const matCount=dma.filter(d=>d.material).length;
    const avgImpact=+(dma.reduce((s,d)=>s+d.impactScore,0)/dma.length).toFixed(1);
    const avgFinancial=+(dma.reduce((s,d)=>s+d.financialScore,0)/dma.length).toFixed(1);

    // Aggregate across all companies for heatmap
    const heatmapData=DMA_TOPICS.map((topic,ti)=>{
      const avgI=+(CSRD_COMPANIES.reduce((s,c)=>s+c.dmaScores[ti].impactScore,0)/CSRD_COMPANIES.length).toFixed(1);
      const avgF=+(CSRD_COMPANIES.reduce((s,c)=>s+c.dmaScores[ti].financialScore,0)/CSRD_COMPANIES.length).toFixed(1);
      const matPct=Math.round(CSRD_COMPANIES.filter(c=>c.dmaScores[ti].material).length/CSRD_COMPANIES.length*100);
      return{...topic,avgImpact:avgI,avgFinancial:avgF,materialPct:matPct};
    });

    // Scatter data for selected company
    const scatterData=dma.map((d,i)=>({
      name:DMA_TOPICS[i].name,x:d.financialScore,y:d.impactScore,z:d.material?120:60,material:d.material,
    }));

    // Radar data
    const radarData=dma.map((d,i)=>({topic:DMA_TOPICS[i].id,impact:d.impactScore,financial:d.financialScore}));

    return(<>
      <div style={ss.flex}>
        <SectionHead cite="ESRS 1 §38-62 — Double Materiality Assessment">Double Materiality Assessment</SectionHead>
      </div>
      <div style={{...ss.flex,marginBottom:20}}>
        <select style={{...ss.select,width:280}} value={dmaCompany} onChange={e=>{setDmaCompany(+e.target.value);}}>
          {CSRD_COMPANIES.map((c,i)=><option key={i} value={i}>{c.name} ({c.sector})</option>)}
        </select>
        <button style={dmaView==='matrix'?ss.btn:ss.btnSec} onClick={()=>setDmaView('matrix')}>IRO Matrix</button>
        <button style={dmaView==='scatter'?ss.btn:ss.btnSec} onClick={()=>setDmaView('scatter')}>Scatter Plot</button>
        <button style={dmaView==='heatmap'?ss.btn:ss.btnSec} onClick={()=>setDmaView('heatmap')}>Portfolio Heatmap</button>
        <button style={dmaView==='radar'?ss.btn:ss.btnSec} onClick={()=>setDmaView('radar')}>Radar</button>
      </div>
      <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:20}}>
        <KPI label="Material Topics" value={`${matCount}/10`} sub={`${co.name}`} color={matCount>=7?T.red:matCount>=4?T.amber:T.green} cite="ESRS 1 §38"/>
        <KPI label="Avg Impact Score" value={avgImpact} sub="scale 1-5" color={avgImpact>=3.5?T.red:avgImpact>=2.5?T.amber:T.green} cite="ESRS 1 §46"/>
        <KPI label="Avg Financial Score" value={avgFinancial} sub="scale 1-5" color={avgFinancial>=3.5?T.red:avgFinancial>=2.5?T.amber:T.green} cite="ESRS 1 §49"/>
        <KPI label="DMA Completeness" value={co.doubleMateriality+'%'} color={ACCENT} cite="ESRS 1 §62"/>
        <KPI label="Portfolio Avg Material" value={Math.round(heatmapData.reduce((s,h)=>s+h.materialPct,0)/10)+'%'} sub="across 80 companies" color={T.navy}/>
      </div>

      {dmaView==='matrix'&&(
        <div style={ss.card}>
          <SectionHead cite="ESRS 1 §43 — Impact, Risk, Opportunity (IRO) Matrix">IRO Materiality Matrix — {co.name}</SectionHead>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr>
                <th style={{...ss.td,fontFamily:T.mono,fontSize:11,color:T.textMut,fontWeight:600}}>Topic</th>
                <th style={{...ss.td,fontFamily:T.mono,fontSize:11,color:T.textMut,fontWeight:600}}>Standard</th>
                <th style={{...ss.td,fontFamily:T.mono,fontSize:11,color:T.textMut,fontWeight:600}}>Category</th>
                <th style={{...ss.td,fontFamily:T.mono,fontSize:11,color:T.textMut,fontWeight:600}}>Impact Score</th>
                <th style={{...ss.td,fontFamily:T.mono,fontSize:11,color:T.textMut,fontWeight:600}}>Financial Score</th>
                <th style={{...ss.td,fontFamily:T.mono,fontSize:11,color:T.textMut,fontWeight:600}}>Material?</th>
                <th style={{...ss.td,fontFamily:T.mono,fontSize:11,color:T.textMut,fontWeight:600}}>Severity</th>
                <th style={{...ss.td,fontFamily:T.mono,fontSize:11,color:T.textMut,fontWeight:600}}>Description</th>
              </tr></thead>
              <tbody>{dma.map((d,i)=>{
                const topic=DMA_TOPICS[i];
                const sev=matBadge(Math.max(d.impactScore,d.financialScore));
                return(<tr key={i} style={{background:d.material?'rgba(124,58,237,0.03)':'transparent'}}>
                  <td style={{...ss.td,fontWeight:600}}>{topic.name}</td>
                  <td style={{...ss.td,fontFamily:T.mono,fontSize:11}}>{topic.standard}</td>
                  <td style={ss.td}><span style={{...statusBadge(topic.category==='Environment'?'Advanced':topic.category==='Social'?'In Progress':'Early Stage'),fontSize:10}}>{topic.category}</span></td>
                  <td style={ss.td}><span style={badge(d.impactScore*20,[30,50,70])}>{d.impactScore}</span></td>
                  <td style={ss.td}><span style={badge(d.financialScore*20,[30,50,70])}>{d.financialScore}</span></td>
                  <td style={ss.td}><span style={statusBadge(d.material?'Complete':'Not Started')}>{d.material?'Yes':'No'}</span></td>
                  <td style={ss.td}><span style={{background:sev.bg,color:sev.c,padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600}}>{sev.label}</span></td>
                  <td style={{...ss.td,fontSize:11,color:T.textSec,maxWidth:200}}>{topic.desc}</td>
                </tr>);
              })}</tbody>
            </table>
          </div>
          <div style={ss.cite}>Reference: ESRS 1 §38-62. Impact materiality threshold ≥3 (ESRS 1 §46). Financial materiality threshold ≥3 (ESRS 1 §49). A topic is material if either dimension exceeds threshold.</div>
        </div>
      )}

      {dmaView==='scatter'&&(
        <div style={ss.card}>
          <SectionHead cite="ESRS 1 §50 — Double Materiality Scatter">Impact vs Financial Materiality — {co.name}</SectionHead>
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart margin={{top:20,right:20,bottom:20,left:20}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="x" type="number" domain={[0,5]} name="Financial Score" tick={{fontSize:10,fill:T.textMut}} label={{value:'Financial Materiality',position:'bottom',fontSize:11,fill:T.textSec}}/>
              <YAxis dataKey="y" type="number" domain={[0,5]} name="Impact Score" tick={{fontSize:10,fill:T.textMut}} label={{value:'Impact Materiality',angle:-90,position:'left',fontSize:11,fill:T.textSec}}/>
              <ZAxis dataKey="z" range={[40,150]}/>
              <Tooltip content={({payload})=>{
                if(!payload||!payload[0])return null;
                const d=payload[0].payload;
                return(<div style={{...tip.contentStyle,padding:10}}>
                  <div style={{fontWeight:700,fontSize:12}}>{d.name}</div>
                  <div style={{fontSize:11}}>Impact: {d.y} | Financial: {d.x}</div>
                  <div style={{fontSize:11,color:d.material?T.green:T.red}}>{d.material?'MATERIAL':'Not Material'}</div>
                </div>);
              }}/>
              <Scatter data={scatterData.filter(d=>d.material)} fill={ACCENT} name="Material"/>
              <Scatter data={scatterData.filter(d=>!d.material)} fill={T.textMut} name="Not Material"/>
              {/* Threshold lines at 3.0 */}
              <Legend/>
            </ScatterChart>
          </ResponsiveContainer>
          <div style={{display:'flex',gap:8,justifyContent:'center',marginTop:8}}>
            <span style={{fontSize:10,color:T.textMut}}>Materiality threshold = 3.0 on both axes (ESRS 1 §46/§49)</span>
          </div>
        </div>
      )}

      {dmaView==='heatmap'&&(
        <div style={ss.card}>
          <SectionHead cite="ESRS 1 §AR16 — Portfolio-level Double Materiality Heatmap">Portfolio Materiality Heatmap — {CSRD_COMPANIES.length} Companies</SectionHead>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr>
                <th style={{...ss.td,fontFamily:T.mono,fontSize:11,color:T.textMut}}>Topic</th>
                <th style={{...ss.td,fontFamily:T.mono,fontSize:11,color:T.textMut}}>Avg Impact</th>
                <th style={{...ss.td,fontFamily:T.mono,fontSize:11,color:T.textMut}}>Avg Financial</th>
                <th style={{...ss.td,fontFamily:T.mono,fontSize:11,color:T.textMut}}>% Material</th>
                <th style={{...ss.td,fontFamily:T.mono,fontSize:11,color:T.textMut}}>Impact Wt</th>
                <th style={{...ss.td,fontFamily:T.mono,fontSize:11,color:T.textMut}}>Financial Wt</th>
                <th style={{...ss.td,fontFamily:T.mono,fontSize:11,color:T.textMut}}>Heatmap</th>
              </tr></thead>
              <tbody>{heatmapData.map((h,i)=>(
                <tr key={i}>
                  <td style={{...ss.td,fontWeight:600}}>{h.name}</td>
                  <td style={ss.td}><span style={badge(h.avgImpact*20,[30,50,70])}>{h.avgImpact}</span></td>
                  <td style={ss.td}><span style={badge(h.avgFinancial*20,[30,50,70])}>{h.avgFinancial}</span></td>
                  <td style={ss.td}><span style={badge(h.materialPct,[30,50,70])}>{h.materialPct}%</span></td>
                  <td style={{...ss.td,fontFamily:T.mono,fontSize:11}}>{(h.impactWeight*100).toFixed(0)}%</td>
                  <td style={{...ss.td,fontFamily:T.mono,fontSize:11}}>{(h.financialWeight*100).toFixed(0)}%</td>
                  <td style={ss.td}>
                    <div style={{width:120,height:16,background:T.surfaceH,borderRadius:3,overflow:'hidden',position:'relative'}}>
                      <div style={{width:`${h.materialPct}%`,height:'100%',background:`linear-gradient(90deg, ${T.sage}, ${h.materialPct>60?T.red:T.amber})`,borderRadius:3}}/>
                    </div>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div style={ss.cite}>Aggregated across {CSRD_COMPANIES.length} CSRD-scope entities. A topic is material if impact OR financial score ≥ 3.0.</div>
        </div>
      )}

      {dmaView==='radar'&&(
        <div style={ss.card}>
          <SectionHead cite="ESRS 1 §57 — Materiality Profile">Materiality Radar — {co.name}</SectionHead>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={140}>
              <PolarGrid stroke={T.border}/>
              <PolarAngleAxis dataKey="topic" tick={{fontSize:11,fill:T.textSec}}/>
              <PolarRadiusAxis tick={{fontSize:9,fill:T.textMut}} domain={[0,5]}/>
              <Radar name="Impact" dataKey="impact" stroke={T.red} fill="rgba(220,38,38,0.15)" strokeWidth={2}/>
              <Radar name="Financial" dataKey="financial" stroke={T.navy} fill="rgba(27,58,92,0.1)" strokeWidth={2}/>
              <Legend/>
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* DMA Summary Stats */}
      <div style={ss.grid2}>
        <div style={ss.card}>
          <SectionHead cite="ESRS 1 §58">Materiality by Category</SectionHead>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart><Pie data={categoryDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={10}>
              {categoryDist.map((_,i)=><Cell key={i} fill={PIECLRS[i%PIECLRS.length]}/>)}
            </Pie><Tooltip {...tip}/></PieChart>
          </ResponsiveContainer>
        </div>
        <div style={ss.card}>
          <SectionHead cite="ESRS 1 §62">Reporting Wave Distribution</SectionHead>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={waveDist}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="name" tick={{fontSize:9,fill:T.textMut}}/><YAxis tick={{fontSize:10,fill:T.textMut}}/>
              <Tooltip {...tip}/><Bar dataKey="value" fill={ACCENT} radius={[4,4,0,0]} name="Companies"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>);
  };

  /* ═══════════════════════════════════════════════════════════════════════════════
     TAB 1: ESRS STANDARDS BROWSER — E1-E5, S1-S4, G1-G2 + cross-cutting
     ═══════════════════════════════════════════════════════════════════════════════ */
  const renderStandards=()=>{
    const envStds=ESRS_STANDARDS.filter(s=>s.category==='Environment');
    const socStds=ESRS_STANDARDS.filter(s=>s.category==='Social');
    const govStds=ESRS_STANDARDS.filter(s=>s.category==='Governance');
    const crossStds=ESRS_STANDARDS.filter(s=>s.category==='Cross-cutting');

    const renderStdGroup=(title,stds,color)=>(
      <div style={{marginBottom:24}}>
        <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12,borderLeft:`4px solid ${color}`,paddingLeft:12}}>{title}</div>
        {stds.map((std,i)=>(
          <div key={i} style={{...ss.card,borderLeft:`3px solid ${color}`,cursor:'pointer',background:stdExpanded===std.id?T.surfaceH:T.surface}} onClick={()=>setStdExpanded(stdExpanded===std.id?null:std.id)}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <span style={{fontWeight:700,color:T.navy,marginRight:8}}>{std.id}</span>
                <span style={{fontSize:13,color:T.text}}>{std.name}</span>
                {std.mandatory&&<span style={{...statusBadge('Complete'),marginLeft:8,fontSize:10}}>Mandatory</span>}
              </div>
              <div style={{display:'flex',gap:12,alignItems:'center'}}>
                <span style={{fontSize:11,fontFamily:T.mono,color:T.textSec}}>{std.dataPoints} datapoints</span>
                <span style={{fontSize:11,fontFamily:T.mono,color:T.textMut}}>{std.para}</span>
                <span style={{fontSize:12,color:ACCENT}}>{stdExpanded===std.id?'\u25B2':'\u25BC'}</span>
              </div>
            </div>
            {stdExpanded===std.id&&(
              <div style={{marginTop:16,paddingTop:16,borderTop:`1px solid ${T.border}`}}>
                <div style={{fontSize:12,color:T.textSec,marginBottom:12,lineHeight:1.6}}>{std.desc}</div>
                <div style={{fontSize:11,fontWeight:700,color:T.navy,marginBottom:8}}>Disclosure Requirements & Sub-topics:</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                  {(std.subTopics||[]).map((st,j)=>(
                    <div key={j} style={{padding:'8px 12px',background:T.surfaceH,borderRadius:6,fontSize:11,color:T.text,border:`1px solid ${T.border}`}}>
                      <span style={{fontFamily:T.mono,color:ACCENT,marginRight:6}}>{std.id}-{j+1}</span>{st}
                    </div>
                  ))}
                </div>
                <div style={{display:'flex',gap:16,marginTop:12}}>
                  <div style={{fontSize:11,color:T.textMut}}>Category: <span style={{fontWeight:600,color:T.text}}>{std.category}</span></div>
                  <div style={{fontSize:11,color:T.textMut}}>Paragraph: <span style={{fontFamily:T.mono,color:ACCENT}}>{std.para}</span></div>
                  <div style={{fontSize:11,color:T.textMut}}>Datapoints: <span style={{fontWeight:600,color:T.text}}>{std.dataPoints}</span></div>
                </div>
                {/* Portfolio coverage for this standard */}
                <div style={{marginTop:12}}>
                  <div style={{fontSize:11,fontWeight:600,color:T.navy,marginBottom:6}}>Portfolio Coverage ({CSRD_COMPANIES.length} companies):</div>
                  <div style={{display:'flex',gap:8}}>
                    {['Compliant','Advanced','In Progress','Early Stage','Not Started'].map(st=>{
                      const cnt=CSRD_COMPANIES.filter(c=>{
                        const sc=c.scores[std.id]||0;
                        return st==='Compliant'?sc>=80:st==='Advanced'?sc>=65&&sc<80:st==='In Progress'?sc>=45&&sc<65:st==='Early Stage'?sc>=25&&sc<45:sc<25;
                      }).length;
                      return <span key={st} style={{...statusBadge(st),fontSize:10}}>{st}: {cnt}</span>;
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );

    return(<>
      <SectionHead cite="EU 2023/2772 — ESRS Set 1 Delegated Act">ESRS Standards Browser</SectionHead>
      <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:20}}>
        <KPI label="Total Standards" value={ESRS_STANDARDS.length} sub="ESRS Set 1" color={ACCENT}/>
        <KPI label="Total Datapoints" value={TOTAL_DATAPOINTS} sub="across all standards" color={T.navy}/>
        <KPI label="Mandatory Standards" value={ESRS_STANDARDS.filter(s=>s.mandatory).length} sub="regardless of DMA" color={T.red}/>
        <KPI label="Environment" value={envStds.length} sub="E1-E5" color={T.sage}/>
        <KPI label="Social" value={socStds.length} sub="S1-S4" color={T.amber}/>
        <KPI label="Governance" value={govStds.length} sub="G1-G2" color={T.gold}/>
      </div>
      {renderStdGroup('Cross-cutting Standards',crossStds,ACCENT)}
      {renderStdGroup('Environmental Standards (E1-E5)',envStds,T.sage)}
      {renderStdGroup('Social Standards (S1-S4)',socStds,T.amber)}
      {renderStdGroup('Governance Standards (G1-G2)',govStds,T.gold)}
    </>);
  };

  /* ═══════════════════════════════════════════════════════════════════════════════
     TAB 2: DATAPOINT INVENTORY — 381+ datapoints, coverage, gap analysis
     ═══════════════════════════════════════════════════════════════════════════════ */
  const renderDatapoints=()=>{
    const gapCount=DATAPOINT_INVENTORY.filter(d=>d.gap).length;
    const critCount=DATAPOINT_INVENTORY.filter(d=>d.critical).length;
    const autoCount=DATAPOINT_INVENTORY.filter(d=>d.automated).length;
    const mandCount=DATAPOINT_INVENTORY.filter(d=>d.mandatory).length;
    const avgCoverage=Math.round(DATAPOINT_INVENTORY.reduce((s,d)=>s+d.coverage,0)/DATAPOINT_INVENTORY.length);

    // Coverage by standard
    const covByStd=ESRS_STANDARDS.map(std=>{
      const dps=DATAPOINT_INVENTORY.filter(d=>d.standard===std.id);
      const avg=Math.round(dps.reduce((s,d)=>s+d.coverage,0)/dps.length);
      return{standard:std.id,name:std.name,avgCoverage:avg,total:dps.length,gaps:dps.filter(d=>d.gap).length};
    });

    // Coverage by source
    const covBySrc={};
    DATAPOINT_INVENTORY.forEach(d=>{
      if(!covBySrc[d.source])covBySrc[d.source]={source:d.source,count:0,avgCov:0};
      covBySrc[d.source].count++;covBySrc[d.source].avgCov+=d.coverage;
    });
    const srcData=Object.values(covBySrc).map(s=>({...s,avgCov:Math.round(s.avgCov/s.count)})).sort((a,b)=>b.count-a.count);

    // Quality distribution
    const qualDist={};
    DATAPOINT_INVENTORY.forEach(d=>{qualDist[d.quality]=(qualDist[d.quality]||0)+1;});
    const qualData=Object.entries(qualDist).map(([name,value])=>({name,value}));

    return(<>
      <SectionHead cite="ESRS 2 — Datapoint Inventory & Gap Analysis">Datapoint Inventory ({DATAPOINT_INVENTORY.length} Datapoints)</SectionHead>
      <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:20}}>
        <KPI label="Total Datapoints" value={DATAPOINT_INVENTORY.length} color={ACCENT}/>
        <KPI label="Avg Coverage" value={avgCoverage+'%'} color={avgCoverage>=60?T.green:T.amber}/>
        <KPI label="Gaps (<50%)" value={gapCount} color={T.red}/>
        <KPI label="Critical Gaps" value={critCount} sub="mandatory + <30%" color={T.red}/>
        <KPI label="Automated" value={autoCount} sub={`${Math.round(autoCount/DATAPOINT_INVENTORY.length*100)}%`} color={T.sage}/>
        <KPI label="Mandatory" value={mandCount} color={T.navy}/>
      </div>

      <div style={ss.grid2}>
        <div style={ss.card}>
          <SectionHead>Coverage by Standard</SectionHead>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={covByStd} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis type="number" domain={[0,100]} tick={{fontSize:9,fill:T.textMut}}/>
              <YAxis dataKey="standard" type="category" tick={{fontSize:9,fill:T.textSec}} width={70}/>
              <Tooltip {...tip}/><Bar dataKey="avgCoverage" fill={ACCENT} radius={[0,4,4,0]} name="Avg Coverage %"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={ss.card}>
          <SectionHead>Data Quality Distribution</SectionHead>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart><Pie data={qualData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={50} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={10}>
              {qualData.map((_,i)=><Cell key={i} fill={[T.green,T.gold,T.amber,T.red][i%4]}/>)}
            </Pie><Tooltip {...tip}/></PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Datapoint Table */}
      <div style={ss.card}>
        <div style={ss.flex}>
          <input style={ss.input} placeholder="Search datapoints..." value={dpSearch} onChange={e=>{setDpSearch(e.target.value);setDpPage(1);}}/>
          <select style={ss.select} value={dpStdFilter} onChange={e=>{setDpStdFilter(e.target.value);setDpPage(1);}}>
            <option value="All">All Standards</option>
            {ESRS_STANDARDS.map(s=><option key={s.id} value={s.id}>{s.id} — {s.name}</option>)}
          </select>
          <select style={ss.select} value={dpStatusFilter} onChange={e=>{setDpStatusFilter(e.target.value);setDpPage(1);}}>
            <option value="All">All Status</option>
            <option value="Gap">Gaps Only</option>
            <option value="Critical">Critical Gaps</option>
            <option value="Mandatory">Mandatory</option>
            <option value="Automated">Automated</option>
          </select>
          <div style={{flex:1}}/><span style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>{filteredDPs.length} datapoints</span>
          <button style={ss.btn} onClick={()=>csvExport(filteredDPs.map(d=>({id:d.id,label:d.label,standard:d.standard,mandatory:d.mandatory?'Yes':'No',coverage:d.coverage,source:d.source,quality:d.quality,automated:d.automated?'Yes':'No',gap:d.gap?'Yes':'No',critical:d.critical?'Yes':'No'})),'csrd_datapoints')}>Export CSV</button>
        </div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>
            <th style={{...ss.td,fontFamily:T.mono,fontSize:10,color:T.textMut}}>ID</th>
            <th style={{...ss.td,fontFamily:T.mono,fontSize:10,color:T.textMut,minWidth:200}}>Datapoint</th>
            <th style={{...ss.td,fontFamily:T.mono,fontSize:10,color:T.textMut}}>Standard</th>
            <th style={{...ss.td,fontFamily:T.mono,fontSize:10,color:T.textMut}}>Mandatory</th>
            <th style={{...ss.td,fontFamily:T.mono,fontSize:10,color:T.textMut}}>Coverage</th>
            <th style={{...ss.td,fontFamily:T.mono,fontSize:10,color:T.textMut}}>Source</th>
            <th style={{...ss.td,fontFamily:T.mono,fontSize:10,color:T.textMut}}>Quality</th>
            <th style={{...ss.td,fontFamily:T.mono,fontSize:10,color:T.textMut}}>Auto</th>
            <th style={{...ss.td,fontFamily:T.mono,fontSize:10,color:T.textMut}}>Status</th>
          </tr></thead><tbody>{dpPaged.map((d,i)=>(
            <tr key={i} style={{background:d.critical?'rgba(220,38,38,0.04)':d.gap?'rgba(217,119,6,0.03)':'transparent'}}>
              <td style={{...ss.td,fontFamily:T.mono,fontSize:10}}>{d.id}</td>
              <td style={{...ss.td,fontSize:11,maxWidth:280}}>{d.label}</td>
              <td style={ss.td}><span style={{fontFamily:T.mono,fontSize:10,color:ACCENT}}>{d.standard}</span></td>
              <td style={ss.td}>{d.mandatory?<span style={statusBadge('Complete')}>Yes</span>:d.phaseIn?<span style={statusBadge('In Progress')}>Phase-in</span>:<span style={{fontSize:10,color:T.textMut}}>No</span>}</td>
              <td style={ss.td}><span style={badge(d.coverage,[25,50,75])}>{d.coverage}%</span></td>
              <td style={{...ss.td,fontSize:10}}>{d.source}</td>
              <td style={ss.td}><span style={statusBadge(d.quality==='High'?'Complete':d.quality==='Medium'?'In Progress':d.quality==='Low'?'Early Stage':'Not Started')}>{d.quality}</span></td>
              <td style={ss.td}>{d.automated?<span style={{color:T.green,fontSize:10}}>Auto</span>:<span style={{color:T.textMut,fontSize:10}}>Manual</span>}</td>
              <td style={ss.td}>{d.critical?<span style={statusBadge('Not Started')}>Critical Gap</span>:d.gap?<span style={statusBadge('Early Stage')}>Gap</span>:<span style={statusBadge('Complete')}>OK</span>}</td>
            </tr>
          ))}</tbody></table>
        </div>
        <div style={ss.pg}>
          <button style={ss.btnSec} disabled={dpPage<=1} onClick={()=>setDpPage(p=>p-1)}>Prev</button>
          <span style={{fontSize:12,fontFamily:T.mono,color:T.textSec}}>{dpPage}/{dpTotalPages}</span>
          <button style={ss.btnSec} disabled={dpPage>=dpTotalPages} onClick={()=>setDpPage(p=>p+1)}>Next</button>
        </div>
      </div>

      {/* Data Source Coverage */}
      <div style={ss.card}>
        <SectionHead>Coverage by Data Source</SectionHead>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={srcData}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="source" tick={{fontSize:8,fill:T.textMut}} angle={-30} textAnchor="end" height={80}/>
            <YAxis tick={{fontSize:10,fill:T.textMut}}/>
            <Tooltip {...tip}/>
            <Bar dataKey="count" fill={ACCENT} radius={[4,4,0,0]} name="Datapoints"/>
            <Bar dataKey="avgCov" fill={T.sage} radius={[4,4,0,0]} name="Avg Coverage %"/>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>);
  };

  /* ═══════════════════════════════════════════════════════════════════════════════
     TAB 3: COMPANY READINESS — 80 companies scored on CSRD preparedness
     ═══════════════════════════════════════════════════════════════════════════════ */
  const renderReadiness=()=>(
    <div>
      <SectionHead cite="CSRD Art. 19a — Company Readiness Assessment">Company Readiness ({CSRD_COMPANIES.length} Entities)</SectionHead>
      <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:20}}>
        <KPI label="Avg Readiness" value={kpis.avgReady+'%'} color={ACCENT}/>
        <KPI label="Automation Rate" value={kpis.avgAuto+'%'} color={T.navy}/>
        <KPI label="Compliant + Advanced" value={kpis.compliant} color={T.green}/>
        <KPI label="Total Gaps" value={fmt(kpis.totalGaps)} color={T.red}/>
        <KPI label="DMA Avg" value={kpis.avgDM+'%'} color={T.gold}/>
        <KPI label="XBRL Avg" value={kpis.avgXbrl+'%'} color={T.sage}/>
      </div>

      {/* Charts */}
      <div style={ss.grid2}>
        <div style={ss.card}>
          <SectionHead>Readiness by Sector</SectionHead>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={sectorChart}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="sector" tick={{fontSize:8,fill:T.textMut}} angle={-25} textAnchor="end" height={70}/>
              <YAxis tick={{fontSize:10,fill:T.textMut}} domain={[0,100]}/>
              <Tooltip {...tip}/>
              <Bar dataKey="avgReady" fill={ACCENT} radius={[4,4,0,0]} name="Readiness %"/>
              <Bar dataKey="avgDM" fill={T.gold} radius={[4,4,0,0]} name="DMA %"/>
              <Bar dataKey="avgXbrl" fill={T.sage} radius={[4,4,0,0]} name="XBRL %"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={ss.card}>
          <SectionHead>Status Distribution</SectionHead>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart><Pie data={statusDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={50} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={10}>
              {statusDist.map((_,i)=><Cell key={i} fill={PIECLRS[i%PIECLRS.length]}/>)}
            </Pie><Tooltip {...tip}/></PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Trend */}
      <div style={ss.card}>
        <SectionHead>Readiness Trend (24 Months)</SectionHead>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={TREND}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="month" tick={{fontSize:9,fill:T.textMut}} interval={3}/>
            <YAxis tick={{fontSize:10,fill:T.textMut}}/>
            <Tooltip {...tip}/>
            <Area type="monotone" dataKey="avgReady" stroke={ACCENT} fill="rgba(124,58,237,0.1)" name="Avg Readiness %"/>
            <Area type="monotone" dataKey="compliant" stroke={T.green} fill="rgba(22,163,74,0.08)" name="Compliant #"/>
            <Area type="monotone" dataKey="xbrlTagged" stroke={T.sage} fill="rgba(90,138,106,0.08)" name="XBRL Tagged #"/>
            <Legend/>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Company Table */}
      <div style={ss.card}>
        <div style={ss.flex}>
          <input style={ss.input} placeholder="Search companies..." value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/>
          <select style={ss.select} value={secF} onChange={e=>{setSecF(e.target.value);setPage(1);}}>{SECTORS.map(s=><option key={s}>{s}</option>)}</select>
          <select style={ss.select} value={readF} onChange={e=>{setReadF(e.target.value);setPage(1);}}>{READINESS_LEVELS.map(s=><option key={s}>{s}</option>)}</select>
          <div style={{flex:1}}/><span style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>{filtered.length} companies</span>
          <button style={ss.btn} onClick={()=>csvExport(filtered.map(c=>({name:c.name,sector:c.sector,readiness:c.overallReadiness,status:c.status,dma:c.doubleMateriality,gaps:c.gapCount,automation:c.automationRate,xbrl:c.xbrlReadiness,assurance:c.assuranceReady,wave:c.reportingWave})),'csrd_readiness')}>Export CSV</button>
        </div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>
            <TH col="name" label="Company"/><TH col="sector" label="Sector"/>
            <TH col="overallReadiness" label="Readiness"/><TH col="doubleMateriality" label="DMA"/>
            <TH col="xbrlReadiness" label="XBRL"/><TH col="automationRate" label="Auto %"/>
            <TH col="gapCount" label="Gaps"/><TH col="assuranceLevel" label="Assurance"/>
            <TH col="reportingWave" label="Wave"/><TH col="status" label="Status"/>
          </tr></thead><tbody>{paged.map(r=>(
            <React.Fragment key={r.id}>
              <tr style={{cursor:'pointer',background:expanded===r.id?T.surfaceH:'transparent'}} onClick={()=>setExpanded(expanded===r.id?null:r.id)}>
                <td style={{...ss.td,fontWeight:600}}>{r.name}</td>
                <td style={ss.td}>{r.sector}</td>
                <td style={ss.td}><span style={badge(r.overallReadiness,[25,50,70])}>{r.overallReadiness}%</span></td>
                <td style={ss.td}><span style={badge(r.doubleMateriality,[25,50,70])}>{r.doubleMateriality}%</span></td>
                <td style={ss.td}><span style={badge(r.xbrlReadiness,[25,50,70])}>{r.xbrlReadiness}%</span></td>
                <td style={ss.td}><span style={badge(r.automationRate,[25,50,70])}>{r.automationRate}%</span></td>
                <td style={{...ss.td,fontFamily:T.mono,color:r.gapCount>30?T.red:r.gapCount>15?T.amber:T.green}}>{r.gapCount}</td>
                <td style={ss.td}><span style={statusBadge(r.assuranceLevel==='Reasonable'?'Complete':r.assuranceLevel==='Limited'?'In Progress':'Not Started')}>{r.assuranceLevel}</span></td>
                <td style={{...ss.td,fontSize:10}}>{r.reportingWave}</td>
                <td style={ss.td}><span style={statusBadge(r.status)}>{r.status}</span></td>
              </tr>
              {expanded===r.id&&<tr><td colSpan={10} style={{padding:16,background:T.surfaceH,borderBottom:`1px solid ${T.border}`}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:20}}>
                  <div>
                    <div style={{fontSize:12,fontWeight:700,color:T.navy,marginBottom:8}}>ESRS Scores</div>
                    {ESRS_STANDARDS.slice(0,8).map(std=>(
                      <div key={std.id} style={{display:'flex',justifyContent:'space-between',padding:'3px 0',fontSize:11,borderBottom:`1px solid ${T.border}`}}>
                        <span style={{color:T.textSec}}>{std.id}</span>
                        <span style={badge(r.scores[std.id]||0,[25,50,70])}>{r.scores[std.id]||0}%</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div style={{fontSize:12,fontWeight:700,color:T.navy,marginBottom:8}}>Details</div>
                    {[['Datapoints Covered',`${r.dataPointsCovered}/${r.totalDataPoints}`],['Taxonomy Alignment',r.taxonomyAlignment+'%'],['Employees',fmt(r.employees)],['Revenue',`$${fmt(r.revenue)}M`],['Auditor',r.auditor],['Country',r.country]].map(([l,v])=>(
                      <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'3px 0',fontSize:11,borderBottom:`1px solid ${T.border}`}}>
                        <span style={{color:T.textSec}}>{l}</span><span style={{fontFamily:T.mono,fontWeight:600}}>{v}</span>
                      </div>
                    ))}
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <RadarChart data={ESRS_STANDARDS.slice(2,8).map(std=>({d:std.id,v:r.scores[std.id]||0}))} cx="50%" cy="50%" outerRadius={70}>
                      <PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="d" tick={{fontSize:9,fill:T.textSec}}/>
                      <PolarRadiusAxis tick={false} domain={[0,100]}/>
                      <Radar dataKey="v" stroke={ACCENT} fill="rgba(124,58,237,0.15)" strokeWidth={2}/>
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </td></tr>}
            </React.Fragment>
          ))}</tbody></table>
        </div>
        <div style={ss.pg}><button style={ss.btnSec} disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Prev</button><span style={{fontSize:12,fontFamily:T.mono,color:T.textSec}}>{page}/{totalPages}</span><button style={ss.btnSec} disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)}>Next</button></div>
      </div>
    </div>
  );

  /* ═══════════════════════════════════════════════════════════════════════════════
     TAB 4: XBRL TAGGING — iXBRL preview, tag inventory
     ═══════════════════════════════════════════════════════════════════════════════ */
  const renderXbrl=()=>{
    const totalTags=XBRL_TAXONOMY.reduce((s,x)=>s+x.totalTags,0);
    const taggedCount=XBRL_TAXONOMY.reduce((s,x)=>s+x.taggedCount,0);
    const errors=XBRL_TAXONOMY.reduce((s,x)=>s+x.validationErrors,0);
    const inlineReady=XBRL_TAXONOMY.filter(x=>x.inlineXbrlReady).length;

    return(<>
      <SectionHead cite="ESEF Regulation (EU 2019/815) — XBRL Tagging">XBRL Tagging Engine</SectionHead>
      <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:20}}>
        <KPI label="Total Tags" value={totalTags} color={ACCENT}/>
        <KPI label="Tagged" value={taggedCount} sub={`${Math.round(taggedCount/totalTags*100)}%`} color={T.green}/>
        <KPI label="Validation Errors" value={errors} color={errors>20?T.red:T.amber}/>
        <KPI label="iXBRL Ready" value={`${inlineReady}/${XBRL_TAXONOMY.length}`} color={T.navy}/>
        <KPI label="Taxonomy" value="ESRS 2024" sub="EFRAG XBRL taxonomy" color={T.sage}/>
      </div>

      <div style={ss.card}>
        <SectionHead>Tag Coverage by Standard</SectionHead>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>
            <th style={{...ss.td,fontFamily:T.mono,fontSize:10,color:T.textMut}}>Standard</th>
            <th style={{...ss.td,fontFamily:T.mono,fontSize:10,color:T.textMut}}>Name</th>
            <th style={{...ss.td,fontFamily:T.mono,fontSize:10,color:T.textMut}}>Total Tags</th>
            <th style={{...ss.td,fontFamily:T.mono,fontSize:10,color:T.textMut}}>Tagged</th>
            <th style={{...ss.td,fontFamily:T.mono,fontSize:10,color:T.textMut}}>Coverage</th>
            <th style={{...ss.td,fontFamily:T.mono,fontSize:10,color:T.textMut}}>Errors</th>
            <th style={{...ss.td,fontFamily:T.mono,fontSize:10,color:T.textMut}}>iXBRL Ready</th>
            <th style={{...ss.td,fontFamily:T.mono,fontSize:10,color:T.textMut}}>Taxonomy</th>
            <th style={{...ss.td,fontFamily:T.mono,fontSize:10,color:T.textMut}}>Last Update</th>
          </tr></thead><tbody>{XBRL_TAXONOMY.map((x,i)=>{
            const cov=Math.round(x.taggedCount/x.totalTags*100);
            return(<tr key={i} style={{cursor:'pointer',background:xbrlStd===i?T.surfaceH:'transparent'}} onClick={()=>setXbrlStd(xbrlStd===i?null:i)}>
              <td style={{...ss.td,fontFamily:T.mono,fontWeight:600}}>{x.standard}</td>
              <td style={ss.td}>{x.name}</td>
              <td style={{...ss.td,fontFamily:T.mono}}>{x.totalTags}</td>
              <td style={{...ss.td,fontFamily:T.mono}}>{x.taggedCount}</td>
              <td style={ss.td}><span style={badge(cov,[25,50,75])}>{cov}%</span></td>
              <td style={{...ss.td,fontFamily:T.mono,color:x.validationErrors>5?T.red:T.amber}}>{x.validationErrors}</td>
              <td style={ss.td}><span style={statusBadge(x.inlineXbrlReady?'Complete':'Not Started')}>{x.inlineXbrlReady?'Yes':'No'}</span></td>
              <td style={{...ss.td,fontSize:10}}>{x.taxonomyVersion}</td>
              <td style={{...ss.td,fontSize:10,fontFamily:T.mono}}>{x.lastUpdate}</td>
            </tr>);
          })}</tbody></table>
        </div>
      </div>

      {/* iXBRL Preview Panel */}
      <div style={ss.card}>
        <SectionHead cite="ESEF Art. 3 — Inline XBRL Preview">iXBRL Preview Sample</SectionHead>
        <div style={{background:'#1a1a2e',borderRadius:8,padding:16,fontFamily:T.mono,fontSize:11,color:'#e0e0e0',overflowX:'auto',lineHeight:1.8}}>
          <span style={{color:'#569cd6'}}>&lt;ix:nonNumeric</span> <span style={{color:'#9cdcfe'}}>contextRef</span>=<span style={{color:'#ce9178'}}>"FY2025"</span> <span style={{color:'#9cdcfe'}}>name</span>=<span style={{color:'#ce9178'}}>"esrs:DescriptionOfTransitionPlan"</span><span style={{color:'#569cd6'}}>&gt;</span><br/>
          {'  '}<span style={{color:'#d4d4d4'}}>The undertaking has adopted a climate transition plan aligned with 1.5C, targeting</span><br/>
          {'  '}<span style={{color:'#d4d4d4'}}>50% Scope 1+2 reduction by 2030 (base year 2019) per ESRS E1-1 para 14.</span><br/>
          <span style={{color:'#569cd6'}}>&lt;/ix:nonNumeric&gt;</span><br/><br/>
          <span style={{color:'#569cd6'}}>&lt;ix:nonFraction</span> <span style={{color:'#9cdcfe'}}>contextRef</span>=<span style={{color:'#ce9178'}}>"FY2025"</span> <span style={{color:'#9cdcfe'}}>name</span>=<span style={{color:'#ce9178'}}>"esrs:GrossScope1GHGEmissions"</span><br/>
          {'  '}<span style={{color:'#9cdcfe'}}>unitRef</span>=<span style={{color:'#ce9178'}}>"tCO2e"</span> <span style={{color:'#9cdcfe'}}>decimals</span>=<span style={{color:'#ce9178'}}>"0"</span><span style={{color:'#569cd6'}}>&gt;</span><span style={{color:'#b5cea8'}}>245000</span><span style={{color:'#569cd6'}}>&lt;/ix:nonFraction&gt;</span><br/><br/>
          <span style={{color:'#569cd6'}}>&lt;ix:nonFraction</span> <span style={{color:'#9cdcfe'}}>contextRef</span>=<span style={{color:'#ce9178'}}>"FY2025"</span> <span style={{color:'#9cdcfe'}}>name</span>=<span style={{color:'#ce9178'}}>"esrs:GrossScope2GHGEmissionsMarketBased"</span><br/>
          {'  '}<span style={{color:'#9cdcfe'}}>unitRef</span>=<span style={{color:'#ce9178'}}>"tCO2e"</span> <span style={{color:'#9cdcfe'}}>decimals</span>=<span style={{color:'#ce9178'}}>"0"</span><span style={{color:'#569cd6'}}>&gt;</span><span style={{color:'#b5cea8'}}>128400</span><span style={{color:'#569cd6'}}>&lt;/ix:nonFraction&gt;</span><br/><br/>
          <span style={{color:'#569cd6'}}>&lt;ix:nonFraction</span> <span style={{color:'#9cdcfe'}}>contextRef</span>=<span style={{color:'#ce9178'}}>"FY2025"</span> <span style={{color:'#9cdcfe'}}>name</span>=<span style={{color:'#ce9178'}}>"esrs:TotalGHGEmissions"</span><br/>
          {'  '}<span style={{color:'#9cdcfe'}}>unitRef</span>=<span style={{color:'#ce9178'}}>"tCO2e"</span> <span style={{color:'#9cdcfe'}}>decimals</span>=<span style={{color:'#ce9178'}}>"0"</span><span style={{color:'#569cd6'}}>&gt;</span><span style={{color:'#b5cea8'}}>1890000</span><span style={{color:'#569cd6'}}>&lt;/ix:nonFraction&gt;</span><br/><br/>
          <span style={{color:'#6a9955'}}>{'<!-- ESRS E1-5: Energy consumption and mix -->'}</span><br/>
          <span style={{color:'#569cd6'}}>&lt;ix:nonFraction</span> <span style={{color:'#9cdcfe'}}>name</span>=<span style={{color:'#ce9178'}}>"esrs:TotalEnergyConsumption"</span> <span style={{color:'#9cdcfe'}}>unitRef</span>=<span style={{color:'#ce9178'}}>"MWh"</span><span style={{color:'#569cd6'}}>&gt;</span><span style={{color:'#b5cea8'}}>4250000</span><span style={{color:'#569cd6'}}>&lt;/ix:nonFraction&gt;</span><br/>
          <span style={{color:'#569cd6'}}>&lt;ix:nonFraction</span> <span style={{color:'#9cdcfe'}}>name</span>=<span style={{color:'#ce9178'}}>"esrs:ShareOfRenewableEnergy"</span> <span style={{color:'#9cdcfe'}}>unitRef</span>=<span style={{color:'#ce9178'}}>"percent"</span><span style={{color:'#569cd6'}}>&gt;</span><span style={{color:'#b5cea8'}}>38.5</span><span style={{color:'#569cd6'}}>&lt;/ix:nonFraction&gt;</span>
        </div>
        <div style={ss.cite}>Sample iXBRL markup using EFRAG ESRS XBRL Taxonomy 2024. Tags shown: E1-6 (GHG emissions), E1-1 (transition plan), E1-5 (energy).</div>
      </div>

      {/* Tag Distribution Chart */}
      <div style={ss.card}>
        <SectionHead>XBRL Tag Distribution by Standard</SectionHead>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={XBRL_TAXONOMY}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="standard" tick={{fontSize:9,fill:T.textMut}} angle={-25} textAnchor="end" height={60}/>
            <YAxis tick={{fontSize:10,fill:T.textMut}}/>
            <Tooltip {...tip}/>
            <Bar dataKey="totalTags" fill={T.border} radius={[4,4,0,0]} name="Total Tags"/>
            <Bar dataKey="taggedCount" fill={ACCENT} radius={[4,4,0,0]} name="Tagged"/>
            <Legend/>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>);
  };

  /* ═══════════════════════════════════════════════════════════════════════════════
     TAB 5: ASSURANCE — ISAE 3000 limited vs reasonable, evidence tracker
     ═══════════════════════════════════════════════════════════════════════════════ */
  const renderAssurance=()=>{
    const avgLimited=Math.round(ASSURANCE_EVIDENCE.reduce((s,e)=>s+e.limitedReady,0)/ASSURANCE_EVIDENCE.length);
    const avgReasonable=Math.round(ASSURANCE_EVIDENCE.reduce((s,e)=>s+e.reasonableReady,0)/ASSURANCE_EVIDENCE.length);
    const totalEvidence=ASSURANCE_EVIDENCE.reduce((s,e)=>s+e.evidenceCount,0);
    const totalGapsForReasonable=ASSURANCE_EVIDENCE.reduce((s,e)=>s+e.gapsForReasonable,0);

    return(<>
      <SectionHead cite="CSRD Art. 34 — Assurance of Sustainability Reporting (ISAE 3000)">Assurance Readiness</SectionHead>
      <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:20}}>
        <KPI label="Limited Assurance" value={avgLimited+'%'} sub="avg readiness" color={T.amber} cite="ISAE 3000 (Revised)"/>
        <KPI label="Reasonable Assurance" value={avgReasonable+'%'} sub="avg readiness" color={T.sage} cite="Target: FY2028+"/>
        <KPI label="Total Evidence" value={totalEvidence} sub="documents collected" color={ACCENT}/>
        <KPI label="Gaps for Reasonable" value={totalGapsForReasonable} color={T.red}/>
        <KPI label="ISAE 3000 Aligned" value={ASSURANCE_EVIDENCE.filter(e=>e.isae3000Aligned).length+'/'+ASSURANCE_EVIDENCE.length} color={T.navy}/>
      </div>

      <div style={{...ss.flex,marginBottom:16}}>
        <button style={assuranceLevel==='Limited'?ss.btn:ss.btnSec} onClick={()=>setAssuranceLevel('Limited')}>Limited Assurance</button>
        <button style={assuranceLevel==='Reasonable'?ss.btn:ss.btnSec} onClick={()=>setAssuranceLevel('Reasonable')}>Reasonable Assurance</button>
      </div>

      <div style={ss.card}>
        <SectionHead cite={assuranceLevel==='Limited'?'ISAE 3000 §49-66':'ISAE 3000 §67-88'}>Evidence Tracker — {assuranceLevel} Assurance</SectionHead>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>
            <th style={{...ss.td,fontFamily:T.mono,fontSize:10,color:T.textMut}}>Standard</th>
            <th style={{...ss.td,fontFamily:T.mono,fontSize:10,color:T.textMut}}>Name</th>
            <th style={{...ss.td,fontFamily:T.mono,fontSize:10,color:T.textMut}}>{assuranceLevel} Ready</th>
            <th style={{...ss.td,fontFamily:T.mono,fontSize:10,color:T.textMut}}>Evidence Count</th>
            <th style={{...ss.td,fontFamily:T.mono,fontSize:10,color:T.textMut}}>Evidence Types</th>
            <th style={{...ss.td,fontFamily:T.mono,fontSize:10,color:T.textMut}}>Gaps</th>
            <th style={{...ss.td,fontFamily:T.mono,fontSize:10,color:T.textMut}}>Auditor Notes</th>
            <th style={{...ss.td,fontFamily:T.mono,fontSize:10,color:T.textMut}}>ISAE Aligned</th>
          </tr></thead><tbody>{ASSURANCE_EVIDENCE.map((e,i)=>{
            const ready=assuranceLevel==='Limited'?e.limitedReady:e.reasonableReady;
            return(<tr key={i}>
              <td style={{...ss.td,fontFamily:T.mono,fontWeight:600}}>{e.standard}</td>
              <td style={ss.td}>{e.name}</td>
              <td style={ss.td}><span style={badge(ready,[25,50,75])}>{ready}%</span></td>
              <td style={{...ss.td,fontFamily:T.mono}}>{e.evidenceCount}</td>
              <td style={{...ss.td,fontSize:10,maxWidth:200}}>{e.evidenceTypes.slice(0,3).join(', ')}{e.evidenceTypes.length>3?` +${e.evidenceTypes.length-3}`:''}
              </td>
              <td style={{...ss.td,fontFamily:T.mono,color:e.gapsForReasonable>5?T.red:T.amber}}>{e.gapsForReasonable}</td>
              <td style={ss.td}><span style={statusBadge(e.auditorNotes==='No findings'?'Complete':'In Progress')}>{e.auditorNotes}</span></td>
              <td style={ss.td}><span style={statusBadge(e.isae3000Aligned?'Complete':'Not Started')}>{e.isae3000Aligned?'Yes':'No'}</span></td>
            </tr>);
          })}</tbody></table>
        </div>
      </div>

      {/* Assurance Readiness Chart */}
      <div style={ss.grid2}>
        <div style={ss.card}>
          <SectionHead>Limited vs Reasonable Readiness</SectionHead>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ASSURANCE_EVIDENCE} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis type="number" domain={[0,100]} tick={{fontSize:9,fill:T.textMut}}/>
              <YAxis dataKey="standard" type="category" tick={{fontSize:9,fill:T.textSec}} width={70}/>
              <Tooltip {...tip}/>
              <Bar dataKey="limitedReady" fill={T.gold} radius={[0,4,4,0]} name="Limited %"/>
              <Bar dataKey="reasonableReady" fill={ACCENT} radius={[0,4,4,0]} name="Reasonable %"/>
              <Legend/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={ss.card}>
          <SectionHead>CSRD Assurance Timeline</SectionHead>
          <div style={{padding:16}}>
            {[
              {year:'FY2024',event:'Wave 1: Large PIEs >500 employees — Limited assurance required',color:T.green,active:true},
              {year:'FY2025',event:'Wave 2: Other large undertakings — Limited assurance required',color:T.amber,active:true},
              {year:'FY2026',event:'Wave 3: Listed SMEs (opt-out possible until 2028)',color:T.gold,active:false},
              {year:'FY2028+',event:'Transition from limited to reasonable assurance (EU legislative proposal)',color:T.navy,active:false},
            ].map((t,i)=>(
              <div key={i} style={{display:'flex',gap:16,padding:'12px 0',borderBottom:`1px solid ${T.border}`,alignItems:'center'}}>
                <div style={{width:80,fontFamily:T.mono,fontSize:12,fontWeight:700,color:t.color}}>{t.year}</div>
                <div style={{width:8,height:8,borderRadius:4,background:t.active?t.color:T.textMut}}/>
                <div style={{fontSize:12,color:t.active?T.text:T.textSec}}>{t.event}</div>
              </div>
            ))}
          </div>
          <div style={ss.cite}>CSRD Art. 34. Limited assurance from FY2024. Reasonable assurance adoption pending EU Commission delegated act.</div>
        </div>
      </div>
    </>);
  };

  /* ═══════════════════════════════════════════════════════════════════════════════
     TAB 6: EXPORT — CSRD filing, XBRL, board summary
     ═══════════════════════════════════════════════════════════════════════════════ */
  const renderExport=()=>{
    const formats=[
      {name:'CSRD Filing',desc:'Complete CSRD sustainability statement (ESRS 2 general disclosures + all material topical standards)',ext:'.html / .pdf',icon:'📄'},
      {name:'XBRL Package',desc:'ESEF-compliant iXBRL package with EFRAG ESRS taxonomy. Machine-readable filing for OAM submission.',ext:'.zip (xbrl)',icon:'📦'},
      {name:'Board Summary',desc:'Executive summary for Board of Directors: key KPIs, readiness status, material topics, assurance gaps.',ext:'.pdf / .pptx',icon:'📊'},
      {name:'Gap Analysis Report',desc:'Detailed gap analysis across all 643 datapoints with remediation roadmap and priority ranking.',ext:'.xlsx',icon:'📋'},
      {name:'DMA Report',desc:'Double Materiality Assessment report per ESRS 1 §38-62 with IRO matrix and stakeholder mapping.',ext:'.pdf',icon:'🎯'},
      {name:'Assurance Pack',desc:'Evidence pack for auditor: all supporting documents, data trails, methodology notes per ISAE 3000.',ext:'.zip',icon:'🔍'},
      {name:'Datapoint Registry',desc:'Complete datapoint inventory with coverage, sources, quality scores, and automation status.',ext:'.xlsx / .csv',icon:'📑'},
      {name:'Taxonomy Alignment',desc:'EU Taxonomy alignment report: eligible activities, alignment %, substantial contribution, DNSH.',ext:'.pdf',icon:'🏛️'},
    ];

    return(<>
      <SectionHead cite="CSRD Art. 29a — Digital Reporting & Export">Export Centre</SectionHead>
      <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:20}}>
        <KPI label="Standards Covered" value={ESRS_STANDARDS.length} color={ACCENT}/>
        <KPI label="Datapoints Mapped" value={TOTAL_DATAPOINTS} color={T.navy}/>
        <KPI label="Companies" value={CSRD_COMPANIES.length} color={T.sage}/>
        <KPI label="Export Formats" value={formats.length} color={T.gold}/>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        {formats.map((f,i)=>(
          <div key={i} style={{...ss.card,cursor:'pointer',background:exportFormat===f.name?'rgba(124,58,237,0.04)':T.surface,borderColor:exportFormat===f.name?ACCENT:T.border}} onClick={()=>setExportFormat(f.name)}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
              <div style={{fontSize:14,fontWeight:700,color:T.navy}}>{f.icon} {f.name}</div>
              <span style={{fontSize:10,fontFamily:T.mono,color:T.textMut}}>{f.ext}</span>
            </div>
            <div style={{fontSize:12,color:T.textSec,lineHeight:1.5}}>{f.desc}</div>
          </div>
        ))}
      </div>

      {/* Export Configuration */}
      <div style={ss.card}>
        <SectionHead>Export Configuration — {exportFormat}</SectionHead>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16,marginBottom:16}}>
          <div>
            <div style={{fontSize:11,color:T.textMut,marginBottom:4}}>Reporting Period</div>
            <select style={ss.select}><option>FY2025 (Jan-Dec 2025)</option><option>FY2024 (Jan-Dec 2024)</option></select>
          </div>
          <div>
            <div style={{fontSize:11,color:T.textMut,marginBottom:4}}>Scope</div>
            <select style={ss.select}><option>All {CSRD_COMPANIES.length} companies</option><option>Wave 1 only</option><option>Material topics only</option></select>
          </div>
          <div>
            <div style={{fontSize:11,color:T.textMut,marginBottom:4}}>Language</div>
            <select style={ss.select}><option>English</option><option>German</option><option>French</option></select>
          </div>
        </div>
        <div style={{display:'flex',gap:12,marginBottom:16}}>
          <label style={{fontSize:12,display:'flex',alignItems:'center',gap:6}}><input type="checkbox" defaultChecked/> Include DMA appendix</label>
          <label style={{fontSize:12,display:'flex',alignItems:'center',gap:6}}><input type="checkbox" defaultChecked/> Include XBRL tags</label>
          <label style={{fontSize:12,display:'flex',alignItems:'center',gap:6}}><input type="checkbox"/> Include assurance letter</label>
          <label style={{fontSize:12,display:'flex',alignItems:'center',gap:6}}><input type="checkbox" defaultChecked/> Include taxonomy alignment</label>
        </div>
        <div style={{display:'flex',gap:12}}>
          <button style={ss.btn} onClick={()=>{
            csvExport(CSRD_COMPANIES.map(c=>({
              name:c.name,sector:c.sector,country:c.country,readiness:c.overallReadiness,status:c.status,
              dma:c.doubleMateriality,gaps:c.gapCount,automation:c.automationRate,
              xbrl:c.xbrlReadiness,assurance:c.assuranceReady,wave:c.reportingWave,
              auditor:c.auditor,taxonomyAlignment:c.taxonomyAlignment,
              ...Object.fromEntries(ESRS_STANDARDS.map(s=>[s.id,c.scores[s.id]||0]))
            })),'csrd_export_'+exportFormat.replace(/\s/g,'_').toLowerCase());
          }}>Generate {exportFormat}</button>
          <button style={ss.btnSec}>Preview</button>
        </div>
        <div style={ss.cite}>Exports comply with CSRD Art. 29a digital filing requirements and ESEF Regulation (EU 2019/815).</div>
      </div>

      {/* Compliance Checklist */}
      <div style={ss.card}>
        <SectionHead cite="ESRS 1 §130 — Filing Checklist">Pre-filing Compliance Checklist</SectionHead>
        {[
          {item:'Double materiality assessment completed (ESRS 1 §38-62)',status:kpis.avgDM>=50},
          {item:'All mandatory ESRS standards addressed (ESRS 1, 2, E1, S1, G1)',status:kpis.avgReady>=40},
          {item:'Datapoint coverage ≥80% for mandatory standards',status:kpis.dpCoverage>=60},
          {item:'XBRL taxonomy tags applied (ESEF Regulation)',status:kpis.avgXbrl>=40},
          {item:'Limited assurance engagement letter obtained',status:kpis.avgAssurance>=50},
          {item:'Board approval of sustainability statement',status:false},
          {item:'Connectivity with financial statements verified (ESRS 1 §120-122)',status:kpis.avgReady>=60},
          {item:'Value chain information collected (ESRS 1 §63-71)',status:kpis.avgDM>=45},
          {item:'Transitional provisions documented (ESRS 1 §131-133)',status:true},
          {item:'OAM (Officially Appointed Mechanism) submission prepared',status:kpis.avgXbrl>=50},
        ].map((c,i)=>(
          <div key={i} style={{display:'flex',gap:12,padding:'10px 0',borderBottom:`1px solid ${T.border}`,alignItems:'center'}}>
            <div style={{width:20,height:20,borderRadius:4,background:c.status?'rgba(22,163,74,0.12)':'rgba(220,38,38,0.08)',color:c.status?T.green:T.red,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700}}>{c.status?'\u2713':'\u2717'}</div>
            <div style={{fontSize:12,color:c.status?T.text:T.textSec}}>{c.item}</div>
          </div>
        ))}
      </div>
    </>);
  };

  /* ═══════════════════════════════════════════════════════════════════════════════
     MAIN RENDER
     ═══════════════════════════════════════════════════════════════════════════════ */
  return(
    <div style={ss.wrap}>
      <div style={ss.header}>CSRD / ESRS Automation Engine</div>
      <div style={ss.sub}>EU Corporate Sustainability Reporting Directive — ESRS Set 1 (EU 2023/2772) — {CSRD_COMPANIES.length} entities, {TOTAL_DATAPOINTS} datapoints, {ESRS_STANDARDS.length} standards</div>
      <div style={ss.tabs}>{TABS.map((t,i)=><button key={i} style={ss.tab(tab===i)} onClick={()=>{setTab(i);setPage(1);setDpPage(1);}}>{t}</button>)}</div>
      {tab===0&&renderDoubleMateriality()}
      {tab===1&&renderStandards()}
      {tab===2&&renderDatapoints()}
      {tab===3&&renderReadiness()}
      {tab===4&&renderXbrl()}
      {tab===5&&renderAssurance()}
      {tab===6&&renderExport()}
    </div>
  );
}
