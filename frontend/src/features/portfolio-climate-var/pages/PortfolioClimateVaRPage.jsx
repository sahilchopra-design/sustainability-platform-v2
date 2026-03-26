import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ScatterChart, Scatter, ZAxis, ComposedChart,
  Area, AreaChart, ReferenceLine, Line
} from 'recharts';
import DataUploadPanel from '../../../components/DataUploadPanel';
import { useTestData } from '../../../context/TestDataContext';

const API = 'http://localhost:8001';
const T = {
  bg: '#f6f4f0', navy: '#1b3a5c', gold: '#c5a96a', sage: '#5a8a6a',
  card: '#ffffff', border: '#e2ddd5', text: '#2c2c2c', sub: '#6b7280',
  red: '#dc2626', amber: '#d97706', green: '#16a34a', blue: '#2563eb', indigo: '#4f46e5',
  font: "'Inter','SF Pro Display',system-ui,-apple-system,sans-serif",
};

const SECTOR_SHOCKS = {
  Energy:      { t: 0.24, p: 0.12 }, Mining:      { t: 0.22, p: 0.14 },
  Utilities:   { t: 0.16, p: 0.15 }, Materials:   { t: 0.14, p: 0.08 },
  Industrials: { t: 0.10, p: 0.07 }, Financials:  { t: 0.08, p: 0.05 },
  'Real Estate':{ t: 0.12, p: 0.18 }, default:    { t: 0.10, p: 0.07 },
};
const SCENARIO_MULT = {
  NGFS_P3_NET_ZERO_2050: 1.0, NGFS_P3_BELOW_2C: 0.85,
  NGFS_P3_LOW_DEMAND: 1.05,  NGFS_P3_DELAYED_2C: 1.2,
  NGFS_P3_DIVERGENT_NZ: 1.3, NGFS_P3_NATIONALLY_NDC: 0.6,
  NGFS_P3_CURRENT_POLICIES: 0.4, NGFS_P3_HIGH_DEMAND: 0.35,
};
const Z_MAP = { 0.90: 1.282, 0.95: 1.645, 0.99: 2.326 };

const DEMO_HOLDINGS = [
  { holding_id: 'RLNCE',   company_name: 'Reliance Industries',  sector: 'Energy',      exposure_usd: 48000000,  outstanding_amount_usd: 180000000, cin: 'L17110MH1973PLC019786', country: 'India' },
  { holding_id: 'COAL-IN', company_name: 'Coal India Ltd',       sector: 'Mining',      exposure_usd: 22000000,  outstanding_amount_usd: 85000000,  cin: 'L10101WB1973GOI028844', country: 'India' },
  { holding_id: 'NTPC',    company_name: 'NTPC Ltd',             sector: 'Utilities',   exposure_usd: 35000000,  outstanding_amount_usd: 140000000, cin: 'L40101DL1975GOI007966', country: 'India' },
  { holding_id: 'ADANI-G', company_name: 'Adani Green Energy',   sector: 'Utilities',   exposure_usd: 18000000,  outstanding_amount_usd: 62000000,  cin: 'L40100GJ2015PLC082803', country: 'India' },
  { holding_id: 'JSWSTL',  company_name: 'JSW Steel',            sector: 'Materials',   exposure_usd: 28000000,  outstanding_amount_usd: 110000000, cin: 'L27102MH1994PLC152925', country: 'India' },
  { holding_id: 'LTBR',    company_name: 'Larsen & Toubro',      sector: 'Industrials', exposure_usd: 15000000,  outstanding_amount_usd: 55000000,  cin: 'L99999MH1946PLC004768', country: 'India' },
];

const fmt = n => n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : `$${n.toLocaleString()}`;

function calcVaR(holdings, scenarioId, horizon, confidence, rho) {
  const z = Z_MAP[confidence] || 1.645;
  const scenMult = SCENARIO_MULT[scenarioId] || 1.0;
  const hScale = Math.sqrt(horizon / 10);
  const breakdown = holdings.map(h => {
    const shocks = SECTOR_SHOCKS[h.sector] || SECTOR_SHOCKS.default;
    const tVaR = h.exposure_usd * shocks.t * scenMult * hScale * (z / 1.645);
    const pVaR = h.exposure_usd * shocks.p * hScale * (z / 1.645);
    return { ...h, transition_var_usd: tVaR, physical_var_usd: pVaR };
  });
  const totalT = breakdown.reduce((s, b) => s + b.transition_var_usd, 0);
  const totalP = breakdown.reduce((s, b) => s + b.physical_var_usd, 0);
  const combined = Math.sqrt(totalT ** 2 + totalP ** 2 + 2 * rho * totalT * totalP);
  const nav = holdings.reduce((s, h) => s + h.exposure_usd, 0);
  return { transition_var_usd: totalT, physical_var_usd: totalP, combined_var_usd: combined,
    combined_var_pct: combined / nav, portfolio_nav_usd: nav, asset_breakdown: breakdown };
}

const NGFS_OPTIONS = [
  { value: 'NGFS_P3_NET_ZERO_2050',    label: 'Net Zero 2050 (Orderly)'         },
  { value: 'NGFS_P3_BELOW_2C',         label: 'Below 2°C (Orderly)'             },
  { value: 'NGFS_P3_LOW_DEMAND',       label: 'Low Energy Demand (Orderly)'     },
  { value: 'NGFS_P3_DELAYED_2C',       label: 'Delayed Transition (Disorderly)' },
  { value: 'NGFS_P3_DIVERGENT_NZ',     label: 'Divergent Net Zero (Disorderly)' },
  { value: 'NGFS_P3_CURRENT_POLICIES', label: 'Current Policies (Hot House)'    },
];

const BADGE = (label, color) => (
  <span style={{ fontSize: 10, fontWeight: 700, color, background: `${color}18`,
    border: `1px solid ${color}44`, borderRadius: 4, padding: '2px 6px' }}>{label}</span>
);

const MANUAL_FIELDS = [
  { key: 'holding_id',            label: 'Holding ID',    type: 'text',   defaultValue: 'HLD-001' },
  { key: 'company_name',          label: 'Company Name',  type: 'text',   defaultValue: '' },
  { key: 'sector',                label: 'Sector',        type: 'select', options: ['Energy','Mining','Utilities','Materials','Industrials','Financials','Real Estate'], defaultValue: 'Energy' },
  { key: 'exposure_usd',          label: 'Exposure (USD)',type: 'number', defaultValue: 10000000 },
  { key: 'outstanding_amount_usd',label: 'Outstanding',   type: 'number', defaultValue: 40000000 },
  { key: 'cin',                   label: 'CIN / ISIN',    type: 'text',   defaultValue: '' },
  { key: 'country',               label: 'Country',       type: 'select', options: ['India','Singapore','UAE','UK','USA','Other'], defaultValue: 'India' },
];

export default function PortfolioClimateVaRPage() {
  const ctx = useTestData();
  const [holdings, setHoldings]         = useState(DEMO_HOLDINGS);
  const [scenario, setScenario]         = useState(ctx.selectedNgfsScenarioId || 'NGFS_P3_NET_ZERO_2050');
  const [horizon, setHorizon]           = useState(10);
  const [confidence, setConfidence]     = useState(0.95);
  const [rho, setRho]                   = useState(0.25);
  const [sectorFilter, setSectorFilter] = useState(new Set());
  const [runAllMode, setRunAllMode]     = useState(false);
  const [inputOpen, setInputOpen]       = useState(false);

  // Sync scenario from context when user selects in NGFS module
  useEffect(() => {
    if (ctx.selectedNgfsScenarioId) setScenario(ctx.selectedNgfsScenarioId);
  }, [ctx.selectedNgfsScenarioId]);

  // Pre-fill from context if holdings exist there
  useEffect(() => {
    if (ctx.portfolioHoldings.length > 0) setHoldings(ctx.portfolioHoldings);
  }, [ctx.portfolioHoldings]);

  const handleDataParsed = (rows, fileName) => {
    const parsed = rows.map(r => ({
      holding_id: r.holding_id || r.id || `H${Date.now()}`,
      company_name: r.company_name || r.name || '',
      sector: r.sector || 'Energy',
      exposure_usd: Number(r.exposure_usd) || 0,
      outstanding_amount_usd: Number(r.outstanding_amount_usd) || 0,
      cin: r.cin || r.isin || null,
      country: r.country || 'India',
    })).filter(h => h.exposure_usd > 0);
    if (parsed.length) {
      setHoldings(parsed);
      ctx.setPortfolioHoldings(parsed, fileName);
    }
  };

  const addHolding = (rows) => {
    const newH = rows.map(r => ({
      ...r, exposure_usd: Number(r.exposure_usd) || 0,
      outstanding_amount_usd: Number(r.outstanding_amount_usd) || 0,
    }));
    const updated = [...holdings, ...newH];
    setHoldings(updated);
    ctx.setPortfolioHoldings(updated, 'manual');
  };

  const visibleHoldings = sectorFilter.size > 0
    ? holdings.filter(h => sectorFilter.has(h.sector)) : holdings;

  const result = useMemo(() => calcVaR(visibleHoldings.length ? visibleHoldings : holdings, scenario, horizon, confidence, rho),
    [holdings, visibleHoldings, scenario, horizon, confidence, rho]);

  // Run all scenarios comparison
  const allResults = useMemo(() => {
    if (!runAllMode) return null;
    return NGFS_OPTIONS.map(o => {
      const r = calcVaR(holdings, o.value, horizon, confidence, rho);
      return { label: o.label.split(' ')[0] + ' ' + o.label.split(' ')[1], ...r };
    });
  }, [runAllMode, holdings, horizon, confidence, rho]);

  // Horizon curve data
  const horizonCurve = useMemo(() => Array.from({ length: 30 }, (_, i) => {
    const r = calcVaR(holdings, scenario, i + 1, confidence, rho);
    return { year: i + 1, combined: Math.round(r.combined_var_usd / 1000), transition: Math.round(r.transition_var_usd / 1000) };
  }), [holdings, scenario, confidence, rho]);

  const sectors = [...new Set(holdings.map(h => h.sector))];

  const scatterData = result.asset_breakdown.map(a => ({
    x: Math.round(a.transition_var_usd / 1000),
    y: Math.round(a.physical_var_usd / 1000),
    z: a.exposure_usd / 1e5,
    name: a.holding_id,
    sector: a.sector,
  }));

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1320, margin: '0 auto', fontFamily: T.font, color: T.text }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: T.navy, margin: 0 }}>Portfolio Climate VaR</h1>
          <p style={{ color: T.sub, fontSize: 12, margin: '4px 0 0' }}>
            Upload holdings CSV · Delta-Normal · NGFS Phase 3 · Sector-specific shocks · Syncs to Stranded Assets & CSRD · EP-D7
          </p>
        </div>
        {ctx.dataLoadedAt && (
          <div style={{ fontSize: 11, color: T.sage, background: '#f0fdf4', padding: '4px 10px',
            borderRadius: 6, border: '1px solid #bbf7d0', fontWeight: 600 }}>
            ✓ Data loaded at {new Date(ctx.dataLoadedAt).toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Regulatory Context Bar */}
      <div style={{
        background: `${T.navy}08`, border: `1px solid ${T.navy}20`,
        borderLeft: `3px solid ${T.navy}`, borderRadius: 8,
        padding: '8px 16px', marginBottom: 14,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.07em', marginRight: 4 }}>REGULATORY BASIS</span>
          {[
            { label: 'SEBI BRSR Core — P6 FY24', color: T.amber },
            { label: 'RBI Draft Climate Capital Buffer 2023', color: T.red },
            { label: 'PCAF v2 §2.3 Attribution Factor', color: T.blue },
            { label: 'TCFD Scenario Analysis', color: T.navy },
          ].map(r => (
            <span key={r.label} style={{ fontSize: 10, fontWeight: 700, color: r.color,
              background: `${r.color}12`, border: `1px solid ${r.color}30`,
              borderRadius: 4, padding: '2px 7px', whiteSpace: 'nowrap' }}>{r.label}</span>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.07em' }}>METHOD</span>
          <span style={{ fontSize: 11, color: T.navy, fontWeight: 600 }}>Delta-Normal VaR · NGFS Sector Shocks · PCAF Attribution</span>
          <span style={{ fontSize: 9, color: T.sage, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 3, padding: '1px 6px' }}>Live</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.07em' }}>PRIMARY USER</span>
          <span style={{ fontSize: 11, color: T.navy, fontWeight: 600, background: `${T.gold}22`, border: `1px solid ${T.gold}44`, borderRadius: 4, padding: '2px 8px' }}>Portfolio Risk Manager / ALCO Analyst</span>
        </div>
      </div>

      {/* Analyst Workflow Steps */}
      <div style={{ display: 'flex', alignItems: 'stretch', background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
        {[
          { n: 1, title: 'Load Portfolio', desc: 'Upload holdings CSV or use demo data · exposure_usd + sector required' },
          { n: 2, title: 'Set Scenario & Horizon', desc: 'Select NGFS scenario (syncs from EP-D6) · horizon (years) · confidence level' },
          { n: 3, title: 'Review Climate VaR', desc: 'Transition + Physical VaR breakdown · asset-level attribution · sector concentration' },
          { n: 4, title: 'Export for Capital / BRSR', desc: 'Download results · VaR % feeds RBI Pillar 2 add-on · SEBI BRSR Core P6 disclosure' },
        ].map((s, i) => (
          <div key={s.n} style={{ flex: 1, padding: '10px 14px', borderRight: i < 3 ? `1px solid ${T.border}` : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: T.navy, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: 11, flexShrink: 0 }}>{s.n}</div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.navy }}>{s.title}</div>
                <div style={{ fontSize: 10, color: T.sub, lineHeight: 1.4 }}>{s.desc}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Data Input Panel */}
      <DataUploadPanel
        isOpen={inputOpen}
        onToggle={() => setInputOpen(o => !o)}
        title={`Portfolio Holdings Input — ${holdings.length} holding${holdings.length !== 1 ? 's' : ''} loaded`}
        manualFields={MANUAL_FIELDS}
        csvTemplate="holding_id,company_name,sector,exposure_usd,outstanding_amount_usd,cin,country"
        onDataParsed={(rows, fn) => {
          if (rows.length > 1 || (rows.length === 1 && rows[0].holding_id !== 'HLD-001')) {
            handleDataParsed(rows, fn);
          } else {
            addHolding(rows);
          }
        }}
      />

      {/* Controls Row */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '14px 18px', marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto', gap: 14, alignItems: 'end' }}>
          {/* Scenario */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: T.sub, display: 'block', marginBottom: 4 }}>
              NGFS Scenario {ctx.selectedNgfsScenarioId !== scenario && '⚠ overridden'}
            </label>
            <select value={scenario} onChange={e => setScenario(e.target.value)} style={{
              width: '100%', padding: '8px 10px', borderRadius: 7, border: `1px solid ${T.border}`,
              fontSize: 12, color: T.navy, background: T.card, fontFamily: T.font,
            }}>
              {NGFS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          {/* Horizon */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: T.sub, display: 'block', marginBottom: 4 }}>
              Horizon: <strong style={{ color: T.navy }}>{horizon}Y</strong>
            </label>
            <input type="range" min={1} max={30} value={horizon} onChange={e => setHorizon(Number(e.target.value))}
              style={{ width: '100%', accentColor: T.navy }} />
          </div>
          {/* Confidence */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: T.sub, display: 'block', marginBottom: 4 }}>Confidence Level</label>
            <div style={{ display: 'flex', gap: 4 }}>
              {[0.90, 0.95, 0.99].map(c => (
                <button key={c} onClick={() => setConfidence(c)} style={{
                  flex: 1, padding: '7px 4px', borderRadius: 5, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  background: confidence === c ? T.navy : T.card, color: confidence === c ? '#fff' : T.sub,
                  border: `1px solid ${confidence === c ? T.navy : T.border}`,
                }}>{(c * 100).toFixed(0)}%</button>
              ))}
            </div>
          </div>
          {/* Correlation */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: T.sub, display: 'block', marginBottom: 4 }}>
              ρ(T,P): <strong style={{ color: T.navy }}>{rho.toFixed(2)}</strong>
            </label>
            <input type="range" min={-0.5} max={1.0} step={0.05} value={rho}
              onChange={e => setRho(Number(e.target.value))} style={{ width: '100%', accentColor: T.amber }} />
          </div>
          {/* Sector Filter */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: T.sub, display: 'block', marginBottom: 4 }}>Sector Filter</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              {sectors.map(s => (
                <button key={s} onClick={() => setSectorFilter(p => { const n = new Set(p); n.has(s) ? n.delete(s) : n.add(s); return n; })} style={{
                  padding: '3px 6px', borderRadius: 4, fontSize: 9, fontWeight: 700, cursor: 'pointer',
                  background: sectorFilter.has(s) ? (SECTOR_COLOR[s] || T.navy) : T.card,
                  color: sectorFilter.has(s) ? '#fff' : T.sub,
                  border: `1px solid ${sectorFilter.has(s) ? (SECTOR_COLOR[s] || T.navy) : T.border}`,
                }}>{s}</button>
              ))}
            </div>
          </div>
          {/* Run All */}
          <button onClick={() => setRunAllMode(!runAllMode)} style={{
            padding: '8px 14px', background: runAllMode ? T.indigo : T.navy, color: '#fff',
            border: 'none', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer',
            whiteSpace: 'nowrap',
          }} className="run-all-btn">
            {runAllMode ? '⊠ Hide All' : '⊞ Run All Scenarios'}
          </button>
        </div>
      </div>

      {/* Sector Shock Assumptions */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, marginBottom: 14, overflow: 'hidden' }}>
        <div style={{
          padding: '9px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: `1px solid ${T.border}`, background: '#f8f7f4',
        }} onClick={() => {
          const el = document.getElementById('shock-table');
          if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: T.navy }}>
            ▸ Shock Assumptions — Transition &amp; Physical Loss Rates by Sector
          </span>
          <span style={{ fontSize: 10, color: T.sub }}>
            Source: NGFS P3 Sectoral Guidance / IPCC AR6 WG2
            <span style={{ marginLeft: 8, fontSize: 9, color: T.amber, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 3, padding: '1px 5px' }}>Modeled</span>
            <span style={{ marginLeft: 4, fontSize: 9, color: T.sub }}>· Click to expand</span>
          </span>
        </div>
        <div id="shock-table" style={{ display: 'none', padding: '0 16px 12px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginTop: 10 }}>
            <thead>
              <tr style={{ background: '#f8f7f4' }}>
                {['Sector', 'Transition Shock (T)', 'Physical Shock (P)', 'Scenario Multiplier', 'ECB Comparable', 'Source'].map(h => (
                  <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontSize: 9, fontWeight: 600, color: T.sub, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(SECTOR_SHOCKS).filter(([k]) => k !== 'default').map(([sector, v], i) => (
                <tr key={sector} style={{ background: i%2===0 ? '#fff' : '#fafaf8', borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '6px 10px', fontWeight: 600, color: T.navy }}>{sector}</td>
                  <td style={{ padding: '6px 10px', color: T.red, fontWeight: 700 }}>{(v.t*100).toFixed(0)}%</td>
                  <td style={{ padding: '6px 10px', color: T.amber, fontWeight: 700 }}>{(v.p*100).toFixed(0)}%</td>
                  <td style={{ padding: '6px 10px', color: T.sub, fontSize: 10 }}>× NGFS scenario multiplier</td>
                  <td style={{ padding: '6px 10px', color: T.sub, fontSize: 10 }}>ECB 2021 CST (0.15–0.30 ρ)</td>
                  <td style={{ padding: '6px 10px', fontSize: 10, color: T.blue }}>NGFS P3 / IPCC AR6 WG2</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 8, fontSize: 10, color: T.sub, lineHeight: 1.5 }}>
            Transition shocks (T): % decline in exposure value under the selected NGFS carbon-price trajectory. Physical shocks (P): Chronic + acute climate damage as % of exposure.
            Correlation ρ(T,P) = {rho.toFixed(2)} (empirical range 0.15–0.30 per ECB 2021 economy-wide climate stress test).
            Combined VaR = √(T² + P² + 2ρTP).
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Transition VaR (95%)', value: fmt(result.transition_var_usd), sub: `${(result.transition_var_usd/result.portfolio_nav_usd*100).toFixed(1)}% of NAV`, color: T.red },
          { label: 'Physical VaR (95%)',   value: fmt(result.physical_var_usd),   sub: `${(result.physical_var_usd/result.portfolio_nav_usd*100).toFixed(1)}% of NAV`,   color: T.amber },
          { label: 'Combined Climate VaR', value: fmt(result.combined_var_usd),   sub: `ρ=${rho} · Z=${Z_MAP[confidence]}`,                                              color: T.navy },
          { label: 'Portfolio NAV',        value: fmt(result.portfolio_nav_usd),  sub: `${holdings.length} holdings`,                                                     color: T.gold },
          { label: 'Combined VaR %',       value: `${(result.combined_var_pct*100).toFixed(1)}%`, sub: `${horizon}Y horizon · ${(confidence*100).toFixed(0)}% CI`,       color: T.navy },
          { label: 'Holdings Analyzed',    value: visibleHoldings.length || holdings.length, sub: sectorFilter.size > 0 ? `Filtered: ${[...sectorFilter].join(', ')}` : 'All sectors', color: T.sage },
        ].map((k, i) => (
          <div key={i} style={{
            background: T.card, border: `1px solid ${T.border}`, borderRadius: 10,
            borderTop: `3px solid ${k.color}`, padding: '12px 14px',
            boxShadow: '0 1px 4px rgba(27,58,92,0.06)',
          }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: T.navy }}>{k.value}</div>
            <div style={{ fontSize: 10, color: T.sub, marginTop: 3 }}>{k.label}</div>
            <div style={{ fontSize: 10, color: T.sage, marginTop: 1 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Output Interpretation Banner */}
      <div style={{
        background: '#fffbeb', border: '1px solid #fde68a', borderLeft: `3px solid ${T.amber}`,
        borderRadius: 8, padding: '10px 16px', marginBottom: 16,
        display: 'flex', alignItems: 'flex-start', gap: 10,
      }}>
        <span style={{ color: T.amber, fontSize: 16, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>!</span>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#92400e', marginBottom: 3 }}>
            Capital &amp; Disclosure Implications — RBI Pillar 2 / SEBI BRSR Core
          </div>
          <div style={{ fontSize: 11, color: '#78350f', lineHeight: 1.6 }}>
            Combined Climate VaR of <strong>{fmt(result.combined_var_usd)}</strong> ({(result.combined_var_pct*100).toFixed(1)}% of portfolio NAV) at {(confidence*100).toFixed(0)}% confidence over {horizon}Y horizon.
            {' '}Under RBI's draft 1% climate capital buffer, this portfolio would require an estimated add-on of <strong>{fmt(result.portfolio_nav_usd * 0.01)}</strong>.
            {' '}Transition VaR accounts for <strong>{(result.transition_var_usd / result.combined_var_usd * 100).toFixed(0)}%</strong> of combined exposure —
            {result.transition_var_usd > result.physical_var_usd
              ? ' portfolio is primarily exposed to policy/regulatory transition risk.'
              : ' portfolio is primarily exposed to chronic/acute physical climate risk.'}
            {' '}These figures should be disclosed under SEBI BRSR Core Principle 6 (Financial Risk from Climate Change).
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* VaR Horizon Curve */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '16px 18px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>VaR Horizon Curve ($k)</div>
          <ResponsiveContainer width="100%" height={190}>
            <AreaChart data={horizonCurve} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="year" tick={{ fontSize: 9 }} label={{ value: 'Years', position: 'insideBottom', offset: -2, fontSize: 9 }} />
              <YAxis tick={{ fontSize: 9 }} unit="k" />
              <Tooltip formatter={v => [`$${v}k`]} contentStyle={{ fontSize: 10 }} />
              <Area type="monotone" dataKey="combined"   stroke={T.navy}  fill={T.navy}  fillOpacity={0.12} name="Combined" strokeWidth={2} />
              <Area type="monotone" dataKey="transition" stroke={T.red}   fill={T.red}   fillOpacity={0.08} name="Transition" strokeWidth={1.5} />
              <ReferenceLine x={horizon} stroke={T.gold} strokeDasharray="4 2" label={{ value: `${horizon}Y`, fontSize: 9, fill: T.amber }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Asset Breakdown Bar */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '16px 18px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>VaR by Holding ($k)</div>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={result.asset_breakdown.map(a => ({
              name: a.holding_id, T: Math.round(a.transition_var_usd/1000), P: Math.round(a.physical_var_usd/1000),
            }))} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 9 }} unit="k" />
              <Tooltip formatter={v => [`$${v}k`]} contentStyle={{ fontSize: 10 }} />
              <Bar dataKey="T" fill={T.red}   stackId="a" name="Transition" radius={[0,0,0,0]} />
              <Bar dataKey="P" fill={T.amber}  stackId="a" name="Physical"   radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Scatter */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '16px 18px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Trans. vs Phys. VaR ($k · bubble=exposure)</div>
          <ResponsiveContainer width="100%" height={190}>
            <ScatterChart margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="x" name="Transition VaR $k" tick={{ fontSize: 9 }} label={{ value: 'T-VaR $k', position: 'insideBottom', offset: -2, fontSize: 9 }} />
              <YAxis dataKey="y" name="Physical VaR $k"   tick={{ fontSize: 9 }} label={{ value: 'P-VaR', angle: -90, position: 'insideLeft', fontSize: 9 }} />
              <ZAxis dataKey="z" range={[40, 400]} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ payload }) => {
                if (!payload?.length) return null;
                const d = payload[0].payload;
                return <div style={{ background: '#fff', border: `1px solid ${T.border}`, padding: '6px 10px', borderRadius: 6, fontSize: 10 }}>
                  <strong>{d.name}</strong><br />{d.sector}<br />T: ${d.x}k · P: ${d.y}k
                </div>;
              }} />
              <Scatter data={scatterData} fill={T.navy} fillOpacity={0.7} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Holdings Table */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '16px 18px', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>
            Holdings — {holdings.length} positions
            <span style={{ fontSize: 11, fontWeight: 400, color: T.sub, marginLeft: 8 }}>
              Attribution factor = Exposure / Outstanding (PCAF §2.3)
            </span>
          </div>
          <button onClick={() => {
            const csv = ['Holding ID,Company,Sector,Exposure USD,Outstanding USD,Attribution Factor,Transition VaR,Physical VaR,CIN',
              ...result.asset_breakdown.map(h =>
                [h.holding_id, h.company_name, h.sector, h.exposure_usd, h.outstanding_amount_usd,
                 (h.exposure_usd/h.outstanding_amount_usd).toFixed(3),
                 h.transition_var_usd.toFixed(0), h.physical_var_usd.toFixed(0), h.cin || ''].join(',')
              )
            ].join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const lnk = document.createElement('a');
            lnk.href = URL.createObjectURL(blob);
            lnk.download = `portfolio_climate_var_${new Date().toISOString().slice(0,10)}.csv`;
            lnk.click();
          }} style={{
            padding: '6px 14px', background: T.card, color: T.navy,
            border: `1px solid ${T.border}`, borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer',
          }}>↓ Export Holdings CSV</button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ background: '#f8f7f4' }}>
              {['ID','Company','Sector','Exposure','Outstanding','Attrib. Factor','T-VaR','P-VaR','CIN'].map(h => (
                <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontSize: 10, fontWeight: 600,
                  color: T.sub, borderBottom: `1px solid ${T.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.asset_breakdown.map((h, i) => (
              <tr key={h.holding_id} style={{ background: i%2===0?'#fff':'#fafaf8', borderBottom:`1px solid ${T.border}` }}>
                <td style={{ padding: '7px 10px', fontWeight: 700, color: T.blue, fontSize: 10 }}>{h.holding_id}</td>
                <td style={{ padding: '7px 10px', fontWeight: 600, color: T.navy }}>{h.company_name}</td>
                <td style={{ padding: '7px 10px' }}>{BADGE(h.sector, SECTOR_COLOR[h.sector] || T.sub)}</td>
                <td style={{ padding: '7px 10px', fontWeight: 600, color: T.text }}>{fmt(h.exposure_usd)}</td>
                <td style={{ padding: '7px 10px', color: T.sub }}>{fmt(h.outstanding_amount_usd)}</td>
                <td style={{ padding: '7px 10px', color: T.blue }}>{(h.exposure_usd/h.outstanding_amount_usd).toFixed(3)}</td>
                <td style={{ padding: '7px 10px', color: T.red, fontWeight: 600 }}>{fmt(h.transition_var_usd)}</td>
                <td style={{ padding: '7px 10px', color: T.amber, fontWeight: 600 }}>{fmt(h.physical_var_usd)}</td>
                <td style={{ padding: '7px 10px', fontSize: 9, color: T.sub }}>{h.cin || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* All-Scenarios Comparison */}
      {runAllMode && allResults && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '16px 18px', marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>All Scenarios — VaR Comparison</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#f8f7f4' }}>
                {['Scenario','Transition VaR','Physical VaR','Combined VaR','Combined %','vs. Base'].map(h => (
                  <th key={h} style={{ padding: '7px 12px', textAlign: 'left', fontSize: 10, fontWeight: 600,
                    color: T.sub, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allResults.map((r, i) => {
                const base = allResults[0].combined_var_usd;
                const delta = ((r.combined_var_usd - base) / base * 100).toFixed(1);
                return (
                  <tr key={i} style={{ background: i%2===0?'#fff':'#fafaf8', borderBottom:`1px solid ${T.border}` }}>
                    <td style={{ padding: '7px 12px', fontWeight: 600, color: T.navy }}>{r.label}</td>
                    <td style={{ padding: '7px 12px', color: T.red }}>{fmt(r.transition_var_usd)}</td>
                    <td style={{ padding: '7px 12px', color: T.amber }}>{fmt(r.physical_var_usd)}</td>
                    <td style={{ padding: '7px 12px', fontWeight: 700, color: T.text }}>{fmt(r.combined_var_usd)}</td>
                    <td style={{ padding: '7px 12px', color: T.text }}>{(r.combined_var_pct*100).toFixed(1)}%</td>
                    <td style={{ padding: '7px 12px', color: Number(delta) > 0 ? T.red : T.sage, fontWeight: 600 }}>
                      {Number(delta) > 0 ? '+' : ''}{delta}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ fontSize: 11, color: T.sub, borderTop: `1px solid ${T.border}`, paddingTop: 8 }}>
        PCAF §2.3 Attribution · Delta-Normal · ρ(T,P) adjustable · Sector-specific shocks · dme_portfolio_climate_var_runs · Syncs CINs → CSRD module · EP-D7
      </div>
    </div>
  );
}

const SECTOR_COLOR = { Energy: T.red, Mining: '#b45309', Utilities: T.amber, Materials: T.sage, Industrials: T.blue, Financials: T.navy, 'Real Estate': '#7c3aed' };
