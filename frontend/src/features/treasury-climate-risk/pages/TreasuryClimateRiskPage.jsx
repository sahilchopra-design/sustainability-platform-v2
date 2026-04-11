/* EP-DD5: Treasury Climate Risk — Sprint DD */
import React, { useState, useMemo } from 'react';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell, LineChart, Line, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const CURRENCIES = [
  { code: 'USD', country: 'USA', climateVulnScore: 15 + sr(1) * 20, hedgingCost: 0.05 + sr(2) * 0.3 },
  { code: 'EUR', country: 'Eurozone', climateVulnScore: 20 + sr(3) * 25, hedgingCost: 0.08 + sr(4) * 0.35 },
  { code: 'GBP', country: 'UK', climateVulnScore: 18 + sr(5) * 22, hedgingCost: 0.06 + sr(6) * 0.32 },
  { code: 'JPY', country: 'Japan', climateVulnScore: 35 + sr(7) * 30, hedgingCost: 0.02 + sr(8) * 0.2 },
  { code: 'CNY', country: 'China', climateVulnScore: 45 + sr(9) * 30, hedgingCost: 0.15 + sr(10) * 0.5 },
  { code: 'BRL', country: 'Brazil', climateVulnScore: 55 + sr(11) * 30, hedgingCost: 0.3 + sr(12) * 0.8 },
  { code: 'INR', country: 'India', climateVulnScore: 60 + sr(13) * 25, hedgingCost: 0.25 + sr(14) * 0.7 },
  { code: 'ZAR', country: 'S. Africa', climateVulnScore: 65 + sr(15) * 25, hedgingCost: 0.4 + sr(16) * 1.0 },
];

const COMMODITIES = [
  { name: 'Crude Oil', category: 'Energy', basePrice: 80, climateSens: 0.8, ngfs_nz: -35, ngfs_cp: +12, unit: '$/bbl' },
  { name: 'Natural Gas', category: 'Energy', basePrice: 3.2, climateSens: 0.9, ngfs_nz: -42, ngfs_cp: +8, unit: '$/MMBtu' },
  { name: 'Coal', category: 'Energy', basePrice: 140, climateSens: 1.2, ngfs_nz: -60, ngfs_cp: +5, unit: '$/t' },
  { name: 'Wheat', category: 'Agriculture', basePrice: 220, climateSens: 0.6, ngfs_nz: +18, ngfs_cp: +35, unit: '$/t' },
  { name: 'Corn', category: 'Agriculture', basePrice: 180, climateSens: 0.7, ngfs_nz: +15, ngfs_cp: +28, unit: '$/t' },
  { name: 'Soybeans', category: 'Agriculture', basePrice: 520, climateSens: 0.5, ngfs_nz: +12, ngfs_cp: +22, unit: '$/t' },
  { name: 'Copper', category: 'Metals', basePrice: 9200, climateSens: 0.4, ngfs_nz: +25, ngfs_cp: +10, unit: '$/t' },
  { name: 'Aluminum', category: 'Metals', basePrice: 2400, climateSens: 0.5, ngfs_nz: +20, ngfs_cp: +8, unit: '$/t' },
  { name: 'Nickel', category: 'Metals', basePrice: 18000, climateSens: 0.3, ngfs_nz: +30, ngfs_cp: +15, unit: '$/t' },
  { name: 'Lithium', category: 'Metals', basePrice: 35000, climateSens: -0.2, ngfs_nz: +85, ngfs_cp: +20, unit: '$/t' },
  { name: 'Carbon Credits', category: 'Carbon', basePrice: 65, climateSens: -0.8, ngfs_nz: +210, ngfs_cp: +30, unit: '$/tCO₂' },
  { name: 'Rare Earths', category: 'Metals', basePrice: 120000, climateSens: -0.1, ngfs_nz: +45, ngfs_cp: +18, unit: '$/t' },
];

const SUPPLY_CHAIN_NODES = Array.from({ length: 30 }, (_, i) => {
  const tier = Math.floor(i / 7.5) + 1;
  const climateRisk = 20 + sr(i * 7) * 70;
  return {
    id: i + 1,
    name: `${['Supplier', 'Mfg', 'Logistics', 'Dist'][tier - 1]} ${['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta'][i % 8]} ${i + 1}`,
    tier,
    country: ['China', 'Vietnam', 'Taiwan', 'Germany', 'Mexico', 'India', 'Brazil', 'USA'][i % 8],
    climateRisk: +climateRisk.toFixed(1),
    disruptionProb: +(climateRisk * 0.008 + sr(i * 11) * 0.15).toFixed(2),
    leadTime: Math.floor(sr(i * 13) * 90 + 7),
    singleSource: sr(i * 17) > 0.6,
    physicalRisk: +(sr(i * 19) * 80 + 10).toFixed(1),
    transitionRisk: +(sr(i * 23) * 70 + 10).toFixed(1),
  };
});

const COUNTERPARTIES = Array.from({ length: 25 }, (_, i) => {
  const climateRating = ['AAA', 'AA', 'A', 'BBB', 'BB'][Math.floor(sr(i * 7) * 5)];
  const pd1y = climateRating === 'AAA' ? 0.001 + sr(i * 11) * 0.002 : climateRating === 'AA' ? 0.002 + sr(i * 11) * 0.005 : climateRating === 'A' ? 0.005 + sr(i * 11) * 0.01 : climateRating === 'BBB' ? 0.01 + sr(i * 11) * 0.02 : 0.03 + sr(i * 11) * 0.05;
  const ead = 1 + sr(i * 13) * 49;
  return {
    id: i + 1,
    name: `${['GreenBank', 'ClimaFin', 'SustainCo', 'EcoGroup', 'NatCap'][i % 5]} ${['Corp', 'Ltd', 'AG', 'Plc', 'SA'][i % 5]} ${i + 1}`,
    sector: ['Banking', 'Insurance', 'Energy', 'Industry', 'Real Estate'][i % 5],
    country: ['USA', 'UK', 'Germany', 'France', 'Japan'][i % 5],
    climateRating,
    pd1y: +pd1y.toFixed(4),
    lgd: +(0.3 + sr(i * 17) * 0.3).toFixed(2),
    ead: +ead.toFixed(1),
    climateVaR: +(ead * (0.05 + sr(i * 19) * 0.15)).toFixed(2),
    physicalRisk: +(sr(i * 23) * 70 + 10).toFixed(1),
    transitionRisk: +(sr(i * 29) * 65 + 15).toFixed(1),
    sbtiStatus: sr(i * 31) > 0.5 ? 'Committed' : 'Not Committed',
  };
});

const TABS = ['Treasury Dashboard', 'FX Climate Exposure', 'Commodity Risk', 'Supply Chain Stress', 'Cash Flow Scenarios', 'Counterparty Climate Risk', 'Hedging Analytics', 'Regulatory Compliance'];
const NGFS_SCENARIOS = ['Net Zero 2050', 'Below 2°C', 'NDC Scenario', 'Current Policies'];

const T = { bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f6f4f0', navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280', green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f', teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c', surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace' };
export default function TreasuryClimateRiskPage() {

  const [tab, setTab] = useState(0);
  const [ngfsScenario, setNgfsScenario] = useState('NDC Scenario');
  const [selectedCurrency, setSelectedCurrency] = useState(CURRENCIES[1]);
  const [exposureAmount, setExposureAmount] = useState(100);

  const KpiCard = ({ label, value, sub, color }) => (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px', minWidth: 140 }}>
      <div style={{ fontSize: 11, color: T.textSec, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: color || T.navy, margin: '4px 0' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: T.textSec }}>{sub}</div>}
    </div>
  );

  const scenarioMultiplier = { 'Net Zero 2050': 1.8, 'Below 2°C': 1.4, 'NDC Scenario': 1.0, 'Current Policies': 0.5 }[ngfsScenario];

  const totalEad = COUNTERPARTIES.reduce((s, c) => s + c.ead, 0);
  const totalClimateVaR = COUNTERPARTIES.reduce((s, c) => s + c.climateVaR, 0);
  const highRiskNodes = SUPPLY_CHAIN_NODES.filter(n => n.climateRisk > 60).length;
  const fxHedgingCost = +(selectedCurrency.hedgingCost * exposureAmount * scenarioMultiplier).toFixed(2);
  const avgPd = COUNTERPARTIES.length ? COUNTERPARTIES.reduce((s, c) => s + c.pd1y, 0) / COUNTERPARTIES.length : 0;

  const commodityPriceData = useMemo(() => COMMODITIES.map(c => {
    const pct = ngfsScenario === 'Net Zero 2050' ? c.ngfs_nz : ngfsScenario === 'Current Policies' ? c.ngfs_cp : (c.ngfs_nz + c.ngfs_cp) / 2;
    return { name: c.name, category: c.category, base: c.basePrice, adj: +(c.basePrice * (1 + pct / 100)).toFixed(0), changePct: pct };
  }), [ngfsScenario]);

  const cashFlowStress = useMemo(() => Array.from({ length: 8 }, (_, q) => {
    const yr = 2025 + Math.floor(q / 4);
    const qtr = (q % 4) + 1;
    const baseFlow = 80 + sr(q * 7) * 40;
    const climateStress = baseFlow * (0.05 + sr(q * 11) * 0.15) * scenarioMultiplier;
    return { period: `${yr}Q${qtr}`, base: +baseFlow.toFixed(0), stressed: +(baseFlow - climateStress).toFixed(0), climateImpact: +(-climateStress).toFixed(0) };
  }), [scenarioMultiplier]);

  const hedgingData = useMemo(() => CURRENCIES.map(c => {
    const unhedgedVaR = c.climateVulnScore * exposureAmount * 0.002 * scenarioMultiplier;
    const hedgedVaR = unhedgedVaR * (0.1 + c.hedgingCost * 0.5);
    const hedgingCost = c.hedgingCost * exposureAmount * scenarioMultiplier;
    const netBenefit = unhedgedVaR - hedgedVaR - hedgingCost;
    return {
      currency: c.code,
      unhedgedVaR: +unhedgedVaR.toFixed(2),
      hedgedVaR: +hedgedVaR.toFixed(2),
      hedgingCost: +hedgingCost.toFixed(2),
      netBenefit: +netBenefit.toFixed(2),
    };
  }), [exposureAmount, scenarioMultiplier]);

  const supplyChainByTier = useMemo(() => [1, 2, 3, 4].map(t => {
    const nodes = SUPPLY_CHAIN_NODES.filter(n => n.tier === t);
    return {
      tier: `Tier ${t}`,
      avgRisk: nodes.length ? +(nodes.reduce((s, n) => s + n.climateRisk, 0) / nodes.length).toFixed(1) : 0,
      highRisk: nodes.filter(n => n.climateRisk > 60).length,
      singleSource: nodes.filter(n => n.singleSource).length,
      avgDisruption: nodes.length ? +(nodes.reduce((s, n) => s + n.disruptionProb, 0) / nodes.length * 100).toFixed(1) : 0,
    };
  }), []);

  const counterpartyRiskByRating = useMemo(() => ['AAA', 'AA', 'A', 'BBB', 'BB'].map(r => {
    const arr = COUNTERPARTIES.filter(c => c.climateRating === r);
    return {
      rating: r,
      count: arr.length,
      totalEad: +(arr.reduce((s, c) => s + c.ead, 0)).toFixed(1),
      avgPd: arr.length ? +(arr.reduce((s, c) => s + c.pd1y, 0) / arr.length * 100).toFixed(2) : 0,
      climateVaR: +(arr.reduce((s, c) => s + c.climateVaR, 0)).toFixed(1),
    };
  }), []);

  const radarData = useMemo(() => [
    { axis: 'FX Risk', score: +(selectedCurrency.climateVulnScore).toFixed(0) },
    { axis: 'Commodity', score: +(COMMODITIES.slice(0, 3).reduce((s, c) => s + Math.abs(c.ngfs_nz), 0) / 3).toFixed(0) },
    { axis: 'Supply Chain', score: +(SUPPLY_CHAIN_NODES.reduce((s, n) => s + n.climateRisk, 0) / Math.max(1, SUPPLY_CHAIN_NODES.length)).toFixed(0) },
    { axis: 'Counterparty', score: +(totalClimateVaR / Math.max(0.01, totalEad) * 100).toFixed(0) },
    { axis: 'Cash Flow', score: +(cashFlowStress.reduce((s, c) => s + Math.abs(c.climateImpact), 0) / Math.max(1, cashFlowStress.length)).toFixed(0) },
    { axis: 'Regulatory', score: Math.floor(25 + sr(99) * 50) },
  ], [selectedCurrency, totalClimateVaR, totalEad, cashFlowStress]);

  const complianceData = [
    { requirement: 'TCFD Treasury Disclosures', status: 'Partial', progress: 65, deadline: '2025-12-31' },
    { requirement: 'EU Taxonomy Alignment', status: 'In Progress', progress: 45, deadline: '2026-06-30' },
    { requirement: 'Climate VaR Reporting', status: 'Complete', progress: 100, deadline: '2025-03-31' },
    { requirement: 'Supply Chain Due Diligence', status: 'In Progress', progress: 55, deadline: '2026-01-01' },
    { requirement: 'Counterparty Climate Assessment', status: 'Partial', progress: 72, deadline: '2025-09-30' },
    { requirement: 'NGFS Scenario Analysis', status: 'Complete', progress: 100, deadline: '2025-06-30' },
    { requirement: 'Green Hedge Accounting', status: 'Not Started', progress: 15, deadline: '2026-12-31' },
  ];

  return (
    <div style={{ background: T.bg, minHeight: '100vh', padding: 24, fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono, marginBottom: 4 }}>EP-DD5 · CORPORATE FINANCE & CAPITAL MARKETS</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: T.navy, margin: 0 }}>Treasury Climate Risk</h1>
        <div style={{ fontSize: 13, color: T.textSec, marginTop: 4 }}>8 currencies · 12 commodities · 30 supply chain nodes · 25 counterparties · NGFS scenario overlay</div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={ngfsScenario} onChange={e => setNgfsScenario(e.target.value)} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.card, color: T.textPri, fontSize: 13 }}>
          {NGFS_SCENARIOS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={selectedCurrency.code} onChange={e => setSelectedCurrency(CURRENCIES.find(c => c.code === e.target.value))} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.card, color: T.textPri, fontSize: 13 }}>
          {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} — {c.country}</option>)}
        </select>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: T.textSec }}>Exposure: ${exposureAmount}Mn</span>
          <input type="range" min={10} max={500} value={exposureAmount} onChange={e => setExposureAmount(+e.target.value)} style={{ width: 120 }} />
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <KpiCard label="Total Counterparty EAD" value={`$${totalEad.toFixed(0)}Mn`} sub={`${COUNTERPARTIES.length} counterparties`} color={T.navy} />
        <KpiCard label="Total Climate VaR" value={`$${totalClimateVaR.toFixed(1)}Mn`} sub={ngfsScenario} color={T.red} />
        <KpiCard label="FX Hedging Cost" value={`$${fxHedgingCost}Mn`} sub={`${selectedCurrency.code} · $${exposureAmount}Mn`} color={T.amber} />
        <KpiCard label="High-Risk SC Nodes" value={`${highRiskNodes}/${SUPPLY_CHAIN_NODES.length}`} sub="Climate risk > 60" color={T.orange} />
        <KpiCard label="Avg Counterparty PD" value={`${(avgPd * 100).toFixed(2)}%`} sub="Climate-adjusted" color={T.indigo} />
        <KpiCard label="Scenario Multiplier" value={`${scenarioMultiplier}×`} sub="vs NDC baseline" color={T.teal} />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: `2px solid ${T.border}`, paddingBottom: 0, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{ padding: '8px 16px', background: 'none', border: 'none', borderBottom: tab === i ? `3px solid ${T.gold}` : '3px solid transparent', color: tab === i ? T.navy : T.textSec, fontWeight: tab === i ? 700 : 400, cursor: 'pointer', fontSize: 13 }}>{t}</button>
        ))}
      </div>

      {/* Tab 0: Treasury Dashboard */}
      {tab === 0 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Climate Risk Radar — {ngfsScenario}</div>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke={T.border} />
                  <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11, fill: T.textSec }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: T.textSec }} />
                  <Radar dataKey="score" stroke={T.red} fill={T.red} fillOpacity={0.25} name="Risk Score" />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>FX Climate Vulnerability Scores</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={CURRENCIES}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="code" tick={{ fontSize: 11, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 10, fill: T.textSec }} domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="climateVulnScore" name="Climate Vuln. Score">
                    {CURRENCIES.map((e, i) => <Cell key={i} fill={e.climateVulnScore > 55 ? T.red : e.climateVulnScore > 30 ? T.amber : T.green} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Tab 1: FX Climate Exposure */}
      {tab === 1 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Climate-Adjusted FX Hedging Cost</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={hedgingData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="currency" tick={{ fontSize: 11, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 10, fill: T.textSec }} tickFormatter={v => `$${v}Mn`} />
                  <Tooltip formatter={v => `$${v}Mn`} />
                  <Legend />
                  <Bar dataKey="unhedgedVaR" name="Unhedged VaR" fill={T.red} />
                  <Bar dataKey="hedgedVaR" name="Hedged VaR" fill={T.green} />
                  <Bar dataKey="hedgingCost" name="Hedging Cost" fill={T.amber} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>FX Hedging Analytics</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.surfaceH }}>
                    {['Currency', 'Vuln Score', 'Unhedged VaR', 'Hedged VaR', 'Hedge Cost', 'Net Benefit'].map(h => (
                      <th key={h} style={{ padding: '7px 10px', textAlign: 'left', color: T.textSec, fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {hedgingData.map((d, i) => (
                    <tr key={i} style={{ borderTop: `1px solid ${T.border}`, background: i % 2 === 0 ? 'transparent' : T.surfaceH }}>
                      <td style={{ padding: '6px 10px', fontFamily: T.fontMono, fontWeight: 700, color: T.navy }}>{d.currency}</td>
                      <td style={{ padding: '6px 10px', color: CURRENCIES[i].climateVulnScore > 55 ? T.red : CURRENCIES[i].climateVulnScore > 30 ? T.amber : T.green }}>{CURRENCIES[i].climateVulnScore.toFixed(0)}</td>
                      <td style={{ padding: '6px 10px', fontFamily: T.fontMono, color: T.red }}>${d.unhedgedVaR}Mn</td>
                      <td style={{ padding: '6px 10px', fontFamily: T.fontMono, color: T.green }}>${d.hedgedVaR}Mn</td>
                      <td style={{ padding: '6px 10px', fontFamily: T.fontMono }}>${d.hedgingCost}Mn</td>
                      <td style={{ padding: '6px 10px', fontFamily: T.fontMono, color: d.netBenefit > 0 ? T.green : T.red }}>{d.netBenefit > 0 ? '+' : ''}${d.netBenefit}Mn</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Commodity Risk */}
      {tab === 2 && (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Commodity Price Change under {ngfsScenario} (%)</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={commodityPriceData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: T.textSec }} angle={-25} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} tickFormatter={v => `${v}%`} />
                <Tooltip formatter={v => `${v}%`} />
                <Bar dataKey="changePct" name="Price Change %">
                  {commodityPriceData.map((e, i) => <Cell key={i} fill={e.changePct > 0 ? T.green : T.red} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.surfaceH }}>
                  {['Commodity', 'Category', 'Base Price', 'NZ 2050', 'Current Policies', `${ngfsScenario} Adj`, 'Climate Sens'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: T.textSec, fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {commodityPriceData.map((d, i) => (
                  <tr key={i} style={{ borderTop: `1px solid ${T.border}`, background: i % 2 === 0 ? 'transparent' : T.surfaceH }}>
                    <td style={{ padding: '7px 12px', color: T.navy, fontWeight: 600 }}>{d.name}</td>
                    <td style={{ padding: '7px 12px', fontSize: 11 }}>{d.category}</td>
                    <td style={{ padding: '7px 12px', fontFamily: T.fontMono }}>{d.base.toLocaleString()} {COMMODITIES[i].unit}</td>
                    <td style={{ padding: '7px 12px', fontFamily: T.fontMono, color: COMMODITIES[i].ngfs_nz > 0 ? T.green : T.red }}>{COMMODITIES[i].ngfs_nz > 0 ? '+' : ''}{COMMODITIES[i].ngfs_nz}%</td>
                    <td style={{ padding: '7px 12px', fontFamily: T.fontMono, color: COMMODITIES[i].ngfs_cp > 0 ? T.green : T.red }}>+{COMMODITIES[i].ngfs_cp}%</td>
                    <td style={{ padding: '7px 12px', fontFamily: T.fontMono, fontWeight: 700, color: d.changePct > 0 ? T.green : T.red }}>{d.adj.toLocaleString()}</td>
                    <td style={{ padding: '7px 12px', fontFamily: T.fontMono }}>{COMMODITIES[i].climateSens.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Supply Chain Stress */}
      {tab === 3 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Supply Chain Risk by Tier</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={supplyChainByTier}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="tier" tick={{ fontSize: 11, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 10, fill: T.textSec }} domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="avgRisk" name="Avg Climate Risk" fill={T.red} />
                  <Bar dataKey="avgDisruption" name="Avg Disruption % Prob" fill={T.amber} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Single-Source & High-Risk Nodes</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {supplyChainByTier.map((t, i) => (
                  <div key={i} style={{ padding: 12, background: T.surfaceH, borderRadius: 6, border: `1px solid ${T.border}` }}>
                    <div style={{ fontWeight: 700, color: T.navy, marginBottom: 6 }}>{t.tier}</div>
                    <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                      <span>Avg Risk: <span style={{ fontFamily: T.fontMono, color: t.avgRisk > 60 ? T.red : t.avgRisk > 40 ? T.amber : T.green }}>{t.avgRisk}</span></span>
                      <span>High Risk: <span style={{ fontFamily: T.fontMono, color: t.highRisk > 0 ? T.red : T.green }}>{t.highRisk}</span></span>
                      <span>Single-Source: <span style={{ fontFamily: T.fontMono, color: t.singleSource > 0 ? T.amber : T.green }}>{t.singleSource}</span></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Supply Chain Node Register</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.surfaceH }}>
                    {['Node', 'Tier', 'Country', 'Climate Risk', 'Physical', 'Transition', 'Lead Time', 'Single Source', 'Disruption Prob'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: T.textSec, fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...SUPPLY_CHAIN_NODES].sort((a, b) => b.climateRisk - a.climateRisk).slice(0, 12).map((n, i) => (
                    <tr key={n.id} style={{ borderTop: `1px solid ${T.border}`, background: i % 2 === 0 ? 'transparent' : T.surfaceH }}>
                      <td style={{ padding: '7px 12px', color: T.navy, fontWeight: 600, fontSize: 11 }}>{n.name}</td>
                      <td style={{ padding: '7px 12px', fontFamily: T.fontMono }}>T{n.tier}</td>
                      <td style={{ padding: '7px 12px', fontSize: 11 }}>{n.country}</td>
                      <td style={{ padding: '7px 12px', fontFamily: T.fontMono, color: n.climateRisk > 60 ? T.red : n.climateRisk > 40 ? T.amber : T.green }}>{n.climateRisk.toFixed(0)}</td>
                      <td style={{ padding: '7px 12px', fontFamily: T.fontMono }}>{n.physicalRisk.toFixed(0)}</td>
                      <td style={{ padding: '7px 12px', fontFamily: T.fontMono }}>{n.transitionRisk.toFixed(0)}</td>
                      <td style={{ padding: '7px 12px', fontFamily: T.fontMono }}>{n.leadTime}d</td>
                      <td style={{ padding: '7px 12px', color: n.singleSource ? T.red : T.green }}>{n.singleSource ? '⚠ Yes' : '✓ No'}</td>
                      <td style={{ padding: '7px 12px', fontFamily: T.fontMono, color: n.disruptionProb > 0.1 ? T.red : T.amber }}>{(n.disruptionProb * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Cash Flow Scenarios */}
      {tab === 4 && (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Cash Flow Stress — {ngfsScenario} ($Mn)</div>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={cashFlowStress}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="period" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} tickFormatter={v => `$${v}Mn`} />
                <Tooltip formatter={v => `$${v}Mn`} />
                <Legend />
                <Area type="monotone" dataKey="base" stroke={T.blue} fill={T.blue} fillOpacity={0.2} name="Base Cash Flow" />
                <Area type="monotone" dataKey="stressed" stroke={T.red} fill={T.red} fillOpacity={0.2} name="Stressed Cash Flow" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 5: Counterparty Climate Risk */}
      {tab === 5 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>EAD & Climate VaR by Rating</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={counterpartyRiskByRating}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="rating" tick={{ fontSize: 11, fill: T.textSec }} />
                  <YAxis yAxisId="l" tick={{ fontSize: 10, fill: T.textSec }} tickFormatter={v => `$${v}Mn`} />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 10, fill: T.textSec }} tickFormatter={v => `$${v}Mn`} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="l" dataKey="totalEad" name="Total EAD $Mn" fill={T.navy} />
                  <Bar yAxisId="r" dataKey="climateVaR" name="Climate VaR $Mn" fill={T.red} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Counterparty Register</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: T.surfaceH }}>
                      {['Name', 'Rating', 'PD 1Y', 'EAD', 'Climate VaR', 'SBTi'].map(h => (
                        <th key={h} style={{ padding: '7px 8px', textAlign: 'left', color: T.textSec, fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...COUNTERPARTIES].sort((a, b) => b.climateVaR - a.climateVaR).slice(0, 10).map((c, i) => (
                      <tr key={c.id} style={{ borderTop: `1px solid ${T.border}`, background: i % 2 === 0 ? 'transparent' : T.surfaceH }}>
                        <td style={{ padding: '6px 8px', color: T.navy, fontWeight: 600 }}>{c.name.split(' ').slice(0, 2).join(' ')}</td>
                        <td style={{ padding: '6px 8px', fontFamily: T.fontMono, color: c.climateRating.startsWith('A') ? T.green : c.climateRating === 'BBB' ? T.amber : T.red }}>{c.climateRating}</td>
                        <td style={{ padding: '6px 8px', fontFamily: T.fontMono }}>{(c.pd1y * 100).toFixed(2)}%</td>
                        <td style={{ padding: '6px 8px', fontFamily: T.fontMono }}>${c.ead}Mn</td>
                        <td style={{ padding: '6px 8px', fontFamily: T.fontMono, color: T.red }}>${c.climateVaR}Mn</td>
                        <td style={{ padding: '6px 8px', color: c.sbtiStatus === 'Committed' ? T.green : T.textSec, fontSize: 10 }}>{c.sbtiStatus === 'Committed' ? '✓' : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Hedging Analytics */}
      {tab === 6 && (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Net Hedging Benefit by Currency ($Mn)</div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={hedgingData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="currency" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} tickFormatter={v => `$${v}Mn`} />
                <Tooltip formatter={v => `$${v}Mn`} />
                <Bar dataKey="netBenefit" name="Net Benefit ($Mn)">
                  {hedgingData.map((e, i) => <Cell key={i} fill={e.netBenefit > 0 ? T.green : T.red} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 7: Regulatory Compliance */}
      {tab === 7 && (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Treasury Climate Regulatory Compliance Tracker</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {complianceData.map((c, i) => (
                <div key={i} style={{ padding: 14, background: T.surfaceH, borderRadius: 8, border: `1px solid ${T.border}`, display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 12, alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: T.navy, fontSize: 13 }}>{c.requirement}</div>
                    <div style={{ fontSize: 11, color: T.textSec }}>Deadline: {c.deadline}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 4, background: c.status === 'Complete' ? T.green + '22' : c.status === 'Not Started' ? T.red + '22' : T.amber + '22', color: c.status === 'Complete' ? T.green : c.status === 'Not Started' ? T.red : T.amber }}>{c.status}</span>
                  </div>
                  <div>
                    <div style={{ height: 10, background: T.border, borderRadius: 4 }}>
                      <div style={{ height: '100%', width: `${c.progress}%`, background: c.progress === 100 ? T.green : c.progress > 50 ? T.amber : T.red, borderRadius: 4 }} />
                    </div>
                    <div style={{ fontSize: 10, color: T.textSec, textAlign: 'center', marginTop: 2 }}>{c.progress}%</div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 11, color: T.textSec }}>{c.deadline}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
