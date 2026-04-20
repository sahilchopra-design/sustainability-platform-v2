import React, { useState, useMemo } from "react";
import { BarChart, Bar, LineChart, Line, AreaChart, Area, ComposedChart,
  ScatterChart, Scatter, RadarChart, Radar, PolarGrid, PolarAngleAxis,
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

function npv(cashflows, rate) {
  return cashflows.reduce((s, cf, t) => s + cf / Math.pow(1 + rate, t), 0);
}

function calcSmrLcoe({ capexKw, opexFixed, fuelCost, wacc, cf, lifetime, nthOfAKind }) {
  const learningReduction = Math.pow(nthOfAKind, -0.12);
  const adjCapex = capexKw * learningReduction;
  const w = wacc / 100;
  const capexAnn = adjCapex * w / (1 - Math.pow(1 + w, -lifetime));
  const idc = Math.pow(1 + w, 2); // 3-4yr construction
  const annMwh = cf / 100 * 8760;
  return annMwh > 0 ? +((capexAnn * idc + opexFixed / annMwh * 1000) / annMwh * 1000 + fuelCost).toFixed(2) : 0;
}

const SMR_DESIGNS = [
  { name: "NuScale VOYGR-77", mw: 77, capex_kw: 6500, opex: 28, fuel: 9, wacc: 9, cf: 93, lifetime: 60, modules: 12, trl: 8, country: "USA", status: "NRC certified 2022", coolant: "Light Water", fuel_type: "LEU <5%", notes: "First NRC-certified SMR; UAMPS project cancelled 2023; new sites in development" },
  { name: "Rolls-Royce SMR", mw: 470, capex_kw: 4800, opex: 22, fuel: 9, wacc: 8, cf: 91, lifetime: 60, modules: 1, trl: 7, country: "UK", status: "GDA Phase 2", coolant: "Light Water", fuel_type: "LEU <5%", notes: "UK GDA underway; Czech JETE shortlisted; target £2.5Bn capex per unit" },
  { name: "GE-Hitachi BWRX-300", mw: 300, capex_kw: 3800, opex: 20, fuel: 9, wacc: 8, cf: 92, lifetime: 60, modules: 1, trl: 8, country: "Canada/USA/Poland", status: "CNSC Phase 1", coolant: "Light Water", fuel_type: "LEU <5%", notes: "OPG Darlington siting; Polish ORLEN partnership; 10th reactor on GE BWR design" },
  { name: "Kairos KP-FHR", mw: 140, capex_kw: 5200, opex: 24, fuel: 12, wacc: 9, cf: 92, lifetime: 40, modules: 2, trl: 6, country: "USA", status: "NRC Construction Permit", coolant: "Fluoride Salt", fuel_type: "TRISO (HALEU)", notes: "TRISO fuel in FLiBe salt; Hermes test reactor under construction; DOE ARDP funding" },
  { name: "X-Energy Xe-100", mw: 80, capex_kw: 5800, opex: 26, fuel: 14, wacc: 9, cf: 92, lifetime: 60, modules: 4, trl: 6, country: "USA/Canada", status: "DOE ARDP Phase 2", coolant: "Helium (HTGR)", fuel_type: "TRISO (HALEU)", notes: "Pebble bed HTGR; 320MW quad; Amazon/X-Energy commercial deal; 700°C process heat" },
  { name: "CANDU SMR (eVinci)", mw: 5, capex_kw: 12000, opex: 40, fuel: 8, wacc: 10, cf: 95, lifetime: 20, modules: 1, trl: 6, country: "Canada", status: "Canadian NRC review", coolant: "Heat Pipe", fuel_type: "HALEU", notes: "Westinghouse eVinci; 5MWe microreactor; remote mining sites; 10yr sealed operation" },
];

const TABS = [
  "SMR Overview", "Design Comparison", "Project Finance", "LCOE vs Scale",
  "NOAK Learning", "Monte Carlo", "Revenue Stack", "Market Applications",
  "Financing Structures", "Policy & Pipeline"
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

export default function SmrProjectFinancePage() {
  const [tab, setTab] = useState(0);
  const [designIdx, setDesignIdx] = useState(0);
  const [capexKw, setCapexKw]     = useState(6500);
  const [opex, setOpex]           = useState(28);
  const [fuel, setFuel]           = useState(9);
  const [wacc, setWacc]           = useState(9);
  const [cf, setCf]               = useState(93);
  const [nthUnit, setNthUnit]     = useState(1);
  const [powerPrice, setPowerPrice] = useState(90);
  const [debtPct, setDebtPct]     = useState(60);
  const [lifetime] = useState(60);

  const design = SMR_DESIGNS[designIdx];

  const lcoe = useMemo(() => calcSmrLcoe({ capexKw, opexFixed: opex, fuelCost: fuel, wacc, cf, lifetime, nthOfAKind: nthUnit }), [capexKw, opex, fuel, wacc, cf, nthUnit, lifetime]);

  const noakData = useMemo(() => {
    const d = SMR_DESIGNS[designIdx];
    return [1, 2, 5, 10, 20, 50, 100].map(n => ({
      unit: n,
      lcoe: calcSmrLcoe({ capexKw: d.capex_kw, opexFixed: d.opex, fuelCost: d.fuel, wacc: d.wacc, cf: d.cf, lifetime: d.lifetime, nthOfAKind: n }),
      capex: +(d.capex_kw * Math.pow(n, -0.12)).toFixed(0),
    }));
  }, [designIdx]);

  const cashflows = useMemo(() => {
    const capexTotal = capexKw * design.mw * 1000;
    const equityPct = (100 - debtPct) / 100;
    const equityCapex = -capexTotal * equityPct;
    const annualMwh = cf / 100 * 8760 * design.mw;
    const annRevenue = annualMwh * powerPrice;
    const annOpex = (opex * design.mw * 1000 + fuel * annualMwh);
    const annDebtService = capexTotal * debtPct / 100 * (wacc / 100 + 1 / 30);
    const net = annRevenue - annOpex - annDebtService;
    return [equityCapex, ...Array(Math.min(lifetime, 30)).fill(net)];
  }, [capexKw, opex, fuel, wacc, cf, lifetime, powerPrice, debtPct, design.mw]);

  const projectIrr = useMemo(() => (irr(cashflows) * 100).toFixed(1), [cashflows]);
  const projectNpv = useMemo(() => (npv(cashflows, wacc / 100) / 1e6).toFixed(1), [cashflows, wacc]);

  const monteCarloData = useMemo(() => {
    const results = Array.from({ length: 200 }, (_, i) => {
      const capexShock = 1 + (sr(i * 7) - 0.5) * 0.3;
      const priceShock = 1 + (sr(i * 11) - 0.5) * 0.4;
      const capexT = capexKw * design.mw * 1000 * capexShock;
      const eq = -capexT * (100 - debtPct) / 100;
      const annMwh = cf / 100 * 8760 * design.mw;
      const annRev = annMwh * powerPrice * priceShock;
      const annOpex = opex * design.mw * 1000 + fuel * annMwh;
      const debtSvc = capexT * debtPct / 100 * (wacc / 100 + 1 / 30);
      const net = annRev - annOpex - debtSvc;
      const cfs = [eq, ...Array(30).fill(net)];
      return irr(cfs) * 100;
    });
    const bins = Array.from({ length: 20 }, (_, i) => {
      const lo = -5 + i * 1.5;
      const hi = lo + 1.5;
      return { range: `${lo.toFixed(0)}–${hi.toFixed(0)}%`, count: results.filter(v => v >= lo && v < hi).length };
    });
    return { bins, results };
  }, [capexKw, opex, fuel, wacc, cf, powerPrice, debtPct, design.mw]);

  const radarData = useMemo(() => {
    const d = SMR_DESIGNS[designIdx];
    return [
      { axis: "Capital Efficiency", value: Math.min(100, 100 - (d.capex_kw - 3000) / 100) },
      { axis: "Technology Maturity", value: (d.trl / 9) * 100 },
      { axis: "Modularity", value: d.modules > 4 ? 90 : d.modules > 1 ? 70 : 50 },
      { axis: "Fuel Flexibility", value: d.fuel_type.includes("HALEU") ? 70 : 90 },
      { axis: "Capacity Factor", value: d.cf },
      { axis: "Deployment Speed", value: d.mw < 100 ? 85 : d.mw < 300 ? 75 : 60 },
    ];
  }, [designIdx]);

  const C = { gold: "#d4a843", teal: "#0d9488", green: "#27ae60", red: "#c0392b", amber: "#e67e22", purple: "#7c3aed" };

  return (
    <div style={{ background: T.bg, minHeight: "100vh", fontFamily: T.font, color: T.text, padding: "24px 32px" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
          EP-DU2 · Small Modular Reactor Finance & Investment
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>Small Modular Reactor (SMR) Finance & Investment</h1>
        <p style={{ color: T.textSec, marginTop: 6, fontSize: 14 }}>
          NOAK learning curves · Project finance model · Monte Carlo · Revenue stack · 6 SMR designs · IRR/NPV
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        <KpiCard label="SMR LCOE (FOAK)" value={`$${lcoe}`} unit="/MWh" sub={`${design.name.split(" ").slice(0, 2).join(" ")}`} />
        <KpiCard label="Project IRR (equity)" value={`${projectIrr}%`} unit="" sub={`At $${powerPrice}/MWh power price`} color={parseFloat(projectIrr) > 8 ? C.green : C.red} />
        <KpiCard label="NPV (equity)" value={`$${projectNpv}M`} unit="" sub={`${wacc}% discount rate`} color={parseFloat(projectNpv) > 0 ? C.teal : C.red} />
        <KpiCard label="NOAK Target (50th unit)" value={`$${(calcSmrLcoe({ capexKw, opexFixed: opex, fuelCost: fuel, wacc, cf, lifetime, nthOfAKind: 50 }))}`} unit="/MWh" sub="12% learning rate" color={C.gold} />
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
          <h3 style={{ color: T.gold, marginBottom: 16 }}>SMR Technology Landscape</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Design Size vs Capex ($/kW) — bubble = TRL</div>
              <ResponsiveContainer width="100%" height={280}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="mw" name="Plant Size (MWe)" stroke={T.textMut}
                    label={{ value: "Plant Size (MWe)", position: "insideBottom", offset: -5, fill: T.textMut, fontSize: 10 }} />
                  <YAxis dataKey="capex_kw" name="Capex ($/kW)" stroke={T.textMut}
                    label={{ value: "Capex $/kW", angle: -90, position: "insideLeft", fill: T.textMut, fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }}
                    content={({ payload }) => payload?.[0] ? (
                      <div style={{ background: T.surface, border: `1px solid ${T.border}`, padding: 8, borderRadius: 4, fontSize: 11 }}>
                        <strong style={{ color: T.gold }}>{payload[0].payload.name}</strong><br />
                        {payload[0].payload.mw} MWe · ${payload[0].payload.capex_kw.toLocaleString()}/kW · TRL {payload[0].payload.trl}
                      </div>
                    ) : null} />
                  <Scatter data={SMR_DESIGNS} fill={C.gold} fillOpacity={0.8} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>FOAK LCOE by Design ($/MWh)</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={SMR_DESIGNS.map(d => ({
                  name: d.name.split(" ").slice(0, 2).join(" "),
                  lcoe: calcSmrLcoe({ capexKw: d.capex_kw, opexFixed: d.opex, fuelCost: d.fuel, wacc: d.wacc, cf: d.cf, lifetime: d.lifetime, nthOfAKind: 1 }),
                  noak: calcSmrLcoe({ capexKw: d.capex_kw, opexFixed: d.opex, fuelCost: d.fuel, wacc: d.wacc, cf: d.cf, lifetime: d.lifetime, nthOfAKind: 50 }),
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" stroke={T.textMut} tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={50} />
                  <YAxis stroke={T.textMut} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  <Legend />
                  <Bar dataKey="lcoe" name="FOAK LCOE ($/MWh)" fill={C.amber} />
                  <Bar dataKey="noak" name="NOAK 50th ($/MWh)" fill={C.teal} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div>
          <h3 style={{ color: T.gold, marginBottom: 16 }}>SMR Design Comparison</h3>
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {SMR_DESIGNS.map((d, i) => (
              <button key={i} onClick={() => setDesignIdx(i)} style={{
                padding: "6px 12px", borderRadius: 6, border: `1px solid ${designIdx === i ? T.gold : T.border}`,
                background: designIdx === i ? T.navyL : T.surface, color: designIdx === i ? T.gold : T.textSec,
                cursor: "pointer", fontSize: 11,
              }}>{d.name.split(" ").slice(0, 2).join(" ")}</button>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>{design.name} — Specifications</div>
              {[
                ["Output (MWe)", `${design.mw} MW`], ["Capex ($/kW)", `$${design.capex_kw.toLocaleString()}`],
                ["Fixed O&M", `$${design.opex}/kW/yr`], ["Fuel Cost", `$${design.fuel}/MWh`],
                ["Capacity Factor", `${design.cf}%`], ["Lifetime", `${design.lifetime} yr`],
                ["WACC Ref.", `${design.wacc}%`], ["Modules per station", design.modules],
                ["Coolant", design.coolant], ["Fuel Type", design.fuel_type],
                ["Country/Developer", design.country], ["Status", design.status],
                ["TRL", `${design.trl}/9`],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
                  <span style={{ fontSize: 12, color: T.textSec }}>{k}</span>
                  <span style={{ fontSize: 12, fontFamily: T.mono, color: T.gold }}>{v}</span>
                </div>
              ))}
              <div style={{ marginTop: 10, fontSize: 11, color: T.textMut }}>{design.notes}</div>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Performance Radar — {design.name.split(" ").slice(0, 2).join(" ")}</div>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
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
          <h3 style={{ color: T.gold, marginBottom: 16 }}>Project Finance Model — {design.name.split(" ").slice(0, 2).join(" ")}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <Slider label="Capex ($/kW)" value={capexKw} min={2000} max={16000} step={200} onChange={setCapexKw} unit="" />
              <Slider label="Fixed O&M ($/kW/yr)" value={opex} min={10} max={60} step={2} onChange={setOpex} unit="" />
              <Slider label="Fuel Cost ($/MWh)" value={fuel} min={3} max={20} step={0.5} onChange={setFuel} unit="" fmt={v => v.toFixed(1)} />
              <Slider label="WACC (%)" value={wacc} min={4} max={15} step={0.5} onChange={setWacc} unit="%" fmt={v => v.toFixed(1)} />
              <Slider label="Capacity Factor (%)" value={cf} min={75} max={97} step={1} onChange={setCf} unit="%" />
              <Slider label="Power Price ($/MWh)" value={powerPrice} min={40} max={200} step={5} onChange={setPowerPrice} unit="" />
              <Slider label="Debt Share (%)" value={debtPct} min={30} max={80} step={5} onChange={setDebtPct} unit="%" />
              <Slider label="Nth-of-a-kind unit" value={nthUnit} min={1} max={100} step={1} onChange={setNthUnit} unit="" />
              <div style={{ marginTop: 12, padding: 12, background: T.surfaceH, borderRadius: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: T.textMut }}>Equity IRR</span>
                  <span style={{ fontSize: 18, color: parseFloat(projectIrr) > 8 ? T.green : T.red, fontFamily: T.mono, fontWeight: 700 }}>{projectIrr}%</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, color: T.textMut }}>NPV</span>
                  <span style={{ fontSize: 18, color: parseFloat(projectNpv) > 0 ? T.green : T.red, fontFamily: T.mono, fontWeight: 700 }}>${projectNpv}M</span>
                </div>
              </div>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Cumulative Cash Flow ($M) — 30-Year View</div>
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={cashflows.map((cf_val, i) => ({
                  year: i, cumulative: +(cashflows.slice(0, i + 1).reduce((s, v) => s + v, 0) / 1e6).toFixed(1)
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" stroke={T.textMut} label={{ value: "Year", position: "insideBottom", offset: -5, fill: T.textMut, fontSize: 10 }} />
                  <YAxis stroke={T.textMut} tickFormatter={v => `$${v}M`} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} formatter={v => [`$${v}M`]} />
                  <ReferenceLine y={0} stroke={T.text} strokeDasharray="3 3" />
                  <Area dataKey="cumulative" name="Cumulative Equity ($M)" fill={C.gold} fillOpacity={0.2} stroke={C.gold} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 3 && (
        <div>
          <h3 style={{ color: T.gold, marginBottom: 16 }}>LCOE vs Plant Scale — Economies of Scale Analysis</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>LCOE vs Plant Size (MWe) — Diseconomies of Scale for Large Plants</div>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={[50, 100, 200, 300, 470, 600, 900, 1200, 1600].map((mw, i) => {
                  const capexScale = mw < 200 ? 8000 - mw * 5 : mw < 600 ? 7000 - mw * 2 : 6500 + (mw - 600) * 1;
                  const lcoeVal = calcSmrLcoe({ capexKw: capexScale, opexFixed: 22, fuelCost: 9, wacc: 8, cf: 92, lifetime: 60, nthOfAKind: 10 });
                  return { mw, lcoe: lcoeVal, capex: capexScale };
                })}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="mw" stroke={T.textMut} label={{ value: "Plant Size (MWe)", position: "insideBottom", offset: -5, fill: T.textMut, fontSize: 10 }} />
                  <YAxis yAxisId="lcoe" stroke={T.textMut} />
                  <YAxis yAxisId="capex" orientation="right" stroke={T.textMut} tickFormatter={v => `$${v / 1000}k`} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  <Legend />
                  <Line yAxisId="lcoe" dataKey="lcoe" name="LCOE ($/MWh)" stroke={C.gold} dot={false} strokeWidth={2} />
                  <Line yAxisId="capex" dataKey="capex" name="Capex ($/kW)" stroke={C.teal} dot={false} strokeWidth={2} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>SMR vs Large Reactor — Value Drivers (NOAK)</div>
              {[
                { factor: "Factory manufacturing", smr: 85, large: 10, note: "Factory pre-fabrication reduces on-site construction" },
                { factor: "Modular scalability", smr: 90, large: 15, note: "Add modules as demand grows" },
                { factor: "Construction risk", smr: 70, large: 30, note: "Shorter construction; parallel assembly" },
                { factor: "Site flexibility", smr: 80, large: 25, note: "Brownfield, industrial parks, remote sites" },
                { factor: "Heat applications", smr: 75, large: 20, note: "High-temp heat for hydrogen, chemicals" },
                { factor: "Financing scalability", smr: 80, large: 20, note: "Lower absolute capex per unit reduces equity exposure" },
              ].map((r, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 11, color: T.text }}>{r.factor}</span>
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ fontSize: 10, color: T.textMut, width: 30 }}>SMR</span>
                    <div style={{ flex: 1, background: T.surfaceH, borderRadius: 3, height: 6 }}>
                      <div style={{ background: C.teal, height: "100%", borderRadius: 3, width: `${r.smr}%` }} />
                    </div>
                    <span style={{ fontSize: 10, color: T.teal, width: 28, fontFamily: T.mono }}>{r.smr}%</span>
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 2 }}>
                    <span style={{ fontSize: 10, color: T.textMut, width: 30 }}>Large</span>
                    <div style={{ flex: 1, background: T.surfaceH, borderRadius: 3, height: 6 }}>
                      <div style={{ background: C.amber, height: "100%", borderRadius: 3, width: `${r.large}%` }} />
                    </div>
                    <span style={{ fontSize: 10, color: T.amber, width: 28, fontFamily: T.mono }}>{r.large}%</span>
                  </div>
                  <div style={{ fontSize: 9, color: T.textMut, marginTop: 2 }}>{r.note}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 4 && (
        <div>
          <h3 style={{ color: T.gold, marginBottom: 16 }}>NOAK Learning Curve — {design.name.split(" ").slice(0, 2).join(" ")}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>LCOE & Capex vs Cumulative Units Built</div>
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={noakData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="unit" stroke={T.textMut} label={{ value: "Cumulative Units", position: "insideBottom", offset: -5, fill: T.textMut, fontSize: 10 }} />
                  <YAxis yAxisId="lcoe" stroke={T.textMut} label={{ value: "LCOE $/MWh", angle: -90, position: "insideLeft", fill: T.textMut, fontSize: 10 }} />
                  <YAxis yAxisId="capex" orientation="right" stroke={T.textMut} tickFormatter={v => `$${v / 1000}k`} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  <Legend />
                  <Area yAxisId="lcoe" dataKey="lcoe" name="LCOE ($/MWh)" fill={C.gold} fillOpacity={0.15} stroke={C.gold} />
                  <Line yAxisId="capex" dataKey="capex" name="Capex ($/kW)" stroke={C.teal} dot={false} strokeWidth={2} strokeDasharray="5 5" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>NOAK Milestone Targets by Design</div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                    {["Design", "FOAK", "10th Unit", "50th Unit"].map(h => (
                      <th key={h} style={{ padding: "6px 8px", color: T.textMut, textAlign: "left" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SMR_DESIGNS.map((d, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.surfaceH : "transparent" }}>
                      <td style={{ padding: "6px 8px", color: T.gold }}>{d.name.split(" ").slice(0, 2).join(" ")}</td>
                      <td style={{ padding: "6px 8px", fontFamily: T.mono }}>${calcSmrLcoe({ capexKw: d.capex_kw, opexFixed: d.opex, fuelCost: d.fuel, wacc: d.wacc, cf: d.cf, lifetime: d.lifetime, nthOfAKind: 1 })}</td>
                      <td style={{ padding: "6px 8px", fontFamily: T.mono, color: T.teal }}>${calcSmrLcoe({ capexKw: d.capex_kw, opexFixed: d.opex, fuelCost: d.fuel, wacc: d.wacc, cf: d.cf, lifetime: d.lifetime, nthOfAKind: 10 })}</td>
                      <td style={{ padding: "6px 8px", fontFamily: T.mono, color: T.green }}>${calcSmrLcoe({ capexKw: d.capex_kw, opexFixed: d.opex, fuelCost: d.fuel, wacc: d.wacc, cf: d.cf, lifetime: d.lifetime, nthOfAKind: 50 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 5 && (
        <div>
          <h3 style={{ color: T.gold, marginBottom: 16 }}>Monte Carlo — IRR Distribution (200 scenarios)</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>IRR Distribution (Capex ±30%, Revenue ±40%)</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monteCarloData.bins}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="range" stroke={T.textMut} tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={50} />
                  <YAxis stroke={T.textMut} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  <ReferenceLine x="7–9%" stroke={T.green} strokeDasharray="3 3" label={{ value: "Hurdle", fill: T.green, fontSize: 9 }} />
                  <Bar dataKey="count" name="Scenarios" fill={C.teal} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Monte Carlo Statistics</div>
              {(() => {
                const rs = [...monteCarloData.results].sort((a, b) => a - b);
                const n = rs.length;
                const mean = rs.reduce((s, v) => s + v, 0) / n;
                const p10 = rs[Math.floor(n * 0.1)];
                const p50 = rs[Math.floor(n * 0.5)];
                const p90 = rs[Math.floor(n * 0.9)];
                const aboveHurdle = rs.filter(v => v >= 8).length;
                return (
                  <div>
                    {[
                      ["Mean IRR", `${mean.toFixed(1)}%`, mean > 8 ? T.green : T.red],
                      ["P10 (downside)", `${p10.toFixed(1)}%`, p10 > 0 ? T.amber : T.red],
                      ["P50 (median)", `${p50.toFixed(1)}%`, p50 > 8 ? T.green : T.amber],
                      ["P90 (upside)", `${p90.toFixed(1)}%`, T.green],
                      ["Prob. >8% hurdle", `${(aboveHurdle / n * 100).toFixed(0)}%`, aboveHurdle / n > 0.5 ? T.green : T.red],
                    ].map(([k, v, col]) => (
                      <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${T.border}` }}>
                        <span style={{ fontSize: 13, color: T.textSec }}>{k}</span>
                        <span style={{ fontSize: 18, fontFamily: T.mono, color: col, fontWeight: 700 }}>{v}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {tab === 6 && (
        <div>
          <h3 style={{ color: T.gold, marginBottom: 16 }}>SMR Revenue Stack — Multiple Value Streams</h3>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Annual Revenue per MWe by Stream ($/kW/yr)</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={[
                { stream: "Baseload Power", rev: powerPrice * cf / 100 * 8760 / 1000, type: "Core" },
                { stream: "Capacity Market", rev: 45, type: "Ancillary" },
                { stream: "Process Heat (700°C)", rev: 30, type: "Industrial" },
                { stream: "Hydrogen Production", rev: 20, type: "Industrial" },
                { stream: "Desalination", rev: 15, type: "Industrial" },
                { stream: "District Heating", rev: 12, type: "Industrial" },
                { stream: "Carbon Credits (IRA)", rev: 8, type: "Policy" },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="stream" stroke={T.textMut} tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={60} />
                <YAxis stroke={T.textMut} tickFormatter={v => `$${v}`} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} formatter={v => [`$${v.toFixed(0)}/kW/yr`]} />
                <Bar dataKey="rev" name="Revenue ($/kW/yr)" fill={C.gold}
                  label={{ position: "top", fontSize: 9, fill: T.textSec, formatter: v => `$${v.toFixed(0)}` }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 7 && (
        <div>
          <h3 style={{ color: T.gold, marginBottom: 16 }}>SMR Market Applications</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {[
              { app: "Industrial Decarbonisation", size: "100–500 MWt", market: "Steel, cement, chemicals, mining", rev: "$60–120/MWh equiv.", designs: "HTR, PWR-SMR, HTGR", potential_gw: 180 },
              { app: "Hydrogen Production (HTE)", size: "200–1000 MWt", market: "Green/pink H₂ for transport/industry", rev: "$1.5–3.5/kg H₂", designs: "HTGR, SFR, MSR", potential_gw: 120 },
              { app: "Remote Mining & Industry", size: "5–50 MWe", market: "Off-grid mine sites, oil sands, Arctic", rev: "$180–450/MWh", designs: "eVinci, BWRX-300", potential_gw: 15 },
              { app: "Grid Firming (Flexible Ops)", size: "100–600 MWe", market: "RE integration, peaking complement", rev: "$80–150/MWh", designs: "NuScale, BWRX-300, RR-SMR", potential_gw: 250 },
              { app: "Desalination (MENA/Pacific)", size: "100–300 MWt", market: "Municipal water security", rev: "$0.4–0.8/m³", designs: "VVER-300, ACP100", potential_gw: 40 },
              { app: "Data Centre Colocation", size: "300–1200 MWe", market: "AI/cloud hyperscalers (MS, Amazon)", rev: "$90–130/MWh, +PPA", designs: "BWRX-300, RR-SMR", potential_gw: 80 },
            ].map((a, i) => (
              <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: T.gold, fontWeight: 700 }}>{a.app}</span>
                  <span style={{ fontSize: 11, color: T.teal, fontFamily: T.mono }}>{a.potential_gw} GW potential</span>
                </div>
                <div style={{ fontSize: 11, color: T.amber, marginBottom: 4 }}>{a.size} · {a.designs}</div>
                <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>{a.market}</div>
                <div style={{ fontSize: 12, color: T.green, fontFamily: T.mono }}>{a.rev}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 8 && (
        <div>
          <h3 style={{ color: T.gold, marginBottom: 16 }}>SMR Financing Structures</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Capital Stack — BWRX-300 Reference Project</div>
              {[
                { layer: "Senior Project Finance Debt", pct: 60, rate: "SOFR+250", tenor: "25yr", note: "ECA/DFI backed" },
                { layer: "Green Bonds (CBI certified)", pct: 15, rate: "4.9% fixed", tenor: "20yr", note: "EU taxonomy compliant" },
                { layer: "Government Loan Guarantee", pct: 10, rate: "T+30bps", tenor: "30yr", note: "DOE / UK UKIB" },
                { layer: "Mezzanine / Sub Debt", pct: 8, rate: "7–9%", tenor: "15yr", note: "Infrastructure fund" },
                { layer: "Sponsor Equity", pct: 7, rate: "Target 12% IRR", tenor: "Plant life", note: "Utility / PE / Govt" },
              ].map((l, i) => (
                <div key={i} style={{ padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, color: T.text }}>{l.layer}</span>
                    <span style={{ fontSize: 13, color: T.gold, fontFamily: T.mono }}>{l.pct}%</span>
                  </div>
                  <div style={{ fontSize: 10, color: T.textMut }}>{l.rate} · {l.tenor} · {l.note}</div>
                </div>
              ))}
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Risk Allocation Matrix</div>
              {[
                ["Construction cost overrun", "EPC wrap (fixed-price lump sum)", "Contractor + sponsor"],
                ["Construction delay", "Delay LDs / liquidated damages", "EPC contractor"],
                ["Fuel price risk", "Long-term fuel supply agreement", "Utility + hedging"],
                ["Power price risk", "CfD / RAB / long-term PPA", "Government / offtaker"],
                ["Regulatory risk", "Government development partner", "Shared sovereign"],
                ["Operating performance", "Warranty + performance bond", "OEM (Westinghouse, GEH)"],
                ["Waste & decommissioning", "Decommissioning fund (segregated)", "Project + regulator"],
              ].map(([risk, mitigant, party]) => (
                <div key={risk} style={{ padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 11, color: T.text, fontWeight: 600 }}>{risk}</div>
                  <div style={{ fontSize: 10, color: T.green, marginTop: 2 }}>↳ {mitigant}</div>
                  <div style={{ fontSize: 10, color: T.textMut }}>Held by: {party}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 9 && (
        <div>
          <h3 style={{ color: T.gold, marginBottom: 16 }}>SMR Policy Pipeline & Market Outlook</h3>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Global SMR Projects & Policy Pipeline</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                    {["Project", "Country", "Design", "MWe", "Status", "Policy Support", "Target COD"].map(h => (
                      <th key={h} style={{ padding: "7px 10px", color: T.textMut, textAlign: "left" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["OPG Darlington SMR", "Canada", "BWRX-300", 300, "Site preparation 2025", "CSNC license + Ontario govt", "2034"],
                    ["GE-Hitachi BWRX-300 (Poland)", "Poland", "BWRX-300", 300, "ORLEN MoU signed", "EU CF + EIB lending", "2035"],
                    ["Rolls-Royce SMR (Czech)", "Czech Republic", "RR SMR 470", 470, "NNSA pre-selection 2024", "CEF + EIB", "2036"],
                    ["Holtec SMR-300 (New Jersey)", "USA", "SMR-300", 300, "NRC pre-app review", "DOE ARDP + §45J PTC", "2033"],
                    ["NuScale CFPP (Romania)", "Romania", "NuScale 77", 462, "IGCN $3Bn LOI signed", "US DFC + §45J", "2031"],
                    ["X-Energy Dow Freeport", "USA", "Xe-100×4", 320, "NRC license under review", "IRA §45J + DOE", "2030"],
                    ["Korea APR-SMR", "South Korea", "APR-SMR 170", 170, "KHNP design review", "K-Bank + export credit", "2035"],
                    ["CAREM-25 (INVAP)", "Argentina", "CAREM-25", 25, "Construction ongoing", "CNEA sovereign funding", "2026"],
                  ].map(([proj, country, design, mw, status, policy, cod], i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.surfaceH : "transparent" }}>
                      <td style={{ padding: "6px 10px", color: T.gold }}>{proj}</td>
                      <td style={{ padding: "6px 10px", color: T.textSec }}>{country}</td>
                      <td style={{ padding: "6px 10px" }}>{design}</td>
                      <td style={{ padding: "6px 10px", fontFamily: T.mono }}>{mw}</td>
                      <td style={{ padding: "6px 10px", color: T.amber, fontSize: 10 }}>{status}</td>
                      <td style={{ padding: "6px 10px", color: T.textMut, fontSize: 10 }}>{policy}</td>
                      <td style={{ padding: "6px 10px", fontFamily: T.mono, color: T.green }}>{cod}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
