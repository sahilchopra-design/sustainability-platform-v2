import React, { useState, useMemo } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, ScatterChart, Scatter } from "recharts";

const T = {
  bg: "#0f1117", surface: "#1a1d27", surfaceH: "#22263a", border: "#2a2d3e", borderL: "#353852",
  navy: "#1e3a5f", navyL: "#2a4f7c", gold: "#c9a84c", goldL: "#e0c068", sage: "#4a7c59", sageL: "#5a9c6e",
  teal: "#2a6b7c", text: "#e8e6df", textSec: "#9e9b93", textMut: "#6b6860", red: "#dc2626",
  green: "#16a34a", amber: "#d97706", font: "DM Sans, sans-serif", mono: "JetBrains Mono, monospace"
};

const sr = s => { const x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const TABS = [
  "Uranium Mining","Conversion & Enrichment","SWU Economics","Fuel Fabrication",
  "HALEU Supply Chain","Back-End Fuel Cycle","Fuel Cost Modelling","Market Pricing",
  "Geopolitical Risk","Strategic Stockpiles"
];

const MINES = [
  { name:"Cigar Lake",    country:"Canada",     type:"ISR",        u3o8Mlbs:18.0, grade:14.8, owner:"Cameco",        cost:12.5 },
  { name:"McArthur River",country:"Canada",     type:"Underground",u3o8Mlbs:15.1, grade:16.5, owner:"Cameco/Orano",  cost:14.2 },
  { name:"Kazatomprom",   country:"Kazakhstan", type:"ISR",        u3o8Mlbs:52.0, grade:0.06, owner:"State (KAP)",   cost:10.8 },
  { name:"Husab",         country:"Namibia",    type:"Open Pit",   u3o8Mlbs:12.0, grade:0.04, owner:"CGN (China)",   cost:24.1 },
  { name:"Rössing",       country:"Namibia",    type:"Open Pit",   u3o8Mlbs:8.0,  grade:0.03, owner:"CNNC (China)",  cost:27.3 },
  { name:"Olympic Dam",   country:"Australia",  type:"Underground",u3o8Mlbs:4.5,  grade:0.26, owner:"BHP",           cost:32.0 },
  { name:"ERA Ranger",    country:"Australia",  type:"Open Pit",   u3o8Mlbs:1.2,  grade:0.15, owner:"ERA",           cost:38.5 },
  { name:"Inkai",         country:"Kazakhstan", type:"ISR",        u3o8Mlbs:9.0,  grade:0.08, owner:"Kazatomprom/Cameco", cost:11.2 },
];

const ENRICHERS = [
  { name:"Urenco",   country:"EU/UK/US",  swuM:17.5, techology:"Centrifuge", share:27 },
  { name:"TENEX/TVEL",country:"Russia",   swuM:26.0, techology:"Centrifuge", share:40 },
  { name:"Orano",    country:"France",    swuM:10.8, techology:"Centrifuge", share:17 },
  { name:"CNNC",     country:"China",     swuM:9.0,  techology:"Centrifuge", share:14 },
  { name:"USEC/Centrus",country:"USA",    swuM:0.7,  techology:"Centrifuge", share:1  },
  { name:"GE-Hitachi",country:"USA",      swuM:0.3,  techology:"Laser (SILEX)", share:1 },
];

const FUEL_TYPES = [
  { type:"LEU PWR",  enrichment:3.5,  weight:550,  pelletDiam:8.2,  cost:300,  burn:50000 },
  { type:"LEU BWR",  enrichment:3.6,  weight:310,  pelletDiam:10.4, cost:280,  burn:45000 },
  { type:"LEU VVER", enrichment:3.8,  weight:565,  pelletDiam:7.6,  cost:290,  burn:48000 },
  { type:"CANDU NU", enrichment:0.71, weight:20,   pelletDiam:12.2, cost:105,  burn:7500  },
  { type:"MOX PWR",  enrichment:7.0,  weight:545,  pelletDiam:8.2,  cost:900,  burn:52000 },
  { type:"HALEU HTR",enrichment:19.75,weight:7,    pelletDiam:60,   cost:2800, burn:100000},
];

const HALEU_SOURCES = [
  { source:"TENEX/Rosatom",  status:"Operational", capacity:6,  enrichPct:19.75, restricted:"Yes (sanctions)" },
  { source:"Centrus (USA)",  status:"Pilot Demo",  capacity:0.6, enrichPct:19.75, restricted:"No" },
  { source:"Urenco (planned)",status:"2027 Target",capacity:10, enrichPct:19.75, restricted:"No" },
  { source:"Orano (planned)",status:"2028 Study",  capacity:8,  enrichPct:19.75, restricted:"No" },
  { source:"CNNC (China)",   status:"Operational", capacity:5,  enrichPct:19.75, restricted:"Partial" },
];

const BACKEND_STRATEGIES = [
  { strategy:"Open (Once-Through)", countries:"USA,UK,Sweden,Finland,Canada", snf:"Direct repository", cost:1.2, timeYr:80, wasteVol:"High" },
  { strategy:"Closed (Full Recycle)",countries:"France,Russia,Japan",         snf:"Reprocess → MOX",    cost:2.1, timeYr:60, wasteVol:"Low"  },
  { strategy:"Partial Recycle",      countries:"India,South Korea",            snf:"Reprocess → partial",cost:1.7, timeYr:70, wasteVol:"Med"  },
  { strategy:"Dry Cask Interim",     countries:"USA,Germany,South Korea",      snf:"Spent fuel pools + cask", cost:0.9, timeYr:100, wasteVol:"Med" },
];

const WASTE_CLASSES = [
  { class:"High-Level (HLW)",  source:"Reprocessing",   vol:"3%", activity:"95%", disposal:"Deep geological" },
  { class:"Intermediate (ILW)",source:"Fuel components",vol:"7%", activity:"4%",  disposal:"Vaults/repository" },
  { class:"Low-Level (LLW)",   source:"Operations",     vol:"90%",activity:"1%",  disposal:"Near-surface" },
  { class:"Very Low-Level",    source:"Decontam.",      vol:"Bulk",activity:"<0.1%",disposal:"Conventional landfill" },
];

function calcSwu({ feedAssay, productAssay, tailsAssay, kgU }) {
  const v = x => (2 * x - 1) * Math.log(x / (1 - x));
  const swuPerKgProduct = (v(productAssay / 100) - v(tailsAssay / 100)) - (feedAssay / 100 / (productAssay / 100) * (v(feedAssay / 100) - v(tailsAssay / 100)));
  const feedKg = kgU * (productAssay / 100 - tailsAssay / 100) / (feedAssay / 100 - tailsAssay / 100);
  return { swu: +(swuPerKgProduct * kgU).toFixed(2), feedKg: +feedKg.toFixed(1), swuPerKg: +swuPerKgProduct.toFixed(3) };
}

function calcFuelCost({ u3o8Price, conversionFee, swuPrice, fabricationFee, enrichPct, kgU }) {
  const feedAssay = 0.711; const tailsAssay = 0.3;
  const swuPerKg = (2 * enrichPct / 100 - 1) * Math.log((enrichPct / 100) / (1 - enrichPct / 100))
    - ((enrichPct / 100 - tailsAssay / 100) / (feedAssay / 100 - tailsAssay / 100)) * (2 * feedAssay / 100 - 1) * Math.log((feedAssay / 100) / (1 - feedAssay / 100));
  const feedKg = kgU * (enrichPct / 100 - tailsAssay / 100) / (feedAssay / 100 - tailsAssay / 100);
  const u3o8Cost = feedKg * u3o8Price / 0.848; // U3O8 → UF6 conversion factor
  const convCost = feedKg * conversionFee;
  const swuCost = swuPerKg * kgU * swuPrice;
  const fabCost = kgU * fabricationFee;
  return {
    u3o8Cost: +u3o8Cost.toFixed(0), convCost: +convCost.toFixed(0),
    swuCost: +swuCost.toFixed(0), fabCost: +fabCost.toFixed(0),
    total: +(u3o8Cost + convCost + swuCost + fabCost).toFixed(0),
    perMwh: +((u3o8Cost + convCost + swuCost + fabCost) / (kgU * 45) / 1000).toFixed(2)
  };
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

export default function NuclearFuelCyclePage() {
  const [tab, setTab] = useState(0);
  const [u3o8Price, setU3o8Price] = useState(65);
  const [swuPrice, setSwuPrice] = useState(130);
  const [convFee, setConvFee] = useState(12);
  const [fabFee, setFabFee] = useState(300);
  const [kgU, setKgU] = useState(1000);
  const [enrichPct, setEnrichPct] = useState(3.5);
  const [feedAssay, setFeedAssay] = useState(0.711);
  const [tailsAssay, setTailsAssay] = useState(0.3);
  const [selectedMine, setSelectedMine] = useState(0);
  const [haleuDemand, setHaleuDemand] = useState(40);

  const swuResult = useMemo(() => calcSwu({ feedAssay, productAssay: enrichPct, tailsAssay, kgU }), [feedAssay, enrichPct, tailsAssay, kgU]);
  const fuelCostResult = useMemo(() => calcFuelCost({ u3o8Price, conversionFee: convFee, swuPrice, fabricationFee: fabFee, enrichPct, kgU }), [u3o8Price, convFee, swuPrice, fabFee, enrichPct, kgU]);

  const u3o8Spot = useMemo(() => Array.from({ length: 24 }, (_, i) => ({
    mo: `${2023 + Math.floor((i) / 12)}-Q${(i % 4) + 1}`,
    spot: +(45 + sr(i * 7) * 40 + i * 1.1).toFixed(1),
    long: +(50 + sr(i * 11) * 30 + i * 0.9).toFixed(1),
  })), []);

  const swuPriceSeries = useMemo(() => Array.from({ length: 20 }, (_, i) => ({
    year: 2015 + i,
    swu: +(95 + sr(i * 13) * 60 + (i > 8 ? (i - 8) * 3 : 0)).toFixed(1),
  })), []);

  const mineData = MINES.map(m => ({ name: m.name.split(" ")[0], production: m.u3o8Mlbs, cost: m.cost }));

  const fuelCostStack = [
    { name: "U3O8", value: fuelCostResult.u3o8Cost, color: T.gold },
    { name: "Conversion", value: fuelCostResult.convCost, color: T.teal },
    { name: "Enrichment", value: fuelCostResult.swuCost, color: T.sage },
    { name: "Fabrication", value: fuelCostResult.fabCost, color: T.navyL },
  ];

  const haleuGapData = useMemo(() => Array.from({ length: 10 }, (_, i) => ({
    year: 2025 + i,
    demand: +(haleuDemand * Math.pow(1.18, i)).toFixed(0),
    supply: +(2 + (i > 2 ? (i - 2) * 4 : 0)).toFixed(0),
  })), [haleuDemand]);

  const COLORS = [T.gold, T.teal, T.sage, T.navyL, T.red, T.amber, T.green, T.goldL];

  const enricherPie = ENRICHERS.map((e, i) => ({ name: e.name, value: e.share, fill: COLORS[i] }));

  const backendCost = BACKEND_STRATEGIES.map(s => ({
    name: s.strategy.split(" ")[0],
    cost: s.cost, time: s.timeYr,
  }));

  const wasteRadar = [
    { category: "Volume", A: 3, B: 30, C: 17, D: 100 },
    { category: "Activity", A: 95, B: 40, C: 25, D: 5 },
    { category: "Cost/tHM", A: 90, B: 60, C: 70, D: 20 },
    { category: "Public Risk", A: 70, B: 40, C: 50, D: 15 },
    { category: "Time Horizon", A: 85, B: 60, C: 70, D: 30 },
  ];

  const sensitivityData = [
    { param: "U3O8 Price", low: fuelCostResult.perMwh * 0.7, base: fuelCostResult.perMwh, high: fuelCostResult.perMwh * 1.4 },
    { param: "SWU Price", low: fuelCostResult.perMwh * 0.8, base: fuelCostResult.perMwh, high: fuelCostResult.perMwh * 1.25 },
    { param: "Fabrication", low: fuelCostResult.perMwh * 0.9, base: fuelCostResult.perMwh, high: fuelCostResult.perMwh * 1.15 },
    { param: "Tails Assay", low: fuelCostResult.perMwh * 0.95, base: fuelCostResult.perMwh, high: fuelCostResult.perMwh * 1.08 },
    { param: "Burnup MWd/tU", low: fuelCostResult.perMwh * 1.2, base: fuelCostResult.perMwh, high: fuelCostResult.perMwh * 0.85 },
  ];

  const stockpileData = [
    { country: "USA", u3o8Mlbs: 50, ue6Mlbs: 30, swuM: 3.2, months: 30 },
    { country: "France", u3o8Mlbs: 32, ue6Mlbs: 18, swuM: 1.8, months: 24 },
    { country: "China", u3o8Mlbs: 200, ue6Mlbs: 80, swuM: 8.0, months: 48 },
    { country: "Japan", u3o8Mlbs: 25, ue6Mlbs: 12, swuM: 1.2, months: 36 },
    { country: "S.Korea", u3o8Mlbs: 18, ue6Mlbs: 8, swuM: 0.9, months: 24 },
    { country: "UK", u3o8Mlbs: 8, ue6Mlbs: 5, swuM: 0.4, months: 18 },
  ];

  const tabContent = () => {
    switch (tab) {
      case 0: return (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
            <KpiCard label="Global U3O8 Demand" value="180 Mlbs" sub="2024 demand (±5% yr)" />
            <KpiCard label="Spot Price (U3O8)" value={`$${u3o8Price}/lb`} sub="LME equivalent" />
            <KpiCard label="Top Producer" value="Kazakhstan" sub="43% global share" color={T.teal} />
            <KpiCard label="Mine Types" value="ISR dominant" sub="60% of supply" color={T.sage} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Mine Production (Mlbs U3O8/yr)</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={mineData}>
                  <XAxis dataKey="name" tick={{ fill: T.textMut, fontSize: 10 }} />
                  <YAxis tick={{ fill: T.textMut, fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, color: T.text }} />
                  <Bar dataKey="production" fill={T.gold} radius={[3,3,0,0]} name="Mlbs/yr" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>All-In Sustaining Cost ($/lb U3O8)</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={mineData} layout="vertical">
                  <XAxis type="number" tick={{ fill: T.textMut, fontSize: 10 }} />
                  <YAxis dataKey="name" type="category" tick={{ fill: T.textMut, fontSize: 10 }} width={80} />
                  <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, color: T.text }} />
                  <Bar dataKey="cost" fill={T.teal} radius={[0,3,3,0]} name="$/lb" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ marginTop: 16, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16, overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {["Mine","Country","Type","Production (Mlbs)","Grade (%)","Owner","AISC ($/lb)"].map(h => (
                    <th key={h} style={{ padding: "8px 10px", color: T.textSec, textAlign: "left", fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MINES.map((m, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, cursor: "pointer", background: selectedMine === i ? T.surfaceH : "transparent" }}
                    onClick={() => setSelectedMine(i)}>
                    <td style={{ padding: "8px 10px", color: T.text }}>{m.name}</td>
                    <td style={{ padding: "8px 10px", color: T.textSec }}>{m.country}</td>
                    <td style={{ padding: "8px 10px", color: T.gold }}>{m.type}</td>
                    <td style={{ padding: "8px 10px", color: T.text, fontFamily: T.mono }}>{m.u3o8Mlbs}</td>
                    <td style={{ padding: "8px 10px", color: T.teal, fontFamily: T.mono }}>{m.grade}%</td>
                    <td style={{ padding: "8px 10px", color: T.textSec }}>{m.owner}</td>
                    <td style={{ padding: "8px 10px", color: T.sage, fontFamily: T.mono }}>${m.cost}</td>
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
            <KpiCard label="Global SWU Supply" value="64M SWU/yr" sub="2024 capacity" />
            <KpiCard label="Conversion Capacity" value="65 ktU/yr" sub="UO2 → UF6" />
            <KpiCard label="Russia Share (SWU)" value="40%" sub="TENEX/TVEL dominant" color={T.red} />
            <KpiCard label="Centrifuge Share" value="~99%" sub="vs laser enrichment" color={T.sage} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Global SWU Market Share (%)</div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={enricherPie} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name">
                    {enricherPie.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, color: T.text }}
                    formatter={(v, n) => [`${v}%`, n]} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                {ENRICHERS.map((e, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: COLORS[i] }} />
                    <span style={{ color: T.textSec }}>{e.name} ({e.share}%)</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Enrichment Capacity (M SWU/yr)</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={ENRICHERS.map(e => ({ name: e.name, swuM: e.swuM }))}>
                  <XAxis dataKey="name" tick={{ fill: T.textMut, fontSize: 10 }} />
                  <YAxis tick={{ fill: T.textMut, fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, color: T.text }} />
                  <Bar dataKey="swuM" fill={T.teal} radius={[3,3,0,0]} name="M SWU/yr" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
            <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {["Enricher","Country","Capacity (M SWU)","Technology","Market Share"].map(h => (
                    <th key={h} style={{ padding: "8px 10px", color: T.textSec, textAlign: "left", fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ENRICHERS.map((e, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: "8px 10px", color: T.text }}>{e.name}</td>
                    <td style={{ padding: "8px 10px", color: T.textSec }}>{e.country}</td>
                    <td style={{ padding: "8px 10px", color: T.gold, fontFamily: T.mono }}>{e.swuM}</td>
                    <td style={{ padding: "8px 10px", color: T.teal }}>{e.techology}</td>
                    <td style={{ padding: "8px 10px", color: T.sage, fontFamily: T.mono }}>{e.share}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
      case 2: return (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
              <div style={{ fontSize: 13, color: T.gold, marginBottom: 16 }}>SWU Calculator</div>
              <Slider label="Product Enrichment (%)" min={0.72} max={5} step={0.1} value={enrichPct} onChange={setEnrichPct} fmt={v => `${v}%`} />
              <Slider label="Feed Assay (%)" min={0.3} max={1.0} step={0.001} value={feedAssay} onChange={setFeedAssay} fmt={v => `${v.toFixed(3)}%`} />
              <Slider label="Tails Assay (%)" min={0.1} max={0.4} step={0.01} value={tailsAssay} onChange={setTailsAssay} fmt={v => `${v.toFixed(2)}%`} />
              <Slider label="Product Quantity (kgU)" min={100} max={10000} step={100} value={kgU} onChange={setKgU} fmt={v => `${v.toLocaleString()} kgU`} />
              <div style={{ background: T.surfaceH, borderRadius: 6, padding: 12, marginTop: 16 }}>
                <div style={{ fontSize: 11, color: T.textMut, marginBottom: 8, fontFamily: T.mono }}>SWU CALCULATION RESULTS</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div><div style={{ fontSize: 10, color: T.textMut }}>SWU Required</div><div style={{ color: T.gold, fontFamily: T.mono, fontSize: 16, fontWeight: 700 }}>{swuResult.swu.toLocaleString()}</div></div>
                  <div><div style={{ fontSize: 10, color: T.textMut }}>Feed Required (kgU)</div><div style={{ color: T.teal, fontFamily: T.mono, fontSize: 16, fontWeight: 700 }}>{swuResult.feedKg.toLocaleString()}</div></div>
                  <div><div style={{ fontSize: 10, color: T.textMut }}>SWU per kgU Product</div><div style={{ color: T.sage, fontFamily: T.mono, fontSize: 16, fontWeight: 700 }}>{swuResult.swuPerKg}</div></div>
                  <div><div style={{ fontSize: 10, color: T.textMut }}>Feed-to-Product Ratio</div><div style={{ color: T.amber, fontFamily: T.mono, fontSize: 16, fontWeight: 700 }}>{kgU > 0 ? (swuResult.feedKg / kgU).toFixed(2) : "—"}</div></div>
                </div>
              </div>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>SWU Price History ($/SWU)</div>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={swuPriceSeries}>
                  <XAxis dataKey="year" tick={{ fill: T.textMut, fontSize: 10 }} />
                  <YAxis tick={{ fill: T.textMut, fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, color: T.text }} />
                  <Line type="monotone" dataKey="swu" stroke={T.gold} dot={false} strokeWidth={2} name="SWU Price ($/SWU)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ marginTop: 20, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
            <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>SWU Requirements vs Enrichment Level (per kgU product)</div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={Array.from({ length: 20 }, (_, i) => {
                const ep = 1 + i * 0.5;
                const v = x => (2 * x - 1) * Math.log(x / (1 - x));
                const s = v(ep / 100) - v(0.3 / 100) - ((ep / 100 - 0.3 / 100) / (0.711 / 100 - 0.3 / 100)) * (v(0.711 / 100) - v(0.3 / 100));
                return { enrichment: ep.toFixed(1), swu: +s.toFixed(3) };
              })}>
                <XAxis dataKey="enrichment" tick={{ fill: T.textMut, fontSize: 10 }} label={{ value: "Enrichment %", fill: T.textMut, fontSize: 10, position: "insideBottom" }} />
                <YAxis tick={{ fill: T.textMut, fontSize: 10 }} label={{ value: "SWU/kgU", fill: T.textMut, fontSize: 10, angle: -90 }} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, color: T.text }} />
                <Line type="monotone" dataKey="swu" stroke={T.teal} dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
      case 3: return (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
            <KpiCard label="Global Fuel Fab Capacity" value="13,000 tHM/yr" sub="UO2 + MOX" />
            <KpiCard label="MOX Share" value="~5%" sub="of total fabrication" color={T.amber} />
            <KpiCard label="Lead Time" value="18–24 months" sub="order to delivery" color={T.teal} />
            <KpiCard label="Burnup Trend" value="↑ 55,000 MWd/tU" sub="from 45,000 (2010)" color={T.sage} />
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16, marginBottom: 20 }}>
            <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {["Fuel Type","Enrichment %","Assembly Weight (kgU)","Pellet Diam (mm)","Fab Cost ($/kgU)","Design Burnup (MWd/tU)"].map(h => (
                    <th key={h} style={{ padding: "8px 10px", color: T.textSec, textAlign: "left", fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FUEL_TYPES.map((f, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: "8px 10px", color: T.text }}>{f.type}</td>
                    <td style={{ padding: "8px 10px", color: T.teal, fontFamily: T.mono }}>{f.enrichment}%</td>
                    <td style={{ padding: "8px 10px", color: T.textSec, fontFamily: T.mono }}>{f.weight}</td>
                    <td style={{ padding: "8px 10px", color: T.textSec, fontFamily: T.mono }}>{f.pelletDiam}</td>
                    <td style={{ padding: "8px 10px", color: T.gold, fontFamily: T.mono }}>${f.cost}</td>
                    <td style={{ padding: "8px 10px", color: T.sage, fontFamily: T.mono }}>{f.burn.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Fabrication Cost by Fuel Type ($/kgU)</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={FUEL_TYPES.map(f => ({ name: f.type.split(" ")[0], cost: f.cost }))}>
                  <XAxis dataKey="name" tick={{ fill: T.textMut, fontSize: 10 }} />
                  <YAxis tick={{ fill: T.textMut, fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, color: T.text }} />
                  <Bar dataKey="cost" fill={T.gold} radius={[3,3,0,0]} name="$/kgU" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Burnup Improvement — LEU PWR (MWd/tU)</div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={Array.from({ length: 15 }, (_, i) => ({ year: 2010 + i, burnup: +(45000 + i * 700 + sr(i * 5) * 500).toFixed(0) }))}>
                  <XAxis dataKey="year" tick={{ fill: T.textMut, fontSize: 10 }} />
                  <YAxis tick={{ fill: T.textMut, fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, color: T.text }} />
                  <Line type="monotone" dataKey="burnup" stroke={T.teal} dot={false} strokeWidth={2} name="MWd/tU" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      );
      case 4: return (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
            <KpiCard label="HALEU Demand 2030E" value="40 tU/yr" sub="per 300MW-equiv fleet" />
            <KpiCard label="Current Supply" value="~2 tU/yr" sub="Centrus demo plant" color={T.red} />
            <KpiCard label="HALEU Price Est." value="$2,800/kgU" sub="vs $300 LEU" color={T.amber} />
            <KpiCard label="Supply Gap 2030" value=">90%" sub="requires new facilities" color={T.red} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>HALEU Demand vs Supply Gap (tU/yr)</div>
              <Slider label="HALEU Demand Baseline (tU/yr, 2025)" min={10} max={100} step={5} value={haleuDemand} onChange={setHaleuDemand} fmt={v => `${v} tU/yr`} />
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={haleuGapData}>
                  <XAxis dataKey="year" tick={{ fill: T.textMut, fontSize: 10 }} />
                  <YAxis tick={{ fill: T.textMut, fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, color: T.text }} />
                  <Bar dataKey="demand" fill={T.gold} name="Demand (tU)" />
                  <Bar dataKey="supply" fill={T.teal} name="Supply (tU)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>HALEU Supply Sources (2024 Status)</div>
              <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                    {["Source","Status","Capacity (tU)","Restricted"].map(h => (
                      <th key={h} style={{ padding: "6px 8px", color: T.textSec, textAlign: "left" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {HALEU_SOURCES.map((s, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: "6px 8px", color: T.text }}>{s.source}</td>
                      <td style={{ padding: "6px 8px", color: s.status.includes("Operational") ? T.green : s.status.includes("planned") ? T.amber : T.teal }}>{s.status}</td>
                      <td style={{ padding: "6px 8px", color: T.gold, fontFamily: T.mono }}>{s.capacity}</td>
                      <td style={{ padding: "6px 8px", color: s.restricted === "Yes (sanctions)" ? T.red : s.restricted === "Partial" ? T.amber : T.green }}>{s.restricted}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
            <div style={{ fontSize: 13, color: T.gold, marginBottom: 12 }}>HALEU vs LEU Cost Premium Analysis</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
              {[{ label: "Enrichment Cost Premium", value: "9×", sub: "19.75% vs 3.5% LEU" },
                { label: "Conversion Cost", value: "+15%", sub: "higher UF6 handling" },
                { label: "Total Fuel Premium", value: "8–12×", sub: "over standard LEU" }].map((k, i) => (
                <div key={i} style={{ background: T.surfaceH, borderRadius: 6, padding: 14, textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: T.textMut, marginBottom: 4 }}>{k.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: T.amber }}>{k.value}</div>
                  <div style={{ fontSize: 11, color: T.textSec }}>{k.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
      case 5: return (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
            <KpiCard label="Global SNF Inventory" value="~400,000 tHM" sub="accumulated worldwide" />
            <KpiCard label="Reprocessing Capacity" value="~3,000 tHM/yr" sub="France + Russia" color={T.teal} />
            <KpiCard label="Open Repositories" value="2" sub="Finland (2025) + Sweden" color={T.sage} />
            <KpiCard label="Back-End Cost" value="$0.9–2.1/MWh" sub="per strategy" color={T.amber} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Back-End Strategy Comparison</div>
              <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                    {["Strategy","Countries","SNF Route","Cost ($/MWh)","Timeframe"].map(h => (
                      <th key={h} style={{ padding: "6px 8px", color: T.textSec, textAlign: "left" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {BACKEND_STRATEGIES.map((s, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: "6px 8px", color: T.text, fontWeight: 600 }}>{s.strategy}</td>
                      <td style={{ padding: "6px 8px", color: T.textSec, fontSize: 10 }}>{s.countries}</td>
                      <td style={{ padding: "6px 8px", color: T.teal }}>{s.snf}</td>
                      <td style={{ padding: "6px 8px", color: T.gold, fontFamily: T.mono }}>${s.cost}</td>
                      <td style={{ padding: "6px 8px", color: T.textSec, fontFamily: T.mono }}>{s.timeYr} yr</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Waste Classification Matrix</div>
              <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                    {["Class","Source","Volume","Activity","Disposal"].map(h => (
                      <th key={h} style={{ padding: "6px 8px", color: T.textSec, textAlign: "left" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {WASTE_CLASSES.map((w, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: "6px 8px", color: T.gold, fontWeight: 600 }}>{w.class}</td>
                      <td style={{ padding: "6px 8px", color: T.textSec }}>{w.source}</td>
                      <td style={{ padding: "6px 8px", color: T.teal, fontFamily: T.mono }}>{w.vol}</td>
                      <td style={{ padding: "6px 8px", color: T.red, fontFamily: T.mono }}>{w.activity}</td>
                      <td style={{ padding: "6px 8px", color: T.textSec }}>{w.disposal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
            <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Back-End Cost vs Timeframe</div>
            <ResponsiveContainer width="100%" height={180}>
              <ScatterChart>
                <XAxis dataKey="time" name="Timeframe (yr)" tick={{ fill: T.textMut, fontSize: 10 }} label={{ value: "Years", fill: T.textMut, fontSize: 10, position: "insideBottom" }} />
                <YAxis dataKey="cost" name="Cost ($/MWh)" tick={{ fill: T.textMut, fontSize: 10 }} label={{ value: "$/MWh", fill: T.textMut, fontSize: 10, angle: -90 }} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, color: T.text }} cursor={{ strokeDasharray: "3 3" }} />
                <Scatter data={backendCost} fill={T.gold} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
      case 6: return (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
              <div style={{ fontSize: 13, color: T.gold, marginBottom: 16 }}>Fuel Cost Model</div>
              <Slider label="U3O8 Spot Price ($/lb)" min={30} max={130} step={1} value={u3o8Price} onChange={setU3o8Price} fmt={v => `$${v}/lb`} />
              <Slider label="SWU Price ($/SWU)" min={80} max={200} step={5} value={swuPrice} onChange={setSwuPrice} fmt={v => `$${v}/SWU`} />
              <Slider label="Conversion Fee ($/kgU)" min={5} max={25} step={1} value={convFee} onChange={setConvFee} fmt={v => `$${v}/kgU`} />
              <Slider label="Fabrication Fee ($/kgU)" min={150} max={500} step={10} value={fabFee} onChange={setFabFee} fmt={v => `$${v}/kgU`} />
              <Slider label="Product Enrichment (%)" min={1} max={5} step={0.1} value={enrichPct} onChange={setEnrichPct} fmt={v => `${v}%`} />
              <Slider label="Quantity (kgU HM)" min={100} max={10000} step={100} value={kgU} onChange={setKgU} fmt={v => `${v.toLocaleString()} kgU`} />
              <div style={{ background: T.surfaceH, borderRadius: 6, padding: 12, marginTop: 8 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[
                    { label: "Total Cost", val: `$${fuelCostResult.total.toLocaleString()}`, color: T.gold },
                    { label: "$/MWhe", val: `$${fuelCostResult.perMwh}`, color: T.teal },
                    { label: "U3O8 Component", val: `$${fuelCostResult.u3o8Cost.toLocaleString()}`, color: T.amber },
                    { label: "Enrichment (SWU)", val: `$${fuelCostResult.swuCost.toLocaleString()}`, color: T.sage },
                  ].map((k, i) => (
                    <div key={i}><div style={{ fontSize: 10, color: T.textMut }}>{k.label}</div><div style={{ color: k.color, fontFamily: T.mono, fontSize: 16, fontWeight: 700 }}>{k.val}</div></div>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Fuel Cost Stack ($)</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={[{ name: "Total" }]}>
                  <XAxis dataKey="name" tick={{ fill: T.textMut, fontSize: 10 }} />
                  <YAxis tick={{ fill: T.textMut, fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, color: T.text }} />
                  {fuelCostStack.map(s => <Bar key={s.name} dataKey={() => s.value} name={s.name} stackId="a" fill={s.color} />)}
                </BarChart>
              </ResponsiveContainer>
              <div style={{ marginTop: 12 }}>
                {fuelCostStack.map((s, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: `1px solid ${T.border}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: s.color }} />
                      <span style={{ fontSize: 12, color: T.textSec }}>{s.name}</span>
                    </div>
                    <span style={{ fontSize: 12, color: s.color, fontFamily: T.mono }}>${s.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
            <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Fuel Cost Sensitivity ($/MWhe)</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={sensitivityData} layout="vertical">
                <XAxis type="number" tick={{ fill: T.textMut, fontSize: 10 }} />
                <YAxis dataKey="param" type="category" tick={{ fill: T.textMut, fontSize: 10 }} width={90} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, color: T.text }} />
                <Bar dataKey="low" fill={T.teal} name="Low" stackId="a" />
                <Bar dataKey="high" fill={T.gold} name="High" stackId="b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
      case 7: return (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
            <KpiCard label="U3O8 Spot ($/lb)" value={`$${u3o8Price}`} sub="LME equivalent" />
            <KpiCard label="SWU Spot ($/SWU)" value={`$${swuPrice}`} sub="Urenco benchmark" color={T.teal} />
            <KpiCard label="UF6 Conversion ($/kgU)" value={`$${convFee}`} sub="ConverDyn/Cameco" color={T.sage} />
            <KpiCard label="Fuel Assembly ($/MWhe)" value={`$${fuelCostResult.perMwh}`} sub="All-in fuel cost" color={T.amber} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>U3O8 Spot vs Long-Term Price ($/lb)</div>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={u3o8Spot}>
                  <XAxis dataKey="mo" tick={{ fill: T.textMut, fontSize: 9 }} interval={3} />
                  <YAxis tick={{ fill: T.textMut, fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, color: T.text }} />
                  <Line type="monotone" dataKey="spot" stroke={T.gold} dot={false} strokeWidth={2} name="Spot" />
                  <Line type="monotone" dataKey="long" stroke={T.teal} dot={false} strokeWidth={2} name="Long-Term" strokeDasharray="4 2" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Uranium Market Structure</div>
              {[
                { label: "Spot Market", pct: 20, desc: "Price discovery, ~35M lbs/yr" },
                { label: "Long-Term Contracts", pct: 60, desc: "Utility offtake, multi-year" },
                { label: "State-to-State", pct: 15, desc: "Gov intergovernmental" },
                { label: "Secondary Market", pct: 5, desc: "SWU tails, recycled U" },
              ].map((s, i) => (
                <div key={i} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.textSec, marginBottom: 4 }}>
                    <span>{s.label}</span><span style={{ color: T.gold, fontFamily: T.mono }}>{s.pct}%</span>
                  </div>
                  <div style={{ height: 6, background: T.border, borderRadius: 3 }}>
                    <div style={{ width: `${s.pct}%`, height: "100%", background: COLORS[i], borderRadius: 3 }} />
                  </div>
                  <div style={{ fontSize: 10, color: T.textMut, marginTop: 2 }}>{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
      case 8: return (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
            <KpiCard label="Russian SWU Share" value="40%" sub="Critical dependency" color={T.red} />
            <KpiCard label="Kazakhstan U Share" value="43%" sub="Geopolitical risk" color={T.amber} />
            <KpiCard label="US-Russia SWU Ban" value="2024" sub="Prohibits most imports" color={T.red} />
            <KpiCard label="Supply Diversification" value="Medium" sub="5+ year transition" color={T.amber} />
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: T.gold, marginBottom: 12 }}>Geopolitical Risk Matrix — Uranium Supply Chain</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
              {[
                { region: "Russia/CIS", riskLvl: "HIGH", u3o8Share: "43% (Kaz)", swuShare: "40%", convShare: "25%", scenario: "US SWU ban (2024); supply chain disruption risk", color: T.red },
                { region: "Australia/Canada", riskLvl: "LOW", u3o8Share: "30%", swuShare: "0%", convShare: "40%", scenario: "Stable; allied producers; key diversification source", color: T.green },
                { region: "Africa (Namibia/Niger)", riskLvl: "MEDIUM", u3o8Share: "20%", swuShare: "0%", convShare: "0%", scenario: "Niger coup 2023 disrupted Orano; Namibia stable", color: T.amber },
              ].map((r, i) => (
                <div key={i} style={{ background: T.surfaceH, borderRadius: 6, padding: 14, borderLeft: `3px solid ${r.color}` }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: r.color, marginBottom: 8 }}>{r.region}</div>
                  <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>Risk Level: <span style={{ color: r.color, fontWeight: 600 }}>{r.riskLvl}</span></div>
                  <div style={{ fontSize: 11, color: T.textSec }}>U3O8: {r.u3o8Share} | SWU: {r.swuShare}</div>
                  <div style={{ fontSize: 11, color: T.textMut, marginTop: 8 }}>{r.scenario}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
            <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Supply Chain Disruption Scenarios — Fuel Cost Impact ($/MWhe)</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={[
                { scenario: "Base Case", cost: fuelCostResult.perMwh },
                { scenario: "Russia SWU Loss", cost: +(fuelCostResult.perMwh * 1.35).toFixed(2) },
                { scenario: "Niger U Loss", cost: +(fuelCostResult.perMwh * 1.12).toFixed(2) },
                { scenario: "Both Shocks", cost: +(fuelCostResult.perMwh * 1.55).toFixed(2) },
                { scenario: "Full Reshoring", cost: +(fuelCostResult.perMwh * 1.8).toFixed(2) },
              ]}>
                <XAxis dataKey="scenario" tick={{ fill: T.textMut, fontSize: 10 }} />
                <YAxis tick={{ fill: T.textMut, fontSize: 10 }} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, color: T.text }} />
                <Bar dataKey="cost" radius={[3,3,0,0]} name="$/MWhe">
                  {[T.teal, T.red, T.amber, T.red, T.amber].map((c, i) => <Cell key={i} fill={c} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
      case 9: return (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
            <KpiCard label="US Strategic Stockpile" value="50 Mlbs" sub="~2.5 yrs demand" />
            <KpiCard label="China Strategic Reserve" value="200 Mlbs" sub="Largest in world" color={T.amber} />
            <KpiCard label="Avg Utility Inventory" value="2–3 yrs" sub="Forward coverage" color={T.teal} />
            <KpiCard label="OECD NEA Buffer" value="6 months" sub="Strategic minimum" color={T.sage} />
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>National Uranium Stockpile Inventory</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stockpileData}>
                <XAxis dataKey="country" tick={{ fill: T.textMut, fontSize: 10 }} />
                <YAxis tick={{ fill: T.textMut, fontSize: 10 }} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, color: T.text }} />
                <Bar dataKey="u3o8Mlbs" fill={T.gold} name="U3O8 (Mlbs)" radius={[3,3,0,0]} />
                <Bar dataKey="ue6Mlbs" fill={T.teal} name="UF6 (Mlbs equiv.)" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 }}>
            <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {["Country","U3O8 (Mlbs)","UF6 (Mlbs eq.)","SWU Reserve (M)","Forward Cover (months)"].map(h => (
                    <th key={h} style={{ padding: "8px 10px", color: T.textSec, textAlign: "left", fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stockpileData.map((s, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: "8px 10px", color: T.text, fontWeight: 600 }}>{s.country}</td>
                    <td style={{ padding: "8px 10px", color: T.gold, fontFamily: T.mono }}>{s.u3o8Mlbs}</td>
                    <td style={{ padding: "8px 10px", color: T.teal, fontFamily: T.mono }}>{s.ue6Mlbs}</td>
                    <td style={{ padding: "8px 10px", color: T.sage, fontFamily: T.mono }}>{s.swuM}</td>
                    <td style={{ padding: "8px 10px", color: s.months >= 36 ? T.green : s.months >= 24 ? T.amber : T.red, fontFamily: T.mono }}>{s.months}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
            <div style={{ fontSize: 11, color: T.gold, fontFamily: T.mono, letterSpacing: 2, marginBottom: 6 }}>EP-DU3 · NUCLEAR FUEL CYCLE ECONOMICS</div>
            <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, color: T.text }}>Nuclear Fuel Cycle Finance Intelligence</h1>
            <div style={{ fontSize: 13, color: T.textSec, marginTop: 4 }}>Uranium Mining · Enrichment SWU Economics · HALEU Supply Chain · Back-End Fuel Cycle · Strategic Stockpiles</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono }}>FUEL COST</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: T.gold }}>${fuelCostResult.perMwh}/MWhe</div>
            <div style={{ fontSize: 11, color: T.textSec }}>{enrichPct}% LEU · {kgU.toLocaleString()} kgU batch</div>
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
