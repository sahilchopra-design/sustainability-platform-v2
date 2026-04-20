import React, { useState, useMemo } from "react";
import { BarChart, Bar, LineChart, Line, AreaChart, Area, ComposedChart,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine } from "recharts";

const T = {
  bg: "#0f1117", surface: "#1a1d27", surfaceH: "#22263a", border: "#2a2f45", borderL: "#353a52",
  navy: "#1e3a5f", navyL: "#2a4a6f", gold: "#d4a843", goldL: "#e0b85a",
  sage: "#2d6a4f", sageL: "#3d8a6a", teal: "#0d4f5c", text: "#e8e0d0",
  textSec: "#a89880", textMut: "#6b6050", red: "#c0392b", green: "#27ae60",
  amber: "#e67e22", font: "'DM Sans', sans-serif", mono: "'JetBrains Mono', monospace",
};

const sr = s => { const x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

function irr(cashflows, guess = 0.1) {
  let r = guess;
  for (let i = 0; i < 200; i++) {
    const npv = cashflows.reduce((s, cf, t) => s + cf / Math.pow(1 + r, t), 0);
    const d   = cashflows.reduce((s, cf, t) => s - t * cf / Math.pow(1 + r, t + 1), 0);
    if (Math.abs(d) < 1e-12) break;
    const nr = r - npv / d;
    if (Math.abs(nr - r) < 1e-8) { r = nr; break; }
    r = nr;
  }
  return isFinite(r) ? r : 0;
}

const EV_SEGMENTS = [
  { name: "Passenger Cars", fleet2025_m: 42, v2g_cap_kw: 7.4, bat_kwh: 65, avg_parked_hr: 22, v2g_eligible_pct: 45, std: "ISO 15118-2 (AC CCS)", region: "EU" },
  { name: "LCV / Vans", fleet2025_m: 8, v2g_cap_kw: 11, bat_kwh: 75, avg_parked_hr: 16, v2g_eligible_pct: 60, std: "ISO 15118-20 (DC)", region: "EU" },
  { name: "Buses (Transit)", fleet2025_m: 0.06, v2g_cap_kw: 50, bat_kwh: 400, avg_parked_hr: 12, v2g_eligible_pct: 85, std: "CCS Combo 2 DC", region: "EU" },
  { name: "HGV/Trucks", fleet2025_m: 0.08, v2g_cap_kw: 80, bat_kwh: 600, avg_parked_hr: 14, v2g_eligible_pct: 70, std: "ISO 15118-20 (DC 350kW)", region: "EU" },
  { name: "Private Cars", fleet2025_m: 28, v2g_cap_kw: 9.6, bat_kwh: 77, avg_parked_hr: 20, v2g_eligible_pct: 38, std: "CHAdeMO / CSS", region: "UK/Japan" },
];

const V2G_MARKETS = [
  { country: "UK", policy: "Smart Export Guarantee + V2G Flex", flex_cap_mw: 2800, revenue_eur_kw_yr: 180, status: "Trials (2023–25)", lead: "Octopus Energy, OVO" },
  { country: "Netherlands", policy: "SDE++ + FCR eligibility (2023)", flex_cap_mw: 1400, revenue_eur_kw_yr: 220, status: "Commercial scaling", lead: "ENGIE, Nissan" },
  { country: "Denmark", policy: "Energinet DSO tender", flex_cap_mw: 600, revenue_eur_kw_yr: 250, status: "Pilot active", lead: "Clever, Enel X" },
  { country: "Germany", policy: "§14a EnWG controllable assets", flex_cap_mw: 4200, revenue_eur_kw_yr: 140, status: "Regulation active 2024", lead: "E.ON, ENBW" },
  { country: "USA (CA)", policy: "CPUC V2G Docket + CAISO DR", flex_cap_mw: 3500, revenue_eur_kw_yr: 165, status: "PG&E/SDG&E pilots", lead: "Ford Pro, GM Energy" },
  { country: "Japan", policy: "RE100 + CHAdeMO V2G EV grid", flex_cap_mw: 800, revenue_eur_kw_yr: 210, status: "Mature (Nissan LEAF)", lead: "Nissan/Nuvve, Tokyo Gas" },
];

const CHARGING_TYPES = [
  { type: "Mode 2 (3.7kW AC)", power_kw: 3.7, v2g: false, bi: false, std: "IEC 62196-2 (AC)", infra_cost: 800 },
  { type: "Mode 3 (7.4kW AC Smart)", power_kw: 7.4, v2g: true, bi: true, std: "ISO 15118-2", infra_cost: 1400 },
  { type: "Mode 3 (22kW AC)", power_kw: 22, v2g: false, bi: false, std: "IEC 62196-2 Type 2", infra_cost: 2200 },
  { type: "DC Fast (50kW)", power_kw: 50, v2g: true, bi: true, std: "CCS2 / CHAdeMO", infra_cost: 18000 },
  { type: "DC Ultra-Fast (150kW)", power_kw: 150, v2g: true, bi: true, std: "CCS2 / GB/T", infra_cost: 45000 },
  { type: "DC HPC (350kW)", power_kw: 350, v2g: true, bi: true, std: "CCS2 (ISO 15118-20)", infra_cost: 120000 },
];

const HOURS = Array.from({ length: 24 }, (_, h) => {
  const peak = h >= 7 && h <= 9 || h >= 17 && h <= 21;
  const pluggedPct = h >= 20 || h <= 7 ? 75 + sr(h * 7) * 15 : 20 + sr(h * 11) * 20;
  return {
    hour: `${String(h).padStart(2, "0")}:00`,
    price: peak ? 80 + sr(h * 13) * 50 : 18 + sr(h * 17) * 22,
    pluggedPct: +pluggedPct.toFixed(0),
    chargingLoad: peak ? -(20 + sr(h * 5) * 15) : (h >= 22 || h <= 6 ? 30 + sr(h * 9) * 20 : 5 + sr(h * 3) * 8),
    v2gDischarge: peak ? 15 + sr(h * 19) * 10 : 0,
  };
});

const TABS = [
  "V2G Overview", "Fleet Analysis", "Charging Infrastructure", "Revenue Model",
  "Degradation Impact", "Smart Charging Profile", "V2G Markets", "Fleet Finance",
  "Standards & Interop", "Policy Landscape"
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

export default function EvV2gGridIntegrationPage() {
  const [tab, setTab] = useState(0);
  const [fleetSize, setFleetSize]   = useState(500);
  const [v2gPct, setV2gPct]         = useState(60);
  const [fcrPrice, setFcrPrice]     = useState(18);
  const [arbSpread, setArbSpread]   = useState(40);
  const [batKwh, setBatKwh]         = useState(75);
  const [degradeAdder, setDegradeAdder] = useState(1.5);
  const [segment, setSegment]       = useState(0);

  const v2gCapMw = useMemo(() => (fleetSize * (v2gPct / 100) * EV_SEGMENTS[segment].v2g_cap_kw / 1000).toFixed(1), [fleetSize, v2gPct, segment]);

  const annualRev = useMemo(() => {
    const mw = parseFloat(v2gCapMw);
    const fcr  = mw * fcrPrice * 8760 / 1000;
    const arb  = mw * arbSpread * 250;
    return fcr + arb;
  }, [v2gCapMw, fcrPrice, arbSpread]);

  const degradeCostPerCycle = useMemo(() => {
    const replaceCost = batKwh * 120;
    const totalCycles = 1500;
    return (replaceCost / totalCycles) * (degradeAdder / 100);
  }, [batKwh, degradeAdder]);

  const netRevPerYear = useMemo(() => {
    const cycles = 365 * (v2gPct / 100) * 2;
    const degradeCost = degradeCostPerCycle * cycles * fleetSize;
    return annualRev - degradeCost;
  }, [annualRev, degradeCostPerCycle, v2gPct, fleetSize]);

  const irrCalc = useMemo(() => {
    const capex = -(fleetSize * EV_SEGMENTS[segment].v2g_cap_kw * 200);
    const cfs = [capex, ...Array(10).fill(netRevPerYear)];
    return (irr(cfs) * 100).toFixed(1);
  }, [fleetSize, segment, netRevPerYear]);

  const degradeData = useMemo(() => [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(yr => ({
    year: yr,
    no_v2g: +(100 - yr * 2.1).toFixed(1),
    v2g_light: +(100 - yr * (2.1 + 0.8)).toFixed(1),
    v2g_heavy: +(100 - yr * (2.1 + degradeAdder * 0.6)).toFixed(1),
  })), [degradeAdder]);

  const scatterData = useMemo(() => Array.from({ length: 30 }, (_, i) => ({
    x: 10 + sr(i * 7) * 490,
    y: sr(i * 13) * 4 + 0.5,
    country: ["UK","DE","NL","DK","US","JP","FR","ES","IT","NO"][i % 10],
  })), []);

  const C = { gold: "#d4a843", teal: "#0d9488", green: "#27ae60", red: "#c0392b", amber: "#e67e22", purple: "#7c3aed" };

  return (
    <div style={{ background: T.bg, minHeight: "100vh", fontFamily: T.font, color: T.text, padding: "24px 32px" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
          EP-DT5 · EV Fleet & V2G Grid Integration Finance
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>EV Fleet & Vehicle-to-Grid (V2G) Finance</h1>
        <p style={{ color: T.textSec, marginTop: 6, fontSize: 14 }}>
          V2G revenue modelling · Fleet sizing · Degradation economics · Smart charging · ISO 15118 compliance
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        <KpiCard label="V2G Capacity (fleet)" value={`${v2gCapMw} MW`} unit="" sub={`${fleetSize} EVs · ${v2gPct}% enabled`} />
        <KpiCard label="Est. Annual Revenue" value={`€${(annualRev / 1000).toFixed(0)}k`} unit="" sub="FCR + arbitrage" color={C.teal} />
        <KpiCard label="Net of Degradation" value={`€${(netRevPerYear / 1000).toFixed(0)}k`} unit="/yr" sub={`After €${(degradeCostPerCycle * 100).toFixed(2)}/100 cycles`} color={C.green} />
        <KpiCard label="Fleet V2G IRR" value={`${irrCalc}%`} unit="" sub="10-year project finance" color={parseFloat(irrCalc) > 8 ? C.green : C.amber} />
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
          <h3 style={{ color: T.gold, marginBottom: 16 }}>V2G Grid Integration Overview</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>24-Hour Smart Charging & V2G Dispatch Profile</div>
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={HOURS}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="hour" stroke={T.textMut} tick={{ fontSize: 9 }} interval={3} />
                  <YAxis yAxisId="left" stroke={T.textMut} />
                  <YAxis yAxisId="right" orientation="right" stroke={T.textMut} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  <Legend />
                  <Area yAxisId="right" dataKey="price" name="Price (€/MWh)" fill={C.gold} fillOpacity={0.1} stroke={C.gold} />
                  <Bar yAxisId="left" dataKey="chargingLoad" name="Charging Load (MW)" fill={C.teal} opacity={0.8} />
                  <Bar yAxisId="left" dataKey="v2gDischarge" name="V2G Discharge (MW)" fill={C.green} opacity={0.8} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Fleet Plugged-In % by Hour (availability for V2G)</div>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={HOURS}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="hour" stroke={T.textMut} tick={{ fontSize: 9 }} interval={3} />
                  <YAxis domain={[0, 100]} stroke={T.textMut} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  <ReferenceLine y={50} stroke={T.amber} strokeDasharray="3 3" label={{ value: "50% threshold", fill: T.amber, fontSize: 9 }} />
                  <Area dataKey="pluggedPct" name="Plugged-in (%)" fill={C.teal} fillOpacity={0.3} stroke={C.teal} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div>
          <h3 style={{ color: T.gold, marginBottom: 16 }}>EV Fleet Segment Analysis</h3>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {EV_SEGMENTS.map((s, i) => (
              <button key={i} onClick={() => setSegment(i)} style={{
                padding: "6px 12px", borderRadius: 6, border: `1px solid ${segment === i ? T.gold : T.border}`,
                background: segment === i ? T.navyL : T.surface, color: segment === i ? T.gold : T.textSec,
                cursor: "pointer", fontSize: 11,
              }}>{s.name}</button>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              {(() => {
                const seg = EV_SEGMENTS[segment];
                return (
                  <div>
                    <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>{seg.name} — V2G Specification</div>
                    {[
                      ["Fleet 2025 (M)", (seg.fleet2025_m).toFixed(2)],
                      ["V2G Power (kW/vehicle)", seg.v2g_cap_kw],
                      ["Battery Capacity (kWh)", seg.bat_kwh],
                      ["Avg Parked Hours/Day", seg.avg_parked_hr],
                      ["V2G-Eligible Share", `${seg.v2g_eligible_pct}%`],
                      ["V2G Standard", seg.std],
                      ["Region", seg.region],
                    ].map(([k, v]) => (
                      <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
                        <span style={{ fontSize: 12, color: T.textSec }}>{k}</span>
                        <span style={{ fontSize: 12, fontFamily: T.mono, color: T.gold }}>{v}</span>
                      </div>
                    ))}
                    <div style={{ marginTop: 16, padding: 12, background: T.surfaceH, borderRadius: 6 }}>
                      <div style={{ fontSize: 11, color: T.textMut }}>Total EU V2G Potential</div>
                      <div style={{ fontSize: 20, color: T.green, fontFamily: T.mono, marginTop: 4 }}>
                        {(seg.fleet2025_m * 1e6 * seg.v2g_eligible_pct / 100 * seg.v2g_cap_kw / 1e9).toFixed(1)} TW
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>V2G-Eligible Capacity by Segment (GW, 2025)</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={EV_SEGMENTS.map(s => ({
                  name: s.name.split(" ")[0],
                  v2g_gw: +(s.fleet2025_m * 1e6 * s.v2g_eligible_pct / 100 * s.v2g_cap_kw / 1e6).toFixed(0),
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" stroke={T.textMut} />
                  <YAxis stroke={T.textMut} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  <Bar dataKey="v2g_gw" name="V2G Potential (GW)" fill={C.teal}
                    label={{ position: "top", fontSize: 10, fill: T.textSec, formatter: v => `${v}GW` }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 2 && (
        <div>
          <h3 style={{ color: T.gold, marginBottom: 16 }}>Charging Infrastructure — V2G Capability</h3>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 16 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {["Type", "Power", "V2G", "Bidirectional", "Standard", "Infrastructure Cost (€)"].map(h => (
                    <th key={h} style={{ padding: "8px 12px", color: T.textMut, textAlign: "left" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CHARGING_TYPES.map((c, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.surfaceH : "transparent" }}>
                    <td style={{ padding: "8px 12px", color: T.text }}>{c.type}</td>
                    <td style={{ padding: "8px 12px", fontFamily: T.mono }}>{c.power_kw} kW</td>
                    <td style={{ padding: "8px 12px" }}><span style={{ color: c.v2g ? T.green : T.red }}>{c.v2g ? "Yes" : "No"}</span></td>
                    <td style={{ padding: "8px 12px" }}><span style={{ color: c.bi ? T.green : T.red }}>{c.bi ? "Yes" : "No"}</span></td>
                    <td style={{ padding: "8px 12px", color: T.textSec }}>{c.std}</td>
                    <td style={{ padding: "8px 12px", fontFamily: T.mono, color: T.gold }}>€{c.infra_cost.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Payback Period by Charger Type (years)</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={CHARGING_TYPES.filter(c => c.v2g).map(c => ({
                type: c.type.split(" ")[0] + " " + c.type.split(" ")[1],
                payback: +(c.infra_cost / (c.power_kw * fcrPrice * 8760 / 1000 * 1000)).toFixed(1)
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="type" stroke={T.textMut} tick={{ fontSize: 10 }} />
                <YAxis stroke={T.textMut} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} formatter={v => [`${v} years`]} />
                <ReferenceLine y={7} stroke={T.amber} strokeDasharray="3 3" label={{ value: "7yr target", fill: T.amber, fontSize: 9 }} />
                <Bar dataKey="payback" name="Simple Payback (yr)" fill={C.gold} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 3 && (
        <div>
          <h3 style={{ color: T.gold, marginBottom: 16 }}>V2G Revenue Model</h3>
          <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <Slider label="Fleet Size (EVs)" value={fleetSize} min={50} max={5000} step={50} onChange={setFleetSize} unit="" />
              <Slider label="V2G-Enabled Share" value={v2gPct} min={10} max={100} step={5} onChange={setV2gPct} unit="%" />
              <Slider label="FCR Price (€/MWh)" value={fcrPrice} min={5} max={50} step={1} onChange={setFcrPrice} unit="" />
              <Slider label="Arbitrage Spread (€/MWh)" value={arbSpread} min={10} max={100} step={5} onChange={setArbSpread} unit="" />
              <Slider label="Degradation Adder (%/cycle)" value={degradeAdder} min={0.5} max={5} step={0.5} onChange={setDegradeAdder} unit="%" fmt={v => v.toFixed(1)} />
              <div style={{ marginTop: 12, padding: 12, background: T.surfaceH, borderRadius: 6 }}>
                <div style={{ fontSize: 10, color: T.textMut, marginBottom: 4 }}>10-Year V2G IRR</div>
                <div style={{ fontSize: 22, fontFamily: T.mono, color: parseFloat(irrCalc) > 8 ? T.green : T.amber, fontWeight: 700 }}>{irrCalc}%</div>
              </div>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Revenue Breakdown & Net Income (€k/yr)</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { name: "FCR Revenue", value: +(parseFloat(v2gCapMw) * fcrPrice * 8760 / 1000 / 1000).toFixed(0) },
                  { name: "Arbitrage", value: +(parseFloat(v2gCapMw) * arbSpread * 250 / 1000).toFixed(0) },
                  { name: "Degrade Cost", value: -(degradeCostPerCycle * 365 * (v2gPct / 100) * 2 * fleetSize / 1000).toFixed(0) },
                  { name: "O&M Infra", value: -(parseFloat(v2gCapMw) * 8 * 1000 / 1000 / 1000 * 5).toFixed(0) },
                  { name: "Net Revenue", value: +(netRevPerYear / 1000).toFixed(0) },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" stroke={T.textMut} tick={{ fontSize: 10 }} />
                  <YAxis stroke={T.textMut} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} formatter={v => [`€${v}k`]} />
                  <ReferenceLine y={0} stroke={T.text} />
                  <Bar dataKey="value" fill={C.teal}
                    label={{ position: "top", fontSize: 10, fill: T.textSec, formatter: v => v > 0 ? `+€${v}k` : `€${v}k` }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 4 && (
        <div>
          <h3 style={{ color: T.gold, marginBottom: 16 }}>V2G Battery Degradation Economics</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>State of Health — No V2G vs Light vs Heavy V2G</div>
              <Slider label="V2G Degradation Adder (%/yr)" value={degradeAdder} min={0.5} max={5} step={0.5} onChange={setDegradeAdder} unit="%" fmt={v => v.toFixed(1)} />
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={degradeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" stroke={T.textMut} label={{ value: "Year", position: "insideBottom", offset: -5, fill: T.textMut, fontSize: 10 }} />
                  <YAxis domain={[60, 100]} stroke={T.textMut} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  <Legend />
                  <ReferenceLine y={80} stroke={T.amber} strokeDasharray="3 3" label={{ value: "EoL (80% SoH)", fill: T.amber, fontSize: 9 }} />
                  <Line dataKey="no_v2g" name="No V2G (2.1%/yr)" stroke={C.green} dot={false} strokeWidth={2} />
                  <Line dataKey="v2g_light" name="Light V2G (+0.8%/yr)" stroke={C.gold} dot={false} strokeWidth={2} />
                  <Line dataKey="v2g_heavy" name={`Heavy V2G (+${(degradeAdder * 0.6).toFixed(1)}%/yr)`} stroke={C.red} dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Break-even V2G Revenue vs Degradation Cost (€/kWh)</div>
              <Slider label="Battery Cost (€/kWh)" value={batKwh} min={60} max={150} step={5} onChange={setBatKwh} unit=" €/kWh" />
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(v2gCycles => ({
                  cycles: v2gCycles * 50,
                  degrade_cost: +((batKwh * (v2gCycles * 50 / 1500) * degradeAdder / 100)).toFixed(2),
                  v2g_revenue: +((v2gCycles * 50 * arbSpread / 1000)).toFixed(2),
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="cycles" stroke={T.textMut} label={{ value: "V2G Cycles/yr", position: "insideBottom", offset: -5, fill: T.textMut, fontSize: 10 }} />
                  <YAxis stroke={T.textMut} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  <Legend />
                  <Line dataKey="v2g_revenue" name="V2G Revenue (€/kWh)" stroke={C.green} dot={false} strokeWidth={2} />
                  <Line dataKey="degrade_cost" name="Degradation Cost (€/kWh)" stroke={C.red} dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 5 && (
        <div>
          <h3 style={{ color: T.gold, marginBottom: 16 }}>Smart Charging Optimisation Profile</h3>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Price-Responsive Smart Charging — Comparison</div>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={HOURS}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="hour" stroke={T.textMut} tick={{ fontSize: 9 }} interval={3} />
                <YAxis yAxisId="price" stroke={T.textMut} />
                <YAxis yAxisId="load" orientation="right" stroke={T.textMut} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                <Legend />
                <Line yAxisId="price" dataKey="price" name="Price (€/MWh)" stroke={C.gold} dot={false} strokeWidth={2} />
                <Bar yAxisId="load" dataKey="chargingLoad" name="Smart Charging (MW)" fill={C.teal} opacity={0.7} />
                <Bar yAxisId="load" dataKey="v2gDischarge" name="V2G Discharge (MW)" fill={C.green} opacity={0.8} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {[
              { mode: "Dumb Charging", desc: "Charge immediately on plug-in regardless of price", cost_kwh: 0.32, grid_impact: "High peak demand" },
              { mode: "Smart/Time-of-Use", desc: "Shift to off-peak (22:00–06:00); reduces bill by 20–35%", cost_kwh: 0.22, grid_impact: "Valley-filling, moderate" },
              { mode: "V2G Optimised", desc: "Charge cheap, discharge at FCR/peak; net negative cost possible", cost_kwh: -0.04, grid_impact: "Grid service provider" },
            ].map(m => (
              <div key={m.mode} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 13, color: T.gold, fontWeight: 700, marginBottom: 6 }}>{m.mode}</div>
                <div style={{ fontSize: 11, color: T.textSec, marginBottom: 8 }}>{m.desc}</div>
                <div style={{ fontSize: 12, color: m.cost_kwh < 0 ? T.green : T.amber, fontFamily: T.mono }}>
                  {m.cost_kwh < 0 ? `Net income: €${Math.abs(m.cost_kwh)}/kWh` : `Cost: €${m.cost_kwh}/kWh`}
                </div>
                <div style={{ fontSize: 10, color: T.textMut, marginTop: 4 }}>{m.grid_impact}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 6 && (
        <div>
          <h3 style={{ color: T.gold, marginBottom: 16 }}>V2G Market Activity by Country</h3>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 16 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {["Country", "Policy Framework", "V2G Capacity (MW)", "Revenue (€/kW/yr)", "Status", "Key Players"].map(h => (
                    <th key={h} style={{ padding: "8px 12px", color: T.textMut, textAlign: "left" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {V2G_MARKETS.map((m, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.surfaceH : "transparent" }}>
                    <td style={{ padding: "8px 12px", color: T.gold, fontWeight: 600 }}>{m.country}</td>
                    <td style={{ padding: "8px 12px", color: T.textSec, fontSize: 11 }}>{m.policy}</td>
                    <td style={{ padding: "8px 12px", fontFamily: T.mono }}>{m.flex_cap_mw.toLocaleString()} MW</td>
                    <td style={{ padding: "8px 12px", fontFamily: T.mono, color: T.green }}>€{m.revenue_eur_kw_yr}</td>
                    <td style={{ padding: "8px 12px" }}>
                      <span style={{ background: m.status.includes("Commercial") ? T.sage : T.navy, color: T.text, padding: "2px 8px", borderRadius: 4, fontSize: 10 }}>{m.status}</span>
                    </td>
                    <td style={{ padding: "8px 12px", color: T.textSec, fontSize: 11 }}>{m.lead}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 7 && (
        <div>
          <h3 style={{ color: T.gold, marginBottom: 16 }}>Fleet Finance — EV + V2G Business Case</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>EV vs ICE TCO Over 5 Years (€/vehicle)</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={[
                  { item: "Purchase Cost", ev: 42000, ice: 32000 }, { item: "Fuel/Energy", ev: 4800, ice: 11500 },
                  { item: "Maintenance", ev: 1800, ice: 4200 }, { item: "Residual Value", ev: -18000, ice: -12000 },
                  { item: "V2G Revenue", ev: -3500, ice: 0 }, { item: "5yr Total TCO", ev: 27100, ice: 35700 },
                ]} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" stroke={T.textMut} tickFormatter={v => `€${(v / 1000).toFixed(0)}k`} />
                  <YAxis dataKey="item" type="category" stroke={T.textMut} width={120} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} formatter={v => [`€${v.toLocaleString()}`]} />
                  <Legend />
                  <Bar dataKey="ev" name="EV (€)" fill={C.teal} />
                  <Bar dataKey="ice" name="ICE (€)" fill={C.amber} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Sensitivity: Payback Period vs V2G Revenue & Fleet Size</div>
              <ResponsiveContainer width="100%" height={280}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="x" name="Fleet Size" stroke={T.textMut} label={{ value: "Fleet Size", position: "insideBottom", offset: -5, fill: T.textMut, fontSize: 10 }} />
                  <YAxis dataKey="y" name="Payback (yr)" stroke={T.textMut} label={{ value: "Payback (yr)", angle: -90, position: "insideLeft", fill: T.textMut, fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  <Scatter data={scatterData} fill={C.gold} fillOpacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 8 && (
        <div>
          <h3 style={{ color: T.gold, marginBottom: 16 }}>ISO 15118 & V2G Interoperability Standards</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {[
              { std: "ISO 15118-2", scope: "AC V2G communication", status: "Published 2014/2019", key: "Plug & Charge (PnC); OCPP 2.0.1 integration; smart charging scheduling", oem: "Nissan, BMW, Volkswagen" },
              { std: "ISO 15118-20", scope: "DC bidirectional + AC enhanced", status: "Published 2022", key: "V2G DC bidirectional; wireless charging (WPT); BPT (Bidirectional Power Transfer)", oem: "Ford, GM, Hyundai/Kia" },
              { std: "IEC 61851-23", scope: "EV DC conductive charging", status: "Active", key: "CCS/CHAdeMO physical layer; DC fast charging safety", oem: "All major OEMs" },
              { std: "OCPP 2.0.1", scope: "Charge point management protocol", status: "Active, V2G profiles", key: "Smart Charging Profile; Remote Start/Stop; Status Notifications; V2G state handling", oem: "EV charging networks" },
              { std: "IEEE 2030.5", scope: "Smart energy profile (SEP 2.0)", status: "Used USA (CAISO)", key: "Utility communication to EV; DERMS integration; demand response commands", oem: "Ford, GM (USA market)" },
              { std: "CHAdeMO 3.0 (ChaoJi)", scope: "DC V2G 900kW", status: "In development", key: "Japan-China joint standard; 900kW V2H/V2G; backwards compatible", oem: "Nissan, Toyota, MG" },
            ].map((s, i) => (
              <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 14, color: T.gold, fontWeight: 700 }}>{s.std}</span>
                  <span style={{ background: s.status.includes("Published") || s.status.includes("Active") ? T.sage : T.navy, color: T.text, padding: "2px 8px", borderRadius: 4, fontSize: 10 }}>{s.status}</span>
                </div>
                <div style={{ fontSize: 11, color: T.amber, marginBottom: 6 }}>{s.scope}</div>
                <div style={{ fontSize: 11, color: T.textSec, marginBottom: 6 }}>{s.key}</div>
                <div style={{ fontSize: 10, color: T.textMut }}>OEMs: {s.oem}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 9 && (
        <div>
          <h3 style={{ color: T.gold, marginBottom: 16 }}>V2G Policy Landscape & Investment Enablers</h3>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div>
                <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Key Regulatory Enablers</div>
                {[
                  { policy: "EU EMD Reform (2024)", impact: "Removes discrimination against V2G aggregators in balancing markets; dynamic contracts mandatory" },
                  { policy: "UK Electricity Market Reform Act 2023", impact: "Smart systems and flexibility mandate; DNO flexibility tenders; V2G tariff guidelines" },
                  { policy: "US FERC Order 2222", impact: "DER aggregation in organised markets; V2G eligible as distributed energy resource" },
                  { policy: "Germany §14a EnWG (2024)", impact: "Controllable assets (EVs, heat pumps) must participate in DSO flexibility; DSO compensation" },
                  { policy: "IEA Global EV Outlook 2024 V2G chapter", impact: "100GW V2G global potential by 2030; policy recommendations for market access" },
                ].map((p, i) => (
                  <div key={i} style={{ padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 12, color: T.gold, fontWeight: 600 }}>{p.policy}</div>
                    <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{p.impact}</div>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Investment Barriers & Mitigants</div>
                {[
                  { barrier: "Battery warranty void risk", mitigant: "OEM V2G warranties emerging (Volkswagen, Ford Pro, Nissan)" },
                  { barrier: "Grid connection costs", mitigant: "DSO flex tender revenues offset connection charges" },
                  { barrier: "Interoperability fragmentation", mitigant: "ISO 15118-20 convergence; OCPP 2.0.1 adoption" },
                  { barrier: "Consumer trust / range anxiety", mitigant: "Guaranteed minimum SoC; dynamic SoC floor settings" },
                  { barrier: "Metering & settlement complexity", mitigant: "Half-hourly settlement (UK 2023); smart meter integration" },
                ].map((b, i) => (
                  <div key={i} style={{ padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 12, color: T.red }}>{b.barrier}</div>
                    <div style={{ fontSize: 11, color: T.green, marginTop: 2 }}>↳ {b.mitigant}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
