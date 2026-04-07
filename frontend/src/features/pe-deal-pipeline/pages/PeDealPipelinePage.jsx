/**
 * EP-BB1 — PE Deal Pipeline & Fund Structure UI
 * Sprint BB | Private Markets
 *
 * Coverage: deal sourcing funnel, fund structure (LP/GP/carry), vintage analytics,
 * DPI/TVPI/RVPI, J-curve simulation, co-investment tracker, portfolio monitoring.
 */
import React, { useState, useMemo } from "react";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
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
const SECTORS = ["Technology","Healthcare","Industrials","Consumer","Financial Services","Energy","Infrastructure","Real Estate"];
const STAGES  = ["Sourcing","Screening","Due Diligence","IC Approved","Closed","Declined","On Hold"];
const FUNDS   = ["Flagship Fund IV","Growth Equity II","Buyout Fund III","Secondaries I","Co-Invest SPV"];
const GEOGRAPHIES = ["North America","Europe","Asia-Pacific","MENA","LatAm"];

/* ── Deal data ───────────────────────────────────────────────────────────────── */
const genDeals = (n) => Array.from({ length: n }, (_, i) => {
  const stage = pick(STAGES, i * 3);
  const ev    = Math.round(50 + sr(i * 7) * 3950);
  const equity= Math.round(ev * (0.25 + sr(i * 11) * 0.35));
  const ebitda= Math.round(ev / (6 + sr(i * 13) * 6));
  const rev   = Math.round(ebitda / (0.08 + sr(i * 17) * 0.22));
  const irr   = +(15 + sr(i * 19) * 25).toFixed(1);
  const moic  = +(1.5 + sr(i * 23) * 2.5).toFixed(2);
  return {
    id: i + 1,
    name: `${pick(SECTORS, i * 5).slice(0,4).toUpperCase()}-Deal-${String(i+1).padStart(2,"0")}`,
    sector: pick(SECTORS, i * 5),
    stage,
    fund: pick(FUNDS, i * 29),
    geo: pick(GEOGRAPHIES, i * 37),
    ev,
    equity,
    ebitda,
    rev,
    evEbitda: +(ev / ebitda).toFixed(1),
    irr,
    moic,
    status: stage === "Closed" ? "active" : stage === "Declined" ? "declined" : "pipeline",
    esgScore: Math.round(40 + sr(i * 41) * 55),
    daysInStage: Math.round(10 + sr(i * 43) * 80),
  };
});

const DEALS = genDeals(50);

/* ── Fund structures ─────────────────────────────────────────────────────────── */
const FUND_STRUCTS = FUNDS.map((f, i) => ({
  name: f,
  vintage: 2018 + i,
  size: Math.round(500 + sr(i * 7) * 4500),
  called: +(0.55 + sr(i * 11) * 0.4).toFixed(2),
  distributed: +(0.3 + sr(i * 13) * 1.2).toFixed(2),
  nav: +(0.6 + sr(i * 17) * 1.4).toFixed(2),
  dpi: +(0.3 + sr(i * 19) * 1.5).toFixed(2),
  tvpi: +(1.2 + sr(i * 23) * 1.8).toFixed(2),
  rvpi: +(0.5 + sr(i * 29) * 1.2).toFixed(2),
  irr:  +(14 + sr(i * 31) * 18).toFixed(1),
  gpCommit: +(1 + sr(i * 37) * 2).toFixed(1),
  carry: 20,
  hurdle: 8,
  color: [T.navy, T.blue, T.teal, T.green, T.purple][i],
}));

/* ── J-curve data ────────────────────────────────────────────────────────────── */
const J_CURVE = Array.from({ length: 12 }, (_, i) => {
  const yr = i * 0.5;
  const base = -0.15 * Math.exp(-0.3 * yr) + 0.35 * (1 - Math.exp(-0.25 * yr));
  return {
    period: `Q${(i % 4) + 1} Y${Math.floor(i / 4) + 1}`,
    "Flagship IV":  +(base * 1.15 + (sr(i * 3) - 0.5) * 0.04).toFixed(3),
    "Growth Eq II": +(base * 0.95 + (sr(i * 7) - 0.5) * 0.04).toFixed(3),
    "Buyout III":   +(base * 1.25 + (sr(i * 11) - 0.5) * 0.04).toFixed(3),
  };
});

/* ── Co-investment data ──────────────────────────────────────────────────────── */
const CO_INVESTS = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  deal: `Co-${pick(SECTORS, i * 7).slice(0,3)}-${String(i+1).padStart(2,"0")}`,
  sponsor: pick(["KKR","Blackstone","Apollo","Carlyle","TPG","Advent","CVC","Warburg"], i * 13),
  equity: Math.round(20 + sr(i * 17) * 280),
  ownership: +(5 + sr(i * 19) * 20).toFixed(1),
  moic: +(1.2 + sr(i * 23) * 2.1).toFixed(2),
  status: pick(["Active","Exited","Hold"], i * 31),
}));

/* ── Helpers ─────────────────────────────────────────────────────────────────── */
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

const stageColor = (s) => ({
  Sourcing: T.slate, Screening: T.blue, "Due Diligence": T.amber,
  "IC Approved": T.teal, Closed: T.green, Declined: T.red, "On Hold": T.purple
}[s] || T.slate);

/* ── Tab 1: Deal Pipeline ────────────────────────────────────────────────────── */
const DealPipeline = () => {
  const [sectorF, setSectorF] = useState("All");
  const [stageF,  setStageF]  = useState("All");
  const [sort, setSort] = useState("ev");

  const filtered = useMemo(() => {
    let d = DEALS;
    if (sectorF !== "All") d = d.filter(x => x.sector === sectorF);
    if (stageF  !== "All") d = d.filter(x => x.stage  === stageF);
    return [...d].sort((a, b) => b[sort] - a[sort]);
  }, [sectorF, stageF, sort]);

  const funnelData = STAGES.map(s => ({
    stage: s,
    count: DEALS.filter(d => d.stage === s).length,
    ev:    DEALS.filter(d => d.stage === s).reduce((sum, d) => sum + d.ev, 0),
  }));

  const sectorData = SECTORS.map(s => ({
    sector: s.slice(0,6),
    count: DEALS.filter(d => d.sector === s).length,
    avgEv: Math.round(DEALS.filter(d => d.sector === s).reduce((a, b) => a + b.ev, 0) / (DEALS.filter(d => d.sector === s).length || 1)),
  }));

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 20 }}>
        {[
          { label: "Total Pipeline Deals", value: DEALS.length, color: T.navy },
          { label: "Pipeline EV ($M)", value: `$${DEALS.reduce((s,d)=>s+d.ev,0).toLocaleString()}`, color: T.blue },
          { label: "IC Approved", value: DEALS.filter(d=>d.stage==="IC Approved").length, color: T.teal },
          { label: "Closed / Active", value: DEALS.filter(d=>d.stage==="Closed").length, color: T.green },
        ].map(m => card(
          <>
            <div style={{ fontSize: 11, color: T.slate, marginBottom: 6 }}>{m.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: m.color, fontFamily: T.mono }}>{m.value}</div>
          </>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {card(
          <>
            <SH title="Pipeline Funnel — Deal Count by Stage" />
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={funnelData} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 10, fontFamily: T.mono }} />
                <YAxis dataKey="stage" type="category" tick={{ fontSize: 11, fontFamily: T.mono }} width={90} />
                <Tooltip />
                <Bar dataKey="count" name="Deals" radius={[0,4,4,0]}>
                  {funnelData.map((d, i) => <Cell key={i} fill={stageColor(d.stage)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
        {card(
          <>
            <SH title="Pipeline by Sector — Avg EV ($M)" />
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={sectorData} margin={{ bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="sector" tick={{ fontSize: 10, fontFamily: T.mono }} angle={-30} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} />
                <Tooltip />
                <Bar dataKey="avgEv" name="Avg EV ($M)" fill={T.navy} />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
      </div>

      {card(
        <>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
            <SH title="Deal Register" sub={null} />
            <div style={{ display: "flex", gap: 8, marginLeft: "auto", flexWrap: "wrap" }}>
              <select value={sectorF} onChange={e => setSectorF(e.target.value)} style={{ fontSize: 12, padding: "4px 8px", borderRadius: 4, border: "1px solid #e2e8f0", fontFamily: T.mono }}>
                <option>All</option>{SECTORS.map(s => <option key={s}>{s}</option>)}
              </select>
              <select value={stageF} onChange={e => setStageF(e.target.value)} style={{ fontSize: 12, padding: "4px 8px", borderRadius: 4, border: "1px solid #e2e8f0", fontFamily: T.mono }}>
                <option>All</option>{STAGES.map(s => <option key={s}>{s}</option>)}
              </select>
              <select value={sort} onChange={e => setSort(e.target.value)} style={{ fontSize: 12, padding: "4px 8px", borderRadius: 4, border: "1px solid #e2e8f0", fontFamily: T.mono }}>
                <option value="ev">Sort: EV</option>
                <option value="equity">Sort: Equity</option>
                <option value="irr">Sort: IRR</option>
                <option value="moic">Sort: MOIC</option>
              </select>
            </div>
          </div>
          <div style={{ maxHeight: 380, overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead style={{ position: "sticky", top: 0, background: T.cream }}>
                <tr>
                  {["Deal","Sector","Stage","Fund","Geo","EV ($M)","Equity ($M)","EV/EBITDA","IRR %","MOIC","ESG"].map(h => (
                    <th key={h} style={{ padding: "6px 10px", textAlign: "left", color: T.navy, fontWeight: 700, borderBottom: `2px solid ${T.gold}`, fontFamily: T.mono, fontSize: 11, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((d, i) => (
                  <tr key={d.id} style={{ background: i % 2 === 0 ? "#fff" : T.cream }}>
                    <td style={{ padding: "6px 10px", fontFamily: T.mono, fontSize: 11, fontWeight: 700, color: T.navy }}>{d.name}</td>
                    <td style={{ padding: "6px 10px", fontSize: 11, color: T.slate }}>{d.sector}</td>
                    <td style={{ padding: "6px 10px" }}>{pill(d.stage, stageColor(d.stage))}</td>
                    <td style={{ padding: "6px 10px", fontSize: 11, color: T.slate }}>{d.fund.replace(" Fund","")}</td>
                    <td style={{ padding: "6px 10px", fontSize: 11, color: T.slate }}>{d.geo.slice(0,8)}</td>
                    <td style={{ padding: "6px 10px", fontFamily: T.mono, fontWeight: 700, color: T.navy }}>{d.ev.toLocaleString()}</td>
                    <td style={{ padding: "6px 10px", fontFamily: T.mono, color: T.blue }}>{d.equity.toLocaleString()}</td>
                    <td style={{ padding: "6px 10px", fontFamily: T.mono, color: T.amber }}>{d.evEbitda}x</td>
                    <td style={{ padding: "6px 10px", fontFamily: T.mono, color: d.irr > 25 ? T.green : T.navy }}>{d.irr}%</td>
                    <td style={{ padding: "6px 10px", fontFamily: T.mono, color: d.moic > 2.5 ? T.green : T.navy }}>{d.moic}x</td>
                    <td style={{ padding: "6px 10px" }}>
                      <div style={{ width: 60, background: "#e2e8f0", borderRadius: 3, height: 6, display: "inline-block" }}>
                        <div style={{ width: `${d.esgScore}%`, background: d.esgScore > 70 ? T.green : d.esgScore > 45 ? T.amber : T.red, borderRadius: 3, height: 6 }} />
                      </div>
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

/* ── Tab 2: Fund Structure ───────────────────────────────────────────────────── */
const FundStructure = () => {
  const [selected, setSelected] = useState(0);
  const f = FUND_STRUCTS[selected];

  const waterfall = [
    { tranche: "Return of Capital", lp: 100, gp: 0 },
    { tranche: "Preferred 8%", lp: 100, gp: 0 },
    { tranche: "GP Catch-up (80%)", lp: 20, gp: 80 },
    { tranche: "Carried Interest (20%)", lp: 80, gp: 20 },
  ];

  const lpsData = [
    { lp: "Pension Fund A", commit: Math.round(f.size * 0.22), pct: 22 },
    { lp: "Sovereign Wealth B", commit: Math.round(f.size * 0.18), pct: 18 },
    { lp: "Insurance Co C", commit: Math.round(f.size * 0.14), pct: 14 },
    { lp: "Endowment D", commit: Math.round(f.size * 0.12), pct: 12 },
    { lp: "Family Office E", commit: Math.round(f.size * 0.09), pct: 9 },
    { lp: "FoF F", commit: Math.round(f.size * 0.08), pct: 8 },
    { lp: "Other LPs", commit: Math.round(f.size * 0.17), pct: 17 },
  ];

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {FUND_STRUCTS.map((fn, i) => (
          <button key={i} onClick={() => setSelected(i)} style={{
            padding: "6px 16px", borderRadius: 4, border: `1px solid ${selected === i ? fn.color : "#e2e8f0"}`,
            background: selected === i ? fn.color : "#fff", color: selected === i ? "#fff" : T.slate,
            fontSize: 12, cursor: "pointer", fontFamily: T.mono, fontWeight: selected === i ? 700 : 400
          }}>{fn.name}</button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 16, marginBottom: 20 }}>
        {[
          { label: "Fund Size ($M)", value: `$${f.size.toLocaleString()}` },
          { label: "% Called", value: `${(f.called*100).toFixed(0)}%` },
          { label: "DPI", value: `${f.dpi}x` },
          { label: "TVPI", value: `${f.tvpi}x` },
          { label: "Net IRR", value: `${f.irr}%` },
        ].map(m => card(
          <>
            <div style={{ fontSize: 11, color: T.slate, marginBottom: 6 }}>{m.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: f.color, fontFamily: T.mono }}>{m.value}</div>
          </>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {card(
          <>
            <SH title="Distribution Waterfall" sub="American waterfall with 8% preferred return, 80/20 carried interest" />
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={waterfall} margin={{ bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="tranche" tick={{ fontSize: 10, fontFamily: T.mono }} angle={-15} textAnchor="end" interval={0} height={50} />
                <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} unit="%" />
                <Tooltip unit="%" />
                <Legend />
                <Bar dataKey="lp" name="LP Share %" fill={T.navy} stackId="a" />
                <Bar dataKey="gp" name="GP Share %" fill={T.gold} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
        {card(
          <>
            <SH title="LP Commitments by Investor Type" sub={`Fund size: $${f.size.toLocaleString()}M | Vintage: ${f.vintage}`} />
            <div style={{ maxHeight: 220, overflowY: "auto" }}>
              {lpsData.map((lp, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                    <span style={{ color: T.navy, fontWeight: 600 }}>{lp.lp}</span>
                    <span style={{ fontFamily: T.mono, color: T.slate }}>${lp.commit.toLocaleString()}M ({lp.pct}%)</span>
                  </div>
                  <div style={{ background: "#e2e8f0", borderRadius: 3, height: 6 }}>
                    <div style={{ width: `${lp.pct}%`, background: f.color, borderRadius: 3, height: 6 }} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {card(
        <>
          <SH title="Fund Structure Parameters" sub="Legal / economics summary" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
            {[
              { label: "Vintage Year", value: f.vintage },
              { label: "Fund Size ($M)", value: `$${f.size.toLocaleString()}` },
              { label: "GP Commit (%)", value: `${f.gpCommit}%` },
              { label: "Carried Interest", value: `${f.carry}%` },
              { label: "Preferred Return (Hurdle)", value: `${f.hurdle}%` },
              { label: "Called Capital", value: `${(f.called*100).toFixed(0)}%` },
              { label: "DPI", value: `${f.dpi}x` },
              { label: "TVPI", value: `${f.tvpi}x` },
              { label: "RVPI", value: `${f.rvpi}x` },
              { label: "Net IRR", value: `${f.irr}%` },
              { label: "Waterfall Type", value: "American" },
              { label: "Management Fee", value: "2.0% / 1.5%" },
            ].map(p => (
              <div key={p.label} style={{ background: T.cream, borderRadius: 6, padding: "10px 14px" }}>
                <div style={{ fontSize: 11, color: T.slate, marginBottom: 4 }}>{p.label}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: f.color, fontFamily: T.mono }}>{p.value}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

/* ── Tab 3: Vintage & Performance ─────────────────────────────────────────────── */
const VintagePerformance = () => {
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {card(
          <>
            <SH title="J-Curve — NAV / Paid-In Capital" sub="Quarterly NAV/Invested trajectory by fund" />
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={J_CURVE} margin={{ left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="period" tick={{ fontSize: 9, fontFamily: T.mono }} angle={-30} textAnchor="end" interval={1} height={40} />
                <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} tickFormatter={v => `${(v*100).toFixed(0)}%`} />
                <Tooltip formatter={(v) => `${(v*100).toFixed(1)}%`} />
                <Legend />
                <Line dataKey="Flagship IV"  stroke={T.navy}  strokeWidth={2} dot={false} />
                <Line dataKey="Growth Eq II" stroke={T.teal}  strokeWidth={2} dot={false} strokeDasharray="4 2" />
                <Line dataKey="Buyout III"   stroke={T.green} strokeWidth={2} dot={false} strokeDasharray="2 2" />
              </LineChart>
            </ResponsiveContainer>
          </>
        )}
        {card(
          <>
            <SH title="DPI / TVPI / RVPI by Fund" sub="Value multiple breakdown across vintage years" />
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={FUND_STRUCTS} margin={{ bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="vintage" tick={{ fontSize: 10, fontFamily: T.mono }} />
                <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} unit="x" />
                <Tooltip unit="x" />
                <Legend />
                <Bar dataKey="dpi"  name="DPI"  fill={T.green} />
                <Bar dataKey="rvpi" name="RVPI" fill={T.teal}  />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {card(
          <>
            <SH title="Net IRR by Fund Vintage" sub="Benchmark: top-quartile ~22%, median ~15%" />
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={FUND_STRUCTS} margin={{ bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="vintage" tick={{ fontSize: 11, fontFamily: T.mono }} />
                <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} unit="%" />
                <Tooltip unit="%" />
                <Bar dataKey="irr" name="Net IRR %" radius={[4,4,0,0]}>
                  {FUND_STRUCTS.map((f, i) => <Cell key={i} fill={f.irr > 22 ? T.green : f.irr > 15 ? T.teal : T.amber} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
        {card(
          <>
            <SH title="PME Benchmark Summary" sub="Public Market Equivalent vs Russell 2000 & MSCI World" />
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.cream }}>
                  {["Fund","Vintage","Net IRR","PME (R2K)","PME (MSCI)","Alpha"].map(h => (
                    <th key={h} style={{ padding: "6px 10px", textAlign: "left", color: T.navy, fontWeight: 700, borderBottom: `2px solid ${T.gold}`, fontFamily: T.mono, fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FUND_STRUCTS.map((f, i) => {
                  const pmeR2k = +(f.irr * (0.7 + sr(i * 3) * 0.3)).toFixed(1);
                  const pmeMsci = +(f.irr * (0.65 + sr(i * 7) * 0.3)).toFixed(1);
                  const alpha = +(f.irr - pmeR2k).toFixed(1);
                  return (
                    <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : T.cream }}>
                      <td style={{ padding: "6px 10px", fontFamily: T.mono, fontSize: 11, fontWeight: 700, color: f.color }}>{f.name.replace(" Fund","")}</td>
                      <td style={{ padding: "6px 10px", fontFamily: T.mono, fontSize: 11 }}>{f.vintage}</td>
                      <td style={{ padding: "6px 10px", fontFamily: T.mono, color: T.green, fontWeight: 700 }}>{f.irr}%</td>
                      <td style={{ padding: "6px 10px", fontFamily: T.mono }}>{pmeR2k}%</td>
                      <td style={{ padding: "6px 10px", fontFamily: T.mono }}>{pmeMsci}%</td>
                      <td style={{ padding: "6px 10px", fontFamily: T.mono, color: alpha > 0 ? T.green : T.red, fontWeight: 700 }}>{alpha > 0 ? "+" : ""}{alpha}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
};

/* ── Tab 4: Co-Investment Tracker ────────────────────────────────────────────── */
const CoInvestTracker = () => {
  const [statusF, setStatusF] = useState("All");
  const filtered = statusF === "All" ? CO_INVESTS : CO_INVESTS.filter(c => c.status === statusF);

  const scatterData = DEALS.filter(d => d.stage === "Closed").map(d => ({
    x: d.evEbitda,
    y: d.irr,
    z: d.equity / 10,
    name: d.name,
  }));

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 20 }}>
        {[
          { label: "Co-Investments", value: CO_INVESTS.length },
          { label: "Total Co-Invest ($M)", value: `$${CO_INVESTS.reduce((s,c) => s+c.equity,0).toLocaleString()}` },
          { label: "Active Positions", value: CO_INVESTS.filter(c=>c.status==="Active").length },
          { label: "Avg MOIC", value: `${(CO_INVESTS.reduce((s,c)=>s+c.moic,0)/CO_INVESTS.length).toFixed(2)}x` },
        ].map(m => card(
          <>
            <div style={{ fontSize: 11, color: T.slate, marginBottom: 6 }}>{m.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: T.navy, fontFamily: T.mono }}>{m.value}</div>
          </>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {card(
          <>
            <SH title="EV/EBITDA vs IRR — Closed Deals" sub="Bubble size = equity invested ($M)" />
            <ResponsiveContainer width="100%" height={240}>
              <ScatterChart margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="x" name="EV/EBITDA" unit="x" tick={{ fontSize: 10, fontFamily: T.mono }} />
                <YAxis dataKey="y" name="IRR" unit="%" tick={{ fontSize: 10, fontFamily: T.mono }} />
                <Tooltip cursor={{ strokeDasharray: "3 3" }} formatter={(v, n) => n === "IRR" ? `${v}%` : `${v}x`} />
                <Scatter data={scatterData} fill={T.navy} fillOpacity={0.6} />
              </ScatterChart>
            </ResponsiveContainer>
          </>
        )}
        {card(
          <>
            <SH title="Co-Investment Register" sub="Sponsor-led co-invest positions" />
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              {["All","Active","Exited","Hold"].map(s => (
                <button key={s} onClick={() => setStatusF(s)} style={{
                  padding: "4px 12px", borderRadius: 4, border: `1px solid ${statusF===s ? T.navy : "#e2e8f0"}`,
                  background: statusF===s ? T.navy : "#fff", color: statusF===s ? "#fff" : T.slate,
                  fontSize: 12, cursor: "pointer", fontFamily: T.mono
                }}>{s}</button>
              ))}
            </div>
            <div style={{ maxHeight: 180, overflowY: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead style={{ position: "sticky", top: 0, background: T.cream }}>
                  <tr>
                    {["Deal","Sponsor","Equity","Own%","MOIC","Status"].map(h => (
                      <th key={h} style={{ padding: "5px 8px", textAlign: "left", fontWeight: 700, color: T.navy, borderBottom: `2px solid ${T.gold}`, fontFamily: T.mono, fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, i) => (
                    <tr key={c.id} style={{ background: i % 2 === 0 ? "#fff" : T.cream }}>
                      <td style={{ padding: "5px 8px", fontFamily: T.mono, fontSize: 11, fontWeight: 700, color: T.navy }}>{c.deal}</td>
                      <td style={{ padding: "5px 8px", fontSize: 11, color: T.slate }}>{c.sponsor}</td>
                      <td style={{ padding: "5px 8px", fontFamily: T.mono }}>${c.equity}M</td>
                      <td style={{ padding: "5px 8px", fontFamily: T.mono }}>{c.ownership}%</td>
                      <td style={{ padding: "5px 8px", fontFamily: T.mono, color: c.moic > 2 ? T.green : T.navy, fontWeight: 700 }}>{c.moic}x</td>
                      <td style={{ padding: "5px 8px" }}>{pill(c.status, c.status==="Active"?T.green:c.status==="Exited"?T.blue:T.amber)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/* ── Page Shell ─────────────────────────────────────────────────────────────── */
const TABS = [
  { key: "pipeline", label: "Deal Pipeline"      },
  { key: "fund",     label: "Fund Structure"     },
  { key: "vintage",  label: "Vintage & Performance" },
  { key: "coinvest", label: "Co-Investment Tracker" },
];

export default function PeDealPipelinePage() {
  const [tab, setTab] = useState("pipeline");

  return (
    <div style={{ fontFamily: T.font, background: T.cream, minHeight: "100vh", padding: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.navy }}>PE Deal Pipeline & Fund Structure</h1>
          {pill("EP-BB1", T.navy)}
          {pill("Private Markets", T.blue)}
        </div>
        <div style={{ fontSize: 13, color: T.slate }}>
          50-deal pipeline · 5 fund structures · J-curve · DPI/TVPI · co-investment register · waterfall economics
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
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "pipeline" && <DealPipeline />}
      {tab === "fund"     && <FundStructure />}
      {tab === "vintage"  && <VintagePerformance />}
      {tab === "coinvest" && <CoInvestTracker />}
    </div>
  );
}
