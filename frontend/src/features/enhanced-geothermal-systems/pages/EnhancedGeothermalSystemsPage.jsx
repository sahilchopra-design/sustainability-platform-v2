import React, { useState, useMemo } from "react";
import { BarChart, Bar, LineChart, Line, AreaChart, Area, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine } from "recharts";

const T = {
  bg: "#0f1117", surface: "#1a1d27", surfaceH: "#22263a", border: "#2a2f45",
  navy: "#1e3a5f", navyL: "#2a4a6f", gold: "#d4a843",
  sage: "#2d6a4f", teal: "#0d4f5c", text: "#e8e0d0",
  textSec: "#a89880", textMut: "#6b6050", red: "#c0392b", green: "#27ae60",
  amber: "#e67e22", font: "'DM Sans', sans-serif", mono: "'JetBrains Mono', monospace",
};

const sr = s => { const x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

function calcEgsLcoe({ depthKm, numWellPairs, surfaceAreaKm2, wellCostPerKm,
  stimCostPerWell, powerMw, opexMwyr, wacc, lifetime, cf }) {
  const w = wacc / 100;
  const wellCost = depthKm * wellCostPerKm * 1e6 * 2; // injection + production
  const totalDrill = numWellPairs * wellCost;
  const totalStim  = numWellPairs * stimCostPerWell * 1e6;
  const surfacePlant = powerMw * 1.8e6; // $1.8M/MW ORC plant
  const totalCapex = totalDrill + totalStim + surfacePlant;
  const annMwh = powerMw * cf / 100 * 8760;
  if (annMwh <= 0 || w <= 0) return { lcoe: 0, totalCapex };
  const capexAnn = totalCapex * w / (1 - Math.pow(1 + w, -lifetime));
  const opexAnn  = opexMwyr * powerMw * 1000;
  return { lcoe: +((capexAnn + opexAnn) / annMwh).toFixed(4), totalCapex };
}

function irr(cashflows, guess = 0.08) {
  let r = guess;
  for (let i = 0; i < 200; i++) {
    const f  = cashflows.reduce((s, cf, t) => s + cf / Math.pow(1 + r, t), 0);
    const df = cashflows.reduce((s, cf, t) => s - t * cf / Math.pow(1 + r, t + 1), 0);
    if (Math.abs(df) < 1e-12) break;
    const nr = r - f / df;
    if (Math.abs(nr - r) < 1e-8) { r = nr; break; }
    r = nr;
  }
  return isFinite(r) ? r : 0;
}

const EGS_PROJECTS = [
  { name: "Fervo Cape Station", location: "Utah, USA", mw: 400, depth: 3.5, temp: 195, stage: "Construction", capex: 2000, tech: "Horizontal EGS", partner: "Google / NextEra" },
  { name: "Quaise Energy Demo", location: "Massachusetts, USA", mw: 1, depth: 5.0, temp: 250, stage: "Pilot", capex: 12, tech: "Millimeter-wave drilling", partner: "ARPA-E / MIT" },
  { name: "Eavor Loop (Alberta)", location: "Alberta, Canada", mw: 5, depth: 4.5, temp: 150, stage: "Pilot", capex: 40, tech: "Closed-loop AGS", partner: "BP / Chevron" },
  { name: "Eavor Geretsried", location: "Bavaria, Germany", mw: 8, depth: 5.0, temp: 170, stage: "Construction", capex: 85, tech: "Closed-loop AGS", partner: "E.ON / EU Horizon" },
  { name: "Soultz-sous-Forêts", location: "France/Germany", mw: 1.7, depth: 5.0, temp: 200, stage: "Operating", capex: 60, tech: "Classic EGS", partner: "GEIE / EU research" },
  { name: "Desert Peak (NV)", location: "Nevada, USA", mw: 1, depth: 3.0, temp: 185, stage: "Completed", capex: 44, tech: "EGS Enhancement", partner: "DOE / Ormat" },
  { name: "Cornwall Hot Rocks", location: "UK", mw: 1, depth: 4.5, temp: 190, stage: "Pilot", capex: 30, tech: "Classic EGS", partner: "GreenFire Energy" },
  { name: "FORGE (Milford, UT)", location: "Utah, USA", mw: 0, depth: 2.6, temp: 225, stage: "R&D", capex: 220, tech: "DOE Research", partner: "DOE / University of Utah" },
];

const STIMULATION_TECHNIQUES = [
  { name: "Hydraulic Fracturing", cost: 2.5, risk: "Moderate", effectiveness: 85, seismicRisk: "Medium", suitable: "Hard crystalline rock" },
  { name: "Thermal Stimulation", cost: 0.8, risk: "Low", effectiveness: 60, seismicRisk: "Low", suitable: "High-temp reservoirs" },
  { name: "Chemical Stimulation", cost: 1.2, risk: "Low-Moderate", effectiveness: 70, seismicRisk: "Low", suitable: "Carbonate-rich formations" },
  { name: "Proppant Injection",   cost: 3.0, risk: "Moderate", effectiveness: 90, seismicRisk: "Medium-High", suitable: "Tight sedimentary" },
  { name: "Rotary Jetting",       cost: 1.5, risk: "Low", effectiveness: 65, seismicRisk: "Very Low", suitable: "Soft formations" },
];

const GEOVIVSION_SCENARIOS = [
  { scenario: "Baseline (No Tech Progress)", costReduction: 0, lcoe2050: 140, capacity: 60, investment: 30 },
  { scenario: "EGS Technology Advance", costReduction: 30, lcoe2050: 70, capacity: 120, investment: 80 },
  { scenario: "Superhot Rock (SHR)", costReduction: 50, lcoe2050: 40, capacity: 300, investment: 250 },
  { scenario: "Closed-Loop AGS Scale", costReduction: 35, lcoe2050: 65, capacity: 200, investment: 160 },
];

const TABS = [
  "EGS Overview", "Cost Model", "Well Design", "Stimulation", "Flow Rate Risk",
  "GeoVision Scenarios", "Project Database", "Learning Curve", "vs. Conventional", "Investment Case"
];

const KpiCard = ({ label, value, unit, sub, color }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: "14px 18px" }}>
    <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: color || T.gold, fontFamily: T.mono, marginTop: 4 }}>{value}<span style={{ fontSize: 13, marginLeft: 4, color: T.textSec }}>{unit}</span></div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{sub}</div>}
  </div>
);

const Slider = ({ label, value, min, max, step, onChange, unit, fmt }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
      <span style={{ fontSize: 12, color: T.textSec }}>{label}</span>
      <span style={{ fontSize: 12, fontFamily: T.mono, color: T.gold }}>{fmt ? fmt(value) : value}{unit}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))}
      style={{ width: "100%", accentColor: T.gold }} />
  </div>
);

export default function EnhancedGeothermalSystemsPage() {
  const [tab, setTab] = useState(0);
  const [depth, setDepth]         = useState(4.5);
  const [wellPairs, setWellPairs] = useState(4);
  const [powerMw, setPowerMw]     = useState(10);
  const [wellCostKm, setWellCostKm] = useState(2.5);
  const [stimCost, setStimCost]   = useState(2.5);
  const [opex, setOpex]           = useState(45);
  const [wacc, setWacc]           = useState(10);
  const [lifetime, setLifetime]   = useState(25);
  const [cf, setCf]               = useState(88);
  const [ppa, setPpa]             = useState(120);
  const [flowRate, setFlowRate]   = useState(60);
  const [temp, setTemp]           = useState(200);

  const { lcoe, totalCapex } = useMemo(() => calcEgsLcoe({
    depthKm: depth, numWellPairs: wellPairs, surfaceAreaKm2: 2,
    wellCostPerKm: wellCostKm, stimCostPerWell: stimCost,
    powerMw, opexMwyr: opex, wacc, lifetime, cf
  }), [depth, wellPairs, powerMw, wellCostKm, stimCost, opex, wacc, lifetime, cf]);

  const annMwh = powerMw * cf / 100 * 8760;
  const revMyr = annMwh * ppa / 1e6;
  const egsIrr = useMemo(() => irr([-totalCapex / 1e6, ...Array(lifetime).fill(revMyr - opex * powerMw * 1000 / 1e6)]) * 100, [totalCapex, revMyr, opex, powerMw, lifetime]);

  const drillCost = wellPairs * depth * wellCostKm * 2;
  const stimTotalCost = wellPairs * stimCost;
  const plantCost = powerMw * 1.8;

  const wellCostByCurve = useMemo(() => {
    return Array.from({ length: 15 }, (_, i) => {
      const d = 1 + i * 0.5;
      const c = +(d * wellCostKm * (1 + d * 0.05)).toFixed(1);
      return { depth: d, cost: c };
    });
  }, [wellCostKm]);

  const flowRiskData = useMemo(() => Array.from({ length: 20 }, (_, i) => {
    const flowVar = flowRate * (0.5 + sr(i * 7) * 0.8);
    const tempVar = temp * (0.92 + sr(i * 13) * 0.16);
    const powerOut = flowVar * 4.2 * (tempVar - 70) / 3600 * 0.1;
    return { path: i + 1, flow: +flowVar.toFixed(0), temp: +tempVar.toFixed(0), power: +powerOut.toFixed(1) };
  }), [flowRate, temp]);

  const powerRange = flowRiskData.length > 0 ? {
    min: Math.min(...flowRiskData.map(d => d.power)),
    max: Math.max(...flowRiskData.map(d => d.power)),
    mean: flowRiskData.reduce((s, d) => s + d.power, 0) / flowRiskData.length,
  } : { min: 0, max: 0, mean: 0 };

  const learningCurve = useMemo(() => Array.from({ length: 15 }, (_, i) => {
    const nProjects = (i + 1) * 3;
    const reduction = Math.pow(nProjects / 3, -Math.log2(1 / 0.85));
    return { projects: nProjects, lcoe: +(lcoe * 1000 * reduction).toFixed(1) };
  }), [lcoe]);

  const scenarios2050 = useMemo(() => GEOVIVSION_SCENARIOS.map(s => ({
    ...s,
    baselineLcoe: lcoe * 1000,
    projectedLcoe: +(lcoe * 1000 * (1 - s.costReduction / 100)).toFixed(1),
  })), [lcoe]);

  const styles = {
    page: { background: T.bg, minHeight: "100vh", fontFamily: T.font, color: T.text, padding: 24 },
    header: { borderBottom: `2px solid ${T.gold}`, paddingBottom: 16, marginBottom: 24 },
    tabs: { display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 24 },
    tab: (a) => ({ padding: "8px 14px", borderRadius: 6, fontSize: 12, cursor: "pointer", fontFamily: T.mono,
      background: a ? T.gold : T.surface, color: a ? "#000" : T.textSec, border: `1px solid ${a ? T.gold : T.border}` }),
    grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
    grid4: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 },
    grid3: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 },
    panel: { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 16 },
    h3: { fontSize: 13, fontFamily: T.mono, color: T.gold, marginBottom: 14, textTransform: "uppercase", letterSpacing: 1 },
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={{ fontSize: 11, color: T.gold, fontFamily: T.mono, letterSpacing: 2, marginBottom: 6 }}>EP-DV3 · GEOTHERMAL ENERGY FINANCE</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Enhanced Geothermal Systems (EGS) Finance</h1>
        <div style={{ fontSize: 13, color: T.textSec, marginTop: 6 }}>EGS Cost Model · Stimulation Economics · Flow Rate Risk · DOE GeoVision · Closed-Loop AGS · Superhot Rock</div>
      </div>

      <div style={styles.tabs}>
        {TABS.map((t, i) => <button key={t} style={styles.tab(tab === i)} onClick={() => setTab(i)}>{t}</button>)}
      </div>

      {tab === 0 && (
        <div>
          <div style={styles.grid3}>
            <KpiCard label="Global EGS Installed" value="~3" unit="GW" sub="Operational + pilot projects, 2024E" />
            <KpiCard label="DOE GeoVision Target" value="120" unit="GW" sub="US EGS by 2050 (tech advance)" color={T.green} />
            <KpiCard label="Superhot Rock Potential" value=">100" unit="TW" sub="Theoretical global resource base" color={T.amber} />
          </div>
          <div style={styles.panel}>
            <div style={styles.h3}>What is EGS?</div>
            <div style={{ fontSize: 13, color: T.textSec, lineHeight: 1.8 }}>
              Enhanced Geothermal Systems (EGS) create or improve geothermal reservoirs in hot dry rock where natural permeability is insufficient.
              Water is injected into stimulated fracture networks, heated by the rock, and extracted via production wells to generate electricity.
            </div>
            <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {[
                { title: "Classic EGS", desc: "Hydraulic stimulation of hot dry rock. Soultz-sous-Forêts (France), FORGE (USA). Seismic risk moderate." },
                { title: "Closed-Loop AGS", desc: "No reservoir contact — fluid circulates in sealed wellbore network. Eavor Loop. Near-zero seismic risk." },
                { title: "Superhot Rock (SHR)", desc: ">374°C, >220 bar supercritical fluid. 10-100× power per well. Millimeter-wave drilling (Quaise)." },
              ].map(c => (
                <div key={c.title} style={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6, padding: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.gold, marginBottom: 6 }}>{c.title}</div>
                  <div style={{ fontSize: 12, color: T.textSec }}>{c.desc}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={styles.panel}>
            <div style={styles.h3}>EGS Cost Components vs. Conventional Geothermal</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={[
                { component: "Drilling", egs: +(drillCost).toFixed(0), conv: +(wellPairs * depth * 1.2 * 2).toFixed(0) },
                { component: "Stimulation", egs: +(stimTotalCost).toFixed(0), conv: 0 },
                { component: "Surface Plant", egs: +plantCost.toFixed(0), conv: +plantCost.toFixed(0) },
              ]} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="component" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} unit="$M" />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}` }} formatter={v => [`$${v}M`]} />
                <Legend />
                <Bar dataKey="egs" name="EGS" fill={T.gold} />
                <Bar dataKey="conv" name="Conventional" fill={T.teal} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div style={styles.grid2}>
          <div>
            <div style={styles.panel}>
              <div style={styles.h3}>EGS Cost Model</div>
              <Slider label="Drilling Depth" value={depth} min={2} max={8} step={0.25} onChange={setDepth} unit=" km" />
              <Slider label="Well Pairs (inj + prod)" value={wellPairs} min={1} max={12} step={1} onChange={setWellPairs} unit=" pairs" />
              <Slider label="Net Power Output" value={powerMw} min={1} max={50} step={1} onChange={setPowerMw} unit=" MW" />
              <Slider label="Well Cost (per km)" value={wellCostKm} min={1} max={8} step={0.25} onChange={setWellCostKm} unit=" $M/km" />
              <Slider label="Stimulation Cost (per well pair)" value={stimCost} min={0.5} max={10} step={0.25} onChange={setStimCost} unit=" $M" />
              <Slider label="O&M Cost" value={opex} min={20} max={100} step={5} onChange={setOpex} unit=" $/kW-yr" />
              <Slider label="WACC" value={wacc} min={6} max={18} step={0.5} onChange={setWacc} unit="%" />
              <Slider label="Lifetime" value={lifetime} min={15} max={40} step={5} onChange={setLifetime} unit=" yr" />
              <Slider label="Capacity Factor" value={cf} min={70} max={95} step={1} onChange={setCf} unit="%" />
              <Slider label="PPA Price" value={ppa} min={60} max={250} step={10} onChange={setPpa} unit=" $/MWh" />
            </div>
          </div>
          <div>
            <div style={styles.grid2}>
              <KpiCard label="EGS LCOE" value={(lcoe * 1000).toFixed(1)} unit="$/MWh" sub="Full lifecycle cost" />
              <KpiCard label="Total CAPEX" value={(totalCapex / 1e6).toFixed(0)} unit="$M" sub={`$${(totalCapex / powerMw / 1e6).toFixed(1)}M/MW`} color={T.amber} />
              <KpiCard label="Drilling Cost" value={drillCost.toFixed(0)} unit="$M" sub={`${wellPairs} pairs × ${depth}km`} />
              <KpiCard label="Stimulation" value={stimTotalCost.toFixed(1)} unit="$M" sub={`${wellPairs} well pairs`} color={T.teal} />
              <KpiCard label="Plant Cost" value={plantCost.toFixed(1)} unit="$M" sub={`ORC @ $1.8M/MW`} color={T.sage} />
              <KpiCard label="Project IRR" value={egsIrr.toFixed(1)} unit="%" sub={`@$${ppa}/MWh PPA`} color={egsIrr > 8 ? T.green : T.red} />
            </div>
            <div style={styles.panel}>
              <div style={styles.h3}>CAPEX Breakdown</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[
                  { name: "Drilling", val: +drillCost.toFixed(1) },
                  { name: "Stimulation", val: +stimTotalCost.toFixed(1) },
                  { name: "Surface Plant", val: +plantCost.toFixed(1) },
                ]} layout="vertical" margin={{ top: 5, right: 30, bottom: 5, left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: T.textSec }} unit="$M" />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: T.textSec }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}` }} formatter={v => [`$${v}M`]} />
                  <Bar dataKey="val" fill={T.gold} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 2 && (
        <div>
          <div style={styles.panel}>
            <div style={styles.h3}>Well Cost vs. Depth — Exponential Scaling Curve</div>
            <div style={{ fontSize: 12, color: T.textSec, marginBottom: 8 }}>
              Well costs increase non-linearly with depth due to temperature, pressure, and drilling time factors.
              Costs typically double from 3km to 6km depth.
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={wellCostByCurve} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="depth" tick={{ fontSize: 10, fill: T.textSec }} label={{ value: "Depth (km)", position: "insideBottom", offset: -10, fill: T.textSec, fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} label={{ value: "Well Cost ($M)", angle: -90, position: "insideLeft", fill: T.textSec, fontSize: 11 }} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}` }} formatter={v => [`$${v}M`]} />
                <Line type="monotone" dataKey="cost" name="Well Pair Cost ($M)" stroke={T.gold} strokeWidth={2} dot={false} />
                <ReferenceLine x={depth} stroke={T.amber} strokeDasharray="4 4" label={{ value: `Current ${depth}km`, fill: T.amber, fontSize: 10 }} />
                <ReferenceLine x={5} stroke={T.red} strokeDasharray="2 4" label={{ value: "Superhot Rock", fill: T.red, fontSize: 10 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={styles.grid2}>
            <div style={styles.panel}>
              <div style={styles.h3}>Temperature Gradient — Key Regions</div>
              {[
                { region: "Rift Zones (Kenya/Iceland)", gradient: "80-120°C/km", depth3km: "240-360°C", viability: "Excellent" },
                { region: "Volcanic Arcs (Indonesia)", gradient: "60-100°C/km", depth3km: "180-300°C", viability: "Very Good" },
                { region: "Basin & Range (USA West)", gradient: "50-80°C/km", depth3km: "150-240°C", viability: "Good" },
                { region: "Central Europe (Germany)", gradient: "30-40°C/km", depth3km: "90-120°C", viability: "Binary Only" },
                { region: "UK Granite Basement", gradient: "35-45°C/km", depth3km: "105-135°C", viability: "EGS Required" },
                { region: "Australian Craton", gradient: "25-35°C/km", depth3km: "75-105°C", viability: "Deep EGS (5km+)" },
              ].map((r, i) => (
                <div key={r.region} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${T.border}` }}>
                  <div>
                    <div style={{ fontSize: 12 }}>{r.region}</div>
                    <div style={{ fontSize: 11, color: T.textMut }}>{r.gradient}</div>
                  </div>
                  <div style={{ textAlign: "right", fontSize: 12 }}>
                    <div style={{ fontFamily: T.mono, color: T.gold }}>{r.depth3km}</div>
                    <div style={{ fontSize: 10, color: r.viability === "Excellent" ? T.green : r.viability.includes("Good") ? T.amber : T.teal }}>{r.viability}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={styles.panel}>
              <div style={styles.h3}>LCOE vs. Depth Sensitivity</div>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={Array.from({ length: 13 }, (_, i) => {
                  const d = 2 + i * 0.5;
                  const res = calcEgsLcoe({ depthKm: d, numWellPairs: wellPairs, surfaceAreaKm2: 2,
                    wellCostPerKm: wellCostKm, stimCostPerWell: stimCost,
                    powerMw, opexMwyr: opex, wacc, lifetime, cf });
                  return { depth: d, lcoe: +(res.lcoe * 1000).toFixed(1) };
                })} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="depth" tick={{ fontSize: 10, fill: T.textSec }} label={{ value: "Depth (km)", position: "insideBottom", offset: -10, fill: T.textSec, fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10, fill: T.textSec }} label={{ value: "LCOE ($/MWh)", angle: -90, position: "insideLeft", fill: T.textSec, fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}` }} />
                  <Line type="monotone" dataKey="lcoe" stroke={T.gold} strokeWidth={2} dot={false} />
                  <ReferenceLine x={depth} stroke={T.amber} strokeDasharray="4 4" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 3 && (
        <div style={styles.panel}>
          <div style={styles.h3}>Reservoir Stimulation Techniques — Cost & Risk Profile</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.gold}` }}>
                  {["Technique", "Cost ($M/well)", "Risk", "Effectiveness", "Seismic Risk", "Best Suited For"].map(h => (
                    <th key={h} style={{ padding: "7px 10px", textAlign: "left", color: T.gold, fontFamily: T.mono, fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {STIMULATION_TECHNIQUES.map((s, i) => (
                  <tr key={s.name} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 ? T.surfaceH : "transparent" }}>
                    <td style={{ padding: "7px 10px", color: T.text, fontWeight: 600 }}>{s.name}</td>
                    <td style={{ padding: "7px 10px", fontFamily: T.mono, color: T.gold }}>${s.cost}</td>
                    <td style={{ padding: "7px 10px", color: s.risk === "Low" ? T.green : s.risk === "Moderate" ? T.amber : T.red }}>{s.risk}</td>
                    <td style={{ padding: "7px 10px", fontFamily: T.mono }}>{s.effectiveness}%</td>
                    <td style={{ padding: "7px 10px", color: s.seismicRisk.includes("Very Low") ? T.green : s.seismicRisk === "Low" ? T.teal : s.seismicRisk.includes("High") ? T.red : T.amber }}>{s.seismicRisk}</td>
                    <td style={{ padding: "7px 10px", color: T.textSec }}>{s.suitable}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 20 }}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={STIMULATION_TECHNIQUES} margin={{ top: 5, right: 20, bottom: 40, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: T.textMut }} angle={-20} textAnchor="end" />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} unit="%" />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}` }} />
                <Bar dataKey="effectiveness" name="Effectiveness (%)" fill={T.gold} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 4 && (
        <div>
          <div style={styles.grid3}>
            <KpiCard label="Flow Rate" value={flowRate} unit="kg/s" sub="Per well pair target" />
            <KpiCard label="Reservoir Temp" value={temp} unit="°C" sub="Target fluid temperature" color={T.amber} />
            <KpiCard label="Est. Power Output" value={(flowRate * 4.2 * (temp - 70) / 3600 * 0.1).toFixed(1)} unit="MW" sub="Thermal power × 10% ORC eff." color={T.green} />
          </div>
          <div style={styles.panel}>
            <div style={styles.h3}>Flow Rate & Temperature Uncertainty — 20 Stochastic Paths</div>
            <div style={styles.grid2} style={{ marginBottom: 12 }}>
              <Slider label="Target Flow Rate" value={flowRate} min={10} max={150} step={5} onChange={setFlowRate} unit=" kg/s" />
              <Slider label="Target Reservoir Temp" value={temp} min={130} max={400} step={5} onChange={setTemp} unit="°C" />
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <ComposedChart data={flowRiskData} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="path" tick={{ fontSize: 10, fill: T.textSec }} label={{ value: "Stochastic Path", position: "insideBottom", offset: -10, fill: T.textSec, fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: T.textSec }} label={{ value: "Flow (kg/s)", angle: -90, position: "insideLeft", fill: T.textSec, fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: T.textSec }} label={{ value: "Power (MW)", angle: 90, position: "insideRight", fill: T.textSec, fontSize: 11 }} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}` }} />
                <Bar yAxisId="left" dataKey="flow" name="Flow Rate (kg/s)" fill={T.teal} opacity={0.6} />
                <Line yAxisId="right" type="monotone" dataKey="power" name="Power (MW)" stroke={T.gold} strokeWidth={2} dot={{ fill: T.gold, r: 2 }} />
                <ReferenceLine yAxisId="right" y={powerRange.mean} stroke={T.green} strokeDasharray="4 4" label={{ value: `Mean ${powerRange.mean.toFixed(1)}MW`, fill: T.green, fontSize: 10 }} />
              </ComposedChart>
            </ResponsiveContainer>
            <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, fontSize: 12 }}>
              <div style={{ background: T.surfaceH, padding: 10, borderRadius: 6 }}>
                <div style={{ color: T.textSec }}>Min Power</div>
                <div style={{ fontFamily: T.mono, color: T.red, fontSize: 16 }}>{powerRange.min.toFixed(1)} MW</div>
              </div>
              <div style={{ background: T.surfaceH, padding: 10, borderRadius: 6 }}>
                <div style={{ color: T.textSec }}>Mean Power</div>
                <div style={{ fontFamily: T.mono, color: T.gold, fontSize: 16 }}>{powerRange.mean.toFixed(1)} MW</div>
              </div>
              <div style={{ background: T.surfaceH, padding: 10, borderRadius: 6 }}>
                <div style={{ color: T.textSec }}>Max Power</div>
                <div style={{ fontFamily: T.mono, color: T.green, fontSize: 16 }}>{powerRange.max.toFixed(1)} MW</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 5 && (
        <div>
          <div style={styles.panel}>
            <div style={styles.h3}>DOE GeoVision Study — US EGS Capacity Scenarios to 2050</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${T.gold}` }}>
                    {["Scenario", "Cost Reduction", "LCOE 2050 ($/MWh)", "US EGS Capacity (GW)", "Investment ($B)"].map(h => (
                      <th key={h} style={{ padding: "7px 10px", textAlign: "left", color: T.gold, fontFamily: T.mono, fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {scenarios2050.map((s, i) => (
                    <tr key={s.scenario} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 ? T.surfaceH : "transparent" }}>
                      <td style={{ padding: "7px 10px", color: T.text }}>{s.scenario}</td>
                      <td style={{ padding: "7px 10px", fontFamily: T.mono, color: s.costReduction > 0 ? T.green : T.textSec }}>{s.costReduction > 0 ? `-${s.costReduction}%` : "Baseline"}</td>
                      <td style={{ padding: "7px 10px", fontFamily: T.mono, color: T.gold }}>${s.lcoe2050}</td>
                      <td style={{ padding: "7px 10px", fontFamily: T.mono }}>{s.capacity}</td>
                      <td style={{ padding: "7px 10px", fontFamily: T.mono }}>${s.investment}B</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div style={styles.panel}>
            <div style={styles.h3}>LCOE Reduction Potential by Scenario</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={scenarios2050} margin={{ top: 5, right: 20, bottom: 50, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="scenario" tick={{ fontSize: 9, fill: T.textMut }} angle={-20} textAnchor="end" />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} unit="$/MWh" />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}` }} />
                <Legend />
                <Bar dataKey="baselineLcoe" name="Current LCOE" fill={T.amber} />
                <Bar dataKey="projectedLcoe" name="2050 Projected LCOE" fill={T.green} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 6 && (
        <div style={styles.panel}>
          <div style={styles.h3}>Global EGS Project Database</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.gold}` }}>
                  {["Project", "Location", "MW", "Depth (km)", "Temp (°C)", "CAPEX ($M)", "Technology", "Partner", "Stage"].map(h => (
                    <th key={h} style={{ padding: "7px 10px", textAlign: "left", color: T.gold, fontFamily: T.mono, fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {EGS_PROJECTS.map((p, i) => (
                  <tr key={p.name} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 ? T.surfaceH : "transparent" }}>
                    <td style={{ padding: "7px 10px", color: T.text, fontWeight: 600 }}>{p.name}</td>
                    <td style={{ padding: "7px 10px", color: T.textSec }}>{p.location}</td>
                    <td style={{ padding: "7px 10px", fontFamily: T.mono }}>{p.mw}</td>
                    <td style={{ padding: "7px 10px", fontFamily: T.mono }}>{p.depth}</td>
                    <td style={{ padding: "7px 10px", fontFamily: T.mono, color: p.temp > 200 ? T.red : T.amber }}>{p.temp}°C</td>
                    <td style={{ padding: "7px 10px", fontFamily: T.mono }}>${p.capex}</td>
                    <td style={{ padding: "7px 10px", color: T.textSec, fontSize: 11 }}>{p.tech}</td>
                    <td style={{ padding: "7px 10px", color: T.textSec, fontSize: 11 }}>{p.partner}</td>
                    <td style={{ padding: "7px 10px" }}><span style={{ background: p.stage === "Operating" || p.stage === "Completed" ? T.sage : p.stage === "Construction" ? T.navy : p.stage === "Pilot" ? T.teal : T.surfaceH, color: T.text, borderRadius: 4, padding: "2px 6px", fontSize: 10 }}>{p.stage}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 7 && (
        <div style={styles.panel}>
          <div style={styles.h3}>EGS Learning Curve — 15% Cost Reduction per Doubling</div>
          <div style={{ fontSize: 12, color: T.textSec, marginBottom: 12 }}>
            Historical data from oil & gas directional drilling and emerging EGS pilots suggests 15% learning rate. Fewer doublings than mature technologies (wind/solar), but starting from a very low base.
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={learningCurve} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="projects" tick={{ fontSize: 10, fill: T.textSec }} label={{ value: "Cumulative Projects", position: "insideBottom", offset: -10, fill: T.textSec, fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10, fill: T.textSec }} label={{ value: "LCOE ($/MWh)", angle: -90, position: "insideLeft", fill: T.textSec, fontSize: 11 }} />
              <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}` }} formatter={v => [`$${v}/MWh`]} />
              <Line type="monotone" dataKey="lcoe" name="EGS LCOE" stroke={T.gold} strokeWidth={2} dot={{ fill: T.gold, r: 3 }} />
              <ReferenceLine y={80} stroke={T.green} strokeDasharray="4 4" label={{ value: "Conventional geo. LCOE", fill: T.green, fontSize: 10 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 8 && (
        <div style={styles.panel}>
          <div style={styles.h3}>EGS vs. Conventional Geothermal — Key Metrics</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${T.gold}` }}>
                {["Metric", "Conventional (Flash)", "Conventional (Binary)", "EGS (Current)", "EGS (2030E)", "Superhot Rock (2040E)"].map(h => (
                  <th key={h} style={{ padding: "7px 10px", textAlign: "left", color: T.gold, fontFamily: T.mono, fontSize: 11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["LCOE ($/MWh)", "50-100", "60-130", "100-250", "80-150", "40-80"],
                ["Capacity Factor (%)", "90-95", "85-92", "85-90", "87-92", "90-95"],
                ["Capex ($/kW)", "2,000-4,000", "3,000-5,500", "5,000-15,000", "4,000-10,000", "2,000-6,000"],
                ["Resource Geography", "Volcanic zones", "Volcanic/active", "Global (any)", "Global (any)", "Global (any)"],
                ["Water Requirement", "High", "Low", "Low-Moderate", "Low", "Very Low"],
                ["Seismic Risk", "Low", "Very Low", "Moderate", "Low-Moderate", "Low"],
                ["CO₂ Emissions (g/kWh)", "38", "15", "20", "15", "5"],
                ["Technical Maturity", "Mature", "Mature", "Early Commercial", "Commercial", "Pre-commercial"],
              ].map(([metric, ...values], i) => (
                <tr key={metric} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 ? T.surfaceH : "transparent" }}>
                  <td style={{ padding: "7px 10px", color: T.textSec }}>{metric}</td>
                  {values.map((v, j) => (
                    <td key={j} style={{ padding: "7px 10px", fontFamily: T.mono, color: j >= 2 ? T.gold : T.text }}>{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 9 && (
        <div>
          <div style={styles.grid3}>
            <KpiCard label="EGS LCOE" value={(lcoe * 1000).toFixed(1)} unit="$/MWh" sub="Current technology" />
            <KpiCard label="Project IRR" value={egsIrr.toFixed(1)} unit="%" sub={`@$${ppa}/MWh PPA`} color={egsIrr > 8 ? T.green : T.red} />
            <KpiCard label="CAPEX" value={(totalCapex / 1e6).toFixed(0)} unit="$M" sub={`$${(totalCapex / powerMw / 1e6).toFixed(1)}M/MW`} color={T.amber} />
          </div>
          <div style={styles.panel}>
            <div style={styles.h3}>Investment Thesis — EGS at Current Stage</div>
            {[
              { aspect: "Market Opportunity", content: "EGS could unlock >90% of global geothermal resource. DOE GeoVision: 120 GW US potential, $8T global long-term market.", status: "positive" },
              { aspect: "Technology Risk", content: "Drilling cost, stimulation effectiveness, and sustained flow rate remain key uncertainties. Closed-loop AGS (Eavor) eliminates stimulation risk.", status: "neutral" },
              { aspect: "Current Economics", content: `At $${(lcoe * 1000).toFixed(0)}/MWh LCOE, EGS is above competitive thresholds without carbon pricing or DFI support.`, status: "negative" },
              { aspect: "Cost Reduction Path", content: "15% learning rate implies competitive parity (~$80/MWh) after 20-30 projects globally. Quaise millimeter-wave drilling could compress timeline.", status: "positive" },
              { aspect: "Investor Profile", content: "Deep tech VCs (Breakthrough Energy), corporate strategics (Google, BP), DOE ARPA-E grants. Not suitable for yield-focused infrastructure investors yet.", status: "neutral" },
              { aspect: "Carbon Value", content: "20 g CO₂/kWh vs 490g for CCGT. At $100/t carbon price, EGS gains $9.8/MWh competitive advantage.", status: "positive" },
            ].map(r => (
              <div key={r.aspect} style={{ padding: "10px 0", borderBottom: `1px solid ${T.border}` }}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 11, fontFamily: T.mono, padding: "2px 6px", borderRadius: 4,
                    background: r.status === "positive" ? T.sage : r.status === "negative" ? "#3d0000" : T.surfaceH,
                    color: r.status === "positive" ? T.green : r.status === "negative" ? T.red : T.textSec }}>
                    {r.status.toUpperCase()}
                  </span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{r.aspect}</div>
                    <div style={{ fontSize: 12, color: T.textSec, marginTop: 3 }}>{r.content}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
