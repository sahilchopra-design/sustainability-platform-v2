// EP-AH3 — ISSB Disclosure Engine
// Route: /issb-disclosure
// Framework: IFRS S1 (General Sustainability) + IFRS S2 (Climate) + SASB Industry Standards
// Reference: IFRS Foundation, ISSB Standards effective Jan 2024
import React,{useState,useMemo,useCallback} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,PieChart,Pie,Cell,AreaChart,Area,LineChart,Line,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis,Legend,ScatterChart,Scatter,ZAxis} from 'recharts';
import {REGULATORY_THRESHOLDS,NGFS_SCENARIOS,SECTOR_BENCHMARKS} from '../../../data/referenceData';
import { useCarbonCredit } from '../../../context/CarbonCreditContext';

/* ═══════════════════════════════════════════════════════════════════════════════
   THEME + HELPERS
   ═══════════════════════════════════════════════════════════════════════════════ */
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const ACCENT='#7c3aed';
const fmt=v=>typeof v==='number'?v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed?v.toFixed(1):v:v;
const tip={contentStyle:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,fontSize:11,fontFamily:T.font},labelStyle:{color:T.textSec,fontFamily:T.mono,fontSize:10}};
const PIECLRS=[ACCENT,T.navy,T.gold,T.sage,T.amber,T.green,T.red,'#0891b2','#be185d','#ea580c'];
const PAGE_SIZE=15;

const badge=(v,th)=>{const[lo,mid,hi]=th;const bg=v>=hi?'rgba(22,163,74,0.12)':v>=mid?'rgba(197,169,106,0.12)':v>=lo?'rgba(217,119,6,0.12)':'rgba(220,38,38,0.12)';const c=v>=hi?T.green:v>=mid?T.gold:v>=lo?T.amber:T.red;return{background:bg,color:c,padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600,fontFamily:T.mono};};
const statusBadge=(s)=>{const m={'Complete':{bg:'rgba(22,163,74,0.12)',c:T.green},'In Progress':{bg:'rgba(217,119,6,0.12)',c:T.amber},'Not Started':{bg:'rgba(220,38,38,0.12)',c:T.red},'Mandatory':{bg:'rgba(124,58,237,0.1)',c:ACCENT},'Voluntary':{bg:'rgba(197,169,106,0.12)',c:T.gold},'Stayed':{bg:'rgba(220,38,38,0.08)',c:T.red},'Consultation':{bg:'rgba(90,138,106,0.1)',c:T.sage}};const st=m[s]||m['In Progress'];return{background:st.bg,color:st.c,padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600};};
const csvExport=(rows,name)=>{if(!rows.length)return;const h=Object.keys(rows[0]);const csv=[h.join(','),...rows.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=name+'.csv';a.click();URL.revokeObjectURL(u);};

const TABS=['IFRS S1 Requirements','IFRS S2 Climate','Scenario Analysis','Industry Metrics','Gap Analysis','Connectivity','Export'];

const KPI=({label,value,sub,color,cite})=>(
  <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:'16px 20px',flex:'1 1 180px',minWidth:150}}>
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
   IFRS S1 — 4 PILLARS WITH ALL DISCLOSURE REQUIREMENTS
   ═══════════════════════════════════════════════════════════════════════════════ */
const S1_PILLARS=[
  {pillar:'Governance',para:'IFRS S1 para 26-27',score:78,color:T.navy,
    reqs:[
      {code:'S1-GOV-a',label:'Governance body(ies) or individual(s) responsible for oversight of sustainability-related risks and opportunities',status:'Complete',source:'Board Risk Committee Charter',quality:90,para:'S1 §26(a)'},
      {code:'S1-GOV-b',label:'How governance body ensures appropriate skills and competencies',status:'Complete',source:'Board Skills Matrix',quality:85,para:'S1 §26(a)(i)'},
      {code:'S1-GOV-c',label:'How and how often the body is informed about sustainability matters',status:'In Progress',source:'Board Calendar & Agenda Review',quality:72,para:'S1 §26(a)(ii)'},
      {code:'S1-GOV-d',label:'How the body considers sustainability matters in strategy oversight',status:'Complete',source:'Strategic Planning Integration',quality:88,para:'S1 §26(a)(iii)'},
      {code:'S1-GOV-e',label:'How the body sets targets and monitors progress',status:'In Progress',source:'Target Setting Framework',quality:65,para:'S1 §26(a)(iv)'},
      {code:'S1-GOV-f',label:'Managements role in governance processes — assessment and management',status:'Complete',source:'CEO Sustainability Report',quality:82,para:'S1 §27(a)'},
      {code:'S1-GOV-g',label:'Whether and how management reports to the governance body',status:'Complete',source:'Management Reporting Protocol',quality:80,para:'S1 §27(b)'},
    ]},
  {pillar:'Strategy',para:'IFRS S1 para 28-35',score:62,color:ACCENT,
    reqs:[
      {code:'S1-STR-a',label:'Sustainability-related risks and opportunities that could reasonably be expected to affect prospects',status:'Complete',source:'Enterprise Risk Register',quality:88,para:'S1 §28'},
      {code:'S1-STR-b',label:'Current and anticipated effects on business model and value chain',status:'In Progress',source:'Value Chain Analysis Module',quality:65,para:'S1 §29'},
      {code:'S1-STR-c',label:'Effects on strategy and decision-making',status:'In Progress',source:'Strategic Planning Integration',quality:60,para:'S1 §30'},
      {code:'S1-STR-d',label:'Effects on financial position, financial performance and cash flows',status:'In Progress',source:'Financial Impact Assessment',quality:55,para:'S1 §31'},
      {code:'S1-STR-e',label:'Resilience of strategy — scenario analysis',status:'Not Started',source:'Scenario Analysis Engine (Tab 3)',quality:30,para:'S1 §35'},
      {code:'S1-STR-f',label:'Trade-offs between sustainability-related risks and opportunities',status:'In Progress',source:'Trade-off Analysis Framework',quality:50,para:'S1 §32'},
      {code:'S1-STR-g',label:'How entity has responded to sustainability matters (actions taken)',status:'In Progress',source:'Action Plan Registry',quality:58,para:'S1 §33'},
      {code:'S1-STR-h',label:'Planned changes to business model, CapEx, financing',status:'Not Started',source:'CapEx Planning Module',quality:25,para:'S1 §34'},
    ]},
  {pillar:'Risk Management',para:'IFRS S1 para 36-42',score:71,color:T.sage,
    reqs:[
      {code:'S1-RM-a',label:'Processes to identify sustainability-related risks and opportunities',status:'Complete',source:'Enterprise Risk Management Framework',quality:82,para:'S1 §36'},
      {code:'S1-RM-b',label:'Processes to assess, prioritize and monitor risks',status:'Complete',source:'Risk Prioritization Matrix',quality:78,para:'S1 §37'},
      {code:'S1-RM-c',label:'Processes to manage/mitigate risks — how decisions are made',status:'In Progress',source:'Risk Mitigation Plans',quality:62,para:'S1 §38'},
      {code:'S1-RM-d',label:'Integration of sustainability risk management into overall risk management',status:'In Progress',source:'ERM Integration Project',quality:55,para:'S1 §39'},
      {code:'S1-RM-e',label:'Processes to identify sustainability-related opportunities',status:'In Progress',source:'Opportunity Assessment Framework',quality:60,para:'S1 §40'},
      {code:'S1-RM-f',label:'Processes to assess and prioritize opportunities',status:'Not Started',source:'Opportunity Prioritization',quality:30,para:'S1 §41'},
    ]},
  {pillar:'Metrics & Targets',para:'IFRS S1 para 43-53',score:54,color:T.gold,
    reqs:[
      {code:'S1-MT-a',label:'Metrics used to measure and monitor sustainability risks/opportunities',status:'In Progress',source:'ESG Data Platform',quality:68,para:'S1 §43'},
      {code:'S1-MT-b',label:'Cross-industry metric categories (IFRS S1 Appendix B)',status:'In Progress',source:'Cross-Industry Metrics Module',quality:55,para:'S1 §44'},
      {code:'S1-MT-c',label:'Industry-based metrics (SASB Standards)',status:'Not Started',source:'SASB Module (Tab 4)',quality:20,para:'S1 §45'},
      {code:'S1-MT-d',label:'Targets set and progress against targets',status:'Not Started',source:'Targets & Commitments Registry',quality:15,para:'S1 §46'},
      {code:'S1-MT-e',label:'Whether targets are absolute or intensity-based',status:'Not Started',source:'Target Classification',quality:10,para:'S1 §47'},
      {code:'S1-MT-f',label:'Time period over which targets apply',status:'Not Started',source:'Target Timeline Mapping',quality:12,para:'S1 §48'},
      {code:'S1-MT-g',label:'Base period and base values for measurement',status:'In Progress',source:'Baseline Data Repository',quality:45,para:'S1 §49'},
      {code:'S1-MT-h',label:'Milestones and interim targets',status:'Not Started',source:'Milestone Tracker',quality:8,para:'S1 §50'},
      {code:'S1-MT-i',label:'Performance against targets — current vs base period',status:'Not Started',source:'Performance Analytics',quality:15,para:'S1 §51'},
      {code:'S1-MT-j',label:'Analysis of trends or significant changes in metrics',status:'In Progress',source:'Trend Analysis Engine',quality:40,para:'S1 §52'},
    ]},
];

/* ═══════════════════════════════════════════════════════════════════════════════
   IFRS S2 — CLIMATE-SPECIFIC DISCLOSURE REQUIREMENTS
   ═══════════════════════════════════════════════════════════════════════════════ */
const S2_REQUIREMENTS=[
  {id:1,title:'Climate-related Governance',para:'IFRS S2 §5-9',tcfd:'Governance a/b',status:'Complete',score:85,module:'Board ESG Dashboard',
    disclosure:'Board oversight via Sustainability Committee (quarterly). CSO reports to CEO. Board-approved climate transition plan.',
    subItems:['Board/committee oversight of climate risks','Climate competence assessment','Frequency of climate briefings','Integration into strategic decisions','Performance metrics linked to climate']},
  {id:2,title:'Climate Strategy — Risks & Opportunities',para:'IFRS S2 §10-12',tcfd:'Strategy a/b',status:'In Progress',score:65,module:'Climate Risk Analytics',
    disclosure:'12 material climate risks identified across value chain. Transition risks: policy, technology, market. Physical risks: acute + chronic.',
    subItems:['Identified climate risks (transition + physical)','Identified climate opportunities','Time horizons for each risk/opportunity','Effects on business model','Effects on value chain']},
  {id:3,title:'Transition Plan',para:'IFRS S2 §14',tcfd:'Strategy b',status:'In Progress',score:55,module:'Transition Plan Builder',
    disclosure:'Transition plan aligned with 1.5C target. Net-zero commitment by 2050. Interim targets: 50% Scope 1+2 reduction by 2030.',
    subItems:['Key assumptions in transition plan','Dependencies on external factors','CapEx and OpEx commitments','Carbon pricing assumptions','Locked-in GHG emissions from assets']},
  {id:4,title:'Climate Scenario Analysis',para:'IFRS S2 §22',tcfd:'Strategy d',status:'Not Started',score:30,module:'Scenario Analysis Engine',
    disclosure:'Scenario analysis pending: NGFS Net Zero 2050 (1.5C), Delayed Transition (>2C), Current Policies (3C+).',
    subItems:['Scenario selection and rationale','Time horizons (2030, 2040, 2050)','Financial impact quantification','Resilience assessment','Key assumptions and limitations']},
  {id:5,title:'Physical Risk Assessment',para:'IFRS S2 §15-19',tcfd:'Risk Mgmt a',status:'In Progress',score:60,module:'Climate Physical Risk',
    disclosure:'Physical risk assessment using IPCC AR6 + geospatial data. Acute: cyclones, flooding, wildfire. Chronic: sea-level rise, heat stress.',
    subItems:['Acute physical risks identified','Chronic physical risks identified','Asset-level vulnerability assessment','Adaptation measures','Insurance and residual risk']},
  {id:6,title:'Transition Risk Assessment',para:'IFRS S2 §20-21',tcfd:'Risk Mgmt b',status:'In Progress',score:58,module:'Portfolio Climate VaR',
    disclosure:'Carbon price sensitivity analysis. Regulatory risk: EU ETS, CBAM. Technology risk: stranded assets. Market: demand shifts.',
    subItems:['Policy and legal risks','Technology risks','Market risks','Reputational risks','Carbon price exposure']},
  {id:7,title:'Climate Risk Management',para:'IFRS S2 §25-27',tcfd:'Risk Mgmt c',status:'Complete',score:75,module:'Enterprise Risk Management',
    disclosure:'Climate risks integrated into ERM framework. Quarterly monitoring. Risk appetite statements include climate KRIs.',
    subItems:['Risk identification processes','Risk assessment and prioritization','Risk mitigation strategies','Monitoring and reporting','Integration with overall risk management']},
  {id:8,title:'GHG Emissions — Scope 1 & 2',para:'IFRS S2 §29(a)',tcfd:'Metrics a',status:'In Progress',score:70,module:'GHG Accounting Engine',
    disclosure:'Scope 1: 245,000 tCO2e. Scope 2 location-based: 148,000 tCO2e. Scope 2 market-based: 128,400 tCO2e.',
    subItems:['Gross Scope 1 GHG emissions','Scope 2 location-based','Scope 2 market-based','Disaggregated by GHG type','Consolidation approach (equity/control)']},
  {id:9,title:'GHG Emissions — Scope 3',para:'IFRS S2 §29(b)',tcfd:'Metrics a',status:'In Progress',score:45,module:'Supply Chain Emissions',
    disclosure:'Scope 3: 1,890,000 tCO2e (15 categories). Phase-in relief applied for first reporting year per IFRS S2 para C4.',
    subItems:['Scope 3 categories reported','Material Scope 3 categories identified','Measurement methodology per category','Data quality assessment','Phase-in provisions applied (C4)']},
  {id:10,title:'Climate Targets',para:'IFRS S2 §33-37',tcfd:'Metrics b/c',status:'Not Started',score:20,module:'Targets & Net Zero Registry',
    disclosure:'Targets pending: SBTi 1.5C-aligned near-term (2030) + long-term (2050) net-zero.',
    subItems:['GHG emissions reduction targets','Target scope (S1/S2/S3)','Whether SBTi validated','Base year and base emissions','Carbon credits/offsets approach']},
  {id:11,title:'Industry-specific Metrics',para:'IFRS S2 §32, App B',tcfd:'Metrics d',status:'Not Started',score:15,module:'SASB Industry Metrics',
    disclosure:'Industry-specific metrics per SASB Standards pending integration.',
    subItems:['Industry identified per SASB mapping','Material metrics selected','Data collection approach','Peer comparison','Historical trend data']},
  {id:12,title:'Internal Carbon Pricing',para:'IFRS S2 §31',tcfd:'Metrics e',status:'In Progress',score:50,module:'Carbon Pricing Engine',
    disclosure:'Shadow carbon price: $85/tCO2e applied to investment decisions. Implicit price from abatement costs: $120/tCO2e.',
    subItems:['Whether internal carbon price used','Carbon price per tCO2e','How price informs decisions','Scope of application','Review and update frequency']},
];

/* ═══════════════════════════════════════════════════════════════════════════════
   NGFS SCENARIOS FOR SCENARIO ANALYSIS TAB
   ═══════════════════════════════════════════════════════════════════════════════ */
const SCENARIO_SET=[
  {id:'nz2050',name:'Net Zero 2050',temp:'1.5°C',source:'NGFS Phase IV',type:'Orderly',carbonPrice2030:130,carbonPrice2050:250,gdpImpact:-1.5,physicalDamage:'Low',transitionCost:'High',
    desc:'Immediate and ambitious policy action. Carbon price rises rapidly. Renewable energy dominates by 2040. Stranded fossil fuel assets.',
    impacts:[{sector:'Energy',revenue:-25,cost:+15,capex:+40},{sector:'Materials',revenue:-12,cost:+20,capex:+25},{sector:'Financials',revenue:-5,cost:+8,capex:+5},{sector:'Technology',revenue:+10,cost:+3,capex:+15},{sector:'Utilities',revenue:-15,cost:+30,capex:+50}]},
  {id:'delayed',name:'Delayed Transition',temp:'>2°C',source:'NGFS Phase IV',type:'Disorderly',carbonPrice2030:45,carbonPrice2050:350,gdpImpact:-3.5,physicalDamage:'Medium',transitionCost:'Very High',
    desc:'Policy action delayed until 2030, then rapid catch-up. Disorderly transition with economic shock. Higher costs from delayed action.',
    impacts:[{sector:'Energy',revenue:-35,cost:+25,capex:+55},{sector:'Materials',revenue:-20,cost:+30,capex:+40},{sector:'Financials',revenue:-12,cost:+15,capex:+8},{sector:'Technology',revenue:+5,cost:+8,capex:+20},{sector:'Utilities',revenue:-25,cost:+45,capex:+65}]},
  {id:'curpol',name:'Current Policies',temp:'3°C+',source:'NGFS Phase IV',type:'Hot house',carbonPrice2030:25,carbonPrice2050:40,gdpImpact:-8.0,physicalDamage:'Very High',transitionCost:'Low',
    desc:'No new climate policies. Physical risks escalate dramatically. Severe GDP impact from natural disasters, productivity loss, sea-level rise.',
    impacts:[{sector:'Energy',revenue:-5,cost:+5,capex:+10},{sector:'Materials',revenue:-8,cost:+15,capex:+8},{sector:'Financials',revenue:-20,cost:+25,capex:+3},{sector:'Technology',revenue:-3,cost:+5,capex:+5},{sector:'Utilities',revenue:-30,cost:+35,capex:+20}]},
  {id:'below2',name:'Below 2°C',temp:'1.7°C',source:'NGFS Phase IV',type:'Orderly',carbonPrice2030:90,carbonPrice2050:200,gdpImpact:-2.0,physicalDamage:'Low-Medium',transitionCost:'Medium-High',
    desc:'Gradual policy tightening. Carbon price rises steadily. Balanced transition with moderate economic disruption.',
    impacts:[{sector:'Energy',revenue:-18,cost:+12,capex:+30},{sector:'Materials',revenue:-10,cost:+15,capex:+20},{sector:'Financials',revenue:-4,cost:+6,capex:+4},{sector:'Technology',revenue:+8,cost:+4,capex:+12},{sector:'Utilities',revenue:-12,cost:+22,capex:+40}]},
];

/* ═══════════════════════════════════════════════════════════════════════════════
   SASB INDUSTRY STANDARDS — 77 industries
   ═══════════════════════════════════════════════════════════════════════════════ */
const SASB_INDUSTRIES=(()=>{
  const industries=[
    {name:'Oil & Gas — Exploration & Production',sector:'Energy',metrics:14,material:['GHG Emissions','Air Quality','Water Management','Biodiversity','Reserves Valuation','Business Ethics']},
    {name:'Oil & Gas — Midstream',sector:'Energy',metrics:8,material:['GHG Emissions','Ecological Impacts','Competitive Behavior','Operational Safety']},
    {name:'Oil & Gas — Refining & Marketing',sector:'Energy',metrics:11,material:['GHG Emissions','Air Quality','Water Management','Hazardous Materials','Workforce Health & Safety']},
    {name:'Electric Utilities & Power Generators',sector:'Utilities',metrics:12,material:['GHG Emissions','Air Quality','Water Management','Coal Ash Management','Grid Resiliency','Energy Affordability']},
    {name:'Gas Utilities & Distributors',sector:'Utilities',metrics:7,material:['End-Use Efficiency','Integrity of Gas Delivery','Activity Metrics']},
    {name:'Solar Technology & Project Developers',sector:'Utilities',metrics:8,material:['Energy Management','Hazardous Materials','Ecological Impacts','Product End-of-Life']},
    {name:'Wind Technology & Project Developers',sector:'Utilities',metrics:6,material:['Ecological Impacts','Materials Sourcing','Community Relations']},
    {name:'Iron & Steel Producers',sector:'Materials',metrics:10,material:['GHG Emissions','Air Emissions','Energy Management','Water Management','Waste Management','Workforce Health & Safety']},
    {name:'Chemicals',sector:'Materials',metrics:12,material:['GHG Emissions','Air Quality','Energy Management','Water Management','Hazardous Waste','Product Design','Supply Chain']},
    {name:'Construction Materials',sector:'Materials',metrics:8,material:['GHG Emissions','Air Quality','Energy Management','Water Management','Biodiversity','Workforce Health & Safety']},
    {name:'Commercial Banks',sector:'Financials',metrics:9,material:['Integration of ESG Factors','Financial Inclusion','Data Security','Business Ethics','Systemic Risk Management']},
    {name:'Insurance',sector:'Financials',metrics:7,material:['Transparent Policies','Incorporation of ESG Factors','Physical Risk Exposure','Systemic Risk']},
    {name:'Investment Banking & Brokerage',sector:'Financials',metrics:8,material:['Integration of ESG Factors','Business Ethics','Employee Diversity','Systemic Risk','Data Security']},
    {name:'Asset Management & Custody',sector:'Financials',metrics:6,material:['Transparent Information','ESG Incorporation','Employee Diversity','Business Ethics']},
    {name:'Software & IT Services',sector:'Information Technology',metrics:7,material:['Environmental Footprint','Data Privacy','Data Security','Recruiting & Managing Workforce','IP & Content']},
    {name:'Hardware',sector:'Information Technology',metrics:9,material:['Product Lifecycle Management','Water Management','Supply Chain','Materials Sourcing','Data Security']},
    {name:'Semiconductors',sector:'Information Technology',metrics:8,material:['GHG Emissions','Energy Management','Water Management','Waste Management','Workforce Health & Safety','IP Protection']},
    {name:'Pharmaceuticals',sector:'Health Care',metrics:11,material:['Drug Safety','Access to Medicines','Counterfeit Drugs','Ethical Marketing','Employee Recruitment','Supply Chain','Business Ethics']},
    {name:'Biotechnology & Pharma',sector:'Health Care',metrics:9,material:['Drug Safety','Access to Medicines','Clinical Trials','Business Ethics','Employee Engagement']},
    {name:'Medical Devices & Supplies',sector:'Health Care',metrics:7,material:['Product Safety & Quality','Ethical Marketing','Supply Chain Management','Business Ethics']},
    {name:'Automobiles',sector:'Consumer Discretionary',metrics:10,material:['Product Lifecycle','Fuel Economy','Use-Phase Emissions','Materials Sourcing','Labor Practices','Supply Chain']},
    {name:'Auto Parts',sector:'Consumer Discretionary',metrics:7,material:['Energy Management','Waste Management','Product Safety','Materials Sourcing','Competitive Behavior']},
    {name:'Food & Beverage',sector:'Consumer Staples',metrics:12,material:['GHG Emissions','Energy Management','Water Management','Food Safety','Nutritional Content','Environmental & Social Impacts']},
    {name:'Household & Personal Products',sector:'Consumer Staples',metrics:8,material:['Water Management','Packaging','Environmental & Social Impacts','Product Quality']},
    {name:'Tobacco',sector:'Consumer Staples',metrics:5,material:['Marketing Practices','Product Impact','Supply Chain']},
    {name:'Airlines',sector:'Industrials',metrics:6,material:['GHG Emissions','Labor Practices','Competitive Behavior','Accident & Safety Management']},
    {name:'Air Freight & Logistics',sector:'Industrials',metrics:5,material:['GHG Emissions','Fleet Fuel Management','Supply Chain','Labor Practices']},
    {name:'Aerospace & Defense',sector:'Industrials',metrics:8,material:['Energy Management','Hazardous Materials','Data Security','Product Safety','Business Ethics']},
  ];
  return industries.map((ind,i)=>({...ind,id:i+1,avgScore:Math.round(20+sr(i*43)*60),companiesReporting:Math.round(5+sr(i*47)*45),dataAvailability:Math.round(15+sr(i*53)*80)}));
})();

/* ═══════════════════════════════════════════════════════════════════════════════
   GLOBAL ADOPTION DATA
   ═══════════════════════════════════════════════════════════════════════════════ */
const ADOPTION=[
  {jurisdiction:'New Zealand',status:'Mandatory',effective:'FY2023',standard:'XRB Aotearoa',scope:'Large listed + FMC'},
  {jurisdiction:'UK',status:'Mandatory',effective:'FY2025',standard:'UK SRS (ISSB-aligned)',scope:'Premium listed (TCFD to ISSB)'},
  {jurisdiction:'Australia',status:'Mandatory',effective:'FY2025',standard:'AASB S1/S2',scope:'Large entities (Group 1)'},
  {jurisdiction:'Singapore',status:'Mandatory',effective:'FY2025',standard:'SGX ISSB',scope:'SGX-listed large'},
  {jurisdiction:'Brazil',status:'Mandatory',effective:'FY2025',standard:'CVM ISSB',scope:'Listed companies'},
  {jurisdiction:'Nigeria',status:'Mandatory',effective:'FY2025',standard:'FRCN ISSB',scope:'Public interest entities'},
  {jurisdiction:'Hong Kong',status:'Mandatory',effective:'FY2025',standard:'HKEX ISSB',scope:'Large listed'},
  {jurisdiction:'Switzerland',status:'Mandatory',effective:'FY2024',standard:'Swiss ISSB',scope:'Large PIEs >500 emp'},
  {jurisdiction:'Japan',status:'Voluntary',effective:'FY2027 (mandatory)',standard:'SSBJ S1/S2',scope:'Prime Market listed'},
  {jurisdiction:'South Korea',status:'Voluntary',effective:'FY2030 (mandatory)',standard:'K-ISSB',scope:'KOSPI listed'},
  {jurisdiction:'Canada',status:'Consultation',effective:'TBD 2026',standard:'CSA ISSB',scope:'Reporting issuers'},
  {jurisdiction:'EU',status:'Mandatory',effective:'FY2024 (ESRS)',standard:'ESRS (interoperable)',scope:'CSRD-scope entities'},
  {jurisdiction:'India',status:'Mandatory',effective:'FY2024',standard:'SEBI BRSR Core',scope:'Top 1000 listed'},
  {jurisdiction:'South Africa',status:'Mandatory',effective:'FY2024',standard:'JSE ISSB',scope:'JSE-listed'},
  {jurisdiction:'Malaysia',status:'Voluntary',effective:'2025',standard:'Bursa ISSB',scope:'Bursa-listed'},
];

/* ═══════════════════════════════════════════════════════════════════════════════
   GAP ANALYSIS — current disclosure vs IFRS S1/S2 requirements
   ═══════════════════════════════════════════════════════════════════════════════ */
const GAP_ITEMS=(()=>{
  const allReqs=[...S1_PILLARS.flatMap(p=>p.reqs.map(r=>({...r,pillar:p.pillar,standard:'IFRS S1'}))),...S2_REQUIREMENTS.map(r=>({code:`S2-${r.id}`,label:r.title,status:r.status,quality:r.score,para:r.para,pillar:'Climate',standard:'IFRS S2',source:r.module}))];
  return allReqs.map((r,i)=>{
    const gap=r.status!=='Complete';
    const priority=r.quality<30?'Critical':r.quality<50?'High':r.quality<70?'Medium':'Low';
    return{...r,gap,priority,remediation:gap?`Address by Q${1+Math.floor(sr(i*61)*4)} 2026`:'N/A',effort:gap?(r.quality<30?'High':r.quality<50?'Medium':'Low'):'N/A',owner:['Sustainability Team','Finance','Legal','Operations','IT','Board Secretariat'][Math.floor(sr(i*67)*6)]};
  });
})();

/* ═══════════════════════════════════════════════════════════════════════════════
   CONNECTIVITY MAP — ISSB <> CSRD/SFDR/TCFD/CDP
   ═══════════════════════════════════════════════════════════════════════════════ */
const CONNECTIVITY=[
  {issb:'IFRS S1 Governance',csrd:'ESRS 2 GOV-1 to GOV-5',sfdr:'SFDR Art. 4(1)(a)',tcfd:'Governance a/b',cdp:'C1 Governance',alignment:85},
  {issb:'IFRS S1 Strategy',csrd:'ESRS 2 SBM-1 to SBM-3',sfdr:'SFDR Art. 4(1)(b)',tcfd:'Strategy a/b/c',cdp:'C2/C3 Risks & Strategy',alignment:72},
  {issb:'IFRS S1 Risk Mgmt',csrd:'ESRS 2 IRO-1/IRO-2',sfdr:'SFDR Art. 4(1)(c)',tcfd:'Risk Mgmt a/b/c',cdp:'C2 Risks & Opportunities',alignment:78},
  {issb:'IFRS S1 Metrics',csrd:'ESRS 2 + topical standards',sfdr:'SFDR RTS Annex I PAI',tcfd:'Metrics a/b/c',cdp:'C6-C9 Emissions/Energy',alignment:65},
  {issb:'IFRS S2 GHG Scope 1',csrd:'ESRS E1-6(a)',sfdr:'PAI #1',tcfd:'Metrics — Scope 1',cdp:'C6.1',alignment:95},
  {issb:'IFRS S2 GHG Scope 2',csrd:'ESRS E1-6(b)',sfdr:'PAI #2',tcfd:'Metrics — Scope 2',cdp:'C6.3',alignment:92},
  {issb:'IFRS S2 GHG Scope 3',csrd:'ESRS E1-6(c)',sfdr:'PAI #3',tcfd:'Metrics — Scope 3',cdp:'C6.5',alignment:70},
  {issb:'IFRS S2 Transition Plan',csrd:'ESRS E1-1',sfdr:'SFDR Art. 2(17)',tcfd:'Strategy — transition',cdp:'C3.1-C3.4',alignment:75},
  {issb:'IFRS S2 Scenario Analysis',csrd:'ESRS E1-9 (financial effects)',sfdr:'N/A',tcfd:'Strategy d',cdp:'C3.2',alignment:60},
  {issb:'IFRS S2 Carbon Pricing',csrd:'ESRS E1-8',sfdr:'PAI #4 (fossil fuel)',tcfd:'Metrics — carbon price',cdp:'C11',alignment:80},
  {issb:'IFRS S2 Industry Metrics',csrd:'Sector-specific ESRS (pending)',sfdr:'PAI indicators',tcfd:'Industry-specific',cdp:'Sector questionnaires',alignment:45},
  {issb:'IFRS S2 Targets',csrd:'ESRS E1-4',sfdr:'SFDR Art. 9(3)',tcfd:'Metrics b/c',cdp:'C4 Targets & Performance',alignment:82},
];

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════════ */
export default function IssbDisclosurePage(){
  const ccData = useCarbonCredit(); const ccReg = ccData.adaptForRegulatory();
  const[tab,setTab]=useState(0);
  const[selPillar,setSelPillar]=useState(null);
  const[selS2,setSelS2]=useState(null);
  const[selScenario,setSelScenario]=useState(0);
  const[sasbSearch,setSasbSearch]=useState('');
  const[sasbSector,setSasbSector]=useState('All');
  const[gapFilter,setGapFilter]=useState('All');
  const[exportFormat,setExportFormat]=useState('IFRS S1/S2 Report');

  const ss={
    wrap:{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:24,color:T.text},
    header:{fontSize:22,fontWeight:700,color:T.navy,marginBottom:4},
    sub:{fontSize:13,color:T.textSec,marginBottom:20},
    tabs:{display:'flex',gap:2,marginBottom:20,borderBottom:`2px solid ${T.border}`,paddingBottom:0,overflowX:'auto'},
    tab:(a)=>({padding:'10px 16px',fontSize:12,fontWeight:a?700:500,color:a?ACCENT:T.textSec,background:a?'rgba(124,58,237,0.06)':'transparent',border:'none',borderBottom:a?`2px solid ${ACCENT}`:'2px solid transparent',cursor:'pointer',fontFamily:T.font,marginBottom:-2,whiteSpace:'nowrap'}),
    card:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20,marginBottom:20},
    grid2:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20},
    grid3:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16,marginBottom:20},
    flex:{display:'flex',gap:12,flexWrap:'wrap',marginBottom:16,alignItems:'center'},
    td:{padding:'10px 12px',fontSize:12,borderBottom:`1px solid ${T.border}`,fontFamily:T.font},
    btn:{padding:'6px 16px',fontSize:12,fontWeight:600,color:T.surface,background:ACCENT,border:'none',borderRadius:6,cursor:'pointer',fontFamily:T.font},
    btnSec:{padding:'6px 16px',fontSize:12,fontWeight:600,color:T.textSec,background:'transparent',border:`1px solid ${T.border}`,borderRadius:6,cursor:'pointer',fontFamily:T.font},
    select:{padding:'8px 12px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:12,fontFamily:T.font,background:T.surface,color:T.text},
    input:{padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:13,fontFamily:T.font,background:T.surface,color:T.text,outline:'none',width:220},
    cite:{fontSize:9,color:T.textMut,fontFamily:T.mono,marginTop:4},
  };

  // ─── TAB 0: IFRS S1 ───
  const renderS1=()=>{
    const totalReqs=S1_PILLARS.reduce((s,p)=>s+p.reqs.length,0);
    const complete=S1_PILLARS.reduce((s,p)=>s+p.reqs.filter(r=>r.status==='Complete').length,0);
    const radarData=S1_PILLARS.map(p=>({pillar:p.pillar,score:p.score}));
    return(<>
      <SectionHead cite="IFRS S1 — General Requirements for Sustainability-related Financial Disclosures">IFRS S1 Requirements</SectionHead>
      <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:20}}>
        <KPI label="Pillars" value={4} color={ACCENT} cite="S1 §25"/>
        <KPI label="Requirements" value={totalReqs} color={T.navy}/>
        <KPI label="Complete" value={complete} sub={`${Math.round(complete/totalReqs*100)}%`} color={T.green}/>
        <KPI label="Avg Score" value={Math.round(S1_PILLARS.reduce((s,p)=>s+p.score,0)/4)+'%'} color={T.gold}/>
        <KPI label="Jurisdictions" value={ADOPTION.filter(a=>a.status==='Mandatory').length} sub="mandatory adoption" color={T.sage}/>
        <KPI label="CC Retirements" value={(ccReg.totalRetired ?? 0).toLocaleString()} sub="Scope disclosure (CC Engine)" color={'#059669'} cite="IFRS S2 §29(a)(vi)"/>
      </div>
      <div style={ss.grid2}>
        <div style={ss.card}>
          <SectionHead>Pillar Scores</SectionHead>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={90}>
              <PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="pillar" tick={{fontSize:11,fill:T.textSec}}/>
              <PolarRadiusAxis tick={{fontSize:9,fill:T.textMut}} domain={[0,100]}/>
              <Radar name="Score" dataKey="score" stroke={ACCENT} fill="rgba(124,58,237,0.15)" strokeWidth={2}/>
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div style={ss.card}>
          <SectionHead>Pillar Completion</SectionHead>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={S1_PILLARS.map(p=>({pillar:p.pillar,score:p.score,reqs:p.reqs.length,complete:p.reqs.filter(r=>r.status==='Complete').length}))}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="pillar" tick={{fontSize:10,fill:T.textMut}}/>
              <YAxis tick={{fontSize:10,fill:T.textMut}}/>
              <Tooltip {...tip}/>
              <Bar dataKey="complete" fill={T.green} name="Complete" stackId="a" radius={[0,0,0,0]}/>
              <Bar dataKey="reqs" fill={T.border} name="Total" radius={[4,4,0,0]}/>
              <Legend/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* Detailed Pillar Requirements */}
      {S1_PILLARS.map((p,pi)=>(
        <div key={pi} style={{...ss.card,borderLeft:`4px solid ${p.color}`,cursor:'pointer'}} onClick={()=>setSelPillar(selPillar===pi?null:pi)}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div><span style={{fontSize:14,fontWeight:700,color:p.color}}>{p.pillar}</span><span style={{fontSize:11,color:T.textMut,marginLeft:8,fontFamily:T.mono}}>{p.para}</span></div>
            <div style={{display:'flex',gap:12,alignItems:'center'}}>
              <span style={badge(p.score,[30,50,70])}>{p.score}%</span>
              <span style={{fontSize:11,fontFamily:T.mono,color:T.textSec}}>{p.reqs.length} requirements</span>
              <span style={{color:ACCENT}}>{selPillar===pi?'\u25B2':'\u25BC'}</span>
            </div>
          </div>
          {selPillar===pi&&(
            <div style={{marginTop:16}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>
                <th style={{...ss.td,fontFamily:T.mono,fontSize:10,color:T.textMut}}>Code</th>
                <th style={{...ss.td,fontFamily:T.mono,fontSize:10,color:T.textMut,minWidth:250}}>Requirement</th>
                <th style={{...ss.td,fontFamily:T.mono,fontSize:10,color:T.textMut}}>Status</th>
                <th style={{...ss.td,fontFamily:T.mono,fontSize:10,color:T.textMut}}>Source</th>
                <th style={{...ss.td,fontFamily:T.mono,fontSize:10,color:T.textMut}}>Quality</th>
                <th style={{...ss.td,fontFamily:T.mono,fontSize:10,color:T.textMut}}>Para</th>
              </tr></thead><tbody>{p.reqs.map((r,ri)=>(
                <tr key={ri}>
                  <td style={{...ss.td,fontFamily:T.mono,fontSize:10,fontWeight:600}}>{r.code}</td>
                  <td style={{...ss.td,fontSize:11}}>{r.label}</td>
                  <td style={ss.td}><span style={statusBadge(r.status)}>{r.status}</span></td>
                  <td style={{...ss.td,fontSize:10}}>{r.source}</td>
                  <td style={ss.td}><span style={badge(r.quality,[30,50,75])}>{r.quality}%</span></td>
                  <td style={{...ss.td,fontFamily:T.mono,fontSize:9,color:ACCENT}}>{r.para}</td>
                </tr>
              ))}</tbody></table>
            </div>
          )}
        </div>
      ))}
      {/* Global Adoption */}
      <div style={ss.card}>
        <SectionHead cite="ISSB Jurisdiction Adoption Tracker">Global ISSB Adoption Status</SectionHead>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>
            {['Jurisdiction','Standard','Status','Scope','Effective'].map(h=><th key={h} style={{...ss.td,fontFamily:T.mono,fontSize:10,color:T.textMut}}>{h}</th>)}
          </tr></thead><tbody>{ADOPTION.map((a,i)=>(
            <tr key={i}>
              <td style={{...ss.td,fontWeight:600}}>{a.jurisdiction}</td>
              <td style={{...ss.td,fontSize:11}}>{a.standard}</td>
              <td style={ss.td}><span style={statusBadge(a.status)}>{a.status}</span></td>
              <td style={{...ss.td,fontSize:11}}>{a.scope}</td>
              <td style={{...ss.td,fontFamily:T.mono,fontSize:11}}>{a.effective}</td>
            </tr>
          ))}</tbody></table>
        </div>
      </div>
    </>);
  };

  // ─── TAB 1: IFRS S2 Climate ───
  const renderS2=()=>{
    const avgScore=Math.round(S2_REQUIREMENTS.reduce((s,r)=>s+r.score,0)/ Math.max(1, S2_REQUIREMENTS.length));
    return(<>
      <SectionHead cite="IFRS S2 — Climate-related Disclosures">IFRS S2 Climate Requirements</SectionHead>
      <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:20}}>
        <KPI label="Requirements" value={S2_REQUIREMENTS.length} color={ACCENT}/>
        <KPI label="Complete" value={S2_REQUIREMENTS.filter(r=>r.status==='Complete').length} color={T.green}/>
        <KPI label="Avg Score" value={avgScore+'%'} color={avgScore>=60?T.sage:T.amber}/>
        <KPI label="TCFD Aligned" value="100%" sub="full alignment" color={T.navy}/>
      </div>
      {S2_REQUIREMENTS.map((r,i)=>(
        <div key={i} style={{...ss.card,borderLeft:`3px solid ${r.status==='Complete'?T.green:r.status==='In Progress'?T.amber:T.red}`,cursor:'pointer'}} onClick={()=>setSelS2(selS2===i?null:i)}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div><span style={{fontWeight:700,color:T.navy}}>{r.title}</span><span style={{fontSize:10,fontFamily:T.mono,color:T.textMut,marginLeft:8}}>{r.para}</span></div>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <span style={badge(r.score,[30,50,70])}>{r.score}%</span>
              <span style={statusBadge(r.status)}>{r.status}</span>
              <span style={{color:ACCENT,fontSize:12}}>{selS2===i?'\u25B2':'\u25BC'}</span>
            </div>
          </div>
          {selS2===i&&(
            <div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${T.border}`}}>
              <div style={{fontSize:12,color:T.textSec,lineHeight:1.6,marginBottom:12}}>{r.disclosure}</div>
              <div style={{display:'flex',gap:12,marginBottom:8}}>
                <span style={{fontSize:10,color:T.textMut}}>TCFD: <span style={{fontFamily:T.mono,color:ACCENT}}>{r.tcfd}</span></span>
                <span style={{fontSize:10,color:T.textMut}}>Module: <span style={{fontWeight:600}}>{r.module}</span></span>
              </div>
              <div style={{fontSize:11,fontWeight:600,color:T.navy,marginBottom:6}}>Sub-requirements:</div>
              {r.subItems.map((s,j)=>(
                <div key={j} style={{padding:'4px 0',fontSize:11,color:T.textSec,display:'flex',gap:6}}>
                  <span style={{color:ACCENT}}>-</span>{s}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </>);
  };

  // ─── TAB 2: Scenario Analysis ───
  const renderScenario=()=>{
    const sc=SCENARIO_SET[selScenario];
    const cpData=SCENARIO_SET.map(s=>({name:s.name,cp2030:s.carbonPrice2030,cp2050:s.carbonPrice2050}));
    return(<>
      <SectionHead cite="IFRS S2 §22 — Climate Resilience / Scenario Analysis">Scenario Analysis Tool</SectionHead>
      <div style={ss.flex}>
        {SCENARIO_SET.map((s,i)=><button key={i} style={selScenario===i?ss.btn:ss.btnSec} onClick={()=>setSelScenario(i)}>{s.name} ({s.temp})</button>)}
      </div>
      <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:20}}>
        <KPI label="Temperature" value={sc.temp} color={sc.temp==='1.5°C'?T.green:sc.temp==='>2°C'?T.amber:T.red}/>
        <KPI label="Carbon Price 2030" value={`$${sc.carbonPrice2030}`} sub="/tCO2e" color={T.navy}/>
        <KPI label="Carbon Price 2050" value={`$${sc.carbonPrice2050}`} sub="/tCO2e" color={ACCENT}/>
        <KPI label="GDP Impact" value={`${sc.gdpImpact}%`} color={sc.gdpImpact<-5?T.red:T.amber}/>
        <KPI label="Physical Damage" value={sc.physicalDamage} color={sc.physicalDamage==='Very High'?T.red:T.amber}/>
      </div>
      <div style={ss.card}>
        <SectionHead>Scenario Description — {sc.name}</SectionHead>
        <div style={{fontSize:12,color:T.textSec,lineHeight:1.6,marginBottom:12}}>{sc.desc}</div>
        <div style={{display:'flex',gap:8}}>
          <span style={statusBadge(sc.type==='Orderly'?'Complete':sc.type==='Disorderly'?'In Progress':'Not Started')}>{sc.type} Transition</span>
          <span style={{fontSize:10,fontFamily:T.mono,color:T.textMut}}>Source: {sc.source}</span>
        </div>
      </div>
      <div style={ss.grid2}>
        <div style={ss.card}>
          <SectionHead>Sector Impact — {sc.name}</SectionHead>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>
              {['Sector','Revenue Impact','Cost Impact','CapEx Impact'].map(h=><th key={h} style={{...ss.td,fontFamily:T.mono,fontSize:10,color:T.textMut}}>{h}</th>)}
            </tr></thead><tbody>{sc.impacts.map((imp,i)=>(
              <tr key={i}>
                <td style={{...ss.td,fontWeight:600}}>{imp.sector}</td>
                <td style={{...ss.td,fontFamily:T.mono,color:imp.revenue<0?T.red:T.green}}>{imp.revenue>0?'+':''}{imp.revenue}%</td>
                <td style={{...ss.td,fontFamily:T.mono,color:T.red}}>+{imp.cost}%</td>
                <td style={{...ss.td,fontFamily:T.mono,color:T.amber}}>+{imp.capex}%</td>
              </tr>
            ))}</tbody></table>
          </div>
        </div>
        <div style={ss.card}>
          <SectionHead>Carbon Price Comparison</SectionHead>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={cpData}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="name" tick={{fontSize:9,fill:T.textMut}}/>
              <YAxis tick={{fontSize:10,fill:T.textMut}} label={{value:'$/tCO2e',angle:-90,position:'left',fontSize:10}}/>
              <Tooltip {...tip}/>
              <Bar dataKey="cp2030" fill={T.amber} name="2030" radius={[4,4,0,0]}/>
              <Bar dataKey="cp2050" fill={ACCENT} name="2050" radius={[4,4,0,0]}/>
              <Legend/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>);
  };

  // ─── TAB 3: Industry Metrics (SASB) ───
  const renderSASB=()=>{
    const filtered=SASB_INDUSTRIES.filter(ind=>{
      if(sasbSearch&&!ind.name.toLowerCase().includes(sasbSearch.toLowerCase()))return false;
      if(sasbSector!=='All'&&ind.sector!==sasbSector)return false;
      return true;
    });
    const sasbSectors=['All',...new Set(SASB_INDUSTRIES.map(i=>i.sector))];
    return(<>
      <SectionHead cite="IFRS S2 §32, Appendix B — SASB Industry Standards">Industry-Specific Metrics (SASB)</SectionHead>
      <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:20}}>
        <KPI label="Industries" value={SASB_INDUSTRIES.length} sub="SASB Standards Board" color={ACCENT}/>
        <KPI label="Avg Score" value={Math.round(SASB_INDUSTRIES.reduce((s,i)=>s+i.avgScore,0)/ Math.max(1, SASB_INDUSTRIES.length))+'%'} color={T.gold}/>
        <KPI label="Avg Metrics" value={Math.round(SASB_INDUSTRIES.reduce((s,i)=>s+i.metrics,0)/ Math.max(1, SASB_INDUSTRIES.length))} sub="per industry" color={T.navy}/>
      </div>
      <div style={ss.flex}>
        <input style={ss.input} placeholder="Search industries..." value={sasbSearch} onChange={e=>setSasbSearch(e.target.value)}/>
        <select style={ss.select} value={sasbSector} onChange={e=>setSasbSector(e.target.value)}>{sasbSectors.map(s=><option key={s}>{s}</option>)}</select>
        <span style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>{filtered.length} industries</span>
      </div>
      <div style={ss.card}>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>
            {['Industry','Sector','Metrics','Material Topics','Score','Reporting','Data Avail.'].map(h=><th key={h} style={{...ss.td,fontFamily:T.mono,fontSize:10,color:T.textMut}}>{h}</th>)}
          </tr></thead><tbody>{filtered.map((ind,i)=>(
            <tr key={i}>
              <td style={{...ss.td,fontWeight:600,fontSize:11}}>{ind.name}</td>
              <td style={{...ss.td,fontSize:11}}>{ind.sector}</td>
              <td style={{...ss.td,fontFamily:T.mono}}>{ind.metrics}</td>
              <td style={{...ss.td,fontSize:10,maxWidth:200}}>{ind.material.slice(0,3).join(', ')}{ind.material.length>3?` +${ind.material.length-3}`:''}</td>
              <td style={ss.td}><span style={badge(ind.avgScore,[25,50,70])}>{ind.avgScore}%</span></td>
              <td style={{...ss.td,fontFamily:T.mono}}>{ind.companiesReporting}</td>
              <td style={ss.td}><span style={badge(ind.dataAvailability,[25,50,75])}>{ind.dataAvailability}%</span></td>
            </tr>
          ))}</tbody></table>
        </div>
      </div>
    </>);
  };

  // ─── TAB 4: Gap Analysis ───
  const renderGap=()=>{
    const filt=gapFilter==='All'?GAP_ITEMS:gapFilter==='Gaps'?GAP_ITEMS.filter(g=>g.gap):gapFilter==='Critical'?GAP_ITEMS.filter(g=>g.priority==='Critical'):GAP_ITEMS.filter(g=>!g.gap);
    const gapCount=GAP_ITEMS.filter(g=>g.gap).length;
    const critCount=GAP_ITEMS.filter(g=>g.priority==='Critical').length;
    const avgQuality=Math.round(GAP_ITEMS.reduce((s,g)=>s+g.quality,0)/ Math.max(1, GAP_ITEMS.length));
    return(<>
      <SectionHead cite="IFRS S1/S2 — Gap Analysis & Readiness Assessment">Gap Analysis</SectionHead>
      <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:20}}>
        <KPI label="Total Requirements" value={GAP_ITEMS.length} color={ACCENT}/>
        <KPI label="Gaps" value={gapCount} sub={`${Math.round(gapCount/ Math.max(1, GAP_ITEMS.length)*100)}%`} color={T.red}/>
        <KPI label="Critical" value={critCount} color={T.red}/>
        <KPI label="Avg Quality" value={avgQuality+'%'} color={avgQuality>=60?T.green:T.amber}/>
        <KPI label="Readiness" value={Math.round((1-gapCount/ Math.max(1, GAP_ITEMS.length))*100)+'%'} color={T.sage}/>
      </div>
      <div style={ss.flex}>
        {['All','Gaps','Critical','Complete'].map(f=><button key={f} style={gapFilter===f?ss.btn:ss.btnSec} onClick={()=>setGapFilter(f)}>{f}</button>)}
      </div>
      <div style={ss.card}>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>
            {['Code','Requirement','Standard','Pillar','Status','Quality','Priority','Remediation','Owner'].map(h=><th key={h} style={{...ss.td,fontFamily:T.mono,fontSize:10,color:T.textMut}}>{h}</th>)}
          </tr></thead><tbody>{filt.map((g,i)=>(
            <tr key={i} style={{background:g.priority==='Critical'?'rgba(220,38,38,0.03)':'transparent'}}>
              <td style={{...ss.td,fontFamily:T.mono,fontSize:10,fontWeight:600}}>{g.code}</td>
              <td style={{...ss.td,fontSize:11,maxWidth:200}}>{g.label}</td>
              <td style={{...ss.td,fontFamily:T.mono,fontSize:10,color:ACCENT}}>{g.standard}</td>
              <td style={{...ss.td,fontSize:11}}>{g.pillar}</td>
              <td style={ss.td}><span style={statusBadge(g.status)}>{g.status}</span></td>
              <td style={ss.td}><span style={badge(g.quality,[30,50,75])}>{g.quality}%</span></td>
              <td style={ss.td}><span style={{padding:'2px 8px',borderRadius:4,fontSize:10,fontWeight:600,background:g.priority==='Critical'?'rgba(220,38,38,0.12)':g.priority==='High'?'rgba(217,119,6,0.12)':'rgba(197,169,106,0.1)',color:g.priority==='Critical'?T.red:g.priority==='High'?T.amber:T.gold}}>{g.priority}</span></td>
              <td style={{...ss.td,fontSize:10}}>{g.remediation}</td>
              <td style={{...ss.td,fontSize:10}}>{g.owner}</td>
            </tr>
          ))}</tbody></table>
        </div>
      </div>
    </>);
  };

  // ─── TAB 5: Connectivity ───
  const renderConnectivity=()=>(
    <>
      <SectionHead cite="ISSB-CSRD Interoperability Guidance (EFRAG-ISSB, July 2024)">Interoperability Mapping</SectionHead>
      <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:20}}>
        <KPI label="Mappings" value={CONNECTIVITY.length} color={ACCENT}/>
        <KPI label="Avg Alignment" value={Math.round(CONNECTIVITY.reduce((s,c)=>s+c.alignment,0)/ Math.max(1, CONNECTIVITY.length))+'%'} color={T.sage}/>
        <KPI label="Frameworks" value={5} sub="ISSB, CSRD, SFDR, TCFD, CDP" color={T.navy}/>
      </div>
      <div style={ss.card}>
        <SectionHead>ISSB to CSRD / SFDR / TCFD / CDP Connectivity</SectionHead>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>
            {['ISSB Requirement','CSRD/ESRS','SFDR','TCFD','CDP','Alignment'].map(h=><th key={h} style={{...ss.td,fontFamily:T.mono,fontSize:10,color:T.textMut}}>{h}</th>)}
          </tr></thead><tbody>{CONNECTIVITY.map((c,i)=>(
            <tr key={i}>
              <td style={{...ss.td,fontWeight:600,fontSize:11}}>{c.issb}</td>
              <td style={{...ss.td,fontSize:10,fontFamily:T.mono}}>{c.csrd}</td>
              <td style={{...ss.td,fontSize:10}}>{c.sfdr}</td>
              <td style={{...ss.td,fontSize:10}}>{c.tcfd}</td>
              <td style={{...ss.td,fontSize:10}}>{c.cdp}</td>
              <td style={ss.td}><span style={badge(c.alignment,[40,60,80])}>{c.alignment}%</span></td>
            </tr>
          ))}</tbody></table>
        </div>
        <div style={ss.cite}>Interoperability mapping based on EFRAG-ISSB joint guidance (July 2024) and TCFD-ISSB transition recommendations.</div>
      </div>
      {/* Alignment Chart */}
      <div style={ss.card}>
        <SectionHead>Framework Alignment Score</SectionHead>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={CONNECTIVITY} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis type="number" domain={[0,100]} tick={{fontSize:9,fill:T.textMut}}/>
            <YAxis dataKey="issb" type="category" tick={{fontSize:8,fill:T.textSec}} width={150}/>
            <Tooltip {...tip}/><Bar dataKey="alignment" fill={ACCENT} radius={[0,4,4,0]} name="Alignment %"/>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );

  // ─── TAB 6: Export ───
  const renderExport=()=>(
    <>
      <SectionHead cite="IFRS S1 §72 — Reporting Format">Export Centre</SectionHead>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        {[
          {name:'IFRS S1/S2 Report',desc:'Complete IFRS S1 + S2 annual report format with all 4 pillars and climate-specific disclosures.',ext:'.html / .pdf'},
          {name:'XBRL-tagged',desc:'IFRS Sustainability Disclosure Taxonomy (ISSB XBRL). Machine-readable for regulatory submission.',ext:'.zip (xbrl)'},
          {name:'Gap Report',desc:'Detailed gap analysis with remediation roadmap, priority ranking, and owner assignments.',ext:'.xlsx'},
          {name:'Board Summary',desc:'Executive summary for Board: IFRS S1/S2 readiness, scenario results, key metrics.',ext:'.pdf / .pptx'},
          {name:'SASB Metrics Pack',desc:'Industry-specific metrics per SASB Standards for IFRS S2 Appendix B compliance.',ext:'.xlsx'},
          {name:'Connectivity Map',desc:'Cross-framework mapping: ISSB to CSRD, SFDR, TCFD, CDP. Interoperability evidence.',ext:'.pdf'},
        ].map((f,i)=>(
          <div key={i} style={{...ss.card,cursor:'pointer',background:exportFormat===f.name?'rgba(124,58,237,0.04)':T.surface}} onClick={()=>setExportFormat(f.name)}>
            <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:4}}>{f.name}</div>
            <div style={{fontSize:11,color:T.textSec}}>{f.desc}</div>
            <div style={{fontSize:10,fontFamily:T.mono,color:T.textMut,marginTop:4}}>{f.ext}</div>
          </div>
        ))}
      </div>
      <div style={ss.card}>
        <div style={{display:'flex',gap:12}}>
          <button style={ss.btn} onClick={()=>csvExport(GAP_ITEMS.map(g=>({code:g.code,requirement:g.label,standard:g.standard,pillar:g.pillar,status:g.status,quality:g.quality,priority:g.priority,remediation:g.remediation,owner:g.owner})),'issb_gap_analysis')}>Generate {exportFormat}</button>
          <button style={ss.btnSec}>Preview</button>
        </div>
      </div>
    </>
  );

  return(
    <div style={ss.wrap}>
      <div style={ss.header}>ISSB Disclosure Engine</div>
      <div style={ss.sub}>IFRS S1 (General) + IFRS S2 (Climate) + SASB Industry Standards — {S1_PILLARS.reduce((s,p)=>s+p.reqs.length,0)+S2_REQUIREMENTS.length} requirements, {SASB_INDUSTRIES.length} industries, {ADOPTION.length} jurisdictions</div>
      <div style={ss.tabs}>{TABS.map((t,i)=><button key={i} style={ss.tab(tab===i)} onClick={()=>setTab(i)}>{t}</button>)}</div>
      {tab===0&&renderS1()}
      {tab===1&&renderS2()}
      {tab===2&&renderScenario()}
      {tab===3&&renderSASB()}
      {tab===4&&renderGap()}
      {tab===5&&renderConnectivity()}
      {tab===6&&renderExport()}
    </div>
  );
}
