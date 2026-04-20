import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
const sr = (seed) => { let x = Math.sin(seed + 1) * 10000; return x - Math.floor(x); };
const T = { bg: '#0f1117', surface: '#1a1d27', surfaceH: '#22263a', border: '#2a2f45', borderL: '#1e2235', navy: '#1e3a5f', navyL: '#2a4a6f', gold: '#d4a843', goldL: '#e8c060', sage: '#2d6a4f', sageL: '#3d8a6f', teal: '#0d4f5c', text: '#e8e0d0', textSec: '#a89880', textMut: '#6b6050', red: '#c0392b', green: '#27ae60', amber: '#e67e22', font: "'DM Sans', sans-serif", mono: "'JetBrains Mono', monospace" };

const BORROWER_SECTORS = [
  { id: 'utilities', name: 'Utilities', baseSpr: 95, physRisk: 28, transRisk: 45, physRiskScore: 62, transRiskScore: 71, revenue: 8200, emissions: 485, loanM: 250, maturity: 7, rating: 'BBB' },
  { id: 'oil_gas', name: 'Oil & Gas', baseSpr: 145, physRisk: 18, transRisk: 85, physRiskScore: 38, transRiskScore: 94, revenue: 22400, emissions: 1240, loanM: 400, maturity: 5, rating: 'BBB-' },
  { id: 'real_estate', name: 'Real Estate', baseSpr: 115, physRisk: 52, transRisk: 35, physRiskScore: 78, transRiskScore: 42, revenue: 3600, emissions: 92, loanM: 180, maturity: 10, rating: 'BBB+' },
  { id: 'auto', name: 'Auto Manufacturing', baseSpr: 135, physRisk: 22, transRisk: 68, physRiskScore: 44, transRiskScore: 82, revenue: 45000, emissions: 380, loanM: 500, maturity: 5, rating: 'BBB' },
  { id: 'chemicals', name: 'Chemicals', baseSpr: 125, physRisk: 35, transRisk: 58, physRiskScore: 54, transRiskScore: 68, revenue: 6800, emissions: 620, loanM: 200, maturity: 6, rating: 'BBB-' },
  { id: 'shipping', name: 'Shipping', baseSpr: 175, physRisk: 45, transRisk: 62, physRiskScore: 66, transRiskScore: 74, revenue: 4200, emissions: 890, loanM: 300, maturity: 8, rating: 'BB+' },
  { id: 'aviation', name: 'Aviation', baseSpr: 195, physRisk: 30, transRisk: 72, physRiskScore: 48, transRiskScore: 86, revenue: 12800, emissions: 720, loanM: 350, maturity: 7, rating: 'BB+' },
  { id: 'agri', name: 'Agriculture', baseSpr: 130, physRisk: 68, transRisk: 28, physRiskScore: 85, transRiskScore: 35, revenue: 2800, emissions: 210, loanM: 120, maturity: 5, rating: 'BBB' },
];

const RISK_COMPONENTS = [
  { component: 'Physical Risk — Acute', weight: 0.15, description: 'Extreme weather events, flooding, wildfire damage to collateral/operations' },
  { component: 'Physical Risk — Chronic', weight: 0.10, description: 'Long-term climate shifts: sea level rise, heat stress, precipitation change' },
  { component: 'Transition Risk — Policy', weight: 0.20, description: 'Carbon pricing, regulatory caps, mandatory disclosure, stranded asset risk' },
  { component: 'Transition Risk — Technology', weight: 0.15, description: 'Disruption from clean alternatives; capex to retrofit or replace assets' },
  { component: 'Transition Risk — Market', weight: 0.12, description: 'Changing customer/investor demand, loss of social licence, ESG rerating' },
  { component: 'Liability Risk', weight: 0.08, description: 'Climate litigation exposure; directors liability; supply chain disputes' },
  { component: 'Counterparty Climate Risk', weight: 0.10, description: 'Supply chain and customer exposure to stranded-asset counterparties' },
  { component: 'Reputational Risk', weight: 0.10, description: 'ESG controversies, greenwashing allegations, public perception' },
];

const SCENARIO_PREMIA = [
  { scenario: 'Orderly 1.5°C', physPrem: 8, transPrem: 18, totalPrem: 26, gdpImpact: -1.2, stranded: 'Low', timeline: '2030–2050' },
  { scenario: 'Disorderly 1.8°C', physPrem: 14, transPrem: 32, totalPrem: 46, gdpImpact: -2.8, stranded: 'Medium', timeline: '2025–2040' },
  { scenario: 'Delayed 2.0°C', physPrem: 18, transPrem: 42, totalPrem: 60, gdpImpact: -3.5, stranded: 'High', timeline: '2030–2045' },
  { scenario: 'Hot House 3.0°C+', physPrem: 38, transPrem: 22, totalPrem: 60, gdpImpact: -7.4, stranded: 'Very High (physical)', timeline: '2040–2060' },
  { scenario: 'NDC Current 2.6°C', physPrem: 28, transPrem: 28, totalPrem: 56, gdpImpact: -5.1, stranded: 'High', timeline: '2035–2055' },
];

const CREDIT_VAR_PARAMS = [
  { horizon: '1-year', confidence: '99%', climateShare: '8–15%', driver: 'Policy shock, carbon price spike' },
  { horizon: '3-year', confidence: '99%', climateShare: '18–28%', driver: 'Transition + physical combined' },
  { horizon: '5-year', confidence: '95%', climateShare: '25–40%', driver: 'Physical risk materialisation' },
  { horizon: '10-year', confidence: '95%', climateShare: '35–55%', driver: 'Stranded asset + systemic physical' },
];

const PORTFOLIO_LOANS = Array.from({ length: 12 }, (_, i) => {
  const s = BORROWER_SECTORS[i % BORROWER_SECTORS.length];
  const noise = sr(i * 17 + 3) * 40 - 20;
  return {
    id: `L${String(i+1).padStart(3,'0')}`,
    name: `${s.name} ${['Corp A','Group B','Holdings C','Ltd D','Inc E'][i%5]}`,
    sector: s.name, rating: s.rating,
    baseSpr: s.baseSpr + Math.round(noise * 0.5),
    physPrem: Math.round(s.physRisk * 0.4 + sr(i*7)*10),
    transPrem: Math.round(s.transRisk * 0.5 + sr(i*11)*12),
    loanM: Math.round(s.loanM * (0.7 + sr(i*3)*0.6)),
    maturity: s.maturity + Math.round(sr(i*19)*4 - 2),
  };
});

const TABS = [
  'Overview', 'Credit Spread Model', 'Physical Risk Premium', 'Transition Risk Premium',
  'Portfolio Pricer', 'Climate VaR', 'Scenario Analysis', 'Sector Deep-Dive',
  'Regulatory Capital', 'Benchmark Intelligence'
];

function calcClimateSpread({ baseSpr, physRiskScore, transRiskScore, scenario, carbonPrice, loanM, maturity }) {
  const scMult = { 'Orderly': 0.8, 'Disorderly': 1.2, 'Delayed': 1.4, 'Hot House': 1.0, 'NDC': 1.1 }[scenario] || 1.0;
  const physPrem = (physRiskScore / 100) * 25 * scMult;
  const transPrem = (transRiskScore / 100) * 35 * scMult;
  const carbonPrem = Math.max(0, carbonPrice - 50) * 0.08 * (transRiskScore / 100);
  const totalSpr = baseSpr + physPrem + transPrem + carbonPrem;
  const annInterest = loanM * totalSpr / 10000;
  const climateAddon = loanM * (physPrem + transPrem + carbonPrem) / 10000;
  const rcwa = Math.min(1.5, 0.75 + (physRiskScore + transRiskScore) / 400);
  return { physPrem: physPrem.toFixed(1), transPrem: transPrem.toFixed(1), carbonPrem: carbonPrem.toFixed(1), totalSpr: totalSpr.toFixed(0), annInterest: annInterest.toFixed(2), climateAddon: climateAddon.toFixed(2), rcwa: rcwa.toFixed(2) };
}

function calcClimateVar({ portfolio, horizon, confidence }) {
  const baseVar = portfolio.reduce((s, l) => s + l.loanM * (l.baseSpr / 10000) * 0.08, 0);
  const horizonMult = { '1yr': 1, '3yr': 1.8, '5yr': 2.4, '10yr': 3.5 }[horizon] || 1;
  const confMult = { '95': 0.85, '99': 1.0, '99.9': 1.25 }[confidence] || 1.0;
  const physVar = portfolio.reduce((s, l) => s + l.loanM * (l.physPrem / 10000) * horizonMult * confMult, 0);
  const transVar = portfolio.reduce((s, l) => s + l.loanM * (l.transPrem / 10000) * horizonMult * confMult, 0);
  const totalVar = baseVar + physVar + transVar;
  const climateShare = (physVar + transVar) / totalVar * 100;
  return { baseVar: baseVar.toFixed(1), physVar: physVar.toFixed(1), transVar: transVar.toFixed(1), totalVar: totalVar.toFixed(1), climateShare: climateShare.toFixed(1) };
}

export default function ClimateCreditPricingPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedSector, setSelectedSector] = useState('utilities');
  const [scenario, setScenario] = useState('Orderly');
  const [carbonPrice, setCarbonPrice] = useState(85);
  const [varHorizon, setVarHorizon] = useState('3yr');
  const [varConf, setVarConf] = useState('99');
  const [physWeight, setPhysWeight] = useState(40);
  const [transWeight, setTransWeight] = useState(60);

  const borrower = useMemo(() => BORROWER_SECTORS.find(b => b.id === selectedSector) || BORROWER_SECTORS[0], [selectedSector]);

  const pricing = useMemo(() => calcClimateSpread({
    baseSpr: borrower.baseSpr, physRiskScore: borrower.physRiskScore,
    transRiskScore: borrower.transRiskScore, scenario, carbonPrice,
    loanM: borrower.loanM, maturity: borrower.maturity,
  }), [borrower, scenario, carbonPrice]);

  const portfolioVar = useMemo(() => calcClimateVar({ portfolio: PORTFOLIO_LOANS, horizon: varHorizon, confidence: varConf }), [varHorizon, varConf]);

  const spreadDecomp = useMemo(() => [
    { name: 'Base Spread', value: borrower.baseSpr, fill: T.navy },
    { name: 'Physical Risk Premium', value: parseFloat(pricing.physPrem), fill: T.amber },
    { name: 'Transition Risk Premium', value: parseFloat(pricing.transPrem), fill: T.red },
    { name: 'Carbon Price Premium', value: parseFloat(pricing.carbonPrem), fill: T.sage },
  ], [borrower, pricing, T]);

  const scenarioComparison = useMemo(() => SCENARIO_PREMIA.map(s => ({
    scenario: s.scenario.split(' ')[0] + ' ' + (s.scenario.split(' ')[1] || ''),
    physPrem: s.physPrem, transPrem: s.transPrem, totalPrem: s.totalPrem,
  })), []);

  const sectorScatter = useMemo(() => BORROWER_SECTORS.map(s => ({
    name: s.name, x: s.transRiskScore, y: s.physRiskScore,
    spread: s.baseSpr + Math.round(s.physRisk * 0.4 + s.transRisk * 0.5),
  })), []);

  const ratingGrid = useMemo(() => ['AAA','AA+','AA','AA-','A+','A','A-','BBB+','BBB','BBB-','BB+','BB'].map((r, i) => ({
    rating: r, baseSpr: [18,22,28,35,42,52,65,82,95,115,145,175][i],
    climateAdj: Math.round([18,22,28,35,42,52,65,82,95,115,145,175][i] * (0.08 + sr(i*7)*0.06)),
  })), []);

  const s = { padding: '24px', fontFamily: T.font, color: T.text, background: T.bg, minHeight: '100vh' };
  const card = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '20px', marginBottom: 16 };
  const kpi = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px', textAlign: 'center' };
  const tab = (i) => ({ padding: '8px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontFamily: T.font, background: activeTab === i ? T.gold : T.surface, color: activeTab === i ? T.navy : T.text, fontWeight: activeTab === i ? 700 : 400 });
  const inp = { background: T.bg, border: `1px solid ${T.border}`, borderRadius: 4, padding: '6px 10px', color: T.text, fontSize: 13, fontFamily: T.mono, width: '100%' };
  const sel = { ...inp, cursor: 'pointer' };

  return (
    <div style={s}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 28 }}>📉</span>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.navy }}>Climate Credit Pricing Intelligence Suite</h1>
            <p style={{ margin: 0, fontSize: 13, color: T.textSec }}>EP-DW4 · TCFD-Aligned Credit Spreads · Physical & Transition Risk Premia · Climate VaR · FI Loan Book Analytics</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {TABS.map((t, i) => <button key={i} onClick={() => setActiveTab(i)} style={tab(i)}>{t}</button>)}
        </div>
      </div>

      {activeTab === 0 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20 }}>
            {[
              { label: 'Avg Climate Risk Premium (BBB)', value: '45bps', sub: 'Physical + Transition + Carbon' },
              { label: 'Climate Share of Credit VaR', value: '22–38%', sub: '3yr horizon, 99% confidence' },
              { label: 'Carbon Price (EU ETS 2024)', value: '€65/t', sub: 'Adding ~8–18bps per transition unit' },
              { label: 'NGFS Climate Risk Horizon', value: '2030–2050', sub: 'Orderly transition window' },
            ].map((k, i) => <div key={i} style={kpi}><div style={{ fontSize: 11, color: T.textMut, marginBottom: 6 }}>{k.label}</div><div style={{ fontSize: 20, fontWeight: 700, color: T.navy }}>{k.value}</div><div style={{ fontSize: 11, color: T.textSec }}>{k.sub}</div></div>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={card}>
              <h3 style={{ margin: '0 0 16px', fontSize: 14, color: T.navy }}>Climate Risk Premium by Sector</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={BORROWER_SECTORS} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'bps', position: 'insideBottom', offset: -2, fontSize: 11, fill: T.textSec }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: T.textSec }} width={100} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="physRisk" name="Physical Risk" fill={T.amber} stackId="a" />
                  <Bar dataKey="transRisk" name="Transition Risk" fill={T.red} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <h3 style={{ margin: '0 0 16px', fontSize: 14, color: T.navy }}>Physical vs. Transition Risk Matrix</h3>
              <ResponsiveContainer width="100%" height={280}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="x" name="Transition Risk Score" label={{ value: 'Transition Risk Score', position: 'insideBottom', offset: -5, fontSize: 11, fill: T.textSec }} tick={{ fontSize: 11, fill: T.textSec }} domain={[0, 100]} />
                  <YAxis dataKey="y" name="Physical Risk Score" label={{ value: 'Physical Risk Score', angle: -90, position: 'insideLeft', fontSize: 11, fill: T.textSec }} tick={{ fontSize: 11, fill: T.textSec }} domain={[0, 100]} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 12 }}
                    content={({ payload }) => payload?.[0] ? (
                      <div style={{ background: T.surface, border: `1px solid ${T.border}`, padding: '8px 12px', borderRadius: 6, fontSize: 12 }}>
                        <div style={{ color: T.navy, fontWeight: 600 }}>{payload[0].payload.name}</div>
                        <div>Trans: {payload[0].payload.x} | Phys: {payload[0].payload.y}</div>
                        <div style={{ color: T.red }}>Total Spr: {payload[0].payload.spread}bps</div>
                      </div>
                    ) : null} />
                  <Scatter data={sectorScatter} fill={T.navy} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={card}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy }}>Risk Component Framework (TCFD-Aligned)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
              {RISK_COMPONENTS.map((rc, i) => (
                <div key={i} style={{ padding: '12px', background: T.surfaceH, borderRadius: 6, borderTop: `2px solid ${i < 2 ? T.amber : i < 5 ? T.red : T.navy}` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.navy, marginBottom: 6 }}>{rc.component}</div>
                  <div style={{ fontSize: 12, fontFamily: T.mono, color: T.teal, marginBottom: 6 }}>Weight: {(rc.weight * 100).toFixed(0)}%</div>
                  <div style={{ fontSize: 11, color: T.textSec }}>{rc.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 1 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20 }}>
            <div>
              <div style={card}>
                <h3 style={{ margin: '0 0 16px', fontSize: 14, color: T.navy }}>Pricing Parameters</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div><label style={{ fontSize: 12, color: T.textSec }}>Borrower Sector</label>
                    <select value={selectedSector} onChange={e => setSelectedSector(e.target.value)} style={sel}>
                      {BORROWER_SECTORS.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div><label style={{ fontSize: 12, color: T.textSec }}>NGFS Scenario</label>
                    <select value={scenario} onChange={e => setScenario(e.target.value)} style={sel}>
                      {['Orderly','Disorderly','Delayed','Hot House','NDC'].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div><label style={{ fontSize: 12, color: T.textSec }}>Forward Carbon Price ($/t): {carbonPrice}</label><input type="range" min={20} max={200} step={5} value={carbonPrice} onChange={e => setCarbonPrice(+e.target.value)} style={{ width: '100%' }} /></div>
                </div>
              </div>
              <div style={card}>
                <h3 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy }}>Borrower Profile</h3>
                {[
                  ['Rating', borrower.rating],
                  ['Base Spread', `${borrower.baseSpr}bps`],
                  ['Phys. Risk Score', `${borrower.physRiskScore}/100`],
                  ['Trans. Risk Score', `${borrower.transRiskScore}/100`],
                  ['Loan Size', `$${borrower.loanM}M`],
                  ['Maturity', `${borrower.maturity}yr`],
                  ['Emissions', `${borrower.emissions} ktCO₂e`],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.borderL}`, fontSize: 12 }}>
                    <span style={{ color: T.textSec }}>{k}</span>
                    <span style={{ fontFamily: T.mono, color: T.navy }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
                {[
                  { label: 'Base Spread', value: `${borrower.baseSpr}bps` },
                  { label: 'Physical Risk Premium', value: `+${pricing.physPrem}bps` },
                  { label: 'Transition Risk Premium', value: `+${pricing.transPrem}bps` },
                  { label: 'Carbon Price Premium', value: `+${pricing.carbonPrem}bps` },
                  { label: 'Total Climate-Adj. Spread', value: `${pricing.totalSpr}bps` },
                  { label: 'Annual Climate Add-on ($M)', value: `$${pricing.climateAddon}M` },
                ].map((k, i) => <div key={i} style={kpi}><div style={{ fontSize: 11, color: T.textMut, marginBottom: 4 }}>{k.label}</div><div style={{ fontSize: 20, fontWeight: 700, color: i >= 4 ? T.red : T.navy }}>{k.value}</div></div>)}
              </div>
              <div style={card}>
                <h3 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy }}>Spread Decomposition</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={spreadDecomp} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'bps', position: 'insideBottom', offset: -2, fontSize: 11, fill: T.textSec }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: T.textSec }} width={160} />
                    <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 12 }} formatter={(v) => [`${v}bps`, 'Spread']} />
                    <Bar dataKey="value" radius={[0,3,3,0]}>
                      {spreadDecomp.map((d, i) => <rect key={i} fill={d.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 2 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy }}>Physical Risk Premium by Sector</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={BORROWER_SECTORS.map(b => ({ name: b.name, premium: Math.round(b.physRiskScore * 0.25) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} angle={-25} textAnchor="end" height={55} />
                  <YAxis tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'bps', angle: -90, position: 'insideLeft', fontSize: 11, fill: T.textSec }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 12 }} formatter={(v) => [`${v}bps`, 'Physical Premium']} />
                  <Bar dataKey="premium" fill={T.amber} radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy }}>Physical Risk Sub-Components</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr>{['Peril','Loan Book Exposure','Premium Range','Key Sectors'].map(h => <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: T.textMut, borderBottom: `1px solid ${T.border}` }}>{h}</th>)}</tr></thead>
                <tbody>{[
                  ['Coastal Flooding', '18–35% of book', '8–22bps', 'Real Estate, Utilities'],
                  ['Wildfire', '8–15% of book', '5–15bps', 'Agri, Real Estate, Utilities'],
                  ['Heat Stress', '12–25% of book', '6–18bps', 'Agriculture, Chemicals'],
                  ['Water Scarcity', '15–30% of book', '7–20bps', 'Agriculture, Chemicals'],
                  ['Tropical Cyclone', '10–20% of book', '10–28bps', 'RE, Shipping, Infra'],
                  ['Sea Level Rise (chronic)', '12–22% of book', '4–12bps', 'Real Estate, Ports'],
                ].map(([peril, exp, prem, sectors], i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? T.surfaceH : 'transparent' }}>
                    <td style={{ padding: '7px 8px', fontWeight: 600, color: T.amber }}>{peril}</td>
                    <td style={{ padding: '7px 8px', fontFamily: T.mono }}>{exp}</td>
                    <td style={{ padding: '7px 8px', fontFamily: T.mono, color: T.navy }}>{prem}</td>
                    <td style={{ padding: '7px 8px', color: T.textSec }}>{sectors}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 3 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy }}>Transition Premium vs. Carbon Price</h3>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={[20,40,60,80,100,130,160,200].map(cp => ({
                  carbon: cp,
                  utilities: Math.round(71/100 * 35 + Math.max(0, cp-50)*0.08*(71/100)),
                  oil_gas: Math.round(94/100 * 35 + Math.max(0, cp-50)*0.08*(94/100)),
                  auto: Math.round(82/100 * 35 + Math.max(0, cp-50)*0.08*(82/100)),
                  chemicals: Math.round(68/100 * 35 + Math.max(0, cp-50)*0.08*(68/100)),
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="carbon" label={{ value: 'Carbon Price ($/t)', position: 'insideBottom', offset: -2, fontSize: 11, fill: T.textSec }} tick={{ fontSize: 11, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'bps', angle: -90, position: 'insideLeft', fontSize: 11, fill: T.textSec }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <ReferenceLine x={carbonPrice} stroke={T.amber} strokeDasharray="4 4" label={{ value: `Current $${carbonPrice}`, fontSize: 10, fill: T.amber }} />
                  <Line type="monotone" dataKey="utilities" name="Utilities" stroke={T.navy} dot={false} strokeWidth={1.5} />
                  <Line type="monotone" dataKey="oil_gas" name="Oil & Gas" stroke={T.red} dot={false} strokeWidth={1.5} />
                  <Line type="monotone" dataKey="auto" name="Auto" stroke={T.teal} dot={false} strokeWidth={1.5} />
                  <Line type="monotone" dataKey="chemicals" name="Chemicals" stroke={T.amber} dot={false} strokeWidth={1.5} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy }}>Transition Risk Components</h3>
              {[
                { component: 'Policy & Regulation', premium: '12–25bps', driver: 'Carbon pricing trajectory, ETS price forecasts' },
                { component: 'Technology Disruption', premium: '8–18bps', driver: 'Clean alternative penetration, retrofit capex' },
                { component: 'Market Demand Shift', premium: '5–12bps', driver: 'Consumer preferences, investor ESG screening' },
                { component: 'Stranded Asset Risk', premium: '10–30bps', driver: 'Fossil fuel reserve write-downs, GFANZ commitments' },
                { component: 'Carbon Border Adjustment', premium: '4–15bps', driver: 'CBAM impact on trade-exposed sectors' },
                { component: 'Litigation Exposure', premium: '2–8bps', driver: 'Director liability, supply chain claims' },
              ].map((tc, i) => (
                <div key={i} style={{ padding: '8px 12px', background: i % 2 === 0 ? T.surfaceH : 'transparent', borderRadius: 4, marginBottom: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.navy }}>{tc.component}</div>
                    <div style={{ fontSize: 11, color: T.textSec }}>{tc.driver}</div>
                  </div>
                  <span style={{ fontSize: 12, fontFamily: T.mono, color: T.red, whiteSpace: 'nowrap', marginLeft: 12 }}>{tc.premium}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 4 && (
        <div>
          <div style={card}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, color: T.navy }}>Portfolio Climate Credit Pricer</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr>{['Loan ID','Borrower','Sector','Rating','Base Spr','Phys Prem','Trans Prem','Total Spr','Loan ($M)','Ann Add-on ($K)'].map(h => <th key={h} style={{ padding: '6px 8px', textAlign: h !== 'Borrower' && h !== 'Sector' ? 'right' : 'left', color: T.textMut, borderBottom: `1px solid ${T.border}` }}>{h}</th>)}</tr></thead>
              <tbody>{PORTFOLIO_LOANS.map((l, i) => {
                const totalSpr = l.baseSpr + l.physPrem + l.transPrem;
                const addon = Math.round(l.loanM * (l.physPrem + l.transPrem) / 10000 * 1000);
                return (
                  <tr key={i} style={{ background: i % 2 === 0 ? T.surfaceH : 'transparent' }}>
                    <td style={{ padding: '7px 8px', fontFamily: T.mono, color: T.textMut }}>{l.id}</td>
                    <td style={{ padding: '7px 8px', color: T.navy, fontWeight: 600 }}>{l.name}</td>
                    <td style={{ padding: '7px 8px', color: T.textSec }}>{l.sector}</td>
                    <td style={{ padding: '7px 8px', textAlign: 'right', fontFamily: T.mono }}>{l.rating}</td>
                    <td style={{ padding: '7px 8px', textAlign: 'right', fontFamily: T.mono }}>{l.baseSpr}</td>
                    <td style={{ padding: '7px 8px', textAlign: 'right', fontFamily: T.mono, color: T.amber }}>{l.physPrem}</td>
                    <td style={{ padding: '7px 8px', textAlign: 'right', fontFamily: T.mono, color: T.red }}>{l.transPrem}</td>
                    <td style={{ padding: '7px 8px', textAlign: 'right', fontFamily: T.mono, fontWeight: 600 }}>{totalSpr}</td>
                    <td style={{ padding: '7px 8px', textAlign: 'right', fontFamily: T.mono }}>{l.loanM}</td>
                    <td style={{ padding: '7px 8px', textAlign: 'right', fontFamily: T.mono, color: T.red }}>{addon}</td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 5 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
            <div>
              <div style={card}>
                <h3 style={{ margin: '0 0 16px', fontSize: 14, color: T.navy }}>VaR Parameters</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div><label style={{ fontSize: 12, color: T.textSec }}>Time Horizon</label>
                    <select value={varHorizon} onChange={e => setVarHorizon(e.target.value)} style={sel}>
                      {['1yr','3yr','5yr','10yr'].map(h => <option key={h}>{h}</option>)}
                    </select>
                  </div>
                  <div><label style={{ fontSize: 12, color: T.textSec }}>Confidence Level</label>
                    <select value={varConf} onChange={e => setVarConf(e.target.value)} style={sel}>
                      {['95','99','99.9'].map(c => <option key={c}>{c}%</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Base Credit VaR ($M)', value: portfolioVar.baseVar, color: T.navy },
                  { label: 'Physical Risk VaR ($M)', value: portfolioVar.physVar, color: T.amber },
                  { label: 'Transition Risk VaR ($M)', value: portfolioVar.transVar, color: T.red },
                  { label: 'Total Climate VaR ($M)', value: portfolioVar.totalVar, color: T.navy },
                  { label: 'Climate Share of VaR', value: `${portfolioVar.climateShare}%`, color: T.teal },
                ].map((k, i) => (
                  <div key={i} style={{ ...kpi, padding: '12px' }}>
                    <div style={{ fontSize: 11, color: T.textMut, marginBottom: 4 }}>{k.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: k.color }}>{k.value}</div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div style={card}>
                <h3 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy }}>VaR Decomposition Chart</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={[
                    { name: 'Base Credit VaR', val: parseFloat(portfolioVar.baseVar) },
                    { name: 'Physical VaR', val: parseFloat(portfolioVar.physVar) },
                    { name: 'Transition VaR', val: parseFloat(portfolioVar.transVar) },
                    { name: 'Total Climate VaR', val: parseFloat(portfolioVar.totalVar) },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} />
                    <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                    <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 12 }} formatter={(v) => [`$${v}M`, 'VaR']} />
                    <Bar dataKey="val" fill={T.navy} radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={card}>
                <h3 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy }}>Climate VaR Parameters by Horizon</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead><tr>{['Horizon','Confidence','Climate Share','Primary Driver'].map(h => <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: T.textMut, borderBottom: `1px solid ${T.border}` }}>{h}</th>)}</tr></thead>
                  <tbody>{CREDIT_VAR_PARAMS.map((p, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? T.surfaceH : 'transparent' }}>
                      <td style={{ padding: '7px 8px', fontFamily: T.mono, color: T.navy }}>{p.horizon}</td>
                      <td style={{ padding: '7px 8px', fontFamily: T.mono }}>{p.confidence}</td>
                      <td style={{ padding: '7px 8px', fontFamily: T.mono, color: T.red }}>{p.climateShare}</td>
                      <td style={{ padding: '7px 8px', color: T.textSec }}>{p.driver}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 6 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy }}>Spread Premium by NGFS Scenario</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={scenarioComparison}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="scenario" tick={{ fontSize: 10, fill: T.textSec }} angle={-20} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'bps', angle: -90, position: 'insideLeft', fontSize: 11, fill: T.textSec }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="physPrem" name="Physical Premium" fill={T.amber} stackId="a" />
                  <Bar dataKey="transPrem" name="Transition Premium" fill={T.red} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy }}>Scenario Summary</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr>{['Scenario','Phys Prem','Trans Prem','Total','GDP Impact','Stranded Risk'].map(h => <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: T.textMut, borderBottom: `1px solid ${T.border}` }}>{h}</th>)}</tr></thead>
                <tbody>{SCENARIO_PREMIA.map((sc, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? T.surfaceH : 'transparent' }}>
                    <td style={{ padding: '7px 8px', fontWeight: 600, color: T.navy, fontSize: 11 }}>{sc.scenario}</td>
                    <td style={{ padding: '7px 8px', fontFamily: T.mono, color: T.amber }}>{sc.physPrem}bps</td>
                    <td style={{ padding: '7px 8px', fontFamily: T.mono, color: T.red }}>{sc.transPrem}bps</td>
                    <td style={{ padding: '7px 8px', fontFamily: T.mono, fontWeight: 600 }}>{sc.totalPrem}bps</td>
                    <td style={{ padding: '7px 8px', fontFamily: T.mono, color: T.red }}>{sc.gdpImpact}%</td>
                    <td style={{ padding: '7px 8px', color: T.textSec, fontSize: 11 }}>{sc.stranded}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 7 && (
        <div>
          <div style={card}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, color: T.navy }}>Sector Climate Risk Deep-Dive</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
              {BORROWER_SECTORS.map((sec, i) => (
                <div key={i} style={{ padding: '14px', background: T.surfaceH, borderRadius: 6, borderLeft: `3px solid ${T.navy}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: T.navy }}>{sec.name}</div>
                    <span style={{ fontSize: 11, fontFamily: T.mono, background: T.surface, padding: '2px 8px', borderRadius: 4 }}>{sec.rating}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                    {[
                      { k: 'Base', v: `${sec.baseSpr}bps`, c: T.navy },
                      { k: 'Phys Risk', v: `${Math.round(sec.physRiskScore * 0.25)}bps`, c: T.amber },
                      { k: 'Trans Risk', v: `${Math.round(sec.transRiskScore * 0.35)}bps`, c: T.red },
                    ].map(item => (
                      <div key={item.k} style={{ textAlign: 'center', padding: '6px', background: T.surface, borderRadius: 4 }}>
                        <div style={{ fontSize: 10, color: T.textMut }}>{item.k}</div>
                        <div style={{ fontSize: 13, fontFamily: T.mono, fontWeight: 700, color: item.c }}>{item.v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 8 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy }}>Climate Risk Weighted Assets (RWA) Uplift</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr>{['Rating','Standard RW (%)','Climate RW (%)','RWA Uplift'].map(h => <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: T.textMut, borderBottom: `1px solid ${T.border}` }}>{h}</th>)}</tr></thead>
                <tbody>{ratingGrid.slice(0, 8).map((r, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? T.surfaceH : 'transparent' }}>
                    <td style={{ padding: '7px 8px', fontFamily: T.mono, color: T.navy, fontWeight: 600 }}>{r.rating}</td>
                    <td style={{ padding: '7px 8px', fontFamily: T.mono }}>{[20,20,20,50,50,50,75,100,100,100,100,150][i]}%</td>
                    <td style={{ padding: '7px 8px', fontFamily: T.mono, color: T.amber }}>{[22,23,25,55,58,62,82,112,115,125,142,178][i]}%</td>
                    <td style={{ padding: '7px 8px', fontFamily: T.mono, color: T.red }}>+{[2,3,5,5,8,12,7,12,15,25,42,28][i]}%</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy }}>Regulatory Frameworks</h3>
              {[
                { reg: 'EBA Climate Risk Guidelines (2021)', scope: 'EU banks: integrate climate risk into ICAAPs and SREPs', horizon: 'Immediate', status: 'Active' },
                { reg: 'ECB Guide on Climate-Related Risks', scope: 'Supervisory expectations for loan book climate risk management', horizon: '2023+', status: 'Active' },
                { reg: 'BCBS Principles for Climate Risk', scope: '18 principles covering governance, scenario analysis, credit risk', horizon: '2022', status: 'Active' },
                { reg: 'PRA SS3/19 Update (UK)', scope: 'Stress testing requirements for systemic climate risk in UK banks', horizon: '2025+', status: 'Active' },
                { reg: 'Basel III Climate Add-on (Proposed)', scope: 'Capital surcharge for concentrated climate risk exposures', horizon: '2027+', status: 'Proposed' },
              ].map((reg, i) => (
                <div key={i} style={{ padding: '10px 12px', background: i % 2 === 0 ? T.surfaceH : 'transparent', borderRadius: 4, marginBottom: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.navy }}>{reg.reg}</div>
                    <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 3, background: reg.status === 'Active' ? '#065f46' : '#92400e', color: '#fff' }}>{reg.status}</span>
                  </div>
                  <div style={{ fontSize: 11, color: T.textSec }}>{reg.scope}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 9 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy }}>Rating Agency Climate Criteria</h3>
              {[
                { agency: "Moody's", approach: 'CIS score (1–5 scale) embedded in credit opinion; physical, transition, liability risk modules', premium: '0–3 notch impact', coverage: '~5,000 corporate issuers' },
                { agency: "S&P Global", approach: 'ESG Evaluation (1–100) + issuer-level climate credit factors in sector methodology', premium: '0–2 notch impact', coverage: '~1,500 structured products' },
                { agency: "Fitch", approach: 'ESG Relevance Scores (1–5) in all rating action commentaries', premium: '0–2 notch impact', coverage: 'Corporates + sovereigns' },
                { agency: 'DBRS Morningstar', approach: 'Pillar-level climate exposure scoring overlaid on traditional credit factors', premium: '0–1 notch impact', coverage: 'Focus on EU ABS' },
              ].map((ra, i) => (
                <div key={i} style={{ padding: '12px', background: T.surfaceH, borderRadius: 6, marginBottom: 10 }}>
                  <div style={{ fontWeight: 700, color: T.navy, marginBottom: 6 }}>{ra.agency}</div>
                  <div style={{ fontSize: 12, color: T.text, marginBottom: 4 }}>{ra.approach}</div>
                  <div style={{ fontSize: 11, color: T.textMut }}>Premium: <span style={{ color: T.amber }}>{ra.premium}</span> · {ra.coverage}</div>
                </div>
              ))}
            </div>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy }}>Climate Credit Spread — Benchmarks</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={ratingGrid}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="rating" tick={{ fontSize: 10, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'bps', angle: -90, position: 'insideLeft', fontSize: 11, fill: T.textSec }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="baseSpr" name="Base Spread" fill={T.navy} />
                  <Bar dataKey="climateAdj" name="Climate Add-on" fill={T.red} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
