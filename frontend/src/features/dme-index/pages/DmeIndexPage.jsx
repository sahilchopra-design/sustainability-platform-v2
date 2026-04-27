/**
 * EP-BE3 — DME Dynamic Materiality Index
 * Sprint BE | Dynamic Materiality Engine
 *
 * DMI = 40% Financial Risk + 40% ESG Risk + 20% Velocity/Momentum
 * EMA smoothing, z-score regime classification, portfolio HHI, Spearman rank
 * correlation vs ESG rating proxies, DMI-triggered alert integration.
 * 40 entities · 10 tabs · zero Math.random · guarded divisions · spread-before-sort
 */
import React, { useState, useMemo } from "react";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, ComposedChart, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, ReferenceLine
} from "recharts";

/* ── Theme ────────────────────────────────────────────────────────────────── */
const T = {
  navy:"#1b3a5c", gold:"#c5a96a", cream:"#f7f4ef", slate:"#64748b",
  card:"#ffffff", surfaceH:"#ede9e2",
  font:"'DM Sans', sans-serif", mono:"'JetBrains Mono', monospace",
  green:"#059669", red:"#dc2626", amber:"#d97706", teal:"#0e7490",
};

/* ── Seeded random ────────────────────────────────────────────────────────── */
const sr = (s) => { const x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

/* ── Core DMI math ────────────────────────────────────────────────────────── */
const ema = (values, alpha) =>
  values.reduce((acc, v, i) => { acc.push(i === 0 ? v : alpha * v + (1 - alpha) * acc[i - 1]); return acc; }, []);

const velocity = (emaArr, lag = 4) =>
  emaArr.map((v, i) => i < lag ? 0 : (v - emaArr[i - lag]) / Math.max(0.0001, Math.abs(emaArr[i - lag])));

const hhi = (weights) => weights.reduce((s, w) => s + w * w, 0);

const spearman = (x, y) => {
  const n = x.length;
  if (n === 0) return 0;
  const rx = [...x].map((_, i) => i).sort((a, b) => x[a] - x[b]);
  const ry = [...y].map((_, i) => i).sort((a, b) => y[a] - y[b]);
  const d2 = rx.reduce((s, _, i) => s + (rx[i] - ry[i]) ** 2, 0);
  return 1 - 6 * d2 / Math.max(1, n * (n * n - 1));
};

/* ── Sectors / sub-components ─────────────────────────────────────────────── */
const SECTORS = ["Energy","Materials","Industrials","Consumer Disc","Consumer Staples","Health Care","Financials","IT","Utilities","Real Estate"];
const REGIMES = ["Normal","Elevated","Critical","Extreme"];

/* ── DMI component weights (configurable in Tab 2) ─────────────────────────── */
const DEFAULT_WEIGHTS = { fr: 0.40, esg: 0.40, vel: 0.20 };

/* ── FR sub-components ────────────────────────────────────────────────────── */
const FR_W  = { var: 0.30, pd: 0.30, wacc: 0.20, liq: 0.20 };
/* ── ESG sub-components ───────────────────────────────────────────────────── */
const ESG_W = { gov: 0.25, env: 0.35, soc: 0.20, reg: 0.20 };

/* ── Entity generation ────────────────────────────────────────────────────── */
const ENTITIES = Array.from({ length: 40 }, (_, i) => {
  const sector = SECTORS[i % SECTORS.length];

  /* FR sub-scores 0-100 */
  const frVar  = +(20 + sr(i * 3) * 75).toFixed(1);
  const frPd   = +(15 + sr(i * 7) * 80).toFixed(1);
  const frWacc = +(25 + sr(i * 11) * 70).toFixed(1);
  const frLiq  = +(10 + sr(i * 13) * 85).toFixed(1);
  const frScore= +(frVar * FR_W.var + frPd * FR_W.pd + frWacc * FR_W.wacc + frLiq * FR_W.liq).toFixed(2);

  /* ESG sub-scores 0-100 */
  const esgGov = +(20 + sr(i * 17) * 75).toFixed(1);
  const esgEnv = +(15 + sr(i * 19) * 80).toFixed(1);
  const esgSoc = +(25 + sr(i * 23) * 70).toFixed(1);
  const esgReg = +(10 + sr(i * 29) * 85).toFixed(1);
  const esgScore= +(esgGov * ESG_W.gov + esgEnv * ESG_W.env + esgSoc * ESG_W.soc + esgReg * ESG_W.reg).toFixed(2);

  /* 24-quarter history */
  const rawHistory = Array.from({ length: 24 }, (_, q) =>
    +(40 + sr(i * 1000 + q * 7) * 55).toFixed(2)
  );
  const emaHistory = ema(rawHistory, 0.2);
  const velHistory = velocity(emaHistory, 4);

  /* Current DMI (uses raw weights; vel component from last velocity) */
  const velScore = +(50 + (velHistory[velHistory.length - 1] || 0) * 200).toFixed(2); // normalised 0-100 proxy
  const dmi = +(frScore * DEFAULT_WEIGHTS.fr + esgScore * DEFAULT_WEIGHTS.esg + Math.max(0, Math.min(100, velScore)) * DEFAULT_WEIGHTS.vel).toFixed(2);

  /* z-score & regime */
  const mean = 55, std = 14;
  const z = +((dmi - mean) / Math.max(0.0001, std)).toFixed(3);
  const zAbs = Math.abs(z);
  const regime = zAbs <= 1 ? "Normal" : zAbs <= 2 ? "Elevated" : zAbs <= 3 ? "Critical" : "Extreme";

  /* Momentum */
  const emaLast = emaHistory[emaHistory.length - 1];
  const ema4ago = emaHistory[emaHistory.length - 5] || emaLast;
  const vel4q   = +((emaLast - ema4ago) / Math.max(0.0001, Math.abs(ema4ago))).toFixed(4);
  const vel8q   = +((emaLast - (emaHistory[emaHistory.length - 9] || emaLast)) / Math.max(0.0001, Math.abs(emaHistory[emaHistory.length - 9] || emaLast))).toFixed(4);
  const accel   = +((vel4q - vel8q) / 4).toFixed(5);

  /* ESG proxy ratings (0-100) for benchmarking */
  const msciLike = +(30 + sr(i * 37) * 65).toFixed(1);
  const sustLike  = +(25 + sr(i * 41) * 70).toFixed(1);
  const issLike   = +(20 + sr(i * 43) * 75).toFixed(1);

  /* Portfolio weight */
  const weight = +(0.015 + sr(i * 47) * 0.035).toFixed(4);

  return {
    id: i + 1,
    name: `${sector.split(" ")[0].slice(0, 4).toUpperCase()}-Corp-${String(i + 1).padStart(2, "0")}`,
    sector,
    frScore, frVar, frPd, frWacc, frLiq,
    esgScore, esgGov, esgEnv, esgSoc, esgReg,
    velScore, dmi, z, zAbs, regime,
    vel4q, accel,
    rawHistory, emaHistory, velHistory,
    msciLike, sustLike, issLike,
    weight,
  };
});

/* ── Portfolio weights normalised ─────────────────────────────────────────── */
const wSum     = ENTITIES.reduce((s, e) => s + e.weight, 0);
const wNorm    = ENTITIES.map(e => e.weight / Math.max(0.0001, wSum));
const portDMI  = +(ENTITIES.reduce((s, e, i) => s + e.dmi * wNorm[i], 0)).toFixed(2);
const portHHI  = +hhi(wNorm).toFixed(4);
const effN     = +(1 / Math.max(0.0001, portHHI)).toFixed(1);

/* ── Regime transition matrix (simplified) ─────────────────────────────────── */
const TRANS_MATRIX = REGIMES.map((from, fi) =>
  REGIMES.map((_, ti) => {
    if (fi === ti) return +(0.6 + sr(fi * 10 + ti) * 0.25).toFixed(2);
    if (Math.abs(fi - ti) === 1) return +(0.15 + sr(fi * 10 + ti + 1) * 0.15).toFixed(2);
    return +(sr(fi * 10 + ti + 2) * 0.05).toFixed(2);
  })
);

/* ── 24-quarter portfolio DMI trend ───────────────────────────────────────── */
const PORT_TREND = Array.from({ length: 24 }, (_, q) => {
  const avg = +(ENTITIES.reduce((s, e, i) => s + (e.emaHistory[q] || e.dmi) * wNorm[i], 0)).toFixed(2);
  const z   = +((avg - 55) / 14).toFixed(3);
  return {
    quarter: `Q${(q % 4) + 1} ${2019 + Math.floor(q / 4)}`,
    portDMI: avg,
    regime: Math.abs(z) <= 1 ? "Normal" : Math.abs(z) <= 2 ? "Elevated" : Math.abs(z) <= 3 ? "Critical" : "Extreme",
  };
});

/* ── Helpers ──────────────────────────────────────────────────────────────── */
const pill = (l, bg, fg = "#fff") => (
  <span style={{ background: bg, color: fg, borderRadius: 4, padding: "2px 7px", fontSize: 11, fontFamily: T.mono, fontWeight: 600 }}>{l}</span>
);
const card = (ch, st = {}) => (
  <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: 20, ...st }}>{ch}</div>
);
const SH = ({ title, sub }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ fontWeight: 700, fontSize: 15, color: T.navy }}>{title}</div>
    {sub && <div style={{ fontSize: 12, color: T.slate, marginTop: 2 }}>{sub}</div>}
  </div>
);
const KpiGrid = ({ items }) => (
  <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(items.length, 4)},1fr)`, gap: 16, marginBottom: 20 }}>
    {items.map(m => card(
      <><div style={{ fontSize: 11, color: T.slate, marginBottom: 6 }}>{m.label}</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: m.color, fontFamily: T.mono }}>{m.value}</div>
        {m.sub && <div style={{ fontSize: 10, color: T.slate, marginTop: 4 }}>{m.sub}</div>}</>,
      { padding: 16 }
    ))}
  </div>
);
const TH = ({ cols }) => (
  <thead style={{ position: "sticky", top: 0, background: T.cream }}>
    <tr>{cols.map(h => <th key={h} style={{ padding: "6px 8px", textAlign: "left", color: T.navy, fontWeight: 700, borderBottom: `2px solid ${T.gold}`, fontFamily: T.mono, fontSize: 10, whiteSpace: "nowrap" }}>{h}</th>)}</tr>
  </thead>
);
const scrollTable = { maxHeight: 340, overflowY: "auto" };
const dmiColor   = d => d > 70 ? T.red : d > 55 ? T.amber : T.green;
const regimeColor = r => ({ Normal: T.green, Elevated: T.amber, Critical: T.red, Extreme: '#7c3aed' }[r] || T.slate);
const regimeBg    = r => ({ Normal: "#ecfdf5", Elevated: "#fffbeb", Critical: "#fef2f2", Extreme: "#f5f3ff" }[r] || T.cream);
const velArrow    = v => v > 0.01 ? "↑" : v < -0.01 ? "↓" : "→";

/* ════════════════════════════════════════════════════════════════════════════
   TAB 1 — Overview
════════════════════════════════════════════════════════════════════════════ */
const TabOverview = () => {
  const top5    = [...ENTITIES].sort((a, b) => b.dmi - a.dmi).slice(0, 5);
  const bot5    = [...ENTITIES].sort((a, b) => a.dmi - b.dmi).slice(0, 5);
  const regDist = REGIMES.map(r => ({ regime: r, count: ENTITIES.filter(e => e.regime === r).length }));
  const dmiDist = Array.from({ length: 8 }, (_, i) => {
    const lo = i * 12.5, hi = lo + 12.5;
    return { range: `${lo.toFixed(0)}-${hi.toFixed(0)}`, count: ENTITIES.filter(e => e.dmi >= lo && e.dmi < hi).length };
  });
  return (
    <div>
      <KpiGrid items={[
        { label: "Weighted Portfolio DMI", value: portDMI,  color: dmiColor(+portDMI), sub: "40%FR + 40%ESG + 20%Vel" },
        { label: "Extreme Regime",         value: ENTITIES.filter(e => e.regime === "Extreme").length, color: '#7c3aed' },
        { label: "Critical Regime",        value: ENTITIES.filter(e => e.regime === "Critical").length, color: T.red },
        { label: "Portfolio HHI",          value: portHHI,  color: '#2563eb', sub: `Eff. N = ${effN}` },
      ]} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {card(<>
          <SH title="Regime Distribution" sub="Entity count by materiality regime" />
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={regDist}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="regime" tick={{ fontSize: 11, fontFamily: T.mono }} />
              <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} />
              <Tooltip />
              <Bar dataKey="count" name="Entities" radius={[4, 4, 0, 0]}>
                {REGIMES.map((r, i) => <Cell key={i} fill={regimeColor(r)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </>)}
        {card(<>
          <SH title="DMI Score Distribution" sub="Entity histogram across 0-100 range" />
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={dmiDist}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="range" tick={{ fontSize: 10, fontFamily: T.mono }} />
              <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} />
              <Tooltip />
              <Bar dataKey="count" name="Entities" radius={[2, 2, 0, 0]}>
                {dmiDist.map((_, i) => <Cell key={i} fill={i < 3 ? T.green : i < 5 ? T.amber : T.red} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {card(<>
          <SH title="Top 5 — Highest DMI" sub="Most material entities" />
          {top5.map((e, i) => (
            <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid #f1f5f9" }}>
              <div>
                <span style={{ fontFamily: T.mono, fontSize: 12, color: T.navy, fontWeight: 700 }}>{i + 1}. {e.name}</span>
                <span style={{ fontSize: 11, color: T.slate, marginLeft: 8 }}>{e.sector.split(" ")[0]}</span>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 700, color: dmiColor(e.dmi) }}>{e.dmi}</span>
                {pill(e.regime, regimeColor(e.regime))}
              </div>
            </div>
          ))}
        </>)}
        {card(<>
          <SH title="Bottom 5 — Lowest DMI" sub="Least material entities" />
          {bot5.map((e, i) => (
            <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid #f1f5f9" }}>
              <div>
                <span style={{ fontFamily: T.mono, fontSize: 12, color: T.navy, fontWeight: 700 }}>{i + 1}. {e.name}</span>
                <span style={{ fontSize: 11, color: T.slate, marginLeft: 8 }}>{e.sector.split(" ")[0]}</span>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 700, color: dmiColor(e.dmi) }}>{e.dmi}</span>
                {pill(e.regime, regimeColor(e.regime))}
              </div>
            </div>
          ))}
        </>)}
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   TAB 2 — DMI Computation Engine
════════════════════════════════════════════════════════════════════════════ */
const TabComputation = () => {
  const [frW, setFrW]   = useState(40);
  const [esgW, setEsgW] = useState(40);
  const velW = 100 - frW - esgW;
  const warnBad = velW < 0;

  const customDMI = ENTITIES.map(e => ({
    name: e.name.slice(-8),
    frContrib:  +(e.frScore  * frW  / 100).toFixed(2),
    esgContrib: +(e.esgScore * esgW / 100).toFixed(2),
    velContrib: +(e.velScore * Math.max(0, velW) / 100).toFixed(2),
    dmi: +(e.frScore * frW / 100 + e.esgScore * esgW / 100 + e.velScore * Math.max(0, velW) / 100).toFixed(2),
  })).sort((a, b) => b.dmi - a.dmi).slice(0, 15);

  return (
    <div>
      {card(<>
        <SH title="DMI Formula" sub="Configurable weighting — adjust sliders below" />
        <div style={{ fontFamily: T.mono, fontSize: 13, color: '#2563eb', background: T.cream, borderRadius: 6, padding: "10px 14px", marginBottom: 16 }}>
          DMI = {frW}% × FR_score + {esgW}% × ESG_score + {Math.max(0, velW)}% × Velocity_score
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div>
            <label style={{ fontSize: 12, color: T.slate, fontFamily: T.mono }}>Financial Risk weight: <strong>{frW}%</strong></label>
            <input type="range" min={10} max={70} value={frW} onChange={e => setFrW(+e.target.value)} style={{ width: "100%", accentColor: T.navy }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: T.slate, fontFamily: T.mono }}>ESG Risk weight: <strong>{esgW}%</strong></label>
            <input type="range" min={10} max={70} value={esgW} onChange={e => setEsgW(+e.target.value)} style={{ width: "100%", accentColor: T.navy }} />
          </div>
        </div>
        {warnBad && <div style={{ color: T.red, fontSize: 12, fontFamily: T.mono, marginTop: 8 }}>⚠ FR + ESG > 100% — reduce one slider.</div>}
        <div style={{ fontSize: 12, color: T.slate, marginTop: 6 }}>Velocity weight auto-computed: {Math.max(0, velW)}%</div>
      </>, { marginBottom: 20 })}
      {card(<>
        <SH title="DMI Waterfall Decomposition — Top 15 Entities" sub="FR · ESG · Velocity contributions" />
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={customDMI} margin={{ bottom: 24 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 9, fontFamily: T.mono }} angle={-30} textAnchor="end" interval={0} />
            <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} domain={[0, 100]} />
            <Tooltip /><Legend />
            <Bar dataKey="frContrib"  name="FR (Financial Risk)"  stackId="d" fill={T.red}    />
            <Bar dataKey="esgContrib" name="ESG Risk"             stackId="d" fill={'#2563eb'}   />
            <Bar dataKey="velContrib" name="Velocity/Momentum"    stackId="d" fill={'#7c3aed'} />
          </BarChart>
        </ResponsiveContainer>
      </>)}
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   TAB 3 — Financial Risk Component (40%)
════════════════════════════════════════════════════════════════════════════ */
const TabFRComponent = () => {
  const frData = [...ENTITIES].sort((a, b) => b.frScore - a.frScore).slice(0, 20).map(e => ({
    name: e.name.slice(-8),
    var: e.frVar, pd: e.frPd, wacc: e.frWacc, liq: e.frLiq, total: e.frScore,
  }));
  const radarData = [
    { axis: "VaR",  val: +(ENTITIES.reduce((s, e) => s + e.frVar,  0) / Math.max(1, ENTITIES.length)).toFixed(1) },
    { axis: "PD",   val: +(ENTITIES.reduce((s, e) => s + e.frPd,   0) / Math.max(1, ENTITIES.length)).toFixed(1) },
    { axis: "WACC", val: +(ENTITIES.reduce((s, e) => s + e.frWacc, 0) / Math.max(1, ENTITIES.length)).toFixed(1) },
    { axis: "Liq",  val: +(ENTITIES.reduce((s, e) => s + e.frLiq,  0) / Math.max(1, ENTITIES.length)).toFixed(1) },
  ];
  return (
    <div>
      <KpiGrid items={[
        { label: "Avg FR Score",     value: +(ENTITIES.reduce((s, e) => s + e.frScore, 0) / Math.max(1, ENTITIES.length)).toFixed(1), color: T.navy },
        { label: "Avg VaR Sub-score", value: +(ENTITIES.reduce((s, e) => s + e.frVar,  0) / Math.max(1, ENTITIES.length)).toFixed(1), color: T.red },
        { label: "Avg PD Sub-score",  value: +(ENTITIES.reduce((s, e) => s + e.frPd,   0) / Math.max(1, ENTITIES.length)).toFixed(1), color: T.amber },
        { label: "Avg Liq Sub-score", value: +(ENTITIES.reduce((s, e) => s + e.frLiq,  0) / Math.max(1, ENTITIES.length)).toFixed(1), color: T.teal },
      ]} />
      <div style={{ background: T.cream, borderRadius: 8, padding: "10px 16px", marginBottom: 20, fontFamily: T.mono, fontSize: 12, color: T.navy, lineHeight: 1.8 }}>
        <strong>FR_score</strong> = 30% × VaR_score + 30% × PD_score + 20% × WACC_score + 20% × Liquidity_score
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, marginBottom: 20 }}>
        {card(<>
          <SH title="FR Sub-component Stacked — Top 20 Entities" />
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={frData} margin={{ bottom: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 9, fontFamily: T.mono }} angle={-30} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} domain={[0, 100]} />
              <Tooltip /><Legend />
              <Bar dataKey="var"  name="VaR (30%)"  stackId="f" fill={T.red}    />
              <Bar dataKey="pd"   name="PD (30%)"   stackId="f" fill={T.amber}  />
              <Bar dataKey="wacc" name="WACC (20%)" stackId="f" fill={'#7c3aed'} />
              <Bar dataKey="liq"  name="Liq (20%)"  stackId="f" fill={T.teal}   />
            </BarChart>
          </ResponsiveContainer>
        </>)}
        {card(<>
          <SH title="Avg FR Spider" />
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={85}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11, fontFamily: T.mono }} />
              <Radar dataKey="val" stroke={T.red} fill={T.red} fillOpacity={0.2} />
            </RadarChart>
          </ResponsiveContainer>
        </>)}
      </div>
      {card(<>
        <SH title="FR Score Entity Ranking" />
        <div style={scrollTable}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <TH cols={["#", "Entity", "Sector", "VaR", "PD", "WACC", "Liq", "FR Score"]} />
            <tbody>{[...ENTITIES].sort((a, b) => b.frScore - a.frScore).map((e, i) => (
              <tr key={e.id} style={{ background: i % 2 === 0 ? "#fff" : T.cream }}>
                <td style={{ padding: "5px 8px", fontFamily: T.mono, color: T.slate }}>{i + 1}</td>
                <td style={{ padding: "5px 8px", fontFamily: T.mono, fontWeight: 700, color: T.navy }}>{e.name}</td>
                <td style={{ padding: "5px 8px", fontSize: 11, color: T.slate }}>{e.sector.split(" ")[0]}</td>
                <td style={{ padding: "5px 8px", fontFamily: T.mono, color: T.red    }}>{e.frVar}</td>
                <td style={{ padding: "5px 8px", fontFamily: T.mono, color: T.amber  }}>{e.frPd}</td>
                <td style={{ padding: "5px 8px", fontFamily: T.mono, color: '#7c3aed' }}>{e.frWacc}</td>
                <td style={{ padding: "5px 8px", fontFamily: T.mono, color: T.teal   }}>{e.frLiq}</td>
                <td style={{ padding: "5px 8px", fontFamily: T.mono, fontWeight: 700, color: dmiColor(e.frScore) }}>{e.frScore}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </>)}
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   TAB 4 — ESG Risk Component (40%)
════════════════════════════════════════════════════════════════════════════ */
const TabESGComponent = () => {
  const heatData = SECTORS.map(s => {
    const sc = ENTITIES.filter(e => e.sector === s);
    return {
      sector: s.split(" ")[0],
      gov: sc.length ? +(sc.reduce((a, e) => a + e.esgGov, 0) / sc.length).toFixed(1) : 0,
      env: sc.length ? +(sc.reduce((a, e) => a + e.esgEnv, 0) / sc.length).toFixed(1) : 0,
      soc: sc.length ? +(sc.reduce((a, e) => a + e.esgSoc, 0) / sc.length).toFixed(1) : 0,
      reg: sc.length ? +(sc.reduce((a, e) => a + e.esgReg, 0) / sc.length).toFixed(1) : 0,
      total: sc.length ? +(sc.reduce((a, e) => a + e.esgScore, 0) / sc.length).toFixed(1) : 0,
    };
  }).filter(d => d.total > 0);
  return (
    <div>
      <KpiGrid items={[
        { label: "Avg ESG Score",   value: +(ENTITIES.reduce((s, e) => s + e.esgScore, 0) / Math.max(1, ENTITIES.length)).toFixed(1), color: T.navy },
        { label: "Avg Governance",  value: +(ENTITIES.reduce((s, e) => s + e.esgGov,   0) / Math.max(1, ENTITIES.length)).toFixed(1), color: '#2563eb' },
        { label: "Avg Environment", value: +(ENTITIES.reduce((s, e) => s + e.esgEnv,   0) / Math.max(1, ENTITIES.length)).toFixed(1), color: T.green },
        { label: "Avg Social",      value: +(ENTITIES.reduce((s, e) => s + e.esgSoc,   0) / Math.max(1, ENTITIES.length)).toFixed(1), color: T.teal },
      ]} />
      <div style={{ background: T.cream, borderRadius: 8, padding: "10px 16px", marginBottom: 20, fontFamily: T.mono, fontSize: 12, color: T.navy, lineHeight: 1.8 }}>
        <strong>ESG_score</strong> = 25% × Governance + 35% × Environmental + 20% × Social + 20% × Regulatory
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {card(<>
          <SH title="ESG Sub-components by Sector" />
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={heatData} margin={{ bottom: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="sector" tick={{ fontSize: 9, fontFamily: T.mono }} angle={-30} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} domain={[0, 100]} />
              <Tooltip /><Legend />
              <Bar dataKey="gov" name="Gov (25%)" stackId="e" fill={'#2563eb'}   />
              <Bar dataKey="env" name="Env (35%)" stackId="e" fill={T.green}  />
              <Bar dataKey="soc" name="Soc (20%)" stackId="e" fill={T.teal}   />
              <Bar dataKey="reg" name="Reg (20%)" stackId="e" fill={'#7c3aed'} />
            </BarChart>
          </ResponsiveContainer>
        </>)}
        {card(<>
          <SH title="Sector ESG Total Score" />
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={heatData} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fontSize: 10, fontFamily: T.mono }} domain={[0, 100]} />
              <YAxis dataKey="sector" type="category" tick={{ fontSize: 10, fontFamily: T.mono }} width={60} />
              <Tooltip />
              <Bar dataKey="total" name="ESG Score" radius={[0, 4, 4, 0]}>
                {heatData.map((d, i) => <Cell key={i} fill={dmiColor(d.total)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </>)}
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   TAB 5 — Velocity & Momentum (20%)
════════════════════════════════════════════════════════════════════════════ */
const TabVelocity = () => {
  const [selEnt, setSelEnt] = useState(0);
  const e = ENTITIES[selEnt];
  const velData = e.emaHistory.map((v, i) => ({
    q: `Q${(i % 4) + 1}${2019 + Math.floor(i / 4)}`,
    ema: v,
    vel: +(e.velHistory[i] * 100).toFixed(3),
  }));
  const top5Rising  = [...ENTITIES].sort((a, b) => b.vel4q - a.vel4q).slice(0, 5);
  const top5Falling = [...ENTITIES].sort((a, b) => a.vel4q - b.vel4q).slice(0, 5);
  return (
    <div>
      <KpiGrid items={[
        { label: "Rising DMI (vel > 0)",  value: ENTITIES.filter(e => e.vel4q > 0).length,  color: T.red },
        { label: "Falling DMI (vel < 0)", value: ENTITIES.filter(e => e.vel4q < 0).length,  color: T.green },
        { label: "Avg Velocity (4Q)",     value: +(ENTITIES.reduce((s, e) => s + e.vel4q, 0) / Math.max(1, ENTITIES.length) * 100).toFixed(2) + "%", color: '#7c3aed' },
        { label: "Accelerating",          value: ENTITIES.filter(e => e.accel > 0).length,   color: T.amber },
      ]} />
      <div style={{ background: T.cream, borderRadius: 8, padding: "10px 16px", marginBottom: 20, fontFamily: T.mono, fontSize: 12, color: T.navy, lineHeight: 1.8 }}>
        <strong>EMA</strong>: EMA_t = α × DMI_t + (1-α) × EMA_(t-1), α = 0.2<br />
        <strong>Velocity</strong>: (EMA_t − EMA_(t-4)) / |EMA_(t-4)| — 4-quarter look-back<br />
        <strong>Acceleration</strong>: (vel_t − vel_(t-4)) / 4
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 12, color: T.slate, fontFamily: T.mono, marginRight: 10 }}>Entity:</label>
        <select value={selEnt} onChange={ev => setSelEnt(+ev.target.value)} style={{ fontSize: 12, padding: "4px 8px", borderRadius: 4, border: "1px solid #e2e8f0", fontFamily: T.mono }}>
          {ENTITIES.map((ent, i) => <option key={i} value={i}>{ent.name}</option>)}
        </select>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {card(<>
          <SH title={`EMA DMI Trend — ${e.name}`} sub="24 quarters" />
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={velData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="q" tick={{ fontSize: 8, fontFamily: T.mono }} interval={3} />
              <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} domain={[20, 100]} />
              <Tooltip />
              <Line dataKey="ema" name="EMA DMI" stroke={T.navy} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </>)}
        {card(<>
          <SH title={`Velocity — ${e.name}`} sub="(EMA_t − EMA_t-4) / EMA_t-4" />
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={velData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="q" tick={{ fontSize: 8, fontFamily: T.mono }} interval={3} />
              <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} unit="%" />
              <ReferenceLine y={0} stroke={T.slate} />
              <Tooltip formatter={v => [`${v}%`, "Velocity"]} />
              <Area dataKey="vel" name="Velocity %" stroke={'#7c3aed'} fill={'#7c3aed'} fillOpacity={0.15} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {card(<>
          <SH title="Top 5 Rising DMI" sub="Fastest acceleration in materiality" />
          {top5Rising.map((ent, i) => (
            <div key={ent.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f1f5f9" }}>
              <span style={{ fontFamily: T.mono, fontSize: 12, color: T.navy }}>{i + 1}. {ent.name}</span>
              <span style={{ fontFamily: T.mono, fontSize: 12, color: T.red, fontWeight: 700 }}>↑ {(ent.vel4q * 100).toFixed(2)}%</span>
            </div>
          ))}
        </>)}
        {card(<>
          <SH title="Top 5 Falling DMI" sub="Fastest deceleration in materiality" />
          {top5Falling.map((ent, i) => (
            <div key={ent.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f1f5f9" }}>
              <span style={{ fontFamily: T.mono, fontSize: 12, color: T.navy }}>{i + 1}. {ent.name}</span>
              <span style={{ fontFamily: T.mono, fontSize: 12, color: T.green, fontWeight: 700 }}>↓ {(ent.vel4q * 100).toFixed(2)}%</span>
            </div>
          ))}
        </>)}
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   TAB 6 — Regime Classification
════════════════════════════════════════════════════════════════════════════ */
const TabRegime = () => {
  const timeInRegime = REGIMES.map(r => ({
    regime: r,
    quarters: PORT_TREND.filter(q => q.regime === r).length,
    pct: +(PORT_TREND.filter(q => q.regime === r).length / Math.max(1, PORT_TREND.length) * 100).toFixed(1),
  }));
  return (
    <div>
      <KpiGrid items={[
        { label: "Normal",   value: ENTITIES.filter(e => e.regime === "Normal").length,   color: T.green },
        { label: "Elevated", value: ENTITIES.filter(e => e.regime === "Elevated").length, color: T.amber },
        { label: "Critical", value: ENTITIES.filter(e => e.regime === "Critical").length, color: T.red },
        { label: "Extreme",  value: ENTITIES.filter(e => e.regime === "Extreme").length,  color: '#7c3aed' },
      ]} />
      <div style={{ background: T.cream, borderRadius: 8, padding: "10px 16px", marginBottom: 20, fontFamily: T.mono, fontSize: 12, color: T.navy, lineHeight: 1.8 }}>
        <strong>Z-score</strong>: Z = (DMI − μ) / σ, μ=55, σ=14<br />
        Normal: |Z| ≤ 1 · Elevated: 1 &lt; |Z| ≤ 2 · Critical: 2 &lt; |Z| ≤ 3 · Extreme: |Z| &gt; 3
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {card(<>
          <SH title="Time-in-Regime — 24 Quarter Portfolio" sub="Quarters spent in each regime" />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={timeInRegime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="regime" tick={{ fontSize: 11, fontFamily: T.mono }} />
              <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} />
              <Tooltip />
              <Bar dataKey="quarters" name="Quarters" radius={[4, 4, 0, 0]}>
                {REGIMES.map((r, i) => <Cell key={i} fill={regimeColor(r)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </>)}
        {card(<>
          <SH title="Regime Transition Matrix" sub="Steady-state transition probabilities" />
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, fontFamily: T.mono }}>
              <thead>
                <tr><th style={{ padding: "6px 10px", color: T.slate }}>From \ To</th>
                  {REGIMES.map(r => <th key={r} style={{ padding: "6px 10px", color: regimeColor(r) }}>{r.slice(0, 4)}</th>)}
                </tr>
              </thead>
              <tbody>{REGIMES.map((from, fi) => (
                <tr key={from} style={{ background: fi % 2 === 0 ? "#fff" : T.cream }}>
                  <td style={{ padding: "6px 10px", fontWeight: 700, color: regimeColor(from) }}>{from.slice(0, 4)}</td>
                  {TRANS_MATRIX[fi].map((p, ti) => (
                    <td key={ti} style={{ padding: "6px 10px", textAlign: "center", color: fi === ti ? T.navy : T.slate, fontWeight: fi === ti ? 700 : 400 }}>{p}</td>
                  ))}
                </tr>
              ))}</tbody>
            </table>
          </div>
        </>)}
      </div>
      {card(<>
        <SH title="Z-Score Distribution — 40 Entities" />
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={Array.from({ length: 12 }, (_, i) => {
            const lo = -3 + i * 0.5, hi = lo + 0.5;
            return { range: lo.toFixed(1), count: ENTITIES.filter(e => e.z >= lo && e.z < hi).length };
          })}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="range" tick={{ fontSize: 10, fontFamily: T.mono }} />
            <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} />
            <ReferenceLine x="-1.0" stroke={T.amber} strokeDasharray="3 2" />
            <ReferenceLine x="1.0"  stroke={T.amber} strokeDasharray="3 2" />
            <Tooltip />
            <Bar dataKey="count" name="Entities" fill={T.navy} />
          </BarChart>
        </ResponsiveContainer>
      </>)}
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   TAB 7 — Portfolio HHI & Concentration
════════════════════════════════════════════════════════════════════════════ */
const TabHHI = () => {
  const tailContrib = [...ENTITIES].sort((a, b) => b.dmi - a.dmi).slice(0, 10).map((e, i) => ({
    name: e.name.slice(-8),
    weight: +(wNorm[ENTITIES.indexOf(e)] * 100).toFixed(2),
    dmiContrib: +(e.dmi * wNorm[ENTITIES.indexOf(e)]).toFixed(2),
    hhiContrib: +(wNorm[ENTITIES.indexOf(e)] ** 2 * 10000).toFixed(2),
  }));
  return (
    <div>
      <KpiGrid items={[
        { label: "Portfolio HHI",  value: portHHI.toFixed(4), color: '#2563eb', sub: `Effective N = ${effN}` },
        { label: "Max Weight",     value: `${(Math.max(...wNorm) * 100).toFixed(2)}%`, color: T.amber },
        { label: "Portfolio DMI",  value: portDMI, color: dmiColor(+portDMI) },
        { label: "Top-5 Weight %", value: `${([...wNorm].sort((a, b) => b - a).slice(0, 5).reduce((s, w) => s + w, 0) * 100).toFixed(1)}%`, color: T.red },
      ]} />
      <div style={{ background: T.cream, borderRadius: 8, padding: "10px 16px", marginBottom: 20, fontFamily: T.mono, fontSize: 12, color: T.navy, lineHeight: 1.8 }}>
        <strong>HHI</strong> = Σ wᵢ² &nbsp;(0 = perfectly diversified, 1 = fully concentrated)<br />
        <strong>Effective N</strong> = 1/HHI — number of equal-weight equivalents<br />
        <strong>Tail-risk contribution</strong>: Entity's weighted DMI × HHI share
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {card(<>
          <SH title="Weight Distribution — 40 Entities" />
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={[...ENTITIES].sort((a, b) => wNorm[b.id - 1] - wNorm[a.id - 1]).slice(0, 20).map(e => ({ name: e.name.slice(-5), w: +(wNorm[e.id - 1] * 100).toFixed(2) }))} margin={{ bottom: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 8, fontFamily: T.mono }} angle={-30} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} unit="%" />
              <Tooltip formatter={v => [`${v}%`, "Weight"]} />
              <Bar dataKey="w" name="Portfolio Weight %" fill={T.navy} />
            </BarChart>
          </ResponsiveContainer>
        </>)}
        {card(<>
          <SH title="Tail-Risk Contribution — Top 10 DMI" />
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={tailContrib}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 9, fontFamily: T.mono }} />
              <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} />
              <Tooltip /><Legend />
              <Bar dataKey="dmiContrib" name="Weighted DMI" fill={T.red}  />
              <Bar dataKey="hhiContrib" name="HHI Contrib ×10k" fill={'#2563eb'} />
            </BarChart>
          </ResponsiveContainer>
        </>)}
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   TAB 8 — DMI History (24 Quarters)
════════════════════════════════════════════════════════════════════════════ */
const TabHistory = () => {
  const [selA, setSelA] = useState(0);
  const [selB, setSelB] = useState(1);
  const eA = ENTITIES[selA], eB = ENTITIES[selB];
  const histData = PORT_TREND.map((q, i) => ({
    q: q.quarter,
    portDMI: q.portDMI,
    entityA: +(eA.emaHistory[i] || eA.dmi).toFixed(2),
    entityB: +(eB.emaHistory[i] || eB.dmi).toFixed(2),
    regime:  q.regime,
  }));
  return (
    <div>
      <KpiGrid items={[
        { label: "Min Portfolio DMI",  value: Math.min(...PORT_TREND.map(q => q.portDMI)).toFixed(2), color: T.green },
        { label: "Max Portfolio DMI",  value: Math.max(...PORT_TREND.map(q => q.portDMI)).toFixed(2), color: T.red },
        { label: "Current (Q24)",      value: PORT_TREND[23]?.portDMI,                               color: dmiColor(+PORT_TREND[23]?.portDMI) },
        { label: "Trend (last 4Q)",    value: PORT_TREND[23]?.portDMI > PORT_TREND[19]?.portDMI ? "Rising ↑" : "Falling ↓", color: PORT_TREND[23]?.portDMI > PORT_TREND[19]?.portDMI ? T.red : T.green },
      ]} />
      <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        <div>
          <label style={{ fontSize: 12, color: T.slate, fontFamily: T.mono, marginRight: 8 }}>Entity A:</label>
          <select value={selA} onChange={ev => setSelA(+ev.target.value)} style={{ fontSize: 12, padding: "4px 8px", borderRadius: 4, border: "1px solid #e2e8f0", fontFamily: T.mono }}>
            {ENTITIES.map((e, i) => <option key={i} value={i}>{e.name}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, color: T.slate, fontFamily: T.mono, marginRight: 8 }}>Entity B:</label>
          <select value={selB} onChange={ev => setSelB(+ev.target.value)} style={{ fontSize: 12, padding: "4px 8px", borderRadius: 4, border: "1px solid #e2e8f0", fontFamily: T.mono }}>
            {ENTITIES.map((e, i) => <option key={i} value={i}>{e.name}</option>)}
          </select>
        </div>
      </div>
      {card(<>
        <SH title="24-Quarter DMI Trend — Portfolio & 2 Entities" sub="EMA-smoothed; regime bands: Elevated=55, Critical=69" />
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={histData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="q" tick={{ fontSize: 8, fontFamily: T.mono }} interval={3} />
            <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} domain={[20, 100]} />
            <ReferenceLine y={55} stroke={T.amber} strokeDasharray="4 2" label={{ value: "Elevated", fill: T.amber, fontSize: 9 }} />
            <ReferenceLine y={69} stroke={T.red}   strokeDasharray="4 2" label={{ value: "Critical",  fill: T.red, fontSize: 9 }} />
            <Tooltip /><Legend />
            <Line dataKey="portDMI" name="Portfolio DMI" stroke={T.gold}  strokeWidth={3} dot={false} />
            <Line dataKey="entityA" name={eA.name}       stroke={T.navy}  strokeWidth={1.5} dot={false} />
            <Line dataKey="entityB" name={eB.name}       stroke={'#7c3aed'} strokeWidth={1.5} dot={false} strokeDasharray="3 2" />
          </LineChart>
        </ResponsiveContainer>
      </>, { marginBottom: 20 })}
      {card(<>
        <SH title="Quarter-by-Quarter Portfolio DMI Register" />
        <div style={{ maxHeight: 260, overflowY: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <TH cols={["Quarter", "Portfolio DMI", "Regime", "QoQ Δ"]} />
            <tbody>{PORT_TREND.map((q, i) => {
              const prev = PORT_TREND[i - 1]?.portDMI || q.portDMI;
              const delta = +(q.portDMI - prev).toFixed(2);
              return (
                <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : T.cream }}>
                  <td style={{ padding: "5px 8px", fontFamily: T.mono }}>{q.quarter}</td>
                  <td style={{ padding: "5px 8px", fontFamily: T.mono, fontWeight: 700, color: dmiColor(q.portDMI) }}>{q.portDMI}</td>
                  <td style={{ padding: "5px 8px" }}>{pill(q.regime, regimeColor(q.regime))}</td>
                  <td style={{ padding: "5px 8px", fontFamily: T.mono, color: delta > 0 ? T.red : T.green }}>{delta > 0 ? "+" : ""}{delta}</td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      </>)}
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   TAB 9 — Comparative Benchmarking
════════════════════════════════════════════════════════════════════════════ */
const TabBenchmark = () => {
  const dmiScores   = ENTITIES.map(e => e.dmi);
  const msciScores  = ENTITIES.map(e => e.msciLike);
  const sustScores  = ENTITIES.map(e => e.sustLike);
  const issScores   = ENTITIES.map(e => e.issLike);
  const rDmi_msci   = +spearman(dmiScores, msciScores).toFixed(4);
  const rDmi_sust   = +spearman(dmiScores, sustScores).toFixed(4);
  const rDmi_iss    = +spearman(dmiScores, issScores).toFixed(4);
  const rMsci_sust  = +spearman(msciScores, sustScores).toFixed(4);

  const scatterData = ENTITIES.map(e => ({ dmi: e.dmi, msci: e.msciLike, sust: e.sustLike }));
  return (
    <div>
      <KpiGrid items={[
        { label: "DMI vs MSCI-like (Spearman)", value: rDmi_msci.toFixed(3),  color: rDmi_msci > 0.6 ? T.green : T.amber },
        { label: "DMI vs Sust-like (Spearman)", value: rDmi_sust.toFixed(3),  color: rDmi_sust > 0.6 ? T.green : T.amber },
        { label: "DMI vs ISS-like (Spearman)",  value: rDmi_iss.toFixed(3),   color: rDmi_iss > 0.6 ? T.green : T.amber },
        { label: "MSCI vs Sust (Spearman)",     value: rMsci_sust.toFixed(3), color: T.slate },
      ]} />
      <div style={{ background: T.cream, borderRadius: 8, padding: "10px 16px", marginBottom: 20, fontFamily: T.mono, fontSize: 12, color: T.navy, lineHeight: 1.8 }}>
        <strong>Spearman rank correlation</strong>: ρ = 1 − 6Σd²/n(n²−1)<br />
        Proxies: MSCI-like (0-100), Sustainalytics-like (risk score 0-100), ISS-like (decile rank scaled 0-100)
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {card(<>
          <SH title="DMI vs MSCI-like Scatter" sub="Spearman ρ = " />
          <ResponsiveContainer width="100%" height={240}>
            <ScatterChart margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="dmi"  name="DMI"  tick={{ fontSize: 10, fontFamily: T.mono }} label={{ value: "DMI", position: "insideBottom", offset: -5, fontSize: 10 }} />
              <YAxis dataKey="msci" name="MSCI-like" tick={{ fontSize: 10, fontFamily: T.mono }} label={{ value: "MSCI", angle: -90, position: "insideLeft", fontSize: 10 }} />
              <Tooltip formatter={(v, n) => [v.toFixed(1), n]} />
              <Scatter data={scatterData} fill={T.navy} fillOpacity={0.6} />
            </ScatterChart>
          </ResponsiveContainer>
        </>)}
        {card(<>
          <SH title="Rank Correlation Matrix" />
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: T.mono, marginTop: 8 }}>
            <thead><tr>
              <th style={{ padding: "8px", color: T.slate }}> </th>
              {["DMI", "MSCI-like", "Sust-like", "ISS-like"].map(h => <th key={h} style={{ padding: "8px", color: T.navy, fontWeight: 700 }}>{h}</th>)}
            </tr></thead>
            <tbody>{[
              ["DMI",      "1.000", rDmi_msci.toFixed(3), rDmi_sust.toFixed(3), rDmi_iss.toFixed(3)],
              ["MSCI-like", rDmi_msci.toFixed(3), "1.000", rMsci_sust.toFixed(3), spearman(msciScores, issScores).toFixed(3)],
              ["Sust-like", rDmi_sust.toFixed(3), rMsci_sust.toFixed(3), "1.000", spearman(sustScores, issScores).toFixed(3)],
              ["ISS-like",  rDmi_iss.toFixed(3),  spearman(msciScores, issScores).toFixed(3), spearman(sustScores, issScores).toFixed(3), "1.000"],
            ].map((row, ri) => (
              <tr key={ri} style={{ background: ri % 2 === 0 ? "#fff" : T.cream }}>
                {row.map((cell, ci) => <td key={ci} style={{ padding: "6px 8px", textAlign: "center", fontWeight: ci === 0 || ri === ci - 1 ? 700 : 400, color: ci === 0 ? T.navy : +cell > 0.6 ? T.green : +cell > 0.3 ? T.amber : T.slate }}>{cell}</td>)}
              </tr>
            ))}</tbody>
          </table>
        </>)}
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   TAB 10 — Alert Integration
════════════════════════════════════════════════════════════════════════════ */
const ALERT_TIERS = { CRITICAL: T.red, HIGH: T.amber, MEDIUM: '#2563eb', LOW: T.teal };
const ALERTS = Array.from({ length: 30 }, (_, i) => {
  const e      = ENTITIES[i % 40];
  const tier   = ["CRITICAL","HIGH","MEDIUM","LOW"][Math.floor(sr(i * 7) * 4)];
  const pillar = ["Financial Risk","ESG Risk","Velocity","Regime Change"][Math.floor(sr(i * 11) * 4)];
  const resolved= sr(i * 13) > 0.4;
  const daysAgo = Math.floor(sr(i * 17) * 29) + 1;
  return { id: i + 1, entity: e.name, tier, pillar, resolved, daysAgo, dmiChange: +((sr(i * 19) - 0.5) * 15).toFixed(1) };
}).sort((a, b) => a.daysAgo - b.daysAgo);

const TabAlerts = () => {
  const [filter, setFilter] = useState("All");
  const visible = filter === "All" ? ALERTS : ALERTS.filter(a => a.tier === filter);
  const openCount = ALERTS.filter(a => !a.resolved).length;
  return (
    <div>
      <KpiGrid items={[
        { label: "Open Alerts (30 days)",   value: openCount,                              color: openCount > 5 ? T.red : T.amber },
        { label: "Critical",                value: ALERTS.filter(a => a.tier === "CRITICAL").length, color: T.red },
        { label: "High",                    value: ALERTS.filter(a => a.tier === "HIGH").length,     color: T.amber },
        { label: "Resolved",                value: ALERTS.filter(a => a.resolved).length,           color: T.green },
      ]} />
      <div style={{ marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
        {["All", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map(t => (
          <button key={t} onClick={() => setFilter(t)} style={{ padding: "5px 14px", background: filter === t ? T.navy : "#fff", color: filter === t ? "#fff" : T.slate, border: `1px solid ${T.gold}`, borderRadius: 4, fontSize: 11, fontFamily: T.mono, cursor: "pointer" }}>
            {t}
          </button>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {card(<>
          <SH title="Alert Tier Distribution" />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={Object.keys(ALERT_TIERS).map(t => ({ tier: t, count: ALERTS.filter(a => a.tier === t).length }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="tier" tick={{ fontSize: 10, fontFamily: T.mono }} />
              <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} />
              <Tooltip />
              <Bar dataKey="count" name="Alerts" radius={[4, 4, 0, 0]}>
                {Object.values(ALERT_TIERS).map((c, i) => <Cell key={i} fill={c} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </>)}
        {card(<>
          <SH title="Pillar Attribution" />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={["Financial Risk","ESG Risk","Velocity","Regime Change"].map(p => ({ pillar: p.split(" ")[0], count: ALERTS.filter(a => a.pillar === p).length }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="pillar" tick={{ fontSize: 10, fontFamily: T.mono }} />
              <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} />
              <Tooltip />
              <Bar dataKey="count" name="Alerts" fill={'#4f46e5'} />
            </BarChart>
          </ResponsiveContainer>
        </>)}
      </div>
      {card(<>
        <SH title="Alert Log — Last 30 Days" />
        <div style={scrollTable}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <TH cols={["#", "Days Ago", "Entity", "Tier", "Pillar", "DMI Δ", "Status"]} />
            <tbody>{visible.map((a, i) => (
              <tr key={a.id} style={{ background: i % 2 === 0 ? "#fff" : T.cream }}>
                <td style={{ padding: "5px 8px", fontFamily: T.mono, color: T.slate }}>{a.id}</td>
                <td style={{ padding: "5px 8px", fontFamily: T.mono }}>{a.daysAgo}d ago</td>
                <td style={{ padding: "5px 8px", fontFamily: T.mono, color: T.navy, fontWeight: 700 }}>{a.entity}</td>
                <td style={{ padding: "5px 8px" }}>{pill(a.tier, ALERT_TIERS[a.tier])}</td>
                <td style={{ padding: "5px 8px", fontSize: 11, color: T.slate }}>{a.pillar}</td>
                <td style={{ padding: "5px 8px", fontFamily: T.mono, color: a.dmiChange > 0 ? T.red : T.green }}>{a.dmiChange > 0 ? "+" : ""}{a.dmiChange}</td>
                <td style={{ padding: "5px 8px" }}>{pill(a.resolved ? "RESOLVED" : "OPEN", a.resolved ? T.green : T.red)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </>)}
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   PAGE SHELL
════════════════════════════════════════════════════════════════════════════ */
const TABS = [
  { key: "overview",     label: "Overview" },
  { key: "computation",  label: "DMI Engine" },
  { key: "fr",           label: "Financial Risk" },
  { key: "esg",          label: "ESG Risk" },
  { key: "velocity",     label: "Velocity" },
  { key: "regime",       label: "Regime" },
  { key: "hhi",          label: "HHI & Conc." },
  { key: "history",      label: "DMI History" },
  { key: "benchmark",    label: "Benchmarking" },
  { key: "alerts",       label: "Alert Integration" },
];

export default function DmeIndexPage() {
  const [tab, setTab] = useState("overview");
  return (
    <div style={{ fontFamily: T.font, background: T.cream, minHeight: "100vh", padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.navy }}>Dynamic Materiality Index</h1>
          {pill("EP-BE3", T.navy)}{pill("DME", '#7c3aed')}{pill("DMI", '#4f46e5')}
        </div>
        <div style={{ fontSize: 13, color: T.slate }}>
          DMI = 40%×FR + 40%×ESG + 20%×Velocity · EMA(α=0.2) · Z-score regime · Portfolio HHI · Spearman ρ benchmarking · 40 entities
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 0, marginBottom: 24, borderBottom: `2px solid ${T.gold}`, flexWrap: "wrap" }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: "8px 14px", background: tab === t.key ? T.navy : "transparent",
            color: tab === t.key ? "#fff" : T.slate, border: "none", cursor: "pointer",
            fontSize: 12, fontFamily: T.font, fontWeight: tab === t.key ? 700 : 400,
            borderBottom: tab === t.key ? `2px solid ${T.gold}` : "none",
            marginBottom: tab === t.key ? -2 : 0, transition: "all 0.15s", whiteSpace: "nowrap",
          }}>{t.label}</button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "overview"    && <TabOverview />}
      {tab === "computation" && <TabComputation />}
      {tab === "fr"          && <TabFRComponent />}
      {tab === "esg"         && <TabESGComponent />}
      {tab === "velocity"    && <TabVelocity />}
      {tab === "regime"      && <TabRegime />}
      {tab === "hhi"         && <TabHHI />}
      {tab === "history"     && <TabHistory />}
      {tab === "benchmark"   && <TabBenchmark />}
      {tab === "alerts"      && <TabAlerts />}
    </div>
  );
}
