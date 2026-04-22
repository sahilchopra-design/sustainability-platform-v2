import React, { useState, useMemo } from 'react';
import EnergyAdvancedAnalytics from '../../_shared/EnergyAdvancedAnalytics';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, ComposedChart,
  Cell, ScatterChart, Scatter, RadarChart, PolarGrid,
  PolarAngleAxis, Radar
} from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const T = {
  bg: '#FAFAF7', card: '#FFFFFF', border: '#E5E2D9',
  text: '#1A1A2E', sub: '#6B7280', accent: '#B8860B',
  green: '#065F46', red: '#991B1B', blue: '#1E40AF',
  teal: '#0F766E', amber: '#92400E', navy: '#0F172A',
  indigo: '#4F46E5', purple: '#7C3AED', sage: '#4A7C59'
};

// ── Physics & cost helpers ────────────────────────────────────────────────────
const HHV_H2 = 39.4;  // kWh/kg (higher heating value)
const LHV_H2 = 33.3;  // kWh/kg (lower heating value)

function calcLcoh({ elecCost, capex, opex, efficiency, capacityFactor, lifetime, stackReplace, wacc }) {
  const annualKgPerMW = (capacityFactor / 100) * 8760 * 1000 / (efficiency / 100 * HHV_H2);
  const capexAnnual = capex * 1000 * (wacc / 100) / (1 - Math.pow(1 + wacc / 100, -lifetime));
  const electricityCost = elecCost * (efficiency / 100 * HHV_H2);
  const stackCostAnnual = (capex * 1000 * stackReplace / 100) / (lifetime / 2);
  const totalAnnualPerKg = (capexAnnual + opex * capex * 1000 / 100 + stackCostAnnual) / Math.max(1, annualKgPerMW) + electricityCost;
  return totalAnnualPerKg;
}

function learningCurve(cost0, cumGW0, cumGW, b) {
  return cost0 * Math.pow(cumGW / Math.max(0.1, cumGW0), -b);
}

function ernstingCurve(T_in, P_out, iType) {
  const base = iType === 'PEM' ? 1.8 : iType === 'AEL' ? 1.6 : 1.4;
  return base + 0.003 * (T_in - 80) - 0.0001 * (P_out - 30);
}

// ── Reference datasets ────────────────────────────────────────────────────────
const ELECTROLYZER_TYPES = [
  {
    id: 'PEM', label: 'PEM (Proton Exchange Membrane)',
    efficiency: 65, capex: 900, opexPct: 3, stackLife: 80000,
    rampRate: 100, pressureBar: 30, tempC: 80, trl: 9,
    color: T.blue, strengths: ['Fast ramp', 'High purity', 'Compact'], weaknesses: ['Pt catalyst cost', 'Membrane replacement']
  },
  {
    id: 'AEL', label: 'AEL (Alkaline Electrolysis)',
    efficiency: 70, capex: 700, opexPct: 2.5, stackLife: 100000,
    rampRate: 20, pressureBar: 10, tempC: 70, trl: 9,
    color: T.green, strengths: ['Mature tech', 'Low cost', 'Long life'], weaknesses: ['Slow ramp', 'Liquid KOH']
  },
  {
    id: 'SOEC', label: 'SOEC (Solid Oxide Electrolysis)',
    efficiency: 82, capex: 1400, opexPct: 4, stackLife: 50000,
    rampRate: 5, pressureBar: 1, tempC: 800, trl: 6,
    color: T.amber, strengths: ['Highest efficiency', 'Steam input', 'Co-electrolysis'], weaknesses: ['High temp', 'Thermal cycling']
  },
  {
    id: 'AEM', label: 'AEM (Anion Exchange Membrane)',
    efficiency: 63, capex: 750, opexPct: 3.5, stackLife: 60000,
    rampRate: 80, pressureBar: 20, tempC: 60, trl: 6,
    color: T.indigo, strengths: ['No Pt needed', 'Compact', 'Low cost potential'], weaknesses: ['Early stage', 'Membrane durability']
  },
];

const RENEWABLE_SOURCES = [
  { label: 'Onshore Wind — EU',    lcoe: 42, cf: 35, variability: 'High' },
  { label: 'Onshore Wind — LatAm', lcoe: 28, cf: 48, variability: 'Medium' },
  { label: 'Solar PV — MENA',      lcoe: 18, cf: 28, variability: 'High' },
  { label: 'Solar PV — Chile',     lcoe: 22, cf: 32, variability: 'High' },
  { label: 'Offshore Wind — North Sea', lcoe: 65, cf: 45, variability: 'Medium' },
  { label: 'Hydro — Norway',       lcoe: 30, cf: 55, variability: 'Low' },
  { label: 'Grid Mix — Germany',   lcoe: 80, cf: 90, variability: 'Low' },
  { label: 'Dedicated + Storage',  lcoe: 55, cf: 65, variability: 'Low' },
];

const REGIONS = [
  { country: 'Germany',    elec: 80,  policyScore: 8, infraScore: 7, target2030: 10,   color: T.blue   },
  { country: 'Australia',  elec: 30,  policyScore: 7, infraScore: 5, target2030: 1.5,  color: T.green  },
  { country: 'Chile',      elec: 25,  policyScore: 7, infraScore: 4, target2030: 0.5,  color: T.teal   },
  { country: 'Morocco',    elec: 22,  policyScore: 8, infraScore: 5, target2030: 1.0,  color: T.amber  },
  { country: 'Saudi Arabia', elec: 18, policyScore: 6, infraScore: 6, target2030: 4.0, color: T.indigo },
  { country: 'USA (IRA)',  elec: 55,  policyScore: 9, infraScore: 8, target2030: 10,   color: T.red    },
  { country: 'Japan',      elec: 90,  policyScore: 8, infraScore: 8, target2030: 3.0,  color: T.purple },
  { country: 'Netherlands', elec: 75, policyScore: 9, infraScore: 8, target2030: 4.0,  color: T.sage   },
];

const YEARS = Array.from({ length: 16 }, (_, i) => 2025 + i);

function Slider({ label, value, min, max, step = 1, onChange, unit = '' }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.sub, marginBottom: 3 }}>
        <span>{label}</span>
        <span style={{ color: T.accent, fontFamily: 'monospace' }}>{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: T.accent }} />
    </div>
  );
}

function KpiCard({ label, value, unit, sub, color }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '12px 16px', flex: 1, minWidth: 130 }}>
      <div style={{ fontSize: 11, color: T.sub, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: color || T.navy, fontFamily: 'monospace' }}>{value}</div>
      {unit && <div style={{ fontSize: 10, color: T.sub }}>{unit}</div>}
      {sub && <div style={{ fontSize: 10, color: T.sub, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

const TABS = [
  'LCOH Engine', 'Electrolyzer Compare', 'Learning Curves', 'Capacity Factor',
  'Sensitivity Matrix', 'Renewables Mix', 'Regional Analysis', 'EU Taxonomy',
  'Technology Radar', 'Levelized Breakdown'
];

export default function GreenHydrogenLcohPage() {
  const [tab, setTab] = useState(0);
  const [eType, setEType] = useState('PEM');
  const [elecCost, setElecCost] = useState(45);
  const [capex, setCapex] = useState(900);
  const [opexPct, setOpexPct] = useState(3);
  const [capacityFactor, setCapacityFactor] = useState(42);
  const [efficiency, setEfficiency] = useState(65);
  const [lifetime, setLifetime] = useState(25);
  const [stackReplace, setStackReplace] = useState(15);
  const [wacc, setWacc] = useState(8);
  const [scale, setScale] = useState(100);
  const [year, setYear] = useState(2025);

  const selected = ELECTROLYZER_TYPES.find(e => e.id === eType) || ELECTROLYZER_TYPES[0];

  const lcoh = useMemo(() => calcLcoh({ elecCost, capex, opexPct, efficiency, capacityFactor, lifetime, stackReplace, wacc }), [elecCost, capex, opexPct, efficiency, capacityFactor, lifetime, stackReplace, wacc]);

  const annualOutput = useMemo(() => {
    const kgPerMWh = 1000 / (efficiency / 100 * HHV_H2);
    return (capacityFactor / 100) * 8760 * scale * kgPerMWh / 1000; // tonnes/year
  }, [efficiency, capacityFactor, scale]);

  // Learning curve trajectory
  const learningData = useMemo(() => YEARS.map((y, i) => {
    const cumGWPEM  = 2 + i * 8;
    const cumGWAEL  = 8 + i * 5;
    const cumGWSOEC = 0.5 + i * 2;
    const cumGWAEM  = 0.2 + i * 3;
    return {
      year: y,
      PEM:  Math.round(learningCurve(900, 2, cumGWPEM, 0.13)),
      AEL:  Math.round(learningCurve(700, 8, cumGWAEL, 0.10)),
      SOEC: Math.round(learningCurve(1400, 0.5, cumGWSOEC, 0.15)),
      AEM:  Math.round(learningCurve(750, 0.2, cumGWAEM, 0.18)),
    };
  }), []);

  // LCOH vs electricity cost
  const lcohElecData = useMemo(() => Array.from({ length: 11 }, (_, i) => {
    const ec = 20 + i * 10;
    return {
      elec: ec,
      PEM:  +calcLcoh({ elecCost: ec, capex: 900, opexPct: 3, efficiency: 65, capacityFactor, lifetime, stackReplace, wacc }).toFixed(2),
      AEL:  +calcLcoh({ elecCost: ec, capex: 700, opexPct: 2.5, efficiency: 70, capacityFactor, lifetime, stackReplace, wacc }).toFixed(2),
      SOEC: +calcLcoh({ elecCost: ec, capex: 1400, opexPct: 4, efficiency: 82, capacityFactor, lifetime, stackReplace, wacc }).toFixed(2),
    };
  }), [capacityFactor, lifetime, stackReplace, wacc]);

  // Capacity factor sensitivity
  const cfData = useMemo(() => Array.from({ length: 9 }, (_, i) => {
    const cf = 20 + i * 10;
    return {
      cf,
      PEM:  +calcLcoh({ elecCost, capex: 900, opexPct: 3, efficiency: 65, capacityFactor: cf, lifetime, stackReplace, wacc }).toFixed(2),
      AEL:  +calcLcoh({ elecCost, capex: 700, opexPct: 2.5, efficiency: 70, capacityFactor: cf, lifetime, stackReplace, wacc }).toFixed(2),
    };
  }), [elecCost, lifetime, stackReplace, wacc]);

  // Cost waterfall
  const waterfallData = useMemo(() => {
    const kgPerMWh = 1000 / (efficiency / 100 * HHV_H2);
    const annualKg = (capacityFactor / 100) * 8760 * 1000 * kgPerMWh;
    const capexAnn = capex * 1000 * (wacc / 100) / (1 - Math.pow(1 + wacc / 100, -lifetime));
    const opexAnn  = capex * 1000 * opexPct / 100;
    const stackAnn = capex * 1000 * stackReplace / 100 / (lifetime / 2);
    const elecAnn  = elecCost * (efficiency / 100 * HHV_H2);
    return [
      { name: 'Electricity', value: +elecAnn.toFixed(2), fill: T.blue },
      { name: 'Capex (annualised)', value: +(capexAnn / Math.max(1, annualKg)).toFixed(2), fill: T.amber },
      { name: 'O&M', value: +(opexAnn / Math.max(1, annualKg)).toFixed(2), fill: T.green },
      { name: 'Stack replacement', value: +(stackAnn / Math.max(1, annualKg)).toFixed(2), fill: T.red },
    ];
  }, [capex, opexPct, efficiency, capacityFactor, lifetime, stackReplace, wacc, elecCost]);

  // Sensitivity table
  const sensMatrix = useMemo(() => {
    const base = lcoh;
    return [
      { param: 'Electricity (±20 €/MWh)', low: +calcLcoh({ elecCost: elecCost - 20, capex, opexPct, efficiency, capacityFactor, lifetime, stackReplace, wacc }).toFixed(2), high: +calcLcoh({ elecCost: elecCost + 20, capex, opexPct, efficiency, capacityFactor, lifetime, stackReplace, wacc }).toFixed(2) },
      { param: 'Capex (±30%)', low: +calcLcoh({ elecCost, capex: capex * 0.7, opexPct, efficiency, capacityFactor, lifetime, stackReplace, wacc }).toFixed(2), high: +calcLcoh({ elecCost, capex: capex * 1.3, opexPct, efficiency, capacityFactor, lifetime, stackReplace, wacc }).toFixed(2) },
      { param: 'Efficiency (±5pp)', low: +calcLcoh({ elecCost, capex, opexPct, efficiency: efficiency - 5, capacityFactor, lifetime, stackReplace, wacc }).toFixed(2), high: +calcLcoh({ elecCost, capex, opexPct, efficiency: efficiency + 5, capacityFactor, lifetime, stackReplace, wacc }).toFixed(2) },
      { param: 'Capacity Factor (±10pp)', low: +calcLcoh({ elecCost, capex, opexPct, efficiency, capacityFactor: capacityFactor - 10, lifetime, stackReplace, wacc }).toFixed(2), high: +calcLcoh({ elecCost, capex, opexPct, efficiency, capacityFactor: capacityFactor + 10, lifetime, stackReplace, wacc }).toFixed(2) },
      { param: 'WACC (±3pp)', low: +calcLcoh({ elecCost, capex, opexPct, efficiency, capacityFactor, lifetime, stackReplace, wacc: wacc - 3 }).toFixed(2), high: +calcLcoh({ elecCost, capex, opexPct, efficiency, capacityFactor, lifetime, stackReplace, wacc: wacc + 3 }).toFixed(2) },
      { param: 'Lifetime (±5 yrs)', low: +calcLcoh({ elecCost, capex, opexPct, efficiency, capacityFactor, lifetime: lifetime - 5, stackReplace, wacc }).toFixed(2), high: +calcLcoh({ elecCost, capex, opexPct, efficiency, capacityFactor, lifetime: lifetime + 5, stackReplace, wacc }).toFixed(2) },
    ].map(r => ({ ...r, delta: +(r.high - r.low).toFixed(2), base: +base.toFixed(2) }));
  }, [lcoh, elecCost, capex, opexPct, efficiency, capacityFactor, lifetime, stackReplace, wacc]);

  // Regional LCOH estimates
  const regionalData = useMemo(() => REGIONS.map((r, i) => ({
    ...r,
    lcoh: +calcLcoh({ elecCost: r.elec, capex: 700 + sr(i * 13) * 400, opexPct: 2.5 + sr(i * 7) * 1.5, efficiency: 67 + sr(i * 11) * 5, capacityFactor: 30 + sr(i * 19) * 30, lifetime: 25, stackReplace: 15, wacc: 6 + sr(i * 5) * 4 }).toFixed(2),
  })), []);

  // EU taxonomy compliance checks
  const euChecks = [
    { criterion: 'GHG lifecycle ≤ 3 tCO2/tH2', value: 1.2, threshold: 3, pass: true },
    { criterion: 'Additionality — new RE capacity', value: 'Compliant', threshold: 'Required', pass: true },
    { criterion: 'Temporal correlation (hourly)', value: 'Hourly matched', threshold: 'Hourly (from 2030)', pass: true },
    { criterion: 'Geographic correlation', value: 'Same bidding zone', threshold: 'Bidding zone', pass: true },
    { criterion: 'Electrolyzer certification', value: 'TÜV SÜD', threshold: 'Certified', pass: true },
    { criterion: 'Water stress area', value: 'Score 2.1', threshold: '< 3 (medium)', pass: true },
    { criterion: 'DNSH — air pollution', value: '0.003 tNOx/tH2', threshold: 'Minimised', pass: true },
    { criterion: 'Minimum social safeguards', value: 'OECD Guidelines', threshold: 'Required', pass: true },
  ];

  // Radar data
  const radarData = ELECTROLYZER_TYPES.map(e => ({
    name: e.id,
    Efficiency: e.efficiency,
    Maturity: e.trl * 10,
    CostScore: Math.round(100 - e.capex / 20),
    RampRate: e.rampRate,
    StackLife: Math.round(e.stackLife / 1200),
    Pressure: Math.round(e.pressureBar / 0.35),
  }));

  const panelStyle = { background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: T.text };
  const headerStyle = { background: T.navy, color: '#fff', padding: '20px 28px', borderBottom: `3px solid ${T.accent}` };
  const tabBarStyle = { display: 'flex', overflowX: 'auto', borderBottom: `1px solid ${T.border}`, background: T.card, padding: '0 16px' };
  const tabStyle = active => ({ padding: '10px 16px', fontSize: 12, fontWeight: active ? 700 : 400, color: active ? T.accent : T.sub, borderBottom: active ? `2px solid ${T.accent}` : '2px solid transparent', cursor: 'pointer', whiteSpace: 'nowrap' });
  const sectionStyle = { padding: '20px 24px' };
  const cardStyle = { background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginBottom: 16 };
  const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 };

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <div style={{ fontSize: 11, color: T.accent, fontFamily: 'monospace', marginBottom: 4 }}>EP-DS1 · GREEN HYDROGEN FINANCE</div>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Green Hydrogen LCOH & Electrolyzer Economics Engine</h1>
        <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>PEM · AEL · SOEC · AEM · Learning Curves · Sensitivity · EU Taxonomy · 10 Tabs</div>
      </div>
      <div style={tabBarStyle}>
        {TABS.map((t, i) => <div key={i} style={tabStyle(tab === i)} onClick={() => setTab(i)}>{t}</div>)}
      </div>

      {/* TAB 0 — LCOH ENGINE */}
      {tab === 0 && (
        <div style={sectionStyle}>
          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20 }}>
            <div style={cardStyle}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 14 }}>LCOH Calculator</div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: T.sub, marginBottom: 6 }}>Electrolyzer Type</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {ELECTROLYZER_TYPES.map(e => (
                    <button key={e.id} onClick={() => { setEType(e.id); setEfficiency(e.efficiency); setCapex(e.capex); setOpexPct(e.opexPct); }}
                      style={{ padding: '4px 10px', fontSize: 11, borderRadius: 5, border: `1px solid ${eType === e.id ? e.color : T.border}`, background: eType === e.id ? e.color : 'transparent', color: eType === e.id ? '#fff' : T.sub, cursor: 'pointer' }}>
                      {e.id}
                    </button>
                  ))}
                </div>
              </div>
              <Slider label="Electricity cost" value={elecCost} min={10} max={150} step={5} onChange={setElecCost} unit=" €/MWh" />
              <Slider label="Electrolyzer capex" value={capex} min={300} max={2000} step={50} onChange={setCapex} unit=" €/kW" />
              <Slider label="O&M (% capex/yr)" value={opexPct} min={1} max={6} step={0.5} onChange={setOpexPct} unit="%" />
              <Slider label="Efficiency (LHV)" value={efficiency} min={50} max={90} step={1} onChange={setEfficiency} unit="%" />
              <Slider label="Capacity factor" value={capacityFactor} min={10} max={90} step={5} onChange={setCapacityFactor} unit="%" />
              <Slider label="Plant lifetime" value={lifetime} min={15} max={35} step={1} onChange={setLifetime} unit=" yrs" />
              <Slider label="Stack replacement cost" value={stackReplace} min={5} max={40} step={5} onChange={setStackReplace} unit="% capex" />
              <Slider label="WACC" value={wacc} min={3} max={15} step={0.5} onChange={setWacc} unit="%" />
              <Slider label="Plant scale" value={scale} min={10} max={500} step={10} onChange={setScale} unit=" MW" />
            </div>
            <div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                <KpiCard label="LCOH (LHV)" value={lcoh.toFixed(2)} unit="€/kg H₂" color={lcoh < 3 ? T.green : lcoh < 5 ? T.amber : T.red} />
                <KpiCard label="Annual Output" value={(annualOutput / 1000).toFixed(1)} unit="kt H₂/yr" sub={`${scale} MW plant`} />
                <KpiCard label="Electricity Share" value={((waterfallData[0]?.value / lcoh) * 100).toFixed(0)} unit="% of LCOH" color={T.blue} />
                <KpiCard label="Capex Share" value={((waterfallData[1]?.value / lcoh) * 100).toFixed(0)} unit="% of LCOH" color={T.amber} />
              </div>
              <div style={cardStyle}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>LCOH vs Electricity Cost — All Technologies</div>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={lcohElecData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="elec" label={{ value: '€/MWh', position: 'insideBottom', offset: -3, fontSize: 10 }} tick={{ fontSize: 10 }} />
                    <YAxis label={{ value: '€/kg H₂', angle: -90, position: 'insideLeft', fontSize: 10 }} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v, n) => [`${v} €/kg`, n]} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <ReferenceLine y={elecCost * 0.065} stroke={T.accent} strokeDasharray="4 4" label={{ value: 'Current', fontSize: 9, fill: T.accent }} />
                    <Line type="monotone" dataKey="PEM" stroke={T.blue} strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="AEL" stroke={T.green} strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="SOEC" stroke={T.amber} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div style={cardStyle}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 4 }}>Target price benchmarks</div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  {[{ label: 'EU 2030 target', value: '2.00 €/kg', color: T.green }, { label: 'US §45V tier 4', value: '< $1/kg', color: T.blue }, { label: 'Current grey H₂', value: '~1.50 €/kg', color: T.red }, { label: 'IEA green parity 2030', value: '2.50 €/kg', color: T.teal }].map((b, i) => (
                    <div key={i} style={{ padding: '8px 14px', background: T.bg, borderRadius: 6, border: `1px solid ${b.color}`, fontSize: 11 }}>
                      <span style={{ color: T.sub }}>{b.label}: </span><span style={{ color: b.color, fontWeight: 700 }}>{b.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1 — ELECTROLYZER COMPARE */}
      {tab === 1 && (
        <div style={sectionStyle}>
          <div style={gridStyle}>
            {ELECTROLYZER_TYPES.map((e, i) => (
              <div key={e.id} style={{ ...cardStyle, borderTop: `3px solid ${e.color}` }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: e.color, marginBottom: 8 }}>{e.label}</div>
                <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
                  <tbody>
                    {[
                      ['Efficiency (LHV)', `${e.efficiency}%`],
                      ['CAPEX', `${e.capex} €/kW`],
                      ['OPEX', `${e.opexPct}% capex/yr`],
                      ['Stack lifetime', `${(e.stackLife / 1000).toFixed(0)}k hrs`],
                      ['Ramp rate', `${e.rampRate}%/min`],
                      ['Operating pressure', `${e.pressureBar} bar`],
                      ['Operating temp', `${e.tempC}°C`],
                      ['TRL', `${e.trl}/9`],
                    ].map(([k, v]) => (
                      <tr key={k} style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '5px 0', color: T.sub }}>{k}</td>
                        <td style={{ padding: '5px 0', fontWeight: 600, color: T.navy, textAlign: 'right' }}>{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 10, color: T.green, marginBottom: 3 }}>✓ {e.strengths.join(' · ')}</div>
                  <div style={{ fontSize: 10, color: T.red }}>✗ {e.weaknesses.join(' · ')}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>LCOH Comparison at Current Inputs</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ELECTROLYZER_TYPES.map(e => ({ name: e.id, LCOH: +calcLcoh({ elecCost, capex: e.capex, opexPct: e.opexPct, efficiency: e.efficiency, capacityFactor, lifetime, stackReplace, wacc }).toFixed(2) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis label={{ value: '€/kg H₂', angle: -90, position: 'insideLeft', fontSize: 10 }} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => [`${v} €/kg`, 'LCOH']} />
                <Bar dataKey="LCOH" radius={[4, 4, 0, 0]}>
                  {ELECTROLYZER_TYPES.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TAB 2 — LEARNING CURVES */}
      {tab === 2 && (
        <div style={sectionStyle}>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 4 }}>Electrolyzer CAPEX Learning Curves (2025–2040)</div>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 14 }}>Wright's Law: Cost = Cost₀ × (CumGW/CumGW₀)^(−b) · Learning rates: PEM 13%, AEL 10%, SOEC 15%, AEM 18%</div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={learningData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                <YAxis label={{ value: '€/kW', angle: -90, position: 'insideLeft', fontSize: 10 }} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Line type="monotone" dataKey="PEM" stroke={T.blue} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="AEL" stroke={T.green} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="SOEC" stroke={T.amber} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="AEM" stroke={T.indigo} strokeWidth={2} dot={false} />
                <ReferenceLine y={200} stroke={T.teal} strokeDasharray="4 4" label={{ value: 'Target 2030', fontSize: 9, fill: T.teal }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={gridStyle}>
            {ELECTROLYZER_TYPES.map((e, i) => {
              const costNow = e.capex;
              const cost2030 = learningData[5]?.[e.id];
              const reduction = cost2030 ? (((costNow - cost2030) / costNow) * 100).toFixed(0) : 'N/A';
              return (
                <div key={e.id} style={{ ...cardStyle, borderLeft: `3px solid ${e.color}` }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: e.color }}>{e.id} Learning Trajectory</div>
                  <div style={{ marginTop: 8, fontSize: 11, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: T.sub }}>2025 CAPEX</span><span style={{ fontWeight: 700 }}>{costNow} €/kW</span>
                  </div>
                  <div style={{ fontSize: 11, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: T.sub }}>2030 CAPEX</span><span style={{ fontWeight: 700, color: T.green }}>{cost2030} €/kW</span>
                  </div>
                  <div style={{ fontSize: 11, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: T.sub }}>Reduction</span><span style={{ fontWeight: 700, color: T.teal }}>{reduction}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3 — CAPACITY FACTOR */}
      {tab === 3 && (
        <div style={sectionStyle}>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 4 }}>LCOH vs Capacity Factor — PEM & AEL</div>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 14 }}>Higher capacity factor = lower LCOH (fixed capex spread over more production). Renewable CF directly drives H₂ competitiveness.</div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={cfData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="cf" label={{ value: 'Capacity Factor (%)', position: 'insideBottom', offset: -3, fontSize: 10 }} tick={{ fontSize: 10 }} />
                <YAxis label={{ value: '€/kg H₂', angle: -90, position: 'insideLeft', fontSize: 10 }} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v, n) => [`${v} €/kg`, n]} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <ReferenceLine y={2} stroke={T.green} strokeDasharray="4 4" label={{ value: 'EU 2030', fontSize: 9, fill: T.green }} />
                <Line type="monotone" dataKey="PEM" stroke={T.blue} strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="AEL" stroke={T.green} strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Renewable Source Capacity Factors & LCOE</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: T.bg }}>
                    {['Source', 'LCOE (€/MWh)', 'Typical CF (%)', 'Variability', 'Implied LCOH (PEM, est.)'].map(h => (
                      <th key={h} style={{ padding: '6px 10px', textAlign: 'left', color: T.sub, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {RENEWABLE_SOURCES.map((r, i) => {
                    const impliedLcoh = calcLcoh({ elecCost: r.lcoe, capex: 900, opexPct: 3, efficiency: 65, capacityFactor: r.cf, lifetime: 25, stackReplace: 15, wacc: 8 });
                    return (
                      <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 ? T.bg : T.card }}>
                        <td style={{ padding: '6px 10px', fontWeight: 500 }}>{r.label}</td>
                        <td style={{ padding: '6px 10px', fontFamily: 'monospace' }}>{r.lcoe}</td>
                        <td style={{ padding: '6px 10px', fontFamily: 'monospace' }}>{r.cf}</td>
                        <td style={{ padding: '6px 10px', color: r.variability === 'High' ? T.red : r.variability === 'Low' ? T.green : T.amber }}>{r.variability}</td>
                        <td style={{ padding: '6px 10px', fontFamily: 'monospace', fontWeight: 700, color: impliedLcoh < 3 ? T.green : impliedLcoh < 5 ? T.amber : T.red }}>{impliedLcoh.toFixed(2)} €/kg</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4 — SENSITIVITY MATRIX */}
      {tab === 4 && (
        <div style={sectionStyle}>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 4 }}>Sensitivity Analysis — LCOH Tornado Chart</div>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 14 }}>Base case LCOH: <strong>{lcoh.toFixed(2)} €/kg</strong>. Parameters ranked by impact.</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={[...sensMatrix].sort((a, b) => b.delta - a.delta)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize: 10 }} label={{ value: '€/kg H₂', position: 'insideBottom', offset: -3, fontSize: 10 }} />
                <YAxis type="category" dataKey="param" width={180} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => [`${v} €/kg`]} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="low" name="Low case" fill={T.teal} radius={[0, 4, 4, 0]} />
                <Bar dataKey="high" name="High case" fill={T.red} radius={[0, 4, 4, 0]} />
                <ReferenceLine x={lcoh} stroke={T.accent} strokeDasharray="4 4" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Sensitivity Table</div>
            <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.bg }}>
                  {['Parameter', 'Low Case', 'Base', 'High Case', 'Range (€/kg)', '% Impact'].map(h => (
                    <th key={h} style={{ padding: '6px 10px', textAlign: 'left', color: T.sub, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...sensMatrix].sort((a, b) => b.delta - a.delta).map((r, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 ? T.bg : T.card }}>
                    <td style={{ padding: '6px 10px', fontWeight: 500 }}>{r.param}</td>
                    <td style={{ padding: '6px 10px', fontFamily: 'monospace', color: T.green }}>{r.low}</td>
                    <td style={{ padding: '6px 10px', fontFamily: 'monospace', fontWeight: 700 }}>{r.base}</td>
                    <td style={{ padding: '6px 10px', fontFamily: 'monospace', color: T.red }}>{r.high}</td>
                    <td style={{ padding: '6px 10px', fontFamily: 'monospace', color: T.amber, fontWeight: 600 }}>{r.delta}</td>
                    <td style={{ padding: '6px 10px', fontFamily: 'monospace' }}>{((r.delta / r.base) * 100).toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5 — RENEWABLES MIX */}
      {tab === 5 && (
        <div style={sectionStyle}>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Implied LCOH by Renewable Source (PEM electrolyzer)</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={RENEWABLE_SOURCES.map(r => ({ name: r.label.split(' — ')[0], LCOH: +calcLcoh({ elecCost: r.lcoe, capex: 900, opexPct: 3, efficiency: 65, capacityFactor: r.cf, lifetime: 25, stackReplace: 15, wacc: 8 }).toFixed(2) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-15} textAnchor="end" height={50} />
                <YAxis label={{ value: '€/kg', angle: -90, position: 'insideLeft', fontSize: 10 }} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => [`${v} €/kg`, 'LCOH']} />
                <ReferenceLine y={2} stroke={T.green} strokeDasharray="4 4" label={{ value: 'EU 2030', fontSize: 9, fill: T.green }} />
                <Bar dataKey="LCOH" radius={[4, 4, 0, 0]}>
                  {RENEWABLE_SOURCES.map((r, i) => <Cell key={i} fill={`hsl(${200 + i * 22}, 60%, ${40 + i * 3}%)`} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TAB 6 — REGIONAL ANALYSIS */}
      {tab === 6 && (
        <div style={sectionStyle}>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Regional LCOH Comparison — Key Hydrogen Hubs</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={regionalData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="country" tick={{ fontSize: 10 }} />
                <YAxis label={{ value: '€/kg H₂', angle: -90, position: 'insideLeft', fontSize: 10 }} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => [`${v} €/kg`, 'Est. LCOH']} />
                <ReferenceLine y={2} stroke={T.green} strokeDasharray="4 4" label={{ value: 'EU 2030', fontSize: 9, fill: T.green }} />
                <Bar dataKey="lcoh" radius={[4, 4, 0, 0]}>
                  {regionalData.map((r, i) => <Cell key={i} fill={r.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={gridStyle}>
            {regionalData.map((r, i) => (
              <div key={i} style={{ ...cardStyle, borderLeft: `3px solid ${r.color}` }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: r.color }}>{r.country}</div>
                <div style={{ fontSize: 11, marginTop: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}><span style={{ color: T.sub }}>Grid electricity</span><span style={{ fontWeight: 600 }}>{r.elec} €/MWh</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}><span style={{ color: T.sub }}>Estimated LCOH</span><span style={{ fontWeight: 700, color: Number(r.lcoh) < 3 ? T.green : Number(r.lcoh) < 5 ? T.amber : T.red }}>{r.lcoh} €/kg</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}><span style={{ color: T.sub }}>2030 target (GW)</span><span style={{ fontWeight: 600 }}>{r.target2030} GW</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: T.sub }}>Policy score</span><span style={{ fontWeight: 600 }}>{r.policyScore}/10</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7 — EU TAXONOMY */}
      {tab === 7 && (
        <div style={sectionStyle}>
          <div style={cardStyle}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 4 }}>EU Delegated Act — Renewable Hydrogen Taxonomy Compliance</div>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 16 }}>Commission Delegated Regulation (EU) 2023/1184 · RFNBO criteria · Lifecycle GHG ≤ 3 tCO2/tH2</div>
            {euChecks.map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: `1px solid ${T.border}` }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: c.pass ? T.green : T.red, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, flexShrink: 0 }}>
                  {c.pass ? '✓' : '✗'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{c.criterion}</div>
                  <div style={{ fontSize: 10, color: T.sub, marginTop: 2 }}>Required: {c.threshold} · Actual: {c.value}</div>
                </div>
                <div style={{ fontSize: 11, padding: '3px 10px', borderRadius: 4, background: c.pass ? '#D1FAE5' : '#FEE2E2', color: c.pass ? T.green : T.red, fontWeight: 600 }}>
                  {c.pass ? 'PASS' : 'FAIL'}
                </div>
              </div>
            ))}
            <div style={{ marginTop: 16, padding: 14, background: '#ECFDF5', borderRadius: 8, border: `1px solid ${T.green}` }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.green }}>✓ Taxonomy-Aligned — All 8 criteria met</div>
              <div style={{ fontSize: 11, color: T.sub, marginTop: 4 }}>Eligible for EU H₂ Bank subsidy · RFNBO labelling · Green bond inclusion · SFDR Art.9 reporting</div>
            </div>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>IRA §45V Clean Hydrogen Credit Tiers (USA)</div>
            <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.bg }}>
                  {['Tier', 'GHG Lifecycle (kgCO2e/kgH2)', 'Credit ($/kgH2)', 'Multiplier'].map(h => (
                    <th key={h} style={{ padding: '6px 10px', textAlign: 'left', color: T.sub, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Tier 1 (max)', '< 0.45', '$3.00', '×5'],
                  ['Tier 2', '0.45 – 1.5', '$1.00', '×1.67'],
                  ['Tier 3', '1.5 – 2.5', '$0.75', '×1.25'],
                  ['Tier 4', '2.5 – 4.0', '$0.60', '×1.0'],
                ].map(([tier, ghg, credit, mult], i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 ? T.bg : T.card }}>
                    <td style={{ padding: '7px 10px', fontWeight: 600 }}>{tier}</td>
                    <td style={{ padding: '7px 10px', fontFamily: 'monospace' }}>{ghg}</td>
                    <td style={{ padding: '7px 10px', fontFamily: 'monospace', color: T.green, fontWeight: 700 }}>{credit}</td>
                    <td style={{ padding: '7px 10px' }}>{mult}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 8 — TECHNOLOGY RADAR */}
      {tab === 8 && (
        <div style={sectionStyle}>
          <div style={gridStyle}>
            <div style={cardStyle}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Multi-Dimensional Technology Comparison</div>
              <ResponsiveContainer width="100%" height={320}>
                <RadarChart data={[
                  { axis: 'Efficiency', PEM: 65, AEL: 70, SOEC: 82, AEM: 63 },
                  { axis: 'Maturity', PEM: 90, AEL: 90, SOEC: 60, AEM: 60 },
                  { axis: 'CostScore', PEM: 55, AEL: 65, SOEC: 30, AEM: 63 },
                  { axis: 'RampRate', PEM: 100, AEL: 20, SOEC: 5, AEM: 80 },
                  { axis: 'StackLife', PEM: 67, AEL: 83, SOEC: 42, AEM: 50 },
                  { axis: 'Pressure', PEM: 86, AEL: 29, SOEC: 3, AEM: 57 },
                ]}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10 }} />
                  <Radar name="PEM" dataKey="PEM" stroke={T.blue} fill={T.blue} fillOpacity={0.15} />
                  <Radar name="AEL" dataKey="AEL" stroke={T.green} fill={T.green} fillOpacity={0.15} />
                  <Radar name="SOEC" dataKey="SOEC" stroke={T.amber} fill={T.amber} fillOpacity={0.15} />
                  <Radar name="AEM" dataKey="AEM" stroke={T.indigo} fill={T.indigo} fillOpacity={0.15} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Technology Readiness & Cost Outlook</div>
              <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: T.bg }}>
                    {['Tech', 'TRL', '2025 CAPEX', '2030 Target', '2040 Vision'].map(h => (
                      <th key={h} style={{ padding: '6px 8px', color: T.sub, fontWeight: 600, textAlign: 'left', borderBottom: `1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['PEM',  9, '900 €/kW', '450 €/kW', '200 €/kW'],
                    ['AEL',  9, '700 €/kW', '400 €/kW', '180 €/kW'],
                    ['SOEC', 6, '1,400 €/kW','600 €/kW','250 €/kW'],
                    ['AEM',  6, '750 €/kW', '350 €/kW', '150 €/kW'],
                  ].map(([t, trl, now, y30, y40], i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 ? T.bg : T.card }}>
                      <td style={{ padding: '6px 8px', fontWeight: 700, color: ELECTROLYZER_TYPES[i]?.color }}>{t}</td>
                      <td style={{ padding: '6px 8px' }}>{trl}/9</td>
                      <td style={{ padding: '6px 8px', fontFamily: 'monospace' }}>{now}</td>
                      <td style={{ padding: '6px 8px', fontFamily: 'monospace', color: T.green }}>{y30}</td>
                      <td style={{ padding: '6px 8px', fontFamily: 'monospace', color: T.teal }}>{y40}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 11, color: T.sub, marginBottom: 6 }}>Stack replacement interval analysis</div>
                {ELECTROLYZER_TYPES.map((e, i) => (
                  <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: e.color }} />
                    <span style={{ fontSize: 11, flex: 1 }}>{e.id}</span>
                    <span style={{ fontSize: 11, fontFamily: 'monospace', color: T.sub }}>{(e.stackLife / 8760).toFixed(1)} yrs @ 100% CF</span>
                    <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 600 }}>{(e.stackLife / (8760 * 0.45)).toFixed(1)} yrs @ 45% CF</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 9 — LEVELIZED BREAKDOWN */}
      {tab === 9 && (
        <div style={sectionStyle}>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 4 }}>LCOH Component Waterfall — {eType} at Current Inputs</div>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 14 }}>Total LCOH: <strong style={{ color: T.accent }}>{lcoh.toFixed(2)} €/kg H₂</strong></div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={waterfallData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis label={{ value: '€/kg H₂', angle: -90, position: 'insideLeft', fontSize: 10 }} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => [`${v} €/kg`]} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {waterfallData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Cross-scenario LCOH comparison (2025 vs 2030)</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={[
                { scenario: 'Current — PEM/DE',   lcoh2025: +calcLcoh({ elecCost: 80, capex: 900, opexPct: 3, efficiency: 65, capacityFactor: 35, lifetime: 25, stackReplace: 15, wacc: 8 }).toFixed(2), lcoh2030: +calcLcoh({ elecCost: 60, capex: 450, opexPct: 2.5, efficiency: 70, capacityFactor: 40, lifetime: 25, stackReplace: 12, wacc: 7 }).toFixed(2) },
                { scenario: 'Solar — PEM/MENA',    lcoh2025: +calcLcoh({ elecCost: 20, capex: 900, opexPct: 3, efficiency: 65, capacityFactor: 28, lifetime: 25, stackReplace: 15, wacc: 9 }).toFixed(2), lcoh2030: +calcLcoh({ elecCost: 15, capex: 400, opexPct: 2.5, efficiency: 70, capacityFactor: 32, lifetime: 25, stackReplace: 12, wacc: 8 }).toFixed(2) },
                { scenario: 'Wind — AEL/Chile',    lcoh2025: +calcLcoh({ elecCost: 25, capex: 700, opexPct: 2.5, efficiency: 70, capacityFactor: 48, lifetime: 25, stackReplace: 12, wacc: 8 }).toFixed(2), lcoh2030: +calcLcoh({ elecCost: 18, capex: 350, opexPct: 2, efficiency: 72, capacityFactor: 52, lifetime: 25, stackReplace: 10, wacc: 7 }).toFixed(2) },
                { scenario: 'Offshore — PEM/NL',  lcoh2025: +calcLcoh({ elecCost: 65, capex: 900, opexPct: 3, efficiency: 65, capacityFactor: 45, lifetime: 25, stackReplace: 15, wacc: 7 }).toFixed(2), lcoh2030: +calcLcoh({ elecCost: 50, capex: 420, opexPct: 2.5, efficiency: 70, capacityFactor: 50, lifetime: 25, stackReplace: 12, wacc: 6 }).toFixed(2) },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="scenario" tick={{ fontSize: 9 }} angle={-10} textAnchor="end" height={50} />
                <YAxis label={{ value: '€/kg', angle: -90, position: 'insideLeft', fontSize: 10 }} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v, n) => [`${v} €/kg`, n]} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <ReferenceLine y={2} stroke={T.green} strokeDasharray="4 4" label={{ value: 'EU target', fontSize: 9, fill: T.green }} />
                <Bar dataKey="lcoh2025" name="2025" fill={T.blue} radius={[4, 4, 0, 0]} />
                <Bar dataKey="lcoh2030" name="2030" fill={T.teal} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      <EnergyAdvancedAnalytics T={T} moduleCode="EP-DS1" title="Green H2 LCOH — MC, Stack Tornado & NGFS Hydrogen Price Scenarios"
        mcModel={{ title: 'MC LCOH ($/kg H2)', unit: '/kg', fmt: (n) => `$${n.toFixed(2)}`,
        vars: { capex: { min: 550, mode: 900, max: 1500 }, elec: { min: 22, mode: 45, max: 85 }, cf: { min: 0.35, mode: 0.55, max: 0.80 }, eff: { min: 48, mode: 55, max: 65 } },
        compute: (v) => { const kwhPerKg = 50 / (v.eff / 55); const elecCost = (v.elec / 1000) * kwhPerKg; const annuity = v.capex * 0.085 / (v.cf * 8760) * kwhPerKg; return elecCost + annuity + 0.3; } }}
      tornadoModel={{ title: 'Tornado — LCOH Drivers', unit: '/kg', fmt: (n) => `$${n.toFixed(2)}`,
        inputs: { capex: 900, elec: 45, cf: 0.55, eff: 55 },
        compute: (v) => { const kwhPerKg = 50 / (v.eff / 55); const elecCost = (v.elec / 1000) * kwhPerKg; const annuity = v.capex * 0.085 / (v.cf * 8760) * kwhPerKg; return elecCost + annuity + 0.3; } }}
      scenarioImpact={(p) => Math.max(1.5, 4.0 - 0.01 * Math.max(0, p - 30))} scenarioFmt={(v) => `$${v.toFixed(2)}/kg`}
      scenarioTitle="Carbon Price × NGFS Pathway — Required H2 offtake price ($/kg)"
      peers={{ cols: [{ k: 'tech', label: 'Electrolyzer' }, { k: 'capex', label: 'Capex ($/kW)', fmt: (v) => `$${v}` }, { k: 'eff', label: 'Eff (%LHV)', fmt: (v) => `${v}%` }, { k: 'life', label: 'Stack life (h)', fmt: (v) => `${(v/1000).toFixed(0)}k` }, { k: 'tier', label: 'IRA §45V' }],
        rows: [{ tech: 'Alkaline (AEL)', capex: 750, eff: 66, life: 90000, tier: 'T3-T4' }, { tech: 'PEM', capex: 1100, eff: 60, life: 80000, tier: 'T3-T4' }, { tech: 'SOEC', capex: 2200, eff: 78, life: 40000, tier: 'T4' }, { tech: 'AEM', capex: 900, eff: 63, life: 30000, tier: 'T3' }, { tech: 'Chlor-Alkali byprod', capex: 400, eff: 55, life: 60000, tier: 'T2' }, { tech: 'Nafion-PEM LowPGM', capex: 850, eff: 62, life: 85000, tier: 'T3-T4' }] }}
      />
    </div>
  );
}
