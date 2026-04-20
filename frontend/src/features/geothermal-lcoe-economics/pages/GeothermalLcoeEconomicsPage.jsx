import React, { useState, useMemo } from "react";
import { BarChart, Bar, LineChart, Line, AreaChart, Area, ComposedChart,
  ScatterChart, Scatter,
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

function calcGeothermalLcoe({ capexWellUsd, numWells, powerMwGross, parasitic, opexMwyr,
  wacc, lifetime, cf, exploreCost, surfacePlantUsd }) {
  const w = wacc / 100;
  const totalCapex = capexWellUsd * numWells + surfacePlantUsd + exploreCost * 1e6;
  const netMw = powerMwGross * (1 - parasitic / 100);
  const annMwh = netMw * cf / 100 * 8760;
  if (annMwh <= 0) return 0;
  const capexAnn = totalCapex * w / (1 - Math.pow(1 + w, -lifetime));
  const opexAnn = opexMwyr * netMw * 1000;
  return +((capexAnn + opexAnn) / annMwh).toFixed(4);
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

const TECH_TYPES = [
  { name: "Dry Steam", capexWell: 4.5e6, numWells: 12, powerMw: 55, parasitic: 10, opex: 22, cf: 95, explore: 18, plant: 38e6, temp: 235, depth: 1.8, color: "#d4a843", country: "USA/Italy/Indonesia", examples: "The Geysers, Larderello, Kamojang" },
  { name: "Single Flash", capexWell: 5.2e6, numWells: 18, powerMw: 50, parasitic: 12, opex: 25, cf: 93, explore: 22, plant: 42e6, temp: 200, depth: 2.2, color: "#27ae60", country: "Philippines/Mexico/Kenya", examples: "Makban, Cerro Prieto, Olkaria I" },
  { name: "Double Flash", capexWell: 5.8e6, numWells: 20, powerMw: 55, parasitic: 13, opex: 28, cf: 92, explore: 25, plant: 55e6, temp: 220, depth: 2.4, color: "#0d9488", country: "New Zealand/Iceland", examples: "Wairakei, Nesjavellir" },
  { name: "Binary (ORC)", capexWell: 3.8e6, numWells: 14, powerMw: 20, parasitic: 8,  opex: 30, cf: 90, explore: 14, plant: 32e6, temp: 130, depth: 2.8, color: "#7c3aed", country: "USA/Germany/Turkey", examples: "Mammoth Lakes, Dürrnhaar, Kızıldere" },
  { name: "Flash + Binary", capexWell: 5.5e6, numWells: 22, powerMw: 60, parasitic: 11, opex: 27, cf: 92, explore: 28, plant: 60e6, temp: 185, depth: 2.5, color: "#e67e22", country: "Iceland/NZ", examples: "Hellisheidi, Rotokawa" },
  { name: "EGS (Advanced)", capexWell: 12e6, numWells: 6,  powerMw: 10, parasitic: 15, opex: 45, cf: 88, explore: 35, plant: 28e6, temp: 200, depth: 4.5, color: "#c0392b", country: "USA/Australia/EU", examples: "Fervo, Quaise, Eavor" },
];

const COMPARABLES = [
  { tech: "Geothermal (flash)",  lcoe_lo: 50,  lcoe_hi: 100, cf: 93, co2: 38,  color: "#d4a843" },
  { tech: "Geothermal (binary)", lcoe_lo: 60,  lcoe_hi: 130, cf: 90, co2: 15,  color: "#27ae60" },
  { tech: "Geothermal (EGS)",    lcoe_lo: 100, lcoe_hi: 250, cf: 88, co2: 20,  color: "#c0392b" },
  { tech: "Nuclear (new build)", lcoe_lo: 80,  lcoe_hi: 160, cf: 92, co2: 12,  color: "#7c3aed" },
  { tech: "Offshore Wind",       lcoe_lo: 60,  lcoe_hi: 110, cf: 40, co2: 14,  color: "#0d9488" },
  { tech: "Onshore Wind",        lcoe_lo: 28,  lcoe_hi: 55,  cf: 33, co2: 11,  color: "#e67e22" },
  { tech: "Solar PV (utility)",  lcoe_lo: 25,  lcoe_hi: 60,  cf: 22, co2: 48,  color: "#e67e22" },
  { tech: "CCGT (gas)",          lcoe_lo: 55,  lcoe_hi: 100, cf: 60, co2: 490, color: "#c0392b" },
];

const HEAT_FLOW_ZONES = [
  { region: "Iceland", hf: 180, resource: "Exceptional", temp3km: 250, installed: 0.75 },
  { region: "Kenya (Rift Valley)", hf: 150, resource: "Exceptional", temp3km: 240, installed: 0.99 },
  { region: "Indonesia", hf: 140, resource: "Excellent", temp3km: 230, installed: 2.36 },
  { region: "Philippines", hf: 130, resource: "Excellent", temp3km: 210, installed: 1.93 },
  { region: "New Zealand", hf: 125, resource: "Excellent", temp3km: 220, installed: 1.05 },
  { region: "USA (West)",  hf: 110, resource: "Very Good", temp3km: 180, installed: 3.70 },
  { region: "Mexico",      hf: 100, resource: "Very Good", temp3km: 175, installed: 0.96 },
  { region: "Turkey",      hf: 95,  resource: "Good", temp3km: 160, installed: 1.68 },
  { region: "Italy",       hf: 90,  resource: "Good", temp3km: 155, installed: 0.82 },
  { region: "Japan",       hf: 85,  resource: "Good", temp3km: 160, installed: 0.62 },
  { region: "Germany",     hf: 65,  resource: "Moderate", temp3km: 120, installed: 0.04 },
  { region: "Australia",   hf: 80,  resource: "Moderate", temp3km: 150, installed: 0.001 },
];

const TABS = [
  "LCOE Engine", "Technology Types", "Cost Breakdown", "Heat Flow Atlas",
  "Vs. Alternatives", "Depth vs Cost", "Learning Curves", "Carbon Value",
  "Sensitivity", "Investor Returns"
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

export default function GeothermalLcoeEconomicsPage() {
  const [tab, setTab] = useState(0);
  const [capexWell, setCapexWell] = useState(5.2);
  const [numWells, setNumWells]   = useState(18);
  const [powerMw, setPowerMw]     = useState(50);
  const [parasitic, setParasitic] = useState(12);
  const [opex, setOpex]           = useState(25);
  const [wacc, setWacc]           = useState(7);
  const [lifetime, setLifetime]   = useState(30);
  const [cf, setCf]               = useState(93);
  const [explore, setExplore]     = useState(22);
  const [plant, setPlant]         = useState(42);
  const [carbonPrice, setCarbonPrice] = useState(80);
  const [selectedTech, setSelectedTech] = useState(1);

  const lcoe = useMemo(() => calcGeothermalLcoe({
    capexWellUsd: capexWell * 1e6, numWells, powerMwGross: powerMw,
    parasitic, opexMwyr: opex, wacc, lifetime, cf,
    exploreCost: explore, surfacePlantUsd: plant * 1e6
  }), [capexWell, numWells, powerMw, parasitic, opex, wacc, lifetime, cf, explore, plant]);

  const netMw  = powerMw * (1 - parasitic / 100);
  const annMwh = netMw * cf / 100 * 8760;
  const totalCapex = (capexWell * numWells + plant + explore) * 1e6;
  const carbonAdj = lcoe - carbonPrice * 38 / 1e6;

  const cashflows = useMemo(() => {
    const rev = annMwh * lcoe * 1.3;
    const opexAnn = opex * netMw * 1000;
    const arr = [-totalCapex];
    for (let y = 1; y <= lifetime; y++) arr.push(rev - opexAnn);
    return arr;
  }, [annMwh, lcoe, opex, netMw, totalCapex, lifetime]);

  const projectIrr = useMemo(() => irr(cashflows), [cashflows]);

  const costBreakdown = useMemo(() => [
    { name: "Drilling & Wells", value: +(capexWell * numWells / totalCapex * 100).toFixed(1) },
    { name: "Surface Plant",    value: +(plant * 1e6 / totalCapex * 100).toFixed(1) },
    { name: "Exploration",      value: +(explore * 1e6 / totalCapex * 100).toFixed(1) },
  ], [capexWell, numWells, plant, explore, totalCapex]);

  const sensitivityData = useMemo(() => [
    { param: "WACC +2%",       lcoe: calcGeothermalLcoe({ capexWellUsd: capexWell*1e6, numWells, powerMwGross: powerMw, parasitic, opexMwyr: opex, wacc: wacc+2, lifetime, cf, exploreCost: explore, surfacePlantUsd: plant*1e6 }) * 1000 },
    { param: "WACC -2%",       lcoe: calcGeothermalLcoe({ capexWellUsd: capexWell*1e6, numWells, powerMwGross: powerMw, parasitic, opexMwyr: opex, wacc: wacc-2, lifetime, cf, exploreCost: explore, surfacePlantUsd: plant*1e6 }) * 1000 },
    { param: "CF -10%",        lcoe: calcGeothermalLcoe({ capexWellUsd: capexWell*1e6, numWells, powerMwGross: powerMw, parasitic, opexMwyr: opex, wacc, lifetime, cf: cf-10, exploreCost: explore, surfacePlantUsd: plant*1e6 }) * 1000 },
    { param: "Capex +30%",     lcoe: calcGeothermalLcoe({ capexWellUsd: capexWell*1.3*1e6, numWells, powerMwGross: powerMw, parasitic, opexMwyr: opex, wacc, lifetime, cf, exploreCost: explore, surfacePlantUsd: plant*1.3*1e6 }) * 1000 },
    { param: "Capex -20%",     lcoe: calcGeothermalLcoe({ capexWellUsd: capexWell*0.8*1e6, numWells, powerMwGross: powerMw, parasitic, opexMwyr: opex, wacc, lifetime, cf, exploreCost: explore, surfacePlantUsd: plant*0.8*1e6 }) * 1000 },
    { param: "Base Case",      lcoe: lcoe * 1000 },
    { param: "+2 Wells",       lcoe: calcGeothermalLcoe({ capexWellUsd: capexWell*1e6, numWells: numWells+2, powerMwGross: powerMw, parasitic, opexMwyr: opex, wacc, lifetime, cf, exploreCost: explore, surfacePlantUsd: plant*1e6 }) * 1000 },
  ], [capexWell, numWells, powerMw, parasitic, opex, wacc, lifetime, cf, explore, plant, lcoe]);

  const learningData = useMemo(() => Array.from({ length: 20 }, (_, i) => {
    const cum = (i + 1) * 5;
    const lr = 0.10;
    return { cum, lcoe: +(lcoe * 1000 * Math.pow(cum / 5, -Math.log2(1 / (1 - lr)))).toFixed(1) };
  }), [lcoe]);

  const depthCostData = useMemo(() => TECH_TYPES.map(t => ({
    name: t.name, depth: t.depth, capex: t.capexWell / 1e6, color: t.color,
  })), []);

  const techCompare = useMemo(() => TECH_TYPES.map(t => ({
    ...t,
    lcoe: +(calcGeothermalLcoe({ capexWellUsd: t.capexWell, numWells: t.numWells, powerMwGross: t.powerMw,
      parasitic: t.parasitic, opexMwyr: t.opex, wacc: 7, lifetime: 30,
      cf: t.cf, exploreCost: t.explore, surfacePlantUsd: t.plant }) * 1000).toFixed(1),
  })), []);

  const carbonValueData = useMemo(() => [20, 40, 60, 80, 100, 120, 150, 200].map(cp => ({
    carbonPrice: cp,
    lcoeNet: +(lcoe * 1000 - cp * 38 / 1e3).toFixed(1),
  })), [lcoe]);

  const returnData = useMemo(() => [60, 70, 80, 90, 100, 110, 120].map(ppa => ({
    ppa,
    irr: +(irr([-totalCapex, ...Array.from({ length: lifetime }, () => annMwh * ppa / 1000 - opex * netMw * 1000)]) * 100).toFixed(2),
  })), [totalCapex, annMwh, opex, netMw, lifetime]);

  const styles = { page: { background: T.bg, minHeight: "100vh", fontFamily: T.font, color: T.text, padding: 24 },
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
        <div style={{ fontSize: 11, color: T.gold, fontFamily: T.mono, letterSpacing: 2, marginBottom: 6 }}>EP-DV1 · GEOTHERMAL ENERGY FINANCE</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Geothermal LCOE Economics & Resource Analytics</h1>
        <div style={{ fontSize: 13, color: T.textSec, marginTop: 6 }}>Dry Steam · Single/Double Flash · Binary ORC · EGS · Heat Flow Mapping · Carbon-Adjusted LCOE</div>
      </div>

      <div style={styles.tabs}>
        {TABS.map((t, i) => <button key={t} style={styles.tab(tab === i)} onClick={() => setTab(i)}>{t}</button>)}
      </div>

      {tab === 0 && (
        <div style={styles.grid2}>
          <div>
            <div style={styles.panel}>
              <div style={styles.h3}>LCOE Engine — Geothermal Power</div>
              <Slider label="Well Capital Cost" value={capexWell} min={2} max={15} step={0.1} onChange={setCapexWell} unit=" $M/well" />
              <Slider label="Number of Wells (Production + Injection)" value={numWells} min={4} max={50} step={1} onChange={setNumWells} unit=" wells" />
              <Slider label="Gross Power Output" value={powerMw} min={5} max={200} step={5} onChange={setPowerMw} unit=" MW" />
              <Slider label="Parasitic Load" value={parasitic} min={5} max={25} step={1} onChange={setParasitic} unit="%" />
              <Slider label="O&M Cost" value={opex} min={10} max={60} step={1} onChange={setOpex} unit=" $/kW-yr" />
              <Slider label="Capacity Factor" value={cf} min={70} max={98} step={1} onChange={setCf} unit="%" />
              <Slider label="Exploration Cost" value={explore} min={5} max={80} step={1} onChange={setExplore} unit=" $M" />
              <Slider label="Surface Plant Cost" value={plant} min={15} max={150} step={5} onChange={setPlant} unit=" $M" />
              <Slider label="WACC" value={wacc} min={4} max={15} step={0.5} onChange={setWacc} unit="%" />
              <Slider label="Project Lifetime" value={lifetime} min={20} max={50} step={5} onChange={setLifetime} unit=" yr" />
              <Slider label="Carbon Price" value={carbonPrice} min={0} max={300} step={10} onChange={setCarbonPrice} unit=" $/t" />
            </div>
          </div>
          <div>
            <div style={styles.grid2}>
              <KpiCard label="LCOE" value={(lcoe * 1000).toFixed(1)} unit="$/MWh" sub="Levelized Cost of Energy" />
              <KpiCard label="Carbon-Adj. LCOE" value={(carbonAdj * 1000).toFixed(1)} unit="$/MWh" sub={`@$${carbonPrice}/t CO₂`} color={T.green} />
              <KpiCard label="Net Output" value={netMw.toFixed(1)} unit="MW" sub={`${(annMwh / 1e6).toFixed(2)} TWh/yr`} />
              <KpiCard label="Project IRR" value={(projectIrr * 100).toFixed(1)} unit="%" sub="Newton-Raphson, 200-iter" color={T.amber} />
              <KpiCard label="Total CAPEX" value={(totalCapex / 1e6).toFixed(0)} unit="$M" sub={`$${(totalCapex / powerMw / 1e6).toFixed(2)}M/MW`} />
              <KpiCard label="Capacity Factor" value={cf} unit="%" sub="Geothermal baseload advantage" color={T.teal} />
            </div>
            <div style={styles.panel}>
              <div style={styles.h3}>LCOE vs Technology Benchmark</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={COMPARABLES} margin={{ top: 5, right: 10, bottom: 30, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="tech" tick={{ fontSize: 9, fill: T.textMut }} angle={-35} textAnchor="end" />
                  <YAxis tick={{ fontSize: 10, fill: T.textSec }} label={{ value: "$/MWh", angle: -90, position: "insideLeft", fill: T.textSec, fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}` }} />
                  <Bar dataKey="lcoe_lo" name="LCOE Low" fill={T.teal} stackId="a" />
                  <Bar dataKey="lcoe_hi" name="LCOE High" fill={T.gold} stackId="b" />
                  <ReferenceLine y={lcoe * 1000} stroke={T.red} strokeDasharray="4 4" label={{ value: "Your LCOE", fill: T.red, fontSize: 10 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div>
          <div style={styles.grid3}>
            <KpiCard label="Dry Steam LCOE" value={(techCompare[0].lcoe).toFixed(1)} unit="$/MWh" sub="Lowest cost, limited resource" />
            <KpiCard label="Single Flash LCOE" value={(techCompare[1].lcoe).toFixed(1)} unit="$/MWh" sub="Most widely deployed" color={T.green} />
            <KpiCard label="Binary ORC LCOE" value={(techCompare[3].lcoe).toFixed(1)} unit="$/MWh" sub="Low-temp resource access" color={T.amber} />
          </div>
          <div style={styles.panel}>
            <div style={styles.h3}>Technology Type Comparison — LCOE & Capacity Factor</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
              {TECH_TYPES.map((t, i) => (
                <button key={t.name} onClick={() => setSelectedTech(i)}
                  style={{ ...styles.tab(selectedTech === i), borderColor: t.color, color: selectedTech === i ? "#000" : t.color, background: selectedTech === i ? t.color : T.surface }}>
                  {t.name}
                </button>
              ))}
            </div>
            {(() => {
              const t = TECH_TYPES[selectedTech];
              return (
                <div style={styles.grid2}>
                  <div>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                      {[["Technology", t.name], ["Typical Temperature", `${t.temp}°C`], ["Drilling Depth", `${t.depth} km`], ["Well Cost", `$${(t.capexWell/1e6).toFixed(1)}M`], ["Production Wells", t.numWells], ["Gross Power", `${t.powerMw} MW`], ["Parasitic Load", `${t.parasitic}%`], ["O&M Cost", `${t.opex} $/kW-yr`], ["Capacity Factor", `${t.cf}%`], ["Key Markets", t.country], ["Examples", t.examples]].map(([k, v]) => (
                        <tr key={k} style={{ borderBottom: `1px solid ${T.border}` }}>
                          <td style={{ padding: "6px 8px", color: T.textSec }}>{k}</td>
                          <td style={{ padding: "6px 8px", color: T.text, fontFamily: T.mono }}>{v}</td>
                        </tr>
                      ))}
                    </table>
                  </div>
                  <div>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={techCompare} margin={{ top: 5, right: 10, bottom: 40, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                        <XAxis dataKey="name" tick={{ fontSize: 9, fill: T.textMut }} angle={-30} textAnchor="end" />
                        <YAxis tick={{ fontSize: 10, fill: T.textSec }} label={{ value: "$/MWh", angle: -90, position: "insideLeft", fill: T.textSec, fontSize: 10 }} />
                        <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}` }} />
                        <Bar dataKey="lcoe" name="LCOE ($/MWh)" fill={T.gold} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {tab === 2 && (
        <div style={styles.grid2}>
          <div style={styles.panel}>
            <div style={styles.h3}>Capital Cost Breakdown</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={costBreakdown} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize: 10, fill: T.textSec }} unit="%" />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: T.textSec }} width={120} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}` }} />
                <Bar dataKey="value" name="Share (%)" fill={T.gold} />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ marginTop: 16, fontSize: 12, color: T.textSec }}>
              <div>Total CAPEX: <span style={{ color: T.gold, fontFamily: T.mono }}>${(totalCapex / 1e6).toFixed(0)}M</span></div>
              <div style={{ marginTop: 4 }}>Drilling represents the largest cost driver in geothermal — typically 50–65% of total project cost. Surface plant and fluid handling account for 25–35%.</div>
            </div>
          </div>
          <div style={styles.panel}>
            <div style={styles.h3}>Annual Cost Structure ($/MWh)</div>
            {[
              { item: "Annualized CAPEX", val: +(totalCapex * (wacc/100) / (1 - Math.pow(1 + wacc/100, -lifetime)) / annMwh * 1000).toFixed(1), color: T.gold },
              { item: "O&M (Fixed)", val: +(opex * netMw * 1000 / annMwh * 1000).toFixed(1), color: T.amber },
              { item: "Total LCOE", val: +(lcoe * 1000).toFixed(1), color: T.green },
              { item: "Carbon Credit Revenue", val: +(carbonPrice * 38 / 1e3).toFixed(1), color: T.teal },
              { item: "Carbon-Adjusted LCOE", val: +(carbonAdj * 1000).toFixed(1), color: T.text },
            ].map(r => (
              <div key={r.item} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
                <span style={{ fontSize: 13 }}>{r.item}</span>
                <span style={{ fontFamily: T.mono, color: r.color, fontSize: 13 }}>{r.val} $/MWh</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 3 && (
        <div>
          <div style={styles.grid3}>
            <KpiCard label="Global Installed" value="15.9" unit="GW" sub="Geothermal electricity, 2024E" />
            <KpiCard label="Top Resource Zone" value="Iceland" unit="" sub="180 mW/m² heat flow" color={T.green} />
            <KpiCard label="Pipeline" value=">15" unit="GW" sub="Projects in development globally" color={T.amber} />
          </div>
          <div style={styles.panel}>
            <div style={styles.h3}>Global Heat Flow & Installed Capacity by Region</div>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={HEAT_FLOW_ZONES} margin={{ top: 5, right: 20, bottom: 50, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="region" tick={{ fontSize: 9, fill: T.textMut }} angle={-35} textAnchor="end" />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: T.textSec }} label={{ value: "Heat Flow (mW/m²)", angle: -90, position: "insideLeft", fill: T.textSec, fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: T.textSec }} label={{ value: "Installed (GW)", angle: 90, position: "insideRight", fill: T.textSec, fontSize: 10 }} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}` }} />
                <Legend />
                <Bar yAxisId="left" dataKey="hf" name="Heat Flow (mW/m²)" fill={T.gold} opacity={0.7} />
                <Line yAxisId="right" type="monotone" dataKey="installed" name="Installed (GW)" stroke={T.green} strokeWidth={2} dot={{ fill: T.green, r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div style={styles.panel}>
            <div style={styles.h3}>Temperature at 3km Depth by Region</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={[...HEAT_FLOW_ZONES].sort((a, b) => b.temp3km - a.temp3km)} margin={{ top: 5, right: 20, bottom: 50, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="region" tick={{ fontSize: 9, fill: T.textMut }} angle={-35} textAnchor="end" />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} label={{ value: "°C", angle: -90, position: "insideLeft", fill: T.textSec, fontSize: 10 }} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}` }} />
                <Bar dataKey="temp3km" name="Temp at 3km (°C)" fill={T.amber} />
                <ReferenceLine y={180} stroke={T.teal} strokeDasharray="4 4" label={{ value: "Flash threshold", fill: T.teal, fontSize: 10 }} />
                <ReferenceLine y={120} stroke={T.sage} strokeDasharray="4 4" label={{ value: "Binary threshold", fill: T.sage, fontSize: 10 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 4 && (
        <div style={styles.panel}>
          <div style={styles.h3}>Geothermal vs. Alternative Baseload & Renewables</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.gold}` }}>
                  {["Technology", "LCOE Low ($/MWh)", "LCOE High ($/MWh)", "Capacity Factor (%)", "CO₂ (g/kWh)", "Notes"].map(h => (
                    <th key={h} style={{ padding: "8px 10px", textAlign: "left", color: T.gold, fontFamily: T.mono, fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARABLES.map((r, i) => (
                  <tr key={r.tech} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 ? T.surfaceH : "transparent" }}>
                    <td style={{ padding: "7px 10px", color: r.color, fontWeight: 600 }}>{r.tech}</td>
                    <td style={{ padding: "7px 10px", fontFamily: T.mono }}>{r.lcoe_lo}</td>
                    <td style={{ padding: "7px 10px", fontFamily: T.mono }}>{r.lcoe_hi}</td>
                    <td style={{ padding: "7px 10px", fontFamily: T.mono }}>{r.cf}</td>
                    <td style={{ padding: "7px 10px", fontFamily: T.mono, color: r.co2 > 100 ? T.red : T.green }}>{r.co2}</td>
                    <td style={{ padding: "7px 10px", color: T.textSec, fontSize: 11 }}>{r.tech.includes("Geothermal") ? "24/7 baseload, grid-stable" : r.tech.includes("Nuclear") ? "Baseload, low carbon" : r.tech.includes("CCGT") ? "Dispatchable, high carbon" : "Intermittent, storage needed"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 5 && (
        <div style={styles.panel}>
          <div style={styles.h3}>Drilling Depth vs. Well Cost — Technology Positioning</div>
          <ResponsiveContainer width="100%" height={320}>
            <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="depth" name="Depth (km)" type="number" tick={{ fontSize: 10, fill: T.textSec }} label={{ value: "Drilling Depth (km)", position: "insideBottom", offset: -10, fill: T.textSec, fontSize: 11 }} />
              <YAxis dataKey="capex" name="Well Cost ($M)" tick={{ fontSize: 10, fill: T.textSec }} label={{ value: "Well Cost ($M)", angle: -90, position: "insideLeft", fill: T.textSec, fontSize: 11 }} />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={{ background: T.surface, border: `1px solid ${T.border}` }}
                formatter={(v, n, p) => [v, n === "Depth (km)" ? "km depth" : "$M/well"]} />
              {depthCostData.map((d, i) => (
                <Scatter key={d.name} name={d.name} data={[d]} fill={d.color}>
                </Scatter>
              ))}
            </ScatterChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 12 }}>
            {depthCostData.map(d => (
              <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: d.color }} />
                <span style={{ color: T.textSec }}>{d.name}: {d.depth}km · ${d.capex.toFixed(1)}M</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 6 && (
        <div style={styles.panel}>
          <div style={styles.h3}>Geothermal LCOE Learning Curve — Cumulative Capacity</div>
          <div style={{ fontSize: 12, color: T.textSec, marginBottom: 12 }}>10% learning rate — LCOE reduces 10% for each doubling of cumulative installed capacity</div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={learningData} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="cum" tick={{ fontSize: 10, fill: T.textSec }} label={{ value: "Cumulative Projects", position: "insideBottom", offset: -10, fill: T.textSec, fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10, fill: T.textSec }} label={{ value: "LCOE ($/MWh)", angle: -90, position: "insideLeft", fill: T.textSec, fontSize: 11 }} />
              <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}` }} formatter={v => [`$${v}/MWh`]} />
              <Line type="monotone" dataKey="lcoe" name="LCOE ($/MWh)" stroke={T.gold} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 7 && (
        <div style={styles.panel}>
          <div style={styles.h3}>Carbon Value Impact on Effective LCOE</div>
          <div style={{ fontSize: 12, color: T.textSec, marginBottom: 12 }}>
            Geothermal emits ~38 g CO₂/kWh (flash) vs ~490 g for gas. Carbon pricing creates a structural cost advantage.
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={carbonValueData} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="carbonPrice" tick={{ fontSize: 10, fill: T.textSec }} label={{ value: "Carbon Price ($/t)", position: "insideBottom", offset: -10, fill: T.textSec, fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10, fill: T.textSec }} label={{ value: "Net LCOE ($/MWh)", angle: -90, position: "insideLeft", fill: T.textSec, fontSize: 11 }} />
              <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}` }} formatter={v => [`$${v}/MWh`]} />
              <Line type="monotone" dataKey="lcoeNet" name="Carbon-Adj. LCOE" stroke={T.green} strokeWidth={2} dot={false} />
              <ReferenceLine y={55} stroke={T.gold} strokeDasharray="4 4" label={{ value: "Onshore wind LCOE", fill: T.gold, fontSize: 10 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 8 && (
        <div style={styles.panel}>
          <div style={styles.h3}>Sensitivity Analysis — LCOE Tornado</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[...sensitivityData].sort((a, b) => b.lcoe - a.lcoe)} layout="vertical" margin={{ top: 5, right: 30, bottom: 5, left: 120 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{ fontSize: 10, fill: T.textSec }} unit=" $/MWh" />
              <YAxis dataKey="param" type="category" tick={{ fontSize: 11, fill: T.textSec }} width={115} />
              <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}` }} formatter={v => [`$${v.toFixed(1)}/MWh`]} />
              <Bar dataKey="lcoe" name="LCOE ($/MWh)" fill={T.amber} />
              <ReferenceLine x={lcoe * 1000} stroke={T.red} strokeDasharray="4 4" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 9 && (
        <div style={styles.grid2}>
          <div style={styles.panel}>
            <div style={styles.h3}>Project IRR vs. PPA Price</div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={returnData} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="ppa" tick={{ fontSize: 10, fill: T.textSec }} label={{ value: "PPA Price ($/MWh)", position: "insideBottom", offset: -10, fill: T.textSec, fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} label={{ value: "IRR (%)", angle: -90, position: "insideLeft", fill: T.textSec, fontSize: 11 }} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}` }} formatter={v => [`${v}%`]} />
                <Line type="monotone" dataKey="irr" name="Project IRR (%)" stroke={T.gold} strokeWidth={2} dot={{ fill: T.gold, r: 3 }} />
                <ReferenceLine y={8} stroke={T.green} strokeDasharray="4 4" label={{ value: "Hurdle Rate", fill: T.green, fontSize: 10 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={styles.panel}>
            <div style={styles.h3}>Key Investment Metrics</div>
            {[
              { label: "Project IRR", value: `${(projectIrr * 100).toFixed(2)}%`, note: "Newton-Raphson 200-iter" },
              { label: "LCOE", value: `$${(lcoe * 1000).toFixed(1)}/MWh`, note: "Full lifecycle cost" },
              { label: "Carbon-Adj. LCOE", value: `$${(carbonAdj * 1000).toFixed(1)}/MWh`, note: `@$${carbonPrice}/t CO₂` },
              { label: "Total CAPEX", value: `$${(totalCapex / 1e6).toFixed(0)}M`, note: `$${(totalCapex / powerMw / 1e6).toFixed(2)}M/MW` },
              { label: "Annual Revenue (1.3×)", value: `$${(annMwh * lcoe * 1.3 / 1e6).toFixed(1)}M`, note: `PPA mark-up assumption` },
              { label: "Payback Period", value: `${(totalCapex / (annMwh * lcoe * 1.3 - opex * netMw * 1000)).toFixed(1)} yr`, note: "Simple payback" },
            ].map(r => (
              <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
                <div>
                  <div style={{ fontSize: 13 }}>{r.label}</div>
                  <div style={{ fontSize: 11, color: T.textMut }}>{r.note}</div>
                </div>
                <span style={{ fontFamily: T.mono, color: T.gold, fontSize: 14 }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
