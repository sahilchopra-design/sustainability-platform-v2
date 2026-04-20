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

function calcGhpEconomics({ heatingLoad, cop, gasPrice, electricityPrice, installCost,
  subsidyPct, lifetime, discountRate }) {
  const w = discountRate / 100;
  const annualElec = heatingLoad / cop;
  const annualElecCost = annualElec * electricityPrice;
  const gasEquivCost = heatingLoad * gasPrice;
  const annualSaving = gasEquivCost - annualElecCost;
  const netInstall = installCost * (1 - subsidyPct / 100);
  const payback = annualSaving > 0 ? netInstall / annualSaving : Infinity;
  const npvSavings = annualSaving * (1 - Math.pow(1 + w, -lifetime)) / w;
  const npv = npvSavings - netInstall;
  return { annualElecCost, gasEquivCost, annualSaving, netInstall, payback, npv };
}

function calcDistrictHeating({ wellsMw, transmissionKm, numBuildings, avgBuildingKw,
  heatPrice, capexWell, capexNetwork, opexPct, wacc, lifetime }) {
  const w = wacc / 100;
  const totalCapex = capexWell * wellsMw + capexNetwork * transmissionKm;
  const annRevenue = numBuildings * avgBuildingKw / 1000 * heatPrice * 8760 * 0.85 / 1e6;
  const opexAnn = totalCapex * opexPct / 100;
  const ebitda = annRevenue - opexAnn;
  const capexAnn = totalCapex * w / (1 - Math.pow(1 + w, -lifetime));
  const lcoh = ebitda > 0 ? +(capexAnn / (numBuildings * avgBuildingKw / 1000 * 8760 * 0.85)).toFixed(4) : 0;
  return { totalCapex, annRevenue, ebitda, lcoh };
}

const DIRECT_USE_APPS = [
  { app: "Space Heating (District)", share: 32, temp: "50-150°C", examples: "Reykjavik, Paris, Munich", marketB: 8.2 },
  { app: "Greenhouse Heating",       share: 18, temp: "25-90°C",  examples: "Netherlands, Hungary, China", marketB: 4.5 },
  { app: "Aquaculture",              share: 8,  temp: "20-35°C",  examples: "Iceland, USA, Japan", marketB: 2.1 },
  { app: "Industrial Process Heat",  share: 15, temp: "100-200°C",examples: "Food processing, pulp/paper", marketB: 3.8 },
  { app: "Balneology / Spa",         share: 12, temp: "35-65°C",  examples: "Hungary, Turkey, Germany", marketB: 3.1 },
  { app: "Snow Melting / De-icing",  share: 6,  temp: "40-80°C",  examples: "Iceland, Norway, Japan", marketB: 1.5 },
  { app: "Timber Drying",            share: 4,  temp: "60-120°C", examples: "New Zealand, Kenya", marketB: 1.0 },
  { app: "Other Industrial",         share: 5,  temp: "Various",  examples: "Cooling, refrigeration", marketB: 1.2 },
];

const PROCESS_HEAT_SECTORS = [
  { sector: "Food & Beverage",    temp: 80,  demand: 45, replaceGas: 0.92, countries: "Germany, UK, NZ" },
  { sector: "Pulp & Paper",       temp: 130, demand: 38, replaceGas: 0.85, countries: "Finland, Sweden" },
  { sector: "Textiles",           temp: 100, demand: 22, replaceGas: 0.90, countries: "Turkey, Italy" },
  { sector: "Chemicals",          temp: 150, demand: 55, replaceGas: 0.75, countries: "Germany, Netherlands" },
  { sector: "Pharmaceuticals",    temp: 120, demand: 18, replaceGas: 0.88, countries: "Switzerland, Ireland" },
  { sector: "Dairy Processing",   temp: 75,  demand: 30, replaceGas: 0.95, countries: "NZ, Iceland, Netherlands" },
  { sector: "Desalination",       temp: 60,  demand: 42, replaceGas: 0.80, countries: "Kenya, Ethiopia, GCC" },
];

const DISTRICT_EXAMPLES = [
  { city: "Reykjavik, Iceland",    connections: 99, mwth: 900,  tempSupply: 88,  fuelSave: 120, co2SaveKt: 420 },
  { city: "Paris, France",         connections: 12, mwth: 260,  tempSupply: 70,  fuelSave: 45,  co2SaveKt: 92 },
  { city: "Munich, Germany",       connections: 8,  mwth: 180,  tempSupply: 80,  fuelSave: 28,  co2SaveKt: 65 },
  { city: "Boise, Idaho USA",      connections: 95, mwth: 45,   tempSupply: 77,  fuelSave: 8,   co2SaveKt: 18 },
  { city: "Rotorua, NZ",           connections: 80, mwth: 120,  tempSupply: 60,  fuelSave: 22,  co2SaveKt: 38 },
  { city: "Daqing, China",         connections: 40, mwth: 400,  tempSupply: 55,  fuelSave: 80,  co2SaveKt: 180 },
];

const TABS = [
  "Direct Use Overview", "GHP Economics", "District Heating", "Industrial Heat",
  "Cascade Design", "vs. Fossil HVAC", "Carbon Savings", "Global Examples",
  "Policy & Incentives", "Investment Returns"
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

export default function GeothermalDirectUsePage() {
  const [tab, setTab] = useState(0);
  const [heatingLoad, setHeatingLoad] = useState(20000);
  const [cop, setCop]                 = useState(4.5);
  const [gasPrice, setGasPrice]       = useState(0.08);
  const [elecPrice, setElecPrice]     = useState(0.12);
  const [installCost, setInstallCost] = useState(18000);
  const [subsidy, setSubsidy]         = useState(30);
  const [lifetime, setLifetime]       = useState(25);
  const [discountRate, setDiscountRate] = useState(7);
  const [wellsMw, setWellsMw]         = useState(10);
  const [networkKm, setNetworkKm]     = useState(15);
  const [buildings, setBuildings]     = useState(500);
  const [buildingKw, setBuildingKw]   = useState(50);
  const [heatPrice, setHeatPrice]     = useState(55);
  const [carbonPrice, setCarbonPrice] = useState(80);

  const ghp = useMemo(() => calcGhpEconomics({
    heatingLoad, cop, gasPrice, electricityPrice: elecPrice,
    installCost, subsidyPct: subsidy, lifetime, discountRate
  }), [heatingLoad, cop, gasPrice, elecPrice, installCost, subsidy, lifetime, discountRate]);

  const dh = useMemo(() => calcDistrictHeating({
    wellsMw, transmissionKm: networkKm, numBuildings: buildings, avgBuildingKw: buildingKw,
    heatPrice, capexWell: 1.2e6, capexNetwork: 0.8e6, opexPct: 3, wacc: 7, lifetime: 30
  }), [wellsMw, networkKm, buildings, buildingKw, heatPrice]);

  const ghpCo2Saving = useMemo(() => {
    const gasEmissions = heatingLoad * 0.204;
    const elecEmissions = heatingLoad / cop * 0.233;
    return +(gasEmissions - elecEmissions).toFixed(0);
  }, [heatingLoad, cop]);

  const copCompare = useMemo(() => [2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0].map(c => ({
    cop: c,
    annualElec: +(heatingLoad / c * elecPrice).toFixed(0),
    saving: +(heatingLoad * gasPrice - heatingLoad / c * elecPrice).toFixed(0),
  })), [heatingLoad, elecPrice, gasPrice]);

  const paybackByCarbonPrice = useMemo(() => [0, 25, 50, 75, 100, 150, 200].map(cp => {
    const carbonBonus = ghpCo2Saving * cp / 1000;
    const effectiveSaving = ghp.annualSaving + carbonBonus;
    return { carbonPrice: cp, payback: effectiveSaving > 0 ? +(ghp.netInstall / effectiveSaving).toFixed(1) : 99 };
  }), [ghp, ghpCo2Saving]);

  const cascadeTiers = [
    { tier: 1, app: "Power Generation", tempIn: 200, tempOut: 100, energyMw: 10, revenue: 0.85, color: T.red },
    { tier: 2, app: "Industrial Process Heat", tempIn: 100, tempOut: 70,  energyMw: 6,  revenue: 0.04, color: T.amber },
    { tier: 3, app: "Greenhouse Heating", tempIn: 70,  tempOut: 40,  energyMw: 4,  revenue: 0.025, color: T.green },
    { tier: 4, app: "Aquaculture",        tempIn: 40,  tempOut: 20,  energyMw: 2,  revenue: 0.02, color: T.teal },
  ];

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
        <div style={{ fontSize: 11, color: T.gold, fontFamily: T.mono, letterSpacing: 2, marginBottom: 6 }}>EP-DV4 · GEOTHERMAL ENERGY FINANCE</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Geothermal Direct Use & Heat Pump Economics</h1>
        <div style={{ fontSize: 13, color: T.textSec, marginTop: 6 }}>GHP COP Model · District Heating Finance · Industrial Process Heat · Cascade Design · vs. Fossil HVAC</div>
      </div>

      <div style={styles.tabs}>
        {TABS.map((t, i) => <button key={t} style={styles.tab(tab === i)} onClick={() => setTab(i)}>{t}</button>)}
      </div>

      {tab === 0 && (
        <div>
          <div style={styles.grid3}>
            <KpiCard label="Global Direct Use" value="107" unit="GWth" sub="Installed thermal capacity, 2023" />
            <KpiCard label="District Heating Share" value="32%" unit="" sub="Largest direct use application" color={T.green} />
            <KpiCard label="Total Heat Production" value="1.02" unit="EJ/yr" sub="2023 global geothermal heat" color={T.amber} />
          </div>
          <div style={styles.panel}>
            <div style={styles.h3}>Direct Use Applications by Share</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={[...DIRECT_USE_APPS].sort((a, b) => b.share - a.share)} margin={{ top: 5, right: 20, bottom: 50, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="app" tick={{ fontSize: 9, fill: T.textMut }} angle={-25} textAnchor="end" />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} unit="%" />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}` }} />
                <Bar dataKey="share" name="Share (%)" fill={T.gold} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={styles.panel}>
            <div style={styles.h3}>Direct Use Categories — Temperature, Market, Examples</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${T.gold}` }}>
                    {["Application", "Temp Range", "Global Market ($B)", "Share (%)", "Key Markets"].map(h => (
                      <th key={h} style={{ padding: "7px 10px", textAlign: "left", color: T.gold, fontFamily: T.mono, fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DIRECT_USE_APPS.map((a, i) => (
                    <tr key={a.app} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 ? T.surfaceH : "transparent" }}>
                      <td style={{ padding: "7px 10px", color: T.text }}>{a.app}</td>
                      <td style={{ padding: "7px 10px", fontFamily: T.mono, color: T.amber }}>{a.temp}</td>
                      <td style={{ padding: "7px 10px", fontFamily: T.mono, color: T.gold }}>${a.marketB}B</td>
                      <td style={{ padding: "7px 10px", fontFamily: T.mono }}>{a.share}%</td>
                      <td style={{ padding: "7px 10px", color: T.textSec }}>{a.examples}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div style={styles.grid2}>
          <div>
            <div style={styles.panel}>
              <div style={styles.h3}>Ground Source Heat Pump (GHP) Economics</div>
              <Slider label="Annual Heating Load" value={heatingLoad} min={5000} max={100000} step={1000} onChange={setHeatingLoad} unit=" kWh/yr" fmt={v => v.toLocaleString()} />
              <Slider label="COP (Coefficient of Performance)" value={cop} min={2.5} max={7} step={0.25} onChange={setCop} unit="x" />
              <Slider label="Gas Price (alternative)" value={gasPrice} min={0.02} max={0.25} step={0.01} onChange={setGasPrice} unit=" $/kWh" />
              <Slider label="Electricity Price" value={elecPrice} min={0.05} max={0.35} step={0.01} onChange={setElecPrice} unit=" $/kWh" />
              <Slider label="GHP Installation Cost" value={installCost} min={5000} max={60000} step={1000} onChange={setInstallCost} unit=" $" fmt={v => `$${v.toLocaleString()}`} />
              <Slider label="Government Subsidy" value={subsidy} min={0} max={60} step={5} onChange={setSubsidy} unit="%" />
              <Slider label="System Lifetime" value={lifetime} min={15} max={30} step={5} onChange={setLifetime} unit=" yr" />
              <Slider label="Discount Rate" value={discountRate} min={3} max={12} step={0.5} onChange={setDiscountRate} unit="%" />
            </div>
          </div>
          <div>
            <div style={styles.grid2}>
              <KpiCard label="Annual Saving" value={`$${ghp.annualSaving.toFixed(0)}`} unit="/yr" sub="vs. gas heating" color={ghp.annualSaving > 0 ? T.green : T.red} />
              <KpiCard label="Simple Payback" value={ghp.payback < 50 ? ghp.payback.toFixed(1) : ">50"} unit=" yr" sub={`Net install: $${ghp.netInstall.toFixed(0)}`} color={ghp.payback < 15 ? T.green : T.amber} />
              <KpiCard label="NPV of Savings" value={`$${ghp.npv.toFixed(0)}`} unit="" sub={`${discountRate}% discount, ${lifetime}yr`} color={ghp.npv > 0 ? T.green : T.red} />
              <KpiCard label="CO₂ Saved" value={ghpCo2Saving} unit=" kg/yr" sub="vs gas heating (UK grid)" color={T.teal} />
            </div>
            <div style={styles.panel}>
              <div style={styles.h3}>Annual Cost: GHP vs. Gas Boiler</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={[
                  { system: "Gas Boiler", cost: +ghp.gasEquivCost.toFixed(0) },
                  { system: "GHP (electricity)", cost: +ghp.annualElecCost.toFixed(0) },
                ]} margin={{ top: 5, right: 10, bottom: 10, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="system" tick={{ fontSize: 11, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 10, fill: T.textSec }} unit="$" />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}` }} formatter={v => [`$${v}/yr`]} />
                  <Bar dataKey="cost" fill={T.gold} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 2 && (
        <div style={styles.grid2}>
          <div>
            <div style={styles.panel}>
              <div style={styles.h3}>District Heating System Parameters</div>
              <Slider label="Geothermal Capacity" value={wellsMw} min={2} max={50} step={1} onChange={setWellsMw} unit=" MWth" />
              <Slider label="Network Length" value={networkKm} min={2} max={80} step={1} onChange={setNetworkKm} unit=" km" />
              <Slider label="Connected Buildings" value={buildings} min={50} max={5000} step={50} onChange={setBuildings} unit=" bldgs" />
              <Slider label="Avg Building Heat Load" value={buildingKw} min={10} max={200} step={5} onChange={setBuildingKw} unit=" kW" />
              <Slider label="Heat Tariff" value={heatPrice} min={20} max={120} step={5} onChange={setHeatPrice} unit=" $/MWh" />
            </div>
          </div>
          <div>
            <div style={styles.grid2}>
              <KpiCard label="System Revenue" value={dh.annRevenue.toFixed(1)} unit="$M/yr" sub={`${buildings} buildings connected`} />
              <KpiCard label="Total CAPEX" value={(dh.totalCapex / 1e6).toFixed(0)} unit="$M" sub={`Wells + ${networkKm}km network`} color={T.amber} />
              <KpiCard label="LCOH" value={dh.lcoh > 0 ? (dh.lcoh * 1000).toFixed(1) : "N/A"} unit="$/MWh" sub="Levelized cost of heat" color={T.teal} />
              <KpiCard label="EBITDA" value={dh.ebitda.toFixed(1)} unit="$M/yr" sub="Before capital charges" color={dh.ebitda > 0 ? T.green : T.red} />
            </div>
            <div style={styles.panel}>
              <div style={styles.h3}>District Heating vs. Individual Gas Boilers</div>
              {[
                { metric: "Heat Supply Cost", dh: `$${heatPrice}/MWh`, gas: "$80-120/MWh", winner: "DH" },
                { metric: "CO₂ Intensity", dh: "30-60 kg/MWh", gas: "230 kg/MWh", winner: "DH" },
                { metric: "System Reliability", dh: "99.5%+", gas: "Variable", winner: "DH" },
                { metric: "Capital Cost per User", dh: `$${(dh.totalCapex / 1e6 / buildings * 1000).toFixed(0)}`, gas: "$2,000-4,000", winner: "Gas" },
                { metric: "Connection Density", dh: "50+ kW/ha needed", gas: "Any density", winner: "Gas" },
              ].map(r => (
                <div key={r.metric} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
                  <span style={{ color: T.textSec }}>{r.metric}</span>
                  <div style={{ display: "flex", gap: 20, fontFamily: T.mono }}>
                    <span style={{ color: r.winner === "DH" ? T.green : T.textSec }}>{r.dh}</span>
                    <span style={{ color: r.winner === "Gas" ? T.amber : T.textSec }}>{r.gas}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 3 && (
        <div>
          <div style={styles.grid3}>
            <KpiCard label="Industrial Heat Market" value="$25B" unit="" sub="Geothermal process heat addressable" />
            <KpiCard label="Avg Gas Displacement" value="87%" unit="" sub="Across viable industrial sectors" color={T.green} />
            <KpiCard label="Temperature Range" value="60-200" unit="°C" sub="Viable for geothermal process heat" color={T.amber} />
          </div>
          <div style={styles.panel}>
            <div style={styles.h3}>Industrial Process Heat — Sector Analysis</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${T.gold}` }}>
                    {["Sector", "Req. Temp (°C)", "Annual Demand (TWh)", "Gas Displacement (%)", "Key Countries"].map(h => (
                      <th key={h} style={{ padding: "7px 10px", textAlign: "left", color: T.gold, fontFamily: T.mono, fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PROCESS_HEAT_SECTORS.map((s, i) => (
                    <tr key={s.sector} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 ? T.surfaceH : "transparent" }}>
                      <td style={{ padding: "7px 10px", color: T.text }}>{s.sector}</td>
                      <td style={{ padding: "7px 10px", fontFamily: T.mono, color: s.temp > 140 ? T.amber : T.text }}>{s.temp}°C</td>
                      <td style={{ padding: "7px 10px", fontFamily: T.mono }}>{s.demand} TWh</td>
                      <td style={{ padding: "7px 10px", fontFamily: T.mono, color: s.replaceGas > 0.9 ? T.green : T.amber }}>{(s.replaceGas * 100).toFixed(0)}%</td>
                      <td style={{ padding: "7px 10px", color: T.textSec }}>{s.countries}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div style={styles.panel}>
            <div style={styles.h3}>Gas Displacement Potential by Sector</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={PROCESS_HEAT_SECTORS} margin={{ top: 5, right: 20, bottom: 50, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="sector" tick={{ fontSize: 9, fill: T.textMut }} angle={-25} textAnchor="end" />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} unit="%" />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}` }} />
                <Bar dataKey="replaceGas" name="Gas Displacement (%)" fill={T.green} formatter={v => `${(v * 100).toFixed(0)}%`} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 4 && (
        <div style={styles.panel}>
          <div style={styles.h3}>Cascaded Geothermal Use — Temperature Ladder</div>
          <div style={{ fontSize: 12, color: T.textSec, marginBottom: 16 }}>
            Cascaded use extracts maximum value from geothermal brine by using progressively lower temperature heat across multiple applications, from power generation down to aquaculture.
          </div>
          {cascadeTiers.map((tier, i) => (
            <div key={tier.tier} style={{ background: T.surfaceH, border: `2px solid ${tier.color}`, borderRadius: 8, padding: 16, marginBottom: 12, position: "relative" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 11, fontFamily: T.mono, color: tier.color, marginBottom: 4 }}>TIER {tier.tier}</div>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>{tier.app}</div>
                  <div style={{ fontSize: 12, color: T.textSec, marginTop: 4 }}>
                    Inlet: <span style={{ color: T.amber, fontFamily: T.mono }}>{tier.tempIn}°C</span> → Outlet: <span style={{ fontFamily: T.mono }}>{tier.tempOut}°C</span>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: T.mono, fontSize: 20, color: tier.color }}>{tier.energyMw} MWth</div>
                  <div style={{ fontSize: 11, color: T.textSec }}>Revenue: ${tier.revenue}/kWh equiv.</div>
                </div>
              </div>
              {i < cascadeTiers.length - 1 && (
                <div style={{ textAlign: "center", color: T.textMut, fontSize: 11, marginTop: 8 }}>↓ Fluid continues at {cascadeTiers[i + 1].tempIn}°C</div>
              )}
            </div>
          ))}
          <div style={styles.panel}>
            <div style={styles.h3}>Cascade Economics Summary</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={cascadeTiers} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="app" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} unit=" MW" />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}` }} />
                <Bar dataKey="energyMw" name="Energy Extracted (MWth)" fill={T.gold} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 5 && (
        <div>
          <div style={styles.panel}>
            <div style={styles.h3}>GHP vs. Gas Boiler vs. ASHP — Annual Cost Comparison</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={copCompare} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="cop" tick={{ fontSize: 10, fill: T.textSec }} label={{ value: "COP", position: "insideBottom", offset: -10, fill: T.textSec, fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} unit="$/yr" />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}` }} formatter={v => [`$${v}/yr`]} />
                <Bar dataKey="annualElec" name="GHP Electricity Cost" fill={T.teal} />
                <Bar dataKey="saving" name="Annual Saving vs Gas" fill={T.green} />
                <ReferenceLine y={heatingLoad * gasPrice} stroke={T.red} strokeDasharray="4 4" label={{ value: "Gas boiler cost", fill: T.red, fontSize: 10 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={styles.grid3}>
            {[
              { system: "Gas Boiler (95% eff.)", opex: +(heatingLoad * gasPrice).toFixed(0), capex: 3000, co2: +(heatingLoad * 0.204).toFixed(0), color: T.red },
              { system: "ASHP (COP 3.0)", opex: +(heatingLoad / 3 * elecPrice).toFixed(0), capex: 8000, co2: +(heatingLoad / 3 * 0.233).toFixed(0), color: T.amber },
              { system: `GHP (COP ${cop})`, opex: +(heatingLoad / cop * elecPrice).toFixed(0), capex: installCost, co2: +(heatingLoad / cop * 0.233).toFixed(0), color: T.green },
            ].map(s => (
              <div key={s.system} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: s.color, marginBottom: 10 }}>{s.system}</div>
                <div style={{ fontSize: 12 }}>Annual Cost: <span style={{ fontFamily: T.mono, color: T.text }}>${s.opex}/yr</span></div>
                <div style={{ fontSize: 12 }}>Capital Cost: <span style={{ fontFamily: T.mono, color: T.text }}>${s.capex.toLocaleString()}</span></div>
                <div style={{ fontSize: 12 }}>CO₂: <span style={{ fontFamily: T.mono, color: T.amber }}>{s.co2} kg/yr</span></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 6 && (
        <div>
          <div style={styles.grid3}>
            <KpiCard label="GHP CO₂ Savings" value={ghpCo2Saving.toLocaleString()} unit=" kg/yr" sub="vs. equivalent gas heating" color={T.green} />
            <KpiCard label="Carbon Value" value={`$${(ghpCo2Saving * carbonPrice / 1000).toFixed(0)}`} unit="/yr" sub={`@$${carbonPrice}/t CO₂`} color={T.gold} />
            <KpiCard label="Lifetime CO₂ Saved" value={(ghpCo2Saving * lifetime / 1000).toFixed(1)} unit=" tCO₂" sub={`Over ${lifetime} years`} color={T.teal} />
          </div>
          <div style={styles.panel}>
            <div style={styles.h3}>Carbon Pricing Impact on Payback Period</div>
            <Slider label="Carbon Price" value={carbonPrice} min={0} max={250} step={10} onChange={setCarbonPrice} unit=" $/t" />
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={paybackByCarbonPrice} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="carbonPrice" tick={{ fontSize: 10, fill: T.textSec }} label={{ value: "Carbon Price ($/t)", position: "insideBottom", offset: -10, fill: T.textSec, fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} label={{ value: "Payback (yr)", angle: -90, position: "insideLeft", fill: T.textSec, fontSize: 11 }} domain={[0, 50]} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}` }} formatter={v => [`${v} yr`]} />
                <Line type="monotone" dataKey="payback" name="Simple Payback" stroke={T.gold} strokeWidth={2} dot={{ fill: T.gold, r: 3 }} />
                <ReferenceLine y={10} stroke={T.green} strokeDasharray="4 4" label={{ value: "10yr target", fill: T.green, fontSize: 10 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 7 && (
        <div style={styles.panel}>
          <div style={styles.h3}>Global District Heating Examples</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.gold}` }}>
                  {["City", "Coverage (%)", "Thermal Cap. (MWth)", "Supply Temp (°C)", "Fuel Saved (M€/yr)", "CO₂ Saved (kt/yr)"].map(h => (
                    <th key={h} style={{ padding: "7px 10px", textAlign: "left", color: T.gold, fontFamily: T.mono, fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DISTRICT_EXAMPLES.map((d, i) => (
                  <tr key={d.city} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 ? T.surfaceH : "transparent" }}>
                    <td style={{ padding: "7px 10px", color: T.text, fontWeight: 600 }}>{d.city}</td>
                    <td style={{ padding: "7px 10px", fontFamily: T.mono, color: d.connections > 90 ? T.green : T.amber }}>{d.connections}%</td>
                    <td style={{ padding: "7px 10px", fontFamily: T.mono }}>{d.mwth}</td>
                    <td style={{ padding: "7px 10px", fontFamily: T.mono }}>{d.tempSupply}°C</td>
                    <td style={{ padding: "7px 10px", fontFamily: T.mono, color: T.gold }}>{d.fuelSave}M€</td>
                    <td style={{ padding: "7px 10px", fontFamily: T.mono, color: T.green }}>{d.co2SaveKt} kt</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 8 && (
        <div style={styles.panel}>
          <div style={styles.h3}>Policy & Incentive Landscape — Direct Use & GHP</div>
          {[
            { country: "Germany", program: "Bundesförderung Wärmepumpe (BEW)", subsidy: "Up to 70%", type: "Grant + loan", status: "Active 2026" },
            { country: "USA", program: "IRA Residential Clean Energy Credit (25D)", subsidy: "30% tax credit", type: "Tax credit", status: "2023-2032" },
            { country: "UK", program: "Boiler Upgrade Scheme (BUS)", subsidy: "£7,500 grant", type: "Direct grant", status: "Active" },
            { country: "France", program: "MaPrimeRénov' + Eco-PTZ", subsidy: "50-70%", type: "Grant + zero-rate loan", status: "Active" },
            { country: "Iceland", program: "Orkusjóður (Energy Fund)", subsidy: "State infrastructure loans", type: "Concessional loan", status: "Ongoing" },
            { country: "Kenya", program: "KETRACO Geothermal District Heating", subsidy: "KenGen exploration support", type: "State support", status: "Pilot phase" },
            { country: "EU", program: "Green Deal / REPowerEU Heat Pump Target", subsidy: "EU taxonomy access", type: "Taxonomy + blended finance", status: "10M pumps by 2030" },
          ].map((p, i) => (
            <div key={p.country} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
              <div>
                <div style={{ fontWeight: 600, color: T.gold }}>{p.country} — <span style={{ color: T.text, fontWeight: 400 }}>{p.program}</span></div>
                <div style={{ fontSize: 11, color: T.textMut }}>{p.type} · {p.status}</div>
              </div>
              <div style={{ fontFamily: T.mono, color: T.green, textAlign: "right" }}>{p.subsidy}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 9 && (
        <div style={styles.grid2}>
          <div style={styles.panel}>
            <div style={styles.h3}>GHP Investment Returns Summary</div>
            {[
              { label: "Annual Saving vs Gas", value: `$${ghp.annualSaving.toFixed(0)}/yr`, color: T.green },
              { label: "Net Install Cost", value: `$${ghp.netInstall.toFixed(0)}`, color: T.text },
              { label: "Subsidy", value: `${subsidy}% (saves $${(installCost * subsidy / 100).toFixed(0)})`, color: T.gold },
              { label: "Simple Payback", value: `${ghp.payback < 50 ? ghp.payback.toFixed(1) : ">50"} yr`, color: ghp.payback < 15 ? T.green : T.amber },
              { label: "25-yr NPV of Savings", value: `$${ghp.npv.toFixed(0)}`, color: ghp.npv > 0 ? T.green : T.red },
              { label: "CO₂ Savings / yr", value: `${ghpCo2Saving.toLocaleString()} kg`, color: T.teal },
              { label: "Carbon Value / yr", value: `$${(ghpCo2Saving * carbonPrice / 1000).toFixed(0)}`, color: T.gold },
            ].map(r => (
              <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${T.border}` }}>
                <span style={{ fontSize: 13, color: T.textSec }}>{r.label}</span>
                <span style={{ fontFamily: T.mono, color: r.color, fontSize: 13 }}>{r.value}</span>
              </div>
            ))}
          </div>
          <div style={styles.panel}>
            <div style={styles.h3}>District Heating Investment Summary</div>
            {[
              { label: "System Capacity", value: `${wellsMw} MWth`, color: T.text },
              { label: "Total CAPEX", value: `$${(dh.totalCapex / 1e6).toFixed(0)}M`, color: T.amber },
              { label: "Annual Revenue", value: `$${dh.annRevenue.toFixed(1)}M/yr`, color: T.gold },
              { label: "EBITDA", value: `$${dh.ebitda.toFixed(1)}M/yr`, color: dh.ebitda > 0 ? T.green : T.red },
              { label: "LCOH", value: `$${dh.lcoh > 0 ? (dh.lcoh * 1000).toFixed(1) : "N/A"}/MWh`, color: T.teal },
              { label: "Buildings Connected", value: `${buildings.toLocaleString()}`, color: T.text },
              { label: "Network Length", value: `${networkKm} km`, color: T.text },
            ].map(r => (
              <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${T.border}` }}>
                <span style={{ fontSize: 13, color: T.textSec }}>{r.label}</span>
                <span style={{ fontFamily: T.mono, color: r.color, fontSize: 13 }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
