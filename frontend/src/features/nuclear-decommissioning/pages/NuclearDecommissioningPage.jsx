import React, { useState, useMemo } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";

const T = {
  bg: "#0f1117", surface: "#1a1d27", surfaceH: "#22263a", border: "#2a2d3e", borderL: "#353852",
  navy: "#1e3a5f", navyL: "#2a4f7c", gold: "#c9a84c", goldL: "#e0c068", sage: "#4a7c59", sageL: "#5a9c6e",
  teal: "#2a6b7c", text: "#e8e6df", textSec: "#9e9b93", textMut: "#6b6860", red: "#dc2626",
  green: "#16a34a", amber: "#d97706", font: "DM Sans, sans-serif", mono: "JetBrains Mono, monospace"
};

const sr = s => { const x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const TABS = [
  "Global Fleet Status","D&D Strategies","Cost Modelling","Fund Adequacy",
  "UK & NDA Program","US DOE Program","Waste Management","Site Clearance",
  "SMR Decommissioning","Investment & Financing"
];

const GLOBAL_PLANTS = [
  { country:"USA",    operable:93, shutdown:34, decom_started:20, decom_complete:14, totalGW:95.5, fundBnUSD:60 },
  { country:"France", operable:56, shutdown:14, decom_started:12, decom_complete:3,  totalGW:61.4, fundBnUSD:23 },
  { country:"UK",     operable:9,  shutdown:30, decom_started:28, decom_complete:3,  totalGW:6.5,  fundBnUSD:132 },
  { country:"Germany",operable:0,  shutdown:33, decom_started:22, decom_complete:8,  totalGW:0,    fundBnUSD:40 },
  { country:"Japan",  operable:12, shutdown:27, decom_started:15, decom_complete:1,  totalGW:11.3, fundBnUSD:20 },
  { country:"Russia", operable:37, shutdown:13, decom_started:8,  decom_complete:2,  totalGW:28.4, fundBnUSD:15 },
  { country:"S.Korea",operable:26, shutdown:2,  decom_started:2,  decom_complete:0,  totalGW:25.8, fundBnUSD:8  },
  { country:"Canada", operable:19, shutdown:10, decom_started:6,  decom_complete:1,  totalGW:13.6, fundBnUSD:12 },
];

const DD_STRATEGIES = [
  { strategy:"DECON (Immediate)", abbr:"DECON", duration:"10–20 yr", costMult:1.0,   wasteVol:"High early", risk:"Worker dose", bestFor:"Small/BWR" },
  { strategy:"SAFSTOR (Deferred)",abbr:"SAFSTOR",duration:"40–80 yr", costMult:0.85,  wasteVol:"Lower total",risk:"Fund erosion", bestFor:"Large LWR" },
  { strategy:"ENTOMB",           abbr:"ENTOMB", duration:"100+ yr",  costMult:0.5,   wasteVol:"None",       risk:"Long monitoring", bestFor:"Highly activated" },
  { strategy:"Hybrid D+S",       abbr:"HYBRID", duration:"20–40 yr", costMult:0.92,  wasteVol:"Moderate",   risk:"Scheduling",  bestFor:"Multi-unit sites" },
];

const COST_DRIVERS = [
  { driver:"Site Preparation & Security",   pct:8  },
  { driver:"Reactor Disassembly",           pct:25 },
  { driver:"Radioactive Waste Processing",  pct:20 },
  { driver:"Waste Packaging & Transport",   pct:15 },
  { driver:"Disposal Fees",                 pct:12 },
  { driver:"Site Characterization",         pct:5  },
  { driver:"D&D Contractor Labour",         pct:10 },
  { driver:"Regulatory & Licensing",        pct:5  },
];

const NDA_SITES = [
  { site:"Sellafield",       type:"Reprocessing + Magnox", est_cost_bn:121, status:"Ongoing", completion:2120, country:"UK" },
  { site:"Magnox (8 sites)", type:"Gas-cooled reactor",    est_cost_bn:6.3, status:"Active D&D", completion:2055, country:"UK" },
  { site:"Dounreay",         type:"Fast reactor (FBR)",    est_cost_bn:4.3, status:"Phased D&D", completion:2036, country:"UK" },
  { site:"UKAEA/Harwell",    type:"Research reactor",      est_cost_bn:1.2, status:"Advanced", completion:2028, country:"UK" },
  { site:"Berkeley/Oldbury", type:"Magnox AGR",            est_cost_bn:2.1, status:"SAFSTOR", completion:2060, country:"UK" },
];

const US_DOE_SITES = [
  { site:"Hanford WA",    type:"Pu production reactors", cost_bn:379, status:"Ongoing", endYr:2077, volume:"55M gal HLW" },
  { site:"Savannah River", type:"Pu/Tritium production", cost_bn:95,  status:"Active",  endYr:2065, volume:"35M gal HLW" },
  { site:"Idaho NL",      type:"Research + EBR-I/II",    cost_bn:19,  status:"Active",  endYr:2045, volume:"900k gal HLW" },
  { site:"Fernald OH",    type:"UO2 production",          cost_bn:4.4, status:"Complete",endYr:2006, volume:"Cleaned" },
  { site:"Portsmouth OH", type:"Enrichment UF6",          cost_bn:8.7, status:"Ongoing",endYr:2040, volume:"Cylinder yard" },
];

const WASTE_STREAMS = [
  { type:"High-Level (HLW/SNF)", vol_m3: 3200, activity_PBq: 12000, disposal:"Deep geological repository" },
  { type:"Intermediate (ILW)",   vol_m3: 80000,activity_PBq: 100,   disposal:"Near-surface/intermediate vault" },
  { type:"Low-Level (LLW)",      vol_m3:500000,activity_PBq: 1,     disposal:"Near-surface (3m trench)" },
  { type:"Very Low-Level (VLLW)",vol_m3:2000000,activity_PBq:0.001, disposal:"Landfill (conditioned)" },
];

function calcDecommCost({ reactorMw, reactorType, strategy, yearsDeferred, wacc }) {
  const baseCost = reactorType === "LWR" ? reactorMw * 600 :
    reactorType === "GCR" ? reactorMw * 800 :
    reactorType === "CANDU" ? reactorMw * 650 : reactorMw * 700;
  const stratMult = strategy === "DECON" ? 1.0 : strategy === "SAFSTOR" ? 0.85 : strategy === "ENTOMB" ? 0.5 : 0.92;
  const deferredPV = baseCost * stratMult / Math.pow(1 + wacc / 100, yearsDeferred);
  const nominalCost = baseCost * stratMult;
  return { nominalCost: +(nominalCost / 1e6).toFixed(1), pvCost: +(deferredPV / 1e6).toFixed(1), perMw: +(nominalCost / reactorMw / 1e3).toFixed(2) };
}

function calcFundAdequacy({ plantMw, cf, annualFund, wacc, yearsToDecom, estimatedDecom }) {
  const w = wacc / 100;
  const fv = annualFund * ((Math.pow(1 + w, yearsToDecom) - 1) / w);
  const pvDecom = estimatedDecom / Math.pow(1 + w, yearsToDecom);
  return { fundAtDecom: +(fv / 1e6).toFixed(1), pvDecom: +(pvDecom / 1e6).toFixed(1), gap: +((fv - estimatedDecom) / 1e6).toFixed(1), funded: +(fv / estimatedDecom * 100).toFixed(0) };
}

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

export default function NuclearDecommissioningPage() {
  const [tab, setTab] = useState(0);
  const [reactorMw, setReactorMw] = useState(1000);
  const [reactorType, setReactorType] = useState("LWR");
  const [strategy, setStrategy] = useState("DECON");
  const [yearsDeferred, setYearsDeferred] = useState(0);
  const [wacc, setWacc] = useState(5);
  const [annualFund, setAnnualFund] = useState(15);
  const [yearsToDecom, setYearsToDecom] = useState(20);

  const COLORS = [T.gold, T.teal, T.sage, T.navyL, T.amber, T.goldL, T.red, T.green];

  const decommResult = useMemo(() => calcDecommCost({ reactorMw, reactorType, strategy, yearsDeferred, wacc }), [reactorMw, reactorType, strategy, yearsDeferred, wacc]);
  const fundResult = useMemo(() => calcFundAdequacy({ plantMw: reactorMw, cf: 90, annualFund: annualFund * 1e6, wacc, yearsToDecom, estimatedDecom: decommResult.nominalCost * 1e6 }), [reactorMw, annualFund, wacc, yearsToDecom, decommResult]);

  const costDriverPie = COST_DRIVERS.map((d, i) => ({ ...d, fill: COLORS[i] }));

  const fundBuildupData = useMemo(() => Array.from({ length: yearsToDecom }, (_, i) => {
    const w = wacc / 100;
    const fv = annualFund * 1e6 * ((Math.pow(1 + w, i + 1) - 1) / w);
    return { year: `Yr${i + 1}`, fund: +(fv / 1e6).toFixed(1), target: +(decommResult.nominalCost * (i + 1) / yearsToDecom).toFixed(1) };
  }), [annualFund, wacc, yearsToDecom, decommResult]);

  const globalFundData = GLOBAL_PLANTS.map(p => ({
    country: p.country,
    fund: p.fundBnUSD,
    needed: +(p.totalGW * 0.6 + p.shutdown * 0.3).toFixed(0),
  }));

  const safstor = useMemo(() => Array.from({ length: 60 }, (_, i) => ({
    year: i,
    dose: +(1000 * Math.exp(-0.04 * i)).toFixed(1),
    cost: +(decommResult.nominalCost * 0.85 / Math.pow(1 + wacc / 100, i)).toFixed(1),
  })), [decommResult, wacc]);

  const smrDecomm = [
    { design:"NuScale VOYGR", mw:77, decom:85, strategy:"DECON fast (factory return)", time:5, novel:"Modular removal" },
    { design:"GEH BWRX-300",  mw:300,decom:180,strategy:"DECON 15yr",                   time:15,novel:"Simplified BWR" },
    { design:"Terrestrial MSR",mw:195,decom:250,strategy:"Deferred — fluid decontam",   time:25,novel:"Salt processing" },
    { design:"eVinci micro",   mw:0.2,decom:2,  strategy:"Factory return (whole unit)", time:1, novel:"Transport + recycle" },
    { design:"TerraPower SFR", mw:345,decom:220,strategy:"Na coolant drain + SAFSTOR",  time:20,novel:"Na handling" },
  ];

  const tabContent = () => {
    switch (tab) {
      case 0: return (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
            <KpiCard label="Reactors Shutdown Globally" value="212" sub="Permanent shutdown (2024)" />
            <KpiCard label="Decommissioning Complete" value="32" sub="Full site clearance achieved" color={T.green} />
            <KpiCard label="Global Decomm Backlog" value="$1.4T" sub="IAEA estimated total cost" color={T.amber} />
            <KpiCard label="Active D&D Projects" value="100+" sub="Across 20+ countries" color={T.teal} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Reactor Status by Country (2024)</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={GLOBAL_PLANTS}>
                  <XAxis dataKey="country" tick={{ fill: T.textMut, fontSize: 10 }} />
                  <YAxis tick={{ fill: T.textMut, fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, color: T.text }} />
                  <Bar dataKey="operable"      fill={T.green}  name="Operable"     stackId="a" />
                  <Bar dataKey="decom_started" fill={T.amber}  name="D&D Active"   stackId="a" />
                  <Bar dataKey="shutdown"      fill={T.teal}   name="Shut (await)" stackId="a" />
                  <Bar dataKey="decom_complete" fill={T.sage}  name="Complete"     stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Decommissioning Fund Adequacy ($B — Actual vs Needed)</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={globalFundData}>
                  <XAxis dataKey="country" tick={{ fill: T.textMut, fontSize: 10 }} />
                  <YAxis tick={{ fill: T.textMut, fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, color: T.text }} />
                  <Bar dataKey="fund"   fill={T.teal} name="Fund Actual ($B)" radius={[3,3,0,0]} />
                  <Bar dataKey="needed" fill={T.gold} name="Est. Needed ($B)" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
            <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {["Country","Operable","Shutdown","D&D Active","D&D Complete","Capacity (GWe)","Fund ($B)"].map(h => (
                    <th key={h} style={{ padding: "8px 10px", color: T.textSec, textAlign: "left", fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {GLOBAL_PLANTS.map((p, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: "8px 10px", color: T.text, fontWeight: 600 }}>{p.country}</td>
                    <td style={{ padding: "8px 10px", color: T.green, fontFamily: T.mono }}>{p.operable}</td>
                    <td style={{ padding: "8px 10px", color: T.amber, fontFamily: T.mono }}>{p.shutdown}</td>
                    <td style={{ padding: "8px 10px", color: T.teal, fontFamily: T.mono }}>{p.decom_started}</td>
                    <td style={{ padding: "8px 10px", color: T.sage, fontFamily: T.mono }}>{p.decom_complete}</td>
                    <td style={{ padding: "8px 10px", color: T.text, fontFamily: T.mono }}>{p.totalGW}</td>
                    <td style={{ padding: "8px 10px", color: T.gold, fontFamily: T.mono }}>${p.fundBnUSD}B</td>
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
            <KpiCard label="DECON Duration" value="10–20 yr" sub="Immediate dismantlement" />
            <KpiCard label="SAFSTOR Duration" value="40–80 yr" sub="Deferral then DECON" color={T.teal} />
            <KpiCard label="ENTOMB Applicability" value="Rare" sub="Chernobyl / unique cases" color={T.amber} />
            <KpiCard label="Strategy Cost Range" value="$300–1,500/kW" sub="By reactor type" color={T.sage} />
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16, marginBottom: 20 }}>
            <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {["Strategy","Duration","Cost Multiplier","Waste Volume","Key Risk","Best For"].map(h => (
                    <th key={h} style={{ padding: "8px 10px", color: T.textSec, textAlign: "left", fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DD_STRATEGIES.map((s, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: "8px 10px", color: T.gold, fontWeight: 600 }}>{s.strategy}</td>
                    <td style={{ padding: "8px 10px", color: T.teal, fontFamily: T.mono }}>{s.duration}</td>
                    <td style={{ padding: "8px 10px", color: T.text, fontFamily: T.mono }}>{s.costMult}×</td>
                    <td style={{ padding: "8px 10px", color: T.textSec }}>{s.wasteVol}</td>
                    <td style={{ padding: "8px 10px", color: T.red }}>{s.risk}</td>
                    <td style={{ padding: "8px 10px", color: T.sage }}>{s.bestFor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>SAFSTOR: Dose Rate Decay Over Deferral Period (mSv/hr)</div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={safstor.filter((_, i) => i % 3 === 0)}>
                  <XAxis dataKey="year" tick={{ fill: T.textMut, fontSize: 10 }} label={{ value: "Years Deferred", fill: T.textMut, fontSize: 10, position: "insideBottom" }} />
                  <YAxis tick={{ fill: T.textMut, fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, color: T.text }} />
                  <Area type="monotone" dataKey="dose" stroke={T.gold} fill={T.gold} fillOpacity={0.2} name="Dose Rate (mSv/hr)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>SAFSTOR: Present Value of Decom Cost (Discount Rate = {wacc}%)</div>
              <Slider label="Discount Rate (WACC %)" min={2} max={10} step={0.5} value={wacc} onChange={setWacc} fmt={v => `${v}%`} />
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={safstor.filter((_, i) => i % 3 === 0)}>
                  <XAxis dataKey="year" tick={{ fill: T.textMut, fontSize: 10 }} />
                  <YAxis tick={{ fill: T.textMut, fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, color: T.text }} />
                  <Area type="monotone" dataKey="cost" stroke={T.teal} fill={T.teal} fillOpacity={0.2} name="PV Cost ($M)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      );
      case 2: return (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
              <div style={{ fontSize: 13, color: T.gold, marginBottom: 16 }}>Decommissioning Cost Calculator</div>
              <Slider label="Reactor Capacity (MWe)" min={100} max={1700} step={50} value={reactorMw} onChange={setReactorMw} fmt={v => `${v} MWe`} />
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: T.textSec, marginBottom: 6 }}>Reactor Type</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {["LWR","GCR","CANDU","SFR"].map(rt => (
                    <button key={rt} onClick={() => setReactorType(rt)} style={{
                      padding: "5px 12px", fontSize: 11, cursor: "pointer", borderRadius: 3,
                      background: reactorType === rt ? T.gold : T.surfaceH, color: reactorType === rt ? T.bg : T.textSec,
                      border: `1px solid ${reactorType === rt ? T.gold : T.border}`, fontFamily: T.mono,
                    }}>{rt}</button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: T.textSec, marginBottom: 6 }}>D&D Strategy</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {["DECON","SAFSTOR","ENTOMB","HYBRID"].map(s => (
                    <button key={s} onClick={() => setStrategy(s)} style={{
                      padding: "5px 12px", fontSize: 11, cursor: "pointer", borderRadius: 3,
                      background: strategy === s ? T.teal : T.surfaceH, color: strategy === s ? "#fff" : T.textSec,
                      border: `1px solid ${strategy === s ? T.teal : T.border}`, fontFamily: T.mono,
                    }}>{s}</button>
                  ))}
                </div>
              </div>
              <Slider label="Deferral Period (years)" min={0} max={80} step={5} value={yearsDeferred} onChange={setYearsDeferred} fmt={v => `${v} yr`} />
              <Slider label="WACC / Discount Rate (%)" min={2} max={10} step={0.5} value={wacc} onChange={setWacc} fmt={v => `${v}%`} />
              <div style={{ background: T.surfaceH, borderRadius: 6, padding: 14, marginTop: 8 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div><div style={{ fontSize: 10, color: T.textMut }}>Nominal Decom Cost</div><div style={{ color: T.gold, fontFamily: T.mono, fontSize: 18, fontWeight: 700 }}>${decommResult.nominalCost}M</div></div>
                  <div><div style={{ fontSize: 10, color: T.textMut }}>PV Cost (deferred)</div><div style={{ color: T.teal, fontFamily: T.mono, fontSize: 18, fontWeight: 700 }}>${decommResult.pvCost}M</div></div>
                  <div><div style={{ fontSize: 10, color: T.textMut }}>Cost per MWe</div><div style={{ color: T.sage, fontFamily: T.mono, fontSize: 18, fontWeight: 700 }}>${decommResult.perMw}M/MWe</div></div>
                  <div><div style={{ fontSize: 10, color: T.textMut }}>Strategy</div><div style={{ color: T.amber, fontFamily: T.mono, fontSize: 14, fontWeight: 700 }}>{strategy}</div></div>
                </div>
              </div>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Cost Drivers (% of Total Decommissioning Cost)</div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={costDriverPie} cx="50%" cy="50%" outerRadius={80} dataKey="pct" nameKey="driver">
                    {costDriverPie.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, color: T.text }}
                    formatter={(v, n) => [`${v}%`, n]} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8, justifyContent: "center" }}>
                {costDriverPie.map((d, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: d.fill }} />
                    <span style={{ color: T.textSec }}>{d.driver.split(" ").slice(-1)[0]} ({d.pct}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
      case 3: return (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
            <KpiCard label="Annual Fund Contribution" value={`$${annualFund}M`} sub="$/yr input" />
            <KpiCard label="Fund at Decommissioning" value={`$${fundResult.fundAtDecom}M`} sub={`In ${yearsToDecom} yr`} color={T.teal} />
            <KpiCard label="Adequacy (%)" value={`${fundResult.funded}%`} sub="vs est. decom cost" color={fundResult.funded >= 100 ? T.green : fundResult.funded >= 70 ? T.amber : T.red} />
            <KpiCard label="Gap/Surplus" value={`${fundResult.gap >= 0 ? "+" : ""}${fundResult.gap}M`} sub="Fund − PV Decom Cost" color={fundResult.gap >= 0 ? T.green : T.red} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
              <div style={{ fontSize: 13, color: T.gold, marginBottom: 16 }}>Fund Adequacy Modeller</div>
              <Slider label="Annual Fund Contribution ($M/yr)" min={1} max={50} step={1} value={annualFund} onChange={setAnnualFund} fmt={v => `$${v}M/yr`} />
              <Slider label="Years Until Decommissioning" min={5} max={50} step={1} value={yearsToDecom} onChange={setYearsToDecom} fmt={v => `${v} yr`} />
              <Slider label="WACC / Fund Return (%)" min={2} max={8} step={0.5} value={wacc} onChange={setWacc} fmt={v => `${v}%`} />
              <div style={{ background: T.surfaceH, borderRadius: 6, padding: 12, marginTop: 8 }}>
                <div style={{ fontSize: 11, color: T.textMut, marginBottom: 8 }}>FUND ADEQUACY SUMMARY</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div><div style={{ fontSize: 10, color: T.textMut }}>Fund at T-Decom</div><div style={{ color: T.teal, fontFamily: T.mono, fontSize: 16 }}>${fundResult.fundAtDecom}M</div></div>
                  <div><div style={{ fontSize: 10, color: T.textMut }}>Decom PV Target</div><div style={{ color: T.gold, fontFamily: T.mono, fontSize: 16 }}>${fundResult.pvDecom}M</div></div>
                  <div><div style={{ fontSize: 10, color: T.textMut }}>Adequacy Ratio</div><div style={{ color: fundResult.funded >= 100 ? T.green : T.red, fontFamily: T.mono, fontSize: 16 }}>{fundResult.funded}%</div></div>
                  <div><div style={{ fontSize: 10, color: T.textMut }}>Surplus/Deficit</div><div style={{ color: fundResult.gap >= 0 ? T.green : T.red, fontFamily: T.mono, fontSize: 16 }}>${fundResult.gap}M</div></div>
                </div>
              </div>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Fund Accumulation vs Linear Target ($M)</div>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={fundBuildupData.filter((_, i) => i % 2 === 0)}>
                  <XAxis dataKey="year" tick={{ fill: T.textMut, fontSize: 10 }} />
                  <YAxis tick={{ fill: T.textMut, fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, color: T.text }} />
                  <Area type="monotone" dataKey="fund" stroke={T.gold} fill={T.gold} fillOpacity={0.2} name="Fund ($M)" />
                  <Area type="monotone" dataKey="target" stroke={T.teal} fill={T.teal} fillOpacity={0.1} name="Linear Target ($M)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      );
      case 4: return (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
            <KpiCard label="NDA Total Liability" value="£132B" sub="Sellafield dominant" color={T.red} />
            <KpiCard label="Sellafield Cost" value="£121B" sub="Largest decom site globally" color={T.red} />
            <KpiCard label="NDA Annual Budget" value="£3.5B/yr" sub="UK government funded" color={T.amber} />
            <KpiCard label="UK Completion Target" value="2120" sub="Sellafield full clearance" color={T.textSec} />
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>UK NDA Sites — Liability & Timeline</div>
            <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {["Site","Type","Est. Cost (£B)","Status","Est. Completion","Country"].map(h => (
                    <th key={h} style={{ padding: "8px 10px", color: T.textSec, textAlign: "left", fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {NDA_SITES.map((s, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: "8px 10px", color: T.gold, fontWeight: 600 }}>{s.site}</td>
                    <td style={{ padding: "8px 10px", color: T.teal }}>{s.type}</td>
                    <td style={{ padding: "8px 10px", color: T.red, fontFamily: T.mono }}>£{s.est_cost_bn}B</td>
                    <td style={{ padding: "8px 10px", color: T.amber }}>{s.status}</td>
                    <td style={{ padding: "8px 10px", color: T.textSec, fontFamily: T.mono }}>{s.completion}</td>
                    <td style={{ padding: "8px 10px", color: T.textSec }}>{s.country}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
            <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>UK NDA Annual Spend Profile ($M) — Illustrative</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={Array.from({ length: 15 }, (_, i) => ({
                year: 2025 + i,
                sellafield: +(2200 + sr(i * 7) * 300).toFixed(0),
                magnox: +(450 + sr(i * 11) * 80).toFixed(0),
                other: +(280 + sr(i * 13) * 60).toFixed(0),
              }))}>
                <XAxis dataKey="year" tick={{ fill: T.textMut, fontSize: 10 }} />
                <YAxis tick={{ fill: T.textMut, fontSize: 10 }} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, color: T.text }} />
                <Bar dataKey="sellafield" fill={T.red}   name="Sellafield" stackId="a" />
                <Bar dataKey="magnox"     fill={T.amber} name="Magnox sites" stackId="a" />
                <Bar dataKey="other"      fill={T.teal}  name="Other NDA" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
      case 5: return (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
            <KpiCard label="DOE EM Liability" value="$500B+" sub="Total legacy clean-up" color={T.red} />
            <KpiCard label="Hanford Cost" value="$379B" sub="Largest US site" color={T.red} />
            <KpiCard label="EM Annual Budget" value="$8B/yr" sub="FY2024 request" color={T.amber} />
            <KpiCard label="Sites Completed" value="100+" sub="Out of 130 EM sites" color={T.green} />
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Major US DOE EM Sites</div>
            <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {["Site","Type","Estimated Cost","Status","End Year","Waste Volume"].map(h => (
                    <th key={h} style={{ padding: "8px 10px", color: T.textSec, textAlign: "left", fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {US_DOE_SITES.map((s, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: "8px 10px", color: T.gold, fontWeight: 600 }}>{s.site}</td>
                    <td style={{ padding: "8px 10px", color: T.teal }}>{s.type}</td>
                    <td style={{ padding: "8px 10px", color: T.red, fontFamily: T.mono }}>${s.cost_bn}B</td>
                    <td style={{ padding: "8px 10px", color: s.status === "Complete" ? T.green : T.amber }}>{s.status}</td>
                    <td style={{ padding: "8px 10px", color: T.textSec, fontFamily: T.mono }}>{s.endYr}</td>
                    <td style={{ padding: "8px 10px", color: T.textSec }}>{s.volume}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
      case 6: return (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
            <KpiCard label="HLW Repositories Open" value="2" sub="Onkalo (FIN) + WIPP (US)" color={T.green} />
            <KpiCard label="Finland Onkalo" value="2025" sub="World's first HLW GDF" color={T.teal} />
            <KpiCard label="UK GDF Timeline" value="2050s" sub="Site selection ongoing" color={T.amber} />
            <KpiCard label="SNF in Pools/Casks" value="400,000 tHM" sub="Global accumulation" color={T.textSec} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Waste Stream Volumes & Activity</div>
              <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                    {["Waste Class","Volume (m³)","Activity (PBq)","Disposal Route"].map(h => (
                      <th key={h} style={{ padding: "6px 8px", color: T.textSec, textAlign: "left" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {WASTE_STREAMS.map((w, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: "6px 8px", color: T.gold, fontWeight: 600 }}>{w.type}</td>
                      <td style={{ padding: "6px 8px", color: T.text, fontFamily: T.mono }}>{w.vol_m3.toLocaleString()}</td>
                      <td style={{ padding: "6px 8px", color: T.red, fontFamily: T.mono }}>{w.activity_PBq.toLocaleString()}</td>
                      <td style={{ padding: "6px 8px", color: T.textSec }}>{w.disposal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Global GDF/Repository Programs</div>
              {[
                { country:"Finland",    site:"Onkalo (Posiva)",  status:"Open 2025",   depth:"400–450m", rock:"Crystalline" },
                { country:"Sweden",     site:"Forsmark (SKB)",   status:"Approved 2022",depth:"500m",    rock:"Crystalline" },
                { country:"France",     site:"Cigéo (ANDRA)",    status:"2025 auth.",  depth:"490m",     rock:"Clay (Callovo)" },
                { country:"Switzerland",site:"Bözberg (NAGRA)",  status:"2024 select.",depth:"900m",    rock:"Opalinus Clay" },
                { country:"USA",        site:"WIPP (ILW/TRU)",   status:"Operating",   depth:"655m",     rock:"Salt" },
                { country:"UK",         site:"GDF (RWM)",        status:"Site selection",depth:"~1000m", rock:"TBD" },
              ].map((r, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${T.border}` }}>
                  <div>
                    <div style={{ fontSize: 12, color: T.gold, fontWeight: 600 }}>{r.country} — {r.site}</div>
                    <div style={{ fontSize: 11, color: T.textSec }}>{r.depth} · {r.rock}</div>
                  </div>
                  <div style={{ fontSize: 11, color: r.status.includes("Open") || r.status.includes("Operating") ? T.green : T.amber, textAlign: "right", maxWidth: 120 }}>{r.status}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
      case 7: return (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
            <KpiCard label="Site Release Criteria" value="<1 mSv/yr" sub="IAEA RSG 1.7 standard" />
            <KpiCard label="Unconditional Release" value="<10 μSv/yr" sub="Greenfield equivalent" color={T.teal} />
            <KpiCard label="Average D&D Duration" value="10–20 yr" sub="From shutdown to clearance" color={T.sage} />
            <KpiCard label="Clearance Measurement" value="In-situ γ spec" sub="HPGe + Monte Carlo" color={T.amber} />
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: T.gold, marginBottom: 12 }}>Site Clearance Phases</div>
            {[
              { phase:"1. Spent Fuel Removal",   duration:"1–3 yr", desc:"Transfer to interim storage or reprocessing; wet-to-dry consolidation", dose:"~80% of site dose" },
              { phase:"2. Systems Decontamination", duration:"2–5 yr", desc:"Chemical decon of primary circuits; HEPA filter changes; floor decon", dose:"~15%" },
              { phase:"3. Structural Demolition",  duration:"3–10 yr", desc:"Reactor pressure vessel; bioshield; containment; HEPA building", dose:"~4%" },
              { phase:"4. Soil Remediation",       duration:"2–5 yr", desc:"Contaminated soil excavation; groundwater monitoring; cap + cover", dose:"~1%" },
              { phase:"5. Site Survey & Release",  duration:"1–2 yr", desc:"Final status survey; SRSS; regulator sign-off for unrestricted use", dose:"<0.1%" },
            ].map((p, i) => (
              <div key={i} style={{ display: "flex", gap: 16, padding: "10px 0", borderBottom: `1px solid ${T.border}` }}>
                <div style={{ minWidth: 180 }}>
                  <div style={{ fontSize: 12, color: T.gold, fontWeight: 600 }}>{p.phase}</div>
                  <div style={{ fontSize: 11, color: T.teal, fontFamily: T.mono }}>{p.duration}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: T.textSec }}>{p.desc}</div>
                </div>
                <div style={{ minWidth: 80, textAlign: "right", fontSize: 11, color: T.amber }}>{p.dose}</div>
              </div>
            ))}
          </div>
        </div>
      );
      case 8: return (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
            <KpiCard label="SMR Decom Cost Est." value="$50–250M" sub="vs $300–1,500M for GW-LWR" color={T.green} />
            <KpiCard label="Factory Return Concept" value="Novel" sub="eVinci / NuScale modular" color={T.teal} />
            <KpiCard label="SMR Decom Fund" value="~15% CAPEX" sub="Regulatory escrow" color={T.sage} />
            <KpiCard label="MSR Decom Challenge" value="High" sub="Fluid salt processing" color={T.amber} />
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>SMR Decommissioning Characteristics</div>
            <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {["Design","Capacity","Decom Cost Est. ($M)","Strategy","Timeline","Novel Challenge"].map(h => (
                    <th key={h} style={{ padding: "8px 10px", color: T.textSec, textAlign: "left", fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {smrDecomm.map((s, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: "8px 10px", color: T.gold, fontWeight: 600 }}>{s.design}</td>
                    <td style={{ padding: "8px 10px", color: T.text, fontFamily: T.mono }}>{s.mw} MWe</td>
                    <td style={{ padding: "8px 10px", color: T.teal, fontFamily: T.mono }}>${s.decom}M</td>
                    <td style={{ padding: "8px 10px", color: T.textSec }}>{s.strategy}</td>
                    <td style={{ padding: "8px 10px", color: T.textSec, fontFamily: T.mono }}>{s.time} yr</td>
                    <td style={{ padding: "8px 10px", color: T.amber }}>{s.novel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>SMR vs LWR Decom Cost per MWe ($M/MWe)</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={[
                  { name:"GW LWR",   cost:0.6 }, { name:"GW EPR",    cost:1.1 },
                  { name:"NuScale",  cost:1.1 }, { name:"BWRX-300",  cost:0.6 },
                  { name:"MSR-195",  cost:1.3 }, { name:"eVinci",     cost:10  },
                ]}>
                  <XAxis dataKey="name" tick={{ fill: T.textMut, fontSize: 10 }} />
                  <YAxis tick={{ fill: T.textMut, fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, color: T.text }} />
                  <Bar dataKey="cost" radius={[3,3,0,0]} name="$M/MWe">
                    {[T.gold, T.teal, T.sage, T.navyL, T.amber, T.red].map((c, i) => <Cell key={i} fill={c} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
              <div style={{ fontSize: 13, color: T.gold, marginBottom: 12 }}>SMR Decom Innovation Pathways</div>
              {[
                { title:"Factory Return (Micro)",   desc:"Entire reactor module shipped back to manufacturer — no site D&D", feasibility:"High for <5MW", color: T.green },
                { title:"Serial Standardisation",   desc:"Identical SMR templates allow procedure reuse — 20–40% cost reduction", feasibility:"High for Series N", color: T.teal },
                { title:"Robotic D&D",              desc:"Remote handling for RPV — reduces worker dose; pilot at Fukushima Daiichi", feasibility:"2030 deployment", color: T.sage },
                { title:"MSR Salt Decon",           desc:"F-LiBeF2 solidification + chemical decontamination of circuits", feasibility:"Demo needed", color: T.amber },
              ].map((p, i) => (
                <div key={i} style={{ background: T.surfaceH, borderRadius: 6, padding: 12, marginBottom: 10, borderLeft: `3px solid ${p.color}` }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: p.color, marginBottom: 4 }}>{p.title}</div>
                  <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>{p.desc}</div>
                  <div style={{ fontSize: 10, color: T.textMut }}>{p.feasibility}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
      case 9: return (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
            <KpiCard label="Decom Services Market" value="$8B/yr" sub="2024, growing 5% CAGR" />
            <KpiCard label="Key Contractors" value="AECOM, Veolia, BWXT" sub="Global D&D leaders" color={T.teal} />
            <KpiCard label="Fund Mechanism" value="Trust Fund/Escrow" sub="Mandatory in EU/US/UK" color={T.sage} />
            <KpiCard label="Shortfall Risk" value="HIGH" sub="Most non-OECD funds gap" color={T.red} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Decommissioning Financing Structures</div>
              {[
                { structure:"Segregated Fund (Trust)", jurisdiction:"US/EU/UK", mechanism:"Ring-fenced assets; independent trustee", risk:"Investment risk", required:"Yes (regulated)" },
                { structure:"Book Reserve", jurisdiction:"Germany (legacy)", mechanism:"On-balance-sheet liability provision", risk:"Operator insolvency", required:"Phasing out" },
                { structure:"Government Guarantee", jurisdiction:"France/UK (state)", mechanism:"State back-stop via CEA/NDA", risk:"Sovereign risk", required:"State utilities" },
                { structure:"Insurance Captive", jurisdiction:"US merchant plants", mechanism:"Decom insurance product; premium model", risk:"Product availability", required:"Alternative" },
                { structure:"Carbon Credit Co-fund", jurisdiction:"Novel concept", mechanism:"Decom fund built from CfD premium + ETS", risk:"Policy change", required:"Research stage" },
              ].map((f, i) => (
                <div key={i} style={{ padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, color: T.gold, fontWeight: 600 }}>{f.structure}</span>
                    <span style={{ fontSize: 11, color: f.required.includes("Yes") ? T.green : T.amber }}>{f.required}</span>
                  </div>
                  <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{f.mechanism}</div>
                </div>
              ))}
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>D&D Market — Revenue by Segment ($B/yr, 2024)</div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={[
                    { name:"US DOE EM Sites", value:5.2, fill: T.gold },
                    { name:"Commercial LWR", value:1.8, fill: T.teal },
                    { name:"UK NDA", value:0.6, fill: T.sage },
                    { name:"Rest of World", value:0.4, fill: T.navyL },
                  ]} cx="50%" cy="50%" outerRadius={75} dataKey="value" nameKey="name">
                    {[T.gold, T.teal, T.sage, T.navyL].map((c, i) => <Cell key={i} fill={c} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, color: T.text }}
                    formatter={(v, n) => [`$${v}B/yr`, n]} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[["US DOE", T.gold], ["Commercial LWR", T.teal], ["UK NDA", T.sage], ["Rest of World", T.navyL]].map(([n, c]) => (
                  <div key={n} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: c }} />
                    <span style={{ fontSize: 11, color: T.textSec }}>{n}</span>
                  </div>
                ))}
              </div>
            </div>
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
            <div style={{ fontSize: 11, color: T.gold, fontFamily: T.mono, letterSpacing: 2, marginBottom: 6 }}>EP-DU5 · NUCLEAR DECOMMISSIONING FINANCE</div>
            <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, color: T.text }}>Nuclear Decommissioning Finance Intelligence</h1>
            <div style={{ fontSize: 13, color: T.textSec, marginTop: 4 }}>Global Fleet Status · D&D Strategies · Cost Modelling · NDA/DOE Programs · Waste Management · SMR Decomm · Fund Adequacy</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono }}>DECOM COST EST.</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: T.gold }}>${decommResult.nominalCost}M</div>
            <div style={{ fontSize: 11, color: T.textSec }}>{reactorMw} MWe {reactorType} · {strategy}</div>
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
