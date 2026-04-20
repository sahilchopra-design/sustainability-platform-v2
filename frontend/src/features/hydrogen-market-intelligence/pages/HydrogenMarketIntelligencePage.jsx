import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, ComposedChart, Cell,
  ScatterChart, Scatter, RadarChart, PolarGrid, PolarAngleAxis, Radar, PieChart, Pie
} from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const T = {
  bg: '#FAFAF7', card: '#FFFFFF', border: '#E5E2D9',
  text: '#1A1A2E', sub: '#6B7280', accent: '#B8860B',
  green: '#065F46', red: '#991B1B', blue: '#1E40AF',
  teal: '#0F766E', amber: '#92400E', navy: '#0F172A',
  indigo: '#4F46E5', purple: '#7C3AED', sage: '#4A7C59'
};

// ── Market data ───────────────────────────────────────────────────────────────
const SECTORS = [
  { name: 'Ammonia/Fertiliser', demand2023: 31, demand2030: 45, demand2040: 120, share: 37, color: T.green,   type: 'existing' },
  { name: 'Refining & Chemicals', demand2023: 42, demand2030: 50, demand2040: 80,  share: 50, color: T.blue,  type: 'existing' },
  { name: 'Steel (DRI)',         demand2023: 0.1, demand2030: 8, demand2040: 55,   share: 0,  color: T.red,   type: 'new' },
  { name: 'Transport (H₂ FC)',   demand2023: 0.05, demand2030: 5, demand2040: 40,  share: 0,  color: T.amber, type: 'new' },
  { name: 'Power (H₂ turbines)', demand2023: 0.02, demand2030: 2, demand2040: 25,  share: 0,  color: T.teal,  type: 'new' },
  { name: 'Shipping (NH₃/H₂)',   demand2023: 0.01, demand2030: 1, demand2040: 20,  share: 0,  color: T.indigo,type: 'new' },
  { name: 'Aviation (e-SAF)',    demand2023: 0.005,demand2030: 0.8,demand2040: 15, share: 0,  color: T.purple,type: 'new' },
  { name: 'Buildings & Heat',    demand2023: 0.01, demand2030: 0.5,demand2040: 10, share: 0,  color: T.sage,  type: 'new' },
];

const EXPORTERS = [
  { country: 'Chile',       potential2030: 2.5,  potential2040: 15,  lcoh: 2.8,  distance: 12800, color: T.blue,   status: 'Early mover' },
  { country: 'Australia',   potential2030: 3.0,  potential2040: 20,  lcoh: 3.2,  distance: 7800,  color: T.green,  status: 'Pipeline building' },
  { country: 'Morocco',     potential2030: 2.0,  potential2040: 10,  lcoh: 2.5,  distance: 3200,  color: T.amber,  status: 'Active development' },
  { country: 'Saudi Arabia',potential2030: 4.0,  potential2040: 25,  lcoh: 2.2,  distance: 5600,  color: T.teal,   status: 'FID stage' },
  { country: 'Namibia',     potential2030: 1.0,  potential2040: 8,   lcoh: 2.7,  distance: 8400,  color: T.indigo, status: 'Early stage' },
  { country: 'Norway',      potential2030: 2.0,  potential2040: 7,   lcoh: 3.5,  distance: 800,   color: T.purple, status: 'Pipeline projects' },
  { country: 'Kazakhstan',  potential2030: 0.5,  potential2040: 5,   lcoh: 4.0,  distance: 5200,  color: T.red,    status: 'Nascent' },
  { country: 'USA (Gulf)',  potential2030: 5.0,  potential2040: 30,  lcoh: 3.0,  distance: 8900,  color: T.sage,   status: 'IRA-driven growth' },
];

const IMPORTERS = [
  { country: 'Germany',     demand2030: 3.5, demand2040: 12, sources: ['Morocco', 'Norway', 'USA'], priority: 'High', color: T.blue },
  { country: 'Japan',       demand2030: 3.0, demand2040: 10, sources: ['Australia', 'Saudi Arabia'], priority: 'High', color: T.red },
  { country: 'South Korea', demand2030: 1.5, demand2040: 6,  sources: ['Australia', 'Chile'], priority: 'High', color: T.teal },
  { country: 'Netherlands', demand2030: 4.0, demand2040: 14, sources: ['Chile', 'Norway', 'Morocco'], priority: 'Very High', color: T.indigo },
  { country: 'France',      demand2030: 1.0, demand2040: 5,  sources: ['Morocco', 'Norway'], priority: 'Medium', color: T.amber },
  { country: 'UK',          demand2030: 0.8, demand2040: 4,  sources: ['Norway', 'USA'], priority: 'Medium', color: T.green },
];

const YEARS = Array.from({ length: 16 }, (_, i) => 2025 + i);

// ── Hydrogen Valleys ──────────────────────────────────────────────────────────
const VALLEYS = [
  { name: 'Hamburg Hydrogen Valley', country: 'Germany', focus: 'Steel + Port + Industry', investment: 6.5, jobs: 12000, status: 'Active' },
  { name: 'HyDeal Europe', country: 'EU Multi', focus: 'Pipeline H₂ supply 67 GW', investment: 100, jobs: 50000, status: 'Negotiation' },
  { name: 'Offshore H₂ Rotterdam', country: 'Netherlands', focus: 'Offshore wind + H₂ import hub', investment: 10, jobs: 15000, status: 'FID stage' },
  { name: 'Humber Zero', country: 'UK', focus: 'Industrial cluster decarbonisation', investment: 8, jobs: 8000, status: 'Active' },
  { name: 'Hydrogen Valley Puglia', country: 'Italy', focus: 'Solar H₂ + backbone connection', investment: 4, jobs: 5000, status: 'Early' },
  { name: 'NEOM Green Hydrogen Co', country: 'Saudi Arabia', focus: 'Green NH₃ export', investment: 8.4, jobs: 3000, status: 'Under Const.' },
  { name: 'HySupply Australia', country: 'Australia', focus: 'Wind/solar H₂ for Japan', investment: 15, jobs: 10000, status: 'Pre-FEED' },
  { name: 'Patagonia H₂ Cluster', country: 'Chile', focus: 'Wind H₂, e-SAF, NH₃ export', investment: 12, jobs: 8000, status: 'FID pipeline' },
];

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
  'Market Overview', 'Demand by Sector', 'Exporter Analysis', 'Importer Demand',
  'Trade Flow Matrix', 'Hydrogen Valleys', 'Geopolitical Risk', 'Price Forecasts',
  'Technology Mix', 'Investor Dashboard'
];

export default function HydrogenMarketIntelligencePage() {
  const [tab, setTab] = useState(0);
  const [selectedYear, setSelectedYear] = useState(2030);
  const [scenario, setScenario] = useState('Base');

  const scenarioMultiplier = { Conservative: 0.65, Base: 1.0, Optimistic: 1.45 }[scenario];

  // Demand projection data
  const demandData = useMemo(() => YEARS.map((y, i) => {
    const result = { year: y };
    SECTORS.forEach(s => {
      result[s.name.split('/')[0]] = +(s.demand2023 + (s.demand2030 - s.demand2023) / 7 * Math.min(i, 7) + (s.demand2040 - s.demand2030) / 10 * Math.max(0, i - 7)).toFixed(1) * scenarioMultiplier;
    });
    return result;
  }), [scenarioMultiplier]);

  // Supply build-up by type
  const supplyData = useMemo(() => YEARS.map((y, i) => ({
    year: y,
    grey:   +(83 - i * 2).toFixed(0),
    blue:   +(0 + i * 3).toFixed(0),
    green:  +(0.5 + i * 4).toFixed(1),
    other:  +(0.5 + i * 0.5).toFixed(1),
  })), []);

  // Price trajectory
  const priceData = useMemo(() => YEARS.map((y, i) => ({
    year: y,
    greenWind: +Math.max(1.5, 6.0 - i * 0.28).toFixed(2),
    greenSolar: +Math.max(1.2, 5.5 - i * 0.25).toFixed(2),
    blue:       +Math.max(1.3, 2.2 + i * 0.05).toFixed(2),
    grey:       +(1.4 + sr(i * 11) * 0.8).toFixed(2),
    target2030: 2.0,
  })), []);

  // Geopolitical risk matrix
  const geoRisks = useMemo(() => EXPORTERS.map((e, i) => ({
    country: e.country,
    politicalStability: [7, 8, 7, 5, 6, 9, 4, 9][i],
    regulatoryRisk:     [7, 8, 7, 6, 7, 9, 5, 8][i],
    infrastructureRisk: [5, 5, 4, 7, 3, 8, 4, 8][i],
    contractEnforce:    [8, 9, 7, 6, 7, 9, 5, 9][i],
    overallScore:       [6.8, 7.5, 6.3, 6.0, 5.8, 8.8, 4.5, 8.5][i],
    color: e.color,
  })), []);

  // Trade flow matrix (exporter → importer estimated volumes in Mt/yr, 2030)
  const tradeMatrix = [
    { from: 'Chile → Rotterdam',     vol: 0.8, mode: 'NH₃/LH₂ ship', color: T.blue },
    { from: 'Morocco → Spain',       vol: 1.2, mode: 'Pipeline',     color: T.green },
    { from: 'Saudi Arabia → Japan',  vol: 1.5, mode: 'NH₃ ship',     color: T.amber },
    { from: 'Australia → Japan',     vol: 1.0, mode: 'LH₂/NH₃',     color: T.teal },
    { from: 'Norway → Germany',      vol: 0.6, mode: 'Pipeline',     color: T.indigo },
    { from: 'USA → Rotterdam',       vol: 0.7, mode: 'NH₃ ship',     color: T.red },
    { from: 'Namibia → Hamburg',     vol: 0.4, mode: 'NH₃/LOHC',    color: T.purple },
    { from: 'Kazakhstan → China',    vol: 0.3, mode: 'Pipeline/NH₃', color: T.sage },
  ];

  // Technology mix to 2040
  const techMixData = YEARS.map((y, i) => ({
    year: y,
    PEM:  +(5 + i * 6).toFixed(0),
    AEL:  +(20 + i * 3).toFixed(0),
    SOEC: +(0 + i * 1.5).toFixed(0),
    ATR_CCS: +(0 + i * 3.5).toFixed(0),
    SMR_CCS: +(0 + i * 2).toFixed(0),
  }));

  // Investor metrics
  const totalGreenPipeline = EXPORTERS.reduce((a, e) => a + e.potential2030, 0);
  const totalDemand2030 = SECTORS.reduce((a, s) => a + s.demand2030, 0);

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
        <div style={{ fontSize: 11, color: T.accent, fontFamily: 'monospace', marginBottom: 4 }}>EP-DS6 · GREEN HYDROGEN FINANCE</div>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Hydrogen Market Intelligence & Trade Flow Analytics Engine</h1>
        <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>Global Demand · Supply · Trade Flows · H₂ Valleys · Geopolitical Risk · Price Forecasts · 10 Tabs</div>
      </div>
      <div style={tabBarStyle}>
        {TABS.map((t, i) => <div key={i} style={tabStyle(tab === i)} onClick={() => setTab(i)}>{t}</div>)}
      </div>

      {/* TAB 0 — MARKET OVERVIEW */}
      {tab === 0 && (
        <div style={sectionStyle}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: T.sub }}>Scenario:</span>
            {['Conservative', 'Base', 'Optimistic'].map(s => (
              <button key={s} onClick={() => setScenario(s)}
                style={{ padding: '4px 12px', fontSize: 11, borderRadius: 5, border: `1px solid ${scenario === s ? T.accent : T.border}`, background: scenario === s ? T.accent : 'transparent', color: scenario === s ? '#fff' : T.sub, cursor: 'pointer' }}>
                {s}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <KpiCard label="Global H₂ Demand 2023" value="94 Mt" unit="all grades" color={T.navy} />
            <KpiCard label="Global H₂ Demand 2030" value={`${(totalDemand2030 * scenarioMultiplier).toFixed(0)} Mt`} unit={`${scenario} scenario`} color={T.teal} />
            <KpiCard label="Green H₂ Pipeline 2030" value={`${(totalGreenPipeline * scenarioMultiplier).toFixed(1)} Mt`} unit="declared projects" color={T.green} />
            <KpiCard label="Market investment" value="$1.5 T" unit="global 2023–2030 req." color={T.amber} />
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 4 }}>Global H₂ Supply Mix 2025–2040 (Mt/yr)</div>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 14 }}>Grey still dominant. Blue bridges transition. Green scales exponentially post-2027.</div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={supplyData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                <YAxis label={{ value: 'Mt H₂/yr', angle: -90, position: 'insideLeft', fontSize: 10 }} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v, n) => [`${v} Mt`, n]} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Area type="monotone" dataKey="grey" name="Grey H₂" stackId="a" stroke={T.sub} fill={T.sub} fillOpacity={0.5} />
                <Area type="monotone" dataKey="blue" name="Blue H₂" stackId="a" stroke={T.blue} fill={T.blue} fillOpacity={0.6} />
                <Area type="monotone" dataKey="green" name="Green H₂" stackId="a" stroke={T.green} fill={T.green} fillOpacity={0.7} />
                <Area type="monotone" dataKey="other" name="Other (nuclear/biomass)" stackId="a" stroke={T.amber} fill={T.amber} fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TAB 1 — DEMAND BY SECTOR */}
      {tab === 1 && (
        <div style={sectionStyle}>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>H₂ Demand by End-Use Sector 2023 vs 2030 vs 2040 (Mt/yr)</div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={SECTORS}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={60} />
                <YAxis label={{ value: 'Mt H₂/yr', angle: -90, position: 'insideLeft', fontSize: 10 }} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v, n) => [`${v} Mt/yr`, n]} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="demand2023" name="2023" fill={T.sub} opacity={0.6} />
                <Bar dataKey="demand2030" name="2030" fill={T.blue} opacity={0.8} />
                <Bar dataKey="demand2040" name="2040" fill={T.green} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={gridStyle}>
            {SECTORS.map((s, i) => (
              <div key={i} style={{ ...cardStyle, borderLeft: `3px solid ${s.color}` }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{s.name}</div>
                <div style={{ fontSize: 10, color: T.sub, marginTop: 2 }}>{s.type === 'existing' ? '🔵 Existing use' : '🟢 New application'}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11 }}>
                  <span style={{ color: T.sub }}>2023</span><span style={{ fontWeight: 700 }}>{s.demand2023} Mt</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                  <span style={{ color: T.sub }}>2030</span><span style={{ fontWeight: 700, color: T.blue }}>{s.demand2030} Mt</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                  <span style={{ color: T.sub }}>2040</span><span style={{ fontWeight: 700, color: T.green }}>{s.demand2040} Mt</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2 — EXPORTER ANALYSIS */}
      {tab === 2 && (
        <div style={sectionStyle}>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Green H₂ Export Potential by Country (Mt/yr)</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={EXPORTERS}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="country" tick={{ fontSize: 10 }} />
                <YAxis label={{ value: 'Mt H₂/yr', angle: -90, position: 'insideLeft', fontSize: 10 }} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v, n) => [`${v} Mt/yr`, n]} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="potential2030" name="2030" fill={T.blue} opacity={0.8} />
                <Bar dataKey="potential2040" name="2040" fill={T.green} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={gridStyle}>
            {EXPORTERS.map((e, i) => (
              <div key={i} style={{ ...cardStyle, borderTop: `3px solid ${e.color}` }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: e.color }}>{e.country}</div>
                <div style={{ fontSize: 10, color: T.sub, marginBottom: 8 }}>{e.status}</div>
                <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
                  <tbody>
                    {[
                      ['2030 potential', `${e.potential2030} Mt/yr`],
                      ['2040 potential', `${e.potential2040} Mt/yr`],
                      ['Est. LCOH 2030', `${e.lcoh} €/kg`],
                      ['Distance to EU', `${e.distance.toLocaleString()} km`],
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

      {/* TAB 3 — IMPORTER DEMAND */}
      {tab === 3 && (
        <div style={sectionStyle}>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Key H₂ Import Nations — Demand & Source Preferences</div>
            <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.bg }}>
                  {['Country', '2030 Demand (Mt)', '2040 Demand (Mt)', 'Key Sources', 'Priority', 'Import Mix'].map(h => (
                    <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: T.sub, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {IMPORTERS.map((imp, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 ? T.bg : T.card }}>
                    <td style={{ padding: '6px 8px', fontWeight: 700, color: imp.color }}>{imp.country}</td>
                    <td style={{ padding: '6px 8px', fontFamily: 'monospace' }}>{imp.demand2030}</td>
                    <td style={{ padding: '6px 8px', fontFamily: 'monospace' }}>{imp.demand2040}</td>
                    <td style={{ padding: '6px 8px', fontSize: 10 }}>{imp.sources.join(', ')}</td>
                    <td style={{ padding: '6px 8px', color: imp.priority === 'Very High' ? T.red : imp.priority === 'High' ? T.amber : T.teal }}>{imp.priority}</td>
                    <td style={{ padding: '6px 8px', fontSize: 10 }}>Pipeline + Ship</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Import Demand Growth — Key Economies</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={IMPORTERS}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="country" tick={{ fontSize: 10 }} />
                <YAxis label={{ value: 'Mt/yr', angle: -90, position: 'insideLeft', fontSize: 10 }} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v, n) => [`${v} Mt/yr`, n]} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="demand2030" name="2030" fill={T.blue} opacity={0.8} />
                <Bar dataKey="demand2040" name="2040" fill={T.green} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TAB 4 — TRADE FLOW MATRIX */}
      {tab === 4 && (
        <div style={sectionStyle}>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 4 }}>H₂ Trade Flow Corridors — 2030 Projection (Mt/yr)</div>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 14 }}>Includes physical H₂ equivalents — ammonia, LOHC, and LH₂ converted to H₂ basis.</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={tradeMatrix} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" label={{ value: 'Mt H₂ eq/yr', position: 'insideBottom', offset: -3, fontSize: 10 }} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="from" width={200} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v, n) => [`${v} Mt/yr`, 'Volume']} />
                <Bar dataKey="vol" name="Volume" radius={[0, 4, 4, 0]}>
                  {tradeMatrix.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Trade Flow Details</div>
            <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.bg }}>
                  {['Corridor', 'Volume (Mt/yr)', 'Mode', 'LCOH+Transport', 'Competitiveness'].map(h => (
                    <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: T.sub, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tradeMatrix.map((d, i) => {
                  const lcohRange = [3.5, 2.8, 3.2, 3.5, 3.8, 4.1, 3.7, 3.2][i];
                  return (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 ? T.bg : T.card }}>
                      <td style={{ padding: '6px 8px', fontWeight: 600, color: d.color }}>{d.from}</td>
                      <td style={{ padding: '6px 8px', fontFamily: 'monospace' }}>{d.vol}</td>
                      <td style={{ padding: '6px 8px' }}>{d.mode}</td>
                      <td style={{ padding: '6px 8px', fontFamily: 'monospace' }}>{lcohRange} €/kg</td>
                      <td style={{ padding: '6px 8px', color: lcohRange < 3.5 ? T.green : lcohRange < 4 ? T.amber : T.red }}>
                        {lcohRange < 3.5 ? 'Competitive' : lcohRange < 4 ? 'Marginal' : 'Requires subsidy'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5 — HYDROGEN VALLEYS */}
      {tab === 5 && (
        <div style={sectionStyle}>
          <div style={gridStyle}>
            {VALLEYS.map((v, i) => (
              <div key={i} style={{ ...cardStyle, borderLeft: `3px solid ${[T.blue, T.teal, T.green, T.amber, T.red, T.indigo, T.purple, T.sage][i]}` }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.navy }}>{v.name}</div>
                <div style={{ fontSize: 10, color: T.sub, marginBottom: 8 }}>{v.country}</div>
                <div style={{ fontSize: 11, marginBottom: 4 }}>{v.focus}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginTop: 8 }}>
                  <span style={{ color: T.sub }}>Investment</span><span style={{ fontWeight: 700 }}>${v.investment}B</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                  <span style={{ color: T.sub }}>Jobs (est.)</span><span style={{ fontWeight: 700 }}>{v.jobs.toLocaleString()}</span>
                </div>
                <div style={{ marginTop: 6, padding: '4px 8px', borderRadius: 4, background: v.status === 'Active' || v.status.includes('Const') ? '#D1FAE5' : '#FEF3C7', fontSize: 10, color: v.status === 'Active' || v.status.includes('Const') ? T.green : T.amber, fontWeight: 600, display: 'inline-block' }}>
                  {v.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6 — GEOPOLITICAL RISK */}
      {tab === 6 && (
        <div style={sectionStyle}>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Geopolitical Risk Scoring — H₂ Exporter Nations</div>
            <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.bg }}>
                  {['Country', 'Political Stability', 'Regulatory Risk', 'Infrastructure', 'Contract Enforce', 'Overall Score', 'Investment View'].map(h => (
                    <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: T.sub, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {geoRisks.map((r, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 ? T.bg : T.card }}>
                    <td style={{ padding: '6px 8px', fontWeight: 700, color: r.color }}>{r.country}</td>
                    <td style={{ padding: '6px 8px' }}>{r.politicalStability}/10</td>
                    <td style={{ padding: '6px 8px' }}>{r.regulatoryRisk}/10</td>
                    <td style={{ padding: '6px 8px' }}>{r.infrastructureRisk}/10</td>
                    <td style={{ padding: '6px 8px' }}>{r.contractEnforce}/10</td>
                    <td style={{ padding: '6px 8px', fontWeight: 700, color: r.overallScore >= 7.5 ? T.green : r.overallScore >= 6 ? T.amber : T.red }}>{r.overallScore.toFixed(1)}/10</td>
                    <td style={{ padding: '6px 8px', fontSize: 10, color: r.overallScore >= 7.5 ? T.green : r.overallScore >= 6 ? T.amber : T.red }}>
                      {r.overallScore >= 7.5 ? '✓ Preferred' : r.overallScore >= 6 ? '~ Acceptable' : '⚠ Monitor'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Critical Risk Factors — H₂ Supply Chain</div>
            {[
              { risk: 'Natural gas price volatility (blue H₂)', impact: 'High', mitigation: 'Long-term gas offtake or renewable-only strategy' },
              { risk: 'Geopolitical disruption of shipping lanes', impact: 'Medium', mitigation: 'Diversify corridors, pipeline fallback' },
              { risk: 'Carbon border adjustment (CBAM)', impact: 'Medium', mitigation: 'Low-carbon certification, lifetime tracking' },
              { risk: 'Regulatory change (RFNBO additionality)', impact: 'High', mitigation: 'Dedicated RE assets, legal due diligence' },
              { risk: 'Technology obsolescence (electrolyzers)', impact: 'Medium', mitigation: 'Stack replacement provisions, PPA indexing' },
              { risk: 'Water scarcity at production sites', impact: 'Medium-High', mitigation: 'Seawater desalination integration, stress mapping' },
              { risk: 'Offtake counterparty default', impact: 'High', mitigation: 'State guarantees, diversified buyer base' },
              { risk: 'CCS storage integrity failure', impact: 'High (blue)', mitigation: 'Geological survey, MRV obligations, MMV protocol' },
            ].map((r, i) => (
              <div key={i} style={{ padding: '8px 0', borderBottom: `1px solid ${T.border}`, fontSize: 11 }}>
                <div style={{ fontWeight: 600 }}>{r.risk}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                  <span style={{ color: T.sub, fontSize: 10 }}>{r.mitigation}</span>
                  <span style={{ color: r.impact === 'High' ? T.red : T.amber, fontWeight: 600 }}>{r.impact}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7 — PRICE FORECASTS */}
      {tab === 7 && (
        <div style={sectionStyle}>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 4 }}>H₂ Price Trajectory 2025–2040 — All Types (€/kg at production)</div>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 14 }}>Green H₂ crosses below blue in 2030–2032 in best-case solar/wind locations. Grey stays cheapest absent carbon pricing.</div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={priceData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                <YAxis label={{ value: '€/kg H₂', angle: -90, position: 'insideLeft', fontSize: 10 }} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v, n) => [`${v} €/kg`, n]} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <ReferenceLine y={2} stroke={T.accent} strokeDasharray="4 4" label={{ value: 'EU 2030 target', fontSize: 9, fill: T.accent }} />
                <Line type="monotone" dataKey="greenWind" name="Green (wind)" stroke={T.teal} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="greenSolar" name="Green (solar MENA)" stroke={T.green} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="blue" name="Blue H₂" stroke={T.blue} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="grey" name="Grey H₂" stroke={T.red} strokeWidth={1} strokeDasharray="5 3" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Price at Delivery — European Import Hub (€/kg, 2030 estimate)</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={[
                { source: 'Norway pipeline', prod: 3.5, trans: 0.2, total: 3.7 },
                { source: 'Morocco pipeline', prod: 2.5, trans: 0.4, total: 2.9 },
                { source: 'Chile NH₃ ship', prod: 2.8, trans: 1.2, total: 4.0 },
                { source: 'Aus NH₃ ship (JP)', prod: 3.2, trans: 0.9, total: 4.1 },
                { source: 'KSA NH₃ pipeline', prod: 2.2, trans: 0.6, total: 2.8 },
                { source: 'DOM green (DE)', prod: 4.5, trans: 0.1, total: 4.6 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="source" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={55} />
                <YAxis label={{ value: '€/kg', angle: -90, position: 'insideLeft', fontSize: 10 }} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v, n) => [`${v} €/kg`, n]} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <ReferenceLine y={3.0} stroke={T.green} strokeDasharray="4 4" label={{ value: 'Competitive threshold', fontSize: 9, fill: T.green }} />
                <Bar dataKey="prod" name="Production" stackId="a" fill={T.blue} />
                <Bar dataKey="trans" name="Transport" stackId="a" fill={T.amber} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TAB 8 — TECHNOLOGY MIX */}
      {tab === 8 && (
        <div style={sectionStyle}>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 4 }}>Electrolyzer Installed Capacity by Technology (GW cumulative)</div>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 14 }}>AEL dominates today. PEM ramps rapidly. SOEC for industrial waste heat. ATR/SMR+CCS parallel track for blue H₂.</div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={techMixData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                <YAxis label={{ value: 'GW', angle: -90, position: 'insideLeft', fontSize: 10 }} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v, n) => [`${v} GW`, n]} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Area type="monotone" dataKey="AEL" name="AEL" stackId="a" stroke={T.green} fill={T.green} fillOpacity={0.6} />
                <Area type="monotone" dataKey="PEM" name="PEM" stackId="a" stroke={T.blue} fill={T.blue} fillOpacity={0.6} />
                <Area type="monotone" dataKey="SOEC" name="SOEC" stackId="a" stroke={T.amber} fill={T.amber} fillOpacity={0.6} />
                <Area type="monotone" dataKey="ATR_CCS" name="ATR+CCS (blue)" stackId="a" stroke={T.teal} fill={T.teal} fillOpacity={0.6} />
                <Area type="monotone" dataKey="SMR_CCS" name="SMR+CCS (blue)" stackId="a" stroke={T.indigo} fill={T.indigo} fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TAB 9 — INVESTOR DASHBOARD */}
      {tab === 9 && (
        <div style={sectionStyle}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <KpiCard label="Total project pipeline" value="$320 B" unit="announced 2025–2030" color={T.navy} />
            <KpiCard label="% projects at FID/construction" value="12%" unit="of announced" color={T.amber} />
            <KpiCard label="Green H₂ certified 2024" value="0.6 Mt" unit="actual production" color={T.green} />
            <KpiCard label="Avg. equity IRR target" value="12–15%" unit="institutional infra" color={T.blue} />
          </div>
          <div style={gridStyle}>
            <div style={cardStyle}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Top 10 H₂ Investor Themes (2025)</div>
              {[
                ['#1', 'Electrolyzer scale-up (PEM/AEL)', T.blue],
                ['#2', 'Green ammonia export projects', T.green],
                ['#3', 'H₂ import terminal infrastructure', T.teal],
                ['#4', 'EU H₂ Bank-backed RFNBO', T.indigo],
                ['#5', 'IRA §45V-driven US projects', T.amber],
                ['#6', 'Steel DRI (H₂ direct reduction)', T.red],
                ['#7', 'Hydrogen valley industrial clusters', T.purple],
                ['#8', 'Maritime/shipping e-fuel play', T.sage],
                ['#9', 'CCS infrastructure for blue H₂', T.navy],
                ['#10', 'H₂ pipeline backbone (Europe)', T.sub],
              ].map(([rank, theme, color], i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{rank}</div>
                  <div style={{ fontSize: 11 }}>{theme}</div>
                </div>
              ))}
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Key H₂ Market Benchmarks & Data Sources</div>
              {[
                { source: 'IEA Global Hydrogen Review', url: 'iea.org/hydrogen', update: 'Annual' },
                { source: 'IRENA World Energy Transitions Outlook', url: 'irena.org', update: 'Annual' },
                { source: 'BloombergNEF H₂ Long-Term Outlook', url: 'bnef.com', update: 'Quarterly' },
                { source: 'Hydrogen Council — Hydrogen Insights', url: 'hydrogencouncil.com', update: 'Annual' },
                { source: 'EU H₂ Observatory', url: 'h2obs.eu', update: 'Quarterly' },
                { source: 'S&P Platts — H₂ Price Assessment', url: 'spglobal.com', update: 'Daily' },
                { source: 'BNEF Global Electrolyzer Tracker', url: 'bnef.com/hydrogen', update: 'Monthly' },
                { source: 'Rocky Mountain Institute — HMI', url: 'rmi.org', update: 'Bi-annual' },
              ].map((s, i) => (
                <div key={i} style={{ padding: '7px 0', borderBottom: `1px solid ${T.border}`, fontSize: 11 }}>
                  <div style={{ fontWeight: 600 }}>{s.source}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                    <span style={{ color: T.teal, fontSize: 10 }}>{s.url}</span>
                    <span style={{ color: T.sub, fontSize: 10 }}>{s.update}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
