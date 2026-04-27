/**
 * EP-BE1 — DME Financial Risk Analytics
 * Sprint BE | Dynamic Materiality Engine
 *
 * VaR (Historical Simulation 252d), CVaR, WACC (Ke = Rf + β×ERP + climate premium,
 * Kd = credit_spread + stranded haircut), LCR, NSFR, ECL (PD×LGD×EAD×DF),
 * IFRS 9 staging, NGFS scenario stress, credit concentration, interest-rate risk
 * (Macaulay duration, DV01, BPV01), operational risk (BIA 15%), limit dashboard.
 * 40 entities · 10 tabs · zero Math.random · guarded divisions · spread-before-sort
 */
import React, { useState, useMemo } from "react";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, ReferenceLine, ScatterChart, Scatter
} from "recharts";

/* ── Theme ────────────────────────────────────────────────────────────────── */
const T = {
  navy:"#1b3a5c", gold:"#c5a96a", cream:"#f7f4ef", slate:"#64748b",
  card:"#ffffff", surfaceH:"#ede9e2",
  font:"'DM Sans', sans-serif", mono:"'JetBrains Mono', monospace",
  green:"#059669", red:"#dc2626", amber:"#d97706", teal:"#0e7490",
};

/* ── Seeded random ────────────────────────────────────────────────────────── */
const sr  = (s) => { const x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const hashStr = (str) => str.split("").reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 5381);

/* ── Math helpers ─────────────────────────────────────────────────────────── */
const duration = (flows, rate) => {
  let pv = 0, pvt = 0;
  flows.forEach((cf, i) => { const t = i + 1; const d = cf / Math.pow(1 + rate, t); pv += d; pvt += t * d; });
  return pvt / Math.max(0.0001, pv);
};
const dv01   = (dur, price) => dur * price / 10000;
const lcr    = (hqla, netOutflows) => netOutflows > 0 ? hqla / netOutflows * 100 : 999;
const nsfr   = (asf, rsf) => rsf > 0 ? asf / rsf * 100 : 999;
const eclCalc= (pd, lgd, ead, df) => pd * lgd * ead * (df || 1);

/* ── Sectors / NGFS scenarios ─────────────────────────────────────────────── */
const SECTORS  = ["Energy","Materials","Industrials","Consumer Disc","Consumer Staples","Health Care","Financials","IT","Utilities","Real Estate"];
const RATINGS  = ["AAA","AA","A","BBB","BB","B","CCC"];
const REGIONS  = ["North America","Europe","Asia-Pacific","Emerging Markets","Middle East"];
const NGFS_SC  = ["Net Zero 2050","Delayed Transition","Divergent Net Zero","Current Policies","Below 2°C","Nationally Determined"];

/* ── Entity generation ────────────────────────────────────────────────────── */
const ENTITIES = Array.from({ length: 40 }, (_, i) => {
  const sector  = SECTORS[i % SECTORS.length];
  const rating  = RATINGS[Math.floor(sr(i * 3) * RATINGS.length)];
  const region  = REGIONS[Math.floor(sr(i * 5) * REGIONS.length)];
  const weight  = +(0.015 + sr(i * 7) * 0.035).toFixed(4);

  /* VaR / CVaR — historical simulation 252 days */
  const returns = Array.from({ length: 252 }, (_, d) => (sr(i * 1000 + d) - 0.5) * 0.04);
  const sorted  = [...returns].sort((a, b) => a - b);
  const var95   = +Math.abs(sorted[Math.floor(252 * 0.05)]).toFixed(5);
  const var99   = +Math.abs(sorted[Math.floor(252 * 0.01)]).toFixed(5);
  const var10d  = +(var95 * Math.sqrt(10)).toFixed(5);
  const cvar95  = +Math.abs(sorted.slice(0, Math.floor(252 * 0.05)).reduce((s, v) => s + v, 0) / Math.max(1, Math.floor(252 * 0.05))).toFixed(5);

  /* WACC */
  const rf      = 0.04;
  const beta    = +(0.6 + sr(i * 11) * 1.2).toFixed(3);
  const erp     = 0.055;
  const climPrem= +(0.005 + sr(i * 13) * 0.025).toFixed(4);
  const ke      = +(rf + beta * erp + climPrem).toFixed(4);
  const creditSp= +(0.01 + sr(i * 17) * 0.04).toFixed(4);
  const strandHc= +(sr(i * 19) * 0.015).toFixed(4);
  const kd      = +(creditSp + strandHc).toFixed(4);
  const eRatio  = +(0.4 + sr(i * 23) * 0.4).toFixed(3);
  const dRatio  = +(1 - eRatio).toFixed(3);
  const tax     = 0.25;
  const wacc    = +(ke * eRatio + kd * (1 - tax) * dRatio).toFixed(5);
  const waccBase= +(( rf + beta * erp) * eRatio + (creditSp * (1 - tax)) * dRatio).toFixed(5);
  const waccBps = Math.round((wacc - waccBase) * 10000);

  /* LCR / NSFR */
  const hqla    = +(100 + sr(i * 29) * 900).toFixed(1);
  const out30d  = +(60 + sr(i * 31) * 400).toFixed(1);
  const lcrVal  = +lcr(hqla, out30d).toFixed(1);
  const asf     = +(80 + sr(i * 37) * 800).toFixed(1);
  const rsf     = +(70 + sr(i * 41) * 700).toFixed(1);
  const nsfrVal = +nsfr(asf, rsf).toFixed(1);

  /* ECL / IFRS 9 */
  const pd      = +(0.003 + sr(i * 43) * 0.14).toFixed(5);
  const lgd     = +(0.25 + sr(i * 47) * 0.45).toFixed(4);
  const ead     = +(10 + sr(i * 53) * 490).toFixed(1);
  const df      = +(0.92 + sr(i * 57) * 0.06).toFixed(4);
  const ecl12m  = +eclCalc(pd, lgd, ead, df).toFixed(2);
  const eclLife = +(ecl12m * (3 + sr(i * 61) * 5)).toFixed(2);
  const zScore  = +((pd - 0.02) / 0.015 + sr(i * 63) * 1.5).toFixed(3);
  const stage   = zScore < 0.5 ? 1 : zScore < 2.0 ? 2 : 3;

  /* Duration */
  const coupon  = +(0.03 + sr(i * 67) * 0.05).toFixed(4);
  const flows   = Array.from({ length: 10 }, (_, t) => (t < 9 ? coupon * 100 : (1 + coupon) * 100));
  const modDur  = +duration(flows, coupon).toFixed(4);
  const price   = 100;
  const dv01Val = +dv01(modDur, price).toFixed(4);

  /* Operational */
  const grossInc = +(20 + sr(i * 71) * 180).toFixed(1);
  const oprCap   = +(grossInc * 0.15).toFixed(2);
  const carbonInt= Math.round(20 + sr(i * 73) * 480);

  return {
    id: i + 1,
    name: `${sector.split(" ")[0].slice(0, 4).toUpperCase()}-Corp-${String(i + 1).padStart(2, "0")}`,
    sector, rating, region, weight,
    var95, var99, var10d, cvar95,
    ke, kd, wacc, waccBase, waccBps, beta, climPrem, eRatio, dRatio,
    hqla, out30d, lcrVal, asf, rsf, nsfrVal,
    pd, lgd, ead, df, ecl12m, eclLife, zScore, stage,
    modDur, dv01Val, coupon,
    grossInc, oprCap, carbonInt,
  };
});

/* ── Portfolio-level KPIs ─────────────────────────────────────────────────── */
const wSum     = ENTITIES.reduce((s, e) => s + e.weight, 0);
const wNorm    = ENTITIES.map(e => e.weight / Math.max(0.0001, wSum));
const portVaR95= +(ENTITIES.reduce((s, e, i) => s + e.var95 * wNorm[i], 0)).toFixed(5);
const portCVaR = +(ENTITIES.reduce((s, e, i) => s + e.cvar95 * wNorm[i], 0)).toFixed(5);
const portWACC = +(ENTITIES.reduce((s, e, i) => s + e.wacc * wNorm[i], 0)).toFixed(5);
const portLCR  = +(ENTITIES.reduce((s, e) => s + e.lcrVal, 0) / Math.max(1, ENTITIES.length)).toFixed(1);
const portNSFR = +(ENTITIES.reduce((s, e) => s + e.nsfrVal, 0) / Math.max(1, ENTITIES.length)).toFixed(1);
const totalECL = +(ENTITIES.reduce((s, e) => s + e.ecl12m, 0)).toFixed(2);
const stg3Pct  = +(ENTITIES.filter(e => e.stage === 3).length / Math.max(1, ENTITIES.length) * 100).toFixed(1);
const stressLoss= +(totalECL * 1.35).toFixed(2);

/* ── Historical P&L data for histogram ───────────────────────────────────── */
const PNL_HIST = Array.from({ length: 30 }, (_, i) => {
  const ret = (sr(i * 7) - 0.5) * 0.06;
  return { bin: `${(ret * 100).toFixed(1)}%`, freq: Math.round(5 + sr(i * 11) * 25), ret };
}).sort((a, b) => a.ret - b.ret);

/* ── NGFS stress data ─────────────────────────────────────────────────────── */
const NGFS_DATA = NGFS_SC.map((sc, si) => ({
  scenario: sc,
  varDelta: +(0.005 + sr(si * 13) * 0.04).toFixed(4),
  waccDelta: +(0.001 + sr(si * 17) * 0.015).toFixed(4),
  eclDelta: +(5 + sr(si * 19) * 40).toFixed(1),
  entities: ENTITIES.slice(0, 10).map((e, ei) => ({
    name: e.name,
    stressed: +(e.var95 * (1.1 + sr(si * 100 + ei) * 0.5)).toFixed(5),
  })),
}));

/* ── Interest rate shock scenarios ───────────────────────────────────────── */
const RATE_SHOCKS = [-200, -100, -50, -25, 25, 50, 100, 200].map(bps => {
  const dRate = bps / 10000;
  const avgDur = +(ENTITIES.reduce((s, e) => s + e.modDur, 0) / Math.max(1, ENTITIES.length)).toFixed(4);
  const pnl = +(-avgDur * dRate * 100).toFixed(2);
  return { bps, dRate, pnl, label: `${bps > 0 ? "+" : ""}${bps}bps` };
});

/* ── Credit concentration ─────────────────────────────────────────────────── */
const sectorExp = SECTORS.map(s => {
  const ents = ENTITIES.filter(e => e.sector === s);
  const exp   = ents.reduce((a, e) => a + e.ead, 0);
  return { sector: s.split(" ")[0], exp: +exp.toFixed(1), count: ents.length };
}).filter(s => s.count > 0);
const totalExp  = sectorExp.reduce((s, d) => s + d.exp, 0);
const hhiSector = +sectorExp.reduce((s, d) => s + (d.exp / Math.max(0.0001, totalExp)) ** 2, 0).toFixed(4);

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
const stageColor = s => s === 1 ? T.green : s === 2 ? T.amber : T.red;
const lcrColor   = v => v >= 120 ? T.green : v >= 100 ? T.amber : T.red;
const TH = ({ cols }) => (
  <thead style={{ position: "sticky", top: 0, background: T.cream }}>
    <tr>{cols.map(h => <th key={h} style={{ padding: "6px 8px", textAlign: "left", color: T.navy, fontWeight: 700, borderBottom: `2px solid ${T.gold}`, fontFamily: T.mono, fontSize: 10, whiteSpace: "nowrap" }}>{h}</th>)}</tr>
  </thead>
);
const scrollTable = { maxHeight: 340, overflowY: "auto" };

/* ════════════════════════════════════════════════════════════════════════════
   TAB 1 — Overview
════════════════════════════════════════════════════════════════════════════ */
const TabOverview = () => (
  <div>
    <KpiGrid items={[
      { label: "Portfolio VaR 95% (1-day)", value: `${(portVaR95 * 100).toFixed(3)}%`, color: T.red, sub: "Historical simulation 252d" },
      { label: "Portfolio CVaR 95%",        value: `${(portCVaR * 100).toFixed(3)}%`,  color: '#7c3aed' },
      { label: "Weighted Avg WACC",         value: `${(portWACC * 100).toFixed(2)}%`,  color: T.navy },
      { label: "Avg LCR",                   value: `${portLCR}%`,                       color: lcrColor(+portLCR) },
    ]} />
    <KpiGrid items={[
      { label: "Avg NSFR",           value: `${portNSFR}%`,         color: lcrColor(+portNSFR) },
      { label: "Total ECL (12-mo)",  value: `$${totalECL}M`,        color: T.red },
      { label: "IFRS 9 Stage 3 %",   value: `${stg3Pct}%`,          color: T.red },
      { label: "NGFS Stressed Loss", value: `$${stressLoss}M`,      color: T.amber, sub: "Delayed Transition proxy" },
    ]} />
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
      {card(<>
        <SH title="VaR by Sector" sub="1-day 95% historical simulation" />
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={SECTORS.map(s => { const sc = ENTITIES.filter(e => e.sector === s); return { sector: s.split(" ")[0], var95: sc.length ? +(sc.reduce((a, e) => a + e.var95, 0) / sc.length * 100).toFixed(3) : 0 }; }).filter(d => d.var95 > 0)} margin={{ bottom: 24 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="sector" tick={{ fontSize: 9, fontFamily: T.mono }} angle={-30} textAnchor="end" interval={0} />
            <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} tickFormatter={v => `${v}%`} />
            <Tooltip formatter={v => [`${v}%`, "VaR 95%"]} />
            <Bar dataKey="var95" name="VaR 95%" radius={[4, 4, 0, 0]}>
              {SECTORS.map((_, i) => <Cell key={i} fill={i % 2 === 0 ? T.navy : '#2563eb'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </>)}
      {card(<>
        <SH title="IFRS 9 Stage Distribution" sub="Stage 1 (Normal) · Stage 2 (SICR) · Stage 3 (Impaired)" />
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={[1, 2, 3].map(s => ({ stage: `Stage ${s}`, count: ENTITIES.filter(e => e.stage === s).length, ecl: +ENTITIES.filter(e => e.stage === s).reduce((a, e) => a + e.ecl12m, 0).toFixed(1) }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="stage" tick={{ fontSize: 12, fontFamily: T.mono }} />
            <YAxis yAxisId="l" tick={{ fontSize: 10, fontFamily: T.mono }} />
            <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 10, fontFamily: T.mono }} />
            <Tooltip /><Legend />
            <Bar yAxisId="l" dataKey="count" name="Entities" radius={[4, 4, 0, 0]}>{[T.green, T.amber, T.red].map((c, i) => <Cell key={i} fill={c} />)}</Bar>
            <Bar yAxisId="r" dataKey="ecl"   name="ECL $M"   fill={T.navy} />
          </BarChart>
        </ResponsiveContainer>
      </>)}
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
      {card(<>
        <SH title="Top 5 — Highest VaR 95%" />
        {[...ENTITIES].sort((a, b) => b.var95 - a.var95).slice(0, 5).map((e, i) => (
          <div key={e.id} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #f1f5f9" }}>
            <span style={{ fontFamily: T.mono, fontSize: 12, color: T.navy }}>{i + 1}. {e.name}</span>
            <span style={{ fontFamily: T.mono, fontSize: 12, color: T.red, fontWeight: 700 }}>{(e.var95 * 100).toFixed(3)}%</span>
          </div>
        ))}
      </>)}
      {card(<>
        <SH title="Top 5 — Highest WACC Premium (bps)" />
        {[...ENTITIES].sort((a, b) => b.waccBps - a.waccBps).slice(0, 5).map((e, i) => (
          <div key={e.id} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #f1f5f9" }}>
            <span style={{ fontFamily: T.mono, fontSize: 12, color: T.navy }}>{i + 1}. {e.name}</span>
            <span style={{ fontFamily: T.mono, fontSize: 12, color: '#7c3aed', fontWeight: 700 }}>{e.waccBps} bps</span>
          </div>
        ))}
      </>)}
    </div>
  </div>
);

/* ════════════════════════════════════════════════════════════════════════════
   TAB 2 — Market Risk (VaR / CVaR)
════════════════════════════════════════════════════════════════════════════ */
const TabMarketRisk = () => {
  const [sel, setSel] = useState(0);
  const entity = ENTITIES[sel];
  const returns252 = Array.from({ length: 252 }, (_, d) => ({
    day: d + 1,
    ret: +((sr(sel * 1000 + d) - 0.5) * 0.04 * 100).toFixed(3),
  }));
  const var95Line = +(entity.var95 * 100).toFixed(3);
  const var99Line = +(entity.var99 * 100).toFixed(3);
  return (
    <div>
      <KpiGrid items={[
        { label: "1-Day VaR 95%",  value: `${(entity.var95 * 100).toFixed(3)}%`, color: T.amber },
        { label: "1-Day VaR 99%",  value: `${(entity.var99 * 100).toFixed(3)}%`, color: T.red },
        { label: "10-Day VaR 95%", value: `${(entity.var10d * 100).toFixed(3)}%`, color: T.red, sub: "VaR₉₅ × √10" },
        { label: "CVaR 95% (ES)",  value: `${(entity.cvar95 * 100).toFixed(3)}%`, color: '#7c3aed', sub: "Expected Shortfall tail" },
      ]} />
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 12, color: T.slate, fontFamily: T.mono, marginRight: 10 }}>Select Entity:</label>
        <select value={sel} onChange={e => setSel(+e.target.value)} style={{ fontSize: 12, padding: "4px 8px", borderRadius: 4, border: "1px solid #e2e8f0", fontFamily: T.mono }}>
          {ENTITIES.map((e, i) => <option key={i} value={i}>{e.name}</option>)}
        </select>
      </div>
      {card(<>
        <SH title={`Historical P&L — 252-Day Simulation: ${entity.name}`} sub="Sorted returns; VaR 95%/99% reference lines" />
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={returns252}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="day" tick={{ fontSize: 9, fontFamily: T.mono }} interval={30} />
            <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} tickFormatter={v => `${v}%`} />
            <Tooltip formatter={v => [`${v}%`, "Daily Return"]} />
            <ReferenceLine y={-var95Line} stroke={T.amber} strokeDasharray="4 2" label={{ value: "VaR 95%", fill: T.amber, fontSize: 9 }} />
            <ReferenceLine y={-var99Line} stroke={T.red}   strokeDasharray="4 2" label={{ value: "VaR 99%", fill: T.red, fontSize: 9 }} />
            <Line dataKey="ret" name="Daily Return %" stroke={T.navy} strokeWidth={1} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </>, { marginBottom: 20 })}
      {card(<>
        <SH title="P&L Return Distribution — All Entities" sub="Frequency histogram of 30-bin return buckets" />
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={PNL_HIST} margin={{ bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="bin" tick={{ fontSize: 9, fontFamily: T.mono }} angle={-45} textAnchor="end" interval={2} />
            <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} />
            <Tooltip />
            <Bar dataKey="freq" name="Frequency" radius={[2, 2, 0, 0]}>
              {PNL_HIST.map((d, i) => <Cell key={i} fill={d.ret < 0 ? T.red : T.green} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </>, { marginBottom: 20 })}
      {card(<>
        <SH title="Entity VaR Register" sub="1-day 95%/99%, 10-day scaling, CVaR tail" />
        <div style={scrollTable}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <TH cols={["Entity", "Sector", "Rating", "VaR 95%", "VaR 99%", "10d VaR", "CVaR 95%", "Carbon Int"]} />
            <tbody>{[...ENTITIES].sort((a, b) => b.var95 - a.var95).map((e, i) => (
              <tr key={e.id} style={{ background: i % 2 === 0 ? "#fff" : T.cream }}>
                <td style={{ padding: "5px 8px", fontFamily: T.mono, fontSize: 11, fontWeight: 700, color: T.navy }}>{e.name}</td>
                <td style={{ padding: "5px 8px", fontSize: 11, color: T.slate }}>{e.sector.split(" ")[0]}</td>
                <td style={{ padding: "5px 8px", fontFamily: T.mono, color: T.surfaceH }}>{e.rating}</td>
                <td style={{ padding: "5px 8px", fontFamily: T.mono, color: T.amber }}>{(e.var95 * 100).toFixed(3)}%</td>
                <td style={{ padding: "5px 8px", fontFamily: T.mono, color: T.red   }}>{(e.var99 * 100).toFixed(3)}%</td>
                <td style={{ padding: "5px 8px", fontFamily: T.mono, color: T.red   }}>{(e.var10d * 100).toFixed(3)}%</td>
                <td style={{ padding: "5px 8px", fontFamily: T.mono, color: '#7c3aed', fontWeight: 700 }}>{(e.cvar95 * 100).toFixed(3)}%</td>
                <td style={{ padding: "5px 8px", fontFamily: T.mono, color: e.carbonInt > 300 ? T.red : T.amber }}>{e.carbonInt}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </>)}
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   TAB 3 — WACC Engine
════════════════════════════════════════════════════════════════════════════ */
const TabWACC = () => {
  const waccData = [...ENTITIES].sort((a, b) => b.waccBps - a.waccBps).slice(0, 15).map(e => ({
    name: e.name.slice(-8),
    base: +(e.waccBase * 100).toFixed(3),
    adj: +(e.wacc * 100).toFixed(3),
    bps: e.waccBps,
  }));
  const sensData = [-0.02, -0.01, 0, 0.01, 0.02].map(dClim => ({
    label: `CP ${dClim >= 0 ? "+" : ""}${(dClim * 100).toFixed(0)}bps`,
    wacc: +((portWACC + dClim * 0.6) * 100).toFixed(3),
  }));
  return (
    <div>
      <KpiGrid items={[
        { label: "Portfolio WACC (adj)", value: `${(portWACC * 100).toFixed(2)}%`, color: T.navy },
        { label: "Avg WACC Uplift",      value: `${Math.round(ENTITIES.reduce((s, e) => s + e.waccBps, 0) / Math.max(1, ENTITIES.length))} bps`, color: '#7c3aed' },
        { label: "Avg Ke",               value: `${(ENTITIES.reduce((s, e) => s + e.ke, 0) / Math.max(1, ENTITIES.length) * 100).toFixed(2)}%`, color: '#2563eb' },
        { label: "Avg Kd (after-tax)",   value: `${(ENTITIES.reduce((s, e) => s + e.kd * (1 - 0.25), 0) / Math.max(1, ENTITIES.length) * 100).toFixed(2)}%`, color: T.teal },
      ]} />
      <div style={{ background: T.cream, borderRadius: 8, padding: "12px 16px", marginBottom: 20, fontFamily: T.mono, fontSize: 12, color: T.navy, lineHeight: 1.9 }}>
        <strong>WACC Formula:</strong> WACC = Ke × [E/(D+E)] + Kd × (1−tax) × [D/(D+E)]<br />
        <strong>Ke</strong> = Rf + β × (Rm−Rf) + Climate_Premium &nbsp;|&nbsp; Rf = 4%, ERP = 5.5%<br />
        <strong>Kd</strong> = Credit_Spread + Stranded_Asset_Haircut<br />
        <strong>Climate_Premium</strong> = f(carbon intensity, physical risk score, ESG rating)
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {card(<>
          <SH title="WACC Uplift (bps) — Top 15 Entities" sub="Baseline vs ESG-adjusted cost of capital" />
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={waccData} margin={{ bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 9, fontFamily: T.mono }} angle={-30} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} unit=" bp" />
              <Tooltip formatter={(v, n) => n === "bps" ? `${v} bp` : `${v}%`} /><Legend />
              <Bar dataKey="base" name="Baseline %" stackId="s" fill={'#2563eb'} />
              <Bar dataKey="adj"  name="Adjusted %" stackId="s" fill={T.red} />
            </BarChart>
          </ResponsiveContainer>
        </>)}
        {card(<>
          <SH title="WACC Sensitivity to Climate Premium" sub="±20 bps climate premium shock" />
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={sensData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fontFamily: T.mono }} />
              <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} tickFormatter={v => `${v}%`} domain={["auto", "auto"]} />
              <Tooltip formatter={v => [`${v}%`, "Portfolio WACC"]} />
              <Bar dataKey="wacc" name="Portfolio WACC %" radius={[4, 4, 0, 0]}>
                {sensData.map((_, i) => <Cell key={i} fill={i === 2 ? T.navy : i < 2 ? T.green : T.red} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </>)}
      </div>
      {card(<>
        <SH title="WACC Component Breakdown — All 40 Entities" sub="Ke (equity) · Kd after-tax (debt) · Climate Premium · Beta" />
        <div style={scrollTable}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <TH cols={["Entity", "Sector", "β", "Ke", "Kd", "E/D+E", "Climate Prem", "WACC Base", "WACC Adj", "Uplift"]} />
            <tbody>{[...ENTITIES].sort((a, b) => b.waccBps - a.waccBps).map((e, i) => (
              <tr key={e.id} style={{ background: i % 2 === 0 ? "#fff" : T.cream }}>
                <td style={{ padding: "5px 8px", fontFamily: T.mono, fontSize: 11, fontWeight: 700, color: T.navy }}>{e.name}</td>
                <td style={{ padding: "5px 8px", fontSize: 11, color: T.slate }}>{e.sector.split(" ")[0]}</td>
                <td style={{ padding: "5px 8px", fontFamily: T.mono }}>{e.beta}</td>
                <td style={{ padding: "5px 8px", fontFamily: T.mono, color: '#2563eb' }}>{(e.ke * 100).toFixed(2)}%</td>
                <td style={{ padding: "5px 8px", fontFamily: T.mono, color: T.teal }}>{(e.kd * 100).toFixed(2)}%</td>
                <td style={{ padding: "5px 8px", fontFamily: T.mono }}>{(e.eRatio * 100).toFixed(0)}%</td>
                <td style={{ padding: "5px 8px", fontFamily: T.mono, color: '#7c3aed' }}>{(e.climPrem * 10000).toFixed(0)} bp</td>
                <td style={{ padding: "5px 8px", fontFamily: T.mono }}>{(e.waccBase * 100).toFixed(3)}%</td>
                <td style={{ padding: "5px 8px", fontFamily: T.mono, fontWeight: 700, color: T.navy }}>{(e.wacc * 100).toFixed(3)}%</td>
                <td style={{ padding: "5px 8px", fontFamily: T.mono, color: e.waccBps > 50 ? T.red : T.amber, fontWeight: 700 }}>{e.waccBps} bp</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </>)}
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   TAB 4 — Liquidity Risk (LCR & NSFR)
════════════════════════════════════════════════════════════════════════════ */
const TabLiquidity = () => {
  const lcrBreached = ENTITIES.filter(e => e.lcrVal < 100).length;
  const nsfrBreached = ENTITIES.filter(e => e.nsfrVal < 100).length;
  const lcrData = SECTORS.map(s => {
    const sc = ENTITIES.filter(e => e.sector === s);
    return {
      sector: s.split(" ")[0],
      lcr: sc.length ? +(sc.reduce((a, e) => a + e.lcrVal, 0) / sc.length).toFixed(1) : 0,
      nsfr: sc.length ? +(sc.reduce((a, e) => a + e.nsfrVal, 0) / sc.length).toFixed(1) : 0,
    };
  }).filter(d => d.lcr > 0);
  return (
    <div>
      <KpiGrid items={[
        { label: "Avg LCR",          value: `${portLCR}%`,        color: lcrColor(+portLCR), sub: "Min: 100%" },
        { label: "LCR Breached",     value: lcrBreached,           color: lcrBreached > 0 ? T.red : T.green },
        { label: "Avg NSFR",         value: `${portNSFR}%`,        color: lcrColor(+portNSFR), sub: "Min: 100%" },
        { label: "NSFR Breached",    value: nsfrBreached,          color: nsfrBreached > 0 ? T.red : T.green },
      ]} />
      <div style={{ background: T.cream, borderRadius: 8, padding: "10px 16px", marginBottom: 20, fontFamily: T.mono, fontSize: 12, color: T.navy, lineHeight: 1.8 }}>
        <strong>LCR</strong> = HQLA / Net 30-day Cash Outflows ≥ 100% (Basel III)<br />
        <strong>NSFR</strong> = Available Stable Funding (ASF) / Required Stable Funding (RSF) ≥ 100%
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {card(<>
          <SH title="LCR vs NSFR by Sector" sub="Regulatory threshold: 100%" />
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={lcrData} margin={{ bottom: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="sector" tick={{ fontSize: 9, fontFamily: T.mono }} angle={-30} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} unit="%" />
              <ReferenceLine y={100} stroke={T.red} strokeDasharray="3 2" label={{ value: "100%", fill: T.red, fontSize: 10 }} />
              <Tooltip unit="%" /><Legend />
              <Bar dataKey="lcr"  name="LCR %"  fill={'#2563eb'} />
              <Bar dataKey="nsfr" name="NSFR %" fill={T.teal} />
            </BarChart>
          </ResponsiveContainer>
        </>)}
        {card(<>
          <SH title="LCR Distribution — Entity Scatter" sub="Traffic-light status vs 100% threshold" />
          <ResponsiveContainer width="100%" height={230}>
            <ScatterChart margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="lcr"  name="LCR %"  tick={{ fontSize: 10, fontFamily: T.mono }} unit="%" />
              <YAxis dataKey="nsfr" name="NSFR %" tick={{ fontSize: 10, fontFamily: T.mono }} unit="%" />
              <ReferenceLine y={100} stroke={T.red}  strokeDasharray="3 2" />
              <ReferenceLine x={100} stroke={T.red}  strokeDasharray="3 2" />
              <Tooltip formatter={(v, n) => [`${v}%`, n]} />
              <Scatter data={ENTITIES.map(e => ({ lcr: e.lcrVal, nsfr: e.nsfrVal }))} fillOpacity={0.7}>
                {ENTITIES.map((e, i) => <Cell key={i} fill={e.lcrVal >= 100 && e.nsfrVal >= 100 ? T.green : T.red} />)}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </>)}
      </div>
      {card(<>
        <SH title="LCR & NSFR — Full Entity Register" sub="Traffic-light status by regulatory threshold" />
        <div style={scrollTable}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <TH cols={["Entity", "Sector", "HQLA", "Net Outflows", "LCR%", "LCR Status", "ASF", "RSF", "NSFR%", "NSFR Status"]} />
            <tbody>{ENTITIES.map((e, i) => (
              <tr key={e.id} style={{ background: i % 2 === 0 ? "#fff" : T.cream }}>
                <td style={{ padding: "5px 8px", fontFamily: T.mono, fontSize: 11, fontWeight: 700, color: T.navy }}>{e.name}</td>
                <td style={{ padding: "5px 8px", fontSize: 11, color: T.slate }}>{e.sector.split(" ")[0]}</td>
                <td style={{ padding: "5px 8px", fontFamily: T.mono }}>{e.hqla}</td>
                <td style={{ padding: "5px 8px", fontFamily: T.mono }}>{e.out30d}</td>
                <td style={{ padding: "5px 8px", fontFamily: T.mono, fontWeight: 700, color: lcrColor(e.lcrVal) }}>{e.lcrVal}%</td>
                <td style={{ padding: "5px 8px" }}>{pill(e.lcrVal >= 100 ? "OK" : "BREACH", e.lcrVal >= 100 ? T.green : T.red)}</td>
                <td style={{ padding: "5px 8px", fontFamily: T.mono }}>{e.asf}</td>
                <td style={{ padding: "5px 8px", fontFamily: T.mono }}>{e.rsf}</td>
                <td style={{ padding: "5px 8px", fontFamily: T.mono, fontWeight: 700, color: lcrColor(e.nsfrVal) }}>{e.nsfrVal}%</td>
                <td style={{ padding: "5px 8px" }}>{pill(e.nsfrVal >= 100 ? "OK" : "BREACH", e.nsfrVal >= 100 ? T.green : T.red)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </>)}
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   TAB 5 — ECL & IFRS 9
════════════════════════════════════════════════════════════════════════════ */
const TabECL = () => {
  const stageDist = [1, 2, 3].map(s => ({
    stage: `Stage ${s}`,
    count: ENTITIES.filter(e => e.stage === s).length,
    ecl12m: +ENTITIES.filter(e => e.stage === s).reduce((a, e) => a + e.ecl12m, 0).toFixed(1),
    eclLife: +ENTITIES.filter(e => e.stage === s).reduce((a, e) => a + e.eclLife, 0).toFixed(1),
  }));
  const provTimeline = Array.from({ length: 8 }, (_, q) => ({
    quarter: `Q${q + 1} 2024`,
    provision: +(totalECL * (0.8 + sr(q * 7) * 0.5)).toFixed(1),
    coverage: +(3.5 + sr(q * 11) * 2).toFixed(1),
  }));
  return (
    <div>
      <KpiGrid items={[
        { label: "Total 12-mo ECL",   value: `$${totalECL}M`,   color: T.red },
        { label: "Stage 3 (Impaired)", value: `${ENTITIES.filter(e => e.stage === 3).length} / 40`, color: T.red },
        { label: "Avg PD",            value: `${(ENTITIES.reduce((s, e) => s + e.pd, 0) / Math.max(1, ENTITIES.length) * 100).toFixed(2)}%`, color: T.amber },
        { label: "Avg LGD",           value: `${(ENTITIES.reduce((s, e) => s + e.lgd, 0) / Math.max(1, ENTITIES.length) * 100).toFixed(1)}%`, color: T.amber },
      ]} />
      <div style={{ background: T.cream, borderRadius: 8, padding: "10px 16px", marginBottom: 20, fontFamily: T.mono, fontSize: 12, color: T.navy, lineHeight: 1.8 }}>
        <strong>ECL</strong> = PD × LGD × EAD × DF &nbsp;(where DF = discount factor)<br />
        <strong>SICR threshold</strong>: z-score ≥ 0.5 → Stage 2; z-score ≥ 2.0 → Stage 3
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {card(<>
          <SH title="ECL Stage Distribution" sub="12-month and lifetime ECL by IFRS 9 stage" />
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={stageDist}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="stage" tick={{ fontSize: 12, fontFamily: T.mono }} />
              <YAxis yAxisId="l" tick={{ fontSize: 10, fontFamily: T.mono }} />
              <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 10, fontFamily: T.mono }} />
              <Tooltip /><Legend />
              <Bar yAxisId="l" dataKey="ecl12m" name="12-mo ECL $M" radius={[4, 4, 0, 0]}>{stageDist.map((_, i) => <Cell key={i} fill={[T.green, T.amber, T.red][i]} />)}</Bar>
              <Bar yAxisId="r" dataKey="eclLife" name="Lifetime ECL $M" fill={T.navy} />
            </BarChart>
          </ResponsiveContainer>
        </>)}
        {card(<>
          <SH title="Provision Timeline — 8 Quarters" sub="Total ECL provision vs coverage ratio" />
          <ResponsiveContainer width="100%" height={230}>
            <ComposedChart data={provTimeline}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="quarter" tick={{ fontSize: 9, fontFamily: T.mono }} />
              <YAxis yAxisId="l" tick={{ fontSize: 10, fontFamily: T.mono }} />
              <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 10, fontFamily: T.mono }} unit="%" />
              <Tooltip /><Legend />
              <Bar yAxisId="l" dataKey="provision" name="Provision $M" fill={T.red} fillOpacity={0.7} />
              <Line yAxisId="r" dataKey="coverage" name="Coverage %" stroke={T.navy} strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </>)}
      </div>
      {card(<>
        <SH title="ECL Register — All 40 Entities" sub="PD · LGD · EAD · ECL (12-mo & Lifetime) · IFRS 9 Stage" />
        <div style={scrollTable}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <TH cols={["Entity", "Sector", "PD", "LGD", "EAD $M", "ECL 12m", "ECL Life", "z-Score", "Stage"]} />
            <tbody>{[...ENTITIES].sort((a, b) => b.eclLife - a.eclLife).map((e, i) => (
              <tr key={e.id} style={{ background: i % 2 === 0 ? "#fff" : T.cream }}>
                <td style={{ padding: "5px 8px", fontFamily: T.mono, fontSize: 11, fontWeight: 700, color: T.navy }}>{e.name}</td>
                <td style={{ padding: "5px 8px", fontSize: 11, color: T.slate }}>{e.sector.split(" ")[0]}</td>
                <td style={{ padding: "5px 8px", fontFamily: T.mono, color: e.pd > 0.05 ? T.red : T.amber }}>{(e.pd * 100).toFixed(2)}%</td>
                <td style={{ padding: "5px 8px", fontFamily: T.mono }}>{(e.lgd * 100).toFixed(1)}%</td>
                <td style={{ padding: "5px 8px", fontFamily: T.mono }}>{e.ead.toFixed(0)}</td>
                <td style={{ padding: "5px 8px", fontFamily: T.mono, color: T.amber }}>${e.ecl12m}M</td>
                <td style={{ padding: "5px 8px", fontFamily: T.mono, color: T.red, fontWeight: 700 }}>${e.eclLife}M</td>
                <td style={{ padding: "5px 8px", fontFamily: T.mono }}>{e.zScore.toFixed(3)}</td>
                <td style={{ padding: "5px 8px" }}>{pill(`S${e.stage}`, stageColor(e.stage))}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </>)}
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   TAB 6 — NGFS Scenario Stress
════════════════════════════════════════════════════════════════════════════ */
const TabNGFS = () => {
  const [selSc, setSelSc] = useState(0);
  const sc = NGFS_DATA[selSc];
  const heatmapData = NGFS_DATA.map(s => ({
    scenario: s.scenario.split(" ").slice(0, 2).join(" "),
    varDelta: +(s.varDelta * 100).toFixed(3),
    waccDelta: +(s.waccDelta * 100).toFixed(2),
    eclDelta: s.eclDelta,
  }));
  const stressedTop = [...ENTITIES].sort((a, b) => {
    const aS = +(a.var95 * (1.1 + sr(selSc * 100 + a.id) * 0.5)).toFixed(5);
    const bS = +(b.var95 * (1.1 + sr(selSc * 100 + b.id) * 0.5)).toFixed(5);
    return bS - aS;
  }).slice(0, 8);
  return (
    <div>
      <KpiGrid items={[
        { label: "Scenarios",      value: 6,              color: T.navy },
        { label: "Max VaR Δ",      value: `${(Math.max(...NGFS_DATA.map(d => d.varDelta)) * 100).toFixed(2)}%`, color: T.red },
        { label: "Max WACC Δ",     value: `${(Math.max(...NGFS_DATA.map(d => d.waccDelta)) * 100).toFixed(2)}%`, color: '#7c3aed' },
        { label: "Max ECL Δ",      value: `$${Math.max(...NGFS_DATA.map(d => d.eclDelta))}M`, color: T.amber },
      ]} />
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 12, color: T.slate, fontFamily: T.mono, marginRight: 10 }}>NGFS Scenario:</label>
        {NGFS_SC.map((s, i) => (
          <button key={i} onClick={() => setSelSc(i)} style={{ marginRight: 8, marginBottom: 8, padding: "5px 12px", background: selSc === i ? T.navy : "#fff", color: selSc === i ? "#fff" : T.slate, border: `1px solid ${T.gold}`, borderRadius: 4, fontSize: 11, fontFamily: T.mono, cursor: "pointer" }}>
            {s.split(" ").slice(0, 2).join(" ")}
          </button>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {card(<>
          <SH title="Scenario Stress Impact — All 6 NGFS" sub="VaR Δ · WACC Δ · ECL Δ" />
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={heatmapData} margin={{ bottom: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="scenario" tick={{ fontSize: 9, fontFamily: T.mono }} angle={-20} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} />
              <Tooltip /><Legend />
              <Bar dataKey="varDelta"  name="VaR Δ %" fill={T.red}    />
              <Bar dataKey="waccDelta" name="WACC Δ %" fill={'#7c3aed'} />
            </BarChart>
          </ResponsiveContainer>
        </>)}
        {card(<>
          <SH title={`Stressed Entities — ${sc.scenario}`} sub="Top 8 by stressed VaR" />
          {stressedTop.map((e, i) => {
            const stressed = +(e.var95 * (1.1 + sr(selSc * 100 + e.id) * 0.5)).toFixed(5);
            return (
              <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ fontFamily: T.mono, fontSize: 11, color: T.navy }}>{i + 1}. {e.name}</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <span style={{ fontFamily: T.mono, fontSize: 11, color: T.slate }}>{(e.var95 * 100).toFixed(3)}%</span>
                  <span style={{ fontFamily: T.mono, fontSize: 11, color: T.red, fontWeight: 700 }}>→ {(stressed * 100).toFixed(3)}%</span>
                </div>
              </div>
            );
          })}
        </>)}
      </div>
      {card(<>
        <SH title="ECL Stress by Scenario" sub="Additional ECL ($M) under each NGFS pathway" />
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={heatmapData} margin={{ bottom: 24 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="scenario" tick={{ fontSize: 9, fontFamily: T.mono }} angle={-20} textAnchor="end" interval={0} />
            <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} />
            <Tooltip formatter={v => [`$${v}M`, "ECL Δ"]} />
            <Bar dataKey="eclDelta" name="ECL Δ $M" radius={[4, 4, 0, 0]}>
              {heatmapData.map((_, i) => <Cell key={i} fill={[T.green, T.amber, T.amber, T.red, T.teal, '#2563eb'][i]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </>)}
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   TAB 7 — Credit Risk Concentration
════════════════════════════════════════════════════════════════════════════ */
const TabConcentration = () => {
  const regionExp = REGIONS.map(r => {
    const re = ENTITIES.filter(e => e.region === r);
    return { region: r.split(" ")[0], exp: +re.reduce((a, e) => a + e.ead, 0).toFixed(1), count: re.length };
  }).filter(d => d.count > 0);
  const ratingExp = RATINGS.map(rt => {
    const re = ENTITIES.filter(e => e.rating === rt);
    return { rating: rt, exp: +re.reduce((a, e) => a + e.ead, 0).toFixed(1), count: re.length };
  }).filter(d => d.count > 0);
  const top5 = [...ENTITIES].sort((a, b) => b.ead - a.ead).slice(0, 5);
  const hhiReg = +(regionExp.reduce((s, d) => s + (d.exp / Math.max(0.0001, totalExp)) ** 2, 0)).toFixed(4);
  return (
    <div>
      <KpiGrid items={[
        { label: "HHI (Sector)",   value: hhiSector.toFixed(4),  color: '#2563eb',   sub: "1/HHI = effective N" },
        { label: "HHI (Region)",   value: hhiReg.toFixed(4),     color: T.teal },
        { label: "Top-1 Sector %", value: `${(Math.max(...sectorExp.map(d => d.exp)) / Math.max(0.0001, totalExp) * 100).toFixed(1)}%`, color: T.amber },
        { label: "Top-5 Name Conc.", value: `${(top5.reduce((a, e) => a + e.ead, 0) / Math.max(0.0001, totalExp) * 100).toFixed(1)}%`, color: T.red },
      ]} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {card(<>
          <SH title="Exposure by Sector" sub="EAD ($M) — HHI concentration measure" />
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={sectorExp} margin={{ bottom: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="sector" tick={{ fontSize: 9, fontFamily: T.mono }} angle={-30} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} unit="M" />
              <Tooltip formatter={v => [`$${v}M`, "Exposure"]} />
              <Bar dataKey="exp" name="EAD $M" radius={[4, 4, 0, 0]}>
                {sectorExp.map((_, i) => <Cell key={i} fill={i % 2 === 0 ? T.navy : '#2563eb'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </>)}
        {card(<>
          <SH title="Exposure by Rating" sub="Credit quality distribution" />
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={ratingExp}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="rating" tick={{ fontSize: 11, fontFamily: T.mono }} />
              <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} unit="M" />
              <Tooltip formatter={v => [`$${v}M`, "Exposure"]} />
              <Bar dataKey="exp" name="EAD $M" radius={[4, 4, 0, 0]}>
                {ratingExp.map((_, i) => <Cell key={i} fill={["#059669","#10b981","#34d399","#fbbf24","#f97316","#ef4444","#7c3aed"][i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </>)}
      </div>
      {card(<>
        <SH title="Top 5 Single-Name Concentrations" sub="Largest individual exposures (EAD)" />
        {top5.map((e, i) => (
          <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
            <div>
              <span style={{ fontFamily: T.mono, fontSize: 12, color: T.navy, fontWeight: 700 }}>{i + 1}. {e.name}</span>
              <span style={{ fontSize: 11, color: T.slate, marginLeft: 10 }}>{e.sector} · {e.rating} · {e.region}</span>
            </div>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <span style={{ fontFamily: T.mono, fontSize: 12, color: T.navy }}>${e.ead.toFixed(0)}M</span>
              <span style={{ fontFamily: T.mono, fontSize: 11, color: T.amber }}>{(e.ead / Math.max(0.0001, totalExp) * 100).toFixed(1)}% of total</span>
            </div>
          </div>
        ))}
      </>)}
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   TAB 8 — Interest Rate Risk
════════════════════════════════════════════════════════════════════════════ */
const TabIRRisk = () => {
  const avgDur   = +(ENTITIES.reduce((s, e) => s + e.modDur, 0) / Math.max(1, ENTITIES.length)).toFixed(4);
  const avgDv01  = +(ENTITIES.reduce((s, e) => s + e.dv01Val, 0) / Math.max(1, ENTITIES.length)).toFixed(4);
  const totalDv01= +(ENTITIES.reduce((s, e) => s + e.dv01Val * e.ead, 0) / Math.max(1, ENTITIES.length)).toFixed(2);
  return (
    <div>
      <KpiGrid items={[
        { label: "Avg Macaulay Duration", value: `${avgDur}y`,       color: T.navy },
        { label: "Avg DV01",             value: `$${avgDv01}`,        color: '#2563eb' },
        { label: "Portfolio BPV01",      value: `$${totalDv01}M`,    color: '#7c3aed' },
        { label: "+100bps P&L Impact",   value: `${RATE_SHOCKS.find(d => d.bps === 100)?.pnl.toFixed(2)}%`, color: T.red },
      ]} />
      <div style={{ background: T.cream, borderRadius: 8, padding: "10px 16px", marginBottom: 20, fontFamily: T.mono, fontSize: 12, color: T.navy, lineHeight: 1.8 }}>
        <strong>Macaulay Duration</strong> = Σ t × PV(CF_t) / Price &nbsp;|&nbsp; <strong>Modified Duration</strong> = Macaulay / (1 + y)<br />
        <strong>DV01</strong> = Modified Duration × Price / 10,000 &nbsp;|&nbsp; <strong>BPV01</strong> = Portfolio DV01 × EAD
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {card(<>
          <SH title="Rate Shock P&L Impact" sub="±25/50/100/200 bps parallel shift" />
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={RATE_SHOCKS}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fontFamily: T.mono }} />
              <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} tickFormatter={v => `${v}%`} />
              <Tooltip formatter={v => [`${v}%`, "P&L Impact"]} />
              <Bar dataKey="pnl" name="P&L %" radius={[4, 4, 0, 0]}>
                {RATE_SHOCKS.map((d, i) => <Cell key={i} fill={d.pnl < 0 ? T.red : T.green} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </>)}
        {card(<>
          <SH title="Duration Distribution — 40 Entities" sub="Macaulay duration histogram" />
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={Array.from({ length: 10 }, (_, i) => {
              const low = 2 + i * 0.8, high = low + 0.8;
              return { range: `${low.toFixed(1)}-${high.toFixed(1)}y`, count: ENTITIES.filter(e => e.modDur >= low && e.modDur < high).length };
            })}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="range" tick={{ fontSize: 9, fontFamily: T.mono }} />
              <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} />
              <Tooltip />
              <Bar dataKey="count" name="Entities" fill={T.navy} />
            </BarChart>
          </ResponsiveContainer>
        </>)}
      </div>
      {card(<>
        <SH title="IR Sensitivity Register — All 40 Entities" />
        <div style={scrollTable}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <TH cols={["Entity", "Sector", "Coupon", "Mod Duration", "DV01", "+100bps P&L", "-100bps P&L"]} />
            <tbody>{[...ENTITIES].sort((a, b) => b.modDur - a.modDur).map((e, i) => (
              <tr key={e.id} style={{ background: i % 2 === 0 ? "#fff" : T.cream }}>
                <td style={{ padding: "5px 8px", fontFamily: T.mono, fontSize: 11, fontWeight: 700, color: T.navy }}>{e.name}</td>
                <td style={{ padding: "5px 8px", fontSize: 11, color: T.slate }}>{e.sector.split(" ")[0]}</td>
                <td style={{ padding: "5px 8px", fontFamily: T.mono }}>{(e.coupon * 100).toFixed(2)}%</td>
                <td style={{ padding: "5px 8px", fontFamily: T.mono, color: '#2563eb' }}>{e.modDur.toFixed(3)}y</td>
                <td style={{ padding: "5px 8px", fontFamily: T.mono }}>${e.dv01Val.toFixed(4)}</td>
                <td style={{ padding: "5px 8px", fontFamily: T.mono, color: T.red }}>{(-e.modDur * 0.01 * 100).toFixed(2)}%</td>
                <td style={{ padding: "5px 8px", fontFamily: T.mono, color: T.green }}>{(e.modDur * 0.01 * 100).toFixed(2)}%</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </>)}
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   TAB 9 — Operational & Model Risk
════════════════════════════════════════════════════════════════════════════ */
const TabOperational = () => {
  const totalOprCap  = +(ENTITIES.reduce((s, e) => s + e.oprCap, 0)).toFixed(1);
  const avgModelRisk = +(5 + sr(99) * 15).toFixed(1);
  const cyberExp     = +(20 + sr(101) * 80).toFixed(1);
  const complianceCost= +(10 + sr(103) * 30).toFixed(1);
  const oprData = SECTORS.map(s => {
    const sc = ENTITIES.filter(e => e.sector === s);
    return {
      sector: s.split(" ")[0],
      oprCap: sc.length ? +(sc.reduce((a, e) => a + e.oprCap, 0) / sc.length).toFixed(1) : 0,
      modelRisk: +(3 + sr(hashStr(s)) * 12).toFixed(1),
    };
  }).filter(d => d.oprCap > 0);
  return (
    <div>
      <KpiGrid items={[
        { label: "Total OpRisk Capital (BIA)", value: `$${totalOprCap}M`, color: T.navy, sub: "15% avg gross income" },
        { label: "Avg Model Risk Reserve",     value: `$${avgModelRisk}M`, color: '#7c3aed' },
        { label: "Cyber Risk Exposure",        value: `$${cyberExp}M`,    color: T.red },
        { label: "Compliance Cost Est.",       value: `$${complianceCost}M`, color: T.amber },
      ]} />
      <div style={{ background: T.cream, borderRadius: 8, padding: "10px 16px", marginBottom: 20, fontFamily: T.mono, fontSize: 12, color: T.navy, lineHeight: 1.8 }}>
        <strong>BIA (Basic Indicator Approach)</strong>: OpRisk Capital = 15% × Avg 3-year Gross Income (Basel III)<br />
        <strong>Model Risk Reserve</strong>: % of model-driven revenue flagged for reserve under SR 11-7
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {card(<>
          <SH title="OpRisk Capital by Sector (BIA)" sub="15% of average annual gross income" />
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={oprData} margin={{ bottom: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="sector" tick={{ fontSize: 9, fontFamily: T.mono }} angle={-30} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} unit="M" />
              <Tooltip formatter={v => [`$${v}M`, "OpRisk Cap"]} /><Legend />
              <Bar dataKey="oprCap"    name="OpRisk Capital" fill={T.navy} />
              <Bar dataKey="modelRisk" name="Model Risk Res" fill={'#7c3aed'} />
            </BarChart>
          </ResponsiveContainer>
        </>)}
        {card(<>
          <SH title="Operational Risk Breakdown" sub="Capital allocation across risk categories" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 8 }}>
            {[
              { cat: "Process Failure", pct: 35, color: T.red },
              { cat: "Systems / IT",    pct: 25, color: T.amber },
              { cat: "People / Fraud",  pct: 20, color: '#7c3aed' },
              { cat: "External Events", pct: 12, color: '#2563eb' },
              { cat: "Legal / Compliance", pct: 8, color: T.teal },
            ].map((c, i) => (
              <div key={i} style={{ background: T.cream, borderRadius: 6, padding: "10px 14px", borderLeft: `3px solid ${c.color}` }}>
                <div style={{ fontSize: 11, color: T.slate, marginBottom: 4 }}>{c.cat}</div>
                <div style={{ fontFamily: T.mono, fontSize: 18, fontWeight: 700, color: c.color }}>{c.pct}%</div>
                <div style={{ fontFamily: T.mono, fontSize: 11, color: T.slate }}>${(totalOprCap * c.pct / 100).toFixed(1)}M</div>
              </div>
            ))}
          </div>
        </>)}
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   TAB 10 — Risk Limits Dashboard
════════════════════════════════════════════════════════════════════════════ */
const RISK_LIMITS = [
  { name: "Portfolio VaR 95% (1-day)",     current: +(portVaR95 * 100).toFixed(3), limit: 3.0,   unit: "%" },
  { name: "Portfolio CVaR 95%",            current: +(portCVaR * 100).toFixed(3),  limit: 4.5,   unit: "%" },
  { name: "Single-Name Concentration",     current: +(Math.max(...ENTITIES.map(e => e.ead)) / Math.max(0.0001, totalExp) * 100).toFixed(1), limit: 10, unit: "%" },
  { name: "Sector Concentration (HHI)",    current: +(hhiSector * 100).toFixed(2), limit: 25,    unit: "" },
  { name: "Avg LCR",                       current: +portLCR,                       limit: 100,   unit: "%" },
  { name: "Avg NSFR",                      current: +portNSFR,                      limit: 100,   unit: "%" },
  { name: "Portfolio WACC",                current: +(portWACC * 100).toFixed(2),   limit: 12.0,  unit: "%" },
  { name: "Total 12-mo ECL",               current: +totalECL,                      limit: 800,   unit: "$M" },
  { name: "IFRS 9 Stage 3 Ratio",          current: +stg3Pct,                       limit: 15,    unit: "%" },
  { name: "OpRisk Capital / Rev",          current: +(12 + sr(201) * 8).toFixed(1), limit: 25,   unit: "%" },
  { name: "Model Risk Reserve",            current: +(5 + sr(203) * 10).toFixed(1), limit: 20,   unit: "$M" },
  { name: "Avg Modified Duration",         current: +(ENTITIES.reduce((s, e) => s + e.modDur, 0) / Math.max(1, ENTITIES.length)).toFixed(2), limit: 9, unit: "y" },
  { name: "DV01 Total Exposure",           current: +(ENTITIES.reduce((s, e) => s + e.dv01Val * e.ead, 0) / Math.max(1, ENTITIES.length)).toFixed(2), limit: 500, unit: "$M" },
  { name: "Cyber Risk Exposure",           current: +(20 + sr(205) * 80).toFixed(1), limit: 150, unit: "$M" },
  { name: "NGFS Stressed VaR (Delayed)",   current: +(portVaR95 * 100 * 1.4).toFixed(3), limit: 6.0, unit: "%" },
];

const TabLimits = () => {
  const limitsWithStatus = RISK_LIMITS.map(l => {
    const util = l.unit === "%" && l.limit < 100
      ? (l.current / Math.max(0.0001, l.limit) * 100)
      : l.limit > 0 ? (l.current / Math.max(0.0001, l.limit) * 100) : 0;
    const status = util >= 100 ? "BREACH" : util >= 80 ? "WARNING" : "OK";
    return { ...l, util: +util.toFixed(1), status };
  });
  const breaches  = limitsWithStatus.filter(l => l.status === "BREACH").length;
  const warnings  = limitsWithStatus.filter(l => l.status === "WARNING").length;
  const statusColor = s => s === "BREACH" ? T.red : s === "WARNING" ? T.amber : T.green;
  return (
    <div>
      <KpiGrid items={[
        { label: "Total Limits",    value: 15,       color: T.navy },
        { label: "Breaches",        value: breaches,  color: breaches > 0 ? T.red : T.green },
        { label: "Warnings",        value: warnings,  color: warnings > 0 ? T.amber : T.green },
        { label: "OK",              value: 15 - breaches - warnings, color: T.green },
      ]} />
      {card(<>
        <SH title="Risk Limit Utilization Dashboard" sub="15 limits — Breach ≥100% · Warning ≥80% · OK <80%" />
        <div style={{ display: "grid", gap: 10 }}>
          {limitsWithStatus.map((l, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
              <div style={{ flex: 2, fontSize: 12, color: T.navy, fontWeight: 600 }}>{l.name}</div>
              <div style={{ flex: 1, fontFamily: T.mono, fontSize: 12, color: T.slate, textAlign: "right" }}>
                {l.current}{l.unit} / {l.limit}{l.unit}
              </div>
              <div style={{ flex: 2, background: "#f1f5f9", borderRadius: 4, height: 8, position: "relative", overflow: "hidden" }}>
                <div style={{ width: `${Math.min(100, l.util)}%`, height: "100%", background: statusColor(l.status), borderRadius: 4 }} />
              </div>
              <div style={{ flex: 1, fontFamily: T.mono, fontSize: 11, color: T.slate, textAlign: "right" }}>{l.util}%</div>
              <div style={{ flex: 1 }}>{pill(l.status, statusColor(l.status))}</div>
            </div>
          ))}
        </div>
      </>)}
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   PAGE SHELL
════════════════════════════════════════════════════════════════════════════ */
const TABS = [
  { key: "overview",    label: "Overview" },
  { key: "market",      label: "Market Risk" },
  { key: "wacc",        label: "WACC Engine" },
  { key: "liquidity",   label: "Liquidity" },
  { key: "ecl",         label: "ECL & IFRS 9" },
  { key: "ngfs",        label: "NGFS Stress" },
  { key: "concentration", label: "Concentration" },
  { key: "irr",         label: "Interest Rate" },
  { key: "operational", label: "Operational" },
  { key: "limits",      label: "Risk Limits" },
];

export default function DmeFinancialRiskPage() {
  const [tab, setTab] = useState("overview");
  return (
    <div style={{ fontFamily: T.font, background: T.cream, minHeight: "100vh", padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.navy }}>DME Financial Risk Analytics</h1>
          {pill("EP-BE1", T.navy)}{pill("DME", '#7c3aed')}{pill("IFRS 9", T.teal)}{pill("Basel III", '#2563eb')}
        </div>
        <div style={{ fontSize: 13, color: T.slate }}>
          VaR (Historical 252d) · CVaR · WACC Ke/Kd · LCR · NSFR · ECL (PD×LGD×EAD×DF) · IFRS 9 Staging · NGFS Stress · Duration/DV01 · OpRisk BIA · 40 entities
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 0, marginBottom: 24, borderBottom: `2px solid ${T.gold}`, flexWrap: "wrap" }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: "8px 16px", background: tab === t.key ? T.navy : "transparent",
            color: tab === t.key ? "#fff" : T.slate, border: "none", cursor: "pointer",
            fontSize: 12, fontFamily: T.font, fontWeight: tab === t.key ? 700 : 400,
            borderBottom: tab === t.key ? `2px solid ${T.gold}` : "none",
            marginBottom: tab === t.key ? -2 : 0, transition: "all 0.15s", whiteSpace: "nowrap",
          }}>{t.label}</button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "overview"       && <TabOverview />}
      {tab === "market"         && <TabMarketRisk />}
      {tab === "wacc"           && <TabWACC />}
      {tab === "liquidity"      && <TabLiquidity />}
      {tab === "ecl"            && <TabECL />}
      {tab === "ngfs"           && <TabNGFS />}
      {tab === "concentration"  && <TabConcentration />}
      {tab === "irr"            && <TabIRRisk />}
      {tab === "operational"    && <TabOperational />}
      {tab === "limits"         && <TabLimits />}
    </div>
  );
}
