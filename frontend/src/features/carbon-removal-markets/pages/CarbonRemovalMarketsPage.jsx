import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, ZAxis } from 'recharts';

const sr = (seed) => { let x = Math.sin(seed + 1) * 10000; return x - Math.floor(x); };

const T = {
  bg: '#0f1117', surface: '#1a1d27', surfaceH: '#22263a', border: '#2a2f45', borderL: '#1e2235',
  navy: '#1e3a5f', navyL: '#2a4f7c', gold: '#d4a843', goldL: '#e8c068', sage: '#2d6a4f',
  sageL: '#3a8a65', teal: '#0d4f5c', text: '#e8e0d0', textSec: '#a89880', textMut: '#6b6050',
  red: '#c0392b', green: '#27ae60', amber: '#e67e22', font: "'DM Sans', sans-serif",
  mono: "'JetBrains Mono', monospace"
};

// CDR technology archetypes
const CDR_TECHNOLOGIES = [
  { id: 'dac', label: 'Direct Air Capture (DAC)', icon: '🏭', trl: 8,
    costNow: 400, cost2030: 200, cost2050: 80, scaleNow: 0.01, scale2030: 5, scale2050: 1000,
    permanence: 'Geological (>10,000yr)', energyMwhT: 5.5, waterM3T: 0.8, landM2T: 0.5,
    companies: 'Climeworks, Carbon Engineering, Heirloom, Verdox',
    frontier: true, corsia: false, vcm: false, govContracts: true,
    desc: 'Mechanical systems that separate CO2 from ambient air, compress & store geologically.' },
  { id: 'beccs', label: 'BECCS (Bioenergy + CCS)', icon: '🌿', trl: 7,
    costNow: 90, cost2030: 65, cost2050: 45, scaleNow: 3, scale2030: 80, scale2050: 5000,
    permanence: 'Geological (>10,000yr)', energyMwhT: -0.2, waterM3T: 3.5, landM2T: 12.0,
    companies: 'Drax, Stockholm Exergi, Ørsted, ADM',
    frontier: false, corsia: true, vcm: true, govContracts: true,
    desc: 'Combustion of biomass with CO2 capture & storage. Net-negative if land use accounted.' },
  { id: 'biochar', label: 'Biochar Soil Enhancement', icon: '⚫', trl: 9,
    costNow: 120, cost2030: 80, cost2050: 50, scaleNow: 0.15, scale2030: 15, scale2050: 500,
    permanence: 'Soil 100–1,000yr', energyMwhT: 0.3, waterM3T: 0.1, landM2T: 1.2,
    companies: 'Carbonfuture, Flux Carbon, Pacific Biochar, ECHO2',
    frontier: true, corsia: false, vcm: true, govContracts: false,
    desc: 'Pyrolysis of biomass into stable carbon form applied to agricultural soils.' },
  { id: 'ew', label: 'Enhanced Weathering', icon: '🪨', trl: 6,
    costNow: 80, cost2030: 50, cost2050: 30, scaleNow: 0.05, scale2030: 10, scale2050: 1000,
    permanence: 'Mineral 100,000yr+', energyMwhT: 0.8, waterM3T: 0.2, landM2T: 0.8,
    companies: 'Lithos Carbon, UNDO, Eion, Planetary Technologies',
    frontier: true, corsia: false, vcm: true, govContracts: false,
    desc: 'Crushed silicate rock applied to croplands to alkalinize soils and absorb CO2.' },
  { id: 'ocean', label: 'Ocean Alkalinity Enhancement', icon: '🌊', trl: 4,
    costNow: 95, cost2030: 60, cost2050: 35, scaleNow: 0.001, scale2030: 2, scale2050: 3000,
    permanence: 'Ocean 1,000yr+', energyMwhT: 1.2, waterM3T: 0, landM2T: 0,
    companies: 'Planetary Technologies, Ebb Carbon, Equatic, Heimdal',
    frontier: true, corsia: false, vcm: false, govContracts: false,
    desc: 'Increases ocean alkalinity to absorb CO2; scales without land constraint.' },
  { id: 'soc', label: 'Soil Carbon Enhancement', icon: '🌱', trl: 8,
    costNow: 30, cost2030: 22, cost2050: 15, scaleNow: 0.8, scale2030: 50, scale2050: 1500,
    permanence: 'Soil 50–200yr', energyMwhT: 0.1, waterM3T: 0.05, landM2T: 4.0,
    companies: 'Indigo Ag, Soil Capital, CarbonCure, Nutrien Ag',
    frontier: false, corsia: false, vcm: true, govContracts: false,
    desc: 'Regenerative agriculture practices that build soil organic carbon stocks.' },
  { id: 'mineralization', label: 'CO2 Mineralization', icon: '💎', trl: 7,
    costNow: 55, cost2030: 38, cost2050: 22, scaleNow: 0.3, scale2030: 25, scale2050: 800,
    permanence: 'Mineral permanent', energyMwhT: 0.4, waterM3T: 0.3, landM2T: 0.3,
    companies: 'CarbonCure, Carbon Upcycling, 44.01, Blue Planet',
    frontier: false, corsia: false, vcm: true, govContracts: false,
    desc: 'CO2 injected into basalt or concrete materials for permanent mineral storage.' },
];

// Frontier Climate procurement data
const FRONTIER_BUYERS = [
  { buyer: 'Stripe', commitMusd: 1000, horizon: '2022–2030', tech: 'DAC + advanced', priceFloor: 150, note: 'Advance market commitment' },
  { buyer: 'Alphabet (Google)', commitMusd: 925, horizon: '2023–2032', tech: 'DAC + ocean', priceFloor: 100, note: 'Carbon removal portfolio' },
  { buyer: 'Meta', commitMusd: 730, horizon: '2023–2030', tech: 'Varied CDR', priceFloor: 80, note: 'Scope 1–3 net-zero' },
  { buyer: 'Shopify', commitMusd: 500, horizon: '2020–2030', tech: 'Frontier mix', priceFloor: 100, note: 'Sustain fund' },
  { buyer: 'McKinsey', commitMusd: 350, horizon: '2021–2030', tech: 'DAC + biochar', priceFloor: 75, note: 'Catalyst initiative' },
  { buyer: 'JPMorgan Chase', commitMusd: 200, horizon: '2023–2030', tech: 'BECCS + CDR', priceFloor: 50, note: 'Carbon removal fund' },
  { buyer: 'Microsoft', commitMusd: 200, horizon: '2023–2030', tech: 'DAC + BECCS', priceFloor: 60, note: 'Carbon negative by 2030' },
  { buyer: 'H&M Group', commitMusd: 100, horizon: '2023–2028', tech: 'Biochar + EW', priceFloor: 50, note: 'Fashion sector pilot' },
];

// CDR registry/standard landscape
const CDR_STANDARDS = [
  { name: 'Puro.earth', scope: 'Biochar, wood burial, concrete', qual: 'Rigorous MRV', priceRange: '$80–180/t', volume2023: 0.35, growth: '+65%' },
  { name: 'Carbonfuture', scope: 'Biochar specifically', qual: 'IoT monitoring', priceRange: '$110–200/t', volume2023: 0.12, growth: '+120%' },
  { name: 'Isometric', scope: 'All engineered CDR', qual: 'Science-first review', priceRange: '$100–500/t', volume2023: 0.08, growth: '+300%' },
  { name: 'CarbonPlan', scope: 'Research/methodology', qual: 'Transparency ratings', priceRange: 'N/A (research)', volume2023: 0, growth: 'N/A' },
  { name: 'Frontier (AMC)', scope: 'Novel CDR advance purchase', qual: 'Pre-purchase contracts', priceRange: '$150–600+/t', volume2023: 0.05, growth: '+400%' },
  { name: 'Microsoft CDR', scope: 'Bilateral contracts', qual: 'Internal procurement', priceRange: '$55–600/t', volume2023: 0.20, growth: '+180%' },
  { name: 'Gold Standard CDR', scope: 'Enhanced weathering', qual: 'Emerging methodology', priceRange: '$60–120/t', volume2023: 0.04, growth: '+200%' },
];

// --- Finance engine ---
function calcCdrFinance({ capexMusd, opexMusdYr, capacityMtYr, co2Price, lifetime, wacc, subsidyPct, energyCostMwhUsd, energyMwhT }) {
  const totalCapex = capexMusd * 1e6;
  const discFactor = wacc / 100;

  const annEnergyCost = capacityMtYr * 1e6 * Math.max(0, energyMwhT) * energyCostMwhUsd;
  const annOpex = opexMusdYr * 1e6 + annEnergyCost;
  const annRevenue = capacityMtYr * 1e6 * co2Price;
  const annSubsidy = totalCapex * (subsidyPct / 100);
  const annEbitda = annRevenue + annSubsidy - annOpex;

  let npv = -totalCapex;
  for (let y = 1; y <= lifetime; y++) npv += annEbitda / Math.pow(1 + discFactor, y);

  const cashflows = [-totalCapex, ...Array.from({ length: lifetime }, () => annEbitda)];
  let irr = 0.10;
  for (let i = 0; i < 200; i++) {
    let f = 0, df = 0;
    cashflows.forEach((cf, t) => {
      f += cf / Math.pow(1 + irr, t);
      if (t > 0) df -= t * cf / Math.pow(1 + irr, t + 1);
    });
    if (Math.abs(df) < 1e-12) break;
    const step = f / df;
    irr -= step;
    if (Math.abs(step) < 1e-8) break;
  }

  const lcdr = totalCapex > 0
    ? (totalCapex * (discFactor / (1 - Math.pow(1 + discFactor, -lifetime))) + annOpex) / Math.max(1e-6, capacityMtYr * 1e6)
    : 0;

  return {
    annRevenue: annRevenue / 1e6,
    annEbitda: annEbitda / 1e6,
    npvM: npv / 1e6,
    irr: irr * 100,
    lcdr,
    annEnergyCostM: annEnergyCost / 1e6,
    breakEvenPrice: lcdr,
  };
}

export default function CarbonRemovalMarketsPage() {
  const [activeTab, setActiveTab] = useState(0);

  // Finance engine state
  const [selTech, setSelTech] = useState('dac');
  const [capacityMtYr, setCapacityMtYr] = useState(0.1);
  const [co2Price, setCo2Price] = useState(250);
  const [capexMusd, setCapexMusd] = useState(200);
  const [opexMusdYr, setOpexMusdYr] = useState(8);
  const [lifetime, setLifetime] = useState(20);
  const [wacc, setWacc] = useState(10);
  const [subsidyPct, setSubsidyPct] = useState(30);
  const [energyCostMwh, setEnergyCostMwh] = useState(60);

  const tech = CDR_TECHNOLOGIES.find(t => t.id === selTech) || CDR_TECHNOLOGIES[0];

  const finResult = useMemo(() => calcCdrFinance({
    capexMusd, opexMusdYr, capacityMtYr, co2Price, lifetime, wacc, subsidyPct,
    energyCostMwhUsd: energyCostMwh, energyMwhT: tech.energyMwhT,
  }), [capexMusd, opexMusdYr, capacityMtYr, co2Price, lifetime, wacc, subsidyPct, energyCostMwh, tech]);

  // Cost curve data (CDR technologies ordered by cost)
  const costCurveData = useMemo(() => [...CDR_TECHNOLOGIES]
    .sort((a, b) => a.costNow - b.costNow)
    .map(t => ({
      tech: t.label.split(' (')[0].split(' ').slice(0, 3).join(' '),
      costNow: t.costNow, cost2030: t.cost2030, cost2050: t.cost2050,
      scale2030: t.scale2030,
    })), []);

  // Scale-up trajectory
  const scaleData = useMemo(() => [2024, 2026, 2028, 2030, 2032, 2035, 2040, 2050].map((yr, i) => ({
    yr: `${yr}`,
    dac: +(sr(i * 7) * 3 + CDR_TECHNOLOGIES[0].scaleNow * Math.pow(3.5, i * 0.7)).toFixed(2),
    beccs: +(CDR_TECHNOLOGIES[1].scaleNow * Math.pow(2.8, i * 0.6)).toFixed(1),
    biochar: +(CDR_TECHNOLOGIES[2].scaleNow * Math.pow(2.5, i * 0.65)).toFixed(2),
    ew: +(CDR_TECHNOLOGIES[3].scaleNow * Math.pow(3.0, i * 0.7)).toFixed(3),
    total: 0,
  })).map(d => ({ ...d, total: +(d.dac + d.beccs + d.biochar + d.ew).toFixed(2) })), []);

  // Price sensitivity
  const priceSensData = useMemo(() => [50, 80, 100, 150, 200, 250, 300, 400, 500, 600].map(p => {
    const r = calcCdrFinance({ capexMusd, opexMusdYr, capacityMtYr, co2Price: p, lifetime, wacc, subsidyPct, energyCostMwhUsd: energyCostMwh, energyMwhT: tech.energyMwhT });
    return { price: p, npv: +r.npvM.toFixed(1), irr: +r.irr.toFixed(1), lcdr: +r.lcdr.toFixed(0) };
  }), [capexMusd, opexMusdYr, capacityMtYr, lifetime, wacc, subsidyPct, energyCostMwh, tech]);

  // Frontier buyer chart
  const frontierData = useMemo(() => FRONTIER_BUYERS.map(b => ({ buyer: b.buyer, commitMusd: b.commitMusd, priceFloor: b.priceFloor })), []);

  const tabs = [
    'Overview', 'CDR Finance Engine', 'Technology Cost Curves', 'Frontier Market',
    'Scale-Up Trajectory', 'Price Sensitivity', 'Registry Landscape', 'FI Products', 'Policy & Incentives', 'Portfolio Design'
  ];

  const fmt = (v, d = 1) => v == null ? '—' : isFinite(v) ? Number(v).toFixed(d) : '—';
  const fmtM = (v) => `$${fmt(v)}M`;

  const kpi = (label, val, sub, col) => (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: '14px 18px', minWidth: 130 }}>
      <div style={{ color: T.textMut, fontSize: 11, fontFamily: T.mono, marginBottom: 4 }}>{label}</div>
      <div style={{ color: col || T.gold, fontSize: 22, fontWeight: 700, fontFamily: T.mono }}>{val}</div>
      {sub && <div style={{ color: T.textSec, fontSize: 11, marginTop: 3 }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ background: T.bg, minHeight: '100vh', color: T.text, fontFamily: T.font, padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 24, borderBottom: `1px solid ${T.border}`, paddingBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <span style={{ background: T.navy, color: '#fff', borderRadius: 4, padding: '2px 10px', fontSize: 11, fontFamily: T.mono }}>EP-DX5</span>
          <span style={{ color: T.textMut, fontSize: 12, fontFamily: T.mono }}>CARBON DIOXIDE REMOVAL MARKETS INTELLIGENCE</span>
        </div>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: T.text }}>Carbon Removal Markets</h1>
        <p style={{ margin: '6px 0 0', color: T.textSec, fontSize: 14 }}>
          DAC · BECCS · Biochar · Enhanced Weathering · Ocean CDR — Cost curves, Frontier market, FI structuring, 45Q/UK CBAM incentives
        </p>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 24, flexWrap: 'wrap' }}>
        {tabs.map((t, i) => (
          <button key={i} onClick={() => setActiveTab(i)}
            style={{ padding: '7px 14px', fontSize: 12, fontFamily: T.mono, cursor: 'pointer', borderRadius: 4,
              background: activeTab === i ? T.navy : T.surface,
              color: activeTab === i ? '#fff' : T.textSec,
              border: `1px solid ${activeTab === i ? T.navy : T.border}` }}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab 0: Overview */}
      {activeTab === 0 && (
        <div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
            {kpi('CDR MARKET 2024', '$1.6B', 'Voluntary + compliance', T.gold)}
            {kpi('FRONTIER AMC', '$5.5B', 'Committed advance purchases', T.green)}
            {kpi('DAC COST (NOW)', '$400/t', 'Falling to $80 by 2050', T.amber)}
            {kpi('BECCS COST', '$90/t', 'LCDR commercial scale', T.gold)}
            {kpi('45Q CREDIT (US)', '$180/t', 'IRA CDR geological storage', T.sageL)}
            {kpi('UK CBAM 2030', '~£80/t', 'Emerging CDR support', T.green)}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div style={{ background: T.surface, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 14, color: T.gold }}>CDR Technology Landscape</h3>
              {CDR_TECHNOLOGIES.map(t => (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '9px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{t.icon} {t.label}</div>
                    <div style={{ color: T.textMut, fontSize: 11, marginTop: 2 }}>TRL {t.trl} · {t.permanence.substring(0, 25)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: T.gold, fontFamily: T.mono, fontSize: 13 }}>${t.costNow}/t now</div>
                    <div style={{ color: T.green, fontFamily: T.mono, fontSize: 11, marginTop: 2 }}>${t.cost2050}/t 2050E</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: T.surface, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 14, color: T.gold }}>CDR Cost Curve — Current vs 2030E vs 2050E</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={costCurveData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="tech" stroke={T.textMut} tick={{ fontSize: 9, fill: T.textMut }} />
                  <YAxis stroke={T.textMut} tick={{ fontSize: 11, fill: T.textMut }} label={{ value: '$/tCO2', angle: -90, position: 'insideLeft', fill: T.textMut, fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="costNow" name="Cost Now" fill={T.red} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="cost2030" name="Cost 2030E" fill={T.amber} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="cost2050" name="Cost 2050E" fill={T.green} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {[
              { label: 'Scale Required (IPCC 1.5°C)', val: '6–10 Gt/yr by 2050', sub: 'Carbon removal needed', col: T.amber },
              { label: 'Current Global CDR', val: '~0.002 Gt/yr', sub: 'Engineered CDR only (2024)', col: T.red },
              { label: 'Scale-Up Factor Needed', val: '3,000–5,000×', sub: '26-year doubling every 4yrs', col: T.gold },
            ].map((m, i) => (
              <div key={i} style={{ background: T.surface, borderRadius: 8, padding: 18, border: `1px solid ${T.border}` }}>
                <div style={{ color: T.textMut, fontSize: 11, marginBottom: 4 }}>{m.label}</div>
                <div style={{ color: m.col, fontFamily: T.mono, fontSize: 18, fontWeight: 700 }}>{m.val}</div>
                <div style={{ color: T.textSec, fontSize: 11, marginTop: 4 }}>{m.sub}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 1: CDR Finance Engine */}
      {activeTab === 1 && (
        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 20 }}>
          <div style={{ background: T.surface, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 18px', fontSize: 14, color: T.gold }}>CDR Project Finance Engine</h3>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', color: T.textSec, fontSize: 12, marginBottom: 6 }}>CDR Technology</label>
              <select value={selTech} onChange={e => setSelTech(e.target.value)}
                style={{ width: '100%', background: T.surfaceH, border: `1px solid ${T.border}`, color: T.text, padding: '8px 10px', borderRadius: 4, fontSize: 13 }}>
                {CDR_TECHNOLOGIES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
              </select>
            </div>

            {[
              { label: `Capacity (Mt CO2/yr): ${capacityMtYr}`, val: capacityMtYr, set: setCapacityMtYr, min: 0.01, max: 5, step: 0.01 },
              { label: `CO2 Removal Price ($/t): $${co2Price}`, val: co2Price, set: setCo2Price, min: 30, max: 800, step: 10 },
              { label: `CapEx ($M): $${capexMusd}M`, val: capexMusd, set: setCapexMusd, min: 10, max: 2000, step: 10 },
              { label: `OpEx ($M/yr): $${opexMusdYr}M`, val: opexMusdYr, set: setOpexMusdYr, min: 0.5, max: 100, step: 0.5 },
              { label: `Project Life (yrs): ${lifetime}`, val: lifetime, set: setLifetime, min: 10, max: 30, step: 5 },
              { label: `WACC: ${wacc}%`, val: wacc, set: setWacc, min: 6, max: 18, step: 0.5 },
              { label: `Subsidy/Grant (% CapEx): ${subsidyPct}%`, val: subsidyPct, set: setSubsidyPct, min: 0, max: 60, step: 5 },
              { label: `Electricity Cost ($/MWh): $${energyCostMwh}`, val: energyCostMwh, set: setEnergyCostMwh, min: 20, max: 120, step: 5 },
            ].map(({ label, val, set, min, max, step }) => (
              <div key={label} style={{ marginBottom: 12 }}>
                <div style={{ color: T.textSec, fontSize: 12, marginBottom: 5 }}>{label}</div>
                <input type="range" min={min} max={max} step={step} value={val} onChange={e => set(+e.target.value)}
                  style={{ width: '100%', accentColor: T.navy }} />
              </div>
            ))}

            <div style={{ background: T.surfaceH, borderRadius: 6, padding: 10, marginTop: 6 }}>
              <div style={{ fontSize: 11, color: T.textMut }}>Energy: <span style={{ color: T.amber }}>{tech.energyMwhT} MWh/t</span> · Land: {tech.landM2T} m²/t</div>
              <div style={{ fontSize: 11, color: T.textMut, marginTop: 3 }}>45Q eligible: <span style={{ color: tech.govContracts ? T.green : T.textMut }}>{tech.govContracts ? 'Yes' : 'No'}</span></div>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
              {kpi('ANN REVENUE', fmtM(finResult.annRevenue), `${fmt(capacityMtYr, 3)} Mt × $${co2Price}/t`, T.gold)}
              {kpi('ANN ENERGY COST', fmtM(finResult.annEnergyCostM), `${tech.energyMwhT} MWh/t × $${energyCostMwh}`, T.amber)}
              {kpi('ANN EBITDA', fmtM(finResult.annEbitda), `incl. ${subsidyPct}% capex subsidy`, finResult.annEbitda >= 0 ? T.green : T.red)}
              {kpi('PROJECT NPV', fmtM(finResult.npvM), `${wacc}% WACC, ${lifetime}yr life`, finResult.npvM >= 0 ? T.green : T.red)}
              {kpi('PROJECT IRR', `${fmt(finResult.irr)}%`, `vs ${wacc}% hurdle`, finResult.irr >= wacc ? T.green : T.amber)}
              {kpi('LCDR', `$${fmt(finResult.lcdr, 0)}/t`, 'Levelized cost of CDR', finResult.lcdr <= co2Price ? T.green : T.red)}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ background: T.surface, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
                <h3 style={{ margin: '0 0 14px', fontSize: 13, color: T.gold }}>Cost Waterfall ($/tCO2)</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={[
                    { item: 'CapEx Ann.', cost: +(capexMusd * 1e6 / lifetime / (capacityMtYr * 1e6)).toFixed(0) },
                    { item: 'OpEx', cost: +(opexMusdYr * 1e6 / (capacityMtYr * 1e6)).toFixed(0) },
                    { item: 'Energy', cost: +(Math.max(0, tech.energyMwhT) * energyCostMwh).toFixed(0) },
                    { item: 'LCDR Total', cost: +finResult.lcdr.toFixed(0) },
                    { item: 'Revenue Price', cost: co2Price },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="item" stroke={T.textMut} tick={{ fontSize: 10, fill: T.textMut }} />
                    <YAxis stroke={T.textMut} tick={{ fontSize: 11, fill: T.textMut }} />
                    <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, fontSize: 12 }} formatter={(v) => [`$${v}/t`, '']} />
                    <Bar dataKey="cost" fill={T.navy} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: T.surface, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
                <h3 style={{ margin: '0 0 14px', fontSize: 13, color: T.gold }}>Key Finance Metrics</h3>
                {[
                  { label: 'CapEx per t/yr capacity', val: `$${fmt(capexMusd / capacityMtYr, 0)}M/Mt` },
                  { label: 'OpEx per t captured', val: `$${fmt(opexMusdYr * 1e6 / (capacityMtYr * 1e6), 0)}/t` },
                  { label: 'Energy cost per t', val: `$${fmt(Math.max(0, tech.energyMwhT) * energyCostMwh, 0)}/t` },
                  { label: 'Grant subsidy value', val: fmtM(capexMusd * subsidyPct / 100) },
                  { label: 'Break-even CO2 price', val: `$${fmt(finResult.breakEvenPrice, 0)}/t` },
                  { label: 'Price to LCDR margin', val: `$${fmt(co2Price - finResult.lcdr, 0)}/t (${finResult.lcdr > 0 ? fmt((co2Price - finResult.lcdr) / finResult.lcdr * 100, 0) : '—'}%)` },
                ].map((row, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${T.borderL}` }}>
                    <span style={{ color: T.textSec, fontSize: 13 }}>{row.label}</span>
                    <span style={{ color: T.gold, fontFamily: T.mono, fontSize: 13 }}>{row.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Technology Cost Curves */}
      {activeTab === 2 && (
        <div>
          <div style={{ background: T.surface, borderRadius: 8, padding: 20, border: `1px solid ${T.border}`, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, color: T.gold }}>CDR Technology Deep Dive</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {CDR_TECHNOLOGIES.map(t => (
                <div key={t.id} style={{ background: T.surfaceH, borderRadius: 6, padding: 14, border: `1px solid ${T.borderL}` }}>
                  <div style={{ fontSize: 20, marginBottom: 6 }}>{t.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: 12, color: T.text, marginBottom: 4 }}>{t.label}</div>
                  <div style={{ fontSize: 11, color: T.textSec, marginBottom: 10, minHeight: 40 }}>{t.desc.substring(0, 70)}…</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 10, color: T.textMut }}>TRL</span>
                    <span style={{ fontSize: 11, color: T.gold, fontFamily: T.mono }}>{t.trl}/9</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 10, color: T.textMut }}>Cost Now</span>
                    <span style={{ fontSize: 11, color: T.red, fontFamily: T.mono }}>${t.costNow}/t</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 10, color: T.textMut }}>Cost 2050E</span>
                    <span style={{ fontSize: 11, color: T.green, fontFamily: T.mono }}>${t.cost2050}/t</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 10, color: T.textMut }}>Scale 2030E</span>
                    <span style={{ fontSize: 11, color: T.amber, fontFamily: T.mono }}>{t.scale2030} Mt/yr</span>
                  </div>
                  <div style={{ fontSize: 10, color: T.teal, marginTop: 6 }}>{t.companies.split(',')[0]}, …</div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                    {t.frontier && <span style={{ background: T.navy + '55', color: '#93c5fd', borderRadius: 3, padding: '1px 5px', fontSize: 9 }}>Frontier</span>}
                    {t.vcm && <span style={{ background: T.sage + '33', color: T.sageL, borderRadius: 3, padding: '1px 5px', fontSize: 9 }}>VCM</span>}
                    {t.govContracts && <span style={{ background: T.gold + '22', color: T.gold, borderRadius: 3, padding: '1px 5px', fontSize: 9 }}>45Q/Gov</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: T.surface, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, color: T.gold }}>Learning Rate Comparison — Cost Reduction to 2050</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={CDR_TECHNOLOGIES.map(t => ({
                tech: t.icon + ' ' + t.label.split(' (')[0].split(' ').slice(0, 2).join(' '),
                reduction: Math.round((1 - t.cost2050 / t.costNow) * 100),
                costNow: t.costNow, cost2050: t.cost2050,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="tech" stroke={T.textMut} tick={{ fontSize: 9, fill: T.textMut }} />
                <YAxis stroke={T.textMut} tick={{ fontSize: 11, fill: T.textMut }} label={{ value: '% Cost Reduction', angle: -90, position: 'insideLeft', fill: T.textMut, fontSize: 10 }} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, fontSize: 12 }} formatter={(v) => [`${v}%`, 'Cost reduction by 2050']} />
                <Bar dataKey="reduction" fill={T.sageL} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 3: Frontier Market */}
      {activeTab === 3 && (
        <div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
            {kpi('FRONTIER AMC TOTAL', '$5.5B', 'Advance market commitments', T.gold)}
            {kpi('BUYERS ACTIVE', '50+', 'Corporate & institutional', T.green)}
            {kpi('LARGEST COMMITMENT', '$1.0B', 'Stripe (2022–2030)', T.amber)}
            {kpi('MIN FRONTIER PRICE', '$75/t', 'McKinsey Catalyst floor', T.sageL)}
          </div>

          <div style={{ background: T.surface, borderRadius: 8, padding: 20, border: `1px solid ${T.border}`, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, color: T.gold }}>Frontier CDR Buyers — Advance Procurement Commitments</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {['Buyer', 'Commitment $M', 'Horizon', 'Tech Focus', 'Price Floor $/t', 'Note'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: T.textMut, fontSize: 11, fontFamily: T.mono }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FRONTIER_BUYERS.map((b, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.borderL}`, background: i % 2 === 0 ? 'transparent' : T.surfaceH }}>
                    <td style={{ padding: '9px 12px', fontWeight: 600 }}>{b.buyer}</td>
                    <td style={{ padding: '9px 12px', color: T.gold, fontFamily: T.mono }}>${b.commitMusd}M</td>
                    <td style={{ padding: '9px 12px', color: T.textSec }}>{b.horizon}</td>
                    <td style={{ padding: '9px 12px', color: T.textMut, fontSize: 12 }}>{b.tech}</td>
                    <td style={{ padding: '9px 12px', color: T.green, fontFamily: T.mono }}>${b.priceFloor}/t</td>
                    <td style={{ padding: '9px 12px', color: T.textSec, fontSize: 12 }}>{b.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ background: T.surface, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, color: T.gold }}>Commitment Volume by Buyer ($M)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={frontierData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" stroke={T.textMut} tick={{ fontSize: 10, fill: T.textMut }} />
                <YAxis type="category" dataKey="buyer" stroke={T.textMut} tick={{ fontSize: 10, fill: T.textMut }} width={110} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, fontSize: 12 }} formatter={(v) => [`$${v}M`, 'Commitment']} />
                <Bar dataKey="commitMusd" name="Commitment $M" fill={T.navy} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 4: Scale-Up Trajectory */}
      {activeTab === 4 && (
        <div>
          <div style={{ background: T.surface, borderRadius: 8, padding: 20, border: `1px solid ${T.border}`, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, color: T.gold }}>CDR Scale-Up Trajectory — Key Technologies (Mt CO2/yr)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={scaleData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="yr" stroke={T.textMut} tick={{ fontSize: 11, fill: T.textMut }} />
                <YAxis stroke={T.textMut} tick={{ fontSize: 11, fill: T.textMut }} label={{ value: 'Mt CO2/yr', angle: -90, position: 'insideLeft', fill: T.textMut, fontSize: 10 }} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="beccs" name="BECCS" stackId="a" stroke={T.sage} fill={T.sage} fillOpacity={0.7} />
                <Area type="monotone" dataKey="biochar" name="Biochar" stackId="a" stroke={T.amber} fill={T.amber} fillOpacity={0.6} />
                <Area type="monotone" dataKey="ew" name="Enh. Weathering" stackId="a" stroke={T.teal} fill={T.teal} fillOpacity={0.6} />
                <Area type="monotone" dataKey="dac" name="DAC" stackId="a" stroke={T.gold} fill={T.gold} fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 5: Price Sensitivity */}
      {activeTab === 5 && (
        <div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
            {kpi('LCDR (CURRENT)', `$${fmt(finResult.lcdr, 0)}/t`, tech.label.split(' (')[0], T.amber)}
            {kpi('PRICE INPUT', `$${co2Price}/t`, 'CDR sale price', T.gold)}
            {kpi('MARGIN', `$${fmt(co2Price - finResult.lcdr, 0)}/t`, finResult.lcdr > 0 ? `${fmt((co2Price - finResult.lcdr) / finResult.lcdr * 100, 0)}% margin` : '—', co2Price >= finResult.lcdr ? T.green : T.red)}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: T.surface, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 14, color: T.gold }}>NPV vs CO2 Removal Price</h3>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={priceSensData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="price" stroke={T.textMut} tick={{ fontSize: 11, fill: T.textMut }} label={{ value: '$/tCO2', position: 'insideBottom', offset: -5, fill: T.textMut, fontSize: 10 }} />
                  <YAxis stroke={T.textMut} tick={{ fontSize: 11, fill: T.textMut }} />
                  <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, fontSize: 12 }} formatter={(v) => [`$${v}M`, 'NPV']} />
                  <Line type="monotone" dataKey="npv" name="NPV $M" stroke={T.gold} strokeWidth={2} dot={{ fill: T.gold, r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.surface, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 14, color: T.gold }}>IRR vs CO2 Removal Price</h3>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={priceSensData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="price" stroke={T.textMut} tick={{ fontSize: 11, fill: T.textMut }} label={{ value: '$/tCO2', position: 'insideBottom', offset: -5, fill: T.textMut, fontSize: 10 }} />
                  <YAxis stroke={T.textMut} tick={{ fontSize: 11, fill: T.textMut }} />
                  <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, fontSize: 12 }} formatter={(v) => [`${v}%`, 'IRR']} />
                  <Line type="monotone" dataKey="irr" name="IRR %" stroke={T.green} strokeWidth={2} dot={{ fill: T.green, r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Registry Landscape */}
      {activeTab === 6 && (
        <div>
          <div style={{ background: T.surface, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, color: T.gold }}>CDR Registry & Standard Landscape</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {['Registry/Standard', 'CDR Scope', 'Quality Approach', 'Price Range', 'Vol 2023 Mt', 'Growth YoY'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: T.textMut, fontSize: 11, fontFamily: T.mono }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CDR_STANDARDS.map((s, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.borderL}`, background: i % 2 === 0 ? 'transparent' : T.surfaceH }}>
                    <td style={{ padding: '9px 12px', fontWeight: 600 }}>{s.name}</td>
                    <td style={{ padding: '9px 12px', color: T.textSec, fontSize: 12 }}>{s.scope}</td>
                    <td style={{ padding: '9px 12px', color: T.textMut, fontSize: 12 }}>{s.qual}</td>
                    <td style={{ padding: '9px 12px', color: T.gold, fontFamily: T.mono }}>{s.priceRange}</td>
                    <td style={{ padding: '9px 12px', fontFamily: T.mono }}>{s.volume2023 > 0 ? s.volume2023 : '—'}</td>
                    <td style={{ padding: '9px 12px', color: s.growth.startsWith('+') ? T.green : T.textMut, fontFamily: T.mono }}>{s.growth}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 7: FI Products */}
      {activeTab === 7 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {[
              { prod: 'CDR Forward Purchase Agreement', icon: '📝', returnTarget: 'Fixed $/t', minMusd: 1, tenor: '3–10yr',
                desc: 'FI acts as intermediary or anchor buyer in offtake contract. Structured as ERPA or forward. Revenue = spread between purchase and sale price.',
                risks: 'Delivery risk, project failure, technology risk', buyers: 'Corporations, airlines (CORSIA)' },
              { prod: 'CDR Project Debt (Project Finance)', icon: '💰', returnTarget: 'SOFR+250–450bps', minMusd: 25, tenor: '8–15yr',
                desc: 'Senior secured lending to DAC/BECCS plants with offtake agreement as collateral. 45Q tax credit can be monetized via transferability (IRA §45Q).',
                risks: 'Technology first-of-kind, capex overrun, offtake creditworthiness', buyers: 'Infrastructure banks, green bond issuers' },
              { prod: 'CDR Equity / VC Fund', icon: '📈', returnTarget: 'IRR 15–25%', minMusd: 10, tenor: '7–12yr',
                desc: 'Early-stage through growth equity in CDR companies (DAC, biochar, EW, ocean). Portfolio approach across TRL 5–9.',
                risks: 'Technology risk, regulatory uncertainty, cost reduction race', buyers: 'PE/VC funds, family offices' },
              { prod: 'Carbon Removal Bond (CRB)', icon: '🔖', returnTarget: 'Fixed coupon 4–6%', minMusd: 100, tenor: '5–15yr',
                desc: 'Labelled bond (ICMA GBP) with CDR as use of proceeds. Green premium (greenium) of 5–10bps. PCAF methodology for financed removal reporting.',
                risks: 'Greenwashing, delivery verification, standard evolution', buyers: 'ESG investors, insurance, pension' },
              { prod: 'Carbon Removal Securitization (ABS)', icon: '🏗️', returnTarget: 'SOFR+180–280bps', minMusd: 200, tenor: '10–20yr',
                desc: 'Pool of verified CDR offtake cash flows tranched AAA→equity. Requires diversified portfolio of verified CDR projects with strong MRV.',
                risks: 'Correlation risk, MRV complexity, tranche sizing', buyers: 'Insurers, pension, CLO investors' },
              { prod: 'CDR Purchase Agreement (PPA-style)', icon: '⚡', returnTarget: 'Pass-through $/t', minMusd: 5, tenor: '5–20yr',
                desc: 'Similar to renewable PPA: FI arranges long-term CDR offtake at fixed price per tonne, providing revenue certainty to developers.',
                risks: 'Reputational risk if CDR quality challenged, counterparty', buyers: 'Net-zero corporate offtakers' },
            ].map((p, i) => (
              <div key={i} style={{ background: T.surface, borderRadius: 8, padding: 18, border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{p.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 6 }}>{p.prod}</div>
                <div style={{ color: T.textSec, fontSize: 12, marginBottom: 12, lineHeight: 1.5 }}>{p.desc}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: T.textMut, fontSize: 11 }}>Return Target</span>
                  <span style={{ color: T.gold, fontFamily: T.mono, fontSize: 12 }}>{p.returnTarget}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: T.textMut, fontSize: 11 }}>Min Size</span>
                  <span style={{ color: T.textSec, fontFamily: T.mono, fontSize: 12 }}>${p.minMusd}M+</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ color: T.textMut, fontSize: 11 }}>Tenor</span>
                  <span style={{ color: T.textSec, fontFamily: T.mono, fontSize: 12 }}>{p.tenor}</span>
                </div>
                <div style={{ fontSize: 11, color: T.red, marginBottom: 4 }}>⚠ {p.risks}</div>
                <div style={{ fontSize: 11, color: T.teal }}>👥 {p.buyers}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 8: Policy & Incentives */}
      {activeTab === 8 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            {[
              { jurisdiction: '🇺🇸 United States (IRA)', incentives: [
                { name: '45Q Tax Credit', val: '$180/t', desc: 'Geological CDR (DAC + BECCS); transferable/direct-pay under IRA', status: 'Active' },
                { name: 'DOE CDR Prize', val: '$35M', desc: '4 phases from concept to pilot', status: 'Active' },
                { name: 'DOE Loan Programs', val: '$40B capacity', desc: 'ATVM + Title 17 for CDR infrastructure', status: 'Active' },
                { name: 'Regional CDR Hubs', val: '$3.5B', desc: '4 regional hubs funded by BIL/IIJA', status: 'In deployment' },
              ]},
              { jurisdiction: '🇬🇧 United Kingdom', incentives: [
                { name: 'CBAM (UK)', val: '~£80/t equiv.', desc: 'Carbon border adjustment generates CDR demand', status: '2026+' },
                { name: 'CCUS Business Models', val: '£20/t floor', desc: 'Government carbon contract for difference (CfD)', status: 'Active' },
                { name: 'GGR Certification', val: 'GBP-aligned', desc: 'UK DESNZ greenhouse gas removals standard', status: 'Consultation' },
                { name: 'Net Zero Innovation Portfolio', val: '£1B+', desc: 'BECCS + DAC R&D programmes', status: 'Active' },
              ]},
              { jurisdiction: '🇪🇺 European Union', incentives: [
                { name: 'CRCF (Carbon Removal)', val: 'Certification', desc: 'EU Carbon Removal Certification Framework — voluntary at first', status: '2026 target' },
                { name: 'ETS Innovation Fund', val: '€38B (2020–30)', desc: 'Available for first-of-kind CDR projects', status: 'Active' },
                { name: 'IPCC 2050 Target', val: '310 Mt/yr', desc: 'EU CDR requirement under Fit-for-55 pathways', status: 'Policy target' },
                { name: 'Nature Restoration Law', val: 'EU NRL', desc: 'Mandates 30% ecosystems restored — NbS CDR demand', status: 'Enacted 2024' },
              ]},
              { jurisdiction: '🌍 Multilateral', incentives: [
                { name: 'Article 6.4 ITMOs', val: 'Sovereign CDR', desc: 'UNFCCC CDR credits eligible for CORSIA', status: 'Operational 2024' },
                { name: 'CORSIA Phase 1', val: '2024–2026', desc: 'Aviation sector demand for CDR credits', status: 'Operational' },
                { name: 'GCF CDR Window', val: '$2B/yr', desc: 'Green Climate Fund: emerging market CDR finance', status: 'Pipeline' },
                { name: 'World Bank XPCDR', val: '$500M', desc: 'Pilot CDR purchases in developing economies', status: 'Active' },
              ]},
            ].map((j, ji) => (
              <div key={ji} style={{ background: T.surface, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
                <h3 style={{ margin: '0 0 14px', fontSize: 14, color: T.gold }}>{j.jurisdiction}</h3>
                {j.incentives.map((inc, ii) => (
                  <div key={ii} style={{ padding: '9px 0', borderBottom: `1px solid ${T.borderL}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{inc.name}</span>
                      <span style={{ color: T.gold, fontFamily: T.mono, fontSize: 12 }}>{inc.val}</span>
                    </div>
                    <div style={{ color: T.textSec, fontSize: 12 }}>{inc.desc}</div>
                    <span style={{ background: T.sage + '33', color: T.sageL, borderRadius: 3, padding: '1px 7px', fontSize: 10, marginTop: 4, display: 'inline-block' }}>{inc.status}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 9: Portfolio Design */}
      {activeTab === 9 && (
        <div>
          <div style={{ background: T.surface, borderRadius: 8, padding: 20, border: `1px solid ${T.border}`, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, color: T.gold }}>Illustrative FI CDR Portfolio — $500M Fund</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {['Strategy', 'CDR Tech', 'Alloc %', '$M', 'Capacity (Mt/yr)', 'Return Target', 'Structure', 'Risk'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: T.textMut, fontSize: 11, fontFamily: T.mono }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { strat: 'Senior Debt + 45Q', tech: 'DAC (US)', alloc: 30, m: 150, cap: 0.15, ret: 'SOFR+350bps', struct: 'Project Finance', risk: 'Medium' },
                  { strat: 'BECCS Equity + Green Bond', tech: 'BECCS (EU)', alloc: 25, m: 125, cap: 0.8, ret: 'IRR 11–14%', struct: 'Equity + Bond', risk: 'Medium' },
                  { strat: 'Biochar Forward Purchase', tech: 'Biochar', alloc: 15, m: 75, cap: 0.3, ret: '12–18% IRR', struct: 'Forward + Equity', risk: 'Low' },
                  { strat: 'EW Scale-up Equity', tech: 'Enh. Weathering', alloc: 15, m: 75, cap: 0.5, ret: 'IRR 15–22%', struct: 'Growth Equity', risk: 'High' },
                  { strat: 'Ocean CDR R&D Pilot', tech: 'Ocean Alkalinity', alloc: 8, m: 40, cap: 0.02, ret: 'Strategic', struct: 'Pilot Finance', risk: 'Very High' },
                  { strat: 'BECCS ABS (Senior)', tech: 'BECCS (UK)', alloc: 7, m: 35, cap: 0.25, ret: 'SOFR+220bps', struct: 'ABS AAA Tranche', risk: 'Low' },
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.borderL}`, background: i % 2 === 0 ? 'transparent' : T.surfaceH }}>
                    <td style={{ padding: '9px 12px', fontWeight: 600 }}>{row.strat}</td>
                    <td style={{ padding: '9px 12px', color: T.textSec }}>{row.tech}</td>
                    <td style={{ padding: '9px 12px' }}>
                      <div style={{ background: T.surfaceH, borderRadius: 3, height: 7, marginBottom: 2 }}>
                        <div style={{ background: T.navy, width: `${row.alloc * 3}%`, height: '100%', borderRadius: 3 }} />
                      </div>
                      <span style={{ color: T.textSec, fontSize: 11 }}>{row.alloc}%</span>
                    </td>
                    <td style={{ padding: '9px 12px', color: T.gold, fontFamily: T.mono }}>${row.m}M</td>
                    <td style={{ padding: '9px 12px', fontFamily: T.mono }}>{row.cap} Mt</td>
                    <td style={{ padding: '9px 12px', color: T.green, fontFamily: T.mono, fontSize: 12 }}>{row.ret}</td>
                    <td style={{ padding: '9px 12px', color: T.textMut, fontSize: 12 }}>{row.struct}</td>
                    <td style={{ padding: '9px 12px', color: row.risk === 'Very High' ? T.red : row.risk === 'High' ? T.amber : row.risk === 'Medium' ? T.gold : T.green, fontSize: 12 }}>{row.risk}</td>
                  </tr>
                ))}
                <tr style={{ background: T.surfaceH, fontWeight: 700 }}>
                  <td style={{ padding: '10px 12px' }}>TOTAL</td>
                  <td />
                  <td style={{ padding: '10px 12px', color: T.gold }}>100%</td>
                  <td style={{ padding: '10px 12px', color: T.gold, fontFamily: T.mono }}>$500M</td>
                  <td style={{ padding: '10px 12px', fontFamily: T.mono, color: T.green }}>2.02 Mt/yr</td>
                  <td style={{ padding: '10px 12px', color: T.green, fontFamily: T.mono }}>~12–16%</td>
                  <td colSpan={2} />
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
