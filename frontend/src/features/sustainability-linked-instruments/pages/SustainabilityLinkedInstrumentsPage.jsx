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

function calcSllPricing({ notionalM, baseSpread, ratchetBps, numKpis, stepUpProb,
  maturityYr, wacc }) {
  const w = wacc / 100;
  const expectedStepUp = ratchetBps * stepUpProb / 100;
  const expectedStepDown = ratchetBps * (1 - stepUpProb / 100);
  const annCoupon = notionalM * (baseSpread + expectedStepUp - expectedStepDown) / 10000;
  const pv = Array.from({ length: maturityYr }, (_, y) =>
    annCoupon / Math.pow(1 + w, y + 1)).reduce((a, b) => a + b, 0) + notionalM / Math.pow(1 + w, maturityYr);
  return { expectedStepUp, expectedStepDown, annCoupon, pv, greeniumBps: expectedStepDown };
}

const KPI_TEMPLATES = [
  { kpi: "GHG Emissions Intensity", sector: "All", unit: "tCO₂e/revenue", spt: "30% reduction by Yr3", ratchet: 7.5, frequency: "Annual", verifier: "Third-party assurance" },
  { kpi: "Renewable Energy Share",  sector: "Energy/Manufacturing", unit: "% of total consumption", spt: ">60% RE by Yr2", ratchet: 5.0, frequency: "Annual", verifier: "Energy meter data" },
  { kpi: "Water Intensity",         sector: "Food/Chemicals/Textiles", unit: "m³/tonne output", spt: "25% reduction by Yr3", ratchet: 6.0, frequency: "Annual", verifier: "Utility bills" },
  { kpi: "Women in Leadership",     sector: "All", unit: "% VP+ roles", spt: ">40% by Yr2", ratchet: 5.0, frequency: "Annual", verifier: "HR audit" },
  { kpi: "Lost Time Injury Rate",   sector: "Construction/Energy", unit: "LTIR per 200K hrs", spt: "<0.5 by Yr3", ratchet: 4.0, frequency: "Quarterly", verifier: "Safety audit" },
  { kpi: "Supply Chain Scope 3",    sector: "Retail/FMCG", unit: "tCO₂e/$ revenue", spt: "20% reduction by Yr3", ratchet: 8.0, frequency: "Annual", verifier: "CDP supply chain" },
  { kpi: "Biodiversity Net Gain",   sector: "Infrastructure/RE", unit: "BNG metric", spt: ">10% BNG by Yr2", ratchet: 6.5, frequency: "Bi-annual", verifier: "Ecologist assessment" },
  { kpi: "EV Fleet Transition",     sector: "Logistics/Automotive", unit: "% EV in fleet", spt: ">50% EV by Yr3", ratchet: 5.5, frequency: "Annual", verifier: "Fleet registry" },
];

const SLB_MARKET = [
  { year: 2019, volume: 8,  count: 6,  avgSize: 1.33 },
  { year: 2020, volume: 88, count: 62, avgSize: 1.42 },
  { year: 2021, volume: 188, count: 127, avgSize: 1.48 },
  { year: 2022, volume: 97, count: 70, avgSize: 1.39 },
  { year: 2023, volume: 163, count: 108, avgSize: 1.51 },
  { year: 2024, volume: 145, count: 98, avgSize: 1.48 },
];

const SLL_MARKET = [
  { year: 2019, volume: 163, growth: 0 },
  { year: 2020, volume: 120, growth: -26 },
  { year: 2021, volume: 717, growth: 498 },
  { year: 2022, volume: 843, growth: 18 },
  { year: 2023, volume: 714, growth: -15 },
  { year: 2024, volume: 780, growth: 9 },
];

const ISSUER_SECTORS = [
  { sector: "Utilities", slbShare: 28, sllShare: 15, typicalKpi: "RE capacity / GHG", greenium: 6 },
  { sector: "Real Estate", slbShare: 12, sllShare: 18, typicalKpi: "Energy intensity / GRESB", greenium: 5 },
  { sector: "Industrials", slbShare: 18, sllShare: 22, typicalKpi: "Scope 1+2 intensity", greenium: 7 },
  { sector: "Consumer", slbShare: 10, sllShare: 14, typicalKpi: "Packaging / water", greenium: 4 },
  { sector: "Technology", slbShare: 8,  sllShare: 10, typicalKpi: "RE 100 / DEI", greenium: 5 },
  { sector: "Transport", slbShare: 14, sllShare: 12, typicalKpi: "GHG intensity / EV fleet", greenium: 8 },
  { sector: "Agriculture", slbShare: 5, sllShare: 6, typicalKpi: "Land use / fertilizer", greenium: 6 },
  { sector: "Healthcare", slbShare: 5, sllShare: 3, typicalKpi: "Scope 3 / waste", greenium: 3 },
];

const TABS = [
  "Instrument Overview", "SLL Pricing Engine", "KPI Framework", "SPT Calibration",
  "Ratchet Mechanics", "Market Intelligence", "Sector Analysis", "Greenwashing Risk",
  "Documentation", "FI Revenue Model"
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

export default function SustainabilityLinkedInstrumentsPage() {
  const [tab, setTab] = useState(0);
  const [notional, setNotional]     = useState(500);
  const [baseSpread, setBaseSpread] = useState(180);
  const [ratchet, setRatchet]       = useState(7.5);
  const [numKpis, setNumKpis]       = useState(2);
  const [stepUpProb, setStepUpProb] = useState(30);
  const [maturity, setMaturity]     = useState(5);
  const [wacc, setWacc]             = useState(5.5);
  const [carbonPrice, setCarbonPrice] = useState(80);
  const [selectedKpi, setSelectedKpi] = useState(0);
  const [instrumentType, setInstrumentType] = useState("SLL");

  const pricing = useMemo(() => calcSllPricing({
    notionalM: notional, baseSpread, ratchetBps: ratchet,
    numKpis, stepUpProb, maturityYr: maturity, wacc
  }), [notional, baseSpread, ratchet, numKpis, stepUpProb, maturity, wacc]);

  const ratchetSensitivity = useMemo(() => Array.from({ length: 11 }, (_, i) => {
    const prob = i * 10;
    const res = calcSllPricing({ notionalM: notional, baseSpread, ratchetBps: ratchet, numKpis, stepUpProb: prob, maturityYr: maturity, wacc });
    return { stepUpProb: prob, greenium: +res.greeniumBps.toFixed(2), annCoupon: +res.annCoupon.toFixed(2) };
  }), [notional, baseSpread, ratchet, numKpis, maturity, wacc]);

  const ratchetBySize = useMemo(() => [2.5, 5, 7.5, 10, 12.5, 15, 20].map(r => ({
    ratchet: r,
    greenium: +(r * (1 - stepUpProb / 100)).toFixed(2),
    stepUp: +(r * stepUpProb / 100).toFixed(2),
  })), [stepUpProb]);

  const fiRevenue = useMemo(() => {
    const arrangementFee = notional * 0.0035;
    const annualAdmin    = notional * 0.0008;
    const kpiMonitoring  = numKpis * 25000 / 1e3;
    const verificationFee = numKpis * 35000 / 1e3;
    const totalLifetime  = arrangementFee + (annualAdmin + kpiMonitoring + verificationFee) * maturity;
    return { arrangementFee, annualAdmin, kpiMonitoring, verificationFee, totalLifetime };
  }, [notional, numKpis, maturity]);

  const styles = {
    page: { background: T.bg, minHeight: "100vh", fontFamily: T.font, color: T.text, padding: 24 },
    header: { borderBottom: `2px solid ${T.gold}`, paddingBottom: 16, marginBottom: 24 },
    tabs: { display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 24 },
    tab: (a) => ({ padding: "8px 14px", borderRadius: 6, fontSize: 12, cursor: "pointer", fontFamily: T.mono,
      background: a ? T.gold : T.surface, color: a ? "#000" : T.textSec, border: `1px solid ${a ? T.gold : T.border}` }),
    grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
    grid3: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 },
    grid4: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 },
    panel: { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 16 },
    h3: { fontSize: 13, fontFamily: T.mono, color: T.gold, marginBottom: 14, textTransform: "uppercase", letterSpacing: 1 },
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={{ fontSize: 11, color: T.gold, fontFamily: T.mono, letterSpacing: 2, marginBottom: 6 }}>EP-DW1 · FI CLIMATE FINANCE INSTRUMENTS</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Sustainability-Linked Instruments Intelligence Suite</h1>
        <div style={{ fontSize: 13, color: T.textSec, marginTop: 6 }}>SLL · SLB · KPI Ratchet Pricing · SPT Calibration · LMA/ICMA Principles · FI Revenue Model</div>
      </div>

      <div style={styles.tabs}>
        {TABS.map((t, i) => <button key={t} style={styles.tab(tab === i)} onClick={() => setTab(i)}>{t}</button>)}
      </div>

      {tab === 0 && (
        <div>
          <div style={styles.grid4}>
            <KpiCard label="Global SLL Market" value="$780B" unit="" sub="2024 issuance volume" />
            <KpiCard label="Global SLB Market" value="$145B" unit="" sub="2024 issuance volume" color={T.green} />
            <KpiCard label="Typical Greenium" value="4–8" unit="bps" sub="SLL borrower benefit" color={T.amber} />
            <KpiCard label="Avg. Ratchet" value="5–10" unit="bps" sub="Per KPI step-up/down" color={T.teal} />
          </div>
          <div style={styles.grid2}>
            <div style={styles.panel}>
              <div style={styles.h3}>SLL vs SLB — Instrument Comparison</div>
              {[
                ["Instrument", "Sustainability-Linked Loan (SLL)", "Sustainability-Linked Bond (SLB)"],
                ["Issuer", "Any corporate borrower", "Rated corporate / sovereign"],
                ["Market", "Private (syndicated/bilateral)", "Public capital markets"],
                ["Size", "$10M–$5B typical", "$100M–$3B typical"],
                ["Tenor", "3–7 years", "5–15 years"],
                ["KPI Mechanism", "Margin ratchet ±5-20bps", "Coupon step-up/down ±12.5-25bps"],
                ["Principles", "LMA/APLMA SLL Principles (2023)", "ICMA SLB Principles (2020, rev. 2023)"],
                ["Second Party Opinion", "Recommended", "Required"],
                ["Use of Proceeds", "General corporate purposes", "General corporate purposes"],
                ["SFDR Classification", "Article 8 / 9 eligible", "Article 8 / 9 eligible"],
              ].map(([k, v1, v2], i) => (
                <div key={k} style={{ display: "grid", gridTemplateColumns: "30% 35% 35%", padding: "5px 0", borderBottom: `1px solid ${T.border}`, fontSize: 11 }}>
                  <span style={{ color: T.textMut }}>{k}</span>
                  <span style={{ color: T.teal }}>{v1}</span>
                  <span style={{ color: T.gold }}>{v2}</span>
                </div>
              ))}
            </div>
            <div>
              <div style={styles.panel}>
                <div style={styles.h3}>Key Structuring Principles (LMA/ICMA)</div>
                {[
                  { principle: "KPI Selection", detail: "Core, material, measurable. Must be central to borrower's business strategy." },
                  { principle: "SPT Calibration", detail: "Ambitious yet credible. Science-based where possible. Benchmarked vs. peers/sector pathways." },
                  { principle: "Loan Characteristics", detail: "Economic consequence linked to SPT achievement — margin ratchet (step-up if miss, step-down if hit)." },
                  { principle: "Reporting", detail: "Annual KPI performance data. Publicly available where possible." },
                  { principle: "Verification", detail: "Annual external verification by qualified party before ratchet date." },
                ].map(p => (
                  <div key={p.principle} style={{ padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.gold }}>{p.principle}</div>
                    <div style={{ fontSize: 11, color: T.textSec, marginTop: 3 }}>{p.detail}</div>
                  </div>
                ))}
              </div>
              <div style={styles.panel}>
                <div style={styles.h3}>FI Opportunity — Why Now</div>
                <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.8 }}>
                  <div>• Borrowers save <span style={{ color: T.gold }}>4–8bps</span> on margin when KPIs are met — strong demand pull</div>
                  <div>• FIs earn arrangement + monitoring fees of <span style={{ color: T.gold }}>35–50bps</span> upfront vs 25bps on plain loans</div>
                  <div>• SFDR pressure: banks need <span style={{ color: T.gold }}>Article 8/9</span> eligible assets for fund products</div>
                  <div>• ECB/BoE supervisory guidance: climate risk in credit underwriting expected by 2025</div>
                  <div>• Net Zero Banking Alliance (NZBA) commitments require green asset origination at scale</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div style={styles.grid2}>
          <div>
            <div style={styles.panel}>
              <div style={styles.h3}>SLL/SLB Pricing Engine</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                {["SLL", "SLB"].map(t => (
                  <button key={t} onClick={() => setInstrumentType(t)} style={styles.tab(instrumentType === t)}>{t}</button>
                ))}
              </div>
              <Slider label="Facility / Notional" value={notional} min={50} max={3000} step={50} onChange={setNotional} unit=" $M" />
              <Slider label="Base Spread / Coupon" value={baseSpread} min={50} max={500} step={5} onChange={setBaseSpread} unit=" bps" />
              <Slider label="Ratchet Size (per KPI)" value={ratchet} min={2.5} max={25} step={2.5} onChange={setRatchet} unit=" bps" />
              <Slider label="Number of KPIs" value={numKpis} min={1} max={5} step={1} onChange={setNumKpis} unit=" KPIs" />
              <Slider label="Probability of Step-Up (miss)" value={stepUpProb} min={0} max={80} step={5} onChange={setStepUpProb} unit="%" />
              <Slider label="Maturity" value={maturity} min={2} max={10} step={1} onChange={setMaturity} unit=" yr" />
              <Slider label="Risk-Free Rate / WACC" value={wacc} min={2} max={12} step={0.25} onChange={setWacc} unit="%" />
            </div>
          </div>
          <div>
            <div style={styles.grid2}>
              <KpiCard label="Expected Greenium" value={pricing.greeniumBps.toFixed(2)} unit=" bps" sub="Borrower margin saving" color={T.green} />
              <KpiCard label="Expected Step-Up Risk" value={pricing.expectedStepUp.toFixed(2)} unit=" bps" sub="If KPIs missed" color={T.red} />
              <KpiCard label="Annual Coupon/Interest" value={`$${pricing.annCoupon.toFixed(1)}M`} unit="" sub="Expected all-in cost" color={T.gold} />
              <KpiCard label="PV of Instrument" value={`$${pricing.pv.toFixed(0)}M`} unit="" sub={`${maturity}yr @ ${wacc}% discount`} color={T.teal} />
            </div>
            <div style={styles.panel}>
              <div style={styles.h3}>Greenium vs. Step-Up Probability</div>
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={ratchetSensitivity} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="stepUpProb" tick={{ fontSize: 10, fill: T.textSec }} unit="%" label={{ value: "Miss Probability (%)", position: "insideBottom", offset: -10, fill: T.textSec, fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10, fill: T.textSec }} unit=" bps" />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}` }} />
                  <Legend />
                  <Line type="monotone" dataKey="greenium" name="Greenium (bps)" stroke={T.green} strokeWidth={2} dot={false} />
                  <ReferenceLine x={stepUpProb} stroke={T.gold} strokeDasharray="4 4" label={{ value: "Current", fill: T.gold, fontSize: 10 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 2 && (
        <div>
          <div style={styles.grid3}>
            <KpiCard label="KPI Templates" value="8" unit="" sub="Sector-specific library" />
            <KpiCard label="Most Common KPI" value="GHG" unit="" sub="Scope 1+2 intensity (67% of SLLs)" color={T.green} />
            <KpiCard label="Multi-KPI" value="2–3" unit="" sub="Average KPIs per instrument" color={T.amber} />
          </div>
          <div style={styles.panel}>
            <div style={styles.h3}>KPI Template Library — Select & Configure</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
              {KPI_TEMPLATES.map((k, i) => (
                <button key={k.kpi} onClick={() => setSelectedKpi(i)} style={styles.tab(selectedKpi === i)}>{k.kpi}</button>
              ))}
            </div>
            {(() => {
              const k = KPI_TEMPLATES[selectedKpi];
              return (
                <div style={styles.grid2}>
                  <table style={{ borderCollapse: "collapse", fontSize: 12 }}>
                    {[["KPI Name", k.kpi], ["Target Sector(s)", k.sector], ["Unit", k.unit],
                      ["Typical SPT", k.spt], ["Ratchet Size", `±${k.ratchet} bps`],
                      ["Reporting Frequency", k.frequency], ["Verification", k.verifier]].map(([key, val]) => (
                      <tr key={key} style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: "6px 10px", color: T.textSec }}>{key}</td>
                        <td style={{ padding: "6px 10px", color: T.text, fontFamily: T.mono }}>{val}</td>
                      </tr>
                    ))}
                  </table>
                  <div style={styles.panel}>
                    <div style={styles.h3}>KPI Ratchet by Size Comparison</div>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={ratchetBySize} margin={{ top: 5, right: 10, bottom: 20, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                        <XAxis dataKey="ratchet" tick={{ fontSize: 10, fill: T.textSec }} unit="bps" />
                        <YAxis tick={{ fontSize: 10, fill: T.textSec }} unit=" bps" />
                        <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}` }} />
                        <Legend />
                        <Bar dataKey="greenium" name="Expected Greenium" fill={T.green} stackId="a" />
                        <Bar dataKey="stepUp" name="Expected Step-Up" fill={T.red} stackId="b" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {tab === 3 && (
        <div style={styles.panel}>
          <div style={styles.h3}>Sustainability Performance Target (SPT) Calibration Framework</div>
          <div style={{ marginBottom: 16, fontSize: 12, color: T.textSec }}>
            SPTs must be ambitious, science-based where applicable, and benchmarked against sector decarbonisation pathways. Weak SPTs invite greenwashing scrutiny.
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${T.gold}` }}>
                {["KPI Type", "Baseline Year", "SPT Calibration Method", "Science Basis", "Typical Ambition Level"].map(h => (
                  <th key={h} style={{ padding: "7px 10px", textAlign: "left", color: T.gold, fontFamily: T.mono, fontSize: 11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { kpi: "Absolute GHG", baseline: "3yr avg", method: "Paris-aligned sectoral decarbonisation (SBTi)", basis: "SBTi Corporate", ambition: ">30% by Yr3, >50% by Yr5" },
                { kpi: "GHG Intensity", baseline: "Most recent yr", method: "Sector pathway (IEA/IPCC 1.5°C)", basis: "IEA NZE Scenario", ambition: ">25% intensity reduction" },
                { kpi: "Renewable Energy", baseline: "Current RE%", method: "RE100 sector trajectory", basis: "RE100 campaign", ambition: "+20% per year toward 100%" },
                { kpi: "Water Intensity", baseline: "3yr avg", method: "CDP/WRI Aqueduct benchmarking", basis: "WRI Aqueduct", ambition: ">20% reduction in high-stress regions" },
                { kpi: "Social KPIs", baseline: "Last audit", method: "Peer benchmarking (top quartile)", basis: "ILO / UNGP", ambition: "Top quartile within 2 years" },
                { kpi: "Biodiversity", baseline: "TNFD LEAP", method: "Nature Positive by 2030 framework", basis: "GBF / TNFD", ambition: "Net positive by Yr3" },
              ].map((r, i) => (
                <tr key={r.kpi} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 ? T.surfaceH : "transparent" }}>
                  <td style={{ padding: "7px 10px", color: T.gold, fontWeight: 600 }}>{r.kpi}</td>
                  <td style={{ padding: "7px 10px" }}>{r.baseline}</td>
                  <td style={{ padding: "7px 10px", color: T.textSec }}>{r.method}</td>
                  <td style={{ padding: "7px 10px", color: T.teal, fontSize: 11 }}>{r.basis}</td>
                  <td style={{ padding: "7px 10px", color: T.green, fontFamily: T.mono, fontSize: 11 }}>{r.ambition}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 4 && (
        <div style={styles.grid2}>
          <div style={styles.panel}>
            <div style={styles.h3}>Ratchet Mechanics — Step-Up & Step-Down</div>
            {[
              { mechanism: "Step-Down (Borrower Reward)", trigger: "KPI meets or exceeds SPT", effect: `Margin reduced by ${ratchet} bps per KPI`, color: T.green },
              { mechanism: "Step-Up (Borrower Penalty)", trigger: "KPI misses SPT", effect: `Margin increased by ${ratchet} bps per KPI`, color: T.red },
              { mechanism: "Neutral / No Change", trigger: "KPI not tested or waived", effect: "Base margin applies", color: T.textSec },
              { mechanism: "Observation Date", trigger: "Annual (post audit period)", effect: "Applied to next interest period", color: T.amber },
              { mechanism: "Cure Period", trigger: "Missed SPT in Yr N", effect: "Borrower may remediate by Yr N+1", color: T.teal },
            ].map(m => (
              <div key={m.mechanism} style={{ padding: "10px 0", borderBottom: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: m.color }}>{m.mechanism}</div>
                <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>Trigger: {m.trigger}</div>
                <div style={{ fontSize: 12, color: T.text, marginTop: 2, fontFamily: T.mono }}>{m.effect}</div>
              </div>
            ))}
          </div>
          <div>
            <div style={styles.panel}>
              <div style={styles.h3}>Multi-KPI Payoff Matrix</div>
              <div style={{ fontSize: 12, color: T.textSec, marginBottom: 10 }}>All {numKpis} KPIs hit vs. all missed vs. partial</div>
              {[
                { scenario: `All ${numKpis} KPIs Met`, margin: `${baseSpread - ratchet * numKpis} bps`, saving: `$${(notional * ratchet * numKpis / 10000).toFixed(1)}M/yr`, color: T.green },
                { scenario: "Half KPIs Met", margin: `${baseSpread} bps (net neutral)`, saving: "$0M/yr", color: T.amber },
                { scenario: `All ${numKpis} KPIs Missed`, margin: `${baseSpread + ratchet * numKpis} bps`, saving: `-$${(notional * ratchet * numKpis / 10000).toFixed(1)}M/yr`, color: T.red },
              ].map(s => (
                <div key={s.scenario} style={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6, padding: 12, marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: s.color }}>{s.scenario}</div>
                  <div style={{ fontSize: 12, fontFamily: T.mono, color: T.text, marginTop: 4 }}>All-in margin: {s.margin}</div>
                  <div style={{ fontSize: 12, color: s.color, marginTop: 2 }}>Annual impact: {s.saving}</div>
                </div>
              ))}
            </div>
            <div style={styles.panel}>
              <div style={styles.h3}>Penalty Revenue to FI (Sustainability Reserve)</div>
              <div style={{ fontSize: 12, color: T.textSec, marginBottom: 8 }}>
                Under LMA principles, step-up proceeds should be directed to sustainability purposes — not retained by FI as pure profit.
              </div>
              <div style={{ fontSize: 14, fontFamily: T.mono, color: T.amber }}>
                ${(notional * ratchet * numKpis / 10000 * stepUpProb / 100).toFixed(1)}M/yr expected penalty reserve
              </div>
              <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>Directed to: borrower's environmental fund, charity, or carbon offsets</div>
            </div>
          </div>
        </div>
      )}

      {tab === 5 && (
        <div>
          <div style={styles.panel}>
            <div style={styles.h3}>Sustainability-Linked Loan Market — Annual Volume ($B)</div>
            <ResponsiveContainer width="100%" height={240}>
              <ComposedChart data={SLL_MARKET} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: T.textSec }} unit="$B" />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: T.textSec }} unit="%" />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}` }} />
                <Legend />
                <Bar yAxisId="left" dataKey="volume" name="SLL Volume ($B)" fill={T.teal} />
                <Line yAxisId="right" type="monotone" dataKey="growth" name="YoY Growth (%)" stroke={T.gold} strokeWidth={2} dot={{ fill: T.gold, r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div style={styles.panel}>
            <div style={styles.h3}>Sustainability-Linked Bond Market — Annual Volume ($B)</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={SLB_MARKET} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} unit="$B" />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}` }} />
                <Legend />
                <Bar dataKey="volume" name="SLB Volume ($B)" fill={T.gold} />
                <Bar dataKey="count" name="Deal Count" fill={T.sage} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 6 && (
        <div style={styles.panel}>
          <div style={styles.h3}>Sector Analysis — SLL/SLB Issuance & Typical KPIs</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.gold}` }}>
                  {["Sector", "SLB Share (%)", "SLL Share (%)", "Typical KPI", "Avg Greenium (bps)", "FI Opportunity"].map(h => (
                    <th key={h} style={{ padding: "7px 10px", textAlign: "left", color: T.gold, fontFamily: T.mono, fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ISSUER_SECTORS.map((s, i) => (
                  <tr key={s.sector} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 ? T.surfaceH : "transparent" }}>
                    <td style={{ padding: "7px 10px", fontWeight: 600 }}>{s.sector}</td>
                    <td style={{ padding: "7px 10px", fontFamily: T.mono }}>{s.slbShare}%</td>
                    <td style={{ padding: "7px 10px", fontFamily: T.mono }}>{s.sllShare}%</td>
                    <td style={{ padding: "7px 10px", color: T.textSec }}>{s.typicalKpi}</td>
                    <td style={{ padding: "7px 10px", fontFamily: T.mono, color: T.green }}>{s.greenium} bps</td>
                    <td style={{ padding: "7px 10px", color: T.teal, fontSize: 11 }}>{s.greenium >= 7 ? "High" : s.greenium >= 5 ? "Medium" : "Lower"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 7 && (
        <div style={styles.panel}>
          <div style={styles.h3}>Greenwashing Risk Assessment — FI Due Diligence Checklist</div>
          {[
            { risk: "Weak SPT (below BAU trajectory)", severity: "High", flag: "SPT does not outperform sector baseline or historical improvement rate", mitigation: "Benchmark against SBTi / IEA sector pathway; require 3rd-party calibration" },
            { risk: "Immaterial KPI", severity: "High", flag: "KPI has no meaningful link to core business operations or GHG footprint", mitigation: "GHG / energy / water must be primary KPI for high-impact sectors" },
            { risk: "No External Verification", severity: "High", flag: "SPT achievement relies solely on self-reported data", mitigation: "Require third-party assurance pre-ratchet date (ISAE 3000 / AA1000)" },
            { risk: "Step-Up Too Small", severity: "Medium", flag: "Ratchet <5bps — insufficient financial consequence to drive behavior change", mitigation: "Minimum 7.5bps per KPI for material incentive effect" },
            { risk: "Cherry-Picked Baseline Year", severity: "Medium", flag: "Baseline year chosen at artificially high emissions for easy reduction", mitigation: "Require 3-year average baseline; check against sector norms" },
            { risk: "Parallel Use-of-Proceeds Green Bond", severity: "Low-Med", flag: "Borrower simultaneously issuing use-of-proceeds green bonds for same assets", mitigation: "Confirm no double-counting; ring-fence SLL proceeds separately" },
            { risk: "Waiver Provisions Too Broad", severity: "Medium", flag: "Force majeure / waiver clauses that allow KPI miss without step-up", mitigation: "Review waiver triggers; only climate-related force majeure acceptable" },
          ].map(r => (
            <div key={r.risk} style={{ padding: "10px 0", borderBottom: `1px solid ${T.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{r.risk}</div>
                  <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>Flag: {r.flag}</div>
                  <div style={{ fontSize: 11, color: T.teal, marginTop: 2 }}>Mitigation: {r.mitigation}</div>
                </div>
                <span style={{ fontFamily: T.mono, fontSize: 11, padding: "2px 8px", borderRadius: 4, whiteSpace: "nowrap", marginLeft: 10,
                  background: r.severity === "High" ? "#3d0000" : r.severity.includes("Med") ? "#2d1a00" : T.surfaceH,
                  color: r.severity === "High" ? T.red : r.severity.includes("Med") ? T.amber : T.textSec }}>
                  {r.severity}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 8 && (
        <div style={styles.panel}>
          <div style={styles.h3}>Key Documentation — SLL & SLB Structuring</div>
          <div style={styles.grid2}>
            {[
              { doc: "Sustainability Framework", party: "Borrower + SPO provider", content: "KPI definitions, SPT levels, reporting methodology, verification framework, use of step-up proceeds" },
              { doc: "Second Party Opinion (SPO)", party: "Sustainalytics / ISS / MSCI / Vigeo", content: "Confirms alignment with LMA SLL Principles / ICMA SLB Principles; SPT ambition assessment" },
              { doc: "Facility Agreement Amendments", party: "Legal counsel (Lenders/Borrower)", content: "Margin ratchet mechanics, observation dates, KPI definitions, verification obligations, remedies" },
              { doc: "Annual Compliance Certificate", party: "Borrower (CFO sign-off)", content: "KPI performance data, SPT achievement status, supporting evidence for external verifier" },
              { doc: "Verification Report", party: "Assurance firm (pre-ratchet)", content: "Independent confirmation of KPI achievement; ISAE 3000 / AA1000 standard" },
              { doc: "Investor / Lender Report", party: "Borrower / Arranger", content: "Annual public disclosure of KPI performance (required for SLB; recommended for SLL)" },
            ].map(d => (
              <div key={d.doc} style={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6, padding: 14, marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.gold }}>{d.doc}</div>
                <div style={{ fontSize: 11, color: T.teal, marginTop: 2 }}>Party: {d.party}</div>
                <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>{d.content}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 9 && (
        <div style={styles.grid2}>
          <div style={styles.panel}>
            <div style={styles.h3}>FI Revenue Model — SLL Origination</div>
            {[
              { item: "Arrangement Fee (35bps)", value: `$${fiRevenue.arrangementFee.toFixed(1)}M`, note: "One-time, earned at signing" },
              { item: "Annual Admin / Agency Fee", value: `$${fiRevenue.annualAdmin.toFixed(1)}M/yr`, note: "Ongoing loan administration" },
              { item: "KPI Monitoring Fee", value: `$${fiRevenue.kpiMonitoring.toFixed(1)}M/yr`, note: `$25K per KPI × ${numKpis} KPIs` },
              { item: "Verification Coordination", value: `$${fiRevenue.verificationFee.toFixed(1)}M/yr`, note: `$35K per KPI × ${numKpis} KPIs` },
              { item: `Total ${maturity}yr Lifetime Revenue`, value: `$${fiRevenue.totalLifetime.toFixed(1)}M`, note: "Arrangement + all annual fees" },
              { item: "vs. Plain Loan Fee (25bps)", value: `$${(notional * 0.0025).toFixed(1)}M`, note: "Arrangement only, no ongoing" },
              { item: "SLL Premium vs. Plain", value: `$${(fiRevenue.totalLifetime - notional * 0.0025).toFixed(1)}M`, note: "Lifetime incremental revenue" },
            ].map(r => (
              <div key={r.item} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${T.border}` }}>
                <div>
                  <div style={{ fontSize: 13 }}>{r.item}</div>
                  <div style={{ fontSize: 11, color: T.textMut }}>{r.note}</div>
                </div>
                <span style={{ fontFamily: T.mono, color: T.gold, fontSize: 14 }}>{r.value}</span>
              </div>
            ))}
          </div>
          <div style={styles.panel}>
            <div style={styles.h3}>Greenium Benefit vs. Ratchet Size</div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={ratchetBySize} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="ratchet" tick={{ fontSize: 10, fill: T.textSec }} unit=" bps" label={{ value: "Ratchet Size", position: "insideBottom", offset: -10, fill: T.textSec, fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} unit=" bps" />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}` }} />
                <Legend />
                <Line type="monotone" dataKey="greenium" name="Borrower Greenium" stroke={T.green} strokeWidth={2} dot={{ fill: T.green, r: 3 }} />
                <Line type="monotone" dataKey="stepUp" name="Step-Up Risk" stroke={T.red} strokeWidth={2} dot={{ fill: T.red, r: 3 }} />
                <ReferenceLine x={ratchet} stroke={T.gold} strokeDasharray="4 4" label={{ value: "Current", fill: T.gold, fontSize: 10 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
