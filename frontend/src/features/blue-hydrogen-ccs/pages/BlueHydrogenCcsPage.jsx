import React, { useState, useMemo } from 'react';
import EnergyAdvancedAnalytics from '../../_shared/EnergyAdvancedAnalytics';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, ComposedChart, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, Radar
} from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const T = {
  bg: '#FAFAF7', card: '#FFFFFF', border: '#E5E2D9',
  text: '#1A1A2E', sub: '#6B7280', accent: '#B8860B',
  green: '#065F46', red: '#991B1B', blue: '#1E40AF',
  teal: '#0F766E', amber: '#92400E', navy: '#0F172A',
  indigo: '#4F46E5', purple: '#7C3AED', sage: '#4A7C59'
};

// ── Process data ──────────────────────────────────────────────────────────────
const ROUTES = [
  {
    id: 'SMR_CCS', label: 'SMR + Post-Combustion CCS',
    co2CapturePct: 55, methaneSlip: 0.8, lcoh: 1.8, capex: 600,
    efficiency: 74, maturity: 'Commercial', trl: 9,
    carbonIntensity: 4.2, color: T.blue,
    description: 'Steam Methane Reforming (850°C) + MEA absorption on flue gas. Capture limited by dilute CO2 in flue gas.'
  },
  {
    id: 'SMR_CCS95', label: 'SMR + Pre+Post CCS (95%)',
    co2CapturePct: 93, methaneSlip: 0.8, lcoh: 2.4, capex: 950,
    efficiency: 70, maturity: 'Commercial (limited)', trl: 8,
    carbonIntensity: 1.5, color: T.teal,
    description: 'Dual capture: pre-combustion (syngas shift) + post-combustion. Very high capture rate but energy penalty.'
  },
  {
    id: 'ATR_CCS', label: 'ATR + Pre-Combustion CCS',
    co2CapturePct: 95, methaneSlip: 0.3, lcoh: 2.0, capex: 750,
    efficiency: 76, maturity: 'Commercial', trl: 9,
    carbonIntensity: 1.2, color: T.green,
    description: 'Autothermal Reforming produces concentrated CO2 stream, easier to capture. Lower methane slip vs SMR.'
  },
  {
    id: 'POX_CCS', label: 'Partial Oxidation + CCS',
    co2CapturePct: 95, methaneSlip: 0.1, lcoh: 2.2, capex: 800,
    efficiency: 65, maturity: 'Commercial', trl: 9,
    carbonIntensity: 1.0, color: T.amber,
    description: 'Non-catalytic partial oxidation. Handles heavy feedstocks. Higher CAPEX, lower efficiency.'
  },
  {
    id: 'CH4_PYROLYSIS', label: 'Methane Pyrolysis (Turquoise H₂)',
    co2CapturePct: 100, methaneSlip: 0.5, lcoh: 2.8, capex: 1100,
    efficiency: 58, maturity: 'Pilot', trl: 6,
    carbonIntensity: 0.5, color: T.purple,
    description: 'CH4 → C (solid) + H2. No CO2 emitted — carbon stored as solid carbon black or graphite. Zero combustion CO2.'
  },
];

const CARBON_STORES = [
  { name: 'North Sea (Sleipner)', capacity: 5000, injRate: 1.2, cost: 8, risk: 'Very Low', status: 'Operational', co2Type: 'Saline aquifer' },
  { name: 'Acorn (UK)', capacity: 3000, injRate: 0.5, cost: 12, risk: 'Low', status: 'FID 2025', co2Type: 'Depleted oil field' },
  { name: 'Northern Lights (NO)', capacity: 5000, injRate: 1.5, cost: 10, risk: 'Low', status: 'Operational 2024', co2Type: 'Saline aquifer' },
  { name: 'Porthos (NL)', capacity: 37, injRate: 2.5, cost: 11, risk: 'Low', status: 'Under Const.', co2Type: 'Depleted gas field' },
  { name: 'HyNet (UK)', capacity: 10000, injRate: 3.0, cost: 9, risk: 'Medium', status: 'FEED 2025', co2Type: 'Depleted gas field' },
  { name: 'Quest CCS (CA)', capacity: 3600, injRate: 1.1, cost: 15, risk: 'Low', status: 'Operational 2015', co2Type: 'Saline aquifer' },
];

const YEARS = Array.from({ length: 11 }, (_, i) => 2025 + i);

function calcBlueH2Lcoh({ gasPrice, captureRate, capex, opexPct, ngCons, co2TransStore, methaneSlip, carbonTax, wacc, lifetime }) {
  // Gas feedstock cost: natural gas consumption per kg H2 ≈ 3.5 kWh/kWh LHV → ng kWh / LHV_H2
  const ngCostPerKg = gasPrice * ngCons; // €/MWh × MWh/kg
  // CO2 storage cost
  const co2Generated = 9.0; // kg CO2 per kg H2 (SMR w/o capture)
  const co2Captured = co2Generated * captureRate / 100;
  const co2Stored = co2CostPerT => co2Captured * co2CostPerT / 1000;
  const co2StoreKg = co2Stored(co2TransStore);
  // Carbon tax on escaped CO2
  const escapedCO2 = co2Generated * (1 - captureRate / 100) + methaneSlip * 28 / 1000; // methane slip × GWP100
  const carbonTaxKg = escapedCO2 * carbonTax / 1000;
  // CAPEX annuity
  const capexAnn = capex * 1000 * (wacc / 100) / (1 - Math.pow(1 + wacc / 100, -lifetime));
  // Annual production: assume 800 MW SMR → ~750 t H2/d
  const annualTonne = 250000; // tonne per year reference
  const capexPerKg = capexAnn / Math.max(1, annualTonne * 1000);
  const opexPerKg = capex * 1000 * opexPct / 100 / Math.max(1, annualTonne * 1000);
  return +(ngCostPerKg + co2StoreKg + carbonTaxKg + capexPerKg + opexPerKg).toFixed(3);
}

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
  'Process Routes', 'LCOH Calculator', 'Methane Slip Analysis', 'Carbon Capture Comparison',
  'CCS Storage Map', 'Cost vs Green H₂', 'Lifecycle GHG', 'Policy Framework',
  'Technology Outlook', 'Investment Screening'
];

export default function BlueHydrogenCcsPage() {
  const [tab, setTab] = useState(0);
  const [gasPrice, setGasPrice] = useState(35);      // €/MWh
  const [captureRate, setCaptureRate] = useState(90); // %
  const [capex, setCapex] = useState(700);            // M€/GW
  const [opexPct, setOpexPct] = useState(3);
  const [ngCons, setNgCons] = useState(0.0055);       // MWh NG per kg H2
  const [co2TransStore, setCo2TransStore] = useState(12); // €/t
  const [carbonTax, setCarbonTax] = useState(80);     // €/t
  const [methaneSlip, setMethaneSlip] = useState(0.5);  // % of feed
  const [wacc, setWacc] = useState(8);
  const [lifetime, setLifetime] = useState(25);

  const lcoh = useMemo(() => calcBlueH2Lcoh({ gasPrice, captureRate, capex, opexPct, ngCons, co2TransStore, methaneSlip, carbonTax, wacc, lifetime }), [gasPrice, captureRate, capex, opexPct, ngCons, co2TransStore, methaneSlip, carbonTax, wacc, lifetime]);

  const carbonIntensity = useMemo(() => {
    const co2Gen = 9.0;
    const captured = co2Gen * captureRate / 100;
    const slip = methaneSlip * 28 / 1000;
    return +(co2Gen - captured + slip).toFixed(2);
  }, [captureRate, methaneSlip]);

  // Route comparison
  const routeCompare = useMemo(() => ROUTES.map(r => ({
    ...r,
    lcohCalc: calcBlueH2Lcoh({ gasPrice, captureRate: r.co2CapturePct, capex: r.capex, opexPct: 3, ngCons: 0.0055, co2TransStore, methaneSlip: r.methaneSlip, carbonTax, wacc, lifetime }),
  })), [gasPrice, co2TransStore, carbonTax, wacc, lifetime]);

  // Gas price sensitivity
  const gasSens = useMemo(() => Array.from({ length: 8 }, (_, i) => {
    const gp = 15 + i * 10;
    return {
      gas: gp,
      SMR_CCS: +calcBlueH2Lcoh({ gasPrice: gp, captureRate: 55, capex: 600, opexPct: 3, ngCons, co2TransStore, methaneSlip: 0.8, carbonTax, wacc, lifetime }).toFixed(2),
      ATR_CCS: +calcBlueH2Lcoh({ gasPrice: gp, captureRate: 95, capex: 750, opexPct: 3, ngCons, co2TransStore, methaneSlip: 0.3, carbonTax, wacc, lifetime }).toFixed(2),
      green_solar: +(0.9 + gp * 0.001).toFixed(2), // Green H2 not sensitive to gas price
    };
  }), [ngCons, co2TransStore, carbonTax, wacc, lifetime]);

  // Carbon tax sensitivity
  const carbonSens = useMemo(() => Array.from({ length: 8 }, (_, i) => {
    const ct = 30 + i * 20;
    return {
      carbonTax: ct,
      SMR_no_CCS: +calcBlueH2Lcoh({ gasPrice, captureRate: 0, capex: 300, opexPct: 2, ngCons, co2TransStore: 0, methaneSlip: 0, carbonTax: ct, wacc, lifetime }).toFixed(2),
      SMR_CCS55:  +calcBlueH2Lcoh({ gasPrice, captureRate: 55, capex: 600, opexPct: 3, ngCons, co2TransStore, methaneSlip: 0.8, carbonTax: ct, wacc, lifetime }).toFixed(2),
      ATR_CCS95:  +calcBlueH2Lcoh({ gasPrice, captureRate: 95, capex: 750, opexPct: 3, ngCons, co2TransStore, methaneSlip: 0.3, carbonTax: ct, wacc, lifetime }).toFixed(2),
    };
  }), [gasPrice, ngCons, co2TransStore, wacc, lifetime]);

  // Methane slip GWP analysis (kg CO2eq / kg H2)
  const slipData = useMemo(() => Array.from({ length: 9 }, (_, i) => {
    const slip = i * 0.25;
    return {
      slip,
      gwpImpact100: +(slip * 28 / 1000 * 9).toFixed(3),  // GWP-100
      gwpImpact20:  +(slip * 80 / 1000 * 9).toFixed(3),   // GWP-20 (near-term)
    };
  }), []);

  // Radar comparison
  const radarData = [
    { axis: 'Carbon Intensity',  SMR_CCS: 50, ATR_CCS: 80, Pyrolysis: 95, Green: 99 },
    { axis: 'LCOH Score',        SMR_CCS: 80, ATR_CCS: 72, Pyrolysis: 60, Green: 65 },
    { axis: 'Maturity',          SMR_CCS: 95, ATR_CCS: 85, Pyrolysis: 50, Green: 85 },
    { axis: 'Scalability',       SMR_CCS: 90, ATR_CCS: 85, Pyrolysis: 55, Green: 80 },
    { axis: 'Policy Support',    SMR_CCS: 60, ATR_CCS: 65, Pyrolysis: 40, Green: 90 },
    { axis: 'Grid Independence', SMR_CCS: 90, ATR_CCS: 90, Pyrolysis: 88, Green: 30 },
  ];

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
        <div style={{ fontSize: 11, color: T.accent, fontFamily: 'monospace', marginBottom: 4 }}>EP-DS5 · GREEN HYDROGEN FINANCE</div>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Blue Hydrogen & CCS Economics Engine</h1>
        <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>SMR · ATR · POX · Methane Pyrolysis · Methane Slip · CCS Storage · Carbon Price · GHG Lifecycle · 10 Tabs</div>
      </div>
      <div style={tabBarStyle}>
        {TABS.map((t, i) => <div key={i} style={tabStyle(tab === i)} onClick={() => setTab(i)}>{t}</div>)}
      </div>

      {/* TAB 0 — PROCESS ROUTES */}
      {tab === 0 && (
        <div style={sectionStyle}>
          <div style={gridStyle}>
            {ROUTES.map((r, i) => (
              <div key={r.id} style={{ ...cardStyle, borderTop: `3px solid ${r.color}` }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: r.color, marginBottom: 4 }}>{r.label}</div>
                <div style={{ fontSize: 10, color: T.sub, marginBottom: 10 }}>{r.description}</div>
                <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
                  <tbody>
                    {[
                      ['CO₂ capture rate', `${r.co2CapturePct}%`],
                      ['Methane slip', `${r.methaneSlip}% of feed`],
                      ['Carbon intensity', `${r.carbonIntensity} kgCO₂/kgH₂`],
                      ['Efficiency (LHV)', `${r.efficiency}%`],
                      ['CAPEX', `${r.capex} M€/GW`],
                      ['Est. LCOH 2025', `${r.lcoh} €/kg`],
                      ['TRL', `${r.trl}/9`],
                      ['Maturity', r.maturity],
                    ].map(([k, v]) => (
                      <tr key={k} style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '4px 0', color: T.sub, fontSize: 10 }}>{k}</td>
                        <td style={{ padding: '4px 0', fontWeight: 600, textAlign: 'right', fontSize: 10 }}>{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 1 — LCOH CALCULATOR */}
      {tab === 1 && (
        <div style={sectionStyle}>
          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20 }}>
            <div style={cardStyle}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 14 }}>Blue H₂ LCOH Parameters</div>
              <Slider label="Natural gas price" value={gasPrice} min={10} max={80} step={5} onChange={setGasPrice} unit=" €/MWh" />
              <Slider label="CO₂ capture rate" value={captureRate} min={0} max={98} step={5} onChange={setCaptureRate} unit="%" />
              <Slider label="Electrolyzer CAPEX" value={capex} min={200} max={1500} step={50} onChange={setCapex} unit=" M€/GW" />
              <Slider label="O&M (% capex/yr)" value={opexPct} min={1} max={6} step={0.5} onChange={setOpexPct} unit="%" />
              <Slider label="CO₂ transport & storage" value={co2TransStore} min={5} max={50} step={1} onChange={setCo2TransStore} unit=" €/t" />
              <Slider label="Carbon tax" value={carbonTax} min={0} max={300} step={10} onChange={setCarbonTax} unit=" €/t" />
              <Slider label="Methane slip" value={methaneSlip} min={0.1} max={3} step={0.1} onChange={setMethaneSlip} unit="% feed" />
              <Slider label="WACC" value={wacc} min={4} max={14} step={0.5} onChange={setWacc} unit="%" />
              <Slider label="Plant lifetime" value={lifetime} min={15} max={35} step={1} onChange={setLifetime} unit=" yrs" />
            </div>
            <div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                <KpiCard label="Blue H₂ LCOH" value={lcoh.toFixed(2)} unit="€/kg H₂" color={lcoh < 2 ? T.green : lcoh < 3 ? T.amber : T.red} />
                <KpiCard label="Carbon Intensity" value={carbonIntensity} unit="kgCO₂/kgH₂" color={carbonIntensity < 2 ? T.green : carbonIntensity < 4 ? T.amber : T.red} />
                <KpiCard label="EU RFNBO Threshold" value={carbonIntensity < 3.4 ? 'PASS' : 'FAIL'} unit="< 3.4 kgCO₂eq/kgH₂" color={carbonIntensity < 3.4 ? T.green : T.red} />
                <KpiCard label="Carbon Cost/kg H₂" value={((9 * (1 - captureRate / 100) + methaneSlip * 28 / 1000) * carbonTax / 1000).toFixed(3)} unit="€/kg (penalty)" color={T.red} />
              </div>
              <div style={cardStyle}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Gas Price Sensitivity — Blue vs Green H₂</div>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={gasSens}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="gas" label={{ value: '€/MWh gas', position: 'insideBottom', offset: -3, fontSize: 10 }} tick={{ fontSize: 10 }} />
                    <YAxis label={{ value: '€/kg H₂', angle: -90, position: 'insideLeft', fontSize: 10 }} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v, n) => [`${v} €/kg`, n]} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Line type="monotone" dataKey="SMR_CCS" name="SMR+CCS 55%" stroke={T.blue} strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="ATR_CCS" name="ATR+CCS 95%" stroke={T.green} strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="green_solar" name="Green H₂ (solar)" stroke={T.amber} strokeWidth={2} strokeDasharray="5 3" dot={false} />
                    <ReferenceLine y={3} stroke={T.teal} strokeDasharray="4 4" label={{ value: 'Parity', fontSize: 9, fill: T.teal }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2 — METHANE SLIP */}
      {tab === 2 && (
        <div style={sectionStyle}>
          <div style={cardStyle}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 4 }}>Methane Slip — GHG Impact Analysis</div>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 14 }}>Methane slip (unburned CH₄ from reformer leaks/purge) undoes CCS benefits. CH₄ GWP-100 = 28, GWP-20 = 80. Key blue H₂ controversy driver.</div>
            <div style={gridStyle}>
              <div>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={slipData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="slip" label={{ value: 'Methane slip (% feed)', position: 'insideBottom', offset: -3, fontSize: 10 }} tick={{ fontSize: 10 }} />
                    <YAxis label={{ value: 'kgCO2eq/kgH2', angle: -90, position: 'insideLeft', fontSize: 10 }} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v, n) => [`${v} kgCO2eq/kgH2`, n]} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <ReferenceLine y={3.4} stroke={T.blue} strokeDasharray="4 4" label={{ value: 'EU RFNBO limit', fontSize: 9, fill: T.blue }} />
                    <Line type="monotone" dataKey="gwpImpact100" name="GWP-100 impact" stroke={T.amber} strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="gwpImpact20" name="GWP-20 impact" stroke={T.red} strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Methane Slip by Technology</div>
                {[
                  { tech: 'ATR (best practice)', slip: '0.1–0.3%', concern: 'Low', note: 'Closed loop reformer' },
                  { tech: 'SMR (modern)',         slip: '0.3–0.8%', concern: 'Medium', note: 'Flue gas leakage' },
                  { tech: 'SMR (aging)',           slip: '0.8–2.0%', concern: 'High', note: 'Older plant design' },
                  { tech: 'POX',                  slip: '0.1–0.2%', concern: 'Low', note: 'No catalyst bed' },
                  { tech: 'Upstream NG (avg)',     slip: '1.5–2.5%', concern: 'Critical', note: 'Varies widely by basin' },
                  { tech: 'LNG regasification',    slip: '0.2–0.4%', concern: 'Low-Med', note: 'Boil-off + equipment' },
                ].map((r, i) => (
                  <div key={i} style={{ padding: '7px 0', borderBottom: `1px solid ${T.border}`, fontSize: 11 }}>
                    <div style={{ fontWeight: 600 }}>{r.tech}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                      <span style={{ color: T.sub }}>Slip rate: {r.slip}</span>
                      <span style={{ color: r.concern === 'Critical' ? T.red : r.concern === 'High' ? T.amber : T.green }}>{r.concern}</span>
                    </div>
                    <div style={{ fontSize: 10, color: T.sub }}>{r.note}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3 — CARBON CAPTURE COMPARISON */}
      {tab === 3 && (
        <div style={sectionStyle}>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 4 }}>LCOH vs Carbon Capture Rate — All Routes at Current Gas Price</div>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 14 }}>Higher capture = higher CAPEX & energy penalty but lower carbon tax burden. Optimal depends on carbon price.</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={routeCompare}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="id" tick={{ fontSize: 10 }} />
                <YAxis label={{ value: '€/kg H₂', angle: -90, position: 'insideLeft', fontSize: 10 }} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v, n) => [`${v} €/kg`, n]} />
                <ReferenceLine y={2} stroke={T.green} strokeDasharray="4 4" label={{ value: 'Green H₂ 2030', fontSize: 9, fill: T.green }} />
                <Bar dataKey="lcohCalc" name="LCOH (€/kg)" radius={[4, 4, 0, 0]}>
                  {routeCompare.map((r, i) => <Cell key={i} fill={r.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Carbon Tax Sensitivity — Impact on Route Competitiveness</div>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={carbonSens}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="carbonTax" label={{ value: '€/t CO₂', position: 'insideBottom', offset: -3, fontSize: 10 }} tick={{ fontSize: 10 }} />
                <YAxis label={{ value: '€/kg H₂', angle: -90, position: 'insideLeft', fontSize: 10 }} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v, n) => [`${v} €/kg`, n]} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Line type="monotone" dataKey="SMR_no_CCS" name="SMR (no CCS)" stroke={T.red} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="SMR_CCS55" name="SMR+CCS 55%" stroke={T.blue} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="ATR_CCS95" name="ATR+CCS 95%" stroke={T.green} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TAB 4 — CCS STORAGE MAP */}
      {tab === 4 && (
        <div style={sectionStyle}>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Key CCS Storage Sites — European & North American</div>
            <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.bg }}>
                  {['Site', 'Capacity (Mt)', 'Inj. Rate (Mtpa)', 'Cost (€/t)', 'Reservoir Risk', 'Status', 'Type'].map(h => (
                    <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: T.sub, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CARBON_STORES.map((s, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 ? T.bg : T.card }}>
                    <td style={{ padding: '6px 8px', fontWeight: 600 }}>{s.name}</td>
                    <td style={{ padding: '6px 8px', fontFamily: 'monospace' }}>{s.capacity.toLocaleString()}</td>
                    <td style={{ padding: '6px 8px', fontFamily: 'monospace' }}>{s.injRate}</td>
                    <td style={{ padding: '6px 8px', fontFamily: 'monospace' }}>{s.cost}</td>
                    <td style={{ padding: '6px 8px', color: s.risk === 'Very Low' || s.risk === 'Low' ? T.green : T.amber }}>{s.risk}</td>
                    <td style={{ padding: '6px 8px', color: s.status.includes('Operational') ? T.green : s.status.includes('FID') || s.status.includes('Const') ? T.teal : T.amber }}>{s.status}</td>
                    <td style={{ padding: '6px 8px', color: T.sub }}>{s.co2Type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>CCS Transport & Storage Cost Breakdown (€/t CO₂)</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={[
                { component: 'Capture (MEA)', low: 30, mid: 45, high: 70 },
                { component: 'Compression', low: 5, mid: 8, high: 12 },
                { component: 'Pipeline T&S (50 km)', low: 3, mid: 6, high: 12 },
                { component: 'Pipeline T&S (500 km)', low: 8, mid: 14, high: 25 },
                { component: 'Offshore injection', low: 8, mid: 12, high: 20 },
                { component: 'Monitoring (MRV)', low: 2, mid: 3, high: 5 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="component" tick={{ fontSize: 9 }} angle={-15} textAnchor="end" height={55} />
                <YAxis label={{ value: '€/t CO₂', angle: -90, position: 'insideLeft', fontSize: 10 }} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v, n) => [`${v} €/t`, n]} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="low" name="Low" fill={T.green} opacity={0.7} />
                <Bar dataKey="mid" name="Mid" fill={T.teal} opacity={0.7} />
                <Bar dataKey="high" name="High" fill={T.red} opacity={0.7} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TAB 5 — COST vs GREEN */}
      {tab === 5 && (
        <div style={sectionStyle}>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 4 }}>Blue H₂ vs Green H₂ — Cost Crossover Analysis</div>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 14 }}>Blue H₂ today is cost-competitive but faces carbon tax pressure. Green H₂ LCOH falls with learning curves.</div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={YEARS.map((y, i) => ({
                year: y,
                blue_low_gas:  +(1.5 + i * 0.08).toFixed(2),
                blue_high_gas: +(2.5 + i * 0.10).toFixed(2),
                green_wind:    +(5.5 - i * 0.35).toFixed(2),
                green_solar:   +(4.8 - i * 0.30).toFixed(2),
                grey:          +(1.2 + i * 0.07).toFixed(2),
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                <YAxis label={{ value: '€/kg H₂', angle: -90, position: 'insideLeft', fontSize: 10 }} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v, n) => [`${v} €/kg`, n]} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Area type="monotone" dataKey="blue_low_gas" name="Blue (low gas)" stroke={T.blue} fill={T.blue} fillOpacity={0.1} />
                <Area type="monotone" dataKey="blue_high_gas" name="Blue (high gas)" stroke={T.indigo} fill={T.indigo} fillOpacity={0.1} />
                <Line type="monotone" dataKey="green_wind" name="Green (wind)" stroke={T.teal} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="green_solar" name="Green (solar)" stroke={T.amber} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="grey" name="Grey H₂" stroke={T.red} strokeWidth={1} strokeDasharray="5 3" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TAB 6 — LIFECYCLE GHG */}
      {tab === 6 && (
        <div style={sectionStyle}>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Well-to-Gate GHG Intensity — Hydrogen Production Routes (kgCO2eq/kgH2)</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={[
                { route: 'Grey (SMR, no CCS)', upstream: 3.5, process: 7.5, slip: 0.3, total: 11.3 },
                { route: 'SMR+CCS 55%',        upstream: 3.5, process: 3.4, slip: 1.2, total: 8.1 },
                { route: 'ATR+CCS 95%',         upstream: 2.0, process: 0.6, slip: 0.4, total: 3.0 },
                { route: 'Pyrolysis (turquoise)', upstream: 1.5, process: 0.1, slip: 0.7, total: 2.3 },
                { route: 'Green (wind PEM)',    upstream: 0.1, process: 0.0, slip: 0.0, total: 0.1 },
                { route: 'Green (solar PEM)',   upstream: 0.3, process: 0.0, slip: 0.0, total: 0.3 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="route" tick={{ fontSize: 9 }} angle={-15} textAnchor="end" height={60} />
                <YAxis label={{ value: 'kgCO2eq/kgH2', angle: -90, position: 'insideLeft', fontSize: 10 }} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v, n) => [`${v} kgCO2eq/kgH2`, n]} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <ReferenceLine y={3.4} stroke={T.red} strokeDasharray="4 4" label={{ value: 'EU 3.4 limit', fontSize: 9, fill: T.red }} />
                <Bar dataKey="upstream" name="Upstream NG" stackId="a" fill={T.blue} />
                <Bar dataKey="process" name="Process CO₂" stackId="a" fill={T.amber} />
                <Bar dataKey="slip" name="Methane slip" stackId="a" fill={T.red} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TAB 7 — POLICY FRAMEWORK */}
      {tab === 7 && (
        <div style={sectionStyle}>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Blue Hydrogen Policy Landscape</div>
            <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.bg }}>
                  {['Policy/Standard', 'Jurisdiction', 'Blue H₂ treatment', 'Capture threshold', 'Implication'].map(h => (
                    <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: T.sub, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['EU Delegated Acts (RFNBO)', 'EU', 'NOT eligible', 'N/A', 'Blue H₂ excluded from RFNBO label — can\'t access EU H₂ Bank premium'],
                  ['EU Hydrogen Standard (low-carbon)', 'EU', 'Eligible (proposed)', '≥ 70% vs fossil baseline', 'Separate "low-carbon" certification — not RFNBO'],
                  ['UK Low Carbon H₂ Standard', 'UK', 'Eligible (blue)', '< 20 gCO2/MJ (≈2.4 kg/kgH2)', 'Blue H₂ accesses UK HAR/production subsidy'],
                  ['IRA §45V', 'USA', 'Partially eligible', 'Must be < 4 kgCO2/kgH2', 'Tier 4 credit $0.60/kg — low versus green'],
                  ['Japan GX Strategy', 'Japan', 'Supported (blue+green)', 'Lifecycle assessment required', 'Blue NH₃ from Australia/Canada targeted'],
                  ['ISO 19870', 'ISO/Global', 'Included', 'Methodology-neutral', 'Well-to-gate LCA standard — neutral on colour'],
                ].map(([pol, jur, treat, thresh, impl], i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 ? T.bg : T.card }}>
                    <td style={{ padding: '6px 8px', fontWeight: 600 }}>{pol}</td>
                    <td style={{ padding: '6px 8px', color: T.sub }}>{jur}</td>
                    <td style={{ padding: '6px 8px', color: treat.includes('NOT') ? T.red : T.green }}>{treat}</td>
                    <td style={{ padding: '6px 8px', fontFamily: 'monospace', fontSize: 10 }}>{thresh}</td>
                    <td style={{ padding: '6px 8px', fontSize: 10, color: T.sub }}>{impl}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 8 — TECHNOLOGY OUTLOOK */}
      {tab === 8 && (
        <div style={sectionStyle}>
          <div style={gridStyle}>
            <div style={cardStyle}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Multi-Criteria Route Assessment</div>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="axis" tick={{ fontSize: 9 }} />
                  <Radar name="SMR+CCS" dataKey="SMR_CCS" stroke={T.blue} fill={T.blue} fillOpacity={0.15} />
                  <Radar name="ATR+CCS" dataKey="ATR_CCS" stroke={T.green} fill={T.green} fillOpacity={0.15} />
                  <Radar name="Pyrolysis" dataKey="Pyrolysis" stroke={T.purple} fill={T.purple} fillOpacity={0.15} />
                  <Radar name="Green" dataKey="Green" stroke={T.teal} fill={T.teal} fillOpacity={0.15} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Methane Pyrolysis — Deep Dive</div>
              {[
                { item: 'Process', value: 'CH₄ → C + 2H₂ (endothermic, 75 kJ/mol)' },
                { item: 'Carbon product', value: 'Carbon black / graphite / CNTs' },
                { item: 'Carbon market value', value: '$500–3,000/t (carbon black specialty)' },
                { item: 'Net GHG (with green elec)', value: '< 1 kgCO2eq/kgH2' },
                { item: 'Energy input', value: '~18 kWh/kgH2 (thermal + electric)' },
                { item: 'TRL status (2025)', value: '6 — BASF C2H₂ process at pilot' },
                { item: 'Key developers', value: 'BASF, Monolith, C-Zero, Hazer' },
                { item: 'LCOH range (2030)', value: '€2.0–3.5/kg (gas + electricity dep.)' },
                { item: 'Methane slip concern', value: 'Still exists if NG supply chain leaks' },
                { item: 'Key challenge', value: 'Carbon quality/market size at scale' },
              ].map((r, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.border}`, fontSize: 11 }}>
                  <span style={{ color: T.sub }}>{r.item}</span>
                  <span style={{ fontWeight: 600, maxWidth: '55%', textAlign: 'right' }}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 9 — INVESTMENT SCREENING */}
      {tab === 9 && (
        <div style={sectionStyle}>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Blue Hydrogen Investment Screening Framework</div>
            <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.bg }}>
                  {['Criterion', 'Red Flag', 'Amber', 'Green', 'Current Project'].map(h => (
                    <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: T.sub, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Capture rate', '< 55%', '55–85%', '> 85%', `${captureRate}%`],
                  ['Methane slip', '> 2%', '0.5–2%', '< 0.5%', `${methaneSlip}%`],
                  ['Carbon intensity', '> 7 kgCO2/kgH2', '2–7', '< 2', `${carbonIntensity} kgCO2/kgH2`],
                  ['Gas price sensitivity', 'TTF > €60/MWh', '€30–60/MWh', '< €30/MWh', `${gasPrice} €/MWh`],
                  ['CO2 storage secured', 'No contract', 'MOU only', 'Binding T&S contract', co2TransStore > 0 ? 'T&S costed' : 'None'],
                  ['Policy clarity', 'RFNBO excluded (EU)', 'UK/Japan subsidy', 'Multi-regime access', 'Jurisdiction-dep.'],
                ].map(([crit, red, amb, green, curr], i) => {
                  const color = green.includes(String(carbonIntensity)) || curr.includes('costed') ? T.green : T.amber;
                  return (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 ? T.bg : T.card }}>
                      <td style={{ padding: '6px 8px', fontWeight: 600 }}>{crit}</td>
                      <td style={{ padding: '6px 8px', color: T.red, fontSize: 10 }}>{red}</td>
                      <td style={{ padding: '6px 8px', color: T.amber, fontSize: 10 }}>{amb}</td>
                      <td style={{ padding: '6px 8px', color: T.green, fontSize: 10 }}>{green}</td>
                      <td style={{ padding: '6px 8px', fontFamily: 'monospace', fontWeight: 700 }}>{curr}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <EnergyAdvancedAnalytics T={T} moduleCode="EP-DS5" title="Blue H2 + CCS — MC LCOH, Tornado & NGFS Carbon Price Scenarios"
        mcModel={{ title: 'MC Blue H2 LCOH ($/kg)', unit: '/kg', fmt: (n) => `$${n.toFixed(2)}`,
        vars: { gas: { min: 3.0, mode: 6.5, max: 12.0 }, captureRate: { min: 0.85, mode: 0.95, max: 0.99 }, ccsCost: { min: 35, mode: 60, max: 95 }, methSlip: { min: 0.005, mode: 0.015, max: 0.035 } },
        compute: (v) => { const gasCost = v.gas * 0.185; const co2Gross = 9.3; const co2Captured = co2Gross * v.captureRate; const ccs = (co2Captured * v.ccsCost) / 1000; const slipGwp100 = v.methSlip * 30 * 0.005; return gasCost + ccs + 0.5 + slipGwp100; } }}
      tornadoModel={{ title: 'Tornado — Blue LCOH Drivers', unit: '/kg', fmt: (n) => `$${n.toFixed(2)}`,
        inputs: { gas: 6.5, captureRate: 0.95, ccsCost: 60, methSlip: 0.015 },
        compute: (v) => { const gasCost = v.gas * 0.185; const co2Gross = 9.3; const co2Captured = co2Gross * v.captureRate; const ccs = (co2Captured * v.ccsCost) / 1000; const slipGwp100 = v.methSlip * 30 * 0.005; return gasCost + ccs + 0.5 + slipGwp100; } }}
      scenarioImpact={(p) => 1.8 + 0.003 * Math.max(0, p - 30)} scenarioFmt={(v) => `$${v.toFixed(2)}/kg`}
      scenarioTitle="Carbon Price × NGFS Pathway — Blue H2 LCOH including uncaptured CO2 cost"
      peers={{ cols: [{ k: 'route', label: 'Route' }, { k: 'eff', label: 'Eff (%)', fmt: (v) => `${v}%` }, { k: 'cap', label: 'Capture (%)', fmt: (v) => `${v}%` }, { k: 'lcoh', label: 'LCOH ($/kg)', fmt: (v) => `$${v.toFixed(2)}` }, { k: 'int', label: 'Intensity (kgCO2/kgH2)', fmt: (v) => `${v.toFixed(1)}` }],
        rows: [{ route: 'SMR + CCS',     eff: 72, cap: 90, lcoh: 2.10, int: 1.0 }, { route: 'ATR + CCS',     eff: 78, cap: 95, lcoh: 1.95, int: 0.6 }, { route: 'POX + CCS',     eff: 71, cap: 92, lcoh: 2.20, int: 0.8 }, { route: 'SMR (no CCS)',  eff: 72, cap: 0,  lcoh: 1.60, int: 9.3 }, { route: 'Methane pyrolysis', eff: 58, cap: 0, lcoh: 2.80, int: 0.1 }, { route: 'Blue NH3 → H2',  eff: 68, cap: 90, lcoh: 2.50, int: 1.2 }] }}
      />
    </div>
  );
}
