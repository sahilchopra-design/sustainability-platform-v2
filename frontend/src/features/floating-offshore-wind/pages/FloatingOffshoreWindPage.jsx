import React, { useState, useMemo } from 'react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, ReferenceLine } from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const T = { bg: '#FAFAF7', card: '#FFFFFF', border: '#E5E2D9', text: '#1A1A2E', sub: '#6B7280', accent: '#B8860B', indigo: '#4F46E5', green: '#065F46', red: '#991B1B', blue: '#1E40AF', amber: '#92400E', teal: '#0F766E', navy: '#0F172A' };

function calcLCOE(capexPerKw, opexPerKwYr, capacityMW, cfPct, life, r) {
  const annualAEP = capacityMW * 1000 * (cfPct / 100) * 8760;
  const totalCapex = capexPerKw * capacityMW * 1000;
  const npvOpex = Array.from({ length: life }, (_, i) => opexPerKwYr * capacityMW * 1000 / Math.pow(1 + r, i + 1)).reduce((a, b) => a + b, 0);
  const npvAEP = Array.from({ length: life }, (_, i) => annualAEP / Math.pow(1 + r, i + 1)).reduce((a, b) => a + b, 0);
  return npvAEP > 0 ? (totalCapex + npvOpex) / npvAEP * 1000 : 0;
}

function calcIRR(cashFlows, guess = 0.1) {
  let rate = guess;
  for (let i = 0; i < 100; i++) {
    const npv = cashFlows.reduce((acc, cf, t) => acc + cf / Math.pow(1 + rate, t), 0);
    const dnpv = cashFlows.reduce((acc, cf, t) => acc - t * cf / Math.pow(1 + rate, t + 1), 0);
    if (Math.abs(dnpv) < 1e-10) break;
    const newRate = rate - npv / dnpv;
    if (Math.abs(newRate - rate) < 1e-6) { rate = newRate; break; }
    rate = newRate;
  }
  return rate;
}

const KpiCard = ({ label, value, unit, color, sub }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 16px', flex: 1, minWidth: 130 }}>
    <div style={{ fontSize: 11, color: T.sub, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.text, fontFamily: 'JetBrains Mono, monospace' }}>{value}<span style={{ fontSize: 12, fontWeight: 500, color: T.sub, marginLeft: 3 }}>{unit}</span></div>
    {sub && <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{sub}</div>}
  </div>
);

const SectionHeader = ({ title }) => (
  <div style={{ borderBottom: `2px solid ${T.accent}`, paddingBottom: 6, marginBottom: 14 }}>
    <span style={{ fontSize: 13, fontWeight: 700, color: T.navy, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{title}</span>
  </div>
);

const SliderRow = ({ label, value, min, max, step, onChange, unit, fmt }) => (
  <div style={{ marginBottom: 10 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
      <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 11, color: T.accent, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>{fmt ? fmt(value) : value}{unit}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))}
      style={{ width: '100%', accentColor: T.accent, height: 4, cursor: 'pointer' }} />
  </div>
);

const SelectRow = ({ label, value, options, onChange }) => (
  <div style={{ marginBottom: 10 }}>
    <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 3 }}>{label}</div>
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ width: '100%', background: '#1E293B', color: '#E2E8F0', border: '1px solid #334155', borderRadius: 4, padding: '4px 6px', fontSize: 11, cursor: 'pointer' }}>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

const TABS = ['Overview','LCOE Breakdown','Floater Technology','Mooring System','Installation & EPCI','AEP vs Distance','Cost Trajectory','Technology Maturity','Wind Resource','Grid & Umbilical','Supply Chain Risk','Environmental','Corporate PPA & CfD','Country Pipeline','Scenario Analysis','Project Finance','Policy & CfD','Investment Summary'];

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const COUNTRIES = [
  { name: 'Norway', installed: 88, pipeline: 1500, target: 3000, policy: 'Strong', tariff: '€85/MWh', project: 'Hywind Tampen' },
  { name: 'UK', installed: 50, pipeline: 5000, target: 5000, policy: 'Very Strong', tariff: '£196/MWh', project: 'Pentland Firth' },
  { name: 'France', installed: 0, pipeline: 800, target: 2000, policy: 'Moderate', tariff: '€150/MWh', project: 'EolMed' },
  { name: 'Japan', installed: 14, pipeline: 1200, target: 10000, policy: 'Strong', tariff: '¥36/kWh', project: 'Fukushima Forward' },
  { name: 'South Korea', installed: 0, pipeline: 2500, target: 12000, policy: 'Strong', tariff: '₩180/kWh', project: 'UlsanBada' },
  { name: 'Portugal', installed: 25, pipeline: 300, target: 1000, policy: 'Moderate', tariff: '€120/MWh', project: 'WindFloat Atlantic' },
  { name: 'USA', installed: 0, pipeline: 10000, target: 15000, policy: 'Moderate', tariff: '$89/MWh', project: 'Maine Aqua Ventus' },
  { name: 'Australia', installed: 0, pipeline: 5000, target: 6000, policy: 'Emerging', tariff: 'A$120/MWh', project: 'Star of the South' },
];

const FLOATER_CONCEPTS = [
  { name: 'Spar-Buoy', depthMin: 100, depthMax: 800, mooringLines: '3', installation: 'Quayside assembly, tow-out', motionResp: 'Excellent', mainAccess: 'Difficult', trl: 8, lcoePremium: 0, color: T.indigo },
  { name: 'Semi-submersible', depthMin: 50, depthMax: 1000, mooringLines: '3-6', installation: 'Port assembly, self-install', motionResp: 'Good', mainAccess: 'Good', trl: 7, lcoePremium: 5, color: T.teal },
  { name: 'Tension Leg Platform', depthMin: 80, depthMax: 500, mooringLines: '4-8', installation: 'Heavy lift + piling', motionResp: 'Superior', mainAccess: 'Moderate', trl: 6, lcoePremium: 15, color: T.accent },
  { name: 'Barge', depthMin: 30, depthMax: 60, mooringLines: '6-12', installation: 'Dry dock, tow-out', motionResp: 'Poor', mainAccess: 'Excellent', trl: 5, lcoePremium: 25, color: T.red },
];

const SUPPLY_CHAIN = [
  { component: 'Turbine Nacelles', leadTime: 52, concentration: 78, risk: 'High' },
  { component: 'Floater Steel Structure', leadTime: 40, concentration: 55, risk: 'High' },
  { component: 'Mooring Chain (R5+)', leadTime: 36, concentration: 65, risk: 'High' },
  { component: 'Dynamic Power Cable', leadTime: 48, concentration: 82, risk: 'Critical' },
  { component: 'Subsea Transformers', leadTime: 60, concentration: 70, risk: 'Critical' },
  { component: 'Installation Vessels (WTIV)', leadTime: 24, concentration: 45, risk: 'Medium' },
  { component: 'Tow-out Tugs', leadTime: 8, concentration: 30, risk: 'Low' },
  { component: 'Commissioning Equipment', leadTime: 16, concentration: 40, risk: 'Medium' },
];

const TRL_DATA = [
  { component: 'Offshore Wind Turbine (15MW)', trl: 8, milestone: 'Commercial deliveries 2023', achievable: 'Now' },
  { component: 'Spar-Buoy Floater', trl: 8, milestone: 'Hywind Scotland 30MW', achievable: 'Now' },
  { component: 'Semi-sub Floater', trl: 7, milestone: 'WindFloat Atlantic 25MW', achievable: '2026' },
  { component: 'TLP Floater', trl: 6, milestone: 'BlueFloat Energy demos', achievable: '2028' },
  { component: 'R5 Mooring Chain', trl: 7, milestone: 'Offshore oil proven', achievable: '2026' },
  { component: 'Dynamic Export Cable', trl: 7, milestone: 'Oil & gas adaption', achievable: '2026' },
  { component: 'HVDC Floating Grid', trl: 5, milestone: 'Research stage', achievable: '2030' },
  { component: 'Mass Tow-out Installation', trl: 6, milestone: 'Hywind proven at scale', achievable: '2027' },
];

export default function FloatingOffshoreWindPage() {
  const [activeTab, setActiveTab] = useState(0);

  // Sidebar state — Site Parameters
  const [waterDepth, setWaterDepth] = useState(200);
  const [distanceShore, setDistanceShore] = useState(80);
  const [seaState, setSeaState] = useState(3.5);
  const [latitude, setLatitude] = useState(57);
  const [seabedType, setSeabedType] = useState('Sand');

  // Floater Concept
  const [floaterConcept, setFloaterConcept] = useState('Semi-submersible');
  const [mooringLines, setMooringLines] = useState(6);
  const [mooringType, setMooringType] = useState('Catenary');

  // Turbine
  const [turbineRating, setTurbineRating] = useState(15);
  const [hubHeight, setHubHeight] = useState(140);
  const [farmCapacity, setFarmCapacity] = useState(500);

  // CAPEX
  const [capexFloater, setCapexFloater] = useState(650);
  const [capexMooring, setCapexMooring] = useState(280);
  const [capexTurbine, setCapexTurbine] = useState(900);
  const [capexInstall, setCapexInstall] = useState(480);
  const [capexGrid, setCapexGrid] = useState(320);
  const [contingency, setContingency] = useState(12);

  // Operations
  const [opex, setOpex] = useState(120);
  const [vesselRate, setVesselRate] = useState(85000);
  const [weatherWindow, setWeatherWindow] = useState(65);
  const [projectLife, setProjectLife] = useState(25);

  // Financial
  const [discountRate, setDiscountRate] = useState(8);
  const [strikePrice, setStrikePrice] = useState(196);
  const [equityPct, setEquityPct] = useState(30);
  const [currency, setCurrency] = useState('USD');

  // Sidebar collapse
  const [collapsed, setCollapsed] = useState({ site: false, floater: false, turbine: false, capex: true, ops: true, fin: true });
  const toggleSection = key => setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));

  const rotorDiameter = useMemo(() => Math.round(Math.sqrt(turbineRating / 15) * 236), [turbineRating]);

  const capexPerKw = useMemo(() => {
    const base = capexFloater + capexMooring + capexTurbine + capexInstall + capexGrid;
    const distAdj = 1 + (distanceShore - 80) * 0.0015;
    const depthAdj = 1 + (waterDepth - 200) * 0.0005;
    const conceptAdj = floaterConcept === 'Spar-Buoy' ? 1.0 : floaterConcept === 'Semi-submersible' ? 1.05 : floaterConcept === 'Tension Leg Platform' ? 1.15 : 1.25;
    return Math.round(base * (1 + contingency / 100) * distAdj * depthAdj * conceptAdj);
  }, [capexFloater, capexMooring, capexTurbine, capexInstall, capexGrid, contingency, distanceShore, waterDepth, floaterConcept]);

  const cfPct = useMemo(() => {
    const base = 38 + (latitude - 50) * 0.4 + (hubHeight - 120) * 0.05 - seaState * 0.5;
    return Math.min(55, Math.max(28, base));
  }, [latitude, hubHeight, seaState]);

  const lcoe = useMemo(() => calcLCOE(capexPerKw, opex, farmCapacity, cfPct, projectLife, discountRate / 100), [capexPerKw, opex, farmCapacity, cfPct, projectLife, discountRate]);

  const totalCapexM = useMemo(() => Math.round(capexPerKw * farmCapacity * 1000 / 1e6), [capexPerKw, farmCapacity]);
  const annualAEP = useMemo(() => Math.round(farmCapacity * (cfPct / 100) * 8760 / 1000), [farmCapacity, cfPct]);

  const irrVal = useMemo(() => {
    const capexTotal = capexPerKw * farmCapacity * 1000;
    const annualRev = annualAEP * 1000 * (strikePrice / 1000);
    const annualOpexTotal = opex * farmCapacity * 1000;
    const cf = [-capexTotal, ...Array.from({ length: projectLife }, () => annualRev - annualOpexTotal)];
    return calcIRR(cf) * 100;
  }, [capexPerKw, farmCapacity, annualAEP, strikePrice, opex, projectLife]);

  const npvM = useMemo(() => {
    const capexTotal = capexPerKw * farmCapacity * 1000;
    const annualRev = annualAEP * 1000 * (strikePrice / 1000);
    const annualOpexTotal = opex * farmCapacity * 1000;
    const r = discountRate / 100;
    const npvRev = Array.from({ length: projectLife }, (_, i) => annualRev / Math.pow(1 + r, i + 1)).reduce((a, b) => a + b, 0);
    const npvOp = Array.from({ length: projectLife }, (_, i) => annualOpexTotal / Math.pow(1 + r, i + 1)).reduce((a, b) => a + b, 0);
    return Math.round((npvRev - npvOp - capexTotal) / 1e6);
  }, [capexPerKw, farmCapacity, annualAEP, strikePrice, opex, projectLife, discountRate]);

  const costBreakdownData = useMemo(() => [
    { name: 'Turbine', value: Math.round(capexTurbine * (1 + contingency / 100) * farmCapacity * 1000 / 1e6), color: T.indigo },
    { name: 'Floater', value: Math.round(capexFloater * (1 + contingency / 100) * farmCapacity * 1000 / 1e6), color: T.teal },
    { name: 'Mooring', value: Math.round(capexMooring * (1 + contingency / 100) * farmCapacity * 1000 / 1e6), color: T.accent },
    { name: 'Installation', value: Math.round(capexInstall * (1 + contingency / 100) * farmCapacity * 1000 / 1e6), color: T.blue },
    { name: 'Grid/Cable', value: Math.round(capexGrid * (1 + contingency / 100) * farmCapacity * 1000 / 1e6), color: T.green },
  ], [capexTurbine, capexFloater, capexMooring, capexInstall, capexGrid, contingency, farmCapacity]);

  const waterfallData = useMemo(() => {
    const opexNpv = Array.from({ length: projectLife }, (_, i) => opex * farmCapacity * 1000 / Math.pow(1 + discountRate / 100, i + 1)).reduce((a, b) => a + b, 0);
    const npvAEP = Array.from({ length: projectLife }, (_, i) => farmCapacity * 1000 * (cfPct / 100) * 8760 / Math.pow(1 + discountRate / 100, i + 1)).reduce((a, b) => a + b, 0);
    const scale = npvAEP > 0 ? 1000 / npvAEP : 0;
    return [
      { name: 'Turbine', value: +(capexTurbine * farmCapacity * 1000 * scale).toFixed(1) },
      { name: 'Floater', value: +(capexFloater * farmCapacity * 1000 * scale).toFixed(1) },
      { name: 'Mooring', value: +(capexMooring * farmCapacity * 1000 * scale).toFixed(1) },
      { name: 'Installation', value: +(capexInstall * farmCapacity * 1000 * scale).toFixed(1) },
      { name: 'Grid/Cable', value: +(capexGrid * farmCapacity * 1000 * scale).toFixed(1) },
      { name: 'OpEx NPV', value: +(opexNpv * scale).toFixed(1) },
      { name: 'LCOE', value: +lcoe.toFixed(1) },
    ];
  }, [capexTurbine, capexFloater, capexMooring, capexInstall, capexGrid, opex, farmCapacity, cfPct, projectLife, discountRate, lcoe]);

  const distanceSensData = useMemo(() => Array.from({ length: 20 }, (_, i) => {
    const d = 20 + i * 24;
    const adjCapex = capexPerKw + (d - distanceShore) * 3.5;
    const adjOpex = opex + (d - distanceShore) * 0.18;
    return { distance: d, lcoe: +calcLCOE(adjCapex, adjOpex, farmCapacity, cfPct, projectLife, discountRate / 100).toFixed(1), hvdcCrossover: d > 120 ? 'HVDC' : 'HVAC' };
  }), [capexPerKw, distanceShore, opex, farmCapacity, cfPct, projectLife, discountRate]);

  const learningCurveData = useMemo(() => [
    { year: 2024, floating: 130, fixed: 85 },
    { year: 2025, floating: 122, fixed: 82 },
    { year: 2026, floating: 115, fixed: 80 },
    { year: 2027, floating: 108, fixed: 78 },
    { year: 2028, floating: 101, fixed: 76 },
    { year: 2029, floating: 94, fixed: 74 },
    { year: 2030, floating: 88, fixed: 72 },
    { year: 2031, floating: 82, fixed: 71 },
    { year: 2032, floating: 78, fixed: 70 },
    { year: 2033, floating: 73, fixed: 69 },
    { year: 2034, floating: 68, fixed: 68 },
    { year: 2035, floating: 63, fixed: 67 },
    { year: 2036, floating: 60, fixed: 66 },
    { year: 2040, floating: 52, fixed: 63 },
  ], []);

  const monthlyAEP = useMemo(() => MONTHS.map((m, i) => {
    const seasonal = 1 + Math.sin((i - 2) * Math.PI / 6) * 0.25;
    const val = annualAEP * 1000 / 12 * seasonal;
    return { month: m, aep: Math.round(val), cf: +((cfPct / 100) * seasonal * 100).toFixed(1) };
  }), [annualAEP, cfPct]);

  const scenarioData = useMemo(() => {
    const scenarios = [
      { name: 'Base Case', capexMult: 1.0, cfAdj: 0, label: 'Base' },
      { name: 'High Wind / Low CAPEX', capexMult: 0.85, cfAdj: 4, label: 'Bull' },
      { name: 'Low Wind / High CAPEX', capexMult: 1.20, cfAdj: -5, label: 'Bear' },
      { name: 'Policy Support', capexMult: 0.92, cfAdj: 1, label: 'Policy' },
    ];
    return scenarios.map(s => {
      const adjCapex = capexPerKw * s.capexMult;
      const adjCf = Math.max(25, cfPct + s.cfAdj);
      const scenLcoe = calcLCOE(adjCapex, opex, farmCapacity, adjCf, projectLife, discountRate / 100);
      const capexTotal = adjCapex * farmCapacity * 1000;
      const adjAEP = farmCapacity * (adjCf / 100) * 8760;
      const annualRev = adjAEP * (strikePrice / 1000);
      const annualOpexTotal = opex * farmCapacity * 1000;
      const cf = [-capexTotal, ...Array.from({ length: projectLife }, () => annualRev - annualOpexTotal)];
      const irr = calcIRR(cf) * 100;
      const r = discountRate / 100;
      const npvRev = Array.from({ length: projectLife }, (_, i) => annualRev / Math.pow(1 + r, i + 1)).reduce((a, b) => a + b, 0);
      const npvOp = Array.from({ length: projectLife }, (_, i) => annualOpexTotal / Math.pow(1 + r, i + 1)).reduce((a, b) => a + b, 0);
      const npv = Math.round((npvRev - npvOp - capexTotal) / 1e6);
      const breakeven = scenLcoe > 0 ? +scenLcoe.toFixed(0) : 0;
      return { ...s, lcoe: +scenLcoe.toFixed(1), irr: +irr.toFixed(2), npv, breakeven };
    });
  }, [capexPerKw, cfPct, opex, farmCapacity, projectLife, discountRate, strikePrice]);

  const dscrProfile = useMemo(() => {
    const debtPct = (100 - equityPct) / 100;
    const debtAmt = totalCapexM * debtPct;
    const loanTenor = 18;
    const debtRate = (discountRate / 100) * 0.65;
    const annualDebtService = debtAmt * debtRate * Math.pow(1 + debtRate, loanTenor) / (Math.pow(1 + debtRate, loanTenor) - 1 || 1);
    return Array.from({ length: projectLife }, (_, i) => {
      const yr = i + 1;
      const rev = annualAEP * 1000 * (strikePrice / 1000) * (1 - 0.003 * i) / 1e6;
      const opexM = opex * farmCapacity * 1000 / 1e6;
      const cfds = rev - opexM;
      const ds = yr <= loanTenor ? annualDebtService : 0;
      const dscr = ds > 0 ? cfds / ds : null;
      return { year: yr, cfds: +cfds.toFixed(1), dscr: dscr !== null ? +dscr.toFixed(2) : null };
    });
  }, [totalCapexM, equityPct, discountRate, annualAEP, strikePrice, opex, farmCapacity, projectLife]);

  const radarData = useMemo(() => FLOATER_CONCEPTS.map(c => ({
    concept: c.name.replace('-', '\n'),
    stability: c.name === 'Spar-Buoy' ? 90 : c.name === 'Semi-submersible' ? 75 : c.name === 'Tension Leg Platform' ? 95 : 45,
    installEase: c.name === 'Spar-Buoy' ? 60 : c.name === 'Semi-submersible' ? 80 : c.name === 'Tension Leg Platform' ? 45 : 85,
    maintAccess: c.name === 'Spar-Buoy' ? 40 : c.name === 'Semi-submersible' ? 75 : c.name === 'Tension Leg Platform' ? 60 : 90,
    depthFlex: c.name === 'Spar-Buoy' ? 85 : c.name === 'Semi-submersible' ? 90 : c.name === 'Tension Leg Platform' ? 65 : 30,
    costEff: c.name === 'Spar-Buoy' ? 80 : c.name === 'Semi-submersible' ? 75 : c.name === 'Tension Leg Platform' ? 55 : 50,
    maturity: c.trl * 10,
  })), []);

  const radarDimensions = ['stability', 'installEase', 'maintAccess', 'depthFlex', 'costEff', 'maturity'];

  const epciData = [
    { phase: 'Port Fabrication', cost: Math.round(capexFloater * farmCapacity * 1000 * 0.35 / 1e6), weeks: 52 },
    { phase: 'Turbine Supply', cost: Math.round(capexTurbine * farmCapacity * 1000 * 0.8 / 1e6), weeks: 36 },
    { phase: 'Mooring Install', cost: Math.round(capexMooring * farmCapacity * 1000 / 1e6), weeks: 20 },
    { phase: 'Tow-Out & Hookup', cost: Math.round(capexInstall * farmCapacity * 1000 * 0.5 / 1e6), weeks: 24 },
    { phase: 'Cable Pull-In', cost: Math.round(capexGrid * farmCapacity * 1000 * 0.6 / 1e6), weeks: 16 },
    { phase: 'Commissioning', cost: Math.round(capexInstall * farmCapacity * 1000 * 0.2 / 1e6), weeks: 8 },
  ];

  const colorArr = [T.indigo, T.teal, T.accent, T.blue, T.green, T.red];

  const renderOverview = () => (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <KpiCard label="LCOE" value={lcoe.toFixed(1)} unit="$/MWh" color={T.accent} sub="Levelised cost of energy" />
        <KpiCard label="Total CAPEX" value={totalCapexM.toLocaleString()} unit="$M" color={T.indigo} sub={`${capexPerKw.toLocaleString()} $/kW`} />
        <KpiCard label="Farm AEP" value={annualAEP.toLocaleString()} unit="GWh/yr" color={T.teal} />
        <KpiCard label="Capacity Factor" value={cfPct.toFixed(1)} unit="%" color={T.green} />
        <KpiCard label="Project IRR" value={irrVal.toFixed(2)} unit="%" color={irrVal > discountRate ? T.green : T.red} sub={`vs ${discountRate}% discount rate`} />
        <KpiCard label="Project NPV" value={(npvM >= 0 ? '+' : '') + npvM.toLocaleString()} unit="$M" color={npvM >= 0 ? T.green : T.red} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHeader title="Floater Concept Comparison" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {FLOATER_CONCEPTS.map(c => (
              <div key={c.name} style={{ border: `1px solid ${floaterConcept === c.name ? c.color : T.border}`, borderRadius: 6, padding: '10px 12px', background: floaterConcept === c.name ? `${c.color}12` : T.bg }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, color: c.color, fontSize: 13 }}>{c.name}</span>
                  <span style={{ fontSize: 11, color: T.sub }}>TRL {c.trl}/9 · +{c.lcoePremium}% LCOE</span>
                </div>
                <div style={{ fontSize: 11, color: T.sub, marginTop: 4 }}>Depth: {c.depthMin}–{c.depthMax}m · {c.mooringLines} lines · {c.installation}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHeader title="Cost Breakdown ($M)" />
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={costBreakdownData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {costBreakdownData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip formatter={v => [`$${v}M`, '']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHeader title="Annual Production & Revenue Profile (25yr)" />
          <ResponsiveContainer width="100%" height={190}>
            <LineChart data={Array.from({ length: projectLife }, (_, i) => {
              const yr = 2026 + i;
              const deg = 1 - i * 0.002;
              const aepYr = Math.round(annualAEP * deg);
              const revM = Math.round(aepYr * 1000 * (strikePrice / 1000) / 1e6);
              const opexM = Math.round(opex * farmCapacity * 1000 / 1e6);
              return { year: yr, aep: aepYr, revenue: revM, opexAnn: opexM, ebitda: revM - opexM };
            })}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize: 10, fill: T.sub }} />
              <YAxis yAxisId="aep" tick={{ fontSize: 10, fill: T.sub }} unit=" GWh" />
              <YAxis yAxisId="rev" orientation="right" tick={{ fontSize: 10, fill: T.sub }} unit="M" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="aep" dataKey="aep" name="AEP (GWh)" fill={`${T.teal}55`} />
              <Line yAxisId="rev" dataKey="revenue" name="Revenue ($M)" stroke={T.green} strokeWidth={2} dot={false} />
              <Line yAxisId="rev" dataKey="ebitda" name="EBITDA ($M)" stroke={T.accent} strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHeader title="Key Metrics vs Peers" />
          {[
            { metric: 'LCOE', site: `${lcoe.toFixed(0)} $/MWh`, peer: '105-140 $/MWh', good: lcoe < 120 },
            { metric: 'CF', site: `${cfPct.toFixed(1)}%`, peer: '38-50%', good: cfPct >= 38 },
            { metric: 'CAPEX/kW', site: `$${capexPerKw.toLocaleString()}`, peer: '$3,500-5,500', good: capexPerKw < 5000 },
            { metric: 'OpEx/kW/yr', site: `$${opex}`, peer: '$80-150', good: opex < 120 },
            { metric: 'IRR', site: `${irrVal.toFixed(1)}%`, peer: '6-12%', good: irrVal > 8 },
            { metric: 'Project NPV', site: `$${npvM.toLocaleString()}M`, peer: 'Positive', good: npvM > 0 },
          ].map(r => (
            <div key={r.metric} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: `1px solid ${T.border}` }}>
              <div>
                <div style={{ fontSize: 11, color: T.text, fontWeight: 600 }}>{r.metric}</div>
                <div style={{ fontSize: 10, color: T.sub }}>Peer: {r.peer}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: r.good ? T.green : T.red, fontFamily: 'monospace' }}>{r.site}</div>
                <div style={{ fontSize: 10, color: r.good ? T.green : T.red }}>{r.good ? 'In range' : 'Above range'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderLCOEBreakdown = () => (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHeader title="LCOE Waterfall ($/MWh)" />
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={waterfallData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: T.sub }} />
              <YAxis tick={{ fontSize: 11, fill: T.sub }} unit=" $/MWh" />
              <Tooltip formatter={v => [`${v} $/MWh`, 'Cost Contribution']} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {waterfallData.map((e, i) => <Cell key={i} fill={i === waterfallData.length - 1 ? T.accent : colorArr[i % colorArr.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHeader title="LCOE Sensitivity Analysis" />
          {[
            { param: 'CAPEX +10%', delta: +(lcoe * 0.08).toFixed(1), dir: 'up' },
            { param: 'OpEx +20%', delta: +(lcoe * 0.06).toFixed(1), dir: 'up' },
            { param: 'CF -5pp', delta: +(lcoe * 0.13).toFixed(1), dir: 'up' },
            { param: 'Discount Rate +2%', delta: +(lcoe * 0.09).toFixed(1), dir: 'up' },
            { param: 'Project Life +5yr', delta: -(lcoe * 0.04).toFixed(1), dir: 'down' },
            { param: 'CF +5pp', delta: -(lcoe * 0.11).toFixed(1), dir: 'down' },
            { param: 'CAPEX -15%', delta: -(lcoe * 0.12).toFixed(1), dir: 'down' },
            { param: 'OpEx -20%', delta: -(lcoe * 0.06).toFixed(1), dir: 'down' },
          ].map(r => (
            <div key={r.param} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: `1px solid ${T.border}` }}>
              <span style={{ fontSize: 11, color: T.text }}>{r.param}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: r.dir === 'up' ? T.red : T.green, fontFamily: 'monospace' }}>{r.dir === 'up' ? '+' : ''}{r.delta} $/MWh</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <SectionHeader title="Component Cost Table ($/kW)" />
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: T.navy }}>
              {['Component', '$/kW', 'Total $M', '% of CAPEX'].map(h => (
                <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#E2E8F0', fontWeight: 600, fontSize: 11 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { name: 'Turbine & Nacelle', kw: capexTurbine, mult: 1 },
              { name: 'Floater Structure', kw: capexFloater, mult: 1 },
              { name: 'Mooring & Anchoring', kw: capexMooring, mult: 1 },
              { name: 'Installation EPCI', kw: capexInstall, mult: 1 },
              { name: 'Grid/Umbilical Cable', kw: capexGrid, mult: 1 },
              { name: 'Contingency', kw: Math.round((capexFloater + capexMooring + capexTurbine + capexInstall + capexGrid) * contingency / 100), mult: 1 },
            ].map((r, i) => {
              const totalM = Math.round(r.kw * farmCapacity * 1000 / 1e6);
              const pct = totalCapexM > 0 ? ((totalM / totalCapexM) * 100).toFixed(1) : '0.0';
              return (
                <tr key={r.name} style={{ background: i % 2 === 0 ? T.bg : T.card, borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '8px 12px', color: T.text }}>{r.name}</td>
                  <td style={{ padding: '8px 12px', color: T.accent, fontFamily: 'monospace' }}>{r.kw.toLocaleString()}</td>
                  <td style={{ padding: '8px 12px', color: T.text, fontFamily: 'monospace' }}>${totalM.toLocaleString()}M</td>
                  <td style={{ padding: '8px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, background: T.border, borderRadius: 4, height: 6 }}>
                        <div style={{ width: `${pct}%`, background: colorArr[i % colorArr.length], height: 6, borderRadius: 4 }} />
                      </div>
                      <span style={{ fontSize: 11, color: T.sub, minWidth: 35 }}>{pct}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderFloaterTechnology = () => (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
        {FLOATER_CONCEPTS.map(c => (
          <div key={c.name} style={{ background: floaterConcept === c.name ? `${c.color}18` : T.card, border: `1px solid ${floaterConcept === c.name ? c.color : T.border}`, borderRadius: 8, padding: '12px 14px', cursor: 'pointer' }} onClick={() => setFloaterConcept(c.name)}>
            <div style={{ fontSize: 11, fontWeight: 800, color: c.color, marginBottom: 4 }}>{c.name}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: c.color, fontFamily: 'monospace' }}>TRL {c.trl}/9</div>
            <div style={{ fontSize: 10, color: T.sub, marginTop: 2 }}>+{c.lcoePremium}% LCOE vs Spar</div>
            <div style={{ fontSize: 10, color: T.sub }}>{c.depthMin}–{c.depthMax}m depth</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHeader title="Technology Radar (6 Dimensions)" />
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarDimensions.map(dim => {
              const obj = { dimension: dim };
              radarData.forEach(r => { obj[r.concept] = r[dim]; });
              return obj;
            })}>
              <PolarGrid stroke={T.border} />
              <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 10, fill: T.sub }} />
              {FLOATER_CONCEPTS.map((c, i) => <Radar key={c.name} name={c.name} dataKey={c.name.replace('-', '\n')} stroke={c.color} fill={c.color} fillOpacity={0.08} />)}
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHeader title="Technology Comparison Matrix" />
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ background: T.navy }}>
                {['Attribute', 'Spar', 'Semi-sub', 'TLP', 'Barge'].map(h => <th key={h} style={{ padding: '7px 8px', color: '#E2E8F0', textAlign: 'left' }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {[
                { attr: 'Depth Range', vals: ['100-800m', '50-1000m', '80-500m', '30-60m'] },
                { attr: 'Mooring Lines', vals: ['3', '3-6', '4-8', '6-12'] },
                { attr: 'Installation', vals: ['Tow-out', 'Self-install', 'Heavy lift', 'Tow-out'] },
                { attr: 'Motion Response', vals: ['Excellent', 'Good', 'Superior', 'Poor'] },
                { attr: 'Maint. Access', vals: ['Difficult', 'Good', 'Moderate', 'Excellent'] },
                { attr: 'TRL', vals: ['8/9', '7/9', '6/9', '5/9'] },
                { attr: 'LCOE Premium', vals: ['0%', '+5%', '+15%', '+25%'] },
              ].map((row, i) => (
                <tr key={row.attr} style={{ background: i % 2 === 0 ? T.bg : T.card, borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '6px 8px', fontWeight: 600, color: T.text }}>{row.attr}</td>
                  {row.vals.map((v, j) => <td key={j} style={{ padding: '6px 8px', color: T.sub }}>{v}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderMooringSystem = () => (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Mooring Lines / Turbine', value: `${mooringLines}`, unit: 'lines', color: T.accent },
          { label: 'Mooring Type', value: mooringType, unit: '', color: T.indigo },
          { label: 'Mooring CapEx', value: `$${Math.round(capexMooring * farmCapacity * 1000 / 1e6).toLocaleString()}M`, unit: 'total', color: T.teal },
          { label: 'Total Lines (farm)', value: `${mooringLines * Math.ceil(farmCapacity / turbineRating)}`, unit: `across ${Math.ceil(farmCapacity / turbineRating)} turbines`, color: T.green },
        ].map(r => (
          <div key={r.label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '12px 14px' }}>
            <div style={{ fontSize: 10, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{r.label}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: r.color, fontFamily: 'monospace' }}>{r.value}</div>
            <div style={{ fontSize: 10, color: T.sub }}>{r.unit}</div>
          </div>
        ))}
      </div>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <SectionHeader title="Mooring System Comparison" />
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: T.navy }}>
              {['Attribute', 'Catenary', 'Taut-Leg', 'Semi-Taut'].map(h => <th key={h} style={{ padding: '8px 12px', color: '#E2E8F0', textAlign: 'left' }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {[
              { attr: 'Material', vals: ['R4/R5 Chain', 'Polyester Rope', 'Chain + Wire'] },
              { attr: 'Anchor Type', vals: ['Drag Embedment', 'Suction Bucket', 'Driven Pile'] },
              { attr: 'Depth Suitability', vals: ['100-3000m', '300-2000m', '150-1000m'] },
              { attr: 'Footprint', vals: ['Large (2-5× depth)', 'Compact (~1× depth)', 'Moderate (~1.5×)'] },
              { attr: 'Cost $/m', vals: ['~$850', '~$480', '~$620'] },
              { attr: 'Fatigue Life (yr)', vals: ['25-30', '20-25', '22-27'] },
              { attr: 'Installation', vals: ['AHV vessel', 'CSV + piling', 'AHV + welding'] },
              { attr: 'TRL (FOWT)', vals: ['8/9', '6/9', '7/9'] },
            ].map((row, i) => (
              <tr key={row.attr} style={{ background: i % 2 === 0 ? T.bg : T.card, borderBottom: `1px solid ${T.border}` }}>
                <td style={{ padding: '8px 12px', fontWeight: 600, color: T.text }}>{row.attr}</td>
                {row.vals.map((v, j) => <td key={j} style={{ padding: '8px 12px', color: T.sub }}>{v}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
        <SectionHeader title="Mooring Cost vs Water Depth ($/kW)" />
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={Array.from({ length: 15 }, (_, i) => {
            const d = 50 + i * 130;
            return {
              depth: d,
              catenary: Math.round(180 + d * 0.45 + sr(i * 7) * 40),
              tautLeg: Math.round(220 + d * 0.25 + sr(i * 13) * 30),
              semiTaut: Math.round(200 + d * 0.35 + sr(i * 11) * 35),
            };
          })}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="depth" unit="m" tick={{ fontSize: 11, fill: T.sub }} />
            <YAxis unit=" $/kW" tick={{ fontSize: 11, fill: T.sub }} />
            <Tooltip />
            <Legend />
            <Line dataKey="catenary" name="Catenary" stroke={T.indigo} strokeWidth={2} dot={false} />
            <Line dataKey="tautLeg" name="Taut-Leg" stroke={T.teal} strokeWidth={2} dot={false} />
            <Line dataKey="semiTaut" name="Semi-Taut" stroke={T.accent} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderInstallation = () => (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Total EPCI Cost', value: `$${Math.round(totalCapexM * 0.42).toLocaleString()}M`, unit: '~42% of CAPEX', color: T.accent },
          { label: 'Weather Window', value: `${weatherWindow}%`, unit: 'access days/yr', color: weatherWindow >= 60 ? T.green : T.amber },
          { label: 'Vessel Charter Rate', value: `$${(vesselRate / 1000).toFixed(0)}k`, unit: 'per day', color: T.indigo },
          { label: 'EPCI Duration', value: `~${Math.round(epciData.reduce((a, b) => a + b.weeks * 0.6, 0) / 4)} months`, unit: 'with overlap', color: T.teal },
        ].map(r => (
          <div key={r.label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '12px 14px' }}>
            <div style={{ fontSize: 10, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{r.label}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: r.color, fontFamily: 'monospace' }}>{r.value}</div>
            <div style={{ fontSize: 10, color: T.sub }}>{r.unit}</div>
          </div>
        ))}
      </div>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <SectionHeader title="Weather Window Impact on EPCI Duration (weeks)" />
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={Array.from({ length: 10 }, (_, i) => {
            const ww = 30 + i * 7;
            const baseDuration = epciData.reduce((a, b) => a + b.weeks * 0.6, 0);
            const adjDuration = Math.round(baseDuration * (80 / Math.max(1, ww)));
            const adjCapexImpact = Math.round(capexInstall * farmCapacity * 1000 * (85 / Math.max(1, ww) - 1) / 1e6);
            return { window: `${ww}%`, duration: adjDuration, costImpact: Math.max(0, adjCapexImpact) };
          })}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="window" tick={{ fontSize: 11, fill: T.sub }} label={{ value: 'Weather Window %', position: 'insideBottom', offset: -5, fill: T.sub, fontSize: 11 }} />
            <YAxis yAxisId="dur" unit="w" tick={{ fontSize: 11, fill: T.sub }} />
            <YAxis yAxisId="cost" orientation="right" unit="M" tick={{ fontSize: 11, fill: T.sub }} />
            <Tooltip />
            <Legend />
            <Line yAxisId="dur" dataKey="duration" name="EPCI Duration (wks)" stroke={T.accent} strokeWidth={2} dot={{ r: 3 }} />
            <ReferenceLine yAxisId="dur" x={`${weatherWindow}%`} stroke={T.teal} strokeDasharray="4 4" label={{ value: 'Current site', fill: T.teal, fontSize: 10 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHeader title="EPCI Phase Cost ($M)" />
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={epciData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" unit="M" tick={{ fontSize: 11, fill: T.sub }} />
              <YAxis dataKey="phase" type="category" width={130} tick={{ fontSize: 10, fill: T.sub }} />
              <Tooltip formatter={v => [`$${v}M`]} />
              <Bar dataKey="cost" radius={[0, 4, 4, 0]}>
                {epciData.map((_, i) => <Cell key={i} fill={colorArr[i % colorArr.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHeader title="Installation Timeline" />
          {epciData.map((p, i) => (
            <div key={p.phase} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                <span style={{ color: T.text, fontWeight: 500 }}>{p.phase}</span>
                <span style={{ color: T.sub }}>{p.weeks} weeks</span>
              </div>
              <div style={{ background: T.border, borderRadius: 4, height: 10 }}>
                <div style={{ width: `${Math.min(100, p.weeks / 60 * 100)}%`, background: colorArr[i % colorArr.length], height: 10, borderRadius: 4 }} />
              </div>
            </div>
          ))}
          <div style={{ marginTop: 12, padding: '8px 10px', background: `${T.amber}15`, borderRadius: 6, fontSize: 11, color: T.amber }}>
            Total EPCI duration: ~{epciData.reduce((a, b) => a + b.weeks * 0.6, 0).toFixed(0)} weeks (activities overlap)
          </div>
        </div>
      </div>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
        <SectionHeader title="Vessel Day-Rate Sensitivity (LCOE $/MWh)" />
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={Array.from({ length: 10 }, (_, i) => {
            const rate = 50000 + i * 20000;
            const adjCapex = capexPerKw + (rate - vesselRate) / vesselRate * capexInstall * 0.4;
            return { rate: `$${(rate / 1000).toFixed(0)}k`, lcoe: +calcLCOE(adjCapex, opex, farmCapacity, cfPct, projectLife, discountRate / 100).toFixed(1) };
          })}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="rate" tick={{ fontSize: 10, fill: T.sub }} />
            <YAxis unit=" $/MWh" tick={{ fontSize: 11, fill: T.sub }} />
            <Tooltip />
            <Line dataKey="lcoe" name="LCOE" stroke={T.accent} strokeWidth={2} dot={false} />
            <ReferenceLine y={strikePrice} stroke={T.green} strokeDasharray="4 4" label={{ value: `CfD ${strikePrice}`, fill: T.green, fontSize: 10 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <SectionHeader title="O&M Cost Structure Breakdown ($/kW/yr)" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={[
                { name: 'Vessel Access & Charter', value: Math.round(opex * 0.30), fill: T.indigo },
                { name: 'Preventive Maintenance', value: Math.round(opex * 0.25), fill: T.teal },
                { name: 'Corrective Maintenance', value: Math.round(opex * 0.20), fill: T.accent },
                { name: 'Mooring Inspection', value: Math.round(opex * 0.10), fill: T.green },
                { name: 'Cable Monitoring', value: Math.round(opex * 0.08), fill: T.blue },
                { name: 'Insurance & Admin', value: Math.round(opex * 0.07), fill: T.red },
              ]} dataKey="value" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => percent > 0.08 ? `${(percent * 100).toFixed(0)}%` : ''} labelLine={false}>
                {[T.indigo, T.teal, T.accent, T.green, T.blue, T.red].map((c, i) => <Cell key={i} fill={c} />)}
              </Pie>
              <Tooltip formatter={v => [`$${v}/kW/yr`]} />
            </PieChart>
          </ResponsiveContainer>
          <div>
            {[
              { label: 'Vessel Access & Charter', pct: 30, color: T.indigo },
              { label: 'Preventive Maintenance', pct: 25, color: T.teal },
              { label: 'Corrective Maintenance', pct: 20, color: T.accent },
              { label: 'Mooring Inspection', pct: 10, color: T.green },
              { label: 'Cable Monitoring', pct: 8, color: T.blue },
              { label: 'Insurance & Admin', pct: 7, color: T.red },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: r.color, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, color: T.text }}>{r.label}</span>
                    <span style={{ fontSize: 11, color: r.color, fontFamily: 'monospace', fontWeight: 700 }}>${Math.round(opex * r.pct / 100)}/kW</span>
                  </div>
                  <div style={{ background: T.border, height: 4, borderRadius: 2, marginTop: 2 }}>
                    <div style={{ width: `${r.pct}%`, background: r.color, height: 4, borderRadius: 2 }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderAEPDistance = () => (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Distance to Shore', value: `${distanceShore} km`, color: T.accent },
          { label: 'Cable Type', value: distanceShore > 120 ? 'HVDC' : 'HVAC', color: distanceShore > 120 ? T.indigo : T.teal },
          { label: 'Cable CapEx', value: `$${Math.round(capexGrid * farmCapacity * 1000 / 1e6).toLocaleString()}M`, color: T.amber },
          { label: 'Transmission Loss', value: `${(distanceShore > 120 ? 3.0 : 0.5 + distanceShore * 0.005).toFixed(1)}%`, color: T.sub },
        ].map(r => (
          <div key={r.label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '12px 14px' }}>
            <div style={{ fontSize: 10, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{r.label}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: r.color, fontFamily: 'monospace' }}>{r.value}</div>
          </div>
        ))}
      </div>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <SectionHeader title="LCOE Sensitivity to Distance to Shore" />
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={distanceSensData}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="distance" unit="km" tick={{ fontSize: 11, fill: T.sub }} label={{ value: 'Distance to Shore (km)', position: 'insideBottom', offset: -5, fill: T.sub, fontSize: 11 }} />
            <YAxis unit=" $/MWh" tick={{ fontSize: 11, fill: T.sub }} />
            <Tooltip formatter={v => [`${v} $/MWh`]} />
            <Line dataKey="lcoe" name="LCOE" stroke={T.accent} strokeWidth={2} dot={false} />
            <ReferenceLine y={strikePrice} stroke={T.green} strokeDasharray="4 4" label={{ value: `Strike £${strikePrice}`, fill: T.green, fontSize: 10 }} />
            <ReferenceLine x={120} stroke={T.indigo} strokeDasharray="4 4" label={{ value: 'HVDC threshold', fill: T.indigo, fontSize: 10 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHeader title="AC vs HVDC Crossover" />
          {[
            { label: 'HVAC economic range', value: '< 80-100 km', color: T.green },
            { label: 'Crossover zone', value: '80-120 km', color: T.amber },
            { label: 'HVDC preferred', value: '> 120 km', color: T.indigo },
            { label: 'Dynamic cable req.', value: 'Always (floating)', color: T.accent },
            { label: 'Static cable loss', value: '~0.5%/100km', color: T.sub },
            { label: 'HVDC conversion loss', value: '~1.5% fixed', color: T.sub },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${T.border}` }}>
              <span style={{ fontSize: 12, color: T.text }}>{r.label}</span>
              <span style={{ fontSize: 12, color: r.color, fontWeight: 600 }}>{r.value}</span>
            </div>
          ))}
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHeader title="Hub Siting Optimisation" />
          {[
            { label: 'Current site distance', value: `${distanceShore} km`, color: T.accent },
            { label: 'Optimal range (cost)', value: '40-80 km', color: T.green },
            { label: 'Water depth at site', value: `${waterDepth} m`, color: T.accent },
            { label: 'Min. floating depth', value: '50 m', color: T.teal },
            { label: 'Wind resource (P50)', value: `${(9.5 + (latitude - 50) * 0.08).toFixed(1)} m/s`, color: T.indigo },
            { label: 'AEP at site (net)', value: `${annualAEP.toLocaleString()} GWh`, color: T.green },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${T.border}` }}>
              <span style={{ fontSize: 12, color: T.text }}>{r.label}</span>
              <span style={{ fontSize: 12, color: r.color, fontWeight: 600 }}>{r.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderCostTrajectory = () => (
    <div>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <SectionHeader title="LCOE Learning Curve 2024-2040 ($/MWh)" />
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={learningCurveData}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.sub }} />
            <YAxis unit=" $/MWh" tick={{ fontSize: 11, fill: T.sub }} domain={[40, 140]} />
            <Tooltip />
            <Legend />
            <Line dataKey="floating" name="Floating Offshore" stroke={T.accent} strokeWidth={2.5} dot={{ r: 3, fill: T.accent }} />
            <Line dataKey="fixed" name="Fixed-Bottom Offshore" stroke={T.indigo} strokeWidth={2} strokeDasharray="5 5" dot={{ r: 2 }} />
            <ReferenceLine y={60} stroke={T.green} strokeDasharray="3 3" label={{ value: '2035 Target $60/MWh', fill: T.green, fontSize: 10 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <SectionHeader title="Component CAPEX Trajectory 2024-2040 ($/kW, indexed 2024=100)" />
        <ResponsiveContainer width="100%" height={210}>
          <BarChart data={[2024,2026,2028,2030,2032,2035,2040].map((yr, i) => {
            const lr = 0.85 ** (i * 0.6);
            return {
              year: yr,
              turbine: Math.round(capexTurbine * lr),
              floater: Math.round(capexFloater * (0.82 ** (i * 0.6))),
              mooring: Math.round(capexMooring * (0.90 ** (i * 0.5))),
              install: Math.round(capexInstall * (0.78 ** (i * 0.65))),
              grid: Math.round(capexGrid * (0.88 ** (i * 0.55))),
            };
          })}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.sub }} />
            <YAxis unit=" $/kW" tick={{ fontSize: 11, fill: T.sub }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="turbine" name="Turbine" stackId="a" fill={T.indigo} />
            <Bar dataKey="floater" name="Floater" stackId="a" fill={T.teal} />
            <Bar dataKey="mooring" name="Mooring" stackId="a" fill={T.accent} />
            <Bar dataKey="install" name="Installation" stackId="a" fill={T.blue} />
            <Bar dataKey="grid" name="Grid/Cable" stackId="a" fill={T.green} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
        <SectionHeader title="Cost Reduction Levers" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          {[
            { lever: 'Scale-up (15→20MW turbines)', saving: '8-12%', timeline: '2026-2028' },
            { lever: 'Series production floaters', saving: '12-18%', timeline: '2027-2030' },
            { lever: 'Self-install tow-out ops', saving: '15-22%', timeline: '2026-2028' },
            { lever: 'Polyester mooring adoption', saving: '5-8%', timeline: '2026-2027' },
            { lever: 'Dynamic cable learning', saving: '10-15%', timeline: '2028-2032' },
            { lever: 'Standardized O&M SOV', saving: '6-10%', timeline: '2026-2030' },
          ].map(r => (
            <div key={r.lever} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, padding: 10 }}>
              <div style={{ fontSize: 11, color: T.text, fontWeight: 600, marginBottom: 4 }}>{r.lever}</div>
              <div style={{ fontSize: 13, color: T.green, fontWeight: 700 }}>{r.saving} cost reduction</div>
              <div style={{ fontSize: 10, color: T.sub }}>{r.timeline}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTechMaturity = () => (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Avg Platform TRL', value: `${(TRL_DATA.reduce((a, b) => a + b.trl, 0) / TRL_DATA.length).toFixed(1)}/9`, color: T.teal },
          { label: 'Commercial-Ready (TRL≥8)', value: `${TRL_DATA.filter(t => t.trl >= 8).length}`, unit: `of ${TRL_DATA.length} components`, color: T.green },
          { label: 'Needs Development (TRL<7)', value: `${TRL_DATA.filter(t => t.trl < 7).length}`, unit: 'components', color: T.amber },
          { label: 'Target TRL by 2030', value: '≥8', unit: 'all critical components', color: T.indigo },
        ].map(r => (
          <div key={r.label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '12px 14px' }}>
            <div style={{ fontSize: 10, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{r.label}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: r.color, fontFamily: 'monospace' }}>{r.value}</div>
            {r.unit && <div style={{ fontSize: 10, color: T.sub }}>{r.unit}</div>}
          </div>
        ))}
      </div>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <SectionHeader title="TRL Assessment by Component" />
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={TRL_DATA} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis type="number" domain={[0, 9]} ticks={[1, 2, 3, 4, 5, 6, 7, 8, 9]} tick={{ fontSize: 11, fill: T.sub }} />
            <YAxis dataKey="component" type="category" width={200} tick={{ fontSize: 10, fill: T.sub }} />
            <Tooltip />
            <ReferenceLine x={7} stroke={T.green} strokeDasharray="4 4" label={{ value: 'Commercial threshold', fill: T.green, fontSize: 10 }} />
            <Bar dataKey="trl" name="TRL Level" radius={[0, 4, 4, 0]}>
              {TRL_DATA.map((d, i) => <Cell key={i} fill={d.trl >= 8 ? T.green : d.trl >= 7 ? T.teal : d.trl >= 6 ? T.accent : T.red} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: T.navy }}>
              {['Component', 'TRL', 'Key Milestone', 'Commercial Scale by'].map(h => <th key={h} style={{ padding: '8px 12px', color: '#E2E8F0', textAlign: 'left' }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {TRL_DATA.map((r, i) => (
              <tr key={r.component} style={{ background: i % 2 === 0 ? T.bg : T.card, borderBottom: `1px solid ${T.border}` }}>
                <td style={{ padding: '8px 12px', color: T.text }}>{r.component}</td>
                <td style={{ padding: '8px 12px' }}>
                  <span style={{ background: r.trl >= 8 ? T.green : r.trl >= 7 ? T.teal : r.trl >= 6 ? T.amber : T.red, color: '#fff', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{r.trl}/9</span>
                </td>
                <td style={{ padding: '8px 12px', color: T.sub }}>{r.milestone}</td>
                <td style={{ padding: '8px 12px', color: r.achievable === 'Now' ? T.green : T.accent, fontWeight: 600 }}>{r.achievable}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
        <SectionHeader title="Technology Development Milestones (2020-2030)" />
        <div style={{ position: 'relative', paddingLeft: 20 }}>
          <div style={{ position: 'absolute', left: 8, top: 0, bottom: 0, width: 2, background: T.border }} />
          {[
            { year: '2017', event: 'Hywind Scotland — World\'s first commercial FOWT farm (30MW)', status: 'done' },
            { year: '2019', event: 'WindFloat Atlantic (25MW) — semi-sub first commissioning', status: 'done' },
            { year: '2021', event: 'Kincardine (50MW) — largest floating offshore wind farm', status: 'done' },
            { year: '2023', event: 'Hywind Tampen (88MW) — oil platform power supply pioneer', status: 'done' },
            { year: '2024', event: 'UK AR5 floating award (£196/MWh) + first 15MW turbine deployments', status: 'done' },
            { year: '2026', event: 'First GW-scale floating offshore projects FID (UK, Norway)', status: 'upcoming' },
            { year: '2028', event: 'Dynamic cable 132kV commercial qualification', status: 'upcoming' },
            { year: '2030', event: 'Target: all critical components TRL≥8, LCOE <$80/MWh', status: 'target' },
          ].map(m => (
            <div key={m.year} style={{ display: 'flex', gap: 12, marginBottom: 10, position: 'relative' }}>
              <div style={{ position: 'absolute', left: -16, width: 10, height: 10, borderRadius: '50%', background: m.status === 'done' ? T.green : m.status === 'upcoming' ? T.accent : T.indigo, marginTop: 3, border: `2px solid ${T.card}` }} />
              <div style={{ fontSize: 11, fontWeight: 700, color: T.accent, minWidth: 35 }}>{m.year}</div>
              <div style={{ fontSize: 11, color: m.status === 'done' ? T.text : T.sub }}>{m.event}</div>
              <div style={{ marginLeft: 'auto', fontSize: 10, color: m.status === 'done' ? T.green : m.status === 'upcoming' ? T.amber : T.indigo, fontWeight: 600, minWidth: 55, textAlign: 'right' }}>{m.status === 'done' ? 'Achieved' : m.status === 'upcoming' ? 'Planned' : 'Target'}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderWindResource = () => (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHeader title="Monthly AEP Contribution (GWh)" />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyAEP}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: T.sub }} />
              <YAxis tick={{ fontSize: 11, fill: T.sub }} />
              <Tooltip />
              <Bar dataKey="aep" name="AEP (GWh)" fill={T.indigo} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHeader title="CF Sensitivity to Hub Height" />
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={Array.from({ length: 9 }, (_, i) => {
              const hh = 80 + i * 10;
              const adjCf = Math.min(58, cfPct + (hh - hubHeight) * 0.06);
              return { height: `${hh}m`, cf: +adjCf.toFixed(1) };
            })}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="height" tick={{ fontSize: 11, fill: T.sub }} />
              <YAxis unit="%" tick={{ fontSize: 11, fill: T.sub }} />
              <Tooltip />
              <Line dataKey="cf" name="CF %" stroke={T.teal} strokeWidth={2} dot={{ r: 3 }} />
              <ReferenceLine x={`${hubHeight}m`} stroke={T.accent} strokeDasharray="4 4" label={{ value: 'Current', fill: T.accent, fontSize: 10 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <SectionHeader title="Weibull Wind Parameters & Site Statistics" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { label: 'Weibull k (shape)', value: (2.0 + sr(latitude * 3) * 0.4).toFixed(2), color: T.indigo },
            { label: 'Weibull A (scale m/s)', value: (8.5 + (latitude - 50) * 0.06 + sr(latitude * 7) * 1.2).toFixed(1), color: T.teal },
            { label: 'Mean Wind Speed', value: `${(9.2 + (latitude - 50) * 0.05).toFixed(1)} m/s`, color: T.accent },
            { label: 'P90 AEP (GWh)', value: Math.round(annualAEP * 0.93).toLocaleString(), color: T.green },
            { label: 'Turbulence Intensity', value: `${(5.5 + seaState * 0.8).toFixed(1)}%`, color: T.sub },
            { label: 'Significant Wave Ht', value: `${seaState.toFixed(1)} m Hs`, color: T.blue },
            { label: 'Offshore lat/resource', value: `${latitude}°N`, color: T.text },
            { label: 'Annual P50 AEP', value: `${annualAEP.toLocaleString()} GWh`, color: T.accent },
          ].map(r => (
            <div key={r.label} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, padding: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: T.sub, marginBottom: 4 }}>{r.label}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: r.color, fontFamily: 'monospace' }}>{r.value}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
        <SectionHeader title="Seasonal Production Profile — Wind Speed Distribution" />
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={Array.from({ length: 52 }, (_, i) => {
            const week = i + 1;
            const season = Math.sin((week - 10) * Math.PI / 26);
            const ws = 9.2 + season * 2.1 + (sr(week * 11) - 0.5) * 1.5;
            const cf = Math.min(65, Math.max(20, cfPct + season * 8 + (sr(week * 7) - 0.5) * 5));
            return { week, windSpeed: +ws.toFixed(1), cfWeekly: +cf.toFixed(1) };
          })}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="week" unit="w" tick={{ fontSize: 10, fill: T.sub }} />
            <YAxis yAxisId="ws" unit=" m/s" tick={{ fontSize: 10, fill: T.sub }} domain={[4, 16]} />
            <YAxis yAxisId="cf" orientation="right" unit="%" tick={{ fontSize: 10, fill: T.sub }} />
            <Tooltip />
            <Legend />
            <Line yAxisId="ws" dataKey="windSpeed" name="Wind Speed (m/s)" stroke={T.indigo} strokeWidth={1.5} dot={false} />
            <Line yAxisId="cf" dataKey="cfWeekly" name="Weekly CF %" stroke={T.accent} strokeWidth={1.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderGridUmbilical = () => (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Dynamic Cable Premium', value: '+38%', unit: 'vs static', color: T.red },
          { label: 'Cable Length Required', value: `${distanceShore} km`, unit: 'export route', color: T.accent },
          { label: 'Transmission Loss', value: `${(1.5 + distanceShore * 0.003).toFixed(1)}%`, unit: 'at rated power', color: T.amber },
          { label: 'Grid Interface Cost', value: `$${Math.round(capexGrid * farmCapacity * 1000 / 1e6).toLocaleString()}M`, unit: 'total', color: T.indigo },
        ].map(r => (
          <div key={r.label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '12px 14px' }}>
            <div style={{ fontSize: 10, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{r.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: r.color, fontFamily: 'monospace' }}>{r.value}</div>
            <div style={{ fontSize: 10, color: T.sub }}>{r.unit}</div>
          </div>
        ))}
      </div>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <SectionHeader title="Dynamic vs Static Cable Comparison" />
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: T.navy }}>
              {['Attribute', 'Dynamic Export Cable', 'Static Seabed Cable'].map(h => <th key={h} style={{ padding: '8px 12px', color: '#E2E8F0', textAlign: 'left' }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {[
              { attr: 'Required for Floating?', a: 'Yes (motion tolerant)', b: 'No — static only' },
              { attr: 'Cost premium', a: '+35-50% vs static', b: 'Baseline' },
              { attr: 'Fatigue cycles (25yr)', a: '10⁷–10⁸', b: '<10⁴' },
              { attr: 'Failure rate', a: '0.02/km/yr (emerging)', b: '0.004/km/yr' },
              { attr: 'TRL', a: '7/9 (oil/gas proven)', b: '9/9 (mature)' },
              { attr: 'Bend stiffener req.', a: 'Yes — critical design', b: 'No' },
              { attr: 'Max voltage', a: '66kV (in dev: 132kV)', b: '220kV+ proven' },
              { attr: 'Lead time', a: '48 weeks', b: '24-36 weeks' },
            ].map((row, i) => (
              <tr key={row.attr} style={{ background: i % 2 === 0 ? T.bg : T.card, borderBottom: `1px solid ${T.border}` }}>
                <td style={{ padding: '8px 12px', fontWeight: 600, color: T.text }}>{row.attr}</td>
                <td style={{ padding: '8px 12px', color: T.accent }}>{row.a}</td>
                <td style={{ padding: '8px 12px', color: T.sub }}>{row.b}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHeader title="HVDC Cable Parameters" />
          {[
            { label: 'Cable length', value: `${distanceShore} km` },
            { label: 'Transmission loss', value: `${(1.5 + distanceShore * 0.003).toFixed(2)}%` },
            { label: 'Cable rating', value: `${Math.ceil(farmCapacity / 1000) * 1000} MW` },
            { label: 'DC voltage', value: '±320kV' },
            { label: 'Converter loss', value: '~1.5%' },
            { label: 'HVDC cost', value: `$${Math.round(capexGrid * farmCapacity * 1000 / 1e6)}M` },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${T.border}` }}>
              <span style={{ fontSize: 12, color: T.text }}>{r.label}</span>
              <span style={{ fontSize: 12, color: T.accent, fontFamily: 'monospace' }}>{r.value}</span>
            </div>
          ))}
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHeader title="Grid Code Compliance" />
          {[
            { country: 'UK (NGET)', status: 'Compliant', note: 'G99 + offshore code' },
            { country: 'Germany (50Hertz)', status: 'In Review', note: 'VDE-AR-N 4120' },
            { country: 'Norway (Statnett)', status: 'Compliant', note: 'FIKS code' },
            { country: 'France (RTE)', status: 'Pending', note: 'RTEFR2024' },
            { country: 'Japan (TEPCO)', status: 'In Review', note: 'Grid reform 2023' },
          ].map(r => (
            <div key={r.country} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: `1px solid ${T.border}` }}>
              <div>
                <div style={{ fontSize: 12, color: T.text, fontWeight: 500 }}>{r.country}</div>
                <div style={{ fontSize: 10, color: T.sub }}>{r.note}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: r.status === 'Compliant' ? T.green : r.status === 'In Review' ? T.amber : T.red }}>{r.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSupplyChain = () => (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Critical Components', value: `${SUPPLY_CHAIN.filter(s => s.risk === 'Critical').length}`, unit: 'of 8 tracked', color: T.red },
          { label: 'Max Lead Time', value: `${Math.max(...SUPPLY_CHAIN.map(s => s.leadTime))} wks`, unit: 'subsea transformer', color: T.amber },
          { label: 'Avg Concentration', value: `${Math.round(SUPPLY_CHAIN.reduce((a, b) => a + b.concentration, 0) / SUPPLY_CHAIN.length)}%`, unit: 'top-3 suppliers', color: T.accent },
          { label: 'Procurement Risk', value: 'High', unit: 'overall rating', color: T.red },
        ].map(r => (
          <div key={r.label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '12px 14px' }}>
            <div style={{ fontSize: 10, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{r.label}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: r.color, fontFamily: 'monospace' }}>{r.value}</div>
            <div style={{ fontSize: 10, color: T.sub }}>{r.unit}</div>
          </div>
        ))}
      </div>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <SectionHeader title="Supply Chain Risk Assessment" />
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: T.navy }}>
              {['Component', 'Lead Time (wks)', 'Top-3 Concentration', 'Bottleneck Score', 'Risk Level'].map(h => <th key={h} style={{ padding: '8px 12px', color: '#E2E8F0', textAlign: 'left' }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {SUPPLY_CHAIN.map((r, i) => {
              const score = Math.round((r.leadTime / 60 * 50) + (r.concentration / 100 * 50));
              const riskColor = r.risk === 'Critical' ? T.red : r.risk === 'High' ? T.amber : r.risk === 'Medium' ? T.accent : T.green;
              return (
                <tr key={r.component} style={{ background: i % 2 === 0 ? T.bg : T.card, borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '8px 12px', color: T.text, fontWeight: 500 }}>{r.component}</td>
                  <td style={{ padding: '8px 12px', color: T.text, fontFamily: 'monospace' }}>{r.leadTime}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ flex: 1, background: T.border, borderRadius: 4, height: 6 }}>
                        <div style={{ width: `${r.concentration}%`, background: riskColor, height: 6, borderRadius: 4 }} />
                      </div>
                      <span style={{ fontSize: 11, color: riskColor, minWidth: 30 }}>{r.concentration}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '8px 12px', fontFamily: 'monospace', color: T.text }}>{score}/100</td>
                  <td style={{ padding: '8px 12px' }}>
                    <span style={{ background: riskColor, color: '#fff', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{r.risk}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
        <SectionHeader title="Supply Chain Heatmap (Lead Time × Concentration)" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {SUPPLY_CHAIN.map(r => {
            const intensity = Math.min(1, (r.leadTime / 60 * 0.5 + r.concentration / 100 * 0.5));
            const bg = r.risk === 'Critical' ? `rgba(153,27,27,${0.15 + intensity * 0.5})` : r.risk === 'High' ? `rgba(146,64,14,${0.15 + intensity * 0.4})` : `rgba(15,118,110,${0.1 + intensity * 0.3})`;
            return (
              <div key={r.component} style={{ background: bg, border: `1px solid ${T.border}`, borderRadius: 6, padding: 10, textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: T.text, fontWeight: 600, marginBottom: 4 }}>{r.component}</div>
                <div style={{ fontSize: 11, color: T.sub }}>{r.leadTime}w / {r.concentration}%</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: r.risk === 'Critical' ? T.red : r.risk === 'High' ? T.amber : T.teal, marginTop: 3 }}>{r.risk}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderEnvironmental = () => (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHeader title="Environmental Footprint Comparison" />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={[
              { name: 'Floating FOWT', seabed: 0.8, shadow: 2.2 },
              { name: 'Fixed-Bottom', seabed: 3.5, shadow: 4.8 },
              { name: 'Oil Platform', seabed: 8.2, shadow: 6.1 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.sub }} />
              <YAxis unit=" ha/MW" tick={{ fontSize: 11, fill: T.sub }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="seabed" name="Seabed Footprint (ha/MW)" fill={T.indigo} radius={[3, 3, 0, 0]} />
              <Bar dataKey="shadow" name="Acoustic Shadow (ha/MW)" fill={T.teal} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHeader title="Environmental Risk Register" />
          {[
            { risk: 'MPA proximity', level: 'Medium', mitigation: '>3 km buffer maintained' },
            { risk: 'Migratory bird routes', level: 'Low', mitigation: 'Blade marking + radar curtailment' },
            { risk: 'Marine mammal noise', level: 'Medium', mitigation: 'Soft-start protocols during piling' },
            { risk: 'Decommissioning obligation', level: 'Regulatory', mitigation: 'Bond posted per MSA' },
            { risk: 'Shipping lane intersection', level: 'Low', mitigation: 'IALA marked exclusion zone' },
            { risk: 'Habitat disturbance', level: 'Low', mitigation: 'Dynamic cable route survey' },
          ].map(r => {
            const c = r.level === 'Medium' ? T.amber : r.level === 'Regulatory' ? T.indigo : T.green;
            return (
              <div key={r.risk} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '6px 0', borderBottom: `1px solid ${T.border}` }}>
                <span style={{ background: c, color: '#fff', borderRadius: 3, padding: '1px 6px', fontSize: 10, fontWeight: 700, minWidth: 70, textAlign: 'center', marginTop: 1 }}>{r.level}</span>
                <div>
                  <div style={{ fontSize: 12, color: T.text, fontWeight: 500 }}>{r.risk}</div>
                  <div style={{ fontSize: 11, color: T.sub }}>{r.mitigation}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHeader title="Lifecycle Carbon Intensity (gCO2e/kWh)" />
          <ResponsiveContainer width="100%" height={180}>
            <BarChart layout="vertical" data={[
              { tech: 'Floating FOWT', lca: 14 },
              { tech: 'Fixed-Bottom OWF', lca: 12 },
              { tech: 'Onshore Wind', lca: 7 },
              { tech: 'Solar PV (utility)', lca: 38 },
              { tech: 'CCGT Gas', lca: 410 },
              { tech: 'Coal', lca: 820 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" unit=" gCO2e" tick={{ fontSize: 11, fill: T.sub }} />
              <YAxis dataKey="tech" type="category" width={130} tick={{ fontSize: 10, fill: T.sub }} />
              <Tooltip />
              <Bar dataKey="lca" name="LCA carbon intensity" radius={[0, 4, 4, 0]}>
                {[T.green, T.teal, T.green, T.accent, T.amber, T.red].map((c, i) => <Cell key={i} fill={c} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHeader title="Decommissioning Plan Summary" />
          {[
            { label: 'Decommission year', value: `Year ${projectLife} (post-life)` },
            { label: 'Mooring retrieval', value: 'AHV reverse-lay' },
            { label: 'Floater tow-back', value: 'To port for recycling' },
            { label: 'Cable removal', value: 'Cut & grout at seabed' },
            { label: 'Seabed restoration', value: 'Monitoring 2 yrs post-removal' },
            { label: 'Steel recycling rate', value: '~90% floater steel' },
            { label: 'Blade end-of-life', value: 'Co-processing cement kilns' },
            { label: 'Decom. cost est.', value: `$${Math.round(totalCapexM * 0.08).toLocaleString()}M (~8% CAPEX)` },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${T.border}` }}>
              <span style={{ fontSize: 12, color: T.sub }}>{r.label}</span>
              <span style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>{r.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderCorporatePPA = () => (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHeader title="CfD Contract Structure (UK AR5)" />
          {[
            { label: 'Strike Price (AR5 2024)', value: `£${strikePrice}/MWh`, color: T.accent },
            { label: 'Reference Price', value: '£52/MWh (2024 avg)', color: T.sub },
            { label: 'CfD Top-up', value: `£${Math.max(0, strikePrice - 52)}/MWh`, color: T.green },
            { label: 'Contract Duration', value: '15 years', color: T.indigo },
            { label: 'CPI Indexation', value: 'Yes — annual RPI/CPI', color: T.text },
            { label: 'Capacity (farm)', value: `${farmCapacity} MW`, color: T.accent },
            { label: 'Annual CfD payment est.', value: `£${Math.round(annualAEP * 1000 * Math.max(0, strikePrice - 52) / 1e6)}M`, color: T.green },
            { label: 'Curtailment clause', value: 'Yes — negative price', color: T.sub },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${T.border}` }}>
              <span style={{ fontSize: 12, color: T.text }}>{r.label}</span>
              <span style={{ fontSize: 12, color: r.color, fontWeight: 600 }}>{r.value}</span>
            </div>
          ))}
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHeader title="Corporate PPA Potential" />
          {[
            { label: 'PPA market', value: 'Tech + Industrial buyers', color: T.text },
            { label: 'Typical PPA tenor', value: '10-15 years', color: T.indigo },
            { label: 'PPA price range', value: '$85-140/MWh', color: T.accent },
            { label: 'RE100 alignment', value: 'Full — 24/7 additionality', color: T.green },
            { label: 'Sleeved vs physical', value: 'Physical preferred', color: T.teal },
            { label: 'Basis risk', value: 'Offshore nodal vs load', color: T.amber },
            { label: 'PPA vs CfD breakeven', value: `>${Math.round(lcoe * 1.05).toFixed(0)}/MWh`, color: T.accent },
            { label: 'Credit req. (offtaker)', value: 'Investment grade BBB+ min', color: T.sub },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${T.border}` }}>
              <span style={{ fontSize: 12, color: T.text }}>{r.label}</span>
              <span style={{ fontSize: 12, color: r.color, fontWeight: 600 }}>{r.value}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <SectionHeader title="CfD Revenue Profile vs Reference Price ($/MWh nominal)" />
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={Array.from({ length: 15 }, (_, i) => {
            const yr = 2025 + i;
            const refPrice = 52 + i * 3.5 + sr(i * 7) * 8;
            const cfDPay = Math.max(0, strikePrice - refPrice);
            return { year: yr, refPrice: +refPrice.toFixed(1), strikePrice, cfdPayment: +cfDPay.toFixed(1) };
          })}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.sub }} />
            <YAxis unit=" $/MWh" tick={{ fontSize: 11, fill: T.sub }} />
            <Tooltip />
            <Legend />
            <Line dataKey="strikePrice" name="Strike Price" stroke={T.accent} strokeWidth={2} dot={false} strokeDasharray="5 5" />
            <Line dataKey="refPrice" name="Reference Price" stroke={T.indigo} strokeWidth={2} dot={false} />
            <Line dataKey="cfdPayment" name="CfD Top-up" stroke={T.green} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
        <SectionHeader title="RE100 Corporate Buyer Landscape" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {[
            { sector: 'Technology (Hyperscalers)', appetite: 'Very High', size: '>500 MW', target: '24/7 clean energy', examples: 'Google, Microsoft, Meta' },
            { sector: 'Steel / Heavy Industry', appetite: 'High', size: '100-500 MW', target: 'Scope 2 + DRI electrolysis', examples: 'ArcelorMittal, SSAB' },
            { sector: 'Chemicals & Petrochems', appetite: 'Medium', size: '50-200 MW', target: 'Green hydrogen feedstock', examples: 'BASF, Yara' },
            { sector: 'Automotive OEMs', appetite: 'High', size: '100-300 MW', target: 'EV supply chain decarbonisation', examples: 'BMW, Volkswagen' },
            { sector: 'Maritime / Shipping', appetite: 'Medium', size: '50-150 MW', target: 'E-methanol / ammonia bunker', examples: 'Maersk, Stena' },
            { sector: 'Data Centre Developers', appetite: 'Very High', size: '200-1000 MW', target: 'PUE reduction + RE matching', examples: 'Equinix, Digital Realty' },
          ].map(r => (
            <div key={r.sector} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, padding: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.text, marginBottom: 4 }}>{r.sector}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 10, color: T.sub }}>Appetite:</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: r.appetite === 'Very High' ? T.green : r.appetite === 'High' ? T.teal : T.amber }}>{r.appetite}</span>
              </div>
              <div style={{ fontSize: 10, color: T.sub }}>PPA size: {r.size}</div>
              <div style={{ fontSize: 10, color: T.indigo, marginTop: 2 }}>{r.target}</div>
              <div style={{ fontSize: 10, color: T.sub, marginTop: 2, fontStyle: 'italic' }}>{r.examples}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderCountryPipeline = () => (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Global FOWT Installed', value: `${COUNTRIES.reduce((a, c) => a + c.installed, 0)} MW`, color: T.green },
          { label: 'Global Pipeline', value: `${(COUNTRIES.reduce((a, c) => a + c.pipeline, 0) / 1000).toFixed(1)} GW`, color: T.indigo },
          { label: 'Aggregate 2030 Target', value: `${(COUNTRIES.reduce((a, c) => a + c.target, 0) / 1000).toFixed(0)} GW`, color: T.accent },
          { label: 'Countries with Targets', value: `${COUNTRIES.filter(c => c.policy !== 'Emerging').length}`, unit: 'of 8 surveyed', color: T.teal },
        ].map(r => (
          <div key={r.label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '12px 14px' }}>
            <div style={{ fontSize: 10, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{r.label}</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: r.color, fontFamily: 'monospace' }}>{r.value}</div>
            {r.unit && <div style={{ fontSize: 10, color: T.sub }}>{r.unit}</div>}
          </div>
        ))}
      </div>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <SectionHeader title="Global Floating Offshore Wind Pipeline (MW)" />
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={COUNTRIES}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: T.sub }} />
            <YAxis tick={{ fontSize: 11, fill: T.sub }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="installed" name="Installed MW" fill={T.green} stackId="a" />
            <Bar dataKey="pipeline" name="Pipeline MW" fill={T.indigo} stackId="a" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ background: T.navy }}>
              {['Country', 'Installed', 'Pipeline', 'Target', 'Policy', 'Grid Tariff', 'Key Project'].map(h => <th key={h} style={{ padding: '8px 10px', color: '#E2E8F0', textAlign: 'left' }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {COUNTRIES.map((c, i) => (
              <tr key={c.name} style={{ background: i % 2 === 0 ? T.bg : T.card, borderBottom: `1px solid ${T.border}` }}>
                <td style={{ padding: '7px 10px', fontWeight: 600, color: T.text }}>{c.name}</td>
                <td style={{ padding: '7px 10px', color: T.green, fontFamily: 'monospace' }}>{c.installed}</td>
                <td style={{ padding: '7px 10px', color: T.indigo, fontFamily: 'monospace' }}>{c.pipeline.toLocaleString()}</td>
                <td style={{ padding: '7px 10px', color: T.accent, fontFamily: 'monospace' }}>{c.target.toLocaleString()}</td>
                <td style={{ padding: '7px 10px' }}>
                  <span style={{ background: c.policy === 'Very Strong' ? T.green : c.policy === 'Strong' ? T.teal : c.policy === 'Moderate' ? T.amber : T.red, color: '#fff', borderRadius: 3, padding: '1px 6px', fontSize: 10 }}>{c.policy}</span>
                </td>
                <td style={{ padding: '7px 10px', color: T.sub }}>{c.tariff}</td>
                <td style={{ padding: '7px 10px', color: T.sub }}>{c.project}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderScenarios = () => (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHeader title="Scenario LCOE Comparison ($/MWh)" />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={scenarioData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: T.sub }} />
              <YAxis unit=" $/MWh" tick={{ fontSize: 11, fill: T.sub }} />
              <Tooltip formatter={v => [`${v} $/MWh`]} />
              <ReferenceLine y={strikePrice} stroke={T.green} strokeDasharray="4 4" label={{ value: 'CfD Strike', fill: T.green, fontSize: 10 }} />
              <Bar dataKey="lcoe" name="LCOE" radius={[4, 4, 0, 0]}>
                {scenarioData.map((s, i) => <Cell key={i} fill={s.lcoe < strikePrice ? T.green : T.red} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHeader title="Scenario Financial Summary" />
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.navy }}>
                {['Scenario', 'LCOE $/MWh', 'IRR %', 'NPV $M'].map(h => <th key={h} style={{ padding: '7px 10px', color: '#E2E8F0', textAlign: 'left' }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {scenarioData.map((s, i) => (
                <tr key={s.name} style={{ background: i % 2 === 0 ? T.bg : T.card, borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '7px 10px', color: T.text, fontWeight: 500 }}>{s.name}</td>
                  <td style={{ padding: '7px 10px', color: s.lcoe < strikePrice ? T.green : T.red, fontFamily: 'monospace' }}>{s.lcoe}</td>
                  <td style={{ padding: '7px 10px', color: s.irr > discountRate ? T.green : T.red, fontFamily: 'monospace' }}>{s.irr}%</td>
                  <td style={{ padding: '7px 10px', color: s.npv >= 0 ? T.green : T.red, fontFamily: 'monospace' }}>{s.npv >= 0 ? '+' : ''}{s.npv.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <SectionHeader title="Break-even PPA Price by Scenario ($/MWh)" />
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={scenarioData}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: T.sub }} />
            <YAxis unit=" $/MWh" tick={{ fontSize: 11, fill: T.sub }} />
            <Tooltip formatter={v => [`${v} $/MWh`, 'Break-even PPA']} />
            <ReferenceLine y={strikePrice} stroke={T.teal} strokeDasharray="4 4" label={{ value: `CfD ${strikePrice}`, fill: T.teal, fontSize: 10 }} />
            <Bar dataKey="breakeven" name="Break-even PPA" fill={T.indigo} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {scenarioData.map(s => (
          <div key={s.name} style={{ background: s.irr > discountRate ? `${T.green}12` : `${T.red}12`, border: `1px solid ${s.irr > discountRate ? T.green : T.red}`, borderRadius: 8, padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.text, marginBottom: 8 }}>{s.name}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.irr > discountRate ? T.green : T.red, fontFamily: 'monospace' }}>{s.irr}%</div>
            <div style={{ fontSize: 10, color: T.sub, marginBottom: 6 }}>IRR</div>
            <div style={{ fontSize: 12, color: T.accent, fontFamily: 'monospace' }}>{s.lcoe} $/MWh LCOE</div>
            <div style={{ fontSize: 12, color: s.npv >= 0 ? T.green : T.red, fontFamily: 'monospace' }}>{s.npv >= 0 ? '+' : ''}${s.npv.toLocaleString()}M NPV</div>
            <div style={{ fontSize: 10, color: T.sub, marginTop: 6 }}>Break-even: {s.breakeven} $/MWh</div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderProjectFinance = () => {
    const drawdownData = Array.from({ length: 12 }, (_, i) => {
      const q = i + 1;
      const cumPct = Math.min(100, q * 8.5 + sr(q * 3) * 2);
      return { quarter: `Q${q}`, drawdown: Math.round(totalCapexM * 0.085 + sr(q * 5) * totalCapexM * 0.015), cumulative: Math.round(totalCapexM * cumPct / 100) };
    });
    return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHeader title="DSCR Profile Over Project Life" />
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={dscrProfile}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" unit="yr" tick={{ fontSize: 11, fill: T.sub }} />
              <YAxis yAxisId="dscr" tick={{ fontSize: 11, fill: T.sub }} domain={[0, 3]} />
              <YAxis yAxisId="cfds" orientation="right" unit="M" tick={{ fontSize: 11, fill: T.sub }} />
              <Tooltip />
              <Legend />
              <ReferenceLine yAxisId="dscr" y={1.25} stroke={T.red} strokeDasharray="4 4" label={{ value: 'Min DSCR 1.25x', fill: T.red, fontSize: 10 }} />
              <Line yAxisId="dscr" dataKey="dscr" name="DSCR" stroke={T.indigo} strokeWidth={2} dot={{ r: 2 }} connectNulls={false} />
              <Bar yAxisId="cfds" dataKey="cfds" name="CFDS $M" fill={T.teal} opacity={0.4} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHeader title="Capital Structure" />
          {[
            { label: 'Total CAPEX', value: `$${totalCapexM.toLocaleString()}M`, color: T.text },
            { label: 'Equity', value: `${equityPct}% / $${Math.round(totalCapexM * equityPct / 100).toLocaleString()}M`, color: T.accent },
            { label: 'Debt', value: `${100 - equityPct}% / $${Math.round(totalCapexM * (100 - equityPct) / 100).toLocaleString()}M`, color: T.indigo },
            { label: 'Loan Tenor', value: '18 years', color: T.teal },
            { label: 'Debt Rate (est.)', value: `${(discountRate * 0.65).toFixed(2)}%`, color: T.sub },
            { label: 'Min DSCR req.', value: '1.25×', color: T.red },
            { label: 'Blended WACC', value: `${discountRate}%`, color: T.accent },
            { label: 'Construction period', value: '36-48 months', color: T.sub },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${T.border}` }}>
              <span style={{ fontSize: 11, color: T.text }}>{r.label}</span>
              <span style={{ fontSize: 11, color: r.color, fontWeight: 600, fontFamily: 'monospace' }}>{r.value}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <SectionHeader title="Construction Finance — Quarterly Drawdown ($M)" />
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={drawdownData}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="quarter" tick={{ fontSize: 11, fill: T.sub }} />
            <YAxis yAxisId="dd" tick={{ fontSize: 11, fill: T.sub }} unit="M" />
            <YAxis yAxisId="cum" orientation="right" tick={{ fontSize: 11, fill: T.sub }} unit="M" />
            <Tooltip formatter={v => [`$${v}M`]} />
            <Legend />
            <Bar yAxisId="dd" dataKey="drawdown" name="Quarterly Draw ($M)" fill={T.indigo} radius={[3, 3, 0, 0]} />
            <Line yAxisId="cum" dataKey="cumulative" name="Cumulative ($M)" stroke={T.accent} strokeWidth={2} dot={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        {[
          { label: 'Debt sizing (DSCR 1.25×)', value: `$${Math.round(totalCapexM * (100 - equityPct) / 100).toLocaleString()}M`, color: T.indigo },
          { label: 'Equity IRR target', value: `>${(discountRate + 3).toFixed(1)}%`, color: T.accent },
          { label: 'Project IRR (base)', value: `${irrVal.toFixed(2)}%`, color: irrVal > discountRate ? T.green : T.red },
          { label: 'Min DSCR (calc)', value: `${dscrProfile.filter(d => d.dscr !== null).length > 0 ? Math.min(...dscrProfile.filter(d => d.dscr !== null).map(d => d.dscr)).toFixed(2) : 'N/A'}×`, color: T.teal },
          { label: 'Interest during construction', value: `$${Math.round(totalCapexM * (100 - equityPct) / 100 * discountRate * 0.65 / 100 * 3).toLocaleString()}M`, color: T.sub },
          { label: 'Total financing cost', value: `${((discountRate * equityPct / 100) + (discountRate * 0.65 * (100 - equityPct) / 100)).toFixed(2)}% WACC`, color: T.accent },
        ].map(r => (
          <div key={r.label} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, padding: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: T.sub, marginBottom: 4 }}>{r.label}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: r.color, fontFamily: 'monospace' }}>{r.value}</div>
          </div>
        ))}
      </div>
    </div>
    );
  };

  const renderPolicyCfD = () => (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHeader title="UK CfD — Allocation Round 5" />
          {[
            { label: 'Strike Price (Floating)', value: `£${strikePrice}/MWh`, color: T.accent },
            { label: 'AR5 Pot 2 (offshore)', value: '£285/MWh cap', color: T.sub },
            { label: 'Auction cleared price', value: '£196/MWh', color: T.green },
            { label: 'AR5 capacity awarded', value: '2.6 GW total', color: T.indigo },
            { label: 'Floating offshore share', value: '~300 MW', color: T.teal },
            { label: 'Next round (AR6)', value: '2025 planned', color: T.text },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${T.border}` }}>
              <span style={{ fontSize: 12, color: T.text }}>{r.label}</span>
              <span style={{ fontSize: 12, color: r.color, fontWeight: 600 }}>{r.value}</span>
            </div>
          ))}
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHeader title="EU & US Policy Support" />
          {[
            { label: 'EU Innovation Fund', value: 'Up to €300M/project', color: T.indigo },
            { label: 'EU NER300 (legacy)', value: 'Closed — successor pending', color: T.sub },
            { label: 'IRA PTC (US floating)', value: '$27.5/MWh (10yr)', color: T.green },
            { label: 'IRA ITC (US floating)', value: '30% direct pay option', color: T.green },
            { label: 'Norway state support', value: 'Enova grants + guarantees', color: T.teal },
            { label: 'Japan FIT (FOWT)', value: '¥36/kWh (2024)', color: T.accent },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${T.border}` }}>
              <span style={{ fontSize: 12, color: T.text }}>{r.label}</span>
              <span style={{ fontSize: 12, color: r.color, fontWeight: 600 }}>{r.value}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
        <SectionHeader title="Country Policy Comparison" />
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: T.navy }}>
              {['Country', 'Support Mechanism', 'Value', '2030 FOWT Target', 'Rating'].map(h => <th key={h} style={{ padding: '8px 12px', color: '#E2E8F0', textAlign: 'left' }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {[
              { country: 'UK', mechanism: 'CfD (AR5)', value: '£196/MWh', target: '5 GW', rating: 'A+' },
              { country: 'Norway', mechanism: 'Enova Grants + OED', value: '€80-100M', target: '3 GW', rating: 'A' },
              { country: 'Japan', mechanism: 'FIT/FIP', value: '¥36/kWh', target: '10 GW', rating: 'A-' },
              { country: 'South Korea', mechanism: 'REC + offshore tariff', value: '₩180/kWh', target: '12 GW', rating: 'B+' },
              { country: 'USA', mechanism: 'IRA PTC/ITC', value: '$27.5/MWh', target: '15 GW', rating: 'B+' },
              { country: 'France', mechanism: 'Appels d\'offres CRE', value: '€150/MWh', target: '2 GW', rating: 'B' },
            ].map((r, i) => (
              <tr key={r.country} style={{ background: i % 2 === 0 ? T.bg : T.card, borderBottom: `1px solid ${T.border}` }}>
                <td style={{ padding: '8px 12px', fontWeight: 600, color: T.text }}>{r.country}</td>
                <td style={{ padding: '8px 12px', color: T.sub }}>{r.mechanism}</td>
                <td style={{ padding: '8px 12px', color: T.accent, fontFamily: 'monospace' }}>{r.value}</td>
                <td style={{ padding: '8px 12px', color: T.indigo, fontFamily: 'monospace' }}>{r.target}</td>
                <td style={{ padding: '8px 12px' }}>
                  <span style={{ background: r.rating.startsWith('A') ? T.green : T.amber, color: '#fff', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{r.rating}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderInvestmentSummary = () => (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHeader title="Site & Technology Selection" />
          {[
            { label: 'Site coordinates', value: `${latitude}°N, deep water` },
            { label: 'Water depth', value: `${waterDepth} m` },
            { label: 'Distance to shore', value: `${distanceShore} km` },
            { label: 'Floater concept', value: floaterConcept },
            { label: 'Turbine rating', value: `${turbineRating} MW / ${rotorDiameter}m rotor` },
            { label: 'Farm capacity', value: `${farmCapacity} MW` },
            { label: 'No. of turbines', value: `${Math.ceil(farmCapacity / turbineRating)} units` },
            { label: 'Mooring system', value: `${mooringType} (${mooringLines} lines/turbine)` },
            { label: 'Total mooring lines', value: `${mooringLines * Math.ceil(farmCapacity / turbineRating)} lines` },
            { label: 'Cable type', value: `Dynamic export + ${distanceShore > 120 ? 'HVDC' : 'HVAC'}` },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${T.border}` }}>
              <span style={{ fontSize: 12, color: T.sub }}>{r.label}</span>
              <span style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>{r.value}</span>
            </div>
          ))}
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHeader title="Financial Metrics" />
          {[
            { label: 'Total CAPEX', value: `$${totalCapexM.toLocaleString()}M ($${capexPerKw.toLocaleString()}/kW)`, color: T.text },
            { label: 'LCOE (base)', value: `$${lcoe.toFixed(1)}/MWh`, color: T.accent },
            { label: 'CfD/PPA Strike', value: `£${strikePrice}/MWh`, color: T.green },
            { label: 'LCOE vs Strike margin', value: `${(strikePrice - lcoe).toFixed(1)} $/MWh ${lcoe < strikePrice ? '(viable)' : '(uneconomic)'}`, color: lcoe < strikePrice ? T.green : T.red },
            { label: 'Farm AEP', value: `${annualAEP.toLocaleString()} GWh/yr`, color: T.indigo },
            { label: 'Capacity Factor', value: `${cfPct.toFixed(1)}%`, color: T.teal },
            { label: 'Annual Revenue (est.)', value: `$${Math.round(annualAEP * 1000 * strikePrice / 1e9).toLocaleString()}B/yr`, color: T.green },
            { label: 'Annual OpEx', value: `$${Math.round(opex * farmCapacity * 1000 / 1e6).toLocaleString()}M/yr`, color: T.sub },
            { label: 'Project IRR', value: `${irrVal.toFixed(2)}% vs ${discountRate}% WACC`, color: irrVal > discountRate ? T.green : T.red },
            { label: 'NPV (equity)', value: `${npvM >= 0 ? '+' : ''}$${npvM.toLocaleString()}M`, color: npvM >= 0 ? T.green : T.red },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${T.border}` }}>
              <span style={{ fontSize: 12, color: T.sub }}>{r.label}</span>
              <span style={{ fontSize: 12, color: r.color || T.text, fontWeight: 600 }}>{r.value}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <SectionHeader title="IRR Sensitivity to CAPEX & CF" />
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={[-20,-15,-10,-5,0,5,10,15,20].map(delta => {
            const adjCapex = capexPerKw * (1 + delta / 100);
            const capexTotal = adjCapex * farmCapacity * 1000;
            const annualRev = annualAEP * 1000 * (strikePrice / 1000);
            const annualOpexTotal = opex * farmCapacity * 1000;
            const cfModel = [-capexTotal, ...Array.from({ length: projectLife }, () => annualRev - annualOpexTotal)];
            const irrCapex = calcIRR(cfModel) * 100;
            const adjCf = Math.max(25, cfPct + delta * 0.2);
            const adjAEP = farmCapacity * (adjCf / 100) * 8760;
            const revCF = adjAEP * (strikePrice / 1000);
            const cfModelCF = [-capexPerKw * farmCapacity * 1000, ...Array.from({ length: projectLife }, () => revCF - annualOpexTotal)];
            const irrCF = calcIRR(cfModelCF) * 100;
            return { delta: `${delta > 0 ? '+' : ''}${delta}%`, irrCapex: +irrCapex.toFixed(2), irrCF: +irrCF.toFixed(2) };
          })}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="delta" tick={{ fontSize: 10, fill: T.sub }} />
            <YAxis unit="%" tick={{ fontSize: 11, fill: T.sub }} />
            <Tooltip formatter={v => [`${v}% IRR`]} />
            <Legend />
            <Line dataKey="irrCapex" name="IRR (CAPEX sensitivity)" stroke={T.accent} strokeWidth={2} dot={{ r: 2 }} />
            <Line dataKey="irrCF" name="IRR (CF sensitivity)" stroke={T.teal} strokeWidth={2} dot={{ r: 2 }} />
            <ReferenceLine y={discountRate} stroke={T.red} strokeDasharray="4 4" label={{ value: `WACC ${discountRate}%`, fill: T.red, fontSize: 10 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <SectionHeader title="Key Risks" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {[
            { risk: 'Dynamic cable fatigue failure', likelihood: 'Medium', impact: 'High', mitigation: 'Redundant umbilical + condition monitoring' },
            { risk: 'CAPEX overrun (technology risk)', likelihood: 'High', impact: 'High', mitigation: 'Fixed-price EPC with LD provisions' },
            { risk: 'Weather window shortfall', likelihood: 'Medium', impact: 'Medium', mitigation: 'Buffer in construction schedule + insurance' },
            { risk: 'Supply chain delay (cables)', likelihood: 'High', impact: 'High', mitigation: 'Long-lead procurement & frame agreements' },
            { risk: 'CfD reference price spike curtailment', likelihood: 'Low', impact: 'Medium', mitigation: 'Floor price analysis + revenue modelling' },
            { risk: 'Regulatory/planning delay', likelihood: 'Medium', impact: 'High', mitigation: 'Early EIA + community engagement' },
          ].map(r => {
            const lc = r.likelihood === 'High' ? T.red : r.likelihood === 'Medium' ? T.amber : T.green;
            return (
              <div key={r.risk} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, padding: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.text, marginBottom: 4 }}>{r.risk}</div>
                <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                  <span style={{ background: lc, color: '#fff', borderRadius: 3, padding: '1px 5px', fontSize: 9 }}>L:{r.likelihood}</span>
                  <span style={{ background: T.indigo, color: '#fff', borderRadius: 3, padding: '1px 5px', fontSize: 9 }}>I:{r.impact}</span>
                </div>
                <div style={{ fontSize: 10, color: T.teal }}>{r.mitigation}</div>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ background: `${T.accent}15`, border: `1px solid ${T.accent}`, borderRadius: 8, padding: 16 }}>
        <SectionHeader title="Next Steps" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            'Front-End Engineering Design (FEED) — 18 months',
            'Environmental Impact Assessment (EIA) — parallel track',
            'Grid connection application to TSO',
            'AR6 CfD pre-qualification & application',
            'Dynamic cable supplier qualification & LOI',
            'Port & yard capacity reservation (fabrication)',
            'Metocean campaign (12-month minimum)',
            'Geotechnical survey (mooring anchor design)',
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span style={{ color: T.accent, fontWeight: 700, fontSize: 13, minWidth: 18 }}>{i + 1}.</span>
              <span style={{ fontSize: 12, color: T.text }}>{s}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const TAB_RENDERERS = [
    renderOverview, renderLCOEBreakdown, renderFloaterTechnology, renderMooringSystem,
    renderInstallation, renderAEPDistance, renderCostTrajectory, renderTechMaturity,
    renderWindResource, renderGridUmbilical, renderSupplyChain, renderEnvironmental,
    renderCorporatePPA, renderCountryPipeline, renderScenarios, renderProjectFinance,
    renderPolicyCfD, renderInvestmentSummary,
  ];

  const SidebarSection = ({ id, title, children }) => (
    <div style={{ marginBottom: 8, borderBottom: `1px solid #1E293B` }}>
      <button onClick={() => toggleSection(id)} style={{ width: '100%', background: 'none', border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', cursor: 'pointer', color: T.accent, fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        {title}
        <span style={{ color: '#475569', fontSize: 14 }}>{collapsed[id] ? '▸' : '▾'}</span>
      </button>
      {!collapsed[id] && <div style={{ paddingBottom: 8 }}>{children}</div>}
    </div>
  );

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: T.bg, fontFamily: 'DM Sans, sans-serif', color: T.text }}>
      {/* LEFT SIDEBAR */}
      <div style={{ width: 280, minWidth: 280, background: T.navy, borderRight: `2px solid ${T.accent}`, overflowY: 'auto', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 0 }}>
        <div style={{ borderBottom: `2px solid ${T.accent}`, paddingBottom: 10, marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>EP-DR2</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#F1F5F9', lineHeight: 1.3, marginTop: 2 }}>Floating Offshore Wind</div>
          <div style={{ fontSize: 11, color: T.accent, marginTop: 2 }}>LCOE & Technology Analytics</div>
        </div>

        {/* Quick Stats */}
        <div style={{ background: '#0F172A', borderRadius: 8, padding: '10px 12px', marginBottom: 14, border: `1px solid #1E293B` }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { l: 'LCOE', v: `${lcoe.toFixed(1)} $/MWh`, c: T.accent },
              { l: 'CapEx', v: `$${totalCapexM.toLocaleString()}M`, c: '#94A3B8' },
              { l: 'AEP', v: `${annualAEP.toLocaleString()} GWh`, c: T.teal },
              { l: 'CF', v: `${cfPct.toFixed(1)}%`, c: T.green },
            ].map(s => (
              <div key={s.l} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>{s.l}</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: s.c, fontFamily: 'JetBrains Mono, monospace' }}>{s.v}</div>
              </div>
            ))}
          </div>
        </div>

        <SidebarSection id="site" title="Site Parameters">
          <SliderRow label="Water Depth" value={waterDepth} min={50} max={2000} step={10} onChange={setWaterDepth} unit="m" />
          <SliderRow label="Distance to Shore" value={distanceShore} min={20} max={500} step={5} onChange={setDistanceShore} unit="km" />
          <SliderRow label="Sea State (Hs)" value={seaState} min={1} max={8} step={0.5} onChange={setSeaState} unit="m" />
          <SliderRow label="Latitude" value={latitude} min={40} max={75} step={1} onChange={setLatitude} unit="°N" />
          <SelectRow label="Seabed Type" value={seabedType} options={['Rock', 'Sand', 'Clay']} onChange={setSeabedType} />
        </SidebarSection>

        <SidebarSection id="floater" title="Floater Concept">
          <SelectRow label="Floater Type" value={floaterConcept} options={['Spar-Buoy', 'Semi-submersible', 'Tension Leg Platform', 'Barge']} onChange={setFloaterConcept} />
          <SliderRow label="Mooring Lines" value={mooringLines} min={3} max={12} step={1} onChange={setMooringLines} unit="" />
          <SelectRow label="Mooring Type" value={mooringType} options={['Catenary', 'Taut-Leg', 'Semi-Taut']} onChange={setMooringType} />
        </SidebarSection>

        <SidebarSection id="turbine" title="Turbine">
          <SliderRow label="Turbine Rating" value={turbineRating} min={8} max={20} step={0.5} onChange={setTurbineRating} unit=" MW" />
          <SliderRow label="Hub Height" value={hubHeight} min={100} max={175} step={5} onChange={setHubHeight} unit="m" />
          <div style={{ fontSize: 10, color: '#64748B', marginBottom: 8 }}>Rotor Diameter: <span style={{ color: T.accent }}>{rotorDiameter}m</span></div>
          <SliderRow label="Farm Capacity" value={farmCapacity} min={100} max={2000} step={50} onChange={setFarmCapacity} unit=" MW" />
        </SidebarSection>

        <SidebarSection id="capex" title="CAPEX Structure">
          <SliderRow label="Floater Structure" value={capexFloater} min={300} max={1200} step={10} onChange={setCapexFloater} unit="" fmt={v => `$${v}`} />
          <SliderRow label="Mooring & Anchoring" value={capexMooring} min={100} max={600} step={10} onChange={setCapexMooring} unit="" fmt={v => `$${v}`} />
          <SliderRow label="Turbine" value={capexTurbine} min={600} max={1500} step={25} onChange={setCapexTurbine} unit="" fmt={v => `$${v}`} />
          <SliderRow label="Installation EPCI" value={capexInstall} min={200} max={900} step={10} onChange={setCapexInstall} unit="" fmt={v => `$${v}`} />
          <SliderRow label="Grid/Cable" value={capexGrid} min={100} max={700} step={10} onChange={setCapexGrid} unit="" fmt={v => `$${v}`} />
          <SliderRow label="Contingency" value={contingency} min={5} max={25} step={1} onChange={setContingency} unit="%" />
        </SidebarSection>

        <SidebarSection id="ops" title="Operations">
          <SliderRow label="OpEx" value={opex} min={60} max={180} step={5} onChange={setOpex} unit=" $/kW/yr" />
          <SliderRow label="Vessel Charter" value={vesselRate} min={30000} max={200000} step={5000} onChange={setVesselRate} unit="" fmt={v => `$${(v / 1000).toFixed(0)}k/d`} />
          <SliderRow label="Weather Window" value={weatherWindow} min={30} max={90} step={5} onChange={setWeatherWindow} unit="%" />
          <SliderRow label="Project Life" value={projectLife} min={20} max={35} step={1} onChange={setProjectLife} unit=" yr" />
        </SidebarSection>

        <SidebarSection id="fin" title="Financial">
          <SliderRow label="Discount Rate" value={discountRate} min={4} max={15} step={0.25} onChange={setDiscountRate} unit="%" />
          <SliderRow label="CfD/PPA Strike Price" value={strikePrice} min={80} max={350} step={5} onChange={setStrikePrice} unit=" /MWh" fmt={v => `£${v}`} />
          <SliderRow label="Equity %" value={equityPct} min={10} max={60} step={5} onChange={setEquityPct} unit="%" />
          <SelectRow label="Currency" value={currency} options={['GBP', 'EUR', 'USD']} onChange={setCurrency} />
        </SidebarSection>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ background: T.navy, borderBottom: `2px solid ${T.accent}`, padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'monospace' }}>RISK ANALYTICS / RENEWABLE ENERGY / EP-DR2</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#F1F5F9' }}>Floating Offshore Wind — LCOE & Technology Analytics</div>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, color: '#64748B' }}>LCOE vs Strike</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: lcoe < strikePrice ? T.green : T.red, fontFamily: 'monospace' }}>
                {lcoe < strikePrice ? '▲' : '▼'} {Math.abs(strikePrice - lcoe).toFixed(1)} $/MWh
              </div>
            </div>
            <div style={{ background: lcoe < strikePrice ? `${T.green}22` : `${T.red}22`, border: `1px solid ${lcoe < strikePrice ? T.green : T.red}`, borderRadius: 6, padding: '6px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: lcoe < strikePrice ? T.green : T.red, fontWeight: 700 }}>{lcoe < strikePrice ? 'VIABLE' : 'UNECONOMIC'}</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: lcoe < strikePrice ? T.green : T.red, fontFamily: 'monospace' }}>{irrVal.toFixed(1)}% IRR</div>
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ background: T.card, borderBottom: `1px solid ${T.border}`, overflowX: 'auto', flexShrink: 0, display: 'flex' }}>
          {TABS.map((tab, i) => (
            <button key={tab} onClick={() => setActiveTab(i)} style={{
              padding: '9px 14px', border: 'none', background: 'none', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: 12, fontWeight: activeTab === i ? 700 : 500,
              color: activeTab === i ? T.accent : T.sub,
              borderBottom: activeTab === i ? `2px solid ${T.accent}` : '2px solid transparent',
              transition: 'all 0.15s',
            }}>{tab}</button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {TAB_RENDERERS[activeTab]?.()}
        </div>

        {/* Status bar */}
        <div style={{ background: T.navy, borderTop: `1px solid #1E293B`, padding: '4px 20px', display: 'flex', gap: 24, alignItems: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 10, color: '#64748B', fontFamily: 'monospace' }}>EP-DR2 · FOWT LCOE Engine v1.0</span>
          <span style={{ fontSize: 10, color: '#64748B', fontFamily: 'monospace' }}>Floater: {floaterConcept}</span>
          <span style={{ fontSize: 10, color: T.accent, fontFamily: 'monospace' }}>LCOE: {lcoe.toFixed(1)} $/MWh</span>
          <span style={{ fontSize: 10, color: T.teal, fontFamily: 'monospace' }}>CF: {cfPct.toFixed(1)}%</span>
          <span style={{ fontSize: 10, color: npvM >= 0 ? T.green : T.red, fontFamily: 'monospace' }}>NPV: {npvM >= 0 ? '+' : ''}${npvM.toLocaleString()}M</span>
          <span style={{ marginLeft: 'auto', fontSize: 10, color: '#334155', fontFamily: 'monospace' }}>All data seeded · sr() PRNG · {farmCapacity}MW farm</span>
        </div>
      </div>
    </div>
  );
}
