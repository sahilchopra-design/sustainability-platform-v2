import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

const sr = (seed) => { let x = Math.sin(seed + 1) * 10000; return x - Math.floor(x); };
const T = { bg: '#0f1117', surface: '#1a1d27', surfaceH: '#22263a', border: '#2a2f45', borderL: '#1e2235', navy: '#1e3a5f', gold: '#d4a843', sage: '#2d6a4f', teal: '#0d4f5c', text: '#e8e0d0', textSec: '#a89880', textMut: '#6b6050', red: '#c0392b', green: '#27ae60', amber: '#e67e22', font: "'DM Sans', sans-serif", mono: "'JetBrains Mono', monospace" };

const CCS_TECHNOLOGIES = [
  { id: 'post_combustion', name: 'Post-Combustion Capture', capexMtCO2: 85, opexMtCO2: 32, captureRate: 90, energyPenalty: 22, maturity: 'Commercial', feedstock: 'Any flue gas', applications: 'Coal/gas power, cement, steel' },
  { id: 'pre_combustion', name: 'Pre-Combustion (IGCC)', capexMtCO2: 92, opexMtCO2: 28, captureRate: 85, energyPenalty: 18, maturity: 'Demo', feedstock: 'Syngas', applications: 'IGCC power plants, H2 production' },
  { id: 'oxy_fuel', name: 'Oxy-fuel Combustion', capexMtCO2: 78, opexMtCO2: 24, captureRate: 95, energyPenalty: 16, maturity: 'Pilot', feedstock: 'Any solid/gas', applications: 'Industrial boilers, cement' },
  { id: 'chemical_looping', name: 'Chemical Looping', capexMtCO2: 65, opexMtCO2: 20, captureRate: 97, energyPenalty: 12, maturity: 'R&D/Pilot', feedstock: 'Natural gas/coal', applications: 'Future power + industry' },
];

const BECCS_PROJECTS = [
  { name: 'Drax BECCS (UK)', country: 'UK', capacityMtyr: 8.0, statusPct: 45, capexBn: 2.8, power: 660, feedstock: 'Wood pellets (SBP)', ccsType: 'Post-combustion', support: 'CfD + CCS business model', irr: 9.4, co2Price: 45, energyRev: 85, firstRevYear: 2030 },
  { name: 'Stockholm Exergi (Sweden)', country: 'Sweden', capacityMtyr: 0.8, statusPct: 75, capexBn: 0.55, power: 130, feedstock: 'Biomass waste', ccsType: 'Post-combustion', support: 'Swedish carbon credit + CfD', irr: 8.1, co2Price: 38, energyRev: 72, firstRevYear: 2026 },
  { name: 'Sleipner BECCS (Norway)', country: 'Norway', capacityMtyr: 1.5, statusPct: 85, capexBn: 0.9, power: 180, feedstock: 'Biomethane + waste', ccsType: 'Pre-combustion', support: 'Norwegian Govt CCS fund', irr: 7.8, co2Price: 55, energyRev: 90, firstRevYear: 2027 },
  { name: 'Maasvlakte BECCS (NL)', country: 'Netherlands', capacityMtyr: 2.2, statusPct: 38, capexBn: 1.4, power: 250, feedstock: 'Wood chips + residue', ccsType: 'Oxy-fuel', support: 'SDE++ + ETS free allocation', irr: 8.8, co2Price: 42, energyRev: 78, firstRevYear: 2029 },
  { name: 'Archer Daniels BECCS (US)', country: 'USA', capacityMtyr: 1.1, statusPct: 80, capexBn: 0.65, power: 0, feedstock: 'Corn ethanol fermentation', ccsType: 'Point source', support: 'IRA 45Q ($85/t)', irr: 12.4, co2Price: 85, energyRev: 42, firstRevYear: 2025 },
  { name: 'Boundary Dam BECCS (CA)', country: 'Canada', capacityMtyr: 0.15, statusPct: 95, capexBn: 1.4, power: 115, feedstock: 'Coal (retrofit test)', ccsType: 'Post-combustion', support: 'CER (NRCan)', irr: 5.2, co2Price: 65, energyRev: 68, firstRevYear: 2015 },
];

const REVENUE_STREAMS = [
  { stream: 'Power / Energy Sales', range: '$40–90/MWh', certainty: 'High', contractType: 'CfD / PPA / merchant', driver: 'Grid electricity price + green premium' },
  { stream: 'Heat (if CHP)', range: '$25–55/MWh_th', certainty: 'High', contractType: 'District heat contract', driver: 'Gas price substitute' },
  { stream: 'Carbon Removal Credits (CDR)', range: '$50–200/tCO₂', certainty: 'Medium-High', contractType: 'Pre-purchase / frontier credit', driver: 'Corporate net-zero demand; Frontier/MCII' },
  { stream: '45Q Tax Credit (US)', range: '$85/tCO₂ (geologic)', certainty: 'High (IRA)', contractType: 'Federal tax credit, 12yr', driver: 'IRA Section 45Q (inflation-adjusted)' },
  { stream: 'EU ETS Allowances', range: '€60–100/tCO₂', certainty: 'Medium', contractType: 'Spot / forward ETS', driver: 'EU ETS Phase 4 free allocation + sale' },
  { stream: 'Green Gas / Biomethane', range: '€80–150/MWh', certainty: 'High', contractType: 'Grid injection premium', driver: 'EU biomethane obligation; RED III' },
  { stream: 'Article 6.4 ITMOs', range: '$15–45/tCO₂', certainty: 'Low-Medium', contractType: 'ITMO purchase agreement', driver: 'Paris Agreement Art 6.4 registry (post-2024)' },
];

const FINANCING_STRUCTURES = [
  { type: 'Government Grant + Debt', equity: 20, seniorDebt: 55, grant: 25, dscr: 1.35, rating: 'BBB', example: 'Drax (UK CCS Industrial Decarbonisation Scheme)' },
  { type: 'Project Finance (Limited Recourse)', equity: 30, seniorDebt: 70, grant: 0, dscr: 1.45, rating: 'BB+/BBB-', example: 'Typical greenfield with offtake' },
  { type: 'IRA Tax Equity (US)', equity: 45, seniorDebt: 40, grant: 15, dscr: 1.55, rating: 'N/A (tax equity)', example: 'US BECCS with 45Q credit syndication' },
  { type: 'DFI + Commercial Co-Lending', equity: 25, seniorDebt: 45, grant: 30, dscr: 1.25, rating: 'Investment Grade via guarantee', example: 'Emerging market BECCS (IFC/ADB)' },
  { type: 'Green Bond Issuance', equity: 30, seniorDebt: 70, grant: 0, dscr: 1.50, rating: 'BBB (green bond premium)', example: 'Stockholm Exergi green bond 2023' },
];

const POLICY_ROADMAP = [
  { year: 2025, event: 'IRA 45Q fully operational; EU ETS tightening Phase 4; UK CCS business model finalised' },
  { year: 2026, event: 'Stockholm Exergi first BECCS tonne stored; EU Carbon Removal Certification Framework operational' },
  { year: 2027, event: 'EU CRCF removes CDR credits for CDR market; BECCS eligible; first UK CfD-BECCS contracts' },
  { year: 2028, event: 'EU ETS free allocations phase-out for industry sectors begins; price signal strengthens' },
  { year: 2030, event: 'BECCS target: 0.5 GtCO₂/yr (IEA NZE); EU benchmark ~400 MtCO₂ stored total' },
  { year: 2035, event: 'BECCS becomes material CDR pathway (1-2 GtCO₂/yr); commercial DACS begins scale' },
  { year: 2050, event: 'IEA NZE BECCS target: 3.8 GtCO₂/yr; deep coupling with hydrogen and advanced biofuels' },
];

const TABS = ['Overview', 'Project Finance Engine', 'Dual Revenue Stack', 'CCS Technology',
  'Deal Library', 'Carbon Pricing', 'Financing Structures', 'Risk Matrix',
  'Policy Roadmap', 'FI Opportunity'];

function npv(cashflows, r) {
  return cashflows.reduce((s, c, t) => s + c / Math.pow(1 + r, t), 0);
}

function irr(cashflows, guess = 0.1) {
  let r = guess;
  for (let i = 0; i < 200; i++) {
    const n = cashflows.reduce((s, c, t) => s + c / Math.pow(1 + r, t), 0);
    const d = cashflows.reduce((s, c, t) => s - t * c / Math.pow(1 + r, t + 1), 0);
    if (Math.abs(d) < 1e-10) break;
    const nr = r - n / d;
    if (Math.abs(nr - r) < 1e-8) { r = nr; break; }
    r = nr;
  }
  return r;
}

function calcBeccs({ powerMw, cf, capexBn, ccsCapexMtCO2, captureRatePct, energyPenaltyPct, energyRevMwh, co2PriceT, opexMyr, lifetime, wacc }) {
  const netPowerMw = powerMw * (1 - energyPenaltyPct / 100);
  const annMwh = netPowerMw * (cf / 100) * 8760;
  const biomassCo2tMwh = 0.85;
  const annCaptureMt = annMwh * biomassCo2tMwh * (captureRatePct / 100) / 1e6;
  const energyRevMyr = annMwh * energyRevMwh / 1e6;
  const cdRevMyr = annCaptureMt * co2PriceT;
  const totalRevMyr = energyRevMyr + cdRevMyr;
  const totalCapexM = capexBn * 1e3 + annCaptureMt * ccsCapexMtCO2;
  const w = wacc / 100;
  const annuity = w / (1 - Math.pow(1 + w, -lifetime));
  const capexAnnM = totalCapexM * annuity;
  const cfs = [-totalCapexM, ...Array.from({ length: lifetime }, () => totalRevMyr - opexMyr - capexAnnM * 0)];
  const projectIrr = irr([-totalCapexM, ...Array.from({ length: lifetime }, () => totalRevMyr - opexMyr)]);
  const dscr = (totalRevMyr - opexMyr) / (capexAnnM * 0.7);
  return { netPowerMw: netPowerMw.toFixed(0), annCaptureMt: annCaptureMt.toFixed(2), energyRevMyr: energyRevMyr.toFixed(1), cdRevMyr: cdRevMyr.toFixed(1), totalRevMyr: totalRevMyr.toFixed(1), projectIrr: (projectIrr * 100).toFixed(1), dscr: dscr.toFixed(2), totalCapexM: totalCapexM.toFixed(0) };
}

export default function BeccsProjectFinancePage() {
  const [activeTab, setActiveTab] = useState(0);
  const [powerMw, setPowerMw] = useState(500);
  const [cf, setCf] = useState(85);
  const [capexBn, setCapexBn] = useState(2.5);
  const [captureRate, setCaptureRate] = useState(90);
  const [energyPenalty, setEnergyPenalty] = useState(20);
  const [energyRev, setEnergyRev] = useState(80);
  const [co2Price, setCo2Price] = useState(65);
  const [opexMyr, setOpexMyr] = useState(45);
  const [lifetime, setLifetime] = useState(25);
  const [wacc, setWacc] = useState(8.0);
  const [selectedCcs, setSelectedCcs] = useState('post_combustion');

  const ccs = useMemo(() => CCS_TECHNOLOGIES.find(c => c.id === selectedCcs) || CCS_TECHNOLOGIES[0], [selectedCcs]);

  const result = useMemo(() => calcBeccs({ powerMw, cf, capexBn, ccsCapexMtCO2: ccs.capexMtCO2, captureRatePct: captureRate, energyPenaltyPct: energyPenalty, energyRevMwh: energyRev, co2PriceT: co2Price, opexMyr, lifetime, wacc }), [powerMw, cf, capexBn, ccs, captureRate, energyPenalty, energyRev, co2Price, opexMyr, lifetime, wacc]);

  const revStack = useMemo(() => [
    { name: 'Energy Revenue', value: parseFloat(result.energyRevMyr), fill: T.navy },
    { name: 'CDR Credit Revenue', value: parseFloat(result.cdRevMyr), fill: T.green },
  ], [result, T]);

  const co2Sensitivity = useMemo(() => [20, 40, 60, 85, 100, 130, 160, 200].map(price => {
    const r = calcBeccs({ powerMw, cf, capexBn, ccsCapexMtCO2: ccs.capexMtCO2, captureRatePct: captureRate, energyPenaltyPct: energyPenalty, energyRevMwh: energyRev, co2PriceT: price, opexMyr, lifetime, wacc });
    return { price, irr: parseFloat(r.projectIrr) };
  }), [powerMw, cf, capexBn, ccs, captureRate, energyPenalty, energyRev, opexMyr, lifetime, wacc]);

  const projectChart = useMemo(() => BECCS_PROJECTS.map(p => ({
    name: p.name.split(' ')[0] + ' ' + p.name.split(' ')[1],
    capacity: p.capacityMtyr, capex: p.capexBn, irr: p.irr,
  })), []);

  const s = { padding: '24px', fontFamily: T.font, color: T.text, background: T.bg, minHeight: '100vh' };
  const card = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '20px', marginBottom: 16 };
  const kpi = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px', textAlign: 'center' };
  const tab = (i) => ({ padding: '8px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontFamily: T.font, background: activeTab === i ? T.gold : T.surface, color: activeTab === i ? T.navy : T.text, fontWeight: activeTab === i ? 700 : 400 });
  const sel = { background: T.bg, border: `1px solid ${T.border}`, borderRadius: 4, padding: '6px 10px', color: T.text, fontSize: 13, fontFamily: T.mono, width: '100%', cursor: 'pointer' };

  return (
    <div style={s}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 28 }}>🏭</span>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.navy }}>BECCS Project Finance Intelligence Suite</h1>
            <p style={{ margin: 0, fontSize: 13, color: T.textSec }}>EP-DX2 · Dual Revenue Stack · CCS Cost Engine · 45Q / EU ETS / CDR Credits · Newton-Raphson IRR · Deal Library</p>
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
              { label: 'BECCS Capacity Installed (2024)', value: '~5 MtCO₂/yr', sub: 'Mostly US ethanol + UK pilot' },
              { label: 'IEA NZE BECCS Target 2030', value: '~500 MtCO₂/yr', sub: '100× scale-up required' },
              { label: 'CDR Credit Price (Frontier 2024)', value: '$150–600/t', sub: 'Stripe/Alphabet/McKinsey offtake' },
              { label: 'IRA 45Q Credit (Geologic)', value: '$85/tCO₂', sub: 'Inflation-adjusted, 12yr window' },
            ].map((k, i) => <div key={i} style={kpi}><div style={{ fontSize: 11, color: T.textMut, marginBottom: 6 }}>{k.label}</div><div style={{ fontSize: 18, fontWeight: 700, color: T.navy }}>{k.value}</div><div style={{ fontSize: 11, color: T.textSec }}>{k.sub}</div></div>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy }}>BECCS Deal Pipeline by Capacity</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={projectChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} angle={-20} textAnchor="end" height={50} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'MtCO₂/yr', angle: -90, position: 'insideLeft', fontSize: 10, fill: T.textSec }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'IRR (%)', angle: 90, position: 'insideRight', fontSize: 10, fill: T.textSec }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="left" dataKey="capacity" name="CO₂ Capacity (MtCO₂/yr)" fill={T.sage} radius={[3,3,0,0]} />
                  <Line yAxisId="right" type="monotone" dataKey="irr" name="Project IRR (%)" stroke={T.gold} strokeWidth={2} dot={{ r: 4, fill: T.gold }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy }}>Revenue Stream Landscape</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {REVENUE_STREAMS.map((rs, i) => (
                  <div key={i} style={{ padding: '8px 12px', background: T.surfaceH, borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: T.navy }}>{rs.stream}</div>
                      <div style={{ fontSize: 11, color: T.textSec }}>{rs.contractType}</div>
                    </div>
                    <div style={{ textAlign: 'right', minWidth: 100 }}>
                      <div style={{ fontSize: 12, fontFamily: T.mono, color: T.green }}>{rs.range}</div>
                      <div style={{ fontSize: 10, color: rs.certainty.includes('High') ? T.green : rs.certainty.includes('Medium') ? T.amber : T.red }}>{rs.certainty}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 1 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20 }}>
            <div>
              <div style={card}>
                <h3 style={{ margin: '0 0 16px', fontSize: 14, color: T.navy }}>Project Parameters</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                  <div><label style={{ fontSize: 12, color: T.textSec }}>CCS Technology</label><select value={selectedCcs} onChange={e => setSelectedCcs(e.target.value)} style={sel}>{CCS_TECHNOLOGIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                  <div><label style={{ fontSize: 12, color: T.textSec }}>Gross Power (MW): {powerMw}</label><input type="range" min={50} max={2000} step={50} value={powerMw} onChange={e => setPowerMw(+e.target.value)} style={{ width: '100%' }} /></div>
                  <div><label style={{ fontSize: 12, color: T.textSec }}>Capacity Factor (%): {cf}</label><input type="range" min={60} max={95} step={1} value={cf} onChange={e => setCf(+e.target.value)} style={{ width: '100%' }} /></div>
                  <div><label style={{ fontSize: 12, color: T.textSec }}>Total Capex ($Bn): {capexBn}</label><input type="range" min={0.2} max={8} step={0.1} value={capexBn} onChange={e => setCapexBn(+e.target.value)} style={{ width: '100%' }} /></div>
                  <div><label style={{ fontSize: 12, color: T.textSec }}>Capture Rate (%): {captureRate}</label><input type="range" min={60} max={99} step={1} value={captureRate} onChange={e => setCaptureRate(+e.target.value)} style={{ width: '100%' }} /></div>
                  <div><label style={{ fontSize: 12, color: T.textSec }}>Energy Penalty (%): {energyPenalty}</label><input type="range" min={8} max={35} step={1} value={energyPenalty} onChange={e => setEnergyPenalty(+e.target.value)} style={{ width: '100%' }} /></div>
                  <div><label style={{ fontSize: 12, color: T.textSec }}>Energy Rev ($/MWh): {energyRev}</label><input type="range" min={30} max={180} step={5} value={energyRev} onChange={e => setEnergyRev(+e.target.value)} style={{ width: '100%' }} /></div>
                  <div><label style={{ fontSize: 12, color: T.textSec }}>CO₂ / CDR Price ($/t): {co2Price}</label><input type="range" min={0} max={250} step={5} value={co2Price} onChange={e => setCo2Price(+e.target.value)} style={{ width: '100%' }} /></div>
                  <div><label style={{ fontSize: 12, color: T.textSec }}>O&M ($M/yr): {opexMyr}</label><input type="range" min={10} max={200} step={5} value={opexMyr} onChange={e => setOpexMyr(+e.target.value)} style={{ width: '100%' }} /></div>
                  <div><label style={{ fontSize: 12, color: T.textSec }}>WACC (%): {wacc}</label><input type="range" min={4} max={14} step={0.5} value={wacc} onChange={e => setWacc(+e.target.value)} style={{ width: '100%' }} /></div>
                </div>
              </div>
            </div>
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
                {[
                  { label: 'Net Power Output (MW)', value: result.netPowerMw },
                  { label: 'CO₂ Captured (MtCO₂/yr)', value: result.annCaptureMt },
                  { label: 'Energy Revenue ($M/yr)', value: `$${result.energyRevMyr}M` },
                  { label: 'CDR Credit Revenue ($M/yr)', value: `$${result.cdRevMyr}M` },
                  { label: 'Total Revenue ($M/yr)', value: `$${result.totalRevMyr}M` },
                  { label: 'Project IRR (%)', value: `${result.projectIrr}%` },
                ].map((k, i) => <div key={i} style={kpi}><div style={{ fontSize: 11, color: T.textMut, marginBottom: 4 }}>{k.label}</div><div style={{ fontSize: 18, fontWeight: 700, color: i >= 3 ? T.green : T.navy }}>{k.value}</div></div>)}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={card}>
                  <h3 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy }}>Dual Revenue Stack ($M/yr)</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={[{ name: 'Revenue', energy: parseFloat(result.energyRevMyr), cdr: parseFloat(result.cdRevMyr) }]}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                      <XAxis dataKey="name" hide />
                      <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                      <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 12 }} formatter={(v) => [`$${v}M`, '']} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="energy" name="Energy Revenue" fill={T.navy} stackId="a" />
                      <Bar dataKey="cdr" name="CDR Credit Revenue" fill={T.green} stackId="a" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={card}>
                  <h3 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy }}>IRR vs CO₂ Price</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={co2Sensitivity}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                      <XAxis dataKey="price" label={{ value: '$/tCO₂', position: 'insideBottom', offset: -2, fontSize: 11, fill: T.textSec }} tick={{ fontSize: 11, fill: T.textSec }} />
                      <YAxis tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'IRR %', angle: -90, position: 'insideLeft', fontSize: 11, fill: T.textSec }} />
                      <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 12 }} formatter={(v) => [`${v}%`, 'Project IRR']} />
                      <ReferenceLine y={8} stroke={T.amber} strokeDasharray="4 4" label={{ value: 'Hurdle 8%', fontSize: 10, fill: T.amber }} />
                      <ReferenceLine x={co2Price} stroke={T.gold} strokeDasharray="4 4" />
                      <Line type="monotone" dataKey="irr" stroke={T.green} strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 2 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy }}>Revenue Streams Detail</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr>{['Revenue Stream','Range','Certainty','Contract Type'].map(h => <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: T.textMut, borderBottom: `1px solid ${T.border}` }}>{h}</th>)}</tr></thead>
                <tbody>{REVENUE_STREAMS.map((rs, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? T.surfaceH : 'transparent' }}>
                    <td style={{ padding: '7px 8px', fontWeight: 600, color: T.navy, fontSize: 11 }}>{rs.stream}</td>
                    <td style={{ padding: '7px 8px', fontFamily: T.mono, color: T.green }}>{rs.range}</td>
                    <td style={{ padding: '7px 8px', color: rs.certainty.includes('High') ? T.green : rs.certainty.includes('Medium') ? T.amber : T.red, fontSize: 11 }}>{rs.certainty}</td>
                    <td style={{ padding: '7px 8px', color: T.textSec, fontSize: 11 }}>{rs.contractType}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy }}>CDR vs ETS vs 45Q Price Paths ($/ tCO₂)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={[2024,2026,2028,2030,2032,2035,2040,2050].map((yr, i) => ({
                  year: yr,
                  cdCredit: Math.round(150 + i * 30 + sr(i*7)*40),
                  euEts: Math.round(68 + i * 12),
                  usIra: Math.round(85 + i * 4),
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 12 }} formatter={(v) => [`$${v}/t`, '']} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="cdCredit" name="CDR Credit (Frontier)" stroke={T.green} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="euEts" name="EU ETS" stroke={T.navy} strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="usIra" name="US IRA 45Q" stroke={T.amber} strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 3 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
            {CCS_TECHNOLOGIES.map((c, i) => (
              <div key={i} style={{ ...card, borderTop: `3px solid ${[T.navy, T.teal, T.sage, T.amber][i]}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ fontWeight: 700, color: T.navy, fontSize: 14 }}>{c.name}</div>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: c.maturity === 'Commercial' ? '#065f46' : c.maturity === 'Demo' ? '#1e3a5f' : '#92400e', color: '#fff' }}>{c.maturity}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, marginBottom: 8 }}>
                  {[['Capex ($/tCO₂/yr)', `$${c.capexMtCO2}M`], ['Opex ($/tCO₂)', `$${c.opexMtCO2}`], ['Capture Rate', `${c.captureRate}%`], ['Energy Penalty', `${c.energyPenalty}%`]].map(([k, v]) => (
                    <div key={k} style={{ padding: '8px', background: T.surfaceH, borderRadius: 4, textAlign: 'center' }}>
                      <div style={{ fontSize: 10, color: T.textMut }}>{k}</div>
                      <div style={{ fontSize: 13, fontFamily: T.mono, fontWeight: 700, color: T.navy }}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: T.textSec }}><span style={{ color: T.teal }}>Feedstock: </span>{c.feedstock}</div>
                <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}><span style={{ color: T.teal }}>Applications: </span>{c.applications}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 4 && (
        <div>
          <div style={card}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, color: T.navy }}>Global BECCS Deal Library</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr>{['Project','Country','Cap (Mt/yr)','Power (MW)','Capex ($Bn)','IRR (%)','CO₂ Price','Support','Status','FRY'].map(h => <th key={h} style={{ padding: '6px 8px', textAlign: h === 'Project' ? 'left' : 'right', color: T.textMut, borderBottom: `1px solid ${T.border}` }}>{h}</th>)}</tr></thead>
              <tbody>{BECCS_PROJECTS.map((p, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? T.surfaceH : 'transparent' }}>
                  <td style={{ padding: '7px 8px', fontWeight: 600, color: T.navy, fontSize: 11 }}>{p.name}</td>
                  <td style={{ padding: '7px 8px', textAlign: 'right' }}>{p.country}</td>
                  <td style={{ padding: '7px 8px', textAlign: 'right', fontFamily: T.mono }}>{p.capacityMtyr}</td>
                  <td style={{ padding: '7px 8px', textAlign: 'right', fontFamily: T.mono }}>{p.power || '—'}</td>
                  <td style={{ padding: '7px 8px', textAlign: 'right', fontFamily: T.mono }}>${p.capexBn}B</td>
                  <td style={{ padding: '7px 8px', textAlign: 'right', fontFamily: T.mono, color: p.irr > 10 ? T.green : p.irr > 7 ? T.amber : T.red }}>{p.irr}%</td>
                  <td style={{ padding: '7px 8px', textAlign: 'right', fontFamily: T.mono }}>${p.co2Price}</td>
                  <td style={{ padding: '7px 8px', textAlign: 'right', color: T.textSec, fontSize: 11 }}>{p.support}</td>
                  <td style={{ padding: '7px 8px', textAlign: 'right' }}>
                    <div style={{ height: 8, background: T.borderL, borderRadius: 4, width: 60 }}>
                      <div style={{ height: '100%', width: `${p.statusPct}%`, background: p.statusPct > 70 ? T.green : p.statusPct > 40 ? T.amber : T.sage, borderRadius: 4 }} />
                    </div>
                    <div style={{ fontSize: 10, color: T.textMut }}>{p.statusPct}%</div>
                  </td>
                  <td style={{ padding: '7px 8px', textAlign: 'right', fontFamily: T.mono }}>{p.firstRevYear}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 5 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy }}>Break-Even CO₂ Price by Capex</h3>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={[0.5, 1, 1.5, 2, 2.5, 3, 4, 5].map(capx => ({
                  capex: capx, bePrice: Math.round(40 + capx * 18 + (energyPenalty - 20) * 1.5),
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="capex" label={{ value: 'Capex ($Bn)', position: 'insideBottom', offset: -2, fontSize: 11, fill: T.textSec }} tick={{ fontSize: 11, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'Break-even CO₂ ($/t)', angle: -90, position: 'insideLeft', fontSize: 10, fill: T.textSec }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 12 }} formatter={(v) => [`$${v}/tCO₂`, 'Break-even']} />
                  <ReferenceLine y={85} stroke={T.amber} strokeDasharray="4 4" label={{ value: '45Q $85/t', fontSize: 10, fill: T.amber }} />
                  <ReferenceLine y={65} stroke={T.sage} strokeDasharray="4 4" label={{ value: 'EU ETS €65', fontSize: 10, fill: T.sage }} />
                  <ReferenceLine x={capexBn} stroke={T.gold} strokeDasharray="4 4" />
                  <Line type="monotone" dataKey="bePrice" stroke={T.red} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy }}>Carbon Policy Landscape</h3>
              {[
                { policy: 'IRA Section 45Q (US)', price: '$85/t (geologic)', period: '12yr; inflation-adj; 2023+', status: 'Active' },
                { policy: 'EU ETS Phase 4', price: '€60–100/t', period: 'MSRR tightening; 2021–2030', status: 'Active' },
                { policy: 'EU CRCF (Carbon Removal Cert)', price: 'Market (BECCS eligible)', period: '2026 expected operational', status: 'Pending' },
                { policy: 'UK CCS Business Model', price: 'Strike price-based CfD', period: 'Track-1/Track-2 clusters', status: 'Active' },
                { policy: 'Norwegian CCS Fund', price: 'Up to 80% cost sharing', period: 'Longship / Northern Lights', status: 'Active' },
                { policy: 'Japan SAF+BECCS target', price: 'Fiscal support; FiT eligible', period: 'GX roadmap 2030–2050', status: 'Active' },
              ].map((p, i) => (
                <div key={i} style={{ padding: '8px 12px', background: i % 2 === 0 ? T.surfaceH : 'transparent', borderRadius: 4, marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.navy }}>{p.policy}</div>
                    <div style={{ fontSize: 11, color: T.textSec }}>{p.period}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, fontFamily: T.mono, color: T.green }}>{p.price}</div>
                    <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 3, background: p.status === 'Active' ? '#065f46' : '#92400e', color: '#fff' }}>{p.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 6 && (
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {FINANCING_STRUCTURES.map((fs, i) => (
              <div key={i} style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, color: T.navy, fontSize: 14 }}>{fs.type}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ fontSize: 11, fontFamily: T.mono, background: T.surfaceH, padding: '3px 8px', borderRadius: 4, color: T.teal }}>DSCR: {fs.dscr}×</span>
                    <span style={{ fontSize: 11, fontFamily: T.mono, background: T.surfaceH, padding: '3px 8px', borderRadius: 4, color: T.gold }}>{fs.rating}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', height: 24, borderRadius: 4, overflow: 'hidden', marginBottom: 10 }}>
                  {[{ pct: fs.equity, color: T.amber, label: `Equity ${fs.equity}%` }, { pct: fs.seniorDebt, color: T.navy, label: `Senior ${fs.seniorDebt}%` }, { pct: fs.grant, color: T.green, label: `Grant ${fs.grant}%` }].filter(t => t.pct > 0).map((t, j) => (
                    <div key={j} style={{ width: `${t.pct}%`, background: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 10, color: '#fff', fontWeight: 600, padding: '0 2px' }}>{t.pct >= 15 ? t.label : ''}</span>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 12, color: T.textSec }}><span style={{ color: T.navy, fontWeight: 600 }}>Example: </span>{fs.example}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 7 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
            {[
              { category: 'Feedstock Risk', level: 'High', items: ['Biomass supply chain disruption', 'Competing demand (food/feed/material)', 'Certification loss (SBP/FSC) invalidating RED III eligibility', 'Feedstock price volatility (commodity market)'] },
              { category: 'CCS Operational Risk', level: 'Medium-High', items: ['CO₂ capture efficiency below design', 'Leakage from storage reservoir', 'Transport pipeline integrity', 'Energy penalty higher than modelled'] },
              { category: 'Revenue Risk', level: 'Medium', items: ['CDR credit market illiquidity / price crash', 'ETS policy reversal or allowance oversupply', 'Energy price collapse (merchant exposure)', '45Q credit political risk (US IRA rollback)'] },
              { category: 'Regulatory / Permitting Risk', level: 'High', items: ['BECCS permitting delays (CCS storage sites)', 'EUDR deforestation regulation compliance', 'RED III sustainability criteria tightening', 'Community opposition to CO₂ storage wells'] },
              { category: 'Technology Risk', level: 'Medium', items: ['Amine solvent degradation in post-combustion', 'Scale-up challenges for novel capture tech', 'CO₂ compression / transport cost overruns', 'Integration complexity of bioenergy + CCS'] },
              { category: 'Macro/Political Risk', level: 'Medium', items: ['US IRA rollback under policy change', 'EU ETS price crash on allowance oversupply', 'Public perception (land use concerns, NIMBY)', 'Carbon market integrity questions (additionality)'] },
            ].map((r, i) => (
              <div key={i} style={{ ...card, borderLeft: `3px solid ${r.level === 'High' ? T.red : r.level === 'Medium-High' ? T.amber : T.sage}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontWeight: 600, color: T.navy, fontSize: 13 }}>{r.category}</div>
                  <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 3, background: r.level === 'High' ? '#7f1d1d' : r.level === 'Medium-High' ? '#92400e' : '#065f46', color: '#fff' }}>{r.level}</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: 16 }}>
                  {r.items.map((item, j) => <li key={j} style={{ fontSize: 12, color: T.textSec, marginBottom: 3 }}>{item}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 8 && (
        <div>
          <div style={card}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, color: T.navy }}>BECCS Policy & Commercial Roadmap</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {POLICY_ROADMAP.map((pr, i) => (
                <div key={i} style={{ display: 'flex', gap: 16, padding: '14px 0', borderBottom: i < POLICY_ROADMAP.length - 1 ? `1px solid ${T.borderL}` : 'none' }}>
                  <div style={{ minWidth: 50, fontFamily: T.mono, fontWeight: 700, color: T.gold, fontSize: 14 }}>{pr.year}</div>
                  <div style={{ fontSize: 13, color: T.text }}>{pr.event}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 9 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
            {[
              { label: 'BECCS Investment Need to 2030', value: '$80–120B', sub: 'IEA NZE track (ann. avg)' },
              { label: 'Current BECCS Investment', value: '$3–5B/yr', sub: '2023 actual (IEA/Bloomberg)' },
              { label: 'Funding Gap', value: '>$75B/yr', sub: 'Investment urgency: scale NOW' },
              { label: 'CDR Market Size 2030', value: '$10–50B', sub: 'Frontier + voluntary + compliance' },
            ].map((k, i) => <div key={i} style={kpi}><div style={{ fontSize: 11, color: T.textMut, marginBottom: 4 }}>{k.label}</div><div style={{ fontSize: 16, fontWeight: 700, color: T.navy }}>{k.value}</div><div style={{ fontSize: 11, color: T.textSec }}>{k.sub}</div></div>)}
          </div>
          <div style={card}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy }}>FI Opportunity Landscape</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
              {[
                { role: 'Project Finance Arranger', revenue: '50–100bps arrangement + 0.5–1.5% upfront', opportunity: 'Large-cap BECCS transactions ($500M–$5Bn); CCS cluster deals' },
                { role: 'Green Bond / BECCS Bond Issuance', revenue: '35bps + annual reporting', opportunity: 'Climate bond-certified BECCS debt; Article 6.4 pre-purchase backed' },
                { role: 'Carbon Credit Pre-Purchase Facility', revenue: 'CDR offtake at $80–150/t; resell at $150–400/t', opportunity: 'Structured CDR credit warehousing and forward sales to corporates' },
                { role: '45Q Tax Equity Syndication', revenue: '2–3% fee on tax equity volume', opportunity: 'US IRA BECCS projects needing sophisticated tax equity investors' },
                { role: 'Infrastructure Debt Provision', revenue: 'SOFR + 250–350bps', opportunity: 'BECCS project debt tranche (BBB- rated with CfD/offtake)' },
                { role: 'ESG Advisory / BECCS Readiness', revenue: '$500K–$2M advisory fee', opportunity: 'Corporate clients needing BECCS-backed carbon removals for net-zero' },
              ].map((r, i) => (
                <div key={i} style={{ padding: '12px 14px', background: T.surfaceH, borderRadius: 6 }}>
                  <div style={{ fontWeight: 600, color: T.navy, fontSize: 13, marginBottom: 4 }}>{r.role}</div>
                  <div style={{ fontSize: 12, color: T.green, marginBottom: 4 }}>{r.revenue}</div>
                  <div style={{ fontSize: 11, color: T.textSec }}>{r.opportunity}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
