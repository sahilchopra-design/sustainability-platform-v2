import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

const sr = (seed) => { let x = Math.sin(seed + 1) * 10000; return x - Math.floor(x); };
const T = { bg: '#0f1117', surface: '#1a1d27', surfaceH: '#22263a', border: '#2a2f45', borderL: '#1e2235', navy: '#1e3a5f', gold: '#d4a843', sage: '#2d6a4f', teal: '#0d4f5c', text: '#e8e0d0', textSec: '#a89880', textMut: '#6b6050', red: '#c0392b', green: '#27ae60', amber: '#e67e22', font: "'DM Sans', sans-serif", mono: "'JetBrains Mono', monospace" };

const CITIES = [
  { id: 'miami', name: 'Miami, USA', slrM2050: 0.38, floodRisk: 91, investedGbn: 4.2, protectedValue: 1450, bcrAvg: 3.8, adaptation: 'Sea walls + Living shoreline + Elevation', popAtRisk: 1200000, annDamageBn: 2.8 },
  { id: 'dhaka', name: 'Dhaka, Bangladesh', slrM2050: 0.45, floodRisk: 94, investedGbn: 1.1, protectedValue: 285, bcrAvg: 6.2, adaptation: 'Embankment + Cyclone shelters + EWS', popAtRisk: 8500000, annDamageBn: 4.1 },
  { id: 'rotterdam', name: 'Rotterdam, Netherlands', slrM2050: 0.28, floodRisk: 62, investedGbn: 14.8, protectedValue: 620, bcrAvg: 9.4, adaptation: 'Delta Works + Surge barriers + Green roofs', popAtRisk: 680000, annDamageBn: 0.3 },
  { id: 'jakarta', name: 'Jakarta, Indonesia', slrM2050: 0.85, floodRisk: 97, investedGbn: 3.8, protectedValue: 520, bcrAvg: 4.1, adaptation: 'NCICD sea wall + Mangrove belt + Relocation', popAtRisk: 4200000, annDamageBn: 3.6 },
  { id: 'venice', name: 'Venice, Italy', slrM2050: 0.32, floodRisk: 78, investedGbn: 7.2, protectedValue: 180, bcrAvg: 2.8, adaptation: 'MOSE barriers + Pavement elevation + Sensors', popAtRisk: 250000, annDamageBn: 0.8 },
  { id: 'shangai', name: 'Shanghai, China', slrM2050: 0.42, floodRisk: 85, investedGbn: 6.5, protectedValue: 2100, bcrAvg: 7.8, adaptation: 'Seawall + Tidal gates + Sponge city', popAtRisk: 5800000, annDamageBn: 5.2 },
  { id: 'mumbai', name: 'Mumbai, India', slrM2050: 0.36, floodRisk: 88, investedGbn: 1.8, protectedValue: 720, bcrAvg: 5.1, adaptation: 'Coastal road + Mangrove protection + Bunding', popAtRisk: 3100000, annDamageBn: 3.8 },
  { id: 'nyc', name: 'New York City, USA', slrM2050: 0.31, floodRisk: 74, investedGbn: 9.4, protectedValue: 3200, bcrAvg: 4.6, adaptation: 'East Side Coastal Resiliency + Living breakwaters', popAtRisk: 2400000, annDamageBn: 1.9 },
];

const PROTECTION_MEASURES = [
  { measure: 'Seawall / Levee', capexMPerKm: 18, maintenancePct: 3.5, lifespanYr: 50, co2TPerM: 850, bcrTypical: 3.2, naturalInfra: false, cobenefit: 'Hard protection, land reclamation potential' },
  { measure: 'Mangrove Restoration', capexMPerKm: 0.8, maintenancePct: 8, lifespanYr: 25, co2TPerM: -45, bcrTypical: 8.1, naturalInfra: true, cobenefit: 'Blue carbon, fisheries, biodiversity, tourism' },
  { measure: 'Living Shoreline', capexMPerKm: 3.2, maintenancePct: 5, lifespanYr: 30, co2TPerM: 120, bcrTypical: 6.4, naturalInfra: true, cobenefit: 'Habitat, recreation, erosion control' },
  { measure: 'Surge Barrier', capexMPerKm: 65, maintenancePct: 2.5, lifespanYr: 75, co2TPerM: 2200, bcrTypical: 5.8, naturalInfra: false, cobenefit: 'Large-area protection, navigation maintained' },
  { measure: 'Coastal Wetland (Hybrid)', capexMPerKm: 2.1, maintenancePct: 6, lifespanYr: 35, co2TPerM: -80, bcrTypical: 9.2, naturalInfra: true, cobenefit: 'Blue carbon + water quality + biodiversity' },
  { measure: 'Beach Nourishment', capexMPerKm: 4.5, maintenancePct: 15, lifespanYr: 10, co2TPerM: 280, bcrTypical: 2.4, naturalInfra: false, cobenefit: 'Tourism, recreational value maintained' },
  { measure: 'Building Elevation Program', capexMPerKm: 8, maintenancePct: 1, lifespanYr: 40, co2TPerM: 380, bcrTypical: 4.2, naturalInfra: false, cobenefit: 'Property value protected, insurance savings' },
];

const SLR_SCENARIOS = [
  { year: 2030, slr_rcp26: 0.10, slr_rcp45: 0.12, slr_rcp85: 0.15, assetExposureGtn: 1.2 },
  { year: 2040, slr_rcp26: 0.18, slr_rcp45: 0.22, slr_rcp85: 0.30, assetExposureGtn: 1.8 },
  { year: 2050, slr_rcp26: 0.28, slr_rcp45: 0.38, slr_rcp85: 0.55, assetExposureGtn: 2.8 },
  { year: 2060, slr_rcp26: 0.36, slr_rcp45: 0.52, slr_rcp85: 0.78, assetExposureGtn: 4.1 },
  { year: 2075, slr_rcp26: 0.48, slr_rcp45: 0.72, slr_rcp85: 1.12, assetExposureGtn: 7.2 },
  { year: 2100, slr_rcp26: 0.60, slr_rcp45: 1.00, slr_rcp85: 1.80, assetExposureGtn: 14.5 },
];

const FINANCE_INSTRUMENTS = [
  { name: 'FEMA BRIC / BFDI Grant', provider: 'US Federal / FEMA', size: '$1–100M', mechanism: 'Grant (75% federal)', trigger: 'Pre-disaster mitigation', bestFor: 'US coastal municipalities' },
  { name: 'GCF Coastal Adaptation', provider: 'Green Climate Fund', size: '$10M–1Bn', mechanism: 'Grant + Concessional loan', trigger: 'SIDS & LDC eligibility', bestFor: 'Developing coastal nations' },
  { name: 'World Bank CATDDOs', provider: 'World Bank / IBRD', size: '$50M–500M', mechanism: 'Contingent draw-down loan', trigger: 'Disaster event trigger', bestFor: 'Sovereign borrowers' },
  { name: 'Resilience Bond', provider: 'Municipal market', size: '$50M–2Bn', mechanism: 'Revenue / GO bond', trigger: 'Hazard mitigation investment', bestFor: 'US/EU coastal cities' },
  { name: 'Parametric Insurance', provider: 'Swiss Re / Munich Re', size: '$5M–500M', mechanism: 'Index-based payout (tide/wind)', trigger: 'Storm surge > threshold', bestFor: 'Island nations, coral reefs' },
  { name: 'Nature-Based IRM', provider: 'Coastal IRM / NGO', size: '$1M–50M', mechanism: 'Insurance + restoration', trigger: 'Reef/mangrove health KPI', bestFor: 'Tourism-dependent economies' },
];

const TABS = ['Overview', 'City Dashboard', 'Sea Level Rise', 'Protection Measures', 'BCR Engine', 'Finance Instruments', 'Parametric Insurance', 'Green Infrastructure', 'Asset Stranding', 'Investment Case'];

function calcBcr({ annBenefit, capex, discountRate, lifeYrs }) {
  const pvBenefit = lifeYrs > 0 && discountRate > 0 ? annBenefit * (1 - Math.pow(1 + discountRate / 100, -lifeYrs)) / (discountRate / 100) : annBenefit * lifeYrs;
  return capex > 0 ? pvBenefit / capex : 0;
}
function calcNpv({ annBenefit, capex, discountRate, lifeYrs }) {
  const pvBenefit = lifeYrs > 0 && discountRate > 0 ? annBenefit * (1 - Math.pow(1 + discountRate / 100, -lifeYrs)) / (discountRate / 100) : annBenefit * lifeYrs;
  return pvBenefit - capex;
}
function calcParametricPayout({ windSpeed, triggerSpeed, maxPayout }) {
  return windSpeed > triggerSpeed ? Math.min(maxPayout, maxPayout * (windSpeed - triggerSpeed) / 40) : 0;
}

const Kpi = ({ label, value, sub, color }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: '14px 18px', flex: 1, minWidth: 140 }}>
    <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.gold, fontFamily: T.mono }}>{value}</div>
    {sub && <div style={{ fontSize: 10, color: T.textSec, marginTop: 3 }}>{sub}</div>}
  </div>
);

export default function CoastalResilienceFinancePage() {
  const [tab, setTab] = useState(0);
  const [selCity, setSelCity] = useState('miami');
  const [capex, setCapex] = useState(50);
  const [annBenefit, setAnnBenefit] = useState(18);
  const [discountRate, setDiscountRate] = useState(7);
  const [lifeYrs, setLifeYrs] = useState(30);
  const [windSpeed, setWindSpeed] = useState(120);
  const [maxPayout, setMaxPayout] = useState(20);
  const [selMeasure, setSelMeasure] = useState(0);

  const city = CITIES.find(c => c.id === selCity) || CITIES[0];
  const measure = PROTECTION_MEASURES[selMeasure];
  const bcr = calcBcr({ annBenefit, capex, discountRate, lifeYrs });
  const npv = calcNpv({ annBenefit, capex, discountRate, lifeYrs });
  const payout = calcParametricPayout({ windSpeed, triggerSpeed: 100, maxPayout });
  const totalProtected = CITIES.reduce((s, c) => s + c.protectedValue, 0);
  const totalInvested = CITIES.reduce((s, c) => s + c.investedGbn, 0);
  const avgBcr = CITIES.length > 0 ? CITIES.reduce((s, c) => s + c.bcrAvg, 0) / CITIES.length : 0;
  const riskColor = (s) => s >= 85 ? T.red : s >= 70 ? T.amber : T.green;

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: T.font, color: T.text, padding: 24 }}>
      <div style={{ borderBottom: `2px solid ${T.gold}`, paddingBottom: 12, marginBottom: 20 }}>
        <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, letterSpacing: 2 }}>EP-DZ6 · OCEAN & BLUE ECONOMY FINANCE</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: '4px 0', color: T.text }}>Coastal Resilience & Adaptation Finance Hub</h1>
        <div style={{ fontSize: 12, color: T.textSec }}>8-City Dashboard · Sea Level Rise · BCR Engine · FEMA BRIC · Parametric Insurance · Green Infrastructure · Asset Stranding · 10 Tabs</div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <Kpi label="ASSETS AT RISK (2050)" value="$2.8Tn" sub="Global SLR exposure" />
        <Kpi label="INVESTED (8 CITIES)" value={`$${totalInvested.toFixed(1)}Bn`} sub="Coastal adaptation committed" color={T.teal} />
        <Kpi label="PROTECTED VALUE" value={`$${(totalProtected / 1000).toFixed(1)}Tn`} sub="8-city portfolio" color={T.amber} />
        <Kpi label="AVG BCR" value={`${avgBcr.toFixed(1)}×`} sub="Benefit-cost ratio" color={T.green} />
        <Kpi label="ROTTERDAM BCR" value="9.4×" sub="Best practice benchmark" color={T.sage} />
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{ padding: '6px 14px', borderRadius: 4, border: `1px solid ${tab === i ? T.gold : T.border}`, background: tab === i ? T.navy : T.surface, color: tab === i ? T.gold : T.textSec, fontFamily: T.mono, fontSize: 11, cursor: 'pointer' }}>{t}</button>
        ))}
      </div>

      {tab === 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 12 }}>FLOOD RISK SCORE BY CITY</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={CITIES}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="name" stroke={T.textMut} tick={{ fontSize: 8 }} /><YAxis stroke={T.textMut} tick={{ fontSize: 10 }} domain={[0, 100]} /><Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6 }} /><Bar dataKey="floodRisk" fill={T.amber} name="Flood Risk (0-100)" /></BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 12 }}>SEA LEVEL RISE SCENARIOS (m by year)</div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={SLR_SCENARIOS}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="year" stroke={T.textMut} tick={{ fontSize: 10 }} /><YAxis stroke={T.textMut} tick={{ fontSize: 10 }} /><Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6 }} /><Legend /><Line type="monotone" dataKey="slr_rcp26" stroke={T.green} strokeWidth={2} name="RCP 2.6" /><Line type="monotone" dataKey="slr_rcp45" stroke={T.amber} strokeWidth={2} name="RCP 4.5" /><Line type="monotone" dataKey="slr_rcp85" stroke={T.red} strokeWidth={2} name="RCP 8.5" /></LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, gridColumn: '1/-1' }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 12 }}>8-CITY RESILIENCE SNAPSHOT</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {CITIES.map((c, i) => (
                <div key={i} style={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6, padding: 12 }}>
                  <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold }}>{c.name.split(',')[0]}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                    <div><div style={{ fontSize: 10, color: T.textMut }}>Risk</div><div style={{ fontSize: 14, fontWeight: 700, color: riskColor(c.floodRisk), fontFamily: T.mono }}>{c.floodRisk}</div></div>
                    <div><div style={{ fontSize: 10, color: T.textMut }}>BCR</div><div style={{ fontSize: 14, fontWeight: 700, color: T.green, fontFamily: T.mono }}>{c.bcrAvg}×</div></div>
                    <div><div style={{ fontSize: 10, color: T.textMut }}>Invest</div><div style={{ fontSize: 14, fontWeight: 700, color: T.teal, fontFamily: T.mono }}>${c.investedGbn}Bn</div></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {CITIES.map(c => (
              <button key={c.id} onClick={() => setSelCity(c.id)} style={{ padding: '6px 12px', borderRadius: 4, border: `1px solid ${selCity === c.id ? T.gold : T.border}`, background: selCity === c.id ? T.navy : T.surface, color: selCity === c.id ? T.gold : T.text, fontFamily: T.mono, fontSize: 11, cursor: 'pointer' }}>{c.name.split(',')[0]}</button>
            ))}
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontFamily: T.mono, fontSize: 13, color: T.gold, marginBottom: 4 }}>{city.name}</div>
            <div style={{ fontSize: 11, color: T.textSec, marginBottom: 16 }}>{city.adaptation}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              <Kpi label="FLOOD RISK" value={`${city.floodRisk}/100`} sub="Composite" color={riskColor(city.floodRisk)} />
              <Kpi label="SLR BY 2050" value={`+${city.slrM2050}m`} sub="RCP4.5 median" color={T.amber} />
              <Kpi label="INVESTED" value={`$${city.investedGbn}Bn`} sub="Adaptation committed" color={T.teal} />
              <Kpi label="BCR" value={`${city.bcrAvg}×`} sub="Benefit-cost ratio" color={T.green} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
              <div style={{ background: T.surfaceH, borderRadius: 6, padding: 14 }}>
                <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono }}>PROTECTED ASSET VALUE</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: T.gold, fontFamily: T.mono, marginTop: 4 }}>${city.protectedValue}Bn</div>
              </div>
              <div style={{ background: T.surfaceH, borderRadius: 6, padding: 14 }}>
                <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono }}>ANN. DAMAGE (NO-ACTION)</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: T.red, fontFamily: T.mono, marginTop: 4 }}>${city.annDamageBn}Bn/yr</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 12 }}>SEA LEVEL RISE & ASSET EXPOSURE (2030-2100)</div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={SLR_SCENARIOS}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="year" stroke={T.textMut} tick={{ fontSize: 10 }} /><YAxis yAxisId="left" stroke={T.textMut} tick={{ fontSize: 10 }} /><YAxis yAxisId="right" orientation="right" stroke={T.textMut} tick={{ fontSize: 10 }} /><Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6 }} /><Legend /><Area yAxisId="left" type="monotone" dataKey="slr_rcp85" stroke={T.red} fill={T.red} fillOpacity={0.15} name="SLR RCP 8.5 (m)" /><Area yAxisId="left" type="monotone" dataKey="slr_rcp45" stroke={T.amber} fill={T.amber} fillOpacity={0.15} name="SLR RCP 4.5 (m)" /><Area yAxisId="left" type="monotone" dataKey="slr_rcp26" stroke={T.green} fill={T.green} fillOpacity={0.15} name="SLR RCP 2.6 (m)" /><Line yAxisId="right" type="monotone" dataKey="assetExposureGtn" stroke={T.gold} strokeWidth={2} name="Asset Exposure ($Tn)" /></AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[['2050 RCP 2.6', '+0.28m', '$2.8Tn exposure', T.green], ['2050 RCP 4.5', '+0.38m', '$2.8Tn exposure', T.amber], ['2050 RCP 8.5', '+0.55m', '$3.5Tn exposure', T.red], ['2100 RCP 2.6', '+0.60m', '$14.5Tn exposure', T.sage], ['2100 RCP 4.5', '+1.00m', '$18.2Tn exposure', T.amber], ['2100 RCP 8.5', '+1.80m', '$32.4Tn exposure', T.red]].map(([scenario, slr, exposure, color]) => (
              <div key={scenario} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontFamily: T.mono, fontSize: 11, color: T.textMut }}>{scenario}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color, fontFamily: T.mono, marginTop: 6 }}>{slr}</div>
                <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>{exposure}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {PROTECTION_MEASURES.map((m, i) => (
              <button key={i} onClick={() => setSelMeasure(i)} style={{ padding: '6px 12px', borderRadius: 4, border: `1px solid ${selMeasure === i ? T.gold : T.border}`, background: selMeasure === i ? T.navy : T.surface, color: selMeasure === i ? T.gold : T.text, fontFamily: T.mono, fontSize: 11, cursor: 'pointer' }}>{m.measure.split(' ')[0]}</button>
            ))}
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontFamily: T.mono, fontSize: 13, color: measure.naturalInfra ? T.sage : T.gold, marginBottom: 4 }}>{measure.measure} {measure.naturalInfra ? '🌿 Nature-Based' : '🏗️ Hard Infrastructure'}</div>
            <div style={{ fontSize: 11, color: T.textSec, marginBottom: 16 }}>{measure.cobenefit}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              <Kpi label="CAPEX" value={`$${measure.capexMPerKm}M/km`} sub="Installation cost" color={T.amber} />
              <Kpi label="LIFESPAN" value={`${measure.lifespanYr} yr`} sub={`Maintenance: ${measure.maintenancePct}%/yr`} color={T.teal} />
              <Kpi label="TYPICAL BCR" value={`${measure.bcrTypical}×`} sub="Benefit-cost ratio" color={T.green} />
              <Kpi label="CO₂/km" value={`${measure.co2TPerM < 0 ? '−' : '+'}${Math.abs(measure.co2TPerM)}t`} sub={measure.co2TPerM < 0 ? 'Carbon-negative' : 'Embodied carbon'} color={measure.co2TPerM < 0 ? T.green : T.amber} />
            </div>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 12 }}>BCR COMPARISON ACROSS MEASURES</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={PROTECTION_MEASURES}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="measure" stroke={T.textMut} tick={{ fontSize: 8 }} /><YAxis stroke={T.textMut} tick={{ fontSize: 10 }} /><Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6 }} /><ReferenceLine y={4} stroke={T.amber} strokeDasharray="3 3" label={{ value: 'Min viable BCR', fill: T.amber, fontSize: 9 }} /><Bar dataKey="bcrTypical" fill={T.sage} name="Typical BCR" /></BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 4 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 16 }}>BCR / NPV CALCULATOR</div>
            {[['Project Capex ($M)', capex, setCapex, 1, 500], ['Annual Benefit ($M)', annBenefit, setAnnBenefit, 1, 200], ['Discount Rate (%)', discountRate, setDiscountRate, 3, 20], ['Project Life (years)', lifeYrs, setLifeYrs, 5, 75]].map(([label, val, set, min, max]) => (
              <div key={label} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: T.textMut, marginBottom: 4, fontFamily: T.mono }}>{label}: <span style={{ color: T.gold }}>{val}</span></div>
                <input type="range" min={min} max={max} value={val} onChange={e => set(Number(e.target.value))} style={{ width: '100%', accentColor: T.gold }} />
              </div>
            ))}
            <div style={{ background: T.navy, borderRadius: 8, padding: 16, marginTop: 8 }}>
              <div style={{ fontFamily: T.mono, fontSize: 11, color: T.textMut, marginBottom: 8 }}>RESULTS</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div><div style={{ fontSize: 10, color: T.textMut }}>BCR</div><div style={{ fontSize: 22, fontWeight: 700, color: bcr >= 4 ? T.green : bcr >= 2 ? T.amber : T.red, fontFamily: T.mono }}>{bcr.toFixed(2)}×</div></div>
                <div><div style={{ fontSize: 10, color: T.textMut }}>NPV</div><div style={{ fontSize: 22, fontWeight: 700, color: npv > 0 ? T.green : T.red, fontFamily: T.mono }}>${(npv / 1).toFixed(0)}M</div></div>
                <div><div style={{ fontSize: 10, color: T.textMut }}>PV Benefits</div><div style={{ fontSize: 16, fontWeight: 700, color: T.teal, fontFamily: T.mono }}>${(npv + capex).toFixed(0)}M</div></div>
                <div><div style={{ fontSize: 10, color: T.textMut }}>Decision</div><div style={{ fontSize: 14, fontWeight: 700, color: bcr >= 1 ? T.green : T.red, fontFamily: T.mono }}>{bcr >= 4 ? 'STRONG GO' : bcr >= 2 ? 'GO' : bcr >= 1 ? 'MARGINAL' : 'NO-GO'}</div></div>
              </div>
            </div>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 12 }}>CITY BCR BENCHMARKS</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={CITIES}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="name" stroke={T.textMut} tick={{ fontSize: 8 }} /><YAxis stroke={T.textMut} tick={{ fontSize: 10 }} /><Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6 }} /><ReferenceLine y={avgBcr} stroke={T.gold} strokeDasharray="3 3" label={{ value: `Avg ${avgBcr.toFixed(1)}×`, fill: T.gold, fontSize: 9 }} /><Bar dataKey="bcrAvg" fill={T.sage} name="BCR" /></BarChart>
            </ResponsiveContainer>
            <div style={{ marginTop: 12, background: T.surfaceH, borderRadius: 6, padding: 12 }}>
              <div style={{ fontFamily: T.mono, fontSize: 11, color: T.textMut, marginBottom: 6 }}>FEMA STANDARD</div>
              <div style={{ fontSize: 12, color: T.text }}>US federal minimum BCR for BRIC grant eligibility: <span style={{ color: T.gold, fontFamily: T.mono }}>1.0×</span> · Best-practice natural infrastructure: <span style={{ color: T.sage, fontFamily: T.mono }}>7–10×</span></div>
            </div>
          </div>
        </div>
      )}

      {tab === 5 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {FINANCE_INSTRUMENTS.map((fi, i) => (
            <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ fontFamily: T.mono, fontSize: 13, color: T.gold }}>{fi.name}</div>
                  <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{fi.provider}</div>
                </div>
                <div style={{ background: T.navy, borderRadius: 4, padding: '4px 10px', fontFamily: T.mono, fontSize: 11, color: T.text }}>{fi.bestFor}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {[['SIZE', fi.size], ['MECHANISM', fi.mechanism], ['TRIGGER', fi.trigger]].map(([label, val]) => (
                  <div key={label} style={{ background: T.surfaceH, borderRadius: 4, padding: 10 }}>
                    <div style={{ fontSize: 10, color: T.textMut, fontFamily: T.mono }}>{label}</div>
                    <div style={{ fontSize: 11, color: T.text, marginTop: 3 }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 6 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 16 }}>PARAMETRIC INSURANCE CALCULATOR</div>
            {[['Wind Speed (km/h)', windSpeed, setWindSpeed, 60, 250], ['Max Payout ($M)', maxPayout, setMaxPayout, 5, 200]].map(([label, val, set, min, max]) => (
              <div key={label} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: T.textMut, marginBottom: 4, fontFamily: T.mono }}>{label}: <span style={{ color: T.gold }}>{val}</span></div>
                <input type="range" min={min} max={max} value={val} onChange={e => set(Number(e.target.value))} style={{ width: '100%', accentColor: T.gold }} />
              </div>
            ))}
            <div style={{ background: T.navy, borderRadius: 8, padding: 16, marginTop: 8 }}>
              <div style={{ fontFamily: T.mono, fontSize: 11, color: T.textMut, marginBottom: 8 }}>PAYOUT RESULT</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: payout > 0 ? T.green : T.textMut, fontFamily: T.mono }}>${payout.toFixed(1)}M</div>
              <div style={{ fontSize: 11, color: T.textSec, marginTop: 6 }}>Trigger: 100 km/h wind · Linear payout up to cap</div>
              <div style={{ fontSize: 11, color: payout > 0 ? T.green : T.amber, marginTop: 4 }}>{payout > 0 ? `Triggered — payout ${(payout / maxPayout * 100).toFixed(0)}% of max` : 'Below trigger threshold — no payout'}</div>
            </div>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 14 }}>PARAMETRIC PRODUCTS — COASTAL FOCUS</div>
            {[['Tropical Cyclone (CAT bond)', 'Swiss Re / Munich Re', 'Wind speed + surge index', '$50-500M', 'USD 8-14% coupon'], ['Coral Reef Health Policy', 'Coastal IRM (Mexico)', 'Bleaching event trigger', '$10-80M', 'Annual premium 3-5%'], ['Coastal Flood Index', 'Aon / Willis', 'Water level gauge trigger', '$20-200M', 'USD 5-9% coupon'], ['Agricultural Flood Cover', 'CGAP / World Bank', 'Satellite inundation index', '$5-50M', 'Subsidized premium'], ['Port Disruption (BI)', 'Zurich / AIG', 'Storm surge closure trigger', '$30-300M', 'USD 6-12%']].map(([name, provider, trigger, size, pricing]) => (
              <div key={name} style={{ background: T.surfaceH, borderRadius: 6, padding: 12, marginBottom: 10 }}>
                <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold }}>{name}</div>
                <div style={{ fontSize: 10, color: T.textSec, marginTop: 2 }}>{provider} · {trigger}</div>
                <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                  <span style={{ fontSize: 10, color: T.amber, fontFamily: T.mono }}>{size}</span>
                  <span style={{ fontSize: 10, color: T.teal, fontFamily: T.mono }}>{pricing}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 7 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 14 }}>NATURE-BASED INFRASTRUCTURE COMPARISON</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={PROTECTION_MEASURES.filter(m => m.naturalInfra)}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="measure" stroke={T.textMut} tick={{ fontSize: 9 }} /><YAxis stroke={T.textMut} tick={{ fontSize: 10 }} /><Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6 }} /><Bar dataKey="bcrTypical" fill={T.sage} name="BCR" /></BarChart>
            </ResponsiveContainer>
            <div style={{ marginTop: 14 }}>
              {PROTECTION_MEASURES.filter(m => m.naturalInfra).map((m, i) => (
                <div key={i} style={{ background: T.surfaceH, borderRadius: 6, padding: 12, marginBottom: 8 }}>
                  <div style={{ fontFamily: T.mono, fontSize: 11, color: T.sage }}>{m.measure}</div>
                  <div style={{ fontSize: 10, color: T.textSec, marginTop: 4 }}>{m.cobenefit}</div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                    <span style={{ fontSize: 10, color: T.amber, fontFamily: T.mono }}>${m.capexMPerKm}M/km</span>
                    <span style={{ fontSize: 10, color: T.green, fontFamily: T.mono }}>BCR: {m.bcrTypical}×</span>
                    <span style={{ fontSize: 10, color: m.co2TPerM < 0 ? T.green : T.textMut, fontFamily: T.mono }}>{m.co2TPerM}t CO₂/km</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 14 }}>NbS VS HARD INFRASTRUCTURE</div>
            {[['Cost (capex)', 'NbS: $0.8–4M/km', 'Hard: $4–65M/km', T.green], ['BCR', 'NbS: 6–9×', 'Hard: 2–6×', T.sage], ['Co-benefits', 'NbS: High (carbon, bio)', 'Hard: Low', T.teal], ['Maintenance', 'NbS: 5–8%/yr', 'Hard: 1–4%/yr', T.amber], ['Lifespan', 'NbS: 25–35yr', 'Hard: 50–75yr', T.textSec], ['Flood Protection', 'NbS: 0.3–1.2m waves', 'Hard: 2–5m surge', T.textSec]].map(([label, nbs, hard, color]) => (
              <div key={label} style={{ borderBottom: `1px solid ${T.borderL}`, padding: '10px 0' }}>
                <div style={{ fontFamily: T.mono, fontSize: 11, color: T.textMut, marginBottom: 4 }}>{label}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color }}>{nbs}</span>
                  <span style={{ fontSize: 12, color: T.textSec }}>{hard}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 8 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 12 }}>COASTAL ASSET STRANDING RISK MATRIX</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead><tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {['City', 'SLR 2050', 'Flood Risk', 'Asset Value', 'Stranded@1m', 'Adaptation Investment', 'Protection Status'].map(h => <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.textMut, fontFamily: T.mono }}>{h}</th>)}
              </tr></thead>
              <tbody>{CITIES.map((c, i) => {
                const strandedfraction = Math.min(0.95, c.floodRisk / 100 * (1 + c.slrM2050));
                const strandedValue = c.protectedValue * strandedfraction * 0.3;
                return (
                  <tr key={c.id} style={{ borderBottom: `1px solid ${T.borderL}`, background: i % 2 === 0 ? 'transparent' : T.surfaceH }}>
                    <td style={{ padding: '8px 10px', color: T.gold, fontFamily: T.mono }}>{c.name.split(',')[0]}</td>
                    <td style={{ padding: '8px 10px', color: T.amber, fontFamily: T.mono }}>+{c.slrM2050}m</td>
                    <td style={{ padding: '8px 10px', color: riskColor(c.floodRisk), fontFamily: T.mono }}>{c.floodRisk}/100</td>
                    <td style={{ padding: '8px 10px', color: T.text, fontFamily: T.mono }}>${c.protectedValue}Bn</td>
                    <td style={{ padding: '8px 10px', color: T.red, fontFamily: T.mono }}>${strandedValue.toFixed(0)}Bn</td>
                    <td style={{ padding: '8px 10px', color: T.teal, fontFamily: T.mono }}>${c.investedGbn}Bn</td>
                    <td style={{ padding: '8px 10px', color: c.bcrAvg > 6 ? T.green : c.bcrAvg > 4 ? T.amber : T.red }}>{c.bcrAvg > 6 ? 'WELL PROTECTED' : c.bcrAvg > 4 ? 'ADEQUATE' : 'AT RISK'}</td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 9 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 14 }}>THE INVESTMENT CASE FOR COASTAL ADAPTATION</div>
            {[['Global adaptation gap', '$194Bn/yr needed by 2030 (UNEP estimate)', T.red], ['Current public spend', '$21Bn/yr globally — 11% of need', T.amber], ['Private sector gap', 'Private finance: <5% of total — massive opportunity', T.teal], ['BCR evidence base', '170+ studies: avg BCR 4–7× for coastal protection', T.green], ['Insurance market pull', 'Munich Re: insured coastal losses up 5× since 1980', T.gold], ['Green bond integration', 'Resilience bonds + NbS eligible under ICMA GBP', T.sage]].map(([label, val, color]) => (
              <div key={label} style={{ background: T.surfaceH, borderRadius: 6, padding: 12, marginBottom: 10 }}>
                <div style={{ fontFamily: T.mono, fontSize: 11, color }}>{label}</div>
                <div style={{ fontSize: 12, color: T.text, marginTop: 4 }}>{val}</div>
              </div>
            ))}
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 14 }}>INVESTMENT RETURNS — ADAPTATION INFRASTRUCTURE</div>
            {[['Mangrove restoration', '8.1× BCR · Blue carbon income · 25yr life', T.sage], ['Coastal wetland hybrid', '9.2× BCR · Best risk-return · Carbon neg.', T.teal], ['Living shoreline', '6.4× BCR · Recreation + habitat value', T.green], ['Surge barrier', '5.8× BCR · Large-area protection · 75yr life', T.amber], ['Seawall / Levee', '3.2× BCR · Hard protection only · 50yr', T.textSec], ['Beach nourishment', '2.4× BCR · Tourism-dependent revenue', T.textMut]].map(([label, desc, color]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${T.borderL}` }}>
                <div style={{ fontSize: 12, color: T.text }}>{label}</div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, color, fontFamily: T.mono }}>{desc.split('·')[0]}</div>
                  <div style={{ fontSize: 10, color: T.textMut }}>{desc.split('·').slice(1).join('·')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
