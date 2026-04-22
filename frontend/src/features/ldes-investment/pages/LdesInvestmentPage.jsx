import React, { useState, useMemo } from "react";
import EnergyAdvancedAnalytics from '../../_shared/EnergyAdvancedAnalytics';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, ComposedChart,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine } from "recharts";

const T = {
  bg: "#0f1117", surface: "#1a1d27", surfaceH: "#22263a", border: "#2a2f45", borderL: "#353a52",
  navy: "#1e3a5f", navyL: "#2a4a6f", gold: "#d4a843", goldL: "#e0b85a",
  sage: "#2d6a4f", sageL: "#3d8a6a", teal: "#0d4f5c", text: "#e8e0d0",
  textSec: "#a89880", textMut: "#6b6050", red: "#c0392b", green: "#27ae60",
  amber: "#e67e22", font: "'DM Sans', sans-serif", mono: "'JetBrains Mono', monospace",
};

const sr = s => { const x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

function calcLcos({ capexPerKwh, opexPct, rte, cycles, lifetime, wacc }) {
  const w = wacc / 100;
  const capexAnn = capexPerKwh * w / (1 - Math.pow(1 + w, -lifetime));
  const opexAnn  = capexPerKwh * opexPct / 100;
  const throughput = cycles * (rte / 100);
  return throughput > 0 ? +((capexAnn + opexAnn) / throughput).toFixed(4) : 0;
}

function irr(cashflows, guess = 0.1) {
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

const TECHNOLOGIES = [
  {
    name: "Iron-Air Battery (Form Energy)", cap_kwh: 100, capex_kwh: 20, opex_pct: 2, rte: 68,
    cycles_yr: 150, lifetime: 20, duration_hr: 100, trl: 7, mass_prod: "2024+",
    co2_kg_kwh: 12, applications: ["Seasonal storage","Multi-day backup","Capacity replacement"],
    wacc: 8, notes: "Rust chemistry; no fire risk; 100h duration; $20/kWh target"
  },
  {
    name: "Vanadium Flow (VRFB)", cap_kwh: 100, capex_kwh: 300, opex_pct: 2.5, rte: 78,
    cycles_yr: 300, lifetime: 25, duration_hr: 8, trl: 9, mass_prod: "Commercial",
    co2_kg_kwh: 55, applications: ["8–24h grid storage","Renewable firming","Industrial backup"],
    wacc: 7, notes: "Electrolyte retains value; unlimited cycles; -40°C to +50°C operation"
  },
  {
    name: "Zinc-Bromine Flow (Redflow)", cap_kwh: 100, capex_kwh: 380, opex_pct: 3, rte: 72,
    cycles_yr: 250, lifetime: 20, duration_hr: 10, trl: 8, mass_prod: "Semi-commercial",
    co2_kg_kwh: 62, applications: ["Off-grid mining","Tropical climate","Telecom backup"],
    wacc: 9, notes: "Tropical climate rated; -15% size vs VRFB; modular"
  },
  {
    name: "Zinc-Air (EOS Energy)", cap_kwh: 100, capex_kwh: 75, opex_pct: 1.5, rte: 75,
    cycles_yr: 200, lifetime: 20, duration_hr: 4, trl: 8, mass_prod: "Scaling 2024",
    co2_kg_kwh: 18, applications: ["4–12h grid","C&I backup","Renewables firming"],
    wacc: 8, notes: "Aqueous electrolyte; non-flammable; $75/kWh current"
  },
  {
    name: "Liquid Air (Highview Power)", cap_kwh: 100, capex_kwh: 180, opex_pct: 3, rte: 62,
    cycles_yr: 250, lifetime: 25, duration_hr: 12, trl: 8, mass_prod: "2025+",
    co2_kg_kwh: 30, applications: ["10–40h grid","Seasonal","Industrial heat recovery"],
    wacc: 8, notes: "Cryogenic LAES; waste heat integration; 250MW Carrington UK"
  },
  {
    name: "Pumped Thermal (Carnot Battery)", cap_kwh: 100, capex_kwh: 120, opex_pct: 2, rte: 65,
    cycles_yr: 200, lifetime: 30, duration_hr: 12, trl: 7, mass_prod: "2026+",
    co2_kg_kwh: 20, applications: ["12–24h grid","Industrial heat","Seasonal buffer"],
    wacc: 7.5, notes: "No geographic constraint; heat pump + turbine; Malta Antora leading"
  },
  {
    name: "Green H₂ (LDES, electrolysis+CCGT)", cap_kwh: 100, capex_kwh: 25, opex_pct: 4, rte: 35,
    cycles_yr: 80, lifetime: 20, duration_hr: 720, trl: 8, mass_prod: "Commercial",
    co2_kg_kwh: 8, applications: ["Weekly–seasonal","Industrial H₂","Electricity + heat"],
    wacc: 9, notes: "Multi-week storage; seasonal arbitrage; low RTE offset by long duration"
  },
  {
    name: "Gravity/ARES Rail (Energy Vault)", cap_kwh: 100, capex_kwh: 100, opex_pct: 1.5, rte: 82,
    cycles_yr: 300, lifetime: 30, duration_hr: 8, trl: 8, mass_prod: "Commercial",
    co2_kg_kwh: 15, applications: ["8–24h grid","Mine-associated","Renewable integration"],
    wacc: 7.5, notes: "No electrochemistry; rail/crane gravity; Energy Vault, RheEnergise"
  },
];

const MARKET_SEGMENTS = [
  { seg: "Utility-Scale Grid Firming", gw_2025: 4.2, gw_2030: 38, gw_2035: 120, price_mwh: 85, min_dur_hr: 8 },
  { seg: "Capacity Market (LDES)", gw_2025: 2.1, gw_2030: 18, gw_2035: 65, price_mwh: 60, min_dur_hr: 10 },
  { seg: "Seasonal Balancing", gw_2025: 0.5, gw_2030: 5, gw_2035: 45, price_mwh: 40, min_dur_hr: 100 },
  { seg: "Islands / Off-Grid", gw_2025: 1.8, gw_2030: 12, gw_2035: 35, price_mwh: 120, min_dur_hr: 24 },
  { seg: "Industrial Process Heat+Power", gw_2025: 0.8, gw_2030: 8, gw_2035: 28, price_mwh: 70, min_dur_hr: 12 },
];

const TABS = [
  "LDES Overview", "Technology Comparison", "LCOS Engine", "Market Sizing",
  "Investment Returns", "Technology Radar", "Project Pipeline", "Seasonal Storage",
  "Financing Structures", "Policy & Regulation"
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

export default function LdesInvestmentPage() {
  const [tab, setTab]           = useState(0);
  const [techIdx, setTechIdx]   = useState(0);
  const [capexKwh, setCapexKwh] = useState(150);
  const [opexPct, setOpexPct]   = useState(2.0);
  const [rte, setRte]           = useState(70);
  const [cyclesYr, setCyclesYr] = useState(200);
  const [lifetime, setLifetime] = useState(20);
  const [wacc, setWacc]         = useState(8);
  const [rePrice, setRePrice]   = useState(35);

  const lcos = useMemo(() => calcLcos({ capexPerKwh: capexKwh, opexPct, rte, cycles: cyclesYr, lifetime, wacc }), [capexKwh, opexPct, rte, cyclesYr, lifetime, wacc]);

  const techLcos = useMemo(() => TECHNOLOGIES.map(t => ({
    name: t.name.split(" ")[0] + " " + (t.name.split(" ")[1] || ""),
    lcos: calcLcos({ capexPerKwh: t.capex_kwh, opexPct: t.opex_pct, rte: t.rte, cycles: t.cycles_yr, lifetime: t.lifetime, wacc: t.wacc }),
    capex: t.capex_kwh,
    rte: t.rte,
    duration: t.duration_hr,
  })), []);

  const selectedTech = TECHNOLOGIES[techIdx];
  const selectedLcos = techLcos[techIdx];

  const irrCalc = useMemo(() => {
    const capexTotal = capexKwh * 100000;
    const annRevenue = cyclesYr * (rte / 100) * rePrice * 100000;
    const annOpex    = capexTotal * opexPct / 100;
    const net        = annRevenue - annOpex;
    const cfs        = [-capexTotal, ...Array(lifetime).fill(net)];
    return (irr(cfs) * 100).toFixed(1);
  }, [capexKwh, opexPct, rte, cyclesYr, lifetime, rePrice]);

  const marketData = useMemo(() => MARKET_SEGMENTS.map(s => ({
    name: s.seg.split(" ").slice(0, 2).join(" "),
    "2025": s.gw_2025, "2030": s.gw_2030, "2035": s.gw_2035
  })), []);

  const radarTech = useMemo(() => {
    const t = selectedTech;
    return [
      { axis: "Cost (inv.)", value: Math.min(100, (400 / t.capex_kwh) * 80) },
      { axis: "Round-Trip Eff.", value: t.rte },
      { axis: "Duration", value: Math.min(100, (t.duration_hr / 24) * 80 + 20) },
      { axis: "Lifetime", value: Math.min(100, (t.lifetime / 30) * 100) },
      { axis: "TRL Maturity", value: (t.trl / 9) * 100 },
      { axis: "Safety", value: t.co2_kg_kwh < 20 && t.name.includes("Iron") ? 95 : t.co2_kg_kwh < 30 ? 85 : 70 },
    ];
  }, [techIdx, selectedTech]);

  const projectData = useMemo(() => [
    { name: "Carrington LAES (UK)", tech: "Liquid Air", mw: 250, mwh: 2000, capex_m: 280, stage: "Construction", offtake: "Capacity Market + grid services" },
    { name: "Rongke Power VRFB (China)", tech: "Vanadium Flow", mw: 200, mwh: 800, capex_m: 260, stage: "Operational", offtake: "Grid utility" },
    { name: "Form Energy Pilot (MN/WV)", tech: "Iron-Air", mw: 1, mwh: 100, capex_m: 4, stage: "Pilot", offtake: "GRE utility PPA" },
    { name: "Hydrostor A-CAES (Canada)", tech: "Compressed Air", mw: 500, mwh: 5000, capex_m: 850, stage: "Development", offtake: "IESO capacity" },
    { name: "EOS Energy Grid (USA)", tech: "Zinc-Air", mw: 8, mwh: 32, capex_m: 15, stage: "Operational", offtake: "Commercial PPA" },
    { name: "Energy Vault EVx (US/ME)", tech: "Gravity", mw: 36, mwh: 288, capex_m: 80, stage: "Construction", offtake: "PG&E + export" },
    { name: "Highview CRYOBattery (UK 2)", tech: "Liquid Air", mw: 100, mwh: 1200, capex_m: 165, stage: "Development", offtake: "Capacity Market" },
    { name: "CATL TENER Flow (China)", tech: "Iron Flow", mw: 100, mwh: 1000, capex_m: 60, stage: "Announced", offtake: "Utility tender" },
  ], []);

  const C = { gold: "#d4a843", teal: "#0d9488", green: "#27ae60", red: "#c0392b", amber: "#e67e22", purple: "#7c3aed" };

  return (
    <div style={{ background: T.bg, minHeight: "100vh", fontFamily: T.font, color: T.text, padding: "24px 32px" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
          EP-DT6 · Long-Duration Energy Storage Investment Analytics
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>Long-Duration Energy Storage (LDES) Investment Analytics</h1>
        <p style={{ color: T.textSec, marginTop: 6, fontSize: 14 }}>
          Iron-Air · Vanadium Flow · Liquid Air · Gravity · Green H₂ · LCOS engine · Market sizing · 10-yr IRR
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        <KpiCard label="LDES Market 2030" value="65 GW" unit="" sub="vs 9 GW in 2025 (+7×)" />
        <KpiCard label="LCOS (configured)" value={`$${(lcos * 1000).toFixed(0)}`} unit="/MWh" sub="Levelised cost at inputs" color={C.teal} />
        <KpiCard label="Investment Need 2030" value="$200Bn" unit="" sub="Total LDES + seasonal" color={C.amber} />
        <KpiCard label="Project IRR" value={`${irrCalc}%`} unit="" sub="10yr at current revenue price" color={parseFloat(irrCalc) > 8 ? C.green : C.red} />
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
          <h3 style={{ color: T.gold, marginBottom: 16 }}>LDES Landscape — Cost vs Duration vs Maturity</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>LCOS by Technology ($/MWh)</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={techLcos} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" stroke={T.textMut} tickFormatter={v => `$${(v * 1000).toFixed(0)}`} />
                  <YAxis dataKey="name" type="category" stroke={T.textMut} width={130} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }}
                    formatter={v => [`$${(v * 1000).toFixed(0)}/MWh`]} />
                  <ReferenceLine x={0.05} stroke={T.green} strokeDasharray="3 3" label={{ value: "Li-ion BESS", fill: T.green, fontSize: 9 }} />
                  <Bar dataKey="lcos" name="LCOS ($/kWh)" fill={C.teal} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Duration vs Capex ($/kWh) — Bubble = RTE%</div>
              <ResponsiveContainer width="100%" height={280}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="duration" name="Duration (h)" stroke={T.textMut} type="number"
                    label={{ value: "Duration (hrs)", position: "insideBottom", offset: -5, fill: T.textMut, fontSize: 10 }} />
                  <YAxis dataKey="capex" name="Capex ($/kWh)" stroke={T.textMut}
                    label={{ value: "Capex $/kWh", angle: -90, position: "insideLeft", fill: T.textMut, fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }}
                    content={({ payload }) => payload?.[0] ? (
                      <div style={{ background: T.surface, border: `1px solid ${T.border}`, padding: 8, borderRadius: 4 }}>
                        {TECHNOLOGIES[payload[0].payload.idx]?.name ?? ""}
                        <br />{`${payload[0].payload.duration}h · $${payload[0].payload.capex}/kWh · RTE ${payload[0].payload.rte}%`}
                      </div>
                    ) : null} />
                  <Scatter data={techLcos.map((t, i) => ({ ...t, idx: i }))} fill={C.gold} fillOpacity={0.8} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div>
          <h3 style={{ color: T.gold, marginBottom: 16 }}>Technology Comparison</h3>
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {TECHNOLOGIES.map((t, i) => (
              <button key={i} onClick={() => setTechIdx(i)} style={{
                padding: "5px 10px", borderRadius: 6, border: `1px solid ${techIdx === i ? T.gold : T.border}`,
                background: techIdx === i ? T.navyL : T.surface, color: techIdx === i ? T.gold : T.textSec,
                cursor: "pointer", fontSize: 10,
              }}>{t.name.split(" ")[0]}</button>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>{selectedTech.name}</div>
              {[
                ["Capex ($/kWh)", `$${selectedTech.capex_kwh}`],
                ["Round-Trip Eff.", `${selectedTech.rte}%`],
                ["Duration", `${selectedTech.duration_hr}h`],
                ["Cycles/yr", selectedTech.cycles_yr],
                ["Lifetime", `${selectedTech.lifetime} yr`],
                ["TRL", `${selectedTech.trl}/9`],
                ["Commercial Status", selectedTech.mass_prod],
                ["CO₂ Footprint", `${selectedTech.co2_kg_kwh} kg/kWh`],
                ["LCOS", `$${(selectedLcos?.lcos * 1000).toFixed(0)}/MWh`],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${T.border}` }}>
                  <span style={{ fontSize: 12, color: T.textSec }}>{k}</span>
                  <span style={{ fontSize: 12, fontFamily: T.mono, color: T.gold }}>{v}</span>
                </div>
              ))}
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 11, color: T.textMut, marginBottom: 4 }}>Key Applications</div>
                {selectedTech.applications.map(a => (
                  <span key={a} style={{ display: "inline-block", background: T.navy, color: T.text, padding: "2px 8px", borderRadius: 4, fontSize: 10, marginRight: 6, marginBottom: 4 }}>{a}</span>
                ))}
              </div>
              <div style={{ marginTop: 8, fontSize: 10, color: T.textMut }}>{selectedTech.notes}</div>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Performance Radar — {selectedTech.name.split(" ")[0]}</div>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarTech}>
                  <PolarGrid stroke={T.border} />
                  <PolarAngleAxis dataKey="axis" tick={{ fill: T.textSec, fontSize: 11 }} />
                  <Radar name="Score" dataKey="value" fill={C.teal} fillOpacity={0.3} stroke={C.teal} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 2 && (
        <div>
          <h3 style={{ color: T.gold, marginBottom: 16 }}>LCOS Engine — Levelised Cost of Storage</h3>
          <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <Slider label="Capex ($/kWh)" value={capexKwh} min={10} max={500} step={5} onChange={setCapexKwh} unit="" />
              <Slider label="Opex (% of Capex/yr)" value={opexPct} min={0.5} max={6} step={0.5} onChange={setOpexPct} unit="%" fmt={v => v.toFixed(1)} />
              <Slider label="Round-Trip Efficiency (%)" value={rte} min={40} max={95} step={1} onChange={setRte} unit="%" />
              <Slider label="Cycles per Year" value={cyclesYr} min={20} max={365} step={10} onChange={setCyclesYr} unit="" />
              <Slider label="Lifetime (years)" value={lifetime} min={10} max={35} step={1} onChange={setLifetime} unit="" />
              <Slider label="WACC (%)" value={wacc} min={3} max={15} step={0.5} onChange={setWacc} unit="%" fmt={v => v.toFixed(1)} />
              <div style={{ marginTop: 12, padding: 12, background: T.surfaceH, borderRadius: 6 }}>
                <div style={{ fontSize: 11, color: T.textMut }}>LCOS</div>
                <div style={{ fontSize: 28, color: T.gold, fontFamily: T.mono, fontWeight: 700, marginTop: 4 }}>
                  ${(lcos * 1000).toFixed(0)}<span style={{ fontSize: 14, color: T.textSec }}>/MWh</span>
                </div>
              </div>
            </div>
            <div>
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>LCOS Sensitivity — Capex vs Efficiency ($/MWh)</div>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="capex" type="number" domain={[10, 500]} tickCount={6} stroke={T.textMut}
                      label={{ value: "Capex ($/kWh)", position: "insideBottom", offset: -5, fill: T.textMut, fontSize: 10 }} />
                    <YAxis stroke={T.textMut} label={{ value: "LCOS $/MWh", angle: -90, position: "insideLeft", fill: T.textMut, fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} formatter={v => [`$${v.toFixed(0)}/MWh`]} />
                    <Legend />
                    {[60, 70, 80].map((eff, ei) => (
                      <Line key={eff}
                        data={[10, 50, 100, 150, 200, 300, 400, 500].map(cap => ({
                          capex: cap,
                          lcos: +(calcLcos({ capexPerKwh: cap, opexPct: 2.5, rte: eff, cycles: cyclesYr, lifetime, wacc }) * 1000).toFixed(0)
                        }))}
                        dataKey="lcos" name={`RTE ${eff}%`}
                        stroke={[C.green, C.gold, C.teal][ei]} dot={false} strokeWidth={2} />
                    ))}
                    <ReferenceLine y={50} stroke={T.amber} strokeDasharray="3 3" label={{ value: "Li-ion parity", fill: T.amber, fontSize: 9 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 3 && (
        <div>
          <h3 style={{ color: T.gold, marginBottom: 16 }}>LDES Market Sizing & Growth</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Global LDES Installed Capacity by Segment (GW)</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={marketData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" stroke={T.textMut} tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={50} />
                  <YAxis stroke={T.textMut} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  <Legend />
                  <Bar dataKey="2025" fill={C.teal} />
                  <Bar dataKey="2030" fill={C.gold} />
                  <Bar dataKey="2035" fill={C.green} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>LDES vs Short-Duration BESS — Value Stacking Comparison</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={[
                  { service: "FCR (30s)", ldes: 0.3, bess: 0.9 },
                  { service: "aFRR (5min)", ldes: 0.5, bess: 0.9 },
                  { service: "Capacity (8–24h)", ldes: 0.9, bess: 0.4 },
                  { service: "Seasonal Arb (100h+)", ldes: 0.95, bess: 0.1 },
                  { service: "Renewable Firming", ldes: 0.85, bess: 0.5 },
                  { service: "Capacity Credit", ldes: 0.9, bess: 0.65 },
                ]} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" domain={[0, 1]} stroke={T.textMut} tickFormatter={v => `${(v * 100).toFixed(0)}%`} />
                  <YAxis dataKey="service" type="category" stroke={T.textMut} width={150} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} formatter={v => [`${(v * 100).toFixed(0)}%`]} />
                  <Legend />
                  <Bar dataKey="ldes" name="LDES Suitability" fill={C.teal} />
                  <Bar dataKey="bess" name="Short-Duration BESS" fill={C.gold} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 4 && (
        <div>
          <h3 style={{ color: T.gold, marginBottom: 16 }}>Investment Returns — LDES Project Finance</h3>
          <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <Slider label="Capex ($/kWh)" value={capexKwh} min={10} max={500} step={5} onChange={setCapexKwh} unit="" />
              <Slider label="Revenue Price ($/MWh)" value={rePrice} min={10} max={150} step={5} onChange={setRePrice} unit="" />
              <Slider label="Cycles/yr" value={cyclesYr} min={20} max={365} step={10} onChange={setCyclesYr} unit="" />
              <Slider label="RTE (%)" value={rte} min={40} max={95} step={1} onChange={setRte} unit="%" />
              <Slider label="Lifetime (yr)" value={lifetime} min={10} max={35} step={1} onChange={setLifetime} unit="" />
              <Slider label="WACC (%)" value={wacc} min={3} max={15} step={0.5} onChange={setWacc} unit="%" fmt={v => v.toFixed(1)} />
              <div style={{ marginTop: 12, padding: 12, background: T.surfaceH, borderRadius: 6 }}>
                <div style={{ fontSize: 10, color: T.textMut }}>Project IRR</div>
                <div style={{ fontSize: 24, color: parseFloat(irrCalc) > 8 ? T.green : T.red, fontFamily: T.mono, fontWeight: 700 }}>{irrCalc}%</div>
              </div>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>IRR Sensitivity — Revenue Price vs Capex (at {rte}% RTE, {cyclesYr} cycles/yr)</div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="cap" type="number" domain={[10, 500]} tickCount={6} stroke={T.textMut}
                    label={{ value: "Capex ($/kWh)", position: "insideBottom", offset: -5, fill: T.textMut, fontSize: 10 }} />
                  <YAxis stroke={T.textMut} label={{ value: "IRR (%)", angle: -90, position: "insideLeft", fill: T.textMut, fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  <Legend />
                  {[40, 60, 80, 100].map((price, pi) => (
                    <Line key={price}
                      data={[10, 50, 100, 150, 200, 300, 400, 500].map(cap => {
                        const capexT = cap * 100000;
                        const annRev = cyclesYr * (rte / 100) * price * 100000;
                        const annOp  = capexT * (opexPct / 100);
                        const net    = annRev - annOp;
                        const cfs    = [-capexT, ...Array(lifetime).fill(net)];
                        return { cap, irr: +(irr(cfs) * 100).toFixed(1) };
                      })}
                      dataKey="irr" name={`$${price}/MWh`}
                      stroke={[C.red, C.amber, C.gold, C.green][pi]} dot={false} strokeWidth={2} />
                  ))}
                  <ReferenceLine y={8} stroke={T.teal} strokeDasharray="4 4" label={{ value: "8% hurdle", fill: T.teal, fontSize: 9 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 5 && (
        <div>
          <h3 style={{ color: T.gold, marginBottom: 16 }}>Technology Radar — All LDES Technologies</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Capex vs RTE Trade-off</div>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="rte" name="RTE (%)" stroke={T.textMut} domain={[30, 100]}
                    label={{ value: "RTE (%)", position: "insideBottom", offset: -5, fill: T.textMut, fontSize: 10 }} />
                  <YAxis dataKey="capex" name="Capex ($/kWh)" stroke={T.textMut}
                    label={{ value: "Capex $/kWh", angle: -90, position: "insideLeft", fill: T.textMut, fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }}
                    content={({ payload }) => payload?.[0] ? (
                      <div style={{ background: T.surface, border: `1px solid ${T.border}`, padding: 8, borderRadius: 4, fontSize: 11 }}>
                        {TECHNOLOGIES[payload[0].payload.idx]?.name}<br />
                        RTE: {payload[0].payload.rte}% · ${payload[0].payload.capex}/kWh
                      </div>
                    ) : null} />
                  <Scatter data={TECHNOLOGIES.map((t, i) => ({ rte: t.rte, capex: t.capex_kwh, idx: i }))} fill={C.gold} fillOpacity={0.8} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Duration vs LCOS ($/MWh)</div>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="duration" name="Duration (h)" stroke={T.textMut} type="number"
                    label={{ value: "Duration (hrs)", position: "insideBottom", offset: -5, fill: T.textMut, fontSize: 10 }} />
                  <YAxis dataKey="lcos_mwh" name="LCOS ($/MWh)" stroke={T.textMut}
                    label={{ value: "LCOS $/MWh", angle: -90, position: "insideLeft", fill: T.textMut, fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }}
                    content={({ payload }) => payload?.[0] ? (
                      <div style={{ background: T.surface, border: `1px solid ${T.border}`, padding: 8, borderRadius: 4, fontSize: 11 }}>
                        {TECHNOLOGIES[payload[0].payload.idx]?.name}<br />
                        {payload[0].payload.duration}h · ${payload[0].payload.lcos_mwh}/MWh
                      </div>
                    ) : null} />
                  <Scatter data={TECHNOLOGIES.map((t, i) => ({
                    duration: t.duration_hr,
                    lcos_mwh: +(techLcos[i]?.lcos * 1000).toFixed(0),
                    idx: i
                  }))} fill={C.teal} fillOpacity={0.8} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 6 && (
        <div>
          <h3 style={{ color: T.gold, marginBottom: 16 }}>Global LDES Project Pipeline</h3>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {["Project", "Technology", "Capacity", "Energy", "Capex ($M)", "Stage", "Offtake"].map(h => (
                    <th key={h} style={{ padding: "8px 12px", color: T.textMut, textAlign: "left" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {projectData.map((p, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.surfaceH : "transparent" }}>
                    <td style={{ padding: "8px 12px", color: T.gold, fontWeight: 600 }}>{p.name}</td>
                    <td style={{ padding: "8px 12px", color: T.textSec }}>{p.tech}</td>
                    <td style={{ padding: "8px 12px", fontFamily: T.mono }}>{p.mw} MW</td>
                    <td style={{ padding: "8px 12px", fontFamily: T.mono }}>{p.mwh} MWh</td>
                    <td style={{ padding: "8px 12px", fontFamily: T.mono }}>${p.capex_m}M</td>
                    <td style={{ padding: "8px 12px" }}>
                      <span style={{
                        background: p.stage === "Operational" ? T.sage : p.stage === "Construction" ? T.teal : T.navy,
                        color: T.text, padding: "2px 8px", borderRadius: 4, fontSize: 10
                      }}>{p.stage}</span>
                    </td>
                    <td style={{ padding: "8px 12px", color: T.textSec, fontSize: 11 }}>{p.offtake}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 7 && (
        <div>
          <h3 style={{ color: T.gold, marginBottom: 16 }}>Seasonal Storage Economics</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Seasonal Price Spread (€/MWh) — Wind-heavy grid</div>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={Array.from({ length: 12 }, (_, m) => {
                  const isWinterPeak = m <= 1 || m >= 10;
                  const isSummerTrough = m >= 4 && m <= 7;
                  return {
                    month: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][m],
                    price: isWinterPeak ? 90 + sr(m * 7) * 40 : isSummerTrough ? 15 + sr(m * 11) * 15 : 45 + sr(m * 13) * 25,
                    reGen: isSummerTrough ? 80 + sr(m * 17) * 30 : isWinterPeak ? 30 + sr(m * 5) * 20 : 55 + sr(m * 9) * 25,
                  };
                })}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="month" stroke={T.textMut} />
                  <YAxis yAxisId="price" stroke={T.textMut} />
                  <YAxis yAxisId="re" orientation="right" stroke={T.textMut} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  <Legend />
                  <Area yAxisId="price" dataKey="price" name="Price (€/MWh)" fill={C.gold} fillOpacity={0.3} stroke={C.gold} />
                  <Area yAxisId="re" dataKey="reGen" name="RE Generation (GW)" fill={C.teal} fillOpacity={0.2} stroke={C.teal} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Seasonal Arbitrage — Charge/Discharge Strategy</div>
              {[
                { tech: "Iron-Air (100h, Form Energy)", cap_gwh: 10, buy: 18, sell: 88, revenue_m: 70, rte_loss: 32, net_m: 47.6 },
                { tech: "Green H₂ (CCGT, 720h)", cap_gwh: 50, buy: 15, sell: 85, revenue_m: 350, rte_loss: 65, net_m: 122.5 },
                { tech: "LAES Liquid Air (12h)", cap_gwh: 2.4, buy: 20, sell: 75, revenue_m: 13.2, rte_loss: 38, net_m: 8.2 },
              ].map((t, i) => (
                <div key={i} style={{ padding: 12, background: T.surfaceH, borderRadius: 6, marginBottom: 8 }}>
                  <div style={{ fontSize: 12, color: T.gold, fontWeight: 600, marginBottom: 6 }}>{t.tech}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 11 }}>
                    <div><span style={{ color: T.textMut }}>Buy price:</span> <span style={{ color: T.green, fontFamily: T.mono }}>€{t.buy}/MWh</span></div>
                    <div><span style={{ color: T.textMut }}>Sell price:</span> <span style={{ color: T.amber, fontFamily: T.mono }}>€{t.sell}/MWh</span></div>
                    <div><span style={{ color: T.textMut }}>RTE loss:</span> <span style={{ color: T.red, fontFamily: T.mono }}>{t.rte_loss}%</span></div>
                    <div><span style={{ color: T.textMut }}>Net margin:</span> <span style={{ color: T.gold, fontFamily: T.mono }}>€{t.net_m}M</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 8 && (
        <div>
          <h3 style={{ color: T.gold, marginBottom: 16 }}>LDES Financing Structures</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Capital Stack — Typical LDES Project</div>
              {[
                { layer: "Senior Debt (Project Finance)", pct: 55, rate: "SOFR + 200bps", tenor: "20yr", provider: "Commercial banks, ECA" },
                { layer: "Green Bond / Climate Bond", pct: 15, rate: "Fixed 4.8%", tenor: "15yr", provider: "Capital markets" },
                { layer: "Mezzanine / Subordinated", pct: 10, rate: "8–10%", tenor: "10yr", provider: "Infrastructure funds" },
                { layer: "Preferred Equity", pct: 10, rate: "8–10% preferred", tenor: "Perpetual", provider: "Pension / Infra funds" },
                { layer: "Common Equity (Sponsor)", pct: 10, rate: "Target 12–15% IRR", tenor: "Project life", provider: "Developers, PE" },
              ].map((l, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
                  <div>
                    <div style={{ fontSize: 12, color: T.text }}>{l.layer}</div>
                    <div style={{ fontSize: 10, color: T.textMut }}>{l.provider} · {l.tenor}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, color: T.gold, fontFamily: T.mono }}>{l.pct}%</div>
                    <div style={{ fontSize: 10, color: T.textSec }}>{l.rate}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Public Support Mechanisms for LDES</div>
              {[
                { program: "IRA §48 ITC (10-yr LDES)", amount: "30% ITC (+ 10% domestic content)", jurisdiction: "USA", eligible: "All LDES ≥4h" },
                { program: "DOE LDES Program (Loan Guarantees)", amount: "Low-cost debt guarantees", jurisdiction: "USA", eligible: "Innovative LDES" },
                { program: "EU Innovation Fund (NER300 successor)", amount: "€10Bn grants 2021–2030", jurisdiction: "EU", eligible: "Innovative low-carbon tech" },
                { program: "UK Contracts for Difference (LDES Pilot)", amount: "10-yr revenue guarantee", jurisdiction: "UK", eligible: "≥6h LDES technologies" },
                { program: "ARENA LDES Program (Australia)", amount: "A$200M grants", jurisdiction: "Australia", eligible: "All LDES pilot/demo" },
              ].map((p, i) => (
                <div key={i} style={{ padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, color: T.gold, fontWeight: 600 }}>{p.program}</span>
                    <span style={{ fontSize: 11, color: T.amber }}>{p.jurisdiction}</span>
                  </div>
                  <div style={{ fontSize: 11, color: T.green, marginTop: 2 }}>{p.amount}</div>
                  <div style={{ fontSize: 10, color: T.textMut, marginTop: 1 }}>Eligible: {p.eligible}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 9 && (
        <div>
          <h3 style={{ color: T.gold, marginBottom: 16 }}>LDES Policy & Regulatory Landscape</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {[
              { jurisdiction: "USA", policy: "IRA + DOE LDES Program", detail: "30% ITC; $350M ARPA-E awards; $5Bn DOE loan guarantees; FERC Order 841 storage rights", status: "Active" },
              { jurisdiction: "EU", policy: "EU Solar & Storage Action Plan", detail: "LDES in EU Innovation Fund; revised TEN-E for storage; EMD Reform storage non-discrimination", status: "Active" },
              { jurisdiction: "UK", policy: "Review of Electricity Market Arrangements (REMA)", detail: "LDES in Contracts for Difference review; cap-and-floor mechanism proposed; £1Bn LDES support", status: "Consultation" },
              { jurisdiction: "Australia", policy: "Capacity Investment Scheme (CIS)", detail: "A$20Bn floor/cap mechanism for renewables + storage; LDES eligible; 6 state/territory programs", status: "Active" },
              { jurisdiction: "California (USA)", policy: "CPUC Long-Duration Storage RFO", detail: "900 MW+ LDES solicitation; iron-air, flow, LAES all pre-qualified; 2025 deployment target", status: "Procurement" },
              { jurisdiction: "Chile", policy: "Plan de Transición Energética 2050", detail: "90% renewables target; grid-scale storage mandatory in competitive tenders; LDES-specific tariff framework", status: "Developing" },
            ].map((r, i) => (
              <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 14, color: T.gold, fontWeight: 700 }}>{r.jurisdiction}</span>
                  <span style={{ background: r.status === "Active" || r.status === "Procurement" ? T.sage : T.navy, color: T.text, padding: "2px 8px", borderRadius: 4, fontSize: 10 }}>{r.status}</span>
                </div>
                <div style={{ fontSize: 11, color: T.amber, marginBottom: 6 }}>{r.policy}</div>
                <div style={{ fontSize: 11, color: T.textSec }}>{r.detail}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      <EnergyAdvancedAnalytics T={T} moduleCode="EP-DT6" title="LDES Investment — MC LCOS, Tornado & NGFS Seasonal Arbitrage Scenarios"
        mcModel={{ title: 'MC LCOS Iron-Air ($/MWh discharge)', unit: '/MWh', fmt: (n) => `$${n.toFixed(0)}`,
        vars: { capexKwh: { min: 20, mode: 35, max: 60 }, cycles: { min: 200, mode: 300, max: 400 }, rte: { min: 0.48, mode: 0.52, max: 0.58 }, lifeYrs: { min: 18, mode: 22, max: 30 } },
        compute: (v) => { const capexAnn = (v.capexKwh * 0.08) / (1 - Math.pow(1.08, -v.lifeYrs)); const cost = capexAnn / (v.cycles * v.rte); return cost * 1000; } }}
      tornadoModel={{ title: 'Tornado — LDES LCOS Drivers', unit: '/MWh', fmt: (n) => `$${n.toFixed(0)}`,
        inputs: { capexKwh: 35, cycles: 300, rte: 0.52, lifeYrs: 22 },
        compute: (v) => { const capexAnn = (v.capexKwh * 0.08) / (1 - Math.pow(1.08, -v.lifeYrs)); const cost = capexAnn / (v.cycles * v.rte); return cost * 1000; } }}
      scenarioImpact={(p) => Math.max(40, 95 - 0.25 * Math.max(0, p - 40))} scenarioFmt={(v) => `$${v.toFixed(0)}/MWh`}
      scenarioTitle="Carbon Price × NGFS Pathway — LCOS incl. seasonal arb value"
      peers={{ cols: [{ k: 'tech', label: 'LDES tech' }, { k: 'dur', label: 'Duration (h)', fmt: (v) => `${v}` }, { k: 'rte', label: 'RTE (%)', fmt: (v) => `${v}%` }, { k: 'lcos', label: 'LCOS ($/MWh)', fmt: (v) => `$${v}` }, { k: 'trl', label: 'TRL' }],
        rows: [{ tech: 'Iron-Air (Form Energy)',  dur: 100, rte: 52, lcos: 45,  trl: 7 }, { tech: 'VRFB (Invinity)',        dur: 12,  rte: 72, lcos: 110, trl: 9 }, { tech: 'Zn-Br (Redflow)',        dur: 10,  rte: 68, lcos: 115, trl: 8 }, { tech: 'LAES (Highview)',        dur: 24,  rte: 55, lcos: 95,  trl: 8 }, { tech: 'Gravity (Energy Vault)', dur: 12,  rte: 80, lcos: 105, trl: 7 }, { tech: 'Compressed CO2 (Energy Dome)', dur: 24, rte: 72, lcos: 95, trl: 7 }] }}
      />
    </div>
  );
}
