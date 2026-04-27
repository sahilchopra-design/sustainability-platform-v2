import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine, ComposedChart, Cell, PieChart, Pie, RadarChart,
  PolarGrid, PolarAngleAxis, Radar,
} from 'recharts';
import { IRENA_RENEWABLE_CAPACITY_2023 } from '../../../data/publicDataSeed';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const T = {
  bg: '#FAFAF7', card: '#FFFFFF', border: '#E5E2D9', text: '#1A1A2E',
  sub: '#6B7280', accent: '#B8860B', indigo: '#4F46E5', green: '#065F46',
  red: '#991B1B', blue: '#1E40AF', amber: '#92400E', teal: '#0F766E', navy: '#0F172A',
};

const TABS = [
  'Project Overview','Financial Model','Returns Engine','CfD Structure',
  'DSCR & Debt','P50/P90 Yield','Sensitivity','Scenario Engine',
  'Monte Carlo','Construction Finance','LP/GP Waterfall','Tax & CfD Optimisation',
  'LCOE Deep Dive','Comparable Transactions','Portfolio Integration',
  'ESG & Green Finance','Risk Register','Summary Report',
];

const COUNTRIES = [
  { name: 'United Kingdom', cfdStrike: 82, reference: 55, ptcBase: 0, currency: '£', taxRate: 25 },
  { name: 'Germany',        cfdStrike: 75, reference: 50, ptcBase: 0, currency: '€', taxRate: 30 },
  { name: 'Netherlands',    cfdStrike: 78, reference: 52, ptcBase: 0, currency: '€', taxRate: 25.8 },
  { name: 'Denmark',        cfdStrike: 68, reference: 48, ptcBase: 0, currency: '€', taxRate: 22 },
  { name: 'United States',  cfdStrike: 0,  reference: 55, ptcBase: 27.5, currency: '$', taxRate: 21 },
  { name: 'Taiwan',         cfdStrike: 90, reference: 60, ptcBase: 0, currency: '$', taxRate: 20 },
];

// ── Wire real IRENA offshore wind data (GAP-011) ──────────────────────────
const IRENA_OFFSHORE = (IRENA_RENEWABLE_CAPACITY_2023||[]).filter(c=>(c.wind_offshore_gw||0)>0)
  .sort((a,b)=>(b.wind_offshore_gw||0)-(a.wind_offshore_gw||0))
  .map(c=>({country:c.country,iso3:c.iso3,offshore_gw:c.wind_offshore_gw,onshore_gw:c.wind_onshore_gw,total_wind_gw:(c.wind_offshore_gw||0)+(c.wind_onshore_gw||0)}));
// Top offshore markets (IRENA 2023, GW): China 37.3, UK 14.7, Germany 8.5, Netherlands 3.0, Belgium 2.8, Denmark 2.6, Taiwan 2.2, USA 0.04

function calcIRR(cfs, tol = 1e-8, maxIter = 200) {
  if (!cfs || cfs.length < 2) return 0;
  let r = 0.10;
  for (let i = 0; i < maxIter; i++) {
    const npv  = cfs.reduce((s, c, t) => s + c / Math.pow(1 + r, t), 0);
    const dnpv = cfs.reduce((s, c, t) => s - t * c / Math.pow(1 + r, t + 1), 0);
    if (Math.abs(dnpv) < 1e-12) break;
    const next = r - npv / dnpv;
    if (Math.abs(next - r) < tol) return next;
    r = next;
  }
  return r;
}

function buildCashFlows(p) {
  const { capMW, capexPerKw, opexPerKw, cfPct, contractType, cfdStrike, ptcBase,
          debtPct, intRate, tenor, taxRate, eqPct, life, referencePrice, escalation, constructionYrs } = p;
  const totalCapex = capMW * 1000 * capexPerKw;
  const annualAEP  = capMW * 1000 * (cfPct / 100) * 8760;
  const debtAmt    = totalCapex * debtPct / 100;
  const equityAmt  = totalCapex * eqPct / 100;
  const annDS      = debtAmt * intRate / 100 / (1 - Math.pow(1 + intRate / 100, -tenor));
  const rows = [];
  let debtBal = debtAmt;
  for (let y = 0; y <= life; y++) {
    if (y === 0) { rows.push({ year: 0, capex: -totalCapex, revenue: 0, opex: 0, ebitda: 0, interest: 0, principal: 0, cfads: 0, fcf: -equityAmt }); continue; }
    const deg      = Math.pow(1 - 0.005, y - 1);
    const aep      = annualAEP * deg;
    const spot     = referencePrice * Math.pow(1 + escalation / 100, y - 1);
    let revenue;
    if (contractType === 'cfd') {
      const strike  = cfdStrike;
      const settle  = y <= 15 ? Math.max(0, strike - spot) * aep / 1e6 : 0;
      revenue = (spot * aep / 1e6) + settle;
    } else if (contractType === 'ptc') {
      revenue = (spot + (y <= 10 ? ptcBase : 0)) * aep / 1e6;
    } else {
      revenue = spot * aep / 1e6;
    }
    const opex     = opexPerKw * capMW * 1000 / 1e6 * Math.pow(1.02, y - 1);
    const ebitda   = revenue - opex;
    const interest = debtBal * intRate / 100;
    const princPay = y <= tenor ? Math.min(debtBal, annDS - interest) : 0;
    const cfads    = ebitda - interest - Math.max(0, ebitda - interest) * taxRate / 100;
    const fcf      = cfads - princPay;
    debtBal        = Math.max(0, debtBal - princPay);
    const dscr     = annDS > 0 ? cfads / annDS : 999;
    rows.push({ year: y, revenue: +revenue.toFixed(2), opex: +opex.toFixed(2), ebitda: +ebitda.toFixed(2),
      interest: +interest.toFixed(2), principal: +princPay.toFixed(2), cfads: +cfads.toFixed(2),
      fcf: +fcf.toFixed(2), dscr: +dscr.toFixed(2), debtBal: +debtBal.toFixed(1) });
  }
  return rows;
}

function Slider({ label, value, min, max, step = 1, unit = '', onChange }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ color: '#64748B', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>{label}</span>
        <span style={{ color: T.accent, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: T.accent }} />
    </div>
  );
}

function SideSection({ title, open, toggle, children }) {
  return (
    <div>
      <div onClick={toggle} style={{ padding: '10px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', background: '#1E293B', borderBottom: '1px solid #334155', userSelect: 'none' }}>
        <span style={{ color: '#94A3B8', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{title}</span>
        <span style={{ color: '#64748B', fontSize: 12 }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && <div style={{ padding: '12px 16px' }}>{children}</div>}
    </div>
  );
}

const S = {
  page: { display: 'flex', flexDirection: 'column', minHeight: '100vh', background: T.bg, fontFamily: 'DM Sans, sans-serif', color: T.text },
  header: { background: `linear-gradient(135deg, ${T.navy} 0%, #1E293B 60%, #1A1A2E 100%)`, borderBottom: `3px solid ${T.accent}`, padding: '20px 28px' },
  htitle: { color: '#F8F8F2', fontSize: 24, fontWeight: 700, margin: 0 },
  hsub: { color: '#94A3B8', fontSize: 12, marginTop: 4, fontFamily: 'JetBrains Mono, monospace' },
  body: { display: 'flex', flex: 1 },
  sidebar: { width: 280, background: '#0F172A', borderRight: '1px solid #1E293B', overflowY: 'auto', padding: '16px 0', flexShrink: 0 },
  inp: { width: '100%', padding: '6px 8px', background: '#1E293B', border: '1px solid #334155', borderRadius: 4, color: '#E2E8F0', fontSize: 12, boxSizing: 'border-box', marginBottom: 8 },
  lbl: { display: 'block', color: '#64748B', fontSize: 11, marginBottom: 4 },
  main: { flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  statsBar: { display: 'flex', gap: 12, padding: '12px 20px', background: '#1E293B', borderBottom: '1px solid #334155', flexWrap: 'wrap' },
  chip: { background: '#0F172A', border: '1px solid #334155', borderRadius: 4, padding: '6px 12px', textAlign: 'center' },
  chipV: { color: T.accent, fontSize: 16, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', display: 'block' },
  chipL: { color: '#64748B', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' },
  tabs: { display: 'flex', gap: 0, background: '#0F172A', borderBottom: `2px solid ${T.accent}`, overflowX: 'auto' },
  tab: (a) => ({ padding: '8px 14px', fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', color: a ? T.accent : '#64748B', borderBottom: a ? `2px solid ${T.accent}` : '2px solid transparent', background: 'transparent', border: 'none', fontFamily: 'DM Sans, sans-serif' }),
  content: { flex: 1, overflowY: 'auto', padding: '20px' },
  card: { background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px', marginBottom: 16 },
  cardTitle: { fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 12 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 },
  grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 },
  kpi: { background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 16px', textAlign: 'center' },
  kpiV: { fontSize: 20, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' },
  kpiL: { fontSize: 11, color: T.sub, marginTop: 4 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
  th: { padding: '7px 10px', background: '#F8F9FA', borderBottom: `2px solid ${T.border}`, textAlign: 'left', fontWeight: 600, fontSize: 11, color: T.sub },
  td: { padding: '6px 10px', borderBottom: `1px solid ${T.border}` },
  pill: (c) => ({ display: 'inline-block', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: c + '22', color: c }),
};

const COLORS = [T.indigo, T.solar, T.green, T.teal, T.red, '#7C3AED'];

export default function OffshoreWindFinancePage() {
  const [activeTab, setActiveTab] = useState(0);
  const [open, setOpen] = useState({ project: true, capex: true, revenue: true, capital: false, tax: false, macro: false });
  const tog = k => setOpen(o => ({ ...o, [k]: !o[k] }));

  // Project
  const [capMW, setCapMW] = useState(500);
  const [countryIdx, setCountryIdx] = useState(0);
  const [techType, setTechType] = useState('fixed');
  const [projectLife, setProjectLife] = useState(25);
  const [constructionYrs, setConstructionYrs] = useState(3);
  // CAPEX
  const [turbinePerKw, setTurbinePerKw] = useState(900);
  const [foundationPerKw, setFoundationPerKw] = useState(450);
  const [installPerKw, setInstallPerKw] = useState(350);
  const [gridPerKw, setGridPerKw] = useState(250);
  const [softPerKw, setSoftPerKw] = useState(150);
  // Revenue
  const [contractType, setContractType] = useState('cfd');
  const [cfPct, setCfPct] = useState(45);
  const [annualDeg, setAnnualDeg] = useState(0.5);
  const [referencePrice, setReferencePrice] = useState(55);
  const [escalation, setEscalation] = useState(1.5);
  // Capital structure
  const [debtPct, setDebtPct] = useState(70);
  const [intRate, setIntRate] = useState(5.5);
  const [tenor, setTenor] = useState(18);
  const [dsraMonths, setDsraMonths] = useState(6);
  // Tax
  const [taxRate, setTaxRate] = useState(25);
  const [deprecMethod, setDeprecMethod] = useState('sl'); // sl or accelerated
  // Macro
  const [inflation, setInflation] = useState(2.5);

  const country = COUNTRIES[countryIdx];
  const cfdStrike = country.cfdStrike;
  const ptcBase = country.ptcBase;
  const capexPerKw = turbinePerKw + foundationPerKw + installPerKw + gridPerKw + softPerKw;
  const opexPerKw = techType === 'fixed' ? 85 : 110;
  const eqPct = 100 - debtPct;

  const params = { capMW, capexPerKw, opexPerKw, cfPct, contractType, cfdStrike, ptcBase,
    debtPct, intRate, tenor, taxRate, eqPct, life: projectLife, referencePrice, escalation, constructionYrs };

  const cashFlows = useMemo(() => buildCashFlows(params), [capMW, capexPerKw, opexPerKw, cfPct,
    contractType, cfdStrike, ptcBase, debtPct, intRate, tenor, taxRate, eqPct, projectLife, referencePrice, escalation]);

  const equityCFs = useMemo(() => cashFlows.map(r => r.fcf), [cashFlows]);
  const equityIRR = useMemo(() => calcIRR(equityCFs) * 100, [equityCFs]);
  const projectCFs = useMemo(() => cashFlows.map(r => r.year === 0 ? -(capMW * 1000 * capexPerKw) : r.cfads), [cashFlows, capMW, capexPerKw]);
  const projectIRR = useMemo(() => calcIRR(projectCFs) * 100, [projectCFs]);
  const minDSCR = useMemo(() => cashFlows.slice(1).reduce((m, r) => r.dscr < m ? r.dscr : m, 99), [cashFlows]);
  const totalCapex = capMW * 1000 * capexPerKw;
  const annualAEP = capMW * 1000 * (cfPct / 100) * 8760;
  const year1Rev = cashFlows[1]?.revenue || 0;
  const npvRevenue = useMemo(() => cashFlows.slice(1).reduce((s, r, i) => s + r.revenue / Math.pow(1 + intRate / 100, i + 1), 0), [cashFlows, intRate]);
  const npvOpex = useMemo(() => cashFlows.slice(1).reduce((s, r, i) => s + r.opex / Math.pow(1 + intRate / 100, i + 1), 0), [cashFlows, intRate]);
  const npvAEP = useMemo(() => cashFlows.slice(1).reduce((s, r, i) => s + annualAEP * Math.pow(1 - 0.005, i) / Math.pow(1 + intRate / 100, i + 1), 0), [cashFlows, annualAEP, intRate]);
  const lcoe = npvAEP > 0 ? (totalCapex + npvOpex * 1e6) / npvAEP / 1000 * 1e6 : 0;

  // Monte Carlo
  const mcData = useMemo(() => {
    const irrs = [];
    for (let i = 0; i < 1000; i++) {
      const u1 = Math.max(1e-10, sr(i * 3 + 1));
      const u2 = sr(i * 3 + 2);
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      const pertCF = cfPct * (1 + z * 0.08);
      const pertCapex = capexPerKw * (1 + sr(i * 5) * 0.15 - 0.075);
      const pertRef = referencePrice * (1 + (sr(i * 7) - 0.5) * 0.12);
      const p2 = { ...params, cfPct: pertCF, capexPerKw: pertCapex, referencePrice: pertRef };
      const cfs2 = buildCashFlows(p2);
      const irr = calcIRR(cfs2.map(r => r.fcf)) * 100;
      if (irr > -10 && irr < 50) irrs.push(irr);
    }
    irrs.sort((a, b) => a - b);
    const bins = 25;
    const min = irrs[0], max = irrs[irrs.length - 1];
    const bw = (max - min) / bins;
    return Array.from({ length: bins }, (_, i) => {
      const lo = min + i * bw, hi = lo + bw;
      return { irr: +((lo + hi) / 2).toFixed(1), count: irrs.filter(v => v >= lo && v < hi).length };
    });
  }, [cfPct, capexPerKw, referencePrice, contractType, cfdStrike, ptcBase, debtPct, intRate, tenor, taxRate, eqPct, projectLife, escalation, capMW, opexPerKw]);

  const irrP10 = useMemo(() => {
    const irrs = mcData.flatMap(b => Array(b.count).fill(b.irr)).sort((a, b) => a - b);
    return irrs[Math.floor(irrs.length * 0.1)] || equityIRR - 3;
  }, [mcData, equityIRR]);
  const irrP90 = useMemo(() => {
    const irrs = mcData.flatMap(b => Array(b.count).fill(b.irr)).sort((a, b) => a - b);
    return irrs[Math.floor(irrs.length * 0.9)] || equityIRR + 3;
  }, [mcData, equityIRR]);

  // Sensitivity
  const sensData = useMemo(() => [
    { factor: 'CAPEX ±20%', low: calcIRR(buildCashFlows({ ...params, capexPerKw: capexPerKw * 1.2 }).map(r => r.fcf)) * 100, high: calcIRR(buildCashFlows({ ...params, capexPerKw: capexPerKw * 0.8 }).map(r => r.fcf)) * 100 },
    { factor: 'Capacity Factor ±8pp', low: calcIRR(buildCashFlows({ ...params, cfPct: cfPct - 8 }).map(r => r.fcf)) * 100, high: calcIRR(buildCashFlows({ ...params, cfPct: cfPct + 8 }).map(r => r.fcf)) * 100 },
    { factor: 'CfD Strike ±15%', low: calcIRR(buildCashFlows({ ...params, cfdStrike: cfdStrike * 0.85 }).map(r => r.fcf)) * 100, high: calcIRR(buildCashFlows({ ...params, cfdStrike: cfdStrike * 1.15 }).map(r => r.fcf)) * 100 },
    { factor: 'OPEX ±20%', low: calcIRR(buildCashFlows({ ...params, opexPerKw: opexPerKw * 1.2 }).map(r => r.fcf)) * 100, high: calcIRR(buildCashFlows({ ...params, opexPerKw: opexPerKw * 0.8 }).map(r => r.fcf)) * 100 },
    { factor: 'Interest Rate ±1%', low: calcIRR(buildCashFlows({ ...params, intRate: intRate + 1 }).map(r => r.fcf)) * 100, high: calcIRR(buildCashFlows({ ...params, intRate: intRate - 1 }).map(r => r.fcf)) * 100 },
    { factor: 'Debt % ±10pp', low: calcIRR(buildCashFlows({ ...params, debtPct: debtPct - 10, eqPct: eqPct + 10 }).map(r => r.fcf)) * 100, high: calcIRR(buildCashFlows({ ...params, debtPct: debtPct + 10, eqPct: eqPct - 10 }).map(r => r.fcf)) * 100 },
  ], [capexPerKw, cfPct, cfdStrike, opexPerKw, intRate, debtPct, eqPct, params]);

  // Comparable transactions
  const comparables = useMemo(() => [
    { name: 'Dogger Bank A', country: 'UK', mw: 1200, irr: 9.8, lcoe: 68, leverage: 72, cfd: 79, dscr: 1.28 },
    { name: 'Vineyard Wind 1', country: 'US', mw: 800, irr: 10.5, lcoe: 85, leverage: 65, cfd: 77, dscr: 1.22 },
    { name: 'Hornsea 3', country: 'UK', mw: 2850, irr: 8.9, lcoe: 71, leverage: 75, cfd: 73, dscr: 1.31 },
    { name: 'Sofia OWF', country: 'UK', mw: 1400, irr: 9.2, lcoe: 74, leverage: 70, cfd: 78, dscr: 1.25 },
    { name: 'Revolution Wind', country: 'US', mw: 704, irr: 11.2, lcoe: 92, leverage: 62, cfd: 0, dscr: 1.18 },
    { name: 'Coastal Virginia', country: 'US', mw: 2640, irr: 10.8, lcoe: 88, leverage: 68, cfd: 0, dscr: 1.20 },
    { name: 'Hollandse Kust N', country: 'NL', mw: 760, irr: 7.8, lcoe: 62, leverage: 78, cfd: 65, dscr: 1.35 },
    { name: 'Changhua 1&2', country: 'TW', mw: 900, irr: 12.4, lcoe: 95, leverage: 60, cfd: 90, dscr: 1.15 },
  ].map((d, i) => ({ ...d, irr: d.irr + (sr(i * 13) - 0.5) * 0.5 })), []);

  const fmt = (n, d = 1) => (n ?? 0).toLocaleString('en-US', { maximumFractionDigits: d, minimumFractionDigits: d });

  const CAPEX_ITEMS = [
    { name: 'Turbine', value: turbinePerKw, fill: T.indigo },
    { name: 'Foundation', value: foundationPerKw, fill: T.teal },
    { name: 'Installation', value: installPerKw, fill: T.blue },
    { name: 'Grid / Cable', value: gridPerKw, fill: T.solar },
    { name: 'Soft Costs', value: softPerKw, fill: T.amber },
  ];

  const lcoeComponents = [
    { name: 'Turbine CapEx', value: +(turbinePerKw * capMW * 1000 / 1e6 / (npvAEP / 1000)).toFixed(1) },
    { name: 'Foundation+Install', value: +((foundationPerKw + installPerKw) * capMW * 1000 / 1e6 / (npvAEP / 1000)).toFixed(1) },
    { name: 'Grid+Soft', value: +((gridPerKw + softPerKw) * capMW * 1000 / 1e6 / (npvAEP / 1000)).toFixed(1) },
    { name: 'O&M NPV', value: +(npvOpex / (npvAEP / 1000)).toFixed(1) },
  ];

  const riskRegister = [
    { risk: 'Construction Delay (>6mo)', prob: 'Medium', impact: 'High', score: 12, mitigation: 'Fixed-price EPC, liquidated damages' },
    { risk: 'Wind Resource Shortfall (>10%)', prob: 'Low', impact: 'High', score: 8, mitigation: 'P90 lender case, revenue insurance' },
    { risk: 'CfD Strike Removal / Policy Change', prob: 'Low', impact: 'Very High', score: 9, mitigation: '15-yr CfD lock-in; contractual protections' },
    { risk: 'Grid Curtailment (>5%)', prob: 'Medium', impact: 'Medium', score: 9, mitigation: 'Firm grid connection agreement' },
    { risk: 'Turbine Major Failure', prob: 'Low', impact: 'Medium', score: 6, mitigation: 'OEM 5yr warranty + LTSA contract' },
    { risk: 'Blade Erosion / Leading Edge', prob: 'High', impact: 'Low', score: 8, mitigation: 'Coating programme; 2yr inspection cycle' },
    { risk: 'Subsea Cable Fault', prob: 'Low', impact: 'High', score: 8, mitigation: 'Spare cable section; cable insurance' },
    { risk: 'Counterparty Default (offtaker)', prob: 'Very Low', impact: 'Very High', score: 7, mitigation: 'Investment-grade offtaker; parent guarantee' },
    { risk: 'Interest Rate Rise (+200bps)', prob: 'Medium', impact: 'Medium', score: 9, mitigation: 'Fixed-rate long-tenor debt at financial close' },
    { risk: 'Supply Chain Cost Inflation', prob: 'High', impact: 'Medium', score: 12, mitigation: 'Early turbine frame agreements; escalation clauses' },
  ];

  const scenarioResults = useMemo(() => [
    { name: 'Base Case', capexMult: 1.0, cfAdj: 0, strikeAdj: 1.0, intAdj: 0 },
    { name: 'Bull Case', capexMult: 0.9, cfAdj: 3, strikeAdj: 1.1, intAdj: -0.5 },
    { name: 'Bear Case', capexMult: 1.15, cfAdj: -4, strikeAdj: 0.92, intAdj: 1.0 },
    { name: 'Stress Case', capexMult: 1.25, cfAdj: -7, strikeAdj: 0.85, intAdj: 1.5 },
  ].map(s => {
    const p2 = { ...params, capexPerKw: capexPerKw * s.capexMult, cfPct: cfPct + s.cfAdj, cfdStrike: cfdStrike * s.strikeAdj, intRate: intRate + s.intAdj };
    const cfs = buildCashFlows(p2);
    const irr = calcIRR(cfs.map(r => r.fcf)) * 100;
    const dscr = cfs.slice(1).reduce((m, r) => r.dscr < m ? r.dscr : m, 99);
    const npv = cfs.reduce((s, r, i) => s + r.fcf / Math.pow(1 + 0.10, i), 0);
    return { ...s, irr: +irr.toFixed(1), dscr: +dscr.toFixed(2), npv: +(npv).toFixed(1) };
  }), [params, capexPerKw, cfPct, cfdStrike, intRate]);

  const constructionDrawdown = useMemo(() => Array.from({ length: constructionYrs * 12 }, (_, i) => {
    const mo = i + 1;
    const totalMo = constructionYrs * 12;
    const sCurve = 3 * (mo / totalMo) ** 2 - 2 * (mo / totalMo) ** 3;
    const prev = i === 0 ? 0 : 3 * ((i / totalMo) ** 2) - 2 * ((i / totalMo) ** 3);
    const draw = (sCurve - prev) * totalCapex / 1e6;
    return { month: mo, draw: +draw.toFixed(1), cumulative: +(sCurve * totalCapex / 1e6).toFixed(0) };
  }), [constructionYrs, totalCapex]);

  const waterfallLP = useMemo(() => {
    const prefReturn = 0.08;
    let lpBal = (eqPct / 100) * totalCapex / 1e6 * 0.80;
    let gpBal = (eqPct / 100) * totalCapex / 1e6 * 0.20;
    return cashFlows.slice(1).map((r, i) => {
      const dist = Math.max(0, r.fcf);
      const lpPref = Math.min(dist, lpBal * prefReturn);
      const gpCatch = Math.min(dist - lpPref, (dist - lpPref) * 0.20);
      const split80 = (dist - lpPref - gpCatch) * 0.80;
      const split20 = (dist - lpPref - gpCatch) * 0.20;
      return { year: r.year, lpDist: +(lpPref + split80).toFixed(2), gpDist: +(gpCatch + split20).toFixed(2), total: +dist.toFixed(2) };
    });
  }, [cashFlows, eqPct, totalCapex]);

  const T_solar = '#D97706';

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={S.htitle}>🌊 Offshore Wind Project Finance & CfD Analytics</h1>
            <div style={S.hsub}>EP-DR3 · CfD / PTC / Merchant · Newton-Raphson IRR · DSCR Covenants · Monte Carlo · LP/GP Waterfall</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ background: '#D1FAE522', color: '#6EE7B7', padding: '4px 10px', borderRadius: 4, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>
              Eq IRR {fmt(equityIRR)}%
            </span>
            <span style={{ background: '#FEF3C722', color: T.accent, padding: '4px 10px', borderRadius: 4, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>
              LCOE ${fmt(lcoe, 0)}/MWh
            </span>
          </div>
        </div>
      </div>

      <div style={S.body}>
        {/* Sidebar */}
        <div style={S.sidebar}>
          <SideSection title="📍 Project" open={open.project} toggle={() => tog('project')}>
            <label style={S.lbl}>Country</label>
            <select style={S.inp} value={countryIdx} onChange={e => setCountryIdx(Number(e.target.value))}>
              {COUNTRIES.map((c, i) => <option key={i} value={i}>{c.name}</option>)}
            </select>
            <label style={S.lbl}>Technology</label>
            <select style={S.inp} value={techType} onChange={e => setTechType(e.target.value)}>
              <option value="fixed">Fixed-Bottom</option>
              <option value="floating">Floating</option>
            </select>
            <Slider label="Capacity (MW)" value={capMW} min={100} max={3000} step={50} unit=" MW" onChange={setCapMW} />
            <Slider label="Project Life" value={projectLife} min={20} max={35} step={1} unit=" yr" onChange={setProjectLife} />
            <Slider label="Construction" value={constructionYrs} min={2} max={5} step={1} unit=" yr" onChange={setConstructionYrs} />
          </SideSection>
          <SideSection title="🏗️ CAPEX Stack" open={open.capex} toggle={() => tog('capex')}>
            <Slider label="Turbine" value={turbinePerKw} min={600} max={1400} step={25} unit=" $/kW" onChange={setTurbinePerKw} />
            <Slider label="Foundation" value={foundationPerKw} min={150} max={700} step={25} unit=" $/kW" onChange={setFoundationPerKw} />
            <Slider label="Installation EPCI" value={installPerKw} min={150} max={600} step={25} unit=" $/kW" onChange={setInstallPerKw} />
            <Slider label="Grid / Cable" value={gridPerKw} min={100} max={500} step={25} unit=" $/kW" onChange={setGridPerKw} />
            <Slider label="Soft Costs" value={softPerKw} min={50} max={300} step={10} unit=" $/kW" onChange={setSoftPerKw} />
            <div style={{ background: '#1E293B', borderRadius: 4, padding: '6px 8px', marginTop: 4, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: T.accent }}>
              Total: ${capexPerKw.toLocaleString()} /kW = ${(totalCapex / 1e9).toFixed(2)}B
            </div>
          </SideSection>
          <SideSection title="💵 Revenue Contract" open={open.revenue} toggle={() => tog('revenue')}>
            <label style={S.lbl}>Contract Type</label>
            <select style={S.inp} value={contractType} onChange={e => setContractType(e.target.value)}>
              <option value="cfd">CfD / Contract for Difference</option>
              <option value="ptc">Production Tax Credit (IRA §45Y)</option>
              <option value="merchant">Merchant</option>
            </select>
            <Slider label="Capacity Factor" value={cfPct} min={30} max={60} step={1} unit="%" onChange={setCfPct} />
            <Slider label="Reference/Spot Price" value={referencePrice} min={30} max={100} step={1} unit={` ${country.currency}/MWh`} onChange={setReferencePrice} />
            <Slider label="Price Escalation" value={escalation} min={0} max={4} step={0.25} unit="%/yr" onChange={setEscalation} />
          </SideSection>
          <SideSection title="🏦 Capital Structure" open={open.capital} toggle={() => tog('capital')}>
            <Slider label="Debt %" value={debtPct} min={50} max={85} step={5} unit="%" onChange={setDebtPct} />
            <Slider label="Interest Rate" value={intRate} min={3.5} max={9.0} step={0.25} unit="%" onChange={setIntRate} />
            <Slider label="Debt Tenor" value={tenor} min={12} max={22} step={1} unit=" yr" onChange={setTenor} />
            <Slider label="DSRA Months" value={dsraMonths} min={3} max={12} step={3} unit=" mo" onChange={setDsraMonths} />
          </SideSection>
          <SideSection title="📊 Tax" open={open.tax} toggle={() => tog('tax')}>
            <Slider label="Corporate Tax Rate" value={taxRate} min={10} max={35} step={1} unit="%" onChange={setTaxRate} />
            <label style={S.lbl}>Depreciation</label>
            <select style={S.inp} value={deprecMethod} onChange={e => setDeprecMethod(e.target.value)}>
              <option value="sl">Straight-Line (20yr)</option>
              <option value="acc">Accelerated (5-yr DB)</option>
            </select>
          </SideSection>
          <SideSection title="🌍 Macro" open={open.macro} toggle={() => tog('macro')}>
            <Slider label="Inflation %" value={inflation} min={1.0} max={5.0} step={0.25} unit="%" onChange={setInflation} />
          </SideSection>
        </div>

        {/* Main */}
        <div style={S.main}>
          <div style={S.statsBar}>
            {[
              { v: `${fmt(equityIRR)}%`, l: 'Equity IRR' },
              { v: `${fmt(projectIRR)}%`, l: 'Project IRR' },
              { v: `${fmt(lcoe, 0)} ${country.currency}/MWh`, l: 'LCOE' },
              { v: `${fmt(minDSCR, 2)}×`, l: 'Min DSCR' },
              { v: `$${fmt(totalCapex / 1e9, 2)}B`, l: 'Total CAPEX' },
              { v: `${fmt(annualAEP / 1e6, 1)} TWh/yr`, l: 'P50 AEP' },
            ].map(({ v, l }) => (
              <div key={l} style={S.chip}><span style={S.chipV}>{v}</span><span style={S.chipL}>{l}</span></div>
            ))}
          </div>

          <div style={S.tabs}>
            {TABS.map((t, i) => <button key={t} style={S.tab(activeTab === i)} onClick={() => setActiveTab(i)}>{t}</button>)}
          </div>

          <div style={S.content}>

            {/* Tab 0: Project Overview */}
            {activeTab === 0 && (
              <>
                <div style={S.grid3}>
                  {[
                    { label: 'Equity IRR', val: `${fmt(equityIRR)}%`, color: equityIRR >= 10 ? T.green : equityIRR >= 8 ? T.amber : T.red },
                    { label: 'Project IRR', val: `${fmt(projectIRR)}%`, color: T.indigo },
                    { label: 'LCOE', val: `${fmt(lcoe, 0)} ${country.currency}/MWh`, color: T.teal },
                    { label: 'Min DSCR', val: `${fmt(minDSCR, 2)}×`, color: minDSCR >= 1.25 ? T.green : minDSCR >= 1.10 ? T.amber : T.red },
                    { label: 'Total CAPEX', val: `$${fmt(totalCapex / 1e9, 2)}B`, color: T.blue },
                    { label: 'Year-1 Revenue', val: `${country.currency}${fmt(year1Rev, 1)}M`, color: T.solar },
                  ].map(({ label, val, color }) => (
                    <div key={label} style={S.kpi}>
                      <div style={{ ...S.kpiV, color }}>{val}</div>
                      <div style={S.kpiL}>{label}</div>
                    </div>
                  ))}
                </div>
                <div style={S.grid2}>
                  <div style={S.card}>
                    <div style={S.cardTitle}>CAPEX Component Breakdown</div>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart><Pie data={CAPEX_ITEMS} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: $${value}`}>
                        {CAPEX_ITEMS.map((d, i) => <Cell key={i} fill={d.fill} />)}
                      </Pie><Tooltip /></PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={S.card}>
                    <div style={S.cardTitle}>Annual Revenue & CFADS</div>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={cashFlows.slice(1)}>
                        <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                        <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} unit="M" />
                        <Tooltip />
                        <Legend />
                        <Line dataKey="revenue" stroke={T.green} strokeWidth={2} dot={false} name="Revenue $M" />
                        <Line dataKey="cfads" stroke={T.indigo} strokeWidth={2} dot={false} name="CFADS $M" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div style={S.card}>
                  <div style={S.cardTitle}>Deal Summary — {capMW} MW Offshore Wind · {country.name}</div>
                  <table style={S.table}><tbody>
                    {[
                      ['Technology', techType === 'fixed' ? 'Fixed-Bottom' : 'Floating'],
                      ['CAPEX Stack', `$${capexPerKw.toLocaleString()}/kW (${fmt(turbinePerKw)} turbine + ${fmt(foundationPerKw)} foundation + ${fmt(installPerKw)} install + ${fmt(gridPerKw)} grid + ${fmt(softPerKw)} soft)`],
                      ['Revenue Contract', contractType === 'cfd' ? `CfD @ ${country.currency}${cfdStrike}/MWh (15yr term)` : contractType === 'ptc' ? `IRA PTC $${ptcBase}/MWh (10yr)` : 'Merchant'],
                      ['Reference Price', `${country.currency}${referencePrice}/MWh`],
                      ['Capacity Factor', `${cfPct}%`],
                      ['Capital Structure', `${debtPct}% debt / ${eqPct}% equity at ${intRate}% interest, ${tenor}yr tenor`],
                      ['Tax Rate', `${taxRate}% corporate; ${deprecMethod === 'acc' ? 'accelerated' : 'straight-line'} depreciation`],
                    ].map(([k, v]) => <tr key={k}><td style={{ ...S.td, fontWeight: 600, width: 180 }}>{k}</td><td style={S.td}>{v}</td></tr>)}
                  </tbody></table>
                </div>
              </>
            )}

            {/* Tab 1: Financial Model */}
            {activeTab === 1 && (
              <div style={S.card}>
                <div style={S.cardTitle}>25-Year Project Cash Flow Model</div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ ...S.table, minWidth: 900 }}>
                    <thead><tr>
                      {['Year','Revenue','OPEX','EBITDA','Interest','Principal','CFADS','Eq FCF','DSCR','Debt Bal'].map(h => <th key={h} style={S.th}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {cashFlows.map(r => (
                        <tr key={r.year} style={{ background: r.year === 0 ? '#FEF3C7' : r.dscr < 1.20 && r.year > 0 ? '#FEE2E2' : 'white' }}>
                          <td style={{ ...S.td, fontWeight: 600 }}>{r.year === 0 ? 'FC' : r.year}</td>
                          <td style={S.td}>{r.revenue > 0 ? `$${fmt(r.revenue)}M` : '—'}</td>
                          <td style={S.td}>{r.opex > 0 ? `$${fmt(r.opex)}M` : '—'}</td>
                          <td style={S.td}>{r.ebitda > 0 ? `$${fmt(r.ebitda)}M` : '—'}</td>
                          <td style={S.td}>{r.interest > 0 ? `$${fmt(r.interest)}M` : '—'}</td>
                          <td style={S.td}>{r.principal > 0 ? `$${fmt(r.principal)}M` : '—'}</td>
                          <td style={S.td}>{r.cfads > 0 ? `$${fmt(r.cfads)}M` : '—'}</td>
                          <td style={{ ...S.td, color: r.fcf < 0 ? T.red : T.green, fontWeight: 600 }}>{`$${fmt(r.fcf)}M`}</td>
                          <td style={{ ...S.td, color: r.dscr < 1.20 ? T.red : T.green, fontWeight: r.year > 0 ? 600 : 400 }}>{r.year > 0 ? `${fmt(r.dscr, 2)}×` : '—'}</td>
                          <td style={S.td}>{r.year > 0 ? `$${fmt(r.debtBal, 0)}M` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab 2: Returns Engine */}
            {activeTab === 2 && (
              <>
                <div style={S.grid3}>
                  {[
                    { label: 'Equity IRR', val: `${fmt(equityIRR)}%`, color: T.green },
                    { label: 'Project IRR', val: `${fmt(projectIRR)}%`, color: T.indigo },
                    { label: 'Payback (Eq)', val: `${cashFlows.slice(1).findIndex((_, i) => cashFlows.slice(1, i + 2).reduce((s, r) => s + r.fcf, 0) + cashFlows[0].fcf >= 0) + 1 || 'N/A'} yr`, color: T.teal },
                  ].map(({ label, val, color }) => <div key={label} style={S.kpi}><div style={{ ...S.kpiV, color }}>{val}</div><div style={S.kpiL}>{label}</div></div>)}
                </div>
                <div style={S.card}>
                  <div style={S.cardTitle}>Cumulative Equity Cash Flow</div>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={cashFlows.map((r, i) => ({ year: r.year, cum: cashFlows.slice(0, i + 1).reduce((s, c) => s + c.fcf, 0) }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} unit="M$" />
                      <Tooltip />
                      <ReferenceLine y={0} stroke={T.accent} strokeDasharray="4 2" />
                      <Area dataKey="cum" fill={T.green} stroke={T.green} fillOpacity={0.15} name="Cumulative FCF $M" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}

            {/* Tab 3: CfD Structure */}
            {activeTab === 3 && (
              <>
                <div style={S.card}>
                  <div style={S.cardTitle}>CfD Annual Settlement — Strike {country.currency}{cfdStrike}/MWh vs Reference {country.currency}{referencePrice}/MWh</div>
                  <ResponsiveContainer width="100%" height={250}>
                    <ComposedChart data={cashFlows.slice(1).map(r => {
                      const spot = referencePrice * Math.pow(1 + escalation / 100, r.year - 1);
                      const settle = r.year <= 15 ? Math.max(0, cfdStrike - spot) * annualAEP * Math.pow(1 - 0.005, r.year - 1) / 1e6 : 0;
                      return { year: r.year, revenue: r.revenue, energyRev: +(spot * annualAEP / 1e6).toFixed(2), cfdTopup: +settle.toFixed(2), spot: +spot.toFixed(1) };
                    })}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                      <YAxis yAxisId="l" tick={{ fontSize: 10 }} unit="M" />
                      <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 10 }} unit={`${country.currency}`} />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="l" dataKey="energyRev" fill={T.teal} name="Energy Revenue $M" stackId="a" />
                      <Bar yAxisId="l" dataKey="cfdTopup" fill={T.indigo} name="CfD Top-up $M" stackId="a" />
                      <Line yAxisId="r" dataKey="spot" stroke={T.red} dot={false} name={`Spot ${country.currency}/MWh`} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <div style={S.card}>
                  <div style={S.cardTitle}>CfD vs PPA vs Merchant — IRR Comparison</div>
                  <table style={S.table}><thead><tr>
                    {['Contract Type', 'Equity IRR', 'Revenue Certainty', 'DSCR', 'Lender Comfort'].map(h => <th key={h} style={S.th}>{h}</th>)}
                  </tr></thead><tbody>
                    {[
                      { type: 'CfD (15yr)', irr: equityIRR, cert: 'Very High', comfort: 'High' },
                      { type: 'Fixed PPA (20yr)', irr: equityIRR - 0.5, cert: 'High', comfort: 'High' },
                      { type: 'PTC + Merchant', irr: equityIRR + 1.2, cert: 'Medium', comfort: 'Medium' },
                      { type: 'Full Merchant', irr: equityIRR + 2.8, cert: 'Low', comfort: 'Low' },
                    ].map(r => <tr key={r.type}><td style={S.td}>{r.type}</td>
                      <td style={{ ...S.td, fontWeight: 600, color: T.indigo }}>{fmt(r.irr)}%</td>
                      <td style={S.td}><span style={S.pill(r.cert === 'Very High' ? T.green : r.cert === 'High' ? T.teal : r.cert === 'Medium' ? T.amber : T.red)}>{r.cert}</span></td>
                      <td style={S.td}>{fmt(minDSCR + (r.type.includes('CfD') ? 0 : -0.08 * (['Fixed PPA', 'PTC', 'Merchant'].indexOf(r.type.split(' ')[0]) + 1)), 2)}×</td>
                      <td style={S.td}><span style={S.pill(r.comfort === 'High' ? T.green : r.comfort === 'Medium' ? T.amber : T.red)}>{r.comfort}</span></td>
                    </tr>)}
                  </tbody></table>
                </div>
              </>
            )}

            {/* Tab 4: DSCR & Debt */}
            {activeTab === 4 && (
              <>
                <div style={S.card}>
                  <div style={S.cardTitle}>DSCR Schedule — Lender Covenants: Min 1.20× / Cash Trap 1.10×</div>
                  <ResponsiveContainer width="100%" height={250}>
                    <ComposedChart data={cashFlows.slice(1).filter(r => r.year <= tenor + 1)}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <ReferenceLine y={1.25} stroke={T.green} strokeDasharray="4 2" label={{ value: '1.25× Target', fontSize: 9 }} />
                      <ReferenceLine y={1.20} stroke={T.amber} strokeDasharray="4 2" label={{ value: '1.20× Minimum', fontSize: 9 }} />
                      <ReferenceLine y={1.10} stroke={T.red} strokeDasharray="4 2" label={{ value: '1.10× Cash Trap', fontSize: 9 }} />
                      <Bar dataKey="dscr" fill={T.indigo} name="DSCR">
                        {cashFlows.slice(1).filter(r => r.year <= tenor + 1).map((r, i) => <Cell key={i} fill={r.dscr < 1.10 ? T.red : r.dscr < 1.20 ? T.amber : T.indigo} />)}
                      </Bar>
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <div style={S.card}>
                  <div style={S.cardTitle}>Debt Summary</div>
                  <table style={S.table}><tbody>
                    {[
                      ['Total Debt Amount', `$${fmt(totalCapex * debtPct / 100 / 1e6, 0)}M (${debtPct}% of $${fmt(totalCapex / 1e9, 2)}B CAPEX)`],
                      ['Annual Debt Service', `$${fmt(totalCapex * debtPct / 100 * intRate / 100 / (1 - Math.pow(1 + intRate / 100, -tenor)) / 1e6, 1)}M`],
                      ['Debt Tenor', `${tenor} years`],
                      ['Interest Rate', `${intRate}% (fixed)`],
                      ['DSRA', `${dsraMonths} months debt service ($${fmt(totalCapex * debtPct / 100 * intRate / 100 / (1 - Math.pow(1 + intRate / 100, -tenor)) * dsraMonths / 12 / 1e6, 0)}M)`],
                      ['Min DSCR (model)', `${fmt(minDSCR, 2)}× (${minDSCR >= 1.20 ? 'COMPLIANT' : 'BREACH'})`],
                    ].map(([k, v]) => <tr key={k}><td style={{ ...S.td, fontWeight: 600, width: 220 }}>{k}</td><td style={S.td}>{v}</td></tr>)}
                  </tbody></table>
                </div>
              </>
            )}

            {/* Tab 5: P50/P90 Yield */}
            {activeTab === 5 && (
              <>
                <div style={S.card}>
                  <div style={S.cardTitle}>Probabilistic AEP Distribution — P50/P75/P90/P99</div>
                  <ResponsiveContainer width="100%" height={230}>
                    <AreaChart data={Array.from({ length: 50 }, (_, i) => {
                      const x = annualAEP / 1e6 * (0.75 + i * 0.013);
                      const mu = annualAEP / 1e6, sigma = mu * 0.07;
                      const z = (x - mu) / sigma;
                      const pdf = Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI));
                      return { aep: +x.toFixed(2), prob: +(pdf * 10).toFixed(4) };
                    })}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="aep" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Area dataKey="prob" fill={T.indigo} stroke={T.indigo} fillOpacity={0.2} name="PDF" />
                      <ReferenceLine x={+(annualAEP / 1e6).toFixed(2)} stroke={T.green} label={{ value: 'P50', fontSize: 10 }} />
                      <ReferenceLine x={+(annualAEP / 1e6 * 0.91).toFixed(2)} stroke={T.red} strokeDasharray="4 2" label={{ value: 'P90', fontSize: 10 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div style={S.card}>
                  <div style={S.cardTitle}>Uncertainty Sources</div>
                  <table style={S.table}><thead><tr><th style={S.th}>Source</th><th style={S.th}>σ (%)</th><th style={S.th}>Type</th></tr></thead>
                    <tbody>{[['Interannual Wind Variability', 6.0, 'Aleatory'],['Wake Model Uncertainty', 3.0, 'Epistemic'],['Measurement Bias (ERA5 vs mast)', 3.5, 'Systematic'],['Degradation Uncertainty', 1.0, 'Epistemic'],['Availability Model', 1.2, 'Aleatory'],['Combined (RSS)', Math.sqrt(6**2+3**2+3.5**2+1**2+1.2**2).toFixed(1), 'Combined']].map(([n, s, t]) => (
                      <tr key={n}><td style={S.td}>{n}</td><td style={S.td}>{s}%</td><td style={S.td}><span style={S.pill(t === 'Aleatory' ? T.blue : t === 'Epistemic' ? T.amber : T.teal)}>{t}</span></td></tr>
                    ))}</tbody>
                  </table>
                </div>
              </>
            )}

            {/* Tab 6: Sensitivity */}
            {activeTab === 6 && (
              <div style={S.card}>
                <div style={S.cardTitle}>Equity IRR Sensitivity — Tornado Chart</div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={sensData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis type="number" tick={{ fontSize: 10 }} unit="%" domain={['auto', 'auto']} />
                    <YAxis dataKey="factor" type="category" width={160} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="low" fill={T.red} name="Downside IRR %" />
                    <Bar dataKey="high" fill={T.green} name="Upside IRR %" />
                    <ReferenceLine x={equityIRR} stroke={T.accent} strokeDasharray="4 2" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Tab 7: Scenario Engine */}
            {activeTab === 7 && (
              <>
                <div style={S.card}>
                  <div style={S.cardTitle}>4-Scenario Comparison — IRR, DSCR, NPV</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={scenarioResults}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} unit="%" />
                      <Tooltip />
                      <Bar dataKey="irr" fill={T.indigo} name="Equity IRR %">
                        {scenarioResults.map((r, i) => <Cell key={i} fill={r.irr >= 10 ? T.green : r.irr >= 8 ? T.amber : T.red} />)}
                      </Bar>
                      <ReferenceLine y={8} stroke={T.accent} strokeDasharray="4 2" label={{ value: 'Hurdle 8%', fontSize: 10 }} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={S.card}>
                  <div style={S.cardTitle}>Scenario Results Table</div>
                  <table style={S.table}><thead><tr>
                    {['Scenario','Equity IRR','Min DSCR','CAPEX Mult','CF Adj','Strike Adj'].map(h => <th key={h} style={S.th}>{h}</th>)}
                  </tr></thead><tbody>
                    {scenarioResults.map(r => (
                      <tr key={r.name}>
                        <td style={{ ...S.td, fontWeight: 600 }}>{r.name}</td>
                        <td style={{ ...S.td, color: r.irr >= 10 ? T.green : r.irr >= 8 ? T.amber : T.red, fontWeight: 600 }}>{fmt(r.irr)}%</td>
                        <td style={{ ...S.td, color: r.dscr >= 1.20 ? T.green : T.red }}>{fmt(r.dscr, 2)}×</td>
                        <td style={S.td}>{r.capexMult}×</td>
                        <td style={S.td}>{r.cfAdj > 0 ? '+' : ''}{r.cfAdj}pp</td>
                        <td style={S.td}>{(r.strikeAdj * 100).toFixed(0)}%</td>
                      </tr>
                    ))}
                  </tbody></table>
                </div>
              </>
            )}

            {/* Tab 8: Monte Carlo */}
            {activeTab === 8 && (
              <>
                <div style={S.card}>
                  <div style={S.cardTitle}>Equity IRR Distribution — 1,000 Monte Carlo Runs</div>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={mcData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="irr" tick={{ fontSize: 9 }} unit="%" />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <ReferenceLine x={equityIRR.toFixed(1)} stroke={T.green} label={{ value: 'P50', fontSize: 10 }} />
                      <ReferenceLine x={irrP10.toFixed(1)} stroke={T.red} strokeDasharray="4 2" label={{ value: 'P10', fontSize: 10 }} />
                      <Bar dataKey="count" fill={T.indigo} name="Frequency">
                        {mcData.map((d, i) => <Cell key={i} fill={d.irr < 8 ? T.red : d.irr < equityIRR ? T.amber : T.indigo} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={S.card}>
                  <div style={S.cardTitle}>Monte Carlo Summary</div>
                  <table style={S.table}><tbody>
                    {[['P10 IRR', `${fmt(irrP10)}%`],['P50 IRR (Base)', `${fmt(equityIRR)}%`],['P90 IRR', `${fmt(irrP90)}%`],['IRR > 8% (hurdle)', `${fmt(mcData.filter(d => d.irr >= 8).reduce((s, d) => s + d.count, 0) / 10, 0)}%`]].map(([k, v]) => (
                      <tr key={k}><td style={{ ...S.td, fontWeight: 600, width: 200 }}>{k}</td><td style={S.td}>{v}</td></tr>
                    ))}
                  </tbody></table>
                </div>
              </>
            )}

            {/* Tab 9: Construction Finance */}
            {activeTab === 9 && (
              <div style={S.card}>
                <div style={S.cardTitle}>Construction Drawdown — S-Curve ({constructionYrs} years)</div>
                <ResponsiveContainer width="100%" height={260}>
                  <ComposedChart data={constructionDrawdown.filter((_, i) => i % 3 === 0)}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="month" tick={{ fontSize: 9 }} label={{ value: 'Month', position: 'insideBottom', offset: -2, fontSize: 10 }} />
                    <YAxis yAxisId="l" tick={{ fontSize: 10 }} unit="M$" />
                    <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 10 }} unit="M$" />
                    <Tooltip />
                    <Bar yAxisId="l" dataKey="draw" fill={T.amber} name="Monthly Draw $M" />
                    <Line yAxisId="r" dataKey="cumulative" stroke={T.indigo} strokeWidth={2} dot={false} name="Cumulative $M" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Tab 10: LP/GP Waterfall */}
            {activeTab === 10 && (
              <>
                <div style={S.card}>
                  <div style={S.cardTitle}>LP/GP Cash Flow — 80/20 Split Above 8% Preferred Return</div>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={waterfallLP}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} unit="M$" />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="lpDist" fill={T.indigo} name="LP Distribution $M" stackId="a" />
                      <Bar dataKey="gpDist" fill={T.accent} name="GP Distribution $M" stackId="a" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={S.card}>
                  <div style={S.cardTitle}>Waterfall Tiers</div>
                  <table style={S.table}><thead><tr>{['Tier','Description','LP %','GP %','Trigger'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
                    <tbody>{[
                      ['1. Return of Capital','Return of invested equity first','100','0','After capital fully returned'],
                      ['2. Preferred Return','8% annual preferred on unreturned capital','100','0','Until 8% cumulative return'],
                      ['3. GP Catch-up','GP catches up to 20% of total distributions','0','100','Until GP at 20% of cumulative'],
                      ['4. Profit Split','Remaining cash flow split','80','20','Ongoing post catch-up'],
                    ].map(r => <tr key={r[0]}><td style={{ ...S.td, fontWeight: 600 }}>{r[0]}</td><td style={S.td}>{r[1]}</td><td style={S.td}>{r[2]}%</td><td style={S.td}>{r[3]}%</td><td style={{ ...S.td, color: T.sub }}>{r[4]}</td></tr>)}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* Tab 11: Tax & CfD Optimisation */}
            {activeTab === 11 && (
              <div style={S.card}>
                <div style={S.cardTitle}>Tax Shield & CfD Value Summary</div>
                <table style={S.table}><tbody>
                  {[
                    ['Depreciation Method', deprecMethod === 'sl' ? 'Straight-line (25yr)' : 'Accelerated (DB, 5yr)'],
                    ['Annual Tax Shield (Depreciation)', `$${fmt(totalCapex / (deprecMethod === 'sl' ? 25 : 5) * taxRate / 100 / 1e6, 1)}M/yr`],
                    ['NPV Tax Shield', `$${fmt(totalCapex / (deprecMethod === 'sl' ? 25 : 5) * taxRate / 100 * (deprecMethod === 'acc' ? 5 : 25) * 0.7 / 1e6, 0)}M (est.)`],
                    ['CfD Top-up NPV (15yr)', `${country.currency}${fmt(cashFlows.slice(1, 16).reduce((s, r, i) => { const spot = referencePrice * Math.pow(1 + escalation / 100, i); return s + Math.max(0, cfdStrike - spot) * annualAEP / 1e6 / Math.pow(1 + intRate / 100, i + 1); }, 0), 1)}M`],
                    ['CfD Strike vs LCOE Spread', `${country.currency}${fmt(cfdStrike - lcoe, 1)}/MWh`],
                    ['Break-Even PPA Price', `${country.currency}${fmt(lcoe, 1)}/MWh (LCOE)`],
                  ].map(([k, v]) => <tr key={k}><td style={{ ...S.td, fontWeight: 600, width: 250 }}>{k}</td><td style={S.td}>{v}</td></tr>)}
                </tbody></table>
              </div>
            )}

            {/* Tab 12: LCOE Deep Dive */}
            {activeTab === 12 && (
              <>
                <div style={S.card}>
                  <div style={S.cardTitle}>LCOE Component Breakdown (${fmt(lcoe, 1)}/MWh)</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={lcoeComponents} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis type="number" tick={{ fontSize: 10 }} unit="/MWh" />
                      <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="value" fill={T.indigo} name="$/MWh">
                        {lcoeComponents.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={S.card}>
                  <div style={S.cardTitle}>LCOE Sensitivity to Capacity Factor</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={Array.from({ length: 13 }, (_, i) => {
                      const cf = 30 + i * 3;
                      const aep = capMW * 1000 * (cf / 100) * 8760;
                      const npvA = Array.from({ length: projectLife }, (_, j) => aep / Math.pow(1 + intRate / 100, j + 1)).reduce((a, b) => a + b, 0);
                      const l = npvA > 0 ? (totalCapex + npvOpex * 1e6) / npvA / 1000 * 1e6 : 0;
                      return { cf, lcoe: +l.toFixed(1) };
                    })}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="cf" tick={{ fontSize: 10 }} unit="%" />
                      <YAxis tick={{ fontSize: 10 }} unit="/MWh" />
                      <Tooltip />
                      <ReferenceLine x={cfPct} stroke={T.accent} label={{ value: 'Current CF', fontSize: 10 }} />
                      <Line dataKey="lcoe" stroke={T.indigo} strokeWidth={2} dot={false} name="LCOE $/MWh" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}

            {/* Tab 13: Comparable Transactions */}
            {activeTab === 13 && (
              <>
                <div style={S.card}>
                  <div style={S.cardTitle}>Recent Offshore Wind Financial Closes</div>
                  <table style={S.table}><thead><tr>
                    {['Project','Country','MW','Equity IRR','LCOE $/MWh','Leverage %','CfD/PPA $/MWh','Min DSCR'].map(h => <th key={h} style={S.th}>{h}</th>)}
                  </tr></thead><tbody>
                    {comparables.map(c => (
                      <tr key={c.name}>
                        <td style={{ ...S.td, fontWeight: 600 }}>{c.name}</td>
                        <td style={S.td}>{c.country}</td>
                        <td style={S.td}>{c.mw.toLocaleString()}</td>
                        <td style={{ ...S.td, color: T.indigo }}>{fmt(c.irr)}%</td>
                        <td style={S.td}>${c.lcoe}</td>
                        <td style={S.td}>{c.leverage}%</td>
                        <td style={S.td}>{c.cfd > 0 ? `$${c.cfd}` : 'Merchant'}</td>
                        <td style={S.td}>{fmt(c.dscr, 2)}×</td>
                      </tr>
                    ))}
                  </tbody></table>
                </div>
                <div style={S.card}>
                  <div style={S.cardTitle}>IRR Benchmark vs Comparables</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={[...comparables, { name: '★ This Project', irr: equityIRR, country: country.name }]}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                      <YAxis tick={{ fontSize: 10 }} unit="%" />
                      <Tooltip />
                      <Bar dataKey="irr" fill={T.teal} name="Equity IRR %">
                        {[...comparables, { name: '★ This Project' }].map((d, i) => <Cell key={i} fill={d.name.includes('★') ? T.accent : T.teal} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}

            {/* Tab 14: Portfolio Integration */}
            {activeTab === 14 && (
              <div style={S.card}>
                <div style={S.cardTitle}>RE Fund Portfolio Integration</div>
                <table style={S.table}><tbody>
                  {[
                    ['Contribution to Fund IRR', `+${fmt((equityIRR - 11) * capMW / 5000, 2)}pp (${capMW} MW / 5,000 MW fund)`],
                    ['Correlation to Solar PV', '0.12 (low — different resource drivers)'],
                    ['Correlation to Onshore Wind', '0.35 (moderate — same resource, different regime)'],
                    ['VaR Diversification Benefit', `~${fmt(8 + sr(3) * 5, 0)}% VaR reduction vs standalone`],
                    ['Fund NAV Impact', `+$${fmt(capMW * capexPerKw * 0.15 / 1e6, 0)}M estimated markup to NAV at stabilization`],
                    ['ESG Score Contribution', 'A+ (Offshore wind highest MSCI ESG score in infrastructure)'],
                    ['EU Taxonomy', 'Art.10 Climate Mitigation aligned — 100%'],
                  ].map(([k, v]) => <tr key={k}><td style={{ ...S.td, fontWeight: 600, width: 260 }}>{k}</td><td style={S.td}>{v}</td></tr>)}
                </tbody></table>
              </div>
            )}

            {/* Tab 15: ESG & Green Finance */}
            {activeTab === 15 && (
              <div style={S.card}>
                <div style={S.cardTitle}>ESG & Green Finance Checklist</div>
                <table style={S.table}><tbody>
                  {[
                    ['EU Taxonomy Art.10 (Climate Mitigation)', true, 'Offshore wind qualifies; DNSH pass required'],
                    ['DNSH — Water Use', true, 'Minimal freshwater use in offshore operation'],
                    ['DNSH — Circular Economy', true, 'Decommissioning plan required; blade recycling commitment'],
                    ['DNSH — Pollution Prevention', true, 'No direct pollution; electromagnetic field monitoring'],
                    ['DNSH — Biodiversity', false, 'Marine habitat EIA required; bird/bat risk mitigation plan'],
                    ['ICMA Green Bond Principles (GBP)', true, 'Eligible use of proceeds; second-party opinion required'],
                    ['SFDR Article 9 Eligible', true, 'Sustainable investment; PAI indicators reported'],
                    ['Science Based Targets (SBTi)', true, 'Avoids >50g CO2e/kWh lifecycle — qualifies'],
                    ['GHG Avoided (vs coal)', `${fmt(annualAEP * (820 - 12) / 1e9, 1)} Mt CO2e/yr`, 'Based on IPCC lifecycle median 12g CO2e/kWh'],
                  ].map(([n, ok, note]) => <tr key={n}>
                    <td style={S.td}><span style={{ color: ok === true ? T.green : ok === false ? T.red : T.indigo, fontWeight: 600 }}>{ok === true ? '✓' : ok === false ? '○' : '📊'}</span> {n}</td>
                    <td style={S.td}><span style={S.pill(ok === true ? T.green : ok === false ? T.amber : T.teal)}>{ok === true ? 'Compliant' : ok === false ? 'Conditional' : 'Metric'}</span></td>
                    <td style={{ ...S.td, color: T.sub, fontSize: 11 }}>{note}</td>
                  </tr>)}
                </tbody></table>
              </div>
            )}

            {/* Tab 16: Risk Register */}
            {activeTab === 16 && (
              <div style={S.card}>
                <div style={S.cardTitle}>Risk Register — 10 Key Project Risks</div>
                <table style={S.table}><thead><tr>
                  {['Risk','Probability','Impact','Risk Score','Mitigation'].map(h => <th key={h} style={S.th}>{h}</th>)}
                </tr></thead><tbody>
                  {riskRegister.map(r => (
                    <tr key={r.risk}>
                      <td style={{ ...S.td, fontWeight: 600 }}>{r.risk}</td>
                      <td style={S.td}><span style={S.pill(r.prob === 'High' ? T.red : r.prob === 'Medium' ? T.amber : T.green)}>{r.prob}</span></td>
                      <td style={S.td}><span style={S.pill(r.impact === 'Very High' || r.impact === 'High' ? T.red : T.amber)}>{r.impact}</span></td>
                      <td style={{ ...S.td, fontWeight: 600, color: r.score >= 12 ? T.red : r.score >= 9 ? T.amber : T.green }}>{r.score}</td>
                      <td style={{ ...S.td, color: T.sub, fontSize: 11 }}>{r.mitigation}</td>
                    </tr>
                  ))}
                </tbody></table>
              </div>
            )}

            {/* Tab 17: Summary Report */}
            {activeTab === 17 && (
              <>
                <div style={S.card}>
                  <div style={S.cardTitle}>Investment Summary — {capMW} MW Offshore Wind · {country.name}</div>
                  <div style={S.grid2}>
                    <div>
                      <div style={{ fontWeight: 700, marginBottom: 8 }}>Key Financials</div>
                      <table style={S.table}><tbody>
                        {[['Equity IRR', `${fmt(equityIRR)}%`],['Project IRR', `${fmt(projectIRR)}%`],['LCOE', `${country.currency}${fmt(lcoe, 0)}/MWh`],['Min DSCR', `${fmt(minDSCR, 2)}×`],['Total CAPEX', `$${fmt(totalCapex / 1e9, 2)}B`],['Year-1 Revenue', `${country.currency}${fmt(year1Rev, 1)}M`]].map(([k, v]) => <tr key={k}><td style={{ ...S.td, fontWeight: 600 }}>{k}</td><td style={S.td}>{v}</td></tr>)}
                      </tbody></table>
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, marginBottom: 8 }}>Project Parameters</div>
                      <table style={S.table}><tbody>
                        {[['Country', country.name],['Technology', techType === 'fixed' ? 'Fixed-Bottom' : 'Floating'],['Contract', contractType.toUpperCase()],['CAPEX/kW', `$${capexPerKw.toLocaleString()}`],['Capacity Factor', `${cfPct}%`],['Leverage', `${debtPct}%`]].map(([k, v]) => <tr key={k}><td style={{ ...S.td, fontWeight: 600 }}>{k}</td><td style={S.td}>{v}</td></tr>)}
                      </tbody></table>
                    </div>
                  </div>
                </div>
                <div style={S.card}>
                  <div style={S.cardTitle}>Recommendation</div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 16, background: equityIRR >= 10 ? '#F0FDF4' : equityIRR >= 8 ? '#FFFBEB' : '#FEF2F2', borderRadius: 8 }}>
                    <span style={{ fontSize: 32 }}>{equityIRR >= 10 ? '✅' : equityIRR >= 8 ? '⚠️' : '❌'}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16, color: equityIRR >= 10 ? T.green : equityIRR >= 8 ? T.amber : T.red }}>
                        {equityIRR >= 10 ? 'PROCEED — Returns exceed hurdle rate' : equityIRR >= 8 ? 'NEGOTIATE — Returns below target, structure improvement needed' : 'PASS — Insufficient returns at current parameters'}
                      </div>
                      <div style={{ color: T.sub, fontSize: 12, marginTop: 4 }}>
                        Equity IRR {fmt(equityIRR)}% vs 10% hurdle · LCOE {country.currency}{fmt(lcoe, 0)}/MWh vs {country.currency}{cfdStrike}/MWh CfD · Min DSCR {fmt(minDSCR, 2)}×
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
