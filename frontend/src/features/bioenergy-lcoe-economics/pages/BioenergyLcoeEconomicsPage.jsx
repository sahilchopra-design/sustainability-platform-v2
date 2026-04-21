import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

const sr = (seed) => { let x = Math.sin(seed + 1) * 10000; return x - Math.floor(x); };
const T = { bg: '#0f1117', surface: '#1a1d27', surfaceH: '#22263a', border: '#2a2f45', borderL: '#1e2235', navy: '#1e3a5f', gold: '#d4a843', sage: '#2d6a4f', teal: '#0d4f5c', text: '#e8e0d0', textSec: '#a89880', textMut: '#6b6050', red: '#c0392b', green: '#27ae60', amber: '#e67e22', font: "'DM Sans', sans-serif", mono: "'JetBrains Mono', monospace" };

const TECH_TYPES = [
  { id: 'dedicated_biomass', name: 'Dedicated Biomass Power', capexMwh: 3800, opexMwyr: 95, cf: 85, efficiency: 28, lifetime: 25, feedstockUsd: 42, heatRate: 12.2, co2Factor: 0.02, scope: 'Pellets/Chips' },
  { id: 'cofiring', name: 'Coal Co-firing (20% Biomass)', capexMwh: 480, opexMwyr: 62, cf: 72, efficiency: 38, lifetime: 20, feedstockUsd: 38, heatRate: 9.0, co2Factor: 0.12, scope: 'Co-firing upgrade' },
  { id: 'chp', name: 'Biomass CHP', capexMwh: 4200, opexMwyr: 105, cf: 82, efficiency: 82, lifetime: 25, feedstockUsd: 45, heatRate: 4.4, co2Factor: 0.02, scope: 'Cogen incl. heat' },
  { id: 'biogas_power', name: 'Biogas Power (AD)', capexMwh: 2800, opexMwyr: 110, cf: 90, efficiency: 40, lifetime: 20, feedstockUsd: 28, heatRate: 9.0, co2Factor: 0.03, scope: 'Organic waste/slurry' },
  { id: 'biomethane', name: 'Biomethane (Upgraded Biogas)', capexMwh: 1800, opexMwyr: 80, cf: 92, efficiency: 65, lifetime: 20, feedstockUsd: 30, heatRate: 5.5, co2Factor: 0.01, scope: 'Grid-injected RNG' },
  { id: 'advanced_biofuel', name: 'Advanced Biofuel (Cellulosic)', capexMwh: 5200, opexMwyr: 140, cf: 88, efficiency: 45, lifetime: 20, feedstockUsd: 85, heatRate: 8.0, co2Factor: 0.04, scope: 'Agricultural residue' },
  { id: 'saf', name: 'Sustainable Aviation Fuel (SAF)', capexMwh: 7800, opexMwyr: 180, cf: 90, efficiency: 55, lifetime: 20, feedstockUsd: 120, heatRate: 6.5, co2Factor: 0.06, scope: 'HEFA/AtJ/FT-SPK' },
];

const FEEDSTOCK_TYPES = [
  { name: 'Wood Pellets (Industrial)', source: 'Forestry residue', costUsd: 180, energyGjt: 17.5, landUseHaGJ: 0.012, waterM3GJ: 1.8, availability: 'Global', sustainCert: 'SBP/FSC', co2kgGJ: 2.1 },
  { name: 'Agricultural Residues', source: 'Wheat straw/corn stover', costUsd: 45, energyGjt: 14.8, landUseHaGJ: 0, waterM3GJ: 0.4, availability: 'Seasonal', sustainCert: 'RSB', co2kgGJ: 3.8 },
  { name: 'Energy Crops (Miscanthus)', source: 'Dedicated energy crops', costUsd: 72, energyGjt: 18.2, landUseHaGJ: 0.055, waterM3GJ: 2.2, availability: 'Seasonal', sustainCert: 'ISCC+', co2kgGJ: 1.2 },
  { name: 'Municipal Solid Waste', source: 'Landfill diversion', costUsd: -15, energyGjt: 9.5, landUseHaGJ: 0, waterM3GJ: 0.1, availability: 'Continuous', sustainCert: 'REDcert', co2kgGJ: 18.5 },
  { name: 'Organic Waste (AD)', source: 'Food/slurry/sewage', costUsd: -25, energyGjt: 6.5, landUseHaGJ: 0, waterM3GJ: 0, availability: 'Continuous', sustainCert: 'ISCC', co2kgGJ: 4.2 },
  { name: 'Sugarcane Bagasse', source: 'Sugar mill by-product', costUsd: 22, energyGjt: 13.2, landUseHaGJ: 0, waterM3GJ: 0.6, availability: 'Seasonal (Brazil)', sustainCert: 'Bonsucro', co2kgGJ: 2.8 },
  { name: 'Short Rotation Coppice', source: 'Willow/poplar', costUsd: 68, energyGjt: 16.8, landUseHaGJ: 0.048, waterM3GJ: 1.9, availability: 'EU/North Am', sustainCert: 'FSC/SFM', co2kgGJ: 1.5 },
];

const POLICY_SUPPORT = [
  { country: 'UK', mechanism: 'CfD + ROC', level: 'High', supportBps: 420, co2Price: '£60/t', renewTarget: '37% by 2030', comment: 'CfD Allocation Round 5 includes bioenergy' },
  { country: 'EU', mechanism: 'RED III + ETS', level: 'Medium-High', supportBps: 280, co2Price: '€65/t', renewTarget: '42.5% by 2030', comment: 'Cascade principle limits primary biomass; waste prioritized' },
  { country: 'USA', mechanism: 'IRA Section 45/45Q + RFS', level: 'Very High', supportBps: 650, co2Price: '$50/t (BID)', renewTarget: 'IRA 10yr credits', comment: '45 PTC extended; biomass with CCS gets 45Q ($85/t)' },
  { country: 'Japan', mechanism: 'FiT + Biofuel Mandate', level: 'High', supportBps: 480, co2Price: '¥0 (no price)', renewTarget: '46% by 2030', comment: 'FiT ¥24/kWh for biomass power' },
  { country: 'Brazil', mechanism: 'RenovaBio + RENOVAR', level: 'High', supportBps: 380, co2Price: 'R$50/t', renewTarget: '50%+ (incl. hydro)', comment: 'CBIO carbon credits; RenovaBio decarbonization mandate' },
  { country: 'Germany', mechanism: 'EEG + BHKW bonus', level: 'Medium', supportBps: 240, co2Price: '€65/t (ETS)', renewTarget: '80% power by 2030', comment: 'Biogas flex premium; CHP efficiency bonus; RED III compliance' },
];

const LCOE_COMPARISON = [
  { tech: 'Solar PV (utility)', lcoe: 38, range: [28, 52] },
  { tech: 'Onshore Wind', lcoe: 45, range: [35, 60] },
  { tech: 'Biomass CHP', lcoe: 112, range: [88, 145] },
  { tech: 'Dedicated Biomass', lcoe: 128, range: [98, 165] },
  { tech: 'Biogas Power', lcoe: 95, range: [78, 122] },
  { tech: 'Biomethane', lcoe: 82, range: [68, 105] },
  { tech: 'Advanced Biofuel', lcoe: 185, range: [145, 230] },
  { tech: 'SAF (HEFA)', lcoe: 265, range: [220, 320] },
  { tech: 'Natural Gas (CCGT)', lcoe: 68, range: [52, 88] },
];

const SUSTAINABILITY_CRITERIA = [
  { criterion: 'GHG Savings vs Fossil', threshold: '≥65% (RED III)', weight: 30, scope: 'Full LCA including land-use change' },
  { criterion: 'Land Use Sustainability', threshold: 'No deforestation post-2008', weight: 25, scope: 'Satellite monitoring; EUDR compliance' },
  { criterion: 'Water Stress Limits', threshold: 'WRI Water Risk < High', weight: 15, scope: 'Irrigation water per GJ' },
  { criterion: 'Biodiversity Safeguards', threshold: 'No primary forest, wetlands, peatlands', weight: 20, scope: 'Habitat loss exclusion zones' },
  { criterion: 'Food vs Fuel Conflict', threshold: 'Waste/residue preferred; no food crops', weight: 10, scope: 'Cascade use principle (EU)' },
];

const TABS = ['Overview', 'LCOE Engine', 'Feedstock Analytics', 'Technology Comparison',
  'Policy & Support', 'Sustainability Criteria', 'Supply Chain', 'Learning Curves',
  'Carbon Intensity', 'Investment Landscape'];

function calcBioenergyLcoe({ capexMwh, powerMw, cf, opexMwyr, feedstockUsd, heatRate, wacc, lifetime, efficiency }) {
  const annMwh = powerMw * (cf / 100) * 8760;
  const capexTotal = capexMwh * powerMw * 1000;
  const w = wacc / 100;
  const annuity = w / (1 - Math.pow(1 + w, -lifetime));
  const capexAnn = capexTotal * annuity;
  const opexAnn = opexMwyr * powerMw * 1000;
  const feedstockGjMwh = heatRate / (efficiency / 100);
  const feedstockAnn = annMwh * feedstockGjMwh * feedstockUsd / 1000;
  const lcoe = annMwh > 0 ? (capexAnn + opexAnn + feedstockAnn) / annMwh : 0;
  const feedstockShare = feedstockAnn / (capexAnn + opexAnn + feedstockAnn);
  return { lcoe: lcoe.toFixed(1), capexAnn: (capexAnn / 1e6).toFixed(2), opexAnn: (opexAnn / 1e6).toFixed(2), feedstockAnn: (feedstockAnn / 1e6).toFixed(2), feedstockShare: (feedstockShare * 100).toFixed(0), annMwh: (annMwh / 1000).toFixed(0) };
}

function irr(cashflows, guess = 0.1) {
  let r = guess;
  for (let i = 0; i < 200; i++) {
    const npv = cashflows.reduce((s, c, t) => s + c / Math.pow(1 + r, t), 0);
    const dnpv = cashflows.reduce((s, c, t) => s - t * c / Math.pow(1 + r, t + 1), 0);
    if (Math.abs(dnpv) < 1e-10) break;
    const nr = r - npv / dnpv;
    if (Math.abs(nr - r) < 1e-8) { r = nr; break; }
    r = nr;
  }
  return r;
}

export default function BioenergyLcoeEconomicsPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedTech, setSelectedTech] = useState('chp');
  const [powerMw, setPowerMw] = useState(50);
  const [wacc, setWacc] = useState(7.5);
  const [feedstockAdj, setFeedstockAdj] = useState(0);
  const [carbonPrice, setCarbonPrice] = useState(65);

  const tech = useMemo(() => TECH_TYPES.find(t => t.id === selectedTech) || TECH_TYPES[0], [selectedTech]);

  const lcoeResult = useMemo(() => calcBioenergyLcoe({
    capexMwh: tech.capexMwh, powerMw, cf: tech.cf, opexMwyr: tech.opexMwyr,
    feedstockUsd: tech.feedstockUsd + feedstockAdj, heatRate: tech.heatRate, wacc, lifetime: tech.lifetime, efficiency: tech.efficiency,
  }), [tech, powerMw, wacc, feedstockAdj]);

  const carbonCredits = useMemo(() => {
    const annMwh = parseFloat(lcoeResult.annMwh) * 1000;
    const fossilBaseline = 0.45;
    const bioEmissions = tech.co2Factor;
    const annCreds = annMwh * (fossilBaseline - bioEmissions) / 1000;
    const creditRevMyr = annCreds * carbonPrice / 1e6;
    const adjustedLcoe = parseFloat(lcoeResult.lcoe) - creditRevMyr * 1e6 / (annMwh || 1);
    return { annCreds: annCreds.toFixed(0), creditRevMyr: creditRevMyr.toFixed(2), adjustedLcoe: Math.max(0, adjustedLcoe).toFixed(1) };
  }, [lcoeResult, tech, carbonPrice]);

  const irrResult = useMemo(() => {
    const annMwh = powerMw * (tech.cf / 100) * 8760;
    const revenue = annMwh * parseFloat(lcoeResult.lcoe) / 1000 + parseFloat(carbonCredits.creditRevMyr) * 1e6;
    const opex = parseFloat(lcoeResult.opexAnn) * 1e6 + parseFloat(lcoeResult.feedstockAnn) * 1e6;
    const capexTotal = tech.capexMwh * powerMw * 1000;
    const cfs = [-capexTotal, ...Array.from({ length: tech.lifetime }, (_, i) => revenue - opex - (i === tech.lifetime - 1 ? 0 : 0))];
    return (irr(cfs) * 100).toFixed(1);
  }, [tech, powerMw, lcoeResult, carbonCredits]);

  const sensitivityData = useMemo(() => [
    { param: 'WACC -2%', lcoe: parseFloat(calcBioenergyLcoe({ ...tech, powerMw, wacc: wacc - 2, feedstockUsd: tech.feedstockUsd + feedstockAdj }).lcoe) },
    { param: 'WACC -1%', lcoe: parseFloat(calcBioenergyLcoe({ ...tech, powerMw, wacc: wacc - 1, feedstockUsd: tech.feedstockUsd + feedstockAdj }).lcoe) },
    { param: 'Base', lcoe: parseFloat(lcoeResult.lcoe) },
    { param: 'WACC +1%', lcoe: parseFloat(calcBioenergyLcoe({ ...tech, powerMw, wacc: wacc + 1, feedstockUsd: tech.feedstockUsd + feedstockAdj }).lcoe) },
    { param: 'Feedstock +20%', lcoe: parseFloat(calcBioenergyLcoe({ ...tech, powerMw, wacc, feedstockUsd: tech.feedstockUsd * 1.2 + feedstockAdj }).lcoe) },
    { param: 'Feedstock +40%', lcoe: parseFloat(calcBioenergyLcoe({ ...tech, powerMw, wacc, feedstockUsd: tech.feedstockUsd * 1.4 + feedstockAdj }).lcoe) },
    { param: 'CF -10%', lcoe: parseFloat(calcBioenergyLcoe({ ...tech, cf: tech.cf - 10, powerMw, wacc, feedstockUsd: tech.feedstockUsd + feedstockAdj }).lcoe) },
  ], [tech, powerMw, wacc, feedstockAdj, lcoeResult]);

  const learningCurve = useMemo(() => [2010, 2015, 2020, 2025, 2030, 2035, 2040].map((yr, i) => ({
    year: yr, biomass: Math.round(165 * Math.pow(0.97, i * 5)), biogas: Math.round(115 * Math.pow(0.96, i * 5)), saf: Math.round(450 * Math.pow(0.94, i * 5)),
  })), []);

  const carbonIntensityData = useMemo(() => TECH_TYPES.map(t => ({
    name: t.name.split(' ')[0] + ' ' + (t.name.split(' ')[1] || ''), intensity: Math.round(t.co2Factor * 1000), fossilSaving: Math.round((0.45 - t.co2Factor) * 100 / 0.45),
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
          <span style={{ fontSize: 28 }}>🌿</span>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.navy }}>Bioenergy LCOE Economics & Resource Analytics</h1>
            <p style={{ margin: 0, fontSize: 13, color: T.textSec }}>EP-DX1 · Biomass/Biogas/SAF LCOE Engine · Feedstock Analytics · Carbon Credits · Policy Support · Learning Curves</p>
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
              { label: 'Global Bioenergy Capacity 2024', value: '648 GW', sub: 'Power + Heat + Transport fuels' },
              { label: 'Bioenergy Investment 2023', value: '$128B', sub: '+8% vs 2022 (IRENA)' },
              { label: 'Avg Biomass LCOE (2024)', value: '$88/MWh', sub: 'vs $38/MWh solar PV' },
              { label: 'BECCS Technical Potential', value: '10 GtCO₂/yr', sub: 'IEA Net Zero 2050 scenario' },
            ].map((k, i) => <div key={i} style={kpi}><div style={{ fontSize: 11, color: T.textMut, marginBottom: 6 }}>{k.label}</div><div style={{ fontSize: 20, fontWeight: 700, color: T.navy }}>{k.value}</div><div style={{ fontSize: 11, color: T.textSec }}>{k.sub}</div></div>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={card}>
              <h3 style={{ margin: '0 0 16px', fontSize: 14, color: T.navy }}>LCOE by Technology ($/ MWh)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={LCOE_COMPARISON} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: T.textSec }} />
                  <YAxis dataKey="tech" type="category" tick={{ fontSize: 10, fill: T.textSec }} width={145} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 12 }} formatter={(v) => [`$${v}/MWh`, 'LCOE']} />
                  <Bar dataKey="lcoe" fill={T.sage} radius={[0,3,3,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <h3 style={{ margin: '0 0 16px', fontSize: 14, color: T.navy }}>Bioenergy Technology Landscape</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {TECH_TYPES.map((t, i) => (
                  <div key={i} style={{ padding: '8px 12px', background: T.surfaceH, borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: T.navy, fontSize: 12 }}>{t.name}</div>
                      <div style={{ fontSize: 11, color: T.textSec }}>{t.scope} · eff: {t.efficiency}%</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 12, fontFamily: T.mono, color: T.gold }}>${t.capexMwh}/kW</div>
                      <div style={{ fontSize: 11, color: T.textMut }}>{t.cf}% CF</div>
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
                <h3 style={{ margin: '0 0 16px', fontSize: 14, color: T.navy }}>LCOE Parameters</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div><label style={{ fontSize: 12, color: T.textSec }}>Technology</label><select value={selectedTech} onChange={e => setSelectedTech(e.target.value)} style={sel}>{TECH_TYPES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
                  <div><label style={{ fontSize: 12, color: T.textSec }}>Plant Size (MW): {powerMw}</label><input type="range" min={5} max={500} step={5} value={powerMw} onChange={e => setPowerMw(+e.target.value)} style={{ width: '100%' }} /></div>
                  <div><label style={{ fontSize: 12, color: T.textSec }}>WACC (%): {wacc}</label><input type="range" min={4} max={14} step={0.5} value={wacc} onChange={e => setWacc(+e.target.value)} style={{ width: '100%' }} /></div>
                  <div><label style={{ fontSize: 12, color: T.textSec }}>Feedstock Adj ($/t): {feedstockAdj > 0 ? '+' : ''}{feedstockAdj}</label><input type="range" min={-30} max={80} step={5} value={feedstockAdj} onChange={e => setFeedstockAdj(+e.target.value)} style={{ width: '100%' }} /></div>
                  <div><label style={{ fontSize: 12, color: T.textSec }}>Carbon Price ($/t): {carbonPrice}</label><input type="range" min={0} max={200} step={5} value={carbonPrice} onChange={e => setCarbonPrice(+e.target.value)} style={{ width: '100%' }} /></div>
                </div>
              </div>
            </div>
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
                {[
                  { label: 'Levelised Cost ($/MWh)', value: `$${lcoeResult.lcoe}` },
                  { label: 'Carbon-Adj LCOE ($/MWh)', value: `$${carbonCredits.adjustedLcoe}` },
                  { label: 'Project IRR (%)', value: `${irrResult}%` },
                  { label: 'Feedstock Cost Share', value: `${lcoeResult.feedstockShare}%` },
                  { label: 'Ann. Carbon Credits (kt)', value: `${(parseFloat(carbonCredits.annCreds)/1000).toFixed(1)}kt` },
                  { label: 'Carbon Credit Rev ($M/yr)', value: `$${carbonCredits.creditRevMyr}M` },
                ].map((k, i) => <div key={i} style={kpi}><div style={{ fontSize: 11, color: T.textMut, marginBottom: 4 }}>{k.label}</div><div style={{ fontSize: 20, fontWeight: 700, color: i === 1 ? T.green : T.navy }}>{k.value}</div></div>)}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={card}>
                  <h3 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy }}>LCOE Cost Components ($M/yr)</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={[{ name: 'Cost Breakdown', capex: parseFloat(lcoeResult.capexAnn), opex: parseFloat(lcoeResult.opexAnn), feedstock: parseFloat(lcoeResult.feedstockAnn) }]}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                      <XAxis dataKey="name" hide />
                      <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                      <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 12 }} formatter={(v) => [`$${v}M`, '']} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="capex" name="Capex (annualised)" fill={T.navy} stackId="a" />
                      <Bar dataKey="opex" name="O&M" fill={T.teal} stackId="a" />
                      <Bar dataKey="feedstock" name="Feedstock" fill={T.amber} stackId="a" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={card}>
                  <h3 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy }}>Sensitivity Analysis</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={sensitivityData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                      <XAxis type="number" tick={{ fontSize: 10, fill: T.textSec }} domain={['auto', 'auto']} />
                      <YAxis dataKey="param" type="category" tick={{ fontSize: 10, fill: T.textSec }} width={110} />
                      <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 12 }} formatter={(v) => [`$${v}/MWh`, 'LCOE']} />
                      <ReferenceLine x={parseFloat(lcoeResult.lcoe)} stroke={T.gold} strokeDasharray="4 4" />
                      <Bar dataKey="lcoe" fill={T.sage} radius={[0,3,3,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 2 && (
        <div>
          <div style={card}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, color: T.navy }}>Feedstock Comparative Analytics</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr>{['Feedstock','Source','Cost ($/t)','Energy (GJ/t)','CO₂ (kgCO₂/GJ)','Water (m³/GJ)','Certification','Availability'].map(h => <th key={h} style={{ padding: '7px 8px', textAlign: 'left', color: T.textMut, borderBottom: `1px solid ${T.border}` }}>{h}</th>)}</tr></thead>
              <tbody>{FEEDSTOCK_TYPES.map((f, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? T.surfaceH : 'transparent' }}>
                  <td style={{ padding: '7px 8px', fontWeight: 600, color: T.navy }}>{f.name}</td>
                  <td style={{ padding: '7px 8px', color: T.textSec, fontSize: 11 }}>{f.source}</td>
                  <td style={{ padding: '7px 8px', fontFamily: T.mono, color: f.costUsd < 0 ? T.green : T.text }}>{f.costUsd < 0 ? `Gate fee $${Math.abs(f.costUsd)}` : `$${f.costUsd}`}</td>
                  <td style={{ padding: '7px 8px', fontFamily: T.mono }}>{f.energyGjt}</td>
                  <td style={{ padding: '7px 8px', fontFamily: T.mono, color: f.co2kgGJ < 5 ? T.green : T.amber }}>{f.co2kgGJ}</td>
                  <td style={{ padding: '7px 8px', fontFamily: T.mono }}>{f.waterM3GJ}</td>
                  <td style={{ padding: '7px 8px', fontSize: 11, color: T.teal }}>{f.sustainCert}</td>
                  <td style={{ padding: '7px 8px', fontSize: 11 }}>{f.availability}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div style={card}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy }}>Feedstock Cost vs CO₂ Intensity</h3>
            <ResponsiveContainer width="100%" height={220}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="cost" name="Cost ($/t)" label={{ value: 'Cost ($/t)', position: 'insideBottom', offset: -5, fontSize: 11, fill: T.textSec }} tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis dataKey="co2" name="CO₂ (kgCO₂/GJ)" label={{ value: 'CO₂ (kgCO₂/GJ)', angle: -90, position: 'insideLeft', fontSize: 10, fill: T.textSec }} tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 12 }}
                  content={({ payload }) => payload?.[0] ? <div style={{ background: T.surface, border: `1px solid ${T.border}`, padding: '8px 12px', borderRadius: 6, fontSize: 12 }}><div style={{ fontWeight: 600, color: T.navy }}>{payload[0].payload.name}</div><div>Cost: ${payload[0].payload.cost}/t | CO₂: {payload[0].payload.co2} kg/GJ</div></div> : null} />
                <Scatter data={FEEDSTOCK_TYPES.map(f => ({ name: f.name.split(' ')[0], cost: f.costUsd, co2: f.co2kgGJ }))} fill={T.sage} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 3 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
            {TECH_TYPES.map((t, i) => (
              <div key={i} style={{ ...card, borderTop: `3px solid ${T.sage}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ fontWeight: 700, color: T.navy, fontSize: 14 }}>{t.name}</div>
                  <span style={{ fontSize: 12, fontFamily: T.mono, color: T.gold }}>${calcBioenergyLcoe({ ...t, powerMw: 50, wacc: 7.5, feedstockUsd: t.feedstockUsd }).lcoe}/MWh</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginBottom: 8 }}>
                  {[
                    { k: 'Capex ($/kW)', v: t.capexMwh.toLocaleString() },
                    { k: 'CF (%)', v: t.cf },
                    { k: 'Efficiency (%)', v: t.efficiency },
                    { k: 'Feedstock ($/t)', v: t.feedstockUsd },
                    { k: 'Lifetime (yr)', v: t.lifetime },
                    { k: 'CO₂ (tCO₂/MWh)', v: t.co2Factor },
                  ].map(item => (
                    <div key={item.k} style={{ padding: '6px', background: T.surfaceH, borderRadius: 4, textAlign: 'center' }}>
                      <div style={{ fontSize: 10, color: T.textMut }}>{item.k}</div>
                      <div style={{ fontSize: 12, fontFamily: T.mono, fontWeight: 600, color: T.navy }}>{item.v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: T.textSec }}>{t.scope}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 4 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
            {POLICY_SUPPORT.map((p, i) => (
              <div key={i} style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700, color: T.navy, fontSize: 15 }}>{p.country}</div>
                    <div style={{ fontSize: 12, color: T.textSec }}>{p.mechanism}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontFamily: T.mono, color: T.gold, fontWeight: 700 }}>+{p.supportBps}bps</div>
                    <div style={{ fontSize: 11, color: T.textMut }}>{p.level} support</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <div style={{ flex: 1, padding: '6px', background: T.surfaceH, borderRadius: 4, fontSize: 11, textAlign: 'center' }}>
                    <div style={{ color: T.textMut }}>CO₂ Price</div>
                    <div style={{ color: T.navy, fontWeight: 600 }}>{p.co2Price}</div>
                  </div>
                  <div style={{ flex: 1, padding: '6px', background: T.surfaceH, borderRadius: 4, fontSize: 11, textAlign: 'center' }}>
                    <div style={{ color: T.textMut }}>RE Target</div>
                    <div style={{ color: T.navy, fontWeight: 600 }}>{p.renewTarget}</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: T.textSec }}>{p.comment}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 5 && (
        <div>
          <div style={card}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, color: T.navy }}>Sustainability Criteria Framework (RED III / IEA / ICMA)</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {SUSTAINABILITY_CRITERIA.map((sc, i) => (
                <div key={i} style={{ padding: '14px 18px', background: T.surfaceH, borderRadius: 6, borderLeft: `4px solid ${[T.green, T.navy, T.teal, T.amber, T.sage][i]}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div style={{ fontWeight: 700, color: T.navy, fontSize: 13 }}>{sc.criterion}</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span style={{ fontSize: 11, fontFamily: T.mono, background: T.surface, padding: '2px 8px', borderRadius: 4, color: T.teal }}>{sc.threshold}</span>
                      <span style={{ fontSize: 11, fontFamily: T.mono, background: T.surface, padding: '2px 8px', borderRadius: 4, color: T.gold }}>weight: {sc.weight}%</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: T.textSec }}>{sc.scope}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 6 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy }}>Biomass Supply Chain Risk Map</h3>
              {[
                { stage: 'Feedstock Sourcing', risk: 'Medium-High', issues: 'Competition with food, land rights, certification gaps' },
                { stage: 'Pre-processing (pelletising)', risk: 'Low-Medium', issues: 'Energy intensity of drying/densification' },
                { stage: 'Transport & Logistics', risk: 'Medium', issues: 'Ocean freight emissions; port congestion; bulk handling' },
                { stage: 'Storage', risk: 'Low', issues: 'Moisture control; spontaneous combustion risk for pellets' },
                { stage: 'Conversion Plant', risk: 'Low-Medium', issues: 'Technology risk (gasification/pyrolysis); feedstock flex' },
                { stage: 'Certification & Audit', risk: 'High', issues: 'EUDR deforestation due diligence; RSB/SBP audit burden' },
              ].map((stage, i) => (
                <div key={i} style={{ padding: '8px 12px', background: i % 2 === 0 ? T.surfaceH : 'transparent', borderRadius: 4, marginBottom: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.navy }}>{stage.stage}</div>
                    <div style={{ fontSize: 11, color: T.textSec }}>{stage.issues}</div>
                  </div>
                  <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 3, background: stage.risk.includes('High') ? T.red : stage.risk === 'Medium' ? T.amber : T.sage, color: '#fff', whiteSpace: 'nowrap', marginLeft: 8 }}>{stage.risk}</span>
                </div>
              ))}
            </div>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy }}>Feedstock Cost vs. Availability</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={FEEDSTOCK_TYPES.map(f => ({ name: f.name.split(' ')[0], cost: Math.max(0, f.costUsd), energy: f.energyGjt }))} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: T.textSec }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: T.textSec }} width={90} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="cost" name="Cost ($/t)" fill={T.amber} radius={[0,3,3,0]} />
                  <Bar dataKey="energy" name="Energy (GJ/t)" fill={T.sage} radius={[0,3,3,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 7 && (
        <div>
          <div style={card}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, color: T.navy }}>Technology Learning Curves ($/MWh)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={learningCurve}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec }} label={{ value: '$/MWh', angle: -90, position: 'insideLeft', fontSize: 11, fill: T.textSec }} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="biomass" name="Biomass Power" stroke={T.sage} strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="biogas" name="Biogas Power" stroke={T.teal} strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="saf" name="SAF (HEFA)" stroke={T.amber} strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
            <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
              {[['Biomass', '3% p.a. cost reduction', '~12% per doubling of capacity'], ['Biogas/Biomethane', '4% p.a.', '~15% per doubling (AD maturation)'], ['SAF (HEFA/AtJ)', '6% p.a. (early stage)', '~22% per doubling (IEA estimate)']].map(([name, rate, doubling], i) => (
                <div key={i} style={{ padding: '10px', background: T.surfaceH, borderRadius: 6, fontSize: 12 }}>
                  <div style={{ fontWeight: 600, color: T.navy, marginBottom: 4 }}>{name}</div>
                  <div style={{ color: T.green }}>{rate}</div>
                  <div style={{ color: T.textSec, fontSize: 11 }}>{doubling}</div>
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
              <h3 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy }}>Carbon Intensity by Technology (gCO₂/kWh)</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={carbonIntensityData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: T.textSec }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: T.textSec }} width={100} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 12 }} formatter={(v) => [`${v}g/kWh`, 'Carbon Intensity']} />
                  <Bar dataKey="intensity" fill={T.green} radius={[0,3,3,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy }}>Fossil Saving % vs Coal Baseline</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={carbonIntensityData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: T.textSec }} domain={[0, 100]} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: T.textSec }} width={100} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 12 }} formatter={(v) => [`${v}%`, 'GHG Saving vs Coal']} />
                  <ReferenceLine x={65} stroke={T.amber} strokeDasharray="4 4" label={{ value: 'RED III 65% min', fontSize: 10, fill: T.amber }} />
                  <Bar dataKey="fossilSaving" fill={T.sage} radius={[0,3,3,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 9 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
            {[
              { label: 'Global Bioenergy AUM', value: '$340B', sub: 'Infra + private credit + listed' },
              { label: 'Biomethane Pipeline EU', value: '€83B', sub: '2030 target: 35 bcm' },
              { label: 'SAF Demand 2030', value: '5.7M t/yr', sub: 'EU ReFuelEU + CORSIA' },
              { label: 'Biogas Investment 2024', value: '$28B', sub: 'Anaerobic digestion globally' },
            ].map((k, i) => <div key={i} style={kpi}><div style={{ fontSize: 11, color: T.textMut, marginBottom: 4 }}>{k.label}</div><div style={{ fontSize: 18, fontWeight: 700, color: T.navy }}>{k.value}</div><div style={{ fontSize: 11, color: T.textSec }}>{k.sub}</div></div>)}
          </div>
          <div style={card}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy }}>Key Investors & Deal Activity</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
              {[
                { investor: 'Copenhagen Infrastructure Partners', focus: 'Large-scale biomass CHP + BECCS', aum: '$20B+', strategy: 'Long-term offtake + CfD secured' },
                { investor: 'Macquarie Asset Management', focus: 'Biomethane & biogas aggregation', aum: '$8B (bioenergy)', strategy: 'Roll-up of AD plants in EU' },
                { investor: 'BlackRock Real Assets', focus: 'SAF project equity + infra debt', aum: 'N/D', strategy: 'IRA-enabled US SAF mandates' },
                { investor: 'Brookfield Renewable', focus: 'Bioenergy within RE portfolio', aum: '$94B (RE)', strategy: 'Selective; co-firing + dedicated' },
                { investor: 'Climate Adaptive Infrastructure', focus: 'Biomethane + BECCS equity', aum: '$3B', strategy: 'Early-stage to operational' },
                { investor: 'Infranode / IKEA PE', focus: 'Nordic biomass CHP', aum: 'N/D', strategy: 'Nordic district heating integration' },
              ].map((inv, i) => (
                <div key={i} style={{ padding: '10px 14px', background: T.surfaceH, borderRadius: 6 }}>
                  <div style={{ fontWeight: 600, color: T.navy, fontSize: 13, marginBottom: 4 }}>{inv.investor}</div>
                  <div style={{ fontSize: 12, color: T.textSec, marginBottom: 3 }}>{inv.focus}</div>
                  <div style={{ fontSize: 11, color: T.textMut }}>{inv.strategy}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
