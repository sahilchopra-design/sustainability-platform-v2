import React, { useState, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import Apr2026CarbonAnalytics from '../../_shared/Apr2026CarbonAnalytics';

const T = { bg:'#0f1117', surface:'#1a1d27', surfaceH:'#22263a', border:'#2a2f45', borderL:'#1e2235', navy:'#1e3a5f', gold:'#d4a843', sage:'#2d6a4f', teal:'#0d4f5c', text:'#e8e0d0', textSec:'#a89880', textMut:'#6b6050', red:'#c0392b', green:'#27ae60', amber:'#e67e22', font:"'DM Sans',sans-serif", mono:"'JetBrains Mono',monospace" };
const sr = s => { let x = Math.sin(s+1)*10000; return x - Math.floor(x); };

const DEVELOPERS = [
  { name:'NTPC Green H2', parent:'NTPC Ltd', techH2:'ALK+PEM', techNH3:'Haber-Bosch', targetKtpaNH3:2000, targetKtpaH2:400, capex2030BnUsd:4.2, sightH2Elig:true, sightNH3Elig:true, jcmPartner:'Japan', rfnboCompliant:true, co2KgKgH2:0.5, co2KgKgNH3:0.35, irrEquityPct:13.5, dscrAvg:1.42, greenBondIssuedBnUsd:1.1 },
  { name:'Greenko H2', parent:'Greenko Group', techH2:'ALK', techNH3:'Haber-Bosch', targetKtpaNH3:1000, targetKtpaH2:200, capex2030BnUsd:2.8, sightH2Elig:true, sightNH3Elig:true, jcmPartner:'Japan', rfnboCompliant:true, co2KgKgH2:0.6, co2KgKgNH3:0.42, irrEquityPct:14.2, dscrAvg:1.38, greenBondIssuedBnUsd:0.8 },
  { name:'ReNew H2', parent:'ReNew Energy', techH2:'PEM', techNH3:'Haber-Bosch', targetKtpaNH3:500, targetKtpaH2:150, capex2030BnUsd:1.6, sightH2Elig:true, sightNH3Elig:false, jcmPartner:null, rfnboCompliant:true, co2KgKgH2:0.55, co2KgKgNH3:0.38, irrEquityPct:12.8, dscrAvg:1.35, greenBondIssuedBnUsd:0.5 },
  { name:'Torrent H2', parent:'Torrent Power', techH2:'ALK', techNH3:'Direct synthesis', targetKtpaNH3:300, targetKtpaH2:80, capex2030BnUsd:0.9, sightH2Elig:true, sightNH3Elig:false, jcmPartner:null, rfnboCompliant:false, co2KgKgH2:0.8, co2KgKgNH3:0.55, irrEquityPct:12.0, dscrAvg:1.28, greenBondIssuedBnUsd:0.2 },
  { name:'ACME Solar H2', parent:'ACME Solar', techH2:'ALK+SOEC', techNH3:'Haber-Bosch', targetKtpaNH3:2500, targetKtpaH2:500, capex2030BnUsd:5.0, sightH2Elig:true, sightNH3Elig:true, jcmPartner:'Japan/Korea', rfnboCompliant:true, co2KgKgH2:0.45, co2KgKgNH3:0.32, irrEquityPct:15.0, dscrAvg:1.45, greenBondIssuedBnUsd:0.3 },
  { name:'IOCL Green H2', parent:'Indian Oil Corp', techH2:'PEM', techNH3:'Blue NH3 bridge', targetKtpaNH3:800, targetKtpaH2:120, capex2030BnUsd:1.8, sightH2Elig:true, sightNH3Elig:true, jcmPartner:'Japan', rfnboCompliant:false, co2KgKgH2:0.9, co2KgKgNH3:0.65, irrEquityPct:11.5, dscrAvg:1.25, greenBondIssuedBnUsd:0.0 },
];

const COST_CURVE_H2 = [
  { year:2024, india:5.5, australia:4.8, chile:4.5, middleEast:4.2, eu:6.5, grey:1.5, blue:2.8 },
  { year:2025, india:4.8, australia:4.2, chile:3.9, middleEast:3.7, eu:5.8, grey:1.6, blue:2.9 },
  { year:2026, india:4.2, australia:3.8, chile:3.4, middleEast:3.2, eu:5.2, grey:1.7, blue:3.0 },
  { year:2027, india:3.6, australia:3.3, chile:3.0, middleEast:2.8, eu:4.5, grey:1.7, blue:3.0 },
  { year:2028, india:3.1, australia:2.8, chile:2.5, middleEast:2.4, eu:3.8, grey:1.8, blue:3.1 },
  { year:2029, india:2.8, australia:2.5, chile:2.2, middleEast:2.1, eu:3.2, grey:1.8, blue:3.1 },
  { year:2030, india:2.5, australia:2.2, chile:1.9, middleEast:1.8, eu:2.8, grey:1.9, blue:3.2 },
];

const COST_CURVE_NH3 = [
  { year:2024, greenIndia:850, greenAustralia:780, grey:350, blue:480 },
  { year:2025, greenIndia:740, greenAustralia:680, grey:360, blue:490 },
  { year:2026, greenIndia:640, greenAustralia:590, grey:370, blue:500 },
  { year:2027, greenIndia:550, greenAustralia:510, grey:375, blue:500 },
  { year:2028, greenIndia:480, greenAustralia:445, grey:380, blue:505 },
  { year:2029, greenIndia:430, greenAustralia:400, grey:385, blue:510 },
  { year:2030, greenIndia:390, greenAustralia:360, grey:390, blue:510 },
];

const SIGHT_SCHEME = [
  { tranche:'SIGHT H2 — T1', product:'Green H2', incentivePerUnit:'₹50/kg H2', volume:'4.5 Lakh MT', tenure:'3 yr', eligibility:'Grid or captive RE, <2 kgCO₂/kgH2', totalOutlay:'₹17,490 Cr' },
  { tranche:'SIGHT H2 — T2', product:'Green H2', incentivePerUnit:'₹50/kg H2', volume:'5 Lakh MT', tenure:'3 yr', eligibility:'Dedicated RE <1.5 kgCO₂/kgH2', totalOutlay:'₹19,000 Cr' },
  { tranche:'SIGHT NH3 — T1', product:'Green NH3', incentivePerUnit:'₹30/kg NH3', volume:'2 Mn MT', tenure:'5 yr', eligibility:'H2 from SIGHT-eligible plant', totalOutlay:'₹30,000 Cr' },
  { tranche:'SIGHT NH3 — T2', product:'Green NH3', incentivePerUnit:'₹30/kg NH3', volume:'3 Mn MT', tenure:'5 yr', eligibility:'Export-oriented, RFNBO compliant', totalOutlay:'₹45,000 Cr' },
];

const RFNBO_CRITERIA = [
  { criterion:'GHG Intensity Threshold', requirement:'<34 gCO₂eq/MJ H2 (≈2.04 kgCO₂/kgH2)', india:true, note:'India grid H2 fails; dedicated RE plant passes' },
  { criterion:'Additionality', requirement:'New RE capacity (not RE grid surplus)', india:true, note:'Captive RE +PPA from new plant' },
  { criterion:'Temporal Correlation', requirement:'Hourly matching from 2030 (monthly until 2029)', india:'Partial', note:'Indian grid infrastructure challenge' },
  { criterion:'Geographic Correlation', requirement:'Same bidding zone as electrolysis', india:true, note:'Rajasthan/Gujarat solar corridors qualify' },
  { criterion:'Grid Connectivity', requirement:'Islanding or dedicated connection', india:'Partial', note:'ISTS waiver applies to RE H2 plants' },
];

const JCM_CORRIDORS = [
  { corridor:'India–Japan NH3 Ammonia Co-firing', product:'Green NH3', volume2027KtPA:500, creditSplit:'India 30% NDC / Japan 70% GX', pricePerITMO:18, articleSixMode:'6.2 bilateral', status:'Active MOU' },
  { corridor:'India–Japan H2 Fuel Cell', product:'Green H2', volume2027KtPA:50, creditSplit:'India 30% / Japan 70%', pricePerITMO:22, articleSixMode:'6.2 bilateral', status:'Pilot' },
  { corridor:'India–Korea GH2', product:'Green H2', volume2027KtPA:80, creditSplit:'India 35% / Korea 65%', pricePerITMO:20, articleSixMode:'6.4', status:'Negotiating' },
  { corridor:'India–EU H2 via JCM', product:'Green H2 (ship)', volume2027KtPA:200, creditSplit:'India 40% / EU 60%', pricePerITMO:25, articleSixMode:'6.2 + CBAM exempt', status:'Under discussion' },
];

const ELECTROLYZER_SPECS = [
  { type:'ALK (Alkaline)', capexUsdKw:500, efficiency:65, durabilityKhr:90, h2purity:'99.5%', scaleReadyMw:200, costTrend:'–8%/yr' },
  { type:'PEM', capexUsdKw:900, efficiency:70, durabilityKhr:60, h2purity:'99.9%', scaleReadyMw:100, costTrend:'–12%/yr' },
  { type:'SOEC', capexUsdKw:2000, efficiency:80, durabilityKhr:30, h2purity:'99.99%', scaleReadyMw:10, costTrend:'–15%/yr' },
  { type:'AEM', capexUsdKw:600, efficiency:67, durabilityKhr:20, h2purity:'99.5%', scaleReadyMw:5, costTrend:'–18%/yr' },
];

const Kpi = ({ label, value, sub, color }) => (
  <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:'16px 20px', minWidth:160 }}>
    <div style={{ color:T.textMut, fontSize:11, fontFamily:T.mono, textTransform:'uppercase', letterSpacing:1 }}>{label}</div>
    <div style={{ color:color||T.gold, fontSize:24, fontWeight:700, fontFamily:T.mono, margin:'6px 0 2px' }}>{value}</div>
    {sub && <div style={{ color:T.textSec, fontSize:11 }}>{sub}</div>}
  </div>
);

const Tab = ({ label, active, onClick }) => (
  <button onClick={onClick} style={{ padding:'8px 16px', background:active?T.navy:'transparent', color:active?T.gold:T.textSec, border:`1px solid ${active?T.gold:T.border}`, borderRadius:6, cursor:'pointer', fontFamily:T.mono, fontSize:12, whiteSpace:'nowrap' }}>{label}</button>
);

const SectionTitle = ({ children }) => (
  <div style={{ color:T.gold, fontFamily:T.mono, fontSize:13, fontWeight:700, letterSpacing:1, textTransform:'uppercase', borderBottom:`1px solid ${T.border}`, paddingBottom:6, marginBottom:16 }}>{children}</div>
);

const calcH2CarbonCredits = ({ h2ProductionKtpa, co2KgPerKgH2, greyBaseline, creditPrice, jcmSplit }) => {
  const tonnesH2 = h2ProductionKtpa * 1e6;
  const actualCO2 = tonnesH2 * co2KgPerKgH2;
  const greyBaselineCO2 = tonnesH2 * greyBaseline;
  const creditsGross = (greyBaselineCO2 - actualCO2) / 1e6;
  const creditsIndia = creditsGross * (jcmSplit/100);
  const creditsJapan = creditsGross * (1 - jcmSplit/100);
  const revenue = creditsGross * creditPrice * 1e6;
  return { creditsGross: creditsGross.toFixed(2), creditsIndia: creditsIndia.toFixed(2), creditsJapan: creditsJapan.toFixed(2), revenue: (revenue/1e6).toFixed(1) };
};

const calcSightIncentive = ({ productionKtpa, ratePerKg, product }) => {
  const totalIncentiveCr = productionKtpa * 1e6 * ratePerKg / 1e7;
  return totalIncentiveCr;
};

export default function GreenHydrogenAmmoniaCarbonPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [selDev, setSelDev] = useState(0);
  const [h2ProductionKtpa, setH2ProductionKtpa] = useState(100);
  const [co2PerKg, setCo2PerKg] = useState(0.5);
  const [itmoPrice, setItmoPrice] = useState(20);
  const [jcmSplit, setJcmSplit] = useState(30);
  const [nh3ProductionKtpa, setNh3ProductionKtpa] = useState(500);
  const [sightRate, setSightRate] = useState(50);

  const dev = DEVELOPERS[selDev];
  const creditCalc = useMemo(() => calcH2CarbonCredits({ h2ProductionKtpa, co2KgPerKgH2:co2PerKg, greyBaseline:10.8, creditPrice:itmoPrice, jcmSplit }), [h2ProductionKtpa, co2PerKg, itmoPrice, jcmSplit]);
  const sightH2 = useMemo(() => calcSightIncentive({ productionKtpa:h2ProductionKtpa, ratePerKg:sightRate, product:'H2' }), [h2ProductionKtpa, sightRate]);
  const sightNH3 = useMemo(() => calcSightIncentive({ productionKtpa:nh3ProductionKtpa, ratePerKg:30, product:'NH3' }), [nh3ProductionKtpa]);

  const tabs = ['Overview','Developer Dashboard','GH2 Cost Curve','GA Cost Curve','SIGHT Incentive Calc','RFNBO Compliance','Electrolyzer Finance','JCM / Article 6','Carbon Credit Engine','IRR & Project Finance'];

  return (
    <div style={{ background:T.bg, minHeight:'100vh', color:T.text, fontFamily:T.font, padding:24 }}>
      <div style={{ borderBottom:`2px solid ${T.gold}`, paddingBottom:16, marginBottom:24 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <div style={{ color:T.textMut, fontSize:11, fontFamily:T.mono, letterSpacing:2, textTransform:'uppercase' }}>EP-EA4 · India Green H2/NH3 Carbon Finance</div>
            <h1 style={{ margin:'4px 0 8px', fontSize:28, fontWeight:700, color:T.text }}>Green Hydrogen & Ammonia Carbon Finance</h1>
            <div style={{ color:T.textSec, fontSize:13 }}>SIGHT incentives · RFNBO compliance · JCM Article 6.2 ITMO · GX-ETS integration · Project finance</div>
          </div>
          <div style={{ textAlign:'right', fontFamily:T.mono, fontSize:11, color:T.textMut }}>
            <div>India SIGHT Outlay</div>
            <div style={{ color:T.gold, fontSize:20, fontWeight:700 }}>₹1,11,490 Cr</div>
            <div>India GH2 Target 2030</div>
            <div style={{ color:T.green, fontSize:16, fontWeight:700 }}>5 MMT/yr</div>
          </div>
        </div>
      </div>

      <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:24 }}>
        <Kpi label="Green H2 Cost 2024 (India)" value="$5.5/kg" sub="2030 target: $2.5/kg via SIGHT" color={T.amber} />
        <Kpi label="Green NH3 Cost 2024 (India)" value="$850/t" sub="Parity with grey NH3 by 2030" color={T.amber} />
        <Kpi label="RFNBO Threshold" value="34 gCO₂/MJ" sub="≈2.04 kgCO₂/kgH2 for EU compliance" color={T.teal} />
        <Kpi label="JCM ITMO Price (NH3)" value="$18–25/t" sub="India 30% NDC / Japan 70% GX-ETS" color={T.green} />
        <Kpi label="SIGHT H2 Incentive" value="₹50/kg" sub="4.5–5 lakh MT volume cap" color={T.gold} />
        <Kpi label="GX Bond (Japan)" value="¥20 Tn" sub="Includes NH3 co-firing as GX fuel" color={T.navy } />
      </div>

      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:20 }}>
        {tabs.map((t,i) => <Tab key={i} label={t} active={activeTab===i} onClick={()=>setActiveTab(i)} />)}
      </div>

      {/* Tab 0: Overview */}
      {activeTab===0 && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
            <SectionTitle>India Green H2/NH3 Finance Landscape</SectionTitle>
            <div style={{ color:T.textSec, fontSize:13, lineHeight:1.8 }}>
              India's National Green Hydrogen Mission (NGHM) targets <span style={{ color:T.gold }}>5 MMT/yr of green hydrogen</span> by 2030, underpinned by ₹19,744 Cr SIGHT incentive outlay and an additional ₹75,000 Cr for green ammonia. Six major developers — NTPC, Greenko, ReNew, Torrent, ACME Solar, and IOCL — have announced combined capacity of ~7 MMT/yr by 2030, requiring $16+ Bn in capital deployment.
              <br/><br/>
              <span style={{ color:T.amber }}>Three-Way Carbon Finance Convergence:</span> Indian GH2/GA projects intersect with (1) Japan's GX-ETS ammonia co-firing program via JCM Article 6.2 bilaterals, generating ITMOs at $18–22/tCO₂; (2) EU RFNBO certification unlocking €premium pricing in the EU H2 market; and (3) India CCTS offset credits for Scope 1 displacement of grey hydrogen at refineries and fertiliser plants.
              <br/><br/>
              <span style={{ color:T.teal }}>SIGHT-Carbon Nexus:</span> SIGHT Tranche I offers ₹50/kg for 4.5 lakh MT H2 over 3 years. At $5.5/kg current cost vs $1.5/kg grey, SIGHT bridges ~$1.5/kg of the gap. The remaining $2.5/kg is targeted through scale economics, electrolyzer cost decline (ALK –8%/yr, PEM –12%/yr), and carbon credit monetization via JCM/CCTS.
            </div>
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
            <SectionTitle>Green H2 Cost Curve: India vs Global ($/kg)</SectionTitle>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={COST_CURVE_H2}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fill:T.textSec, fontSize:11 }} />
                <YAxis tick={{ fill:T.textSec, fontSize:11 }} label={{ value:'$/kg H2', angle:-90, position:'insideLeft', fill:T.textMut, fontSize:10 }} />
                <Tooltip contentStyle={{ background:T.surfaceH, border:`1px solid ${T.border}`, color:T.text }} />
                <Legend />
                <Line type="monotone" dataKey="india" stroke={T.amber} strokeWidth={2} name="India" dot={{ r:3 }} />
                <Line type="monotone" dataKey="australia" stroke={T.teal} strokeWidth={2} name="Australia" dot={{ r:3 }} />
                <Line type="monotone" dataKey="middleEast" stroke={T.green} strokeWidth={2} name="Middle East" dot={{ r:3 }} />
                <Line type="monotone" dataKey="grey" stroke={T.textMut} strokeWidth={2} name="Grey H2" dot={{ r:3 }} strokeDasharray="4 2" />
                <ReferenceLine y={2.0} stroke={T.gold} strokeDasharray="4 2" label={{ value:'Competitiveness Target', fill:T.gold, fontSize:10 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20, gridColumn:'1/-1' }}>
            <SectionTitle>Carbon Finance Mechanisms — Green H2 & NH3</SectionTitle>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10 }}>
              {[
                { label:'SIGHT Incentive', color:T.gold, val:'₹50/kg H2 · ₹30/kg NH3', detail:'3–5yr tenure · BEE administered · mandatory audit' },
                { label:'JCM ITMO (Article 6.2)', color:T.teal, val:'$18–25/tCO₂', detail:'India-Japan bilateral · NH3 co-firing · 30% to India NDC' },
                { label:'RFNBO Premium (EU)', color:T.green, val:'+€3–5/kg H2', detail:'<34 gCO₂eq/MJ · dedicated RE · 2029 hourly match' },
                { label:'CCTS Offset (Grey → Green)', color:T.amber, val:'₹500–1,200/tCO₂', detail:'Refinery/fert grey H2 displacement · CCert issuance' },
                { label:'GX-ETS NH3 Co-firing', color:T.navy, val:'¥2,000–3,000/tCO₂', detail:'Japan power sector · GX League mandate · 2027+ scale' },
              ].map((m,i) => (
                <div key={i} style={{ background:T.surfaceH, border:`1px solid ${m.color}22`, borderRadius:6, padding:12 }}>
                  <div style={{ color:m.color, fontWeight:700, fontFamily:T.mono, fontSize:12, marginBottom:6 }}>{m.label}</div>
                  <div style={{ color:T.text, fontSize:14, fontWeight:700, fontFamily:T.mono, marginBottom:4 }}>{m.val}</div>
                  <div style={{ color:T.textSec, fontSize:11, lineHeight:1.5 }}>{m.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 1: Developer Dashboard */}
      {activeTab===1 && (
        <div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 }}>
            {DEVELOPERS.map((d,i) => <button key={i} onClick={()=>setSelDev(i)} style={{ padding:'6px 14px', background:selDev===i?T.navy:'transparent', color:selDev===i?T.gold:T.textSec, border:`1px solid ${selDev===i?T.gold:T.border}`, borderRadius:6, cursor:'pointer', fontFamily:T.mono, fontSize:12 }}>{d.name}</button>)}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:16 }}>
            <Kpi label="NH3 Target" value={`${dev.targetKtpaNH3.toLocaleString()} ktpa`} sub={`H2: ${dev.targetKtpaH2} ktpa`} color={T.gold} />
            <Kpi label="Capex 2030" value={`$${dev.capex2030BnUsd}Bn`} sub={`IRR Equity: ${dev.irrEquityPct}%`} color={T.amber} />
            <Kpi label="CO₂ Intensity (H2)" value={`${dev.co2KgKgH2} kg/kg`} sub={`NH3: ${dev.co2KgKgNH3} kg/kg`} color={dev.rfnboCompliant?T.green:T.red} />
            <Kpi label="RFNBO Compliant" value={dev.rfnboCompliant?'Yes':'No'} sub={dev.jcmPartner?`JCM: ${dev.jcmPartner}`:'No JCM partner'} color={dev.rfnboCompliant?T.green:T.red} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
              <SectionTitle>Developer NH3 Capacity Targets (ktpa, 2030)</SectionTitle>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={DEVELOPERS}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fill:T.textSec, fontSize:9 }} />
                  <YAxis tick={{ fill:T.textSec, fontSize:11 }} />
                  <Tooltip contentStyle={{ background:T.surfaceH, border:`1px solid ${T.border}`, color:T.text }} />
                  <Bar dataKey="targetKtpaNH3" fill={T.teal} name="NH3 Target ktpa" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
              <SectionTitle>CO₂ Intensity Comparison (kgCO₂/kg product)</SectionTitle>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={DEVELOPERS}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fill:T.textSec, fontSize:9 }} />
                  <YAxis tick={{ fill:T.textSec, fontSize:11 }} />
                  <Tooltip contentStyle={{ background:T.surfaceH, border:`1px solid ${T.border}`, color:T.text }} />
                  <Bar dataKey="co2KgKgH2" fill={T.amber} name="H2 CO₂ kg/kg" />
                  <Bar dataKey="co2KgKgNH3" fill={T.teal} name="NH3 CO₂ kg/kg" />
                  <Legend />
                  <ReferenceLine y={2.04} stroke={T.red} strokeDasharray="3 2" label={{ value:'RFNBO limit', fill:T.red, fontSize:10 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: GH2 Cost Curve */}
      {activeTab===2 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
          <SectionTitle>Green Hydrogen Cost Curve 2024–2030 ($/kg)</SectionTitle>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={COST_CURVE_H2}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fill:T.textSec, fontSize:11 }} />
              <YAxis tick={{ fill:T.textSec, fontSize:11 }} />
              <Tooltip contentStyle={{ background:T.surfaceH, border:`1px solid ${T.border}`, color:T.text }} />
              <Legend />
              <Area type="monotone" dataKey="india" stroke={T.amber} fill={`${T.amber}22`} name="India" />
              <Area type="monotone" dataKey="australia" stroke={T.teal} fill={`${T.teal}11`} name="Australia" />
              <Area type="monotone" dataKey="middleEast" stroke={T.green} fill={`${T.green}11`} name="Middle East" />
              <Line type="monotone" dataKey="grey" stroke={T.textMut} strokeWidth={2} name="Grey H2" strokeDasharray="5 3" />
              <Line type="monotone" dataKey="blue" stroke={T.textSec} strokeWidth={2} name="Blue H2" strokeDasharray="3 2" />
              <ReferenceLine y={2.0} stroke={T.gold} strokeDasharray="4 2" />
            </AreaChart>
          </ResponsiveContainer>
          <div style={{ marginTop:16, display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
            {[
              { label:'SIGHT-Adjusted India Cost', val:'$4.0/kg 2024 → $1.0/kg 2030E', color:T.amber },
              { label:'Electrolyzer Cost Decline', val:'ALK –8%/yr · PEM –12%/yr · SOEC –15%/yr', color:T.teal },
              { label:'RE Cost Contribution', val:'60–65% of GH2 LCOE; India solar at $0.02/kWh 2030', color:T.green },
            ].map((m,i) => <div key={i} style={{ background:T.surfaceH, borderRadius:6, padding:12, borderLeft:`3px solid ${m.color}` }}><div style={{ color:m.color, fontFamily:T.mono, fontSize:11, marginBottom:4 }}>{m.label}</div><div style={{ color:T.text, fontSize:12 }}>{m.val}</div></div>)}
          </div>
        </div>
      )}

      {/* Tab 3: GA Cost Curve */}
      {activeTab===3 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
          <SectionTitle>Green Ammonia Cost Curve 2024–2030 ($/tonne NH3)</SectionTitle>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={COST_CURVE_NH3}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fill:T.textSec, fontSize:11 }} />
              <YAxis tick={{ fill:T.textSec, fontSize:11 }} label={{ value:'$/t NH3', angle:-90, position:'insideLeft', fill:T.textMut, fontSize:10 }} />
              <Tooltip contentStyle={{ background:T.surfaceH, border:`1px solid ${T.border}`, color:T.text }} />
              <Legend />
              <Area type="monotone" dataKey="greenIndia" stroke={T.amber} fill={`${T.amber}22`} name="Green NH3 India" />
              <Area type="monotone" dataKey="greenAustralia" stroke={T.teal} fill={`${T.teal}11`} name="Green NH3 Australia" />
              <Line type="monotone" dataKey="grey" stroke={T.textMut} strokeWidth={2} name="Grey NH3" strokeDasharray="5 3" />
              <Line type="monotone" dataKey="blue" stroke={T.textSec} strokeWidth={2} name="Blue NH3" strokeDasharray="3 2" />
              <ReferenceLine y={400} stroke={T.gold} strokeDasharray="4 2" label={{ value:'Grey-Green Parity', fill:T.gold, fontSize:10 }} />
            </AreaChart>
          </ResponsiveContainer>
          <div style={{ marginTop:16, background:T.surfaceH, borderRadius:6, padding:14 }}>
            <div style={{ color:T.gold, fontFamily:T.mono, fontSize:12, fontWeight:700, marginBottom:8 }}>NH3 Carbon Finance Stack</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
              {[
                { item:'SIGHT NH3', val:'₹30/kg ≈ $36/t', color:T.gold },
                { item:'JCM ITMO', val:'$18–25/tCO₂ × ~2.4t = $43–60/t NH3', color:T.teal },
                { item:'GX-ETS co-firing credit', val:'¥2,000–3,000/tCO₂ ≈ $14–21/tCO₂', color:T.amber },
                { item:'RFNBO premium (EU)', val:'+$80–120/t NH3 vs grey', color:T.green },
              ].map((m,i) => <div key={i} style={{ background:T.surface, borderRadius:4, padding:10 }}><div style={{ color:m.color, fontFamily:T.mono, fontSize:11, marginBottom:4 }}>{m.item}</div><div style={{ color:T.text, fontSize:12, fontWeight:600 }}>{m.val}</div></div>)}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: SIGHT Calculator */}
      {activeTab===4 && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
            <SectionTitle>SIGHT Incentive Calculator</SectionTitle>
            <div style={{ display:'grid', gap:12, marginBottom:16 }}>
              <div>
                <label style={{ color:T.textSec, fontSize:12, display:'block', marginBottom:4 }}>H2 Production (ktpa): {h2ProductionKtpa} ktpa</label>
                <input type="range" min={10} max={500} step={10} value={h2ProductionKtpa} onChange={e=>setH2ProductionKtpa(+e.target.value)} style={{ width:'100%' }} />
              </div>
              <div>
                <label style={{ color:T.textSec, fontSize:12, display:'block', marginBottom:4 }}>NH3 Production (ktpa): {nh3ProductionKtpa} ktpa</label>
                <input type="range" min={50} max={3000} step={50} value={nh3ProductionKtpa} onChange={e=>setNh3ProductionKtpa(+e.target.value)} style={{ width:'100%' }} />
              </div>
              <div>
                <label style={{ color:T.textSec, fontSize:12, display:'block', marginBottom:4 }}>SIGHT H2 Rate (₹/kg): ₹{sightRate}/kg</label>
                <input type="range" min={30} max={70} step={5} value={sightRate} onChange={e=>setSightRate(+e.target.value)} style={{ width:'100%' }} />
              </div>
            </div>
            <div style={{ background:T.surfaceH, borderRadius:6, padding:14 }}>
              <div style={{ display:'grid', gap:10 }}>
                <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ color:T.textSec, fontSize:12 }}>Annual SIGHT H2 Incentive</span><span style={{ color:T.green, fontFamily:T.mono, fontSize:16, fontWeight:700 }}>₹{sightH2.toFixed(0)} Cr</span></div>
                <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ color:T.textSec, fontSize:12 }}>Annual SIGHT NH3 Incentive</span><span style={{ color:T.teal, fontFamily:T.mono, fontSize:16, fontWeight:700 }}>₹{sightNH3.toFixed(0)} Cr</span></div>
                <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ color:T.textSec, fontSize:12 }}>Combined (5yr tenure)</span><span style={{ color:T.gold, fontFamily:T.mono, fontSize:16, fontWeight:700 }}>₹{((sightH2*3 + sightNH3*5)).toFixed(0)} Cr</span></div>
              </div>
            </div>
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
            <SectionTitle>SIGHT Scheme Structure</SectionTitle>
            {SIGHT_SCHEME.map((s,i) => (
              <div key={i} style={{ padding:12, background:T.surfaceH, borderRadius:6, marginBottom:8 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ color:T.gold, fontFamily:T.mono, fontSize:12, fontWeight:700 }}>{s.tranche}</span>
                  <span style={{ color:T.green, fontFamily:T.mono, fontSize:12 }}>{s.incentivePerUnit}</span>
                </div>
                <div style={{ color:T.textSec, fontSize:11 }}>Volume: {s.volume} · Tenure: {s.tenure} · Outlay: {s.totalOutlay}</div>
                <div style={{ color:T.textMut, fontSize:11, marginTop:2 }}>{s.eligibility}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: RFNBO Compliance */}
      {activeTab===5 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
          <SectionTitle>EU RFNBO (Renewable Fuels of Non-Biological Origin) Criteria</SectionTitle>
          <table style={{ width:'100%', borderCollapse:'collapse', marginBottom:20 }}>
            <thead>
              <tr style={{ background:T.surfaceH }}>
                {['Criterion','EU Requirement','India Feasibility','Implementation Note'].map(h => <th key={h} style={{ padding:'8px 12px', color:T.textSec, fontSize:11, fontFamily:T.mono, textAlign:'left', borderBottom:`1px solid ${T.border}` }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {RFNBO_CRITERIA.map((r,i) => (
                <tr key={i} style={{ background:i%2===0?T.surface:T.surfaceH }}>
                  <td style={{ padding:'8px 12px', color:T.text, fontSize:12, fontWeight:600, borderBottom:`1px solid ${T.borderL}` }}>{r.criterion}</td>
                  <td style={{ padding:'8px 12px', color:T.textSec, fontSize:12, borderBottom:`1px solid ${T.borderL}` }}>{r.requirement}</td>
                  <td style={{ padding:'8px 12px', color:r.india===true?T.green:r.india==='Partial'?T.amber:T.red, fontSize:12, fontWeight:600, borderBottom:`1px solid ${T.borderL}` }}>{r.india===true?'Feasible':r.india==='Partial'?'Partial':'Challenge'}</td>
                  <td style={{ padding:'8px 12px', color:T.textSec, fontSize:12, borderBottom:`1px solid ${T.borderL}` }}>{r.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <div style={{ background:T.surfaceH, borderRadius:6, padding:14 }}>
              <div style={{ color:T.gold, fontFamily:T.mono, fontSize:12, fontWeight:700, marginBottom:8 }}>RFNBO-Compliant Pathways (India)</div>
              {[
                { path:'Rajasthan solar captive → ALK electrolyzer → NH3 plant', status:'Optimal', ci:'0.45 kgCO₂/kgH2' },
                { path:'Gujarat wind+solar hybrid → PEM → ship H2', status:'Compliant', ci:'0.52 kgCO₂/kgH2' },
                { path:'ISTS grid + REC → PEM → H2', status:'Non-compliant (additionality)', ci:'0.80+ kgCO₂/kgH2' },
                { path:'Dedicated offshore wind → SOEC → H2', status:'Future (2027+)', ci:'0.30 kgCO₂/kgH2' },
              ].map((p,i) => (
                <div key={i} style={{ padding:'8px 10px', background:T.surface, borderRadius:4, marginBottom:6 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
                    <span style={{ color:T.text, fontSize:11 }}>{p.path}</span>
                    <span style={{ color:p.status==='Optimal'?T.green:p.status==='Compliant'?T.teal:p.status.includes('Non')?T.red:T.amber, fontSize:11, fontFamily:T.mono }}>{p.status}</span>
                  </div>
                  <div style={{ color:T.textMut, fontSize:10 }}>CI: {p.ci}</div>
                </div>
              ))}
            </div>
            <div style={{ background:T.surfaceH, borderRadius:6, padding:14 }}>
              <div style={{ color:T.gold, fontFamily:T.mono, fontSize:12, fontWeight:700, marginBottom:8 }}>EU H2 Import Premium for RFNBO</div>
              <div style={{ color:T.textSec, fontSize:12, lineHeight:1.8 }}>
                RFNBO-certified H2 from India can command:<br/>
                • <span style={{ color:T.green }}>+€2–3/kg</span> vs grey H2 in EU industrial market<br/>
                • <span style={{ color:T.teal }}>+€3–5/kg</span> for transport-sector H2 (EU ETS exemption)<br/>
                • <span style={{ color:T.gold }}>+€1–2/kg</span> for ammonia vs fossil NH3 (RFNBO premium)<br/><br/>
                EU imported H2 taxonomy (delegated regulation 2023/1184) requires third-country suppliers to demonstrate compliance via accredited certification body. India's BEE and Bureau of Indian Standards (BIS) are in MOU discussions with EU certification bodies for mutual recognition by 2026.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Electrolyzer Finance */}
      {activeTab===6 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
          <SectionTitle>Electrolyzer Technology & Finance Comparison</SectionTitle>
          <table style={{ width:'100%', borderCollapse:'collapse', marginBottom:20 }}>
            <thead>
              <tr style={{ background:T.surfaceH }}>
                {['Type','Capex ($/kW)','Efficiency','Durability','H2 Purity','Scale Ready','Cost Trend'].map(h => <th key={h} style={{ padding:'8px 12px', color:T.textSec, fontSize:11, fontFamily:T.mono, textAlign:'left', borderBottom:`1px solid ${T.border}` }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {ELECTROLYZER_SPECS.map((e,i) => (
                <tr key={i} style={{ background:i%2===0?T.surface:T.surfaceH }}>
                  <td style={{ padding:'8px 12px', color:T.gold, fontFamily:T.mono, fontSize:12, borderBottom:`1px solid ${T.borderL}` }}>{e.type}</td>
                  <td style={{ padding:'8px 12px', color:T.text, fontSize:12, borderBottom:`1px solid ${T.borderL}` }}>${e.capexUsdKw}</td>
                  <td style={{ padding:'8px 12px', color:T.green, fontSize:12, borderBottom:`1px solid ${T.borderL}` }}>{e.efficiency}%</td>
                  <td style={{ padding:'8px 12px', color:T.textSec, fontSize:12, borderBottom:`1px solid ${T.borderL}` }}>{e.durabilityKhr}k hr</td>
                  <td style={{ padding:'8px 12px', color:T.textSec, fontSize:12, borderBottom:`1px solid ${T.borderL}` }}>{e.h2purity}</td>
                  <td style={{ padding:'8px 12px', color:T.teal, fontFamily:T.mono, fontSize:12, borderBottom:`1px solid ${T.borderL}` }}>{e.scaleReadyMw} MW</td>
                  <td style={{ padding:'8px 12px', color:T.green, fontFamily:T.mono, fontSize:12, borderBottom:`1px solid ${T.borderL}` }}>{e.costTrend}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
            <div style={{ background:T.surfaceH, borderRadius:6, padding:12 }}>
              <div style={{ color:T.teal, fontFamily:T.mono, fontSize:12, fontWeight:700, marginBottom:6 }}>Project Finance Structure</div>
              {[['Senior Debt (DFIs/banks)','55%',T.navy],['Green Bond','15%',T.green],['SIGHT Incentive Security','10%',T.gold],['Mezzanine','5%',T.amber],['Sponsor Equity','15%',T.teal]].map(([l,v,c],i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderBottom:`1px solid ${T.border}` }}>
                  <span style={{ color:T.textSec, fontSize:11 }}>{l}</span>
                  <span style={{ color:c, fontFamily:T.mono, fontSize:11 }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ background:T.surfaceH, borderRadius:6, padding:12 }}>
              <div style={{ color:T.amber, fontFamily:T.mono, fontSize:12, fontWeight:700, marginBottom:6 }}>India DFI Landscape for GH2</div>
              {[['NaBFID','Project bonds + direct lending'],['IREDA','Concessional debt ₹ 9%'],['IFC/ADB','USD-denominated, 15–20yr'],['SBI/HDFC Bank','Syndicated term loans'],['JBIC','JCM-linked yen lending']].map(([l,v],i) => (
                <div key={i} style={{ padding:'5px 0', borderBottom:`1px solid ${T.border}` }}>
                  <div style={{ color:T.gold, fontFamily:T.mono, fontSize:11 }}>{l}</div>
                  <div style={{ color:T.textSec, fontSize:10 }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ background:T.surfaceH, borderRadius:6, padding:12 }}>
              <div style={{ color:T.green, fontFamily:T.mono, fontSize:12, fontWeight:700, marginBottom:6 }}>Green Bond Eligibility</div>
              <div style={{ color:T.textSec, fontSize:12, lineHeight:1.7 }}>
                SEBI Green Bond framework (2023) explicitly includes green hydrogen as eligible use-of-proceeds. ICMA Green Bond Principles 2021: GH2/GA qualifies under Clean Transportation and Renewable Energy categories. NaBFID bonds qualify for RBI regulatory treatment as priority sector.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 7: JCM / Article 6 */}
      {activeTab===7 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
          <SectionTitle>JCM Corridors & Article 6 ITMO Flows</SectionTitle>
          <table style={{ width:'100%', borderCollapse:'collapse', marginBottom:20 }}>
            <thead>
              <tr style={{ background:T.surfaceH }}>
                {['Corridor','Product','Volume 2027','Credit Split','ITMO Price','Art. 6 Mode','Status'].map(h => <th key={h} style={{ padding:'8px 12px', color:T.textSec, fontSize:11, fontFamily:T.mono, textAlign:'left', borderBottom:`1px solid ${T.border}` }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {JCM_CORRIDORS.map((j,i) => (
                <tr key={i} style={{ background:i%2===0?T.surface:T.surfaceH }}>
                  <td style={{ padding:'8px 12px', color:T.gold, fontSize:12, borderBottom:`1px solid ${T.borderL}` }}>{j.corridor}</td>
                  <td style={{ padding:'8px 12px', color:T.text, fontSize:12, borderBottom:`1px solid ${T.borderL}` }}>{j.product}</td>
                  <td style={{ padding:'8px 12px', color:T.textSec, fontFamily:T.mono, fontSize:12, borderBottom:`1px solid ${T.borderL}` }}>{j.volume2027KtPA} ktpa</td>
                  <td style={{ padding:'8px 12px', color:T.textSec, fontSize:11, borderBottom:`1px solid ${T.borderL}` }}>{j.creditSplit}</td>
                  <td style={{ padding:'8px 12px', color:T.green, fontFamily:T.mono, fontSize:12, borderBottom:`1px solid ${T.borderL}` }}>${j.pricePerITMO}/t</td>
                  <td style={{ padding:'8px 12px', color:T.teal, fontSize:11, borderBottom:`1px solid ${T.borderL}` }}>{j.articleSixMode}</td>
                  <td style={{ padding:'8px 12px', color:j.status==='Active MOU'?T.green:j.status==='Pilot'?T.amber:T.textSec, fontSize:11, borderBottom:`1px solid ${T.borderL}` }}>{j.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ background:T.surfaceH, borderRadius:6, padding:14 }}>
            <div style={{ color:T.gold, fontFamily:T.mono, fontSize:12, fontWeight:700, marginBottom:8 }}>NH3 Co-firing JCM Value Chain (India → Japan)</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10 }}>
              {[
                { step:'India RE Plant', detail:'Solar/Wind captive → Green NH3 production (RFNBO-compliant)' },
                { step:'NH3 Shipment', detail:'Ammonia tanker to Japan (Fushiki, Niihama ports)' },
                { step:'Japan Power Plant', detail:'20% co-firing with coal → emissions displaced' },
                { step:'ITMO Issuance', detail:'30% to India NDC registry · 70% to Japan GX-ETS credits' },
                { step:'Carbon Revenue', detail:'$18–25/tCO₂ × ~1.7t/t NH3 = $30–43/t NH3 bonus' },
              ].map((s,i) => (
                <div key={i} style={{ background:T.surface, borderRadius:4, padding:10, borderTop:`2px solid ${T.teal}` }}>
                  <div style={{ color:T.teal, fontFamily:T.mono, fontSize:11, fontWeight:700, marginBottom:4 }}>{i+1}. {s.step}</div>
                  <div style={{ color:T.textSec, fontSize:11, lineHeight:1.5 }}>{s.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 8: Carbon Credit Engine */}
      {activeTab===8 && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
            <SectionTitle>Carbon Credit Revenue Engine</SectionTitle>
            <div style={{ display:'grid', gap:12, marginBottom:16 }}>
              <div>
                <label style={{ color:T.textSec, fontSize:12, display:'block', marginBottom:4 }}>H2 Production (ktpa): {h2ProductionKtpa} ktpa</label>
                <input type="range" min={10} max={500} step={10} value={h2ProductionKtpa} onChange={e=>setH2ProductionKtpa(+e.target.value)} style={{ width:'100%' }} />
              </div>
              <div>
                <label style={{ color:T.textSec, fontSize:12, display:'block', marginBottom:4 }}>Actual CO₂ Intensity: {co2PerKg} kgCO₂/kgH2</label>
                <input type="range" min={0.3} max={2.5} step={0.05} value={co2PerKg} onChange={e=>setCo2PerKg(+e.target.value)} style={{ width:'100%' }} />
              </div>
              <div>
                <label style={{ color:T.textSec, fontSize:12, display:'block', marginBottom:4 }}>ITMO/Credit Price: ${itmoPrice}/tCO₂</label>
                <input type="range" min={5} max={50} step={1} value={itmoPrice} onChange={e=>setItmoPrice(+e.target.value)} style={{ width:'100%' }} />
              </div>
              <div>
                <label style={{ color:T.textSec, fontSize:12, display:'block', marginBottom:4 }}>India JCM Share: {jcmSplit}%</label>
                <input type="range" min={20} max={50} step={5} value={jcmSplit} onChange={e=>setJcmSplit(+e.target.value)} style={{ width:'100%' }} />
              </div>
            </div>
            <div style={{ background:T.surfaceH, borderRadius:6, padding:14 }}>
              <div style={{ color:T.textMut, fontSize:11, fontFamily:T.mono, marginBottom:8 }}>CARBON CREDIT CALCULATION (Grey H2 baseline: 10.8 kgCO₂/kgH2)</div>
              <div style={{ display:'grid', gap:8 }}>
                <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ color:T.textSec, fontSize:12 }}>Gross Credits (MtCO₂/yr)</span><span style={{ color:T.gold, fontFamily:T.mono }}>{creditCalc.creditsGross} MtCO₂</span></div>
                <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ color:T.textSec, fontSize:12 }}>India NDC Share ({jcmSplit}%)</span><span style={{ color:T.teal, fontFamily:T.mono }}>{creditCalc.creditsIndia} MtCO₂</span></div>
                <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ color:T.textSec, fontSize:12 }}>Japan GX-ETS Share ({100-jcmSplit}%)</span><span style={{ color:T.amber, fontFamily:T.mono }}>{creditCalc.creditsJapan} MtCO₂</span></div>
                <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ color:T.textSec, fontSize:12 }}>Annual Carbon Revenue</span><span style={{ color:T.green, fontFamily:T.mono, fontSize:18, fontWeight:700 }}>${creditCalc.revenue}M</span></div>
              </div>
              {co2PerKg > 2.04 && <div style={{ marginTop:10, padding:8, background:`${T.red}11`, border:`1px solid ${T.red}33`, borderRadius:4, color:T.red, fontSize:11 }}>⚠ CO₂ intensity exceeds RFNBO threshold (2.04 kg/kg). No EU premium applicable.</div>}
            </div>
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
            <SectionTitle>Full Carbon Finance Stack (per tonne H2)</SectionTitle>
            {[
              { source:'SIGHT Incentive (₹50/kg)', usd:0.60, color:T.gold },
              { source:'JCM ITMO ($20/t × 10.3t avoided)', usd:206, color:T.teal },
              { source:'RFNBO EU Premium (+€3/kg H2)', usd:3.28, color:T.green },
              { source:'CCTS Offset (India domestic)', usd:0.12, color:T.amber },
              { source:'GX-ETS NH3 co-firing credit', usd:0.08, color:T.navy },
            ].map((s,i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'10px 14px', background:i%2===0?T.surfaceH:T.surface, borderRadius:6, marginBottom:6 }}>
                <span style={{ color:T.textSec, fontSize:12 }}>{s.source}</span>
                <span style={{ color:s.color, fontFamily:T.mono, fontSize:13, fontWeight:700 }}>${s.usd}/tH2</span>
              </div>
            ))}
            <div style={{ marginTop:12, padding:12, background:`${T.green}11`, border:`1px solid ${T.green}33`, borderRadius:6 }}>
              <div style={{ color:T.green, fontFamily:T.mono, fontSize:12, fontWeight:700 }}>Total Carbon Finance Stack</div>
              <div style={{ color:T.text, fontSize:20, fontWeight:700, fontFamily:T.mono, marginTop:4 }}>~$210/tH2</div>
              <div style={{ color:T.textSec, fontSize:11, marginTop:4 }}>Bridging ~40% of current $5.5/kg → $1.5/kg grey gap via carbon finance mechanisms</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 9: IRR & Project Finance */}
      {activeTab===9 && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
            <SectionTitle>Developer IRR & DSCR Comparison</SectionTitle>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={DEVELOPERS}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fill:T.textSec, fontSize:9 }} />
                <YAxis tick={{ fill:T.textSec, fontSize:11 }} />
                <Tooltip contentStyle={{ background:T.surfaceH, border:`1px solid ${T.border}`, color:T.text }} />
                <Bar dataKey="irrEquityPct" fill={T.green} name="IRR Equity %" />
                <Legend />
                <ReferenceLine y={12} stroke={T.gold} strokeDasharray="4 2" label={{ value:'Min acceptable IRR', fill:T.gold, fontSize:10 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
            <SectionTitle>Green Bond Issuance (India GH2/GA, $Bn)</SectionTitle>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={DEVELOPERS}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fill:T.textSec, fontSize:9 }} />
                <YAxis tick={{ fill:T.textSec, fontSize:11 }} />
                <Tooltip contentStyle={{ background:T.surfaceH, border:`1px solid ${T.border}`, color:T.text }} formatter={(v)=>[`$${v}Bn`]} />
                <Bar dataKey="greenBondIssuedBnUsd" fill={T.teal} name="Green Bond $Bn issued" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div style={{ marginTop:20, padding:'10px 16px', background:T.surfaceH, borderRadius:6, display:'flex', justifyContent:'space-between', fontFamily:T.mono, fontSize:11, color:T.textMut }}>
        <span>EP-EA4 · Green Hydrogen & Ammonia Carbon Finance · India Focus</span>
        <span>SIGHT + RFNBO + JCM + GX-ETS · 6 Developers · 10 Tabs</span>
      </div>

      <Apr2026CarbonAnalytics moduleCode="EP-EA4" moduleTitle="Green Hydrogen & Ammonia Carbon" flavor="h2" basePrice={22} T={T} />
    </div>
  );
}
