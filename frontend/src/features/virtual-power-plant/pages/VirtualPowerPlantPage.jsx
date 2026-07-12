import React, { useState, useMemo } from "react";
import EnergyAdvancedAnalytics from '../../_shared/EnergyAdvancedAnalytics';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, ScatterChart, Scatter,
  ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine } from "recharts";

const T = {
  bg: "#0f1117", surface: "#1a1d27", surfaceH: "#22263a", border: "#2a2f45", borderL: "#353a52",
  navy: "#1e3a5f", navyL: "#2a4a6f", gold: "#d4a843", goldL: "#e0b85a",
  sage: "#2d6a4f", sageL: "#3d8a6a", teal: "#0d4f5c", text: "#e8e0d0",
  textSec: "#a89880", textMut: "#6b6050", red: "#c0392b", green: "#27ae60",
  amber: "#e67e22", font: "'DM Sans', sans-serif", mono: "'JetBrains Mono', monospace",
};

const sr = s => { const x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const ASSETS = [
  { id: "BESS-1", type: "BESS", name: "Minety BESS (50MW/100MWh)", cap_mw: 50, e_mwh: 100, rte: 0.92, flex_up: 50, flex_down: 50, resp_ms: 200, market: ["FCR","aFRR","Arbitrage"], region: "UK" },
  { id: "BESS-2", type: "BESS", name: "Pillswood 196MW/392MWh", cap_mw: 196, e_mwh: 392, rte: 0.91, flex_up: 196, flex_down: 196, resp_ms: 150, market: ["FCR","aFRR","mFRR","Arbitrage"], region: "UK" },
  { id: "EV-1", type: "EV Fleet", name: "TfL Bus V2G Fleet (500 buses)", cap_mw: 50, e_mwh: 250, rte: 0.88, flex_up: 30, flex_down: 50, resp_ms: 500, market: ["DSR","Arbitrage"], region: "UK" },
  { id: "DR-1", type: "Demand Response", name: "Industrial DR Portfolio (20 sites)", cap_mw: 40, e_mwh: 0, rte: 1.0, flex_up: 0, flex_down: 40, resp_ms: 300000, market: ["mFRR","DSR"], region: "UK" },
  { id: "SOLAR-1", type: "Solar + BESS", name: "Sunnica Solar Farm + 20MW BESS", cap_mw: 20, e_mwh: 40, rte: 0.92, flex_up: 20, flex_down: 20, resp_ms: 200, market: ["FCR","aFRR","Arbitrage"], region: "UK" },
  { id: "WIND-1", type: "Wind + BESS", name: "Hornsea 3 Curtailment + BESS", cap_mw: 80, e_mwh: 160, rte: 0.91, flex_up: 80, flex_down: 60, resp_ms: 200, market: ["mFRR","Arbitrage","CfD"], region: "UK" },
];

const MARKETS = {
  FCR:   { name: "Frequency Containment Reserve", price_mw_month: 12000, resp_sec: 30, holding_min: 30, tender: "Daily", regulator: "ENTSO-E" },
  aFRR:  { name: "Automatic Frequency Restoration", price_mw_month: 8000, resp_sec: 300, holding_min: 15, tender: "Daily", regulator: "ENTSO-E" },
  mFRR:  { name: "Manual Frequency Restoration", price_mw_month: 4000, resp_sec: 900, holding_min: 60, tender: "Weekly", regulator: "ENTSO-E" },
  DSR:   { name: "Demand Side Response", price_mw_month: 3500, resp_sec: 120, holding_min: 30, tender: "Monthly", regulator: "National Grid ESO" },
  Arbitrage: { name: "Energy Arbitrage (Day-Ahead)", price_mw_month: 0, resp_sec: 3600, holding_min: 240, tender: "Daily DA", regulator: "EPEX/N2EX" },
  CfD:   { name: "Contracts for Difference (Balancing)", price_mw_month: 2000, resp_sec: 60, holding_min: 30, tender: "Annual", regulator: "LCCC" },
};

const DISPATCH_HOURS = Array.from({ length: 24 }, (_, h) => {
  const isMorn = h >= 6 && h <= 9;
  const isEve  = h >= 17 && h <= 21;
  const isPeak = isMorn || isEve;
  return {
    hour: `${String(h).padStart(2, "0")}:00`,
    price: isPeak ? 80 + sr(h * 7) * 60 : 20 + sr(h * 11) * 30,
    bess_dispatch: isPeak ? -(30 + sr(h * 3) * 20) : (h >= 1 && h <= 5 ? 30 + sr(h * 9) * 15 : 0),
    demand: 250 + sr(h * 13) * 120 + (isPeak ? 150 : 0),
    renewable: 50 + (h >= 8 && h <= 18 ? sr(h * 17) * 120 : sr(h * 5) * 30),
    soc: 50 + sr(h * 19) * 40,
  };
});

const TABS = [
  "VPP Overview", "Asset Portfolio", "Dispatch Optimisation", "Revenue Stack",
  "Frequency Response", "Market Stacking", "Aggregator Economics", "DSO Flexibility",
  "Battery SoC Management", "Regulatory Framework"
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

function calcDispatchRevenue({ assets, fcrPct, afrrPct, arbitragePct, mfrrPct }) {
  let total = 0;
  for (const a of assets) {
    const mw = a.cap_mw;
    const fcr   = a.market.includes("FCR")   ? (MARKETS.FCR.price_mw_month   * mw * fcrPct   / 100) * 12 : 0;
    const afrr  = a.market.includes("aFRR")  ? (MARKETS.aFRR.price_mw_month  * mw * afrrPct  / 100) * 12 : 0;
    const mfrr  = a.market.includes("mFRR")  ? (MARKETS.mFRR.price_mw_month  * mw * mfrrPct  / 100) * 12 : 0;
    const arb   = a.market.includes("Arbitrage") ? mw * arbitragePct * 180 * 12 : 0;
    total += fcr + afrr + mfrr + arb;
  }
  return total;
}

export default function VirtualPowerPlantPage() {
  const [tab, setTab] = useState(0);
  const [fcrPct, setFcrPct]       = useState(60);
  const [afrrPct, setAfrrPct]     = useState(40);
  const [mfrrPct, setMfrrPct]     = useState(30);
  const [arbPct, setArbPct]       = useState(70);
  const [margRate, setMargRate]   = useState(15);
  const [selectedAsset, setSelectedAsset] = useState("BESS-1");

  const totalCapMw   = ASSETS.reduce((s, a) => s + a.cap_mw, 0);
  const totalEMwh    = ASSETS.reduce((s, a) => s + a.e_mwh, 0);
  const totalFlexUp  = ASSETS.reduce((s, a) => s + a.flex_up, 0);
  const totalFlexDn  = ASSETS.reduce((s, a) => s + a.flex_down, 0);

  const annualRevenue = useMemo(() => calcDispatchRevenue({ assets: ASSETS, fcrPct, afrrPct, arbitragePct: arbPct, mfrrPct }), [fcrPct, afrrPct, arbPct, mfrrPct]);

  const revenueByAsset = useMemo(() => ASSETS.map(a => {
    const mw = a.cap_mw;
    const fcr   = a.market.includes("FCR")   ? MARKETS.FCR.price_mw_month   * mw * fcrPct   / 100 * 12 : 0;
    const afrr  = a.market.includes("aFRR")  ? MARKETS.aFRR.price_mw_month  * mw * afrrPct  / 100 * 12 : 0;
    const mfrr  = a.market.includes("mFRR")  ? MARKETS.mFRR.price_mw_month  * mw * mfrrPct  / 100 * 12 : 0;
    const arb   = a.market.includes("Arbitrage") ? mw * arbPct * 180 * 12 : 0;
    return { name: a.id, FCR: +(fcr / 1e6).toFixed(2), aFRR: +(afrr / 1e6).toFixed(2), mFRR: +(mfrr / 1e6).toFixed(2), Arbitrage: +(arb / 1e6).toFixed(2) };
  }), [fcrPct, afrrPct, arbPct, mfrrPct]);

  const freqRespData = useMemo(() => Array.from({ length: 60 }, (_, i) => {
    const t = i * 0.5;
    const disturbance = t > 5 && t < 10 ? -0.35 * (1 - Math.exp(-(t - 5) * 0.8)) : t >= 10 ? -0.12 + sr(i * 7) * 0.04 - 0.04 : 0;
    const bess = t > 5 ? -disturbance * 0.8 : 0;
    return { t: t.toFixed(1), freq: +(50 + disturbance).toFixed(3), bess_mw: +(bess * 50).toFixed(1) };
  }), []);

  const marginalCostCurve = useMemo(() => [
    { cap_mw: 0, price: 0 }, { cap_mw: 40, price: 5 }, { cap_mw: 80, price: 12 },
    { cap_mw: 120, price: 18 }, { cap_mw: 160, price: 28 }, { cap_mw: 220, price: 42 },
    { cap_mw: 280, price: 65 }, { cap_mw: 320, price: margRate }, { cap_mw: 380, price: margRate + 20 },
  ], [margRate]);

  const C = { gold: "#d4a843", teal: "#0d9488", green: "#27ae60", red: "#c0392b", amber: "#e67e22", purple: "#7c3aed" };

  return (
    <div style={{ background: T.bg, minHeight: "100vh", fontFamily: T.font, color: T.text, padding: "24px 32px" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
          EP-DT3 · Virtual Power Plant & Aggregated Dispatch Analytics
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>Virtual Power Plant & Aggregated Dispatch Analytics</h1>
        <p style={{ color: T.textSec, marginTop: 6, fontSize: 14 }}>
          Multi-asset aggregation · Frequency response · Revenue stacking · DSO flexibility · Optimal dispatch
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        <KpiCard label="Total Capacity" value={totalCapMw} unit="MW" sub={`${ASSETS.length} assets in VPP`} />
        <KpiCard label="Total Storage" value={totalEMwh} unit="MWh" sub="Combined energy capacity" color={C.teal} />
        <KpiCard label="Flex Up (supply)" value={totalFlexUp} unit="MW" sub="FCR + aFRR eligible" color={C.green} />
        <KpiCard label="Est. Annual Revenue" value={`£${(annualRevenue / 1e6).toFixed(1)}M`} unit="" sub="Current market allocation" color={C.gold} />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{
            padding: "7px 14px", borderRadius: 6, border: `1px solid ${tab === i ? T.gold : T.border}`,
            background: tab === i ? T.navyL : T.surface, color: tab === i ? T.gold : T.textSec,
            cursor: "pointer", fontSize: 12,
          }}>{t}</button>
        ))}
      </div>

      {tab === 0 && (
        <div>
          <h3 style={{ color: T.gold, marginBottom: 16 }}>VPP Architecture & Real-Time Dispatch Signal</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>24-Hour Dispatch Profile — Price vs BESS Dispatch</div>
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={DISPATCH_HOURS}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="hour" stroke={T.textMut} tick={{ fontSize: 9 }} interval={3} />
                  <YAxis yAxisId="price" stroke={T.textMut} />
                  <YAxis yAxisId="dispatch" orientation="right" stroke={T.textMut} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  <Legend />
                  <Area yAxisId="price" dataKey="price" name="Price (£/MWh)" fill={C.gold} fillOpacity={0.15} stroke={C.gold} />
                  <Bar yAxisId="dispatch" dataKey="bess_dispatch" name="BESS Dispatch (MW)" fill={C.teal} opacity={0.8} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>System Balance — Demand vs Renewable + Dispatch</div>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={DISPATCH_HOURS}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="hour" stroke={T.textMut} tick={{ fontSize: 9 }} interval={3} />
                  <YAxis stroke={T.textMut} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  <Legend />
                  <Area dataKey="demand" name="Demand (MW)" fill={C.red} fillOpacity={0.2} stroke={C.red} />
                  <Area dataKey="renewable" name="Renewable (MW)" fill={C.green} fillOpacity={0.3} stroke={C.green} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div>
          <h3 style={{ color: T.gold, marginBottom: 16 }}>VPP Asset Portfolio</h3>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {["Asset", "Type", "Capacity", "Energy (MWh)", "RTE", "Flex ↑/↓ (MW)", "Response", "Markets"].map(h => (
                    <th key={h} style={{ padding: "8px 12px", color: T.textMut, textAlign: "left" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ASSETS.map((a, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.surfaceH : "transparent" }}>
                    <td style={{ padding: "8px 12px", color: T.gold, fontWeight: 600 }}>{a.id}</td>
                    <td style={{ padding: "8px 12px", color: T.textSec }}>{a.type}</td>
                    <td style={{ padding: "8px 12px", fontFamily: T.mono }}>{a.cap_mw} MW</td>
                    <td style={{ padding: "8px 12px", fontFamily: T.mono }}>{a.e_mwh || "—"}</td>
                    <td style={{ padding: "8px 12px", fontFamily: T.mono }}>{(a.rte * 100).toFixed(0)}%</td>
                    <td style={{ padding: "8px 12px", fontFamily: T.mono, color: C.green }}>+{a.flex_up}/−{a.flex_down}</td>
                    <td style={{ padding: "8px 12px", fontFamily: T.mono }}>{a.resp_ms < 1000 ? `${a.resp_ms}ms` : `${(a.resp_ms / 60000).toFixed(0)}min`}</td>
                    <td style={{ padding: "8px 12px" }}>{a.market.map(m => <span key={m} style={{ background: T.navy, color: T.text, padding: "1px 6px", borderRadius: 3, fontSize: 10, marginRight: 4 }}>{m}</span>)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 2 && (
        <div>
          <h3 style={{ color: T.gold, marginBottom: 16 }}>Optimal Dispatch — Merit Order & Marginal Cost</h3>
          <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <Slider label="Marginal Rate (£/MWh)" value={margRate} min={5} max={80} step={5} onChange={setMargRate} unit="" />
              <div style={{ padding: 12, background: T.surfaceH, borderRadius: 6, marginTop: 8 }}>
                <div style={{ fontSize: 11, color: T.textMut }}>Dispatch Volume at Price</div>
                <div style={{ fontSize: 22, color: T.gold, fontFamily: T.mono, marginTop: 4 }}>{Math.min(380, 50 + margRate * 4)} MW</div>
                <div style={{ fontSize: 10, color: T.textSec, marginTop: 2 }}>from VPP stack</div>
              </div>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Marginal Cost Curve (Supply Curve)</div>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={marginalCostCurve}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="cap_mw" stroke={T.textMut} label={{ value: "Cumulative MW", position: "insideBottom", offset: -5, fill: T.textMut, fontSize: 10 }} />
                  <YAxis stroke={T.textMut} label={{ value: "Price £/MWh", angle: -90, position: "insideLeft", fill: T.textMut, fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  <ReferenceLine y={margRate} stroke={C.gold} strokeDasharray="4 4" label={{ value: "Market Price", fill: C.gold, fontSize: 10 }} />
                  <Area dataKey="price" name="Marginal Cost (£/MWh)" fill={C.teal} fillOpacity={0.3} stroke={C.teal} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 3 && (
        <div>
          <h3 style={{ color: T.gold, marginBottom: 16 }}>Revenue Stack by Asset</h3>
          <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <Slider label="FCR Availability (%)" value={fcrPct} min={0} max={100} step={10} onChange={setFcrPct} unit="%" />
              <Slider label="aFRR Availability (%)" value={afrrPct} min={0} max={100} step={10} onChange={setAfrrPct} unit="%" />
              <Slider label="mFRR Availability (%)" value={mfrrPct} min={0} max={100} step={10} onChange={setMfrrPct} unit="%" />
              <Slider label="Arbitrage Cycle Util. (%)" value={arbPct} min={10} max={100} step={5} onChange={setArbPct} unit="%" />
              <div style={{ marginTop: 12, padding: 12, background: T.surfaceH, borderRadius: 6 }}>
                <div style={{ fontSize: 11, color: T.textMut }}>Total Annual Revenue</div>
                <div style={{ fontSize: 22, color: T.gold, fontFamily: T.mono, marginTop: 4 }}>£{(annualRevenue / 1e6).toFixed(2)}M</div>
              </div>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Annual Revenue by Asset & Market Stream (£M)</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueByAsset}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" stroke={T.textMut} />
                  <YAxis stroke={T.textMut} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  <Legend />
                  <Bar dataKey="FCR" stackId="a" fill={C.gold} name="FCR (£M)" />
                  <Bar dataKey="aFRR" stackId="a" fill={C.teal} name="aFRR (£M)" />
                  <Bar dataKey="mFRR" stackId="a" fill={C.green} name="mFRR (£M)" />
                  <Bar dataKey="Arbitrage" stackId="a" fill={C.amber} name="Arbitrage (£M)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 4 && (
        <div>
          <h3 style={{ color: T.gold, marginBottom: 16 }}>Frequency Response Simulation — FCR Event</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Grid Frequency Response (Hz) — N-1 Event at t=5s</div>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={freqRespData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="t" stroke={T.textMut} label={{ value: "Time (s)", position: "insideBottom", offset: -5, fill: T.textMut, fontSize: 10 }} tick={{ fontSize: 9 }} interval={5} />
                  <YAxis domain={[49.5, 50.1]} stroke={T.textMut} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  <ReferenceLine y={49.8} stroke={T.amber} strokeDasharray="3 3" label={{ value: "ENTSO-E Low", fill: T.amber, fontSize: 9 }} />
                  <ReferenceLine y={49.5} stroke={T.red} strokeDasharray="3 3" label={{ value: "Emergency", fill: T.red, fontSize: 9 }} />
                  <Line dataKey="freq" name="Frequency (Hz)" stroke={C.gold} dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>BESS FCR Injection (MW) — Response Profile</div>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={freqRespData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="t" stroke={T.textMut} tick={{ fontSize: 9 }} interval={5} />
                  <YAxis stroke={T.textMut} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  <Area dataKey="bess_mw" name="BESS Injection (MW)" fill={C.teal} fillOpacity={0.3} stroke={C.teal} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 16 }}>
            <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>ENTSO-E FCR Requirements Summary</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              {[
                { label: "Full Activation Time", value: "30s", note: "From rated frequency deviation" },
                { label: "Frequency Band", value: "±200mHz", note: "Around 50 Hz nominal" },
                { label: "Holding Period", value: "30 min", note: "Minimum sustained dispatch" },
                { label: "Availability", value: "100%", note: "Round-the-clock pre-qualification" },
              ].map((item, i) => (
                <div key={i} style={{ background: T.surfaceH, borderRadius: 6, padding: 12, textAlign: "center" }}>
                  <div style={{ fontSize: 20, color: T.gold, fontFamily: T.mono, fontWeight: 700 }}>{item.value}</div>
                  <div style={{ fontSize: 11, color: T.text, marginTop: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 10, color: T.textMut, marginTop: 2 }}>{item.note}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 5 && (
        <div>
          <h3 style={{ color: T.gold, marginBottom: 16 }}>Market Stacking — Co-optimisation</h3>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 16 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {["Market", "Full Name", "Price (£/MW/month)", "Response", "Min Holding", "Tender Cycle", "Regulator"].map(h => (
                    <th key={h} style={{ padding: "8px 12px", color: T.textMut, textAlign: "left" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(MARKETS).map(([key, m], i) => (
                  <tr key={key} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.surfaceH : "transparent" }}>
                    <td style={{ padding: "8px 12px", color: T.gold, fontWeight: 700 }}>{key}</td>
                    <td style={{ padding: "8px 12px", color: T.text }}>{m.name}</td>
                    <td style={{ padding: "8px 12px", fontFamily: T.mono, color: T.green }}>£{m.price_mw_month.toLocaleString()}</td>
                    <td style={{ padding: "8px 12px", fontFamily: T.mono }}>{m.resp_sec < 60 ? `${m.resp_sec}s` : `${m.resp_sec / 60}min`}</td>
                    <td style={{ padding: "8px 12px", fontFamily: T.mono }}>{m.holding_min} min</td>
                    <td style={{ padding: "8px 12px", color: T.textSec }}>{m.tender}</td>
                    <td style={{ padding: "8px 12px", color: T.textSec }}>{m.regulator}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Value of Co-optimisation vs Single Market (Annual, £M)</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={[
                { strategy: "FCR Only", value: 3.2 }, { strategy: "Arbitrage Only", value: 2.8 },
                { strategy: "FCR + aFRR", value: 5.4 }, { strategy: "FCR + Arbitrage", value: 5.8 },
                { strategy: "FCR + aFRR + Arb", value: 7.6 }, { strategy: "Full Stack (all markets)", value: 8.9 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="strategy" stroke={T.textMut} tick={{ fontSize: 10 }} />
                <YAxis stroke={T.textMut} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                <Bar dataKey="value" name="Annual Revenue (£M)" fill={C.teal}
                  label={{ position: "top", fontSize: 10, fill: T.textSec, formatter: v => `£${v}M` }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 6 && (
        <div>
          <h3 style={{ color: T.gold, marginBottom: 16 }}>Aggregator Economics — P&L Model</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Aggregator Revenue Sharing Model</div>
              {[
                { party: "Asset Owner", share: 75, color: C.gold },
                { party: "VPP Aggregator", share: 15, color: C.teal },
                { party: "Grid/System Cost", share: 7, color: C.amber },
                { party: "Platform/Tech Fee", share: 3, color: C.green },
              ].map(p => (
                <div key={p.party} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: T.text }}>{p.party}</span>
                    <span style={{ fontSize: 13, fontFamily: T.mono, color: p.color }}>{p.share}%</span>
                  </div>
                  <div style={{ background: T.surfaceH, borderRadius: 4, height: 8 }}>
                    <div style={{ background: p.color, height: "100%", borderRadius: 4, width: `${p.share}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Aggregator P&L Scaling (£M/yr by fleet size)</div>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={[50, 100, 200, 400, 600, 800, 1000].map((mw, i) => ({
                  mw, revenue: +(mw * 0.015).toFixed(2), opex: +(mw * 0.004 + 0.2).toFixed(2), ebitda: +(mw * 0.011 - 0.2).toFixed(2)
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="mw" stroke={T.textMut} label={{ value: "Fleet MW", position: "insideBottom", offset: -5, fill: T.textMut, fontSize: 10 }} />
                  <YAxis stroke={T.textMut} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  <Legend />
                  <Line dataKey="revenue" name="Revenue (£M)" stroke={C.gold} dot={false} strokeWidth={2} />
                  <Line dataKey="opex" name="Opex (£M)" stroke={C.red} dot={false} strokeWidth={2} />
                  <Line dataKey="ebitda" name="EBITDA (£M)" stroke={C.green} dot={false} strokeWidth={2} />
                  <ReferenceLine y={0} stroke={T.text} strokeDasharray="3 3" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 7 && (
        <div>
          <h3 style={{ color: T.gold, marginBottom: 16 }}>DSO Flexibility Services</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>DNO/DSO Flexibility Tenders — UK Market</div>
              {[
                { service: "Constraint Management", volume_mw: 180, price: "£250–650/MWh", operator: "UK DNOs", activated: "Annual" },
                { service: "Dynamic Containment (Low)", volume_mw: 200, price: "£12,000/MW/month", operator: "National Grid ESO", activated: "Continuous" },
                { service: "Dynamic Moderation", volume_mw: 100, price: "£8,000/MW/month", operator: "National Grid ESO", activated: "Continuous" },
                { service: "Fast Reserve", volume_mw: 300, price: "£5,500/MW/month", operator: "National Grid ESO", activated: "Weekly" },
                { service: "BM Upward Dispatch", volume_mw: null, price: "System Marginal Price", operator: "National Grid ESO", activated: "Real-time" },
              ].map((s, i) => (
                <div key={i} style={{ padding: "10px 0", borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>{s.service}</span>
                    <span style={{ fontSize: 11, color: T.gold, fontFamily: T.mono }}>{s.price}</span>
                  </div>
                  <div style={{ fontSize: 10, color: T.textMut, marginTop: 2 }}>{s.operator} · {s.activated} · {s.volume_mw ? `${s.volume_mw} MW tendered` : "Balancing mechanism"}</div>
                </div>
              ))}
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Distribution Network Relief Value (£/MW/yr by zone)</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={[
                  { zone: "London Central", value: 65000 }, { zone: "South East", value: 42000 },
                  { zone: "Thames Valley", value: 38000 }, { zone: "East Anglia", value: 28000 },
                  { zone: "Yorkshire", value: 22000 }, { zone: "North West", value: 18000 },
                  { zone: "South West", value: 14000 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="zone" stroke={T.textMut} tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={50} />
                  <YAxis stroke={T.textMut} tickFormatter={v => `£${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} formatter={v => [`£${v.toLocaleString()}/MW/yr`]} />
                  <Bar dataKey="value" name="DSO Value (£/MW/yr)" fill={C.gold} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 8 && (
        <div>
          <h3 style={{ color: T.gold, marginBottom: 16 }}>Battery State-of-Charge Management</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>SoC Profile — 24-Hour Cycle (all BESS assets)</div>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={DISPATCH_HOURS}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="hour" stroke={T.textMut} tick={{ fontSize: 9 }} interval={3} />
                  <YAxis domain={[0, 100]} stroke={T.textMut} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  <ReferenceLine y={20} stroke={T.red} strokeDasharray="3 3" label={{ value: "Min SoC", fill: T.red, fontSize: 9 }} />
                  <ReferenceLine y={90} stroke={T.amber} strokeDasharray="3 3" label={{ value: "Max SoC", fill: T.amber, fontSize: 9 }} />
                  <Area dataKey="soc" name="State of Charge (%)" fill={C.teal} fillOpacity={0.3} stroke={C.teal} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Degradation vs SoC Operating Window</div>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(soc => ({
                  soc,
                  degrade: soc < 20 || soc > 85 ? 2.5 + Math.pow(Math.abs(soc - 52.5) / 15, 2) * 0.8 : 1.2 + Math.pow((soc - 52.5) / 45, 2) * 0.5
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="soc" stroke={T.textMut} label={{ value: "SoC (%)", position: "insideBottom", offset: -5, fill: T.textMut, fontSize: 10 }} />
                  <YAxis stroke={T.textMut} label={{ value: "Degrade Rate (%/yr)", angle: -90, position: "insideLeft", fill: T.textMut, fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  <ReferenceLine x={20} stroke={T.red} strokeDasharray="3 3" />
                  <ReferenceLine x={85} stroke={T.red} strokeDasharray="3 3" />
                  <Line dataKey="degrade" name="Annual Degradation (%)" stroke={C.amber} dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 9 && (
        <div>
          <h3 style={{ color: T.gold, marginBottom: 16 }}>Regulatory Framework</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {[
              { jurisdiction: "UK", framework: "Electricity System Reform Act 2023", key: "VPP aggregators licensed; DSR eligible for all balancing markets; Smart Export Guarantee", status: "Enacted" },
              { jurisdiction: "EU", framework: "Electricity Market Design Reform (2024)", key: "Demand response to access all markets; aggregator independence from retailers; non-discriminatory access", status: "Transitional" },
              { jurisdiction: "Germany", framework: "EnWG §14a — Controllable Consumption", key: "Grid-friendly charging mandate for heat pumps and EV chargers; DSO flexibility payments", status: "Active 2024" },
              { jurisdiction: "USA (FERC Order 2222)", framework: "FERC Order 2222 (2020) + 841 (BESS)", key: "Distributed Energy Resources in organised markets; BESS participation rules", status: "Implementing" },
              { jurisdiction: "Australia", framework: "Integrated System Plan + 5-min settlement", key: "VPP trials (SA, Victoria); 5-min settlement enables fast dispatch; CER participation review", status: "Active" },
              { jurisdiction: "Japan", framework: "GF/LFC Aggregation Framework", key: "Third-party aggregator scheme; demand response market activated 2022; DERA platform", status: "Active" },
            ].map((r, i) => (
              <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: T.gold, fontWeight: 700 }}>{r.jurisdiction}</span>
                  <span style={{ background: r.status === "Active" || r.status === "Active 2024" ? T.sage : T.navy, color: T.text, padding: "2px 8px", borderRadius: 4, fontSize: 10 }}>{r.status}</span>
                </div>
                <div style={{ fontSize: 11, color: T.amber, marginBottom: 6 }}>{r.framework}</div>
                <div style={{ fontSize: 11, color: T.textSec }}>{r.key}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      <EnergyAdvancedAnalytics T={T} moduleCode="EP-DT3" title="Virtual Power Plant — MC Aggregator P&L, Tornado & NGFS Scenarios"
        mcModel={{ title: 'MC VPP Aggregator EBITDA ($M) · 500 MW fleet', unit: 'M', fmt: (n) => n.toFixed(1),
        vars: { fcrPrice: { min: 15, mode: 35, max: 65 }, arbSpread: { min: 40, mode: 85, max: 150 }, avail: { min: 0.82, mode: 0.91, max: 0.97 }, opexPct: { min: 0.08, mode: 0.12, max: 0.18 } },
        compute: (v) => { const fcrRev = 500 * v.fcrPrice * 8760 * 0.2 / 1000 / 1e6; const arbRev = 500 * 2 * 300 * v.arbSpread * v.avail / 1e6 / 1000; const gross = (fcrRev + arbRev) * 10; return gross * (1 - v.opexPct); } }}
      tornadoModel={{ title: 'Tornado — VPP EBITDA Drivers', unit: 'M', fmt: (n) => `$${n.toFixed(1)}M`,
        inputs: { fcrPrice: 35, arbSpread: 85, avail: 0.91, opexPct: 0.12 },
        compute: (v) => { const fcrRev = 500 * v.fcrPrice * 8760 * 0.2 / 1000 / 1e6; const arbRev = 500 * 2 * 300 * v.arbSpread * v.avail / 1e6 / 1000; const gross = (fcrRev + arbRev) * 10; return gross * (1 - v.opexPct); } }}
      scenarioImpact={(p) => 45 + 0.3 * Math.max(0, p - 50)} scenarioFmt={(v) => `$${v.toFixed(0)}M`}
      scenarioTitle="Carbon Price × NGFS Pathway — VPP EBITDA uplift ($M)"
      peers={{ cols: [{ k: 'agg', label: 'Aggregator' }, { k: 'mw', label: 'MW under mgmt', fmt: (v) => `${v}` }, { k: 'mkts', label: 'Markets' }, { k: 'mgn', label: 'Gross margin', fmt: (v) => `${v}%` }, { k: 'ctry', label: 'Country' }],
        rows: [{ agg: 'Next Kraftwerke',   mw: 11500, mkts: 'FCR/aFRR/mFRR/arb', mgn: 22, ctry: 'DE/EU' }, { agg: 'Sonnen Community',  mw: 450,   mkts: 'FCR/DSR',           mgn: 18, ctry: 'DE/US' }, { agg: 'Tesla Autobidder',  mw: 3500,  mkts: 'FCAS/arb',           mgn: 28, ctry: 'AU/US' }, { agg: 'Voltalis',          mw: 1600,  mkts: 'DSR/cap mkt',        mgn: 19, ctry: 'FR' }, { agg: 'Stem Athena',       mw: 1200,  mkts: 'C&I arb+DR',         mgn: 24, ctry: 'US' }, { agg: 'Octopus Kraken',    mw: 2200,  mkts: 'BM/FFR/arb',         mgn: 20, ctry: 'UK' }] }}
        indiaContext={{
          subtitle: 'CERC ancillary · DISCOM pilots · IEX RT market',
          regulations: [
            { tag: 'CERC Ancillary Services', status: 'active' },
            { tag: 'IEX RTM / DAM / GTAM', status: 'active' },
            { tag: 'CEA VPP aggregator framework', status: 'partial' },
            { tag: 'Net metering <500 kW', status: 'active' },
            { tag: 'TOD tariffs (10 states)', status: 'active' },
            { tag: 'Demand Flexibility (BEE draft)', status: 'partial' },
          ],
          kpis: [
            { label: 'IEX daily volume', value: '~400 GWh' },
            { label: 'Aggregator pilots', value: '7 DISCOMs' },
            { label: 'TOD peak/off-peak', value: '1.2–0.8x', detail: 'GERC/MERC' },
            { label: 'C&I flex MW (potential)', value: '4 GW' },
          ],
          peers: { title: 'INDIAN VPP / DR AGGREGATORS',
            cols: [{ k: 'agg', label: 'Aggregator' }, { k: 'mw', label: 'MW aggregated' }, { k: 'mkt', label: 'Market' }, { k: 'seg', label: 'Segment' }, { k: 'state', label: 'State' }],
            rows: [
              { agg: 'Fourth Partner Energy (VPP)', mw: '280', mkt: 'IEX RTM+DR', seg: 'C&I rooftop+BESS', state: 'Pan-India' },
              { agg: 'Sheru', mw: '150', mkt: 'Ancillary pilots', seg: 'Telecom towers', state: 'KA/MH' },
              { agg: 'Amplus Solar DR', mw: '220', mkt: 'C&I DR', seg: 'Industrial loads', state: 'MP/GJ' },
              { agg: 'Tata Power DISCOM DR', mw: '180', mkt: 'Captive DR', seg: 'Residential', state: 'MH/DL' },
              { agg: 'BSES Rajdhani DR', mw: '120', mkt: 'Pilot', seg: 'LT commercial', state: 'DL' },
              { agg: 'EverSource Capital VPP', mw: '90', mkt: 'RTM+Anc', seg: 'C&I', state: 'TN' },
            ] },
          notes: 'India VPP is at pilot stage with CERC ancillary services market opening to aggregators in 2024. Real opportunity sits in C&I TOD arbitrage (₹2–5/kWh peak-to-off-peak) and DISCOM-commissioned DR programs. IEX RTM offers 15-min granularity for VPP bids since 2020.',
        }}
      />
    </div>
  );
}
