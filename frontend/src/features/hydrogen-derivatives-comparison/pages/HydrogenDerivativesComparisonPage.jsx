import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, RadarChart, PolarGrid, PolarAngleAxis, Radar,
  ScatterChart, Scatter, ZAxis
} from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const T = {
  bg: '#F7F6F2', card: '#FFFFFF', border: '#E5E2D9',
  text: '#1A1A2E', sub: '#6B7280', accent: '#B8860B',
  green: '#065F46', red: '#991B1B', blue: '#1E40AF',
  teal: '#0F766E', amber: '#92400E', navy: '#0F172A',
  indigo: '#4F46E5', gold: '#C59A1E', sage: '#4A7C59',
  font: "'DM Sans',system-ui,sans-serif"
};

const CARRIERS = [
  {
    name: 'Compressed GH2 (700 bar)',
    short: 'CGH2-700',
    energy_density_kwh_kg: 33.3,
    volumetric_density_kwh_L: 1.3,
    transport_cost_usd_gj_1000km: 4.5,
    reconversion_efficiency_pct: 98,
    infrastructure_maturity: 4,
    safety_risk: 4,
    best_application: 'Short-haul domestic (<500km), filling stations',
    color: T.blue,
    capex_usd_gj_storage: 8,
    notes: 'Mature for mobility; tube trailer/pipeline; high pressure risk',
  },
  {
    name: 'Compressed GH2 (350 bar)',
    short: 'CGH2-350',
    energy_density_kwh_kg: 33.3,
    volumetric_density_kwh_L: 0.78,
    transport_cost_usd_gj_1000km: 5.2,
    reconversion_efficiency_pct: 98,
    infrastructure_maturity: 5,
    safety_risk: 3,
    best_application: 'Bus/truck fleets, industrial on-site',
    color: T.teal,
    capex_usd_gj_storage: 6,
    notes: 'Most deployed; lower pressure risk; trucks at 350 bar',
  },
  {
    name: 'Liquid H2 (LH2)',
    short: 'LH2',
    energy_density_kwh_kg: 33.3,
    volumetric_density_kwh_L: 2.36,
    transport_cost_usd_gj_1000km: 2.8,
    reconversion_efficiency_pct: 87,
    infrastructure_maturity: 3,
    safety_risk: 4,
    best_application: 'Long-haul aviation, large-volume export',
    color: T.indigo,
    capex_usd_gj_storage: 12,
    notes: 'Cryogenic -253°C; 30-35% energy for liquefaction; boil-off 0.3-3%/day',
  },
  {
    name: 'LOHC (Dibenzyltoluene)',
    short: 'LOHC',
    energy_density_kwh_kg: 1.9,
    volumetric_density_kwh_L: 1.65,
    transport_cost_usd_gj_1000km: 1.2,
    reconversion_efficiency_pct: 60,
    infrastructure_maturity: 2,
    safety_risk: 1,
    best_application: 'Long-haul overseas trade, oil-tanker compatible',
    color: T.amber,
    capex_usd_gj_storage: 3,
    notes: 'Liquid at ambient; uses existing oil tankers; high dehydrogenation heat',
  },
  {
    name: 'Ammonia (NH3)',
    short: 'NH3',
    energy_density_kwh_kg: 5.2,
    volumetric_density_kwh_L: 4.32,
    transport_cost_usd_gj_1000km: 0.8,
    reconversion_efficiency_pct: 73,
    infrastructure_maturity: 5,
    safety_risk: 3,
    best_application: 'Fertiliser, co-firing, shipping fuel, H2 carrier',
    color: T.green,
    capex_usd_gj_storage: 1.5,
    notes: 'Existing global trade infrastructure; 185 Mt/yr market; toxic/corrosive',
  },
  {
    name: 'Methanol (e-MeOH)',
    short: 'e-MeOH',
    energy_density_kwh_kg: 5.5,
    volumetric_density_kwh_L: 4.35,
    transport_cost_usd_gj_1000km: 0.7,
    reconversion_efficiency_pct: 68,
    infrastructure_maturity: 4,
    safety_risk: 2,
    best_application: 'Shipping fuel, chemical feedstock, DME',
    color: T.teal,
    capex_usd_gj_storage: 1.2,
    notes: 'Largest chemical traded; 100Mt/yr; e-MeOH needs CO2 source (DAC/bio)',
  },
  {
    name: 'E-Kerosene / E-Diesel',
    short: 'e-Fuels',
    energy_density_kwh_kg: 11.9,
    volumetric_density_kwh_L: 9.35,
    transport_cost_usd_gj_1000km: 0.4,
    reconversion_efficiency_pct: 95,
    infrastructure_maturity: 3,
    safety_risk: 2,
    best_application: 'Aviation SAF, shipping HFO replacement',
    color: T.gold,
    capex_usd_gj_storage: 0.8,
    notes: 'Fully drop-in; CO2 source mandatory; FT or MtJ synthesis; $5-8/L now',
  },
  {
    name: 'E-Methane (SNG)',
    short: 'e-CH4',
    energy_density_kwh_kg: 13.9,
    volumetric_density_kwh_L: 0.011,
    transport_cost_usd_gj_1000km: 0.3,
    reconversion_efficiency_pct: 77,
    infrastructure_maturity: 4,
    safety_risk: 2,
    best_application: 'Existing gas grid injection, heating',
    color: T.sage,
    capex_usd_gj_storage: 0.5,
    notes: 'Grid-compatible; uses gas pipeline; methanation CH4 synthesis; CO2 needed',
  },
];

const SCENARIOS = [
  {
    name: 'Short-haul domestic (<500km)',
    winner: 'CGH2-350 / CGH2-700',
    rationale: 'Negligible transport premium; compression energy low; existing fleet vehicles',
    scores: { 'CGH2-700': 9, 'CGH2-350': 9, 'LH2': 5, 'LOHC': 3, 'NH3': 4, 'e-MeOH': 6, 'e-Fuels': 7, 'e-CH4': 7 },
  },
  {
    name: 'Long-haul shipping (>5000km)',
    winner: 'NH3 / e-MeOH / LOHC',
    rationale: 'Lowest $/GJ transport cost; existing vessel infrastructure; no cryogenics',
    scores: { 'CGH2-700': 2, 'CGH2-350': 2, 'LH2': 5, 'LOHC': 7, 'NH3': 9, 'e-MeOH': 9, 'e-Fuels': 8, 'e-CH4': 6 },
  },
  {
    name: 'Industrial heat (>500°C)',
    winner: 'NH3 / LH2 / CGH2',
    rationale: 'Direct combustion flexibility; NH3 co-firing proven; CGH2 purity required',
    scores: { 'CGH2-700': 7, 'CGH2-350': 7, 'LH2': 6, 'LOHC': 5, 'NH3': 8, 'e-MeOH': 5, 'e-Fuels': 4, 'e-CH4': 7 },
  },
  {
    name: 'Shipping fuel substitute',
    winner: 'NH3 / e-MeOH / e-Fuels',
    rationale: 'IMO GHG compliance; bunkering network; energy density for voyage range',
    scores: { 'CGH2-700': 2, 'CGH2-350': 2, 'LH2': 4, 'LOHC': 3, 'NH3': 9, 'e-MeOH': 9, 'e-Fuels': 8, 'e-CH4': 5 },
  },
  {
    name: 'Back-to-electricity (power)',
    winner: 'CGH2 / e-CH4 / e-MeOH',
    rationale: 'Highest round-trip efficiency for fuel cell or GT; avoid cracking penalty',
    scores: { 'CGH2-700': 9, 'CGH2-350': 9, 'LH2': 7, 'LOHC': 4, 'NH3': 5, 'e-MeOH': 6, 'e-Fuels': 5, 'e-CH4': 8 },
  },
];

const TABS = ['Carrier Comparison Matrix', 'Energy Density', 'Transport Cost Model', 'Supply Chain Scenarios', 'End-Use Fit', 'Investment Thesis'];

const KpiCard = ({ label, value, unit, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 18px', minWidth: 150 }}>
    <div style={{ fontSize: 11, color: T.sub, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.text }}>{value}</div>
    {unit && <div style={{ fontSize: 11, color: T.sub }}>{unit}</div>}
  </div>
);

const ScoreBar = ({ score, max = 10 }) => (
  <div style={{ background: T.border, borderRadius: 4, height: 8, width: 80, overflow: 'hidden' }}>
    <div style={{ width: `${(score / max) * 100}%`, height: '100%', background: score >= 8 ? T.green : score >= 5 ? T.amber : T.red, borderRadius: 4 }} />
  </div>
);

export default function HydrogenDerivativesComparisonPage() {
  const [tab, setTab] = useState(0);
  const [selectedScenario, setSelectedScenario] = useState(0);
  const [selectedCarrier, setSelectedCarrier] = useState('NH3');
  const [distanceKm, setDistanceKm] = useState(5000);
  const [volumeGwh, setVolumeGwh] = useState(10);

  const transportCosts = useMemo(() =>
    CARRIERS.map(c => ({
      name: c.short,
      cost: Math.round(c.transport_cost_usd_gj_1000km * (distanceKm / 1000) * 1000) / 1000,
      color: c.color,
    })),
    [distanceKm]);

  const radarCarrier = useMemo(() => {
    const c = CARRIERS.find(x => x.short === selectedCarrier) || CARRIERS[0];
    return [
      { metric: 'Energy Density', score: Math.min(10, c.energy_density_kwh_kg / 3.33) },
      { metric: 'Vol. Density', score: Math.min(10, c.volumetric_density_kwh_L * 2) },
      { metric: 'Transport', score: Math.max(0, 10 - c.transport_cost_usd_gj_1000km * 1.5) },
      { metric: 'Efficiency', score: c.reconversion_efficiency_pct / 10 },
      { metric: 'Infra Maturity', score: c.infrastructure_maturity * 2 },
      { metric: 'Safety', score: (6 - c.safety_risk) * 2 },
    ];
  }, [selectedCarrier]);

  const scenarioData = useMemo(() => {
    const s = SCENARIOS[selectedScenario];
    return CARRIERS.map(c => ({ name: c.short, score: s.scores[c.short] || 0, color: c.color }));
  }, [selectedScenario]);

  // Cost per useful GJ delivered
  const deliveredCostData = useMemo(() =>
    CARRIERS.map(c => ({
      name: c.short,
      production: Math.round(15 + sr(CARRIERS.indexOf(c) * 7) * 8),
      transport: Math.round(c.transport_cost_usd_gj_1000km * (distanceKm / 1000)),
      reconversionLoss: Math.round((100 - c.reconversion_efficiency_pct) * 0.3),
      color: c.color,
    })),
    [distanceKm]);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: T.font, padding: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <span style={{ background: T.navy, color: '#fff', borderRadius: 6, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>EP-EE6</span>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text, margin: 0 }}>Hydrogen Derivatives Trade-off & Selection Matrix</h1>
        </div>
        <p style={{ color: T.sub, fontSize: 13, margin: 0 }}>8 H2 carriers/derivatives · 5 supply chain scenarios · Source: IRENA PtX Innovation Outlook, IEA H2 Roadmap, Hydrogen Council, DNV</p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div>
          <label style={{ fontSize: 12, color: T.sub, marginRight: 6 }}>Drill-down Carrier</label>
          <select value={selectedCarrier} onChange={e => setSelectedCarrier(e.target.value)}
            style={{ border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 8px', fontSize: 13, background: T.card }}>
            {CARRIERS.map(c => <option key={c.short} value={c.short}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, color: T.sub, marginRight: 6 }}>Transport Distance</label>
          <input type="range" min={200} max={15000} step={200} value={distanceKm}
            onChange={e => setDistanceKm(+e.target.value)}
            style={{ verticalAlign: 'middle', marginRight: 6 }} />
          <span style={{ fontSize: 12 }}>{distanceKm.toLocaleString()} km</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
        <KpiCard label="Best for Long-Haul" value="NH3 / e-MeOH" unit="lowest $/GJ/1000km" color={T.green} />
        <KpiCard label="Best Energy Density" value="e-Fuels (11.9)" unit="kWh/kg (gravimetric)" color={T.gold} />
        <KpiCard label="Highest Efficiency" value="CGH2 (98%)" unit="reconversion" color={T.blue} />
        <KpiCard label="Most Mature Infra" value="NH3 (5/5)" unit="existing 185 Mt/yr market" color={T.teal} />
        <KpiCard label="Transport cost at dist." value={`$${CARRIERS.find(c => c.short === selectedCarrier)?.transport_cost_usd_gj_1000km * (distanceKm / 1000) | 0}/GJ`} unit={`${selectedCarrier} @ ${distanceKm.toLocaleString()}km`} color={T.amber} />
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)}
            style={{ padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: tab === i ? 700 : 400, background: tab === i ? T.navy : T.card, color: tab === i ? '#fff' : T.text }}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab 0: Carrier Comparison Matrix */}
      {tab === 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}`, gridColumn: '1/-1' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Full Carrier Comparison</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.bg }}>
                    {['Carrier', 'Gravimetric (kWh/kg)', 'Volumetric (kWh/L)', 'Transport $/GJ/1000km', 'Reconv. Eff.', 'Infra Maturity', 'Safety Risk', 'Best Use'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.sub, fontWeight: 600, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CARRIERS.map((c, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: c.short === selectedCarrier ? '#F0FDF4' : i % 2 === 0 ? T.card : T.bg }}>
                      <td style={{ padding: '8px 10px' }}>
                        <div style={{ fontWeight: 700, color: c.color }}>{c.short}</div>
                        <div style={{ fontSize: 10, color: T.sub }}>{c.name}</div>
                      </td>
                      <td style={{ padding: '8px 10px', fontWeight: 600 }}>{c.energy_density_kwh_kg}</td>
                      <td style={{ padding: '8px 10px' }}>{c.volumetric_density_kwh_L}</td>
                      <td style={{ padding: '8px 10px', color: c.transport_cost_usd_gj_1000km < 1 ? T.green : c.transport_cost_usd_gj_1000km < 3 ? T.teal : T.red, fontWeight: 600 }}>${c.transport_cost_usd_gj_1000km}</td>
                      <td style={{ padding: '8px 10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 600, color: c.reconversion_efficiency_pct >= 90 ? T.green : c.reconversion_efficiency_pct >= 75 ? T.teal : T.amber }}>{c.reconversion_efficiency_pct}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '8px 10px' }}>{'★'.repeat(c.infrastructure_maturity)}</td>
                      <td style={{ padding: '8px 10px' }}>
                        <span style={{ color: c.safety_risk <= 2 ? T.green : c.safety_risk <= 3 ? T.amber : T.red }}>{'●'.repeat(c.safety_risk)}</span>
                      </td>
                      <td style={{ padding: '8px 10px', color: T.sub, fontSize: 11 }}>{c.best_application}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 4 }}>{CARRIERS.find(c => c.short === selectedCarrier)?.name} — Radar Profile</h3>
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radarCarrier}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10 }} />
                <Radar dataKey="score" stroke={CARRIERS.find(c => c.short === selectedCarrier)?.color || T.green} fill={CARRIERS.find(c => c.short === selectedCarrier)?.color || T.green} fillOpacity={0.3} name={selectedCarrier} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 8 }}>{CARRIERS.find(c => c.short === selectedCarrier)?.name}</h3>
            {(() => {
              const c = CARRIERS.find(x => x.short === selectedCarrier);
              if (!c) return null;
              return (
                <div>
                  <div style={{ background: T.bg, borderRadius: 8, padding: 12, marginBottom: 8, fontSize: 12 }}>{c.notes}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {[
                      { k: 'Energy (gravimetric)', v: `${c.energy_density_kwh_kg} kWh/kg` },
                      { k: 'Energy (volumetric)', v: `${c.volumetric_density_kwh_L} kWh/L` },
                      { k: 'Transport cost', v: `$${c.transport_cost_usd_gj_1000km}/GJ/1000km` },
                      { k: 'Reconversion eff.', v: `${c.reconversion_efficiency_pct}%` },
                      { k: 'Storage CAPEX', v: `$${c.capex_usd_gj_storage}/GJ` },
                      { k: 'Best application', v: c.best_application.slice(0, 40) + '...' },
                    ].map(({ k, v }) => (
                      <div key={k} style={{ background: '#F0F9F4', borderRadius: 6, padding: '8px 10px' }}>
                        <div style={{ fontSize: 10, color: T.sub }}>{k}</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Tab 1: Energy Density */}
      {tab === 1 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Gravimetric Energy Density (kWh/kg)</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={[...CARRIERS].sort((a, b) => b.energy_density_kwh_kg - a.energy_density_kwh_kg)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize: 10 }} unit=" kWh/kg" />
                <YAxis dataKey="short" type="category" tick={{ fontSize: 10 }} width={75} />
                <Tooltip />
                <Bar dataKey="energy_density_kwh_kg" name="kWh/kg">
                  {[...CARRIERS].sort((a, b) => b.energy_density_kwh_kg - a.energy_density_kwh_kg).map((c, i) => <Cell key={i} fill={c.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Volumetric Energy Density (kWh/L)</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={[...CARRIERS].sort((a, b) => b.volumetric_density_kwh_L - a.volumetric_density_kwh_L)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize: 10 }} unit=" kWh/L" />
                <YAxis dataKey="short" type="category" tick={{ fontSize: 10 }} width={75} />
                <Tooltip />
                <Bar dataKey="volumetric_density_kwh_L" name="kWh/L">
                  {[...CARRIERS].sort((a, b) => b.volumetric_density_kwh_L - a.volumetric_density_kwh_L).map((c, i) => <Cell key={i} fill={c.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Reconversion Efficiency (%)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={[...CARRIERS].sort((a, b) => b.reconversion_efficiency_pct - a.reconversion_efficiency_pct)}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="short" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[50, 100]} unit="%" />
                <Tooltip />
                <Bar dataKey="reconversion_efficiency_pct" name="Efficiency %">
                  {[...CARRIERS].sort((a, b) => b.reconversion_efficiency_pct - a.reconversion_efficiency_pct).map((c, i) => <Cell key={i} fill={c.reconversion_efficiency_pct >= 90 ? T.green : c.reconversion_efficiency_pct >= 75 ? T.teal : T.amber} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Gravimetric vs. Volumetric Density</h3>
            <ResponsiveContainer width="100%" height={220}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="gravimetric" name="Gravimetric" unit=" kWh/kg" tick={{ fontSize: 10 }} />
                <YAxis dataKey="volumetric" name="Volumetric" unit=" kWh/L" tick={{ fontSize: 10 }} />
                <ZAxis range={[60, 60]} />
                <Tooltip formatter={(v, n) => [`${v} ${n.includes('metric') ? 'kWh/kg' : 'kWh/L'}`, n]} />
                <Scatter data={CARRIERS.map(c => ({ gravimetric: c.energy_density_kwh_kg, volumetric: c.volumetric_density_kwh_L, name: c.short }))}>
                  {CARRIERS.map((c, i) => <Cell key={i} fill={c.color} />)}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 2: Transport Cost Model */}
      {tab === 2 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}`, gridColumn: '1/-1' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Transport Cost at {distanceKm.toLocaleString()} km ($/GJ delivered)</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={[...transportCosts].sort((a, b) => a.cost - b.cost)}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="$/GJ" />
                <Tooltip formatter={v => [`$${v}/GJ`, 'Transport cost']} />
                <Bar dataKey="cost" name="$/GJ">
                  {[...transportCosts].sort((a, b) => a.cost - b.cost).map((c, i) => <Cell key={i} fill={c.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Transport Cost vs. Distance ($/GJ)</h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={[500, 1000, 2000, 3000, 5000, 8000, 12000, 15000].map((d, i) => ({
                dist: d,
                nh3: Math.round(CARRIERS[4].transport_cost_usd_gj_1000km * d / 1000 * 10) / 10,
                lh2: Math.round(CARRIERS[2].transport_cost_usd_gj_1000km * d / 1000 * 10) / 10,
                cgh2: Math.round(CARRIERS[0].transport_cost_usd_gj_1000km * d / 1000 * 10) / 10,
                lohc: Math.round(CARRIERS[3].transport_cost_usd_gj_1000km * d / 1000 * 10) / 10,
                efuels: Math.round(CARRIERS[6].transport_cost_usd_gj_1000km * d / 1000 * 10) / 10,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="dist" unit=" km" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 11 }} unit="$/GJ" />
                <Tooltip />
                <Legend />
                <Line dataKey="nh3" stroke={T.green} strokeWidth={2} name="NH3" dot={false} />
                <Line dataKey="lohc" stroke={T.amber} strokeWidth={2} name="LOHC" dot={false} />
                <Line dataKey="efuels" stroke={T.gold} strokeWidth={2} name="e-Fuels" dot={false} />
                <Line dataKey="lh2" stroke={T.indigo} strokeWidth={2} name="LH2" dot={false} />
                <Line dataKey="cgh2" stroke={T.blue} strokeWidth={2} name="CGH2-700" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Full Delivered Cost Stack ($/GJ @ {distanceKm.toLocaleString()} km)</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={deliveredCostData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} unit="$/GJ" />
                <Tooltip />
                <Legend />
                <Bar dataKey="production" stackId="a" fill={T.green} name="Production $/GJ" />
                <Bar dataKey="transport" stackId="a" fill={T.blue} name="Transport $/GJ" />
                <Bar dataKey="reconversionLoss" stackId="a" fill={T.red} name="Reconversion loss $/GJ" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 3: Supply Chain Scenarios */}
      {tab === 3 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}`, gridColumn: '1/-1' }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {SCENARIOS.map((s, i) => (
                <button key={i} onClick={() => setSelectedScenario(i)}
                  style={{ padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: selectedScenario === i ? 700 : 400, background: selectedScenario === i ? T.navy : T.bg, color: selectedScenario === i ? '#fff' : T.text }}>
                  {s.name}
                </button>
              ))}
            </div>
            <div style={{ background: '#EFF6FF', borderRadius: 8, padding: 12, marginBottom: 16 }}>
              <div style={{ fontWeight: 700, color: T.blue, fontSize: 13 }}>Winner: {SCENARIOS[selectedScenario].winner}</div>
              <div style={{ color: T.text, fontSize: 12, marginTop: 4 }}>{SCENARIOS[selectedScenario].rationale}</div>
            </div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Carrier Suitability Scores — {SCENARIOS[selectedScenario].name}</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={scenarioData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 10]} />
                <Tooltip />
                <Bar dataKey="score" name="Suitability score">
                  {scenarioData.map((c, i) => <Cell key={i} fill={c.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}`, gridColumn: '1/-1' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>All Scenarios — Suitability Heatmap</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.bg }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left', color: T.sub, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>Scenario</th>
                    {CARRIERS.map(c => (
                      <th key={c.short} style={{ padding: '8px 10px', textAlign: 'center', color: T.sub, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{c.short}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SCENARIOS.map((s, si) => (
                    <tr key={si} style={{ borderBottom: `1px solid ${T.border}`, background: si % 2 === 0 ? T.card : T.bg }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: T.text }}>{s.name}</td>
                      {CARRIERS.map(c => {
                        const score = s.scores[c.short] || 0;
                        return (
                          <td key={c.short} style={{ padding: '6px 8px', textAlign: 'center' }}>
                            <div style={{ background: score >= 8 ? '#D1FAE5' : score >= 5 ? '#FEF3C7' : '#FEE2E2', borderRadius: 4, padding: '3px 6px', fontWeight: 700, color: score >= 8 ? T.green : score >= 5 ? T.amber : T.red }}>
                              {score}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: End-Use Fit */}
      {tab === 4 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Infrastructure Maturity vs. Safety Risk</h3>
            <ResponsiveContainer width="100%" height={260}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="maturity" name="Infra Maturity" domain={[0.5, 5.5]} tick={{ fontSize: 10 }} label={{ value: 'Infra Maturity (1-5)', position: 'insideBottom', offset: -5, fontSize: 11 }} />
                <YAxis dataKey="safety" name="Safety Risk" domain={[0.5, 4.5]} tick={{ fontSize: 10 }} label={{ value: 'Safety Risk (lower=safer)', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                <ZAxis range={[80, 80]} />
                <Tooltip formatter={(v, n) => [`${v}/5`, n]} />
                <Scatter data={CARRIERS.map(c => ({ maturity: c.infrastructure_maturity, safety: c.safety_risk, name: c.short }))}>
                  {CARRIERS.map((c, i) => <Cell key={i} fill={c.color} />)}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>End-Use Application Guide</h3>
            {CARRIERS.map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, borderBottom: `1px solid ${T.border}`, padding: '8px 0' }}>
                <div style={{ minWidth: 65, fontWeight: 700, color: c.color, fontSize: 12 }}>{c.short}</div>
                <div style={{ fontSize: 11, color: T.sub }}>{c.best_application}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Investment Thesis */}
      {tab === 5 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}`, gridColumn: '1/-1' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Carrier Market Size 2030 ($bn investment) — IEA Hydrogen Roadmap Estimate</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={[
                { carrier: 'NH3', investment_bn: 85, color: T.green },
                { carrier: 'e-MeOH', investment_bn: 55, color: T.teal },
                { carrier: 'e-Fuels (aviation)', investment_bn: 70, color: T.gold },
                { carrier: 'LH2', investment_bn: 40, color: T.indigo },
                { carrier: 'CGH2 (domestic)', investment_bn: 60, color: T.blue },
                { carrier: 'LOHC', investment_bn: 15, color: T.amber },
                { carrier: 'e-Methane', investment_bn: 25, color: T.sage },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="carrier" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="$bn" />
                <Tooltip formatter={v => [`$${v}bn`, 'Investment 2030']} />
                <Bar dataKey="investment_bn" name="$bn 2030">
                  {[T.green, T.teal, T.gold, T.indigo, T.blue, T.amber, T.sage].map((col, i) => <Cell key={i} fill={col} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Technology Readiness Level (TRL)</h3>
            {CARRIERS.map((c, i) => {
              const trl = c.infrastructure_maturity >= 5 ? 9 : c.infrastructure_maturity === 4 ? 7 : c.infrastructure_maturity === 3 ? 6 : c.infrastructure_maturity === 2 ? 4 : 3;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ minWidth: 65, fontWeight: 700, color: c.color, fontSize: 12 }}>{c.short}</span>
                  <div style={{ flex: 1, background: T.border, borderRadius: 4, height: 12 }}>
                    <div style={{ width: `${(trl / 9) * 100}%`, height: '100%', background: c.color, borderRadius: 4 }} />
                  </div>
                  <span style={{ minWidth: 40, fontSize: 12, fontWeight: 700 }}>TRL {trl}</span>
                </div>
              );
            })}
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Key Investment Risk Factors</h3>
            {[
              { carrier: 'NH3', risk: 'Cracker efficiency; toxicity regulation; NOx in combustion' },
              { carrier: 'LH2', risk: 'Boil-off losses; cryogenic CAPEX; liquefaction energy 30-35%' },
              { carrier: 'LOHC', risk: 'Dehydrogenation CAPEX; heat supply chain; toluene supply' },
              { carrier: 'e-Fuels', risk: 'DAC CO2 cost; FT synthesis scale; $5-8/L production cost' },
              { carrier: 'CGH2', risk: 'Compression energy; tube trailer logistics; limited ship range' },
              { carrier: 'e-MeOH', risk: 'CO2 source availability; reforming step needed; toxicity' },
            ].map((r, i) => (
              <div key={i} style={{ background: T.bg, borderRadius: 8, padding: 9, marginBottom: 6 }}>
                <span style={{ fontWeight: 700, color: CARRIERS.find(c => c.short === r.carrier)?.color || T.text, fontSize: 12 }}>{r.carrier}:</span>
                <span style={{ color: T.sub, fontSize: 12, marginLeft: 6 }}>{r.risk}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: 20, fontSize: 11, color: T.sub, textAlign: 'center' }}>
        EP-EE6 · Sources: IRENA Innovation Outlook Power-to-X (2022), IEA Global Hydrogen Review (2023), Hydrogen Council (2021), DNV Energy Transition Outlook
      </div>
    </div>
  );
}
