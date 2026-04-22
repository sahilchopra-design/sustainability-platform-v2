import React, { useState, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, ScatterChart, Scatter, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ComposedChart, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, ReferenceArea } from 'recharts';

const T = { bg:'#0f1117', surface:'#1a1d27', surfaceH:'#22263a', border:'#2a2f45', borderL:'#1e2235', navy:'#1e3a5f', gold:'#d4a843', sage:'#2d6a4f', teal:'#0d4f5c', text:'#e8e0d0', textSec:'#a89880', textMut:'#6b6050', red:'#c0392b', green:'#27ae60', amber:'#e67e22', font:"'DM Sans',sans-serif", mono:"'JetBrains Mono',monospace" };
const sr = s => { let x = Math.sin(s+1)*10000; return x - Math.floor(x); };
const norm = (mean, sd, n=12) => { let sum=0; for (let i=0;i<n;i++) sum += Math.random(); return mean + sd*(sum - n/2)*Math.sqrt(12/n); };

// === ICVCM CORE CARBON PRINCIPLES (10 principles, final 2024 revision) ===
const ICVCM_CCP = [
  { id:1, principle:'Effective governance', category:'Governance', weight:10, description:'Transparent, independent governance body; conflict-of-interest policies; public stakeholder consultation', benchmark:85 },
  { id:2, principle:'Tracking', category:'Governance', weight:8, description:'Unique serial numbers; centralised registry; transaction immutability; retirement verification', benchmark:90 },
  { id:3, principle:'Transparency', category:'Governance', weight:8, description:'Public disclosure of project documents, monitoring reports, verification statements, credit issuance', benchmark:85 },
  { id:4, principle:'Robust independent third-party validation/verification', category:'Governance', weight:9, description:'Accredited VVB (ISO 14065 or equivalent); rotation policy; site visits required', benchmark:88 },
  { id:5, principle:'Additionality', category:'Emission Impact', weight:12, description:'Financial additionality, regulatory additionality, common practice test, investment analysis', benchmark:75 },
  { id:6, principle:'Permanence', category:'Emission Impact', weight:10, description:'100+ yr durability for removals; buffer pools 20–40% for NbS; reversal monitoring', benchmark:70 },
  { id:7, principle:'Robust quantification of emission reductions and removals', category:'Emission Impact', weight:12, description:'Dynamic baselines; conservative assumptions; uncertainty discounts; most-current methodology', benchmark:78 },
  { id:8, principle:'No double counting', category:'Emission Impact', weight:10, description:'Corresponding Adjustments (CA) tracked; unique retirement; registry interoperability; CORSIA + NDC separation', benchmark:82 },
  { id:9, principle:'Sustainable development benefits and safeguards', category:'Sustainable Dev', weight:8, description:'SDG alignment (8 targets typical); social safeguards (FPIC); biodiversity net gain; gender-responsive', benchmark:80 },
  { id:10, principle:'Contribution to net-zero transition', category:'Sustainable Dev', weight:13, description:'Alignment with 1.5°C pathway; non-locking into fossil infra; transformational activities prioritised', benchmark:72 },
];

// === VCMI CLAIMS CODE 2.0 (2025 revision) — buyer-side integrity ===
const VCMI_TIERS = [
  { tier:'Silver', requirements:['Public commitment to near-term science-based target','20–60% progress vs target','Annual disclosure','Claim: "Carbon Integrity Silver"'], creditQuality:'ICVCM CCP-labelled minimum', discount:0 },
  { tier:'Gold', requirements:['Near-term SBTi-validated target','60–80% progress vs target','Annual assurance (limited)','Claim: "Carbon Integrity Gold"'], creditQuality:'ICVCM CCP + CORSIA OISC', discount:15 },
  { tier:'Platinum', requirements:['SBTi Net-Zero Standard validated','80–100% on pathway','Reasonable assurance','Claim: "Carbon Integrity Platinum"'], creditQuality:'ICVCM CCP + A6.4ER + Premium CDR', discount:30 },
];

// === CREDIT RATINGS (Sylvera / BeZero / Calyx / Renoster as of April 2026) ===
const RATINGS_AGENCIES = [
  { agency:'Sylvera', coverage:'6,200 projects', scale:'AAA–D (8 grades)', specialty:'REDD+, ARR, cookstoves, IFM', pricingBps:3.5, methodology:'Over-crediting risk, permanence, additionality, co-benefits', founded:2020 },
  { agency:'BeZero', coverage:'4,800 projects', scale:'AAA–D (8 grades)', specialty:'Full VCM + A6.4', pricingBps:2.8, methodology:'Likelihood of achieving 1tCO₂e avoidance/removal claim', founded:2020 },
  { agency:'Calyx Global', coverage:'3,200 projects', scale:'A–E (5 grades)', specialty:'Nature-based, industrial', pricingBps:3.0, methodology:'Greenhouse Gas Integrity + SDG alignment', founded:2021 },
  { agency:'Renoster', coverage:'2,100 projects', scale:'5-star', specialty:'Nature (forestry), IFM', pricingBps:2.5, methodology:'Forest carbon focus; LiDAR verification', founded:2020 },
  { agency:'S&P TruCost VCM', coverage:'1,400 projects', scale:'1–10', specialty:'Tech CDR + industrial', pricingBps:4.0, methodology:'Quantitative risk-adjusted score', founded:2024 },
];

// === SAMPLE PROJECT PORTFOLIO (for scoring/rating demonstration) ===
const PROJECT_PORTFOLIO = [
  { id:'IND-SOL-001', name:'NTPC Rajasthan 2GW Solar', type:'Avoidance', methodology:'ACM0002 + JCM', vintage:2024, volumeKtCO2:1200, pricePerT:18, sylvera:'AA', bezero:'AAA', calyx:'A', ccpLabel:true, corsiaEligible:true, jcmLinked:true, a6Mode:'6.2', buffer:10, region:'India', scopeOfClaim:'Grid EF displacement' },
  { id:'IND-WIN-002', name:'Greenko Andhra Wind 800MW', type:'Avoidance', methodology:'ACM0002', vintage:2023, volumeKtCO2:780, pricePerT:14, sylvera:'A', bezero:'A', calyx:'B', ccpLabel:true, corsiaEligible:true, jcmLinked:false, a6Mode:null, buffer:12, region:'India', scopeOfClaim:'Grid EF displacement' },
  { id:'IND-GH2-003', name:'ACME Green H2 500ktpa', type:'Avoidance', methodology:'A6.4 SOL.001', vintage:2025, volumeKtCO2:2300, pricePerT:28, sylvera:'AA', bezero:'AA', calyx:'A', ccpLabel:true, corsiaEligible:true, jcmLinked:true, a6Mode:'6.4', buffer:5, region:'India', scopeOfClaim:'Grey H2 displacement' },
  { id:'IND-MNG-004', name:'Sundarbans Mangrove 40Kha', type:'Removal + Avoidance', methodology:'VM0033 v2.1', vintage:2024, volumeKtCO2:180, pricePerT:42, sylvera:'BBB', bezero:'BBB', calyx:'B', ccpLabel:false, corsiaEligible:true, jcmLinked:false, a6Mode:null, buffer:35, region:'India', scopeOfClaim:'Blue carbon sequestration' },
  { id:'IND-BIO-005', name:'Gujarat BECCS Pilot', type:'Removal (Durable)', methodology:'Puro CO₂ Removal', vintage:2025, volumeKtCO2:45, pricePerT:220, sylvera:'AAA', bezero:'AAA', calyx:'A', ccpLabel:true, corsiaEligible:false, jcmLinked:true, a6Mode:'6.4', buffer:2, region:'India', scopeOfClaim:'Geological storage 1000+ yr' },
  { id:'IND-CKS-006', name:'UP Clean Cookstoves 2M HH', type:'Avoidance', methodology:'AMS-II.G', vintage:2022, volumeKtCO2:520, pricePerT:6, sylvera:'B', bezero:'C', calyx:'C', ccpLabel:false, corsiaEligible:false, jcmLinked:false, a6Mode:null, buffer:18, region:'India', scopeOfClaim:'Fuel displacement; SDG' },
  { id:'IND-REDD-007', name:'Meghalaya REDD+ 50Kha', type:'Avoidance', methodology:'VM0048 v1.0', vintage:2024, volumeKtCO2:340, pricePerT:11, sylvera:'BB', bezero:'B', calyx:'C', ccpLabel:false, corsiaEligible:true, jcmLinked:false, a6Mode:null, buffer:25, region:'India', scopeOfClaim:'Avoided deforestation' },
  { id:'IND-DAC-008', name:'Hyderabad DAC 10ktpa', type:'Removal (Durable)', methodology:'A6.4 CDR.004', vintage:2026, volumeKtCO2:10, pricePerT:580, sylvera:'AAA', bezero:'AAA', calyx:'A', ccpLabel:true, corsiaEligible:false, jcmLinked:true, a6Mode:'6.4', buffer:1, region:'India', scopeOfClaim:'Direct air capture + storage' },
];

// === A6.4 METHODOLOGY REGISTRY (as of Apr 2026 — UNFCCC SB published list) ===
const A64_METHODOLOGIES = [
  { code:'A6.4-SOL.001', title:'Grid-connected solar PV displacement', type:'Energy', category:'Avoidance', approvedDate:'2024-11', crediting:5, baseline:'Dynamic grid EF; ex-ante determined ex-post revised', pipelineMt:1800 },
  { code:'A6.4-WND.002', title:'Grid-connected onshore/offshore wind', type:'Energy', category:'Avoidance', approvedDate:'2025-02', crediting:5, baseline:'Dynamic grid EF', pipelineMt:920 },
  { code:'A6.4-GH2.003', title:'Green hydrogen via electrolysis', type:'Energy', category:'Avoidance', approvedDate:'2025-06', crediting:7, baseline:'Grey H2 SMR benchmark', pipelineMt:340 },
  { code:'A6.4-CDR.004', title:'Direct Air Capture + geological storage', type:'Removal', category:'Engineered CDR', approvedDate:'2025-09', crediting:10, baseline:'Zero (atmosphere removal)', pipelineMt:12 },
  { code:'A6.4-ARR.005', title:'Afforestation, Reforestation, Revegetation', type:'Nature', category:'Removal', approvedDate:'2025-11', crediting:10, baseline:'Deforestation BAU trajectory', pipelineMt:280 },
  { code:'A6.4-BECCS.006', title:'Bioenergy with CCS', type:'Hybrid', category:'Removal', approvedDate:'2026-01', crediting:10, baseline:'Zero (permanent geological storage)', pipelineMt:85 },
  { code:'A6.4-EE.007', title:'Industrial Energy Efficiency', type:'Efficiency', category:'Avoidance', approvedDate:'2026-03', crediting:5, baseline:'Sector-specific intensity benchmark', pipelineMt:220 },
];

// === DIGITAL MRV INFRASTRUCTURE (as of April 2026) ===
const MRV_STACK = [
  { tier:'L1 Raw Sensor', example:'Satellite imagery (Planet Labs, Sentinel-2), IoT flow meters, inverter telemetry', frequency:'Real-time → daily', cost:'$0.02–0.20/ha/yr', accuracy:'±3–5%' },
  { tier:'L2 Ground Truth', example:'LiDAR biomass survey, eddy covariance flux towers, soil core sampling', frequency:'Annual–quinquennial', cost:'$5–15/ha/yr', accuracy:'±1–3%' },
  { tier:'L3 Algorithmic Processing', example:'AI/ML emission factor derivation, baseline modelling, deforestation alerts', frequency:'Continuous', cost:'$0.10/credit', accuracy:'±2–4%' },
  { tier:'L4 Registry Issuance', example:'Verra Registry 3.0, Gold Standard Impact Registry, UNFCCC A6.4 CDM Registry', frequency:'Per issuance event', cost:'$0.05–0.15/credit', accuracy:'–' },
  { tier:'L5 Tokenization / Blockchain', example:'Toucan (retired), Isometric (durable CDR), ClimateTrade, KlimaDAO history', frequency:'Per transaction', cost:'$0.01/credit', accuracy:'–' },
];

// === VINTAGE & DURABILITY PRICE MATRIX (April 2026 spot) ===
const VINTAGE_DURABILITY = [
  { durability:'<100 yr NbS', vintage2019:3, vintage2022:6, vintage2024:9, vintage2026:12, icvcmPct:10 },
  { durability:'100-yr NbS (buffered)', vintage2019:4, vintage2022:9, vintage2024:14, vintage2026:22, icvcmPct:35 },
  { durability:'Engineered (100+ yr)', vintage2019:35, vintage2022:60, vintage2024:85, vintage2026:120, icvcmPct:78 },
  { durability:'Durable CDR (1000+ yr)', vintage2019:180, vintage2022:280, vintage2024:380, vintage2026:480, icvcmPct:95 },
];

// === FORWARD CURVE WITH IMPLIED VOL (EUA, CCert, VCS, A6.4ER) ===
const FORWARD_CURVE = [
  { tenor:'Spot', eua:72, eua_iv:28, ccert:14, ccert_iv:52, vcs:9, vcs_iv:62, a64er:42, a64er_iv:38 },
  { tenor:'3M', eua:74, eua_iv:30, ccert:15, ccert_iv:55, vcs:10, vcs_iv:65, a64er:44, a64er_iv:40 },
  { tenor:'6M', eua:76, eua_iv:31, ccert:16, ccert_iv:58, vcs:10, vcs_iv:67, a64er:46, a64er_iv:42 },
  { tenor:'1Y', eua:80, eua_iv:32, ccert:18, ccert_iv:60, vcs:11, vcs_iv:68, a64er:50, a64er_iv:44 },
  { tenor:'2Y', eua:86, eua_iv:34, ccert:22, ccert_iv:62, vcs:13, vcs_iv:70, a64er:58, a64er_iv:46 },
  { tenor:'3Y', eua:91, eua_iv:35, ccert:26, ccert_iv:63, vcs:15, vcs_iv:72, a64er:66, a64er_iv:48 },
  { tenor:'5Y', eua:101, eua_iv:36, ccert:34, ccert_iv:65, vcs:19, vcs_iv:73, a64er:84, a64er_iv:50 },
  { tenor:'10Y', eua:125, eua_iv:38, ccert:55, ccert_iv:68, vcs:32, vcs_iv:74, a64er:140, a64er_iv:52 },
];

// === CROSS-MARKET CORRELATION MATRIX (5Y rolling, monthly returns) ===
const CORRELATION_MATRIX = [
  { id:'EUA',     EUA:1.00, CCert:0.22, JCM_ITMO:0.18, VCS:0.08, A64ER:0.35, JGX:0.45, Brent:0.31, Elec:0.58 },
  { id:'CCert',   EUA:0.22, CCert:1.00, JCM_ITMO:0.41, VCS:0.12, A64ER:0.28, JGX:0.15, Brent:0.12, Elec:0.32 },
  { id:'JCM_ITMO',EUA:0.18, CCert:0.41, JCM_ITMO:1.00, VCS:0.24, A64ER:0.54, JGX:0.62, Brent:0.08, Elec:0.19 },
  { id:'VCS',     EUA:0.08, CCert:0.12, JCM_ITMO:0.24, VCS:1.00, A64ER:0.31, JGX:0.09, Brent:0.04, Elec:0.06 },
  { id:'A64ER',   EUA:0.35, CCert:0.28, JCM_ITMO:0.54, VCS:0.31, A64ER:1.00, JGX:0.48, Brent:0.15, Elec:0.22 },
  { id:'JGX',     EUA:0.45, CCert:0.15, JCM_ITMO:0.62, VCS:0.09, A64ER:0.48, JGX:1.00, Brent:0.22, Elec:0.41 },
];

// === BUFFER POOL / LEAKAGE / REVERSAL RISK MODEL ===
const BUFFER_DEFAULTS = {
  arr_tropical: 18, arr_boreal: 22, arr_temperate: 15,
  redd_jurisdictional: 10, redd_project: 25,
  ifm: 20, mangrove: 30, seagrass: 28, saltmarsh: 25, cookstoves: 5,
  engineeredcdr: 2, beccs: 5, dac_storage: 1,
};

// === KPI & UTILITY COMPONENTS ===
const Kpi = ({ label, value, sub, color }) => (
  <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:'16px 20px', minWidth:170 }}>
    <div style={{ color:T.textMut, fontSize:11, fontFamily:T.mono, textTransform:'uppercase', letterSpacing:1 }}>{label}</div>
    <div style={{ color:color||T.gold, fontSize:23, fontWeight:700, fontFamily:T.mono, margin:'6px 0 2px' }}>{value}</div>
    {sub && <div style={{ color:T.textSec, fontSize:11 }}>{sub}</div>}
  </div>
);
const Tab = ({ label, active, onClick }) => (
  <button onClick={onClick} style={{ padding:'8px 16px', background:active?T.navy:'transparent', color:active?T.gold:T.textSec, border:`1px solid ${active?T.gold:T.border}`, borderRadius:6, cursor:'pointer', fontFamily:T.mono, fontSize:12, whiteSpace:'nowrap' }}>{label}</button>
);
const Section = ({ children }) => (
  <div style={{ color:T.gold, fontFamily:T.mono, fontSize:13, fontWeight:700, letterSpacing:1, textTransform:'uppercase', borderBottom:`1px solid ${T.border}`, paddingBottom:6, marginBottom:14 }}>{children}</div>
);

// === ANALYTICAL ENGINES ===
const calcIcvcmScore = (scores) => {
  const weighted = ICVCM_CCP.reduce((acc, p, i) => acc + (scores[i] || 0) * p.weight, 0);
  const maxWeight = ICVCM_CCP.reduce((a, p) => a + p.weight * 100, 0);
  return (weighted / maxWeight * 100).toFixed(1);
};
const ratingToNum = (r) => ({ 'AAA':7, 'AA':6, 'A':5, 'BBB':4, 'BB':3, 'B':2, 'C':1, 'D':0 }[r] ?? 0);
const compositeRating = (proj) => {
  const sy = ratingToNum(proj.sylvera);
  const bz = ratingToNum(proj.bezero);
  const cx = { A:5, B:3.5, C:2, D:1, E:0 }[proj.calyx] ?? 0;
  const composite = (sy * 0.4 + bz * 0.4 + cx * 0.2);
  return { raw: composite.toFixed(2), label: composite>=5.5?'Investment Grade':composite>=3.5?'Acceptable':composite>=2?'Marginal':'Avoid' };
};
const calcBufferAdjustedVolume = (vol, bufferPct) => vol * (1 - bufferPct/100);
const calcVintageDiscount = (vintage) => {
  if (vintage <= 2019) return 45;
  if (vintage <= 2022) return 30;
  if (vintage <= 2024) return 12;
  return 0;
};
const calcMonteCarloNpv = ({ annVolume, basePrice, priceVol, creditYears, discRate, nSim=1000 }) => {
  const results = [];
  for (let i=0; i<nSim; i++) {
    let pv = 0;
    for (let y=1; y<=creditYears; y++) {
      const yearPrice = basePrice * (1 + 0.05*(y-1)) * (1 + norm(0, priceVol/100));
      pv += (annVolume * Math.max(0, yearPrice)) / Math.pow(1+discRate/100, y);
    }
    results.push(pv);
  }
  results.sort((a,b) => a-b);
  return {
    p10: (results[Math.floor(nSim*0.1)]/1e6).toFixed(1),
    p50: (results[Math.floor(nSim*0.5)]/1e6).toFixed(1),
    p90: (results[Math.floor(nSim*0.9)]/1e6).toFixed(1),
    mean: (results.reduce((a,b)=>a+b,0)/nSim/1e6).toFixed(1),
  };
};

// === DIGITAL MRV SYNTHETIC DATA (satellite-derived) ===
const mrvTimeseries = Array.from({length:52}, (_,i) => ({
  week:i+1,
  ndvi: 0.72 + 0.05*Math.sin(i/8) + sr(i)*0.03,
  canopyHa: 42000 + i*15 + sr(i*3)*80,
  deforestAlerts: Math.max(0, Math.floor(sr(i*7)*8 - 3)),
  co2Flux: 2.8 + 0.4*Math.sin(i/12) + sr(i*11)*0.2,
  verifiedCredits: Math.floor(7000 + i*140 + sr(i*5)*200),
}));

export default function CarbonIntegrityMrvAnalyticsPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [selProj, setSelProj] = useState(0);
  const [scores, setScores] = useState(ICVCM_CCP.map(p => p.benchmark));
  const [mcVolume, setMcVolume] = useState(500000);
  const [mcBasePrice, setMcBasePrice] = useState(18);
  const [mcVol, setMcVol] = useState(35);
  const [mcYears, setMcYears] = useState(7);
  const [mcDisc, setMcDisc] = useState(10);
  const [bufferPct, setBufferPct] = useState(20);
  const [vintageFilter, setVintageFilter] = useState('all');
  const [portfolioWeights, setPortfolioWeights] = useState(PROJECT_PORTFOLIO.map(()=>100/PROJECT_PORTFOLIO.length));

  const proj = PROJECT_PORTFOLIO[selProj];
  const icvcmTotal = calcIcvcmScore(scores);
  const compRating = compositeRating(proj);
  const vintageDisc = calcVintageDiscount(proj.vintage);
  const mcResults = useMemo(() => calcMonteCarloNpv({ annVolume:mcVolume, basePrice:mcBasePrice, priceVol:mcVol, creditYears:mcYears, discRate:mcDisc }), [mcVolume, mcBasePrice, mcVol, mcYears, mcDisc]);
  const bufferNetVol = calcBufferAdjustedVolume(proj.volumeKtCO2*1000, bufferPct);

  // Portfolio quality aggregation
  const portfolioStats = useMemo(() => {
    const totalVol = PROJECT_PORTFOLIO.reduce((a,p,i) => a + p.volumeKtCO2 * portfolioWeights[i]/100, 0);
    const wAvgPrice = PROJECT_PORTFOLIO.reduce((a,p,i) => a + p.pricePerT * p.volumeKtCO2 * portfolioWeights[i]/100, 0) / totalVol;
    const ccpPct = PROJECT_PORTFOLIO.reduce((a,p,i) => a + (p.ccpLabel?portfolioWeights[i]:0), 0);
    const corsiaPct = PROJECT_PORTFOLIO.reduce((a,p,i) => a + (p.corsiaEligible?portfolioWeights[i]:0), 0);
    const durablePct = PROJECT_PORTFOLIO.reduce((a,p,i) => a + (p.type.includes('Durable')?portfolioWeights[i]:0), 0);
    const avgBuffer = PROJECT_PORTFOLIO.reduce((a,p,i) => a + p.buffer * portfolioWeights[i]/100, 0);
    return { totalVol: totalVol.toFixed(0), wAvgPrice: wAvgPrice.toFixed(1), ccpPct: ccpPct.toFixed(0), corsiaPct: corsiaPct.toFixed(0), durablePct: durablePct.toFixed(0), avgBuffer: avgBuffer.toFixed(1) };
  }, [portfolioWeights]);

  const tabs = ['Overview','ICVCM CCP Scoring','VCMI Claims Tier','Rating Agencies','Digital MRV','Vintage & Durability','Buffer & Leakage','Forward Curve & IV','Monte Carlo NPV','Correlation Matrix','A6.4 Registry','Portfolio Quality'];

  return (
    <div style={{ background:T.bg, minHeight:'100vh', color:T.text, fontFamily:T.font, padding:24 }}>
      {/* HEADER */}
      <div style={{ borderBottom:`2px solid ${T.gold}`, paddingBottom:16, marginBottom:24 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <div style={{ color:T.textMut, fontSize:11, fontFamily:T.mono, letterSpacing:2, textTransform:'uppercase' }}>EP-EA7 · Carbon Credit Integrity, MRV & Quantitative Analytics</div>
            <h1 style={{ margin:'4px 0 8px', fontSize:28, fontWeight:700, color:T.text }}>Carbon Integrity, MRV & Value Identification Hub</h1>
            <div style={{ color:T.textSec, fontSize:13 }}>ICVCM CCP · VCMI Claims 2.0 · Sylvera/BeZero/Calyx ratings · Article 6.4 SB · Digital MRV · Monte Carlo valuation · April 2026 best practice</div>
          </div>
          <div style={{ textAlign:'right', fontFamily:T.mono, fontSize:11, color:T.textMut }}>
            <div>ICVCM CCP-labelled (Apr 2026)</div>
            <div style={{ color:T.gold, fontSize:20, fontWeight:700 }}>284 MtCO₂e</div>
            <div>A6.4 Registered Methodologies</div>
            <div style={{ color:T.green, fontSize:16, fontWeight:700 }}>7 approved · 18 pipeline</div>
          </div>
        </div>
      </div>

      {/* KPI STRIP */}
      <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:24 }}>
        <Kpi label="Global VCM Volume" value="680 MtCO₂e" sub="2024 retirements · 62% nature / 38% tech" color={T.green} />
        <Kpi label="CCP-Labelled Share" value="42%" sub="ICVCM high-integrity segment 2026" color={T.gold} />
        <Kpi label="Premium Durable CDR" value="$480/t" sub="1000+ yr storage · 2026 spot · +12% vs 2025" color={T.navy} />
        <Kpi label="Quality Premium (CCP)" value="+35%" sub="CCP-labelled vs non-labelled same vintage" color={T.teal} />
        <Kpi label="Sylvera Avg VCM Grade" value="BBB" sub="4,800 projects rated · median" color={T.amber} />
        <Kpi label="A6.4 Pipeline Value" value="$18.4 Bn" sub="Notional at $25/t expected 2027–2030" color={T.red} />
      </div>

      {/* TABS */}
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:20 }}>
        {tabs.map((t,i) => <Tab key={i} label={t} active={activeTab===i} onClick={()=>setActiveTab(i)} />)}
      </div>

      {/* ============ TAB 0: OVERVIEW ============ */}
      {activeTab===0 && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
            <Section>April 2026 Integrity Framework Stack</Section>
            <div style={{ color:T.textSec, fontSize:13, lineHeight:1.8 }}>
              The April 2026 best-practice framework for carbon credit integrity operates as a four-layer stack:
              <br/><br/>
              <span style={{ color:T.gold }}>Layer 1 — Supply-Side Integrity (ICVCM CCPs):</span> The Integrity Council for the Voluntary Carbon Market finalised its 10 Core Carbon Principles in late 2023. By April 2026, 42% of global VCM supply (~284 MtCO₂e) carries the CCP label, commanding a <span style={{ color:T.green }}>+35% price premium</span> vs non-labelled credits of identical vintage and type.
              <br/><br/>
              <span style={{ color:T.teal }}>Layer 2 — Article 6.4 Methodologies:</span> The UNFCCC Article 6.4 Supervisory Body (A6.4 SB) has approved 7 methodologies as of April 2026 (SOL.001, WND.002, GH2.003, CDR.004, ARR.005, BECCS.006, EE.007), with 18 in pipeline. A6.4ER credits trade at $42/t spot — roughly 2.5× higher than comparable VCS credits due to UNFCCC backing and bilateral Article 6.2 fungibility.
              <br/><br/>
              <span style={{ color:T.amber }}>Layer 3 — Demand-Side Integrity (VCMI Claims Code 2.0):</span> Silver/Gold/Platinum tiers gate corporate claims. A "Carbon Integrity Platinum" claim requires SBTi Net-Zero Standard validation, 80%+ pathway progress, reasonable assurance, and exclusively ICVCM-CCP + A6.4ER + Premium CDR credits.
              <br/><br/>
              <span style={{ color:T.red }}>Layer 4 — Rating Agency Overlay:</span> Sylvera (6,200 projects), BeZero (4,800), Calyx (3,200), Renoster (2,100), S&P TruCost VCM (1,400) provide independent credit-by-credit quality scores. Institutional buyers (corporates, asset managers) now mandate minimum composite rating of BBB+/A for SBTi-aligned offsetting.
            </div>
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
            <Section>Integrity Premium Cascade ($/tCO₂e, April 2026)</Section>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart layout="vertical" data={[
                { tier:'Unrated Legacy NbS (2019)', price:4, color:T.textMut },
                { tier:'VCS standard (2022–24)', price:9, color:T.textSec },
                { tier:'CCP-labelled VCS', price:14, color:T.sage },
                { tier:'CORSIA-eligible', price:16, color:T.teal },
                { tier:'CCP + CORSIA + Co-benefits', price:22, color:T.green },
                { tier:'Article 6.4ER (Energy)', price:42, color:T.gold },
                { tier:'Premium CDR (100yr)', price:120, color:T.amber },
                { tier:'Durable CDR (1000yr, DAC)', price:480, color:T.navy },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fill:T.textSec, fontSize:10 }} />
                <YAxis type="category" dataKey="tier" tick={{ fill:T.textSec, fontSize:10 }} width={180} />
                <Tooltip contentStyle={{ background:T.surfaceH, border:`1px solid ${T.border}`, color:T.text }} formatter={(v)=>[`$${v}/tCO₂e`]} />
                <Bar dataKey="price" fill={T.gold} radius={[0,3,3,0]} name="Spot Price" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20, gridColumn:'1/-1' }}>
            <Section>Integrity Value Chain — Where Value is Identified & Monitored</Section>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:10 }}>
              {[
                { step:'1. Baseline Setting', detail:'Dynamic vs static baselines · Additionality test (4-prong) · Common-practice benchmark · Uncertainty discount 5–15%', value:'Determines volume; 20–40% haircut if fail' },
                { step:'2. MRV Infrastructure', detail:'Satellite (Planet Labs, Sentinel-2) · IoT sensors · LiDAR ground truth · AI/ML processing · Blockchain issuance', value:'Costs 2–8% of credit price; error ±2–5%' },
                { step:'3. Validation (VVB)', detail:'ISO 14065 accredited · Rotation (max 5yr same VVB) · Site visits mandatory · Stakeholder consultation', value:'1–3% of credit price; gatekeeper' },
                { step:'4. Registry Issuance', detail:'Unique serial numbers · Corresponding Adjustment (CA) tracking · Public project documents · Retirement verification', value:'0.05–0.15/credit; reputational lever' },
                { step:'5. Rating & Labelling', detail:'Sylvera/BeZero/Calyx/Renoster · ICVCM CCP · CORSIA OISC · SBTi BVCM category', value:'+15–50% premium for top-rated' },
                { step:'6. Demand Matching', detail:'VCMI tier-consistent buyer · SBTi alignment · Corresponding Adjustment execution · Retirement for claim', value:'Realised price discovery' },
              ].map((s,i) => (
                <div key={i} style={{ background:T.surfaceH, borderRadius:6, padding:12, borderTop:`2px solid ${T.gold}` }}>
                  <div style={{ color:T.gold, fontFamily:T.mono, fontSize:11, fontWeight:700, marginBottom:6 }}>{s.step}</div>
                  <div style={{ color:T.text, fontSize:11, lineHeight:1.5, marginBottom:8 }}>{s.detail}</div>
                  <div style={{ color:T.green, fontSize:11, fontStyle:'italic', borderTop:`1px solid ${T.border}`, paddingTop:6 }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============ TAB 1: ICVCM CCP SCORING ============ */}
      {activeTab===1 && (
        <div style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr', gap:20 }}>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
            <Section>ICVCM Core Carbon Principles — Weighted Assessment</Section>
            <div style={{ color:T.textSec, fontSize:12, marginBottom:16 }}>Adjust scores (0–100) for each principle. Weights reflect ICVCM Assessment Framework v1.2 (2024 revision). Composite score ≥80 = CCP-Label eligible.</div>
            <div style={{ maxHeight:520, overflowY:'auto', paddingRight:6 }}>
              {ICVCM_CCP.map((p,i) => (
                <div key={p.id} style={{ padding:12, background:T.surfaceH, borderRadius:6, marginBottom:8, borderLeft:`3px solid ${p.category==='Governance'?T.teal:p.category==='Emission Impact'?T.gold:T.green}` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                    <div>
                      <span style={{ color:T.gold, fontFamily:T.mono, fontSize:11 }}>CCP #{p.id} · weight {p.weight}</span>
                      <span style={{ color:T.text, fontSize:13, fontWeight:600, marginLeft:8 }}>{p.principle}</span>
                    </div>
                    <span style={{ color:scores[i]>=80?T.green:scores[i]>=60?T.amber:T.red, fontFamily:T.mono, fontSize:14, fontWeight:700 }}>{scores[i]}</span>
                  </div>
                  <div style={{ color:T.textSec, fontSize:11, marginBottom:6 }}>{p.description}</div>
                  <input type="range" min={0} max={100} step={1} value={scores[i]} onChange={e=>{ const ns=[...scores]; ns[i]=+e.target.value; setScores(ns); }} style={{ width:'100%' }} />
                  <div style={{ color:T.textMut, fontSize:10, marginTop:2 }}>Market benchmark: {p.benchmark} · {p.category}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20, marginBottom:16 }}>
              <Section>Composite Score</Section>
              <div style={{ textAlign:'center', padding:20 }}>
                <div style={{ fontSize:56, fontWeight:700, fontFamily:T.mono, color:icvcmTotal>=80?T.green:icvcmTotal>=70?T.amber:T.red }}>{icvcmTotal}</div>
                <div style={{ color:T.textSec, fontSize:13 }}>/ 100 weighted · {icvcmTotal>=80?'✓ CCP-Label Eligible':icvcmTotal>=70?'⚠ Remediation Required':'✗ Not Eligible'}</div>
                <div style={{ marginTop:12, padding:10, background:T.surfaceH, borderRadius:4 }}>
                  <div style={{ color:T.gold, fontFamily:T.mono, fontSize:11, marginBottom:4 }}>Price Premium Implied</div>
                  <div style={{ color:T.green, fontFamily:T.mono, fontSize:18 }}>+{icvcmTotal>=80?'35':icvcmTotal>=70?'15':'0'}%</div>
                </div>
              </div>
            </div>
            <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
              <Section>Radar — Category Averages</Section>
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={[
                  { cat:'Governance', score: (scores[0]+scores[1]+scores[2]+scores[3])/4 },
                  { cat:'Quantification', score: scores[6] },
                  { cat:'Additionality', score: scores[4] },
                  { cat:'Permanence', score: scores[5] },
                  { cat:'No Double Count', score: scores[7] },
                  { cat:'SDG Safeguards', score: scores[8] },
                  { cat:'Net-Zero Align', score: scores[9] },
                ]}>
                  <PolarGrid stroke={T.border} />
                  <PolarAngleAxis dataKey="cat" tick={{ fill:T.textSec, fontSize:10 }} />
                  <PolarRadiusAxis domain={[0,100]} tick={{ fill:T.textMut, fontSize:9 }} />
                  <Radar dataKey="score" stroke={T.gold} fill={T.gold} fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ============ TAB 2: VCMI CLAIMS TIER ============ */}
      {activeTab===2 && (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:20 }}>
            {VCMI_TIERS.map((t,i) => (
              <div key={i} style={{ background:T.surface, border:`2px solid ${i===0?'#cd7f32':i===1?'#ffd700':'#e5e4e2'}`, borderRadius:8, padding:20 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                  <div style={{ fontSize:18, fontWeight:700, color:i===0?'#cd7f32':i===1?'#ffd700':'#e5e4e2' }}>VCMI {t.tier}</div>
                  <div style={{ color:T.textMut, fontFamily:T.mono, fontSize:10 }}>Tier {i+1}</div>
                </div>
                <div style={{ color:T.textSec, fontSize:11, marginBottom:10 }}>Required credit quality:<br/><span style={{ color:T.gold, fontFamily:T.mono }}>{t.creditQuality}</span></div>
                <div style={{ color:T.textMut, fontSize:11, marginBottom:4 }}>Requirements:</div>
                <ul style={{ paddingLeft:18, color:T.textSec, fontSize:11, lineHeight:1.7, margin:'4px 0' }}>
                  {t.requirements.map((r,j) => <li key={j}>{r}</li>)}
                </ul>
                <div style={{ marginTop:10, padding:8, background:T.surfaceH, borderRadius:4, display:'flex', justifyContent:'space-between' }}>
                  <span style={{ color:T.textSec, fontSize:11 }}>Credit price discount vs Platinum</span>
                  <span style={{ color:i===2?T.green:T.amber, fontFamily:T.mono }}>{t.discount===0?'0% (ref)':`+${t.discount}% allowed`}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
            <Section>VCMI Claim Flow — Corporate Decision Tree</Section>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
              {[
                { step:'Eligibility Gate', detail:'Public SBTi near-term commitment · Annual GHG disclosure · Assurance level declared', pass:'→ Enter VCMI' },
                { step:'Performance Measurement', detail:'Near-term target progress % · Scope 1+2+3 measured & reported · Reduction vs baseline year', pass:'→ Tier assignment' },
                { step:'Tier Assignment', detail:'Silver: 20–60% progress · Gold: 60–80% · Platinum: 80–100% on pathway to SBTi-validated NZ', pass:'→ Credit sourcing' },
                { step:'Credit Retirement', detail:'Source ICVCM CCP-labelled (min) · CORSIA/A6.4ER for Gold+ · Premium CDR for Platinum · retire with public claim', pass:'→ Verified Claim' },
              ].map((s,i) => (
                <div key={i} style={{ background:T.surfaceH, borderRadius:6, padding:12, borderTop:`2px solid ${T.gold}` }}>
                  <div style={{ color:T.gold, fontFamily:T.mono, fontSize:12, fontWeight:700, marginBottom:6 }}>{i+1}. {s.step}</div>
                  <div style={{ color:T.textSec, fontSize:11, lineHeight:1.6, marginBottom:8 }}>{s.detail}</div>
                  <div style={{ color:T.green, fontFamily:T.mono, fontSize:11, fontWeight:600 }}>{s.pass}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============ TAB 3: RATING AGENCIES ============ */}
      {activeTab===3 && (
        <div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20, marginBottom:16 }}>
            <Section>Rating Agency Landscape (April 2026)</Section>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:T.surfaceH }}>
                  {['Agency','Coverage','Scale','Specialty','Subscription ($k/yr)','Methodology','Founded'].map(h => <th key={h} style={{ padding:'8px 12px', color:T.textSec, fontSize:11, fontFamily:T.mono, textAlign:'left', borderBottom:`1px solid ${T.border}` }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {RATINGS_AGENCIES.map((a,i) => (
                  <tr key={i} style={{ background:i%2===0?T.surface:T.surfaceH }}>
                    <td style={{ padding:'8px 12px', color:T.gold, fontFamily:T.mono, fontSize:12, fontWeight:700, borderBottom:`1px solid ${T.borderL}` }}>{a.agency}</td>
                    <td style={{ padding:'8px 12px', color:T.text, fontSize:12, borderBottom:`1px solid ${T.borderL}` }}>{a.coverage}</td>
                    <td style={{ padding:'8px 12px', color:T.teal, fontSize:12, borderBottom:`1px solid ${T.borderL}` }}>{a.scale}</td>
                    <td style={{ padding:'8px 12px', color:T.textSec, fontSize:11, borderBottom:`1px solid ${T.borderL}` }}>{a.specialty}</td>
                    <td style={{ padding:'8px 12px', color:T.amber, fontFamily:T.mono, fontSize:12, borderBottom:`1px solid ${T.borderL}` }}>${a.pricingBps * 20}</td>
                    <td style={{ padding:'8px 12px', color:T.textMut, fontSize:11, borderBottom:`1px solid ${T.borderL}` }}>{a.methodology}</td>
                    <td style={{ padding:'8px 12px', color:T.textSec, fontSize:12, borderBottom:`1px solid ${T.borderL}` }}>{a.founded}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
            <Section>Portfolio Composite Rating Scoreboard</Section>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:T.surfaceH }}>
                  {['Project','Type','Sylvera','BeZero','Calyx','Composite','Grade','Price/t','CCP?'].map(h => <th key={h} style={{ padding:'8px 10px', color:T.textSec, fontSize:11, fontFamily:T.mono, textAlign:'left', borderBottom:`1px solid ${T.border}` }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {PROJECT_PORTFOLIO.map((p,i) => {
                  const cr = compositeRating(p);
                  return (
                    <tr key={i} style={{ background:i%2===0?T.surface:T.surfaceH }}>
                      <td style={{ padding:'8px 10px', color:T.gold, fontSize:11, fontFamily:T.mono, borderBottom:`1px solid ${T.borderL}` }}>{p.id}</td>
                      <td style={{ padding:'8px 10px', color:T.textSec, fontSize:11, borderBottom:`1px solid ${T.borderL}` }}>{p.type}</td>
                      <td style={{ padding:'8px 10px', color:T.text, fontFamily:T.mono, fontSize:11, borderBottom:`1px solid ${T.borderL}` }}>{p.sylvera}</td>
                      <td style={{ padding:'8px 10px', color:T.text, fontFamily:T.mono, fontSize:11, borderBottom:`1px solid ${T.borderL}` }}>{p.bezero}</td>
                      <td style={{ padding:'8px 10px', color:T.text, fontFamily:T.mono, fontSize:11, borderBottom:`1px solid ${T.borderL}` }}>{p.calyx}</td>
                      <td style={{ padding:'8px 10px', color:T.teal, fontFamily:T.mono, fontSize:11, borderBottom:`1px solid ${T.borderL}` }}>{cr.raw}</td>
                      <td style={{ padding:'8px 10px', color:cr.label.includes('Investment')?T.green:cr.label==='Acceptable'?T.amber:T.red, fontSize:11, fontWeight:600, borderBottom:`1px solid ${T.borderL}` }}>{cr.label}</td>
                      <td style={{ padding:'8px 10px', color:T.gold, fontFamily:T.mono, fontSize:11, borderBottom:`1px solid ${T.borderL}` }}>${p.pricePerT}</td>
                      <td style={{ padding:'8px 10px', color:p.ccpLabel?T.green:T.red, fontSize:11, borderBottom:`1px solid ${T.borderL}` }}>{p.ccpLabel?'✓':'✗'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============ TAB 4: DIGITAL MRV ============ */}
      {activeTab===4 && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
            <Section>Digital MRV Stack (5-Tier Architecture)</Section>
            {MRV_STACK.map((m,i) => (
              <div key={i} style={{ padding:12, background:T.surfaceH, borderRadius:6, marginBottom:8, borderLeft:`3px solid ${[T.red,T.amber,T.gold,T.teal,T.green][i]}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ color:T.gold, fontFamily:T.mono, fontSize:12, fontWeight:700 }}>{m.tier}</span>
                  <span style={{ color:T.green, fontFamily:T.mono, fontSize:11 }}>{m.cost}</span>
                </div>
                <div style={{ color:T.text, fontSize:11, marginBottom:3 }}>{m.example}</div>
                <div style={{ display:'flex', gap:12, color:T.textSec, fontSize:10 }}>
                  <span>Freq: {m.frequency}</span>
                  <span>Accuracy: {m.accuracy}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
            <Section>Live MRV Telemetry — Sundarbans Mangrove (52-week)</Section>
            <ResponsiveContainer width="100%" height={180}>
              <ComposedChart data={mrvTimeseries}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="week" tick={{ fill:T.textSec, fontSize:10 }} />
                <YAxis yAxisId="left" tick={{ fill:T.textSec, fontSize:10 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill:T.textSec, fontSize:10 }} />
                <Tooltip contentStyle={{ background:T.surfaceH, border:`1px solid ${T.border}`, color:T.text }} />
                <Area yAxisId="left" type="monotone" dataKey="ndvi" stroke={T.green} fill={`${T.green}33`} name="Satellite NDVI" />
                <Line yAxisId="right" type="monotone" dataKey="co2Flux" stroke={T.gold} strokeWidth={2} name="CO₂ Flux (t/ha/yr)" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
            <ResponsiveContainer width="100%" height={160}>
              <ComposedChart data={mrvTimeseries}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="week" tick={{ fill:T.textSec, fontSize:10 }} />
                <YAxis yAxisId="left" tick={{ fill:T.textSec, fontSize:10 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill:T.textSec, fontSize:10 }} />
                <Tooltip contentStyle={{ background:T.surfaceH, border:`1px solid ${T.border}`, color:T.text }} />
                <Bar yAxisId="left" dataKey="deforestAlerts" fill={T.red} name="Deforest Alerts" />
                <Line yAxisId="right" type="monotone" dataKey="verifiedCredits" stroke={T.teal} strokeWidth={2} name="Cumulative Credits" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
            <div style={{ marginTop:10, padding:10, background:T.surfaceH, borderRadius:4, color:T.textSec, fontSize:11, lineHeight:1.6 }}>
              Planet Labs SuperDove (3m resolution) + Sentinel-2 L2A fused via Google Earth Engine. NDVI-based biomass regression against LiDAR calibration plots (PAI: 86.5%). Blockchain-anchored issuance via Verra Registry 3.0 API.
            </div>
          </div>
        </div>
      )}

      {/* ============ TAB 5: VINTAGE & DURABILITY ============ */}
      {activeTab===5 && (
        <div>
          <div style={{ display:'flex', gap:8, marginBottom:16 }}>
            {['all','2019','2022','2024','2026'].map(v => <button key={v} onClick={()=>setVintageFilter(v)} style={{ padding:'6px 14px', background:vintageFilter===v?T.navy:'transparent', color:vintageFilter===v?T.gold:T.textSec, border:`1px solid ${vintageFilter===v?T.gold:T.border}`, borderRadius:4, cursor:'pointer', fontFamily:T.mono, fontSize:11 }}>Vintage: {v}</button>)}
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20, marginBottom:16 }}>
            <Section>Durability × Vintage Price Matrix ($/tCO₂e)</Section>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:T.surfaceH }}>
                  <th style={{ padding:'8px 12px', color:T.textSec, fontSize:11, fontFamily:T.mono, textAlign:'left', borderBottom:`1px solid ${T.border}` }}>Durability Tier</th>
                  <th style={{ padding:'8px 12px', color:T.textSec, fontSize:11, fontFamily:T.mono, borderBottom:`1px solid ${T.border}` }}>2019</th>
                  <th style={{ padding:'8px 12px', color:T.textSec, fontSize:11, fontFamily:T.mono, borderBottom:`1px solid ${T.border}` }}>2022</th>
                  <th style={{ padding:'8px 12px', color:T.textSec, fontSize:11, fontFamily:T.mono, borderBottom:`1px solid ${T.border}` }}>2024</th>
                  <th style={{ padding:'8px 12px', color:T.textSec, fontSize:11, fontFamily:T.mono, borderBottom:`1px solid ${T.border}` }}>2026 (spot)</th>
                  <th style={{ padding:'8px 12px', color:T.textSec, fontSize:11, fontFamily:T.mono, borderBottom:`1px solid ${T.border}` }}>CCP-Labelled %</th>
                </tr>
              </thead>
              <tbody>
                {VINTAGE_DURABILITY.map((v,i) => (
                  <tr key={i} style={{ background:i%2===0?T.surface:T.surfaceH }}>
                    <td style={{ padding:'8px 12px', color:T.gold, fontSize:12, fontWeight:600, borderBottom:`1px solid ${T.borderL}` }}>{v.durability}</td>
                    <td style={{ padding:'8px 12px', color:T.textMut, fontFamily:T.mono, fontSize:12, textAlign:'right', borderBottom:`1px solid ${T.borderL}` }}>${v.vintage2019}</td>
                    <td style={{ padding:'8px 12px', color:T.textSec, fontFamily:T.mono, fontSize:12, textAlign:'right', borderBottom:`1px solid ${T.borderL}` }}>${v.vintage2022}</td>
                    <td style={{ padding:'8px 12px', color:T.amber, fontFamily:T.mono, fontSize:12, textAlign:'right', borderBottom:`1px solid ${T.borderL}` }}>${v.vintage2024}</td>
                    <td style={{ padding:'8px 12px', color:T.green, fontFamily:T.mono, fontSize:13, fontWeight:700, textAlign:'right', borderBottom:`1px solid ${T.borderL}` }}>${v.vintage2026}</td>
                    <td style={{ padding:'8px 12px', color:T.teal, fontFamily:T.mono, fontSize:12, textAlign:'right', borderBottom:`1px solid ${T.borderL}` }}>{v.icvcmPct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
            <Section>Vintage Discount Curve & Durability Premium Stack</Section>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={VINTAGE_DURABILITY.map(d => [
                { durability:d.durability, year:2019, price:d.vintage2019 },
                { durability:d.durability, year:2022, price:d.vintage2022 },
                { durability:d.durability, year:2024, price:d.vintage2024 },
                { durability:d.durability, year:2026, price:d.vintage2026 },
              ]).flat()}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" allowDuplicatedCategory={false} tick={{ fill:T.textSec, fontSize:11 }} />
                <YAxis scale="log" domain={[2, 500]} tick={{ fill:T.textSec, fontSize:11 }} label={{ value:'$/tCO₂e (log)', angle:-90, position:'insideLeft', fill:T.textMut, fontSize:10 }} />
                <Tooltip contentStyle={{ background:T.surfaceH, border:`1px solid ${T.border}`, color:T.text }} />
                <Legend />
                {VINTAGE_DURABILITY.map((d,i) => (
                  <Line key={i} type="monotone" dataKey="price" data={[
                    { year:2019, price:d.vintage2019 }, { year:2022, price:d.vintage2022 },
                    { year:2024, price:d.vintage2024 }, { year:2026, price:d.vintage2026 }
                  ]} stroke={[T.red,T.amber,T.teal,T.navy][i]} strokeWidth={2} name={d.durability} dot={{ r:3 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ============ TAB 6: BUFFER & LEAKAGE ============ */}
      {activeTab===6 && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
            <Section>Non-Permanence Risk Buffer Calibration</Section>
            <div style={{ display:'grid', gap:8, marginBottom:16 }}>
              {Object.entries(BUFFER_DEFAULTS).map(([k,v],i) => (
                <div key={i} style={{ padding:'8px 12px', background:T.surfaceH, borderRadius:4, display:'flex', justifyContent:'space-between' }}>
                  <span style={{ color:T.textSec, fontSize:12, fontFamily:T.mono }}>{k.replace(/_/g,' ').toUpperCase()}</span>
                  <span style={{ color:v<10?T.green:v<20?T.amber:T.red, fontFamily:T.mono, fontSize:12, fontWeight:600 }}>{v}% buffer</span>
                </div>
              ))}
            </div>
            <div style={{ padding:12, background:T.surfaceH, borderRadius:6 }}>
              <div style={{ color:T.gold, fontFamily:T.mono, fontSize:12, marginBottom:6, fontWeight:700 }}>Buffer Pool Mechanics (VCS AFOLU Non-Permanence)</div>
              <div style={{ color:T.textSec, fontSize:11, lineHeight:1.7 }}>
                VCS Non-Permanence Risk Tool v4.1 (2024) assigns buffer % based on: (1) financial risk to project proponent, (2) management capacity, (3) project longevity, (4) natural risks (fire, pest, drought, storm), (5) social risks (land tenure, political). Credits deposited in centralised buffer pool cover reversals for 100+ years. Tonnes withdrawn from buffer reduce pool, ratcheting required contributions.
              </div>
            </div>
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
            <Section>Buffer-Adjusted Volume Calculator</Section>
            <div>
              <label style={{ color:T.textSec, fontSize:12, display:'block', marginBottom:4 }}>Project: {proj.name}</label>
              <select value={selProj} onChange={e=>setSelProj(+e.target.value)} style={{ width:'100%', background:T.surfaceH, color:T.text, border:`1px solid ${T.border}`, borderRadius:4, padding:'6px 10px', fontFamily:T.mono, fontSize:12, marginBottom:12 }}>
                {PROJECT_PORTFOLIO.map((p,i) => <option key={i} value={i}>{p.id} — {p.name}</option>)}
              </select>
              <label style={{ color:T.textSec, fontSize:12, display:'block', marginBottom:4 }}>Buffer Retention: {bufferPct}%</label>
              <input type="range" min={0} max={50} step={1} value={bufferPct} onChange={e=>setBufferPct(+e.target.value)} style={{ width:'100%' }} />
            </div>
            <div style={{ marginTop:16, padding:14, background:T.surfaceH, borderRadius:6 }}>
              <div style={{ display:'grid', gap:10 }}>
                <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ color:T.textSec, fontSize:12 }}>Gross Credits Generated</span><span style={{ color:T.gold, fontFamily:T.mono, fontSize:14 }}>{(proj.volumeKtCO2*1000).toLocaleString()} tCO₂e</span></div>
                <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ color:T.textSec, fontSize:12 }}>Buffer Deduction ({bufferPct}%)</span><span style={{ color:T.red, fontFamily:T.mono, fontSize:14 }}>-{(proj.volumeKtCO2*1000*bufferPct/100).toLocaleString()}</span></div>
                <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ color:T.textSec, fontSize:12 }}>Net Tradeable Credits</span><span style={{ color:T.green, fontFamily:T.mono, fontSize:18, fontWeight:700 }}>{bufferNetVol.toLocaleString()}</span></div>
                <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ color:T.textSec, fontSize:12 }}>Revenue Impact</span><span style={{ color:T.amber, fontFamily:T.mono, fontSize:14 }}>${((proj.volumeKtCO2*1000*bufferPct/100)*proj.pricePerT/1e6).toFixed(2)}M withheld</span></div>
              </div>
            </div>
            <div style={{ marginTop:12, padding:12, background:T.surfaceH, borderRadius:6 }}>
              <div style={{ color:T.amber, fontFamily:T.mono, fontSize:12, marginBottom:6, fontWeight:700 }}>Leakage Discount (Activity Shifting)</div>
              <div style={{ color:T.textSec, fontSize:11, lineHeight:1.7 }}>
                AFOLU projects subject to 5–20% leakage deduction for activity shifting (where prevented deforestation migrates elsewhere). REDD+ jurisdictional nested approaches reduce leakage to &lt;5% vs 15–25% for project-scale. A6.4 methodologies apply uncertainty haircut on top of leakage (5–15%). Engineered CDR (DAC, BECCS) has effectively zero leakage by definition.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ TAB 7: FORWARD CURVE & IV ============ */}
      {activeTab===7 && (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:16 }}>
            <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
              <Section>Forward Price Curve ($/tCO₂e · April 2026)</Section>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={FORWARD_CURVE}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="tenor" tick={{ fill:T.textSec, fontSize:11 }} />
                  <YAxis tick={{ fill:T.textSec, fontSize:11 }} />
                  <Tooltip contentStyle={{ background:T.surfaceH, border:`1px solid ${T.border}`, color:T.text }} />
                  <Legend />
                  <Line type="monotone" dataKey="eua" stroke={T.teal} strokeWidth={2} name="EUA Futures" dot={{ r:3 }} />
                  <Line type="monotone" dataKey="a64er" stroke={T.gold} strokeWidth={2} name="A6.4ER Forward" dot={{ r:3 }} />
                  <Line type="monotone" dataKey="ccert" stroke={T.amber} strokeWidth={2} name="CCert Forward" dot={{ r:3 }} />
                  <Line type="monotone" dataKey="vcs" stroke={T.green} strokeWidth={2} name="VCS Forward" dot={{ r:3 }} strokeDasharray="3 2" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
              <Section>Implied Volatility Surface (%, Annualised)</Section>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={FORWARD_CURVE}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="tenor" tick={{ fill:T.textSec, fontSize:11 }} />
                  <YAxis tick={{ fill:T.textSec, fontSize:11 }} domain={[20, 80]} />
                  <Tooltip contentStyle={{ background:T.surfaceH, border:`1px solid ${T.border}`, color:T.text }} />
                  <Legend />
                  <Line type="monotone" dataKey="eua_iv" stroke={T.teal} strokeWidth={2} name="EUA IV" dot={{ r:3 }} />
                  <Line type="monotone" dataKey="a64er_iv" stroke={T.gold} strokeWidth={2} name="A6.4ER IV" dot={{ r:3 }} />
                  <Line type="monotone" dataKey="ccert_iv" stroke={T.amber} strokeWidth={2} name="CCert IV" dot={{ r:3 }} />
                  <Line type="monotone" dataKey="vcs_iv" stroke={T.green} strokeWidth={2} name="VCS IV" dot={{ r:3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
            <Section>Term Structure Metrics</Section>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
              {[
                { market:'EUA', spot:'$72', contango:'+$53 (10Y)', iv:'28–38%', color:T.teal, signal:'Steep contango — carry trade favourable' },
                { market:'A6.4ER', spot:'$42', contango:'+$98 (10Y)', iv:'38–52%', color:T.gold, signal:'Nascent market — price discovery phase' },
                { market:'CCert', spot:'$14', contango:'+$41 (10Y)', iv:'52–68%', color:T.amber, signal:'High vol — regulatory implementation risk' },
                { market:'VCS', spot:'$9', contango:'+$23 (10Y)', iv:'62–74%', color:T.green, signal:'Highest vol — integrity-driven repricing' },
              ].map((m,i) => (
                <div key={i} style={{ background:T.surfaceH, borderRadius:6, padding:12, borderTop:`2px solid ${m.color}` }}>
                  <div style={{ color:m.color, fontFamily:T.mono, fontSize:12, fontWeight:700, marginBottom:6 }}>{m.market}</div>
                  <div style={{ display:'grid', gap:4 }}>
                    <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ color:T.textMut, fontSize:11 }}>Spot</span><span style={{ color:T.text, fontFamily:T.mono, fontSize:12 }}>{m.spot}</span></div>
                    <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ color:T.textMut, fontSize:11 }}>Contango</span><span style={{ color:T.green, fontFamily:T.mono, fontSize:12 }}>{m.contango}</span></div>
                    <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ color:T.textMut, fontSize:11 }}>IV Range</span><span style={{ color:T.amber, fontFamily:T.mono, fontSize:12 }}>{m.iv}</span></div>
                  </div>
                  <div style={{ color:T.textSec, fontSize:10, marginTop:8, lineHeight:1.5 }}>{m.signal}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============ TAB 8: MONTE CARLO NPV ============ */}
      {activeTab===8 && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1.3fr', gap:20 }}>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
            <Section>Monte Carlo Valuation Engine (1,000 simulations)</Section>
            <div style={{ display:'grid', gap:12, marginBottom:14 }}>
              {[
                { label:`Annual Volume (tCO₂e): ${mcVolume.toLocaleString()}`, min:10000, max:5000000, step:10000, val:mcVolume, set:setMcVolume },
                { label:`Base Price: $${mcBasePrice}/t`, min:5, max:200, step:1, val:mcBasePrice, set:setMcBasePrice },
                { label:`Annualised Vol: ${mcVol}%`, min:10, max:80, step:1, val:mcVol, set:setMcVol },
                { label:`Crediting Period: ${mcYears} yr`, min:3, max:15, step:1, val:mcYears, set:setMcYears },
                { label:`Discount Rate: ${mcDisc}%`, min:5, max:20, step:0.5, val:mcDisc, set:setMcDisc },
              ].map((s,i) => (
                <div key={i}>
                  <label style={{ color:T.textSec, fontSize:12, display:'block', marginBottom:3 }}>{s.label}</label>
                  <input type="range" min={s.min} max={s.max} step={s.step} value={s.val} onChange={e=>s.set(+e.target.value)} style={{ width:'100%' }} />
                </div>
              ))}
            </div>
            <div style={{ padding:14, background:T.surfaceH, borderRadius:6 }}>
              <div style={{ color:T.gold, fontFamily:T.mono, fontSize:12, fontWeight:700, marginBottom:10 }}>RISK-ADJUSTED NPV DISTRIBUTION</div>
              <div style={{ display:'grid', gap:6 }}>
                <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ color:T.red, fontSize:12 }}>P10 (downside)</span><span style={{ color:T.red, fontFamily:T.mono, fontSize:14 }}>${mcResults.p10}M</span></div>
                <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ color:T.gold, fontSize:12 }}>P50 (median)</span><span style={{ color:T.gold, fontFamily:T.mono, fontSize:16, fontWeight:700 }}>${mcResults.p50}M</span></div>
                <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ color:T.green, fontSize:12 }}>P90 (upside)</span><span style={{ color:T.green, fontFamily:T.mono, fontSize:14 }}>${mcResults.p90}M</span></div>
                <div style={{ display:'flex', justifyContent:'space-between', borderTop:`1px solid ${T.border}`, paddingTop:6, marginTop:4 }}><span style={{ color:T.text, fontSize:12 }}>Mean</span><span style={{ color:T.teal, fontFamily:T.mono, fontSize:14 }}>${mcResults.mean}M</span></div>
              </div>
            </div>
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
            <Section>Valuation Sensitivity Analysis</Section>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={[
                { factor:'+10% Volume', p50: +mcResults.p50 * 1.1 },
                { factor:'+10% Price', p50: +mcResults.p50 * 1.12 },
                { factor:'-2% Disc Rate', p50: +mcResults.p50 * 1.15 },
                { factor:'Base Case', p50: +mcResults.p50 },
                { factor:'+5% IV (vol)', p50: +mcResults.p50 * 0.96 },
                { factor:'-10% Volume', p50: +mcResults.p50 * 0.9 },
                { factor:'-10% Price', p50: +mcResults.p50 * 0.88 },
                { factor:'+2% Disc Rate', p50: +mcResults.p50 * 0.87 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="factor" tick={{ fill:T.textSec, fontSize:9 }} angle={-25} textAnchor="end" height={70} />
                <YAxis tick={{ fill:T.textSec, fontSize:10 }} />
                <Tooltip contentStyle={{ background:T.surfaceH, border:`1px solid ${T.border}`, color:T.text }} formatter={(v)=>[`$${v.toFixed(1)}M`]} />
                <Bar dataKey="p50" fill={T.gold} name="P50 NPV ($M)" />
                <ReferenceLine y={+mcResults.p50} stroke={T.teal} strokeDasharray="4 2" />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ padding:12, background:T.surfaceH, borderRadius:6, color:T.textSec, fontSize:11, lineHeight:1.7 }}>
              <span style={{ color:T.gold, fontFamily:T.mono }}>Model assumptions:</span> geometric Brownian motion for credit price with 5%/yr drift (reflects consensus carbon price escalation); log-normal return distribution; 12-sample CLT approximation for normal draws. Volume held deterministic. No leakage/buffer adjustments here — apply separately via buffer engine. Results are indicative gross project value before VVB, registry, and marketing costs (typically 8–15% of revenue).
            </div>
          </div>
        </div>
      )}

      {/* ============ TAB 9: CORRELATION MATRIX ============ */}
      {activeTab===9 && (
        <div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20, marginBottom:16 }}>
            <Section>Cross-Market Correlation (5Y rolling, monthly returns)</Section>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ padding:'6px 10px', background:T.surfaceH, color:T.textSec, fontFamily:T.mono, fontSize:11, borderBottom:`1px solid ${T.border}` }}></th>
                    {['EUA','CCert','JCM_ITMO','VCS','A64ER','JGX','Brent','Elec'].map(h => <th key={h} style={{ padding:'6px 10px', background:T.surfaceH, color:T.gold, fontFamily:T.mono, fontSize:10, borderBottom:`1px solid ${T.border}` }}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {CORRELATION_MATRIX.map((r,i) => (
                    <tr key={i}>
                      <td style={{ padding:'6px 10px', background:T.surfaceH, color:T.gold, fontFamily:T.mono, fontSize:10, fontWeight:700, borderBottom:`1px solid ${T.border}` }}>{r.id}</td>
                      {['EUA','CCert','JCM_ITMO','VCS','A64ER','JGX','Brent','Elec'].map(c => {
                        const v = r[c] ?? 0;
                        const intensity = Math.abs(v);
                        const bg = v > 0 ? `rgba(39, 174, 96, ${intensity*0.8})` : `rgba(192, 57, 43, ${intensity*0.8})`;
                        return <td key={c} style={{ padding:'6px 10px', background:bg, color:intensity>0.5?'#fff':T.text, fontFamily:T.mono, fontSize:11, textAlign:'center', borderBottom:`1px solid ${T.border}` }}>{v.toFixed(2)}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
            <Section>Diversification Insights</Section>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
              {[
                { title:'Strongest Correlations', color:T.red, items:['JCM_ITMO ↔ JGX (0.62) — JCM flows directly settle in GX-ETS', 'EUA ↔ Elec (0.58) — EU power carbon pass-through', 'JCM_ITMO ↔ A64ER (0.54) — same Article 6 infrastructure'] },
                { title:'Diversification Candidates', color:T.green, items:['VCS ↔ Brent (0.04) — nearly orthogonal; commodity hedge', 'EUA ↔ VCS (0.08) — compliance vs voluntary decoupled', 'CCert ↔ Brent (0.12) — India domestic carbon independent of oil'] },
                { title:'Regime Signals', color:T.gold, items:['A64ER rising correlation to EUA (0.35 vs 0.15 pre-2024) — convergence', 'VCS IV structurally higher (62–74%) — integrity repricing continues', 'CCert IV trending down (68→52) — maturation as liquidity grows'] },
              ].map((b,i) => (
                <div key={i} style={{ background:T.surfaceH, borderRadius:6, padding:12, borderTop:`2px solid ${b.color}` }}>
                  <div style={{ color:b.color, fontFamily:T.mono, fontSize:12, fontWeight:700, marginBottom:8 }}>{b.title}</div>
                  {b.items.map((x,j) => <div key={j} style={{ color:T.textSec, fontSize:11, padding:'4px 0', borderTop:j===0?'none':`1px solid ${T.border}`, lineHeight:1.5 }}>{x}</div>)}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============ TAB 10: A6.4 REGISTRY ============ */}
      {activeTab===10 && (
        <div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20, marginBottom:16 }}>
            <Section>UNFCCC Article 6.4 Approved Methodologies (April 2026)</Section>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:T.surfaceH }}>
                  {['Code','Title','Type','Category','Approved','Crediting (yr)','Baseline','Pipeline (MtCO₂e)'].map(h => <th key={h} style={{ padding:'8px 10px', color:T.textSec, fontSize:11, fontFamily:T.mono, textAlign:'left', borderBottom:`1px solid ${T.border}` }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {A64_METHODOLOGIES.map((m,i) => (
                  <tr key={i} style={{ background:i%2===0?T.surface:T.surfaceH }}>
                    <td style={{ padding:'8px 10px', color:T.gold, fontFamily:T.mono, fontSize:11, fontWeight:700, borderBottom:`1px solid ${T.borderL}` }}>{m.code}</td>
                    <td style={{ padding:'8px 10px', color:T.text, fontSize:11, borderBottom:`1px solid ${T.borderL}` }}>{m.title}</td>
                    <td style={{ padding:'8px 10px', color:T.teal, fontSize:11, borderBottom:`1px solid ${T.borderL}` }}>{m.type}</td>
                    <td style={{ padding:'8px 10px', color:m.category.includes('Removal')?T.green:T.amber, fontSize:11, borderBottom:`1px solid ${T.borderL}` }}>{m.category}</td>
                    <td style={{ padding:'8px 10px', color:T.textSec, fontFamily:T.mono, fontSize:11, borderBottom:`1px solid ${T.borderL}` }}>{m.approvedDate}</td>
                    <td style={{ padding:'8px 10px', color:T.amber, fontFamily:T.mono, fontSize:11, borderBottom:`1px solid ${T.borderL}` }}>{m.crediting}</td>
                    <td style={{ padding:'8px 10px', color:T.textSec, fontSize:10, borderBottom:`1px solid ${T.borderL}` }}>{m.baseline}</td>
                    <td style={{ padding:'8px 10px', color:T.green, fontFamily:T.mono, fontSize:11, textAlign:'right', borderBottom:`1px solid ${T.borderL}` }}>{m.pipelineMt.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
              <Section>A6.4 Pipeline by Category (MtCO₂e)</Section>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={A64_METHODOLOGIES}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="code" tick={{ fill:T.textSec, fontSize:9 }} angle={-25} textAnchor="end" height={60} />
                  <YAxis tick={{ fill:T.textSec, fontSize:10 }} />
                  <Tooltip contentStyle={{ background:T.surfaceH, border:`1px solid ${T.border}`, color:T.text }} />
                  <Bar dataKey="pipelineMt" fill={T.gold} name="Pipeline MtCO₂e" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
              <Section>Corresponding Adjustment (CA) Tracker</Section>
              <div style={{ display:'grid', gap:8 }}>
                {[
                  { country:'India', caExecuted:4.2, ndcTarget:45, corridorActive:['Japan JCM','Switzerland','Korea'], status:'Active' },
                  { country:'Kenya', caExecuted:2.1, ndcTarget:32, corridorActive:['Switzerland','Sweden','Singapore'], status:'Active' },
                  { country:'Ghana', caExecuted:1.8, ndcTarget:64, corridorActive:['Switzerland','Liechtenstein'], status:'Active' },
                  { country:'Rwanda', caExecuted:0.9, ndcTarget:38, corridorActive:['Singapore','Japan'], status:'Active' },
                  { country:'Dominican Rep', caExecuted:0.3, ndcTarget:27, corridorActive:['Singapore'], status:'Pilot' },
                  { country:'Thailand', caExecuted:0, ndcTarget:40, corridorActive:['Switzerland (draft)'], status:'Negotiating' },
                ].map((c,i) => (
                  <div key={i} style={{ padding:'8px 10px', background:T.surfaceH, borderRadius:4 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
                      <span style={{ color:T.text, fontSize:12, fontWeight:600 }}>{c.country}</span>
                      <span style={{ color:c.status==='Active'?T.green:c.status==='Pilot'?T.amber:T.textMut, fontFamily:T.mono, fontSize:10 }}>{c.status}</span>
                    </div>
                    <div style={{ color:T.textSec, fontSize:10 }}>CA executed: {c.caExecuted} MtCO₂e · NDC: -{c.ndcTarget}% · Partners: {c.corridorActive.join(', ')}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ TAB 11: PORTFOLIO QUALITY ============ */}
      {activeTab===11 && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
            <Section>Portfolio Allocation Builder</Section>
            <div style={{ display:'grid', gap:8, marginBottom:14 }}>
              {PROJECT_PORTFOLIO.map((p,i) => (
                <div key={i}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                    <span style={{ color:T.gold, fontFamily:T.mono, fontSize:10 }}>{p.id} · {p.type}</span>
                    <span style={{ color:T.text, fontFamily:T.mono, fontSize:11 }}>{portfolioWeights[i].toFixed(1)}%</span>
                  </div>
                  <input type="range" min={0} max={30} step={0.5} value={portfolioWeights[i]} onChange={e=>{ const nw=[...portfolioWeights]; nw[i]=+e.target.value; setPortfolioWeights(nw); }} style={{ width:'100%' }} />
                </div>
              ))}
            </div>
            <div style={{ padding:10, background:Math.round(portfolioWeights.reduce((a,b)=>a+b,0))===100?`${T.green}11`:`${T.red}11`, border:`1px solid ${Math.round(portfolioWeights.reduce((a,b)=>a+b,0))===100?T.green:T.red}33`, borderRadius:4, color:Math.round(portfolioWeights.reduce((a,b)=>a+b,0))===100?T.green:T.red, fontFamily:T.mono, fontSize:12 }}>
              Total: {portfolioWeights.reduce((a,b)=>a+b,0).toFixed(1)}% {Math.round(portfolioWeights.reduce((a,b)=>a+b,0))===100?' ✓':' (rebalance)'}
            </div>
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
            <Section>Portfolio Quality Scorecard</Section>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
              <Kpi label="Total Volume" value={`${(+portfolioStats.totalVol).toLocaleString()} ktCO₂e`} sub="weighted volume" color={T.gold} />
              <Kpi label="Weighted Price" value={`$${portfolioStats.wAvgPrice}/t`} sub="portfolio VWAP" color={T.teal} />
              <Kpi label="CCP-Labelled" value={`${portfolioStats.ccpPct}%`} sub="of portfolio vol" color={+portfolioStats.ccpPct>=60?T.green:T.amber} />
              <Kpi label="CORSIA-Eligible" value={`${portfolioStats.corsiaPct}%`} sub="ICAO alignment" color={T.teal} />
              <Kpi label="Durable CDR Share" value={`${portfolioStats.durablePct}%`} sub="1000+ yr storage" color={+portfolioStats.durablePct>=15?T.green:T.amber} />
              <Kpi label="Avg Buffer" value={`${portfolioStats.avgBuffer}%`} sub="non-permanence retention" color={T.amber} />
            </div>
            <div style={{ padding:12, background:T.surfaceH, borderRadius:6 }}>
              <div style={{ color:T.gold, fontFamily:T.mono, fontSize:12, fontWeight:700, marginBottom:8 }}>VCMI Tier Compatibility</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                <div style={{ padding:8, background:T.surface, borderRadius:4, borderTop:`2px solid #cd7f32` }}>
                  <div style={{ color:'#cd7f32', fontFamily:T.mono, fontSize:11, fontWeight:700 }}>Silver</div>
                  <div style={{ color:+portfolioStats.ccpPct>=30?T.green:T.red, fontSize:11, marginTop:4 }}>{+portfolioStats.ccpPct>=30?'✓ Compatible':'✗ Need ≥30% CCP'}</div>
                </div>
                <div style={{ padding:8, background:T.surface, borderRadius:4, borderTop:`2px solid #ffd700` }}>
                  <div style={{ color:'#ffd700', fontFamily:T.mono, fontSize:11, fontWeight:700 }}>Gold</div>
                  <div style={{ color:+portfolioStats.corsiaPct>=50&&+portfolioStats.ccpPct>=60?T.green:T.red, fontSize:11, marginTop:4 }}>{+portfolioStats.corsiaPct>=50&&+portfolioStats.ccpPct>=60?'✓ Compatible':'✗ Need ≥60% CCP + ≥50% CORSIA'}</div>
                </div>
                <div style={{ padding:8, background:T.surface, borderRadius:4, borderTop:`2px solid #e5e4e2` }}>
                  <div style={{ color:'#e5e4e2', fontFamily:T.mono, fontSize:11, fontWeight:700 }}>Platinum</div>
                  <div style={{ color:+portfolioStats.durablePct>=15&&+portfolioStats.ccpPct>=80?T.green:T.red, fontSize:11, marginTop:4 }}>{+portfolioStats.durablePct>=15&&+portfolioStats.ccpPct>=80?'✓ Compatible':'✗ Need ≥80% CCP + ≥15% Durable CDR'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop:20, padding:'10px 16px', background:T.surfaceH, borderRadius:6, display:'flex', justifyContent:'space-between', fontFamily:T.mono, fontSize:11, color:T.textMut }}>
        <span>EP-EA7 · Carbon Integrity, MRV & Value Identification Hub</span>
        <span>ICVCM · VCMI 2.0 · Sylvera/BeZero/Calyx · A6.4 SB · Digital MRV · Monte Carlo · 12 Tabs</span>
      </div>
    </div>
  );
}
