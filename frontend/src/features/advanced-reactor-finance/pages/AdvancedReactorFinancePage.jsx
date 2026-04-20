import React, { useState, useMemo } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis } from "recharts";

const T = {
  bg: "#0f1117", surface: "#1a1d27", surfaceH: "#22263a", border: "#2a2d3e", borderL: "#353852",
  navy: "#1e3a5f", navyL: "#2a4f7c", gold: "#c9a84c", goldL: "#e0c068", sage: "#4a7c59", sageL: "#5a9c6e",
  teal: "#2a6b7c", text: "#e8e6df", textSec: "#9e9b93", textMut: "#6b6860", red: "#dc2626",
  green: "#16a34a", amber: "#d97706", font: "DM Sans, sans-serif", mono: "JetBrains Mono, monospace"
};

const sr = s => { const x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const TABS = [
  "Gen IV Overview","MSR Finance","Fast Reactor (SFR)","HTGR & Process Heat",
  "GFR & LFR","DOE ARDP Program","Advanced Fuels","LCOE Comparison",
  "Investment Landscape","Risk & Timeline"
];

const GEN4_TYPES = [
  { type:"Molten Salt Reactor (MSR)",       abbr:"MSR",  temp:700,  eta:0.45, fuelCycle:"Thorium/U233/U235", vendors:["Terrestrial Energy","Moltex Energy","Kairos Power","TerraPower (MCRE)"], trl:4, targetCap:"MW to GW", lcoe2040:90, color: T.gold },
  { type:"Sodium Fast Reactor (SFR)",       abbr:"SFR",  temp:550,  eta:0.40, fuelCycle:"U/Pu metal fuel", vendors:["TerraPower Natrium","ARC-100","GE-Hitachi PRISM","Oklo Aurora"], trl:6, targetCap:"100 MW – GW", lcoe2040:95, color: T.teal },
  { type:"High-Temp Gas Reactor (HTGR)",    abbr:"HTGR", temp:950,  eta:0.50, fuelCycle:"TRISO pebble/prismatic", vendors:["X-Energy Xe-100","Ultra Safe USNC","HTR-PM (CNNC)"], trl:7, targetCap:"80–300 MWt", lcoe2040:85, color: T.sage },
  { type:"Gas-Cooled Fast Reactor (GFR)",   abbr:"GFR",  temp:850,  eta:0.48, fuelCycle:"U/Pu carbide", vendors:["Framatome Gen IV","Gen IV Forum"],      trl:2, targetCap:"2400 MWt", lcoe2040:110, color: T.navyL },
  { type:"Lead-Cooled Fast Reactor (LFR)",  abbr:"LFR",  temp:480,  eta:0.40, fuelCycle:"U nitride",    vendors:["Newcleo","ALFRED (EU)","LeadCold"],     trl:3, targetCap:"10–400 MW", lcoe2040:105, color: T.amber },
  { type:"Very High Temp Reactor (VHTR)",   abbr:"VHTR", temp:1000, eta:0.52, fuelCycle:"TRISO prismatic",vendors:["GA-EMS","INL HTGR"],                   trl:5, targetCap:"300–600 MWt",lcoe2040:88, color: T.goldL },
];

const ARDP_COMPANIES = [
  { company:"TerraPower (Natrium)",  type:"SFR",   award:"$2.0B",  partner:"USDOE",    status:"Construction 2024",  location:"Kemmerer WY", power:"345 MWe" },
  { company:"X-Energy (Xe-100)",     type:"HTGR",  award:"$1.2B",  partner:"USDOE",    status:"FOAK Design 2024",    location:"Dow Chemical TX", power:"80 MWe×4" },
  { company:"Kairos Power (KP-FHR)", type:"MSR/FHR",award:"$629M", partner:"USDOE",    status:"Demo 2026",          location:"Tennessee",  power:"35 MWt demo" },
  { company:"Oklo (Aurora)",         type:"SFR micro",award:"$5M", partner:"INL",      status:"NRC Licensing 2023", location:"Idaho",      power:"1.5 MWe" },
  { company:"Terrestrial Energy",    type:"IMSR",  award:"C$20M",  partner:"CNSC+NRC", status:"Pre-licensing 2024",  location:"Canada",     power:"195 MWe" },
  { company:"Moltex Energy",         type:"SSR-W", award:"C$50M",  partner:"NRCan",    status:"Pre-FEED 2024",       location:"New Brunswick", power:"300 MWe" },
];

const TRISO_DATA = [
  { property:"Kernel material", value:"UO2 / UCO / U metal" },
  { property:"Enrichment",      value:"Up to 19.75% (HALEU)" },
  { property:"Kernel diameter", value:"350–500 μm" },
  { property:"Coating layers",  value:"4 (buffer/IPyC/SiC/OPyC)" },
  { property:"Failure temp",    value:">1600°C (accident-tolerant)" },
  { property:"Design burnup",   value:"100,000–200,000 MWd/tU" },
  { property:"Form factors",    value:"Pebble (60mm) / Prismatic block" },
  { property:"Production cost", value:"$8,000–15,000/kgU (est.)" },
];

const PROCESS_HEAT_APPS = [
  { app:"Green Hydrogen (HTE)", tempC:800, mktGW:120, readiness:"2030–35", pairing:"HTGR / VHTR" },
  { app:"Ammonia Synthesis",    tempC:500, mktGW:60,  readiness:"2030",    pairing:"HTGR / SFR" },
  { app:"Steel (DRI-EAF)",      tempC:900, mktGW:200, readiness:"2035",    pairing:"VHTR / GFR" },
  { app:"Cement Calcination",   tempC:1400,mktGW:80,  readiness:"2040+",   pairing:"VHTR (demo)" },
  { app:"Desalination (MSF)",   tempC:120, mktGW:30,  readiness:"2028",    pairing:"SMR / HTGR" },
  { app:"District Heating",     tempC:130, mktGW:50,  readiness:"2027",    pairing:"SMR / HTR-PM" },
];

const LCOE_COMPARISON = [
  { tech:"LWR (new)", lcoe: 95, note:"Vogtle benchmark" },
  { tech:"EPR-1600",  lcoe:110, note:"Hinkley Point C" },
  { tech:"SMR-NOAK",  lcoe: 80, note:"NuScale Nth-of-kind est." },
  { tech:"HTGR",      lcoe: 85, note:"X-Energy 2035E" },
  { tech:"SFR",       lcoe: 95, note:"TerraPower Natrium" },
  { tech:"MSR-FOAK",  lcoe:120, note:"Terrestrial Energy" },
  { tech:"LFR",       lcoe:105, note:"Newcleo est. 2035" },
  { tech:"GFR",       lcoe:110, note:"Gen IV conceptual" },
  { tech:"Offshore Wind",lcoe: 70, note:"UK CfD 2024" },
  { tech:"Solar + BESS",  lcoe: 65, note:"US utility 2024" },
  { tech:"CCGT (nat. gas)",lcoe: 60, note:"Henry Hub $3/MMBtu" },
];

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: "14px 18px" }}>
    <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 700, color: color || T.gold, margin: "4px 0 2px" }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec }}>{sub}</div>}
  </div>
);

const Slider = ({ label, min, max, step, value, onChange, fmt }) => (
  <div style={{ marginBottom: 12 }}>
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.textSec, marginBottom: 4 }}>
      <span>{label}</span><span style={{ color: T.gold, fontFamily: T.mono }}>{fmt ? fmt(value) : value}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value}
      onChange={e => onChange(Number(e.target.value))}
      style={{ width: "100%", accentColor: T.gold }} />
  </div>
);

export default function AdvancedReactorFinancePage() {
  const [tab, setTab] = useState(0);
  const [selectedType, setSelectedType] = useState(0);
  const [capexPerKw, setCapexPerKw] = useState(5000);
  const [wacc, setWacc] = useState(8);
  const [cf, setCf] = useState(90);
  const [lifetime, setLifetime] = useState(60);
  const [opexFixed, setOpexFixed] = useState(120);
  const [constructYr, setConstructYr] = useState(4);
  const [elecPrice, setElecPrice] = useState(90);
  const [heatPrice, setHeatPrice] = useState(40);
  const [heatPct, setHeatPct] = useState(30);

  const COLORS = [T.gold, T.teal, T.sage, T.navyL, T.amber, T.goldL, T.red, T.green];

  function calcLcoe({ capexKw, opex, wacc: w0, cf: cf0, lt, constructYr: cy }) {
    const w = w0 / 100;
    const capexAnn = capexKw * w / (1 - Math.pow(1 + w, -lt));
    const idc = Math.pow(1 + w, cy / 2);
    const annMwh = cf0 / 100 * 8760;
    return annMwh > 0 ? +((capexAnn * idc + opex) / annMwh * 1000).toFixed(1) : 0;
  }

  const lcoe = useMemo(() => calcLcoe({ capexKw: capexPerKw, opex: opexFixed, wacc, cf, lt: lifetime, constructYr }), [capexPerKw, opexFixed, wacc, cf, lifetime, constructYr]);

  const npv = useMemo(() => {
    const annMwh = cf / 100 * 8760 * capexPerKw / 1000;
    const blendRev = annMwh * (elecPrice * (1 - heatPct / 100) + heatPrice * heatPct / 100) / 1000;
    const capex = capexPerKw * 1000;
    const w = wacc / 100;
    let pv = 0;
    for (let yr = 1; yr <= lifetime; yr++) pv += blendRev / Math.pow(1 + w, yr);
    const decommPV = capex * 0.15 / Math.pow(1 + w, lifetime);
    return +((pv - capex - decommPV) / 1e6).toFixed(1);
  }, [capexPerKw, wacc, cf, lifetime, elecPrice, heatPrice, heatPct]);

  const cashFlows = useMemo(() => {
    const annMwh = cf / 100 * 8760 * capexPerKw / 1000;
    const blendRev = annMwh * (elecPrice * (1 - heatPct / 100) + heatPrice * heatPct / 100) / 1000;
    const capex = capexPerKw * 1000;
    let cumulative = -capex;
    return [{ year: 0, annual: -capex / 1e6, cumulative: -capex / 1e6 },
      ...Array.from({ length: Math.min(lifetime, 40) }, (_, i) => {
        const annual = (blendRev - opexFixed) / 1e3;
        cumulative += annual * 1e3;
        return { year: i + 1, annual: +(annual).toFixed(2), cumulative: +(cumulative / 1e6).toFixed(2) };
      })
    ];
  }, [capexPerKw, wacc, cf, lifetime, elecPrice, heatPrice, heatPct, opexFixed]);

  const trlRadar = GEN4_TYPES.map(g => ({
    reactor: g.abbr, TRL: g.trl * 10, Temperature: Math.min(100, g.temp / 10),
    Eta: g.eta * 100, LCOE: Math.max(0, 130 - g.lcoe2040), CostMaturity: g.trl * 12,
  }));

  const timelineData = useMemo(() => Array.from({ length: 20 }, (_, i) => ({
    year: 2025 + i,
    htgr: i >= 3 ? +(sr(i * 3) * 5 + i * 0.8).toFixed(1) : 0,
    sfr:  i >= 4 ? +(sr(i * 5) * 4 + i * 0.5).toFixed(1) : 0,
    msr:  i >= 6 ? +(sr(i * 7) * 3 + (i - 6) * 0.3).toFixed(1) : 0,
    lfr:  i >= 7 ? +(sr(i * 9) * 2 + (i - 7) * 0.2).toFixed(1) : 0,
  })), []);

  const investData = useMemo(() => [
    { investor: "DOE (USA)", committed: 3.8, pipeline: 5.0, focus: "ARDP + CVF" },
    { investor: "NRCan (Canada)", committed: 0.5, pipeline: 1.2, focus: "SMR Action Plan" },
    { investor: "NIA (UK)", committed: 0.7, pipeline: 1.5, focus: "GBN + AMR" },
    { investor: "EU Euratom", committed: 0.3, pipeline: 0.8, focus: "ITER + Gen IV" },
    { investor: "Private VC", committed: 4.2, pipeline: 8.0, focus: "Oklo, Terrestrial, etc." },
    { investor: "Strategic Corp.", committed: 2.1, pipeline: 4.0, focus: "Microsoft, Dow, etc." },
  ], []);

  const tabContent = () => {
    switch (tab) {
      case 0: return (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
            <KpiCard label="Gen IV Reactor Types" value="6" sub="Forum: MSR·SFR·HTGR·GFR·LFR·VHTR" />
            <KpiCard label="Global Gen IV Investment" value="$12B+" sub="2020–2025 committed" />
            <KpiCard label="First Commercial Target" value="2030–2035" sub="HTGR/SFR leaders" color={T.teal} />
            <KpiCard label="Operating Temp Range" value="480–1000°C" sub="vs LWR 315°C" color={T.sage} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Gen IV Reactor Types — Technology Readiness Level</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={GEN4_TYPES.map(g => ({ name: g.abbr, trl: g.trl, lcoe: g.lcoe2040 }))}>
                  <XAxis dataKey="name" tick={{ fill: T.textMut, fontSize: 10 }} />
                  <YAxis tick={{ fill: T.textMut, fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, color: T.text }} />
                  <Bar dataKey="trl" fill={T.gold} radius={[3,3,0,0]} name="TRL (1–9)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>2040 LCOE Estimate ($/MWhe)</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={GEN4_TYPES.map(g => ({ name: g.abbr, lcoe: g.lcoe2040 }))}>
                  <XAxis dataKey="name" tick={{ fill: T.textMut, fontSize: 10 }} />
                  <YAxis domain={[60, 130]} tick={{ fill: T.textMut, fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, color: T.text }} />
                  <Bar dataKey="lcoe" radius={[3,3,0,0]} name="$/MWhe 2040E">
                    {GEN4_TYPES.map((g, i) => <Cell key={i} fill={g.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
            <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {["Reactor Type","Op. Temp (°C)","Efficiency","Fuel Cycle","Key Vendors","TRL","LCOE 2040E"].map(h => (
                    <th key={h} style={{ padding: "8px 10px", color: T.textSec, textAlign: "left", fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {GEN4_TYPES.map((g, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, cursor: "pointer", background: selectedType === i ? T.surfaceH : "transparent" }}
                    onClick={() => setSelectedType(i)}>
                    <td style={{ padding: "8px 10px", color: g.color, fontWeight: 600 }}>{g.type}</td>
                    <td style={{ padding: "8px 10px", color: T.text, fontFamily: T.mono }}>{g.temp}°C</td>
                    <td style={{ padding: "8px 10px", color: T.teal, fontFamily: T.mono }}>{(g.eta * 100).toFixed(0)}%</td>
                    <td style={{ padding: "8px 10px", color: T.textSec }}>{g.fuelCycle}</td>
                    <td style={{ padding: "8px 10px", color: T.textSec, fontSize: 10 }}>{g.vendors.slice(0, 2).join(", ")}</td>
                    <td style={{ padding: "8px 10px", color: g.trl >= 6 ? T.green : g.trl >= 4 ? T.amber : T.red, fontFamily: T.mono }}>{g.trl}/9</td>
                    <td style={{ padding: "8px 10px", color: T.gold, fontFamily: T.mono }}>${g.lcoe2040}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
      case 1: return (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
            <KpiCard label="MSR Operating Temp" value="600–750°C" sub="vs LWR 315°C" />
            <KpiCard label="Thermal Efficiency" value="45–50%" sub="vs LWR 33%" color={T.teal} />
            <KpiCard label="Thorium Cycle" value="Possible" sub="U233 breeding from Th232" color={T.sage} />
            <KpiCard label="TRL (2024)" value="4–5" sub="Terrestrial/Moltex" color={T.amber} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
              <div style={{ fontSize: 13, color: T.gold, marginBottom: 16 }}>MSR Project Finance Model</div>
              <Slider label="CAPEX ($/kWe)" min={3000} max={12000} step={100} value={capexPerKw} onChange={setCapexPerKw} fmt={v => `$${v.toLocaleString()}/kWe`} />
              <Slider label="WACC (%)" min={4} max={15} step={0.5} value={wacc} onChange={setWacc} fmt={v => `${v}%`} />
              <Slider label="Capacity Factor (%)" min={70} max={95} step={1} value={cf} onChange={setCf} fmt={v => `${v}%`} />
              <Slider label="Lifetime (years)" min={30} max={80} step={5} value={lifetime} onChange={setLifetime} fmt={v => `${v} yr`} />
              <Slider label="Construction Time (yr)" min={3} max={8} step={1} value={constructYr} onChange={setConstructYr} fmt={v => `${v} yr`} />
              <Slider label="O&M Fixed ($/kWe/yr)" min={60} max={250} step={5} value={opexFixed} onChange={setOpexFixed} fmt={v => `$${v}/kWe/yr`} />
              <Slider label="Electricity Price ($/MWhe)" min={50} max={150} step={5} value={elecPrice} onChange={setElecPrice} fmt={v => `$${v}/MWhe`} />
              <div style={{ background: T.surfaceH, borderRadius: 6, padding: 12, marginTop: 8 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div><div style={{ fontSize: 10, color: T.textMut }}>LCOE ($/MWhe)</div><div style={{ color: T.gold, fontFamily: T.mono, fontSize: 20, fontWeight: 700 }}>${lcoe}</div></div>
                  <div><div style={{ fontSize: 10, color: T.textMut }}>NPV ($M, 1 GWe)</div><div style={{ color: npv > 0 ? T.green : T.red, fontFamily: T.mono, fontSize: 20, fontWeight: 700 }}>${npv}M</div></div>
                </div>
              </div>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Cumulative Cash Flow ($M, per MWe)</div>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={cashFlows.filter((_, i) => i % 2 === 0)}>
                  <XAxis dataKey="year" tick={{ fill: T.textMut, fontSize: 10 }} />
                  <YAxis tick={{ fill: T.textMut, fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, color: T.text }} />
                  <Line type="monotone" dataKey="cumulative" stroke={T.gold} dot={false} strokeWidth={2} name="Cumulative ($M)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      );
      case 2: return (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
            <KpiCard label="SFR Operating Temp" value="500–550°C" sub="Sodium coolant" />
            <KpiCard label="Breeding Ratio" value="1.0–1.3" sub="Can breed more fissile" color={T.teal} />
            <KpiCard label="Spent Fuel Burn" value="Yes" sub="Can close fuel cycle" color={T.sage} />
            <KpiCard label="Natrium (TerraPower)" value="345 MWe" sub="Under construction 2024" color={T.gold} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>SFR + BESS Co-location (Natrium Concept) — Revenue Stack</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={[
                  { name: "Baseload Sale", rev: 120 },
                  { name: "Ancillary FCR", rev: 25 },
                  { name: "BESS Arbitrage", rev: 40 },
                  { name: "Capacity Mkt", rev: 15 },
                  { name: "Heat Offtake", rev: 30 },
                ]}>
                  <XAxis dataKey="name" tick={{ fill: T.textMut, fontSize: 10 }} />
                  <YAxis tick={{ fill: T.textMut, fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, color: T.text }} />
                  <Bar dataKey="rev" radius={[3,3,0,0]} name="$/kWe/yr">
                    {[T.gold, T.teal, T.sage, T.navyL, T.amber].map((c, i) => <Cell key={i} fill={c} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>SFR Vendors — Capacity & Timeline</div>
              {[
                { name:"TerraPower Natrium", mw:345, yr:2030, status:"Under construction", color: T.gold },
                { name:"ARC-100",            mw:100, yr:2030, status:"Pre-FEED complete",  color: T.teal },
                { name:"GEH PRISM",          mw:311, yr:2035, status:"Design phase",       color: T.sage },
                { name:"Oklo Aurora",        mw:1.5, yr:2027, status:"NRC review",         color: T.amber },
              ].map((v, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${T.border}` }}>
                  <div>
                    <div style={{ fontSize: 12, color: v.color, fontWeight: 600 }}>{v.name}</div>
                    <div style={{ fontSize: 11, color: T.textSec }}>{v.status}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 14, color: T.gold, fontFamily: T.mono }}>{v.mw} MWe</div>
                    <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono }}>{v.yr}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
      case 3: return (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
            <KpiCard label="HTGR Outlet Temp" value="750–950°C" sub="Helium-cooled" />
            <KpiCard label="HTR-PM (China)" value="2×250 MWt" sub="Operating Shidaowan 2021" color={T.teal} />
            <KpiCard label="Process Heat Market" value="$500B/yr" sub="Hard-to-abate industries" color={T.sage} />
            <KpiCard label="TRISO Fuel Safety" value=">1600°C" sub="No meltdown possible" color={T.green} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Process Heat Applications (GW Market × Required Temp)</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={PROCESS_HEAT_APPS} layout="vertical">
                  <XAxis type="number" tick={{ fill: T.textMut, fontSize: 10 }} />
                  <YAxis dataKey="app" type="category" tick={{ fill: T.textMut, fontSize: 10 }} width={140} />
                  <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, color: T.text }} />
                  <Bar dataKey="mktGW" fill={T.gold} name="Market Size (GW)" radius={[0,3,3,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>TRISO Fuel Properties</div>
              <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse" }}>
                <tbody>
                  {TRISO_DATA.map((d, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: "7px 8px", color: T.textSec }}>{d.property}</td>
                      <td style={{ padding: "7px 8px", color: T.gold, fontFamily: T.mono }}>{d.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
            <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Process Heat Apps — Temperature vs Readiness</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={PROCESS_HEAT_APPS}>
                <XAxis dataKey="app" tick={{ fill: T.textMut, fontSize: 9 }} />
                <YAxis tick={{ fill: T.textMut, fontSize: 10 }} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, color: T.text }} />
                <Bar dataKey="tempC" fill={T.teal} radius={[3,3,0,0]} name="Required Temp (°C)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
      case 4: return (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
            <KpiCard label="GFR Status" value="TRL 2–3" sub="Conceptual design" />
            <KpiCard label="LFR Progress" value="TRL 3" sub="Newcleo FOAK 2032E" color={T.amber} />
            <KpiCard label="LFR Lead Temp" value="420–480°C" sub="No sodium fire risk" color={T.teal} />
            <KpiCard label="GFR Outlet Temp" value="850°C" sub="High-efficiency target" color={T.sage} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
              <div style={{ fontSize: 13, color: T.gold, marginBottom: 12 }}>GFR vs LFR Comparison</div>
              {[
                { param:"Coolant",       gfr:"Helium gas", lfr:"Molten lead" },
                { param:"Outlet Temp",   gfr:"850°C",      lfr:"420–480°C" },
                { param:"Efficiency",    gfr:"48%",        lfr:"40%" },
                { param:"Power Range",   gfr:"600–2400 MWt",lfr:"10–400 MW" },
                { param:"Fuel",          gfr:"U/Pu carbide",lfr:"UN/UO2" },
                { param:"TRL",           gfr:"2",          lfr:"3" },
                { param:"Key Risk",      gfr:"SiC cladding",lfr:"Lead corrosion" },
                { param:"FOAK Timeline", gfr:"2045+",      lfr:"2032–2035" },
              ].map((r, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0, borderBottom: `1px solid ${T.border}`, padding: "7px 0" }}>
                  <div style={{ fontSize: 11, color: T.textSec }}>{r.param}</div>
                  <div style={{ fontSize: 11, color: T.sage, fontFamily: T.mono }}>{r.gfr}</div>
                  <div style={{ fontSize: 11, color: T.amber, fontFamily: T.mono }}>{r.lfr}</div>
                </div>
              ))}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0, padding: "4px 0", marginTop: 4 }}>
                <div /><div style={{ fontSize: 10, color: T.sage, fontWeight: 600 }}>GFR</div><div style={{ fontSize: 10, color: T.amber, fontWeight: 600 }}>LFR</div>
              </div>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>LFR Vendors & Investment Status</div>
              {[
                { name:"Newcleo (France/UK)", reactor:"LFR-30",  mw:30,  invest:"€150M raised",  timeline:"2030 demo",     color: T.gold },
                { name:"ALFRED (EU Consortium)",reactor:"ALFRED",mw:300, invest:"EU Euratom",     timeline:"2035 pilot",    color: T.teal },
                { name:"LeadCold (Sweden)", reactor:"SEALER",    mw:3,   invest:"Series A",       timeline:"2028 Canada",   color: T.sage },
                { name:"Nikiet (Russia)",   reactor:"BREST-300", mw:300, invest:"Rosatom",        timeline:"Under const.",  color: T.navyL },
              ].map((v, i) => (
                <div key={i} style={{ background: T.surfaceH, borderRadius: 6, padding: 12, marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: v.color }}>{v.name}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                    <span style={{ fontSize: 11, color: T.textSec }}>{v.reactor} · {v.mw} MW</span>
                    <span style={{ fontSize: 11, color: T.gold, fontFamily: T.mono }}>{v.invest}</span>
                  </div>
                  <div style={{ fontSize: 11, color: T.textMut, marginTop: 2 }}>{v.timeline}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
      case 5: return (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
            <KpiCard label="DOE ARDP Total" value="$3.2B" sub="Advanced Reactor Demo Program" />
            <KpiCard label="Awards Made" value="2 FOAK" sub="TerraPower + X-Energy" color={T.teal} />
            <KpiCard label="Demo Capacity" value="~700 MWe" sub="Combined demonstration" color={T.sage} />
            <KpiCard label="Cost-Share Req." value="50%" sub="Private match required" color={T.amber} />
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>ARDP & Global Advanced Reactor Programs</div>
            <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {["Company","Reactor Type","Award","Partner","Status","Location","Power"].map(h => (
                    <th key={h} style={{ padding: "8px 10px", color: T.textSec, textAlign: "left", fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ARDP_COMPANIES.map((a, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: "8px 10px", color: T.gold, fontWeight: 600 }}>{a.company}</td>
                    <td style={{ padding: "8px 10px", color: T.teal }}>{a.type}</td>
                    <td style={{ padding: "8px 10px", color: T.sage, fontFamily: T.mono }}>{a.award}</td>
                    <td style={{ padding: "8px 10px", color: T.textSec }}>{a.partner}</td>
                    <td style={{ padding: "8px 10px", color: T.amber }}>{a.status}</td>
                    <td style={{ padding: "8px 10px", color: T.textSec }}>{a.location}</td>
                    <td style={{ padding: "8px 10px", color: T.text, fontFamily: T.mono }}>{a.power}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>DOE/Government Funding by Program ($B)</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[
                  { prog: "ARDP Demo", amt: 3.2 }, { prog: "CVF", amt: 6.0 },
                  { prog: "HALEU ops.", amt: 0.7 }, { prog: "Advanced Fuels", amt: 0.6 },
                  { prog: "Loan Guarantee", amt: 1.5 }, { prog: "IIJA nuclear", amt: 2.5 },
                ]}>
                  <XAxis dataKey="prog" tick={{ fill: T.textMut, fontSize: 9 }} />
                  <YAxis tick={{ fill: T.textMut, fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, color: T.text }} />
                  <Bar dataKey="amt" fill={T.gold} radius={[3,3,0,0]} name="$B" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
              <div style={{ fontSize: 13, color: T.gold, marginBottom: 12 }}>Key ARDP Milestones</div>
              {[
                { year:"2022", event:"ARDP Phase 2 awards — TerraPower $2B, X-Energy $1.2B", color: T.gold },
                { year:"2024", event:"TerraPower Natrium site prep begins, Kemmerer WY", color: T.teal },
                { year:"2025", event:"X-Energy Xe-100 detailed design + Dow offtake signed", color: T.sage },
                { year:"2028", event:"TerraPower first concrete — target criticality 2030", color: T.amber },
                { year:"2030", event:"First advanced reactor commercial operation (US)", color: T.green },
                { year:"2035", event:"NOAK cost targets achievable: $3,000–4,000/kWe", color: T.goldL },
              ].map((m, i) => (
                <div key={i} style={{ display: "flex", gap: 12, padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 12, color: m.color, fontFamily: T.mono, minWidth: 36 }}>{m.year}</div>
                  <div style={{ fontSize: 11, color: T.textSec }}>{m.event}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
      case 6: return (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
            <KpiCard label="TRISO Production" value="~5 tHM/yr" sub="BWX Technologies (USA)" />
            <KpiCard label="Metal Fuel (SFR)" value="U-Zr-10%" sub="INL EBR-II heritage" color={T.teal} />
            <KpiCard label="UN Fuel (LFR)" value="R&D stage" sub="Westinghouse/Newcleo" color={T.amber} />
            <KpiCard label="MOX Production" value="~2,400 tHM cap" sub="La Hague + Sellafield" color={T.sage} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Advanced Fuel Readiness Matrix</div>
              {[
                { fuel: "TRISO (pebble)", reactor:"HTGR", trl:7, cost:"$8–15k/kgU",  enrichment:"HALEU 19.75%" },
                { fuel: "Metal U-Zr",    reactor:"SFR",   trl:6, cost:"$3–6k/kgU",   enrichment:"HEU/LEU" },
                { fuel: "MOX (U+Pu)",    reactor:"LWR/SFR",trl:9,cost:"$2–4k/kgU",  enrichment:"7% Pu equiv." },
                { fuel: "UN Nitride",    reactor:"LFR",   trl:4, cost:"$5–10k/kgU",  enrichment:"<20% HALEU" },
                { fuel: "ThO2/UO2 mix",  reactor:"CANDU/MSR",trl:3,cost:"$4–8k/kgU",enrichment:"Th+U233 cycle" },
                { fuel: "Flibe (liquid)",reactor:"MSR",   trl:4, cost:"$10–20k/kgU", enrichment:"F-dissolved U" },
              ].map((f, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
                  <div>
                    <div style={{ fontSize: 12, color: T.gold, fontWeight: 600 }}>{f.fuel}</div>
                    <div style={{ fontSize: 11, color: T.textSec }}>{f.reactor} · {f.enrichment}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 12, color: T.teal, fontFamily: T.mono }}>{f.cost}</div>
                    <div style={{ fontSize: 11, color: f.trl >= 7 ? T.green : f.trl >= 5 ? T.amber : T.red }}>TRL {f.trl}/9</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Fuel Cost by Reactor Type ($/kgU all-in est.)</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={[
                  { name:"LEU LWR",   cost:300 }, { name:"TRISO",    cost:11000 },
                  { name:"Metal SFR", cost:4500 }, { name:"MOX LWR",  cost:3000 },
                  { name:"UN LFR",    cost:7500 }, { name:"Flibe MSR",cost:15000 },
                ]}>
                  <XAxis dataKey="name" tick={{ fill: T.textMut, fontSize: 10 }} />
                  <YAxis tick={{ fill: T.textMut, fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, color: T.text }} />
                  <Bar dataKey="cost" radius={[3,3,0,0]} name="$/kgU">
                    {COLORS.map((c, i) => <Cell key={i} fill={c} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      );
      case 7: return (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
            <KpiCard label="Cheapest Nuclear LCOE" value="$65–80/MWhe" sub="SMR NOAK / HTR-PM" />
            <KpiCard label="LWR New-Build" value="$95–130/MWhe" sub="Vogtle / Hinkley" color={T.amber} />
            <KpiCard label="Solar + Storage" value="$65/MWhe" sub="Utility-scale 2024" color={T.teal} />
            <KpiCard label="Nuclear Carbon Value" value="+$15–25/MWhe" sub="$80/t CO2e adjustment" color={T.sage} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>LCOE Comparison — Nuclear vs Alternatives ($/MWhe)</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={LCOE_COMPARISON} layout="vertical">
                  <XAxis type="number" domain={[0, 130]} tick={{ fill: T.textMut, fontSize: 10 }} />
                  <YAxis dataKey="tech" type="category" tick={{ fill: T.textMut, fontSize: 10 }} width={100} />
                  <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, color: T.text }} formatter={(v, n, p) => [`$${v}/MWhe`, p.payload.note]} />
                  <Bar dataKey="lcoe" radius={[0,3,3,0]} name="LCOE ($/MWhe)">
                    {LCOE_COMPARISON.map((l, i) => <Cell key={i} fill={l.tech.includes("Solar") || l.tech.includes("CCGT") ? T.teal : l.tech.includes("Wind") ? T.sage : T.gold} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Co-generation LCOE — Heat + Power Revenue (Sliders)</div>
              <Slider label="Electricity Price ($/MWhe)" min={50} max={150} step={5} value={elecPrice} onChange={setElecPrice} fmt={v => `$${v}/MWhe`} />
              <Slider label="Heat Price ($/MWht)" min={20} max={80} step={5} value={heatPrice} onChange={setHeatPrice} fmt={v => `$${v}/MWht`} />
              <Slider label="Heat Revenue Share (%)" min={0} max={50} step={5} value={heatPct} onChange={setHeatPct} fmt={v => `${v}%`} />
              <div style={{ background: T.surfaceH, borderRadius: 6, padding: 14, marginTop: 8 }}>
                <div style={{ fontSize: 11, color: T.textMut, marginBottom: 8 }}>BLENDED REVENUE LCOE BREAKEVEN</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: T.gold }}>${lcoe}/MWhe</div>
                <div style={{ fontSize: 12, color: T.textSec, marginTop: 4 }}>Blended revenue: {(elecPrice * (1 - heatPct / 100) + heatPrice * heatPct / 100).toFixed(1)} $/MWhe-equiv</div>
                <div style={{ fontSize: 12, color: npv > 0 ? T.green : T.red, marginTop: 4 }}>NPV (1 GWe plant): ${npv}M</div>
              </div>
            </div>
          </div>
        </div>
      );
      case 8: return (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
            <KpiCard label="Private Investment 2020–24" value="$6.3B" sub="VC + strategic" />
            <KpiCard label="Corporate Offtakers" value="Microsoft, Dow" sub="Signed advanced reactor deals" color={T.teal} />
            <KpiCard label="Nuclear VC Deals 2024" value="47" sub="Record year" color={T.sage} />
            <KpiCard label="Avg Deal Size" value="$120M" sub="Series B/C dominant" color={T.amber} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Investment by Source ($B committed)</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={investData}>
                  <XAxis dataKey="investor" tick={{ fill: T.textMut, fontSize: 10 }} />
                  <YAxis tick={{ fill: T.textMut, fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, color: T.text }} />
                  <Bar dataKey="committed" fill={T.gold} name="Committed ($B)" radius={[3,3,0,0]} />
                  <Bar dataKey="pipeline" fill={T.teal} name="Pipeline ($B)" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Advanced Reactor Deployment Outlook (GWe cumulative)</div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={timelineData}>
                  <XAxis dataKey="year" tick={{ fill: T.textMut, fontSize: 10 }} />
                  <YAxis tick={{ fill: T.textMut, fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, color: T.text }} />
                  <Line type="monotone" dataKey="htgr" stroke={T.sage}   dot={false} strokeWidth={2} name="HTGR (GWe)" />
                  <Line type="monotone" dataKey="sfr"  stroke={T.teal}   dot={false} strokeWidth={2} name="SFR (GWe)" />
                  <Line type="monotone" dataKey="msr"  stroke={T.gold}   dot={false} strokeWidth={2} name="MSR (GWe)" />
                  <Line type="monotone" dataKey="lfr"  stroke={T.amber}  dot={false} strokeWidth={2} name="LFR (GWe)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      );
      case 9: return (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
            <KpiCard label="FOAK Cost Risk" value="±50%" sub="Historical nuclear overruns" color={T.red} />
            <KpiCard label="Regulatory Timeline" value="5–10 yr" sub="NRC / CNSC licensing" color={T.amber} />
            <KpiCard label="Technology Risk" value="Medium" sub="Gen IV vs Gen III+" color={T.amber} />
            <KpiCard label="Supply Chain Risk" value="High" sub="HALEU + specialized fab" color={T.red} />
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: T.gold, marginBottom: 16 }}>Gen IV Risk Matrix</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
              {[
                { risk:"FOAK Cost Overrun", prob:"High", impact:"Critical", mitigation:"Fixed-price EPC; modular fabrication; NOAK learning curve", color: T.red },
                { risk:"Regulatory Delay", prob:"High", impact:"High", mitigation:"Pre-licensing engagement; technology-neutral rules (NRC Part 53)", color: T.amber },
                { risk:"HALEU Supply Gap", prob:"High", impact:"High", mitigation:"DOE reserve; Centrus demo; Urenco expansion target 2027", color: T.amber },
                { risk:"Fuel Qualification", prob:"Medium", impact:"High", mitigation:"TRISO irradiation campaigns; ATF roadmap; INL qualification", color: T.amber },
                { risk:"Public Acceptance", prob:"Medium", impact:"Medium", mitigation:"Passive safety narrative; siting in industrial zones", color: T.gold },
                { risk:"Offtake Market", prob:"Low", impact:"Medium", mitigation:"PPA+CfD frameworks; tech co. data center deals; hydrogen offtake", color: T.sage },
              ].map((r, i) => (
                <div key={i} style={{ background: T.surfaceH, borderRadius: 6, padding: 14, borderLeft: `3px solid ${r.color}` }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 4 }}>{r.risk}</div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 10, background: r.color, color: "#fff", padding: "2px 6px", borderRadius: 3 }}>P: {r.prob}</span>
                    <span style={{ fontSize: 10, background: T.surface, color: T.textSec, padding: "2px 6px", borderRadius: 3, border: `1px solid ${T.border}` }}>I: {r.impact}</span>
                  </div>
                  <div style={{ fontSize: 11, color: T.textMut }}>{r.mitigation}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
            <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Gen IV Development Timeline — Key Decision Gates</div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={[
                { phase:"Conceptual", start:2020, dur:5 }, { phase:"Basic Design", start:2025, dur:5 },
                { phase:"Licensing",  start:2026, dur:6 }, { phase:"FOAK Const.", start:2027, dur:5 },
                { phase:"Commission", start:2030, dur:2 }, { phase:"NOAK Scale",  start:2032, dur:8 },
              ]} layout="vertical">
                <XAxis type="number" domain={[2020,2045]} tick={{ fill: T.textMut, fontSize: 10 }} />
                <YAxis dataKey="phase" type="category" tick={{ fill: T.textMut, fontSize: 10 }} width={90} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, color: T.text }} />
                <Bar dataKey="dur" fill={T.gold} radius={[0,3,3,0]} name="Duration (yr)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
      default: return null;
    }
  };

  return (
    <div style={{ background: T.bg, minHeight: "100vh", padding: 24, fontFamily: T.font, color: T.text }}>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, borderBottom: `1px solid ${T.border}`, paddingBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: T.gold, fontFamily: T.mono, letterSpacing: 2, marginBottom: 6 }}>EP-DU4 · ADVANCED REACTOR FINANCE</div>
            <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, color: T.text }}>Advanced & Gen IV Reactor Finance Intelligence</h1>
            <div style={{ fontSize: 13, color: T.textSec, marginTop: 4 }}>MSR · SFR · HTGR · GFR · LFR · DOE ARDP · Process Heat · TRISO Fuels · Investment Landscape</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono }}>ADV. REACTOR LCOE</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: T.gold }}>${lcoe}/MWhe</div>
            <div style={{ fontSize: 11, color: T.textSec }}>{GEN4_TYPES[selectedType].abbr} profile · {cf}% CF</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 4, marginBottom: 24, flexWrap: "wrap" }}>
          {TABS.map((t, i) => (
            <button key={i} onClick={() => setTab(i)} style={{
              padding: "7px 14px", fontSize: 12, cursor: "pointer", borderRadius: 4,
              background: tab === i ? T.gold : T.surface,
              color: tab === i ? T.bg : T.textSec,
              border: `1px solid ${tab === i ? T.gold : T.border}`,
              fontFamily: T.font, fontWeight: tab === i ? 600 : 400,
            }}>{t}</button>
          ))}
        </div>

        {tabContent()}
      </div>
    </div>
  );
}
