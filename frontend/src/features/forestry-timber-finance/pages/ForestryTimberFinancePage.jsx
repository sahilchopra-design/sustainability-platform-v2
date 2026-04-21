import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

const sr = (seed) => { let x = Math.sin(seed + 1) * 10000; return x - Math.floor(x); };
const T = { bg: '#0f1117', surface: '#1a1d27', surfaceH: '#22263a', border: '#2a2f45', borderL: '#1e2235', navy: '#1e3a5f', gold: '#d4a843', sage: '#2d6a4f', teal: '#0d4f5c', text: '#e8e0d0', textSec: '#a89880', textMut: '#6b6050', red: '#c0392b', green: '#27ae60', amber: '#e67e22', font: "'DM Sans', sans-serif", mono: "'JetBrains Mono', monospace" };

const FOREST_TYPES = [
  { id: 'temperate_softwood', name: 'Temperate Softwood', region: 'Pacific NW, Scandinavia, UK', mairPct: 8.2, rotatYr: 45, carbonSeqTha: 4.8, timberPriceM3: 95, landHaM: 8500, fscPrem: 12, waterReg: 'High', biodiv: 'Medium' },
  { id: 'temperate_hardwood', name: 'Temperate Hardwood', region: 'SE USA, Central Europe', mairPct: 6.8, rotatYr: 80, carbonSeqTha: 5.2, timberPriceM3: 185, landHaM: 12000, fscPrem: 18, waterReg: 'High', biodiv: 'High' },
  { id: 'tropical_plantation', name: 'Tropical Plantation (Eucalyptus/Acacia)', region: 'Brazil, Indonesia, South Africa', mairPct: 12.5, rotatYr: 7, carbonSeqTha: 6.8, timberPriceM3: 65, landHaM: 4200, fscPrem: 20, waterReg: 'Medium', biodiv: 'Low-Medium' },
  { id: 'tropical_natural', name: 'Tropical Natural Forest', region: 'Amazon, Congo, SE Asia', mairPct: 4.2, rotatYr: 0, carbonSeqTha: 8.5, timberPriceM3: 380, landHaM: 25000, fscPrem: 35, waterReg: 'Critical', biodiv: 'Very High' },
  { id: 'boreal', name: 'Boreal Forest', region: 'Canada, Russia, Scandinavia', mairPct: 3.8, rotatYr: 100, carbonSeqTha: 3.2, timberPriceM3: 72, landHaM: 18000, fscPrem: 8, waterReg: 'High', biodiv: 'Medium' },
  { id: 'mangrove', name: 'Mangrove (Blue Carbon)', region: 'Coastal tropics', mairPct: 9.5, rotatYr: 0, carbonSeqTha: 14.2, timberPriceM3: 0, landHaM: 32000, fscPrem: 45, waterReg: 'Critical', biodiv: 'Very High' },
];

const TIMOS_LIST = [
  { name: 'Hancock Timber Resource Group (Manulife)', aum: 14.5, strategy: 'Diversified global softwood + hardwood', regions: 'USA, Australia, NZ, Brazil, Chile', fund: 'Open-end + separate accounts', irr: 7.8, carbonInteg: 'Emerging', vintageYr: 1985 },
  { name: 'Weyerhaeuser (REIT)', aum: 18.2, strategy: 'US timberland REIT + manufacturing', regions: 'Pacific NW, SE USA', fund: 'NYSE-listed REIT (WY)', irr: 8.4, carbonInteg: 'Active (carbon offsets)', vintageYr: 1900 },
  { name: 'Rayonier (REIT)', aum: 5.8, strategy: 'US timberland + HBU conversion', regions: 'Pacific NW, SE USA, NZ', fund: 'NYSE-listed REIT (RYN)', irr: 7.2, carbonInteg: 'Active', vintageYr: 1926 },
  { name: 'Campbell Global', aum: 5.2, strategy: 'Sustainable forestry + carbon markets', regions: 'USA, New Zealand', fund: 'Closed-end commingled', irr: 7.5, carbonInteg: 'Carbon forward sales', vintageYr: 1981 },
  { name: 'New Forests', aum: 4.8, strategy: 'Asia-Pacific + climate-focused forestry', regions: 'Australia, NZ, SE Asia, Africa', fund: 'Closed-end; impact mandate', irr: 8.8, carbonInteg: 'High — carbon-primary deals', vintageYr: 2005 },
  { name: 'BTG Pactual Timberland', aum: 2.4, strategy: 'Brazilian eucalyptus + carbon integration', regions: 'Brazil', fund: 'Commingled + bilateral', irr: 12.4, carbonInteg: 'REDD+ + plantation carbon', vintageYr: 2009 },
  { name: 'GreenTrees (Living Carbon)', aum: 0.8, strategy: 'Reforestation with engineered carbon trees', regions: 'US Southeast', fund: 'Carbon credit forward sales', irr: 9.5, carbonInteg: 'Core strategy', vintageYr: 2008 },
];

const CARBON_METHODOLOGIES = [
  { name: 'Improved Forest Management (IFM)', registry: 'VCS/ACR', creditType: 'VCU / Carbon Offset', permanence: '100yr buffer pool', additionality: 'Baseline harvest scenario', price: '$8–25', co2PerHa: '3–8 tCO₂/ha/yr', risk: 'Baseline gaming; leakage' },
  { name: 'Afforestation/Reforestation (AR)', registry: 'VCS/CDM/Gold Standard', creditType: 'VCU / CER', permanence: 'Buffer pool + permanence period', additionality: 'Land eligible for planting', price: '$5–18', co2PerHa: '4–12 tCO₂/ha/yr', risk: 'Long time to credit issuance' },
  { name: 'REDD+ (Jurisdictional)', registry: 'VCS/ART TREES', creditType: 'VCU / TREES credit', permanence: 'Nested accounting', additionality: 'National/subnational deforestation baseline', price: '$8–35', co2PerHa: '5–15 tCO₂/ha/yr', risk: 'Political risk; baseline uncertainty' },
  { name: 'Conservation IFM (US)', registry: 'ACR / CAR', creditType: 'ERTs', permanence: '100yr mandatory', additionality: 'Financial additionality test', price: '$10–30', co2PerHa: '2–5 tCO₂/ha/yr', risk: 'Permanence insurance cost' },
  { name: 'Mangrove / Blue Carbon', registry: 'VCS (VM0033)', creditType: 'VCU (blue carbon)', permanence: 'Non-permanence risk buffer', additionality: 'Avoided conversion / restoration', price: '$25–80', co2PerHa: '10–25 tCO₂/ha/yr', risk: 'Sea level rise; survey cost' },
];

const RETURN_BENCHMARKS = [
  { asset: 'US Timberland (NCREIF)', yr10Ann: 7.2, yr20Ann: 8.1, correlation: 0.12, inflation: 0.68, liquidity: 'Low', minInv: '$5M' },
  { asset: 'Global Timberland (IPD)', yr10Ann: 6.8, yr20Ann: 7.4, correlation: 0.08, inflation: 0.72, liquidity: 'Low', minInv: '$10M' },
  { asset: 'US REIT (Timber only)', yr10Ann: 9.4, yr20Ann: 10.2, correlation: 0.55, inflation: 0.42, liquidity: 'High', minInv: 'Public' },
  { asset: 'Carbon-Enhanced Forestry', yr10Ann: 9.8, yr20Ann: 11.5, correlation: 0.05, inflation: 0.80, liquidity: 'Low-Medium', minInv: '$2M' },
  { asset: 'US Private Equity', yr10Ann: 14.2, yr20Ann: 13.8, correlation: 0.72, inflation: 0.18, liquidity: 'Very Low', minInv: '$10M' },
  { asset: 'Core Real Estate', yr10Ann: 7.8, yr20Ann: 8.5, correlation: 0.38, inflation: 0.58, liquidity: 'Low', minInv: '$5M' },
  { asset: 'US Agg Bonds', yr10Ann: 2.8, yr20Ann: 3.6, correlation: -0.15, inflation: -0.22, liquidity: 'High', minInv: 'N/A' },
];

const TABS = ['Overview', 'Timber IRR Engine', 'Forest Types', 'TIMO Landscape',
  'Carbon Integration', 'Return Benchmarks', 'FSC Premium Analytics', 'Risk Framework',
  'Climate Finance', 'FI Products'];

function calcTimberIrr({ landHa, landCostHa, plantCostHa, annMgmtHa, rotatYr, mairPct, timberPriceM3, carbonSeqTha, carbonPriceT, fscPremPct, wacc }) {
  const landCost = landHa * landCostHa;
  const plantCost = landHa * plantCostHa;
  const annMgmt = landHa * annMgmtHa;
  const mairFactor = mairPct / 100;
  const finalVolM3 = landHa * 250 * Math.pow(1 + mairFactor, rotatYr);
  const timberRev = finalVolM3 * timberPriceM3 * (1 + fscPremPct / 100);
  const annCarbonRev = landHa * carbonSeqTha * carbonPriceT;
  const totalCarbonRev = annCarbonRev * rotatYr;
  const cfs = [-(landCost + plantCost), ...Array.from({ length: rotatYr }, (_, i) => i === rotatYr - 1 ? timberRev + annCarbonRev - annMgmt : annCarbonRev - annMgmt)];
  let r = 0.08;
  for (let i = 0; i < 200; i++) {
    const n = cfs.reduce((s, c, t) => s + c / Math.pow(1 + r, t), 0);
    const d = cfs.reduce((s, c, t) => s - t * c / Math.pow(1 + r, t + 1), 0);
    if (Math.abs(d) < 1e-10) break;
    const nr = r - n / d;
    if (Math.abs(nr - r) < 1e-8) { r = nr; break; }
    r = nr;
  }
  const npvCalc = cfs.reduce((s, c, t) => s + c / Math.pow(1 + wacc / 100, t), 0);
  return { irr: (r * 100).toFixed(1), npv: (npvCalc / 1e6).toFixed(1), finalVolM3: Math.round(finalVolM3).toLocaleString(), timberRev: (timberRev / 1e6).toFixed(1), annCarbonRev: (annCarbonRev / 1e6).toFixed(2) };
}

export default function ForestryTimberFinancePage() {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedForest, setSelectedForest] = useState('temperate_softwood');
  const [landHa, setLandHa] = useState(5000);
  const [landCostHa, setLandCostHa] = useState(2500);
  const [plantCostHa, setPlantCostHa] = useState(1200);
  const [annMgmtHa, setAnnMgmtHa] = useState(85);
  const [carbonPrice, setCarbonPrice] = useState(18);
  const [wacc, setWacc] = useState(6.5);

  const forest = useMemo(() => FOREST_TYPES.find(f => f.id === selectedForest) || FOREST_TYPES[0], [selectedForest]);

  const irrResult = useMemo(() => calcTimberIrr({
    landHa, landCostHa, plantCostHa, annMgmtHa, rotatYr: forest.rotatYr || 45,
    mairPct: forest.mairPct, timberPriceM3: forest.timberPriceM3,
    carbonSeqTha: forest.carbonSeqTha, carbonPriceT: carbonPrice,
    fscPremPct: forest.fscPrem, wacc,
  }), [forest, landHa, landCostHa, plantCostHa, annMgmtHa, carbonPrice, wacc]);

  const carbonSensData = useMemo(() => [0, 5, 10, 15, 20, 30, 40, 60].map(cp => ({
    price: cp, irr: parseFloat(calcTimberIrr({ landHa, landCostHa, plantCostHa, annMgmtHa, rotatYr: forest.rotatYr || 45, mairPct: forest.mairPct, timberPriceM3: forest.timberPriceM3, carbonSeqTha: forest.carbonSeqTha, carbonPriceT: cp, fscPremPct: forest.fscPrem, wacc }).irr),
  })), [forest, landHa, landCostHa, plantCostHa, annMgmtHa, wacc]);

  const returnData = useMemo(() => RETURN_BENCHMARKS.map(b => ({ name: b.asset.split('(')[0].trim(), yr10: b.yr10Ann, yr20: b.yr20Ann })), []);

  const carbonRevData = useMemo(() => FOREST_TYPES.map(f => ({
    name: f.name.split(' ')[0], seq: f.carbonSeqTha, rev: parseFloat((5000 * f.carbonSeqTha * carbonPrice / 1e6).toFixed(2)),
  })), [carbonPrice]);

  const s = { padding: '24px', fontFamily: T.font, color: T.text, background: T.bg, minHeight: '100vh' };
  const card = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '20px', marginBottom: 16 };
  const kpi = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px', textAlign: 'center' };
  const tab = (i) => ({ padding: '8px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontFamily: T.font, background: activeTab === i ? T.gold : T.surface, color: activeTab === i ? T.navy : T.text, fontWeight: activeTab === i ? 700 : 400 });
  const sel = { background: T.bg, border: `1px solid ${T.border}`, borderRadius: 4, padding: '6px 10px', color: T.text, fontSize: 13, fontFamily: T.mono, width: '100%', cursor: 'pointer' };

  return (
    <div style={s}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 28 }}>🌲</span>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.navy }}>Forestry & Timberland Finance Intelligence Suite</h1>
            <p style={{ margin: 0, fontSize: 13, color: T.textSec }}>EP-DX3 · TIMO / Timber REIT Analytics · Forest Carbon IRR · FSC Certification Premium · VCS/REDD+ Methodology · Return Benchmarks</p>
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
              { label: 'Global Timberland AUM', value: '$100B+', sub: 'TIMOs + REITs + pension funds' },
              { label: 'Forest Carbon Market 2023', value: '$1.4B', sub: '+28% YoY (VCM + compliance)' },
              { label: 'Avg TIMO Net Return (20yr)', value: '7.5%', sub: 'NCREIF Timberland Index' },
              { label: 'Low Equity Correlation', value: '0.05–0.15', sub: 'Diversification benefit' },
            ].map((k, i) => <div key={i} style={kpi}><div style={{ fontSize: 11, color: T.textMut, marginBottom: 6 }}>{k.label}</div><div style={{ fontSize: 20, fontWeight: 700, color: T.navy }}>{k.value}</div><div style={{ fontSize: 11, color: T.textSec }}>{k.sub}</div></div>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy }}>Return vs. Correlation Matrix</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={returnData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: T.textSec }} angle={-20} textAnchor="end" height={55} />
                  <YAxis tick={{ fontSize: 11, fill: T.textSec }} label={{ value: '% p.a.', angle: -90, position: 'insideLeft', fontSize: 11, fill: T.textSec }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="yr10" name="10yr Return %" fill={T.sage} radius={[3,3,0,0]} />
                  <Bar dataKey="yr20" name="20yr Return %" fill={T.navy} radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy }}>Carbon Sequestration by Forest Type</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={carbonRevData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'tCO₂/ha/yr', angle: -90, position: 'insideLeft', fontSize: 10, fill: T.textSec }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: T.textSec }} label={{ value: '$M/yr (5Kha)', angle: 90, position: 'insideRight', fontSize: 10, fill: T.textSec }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="left" dataKey="seq" name="Seq (tCO₂/ha/yr)" fill={T.green} radius={[3,3,0,0]} />
                  <Line yAxisId="right" type="monotone" dataKey="rev" name="Carbon Rev ($M/yr)" stroke={T.gold} strokeWidth={2} dot={{ r: 4 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 1 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20 }}>
            <div>
              <div style={card}>
                <h3 style={{ margin: '0 0 16px', fontSize: 14, color: T.navy }}>Investment Parameters</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div><label style={{ fontSize: 12, color: T.textSec }}>Forest Type</label><select value={selectedForest} onChange={e => setSelectedForest(e.target.value)} style={sel}>{FOREST_TYPES.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select></div>
                  <div><label style={{ fontSize: 12, color: T.textSec }}>Land Area (ha): {landHa.toLocaleString()}</label><input type="range" min={500} max={50000} step={500} value={landHa} onChange={e => setLandHa(+e.target.value)} style={{ width: '100%' }} /></div>
                  <div><label style={{ fontSize: 12, color: T.textSec }}>Land Cost ($/ha): ${landCostHa.toLocaleString()}</label><input type="range" min={500} max={15000} step={250} value={landCostHa} onChange={e => setLandCostHa(+e.target.value)} style={{ width: '100%' }} /></div>
                  <div><label style={{ fontSize: 12, color: T.textSec }}>Planting Cost ($/ha): ${plantCostHa}</label><input type="range" min={200} max={3500} step={100} value={plantCostHa} onChange={e => setPlantCostHa(+e.target.value)} style={{ width: '100%' }} /></div>
                  <div><label style={{ fontSize: 12, color: T.textSec }}>Annual Mgmt ($/ha): ${annMgmtHa}</label><input type="range" min={20} max={300} step={5} value={annMgmtHa} onChange={e => setAnnMgmtHa(+e.target.value)} style={{ width: '100%' }} /></div>
                  <div><label style={{ fontSize: 12, color: T.textSec }}>Carbon Credit Price ($/t): ${carbonPrice}</label><input type="range" min={0} max={80} step={1} value={carbonPrice} onChange={e => setCarbonPrice(+e.target.value)} style={{ width: '100%' }} /></div>
                  <div><label style={{ fontSize: 12, color: T.textSec }}>WACC (%): {wacc}</label><input type="range" min={3} max={12} step={0.5} value={wacc} onChange={e => setWacc(+e.target.value)} style={{ width: '100%' }} /></div>
                </div>
              </div>
              <div style={card}>
                <h3 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy }}>Forest Profile</h3>
                {[['Region', forest.region], ['Rotation (yr)', forest.rotatYr || 'N/A (natural)'], ['MAIR (%)', forest.mairPct], ['Seq (tCO₂/ha/yr)', forest.carbonSeqTha], ['Timber ($/m³)', `$${forest.timberPriceM3}`], ['FSC Premium', `${forest.fscPrem}%`], ['Biodiversity', forest.biodiv]].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: `1px solid ${T.borderL}`, fontSize: 12 }}>
                    <span style={{ color: T.textSec }}>{k}</span><span style={{ fontFamily: T.mono, color: T.navy }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
                {[
                  { label: 'Project IRR (%)', value: `${irrResult.irr}%` },
                  { label: 'NPV ($M)', value: `$${irrResult.npv}M` },
                  { label: 'Final Timber Volume (m³)', value: irrResult.finalVolM3 },
                  { label: 'Timber Revenue ($M)', value: `$${irrResult.timberRev}M` },
                  { label: 'Carbon Rev ($M/yr)', value: `$${irrResult.annCarbonRev}M` },
                  { label: 'FSC Premium (%)', value: `${forest.fscPrem}%` },
                ].map((k, i) => <div key={i} style={kpi}><div style={{ fontSize: 11, color: T.textMut, marginBottom: 4 }}>{k.label}</div><div style={{ fontSize: 18, fontWeight: 700, color: T.navy }}>{k.value}</div></div>)}
              </div>
              <div style={card}>
                <h3 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy }}>IRR Sensitivity to Carbon Price</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={carbonSensData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="price" label={{ value: 'Carbon Price ($/t)', position: 'insideBottom', offset: -2, fontSize: 11, fill: T.textSec }} tick={{ fontSize: 11, fill: T.textSec }} />
                    <YAxis tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'IRR %', angle: -90, position: 'insideLeft', fontSize: 11, fill: T.textSec }} />
                    <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 12 }} formatter={(v) => [`${v}%`, 'IRR']} />
                    <ReferenceLine y={7} stroke={T.amber} strokeDasharray="4 4" label={{ value: 'Hurdle 7%', fontSize: 10, fill: T.amber }} />
                    <ReferenceLine x={carbonPrice} stroke={T.gold} strokeDasharray="4 4" />
                    <Line type="monotone" dataKey="irr" stroke={T.green} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 2 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
            {FOREST_TYPES.map((f, i) => (
              <div key={i} style={{ ...card, borderTop: `3px solid ${T.sage}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ fontWeight: 700, color: T.navy, fontSize: 14 }}>{f.name}</div>
                  <span style={{ fontSize: 12, fontFamily: T.mono, color: T.gold }}>{f.mairPct}% MAIR</span>
                </div>
                <div style={{ fontSize: 11, color: T.textSec, marginBottom: 10 }}>{f.region}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
                  {[
                    { k: 'Rotation (yr)', v: f.rotatYr || 'Natural' },
                    { k: 'Timber ($/m³)', v: `$${f.timberPriceM3}` },
                    { k: 'Seq (tCO₂/ha/yr)', v: f.carbonSeqTha },
                    { k: 'Land ($/ha)', v: `$${f.landHaM}` },
                    { k: 'FSC Prem (%)', v: `${f.fscPrem}%` },
                    { k: 'Biodiversity', v: f.biodiv },
                  ].map(item => (
                    <div key={item.k} style={{ padding: '6px', background: T.surfaceH, borderRadius: 4, textAlign: 'center' }}>
                      <div style={{ fontSize: 10, color: T.textMut }}>{item.k}</div>
                      <div style={{ fontSize: 11, fontFamily: T.mono, fontWeight: 600, color: T.navy }}>{item.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 3 && (
        <div>
          <div style={card}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, color: T.navy }}>Leading TIMOs & Timber REITs</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr>{['Manager','AUM ($Bn)','Strategy','Regions','Fund Type','Net IRR','Carbon'].map(h => <th key={h} style={{ padding: '7px 8px', textAlign: 'left', color: T.textMut, borderBottom: `1px solid ${T.border}` }}>{h}</th>)}</tr></thead>
              <tbody>{TIMOS_LIST.map((t, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? T.surfaceH : 'transparent' }}>
                  <td style={{ padding: '7px 8px', fontWeight: 600, color: T.navy, fontSize: 11 }}>{t.name}</td>
                  <td style={{ padding: '7px 8px', fontFamily: T.mono }}>${t.aum}B</td>
                  <td style={{ padding: '7px 8px', color: T.textSec, fontSize: 11 }}>{t.strategy}</td>
                  <td style={{ padding: '7px 8px', color: T.textSec, fontSize: 11 }}>{t.regions}</td>
                  <td style={{ padding: '7px 8px', fontSize: 11 }}>{t.fund}</td>
                  <td style={{ padding: '7px 8px', fontFamily: T.mono, color: T.green }}>{t.irr}%</td>
                  <td style={{ padding: '7px 8px', color: T.teal, fontSize: 11 }}>{t.carbonInteg}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 4 && (
        <div>
          <div style={card}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, color: T.navy }}>Forest Carbon Methodologies</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {CARBON_METHODOLOGIES.map((cm, i) => (
                <div key={i} style={{ padding: '14px 16px', background: T.surfaceH, borderRadius: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ fontWeight: 700, color: T.navy, fontSize: 13 }}>{cm.name}</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span style={{ fontSize: 11, fontFamily: T.mono, background: T.surface, padding: '2px 8px', borderRadius: 4, color: T.green }}>{cm.price}/t</span>
                      <span style={{ fontSize: 11, background: T.surface, padding: '2px 8px', borderRadius: 4, color: T.teal }}>{cm.registry}</span>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, fontSize: 12 }}>
                    {[['CO₂ Potential', cm.co2PerHa], ['Permanence', cm.permanence], ['Key Risk', cm.risk]].map(([k, v]) => (
                      <div key={k} style={{ padding: '6px 8px', background: T.surface, borderRadius: 4 }}>
                        <div style={{ fontSize: 10, color: T.textMut, marginBottom: 2 }}>{k}</div>
                        <div style={{ color: T.text }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 5 && (
        <div>
          <div style={card}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, color: T.navy }}>Timberland vs. Asset Class Returns</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr>{['Asset Class','10yr Return','20yr Return','Equity Correl.','Inflation Beta','Liquidity','Min Invest'].map(h => <th key={h} style={{ padding: '7px 8px', textAlign: 'left', color: T.textMut, borderBottom: `1px solid ${T.border}` }}>{h}</th>)}</tr></thead>
              <tbody>{RETURN_BENCHMARKS.map((b, i) => (
                <tr key={i} style={{ background: i < 4 ? (i % 2 === 0 ? '#1a2520' : '#141d18') : (i % 2 === 0 ? T.surfaceH : 'transparent') }}>
                  <td style={{ padding: '7px 8px', fontWeight: i < 4 ? 600 : 400, color: i < 4 ? T.green : T.text }}>{b.asset}</td>
                  <td style={{ padding: '7px 8px', fontFamily: T.mono, color: b.yr10Ann > 9 ? T.green : T.text }}>{b.yr10Ann}%</td>
                  <td style={{ padding: '7px 8px', fontFamily: T.mono, color: b.yr20Ann > 9 ? T.green : T.text }}>{b.yr20Ann}%</td>
                  <td style={{ padding: '7px 8px', fontFamily: T.mono, color: b.correlation < 0.2 ? T.green : b.correlation > 0.5 ? T.amber : T.text }}>{b.correlation}</td>
                  <td style={{ padding: '7px 8px', fontFamily: T.mono, color: b.inflation > 0.5 ? T.green : T.text }}>{b.inflation}</td>
                  <td style={{ padding: '7px 8px', color: T.textSec }}>{b.liquidity}</td>
                  <td style={{ padding: '7px 8px', fontFamily: T.mono }}>{b.minInv}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 6 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy }}>FSC Premium by Forest Type (%)</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={FOREST_TYPES.map(f => ({ name: f.name.split(' ')[0], fsc: f.fscPrem, biodiv: f.biodiv === 'Very High' ? 4 : f.biodiv === 'High' ? 3 : f.biodiv === 'Medium' ? 2 : 1 }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 12 }} />
                  <Bar dataKey="fsc" name="FSC Premium (%)" fill={T.green} radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy }}>FSC / Certification Value Chain</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { cert: 'FSC Forest Management', cost: '$15–45/ha/yr', benefit: '8–35% timber price premium', coverage: '220M ha globally' },
                  { cert: 'PEFC (Programme for Endorsement)', cost: '$8–25/ha/yr', benefit: '5–20% premium, esp. EU/Japan', coverage: '350M ha (largest)' },
                  { cert: 'SBP (Sustainable Biomass Program)', cost: '$5–15/ha/yr', benefit: 'Required for RED III compliance', coverage: 'Industrial pellet supply chains' },
                  { cert: 'Rainforest Alliance', cost: '$12–35/ha/yr', benefit: 'Consumer brand premium + access', coverage: '6M ha (tropical focus)' },
                  { cert: 'RSPO (for palm/mixed)', cost: '$8–20/ha/yr', benefit: 'Mandatory for EU food sector access', coverage: 'Palm oil / mixed tropical' },
                ].map((c, i) => (
                  <div key={i} style={{ padding: '8px 12px', background: i % 2 === 0 ? T.surfaceH : 'transparent', borderRadius: 4, display: 'grid', gridTemplateColumns: '180px 1fr 1fr', gap: 8, fontSize: 12 }}>
                    <div style={{ fontWeight: 600, color: T.navy }}>{c.cert}</div>
                    <div><span style={{ color: T.textMut }}>Cost: </span><span style={{ color: T.amber }}>{c.cost}</span></div>
                    <div><span style={{ color: T.textMut }}>Benefit: </span><span style={{ color: T.green }}>{c.benefit}</span></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 7 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
            {[
              { category: 'Fire & Natural Hazard Risk', severity: 'High', items: ['Wildfire frequency increasing with climate change', 'Pest/disease (bark beetle, root rot, armillaria)', 'Windstorm and ice storm damage', 'Flood and landslide in steep terrain'] },
              { category: 'Carbon Permanence Risk', severity: 'High', items: ['Fire invalidates stored carbon credits', 'Harvest before permanence period ends', 'Policy changes removing carbon credit value', 'Reversal buffer pool depletion (VCS)'] },
              { category: 'Market & Price Risk', severity: 'Medium', items: ['Timber price cyclicality (housing market linked)', 'Carbon credit price volatility', 'Log export restriction (Indonesia, Malaysia)', 'Competing land uses driving up land cost'] },
              { category: 'Regulatory & ESG Risk', severity: 'Medium-High', items: ['EUDR deforestation regulation (2024)', 'EU due diligence on forest products', 'Community land rights conflicts', 'ILO/FPIC requirements for indigenous land'] },
            ].map((r, i) => (
              <div key={i} style={{ ...card, borderLeft: `3px solid ${r.severity === 'High' ? T.red : T.amber}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontWeight: 600, color: T.navy, fontSize: 13 }}>{r.category}</div>
                  <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 3, background: r.severity === 'High' ? '#7f1d1d' : '#92400e', color: '#fff' }}>{r.severity}</span>
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy }}>Forestry Climate Finance Structures</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { structure: 'Green Bond (Timber REIT)', size: '$200M–$2Bn', yield: 'Benchmark-5 to +20bps', framework: 'ICMA Green Bond Principles', proceeds: 'Sustainable forestry expansion + FSC certification' },
                  { structure: 'Carbon Forward Pre-Sale', size: '$5M–$100M', yield: 'N/A (carbon price lock-in)', framework: 'VCS/ACR methodology + buyer SPO', proceeds: 'Carbon credit offtake at $10–30/t, 5–20yr' },
                  { structure: 'TIMO LP Commitment (Climate Fund)', size: '$50M–$500M', yield: '7–12% net IRR target', framework: 'TCFD-aligned, TNFD integration', proceeds: 'Blended timber + carbon revenue; biodiversity' },
                  { structure: 'Reforestation Project Bond', size: '$20M–$200M', yield: 'Carbon-backed; 6–9%', framework: 'Blue/Green Forest Bond Standard', proceeds: 'Afforestation with Art 6.4 or VCS credit backing' },
                ].map((s, i) => (
                  <div key={i} style={{ padding: '10px 14px', background: T.surfaceH, borderRadius: 6 }}>
                    <div style={{ fontWeight: 600, color: T.navy, fontSize: 13, marginBottom: 4 }}>{s.structure}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 11 }}>
                      <div><span style={{ color: T.textMut }}>Size: </span><span style={{ color: T.gold }}>{s.size}</span></div>
                      <div><span style={{ color: T.textMut }}>Yield: </span><span style={{ color: T.green }}>{s.yield}</span></div>
                    </div>
                    <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>{s.proceeds}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy }}>Timberland Carbon Revenue Trend ($M/yr, 5K ha)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={[2020,2022,2024,2026,2028,2030,2035,2040].map((yr, i) => ({
                  year: yr, carbon: parseFloat((5000 * 4.8 * (8 + i * 4) / 1e6).toFixed(2)),
                  timber: parseFloat((5000 * 4.8 * 95 / 45 / 1e6 * (yr - 2015)).toFixed(2)),
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="carbon" name="Carbon Revenue ($M)" stroke={T.green} fill={T.green} fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 9 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
            {[
              { product: 'Timber Loan (Senior Secured)', rate: 'SOFR + 180–280bps', ltv: '55–70% land value', term: '7–15yr', security: 'First lien on timberland', FI: 'Bank / insurance company' },
              { product: 'Carbon Credit Monetisation Facility', rate: 'Carbon price linked; 5–8%', ltv: 'N/A (credit receivable)', term: '3–10yr', security: 'Carbon credit forward receivables', FI: 'Specialist lender / green bank' },
              { product: 'TIMO Fund Finance Line', rate: 'SOFR + 120–180bps', ltv: '20–40% NAV', term: '3–5yr revolving', security: 'LP commitment', FI: 'Prime brokerage / private bank' },
              { product: 'Timber REIT Green Bond', rate: 'Treasury + 80–150bps', ltv: 'N/A (unsecured bond)', term: '5–10yr', security: 'Pari passu unsecured', FI: 'Investment bank DCM' },
            ].map((p, i) => (
              <div key={i} style={card}>
                <div style={{ fontWeight: 700, color: T.navy, fontSize: 14, marginBottom: 10 }}>{p.product}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[['Rate', p.rate], ['LTV', p.ltv], ['Term', p.term], ['Security', p.security], ['FI Role', p.FI]].map(([k, v]) => (
                    <div key={k} style={{ padding: '7px 10px', background: T.surfaceH, borderRadius: 4, fontSize: 12 }}>
                      <div style={{ fontSize: 10, color: T.textMut, marginBottom: 2 }}>{k}</div>
                      <div style={{ color: T.navy, fontWeight: 500 }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
