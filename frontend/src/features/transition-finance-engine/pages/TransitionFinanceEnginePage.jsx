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

function calcTransitionLoan({ principalM, baseRate, greeniumBps, carbonPriceFwd,
  ghgIntensityNow, ghgIntensityTarget, revenue, maturityYr, wacc }) {
  const w = wacc / 100;
  const allIn = baseRate / 100 - greeniumBps / 10000;
  const annInt = principalM * allIn;
  // ghgIntensity is tCO2/$M-revenue, revenue is $M -> product is tCO2 (absolute tons).
  // carbonPriceFwd is $/t, so the raw product is absolute $. Divide by 1e6 to express
  // in $M, matching the units of principalM/annInt.
  const carbonSaving = (ghgIntensityNow - ghgIntensityTarget) * revenue * carbonPriceFwd / 1e6;
  const pvSaving = carbonSaving * (1 - Math.pow(1 + w, -maturityYr)) / w;
  const effectiveCost = annInt - carbonSaving;
  return { allIn: allIn * 100, annInt, carbonSaving, pvSaving, effectiveCost };
}

const TRANSITION_SECTORS = [
  { sector: "Steel", emissions: 2600, pathway: "Hydrogen DRI / EAF", timeline: "2030–2040", capex: "€180–280B (EU)", credibility: "High", framework: "GFANZ / Climate Bonds" },
  { sector: "Cement", emissions: 1600, pathway: "CCS + alternative binders", timeline: "2030–2045", capex: "€60–100B (EU)", credibility: "High", framework: "GCCA / Climate Bonds" },
  { sector: "Chemicals", emissions: 1200, pathway: "Green H₂ feedstock / electrification", timeline: "2035–2050", capex: "€250B (global)", credibility: "Medium", framework: "Cefic / SBTi" },
  { sector: "Shipping", emissions: 940,  pathway: "Ammonia / methanol fuel switch", timeline: "2030–2040", capex: "$100–200B", credibility: "Medium", framework: "IMO 2030 / Poseidon" },
  { sector: "Aviation", emissions: 800,  pathway: "SAF + future hydrogen", timeline: "2035–2050", capex: "$100–150B", credibility: "Medium", framework: "CORSIA / ReFuelEU" },
  { sector: "Power (gas)", emissions: 2100, pathway: "Gas → RE + storage / CCGT+CCS", timeline: "2025–2035", capex: "$500B+ (global)", credibility: "High", framework: "EU Taxonomy / IEA" },
  { sector: "Agriculture", emissions: 5800, pathway: "Regen ag / precision inputs / methane", timeline: "2030–2050", capex: "Distributed", credibility: "Low-Med", framework: "SBTi FLAG" },
  { sector: "Real Estate", emissions: 3900, pathway: "Deep renovation / heat pumps / EPC A", timeline: "2025–2040", capex: "€1.2T (EU by 2050)", credibility: "High", framework: "EU Taxonomy / GRESB" },
];

const TAXONOMY_ALIGNMENT = [
  { framework: "EU Taxonomy (DNSH)", eligible: ["Wind", "Solar", "EV", "Green buildings", "Managed forests"], transitional: ["Gas (temp, <100gCO₂/kWh)", "Nuclear (conditional)"], excluded: ["Coal", "Heavy oil", "Deforestation"] },
  { framework: "ICMA Climate Bonds", eligible: ["Low-carbon transport", "RE", "Green buildings"], transitional: ["Steel H₂-DRI", "Cement CCS", "Shipping LNG bridge"], excluded: ["New fossil fuels", "Coal"] },
  { framework: "ASEAN Taxonomy", eligible: ["RE", "EV", "Sustainable agriculture"], transitional: ["Natural gas bridge", "LNG"], excluded: ["New coal"] },
  { framework: "Singapore-Asia Taxonomy", eligible: ["Solar", "Wind", "Hydro"], transitional: ["Gas (threshold-based)"], excluded: ["Coal"] },
];

const CREDIBILITY_CRITERIA = [
  { criterion: "Paris-Aligned Pathway", weight: 25, desc: "Transition plan consistent with 1.5°C / well-below 2°C", assessment: "Requires SBTi validation or equivalent" },
  { criterion: "Capital Expenditure Plan", weight: 20, desc: "Specific capex committed to transition technologies", assessment: "Board-approved investment plan" },
  { criterion: "Carbon Lock-In Risk", weight: 20, desc: "No new stranded asset creation; existing assets on retirement path", assessment: "Asset retirement schedule" },
  { criterion: "Revenue Exposure", weight: 15, desc: "Declining share of revenue from high-carbon activities", assessment: "Segment revenue trajectory" },
  { criterion: "Governance & Accountability", weight: 10, desc: "Executive remuneration linked to transition KPIs", assessment: "Board ESG mandate" },
  { criterion: "Regulatory Alignment", weight: 10, desc: "Strategy consistent with national NDCs and sector regulation", assessment: "Policy risk assessment" },
];

const BOND_TYPES = [
  { type: "Transition Bond (ICMA)", useOfProceeds: "Specific transition activities", taxonomy: "ICMA Climate Bonds", greenwashRisk: "Medium", mktAcceptance: "Growing", avgSize: 750 },
  { type: "Sustainability Bond", useOfProceeds: "Green + Social projects", taxonomy: "ICMA / Green Bond Principles", greenwashRisk: "Low", mktAcceptance: "High", avgSize: 600 },
  { type: "Sustainability-Linked Bond", useOfProceeds: "General", taxonomy: "ICMA SLB Principles", greenwashRisk: "Medium-High", mktAcceptance: "High", avgSize: 850 },
  { type: "Green Loan (transition use)", useOfProceeds: "Eligible green activities", taxonomy: "LMA Green Loan Principles", greenwashRisk: "Low-Med", mktAcceptance: "High", avgSize: 400 },
  { type: "Transition Loan (framework)", useOfProceeds: "Transition capex (sector-specific)", taxonomy: "LMA / APLMA Transition", greenwashRisk: "Medium", mktAcceptance: "Developing", avgSize: 500 },
];

const TABS = [
  "Overview", "Transition Loan Pricing", "Sector Pathways", "Credibility Scoring",
  "Taxonomy Alignment", "Bond Type Navigator", "FI Underwriting", "Deal Structuring",
  "Market Intelligence", "Portfolio Monitoring"
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

export default function TransitionFinanceEnginePage() {
  const [tab, setTab] = useState(0);
  const [principal, setPrincipal]     = useState(300);
  const [baseRate, setBaseRate]       = useState(5.5);
  const [greenium, setGreenium]       = useState(15);
  const [carbonFwd, setCarbonFwd]     = useState(100);
  const [ghgNow, setGhgNow]           = useState(850);
  const [ghgTarget, setGhgTarget]     = useState(550);
  const [revenue, setRevenue]         = useState(2000);
  const [maturity, setMaturity]       = useState(7);
  const [wacc, setWacc]               = useState(6);
  const [selectedSector, setSelectedSector] = useState(0);
  const [credScores, setCredScores]   = useState(CREDIBILITY_CRITERIA.map(c => Math.round(50 + sr(c.weight) * 40)));

  const loan = useMemo(() => calcTransitionLoan({
    principalM: principal, baseRate, greeniumBps: greenium,
    carbonPriceFwd: carbonFwd, ghgIntensityNow: ghgNow,
    ghgIntensityTarget: ghgTarget, revenue, maturityYr: maturity, wacc
  }), [principal, baseRate, greenium, carbonFwd, ghgNow, ghgTarget, revenue, maturity, wacc]);

  const credScore = useMemo(() => {
    return CREDIBILITY_CRITERIA.reduce((s, c, i) => s + credScores[i] * c.weight / 100, 0);
  }, [credScores]);

  const pathwayData = useMemo(() => Array.from({ length: maturity + 1 }, (_, y) => ({
    year: 2025 + y,
    current: +(ghgNow * Math.pow(1 - 0.02, y)).toFixed(0),
    target:  +(ghgNow - (ghgNow - ghgTarget) * y / maturity).toFixed(0),
    parisAligned: +(ghgNow * Math.pow(1 - 0.072, y)).toFixed(0),
  })), [ghgNow, ghgTarget, maturity]);

  const mktVolumeData = [
    { year: 2020, transition: 4,  sll: 120, green: 290 },
    { year: 2021, transition: 8,  sll: 717, green: 512 },
    { year: 2022, transition: 12, sll: 843, green: 487 },
    { year: 2023, transition: 18, sll: 714, green: 563 },
    { year: 2024, transition: 25, sll: 780, green: 600 },
  ];

  const portfolioData = useMemo(() => Array.from({ length: 8 }, (_, i) => ({
    company: `Borrower ${i + 1}`,
    sector: TRANSITION_SECTORS[i % TRANSITION_SECTORS.length].sector,
    exposure: +(50 + sr(i * 7) * 200).toFixed(0),
    credibility: +(40 + sr(i * 13) * 55).toFixed(0),
    onTrack: sr(i * 3) > 0.35,
    nextReview: `Q${(i % 4) + 1} 2025`,
  })), []);

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
        <div style={{ fontSize: 11, color: T.gold, fontFamily: T.mono, letterSpacing: 2, marginBottom: 6 }}>EP-DW2 · FI CLIMATE FINANCE INSTRUMENTS</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Transition Finance Engine</h1>
        <div style={{ fontSize: 13, color: T.textSec, marginTop: 6 }}>Paris-Aligned Lending · Transition Bond Framework · Credibility Scoring · Sector Pathways · GFANZ / ICMA / EU Taxonomy</div>
      </div>

      <div style={styles.tabs}>
        {TABS.map((t, i) => <button key={t} style={styles.tab(tab === i)} onClick={() => setTab(i)}>{t}</button>)}
      </div>

      {tab === 0 && (
        <div>
          <div style={styles.grid4}>
            <KpiCard label="Hard-to-Abate Emissions" value="15B" unit="t CO₂/yr" sub="Steel/cement/chemicals/shipping/aviation" />
            <KpiCard label="Transition Finance Gap" value="$5.5T" unit="/yr" sub="vs. $1.2T current flow (2024)" color={T.red} />
            <KpiCard label="GFANZ Members Assets" value="$150T" unit="" sub="Committed to net-zero alignment" color={T.green} />
            <KpiCard label="FI Opportunity" value="$4T+" unit="" sub="Annual transition lending addressable" color={T.gold} />
          </div>
          <div style={styles.grid2}>
            <div style={styles.panel}>
              <div style={styles.h3}>Why Transition Finance Is the Critical FI Opportunity</div>
              <div style={{ fontSize: 13, color: T.textSec, lineHeight: 1.9 }}>
                <div>• <span style={{ color: T.gold }}>$5.5T/yr</span> annual finance gap for net-zero transition — largest single capital deployment opportunity in history</div>
                <div>• Hard-to-abate sectors (steel, cement, chemicals, shipping) cannot be financed with pure green bonds — transition structures required</div>
                <div>• GFANZ 2030 commitments require FIs to <span style={{ color: T.gold }}>decarbonize financed emissions</span>, not just grow green books</div>
                <div>• EU, UK, Singapore taxonomies now have <span style={{ color: T.gold }}>explicit transition categories</span> — legal clarity emerging</div>
                <div>• Banks that lead transition financing gain <span style={{ color: T.gold }}>50-100bps fee premium</span> vs. plain corporate lending</div>
                <div>• Stranded asset risk: FIs with high-carbon loan books face <span style={{ color: T.red }}>regulatory capital surcharges</span> from 2026 (Basel IV + ECB)</div>
              </div>
            </div>
            <div style={styles.panel}>
              <div style={styles.h3}>Transition Finance Principles — GFANZ Framework</div>
              {[
                { p: "Aligned to 1.5°C", d: "Transition plan consistent with Paris Agreement; sectoral pathways published" },
                { p: "Whole-Economy View", d: "Finance flows to all sectors including hard-to-abate; no exclusive green-only approach" },
                { p: "No New Carbon Lock-In", d: "No new long-lived fossil fuel infrastructure inconsistent with net-zero pathways" },
                { p: "Just Transition", d: "Worker and community impacts addressed in transition plans" },
                { p: "Credible Plans", d: "Time-bound milestones with accountability; not just aspirational pledges" },
                { p: "Annual Disclosure", d: "Progress against transition plan disclosed per TCFD/ISSB IFRS S2" },
              ].map(p => (
                <div key={p.p} style={{ padding: "7px 0", borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
                  <span style={{ color: T.gold, fontWeight: 600 }}>{p.p}:</span>
                  <span style={{ color: T.textSec, marginLeft: 8 }}>{p.d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div style={styles.grid2}>
          <div>
            <div style={styles.panel}>
              <div style={styles.h3}>Transition Loan Parameters</div>
              <Slider label="Loan Principal" value={principal} min={50} max={2000} step={50} onChange={setPrincipal} unit=" $M" />
              <Slider label="Base Lending Rate" value={baseRate} min={2} max={10} step={0.25} onChange={setBaseRate} unit="%" />
              <Slider label="Transition Greenium" value={greenium} min={0} max={40} step={2.5} onChange={setGreenium} unit=" bps" />
              <Slider label="Forward Carbon Price" value={carbonFwd} min={20} max={300} step={10} onChange={setCarbonFwd} unit=" $/t" />
              <Slider label="GHG Intensity (now)" value={ghgNow} min={100} max={2000} step={50} onChange={setGhgNow} unit=" tCO₂/$M rev" />
              <Slider label="GHG Intensity (target)" value={ghgTarget} min={50} max={1500} step={50} onChange={setGhgTarget} unit=" tCO₂/$M rev" />
              <Slider label="Borrower Revenue" value={revenue} min={200} max={10000} step={100} onChange={setRevenue} unit=" $M" />
              <Slider label="Loan Maturity" value={maturity} min={3} max={15} step={1} onChange={setMaturity} unit=" yr" />
              <Slider label="Discount Rate" value={wacc} min={3} max={12} step={0.25} onChange={setWacc} unit="%" />
            </div>
          </div>
          <div>
            <div style={styles.grid2}>
              <KpiCard label="All-In Rate" value={`${loan.allIn.toFixed(2)}%`} unit="" sub="Including greenium discount" color={T.gold} />
              <KpiCard label="Annual Interest" value={`$${loan.annInt.toFixed(1)}M`} unit="" sub="Expected all-in cost" />
              <KpiCard label="Carbon Saving/yr" value={`$${loan.carbonSaving.toFixed(1)}M`} unit="" sub={`@$${carbonFwd}/t forward`} color={T.green} />
              <KpiCard label="PV Carbon Benefit" value={`$${loan.pvSaving.toFixed(0)}M`} unit="" sub={`${maturity}yr discounted`} color={T.teal} />
            </div>
            <div style={styles.panel}>
              <div style={styles.h3}>GHG Reduction Pathway vs. Paris</div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={pathwayData} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 10, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 10, fill: T.textSec }} unit=" t" />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}` }} />
                  <Legend />
                  <Line type="monotone" dataKey="current" name="BAU Trajectory" stroke={T.red} strokeWidth={2} dot={false} strokeDasharray="5 3" />
                  <Line type="monotone" dataKey="target" name="Loan Target" stroke={T.gold} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="parisAligned" name="Paris 1.5°C (-7.2%/yr)" stroke={T.green} strokeWidth={2} dot={false} strokeDasharray="3 3" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 2 && (
        <div>
          <div style={styles.panel}>
            <div style={styles.h3}>Hard-to-Abate Sector Transition Pathways</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
              {TRANSITION_SECTORS.map((s, i) => (
                <button key={s.sector} onClick={() => setSelectedSector(i)} style={styles.tab(selectedSector === i)}>{s.sector}</button>
              ))}
            </div>
            {(() => {
              const s = TRANSITION_SECTORS[selectedSector];
              return (
                <div style={styles.grid2}>
                  <table style={{ borderCollapse: "collapse", fontSize: 12 }}>
                    {[["Sector", s.sector], ["Global Emissions", `${s.emissions} MtCO₂/yr`], ["Transition Pathway", s.pathway],
                      ["Timeline", s.timeline], ["Estimated Capex", s.capex], ["Credibility", s.credibility], ["Primary Framework", s.framework]].map(([k, v]) => (
                      <tr key={k} style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: "6px 10px", color: T.textSec }}>{k}</td>
                        <td style={{ padding: "6px 10px", color: T.text, fontFamily: T.mono }}>{v}</td>
                      </tr>
                    ))}
                  </table>
                  <div style={styles.panel}>
                    <div style={styles.h3}>Sector Emissions by Scale (MtCO₂/yr)</div>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={[...TRANSITION_SECTORS].sort((a, b) => b.emissions - a.emissions)} margin={{ top: 5, right: 10, bottom: 50, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                        <XAxis dataKey="sector" tick={{ fontSize: 9, fill: T.textMut }} angle={-30} textAnchor="end" />
                        <YAxis tick={{ fontSize: 10, fill: T.textSec }} unit=" Mt" />
                        <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}` }} />
                        <Bar dataKey="emissions" name="Emissions (Mt)" fill={T.amber} />
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
        <div style={styles.grid2}>
          <div style={styles.panel}>
            <div style={styles.h3}>Transition Plan Credibility Scorer</div>
            <div style={{ fontSize: 12, color: T.textSec, marginBottom: 12 }}>Rate each criterion 0–100 for the borrower's transition plan</div>
            {CREDIBILITY_CRITERIA.map((c, i) => (
              <div key={c.criterion} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12 }}>{c.criterion} <span style={{ color: T.textMut }}>({c.weight}%)</span></span>
                  <span style={{ fontSize: 12, fontFamily: T.mono, color: credScores[i] >= 70 ? T.green : credScores[i] >= 45 ? T.amber : T.red }}>{credScores[i]}/100</span>
                </div>
                <input type="range" min={0} max={100} step={5} value={credScores[i]}
                  onChange={e => { const n = [...credScores]; n[i] = Number(e.target.value); setCredScores(n); }}
                  style={{ width: "100%", accentColor: T.gold }} />
                <div style={{ fontSize: 10, color: T.textMut }}>{c.assessment}</div>
              </div>
            ))}
          </div>
          <div>
            <div style={styles.panel}>
              <div style={styles.h3}>Overall Credibility Score</div>
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ fontSize: 64, fontWeight: 700, fontFamily: T.mono,
                  color: credScore >= 70 ? T.green : credScore >= 50 ? T.amber : T.red }}>{credScore.toFixed(0)}</div>
                <div style={{ fontSize: 14, color: T.textSec }}>out of 100</div>
                <div style={{ marginTop: 10, fontSize: 14, fontWeight: 600,
                  color: credScore >= 70 ? T.green : credScore >= 50 ? T.amber : T.red }}>
                  {credScore >= 70 ? "CREDIBLE — Eligible for Transition Finance" : credScore >= 50 ? "CONDITIONAL — Covenants Required" : "WEAK — Enhanced Due Diligence Required"}
                </div>
              </div>
            </div>
            <div style={styles.panel}>
              <div style={styles.h3}>Score Breakdown</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={CREDIBILITY_CRITERIA.map((c, i) => ({ name: c.criterion.split(" ")[0], score: credScores[i], weight: c.weight }))} layout="vertical" margin={{ top: 5, right: 30, bottom: 5, left: 150 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: T.textSec }} domain={[0, 100]} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: T.textSec }} width={145} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}` }} />
                  <Bar dataKey="score" name="Score" fill={T.gold} />
                  <ReferenceLine x={70} stroke={T.green} strokeDasharray="4 4" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 4 && (
        <div style={styles.panel}>
          <div style={styles.h3}>Taxonomy Alignment Matrix — Transition Activities</div>
          {TAXONOMY_ALIGNMENT.map(fw => (
            <div key={fw.framework} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.gold, marginBottom: 8 }}>{fw.framework}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <div style={{ background: "#0d2a1a", border: `1px solid ${T.sage}`, borderRadius: 6, padding: 10 }}>
                  <div style={{ fontSize: 11, color: T.green, fontFamily: T.mono, marginBottom: 6 }}>ELIGIBLE / GREEN</div>
                  {fw.eligible.map(e => <div key={e} style={{ fontSize: 11, color: T.textSec }}>• {e}</div>)}
                </div>
                <div style={{ background: "#2d1a00", border: `1px solid ${T.amber}`, borderRadius: 6, padding: 10 }}>
                  <div style={{ fontSize: 11, color: T.amber, fontFamily: T.mono, marginBottom: 6 }}>TRANSITIONAL</div>
                  {fw.transitional.map(e => <div key={e} style={{ fontSize: 11, color: T.textSec }}>• {e}</div>)}
                </div>
                <div style={{ background: "#2d0000", border: `1px solid ${T.red}`, borderRadius: 6, padding: 10 }}>
                  <div style={{ fontSize: 11, color: T.red, fontFamily: T.mono, marginBottom: 6 }}>EXCLUDED</div>
                  {fw.excluded.map(e => <div key={e} style={{ fontSize: 11, color: T.textSec }}>• {e}</div>)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 5 && (
        <div style={styles.panel}>
          <div style={styles.h3}>Transition Finance Bond Type Navigator</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.gold}` }}>
                  {["Bond Type", "Use of Proceeds", "Taxonomy", "Greenwash Risk", "Market Acceptance", "Avg Size ($M)"].map(h => (
                    <th key={h} style={{ padding: "7px 10px", textAlign: "left", color: T.gold, fontFamily: T.mono, fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {BOND_TYPES.map((b, i) => (
                  <tr key={b.type} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 ? T.surfaceH : "transparent" }}>
                    <td style={{ padding: "7px 10px", fontWeight: 600, color: T.gold }}>{b.type}</td>
                    <td style={{ padding: "7px 10px", color: T.textSec }}>{b.useOfProceeds}</td>
                    <td style={{ padding: "7px 10px", color: T.teal, fontSize: 11 }}>{b.taxonomy}</td>
                    <td style={{ padding: "7px 10px", color: b.greenwashRisk === "Low" || b.greenwashRisk === "Low-Med" ? T.green : b.greenwashRisk.includes("High") ? T.red : T.amber }}>{b.greenwashRisk}</td>
                    <td style={{ padding: "7px 10px", color: b.mktAcceptance === "High" ? T.green : T.amber }}>{b.mktAcceptance}</td>
                    <td style={{ padding: "7px 10px", fontFamily: T.mono }}>${b.avgSize}M</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 6 && (
        <div style={styles.panel}>
          <div style={styles.h3}>FI Underwriting — Key Risk Factors for Transition Lending</div>
          {[
            { risk: "Transition Plan Credibility", weight: "High", assessment: "Score transition plan against GFANZ/SBTi framework; require third-party review", covenant: "Annual transition plan update covenant; step-up if credibility score falls below threshold" },
            { risk: "Technology Execution Risk", weight: "High", assessment: "Assess whether required transition technologies are available at commercial scale", covenant: "Milestone-linked drawdown; independent technical advisor sign-off" },
            { risk: "Carbon Price Risk", weight: "Medium", assessment: "Model sensitivity to carbon prices from $50–$300/t; borrower carbon cost exposure", covenant: "Carbon hedging requirement above $X cost threshold" },
            { risk: "Stranded Asset Exposure", weight: "High", assessment: "Identify high-carbon assets in borrower portfolio; estimate write-down scenarios", covenant: "LTV adjusted for stranded asset probability; annual asset review" },
            { risk: "Policy / Regulatory Risk", weight: "Medium", assessment: "Assess regulatory trajectory; border carbon adjustments (CBAM) impact on competitiveness", covenant: "Material adverse change clause for regulatory shifts" },
            { risk: "Greenwashing / Reputation Risk", weight: "Medium", assessment: "Review transition plan against sector peers; verify no retrograde activities", covenant: "SPO requirement; public disclosure of transition plan" },
          ].map(r => (
            <div key={r.risk} style={{ padding: "10px 0", borderBottom: `1px solid ${T.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{r.risk}</div>
                  <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>Assessment: {r.assessment}</div>
                  <div style={{ fontSize: 11, color: T.teal, marginTop: 2 }}>Covenant: {r.covenant}</div>
                </div>
                <span style={{ fontFamily: T.mono, fontSize: 11, padding: "2px 8px", borderRadius: 4, marginLeft: 10, whiteSpace: "nowrap",
                  background: r.weight === "High" ? "#3d0000" : "#2d1a00",
                  color: r.weight === "High" ? T.red : T.amber }}>{r.weight}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 7 && (
        <div style={styles.grid2}>
          <div style={styles.panel}>
            <div style={styles.h3}>Transition Loan Deal Structuring Checklist</div>
            {[
              { phase: "Pre-Mandate", items: ["Transition plan credibility assessment", "KPI / milestone identification", "Sector pathway benchmarking", "SPO provider selection"] },
              { phase: "Structuring", items: ["Greenium / fee structure agreed", "Milestone drawdown schedule", "Annual review covenant", "Independent Technical Advisor (ITA) scope"] },
              { phase: "Documentation", items: ["Transition Finance Framework", "Facility Agreement (transition clauses)", "SPO letter issued", "ITA engagement letter"] },
              { phase: "Post-Closing", items: ["Annual transition plan progress report", "KPI/milestone verification", "Ratchet observation date", "Public disclosure (TCFD/ISSB format)"] },
            ].map(p => (
              <div key={p.phase} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.gold, marginBottom: 6 }}>{p.phase}</div>
                {p.items.map(item => (
                  <div key={item} style={{ fontSize: 12, color: T.textSec, padding: "2px 0" }}>✓ {item}</div>
                ))}
              </div>
            ))}
          </div>
          <div style={styles.panel}>
            <div style={styles.h3}>Fee Schedule — Transition Loan vs. Plain Corporate</div>
            {[
              { fee: "Arrangement Fee", transition: "40–55 bps", plain: "20–30 bps", delta: "+15–25 bps" },
              { fee: "Annual Agency Fee", transition: "$75–150K/yr", plain: "$25–50K/yr", delta: "+$50–100K" },
              { fee: "SPO / Framework Cost", transition: "$80–150K (once)", plain: "N/A", delta: "New line item" },
              { fee: "ITA / Milestone Review", transition: "$50–100K/yr", plain: "N/A", delta: "New line item" },
              { fee: "KPI Monitoring", transition: "$25K/KPI/yr", plain: "N/A", delta: "New line item" },
              { fee: "Greenium Benefit (borrower)", transition: "−10–25 bps/yr", plain: "0", delta: "Borrower saving" },
            ].map(f => (
              <div key={f.fee} style={{ display: "grid", gridTemplateColumns: "40% 25% 20% 15%", padding: "6px 0", borderBottom: `1px solid ${T.border}`, fontSize: 11 }}>
                <span style={{ color: T.textSec }}>{f.fee}</span>
                <span style={{ fontFamily: T.mono, color: T.gold }}>{f.transition}</span>
                <span style={{ fontFamily: T.mono, color: T.textSec }}>{f.plain}</span>
                <span style={{ fontFamily: T.mono, color: T.green }}>{f.delta}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 8 && (
        <div style={styles.panel}>
          <div style={styles.h3}>Transition Finance Market — Volume Trends ($B)</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={mktVolumeData} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize: 10, fill: T.textSec }} />
              <YAxis tick={{ fontSize: 10, fill: T.textSec }} unit="$B" />
              <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}` }} />
              <Legend />
              <Bar dataKey="transition" name="Transition Bonds/Loans" fill={T.amber} />
              <Bar dataKey="sll" name="SLL" fill={T.teal} />
              <Bar dataKey="green" name="Green Bonds/Loans" fill={T.green} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 12, fontSize: 12, color: T.textSec }}>
            Transition finance is the fastest-growing segment but remains small vs. SLL/green. Primary growth catalyst: GFANZ sectoral pathway publications + EU taxonomy transition category clarity (expected 2025/26).
          </div>
        </div>
      )}

      {tab === 9 && (
        <div style={styles.panel}>
          <div style={styles.h3}>Transition Finance Portfolio Monitoring Dashboard</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.gold}` }}>
                  {["Borrower", "Sector", "Exposure ($M)", "Credibility Score", "On Track?", "Next Milestone Review"].map(h => (
                    <th key={h} style={{ padding: "7px 10px", textAlign: "left", color: T.gold, fontFamily: T.mono, fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {portfolioData.map((b, i) => (
                  <tr key={b.company} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 ? T.surfaceH : "transparent" }}>
                    <td style={{ padding: "7px 10px", color: T.text }}>{b.company}</td>
                    <td style={{ padding: "7px 10px", color: T.textSec }}>{b.sector}</td>
                    <td style={{ padding: "7px 10px", fontFamily: T.mono, color: T.gold }}>${b.exposure}M</td>
                    <td style={{ padding: "7px 10px", fontFamily: T.mono, color: b.credibility >= 65 ? T.green : b.credibility >= 45 ? T.amber : T.red }}>{b.credibility}/100</td>
                    <td style={{ padding: "7px 10px" }}>
                      <span style={{ background: b.onTrack ? T.sage : "#3d0000", color: T.text, borderRadius: 4, padding: "2px 8px", fontSize: 10 }}>{b.onTrack ? "On Track" : "At Risk"}</span>
                    </td>
                    <td style={{ padding: "7px 10px", fontFamily: T.mono, color: T.textSec }}>{b.nextReview}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 16 }}>
            <div style={styles.h3}>Portfolio Credibility Distribution</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={portfolioData} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="company" tick={{ fontSize: 9, fill: T.textMut }} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}` }} />
                <Bar dataKey="credibility" name="Credibility Score" fill={T.gold} />
                <ReferenceLine y={70} stroke={T.green} strokeDasharray="4 4" label={{ value: "Eligible threshold", fill: T.green, fontSize: 10 }} />
                <ReferenceLine y={50} stroke={T.amber} strokeDasharray="4 4" label={{ value: "Conditional", fill: T.amber, fontSize: 10 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
