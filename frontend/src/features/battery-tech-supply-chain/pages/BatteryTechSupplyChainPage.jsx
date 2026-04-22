import React, { useState, useMemo } from "react";
import EnergyAdvancedAnalytics from '../../_shared/EnergyAdvancedAnalytics';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, ScatterChart, Scatter,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";

const T = {
  bg: "#0f1117", surface: "#1a1d27", surfaceH: "#22263a", border: "#2a2f45", borderL: "#353a52",
  navy: "#1e3a5f", navyL: "#2a4a6f", gold: "#d4a843", goldL: "#e0b85a",
  sage: "#2d6a4f", sageL: "#3d8a6a", teal: "#0d4f5c", text: "#e8e0d0",
  textSec: "#a89880", textMut: "#6b6050", red: "#c0392b", green: "#27ae60",
  amber: "#e67e22", font: "'DM Sans', sans-serif", mono: "'JetBrains Mono', monospace",
};

const sr = s => { const x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const MINERALS = [
  { name: "Lithium (LCE)", unit: "kt", demand2025: 820, demand2030: 1840, demand2035: 3200, demand2040: 5100, topProducers: ["Chile 26%","Australia 47%","Argentina 10%"], hhi: 0.31, ewRisk: 8.2, price2025: 14500, chemistry: "LFP/NMC/NCA" },
  { name: "Cobalt", unit: "kt", demand2025: 180, demand2030: 220, demand2035: 195, demand2040: 160, topProducers: ["DRC 70%","Russia 5%","Australia 4%"], hhi: 0.52, ewRisk: 9.1, price2025: 32000, chemistry: "NMC/NCA" },
  { name: "Nickel (Class 1)", unit: "kt", demand2025: 420, demand2030: 980, demand2035: 1600, demand2040: 2400, topProducers: ["Indonesia 42%","Philippines 11%","Russia 9%"], hhi: 0.21, ewRisk: 6.8, price2025: 16800, chemistry: "NMC/NCA" },
  { name: "Manganese (battery-grade)", unit: "kt", demand2025: 160, demand2030: 480, demand2035: 980, demand2040: 1700, topProducers: ["South Africa 35%","Gabon 10%","Australia 14%"], hhi: 0.18, ewRisk: 5.9, price2025: 4200, chemistry: "LMFP/LNMO" },
  { name: "Natural Graphite (anode)", unit: "kt", demand2025: 1100, demand2030: 2400, demand2035: 4200, demand2040: 7000, topProducers: ["China 65%","Mozambique 12%","Tanzania 6%"], hhi: 0.45, ewRisk: 8.7, price2025: 8500, chemistry: "All" },
  { name: "Phosphate (LFP)", unit: "kt P", demand2025: 240, demand2030: 880, demand2035: 1900, demand2040: 3400, topProducers: ["China 45%","Morocco 18%","Saudi Arabia 8%"], hhi: 0.28, ewRisk: 6.1, price2025: 1100, chemistry: "LFP/LMFP" },
];

const CELLS = [
  { name: "LFP (Cylindrical 46xx)", cost2025: 68, cost2027: 52, cost2030: 38, cost2035: 28, ed_wh_kg: 190, ed_wh_l: 420, voltage: 3.2, cobalt_kg_kwh: 0, nickel_kg_kwh: 0, li_kg_kwh: 1.2, graphite_kg_kwh: 8.0, region: "China dominant", share2025: 38 },
  { name: "NMC 811 (Pouch)", cost2025: 82, cost2027: 64, cost2030: 48, cost2035: 36, ed_wh_kg: 280, ed_wh_l: 700, voltage: 3.7, cobalt_kg_kwh: 0.8, nickel_kg_kwh: 6.0, li_kg_kwh: 0.9, graphite_kg_kwh: 6.5, region: "Korea/China", share2025: 28 },
  { name: "LMFP (Prismatic)", cost2025: 72, cost2027: 54, cost2030: 40, cost2035: 30, ed_wh_kg: 210, ed_wh_l: 480, voltage: 3.4, cobalt_kg_kwh: 0, nickel_kg_kwh: 0, li_kg_kwh: 1.1, graphite_kg_kwh: 7.5, region: "China", share2025: 14 },
  { name: "Na-Ion (Cylindrical)", cost2025: 65, cost2027: 50, cost2030: 37, cost2035: 26, ed_wh_kg: 155, ed_wh_l: 340, voltage: 3.1, cobalt_kg_kwh: 0, nickel_kg_kwh: 0, li_kg_kwh: 0, graphite_kg_kwh: 0, region: "China/Europe", share2025: 4 },
  { name: "NMC 532 (Cylindrical 21700)", cost2025: 90, cost2027: 72, cost2030: 55, cost2035: 42, ed_wh_kg: 260, ed_wh_l: 620, voltage: 3.6, cobalt_kg_kwh: 1.6, nickel_kg_kwh: 4.5, li_kg_kwh: 0.95, graphite_kg_kwh: 7.0, region: "Japan/Korea", share2025: 16 },
];

const GIGA_FACTORIES = [
  { name: "CATL Ningde (Phase 3)", country: "China", cap_gwh: 240, chemistry: "LFP/NMC", opYear: 2024, capex_bn: 8.2, jobs: 18000, vertical: "Full" },
  { name: "Northvolt Ett (Expanded)", country: "Sweden", cap_gwh: 60, chemistry: "NMC/LFP", opYear: 2026, capex_bn: 4.5, jobs: 3200, vertical: "Cell+Module" },
  { name: "Panasonic Kansas", country: "USA", cap_gwh: 100, chemistry: "NMC", opYear: 2025, capex_bn: 4.0, jobs: 4000, vertical: "Cell" },
  { name: "LG Energy Texas", country: "USA", cap_gwh: 125, chemistry: "NMC", opYear: 2026, capex_bn: 5.6, jobs: 5000, vertical: "Cell+Module" },
  { name: "ACC (Automotive Cells Co)", country: "France/Germany", cap_gwh: 120, chemistry: "NMC", opYear: 2027, capex_bn: 7.0, jobs: 5500, vertical: "Cell+Module" },
  { name: "Envision AESC UK", country: "UK", cap_gwh: 38, chemistry: "NMC", opYear: 2025, capex_bn: 1.8, jobs: 1600, vertical: "Cell" },
  { name: "FREYR Gigafactory Mo i Rana", country: "Norway", cap_gwh: 29, chemistry: "LFP", opYear: 2026, capex_bn: 1.3, jobs: 1100, vertical: "Cell" },
  { name: "BYD Szeged (Hungary)", country: "Hungary", cap_gwh: 100, chemistry: "LFP/NMC", opYear: 2026, capex_bn: 4.0, jobs: 9000, vertical: "Full" },
];

const RECYCLING = [
  { route: "Hydrometallurgy (Wet)", li_rec: 95, ni_rec: 99, co_rec: 99, mn_rec: 98, cost_usd_kg: 1.8, matQuality: "Battery grade", scale: "Industrial", co2_vs_virgin: -72 },
  { route: "Pyrometallurgy (Smelting)", li_rec: 0, ni_rec: 96, co_rec: 98, mn_rec: 0, cost_usd_kg: 2.4, matQuality: "Alloy grade", scale: "Industrial", co2_vs_virgin: -45 },
  { route: "Direct Recycling", li_rec: 92, ni_rec: 97, co_rec: 97, mn_rec: 95, cost_usd_kg: 1.2, matQuality: "Battery grade", scale: "Pilot/Demo", co2_vs_virgin: -85 },
  { route: "Mechanical Pre-processing", li_rec: 0, ni_rec: 0, co_rec: 0, mn_rec: 0, cost_usd_kg: 0.4, matQuality: "Black mass", scale: "Industrial", co2_vs_virgin: 0 },
];

const TABS = [
  "Cell Cost Trajectory", "Critical Minerals", "Gigafactory Map", "Supply Concentration",
  "Vertical Integration", "Cell Chemistry Compare", "Recycling Economics",
  "Geopolitical Risk", "Cost Stack Breakdown", "Investment Landscape"
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

export default function BatteryTechSupplyChainPage() {
  const [tab, setTab] = useState(0);
  const [selectedChem, setSelectedChem] = useState("LFP (Cylindrical 46xx)");
  const [mineralIdx, setMineralIdx] = useState(0);
  const [scaleGwh, setScaleGwh] = useState(40);
  const [priceMult, setPriceMult] = useState(1.0);
  const [recycleShare, setRecycleShare] = useState(30);
  const [vertInt, setVertInt] = useState(60);

  const wrightCurveCell = useMemo(() => {
    return CELLS.map(c => {
      const b = 0.13;
      const years = [2025, 2027, 2030, 2035, 2040];
      return { name: c.name, data: years.map((yr, i) => ({ year: yr, cost: [c.cost2025, c.cost2027, c.cost2030, c.cost2035, Math.round(c.cost2035 * 0.75)][i] })) };
    });
  }, []);

  const mineralDemandData = useMemo(() => {
    const m = MINERALS[mineralIdx];
    return [
      { year: 2025, demand: m.demand2025, price: m.price2025 },
      { year: 2030, demand: m.demand2030, price: Math.round(m.price2025 * (0.85 + sr(mineralIdx * 17) * 0.3)) },
      { year: 2035, demand: m.demand2035, price: Math.round(m.price2025 * (0.70 + sr(mineralIdx * 19) * 0.4)) },
      { year: 2040, demand: m.demand2040, price: Math.round(m.price2025 * (0.55 + sr(mineralIdx * 23) * 0.5)) },
    ];
  }, [mineralIdx]);

  const costStackData = useMemo(() => {
    const cell = CELLS.find(c => c.name === selectedChem) || CELLS[0];
    const baseCell = cell.cost2025;
    return [2025, 2027, 2030, 2035, 2040].map((yr, i) => {
      const cellCost = [cell.cost2025, cell.cost2027, cell.cost2030, cell.cost2035, Math.round(cell.cost2035 * 0.75)][i];
      const modulePack = cellCost * 0.28;
      const bms = cellCost * 0.08;
      const thermal = cellCost * 0.06;
      const integration = cellCost * 0.04;
      return { year: yr, Cell: +cellCost.toFixed(0), ModulePack: +modulePack.toFixed(0), BMS: +bms.toFixed(0), Thermal: +thermal.toFixed(0), Integration: +integration.toFixed(0) };
    });
  }, [selectedChem]);

  const radarData = useMemo(() => {
    const cell = CELLS.find(c => c.name === selectedChem) || CELLS[0];
    return [
      { axis: "Energy Density", value: Math.min(100, (cell.ed_wh_kg / 280) * 100) },
      { axis: "Cost (inv.)", value: Math.min(100, (90 / cell.cost2025) * 100) },
      { axis: "Cobalt-Free", value: cell.cobalt_kg_kwh === 0 ? 100 : Math.max(0, 100 - cell.cobalt_kg_kwh * 40) },
      { axis: "Li-Free", value: cell.li_kg_kwh === 0 ? 100 : Math.max(0, 100 - cell.li_kg_kwh * 30) },
      { axis: "Maturity", value: cell.share2025 > 20 ? 95 : cell.share2025 > 10 ? 75 : 45 },
      { axis: "Cycle Life (inv. cost)", value: 80 - cell.cobalt_kg_kwh * 10 },
    ];
  }, [selectedChem]);

  const recyclingEconData = useMemo(() => {
    return RECYCLING.map(r => {
      const recoveredValue = (r.li_rec / 100) * 0.012 * 14500 * priceMult
        + (r.ni_rec / 100) * 0.04 * 16800 * priceMult
        + (r.co_rec / 100) * 0.01 * 32000 * priceMult;
      const netMargin = recoveredValue - r.cost_usd_kg * 1000;
      return { ...r, recoveredValue: +recoveredValue.toFixed(0), netMargin: +netMargin.toFixed(0) };
    });
  }, [priceMult]);

  const geoRiskData = useMemo(() => [
    { country: "China", score: 8.4, label: "Anode/cathode processing dominance", share: 72 },
    { country: "DRC", score: 9.1, label: "Cobalt mining dominance", share: 70 },
    { country: "Indonesia", score: 6.2, label: "Nickel ore processing", share: 42 },
    { country: "Chile", score: 4.8, label: "Lithium brine extraction", share: 26 },
    { country: "Australia", score: 3.9, label: "Hard rock lithium/nickel", share: 47 },
    { country: "South Africa", score: 5.7, label: "Manganese ore", share: 35 },
    { country: "Morocco", score: 4.2, label: "Phosphate (LFP)", share: 18 },
  ], []);

  const invLandscapeData = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      x: 20 + sr(i * 13) * 80,
      y: 5 + sr(i * 17) * 35,
      z: 200 + sr(i * 7) * 2800,
      name: ["CATL", "BYD", "Panasonic", "LG Energy", "Samsung SDI", "SK On", "Northvolt", "FREYR", "ACC", "Envision AESC",
        "SVOLT", "Farasis", "Gotion", "EVE Energy", "Lishen", "Amperex", "REPT", "CALB", "SUNWODA", "Lithium Werks"][i],
    }));
  }, []);

  const totalCapexNeed = useMemo(() => {
    const gwh2030 = 2800;
    const costPerGwh = 70; // $M/GWh
    return (gwh2030 * costPerGwh / 1000).toFixed(0);
  }, []);

  const C = { cell: "#d4a843", mineral: "#27ae60", risk: "#c0392b", teal: "#0d9488", purple: "#7c3aed", orange: "#e67e22" };

  return (
    <div style={{ background: T.bg, minHeight: "100vh", fontFamily: T.font, color: T.text, padding: "24px 32px" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
          EP-DT2 · Battery Technology & Supply Chain Finance
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, color: T.text }}>Battery Technology & Supply Chain Finance</h1>
        <p style={{ color: T.textSec, marginTop: 6, fontSize: 14 }}>
          Cell cost trajectories · Critical mineral supply · Gigafactory investment · Recycling economics · Geopolitical risk scoring
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        <KpiCard label="Cell Cost 2025 (LFP)" value="$68" unit="/kWh" sub="Target: $38/kWh by 2030" />
        <KpiCard label="Global Demand 2030" value="2,800" unit="GWh" sub="vs 850 GWh in 2023" color={T.green} />
        <KpiCard label="Gigafactory Capex Need" value={`$${totalCapexNeed}Bn`} unit="" sub="To 2030, excl. China" color={C.teal} />
        <KpiCard label="DRC Cobalt Dependency" value="70%" unit="" sub="HHI 0.52 — High risk" color={T.red} />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{
            padding: "7px 14px", borderRadius: 6, border: `1px solid ${tab === i ? T.gold : T.border}`,
            background: tab === i ? T.navyL : T.surface, color: tab === i ? T.gold : T.textSec,
            cursor: "pointer", fontSize: 12, fontFamily: T.font,
          }}>{t}</button>
        ))}
      </div>

      {tab === 0 && (
        <div>
          <h3 style={{ color: T.gold, marginBottom: 16 }}>Cell Cost Trajectory — Wright's Law Learning Curves</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>All Chemistry Cost Trajectories ($/kWh)</div>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" type="number" domain={[2025, 2040]} tickCount={4} stroke={T.textMut} />
                  <YAxis stroke={T.textMut} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  <Legend />
                  {wrightCurveCell.map((c, i) => (
                    <Line key={c.name} data={c.data} dataKey="cost" name={c.name}
                      stroke={[C.cell, C.mineral, C.teal, C.purple, C.orange][i]} dot={false} strokeWidth={2} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Market Share by Chemistry 2025 vs 2030E (%)</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={CELLS} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" stroke={T.textMut} />
                  <YAxis dataKey="name" type="category" stroke={T.textMut} width={160} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  <Legend />
                  <Bar dataKey="share2025" name="2025 Share %" fill={C.cell} />
                  <Bar dataKey="cost2030" name="Cost 2030 ($/kWh)" fill={C.teal} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div>
          <h3 style={{ color: T.gold, marginBottom: 16 }}>Critical Minerals — Supply Risk & Demand Outlook</h3>
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {MINERALS.map((m, i) => (
              <button key={i} onClick={() => setMineralIdx(i)} style={{
                padding: "6px 12px", borderRadius: 6, border: `1px solid ${mineralIdx === i ? T.gold : T.border}`,
                background: mineralIdx === i ? T.navyL : T.surface, color: mineralIdx === i ? T.gold : T.textSec,
                cursor: "pointer", fontSize: 11, fontFamily: T.font,
              }}>{m.name}</button>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 8 }}>{MINERALS[mineralIdx].name} — Demand & Price Trajectory</div>
              <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                <KpiCard label="Supply Risk (HHI)" value={MINERALS[mineralIdx].hhi.toFixed(2)} unit="" sub="0=diversified, 1=monopoly" color={MINERALS[mineralIdx].hhi > 0.4 ? T.red : T.amber} />
                <KpiCard label="E/W Risk Score" value={MINERALS[mineralIdx].ewRisk} unit="/10" sub={MINERALS[mineralIdx].topProducers[0]} color={MINERALS[mineralIdx].ewRisk > 7 ? T.red : T.amber} />
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={mineralDemandData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" stroke={T.textMut} />
                  <YAxis yAxisId="left" stroke={T.textMut} />
                  <YAxis yAxisId="right" orientation="right" stroke={T.textMut} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="demand" name="Demand (kt)" fill={C.mineral} opacity={0.8} />
                  <Line yAxisId="right" dataKey="price" name="Price ($/t)" stroke={C.cell} dot={false} strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>All Minerals — HHI Concentration Index</div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={MINERALS} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" domain={[0, 0.6]} stroke={T.textMut} />
                  <YAxis dataKey="name" type="category" stroke={T.textMut} width={160} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  <ReferenceLine x={0.25} stroke={T.amber} strokeDasharray="4 4" label={{ value: "Medium", fill: T.amber, fontSize: 10 }} />
                  <ReferenceLine x={0.40} stroke={T.red} strokeDasharray="4 4" label={{ value: "High", fill: T.red, fontSize: 10 }} />
                  <Bar dataKey="hhi" name="HHI Score" fill={C.cell}
                    label={{ position: "right", fontSize: 10, fill: T.textSec, formatter: v => v.toFixed(2) }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 2 && (
        <div>
          <h3 style={{ color: T.gold, marginBottom: 16 }}>Global Gigafactory Investment Tracker</h3>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 16 }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                    {["Gigafactory", "Country", "Capacity (GWh)", "Chemistry", "Op Year", "Capex ($Bn)", "Jobs", "Vertical Scope"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: T.textMut, fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {GIGA_FACTORIES.map((gf, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.surfaceH : "transparent" }}>
                      <td style={{ padding: "8px 12px", color: T.text, fontWeight: 600 }}>{gf.name}</td>
                      <td style={{ padding: "8px 12px", color: T.textSec }}>{gf.country}</td>
                      <td style={{ padding: "8px 12px", color: T.gold, fontFamily: T.mono }}>{gf.cap_gwh}</td>
                      <td style={{ padding: "8px 12px", color: T.textSec }}>{gf.chemistry}</td>
                      <td style={{ padding: "8px 12px", color: gf.opYear <= 2025 ? T.green : T.amber, fontFamily: T.mono }}>{gf.opYear}</td>
                      <td style={{ padding: "8px 12px", color: T.textSec, fontFamily: T.mono }}>${gf.capex_bn}Bn</td>
                      <td style={{ padding: "8px 12px", color: T.textSec }}>{gf.jobs.toLocaleString()}</td>
                      <td style={{ padding: "8px 12px" }}>
                        <span style={{ background: gf.vertical === "Full" ? T.sage : T.navy, color: T.text, padding: "2px 8px", borderRadius: 4, fontSize: 10 }}>{gf.vertical}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Capacity by Country (GWh, Non-China)</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={[
                  { country: "USA", gwh: 225 }, { country: "France/Germany", gwh: 120 },
                  { country: "Hungary", gwh: 100 }, { country: "Sweden", gwh: 60 },
                  { country: "UK", gwh: 38 }, { country: "Norway", gwh: 29 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="country" stroke={T.textMut} tick={{ fontSize: 10 }} />
                  <YAxis stroke={T.textMut} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  <Bar dataKey="gwh" name="Capacity (GWh)" fill={C.teal} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Capex per GWh by Factory ($M/GWh)</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={GIGA_FACTORIES.map(gf => ({ name: gf.name.split(" ").slice(0, 2).join(" "), ratio: +((gf.capex_bn * 1000) / gf.cap_gwh).toFixed(0) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" stroke={T.textMut} tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={50} />
                  <YAxis stroke={T.textMut} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  <Bar dataKey="ratio" name="Capex/GWh ($M)" fill={C.cell} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 3 && (
        <div>
          <h3 style={{ color: T.gold, marginBottom: 16 }}>Supply Chain Concentration Analysis</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>China Processing Dominance by Material (%)</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={[
                  { step: "Li Mining", cn: 22 }, { step: "Li Refining", cn: 58 },
                  { step: "Anode Mat.", cn: 92 }, { step: "Cathode Mat.", cn: 70 },
                  { step: "Cell Mfg", cn: 77 }, { step: "Battery Assy", cn: 71 },
                ]} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" domain={[0, 100]} stroke={T.textMut} />
                  <YAxis dataKey="step" type="category" stroke={T.textMut} width={110} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  <ReferenceLine x={50} stroke={T.amber} strokeDasharray="3 3" />
                  <Bar dataKey="cn" name="China Share %" fill={C.risk} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>HHI by Battery Value Chain Step</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={[
                  { step: "Mining", hhi: 0.22 }, { step: "Refining", hhi: 0.38 },
                  { step: "Precursor", hhi: 0.41 }, { step: "Cathode", hhi: 0.35 },
                  { step: "Anode", hhi: 0.52 }, { step: "Cell", hhi: 0.29 },
                  { step: "Module/Pack", hhi: 0.24 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="step" stroke={T.textMut} tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 0.6]} stroke={T.textMut} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  <ReferenceLine y={0.25} stroke={T.amber} strokeDasharray="3 3" />
                  <ReferenceLine y={0.40} stroke={T.red} strokeDasharray="3 3" />
                  <Bar dataKey="hhi" name="HHI" fill={C.teal} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 16 }}>
            <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>IRA & EU Battery Regulation — Domestic Content Requirements</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {[
                { reg: "IRA §30D (EV Credit)", req: "50% critical mineral from US/FTA by 2024 → 80% by 2027", status: "Active" },
                { reg: "EU Battery Regulation (2023/1542)", req: "Recycled content: Co 16%, Li 6%, Ni 6% by 2031", status: "Active" },
                { reg: "EU CRMA — Strategic Raw Materials", req: "≥10% extraction, ≥40% processing domestic by 2030", status: "Transitional" },
              ].map((r, i) => (
                <div key={i} style={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6, padding: 14 }}>
                  <div style={{ fontSize: 12, color: T.gold, fontWeight: 700, marginBottom: 6 }}>{r.reg}</div>
                  <div style={{ fontSize: 11, color: T.textSec, marginBottom: 8 }}>{r.req}</div>
                  <span style={{ background: r.status === "Active" ? T.sage : T.navy, color: T.text, padding: "2px 8px", borderRadius: 4, fontSize: 10 }}>{r.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 4 && (
        <div>
          <h3 style={{ color: T.gold, marginBottom: 16 }}>Vertical Integration Economics</h3>
          <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 16 }}>Model Parameters</div>
              <Slider label="Scale (GWh/yr)" value={scaleGwh} min={5} max={200} step={5} onChange={setScaleGwh} unit=" GWh" />
              <Slider label="Vertical Integration Level" value={vertInt} min={10} max={100} step={5} onChange={setVertInt} unit="%" />
              <Slider label="Mineral Price Multiplier" value={priceMult} min={0.5} max={3.0} step={0.1} onChange={setPriceMult} unit="×" fmt={v => v.toFixed(1)} />
              <div style={{ marginTop: 16, padding: 12, background: T.surfaceH, borderRadius: 6 }}>
                <div style={{ fontSize: 11, color: T.textMut, marginBottom: 6 }}>Estimated Savings vs Pure OEM</div>
                <div style={{ fontSize: 22, color: T.gold, fontFamily: T.mono, fontWeight: 700 }}>
                  ${(vertInt * 0.12 * priceMult).toFixed(0)}/kWh
                </div>
                <div style={{ fontSize: 10, color: T.textSec, marginTop: 4 }}>at {scaleGwh} GWh/yr scale</div>
              </div>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Cost Reduction by Integration Stage ($/kWh)</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { stage: "Cell Design IP", saving: 4.2, capexBn: 0.5 },
                  { stage: "Anode Production", saving: 6.8, capexBn: 1.2 },
                  { stage: "Cathode Production", saving: 8.5, capexBn: 1.8 },
                  { stage: "Electrolyte Synthesis", saving: 3.1, capexBn: 0.4 },
                  { stage: "Li Refining", saving: 5.2, capexBn: 0.9 },
                  { stage: "Mining Offtake", saving: 7.4, capexBn: 0.3 },
                ]} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" stroke={T.textMut} />
                  <YAxis dataKey="stage" type="category" stroke={T.textMut} width={150} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  <Bar dataKey="saving" name="Cost Saving ($/kWh)" fill={C.mineral} />
                  <Bar dataKey="capexBn" name="Capex ($Bn)" fill={C.teal} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 5 && (
        <div>
          <h3 style={{ color: T.gold, marginBottom: 16 }}>Cell Chemistry Comparison</h3>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {CELLS.map((c, i) => (
              <button key={i} onClick={() => setSelectedChem(c.name)} style={{
                padding: "6px 12px", borderRadius: 6, border: `1px solid ${selectedChem === c.name ? T.gold : T.border}`,
                background: selectedChem === c.name ? T.navyL : T.surface, color: selectedChem === c.name ? T.gold : T.textSec,
                cursor: "pointer", fontSize: 11,
              }}>{c.name.split(" ")[0]}</button>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Chemistry Performance Radar</div>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke={T.border} />
                  <PolarAngleAxis dataKey="axis" tick={{ fill: T.textSec, fontSize: 11 }} />
                  <Radar dataKey="value" fill={C.cell} fillOpacity={0.3} stroke={C.cell} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Critical Mineral Content (kg/kWh)</div>
              {(() => {
                const cell = CELLS.find(c => c.name === selectedChem) || CELLS[0];
                return (
                  <div>
                    {[
                      { label: "Lithium", value: cell.li_kg_kwh, color: C.cell },
                      { label: "Cobalt", value: cell.cobalt_kg_kwh, color: C.risk },
                      { label: "Nickel", value: cell.nickel_kg_kwh, color: C.teal },
                      { label: "Graphite (anode)", value: cell.graphite_kg_kwh, color: C.mineral },
                    ].map(m => (
                      <div key={m.label} style={{ marginBottom: 14 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 12, color: T.textSec }}>{m.label}</span>
                          <span style={{ fontSize: 12, fontFamily: T.mono, color: m.color }}>{m.value} kg/kWh</span>
                        </div>
                        <div style={{ background: T.surfaceH, borderRadius: 4, height: 6 }}>
                          <div style={{ background: m.color, height: "100%", borderRadius: 4, width: `${Math.min(100, m.value * 10)}%` }} />
                        </div>
                      </div>
                    ))}
                    <div style={{ marginTop: 16, padding: 12, background: T.surfaceH, borderRadius: 6 }}>
                      <div style={{ fontSize: 11, color: T.textMut }}>Supply Chain Independence</div>
                      <div style={{ fontSize: 18, color: cell.cobalt_kg_kwh === 0 && cell.li_kg_kwh === 0 ? T.green : T.amber, fontFamily: T.mono, marginTop: 4 }}>
                        {cell.cobalt_kg_kwh === 0 && cell.li_kg_kwh === 0 ? "FULL (Na-Ion)" : cell.cobalt_kg_kwh === 0 ? "HIGH (Cobalt-Free)" : "MEDIUM"}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {tab === 6 && (
        <div>
          <h3 style={{ color: T.gold, marginBottom: 16 }}>Battery Recycling Economics</h3>
          <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 20 }}>
            <div>
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <Slider label="Mineral Price Multiplier" value={priceMult} min={0.5} max={3.0} step={0.1} onChange={setPriceMult} unit="×" fmt={v => v.toFixed(1)} />
                <Slider label="Recycled Share of Supply (%)" value={recycleShare} min={5} max={80} step={5} onChange={setRecycleShare} unit="%" />
                <div style={{ marginTop: 12, padding: 12, background: T.surfaceH, borderRadius: 6 }}>
                  <div style={{ fontSize: 11, color: T.textMut, marginBottom: 4 }}>Best Route at Current Prices</div>
                  <div style={{ fontSize: 14, color: T.green, fontWeight: 700 }}>Hydrometallurgy</div>
                  <div style={{ fontSize: 10, color: T.textSec, marginTop: 2 }}>95% Li · 99% Ni · 99% Co recovery</div>
                </div>
              </div>
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 12 }}>
                <div style={{ fontSize: 12, color: T.textSec, marginBottom: 8 }}>EU Battery Regulation 2031 Targets</div>
                {[["Cobalt recycled content", "16%"], ["Lithium recycled content", "6%"], ["Nickel recycled content", "6%"], ["Lead recycled content", "85%"]].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 11 }}>
                    <span style={{ color: T.textSec }}>{k}</span>
                    <span style={{ color: T.gold, fontFamily: T.mono }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Net Margin by Recycling Route ($/tonne input at {priceMult.toFixed(1)}× prices)</div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={recyclingEconData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="route" stroke={T.textMut} tick={{ fontSize: 10 }} />
                    <YAxis stroke={T.textMut} />
                    <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                    <ReferenceLine y={0} stroke={T.text} />
                    <Bar dataKey="netMargin" name="Net Margin ($/t)" fill={C.mineral}
                      label={{ position: "top", fontSize: 10, fill: T.textSec, formatter: v => v > 0 ? `+${v}` : v }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Recovery Rates by Route & Mineral (%)</div>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={RECYCLING.slice(0, 3)}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="route" stroke={T.textMut} tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} stroke={T.textMut} />
                    <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                    <Legend />
                    <Bar dataKey="li_rec" name="Li Recovery %" fill={C.cell} />
                    <Bar dataKey="ni_rec" name="Ni Recovery %" fill={C.teal} />
                    <Bar dataKey="co_rec" name="Co Recovery %" fill={C.risk} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 7 && (
        <div>
          <h3 style={{ color: T.gold, marginBottom: 16 }}>Geopolitical Risk — Battery Supply Chain</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Geopolitical Risk Score by Key Supplier Nation</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={geoRiskData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" domain={[0, 10]} stroke={T.textMut} />
                  <YAxis dataKey="country" type="category" stroke={T.textMut} width={100} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }}
                    formatter={(v, n, p) => [v, `${p.payload.label} (${p.payload.share}% share)`]} />
                  <ReferenceLine x={7} stroke={T.red} strokeDasharray="3 3" label={{ value: "High Risk", fill: T.red, fontSize: 10 }} />
                  <Bar dataKey="score" name="Risk Score /10" fill={C.risk} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Mitigation Strategies — Feasibility & Cost</div>
              {[
                { strategy: "Friendshoring supply agreements", feasibility: 7.2, cost: 3, timeline: "2–5 yr" },
                { strategy: "Domestic processing (IRA/CRMA)", feasibility: 6.5, cost: 8, timeline: "5–8 yr" },
                { strategy: "Substitute cobalt-free chemistries", feasibility: 8.4, cost: 4, timeline: "1–3 yr" },
                { strategy: "Recycled content scaling", feasibility: 7.8, cost: 5, timeline: "3–6 yr" },
                { strategy: "Strategic stockpiling", feasibility: 5.1, cost: 6, timeline: "Ongoing" },
              ].map((s, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
                  <div>
                    <div style={{ fontSize: 12, color: T.text }}>{s.strategy}</div>
                    <div style={{ fontSize: 10, color: T.textMut, marginTop: 2 }}>{s.timeline}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 12, color: T.green, fontFamily: T.mono }}>Feasibility: {s.feasibility}/10</div>
                    <div style={{ fontSize: 11, color: T.amber, fontFamily: T.mono }}>Cost score: {s.cost}/10</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 8 && (
        <div>
          <h3 style={{ color: T.gold, marginBottom: 16 }}>Battery Pack Cost Stack Breakdown</h3>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {CELLS.map((c, i) => (
              <button key={i} onClick={() => setSelectedChem(c.name)} style={{
                padding: "6px 12px", borderRadius: 6, border: `1px solid ${selectedChem === c.name ? T.gold : T.border}`,
                background: selectedChem === c.name ? T.navyL : T.surface, color: selectedChem === c.name ? T.gold : T.textSec,
                cursor: "pointer", fontSize: 11,
              }}>{c.name.split(" ")[0]}</button>
            ))}
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Pack-Level Cost Stack Evolution ($/kWh) — {selectedChem}</div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={costStackData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" stroke={T.textMut} />
                <YAxis stroke={T.textMut} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                <Legend />
                <Bar dataKey="Cell" stackId="a" fill={C.cell} name="Cell ($/kWh)" />
                <Bar dataKey="ModulePack" stackId="a" fill={C.teal} name="Module/Pack" />
                <Bar dataKey="BMS" stackId="a" fill={C.mineral} name="BMS" />
                <Bar dataKey="Thermal" stackId="a" fill={C.orange} name="Thermal Mgmt" />
                <Bar dataKey="Integration" stackId="a" fill={C.purple} name="System Integration" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 9 && (
        <div>
          <h3 style={{ color: T.gold, marginBottom: 16 }}>Battery Investment Landscape</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Manufacturer: Revenue vs R&D Intensity (bubble = market cap $M)</div>
              <ResponsiveContainer width="100%" height={280}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="x" name="Revenue growth (%)" stroke={T.textMut} label={{ value: "Rev Growth %", position: "insideBottom", offset: -5, fill: T.textMut, fontSize: 10 }} />
                  <YAxis dataKey="y" name="R&D/Rev (%)" stroke={T.textMut} label={{ value: "R&D %", angle: -90, position: "insideLeft", fill: T.textMut, fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }}
                    formatter={(v, n, p) => [v, p.payload.name]} />
                  <Scatter data={invLandscapeData} fill={C.cell} fillOpacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Funding by Segment (2023–2025 Cumulative $Bn)</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={[
                  { seg: "Cell Mfg", equity: 28, debt: 45, grants: 12 },
                  { seg: "Mining/Refining", equity: 18, debt: 22, grants: 4 },
                  { seg: "Recycling", equity: 9, debt: 6, grants: 3 },
                  { seg: "Equipment/BMS", equity: 12, debt: 8, grants: 5 },
                  { seg: "Research/IP", equity: 6, debt: 1, grants: 8 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="seg" stroke={T.textMut} tick={{ fontSize: 10 }} />
                  <YAxis stroke={T.textMut} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  <Legend />
                  <Bar dataKey="equity" stackId="a" name="Equity ($Bn)" fill={C.cell} />
                  <Bar dataKey="debt" stackId="a" name="Debt ($Bn)" fill={C.teal} />
                  <Bar dataKey="grants" stackId="a" name="Grants ($Bn)" fill={C.mineral} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 16 }}>
            <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Key Investment Themes 2025–2030</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {[
                { theme: "Sodium-Ion Scale-Up", rationale: "Cobalt/lithium-free path; CATL, HiNa, Faradion leading; cost target $60/kWh by 2027", risk: "Medium" },
                { theme: "Solid-State Batteries", rationale: "Toyota/QuantumScape 2027–28 commercial; 400+ Wh/kg potential; EV premium market", risk: "High" },
                { theme: "Black Mass Refining", rationale: "EU Battery Regulation driving demand; Northvolt, Li-Cycle, Redwood Materials expanding", risk: "Low" },
                { theme: "Manganese-Rich Cathode", rationale: "LMFP/LNMO: avoids Co/Ni, $40/kWh target; SVOLT, Gotion scaling", risk: "Medium" },
                { theme: "Silicon Anode (10–20% Si)", rationale: "Drop-in improvement to NMC; +20% energy density; Sila, Enovix, Group14", risk: "Medium" },
                { theme: "Gigafactory Infrastructure", rationale: "IRA §48C (30% ITC), EU IPCEI, UK BIC: $4–8Bn capex facilities", risk: "Low" },
              ].map((t, i) => (
                <div key={i} style={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6, padding: 14 }}>
                  <div style={{ fontSize: 12, color: T.gold, fontWeight: 700, marginBottom: 6 }}>{t.theme}</div>
                  <div style={{ fontSize: 11, color: T.textSec, marginBottom: 8 }}>{t.rationale}</div>
                  <span style={{ background: t.risk === "Low" ? T.sage : t.risk === "Medium" ? T.teal : T.navy, color: T.text, padding: "2px 8px", borderRadius: 4, fontSize: 10 }}>
                    Risk: {t.risk}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      <EnergyAdvancedAnalytics T={T} moduleCode="EP-DT2" title="Battery Tech & Supply Chain — MC Cell Cost, Tornado & NGFS Mineral Scenarios"
        mcModel={{ title: 'MC NMC Cell Cost ($/kWh)', unit: '/kWh', fmt: (n) => `$${n.toFixed(1)}`,
        vars: { liCarb: { min: 12000, mode: 22000, max: 45000 }, ni: { min: 14000, mode: 22000, max: 34000 }, co: { min: 22000, mode: 35000, max: 60000 }, ggLearn: { min: 0.16, mode: 0.20, max: 0.24 } },
        compute: (v) => { const base = 75; const mat = (v.liCarb / 22000) * 15 + (v.ni / 22000) * 12 + (v.co / 35000) * 8; const learn = base * Math.pow(0.9, v.ggLearn * 10); return Math.max(55, learn + mat - 25); } }}
      tornadoModel={{ title: 'Tornado — NMC Cell Cost Drivers', unit: '/kWh', fmt: (n) => `$${n.toFixed(1)}`,
        inputs: { liCarb: 22000, ni: 22000, co: 35000, ggLearn: 0.20 },
        compute: (v) => { const base = 75; const mat = (v.liCarb / 22000) * 15 + (v.ni / 22000) * 12 + (v.co / 35000) * 8; const learn = base * Math.pow(0.9, v.ggLearn * 10); return Math.max(55, learn + mat - 25); } }}
      scenarioImpact={(p) => Math.max(55, 95 - 0.15 * Math.max(0, p - 40))} scenarioFmt={(v) => `$${v.toFixed(0)}/kWh`}
      scenarioTitle="Carbon Price × NGFS Pathway — Cell cost through scale-up ($/kWh)"
      peers={{ cols: [{ k: 'mfr', label: 'Cell maker' }, { k: 'gwh', label: 'GWh cap', fmt: (v) => `${v}` }, { k: 'chem', label: 'Dominant chemistry' }, { k: 'cost', label: 'Cost ($/kWh)', fmt: (v) => `$${v}` }, { k: 'region', label: 'Region' }],
        rows: [{ mfr: 'CATL',        gwh: 650, chem: 'LFP / NMC',  cost: 68,  region: 'CN' }, { mfr: 'BYD',         gwh: 285, chem: 'LFP (Blade)', cost: 72,  region: 'CN' }, { mfr: 'LG Energy',   gwh: 345, chem: 'NMC / NCM9',  cost: 82,  region: 'KR/US' }, { mfr: 'Samsung SDI', gwh: 190, chem: 'NCA / NMC',   cost: 86,  region: 'KR/HU' }, { mfr: 'Panasonic',   gwh: 175, chem: 'NCA',          cost: 88,  region: 'JP/US' }, { mfr: 'Northvolt',   gwh: 85,  chem: 'NMC 811',      cost: 98,  region: 'EU' }] }}
      />
    </div>
  );
}
