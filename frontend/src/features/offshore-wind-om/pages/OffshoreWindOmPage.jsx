import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ScatterChart, Scatter
} from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const T = {
  bg: '#FAFAF7', card: '#FFFFFF', border: '#E5E2D9',
  text: '#1A1A2E', sub: '#6B7280', accent: '#B8860B',
  indigo: '#4F46E5', green: '#065F46', red: '#991B1B',
  blue: '#1E40AF', amber: '#92400E', teal: '#0F766E', navy: '#0F172A'
};

const fmt = (v, d = 1) => (typeof v === 'number' && isFinite(v) ? v.toFixed(d) : '—');
const fmtM = v => (isFinite(v) ? `$${v.toFixed(1)}M` : '—');
const fmtPct = v => (isFinite(v) ? `${(v * 100).toFixed(1)}%` : '—');

// ── Turbine models ────────────────────────────────────────────────────────────
const TURBINE_MODELS = [
  { id: 'siemens_sg14', name: 'Siemens SG 14-236', mw: 14, failMult: 0.85 },
  { id: 'vestas_v236', name: 'Vestas V236-15.0', mw: 15, failMult: 0.90 },
  { id: 'ge_haliade', name: 'GE Haliade-X 13MW', mw: 13, failMult: 0.95 },
  { id: 'mhivesper', name: 'MHI Vestas V174-9.5', mw: 9.5, failMult: 1.05 },
  { id: 'nordex_n163', name: 'Nordex N163/5.X', mw: 5.5, failMult: 1.15 },
];

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const COMPONENTS = [
  { id: 'gearbox',     name: 'Gearbox',           baseRate: 0.08, mttr: 14, costK: 450, lifetime: 12 },
  { id: 'main_bearing',name: 'Main Bearing',       baseRate: 0.06, mttr: 10, costK: 180, lifetime: 15 },
  { id: 'generator',   name: 'Generator',          baseRate: 0.05, mttr: 8,  costK: 220, lifetime: 17 },
  { id: 'blades',      name: 'Rotor Blades',       baseRate: 0.04, mttr: 21, costK: 350, lifetime: 20 },
  { id: 'pitch',       name: 'Pitch System',       baseRate: 0.12, mttr: 3,  costK: 45,  lifetime: 10 },
  { id: 'yaw',         name: 'Yaw System',         baseRate: 0.07, mttr: 4,  costK: 35,  lifetime: 15 },
  { id: 'transformer', name: 'Transformer',        baseRate: 0.03, mttr: 12, costK: 300, lifetime: 20 },
  { id: 'power_elec',  name: 'Power Electronics',  baseRate: 0.15, mttr: 5,  costK: 80,  lifetime: 10 },
  { id: 'tower',       name: 'Tower/Foundation',   baseRate: 0.01, mttr: 30, costK: 600, lifetime: 25 },
  { id: 'scour',       name: 'Scour Protection',   baseRate: 0.02, mttr: 7,  costK: 50,  lifetime: 25 },
];

const BENCHMARKS = [
  { name: 'Hornsea 1',        avail: 96.2, opexKw: 68, lostPct: 2.1, techDays: 18 },
  { name: 'Gemini',           avail: 95.8, opexKw: 72, lostPct: 2.4, techDays: 21 },
  { name: 'Hollandse Kust',   avail: 97.1, opexKw: 61, lostPct: 1.8, techDays: 15 },
  { name: 'Vineyard Wind',    avail: 95.3, opexKw: 85, lostPct: 2.8, techDays: 24 },
  { name: 'Dogger Bank',      avail: 94.8, opexKw: 78, lostPct: 3.1, techDays: 26 },
  { name: 'East Anglia One',  avail: 96.5, opexKw: 65, lostPct: 2.0, techDays: 17 },
  { name: 'Borssele I+II',    avail: 97.3, opexKw: 58, lostPct: 1.6, techDays: 13 },
  { name: 'Revolution Wind',  avail: 94.5, opexKw: 88, lostPct: 3.4, techDays: 28 },
];

const OUTAGE_EVENTS = [
  { month: 'Feb', turbines: 4, days: 12, cause: 'Gearbox failure cluster', cost: 1.8 },
  { month: 'Apr', turbines: 2, days: 6,  cause: 'Blade erosion repair',    cost: 0.7 },
  { month: 'Jul', turbines: 1, days: 21, cause: 'Main bearing replacement', cost: 1.2 },
  { month: 'Sep', turbines: 3, days: 8,  cause: 'Power electronics fault',  cost: 0.9 },
  { month: 'Nov', turbines: 6, days: 14, cause: 'Storm weather lockout',    cost: 2.4 },
];

// ── Core calculation functions ────────────────────────────────────────────────
function calcAvailability(failureRatePerYr, mttrDays, weatherWindowPct, plannedMaintDays) {
  const techDowntime = failureRatePerYr * mttrDays / 365;
  const weatherDowntime = (1 - weatherWindowPct / 100) * 0.05;
  const planned = plannedMaintDays / 365;
  return Math.max(0, 1 - techDowntime - weatherDowntime - planned);
}

function calcOpex(nTurbines, mwEach, failureRate, mttrCostPerK, vesselDayRate, fixedCostPerKw) {
  const correctiveCost = nTurbines * failureRate * mttrCostPerK * 1000;
  const vesselCost = nTurbines * failureRate * mttrCostPerK * 0.3;
  const fixed = nTurbines * mwEach * 1000 * fixedCostPerKw;
  return (correctiveCost + vesselCost + fixed) / 1e6;
}

// ── Sub-components ────────────────────────────────────────────────────────────
const KpiCard = ({ label, value, unit, sub, color }) => (
  <div style={{
    background: T.card, border: `1px solid ${T.border}`, borderRadius: 8,
    padding: '16px 20px', borderTop: `3px solid ${color || T.accent}`
  }}>
    <div style={{ fontSize: 11, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: T.text, fontFamily: 'JetBrains Mono, monospace' }}>
      {value}<span style={{ fontSize: 13, fontWeight: 400, color: T.sub, marginLeft: 4 }}>{unit}</span>
    </div>
    {sub && <div style={{ fontSize: 11, color: T.sub, marginTop: 4 }}>{sub}</div>}
  </div>
);

const SideLabel = ({ children }) => (
  <div style={{ fontSize: 11, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5, marginTop: 14 }}>{children}</div>
);

const SliderRow = ({ label, value, min, max, step, unit, onChange }) => (
  <div style={{ marginBottom: 10 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
      <span style={{ fontSize: 12, color: T.sub }}>{label}</span>
      <span style={{ fontSize: 12, color: T.text, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>{value}{unit}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value}
      onChange={e => onChange(Number(e.target.value))}
      style={{ width: '100%', accentColor: T.indigo, cursor: 'pointer' }} />
  </div>
);

const SelectRow = ({ label, value, options, onChange }) => (
  <div style={{ marginBottom: 10 }}>
    <div style={{ fontSize: 12, color: T.sub, marginBottom: 4 }}>{label}</div>
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ width: '100%', padding: '5px 8px', border: `1px solid ${T.border}`, borderRadius: 5, fontSize: 12, background: T.card, color: T.text }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

const ToggleRow = ({ label, value, onChange }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
    <span style={{ fontSize: 12, color: T.sub }}>{label}</span>
    <div onClick={() => onChange(!value)} style={{
      width: 38, height: 20, borderRadius: 10, background: value ? T.indigo : T.border,
      position: 'relative', cursor: 'pointer', transition: 'background 0.2s'
    }}>
      <div style={{
        position: 'absolute', top: 2, left: value ? 20 : 2, width: 16, height: 16,
        borderRadius: 8, background: '#fff', transition: 'left 0.2s'
      }} />
    </div>
  </div>
);

const SectionHeader = ({ title }) => (
  <div style={{
    fontSize: 10, fontWeight: 700, color: T.accent, textTransform: 'uppercase',
    letterSpacing: '0.1em', padding: '10px 0 5px', borderBottom: `1px solid ${T.border}`, marginBottom: 6
  }}>{title}</div>
);

const TAB_NAMES = [
  'Overview','Failure Rates','Maint. Cost','Weather Windows','Vessel Dispatch',
  'Availability','OPEX Breakdown','Remote Monitoring','Predictive Maint.',
  'Component Lifecycle','Spare Parts','Blade Erosion','Insurance',
  'Benchmarking','Digital Twin','OPEX Trajectory','Annual Perf.','Strategy Compare'
];

// ── Main Component ─────────────────────────────────────────────────────────────
export default function OffshoreWindOmPage() {
  // Fleet Parameters
  const [nTurbines, setNTurbines] = useState(80);
  const [turbineAge, setTurbineAge] = useState(5);
  const [ratedMw, setRatedMw] = useState(10);
  const [distPort, setDistPort] = useState(60);
  const [turbineModel, setTurbineModel] = useState('siemens_sg14');

  // Maintenance Strategy
  const [strategy, setStrategy] = useState('preventive');
  const [inspInterval, setInspInterval] = useState('quarterly');
  const [remoteMonitor, setRemoteMonitor] = useState(true);
  const [accessHs, setAccessHs] = useState(2.0);

  // Vessel Fleet
  const [vesselType, setVesselType] = useState('CTV');
  const [dayRate, setDayRate] = useState(10);
  const [fleetSize, setFleetSize] = useState(3);
  const [utilPct, setUtilPct] = useState(70);
  const [transitSpeed, setTransitSpeed] = useState(14);

  // Financial
  const [omBudgetPerKw, setOmBudgetPerKw] = useState(75);
  const [revPerMwh, setRevPerMwh] = useState(90);
  const [insuranceRate, setInsuranceRate] = useState(0.8);
  const [ltsa, setLtsa] = useState(true);

  const [activeTab, setActiveTab] = useState(0);

  const model = TURBINE_MODELS.find(m => m.id === turbineModel) || TURBINE_MODELS[0];

  // Derived calculations
  const derived = useMemo(() => {
    const ageFactor = 1 + turbineAge * 0.03;
    const stratFactor = strategy === 'corrective' ? 1.3 : strategy === 'preventive' ? 1.0 : 0.78;
    const baseFailRate = 0.35 * model.failMult * ageFactor * stratFactor;
    const avgMttr = 8.5;
    const weatherWindowPct = Math.max(40, 75 - (distPort - 30) * 0.2);
    const plannedMaintDays = inspInterval === 'monthly' ? 12 : inspInterval === 'quarterly' ? 6 : 3;

    const avail = calcAvailability(baseFailRate, avgMttr, weatherWindowPct, plannedMaintDays);
    const totalMw = nTurbines * ratedMw;
    const annualAep = totalMw * 8760 * avail * 0.42; // MWh, 42% capacity factor
    const lostAep = totalMw * 8760 * 0.42 * (1 - avail);
    const lostRevM = (lostAep * revPerMwh) / 1e6;

    const mttrCostPerK = 0.4; // simplified
    const vesselDayRateFull = dayRate * 1000;
    const fixedCostPerKw = ltsa ? 18 : 12;
    const opexM = calcOpex(nTurbines, ratedMw, baseFailRate, mttrCostPerK, vesselDayRateFull, fixedCostPerKw);
    const remoteMonitorCostM = remoteMonitor ? nTurbines * 8000 / 1e6 : 0;
    const insuranceCostM = (totalMw * 1000 * 1500 * insuranceRate) / (100 * 1e6);
    const totalOpexM = opexM + remoteMonitorCostM + insuranceCostM;
    const opexPerMwh = annualAep > 0 ? (totalOpexM * 1e6) / annualAep : 0;
    const techDaysPerTurbine = baseFailRate * avgMttr * 2.5;

    return {
      avail, baseFailRate, avgMttr, weatherWindowPct, lostRevM,
      totalOpexM, opexPerMwh, techDaysPerTurbine, totalMw, annualAep,
      opexM, remoteMonitorCostM, insuranceCostM, ageFactor
    };
  }, [nTurbines, turbineAge, ratedMw, distPort, turbineModel, strategy, inspInterval,
      remoteMonitor, accessHs, vesselType, dayRate, fleetSize, utilPct, transitSpeed,
      omBudgetPerKw, revPerMwh, insuranceRate, ltsa, model]);

  // ── Sidebar ───────────────────────────────────────────────────────────────
  const sidebar = (
    <div style={{
      width: 260, minWidth: 260, background: T.card, borderRight: `1px solid ${T.border}`,
      padding: '20px 16px', overflowY: 'auto', fontSize: 13
    }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 16, paddingBottom: 8, borderBottom: `2px solid ${T.accent}` }}>
        EP-DR5 — Offshore Wind O&M
      </div>

      <SectionHeader title="Fleet Parameters" />
      <SliderRow label="No. of Turbines" value={nTurbines} min={10} max={300} step={5} unit="" onChange={setNTurbines} />
      <SliderRow label="Turbine Age" value={turbineAge} min={0} max={20} step={1} unit=" yr" onChange={setTurbineAge} />
      <SliderRow label="Rated MW Each" value={ratedMw} min={3} max={20} step={0.5} unit=" MW" onChange={setRatedMw} />
      <SliderRow label="Distance to Port" value={distPort} min={10} max={200} step={5} unit=" km" onChange={setDistPort} />
      <SelectRow label="Turbine Model" value={turbineModel} onChange={setTurbineModel}
        options={TURBINE_MODELS.map(m => ({ value: m.id, label: m.name }))} />

      <SectionHeader title="Maintenance Strategy" />
      <SelectRow label="O&M Strategy" value={strategy} onChange={setStrategy}
        options={[
          { value: 'corrective', label: 'Corrective Only' },
          { value: 'preventive', label: 'Preventive + Corrective' },
          { value: 'predictive', label: 'Predictive / CBM' },
        ]} />
      <SelectRow label="Inspection Interval" value={inspInterval} onChange={setInspInterval}
        options={[
          { value: 'monthly', label: 'Monthly' },
          { value: 'quarterly', label: 'Quarterly' },
          { value: 'annual', label: 'Annual' },
        ]} />
      <ToggleRow label="Remote Monitoring (SCADA)" value={remoteMonitor} onChange={setRemoteMonitor} />
      <SliderRow label="Access Limit Hs" value={accessHs} min={1.5} max={3.0} step={0.1} unit=" m" onChange={setAccessHs} />

      <SectionHeader title="Vessel Fleet" />
      <SelectRow label="Primary Vessel Type" value={vesselType} onChange={setVesselType}
        options={[
          { value: 'CTV', label: 'CTV (Crew Transfer)' },
          { value: 'SOV', label: 'SOV (Service Operation)' },
          { value: 'HLV', label: 'HLV (Heavy Lift)' },
        ]} />
      <SliderRow label="Day Rate" value={dayRate} min={5} max={300} step={5} unit=" k$/day" onChange={setDayRate} />
      <SliderRow label="Fleet Size" value={fleetSize} min={1} max={8} step={1} unit="" onChange={setFleetSize} />
      <SliderRow label="Utilization" value={utilPct} min={20} max={95} step={5} unit="%" onChange={setUtilPct} />
      <SliderRow label="Transit Speed" value={transitSpeed} min={8} max={25} step={1} unit=" kts" onChange={setTransitSpeed} />

      <SectionHeader title="Financial" />
      <SliderRow label="O&M Budget" value={omBudgetPerKw} min={40} max={150} step={5} unit=" $/kW/yr" onChange={setOmBudgetPerKw} />
      <SliderRow label="Revenue" value={revPerMwh} min={50} max={180} step={5} unit=" $/MWh" onChange={setRevPerMwh} />
      <SliderRow label="Insurance Rate" value={insuranceRate} min={0.3} max={2.0} step={0.1} unit="%" onChange={setInsuranceRate} />
      <ToggleRow label="LTSA Active" value={ltsa} onChange={setLtsa} />
    </div>
  );

  // ── Quick Stats Bar ───────────────────────────────────────────────────────
  const statsBar = (
    <div style={{
      display: 'flex', gap: 0, background: T.navy, borderBottom: `1px solid ${T.border}`,
      padding: '0 24px'
    }}>
      {[
        { label: 'Fleet Availability', value: `${(derived.avail * 100).toFixed(1)}%`, color: '#4ADE80' },
        { label: 'Annual OPEX', value: `$${derived.totalOpexM.toFixed(1)}M`, color: T.accent },
        { label: 'Lost Revenue', value: `$${derived.lostRevM.toFixed(1)}M/yr`, color: '#F87171' },
        { label: 'OPEX/MWh', value: `$${derived.opexPerMwh.toFixed(1)}/MWh`, color: '#60A5FA' },
      ].map((s, i) => (
        <div key={i} style={{
          padding: '8px 20px', borderRight: i < 3 ? `1px solid rgba(255,255,255,0.1)` : 'none',
          display: 'flex', flexDirection: 'column'
        }}>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: s.color, fontFamily: 'JetBrains Mono, monospace' }}>{s.value}</span>
        </div>
      ))}
    </div>
  );

  // ── Tab bar ───────────────────────────────────────────────────────────────
  const tabBar = (
    <div style={{ display: 'flex', overflowX: 'auto', borderBottom: `1px solid ${T.border}`, background: T.card, padding: '0 24px' }}>
      {TAB_NAMES.map((name, i) => (
        <button key={i} onClick={() => setActiveTab(i)} style={{
          padding: '10px 14px', fontSize: 12, fontWeight: activeTab === i ? 700 : 400,
          color: activeTab === i ? T.indigo : T.sub,
          borderBottom: activeTab === i ? `2px solid ${T.indigo}` : '2px solid transparent',
          background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
          marginBottom: -1
        }}>{name}</button>
      ))}
    </div>
  );

  // ── Tab content renderers ─────────────────────────────────────────────────
  const renderOverview = () => {
    const availTrend = Array.from({ length: 10 }, (_, i) => {
      const age = turbineAge + i;
      const ageFactor = 1 + age * 0.03;
      const stratFactor = strategy === 'corrective' ? 1.3 : strategy === 'preventive' ? 1.0 : 0.78;
      const fr = 0.35 * model.failMult * ageFactor * stratFactor;
      const av = calcAvailability(fr, 8.5, derived.weatherWindowPct, 6);
      return { year: `Yr ${i + 1}`, availability: +(av * 100).toFixed(2), target: 95 };
    });
    const donutData = [
      { name: 'Corrective', value: +(derived.opexM * 0.42).toFixed(2), color: T.red },
      { name: 'Preventive', value: +(derived.opexM * 0.22).toFixed(2), color: T.indigo },
      { name: 'Vessels', value: +(derived.opexM * 0.18).toFixed(2), color: T.blue },
      { name: 'Monitoring', value: +(derived.remoteMonitorCostM).toFixed(2), color: T.teal },
      { name: 'Insurance', value: +(derived.insuranceCostM).toFixed(2), color: T.amber },
      { name: 'Overhead', value: +(derived.opexM * 0.08).toFixed(2), color: T.sub },
    ];
    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
          <KpiCard label="Fleet Availability" value={`${(derived.avail * 100).toFixed(1)}`} unit="%" sub={`Weather window: ${derived.weatherWindowPct.toFixed(0)}%`} color={T.green} />
          <KpiCard label="Annual OPEX" value={`${derived.totalOpexM.toFixed(1)}`} unit="$M" sub={`$${(derived.totalOpexM * 1e6 / (nTurbines * ratedMw * 1000)).toFixed(0)}/kW/yr`} color={T.accent} />
          <KpiCard label="Lost Revenue" value={`${derived.lostRevM.toFixed(1)}`} unit="$M/yr" sub={`At $${revPerMwh}/MWh`} color={T.red} />
          <KpiCard label="Avg MTBF" value={`${(8760 / Math.max(0.01, derived.baseFailRate)).toFixed(0)}`} unit="hrs" sub={`${derived.baseFailRate.toFixed(2)} failures/turbine/yr`} color={T.indigo} />
          <KpiCard label="Technician Days" value={`${derived.techDaysPerTurbine.toFixed(1)}`} unit="days/turbine/yr" sub={`${(derived.techDaysPerTurbine * nTurbines).toFixed(0)} total fleet days`} color={T.teal} />
          <KpiCard label="OPEX/MWh" value={`${derived.opexPerMwh.toFixed(1)}`} unit="$/MWh" sub={`AEP: ${(derived.annualAep / 1e6).toFixed(1)} TWh/yr`} color={T.blue} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>Fleet Availability Trend (10-Year)</div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={availTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis domain={[85, 100]} tick={{ fontSize: 11 }} unit="%" />
                <Tooltip formatter={v => `${v}%`} />
                <Legend />
                <Line type="monotone" dataKey="availability" stroke={T.indigo} strokeWidth={2} dot={false} name="Projected Avail." />
                <Line type="monotone" dataKey="target" stroke={T.green} strokeWidth={1} strokeDasharray="4 4" dot={false} name="95% Target" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>OPEX Breakdown</div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={donutData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value">
                  {donutData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip formatter={v => `$${v}M`} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 4 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 10, borderBottom: `1px solid ${T.border}`, paddingBottom: 8 }}>Fleet Summary</div>
            {[
              { label: 'Total Rated Capacity', value: `${(nTurbines * ratedMw).toFixed(0)} MW` },
              { label: 'Annual Energy Production', value: `${(derived.annualAep / 1000).toFixed(0)} GWh` },
              { label: 'Net Capacity Factor', value: `${(derived.avail * 42).toFixed(1)}%` },
              { label: 'Weather Window', value: `${derived.weatherWindowPct.toFixed(0)}% accessible days` },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: i < 3 ? `1px solid ${T.border}` : 'none', fontSize: 12 }}>
                <span style={{ color: T.sub }}>{item.label}</span>
                <span style={{ color: T.text, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>{item.value}</span>
              </div>
            ))}
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 10, borderBottom: `1px solid ${T.border}`, paddingBottom: 8 }}>O&M Strategy</div>
            {[
              { label: 'Current Strategy', value: strategy === 'corrective' ? 'Corrective Only' : strategy === 'preventive' ? 'Preventive' : 'Predictive CBM' },
              { label: 'LTSA Status', value: ltsa ? 'Active' : 'Inactive' },
              { label: 'Remote Monitoring', value: remoteMonitor ? 'Enabled' : 'Disabled' },
              { label: 'Primary Vessel', value: vesselType },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: i < 3 ? `1px solid ${T.border}` : 'none', fontSize: 12 }}>
                <span style={{ color: T.sub }}>{item.label}</span>
                <span style={{ color: T.text, fontWeight: 600 }}>{item.value}</span>
              </div>
            ))}
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 10, borderBottom: `1px solid ${T.border}`, paddingBottom: 8 }}>Financial Summary</div>
            {[
              { label: 'Revenue (est. annual)', value: `$${((derived.annualAep * revPerMwh) / 1e6).toFixed(1)}M` },
              { label: 'OPEX Ratio', value: `${((derived.totalOpexM / Math.max(0.01, (derived.annualAep * revPerMwh) / 1e6)) * 100).toFixed(0)}% of revenue` },
              { label: 'Lost Revenue', value: `$${derived.lostRevM.toFixed(1)}M/yr` },
              { label: 'OPEX/MWh', value: `$${derived.opexPerMwh.toFixed(1)}/MWh` },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: i < 3 ? `1px solid ${T.border}` : 'none', fontSize: 12 }}>
                <span style={{ color: T.sub }}>{item.label}</span>
                <span style={{ color: T.text, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderFailureRates = () => {
    const rows = COMPONENTS.map((c, i) => {
      const adj = c.baseRate * model.failMult * derived.ageFactor;
      const annCostKw = ratedMw > 0 ? (adj * c.costK * 1000) / (ratedMw * 1000) : 0;
      const expectedFailures = nTurbines * adj;
      return { ...c, adj: +adj.toFixed(3), annCostKw: +annCostKw.toFixed(2), expectedFailures: +expectedFailures.toFixed(1) };
    });
    const totalAnnCost = rows.reduce((s, r) => s + r.annCostKw * ratedMw * 1000 * nTurbines / 1e6, 0);
    const highestRisk = [...rows].sort((a, b) => b.adj - a.adj)[0];
    const mttrData = rows.map(r => ({ name: r.name, mttr: r.mttr, cost: r.costK }));
    const bathtubCurve = Array.from({ length: 25 }, (_, i) => {
      const infantMort = i < 3 ? Math.max(0, (3 - i) * 0.05) : 0;
      const wearout = i > 12 ? (i - 12) * 0.04 : 0;
      const base = derived.baseFailRate;
      return { year: i + 1, rate: +(base + infantMort + wearout).toFixed(3) };
    });
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <KpiCard label="Total Annual Failures" value={`${rows.reduce((s, r) => s + r.expectedFailures, 0).toFixed(0)}`} unit="" sub={`Across ${nTurbines} turbines`} color={T.red} />
          <KpiCard label="Highest Risk Component" value={highestRisk ? highestRisk.name : '—'} unit="" sub={highestRisk ? `${highestRisk.adj.toFixed(3)}/turbine/yr` : ''} color={T.amber} />
          <KpiCard label="Total Corrective Cost" value={`$${totalAnnCost.toFixed(2)}M`} unit="/yr" sub="All component failures" color={T.indigo} />
          <KpiCard label="Turbine Model Mult." value={`${model.failMult}x`} unit="" sub={`vs baseline (${model.name})`} color={T.teal} />
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>Component Failure Rate Database — {model.name} (Age: {turbineAge} yr)</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.bg }}>
                {['Component','Fail Rate/Turbine/yr','Exp. Fleet Failures/yr','MTTR (days)','Cost/Failure ($k)','Ann. Cost ($/kW)','Risk Level'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: T.sub, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.card : T.bg }}>
                  <td style={{ padding: '8px 12px', fontWeight: 600, color: T.text }}>{r.name}</td>
                  <td style={{ padding: '8px 12px', color: r.adj > 0.1 ? T.red : r.adj > 0.05 ? T.amber : T.green, fontFamily: 'JetBrains Mono, monospace' }}>{r.adj.toFixed(3)}</td>
                  <td style={{ padding: '8px 12px', color: T.text, fontFamily: 'JetBrains Mono, monospace' }}>{r.expectedFailures}</td>
                  <td style={{ padding: '8px 12px', color: r.mttr > 14 ? T.red : T.text, fontFamily: 'JetBrains Mono, monospace' }}>{r.mttr}</td>
                  <td style={{ padding: '8px 12px', color: T.text, fontFamily: 'JetBrains Mono, monospace' }}>${r.costK}</td>
                  <td style={{ padding: '8px 12px', color: T.text, fontFamily: 'JetBrains Mono, monospace' }}>${r.annCostKw}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <span style={{ background: r.adj > 0.1 ? '#FEE2E2' : r.adj > 0.05 ? '#FEF3C7' : '#D1FAE5', color: r.adj > 0.1 ? T.red : r.adj > 0.05 ? T.amber : T.green, borderRadius: 4, padding: '2px 8px', fontSize: 10, fontWeight: 700 }}>
                      {r.adj > 0.1 ? 'HIGH' : r.adj > 0.05 ? 'MEDIUM' : 'LOW'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>Failure Rate by Component (per turbine/yr)</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={rows} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" width={130} tick={{ fontSize: 10 }} />
                <Tooltip formatter={v => v.toFixed(3)} />
                <Bar dataKey="adj" name="Failure Rate" radius={[0, 3, 3, 0]}>
                  {rows.map((r, i) => <Cell key={i} fill={r.adj > 0.1 ? T.red : r.adj > 0.05 ? T.amber : T.indigo} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>Bathtub Curve — Fleet Failure Rate vs Age</div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={bathtubCurve}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" label={{ value: 'Fleet Age (yr)', position: 'insideBottom', offset: -2, fontSize: 10 }} tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} label={{ value: 'Failures/turbine/yr', angle: -90, position: 'insideLeft', fontSize: 9, offset: 15 }} />
                <Tooltip formatter={v => v.toFixed(3)} />
                <Line type="monotone" dataKey="rate" stroke={T.red} strokeWidth={2} dot={false} name="Fleet Failure Rate" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  const renderMaintCost = () => {
    const waterfall = [
      { name: 'Major Corrective', val: +(derived.opexM * 0.28).toFixed(2), color: T.red },
      { name: 'Minor Corrective', val: +(derived.opexM * 0.14).toFixed(2), color: '#F97316' },
      { name: 'Preventive', val: +(derived.opexM * 0.22).toFixed(2), color: T.indigo },
      { name: 'Remote Monitoring', val: +derived.remoteMonitorCostM.toFixed(2), color: T.teal },
      { name: 'Vessel Charter', val: +(derived.opexM * 0.12).toFixed(2), color: T.blue },
      { name: 'Port Costs', val: +(derived.opexM * 0.06).toFixed(2), color: T.amber },
      { name: 'Insurance', val: +derived.insuranceCostM.toFixed(2), color: '#9333EA' },
      { name: 'Overhead', val: +(derived.opexM * 0.08).toFixed(2), color: T.sub },
    ];
    const ageCurve = Array.from({ length: 21 }, (_, i) => {
      const af = 1 + i * 0.03;
      const sf = strategy === 'corrective' ? 1.3 : strategy === 'preventive' ? 1.0 : 0.78;
      const fr = 0.35 * model.failMult * af * sf;
      const op = calcOpex(nTurbines, ratedMw, fr, 0.4, dayRate * 1000, 18);
      const opPerKw = nTurbines * ratedMw > 0 ? (op * 1e6) / (nTurbines * ratedMw * 1000) : 0;
      return { age: i, opexM: +op.toFixed(2), opexPerKw: +opPerKw.toFixed(1) };
    });
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>OPEX Waterfall ($M)</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={waterfall}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 11 }} unit="$M" />
              <Tooltip formatter={v => `$${v}M`} />
              {waterfall.map((d, i) => null)}
              <Bar dataKey="val" name="OPEX ($M)" radius={[4, 4, 0, 0]}>
                {waterfall.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>OPEX vs Fleet Age</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={ageCurve}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="age" label={{ value: 'Age (yr)', position: 'insideBottom', offset: -2, fontSize: 11 }} tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} unit="$M" />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} unit="$/kW" />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="opexM" stroke={T.indigo} dot={false} name="OPEX ($M)" strokeWidth={2} />
              <Line yAxisId="right" type="monotone" dataKey="opexPerKw" stroke={T.accent} dot={false} name="OPEX ($/kW)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderWeatherWindow = () => {
    const seasonalPcts = [0.7, 0.72, 0.78, 0.85, 0.88, 0.82, 0.80, 0.79, 0.76, 0.72, 0.68, 0.65];
    const monthlyAccess = MONTHS.map((m, i) => {
      const seasonal = seasonalPcts[i];
      const ctvAccess = seasonal * (accessHs >= 1.5 ? 1.0 : 0.85);
      const sovAccess = seasonal * (accessHs >= 2.5 ? 1.0 : 0.92);
      const heliAccess = Math.min(0.95, seasonal + 0.1);
      return {
        month: m, ctv: +(ctvAccess * 100).toFixed(1),
        sov: +(sovAccess * 100).toFixed(1), heli: +(heliAccess * 100).toFixed(1)
      };
    });
    const annualAvgAccess = seasonalPcts.reduce((s, v) => s + v, 0) / Math.max(1, seasonalPcts.length);
    const optimalWindows = monthlyAccess.filter(m => m.ctv > 80).map(m => m.month).join(', ');
    const weatherDelayCostM = (MONTHS.length * (1 - annualAvgAccess) * 10 * dayRate * 1000) / 1e6;
    const delays = [
      { season: 'Q1 (Jan-Mar)', avgDelay: 18, costPerDay: dayRate, campaignWindow: 42 },
      { season: 'Q2 (Apr-Jun)', avgDelay: 6, costPerDay: dayRate, campaignWindow: 68 },
      { season: 'Q3 (Jul-Sep)', avgDelay: 8, costPerDay: dayRate, campaignWindow: 64 },
      { season: 'Q4 (Oct-Dec)', avgDelay: 22, costPerDay: dayRate, campaignWindow: 38 },
    ];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <KpiCard label="Annual Avg Access" value={`${(annualAvgAccess * 100).toFixed(0)}`} unit="% of days" sub={`CTV Hs limit: ${accessHs}m`} color={T.indigo} />
          <KpiCard label="Optimal Months" value={optimalWindows || 'N/A'} unit="" sub="CTV access > 80% days" color={T.green} />
          <KpiCard label="Weather Delay Cost" value={`$${weatherDelayCostM.toFixed(2)}M`} unit="/yr" sub="Vessel idle + remobilization" color={T.amber} />
          <KpiCard label="SOV vs CTV Uplift" value={`+${(monthlyAccess.reduce((s, m) => s + m.sov - m.ctv, 0) / Math.max(1, monthlyAccess.length)).toFixed(1)}`} unit="% access days" sub="SOV advantage in winter" color={T.teal} />
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>Monthly Access Window by Vessel Type (% of days Hs &lt; threshold)</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyAccess}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis domain={[50, 100]} tick={{ fontSize: 11 }} unit="%" />
              <Tooltip formatter={v => `${v}%`} />
              <Legend />
              <Bar dataKey="ctv" name={`CTV (Hs<${accessHs}m)`} fill={T.indigo} />
              <Bar dataKey="sov" name="SOV (Hs<2.5m)" fill={T.teal} />
              <Bar dataKey="heli" name="Helicopter (wind<15m/s)" fill={T.accent} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>Seasonal Campaign Windows & Weather Delay Cost</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.bg }}>
                {['Season','Avg Delay (days)','Day Rate ($k)','Campaign Window (days)','Delay Cost ($k)','Recommendation'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: T.sub, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {delays.map((d, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.card : T.bg }}>
                  <td style={{ padding: '8px 12px', fontWeight: 600 }}>{d.season}</td>
                  <td style={{ padding: '8px 12px', color: d.avgDelay > 15 ? T.red : T.green, fontFamily: 'JetBrains Mono, monospace' }}>{d.avgDelay}</td>
                  <td style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace' }}>${d.costPerDay}</td>
                  <td style={{ padding: '8px 12px', color: T.green, fontFamily: 'JetBrains Mono, monospace' }}>{d.campaignWindow}</td>
                  <td style={{ padding: '8px 12px', color: T.amber, fontFamily: 'JetBrains Mono, monospace' }}>${(d.avgDelay * d.costPerDay).toFixed(0)}</td>
                  <td style={{ padding: '8px 12px', fontSize: 11, color: T.sub }}>{d.campaignWindow > 60 ? 'Major campaign OK' : d.campaignWindow > 45 ? 'Minor repairs only' : 'Emergency access only'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderVesselDispatch = () => {
    const vesselData = MONTHS.map((m, i) => {
      const seasonal = [0.55, 0.60, 0.72, 0.82, 0.88, 0.85, 0.83, 0.81, 0.76, 0.65, 0.58, 0.52][i];
      return {
        month: m,
        ctv: Math.round(28 * seasonal * (utilPct / 100)),
        sov: Math.round(15 * seasonal * (utilPct / 100)),
        hlv: Math.round(3 * (i % 3 === 1 ? 1 : 0.3)),
      };
    });
    const matrix = [
      { dist: '< 30 km',  lowHs: 'CTV', highHs: 'CTV/SOV' },
      { dist: '30-60 km', lowHs: 'CTV/SOV', highHs: 'SOV' },
      { dist: '60-100 km',lowHs: 'SOV', highHs: 'SOV' },
      { dist: '> 100 km', lowHs: 'SOV', highHs: 'SOV/Helicopter' },
    ];
    const annualVesselCost = (fleetSize * dayRate * 365 * utilPct / 100) / 1000;
    const pooledSaving = annualVesselCost * 0.22;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 4 }}>
          <KpiCard label="Annual Vessel Cost" value={`$${annualVesselCost.toFixed(1)}M`} unit="" sub={`${fleetSize} vessel(s) × ${dayRate}k/day × ${utilPct}% util`} color={T.blue} />
          <KpiCard label="CTV Pooling Saving" value={`$${pooledSaving.toFixed(1)}M`} unit="" sub="Est. 22% saving via shared CTV" color={T.green} />
          <KpiCard label="Vessel Days/Turbine" value={`${((fleetSize * 365 * utilPct / 100) / Math.max(1, nTurbines)).toFixed(1)}`} unit="days" sub="Fleet days allocated per turbine" color={T.teal} />
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>12-Month Vessel Utilization (Days)</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={vesselData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="ctv" name="CTV Days" stackId="a" fill={T.indigo} />
              <Bar dataKey="sov" name="SOV Days" stackId="a" fill={T.teal} />
              <Bar dataKey="hlv" name="HLV Days" stackId="a" fill={T.red} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>Optimal Vessel Type Matrix</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.bg }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: `1px solid ${T.border}`, color: T.sub }}>Distance to Port</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: `1px solid ${T.border}`, color: T.sub }}>Low Hs (&lt;1.5m)</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: `1px solid ${T.border}`, color: T.sub }}>High Hs (1.5-3.0m)</th>
              </tr>
            </thead>
            <tbody>
              {matrix.map((r, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.card : T.bg }}>
                  <td style={{ padding: '8px 12px', fontWeight: 600 }}>{r.dist}</td>
                  <td style={{ padding: '8px 12px', color: T.green }}>{r.lowHs}</td>
                  <td style={{ padding: '8px 12px', color: T.blue }}>{r.highHs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderAvailability = () => {
    const sensData = Array.from({ length: 10 }, (_, i) => {
      const mtbfMult = 0.5 + i * 0.15;
      const fr = derived.baseFailRate / mtbfMult;
      const av = calcAvailability(fr, derived.avgMttr, derived.weatherWindowPct, 6);
      return { mtbfMult: +(mtbfMult).toFixed(2), avail: +(av * 100).toFixed(2) };
    });
    const mttrSens = Array.from({ length: 8 }, (_, i) => {
      const mttr = 3 + i * 3;
      const av = calcAvailability(derived.baseFailRate, mttr, derived.weatherWindowPct, 6);
      return { mttr, avail: +(av * 100).toFixed(2) };
    });
    const benchAvg = BENCHMARKS.reduce((s, b) => s + b.avail, 0) / Math.max(1, BENCHMARKS.length);
    const techDown = derived.baseFailRate * derived.avgMttr / 365;
    const wxDown = (1 - derived.weatherWindowPct / 100) * 0.05;
    const plannedDown = 6 / 365;
    const totalDown = techDown + wxDown + plannedDown;
    const downtimePie = [
      { name: 'Technical Downtime', value: +(techDown * 100).toFixed(2), color: T.red },
      { name: 'Weather Downtime', value: +(wxDown * 100).toFixed(2), color: T.amber },
      { name: 'Planned Maintenance', value: +(plannedDown * 100).toFixed(2), color: T.indigo },
      { name: 'Available', value: +(Math.max(0, 1 - totalDown) * 100).toFixed(2), color: T.green },
    ];
    const availByStrategy = [
      { name: 'Corrective', avail: +(calcAvailability(derived.baseFailRate * 1.3, derived.avgMttr, derived.weatherWindowPct, 2) * 100).toFixed(1) },
      { name: 'Preventive', avail: +(calcAvailability(derived.baseFailRate, derived.avgMttr, derived.weatherWindowPct, 6) * 100).toFixed(1) },
      { name: 'Predictive', avail: +(calcAvailability(derived.baseFailRate * 0.78, derived.avgMttr * 0.8, derived.weatherWindowPct, 4) * 100).toFixed(1) },
      { name: 'Digital O&M', avail: +(calcAvailability(derived.baseFailRate * 0.65, derived.avgMttr * 0.7, derived.weatherWindowPct, 3) * 100).toFixed(1) },
    ];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <KpiCard label="Technical Downtime" value={`${(techDown * 100).toFixed(1)}`} unit="%" color={T.red} />
          <KpiCard label="Weather Downtime" value={`${(wxDown * 100).toFixed(1)}`} unit="%" color={T.amber} />
          <KpiCard label="Planned Maint." value={`${(plannedDown * 100).toFixed(1)}`} unit="%" color={T.indigo} />
          <KpiCard label="Benchmark Avg Avail" value={`${benchAvg.toFixed(1)}`} unit="%" color={T.teal} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>Downtime Decomposition</div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={downtimePie} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${value}%`} labelLine={false}>
                  {downtimePie.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip formatter={v => `${v}%`} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>Availability by O&M Strategy (%)</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={availByStrategy}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis domain={[88, 100]} tick={{ fontSize: 10 }} unit="%" />
                <Tooltip formatter={v => `${v}%`} />
                <Bar dataKey="avail" name="Availability (%)" radius={[4, 4, 0, 0]}>
                  {availByStrategy.map((d, i) => <Cell key={i} fill={[T.red, T.indigo, T.teal, T.green][i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>Availability Sensitivity to MTBF Multiplier</div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={sensData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="mtbfMult" label={{ value: 'MTBF Multiplier', position: 'insideBottom', offset: -2, fontSize: 10 }} tick={{ fontSize: 10 }} />
                <YAxis domain={[85, 100]} tick={{ fontSize: 10 }} unit="%" />
                <Tooltip formatter={v => `${v}%`} />
                <Line type="monotone" dataKey="avail" stroke={T.indigo} strokeWidth={2} dot={false} name="Availability" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>Availability Sensitivity to MTTR (days)</div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={mttrSens}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="mttr" label={{ value: 'MTTR (days)', position: 'insideBottom', offset: -2, fontSize: 10 }} tick={{ fontSize: 10 }} />
                <YAxis domain={[85, 100]} tick={{ fontSize: 10 }} unit="%" />
                <Tooltip formatter={v => `${v}%`} />
                <Line type="monotone" dataKey="avail" stroke={T.teal} strokeWidth={2} dot={false} name="Availability" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 10 }}>Availability Model Assumptions</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { label: 'Failure Rate/Turbine/yr', value: derived.baseFailRate.toFixed(3) },
              { label: 'Mean Time to Repair', value: `${derived.avgMttr} days` },
              { label: 'Weather Window', value: `${derived.weatherWindowPct.toFixed(0)}%` },
              { label: 'MTBF (calculated)', value: `${(8760 / Math.max(0.001, derived.baseFailRate)).toFixed(0)} hrs` },
              { label: 'Planned Maint. (yr)', value: `${inspInterval === 'monthly' ? 12 : inspInterval === 'quarterly' ? 6 : 3} days` },
              { label: 'Fleet Avail. vs P50', value: `${derived.avail > 0.95 ? 'Above' : 'Below'} P50 (95%)` },
            ].map((item, i) => (
              <div key={i} style={{ background: T.bg, borderRadius: 6, padding: '8px 12px' }}>
                <div style={{ fontSize: 10, color: T.sub, marginBottom: 3 }}>{item.label}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text, fontFamily: 'JetBrains Mono, monospace' }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderOpexBreakdown = () => {
    const yearData = Array.from({ length: 10 }, (_, i) => {
      const af = 1 + (turbineAge + i) * 0.03;
      const sf = strategy === 'corrective' ? 1.3 : strategy === 'preventive' ? 1.0 : 0.78;
      const fr = 0.35 * model.failMult * af * sf;
      const op = calcOpex(nTurbines, ratedMw, fr, 0.4, dayRate * 1000, ltsa ? 18 : 12);
      const infl = Math.pow(1.025, i);
      return {
        year: `Y${i + 1}`,
        fixed: +(op * 0.4 * infl).toFixed(2),
        variable: +(op * 0.6 * infl).toFixed(2),
        perMwh: derived.annualAep > 0 ? +((op * infl * 1e6) / derived.annualAep).toFixed(2) : 0
      };
    });
    const costDrivers = [
      { category: 'LTSA / O&M Contract', pct: ltsa ? 22 : 8, trend: 'Stable', driver: 'Contractual' },
      { category: 'Corrective Maintenance', pct: Math.round(derived.baseFailRate * 35), trend: 'Rising with age', driver: 'Failure rate' },
      { category: 'Vessel & Logistics', pct: Math.round(12 + distPort * 0.05), trend: 'Distance-driven', driver: 'Transit time' },
      { category: 'Remote Monitoring', pct: remoteMonitor ? 7 : 0, trend: 'Fixed', driver: 'SCADA license' },
      { category: 'Blade Maintenance', pct: 9, trend: 'Erosion-driven', driver: 'Tip speed & rainfall' },
      { category: 'Insurance', pct: Math.round(insuranceRate * 4), trend: 'Stable', driver: 'Asset value' },
      { category: 'Port & Mobilization', pct: 5, trend: 'Fixed', driver: 'Site geography' },
    ];
    const totalOpexPerKw = derived.totalMw > 0 ? (derived.totalOpexM * 1e6) / (derived.totalMw * 1000) : 0;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <KpiCard label="Total OPEX/kW/yr" value={`$${totalOpexPerKw.toFixed(0)}`} unit="$/kW" sub="vs benchmark $65-90/kW" color={T.indigo} />
          <KpiCard label="Fixed Cost Share" value="40" unit="%" sub="LTSA + port + monitoring" color={T.teal} />
          <KpiCard label="Variable Cost Share" value="60" unit="%" sub="Corrective + vessels" color={T.red} />
          <KpiCard label="LTSA Saving" value={ltsa ? '$2.1M' : 'N/A'} unit="" sub={ltsa ? 'vs ad-hoc corrective' : 'Enable LTSA for savings'} color={T.green} />
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>Fixed vs Variable OPEX (Inflation-Adjusted, $M)</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={yearData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} unit="$M" />
              <Tooltip formatter={v => `$${v}M`} />
              <Legend />
              <Bar dataKey="fixed" name="Fixed (LTSA, Port, SCADA)" stackId="a" fill={T.indigo} />
              <Bar dataKey="variable" name="Variable (Corrective, HLV)" stackId="a" fill={T.red} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>OPEX per MWh Produced ($/MWh)</div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={yearData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} unit="$/MWh" />
              <Tooltip formatter={v => `$${v}/MWh`} />
              <Line type="monotone" dataKey="perMwh" stroke={T.accent} strokeWidth={2} dot={false} name="OPEX/MWh" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>OPEX Cost Driver Analysis</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.bg }}>
                {['Category','Share (%)','Trend','Primary Driver'].map(h => (
                  <th key={h} style={{ padding: '7px 12px', textAlign: 'left', color: T.sub, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {costDrivers.map((d, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.card : T.bg }}>
                  <td style={{ padding: '7px 12px', fontWeight: 600 }}>{d.category}</td>
                  <td style={{ padding: '7px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: d.pct * 3, height: 8, background: T.indigo, borderRadius: 3, minWidth: 4 }} />
                      <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{d.pct}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '7px 12px', color: d.trend.includes('Rising') ? T.red : T.sub }}>{d.trend}</td>
                  <td style={{ padding: '7px 12px', color: T.sub }}>{d.driver}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderRemoteMonitoring = () => {
    const kpis = ['Power Output (kW)','Rotor Speed (rpm)','Blade Pitch (°)','Nacelle Temp (°C)','Vibration (mm/s)','Gearbox Oil Temp (°C)'];
    const alerts = [
      { id: 'A-001', component: 'Gearbox', signal: 'Oil Temp > 80°C', severity: 'HIGH', lead: '14 days' },
      { id: 'A-002', component: 'Main Bearing', signal: 'Vibration RMS > 4.5mm/s', severity: 'MEDIUM', lead: '21 days' },
      { id: 'A-003', component: 'Power Electronics', signal: 'IGBT Temp > 85°C', severity: 'HIGH', lead: '7 days' },
      { id: 'A-004', component: 'Pitch System', signal: 'Pitch Error > 2°', severity: 'LOW', lead: '45 days' },
    ];
    const comparison = [
      { approach: 'Reactive', leadTime: 0, downtime: 21, cost: 450 },
      { approach: 'Rule-Based Alerts', leadTime: 7, downtime: 12, cost: 280 },
      { approach: 'ML Anomaly Detection', leadTime: 21, downtime: 6, cost: 180 },
      { approach: 'Digital Twin', leadTime: 35, downtime: 3, cost: 120 },
    ];
    const monitorCostM = derived.remoteMonitorCostM;
    const avoidedDowntimeValue = remoteMonitor ? (derived.lostRevM * 0.35) : 0;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <KpiCard label="Monitoring System Cost" value={`$${monitorCostM.toFixed(2)}M`} unit="" sub={`$${(nTurbines > 0 ? monitorCostM * 1e6 / nTurbines : 0).toFixed(0)}/turbine/yr`} color={T.teal} />
          <KpiCard label="Est. Avoided Downtime Value" value={`$${avoidedDowntimeValue.toFixed(2)}M`} unit="" sub="~35% downtime reduction vs reactive" color={T.green} />
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>SCADA KPIs Tracked Per Turbine</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {kpis.map(k => (
              <div key={k} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, padding: '6px 12px', fontSize: 12, color: T.text }}>{k}</div>
            ))}
          </div>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>Active Anomaly Alerts</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.bg }}>
                {['Alert ID','Component','Signal','Severity','Predicted Lead'].map(h => (
                  <th key={h} style={{ padding: '7px 12px', textAlign: 'left', color: T.sub, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {alerts.map((a, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '7px 12px', fontFamily: 'JetBrains Mono, monospace', color: T.indigo }}>{a.id}</td>
                  <td style={{ padding: '7px 12px', fontWeight: 600 }}>{a.component}</td>
                  <td style={{ padding: '7px 12px', color: T.sub }}>{a.signal}</td>
                  <td style={{ padding: '7px 12px' }}>
                    <span style={{ background: a.severity === 'HIGH' ? '#FEE2E2' : a.severity === 'MEDIUM' ? '#FEF3C7' : '#D1FAE5', color: a.severity === 'HIGH' ? T.red : a.severity === 'MEDIUM' ? T.amber : T.green, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{a.severity}</span>
                  </td>
                  <td style={{ padding: '7px 12px', color: T.teal }}>{a.lead}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>Monitoring Approach Comparison: Downtime vs Cost per Failure ($k)</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={comparison} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis dataKey="approach" type="category" width={140} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="downtime" name="Avg Downtime (days)" fill={T.red} />
              <Bar dataKey="cost" name="Cost/Failure ($k)" fill={T.indigo} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>SCADA Data Volume & Connectivity Metrics</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              { label: 'Data Points / Turbine', value: '156 / 10min', note: 'Per IEC 61400-25' },
              { label: 'Annual Data Volume', value: `${(nTurbines * 156 * 6 * 24 * 365 / 1e9).toFixed(2)} GB`, note: 'Uncompressed' },
              { label: 'Uptime Target', value: '99.5%', note: 'SCADA system SLA' },
              { label: 'Latency Requirement', value: '< 5s', note: 'Real-time alerting' },
            ].map((item, i) => (
              <div key={i} style={{ background: T.bg, borderRadius: 6, padding: '10px 14px' }}>
                <div style={{ fontSize: 10, color: T.sub, marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text, fontFamily: 'JetBrains Mono, monospace' }}>{item.value}</div>
                <div style={{ fontSize: 10, color: T.sub, marginTop: 3 }}>{item.note}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderPredictive = () => {
    const methods = [
      { name: 'CMS Vibration', component: 'Drivetrain', uplift: 1.2, falseAlarm: 8, costKw: 4.5, maturity: 'Commercial', leadDays: 21 },
      { name: 'Oil Particle Count', component: 'Gearbox', uplift: 0.8, falseAlarm: 5, costKw: 2.1, maturity: 'Commercial', leadDays: 14 },
      { name: 'Thermal Imaging', component: 'Power Electronics', uplift: 0.6, falseAlarm: 12, costKw: 1.8, maturity: 'Commercial', leadDays: 7 },
      { name: 'Drone Inspection', component: 'Blades', uplift: 1.0, falseAlarm: 3, costKw: 3.2, maturity: 'Commercial', leadDays: 30 },
      { name: 'Acoustic Emission', component: 'Bearings', uplift: 0.5, falseAlarm: 15, costKw: 2.8, maturity: 'Emerging', leadDays: 28 },
      { name: 'Structural Health Mon.', component: 'Tower/Foundation', uplift: 0.3, falseAlarm: 6, costKw: 1.5, maturity: 'Emerging', leadDays: 45 },
    ];
    const totalUplift = methods.reduce((s, m) => s + m.uplift, 0);
    const implCostM = (nTurbines * methods.reduce((s, m) => s + m.costKw, 0) * ratedMw * 1000) / 1e6;
    const annualBenefitM = derived.lostRevM > 0 ? derived.lostRevM * (totalUplift / 100) : 0;
    const payback = annualBenefitM > 0 ? implCostM / annualBenefitM : 0;
    const npv10 = annualBenefitM * 8.53 - implCostM;
    const cbmVsTimeBased = [
      { year: 'Y1', cbm: 0 - implCostM * 0.5, timeBased: 0 },
      { year: 'Y2', cbm: annualBenefitM * 1 - implCostM * 0.5, timeBased: 0 },
      { year: 'Y3', cbm: annualBenefitM * 2.1, timeBased: 0 },
      { year: 'Y5', cbm: annualBenefitM * 4.3, timeBased: 0 },
      { year: 'Y7', cbm: annualBenefitM * 6.5, timeBased: 0 },
      { year: 'Y10', cbm: annualBenefitM * 9.4, timeBased: 0 },
    ].map(d => ({ ...d, cbm: +d.cbm.toFixed(2) }));
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <KpiCard label="Total Avail. Uplift" value={`+${totalUplift.toFixed(1)}`} unit="%" sub="All CBM methods combined" color={T.green} />
          <KpiCard label="Implementation Cost" value={`$${implCostM.toFixed(2)}M`} unit="" sub={`$${(nTurbines * ratedMw > 0 ? implCostM * 1e6 / (nTurbines * ratedMw * 1000) : 0).toFixed(1)}/kW`} color={T.indigo} />
          <KpiCard label="Simple Payback" value={`${payback.toFixed(1)}`} unit="yr" sub={`Annual benefit: $${annualBenefitM.toFixed(2)}M`} color={T.accent} />
          <KpiCard label="10-yr NPV" value={`$${npv10.toFixed(1)}M`} unit="" sub={npv10 > 0 ? 'Positive — recommended' : 'Review threshold'} color={npv10 > 0 ? T.green : T.red} />
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>CBM Technologies — Full Assessment</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.bg }}>
                {['Method','Target Component','Avail. Uplift','False Alarm Rate','Cost ($/kW)','Predictive Lead','Maturity'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: T.sub, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {methods.map((m, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.card : T.bg }}>
                  <td style={{ padding: '8px 12px', fontWeight: 600 }}>{m.name}</td>
                  <td style={{ padding: '8px 12px', color: T.sub }}>{m.component}</td>
                  <td style={{ padding: '8px 12px', color: T.green, fontFamily: 'JetBrains Mono, monospace' }}>+{m.uplift}%</td>
                  <td style={{ padding: '8px 12px', color: m.falseAlarm > 10 ? T.red : T.amber, fontFamily: 'JetBrains Mono, monospace' }}>{m.falseAlarm}%</td>
                  <td style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace' }}>${m.costKw}</td>
                  <td style={{ padding: '8px 12px', color: T.teal, fontFamily: 'JetBrains Mono, monospace' }}>{m.leadDays}d</td>
                  <td style={{ padding: '8px 12px' }}>
                    <span style={{ background: m.maturity === 'Commercial' ? '#D1FAE5' : '#FEF3C7', color: m.maturity === 'Commercial' ? T.green : T.amber, borderRadius: 4, padding: '2px 8px', fontSize: 10, fontWeight: 700 }}>{m.maturity}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>Cumulative Benefit: CBM vs Time-Based Maintenance ($M)</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={cbmVsTimeBased}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} unit="$M" />
              <Tooltip formatter={v => `$${v}M`} />
              <Bar dataKey="cbm" name="CBM Cumulative Net Benefit ($M)" fill={T.green} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderComponentLifecycle = () => {
    const items = [
      { comp: 'Rotor Blades', lifetime: 20, replCostM: 1.2 * nTurbines * 0.01, firstFailYr: 15, category: 'Rotor', overhaul: 'Full set replacement' },
      { comp: 'Gearbox', lifetime: 12, replCostM: 0.45 * nTurbines * 0.01, firstFailYr: 8, category: 'Drivetrain', overhaul: 'Exchange unit' },
      { comp: 'Main Bearing', lifetime: 15, replCostM: 0.18 * nTurbines * 0.01, firstFailYr: 10, category: 'Drivetrain', overhaul: 'In-situ or crane' },
      { comp: 'Generator', lifetime: 17, replCostM: 0.22 * nTurbines * 0.01, firstFailYr: 12, category: 'Electrical', overhaul: 'Rewind or replace' },
      { comp: 'Power Electronics', lifetime: 10, replCostM: 0.08 * nTurbines * 0.01, firstFailYr: 6, category: 'Electrical', overhaul: 'Module replacement' },
      { comp: 'Transformer', lifetime: 20, replCostM: 0.30 * nTurbines * 0.01, firstFailYr: 15, category: 'Electrical', overhaul: 'Crane required' },
      { comp: 'Tower', lifetime: 25, replCostM: null, firstFailYr: null, category: 'Structure', overhaul: 'Inspection / coating' },
      { comp: 'Foundation', lifetime: 25, replCostM: null, firstFailYr: null, category: 'Structure', overhaul: 'J-tube + anode check' },
    ];
    const totalReplCostM = items.reduce((s, it) => s + (it.replCostM || 0), 0);
    const criticalItems = items.filter(it => it.firstFailYr !== null && (it.firstFailYr - turbineAge) < 5);
    const replTimeline = Array.from({ length: 26 }, (_, yr) => {
      const replCost = items.reduce((s, it) => {
        if (!it.firstFailYr) return s;
        const n = Math.floor((yr - it.firstFailYr) / it.lifetime) + (yr >= it.firstFailYr ? 1 : 0);
        return s + (n > 0 && yr % it.lifetime === it.firstFailYr % it.lifetime ? (it.replCostM || 0) : 0);
      }, 0);
      return { year: `Y${yr + 1}`, replCost: +replCost.toFixed(2) };
    });
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <KpiCard label="Total Fleet Repl. Cost" value={`$${totalReplCostM.toFixed(1)}M`} unit="" sub="All components (25-yr horizon)" color={T.red} />
          <KpiCard label="Critical Items (< 5yr)" value={`${criticalItems.length}`} unit="" sub={criticalItems.length > 0 ? criticalItems.map(c => c.comp).join(', ') : 'None imminent'} color={criticalItems.length > 0 ? T.red : T.green} />
          <KpiCard label="Next Major Overhaul" value={`Yr ${Math.max(1, items.filter(it => it.firstFailYr).reduce((mn, it) => Math.min(mn, Math.max(0, it.firstFailYr - turbineAge)), 99)).toFixed(0)}`} unit="" sub="Earliest component replacement" color={T.amber} />
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>Component Lifetime & Replacement Schedule</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.bg }}>
                {['Component','Category','Design Life','First Failure','Fleet Repl. Cost','Overhaul Method','Status'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: T.sub, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => {
                const due = it.firstFailYr !== null ? it.firstFailYr - turbineAge : null;
                return (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.card : T.bg }}>
                    <td style={{ padding: '8px 12px', fontWeight: 600 }}>{it.comp}</td>
                    <td style={{ padding: '8px 12px', color: T.sub }}>{it.category}</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace' }}>{it.lifetime} yr</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace', color: due !== null && due < 5 ? T.red : T.text }}>
                      {it.firstFailYr !== null ? `Yr ${it.firstFailYr}` : 'N/A'}
                    </td>
                    <td style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace' }}>
                      {it.replCostM !== null ? `$${it.replCostM.toFixed(1)}M` : '—'}
                    </td>
                    <td style={{ padding: '8px 12px', color: T.sub, fontSize: 11 }}>{it.overhaul}</td>
                    <td style={{ padding: '8px 12px' }}>
                      {due !== null ? (
                        <span style={{ background: due < 3 ? '#FEE2E2' : due < 7 ? '#FEF3C7' : '#D1FAE5', color: due < 3 ? T.red : due < 7 ? T.amber : T.green, borderRadius: 4, padding: '2px 8px', fontSize: 11 }}>
                          {due < 0 ? 'Overdue' : due < 3 ? `Due ~${due.toFixed(0)}yr` : 'Monitor'}
                        </span>
                      ) : <span style={{ color: T.sub, fontSize: 11 }}>Structural</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>Major Replacement Events — 25-Year Timeline ($M)</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={replTimeline}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize: 9 }} interval={3} />
              <YAxis tick={{ fontSize: 10 }} unit="$M" />
              <Tooltip formatter={v => `$${v}M`} />
              <Bar dataKey="replCost" name="Replacement Cost ($M)" fill={T.red} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderSpareParts = () => {
    const parts = [
      { name: 'Gearbox (complete)', storage: 'Port', lead: '6 months', qty: Math.ceil(nTurbines * 0.05), costEaM: 0.45, stockoutProb: '12%', eoq: Math.ceil(nTurbines * 0.08), critLevel: 'Critical' },
      { name: 'Generator', storage: 'Port', lead: '4 months', qty: Math.ceil(nTurbines * 0.04), costEaM: 0.22, stockoutProb: '8%', eoq: Math.ceil(nTurbines * 0.06), critLevel: 'Critical' },
      { name: 'Rotor Blade (single)', storage: 'Port', lead: '18 months', qty: Math.ceil(nTurbines * 0.03), costEaM: 0.40, stockoutProb: '6%', eoq: Math.ceil(nTurbines * 0.05), critLevel: 'Critical' },
      { name: 'Pitch Drive', storage: 'Offshore', lead: '3 months', qty: Math.ceil(nTurbines * 0.10), costEaM: 0.045, stockoutProb: '4%', eoq: Math.ceil(nTurbines * 0.12), critLevel: 'High' },
      { name: 'IGBT Module', storage: 'Port', lead: '2 months', qty: Math.ceil(nTurbines * 0.15), costEaM: 0.008, stockoutProb: '3%', eoq: Math.ceil(nTurbines * 0.18), critLevel: 'Medium' },
      { name: 'Main Bearing', storage: 'Port', lead: '6 months', qty: Math.ceil(nTurbines * 0.04), costEaM: 0.18, stockoutProb: '10%', eoq: Math.ceil(nTurbines * 0.06), critLevel: 'Critical' },
      { name: 'Yaw Motor', storage: 'Offshore', lead: '2 months', qty: Math.ceil(nTurbines * 0.08), costEaM: 0.022, stockoutProb: '5%', eoq: Math.ceil(nTurbines * 0.10), critLevel: 'Medium' },
      { name: 'Anemometer Set', storage: 'Offshore', lead: '1 month', qty: Math.ceil(nTurbines * 0.20), costEaM: 0.003, stockoutProb: '2%', eoq: Math.ceil(nTurbines * 0.25), critLevel: 'Low' },
    ];
    const totalInvM = parts.reduce((s, p) => s + p.qty * p.costEaM, 0);
    const carryingCost = totalInvM * 0.15;
    const weightedLeadMonths = parts.reduce((s, p) => s + p.qty * p.costEaM * parseFloat(p.lead), 0) / Math.max(0.01, totalInvM);
    const invByCrit = [
      { name: 'Critical', value: +parts.filter(p => p.critLevel === 'Critical').reduce((s, p) => s + p.qty * p.costEaM, 0).toFixed(2), color: T.red },
      { name: 'High', value: +parts.filter(p => p.critLevel === 'High').reduce((s, p) => s + p.qty * p.costEaM, 0).toFixed(2), color: T.amber },
      { name: 'Medium', value: +parts.filter(p => p.critLevel === 'Medium').reduce((s, p) => s + p.qty * p.costEaM, 0).toFixed(2), color: T.indigo },
      { name: 'Low', value: +parts.filter(p => p.critLevel === 'Low').reduce((s, p) => s + p.qty * p.costEaM, 0).toFixed(2), color: T.green },
    ];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <KpiCard label="Total Inventory Value" value={`$${totalInvM.toFixed(1)}M`} unit="" sub="All stocked components" color={T.indigo} />
          <KpiCard label="Annual Carrying Cost" value={`$${carryingCost.toFixed(2)}M`} unit="" sub="15% of inventory value" color={T.amber} />
          <KpiCard label="Wtd Avg Lead Time" value={`${weightedLeadMonths.toFixed(1)}`} unit="months" sub="Weighted by inventory value" color={T.teal} />
          <KpiCard label="Critical Parts Value" value={`$${invByCrit[0].value.toFixed(1)}M`} unit="" sub="Gearbox, bearing, blade, gen." color={T.red} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>Strategic Spare Parts Inventory</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.bg }}>
                  {['Component','Criticality','Storage','Lead Time','Qty','Cost/Unit ($M)','Stockout %','EOQ'].map(h => (
                    <th key={h} style={{ padding: '7px 10px', textAlign: 'left', color: T.sub, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parts.map((p, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.card : T.bg }}>
                    <td style={{ padding: '7px 10px', fontWeight: 600 }}>{p.name}</td>
                    <td style={{ padding: '7px 10px' }}>
                      <span style={{ background: p.critLevel === 'Critical' ? '#FEE2E2' : p.critLevel === 'High' ? '#FEF3C7' : '#D1FAE5', color: p.critLevel === 'Critical' ? T.red : p.critLevel === 'High' ? T.amber : T.green, borderRadius: 4, padding: '2px 6px', fontSize: 10, fontWeight: 700 }}>{p.critLevel}</span>
                    </td>
                    <td style={{ padding: '7px 10px', color: p.storage === 'Offshore' ? T.teal : T.indigo }}>{p.storage}</td>
                    <td style={{ padding: '7px 10px', color: p.lead.includes('18') ? T.red : T.text }}>{p.lead}</td>
                    <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace' }}>{p.qty}</td>
                    <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace' }}>${p.costEaM}</td>
                    <td style={{ padding: '7px 10px', color: parseInt(p.stockoutProb) > 10 ? T.red : T.green }}>{p.stockoutProb}</td>
                    <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace', color: T.indigo }}>{p.eoq}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>Inventory by Criticality ($M)</div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={invByCrit} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: $${value}M`} labelLine={false}>
                  {invByCrit.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip formatter={v => `$${v}M`} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ marginTop: 12, fontSize: 11, color: T.sub, borderTop: `1px solid ${T.border}`, paddingTop: 10 }}>
              <strong>Blade lead time note:</strong> 18-month procurement for OEM blades — strategic pre-ordering required 24 months prior to projected failure window.
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderBladeErosion = () => {
    const tipSpeed = ratedMw > 0 ? 80 + ratedMw * 2 : 80;
    const erosionRate = Math.max(0.5, Math.min(3.0, (tipSpeed - 70) * 0.04 + sr(distPort) * 0.8));
    const aepLossM = (derived.annualAep * erosionRate / 100 * revPerMwh) / 1e6;
    const repairCostM = nTurbines * 0.025;
    const coatingCostM = nTurbines * 0.018;
    const coatingRecoveryM = aepLossM * 0.85;
    const paybackCoating = coatingRecoveryM > 0 ? coatingCostM / coatingRecoveryM : 0;
    const erosionData = Array.from({ length: 20 }, (_, i) => ({
      year: i + 1,
      aepLoss: +(erosionRate * (1 + i * 0.05) * 0.5).toFixed(2),
      withCoating: +(erosionRate * 0.15 * (1 + i * 0.02)).toFixed(2),
    }));
    const siteRisk = [
      { site: 'North Sea (High rain)', erosionIdx: 3.2, repairFreq: '3 yr', tip: tipSpeed },
      { site: 'Baltic Sea (Medium)', erosionIdx: 2.1, repairFreq: '5 yr', tip: tipSpeed * 0.9 },
      { site: 'US East Coast', erosionIdx: 2.8, repairFreq: '4 yr', tip: tipSpeed },
      { site: 'Taiwan Strait', erosionIdx: 3.5, repairFreq: '3 yr', tip: tipSpeed * 1.05 },
      { site: 'This Site (est.)', erosionIdx: +erosionRate.toFixed(1), repairFreq: `${Math.max(2, Math.round(5 / erosionRate))} yr`, tip: tipSpeed, isThis: true },
    ];
    const erosionOptions = [
      { name: 'No Treatment', annualLoss: erosionRate, cost5yr: 0, netBenefit5yr: 0 },
      { name: 'Standard Repair (5yr)', annualLoss: erosionRate * 0.6, cost5yr: repairCostM, netBenefit5yr: aepLossM * 0.4 * 5 - repairCostM },
      { name: 'LE Coating Upgrade', annualLoss: erosionRate * 0.15, cost5yr: coatingCostM, netBenefit5yr: aepLossM * 0.85 * 5 - coatingCostM },
      { name: 'Repair + Coating', annualLoss: erosionRate * 0.10, cost5yr: repairCostM + coatingCostM, netBenefit5yr: aepLossM * 0.90 * 5 - repairCostM - coatingCostM },
    ].map(o => ({ ...o, annualLoss: +o.annualLoss.toFixed(2), cost5yr: +o.cost5yr.toFixed(2), netBenefit5yr: +o.netBenefit5yr.toFixed(2) }));
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <KpiCard label="Tip Speed" value={`${tipSpeed}`} unit="km/h" sub="At rated conditions" color={T.indigo} />
          <KpiCard label="Annual AEP Loss" value={`${erosionRate.toFixed(1)}`} unit="%" sub="Leading edge erosion" color={T.red} />
          <KpiCard label="Revenue Impact" value={`$${aepLossM.toFixed(2)}M`} unit="/yr" sub="At current energy price" color={T.amber} />
          <KpiCard label="Coating Payback" value={`${paybackCoating.toFixed(1)}`} unit="yr" sub={`Cost $${coatingCostM.toFixed(2)}M | Save $${coatingRecoveryM.toFixed(2)}M/yr`} color={T.green} />
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>AEP Loss from Blade Erosion Over Time (%)</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={erosionData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" label={{ value: 'Year', position: 'insideBottom', offset: -2, fontSize: 10 }} tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} unit="%" />
              <Tooltip formatter={v => `${v}%`} />
              <Legend />
              <Line type="monotone" dataKey="aepLoss" stroke={T.red} strokeWidth={2} dot={false} name="Without Coating" />
              <Line type="monotone" dataKey="withCoating" stroke={T.green} strokeWidth={2} dot={false} name="With LE Coating" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>Erosion Severity by Site (Erosion Index)</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.bg }}>
                  {['Site','Erosion Index','Repair Freq.'].map(h => (
                    <th key={h} style={{ padding: '7px 10px', textAlign: 'left', color: T.sub, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {siteRisk.map((s, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: s.isThis ? '#FFFBEB' : i % 2 === 0 ? T.card : T.bg, fontWeight: s.isThis ? 700 : 400 }}>
                    <td style={{ padding: '7px 10px', color: s.isThis ? T.accent : T.text }}>{s.site}{s.isThis ? ' ★' : ''}</td>
                    <td style={{ padding: '7px 10px', color: s.erosionIdx >= 3 ? T.red : s.erosionIdx >= 2 ? T.amber : T.green, fontFamily: 'JetBrains Mono, monospace' }}>{s.erosionIdx}</td>
                    <td style={{ padding: '7px 10px' }}>{s.repairFreq}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>Treatment Options — 5yr Net Benefit ($M)</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.bg }}>
                  {['Option','Ann. AEP Loss (%)','5yr Cost ($M)','5yr Net ($M)'].map(h => (
                    <th key={h} style={{ padding: '7px 10px', textAlign: 'left', color: T.sub, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {erosionOptions.map((o, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.card : T.bg }}>
                    <td style={{ padding: '7px 10px', fontWeight: 600 }}>{o.name}</td>
                    <td style={{ padding: '7px 10px', color: T.red, fontFamily: 'JetBrains Mono, monospace' }}>{o.annualLoss}%</td>
                    <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace' }}>${o.cost5yr}</td>
                    <td style={{ padding: '7px 10px', color: o.netBenefit5yr > 0 ? T.green : T.red, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>${o.netBenefit5yr}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderInsurance = () => {
    const totalMwKw = derived.totalMw * 1000;
    const assetValue = totalMwKw * 1500;
    const premiumM = (assetValue * insuranceRate) / (100 * 1e6);
    const biCovDays = 365;
    const biLimitM = (derived.totalMw * 8760 * 0.42 * revPerMwh) / 1e6;
    const covers = [
      { type: 'Property Damage (All-Risk)', limit: `$${(assetValue / 1e6).toFixed(0)}M`, premium: `$${(premiumM * 0.45).toFixed(2)}M`, deductible: '$2M' },
      { type: 'Business Interruption', limit: `$${(biLimitM * 0.8).toFixed(1)}M`, premium: `$${(premiumM * 0.30).toFixed(2)}M`, deductible: '30-day waiting' },
      { type: 'Delay in Start-Up (DSU)', limit: `$${(biLimitM * 0.3).toFixed(1)}M`, premium: `$${(premiumM * 0.12).toFixed(2)}M`, deductible: '14 days' },
      { type: 'Marine Liability', limit: '$50M', premium: `$${(premiumM * 0.08).toFixed(2)}M`, deductible: '$500k' },
      { type: 'Parametric Wind Trigger', limit: `$${(biLimitM * 0.2).toFixed(1)}M`, premium: `$${(premiumM * 0.05).toFixed(2)}M`, deductible: 'None (parametric)' },
    ];
    const premRate = Array.from({ length: 8 }, (_, i) => ({
      rate: +(0.3 + i * 0.25).toFixed(2),
      premium: +((assetValue * (0.3 + i * 0.25)) / (100 * 1e6)).toFixed(2),
      coverage: +(75 + i * 3).toFixed(0),
    }));
    const claimsHistory = [
      { year: 'Yr 1-2', claims: 1, totalClaimM: 2.1, category: 'Storm damage', ratioImpact: '+0.05%' },
      { year: 'Yr 3', claims: 2, totalClaimM: 4.8, category: 'Gearbox + blade', ratioImpact: '+0.12%' },
      { year: 'Yr 4-5', claims: 0, totalClaimM: 0, category: 'No claims', ratioImpact: '-0.08%' },
    ];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <KpiCard label="Total Insured Value" value={`$${(assetValue / 1e6).toFixed(0)}M`} unit="" sub={`$${(totalMwKw > 0 ? assetValue / totalMwKw : 0).toFixed(0)}/kW`} color={T.indigo} />
          <KpiCard label="Annual Premium" value={`$${premiumM.toFixed(2)}M`} unit="" sub={`${insuranceRate}% of asset value`} color={T.red} />
          <KpiCard label="BI Coverage" value={`${biCovDays}`} unit="days/yr" sub={`Max: $${(biLimitM * 0.8).toFixed(1)}M`} color={T.teal} />
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>Insurance Structure</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.bg }}>
                {['Coverage Type','Limit','Annual Premium','Deductible'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: T.sub, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {covers.map((c, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.card : T.bg }}>
                  <td style={{ padding: '8px 12px', fontWeight: 600 }}>{c.type}</td>
                  <td style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace', color: T.indigo }}>{c.limit}</td>
                  <td style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace' }}>{c.premium}</td>
                  <td style={{ padding: '8px 12px', color: T.sub }}>{c.deductible}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>Premium Rate vs Coverage Depth</div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={premRate}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="rate" label={{ value: 'Rate (%)', position: 'insideBottom', offset: -2, fontSize: 10 }} tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} unit="$M" />
              <Tooltip formatter={v => `$${v}M`} />
              <Line type="monotone" dataKey="premium" stroke={T.red} strokeWidth={2} dot={false} name="Premium ($M)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>Indicative Claims History & Rate Impact</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.bg }}>
                {['Period','No. Claims','Total Claim ($M)','Claim Category','Renewal Rate Impact'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: T.sub, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {claimsHistory.map((c, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.card : T.bg }}>
                  <td style={{ padding: '8px 12px', fontWeight: 600 }}>{c.year}</td>
                  <td style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace', color: c.claims > 0 ? T.red : T.green }}>{c.claims}</td>
                  <td style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace' }}>{c.totalClaimM > 0 ? `$${c.totalClaimM}M` : '—'}</td>
                  <td style={{ padding: '8px 12px', color: T.sub }}>{c.category}</td>
                  <td style={{ padding: '8px 12px', color: c.ratioImpact.startsWith('-') ? T.green : T.red, fontFamily: 'JetBrains Mono, monospace' }}>{c.ratioImpact}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderBenchmarking = () => {
    const myAvail = +(derived.avail * 100).toFixed(1);
    const myOpex = +(derived.totalOpexM * 1e6 / Math.max(1, derived.totalMw * 1000)).toFixed(1);
    const myLost = +(100 - derived.avail * 100).toFixed(1);
    const myDays = +derived.techDaysPerTurbine.toFixed(1);
    const allData = [
      ...BENCHMARKS.map(b => ({ ...b, isMine: false })),
      { name: 'This Fleet', avail: myAvail, opexKw: myOpex, lostPct: myLost, techDays: myDays, isMine: true }
    ];
    const benchAvg = BENCHMARKS.reduce((s, b) => s + b.avail, 0) / Math.max(1, BENCHMARKS.length);
    const opexAvg = BENCHMARKS.reduce((s, b) => s + b.opexKw, 0) / Math.max(1, BENCHMARKS.length);
    const techDaysAvg = BENCHMARKS.reduce((s, b) => s + b.techDays, 0) / Math.max(1, BENCHMARKS.length);
    const percentileAvail = allData.filter(d => d.avail <= myAvail).length / Math.max(1, allData.length) * 100;
    const percentileOpex = allData.filter(d => d.opexKw >= myOpex).length / Math.max(1, allData.length) * 100;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <KpiCard label="This Fleet Availability" value={`${myAvail}`} unit="%" sub={`Peer avg: ${benchAvg.toFixed(1)}%`} color={myAvail >= benchAvg ? T.green : T.red} />
          <KpiCard label="This Fleet OPEX/kW" value={`$${myOpex}`} unit="$/kW" sub={`Peer avg: $${opexAvg.toFixed(0)}/kW`} color={myOpex <= opexAvg ? T.green : T.red} />
          <KpiCard label="Availability Percentile" value={`${percentileAvail.toFixed(0)}`} unit="th %ile" sub="vs 8 peer fleets" color={T.indigo} />
          <KpiCard label="Cost Efficiency Rank" value={`${percentileOpex.toFixed(0)}`} unit="th %ile" sub="Lower OPEX = better" color={T.teal} />
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>Fleet Availability Benchmarking (%) — Highlighted: This Fleet</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={allData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} horizontal={false} />
              <XAxis type="number" domain={[90, 100]} tick={{ fontSize: 10 }} unit="%" />
              <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 10 }} />
              <Tooltip formatter={v => `${v}%`} />
              <Bar dataKey="avail" name="Availability (%)" radius={[0, 4, 4, 0]}>
                {allData.map((d, i) => <Cell key={i} fill={d.isMine ? T.accent : T.indigo} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>OPEX/kW Benchmarking ($/kW/yr)</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={allData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} unit="$/kW" />
              <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 10 }} />
              <Tooltip formatter={v => `$${v}/kW`} />
              <Bar dataKey="opexKw" name="OPEX $/kW" radius={[0, 4, 4, 0]}>
                {allData.map((d, i) => <Cell key={i} fill={d.isMine ? T.accent : T.teal} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>Full KPI Benchmark Table</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.bg }}>
                {['Fleet','Availability (%)','OPEX $/kW','Lost Prod. (%)','Tech Days/Turbine','vs Peer Avg'].map(h => (
                  <th key={h} style={{ padding: '7px 12px', textAlign: 'left', color: T.sub, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allData.map((d, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: d.isMine ? '#FFFBEB' : i % 2 === 0 ? T.card : T.bg, fontWeight: d.isMine ? 700 : 400 }}>
                  <td style={{ padding: '7px 12px', color: d.isMine ? T.accent : T.text }}>{d.name}{d.isMine ? ' ★' : ''}</td>
                  <td style={{ padding: '7px 12px', fontFamily: 'JetBrains Mono, monospace', color: d.avail >= benchAvg ? T.green : T.red }}>{d.avail}%</td>
                  <td style={{ padding: '7px 12px', fontFamily: 'JetBrains Mono, monospace', color: d.opexKw <= opexAvg ? T.green : T.red }}>${d.opexKw}</td>
                  <td style={{ padding: '7px 12px', fontFamily: 'JetBrains Mono, monospace' }}>{d.lostPct}%</td>
                  <td style={{ padding: '7px 12px', fontFamily: 'JetBrains Mono, monospace' }}>{d.techDays}</td>
                  <td style={{ padding: '7px 12px', fontSize: 11 }}>
                    <span style={{ background: d.avail >= benchAvg ? '#D1FAE5' : '#FEE2E2', color: d.avail >= benchAvg ? T.green : T.red, borderRadius: 4, padding: '2px 8px' }}>
                      {d.avail >= benchAvg ? `+${(d.avail - benchAvg).toFixed(1)}%` : `${(d.avail - benchAvg).toFixed(1)}%`}
                    </span>
                  </td>
                </tr>
              ))}
              <tr style={{ background: '#EEF2FF', fontWeight: 700, fontSize: 12 }}>
                <td style={{ padding: '7px 12px', color: T.indigo }}>Peer Average</td>
                <td style={{ padding: '7px 12px', fontFamily: 'JetBrains Mono, monospace', color: T.indigo }}>{benchAvg.toFixed(1)}%</td>
                <td style={{ padding: '7px 12px', fontFamily: 'JetBrains Mono, monospace', color: T.indigo }}>${opexAvg.toFixed(0)}</td>
                <td style={{ padding: '7px 12px', fontFamily: 'JetBrains Mono, monospace', color: T.indigo }}>—</td>
                <td style={{ padding: '7px 12px', fontFamily: 'JetBrains Mono, monospace', color: T.indigo }}>{techDaysAvg.toFixed(0)}</td>
                <td style={{ padding: '7px 12px' }}>—</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderDigitalTwin = () => {
    const layers = [
      { name: 'IoT Sensor Layer', desc: 'Vibration, temperature, strain gauge, SCADA, metocean data feeds', tech: 'OPC-UA, IEC 61400-25' },
      { name: 'Edge Computing', desc: 'On-turbine local inference, anomaly pre-filtering, data compression', tech: 'Raspberry Pi / NVIDIA Jetson' },
      { name: 'Cloud Ingestion', desc: 'Real-time time-series DB, event streaming, data lake storage', tech: 'Kafka, InfluxDB, S3' },
      { name: 'Physics Model', desc: 'Structural FEM, aerodynamic BEM, drivetrain dynamics simulation', tech: 'FAST / OpenFAST' },
      { name: 'ML / AI Layer', desc: 'Anomaly detection, remaining useful life (RUL) prediction, yield optimization', tech: 'LSTM, XGBoost, Bayesian' },
      { name: 'Maintenance Trigger', desc: 'Work order generation, vessel scheduling, spare parts reservation', tech: 'SAP PM / Maximo integration' },
    ];
    const benefits = [
      { kpi: 'Unplanned Downtime Reduction', value: '5-10%', driver: 'Early fault detection', opexImpact: -0.12 },
      { kpi: 'OPEX Savings (total)', value: '15-25%', driver: 'Optimal maintenance timing', opexImpact: -0.20 },
      { kpi: 'Blade AEP Recovery', value: '1-2%', driver: 'Pitch optimization via digital twin', opexImpact: 0.015 },
      { kpi: 'Vessel Utilization Uplift', value: '10-15%', driver: 'Route & schedule optimization', opexImpact: -0.05 },
      { kpi: 'Spare Parts Reduction', value: '20-30%', driver: 'Demand forecasting accuracy', opexImpact: -0.04 },
    ];
    const maturityDims = [
      { dim: 'Data Connectivity', score: remoteMonitor ? 4 : 2 },
      { dim: 'Physics Modelling', score: strategy === 'predictive' ? 4 : 2 },
      { dim: 'ML Deployment', score: strategy === 'predictive' ? 3 : 1 },
      { dim: 'Maintenance Integration', score: ltsa ? 4 : 2 },
      { dim: 'Vessel Scheduling', score: fleetSize >= 3 ? 3 : 1 },
      { dim: 'Spare Parts Optimisation', score: 2 },
    ];
    const avgMaturity = maturityDims.reduce((s, d) => s + d.score, 0) / Math.max(1, maturityDims.length);
    const dtSavingM = derived.totalOpexM * 0.18;
    const dtImplCostM = (nTurbines * ratedMw * 1000 * 12) / 1e6;
    const dtPayback = dtSavingM > 0 ? dtImplCostM / dtSavingM : 0;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <KpiCard label="DT Maturity Score" value={`${avgMaturity.toFixed(1)}/5`} unit="" sub={avgMaturity >= 3.5 ? 'Advanced' : avgMaturity >= 2.5 ? 'Developing' : 'Basic'} color={avgMaturity >= 3.5 ? T.green : T.amber} />
          <KpiCard label="Est. OPEX Saving" value={`$${dtSavingM.toFixed(2)}M`} unit="/yr" sub="~18% OPEX reduction" color={T.green} />
          <KpiCard label="Implementation Cost" value={`$${dtImplCostM.toFixed(1)}M`} unit="" sub="$12/kW installed" color={T.indigo} />
          <KpiCard label="Payback Period" value={`${dtPayback.toFixed(1)}`} unit="yr" sub="Simple payback" color={T.accent} />
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>Digital Twin Architecture Stack</div>
          {layers.map((l, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: i < layers.length - 1 ? `1px solid ${T.border}` : 'none' }}>
              <div style={{ width: 26, height: 26, borderRadius: 13, background: T.indigo, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{l.name}</div>
                <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{l.desc}</div>
              </div>
              <div style={{ fontSize: 10, color: T.teal, fontFamily: 'JetBrains Mono, monospace', textAlign: 'right', maxWidth: 140 }}>{l.tech}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>DT Maturity Assessment (1-5 scale)</div>
            {maturityDims.map((d, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: T.sub }}>{d.dim}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: d.score >= 4 ? T.green : d.score >= 3 ? T.teal : T.amber, fontFamily: 'JetBrains Mono, monospace' }}>{d.score}/5</span>
                </div>
                <div style={{ height: 6, background: T.border, borderRadius: 3 }}>
                  <div style={{ height: 6, width: `${d.score / 5 * 100}%`, background: d.score >= 4 ? T.green : d.score >= 3 ? T.teal : T.amber, borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>Key Digital Twin Benefits & OPEX Impact</div>
            {benefits.map((b, i) => (
              <div key={i} style={{ padding: '8px 0', borderBottom: i < benefits.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{b.kpi}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: T.green, fontFamily: 'JetBrains Mono, monospace' }}>{b.value}</span>
                </div>
                <div style={{ fontSize: 11, color: T.sub }}>{b.driver}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderOpexTrajectory = () => {
    const trajectory = Array.from({ length: 25 }, (_, i) => {
      const age = i + 1;
      const phase = age <= 5 ? 'warranty' : age <= 15 ? 'ltsa' : 'adhoc';
      const phaseMult = phase === 'warranty' ? 0.65 : phase === 'ltsa' ? 1.0 : 1.35;
      const af = 1 + age * 0.03;
      const sf = strategy === 'corrective' ? 1.3 : strategy === 'preventive' ? 1.0 : 0.78;
      const fr = 0.35 * model.failMult * af * sf;
      const op = calcOpex(nTurbines, ratedMw, fr, 0.4, dayRate * 1000, ltsa ? 18 : 12) * phaseMult;
      const infl = Math.pow(1.025, age);
      const majorRepl = (age === 12 || age === 20) ? nTurbines * 0.45 * 0.01 : 0;
      return {
        year: `Y${age}`,
        opex: +op.toFixed(2),
        inflAdj: +(op * infl).toFixed(2),
        major: +majorRepl.toFixed(2),
        phase: phase === 'warranty' ? 'Warranty' : phase === 'ltsa' ? 'LTSA' : 'Ad-hoc'
      };
    });
    const lifeExtension = [
      { option: 'Decommission at 25yr', npvM: 0, opexRisk: 'N/A', note: 'Baseline — original design life' },
      { option: 'Life Extension to 30yr', npvM: +(derived.annualAep * revPerMwh / 1e6 * 5 * 0.7 - derived.totalOpexM * 1.5 * 5).toFixed(1), opexRisk: '+50%', note: 'Structural re-cert + blade/elec replacement' },
      { option: 'Repowering (new nacelle)', npvM: +(derived.annualAep * revPerMwh / 1e6 * 5 * 0.95 - nTurbines * ratedMw * 1000 * 0.4).toFixed(1), opexRisk: 'Reset', note: 'New turbine on existing foundation' },
      { option: 'Partial Repowering', npvM: +(derived.annualAep * revPerMwh / 1e6 * 5 * 0.85 - nTurbines * ratedMw * 1000 * 0.25).toFixed(1), opexRisk: '-10%', note: 'New rotor + generator, keep nacelle' },
    ].map(o => ({ ...o, npvM: +o.npvM }));
    const peakOpexM = trajectory.length > 0 ? Math.max(...trajectory.map(t => t.opex + t.major)) : 0;
    const cumOpex = trajectory.reduce((s, t) => s + t.opex + t.major, 0);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <KpiCard label="Peak Annual OPEX" value={`$${peakOpexM.toFixed(1)}M`} unit="" sub="Including major replacements" color={T.red} />
          <KpiCard label="25-yr Cumulative OPEX" value={`$${cumOpex.toFixed(0)}M`} unit="" sub="Nominal (undiscounted)" color={T.indigo} />
          <KpiCard label="Warranty Phase (Yr 1-5)" value={`${(trajectory.slice(0, 5).reduce((s, t) => s + t.opex, 0)).toFixed(1)}M`} unit="" sub="65% of mid-life level" color={T.green} />
          <KpiCard label="Late-Life Uplift" value="+35%" unit="" sub="Ad-hoc phase vs LTSA phase" color={T.amber} />
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>25-Year OPEX Profile ($M)</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={trajectory}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize: 9 }} interval={2} />
              <YAxis tick={{ fontSize: 10 }} unit="$M" />
              <Tooltip formatter={v => `$${v}M`} />
              <Legend />
              <Bar dataKey="opex" name="Base OPEX ($M)" stackId="a" fill={T.indigo} />
              <Bar dataKey="major" name="Major Replacements" stackId="a" fill={T.red} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>Inflation-Adjusted vs Nominal OPEX ($M)</div>
          <ResponsiveContainer width="100%" height={170}>
            <LineChart data={trajectory}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize: 9 }} interval={4} />
              <YAxis tick={{ fontSize: 10 }} unit="$M" />
              <Tooltip formatter={v => `$${v}M`} />
              <Legend />
              <Line type="monotone" dataKey="opex" stroke={T.indigo} strokeWidth={2} dot={false} name="Nominal" />
              <Line type="monotone" dataKey="inflAdj" stroke={T.red} strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="Inflation-Adj (2.5%)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>End-of-Life Decision: Life Extension vs Repowering vs Decommission</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.bg }}>
                {['Option','5-yr Incremental NPV ($M)','OPEX Risk','Key Consideration'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: T.sub, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lifeExtension.map((o, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.card : T.bg }}>
                  <td style={{ padding: '8px 12px', fontWeight: 600 }}>{o.option}</td>
                  <td style={{ padding: '8px 12px', color: o.npvM > 0 ? T.green : o.npvM === 0 ? T.sub : T.red, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>{o.npvM === 0 ? 'Baseline' : `$${o.npvM}M`}</td>
                  <td style={{ padding: '8px 12px', color: o.opexRisk === 'Reset' ? T.green : o.opexRisk === '+50%' ? T.red : T.sub }}>{o.opexRisk}</td>
                  <td style={{ padding: '8px 12px', color: T.sub, fontSize: 11 }}>{o.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderAnnualPerf = () => {
    const seasonalCFs = [0.35, 0.38, 0.42, 0.44, 0.40, 0.35, 0.33, 0.34, 0.38, 0.43, 0.40, 0.37];
    const monthlyData = MONTHS.map((m, i) => {
      const seasonal = seasonalCFs[i];
      const windSpd = 8 + sr(i * 13 + 1) * 4;
      const avail = Math.max(0.80, derived.avail - (OUTAGE_EVENTS.find(e => e.month === m) ? 0.04 : 0) - sr(i * 7) * 0.02);
      const aep = derived.totalMw * 8760 / 12 * seasonal * avail;
      const budget = derived.totalMw * 8760 / 12 * seasonal * 0.96;
      return {
        month: m, aep: +aep.toFixed(0), budget: +budget.toFixed(0),
        avail: +(avail * 100).toFixed(1), windSpd: +windSpd.toFixed(1)
      };
    });
    const totalActualAep = monthlyData.reduce((s, m) => s + m.aep, 0);
    const totalBudgetAep = monthlyData.reduce((s, m) => s + m.budget, 0);
    const perfVsBudget = totalBudgetAep > 0 ? (totalActualAep / totalBudgetAep * 100) : 0;
    const avgMonthlyAvail = monthlyData.reduce((s, m) => s + m.avail, 0) / Math.max(1, monthlyData.length);
    const turbRanking = Array.from({ length: Math.min(nTurbines, 20) }, (_, i) => ({
      id: `T-${String(i + 1).padStart(3, '0')}`,
      avail: +(derived.avail * 100 - sr(i * 19) * 6).toFixed(1),
    }));
    const sorted = [...turbRanking].sort((a, b) => b.avail - a.avail);
    const best5 = sorted.slice(0, 5);
    const worst5 = sorted.slice(-5);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <KpiCard label="Annual AEP (actual)" value={`${(totalActualAep / 1000).toFixed(0)}`} unit="GWh" sub={`vs budget ${(totalBudgetAep / 1000).toFixed(0)} GWh`} color={T.indigo} />
          <KpiCard label="Performance vs Budget" value={`${perfVsBudget.toFixed(1)}`} unit="%" sub={perfVsBudget >= 100 ? 'Above budget' : 'Below budget'} color={perfVsBudget >= 100 ? T.green : T.red} />
          <KpiCard label="Avg Monthly Availability" value={`${avgMonthlyAvail.toFixed(1)}`} unit="%" sub="Weather-adjusted" color={T.teal} />
          <KpiCard label="Total Outage Cost" value={`$${OUTAGE_EVENTS.reduce((s, e) => s + e.cost, 0).toFixed(1)}M`} unit="" sub={`${OUTAGE_EVENTS.length} notable events`} color={T.red} />
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>Monthly AEP: Actual vs Budget (MWh)</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => `${v.toLocaleString()} MWh`} />
              <Legend />
              <Bar dataKey="budget" name="Budget" fill={T.border} />
              <Bar dataKey="aep" name="Actual AEP" fill={T.indigo} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>Monthly Availability (%) & Wind Speed (m/s)</div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" domain={[80, 100]} tick={{ fontSize: 10 }} unit="%" />
              <YAxis yAxisId="right" orientation="right" domain={[6, 14]} tick={{ fontSize: 10 }} unit=" m/s" />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="avail" stroke={T.indigo} strokeWidth={2} dot={false} name="Availability (%)" />
              <Line yAxisId="right" type="monotone" dataKey="windSpd" stroke={T.teal} strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Wind Speed (m/s)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.green, marginBottom: 8 }}>Top 5 Turbines (Availability)</div>
            {best5.map((t, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
                <span style={{ color: T.text, fontWeight: 600 }}>{t.id}</span>
                <span style={{ color: T.green, fontFamily: 'JetBrains Mono, monospace' }}>{t.avail}%</span>
              </div>
            ))}
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.red, marginBottom: 8 }}>Bottom 5 Turbines (Availability)</div>
            {worst5.map((t, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
                <span style={{ color: T.text, fontWeight: 600 }}>{t.id}</span>
                <span style={{ color: T.red, fontFamily: 'JetBrains Mono, monospace' }}>{t.avail}%</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>Notable Outage Events</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.bg }}>
                {['Month','Turbines Affected','Duration (days)','Root Cause','Est. Cost ($M)'].map(h => (
                  <th key={h} style={{ padding: '7px 12px', textAlign: 'left', color: T.sub, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {OUTAGE_EVENTS.map((e, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.card : T.bg }}>
                  <td style={{ padding: '7px 12px', fontWeight: 600 }}>{e.month}</td>
                  <td style={{ padding: '7px 12px', fontFamily: 'JetBrains Mono, monospace' }}>{e.turbines}</td>
                  <td style={{ padding: '7px 12px', fontFamily: 'JetBrains Mono, monospace', color: e.days > 14 ? T.red : T.amber }}>{e.days}</td>
                  <td style={{ padding: '7px 12px', color: T.sub }}>{e.cause}</td>
                  <td style={{ padding: '7px 12px', fontFamily: 'JetBrains Mono, monospace', color: T.red }}>${e.cost}M</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderStrategyCompare = () => {
    const strategies = [
      { name: 'Corrective Only', avail: 92.1, opexFactor: 1.3, implCost: 0, complexity: 'Low', bestFor: 'Near-shore < 5yr fleet', risk: 'High unplanned downtime risk' },
      { name: 'Preventive + Corrective', avail: 95.2, opexFactor: 1.0, implCost: 0.5, complexity: 'Medium', bestFor: 'Standard fleet, any distance', risk: 'Balanced risk profile' },
      { name: 'Predictive / CBM', avail: 96.8, opexFactor: 0.85, implCost: 2.5, complexity: 'High', bestFor: '> 50 turbines, > 10yr age', risk: 'Low risk if fully implemented' },
      { name: 'Full Digital O&M', avail: 97.5, opexFactor: 0.72, implCost: 5.0, complexity: 'Very High', bestFor: 'Large fleet, > 60km offshore', risk: 'Technology / change management risk' },
    ];
    const npvData = strategies.map(s => {
      const annOpex = derived.totalOpexM * s.opexFactor;
      const lostRev = derived.lostRevM * (1 - s.avail / 100);
      const annTotal = annOpex + lostRev + s.implCost / 10;
      const npv10 = annTotal * 8.53; // 10-yr NPV factor at 3%
      return { ...s, annOpex: +annOpex.toFixed(2), lostRev: +lostRev.toFixed(2), npv10: +npv10.toFixed(1) };
    });
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>10-Year NPV Comparison: OPEX + Lost Production ($M)</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={npvData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-10} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 10 }} unit="$M" />
              <Tooltip formatter={v => `$${v}M`} />
              <Legend />
              <Bar dataKey="annOpex" name="Ann. OPEX ($M)" stackId="a" fill={T.indigo} />
              <Bar dataKey="lostRev" name="Lost Revenue ($M)" stackId="a" fill={T.red} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>Full Strategy Scorecard</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.bg }}>
                {['Strategy','Availability','Ann. OPEX ($M)','Impl. Cost ($M)','10yr NPV ($M)','Complexity','Best For'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: T.sub, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {npvData.map((s, i) => {
                const isRecommended = strategy === 'corrective' ? i === 0 : strategy === 'preventive' ? i === 1 : strategy === 'predictive' ? i === 2 : i === 3;
                return (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: isRecommended ? '#EEF2FF' : i % 2 === 0 ? T.card : T.bg }}>
                    <td style={{ padding: '8px 12px', fontWeight: isRecommended ? 700 : 600, color: isRecommended ? T.indigo : T.text }}>
                      {s.name}{isRecommended ? ' ★' : ''}
                    </td>
                    <td style={{ padding: '8px 12px', color: T.green, fontFamily: 'JetBrains Mono, monospace' }}>{s.avail}%</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace' }}>${s.annOpex}</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace' }}>${s.implCost}</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace', color: T.red }}>${s.npv10}</td>
                    <td style={{ padding: '8px 12px', color: s.complexity === 'Very High' ? T.red : s.complexity === 'High' ? T.amber : T.sub }}>{s.complexity}</td>
                    <td style={{ padding: '8px 12px', color: T.sub, fontSize: 11 }}>{s.bestFor}</td>
                    <td style={{ padding: '8px 12px', color: T.sub, fontSize: 11 }}>{s.risk}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 10 }}>Implementation Roadmap for Recommended Strategy</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { phase: 'Phase 1 (0-12m)', action: 'Deploy SCADA + baseline KPI tracking', cost: '$0.3M', impact: 'Full data visibility & alerting' },
              { phase: 'Phase 2 (12-24m)', action: 'CMS vibration + oil particle sensors', cost: '$1.2M', impact: '+1% availability uplift' },
              { phase: 'Phase 3 (24-36m)', action: 'Full CBM + drone program + ML model', cost: '$2.0M', impact: '+2-3% avail, -15% OPEX' },
            ].map((p, i) => (
              <div key={i} style={{ background: T.bg, borderRadius: 6, padding: '12px 14px', borderLeft: `3px solid ${[T.teal, T.indigo, T.green][i]}` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: [T.teal, T.indigo, T.green][i], marginBottom: 5 }}>{p.phase}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 4 }}>{p.action}</div>
                <div style={{ fontSize: 11, color: T.amber, marginBottom: 3 }}>Cost: {p.cost}</div>
                <div style={{ fontSize: 11, color: T.sub }}>{p.impact}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderTab = () => {
    switch (activeTab) {
      case 0:  return renderOverview();
      case 1:  return renderFailureRates();
      case 2:  return renderMaintCost();
      case 3:  return renderWeatherWindow();
      case 4:  return renderVesselDispatch();
      case 5:  return renderAvailability();
      case 6:  return renderOpexBreakdown();
      case 7:  return renderRemoteMonitoring();
      case 8:  return renderPredictive();
      case 9:  return renderComponentLifecycle();
      case 10: return renderSpareParts();
      case 11: return renderBladeErosion();
      case 12: return renderInsurance();
      case 13: return renderBenchmarking();
      case 14: return renderDigitalTwin();
      case 15: return renderOpexTrajectory();
      case 16: return renderAnnualPerf();
      case 17: return renderStrategyCompare();
      default: return null;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: T.bg, fontFamily: 'DM Sans, sans-serif', color: T.text, overflow: 'hidden' }}>
      {sidebar}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ background: T.navy, padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `2px solid ${T.accent}` }}>
          <div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em' }}>EP-DR5 // OFFSHORE WIND ANALYTICS</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#FFFFFF', marginTop: 2 }}>Offshore Wind O&M & Asset Performance Management</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ background: strategy === 'predictive' ? T.green : strategy === 'preventive' ? T.indigo : T.amber, color: '#fff', borderRadius: 5, padding: '4px 10px', fontSize: 11, fontWeight: 700 }}>
              {strategy === 'corrective' ? 'CORRECTIVE ONLY' : strategy === 'preventive' ? 'PREVENTIVE' : 'PREDICTIVE/CBM'}
            </span>
            {remoteMonitor && <span style={{ background: T.teal, color: '#fff', borderRadius: 5, padding: '4px 10px', fontSize: 11, fontWeight: 700 }}>SCADA ACTIVE</span>}
            {ltsa && <span style={{ background: T.blue, color: '#fff', borderRadius: 5, padding: '4px 10px', fontSize: 11, fontWeight: 700 }}>LTSA</span>}
          </div>
        </div>
        {statsBar}
        {tabBar}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {renderTab()}
        </div>
        {/* Status bar */}
        <div style={{ background: T.navy, padding: '5px 24px', display: 'flex', gap: 24, alignItems: 'center', borderTop: `1px solid rgba(255,255,255,0.1)` }}>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'JetBrains Mono, monospace' }}>
            FLEET: {nTurbines} × {ratedMw}MW = {(nTurbines * ratedMw).toFixed(0)}MW | DIST: {distPort}km | AGE: {turbineAge}yr | MODEL: {model.name}
          </span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'JetBrains Mono, monospace', marginLeft: 'auto' }}>
            EP-DR5 v1.0 // OFFSHORE WIND O&M INTELLIGENCE
          </span>
        </div>
      </div>
    </div>
  );
}
