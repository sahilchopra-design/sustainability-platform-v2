import React, { useState, useMemo } from 'react';
import EnergyAdvancedAnalytics from '../../_shared/EnergyAdvancedAnalytics';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, ComposedChart, Cell,
  ScatterChart, Scatter, RadarChart, PolarGrid, PolarAngleAxis, Radar
} from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const T = {
  bg: '#FAFAF7', card: '#FFFFFF', border: '#E5E2D9',
  text: '#1A1A2E', sub: '#6B7280', accent: '#B8860B',
  green: '#065F46', red: '#991B1B', blue: '#1E40AF',
  teal: '#0F766E', amber: '#92400E', navy: '#0F172A',
  indigo: '#4F46E5', purple: '#7C3AED', sage: '#4A7C59'
};

// ── BESS physics ──────────────────────────────────────────────────────────────
function calcLcos({ capexPerKwh, opexPct, rte, cycles, lifetime, wacc, degradePct }) {
  // LCOS = (capex + lifetime opex) / lifetime energy throughput (€/kWh delivered)
  const capexAnn = capexPerKwh * (wacc / 100) / (1 - Math.pow(1 + wacc / 100, -lifetime));
  const opexAnn  = capexPerKwh * opexPct / 100;
  const annualThroughput = cycles * rte / 100; // kWh out per kWh capacity per yr
  return annualThroughput > 0 ? +((capexAnn + opexAnn) / annualThroughput).toFixed(4) : 0;
}

function arrheniusDegradation(T_celsius, baseRate, yearsOp) {
  // Simplified Arrhenius: higher temp accelerates degradation
  const Ea = 0.6;  // activation energy (eV, approx for LFP)
  const k  = 8.617e-5; // Boltzmann constant (eV/K)
  const T0 = 298.15;   // 25°C in K
  const T1 = T_celsius + 273.15;
  const accel = Math.exp(Ea / k * (1 / T0 - 1 / T1));
  return 1 - (baseRate / 100) * accel * Math.sqrt(yearsOp);
}

function revenueStack(params) {
  const { capacityMW, capMarket, fcr, afrr, arbitrage, cfArb, cfFcr, cfAfrr } = params;
  return {
    capacityMarket: capacityMW * capMarket * cfFcr / 100 / 1e6,
    fcr:            capacityMW * fcr * cfFcr / 100 / 1e6,
    afrr:           capacityMW * afrr * cfAfrr / 100 / 1e6,
    arbitrage:      capacityMW * arbitrage * cfArb / 100 / 1e6,
  };
}

// ── Chemistry catalogue ───────────────────────────────────────────────────────
const CHEMISTRIES = [
  {
    id: 'LFP', label: 'LFP (Lithium Iron Phosphate)',
    capexKwh: 185, opexPct: 1.5, rte: 92, cycles: 365, calDeg: 0.025,
    cycDeg: 0.000015, tempRange: '-20 to 60°C', lifetime: 15,
    energy: 120, power: 250, trl: 9, color: T.blue,
    pros: ['Safest chemistry', 'Longest cycle life', 'Low cost trend'], cons: ['Lower energy density', 'Heavier']
  },
  {
    id: 'NMC', label: 'NMC (Nickel Manganese Cobalt)',
    capexKwh: 200, opexPct: 2.0, rte: 93, cycles: 300, calDeg: 0.040,
    cycDeg: 0.000025, tempRange: '-20 to 55°C', lifetime: 12,
    energy: 200, power: 350, trl: 9, color: T.green,
    pros: ['High energy density', 'High power', 'EV-proven'], cons: ['Cobalt supply risk', 'Thermal runaway risk']
  },
  {
    id: 'LNMO', label: 'LNMO (High-Voltage Spinel)',
    capexKwh: 220, opexPct: 2.5, rte: 91, cycles: 250, calDeg: 0.035,
    cycDeg: 0.00002, tempRange: '-10 to 50°C', lifetime: 10,
    energy: 180, power: 400, trl: 7, color: T.amber,
    pros: ['No cobalt', 'High voltage', 'High power'], cons: ['Electrolyte stability', 'Capacity fade']
  },
  {
    id: 'NaIon', label: 'Na-Ion (Sodium Ion)',
    capexKwh: 160, opexPct: 1.8, rte: 90, cycles: 280, calDeg: 0.030,
    cycDeg: 0.000020, tempRange: '-40 to 60°C', lifetime: 12,
    energy: 100, power: 200, trl: 8, color: T.teal,
    pros: ['No lithium/cobalt', 'Wide temperature', 'Cost trend'], cons: ['Lower energy density', 'Early commercial']
  },
];

const MARKETS = [
  { country: 'UK',         capMkt: 45000, fcr: 12000, afrr: 8000, arbitrage: 15000, color: T.blue },
  { country: 'Germany',    capMkt: 35000, fcr: 14000, afrr: 9000, arbitrage: 18000, color: T.green },
  { country: 'Australia',  capMkt: 20000, fcr: 8000,  afrr: 5000, arbitrage: 22000, color: T.amber },
  { country: 'USA (CAISO)',capMkt: 55000, fcr: 5000,  afrr: 6000, arbitrage: 25000, color: T.red },
  { country: 'Italy',      capMkt: 40000, fcr: 11000, afrr: 7000, arbitrage: 14000, color: T.indigo },
  { country: 'Ireland',    capMkt: 38000, fcr: 16000, afrr: 11000,arbitrage: 12000, color: T.teal },
];

const YEARS = Array.from({ length: 16 }, (_, i) => 2025 + i);

function npv(cashflows, rate) {
  return cashflows.reduce((acc, cf, t) => acc + cf / Math.pow(1 + rate, t + 1), 0);
}
function irr(cashflows, guess = 0.1) {
  let r = guess;
  for (let i = 0; i < 200; i++) {
    const f  = cashflows.reduce((s, cf, t) => s + cf / Math.pow(1 + r, t), 0);
    const df = cashflows.reduce((s, cf, t) => s - t * cf / Math.pow(1 + r, t + 1), 0);
    if (Math.abs(df) < 1e-12) break;
    const rn = r - f / df;
    if (Math.abs(rn - r) < 1e-8) { r = rn; break; }
    r = rn;
  }
  return r;
}

function Slider({ label, value, min, max, step = 1, onChange, unit = '' }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.sub, marginBottom: 3 }}>
        <span>{label}</span><span style={{ color: T.accent, fontFamily: 'monospace' }}>{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} style={{ width: '100%', accentColor: T.accent }} />
    </div>
  );
}
function KpiCard({ label, value, unit, sub, color }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '12px 16px', flex: 1, minWidth: 130 }}>
      <div style={{ fontSize: 11, color: T.sub, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: color || T.navy, fontFamily: 'monospace' }}>{value}</div>
      {unit && <div style={{ fontSize: 10, color: T.sub }}>{unit}</div>}
      {sub  && <div style={{ fontSize: 10, color: T.sub, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

const TABS = ['LCOS Engine', 'Chemistry Compare', 'Revenue Stack', 'Degradation Model',
  'Project Finance', 'Monte Carlo', 'Market Benchmarks', 'Safety & Regulation',
  'Capex Trajectory', 'Investor Returns'];

export default function BessProjectFinancePage() {
  const [tab, setTab] = useState(0);
  const [chem, setChem] = useState('LFP');
  const [capexKwh, setCapexKwh] = useState(185);
  const [opexPct, setOpexPct] = useState(1.5);
  const [rte, setRte] = useState(92);
  const [cycles, setCycles] = useState(365);
  const [lifetime, setLifetime] = useState(15);
  const [wacc, setWacc] = useState(8);
  const [degradePct, setDegradePct] = useState(2.5);
  const [capacityMW, setCapacityMW] = useState(100);
  const [durationH, setDurationH] = useState(2);
  const [capMkt, setCapMkt] = useState(45000);
  const [fcrRev, setFcrRev] = useState(12000);
  const [affrrRev, setAffrrRev] = useState(8000);
  const [arbRev, setArbRev] = useState(15000);
  const [cfArb, setCfArb] = useState(30);
  const [cfFcr, setCfFcr] = useState(60);
  const [cfAfrr, setCfAfrr] = useState(40);

  const selected = CHEMISTRIES.find(c => c.id === chem) || CHEMISTRIES[0];
  const lcos = useMemo(() => calcLcos({ capexPerKwh: capexKwh, opexPct, rte, cycles, lifetime, wacc, degradePct }), [capexKwh, opexPct, rte, cycles, lifetime, wacc, degradePct]);
  const capexTotal = capexKwh * capacityMW * durationH * 1000 / 1e6; // M€

  const revStack = useMemo(() => revenueStack({ capacityMW, capMarket: capMkt, fcr: fcrRev, afrr: affrrRev, arbitrage: arbRev, cfArb, cfFcr, cfAfrr }), [capacityMW, capMkt, fcrRev, affrrRev, arbRev, cfArb, cfFcr, cfAfrr]);
  const totalRevenue = Object.values(revStack).reduce((a, b) => a + b, 0);
  const annualOpex = capexTotal * opexPct / 100;
  const ebitda = totalRevenue - annualOpex;

  // Project cashflows
  const cashflows = useMemo(() => {
    const capex = capexTotal;
    return Array.from({ length: lifetime }, (_, y) => {
      const degradeFactor = Math.max(0.7, 1 - (degradePct / 100) * y);
      return (totalRevenue * degradeFactor) - annualOpex;
    }).map((cf, i) => (i === 0 ? cf - capex : cf));
  }, [capexTotal, totalRevenue, annualOpex, lifetime, degradePct]);

  const projectIrr = useMemo(() => { const r = irr(cashflows); return isFinite(r) ? +(r * 100).toFixed(1) : 'N/A'; }, [cashflows]);
  const projectNpv = useMemo(() => +npv(cashflows, wacc / 100).toFixed(1), [cashflows, wacc]);

  // Degradation profile
  const degradData = useMemo(() => Array.from({ length: lifetime }, (_, y) => ({
    year: `Y${y + 1}`,
    soh: +(100 - degradePct * y * (1 + cycles / 5000)).toFixed(1),
    sohArrh: +(arrheniusDegradation(25, degradePct, y) * 100).toFixed(1),
    sohHot:  +(arrheniusDegradation(35, degradePct, y) * 100).toFixed(1),
  })), [lifetime, degradePct, cycles]);

  // LCOS comparison across chemistries
  const lcosByChemistry = CHEMISTRIES.map(c => ({
    name: c.id,
    lcos: calcLcos({ capexPerKwh: c.capexKwh, opexPct: c.opexPct, rte: c.rte, cycles: c.cycles, lifetime: c.lifetime, wacc, degradePct: c.calDeg * 100 }),
    color: c.color,
  }));

  // Capex learning curve
  const capexData = YEARS.map((y, i) => ({
    year: y,
    LFP:   Math.round(185 * Math.pow(0.87, i)),
    NMC:   Math.round(200 * Math.pow(0.86, i)),
    NaIon: Math.round(160 * Math.pow(0.84, i)),
  }));

  // Monte Carlo
  const mcData = useMemo(() => Array.from({ length: 200 }, (_, i) => {
    const revShock  = 0.7 + sr(i * 17) * 0.6;
    const capShock  = 0.85 + sr(i * 11) * 0.3;
    const adjRev    = totalRevenue * revShock;
    const adjCapex  = capexTotal * capShock;
    const adjOpex   = annualOpex;
    const cfs = Array.from({ length: lifetime }, (_, y) => {
      const df = Math.max(0.7, 1 - (degradePct / 100) * y);
      return (adjRev * df) - adjOpex;
    }).map((cf, y) => y === 0 ? cf - adjCapex : cf);
    const r = irr(cfs);
    return isFinite(r) ? +(r * 100).toFixed(1) : null;
  }).filter(v => v !== null && v > -50 && v < 100), [totalRevenue, capexTotal, annualOpex, lifetime, degradePct]);

  // Revenue stack bar
  const revBarData = [
    { name: 'Capacity Market', value: +revStack.capacityMarket.toFixed(2), fill: T.blue },
    { name: 'FCR',             value: +revStack.fcr.toFixed(2),            fill: T.green },
    { name: 'aFRR',            value: +revStack.afrr.toFixed(2),           fill: T.amber },
    { name: 'Arbitrage',       value: +revStack.arbitrage.toFixed(2),      fill: T.teal },
  ];

  const panelStyle = { background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: T.text };
  const headerStyle = { background: T.navy, color: '#fff', padding: '20px 28px', borderBottom: `3px solid ${T.accent}` };
  const tabBarStyle = { display: 'flex', overflowX: 'auto', borderBottom: `1px solid ${T.border}`, background: T.card, padding: '0 16px' };
  const tabStyle = a => ({ padding: '10px 16px', fontSize: 12, fontWeight: a ? 700 : 400, color: a ? T.accent : T.sub, borderBottom: a ? `2px solid ${T.accent}` : '2px solid transparent', cursor: 'pointer', whiteSpace: 'nowrap' });
  const sectionStyle = { padding: '20px 24px' };
  const cardStyle = { background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginBottom: 16 };
  const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 };

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <div style={{ fontSize: 11, color: T.accent, fontFamily: 'monospace', marginBottom: 4 }}>EP-DT1 · BATTERY STORAGE FINANCE</div>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Grid-Scale BESS Project Finance & LCOS Engine</h1>
        <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>LFP · NMC · Na-Ion · LCOS · Arrhenius Degradation · Revenue Stack · IRR · Monte Carlo · 10 Tabs</div>
      </div>
      <div style={tabBarStyle}>{TABS.map((t, i) => <div key={i} style={tabStyle(tab === i)} onClick={() => setTab(i)}>{t}</div>)}</div>

      {tab === 0 && (
        <div style={sectionStyle}>
          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20 }}>
            <div style={cardStyle}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 14 }}>LCOS Parameters</div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: T.sub, marginBottom: 6 }}>Chemistry</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {CHEMISTRIES.map(c => (
                    <button key={c.id} onClick={() => { setChem(c.id); setCapexKwh(c.capexKwh); setOpexPct(c.opexPct); setRte(c.rte); setCycles(c.cycles); setLifetime(c.lifetime); setDegradePct(c.calDeg * 100); }}
                      style={{ padding: '4px 10px', fontSize: 11, borderRadius: 5, border: `1px solid ${chem === c.id ? c.color : T.border}`, background: chem === c.id ? c.color : 'transparent', color: chem === c.id ? '#fff' : T.sub, cursor: 'pointer' }}>
                      {c.id}
                    </button>
                  ))}
                </div>
              </div>
              <Slider label="CAPEX" value={capexKwh} min={80} max={400} step={5} onChange={setCapexKwh} unit=" €/kWh" />
              <Slider label="O&M (% capex/yr)" value={opexPct} min={0.5} max={4} step={0.5} onChange={setOpexPct} unit="%" />
              <Slider label="Round-trip efficiency" value={rte} min={75} max={97} step={1} onChange={setRte} unit="%" />
              <Slider label="Cycles/yr" value={cycles} min={50} max={730} step={10} onChange={setCycles} unit=" /yr" />
              <Slider label="Lifetime" value={lifetime} min={8} max={25} step={1} onChange={setLifetime} unit=" yrs" />
              <Slider label="Calendar degradation" value={degradePct} min={0.5} max={6} step={0.5} onChange={setDegradePct} unit="% SoH/yr" />
              <Slider label="WACC" value={wacc} min={3} max={15} step={0.5} onChange={setWacc} unit="%" />
            </div>
            <div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                <KpiCard label="LCOS" value={lcos.toFixed(3)} unit="€/kWh delivered" color={lcos < 0.1 ? T.green : lcos < 0.2 ? T.amber : T.red} />
                <KpiCard label="Lifetime throughput" value={`${(cycles * rte / 100 * lifetime).toFixed(0)}`} unit="kWh/kWh installed" />
                <KpiCard label="Annual energy" value={`${(cycles * rte / 100).toFixed(0)}`} unit="kWh delivered/kWh cap" />
                <KpiCard label="Capex/MWh" value={`${(capexKwh * durationH).toFixed(0)}`} unit="€/MWh (at 2h)" color={T.navy} />
              </div>
              <div style={cardStyle}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>LCOS vs Cycles/yr — Chemistry Comparison</div>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={Array.from({ length: 8 }, (_, i) => {
                    const c = 50 + i * 90;
                    return { cycles: c, LFP: +calcLcos({ capexPerKwh: 185, opexPct: 1.5, rte: 92, cycles: c, lifetime: 15, wacc, degradePct: 2.5 }).toFixed(4), NMC: +calcLcos({ capexPerKwh: 200, opexPct: 2, rte: 93, cycles: c, lifetime: 12, wacc, degradePct: 4 }).toFixed(4), NaIon: +calcLcos({ capexPerKwh: 160, opexPct: 1.8, rte: 90, cycles: c, lifetime: 12, wacc, degradePct: 3 }).toFixed(4) };
                  })}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="cycles" label={{ value: 'Cycles/yr', position: 'insideBottom', offset: -3, fontSize: 10 }} tick={{ fontSize: 10 }} />
                    <YAxis label={{ value: '€/kWh', angle: -90, position: 'insideLeft', fontSize: 10 }} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v, n) => [`${v} €/kWh`, n]} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <ReferenceLine y={0.1} stroke={T.accent} strokeDasharray="4 4" label={{ value: 'Target', fontSize: 9, fill: T.accent }} />
                    <Line type="monotone" dataKey="LFP" stroke={T.blue} strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="NMC" stroke={T.green} strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="NaIon" stroke={T.teal} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div style={cardStyle}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>LCOS by Chemistry at Current Inputs</div>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={lcosByChemistry}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis label={{ value: '€/kWh', angle: -90, position: 'insideLeft', fontSize: 10 }} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v) => [`${v} €/kWh`, 'LCOS']} />
                    <Bar dataKey="lcos" radius={[4, 4, 0, 0]}>{lcosByChemistry.map((d, i) => <Cell key={i} fill={d.color} />)}</Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div style={sectionStyle}>
          <div style={gridStyle}>
            {CHEMISTRIES.map((c, i) => (
              <div key={c.id} style={{ ...cardStyle, borderTop: `3px solid ${c.color}` }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: c.color, marginBottom: 8 }}>{c.label}</div>
                <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
                  <tbody>
                    {[
                      ['CAPEX', `${c.capexKwh} €/kWh`],
                      ['Round-trip eff.', `${c.rte}%`],
                      ['Cycle life', `${(c.cycles * c.lifetime).toLocaleString()} total`],
                      ['Cycles/yr (rated)', `${c.cycles}`],
                      ['Lifetime', `${c.lifetime} yrs`],
                      ['Energy density', `${c.energy} Wh/kg`],
                      ['Power density', `${c.power} W/kg`],
                      ['Temp range', c.tempRange],
                      ['TRL', `${c.trl}/9`],
                    ].map(([k, v]) => (
                      <tr key={k} style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '4px 0', color: T.sub, fontSize: 10 }}>{k}</td>
                        <td style={{ padding: '4px 0', fontWeight: 600, textAlign: 'right', fontSize: 10 }}>{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 10, color: T.green }}>✓ {c.pros.join(' · ')}</div>
                  <div style={{ fontSize: 10, color: T.red, marginTop: 2 }}>✗ {c.cons.join(' · ')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 2 && (
        <div style={sectionStyle}>
          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20 }}>
            <div style={cardStyle}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 14 }}>Revenue Stack Parameters</div>
              <Slider label="Plant scale" value={capacityMW} min={10} max={500} step={10} onChange={setCapacityMW} unit=" MW" />
              <Slider label="Duration" value={durationH} min={1} max={8} step={0.5} onChange={setDurationH} unit=" h" />
              <Slider label="Capacity market (€/MW/yr)" value={capMkt} min={0} max={80000} step={1000} onChange={setCapMkt} unit="" />
              <Slider label="FCR revenue (€/MW/yr)" value={fcrRev} min={0} max={30000} step={500} onChange={setFcrRev} unit="" />
              <Slider label="aFRR revenue (€/MW/yr)" value={affrrRev} min={0} max={20000} step={500} onChange={setAffrrRev} unit="" />
              <Slider label="Arbitrage (€/MW/yr)" value={arbRev} min={0} max={50000} step={1000} onChange={setArbRev} unit="" />
              <Slider label="Arbitrage CF" value={cfArb} min={5} max={80} step={5} onChange={setCfArb} unit="%" />
              <Slider label="FCR/Cap CF" value={cfFcr} min={10} max={95} step={5} onChange={setCfFcr} unit="%" />
              <div style={{ marginTop: 14, padding: 12, background: T.bg, borderRadius: 8, fontSize: 11 }}>
                <div style={{ color: T.sub }}>Total annual revenue</div>
                <div style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 700, color: T.accent }}>{totalRevenue.toFixed(2)} M€/yr</div>
                <div style={{ color: T.sub, marginTop: 4 }}>EBITDA: <strong>{ebitda.toFixed(2)} M€/yr</strong></div>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                <KpiCard label="Capacity Market" value={revStack.capacityMarket.toFixed(2)} unit="M€/yr" color={T.blue} />
                <KpiCard label="FCR" value={revStack.fcr.toFixed(2)} unit="M€/yr" color={T.green} />
                <KpiCard label="aFRR" value={revStack.afrr.toFixed(2)} unit="M€/yr" color={T.amber} />
                <KpiCard label="Arbitrage" value={revStack.arbitrage.toFixed(2)} unit="M€/yr" color={T.teal} />
              </div>
              <div style={cardStyle}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Revenue Stack — Annualised M€</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={revBarData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis label={{ value: 'M€/yr', angle: -90, position: 'insideLeft', fontSize: 10 }} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v) => [`${v} M€/yr`]} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>{revBarData.map((d, i) => <Cell key={i} fill={d.fill} />)}</Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={cardStyle}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Revenue Stack by Market</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={MARKETS.map(m => ({ ...m, total: (capacityMW * (m.capMkt + m.fcr + m.afrr + m.arbitrage) / 1e6).toFixed(2) }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="country" tick={{ fontSize: 10 }} />
                    <YAxis label={{ value: 'M€/yr', angle: -90, position: 'insideLeft', fontSize: 10 }} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v) => [`${v} M€/yr`, 'Total Revenue']} />
                    <Bar dataKey="total" radius={[4, 4, 0, 0]}>{MARKETS.map((m, i) => <Cell key={i} fill={m.color} />)}</Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 3 && (
        <div style={sectionStyle}>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 4 }}>State of Health (SoH) vs Time — Arrhenius Thermal Model</div>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 14 }}>SoH = 1 − β_cal × e^(Ea/k × (1/T₀ − 1/T)) × √t − β_cyc × N_total · Replacement trigger: SoH &lt; 80%</div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={degradData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                <YAxis label={{ value: 'SoH (%)', angle: -90, position: 'insideLeft', fontSize: 10 }} tick={{ fontSize: 10 }} domain={[60, 100]} />
                <Tooltip formatter={(v, n) => [`${v}%`, n]} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <ReferenceLine y={80} stroke={T.red} strokeDasharray="4 4" label={{ value: '80% EOL trigger', fontSize: 9, fill: T.red }} />
                <Line type="monotone" dataKey="sohArrh" name="25°C (standard)" stroke={T.blue} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="sohHot" name="35°C (warm climate)" stroke={T.amber} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={gridStyle}>
            <div style={cardStyle}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Degradation Mechanisms</div>
              {[
                { mech: 'SEI layer growth (calendar)',  rate: 'β_cal ≈ 0.02–0.04/√yr', driver: 'Temperature, SoC, time', mitigation: 'Cool storage, avoid 100% SoC' },
                { mech: 'Li plating (cycle)',           rate: 'β_cyc ≈ 10–25 μm/cycle', driver: 'High C-rate, low T, deep DoD', mitigation: 'Limit C-rate, thermal mgmt' },
                { mech: 'Particle cracking (NMC)',      rate: '0.01–0.02% SoH/cycle',  driver: 'Large ΔV swing, mechanical stress', mitigation: 'Limit DoD 20–80%' },
                { mech: 'Electrolyte decomposition',    rate: 'Accelerates > 45°C',      driver: 'High temp, high SoC',              mitigation: 'Active cooling, BMS cut-off' },
                { mech: 'Active material loss (Mn dissoln.)', rate: 'LMO/LNMO specific', driver: 'High temp + acidity',             mitigation: 'Electrolyte additives' },
              ].map((r, i) => (
                <div key={i} style={{ padding: '7px 0', borderBottom: `1px solid ${T.border}`, fontSize: 11 }}>
                  <div style={{ fontWeight: 600 }}>{r.mech}</div>
                  <div style={{ color: T.amber, fontSize: 10, marginTop: 1 }}>Rate: {r.rate}</div>
                  <div style={{ color: T.sub, fontSize: 10 }}>Driver: {r.driver}</div>
                  <div style={{ color: T.green, fontSize: 10 }}>✓ {r.mitigation}</div>
                </div>
              ))}
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>DoD & Cycle Life Trade-off</div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={[
                  { dod: 20,  lfpCycles: 10000, nmcCycles: 5000 },
                  { dod: 40,  lfpCycles: 6000,  nmcCycles: 3200 },
                  { dod: 60,  lfpCycles: 4000,  nmcCycles: 2000 },
                  { dod: 80,  lfpCycles: 2800,  nmcCycles: 1400 },
                  { dod: 100, lfpCycles: 2000,  nmcCycles: 1000 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="dod" label={{ value: 'DoD (%)', position: 'insideBottom', offset: -3, fontSize: 10 }} tick={{ fontSize: 10 }} />
                  <YAxis label={{ value: 'Cycle count', angle: -90, position: 'insideLeft', fontSize: 10 }} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v, n) => [`${v.toLocaleString()} cycles`, n]} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Line type="monotone" dataKey="lfpCycles" name="LFP" stroke={T.blue} strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="nmcCycles" name="NMC" stroke={T.green} strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 4 && (
        <div style={sectionStyle}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <KpiCard label="Project IRR" value={`${projectIrr}%`} unit="unlevered" color={Number(projectIrr) >= wacc ? T.green : T.red} />
            <KpiCard label="Project NPV" value={`${projectNpv}`} unit="M€ at WACC" color={projectNpv > 0 ? T.green : T.red} />
            <KpiCard label="Total CAPEX" value={`${capexTotal.toFixed(1)}`} unit={`M€ (${capacityMW}MW × ${durationH}h)`} />
            <KpiCard label="Simple payback" value={`${(capexTotal / Math.max(0.01, ebitda)).toFixed(1)}`} unit="years" color={T.teal} />
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Annual Cashflow Profile (incl. SoH degradation)</div>
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={cashflows.map((cf, i) => ({ year: `Y${i + 1}`, cashflow: +cf.toFixed(2), cumulative: +cashflows.slice(0, i + 1).reduce((a, b) => a + b, 0).toFixed(2) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 9 }} />
                <YAxis yAxisId="left" label={{ value: 'M€', angle: -90, position: 'insideLeft', fontSize: 10 }} tick={{ fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" label={{ value: 'Cumul. M€', angle: 90, position: 'insideRight', fontSize: 10 }} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v, n) => [`${v} M€`, n]} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <ReferenceLine yAxisId="left" y={0} stroke={T.sub} />
                <Bar yAxisId="left" dataKey="cashflow" name="Annual CF">
                  {cashflows.map((cf, i) => <Cell key={i} fill={cf >= 0 ? T.teal : T.red} />)}
                </Bar>
                <Line yAxisId="right" type="monotone" dataKey="cumulative" name="Cumulative" stroke={T.accent} strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 5 && (
        <div style={sectionStyle}>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 4 }}>Monte Carlo — 200 Scenarios (Revenue ±30%, CAPEX ±15%)</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={(() => {
                const bins = Array.from({ length: 20 }, (_, i) => ({ range: `${(-10 + i * 2).toFixed(0)}–${(-8 + i * 2).toFixed(0)}%`, count: 0, midpoint: -9 + i * 2 }));
                mcData.forEach(v => {
                  const idx = Math.min(19, Math.max(0, Math.floor((v + 10) / 2)));
                  bins[idx].count++;
                });
                return bins;
              })()}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="range" tick={{ fontSize: 8 }} angle={-45} textAnchor="end" height={55} />
                <YAxis label={{ value: 'Count', angle: -90, position: 'insideLeft', fontSize: 10 }} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => [`${v} scenarios`]} />
                <Bar dataKey="count" name="Scenarios">
                  {Array.from({ length: 20 }, (_, i) => <Cell key={i} fill={-9 + i * 2 >= wacc ? T.teal : T.red} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[
              { label: 'P10 IRR', value: `${[...mcData].sort((a, b) => a - b)[Math.floor(mcData.length * 0.1)]?.toFixed(1) ?? 'N/A'}%` },
              { label: 'P50 IRR', value: `${[...mcData].sort((a, b) => a - b)[Math.floor(mcData.length * 0.5)]?.toFixed(1) ?? 'N/A'}%` },
              { label: 'P90 IRR', value: `${[...mcData].sort((a, b) => a - b)[Math.floor(mcData.length * 0.9)]?.toFixed(1) ?? 'N/A'}%` },
              { label: 'P(IRR ≥ WACC)', value: `${((mcData.filter(v => v >= wacc).length / Math.max(1, mcData.length)) * 100).toFixed(0)}%` },
            ].map((k, i) => <KpiCard key={i} label={k.label} value={k.value} color={T.blue} />)}
          </div>
        </div>
      )}

      {tab === 6 && (
        <div style={sectionStyle}>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Grid-Scale BESS Market Benchmarks (2025)</div>
            <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.bg }}>
                  {['Country', 'Cap. Market (€/MW/yr)', 'FCR (€/MW/yr)', 'aFRR (€/MW/yr)', 'Arbitrage (€/MW/yr)', 'Regulatory'].map(h => (
                    <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: T.sub, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MARKETS.map((m, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 ? T.bg : T.card }}>
                    <td style={{ padding: '6px 8px', fontWeight: 700, color: m.color }}>{m.country}</td>
                    <td style={{ padding: '6px 8px', fontFamily: 'monospace' }}>{m.capMkt.toLocaleString()}</td>
                    <td style={{ padding: '6px 8px', fontFamily: 'monospace' }}>{m.fcr.toLocaleString()}</td>
                    <td style={{ padding: '6px 8px', fontFamily: 'monospace' }}>{m.afrr.toLocaleString()}</td>
                    <td style={{ padding: '6px 8px', fontFamily: 'monospace' }}>{m.arbitrage.toLocaleString()}</td>
                    <td style={{ padding: '6px 8px', fontSize: 10, color: T.sub }}>
                      {['T-4 Capacity Mkt', 'Regelenergie', 'FCAS AEMC', 'CAISO DRAM', 'TIDE/MSD', 'DS3'][i]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 7 && (
        <div style={sectionStyle}>
          <div style={gridStyle}>
            <div style={cardStyle}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Safety Standards — Li-Ion BESS</div>
              {[
                ['IEC 62619', 'Secondary cells & batteries — safety requirements for large format'],
                ['UL 9540', 'Standard for Energy Storage Systems and Equipment (USA)'],
                ['UL 9540A', 'Test method for thermal runaway propagation in ESS'],
                ['NFPA 855', 'Standard for installation of stationary energy storage systems'],
                ['IFC/NFPA 855', 'Fire separation, suppression for container BESS'],
                ['EN 50604-1', 'Secondary lithium batteries for light EVs — safety'],
                ['IEC 62040-3', 'UPS systems performance — relevant for grid-connected'],
                ['ATEX/IECEx', 'Explosive atmospheres — thermal runaway gas hazard'],
              ].map(([std, desc], i) => (
                <div key={i} style={{ padding: '6px 0', borderBottom: `1px solid ${T.border}`, fontSize: 11 }}>
                  <span style={{ fontWeight: 700, color: T.blue }}>{std}</span>
                  <div style={{ color: T.sub, fontSize: 10, marginTop: 1 }}>{desc}</div>
                </div>
              ))}
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Thermal Runaway Risk — Mitigation Hierarchy</div>
              {[
                { tier: 'Prevention', actions: 'BMS voltage/temp limits, cell screening, proper installation' },
                { tier: 'Detection',  actions: 'Gas sensors, thermal cameras, off-gas (CO/H₂) sensors, early warning' },
                { tier: 'Propagation control', actions: 'Cell-level firebreaks, module isolation, thermal barriers (UL 9540A tested)' },
                { tier: 'Suppression', actions: 'FM-200, NOVEC 1230, water mist (container), sprinkler (building)' },
                { tier: 'Emergency response', actions: 'BESS-specific SOPs, fire brigade protocols, 48-hour monitoring post-event' },
              ].map((r, i) => (
                <div key={i} style={{ padding: '8px 0', borderBottom: `1px solid ${T.border}`, fontSize: 11 }}>
                  <div style={{ fontWeight: 700, color: [T.green, T.teal, T.amber, T.red, T.navy][i] }}>{r.tier}</div>
                  <div style={{ color: T.sub, fontSize: 10, marginTop: 2 }}>{r.actions}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 8 && (
        <div style={sectionStyle}>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 4 }}>Battery Pack CAPEX Learning Curves 2025–2040 (€/kWh)</div>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 14 }}>Wright's Law applied: LFP learning rate ≈ 13%, NMC ≈ 14%, Na-Ion ≈ 16% per doubling of cumulative production.</div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={capexData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                <YAxis label={{ value: '€/kWh', angle: -90, position: 'insideLeft', fontSize: 10 }} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v, n) => [`${v} €/kWh`, n]} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <ReferenceLine y={75} stroke={T.accent} strokeDasharray="4 4" label={{ value: 'Grid parity target', fontSize: 9, fill: T.accent }} />
                <Line type="monotone" dataKey="LFP" stroke={T.blue} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="NMC" stroke={T.green} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="NaIon" stroke={T.teal} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 9 && (
        <div style={sectionStyle}>
          <div style={gridStyle}>
            <div style={cardStyle}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Return Benchmarks — Infrastructure Funds</div>
              {[
                ['Core BESS (contracted)',  '7–9% IRR',  '65–70% debt'],
                ['Core+ BESS (merchant)',   '9–12% IRR', '55–65% debt'],
                ['Value-add (development)', '12–18% IRR','45–55% debt'],
                ['Merchant standalone',    '14–22% IRR', '40–50% debt'],
              ].map(([strat, irr_, lev], i) => (
                <div key={i} style={{ padding: '8px 0', borderBottom: `1px solid ${T.border}`, fontSize: 11 }}>
                  <div style={{ fontWeight: 600 }}>{strat}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                    <span style={{ color: T.green, fontWeight: 600 }}>{irr_}</span>
                    <span style={{ color: T.sub }}>{lev}</span>
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 14, padding: 12, background: T.bg, borderRadius: 8, fontSize: 11 }}>
                <div style={{ color: T.sub, marginBottom: 4 }}>Current project estimate</div>
                <div style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 700, color: Number(projectIrr) >= wacc ? T.green : T.red }}>{projectIrr}% IRR · {projectNpv} M€ NPV</div>
              </div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Key BESS Project Comparables (2024–2025)</div>
              <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: T.bg }}>
                    {['Project', 'MW/MWh', 'Revenue Model', 'IRR est.'].map(h => <th key={h} style={{ padding: '5px 8px', textAlign: 'left', color: T.sub, borderBottom: `1px solid ${T.border}` }}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Minety BESS (UK)',   '100 MW/200 MWh', 'Cap mkt + FCR', '9–11%'],
                    ['Blyth BESS (UK)',    '50 MW/100 MWh',  'DS3 + arbitrage', '10–13%'],
                    ['Horndale (AU)',      '150 MW/194 MWh', 'FCAS + STTM', '14–17%'],
                    ['Moss Landing (US)',  '300 MW/1.2 GWh', 'CAISO DRAM', '8–11%'],
                    ['Geelong BESS (AU)', '100 MW/200 MWh', 'FCAS contracted', '12–15%'],
                    ['Pillswood (UK)',     '196 MW/392 MWh', 'TNUoS + FCR + arbitrage', '10–12%'],
                  ].map(([proj, size, model, irr_], i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 ? T.bg : T.card }}>
                      <td style={{ padding: '5px 8px', fontWeight: 500 }}>{proj}</td>
                      <td style={{ padding: '5px 8px', fontFamily: 'monospace', fontSize: 10 }}>{size}</td>
                      <td style={{ padding: '5px 8px', fontSize: 10 }}>{model}</td>
                      <td style={{ padding: '5px 8px', fontFamily: 'monospace', fontWeight: 700, color: T.green }}>{irr_}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      <EnergyAdvancedAnalytics T={T} moduleCode="EP-DT1" title="BESS Project Finance — MC IRR, Stack Tornado & NGFS Ancillary Price Scenarios"
        mcModel={{ title: 'MC Levered IRR (%) · 200 MW / 4h BESS', unit: '%', fmt: (n) => n.toFixed(2),
        vars: { capexKwh: { min: 220, mode: 300, max: 420 }, cycles: { min: 280, mode: 365, max: 420 }, spread: { min: 60, mode: 110, max: 180 }, fcr: { min: 20, mode: 45, max: 80 } },
        compute: (v) => { const mwh = 200 * 4; const arbRev = mwh * 0.85 * v.spread * v.cycles / 1000; const fcrRev = 200 * v.fcr * 8760 * 0.3 / 1000; const capex = mwh * v.capexKwh / 1000; return Math.max(-5, Math.min(30, ((arbRev + fcrRev) * 0.75 / capex) * 100)); } }}
      tornadoModel={{ title: 'Tornado — BESS IRR Drivers', unit: '%', fmt: (n) => `${n.toFixed(1)}%`,
        inputs: { capexKwh: 300, cycles: 365, spread: 110, fcr: 45 },
        compute: (v) => { const mwh = 200 * 4; const arbRev = mwh * 0.85 * v.spread * v.cycles / 1000; const fcrRev = 200 * v.fcr * 8760 * 0.3 / 1000; const capex = mwh * v.capexKwh / 1000; return Math.max(-5, Math.min(30, ((arbRev + fcrRev) * 0.75 / capex) * 100)); } }}
      scenarioImpact={(p) => Math.max(5, 12 + 0.04 * Math.max(0, p - 60))} scenarioFmt={(v) => `${v.toFixed(1)}%`}
      scenarioTitle="Carbon Price × NGFS Pathway — BESS IRR via arbitrage depth (%)"
      peers={{ cols: [{ k: 'own', label: 'Owner' }, { k: 'fleet', label: 'Fleet GWh', fmt: (v) => `${v.toFixed(1)}` }, { k: 'lcos', label: 'LCOS ($/MWh)', fmt: (v) => `$${v.toFixed(0)}` }, { k: 'irr', label: 'Run IRR', fmt: (v) => `${v.toFixed(1)}%` }, { k: 'rev', label: 'Rev stack' }],
        rows: [{ own: 'Gresham House ES', fleet: 1.1, lcos: 165, irr: 13.5, rev: 'FCR+arb' }, { own: 'Zenobe',            fleet: 1.5, lcos: 150, irr: 14.2, rev: 'FCR+arb+DSR' }, { own: 'Fluence portf',     fleet: 4.2, lcos: 155, irr: 13.0, rev: 'Arb+aFRR+DSR' }, { own: 'RWE Storage',       fleet: 2.8, lcos: 158, irr: 12.8, rev: 'Cap+arb+FCR' }, { own: 'Neoen',             fleet: 2.3, lcos: 148, irr: 14.8, rev: 'FCAS+arb' }, { own: 'Plus Power',        fleet: 2.0, lcos: 152, irr: 13.8, rev: 'RA+arb' }] }}
        indiaContext={{
          subtitle: 'CERC ancillary mkt · PLI ACC · SECI BESS tenders',
          regulations: [
            { tag: 'PLI-ACC (₹18,100 Cr)', status: 'active', detail: '50 GWh ACC cells' },
            { tag: 'SECI BESS Tender FDRE/StandAlone', status: 'active' },
            { tag: 'CERC Ancillary Services Regs 2015/24', status: 'active' },
            { tag: 'CEA Net Metering BESS', status: 'active' },
            { tag: 'VGF for Standalone BESS', status: 'active', detail: '₹3,760 Cr allocation' },
            { tag: 'GST on BESS (18% → 12% proposal)', status: 'partial' },
          ],
          kpis: [
            { label: 'India BESS target 2030', value: '74 GWh' },
            { label: 'SECI Standalone cleared', value: '4 GWh', detail: 'FY25 cumul' },
            { label: 'Avg cleared tariff', value: '₹3.84 lakh/MW/month', detail: 'Capacity charge' },
            { label: 'VGF (per MWh)', value: 'Up to ₹27 lakh' },
          ],
          peers: { title: 'INDIAN BESS PROJECT COMPS',
            cols: [{ k: 'proj', label: 'Project' }, { k: 'mwh', label: 'MWh' }, { k: 'owner', label: 'Owner' }, { k: 'tariff', label: 'Tariff (₹L/MW-mth)' }, { k: 'cod', label: 'COD' }],
            rows: [
              { proj: 'SECI SA-BESS Tr-I (Rajasthan)', mwh: '500', owner: 'JSW Neo', tariff: '4.49', cod: '2026' },
              { proj: 'SECI SA-BESS Tr-II (Gujarat)', mwh: '1,000', owner: 'GMR+Reliance', tariff: '4.22', cod: '2026' },
              { proj: 'SJVN FDRE Punjab', mwh: '1,500', owner: 'SJVN', tariff: '4.38', cod: '2027' },
              { proj: 'NTPC Solar+BESS Kutch', mwh: '600', owner: 'NTPC', tariff: '3.95', cod: '2026' },
              { proj: 'Adani Khavda FDRE', mwh: '3,000', owner: 'Adani Green', tariff: '4.14', cod: '2026-27' },
              { proj: 'Tata Power Aravalli BESS', mwh: '500', owner: 'Tata Power', tariff: '4.05', cod: '2026' },
            ] },
          notes: 'India BESS finance is shifting from 2-hr frequency response to 4-hr capacity-pricing auctions (SECI SA-BESS, MSEDCL, GUVNL). Cleared tariffs of ₹3.8–4.5 L/MW/month imply project IRR of 11–13% with VGF support. PLI-ACC targets 50 GWh domestic cell capacity by 2030.',
        }}
      />
    </div>
  );
}
