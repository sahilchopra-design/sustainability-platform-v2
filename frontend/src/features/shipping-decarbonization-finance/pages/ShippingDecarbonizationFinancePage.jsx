import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

const sr = (seed) => { let x = Math.sin(seed + 1) * 10000; return x - Math.floor(x); };
const T = { bg: '#0f1117', surface: '#1a1d27', surfaceH: '#22263a', border: '#2a2f45', borderL: '#1e2235', navy: '#1e3a5f', gold: '#d4a843', sage: '#2d6a4f', teal: '#0d4f5c', text: '#e8e0d0', textSec: '#a89880', textMut: '#6b6050', red: '#c0392b', green: '#27ae60', amber: '#e67e22', font: "'DM Sans', sans-serif", mono: "'JetBrains Mono', monospace" };

const FLEET_SEGMENTS = [
  { id: 'bulk', name: 'Bulk Carriers', count: 11800, avgDwt: 75000, co2MtYear: 148, ciiRating: 'C', eexiCompliant: 72, altFuelReady: 18, transitionCapex: 2.4, govtSubsidy: 0.4 },
  { id: 'tanker', name: 'Tankers (Crude & Product)', count: 5900, avgDwt: 120000, co2MtYear: 182, ciiRating: 'D', eexiCompliant: 61, altFuelReady: 14, transitionCapex: 3.8, govtSubsidy: 0.6 },
  { id: 'container', name: 'Container Ships', count: 5800, avgDwt: 55000, co2MtYear: 212, ciiRating: 'B', eexiCompliant: 84, altFuelReady: 32, transitionCapex: 4.5, govtSubsidy: 0.8 },
  { id: 'cruise', name: 'Cruise & Passenger', count: 480, avgDwt: 90000, co2MtYear: 24, ciiRating: 'E', eexiCompliant: 45, altFuelReady: 22, transitionCapex: 6.2, govtSubsidy: 1.1 },
  { id: 'roro', name: 'RoRo & Car Carriers', count: 1400, avgDwt: 20000, co2MtYear: 28, ciiRating: 'C', eexiCompliant: 68, altFuelReady: 25, transitionCapex: 1.8, govtSubsidy: 0.3 },
  { id: 'lpg', name: 'LPG Carriers', count: 1300, avgDwt: 35000, co2MtYear: 19, ciiRating: 'B', eexiCompliant: 78, altFuelReady: 41, transitionCapex: 2.1, govtSubsidy: 0.3 },
];

const ALT_FUELS = [
  { fuel: 'Green Ammonia (NH₃)', energyDensity: 12.7, gwp100: 0.0, readiness: 4, costPremium: 3.8, bunkering: 'Limited (2027+)', imoApproved: false, range: 'Full ocean', color: T.teal },
  { fuel: 'Green Methanol (e-MeOH)', energyDensity: 15.6, gwp100: 0.0, readiness: 6, costPremium: 2.6, bunkering: 'Growing (40+ ports)', imoApproved: true, range: 'Full ocean', color: T.sage },
  { fuel: 'LNG (Transition Bridge)', energyDensity: 53.6, gwp100: 0.8, readiness: 9, costPremium: 0.6, bunkering: 'Established (135+ ports)', imoApproved: true, range: 'Full ocean', color: T.amber },
  { fuel: 'Green Hydrogen (H₂)', energyDensity: 33.3, gwp100: 0.0, readiness: 3, costPremium: 5.2, bunkering: 'Nascent (2030+)', imoApproved: false, range: 'Short-sea only', color: T.gold },
  { fuel: 'Bio-LNG / Bio-Methane', energyDensity: 53.6, gwp100: 0.2, readiness: 5, costPremium: 1.8, bunkering: 'Limited (25+ ports)', imoApproved: true, range: 'Full ocean', color: '#7c4dff' },
  { fuel: 'Wind-Assist (Retrofit)', energyDensity: 0, gwp100: 0.0, readiness: 7, costPremium: 0.4, bunkering: 'N/A', imoApproved: true, range: 'All routes', color: '#00bcd4' },
];

const IMO_TRAJECTORY = [
  { year: 2020, baselineGhg: 100, imo2050Target: 100, achievedGhg: 100 },
  { year: 2025, baselineGhg: 102, imo2050Target: 85, achievedGhg: 94 },
  { year: 2030, baselineGhg: 105, imo2050Target: 70, achievedGhg: null },
  { year: 2035, baselineGhg: 108, imo2050Target: 50, achievedGhg: null },
  { year: 2040, baselineGhg: 110, imo2050Target: 30, achievedGhg: null },
  { year: 2050, baselineGhg: 115, imo2050Target: 0, achievedGhg: null },
];

const FINANCE_INSTRUMENTS = [
  { name: 'Green Ship Loan', provider: 'Commercial banks', size: '10–500M', tenor: '10–15yr', rate: 'SOFR+150-250bps', trigger: 'CII rating B+ / EEXI compliance', bestFor: 'Retrofit & newbuild' },
  { name: 'Poseidon Principles Loan', provider: 'Signatories (30+ banks)', size: '50M+', tenor: '5–12yr', rate: 'SOFR+120-200bps', trigger: 'IMO trajectory alignment', bestFor: 'Portfolio alignment' },
  { name: 'IMO GIF Grant', provider: 'IMO GIF / GEF', size: '0.5–5M', tenor: 'Grant', rate: '0%', trigger: 'SIDS & developing states fleet', bestFor: 'Pilot projects' },
  { name: 'Export Credit Agency (ECA)', provider: 'ECGD, Bpifrance, KEXIM', size: '100M+', tenor: '12–18yr', rate: 'Fixed 4.0–5.5%', trigger: 'Shipyard nationality', bestFor: 'Newbuild orders' },
  { name: 'Blue Bond (Shipping Tranche)', provider: 'Supranational / DFI', size: '200M+', tenor: '7–12yr', rate: 'Fixed 3.8–4.5%', trigger: 'IMO-aligned fleet', bestFor: 'Fleet transition' },
  { name: 'Carbon Levy Revenue (FuelEU)', provider: 'EU / IMO', size: 'Variable', tenor: 'Ongoing', rate: '$100–200/tCO₂', trigger: 'Non-compliance penalty', bestFor: 'Compliance cost mgmt' },
];

const CII_TRANSITION = [
  { year: 2023, A: 8, B: 22, C: 38, D: 21, E: 11 },
  { year: 2024, A: 10, B: 24, C: 36, D: 20, E: 10 },
  { year: 2025, A: 13, B: 26, C: 35, D: 18, E: 8 },
  { year: 2026, A: 16, B: 28, C: 34, D: 16, E: 6 },
  { year: 2027, A: 20, B: 30, C: 32, D: 13, E: 5 },
  { year: 2028, A: 25, B: 32, C: 30, D: 10, E: 3 },
];

const TABS = ['Overview', 'Fleet Segments', 'Alternative Fuels', 'IMO 2050 Trajectory', 'CII/EEXI Compliance', 'Finance Instruments', 'Retrofit Calculator', 'Poseidon Principles', 'Carbon Levy', 'Deal Pipeline'];

function calcRetrofitPayback({ vesselValue, retrofitCost, annFuelSaving, carbonPriceSaving }) {
  const totalSaving = annFuelSaving + carbonPriceSaving;
  return totalSaving > 0 ? retrofitCost / totalSaving : 999;
}
function calcCiiScore({ actualAer, referenceAer }) {
  return referenceAer > 0 ? (actualAer / referenceAer) * 100 : 100;
}
function calcCarbonLevy({ co2Tonnes, levyPerTonne }) {
  return co2Tonnes * levyPerTonne;
}

const Kpi = ({ label, value, sub, color }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: '14px 18px', flex: 1, minWidth: 140 }}>
    <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.gold, fontFamily: T.mono }}>{value}</div>
    {sub && <div style={{ fontSize: 10, color: T.textSec, marginTop: 3 }}>{sub}</div>}
  </div>
);

export default function ShippingDecarbonizationFinancePage() {
  const [tab, setTab] = useState(0);
  const [selSegment, setSelSegment] = useState('container');
  const [retrofitCapex, setRetrofitCapex] = useState(8);
  const [annFuelSaving, setAnnFuelSaving] = useState(1.2);
  const [carbonPrice, setCarbonPrice] = useState(120);
  const [vesselCo2, setVesselCo2] = useState(8500);
  const [selFuel, setSelFuel] = useState(0);

  const seg = FLEET_SEGMENTS.find(s => s.id === selSegment) || FLEET_SEGMENTS[0];
  const fuel = ALT_FUELS[selFuel];
  const carbonPriceSaving = calcCarbonLevy({ co2Tonnes: vesselCo2 * 0.3, levyPerTonne: carbonPrice }) / 1e6;
  const payback = calcRetrofitPayback({ vesselValue: seg.transitionCapex * 0.6, retrofitCost: retrofitCapex, annFuelSaving, carbonPriceSaving });
  const totalFleetCo2 = FLEET_SEGMENTS.reduce((s, f) => s + f.co2MtYear, 0);
  const globalShippingCo2 = 1080;
  const avgEexiCompliance = FLEET_SEGMENTS.length > 0 ? FLEET_SEGMENTS.reduce((s, f) => s + f.eexiCompliant, 0) / FLEET_SEGMENTS.length : 0;

  const ciiColor = (r) => ({ A: T.green, B: T.sage, C: T.amber, D: '#ff9800', E: T.red }[r] || T.textMut);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: T.font, color: T.text, padding: 24 }}>
      <div style={{ borderBottom: `2px solid ${T.gold}`, paddingBottom: 12, marginBottom: 20 }}>
        <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, letterSpacing: 2 }}>EP-DZ2 · OCEAN & BLUE ECONOMY FINANCE</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: '4px 0', color: T.text }}>Shipping Decarbonization Finance Engine</h1>
        <div style={{ fontSize: 12, color: T.textSec }}>IMO 2050 · CII/EEXI Compliance · Alt-Fuel Economics · Poseidon Principles · FuelEU · Fleet Transition Finance · 10 Tabs</div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <Kpi label="GLOBAL SHIPPING CO₂" value={`${globalShippingCo2}Mt/yr`} sub="~2.9% of global GHG" />
        <Kpi label="FLEET CO₂ TRACKED" value={`${totalFleetCo2}Mt/yr`} sub="6 segments analysed" color={T.amber} />
        <Kpi label="EEXI COMPLIANCE" value={`${avgEexiCompliance.toFixed(0)}%`} sub="Fleet avg, 2025" color={avgEexiCompliance > 70 ? T.green : T.red} />
        <Kpi label="ALT-FUEL READY" value="22%" sub="Global newbuild orders" color={T.teal} />
        <Kpi label="2050 IMO TARGET" value="Net Zero" sub="GHG vs 2008 baseline" color={T.sage} />
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{ padding: '6px 14px', borderRadius: 4, border: `1px solid ${tab === i ? T.gold : T.border}`, background: tab === i ? T.navy : T.surface, color: tab === i ? T.gold : T.textSec, fontFamily: T.mono, fontSize: 11, cursor: 'pointer' }}>{t}</button>
        ))}
      </div>

      {tab === 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 12 }}>IMO 2050 GHG TRAJECTORY (Index: 2020=100)</div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={IMO_TRAJECTORY}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="year" stroke={T.textMut} tick={{ fontSize: 10 }} /><YAxis stroke={T.textMut} tick={{ fontSize: 10 }} /><Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6 }} /><Legend /><Line type="monotone" dataKey="baselineGhg" stroke={T.red} strokeWidth={2} dot={false} name="BAU Baseline" strokeDasharray="5 5" /><Line type="monotone" dataKey="imo2050Target" stroke={T.green} strokeWidth={2} dot={false} name="IMO 2050 Target" /><Line type="monotone" dataKey="achievedGhg" stroke={T.teal} strokeWidth={2} name="Achieved" /></LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 12 }}>CII FLEET DISTRIBUTION (2023→2028)</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={CII_TRANSITION}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="year" stroke={T.textMut} tick={{ fontSize: 10 }} /><YAxis stroke={T.textMut} tick={{ fontSize: 10 }} /><Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6 }} /><Legend /><Bar dataKey="A" stackId="a" fill={T.green} name="A" /><Bar dataKey="B" stackId="a" fill={T.sage} name="B" /><Bar dataKey="C" stackId="a" fill={T.amber} name="C" /><Bar dataKey="D" stackId="a" fill="#ff9800" name="D" /><Bar dataKey="E" stackId="a" fill={T.red} name="E" /></BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, gridColumn: '1/-1' }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 12 }}>FLEET SEGMENT SNAPSHOT</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {FLEET_SEGMENTS.map((seg, i) => (
                <div key={i} style={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6, padding: 12 }}>
                  <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold }}>{seg.name}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                    <div><div style={{ fontSize: 10, color: T.textMut }}>CO₂</div><div style={{ fontSize: 16, fontWeight: 700, color: T.text, fontFamily: T.mono }}>{seg.co2MtYear}Mt</div></div>
                    <div><div style={{ fontSize: 10, color: T.textMut }}>CII</div><div style={{ fontSize: 16, fontWeight: 700, color: ciiColor(seg.ciiRating), fontFamily: T.mono }}>{seg.ciiRating}</div></div>
                    <div><div style={{ fontSize: 10, color: T.textMut }}>EEXI</div><div style={{ fontSize: 16, fontWeight: 700, color: seg.eexiCompliant > 70 ? T.green : T.amber, fontFamily: T.mono }}>{seg.eexiCompliant}%</div></div>
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
            {FLEET_SEGMENTS.map(s => (
              <button key={s.id} onClick={() => setSelSegment(s.id)} style={{ padding: '6px 12px', borderRadius: 4, border: `1px solid ${selSegment === s.id ? T.gold : T.border}`, background: selSegment === s.id ? T.navy : T.surface, color: selSegment === s.id ? T.gold : T.text, fontFamily: T.mono, fontSize: 11, cursor: 'pointer' }}>{s.name}</button>
            ))}
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontFamily: T.mono, fontSize: 13, color: T.gold, marginBottom: 16 }}>{seg.name}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
              <Kpi label="FLEET COUNT" value={seg.count.toLocaleString()} sub={`Avg DWT: ${(seg.avgDwt/1000).toFixed(0)}K`} />
              <Kpi label="CO₂/YR" value={`${seg.co2MtYear}Mt`} sub="Annual fleet emissions" color={T.amber} />
              <Kpi label="CII RATING" value={seg.ciiRating} sub="2025 avg" color={ciiColor(seg.ciiRating)} />
              <Kpi label="TRANSITION CAPEX" value={`$${seg.transitionCapex}M/vessel`} sub={`Gov subsidy: $${seg.govtSubsidy}M`} color={T.teal} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ background: T.surfaceH, borderRadius: 6, padding: 14 }}>
                <div style={{ fontSize: 11, color: T.textMut, marginBottom: 8, fontFamily: T.mono }}>COMPLIANCE STATUS</div>
                {[['EEXI Compliant', seg.eexiCompliant, T.green], ['Alt-Fuel Ready', seg.altFuelReady, T.teal]].map(([label, val, color]) => (
                  <div key={label} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.textSec, marginBottom: 4 }}><span>{label}</span><span style={{ color, fontFamily: T.mono }}>{val}%</span></div>
                    <div style={{ background: T.borderL, borderRadius: 4, height: 6 }}><div style={{ background: color, width: `${val}%`, height: 6, borderRadius: 4 }} /></div>
                  </div>
                ))}
              </div>
              <div style={{ background: T.surfaceH, borderRadius: 6, padding: 14 }}>
                <div style={{ fontSize: 11, color: T.textMut, marginBottom: 8, fontFamily: T.mono }}>TRANSITION FINANCING NEED</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: T.gold, fontFamily: T.mono }}>${(seg.count * seg.transitionCapex / 1000).toFixed(0)}Bn</div>
                <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>Full fleet transition · Govt subsidy: ${(seg.count * seg.govtSubsidy / 1000).toFixed(1)}Bn</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {ALT_FUELS.map((f, i) => (
              <button key={i} onClick={() => setSelFuel(i)} style={{ padding: '6px 12px', borderRadius: 4, border: `1px solid ${selFuel === i ? T.gold : T.border}`, background: selFuel === i ? T.navy : T.surface, color: selFuel === i ? T.gold : T.text, fontFamily: T.mono, fontSize: 11, cursor: 'pointer' }}>{f.fuel.split(' ')[0]}</button>
            ))}
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontFamily: T.mono, fontSize: 13, color: fuel.color, marginBottom: 14 }}>{fuel.fuel}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              <Kpi label="ENERGY DENSITY" value={`${fuel.energyDensity} MJ/kg`} sub="LHV basis" />
              <Kpi label="GWP-100" value={`${fuel.gwp100} tCO₂e/t`} sub="Well-to-wake" color={fuel.gwp100 === 0 ? T.green : T.amber} />
              <Kpi label="READINESS (1-10)" value={fuel.readiness} sub={fuel.bunkering} color={fuel.readiness >= 7 ? T.green : fuel.readiness >= 5 ? T.amber : T.red} />
              <Kpi label="COST PREMIUM" value={`${fuel.costPremium}×`} sub="vs HFO baseline" color={fuel.costPremium > 3 ? T.red : T.amber} />
            </div>
            <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
              <div style={{ background: T.surfaceH, borderRadius: 6, padding: 12, flex: 1 }}>
                <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono }}>IMO APPROVED</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: fuel.imoApproved ? T.green : T.amber, fontFamily: T.mono, marginTop: 4 }}>{fuel.imoApproved ? 'YES' : 'PENDING'}</div>
              </div>
              <div style={{ background: T.surfaceH, borderRadius: 6, padding: 12, flex: 1 }}>
                <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono }}>OPERATIONAL RANGE</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: T.teal, fontFamily: T.mono, marginTop: 4 }}>{fuel.range}</div>
              </div>
            </div>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 12 }}>TECHNOLOGY READINESS COMPARISON</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ALT_FUELS}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="fuel" stroke={T.textMut} tick={{ fontSize: 9 }} /><YAxis stroke={T.textMut} tick={{ fontSize: 10 }} domain={[0, 10]} /><Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6 }} /><Bar dataKey="readiness" fill={T.teal} name="Readiness (1-10)" /></BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 12 }}>IMO 2050 DECARBONIZATION PATHWAY</div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={IMO_TRAJECTORY}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="year" stroke={T.textMut} tick={{ fontSize: 10 }} /><YAxis stroke={T.textMut} tick={{ fontSize: 10 }} /><Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6 }} /><Legend /><ReferenceLine y={50} stroke={T.amber} strokeDasharray="3 3" label={{ value: '50% by 2035', fill: T.amber, fontSize: 10 }} /><Line type="monotone" dataKey="baselineGhg" stroke={T.red} strokeWidth={2} dot={false} name="BAU (no action)" strokeDasharray="6 3" /><Line type="monotone" dataKey="imo2050Target" stroke={T.green} strokeWidth={3} dot={{ fill: T.green, r: 4 }} name="IMO 2050 Target" /><Line type="monotone" dataKey="achievedGhg" stroke={T.teal} strokeWidth={2} name="Achieved" /></LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[['2030 Milestone', '-20% GHG vs 2008', T.amber, 'Stranded risk for D/E vessels'], ['2040 Milestone', '-70% GHG vs 2008', '#ff9800', 'Majority alt-fuel fleet required'], ['2050 Goal', 'Net Zero GHG', T.green, 'Full decarbonization · Zero fossil fuel']].map(([yr, target, color, note]) => (
              <div key={yr} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <div style={{ fontFamily: T.mono, fontSize: 12, color }}>{yr}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color, fontFamily: T.mono, marginTop: 6 }}>{target}</div>
                <div style={{ fontSize: 11, color: T.textSec, marginTop: 8 }}>{note}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 4 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 12 }}>CII FLEET DISTRIBUTION EVOLUTION (%)</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={CII_TRANSITION}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="year" stroke={T.textMut} tick={{ fontSize: 10 }} /><YAxis stroke={T.textMut} tick={{ fontSize: 10 }} /><Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6 }} /><Legend /><Bar dataKey="A" stackId="a" fill={T.green} /><Bar dataKey="B" stackId="a" fill={T.sage} /><Bar dataKey="C" stackId="a" fill={T.amber} /><Bar dataKey="D" stackId="a" fill="#ff9800" /><Bar dataKey="E" stackId="a" fill={T.red} /></BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {FLEET_SEGMENTS.map((s, i) => (
              <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 14 }}>
                <div style={{ fontFamily: T.mono, fontSize: 11, color: T.textSec }}>{s.name}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: ciiColor(s.ciiRating), fontFamily: T.mono, marginTop: 6 }}>CII {s.ciiRating}</div>
                <div style={{ fontSize: 11, color: T.textMut, marginTop: 4 }}>EEXI: {s.eexiCompliant}% compliant</div>
              </div>
            ))}
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                {[['SIZE', fi.size], ['TENOR', fi.tenor], ['RATE', fi.rate], ['TRIGGER', fi.trigger]].map(([label, val]) => (
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
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 16 }}>RETROFIT INVESTMENT CALCULATOR</div>
            {[['Retrofit Capex ($M)', retrofitCapex, setRetrofitCapex, 1, 50], ['Annual Fuel Saving ($M)', annFuelSaving, setAnnFuelSaving, 0.1, 5, 0.1], ['Carbon Price ($/tCO₂)', carbonPrice, setCarbonPrice, 20, 300], ['Vessel Annual CO₂ (tonnes)', vesselCo2, setVesselCo2, 1000, 50000, 500]].map(([label, val, set, min, max, step = 1]) => (
              <div key={label} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: T.textMut, marginBottom: 4, fontFamily: T.mono }}>{label}: <span style={{ color: T.gold }}>{val}</span></div>
                <input type="range" min={min} max={max} step={step} value={val} onChange={e => set(Number(e.target.value))} style={{ width: '100%', accentColor: T.gold }} />
              </div>
            ))}
            <div style={{ background: T.navy, borderRadius: 8, padding: 16, marginTop: 8 }}>
              <div style={{ fontFamily: T.mono, fontSize: 11, color: T.textMut, marginBottom: 8 }}>RETROFIT RETURNS</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div><div style={{ fontSize: 10, color: T.textMut }}>Carbon Levy Saving</div><div style={{ fontSize: 18, fontWeight: 700, color: T.green, fontFamily: T.mono }}>${carbonPriceSaving.toFixed(2)}M/yr</div></div>
                <div><div style={{ fontSize: 10, color: T.textMut }}>Total Annual Saving</div><div style={{ fontSize: 18, fontWeight: 700, color: T.teal, fontFamily: T.mono }}>${(annFuelSaving + carbonPriceSaving).toFixed(2)}M/yr</div></div>
                <div><div style={{ fontSize: 10, color: T.textMut }}>Simple Payback</div><div style={{ fontSize: 18, fontWeight: 700, color: payback < 7 ? T.green : payback < 12 ? T.amber : T.red, fontFamily: T.mono }}>{payback > 50 ? '>50' : payback.toFixed(1)} yrs</div></div>
                <div><div style={{ fontSize: 10, color: T.textMut }}>CO₂ Avoided</div><div style={{ fontSize: 18, fontWeight: 700, color: T.gold, fontFamily: T.mono }}>{(vesselCo2 * 0.3 / 1000).toFixed(1)}Kt/yr</div></div>
              </div>
            </div>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 12 }}>SEGMENT TRANSITION CAPEX ($Bn)</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={FLEET_SEGMENTS}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="name" stroke={T.textMut} tick={{ fontSize: 8 }} /><YAxis stroke={T.textMut} tick={{ fontSize: 10 }} /><Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6 }} /><Bar dataKey="transitionCapex" fill={T.teal} name="Capex/vessel ($M)" /></BarChart>
            </ResponsiveContainer>
            <div style={{ marginTop: 16, background: T.surfaceH, borderRadius: 6, padding: 12 }}>
              <div style={{ fontFamily: T.mono, fontSize: 11, color: T.textMut, marginBottom: 8 }}>FINANCING SPLIT ESTIMATE</div>
              {[['Bank Debt (60%)', T.teal], ['ECA / DFI (25%)', T.sage], ['Equity (10%)', T.gold], ['Gov Grants (5%)', T.green]].map(([label, color]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.text, marginBottom: 5 }}>
                  <span>{label}</span><span style={{ color, fontFamily: T.mono }}>✓</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 7 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontFamily: T.mono, fontSize: 13, color: T.gold, marginBottom: 8 }}>Poseidon Principles — IMO Trajectory Alignment</div>
            <div style={{ fontSize: 12, color: T.textSec, marginBottom: 16 }}>30+ signatory banks · $185Bn+ ship finance portfolio · Annual climate alignment disclosure</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[['Alignment Score', '+2.3%', T.red, 'Above IMO trajectory'], ['Signatory Banks', '32', T.gold, 'As of 2025'], ['Portfolio Covered', '$185Bn', T.teal, 'Signatory ship finance'], ['Annual Disclosure', 'Required', T.green, 'Vessel-level reporting'], ['Threshold', 'IMO 2050', T.sage, 'Annual trajectory'], ['Penalty', 'Reputational', T.amber, 'No financial penalty yet']].map(([label, val, color, sub]) => (
                <div key={label} style={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6, padding: 14 }}>
                  <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono }}>{label}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color, fontFamily: T.mono, marginTop: 4 }}>{val}</div>
                  <div style={{ fontSize: 10, color: T.textSec, marginTop: 4 }}>{sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 8 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 16 }}>CARBON LEVY CALCULATOR (FuelEU / IMO GHG Levy)</div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: T.textMut, marginBottom: 4, fontFamily: T.mono }}>Carbon Price ($/tCO₂): <span style={{ color: T.gold }}>{carbonPrice}</span></div>
              <input type="range" min={20} max={300} value={carbonPrice} onChange={e => setCarbonPrice(Number(e.target.value))} style={{ width: '100%', accentColor: T.gold }} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: T.textMut, marginBottom: 4, fontFamily: T.mono }}>Vessel CO₂ (t/yr): <span style={{ color: T.gold }}>{vesselCo2.toLocaleString()}</span></div>
              <input type="range" min={1000} max={50000} step={500} value={vesselCo2} onChange={e => setVesselCo2(Number(e.target.value))} style={{ width: '100%', accentColor: T.gold }} />
            </div>
            <div style={{ background: T.navy, borderRadius: 8, padding: 16 }}>
              <div style={{ fontFamily: T.mono, fontSize: 11, color: T.textMut, marginBottom: 10 }}>LEVY EXPOSURE</div>
              {[['Annual Levy (HFO)', calcCarbonLevy({ co2Tonnes: vesselCo2, levyPerTonne: carbonPrice })], ['Annual Levy (LNG, -20%)', calcCarbonLevy({ co2Tonnes: vesselCo2 * 0.8, levyPerTonne: carbonPrice })], ['Annual Levy (Green MeOH, -95%)', calcCarbonLevy({ co2Tonnes: vesselCo2 * 0.05, levyPerTonne: carbonPrice })]].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 8 }}>
                  <span style={{ color: T.textSec }}>{label}</span>
                  <span style={{ color: T.gold, fontFamily: T.mono }}>${(val / 1000).toFixed(0)}K/yr</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 12 }}>LEVY SENSITIVITY ($/tCO₂ × Fleet Segment)</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={FLEET_SEGMENTS}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="name" stroke={T.textMut} tick={{ fontSize: 8 }} /><YAxis stroke={T.textMut} tick={{ fontSize: 10 }} /><Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6 }} /><Bar dataKey="co2MtYear" fill={T.amber} name="Fleet CO₂ (Mt/yr)" /></BarChart>
            </ResponsiveContainer>
            <div style={{ marginTop: 12, background: T.surfaceH, borderRadius: 6, padding: 12 }}>
              <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono, marginBottom: 6 }}>ESTIMATED TOTAL FLEET LEVY AT ${carbonPrice}/tCO₂</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: T.red, fontFamily: T.mono }}>${(totalFleetCo2 * carbonPrice / 1000).toFixed(0)}Bn/yr</div>
              <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>Across 6 tracked segments</div>
            </div>
          </div>
        </div>
      )}

      {tab === 9 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 12 }}>LIVE DEAL PIPELINE — SHIPPING DECARBONIZATION FINANCE</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead><tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {['Borrower', 'Segment', 'Instrument', 'Size', 'Fuel', 'Status', 'Close'].map(h => <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.textMut, fontFamily: T.mono }}>{h}</th>)}
              </tr></thead>
              <tbody>{[
                ['Maersk A/S', 'Container', 'Green Ship Loan', '$1.2Bn', 'Green Methanol', 'SIGNED', 'Q2 2025'],
                ['CSCL Shipping', 'Container', 'ECA / KEXIM', '$800M', 'LNG + Alt-Fuel Ready', 'CLOSED', 'Q4 2024'],
                ['Carnival Corp', 'Cruise', 'Blue Bond', '$500M', 'LNG + Shore Power', 'MARKETING', 'Q3 2025'],
                ['Pacific Carriers', 'Bulk', 'Poseidon Loan', '$220M', 'Wind-Assist + EEXI', 'MANDATE', 'Q3 2025'],
                ['Stena Line', 'RoRo', 'IFC Green Loan', '$180M', 'Bio-LNG', 'DUE DILIGENCE', 'Q4 2025'],
                ['NYK Line', 'Tanker', 'JBIC ECA', '$650M', 'Ammonia-Ready', 'SIGNED', 'Q1 2025'],
              ].map(([borrower, seg, inst, size, fuel, status, close], i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${T.borderL}`, background: i % 2 === 0 ? 'transparent' : T.surfaceH }}>
                  <td style={{ padding: '8px 10px', color: T.gold, fontFamily: T.mono }}>{borrower}</td>
                  <td style={{ padding: '8px 10px', color: T.text }}>{seg}</td>
                  <td style={{ padding: '8px 10px', color: T.textSec }}>{inst}</td>
                  <td style={{ padding: '8px 10px', color: T.amber, fontFamily: T.mono }}>{size}</td>
                  <td style={{ padding: '8px 10px', color: T.teal }}>{fuel}</td>
                  <td style={{ padding: '8px 10px', color: status === 'SIGNED' || status === 'CLOSED' ? T.green : T.amber, fontFamily: T.mono }}>{status}</td>
                  <td style={{ padding: '8px 10px', color: T.textSec }}>{close}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
