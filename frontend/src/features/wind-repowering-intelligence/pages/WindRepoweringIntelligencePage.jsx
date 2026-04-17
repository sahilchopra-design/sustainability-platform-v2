import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, ScatterChart, Scatter, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, AreaChart, Area } from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const T = {
  bg: '#FAFAF7', card: '#FFFFFF', border: '#E5E2D9', text: '#1A1A2E',
  sub: '#6B7280', accent: '#B8860B', indigo: '#4F46E5', green: '#065F46',
  red: '#991B1B', blue: '#1E40AF', amber: '#92400E', teal: '#0F766E', navy: '#0F172A'
};

function calcIRR(cashflows) {
  if (!cashflows || cashflows.length < 2) return 0;
  let rate = 0.1;
  for (let iter = 0; iter < 100; iter++) {
    let npv = 0; let dnpv = 0;
    for (let t = 0; t < cashflows.length; t++) {
      const d = Math.pow(1 + rate, t);
      npv += cashflows[t] / (d || 1);
      dnpv -= t * cashflows[t] / (Math.pow(1 + rate, t + 1) || 1);
    }
    if (Math.abs(dnpv) < 1e-12) break;
    const newRate = rate - npv / dnpv;
    if (Math.abs(newRate - rate) < 1e-8) { rate = newRate; break; }
    rate = newRate;
    if (rate < -0.999) { rate = -0.999; break; }
  }
  return isFinite(rate) ? rate : 0;
}

function calcNPV(cashflows, rate) {
  return cashflows.reduce((acc, cf, t) => acc + cf / Math.pow(1 + rate, t), 0);
}

const TURBINES = Array.from({ length: 20 }, (_, i) => ({
  id: `WTG-${String(i + 1).padStart(3, '0')}`,
  age: Math.floor(sr(i * 7) * 12) + 14,
  rating: Math.floor(sr(i * 11) * 1200) + 600,
  cf: (sr(i * 13) * 12 + 24).toFixed(1),
  lastInspection: `202${Math.floor(sr(i * 17) * 4)}-${String(Math.floor(sr(i * 19) * 12) + 1).padStart(2, '0')}`,
  permitLife: Math.floor(sr(i * 23) * 8) + 1,
  residualValue: Math.floor(sr(i * 29) * 180) + 40,
  foundation: ['Concrete', 'Steel', 'Hybrid'][Math.floor(sr(i * 31) * 3)],
  oem: ['Vestas', 'Siemens', 'GE', 'Enercon', 'Nordex'][Math.floor(sr(i * 37) * 5)],
}));

const CASE_STUDIES = [
  { name: 'Altmark, Germany', country: 'DE', oldMW: 100, newMW: 200, turbineOld: 100, turbineNew: 28, aepUplift: 78, irr: 12.4, yr: 2021, lesson: 'EEG repowering bonus secured legacy FiT via Bimschg §16b fast-track' },
  { name: 'IJsselmeer, Netherlands', country: 'NL', oldMW: 45, newMW: 90, turbineOld: 60, turbineNew: 15, aepUplift: 82, irr: 11.8, yr: 2020, lesson: 'Grid connection reuse saved €3.2M; subsidy bridge via SDE++ auction' },
  { name: 'Lolland, Denmark', country: 'DK', oldMW: 32, newMW: 64, turbineOld: 40, turbineNew: 8, aepUplift: 95, irr: 14.1, yr: 2022, lesson: 'Simplified procedure under Danish Renewable Energy Act reduced permit timeline 60%' },
  { name: 'Strathmore, UK', country: 'UK', oldMW: 55, newMW: 110, turbineOld: 55, turbineNew: 18, aepUplift: 71, irr: 10.9, yr: 2023, lesson: 'Sub-50MW threshold avoided NSIP; CfD auction AR5 price £52/MWh' },
  { name: 'Iowa Prairie Wind', country: 'US', oldMW: 120, newMW: 240, turbineOld: 160, turbineNew: 36, aepUplift: 88, irr: 13.6, yr: 2022, lesson: 'IRA PTC transfer credit covered 40% of incremental capex' },
  { name: 'Texas Panhandle', country: 'US', oldMW: 80, newMW: 160, turbineOld: 80, turbineNew: 22, aepUplift: 91, irr: 15.2, yr: 2023, lesson: 'ERCOT nodal price premium justified early repowering; no PPA required' },
  { name: 'Havsnäs, Sweden', country: 'SE', oldMW: 90, newMW: 180, turbineOld: 75, turbineNew: 24, aepUplift: 84, irr: 12.7, yr: 2021, lesson: 'Elcertifikat subsidy transfer approved; foundation reuse on 18/24 sites' },
  { name: 'La Muela, Spain', country: 'ES', oldMW: 75, newMW: 150, turbineOld: 100, turbineNew: 21, aepUplift: 76, irr: 11.3, yr: 2022, lesson: 'REER auction price €55/MWh; environmental re-assessment took 14 months' },
];

const RISKS = [
  { risk: 'Permit Delay', prob: 35, impact: 8, category: 'Regulatory', mitigation: 'Pre-application community consultation; hire specialist planning advisor' },
  { risk: 'Foundation Failure', prob: 15, impact: 9, category: 'Technical', mitigation: 'Intrusive geotechnical survey pre-FID; foundation reuse specialist sign-off' },
  { risk: 'Grid Curtailment', prob: 25, impact: 7, category: 'Market', mitigation: 'Grid constraint modelling; negotiate firm access or storage co-location' },
  { risk: 'PPA Renegotiation', prob: 20, impact: 8, category: 'Commercial', mitigation: 'Long-term CfD/PTC route; merchant revenue cap strategy' },
  { risk: 'OEM Insolvency', prob: 10, impact: 7, category: 'Supply Chain', mitigation: 'Multi-OEM strategy; performance bond + escrow arrangement' },
  { risk: 'CAPEX Overrun', prob: 30, impact: 6, category: 'Financial', mitigation: 'EPC lump-sum contract; 15% contingency budget' },
  { risk: 'Construction Accident', prob: 8, impact: 10, category: 'HSE', mitigation: 'Strict SSOW; experienced repowering contractor selection' },
  { risk: 'Community Opposition', prob: 28, impact: 7, category: 'Social', mitigation: 'Early community benefit fund; visual impact assessment' },
  { risk: 'Grid Tariff Change', prob: 20, impact: 5, category: 'Regulatory', mitigation: 'Fixed-term grid connection agreement; regulatory counsel' },
  { risk: 'Subsidy Removal', prob: 18, impact: 8, category: 'Policy', mitigation: 'Secure CfD/PPA before FID; IRA hedge for US projects' },
  { risk: 'Interest Rate Rise', prob: 40, impact: 5, category: 'Financial', mitigation: 'Fix interest rate at financial close; interest rate swap' },
  { risk: 'Currency Risk', prob: 22, impact: 4, category: 'Financial', mitigation: 'Match funding currency to revenue currency where possible' },
];

const TECH_ROADMAP = [
  { gen: 'Current (2024)', rating: 5.5, hub: 120, rotor: 162, cf: 37, lcoe: 42, avail: true },
  { gen: '2026 (7MW)', rating: 7.0, hub: 140, rotor: 175, cf: 41, lcoe: 38, avail: false },
  { gen: '2028 (8MW)', rating: 8.0, hub: 150, rotor: 190, cf: 44, lcoe: 35, avail: false },
  { gen: '2030 (10MW)', rating: 10.0, hub: 160, rotor: 220, cf: 47, lcoe: 31, avail: false },
];

const PERMIT_RULES = [
  { country: 'Germany', rule: 'Bimschg §16b', timeline: '12–18 mo', fastTrack: 'Yes — same site modification', ppaRoute: 'EEG 2023 auction + bonus €2/MWh', notes: 'Repowering = modification, not new permit; 20% capacity increase allowed' },
  { country: 'UK', rule: 'TCPA / NSIPs S.36', timeline: '18–30 mo', fastTrack: 'Sub-50MW avoids NSIP', ppaRoute: 'CfD Auction Round AR5/AR6', notes: 'Re-assessment required: shadow flicker, noise, ecology' },
  { country: 'USA', rule: 'State + BOEM (offshore)', timeline: '12–24 mo', fastTrack: 'IRA §45 PTC transfer allows partial credit', ppaRoute: 'PTC or ITC + merchant/PPA', notes: 'FERC queue position retained in some ISOs for same-site upgrade' },
  { country: 'Denmark', rule: 'Vedvarende energi loven', timeline: '9–14 mo', fastTrack: 'Simplified procedure if <4x capacity increase', ppaRoute: 'Elcertifikat or tender', notes: 'Municipal hearing required; noise standard 42 dB(A) at nearest residence' },
  { country: 'Netherlands', rule: 'Wet Milieubeheer / OW', timeline: '18–24 mo', fastTrack: 'Crisis & Herstelwet expedites', ppaRoute: 'SDE++ auction', notes: 'Province-level permit; AERIUS nitrogen deposition assessment required' },
];

function KpiCard({ label, value, sub, color }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px', minWidth: 160, flex: 1 }}>
      <div style={{ fontSize: 11, color: T.sub, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: color || T.text, fontFamily: 'JetBrains Mono, monospace' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function SectionLabel({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 700, color: T.accent, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8, marginTop: 16 }}>{children}</div>;
}

function Slider({ label, min, max, value, onChange, step = 1, unit = '' }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontSize: 11, color: T.sub }}>{label}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: T.text, fontFamily: 'JetBrains Mono, monospace' }}>{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: T.indigo, height: 4 }} />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, color: T.sub, marginBottom: 3 }}>{label}</div>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 4, padding: '4px 8px', fontSize: 12, color: T.text }}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function Toggle({ label, value, onChange }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
      <span style={{ fontSize: 11, color: T.sub }}>{label}</span>
      <div onClick={() => onChange(!value)} style={{ width: 36, height: 20, borderRadius: 10, background: value ? T.indigo : T.border, cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
        <div style={{ position: 'absolute', top: 2, left: value ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
      </div>
    </div>
  );
}

const TABS = [
  'Overview', 'Asset Inventory', 'Repowering Economics', 'Full vs Partial', 'Life Extension',
  'AEP Uplift', 'Grid Re-use', 'Revenue Bridge', 'Permitting', 'Environmental',
  'Construction', 'Financial Model', 'IRR Analysis', 'Policy', 'Case Studies',
  'Risk Analysis', 'Tech Roadmap', 'Decision Summary'
];

export default function WindRepoweringIntelligencePage() {
  const [tab, setTab] = useState(0);

  // Section 1: Existing Fleet
  const [numTurbines, setNumTurbines] = useState(60);
  const [oldRatingKw, setOldRatingKw] = useState(1000);
  const [turbineAge, setTurbineAge] = useState(22);
  const [currentCF, setCurrentCF] = useState(30);
  const [remainPermit, setRemainPermit] = useState(5);
  const [gridCapMW, setGridCapMW] = useState(80);

  // Section 2: Repowering Strategy
  const [strategy, setStrategy] = useState('Full Repowering');
  const [newRatingKw, setNewRatingKw] = useState(5000);
  const [hubHeight, setHubHeight] = useState(130);
  const [rotorDiam, setRotorDiam] = useState(158);

  // Section 3: Site Parameters
  const [landTenure, setLandTenure] = useState(25);
  const [reuseGrid, setReuseGrid] = useState(true);
  const [permitFastTrack, setPermitFastTrack] = useState(true);
  const [retainSubsidy, setRetainSubsidy] = useState(false);

  // Section 4: CAPEX & Decom
  const [turbineCapex, setTurbineCapex] = useState(1100);
  const [bopCapex, setBopCapex] = useState(300);
  const [decomPerTurbine, setDecomPerTurbine] = useState(80);
  const [scrapPerTurbine, setScrapPerTurbine] = useState(25);
  const [gridUpgradeCost, setGridUpgradeCost] = useState(5);

  // Section 5: Revenue
  const [newPPA, setNewPPA] = useState(55);
  const [ppaEscalation, setPpaEscalation] = useState(1.5);
  const [newProjectLife, setNewProjectLife] = useState(25);
  const [existingRevMWh, setExistingRevMWh] = useState(72);

  // Section 6: Financial
  const [discountRate, setDiscountRate] = useState(7);
  const [equityPct, setEquityPct] = useState(40);
  const [taxRate, setTaxRate] = useState(25);

  // Derived calculations
  const metrics = useMemo(() => {
    const dr = discountRate / 100;
    const oldCapMW = (numTurbines * oldRatingKw) / 1000;
    const oldAEP = oldCapMW * (currentCF / 100) * 8760; // MWh/yr
    const oldRevenue = oldAEP * existingRevMWh / 1e6; // $M/yr

    // New turbines
    const newTurbineCount = strategy === 'Full Repowering'
      ? Math.ceil((oldCapMW * 1000) / newRatingKw)
      : strategy === 'Partial Repowering'
        ? Math.ceil((oldCapMW * 1000 * 0.5) / newRatingKw)
        : numTurbines;
    const newCapMW = (newTurbineCount * newRatingKw) / 1000;

    // CF uplift from rotor diameter (larger rotor → higher CF)
    const baseCF = currentCF;
    const rotorFactor = Math.min(1.0, (rotorDiam - 80) / 150);
    const newCF = Math.min(52, baseCF + rotorFactor * 14 + (hubHeight - 80) / 300 * 4);
    const newAEP = newCapMW * (newCF / 100) * 8760;
    const newRevenue = newAEP * newPPA / 1e6;

    // CAPEX
    const totalCapexMPerKW = (turbineCapex + bopCapex) / 1000;
    const totalCapexM = newCapMW * totalCapexMPerKW;
    const decomCostM = (numTurbines * decomPerTurbine) / 1000;
    const scrapValueM = (numTurbines * scrapPerTurbine) / 1000;
    const gridCostM = reuseGrid ? 0 : gridUpgradeCost;
    const totalInvestM = totalCapexM + decomCostM - scrapValueM + gridCostM;

    // Old fleet remaining NPV
    const oldOpexMYr = oldCapMW * 0.025; // $M/yr escalating
    const oldCFs = Array.from({ length: remainPermit }, (_, t) =>
      oldRevenue * Math.pow(0.99, t) - oldOpexMYr * Math.pow(1.04, t));
    const oldNPV = calcNPV(oldCFs, dr);

    // New fleet NPV
    const newOpexMYr = newCapMW * 0.022;
    const newCFsArr = [
      -totalInvestM * 0.7, // yr0
      -totalInvestM * 0.3, // yr1 construction
      ...Array.from({ length: newProjectLife }, (_, t) =>
        newRevenue * Math.pow(1 + ppaEscalation / 100, t) * (1 - taxRate / 100)
        - newOpexMYr * Math.pow(1.03, t))
    ];
    const newNPV = calcNPV(newCFsArr, dr);
    const incrementalNPV = newNPV - oldNPV;

    // IRR of incremental investment
    const incrementalCFs = newCFsArr.map((v, t) => v - (oldCFs[t] || 0));
    const incIRR = calcIRR(incrementalCFs) * 100;

    const aepUplift = oldAEP > 0 ? ((newAEP - oldAEP) / oldAEP) * 100 : 0;
    const lcoeNew = totalInvestM > 0
      ? (totalInvestM * 1e6 * dr / (1 - Math.pow(1 + dr, -newProjectLife))) /
        Math.max(1, newAEP)
      : 0;

    const co2Factor = 0.45; // tCO2e/MWh avg grid emission factor
    const co2Saved = (newAEP - oldAEP) * co2Factor;

    const payback = newRevenue > 0 ? totalInvestM / (newRevenue - oldRevenue) : 99;

    let decision = 'Repower Now';
    if (incIRR < 8) decision = 'Extend Life';
    if (incIRR < 5) decision = 'Wait';
    if (incIRR < 0 || remainPermit < 2) decision = 'Decommission';

    return {
      oldCapMW, oldAEP, oldRevenue, newTurbineCount, newCapMW,
      newCF, newAEP, newRevenue, totalCapexM, decomCostM, scrapValueM,
      gridCostM, totalInvestM, oldNPV, newNPV, incrementalNPV,
      incIRR, aepUplift, lcoeNew, co2Saved, payback,
      decision, newCFsArr, oldCFs, dr
    };
  }, [numTurbines, oldRatingKw, turbineAge, currentCF, remainPermit, gridCapMW,
    strategy, newRatingKw, hubHeight, rotorDiam, reuseGrid, turbineCapex, bopCapex,
    decomPerTurbine, scrapPerTurbine, gridUpgradeCost, newPPA, ppaEscalation,
    newProjectLife, existingRevMWh, discountRate, equityPct, taxRate]);

  const sidebar = (
    <div style={{ width: 260, minWidth: 260, background: T.card, borderRight: `1px solid ${T.border}`, padding: '16px 14px', overflowY: 'auto', fontSize: 12 }}>
      <SectionLabel>1. Existing Fleet</SectionLabel>
      <Slider label="Old Turbines" min={10} max={200} value={numTurbines} onChange={setNumTurbines} />
      <Slider label="Old Rating (kW)" min={500} max={2000} step={100} value={oldRatingKw} onChange={setOldRatingKw} unit=" kW" />
      <Slider label="Turbine Age (yr)" min={15} max={30} value={turbineAge} onChange={setTurbineAge} unit=" yr" />
      <Slider label="Current CF" min={25} max={40} value={currentCF} onChange={setCurrentCF} unit="%" />
      <Slider label="Remaining Permit (yr)" min={0} max={10} value={remainPermit} onChange={setRemainPermit} unit=" yr" />
      <Slider label="Grid Connection (MW)" min={20} max={300} step={5} value={gridCapMW} onChange={setGridCapMW} unit=" MW" />

      <SectionLabel>2. Repowering Strategy</SectionLabel>
      <Select label="Strategy" value={strategy} onChange={setStrategy}
        options={['Full Repowering', 'Partial Repowering', 'Life Extension', 'Hybrid']} />
      <Slider label="New Turbine (kW)" min={3000} max={7000} step={500} value={newRatingKw} onChange={setNewRatingKw} unit=" kW" />
      <Slider label="Hub Height (m)" min={80} max={180} step={5} value={hubHeight} onChange={setHubHeight} unit=" m" />
      <Slider label="Rotor Diameter (m)" min={90} max={220} step={2} value={rotorDiam} onChange={setRotorDiam} unit=" m" />

      <SectionLabel>3. Site Parameters</SectionLabel>
      <Slider label="Land Tenure (yr)" min={5} max={50} value={landTenure} onChange={setLandTenure} unit=" yr" />
      <Toggle label="Reuse Grid Connection" value={reuseGrid} onChange={setReuseGrid} />
      <Toggle label="Permit Fast-Track" value={permitFastTrack} onChange={setPermitFastTrack} />
      <Toggle label="Retain Old Subsidy" value={retainSubsidy} onChange={setRetainSubsidy} />

      <SectionLabel>4. CAPEX & Decom</SectionLabel>
      <Slider label="Turbine $/kW" min={800} max={1400} step={25} value={turbineCapex} onChange={setTurbineCapex} unit=" $/kW" />
      <Slider label="BoP $/kW" min={200} max={400} step={25} value={bopCapex} onChange={setBopCapex} unit=" $/kW" />
      <Slider label="Decom $/turbine ($K)" min={20} max={200} step={5} value={decomPerTurbine} onChange={setDecomPerTurbine} unit="K" />
      <Slider label="Scrap $/turbine ($K)" min={5} max={60} step={5} value={scrapPerTurbine} onChange={setScrapPerTurbine} unit="K" />
      <Slider label="Grid Upgrade ($M)" min={0} max={30} step={0.5} value={gridUpgradeCost} onChange={setGridUpgradeCost} unit=" $M" />

      <SectionLabel>5. Revenue</SectionLabel>
      <Slider label="New PPA $/MWh" min={30} max={100} value={newPPA} onChange={setNewPPA} unit=" $/MWh" />
      <Slider label="Escalation %" min={0} max={4} step={0.1} value={ppaEscalation} onChange={setPpaEscalation} unit="%" />
      <Slider label="Project Life (yr)" min={20} max={30} value={newProjectLife} onChange={setNewProjectLife} unit=" yr" />
      <Slider label="Existing Rev $/MWh" min={40} max={120} value={existingRevMWh} onChange={setExistingRevMWh} unit=" $/MWh" />

      <SectionLabel>6. Financial</SectionLabel>
      <Slider label="Discount Rate %" min={4} max={15} step={0.5} value={discountRate} onChange={setDiscountRate} unit="%" />
      <Slider label="Equity %" min={20} max={80} value={equityPct} onChange={setEquityPct} unit="%" />
      <Slider label="Tax Rate %" min={0} max={40} value={taxRate} onChange={setTaxRate} unit="%" />
    </div>
  );

  const decisionColor = { 'Repower Now': T.green, 'Extend Life': T.indigo, 'Wait': T.amber, 'Decommission': T.red }[metrics.decision] || T.text;

  const quickStats = (
    <div style={{ display: 'flex', gap: 12, padding: '12px 16px', background: T.navy, borderBottom: `1px solid ${T.border}`, flexWrap: 'wrap' }}>
      {[
        { label: 'Incremental IRR', val: `${metrics.incIRR.toFixed(1)}%`, c: metrics.incIRR >= 10 ? '#4ade80' : metrics.incIRR >= 7 ? '#fbbf24' : '#f87171' },
        { label: 'AEP Uplift', val: `${metrics.aepUplift.toFixed(1)}%`, c: '#93c5fd' },
        { label: 'LCOE New', val: `$${metrics.lcoeNew.toFixed(1)}/MWh`, c: '#d1fae5' },
        { label: 'NPV vs Continue', val: `$${metrics.incrementalNPV.toFixed(1)}M`, c: metrics.incrementalNPV >= 0 ? '#4ade80' : '#f87171' },
        { label: 'Decision', val: metrics.decision, c: decisionColor === T.green ? '#4ade80' : decisionColor === T.red ? '#f87171' : '#fbbf24' },
      ].map(({ label, val, c }) => (
        <div key={label} style={{ color: '#fff' }}>
          <div style={{ fontSize: 10, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: c, fontFamily: 'JetBrains Mono, monospace' }}>{val}</div>
        </div>
      ))}
    </div>
  );

  // Tab content renderers
  function renderOverview() {
    const { incIRR, aepUplift, lcoeNew, incrementalNPV, co2Saved, payback, oldNPV, newNPV, totalInvestM, decision } = metrics;
    const costBreakdown = [
      { name: 'Turbine Supply', value: (numTurbines * (turbineCapex / 1000) * (oldRatingKw / 1000)) },
      { name: 'Balance of Plant', value: (numTurbines * (bopCapex / 1000) * (oldRatingKw / 1000)) },
      { name: 'Decommissioning', value: metrics.decomCostM },
      { name: 'Grid Upgrade', value: metrics.gridCostM },
      { name: 'Scrap Credit', value: -metrics.scrapValueM },
    ];
    return (
      <div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <KpiCard label="Incremental IRR" value={`${incIRR.toFixed(1)}%`} sub="Repower vs Continue" color={incIRR >= 10 ? T.green : incIRR >= 7 ? T.amber : T.red} />
          <KpiCard label="AEP Uplift" value={`+${aepUplift.toFixed(1)}%`} sub={`${(metrics.newAEP / 1000).toFixed(0)} GWh/yr new`} color={T.indigo} />
          <KpiCard label="New LCOE" value={`$${lcoeNew.toFixed(1)}/MWh`} sub="Levelized cost" color={T.blue} />
          <KpiCard label="NPV vs Continue" value={`$${incrementalNPV.toFixed(1)}M`} sub="Incremental value" color={incrementalNPV >= 0 ? T.green : T.red} />
          <KpiCard label="CO₂ Saved" value={`${(co2Saved / 1000).toFixed(1)}kt`} sub="tCO₂e/yr vs baseline" color={T.teal} />
          <KpiCard label="Payback" value={`${payback > 30 ? '>30' : payback.toFixed(1)} yr`} sub="Simple payback" color={T.amber} />
        </div>

        <div style={{ background: T.card, border: `2px solid ${decisionColor}`, borderRadius: 10, padding: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: T.sub, marginBottom: 6 }}>INVESTMENT RECOMMENDATION</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: decisionColor }}>{decision}</div>
          <div style={{ fontSize: 13, color: T.text, marginTop: 8 }}>
            {decision === 'Repower Now' && `IRR of ${incIRR.toFixed(1)}% exceeds hurdle. Incremental NPV $${incrementalNPV.toFixed(1)}M positive. New fleet CF ${metrics.newCF.toFixed(1)}% vs current ${currentCF}%.`}
            {decision === 'Extend Life' && `IRR ${incIRR.toFixed(1)}% below typical 10% hurdle. Life extension may preserve value while awaiting better technology or PPA pricing.`}
            {decision === 'Wait' && `IRR ${incIRR.toFixed(1)}% insufficient. Re-evaluate in 2-3 years as turbine costs decline or PPA prices improve.`}
            {decision === 'Decommission' && `Negative incremental return or insufficient permit life. Orderly decommissioning maximises scrap/residual recovery.`}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>Cost-Benefit Summary ($M)</div>
            <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
              <tbody>
                {[
                  ['Total Investment', `-$${totalInvestM.toFixed(1)}M`, T.red],
                  ['Old Fleet NPV (baseline)', `$${oldNPV.toFixed(1)}M`, T.text],
                  ['New Fleet NPV (20yr)', `$${newNPV.toFixed(1)}M`, T.green],
                  ['Incremental NPV', `$${incrementalNPV.toFixed(1)}M`, incrementalNPV >= 0 ? T.green : T.red],
                  ['CAPEX / MWp New', `$${(totalInvestM / Math.max(0.001, metrics.newCapMW)).toFixed(2)}M/MW`, T.text],
                  ['New LCOE', `$${lcoeNew.toFixed(1)}/MWh`, T.blue],
                  ['CO₂ Benefit 20yr', `${(co2Saved * 20 / 1e6).toFixed(2)} MtCO₂`, T.teal],
                ].map(([l, v, c]) => (
                  <tr key={l} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '5px 0', color: T.sub }}>{l}</td>
                    <td style={{ padding: '5px 0', color: c, fontWeight: 700, textAlign: 'right', fontFamily: 'JetBrains Mono, monospace' }}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>CAPEX Breakdown ($M)</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={costBreakdown.filter(d => Math.abs(d.value) > 0.01)}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={v => `$${Number(v).toFixed(1)}M`} />
                <Bar dataKey="value" fill={T.indigo} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>Fleet Metrics: Old vs New</div>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={[
                { subject: 'Capacity Factor', A: currentCF / 52 * 100, B: metrics.newCF / 52 * 100 },
                { subject: 'Unit Count Eff.', A: 40, B: Math.max(20, 100 - metrics.newTurbineCount / numTurbines * 100 + 50) },
                { subject: 'LCOE Score', A: 40, B: Math.min(100, (70 - metrics.lcoeNew) * 2) },
                { subject: 'Revenue/MW', A: metrics.oldCapMW > 0 ? Math.min(100, metrics.oldRevenue / metrics.oldCapMW * 20) : 0, B: metrics.newCapMW > 0 ? Math.min(100, metrics.newRevenue / metrics.newCapMW * 20) : 0 },
                { subject: 'Environmental', A: 50, B: 82 },
                { subject: 'Grid Utilisation', A: Math.min(100, metrics.oldCapMW / gridCapMW * 100), B: Math.min(100, metrics.newCapMW / gridCapMW * 100) },
              ]}>
                <PolarGrid stroke={T.border} />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} />
                <Radar name="Old Fleet" dataKey="A" stroke={T.sub} fill={T.sub} fillOpacity={0.2} />
                <Radar name="New Fleet" dataKey="B" stroke={T.indigo} fill={T.indigo} fillOpacity={0.25} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>Key Investment Metrics Summary</div>
            {[
              { label: 'Strategy', value: strategy, color: T.indigo },
              { label: 'Old Capacity', value: `${metrics.oldCapMW.toFixed(1)} MW (${numTurbines} × ${oldRatingKw}kW)`, color: T.sub },
              { label: 'New Capacity', value: `${metrics.newCapMW.toFixed(1)} MW (${metrics.newTurbineCount} × ${(newRatingKw / 1000).toFixed(1)}MW)`, color: T.green },
              { label: 'CF Uplift', value: `${currentCF}% → ${metrics.newCF.toFixed(1)}% (+${(metrics.newCF - currentCF).toFixed(1)} ppt)`, color: T.teal },
              { label: 'Total CAPEX', value: `$${metrics.totalInvestM.toFixed(1)}M ($${((turbineCapex + bopCapex)).toFixed(0)}/kW)`, color: T.red },
              { label: 'Grid Connection', value: reuseGrid ? 'Reused (saves cost)' : 'New connection required', color: reuseGrid ? T.green : T.amber },
              { label: 'Permit Route', value: permitFastTrack ? 'Fast-track (modification)' : 'Full planning application', color: T.indigo },
              { label: 'Revenue Route', value: retainSubsidy ? 'Retain legacy FiT' : `New ${newPPA} $/MWh PPA/CfD`, color: T.blue },
              { label: 'Project Life', value: `${newProjectLife} years post-COD`, color: T.text },
              { label: 'Breakeven PPA', value: `~$${(newPPA * (discountRate / metrics.incIRR)).toFixed(0)}/MWh`, color: T.amber },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: `1px solid ${T.border}`, fontSize: 11 }}>
                <span style={{ color: T.sub }}>{label}</span>
                <span style={{ color, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace', fontSize: 10, textAlign: 'right', maxWidth: '55%' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function renderAssetInventory() {
    const turbines = TURBINES.map((t, i) => ({
      ...t,
      age: Math.floor(sr(i * 7) * 8) + turbineAge - 4,
      rating: Math.floor(sr(i * 11) * 800) + oldRatingKw - 400,
      cf: Math.max(20, Math.min(40, currentCF + (sr(i * 13) * 10 - 5))).toFixed(1),
      permitLife: Math.max(0, remainPermit + Math.floor(sr(i * 17) * 4) - 2),
      residualValue: Math.floor(sr(i * 29) * 120) + 30,
    }));
    const sorted = [...turbines].sort((a, b) => b.age - a.age);
    const avgAge = sorted.length ? sorted.reduce((s, t) => s + t.age, 0) / sorted.length : 0;
    const avgCF = sorted.length ? sorted.reduce((s, t) => s + Number(t.cf), 0) / sorted.length : 0;
    const totalRV = sorted.reduce((s, t) => s + t.residualValue, 0);
    return (
      <div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <KpiCard label="Fleet Units" value={numTurbines} sub="Total turbines" />
          <KpiCard label="Avg Age" value={`${avgAge.toFixed(1)} yr`} sub="Fleet average" color={T.amber} />
          <KpiCard label="Avg CF" value={`${avgCF.toFixed(1)}%`} sub="Capacity factor" color={T.blue} />
          <KpiCard label="Total Residual Value" value={`$${(totalRV).toFixed(0)}K`} sub="Est. scrap + parts" color={T.teal} />
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.navy }}>
                  {['ID', 'OEM', 'Age (yr)', 'Rating (kW)', 'CF %', 'Foundation', 'Last Insp.', 'Permit Life', 'Residual $K', 'Status'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', color: '#fff', textAlign: 'left', fontWeight: 600, fontSize: 10 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((t, i) => {
                  const status = t.age >= 25 ? 'Critical' : t.age >= 20 ? 'Review' : 'OK';
                  const statusColor = status === 'Critical' ? T.red : status === 'Review' ? T.amber : T.green;
                  return (
                    <tr key={t.id} style={{ background: i % 2 === 0 ? T.bg : T.card, borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '6px 10px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>{t.id}</td>
                      <td style={{ padding: '6px 10px', color: T.sub }}>{t.oem}</td>
                      <td style={{ padding: '6px 10px', color: t.age >= 25 ? T.red : T.text, fontWeight: t.age >= 25 ? 700 : 400 }}>{t.age}</td>
                      <td style={{ padding: '6px 10px' }}>{t.rating}</td>
                      <td style={{ padding: '6px 10px', color: Number(t.cf) < 27 ? T.red : T.text }}>{t.cf}%</td>
                      <td style={{ padding: '6px 10px', color: T.sub }}>{t.foundation}</td>
                      <td style={{ padding: '6px 10px', color: T.sub }}>{t.lastInspection}</td>
                      <td style={{ padding: '6px 10px', color: t.permitLife <= 2 ? T.red : T.text }}>{t.permitLife} yr</td>
                      <td style={{ padding: '6px 10px', fontFamily: 'JetBrains Mono, monospace' }}>${t.residualValue}K</td>
                      <td style={{ padding: '6px 10px' }}><span style={{ background: statusColor, color: '#fff', borderRadius: 4, padding: '2px 6px', fontSize: 10 }}>{status}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>Fleet Age Distribution</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={[
                { age: '15-17yr', count: sorted.filter(t => t.age >= 15 && t.age < 18).length },
                { age: '18-20yr', count: sorted.filter(t => t.age >= 18 && t.age < 21).length },
                { age: '21-23yr', count: sorted.filter(t => t.age >= 21 && t.age < 24).length },
                { age: '24-26yr', count: sorted.filter(t => t.age >= 24 && t.age < 27).length },
                { age: '27+yr', count: sorted.filter(t => t.age >= 27).length },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="age" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" name="Turbines" fill={T.indigo} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>CF Distribution Across Fleet</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={[
                { cf: '<26%', count: sorted.filter(t => Number(t.cf) < 26).length },
                { cf: '26-28%', count: sorted.filter(t => Number(t.cf) >= 26 && Number(t.cf) < 28).length },
                { cf: '28-30%', count: sorted.filter(t => Number(t.cf) >= 28 && Number(t.cf) < 30).length },
                { cf: '30-32%', count: sorted.filter(t => Number(t.cf) >= 30 && Number(t.cf) < 32).length },
                { cf: '>32%', count: sorted.filter(t => Number(t.cf) >= 32).length },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="cf" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" name="Turbines" fill={T.teal} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  }

  function renderRepoweringEconomics() {
    const { oldNPV, newNPV, incrementalNPV, incIRR, totalInvestM, newCFsArr, oldCFs, dr } = metrics;
    const ppaRange = Array.from({ length: 9 }, (_, i) => {
      const ppa = 35 + i * 8;
      const rev = metrics.newAEP * ppa / 1e6;
      const opex = metrics.newCapMW * 0.022;
      const cfs = [
        -totalInvestM * 0.7, -totalInvestM * 0.3,
        ...Array.from({ length: newProjectLife }, (_, t) => rev * Math.pow(1 + ppaEscalation / 100, t) * (1 - taxRate / 100) - opex * Math.pow(1.03, t))
      ];
      const incrementalC = cfs.map((v, t) => v - (oldCFs[t] || 0));
      return { ppa: `$${ppa}`, irr: (calcIRR(incrementalC) * 100).toFixed(1) };
    });
    const capexRange = Array.from({ length: 8 }, (_, i) => {
      const cap = 700 + i * 100;
      const inv = metrics.newCapMW * (cap + bopCapex) / 1000 + metrics.decomCostM - metrics.scrapValueM + metrics.gridCostM;
      const cfs = [-inv * 0.7, -inv * 0.3, ...Array.from({ length: newProjectLife }, (_, t) => metrics.newRevenue * Math.pow(1 + ppaEscalation / 100, t) * (1 - taxRate / 100) - metrics.newCapMW * 0.022 * Math.pow(1.03, t))];
      const inc = cfs.map((v, t) => v - (oldCFs[t] || 0));
      return { capex: `$${cap}`, irr: (calcIRR(inc) * 100).toFixed(1) };
    });
    return (
      <div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <KpiCard label="Old Fleet NPV" value={`$${oldNPV.toFixed(1)}M`} sub={`Over ${remainPermit}yr`} color={T.sub} />
          <KpiCard label="New Fleet NPV" value={`$${newNPV.toFixed(1)}M`} sub={`Over ${newProjectLife}yr`} color={T.indigo} />
          <KpiCard label="Incremental NPV" value={`$${incrementalNPV.toFixed(1)}M`} sub="Repower benefit" color={incrementalNPV >= 0 ? T.green : T.red} />
          <KpiCard label="Incremental IRR" value={`${incIRR.toFixed(1)}%`} sub="vs continue" color={incIRR >= 10 ? T.green : T.amber} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>IRR Sensitivity to PPA Price</div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={ppaRange}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="ppa" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} unit="%" />
                <Tooltip formatter={v => `${v}%`} />
                <Line dataKey="irr" stroke={T.indigo} dot={false} strokeWidth={2} name="IRR" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>IRR Sensitivity to CAPEX $/kW</div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={capexRange}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="capex" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} unit="%" />
                <Tooltip formatter={v => `${v}%`} />
                <Line dataKey="irr" stroke={T.red} dot={false} strokeWidth={2} name="IRR" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  }

  function renderFullVsPartial() {
    const { oldAEP, newAEP, newCapMW, totalInvestM, incIRR } = metrics;
    const partialTurbines = Math.ceil(metrics.newTurbineCount * 0.5);
    const partialCapMW = (partialTurbines * newRatingKw) / 1000;
    const partialAEP = partialCapMW * (metrics.newCF / 100) * 8760 + (metrics.oldCapMW * 0.5) * (currentCF / 100) * 8760;
    const partialCapex = totalInvestM * 0.55;
    const comparison = [
      { name: 'Full Repower', capex: totalInvestM, aep: newAEP / 1000, irr: incIRR, gridUtil: Math.min(100, (newCapMW / gridCapMW) * 100) },
      { name: 'Partial Repower', capex: partialCapex, aep: partialAEP / 1000, irr: incIRR * 0.85, gridUtil: Math.min(100, ((partialCapMW + metrics.oldCapMW * 0.5) / gridCapMW) * 100) },
      { name: 'Life Extension', capex: totalInvestM * 0.12, aep: oldAEP / 1000 * 0.97, irr: incIRR * 0.6, gridUtil: Math.min(100, (metrics.oldCapMW / gridCapMW) * 100) },
    ];
    const tiers = [
      { tier: 'Tier 1 (>35% CF)', count: Math.floor(numTurbines * 0.2), action: 'Extend Life', reason: 'Still performing well', age: '<20yr', foundationCond: 'Good' },
      { tier: 'Tier 2 (30-35% CF)', count: Math.floor(numTurbines * 0.35), action: 'Partial Repower', reason: 'Moderate performance decline', age: '20-24yr', foundationCond: 'Fair' },
      { tier: 'Tier 3 (<30% CF)', count: Math.floor(numTurbines * 0.45), action: 'Full Repower', reason: 'Significant underperformance', age: '>24yr', foundationCond: 'Assess' },
    ];
    const capexIRRData = [
      { name: 'Full Repower', capex: totalInvestM, irr: incIRR, aep: newAEP / 1000 },
      { name: 'Partial Repower', capex: partialCapex, irr: incIRR * 0.85, aep: partialAEP / 1000 },
      { name: 'Life Extension', capex: totalInvestM * 0.12, irr: incIRR * 0.6, aep: oldAEP / 1000 * 0.97 },
    ];
    return (
      <div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <KpiCard label="Full Repower Capex" value={`$${totalInvestM.toFixed(1)}M`} sub={`${metrics.newTurbineCount} new turbines`} color={T.red} />
          <KpiCard label="Partial Repower Capex" value={`$${partialCapex.toFixed(1)}M`} sub={`${Math.ceil(metrics.newTurbineCount * 0.5)} new turbines`} color={T.amber} />
          <KpiCard label="Full vs Partial AEP" value={`${((newAEP - partialAEP) / 1000).toFixed(0)} GWh`} sub="Additional annual AEP" color={T.indigo} />
          <KpiCard label="Grid Utilisation" value={`${Math.min(100, (metrics.newCapMW / gridCapMW * 100)).toFixed(0)}%`} sub="Full repower grid load" color={T.teal} />
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>Strategy Comparison — Capex, AEP, IRR</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={capexIRRData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} unit="%" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="aep" name="AEP (GWh/yr)" fill={T.indigo} radius={[3, 3, 0, 0]} />
              <Bar yAxisId="right" dataKey="irr" name="IRR (%)" fill={T.green} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>Decision Matrix by Turbine Performance Tier</div>
          <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: T.navy }}>
              {['Tier', 'Count', 'Typical Age', 'Foundation', 'Recommended Action', 'Rationale'].map(h =>
                <th key={h} style={{ padding: '8px 12px', color: '#fff', textAlign: 'left', fontSize: 10 }}>{h}</th>)}
            </tr></thead>
            <tbody>{tiers.map((t, i) => (
              <tr key={t.tier} style={{ background: i % 2 === 0 ? T.bg : T.card, borderBottom: `1px solid ${T.border}` }}>
                <td style={{ padding: '8px 12px', fontWeight: 700 }}>{t.tier}</td>
                <td style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace' }}>{t.count}</td>
                <td style={{ padding: '8px 12px', color: T.sub }}>{t.age}</td>
                <td style={{ padding: '8px 12px', color: t.foundationCond === 'Good' ? T.green : t.foundationCond === 'Fair' ? T.amber : T.red }}>{t.foundationCond}</td>
                <td style={{ padding: '8px 12px', color: T.indigo, fontWeight: 700 }}>{t.action}</td>
                <td style={{ padding: '8px 12px', color: T.sub }}>{t.reason}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    );
  }

  function renderLifeExtension() {
    const baseOpex = metrics.oldCapMW * 0.025;
    const extensions = [5, 10, 15].map(yrs => {
      const inspCost = 0.8 + yrs * 0.1;
      const opexIncrease = 1 + yrs * 0.04;
      const insuranceIncrease = 1 + yrs * 0.06;
      const annualCost = baseOpex * opexIncrease + baseOpex * insuranceIncrease * 0.3;
      const annualRev = metrics.oldRevenue * Math.pow(0.985, yrs / 2);
      const cfs = [-inspCost, ...Array.from({ length: yrs }, (_, t) => annualRev * Math.pow(0.99, t) - annualCost * Math.pow(1.03, t))];
      const npv = calcNPV(cfs, metrics.dr);
      const lace = annualCost / Math.max(1, metrics.oldAEP / 1e6);
      const irr = calcIRR(cfs) * 100;
      return { yrs, inspCost: inspCost.toFixed(1), opexMult: opexIncrease.toFixed(2), npv: npv.toFixed(1), lace: lace.toFixed(2), irr: irr.toFixed(1) };
    });
    const compData = [
      ...extensions.map(e => ({ name: `Extend ${e.yrs}yr`, value: Number(e.npv), fill: T.blue })),
      { name: 'Full Repower', value: metrics.incrementalNPV, fill: T.green },
    ];

    // LACE vs LCOE comparison data — year-by-year O&M cost escalation
    const opexEscData = Array.from({ length: 15 }, (_, t) => ({
      year: `Y${t + 1}`,
      extended: (baseOpex * Math.pow(1.04, t) * 1e6 / Math.max(1, metrics.oldAEP)).toFixed(1),
      repower: (metrics.newCapMW * 0.022 * Math.pow(1.03, t) * 1e6 / Math.max(1, metrics.newAEP)).toFixed(1),
    }));

    // Safety & certification requirements
    const certReqs = [
      { item: 'Blade inspection (UT/IR)', frequency: 'Annual', estimatedCost: `$${(numTurbines * 0.5).toFixed(0)}K`, standard: 'IEC 61400-1 Ed.4' },
      { item: 'Main bearing vibration analysis', frequency: 'Bi-annual', estimatedCost: `$${(numTurbines * 0.3).toFixed(0)}K`, standard: 'ISO 10816' },
      { item: 'Gearbox oil analysis + borescope', frequency: 'Annual', estimatedCost: `$${(numTurbines * 0.8).toFixed(0)}K`, standard: 'OEM spec' },
      { item: 'Tower fatigue assessment', frequency: 'One-off', estimatedCost: `$${(numTurbines * 2.5).toFixed(0)}K`, standard: 'GL/DNV RenewCert' },
      { item: 'Foundation inspection/load calc', frequency: 'One-off', estimatedCost: `$${(numTurbines * 3.2).toFixed(0)}K`, standard: 'Eurocode 7' },
      { item: 'Electrical insulation testing', frequency: 'Bi-annual', estimatedCost: `$${(numTurbines * 0.4).toFixed(0)}K`, standard: 'IEC 60034' },
      { item: 'SCADA historical data analysis', frequency: 'One-off', estimatedCost: `$${(numTurbines * 0.2).toFixed(0)}K`, standard: 'Internal' },
    ];

    return (
      <div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          {extensions.map(e => (
            <KpiCard key={e.yrs} label={`${e.yrs}yr Extension NPV`} value={`$${e.npv}M`}
              sub={`IRR ${e.irr}%`} color={Number(e.npv) >= 0 ? T.blue : T.red} />
          ))}
          <KpiCard label="Repower NPV" value={`$${metrics.incrementalNPV.toFixed(1)}M`}
            sub={`IRR ${metrics.incIRR.toFixed(1)}%`} color={T.green} />
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>Life Extension Option Analysis</div>
          <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: T.navy }}>
              {['Extension', 'Assess Cost $M', 'O&M Multiplier', 'NPV $M', 'IRR %', 'LACE $/MWh', 'Certification'].map(h =>
                <th key={h} style={{ padding: '8px 12px', color: '#fff', textAlign: 'left', fontSize: 11 }}>{h}</th>)}
            </tr></thead>
            <tbody>{extensions.map((e, i) => (
              <tr key={e.yrs} style={{ background: i % 2 === 0 ? T.bg : T.card, borderBottom: `1px solid ${T.border}` }}>
                <td style={{ padding: '8px 12px', fontWeight: 700 }}>{e.yrs}-year extension</td>
                <td style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace' }}>${e.inspCost}M</td>
                <td style={{ padding: '8px 12px' }}>{e.opexMult}×</td>
                <td style={{ padding: '8px 12px', color: Number(e.npv) >= 0 ? T.green : T.red, fontWeight: 700 }}>${e.npv}M</td>
                <td style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace' }}>{e.irr}%</td>
                <td style={{ padding: '8px 12px' }}>${e.lace}/MWh</td>
                <td style={{ padding: '8px 12px', color: T.sub, fontSize: 11 }}>{e.yrs <= 5 ? 'GL/DNV standard' : e.yrs <= 10 ? 'RenewCert req.' : 'Full recertification'}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>Extension vs Repower NPV ($M)</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={compData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={v => `$${Number(v).toFixed(1)}M`} />
                <Bar dataKey="value" name="NPV $M" radius={[3, 3, 0, 0]} fill={T.indigo} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>O&M Cost Trajectory $/MWh (Life Extension vs Repower)</div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={opexEscData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} unit="$" />
                <Tooltip formatter={v => `$${v}/MWh`} />
                <Legend />
                <Line dataKey="extended" stroke={T.amber} strokeWidth={2} name="Extended Fleet" dot={false} />
                <Line dataKey="repower" stroke={T.green} strokeWidth={2} name="Repowered Fleet" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>Technical Assessment Requirements for Life Extension</div>
          <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: T.navy }}>
              {['Assessment Item', 'Frequency', 'Est. Cost', 'Standard/Basis'].map(h =>
                <th key={h} style={{ padding: '7px 12px', color: '#fff', textAlign: 'left', fontSize: 10 }}>{h}</th>)}
            </tr></thead>
            <tbody>{certReqs.map((c, i) => (
              <tr key={c.item} style={{ background: i % 2 === 0 ? T.bg : T.card, borderBottom: `1px solid ${T.border}` }}>
                <td style={{ padding: '6px 12px', fontWeight: 600 }}>{c.item}</td>
                <td style={{ padding: '6px 12px', color: T.sub }}>{c.frequency}</td>
                <td style={{ padding: '6px 12px', fontFamily: 'JetBrains Mono, monospace' }}>{c.estimatedCost}</td>
                <td style={{ padding: '6px 12px', color: T.indigo, fontSize: 10 }}>{c.standard}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    );
  }

  function renderAEPUplift() {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const windProfile = [1.25, 1.18, 1.12, 0.95, 0.82, 0.72, 0.68, 0.71, 0.88, 1.05, 1.18, 1.28];
    const constructionStart = 3; const constructionEnd = 8;
    const monthlyData = months.map((m, i) => {
      const oldMonthly = (metrics.oldAEP / 12) * windProfile[i] / 0.98;
      const newMonthly = (metrics.newAEP / 12) * windProfile[i] / 0.98;
      const underConst = i >= constructionStart && i <= constructionEnd;
      return {
        month: m, old: Math.round(oldMonthly / 1000), new: underConst ? 0 : Math.round(newMonthly / 1000),
        lost: underConst ? Math.round(oldMonthly / 1000) : 0
      };
    });
    return (
      <div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <KpiCard label="Old Annual AEP" value={`${(metrics.oldAEP / 1000).toFixed(0)} GWh`} sub={`CF ${currentCF}%`} />
          <KpiCard label="New Annual AEP" value={`${(metrics.newAEP / 1000).toFixed(0)} GWh`} sub={`CF ${metrics.newCF.toFixed(1)}%`} color={T.green} />
          <KpiCard label="Gross AEP Uplift" value={`+${metrics.aepUplift.toFixed(1)}%`} sub="Annual uplift" color={T.indigo} />
          <KpiCard label="Construction Loss" value={`${((metrics.oldAEP / 12) * 6 / 1000).toFixed(0)} GWh`} sub="6-month downtime" color={T.amber} />
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Monthly AEP Profile — Old vs New (GWh)</div>
          <div style={{ fontSize: 11, color: T.sub, marginBottom: 12 }}>Grey = construction downtime (Apr–Sep); no revenue generated</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={v => `${v} GWh`} />
              <Legend />
              <Bar dataKey="old" name="Old Fleet AEP" fill={T.sub} opacity={0.5} radius={[2, 2, 0, 0]} />
              <Bar dataKey="new" name="New Fleet AEP" fill={T.indigo} radius={[2, 2, 0, 0]} />
              <Bar dataKey="lost" name="Lost (Construction)" fill={T.red} opacity={0.6} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>CF Uplift Drivers</div>
          {[
            { driver: 'Rotor diameter increase', from: `${Math.round(rotorDiam * 0.5)}m → ${rotorDiam}m`, impact: `+${((rotorDiam / (rotorDiam * 0.5)) ** 2 * currentCF - currentCF).toFixed(1)} ppt CF`, basis: 'Swept area ∝ D²' },
            { driver: 'Hub height increase', from: `80m → ${hubHeight}m`, impact: `+${((hubHeight - 80) / 300 * 4).toFixed(1)} ppt CF`, basis: 'Wind shear α=0.25 power law' },
            { driver: 'Modern power curve', from: 'Gen 1 → Gen 4', impact: '+2.5 ppt CF (IEC Class IIA)', basis: 'Improved aero efficiency' },
            { driver: 'Wake loss reduction', from: 'Fewer, larger turbines', impact: '+0.8 ppt CF', basis: 'Jensen wake model' },
            { driver: 'Control algorithm upgrade', from: 'Fixed pitch → IPC', impact: '+0.4 ppt CF', basis: 'Individual pitch control' },
          ].map(d => (
            <div key={d.driver} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
              <div style={{ flex: 2 }}>
                <div style={{ color: T.text, fontWeight: 600 }}>{d.driver}</div>
                <div style={{ color: T.sub, fontSize: 10 }}>{d.basis}</div>
              </div>
              <span style={{ color: T.sub, fontSize: 11, flex: 1, textAlign: 'center' }}>{d.from}</span>
              <span style={{ color: T.green, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, textAlign: 'right', flex: 1 }}>{d.impact}</span>
            </div>
          ))}
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>AEP Components: Loss Waterfall (GWh/yr)</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={[
              { name: 'Gross AEP', value: (metrics.newAEP * 1.08 / 1000).toFixed(1) },
              { name: 'Wake Losses', value: -(metrics.newAEP * 0.045 / 1000).toFixed(1) },
              { name: 'Electrical Losses', value: -(metrics.newAEP * 0.015 / 1000).toFixed(1) },
              { name: 'Availability Loss', value: -(metrics.newAEP * 0.02 / 1000).toFixed(1) },
              { name: 'Net AEP', value: (metrics.newAEP / 1000).toFixed(1) },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} unit=" GWh" />
              <Tooltip formatter={v => `${v} GWh`} />
              <Bar dataKey="value" name="GWh/yr" fill={T.indigo} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  function renderGridReuse() {
    const newConnCost = gridCapMW * 0.04;
    const savedCost = reuseGrid ? newConnCost * 0.85 : 0;
    const queueBenefit = reuseGrid ? gridCapMW * 0.008 : 0;
    const congestionValue = reuseGrid ? gridCapMW * 0.005 : 0;
    const total = savedCost + queueBenefit + congestionValue;
    const congestionLevels = ['Low', 'Medium', 'High', 'Critical'];
    const congestionData = congestionLevels.map((l, i) => ({
      level: l, value: total * (0.5 + i * 0.4), saved: savedCost * (0.8 + i * 0.15)
    }));
    return (
      <div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <KpiCard label="New Connection Cost Avoided" value={`$${savedCost.toFixed(1)}M`} sub="Grid reuse benefit" color={T.green} />
          <KpiCard label="Queue Position Value" value={`$${queueBenefit.toFixed(1)}M`} sub="Grid queue priority" color={T.indigo} />
          <KpiCard label="Congestion Relief" value={`$${congestionValue.toFixed(1)}M`} sub="Transmission deferral" color={T.teal} />
          <KpiCard label="Total Grid Asset Value" value={`$${total.toFixed(1)}M`} sub={reuseGrid ? 'Grid reuse ON' : 'Grid reuse OFF'} color={reuseGrid ? T.accent : T.sub} />
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>Grid Value vs Local Congestion Level ($M)</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={congestionData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="level" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={v => `$${Number(v).toFixed(1)}M`} />
              <Legend />
              <Bar dataKey="value" name="Total Grid Value $M" fill={T.indigo} radius={[3, 3, 0, 0]} />
              <Bar dataKey="saved" name="Connection Cost Saved $M" fill={T.green} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          {!reuseGrid && <div style={{ marginTop: 12, padding: 12, background: '#fff7ed', border: `1px solid ${T.amber}`, borderRadius: 6, fontSize: 12, color: T.amber }}>
            Grid reuse is OFF. Enable in sidebar to unlock ${newConnCost.toFixed(1)}M connection cost savings.
          </div>}
        </div>
      </div>
    );
  }

  function renderRevenueBridge() {
    const constructionLoss = metrics.oldRevenue * 0.5;
    const newAnnual = metrics.newRevenue;
    const oldAnnual = metrics.oldRevenue;
    const bridgeData = [
      { name: 'Current Revenue', value: oldAnnual, fill: T.sub },
      { name: 'Lost (Construction)', value: -constructionLoss, fill: T.red },
      { name: 'New PPA Revenue', value: newAnnual, fill: T.green },
      { name: 'Escalation (5yr)', value: newAnnual * (Math.pow(1 + ppaEscalation / 100, 5) - 1), fill: T.teal },
    ];
    const routeComparison = [
      { route: 'CfD Auction', price: 52, certainty: 'High', term: '15yr', risk: 'Regulatory price review', irrImpact: '+1.2ppt vs merchant' },
      { route: 'PTC (IRA US)', price: 45, certainty: 'High', term: '10yr', risk: 'Partial transfer for repower', irrImpact: '+0.8ppt vs merchant' },
      { route: 'Corporate PPA', price: newPPA, certainty: 'Medium', term: '12yr', risk: 'Offtaker credit risk', irrImpact: 'Benchmark' },
      { route: 'Merchant', price: newPPA * 0.9, certainty: 'Low', term: 'Spot', risk: 'Price volatility exposure', irrImpact: '-1.1ppt vs PPA' },
      { route: 'Hybrid (PPA + merchant)', price: newPPA * 0.95, certainty: 'Medium', term: 'Blended', risk: 'Market basis risk', irrImpact: '+0.3ppt vs merchant' },
    ];
    // 10-year revenue projection by route
    const revenueProjection = Array.from({ length: 10 }, (_, t) => ({
      year: `Y${t + 1}`,
      cfd: (metrics.newAEP * 52 / 1e6 * Math.pow(1.015, t)).toFixed(2),
      ppa: (metrics.newAEP * newPPA / 1e6 * Math.pow(1 + ppaEscalation / 100, t)).toFixed(2),
      merchant: (metrics.newAEP * newPPA * 0.9 / 1e6 * Math.pow(0.98, t) * (1 + sr(t * 7) * 0.2 - 0.1)).toFixed(2),
    }));

    // Construction period revenue detail
    const constructionPhases = [
      { phase: 'Month 1-3', oldRev: oldAnnual * 0.25, newRev: 0, status: 'Decommissioning' },
      { phase: 'Month 4-6', oldRev: oldAnnual * 0.15, newRev: 0, status: 'Civil works' },
      { phase: 'Month 7-9', oldRev: 0, newRev: 0, status: 'Installation' },
      { phase: 'Month 10-12', oldRev: 0, newRev: newAnnual * 0.25 * 0.7, status: 'Commissioning (70%)' },
      { phase: 'Post-COD', oldRev: 0, newRev: newAnnual, status: 'Full operation' },
    ];

    return (
      <div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <KpiCard label="Current Annual Revenue" value={`$${oldAnnual.toFixed(2)}M`} sub={`${existingRevMWh} $/MWh`} />
          <KpiCard label="New Annual Revenue" value={`$${newAnnual.toFixed(2)}M`} sub={`${newPPA} $/MWh PPA`} color={T.green} />
          <KpiCard label="Revenue Uplift" value={`+$${(newAnnual - oldAnnual).toFixed(2)}M/yr`} sub="Incremental annual" color={metrics.newRevenue > metrics.oldRevenue ? T.green : T.red} />
          <KpiCard label="Construction Loss" value={`-$${constructionLoss.toFixed(2)}M`} sub="6-month downtime" color={T.amber} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>Revenue Waterfall ($M/yr)</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={bridgeData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={v => `$${Number(v).toFixed(2)}M`} />
                <Bar dataKey="value" name="Revenue $M" radius={[3, 3, 0, 0]} fill={T.indigo} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>10-Year Revenue Projection by Route ($M/yr)</div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={revenueProjection}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={v => `$${v}M`} />
                <Legend />
                <Line dataKey="cfd" stroke={T.green} strokeWidth={2} name="CfD/PTC" dot={false} />
                <Line dataKey="ppa" stroke={T.indigo} strokeWidth={2} name="Corporate PPA" dot={false} />
                <Line dataKey="merchant" stroke={T.amber} strokeWidth={1} name="Merchant" dot={false} strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>Revenue Route Comparison</div>
          <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: T.navy }}>
              {['Route', 'Price $/MWh', 'Certainty', 'Term', 'Key Risk', 'IRR Impact'].map(h =>
                <th key={h} style={{ padding: '8px 10px', color: '#fff', textAlign: 'left', fontSize: 10 }}>{h}</th>)}
            </tr></thead>
            <tbody>{routeComparison.map((r, i) => (
              <tr key={r.route} style={{ background: i % 2 === 0 ? T.bg : T.card, borderBottom: `1px solid ${T.border}` }}>
                <td style={{ padding: '7px 10px', fontWeight: 700 }}>{r.route}</td>
                <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace', color: T.green }}>${typeof r.price === 'number' ? r.price.toFixed(0) : r.price}</td>
                <td style={{ padding: '7px 10px', color: r.certainty === 'High' ? T.green : r.certainty === 'Medium' ? T.amber : T.red }}>{r.certainty}</td>
                <td style={{ padding: '7px 10px' }}>{r.term}</td>
                <td style={{ padding: '7px 10px', color: T.sub, fontSize: 10 }}>{r.risk}</td>
                <td style={{ padding: '7px 10px', color: T.indigo, fontWeight: 700, fontSize: 11 }}>{r.irrImpact}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>Construction Period Revenue Schedule</div>
          <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: T.navy }}>
              {['Period', 'Old Fleet Rev $M', 'New Fleet Rev $M', 'Status'].map(h =>
                <th key={h} style={{ padding: '7px 12px', color: '#fff', textAlign: 'left', fontSize: 10 }}>{h}</th>)}
            </tr></thead>
            <tbody>{constructionPhases.map((p, i) => (
              <tr key={p.phase} style={{ background: i % 2 === 0 ? T.bg : T.card, borderBottom: `1px solid ${T.border}` }}>
                <td style={{ padding: '6px 12px', fontWeight: 700 }}>{p.phase}</td>
                <td style={{ padding: '6px 12px', fontFamily: 'JetBrains Mono, monospace', color: p.oldRev > 0 ? T.text : T.sub }}>${p.oldRev.toFixed(2)}M</td>
                <td style={{ padding: '6px 12px', fontFamily: 'JetBrains Mono, monospace', color: p.newRev > 0 ? T.green : T.sub }}>${p.newRev.toFixed(2)}M</td>
                <td style={{ padding: '6px 12px', color: T.sub }}>{p.status}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    );
  }

  function renderPermitting() {
    const reassessItems = [
      { item: 'Shadow Flicker Study', required: true, cost: 0.08, weeks: 4, standard: 'IEC 61400-11 / local 30hr/yr limit' },
      { item: 'Noise Assessment', required: true, cost: 0.12, weeks: 6, standard: 'ETSU-R-97 (UK) / TA Lärm (DE) / ISO 9613-2' },
      { item: 'Ecology Survey (birds/bats)', required: true, cost: 0.18, weeks: 12, standard: 'SNCi/Natural England/BfN guidelines' },
      { item: 'Visual Impact Assessment', required: true, cost: 0.15, weeks: 8, standard: 'Zone of Theoretical Visibility (ZTV)' },
      { item: 'Electromagnetic Interference', required: false, cost: 0.06, weeks: 3, standard: 'Ofcom/BNetzA coordination' },
      { item: 'Aviation Lighting Assessment', required: true, cost: 0.04, weeks: 2, standard: 'CAA/EASA obstacle lighting regs' },
      { item: 'Ground Vibration Study', required: false, cost: 0.05, weeks: 3, standard: 'DIN 4150-3 / BS 6472' },
      { item: 'Geotechnical Report (EIA)', required: true, cost: 0.22, weeks: 10, standard: 'Eurocode 7 / EN 1997-1' },
    ];
    const timelineData = [
      { stage: 'Pre-App', standard: 3, fastTrack: 2 },
      { stage: 'EIA Scoping', standard: 4, fastTrack: 2 },
      { stage: 'Application', standard: 6, fastTrack: 3 },
      { stage: 'Determination', standard: 9, fastTrack: 5 },
      { stage: 'Appeal Risk', standard: 6, fastTrack: 2 },
    ];
    const totalStandard = timelineData.reduce((s, d) => s + d.standard, 0);
    const totalFast = timelineData.reduce((s, d) => s + d.fastTrack, 0);
    return (
      <div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <KpiCard label="Standard Timeline" value={`${totalStandard} mo`} sub="Full planning process" color={T.amber} />
          <KpiCard label="Fast-Track Timeline" value={`${totalFast} mo`} sub="Repowering expedited" color={T.green} />
          <KpiCard label="Time Saving" value={`${totalStandard - totalFast} mo`} sub="Fast-track benefit" color={T.indigo} />
          <KpiCard label="Permit Cost Est." value={`$${reassessItems.reduce((s, r) => s + r.cost, 0).toFixed(2)}M`} sub="Total study costs" color={T.sub} />
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>Country Repowering Permit Rules</div>
          <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: T.navy }}>
              {['Country', 'Regulation', 'Timeline', 'Fast-Track', 'Revenue Route', 'Notes'].map(h =>
                <th key={h} style={{ padding: '8px 10px', color: '#fff', textAlign: 'left', fontSize: 10 }}>{h}</th>)}
            </tr></thead>
            <tbody>{PERMIT_RULES.map((r, i) => (
              <tr key={r.country} style={{ background: i % 2 === 0 ? T.bg : T.card, borderBottom: `1px solid ${T.border}` }}>
                <td style={{ padding: '7px 10px', fontWeight: 700 }}>{r.country}</td>
                <td style={{ padding: '7px 10px', color: T.indigo, fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>{r.rule}</td>
                <td style={{ padding: '7px 10px' }}>{r.timeline}</td>
                <td style={{ padding: '7px 10px', color: T.green }}>{r.fastTrack}</td>
                <td style={{ padding: '7px 10px', color: T.sub }}>{r.ppaRoute}</td>
                <td style={{ padding: '7px 10px', color: T.sub, fontSize: 10 }}>{r.notes}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>Standard vs Fast-Track Timeline (months)</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="stage" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} unit=" mo" />
                <Tooltip formatter={v => `${v} months`} />
                <Legend />
                <Bar dataKey="standard" name="Standard" fill={T.amber} radius={[3, 3, 0, 0]} />
                <Bar dataKey="fastTrack" name="Fast-Track" fill={T.green} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>Re-Assessment Requirements</div>
            <div style={{ overflowY: 'auto', maxHeight: 200 }}>
              {reassessItems.map((r, i) => (
                <div key={r.item} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: `1px solid ${T.border}`, fontSize: 11 }}>
                  <div>
                    <span style={{ fontWeight: r.required ? 600 : 400, color: r.required ? T.text : T.sub }}>{r.item}</span>
                    {r.required && <span style={{ marginLeft: 6, fontSize: 9, background: T.red, color: '#fff', borderRadius: 3, padding: '1px 5px' }}>Required</span>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>${r.cost.toFixed(2)}M · {r.weeks}wk</div>
                    <div style={{ fontSize: 9, color: T.sub }}>{r.standard}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {permitFastTrack && (
          <div style={{ padding: 14, background: '#f0fdf4', border: `1px solid ${T.green}`, borderRadius: 8, fontSize: 12 }}>
            Fast-track permit enabled. Estimated timeline reduction: 30-50%. Germany §16b modification procedure or UK sub-50MW threshold applies.
            Repowering applications are treated as modifications to existing consents in most jurisdictions — significantly reducing EIA scope.
          </div>
        )}
      </div>
    );
  }

  function renderEnvironmental() {
    const oldCount = numTurbines;
    const newCount = metrics.newTurbineCount;
    const footprintReduction = ((oldCount - newCount) / Math.max(1, oldCount) * 100).toFixed(1);
    const data = [
      { metric: 'Turbine Count', old: oldCount, new: newCount, unit: 'units' },
      { metric: 'Bird Collision Risk', old: oldCount * 1.8, new: newCount * 0.9, unit: 'rel. index' },
      { metric: 'Bat Strike Risk', old: oldCount * 2.1, new: newCount * 1.1, unit: 'rel. index' },
      { metric: 'Noise (dBA at 500m)', old: 42.5, new: 41.2, unit: 'dB(A)' },
      { metric: 'Visual Impact Points', old: oldCount * 0.7, new: newCount * 0.85, unit: 'index' },
      { metric: 'Land Footprint (ha)', old: oldCount * 0.15, new: newCount * 0.22, unit: 'ha' },
      { metric: 'GHG Lifecycle (gCO2/kWh)', old: 9.2, new: 7.8, unit: 'gCO2/kWh' },
      { metric: 'Water Use (m³/MWh)', old: 0.005, new: 0.004, unit: 'm³/MWh' },
      { metric: 'Steel Material Intensity', old: oldCount * 120, new: newCount * 180, unit: 'tonnes' },
    ];
    const lcaData = [
      { phase: 'Manufacturing', old: 4.2, new: 3.1 },
      { phase: 'Transport', old: 1.1, new: 0.9 },
      { phase: 'Installation', old: 0.8, new: 0.6 },
      { phase: 'O&M (20yr)', old: 2.1, new: 1.5 },
      { phase: 'Decommission', old: 0.6, new: 0.5 },
      { phase: 'Recycling Credit', old: -0.6, new: -0.8 },
    ];
    const mitigationMeasures = [
      { measure: 'Radar-activated lighting', impact: 'Reduce bird/bat fatalities 70%', cost: '$0.15M', timeline: 'Pre-construction' },
      { measure: 'Curtailment algorithm (bats)', impact: 'Reduce bat mortality 50-90%', cost: '$0.08M', timeline: 'Post-COD' },
      { measure: 'Noise scheduling (night)', impact: 'Reduce night-time noise 3 dB(A)', cost: 'Software', timeline: 'Post-COD' },
      { measure: 'Habitat restoration', impact: 'Net biodiversity gain >10%', cost: '$0.25M', timeline: 'Construction' },
      { measure: 'Shadow flicker sensor', impact: 'Automated turbine stop <30hr/yr', cost: '$0.04M', timeline: 'Pre-construction' },
    ];
    return (
      <div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <KpiCard label="Turbine Reduction" value={`-${footprintReduction}%`} sub="Fewer units, larger" color={T.green} />
          <KpiCard label="CO₂ Lifecycle Saving" value="-15%" sub="Per kWh generated" color={T.teal} />
          <KpiCard label="Net CO₂ Benefit" value={`${(metrics.co2Saved / 1000).toFixed(1)} kt/yr`} sub="Annual incremental" color={T.green} />
          <KpiCard label="20yr CO₂ Avoided" value={`${(metrics.co2Saved * 20 / 1e6).toFixed(2)} Mt`} sub="Cumulative benefit" color={T.indigo} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>Environmental Impact: Old vs New Fleet</div>
            <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: T.navy }}>
                {['Metric', 'Old', 'New', 'Unit', 'Δ'].map(h =>
                  <th key={h} style={{ padding: '7px 10px', color: '#fff', textAlign: 'left', fontSize: 10 }}>{h}</th>)}
              </tr></thead>
              <tbody>{data.map((d, i) => {
                const change = ((d.new - d.old) / Math.max(0.001, Math.abs(d.old)) * 100).toFixed(1);
                const improved = Number(change) < 0;
                return (
                  <tr key={d.metric} style={{ background: i % 2 === 0 ? T.bg : T.card, borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '6px 10px', fontWeight: 600, fontSize: 11 }}>{d.metric}</td>
                    <td style={{ padding: '6px 10px', fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>{typeof d.old === 'number' ? d.old.toFixed(1) : d.old}</td>
                    <td style={{ padding: '6px 10px', fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>{typeof d.new === 'number' ? d.new.toFixed(1) : d.new}</td>
                    <td style={{ padding: '6px 10px', color: T.sub, fontSize: 10 }}>{d.unit}</td>
                    <td style={{ padding: '6px 10px', color: improved ? T.green : T.red, fontWeight: 700, fontSize: 11 }}>{change}%</td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>Lifecycle GHG by Phase (gCO₂/kWh)</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={lcaData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="phase" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={v => `${v} gCO₂/kWh`} />
                <Legend />
                <Bar dataKey="old" name="Old Fleet" fill={T.sub} radius={[3, 3, 0, 0]} />
                <Bar dataKey="new" name="New Fleet" fill={T.green} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>Environmental Mitigation Measures</div>
          <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: T.navy }}>
              {['Measure', 'Environmental Impact', 'Capex', 'When'].map(h =>
                <th key={h} style={{ padding: '7px 12px', color: '#fff', textAlign: 'left', fontSize: 10 }}>{h}</th>)}
            </tr></thead>
            <tbody>{mitigationMeasures.map((m, i) => (
              <tr key={m.measure} style={{ background: i % 2 === 0 ? T.bg : T.card, borderBottom: `1px solid ${T.border}` }}>
                <td style={{ padding: '6px 12px', fontWeight: 600 }}>{m.measure}</td>
                <td style={{ padding: '6px 12px', color: T.green }}>{m.impact}</td>
                <td style={{ padding: '6px 12px', fontFamily: 'JetBrains Mono, monospace' }}>{m.cost}</td>
                <td style={{ padding: '6px 12px', color: T.sub }}>{m.timeline}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    );
  }

  function renderConstruction() {
    const phases = [
      { phase: 'Pre-Development', month: '0-3', activities: 'Site survey, foundation assessment, geotech, noise study', cost: 0.8, risk: 'Low' },
      { phase: 'Permitting', month: '3-15', activities: `${permitFastTrack ? 'Fast-track' : 'Standard'} planning application, EIA, grid application`, cost: 1.2, risk: 'Medium' },
      { phase: 'Procurement', month: '12-18', activities: 'Turbine order placed (18-month lead), crane booking, BoP EPC tender', cost: 2.1, risk: 'Medium' },
      { phase: 'Decommissioning', month: '18-21', activities: 'Old turbine removal, foundation break-out, scrap recycling', cost: metrics.decomCostM, risk: 'Low' },
      { phase: 'Civil Works', month: '20-24', activities: 'Foundation construction/upgrade, access roads, cable laying', cost: metrics.totalInvestM * 0.15, risk: 'Medium' },
      { phase: 'Installation', month: '24-27', activities: 'Crane mobilisation, turbine erection (key cost driver), commissioning', cost: metrics.totalInvestM * 0.12, risk: 'High' },
      { phase: 'Grid Connection', month: '26-28', activities: 'Substation works, energisation, export cable commissioning', cost: reuseGrid ? 0.5 : metrics.gridCostM, risk: 'Medium' },
      { phase: 'COD & Handover', month: '28', activities: 'Commercial operation, warranty handover, O&M transition', cost: 0.3, risk: 'Low' },
    ];
    const craneCosts = [
      { approach: 'Simultaneous (all cranes)', cranes: Math.ceil(metrics.newTurbineCount / 5), mobilCost: metrics.newTurbineCount * 0.08, duration: '3 months', risk: 'Crane availability' },
      { approach: 'Phased (2 crews)', cranes: 2, mobilCost: metrics.newTurbineCount * 0.06, duration: '5 months', risk: 'Extended downtime' },
      { approach: 'Sequential (1 crane)', cranes: 1, mobilCost: metrics.newTurbineCount * 0.045, duration: '9 months', risk: 'Revenue loss extended' },
    ];
    const weatherWindowData = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => ({
      month: m,
      workable: Math.round((0.6 + sr(i * 7) * 0.3) * (i >= 4 && i <= 8 ? 1.2 : 0.85) * 22),
      windSpeed: (sr(i * 13) * 4 + 6).toFixed(1),
    }));
    const totalCost = phases.reduce((s, p) => s + (typeof p.cost === 'number' ? p.cost : 0), 0);
    return (
      <div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <KpiCard label="Total Programme" value="28 months" sub="COD to FID" color={T.indigo} />
          <KpiCard label="Old Turbines" value={numTurbines} sub="To be decommissioned" color={T.amber} />
          <KpiCard label="New Turbines" value={metrics.newTurbineCount} sub="To be installed" color={T.green} />
          <KpiCard label="Programme Cost" value={`$${totalCost.toFixed(1)}M`} sub="Ex. turbine supply" color={T.sub} />
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>Repowering Construction Programme</div>
          <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: T.navy }}>
              {['Phase', 'Months', 'Key Activities', 'Cost $M', 'Risk'].map(h =>
                <th key={h} style={{ padding: '8px 12px', color: '#fff', textAlign: 'left', fontSize: 11 }}>{h}</th>)}
            </tr></thead>
            <tbody>{phases.map((p, i) => (
              <tr key={p.phase} style={{ background: i % 2 === 0 ? T.bg : T.card, borderBottom: `1px solid ${T.border}` }}>
                <td style={{ padding: '7px 12px', fontWeight: 600 }}>{p.phase}</td>
                <td style={{ padding: '7px 12px', fontFamily: 'JetBrains Mono, monospace', color: T.indigo }}>{p.month}</td>
                <td style={{ padding: '7px 12px', color: T.sub, fontSize: 11 }}>{p.activities}</td>
                <td style={{ padding: '7px 12px', fontFamily: 'JetBrains Mono, monospace' }}>${typeof p.cost === 'number' ? p.cost.toFixed(1) : p.cost}M</td>
                <td style={{ padding: '7px 12px' }}><span style={{ background: p.risk === 'High' ? T.red : p.risk === 'Medium' ? T.amber : T.green, color: '#fff', borderRadius: 4, padding: '2px 7px', fontSize: 10 }}>{p.risk}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>Crane Strategy Comparison</div>
            <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: T.navy }}>
                {['Approach', 'Cranes', 'Mob. Cost $M', 'Duration', 'Risk'].map(h =>
                  <th key={h} style={{ padding: '6px 8px', color: '#fff', fontSize: 10 }}>{h}</th>)}
              </tr></thead>
              <tbody>{craneCosts.map((c, i) => (
                <tr key={c.approach} style={{ background: i % 2 === 0 ? T.bg : T.card, borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '5px 8px', fontWeight: i === 1 ? 700 : 400, fontSize: 10 }}>{c.approach}</td>
                  <td style={{ padding: '5px 8px', textAlign: 'center', fontFamily: 'JetBrains Mono, monospace' }}>{c.cranes}</td>
                  <td style={{ padding: '5px 8px', fontFamily: 'JetBrains Mono, monospace', color: T.indigo }}>${c.mobilCost.toFixed(1)}M</td>
                  <td style={{ padding: '5px 8px' }}>{c.duration}</td>
                  <td style={{ padding: '5px 8px', color: T.sub, fontSize: 10 }}>{c.risk}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>Workable Days per Month</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={weatherWindowData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="month" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="workable" name="Workable days" fill={T.indigo} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{ padding: 12, background: '#fffbeb', border: `1px solid ${T.amber}`, borderRadius: 6, fontSize: 11, color: T.amber }}>
          Key Cost Driver: Crane mobilisation for {metrics.newTurbineCount} × {(newRatingKw / 1000).toFixed(1)}MW turbines.
          Phased approach (2 crews) recommended — reduces crane standby by 25% vs simultaneous, avoids extended single-season downtime vs sequential.
          Optimal installation window: May–September (highest workable days, calmer winds for high-lift operations).
        </div>
      </div>
    );
  }

  function renderFinancialModel() {
    const { newCFsArr, dr, totalInvestM } = metrics;
    const debtPct = 1 - equityPct / 100;
    const debtCost = 0.045;
    const modelYears = Math.min(newProjectLife, 20);
    const annualRows = Array.from({ length: modelYears }, (_, t) => {
      const rev = metrics.newRevenue * Math.pow(1 + ppaEscalation / 100, t);
      const opex = metrics.newCapMW * 0.022 * Math.pow(1.03, t);
      const depn = totalInvestM / newProjectLife;
      const ebitda = rev - opex;
      const ebit = ebitda - depn;
      const interest = totalInvestM * debtPct * debtCost * Math.pow(0.93, t);
      const taxable = Math.max(0, ebit - interest);
      const tax = taxable * taxRate / 100;
      const fcf = ebitda - interest - tax;
      const dscr = interest > 0 ? (ebitda / (interest + totalInvestM * debtPct / newProjectLife)) : 99;
      return { yr: `Y${t + 1}`, rev: rev.toFixed(2), opex: opex.toFixed(2), ebitda: ebitda.toFixed(2), fcf: fcf.toFixed(2), dscr: dscr.toFixed(2) };
    });
    const chartData = annualRows.slice(0, 12).map(r => ({ yr: r.yr, EBITDA: Number(r.ebitda), FCF: Number(r.fcf) }));
    return (
      <div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>20-Year Cash Flow Model ($M)</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="yr" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={v => `$${Number(v).toFixed(2)}M`} />
              <Legend />
              <Area dataKey="EBITDA" stroke={T.indigo} fill={T.indigo} fillOpacity={0.15} name="EBITDA $M" />
              <Area dataKey="FCF" stroke={T.green} fill={T.green} fillOpacity={0.15} name="Free Cash Flow $M" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: T.navy }}>
                {['Year', 'Revenue $M', 'OPEX $M', 'EBITDA $M', 'FCF $M', 'DSCR'].map(h =>
                  <th key={h} style={{ padding: '7px 10px', color: '#fff', textAlign: 'right', fontSize: 10 }}>{h}</th>)}
              </tr></thead>
              <tbody>{annualRows.map((r, i) => (
                <tr key={r.yr} style={{ background: i % 2 === 0 ? T.bg : T.card, borderBottom: `1px solid ${T.border}` }}>
                  {[r.yr, r.rev, r.opex, r.ebitda, r.fcf, r.dscr].map((v, j) => (
                    <td key={j} style={{ padding: '5px 10px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: j >= 3 && Number(v) < 0 ? T.red : j >= 3 && Number(v) > 0 ? T.green : T.text }}>{v}</td>
                  ))}
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>DSCR Schedule</div>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={annualRows.slice(0, 15).map(r => ({ yr: r.yr, dscr: Number(r.dscr) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="yr" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} domain={[0, 4]} />
                <Tooltip formatter={v => `${Number(v).toFixed(2)}x`} />
                <Line dataKey="dscr" stroke={T.indigo} strokeWidth={2} name="DSCR" dot={false} />
              </LineChart>
            </ResponsiveContainer>
            <div style={{ fontSize: 11, color: T.sub, marginTop: 8 }}>Minimum DSCR covenant: typically 1.20x for project finance</div>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>Financing Structure Summary</div>
            {[
              { label: 'Total Project Cost', value: `$${totalInvestM.toFixed(1)}M` },
              { label: 'Equity Contribution', value: `$${(totalInvestM * equityPct / 100).toFixed(1)}M (${equityPct}%)` },
              { label: 'Debt Financing', value: `$${(totalInvestM * (100 - equityPct) / 100).toFixed(1)}M (${100 - equityPct}%)` },
              { label: 'Assumed Debt Cost', value: '4.5% p.a.' },
              { label: 'Debt Tenor', value: `${Math.min(newProjectLife, 18)} years` },
              { label: 'Annual Debt Service', value: `$${(totalInvestM * (1 - equityPct / 100) * 0.045 / (1 - Math.pow(1.045, -Math.min(newProjectLife, 18)))).toFixed(2)}M` },
              { label: 'Equity IRR', value: `${(metrics.incIRR * (1 + (1 - equityPct / 100) * 0.3)).toFixed(1)}%` },
              { label: 'Corporate Tax Rate', value: `${taxRate}%` },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: `1px solid ${T.border}`, fontSize: 11 }}>
                <span style={{ color: T.sub }}>{label}</span>
                <span style={{ fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: T.text }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function renderIRRAnalysis() {
    const { incIRR, oldNPV, totalInvestM, incrementalNPV } = metrics;
    const bridgeItems = [
      { name: 'Baseline NPV (continue)', value: oldNPV },
      { name: 'Incremental CAPEX', value: -totalInvestM },
      { name: 'Incremental Revenue PV', value: metrics.newNPV * 0.7 },
      { name: 'Tax Shield PV', value: totalInvestM * (taxRate / 100) * 0.4 },
      { name: 'Decom & Scrap Net', value: -(metrics.decomCostM - metrics.scrapValueM) },
      { name: 'Final Repower NPV', value: incrementalNPV },
    ];
    const minPPAData = Array.from({ length: 10 }, (_, i) => {
      const pp = 28 + i * 6;
      const rev = metrics.newAEP * pp / 1e6;
      const cfs = [-totalInvestM * 0.7, -totalInvestM * 0.3,
        ...Array.from({ length: newProjectLife }, (_, t) => rev * Math.pow(1 + ppaEscalation / 100, t) * (1 - taxRate / 100) - metrics.newCapMW * 0.022 * Math.pow(1.03, t))];
      return { ppa: `$${pp}`, npv: calcNPV(cfs, metrics.dr).toFixed(1), irr: (calcIRR(cfs) * 100).toFixed(1) };
    });
    return (
      <div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <KpiCard label="Incremental IRR" value={`${incIRR.toFixed(1)}%`} sub="Repower vs baseline" color={incIRR >= 10 ? T.green : T.amber} />
          <KpiCard label="Hurdle Rate" value={`${discountRate.toFixed(1)}%`} sub="WACC assumption" />
          <KpiCard label="IRR Spread" value={`+${(incIRR - discountRate).toFixed(1)} ppt`} sub="Above hurdle" color={incIRR > discountRate ? T.green : T.red} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>IRR Bridge ($M NPV Components)</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={bridgeItems}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 8 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={v => `$${Number(v).toFixed(1)}M`} />
                <Bar dataKey="value" name="NPV $M" radius={[3, 3, 0, 0]} fill={T.indigo} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>Min PPA Price Breakeven</div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={minPPAData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="ppa" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line dataKey="npv" stroke={T.green} dot={false} strokeWidth={2} name="NPV $M" />
                <Line dataKey="irr" stroke={T.indigo} dot={false} strokeWidth={2} name="IRR %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginTop: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>Optimal Repowering Timing — NPV vs Delay</div>
          <div style={{ fontSize: 11, color: T.sub, marginBottom: 12 }}>
            Delaying repowering by 1-5 years trades current old-fleet revenue against future technology improvements and lower CAPEX. The NPV of delay
            must exceed the present value of lost incremental revenue in the interim.
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={Array.from({ length: 6 }, (_, d) => {
              const delayedNPV = metrics.incrementalNPV * Math.pow(1 / (1 + metrics.dr), d) + metrics.oldRevenue * d * 0.7;
              return { delay: `+${d}yr`, npv: delayedNPV.toFixed(1) };
            })}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="delay" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={v => `$${v}M`} />
              <Line dataKey="npv" stroke={T.accent} strokeWidth={2} name="Delay-adjusted NPV $M" dot={true} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  function renderPolicy() {
    const policies = [
      { country: 'Germany', policy: 'EEG 2023 Repowering Bonus', detail: '+€2/MWh on auction bid for repowering projects', status: 'Active', taxonomy: 'EU Taxonomy Art.10 eligible' },
      { country: 'UK', policy: 'Contracts for Difference AR5/AR6', detail: 'Sub-50MW repowering below NSIP threshold; strike price £52/MWh', status: 'Active', taxonomy: 'TCFD aligned, FCA SDR' },
      { country: 'USA', policy: 'IRA §45 PTC Transfer', detail: '80% PTC value if ≥5% new nameplate capacity added; §48E ITC alt.', status: 'Active', taxonomy: 'N/A (not SFDR)' },
      { country: 'EU', policy: 'EU Taxonomy Art.10 Climate Mitigation', detail: 'Repowering explicitly qualifies; DNSH assessment required', status: 'Active', taxonomy: 'SFDR Art.9 eligible' },
      { country: 'Denmark', policy: 'Simplified Repowering Procedure', detail: 'Up to 4× capacity increase with simplified hearing', status: 'Active', taxonomy: 'EU Taxonomy aligned' },
      { country: 'Spain', policy: 'REER Auction Repowering Priority', detail: 'Dedicated repowering tranche in REER auction; price €55/MWh', status: 'Active', taxonomy: 'EU Taxonomy aligned' },
      { country: 'France', policy: 'L.211-2-1 Simplification', detail: 'Repowering ≤ same height exempted from new environmental permit', status: 'Active', taxonomy: 'EU Taxonomy aligned' },
      { country: 'Netherlands', policy: 'Crisis & Herstelwet (Chw)', detail: 'Expedited development consent; SDE++ for repowered capacity', status: 'Active', taxonomy: 'EU Taxonomy aligned' },
    ];
    const taxonomyCriteria = [
      { criterion: 'Substantial Contribution (Art.10)', status: 'Qualifies', detail: 'Onshore wind repowering unambiguously qualifies as climate mitigation' },
      { criterion: 'Do No Significant Harm — Climate Adaptation', status: 'Assessment', detail: 'Physical climate risk assessment required for site; typically straightforward' },
      { criterion: 'DNSH — Water & Marine', status: 'Qualifies', detail: 'No water abstraction; cable routing may require marine DNSH check for offshore' },
      { criterion: 'DNSH — Circular Economy', status: 'Assessment', detail: 'Blade recycling plan required; >95% turbine recyclable by mass' },
      { criterion: 'DNSH — Pollution Prevention', status: 'Qualifies', detail: 'No hazardous substances in new turbines; PCB-free transformers required' },
      { criterion: 'DNSH — Biodiversity', status: 'Assessment', detail: 'Habitat assessment, bat/bird survey, mitigation plan to demonstrate no net loss' },
      { criterion: 'Minimum Social Safeguards (Art.18)', status: 'Qualifies', detail: 'OECD MNE Guidelines compliance; workers rights; community benefit fund' },
    ];
    const subsidyValueData = policies.slice(0, 6).map((p, i) => ({
      country: p.country,
      subsidy: 45 + sr(i * 17) * 20,
      merchantFloor: 35 + sr(i * 23) * 15,
    }));
    return (
      <div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>Policy Support by Country</div>
          <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: T.navy }}>
              {['Country', 'Policy', 'Detail', 'Status', 'Taxonomy'].map(h =>
                <th key={h} style={{ padding: '8px 10px', color: '#fff', textAlign: 'left', fontSize: 10 }}>{h}</th>)}
            </tr></thead>
            <tbody>{policies.map((p, i) => (
              <tr key={p.country} style={{ background: i % 2 === 0 ? T.bg : T.card, borderBottom: `1px solid ${T.border}` }}>
                <td style={{ padding: '7px 10px', fontWeight: 700 }}>{p.country}</td>
                <td style={{ padding: '7px 10px', color: T.indigo, fontWeight: 600, fontSize: 10 }}>{p.policy}</td>
                <td style={{ padding: '7px 10px', color: T.sub, fontSize: 10 }}>{p.detail}</td>
                <td style={{ padding: '7px 10px' }}><span style={{ background: T.green, color: '#fff', borderRadius: 4, padding: '2px 6px', fontSize: 10 }}>{p.status}</span></td>
                <td style={{ padding: '7px 10px', color: T.teal, fontSize: 10 }}>{p.taxonomy}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>Auction Price vs Merchant Floor $/MWh</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={subsidyValueData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="country" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} unit=" $" />
                <Tooltip formatter={v => `$${Number(v).toFixed(0)}/MWh`} />
                <Legend />
                <Bar dataKey="subsidy" name="Auction/CfD Price" fill={T.indigo} radius={[3, 3, 0, 0]} />
                <Bar dataKey="merchantFloor" name="Merchant Floor" fill={T.sub} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>EU Taxonomy Eligibility Checklist</div>
            {taxonomyCriteria.map((c, i) => (
              <div key={c.criterion} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '5px 0', borderBottom: `1px solid ${T.border}` }}>
                <span style={{ fontSize: 13, color: c.status === 'Qualifies' ? T.green : T.amber, flexShrink: 0, marginTop: 1 }}>{c.status === 'Qualifies' ? '✓' : '~'}</span>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600 }}>{c.criterion}</div>
                  <div style={{ fontSize: 10, color: T.sub }}>{c.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function renderCaseStudies() {
    return (
      <div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>Global Repowering Transaction Database (8 Cases)</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: T.navy }}>
                {['Project', 'Country', 'Old MW', 'New MW', 'Old Units', 'New Units', 'AEP Uplift', 'IRR Achieved', 'Year', 'Key Lesson'].map(h =>
                  <th key={h} style={{ padding: '7px 9px', color: '#fff', textAlign: 'left', fontSize: 10 }}>{h}</th>)}
              </tr></thead>
              <tbody>{CASE_STUDIES.map((c, i) => (
                <tr key={c.name} style={{ background: i % 2 === 0 ? T.bg : T.card, borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '7px 9px', fontWeight: 700 }}>{c.name}</td>
                  <td style={{ padding: '7px 9px' }}>{c.country}</td>
                  <td style={{ padding: '7px 9px', fontFamily: 'JetBrains Mono, monospace' }}>{c.oldMW}</td>
                  <td style={{ padding: '7px 9px', fontFamily: 'JetBrains Mono, monospace', color: T.green, fontWeight: 700 }}>{c.newMW}</td>
                  <td style={{ padding: '7px 9px', fontFamily: 'JetBrains Mono, monospace' }}>{c.turbineOld}</td>
                  <td style={{ padding: '7px 9px', fontFamily: 'JetBrains Mono, monospace' }}>{c.turbineNew}</td>
                  <td style={{ padding: '7px 9px', color: T.teal, fontWeight: 700 }}>+{c.aepUplift}%</td>
                  <td style={{ padding: '7px 9px', color: T.indigo, fontWeight: 700 }}>{c.irr}%</td>
                  <td style={{ padding: '7px 9px' }}>{c.yr}</td>
                  <td style={{ padding: '7px 9px', color: T.sub, fontSize: 10 }}>{c.lesson}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>Comparable IRR by Country</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={[...CASE_STUDIES].sort((a, b) => b.irr - a.irr)}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 10 }} unit="%" />
              <Tooltip formatter={v => `${v}%`} />
              <Bar dataKey="irr" name="IRR %" fill={T.indigo} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  function renderRiskAnalysis() {
    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>Risk Register (Probability × Impact)</div>
            <ResponsiveContainer width="100%" height={240}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="prob" name="Probability" unit="%" tick={{ fontSize: 10 }} label={{ value: 'Probability %', position: 'bottom', fontSize: 10 }} />
                <YAxis dataKey="impact" name="Impact" tick={{ fontSize: 10 }} label={{ value: 'Impact', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ payload }) => payload && payload[0] ? (
                  <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: '6px 10px', fontSize: 11 }}>
                    <div style={{ fontWeight: 700 }}>{RISKS[payload[0]?.payload?.idx]?.risk}</div>
                    <div>P: {payload[0]?.payload?.prob}% | Impact: {payload[0]?.payload?.impact}/10</div>
                  </div>
                ) : null} />
                <Scatter data={RISKS.map((r, i) => ({ ...r, idx: i, prob: r.prob, impact: r.impact }))}
                  fill={T.indigo} opacity={0.7} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>Top Risks by Severity (P×I)</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={[...RISKS].sort((a, b) => (b.prob * b.impact) - (a.prob * a.impact)).slice(0, 8)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="risk" type="category" tick={{ fontSize: 9 }} width={120} />
                <Tooltip />
                <Bar dataKey={d => d.prob * d.impact / 100} name="Severity" fill={T.red} radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>Risk Register Detail</div>
          <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: T.navy }}>
              {['Risk', 'Category', 'Prob %', 'Impact /10', 'Severity', 'Mitigation'].map(h =>
                <th key={h} style={{ padding: '7px 10px', color: '#fff', textAlign: 'left', fontSize: 10 }}>{h}</th>)}
            </tr></thead>
            <tbody>{[...RISKS].sort((a, b) => (b.prob * b.impact) - (a.prob * a.impact)).map((r, i) => (
              <tr key={r.risk} style={{ background: i % 2 === 0 ? T.bg : T.card, borderBottom: `1px solid ${T.border}` }}>
                <td style={{ padding: '6px 10px', fontWeight: 600 }}>{r.risk}</td>
                <td style={{ padding: '6px 10px', color: T.sub }}>{r.category}</td>
                <td style={{ padding: '6px 10px', fontFamily: 'JetBrains Mono, monospace' }}>{r.prob}%</td>
                <td style={{ padding: '6px 10px', fontFamily: 'JetBrains Mono, monospace' }}>{r.impact}</td>
                <td style={{ padding: '6px 10px', fontFamily: 'JetBrains Mono, monospace', color: r.prob * r.impact > 200 ? T.red : r.prob * r.impact > 100 ? T.amber : T.green, fontWeight: 700 }}>{(r.prob * r.impact / 100).toFixed(1)}</td>
                <td style={{ padding: '6px 10px', color: T.sub, fontSize: 10 }}>{r.mitigation}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    );
  }

  function renderTechRoadmap() {
    const hybrids = [
      { option: 'BESS Co-location', addMW: 50, addCapex: 60, benefit: 'Frequency response revenue + curtailment recovery', lcoeImpact: '-$3/MWh blended', irr: '+1.8ppt' },
      { option: 'Solar PV (agri-PV)', addMW: 20, addCapex: 22, benefit: 'Shared grid connection utilisation, land income', lcoeImpact: '-$1.5/MWh blended', irr: '+0.9ppt' },
      { option: 'Green Hydrogen', addMW: 10, addCapex: 45, benefit: 'Offtake during curtailment periods, H2 revenue', lcoeImpact: 'Site-specific', irr: 'TBD' },
      { option: 'Digital Twin', addMW: 0, addCapex: 2.5, benefit: 'Predictive maintenance, +0.5% AEP, -8% O&M', lcoeImpact: '-$2/MWh', irr: '+0.4ppt' },
      { option: 'EV Charging Hub', addMW: 0, addCapex: 1.2, benefit: 'Local demand anchor, reduced curtailment, community goodwill', lcoeImpact: 'Neutral', irr: '+0.1ppt' },
    ];
    const lcoeTrajectory = Array.from({ length: 7 }, (_, i) => ({
      year: 2024 + i,
      repower: Math.max(28, 42 - i * 2.1),
      greenfield: Math.max(30, 47 - i * 1.9),
      lifeExtension: Math.max(32, 50 - i * 1.5),
    }));
    const oems = [
      { oem: 'Vestas', model: 'V236-15.0', rating: 15, hub: 149, rotor: 236, cf: 48, avail: 2025 },
      { oem: 'Siemens Gamesa', model: 'SG 7.0-170', rating: 7, hub: 130, rotor: 170, cf: 43, avail: 2024 },
      { oem: 'GE Vernova', model: 'Cypress 6.0-164', rating: 6, hub: 140, rotor: 164, cf: 42, avail: 2024 },
      { oem: 'Nordex', model: 'N175/6.X', rating: 6.6, hub: 134, rotor: 175, cf: 44, avail: 2025 },
      { oem: 'Enercon', model: 'E-175 EP5', rating: 6, hub: 131, rotor: 175, cf: 43, avail: 2024 },
      { oem: 'Windey', model: 'WH175-6.25', rating: 6.25, hub: 130, rotor: 175, cf: 42, avail: 2025 },
    ];
    return (
      <div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>Next-Generation Turbine Roadmap</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: T.navy }}>
                {['Generation', 'Rating MW', 'Hub Height m', 'Rotor m', 'Est. CF %', 'LCOE $/MWh', 'Available'].map(h =>
                  <th key={h} style={{ padding: '8px 12px', color: '#fff', textAlign: 'left', fontSize: 11 }}>{h}</th>)}
              </tr></thead>
              <tbody>{TECH_ROADMAP.map((t, i) => (
                <tr key={t.gen} style={{ background: i % 2 === 0 ? T.bg : T.card, borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '7px 12px', fontWeight: 700 }}>{t.gen}</td>
                  <td style={{ padding: '7px 12px', fontFamily: 'JetBrains Mono, monospace' }}>{t.rating}</td>
                  <td style={{ padding: '7px 12px', fontFamily: 'JetBrains Mono, monospace' }}>{t.hub}</td>
                  <td style={{ padding: '7px 12px', fontFamily: 'JetBrains Mono, monospace' }}>{t.rotor}</td>
                  <td style={{ padding: '7px 12px', color: T.green, fontWeight: 700 }}>{t.cf}%</td>
                  <td style={{ padding: '7px 12px', fontFamily: 'JetBrains Mono, monospace', color: T.indigo }}>${t.lcoe}</td>
                  <td style={{ padding: '7px 12px' }}><span style={{ background: t.avail ? T.green : T.sub, color: '#fff', borderRadius: 4, padding: '2px 6px', fontSize: 10 }}>{t.avail ? 'Now' : 'Pipeline'}</span></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>LCOE Trajectory 2024–2030 ($/MWh)</div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={lcoeTrajectory}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} unit="$" />
                <Tooltip formatter={v => `$${Number(v).toFixed(0)}/MWh`} />
                <Legend />
                <Line dataKey="repower" stroke={T.indigo} strokeWidth={2} name="Repowering" dot={false} />
                <Line dataKey="greenfield" stroke={T.amber} strokeWidth={2} name="Greenfield" dot={false} />
                <Line dataKey="lifeExtension" stroke={T.sub} strokeWidth={2} name="Life Extension" dot={false} strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>Leading OEM Repowering Models</div>
            <div style={{ overflowY: 'auto', maxHeight: 200 }}>
              <table style={{ width: '100%', fontSize: 10, borderCollapse: 'collapse' }}>
                <thead><tr style={{ background: T.navy }}>
                  {['OEM', 'Model', 'MW', 'Rotor m', 'CF%', 'Avail'].map(h =>
                    <th key={h} style={{ padding: '5px 8px', color: '#fff' }}>{h}</th>)}
                </tr></thead>
                <tbody>{oems.map((o, i) => (
                  <tr key={o.oem} style={{ background: i % 2 === 0 ? T.bg : T.card, borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '5px 8px', fontWeight: 700 }}>{o.oem}</td>
                    <td style={{ padding: '5px 8px', fontFamily: 'JetBrains Mono, monospace', fontSize: 9 }}>{o.model}</td>
                    <td style={{ padding: '5px 8px' }}>{o.rating}</td>
                    <td style={{ padding: '5px 8px' }}>{o.rotor}</td>
                    <td style={{ padding: '5px 8px', color: T.green, fontWeight: 700 }}>{o.cf}%</td>
                    <td style={{ padding: '5px 8px' }}>{o.avail}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>Hybridisation Options at Repowered Site</div>
          <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: T.navy }}>
              {['Option', 'Add. Capacity', 'Add. Capex $M', 'Strategic Benefit', 'LCOE Impact', 'IRR Impact'].map(h =>
                <th key={h} style={{ padding: '8px 12px', color: '#fff', textAlign: 'left', fontSize: 10 }}>{h}</th>)}
            </tr></thead>
            <tbody>{hybrids.map((h, i) => (
              <tr key={h.option} style={{ background: i % 2 === 0 ? T.bg : T.card, borderBottom: `1px solid ${T.border}` }}>
                <td style={{ padding: '7px 12px', fontWeight: 700 }}>{h.option}</td>
                <td style={{ padding: '7px 12px' }}>{h.addMW > 0 ? `${h.addMW}MW` : 'N/A'}</td>
                <td style={{ padding: '7px 12px', fontFamily: 'JetBrains Mono, monospace' }}>${h.addCapex}M</td>
                <td style={{ padding: '7px 12px', color: T.sub, fontSize: 10 }}>{h.benefit}</td>
                <td style={{ padding: '7px 12px', color: T.green, fontWeight: 700 }}>{h.lcoeImpact}</td>
                <td style={{ padding: '7px 12px', color: T.indigo, fontWeight: 700 }}>{h.irr}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    );
  }

  function renderDecisionSummary() {
    const { incIRR, incrementalNPV, oldNPV, newNPV, totalInvestM, lcoeNew, decision } = metrics;
    const options = [
      { name: 'Full Repower', npv: incrementalNPV, irr: incIRR, capex: totalInvestM, lcoe: lcoeNew, permit: permitFastTrack ? 'Fast-track' : 'Standard', feasibility: incIRR > 8 ? 'High' : 'Medium' },
      { name: 'Life Extension (10yr)', npv: oldNPV * 0.6, irr: incIRR * 0.55, capex: totalInvestM * 0.12, lcoe: lcoeNew * 1.2, permit: 'Recertification', feasibility: 'High' },
      { name: 'Decommission', npv: metrics.scrapValueM * 0.8, irr: 0, capex: metrics.decomCostM, lcoe: 0, permit: 'None required', feasibility: 'High' },
    ];
    const sensitivityData = [
      { param: 'PPA +$10/MWh', impact: (incIRR * 0.22).toFixed(1) },
      { param: 'CAPEX -10%', impact: (incIRR * 0.12).toFixed(1) },
      { param: 'CF +3ppt', impact: (incIRR * 0.14).toFixed(1) },
      { param: 'WACC +2%', impact: -(incIRR * 0.1).toFixed(1) },
      { param: 'Permit +12mo', impact: -(incIRR * 0.06).toFixed(1) },
      { param: 'CAPEX +10%', impact: -(incIRR * 0.12).toFixed(1) },
    ];
    return (
      <div>
        <div style={{ background: T.card, border: `2px solid ${decisionColor}`, borderRadius: 10, padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: T.sub, marginBottom: 6 }}>INVESTMENT COMMITTEE RECOMMENDATION</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: decisionColor, marginBottom: 8 }}>{decision}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              { l: 'Incremental IRR', v: `${incIRR.toFixed(1)}%` },
              { l: 'Incremental NPV', v: `$${incrementalNPV.toFixed(1)}M` },
              { l: 'Total Capex', v: `$${totalInvestM.toFixed(1)}M` },
              { l: 'New LCOE', v: `$${lcoeNew.toFixed(1)}/MWh` },
            ].map(({ l, v }) => (
              <div key={l}>
                <div style={{ fontSize: 10, color: T.sub }}>{l}</div>
                <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: T.text }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>Option Comparison</div>
            <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: T.navy }}>
                {['Option', 'NPV $M', 'IRR %', 'Capex $M', 'Feasibility'].map(h =>
                  <th key={h} style={{ padding: '7px 10px', color: '#fff', textAlign: 'left', fontSize: 10 }}>{h}</th>)}
              </tr></thead>
              <tbody>{options.map((o, i) => (
                <tr key={o.name} style={{ background: i === 0 ? '#f0f9ff' : i % 2 === 0 ? T.bg : T.card, borderBottom: `1px solid ${T.border}`, fontWeight: i === 0 ? 700 : 400 }}>
                  <td style={{ padding: '7px 10px' }}>{o.name}</td>
                  <td style={{ padding: '7px 10px', color: o.npv > 0 ? T.green : T.red, fontFamily: 'JetBrains Mono, monospace' }}>${o.npv.toFixed(1)}</td>
                  <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace' }}>{o.irr.toFixed(1)}%</td>
                  <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace' }}>${o.capex.toFixed(1)}</td>
                  <td style={{ padding: '7px 10px' }}><span style={{ background: o.feasibility === 'High' ? T.green : T.amber, color: '#fff', borderRadius: 4, padding: '2px 6px', fontSize: 9 }}>{o.feasibility}</span></td>
                </tr>
              ))}</tbody>
            </table>
          </div>

          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>IRR Sensitivity Waterfall (ppt)</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={sensitivityData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize: 10 }} unit=" ppt" />
                <YAxis dataKey="param" type="category" tick={{ fontSize: 10 }} width={110} />
                <Tooltip formatter={v => `${v > 0 ? '+' : ''}${v} ppt`} />
                <Bar dataKey="impact" name="IRR Impact" radius={[0, 3, 3, 0]}
                  fill={T.indigo} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ marginTop: 16, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Investment Memorandum Summary</div>
          <div style={{ fontSize: 12, color: T.text, lineHeight: 1.7 }}>
            The {numTurbines}-turbine, {metrics.oldCapMW.toFixed(0)}MW fleet (avg. {turbineAge}yr age) presents a compelling repowering opportunity.
            Replacing old {oldRatingKw}kW turbines with {metrics.newTurbineCount} × {newRatingKw / 1000}MW modern units increases installed capacity
            to {metrics.newCapMW.toFixed(0)}MW, lifts CF from {currentCF}% to {metrics.newCF.toFixed(1)}%,
            and delivers {metrics.aepUplift.toFixed(1)}% AEP uplift. At a PPA of ${newPPA}/MWh,
            the incremental IRR is {incIRR.toFixed(1)}% vs the {discountRate}% hurdle,
            generating ${ incrementalNPV.toFixed(1)}M incremental NPV.
            {reuseGrid ? ' Grid connection reuse avoids significant new-build queue costs.' : ''}
            {permitFastTrack ? ' Fast-track permitting reduces timeline risk.' : ''}
            {' '}Recommendation: <strong style={{ color: decisionColor }}>{decision}</strong>.
          </div>
        </div>
      </div>
    );
  }

  const tabContent = [
    renderOverview, renderAssetInventory, renderRepoweringEconomics, renderFullVsPartial,
    renderLifeExtension, renderAEPUplift, renderGridReuse, renderRevenueBridge,
    renderPermitting, renderEnvironmental, renderConstruction, renderFinancialModel,
    renderIRRAnalysis, renderPolicy, renderCaseStudies, renderRiskAnalysis,
    renderTechRoadmap, renderDecisionSummary
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: T.bg, fontFamily: 'DM Sans, sans-serif' }}>
      {/* Header */}
      <div style={{ background: T.navy, borderBottom: `3px solid ${T.accent}`, padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 10, color: T.accent, letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>EP-DR6 // WIND REPOWERING INTELLIGENCE</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginTop: 2 }}>Wind Repowering & Life Extension Intelligence</div>
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          {[
            { l: 'Fleet Capacity', v: `${metrics.oldCapMW.toFixed(0)} MW` },
            { l: 'New Capacity', v: `${metrics.newCapMW.toFixed(0)} MW` },
            { l: 'Strategy', v: strategy.split(' ')[0] },
          ].map(({ l, v }) => (
            <div key={l} style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 9, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.8 }}>{l}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.accent, fontFamily: 'JetBrains Mono, monospace' }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {quickStats}

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {sidebar}

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Tab bar */}
          <div style={{ display: 'flex', overflowX: 'auto', borderBottom: `1px solid ${T.border}`, background: T.card, padding: '0 8px', flexShrink: 0 }}>
            {TABS.map((t, i) => (
              <button key={t} onClick={() => setTab(i)} style={{
                padding: '10px 14px', fontSize: 11, whiteSpace: 'nowrap', border: 'none', background: 'none', cursor: 'pointer',
                color: tab === i ? T.indigo : T.sub, fontWeight: tab === i ? 700 : 400,
                borderBottom: tab === i ? `2px solid ${T.indigo}` : '2px solid transparent',
                transition: 'all 0.15s'
              }}>
                {t}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
            {tabContent[tab] ? tabContent[tab]() : <div>Tab not implemented</div>}
          </div>
        </div>
      </div>

      {/* Footer info strip */}
      <div style={{ background: T.card, borderTop: `1px solid ${T.border}`, padding: '6px 24px', display: 'flex', gap: 32, fontSize: 10, color: T.sub }}>
        <span>Old Fleet: {numTurbines} × {oldRatingKw}kW = <strong style={{ color: T.text }}>{metrics.oldCapMW.toFixed(0)} MW</strong></span>
        <span>New Fleet: {metrics.newTurbineCount} × {(newRatingKw / 1000).toFixed(1)}MW = <strong style={{ color: T.green }}>{metrics.newCapMW.toFixed(0)} MW</strong></span>
        <span>AEP: {(metrics.oldAEP / 1000).toFixed(0)} → <strong style={{ color: T.green }}>{(metrics.newAEP / 1000).toFixed(0)} GWh/yr</strong></span>
        <span>WACC: {discountRate}% | Tax: {taxRate}% | Equity: {equityPct}%</span>
        <span style={{ marginLeft: 'auto', color: T.accent }}>EP-DR6 · Wind Repowering & Life Extension Intelligence</span>
      </div>

      {/* Status bar */}
      <div style={{ background: T.navy, padding: '4px 16px', display: 'flex', gap: 24, fontSize: 10, color: '#6b7280', fontFamily: 'JetBrains Mono, monospace' }}>
        <span style={{ color: T.accent }}>EP-DR6</span>
        <span>IRR: {metrics.incIRR.toFixed(2)}%</span>
        <span>NPV: ${metrics.incrementalNPV.toFixed(1)}M</span>
        <span>LCOE: ${metrics.lcoeNew.toFixed(1)}/MWh</span>
        <span>Fleet: {numTurbines} × {oldRatingKw}kW → {metrics.newTurbineCount} × {newRatingKw}kW</span>
        <span style={{ marginLeft: 'auto' }}>WIND REPOWERING INTELLIGENCE // A² Platform</span>
      </div>
    </div>
  );
}
