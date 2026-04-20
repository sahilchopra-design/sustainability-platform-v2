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

function npv(cashflows, r) {
  return cashflows.reduce((s, cf, t) => s + cf / Math.pow(1 + r / 100, t), 0);
}

function calcDscr({ revenueMyr, opexMyr, debtServiceMyr }) {
  return debtServiceMyr > 0 ? +((revenueMyr - opexMyr) / debtServiceMyr).toFixed(2) : 0;
}

const WELL_RISK_FACTORS = [
  { factor: "Reservoir Temperature", weight: 25, base: 0.72, desc: "Temperature uncertainty from surface surveys" },
  { factor: "Permeability / Flow Rate", weight: 30, base: 0.68, desc: "Subsurface permeability estimation accuracy" },
  { factor: "Fluid Chemistry", weight: 15, base: 0.82, desc: "Non-condensable gas content, scaling risk" },
  { factor: "Structural Geology", weight: 20, base: 0.75, desc: "Fault connectivity, reservoir geometry" },
  { factor: "Drilling Success",  weight: 10, base: 0.80, desc: "Mechanical success, no loss of well" },
];

const RISK_CATEGORIES = [
  { category: "Geological Risk",    prob: 35, impact: 4.5, color: "#c0392b" },
  { category: "Technical Risk",     prob: 25, impact: 3.2, color: "#e67e22" },
  { category: "Regulatory Risk",    prob: 20, impact: 2.8, color: "#d4a843" },
  { category: "Financial Risk",     prob: 30, impact: 3.8, color: "#7c3aed" },
  { category: "Environmental Risk", prob: 15, impact: 2.5, color: "#27ae60" },
  { category: "Market/Offtake Risk",prob: 20, impact: 2.2, color: "#0d9488" },
];

const FINANCING_STRUCTURES = [
  { name: "Project Finance (Non-Recourse)", debtPct: 70, debtRate: 6.5, tenor: 18, minDscr: 1.30, moody: "Baa2", typical: "IFC/DFI + commercial banks" },
  { name: "Corporate Finance (On-Balance)", debtPct: 50, debtRate: 5.0, tenor: 12, minDscr: 1.20, moody: "Baa1", typical: "Utility / major developer" },
  { name: "DFI Concessional",              debtPct: 75, debtRate: 3.5, tenor: 20, minDscr: 1.25, moody: "N/A",  typical: "World Bank, AfDB, KfW" },
  { name: "Green Bond",                    debtPct: 60, debtRate: 5.5, tenor: 15, minDscr: 1.30, moody: "Baa2", typical: "Climate bond standard" },
];

const TABS = [
  "Project Overview", "Drilling Risk Model", "Financing Structure", "DSCR Analysis",
  "Monte Carlo Risk", "Debt Service Waterfall", "Risk Matrix", "LP/GP Returns",
  "Case Studies", "Investor Dashboard"
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

export default function GeothermalProjectFinancePage() {
  const [tab, setTab] = useState(0);
  const [capexM, setCapexM]     = useState(180);
  const [powerMw, setPowerMw]   = useState(50);
  const [ppa, setPpa]           = useState(85);
  const [cf, setCf]             = useState(93);
  const [opexMyr, setOpexMyr]   = useState(8);
  const [debtPct, setDebtPct]   = useState(70);
  const [debtRate, setDebtRate] = useState(6.5);
  const [tenor, setTenor]       = useState(18);
  const [wacc, setWacc]         = useState(9);
  const [wellSucc, setWellSucc] = useState(72);
  const [numWells, setNumWells] = useState(18);
  const [selectedStruct, setSelectedStruct] = useState(0);

  const annMwh = powerMw * cf / 100 * 8760;
  const revenueMyr = annMwh * ppa / 1e6;
  const debtM = capexM * debtPct / 100;
  const equityM = capexM - debtM;
  const annDebtService = debtM * 1e6 * (debtRate / 100) / (1 - Math.pow(1 + debtRate / 100, -tenor)) / 1e6;
  const dscr = calcDscr({ revenueMyr, opexMyr, debtServiceMyr: annDebtService });
  const ebitda = revenueMyr - opexMyr;

  const equityCashflows = useMemo(() => {
    const arr = [-equityM];
    for (let y = 1; y <= 30; y++) {
      const ds = y <= tenor ? annDebtService : 0;
      arr.push(Math.max(0, revenueMyr - opexMyr - ds));
    }
    return arr;
  }, [equityM, revenueMyr, opexMyr, annDebtService, tenor]);

  const equityIrr = useMemo(() => irr(equityCashflows), [equityCashflows]);
  const projectNpv = useMemo(() => npv([-capexM, ...Array(30).fill(ebitda)], wacc), [capexM, ebitda, wacc]);

  const successProb = useMemo(() => {
    const composite = WELL_RISK_FACTORS.reduce((s, f) => s + f.base * f.weight, 0) / 100;
    return +(composite * (wellSucc / 75) * 100).toFixed(1);
  }, [wellSucc]);

  const mcPaths = useMemo(() => {
    return Array.from({ length: 200 }, (_, i) => {
      const capexVar  = capexM * (0.85 + sr(i * 3) * 0.3);
      const revenueVar = revenueMyr * (0.8 + sr(i * 7) * 0.4);
      const opexVar   = opexMyr * (0.9 + sr(i * 11) * 0.2);
      const debtVar   = capexVar * debtPct / 100;
      const equityVar = capexVar - debtVar;
      const dsVar     = debtVar * 1e6 * (debtRate / 100) / (1 - Math.pow(1 + debtRate / 100, -tenor)) / 1e6;
      const cf2 = [-equityVar, ...Array(30).fill(Math.max(0, revenueVar - opexVar - dsVar))];
      const r = irr(cf2) * 100;
      return isFinite(r) && r > -50 && r < 100 ? r : null;
    }).filter(r => r !== null);
  }, [capexM, revenueMyr, opexMyr, debtPct, debtRate, tenor]);

  const mcStats = useMemo(() => {
    if (mcPaths.length === 0) return { p10: 0, p50: 0, p90: 0, mean: 0 };
    const sorted = [...mcPaths].sort((a, b) => a - b);
    const n = sorted.length;
    return {
      p10:  +sorted[Math.floor(n * 0.10)].toFixed(2),
      p50:  +sorted[Math.floor(n * 0.50)].toFixed(2),
      p90:  +sorted[Math.floor(n * 0.90)].toFixed(2),
      mean: +(mcPaths.reduce((s, v) => s + v, 0) / n).toFixed(2),
    };
  }, [mcPaths]);

  const mcHistogram = useMemo(() => {
    const bins = Array.from({ length: 20 }, (_, i) => ({ irr: -10 + i * 3, count: 0 }));
    mcPaths.forEach(r => {
      const idx = Math.min(19, Math.max(0, Math.floor((r + 10) / 3)));
      bins[idx].count++;
    });
    return bins;
  }, [mcPaths]);

  const dsWaterfall = useMemo(() => Array.from({ length: Math.min(tenor, 20) }, (_, y) => ({
    year: y + 1,
    revenue: +revenueMyr.toFixed(2),
    opex: +opexMyr.toFixed(2),
    debtService: +annDebtService.toFixed(2),
    equityDist: +Math.max(0, revenueMyr - opexMyr - annDebtService).toFixed(2),
    dscr: +calcDscr({ revenueMyr, opexMyr, debtServiceMyr: annDebtService }).toFixed(2),
  })), [revenueMyr, opexMyr, annDebtService, tenor]);

  const caseStudies = [
    { name: "Olkaria IV, Kenya", mw: 140, capex: 590, ppa: 90, irr: 12.4, funder: "World Bank + KenGen", status: "Operating", dscr: 1.55 },
    { name: "Cerro Prieto IV, Mexico", mw: 100, capex: 380, ppa: 75, irr: 10.8, funder: "CFE (State)", status: "Operating", dscr: 1.42 },
    { name: "Sarulla, Indonesia", mw: 330, capex: 1600, ppa: 95, irr: 11.2, funder: "JBIC + ADB + commercial", status: "Operating", dscr: 1.48 },
    { name: "Te Mihi, NZ", mw: 166, capex: 500, ppa: 80, irr: 13.1, funder: "Contact Energy (corporate)", status: "Operating", dscr: 1.61 },
    { name: "Fervo Cape, USA", mw: 400, capex: 2000, ppa: 110, irr: 9.5, funder: "PE + Google PPA", status: "Development", dscr: 1.35 },
    { name: "Corbetti, Ethiopia", mw: 500, capex: 2800, ppa: 88, irr: 10.2, funder: "OPIC + DFI + equity", status: "Development", dscr: 1.40 },
  ];

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
        <div style={{ fontSize: 11, color: T.gold, fontFamily: T.mono, letterSpacing: 2, marginBottom: 6 }}>EP-DV2 · GEOTHERMAL ENERGY FINANCE</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Geothermal Project Finance & Drilling Risk</h1>
        <div style={{ fontSize: 13, color: T.textSec, marginTop: 6 }}>Well Success Probability · Monte Carlo Resource Risk · DSCR · DFI Financing · LP/GP Waterfall</div>
      </div>

      <div style={styles.tabs}>
        {TABS.map((t, i) => <button key={t} style={styles.tab(tab === i)} onClick={() => setTab(i)}>{t}</button>)}
      </div>

      {tab === 0 && (
        <div style={styles.grid2}>
          <div>
            <div style={styles.panel}>
              <div style={styles.h3}>Project Parameters</div>
              <Slider label="Total Project CAPEX" value={capexM} min={30} max={1000} step={10} onChange={setCapexM} unit=" $M" />
              <Slider label="Net Power Capacity" value={powerMw} min={5} max={200} step={5} onChange={setPowerMw} unit=" MW" />
              <Slider label="PPA / Energy Price" value={ppa} min={40} max={150} step={5} onChange={setPpa} unit=" $/MWh" />
              <Slider label="Capacity Factor" value={cf} min={70} max={98} step={1} onChange={setCf} unit="%" />
              <Slider label="Annual O&M Cost" value={opexMyr} min={2} max={30} step={0.5} onChange={setOpexMyr} unit=" $M/yr" />
              <Slider label="Debt Share" value={debtPct} min={40} max={80} step={5} onChange={setDebtPct} unit="%" />
              <Slider label="Debt Interest Rate" value={debtRate} min={3} max={12} step={0.5} onChange={setDebtRate} unit="%" />
              <Slider label="Debt Tenor" value={tenor} min={10} max={25} step={1} onChange={setTenor} unit=" yr" />
              <Slider label="WACC" value={wacc} min={6} max={16} step={0.5} onChange={setWacc} unit="%" />
            </div>
          </div>
          <div>
            <div style={styles.grid2}>
              <KpiCard label="DSCR" value={dscr.toFixed(2)} unit="x" sub={dscr >= 1.3 ? "Above covenant" : "Below covenant ⚠"} color={dscr >= 1.3 ? T.green : T.red} />
              <KpiCard label="Equity IRR" value={(equityIrr * 100).toFixed(1)} unit="%" sub="30-yr levered return" color={T.gold} />
              <KpiCard label="Project NPV" value={projectNpv > 0 ? `+$${projectNpv.toFixed(0)}M` : `-$${Math.abs(projectNpv).toFixed(0)}M`} unit="" sub={`@${wacc}% WACC`} color={projectNpv > 0 ? T.green : T.red} />
              <KpiCard label="Annual Revenue" value={revenueMyr.toFixed(1)} unit="$M/yr" sub={`${(annMwh / 1e6).toFixed(2)} TWh`} />
              <KpiCard label="Debt" value={debtM.toFixed(0)} unit="$M" sub={`$${annDebtService.toFixed(1)}M/yr service`} color={T.amber} />
              <KpiCard label="Equity" value={equityM.toFixed(0)} unit="$M" sub={`${(100 - debtPct)}% project equity`} color={T.teal} />
            </div>
            <div style={styles.panel}>
              <div style={styles.h3}>Revenue vs. Cost Waterfall</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[{ name: "Revenue", val: revenueMyr }, { name: "O&M", val: -opexMyr }, { name: "Debt Svc", val: -annDebtService }, { name: "Equity Dist", val: Math.max(0, revenueMyr - opexMyr - annDebtService) }]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 10, fill: T.textSec }} unit="$M" />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}` }} formatter={v => [`$${v.toFixed(1)}M`]} />
                  <Bar dataKey="val" name="$M/yr" fill={T.gold} />
                  <ReferenceLine y={0} stroke={T.border} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div>
          <div style={styles.grid3}>
            <KpiCard label="Composite Success Prob." value={`${successProb}%`} unit="" sub="Weighted well success model" color={successProb > 70 ? T.green : T.amber} />
            <KpiCard label="Field Success Rate" value={`${wellSucc}%`} unit="" sub="User-defined base rate" />
            <KpiCard label="Expected Productive Wells" value={Math.round(numWells * successProb / 100)} unit={`of ${numWells}`} sub="Expected producers" color={T.teal} />
          </div>
          <div style={styles.panel}>
            <div style={styles.h3}>Well Success Probability Model</div>
            <div style={styles.grid2} style={{ marginBottom: 16 }}>
              <Slider label="Base Field Success Rate (historic)" value={wellSucc} min={40} max={95} step={1} onChange={setWellSucc} unit="%" />
              <Slider label="Total Wells Planned" value={numWells} min={4} max={40} step={1} onChange={setNumWells} unit=" wells" />
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.gold}` }}>
                  {["Risk Factor", "Weight (%)", "Base Score", "Adj. Score", "Contribution"].map(h => (
                    <th key={h} style={{ padding: "7px 10px", textAlign: "left", color: T.gold, fontFamily: T.mono, fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {WELL_RISK_FACTORS.map((f, i) => {
                  const adj = +(f.base * (wellSucc / 75)).toFixed(3);
                  const contrib = +(adj * f.weight / 100 * 100).toFixed(1);
                  return (
                    <tr key={f.factor} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 ? T.surfaceH : "transparent" }}>
                      <td style={{ padding: "7px 10px" }}>{f.factor}</td>
                      <td style={{ padding: "7px 10px", fontFamily: T.mono }}>{f.weight}%</td>
                      <td style={{ padding: "7px 10px", fontFamily: T.mono, color: T.textSec }}>{(f.base * 100).toFixed(0)}%</td>
                      <td style={{ padding: "7px 10px", fontFamily: T.mono, color: adj >= 0.7 ? T.green : T.amber }}>{(adj * 100).toFixed(0)}%</td>
                      <td style={{ padding: "7px 10px", fontFamily: T.mono, color: T.gold }}>{contrib}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={styles.panel}>
            <div style={styles.h3}>Drilling Cost vs. Success Probability Sensitivity</div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={Array.from({ length: 11 }, (_, i) => {
                const p = 50 + i * 5;
                const expectedDryCost = capexM * 0.55 * (1 - p / 100) * 0.4;
                return { successPct: p, riskPremium: +expectedDryCost.toFixed(1) };
              })} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="successPct" tick={{ fontSize: 10, fill: T.textSec }} unit="%" />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} unit="$M" />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}` }} />
                <Line type="monotone" dataKey="riskPremium" name="Dry Hole Cost Risk ($M)" stroke={T.amber} strokeWidth={2} dot={false} />
                <ReferenceLine x={wellSucc} stroke={T.gold} strokeDasharray="4 4" label={{ value: "Current", fill: T.gold, fontSize: 10 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 2 && (
        <div>
          <div style={styles.panel}>
            <div style={styles.h3}>Financing Structure Selection</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              {FINANCING_STRUCTURES.map((s, i) => (
                <button key={s.name} onClick={() => setSelectedStruct(i)}
                  style={styles.tab(selectedStruct === i)}>{s.name}</button>
              ))}
            </div>
            {(() => {
              const s = FINANCING_STRUCTURES[selectedStruct];
              const adjDebt = capexM * s.debtPct / 100;
              const adjEquity = capexM - adjDebt;
              const adjDS = adjDebt * 1e6 * (s.debtRate / 100) / (1 - Math.pow(1 + s.debtRate / 100, -s.tenor)) / 1e6;
              const adjDscr = calcDscr({ revenueMyr, opexMyr, debtServiceMyr: adjDS });
              const adjCfs = [-adjEquity, ...Array(30).fill(Math.max(0, revenueMyr - opexMyr - adjDS))];
              const adjIrr = irr(adjCfs) * 100;
              return (
                <div style={styles.grid2}>
                  <table style={{ borderCollapse: "collapse", fontSize: 12 }}>
                    {[
                      ["Structure", s.name], ["Debt Share", `${s.debtPct}%`], ["Debt Amount", `$${adjDebt.toFixed(0)}M`],
                      ["Equity Amount", `$${adjEquity.toFixed(0)}M`], ["Interest Rate", `${s.debtRate}%`],
                      ["Tenor", `${s.tenor} years`], ["Min. DSCR Covenant", `${s.minDscr}x`],
                      ["Credit Rating", s.moody], ["Typical Lender", s.typical],
                    ].map(([k, v]) => (
                      <tr key={k} style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: "6px 10px", color: T.textSec }}>{k}</td>
                        <td style={{ padding: "6px 10px", color: T.text, fontFamily: T.mono }}>{v}</td>
                      </tr>
                    ))}
                  </table>
                  <div>
                    <div style={styles.grid2}>
                      <KpiCard label="DSCR" value={adjDscr.toFixed(2)} unit="x" sub={adjDscr >= s.minDscr ? "Covenant met" : "Covenant breach ⚠"} color={adjDscr >= s.minDscr ? T.green : T.red} />
                      <KpiCard label="Equity IRR" value={adjIrr.toFixed(1)} unit="%" sub={`${s.tenor}yr debt tenor`} color={T.gold} />
                    </div>
                    <div style={styles.panel}>
                      <div style={styles.h3}>Annual Debt Service ($M)</div>
                      <div style={{ fontSize: 28, fontFamily: T.mono, color: T.amber }}>${adjDS.toFixed(1)}M/yr</div>
                      <div style={{ fontSize: 12, color: T.textSec, marginTop: 4 }}>Principal + interest (level annuity)</div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
          <div style={styles.panel}>
            <div style={styles.h3}>Equity IRR by Financing Structure (at current project params)</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={FINANCING_STRUCTURES.map(s => {
                const d = capexM * s.debtPct / 100;
                const e = capexM - d;
                const ds = d * 1e6 * (s.debtRate / 100) / (1 - Math.pow(1 + s.debtRate / 100, -s.tenor)) / 1e6;
                const cf2 = [-e, ...Array(30).fill(Math.max(0, revenueMyr - opexMyr - ds))];
                return { name: s.name.split(" ")[0] + " " + s.name.split(" ")[1], irr: +(irr(cf2) * 100).toFixed(1) };
              })} margin={{ top: 5, right: 10, bottom: 50, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: T.textMut }} angle={-25} textAnchor="end" />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} unit="%" />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}` }} />
                <Bar dataKey="irr" name="Equity IRR (%)" fill={T.gold} />
                <ReferenceLine y={10} stroke={T.green} strokeDasharray="4 4" label={{ value: "Target 10%", fill: T.green, fontSize: 10 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 3 && (
        <div>
          <div style={styles.grid3}>
            <KpiCard label="DSCR (Year 1)" value={dscr.toFixed(2)} unit="x" sub="Min. covenant typically 1.30x" color={dscr >= 1.3 ? T.green : T.red} />
            <KpiCard label="EBITDA" value={ebitda.toFixed(1)} unit="$M/yr" sub="Revenue minus O&M" color={T.amber} />
            <KpiCard label="Annual Debt Service" value={annDebtService.toFixed(1)} unit="$M/yr" sub={`${tenor}yr annuity @ ${debtRate}%`} />
          </div>
          <div style={styles.panel}>
            <div style={styles.h3}>DSCR Sensitivity — Revenue vs. DSCR</div>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={Array.from({ length: 11 }, (_, i) => {
                const rev = revenueMyr * (0.7 + i * 0.06);
                return { revenue: +rev.toFixed(1), dscr: +calcDscr({ revenueMyr: rev, opexMyr, debtServiceMyr: annDebtService }).toFixed(2) };
              })} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="revenue" tick={{ fontSize: 10, fill: T.textSec }} unit="$M" />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} domain={[0, 3]} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}` }} />
                <Line type="monotone" dataKey="dscr" name="DSCR" stroke={T.gold} strokeWidth={2} dot={false} />
                <ReferenceLine y={1.30} stroke={T.red} strokeDasharray="4 4" label={{ value: "Min Covenant 1.30x", fill: T.red, fontSize: 10 }} />
                <ReferenceLine y={1.0} stroke={T.amber} strokeDasharray="4 4" label={{ value: "Default", fill: T.amber, fontSize: 10 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 4 && (
        <div>
          <div style={styles.grid3}>
            <KpiCard label="MC P10 IRR" value={`${mcStats.p10}%`} unit="" sub="Downside scenario" color={T.red} />
            <KpiCard label="MC P50 IRR" value={`${mcStats.p50}%`} unit="" sub="Base case" color={T.gold} />
            <KpiCard label="MC P90 IRR" value={`${mcStats.p90}%`} unit="" sub="Upside scenario" color={T.green} />
          </div>
          <div style={styles.panel}>
            <div style={styles.h3}>Equity IRR Distribution — 200-Path Monte Carlo</div>
            <div style={{ fontSize: 12, color: T.textSec, marginBottom: 8 }}>
              Capex ±30%, Revenue ±40%, Opex ±20% applied simultaneously via deterministic seeding
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={mcHistogram} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="irr" tick={{ fontSize: 10, fill: T.textSec }} unit="%" />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} label={{ value: "Paths", angle: -90, position: "insideLeft", fill: T.textSec, fontSize: 10 }} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}` }} />
                <Bar dataKey="count" name="Paths" fill={T.gold} />
                <ReferenceLine x={mcStats.p50} stroke={T.green} strokeDasharray="4 4" label={{ value: "P50", fill: T.green, fontSize: 10 }} />
                <ReferenceLine x={10} stroke={T.amber} strokeDasharray="4 4" label={{ value: "Hurdle", fill: T.amber, fontSize: 10 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 5 && (
        <div style={styles.panel}>
          <div style={styles.h3}>Annual Debt Service Waterfall — Year 1 to {Math.min(tenor, 20)}</div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={dsWaterfall} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize: 10, fill: T.textSec }} label={{ value: "Year", position: "insideBottom", offset: -10, fill: T.textSec, fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10, fill: T.textSec }} unit="$M" />
              <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}` }} formatter={v => [`$${v.toFixed(1)}M`]} />
              <Legend />
              <Bar dataKey="opex" name="O&M" stackId="a" fill={T.teal} />
              <Bar dataKey="debtService" name="Debt Service" stackId="a" fill={T.amber} />
              <Bar dataKey="equityDist" name="Equity Distribution" stackId="a" fill={T.gold} />
              <Line type="monotone" dataKey="dscr" name="DSCR (right)" stroke={T.green} strokeWidth={2} dot={false} yAxisId={undefined} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 6 && (
        <div>
          <div style={styles.grid3}>
            <KpiCard label="Top Risk" value="Geological" unit="" sub="35% prob · 4.5/5 impact" color={T.red} />
            <KpiCard label="Weighted Risk Score" value={(RISK_CATEGORIES.reduce((s, r) => s + r.prob * r.impact, 0) / RISK_CATEGORIES.length).toFixed(1)} unit="/100" sub="Portfolio risk score" color={T.amber} />
            <KpiCard label="Mitigable Risks" value="4/6" unit="" sub="Via insurance + DFI" color={T.green} />
          </div>
          <div style={styles.panel}>
            <div style={styles.h3}>Risk Matrix — Probability vs. Impact</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.gold}` }}>
                  {["Risk Category", "Probability", "Impact (1-5)", "Risk Score", "Mitigation"].map(h => (
                    <th key={h} style={{ padding: "7px 10px", textAlign: "left", color: T.gold, fontFamily: T.mono, fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...RISK_CATEGORIES].sort((a, b) => b.prob * b.impact - a.prob * a.impact).map((r, i) => (
                  <tr key={r.category} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 ? T.surfaceH : "transparent" }}>
                    <td style={{ padding: "7px 10px", color: r.color, fontWeight: 600 }}>{r.category}</td>
                    <td style={{ padding: "7px 10px", fontFamily: T.mono }}>{r.prob}%</td>
                    <td style={{ padding: "7px 10px", fontFamily: T.mono }}>{r.impact}</td>
                    <td style={{ padding: "7px 10px", fontFamily: T.mono, color: r.prob * r.impact > 100 ? T.red : r.prob * r.impact > 60 ? T.amber : T.green }}>{(r.prob * r.impact / 100 * 5).toFixed(1)}/5</td>
                    <td style={{ padding: "7px 10px", color: T.textSec, fontSize: 11 }}>{r.category.includes("Geological") ? "Resource drilling program, phased dev" : r.category.includes("Technical") ? "Proven technology, EPC wrap" : r.category.includes("Regulatory") ? "Early community engagement, permits" : r.category.includes("Financial") ? "DFI co-finance, PRG" : r.category.includes("Env") ? "EIA, H2S mitigation" : "Long-term PPA, offtake guarantee"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 7 && (
        <div style={styles.panel}>
          <div style={styles.h3}>LP/GP Waterfall — Equity Distribution Structure</div>
          {[
            { tier: "Tier 1 — Return of Capital", threshold: "0%", lpShare: "100%", gpShare: "0%", desc: "LP receives 100% of distributions until capital returned" },
            { tier: "Tier 2 — Preferred Return", threshold: "8% IRR", lpShare: "100%", gpShare: "0%", desc: "LP receives 100% until 8% cumulative IRR" },
            { tier: "Tier 3 — GP Catch-up", threshold: "8–10% IRR", lpShare: "20%", gpShare: "80%", desc: "GP catch-up to 20% carry on all profits" },
            { tier: "Tier 4 — Full Carry", threshold: ">10% IRR", lpShare: "80%", gpShare: "20%", desc: "80/20 split; GP retains 20% carried interest" },
          ].map(t => (
            <div key={t.tier} style={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6, padding: "14px 18px", marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.gold }}>{t.tier}</div>
                  <div style={{ fontSize: 12, color: T.textSec, marginTop: 2 }}>{t.desc}</div>
                </div>
                <div style={{ textAlign: "right", fontFamily: T.mono, fontSize: 12 }}>
                  <div style={{ color: T.text }}>LP: <span style={{ color: T.teal }}>{t.lpShare}</span></div>
                  <div style={{ color: T.text }}>GP: <span style={{ color: T.amber }}>{t.gpShare}</span></div>
                  <div style={{ color: T.textMut, fontSize: 11 }}>{t.threshold}</div>
                </div>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 12, fontSize: 12, color: T.textSec }}>
            Equity IRR estimate: <span style={{ color: T.gold, fontFamily: T.mono }}>{(equityIrr * 100).toFixed(1)}%</span> —
            {equityIrr * 100 > 10 ? " Full carry tier reached." : equityIrr * 100 > 8 ? " GP catch-up tier reached." : " Preferred return tier only."}
          </div>
        </div>
      )}

      {tab === 8 && (
        <div style={styles.panel}>
          <div style={styles.h3}>Global Geothermal Project Finance Case Studies</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.gold}` }}>
                  {["Project", "MW", "CAPEX ($M)", "PPA ($/MWh)", "IRR (%)", "DSCR", "Funder", "Status"].map(h => (
                    <th key={h} style={{ padding: "7px 10px", textAlign: "left", color: T.gold, fontFamily: T.mono, fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {caseStudies.map((c, i) => (
                  <tr key={c.name} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 ? T.surfaceH : "transparent" }}>
                    <td style={{ padding: "7px 10px", color: T.text }}>{c.name}</td>
                    <td style={{ padding: "7px 10px", fontFamily: T.mono }}>{c.mw}</td>
                    <td style={{ padding: "7px 10px", fontFamily: T.mono }}>${c.capex}</td>
                    <td style={{ padding: "7px 10px", fontFamily: T.mono }}>{c.ppa}</td>
                    <td style={{ padding: "7px 10px", fontFamily: T.mono, color: c.irr >= 11 ? T.green : T.amber }}>{c.irr}%</td>
                    <td style={{ padding: "7px 10px", fontFamily: T.mono, color: c.dscr >= 1.4 ? T.green : T.amber }}>{c.dscr}x</td>
                    <td style={{ padding: "7px 10px", color: T.textSec, fontSize: 11 }}>{c.funder}</td>
                    <td style={{ padding: "7px 10px" }}><span style={{ background: c.status === "Operating" ? T.sage : T.navy, color: T.text, borderRadius: 4, padding: "2px 6px", fontSize: 10 }}>{c.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 9 && (
        <div style={styles.grid2}>
          <div style={styles.panel}>
            <div style={styles.h3}>Investor Dashboard</div>
            {[
              { label: "Total CAPEX", value: `$${capexM}M`, color: T.text },
              { label: "Equity Contribution", value: `$${equityM.toFixed(0)}M (${100 - debtPct}%)`, color: T.gold },
              { label: "Debt Financing", value: `$${debtM.toFixed(0)}M (${debtPct}%) @ ${debtRate}%`, color: T.amber },
              { label: "Annual Revenue", value: `$${revenueMyr.toFixed(1)}M/yr`, color: T.text },
              { label: "EBITDA", value: `$${ebitda.toFixed(1)}M/yr`, color: T.green },
              { label: "DSCR", value: `${dscr.toFixed(2)}x ${dscr >= 1.3 ? "✓" : "⚠"}`, color: dscr >= 1.3 ? T.green : T.red },
              { label: "Equity IRR", value: `${(equityIrr * 100).toFixed(1)}%`, color: T.gold },
              { label: "Project NPV", value: `$${projectNpv.toFixed(0)}M @ ${wacc}%`, color: projectNpv > 0 ? T.green : T.red },
              { label: "Monte Carlo P50", value: `${mcStats.p50}% IRR`, color: T.teal },
              { label: "Well Success Prob.", value: `${successProb}%`, color: T.amber },
            ].map(r => (
              <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${T.border}` }}>
                <span style={{ fontSize: 13, color: T.textSec }}>{r.label}</span>
                <span style={{ fontFamily: T.mono, color: r.color, fontSize: 13 }}>{r.value}</span>
              </div>
            ))}
          </div>
          <div style={styles.panel}>
            <div style={styles.h3}>Equity IRR Sensitivity — PPA Price</div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={Array.from({ length: 11 }, (_, i) => {
                const p = 50 + i * 10;
                const rev = powerMw * cf / 100 * 8760 * p / 1e6;
                const cfs = [-equityM, ...Array(30).fill(Math.max(0, rev - opexMyr - annDebtService))];
                return { ppa: p, irr: +(irr(cfs) * 100).toFixed(2) };
              })} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="ppa" tick={{ fontSize: 10, fill: T.textSec }} unit="$/MWh" />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} unit="%" />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}` }} />
                <Line type="monotone" dataKey="irr" name="Equity IRR" stroke={T.gold} strokeWidth={2} dot={{ r: 3, fill: T.gold }} />
                <ReferenceLine y={10} stroke={T.green} strokeDasharray="4 4" label={{ value: "Hurdle 10%", fill: T.green, fontSize: 10 }} />
                <ReferenceLine x={ppa} stroke={T.gold} strokeDasharray="2 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
