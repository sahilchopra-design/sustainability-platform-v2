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

function calcCapacityValue({ powerMw, cf, peakPricePremium, basePrice, ancillaryShare }) {
  const annMwh = powerMw * cf / 100 * 8760;
  const baseRev = annMwh * basePrice / 1e6;
  const capacityRev = powerMw * peakPricePremium * 8760 * 0.05 / 1e6;
  const ancillaryRev = annMwh * ancillaryShare / 100 * basePrice * 1.5 / 1e6;
  return { baseRev, capacityRev, ancillaryRev, totalRev: baseRev + capacityRev + ancillaryRev };
}

const GRID_SERVICES = [
  { service: "Frequency Regulation", value: 12, geoPct: 95, description: "Geothermal can provide primary/secondary frequency response due to stable output" },
  { service: "Spinning Reserve", value: 8,  geoPct: 90, description: "Always available — ideal spinning reserve provider" },
  { service: "Voltage Support", value: 5,   geoPct: 85, description: "Synchronous generators provide reactive power support" },
  { service: "Black Start", value: 15,      geoPct: 70, description: "Island-capable units can provide black start service" },
  { service: "Load Following", value: 6,    geoPct: 60, description: "Variable output binary units can ramp 1-100% in minutes" },
  { service: "Capacity Market", value: 20,  geoPct: 98, description: "High availability makes geothermal ideal for capacity markets" },
];

const PPA_STRUCTURES = [
  { type: "Fixed-Price PPA",       term: 20, price: 85,  indexation: "Fixed", creditRating: "IG required", bankability: 95 },
  { type: "Indexed PPA (CPI)",     term: 15, price: 70,  indexation: "CPI+1%", creditRating: "BB+", bankability: 85 },
  { type: "Merchant / Spot",       term: 0,  price: 90,  indexation: "Market", creditRating: "N/A", bankability: 40 },
  { type: "Green Tariff",          term: 10, price: 110, indexation: "Fixed+premium", creditRating: "BBB", bankability: 75 },
  { type: "CfD (Government)",      term: 15, price: 95,  indexation: "RPI-linked", creditRating: "Sovereign", bankability: 98 },
  { type: "Corporate PPA (C&I)",   term: 12, price: 105, indexation: "Fixed", creditRating: "Investment Grade C", bankability: 80 },
];

const MARGINAL_VALUE = [
  { renewPct: 10, geo: 95, wind: 92, solar: 88, battery: 70 },
  { renewPct: 20, geo: 92, wind: 85, solar: 75, battery: 78 },
  { renewPct: 30, geo: 88, wind: 75, solar: 60, battery: 85 },
  { renewPct: 50, geo: 82, wind: 58, solar: 38, battery: 90 },
  { renewPct: 70, geo: 75, wind: 42, solar: 22, battery: 88 },
  { renewPct: 90, geo: 68, wind: 30, solar: 12, battery: 82 },
  { renewPct: 100, geo: 62, wind: 20, solar: 5, battery: 70 },
];

const MARKET_PRICES = Array.from({ length: 24 }, (_, h) => ({
  hour: h,
  spot: +(40 + sr(h * 7) * 80 + (h >= 7 && h <= 9 ? 40 : 0) + (h >= 17 && h <= 20 ? 55 : 0)).toFixed(0),
  geoCf: 93,
}));

const TABS = [
  "Grid Value", "Capacity Factor Premium", "PPA Structures", "Ancillary Services",
  "Marginal Value", "Hourly Price Profile", "Market Comparison", "Merchant Risk",
  "Grid Integration", "Revenue Optimization"
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

export default function GeothermalPowerMarketsPage() {
  const [tab, setTab] = useState(0);
  const [powerMw, setPowerMw]     = useState(50);
  const [cf, setCf]               = useState(93);
  const [basePrice, setBasePrice] = useState(75);
  const [peakPrem, setPeakPrem]   = useState(40);
  const [ancillary, setAncillary] = useState(8);
  const [ppaPrice, setPpaPrice]   = useState(85);
  const [ppaTerm, setPpaTerm]     = useState(15);
  const [carbonPrice, setCarbonPrice] = useState(80);
  const [renewPct, setRenewPct]   = useState(30);
  const [gridFlex, setGridFlex]   = useState(65);

  const capVal = useMemo(() => calcCapacityValue({ powerMw, cf, peakPricePremium: peakPrem, basePrice, ancillaryShare: ancillary }), [powerMw, cf, peakPrem, basePrice, ancillary]);

  const annMwh = powerMw * cf / 100 * 8760;
  const geoAvgPrice = +(MARKET_PRICES.reduce((s, h) => s + h.spot, 0) / 24).toFixed(0);
  const weightedRev = annMwh * geoAvgPrice / 1e6;
  const ppaRev = annMwh * ppaPrice / 1e6;
  const carbonAdj = annMwh * carbonPrice * 38 / 1e9;

  const revenueStack = useMemo(() => [
    { source: "Energy Revenue", value: +capVal.baseRev.toFixed(1) },
    { source: "Capacity Payments", value: +capVal.capacityRev.toFixed(1) },
    { source: "Ancillary Services", value: +capVal.ancillaryRev.toFixed(1) },
    { source: "Carbon Credits", value: +carbonAdj.toFixed(1) },
  ], [capVal, carbonAdj]);

  const ppaVsMerchant = useMemo(() => Array.from({ length: 10 }, (_, y) => {
    const spotVol = basePrice * (0.8 + sr(y * 17) * 0.4);
    return {
      year: y + 1,
      ppa: ppaPrice,
      merchant: +spotVol.toFixed(0),
      delta: +(ppaPrice - spotVol).toFixed(0),
    };
  }), [ppaPrice, basePrice]);

  const marginalNow = useMemo(() => {
    const row = MARGINAL_VALUE.reduce((prev, cur) => Math.abs(cur.renewPct - renewPct) < Math.abs(prev.renewPct - renewPct) ? cur : prev);
    return row;
  }, [renewPct]);

  const ancillaryData = GRID_SERVICES.map(s => ({
    ...s,
    revenue: +(powerMw * s.value * s.geoPct / 100 / 1000).toFixed(1),
  }));

  const gridIntegData = useMemo(() => Array.from({ length: 24 }, (_, h) => {
    const renewGen = 50 * Math.max(0, Math.sin(Math.PI * (h - 6) / 12));
    const demand = 60 + sr(h * 5) * 30;
    const geoRequired = Math.max(0, demand - renewGen);
    return { hour: h, renewGen: +renewGen.toFixed(0), demand: +demand.toFixed(0), geoRequired: +geoRequired.toFixed(0) };
  }), []);

  const revOptimize = useMemo(() => [
    { strategy: "Merchant Only",       rev: +weightedRev.toFixed(1), risk: "High",   note: "Full exposure to spot price volatility" },
    { strategy: `PPA $${ppaPrice}/MWh`, rev: +ppaRev.toFixed(1),    risk: "Low",    note: `${ppaTerm}yr fixed-price offtake agreement` },
    { strategy: "PPA + Ancillary",     rev: +(ppaRev + capVal.ancillaryRev).toFixed(1), risk: "Low-Med", note: "PPA base + ancillary services upside" },
    { strategy: "Full Revenue Stack",  rev: +(ppaRev + capVal.capacityRev + capVal.ancillaryRev + carbonAdj).toFixed(1), risk: "Low", note: "PPA + capacity + ancillary + carbon" },
    { strategy: "Carbon-Indexed PPA",  rev: +(ppaRev + carbonAdj).toFixed(1), risk: "Low-Med", note: "PPA with carbon price pass-through" },
  ], [weightedRev, ppaRev, capVal, carbonAdj, ppaPrice, ppaTerm]);

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
        <div style={{ fontSize: 11, color: T.gold, fontFamily: T.mono, letterSpacing: 2, marginBottom: 6 }}>EP-DV5 · GEOTHERMAL ENERGY FINANCE</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Geothermal Power Markets & Grid Services</h1>
        <div style={{ fontSize: 13, color: T.textSec, marginTop: 6 }}>Baseload Premium · Ancillary Services · PPA Structuring · Marginal Value · Grid Integration · Revenue Stack</div>
      </div>

      <div style={styles.tabs}>
        {TABS.map((t, i) => <button key={t} style={styles.tab(tab === i)} onClick={() => setTab(i)}>{t}</button>)}
      </div>

      {tab === 0 && (
        <div style={styles.grid2}>
          <div>
            <div style={styles.panel}>
              <div style={styles.h3}>Project Parameters</div>
              <Slider label="Project Capacity" value={powerMw} min={5} max={200} step={5} onChange={setPowerMw} unit=" MW" />
              <Slider label="Capacity Factor" value={cf} min={70} max={98} step={1} onChange={setCf} unit="%" />
              <Slider label="Base Electricity Price" value={basePrice} min={30} max={150} step={5} onChange={setBasePrice} unit=" $/MWh" />
              <Slider label="Peak Price Premium (over base)" value={peakPrem} min={0} max={100} step={5} onChange={setPeakPrem} unit=" $/MWh" />
              <Slider label="Ancillary Services Share" value={ancillary} min={0} max={20} step={1} onChange={setAncillary} unit="% output" />
              <Slider label="Carbon Price" value={carbonPrice} min={0} max={250} step={10} onChange={setCarbonPrice} unit=" $/t" />
            </div>
          </div>
          <div>
            <div style={styles.grid2}>
              <KpiCard label="Annual Generation" value={(annMwh / 1e6).toFixed(2)} unit="TWh/yr" sub={`${cf}% capacity factor`} />
              <KpiCard label="Total Revenue" value={(capVal.baseRev + capVal.capacityRev + capVal.ancillaryRev + carbonAdj).toFixed(1)} unit="$M/yr" sub="All revenue streams" color={T.gold} />
              <KpiCard label="Energy Revenue" value={capVal.baseRev.toFixed(1)} unit="$M/yr" sub={`@$${basePrice}/MWh`} />
              <KpiCard label="Capacity + Ancillary" value={(capVal.capacityRev + capVal.ancillaryRev).toFixed(1)} unit="$M/yr" sub="Grid services value" color={T.teal} />
            </div>
            <div style={styles.panel}>
              <div style={styles.h3}>Revenue Stack Breakdown</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={revenueStack} layout="vertical" margin={{ top: 5, right: 30, bottom: 5, left: 130 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: T.textSec }} unit="$M" />
                  <YAxis dataKey="source" type="category" tick={{ fontSize: 11, fill: T.textSec }} width={125} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}` }} formatter={v => [`$${v}M/yr`]} />
                  <Bar dataKey="value" fill={T.gold} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div>
          <div style={styles.grid3}>
            <KpiCard label="Geo. Capacity Factor" value={`${cf}%`} unit="" sub="vs 22-40% for intermittent RE" color={T.green} />
            <KpiCard label="CF Premium Value" value={`$${(cf - 40).toFixed(0)}`} unit="$/MWh equiv." sub="vs 40% baseline RE" color={T.gold} />
            <KpiCard label="Baseload Availability" value="99.2%" unit="" sub="Avg. geothermal availability" color={T.teal} />
          </div>
          <div style={styles.panel}>
            <div style={styles.h3}>Capacity Factor Comparison — Effective Energy Value</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={[
                { tech: "Geothermal", cf: 93, annGwhPer100mw: 815, color: T.gold },
                { tech: "Nuclear", cf: 92, annGwhPer100mw: 806, color: T.teal },
                { tech: "Offshore Wind", cf: 40, annGwhPer100mw: 350, color: T.sage },
                { tech: "Onshore Wind", cf: 33, annGwhPer100mw: 289, color: T.green },
                { tech: "Solar PV (utility)", cf: 22, annGwhPer100mw: 193, color: T.amber },
                { tech: "CCGT (gas)", cf: 60, annGwhPer100mw: 526, color: T.red },
                { tech: "Coal", cf: 70, annGwhPer100mw: 613, color: T.textMut },
              ]} margin={{ top: 5, right: 20, bottom: 50, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="tech" tick={{ fontSize: 9, fill: T.textMut }} angle={-30} textAnchor="end" />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: T.textSec }} unit="%" label={{ value: "CF (%)", angle: -90, position: "insideLeft", fill: T.textSec, fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: T.textSec }} unit=" GWh" />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}` }} />
                <Legend />
                <Bar yAxisId="left" dataKey="cf" name="Capacity Factor (%)" fill={T.gold} />
                <Bar yAxisId="right" dataKey="annGwhPer100mw" name="Ann. GWh/100MW" fill={T.teal} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 2 && (
        <div>
          <div style={styles.grid2}>
            <div>
              <div style={styles.panel}>
                <div style={styles.h3}>PPA Parameters</div>
                <Slider label="PPA Price" value={ppaPrice} min={40} max={150} step={5} onChange={setPpaPrice} unit=" $/MWh" />
                <Slider label="PPA Term" value={ppaTerm} min={5} max={25} step={1} onChange={setPpaTerm} unit=" yr" />
              </div>
              <div style={styles.panel}>
                <div style={styles.h3}>PPA Structures — Comparison</div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${T.gold}` }}>
                      {["Type", "Tenor", "Price", "Bankability"].map(h => (
                        <th key={h} style={{ padding: "5px 8px", textAlign: "left", color: T.gold, fontFamily: T.mono, fontSize: 10 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {PPA_STRUCTURES.map((p, i) => (
                      <tr key={p.type} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 ? T.surfaceH : "transparent" }}>
                        <td style={{ padding: "5px 8px", color: T.text }}>{p.type}</td>
                        <td style={{ padding: "5px 8px", fontFamily: T.mono }}>{p.term > 0 ? `${p.term}yr` : "Spot"}</td>
                        <td style={{ padding: "5px 8px", fontFamily: T.mono, color: T.gold }}>${p.price}</td>
                        <td style={{ padding: "5px 8px", fontFamily: T.mono, color: p.bankability >= 90 ? T.green : p.bankability >= 70 ? T.amber : T.red }}>{p.bankability}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <div style={styles.grid2}>
                <KpiCard label="PPA Revenue" value={ppaRev.toFixed(1)} unit="$M/yr" sub={`$${ppaPrice}/MWh × ${(annMwh / 1e6).toFixed(2)} TWh`} />
                <KpiCard label="vs. Merchant" value={`${(ppaRev - weightedRev) > 0 ? "+" : ""}${(ppaRev - weightedRev).toFixed(1)}`} unit="$M/yr" sub="PPA vs. spot average" color={(ppaRev - weightedRev) > 0 ? T.green : T.red} />
              </div>
              <div style={styles.panel}>
                <div style={styles.h3}>PPA vs. Merchant Revenue — 10yr Simulation</div>
                <ResponsiveContainer width="100%" height={240}>
                  <ComposedChart data={ppaVsMerchant} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="year" tick={{ fontSize: 10, fill: T.textSec }} label={{ value: "Year", position: "insideBottom", offset: -10, fill: T.textSec, fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 10, fill: T.textSec }} unit="$/MWh" />
                    <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}` }} />
                    <Bar dataKey="merchant" name="Merchant Spot" fill={T.teal} opacity={0.7} />
                    <Line type="monotone" dataKey="ppa" name={`PPA $${ppaPrice}`} stroke={T.gold} strokeWidth={2} dot={false} strokeDasharray="4 4" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 3 && (
        <div>
          <div style={styles.grid3}>
            <KpiCard label="Ancillary Revenue" value={capVal.ancillaryRev.toFixed(1)} unit="$M/yr" sub={`${ancillary}% in ancillary market`} color={T.gold} />
            <KpiCard label="Capacity Revenue" value={capVal.capacityRev.toFixed(1)} unit="$M/yr" sub="Capacity market payments" color={T.teal} />
            <KpiCard label="Grid Service Value" value={(capVal.capacityRev + capVal.ancillaryRev).toFixed(1)} unit="$M/yr" sub="Total non-energy revenue" color={T.green} />
          </div>
          <div style={styles.panel}>
            <div style={styles.h3}>Grid Services — Value & Geothermal Eligibility</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${T.gold}` }}>
                    {["Service", "$/MW-yr Value", "Geo. Eligibility", "Est. Revenue ($M/yr)", "Rationale"].map(h => (
                      <th key={h} style={{ padding: "7px 10px", textAlign: "left", color: T.gold, fontFamily: T.mono, fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ancillaryData.map((s, i) => (
                    <tr key={s.service} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 ? T.surfaceH : "transparent" }}>
                      <td style={{ padding: "7px 10px", color: T.text }}>{s.service}</td>
                      <td style={{ padding: "7px 10px", fontFamily: T.mono, color: T.gold }}>${s.value}</td>
                      <td style={{ padding: "7px 10px", fontFamily: T.mono, color: s.geoPct >= 90 ? T.green : T.amber }}>{s.geoPct}%</td>
                      <td style={{ padding: "7px 10px", fontFamily: T.mono }}>${(powerMw * s.value * s.geoPct / 100 / 1000).toFixed(2)}M</td>
                      <td style={{ padding: "7px 10px", color: T.textSec, fontSize: 11 }}>{s.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 4 && (
        <div>
          <div style={styles.grid3}>
            <KpiCard label="Grid Renewables" value={`${renewPct}%`} unit="" sub="Current system RE penetration" />
            <KpiCard label="Geo. Marginal Value" value={`${marginalNow.geo}`} unit="%" sub="vs 100% baseline" color={T.gold} />
            <KpiCard label="Solar Value at this RE%" value={`${marginalNow.solar}%`} unit="" sub="Declining with oversupply" color={T.amber} />
          </div>
          <div style={styles.panel}>
            <div style={styles.h3}>Marginal Value Index vs. RE Penetration (%)</div>
            <Slider label="Grid RE Penetration" value={renewPct} min={10} max={100} step={10} onChange={setRenewPct} unit="%" />
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={MARGINAL_VALUE} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="renewPct" tick={{ fontSize: 10, fill: T.textSec }} label={{ value: "Grid RE %", position: "insideBottom", offset: -10, fill: T.textSec, fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} unit="%" label={{ value: "Value Index (%)", angle: -90, position: "insideLeft", fill: T.textSec, fontSize: 11 }} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}` }} />
                <Legend />
                <Line type="monotone" dataKey="geo"     name="Geothermal" stroke={T.gold}   strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="wind"    name="Onshore Wind" stroke={T.teal}  strokeWidth={2} dot={false} strokeDasharray="4 4" />
                <Line type="monotone" dataKey="solar"   name="Solar PV" stroke={T.amber}  strokeWidth={2} dot={false} strokeDasharray="6 3" />
                <Line type="monotone" dataKey="battery" name="Battery Storage" stroke={T.green} strokeWidth={2} dot={false} strokeDasharray="2 4" />
                <ReferenceLine x={renewPct} stroke={T.text} strokeDasharray="3 3" />
              </LineChart>
            </ResponsiveContainer>
            <div style={{ fontSize: 12, color: T.textSec, marginTop: 8 }}>
              Geothermal maintains 62-95% of its value index as grids decarbonize, far outperforming solar and wind. At {renewPct}% RE penetration, geothermal value index is <span style={{ color: T.gold, fontFamily: T.mono }}>{marginalNow.geo}%</span> vs solar at <span style={{ color: T.amber, fontFamily: T.mono }}>{marginalNow.solar}%</span>.
            </div>
          </div>
        </div>
      )}

      {tab === 5 && (
        <div style={styles.panel}>
          <div style={styles.h3}>Hourly Spot Price Profile — Geothermal vs. Demand (24hr)</div>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={MARKET_PRICES} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: T.textSec }} label={{ value: "Hour of Day", position: "insideBottom", offset: -10, fill: T.textSec, fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 10, fill: T.textSec }} label={{ value: "Spot Price ($/MWh)", angle: -90, position: "insideLeft", fill: T.textSec, fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: T.textSec }} unit="%" />
              <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}` }} />
              <Legend />
              <Bar yAxisId="left" dataKey="spot" name="Spot Price ($/MWh)" fill={T.teal} opacity={0.7} />
              <Line yAxisId="right" type="monotone" dataKey="geoCf" name="Geo. CF (%)" stroke={T.gold} strokeWidth={2} dot={false} strokeDasharray="5 3" />
              <ReferenceLine yAxisId="left" y={geoAvgPrice} stroke={T.gold} strokeDasharray="4 4" label={{ value: `Avg $${geoAvgPrice}`, fill: T.gold, fontSize: 10 }} />
            </ComposedChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 12, fontSize: 12, color: T.textSec }}>
            Geothermal captures full daily price variation at constant 93% CF — unlike solar (zero at night) or wind (intermittent). Weighted average capture price: <span style={{ color: T.gold, fontFamily: T.mono }}>${geoAvgPrice}/MWh</span>
          </div>
        </div>
      )}

      {tab === 6 && (
        <div style={styles.panel}>
          <div style={styles.h3}>Market Structure Comparison — Geothermal Revenue by Market Type</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.gold}` }}>
                  {["Market", "Typical Price", "Geothermal Fit", "Bankability", "Notes"].map(h => (
                    <th key={h} style={{ padding: "7px 10px", textAlign: "left", color: T.gold, fontFamily: T.mono, fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { mkt: "East Africa Pool (EAPP)", price: "$85-110/MWh", fit: "Excellent", bankability: "High", note: "Long-term PPAs with government utilities" },
                  { mkt: "US Wholesale (CAISO/WECC)", price: "$40-120/MWh", fit: "Good", bankability: "Medium", note: "Merchant + capacity market value" },
                  { mkt: "EU CfD (UK/Germany)", price: "£70-100/MWh", fit: "Very Good", bankability: "Very High", note: "Government-backed strike price" },
                  { mkt: "Indonesia RUPTL PPA", price: "$70-95/MWh", fit: "Excellent", bankability: "High", note: "PLN 30yr PPAs, USD-denominated" },
                  { mkt: "Philippines WESM", price: "$60-80/MWh", fit: "Good", bankability: "Medium-High", note: "Merit order dispatch, competitive" },
                  { mkt: "NZ Electricity Market", price: "NZD $80-150/MWh", fit: "Good", bankability: "Medium", note: "Merchant + hedge contracts" },
                  { mkt: "Mexico CENACE", price: "$50-90/MWh", fit: "Good", bankability: "Medium", note: "Regulated tariff + capacity payment" },
                  { mkt: "Corporate PPA (Global)", price: "$80-120/MWh", fit: "Excellent", bankability: "Very High", note: "Google, Microsoft 24/7 CFE programs" },
                ].map((m, i) => (
                  <tr key={m.mkt} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 ? T.surfaceH : "transparent" }}>
                    <td style={{ padding: "7px 10px", color: T.text }}>{m.mkt}</td>
                    <td style={{ padding: "7px 10px", fontFamily: T.mono, color: T.gold }}>{m.price}</td>
                    <td style={{ padding: "7px 10px", color: m.fit === "Excellent" ? T.green : m.fit === "Very Good" ? T.teal : T.amber }}>{m.fit}</td>
                    <td style={{ padding: "7px 10px", color: m.bankability.includes("Very High") ? T.green : m.bankability.includes("High") ? T.teal : T.amber }}>{m.bankability}</td>
                    <td style={{ padding: "7px 10px", color: T.textSec, fontSize: 11 }}>{m.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 7 && (
        <div>
          <div style={styles.grid3}>
            <KpiCard label="Merchant Risk" value="High" unit="" sub="Full spot price exposure" color={T.red} />
            <KpiCard label="PPA Risk Mitigation" value="~70%" unit="" sub="Of revenue locked at fixed price" color={T.green} />
            <KpiCard label="Resource Risk" value="Low" unit="" sub="Unlike wind/solar, geothermal is predictable" color={T.teal} />
          </div>
          <div style={styles.panel}>
            <div style={styles.h3}>Price Risk: PPA vs. Merchant — Scenario Analysis</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={[
                { scenario: "Low Price (−40%)", ppa: ppaPrice, merchant: +Math.round(basePrice * 0.6) },
                { scenario: "Base Case", ppa: ppaPrice, merchant: basePrice },
                { scenario: "High Price (+50%)", ppa: ppaPrice, merchant: +Math.round(basePrice * 1.5) },
                { scenario: "Spike (+150%)", ppa: ppaPrice, merchant: +Math.round(basePrice * 2.5) },
              ]} margin={{ top: 5, right: 20, bottom: 50, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="scenario" tick={{ fontSize: 9, fill: T.textMut }} angle={-20} textAnchor="end" />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} unit="$/MWh" />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}` }} />
                <Legend />
                <Bar dataKey="ppa" name="PPA (Fixed)" fill={T.gold} />
                <Bar dataKey="merchant" name="Merchant Spot" fill={T.teal} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 8 && (
        <div>
          <div style={styles.panel}>
            <div style={styles.h3}>Grid Integration — Geothermal vs. Variable RE Balance (24hr)</div>
            <Slider label="Grid Flexibility Factor" value={gridFlex} min={30} max={100} step={5} onChange={setGridFlex} unit="%" />
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={gridIntegData} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: T.textSec }} label={{ value: "Hour", position: "insideBottom", offset: -10, fill: T.textSec, fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} unit=" MW" />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}` }} />
                <Legend />
                <Area type="monotone" dataKey="renewGen" name="Solar/Wind Generation" stackId="1" stroke={T.sage} fill={T.sage} fillOpacity={0.4} />
                <Area type="monotone" dataKey="geoRequired" name="Geothermal Required" stackId="2" stroke={T.gold} fill={T.gold} fillOpacity={0.5} />
                <Line type="monotone" dataKey="demand" name="System Demand" stroke={T.red} strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={styles.panel}>
            <div style={styles.h3}>24/7 Carbon-Free Energy — Geothermal Advantage</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, fontSize: 12 }}>
              {[
                { aspect: "Hourly Matching", geo: "100% coverage (24/7)", solar: "0% after sunset", wind: "60-80% (variable)" },
                { aspect: "Annual CF", geo: `${cf}%`, solar: "22-25%", wind: "33-45%" },
                { aspect: "Grid Stability", geo: "Synchronous inertia", solar: "Inverter-based (no inertia)", wind: "Limited inertia" },
                { aspect: "Curtailment Risk", geo: "Very Low", solar: "High (mid-day)", wind: "Moderate" },
              ].map(r => (
                <div key={r.aspect} style={{ background: T.surfaceH, padding: 12, borderRadius: 6 }}>
                  <div style={{ fontWeight: 600, marginBottom: 8, color: T.gold }}>{r.aspect}</div>
                  <div>Geothermal: <span style={{ color: T.green }}>{r.geo}</span></div>
                  <div>Solar: <span style={{ color: T.amber }}>{r.solar}</span></div>
                  <div>Wind: <span style={{ color: T.teal }}>{r.wind}</span></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 9 && (
        <div style={styles.panel}>
          <div style={styles.h3}>Revenue Optimization — Strategy Comparison</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.gold}` }}>
                  {["Strategy", "Annual Revenue ($M)", "Risk Level", "Recommendation"].map(h => (
                    <th key={h} style={{ padding: "7px 10px", textAlign: "left", color: T.gold, fontFamily: T.mono, fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {revOptimize.map((r, i) => (
                  <tr key={r.strategy} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 ? T.surfaceH : "transparent" }}>
                    <td style={{ padding: "7px 10px", color: T.text, fontWeight: 600 }}>{r.strategy}</td>
                    <td style={{ padding: "7px 10px", fontFamily: T.mono, color: T.gold, fontSize: 14 }}>${r.rev}M</td>
                    <td style={{ padding: "7px 10px", color: r.risk === "High" ? T.red : r.risk === "Low" ? T.green : T.amber }}>{r.risk}</td>
                    <td style={{ padding: "7px 10px", color: T.textSec, fontSize: 11 }}>{r.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 16 }}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revOptimize} margin={{ top: 5, right: 20, bottom: 50, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="strategy" tick={{ fontSize: 9, fill: T.textMut }} angle={-20} textAnchor="end" />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} unit="$M" />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}` }} formatter={v => [`$${v}M/yr`]} />
                <Bar dataKey="rev" name="Annual Revenue ($M)" fill={T.gold} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
