import React, { useState, useMemo } from 'react';
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

// ── Physics constants ─────────────────────────────────────────────────────────
const LHV_H2   = 33.3;   // kWh/kg
const HHV_H2   = 39.4;   // kWh/kg
const DENSITY_LIQUID_H2 = 70.8;   // kg/m³ at -253°C
const DENSITY_700BAR    = 39.0;   // kg/m³ at 700 bar
const DENSITY_350BAR    = 23.5;   // kg/m³ at 350 bar
const NH3_H2_RATIO      = 0.178;  // kg H2 / kg NH3

// ── Storage modalities ────────────────────────────────────────────────────────
const STORAGE_MODES = [
  {
    id: 'CGH2_350', label: 'Compressed GH₂ — 350 bar',
    energyDensityKg: DENSITY_350BAR, // kg/m³
    capexPerKg: 700, opexPct: 2, compressionKwh: 2.2,
    boilOff: 0, roundTrip: 0.92, trl: 9, color: T.blue,
    useCase: 'Fuel cell vehicles, small buffer',
    pros: ['Simple', 'Mature', 'Fast fill'], cons: ['Low density', 'Large tanks']
  },
  {
    id: 'CGH2_700', label: 'Compressed GH₂ — 700 bar',
    energyDensityKg: DENSITY_700BAR,
    capexPerKg: 1100, opexPct: 2.5, compressionKwh: 3.2,
    boilOff: 0, roundTrip: 0.88, trl: 9, color: T.indigo,
    useCase: 'Cars, buses, urban mobility',
    pros: ['High density vs 350 bar', 'Established refuelling'], cons: ['High compression energy', 'Expensive vessels']
  },
  {
    id: 'LH2', label: 'Liquid H₂ (LH₂)',
    energyDensityKg: DENSITY_LIQUID_H2,
    capexPerKg: 1800, opexPct: 3, compressionKwh: 11.5,
    boilOff: 0.3, roundTrip: 0.78, trl: 8, color: T.teal,
    useCase: 'Shipping, aviation, large-scale import terminals',
    pros: ['Highest volumetric density', 'Ship-ready'], cons: ['Boil-off losses', 'Liquefaction energy']
  },
  {
    id: 'LOHC', label: 'LOHC — Dibenzyltoluene',
    energyDensityKg: 6.2, // kg H2 per 100 kg LOHC (6.2 wt%)
    capexPerKg: 900, opexPct: 3.5, compressionKwh: 8.0,
    boilOff: 0, roundTrip: 0.70, trl: 7, color: T.amber,
    useCase: 'Long-distance shipping, re-use of existing oil infrastructure',
    pros: ['Ambient T/P', 'No boil-off', 'Existing ships'], cons: ['Low wt%, high release energy', 'DBT cost']
  },
  {
    id: 'NH3', label: 'Ammonia (NH₃) Cracking',
    energyDensityKg: 120, // kg/m³ liquid NH3 → effective H2: 120 × 0.178 = 21.4 kg H2/m³
    capexPerKg: 600, opexPct: 2.8, compressionKwh: 6.5,
    boilOff: 0.05, roundTrip: 0.65, trl: 8, color: T.green,
    useCase: 'Fertiliser industry, power generation, import corridors',
    pros: ['High density', 'Existing infrastructure', 'Direct use fuel'], cons: ['Cracking energy', 'NOₓ risk', 'Toxicity']
  },
  {
    id: 'CAVERN', label: 'Geological Storage (Salt Cavern)',
    energyDensityKg: 25, // variable, kg/m³ at 200 bar
    capexPerKg: 0.5, opexPct: 1, compressionKwh: 2.0,
    boilOff: 0.01, roundTrip: 0.96, trl: 8, color: T.sage,
    useCase: 'Grid balancing, seasonal storage, pipeline buffer',
    pros: ['Low cost/kWh', 'Massive scale', 'High cycles'], cons: ['Geography limited', 'H2 purity']
  },
];

// ── Transport corridors ────────────────────────────────────────────────────────
const CORRIDORS = [
  { id: 'Chile-EU',    from: 'Patagonia, Chile', to: 'Hamburg, Germany', distKm: 12800, mode: 'Ship (LH₂)', lcohTransport: 1.20, color: T.blue },
  { id: 'Morocco-EU',  from: 'Agadir, Morocco',  to: 'Rotterdam, NL',   distKm: 3200,  mode: 'Pipeline', lcohTransport: 0.35, color: T.green },
  { id: 'Australia-JP',from: 'Pilbara, WA',       to: 'Kobe, Japan',     distKm: 7800,  mode: 'Ship (NH₃)', lcohTransport: 0.90, color: T.amber },
  { id: 'Saudi-EU',    from: 'NEOM, KSA',         to: 'Marseille, FR',   distKm: 5600,  mode: 'Pipeline (proposed)', lcohTransport: 0.60, color: T.teal },
  { id: 'Namibia-EU',  from: 'Lüderitz, Namibia', to: 'Rotterdam, NL',   distKm: 8400,  mode: 'Ship (NH₃/LOHC)', lcohTransport: 1.00, color: T.indigo },
  { id: 'Norway-EU',   from: 'Bergen, Norway',     to: 'Denmark',         distKm: 800,   mode: 'Pipeline', lcohTransport: 0.18, color: T.purple },
  { id: 'US-EU',       from: 'Gulf Coast, USA',   to: 'Rotterdam, NL',   distKm: 8900,  mode: 'Ship (NH₃/LH₂)', lcohTransport: 1.10, color: T.red },
  { id: 'Oman-India',  from: 'Sohar, Oman',        to: 'Nhava Sheva, IN', distKm: 1900,  mode: 'Ship (NH₃)', lcohTransport: 0.55, color: T.sage },
];

// ── Pipeline economics ────────────────────────────────────────────────────────
function pipelineCost(distKm, flowMtpa, diaDm) {
  const capexPerKm = 3.2 + 0.8 * diaDm; // M€/km
  const totalCapex = capexPerKm * distKm;
  const annualFlow = flowMtpa * 1e9 / 8760; // kg/hr
  const annualTonne = flowMtpa * 1000; // t/yr
  const annuity = totalCapex * 1e6 * 0.08 / (1 - Math.pow(1.08, -30));
  return annuity / Math.max(1, annualTonne * 1e3); // €/kg
}

function shippingCost(distKm, mode) {
  const base = { 'LH₂': 0.08, 'NH₃': 0.04, 'LOHC': 0.06 }[mode] || 0.05;
  return base + distKm * 0.00005;
}

function totalStorageCostPerKg(mode, capacityKg) {
  return mode.capexPerKg + (mode.opexPct / 100 * mode.capexPerKg * 20); // 20yr NPV
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
  'Storage Comparison', 'Pipeline Economics', 'Shipping Routes', 'LOHC & NH₃ Deep-Dive',
  'Import Terminal Model', 'Corridor Cost Stack', 'Infrastructure Map', 'Supply Chain Risk',
  'Technology Radar', 'Regulatory & Safety'
];

export default function HydrogenStorageTransportPage() {
  const [tab, setTab] = useState(0);
  const [selectedMode, setSelectedMode] = useState('LH2');
  const [distKm, setDistKm] = useState(5000);
  const [flowMtpa, setFlowMtpa] = useState(0.5);
  const [diaDm, setDiaDm] = useState(3);
  const [termCapacity, setTermCapacity] = useState(50000); // tonnes H2
  const [loaFactor, setLoaFactor] = useState(80);

  const mode = STORAGE_MODES.find(m => m.id === selectedMode) || STORAGE_MODES[0];

  // Transport cost comparison
  const transportComparison = useMemo(() => {
    return STORAGE_MODES.slice(0, 5).map(m => ({
      name: m.id.replace('CGH2_', 'CGH₂ ').replace('_', ' '),
      capex: m.capexPerKg,
      opex20yr: (m.opexPct / 100 * m.capexPerKg * 20).toFixed(0),
      compressionCost: +(m.compressionKwh * 0.06).toFixed(2), // €60/MWh electricity
      boilOffCost: +(m.boilOff * 4.0 * 30).toFixed(2), // 30 day journey
      color: m.color
    }));
  }, []);

  // Pipeline cost vs distance
  const pipelineSensData = useMemo(() => Array.from({ length: 10 }, (_, i) => ({
    dist: (i + 1) * 1000,
    pipeline_05: +pipelineCost((i + 1) * 1000, 0.5, 3).toFixed(3),
    pipeline_2:  +pipelineCost((i + 1) * 1000, 2.0, 5).toFixed(3),
    pipeline_5:  +pipelineCost((i + 1) * 1000, 5.0, 8).toFixed(3),
  })), []);

  // Import terminal economics
  const terminalData = useMemo(() => {
    const capexTerminal = termCapacity * 0.5; // €0.5M per tonne capacity = M€
    const annuity = capexTerminal * 1e6 * 0.08 / (1 - Math.pow(1.08, -30));
    const annualThroughput = termCapacity * (loaFactor / 100) * 12; // tonnes/yr
    const costPerKg = annuity / Math.max(1, annualThroughput * 1000);
    return { capexM: (capexTerminal).toFixed(0), annualThroughput: (annualThroughput / 1000).toFixed(1), costPerKg: costPerKg.toFixed(3) };
  }, [termCapacity, loaFactor]);

  // Full supply chain cost stack
  const stackData = useMemo(() => CORRIDORS.map((c, i) => {
    const prodCost = 2.5 + sr(i * 17) * 2.0;
    const storeCost = 0.3 + sr(i * 11) * 0.4;
    const transpCost = c.lcohTransport;
    const regas = c.mode.includes('NH₃') ? 0.5 : c.mode.includes('LH₂') ? 0.4 : c.mode.includes('Pipeline') ? 0.05 : 0.35;
    const total = prodCost + storeCost + transpCost + regas;
    return { name: c.id, Production: +prodCost.toFixed(2), Storage: +storeCost.toFixed(2), Transport: +transpCost.toFixed(2), Regasification: +regas.toFixed(2), Total: +total.toFixed(2) };
  }), []);

  // LOHC cycle data
  const lohcCycleData = useMemo(() => Array.from({ length: 8 }, (_, i) => ({
    step: ['Hydrogenation', 'Cooling', 'Storage', 'Loading', 'Shipping', 'Unloading', 'Dehydrogenation', 'DBT Recovery'][i],
    energy: [58, 5, 2, 3, 120, 3, 180, 15][i], // kWh/tH2
    temp: [200, 50, 25, 25, 25, 25, 320, 200][i],
    loss: [2, 0.5, 0.2, 0.3, 0.1, 0.3, 8, 1][i],
  })), []);

  // Safety risk matrix
  const safetyRisks = [
    { carrier: 'CGH₂ 700 bar', ignition: 'Very wide range (4–75%)', flammable: 'Yes', toxic: 'No', riskScore: 6, mitigation: 'Pressure relief devices, ATEX zoning' },
    { carrier: 'LH₂',         ignition: 'Wide range (4–75%)',       flammable: 'Yes', toxic: 'No', riskScore: 7, mitigation: 'Double-walled insulated vessels, boil-off management' },
    { carrier: 'NH₃',         ignition: '15–28% (narrow)',          flammable: 'Yes', toxic: 'Yes (IDLH 300ppm)', riskScore: 8, mitigation: 'Scrubbers, PPE, emergency shutdown, HSE zone' },
    { carrier: 'LOHC (DBT)',  ignition: 'Very narrow, high FP',     flammable: 'Low',  toxic: 'Low',  riskScore: 3, mitigation: 'Conventional liquid handling procedures' },
    { carrier: 'NaBH₄',       ignition: 'Narrow (4–75% on release)',flammable: 'Yes', toxic: 'Yes (NaBO₂)', riskScore: 7, mitigation: 'Sealed containers, no moisture contact' },
  ];

  // Infrastructure radar
  const infraRadar = STORAGE_MODES.slice(0, 5).map(m => ({
    name: m.id.replace('CGH2_', 'CGH₂'),
    Density: Math.min(100, m.energyDensityKg * 1.5),
    RoundTrip: m.roundTrip * 100,
    Cost: 100 - Math.min(99, m.capexPerKg / 20),
    TRL: m.trl * 10,
    SafetyScore: [70, 65, 60, 85, 55][STORAGE_MODES.slice(0, 5).indexOf(m)],
    InfraMaturity: [90, 88, 55, 40, 75][STORAGE_MODES.slice(0, 5).indexOf(m)],
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
        <div style={{ fontSize: 11, color: T.accent, fontFamily: 'monospace', marginBottom: 4 }}>EP-DS2 · GREEN HYDROGEN FINANCE</div>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Hydrogen Storage & Transport Economics Engine</h1>
        <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>CGH₂ · LH₂ · LOHC · NH₃ · Pipeline · Shipping · Import Terminals · 10 Tabs</div>
      </div>
      <div style={tabBarStyle}>
        {TABS.map((t, i) => <div key={i} style={tabStyle(tab === i)} onClick={() => setTab(i)}>{t}</div>)}
      </div>

      {/* TAB 0 — STORAGE COMPARISON */}
      {tab === 0 && (
        <div style={sectionStyle}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <KpiCard label="Selected Mode" value={mode.id} unit={mode.label.split('—')[1]?.trim()} color={mode.color} />
            <KpiCard label="Volumetric Density" value={mode.energyDensityKg} unit="kg H₂/m³" color={T.teal} />
            <KpiCard label="Round-Trip Efficiency" value={`${(mode.roundTrip * 100).toFixed(0)}%`} unit="inc. compression" color={mode.roundTrip > 0.85 ? T.green : mode.roundTrip > 0.70 ? T.amber : T.red} />
            <KpiCard label="Capex" value={mode.capexPerKg} unit="€/kg H₂ capacity" color={T.navy} />
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {STORAGE_MODES.map(m => (
              <button key={m.id} onClick={() => setSelectedMode(m.id)}
                style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: `1px solid ${selectedMode === m.id ? m.color : T.border}`, background: selectedMode === m.id ? m.color : 'transparent', color: selectedMode === m.id ? '#fff' : T.sub, cursor: 'pointer' }}>
                {m.id.replace('CGH2_', 'CGH₂ ').replace('_', '')}
              </button>
            ))}
          </div>
          <div style={gridStyle}>
            {STORAGE_MODES.map((m, i) => (
              <div key={m.id} style={{ ...cardStyle, borderTop: `3px solid ${m.color}`, cursor: 'pointer' }} onClick={() => setSelectedMode(m.id)}>
                <div style={{ fontSize: 12, fontWeight: 700, color: m.color, marginBottom: 8 }}>{m.label}</div>
                <div style={{ fontSize: 11, color: T.sub, marginBottom: 8 }}>{m.useCase}</div>
                <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
                  <tbody>
                    {[
                      ['Vol. density', `${m.energyDensityKg} kg/m³`],
                      ['Capex', `${m.capexPerKg} €/kg cap.`],
                      ['Round-trip eff.', `${(m.roundTrip * 100).toFixed(0)}%`],
                      ['Compression', `${m.compressionKwh} kWh/kg`],
                      ['Boil-off/day', `${m.boilOff}%`],
                      ['TRL', `${m.trl}/9`],
                    ].map(([k, v]) => (
                      <tr key={k} style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '4px 0', color: T.sub }}>{k}</td>
                        <td style={{ padding: '4px 0', fontWeight: 600, textAlign: 'right' }}>{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 10, color: T.green }}>✓ {m.pros.join(' · ')}</div>
                  <div style={{ fontSize: 10, color: T.red, marginTop: 2 }}>✗ {m.cons.join(' · ')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 1 — PIPELINE ECONOMICS */}
      {tab === 1 && (
        <div style={sectionStyle}>
          <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
            <div style={cardStyle}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 14 }}>Pipeline Parameters</div>
              <Slider label="Distance" value={distKm} min={100} max={10000} step={100} onChange={setDistKm} unit=" km" />
              <Slider label="Flow rate" value={flowMtpa} min={0.1} max={10} step={0.1} onChange={setFlowMtpa} unit=" Mtpa H₂" />
              <Slider label="Diameter" value={diaDm} min={1} max={12} step={0.5} onChange={setDiaDm} unit=" dm" />
              <div style={{ marginTop: 12, padding: 12, background: T.bg, borderRadius: 8, fontSize: 11 }}>
                <div style={{ color: T.sub, marginBottom: 6 }}>Cost estimate</div>
                <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: T.accent }}>
                  {pipelineCost(distKm, flowMtpa, diaDm).toFixed(3)} €/kg H₂
                </div>
                <div style={{ color: T.sub, marginTop: 4 }}>
                  Total capex: {((3.2 + 0.8 * diaDm) * distKm).toFixed(0)} M€
                </div>
              </div>
            </div>
            <div>
              <div style={cardStyle}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Pipeline Cost vs Distance — by Flow Rate</div>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={pipelineSensData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="dist" label={{ value: 'km', position: 'insideBottom', offset: -3, fontSize: 10 }} tick={{ fontSize: 10 }} />
                    <YAxis label={{ value: '€/kg H₂', angle: -90, position: 'insideLeft', fontSize: 10 }} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v, n) => [`${v} €/kg`, n]} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Line type="monotone" dataKey="pipeline_05" name="0.5 Mtpa" stroke={T.blue} strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="pipeline_2" name="2 Mtpa" stroke={T.green} strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="pipeline_5" name="5 Mtpa" stroke={T.amber} strokeWidth={2} dot={false} />
                    <ReferenceLine y={0.5} stroke={T.teal} strokeDasharray="4 4" label={{ value: '0.5 €/kg', fontSize: 9, fill: T.teal }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div style={cardStyle}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>H₂ vs Natural Gas Pipeline — Conversion Economics</div>
                <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: T.bg }}>
                      {['Item', 'Natural Gas', 'H₂ (new)', 'H₂ (repurposed NG)'].map(h => (
                        <th key={h} style={{ padding: '6px 10px', textAlign: 'left', color: T.sub, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['CAPEX (€/km, 36\")', '2.8–4.5 M€', '3.2–6.0 M€', '0.6–1.5 M€'],
                      ['Compression ratio', '60–80 bar', '50–100 bar', '50–80 bar'],
                      ['Energy content (vol.)', '10 kWh/m³', '3.3 kWh/m³', '3.3 kWh/m³'],
                      ['Embrittlement risk', 'None', 'High (C steel)', 'Medium (lined)'],
                      ['Compressor OPEX', '1–2% capex', '2–3% capex', '1.5–2.5% capex'],
                      ['Repurpose potential', 'N/A', 'N/A', '40–80% cost saving'],
                    ].map(([k, v1, v2, v3], i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 ? T.bg : T.card }}>
                        <td style={{ padding: '6px 10px', fontWeight: 500 }}>{k}</td>
                        <td style={{ padding: '6px 10px' }}>{v1}</td>
                        <td style={{ padding: '6px 10px', color: T.blue }}>{v2}</td>
                        <td style={{ padding: '6px 10px', color: T.green, fontWeight: 600 }}>{v3}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2 — SHIPPING ROUTES */}
      {tab === 2 && (
        <div style={sectionStyle}>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Global H₂ Export Corridors — Cost & Distance</div>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={CORRIDORS}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="id" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={50} />
                <YAxis yAxisId="left" label={{ value: 'Cost (€/kg)', angle: -90, position: 'insideLeft', fontSize: 10 }} tick={{ fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" label={{ value: 'Distance (km)', angle: 90, position: 'insideRight', fontSize: 10 }} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar yAxisId="left" dataKey="lcohTransport" name="Transport cost (€/kg)" radius={[4, 4, 0, 0]}>
                  {CORRIDORS.map((c, i) => <Cell key={i} fill={c.color} />)}
                </Bar>
                <Line yAxisId="right" type="monotone" dataKey="distKm" name="Distance (km)" stroke={T.amber} strokeWidth={2} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div style={gridStyle}>
            {CORRIDORS.map((c, i) => (
              <div key={c.id} style={{ ...cardStyle, borderLeft: `3px solid ${c.color}` }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: c.color }}>{c.id}</div>
                <div style={{ fontSize: 11, color: T.sub, margin: '4px 0' }}>{c.from} → {c.to}</div>
                <div style={{ fontSize: 11, display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                  <span style={{ color: T.sub }}>Mode</span><span style={{ fontWeight: 600 }}>{c.mode}</span>
                </div>
                <div style={{ fontSize: 11, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: T.sub }}>Distance</span><span style={{ fontFamily: 'monospace' }}>{c.distKm.toLocaleString()} km</span>
                </div>
                <div style={{ fontSize: 11, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: T.sub }}>Transport cost</span><span style={{ fontWeight: 700, color: c.lcohTransport < 0.5 ? T.green : c.lcohTransport < 1 ? T.amber : T.red }}>{c.lcohTransport} €/kg</span>
                </div>
                <div style={{ fontSize: 11, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: T.sub }}>Cost/km</span><span style={{ fontFamily: 'monospace' }}>{(c.lcohTransport / c.distKm * 1000).toFixed(4)} €/kg·1000km</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3 — LOHC & NH₃ DEEP-DIVE */}
      {tab === 3 && (
        <div style={sectionStyle}>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 4 }}>LOHC (Dibenzyltoluene) Full Cycle Energy Budget</div>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 14 }}>Per tonne H₂ delivered — Hydrogenation (200°C) → Ship → Dehydrogenation (320°C). Overall efficiency ≈ 70%</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={lohcCycleData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="step" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={55} />
                <YAxis label={{ value: 'kWh/tH2', angle: -90, position: 'insideLeft', fontSize: 10 }} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => [`${v} kWh/tH₂`]} />
                <Bar dataKey="energy" name="Energy input" fill={T.amber} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={gridStyle}>
            <div style={cardStyle}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.amber, marginBottom: 12 }}>LOHC vs LH₂ vs NH₃ — Key Metrics</div>
              <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: T.bg }}>
                    {['Metric', 'LOHC', 'LH₂', 'NH₃'].map(h => <th key={h} style={{ padding: '5px 8px', textAlign: 'left', color: T.sub, borderBottom: `1px solid ${T.border}` }}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['H₂ wt%', '6.2%', '100%', '17.8%'],
                    ['Volumetric H₂ density', '57 g/L', '70.8 g/L', '121 g/L'],
                    ['Carrier storage T', '25°C', '-253°C', '-33°C'],
                    ['Carrier storage P', '1 bar', '1 bar', '8 bar'],
                    ['Release energy', '45 kJ/mol H₂', 'Boil-off 0.3%/d', '30.6 kJ/mol H₂'],
                    ['Existing ship fleet', '~300 (oil tankers)', '2 (demo)', '~800 (NH₃ tankers)'],
                    ['Toxicity', 'Low', 'None', 'High (IDLH 300 ppm)'],
                    ['Direct use as fuel', 'No (cracking needed)', 'Yes', 'Yes (ship/power)'],
                    ['2030 cost estimate', '0.8–1.2 €/kg', '0.6–1.0 €/kg', '0.5–0.9 €/kg'],
                  ].map(([k, v1, v2, v3], i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 ? T.bg : T.card }}>
                      <td style={{ padding: '5px 8px', color: T.sub }}>{k}</td>
                      <td style={{ padding: '5px 8px' }}>{v1}</td>
                      <td style={{ padding: '5px 8px' }}>{v2}</td>
                      <td style={{ padding: '5px 8px' }}>{v3}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.green, marginBottom: 12 }}>Ammonia as H₂ Vector — Cracking Economics</div>
              {[
                { label: 'NH₃ cracking temperature', value: '400–600°C (with catalyst)' },
                { label: 'Cracking energy', value: '~30 kWh/kgH₂ (12% of LHV)' },
                { label: 'Conversion efficiency', value: '~88% (LHV basis)' },
                { label: 'Residual NH₃ in H₂', value: '< 1 ppm (PEMFC ready)' },
                { label: 'Catalyst (Ru/Fe on Al₂O₃)', value: '500–2,000 h lifetime' },
                { label: 'Cracker capex (at scale)', value: '€400–600/kW H₂' },
                { label: 'NH₃ synthesis route', value: 'Haber-Bosch (80 bar, 450°C)' },
                { label: 'Green NH₃ LCOA 2030', value: '€350–550/t (IRENA est.)' },
                { label: 'Direct use (SOFC)', value: '40–50% electrical efficiency' },
              ].map((r, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.border}`, fontSize: 11 }}>
                  <span style={{ color: T.sub }}>{r.label}</span>
                  <span style={{ fontWeight: 600, color: T.navy }}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4 — IMPORT TERMINAL MODEL */}
      {tab === 4 && (
        <div style={sectionStyle}>
          <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
            <div style={cardStyle}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 14 }}>Terminal Parameters</div>
              <Slider label="Tank capacity" value={termCapacity} min={5000} max={200000} step={5000} onChange={setTermCapacity} unit=" t H₂" />
              <Slider label="Load factor" value={loaFactor} min={40} max={95} step={5} onChange={setLoaFactor} unit="%" />
              <div style={{ marginTop: 14 }}>
                <div style={{ padding: 12, background: T.bg, borderRadius: 8, fontSize: 11, marginBottom: 10 }}>
                  <div style={{ color: T.sub, marginBottom: 4 }}>Terminal capex</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: T.navy }}>{terminalData.capexM} M€</div>
                </div>
                <div style={{ padding: 12, background: T.bg, borderRadius: 8, fontSize: 11, marginBottom: 10 }}>
                  <div style={{ color: T.sub, marginBottom: 4 }}>Annual throughput</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: T.navy }}>{terminalData.annualThroughput} kt H₂/yr</div>
                </div>
                <div style={{ padding: 12, background: T.bg, borderRadius: 8, fontSize: 11 }}>
                  <div style={{ color: T.sub, marginBottom: 4 }}>Regasification cost</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: T.accent }}>{terminalData.costPerKg} €/kg</div>
                </div>
              </div>
            </div>
            <div>
              <div style={cardStyle}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Key European Import Terminal Projects (2025–2030)</div>
                <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: T.bg }}>
                      {['Terminal', 'Location', 'Capacity (GW)', 'Mode', 'Status', '1st Gas'].map(h => (
                        <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: T.sub, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['HH2-Rotterdam', 'Port of Rotterdam', '4 GW e-H₂', 'NH₃/LH₂', 'FID 2025', '2027'],
                      ['H2Morrow', 'Brunsbüttel, DE', '2 GW', 'NH₃', 'Permitting', '2028'],
                      ['Hydrogen Backbone', 'Hamburg, DE', '1 GW', 'Pipeline', 'Under Construction', '2026'],
                      ['GreenH', 'Marseille, FR', '1.5 GW', 'NH₃/LOHC', 'Front-End Design', '2029'],
                      ['Porthos/Aramis', 'Rotterdam, NL', '3 GW', 'Pipeline', 'FID 2024', '2026'],
                      ['Newcastle H₂', 'NE England, UK', '0.5 GW', 'LH₂', 'Pre-FEED', '2030'],
                    ].map(([name, loc, cap, mode, status, gas], i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 ? T.bg : T.card }}>
                        <td style={{ padding: '6px 8px', fontWeight: 600 }}>{name}</td>
                        <td style={{ padding: '6px 8px', color: T.sub }}>{loc}</td>
                        <td style={{ padding: '6px 8px', fontFamily: 'monospace' }}>{cap}</td>
                        <td style={{ padding: '6px 8px' }}>{mode}</td>
                        <td style={{ padding: '6px 8px', color: status.includes('Under') ? T.green : status.includes('FID') ? T.teal : T.amber }}>{status}</td>
                        <td style={{ padding: '6px 8px', fontWeight: 700 }}>{gas}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={cardStyle}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Regasification Cost by Carrier & Scale</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={[
                    { mode: 'LH₂ (0.5 Mtpa)', cost: 0.42 },
                    { mode: 'LH₂ (2 Mtpa)', cost: 0.28 },
                    { mode: 'NH₃ (0.5 Mtpa)', cost: 0.52 },
                    { mode: 'NH₃ (2 Mtpa)', cost: 0.32 },
                    { mode: 'LOHC (0.5 Mtpa)', cost: 0.65 },
                    { mode: 'LOHC (2 Mtpa)', cost: 0.45 },
                    { mode: 'Pipeline', cost: 0.05 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="mode" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={55} />
                    <YAxis label={{ value: '€/kg H₂', angle: -90, position: 'insideLeft', fontSize: 10 }} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v) => [`${v} €/kg`, 'Regasification']} />
                    <Bar dataKey="cost" fill={T.teal} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5 — CORRIDOR COST STACK */}
      {tab === 5 && (
        <div style={sectionStyle}>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 4 }}>Full Supply Chain Cost Stack — Production to Delivery (€/kg H₂)</div>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 14 }}>Stacked bar: Production + Storage + Transport + Regasification = Delivered LCOH at import hub</div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stackData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis label={{ value: '€/kg H₂', angle: -90, position: 'insideLeft', fontSize: 10 }} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v, n) => [`${v} €/kg`, n]} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <ReferenceLine y={3} stroke={T.green} strokeDasharray="4 4" label={{ value: 'EU target', fontSize: 9, fill: T.green }} />
                <Bar dataKey="Production" stackId="a" fill={T.blue} />
                <Bar dataKey="Storage" stackId="a" fill={T.teal} />
                <Bar dataKey="Transport" stackId="a" fill={T.amber} />
                <Bar dataKey="Regasification" stackId="a" fill={T.red} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Corridor Economics Table</div>
            <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.bg }}>
                  {['Corridor', 'Mode', 'Production', 'Storage', 'Transport', 'Regas', 'Total'].map(h => (
                    <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: T.sub, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stackData.map((d, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 ? T.bg : T.card }}>
                    <td style={{ padding: '6px 8px', fontWeight: 600 }}>{d.name}</td>
                    <td style={{ padding: '6px 8px', fontSize: 10, color: T.sub }}>{CORRIDORS[i]?.mode}</td>
                    <td style={{ padding: '6px 8px', fontFamily: 'monospace' }}>{d.Production}</td>
                    <td style={{ padding: '6px 8px', fontFamily: 'monospace' }}>{d.Storage}</td>
                    <td style={{ padding: '6px 8px', fontFamily: 'monospace' }}>{d.Transport}</td>
                    <td style={{ padding: '6px 8px', fontFamily: 'monospace' }}>{d.Regasification}</td>
                    <td style={{ padding: '6px 8px', fontFamily: 'monospace', fontWeight: 700, color: d.Total < 4 ? T.green : d.Total < 6 ? T.amber : T.red }}>{d.Total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6 — INFRASTRUCTURE MAP */}
      {tab === 6 && (
        <div style={sectionStyle}>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Hydrogen Infrastructure Development Timeline</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {['2025–2026', '2027–2028', '2029–2030', '2030+'].map((period, pi) => (
                <div key={period} style={{ padding: 14, background: T.bg, borderRadius: 8, border: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.accent, marginBottom: 10 }}>{period}</div>
                  {[
                    [['First EU-scale electrolysers (100 MW+)', 'Ammonia import pilot terminals', 'IPCEI Hydrogen network segments'],
                     ['German H₂ backbone (northern route)', 'Rotterdam LH₂ terminal FID', 'Chile-EU shipping pilot'],
                     ['Pan-European H₂ backbone (5,500 km)', 'Maghreb pipeline hydrogen blend', 'Australia-Japan NH₃ at scale'],
                     ['Full European H₂ network (40,000 km)', 'Global H₂ commodity market', 'Offshore H₂ production clusters']][pi]
                  ][0].map((item, ii) => (
                    <div key={ii} style={{ fontSize: 10, color: T.text, display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 6 }}>
                      <span style={{ color: T.teal, flexShrink: 0 }}>▶</span><span>{item}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>European H₂ Backbone — Key Routes</div>
            <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.bg }}>
                  {['Route', 'Length (km)', 'Capacity (GW)', 'New/Repurposed', 'Operator', 'Status'].map(h => (
                    <th key={h} style={{ padding: '5px 8px', textAlign: 'left', color: T.sub, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['North Sea → Hamburg',     '900',  '10', '60% repurposed', 'TenneT/Gasunie',  'Planned 2028'],
                  ['Rotterdam → Antwerp',     '500',  '8',  '80% repurposed', 'Fluxys/Gasunie',  'FID 2025'],
                  ['Iberian Peninsula → FR', '1,800', '15', '40% repurposed', 'Enagas/Teréga',   'Planned 2030'],
                  ['Morocco → Spain (HVDC+H₂)', '800','5',  'New subsea',      'H2Med consortium','Planned 2030'],
                  ['Baltic Sea – NEMO',      '1,200', '6',  '70% repurposed', 'Gascade/Eustream','Study phase'],
                  ['Italy – SoutH2 Corridor', '3,300','10', '90% repurposed', 'Snam',             'Planned 2030'],
                ].map(([route, len, cap, type, op, status], i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 ? T.bg : T.card }}>
                    <td style={{ padding: '5px 8px', fontWeight: 500 }}>{route}</td>
                    <td style={{ padding: '5px 8px', fontFamily: 'monospace' }}>{len}</td>
                    <td style={{ padding: '5px 8px', fontFamily: 'monospace' }}>{cap}</td>
                    <td style={{ padding: '5px 8px', color: type.includes('repurposed') ? T.green : T.blue }}>{type}</td>
                    <td style={{ padding: '5px 8px', color: T.sub }}>{op}</td>
                    <td style={{ padding: '5px 8px', color: status.includes('FID') ? T.green : T.amber }}>{status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7 — SUPPLY CHAIN RISK */}
      {tab === 7 && (
        <div style={sectionStyle}>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Supply Chain Risk Scoring — Key H₂ Export Nations</div>
            <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.bg }}>
                  {['Country', 'H₂ Potential', 'Political Risk', 'Infrastructure', 'Offtake Security', 'Overall Score'].map(h => (
                    <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: T.sub, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Australia',      9, 2, 6, 8, 8],
                  ['Chile',          9, 3, 5, 6, 7],
                  ['Saudi Arabia',   9, 4, 8, 7, 8],
                  ['Morocco',        8, 4, 5, 7, 7],
                  ['Namibia',        8, 3, 3, 5, 6],
                  ['Norway',         7, 1, 8, 9, 9],
                  ['Kazakhstan',     7, 6, 4, 5, 5],
                  ['USA (Gulf)',     9, 2, 8, 8, 9],
                ].map(([country, pot, polRisk, infra, offtake, overall], i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 ? T.bg : T.card }}>
                    <td style={{ padding: '6px 8px', fontWeight: 600 }}>{country}</td>
                    <td style={{ padding: '6px 8px' }}>{'★'.repeat(pot)}</td>
                    <td style={{ padding: '6px 8px', color: polRisk <= 2 ? T.green : polRisk <= 4 ? T.amber : T.red }}>{polRisk}/10</td>
                    <td style={{ padding: '6px 8px' }}>{infra}/10</td>
                    <td style={{ padding: '6px 8px' }}>{offtake}/10</td>
                    <td style={{ padding: '6px 8px', fontWeight: 700, color: overall >= 8 ? T.green : overall >= 6 ? T.amber : T.red }}>{overall}/10</td>
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
              <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Storage Technology Multi-Dimensional Comparison</div>
              <ResponsiveContainer width="100%" height={320}>
                <RadarChart data={[
                  { axis: 'Density',   CGH2_350: 34, LH2: 100, LOHC: 9, NH3: 30, CAVERN: 36 },
                  { axis: 'RoundTrip', CGH2_350: 92, LH2: 78, LOHC: 70, NH3: 65, CAVERN: 96 },
                  { axis: 'Cost',      CGH2_350: 65, LH2: 10, LOHC: 55, NH3: 70, CAVERN: 97 },
                  { axis: 'TRL',       CGH2_350: 90, LH2: 80, LOHC: 70, NH3: 80, CAVERN: 80 },
                  { axis: 'Safety',    CGH2_350: 70, LH2: 60, LOHC: 85, NH3: 55, CAVERN: 80 },
                  { axis: 'Infra',     CGH2_350: 90, LH2: 55, LOHC: 40, NH3: 75, CAVERN: 60 },
                ]}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10 }} />
                  <Radar name="CGH₂" dataKey="CGH2_350" stroke={T.blue} fill={T.blue} fillOpacity={0.1} />
                  <Radar name="LH₂" dataKey="LH2" stroke={T.teal} fill={T.teal} fillOpacity={0.1} />
                  <Radar name="LOHC" dataKey="LOHC" stroke={T.amber} fill={T.amber} fillOpacity={0.1} />
                  <Radar name="NH₃" dataKey="NH3" stroke={T.green} fill={T.green} fillOpacity={0.1} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Carrier Selection Decision Matrix</div>
              {[
                { use: 'Urban mobility (cars)', best: 'CGH₂ 700 bar', why: 'Fast fill, established HRS network' },
                { use: 'Heavy transport (trucks)', best: 'CGH₂ 700 / LH₂', why: 'Range & density trade-off' },
                { use: 'Shipping decarbonisation', best: 'NH₃ or methanol', why: 'Existing bunker infrastructure' },
                { use: 'Aviation (SAF route)', best: 'LH₂ or e-kerosene', why: 'Volumetric density critical' },
                { use: 'Long-distance H₂ trade', best: 'NH₃ (short/medium), LOHC', why: 'Infrastructure leverage' },
                { use: 'Grid balancing (seasonal)', best: 'Cavern + pipeline', why: 'Lowest cost/kWh at scale' },
                { use: 'Industrial feedstock', best: 'Pipeline H₂', why: 'Direct injection, no conversion' },
                { use: 'Steel DRI', best: 'Pipeline H₂', why: 'Direct reduction no carrier needed' },
              ].map((r, i) => (
                <div key={i} style={{ padding: '8px 0', borderBottom: `1px solid ${T.border}`, fontSize: 11 }}>
                  <div style={{ fontWeight: 600, marginBottom: 2 }}>{r.use}</div>
                  <div style={{ color: T.green, marginBottom: 1 }}>→ {r.best}</div>
                  <div style={{ color: T.sub, fontSize: 10 }}>{r.why}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 9 — REGULATORY & SAFETY */}
      {tab === 9 && (
        <div style={sectionStyle}>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Carrier Safety Profile Comparison</div>
            <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.bg }}>
                  {['Carrier', 'Flammability', 'Toxicity', 'Ignition Range', 'Risk Score', 'Key Mitigation'].map(h => (
                    <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: T.sub, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {safetyRisks.map((r, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 ? T.bg : T.card }}>
                    <td style={{ padding: '6px 8px', fontWeight: 600 }}>{r.carrier}</td>
                    <td style={{ padding: '6px 8px', color: r.flammable === 'Yes' ? T.amber : T.green }}>{r.flammable}</td>
                    <td style={{ padding: '6px 8px', color: r.toxic === 'No' || r.toxic === 'Low' ? T.green : T.red }}>{r.toxic}</td>
                    <td style={{ padding: '6px 8px', fontSize: 10 }}>{r.ignition}</td>
                    <td style={{ padding: '6px 8px', fontWeight: 700, color: r.riskScore <= 4 ? T.green : r.riskScore <= 6 ? T.amber : T.red }}>{r.riskScore}/10</td>
                    <td style={{ padding: '6px 8px', fontSize: 10, color: T.sub }}>{r.mitigation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={gridStyle}>
            <div style={cardStyle}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Key Regulatory Frameworks</div>
              {[
                { reg: 'EU Hydrogen Delegated Acts', scope: 'RFNBO definition & lifecycle GHG (≤3.4 tCO2/tH2)', year: '2023' },
                { reg: 'ADR/RID/ADN (EU)',           scope: 'Road/rail/waterway transport of compressed H₂', year: 'Ongoing' },
                { reg: 'IMDG Code (IMO)',             scope: 'Maritime transport of LH₂, NH₃, LOHC', year: 'Updated 2024' },
                { reg: 'ISO 14687',                  scope: 'H₂ fuel quality specifications (fuel cells)', year: '2019' },
                { reg: 'EN 17124',                   scope: 'H₂ for road vehicles (EU standard)', year: '2022' },
                { reg: 'IRA §45V (USA)',              scope: 'Clean H₂ production tax credit — 4 tiers', year: '2022' },
                { reg: 'ASME BPVC Sect. VIII',        scope: 'Pressure vessel design (700 bar vessels)', year: 'Ongoing' },
                { reg: 'ATEX Directive 2014/34/EU',   scope: 'Equipment in explosive atmospheres', year: '2014' },
              ].map((r, i) => (
                <div key={i} style={{ padding: '7px 0', borderBottom: `1px solid ${T.border}`, fontSize: 11 }}>
                  <div style={{ fontWeight: 600 }}>{r.reg} <span style={{ fontSize: 10, color: T.sub }}>({r.year})</span></div>
                  <div style={{ color: T.sub, marginTop: 2 }}>{r.scope}</div>
                </div>
              ))}
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Insurance & Certification Requirements</div>
              {[
                ['Marine cargo insurance', 'LH₂ ships require specialist P&I cover — limited market'],
                ['NH₃ spill liability', 'Toxic gas plume modelling required for permits'],
                ['Pressure vessel cert.', 'TÜV/Lloyds inspection mandatory for >10 bar vessels'],
                ['H₂ dispensing HRS', 'SAE J2601 protocol required for 700 bar fills'],
                ['Storage cavern', 'Geological survey + aquifer protection EIA required'],
                ['Pipeline operation', 'DVGW G262 (Germany) or equivalent national standard'],
              ].map(([k, v], i) => (
                <div key={i} style={{ padding: '7px 0', borderBottom: `1px solid ${T.border}`, fontSize: 11 }}>
                  <div style={{ fontWeight: 600, color: T.navy }}>{k}</div>
                  <div style={{ color: T.sub, marginTop: 2, fontSize: 10 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
