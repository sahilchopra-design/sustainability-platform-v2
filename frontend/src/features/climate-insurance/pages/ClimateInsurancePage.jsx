import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, LineChart, Line, ScatterChart, Scatter,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart, ReferenceLine,
} from 'recharts';

/* ── Theme ── */
const T = { surface:'#fafaf7', border:'#e2e0d8', navy:'#1b2a4a', gold:'#b8962e', text:'#1a1a2e', sub:'#64748b', card:'#ffffff', indigo:'#4f46e5', green:'#065f46', red:'#991b1b', amber:'#92400e' };
const COLORS = ['#4f46e5','#065f46','#b8962e','#991b1b','#0ea5e9','#7c3aed','#d97706','#0891b2','#be185d','#059669','#6366f1','#dc2626'];

/* ── Seeded PRNG ── */
const sr = s => { let x = Math.sin(s+1)*10000; return x - Math.floor(x); };

/* ────────────────────────────────────────────────────────────────────────────
   DATA: 30 Insurers
   ────────────────────────────────────────────────────────────────────────── */
const INSURER_NAMES = [
  ['LIC','life','India'],['ICICI Lombard','general','India'],['HDFC Life','life','India'],['SBI Life','life','India'],
  ['New India Assurance','general','India'],['United India','general','India'],['Oriental Insurance','general','India'],
  ['National Insurance','general','India'],['IFFCO Tokio','general','India'],['Bajaj Allianz','general','India'],
  ['Tata AIG','general','India'],['Max Life','life','India'],['HDFC Ergo','general','India'],['Star Health','general','India'],
  ['Aditya Birla Sun Life','life','India'],['Kotak Life','life','India'],['PNB MetLife','life','India'],
  ['Aviva','life','UK'],['AXA','general','France'],['Zurich','general','Switzerland'],
  ['Allianz','general','Germany'],['Munich Re','reinsurer','Germany'],['Swiss Re','reinsurer','Switzerland'],
  ['Hannover Re','reinsurer','Germany'],['SCOR','reinsurer','France'],['Generali','general','Italy'],
  ['AIA','life','Hong Kong'],['Manulife','life','Canada'],['Prudential','life','UK'],['MetLife','life','USA'],
];
const INSURERS = INSURER_NAMES.map(([name,type,country],i) => ({
  name, type, country,
  gwp_usd_mn: Math.round(500 + sr(i*7)*29500),
  assets_usd_bn: +(2 + sr(i*7+1)*198).toFixed(1),
  solvencyRatio_pct: Math.round(140 + sr(i*7+2)*160),
  climateExposure_pct: +(5 + sr(i*7+3)*35).toFixed(1),
  physicalRisk: +(10 + sr(i*7+4)*60).toFixed(1),
  transitionRisk: +(5 + sr(i*7+5)*55).toFixed(1),
  litigationRisk: +(2 + sr(i*7+6)*30).toFixed(1),
  esgScore: Math.round(40 + sr(i*11)*55),
  sbtiStatus: sr(i*13)>0.5?'Committed':'Not Set',
  tcfdStatus: sr(i*17)>0.4?'Full':'Partial',
  orsa_score: Math.round(30 + sr(i*19)*65),
}));

/* ── PORTFOLIOS: 30 insurers x 6 asset classes ── */
const ASSET_CLASSES = ['Govt Bonds','Corp Bonds','Equity','Real Estate','Infrastructure','Alternatives'];
const PORTFOLIOS = INSURERS.map((ins,i) => {
  const raw = ASSET_CLASSES.map((_,j) => 5 + sr(i*100+j*13)*40);
  const tot = raw.reduce((a,b)=>a+b,0);
  return ASSET_CLASSES.map((ac,j) => ({
    insurer: ins.name,
    assetClass: ac,
    allocation_pct: +(raw[j]/Math.max(tot,0.01)*100).toFixed(1),
    climate_adj_return: +(-2 + sr(i*100+j*13+7)*10).toFixed(2),
  }));
}).flat();

/* ── PERILS: 12 climate perils ── */
const PERILS = [
  { name:'Tropical Cyclone', avgAnnualLoss_mn:4200, trend_pct:3.8, modelConfidence:0.82, reinsurance_coverage_pct:72, return_period_100yr:28500 },
  { name:'Flood', avgAnnualLoss_mn:3800, trend_pct:5.1, modelConfidence:0.75, reinsurance_coverage_pct:58, return_period_100yr:22000 },
  { name:'Wildfire', avgAnnualLoss_mn:2900, trend_pct:7.2, modelConfidence:0.68, reinsurance_coverage_pct:45, return_period_100yr:18500 },
  { name:'Drought', avgAnnualLoss_mn:1800, trend_pct:4.5, modelConfidence:0.62, reinsurance_coverage_pct:25, return_period_100yr:9200 },
  { name:'Heatwave', avgAnnualLoss_mn:1200, trend_pct:8.3, modelConfidence:0.58, reinsurance_coverage_pct:18, return_period_100yr:6800 },
  { name:'Winter Storm', avgAnnualLoss_mn:2200, trend_pct:1.9, modelConfidence:0.79, reinsurance_coverage_pct:65, return_period_100yr:14200 },
  { name:'Tornado', avgAnnualLoss_mn:1500, trend_pct:2.1, modelConfidence:0.71, reinsurance_coverage_pct:55, return_period_100yr:11000 },
  { name:'Hail', avgAnnualLoss_mn:1100, trend_pct:3.2, modelConfidence:0.74, reinsurance_coverage_pct:60, return_period_100yr:7500 },
  { name:'Sea Level Rise', avgAnnualLoss_mn:800, trend_pct:6.8, modelConfidence:0.55, reinsurance_coverage_pct:12, return_period_100yr:45000 },
  { name:'Coastal Erosion', avgAnnualLoss_mn:600, trend_pct:5.5, modelConfidence:0.52, reinsurance_coverage_pct:10, return_period_100yr:8500 },
  { name:'Subsidence', avgAnnualLoss_mn:500, trend_pct:4.1, modelConfidence:0.60, reinsurance_coverage_pct:22, return_period_100yr:5200 },
  { name:'Pandemic-Climate Nexus', avgAnnualLoss_mn:950, trend_pct:9.5, modelConfidence:0.42, reinsurance_coverage_pct:8, return_period_100yr:62000 },
];

/* ── SCENARIOS: 6 NGFS ── */
const SCENARIOS = [
  { name:'Orderly',           claimsImpact_pct:8,  investmentImpact_pct:-3,  capitalImpact_pct:-5 },
  { name:'Disorderly',        claimsImpact_pct:15, investmentImpact_pct:-12, capitalImpact_pct:-18 },
  { name:'Hot House',         claimsImpact_pct:35, investmentImpact_pct:-8,  capitalImpact_pct:-25 },
  { name:'Net Zero 2050',     claimsImpact_pct:5,  investmentImpact_pct:2,   capitalImpact_pct:-2 },
  { name:'Delayed Transition', claimsImpact_pct:20, investmentImpact_pct:-18, capitalImpact_pct:-22 },
  { name:'Current Policies',  claimsImpact_pct:30, investmentImpact_pct:-6,  capitalImpact_pct:-20 },
];

/* ── REGULATORY checklist ── */
const REGULATORY = [
  { framework:'IAIS ICP 16.9', area:'Climate Risk Identification', description:'Insurers shall identify material climate risks in underwriting and investment', status:'Required' },
  { framework:'IAIS ICP 16.10', area:'Scenario Analysis', description:'Forward-looking scenario analysis for physical and transition risks', status:'Required' },
  { framework:'Solvency II Art.45a', area:'ORSA Climate Stress', description:'Climate change scenarios in Own Risk and Solvency Assessment', status:'Mandatory 2025' },
  { framework:'Solvency II Pillar 3', area:'Climate Disclosure', description:'Quantitative climate risk disclosures in SFCR', status:'Mandatory 2024' },
  { framework:'IRDAI ESG', area:'ESG Integration', description:'ESG risk factors in underwriting and investment decisions', status:'Guidelines 2024' },
  { framework:'TCFD Insurer', area:'Governance', description:'Board oversight of climate-related risks and opportunities', status:'Recommended' },
  { framework:'TCFD Insurer', area:'Strategy', description:'Impact of climate scenarios on business strategy and financial planning', status:'Recommended' },
  { framework:'TCFD Insurer', area:'Risk Management', description:'Processes for identifying, assessing and managing climate risks', status:'Recommended' },
  { framework:'TCFD Insurer', area:'Metrics & Targets', description:'Disclose metrics used to assess climate risks — Scope 1/2/3, WACI', status:'Recommended' },
  { framework:'ORSA Climate', area:'Capital Adequacy', description:'Climate-adjusted SCR and MCR under adverse scenarios', status:'Best Practice' },
  { framework:'EIOPA Opinion', area:'Nat Cat Pricing', description:'Reflect climate trends in nat cat pricing and reserving', status:'Supervisory Expectation' },
  { framework:'NGFS Guidance', area:'Supervisory Stress Test', description:'Climate stress testing using NGFS scenarios for insurance sector', status:'Emerging' },
];

/* ── CAT EVENTS: 20 historical ── */
const CAT_EVENTS = [
  { event:'Hurricane Katrina', year:2005, country:'USA', peril:'Tropical Cyclone', insured_loss_bn:82.0, economic_loss_bn:170.0, fatalities:1833, climate_attribution_pct:15 },
  { event:'Tohoku Earthquake & Tsunami', year:2011, country:'Japan', peril:'Flood', insured_loss_bn:40.0, economic_loss_bn:235.0, fatalities:19747, climate_attribution_pct:5 },
  { event:'Hurricane Harvey', year:2017, country:'USA', peril:'Flood', insured_loss_bn:32.0, economic_loss_bn:95.0, fatalities:107, climate_attribution_pct:38 },
  { event:'Hurricane Maria', year:2017, country:'Puerto Rico', peril:'Tropical Cyclone', insured_loss_bn:31.0, economic_loss_bn:90.0, fatalities:2975, climate_attribution_pct:25 },
  { event:'Hurricane Irma', year:2017, country:'USA', peril:'Tropical Cyclone', insured_loss_bn:29.0, economic_loss_bn:77.0, fatalities:134, climate_attribution_pct:22 },
  { event:'European Floods 2021', year:2021, country:'Germany', peril:'Flood', insured_loss_bn:13.0, economic_loss_bn:46.0, fatalities:243, climate_attribution_pct:42 },
  { event:'Australian Bushfires 2020', year:2020, country:'Australia', peril:'Wildfire', insured_loss_bn:5.3, economic_loss_bn:18.0, fatalities:34, climate_attribution_pct:55 },
  { event:'Camp Fire 2018', year:2018, country:'USA', peril:'Wildfire', insured_loss_bn:12.5, economic_loss_bn:16.5, fatalities:85, climate_attribution_pct:48 },
  { event:'Hurricane Ian', year:2022, country:'USA', peril:'Tropical Cyclone', insured_loss_bn:60.0, economic_loss_bn:110.0, fatalities:161, climate_attribution_pct:20 },
  { event:'Typhoon Hagibis', year:2019, country:'Japan', peril:'Tropical Cyclone', insured_loss_bn:10.0, economic_loss_bn:17.0, fatalities:98, climate_attribution_pct:18 },
  { event:'European Heatwave 2003', year:2003, country:'France', peril:'Heatwave', insured_loss_bn:1.5, economic_loss_bn:15.0, fatalities:72210, climate_attribution_pct:60 },
  { event:'Pakistan Floods 2022', year:2022, country:'Pakistan', peril:'Flood', insured_loss_bn:0.4, economic_loss_bn:30.0, fatalities:1739, climate_attribution_pct:50 },
  { event:'Cyclone Idai', year:2019, country:'Mozambique', peril:'Tropical Cyclone', insured_loss_bn:0.1, economic_loss_bn:3.4, fatalities:1303, climate_attribution_pct:30 },
  { event:'Texas Winter Storm Uri', year:2021, country:'USA', peril:'Winter Storm', insured_loss_bn:15.0, economic_loss_bn:23.0, fatalities:246, climate_attribution_pct:12 },
  { event:'Kerala Floods 2018', year:2018, country:'India', peril:'Flood', insured_loss_bn:0.8, economic_loss_bn:4.2, fatalities:483, climate_attribution_pct:35 },
  { event:'Hurricane Sandy', year:2012, country:'USA', peril:'Tropical Cyclone', insured_loss_bn:30.0, economic_loss_bn:68.0, fatalities:233, climate_attribution_pct:17 },
  { event:'Christchurch Earthquake', year:2011, country:'New Zealand', peril:'Subsidence', insured_loss_bn:16.5, economic_loss_bn:22.0, fatalities:185, climate_attribution_pct:2 },
  { event:'Thailand Floods', year:2011, country:'Thailand', peril:'Flood', insured_loss_bn:15.0, economic_loss_bn:46.0, fatalities:815, climate_attribution_pct:28 },
  { event:'Uttarakhand Flash Floods', year:2023, country:'India', peril:'Flood', insured_loss_bn:0.3, economic_loss_bn:2.1, fatalities:237, climate_attribution_pct:40 },
  { event:'Canadian Wildfires 2023', year:2023, country:'Canada', peril:'Wildfire', insured_loss_bn:3.0, economic_loss_bn:9.5, fatalities:8, climate_attribution_pct:58 },
];

/* ── Litigation Cases ── */
const LITIGATION_CASES = [
  { case_name:'Milieudefensie v Shell', year:2021, jurisdiction:'Netherlands', type:'Transition', status:'Won', exposure_mn:2800, insurer_relevance:'D&O, Liability' },
  { case_name:'Lliuya v RWE', year:2015, jurisdiction:'Germany', type:'Physical Damage', status:'Ongoing', exposure_mn:150, insurer_relevance:'Property, Liability' },
  { case_name:'ClientEarth v Shell Board', year:2023, jurisdiction:'UK', type:'Fiduciary Duty', status:'Withdrawn', exposure_mn:500, insurer_relevance:'D&O' },
  { case_name:'Sharma v Minister (AU)', year:2021, jurisdiction:'Australia', type:'Govt Duty', status:'Overturned', exposure_mn:0, insurer_relevance:'Public Liability' },
  { case_name:'Neubauer v Germany', year:2021, jurisdiction:'Germany', type:'Constitutional', status:'Won', exposure_mn:0, insurer_relevance:'Regulatory Risk' },
  { case_name:'Greenpeace v Volkswagen', year:2022, jurisdiction:'Germany', type:'Greenwashing', status:'Ongoing', exposure_mn:350, insurer_relevance:'D&O, PI' },
  { case_name:'EPA Power Plant Rule', year:2023, jurisdiction:'USA', type:'Regulatory', status:'Challenged', exposure_mn:1200, insurer_relevance:'Transition Risk' },
  { case_name:'TotalEnergies Climate Plan', year:2023, jurisdiction:'France', type:'Transition', status:'Ongoing', exposure_mn:900, insurer_relevance:'D&O, Liability' },
  { case_name:'Bushfire Survivors v EPA (AU)', year:2020, jurisdiction:'Australia', type:'Physical Damage', status:'Settled', exposure_mn:420, insurer_relevance:'Property, BI' },
  { case_name:'Aloha Petroleum v Hawaii', year:2020, jurisdiction:'USA', type:'Nuisance', status:'Ongoing', exposure_mn:680, insurer_relevance:'GL, Pollution' },
  { case_name:'Youth Climate v US Govt', year:2015, jurisdiction:'USA', type:'Constitutional', status:'Ongoing', exposure_mn:0, insurer_relevance:'Regulatory Risk' },
  { case_name:'ASA v Santos (Greenwash)', year:2022, jurisdiction:'Australia', type:'Greenwashing', status:'Won', exposure_mn:45, insurer_relevance:'D&O, PI' },
  { case_name:'Flood Re Adequacy (UK)', year:2023, jurisdiction:'UK', type:'Regulatory', status:'Review', exposure_mn:2000, insurer_relevance:'Property, Flood' },
  { case_name:'Italian Floods Liability', year:2023, jurisdiction:'Italy', type:'Physical Damage', status:'Filed', exposure_mn:320, insurer_relevance:'Property, Liability' },
  { case_name:'NY v ExxonMobil', year:2019, jurisdiction:'USA', type:'Securities Fraud', status:'Acquitted', exposure_mn:1600, insurer_relevance:'D&O, Securities' },
  { case_name:'Pakistan Climate Petition', year:2022, jurisdiction:'Pakistan', type:'Human Rights', status:'Ongoing', exposure_mn:0, insurer_relevance:'Sovereign Risk' },
  { case_name:'Swiss KlimaSeniorinnen', year:2024, jurisdiction:'ECHR', type:'Human Rights', status:'Won', exposure_mn:0, insurer_relevance:'Regulatory Risk' },
  { case_name:'BHP Mariana Dam (Brazil)', year:2015, jurisdiction:'UK/Brazil', type:'Environmental', status:'Ongoing', exposure_mn:5500, insurer_relevance:'Liability, BI' },
  { case_name:'Held v Montana', year:2023, jurisdiction:'USA', type:'Constitutional', status:'Won', exposure_mn:0, insurer_relevance:'Regulatory Risk' },
  { case_name:'Indian Heatwave D&O Risk', year:2024, jurisdiction:'India', type:'Fiduciary Duty', status:'Emerging', exposure_mn:200, insurer_relevance:'D&O' },
];

/* ── Tab Definitions ── */
const TABS = [
  'Dashboard','Underwriting Risk','Investment Portfolio','Solvency & Capital',
  'Cat Modelling','IAIS & Regulatory','Reinsurance & ILS','Physical Risk Pricing',
  'Transition Risk','Climate Litigation',
];

/* ── Shared Components ── */
const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:'16px 20px', borderLeft:`3px solid ${color||T.indigo}` }}>
    <div style={{ fontSize:11, fontWeight:600, color:T.sub, textTransform:'uppercase', letterSpacing:0.5 }}>{label}</div>
    <div style={{ fontSize:22, fontWeight:700, color:T.navy, marginTop:4 }}>{value}</div>
    {sub && <div style={{ fontSize:11, color:T.sub, marginTop:2 }}>{sub}</div>}
  </div>
);
const Section = ({ title, children }) => (
  <div style={{ marginBottom:28 }}>
    <div style={{ fontSize:15, fontWeight:700, color:T.navy, marginBottom:12, paddingBottom:6, borderBottom:`2px solid ${T.gold}` }}>{title}</div>
    {children}
  </div>
);
const Grid = ({ cols=4, gap=12, children }) => (
  <div style={{ display:'grid', gridTemplateColumns:`repeat(${cols},1fr)`, gap }}>{children}</div>
);
const Badge = ({ text, color=T.green }) => (
  <span style={{ padding:'2px 10px', borderRadius:12, fontSize:11, fontWeight:600, background:color+'18', color }}>{text}</span>
);
const Tbl = ({ headers, rows, maxH }) => (
  <div style={{ overflowX:'auto', maxHeight:maxH, overflowY:maxH?'auto':undefined }}>
    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
      <thead><tr style={{ background:T.surface, position:'sticky', top:0, zIndex:1 }}>
        {headers.map(h => <th key={h} style={{ padding:'10px 12px', textAlign:'left', borderBottom:`2px solid ${T.border}`, fontWeight:600, color:T.navy, whiteSpace:'nowrap' }}>{h}</th>)}
      </tr></thead>
      <tbody>{rows.map((r,i) => <tr key={i} style={{ borderBottom:`1px solid ${T.border}` }}>
        {r.map((c,j) => <td key={j} style={{ padding:'8px 12px', color:T.text, whiteSpace:'nowrap' }}>{c}</td>)}
      </tr>)}</tbody>
    </table>
  </div>
);

/* ──────────────────────────────────────────────────────────────────────────── */
function ClimateInsurancePage() {
  const [tab, setTab] = useState(0);
  const [selInsurer, setSelInsurer] = useState('All');
  const [selPeril, setSelPeril] = useState('All');
  const [selScenario, setSelScenario] = useState('Orderly');
  const [carbonPrice, setCarbonPrice] = useState(75);
  const [returnPeriod, setReturnPeriod] = useState(100);
  const [selGeo, setSelGeo] = useState('All');
  const [selType, setSelType] = useState('All');

  /* ── Derived / Filtered data ── */
  const filteredInsurers = useMemo(() => {
    let d = INSURERS;
    if (selInsurer !== 'All') d = d.filter(x => x.name === selInsurer);
    if (selType !== 'All') d = d.filter(x => x.type === selType);
    if (selGeo !== 'All') d = d.filter(x => x.country === selGeo);
    return d;
  }, [selInsurer, selType, selGeo]);

  const countries = useMemo(() => [...new Set(INSURERS.map(x=>x.country))].sort(), []);
  const types = useMemo(() => [...new Set(INSURERS.map(x=>x.type))].sort(), []);

  /* ── KPI aggregations with division guards ── */
  const totalGwp = filteredInsurers.reduce((a,b) => a+b.gwp_usd_mn, 0);
  const avgSolvency = filteredInsurers.length ? (filteredInsurers.reduce((a,b) => a+b.solvencyRatio_pct,0)/filteredInsurers.length).toFixed(0) : '0';
  const avgClimateExp = filteredInsurers.length ? (filteredInsurers.reduce((a,b) => a+parseFloat(b.climateExposure_pct),0)/filteredInsurers.length).toFixed(1) : '0.0';
  const avgPhysical = filteredInsurers.length ? (filteredInsurers.reduce((a,b) => a+parseFloat(b.physicalRisk),0)/filteredInsurers.length).toFixed(1) : '0.0';
  const avgTransition = filteredInsurers.length ? (filteredInsurers.reduce((a,b) => a+parseFloat(b.transitionRisk),0)/filteredInsurers.length).toFixed(1) : '0.0';
  const tcfdFull = filteredInsurers.length ? (filteredInsurers.filter(x=>x.tcfdStatus==='Full').length / filteredInsurers.length * 100).toFixed(0) : '0';

  const scenarioData = useMemo(() => SCENARIOS.find(s=>s.name===selScenario) || SCENARIOS[0], [selScenario]);

  /* ── Controls bar ── */
  const Controls = () => (
    <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:16, padding:'10px 14px', background:T.surface, borderRadius:8, border:`1px solid ${T.border}` }}>
      <select value={selInsurer} onChange={e=>setSelInsurer(e.target.value)} style={selStyle}>
        <option value="All">All Insurers</option>
        {INSURERS.map(x => <option key={x.name} value={x.name}>{x.name}</option>)}
      </select>
      <select value={selType} onChange={e=>setSelType(e.target.value)} style={selStyle}>
        <option value="All">All Types</option>
        {types.map(t => <option key={t} value={t}>{t}</option>)}
      </select>
      <select value={selGeo} onChange={e=>setSelGeo(e.target.value)} style={selStyle}>
        <option value="All">All Countries</option>
        {countries.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <select value={selScenario} onChange={e=>setSelScenario(e.target.value)} style={selStyle}>
        {SCENARIOS.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
      </select>
      <select value={selPeril} onChange={e=>setSelPeril(e.target.value)} style={selStyle}>
        <option value="All">All Perils</option>
        {PERILS.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
      </select>
    </div>
  );
  const selStyle = { padding:'6px 10px', fontSize:13, border:`1px solid ${T.border}`, borderRadius:6, background:T.card, color:T.text };

  /* ════════════════════════════════════════════════════════════════════════════
     TAB 0: Insurance Climate Dashboard
     ════════════════════════════════════════════════════════════════════════ */
  const renderDashboard = () => {
    const typeDistribution = types.map(t => ({
      name: t, count: filteredInsurers.filter(x=>x.type===t).length,
      gwp: filteredInsurers.filter(x=>x.type===t).reduce((a,b)=>a+b.gwp_usd_mn,0),
    }));
    const radarData = [
      { subject:'Physical Risk', A: +avgPhysical },
      { subject:'Transition Risk', A: +avgTransition },
      { subject:'Solvency', A: Math.min(100, +avgSolvency/3) },
      { subject:'ESG Score', A: filteredInsurers.length ? filteredInsurers.reduce((a,b)=>a+b.esgScore,0)/filteredInsurers.length : 0 },
      { subject:'ORSA', A: filteredInsurers.length ? filteredInsurers.reduce((a,b)=>a+b.orsa_score,0)/filteredInsurers.length : 0 },
      { subject:'Climate Exposure', A: +avgClimateExp },
    ];
    const top10 = [...filteredInsurers].sort((a,b)=>b.gwp_usd_mn-a.gwp_usd_mn).slice(0,10);
    return <>
      <Grid cols={6} gap={10}>
        <KpiCard label="Total GWP" value={`$${(totalGwp/1000).toFixed(1)}B`} sub={`${filteredInsurers.length} insurers`} color={T.indigo} />
        <KpiCard label="Avg Solvency" value={`${avgSolvency}%`} sub="SCR ratio" color={T.green} />
        <KpiCard label="Climate Exposure" value={`${avgClimateExp}%`} sub="Avg portfolio" color={T.amber} />
        <KpiCard label="Avg Physical Risk" value={`${avgPhysical}/100`} sub="Score" color={T.red} />
        <KpiCard label="Avg Transition Risk" value={`${avgTransition}/100`} sub="Score" color={T.gold} />
        <KpiCard label="TCFD Adoption" value={`${tcfdFull}%`} sub="Full disclosure" color={T.green} />
      </Grid>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginTop:20 }}>
        <Section title="Top Insurers by GWP ($M)">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={top10} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{ fontSize:11 }} />
              <YAxis dataKey="name" type="category" width={120} tick={{ fontSize:11 }} />
              <Tooltip formatter={v=>`$${Number(v).toLocaleString()}M`} />
              <Bar dataKey="gwp_usd_mn" fill={T.indigo} name="GWP ($M)" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Section>
        <Section title="Climate Risk Radar (Avg)">
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke={T.border} />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize:11, fill:T.sub }} />
              <PolarRadiusAxis angle={90} domain={[0,100]} tick={{ fontSize:10 }} />
              <Radar name="Score" dataKey="A" stroke={T.indigo} fill={T.indigo} fillOpacity={0.25} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </Section>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginTop:8 }}>
        <Section title="Type Distribution (GWP $M)">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={typeDistribution} dataKey="gwp" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`}>
                {typeDistribution.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={v=>`$${Number(v).toLocaleString()}M`} />
            </PieChart>
          </ResponsiveContainer>
        </Section>
        <Section title="Insurer Comparison Table">
          <Tbl maxH={250} headers={['Insurer','Type','GWP $M','Solvency','Climate Exp','TCFD']}
            rows={filteredInsurers.slice(0,15).map(x => [
              x.name, x.type, x.gwp_usd_mn.toLocaleString(), `${x.solvencyRatio_pct}%`, `${x.climateExposure_pct}%`,
              <Badge text={x.tcfdStatus} color={x.tcfdStatus==='Full'?T.green:T.amber} />,
            ])} />
        </Section>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginTop:8 }}>
        <Section title="Solvency Ratio Distribution">
          {(() => {
            const buckets = [
              { range:'<150%', count: filteredInsurers.filter(x=>x.solvencyRatio_pct<150).length },
              { range:'150-200%', count: filteredInsurers.filter(x=>x.solvencyRatio_pct>=150 && x.solvencyRatio_pct<200).length },
              { range:'200-250%', count: filteredInsurers.filter(x=>x.solvencyRatio_pct>=200 && x.solvencyRatio_pct<250).length },
              { range:'250-300%', count: filteredInsurers.filter(x=>x.solvencyRatio_pct>=250 && x.solvencyRatio_pct<300).length },
              { range:'>300%', count: filteredInsurers.filter(x=>x.solvencyRatio_pct>=300).length },
            ];
            return (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={buckets}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="range" tick={{ fontSize:11 }} />
                  <YAxis tick={{ fontSize:11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill={T.green} name="Insurers" radius={[4,4,0,0]}>
                    {buckets.map((b,i) => <Cell key={i} fill={i===0?T.red:i<2?T.amber:T.green} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            );
          })()}
        </Section>
        <Section title="ESG Score vs Climate Exposure">
          <ResponsiveContainer width="100%" height={240}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="esgScore" name="ESG Score" tick={{ fontSize:11 }} />
              <YAxis dataKey="climateExposure_pct" name="Climate Exp" unit="%" tick={{ fontSize:11 }} />
              <Tooltip cursor={{ strokeDasharray:'3 3' }} />
              <Scatter data={filteredInsurers.map(x=>({...x, climateExposure_pct:parseFloat(x.climateExposure_pct)}))} fill={T.indigo} name="Insurers" />
            </ScatterChart>
          </ResponsiveContainer>
        </Section>
      </div>

      <Section title="Detailed Insurer Risk Profile">
        <Tbl maxH={300} headers={['Insurer','Country','Assets $B','Physical','Transition','Litigation','ESG','SBTi','ORSA']}
          rows={filteredInsurers.map(x => [
            x.name, x.country, `$${x.assets_usd_bn}B`, x.physicalRisk, x.transitionRisk, x.litigationRisk,
            <Badge text={`${x.esgScore}/100`} color={x.esgScore>70?T.green:x.esgScore>50?T.amber:T.red} />,
            <Badge text={x.sbtiStatus} color={x.sbtiStatus==='Committed'?T.green:T.sub} />,
            `${x.orsa_score}/100`,
          ])} />
      </Section>
    </>;
  };

  /* ════════════════════════════════════════════════════════════════════════════
     TAB 1: Underwriting Risk
     ════════════════════════════════════════════════════════════════════════ */
  const renderUnderwriting = () => {
    const filteredPerils = selPeril === 'All' ? PERILS : PERILS.filter(p=>p.name===selPeril);
    const claimsFreq = filteredPerils.map((p,i) => ({
      name: p.name,
      '2020': Math.round(p.avgAnnualLoss_mn * (0.85 + sr(i*31)*0.1)),
      '2021': Math.round(p.avgAnnualLoss_mn * (0.90 + sr(i*31+1)*0.12)),
      '2022': Math.round(p.avgAnnualLoss_mn * (0.95 + sr(i*31+2)*0.1)),
      '2023': Math.round(p.avgAnnualLoss_mn * (1.0 + sr(i*31+3)*0.08)),
      '2024': Math.round(p.avgAnnualLoss_mn * (1.02 + sr(i*31+4)*0.1)),
    }));
    const rpCurve = [10,25,50,100,200,250,500,1000].map(rp => {
      const totalLoss = filteredPerils.reduce((a,p) => {
        const scale = Math.log10(rp)/Math.log10(100);
        return a + p.return_period_100yr * scale * (0.9 + sr(rp+PERILS.indexOf(p)*7)*0.2);
      }, 0);
      return { rp: `1-in-${rp}`, loss_mn: Math.round(totalLoss / Math.max(filteredPerils.length, 1)) };
    });

    return <>
      <Grid cols={4} gap={10}>
        <KpiCard label="Total AAL" value={`$${(filteredPerils.reduce((a,p)=>a+p.avgAnnualLoss_mn,0)/1000).toFixed(1)}B`} sub="Avg Annual Loss" color={T.red} />
        <KpiCard label="Highest Trend" value={`+${filteredPerils.length ? Math.max(...filteredPerils.map(p=>p.trend_pct)).toFixed(1) : 0}%/yr`} sub={filteredPerils.length ? filteredPerils.reduce((a,b)=>b.trend_pct>a.trend_pct?b:a).name : '-'} color={T.amber} />
        <KpiCard label="Avg Model Confidence" value={`${filteredPerils.length ? (filteredPerils.reduce((a,p)=>a+p.modelConfidence,0)/filteredPerils.length*100).toFixed(0) : 0}%`} color={T.indigo} />
        <KpiCard label="Avg Reinsurance" value={`${filteredPerils.length ? (filteredPerils.reduce((a,p)=>a+p.reinsurance_coverage_pct,0)/filteredPerils.length).toFixed(0) : 0}%`} sub="Coverage" color={T.green} />
      </Grid>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginTop:20 }}>
        <Section title="Peril Trend (% Annual Increase)">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={filteredPerils}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize:10, angle:-25 }} height={60} />
              <YAxis unit="%" tick={{ fontSize:11 }} />
              <Tooltip />
              <Bar dataKey="trend_pct" fill={T.red} name="Annual Trend %" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Section>
        <Section title="AAL by Peril ($M)">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={filteredPerils}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize:10, angle:-25 }} height={60} />
              <YAxis tick={{ fontSize:11 }} tickFormatter={v=>`$${(v/1000).toFixed(1)}B`} />
              <Tooltip formatter={v=>`$${Number(v).toLocaleString()}M`} />
              <Bar dataKey="avgAnnualLoss_mn" fill={T.indigo} name="AAL ($M)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Section>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginTop:8 }}>
        <Section title="Return Period Curve (PML $M)">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={rpCurve}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="rp" tick={{ fontSize:11 }} />
              <YAxis tick={{ fontSize:11 }} tickFormatter={v=>`$${(v/1000).toFixed(0)}B`} />
              <Tooltip formatter={v=>`$${Number(v).toLocaleString()}M`} />
              <Line type="monotone" dataKey="loss_mn" stroke={T.red} strokeWidth={2} dot={{ r:4 }} name="PML ($M)" />
            </LineChart>
          </ResponsiveContainer>
        </Section>
        <Section title="Claims Frequency Trend ($M)">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={claimsFreq.slice(0,6)}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize:10 }} />
              <YAxis tick={{ fontSize:11 }} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="2022" stackId="1" stroke={T.indigo} fill={T.indigo+'33'} />
              <Area type="monotone" dataKey="2023" stackId="2" stroke={T.gold} fill={T.gold+'33'} />
              <Area type="monotone" dataKey="2024" stackId="3" stroke={T.red} fill={T.red+'33'} />
            </AreaChart>
          </ResponsiveContainer>
        </Section>
      </div>

      <Section title="Peril Details">
        <Tbl headers={['Peril','AAL ($M)','Trend %/yr','Confidence','Reinsurance %','100yr PML ($M)']}
          rows={filteredPerils.map(p => [
            p.name, p.avgAnnualLoss_mn.toLocaleString(), `+${p.trend_pct}%`,
            `${(p.modelConfidence*100).toFixed(0)}%`, `${p.reinsurance_coverage_pct}%`,
            p.return_period_100yr.toLocaleString(),
          ])} />
      </Section>
    </>;
  };

  /* ════════════════════════════════════════════════════════════════════════════
     TAB 2: Investment Portfolio Risk
     ════════════════════════════════════════════════════════════════════════ */
  const renderInvestment = () => {
    const insP = selInsurer==='All' ? PORTFOLIOS : PORTFOLIOS.filter(x=>x.insurer===selInsurer);
    const byAC = ASSET_CLASSES.map(ac => {
      const rows = insP.filter(x=>x.assetClass===ac);
      return {
        assetClass: ac,
        avgAlloc: rows.length ? (rows.reduce((a,b)=>a+b.allocation_pct,0)/rows.length).toFixed(1) : '0.0',
        avgReturn: rows.length ? (rows.reduce((a,b)=>a+b.climate_adj_return,0)/rows.length).toFixed(2) : '0.00',
      };
    });
    const fossilPct = filteredInsurers.length ? (filteredInsurers.reduce((a,b) => a + parseFloat(b.transitionRisk)*0.3, 0) / filteredInsurers.length).toFixed(1) : '0.0';
    const greenBondPct = filteredInsurers.length ? (filteredInsurers.reduce((a,b) => a + parseFloat(b.esgScore)*0.15, 0) / filteredInsurers.length).toFixed(1) : '0.0';
    const strandedPct = filteredInsurers.length ? (filteredInsurers.reduce((a,b) => a + parseFloat(b.transitionRisk)*0.2, 0) / filteredInsurers.length).toFixed(1) : '0.0';

    const scenarioImpact = SCENARIOS.map(s => ({
      name: s.name,
      portfolioValue: +(100 + s.investmentImpact_pct).toFixed(1),
      claimsIncrease: s.claimsImpact_pct,
    }));

    return <>
      <Grid cols={4} gap={10}>
        <KpiCard label="Green Bond Allocation" value={`${greenBondPct}%`} color={T.green} />
        <KpiCard label="Fossil Fuel Exposure" value={`${fossilPct}%`} sub="Investment portfolio" color={T.red} />
        <KpiCard label="Stranded Asset Risk" value={`${strandedPct}%`} color={T.amber} />
        <KpiCard label="Avg Climate-Adj Return" value={`${byAC.length ? (byAC.reduce((a,b)=>a+parseFloat(b.avgReturn),0)/byAC.length).toFixed(2) : 0}%`} color={T.indigo} />
      </Grid>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginTop:20 }}>
        <Section title="Asset Allocation (Avg %)">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={byAC} dataKey="avgAlloc" nameKey="assetClass" cx="50%" cy="50%" outerRadius={100} label={({name,value})=>`${name}: ${value}%`}>
                {byAC.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Section>
        <Section title="Climate-Adjusted Returns by Asset Class">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={byAC}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="assetClass" tick={{ fontSize:11 }} />
              <YAxis unit="%" tick={{ fontSize:11 }} />
              <Tooltip />
              <ReferenceLine y={0} stroke={T.navy} />
              <Bar dataKey="avgReturn" name="Climate-Adj Return %" radius={[4,4,0,0]}>
                {byAC.map((d,i) => <Cell key={i} fill={parseFloat(d.avgReturn)>=0?T.green:T.red} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Section>
      </div>

      <Section title="Scenario Impact on Portfolio Value (Index = 100)">
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={scenarioImpact}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="name" tick={{ fontSize:11 }} />
            <YAxis tick={{ fontSize:11 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="portfolioValue" fill={T.indigo} name="Portfolio Value Index" radius={[4,4,0,0]} />
            <Line type="monotone" dataKey="claimsIncrease" stroke={T.red} strokeWidth={2} name="Claims Increase %" />
            <ReferenceLine y={100} stroke={T.gold} strokeDasharray="5 5" label="Baseline" />
          </ComposedChart>
        </ResponsiveContainer>
      </Section>

      <Section title="Insurer Investment Profile">
        <Tbl maxH={280} headers={['Insurer','Assets $B','Govt Bonds %','Corp Bonds %','Equity %','Real Estate %','Infra %','Alt %']}
          rows={filteredInsurers.slice(0,12).map(ins => {
            const pRows = PORTFOLIOS.filter(p=>p.insurer===ins.name);
            const getAlloc = ac => { const r = pRows.find(p=>p.assetClass===ac); return r ? r.allocation_pct+'%' : '-'; };
            return [
              ins.name, `$${ins.assets_usd_bn}B`,
              getAlloc('Govt Bonds'), getAlloc('Corp Bonds'), getAlloc('Equity'),
              getAlloc('Real Estate'), getAlloc('Infrastructure'), getAlloc('Alternatives'),
            ];
          })} />
      </Section>

      <Section title="Green vs Fossil Investment Trajectory">
        {(() => {
          const trajectory = [2022,2023,2024,2025,2026,2027,2028,2030].map((yr,i) => ({
            year: yr,
            greenPct: +(8 + i*3.2 + sr(i*151)*2).toFixed(1),
            fossilPct: +(18 - i*2.1 + sr(i*151+1)*1.5).toFixed(1),
          }));
          return (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={trajectory}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize:11 }} />
                <YAxis tick={{ fontSize:11 }} unit="%" />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="greenPct" stroke={T.green} fill={T.green+'22'} name="Green Investment %" />
                <Area type="monotone" dataKey="fossilPct" stroke={T.red} fill={T.red+'22'} name="Fossil Investment %" />
              </AreaChart>
            </ResponsiveContainer>
          );
        })()}
      </Section>
    </>;
  };

  /* ════════════════════════════════════════════════════════════════════════════
     TAB 3: Solvency & Capital
     ════════════════════════════════════════════════════════════════════════ */
  const renderSolvency = () => {
    const solvencyDist = filteredInsurers.map(x => ({
      name: x.name, solvency: x.solvencyRatio_pct, orsa: x.orsa_score,
      scr_stressed: Math.max(100, Math.round(x.solvencyRatio_pct * (1 - scenarioData.capitalImpact_pct/100))),
    })).sort((a,b) => a.solvency - b.solvency).slice(0, 15);

    const capitalBuffer = filteredInsurers.map(x => {
      const baseScr = x.assets_usd_bn * 0.08;
      const climateAdj = baseScr * (1 + Math.abs(scenarioData.capitalImpact_pct)/100);
      return { name: x.name, baseScr: +baseScr.toFixed(2), climateScr: +climateAdj.toFixed(2), buffer: +(x.assets_usd_bn * x.solvencyRatio_pct/100 - climateAdj).toFixed(2) };
    }).sort((a,b) => a.buffer - b.buffer).slice(0, 10);

    const carbonImpact = [25,50,75,100,150,200,250].map(cp => ({
      carbonPrice: `$${cp}/t`,
      scrIncrease: +(cp * 0.035 * Math.abs(scenarioData.capitalImpact_pct/10)).toFixed(1),
      solvencyDrop: +(cp * 0.012).toFixed(1),
    }));

    const ngfsCapital = SCENARIOS.map(s => ({
      name: s.name,
      capitalImpact: s.capitalImpact_pct,
      claimsImpact: s.claimsImpact_pct,
      investmentImpact: s.investmentImpact_pct,
    }));

    return <>
      <Grid cols={4} gap={10}>
        <KpiCard label="Avg Solvency Ratio" value={`${avgSolvency}%`} sub="SCR Coverage" color={+avgSolvency>=150?T.green:T.amber} />
        <KpiCard label="Below 150% SCR" value={filteredInsurers.filter(x=>x.solvencyRatio_pct<150).length} sub="Insurers at risk" color={T.red} />
        <KpiCard label="Scenario Capital Impact" value={`${scenarioData.capitalImpact_pct}%`} sub={selScenario} color={T.amber} />
        <KpiCard label="Avg ORSA Score" value={`${filteredInsurers.length ? Math.round(filteredInsurers.reduce((a,b)=>a+b.orsa_score,0)/filteredInsurers.length) : 0}/100`} color={T.indigo} />
      </Grid>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginTop:20 }}>
        <Section title="Solvency vs Climate-Stressed SCR">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={solvencyDist} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{ fontSize:11 }} domain={[0, 'auto']} />
              <YAxis dataKey="name" type="category" width={100} tick={{ fontSize:10 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="solvency" fill={T.indigo} name="Current Solvency %" />
              <Bar dataKey="scr_stressed" fill={T.red} name="Stressed SCR %" />
              <ReferenceLine x={150} stroke={T.gold} strokeDasharray="5 5" label="150% Min" />
            </BarChart>
          </ResponsiveContainer>
        </Section>
        <Section title={`Carbon Price Impact on SCR (${selScenario})`}>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={carbonImpact}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="carbonPrice" tick={{ fontSize:11 }} />
              <YAxis tick={{ fontSize:11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="scrIncrease" fill={T.amber} name="SCR Increase %" radius={[4,4,0,0]} />
              <Line type="monotone" dataKey="solvencyDrop" stroke={T.red} strokeWidth={2} name="Solvency Drop %" />
            </ComposedChart>
          </ResponsiveContainer>
        </Section>
      </div>

      <Section title="NGFS Scenario Capital Position">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={ngfsCapital}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="name" tick={{ fontSize:11 }} />
            <YAxis tick={{ fontSize:11 }} unit="%" />
            <Tooltip />
            <Legend />
            <Bar dataKey="capitalImpact" fill={T.red} name="Capital Impact %" />
            <Bar dataKey="claimsImpact" fill={T.amber} name="Claims Impact %" />
            <Bar dataKey="investmentImpact" fill={T.indigo} name="Investment Impact %" />
          </BarChart>
        </ResponsiveContainer>
      </Section>

      <Section title="Capital Buffer Analysis ($B)">
        <Tbl headers={['Insurer','Base SCR ($B)','Climate SCR ($B)','Buffer ($B)','Status']}
          rows={capitalBuffer.map(x => [
            x.name, `$${x.baseScr}B`, `$${x.climateScr}B`, `$${x.buffer}B`,
            <Badge text={x.buffer>0?'Adequate':'Deficit'} color={x.buffer>0?T.green:T.red} />,
          ])} />
      </Section>

      <div style={{ marginTop:12, padding:'14px 18px', background:T.surface, borderRadius:8, border:`1px solid ${T.border}` }}>
        <div style={{ fontSize:14, fontWeight:700, color:T.navy, marginBottom:10 }}>What-If: Carbon Price Impact on Capital</div>
        <div style={{ display:'flex', gap:20, alignItems:'center', flexWrap:'wrap' }}>
          <div>
            <span style={{ fontSize:12, color:T.sub }}>Carbon Price ($/tCO2e): </span>
            <input type="range" min={0} max={300} step={5} value={carbonPrice} onChange={e=>setCarbonPrice(+e.target.value)} style={{ verticalAlign:'middle' }} />
            <span style={{ fontSize:14, fontWeight:700, color:T.navy, marginLeft:8 }}>${carbonPrice}</span>
          </div>
          <div style={{ display:'flex', gap:12 }}>
            <div style={{ padding:'8px 14px', background:T.card, border:`1px solid ${T.border}`, borderRadius:6 }}>
              <div style={{ fontSize:11, color:T.sub }}>SCR Increase</div>
              <div style={{ fontSize:16, fontWeight:700, color:T.red }}>+{(carbonPrice*0.032).toFixed(1)}%</div>
            </div>
            <div style={{ padding:'8px 14px', background:T.card, border:`1px solid ${T.border}`, borderRadius:6 }}>
              <div style={{ fontSize:11, color:T.sub }}>Solvency Impact</div>
              <div style={{ fontSize:16, fontWeight:700, color:T.amber }}>-{(carbonPrice*0.018).toFixed(1)} pts</div>
            </div>
            <div style={{ padding:'8px 14px', background:T.card, border:`1px solid ${T.border}`, borderRadius:6 }}>
              <div style={{ fontSize:11, color:T.sub }}>Investment Loss</div>
              <div style={{ fontSize:16, fontWeight:700, color:T.red }}>${(carbonPrice*0.045).toFixed(1)}B</div>
            </div>
          </div>
        </div>
      </div>

      <Section title="ORSA Climate Stress Results">
        <Tbl headers={['Insurer','ORSA Score','Solvency %','Stressed Solvency','Capital Buffer','ORSA Status']}
          rows={filteredInsurers.slice(0,12).map(x => {
            const stressed = Math.max(100, Math.round(x.solvencyRatio_pct * (1 - Math.abs(scenarioData.capitalImpact_pct)/100) - carbonPrice*0.015));
            return [
              x.name, `${x.orsa_score}/100`, `${x.solvencyRatio_pct}%`, `${stressed}%`,
              `${(x.solvencyRatio_pct - stressed)}pp`,
              <Badge text={stressed>=150?'Pass':stressed>=130?'Watch':'Fail'} color={stressed>=150?T.green:stressed>=130?T.amber:T.red} />,
            ];
          })} />
      </Section>
    </>;
  };

  /* ════════════════════════════════════════════════════════════════════════════
     TAB 4: Cat Modelling
     ════════════════════════════════════════════════════════════════════════ */
  const renderCatModelling = () => {
    const sortedEvents = [...CAT_EVENTS].sort((a,b) => b.insured_loss_bn - a.insured_loss_bn);
    const lossTrend = [2005,2010,2015,2017,2018,2019,2020,2021,2022,2023].map(yr => {
      const evts = CAT_EVENTS.filter(e=>e.year===yr);
      return { year: yr, totalInsured: evts.reduce((a,b)=>a+b.insured_loss_bn,0), count: evts.length };
    });
    const perilBreakdown = [...new Set(CAT_EVENTS.map(e=>e.peril))].map(p => {
      const evts = CAT_EVENTS.filter(e=>e.peril===p);
      return { name:p, insuredLoss: +evts.reduce((a,b)=>a+b.insured_loss_bn,0).toFixed(1), count: evts.length };
    }).sort((a,b) => b.insuredLoss - a.insuredLoss);
    const avgAttribution = CAT_EVENTS.length ? (CAT_EVENTS.reduce((a,b)=>a+b.climate_attribution_pct,0)/CAT_EVENTS.length).toFixed(0) : 0;
    const freqSev = CAT_EVENTS.map(e => ({
      name: e.event.slice(0,18), insured: e.insured_loss_bn, attribution: e.climate_attribution_pct,
    }));

    return <>
      <Grid cols={4} gap={10}>
        <KpiCard label="Total Insured Loss" value={`$${CAT_EVENTS.reduce((a,b)=>a+b.insured_loss_bn,0).toFixed(0)}B`} sub="20 events" color={T.red} />
        <KpiCard label="Total Economic Loss" value={`$${CAT_EVENTS.reduce((a,b)=>a+b.economic_loss_bn,0).toFixed(0)}B`} color={T.amber} />
        <KpiCard label="Avg Climate Attribution" value={`${avgAttribution}%`} color={T.indigo} />
        <KpiCard label="Protection Gap" value={`${CAT_EVENTS.length ? ((1 - CAT_EVENTS.reduce((a,b)=>a+b.insured_loss_bn,0)/Math.max(CAT_EVENTS.reduce((a,b)=>a+b.economic_loss_bn,0),1))*100).toFixed(0) : 0}%`} sub="Insured vs Economic" color={T.red} />
      </Grid>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginTop:20 }}>
        <Section title="Insured Loss Trend by Year ($B)">
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={lossTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize:11 }} />
              <YAxis tick={{ fontSize:11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="totalInsured" fill={T.red} name="Insured Loss ($B)" radius={[4,4,0,0]} />
              <Line type="monotone" dataKey="count" stroke={T.indigo} strokeWidth={2} name="Event Count" />
            </ComposedChart>
          </ResponsiveContainer>
        </Section>
        <Section title="Loss by Peril Type ($B)">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={perilBreakdown} dataKey="insuredLoss" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({name,value})=>`${name}: $${value}B`}>
                {perilBreakdown.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Section>
      </div>

      <Section title="Severity vs Climate Attribution">
        <ResponsiveContainer width="100%" height={280}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="attribution" name="Attribution %" unit="%" tick={{ fontSize:11 }} />
            <YAxis dataKey="insured" name="Insured Loss" unit="$B" tick={{ fontSize:11 }} />
            <Tooltip cursor={{ strokeDasharray:'3 3' }} />
            <Scatter data={freqSev} fill={T.indigo} name="Events" />
          </ScatterChart>
        </ResponsiveContainer>
      </Section>

      <Section title="Historical Catastrophe Events">
        <Tbl maxH={350} headers={['Event','Year','Country','Peril','Insured $B','Economic $B','Fatalities','Attribution %']}
          rows={sortedEvents.map(e => [
            e.event, e.year, e.country, e.peril, `$${e.insured_loss_bn}B`, `$${e.economic_loss_bn}B`,
            e.fatalities.toLocaleString(), <Badge text={`${e.climate_attribution_pct}%`} color={e.climate_attribution_pct>30?T.red:T.amber} />,
          ])} />
      </Section>

      <Section title="Realistic Disaster Scenarios (RDS)">
        <Tbl headers={['Scenario','Peril','Region','1-in-200 PML ($B)','Gross Loss ($B)','Net Retained ($B)','Reinsurance Recovery ($B)']}
          rows={[
            ['Miami Cat-5 Hurricane','Tropical Cyclone','SE USA','$95B','$120B','$38B','$82B'],
            ['Tokyo M8.0 Earthquake','Subsidence','Kanto, Japan','$75B','$180B','$42B','$33B'],
            ['European Windstorm Xynthia+','Winter Storm','Western EU','$42B','$58B','$18B','$24B'],
            ['California Megafire','Wildfire','CA, USA','$38B','$52B','$22B','$16B'],
            ['Bangladesh Super Cyclone','Tropical Cyclone','Bay of Bengal','$8B','$65B','$7B','$1B'],
            ['Rhine/Danube Mega-Flood','Flood','Central EU','$55B','$82B','$25B','$30B'],
            ['Indian Monsoon Failure','Drought','South Asia','$12B','$95B','$10B','$2B'],
            ['Australian East Coast Low','Flood','NSW/QLD, AU','$22B','$35B','$12B','$10B'],
          ]} />
      </Section>

      <Section title="PML (Probable Maximum Loss) Curve by Selected Peril">
        {(() => {
          const sp = selPeril === 'All' ? PERILS[0] : (PERILS.find(p=>p.name===selPeril) || PERILS[0]);
          const pmlCurve = [10,25,50,100,200,250,500].map(rp => ({
            rp: `1-in-${rp}`,
            pml_bn: +(sp.return_period_100yr * Math.log10(Math.max(rp,1))/Math.log10(100) / 1000 * (0.9 + sr(rp*3)*0.2)).toFixed(1),
          }));
          return (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={pmlCurve}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="rp" tick={{ fontSize:11 }} />
                <YAxis tick={{ fontSize:11 }} unit="$B" />
                <Tooltip />
                <Area type="monotone" dataKey="pml_bn" stroke={T.red} fill={T.red+'22'} name="PML ($B)" />
              </AreaChart>
            </ResponsiveContainer>
          );
        })()}
      </Section>
    </>;
  };

  /* ════════════════════════════════════════════════════════════════════════════
     TAB 5: IAIS & Regulatory
     ════════════════════════════════════════════════════════════════════════ */
  const renderRegulatory = () => {
    const complianceByInsurer = filteredInsurers.map(x => ({
      name: x.name,
      tcfd: x.tcfdStatus === 'Full' ? 100 : 50,
      orsa: x.orsa_score,
      esg: x.esgScore,
      overall: Math.round((x.orsa_score + x.esgScore + (x.tcfdStatus==='Full'?100:50)) / 3),
    })).sort((a,b) => b.overall - a.overall).slice(0, 15);

    const gapAnalysis = REGULATORY.map((r,i) => ({
      ...r,
      compliance_pct: Math.round(40 + sr(i*23)*55),
    }));

    return <>
      <Grid cols={4} gap={10}>
        <KpiCard label="TCFD Full Adoption" value={`${tcfdFull}%`} color={T.green} />
        <KpiCard label="Avg ORSA Climate" value={`${filteredInsurers.length ? Math.round(filteredInsurers.reduce((a,b)=>a+b.orsa_score,0)/filteredInsurers.length) : 0}/100`} color={T.indigo} />
        <KpiCard label="SBTi Committed" value={`${filteredInsurers.length ? Math.round(filteredInsurers.filter(x=>x.sbtiStatus==='Committed').length/filteredInsurers.length*100) : 0}%`} color={T.green} />
        <KpiCard label="Regulatory Frameworks" value={REGULATORY.length} sub="Tracked" color={T.gold} />
      </Grid>

      <Section title="Regulatory Framework Compliance">
        <Tbl headers={['Framework','Area','Description','Status','Compliance %']}
          rows={gapAnalysis.map(r => [
            r.framework, r.area, r.description, <Badge text={r.status} color={r.status.includes('Mandatory')?T.red:r.status==='Required'?T.amber:T.green} />,
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ width:80, height:8, background:T.border, borderRadius:4, overflow:'hidden' }}>
                <div style={{ width:`${r.compliance_pct}%`, height:'100%', background:r.compliance_pct>70?T.green:r.compliance_pct>40?T.amber:T.red, borderRadius:4 }} />
              </div>
              <span style={{ fontSize:11 }}>{r.compliance_pct}%</span>
            </div>,
          ])} />
      </Section>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginTop:12 }}>
        <Section title="Insurer Compliance Scores">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={complianceByInsurer} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" domain={[0,100]} tick={{ fontSize:11 }} />
              <YAxis dataKey="name" type="category" width={110} tick={{ fontSize:10 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="tcfd" fill={T.green} name="TCFD" stackId="a" />
              <Bar dataKey="orsa" fill={T.indigo} name="ORSA" />
              <Bar dataKey="esg" fill={T.gold} name="ESG" />
            </BarChart>
          </ResponsiveContainer>
        </Section>
        <Section title="TCFD Adoption by Insurer Type">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={[
                { name:'Full Disclosure', value:filteredInsurers.filter(x=>x.tcfdStatus==='Full').length },
                { name:'Partial', value:filteredInsurers.filter(x=>x.tcfdStatus==='Partial').length },
              ]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                <Cell fill={T.green} /><Cell fill={T.amber} />
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Section>
      </div>
    </>;
  };

  /* ════════════════════════════════════════════════════════════════════════════
     TAB 6: Reinsurance & ILS
     ════════════════════════════════════════════════════════════════════════ */
  const renderReinsurance = () => {
    const catBondMarket = [2018,2019,2020,2021,2022,2023,2024].map((yr,i) => ({
      year: yr,
      outstanding_bn: +(28 + i*4 + sr(i*41)*5).toFixed(1),
      newIssuance_bn: +(8 + sr(i*41+1)*7).toFixed(1),
      avgSpread_bps: Math.round(400 + sr(i*41+2)*350),
    }));
    const reinsuranceCoverage = PERILS.map(p => ({
      name: p.name, coverage: p.reinsurance_coverage_pct, aal: p.avgAnnualLoss_mn,
    }));
    const cedantAnalysis = filteredInsurers.slice(0,12).map((ins,i) => ({
      name: ins.name,
      ceded_pct: +(10 + sr(i*51)*40).toFixed(1),
      retentionRatio: +(60 + sr(i*51+1)*35).toFixed(1),
      catExposure_mn: Math.round(ins.gwp_usd_mn * parseFloat(ins.climateExposure_pct)/100),
    }));

    return <>
      <Grid cols={4} gap={10}>
        <KpiCard label="Cat Bond Outstanding" value={`$${catBondMarket.length ? catBondMarket[catBondMarket.length-1].outstanding_bn : 0}B`} color={T.indigo} />
        <KpiCard label="New Issuance 2024" value={`$${catBondMarket.length ? catBondMarket[catBondMarket.length-1].newIssuance_bn : 0}B`} color={T.green} />
        <KpiCard label="Avg ILS Spread" value={`${catBondMarket.length ? catBondMarket[catBondMarket.length-1].avgSpread_bps : 0} bps`} color={T.gold} />
        <KpiCard label="Retrocession Capacity" value={`$${(42 + sr(999)*18).toFixed(0)}B`} sub="Estimated global" color={T.amber} />
      </Grid>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginTop:20 }}>
        <Section title="Cat Bond Market ($B)">
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={catBondMarket}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize:11 }} />
              <YAxis tick={{ fontSize:11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="outstanding_bn" fill={T.indigo} name="Outstanding ($B)" radius={[4,4,0,0]} />
              <Bar dataKey="newIssuance_bn" fill={T.green} name="New Issuance ($B)" radius={[4,4,0,0]} />
              <Line type="monotone" dataKey="avgSpread_bps" stroke={T.red} strokeWidth={2} name="Avg Spread (bps)" yAxisId={1} />
            </ComposedChart>
          </ResponsiveContainer>
        </Section>
        <Section title="Reinsurance Coverage by Peril (%)">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={reinsuranceCoverage}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize:10, angle:-25 }} height={60} />
              <YAxis unit="%" tick={{ fontSize:11 }} domain={[0,100]} />
              <Tooltip />
              <Bar dataKey="coverage" fill={T.green} name="Coverage %" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Section>
      </div>

      <Section title="Cedant Analysis">
        <Tbl headers={['Insurer','Ceded %','Retention Ratio %','Cat Exposure ($M)']}
          rows={cedantAnalysis.map(x => [
            x.name, `${x.ceded_pct}%`, `${x.retentionRatio}%`, `$${x.catExposure_mn.toLocaleString()}M`,
          ])} />
      </Section>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginTop:8 }}>
        <Section title="ILS Spread vs Climate Risk Score">
          {(() => {
            const ilsData = filteredInsurers.slice(0,15).map((ins,i) => ({
              name: ins.name.slice(0,12),
              climateRisk: +((parseFloat(ins.physicalRisk) + parseFloat(ins.transitionRisk))/2).toFixed(0),
              spread_bps: Math.round(200 + parseFloat(ins.physicalRisk)*5 + sr(i*131)*100),
            }));
            return (
              <ResponsiveContainer width="100%" height={280}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="climateRisk" name="Climate Risk Score" tick={{ fontSize:11 }} />
                  <YAxis dataKey="spread_bps" name="ILS Spread" unit=" bps" tick={{ fontSize:11 }} />
                  <Tooltip cursor={{ strokeDasharray:'3 3' }} />
                  <Scatter data={ilsData} fill={T.indigo} name="Insurers" />
                </ScatterChart>
              </ResponsiveContainer>
            );
          })()}
        </Section>
        <Section title="Retrocession Capacity by Year ($B)">
          {(() => {
            const retroData = [2019,2020,2021,2022,2023,2024].map((yr,i) => ({
              year: yr,
              capacity_bn: +(35 + i*3 + sr(i*141)*8).toFixed(1),
              demand_bn: +(28 + i*4.5 + sr(i*141+1)*6).toFixed(1),
              gap_bn: 0,
            }));
            retroData.forEach(r => { r.gap_bn = +(r.demand_bn - r.capacity_bn).toFixed(1); });
            return (
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={retroData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize:11 }} />
                  <YAxis tick={{ fontSize:11 }} unit="$B" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="capacity_bn" fill={T.green} name="Capacity ($B)" radius={[4,4,0,0]} />
                  <Bar dataKey="demand_bn" fill={T.amber} name="Demand ($B)" radius={[4,4,0,0]} />
                  <Line type="monotone" dataKey="gap_bn" stroke={T.red} strokeWidth={2} name="Gap ($B)" />
                </ComposedChart>
              </ResponsiveContainer>
            );
          })()}
        </Section>
      </div>

      <Section title="Cat Bond Structure Summary">
        <Tbl headers={['Bond Name','Peril','Sponsor','Size ($M)','Spread (bps)','Trigger','Maturity','Rating']}
          rows={[
            ['Nakama Re 2024','Typhoon','JMIA','$350M','475 bps','Industry Index','2027','BB+'],
            ['Residential Re 2024','Hurricane','USAA','$500M','525 bps','Indemnity','2027','BB'],
            ['FloodSmart Re 2023','Flood','NFIP','$275M','580 bps','Industry Index','2026','BB-'],
            ['Galileo Re 2024','EU Wind','Generali','$200M','410 bps','Parametric','2028','BB+'],
            ['Kizuna Re 2023','Earthquake','Tokio Marine','$450M','320 bps','Modeled Loss','2026','BBB-'],
            ['Sanders Re 2024','Multi-Peril','Allstate','$625M','490 bps','Indemnity','2027','BB'],
            ['Atlas Re 2023','Hurricane','Swiss Re','$300M','550 bps','Industry Index','2026','BB'],
            ['Matterhorn Re 2024','EU Flood','Zurich','$180M','430 bps','Parametric','2028','BB+'],
          ]} />
      </Section>
    </>;
  };

  /* ════════════════════════════════════════════════════════════════════════════
     TAB 7: Physical Risk Pricing
     ════════════════════════════════════════════════════════════════════════ */
  const renderPhysicalPricing = () => {
    const rpValues = [10,25,50,100,200,250,500,1000];
    const selectedPeril = selPeril === 'All' ? PERILS[0] : (PERILS.find(p=>p.name===selPeril) || PERILS[0]);
    const premiumImpact = rpValues.map(rp => {
      const base = selectedPeril.avgAnnualLoss_mn;
      const scale = Math.log10(Math.max(rp,1))/Math.log10(100);
      return {
        rp: `1-in-${rp}`,
        premium_mn: +(base * scale * 0.015 * (1 + sr(rp*7)*0.3)).toFixed(1),
        pml_mn: Math.round(selectedPeril.return_period_100yr * scale * (0.8 + sr(rp*7+1)*0.4)),
      };
    });

    const lossRatioTrend = [2018,2019,2020,2021,2022,2023,2024].map((yr,i) => ({
      year: yr,
      lossRatio: +(55 + i*2.5 + sr(i*61)*15).toFixed(1),
      combinedRatio: +(92 + i*1.8 + sr(i*61+1)*10).toFixed(1),
    }));

    const pricingAdequacy = filteredInsurers.slice(0,10).map((ins,i) => ({
      name: ins.name,
      technicalPrice: +(100 + sr(i*71)*50).toFixed(0),
      actualPrice: +(80 + sr(i*71+1)*60).toFixed(0),
      adequacy: 0,
    }));
    pricingAdequacy.forEach(p => { p.adequacy = +(p.actualPrice / Math.max(p.technicalPrice, 1) * 100).toFixed(1); });

    return <>
      <Grid cols={4} gap={10}>
        <KpiCard label="Selected Peril" value={selectedPeril.name} sub={`AAL: $${selectedPeril.avgAnnualLoss_mn}M`} color={T.indigo} />
        <KpiCard label="Trend" value={`+${selectedPeril.trend_pct}%/yr`} color={T.red} />
        <KpiCard label="Model Confidence" value={`${(selectedPeril.modelConfidence*100).toFixed(0)}%`} color={T.green} />
        <KpiCard label="100yr PML" value={`$${(selectedPeril.return_period_100yr/1000).toFixed(1)}B`} color={T.amber} />
      </Grid>

      <div style={{ marginTop:16, padding:'12px 16px', background:T.surface, borderRadius:8, border:`1px solid ${T.border}` }}>
        <div style={{ fontSize:13, fontWeight:600, color:T.navy, marginBottom:8 }}>Risk-Adjusted Premium Calculator</div>
        <div style={{ display:'flex', gap:16, alignItems:'center', flexWrap:'wrap' }}>
          <div>
            <span style={{ fontSize:12, color:T.sub }}>Return Period: </span>
            <input type="range" min={10} max={1000} step={10} value={returnPeriod} onChange={e=>setReturnPeriod(+e.target.value)} />
            <span style={{ fontSize:13, fontWeight:600, marginLeft:6 }}>1-in-{returnPeriod}</span>
          </div>
          <div>
            <span style={{ fontSize:12, color:T.sub }}>Carbon Price: </span>
            <input type="range" min={0} max={300} step={5} value={carbonPrice} onChange={e=>setCarbonPrice(+e.target.value)} />
            <span style={{ fontSize:13, fontWeight:600, marginLeft:6 }}>${carbonPrice}/t</span>
          </div>
          <div style={{ padding:'8px 14px', background:T.card, border:`1px solid ${T.border}`, borderRadius:6 }}>
            <span style={{ fontSize:12, color:T.sub }}>Premium Impact: </span>
            <span style={{ fontSize:16, fontWeight:700, color:T.red }}>+{(carbonPrice * 0.018 * Math.log10(Math.max(returnPeriod,1))/2).toFixed(1)}%</span>
          </div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginTop:20 }}>
        <Section title="Premium & PML by Return Period">
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={premiumImpact}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="rp" tick={{ fontSize:11 }} />
              <YAxis tick={{ fontSize:11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="premium_mn" fill={T.indigo} name="Premium ($M)" radius={[4,4,0,0]} />
              <Line type="monotone" dataKey="pml_mn" stroke={T.red} strokeWidth={2} name="PML ($M)" />
            </ComposedChart>
          </ResponsiveContainer>
        </Section>
        <Section title="Loss Ratio Trend">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={lossRatioTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize:11 }} />
              <YAxis tick={{ fontSize:11 }} unit="%" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="lossRatio" stroke={T.red} strokeWidth={2} name="Loss Ratio %" />
              <Line type="monotone" dataKey="combinedRatio" stroke={T.indigo} strokeWidth={2} name="Combined Ratio %" />
              <ReferenceLine y={100} stroke={T.gold} strokeDasharray="5 5" label="100%" />
            </LineChart>
          </ResponsiveContainer>
        </Section>
      </div>

      <Section title="Pricing Adequacy Analysis">
        <Tbl headers={['Insurer','Technical Price','Actual Price','Adequacy %','Status']}
          rows={pricingAdequacy.map(x => [
            x.name, x.technicalPrice, x.actualPrice, `${x.adequacy}%`,
            <Badge text={x.adequacy>=95?'Adequate':x.adequacy>=80?'Marginal':'Deficient'} color={x.adequacy>=95?T.green:x.adequacy>=80?T.amber:T.red} />,
          ])} />
      </Section>

      <Section title="Geographic Loss Concentration">
        {(() => {
          const geoLoss = ['USA','Japan','Germany','Australia','India','UK','France','China','Brazil','Canada'].map((c,i) => ({
            country: c,
            insuredLoss_bn: +(2 + sr(i*161)*35).toFixed(1),
            protectionGap_pct: +(20 + sr(i*161+1)*60).toFixed(0),
            climateLoading_pct: +(5 + sr(i*161+2)*35).toFixed(0),
          }));
          return (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={geoLoss} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize:11 }} />
                  <YAxis dataKey="country" type="category" width={80} tick={{ fontSize:11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="insuredLoss_bn" fill={T.red} name="Insured Loss ($B)" radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
              <Tbl headers={['Country','Loss $B','Protection Gap','Climate Loading']}
                rows={geoLoss.map(g => [
                  g.country, `$${g.insuredLoss_bn}B`,
                  <Badge text={`${g.protectionGap_pct}%`} color={+g.protectionGap_pct>50?T.red:T.amber} />,
                  `+${g.climateLoading_pct}%`,
                ])} />
            </div>
          );
        })()}
      </Section>
    </>;
  };

  /* ════════════════════════════════════════════════════════════════════════════
     TAB 8: Transition Risk
     ════════════════════════════════════════════════════════════════════════ */
  const renderTransition = () => {
    const strandedByInsurer = filteredInsurers.map((x,i) => ({
      name: x.name,
      strandedAsset_pct: +(parseFloat(x.transitionRisk) * 0.25 + sr(i*81)*5).toFixed(1),
      fossilPhaseout_yr: Math.round(2028 + sr(i*81+1)*17),
      greenAssetRatio: +(sr(i*81+2)*35 + 5).toFixed(1),
      taxonomyAlign: +(sr(i*81+3)*50 + 10).toFixed(1),
    })).sort((a,b) => b.strandedAsset_pct - a.strandedAsset_pct).slice(0,15);

    const phaseoutTimeline = [2025,2028,2030,2035,2040,2045,2050].map((yr,i) => ({
      year: yr,
      fossilExposure: +(25 - i*3.2 + sr(i*91)*3).toFixed(1),
      greenAllocation: +(8 + i*5.5 + sr(i*91+1)*4).toFixed(1),
    }));

    const transitionPlan = filteredInsurers.slice(0,12).map((x,i) => ({
      name: x.name,
      hasTransitionPlan: sr(i*101)>0.4,
      scope12Disclosed: sr(i*101+1)>0.5,
      scope3Disclosed: sr(i*101+2)>0.3,
      netZeroTarget: sr(i*101+3)>0.45 ? '2050' : sr(i*101+4)>0.3 ? '2040' : 'None',
    }));

    return <>
      <Grid cols={4} gap={10}>
        <KpiCard label="Avg Stranded Asset Exp" value={`${strandedByInsurer.length ? (strandedByInsurer.reduce((a,b)=>a+b.strandedAsset_pct,0)/strandedByInsurer.length).toFixed(1) : 0}%`} color={T.red} />
        <KpiCard label="Avg Green Asset Ratio" value={`${strandedByInsurer.length ? (strandedByInsurer.reduce((a,b)=>a+parseFloat(b.greenAssetRatio),0)/strandedByInsurer.length).toFixed(1) : 0}%`} color={T.green} />
        <KpiCard label="Avg Taxonomy Alignment" value={`${strandedByInsurer.length ? (strandedByInsurer.reduce((a,b)=>a+parseFloat(b.taxonomyAlign),0)/strandedByInsurer.length).toFixed(1) : 0}%`} color={T.indigo} />
        <KpiCard label="With Transition Plan" value={`${transitionPlan.length ? Math.round(transitionPlan.filter(x=>x.hasTransitionPlan).length/transitionPlan.length*100) : 0}%`} color={T.gold} />
      </Grid>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginTop:20 }}>
        <Section title="Stranded Asset Exposure by Insurer (%)">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={strandedByInsurer} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{ fontSize:11 }} unit="%" />
              <YAxis dataKey="name" type="category" width={110} tick={{ fontSize:10 }} />
              <Tooltip />
              <Bar dataKey="strandedAsset_pct" fill={T.red} name="Stranded Asset %" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Section>
        <Section title="Fossil Fuel Phase-out Timeline">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={phaseoutTimeline}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize:11 }} />
              <YAxis tick={{ fontSize:11 }} unit="%" />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="fossilExposure" stroke={T.red} fill={T.red+'22'} name="Fossil Exposure %" />
              <Area type="monotone" dataKey="greenAllocation" stroke={T.green} fill={T.green+'22'} name="Green Allocation %" />
            </AreaChart>
          </ResponsiveContainer>
        </Section>
      </div>

      <Section title="Transition Plan Assessment">
        <Tbl headers={['Insurer','Transition Plan','Scope 1/2','Scope 3','Net Zero Target','Green Ratio','Taxonomy %']}
          rows={transitionPlan.map((x,i) => [
            x.name,
            <Badge text={x.hasTransitionPlan?'Yes':'No'} color={x.hasTransitionPlan?T.green:T.red} />,
            <Badge text={x.scope12Disclosed?'Disclosed':'No'} color={x.scope12Disclosed?T.green:T.amber} />,
            <Badge text={x.scope3Disclosed?'Disclosed':'No'} color={x.scope3Disclosed?T.green:T.amber} />,
            x.netZeroTarget,
            `${strandedByInsurer[i]?.greenAssetRatio || '-'}%`,
            `${strandedByInsurer[i]?.taxonomyAlign || '-'}%`,
          ])} />
      </Section>

      <div style={{ marginTop:12, padding:'14px 18px', background:T.surface, borderRadius:8, border:`1px solid ${T.border}` }}>
        <div style={{ fontSize:14, fontWeight:700, color:T.navy, marginBottom:10 }}>What-If: Carbon Price Impact on Stranded Assets</div>
        <div style={{ display:'flex', gap:16, alignItems:'center', flexWrap:'wrap' }}>
          <div>
            <span style={{ fontSize:12, color:T.sub }}>Carbon Price: </span>
            <input type="range" min={0} max={300} step={5} value={carbonPrice} onChange={e=>setCarbonPrice(+e.target.value)} style={{ verticalAlign:'middle' }} />
            <span style={{ fontSize:14, fontWeight:700, marginLeft:8 }}>${carbonPrice}/tCO2e</span>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <div style={{ padding:'8px 14px', background:T.card, border:`1px solid ${T.border}`, borderRadius:6 }}>
              <div style={{ fontSize:11, color:T.sub }}>Additional Stranded %</div>
              <div style={{ fontSize:16, fontWeight:700, color:T.red }}>+{(carbonPrice*0.025).toFixed(1)}%</div>
            </div>
            <div style={{ padding:'8px 14px', background:T.card, border:`1px solid ${T.border}`, borderRadius:6 }}>
              <div style={{ fontSize:11, color:T.sub }}>Fossil Write-down</div>
              <div style={{ fontSize:16, fontWeight:700, color:T.red }}>${(carbonPrice*0.085).toFixed(1)}B</div>
            </div>
            <div style={{ padding:'8px 14px', background:T.card, border:`1px solid ${T.border}`, borderRadius:6 }}>
              <div style={{ fontSize:11, color:T.sub }}>Green Upside</div>
              <div style={{ fontSize:16, fontWeight:700, color:T.green }}>+${(carbonPrice*0.042).toFixed(1)}B</div>
            </div>
          </div>
        </div>
      </div>

      <Section title="Sector Exposure Heat Map">
        <Tbl headers={['Sector','Exposure %','Transition Risk','Stranded Asset Risk','Phase-out Timeline','Carbon Intensity']}
          rows={[
            ['Oil & Gas', '8.2%', <Badge text="Very High" color={T.red}/>, <Badge text="Critical" color={T.red}/>, '2030-2040', '520 tCO2e/$M'],
            ['Coal Mining', '1.8%', <Badge text="Very High" color={T.red}/>, <Badge text="Critical" color={T.red}/>, '2025-2030', '1,240 tCO2e/$M'],
            ['Utilities (Fossil)', '5.4%', <Badge text="High" color={T.amber}/>, <Badge text="High" color={T.amber}/>, '2035-2045', '380 tCO2e/$M'],
            ['Automotive', '3.1%', <Badge text="Medium" color={T.gold}/>, <Badge text="Medium" color={T.gold}/>, '2035-2040', '180 tCO2e/$M'],
            ['Real Estate', '12.5%', <Badge text="Medium" color={T.gold}/>, <Badge text="Low" color={T.green}/>, '2040-2050', '95 tCO2e/$M'],
            ['Renewables', '4.8%', <Badge text="Low" color={T.green}/>, <Badge text="None" color={T.green}/>, 'N/A', '12 tCO2e/$M'],
            ['Technology', '9.2%', <Badge text="Low" color={T.green}/>, <Badge text="Low" color={T.green}/>, 'N/A', '28 tCO2e/$M'],
            ['Healthcare', '7.1%', <Badge text="Low" color={T.green}/>, <Badge text="None" color={T.green}/>, 'N/A', '45 tCO2e/$M'],
          ]} />
      </Section>
    </>;
  };

  /* ════════════════════════════════════════════════════════════════════════════
     TAB 9: Climate Litigation
     ════════════════════════════════════════════════════════════════════════ */
  const renderLitigation = () => {
    const byType = [...new Set(LITIGATION_CASES.map(c=>c.type))].map(t => ({
      name: t, count: LITIGATION_CASES.filter(c=>c.type===t).length,
      totalExposure: LITIGATION_CASES.filter(c=>c.type===t).reduce((a,b)=>a+b.exposure_mn,0),
    })).sort((a,b) => b.totalExposure - a.totalExposure);

    const byStatus = [...new Set(LITIGATION_CASES.map(c=>c.status))].map(s => ({
      name: s, count: LITIGATION_CASES.filter(c=>c.status===s).length,
    }));

    const doExposure = filteredInsurers.slice(0,10).map((ins,i) => ({
      name: ins.name,
      doLiability_mn: Math.round(50 + sr(i*111)*450),
      greenwashRisk: +(sr(i*111+1)*40 + 10).toFixed(0),
      physicalDamage_mn: Math.round(20 + sr(i*111+2)*300),
    }));

    const reserveStress = SCENARIOS.map(s => ({
      name: s.name,
      reserveIncrease_pct: +(Math.abs(s.claimsImpact_pct) * 0.6 + sr(SCENARIOS.indexOf(s)*121)*5).toFixed(1),
      litigationIncrease_pct: +(Math.abs(s.capitalImpact_pct) * 0.4 + sr(SCENARIOS.indexOf(s)*121+1)*8).toFixed(1),
    }));

    return <>
      <Grid cols={4} gap={10}>
        <KpiCard label="Active Cases" value={LITIGATION_CASES.filter(c=>c.status==='Ongoing'||c.status==='Filed').length} sub={`of ${LITIGATION_CASES.length} total`} color={T.red} />
        <KpiCard label="Total Exposure" value={`$${(LITIGATION_CASES.reduce((a,b)=>a+b.exposure_mn,0)/1000).toFixed(1)}B`} color={T.amber} />
        <KpiCard label="Won by Claimants" value={LITIGATION_CASES.filter(c=>c.status==='Won').length} sub="Cases" color={T.green} />
        <KpiCard label="Greenwashing Cases" value={LITIGATION_CASES.filter(c=>c.type==='Greenwashing').length} sub="Growing category" color={T.indigo} />
      </Grid>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginTop:20 }}>
        <Section title="Litigation Exposure by Type ($M)">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={byType}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize:10, angle:-20 }} height={50} />
              <YAxis tick={{ fontSize:11 }} tickFormatter={v=>`$${(v/1000).toFixed(1)}B`} />
              <Tooltip formatter={v=>`$${Number(v).toLocaleString()}M`} />
              <Bar dataKey="totalExposure" fill={T.red} name="Exposure ($M)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Section>
        <Section title="Case Status Distribution">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={byStatus} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({name,value})=>`${name}: ${value}`}>
                {byStatus.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Section>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginTop:8 }}>
        <Section title="D&O / Physical Liability by Insurer ($M)">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={doExposure}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize:10, angle:-20 }} height={50} />
              <YAxis tick={{ fontSize:11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="doLiability_mn" fill={T.indigo} name="D&O Liability $M" />
              <Bar dataKey="physicalDamage_mn" fill={T.red} name="Physical Damage $M" />
            </BarChart>
          </ResponsiveContainer>
        </Section>
        <Section title="Reserve Adequacy Stress by Scenario">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={reserveStress}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize:11 }} />
              <YAxis tick={{ fontSize:11 }} unit="%" />
              <Tooltip />
              <Legend />
              <Bar dataKey="reserveIncrease_pct" fill={T.amber} name="Reserve Increase %" radius={[4,4,0,0]} />
              <Bar dataKey="litigationIncrease_pct" fill={T.red} name="Litigation Increase %" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Section>
      </div>

      <Section title="Climate Litigation Cases">
        <Tbl maxH={350} headers={['Case','Year','Jurisdiction','Type','Status','Exposure $M','Insurer Relevance']}
          rows={[...LITIGATION_CASES].sort((a,b)=>b.exposure_mn-a.exposure_mn).map(c => [
            c.case_name, c.year, c.jurisdiction, c.type,
            <Badge text={c.status} color={c.status==='Won'?T.green:c.status==='Ongoing'?T.amber:c.status==='Filed'?T.red:T.sub} />,
            `$${c.exposure_mn}M`, c.insurer_relevance,
          ])} />
      </Section>

      <Section title="Litigation Trend (Cases Filed per Year)">
        {(() => {
          const years = [...new Set(LITIGATION_CASES.map(c=>c.year))].sort();
          const trendData = years.map(yr => ({
            year: yr,
            cases: LITIGATION_CASES.filter(c=>c.year===yr).length,
            exposure_mn: LITIGATION_CASES.filter(c=>c.year===yr).reduce((a,b)=>a+b.exposure_mn,0),
          }));
          return (
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize:11 }} />
                <YAxis tick={{ fontSize:11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="cases" fill={T.indigo} name="Cases Filed" radius={[4,4,0,0]} />
                <Line type="monotone" dataKey="exposure_mn" stroke={T.red} strokeWidth={2} name="Exposure ($M)" />
              </ComposedChart>
            </ResponsiveContainer>
          );
        })()}
      </Section>

      <Section title="Greenwashing Liability Assessment">
        <Tbl headers={['Risk Category','Likelihood','Avg Claim Size','Coverage Gap','Key Drivers','Insurer Impact']}
          rows={[
            ['Net Zero Misstatement','High','$200-500M','Significant','SFDR/EU Taxonomy non-compliance','D&O, E&O'],
            ['ESG Fund Mislabeling','High','$50-200M','Moderate','SEC/FCA enforcement actions','PI, D&O'],
            ['Emissions Data Fraud','Medium','$100-800M','Large','Scope 3 verification failures','D&O, GL'],
            ['Climate Plan Failure','Medium','$150-400M','Moderate','SBTi target misses','D&O, Liability'],
            ['Physical Risk Understatement','Rising','$500M-2B','Large','Inadequate TCFD disclosure','D&O, Property'],
            ['Transition Plan Washing','Rising','$100-300M','Significant','IEA Net Zero gap analysis','D&O, PI'],
          ]} />
      </Section>
    </>;
  };

  /* ── Tab renderer map ── */
  const tabRenderers = [
    renderDashboard, renderUnderwriting, renderInvestment, renderSolvency,
    renderCatModelling, renderRegulatory, renderReinsurance, renderPhysicalPricing,
    renderTransition, renderLitigation,
  ];

  /* ════════════════════════════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ padding:24, maxWidth:1400, margin:'0 auto', fontFamily:"'DM Sans',system-ui,sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontSize:22, fontWeight:700, color:T.navy, margin:0 }}>Climate Insurance Intelligence</h1>
        <p style={{ color:T.sub, marginTop:4, fontSize:13 }}>
          IAIS/Solvency II/ORSA Standards | 30 Insurers | 12 Perils | 6 NGFS Scenarios | 20 Cat Events | 20 Litigation Cases
        </p>
      </div>

      {/* Tab Bar */}
      <div style={{ display:'flex', gap:2, marginBottom:16, borderBottom:`2px solid ${T.border}`, overflowX:'auto', whiteSpace:'nowrap' }}>
        {TABS.map((t,i) => (
          <button key={i} onClick={()=>setTab(i)} style={{
            padding:'9px 14px', border:'none', cursor:'pointer', fontSize:12, fontWeight:600,
            background:'none', color: tab===i ? T.indigo : T.sub,
            borderBottom: tab===i ? `2px solid ${T.indigo}` : '2px solid transparent',
            transition:'all 0.15s',
          }}>{t}</button>
        ))}
      </div>

      {/* Controls */}
      <Controls />

      {/* Active Tab */}
      {tabRenderers[tab] && tabRenderers[tab]()}
    </div>
  );
}

export default ClimateInsurancePage;
