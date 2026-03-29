import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, Cell, LineChart, Line, AreaChart, Area,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { PCAF_DATA_QUALITY } from '../../../data/referenceData';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

// ── Static seed data ──────────────────────────────────────────────────────────

const PERIODS = ['Q3 2024','Q2 2024','Q1 2024','FY 2023','FY 2022'];

const KPI_DATA = {
  'Q3 2024':{ fe:'847.3', pt:'2.7', gar:'7.3', cet1:'-1.8', ecl:'£438M', sa:'£1.84bn' },
  'Q2 2024':{ fe:'891.2', pt:'2.8', gar:'6.9', cet1:'-1.6', ecl:'£412M', sa:'£1.91bn' },
  'Q1 2024':{ fe:'934.0', pt:'2.9', gar:'6.2', cet1:'-1.5', ecl:'£388M', sa:'£1.97bn' },
  'FY 2023':{ fe:'960.8', pt:'2.9', gar:'5.8', cet1:'-1.4', ecl:'£361M', sa:'£2.03bn' },
  'FY 2022':{ fe:'1050.0',pt:'3.1', gar:'4.2', cet1:'-1.1', ecl:'£298M', sa:'£2.18bn' },
};

const KPI_META = [
  { id:'fe',   label:'Financed Emissions',    unit:'ktCO₂e', target:'750', targetLabel:'Target Q4 2024', moduleLink:'PCAF Financed Emissions' },
  { id:'pt',   label:'Portfolio Temperature', unit:'°C',     target:'2.5', targetLabel:'Board limit 2025',moduleLink:'Climate Stress Test' },
  { id:'gar',  label:'Green Asset Ratio',     unit:'%',      target:'8.0', targetLabel:'2024 target',    moduleLink:'Green Asset Ratio' },
  { id:'cet1', label:'CET1 Climate Impact',   unit:'pp',     target:'-2.0',targetLabel:'Stress limit',   moduleLink:'Climate Credit Risk' },
  { id:'ecl',  label:'Climate ECL Overlay',   unit:'',       target:'£350M',targetLabel:'Appetite limit',moduleLink:'Climate Credit Risk' },
  { id:'sa',   label:'Stranded Assets Risk',  unit:'',       target:'£1.5bn',targetLabel:'2025 target',  moduleLink:'Green Asset Ratio' },
];

const EMISSIONS_TRAJECTORY = [
  { year:'2019', abs:1240, int:42.1, nze:null },
  { year:'2020', abs:1180, int:39.8, nze:null },
  { year:'2021', abs:1050, int:35.2, nze:null },
  { year:'2022', abs:960,  int:32.0, nze:null },
  { year:'2023', abs:847,  int:27.9, nze:null },
  { year:'2024', abs:null, int:null, nze:null },
  { year:'2025', abs:null, int:null, nze:null },
  { year:'2030', abs:null, int:null, nze:null },
  { year:'2035', abs:null, int:null, nze:null },
  { year:'2050', abs:null, int:null, nze:0    },
];
const TRAJ_TARGET = [
  { year:'2019', t:1240 },{ year:'2020', t:1100 },{ year:'2021', t:960 },
  { year:'2022', t:820 }, { year:'2023', t:700 }, { year:'2024', t:600 },
  { year:'2025', t:500 }, { year:'2030', t:250 }, { year:'2035', t:100 },{ year:'2050', t:0 },
];
const NZE_PATH = [
  { year:'2019', nze:1240 },{ year:'2020', nze:1120 },{ year:'2021', nze:990 },
  { year:'2022', nze:850 }, { year:'2023', nze:710 }, { year:'2024', nze:580 },
  { year:'2025', nze:460 }, { year:'2030', nze:220 }, { year:'2035', nze:80 },{ year:'2050', nze:0 },
];
const ASSET_BREAKDOWN = {
  '2019':{ Corporate:610, RE:310, Infra:180, SME:140 },
  '2020':{ Corporate:590, RE:290, Infra:170, SME:130 },
  '2021':{ Corporate:530, RE:260, Infra:150, SME:110 },
  '2022':{ Corporate:490, RE:240, Infra:130, SME:100 },
  '2023':{ Corporate:430, RE:220, Infra:120, SME:77  },
};

const INITIAL_ALERTS = [
  { id:1, level:'red',   text:'Portfolio temperature 2.7°C exceeds board limit of 2.5°C — action required', owner:'CRO', note:'' },
  { id:2, level:'amber', text:'GAR 7.3% below 2024 target of 8.0% — on watch', owner:'CFO', note:'' },
  { id:3, level:'green', text:'Financed emissions -31.8% vs 2019 baseline — target met', owner:'Head of ESG', note:'' },
  { id:4, level:'amber', text:'Climate ECL overlay £438M above £350M appetite limit', owner:'CRO', note:'' },
  { id:5, level:'red',   text:'Stranded asset exposure £1.84bn exceeds £1.5bn target', owner:'CRE Head', note:'' },
];

const REGULATORY_ITEMS = [
  { id:1,  date:'Jan 2024', label:'UK TCFD Mandatory — All Banks (FCA PS21/24)',   jur:'UK',     pri:'P1', status:'Complete',    owner:'CFO',      pct:100, desc:'FCA mandatory TCFD disclosure for all UK-listed banks. Full climate-related financial disclosure across Governance, Strategy, Risk Management, Metrics & Targets.', subtasks:['Board sign-off on TCFD report','Governance section: board oversight description','Scenario analysis (1.5°C / 2°C / 4°C)','Metrics & Targets table publication','Assurance by external auditor'] },
  { id:2,  date:'Jan 2024', label:'ECB Pillar 2 Climate Risk Expectations',        jur:'EU',     pri:'P1', status:'Complete',    owner:'CRO',      pct:100, desc:'ECB thematic review binding supervisory expectations — 13 expectations across governance, risk appetite, lending standards, stress testing and disclosure.', subtasks:['Gap analysis vs 13 expectations','Board climate risk appetite refresh','Climate stress test integration into ICAAP','Credit underwriting standards update','ECB supervisory dialogue submission'] },
  { id:3,  date:'Mar 2024', label:'SEC Climate Rule Final (Reg S-X/S-K)',          jur:'US',     pri:'P2', status:'Complete',    owner:'General Counsel', pct:100, desc:'SEC final rules on climate-related disclosures for public registrants. Scope 1, 2 and material Scope 3 emissions; climate-related risks; scenario analysis.', subtasks:['Scope 1+2 inventory finalised','Material Scope 3 assessment','10-K climate risk section drafted','GHG attestation arranged','Legal review of safe harbour provisions'] },
  { id:4,  date:'Jun 2024', label:'ISSB IFRS S1/S2 — UK Adoption',                jur:'UK',     pri:'P1', status:'Complete',    owner:'CFO',      pct:100, desc:'IFRS Foundation endorses S1 (general sustainability) and S2 (climate-specific) standards for UK voluntary/mandatory adoption pathway.', subtasks:['Readiness assessment vs S1/S2','Industry concentration metrics','Transition plan disclosure','Cross-industry category disclosures','Remuneration link documentation'] },
  { id:5,  date:'Jan 2025', label:'CSRD Phase 1 — Large EU Companies (ESRS E1)',   jur:'EU',     pri:'P1', status:'Complete',    owner:'Head of ESG', pct:100, desc:'500+ employee EU companies; mandatory ESRS disclosures including ESRS E1 climate, E2 pollution, S1 own workforce. Double materiality assessment required.', subtasks:['Double materiality assessment','ESRS E1 climate data collection','Value chain Scope 3 mapping','ESRS taxonomy alignment','Third-party limited assurance'] },
  { id:6,  date:'Jan 2025', label:'UK SDR Implementation (FCA)',                   jur:'UK',     pri:'P1', status:'Complete',    owner:'Head of Products', pct:100, desc:'Sustainability Disclosure Requirements — product naming, labelling and disclosure rules. Four product labels: Sustainable Focus, Improvers, Impact, Mixed Goals.', subtasks:['Product label classification review','Consumer-facing disclosure templates','Naming/marketing compliance audit','Fund manager training programme','FCA notification submissions'] },
  { id:7,  date:'Mar 2025', label:'DORA ICT Risk Reporting (Art 17)',               jur:'EU',     pri:'P2', status:'Complete',    owner:'CTO',      pct:100, desc:'Digital Operational Resilience Act — mandatory ICT incident classification and reporting to competent authorities. Major incident reports within 24h.', subtasks:['ICT risk register update','Incident classification taxonomy','24h reporting workflow','Third-party ICT provider register','Annual DORA self-assessment'] },
  { id:8,  date:'Jun 2025', label:'EU AI Act — High Risk Financial AI Systems',    jur:'EU',     pri:'P2', status:'In Progress', owner:'CTO',      pct:65, desc:'High-risk AI systems in financial services (credit scoring, insurance) must comply with Title III transparency, human oversight and accuracy requirements.', subtasks:['AI system inventory & classification','High-risk AI conformity assessment','Fundamental rights impact assessment','Human oversight protocols','Technical documentation file'] },
  { id:9,  date:'Sep 2025', label:'PRA SS3/19 Climate Financial Risk Update',      jur:'UK',     pri:'P1', status:'In Progress', owner:'CRO',      pct:45, desc:'PRA supervisory statement update on climate-related financial risk management. Enhanced expectations on scenario analysis, internal capital, credit risk integration.', subtasks:['Scenario analysis methodology refresh','Internal capital allocation review','Credit risk integration plan','Board risk committee briefing','PRA bilateral dialogue preparation'] },
  { id:10, date:'Jan 2026', label:'CSRD Phase 2 — Financial Sector Banks',         jur:'EU',     pri:'P1', status:'Not Started', owner:'Head of ESG', pct:0, desc:'Banks & insurance in scope — ~3,500 additional firms. ESRS E1 mandatory with sector-specific ESRS for financial sector. PCAF alignment required for financed emissions.', subtasks:['Financial sector ESRS gap analysis','PCAF-aligned financed emissions methodology','Sector-specific ESRS requirements mapping','Data infrastructure build-out','Assurance readiness assessment'] },
  { id:11, date:'2026',     label:'BCBS Pillar 3 Climate Disclosure Templates',    jur:'Global', pri:'P1', status:'Not Started', owner:'CFO',      pct:0, desc:'Basel Committee standardised Pillar 3 climate-related financial risk disclosure templates — physical risk, transition risk, financed emissions by sector.', subtasks:['Template mapping to existing data','Physical risk exposure data build','Transition risk sector classification','Financed emissions PCAF DQS alignment','Parallel run with existing TCFD disclosures'] },
  { id:12, date:'Jan 2026', label:'SFDR Level 2 RTS — PAI Reporting Cycle',        jur:'EU',     pri:'P2', status:'Not Started', owner:'Head of Products', pct:0, desc:'Sustainable Finance Disclosure Regulation — Principal Adverse Impact statement update. 18 mandatory PAI indicators plus optional indicators.', subtasks:['PAI data gap assessment','18 mandatory indicator data sourcing','DNSH criteria review','Product-level PAI statement','Website and pre-contractual disclosure update'] },
  { id:13, date:'Jun 2026', label:'EU Green Bond Standard (EuGBS) Adoption',       jur:'EU',     pri:'P2', status:'Not Started', owner:'CFO',      pct:0, desc:'European Green Bond Standard regulation — voluntary but market-expected. 100% EU taxonomy alignment, external review, post-issuance reporting.', subtasks:['EuGBS eligibility assessment','Taxonomy-aligned CapEx identification','External pre-issuance review','Prospectus drafting','Annual allocation and impact reporting'] },
  { id:14, date:'2027',     label:'TNFD Nature-Related Disclosures — Adoption',    jur:'Global', pri:'P3', status:'Not Started', owner:'Head of ESG', pct:0, desc:'Taskforce on Nature-related Financial Disclosures — LEAP framework adoption. Dependency and impact assessment on nature across portfolio.', subtasks:['LEAP pilot on top-5 sectors','Nature dependency mapping','High biodiversity risk locations','Business model risk assessment','Board nature risk appetite statement'] },
  { id:15, date:'2027',     label:'ISSB IFRS S5 — Human Capital (Proposed)',       jur:'Global', pri:'P3', status:'Not Started', owner:'CHRO',     pct:0, desc:'Proposed ISSB standard on human capital-related risks and opportunities. Workforce composition, training, safety, pay equity and supply chain labour standards.', subtasks:['Human capital materiality assessment','Workforce data infrastructure','Supply chain labour standards review','Pay equity gap analysis','Board remuneration committee alignment'] },
  { id:16, date:'2028',     label:'UK MEES EPC C Requirement (Rented Properties)', jur:'UK',     pri:'P1', status:'Not Started', owner:'CRE Head', pct:0, desc:'Minimum Energy Efficiency Standards — all rented commercial & residential properties must meet EPC C+. Non-compliant properties cannot be let. Stranded asset risk significant.', subtasks:['EPC C below portfolio screening','Stranded asset financial impact','Retrofit feasibility study','Green lending product launch','Client engagement programme'] },
  { id:17, date:'2028',     label:'CBAM Full Phase-In — Financial Sector Impact',  jur:'EU',     pri:'P2', status:'Not Started', owner:'Head of ESG', pct:0, desc:'Carbon Border Adjustment Mechanism full phase-in. Financial institutions with clients in cement, steel, aluminium, fertiliser, electricity, hydrogen sectors face exposure.', subtasks:['CBAM-exposed client identification','Credit risk overlay assessment','Client advisory programme','Portfolio carbon pricing sensitivity','Regulatory engagement on financial sector treatment'] },
  { id:18, date:'2030',     label:'EU Fit for 55 — Interim Corporate Targets',     jur:'EU',     pri:'P2', status:'Not Started', owner:'Head of ESG', pct:0, desc:'55% net GHG reduction vs 1990. ETS reform, CBAM phase-in, ReFuelEU, FuelEU Maritime. Corporate clients face significant transition cost uplift.', subtasks:['Client transition plan assessment','ETS exposure mapping','Transition finance product pipeline','Sector decarbonisation pathways','Portfolio temperature re-assessment'] },
  { id:19, date:'2030',     label:'NZBA 2030 Interim Targets — Public Commitment', jur:'Global', pri:'P1', status:'In Progress', owner:'CEO',      pct:30, desc:'Net-Zero Banking Alliance 2030 interim targets across all material sectors. Public commitment with annual progress reporting via UNEP FI template.', subtasks:['2030 target calibration per sector','SDA alignment methodology','Annual progress report template','Client transition plan scoring','Third-party validation'] },
  { id:20, date:'2035',     label:'EU CSRD 2035 Reporting — Full Value Chain',     jur:'EU',     pri:'P3', status:'Not Started', owner:'Head of ESG', pct:0, desc:'Full value chain Scope 3 reporting including financed emissions. EU taxonomy reporting at activity level across full loan book and investment portfolio.', subtasks:['Full Scope 3 data architecture','PCAF DQS 1-2 uplift programme','Taxonomy activity-level classification','Technology infrastructure plan','Regulatory liaison on financial sector taxonomy'] },
];

const RISK_LIMITS_DEFAULT = [
  { id:'fe',   metric:'Financed Emissions',       limit:'-30% by 2025',   current:'-31.8%',   unit:'vs 2019', trend:'-12% YoY',  status:'green' },
  { id:'pt',   metric:'Portfolio Temperature',    limit:'<2.5°C (2025)',  current:'2.7°C',    unit:'',        trend:'→ flat',    status:'red'   },
  { id:'gar',  metric:'Green Asset Ratio',         limit:'>10% by 2025',   current:'7.3%',     unit:'',        trend:'↑ 2.2pp',   status:'red'   },
  { id:'cet1', metric:'CET1 Climate Buffer',       limit:'>2.0pp',         current:'3.0pp',    unit:'buffer',  trend:'↑ 0.2pp',   status:'green' },
  { id:'ecl',  metric:'Climate ECL Overlay',       limit:'<£350M',         current:'£438M',    unit:'',        trend:'↑ 99%',     status:'red'   },
  { id:'sa',   metric:'Stranded Assets at Risk',   limit:'<£1.5bn',        current:'£1.84bn',  unit:'',        trend:'↑ 6%',      status:'red'   },
  { id:'coal', metric:'Coal Financing',            limit:'£0 new (runoff)',current:'£120M',    unit:'legacy',  trend:'↓ managed', status:'amber' },
  { id:'og',   metric:'Oil & Gas New Origination', limit:'<£200M/yr',      current:'£145M/yr', unit:'',        trend:'↓ 28%',     status:'green' },
  { id:'phys', metric:'Physical Risk ECL',         limit:'<£300M',         current:'£234M',    unit:'',        trend:'↑ 12%',     status:'green' },
  { id:'trpd', metric:'Transition Risk PD Uplift', limit:'<120bps avg',    current:'94bps',    unit:'avg',     trend:'↑ 8bps',    status:'green' },
  { id:'gl',   metric:'Green Lending Growth',      limit:'>15% YoY',       current:'11.2%',    unit:'YoY',     trend:'↑ 3.1pp',   status:'amber' },
  { id:'train',metric:'Climate Training Completion',limit:'>90%',          current:'78%',      unit:'staff',   trend:'↑ 6pp',     status:'amber' },
];

const PEERS_DATA = [
  { name:'Our Bank',         gar:7.3,  temp:2.7, fe:-32, cet1:3.0, ecl:438, sc3:-18, coal:120, highlight:true,  tcfd:82, cdp:'B', pcaf:true, nzba:true,  prb:true  },
  { name:'HSBC',             gar:8.1,  temp:2.6, fe:-28, cet1:2.8, ecl:520, sc3:-15, coal:890, highlight:false, tcfd:88, cdp:'A-',pcaf:true, nzba:true,  prb:true  },
  { name:'Barclays',         gar:6.8,  temp:2.8, fe:-25, cet1:2.5, ecl:380, sc3:-12, coal:640, highlight:false, tcfd:84, cdp:'B+',pcaf:true, nzba:true,  prb:true  },
  { name:'BNP Paribas',      gar:9.4,  temp:2.5, fe:-22, cet1:3.2, ecl:290, sc3:-20, coal:210, highlight:false, tcfd:91, cdp:'A', pcaf:true, nzba:true,  prb:true  },
  { name:'ING',              gar:11.8, temp:2.4, fe:-28, cet1:3.5, ecl:210, sc3:-24, coal:180, highlight:false, tcfd:94, cdp:'A', pcaf:true, nzba:true,  prb:true  },
  { name:'ABN AMRO',         gar:14.2, temp:2.2, fe:-35, cet1:3.8, ecl:160, sc3:-30, coal:90,  highlight:false, tcfd:96, cdp:'A', pcaf:true, nzba:true,  prb:true  },
  { name:'Deutsche Bank',    gar:5.9,  temp:2.9, fe:-18, cet1:2.2, ecl:480, sc3:-10, coal:760, highlight:false, tcfd:79, cdp:'B', pcaf:true, nzba:true,  prb:false },
  { name:'Santander',        gar:7.6,  temp:2.7, fe:-21, cet1:2.6, ecl:310, sc3:-14, coal:320, highlight:false, tcfd:80, cdp:'B', pcaf:false,nzba:true,  prb:true  },
  { name:'Lloyds',           gar:8.9,  temp:2.5, fe:-30, cet1:3.1, ecl:260, sc3:-22, coal:0,   highlight:false, tcfd:87, cdp:'A-',pcaf:true, nzba:true,  prb:true  },
  { name:'NatWest',          gar:9.2,  temp:2.5, fe:-32, cet1:3.0, ecl:240, sc3:-25, coal:0,   highlight:false, tcfd:89, cdp:'A', pcaf:true, nzba:true,  prb:true  },
  { name:'Standard Chartered',gar:6.2, temp:2.9, fe:-14, cet1:2.1, ecl:560, sc3:-8,  coal:980, highlight:false, tcfd:75, cdp:'B', pcaf:false,nzba:false, prb:true  },
  { name:'Crédit Agricole',  gar:10.1, temp:2.4, fe:-26, cet1:3.3, ecl:220, sc3:-21, coal:140, highlight:false, tcfd:88, cdp:'A-',pcaf:true, nzba:true,  prb:true  },
  { name:'UniCredit',        gar:8.4,  temp:2.6, fe:-20, cet1:2.7, ecl:350, sc3:-16, coal:390, highlight:false, tcfd:82, cdp:'B+',pcaf:true, nzba:true,  prb:true  },
  { name:'Société Générale', gar:9.8,  temp:2.5, fe:-24, cet1:3.0, ecl:270, sc3:-19, coal:260, highlight:false, tcfd:85, cdp:'A-',pcaf:true, nzba:true,  prb:false },
  { name:'Rabobank',         gar:13.1, temp:2.3, fe:-33, cet1:3.6, ecl:180, sc3:-28, coal:60,  highlight:false, tcfd:93, cdp:'A', pcaf:true, nzba:true,  prb:true  },
  { name:'Nordea',           gar:15.6, temp:2.1, fe:-40, cet1:4.0, ecl:140, sc3:-35, coal:0,   highlight:false, tcfd:97, cdp:'A', pcaf:true, nzba:true,  prb:true  },
];

const PEER_METRIC_OPTS = [
  { key:'gar',  label:'GAR (%)',           checked:true  },
  { key:'temp', label:'Portfolio Temp (°C)',checked:true  },
  { key:'fe',   label:'Financed Emissions (%)',checked:true },
  { key:'cet1', label:'CET1 Climate (pp)', checked:true  },
  { key:'ecl',  label:'Climate ECL (£M)',  checked:false },
  { key:'sc3',  label:'Scope 3 Change (%)',checked:false },
  { key:'coal', label:'Coal Exposure (£M)',checked:false },
];

const PEER_QUARTERLY = {
  'Our Bank':  [{ q:'Q1 24', gar:5.8 },{ q:'Q2 24', gar:6.9 },{ q:'Q3 24', gar:7.3 },{ q:'Q4 24', gar:7.8 }],
  'ING':       [{ q:'Q1 24', gar:10.1},{ q:'Q2 24', gar:10.9},{ q:'Q3 24', gar:11.8},{ q:'Q4 24', gar:12.4}],
  'ABN AMRO':  [{ q:'Q1 24', gar:12.8},{ q:'Q2 24', gar:13.5},{ q:'Q3 24', gar:14.2},{ q:'Q4 24', gar:15.1}],
  'Nordea':    [{ q:'Q1 24', gar:13.9},{ q:'Q2 24', gar:14.7},{ q:'Q3 24', gar:15.6},{ q:'Q4 24', gar:16.2}],
};

// ── Utility ───────────────────────────────────────────────────────────────────

function ragColor(s){ return s==='green'?T.green:s==='red'?T.red:T.amber; }
function ragBg(s){ return s==='green'?'#f0fdf4':s==='red'?'#fef2f2':'#fffbeb'; }

function calcKpiStatus(id, val, period){
  const numVal = parseFloat(val.replace(/[£bn%MkK]/g,''));
  if(id==='fe') return numVal < 850 ? 'green' : numVal < 950 ? 'amber' : 'red';
  if(id==='pt') return numVal <= 2.5 ? 'green' : numVal <= 2.8 ? 'amber' : 'red';
  if(id==='gar') return numVal >= 8 ? 'green' : numVal >= 6 ? 'amber' : 'red';
  if(id==='cet1') return numVal >= -2.0 ? 'green' : numVal >= -2.5 ? 'amber' : 'red';
  if(id==='ecl') return numVal < 350 ? 'green' : numVal < 430 ? 'amber' : 'red';
  if(id==='sa') return numVal < 1.5 ? 'green' : numVal < 2.0 ? 'amber' : 'red';
  return 'green';
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Badge({ s }){ return <span style={{ background:ragBg(s), color:ragColor(s), border:`1px solid ${ragColor(s)}33`, borderRadius:4, padding:'2px 8px', fontSize:11, fontWeight:700, letterSpacing:.4 }}>{s.toUpperCase()}</span>; }

function Card({ children, style={}, hover=false }){
  const [h,setH]=useState(false);
  return <div onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, boxShadow:h&&hover?T.cardH:T.card, transition:'all .2s', ...style }}>{children}</div>;
}

function Btn({ children, onClick, style={}, variant='primary' }){
  const base={ padding:'6px 14px', borderRadius:7, fontSize:13, fontWeight:600, cursor:'pointer', border:'none', transition:'all .15s' };
  const variants={ primary:{ background:T.navy, color:'#fff' }, ghost:{ background:'transparent', color:T.navy, border:`1px solid ${T.border}` }, gold:{ background:T.gold, color:T.navy }, danger:{ background:T.red, color:'#fff' } };
  return <button onClick={onClick} style={{ ...base, ...variants[variant], ...style }}>{children}</button>;
}

// ── Tab 1: Executive Dashboard ────────────────────────────────────────────────

function Tab1({ period, setPeriod, boardMode, setBoardMode }){
  const [visibleKpis, setVisibleKpis] = useState({ fe:true, pt:true, gar:true, cet1:true, ecl:true, sa:true });
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  const [trajMode, setTrajMode] = useState('abs'); // abs | int
  const [selectedYear, setSelectedYear] = useState(null);
  const [showAlertForm, setShowAlertForm] = useState(false);
  const [newAlert, setNewAlert] = useState({ metric:'Financed Emissions', threshold:'', dir:'above', owner:'' });

  const periodData = KPI_DATA[period];

  const kpiCards = useMemo(() => KPI_META.map(m => {
    const val = periodData[m.id];
    const status = calcKpiStatus(m.id, val, period);
    return { ...m, value:val, status };
  }), [period, periodData]);

  const trajData = [...EMISSIONS_TRAJECTORY].map((r,i) => ({
    ...r,
    target: TRAJ_TARGET[i]?.t,
    nze: NZE_PATH[i]?.nze,
  }));

  const dismissAlert = id => setAlerts(a => a.filter(x => x.id !== id));
  const addAlertNote = (id, note) => setAlerts(a => a.map(x => x.id===id ? {...x, note} : x));

  const addAlertRule = () => {
    if(!newAlert.threshold) return;
    setAlerts(a => [...a, { id: Date.now(), level:'amber', text:`${newAlert.metric} ${newAlert.dir} ${newAlert.threshold} — alert triggered`, owner:newAlert.owner||'Unassigned', note:'' }]);
    setShowAlertForm(false);
    setNewAlert({ metric:'Financed Emissions', threshold:'', dir:'above', owner:'' });
  };

  const breakdownYear = selectedYear && ASSET_BREAKDOWN[selectedYear];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {/* Controls */}
      <Card style={{ padding:'14px 20px', display:'flex', flexWrap:'wrap', gap:12, alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:13, color:T.textSec, fontWeight:600 }}>Period:</span>
          {PERIODS.map(p => <button key={p} onClick={()=>setPeriod(p)} style={{ padding:'5px 12px', borderRadius:6, border:`1px solid ${period===p?T.navy:T.border}`, background:period===p?T.navy:'transparent', color:period===p?'#fff':T.text, fontSize:12, fontWeight:600, cursor:'pointer' }}>{p}</button>)}
        </div>
        <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
          <button onClick={()=>setBoardMode(false)} style={{ padding:'5px 12px', borderRadius:6, border:`1px solid ${!boardMode?T.gold:T.border}`, background:!boardMode?T.gold:'transparent', color:T.navy, fontSize:12, fontWeight:600, cursor:'pointer' }}>Standard View</button>
          <button onClick={()=>setBoardMode(true)} style={{ padding:'5px 12px', borderRadius:6, border:`1px solid ${boardMode?T.gold:T.border}`, background:boardMode?T.gold:'transparent', color:T.navy, fontSize:12, fontWeight:600, cursor:'pointer' }}>Board Pack View</button>
        </div>
      </Card>

      {/* Metric toggle */}
      {!boardMode && <Card style={{ padding:'12px 20px' }}>
        <div style={{ fontSize:12, fontWeight:700, color:T.textSec, marginBottom:8 }}>VISIBLE KPI CARDS</div>
        <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
          {KPI_META.map(m => <label key={m.id} style={{ display:'flex', alignItems:'center', gap:5, fontSize:13, color:T.text, cursor:'pointer' }}>
            <input type="checkbox" checked={visibleKpis[m.id]} onChange={e=>setVisibleKpis(v=>({...v,[m.id]:e.target.checked}))} style={{ accentColor:T.navy }} /> {m.label}
          </label>)}
        </div>
      </Card>}

      {/* KPI Cards */}
      <div style={{ display:'grid', gridTemplateColumns: boardMode ? 'repeat(3,1fr)' : 'repeat(3,1fr)', gap:14 }}>
        {kpiCards.filter(k => visibleKpis[k.id]).map(k => (
          <Card key={k.id} hover style={{ padding: boardMode ? '20px 24px' : '16px 20px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
              <span style={{ fontSize:12, fontWeight:700, color:T.textSec, letterSpacing:.5 }}>{k.label.toUpperCase()}</span>
              <Badge s={k.status} />
            </div>
            <div style={{ fontSize: boardMode ? 36 : 28, fontWeight:800, color:T.navy, letterSpacing:-1 }}>
              {k.value} <span style={{ fontSize: boardMode ? 16 : 13, fontWeight:600, color:T.textSec }}>{k.unit}</span>
            </div>
            {!boardMode && <>
              <div style={{ fontSize:12, color:T.textMut, marginTop:4 }}>{k.trend}</div>
              <div style={{ marginTop:8, padding:'6px 10px', background:T.bg, borderRadius:6, fontSize:12, display:'flex', justifyContent:'space-between' }}>
                <span style={{ color:T.textSec }}>Target: <strong>{k.target} {k.unit}</strong></span>
                <span style={{ color:T.textMut }}>{k.targetLabel}</span>
              </div>
              <button style={{ marginTop:8, fontSize:12, color:T.navyL, background:'none', border:'none', cursor:'pointer', padding:0, textDecoration:'underline' }}>Drill into {k.moduleLink} →</button>
            </>}
          </Card>
        ))}
      </div>

      {/* Trajectory chart */}
      <Card style={{ padding:20 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <div>
            <div style={{ fontWeight:700, color:T.navy, fontSize:16 }}>Financed Emissions Trajectory</div>
            <div style={{ fontSize:12, color:T.textSec }}>Click a year bar to see asset class breakdown</div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={()=>setTrajMode('abs')} style={{ padding:'4px 10px', borderRadius:6, border:`1px solid ${trajMode==='abs'?T.navy:T.border}`, background:trajMode==='abs'?T.navy:'transparent', color:trajMode==='abs'?'#fff':T.text, fontSize:12, cursor:'pointer' }}>Absolute (ktCO₂e)</button>
            <button onClick={()=>setTrajMode('int')} style={{ padding:'4px 10px', borderRadius:6, border:`1px solid ${trajMode==='int'?T.navy:T.border}`, background:trajMode==='int'?T.navy:'transparent', color:trajMode==='int'?'#fff':T.text, fontSize:12, cursor:'pointer' }}>Intensity (tCO₂e/$M)</button>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={trajData} onClick={e => { if(e?.activeLabel) setSelectedYear(e.activeLabel); }} style={{ cursor:'pointer' }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="year" tick={{ fontSize:11 }} />
            <YAxis tick={{ fontSize:11 }} />
            <Tooltip contentStyle={{ borderRadius:8, fontSize:12 }} />
            {trajMode==='abs' && <Area type="monotone" dataKey="abs" stroke={T.navy} fill={T.navy+'22'} name="Actual (ktCO₂e)" dot={{ r:4, fill:T.navy }} />}
            {trajMode==='int' && <Area type="monotone" dataKey="int" stroke={T.navyL} fill={T.navyL+'22'} name="Intensity (tCO₂e/$M)" dot={{ r:4, fill:T.navyL }} />}
            <Line type="monotone" dataKey="target" stroke={T.gold} strokeDasharray="5 5" dot={false} name="Our Target" />
            <Line type="monotone" dataKey="nze" stroke={T.sage} strokeDasharray="3 3" dot={false} name="IEA NZE" />
          </AreaChart>
        </ResponsiveContainer>
        {selectedYear && breakdownYear && (
          <div style={{ marginTop:12, padding:14, background:T.bg, borderRadius:8, border:`1px solid ${T.border}` }}>
            <div style={{ fontWeight:700, color:T.navy, marginBottom:8 }}>{selectedYear} — Asset Class Breakdown (ktCO₂e)</div>
            <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
              {Object.entries(breakdownYear).map(([k,v]) => <div key={k} style={{ textAlign:'center' }}>
                <div style={{ fontSize:20, fontWeight:800, color:T.navy }}>{v}</div>
                <div style={{ fontSize:11, color:T.textSec }}>{k}</div>
              </div>)}
            </div>
            <button onClick={()=>setSelectedYear(null)} style={{ marginTop:8, fontSize:11, color:T.textMut, background:'none', border:'none', cursor:'pointer' }}>✕ Close</button>
          </div>
        )}
      </Card>

      {/* Alert center */}
      <Card style={{ padding:20 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <div style={{ fontWeight:700, color:T.navy, fontSize:16 }}>Alert Center</div>
          <Btn variant="ghost" onClick={()=>setShowAlertForm(!showAlertForm)} style={{ fontSize:12 }}>+ Add Alert Rule</Btn>
        </div>
        {showAlertForm && (
          <div style={{ padding:16, background:T.bg, borderRadius:8, border:`1px solid ${T.border}`, marginBottom:12, display:'flex', flexWrap:'wrap', gap:10, alignItems:'flex-end' }}>
            <div><div style={{ fontSize:11, color:T.textSec, marginBottom:4 }}>Metric</div>
              <select value={newAlert.metric} onChange={e=>setNewAlert(a=>({...a,metric:e.target.value}))} style={{ padding:'5px 8px', borderRadius:6, border:`1px solid ${T.border}`, fontSize:12 }}>
                {KPI_META.map(m=><option key={m.id}>{m.label}</option>)}
              </select></div>
            <div><div style={{ fontSize:11, color:T.textSec, marginBottom:4 }}>Direction</div>
              <select value={newAlert.dir} onChange={e=>setNewAlert(a=>({...a,dir:e.target.value}))} style={{ padding:'5px 8px', borderRadius:6, border:`1px solid ${T.border}`, fontSize:12 }}>
                <option>above</option><option>below</option>
              </select></div>
            <div><div style={{ fontSize:11, color:T.textSec, marginBottom:4 }}>Threshold</div>
              <input value={newAlert.threshold} onChange={e=>setNewAlert(a=>({...a,threshold:e.target.value}))} placeholder="e.g. 2.5°C" style={{ padding:'5px 8px', borderRadius:6, border:`1px solid ${T.border}`, fontSize:12, width:90 }} /></div>
            <div><div style={{ fontSize:11, color:T.textSec, marginBottom:4 }}>Owner</div>
              <input value={newAlert.owner} onChange={e=>setNewAlert(a=>({...a,owner:e.target.value}))} placeholder="CRO" style={{ padding:'5px 8px', borderRadius:6, border:`1px solid ${T.border}`, fontSize:12, width:90 }} /></div>
            <Btn onClick={addAlertRule} style={{ fontSize:12 }}>Add Rule</Btn>
          </div>
        )}
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {alerts.map(al => (
            <div key={al.id} style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'10px 14px', background:ragBg(al.level), border:`1px solid ${ragColor(al.level)}33`, borderRadius:8 }}>
              <span style={{ fontSize:18, lineHeight:1.2 }}>{al.level==='red'?'🔴':al.level==='amber'?'🟡':'🟢'}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, color:T.text, fontWeight:500 }}>{al.text}</div>
                <div style={{ fontSize:11, color:T.textMut, marginTop:2 }}>Owner: {al.owner}</div>
                {al.note && <div style={{ fontSize:11, color:T.textSec, fontStyle:'italic', marginTop:2 }}>Note: {al.note}</div>}
                <input placeholder="Add note…" onBlur={e=>{ if(e.target.value) addAlertNote(al.id, e.target.value); }} style={{ marginTop:6, padding:'3px 8px', borderRadius:5, border:`1px solid ${T.border}`, fontSize:11, width:220 }} />
              </div>
              <button onClick={()=>dismissAlert(al.id)} style={{ background:'none', border:'none', cursor:'pointer', color:T.textMut, fontSize:16 }}>✕</button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── Tab 2: Regulatory Calendar ────────────────────────────────────────────────

function Tab2(){
  const [view, setView] = useState('List'); // List | Calendar | Timeline | Kanban
  const [jurFilter, setJurFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priFilter, setPriFilter] = useState('All');
  const [deadlineStatuses, setDeadlineStatuses] = useState(() => Object.fromEntries(REGULATORY_ITEMS.map(r=>[r.id, { status:r.status, pct:r.pct, owner:r.owner, notes:'' }])));
  const [expanded, setExpanded] = useState(null);

  const filtered = useMemo(() => REGULATORY_ITEMS.filter(r => {
    if(jurFilter!=='All' && r.jur!==jurFilter) return false;
    if(statusFilter!=='All' && deadlineStatuses[r.id].status!==statusFilter) return false;
    if(priFilter!=='All' && r.pri!==priFilter) return false;
    return true;
  }), [jurFilter, statusFilter, priFilter, deadlineStatuses]);

  const totalComplete = useMemo(() => {
    const c = REGULATORY_ITEMS.filter(r => deadlineStatuses[r.id].status==='Complete').length;
    return Math.round((c / REGULATORY_ITEMS.length) * 100);
  }, [deadlineStatuses]);

  const updateItem = (id, key, val) => setDeadlineStatuses(s => ({ ...s, [id]:{ ...s[id], [key]:val } }));

  const STATUS_COLORS = { 'Complete':T.green, 'In Progress':T.amber, 'Not Started':T.textMut, 'Overdue':T.red };

  const exportCSV = () => {
    const rows = [['Date','Requirement','Jurisdiction','Priority','Status','Owner','Progress%'],...REGULATORY_ITEMS.map(r=>[r.date,r.label,r.jur,r.pri,deadlineStatuses[r.id].status,deadlineStatuses[r.id].owner,deadlineStatuses[r.id].pct])];
    const csv = rows.map(r=>r.join(',')).join('\n');
    const a=document.createElement('a'); a.href='data:text/csv,'+encodeURIComponent(csv); a.download='regulatory-calendar.csv'; a.click();
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {/* Compliance score */}
      <Card style={{ padding:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:12, fontWeight:700, color:T.textSec, marginBottom:6 }}>OVERALL COMPLIANCE SCORE</div>
            <div style={{ background:T.border, borderRadius:99, height:10, overflow:'hidden' }}>
              <div style={{ width:`${totalComplete}%`, height:'100%', background: totalComplete>=75?T.green:totalComplete>=50?T.amber:T.red, borderRadius:99, transition:'width .4s' }} />
            </div>
          </div>
          <div style={{ fontSize:32, fontWeight:800, color:T.navy }}>{totalComplete}%</div>
          <Btn variant="ghost" onClick={exportCSV} style={{ fontSize:12 }}>⬇ Export CSV</Btn>
        </div>
      </Card>

      {/* Controls */}
      <Card style={{ padding:'12px 16px', display:'flex', flexWrap:'wrap', gap:12, alignItems:'center' }}>
        <div style={{ display:'flex', gap:6 }}>
          {['List','Calendar','Timeline','Kanban'].map(v => <button key={v} onClick={()=>setView(v)} style={{ padding:'5px 12px', borderRadius:6, border:`1px solid ${view===v?T.navy:T.border}`, background:view===v?T.navy:'transparent', color:view===v?'#fff':T.text, fontSize:12, fontWeight:600, cursor:'pointer' }}>{v}</button>)}
        </div>
        <div style={{ display:'flex', gap:8, marginLeft:'auto', flexWrap:'wrap' }}>
          {[['Jur',['All','EU','UK','US','Global'],jurFilter,setJurFilter],['Status',['All','Complete','In Progress','Not Started','Overdue'],statusFilter,setStatusFilter],['Priority',['All','P1','P2','P3'],priFilter,setPriFilter]].map(([lbl,opts,val,set]) =>
            <select key={lbl} value={val} onChange={e=>set(e.target.value)} style={{ padding:'4px 8px', borderRadius:6, border:`1px solid ${T.border}`, fontSize:12 }}>
              {opts.map(o=><option key={o}>{o}</option>)}
            </select>
          )}
        </div>
      </Card>

      {/* Views */}
      {view==='Kanban' ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
          {['Not Started','In Progress','Complete','Overdue'].map(s => (
            <div key={s}>
              <div style={{ fontSize:12, fontWeight:700, color:STATUS_COLORS[s]||T.textSec, marginBottom:8, padding:'4px 0' }}>{s.toUpperCase()} ({filtered.filter(r=>deadlineStatuses[r.id].status===s).length})</div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {filtered.filter(r=>deadlineStatuses[r.id].status===s).map(r => (
                  <Card key={r.id} style={{ padding:10, cursor:'pointer' }} hover onClick={()=>setExpanded(expanded===r.id?null:r.id)}>
                    <div style={{ fontSize:11, color:T.textMut }}>{r.date} · {r.jur}</div>
                    <div style={{ fontSize:12, fontWeight:600, color:T.navy, marginTop:2 }}>{r.label}</div>
                    <div style={{ fontSize:11, color:T.textMut, marginTop:4 }}>Owner: {deadlineStatuses[r.id].owner}</div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : view==='Timeline' ? (
        <Card style={{ padding:20 }}>
          <div style={{ position:'relative' }}>
            <div style={{ position:'absolute', left:60, top:0, bottom:0, width:2, background:T.border }} />
            {filtered.map((r,i) => (
              <div key={r.id} style={{ display:'flex', gap:16, marginBottom:16, cursor:'pointer' }} onClick={()=>setExpanded(expanded===r.id?null:r.id)}>
                <div style={{ width:60, textAlign:'right', fontSize:11, color:T.textMut, paddingTop:2 }}>{r.date}</div>
                <div style={{ width:12, height:12, borderRadius:'50%', background:STATUS_COLORS[deadlineStatuses[r.id].status]||T.textMut, marginTop:2, zIndex:1, flexShrink:0 }} />
                <div style={{ flex:1, padding:'4px 10px', background:T.bg, borderRadius:8 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:T.navy }}>{r.label}</div>
                  <div style={{ fontSize:11, color:T.textMut }}>{r.jur} · {r.pri} · {deadlineStatuses[r.id].status}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {filtered.map(r => {
            const ds = deadlineStatuses[r.id];
            const isExp = expanded===r.id;
            return (
              <Card key={r.id} style={{ padding:0, overflow:'hidden' }}>
                <div onClick={()=>setExpanded(isExp?null:r.id)} style={{ padding:'12px 16px', display:'flex', gap:12, alignItems:'center', cursor:'pointer', background: isExp ? T.surfaceH : T.surface }}>
                  <span style={{ fontSize:12, fontWeight:700, color:STATUS_COLORS[ds.status]||T.textMut, width:90 }}>{ds.status}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, color:T.navy, fontSize:13 }}>{r.label}</div>
                    <div style={{ fontSize:11, color:T.textMut }}>{r.date} · {r.jur} · {r.pri}</div>
                  </div>
                  <div style={{ width:80 }}>
                    <div style={{ background:T.border, borderRadius:99, height:6 }}>
                      <div style={{ width:`${ds.pct}%`, height:'100%', background:STATUS_COLORS[ds.status]||T.navy, borderRadius:99 }} />
                    </div>
                    <div style={{ fontSize:10, color:T.textMut, textAlign:'right', marginTop:2 }}>{ds.pct}%</div>
                  </div>
                  <span style={{ color:T.textMut }}>{isExp?'▲':'▼'}</span>
                </div>
                {isExp && (
                  <div style={{ padding:'16px 20px', borderTop:`1px solid ${T.border}`, display:'flex', flexDirection:'column', gap:12 }}>
                    <div style={{ fontSize:13, color:T.textSec }}>{r.desc}</div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:12 }}>
                      <div><div style={{ fontSize:11, color:T.textMut, marginBottom:4 }}>Owner</div>
                        <select value={ds.owner} onChange={e=>updateItem(r.id,'owner',e.target.value)} style={{ padding:'4px 8px', borderRadius:6, border:`1px solid ${T.border}`, fontSize:12 }}>
                          {['CFO','CRO','Head of ESG','CTO','General Counsel','CHRO','CEO','CRE Head','Head of Products'].map(o=><option key={o}>{o}</option>)}
                        </select></div>
                      <div><div style={{ fontSize:11, color:T.textMut, marginBottom:4 }}>Status</div>
                        <select value={ds.status} onChange={e=>updateItem(r.id,'status',e.target.value)} style={{ padding:'4px 8px', borderRadius:6, border:`1px solid ${T.border}`, fontSize:12 }}>
                          {['Not Started','In Progress','Complete','Overdue'].map(s=><option key={s}>{s}</option>)}
                        </select></div>
                      <div style={{ flex:1 }}><div style={{ fontSize:11, color:T.textMut, marginBottom:4 }}>Progress: {ds.pct}%</div>
                        <input type="range" min={0} max={100} value={ds.pct} onChange={e=>updateItem(r.id,'pct',+e.target.value)} style={{ width:'100%', accentColor:T.navy }} /></div>
                    </div>
                    <div><div style={{ fontSize:11, color:T.textMut, marginBottom:4 }}>Notes</div>
                      <textarea value={ds.notes} onChange={e=>updateItem(r.id,'notes',e.target.value)} placeholder="Add notes…" style={{ width:'100%', padding:'6px 10px', borderRadius:6, border:`1px solid ${T.border}`, fontSize:12, minHeight:48, resize:'vertical', fontFamily:T.font }} /></div>
                    <div><div style={{ fontSize:11, fontWeight:700, color:T.textSec, marginBottom:6 }}>KEY SUBTASKS</div>
                      <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                        {r.subtasks.map((st,i) => <label key={i} style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, color:T.text, cursor:'pointer' }}>
                          <input type="checkbox" style={{ accentColor:T.navy }} /> {st}
                        </label>)}
                      </div></div>
                    <Btn onClick={()=>updateItem(r.id,'status','Complete')} style={{ alignSelf:'flex-start', fontSize:12 }}>Mark Complete</Btn>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Tab 3: Risk Appetite Dashboard ───────────────────────────────────────────

function Tab3(){
  const [editMode, setEditMode] = useState(false);
  const [riskLimits, setRiskLimits] = useState(RISK_LIMITS_DEFAULT);
  const [origLimits] = useState(RISK_LIMITS_DEFAULT);
  const [actionPlan, setActionPlan] = useState(null);
  const [apForm, setApForm] = useState({ cause:'', actions:'', owner:'', date:'' });
  const [boardPaper, setBoardPaper] = useState(null);

  const updateLimit = (id, val) => setRiskLimits(l => l.map(x => x.id===id ? { ...x, limit:val } : x));
  const resetLimits = () => setRiskLimits(origLimits);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <Card style={{ padding:'14px 20px', display:'flex', alignItems:'center', gap:12 }}>
        <div style={{ fontWeight:700, color:T.navy }}>Risk Appetite Framework — Board Approved Limits</div>
        <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
          <Btn variant={editMode?'primary':'ghost'} onClick={()=>setEditMode(!editMode)} style={{ fontSize:12 }}>{editMode ? 'Save Changes' : 'Edit Limits'}</Btn>
          {editMode && <Btn variant="ghost" onClick={resetLimits} style={{ fontSize:12 }}>Reset to Defaults</Btn>}
        </div>
      </Card>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12 }}>
        {riskLimits.map(row => (
          <Card key={row.id} style={{ padding:'14px 18px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
              <div style={{ fontWeight:600, color:T.navy, fontSize:13 }}>{row.metric}</div>
              <div style={{ width:10, height:10, borderRadius:'50%', background:ragColor(row.status), marginTop:3, flexShrink:0 }} />
            </div>
            <div style={{ display:'flex', gap:16, alignItems:'center' }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:11, color:T.textMut, marginBottom:2 }}>Board Limit</div>
                {editMode
                  ? <input value={row.limit} onChange={e=>updateLimit(row.id,e.target.value)} style={{ padding:'4px 8px', borderRadius:6, border:`1px solid ${T.border}`, fontSize:13, fontWeight:700, color:T.navy, width:'100%' }} />
                  : <div style={{ fontSize:15, fontWeight:700, color:T.navy }}>{row.limit}</div>}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:11, color:T.textMut, marginBottom:2 }}>Current</div>
                <div style={{ fontSize:15, fontWeight:700, color:ragColor(row.status) }}>{row.current}</div>
              </div>
              <div>
                <div style={{ fontSize:11, color:T.textMut, marginBottom:2 }}>Trend</div>
                <div style={{ fontSize:12, color:T.textSec }}>{row.trend}</div>
              </div>
            </div>
            <div style={{ marginTop:10, display:'flex', gap:8 }}>
              <Badge s={row.status} />
              {row.status==='red' && <button onClick={()=>setActionPlan(row)} style={{ padding:'2px 10px', borderRadius:5, border:`1px solid ${T.red}`, background:'#fef2f2', color:T.red, fontSize:11, fontWeight:600, cursor:'pointer' }}>Create Action Plan</button>}
              <button onClick={()=>setBoardPaper(boardPaper===row.id?null:row.id)} style={{ padding:'2px 10px', borderRadius:5, border:`1px solid ${T.border}`, background:'transparent', color:T.textSec, fontSize:11, cursor:'pointer' }}>Board Paper Section</button>
            </div>
            {boardPaper===row.id && (
              <div style={{ marginTop:10, padding:10, background:'#f8faff', borderRadius:8, border:`1px solid #dde9ff`, fontSize:12, color:T.textSec }}>
                <strong>DRAFT BOARD PAPER EXTRACT</strong><br/>
                <em>{row.metric}</em>: Current position of <strong>{row.current}</strong> against board-approved limit of <strong>{row.limit}</strong>. Status: <strong>{row.status.toUpperCase()}</strong>. Trend: {row.trend}. Management commentary pending.
              </div>
            )}
          </Card>
        ))}
      </div>

      {actionPlan && (
        <Card style={{ padding:20, border:`1px solid ${T.red}66` }}>
          <div style={{ fontWeight:700, color:T.red, marginBottom:12 }}>Action Plan — {actionPlan.metric}</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div><div style={{ fontSize:11, color:T.textMut, marginBottom:4 }}>Root Cause</div>
              <textarea value={apForm.cause} onChange={e=>setApForm(f=>({...f,cause:e.target.value}))} placeholder="Describe root cause…" style={{ width:'100%', padding:'6px 10px', borderRadius:6, border:`1px solid ${T.border}`, fontSize:12, minHeight:60, resize:'vertical', fontFamily:T.font }} /></div>
            <div><div style={{ fontSize:11, color:T.textMut, marginBottom:4 }}>Remediation Actions</div>
              <textarea value={apForm.actions} onChange={e=>setApForm(f=>({...f,actions:e.target.value}))} placeholder="List remediation steps…" style={{ width:'100%', padding:'6px 10px', borderRadius:6, border:`1px solid ${T.border}`, fontSize:12, minHeight:60, resize:'vertical', fontFamily:T.font }} /></div>
            <div><div style={{ fontSize:11, color:T.textMut, marginBottom:4 }}>Responsible Owner</div>
              <input value={apForm.owner} onChange={e=>setApForm(f=>({...f,owner:e.target.value}))} placeholder="CRO" style={{ padding:'6px 10px', borderRadius:6, border:`1px solid ${T.border}`, fontSize:12, width:'100%' }} /></div>
            <div><div style={{ fontSize:11, color:T.textMut, marginBottom:4 }}>Target Resolution Date</div>
              <input type="date" value={apForm.date} onChange={e=>setApForm(f=>({...f,date:e.target.value}))} style={{ padding:'6px 10px', borderRadius:6, border:`1px solid ${T.border}`, fontSize:12, width:'100%' }} /></div>
          </div>
          <div style={{ display:'flex', gap:8, marginTop:12 }}>
            <Btn onClick={()=>setActionPlan(null)}>Save Action Plan</Btn>
            <Btn variant="ghost" onClick={()=>setActionPlan(null)}>Cancel</Btn>
          </div>
        </Card>
      )}
    </div>
  );
}

// ── Tab 4: Peer Benchmarking ─────────────────────────────────────────────────

function Tab4(){
  const [peerMetrics, setPeerMetrics] = useState(Object.fromEntries(PEER_METRIC_OPTS.map(m=>[m.key,m.checked])));
  const [benchView, setBenchView] = useState('Bar'); // Bar | Scatter | Ranking | HeatMap
  const [sortKey, setSortKey] = useState('gar');
  const [sortDir, setSortDir] = useState('desc');
  const [trendPeers, setTrendPeers] = useState(['Our Bank','ING']);
  const [addPeer, setAddPeer] = useState(false);
  const [newPeer, setNewPeer] = useState({ name:'', gar:'', temp:'', fe:'', cet1:'', ecl:'', sc3:'', coal:'' });
  const [peers, setPeers] = useState(PEERS_DATA);
  const [activeMetric, setActiveMetric] = useState('gar');

  const visibleMetricKeys = useMemo(() => PEER_METRIC_OPTS.filter(m=>peerMetrics[m.key]).map(m=>m.key), [peerMetrics]);

  const sorted = useMemo(() => [...peers].sort((a,b) => sortDir==='asc' ? a[sortKey]-b[sortKey] : b[sortKey]-a[sortKey]), [peers, sortKey, sortDir]);

  const toggleSort = key => { if(sortKey===key) setSortDir(d=>d==='asc'?'desc':'asc'); else { setSortKey(key); setSortDir('desc'); } };

  const METRIC_LABELS = { gar:'GAR (%)', temp:'Temp (°C)', fe:'FE Change (%)', cet1:'CET1 (pp)', ecl:'ECL (£M)', sc3:'Sc3 (%)', coal:'Coal (£M)' };

  const heatColor = (key, val) => {
    if(key==='gar') return val>12 ? '#dcfce7' : val>8 ? '#fef9c3' : '#fee2e2';
    if(key==='temp') return val<2.3 ? '#dcfce7' : val<2.7 ? '#fef9c3' : '#fee2e2';
    if(key==='fe') return val<-30 ? '#dcfce7' : val<-20 ? '#fef9c3' : '#fee2e2';
    if(key==='ecl') return val<200 ? '#dcfce7' : val<400 ? '#fef9c3' : '#fee2e2';
    return '#f0f4ff';
  };

  const addPeerSubmit = () => {
    if(!newPeer.name) return;
    setPeers(p => [...p, { ...newPeer, gar:+newPeer.gar||0, temp:+newPeer.temp||0, fe:+newPeer.fe||0, cet1:+newPeer.cet1||0, ecl:+newPeer.ecl||0, sc3:+newPeer.sc3||0, coal:+newPeer.coal||0, highlight:false, tcfd:0, cdp:'N/A', pcaf:false, nzba:false, prb:false }]);
    setAddPeer(false); setNewPeer({ name:'', gar:'', temp:'', fe:'', cet1:'', ecl:'', sc3:'', coal:'' });
  };

  const trendData = (() => {
    const qs = ['Q1 24','Q2 24','Q3 24','Q4 24'];
    return qs.map(q => {
      const r = { q };
      trendPeers.forEach(p => { r[p] = PEER_QUARTERLY[p]?.find(x=>x.q===q)?.gar ?? null; });
      return r;
    });
  })();

  const PEER_COLORS = [T.gold, T.sage, T.navyL, T.red, T.amber, '#9333ea', '#0ea5e9'];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {/* Controls */}
      <Card style={{ padding:'14px 20px', display:'flex', flexWrap:'wrap', gap:12, alignItems:'center' }}>
        <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
          {PEER_METRIC_OPTS.map(m => <label key={m.key} style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, cursor:'pointer' }}>
            <input type="checkbox" checked={!!peerMetrics[m.key]} onChange={e=>setPeerMetrics(x=>({...x,[m.key]:e.target.checked}))} style={{ accentColor:T.navy }} /> {m.label}
          </label>)}
        </div>
        <div style={{ marginLeft:'auto', display:'flex', gap:6 }}>
          {['Bar','Scatter','Ranking','HeatMap'].map(v => <button key={v} onClick={()=>setBenchView(v)} style={{ padding:'5px 10px', borderRadius:6, border:`1px solid ${benchView===v?T.navy:T.border}`, background:benchView===v?T.navy:'transparent', color:benchView===v?'#fff':T.text, fontSize:12, fontWeight:600, cursor:'pointer' }}>{v}</button>)}
        </div>
      </Card>

      {/* Main chart area */}
      {benchView==='Bar' && (
        <Card style={{ padding:20 }}>
          <div style={{ display:'flex', gap:10, marginBottom:12, flexWrap:'wrap' }}>
            {visibleMetricKeys.map(k => <button key={k} onClick={()=>setActiveMetric(k)} style={{ padding:'4px 10px', borderRadius:6, border:`1px solid ${activeMetric===k?T.navy:T.border}`, background:activeMetric===k?T.navy:'transparent', color:activeMetric===k?'#fff':T.text, fontSize:12, cursor:'pointer' }}>{METRIC_LABELS[k]}</button>)}
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sorted} margin={{ left:0, right:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize:10 }} angle={-30} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize:11 }} />
              <Tooltip contentStyle={{ borderRadius:8, fontSize:12 }} />
              <Bar dataKey={activeMetric} name={METRIC_LABELS[activeMetric]}>
                {sorted.map((p,i) => <Cell key={i} fill={p.highlight ? T.gold : T.navy} opacity={p.highlight?1:0.7} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {benchView==='Scatter' && (
        <Card style={{ padding:20 }}>
          <div style={{ fontWeight:700, color:T.navy, marginBottom:12, fontSize:14 }}>Portfolio Temperature vs GAR — Peer Scatter</div>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="gar" name="GAR (%)" tick={{ fontSize:11 }} label={{ value:'GAR (%)', position:'insideBottom', offset:-5, fontSize:12 }} />
              <YAxis dataKey="temp" name="Temp (°C)" tick={{ fontSize:11 }} label={{ value:'Temp (°C)', angle:-90, position:'insideLeft', fontSize:12 }} />
              <Tooltip cursor={{ strokeDasharray:'3 3' }} contentStyle={{ borderRadius:8, fontSize:12 }} formatter={(v,n,p)=>[p.payload.name,'']} />
              <Scatter data={peers.map(p=>({...p}))} fill={T.navy}>
                {peers.map((p,i) => <Cell key={i} fill={p.highlight ? T.gold : T.navy} />)}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </Card>
      )}

      {benchView==='Ranking' && (
        <Card style={{ padding:0, overflow:'hidden' }}>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr style={{ background:T.bg, borderBottom:`2px solid ${T.border}` }}>
                  <th style={{ padding:'10px 14px', textAlign:'left', color:T.textSec, fontWeight:700, fontSize:11 }}>#</th>
                  <th style={{ padding:'10px 14px', textAlign:'left', color:T.textSec, fontWeight:700, fontSize:11 }}>BANK</th>
                  {visibleMetricKeys.map(k => <th key={k} onClick={()=>toggleSort(k)} style={{ padding:'10px 14px', textAlign:'right', color:T.textSec, fontWeight:700, fontSize:11, cursor:'pointer', whiteSpace:'nowrap' }}>{METRIC_LABELS[k]} {sortKey===k?(sortDir==='desc'?'↓':'↑'):''}</th>)}
                  <th style={{ padding:'10px 14px', textAlign:'center', color:T.textSec, fontWeight:700, fontSize:11 }}>TCFD</th>
                  <th style={{ padding:'10px 14px', textAlign:'center', color:T.textSec, fontWeight:700, fontSize:11 }}>CDP</th>
                  <th style={{ padding:'10px 14px', textAlign:'center', color:T.textSec, fontWeight:700, fontSize:11 }}>PCAF</th>
                  <th style={{ padding:'10px 14px', textAlign:'center', color:T.textSec, fontWeight:700, fontSize:11 }}>NZBA</th>
                  <th style={{ padding:'10px 14px', textAlign:'center', color:T.textSec, fontWeight:700, fontSize:11 }}>PRB</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((p,i) => (
                  <tr key={p.name} style={{ background: p.highlight ? '#fffbeb' : i%2===0?T.surface:T.bg, borderBottom:`1px solid ${T.border}` }}>
                    <td style={{ padding:'10px 14px', fontWeight:700, color:p.highlight?T.gold:T.textMut }}>{i+1}</td>
                    <td style={{ padding:'10px 14px', fontWeight:p.highlight?700:500, color:p.highlight?T.gold:T.navy }}>{p.name}{p.highlight?' ★':''}</td>
                    {visibleMetricKeys.map(k => <td key={k} style={{ padding:'10px 14px', textAlign:'right', color:T.text }}>{p[k]}</td>)}
                    <td style={{ padding:'10px 14px', textAlign:'center', color:T.navy, fontWeight:600 }}>{p.tcfd}</td>
                    <td style={{ padding:'10px 14px', textAlign:'center', color:T.navy, fontWeight:600 }}>{p.cdp}</td>
                    <td style={{ padding:'10px 14px', textAlign:'center' }}>{p.pcaf?'✓':'-'}</td>
                    <td style={{ padding:'10px 14px', textAlign:'center' }}>{p.nzba?'✓':'-'}</td>
                    <td style={{ padding:'10px 14px', textAlign:'center' }}>{p.prb?'✓':'-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {benchView==='HeatMap' && (
        <Card style={{ padding:0, overflow:'hidden' }}>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr style={{ background:T.bg }}>
                  <th style={{ padding:'10px 14px', textAlign:'left', color:T.textSec, fontWeight:700, fontSize:11 }}>BANK</th>
                  {visibleMetricKeys.map(k => <th key={k} style={{ padding:'10px 14px', textAlign:'center', color:T.textSec, fontWeight:700, fontSize:11 }}>{METRIC_LABELS[k]}</th>)}
                </tr>
              </thead>
              <tbody>
                {sorted.map((p,i) => (
                  <tr key={p.name} style={{ borderBottom:`1px solid ${T.border}` }}>
                    <td style={{ padding:'10px 14px', fontWeight:p.highlight?700:500, color:p.highlight?T.gold:T.navy, whiteSpace:'nowrap' }}>{p.name}{p.highlight?' ★':''}</td>
                    {visibleMetricKeys.map(k => <td key={k} style={{ padding:'10px 14px', textAlign:'center', background:heatColor(k,p[k]), fontWeight:600, fontSize:12, color:T.navy }}>{p[k]}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Trend comparison */}
      <Card style={{ padding:20 }}>
        <div style={{ fontWeight:700, color:T.navy, marginBottom:8, fontSize:14 }}>Trend Comparison — GAR (%) over 4 Quarters</div>
        <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap' }}>
          {Object.keys(PEER_QUARTERLY).map(p => <button key={p} onClick={()=>setTrendPeers(prev => prev.includes(p) ? prev.filter(x=>x!==p) : prev.length<4 ? [...prev,p] : prev)} style={{ padding:'4px 10px', borderRadius:6, border:`1px solid ${trendPeers.includes(p)?T.navy:T.border}`, background:trendPeers.includes(p)?T.navy:'transparent', color:trendPeers.includes(p)?'#fff':T.text, fontSize:12, cursor:'pointer' }}>{p}</button>)}
          <span style={{ fontSize:11, color:T.textMut, alignSelf:'center' }}>Select up to 4 banks</span>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="q" tick={{ fontSize:11 }} />
            <YAxis tick={{ fontSize:11 }} />
            <Tooltip contentStyle={{ borderRadius:8, fontSize:12 }} />
            {trendPeers.map((p,i) => <Line key={p} type="monotone" dataKey={p} stroke={PEER_COLORS[i%PEER_COLORS.length]} strokeWidth={p==='Our Bank'?3:2} dot={{ r:4 }} name={p} />)}
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Add peer */}
      <Card style={{ padding:16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: addPeer ? 12 : 0 }}>
          <div style={{ fontWeight:700, color:T.navy, fontSize:14 }}>Add Custom Peer Bank</div>
          <Btn variant="ghost" onClick={()=>setAddPeer(!addPeer)} style={{ fontSize:12 }}>{addPeer?'Cancel':'+ Add Peer'}</Btn>
        </div>
        {addPeer && (
          <div style={{ display:'flex', flexWrap:'wrap', gap:10, alignItems:'flex-end' }}>
            {[['name','Bank Name','text'],['gar','GAR (%)','number'],['temp','Temp (°C)','number'],['fe','FE Change (%)','number'],['cet1','CET1 (pp)','number'],['ecl','ECL (£M)','number'],['sc3','Scope 3 (%)','number'],['coal','Coal (£M)','number']].map(([k,lbl,type]) => (
              <div key={k}><div style={{ fontSize:11, color:T.textMut, marginBottom:3 }}>{lbl}</div>
                <input type={type} value={newPeer[k]} onChange={e=>setNewPeer(p=>({...p,[k]:e.target.value}))} placeholder={lbl} style={{ padding:'5px 8px', borderRadius:6, border:`1px solid ${T.border}`, fontSize:12, width: k==='name'?140:80 }} /></div>
            ))}
            <Btn onClick={addPeerSubmit} style={{ fontSize:12 }}>Add</Btn>
          </div>
        )}
      </Card>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const TABS = ['Executive Dashboard','Regulatory Calendar','Risk Appetite','Peer Benchmarking'];

export default function ClimateBankingHubPage(){
  const [tab, setTab] = useState(0);
  const [period, setPeriod] = useState('Q3 2024');
  const [boardMode, setBoardMode] = useState(false);

  return (
    <div style={{ fontFamily:T.font, background:T.bg, minHeight:'100vh', color:T.text }}>
      {/* Header */}
      <div style={{ background:T.navy, padding:'20px 32px', borderBottom:`3px solid ${T.gold}` }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
          <div>
            <div style={{ fontSize:11, letterSpacing:2, color:T.gold, fontWeight:700, marginBottom:4 }}>CLIMATE BANKING HUB</div>
            <div style={{ fontSize:26, fontWeight:800, color:'#fff', letterSpacing:-0.5 }}>Enterprise Climate Intelligence</div>
            <div style={{ fontSize:13, color:'#9bb5d4', marginTop:4 }}>Board-grade climate risk, regulatory compliance & peer benchmarking — {period}</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:11, color:'#9bb5d4' }}>Last updated</div>
            <div style={{ fontSize:14, fontWeight:700, color:'#fff' }}>28 Mar 2026, 09:15</div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ background:T.surface, borderBottom:`1px solid ${T.border}`, padding:'0 32px', display:'flex', gap:0 }}>
        {TABS.map((t,i) => <button key={t} onClick={()=>setTab(i)} style={{ padding:'14px 22px', border:'none', borderBottom:`3px solid ${tab===i?T.navy:'transparent'}`, background:'transparent', color:tab===i?T.navy:T.textSec, fontWeight:tab===i?700:500, fontSize:14, cursor:'pointer', transition:'all .15s' }}>{t}</button>)}
      </div>

      {/* Body */}
      <div style={{ padding:'28px 32px', maxWidth:1400 }}>
        {tab===0 && <Tab1 period={period} setPeriod={setPeriod} boardMode={boardMode} setBoardMode={setBoardMode} />}
        {tab===1 && <Tab2 />}
        {tab===2 && <Tab3 />}
        {tab===3 && <Tab4 />}
      </div>
    </div>
  );
}
