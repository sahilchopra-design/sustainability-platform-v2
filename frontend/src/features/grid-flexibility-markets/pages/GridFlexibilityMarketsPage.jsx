import React, { useState, useMemo } from "react";
import EnergyAdvancedAnalytics from '../../_shared/EnergyAdvancedAnalytics';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, ComposedChart,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine } from "recharts";

const T = {
  bg: "#0f1117", surface: "#1a1d27", surfaceH: "#22263a", border: "#2a2f45", borderL: "#353a52",
  navy: "#1e3a5f", navyL: "#2a4a6f", gold: "#d4a843", goldL: "#e0b85a",
  sage: "#2d6a4f", sageL: "#3d8a6a", teal: "#0d4f5c", text: "#e8e0d0",
  textSec: "#a89880", textMut: "#6b6050", red: "#c0392b", green: "#27ae60",
  amber: "#e67e22", font: "'DM Sans', sans-serif", mono: "'JetBrains Mono', monospace",
};

const sr = s => { const x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const ANCILLARY_SERVICES = [
  { id: "FCR", name: "Frequency Containment Reserve", resp_s: 30, duration_min: 30, sym: true, cap_eu_mw: 1500, price_eur_mw_h: 18, providers: ["BESS","Hydro","Gas peaker","Industrial DR"], tech_req: "±200mHz deadband" },
  { id: "aFRR", name: "Automatic Frequency Restoration", resp_s: 300, duration_min: 15, sym: true, cap_eu_mw: 3000, price_eur_mw_h: 8, providers: ["BESS","Hydro","Gas CCT"], tech_req: "AGC signal, telemetry 1s" },
  { id: "mFRR", name: "Manual Frequency Restoration", resp_s: 900, duration_min: 60, sym: false, cap_eu_mw: 5000, price_eur_mw_h: 4, providers: ["Gas peaker","Hydro","DSR","BESS"], tech_req: "Dispatch via phone/SCADA" },
  { id: "RR", name: "Replacement Reserve", resp_s: 900, duration_min: 240, sym: false, cap_eu_mw: 8000, price_eur_mw_h: 2, providers: ["Gas CCGT","Hydro","DSR","Interconnectors"], tech_req: "Schedulable, 15min lead" },
  { id: "DC-L", name: "Dynamic Containment Low (UK)", resp_s: 1, duration_min: 30, sym: false, cap_eu_mw: 200, price_eur_mw_h: 20, providers: ["BESS"], tech_req: "FFR: respond within 1s to 0.5Hz dev" },
  { id: "DC-H", name: "Dynamic Containment High (UK)", resp_s: 1, duration_min: 30, sym: false, cap_eu_mw: 200, price_eur_mw_h: 20, providers: ["BESS","EV"], tech_req: "Absorb excess at 50.5Hz" },
  { id: "DM", name: "Dynamic Moderation (UK)", resp_s: 10, duration_min: 30, sym: true, cap_eu_mw: 100, price_eur_mw_h: 15, providers: ["BESS"], tech_req: "Prevents rate-of-change issues" },
  { id: "DR", name: "Dynamic Regulation (UK)", resp_s: 10, duration_min: 30, sym: true, cap_eu_mw: 100, price_eur_mw_h: 12, providers: ["BESS"], tech_req: "Tighter regulation band" },
];

const MARKET_PRICES_WEEKLY = Array.from({ length: 52 }, (_, w) => ({
  week: w + 1,
  FCR:   50 + sr(w * 7) * 80 - 20 + (w > 40 ? 30 : 0),
  aFRR:  20 + sr(w * 11) * 50 - 10,
  mFRR:  10 + sr(w * 13) * 35,
  DA:    30 + sr(w * 17) * 100 - 20,
}));

const COUNTRIES = [
  { name: "Germany", fcr_share: 22, afrr_cap_mw: 6000, bess_cap_mw: 2400, dr_cap_mw: 1800, interchange_gw: 40, re_pct: 58 },
  { name: "UK", fcr_share: 8, afrr_cap_mw: 0, bess_cap_mw: 4200, dr_cap_mw: 900, interchange_gw: 8, re_pct: 48 },
  { name: "France", fcr_share: 15, afrr_cap_mw: 4500, bess_cap_mw: 800, dr_cap_mw: 2200, interchange_gw: 35, re_pct: 28 },
  { name: "Italy", fcr_share: 12, afrr_cap_mw: 3200, bess_cap_mw: 1200, dr_cap_mw: 1400, interchange_gw: 18, re_pct: 38 },
  { name: "Spain", fcr_share: 10, afrr_cap_mw: 2800, bess_cap_mw: 600, dr_cap_mw: 1100, interchange_gw: 10, re_pct: 52 },
  { name: "Australia (NEM)", fcr_share: 5, afrr_cap_mw: 1200, bess_cap_mw: 1100, dr_cap_mw: 600, interchange_gw: 2, re_pct: 38 },
];

const TABS = [
  "Market Overview", "Ancillary Services", "Price Dynamics", "Market Sizing",
  "Technology Eligibility", "Cross-Border Balancing", "Investment Returns",
  "Capacity Mechanisms", "DSR & Demand Flex", "Future Market Design"
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

export default function GridFlexibilityMarketsPage() {
  const [tab, setTab] = useState(0);
  const [capMw, setCapMw]         = useState(50);
  const [fcrAlloc, setFcrAlloc]   = useState(40);
  const [afrrAlloc, setAfrrAlloc] = useState(30);
  const [arbAlloc, setArbAlloc]   = useState(30);
  const [rePct, setRePct]         = useState(45);

  const totalFlexEU = COUNTRIES.reduce((s, c) => s + c.afrr_cap_mw + c.bess_cap_mw + c.dr_cap_mw, 0);

  const annualRevCalc = useMemo(() => {
    const fcrRev  = capMw * (fcrAlloc / 100) * 18 * 8760 / 1000;
    const afrrRev = capMw * (afrrAlloc / 100) * 8 * 8760 / 1000;
    const arbRev  = capMw * (arbAlloc / 100) * 35 * 250;
    return (fcrRev + afrrRev + arbRev);
  }, [capMw, fcrAlloc, afrrAlloc, arbAlloc]);

  const flexNeedData = useMemo(() => [2024, 2026, 2028, 2030, 2032, 2035].map((yr, i) => ({
    year: yr,
    flex_gw: +(20 + rePct * 0.8 * (1 + i * 0.25)).toFixed(0),
    bess_gw: +(8 + i * 4 + sr(i * 11) * 3).toFixed(0),
    dr_gw:   +(5 + i * 2.5 + sr(i * 7) * 2).toFixed(0),
    gas_gw:  +(15 - i * 1.5 + sr(i * 9) * 2).toFixed(0),
  })), [rePct]);

  const radarData = [
    { axis: "Response Speed", FCR: 95, aFRR: 70, mFRR: 40, DSR: 30 },
    { axis: "Duration", FCR: 40, aFRR: 55, mFRR: 75, DSR: 80 },
    { axis: "Revenue/MW", FCR: 90, aFRR: 60, mFRR: 35, DSR: 30 },
    { axis: "BESS Suitability", FCR: 95, aFRR: 85, mFRR: 70, DSR: 40 },
    { axis: "Market Volume", FCR: 45, aFRR: 60, mFRR: 80, DSR: 75 },
    { axis: "Tenor Certainty", FCR: 50, aFRR: 55, mFRR: 60, DSR: 70 },
  ];

  const C = { gold: "#d4a843", teal: "#0d9488", green: "#27ae60", red: "#c0392b", amber: "#e67e22", purple: "#7c3aed", blue: "#2563eb" };

  return (
    <div style={{ background: T.bg, minHeight: "100vh", fontFamily: T.font, color: T.text, padding: "24px 32px" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
          EP-DT4 · Grid Flexibility Markets & Ancillary Services Finance
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>Grid Flexibility Markets & Ancillary Services Finance</h1>
        <p style={{ color: T.textSec, marginTop: 6, fontSize: 14 }}>
          FCR · aFRR · mFRR · DSR · Capacity Mechanisms · Cross-border balancing · Revenue optimisation
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        <KpiCard label="EU Flex Capacity" value={`${(totalFlexEU / 1000).toFixed(0)}GW`} unit="" sub="BESS + aFRR + DR tracked" />
        <KpiCard label="FCR Price (EU avg)" value="€18" unit="/MW/h" sub="2024 annual average" color={C.teal} />
        <KpiCard label="Flexibility Need 2030" value="600GW" unit="" sub="At 80% renewable penetration" color={C.amber} />
        <KpiCard label="Revenue at 50MW (full stack)" value={`€${(annualRevCalc / 1000).toFixed(1)}M`} unit="/yr" sub="FCR + aFRR + arbitrage" color={C.green} />
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
          <h3 style={{ color: T.gold, marginBottom: 16 }}>Grid Flexibility Market Overview</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Flexibility Need by Technology Source (2030 projection, GW)</div>
              <Slider label="Renewable Penetration (%)" value={rePct} min={20} max={90} step={5} onChange={setRePct} unit="%" />
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={flexNeedData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" stroke={T.textMut} />
                  <YAxis stroke={T.textMut} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  <Legend />
                  <Bar dataKey="bess_gw" stackId="a" fill={C.teal} name="BESS (GW)" />
                  <Bar dataKey="dr_gw" stackId="a" fill={C.gold} name="DSR (GW)" />
                  <Bar dataKey="gas_gw" stackId="a" fill={C.amber} name="Gas Peaker (GW)" />
                  <Line dataKey="flex_gw" name="Total Need (GW)" stroke={C.red} strokeWidth={2} dot={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Revenue Optimiser — Capacity Allocation</div>
              <Slider label="Capacity (MW)" value={capMw} min={10} max={500} step={10} onChange={setCapMw} unit=" MW" />
              <Slider label="FCR Allocation (%)" value={fcrAlloc} min={0} max={100} step={5} onChange={setFcrAlloc} unit="%" />
              <Slider label="aFRR Allocation (%)" value={afrrAlloc} min={0} max={100 - fcrAlloc} step={5} onChange={setAfrrAlloc} unit="%" />
              <Slider label="Arbitrage (%)" value={arbAlloc} min={0} max={100 - fcrAlloc - afrrAlloc} step={5} onChange={setArbAlloc} unit="%" />
              <div style={{ padding: 12, background: T.surfaceH, borderRadius: 6, marginTop: 8 }}>
                <div style={{ fontSize: 11, color: T.textMut }}>Annual Revenue Estimate</div>
                <div style={{ fontSize: 24, color: T.gold, fontFamily: T.mono, fontWeight: 700, marginTop: 4 }}>€{(annualRevCalc / 1000).toFixed(2)}M</div>
                <div style={{ fontSize: 10, color: T.textSec }}>FCR+aFRR+Arbitrage</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div>
          <h3 style={{ color: T.gold, marginBottom: 16 }}>Ancillary Services Catalogue</h3>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                    {["Service", "Name", "Response", "Duration", "Symmetric", "Avg Price", "Eligible Providers", "Requirement"].map(h => (
                      <th key={h} style={{ padding: "8px 12px", color: T.textMut, textAlign: "left" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ANCILLARY_SERVICES.map((s, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.surfaceH : "transparent" }}>
                      <td style={{ padding: "8px 12px", color: T.gold, fontWeight: 700 }}>{s.id}</td>
                      <td style={{ padding: "8px 12px", color: T.text, maxWidth: 200 }}>{s.name}</td>
                      <td style={{ padding: "8px 12px", fontFamily: T.mono }}>{s.resp_s < 60 ? `${s.resp_s}s` : `${s.resp_s / 60}min`}</td>
                      <td style={{ padding: "8px 12px", fontFamily: T.mono }}>{s.duration_min}min</td>
                      <td style={{ padding: "8px 12px" }}><span style={{ color: s.sym ? T.green : T.textMut }}>{s.sym ? "Yes" : "No"}</span></td>
                      <td style={{ padding: "8px 12px", fontFamily: T.mono, color: T.gold }}>€{s.price_eur_mw_h}/MWh</td>
                      <td style={{ padding: "8px 12px", color: T.textSec, fontSize: 10 }}>{s.providers.join(", ")}</td>
                      <td style={{ padding: "8px 12px", color: T.textMut, fontSize: 10 }}>{s.tech_req}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 2 && (
        <div>
          <h3 style={{ color: T.gold, marginBottom: 16 }}>Ancillary Service Price Dynamics (2024)</h3>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Weekly Price Index — FCR / aFRR / mFRR / Day-Ahead (€/MWh)</div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={MARKET_PRICES_WEEKLY}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="week" stroke={T.textMut} label={{ value: "Week", position: "insideBottom", offset: -5, fill: T.textMut, fontSize: 10 }} />
                <YAxis stroke={T.textMut} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                <Legend />
                <Line dataKey="FCR"  name="FCR (€/MWh)"  stroke={C.gold}  dot={false} strokeWidth={2} />
                <Line dataKey="aFRR" name="aFRR (€/MWh)" stroke={C.teal}  dot={false} strokeWidth={2} />
                <Line dataKey="mFRR" name="mFRR (€/MWh)" stroke={C.green} dot={false} strokeWidth={2} />
                <Line dataKey="DA"   name="DA (€/MWh)"   stroke={C.amber} dot={false} strokeWidth={1} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {[
              { svc: "FCR", avg: "€18/MWh", p90: "€42/MWh", trend: "↓ -12% vs 2023", color: C.gold },
              { svc: "aFRR", avg: "€8/MWh", p90: "€22/MWh", trend: "→ Stable", color: C.teal },
              { svc: "mFRR", avg: "€4/MWh", p90: "€14/MWh", trend: "↑ +8% vs 2023", color: C.green },
              { svc: "DA Spread", avg: "€35/MWh", p90: "€90/MWh", trend: "↑ +15% vs 2023 (RE vol)", color: C.amber },
            ].map(s => (
              <KpiCard key={s.svc} label={s.svc} value={s.avg} unit="" sub={`P90: ${s.p90} · ${s.trend}`} color={s.color} />
            ))}
          </div>
        </div>
      )}

      {tab === 3 && (
        <div>
          <h3 style={{ color: T.gold, marginBottom: 16 }}>Market Sizing by Country</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>BESS + DSR Capacity by Country (MW)</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={COUNTRIES} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" stroke={T.textMut} />
                  <YAxis dataKey="name" type="category" stroke={T.textMut} width={110} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  <Legend />
                  <Bar dataKey="bess_cap_mw" stackId="a" name="BESS (MW)" fill={C.teal} />
                  <Bar dataKey="dr_cap_mw" stackId="a" name="DSR (MW)" fill={C.gold} />
                  <Bar dataKey="afrr_cap_mw" stackId="a" name="aFRR Cap (MW)" fill={C.green} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Flexibility Need vs Available (Adequacy Gap)</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={COUNTRIES.map(c => ({
                  name: c.name,
                  available: c.bess_cap_mw + c.dr_cap_mw,
                  need: Math.round((c.re_pct / 100) * c.afrr_cap_mw * 0.4 + 500),
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" stroke={T.textMut} tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
                  <YAxis stroke={T.textMut} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  <Legend />
                  <Bar dataKey="available" name="Available Flex (MW)" fill={C.green} />
                  <Bar dataKey="need" name="Estimated Need (MW)" fill={C.amber} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 4 && (
        <div>
          <h3 style={{ color: T.gold, marginBottom: 16 }}>Technology Eligibility Matrix</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Service Suitability Radar — FCR vs aFRR vs mFRR vs DSR</div>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke={T.border} />
                  <PolarAngleAxis dataKey="axis" tick={{ fill: T.textSec, fontSize: 10 }} />
                  <Radar name="FCR" dataKey="FCR" fill={C.gold} fillOpacity={0.2} stroke={C.gold} />
                  <Radar name="aFRR" dataKey="aFRR" fill={C.teal} fillOpacity={0.2} stroke={C.teal} />
                  <Radar name="mFRR" dataKey="mFRR" fill={C.green} fillOpacity={0.2} stroke={C.green} />
                  <Radar name="DSR" dataKey="DSR" fill={C.amber} fillOpacity={0.2} stroke={C.amber} />
                  <Legend />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Technology × Service Eligibility</div>
              {[
                { tech: "4-hour BESS", FCR: true, aFRR: true, mFRR: true, DC: true, DR: true, Arb: true },
                { tech: "2-hour BESS", FCR: true, aFRR: true, mFRR: false, DC: true, DR: false, Arb: true },
                { tech: "EV V2G Fleet", FCR: false, aFRR: false, mFRR: true, DC: false, DR: true, Arb: true },
                { tech: "Industrial DSR", FCR: false, aFRR: false, mFRR: true, DC: false, DR: true, Arb: false },
                { tech: "Pumped Hydro", FCR: true, aFRR: true, mFRR: true, DC: false, DR: false, Arb: true },
                { tech: "Gas Peaker GT", FCR: false, aFRR: true, mFRR: true, DC: false, DR: false, Arb: false },
              ].map((row, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: `1px solid ${T.border}`, fontSize: 11 }}>
                  <span style={{ width: 130, color: T.text }}>{row.tech}</span>
                  {["FCR", "aFRR", "mFRR", "DC", "DR", "Arb"].map(svc => (
                    <span key={svc} style={{
                      width: 44, textAlign: "center", padding: "2px 4px", borderRadius: 4,
                      background: row[svc] ? T.sage : T.surfaceH,
                      color: row[svc] ? T.text : T.textMut, fontSize: 9
                    }}>{svc}</span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 5 && (
        <div>
          <h3 style={{ color: T.gold, marginBottom: 16 }}>Cross-Border Balancing — PICASSO / MARI</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Cross-Border Interchange Capacity (GW)</div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={COUNTRIES} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" stroke={T.textMut} />
                  <YAxis dataKey="name" type="category" stroke={T.textMut} width={110} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  <Bar dataKey="interchange_gw" name="Interconnection (GW)" fill={C.teal} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>ENTSO-E Platform Implementations</div>
              {[
                { platform: "PICASSO", service: "aFRR (automatic)", status: "Live (Nov 2022)", members: "18 TSOs", benefit: "~€200M/yr savings" },
                { platform: "MARI", service: "mFRR (manual)", status: "Live (Jun 2024)", members: "14 TSOs", benefit: "~€150M/yr savings" },
                { platform: "TERRE", service: "RR (replacement reserve)", status: "Live (2019)", members: "8 TSOs", benefit: "~€80M/yr savings" },
                { platform: "FCR Cooperation", service: "FCR (frequency containment)", status: "Operational", members: "8 core TSOs", benefit: "Diversification benefit" },
              ].map((p, i) => (
                <div key={i} style={{ padding: "10px 0", borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: T.gold, fontWeight: 700 }}>{p.platform}</span>
                    <span style={{ background: T.sage, color: T.text, padding: "2px 8px", borderRadius: 4, fontSize: 10 }}>{p.status}</span>
                  </div>
                  <div style={{ fontSize: 11, color: T.text }}>{p.service}</div>
                  <div style={{ fontSize: 10, color: T.textMut, marginTop: 2 }}>{p.members} · {p.benefit}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 6 && (
        <div>
          <h3 style={{ color: T.gold, marginBottom: 16 }}>Investment Returns — BESS in Flexibility Markets</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>IRR Sensitivity — FCR Price vs BESS Capex</div>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="capex" type="number" domain={[60, 120]} tickCount={7} stroke={T.textMut}
                    label={{ value: "BESS Capex ($/kWh)", position: "insideBottom", offset: -5, fill: T.textMut, fontSize: 10 }} />
                  <YAxis stroke={T.textMut} label={{ value: "IRR (%)", angle: -90, position: "insideLeft", fill: T.textMut, fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  <Legend />
                  {[15, 20, 25].map((fcr, fi) => (
                    <Line key={fcr}
                      data={[60, 70, 80, 90, 100, 110, 120].map(capex => ({ capex, irr: +(fcr * 0.8 - capex * 0.08 + 8).toFixed(1) }))}
                      dataKey="irr" name={`FCR €${fcr}/MWh`}
                      stroke={[C.gold, C.teal, C.green][fi]} dot={false} strokeWidth={2} />
                  ))}
                  <ReferenceLine y={8} stroke={T.amber} strokeDasharray="3 3" label={{ value: "Hurdle Rate 8%", fill: T.amber, fontSize: 9 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Revenue Per MW by Market — Comparable Benchmarks (£/MW/yr)</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={[
                  { market: "DC Low (UK)", rev: 192000 }, { market: "DC High (UK)", rev: 185000 },
                  { market: "FCR (EU avg)", rev: 157680 }, { market: "DM (UK)", rev: 131400 },
                  { market: "aFRR (EU avg)", rev: 70080 }, { market: "Arbitrage (UK)", rev: 52000 },
                  { market: "mFRR (EU avg)", rev: 35040 }, { market: "DSR (UK)", rev: 30660 },
                ]} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" stroke={T.textMut} tickFormatter={v => `£${(v / 1000).toFixed(0)}k`} />
                  <YAxis dataKey="market" type="category" stroke={T.textMut} width={140} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }}
                    formatter={v => [`£${v.toLocaleString()}/MW/yr`]} />
                  <Bar dataKey="rev" name="Revenue (£/MW/yr)" fill={C.gold} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 7 && (
        <div>
          <h3 style={{ color: T.gold, marginBottom: 16 }}>Capacity Mechanisms</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Capacity Market Clearing Prices (£/kW/yr) — T-1 Auctions</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={[2018,2019,2020,2021,2022,2023,2024].map((yr, i) => ({
                  year: yr, price: [8.4, 6.0, 0.77, 45.0, 75.0, 63.0, 58.0][i]
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" stroke={T.textMut} />
                  <YAxis stroke={T.textMut} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  <ReferenceLine y={20} stroke={T.amber} strokeDasharray="3 3" label={{ value: "Cost recovery threshold", fill: T.amber, fontSize: 9 }} />
                  <Bar dataKey="price" name="Clearing Price (£/kW/yr)" fill={C.teal} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Capacity Mechanism Designs by Country</div>
              {[
                { country: "UK", type: "Capacity Market (T-1/T-4)", clearing: "Uniform price auction", bess: "1-hr derating factor; BESS eligible since 2018" },
                { country: "Ireland", type: "Capacity Remuneration Mechanism", clearing: "€/MW/yr bilateral", bess: "DS3 services: FFR, FIR, SIR, RRS" },
                { country: "France", type: "Capacity Mechanism (Capacity Certificates)", clearing: "OTC bilateral", bess: "Eligible from 2022, 30-min delivery" },
                { country: "Germany", type: "Reserve Market (Minutenreserve)", clearing: "Pay-as-bid", bess: "Full eligibility, 15-min settlement" },
              ].map((r, i) => (
                <div key={i} style={{ padding: "10px 0", borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 13, color: T.gold, fontWeight: 700 }}>{r.country}</div>
                  <div style={{ fontSize: 11, color: T.amber, marginTop: 2 }}>{r.type} · {r.clearing}</div>
                  <div style={{ fontSize: 10, color: T.textSec, marginTop: 2 }}>{r.bess}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 8 && (
        <div>
          <h3 style={{ color: T.gold, marginBottom: 16 }}>Demand Side Response & Demand Flexibility</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>DSR Resource Types — Baseline Flexibility Potential (EU)</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={[
                  { sector: "Industry (electrolysers)", potential_gw: 18, activated_gw: 4, revenue: 58 },
                  { sector: "Industry (refrigeration)", potential_gw: 12, activated_gw: 3.2, revenue: 42 },
                  { sector: "Commercial HVAC", potential_gw: 8, activated_gw: 1.8, revenue: 28 },
                  { sector: "EV Smart Charging", potential_gw: 25, activated_gw: 2.4, revenue: 35 },
                  { sector: "Heat Pumps", potential_gw: 15, activated_gw: 0.8, revenue: 22 },
                  { sector: "Water Heating", potential_gw: 6, activated_gw: 1.2, revenue: 18 },
                ]} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" stroke={T.textMut} />
                  <YAxis dataKey="sector" type="category" stroke={T.textMut} width={170} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  <Legend />
                  <Bar dataKey="potential_gw" name="Potential (GW)" fill={C.gold} opacity={0.5} />
                  <Bar dataKey="activated_gw" name="Activated (GW)" fill={C.teal} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>DSR Activation Event Economics</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <KpiCard label="Avg DSR Payment" value="€280" unit="/MWh" sub="UK Demand Flexibility Service" color={C.teal} />
                <KpiCard label="EU DSR Market Size" value="€2.8Bn" unit="/yr" sub="2024 estimate" color={C.gold} />
              </div>
              <div style={{ padding: 12, background: T.surfaceH, borderRadius: 6 }}>
                <div style={{ fontSize: 12, color: T.textSec, marginBottom: 8 }}>Demand Flexibility Service (DFS) — UK National Grid ESO</div>
                {[
                  ["Winter 2022/23 (pilot)", "3,300 participants", "3.3 GW dispatched", "£3.5M paid"],
                  ["Winter 2023/24", "6,000+ participants", "4.1 GW dispatched", "£5.8M paid"],
                  ["Target 2025/26", "10,000+ participants", "6 GW capacity", "£15M budget"],
                ].map(([season, ...vals]) => (
                  <div key={season} style={{ display: "flex", gap: 12, marginBottom: 6, fontSize: 11 }}>
                    <span style={{ color: T.gold, width: 130 }}>{season}</span>
                    {vals.map(v => <span key={v} style={{ color: T.textSec }}>{v}</span>)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 9 && (
        <div>
          <h3 style={{ color: T.gold, marginBottom: 16 }}>Future Market Design — 2030 Vision</h3>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Flexibility Market Evolution Roadmap</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              {[
                { period: "2024–2025", themes: ["PICASSO/MARI live EU-wide", "UK REMA (Review of Electricity Market Arrangements)", "BESS derating removal", "15-min settlement UK"], color: C.teal },
                { period: "2026–2027", themes: ["Local/zonal flexibility markets", "Real-time markets integration", "Automated DSR participation", "H2 electrolysers in FCR/aFRR"], color: C.gold },
                { period: "2028–2029", themes: ["Pan-European DA market reform", "Distribution-connected ancillary services", "AI-driven dispatch optimisation", "EV V2G standardisation (ISO 15118)"], color: C.amber },
                { period: "2030+", themes: ["Full nodal pricing", "Peer-to-peer flex trading", "Continent-wide balancing platform", "Synthetic inertia markets"], color: C.purple },
              ].map(phase => (
                <div key={phase.period} style={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6, padding: 14 }}>
                  <div style={{ fontSize: 13, color: phase.color, fontWeight: 700, marginBottom: 8 }}>{phase.period}</div>
                  {phase.themes.map((t, i) => (
                    <div key={i} style={{ fontSize: 11, color: T.textSec, marginBottom: 4, paddingLeft: 8, borderLeft: `2px solid ${phase.color}` }}>{t}</div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>Projected Market Revenue Pool Growth (€Bn/yr)</div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={[2024,2026,2028,2030,2032,2035].map((yr, i) => ({
                year: yr,
                FCR: +(3.2 + i * 0.5).toFixed(1),
                aFRR: +(4.8 + i * 0.8).toFixed(1),
                DSR: +(2.1 + i * 1.4).toFixed(1),
                CM: +(8.5 + i * 0.3).toFixed(1),
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" stroke={T.textMut} />
                <YAxis stroke={T.textMut} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                <Legend />
                <Area dataKey="CM" stackId="a" fill={C.amber} fillOpacity={0.7} stroke={C.amber} name="Capacity Mechanisms (€Bn)" />
                <Area dataKey="aFRR" stackId="a" fill={C.teal} fillOpacity={0.7} stroke={C.teal} name="aFRR/mFRR (€Bn)" />
                <Area dataKey="FCR" stackId="a" fill={C.gold} fillOpacity={0.7} stroke={C.gold} name="FCR (€Bn)" />
                <Area dataKey="DSR" stackId="a" fill={C.green} fillOpacity={0.7} stroke={C.green} name="DSR (€Bn)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      <EnergyAdvancedAnalytics T={T} moduleCode="EP-DT4" title="Grid Flexibility Markets — MC Ancillary Revenue, Tornado & NGFS Scenarios"
        mcModel={{ title: 'MC Ancillary Revenue ($k/MW-yr) · Merchant BESS', unit: 'k', fmt: (n) => n.toFixed(1),
        vars: { fcrEur: { min: 8, mode: 20, max: 50 }, afrrEur: { min: 10, mode: 28, max: 65 }, cfFcr: { min: 0.15, mode: 0.28, max: 0.45 }, cfAfrr: { min: 0.10, mode: 0.20, max: 0.35 } },
        compute: (v) => (v.fcrEur * 8760 * v.cfFcr + v.afrrEur * 8760 * v.cfAfrr) / 1000 }}
      tornadoModel={{ title: 'Tornado — Ancillary Rev Drivers', unit: 'k', fmt: (n) => `$${n.toFixed(0)}k`,
        inputs: { fcrEur: 20, afrrEur: 28, cfFcr: 0.28, cfAfrr: 0.20 },
        compute: (v) => (v.fcrEur * 8760 * v.cfFcr + v.afrrEur * 8760 * v.cfAfrr) / 1000 }}
      scenarioImpact={(p) => 85 + 0.4 * Math.max(0, p - 50)} scenarioFmt={(v) => `$${v.toFixed(0)}k`}
      scenarioTitle="Carbon Price × NGFS Pathway — Ancillary services $/MW-yr"
      peers={{ cols: [{ k: 'mkt', label: 'TSO / Market' }, { k: 'fcr', label: 'FCR ($/MW-yr)', fmt: (v) => `$${(v/1000).toFixed(0)}k` }, { k: 'afrr', label: 'aFRR ($/MW-yr)', fmt: (v) => `$${(v/1000).toFixed(0)}k` }, { k: 'cap', label: 'Cap mkt' }, { k: 'ctry', label: 'Country' }],
        rows: [{ mkt: 'PICASSO / MARI EU', fcr: 180000, afrr: 240000, cap: 'MS-level', ctry: 'EU' }, { mkt: 'ENTSO-E DE',      fcr: 160000, afrr: 220000, cap: 'Strategic R', ctry: 'DE' }, { mkt: 'National Grid ESO',fcr: 125000, afrr: 145000, cap: 'T-4/T-1',    ctry: 'UK' }, { mkt: 'EirGrid DS3',     fcr: 105000, afrr: 135000, cap: 'Capacity',   ctry: 'IE' }, { mkt: 'CAISO',           fcr: 70000,  afrr: 95000,  cap: 'RA market',  ctry: 'US-CA' }, { mkt: 'AEMO FCAS',       fcr: 180000, afrr: 260000, cap: 'RRO',        ctry: 'AU' }] }}
      />
    </div>
  );
}
