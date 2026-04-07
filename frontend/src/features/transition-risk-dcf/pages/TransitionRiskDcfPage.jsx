import React, { useState, useMemo } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend, ComposedChart
} from 'recharts';
import { ngfsCarbonPrice } from '../../../engines/climateRisk';

const T = {
  bg: '#f6f4f0', surface: '#ffffff', surfaceH: '#f0ede7', border: '#e5e0d8',
  borderL: '#d5cfc5', navy: '#1b3a5c', navyL: '#2c5a8c', gold: '#c5a96a',
  goldL: '#d4be8a', sage: '#5a8a6a', text: '#1b3a5c', textSec: '#5c6b7e',
  textMut: '#9aa3ae', red: '#dc2626', green: '#16a34a', amber: '#d97706',
  blue: '#2563eb', orange: '#ea580c', purple: '#7c3aed',
  card: '#ffffff', sub: '#5c6b7e', indigo: '#4f46e5', font: "'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono: "'JetBrains Mono','SF Mono','Fira Code',monospace"
};

const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

// ─── NGFS CARBON PRICE MODEL (Phase 4, Sept 2023 — tabular, no sinusoidal approximation) ──
// P0/g0/alpha/T_cycle: display-only parameters for the formula illustration panel.
// Actual price computation uses ngfsCarbonPrice() tabular lookup, NOT this analytic form.
// Approximate values derived from NGFS Phase 4 scenario narratives (Sept 2023).
const SCENARIOS = {
  current_policies:    { label: 'Current Policies',    short: 'CP',  color: T.red,    ngfsKey: 'CurrPol', P0: 12,  g0: 0.02, alpha: 0.05, T_cycle: 8  },
  delayed_transition:  { label: 'Delayed Transition',  short: 'DT',  color: T.orange, ngfsKey: 'DP',      P0: 15,  g0: 0.07, alpha: 0.30, T_cycle: 6  },
  below_2c:           { label: 'Below 2°C',            short: 'B2C', color: T.amber,  ngfsKey: 'BelowAc', P0: 35,  g0: 0.05, alpha: 0.15, T_cycle: 7  },
  divergent_net_zero: { label: 'NDC / Divergent',      short: 'NDC', color: T.blue,   ngfsKey: 'NatAmbI', P0: 18,  g0: 0.04, alpha: 0.20, T_cycle: 7  },
  net_zero_2050:      { label: 'Net Zero 2050',        short: 'NZ',  color: T.green,  ngfsKey: 'NZ2050',  P0: 48,  g0: 0.07, alpha: 0.10, T_cycle: 5  },
};

// Wrapper: local scenario key + year → NGFS Phase 4 price (USD/tCO2e, 2022 real)
function carbonPrice(scenario, t) {
  const key = SCENARIOS[scenario]?.ngfsKey ?? 'CurrPol';
  return ngfsCarbonPrice(key, 2024 + t);
}

function buildPriceTrajectory() {
  const years = Array.from({ length: 27 }, (_, i) => 2024 + i);
  return years.map(yr => {
    const t = yr - 2024;
    const row = { year: yr };
    Object.keys(SCENARIOS).forEach(s => { row[s] = Math.round(carbonPrice(s, t)); });
    return row;
  });
}

// ─── PORTFOLIO ASSETS ────────────────────────────────────────────────────────
const ASSETS = [
  { id: 'A1', name: 'BP Upstream (Equity)',      sector: 'Oil & Gas',          class: 'equity',   book: 2400, emissions_intensity: 180, passthrough: 0.30, wacc_base: 0.085, beta_c: 0.0008 },
  { id: 'A2', name: 'RWE Coal Germany (Loan)',   sector: 'Power (Coal)',        class: 'loan',     book: 980,  emissions_intensity: 820, passthrough: 0.10, wacc_base: 0.072, beta_c: 0.0015 },
  { id: 'A3', name: 'ArcelorMittal (Bond)',      sector: 'Steel',              class: 'bond',     book: 560,  emissions_intensity: 320, passthrough: 0.45, wacc_base: 0.065, beta_c: 0.0012 },
  { id: 'A4', name: 'HeidelbergCement (Equity)', sector: 'Cement',             class: 'equity',   book: 730,  emissions_intensity: 610, passthrough: 0.40, wacc_base: 0.080, beta_c: 0.0013 },
  { id: 'A5', name: 'Lufthansa (Loan)',          sector: 'Aviation',           class: 'loan',     book: 420,  emissions_intensity: 95,  passthrough: 0.20, wacc_base: 0.090, beta_c: 0.0006 },
  { id: 'A6', name: 'Barratt Dev (RE Loan)',     sector: 'Real Estate',        class: 'loan',     book: 310,  emissions_intensity: 45,  passthrough: 0.15, wacc_base: 0.068, beta_c: 0.0004 },
  { id: 'A7', name: 'BASF Chemicals (Equity)',   sector: 'Chemicals',          class: 'equity',   book: 890,  emissions_intensity: 260, passthrough: 0.35, wacc_base: 0.075, beta_c: 0.0010 },
  { id: 'A8', name: 'Glencore Mining (Bond)',    sector: 'Mining',             class: 'bond',     book: 1100, emissions_intensity: 140, passthrough: 0.25, wacc_base: 0.082, beta_c: 0.0007 },
];

function computeDcfImpairment(asset, scenario, horizonYears = 10) {
  const s = SCENARIOS[scenario];
  const baseCFs = Array.from({ length: horizonYears }, (_, i) => {
    const yr = 2024 + i;
    const baseRevenue = asset.book * 0.18 * Math.pow(0.98, i);
    return { year: yr, base_cf: baseRevenue };
  });

  const adjustedCFs = baseCFs.map((cf, i) => {
    const t = i;
    const cprice = carbonPrice(scenario, t);
    const carbonCost = (asset.emissions_intensity / 1000) * cprice * asset.book * 0.001;
    const revenueImpact = cf.base_cf * asset.passthrough * (cprice / 100) * 0.1;
    const adjusted = cf.base_cf - carbonCost - revenueImpact;
    return { ...cf, carbon_cost: carbonCost, revenue_impact: revenueImpact, adjusted_cf: Math.max(0, adjusted) };
  });

  const waccAdjusted = asset.wacc_base + asset.beta_c * carbonPrice(scenario, 5);

  const discountBase = (cf, i) => cf.base_cf / Math.pow(1 + asset.wacc_base, i + 1);
  const discountAdj  = (cf, i) => cf.adjusted_cf / Math.pow(1 + waccAdjusted, i + 1);

  // Terminal value via Gordon Growth Model (g = 2% perpetuity; guard WACC > g)
  const G_TV = 0.02;
  const finalCfBase = adjustedCFs[adjustedCFs.length - 1]?.base_cf ?? 0;
  const finalCfAdj  = adjustedCFs[adjustedCFs.length - 1]?.adjusted_cf ?? 0;
  const tvBase = asset.wacc_base > G_TV
    ? (finalCfBase * (1 + G_TV)) / (asset.wacc_base - G_TV) / Math.pow(1 + asset.wacc_base, horizonYears)
    : 0;
  const tvAdj = waccAdjusted > G_TV
    ? (finalCfAdj  * (1 + G_TV)) / (waccAdjusted  - G_TV) / Math.pow(1 + waccAdjusted,  horizonYears)
    : 0;

  const npvBase = adjustedCFs.reduce((acc, cf, i) => acc + discountBase(cf, i), 0) + tvBase;
  const npvAdj  = adjustedCFs.reduce((acc, cf, i) => acc + discountAdj(cf, i), 0) + tvAdj;
  const impairment = npvBase - npvAdj;
  const strandedYear = adjustedCFs.find(cf => cf.adjusted_cf <= 0)?.year || null;

  return {
    npv_base: npvBase,
    npv_adjusted: npvAdj,
    impairment,
    impairment_pct: (impairment / asset.book) * 100,
    wacc_adjusted: waccAdjusted,
    cash_flows: adjustedCFs,
    stranded_year: strandedYear,
  };
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────
const TABS = ['Carbon Price Trajectories', 'DCF Impairment Engine', 'Portfolio Exposure', 'Stranded CAPEX', 'Scenario Comparison'];

export default function TransitionRiskDcfPage() {
  const [tab, setTab] = useState(0);
  const [selectedScenario, setSelectedScenario] = useState('net_zero_2050');
  const [selectedAsset, setSelectedAsset] = useState('A1');
  const [horizon, setHorizon] = useState(10);

  const priceData = useMemo(() => buildPriceTrajectory(), []);
  const asset = ASSETS.find(a => a.id === selectedAsset);
  const dcf = useMemo(() => computeDcfImpairment(asset, selectedScenario, horizon), [asset, selectedScenario, horizon]);

  const portfolioImpairment = useMemo(() =>
    ASSETS.map(a => {
      const r = computeDcfImpairment(a, selectedScenario, horizon);
      return { ...a, ...r };
    }), [selectedScenario, horizon]);

  const totalBook  = portfolioImpairment.reduce((s, a) => s + a.book, 0);
  const totalImpairment = portfolioImpairment.reduce((s, a) => s + a.impairment, 0);
  const strandedCount = portfolioImpairment.filter(a => a.stranded_year).length;

  const scenarioCompare = useMemo(() =>
    Object.keys(SCENARIOS).map(s => {
      const total = ASSETS.reduce((acc, a) => acc + computeDcfImpairment(a, s, horizon).impairment, 0);
      const pct = (total / (totalBook || 1)) * 100;
      return { scenario: SCENARIOS[s].label, short: SCENARIOS[s].short, impairment: total, pct, color: SCENARIOS[s].color };
    }), [horizon, totalBook]);

  const S = { padding: '0 32px 32px' };

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: T.navy, padding: '24px 32px 0', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ color: T.gold, fontFamily: T.mono, fontSize: 11, letterSpacing: 2, marginBottom: 4 }}>
              EP-CA1 · TRANSITION RISK ENGINE
            </div>
            <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: 0 }}>
              Climate Transition Risk — DCF Impairment & Carbon Price Engine
            </h1>
            <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>
              5 NGFS Scenarios · Carbon Price Trajectories · DCF Impairment · Stranded CAPEX · Portfolio Aggregation
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {[
              { label: 'Total AUM', value: `$${(totalBook / 1000).toFixed(1)}B` },
              { label: 'Total Impairment', value: `$${(totalImpairment / 1000).toFixed(1)}B`, sub: `${((totalImpairment / totalBook) * 100).toFixed(1)}%` },
              { label: 'Stranded Assets', value: strandedCount, sub: 'assets at risk' },
            ].map(m => (
              <div key={m.label} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 16px', textAlign: 'right' }}>
                <div style={{ color: '#94a3b8', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{m.label}</div>
                <div style={{ color: T.gold, fontSize: 20, fontWeight: 700, fontFamily: T.mono }}>{m.value}</div>
                {m.sub && <div style={{ color: '#94a3b8', fontSize: 11 }}>{m.sub}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Scenario selector */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {Object.entries(SCENARIOS).map(([k, v]) => (
            <button key={k} onClick={() => setSelectedScenario(k)} style={{
              padding: '6px 14px', borderRadius: 20, border: `2px solid ${selectedScenario === k ? v.color : 'transparent'}`,
              background: selectedScenario === k ? v.color + '22' : 'rgba(255,255,255,0.06)',
              color: selectedScenario === k ? v.color : '#94a3b8', cursor: 'pointer', fontSize: 12, fontWeight: 600
            }}>{v.short} · {v.label}</button>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0 }}>
          {TABS.map((t2, i) => (
            <button key={i} onClick={() => setTab(i)} style={{
              padding: '10px 20px', border: 'none', background: 'transparent', cursor: 'pointer',
              color: tab === i ? T.gold : '#94a3b8', fontWeight: tab === i ? 700 : 400, fontSize: 13,
              borderBottom: tab === i ? `2px solid ${T.gold}` : '2px solid transparent'
            }}>{t2}</button>
          ))}
        </div>
      </div>

      <div style={S}>

        {/* TAB 0: Carbon Price Trajectories */}
        {tab === 0 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24, marginBottom: 20 }}>
              <h3 style={{ color: T.navy, margin: '0 0 4px' }}>NGFS Carbon Price Trajectories — 5 Scenarios (2024–2050)</h3>
              <p style={{ color: T.textSec, fontSize: 13, margin: '0 0 20px' }}>
                NGFS Phase 4 (Sept 2023) tabular data. CP: Current Policies ~$12→$42 · DT: Delayed Policy, back-loaded shock → $550 · B2C: Below 2°C $35→$580 · NDC: NatAmb $18→$195 · NZ: Net Zero 2050 $48→$860
              </p>
              <ResponsiveContainer width="100%" height={360}>
                <LineChart data={priceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 11, fill: T.textSec }} tickFormatter={v => `$${v}`} label={{ value: 'USD/tCO₂e', angle: -90, position: 'insideLeft', fill: T.textSec, fontSize: 11 }} />
                  <Tooltip formatter={(v, n) => [`$${v}/tCO₂e`, SCENARIOS[n]?.label || n]} labelFormatter={l => `Year: ${l}`} />
                  <Legend formatter={n => SCENARIOS[n]?.label || n} />
                  {Object.entries(SCENARIOS).map(([k, v]) => (
                    <Line key={k} dataKey={k} stroke={v.color} strokeWidth={2} dot={false} name={k} />
                  ))}
                  <ReferenceLine x={2030} stroke={T.textMut} strokeDasharray="4 4" label={{ value: '2030', fill: T.textMut, fontSize: 11 }} />
                  <ReferenceLine x={2050} stroke={T.textMut} strokeDasharray="4 4" label={{ value: 'NZ Target', fill: T.textMut, fontSize: 11 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Formula panel */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20 }}>
                <h4 style={{ color: T.navy, margin: '0 0 12px', fontSize: 14 }}>Current Policies / Below-2°C Formula</h4>
                <div style={{ background: '#f8f7f4', borderRadius: 6, padding: 12, fontFamily: T.mono, fontSize: 12, color: T.navy }}>
                  P(t) = P₀ · exp(g · t) · [1 + α · sin(2π·t/T)]<br /><br />
                  P₀ = ${SCENARIOS[selectedScenario]?.P0}/tCO₂e (2024 base)<br />
                  g  = {(SCENARIOS[selectedScenario]?.g0 * 100).toFixed(0)}%/yr growth<br />
                  α  = {SCENARIOS[selectedScenario]?.alpha} cyclical amplitude<br />
                  T  = {SCENARIOS[selectedScenario]?.T_cycle}yr policy cycle
                </div>
                <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {[2025, 2030, 2040, 2050].map(yr => (
                    <div key={yr} style={{ background: T.bg, borderRadius: 6, padding: 8, textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: T.textMut }}>{yr}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, fontFamily: T.mono }}>
                        ${carbonPrice(selectedScenario, yr - 2024).toFixed(0)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20 }}>
                <h4 style={{ color: T.navy, margin: '0 0 12px', fontSize: 14 }}>Net Zero 2050 Accelerating Formula</h4>
                <div style={{ background: '#f8f7f4', borderRadius: 6, padding: 12, fontFamily: T.mono, fontSize: 12, color: T.navy }}>
                  P(t) = P₀ · exp[(g₀ + β·t) · t]<br /><br />
                  g(t) = g₀ + β·t + γ·ln(E_target/E_actual)<br /><br />
                  β = acceleration param · γ = gap sensitivity
                </div>
                <div style={{ marginTop: 12 }}>
                  <div style={{ color: T.textSec, fontSize: 12, marginBottom: 8 }}>Scenario Price at 2035 vs 2050:</div>
                  {Object.entries(SCENARIOS).map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ color: v.color, fontSize: 12, fontWeight: 600 }}>{v.short}</span>
                      <span style={{ fontFamily: T.mono, fontSize: 12, color: T.navy }}>${carbonPrice(k, 11).toFixed(0)} → ${carbonPrice(k, 26).toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: DCF Impairment Engine */}
        {tab === 1 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
              <div style={{ flex: 1 }}>
                <label style={{ color: T.textSec, fontSize: 12, display: 'block', marginBottom: 4 }}>Asset</label>
                <select value={selectedAsset} onChange={e => setSelectedAsset(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: `1px solid ${T.border}`, borderRadius: 6, background: T.surface, color: T.navy, fontSize: 13 }}>
                  {ASSETS.map(a => <option key={a.id} value={a.id}>{a.name} — {a.sector}</option>)}
                </select>
              </div>
              <div>
                <label style={{ color: T.textSec, fontSize: 12, display: 'block', marginBottom: 4 }}>Horizon (years)</label>
                <input type="range" min={5} max={26} value={horizon} onChange={e => setHorizon(+e.target.value)}
                  style={{ width: 120 }} />
                <span style={{ marginLeft: 8, fontFamily: T.mono, fontSize: 13, color: T.navy }}>{horizon}yr</span>
              </div>
            </div>

            {/* KPI strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Book Value', val: `$${asset.book}M`, sub: asset.class },
                { label: 'Base NPV', val: `$${dcf.npv_base.toFixed(0)}M`, sub: `WACC ${(asset.wacc_base*100).toFixed(1)}%` },
                { label: 'Adjusted NPV', val: `$${dcf.npv_adjusted.toFixed(0)}M`, sub: `WACC ${(dcf.wacc_adjusted*100).toFixed(2)}%` },
                { label: 'DCF Impairment', val: `$${dcf.impairment.toFixed(0)}M`, sub: `${dcf.impairment_pct.toFixed(1)}% of book`, color: dcf.impairment > 0 ? T.red : T.green },
                { label: 'Stranded Year', val: dcf.stranded_year || 'None', sub: dcf.stranded_year ? '⚠ Economically unviable' : '✓ Viable to 2050', color: dcf.stranded_year ? T.red : T.green },
              ].map(m => (
                <div key={m.label} style={{ background: T.surface, borderRadius: 8, border: `1px solid ${T.border}`, padding: 16 }}>
                  <div style={{ fontSize: 10, color: T.textMut, textTransform: 'uppercase', letterSpacing: 1 }}>{m.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, fontFamily: T.mono, color: m.color || T.navy, marginTop: 4 }}>{m.val}</div>
                  <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{m.sub}</div>
                </div>
              ))}
            </div>

            {/* Cash flow waterfall */}
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24, marginBottom: 16 }}>
              <h3 style={{ color: T.navy, margin: '0 0 4px', fontSize: 15 }}>Cash Flow Waterfall — Base vs. Climate-Adjusted ({asset.name})</h3>
              <p style={{ color: T.textSec, fontSize: 12, margin: '0 0 16px' }}>
                Scenario: {SCENARIOS[selectedScenario].label} · Carbon cost passthrough: {(asset.passthrough*100).toFixed(0)}% · Emissions intensity: {asset.emissions_intensity} tCO₂e/M$
              </p>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={dcf.cash_flows}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v.toFixed(0)}M`} />
                  <Tooltip formatter={(v) => [`$${v.toFixed(1)}M`]} />
                  <Legend />
                  <Bar dataKey="base_cf" name="Base CF" fill={T.navyL} opacity={0.6} />
                  <Bar dataKey="carbon_cost" name="Carbon Cost" fill={T.red} opacity={0.8} stackId="deduct" />
                  <Bar dataKey="revenue_impact" name="Revenue Impact" fill={T.orange} opacity={0.8} stackId="deduct" />
                  <Line dataKey="adjusted_cf" name="Adjusted CF" stroke={T.gold} strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* WACC uplift decomposition */}
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20 }}>
              <h4 style={{ color: T.navy, margin: '0 0 12px', fontSize: 14 }}>WACC Climate Uplift Decomposition</h4>
              <div style={{ fontFamily: T.mono, fontSize: 12, color: T.navy, background: T.bg, padding: 12, borderRadius: 6 }}>
                WACC_adj = WACC_base + β_carbon × P_carbon(t=5)<br />
                = {(asset.wacc_base*100).toFixed(1)}% + {asset.beta_c} × ${carbonPrice(selectedScenario, 5).toFixed(0)}<br />
                = {(asset.wacc_base*100).toFixed(1)}% + {(asset.beta_c * carbonPrice(selectedScenario, 5) * 100).toFixed(2)}%<br />
                = <strong>{(dcf.wacc_adjusted*100).toFixed(2)}%</strong> (climate-adjusted)
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Portfolio Exposure */}
        {tab === 2 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24, marginBottom: 20 }}>
              <h3 style={{ color: T.navy, margin: '0 0 16px', fontSize: 15 }}>Portfolio Impairment — {SCENARIOS[selectedScenario].label} Scenario</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={portfolioImpairment} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tickFormatter={v => `$${v.toFixed(0)}M`} tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" width={160} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={v => [`$${v.toFixed(1)}M`]} />
                  <Bar dataKey="impairment" name="DCF Impairment ($M)" fill={T.red} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: T.navy }}>
                    {['Asset', 'Sector', 'Book ($M)', 'WACC Base', 'WACC Adj', 'Impairment ($M)', 'Impairment %', 'Stranded Year', 'Risk'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', color: '#fff', fontWeight: 600, textAlign: 'left', fontSize: 12 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {portfolioImpairment.map((a, i) => {
                    const risk = a.impairment_pct > 30 ? 'HIGH' : a.impairment_pct > 15 ? 'MEDIUM' : 'LOW';
                    const riskColor = risk === 'HIGH' ? T.red : risk === 'MEDIUM' ? T.amber : T.green;
                    return (
                      <tr key={a.id} style={{ background: i % 2 === 0 ? T.surface : T.bg }}>
                        <td style={{ padding: '9px 12px', color: T.navy, fontWeight: 500 }}>{a.name}</td>
                        <td style={{ padding: '9px 12px', color: T.textSec, fontSize: 12 }}>{a.sector}</td>
                        <td style={{ padding: '9px 12px', fontFamily: T.mono }}>${a.book.toLocaleString()}</td>
                        <td style={{ padding: '9px 12px', fontFamily: T.mono }}>{(a.wacc_base*100).toFixed(1)}%</td>
                        <td style={{ padding: '9px 12px', fontFamily: T.mono, color: T.orange }}>{(a.wacc_adjusted*100).toFixed(2)}%</td>
                        <td style={{ padding: '9px 12px', fontFamily: T.mono, color: T.red, fontWeight: 600 }}>${a.impairment.toFixed(0)}</td>
                        <td style={{ padding: '9px 12px', fontFamily: T.mono, color: T.red }}>{a.impairment_pct.toFixed(1)}%</td>
                        <td style={{ padding: '9px 12px', fontFamily: T.mono, color: a.stranded_year ? T.red : T.green }}>{a.stranded_year || '—'}</td>
                        <td style={{ padding: '9px 12px' }}>
                          <span style={{ background: riskColor + '22', color: riskColor, padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700 }}>{risk}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: Stranded CAPEX */}
        {tab === 3 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24 }}>
                <h3 style={{ color: T.navy, margin: '0 0 12px', fontSize: 15 }}>Stranded CAPEX Risk by Sector</h3>
                <p style={{ color: T.textSec, fontSize: 12, margin: '0 0 16px' }}>
                  Assets become economically unviable when adjusted cash flows turn negative under carbon pricing.
                </p>
                {portfolioImpairment.map(a => {
                  const pct = Math.min(100, (a.impairment / a.book) * 100);
                  return (
                    <div key={a.id} style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: T.navy, fontWeight: 500 }}>{a.name}</span>
                        <span style={{ fontFamily: T.mono, fontSize: 12, color: pct > 30 ? T.red : T.amber }}>
                          {pct.toFixed(1)}% at risk · {a.stranded_year ? `Stranded ${a.stranded_year}` : 'Viable'}
                        </span>
                      </div>
                      <div style={{ height: 6, background: T.border, borderRadius: 3 }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: pct > 30 ? T.red : pct > 15 ? T.amber : T.green, borderRadius: 3 }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24 }}>
                <h3 style={{ color: T.navy, margin: '0 0 12px', fontSize: 15 }}>Carbon Cost Passthrough Model</h3>
                <p style={{ color: T.textSec, fontSize: 12, margin: '0 0 16px' }}>
                  Sector-specific ability to pass carbon costs to consumers, reducing earnings impact.
                </p>
                <div style={{ display: 'grid', gap: 8 }}>
                  {ASSETS.map(a => (
                    <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: T.bg, borderRadius: 6 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 500, color: T.navy }}>{a.sector}</div>
                        <div style={{ fontSize: 11, color: T.textSec }}>Intensity: {a.emissions_intensity} tCO₂e/M$</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 700, color: a.passthrough > 0.35 ? T.green : a.passthrough > 0.2 ? T.amber : T.red }}>
                          {(a.passthrough * 100).toFixed(0)}%
                        </div>
                        <div style={{ fontSize: 10, color: T.textMut }}>passthrough</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Scenario Comparison */}
        {tab === 4 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24, marginBottom: 20 }}>
              <h3 style={{ color: T.navy, margin: '0 0 16px', fontSize: 15 }}>Portfolio Total Impairment — All Scenarios</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={scenarioCompare}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="short" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={v => `$${(v/1000).toFixed(1)}B`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={v => [`$${(v/1000).toFixed(2)}B`, 'Impairment']} />
                  <Bar dataKey="impairment" name="Total Impairment" radius={[6,6,0,0]}>
                    {scenarioCompare.map((e, i) => (
                      <rect key={i} fill={e.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }}>
              {scenarioCompare.map(s => (
                <div key={s.scenario} style={{ background: T.surface, borderRadius: 8, border: `2px solid ${s.color}22`, padding: 16 }}>
                  <div style={{ fontSize: 11, color: s.color, fontWeight: 700, marginBottom: 4 }}>{s.short}</div>
                  <div style={{ fontSize: 12, color: T.navy, marginBottom: 8 }}>{s.scenario}</div>
                  <div style={{ fontFamily: T.mono, fontSize: 20, fontWeight: 700, color: T.red }}>
                    ${(s.impairment / 1000).toFixed(2)}B
                  </div>
                  <div style={{ fontSize: 12, color: T.textSec }}>{s.pct.toFixed(1)}% of AUM</div>
                  <div style={{ height: 4, background: T.border, borderRadius: 2, marginTop: 8 }}>
                    <div style={{ height: '100%', width: `${Math.min(100, s.pct * 2)}%`, background: s.color, borderRadius: 2 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
