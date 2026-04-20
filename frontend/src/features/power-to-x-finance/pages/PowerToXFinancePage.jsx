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

// ── Constants ─────────────────────────────────────────────────────────────────
const LHV_H2   = 33.3;   // kWh/kg
const HHV_H2   = 39.4;   // kWh/kg

// ── PtX process efficiencies ──────────────────────────────────────────────────
const PTX_PRODUCTS = [
  {
    id: 'eMethanol', label: 'e-Methanol',
    formula: 'CO₂ + 3H₂ → CH₃OH + H₂O',
    h2Kg: 0.187,   // kg H2 per kg product
    co2Kg: 1.375,  // kg CO2 per kg product
    elecKwh: 1.2,  // additional electricity kWh per kg (compression etc)
    synthesis: 'Methanol synthesis (CRI process, ZnO/Cu catalyst)',
    temp: 250, pressure: 80,
    efficiency: 0.72, capexPerTpa: 850, opexPct: 4,
    lhvKwhPerKg: 5.55,
    markets: ['Chemical feedstock (formaldehyde, acetic acid)', 'Methanol-to-Olefins', 'Marine fuel (blending)', 'DME precursor'],
    price2025: 550,  // €/t market price
    price2030: 400,
    color: T.blue
  },
  {
    id: 'eAmmonia', label: 'e-Ammonia',
    formula: 'N₂ + 3H₂ → 2NH₃',
    h2Kg: 0.178,
    co2Kg: 0,
    elecKwh: 0.6,
    synthesis: 'Haber-Bosch (Fe catalyst, 400–500°C, 150–300 bar)',
    temp: 450, pressure: 200,
    efficiency: 0.68, capexPerTpa: 700, opexPct: 3.5,
    lhvKwhPerKg: 5.17,
    markets: ['Fertiliser (90% global N demand)', 'Marine bunker fuel', 'Power generation (NH₃ turbines)', 'H₂ carrier'],
    price2025: 480,
    price2030: 350,
    color: T.green
  },
  {
    id: 'eSAF', label: 'e-SAF (via FT)',
    formula: 'CO + 2H₂ → (-CH₂-)ₙ + H₂O (FT)',
    h2Kg: 0.31,
    co2Kg: 3.16,
    elecKwh: 1.5,
    synthesis: 'RWGS + Fischer-Tropsch + hydrocracking',
    temp: 250, pressure: 25,
    efficiency: 0.47,
    capexPerTpa: 2400, opexPct: 5,
    lhvKwhPerKg: 11.9,
    markets: ['Aviation decarbonisation (ReFuelEU mandate)', 'CORSIA credits', 'Kerosene blending (up to 50%)'],
    price2025: 2800,
    price2030: 1800,
    color: T.amber
  },
  {
    id: 'eDiesel', label: 'e-Diesel (via FT)',
    formula: 'CO + 2H₂ → CₙH₂ₙ₊₂ (FT-diesel)',
    h2Kg: 0.29,
    co2Kg: 3.05,
    elecKwh: 1.4,
    synthesis: 'Fischer-Tropsch (Co or Fe catalyst, 180–240°C)',
    temp: 220, pressure: 25,
    efficiency: 0.48,
    capexPerTpa: 2200, opexPct: 5,
    lhvKwhPerKg: 11.86,
    markets: ['Heavy transport', 'Military', 'Off-road equipment', 'Marine (blending)'],
    price2025: 3200,
    price2030: 2200,
    color: T.teal
  },
  {
    id: 'eMethane', label: 'e-Methane (SNG)',
    formula: 'CO₂ + 4H₂ → CH₄ + 2H₂O (Sabatier)',
    h2Kg: 0.50,
    co2Kg: 2.75,
    elecKwh: 0.5,
    synthesis: 'Sabatier methanation (Ni catalyst, 250–400°C)',
    temp: 300, pressure: 8,
    efficiency: 0.78,
    capexPerTpa: 500, opexPct: 3,
    lhvKwhPerKg: 13.9,
    markets: ['Gas grid injection (power-to-gas)', 'LNG vessels', 'District heating', 'Industrial fuel'],
    price2025: 700,
    price2030: 500,
    color: T.indigo
  },
  {
    id: 'eMethanol_ship', label: 'e-Methanol (marine)',
    formula: 'Same synthesis as e-Methanol but marine-grade spec',
    h2Kg: 0.187,
    co2Kg: 1.375,
    elecKwh: 1.3,
    synthesis: 'Methanol synthesis + dewatering/purification',
    temp: 250, pressure: 80,
    efficiency: 0.71,
    capexPerTpa: 950, opexPct: 4,
    lhvKwhPerKg: 5.55,
    markets: ['Maersk, CMA CGM ship newbuilds', 'FuelEU Maritime 2025+', 'Retrofit dual-fuel vessels'],
    price2025: 600,
    price2030: 430,
    color: T.purple
  },
];

// ── CO2 source analysis ───────────────────────────────────────────────────────
const CO2_SOURCES = [
  { id: 'DAC',      label: 'Direct Air Capture',        cost2025: 400, cost2030: 200, cost2035: 120, purity: 99.9, scalable: true,  color: T.red },
  { id: 'Biogenic', label: 'Biogenic (fermentation)',    cost2025: 40,  cost2030: 35,  cost2035: 30,  purity: 99.5, scalable: false, color: T.green },
  { id: 'Industrial',label: 'Industrial point source',   cost2025: 30,  cost2030: 25,  cost2035: 22,  purity: 98,   scalable: true,  color: T.blue },
  { id: 'BECCS',    label: 'BECCS (power plant)',        cost2025: 80,  cost2030: 65,  cost2035: 55,  purity: 98.5, scalable: true,  color: T.amber },
  { id: 'Cement',   label: 'Cement kiln CCS',            cost2025: 60,  cost2030: 50,  cost2035: 42,  purity: 97,   scalable: true,  color: T.teal },
];

// ── Market demand projections ──────────────────────────────────────────────────
const YEARS = Array.from({ length: 11 }, (_, i) => 2025 + i);
function demandProjection(base, growthRate, i) {
  return +(base * Math.pow(1 + growthRate, i)).toFixed(1);
}

function calcLcoP({ lcohEur, h2Kg, co2Kg, co2Cost, elecKwh, elecCost, capexPerTpa, opexPct, wacc, lifetime, scale }) {
  const h2Cost     = lcohEur * h2Kg;
  const co2CostKg  = (co2Cost / 1000) * co2Kg;
  const elecCostKg = elecCost / 1000 * elecKwh;
  const capexAnnKg = (capexPerTpa * (wacc / 100) / (1 - Math.pow(1 + wacc / 100, -lifetime)));
  const opexKg     = capexPerTpa * opexPct / 100;
  return +(h2Cost + co2CostKg + elecCostKg + capexAnnKg + opexKg).toFixed(2);
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
  'PtX Product Overview', 'LCOP Calculator', 'CO₂ Source Analysis', 'Fischer-Tropsch Deep-Dive',
  'e-Ammonia Engine', 'Demand Forecasts', 'Price Competitiveness', 'Policy & Mandates',
  'GHG Lifecycle', 'Investment Landscape'
];

export default function PowerToXFinancePage() {
  const [tab, setTab] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState('eMethanol');
  const [lcohEur, setLcohEur] = useState(3.5);
  const [co2Cost, setCo2Cost] = useState(150);
  const [elecCostPtx, setElecCostPtx] = useState(60);
  const [scale, setScale] = useState(50000);
  const [wacc, setWacc] = useState(8);
  const [lifetime, setLifetime] = useState(20);

  const product = PTX_PRODUCTS.find(p => p.id === selectedProduct) || PTX_PRODUCTS[0];

  const lcop = useMemo(() => calcLcoP({
    lcohEur, h2Kg: product.h2Kg, co2Kg: product.co2Kg, co2Cost, elecKwh: product.elecKwh,
    elecCost: elecCostPtx, capexPerTpa: product.capexPerTpa, opexPct: product.opexPct, wacc, lifetime, scale
  }), [product, lcohEur, co2Cost, elecCostPtx, wacc, lifetime, scale]);

  // All product LCOP comparison
  const allLcop = useMemo(() => PTX_PRODUCTS.map(p => ({
    name: p.label.replace('e-', '').replace(' (via FT)', '').replace(' (marine)', '*'),
    LCOP: +calcLcoP({ lcohEur, h2Kg: p.h2Kg, co2Kg: p.co2Kg, co2Cost, elecKwh: p.elecKwh, elecCost: elecCostPtx, capexPerTpa: p.capexPerTpa, opexPct: p.opexPct, wacc, lifetime, scale }).toFixed(0),
    marketPrice: p.price2025,
    color: p.color,
  })), [lcohEur, co2Cost, elecCostPtx, wacc, lifetime, scale]);

  // Demand projections
  const demandData = useMemo(() => YEARS.map((y, i) => ({
    year: y,
    eMethanol: demandProjection(0.3, 0.45, i),
    eAmmonia:  demandProjection(0.1, 0.50, i),
    eSAF:      demandProjection(0.05, 0.60, i),
    eMethane:  demandProjection(0.2, 0.30, i),
  })), []);

  // CO2 cost projection
  const co2Projection = useMemo(() => YEARS.map((y, i) => {
    const result = { year: y };
    CO2_SOURCES.forEach(s => {
      result[s.id] = s.cost2025 + (s.cost2030 - s.cost2025) / 5 * Math.min(i, 5) + (s.cost2035 - s.cost2030) / 5 * Math.max(0, Math.min(i - 5, 5));
    });
    return result;
  }), []);

  // GHG lifecycle data
  const ghgData = PTX_PRODUCTS.map((p, i) => ({
    product: p.label,
    wellToWheel: [65, 55, 48, 45, 80, 60][i],    // % GHG reduction vs fossil
    production:  [22, 18, 45, 43, 15, 24][i],      // gCO2eq/MJ
    transport:   [2, 1, 3, 3, 2, 2][i],
    combustion:  [p.co2Kg > 0 ? 12 : 0, 0, 15, 14, 10, 12][i],
  }));

  // FT product slate
  const ftSlate = [
    { product: 'Naphtha',          pct: 15, use: 'Petrochemical feedstock' },
    { product: 'Kerosene (Jet A-1)',pct: 35, use: 'Aviation SAF blend' },
    { product: 'Diesel',           pct: 35, use: 'Road/marine fuel' },
    { product: 'LPG',              pct: 10, use: 'Heating / cooking' },
    { product: 'Wax / residues',   pct: 5,  use: 'Lubricants / further cracking' },
  ];

  // Cost waterfall for selected product
  const waterfallData = useMemo(() => [
    { name: 'H₂ feedstock', value: +(lcohEur * product.h2Kg).toFixed(2), fill: T.blue },
    { name: 'CO₂ feedstock', value: +((co2Cost / 1000) * product.co2Kg).toFixed(2), fill: T.amber },
    { name: 'Electricity (BOP)', value: +(elecCostPtx / 1000 * product.elecKwh).toFixed(2), fill: T.teal },
    { name: 'Capex (annualised)', value: +(product.capexPerTpa * (wacc / 100) / (1 - Math.pow(1 + wacc / 100, -lifetime))).toFixed(2), fill: T.red },
    { name: 'O&M', value: +(product.capexPerTpa * product.opexPct / 100).toFixed(2), fill: T.indigo },
  ], [product, lcohEur, co2Cost, elecCostPtx, wacc, lifetime]);

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
        <div style={{ fontSize: 11, color: T.accent, fontFamily: 'monospace', marginBottom: 4 }}>EP-DS3 · GREEN HYDROGEN FINANCE</div>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Power-to-X & e-Fuel Production Finance Engine</h1>
        <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>e-Methanol · e-Ammonia · e-SAF · FT Diesel · SNG · Fischer-Tropsch · CO₂ Sourcing · 10 Tabs</div>
      </div>
      <div style={tabBarStyle}>
        {TABS.map((t, i) => <div key={i} style={tabStyle(tab === i)} onClick={() => setTab(i)}>{t}</div>)}
      </div>

      {/* TAB 0 — PRODUCT OVERVIEW */}
      {tab === 0 && (
        <div style={sectionStyle}>
          <div style={gridStyle}>
            {PTX_PRODUCTS.map((p, i) => (
              <div key={p.id} style={{ ...cardStyle, borderTop: `3px solid ${p.color}`, cursor: 'pointer' }} onClick={() => setSelectedProduct(p.id)}>
                <div style={{ fontSize: 13, fontWeight: 700, color: p.color, marginBottom: 4 }}>{p.label}</div>
                <div style={{ fontSize: 10, color: T.sub, fontFamily: 'monospace', marginBottom: 8 }}>{p.formula}</div>
                <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
                  <tbody>
                    {[
                      ['H₂ feedstock', `${(p.h2Kg * 1000).toFixed(0)} kg/t`],
                      ['CO₂ feedstock', p.co2Kg > 0 ? `${p.co2Kg} t/t` : 'None'],
                      ['Synthesis route', p.synthesis.split('(')[0].trim()],
                      ['T / P', `${p.temp}°C / ${p.pressure} bar`],
                      ['Process efficiency', `${(p.efficiency * 100).toFixed(0)}%`],
                      ['CAPEX', `${p.capexPerTpa} €/tpa`],
                      ['LHV', `${p.lhvKwhPerKg} kWh/kg`],
                      ['2025 market price', `${p.price2025} €/t`],
                      ['2030 est. price', `${p.price2030} €/t`],
                    ].map(([k, v]) => (
                      <tr key={k} style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '4px 0', color: T.sub, fontSize: 10 }}>{k}</td>
                        <td style={{ padding: '4px 0', fontWeight: 600, textAlign: 'right', fontSize: 10 }}>{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ marginTop: 10 }}>
                  {p.markets.slice(0, 2).map((m, mi) => (
                    <div key={mi} style={{ fontSize: 10, color: T.sub, marginBottom: 2 }}>▶ {m}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 1 — LCOP CALCULATOR */}
      {tab === 1 && (
        <div style={sectionStyle}>
          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20 }}>
            <div style={cardStyle}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>LCOP Calculator</div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: T.sub, marginBottom: 6 }}>Product</div>
                <select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', fontSize: 11, borderRadius: 6, border: `1px solid ${T.border}`, background: T.bg }}>
                  {PTX_PRODUCTS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
              </div>
              <Slider label="H₂ cost (LCOH)" value={lcohEur} min={1} max={10} step={0.5} onChange={setLcohEur} unit=" €/kg" />
              <Slider label="CO₂ cost" value={co2Cost} min={20} max={600} step={10} onChange={setCo2Cost} unit=" €/t" />
              <Slider label="BOP electricity cost" value={elecCostPtx} min={20} max={150} step={5} onChange={setElecCostPtx} unit=" €/MWh" />
              <Slider label="Scale" value={scale} min={5000} max={500000} step={5000} onChange={setScale} unit=" tpa" />
              <Slider label="WACC" value={wacc} min={3} max={15} step={0.5} onChange={setWacc} unit="%" />
              <Slider label="Lifetime" value={lifetime} min={10} max={30} step={1} onChange={setLifetime} unit=" yrs" />
              <div style={{ marginTop: 14, padding: 12, background: T.bg, borderRadius: 8, fontSize: 11 }}>
                <div style={{ color: T.sub, marginBottom: 4 }}>Levelised Cost of Product</div>
                <div style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 700, color: lcop < product.price2025 ? T.green : T.red }}>{lcop} €/t</div>
                <div style={{ color: T.sub, marginTop: 4, fontSize: 10 }}>Market price: {product.price2025} €/t — {lcop < product.price2025 ? '✓ Competitive' : `Gap: ${(lcop - product.price2025).toFixed(0)} €/t`}</div>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                <KpiCard label="LCOP" value={`${lcop}`} unit="€/t product" color={lcop < product.price2025 ? T.green : T.red} />
                <KpiCard label="Market Price" value={product.price2025} unit="€/t (2025)" color={T.navy} />
                <KpiCard label="Premium" value={`${Math.max(0, lcop - product.price2025).toFixed(0)}`} unit="€/t gap to market" color={T.amber} />
                <KpiCard label="H₂ Share" value={`${((lcohEur * product.h2Kg / lcop) * 100).toFixed(0)}%`} unit="of LCOP" color={T.blue} />
              </div>
              <div style={cardStyle}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Cost Waterfall — {product.label}</div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={waterfallData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={50} />
                    <YAxis label={{ value: '€/t', angle: -90, position: 'insideLeft', fontSize: 10 }} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v) => [`${v} €/t`]} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {waterfallData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={cardStyle}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>All Products — LCOP vs Market Price</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={allLcop}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis label={{ value: '€/t', angle: -90, position: 'insideLeft', fontSize: 10 }} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v, n) => [`${v} €/t`, n]} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Bar dataKey="LCOP" name="LCOP (est.)" radius={[4, 4, 0, 0]}>
                      {allLcop.map((d, i) => <Cell key={i} fill={PTX_PRODUCTS[i]?.color} />)}
                    </Bar>
                    <Bar dataKey="marketPrice" name="Market price" fill={T.sub} opacity={0.5} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2 — CO₂ SOURCE ANALYSIS */}
      {tab === 2 && (
        <div style={sectionStyle}>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 4 }}>CO₂ Source Cost Trajectories (2025–2035)</div>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 14 }}>CO₂ is 20–45% of PtX production cost. Source selection critically impacts lifecycle GHG & economics.</div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={co2Projection}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                <YAxis label={{ value: '€/t CO₂', angle: -90, position: 'insideLeft', fontSize: 10 }} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v, n) => [`${Math.round(v)} €/t`, n]} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                {CO2_SOURCES.map(s => <Line key={s.id} type="monotone" dataKey={s.id} name={s.label} stroke={s.color} strokeWidth={2} dot={false} />)}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={gridStyle}>
            {CO2_SOURCES.map((s, i) => (
              <div key={s.id} style={{ ...cardStyle, borderLeft: `3px solid ${s.color}` }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: s.color, marginBottom: 8 }}>{s.label}</div>
                <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
                  <tbody>
                    {[
                      ['2025 cost', `${s.cost2025} €/t`],
                      ['2030 cost', `${s.cost2030} €/t`],
                      ['2035 cost', `${s.cost2035} €/t`],
                      ['Purity', `${s.purity}%`],
                      ['Scalable', s.scalable ? '✓ Yes' : '✗ Limited'],
                    ].map(([k, v]) => (
                      <tr key={k} style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '4px 0', color: T.sub }}>{k}</td>
                        <td style={{ padding: '4px 0', fontWeight: 600, textAlign: 'right' }}>{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3 — FISCHER-TROPSCH */}
      {tab === 3 && (
        <div style={sectionStyle}>
          <div style={cardStyle}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 4 }}>Fischer-Tropsch Synthesis — Process Economics</div>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 16 }}>CO + 2H₂ → (−CH₂−)ₙ + H₂O · Anderson-Schulz-Flory chain growth probability α ≈ 0.85–0.92 for high-carbon products</div>
            <div style={gridStyle}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 10 }}>FT Product Slate (α = 0.88)</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={ftSlate}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="product" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={55} />
                    <YAxis label={{ value: '%', angle: -90, position: 'insideLeft', fontSize: 10 }} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v) => [`${v}%`, 'Product share']} />
                    <Bar dataKey="pct" fill={T.teal} radius={[4, 4, 0, 0]}>
                      {ftSlate.map((d, i) => <Cell key={i} fill={[T.blue, T.amber, T.teal, T.green, T.sub][i]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 10 }}>FT Process Steps & Energy</div>
                {[
                  { step: '1. CO₂ electrolysis / RWGS', energy: '2.8 kWh/kg FT', detail: 'CO₂ → CO + ½O₂ at 800°C' },
                  { step: '2. H₂ production (PEM)', energy: '55 kWh/kgH₂', detail: 'Water electrolysis' },
                  { step: '3. FT synthesis (Co cat.)', energy: '−0.8 kWh/kg FT', detail: '180–240°C, 25 bar, exothermic' },
                  { step: '4. Hydrocracking', energy: '0.4 kWh/kg FT', detail: 'High-T break long wax chains' },
                  { step: '5. Separation/distillation', energy: '0.3 kWh/kg FT', detail: 'Cut naphtha/jet/diesel' },
                  { step: '6. Total system', energy: '~19 kWh/kg SAF', detail: 'Overall efficiency ≈ 47% (LHV)' },
                ].map((s, i) => (
                  <div key={i} style={{ padding: '7px 0', borderBottom: `1px solid ${T.border}`, fontSize: 11 }}>
                    <div style={{ fontWeight: 600 }}>{s.step}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                      <span style={{ color: T.sub }}>{s.detail}</span>
                      <span style={{ fontFamily: 'monospace', color: T.accent }}>{s.energy}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>FT LCOP Sensitivity to H₂ Cost (SAF focus)</div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={Array.from({ length: 10 }, (_, i) => ({
                lcoh: 1 + i * 0.5,
                eSAF_dac:  +calcLcoP({ lcohEur: 1 + i * 0.5, h2Kg: 0.31, co2Kg: 3.16, co2Cost: 350, elecKwh: 1.5, elecCost: 60, capexPerTpa: 2400, opexPct: 5, wacc: 8, lifetime: 20, scale: 50000 }).toFixed(0),
                eSAF_bio:  +calcLcoP({ lcohEur: 1 + i * 0.5, h2Kg: 0.31, co2Kg: 3.16, co2Cost: 40, elecKwh: 1.5, elecCost: 60, capexPerTpa: 2400, opexPct: 5, wacc: 8, lifetime: 20, scale: 50000 }).toFixed(0),
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="lcoh" label={{ value: 'LCOH (€/kg)', position: 'insideBottom', offset: -3, fontSize: 10 }} tick={{ fontSize: 10 }} />
                <YAxis label={{ value: '€/t SAF', angle: -90, position: 'insideLeft', fontSize: 10 }} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v, n) => [`${v} €/t`, n]} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <ReferenceLine y={2800} stroke={T.blue} strokeDasharray="4 4" label={{ value: 'Fossil kerosene premium', fontSize: 9, fill: T.blue }} />
                <Line type="monotone" dataKey="eSAF_dac" name="e-SAF (DAC CO₂)" stroke={T.red} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="eSAF_bio" name="e-SAF (biogenic CO₂)" stroke={T.green} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TAB 4 — e-AMMONIA ENGINE */}
      {tab === 4 && (
        <div style={sectionStyle}>
          <div style={gridStyle}>
            <div style={cardStyle}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.green, marginBottom: 12 }}>Green Ammonia Process Chain</div>
              {[
                { step: 'Air separation (N₂)', spec: 'PSA or cryogenic, 99.9% purity', energy: '0.35 kWh/kgNH₃' },
                { step: 'H₂ production (PEM/AEL)', spec: 'Per 0.178 kg H₂/kg NH₃', energy: '1.9 kWh/kgNH₃' },
                { step: 'Haber-Bosch synthesis', spec: 'Fe catalyst, 400–500°C, 200 bar', energy: '0.55 kWh/kgNH₃' },
                { step: 'Ammonia condensation', spec: 'Liquid NH₃ at -33°C or 8 bar', energy: '0.05 kWh/kgNH₃' },
                { step: 'Storage (refrigerated)', spec: 'Atmospheric pressure', energy: '0.03 kWh/kgNH₃' },
                { step: 'Total process', spec: 'Green NH₃ system', energy: '~2.9 kWh/kgNH₃' },
              ].map((s, i) => (
                <div key={i} style={{ padding: '7px 0', borderBottom: `1px solid ${T.border}`, fontSize: 11 }}>
                  <div style={{ fontWeight: 600 }}>{s.step}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                    <span style={{ color: T.sub, fontSize: 10 }}>{s.spec}</span>
                    <span style={{ fontFamily: 'monospace', color: T.accent }}>{s.energy}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.green, marginBottom: 12 }}>e-Ammonia Economics</div>
              {[
                ['Grey NH₃ (NG feedstock)', '€200–320/t'],
                ['Blue NH₃ (NG + CCS)', '€280–400/t'],
                ['Green NH₃ 2025 (PEM)', '€650–900/t'],
                ['Green NH₃ 2030 (target)', '€350–500/t'],
                ['Green NH₃ 2040 (learning)', '€200–300/t'],
                ['Fertiliser market size', '$75 billion/yr'],
                ['NH₃ marine fuel price parity', '~€350/t (by LHV)'],
                ['Break-even vs grey (carbon price)', '€100–150/tCO₂'],
                ['CAPEX (1 Mtpa plant)', '~$1 billion'],
                ['Project pipeline (2025)', '200+ projects, 100+ GW'],
              ].map(([k, v], i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.border}`, fontSize: 11 }}>
                  <span style={{ color: T.sub }}>{k}</span>
                  <span style={{ fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Haber-Bosch vs Electrochemical NH₃ Routes</div>
            <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.bg }}>
                  {['Route', 'Temperature', 'Pressure', 'Efficiency', 'TRL', 'CAPEX', 'Status'].map(h => (
                    <th key={h} style={{ padding: '5px 8px', textAlign: 'left', color: T.sub, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Haber-Bosch (green H₂)', '400–500°C', '200 bar', '68%', '9', '€600–800/tpa', 'Commercial'],
                  ['Electrochemical (LiLi)', '25°C', '1 bar', '30%', '4', 'N/A', 'Lab scale'],
                  ['Plasma-catalytic', '< 200°C', '1–5 bar', '20–35%', '3', 'N/A', 'Research'],
                  ['Solid-state battery', '< 100°C', '1 bar', '25%', '3', 'N/A', 'Early lab'],
                  ['Integrated PEM-HB', '350°C', '100 bar', '72%', '7', '€700/tpa', 'Pilot scale'],
                ].map(([route, T_, P, eff, trl, capex, status], i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 ? T.bg : T.card }}>
                    <td style={{ padding: '5px 8px', fontWeight: i === 0 ? 700 : 400 }}>{route}</td>
                    <td style={{ padding: '5px 8px' }}>{T_}</td>
                    <td style={{ padding: '5px 8px' }}>{P}</td>
                    <td style={{ padding: '5px 8px', color: parseFloat(eff) > 60 ? T.green : T.amber }}>{eff}</td>
                    <td style={{ padding: '5px 8px' }}>{trl}/9</td>
                    <td style={{ padding: '5px 8px', fontFamily: 'monospace' }}>{capex}</td>
                    <td style={{ padding: '5px 8px', color: status === 'Commercial' ? T.green : status.includes('Pilot') ? T.amber : T.sub }}>{status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5 — DEMAND FORECASTS */}
      {tab === 5 && (
        <div style={sectionStyle}>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 4 }}>e-Fuel Global Demand Projections (Mt/yr)</div>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 14 }}>Driven by ReFuelEU (aviation), FuelEU Maritime, EU Hydrogen Strategy, IRA §45V. Base case IRENA/BloombergNEF blend.</div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={demandData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                <YAxis label={{ value: 'Mt/yr', angle: -90, position: 'insideLeft', fontSize: 10 }} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v, n) => [`${v} Mt/yr`, n]} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Area type="monotone" dataKey="eAmmonia" name="e-Ammonia" stackId="a" stroke={T.green} fill={T.green} fillOpacity={0.6} />
                <Area type="monotone" dataKey="eMethanol" name="e-Methanol" stackId="a" stroke={T.blue} fill={T.blue} fillOpacity={0.6} />
                <Area type="monotone" dataKey="eMethane" name="e-Methane (SNG)" stackId="a" stroke={T.indigo} fill={T.indigo} fillOpacity={0.6} />
                <Area type="monotone" dataKey="eSAF" name="e-SAF" stackId="a" stroke={T.amber} fill={T.amber} fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TAB 6 — PRICE COMPETITIVENESS */}
      {tab === 6 && (
        <div style={sectionStyle}>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>e-Fuel Price vs Fossil Benchmark — 2025 to 2035</div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={YEARS.map((y, i) => ({
                year: y,
                eSAF:      Math.round(2800 - i * 95),
                fossilJet: Math.round(1100 + i * 5 + (sr(i * 7) * 100)),
                eMethanol: Math.round(580 - i * 18),
                fossilMeOH: Math.round(380 + i * 4),
                eAmmonia:  Math.round(750 - i * 40),
                greyNH3:   Math.round(280 + i * 6),
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                <YAxis label={{ value: '€/t', angle: -90, position: 'insideLeft', fontSize: 10 }} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v, n) => [`${v} €/t`, n]} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Line type="monotone" dataKey="eSAF" name="e-SAF" stroke={T.amber} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="fossilJet" name="Fossil Jet" stroke={T.amber} strokeWidth={1} strokeDasharray="5 3" dot={false} />
                <Line type="monotone" dataKey="eMethanol" name="e-Methanol" stroke={T.blue} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="fossilMeOH" name="Grey Methanol" stroke={T.blue} strokeWidth={1} strokeDasharray="5 3" dot={false} />
                <Line type="monotone" dataKey="eAmmonia" name="e-Ammonia" stroke={T.green} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="greyNH3" name="Grey NH₃" stroke={T.green} strokeWidth={1} strokeDasharray="5 3" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TAB 7 — POLICY & MANDATES */}
      {tab === 7 && (
        <div style={sectionStyle}>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Key PtX Policy Mandates & Support Schemes</div>
            <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.bg }}>
                  {['Policy', 'Jurisdiction', 'Product', 'Target', 'Mechanism', 'Timeline'].map(h => (
                    <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: T.sub, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['ReFuelEU Aviation', 'EU', 'e-SAF', '6% by 2030, 70% by 2050', 'Blending mandate', '2025→'],
                  ['FuelEU Maritime', 'EU', 'e-Methanol/NH₃', '2% GHG reduction 2025', 'Carbon intensity limit', '2025→'],
                  ['IRA §45V', 'USA', 'Green H₂ → any PtX', '$0.60–3.00/kg H₂', 'Production tax credit', '2023–2032'],
                  ['EU H₂ Bank (pilot)', 'EU', 'RFNBO H₂', '€0.48–1.00/kg H₂', 'Fixed premium auction', '2023–2025'],
                  ['UK SAF mandate', 'UK', 'e-SAF', '10% by 2030, 22% by 2040', 'Blending mandate', '2025→'],
                  ['Germany KfW H₂', 'Germany', 'Green H₂/PtX', '€9.9 bn programme', 'Investment grant', '2020→'],
                  ['Japanese GX', 'Japan', 'Clean NH₃', '3 Mt/yr by 2030', 'Subsidised offtake', '2023→'],
                  ['RED III', 'EU', 'RFNBO in industry', '42% by 2030 H₂ share', 'Renewable target', '2023→'],
                ].map(([pol, jur, prod, tgt, mech, time], i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 ? T.bg : T.card }}>
                    <td style={{ padding: '6px 8px', fontWeight: 600 }}>{pol}</td>
                    <td style={{ padding: '6px 8px', color: T.sub }}>{jur}</td>
                    <td style={{ padding: '6px 8px', color: T.teal }}>{prod}</td>
                    <td style={{ padding: '6px 8px', fontFamily: 'monospace', fontSize: 10 }}>{tgt}</td>
                    <td style={{ padding: '6px 8px', fontSize: 10 }}>{mech}</td>
                    <td style={{ padding: '6px 8px', color: T.amber, fontWeight: 600 }}>{time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 8 — GHG LIFECYCLE */}
      {tab === 8 && (
        <div style={sectionStyle}>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Well-to-Wake GHG Lifecycle — e-Fuels vs Fossil (gCO2eq/MJ)</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={ghgData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="product" tick={{ fontSize: 9 }} angle={-15} textAnchor="end" height={55} />
                <YAxis label={{ value: 'gCO2eq/MJ', angle: -90, position: 'insideLeft', fontSize: 10 }} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v, n) => [`${v} gCO2eq/MJ`, n]} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <ReferenceLine y={89} stroke={T.red} strokeDasharray="4 4" label={{ value: 'Fossil jet baseline', fontSize: 9, fill: T.red }} />
                <Bar dataKey="production" name="Production" stackId="a" fill={T.blue} />
                <Bar dataKey="transport" name="Transport" stackId="a" fill={T.teal} />
                <Bar dataKey="combustion" name="Combustion" stackId="a" fill={T.amber} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TAB 9 — INVESTMENT LANDSCAPE */}
      {tab === 9 && (
        <div style={sectionStyle}>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Key PtX Investment Projects (2024–2027)</div>
            <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.bg }}>
                  {['Project', 'Developer', 'Product', 'Scale', 'Investment', 'Location', 'Status'].map(h => (
                    <th key={h} style={{ padding: '5px 8px', textAlign: 'left', color: T.sub, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['George Town SAF', 'HIF Global',    'e-Methanol/SAF', '550 kt/yr', '$4 bn',  'Texas, USA',     'FID 2025'],
                  ['Norsk e-Fuel',    'Norsk/Statkraft','e-SAF',        '10 kt/yr',  '€1.8 bn', 'Mosjøen, NO',    'Under Const.'],
                  ['AMAN Project',    'CWP Global',     'Green NH₃',    '1.8 Mtpa',  '$36 bn',  'Oman',           'FEED 2025'],
                  ['HyDeal Ambition', 'Consortium',     'Green H₂→NH₃', '67 GW e-', '€100+ bn','Spain/EU',       'Negotiation'],
                  ['Neom NEOM',       'Air Products',   'Green NH₃',    '1.2 Mt/yr', '$8.4 bn', 'Saudi Arabia',   'FID 2023'],
                  ['Ørsted FlagshipONE','Ørsted',        'e-Methanol',  '55 kt/yr',  '€0.7 bn', 'Örnsköldsvik,SE','Paused 2024'],
                  ['HIF Haru Oni',    'HIF Global',     'e-SAF/e-fuels','55 kt/yr',  '$1.5 bn', 'Chile',          'Phase 2'],
                ].map(([proj, dev, prod, scale, inv, loc, status], i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 ? T.bg : T.card }}>
                    <td style={{ padding: '5px 8px', fontWeight: 600 }}>{proj}</td>
                    <td style={{ padding: '5px 8px', color: T.sub }}>{dev}</td>
                    <td style={{ padding: '5px 8px', color: T.teal }}>{prod}</td>
                    <td style={{ padding: '5px 8px', fontFamily: 'monospace' }}>{scale}</td>
                    <td style={{ padding: '5px 8px', fontFamily: 'monospace', fontWeight: 600 }}>{inv}</td>
                    <td style={{ padding: '5px 8px', color: T.sub }}>{loc}</td>
                    <td style={{ padding: '5px 8px', color: status.includes('Const') ? T.green : status.includes('FID') ? T.teal : T.amber }}>{status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
