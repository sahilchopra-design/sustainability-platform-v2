/**
 * EP-BC1 — Residential Real Estate Assessment Panel
 * Sprint BC | Real Estate & Property Risk
 *
 * Coverage: portfolio valuation, climate/physical risk overlay, EPC/energy transition,
 * stranded-asset modelling, mortgage affordability stress, green premium analysis.
 */
import React, { useState, useMemo } from "react";
import {
  BarChart, Bar, LineChart, Line, ScatterChart, Scatter,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell
} from "recharts";

/* ── Theme ─────────────────────────────────────────────────────────────────── */
const T = {
  navy:  "#1b3a5c",
  gold:  "#c5a96a",
  cream: "#f7f4ef",
  slate: "#64748b",
  font:  "'DM Sans', sans-serif",
  mono:  "'JetBrains Mono', monospace",
  green: "#059669",
  red:   "#dc2626",
  amber: "#d97706",
  blue:  "#2563eb",
  purple:"#7c3aed",
  teal:  "#0e7490",
  card:  "#ffffff", sub:  "#5c6b7e", indigo:  "#4f46e5",
};

/* ── Seeded random ──────────────────────────────────────────────────────────── */
const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const pick = (arr, s) => arr[Math.floor(sr(s) * arr.length)];

/* ── Constants ───────────────────────────────────────────────────────────────── */
const REGIONS   = ["London","South East","North West","Yorkshire","East Midlands","Scotland","Wales","South West","East of England","Northern Ireland"];
const PROP_TYPES= ["Terraced","Semi-Detached","Detached","Flat/Apartment","Bungalow"];
const EPC_GRADES= ["A","B","C","D","E","F","G"];
const TENURE    = ["Owner-Occupied","Buy-to-Let","Social Housing","Shared Ownership"];

/* ── Property portfolio ──────────────────────────────────────────────────────── */
const genProperties = (n) => Array.from({ length: n }, (_, i) => {
  const epcIdx   = Math.min(6, Math.floor(sr(i * 7) * 7));
  const epc      = EPC_GRADES[epcIdx];
  const value    = Math.round(150 + sr(i * 11) * 1350);  // £k
  const ltv      = +(0.45 + sr(i * 13) * 0.45).toFixed(2);
  const physRisk = Math.round(10 + sr(i * 17) * 80);
  const floodZ   = sr(i * 19) > 0.75;
  const costToC  = epcIdx > 2 ? Math.round(5 + sr(i * 23) * 35) : 0; // £k to reach C
  const greenPrem= epcIdx <= 1 ? +(2 + sr(i * 29) * 8).toFixed(1) : 0;
  const stranded = epcIdx >= 5 && sr(i * 31) > 0.4;
  return {
    id: i + 1,
    uprn: `UPRN-${String(100000 + i).slice(1)}`,
    region: pick(REGIONS, i * 37),
    propType: pick(PROP_TYPES, i * 41),
    tenure: pick(TENURE, i * 43),
    epc,
    epcIdx,
    value,
    ltv,
    physRisk,
    floodZone: floodZ,
    costToC,
    greenPrem,
    stranded,
    buildYear: 1920 + Math.round(sr(i * 47) * 100),
    sqm: Math.round(55 + sr(i * 53) * 150),
    energyKwh: Math.round(8000 + epcIdx * 4000 + sr(i * 59) * 6000),
  };
});

const PROPERTIES = genProperties(60);

/* ── Time-series data ────────────────────────────────────────────────────────── */
const PRICE_TREND = [
  { year: 2015, london: 480, ukAvg: 190, northWest: 160, scotland: 175 },
  { year: 2016, london: 490, ukAvg: 200, northWest: 163, scotland: 178 },
  { year: 2017, london: 485, ukAvg: 208, northWest: 168, scotland: 181 },
  { year: 2018, london: 478, ukAvg: 215, northWest: 172, scotland: 185 },
  { year: 2019, london: 472, ukAvg: 218, northWest: 175, scotland: 189 },
  { year: 2020, london: 488, ukAvg: 235, northWest: 185, scotland: 200 },
  { year: 2021, london: 515, ukAvg: 275, northWest: 212, scotland: 228 },
  { year: 2022, london: 532, ukAvg: 295, northWest: 228, scotland: 245 },
  { year: 2023, london: 508, ukAvg: 278, northWest: 215, scotland: 233 },
  { year: 2024, london: 518, ukAvg: 283, northWest: 219, scotland: 237 },
];

const STRESS_SCENARIOS = [
  { scenario: "Base", hpi: 0, mortgageRate: 4.5, affordPct: 35 },
  { scenario: "+2°C Physical", hpi: -5, mortgageRate: 4.5, affordPct: 38 },
  { scenario: "+4°C Physical", hpi: -18, mortgageRate: 4.5, affordPct: 45 },
  { scenario: "Rate +200bps", hpi: -12, mortgageRate: 6.5, affordPct: 52 },
  { scenario: "EPC regs 2028", hpi: -8, mortgageRate: 4.5, affordPct: 40 },
  { scenario: "Flood repricing", hpi: -25, mortgageRate: 4.5, affordPct: 44 },
  { scenario: "Combined stress", hpi: -32, mortgageRate: 6.5, affordPct: 58 },
];

const RETROFIT_COSTS = EPC_GRADES.map((g, i) => ({
  grade: g,
  avgCost: [0, 2, 8, 18, 28, 42, 62][i],
  count: PROPERTIES.filter(p => p.epc === g).length,
}));

/* ── Helpers ──────────────────────────────────────────────────────────────── */
const pill = (label, bg, fg = "#fff") => (
  <span style={{ background: bg, color: fg, borderRadius: 4, padding: "2px 7px", fontSize: 11, fontFamily: T.mono, fontWeight: 600 }}>
    {label}
  </span>
);
const card = (children, style = {}) => (
  <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: 20, ...style }}>
    {children}
  </div>
);
const SH = ({ title, sub }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ fontWeight: 700, fontSize: 15, color: T.navy }}>{title}</div>
    {sub && <div style={{ fontSize: 12, color: T.slate, marginTop: 2 }}>{sub}</div>}
  </div>
);

const epcColor = (g) => ({ A: "#059669", B: "#16a34a", C: "#65a30d", D: "#d97706", E: "#ea580c", F: "#dc2626", G: "#991b1b" }[g] || T.slate);
const physColor = (s) => s > 65 ? T.red : s > 40 ? T.amber : T.green;

/* ── Tab 1: Portfolio Overview ───────────────────────────────────────────── */
const PortfolioOverview = () => {
  const totalValue  = PROPERTIES.reduce((s,p) => s + p.value, 0);
  const floodCount  = PROPERTIES.filter(p => p.floodZone).length;
  const strandedCnt = PROPERTIES.filter(p => p.stranded).length;
  const avgLtv      = (PROPERTIES.reduce((s,p) => s + p.ltv, 0) / (PROPERTIES.length || 1) * 100).toFixed(1);

  const regionAgg = REGIONS.map(r => {
    const props = PROPERTIES.filter(p => p.region === r);
    return {
      region: r.length > 8 ? r.slice(0,8) : r,
      count: props.length,
      avgValue: props.length ? Math.round(props.reduce((s,p) => s+p.value,0)/props.length) : 0,
    };
  }).filter(r => r.count > 0);

  const epcDist = EPC_GRADES.map(g => ({
    grade: g,
    count: PROPERTIES.filter(p => p.epc === g).length,
    pct: +(PROPERTIES.filter(p => p.epc === g).length / (PROPERTIES.length || 1) * 100).toFixed(1),
  }));

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 20 }}>
        {[
          { label: "Portfolio (properties)", value: PROPERTIES.length },
          { label: "Total Value (£k)", value: `£${totalValue.toLocaleString()}k`, color: T.blue },
          { label: "Flood Zone exposure", value: `${floodCount} (${(floodCount/PROPERTIES.length*100).toFixed(0)}%)`, color: T.amber },
          { label: "Stranded-risk assets", value: `${strandedCnt} (${(strandedCnt/PROPERTIES.length*100).toFixed(0)}%)`, color: T.red },
        ].map(m => card(
          <>
            <div style={{ fontSize: 11, color: T.slate, marginBottom: 6 }}>{m.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: m.color || T.navy, fontFamily: T.mono }}>{m.value}</div>
          </>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {card(
          <>
            <SH title="UK House Price Index by Region" sub="Average price (£k) — 2015–2024" />
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={PRICE_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="year" tick={{ fontSize: 11, fontFamily: T.mono }} />
                <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} unit="k" />
                <Tooltip formatter={(v) => `£${v}k`} />
                <Legend />
                <Line dataKey="london"   name="London"    stroke={T.navy}  strokeWidth={2} dot={false} />
                <Line dataKey="ukAvg"    name="UK Avg"    stroke={T.gold}  strokeWidth={2} dot={false} />
                <Line dataKey="northWest"name="NW"        stroke={T.teal}  strokeWidth={2} dot={false} strokeDasharray="4 2" />
                <Line dataKey="scotland" name="Scotland"  stroke={T.green} strokeWidth={2} dot={false} strokeDasharray="2 2" />
              </LineChart>
            </ResponsiveContainer>
          </>
        )}
        {card(
          <>
            <SH title="EPC Distribution — Portfolio" sub="Energy Performance Certificate grades (A best, G worst)" />
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={epcDist}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="grade" tick={{ fontSize: 13, fontFamily: T.mono, fontWeight: 700 }} />
                <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} />
                <Tooltip formatter={(v, n) => n === "count" ? `${v} properties` : `${v}%`} />
                <Bar dataKey="count" name="Properties" radius={[4,4,0,0]}>
                  {epcDist.map((d, i) => <Cell key={i} fill={epcColor(d.grade)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
      </div>

      {card(
        <>
          <SH title="Portfolio by Region — Average Value" sub="Count and average value (£k)" />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={regionAgg} margin={{ bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="region" tick={{ fontSize: 10, fontFamily: T.mono }} angle={-25} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} unit="k" />
              <Tooltip formatter={(v) => `£${v}k`} />
              <Bar dataKey="avgValue" name="Avg Value (£k)" fill={T.navy} />
            </BarChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  );
};

/* ── Tab 2: Climate & Physical Risk ─────────────────────────────────────── */
const ClimatePhysicalRisk = () => {
  const [filter, setFilter] = useState("All");

  const filtered = useMemo(() => {
    if (filter === "Flood Zone") return PROPERTIES.filter(p => p.floodZone);
    if (filter === "High Risk")  return PROPERTIES.filter(p => p.physRisk > 65);
    if (filter === "Stranded")   return PROPERTIES.filter(p => p.stranded);
    return PROPERTIES;
  }, [filter]);

  const scatterData = PROPERTIES.map(p => ({
    x: p.value,
    y: p.physRisk,
    epc: p.epc,
    name: p.uprn,
  }));

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 20 }}>
        {[
          { label: "Avg Physical Risk Score", value: Math.round(PROPERTIES.reduce((s,p)=>s+p.physRisk,0)/PROPERTIES.length), color: T.amber },
          { label: "In Flood Zone", value: `${PROPERTIES.filter(p=>p.floodZone).length}`, color: T.blue },
          { label: "High Risk (>65)", value: PROPERTIES.filter(p=>p.physRisk>65).length, color: T.red },
          { label: "Stranded (EPC F/G)", value: PROPERTIES.filter(p=>p.stranded).length, color: T.purple },
        ].map(m => card(
          <>
            <div style={{ fontSize: 11, color: T.slate, marginBottom: 6 }}>{m.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: m.color, fontFamily: T.mono }}>{m.value}</div>
          </>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {card(
          <>
            <SH title="Value vs Physical Risk Score" sub="Bubble coloured by EPC grade" />
            <ResponsiveContainer width="100%" height={240}>
              <ScatterChart margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="x" name="Value (£k)" unit="k" tick={{ fontSize: 10, fontFamily: T.mono }} />
                <YAxis dataKey="y" name="Physical Risk" tick={{ fontSize: 10, fontFamily: T.mono }} domain={[0,100]} />
                <Tooltip cursor={{ strokeDasharray: "3 3" }} formatter={(v, n) => n === "Value (£k)" ? `£${v}k` : v} />
                <Scatter data={scatterData} fillOpacity={0.7}>
                  {scatterData.map((d, i) => <Cell key={i} fill={epcColor(d.epc)} />)}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </>
        )}
        {card(
          <>
            <SH title="Scenario Stress — HPI Impact (%)" sub="House price index change vs base under each scenario" />
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={STRESS_SCENARIOS} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 10, fontFamily: T.mono }} unit="%" />
                <YAxis dataKey="scenario" type="category" tick={{ fontSize: 10, fontFamily: T.mono }} width={100} />
                <Tooltip unit="%" />
                <Bar dataKey="hpi" name="HPI Change %" radius={[0,4,4,0]}>
                  {STRESS_SCENARIOS.map((d, i) => <Cell key={i} fill={d.hpi < -20 ? T.red : d.hpi < -8 ? T.amber : T.green} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
      </div>

      {card(
        <>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
            <SH title="Property Physical Risk Register" sub={null} />
            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              {["All","Flood Zone","High Risk","Stranded"].map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  padding: "4px 12px", borderRadius: 4, border: `1px solid ${filter===f?T.navy:"#e2e8f0"}`,
                  background: filter===f?T.navy:"#fff", color: filter===f?"#fff":T.slate,
                  fontSize: 12, cursor: "pointer", fontFamily: T.mono
                }}>{f}</button>
              ))}
            </div>
          </div>
          <div style={{ maxHeight: 340, overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead style={{ position: "sticky", top: 0, background: T.cream }}>
                <tr>
                  {["UPRN","Region","Type","EPC","Value (£k)","LTV","Phys Risk","Flood","Stranded","Cost-to-C (£k)"].map(h => (
                    <th key={h} style={{ padding: "6px 10px", textAlign: "left", color: T.navy, fontWeight: 700, borderBottom: `2px solid ${T.gold}`, fontFamily: T.mono, fontSize: 11, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr key={p.id} style={{ background: i % 2 === 0 ? "#fff" : T.cream }}>
                    <td style={{ padding: "6px 10px", fontFamily: T.mono, fontSize: 11, color: T.navy, fontWeight: 700 }}>{p.uprn}</td>
                    <td style={{ padding: "6px 10px", fontSize: 11, color: T.slate }}>{p.region}</td>
                    <td style={{ padding: "6px 10px", fontSize: 11, color: T.slate }}>{p.propType}</td>
                    <td style={{ padding: "6px 10px" }}>{pill(p.epc, epcColor(p.epc))}</td>
                    <td style={{ padding: "6px 10px", fontFamily: T.mono, fontWeight: 700, color: T.navy }}>£{p.value.toLocaleString()}</td>
                    <td style={{ padding: "6px 10px", fontFamily: T.mono, color: p.ltv > 0.8 ? T.red : T.navy }}>{(p.ltv*100).toFixed(0)}%</td>
                    <td style={{ padding: "6px 10px" }}>{pill(p.physRisk, physColor(p.physRisk))}</td>
                    <td style={{ padding: "6px 10px", textAlign: "center" }}>{p.floodZone ? pill("Yes", T.red) : "—"}</td>
                    <td style={{ padding: "6px 10px", textAlign: "center" }}>{p.stranded ? pill("Risk", T.purple) : "—"}</td>
                    <td style={{ padding: "6px 10px", fontFamily: T.mono, color: p.costToC > 20 ? T.red : p.costToC > 0 ? T.amber : T.green }}>
                      {p.costToC > 0 ? `£${p.costToC}k` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

/* ── Tab 3: EPC & Energy Transition ─────────────────────────────────────── */
const EpcEnergyTransition = () => {
  const totalRetrofitCost = PROPERTIES.filter(p => p.epcIdx > 2).reduce((s, p) => s + p.costToC, 0);
  const belowC = PROPERTIES.filter(p => p.epcIdx > 2).length;

  const energyByEpc = EPC_GRADES.map(g => {
    const props = PROPERTIES.filter(p => p.epc === g);
    return {
      grade: g,
      avgKwh: props.length ? Math.round(props.reduce((s,p) => s + p.energyKwh, 0) / props.length) : 0,
      count: props.length,
    };
  });

  const greenPremiumData = PROPERTIES.filter(p => p.greenPrem > 0).slice(0, 15).map(p => ({
    uprn: p.uprn.slice(-5),
    premium: p.greenPrem,
    value: p.value,
  }));

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 20 }}>
        {[
          { label: "Below EPC C", value: `${belowC} props`, color: T.amber },
          { label: "Total Retrofit Cost (£k)", value: `£${totalRetrofitCost.toLocaleString()}k`, color: T.red },
          { label: "Avg Cost-to-C (£k)", value: `£${Math.round(totalRetrofitCost/belowC)}k`, color: T.amber },
          { label: "EPC A/B (Green Premium)", value: PROPERTIES.filter(p=>p.epcIdx<=1).length, color: T.green },
        ].map(m => card(
          <>
            <div style={{ fontSize: 11, color: T.slate, marginBottom: 6 }}>{m.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: m.color, fontFamily: T.mono }}>{m.value}</div>
          </>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {card(
          <>
            <SH title="Average Energy Consumption by EPC Grade" sub="Annual kWh — lower is better" />
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={energyByEpc}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="grade" tick={{ fontSize: 13, fontFamily: T.mono, fontWeight: 700 }} />
                <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} />
                <Tooltip formatter={(v) => `${v.toLocaleString()} kWh/yr`} />
                <Bar dataKey="avgKwh" name="Avg kWh/yr" radius={[4,4,0,0]}>
                  {energyByEpc.map((d, i) => <Cell key={i} fill={epcColor(d.grade)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
        {card(
          <>
            <SH title="Retrofit Cost Distribution by EPC Grade" sub="Average cost to improve to EPC C (£k)" />
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={RETROFIT_COSTS}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="grade" tick={{ fontSize: 13, fontFamily: T.mono, fontWeight: 700 }} />
                <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} unit="k" />
                <Tooltip formatter={(v, n) => n === "avgCost" ? `£${v}k avg` : `${v} props`} />
                <Legend />
                <Bar dataKey="avgCost" name="Avg Retrofit Cost (£k)" fill={T.amber} />
                <Bar dataKey="count"   name="Property Count"          fill={T.navy}  />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
      </div>

      {card(
        <>
          <SH title="Green Premium — EPC A/B Properties" sub="Estimated price premium (%) vs equivalent EPC C property" />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={greenPremiumData} margin={{ bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="uprn" tick={{ fontSize: 10, fontFamily: T.mono }} />
              <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} unit="%" />
              <Tooltip formatter={(v) => `+${v}%`} />
              <Bar dataKey="premium" name="Green Premium %" fill={T.green} radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  );
};

/* ── Tab 4: Mortgage Stress & Affordability ──────────────────────────────── */
const MortgageStress = () => {
  const [rate, setRate] = useState(4.5);

  const stressedLtv = useMemo(() => {
    const hpiAdj = -0.05 * Math.max(0, rate - 4.5);
    return PROPERTIES.map(p => ({
      ...p,
      stressedValue: Math.round(p.value * (1 + hpiAdj)),
      stressedLtv: +(p.ltv / (1 + hpiAdj)).toFixed(2),
    }));
  }, [rate]);

  const highLtv = stressedLtv.filter(p => p.stressedLtv > 0.8).length;
  const negEquity = stressedLtv.filter(p => p.stressedLtv > 0.95).length;

  const affordData = [3.5, 4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0].map(r => {
    const hpi = -0.05 * Math.max(0, r - 4.5);
    const afford = 28 + (r - 3.5) * 5.5;
    return { rate: `${r}%`, affordPct: +afford.toFixed(1), stressedHpi: +(hpi * 100).toFixed(1) };
  });

  const ltvBuckets = [
    { bucket: "< 60%", count: stressedLtv.filter(p=>p.stressedLtv<0.6).length },
    { bucket: "60–75%", count: stressedLtv.filter(p=>p.stressedLtv>=0.6&&p.stressedLtv<0.75).length },
    { bucket: "75–80%", count: stressedLtv.filter(p=>p.stressedLtv>=0.75&&p.stressedLtv<0.8).length },
    { bucket: "80–90%", count: stressedLtv.filter(p=>p.stressedLtv>=0.8&&p.stressedLtv<0.9).length },
    { bucket: "90–95%", count: stressedLtv.filter(p=>p.stressedLtv>=0.9&&p.stressedLtv<0.95).length },
    { bucket: "> 95%",  count: stressedLtv.filter(p=>p.stressedLtv>=0.95).length },
  ];

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 20 }}>
        {[
          { label: "Stressed Rate", value: `${rate}%`, color: T.blue },
          { label: "LTV > 80% (stressed)", value: highLtv, color: T.amber },
          { label: "Near-Neg Equity (>95%)", value: negEquity, color: T.red },
          { label: "Avg Stressed LTV", value: `${(stressedLtv.reduce((s,p)=>s+p.stressedLtv,0)/stressedLtv.length*100).toFixed(1)}%`, color: T.navy },
        ].map(m => card(
          <>
            <div style={{ fontSize: 11, color: T.slate, marginBottom: 6 }}>{m.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: m.color, fontFamily: T.mono }}>{m.value}</div>
          </>
        ))}
      </div>

      {card(
        <>
          <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontSize: 13, color: T.navy, fontWeight: 600 }}>Stressed Mortgage Rate:</span>
            <span style={{ fontFamily: T.mono, fontWeight: 700, color: T.blue, fontSize: 16 }}>{rate}%</span>
            <input type="range" min={3.5} max={8.0} step={0.25} value={rate}
              onChange={e => setRate(+e.target.value)}
              style={{ flex: 1, maxWidth: 300, accentColor: T.navy }} />
          </div>
        </>,
        { marginBottom: 20 }
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {card(
          <>
            <SH title="LTV Distribution (stressed)" sub="Impact of rate increase on LTV buckets" />
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ltvBuckets}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="bucket" tick={{ fontSize: 11, fontFamily: T.mono }} />
                <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} />
                <Tooltip />
                <Bar dataKey="count" name="Properties" radius={[4,4,0,0]}>
                  {ltvBuckets.map((d,i) => <Cell key={i} fill={["#059669","#16a34a","#65a30d","#d97706","#ea580c","#dc2626"][i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
        {card(
          <>
            <SH title="Affordability Ratio vs Mortgage Rate" sub="Mortgage cost as % of gross household income" />
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={affordData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="rate" tick={{ fontSize: 11, fontFamily: T.mono }} />
                <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} unit="%" />
                <Tooltip formatter={(v) => `${v}%`} />
                <Area dataKey="affordPct" name="Income spend %" stroke={T.red} fill={T.red} fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </>
        )}
      </div>
    </div>
  );
};

/* ── Page Shell ──────────────────────────────────────────────────────────── */
const TABS = [
  { key: "portfolio", label: "Portfolio Overview"       },
  { key: "climate",   label: "Climate & Physical Risk"  },
  { key: "epc",       label: "EPC & Energy Transition"  },
  { key: "mortgage",  label: "Mortgage Stress"          },
];

export default function ResidentialReAssessmentPage() {
  const [tab, setTab] = useState("portfolio");

  return (
    <div style={{ fontFamily: T.font, background: T.cream, minHeight: "100vh", padding: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.navy }}>Residential RE Assessment</h1>
          {pill("EP-BC1", T.navy)}
          {pill("Real Estate", T.teal)}
        </div>
        <div style={{ fontSize: 13, color: T.slate }}>
          60 properties · EPC A–G · physical risk overlay · flood zone · stranded-asset modelling · mortgage affordability stress
        </div>
      </div>

      <div style={{ display: "flex", gap: 0, marginBottom: 24, borderBottom: `2px solid ${T.gold}` }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: "8px 20px", background: tab === t.key ? T.navy : "transparent",
            color: tab === t.key ? "#fff" : T.slate, border: "none", cursor: "pointer",
            fontSize: 13, fontFamily: T.font, fontWeight: tab === t.key ? 700 : 400,
            borderBottom: tab === t.key ? `2px solid ${T.gold}` : "none",
            marginBottom: tab === t.key ? -2 : 0, transition: "all 0.15s"
          }}>{t.label}</button>
        ))}
      </div>

      {tab === "portfolio" && <PortfolioOverview />}
      {tab === "climate"   && <ClimatePhysicalRisk />}
      {tab === "epc"       && <EpcEnergyTransition />}
      {tab === "mortgage"  && <MortgageStress />}
    </div>
  );
}
