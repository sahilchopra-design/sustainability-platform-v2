import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, ScatterChart, Scatter,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PieChart, Pie, Cell, Legend, ReferenceLine
} from 'recharts';

const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const T = { navy: '#1b3a5c', gold: '#c5a96a', cream: '#f7f4ef', teal: '#0f766e', red: '#991b1b', green: '#065f46', gray: '#6b7280', amber: '#b45309' };

// policyShock: NGFS regulatory tightening multiplier (beyond carbon price mechanism)
// Encodes policy phase-out risk, demand substitution, and market competition effects
// Sources: NGFS Phase 4 (2023) sector-specific transition risk taxonomy
const strandingProb = (carbonIntensity, carbonPrice2030, remainingLife, policyShock = 1.0) => {
  const carbonCostRatio = (carbonIntensity * carbonPrice2030) / 1000;
  const timeDiscountFactor = Math.max(0, 1 - (remainingLife / 30));
  // demandSubstitution: high-intensity assets face accelerating market share loss
  const demandSubstitution = Math.min(0.12, carbonIntensity * 0.08);
  const base = carbonCostRatio * 0.8 + timeDiscountFactor * 0.15 + demandSubstitution;
  return Math.min(0.95, base * policyShock);
};

const UK_UTILITIES = [
  { id: 0, name: 'National Grid plc', sector: 'Electricity Transmission', rab: 43.2, wacc: 5.8, allowedReturn: 5.2, actualROCE: 6.1, regPeriod: 'RIIO-T2 2021-26' },
  { id: 1, name: 'Thames Water', sector: 'Water & Sewerage', rab: 18.6, wacc: 6.2, allowedReturn: 5.8, actualROCE: 5.3, regPeriod: 'Ofwat PR24 2025-30' },
  { id: 2, name: 'Heathrow Airport', sector: 'Airport', rab: 17.9, wacc: 7.1, allowedReturn: 6.4, actualROCE: 7.8, regPeriod: 'CAA Q6 2022-27' },
  { id: 3, name: 'Cadent Gas Networks', sector: 'Gas Distribution', rab: 12.4, wacc: 5.5, allowedReturn: 5.1, actualROCE: 5.7, regPeriod: 'Ofgem RIIO-GD2' },
  { id: 4, name: 'UK Power Networks', sector: 'Electricity Distribution', rab: 11.8, wacc: 5.6, allowedReturn: 5.0, actualROCE: 5.4, regPeriod: 'Ofgem RIIO-ED2' },
  { id: 5, name: 'Northern Gas Networks', sector: 'Gas Distribution', rab: 4.2, wacc: 5.4, allowedReturn: 5.0, actualROCE: 5.2, regPeriod: 'Ofgem RIIO-GD2' },
  { id: 6, name: 'Anglian Water', sector: 'Water & Sewerage', rab: 8.7, wacc: 6.0, allowedReturn: 5.7, actualROCE: 5.9, regPeriod: 'Ofwat PR24 2025-30' },
  { id: 7, name: 'Western Power Distribution', sector: 'Electricity Distribution', rab: 9.3, wacc: 5.7, allowedReturn: 5.1, actualROCE: 5.6, regPeriod: 'Ofgem RIIO-ED2' },
  { id: 8, name: 'Scottish Power Transmission', sector: 'Electricity Transmission', rab: 7.1, wacc: 5.9, allowedReturn: 5.3, actualROCE: 5.8, regPeriod: 'RIIO-T2 2021-26' },
  { id: 9, name: 'Gatwick Airport', sector: 'Airport', rab: 5.8, wacc: 6.9, allowedReturn: 6.2, actualROCE: 6.5, regPeriod: 'CAA Q6 2022-27' },
  { id: 10, name: 'Bristol Water', sector: 'Water', rab: 1.2, wacc: 5.9, allowedReturn: 5.5, actualROCE: 5.3, regPeriod: 'Ofwat PR24 2025-30' },
  { id: 11, name: 'SP Manweb', sector: 'Electricity Distribution', rab: 3.4, wacc: 5.6, allowedReturn: 5.0, actualROCE: 5.3, regPeriod: 'Ofgem RIIO-ED2' },
  { id: 12, name: 'SGN Scotland', sector: 'Gas Distribution', rab: 5.1, wacc: 5.5, allowedReturn: 5.0, actualROCE: 5.6, regPeriod: 'Ofgem RIIO-GD2' },
  { id: 13, name: 'Network Rail', sector: 'Rail Infrastructure', rab: 55.4, wacc: 4.8, allowedReturn: 4.5, actualROCE: 3.9, regPeriod: 'CP6 2019-24' },
  { id: 14, name: 'Portsmouth Water', sector: 'Water', rab: 0.6, wacc: 5.8, allowedReturn: 5.4, actualROCE: 5.1, regPeriod: 'Ofwat PR24 2025-30' },
];

const REG_PERIODS = ['Ofgem RIIO-ED2 (2023-2028)', 'Ofwat PR24 (2025-2030)', 'CAA Q6 (2022-2027)'];

const INFRA_PROJECTS = [
  { id: 0, name: 'Dogger Bank Offshore Wind', type: 'Offshore Wind', capex: 9000, revModel: 'Merchant', equityPct: 30, targetIRR: 8.5 },
  { id: 1, name: 'M6 Toll Road Extension', type: 'Toll Road', capex: 1200, revModel: 'User Charge', equityPct: 40, targetIRR: 10.5 },
  { id: 2, name: 'Hospital PFI — Midlands', type: 'Hospital PFI', capex: 450, revModel: 'Availability Payment', equityPct: 35, targetIRR: 9.0 },
  { id: 3, name: 'Thames Tideway Tunnel', type: 'Water Tunnel', capex: 4200, revModel: 'Availability Payment', equityPct: 25, targetIRR: 7.5 },
  { id: 4, name: 'Hornsea Solar Farm Phase 2', type: 'Solar Farm', capex: 320, revModel: 'Merchant', equityPct: 45, targetIRR: 9.8 },
  { id: 5, name: 'HS2 Section 1 PPP', type: 'Rail PPP', capex: 18000, revModel: 'Availability Payment', equityPct: 20, targetIRR: 7.2 },
  { id: 6, name: 'Edinburgh Schools PPP', type: 'Schools PPP', capex: 280, revModel: 'Availability Payment', equityPct: 40, targetIRR: 8.8 },
  { id: 7, name: 'Manchester Airport Expansion', type: 'Airport', capex: 1100, revModel: 'User Charge', equityPct: 35, targetIRR: 11.2 },
  { id: 8, name: 'Bristol CCUS Hub', type: 'Carbon Capture', capex: 850, revModel: 'Merchant', equityPct: 30, targetIRR: 9.5 },
  { id: 9, name: 'Liverpool Street Data Centre', type: 'Data Centre', capex: 550, revModel: 'User Charge', equityPct: 50, targetIRR: 12.5 },
  { id: 10, name: 'Wylfa Nuclear SMR', type: 'Nuclear', capex: 7500, revModel: 'Merchant', equityPct: 25, targetIRR: 8.0 },
  { id: 11, name: 'Green Hydrogen Hub — Teesside', type: 'Hydrogen', capex: 1600, revModel: 'Merchant', equityPct: 35, targetIRR: 10.0 },
  { id: 12, name: 'Hinkley C Rail Link', type: 'Rail PPP', capex: 380, revModel: 'Availability Payment', equityPct: 30, targetIRR: 7.8 },
  { id: 13, name: 'London EV Charging Network', type: 'EV Infrastructure', capex: 180, revModel: 'User Charge', equityPct: 45, targetIRR: 11.5 },
  { id: 14, name: 'Northern Lights CCS', type: 'Carbon Capture', capex: 2200, revModel: 'Merchant', equityPct: 28, targetIRR: 9.2 },
  { id: 15, name: 'Loch Ness Pumped Storage', type: 'Battery Storage', capex: 1400, revModel: 'Merchant', equityPct: 32, targetIRR: 9.8 },
  { id: 16, name: 'Tees Valley Freeport Solar', type: 'Solar Farm', capex: 260, revModel: 'Merchant', equityPct: 42, targetIRR: 9.3 },
  { id: 17, name: 'A14 Cambridge–Huntingdon', type: 'Toll Road', capex: 1500, revModel: 'User Charge', equityPct: 38, targetIRR: 10.2 },
  { id: 18, name: 'Mersey Tidal Power', type: 'Tidal Power', capex: 2100, revModel: 'Merchant', equityPct: 30, targetIRR: 8.7 },
  { id: 19, name: 'Sheffield District Heating', type: 'District Heat', capex: 420, revModel: 'User Charge', equityPct: 40, targetIRR: 9.5 },
];

const ENERGY_ASSETS = Array.from({ length: 25 }, (_, i) => {
  const names = ['Drax Coal Units 1-3', 'Fiddlers Ferry Gas CCGT', 'West Burton A Coal', 'Saltend Chemicals Gas', 'Kilroot Coal Plant', 'Ferrybridge D Gas', 'Cottam Gas CCGT', 'Ince Marshes Gas', 'Barry Gas CCGT', 'Connahs Quay Gas', 'Grangemouth Oil Refinery', 'Fawley Oil Refinery', 'Stanlow Oil Refinery', 'Coryton Oil Refinery', 'Pembroke Refinery', 'North Sea Gas Field A', 'North Sea Gas Field B', 'North Sea Gas Field C', 'Bacton Gas Terminal', 'Easington Gas Terminal', 'National Grid Gas Transmission North', 'National Grid Gas Transmission South', 'Transco Scotland Pipeline', 'East Midlands Gas Storage', 'Humbly Grove Gas Storage'];
  const sectors = ['Coal Power', 'Gas CCGT', 'Gas CCGT', 'Industrial Gas', 'Coal Power', 'Gas CCGT', 'Gas CCGT', 'Gas CCGT', 'Gas CCGT', 'Gas CCGT', 'Oil Refinery', 'Oil Refinery', 'Oil Refinery', 'Oil Refinery', 'Oil Refinery', 'Gas Upstream', 'Gas Upstream', 'Gas Upstream', 'Gas Terminal', 'Gas Terminal', 'Gas Transmission', 'Gas Transmission', 'Gas Transmission', 'Gas Storage', 'Gas Storage'];
  const intensities = [0.85, 0.41, 0.82, 0.52, 0.88, 0.39, 0.37, 0.42, 0.38, 0.40, 0.65, 0.62, 0.60, 0.68, 0.63, 0.28, 0.31, 0.29, 0.12, 0.11, 0.08, 0.09, 0.10, 0.05, 0.06];
  return {
    id: i, name: names[i], sector: sectors[i],
    bookValue: +(200 + sr(i * 7 + 1) * 1800).toFixed(0),
    remainingLife: Math.floor(5 + sr(i * 11 + 2) * 35),
    carbonIntensity: intensities[i],
    bookValueFull: +(200 + sr(i * 7 + 1) * 1800).toFixed(0)
  };
});

const CP_SCENARIOS = {
  // policyShock: NGFS policy risk multiplier on strandingProb (regulatory bans + demand substitution)
  // NZ2050: aggressive phase-outs (UK ban, EU ETS reform, CBAM); Below2C: orderly; Delayed: deferred risk; CurrentPolicy: minimal
  'NZ2050':        { cp2030: 250, cp2040: 600,  cp2050: 1200, label: 'Net Zero 2050',   color: T.green,  policyShock: 1.35 },
  'Below2C':       { cp2030: 150, cp2040: 350,  cp2050: 800,  label: 'Below 2°C',       color: T.teal,   policyShock: 1.20 },
  'Delayed':       { cp2030: 80,  cp2040: 200,  cp2050: 500,  label: 'Delayed Action',  color: T.amber,  policyShock: 1.05 },
  'NDC':           { cp2030: 50,  cp2040: 120,  cp2050: 280,  label: 'NDC Policies',    color: '#f97316',policyShock: 0.95 },
  'CurrentPolicy': { cp2030: 25,  cp2040: 60,   cp2050: 120,  label: 'Current Policy',  color: T.red,    policyShock: 0.80 },
};

const GREENIUM_DATA = [
  { asset: 'Solar PV', greenium: -45, esgScore: 88, ghgIntensity: 12, label: 'Certified Green' },
  { asset: 'Offshore Wind', greenium: -38, esgScore: 85, ghgIntensity: 8, label: 'Certified Green' },
  { asset: 'Onshore Wind', greenium: -32, esgScore: 82, ghgIntensity: 10, label: 'Certified Green' },
  { asset: 'Tidal Power', greenium: -28, esgScore: 80, ghgIntensity: 14, label: 'Applying' },
  { asset: 'Battery Storage', greenium: -22, esgScore: 75, ghgIntensity: 25, label: 'Applying' },
  { asset: 'Nuclear', greenium: -18, esgScore: 68, ghgIntensity: 6, label: 'Applying' },
  { asset: 'Toll Road', greenium: -12, esgScore: 55, ghgIntensity: 140, label: 'None' },
  { asset: 'Rail PPP', greenium: -10, esgScore: 62, ghgIntensity: 45, label: 'Applying' },
  { asset: 'Hospital PFI', greenium: -8, esgScore: 58, ghgIntensity: 38, label: 'None' },
  { asset: 'Airport', greenium: +5, esgScore: 42, ghgIntensity: 320, label: 'None' },
  { asset: 'Gas CCGT', greenium: +8, esgScore: 38, ghgIntensity: 410, label: 'None' },
  { asset: 'Oil Refinery', greenium: +18, esgScore: 28, ghgIntensity: 620, label: 'None' },
  { asset: 'Coal Power', greenium: +25, esgScore: 18, ghgIntensity: 950, label: 'None' },
];

export default function InfrastructureValuationPage() {
  const [activeTab, setActiveTab] = useState(0);

  // RAB state
  const [selectedUtility, setSelectedUtility] = useState(null);
  const [editWacc, setEditWacc] = useState(5.8);
  const [editRab, setEditRab] = useState(43.2);
  const [regPeriod, setRegPeriod] = useState(REG_PERIODS[0]);

  // Greenfield DCF state
  const [selectedProject, setSelectedProject] = useState(0);
  const [gfCapex, setGfCapex] = useState(9000);
  const [gfOpYear, setGfOpYear] = useState(2027);
  const [gfRevModel, setGfRevModel] = useState('Merchant');
  const [gfConstRisk, setGfConstRisk] = useState(5);
  const [gfEquity, setGfEquity] = useState(30);
  const [gfTargetIRR, setGfTargetIRR] = useState(8.5);
  const [gfCalculated, setGfCalculated] = useState(false);

  // Stranded Asset state
  const [cpScenario, setCpScenario] = useState('NZ2050');

  const selectUtility = (u) => {
    setSelectedUtility(u);
    setEditWacc(u.wacc);
    setEditRab(u.rab);
  };

  const rabDetail = useMemo(() => {
    if (!selectedUtility) return null;
    const allowedRev = editRab * (selectedUtility.allowedReturn / 100);
    const regGap = (selectedUtility.actualROCE / 100 - selectedUtility.allowedReturn / 100) * editRab;
    const rabGrowth = Array.from({ length: 5 }, (_, i) => ({
      period: `RP${i + 1}`, rab: +(editRab * Math.pow(1 + 0.03 + sr(i * 7 + selectedUtility.id) * 0.04, i)).toFixed(1)
    }));
    return { allowedRev: +allowedRev.toFixed(2), regGap: +regGap.toFixed(2), rabGrowth };
  }, [selectedUtility, editWacc, editRab]);

  const gfResult = useMemo(() => {
    if (!gfCalculated) return null;
    const proj = INFRA_PROJECTS[selectedProject];
    const debt = gfCapex * (1 - gfEquity / 100);
    const equity = gfCapex * (gfEquity / 100);
    const annualRev = gfCapex * (0.18 + sr(selectedProject * 3 + 1) * 0.12);
    const annualOpex = annualRev * 0.35;
    const annualDsvc = debt * 0.07;
    const fcf = annualRev - annualOpex - annualDsvc;
    const projectLife = 25;
    const irr = gfTargetIRR / 100 * (1 - gfConstRisk * 0.008);
    const equityIRR = irr + 0.025 + (1 - gfEquity / 100) * 0.015;
    const dscr = (annualRev - annualOpex) / Math.max(annualDsvc, 0.001); // guard: equity=100% → debt=0 → annualDsvc=0
    const dscrMin = dscr * (0.85 + sr(selectedProject * 5 + 2) * 0.1);
    const payback = equity / Math.max(0.01, fcf);
    let npv = 0;
    for (let y = 1; y <= projectLife; y++) npv += fcf / Math.pow(1.08, y);
    npv -= equity;

    const tornado = [
      { label: '+15% Capex', impact: -(gfCapex * 0.15 * 0.04) },
      { label: '-15% Capex', impact: gfCapex * 0.15 * 0.04 },
      { label: '+10% Revenue', impact: annualRev * 0.10 * 8 },
      { label: '-10% Revenue', impact: -(annualRev * 0.10 * 8) },
      { label: '+150bps WACC', impact: -(npv * 0.12) },
      { label: '-150bps WACC', impact: npv * 0.12 },
    ].sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));

    return { irr: +(irr * 100).toFixed(2), equityIRR: +(equityIRR * 100).toFixed(2), dscrAvg: +dscr.toFixed(2), dscrMin: +dscrMin.toFixed(2), payback: +payback.toFixed(1), npv: +npv.toFixed(0), tornado };
  }, [gfCalculated, selectedProject, gfCapex, gfEquity, gfTargetIRR, gfConstRisk]);

  const strandedAssets = useMemo(() => {
    const scenario = CP_SCENARIOS[cpScenario];
    return ENERGY_ASSETS.map(a => {
      const prob = strandingProb(a.carbonIntensity, scenario.cp2030, a.remainingLife, scenario.policyShock);
      const npvHaircut = prob * 0.85;
      const climateValue = a.bookValue * (1 - npvHaircut);
      const strandYear = prob > 0.7 ? 2030 + Math.floor((1 - prob) * 20) : prob > 0.4 ? 2035 + Math.floor((1 - prob) * 15) : 2045 + Math.floor((1 - prob) * 10);
      return { ...a, prob: +(prob * 100).toFixed(1), npvHaircut: +(npvHaircut * 100).toFixed(1), climateValue: +climateValue.toFixed(0), strandYear };
    }).sort((a, b) => b.prob - a.prob);
  }, [cpScenario]);

  const strandedPortfolio = useMemo(() => {
    const totalBook = strandedAssets.reduce((s, a) => s + a.bookValue, 0);
    const totalStranded = strandedAssets.reduce((s, a) => s + (a.bookValue - a.climateValue), 0);
    const weightedProb = strandedAssets.reduce((s, a) => s + a.prob * a.bookValue, 0) / totalBook;
    const timeline = Array.from({ length: 26 }, (_, i) => {
      const year = 2025 + i;
      const cumStranded = strandedAssets.filter(a => a.strandYear <= year).reduce((s, a) => s + (a.bookValue - a.climateValue), 0);
      return { year, cumStranded: +cumStranded.toFixed(0) };
    });
    return { totalBook: +totalBook.toFixed(0), totalStranded: +totalStranded.toFixed(0), weightedProb: +weightedProb.toFixed(1), timeline };
  }, [strandedAssets]);

  const probColor = (p) => p > 70 ? T.red : p > 40 ? T.amber : T.green;
  const tabs = ['RAB Model', 'Greenfield DCF', 'Stranded Asset Risk', 'ESG Greenium'];

  const SliderRow = ({ label, min, max, step, value, onChange, fmt }) => (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: T.navy, fontWeight: 600, marginBottom: 3 }}>
        <span>{label}</span>
        <span style={{ color: T.gold, fontFamily: 'monospace' }}>{fmt ? fmt(value) : value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width: '100%', accentColor: T.navy }} />
    </div>
  );

  return (
    <div style={{ background: T.cream, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ background: T.navy, padding: '20px 32px', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ fontSize: 11, color: T.gold, fontFamily: 'monospace', letterSpacing: 2, marginBottom: 4 }}>EP-BK2 · INFRASTRUCTURE VALUATION</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>Infrastructure & Project Finance Valuation Engine</div>
        <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>RAB modelling · Greenfield IRR · Stranded asset risk · ESG greenium analytics</div>
      </div>

      <div style={{ display: 'flex', background: '#fff', borderBottom: `2px solid ${T.gold}` }}>
        {tabs.map((t, i) => (
          <button key={i} onClick={() => setActiveTab(i)}
            style={{ padding: '12px 24px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
              background: activeTab === i ? T.navy : 'transparent',
              color: activeTab === i ? T.gold : T.gray,
              borderBottom: activeTab === i ? `2px solid ${T.gold}` : '2px solid transparent' }}>
            {t}
          </button>
        ))}
      </div>

      <div style={{ padding: 24 }}>
        {/* TAB 1: RAB Model */}
        {activeTab === 0 && (
          <div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
              {REG_PERIODS.map(p => (
                <button key={p} onClick={() => setRegPeriod(p)}
                  style={{ padding: '6px 14px', border: `1px solid ${T.navy}`, borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                    background: regPeriod === p ? T.navy : '#fff', color: regPeriod === p ? T.gold : T.navy }}>
                  {p}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>
              <div style={{ background: '#fff', border: `1px solid ${T.gold}30`, borderRadius: 8, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: T.navy }}>
                      {['Utility', 'Sector', 'RAB (£bn)', 'WACC %', 'Allowed Return %', 'Actual ROCE %', 'Period'].map(h => (
                        <th key={h} style={{ padding: '8px 10px', color: T.gold, textAlign: 'left', fontWeight: 600, fontSize: 11, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {UK_UTILITIES.map((u, i) => (
                      <tr key={u.id} onClick={() => selectUtility(u)}
                        style={{ background: selectedUtility?.id === u.id ? `${T.navy}10` : i % 2 === 0 ? '#f9f7f3' : '#fff',
                          borderBottom: `1px solid ${T.gold}15`, cursor: 'pointer',
                          borderLeft: selectedUtility?.id === u.id ? `3px solid ${T.gold}` : '3px solid transparent' }}>
                        <td style={{ padding: '7px 10px', fontWeight: 600, color: T.navy }}>{u.name}</td>
                        <td style={{ padding: '7px 10px', color: T.gray }}>{u.sector}</td>
                        <td style={{ padding: '7px 10px', fontFamily: 'monospace', color: T.teal, fontWeight: 600 }}>£{u.rab}bn</td>
                        <td style={{ padding: '7px 10px', fontFamily: 'monospace' }}>{u.wacc}%</td>
                        <td style={{ padding: '7px 10px', fontFamily: 'monospace', color: T.green }}>{u.allowedReturn}%</td>
                        <td style={{ padding: '7px 10px', fontFamily: 'monospace', color: u.actualROCE > u.allowedReturn ? T.green : T.red, fontWeight: 600 }}>{u.actualROCE}%</td>
                        <td style={{ padding: '7px 10px', fontSize: 10, color: T.gray }}>{u.regPeriod}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                {!selectedUtility ? (
                  <div style={{ background: '#fff', border: `1px solid ${T.gold}30`, borderRadius: 8, padding: 40, textAlign: 'center', color: T.gray }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>🏗️</div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>Click a utility to view RAB detail</div>
                  </div>
                ) : (
                  <div style={{ background: '#fff', border: `1px solid ${T.gold}30`, borderRadius: 8, padding: 20 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 16 }}>{selectedUtility.name}</div>

                    <SliderRow label="WACC (%)" min={3} max={12} step={0.1} value={editWacc} onChange={setEditWacc} fmt={v => `${v.toFixed(1)}%`} />
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: T.navy, display: 'block', marginBottom: 4 }}>RAB Value (£bn)</label>
                      <input type="number" value={editRab} onChange={e => setEditRab(+e.target.value)} step={0.1}
                        style={{ width: '100%', padding: '6px 10px', border: `1px solid ${T.gold}50`, borderRadius: 4, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }} />
                    </div>

                    {rabDetail && (
                      <>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                          {[
                            { label: 'Allowed Revenue', val: `£${rabDetail.allowedRev}bn`, color: T.teal },
                            { label: 'Regulatory Gap', val: `£${rabDetail.regGap}bn`, color: rabDetail.regGap > 0 ? T.green : T.red },
                          ].map((m, i) => (
                            <div key={i} style={{ padding: 12, background: `${T.navy}06`, borderRadius: 6, borderLeft: `3px solid ${m.color}` }}>
                              <div style={{ fontSize: 10, color: T.gray, fontWeight: 600, marginBottom: 2 }}>{m.label}</div>
                              <div style={{ fontSize: 16, fontWeight: 700, color: m.color, fontFamily: 'monospace' }}>{m.val}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{ marginBottom: 8, fontSize: 12, fontWeight: 700, color: T.navy }}>RAB Growth — 5 Regulatory Periods</div>
                        <ResponsiveContainer width="100%" height={150}>
                          <AreaChart data={rabDetail.rabGrowth} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
                            <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `£${v}bn`} />
                            <Tooltip formatter={(v) => [`£${v}bn`, 'RAB']} />
                            <Area type="monotone" dataKey="rab" stroke={T.teal} fill={`${T.teal}20`} strokeWidth={2} />
                          </AreaChart>
                        </ResponsiveContainer>

                        <div style={{ marginTop: 12, marginBottom: 8, fontSize: 12, fontWeight: 700, color: T.navy }}>ROCE vs Allowed Return</div>
                        <ResponsiveContainer width="100%" height={120}>
                          <BarChart data={[{ name: selectedUtility.name.split(' ')[0], allowed: selectedUtility.allowedReturn, actual: selectedUtility.actualROCE }]} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} domain={[0, Math.max(selectedUtility.allowedReturn, selectedUtility.actualROCE) * 1.3]} />
                            <Tooltip formatter={(v) => [`${v}%`]} />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                            <Bar dataKey="allowed" name="Allowed Return" fill={T.teal} />
                            <Bar dataKey="actual" name="Actual ROCE" fill={selectedUtility.actualROCE > selectedUtility.allowedReturn ? T.green : T.red} />
                          </BarChart>
                        </ResponsiveContainer>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Greenfield DCF */}
        {activeTab === 1 && (
          <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 24 }}>
            <div style={{ background: '#fff', border: `1px solid ${T.gold}30`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16, borderBottom: `1px solid ${T.gold}40`, paddingBottom: 8 }}>PROJECT CALIBRATION</div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: T.navy, display: 'block', marginBottom: 4 }}>Infrastructure Project</label>
                <select value={selectedProject} onChange={e => { setSelectedProject(+e.target.value); const p = INFRA_PROJECTS[+e.target.value]; setGfCapex(p.capex); setGfRevModel(p.revModel); setGfEquity(p.equityPct); setGfTargetIRR(p.targetIRR); setGfCalculated(false); }}
                  style={{ width: '100%', padding: '6px 10px', border: `1px solid ${T.gold}50`, borderRadius: 4, fontSize: 12, fontFamily: 'inherit' }}>
                  {INFRA_PROJECTS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 12, padding: '8px 12px', background: `${T.navy}06`, borderRadius: 4 }}>
                <div style={{ fontSize: 11, color: T.gray }}>Type: <strong style={{ color: T.navy }}>{INFRA_PROJECTS[selectedProject].type}</strong></div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: T.navy, display: 'block', marginBottom: 4 }}>Capex (£m)</label>
                <input type="range" min={50} max={20000} step={50} value={gfCapex} onChange={e => { setGfCapex(+e.target.value); setGfCalculated(false); }}
                  style={{ width: '100%', accentColor: T.navy }} />
                <div style={{ fontSize: 12, color: T.gold, fontFamily: 'monospace', textAlign: 'right' }}>£{gfCapex.toLocaleString()}m</div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: T.navy, display: 'block', marginBottom: 4 }}>Operational Year</label>
                <input type="number" value={gfOpYear} onChange={e => { setGfOpYear(+e.target.value); setGfCalculated(false); }}
                  style={{ width: '100%', padding: '6px 10px', border: `1px solid ${T.gold}50`, borderRadius: 4, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }} />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: T.navy, display: 'block', marginBottom: 4 }}>Revenue Model</label>
                <div style={{ display: 'flex', gap: 4 }}>
                  {['Availability Payment', 'User Charge', 'Merchant'].map(m => (
                    <button key={m} onClick={() => { setGfRevModel(m); setGfCalculated(false); }}
                      style={{ flex: 1, padding: '5px 2px', border: `1px solid ${T.navy}`, borderRadius: 4, cursor: 'pointer', fontSize: 10, fontWeight: 600,
                        background: gfRevModel === m ? T.navy : '#fff', color: gfRevModel === m ? T.gold : T.navy }}>
                      {m === 'Availability Payment' ? 'Avail.' : m}
                    </button>
                  ))}
                </div>
              </div>

              <SliderRow label="Construction Risk (1-10)" min={1} max={10} step={1} value={gfConstRisk} onChange={v => { setGfConstRisk(v); setGfCalculated(false); }} />
              <SliderRow label="Equity (%)" min={20} max={50} step={1} value={gfEquity} onChange={v => { setGfEquity(v); setGfCalculated(false); }} fmt={v => `${v}%`} />
              <SliderRow label="Target IRR (%)" min={6} max={15} step={0.1} value={gfTargetIRR} onChange={v => { setGfTargetIRR(v); setGfCalculated(false); }} fmt={v => `${v.toFixed(1)}%`} />

              <button onClick={() => setGfCalculated(true)}
                style={{ width: '100%', marginTop: 8, padding: '12px', background: T.navy, color: T.gold, border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 700, fontFamily: 'inherit' }}>
                CALCULATE PROJECT IRR
              </button>
            </div>

            <div>
              {!gfCalculated ? (
                <div style={{ background: '#fff', border: `1px solid ${T.gold}30`, borderRadius: 8, padding: 60, textAlign: 'center', color: T.gray }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🏗️</div>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>Select a project and calculate IRR</div>
                  <div style={{ fontSize: 13, marginTop: 8 }}>{INFRA_PROJECTS[selectedProject].name}</div>
                </div>
              ) : gfResult && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                    {[
                      { label: 'Base Case IRR', val: `${gfResult.irr}%`, color: T.navy },
                      { label: 'Equity IRR', val: `${gfResult.equityIRR}%`, color: T.teal },
                      { label: 'NPV @ 8% Discount', val: `£${gfResult.npv.toLocaleString()}m`, color: gfResult.npv > 0 ? T.green : T.red },
                    ].map((m, i) => (
                      <div key={i} style={{ background: '#fff', border: `1px solid ${T.gold}30`, borderRadius: 8, padding: 16, textAlign: 'center' }}>
                        <div style={{ fontSize: 11, color: T.gray, fontWeight: 600, marginBottom: 4 }}>{m.label}</div>
                        <div style={{ fontSize: 26, fontWeight: 700, color: m.color, fontFamily: 'monospace' }}>{m.val}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                    {[
                      { label: 'DSCR Average', val: `${gfResult.dscrAvg}×`, color: gfResult.dscrAvg > 1.3 ? T.green : T.red },
                      { label: 'DSCR Minimum', val: `${gfResult.dscrMin}×`, color: gfResult.dscrMin > 1.1 ? T.green : T.red },
                      { label: 'Equity Payback', val: `${gfResult.payback}y`, color: T.amber },
                    ].map((m, i) => (
                      <div key={i} style={{ background: '#fff', border: `1px solid ${T.gold}30`, borderRadius: 8, padding: 16, textAlign: 'center' }}>
                        <div style={{ fontSize: 11, color: T.gray, fontWeight: 600, marginBottom: 4 }}>{m.label}</div>
                        <div style={{ fontSize: 26, fontWeight: 700, color: m.color, fontFamily: 'monospace' }}>{m.val}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: '#fff', border: `1px solid ${T.gold}30`, borderRadius: 8, padding: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>IRR Sensitivity — Tornado Chart (NPV impact, £m)</div>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={gfResult.tornado} layout="vertical" margin={{ top: 5, right: 60, left: 120, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
                        <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `£${v.toFixed(0)}m`} />
                        <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={115} />
                        <Tooltip formatter={(v) => [`£${v.toFixed(0)}m`, 'NPV Impact']} />
                        <ReferenceLine x={0} stroke={T.navy} />
                        <Bar dataKey="impact">
                          {gfResult.tornado.map((d, i) => <Cell key={i} fill={d.impact >= 0 ? T.green : T.red} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: Stranded Asset Risk */}
        {activeTab === 2 && (
          <div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: T.navy }}>Carbon Price Pathway:</span>
              {Object.entries(CP_SCENARIOS).map(([key, s]) => (
                <button key={key} onClick={() => setCpScenario(key)}
                  style={{ padding: '6px 14px', border: `2px solid ${s.color}`, borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                    background: cpScenario === key ? s.color : '#fff', color: cpScenario === key ? '#fff' : s.color }}>
                  {s.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
              {[
                { label: 'Total Book Value', val: `£${strandedPortfolio.totalBook.toLocaleString()}m`, color: T.navy },
                { label: 'Stranded Value at Risk', val: `£${strandedPortfolio.totalStranded.toLocaleString()}m`, color: T.red },
                { label: 'Weighted Strand Prob', val: `${strandedPortfolio.weightedProb}%`, color: probColor(strandedPortfolio.weightedProb) },
              ].map((m, i) => (
                <div key={i} style={{ background: '#fff', border: `1px solid ${T.gold}30`, borderRadius: 8, padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: T.gray, fontWeight: 600, marginBottom: 4 }}>{m.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: m.color, fontFamily: 'monospace' }}>{m.val}</div>
                  <div style={{ fontSize: 10, color: T.gray, marginTop: 4 }}>{CP_SCENARIOS[cpScenario].label} scenario</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>
              <div style={{ background: '#fff', border: `1px solid ${T.gold}30`, borderRadius: 8, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: T.navy }}>
                      {['Asset', 'Sector', 'Book Value', 'Remaining Life', 'Carbon Intensity', 'Strand Prob', 'NPV Haircut', 'Climate Value', 'Strand Year'].map(h => (
                        <th key={h} style={{ padding: '8px 8px', color: T.gold, textAlign: 'left', fontWeight: 600, fontSize: 10, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {strandedAssets.map((a, i) => (
                      <tr key={a.id} style={{ background: i % 2 === 0 ? '#f9f7f3' : '#fff', borderBottom: `1px solid ${T.gold}15` }}>
                        <td style={{ padding: '5px 8px', fontWeight: 600, color: T.navy, fontSize: 11 }}>{a.name}</td>
                        <td style={{ padding: '5px 8px', color: T.gray, fontSize: 10 }}>{a.sector}</td>
                        <td style={{ padding: '5px 8px', fontFamily: 'monospace', fontSize: 11 }}>£{a.bookValue}m</td>
                        <td style={{ padding: '5px 8px', fontFamily: 'monospace', fontSize: 11 }}>{a.remainingLife}y</td>
                        <td style={{ padding: '5px 8px', fontFamily: 'monospace', fontSize: 11 }}>{a.carbonIntensity} tCO₂/MWh</td>
                        <td style={{ padding: '5px 8px' }}>
                          <span style={{ background: probColor(a.prob), color: '#fff', padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700 }}>{a.prob}%</span>
                        </td>
                        <td style={{ padding: '5px 8px', fontFamily: 'monospace', color: T.red, fontSize: 11, fontWeight: 600 }}>{a.npvHaircut}%</td>
                        <td style={{ padding: '5px 8px', fontFamily: 'monospace', color: T.teal, fontSize: 11 }}>£{a.climateValue.toLocaleString()}m</td>
                        <td style={{ padding: '5px 8px', fontFamily: 'monospace', fontSize: 11, color: a.strandYear < 2035 ? T.red : T.gray }}>{a.strandYear}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <div style={{ background: '#fff', border: `1px solid ${T.gold}30`, borderRadius: 8, padding: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Cumulative Stranded Value 2025–2050 (£m)</div>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={strandedPortfolio.timeline} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
                      <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `£${v.toLocaleString()}m`} />
                      <Tooltip formatter={(v) => [`£${v.toLocaleString()}m`, 'Cumulative Stranded Value']} />
                      <Area type="monotone" dataKey="cumStranded" stroke={CP_SCENARIOS[cpScenario].color} fill={`${CP_SCENARIOS[cpScenario].color}20`} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ESG Greenium */}
        {activeTab === 3 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
              <div style={{ background: '#fff', border: `1px solid ${T.gold}30`, borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Greenium / Brownium by Asset Class (basis points)</div>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={GREENIUM_DATA} layout="vertical" margin={{ top: 5, right: 60, left: 110, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
                    <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `${v}bps`} />
                    <YAxis type="category" dataKey="asset" tick={{ fontSize: 11 }} width={105} />
                    <Tooltip formatter={(v) => [`${v}bps`, 'Financing premium']} />
                    <ReferenceLine x={0} stroke={T.navy} strokeWidth={2} />
                    <Bar dataKey="greenium" name="Financing Premium (bps)">
                      {GREENIUM_DATA.map((d, i) => <Cell key={i} fill={d.greenium < 0 ? T.green : T.red} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: '#fff', border: `1px solid ${T.gold}30`, borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>ESG Score vs Financing Cost Premium (bps)</div>
                <ResponsiveContainer width="100%" height={320}>
                  <ScatterChart margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
                    <XAxis dataKey="esgScore" name="ESG Score" tick={{ fontSize: 10 }} label={{ value: 'ESG Score', position: 'insideBottom', offset: -5, fontSize: 11, fill: T.gray }} />
                    <YAxis dataKey="greenium" name="Premium (bps)" tick={{ fontSize: 10 }} label={{ value: 'Premium (bps)', angle: -90, position: 'insideLeft', fontSize: 11, fill: T.gray }} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }}
                      content={({ active, payload }) => active && payload?.[0] ? (
                        <div style={{ background: '#fff', border: `1px solid ${T.gold}`, borderRadius: 4, padding: '8px 12px', fontSize: 12 }}>
                          <div style={{ fontWeight: 600, color: T.navy }}>{payload[0].payload.asset}</div>
                          <div>ESG: {payload[0].payload.esgScore} | Premium: {payload[0].payload.greenium}bps</div>
                        </div>
                      ) : null} />
                    <Scatter data={GREENIUM_DATA}>
                      {GREENIUM_DATA.map((d, i) => <Cell key={i} fill={d.greenium < 0 ? T.green : T.red} />)}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ background: '#fff', border: `1px solid ${T.gold}30`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Reference Frameworks & Evidence</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                {[
                  { title: 'GIH Sustainable Infrastructure', body: 'Global Infrastructure Hub Sustainable Infrastructure Principles: climate-aligned assets receive 20-45bps financing advantage in project bond markets.' },
                  { title: 'EU Taxonomy Technical Screening', body: 'Regulation 2020/852: Climate change mitigation criteria for infrastructure. Solar/wind must demonstrate substantial contribution with DNSH compliance.' },
                  { title: 'ICMA Green Bond Principles 2021', body: 'Use of proceeds, process for evaluation, management of proceeds, and reporting requirements for green-labelled infrastructure bonds.' },
                  { title: 'Climate Bonds Initiative Data', body: 'Certified green bonds trade at 20-50bps below comparable conventional bonds. Sample: £180bn labelled green infra bonds 2022-2024.' },
                  { title: 'GFANZ Infrastructure Guidance', body: 'Glasgow Financial Alliance for Net Zero: infrastructure lenders commit to aligning portfolios with 1.5°C, favouring renewable and low-carbon assets.' },
                  { title: 'Ofgem RIIO-ED2 ESG Component', body: 'Ofgem introduced environmental performance incentives in RIIO-ED2 worth up to ±1% of baseline allowances. First ESG-linked regulatory framework in UK utilities.' },
                ].map((c, i) => (
                  <div key={i} style={{ padding: 14, background: `${T.navy}05`, borderRadius: 6, borderLeft: `3px solid ${T.gold}` }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 6 }}>{c.title}</div>
                    <div style={{ fontSize: 12, color: T.gray, lineHeight: 1.5 }}>{c.body}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
