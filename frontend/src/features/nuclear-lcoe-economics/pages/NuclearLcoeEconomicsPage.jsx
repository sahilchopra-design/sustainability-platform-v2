import React, { useState, useMemo } from "react";
import { BarChart, Bar, LineChart, Line, AreaChart, Area, ComposedChart,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
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

function calcLcoe({ capexPerKw, opexFixed, opexVar, fuelCost, constructYr, lifetime, wacc, cf, decommPct }) {
  const w = wacc / 100;
  const capexAnn = capexPerKw * w / (1 - Math.pow(1 + w, -lifetime));
  const idcFactor = Math.pow(1 + w, constructYr / 2);
  const capexAdj = capexAnn * idcFactor;
  const decomm = capexPerKw * decommPct / 100 * w / (1 - Math.pow(1 + w, -lifetime));
  const annualMwh = cf / 100 * 8760;
  return annualMwh > 0 ? +((capexAdj + opexFixed + decomm) / annualMwh + (opexVar + fuelCost) / 1000).toFixed(4) : 0;
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

const REACTOR_TYPES = [
  { name: "PWR (Gen III+, AP1000)", capex_kw: 7500, cf: 92, lifetime: 60, opexFixed: 18, opexVar: 4.2, fuelCost: 8.5, constructYr: 6, wacc: 8, decommPct: 15, country: "USA/China", examples: "Vogtle 3/4, Haiyang" },
  { name: "BWR (Gen III, ABWR)", capex_kw: 7200, cf: 90, lifetime: 60, opexFixed: 20, opexVar: 4.8, fuelCost: 8.5, constructYr: 5, wacc: 8, decommPct: 15, country: "Japan", examples: "Shimane 3, South Texas" },
  { name: "EPR (Gen III+)", capex_kw: 10500, cf: 91, lifetime: 60, opexFixed: 16, opexVar: 4.0, fuelCost: 8.0, constructYr: 9, wacc: 7, decommPct: 14, country: "France/UK/Finland", examples: "Hinkley C, Flamanville 3" },
  { name: "VVER-1200 (Gen III+)", capex_kw: 5800, cf: 90, lifetime: 60, opexFixed: 14, opexVar: 3.8, fuelCost: 7.0, constructYr: 6, wacc: 6, decommPct: 12, country: "Russia/EU", examples: "Leningrad II, Akkuyu" },
  { name: "CANDU 6 / EC6", capex_kw: 6800, cf: 88, lifetime: 40, opexFixed: 22, opexVar: 5.0, fuelCost: 5.5, constructYr: 5, wacc: 7.5, decommPct: 14, country: "Canada/China", examples: "Darlington, Qinshan III" },
  { name: "PHWR (IPHWR-700)", capex_kw: 5500, cf: 85, lifetime: 40, opexFixed: 20, opexVar: 4.6, fuelCost: 5.0, constructYr: 6, wacc: 7, decommPct: 13, country: "India", examples: "Kakrapar 3/4, RAPS" },
];

const COMPARABLES = [
  { tech: "Nuclear (new build)", lcoe_lo: 80, lcoe_hi: 160, cf: 92, lifetime: 60, co2: 12, color: "#d4a843" },
  { tech: "Offshore Wind", lcoe_lo: 60, lcoe_hi: 110, cf: 40, lifetime: 25, co2: 14, color: "#0d9488" },
  { tech: "Onshore Wind", lcoe_lo: 28, lcoe_hi: 55, cf: 33, lifetime: 25, co2: 11, color: "#27ae60" },
  { tech: "Solar PV (utility)", lcoe_lo: 25, lcoe_hi: 60, cf: 22, lifetime: 25, co2: 48, color: "#e67e22" },
  { tech: "CCGT (gas)", lcoe_lo: 55, lcoe_hi: 100, cf: 60, lifetime: 30, co2: 490, color: "#c0392b" },
  { tech: "Coal (new)", lcoe_lo: 65, lcoe_hi: 150, cf: 70, lifetime: 40, co2: 820, color: "#6b6050" },
  { tech: "SMR (2030E)", lcoe_lo: 80, lcoe_hi: 130, cf: 93, lifetime: 60, co2: 6, color: "#7c3aed" },
  { tech: "Hydrogen (RE+elec)", lcoe_lo: 90, lcoe_hi: 220, cf: 70, lifetime: 20, co2: 4, color: "#2563eb" },
];

const TABS = [
  "LCOE Engine", "Reactor Comparison", "Cost Breakdown", "Technology Radar",
  "Vs. Alternatives", "Learning Curves", "Policy & Incentives", "Risk Matrix",
  "Carbon Value", "Investor Returns"
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

export default function NuclearLcoeEconomicsPage() {
  const [tab, setTab] = useState(0);
  const [capex, setCapex]       = useState(7500);
  const [cf, setCf]             = useState(92);
  const [lifetime, setLifetime] = useState(60);
  const [opexF, setOpexF]       = useState(18);
  const [opexV, setOpexV]       = useState(4.2);
  const [fuel, setFuel]         = useState(8.5);
  const [constrYr, setConstrYr] = useState(6);
  const [wacc, setWacc]         = useState(8);
  const [decomm, setDecomm]     = useState(15);
  const [carbonPrice, setCarbonPrice] = useState(80);
  const [selectedReactor, setSelectedReactor] = useState(0);

  const lcoe = useMemo(() => calcLcoe({ capexPerKw: capex, opexFixed: opexF, opexVar: opexV, fuelCost: fuel, constructYr: constrYr, lifetime, wacc, cf, decommPct: decomm }), [capex, cf, lifetime, opexF, opexV, fuel, constrYr, wacc, decomm]);

  const allReactorLcoe = useMemo(() => REACTOR_TYPES.map(r => ({
    name: r.name.split(" ")[0] + " " + r.name.split(" ")[1],
    lcoe: +(calcLcoe({ capexPerKw: r.capex_kw, opexFixed: r.opexFixed, opexVar: r.opexVar, fuelCost: r.fuelCost, constructYr: r.constructYr, lifetime: r.lifetime, wacc: r.wacc, cf: r.cf, decommPct: r.decommPct }) * 1000).toFixed(0),
    capex: r.capex_kw,
    cf: r.cf,
  })), []);

  const costBreakdown = useMemo(() => {
    const r = REACTOR_TYPES[selectedReactor];
    const w = r.wacc / 100;
    const idcFactor = Math.pow(1 + w, r.constructYr / 2);
    const capexAnn = r.capex_kw * w / (1 - Math.pow(1 + w, -r.lifetime)) * idcFactor;
    const opexTotal = r.opexFixed + r.opexVar;
    const decommAnn = r.capex_kw * r.decommPct / 100 * w / (1 - Math.pow(1 + w, -r.lifetime));
    const annMwh = r.cf / 100 * 8760;
    return [
      { name: "Capital (annuitized)", value: +(capexAnn / annMwh * 1000).toFixed(1) },
      { name: "IDC (financing cost)", value: +((capexAnn * (idcFactor - 1)) / annMwh * 1000 / idcFactor).toFixed(1) },
      { name: "Fixed O&M", value: +(r.opexFixed / annMwh * 1000000).toFixed(1) },
      { name: "Variable O&M", value: r.opexVar },
      { name: "Fuel (U3O8→UF6→fuel)", value: r.fuelCost },
      { name: "Decommissioning", value: +(decommAnn / annMwh * 1000).toFixed(1) },
    ];
  }, [selectedReactor]);

  const radarData = useMemo(() => {
    const r = REACTOR_TYPES[selectedReactor];
    return [
      { axis: "Capacity Factor", value: r.cf },
      { axis: "Lifetime (×100/60)", value: Math.min(100, (r.lifetime / 60) * 100) },
      { axis: "Fuel Efficiency (inv.)", value: Math.min(100, 100 - r.fuelCost * 4) },
      { axis: "Capital Efficiency", value: Math.min(100, 100 - (r.capex_kw - 4000) / 100) },
      { axis: "Flexibility", value: r.name.includes("CANDU") ? 80 : r.name.includes("PWR") ? 70 : 60 },
      { axis: "TRL Maturity", value: r.name.includes("Gen III") ? 95 : 88 },
    ];
  }, [selectedReactor]);

  const learningCurveData = useMemo(() => {
    const b = 0.05;
    return [1, 5, 10, 20, 50, 100, 200, 500].map((units, i) => ({
      units,
      capex: +(7500 * Math.pow(units, -b)).toFixed(0),
      smr: +(4500 * Math.pow(units, -0.12)).toFixed(0),
    }));
  }, []);

  const carbonAdjLcoe = useMemo(() => {
    const baseLcoe = lcoe * 1000;
    const nuclearCo2 = 12;
    const gasCo2 = 490;
    const solarCo2 = 48;
    return [
      { tech: "Nuclear (this plant)", lcoe: baseLcoe, lcoe_adj: +(baseLcoe + nuclearCo2 * carbonPrice / 1000).toFixed(0) },
      { tech: "CCGT (unabated)", lcoe: 65, lcoe_adj: +(65 + gasCo2 * carbonPrice / 1000).toFixed(0) },
      { tech: "Solar + BESS", lcoe: 80, lcoe_adj: +(80 + solarCo2 * carbonPrice / 1000).toFixed(0) },
      { tech: "Onshore Wind", lcoe: 38, lcoe_adj: +(38 + 11 * carbonPrice / 1000).toFixed(0) },
    ];
  }, [lcoe, carbonPrice]);

  const irrCalc = useMemo(() => {
    const capexTotal = capex * 1000000;
    const annRev = cf / 100 * 8760 * (lcoe * 1000 * 1.15) * 1000;
    const annOpex = (opexF + opexV + fuel) * cf / 100 * 8760 * 1000;
    const net = annRev - annOpex;
    const cfs = [-capexTotal, ...Array(lifetime).fill(net)];
    return (irr(cfs) * 100).toFixed(1);
  }, [capex, cf, lifetime, opexF, opexV, fuel, lcoe]);

  const C = { gold: "#d4a843", teal: "#0d9488", green: "#27ae60", red: "#c0392b", amber: "#e67e22", purple: "#7c3aed" };

  return (
    <div style={{ background: T.bg, minHeight: "100vh", fontFamily: T.font, color: T.text, padding: "24px 32px" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
          EP-DU1 · Nuclear LCOE & Plant Economics
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>Nuclear LCOE & Plant Economics</h1>
        <p style={{ color: T.textSec, marginTop: 6, fontSize: 14 }}>
          Full LCOE model · Gen III+ reactor comparison · Cost breakdown · Carbon value · IDC financing · 6 reactor types
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        <KpiCard label="LCOE (configured)" value={`$${(lcoe * 1000).toFixed(0)}`} unit="/MWh" sub="Full levellised cost" />
        <KpiCard label="AP1000 Benchmark" value="$85–110" unit="/MWh" sub="IEA 2024 central estimate" color={C.teal} />
        <KpiCard label="Plant IRR" value={`${irrCalc}%`} unit="" sub="At 15% revenue premium" color={parseFloat(irrCalc) > 8 ? C.green : C.red} />
        <KpiCard label="CO₂ Intensity" value="12" unit="gCO₂/kWh" sub="Lifecycle (excl. construction)" color={C.green} />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{
            padding: "7px 14px", borderRadius: 6, border: `1px solid ${tab === i ? T.gold : T.border}`,
            background: tab === i ? T.navyL : T.surface, color: tab === i ? T.gold : T.textSec,
            cursor: "pointer", fontSize: 12,
          }}>{t}</button>
        ))}
      </div>

      {tab === 0 && (
        <div>
          <h3 style={{ color: T.gold, marginBottom: 16 }}>Full LCOE Model — Levelised Cost of Electricity</h3>
          <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <Slider label="Overnight Capex ($/kW)" value={capex} min={3000} max={16000} step={250} onChange={setCapex} unit="" />
              <Slider label="Capacity Factor (%)" value={cf} min={70} max={97} step={1} onChange={setCf} unit="%" />
              <Slider label="Plant Lifetime (yr)" value={lifetime} min={20} max={80} step={5} onChange={setLifetime} unit=" yr" />
              <Slider label="Fixed O&M ($/kW/yr)" value={opexF} min={8} max={40} step={1} onChange={setOpexF} unit="" />
              <Slider label="Variable O&M ($/MWh)" value={opexV} min={1} max={12} step={0.2} onChange={setOpexV} unit="" fmt={v => v.toFixed(1)} />
              <Slider label="Fuel Cost ($/MWh)" value={fuel} min={3} max={20} step={0.5} onChange={setFuel} unit="" fmt={v => v.toFixed(1)} />
              <Slider label="Construction (yr)" value={constrYr} min={3} max={15} step={1} onChange={setConstrYr} unit=" yr" />
              <Slider label="WACC (%)" value={wacc} min={3} max={15} step={0.5} onChange={setWacc} unit="%" fmt={v => v.toFixed(1)} />
              <Slider label="Decommissioning (% capex)" value={decomm} min={5} max={30} step={1} onChange={setDecomm} unit="%" />
              <div style={{ padding: 12, background: T.surfaceH, borderRadius: 6, marginTop: 8 }}>
                <div style={{ fontSize: 11, color: T.textMut }}>LCOE Result</div>
                <div style={{ fontSize: 28, color: T.gold, fontFamily: T.mono, fontWeight: 700, marginTop: 4 }}>
                  ${(lcoe * 1000).toFixed(0)}<span style={{ fontSize: 14, color: T.textSec }}>/MWh</span>
                </div>
              </div>
            </div>
            <div>
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>LCOE vs WACC × Capacity Factor Sensitivity ($/ MWh)</div>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="wacc" type="number" domain={[3, 15]} tickCount={7} stroke={T.textMut}
                      label={{ value: "WACC (%)", position: "insideBottom", offset: -5, fill: T.textMut, fontSize: 10 }} />
                    <YAxis stroke={T.textMut} />
                    <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} formatter={v => [`$${v}/MWh`]} />
                    <Legend />
                    {[85, 92, 97].map((cf_val, ci) => (
                      <Line key={cf_val}
                        data={[3, 5, 7, 8, 10, 12, 15].map(w => ({
                          wacc: w,
                          lcoe: +(calcLcoe({ capexPerKw: capex, opexFixed: opexF, opexVar: opexV, fuelCost: fuel, constructYr: constrYr, lifetime, wacc: w, cf: cf_val, decommPct: decomm }) * 1000).toFixed(0)
                        }))}
                        dataKey="lcoe" name={`CF ${cf_val}%`}
                        stroke={[C.green, C.gold, C.teal][ci]} dot={false} strokeWidth={2} />
                    ))}
                    <ReferenceLine y={110} stroke={T.amber} strokeDasharray="3 3" label={{ value: "Gas parity", fill: T.amber, fontSize: 9 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>LCOE vs Overnight Capex ($/ MWh, at {wacc}% WACC)</div>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={[3000, 4500, 6000, 7500, 9000, 10500, 12000, 14000, 16000].map(cap => ({
                    cap, lcoe: +(calcLcoe({ capexPerKw: cap, opexFixed: opexF, opexVar: opexV, fuelCost: fuel, constructYr: constrYr, lifetime, wacc, cf, decommPct: decomm }) * 1000).toFixed(0)
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="cap" stroke={T.textMut} tickFormatter={v => `$${v / 1000}k`} />
                    <YAxis stroke={T.textMut} />
                    <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} formatter={v => [`$${v}/MWh`]} />
                    <Area dataKey="lcoe" name="LCOE ($/MWh)" fill={C.gold} fillOpacity={0.2} stroke={C.gold} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div>
          <h3 style={{ color: T.gold, marginBottom: 16 }}>Reactor Type Comparison</h3>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 16 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {["Reactor", "Capex ($/kW)", "CF %", "Lifetime", "WACC", "LCOE ($/MWh)", "Country", "Examples"].map(h => (
                    <th key={h} style={{ padding: "8px 12px", color: T.textMut, textAlign: "left" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {REACTOR_TYPES.map((r, i) => (
                  <tr key={i} onClick={() => setSelectedReactor(i)}
                    style={{ borderBottom: `1px solid ${T.border}`, background: selectedReactor === i ? T.navyL : i % 2 === 0 ? T.surfaceH : "transparent", cursor: "pointer" }}>
                    <td style={{ padding: "8px 12px", color: T.gold, fontWeight: 600 }}>{r.name.split("(")[0].trim()}</td>
                    <td style={{ padding: "8px 12px", fontFamily: T.mono }}>${r.capex_kw.toLocaleString()}</td>
                    <td style={{ padding: "8px 12px", fontFamily: T.mono }}>{r.cf}%</td>
                    <td style={{ padding: "8px 12px", fontFamily: T.mono }}>{r.lifetime} yr</td>
                    <td style={{ padding: "8px 12px", fontFamily: T.mono }}>{r.wacc}%</td>
                    <td style={{ padding: "8px 12px", fontFamily: T.mono, color: T.green }}>${allReactorLcoe[i]?.lcoe}</td>
                    <td style={{ padding: "8px 12px", color: T.textSec }}>{r.country}</td>
                    <td style={{ padding: "8px 12px", color: T.textMut, fontSize: 10 }}>{r.examples}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>LCOE by Reactor Type ($/MWh)</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={allReactorLcoe}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" stroke={T.textMut} tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={50} />
                <YAxis stroke={T.textMut} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} formatter={v => [`$${v}/MWh`]} />
                <ReferenceLine y={110} stroke={T.amber} strokeDasharray="3 3" label={{ value: "Gas parity", fill: T.amber, fontSize: 9 }} />
                <Bar dataKey="lcoe" name="LCOE ($/MWh)" fill={C.gold}
                  label={{ position: "top", fontSize: 9, fill: T.textSec, formatter: v => `$${v}` }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 2 && (
        <div>
          <h3 style={{ color: T.gold, marginBottom: 16 }}>Cost Breakdown — {REACTOR_TYPES[selectedReactor].name}</h3>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {REACTOR_TYPES.map((r, i) => (
              <button key={i} onClick={() => setSelectedReactor(i)} style={{
                padding: "6px 12px", borderRadius: 6, border: `1px solid ${selectedReactor === i ? T.gold : T.border}`,
                background: selectedReactor === i ? T.navyL : T.surface, color: selectedReactor === i ? T.gold : T.textSec,
                cursor: "pointer", fontSize: 11,
              }}>{r.name.split(" ")[0]}</button>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>LCOE Components ($/MWh)</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={costBreakdown} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" stroke={T.textMut} tickFormatter={v => `$${v}`} />
                  <YAxis dataKey="name" type="category" stroke={T.textMut} width={180} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} formatter={v => [`$${v}/MWh`]} />
                  <Bar dataKey="value" name="$/MWh" fill={C.teal}
                    label={{ position: "right", fontSize: 10, fill: T.textSec, formatter: v => `$${v}` }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Capital Cost Stack — AP1000 Construction Budget</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={[
                  { item: "Nuclear Island", pct: 35 }, { item: "Conventional Island", pct: 18 },
                  { item: "Balance of Plant", pct: 14 }, { item: "Site Preparation", pct: 6 },
                  { item: "I&C / Digital", pct: 8 }, { item: "Contingency", pct: 12 },
                  { item: "Owner's costs", pct: 7 },
                ]} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" stroke={T.textMut} />
                  <YAxis dataKey="item" type="category" stroke={T.textMut} width={150} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  <Bar dataKey="pct" name="Share %" fill={C.gold} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 3 && (
        <div>
          <h3 style={{ color: T.gold, marginBottom: 16 }}>Technology Performance Radar</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Performance Radar — {REACTOR_TYPES[selectedReactor].name.split("(")[0]}</div>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke={T.border} />
                  <PolarAngleAxis dataKey="axis" tick={{ fill: T.textSec, fontSize: 11 }} />
                  <Radar name="Score" dataKey="value" fill={C.gold} fillOpacity={0.3} stroke={C.gold} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Capacity Factor Comparison (operating fleet 2024)</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { country: "USA", cf: 92.3 }, { country: "France", cf: 64.2 },
                  { country: "South Korea", cf: 85.1 }, { country: "China", cf: 88.4 },
                  { country: "Canada", cf: 80.6 }, { country: "Japan", cf: 71.2 },
                  { country: "Russia", cf: 83.5 }, { country: "India", cf: 78.9 },
                  { country: "UK", cf: 74.8 }, { country: "UAE", cf: 89.6 },
                ]} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" domain={[50, 100]} stroke={T.textMut} />
                  <YAxis dataKey="country" type="category" stroke={T.textMut} width={80} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  <Bar dataKey="cf" name="Capacity Factor (%)" fill={C.teal} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 4 && (
        <div>
          <h3 style={{ color: T.gold, marginBottom: 16 }}>Nuclear vs Alternative Technologies</h3>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>LCOE Range by Technology ($/MWh, 2024)</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={COMPARABLES}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="tech" stroke={T.textMut} tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={60} />
                <YAxis stroke={T.textMut} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                <Legend />
                <Bar dataKey="lcoe_lo" name="LCOE Low ($/MWh)" fill={C.green} opacity={0.8} />
                <Bar dataKey="lcoe_hi" name="LCOE High ($/MWh)" fill={C.amber} opacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Capacity Factor vs CO₂ Intensity</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={COMPARABLES} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" stroke={T.textMut} />
                  <YAxis dataKey="tech" type="category" stroke={T.textMut} width={120} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  <Legend />
                  <Bar dataKey="cf" name="Capacity Factor (%)" fill={C.teal} />
                  <Bar dataKey="co2" name="CO₂ (gCO₂/kWh)" fill={C.red} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>System Value — Nuclear Advantages</div>
              {[
                { factor: "Firm capacity credit", nuclear: 95, solar: 5, wind: 15 },
                { factor: "Grid inertia contribution", nuclear: 90, solar: 0, wind: 10 },
                { factor: "Baseload dispatchability", nuclear: 92, solar: 20, wind: 30 },
                { factor: "Land use efficiency", nuclear: 95, solar: 30, wind: 15 },
                { factor: "Weather independence", nuclear: 100, solar: 15, wind: 35 },
              ].map(row => (
                <div key={row.factor} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, color: T.textSec, marginBottom: 3 }}>{row.factor}</div>
                  <div style={{ display: "flex", gap: 4 }}>
                    {[["Nuclear", row.nuclear, C.gold], ["Solar", row.solar, C.amber], ["Wind", row.wind, C.teal]].map(([name, val, col]) => (
                      <div key={name} style={{ flex: 1 }}>
                        <div style={{ background: T.surfaceH, borderRadius: 2, height: 6 }}>
                          <div style={{ background: col, height: "100%", borderRadius: 2, width: `${val}%` }} />
                        </div>
                        <div style={{ fontSize: 9, color: T.textMut, marginTop: 2 }}>{name} {val}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 5 && (
        <div>
          <h3 style={{ color: T.gold, marginBottom: 16 }}>Nuclear Cost Learning Curves</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Theoretical Learning Curve — Large PWR vs SMR ($/kW vs Units Built)</div>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={learningCurveData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="units" stroke={T.textMut} label={{ value: "Cumulative Units", position: "insideBottom", offset: -5, fill: T.textMut, fontSize: 10 }} />
                  <YAxis stroke={T.textMut} tickFormatter={v => `$${v.toLocaleString()}`} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} formatter={v => [`$${v.toLocaleString()}/kW`]} />
                  <Legend />
                  <Line dataKey="capex" name="Large PWR (5% LR)" stroke={C.gold} dot={false} strokeWidth={2} />
                  <Line dataKey="smr" name="SMR (12% LR)" stroke={C.teal} dot={false} strokeWidth={2} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Historical vs Projected Capex (2000–2040, $/kW)</div>
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={[
                  { yr: 2000, actual: 2500 }, { yr: 2005, actual: 3200 }, { yr: 2010, actual: 5500 },
                  { yr: 2015, actual: 7800 }, { yr: 2020, actual: 8200 }, { yr: 2024, actual: 9000 },
                  { yr: 2028, proj: 8000 }, { yr: 2032, proj: 6500 }, { yr: 2036, proj: 5500 }, { yr: 2040, proj: 4800 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="yr" stroke={T.textMut} />
                  <YAxis stroke={T.textMut} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  <Legend />
                  <Bar dataKey="actual" name="Historical ($/kW)" fill={C.gold} opacity={0.8} />
                  <Bar dataKey="proj" name="Projected ($/kW)" fill={C.teal} opacity={0.6} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 6 && (
        <div>
          <h3 style={{ color: T.gold, marginBottom: 16 }}>Policy & Investment Incentives</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {[
              { country: "USA", policy: "IRA §45U + §48C + §45J", detail: "§45J: Production Tax Credit $15/MWh for advanced nuclear; §48C: 30% ITC; §45U: clean electricity PTC $25/MWh", lcoe_impact: "-$10–25/MWh" },
              { country: "UK", policy: "RAB Model (Regulated Asset Base)", detail: "Hinkley CfD at £92.50/MWh (2012 £); Wylfa Newydd RAB; NNBG development financing; NIS 2.0", lcoe_impact: "Revenue guarantee" },
              { country: "France", policy: "EDF 100 TWh/yr Framework + EPR2", detail: "6 EPR2 plants ordered; ARENH transition to CfD; €100Bn investment program 2023–2035", lcoe_impact: "State guarantee" },
              { country: "South Korea", policy: "APR1400 Export & 10th Basic Plan", detail: "30% nuclear by 2030 target; Shin Hanul 3&4 approved; APR1400 export to Poland, Czech", lcoe_impact: "Competitive capex" },
              { country: "Japan", policy: "GX (Green Transformation) Nuclear Plan", detail: "Restart existing fleet; extend to 60yr; build next-gen (innovation reactors) post-2030", lcoe_impact: "Restart economics" },
              { country: "EU / Taxonomy", policy: "EU Taxonomy Nuclear Inclusion (2022)", detail: "Nuclear classified as transitional green activity; <2045 construction permit; waste plan required", lcoe_impact: "Green bond eligible" },
            ].map((r, i) => (
              <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 14, color: T.gold, fontWeight: 700 }}>{r.country}</span>
                  <span style={{ background: T.sage, color: T.text, padding: "2px 8px", borderRadius: 4, fontSize: 10 }}>{r.lcoe_impact}</span>
                </div>
                <div style={{ fontSize: 11, color: T.amber, marginBottom: 6 }}>{r.policy}</div>
                <div style={{ fontSize: 11, color: T.textSec }}>{r.detail}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 7 && (
        <div>
          <h3 style={{ color: T.gold, marginBottom: 16 }}>Nuclear Investment Risk Matrix</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Key Risk Categories</div>
              {[
                { risk: "Construction Cost Overrun", prob: 85, impact: 90, category: "Financial", example: "Vogtle +$17Bn; Flamanville +€12Bn" },
                { risk: "Construction Schedule Delay", prob: 80, impact: 75, category: "Financial", example: "Hinkley C: 2yr+ delay; Flamanville: 12yr" },
                { risk: "Regulatory/Licensing Risk", prob: 45, impact: 80, category: "Regulatory", example: "NRC/ONR approval timelines 8–12yr" },
                { risk: "Political Risk / Moratorium", prob: 35, impact: 95, category: "Political", example: "Germany exit; Belgium flip; Italy ban" },
                { risk: "Fuel Supply (Russia exposure)", prob: 50, impact: 60, category: "Supply chain", example: "TVEL/Rosatom dependency 30% EU" },
                { risk: "Waste Storage & Disposal", prob: 40, impact: 55, category: "Environmental", example: "No final repository operational globally" },
                { risk: "Insurance & Liability Cap", prob: 20, impact: 95, category: "Legal", example: "Paris Convention €700M cap; Price-Anderson" },
                { risk: "Merchant Power Price Risk", prob: 60, impact: 70, category: "Market", example: "CfD or RAB mitigates; merchant exposed" },
              ].map((r, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: `1px solid ${T.border}` }}>
                  <div>
                    <div style={{ fontSize: 12, color: T.text }}>{r.risk}</div>
                    <div style={{ fontSize: 10, color: T.textMut }}>{r.category} · {r.example}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 8 }}>
                    <div style={{ fontSize: 11, color: r.prob > 60 ? T.red : T.amber, fontFamily: T.mono }}>P: {r.prob}%</div>
                    <div style={{ fontSize: 11, color: r.impact > 80 ? T.red : T.amber, fontFamily: T.mono }}>I: {r.impact}%</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>LCOE Sensitivity Tornado (±25% each driver)</div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={[
                  { driver: "Overnight Capex ±25%", range: 38 }, { driver: "WACC ±2%", range: 24 },
                  { driver: "Constr. Time ±3yr", range: 18 }, { driver: "Capacity Factor ±5%", range: 14 },
                  { driver: "Lifetime ±10yr", range: 10 }, { driver: "O&M ±20%", range: 7 },
                  { driver: "Fuel Cost ±30%", range: 4 }, { driver: "Decomm ±50%", range: 3 },
                ]} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" stroke={T.textMut} tickFormatter={v => `±$${v}`} />
                  <YAxis dataKey="driver" type="category" stroke={T.textMut} width={170} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} formatter={v => [`±$${v}/MWh`]} />
                  <Bar dataKey="range" name="LCOE Impact ±$/MWh" fill={C.amber} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 8 && (
        <div>
          <h3 style={{ color: T.gold, marginBottom: 16 }}>Carbon-Adjusted LCOE — Value of Low-Carbon Firm Power</h3>
          <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <Slider label="Carbon Price ($/tCO₂)" value={carbonPrice} min={0} max={250} step={10} onChange={setCarbonPrice} unit="" />
              <div style={{ marginTop: 16, padding: 12, background: T.surfaceH, borderRadius: 6 }}>
                <div style={{ fontSize: 11, color: T.textMut }}>Nuclear carbon benefit vs gas</div>
                <div style={{ fontSize: 22, color: T.green, fontFamily: T.mono, marginTop: 4 }}>
                  ${((490 - 12) * carbonPrice / 1000).toFixed(0)}/MWh
                </div>
                <div style={{ fontSize: 10, color: T.textSec, marginTop: 2 }}>at ${carbonPrice}/tCO₂</div>
              </div>
              <div style={{ marginTop: 12, padding: 12, background: T.surfaceH, borderRadius: 6 }}>
                <div style={{ fontSize: 11, color: T.textMut }}>Nuclear carbon-adj LCOE</div>
                <div style={{ fontSize: 22, color: T.gold, fontFamily: T.mono, marginTop: 4 }}>
                  ${((lcoe * 1000) + 12 * carbonPrice / 1000).toFixed(0)}/MWh
                </div>
              </div>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Carbon-Adjusted LCOE Comparison ($/MWh at ${carbonPrice}/tCO₂)</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={carbonAdjLcoe}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="tech" stroke={T.textMut} tick={{ fontSize: 11 }} />
                  <YAxis stroke={T.textMut} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  <Legend />
                  <Bar dataKey="lcoe" name="Base LCOE ($/MWh)" fill={C.teal} />
                  <Bar dataKey="lcoe_adj" name="Carbon-adj LCOE ($/MWh)" fill={C.amber} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 9 && (
        <div>
          <h3 style={{ color: T.gold, marginBottom: 16 }}>Investor Returns — Nuclear Asset Finance</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>IRR Sensitivity — Power Price vs Capex (at {wacc}% WACC, {cf}% CF)</div>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" dataKey="capex" domain={[4000, 16000]} tickCount={7} stroke={T.textMut}
                    label={{ value: "Capex ($/kW)", position: "insideBottom", offset: -5, fill: T.textMut, fontSize: 10 }} tickFormatter={v => `$${v / 1000}k`} />
                  <YAxis stroke={T.textMut} label={{ value: "IRR (%)", angle: -90, position: "insideLeft", fill: T.textMut, fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  <Legend />
                  {[70, 90, 110, 130].map((price, pi) => (
                    <Line key={price}
                      data={[4000, 6000, 8000, 10000, 12000, 14000, 16000].map(cap => {
                        const lcoeVal = calcLcoe({ capexPerKw: cap, opexFixed: opexF, opexVar: opexV, fuelCost: fuel, constructYr: constrYr, lifetime, wacc, cf, decommPct: decomm });
                        const capexT = cap * 1000000;
                        const annRev = cf / 100 * 8760 * price * 1000;
                        const annOp = (opexF + opexV + fuel) * cf / 100 * 8760 * 1000;
                        const net = annRev - annOp;
                        const cfs = [-capexT, ...Array(lifetime).fill(net)];
                        return { capex: cap, irr: +(irr(cfs) * 100).toFixed(1) };
                      })}
                      dataKey="irr" name={`$${price}/MWh`}
                      stroke={[C.red, C.amber, C.gold, C.green][pi]} dot={false} strokeWidth={2} />
                  ))}
                  <ReferenceLine y={8} stroke={T.teal} strokeDasharray="4 4" label={{ value: "8% hurdle", fill: T.teal, fontSize: 9 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Revenue Structures — Nuclear Finance Models</div>
              {[
                { model: "Contract for Difference (CfD)", return: "Guaranteed strike price", risk: "Low", example: "Hinkley C: £92.50/MWh (2012£)", timeline: "35yr" },
                { model: "Regulated Asset Base (RAB)", return: "Allowed return on regulatory asset", risk: "Low", example: "Wylfa RAB proposal UK", timeline: "Asset life" },
                { model: "Power Purchase Agreement (PPA)", return: "Fixed price bilateral", risk: "Medium", example: "Data centre nuclear PPAs (Microsoft/Constellation)", timeline: "10–20yr" },
                { model: "Merchant / Pool price", return: "Market price exposure", risk: "High", example: "US deregulated markets", timeline: "Spot" },
                { model: "Government equity stake", return: "Subordinated returns", risk: "Shared", example: "Sizewell C (UK Govt 20% stake)", timeline: "60yr" },
              ].map((m, i) => (
                <div key={i} style={{ padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: T.gold, fontWeight: 600 }}>{m.model}</span>
                    <span style={{ background: m.risk === "Low" ? T.sage : m.risk === "Medium" ? T.teal : T.navy, color: T.text, padding: "2px 8px", borderRadius: 4, fontSize: 10 }}>Risk: {m.risk}</span>
                  </div>
                  <div style={{ fontSize: 11, color: T.textSec }}>{m.example}</div>
                  <div style={{ fontSize: 10, color: T.textMut }}>Tenor: {m.timeline} · {m.return}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
