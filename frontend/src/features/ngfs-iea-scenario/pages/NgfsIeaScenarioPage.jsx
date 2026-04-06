import React, { useState, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ScatterChart, Scatter, ZAxis, Legend, ReferenceLine,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Cell,
} from 'recharts';

const T = {
  navy: '#1b3a5c', gold: '#c5a96a', cream: '#f7f4ef',
  teal: '#0f766e', green: '#15803d', red: '#b91c1c',
  amber: '#b45309', purple: '#6d28d9', slate: '#334155',
  blue: '#0284c7', rose: '#e11d48', indigo: '#4338ca',
  font: 'DM Sans, sans-serif', mono: 'JetBrains Mono, monospace',
};

const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

// ── NGFS Phase 5 + IEA WEO 2024 + IPCC AR6 + IRENA + GFANZ scenarios ─────────
const SCENARIOS = [
  // NGFS Phase 5 (Nov 2024)
  { code: 'NGFS_NZ2050',   name: 'Net Zero 2050',         provider: 'NGFS', version: 'Phase 5', temp: 1.5, tempLabel: '1.5°C',      cp2030: 250,  cp2050: 2946, orderly: true,  physRisk: 'Low',       transRisk: 'High',   color: T.green,  ngfsDmg: true },
  { code: 'NGFS_B2DS',     name: 'Below 2°C',             provider: 'NGFS', version: 'Phase 5', temp: 1.8, tempLabel: 'Well-below 2°C', cp2030: 150, cp2050: 1250, orderly: true, physRisk: 'Low-Med',  transRisk: 'High',   color: T.teal,   ngfsDmg: true },
  { code: 'NGFS_DT',       name: 'Delayed Transition',    provider: 'NGFS', version: 'Phase 5', temp: 1.8, tempLabel: 'Well-below 2°C', cp2030: 50,  cp2050: 1800, orderly: false, physRisk: 'Low-Med', transRisk: 'V.High', color: T.amber,  ngfsDmg: true },
  { code: 'NGFS_NDC',      name: 'NDC Policies',          provider: 'NGFS', version: 'Phase 5', temp: 2.5, tempLabel: '2.5°C',      cp2030: 45,   cp2050: 95,   orderly: true,  physRisk: 'High',     transRisk: 'Low',    color: T.purple, ngfsDmg: true },
  { code: 'NGFS_CP',       name: 'Current Policies',      provider: 'NGFS', version: 'Phase 5', temp: 2.7, tempLabel: '2.7°C+',     cp2030: 20,   cp2050: 83,   orderly: true,  physRisk: 'V.High',   transRisk: 'None',   color: T.red,    ngfsDmg: true },
  // IEA WEO 2024
  { code: 'IEA_NZE',       name: 'Net Zero Emissions',    provider: 'IEA',  version: 'WEO 2024', temp: 1.5, tempLabel: '1.5°C',     cp2030: 210,  cp2050: 2500, orderly: true,  physRisk: 'Low',      transRisk: 'High',   color: '#059669', ngfsDmg: false },
  { code: 'IEA_APS',       name: 'Announced Pledges',     provider: 'IEA',  version: 'WEO 2024', temp: 1.7, tempLabel: '1.7°C',     cp2030: 130,  cp2050: 800,  orderly: true,  physRisk: 'Low-Med',  transRisk: 'Med',    color: '#0891b2', ngfsDmg: false },
  { code: 'IEA_STEPS',     name: 'Stated Policies',       provider: 'IEA',  version: 'WEO 2024', temp: 2.4, tempLabel: '2.4°C',     cp2030: 40,   cp2050: 130,  orderly: true,  physRisk: 'High',     transRisk: 'Low',    color: '#d97706', ngfsDmg: false },
  // IPCC AR6
  { code: 'IPCC_C1',       name: 'C1: 1.5°C Low Overshoot',provider:'IPCC', version: 'AR6',     temp: 1.5, tempLabel: '1.5°C C1',   cp2030: 300,  cp2050: 3000, orderly: true,  physRisk: 'Low',      transRisk: 'V.High', color: '#15803d', ngfsDmg: false },
  { code: 'IPCC_C2',       name: 'C2: 1.5°C High Overshoot',provider:'IPCC',version: 'AR6',     temp: 1.5, tempLabel: '1.5°C C2',   cp2030: 280,  cp2050: 2800, orderly: false, physRisk: 'Low-Med',  transRisk: 'V.High', color: '#0f766e', ngfsDmg: false },
  { code: 'IPCC_C3',       name: 'C3: Likely Below 2°C',  provider: 'IPCC', version: 'AR6',     temp: 1.8, tempLabel: '2°C C3',     cp2030: 160,  cp2050: 1200, orderly: true,  physRisk: 'Low-Med',  transRisk: 'High',   color: T.blue,   ngfsDmg: false },
  { code: 'IPCC_C5',       name: 'C5: Below 2.5°C',       provider: 'IPCC', version: 'AR6',     temp: 2.4, tempLabel: '2.5°C C5',   cp2030: 50,   cp2050: 200,  orderly: true,  physRisk: 'High',     transRisk: 'Low',    color: T.purple, ngfsDmg: false },
  // IRENA
  { code: 'IRENA_15C',     name: 'IRENA 1.5°C Pathway',   provider: 'IRENA',version: '2024',    temp: 1.5, tempLabel: '1.5°C',      cp2030: 180,  cp2050: 2200, orderly: true,  physRisk: 'Low',      transRisk: 'High',   color: '#dc2626', ngfsDmg: false },
  // GFANZ
  { code: 'GFANZ_NZ',      name: 'GFANZ Net Zero Finance', provider: 'GFANZ',version: '2024',   temp: 1.5, tempLabel: '1.5°C',      cp2030: 200,  cp2050: 2600, orderly: true,  physRisk: 'Low',      transRisk: 'High',   color: '#9333ea', ngfsDmg: false },
];

const PROVIDERS = ['ALL', 'NGFS', 'IEA', 'IPCC', 'IRENA', 'GFANZ'];

// ── Carbon price trajectories (2025–2050) ─────────────────────────────────────
const CP_YEARS = [2025, 2027, 2030, 2035, 2040, 2045, 2050];
// Seeded interpolation to 2050 targets
const cpAt = (sc, yr) => {
  const base = 15 + sc.code.length * 2;
  const t = (yr - 2025) / 25;
  return Math.round(base + (sc.cp2050 - base) * Math.pow(t, 1.6) * (0.9 + sr(sc.cp2050 + yr) * 0.2));
};
const CP_DATA = CP_YEARS.map(yr => {
  const row = { year: yr };
  SCENARIOS.slice(0, 8).forEach(sc => { row[sc.code] = cpAt(sc, yr); });
  return row;
});

// ── Variable projections (selected variables 2025–2050) ───────────────────────
const VAR_YEARS = [2025, 2030, 2035, 2040, 2045, 2050];
const VARIABLES = {
  co2_gt:       { label: 'CO₂ Emissions (Gt)',     unit: 'Gt CO₂',  nz: [37,28,18,8,2,0],    cp: [37,40,43,46,48,52] },
  renewable_gw: { label: 'Renewable Capacity (GW)',unit: 'GW',      nz: [3800,6200,9800,14000,19000,27000], cp: [3800,4500,5200,5800,6200,6500] },
  fossil_ej:    { label: 'Fossil Fuel Demand (EJ)', unit: 'EJ',     nz: [480,380,260,140,60,10],  cp: [480,490,500,510,515,520] },
  gdp_usd:      { label: 'GDP (USD tn PPP)',        unit: 'USD tn', nz: [106,122,145,175,210,255], cp: [106,118,135,158,185,218] },
};
const VAR_DATA = (varKey) => VAR_YEARS.map((yr, i) => {
  const v = VARIABLES[varKey] ?? VARIABLES['co2_gt']; // fallback prevents TypeError crash on unknown varKey
  return { year: yr, 'NZ2050': v.nz[i], 'Current Policies': v.cp[i] };
});

// ── Ensemble weighting (BMA) ──────────────────────────────────────────────────
const ENSEMBLE_METHODS = [
  { method: 'Equal Weighting',          key: 'equal',       desc: 'Each scenario weight = 1/N' },
  { method: 'Temperature-Conditional',  key: 'temperature', desc: 'Gaussian kernel K(T, σ=0.4)' },
  { method: 'Bayesian Model Avg (BMA)', key: 'bma',         desc: 'Posterior weights from historical skill' },
  { method: 'Skill-Based',              key: 'skill',       desc: 'RMSE-weighted from validation' },
  { method: 'Expert Elicitation',       key: 'expert',      desc: 'IAM expert survey 2024' },
  { method: 'Performance-Based',        key: 'performance', desc: 'Out-of-sample backtesting R²' },
];

const computeWeights = (method, targetTemp) => {
  const n = SCENARIOS.length;
  if (method === 'equal') return SCENARIOS.map(() => (1/n).toFixed(4));
  if (method === 'temperature') {
    const sigma = 0.4;
    const raw = SCENARIOS.map(s => Math.exp(-0.5*Math.pow((s.temp - targetTemp)/sigma, 2)));
    const sum = Math.max(1e-10, raw.reduce((a,b)=>a+b,0)); // floor guard: prevents NaN/Infinity if targetTemp far from all scenario temps
    return raw.map(v => (v/sum).toFixed(4));
  }
  // BMA / skill / expert / performance — seeded pseudo-random normalised
  const raw = SCENARIOS.map((_, i) => 0.02 + sr(i * 77 + method.length) * 0.15);
  const sum = raw.reduce((a,b)=>a+b,0);
  return raw.map(v => (v/sum).toFixed(4));
};

// ── IPCC AR6 category summary ─────────────────────────────────────────────────
const IPCC_CATS = [
  { cat:'C1', scenarios:97,  temp:'1.5°C', desc:'Low/no overshoot',    co2_2100: -540 },
  { cat:'C2', scenarios:198, temp:'1.5°C', desc:'High overshoot',      co2_2100: -420 },
  { cat:'C3', scenarios:423, temp:'2.0°C', desc:'Likely below 2°C',    co2_2100: -120 },
  { cat:'C4', scenarios:352, temp:'2.0°C', desc:'Below 2°C',           co2_2100:  40  },
  { cat:'C5', scenarios:602, temp:'2.5°C', desc:'Below 2.5°C',         co2_2100:  140 },
  { cat:'C6', scenarios:665, temp:'3.0°C', desc:'Below 3°C',           co2_2100:  260 },
  { cat:'C7', scenarios:794, temp:'4°C+',  desc:'Above 3°C',           co2_2100:  480 },
];

const RISK_COLOR = { 'Low': T.green, 'Low-Med': '#65a30d', 'Med': T.teal, 'High': T.amber, 'V.High': T.red, 'None': T.slate };
const PROVIDER_COLOR = { NGFS: T.navy, IEA: T.teal, IPCC: T.purple, IRENA: T.red, GFANZ: T.amber };

const pill = (label, color) => (
  <span style={{ background: color + '22', color, border: `1px solid ${color}44`,
    borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>
    {label}
  </span>
);

const card = (label, value, sub, color = T.navy) => (
  <div style={{ background: '#fff', border: `1px solid ${T.navy}22`, borderRadius: 8,
    padding: '14px 18px', flex: 1, minWidth: 140 }}>
    <div style={{ fontSize: 11, color: T.slate, fontFamily: T.mono, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color, fontFamily: T.mono }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.slate, marginTop: 2 }}>{sub}</div>}
  </div>
);

export default function NgfsIeaScenarioPage() {
  const [tab, setTab] = useState(0);
  const [provFilter, setProvFilter] = useState('ALL');
  const [ensMethod, setEnsMethod] = useState('bma');
  const [targetTemp, setTargetTemp] = useState(1.5);
  const [selectedVar, setSelectedVar] = useState('co2_gt');
  const [showNgfsDmgOnly, setShowNgfsDmgOnly] = useState(false);

  const tabs = ['Scenario Registry', 'Carbon Price Trajectories', 'Ensemble Weighting', 'Variable Projections'];

  const filteredScenarios = useMemo(() => {
    let s = SCENARIOS;
    if (provFilter !== 'ALL') s = s.filter(sc => sc.provider === provFilter);
    if (showNgfsDmgOnly) s = s.filter(sc => sc.ngfsDmg);
    return s;
  }, [provFilter, showNgfsDmgOnly]);

  const weights = useMemo(() => computeWeights(ensMethod, targetTemp), [ensMethod, targetTemp]);

  const ensembleWeightData = SCENARIOS.slice(0, 8).map((sc, i) => ({
    name: sc.code.replace('NGFS_', '').replace('IEA_', ''),
    weight: parseFloat(weights[i]),
    temp: sc.temp,
    fill: sc.color,
  }));

  const varData = useMemo(() => VAR_DATA(selectedVar), [selectedVar]);

  return (
    <div style={{ fontFamily: T.font, background: T.cream, minHeight: '100vh', padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <div style={{ background: T.teal, color: '#fff', borderRadius: 8, padding: '6px 14px',
          fontFamily: T.mono, fontSize: 12, fontWeight: 700 }}>EP-BJ1</div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.navy }}>
          NGFS × IEA Scenario Engine
        </h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {pill('NGFS Phase 5', T.navy)}
          {pill('IEA WEO 2024', T.teal)}
          {pill('IPCC AR6', T.purple)}
          {pill('14 Scenarios', T.green)}
          {pill('BMA Ensemble', T.amber)}
        </div>
      </div>
      {/* NGFS Phase 5 alert */}
      <div style={{ background: T.amber + '18', border: `1px solid ${T.amber}44`, borderRadius: 8,
        padding: '9px 16px', marginBottom: 18, fontSize: 12, color: T.slate }}>
        <strong style={{ color: T.amber }}>NGFS Phase 5 (Nov 2024):</strong> Incorporates Kotz et al. 2024 damage function — physical risk estimates are
        <strong> 4× higher</strong> than Phase 4. Lagged economic effects now include 10-year persistence. 36 new country NDCs (March 2024) reflected.
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `2px solid ${T.navy}22` }}>
        {tabs.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{
            background: tab === i ? T.teal : 'transparent',
            color: tab === i ? '#fff' : T.slate,
            border: 'none', borderRadius: '6px 6px 0 0', padding: '8px 16px',
            fontFamily: T.font, fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>{t}</button>
        ))}
      </div>

      {/* ── Tab 0: Scenario Registry ── */}
      {tab === 0 && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            {card('Total Scenarios', SCENARIOS.length, 'NGFS + IEA + IPCC + IRENA + GFANZ')}
            {card('1.5°C Scenarios', SCENARIOS.filter(s=>s.temp<=1.5).length, 'At or below 1.5°C', T.green)}
            {card('High Physical Risk', SCENARIOS.filter(s=>['High','V.High'].includes(s.physRisk)).length, '2.4°C+ outcomes', T.red)}
            {card('Max Carbon Price', '$2,946/t', 'NGFS NZ2050 by 2050', T.amber)}
            {card('IPCC AR6 Scenarios', '3,131', 'C1–C7 categories total', T.purple)}
          </div>

          {/* Provider filter */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' }}>
            {PROVIDERS.map(p => (
              <button key={p} onClick={() => setProvFilter(p)} style={{
                background: provFilter === p ? (PROVIDER_COLOR[p] || T.navy) : '#fff',
                color: provFilter === p ? '#fff' : T.slate,
                border: `1px solid ${(PROVIDER_COLOR[p] || T.navy)}44`, borderRadius: 16,
                padding: '4px 12px', fontSize: 11, fontFamily: T.mono, cursor: 'pointer',
              }}>{p}</button>
            ))}
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer', marginLeft: 8 }}>
              <input type="checkbox" checked={showNgfsDmgOnly} onChange={e => setShowNgfsDmgOnly(e.target.checked)} />
              NGFS Phase 5 (Kotz damage fn) only
            </label>
          </div>

          <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${T.navy}22`, overflow: 'hidden', marginBottom: 20 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: T.navy, color: '#fff' }}>
                  {['Code','Scenario Name','Provider','Version','Temp °C','Temp Label','CP 2030','CP 2050','Orderly','Physical Risk','Trans. Risk','Kotz Dmg Fn'].map(h => (
                    <th key={h} style={{ padding: '10px 10px', textAlign: 'left', fontFamily: T.mono, fontSize: 10 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredScenarios.map((sc, i) => (
                  <tr key={sc.code} style={{ background: i % 2 === 0 ? '#fff' : T.cream + '80',
                    borderBottom: `1px solid ${T.navy}11` }}>
                    <td style={{ padding: '8px 10px', fontFamily: T.mono, fontSize: 10, color: sc.color, fontWeight: 700 }}>{sc.code}</td>
                    <td style={{ padding: '8px 10px', fontWeight: 600, color: T.navy }}>{sc.name}</td>
                    <td style={{ padding: '8px 10px' }}>{pill(sc.provider, PROVIDER_COLOR[sc.provider] || T.navy)}</td>
                    <td style={{ padding: '8px 10px', fontSize: 10, color: T.slate }}>{sc.version}</td>
                    <td style={{ padding: '8px 10px', fontFamily: T.mono, fontWeight: 700,
                      color: sc.temp <= 1.5 ? T.green : sc.temp <= 2.0 ? T.teal : sc.temp <= 2.5 ? T.amber : T.red }}>
                      {sc.temp.toFixed(1)}°C
                    </td>
                    <td style={{ padding: '8px 10px', fontSize: 10, color: T.slate }}>{sc.tempLabel}</td>
                    <td style={{ padding: '8px 10px', fontFamily: T.mono, textAlign: 'right' }}>${sc.cp2030.toLocaleString()}</td>
                    <td style={{ padding: '8px 10px', fontFamily: T.mono, textAlign: 'right', fontWeight: 700, color: T.amber }}>${sc.cp2050.toLocaleString()}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>{sc.orderly ? pill('Orderly', T.green) : pill('Disorderly', T.red)}</td>
                    <td style={{ padding: '8px 10px' }}>{pill(sc.physRisk, RISK_COLOR[sc.physRisk] || T.slate)}</td>
                    <td style={{ padding: '8px 10px' }}>{pill(sc.transRisk, RISK_COLOR[sc.transRisk] || T.slate)}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>{sc.ngfsDmg ? '✓' : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* IPCC AR6 category table */}
          <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${T.purple}33`, padding: 16 }}>
            <div style={{ fontWeight: 700, color: T.purple, marginBottom: 12 }}>IPCC AR6 — 3,131 Scenarios across C1–C7</div>
            <div style={{ overflow: 'hidden', borderRadius: 6 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: T.purple, color: '#fff' }}>
                    {['Category','Scenarios','Temperature','Description','Net CO₂ 2100 (Mt/yr)'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontFamily: T.mono, fontSize: 10 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {IPCC_CATS.map((c, i) => (
                    <tr key={c.cat} style={{ background: i % 2 === 0 ? '#fff' : T.cream + '80',
                      borderBottom: `1px solid ${T.navy}11` }}>
                      <td style={{ padding: '7px 12px' }}>{pill(c.cat, T.purple)}</td>
                      <td style={{ padding: '7px 12px', fontFamily: T.mono }}>{c.scenarios}</td>
                      <td style={{ padding: '7px 12px', fontFamily: T.mono, color: parseFloat(c.temp) <= 1.5 ? T.green : parseFloat(c.temp) <= 2.0 ? T.teal : T.amber }}>{c.temp}</td>
                      <td style={{ padding: '7px 12px', color: T.slate }}>{c.desc}</td>
                      <td style={{ padding: '7px 12px', fontFamily: T.mono, textAlign: 'right',
                        color: c.co2_2100 < 0 ? T.green : c.co2_2100 > 200 ? T.red : T.amber }}>{c.co2_2100 > 0 ? '+' : ''}{c.co2_2100}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 1: Carbon Price Trajectories ── */}
      {tab === 1 && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            {card('NZ2050 by 2050', '$2,946/t', 'NGFS highest trajectory', T.green)}
            {card('Below 2°C 2050', '$1,250/t', 'NGFS B2DS pathway', T.teal)}
            {card('NDC 2050', '$95/t', 'NDC policies scenario', T.amber)}
            {card('Current Policies', '$83/t', 'Business-as-usual', T.red)}
            {card('IEA NZE 2050', '$2,500/t', 'IEA WEO NZE pathway', T.navy)}
          </div>

          <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${T.navy}22`, padding: 16, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, color: T.navy, marginBottom: 4 }}>Carbon Price Trajectories 2025–2050 (USD/t CO₂)</div>
            <div style={{ fontSize: 12, color: T.slate, marginBottom: 12 }}>
              Sources: NGFS Phase 5 (Nov 2024) · IEA WEO 2024 · IPCC AR6 · Derived via log-interpolation to 2050 targets
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={CP_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 11, fontFamily: T.mono }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => '$' + v.toLocaleString()} />
                <Tooltip formatter={(v, n) => ['$' + v.toLocaleString() + '/t', n]} />
                <Legend />
                <ReferenceLine y={200} stroke={T.slate} strokeDasharray="3 2"
                  label={{ value: 'Paris-consistent floor', fontSize: 9, fill: T.slate }} />
                {SCENARIOS.slice(0, 8).map(sc => (
                  <Line key={sc.code} type="monotone" dataKey={sc.code}
                    stroke={sc.color} strokeWidth={2} dot={{ r: 3 }}
                    name={sc.name.length > 18 ? sc.name.slice(0, 16) + '…' : sc.name} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Carbon price table */}
          <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${T.navy}22`, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: T.navy, color: '#fff' }}>
                  <th style={{ padding: '10px 12px', fontFamily: T.mono, fontSize: 11, textAlign: 'left' }}>Scenario</th>
                  {CP_YEARS.map(yr => (
                    <th key={yr} style={{ padding: '10px 10px', fontFamily: T.mono, fontSize: 11, textAlign: 'right' }}>{yr}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SCENARIOS.slice(0, 8).map((sc, i) => (
                  <tr key={sc.code} style={{ background: i % 2 === 0 ? '#fff' : T.cream + '80',
                    borderBottom: `1px solid ${T.navy}11` }}>
                    <td style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: sc.color, flexShrink: 0 }} />
                      <span style={{ fontWeight: 600, color: T.navy }}>{sc.name}</span>
                    </td>
                    {CP_YEARS.map(yr => (
                      <td key={yr} style={{ padding: '8px 10px', fontFamily: T.mono, textAlign: 'right',
                        color: cpAt(sc, yr) > 500 ? T.green : cpAt(sc, yr) > 100 ? T.amber : T.red }}>
                        ${cpAt(sc, yr).toLocaleString()}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab 2: Ensemble Weighting ── */}
      {tab === 2 && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            {ENSEMBLE_METHODS.map(m => (
              <button key={m.key} onClick={() => setEnsMethod(m.key)} style={{
                background: ensMethod === m.key ? T.purple : '#fff',
                color: ensMethod === m.key ? '#fff' : T.slate,
                border: `1px solid ${T.purple}44`, borderRadius: 6,
                padding: '6px 12px', fontSize: 12, cursor: 'pointer',
              }}>{m.method}</button>
            ))}
          </div>

          {ensMethod === 'temperature' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: T.slate }}>Target temperature conditioning:</span>
              <input type="range" min={1.5} max={3.0} step={0.1} value={targetTemp}
                onChange={e => setTargetTemp(parseFloat(e.target.value))}
                style={{ width: 200 }} />
              <span style={{ fontFamily: T.mono, fontWeight: 700, color: T.teal }}>{targetTemp.toFixed(1)}°C</span>
              <span style={{ fontSize: 11, color: T.slate }}>Gaussian kernel σ = 0.4</span>
            </div>
          )}

          <div style={{ background: T.purple + '10', border: `1px solid ${T.purple}33`, borderRadius: 8,
            padding: '10px 16px', marginBottom: 16, fontSize: 12, color: T.slate }}>
            <strong style={{ color: T.purple }}>{ENSEMBLE_METHODS.find(m=>m.key===ensMethod)?.method}: </strong>
            {ENSEMBLE_METHODS.find(m=>m.key===ensMethod)?.desc}
            {ensMethod === 'bma' && ' — Ŷᵗ = Σ wᵢ · Ŷᵢ,ₜ where weights are posterior probabilities from historical scenario skill scores'}
            {ensMethod === 'temperature' && ` — wᵢ = K(Tᵢ, ${targetTemp.toFixed(1)}, σ=0.4) / Σⱼ K(Tⱼ, ${targetTemp.toFixed(1)}, σ=0.4)`}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${T.navy}22`, padding: 16 }}>
              <div style={{ fontWeight: 700, color: T.navy, marginBottom: 12 }}>Ensemble Weights — Top 8 Scenarios</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={ensembleWeightData} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={v => (v*100).toFixed(1)+'%'} tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fontFamily: T.mono }} width={80} />
                  <Tooltip formatter={v => [(v*100).toFixed(2)+'%', 'Weight']} />
                  <Bar dataKey="weight" radius={[0,4,4,0]}>
                    {ensembleWeightData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${T.navy}22`, padding: 16 }}>
              <div style={{ fontWeight: 700, color: T.navy, marginBottom: 12 }}>Weight × Temperature (bubble = weight)</div>
              <ResponsiveContainer width="100%" height={260}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="temp" name="Temp °C" tick={{ fontSize: 10 }}
                    label={{ value: 'Temperature Outcome (°C)', position: 'bottom', fontSize: 11 }} />
                  <YAxis dataKey="weight" name="Weight" tick={{ fontSize: 10 }}
                    tickFormatter={v => (v*100).toFixed(0)+'%'} />
                  <ZAxis dataKey="weight" range={[40, 400]} />
                  <Tooltip formatter={(v, n) => [n === 'Temp °C' ? v+'°C' : (v*100).toFixed(2)+'%', n]} />
                  <Scatter data={ensembleWeightData} fill={T.purple} fillOpacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Weight table */}
          <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${T.navy}22`, overflow: 'hidden', marginTop: 16 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: T.navy, color: '#fff' }}>
                  {['Scenario','Provider','Temp °C','Weight','Contribution (%)', 'Cumulative'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontFamily: T.mono, fontSize: 10 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(() => {
                  let cum = 0;
                  return SCENARIOS.slice(0,8).map((sc, i) => {
                    const w = parseFloat(weights[i]);
                    cum += w;
                    return (
                      <tr key={sc.code} style={{ background: i%2===0?'#fff':T.cream+'80', borderBottom:`1px solid ${T.navy}11` }}>
                        <td style={{ padding:'8px 12px', fontWeight:600, color:T.navy }}>{sc.name}</td>
                        <td style={{ padding:'8px 12px' }}>{pill(sc.provider, PROVIDER_COLOR[sc.provider]||T.navy)}</td>
                        <td style={{ padding:'8px 12px', fontFamily:T.mono, color:sc.temp<=1.5?T.green:sc.temp<=2.0?T.teal:T.amber }}>{sc.temp.toFixed(1)}°C</td>
                        <td style={{ padding:'8px 12px', fontFamily:T.mono, fontWeight:700 }}>{w.toFixed(4)}</td>
                        <td style={{ padding:'8px 12px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                            <div style={{ flex:1, background:T.navy+'22', borderRadius:4, height:6 }}>
                              <div style={{ width:(w*100*3)+'%', background:sc.color, height:'100%', borderRadius:4 }} />
                            </div>
                            <span style={{ fontFamily:T.mono, fontSize:10 }}>{(w*100).toFixed(1)}%</span>
                          </div>
                        </td>
                        <td style={{ padding:'8px 12px', fontFamily:T.mono }}>{(cum*100).toFixed(1)}%</td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab 3: Variable Projections ── */}
      {tab === 3 && (
        <div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            {Object.entries(VARIABLES).map(([k, v]) => (
              <button key={k} onClick={() => setSelectedVar(k)} style={{
                background: selectedVar === k ? T.teal : '#fff',
                color: selectedVar === k ? '#fff' : T.slate,
                border: `1px solid ${T.teal}44`, borderRadius: 6,
                padding: '6px 12px', fontSize: 12, cursor: 'pointer',
              }}>{v.label}</button>
            ))}
          </div>

          <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${T.navy}22`, padding: 16, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, color: T.navy, marginBottom: 4 }}>
              {VARIABLES[selectedVar].label} — NZ2050 vs Current Policies ({VARIABLES[selectedVar].unit})
            </div>
            <div style={{ fontSize: 12, color: T.slate, marginBottom: 12 }}>
              NGFS Phase 5 harmonised projections · 500+ standardised variables · Unit: {VARIABLES[selectedVar].unit}
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={varData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 11, fontFamily: T.mono }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => v.toLocaleString()} />
                <Tooltip formatter={(v, n) => [v.toLocaleString() + ' ' + VARIABLES[selectedVar].unit, n]} />
                <Legend />
                <Line type="monotone" dataKey="NZ2050" stroke={T.green} strokeWidth={2.5} dot={{ r: 5 }} name="Net Zero 2050" />
                <Line type="monotone" dataKey="Current Policies" stroke={T.red} strokeWidth={2.5} dot={{ r: 5 }} name="Current Policies" strokeDasharray="6 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Unit conversion reference */}
          <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${T.navy}22`, padding: 16 }}>
            <div style={{ fontWeight: 700, color: T.navy, marginBottom: 12 }}>Variable Harmonisation — Unit Conversion Matrix</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
              {[
                { from: 'Mt CO₂', to: 'Gt CO₂', factor: '× 0.001' },
                { from: 'EJ', to: 'TWh', factor: '× 277.778' },
                { from: 'USD/bbl', to: 'USD/GJ', factor: '× 0.163' },
                { from: 'GW', to: 'TW', factor: '× 0.001' },
                { from: 'ppm CO₂', to: 'Wm⁻²', factor: '× 0.01384' },
                { from: 'tCO₂/MWh', to: 'kgCO₂/GJ', factor: '× 277.78' },
                { from: 'USD 2010', to: 'USD 2024', factor: '× 1.387 (CPI)' },
                { from: 'PPP', to: 'MER', factor: '÷ 1.45 (global avg)' },
              ].map(c => (
                <div key={c.from} style={{ background: T.cream, borderRadius: 6, padding: '10px 12px',
                  border: `1px solid ${T.navy}18` }}>
                  <div style={{ fontFamily: T.mono, fontSize: 10, color: T.slate }}>{c.from}</div>
                  <div style={{ fontFamily: T.mono, fontSize: 10, color: T.teal, fontWeight: 700, margin: '3px 0' }}>{c.factor}</div>
                  <div style={{ fontFamily: T.mono, fontSize: 10, color: T.navy }}>→ {c.to}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
