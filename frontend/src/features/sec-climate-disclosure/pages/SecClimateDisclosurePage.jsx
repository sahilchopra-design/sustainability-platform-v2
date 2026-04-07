/**
 * EP-BA2 — SEC Climate Disclosure Panel
 * Sprint BA | Regulatory Reporting & Disclosure
 *
 * ⚠️  IMPORTANT: The SEC Enhancement and Standardization of Climate-Related Disclosures
 * rule (Release No. 33-11275 / 34-99678) was RESCINDED by SEC vote on 27 March 2025.
 * This panel is maintained as an educational/voluntary-disclosure reference framework.
 * All outputs are ADVISORY ONLY. Cross-references to TCFD and ISSB S2 remain valid.
 */
import React, { useState, useMemo } from "react";
import {
  BarChart, Bar, LineChart, Line, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
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
  red:   "#dc2626",
  amber: "#d97706",
  green: "#059669",
  blue:  "#2563eb",
  purple:"#7c3aed",
};

/* ── Seeded random ──────────────────────────────────────────────────────────── */
const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

/* ── Data ───────────────────────────────────────────────────────────────────── */
const SECTORS = [
  "Energy", "Utilities", "Materials", "Industrials", "Transportation",
  "Consumer Staples", "Health Care", "Financials", "Technology", "Real Estate"
];

const FILER_TYPES = [
  { type: "Large Accelerated Filer (LAF)", float: ">$700M", scope12Deadline: "FY2025 (rescinded)", scope3Deadline: "FY2026 (rescinded)", assurance: "Reasonable (rescinded)" },
  { type: "Accelerated Filer (AF)",        float: "$75M–$700M", scope12Deadline: "FY2026 (rescinded)", scope3Deadline: "N/A", assurance: "Limited (rescinded)" },
  { type: "Non-Accelerated Filer",         float: "<$75M",     scope12Deadline: "FY2027 (rescinded)", scope3Deadline: "N/A", assurance: "None" },
  { type: "SRC / EGC",                     float: "SRC/EGC",   scope12Deadline: "Exempt (rescinded)", scope3Deadline: "N/A", assurance: "None" },
];

const ITEMS = [
  { code: "Item 1500", title: "Climate-related risks",         form: "10-K Part I Item 1A", tcfd: "Risk Management", issb: "IFRS S2 §10–19", desc: "Material climate-related risk identification, categorisation (physical/transition), likelihood, magnitude, time horizon." },
  { code: "Item 1501", title: "Governance & oversight",        form: "10-K Part I Item 1A", tcfd: "Governance",      issb: "IFRS S2 §6–9",   desc: "Board oversight structures, management committees, climate expertise, board-level KPIs, oversight processes." },
  { code: "Item 1502", title: "Strategy & planning",           form: "10-K Part I Item 1A", tcfd: "Strategy",        issb: "IFRS S2 §10–19", desc: "Material impacts on business model, strategy, and outlook across short/medium/long-term horizons." },
  { code: "Item 1503", title: "Risk management process",       form: "10-K Part I Item 1A", tcfd: "Risk Management", issb: "IFRS S2 §20–25", desc: "Processes for identification, assessment and integration into enterprise risk management." },
  { code: "Item 1504", title: "GHG emissions (Scope 1 & 2)",   form: "10-K Part II",        tcfd: "Metrics & Targets", issb: "IFRS S2 §29–37", desc: "Scope 1 gross GHG (mtCO₂e), Scope 2 (location- and market-based), GHG intensity metric." },
  { code: "Item 1505", title: "Targets & transition plans",    form: "10-K Part I Item 1A", tcfd: "Metrics & Targets", issb: "IFRS S2 §38–41", desc: "Quantitative climate targets, interim milestones, offsets/RECs used, transition plan details." },
  { code: "Reg S-X §14", title: "Financial statement effects", form: "Financial Statements", tcfd: "Strategy (financial)", issb: "IFRS S2 §26–28", desc: "Financial effects >1% of relevant line items: capex, opex, losses from physical events, transition costs." },
];

const TCFD_MAP = [
  { pillar: "Governance",      items: ["Item 1501"],               color: T.blue   },
  { pillar: "Strategy",        items: ["Item 1500","Item 1502","Item 1505"], color: T.green },
  { pillar: "Risk Management", items: ["Item 1500","Item 1503"],   color: T.amber  },
  { pillar: "Metrics & Targets", items: ["Item 1504","Item 1505","Reg S-X §14"], color: T.purple },
];

const genCompanies = (n) => Array.from({ length: n }, (_, i) => {
  const sec = SECTORS[i % SECTORS.length];
  const scope1 = Math.round(50 + sr(i * 7) * 4900);
  const scope2loc = Math.round(scope1 * (0.3 + sr(i * 13) * 0.5));
  const scope2mkt = Math.round(scope2loc * (0.6 + sr(i * 17) * 0.35));
  const revenue = Math.round(500 + sr(i * 11) * 49500);
  const intensity = +((scope1 + scope2mkt) / revenue * 1000).toFixed(1);
  const readiness = Math.round(20 + sr(i * 3) * 75);
  const hasSbti = sr(i * 5) > 0.5;
  const targetYear = hasSbti ? (2040 + Math.round(sr(i * 19) * 10)) : null;
  return {
    id: i + 1,
    name: `${sec.replace(" ","")}-Corp-${String(i+1).padStart(2,"0")}`,
    sector: sec,
    filerType: i < 15 ? "LAF" : i < 28 ? "AF" : "NAF",
    scope1,
    scope2loc,
    scope2mkt,
    revenue,
    intensity,
    readiness,
    hasSbti,
    targetYear,
    hasTransitionPlan: sr(i * 23) > 0.45,
    physRiskMat: sr(i * 31) > 0.4,
    tranRiskMat: sr(i * 37) > 0.35,
    assuranceLevel: i < 15 ? (sr(i * 41) > 0.6 ? "Reasonable" : "Limited") : "None",
  };
});

const COMPANIES = genCompanies(40);

const SCENARIO_DATA = [
  { year: 2025, orderly: 0,  delayed: 0,  hot: 0,  disorderly: 0  },
  { year: 2026, orderly: 2,  delayed: 0,  hot: 12, disorderly: 4  },
  { year: 2027, orderly: 5,  delayed: 0,  hot: 28, disorderly: 9  },
  { year: 2028, orderly: 9,  delayed: 1,  hot: 48, disorderly: 18 },
  { year: 2029, orderly: 14, delayed: 3,  hot: 72, disorderly: 31 },
  { year: 2030, orderly: 20, delayed: 8,  hot: 100,disorderly: 50 },
  { year: 2035, orderly: 45, delayed: 35, hot: 180,disorderly: 95 },
  { year: 2040, orderly: 65, delayed: 70, hot: 260,disorderly: 170},
  { year: 2050, orderly: 80, delayed: 120,hot: 420,disorderly: 310},
];

const RADAR_BASE = [
  { axis: "Governance",      value: 72 },
  { axis: "Strategy",        value: 58 },
  { axis: "Risk Mgmt",       value: 65 },
  { axis: "GHG Metrics",     value: 84 },
  { axis: "Targets",         value: 49 },
  { axis: "Fin. Effects",    value: 41 },
];

/* ── Helpers ─────────────────────────────────────────────────────────────────── */
const pill = (label, bg, fg = "#fff") => (
  <span style={{ background: bg, color: fg, borderRadius: 4, padding: "2px 7px", fontSize: 11, fontFamily: T.mono, fontWeight: 600 }}>
    {label}
  </span>
);

const card = (children, style = {}) => (
  <div style={{ background: "#fff", border: `1px solid #e2e8f0`, borderRadius: 8, padding: 20, ...style }}>
    {children}
  </div>
);

const SectionHeader = ({ title, sub }) => (
  <div style={{ marginBottom: 16 }}>
    <div style={{ fontWeight: 700, fontSize: 15, color: T.navy }}>{title}</div>
    {sub && <div style={{ fontSize: 12, color: T.slate, marginTop: 2 }}>{sub}</div>}
  </div>
);

/* ── Rescission Banner ──────────────────────────────────────────────────────── */
const RescissionBanner = () => (
  <div style={{
    background: "#fef3c7", border: "2px solid #f59e0b", borderRadius: 8,
    padding: "14px 20px", marginBottom: 24, display: "flex", gap: 14, alignItems: "flex-start"
  }}>
    <span style={{ fontSize: 22, lineHeight: 1 }}>⚠️</span>
    <div>
      <div style={{ fontWeight: 700, fontSize: 14, color: "#92400e", fontFamily: T.mono }}>
        RULE RESCINDED — 27 MARCH 2025
      </div>
      <div style={{ fontSize: 12, color: "#78350f", marginTop: 4, lineHeight: 1.6 }}>
        The SEC Enhancement and Standardization of Climate-Related Disclosures rule
        (Release No. 33-11275 / 34-99678) was <strong>rescinded by Commission vote on 27 March 2025</strong>.
        It has no legal force. All outputs in this panel are <strong>advisory and voluntary only</strong>.
        Cross-references to TCFD and ISSB IFRS S2 remain independently valid frameworks.
        Many LAF/AF issuers continue voluntary disclosure aligned to this structure.
      </div>
    </div>
  </div>
);

/* ── Tab 1: Items Overview ──────────────────────────────────────────────────── */
const ItemsOverview = () => {
  const [selected, setSelected] = useState(null);

  return (
    <div>
      <RescissionBanner />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {card(
          <>
            <SectionHeader title="Disclosure Items (Advisory Reference)" sub="Based on rescinded Release 33-11275 — voluntary use only" />
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.cream }}>
                  {["Item","Title","Form Location","TCFD Pillar"].map(h => (
                    <th key={h} style={{ padding: "6px 10px", textAlign: "left", color: T.navy, fontWeight: 700, borderBottom: `2px solid ${T.gold}`, fontFamily: T.mono, fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ITEMS.map((item, i) => (
                  <tr key={item.code}
                    onClick={() => setSelected(selected?.code === item.code ? null : item)}
                    style={{
                      background: selected?.code === item.code ? "#eff6ff" : i % 2 === 0 ? "#fff" : T.cream,
                      cursor: "pointer", transition: "background 0.15s"
                    }}
                  >
                    <td style={{ padding: "7px 10px", fontFamily: T.mono, fontSize: 11, color: T.blue, fontWeight: 700 }}>{item.code}</td>
                    <td style={{ padding: "7px 10px", color: T.navy, fontWeight: 600 }}>{item.title}</td>
                    <td style={{ padding: "7px 10px", color: T.slate, fontSize: 11 }}>{item.form}</td>
                    <td style={{ padding: "7px 10px" }}>{pill(item.tcfd, item.tcfd === "Governance" ? T.blue : item.tcfd === "Strategy" ? T.green : item.tcfd === "Risk Management" ? T.amber : T.purple)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>,
          { gridColumn: "1 / -1" }
        )}
      </div>

      {selected && card(
        <>
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 700, color: T.blue }}>{selected.code}</span>
            <span style={{ fontWeight: 700, fontSize: 14, color: T.navy }}>{selected.title}</span>
            {pill("ADVISORY", T.amber)}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: T.slate, marginBottom: 4 }}>Form Location</div>
              <div style={{ fontSize: 13, fontFamily: T.mono, color: T.navy }}>{selected.form}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: T.slate, marginBottom: 4 }}>TCFD Pillar</div>
              <div style={{ fontSize: 13, color: T.navy }}>{selected.tcfd}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: T.slate, marginBottom: 4 }}>ISSB Cross-Reference</div>
              <div style={{ fontSize: 13, fontFamily: T.mono, color: T.navy }}>{selected.issb}</div>
            </div>
          </div>
          <div style={{ background: T.cream, borderRadius: 6, padding: 12, fontSize: 12, color: T.navy, lineHeight: 1.6 }}>
            {selected.desc}
          </div>
        </>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginTop: 20 }}>
        {FILER_TYPES.map(ft => card(
          <>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.slate, marginBottom: 6 }}>{ft.type}</div>
            <div style={{ fontSize: 11, color: T.navy, marginBottom: 4 }}>Float: <strong>{ft.float}</strong></div>
            <div style={{ fontSize: 11, color: T.slate }}>Scope 1&2:</div>
            <div style={{ fontSize: 11, fontFamily: T.mono, color: T.navy, marginBottom: 4 }}>{ft.scope12Deadline}</div>
            <div style={{ fontSize: 11, color: T.slate }}>Scope 3:</div>
            <div style={{ fontSize: 11, fontFamily: T.mono, color: T.navy, marginBottom: 4 }}>{ft.scope3Deadline}</div>
            <div style={{ marginTop: 6 }}>{pill("RESCINDED", "#fee2e2", "#991b1b")}</div>
          </>,
          { borderTop: `3px solid ${T.gold}` }
        ))}
      </div>
    </div>
  );
};

/* ── Tab 2: Issuer GHG Registry ─────────────────────────────────────────────── */
const IssuerRegistry = () => {
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState("scope1");

  const filtered = useMemo(() => {
    let d = filter === "All" ? COMPANIES : COMPANIES.filter(c => c.filerType === filter);
    return [...d].sort((a, b) => b[sort] - a[sort]);
  }, [filter, sort]);

  const totals = useMemo(() => ({
    scope1: filtered.reduce((s, c) => s + c.scope1, 0),
    scope2: filtered.reduce((s, c) => s + c.scope2mkt, 0),
    sbti:   filtered.filter(c => c.hasSbti).length,
    trans:  filtered.filter(c => c.hasTransitionPlan).length,
  }), [filtered]);

  const sectorAgg = useMemo(() => {
    const map = {};
    COMPANIES.forEach(c => {
      if (!map[c.sector]) map[c.sector] = { sector: c.sector, scope1: 0, scope2: 0, n: 0 };
      map[c.sector].scope1 += c.scope1;
      map[c.sector].scope2 += c.scope2mkt;
      map[c.sector].n++;
    });
    return Object.values(map).sort((a, b) => b.scope1 - a.scope1);
  }, []);

  return (
    <div>
      <RescissionBanner />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 20 }}>
        {[
          { label: "Total Scope 1 (mtCO₂e)", value: totals.scope1.toLocaleString(), color: T.red },
          { label: "Total Scope 2 mkt (mtCO₂e)", value: totals.scope2.toLocaleString(), color: T.amber },
          { label: "SBTi-committed", value: `${totals.sbti} / ${filtered.length}`, color: T.green },
          { label: "Transition Plans", value: `${totals.trans} / ${filtered.length}`, color: T.blue },
        ].map(m => card(
          <>
            <div style={{ fontSize: 11, color: T.slate, marginBottom: 6 }}>{m.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: m.color, fontFamily: T.mono }}>{m.value}</div>
          </>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, marginBottom: 20 }}>
        {card(
          <>
            <SectionHeader title="Scope 1 + 2 by Sector" sub="Market-based Scope 2 (voluntary framework reference)" />
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={sectorAgg} margin={{ left: 0, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="sector" tick={{ fontSize: 10, fontFamily: T.mono }} angle={-35} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} />
                <Tooltip formatter={(v) => v.toLocaleString() + " mtCO₂e"} />
                <Legend />
                <Bar dataKey="scope1" name="Scope 1" fill={T.red} />
                <Bar dataKey="scope2" name="Scope 2 (mkt)" fill={T.amber} />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
        {card(
          <>
            <SectionHeader title="Voluntary Readiness Radar" sub="Average self-assessed readiness by TCFD pillar" />
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={RADAR_BASE} cx="50%" cy="50%" outerRadius={90}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10, fontFamily: T.mono }} />
                <Radar name="Avg Readiness" dataKey="value" stroke={T.navy} fill={T.navy} fillOpacity={0.25} />
              </RadarChart>
            </ResponsiveContainer>
          </>
        )}
      </div>

      {card(
        <>
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
            <SectionHeader title="Issuer GHG Registry (40 sample filers)" sub={null} />
            <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
              {["All","LAF","AF","NAF"].map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  padding: "4px 12px", borderRadius: 4, border: `1px solid ${filter === f ? T.navy : "#e2e8f0"}`,
                  background: filter === f ? T.navy : "#fff", color: filter === f ? "#fff" : T.slate,
                  fontSize: 12, cursor: "pointer", fontFamily: T.mono
                }}>{f}</button>
              ))}
              <select value={sort} onChange={e => setSort(e.target.value)} style={{ fontSize: 12, padding: "4px 8px", borderRadius: 4, border: "1px solid #e2e8f0", fontFamily: T.mono }}>
                <option value="scope1">Sort: Scope 1</option>
                <option value="scope2mkt">Sort: Scope 2</option>
                <option value="intensity">Sort: Intensity</option>
                <option value="readiness">Sort: Readiness</option>
              </select>
            </div>
          </div>
          <div style={{ maxHeight: 360, overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead style={{ position: "sticky", top: 0, background: T.cream }}>
                <tr>
                  {["Company","Sector","Filer","Scope 1","Scope 2 (mkt)","Intensity","SBTi","Trans Plan","Assurance","Readiness"].map(h => (
                    <th key={h} style={{ padding: "6px 10px", textAlign: "left", color: T.navy, fontWeight: 700, borderBottom: `2px solid ${T.gold}`, fontFamily: T.mono, fontSize: 11, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c.id} style={{ background: i % 2 === 0 ? "#fff" : T.cream }}>
                    <td style={{ padding: "6px 10px", fontWeight: 600, color: T.navy, fontFamily: T.mono, fontSize: 11 }}>{c.name}</td>
                    <td style={{ padding: "6px 10px", color: T.slate, fontSize: 11 }}>{c.sector}</td>
                    <td style={{ padding: "6px 10px" }}>{pill(c.filerType, c.filerType === "LAF" ? T.navy : c.filerType === "AF" ? T.blue : T.slate)}</td>
                    <td style={{ padding: "6px 10px", fontFamily: T.mono, color: T.red, fontWeight: 600 }}>{c.scope1.toLocaleString()}</td>
                    <td style={{ padding: "6px 10px", fontFamily: T.mono, color: T.amber, fontWeight: 600 }}>{c.scope2mkt.toLocaleString()}</td>
                    <td style={{ padding: "6px 10px", fontFamily: T.mono, color: T.slate }}>{c.intensity}</td>
                    <td style={{ padding: "6px 10px", textAlign: "center" }}>{c.hasSbti ? "✓" : "–"}</td>
                    <td style={{ padding: "6px 10px", textAlign: "center" }}>{c.hasTransitionPlan ? "✓" : "–"}</td>
                    <td style={{ padding: "6px 10px" }}>{c.assuranceLevel !== "None" ? pill(c.assuranceLevel, T.green) : <span style={{ color: T.slate, fontSize: 11 }}>None</span>}</td>
                    <td style={{ padding: "6px 10px" }}>
                      <div style={{ width: "100%", background: "#e2e8f0", borderRadius: 3, height: 6 }}>
                        <div style={{ width: `${c.readiness}%`, background: c.readiness > 70 ? T.green : c.readiness > 40 ? T.amber : T.red, borderRadius: 3, height: 6 }} />
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

/* ── Tab 3: Scenario Analysis ───────────────────────────────────────────────── */
const ScenarioAnalysis = () => {
  const [view, setView] = useState("transition");

  const physData = useMemo(() => SCENARIO_DATA.map(d => ({
    year: d.year,
    "Chronic Heat": Math.round(d.hot * 0.35 + sr(d.year) * 10),
    "Acute Events": Math.round(d.hot * 0.28 + sr(d.year + 1) * 8),
    "Sea Level": Math.round(d.hot * 0.18 + sr(d.year + 2) * 5),
    "Precipitation": Math.round(d.hot * 0.12 + sr(d.year + 3) * 4),
  })), []);

  return (
    <div>
      <RescissionBanner />
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {["transition","physical"].map(v => (
          <button key={v} onClick={() => setView(v)} style={{
            padding: "6px 16px", borderRadius: 4, border: `1px solid ${view === v ? T.navy : "#e2e8f0"}`,
            background: view === v ? T.navy : "#fff", color: view === v ? "#fff" : T.slate,
            fontSize: 12, cursor: "pointer", fontFamily: T.mono, textTransform: "capitalize"
          }}>{v} risk</button>
        ))}
      </div>

      {view === "transition" && (
        <>
          {card(
            <>
              <SectionHeader title="Transition Risk Cost Trajectories" sub="Estimated cumulative transition cost ($B) — 4 NGFS-aligned voluntary scenarios (advisory)" />
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={SCENARIO_DATA} margin={{ left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fontFamily: T.mono }} />
                  <YAxis tick={{ fontSize: 11, fontFamily: T.mono }} label={{ value: "$B", angle: -90, position: "insideLeft", fontSize: 11 }} />
                  <Tooltip formatter={(v) => `$${v}B`} />
                  <Legend />
                  <Line dataKey="orderly"    name="Orderly NZ 2050"  stroke={T.green}  strokeWidth={2} dot={false} />
                  <Line dataKey="delayed"    name="Delayed Transition" stroke={T.amber} strokeWidth={2} dot={false} strokeDasharray="5 3" />
                  <Line dataKey="disorderly" name="Disorderly"        stroke={T.purple} strokeWidth={2} dot={false} strokeDasharray="3 2" />
                  <Line dataKey="hot"        name="Hot House World"   stroke={T.red}    strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginTop: 20 }}>
            {[
              { name: "Orderly NZ 2050",     cost2030: "$20B", cost2050: "$80B", temp: "1.5°C", color: T.green },
              { name: "Below 2°C",           cost2030: "$15B", cost2050: "$70B", temp: "1.8°C", color: T.blue  },
              { name: "Disorderly",          cost2030: "$50B", cost2050: "$310B",temp: "1.8°C", color: T.purple },
              { name: "Hot House World",     cost2030: "$100B",cost2050: "$420B",temp: "3.2°C", color: T.red   },
            ].map(s => card(
              <>
                <div style={{ fontWeight: 700, color: s.color, fontSize: 13, marginBottom: 8, fontFamily: T.mono }}>{s.name}</div>
                <div style={{ fontSize: 12, color: T.slate, marginBottom: 4 }}>2030 cost: <strong style={{ color: T.navy }}>{s.cost2030}</strong></div>
                <div style={{ fontSize: 12, color: T.slate, marginBottom: 4 }}>2050 cost: <strong style={{ color: T.navy }}>{s.cost2050}</strong></div>
                <div style={{ fontSize: 12, color: T.slate }}>End-of-century: <strong style={{ color: s.color }}>{s.temp}</strong></div>
              </>,
              { borderLeft: `4px solid ${s.color}` }
            ))}
          </div>
        </>
      )}

      {view === "physical" && (
        <>
          {card(
            <>
              <SectionHeader title="Physical Risk Cost by Peril (Hot House World)" sub="Cumulative unhedged exposure ($B) under Hot House World baseline — voluntary framework" />
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={physData} margin={{ left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fontFamily: T.mono }} />
                  <YAxis tick={{ fontSize: 11, fontFamily: T.mono }} />
                  <Tooltip formatter={(v) => `$${v}B`} />
                  <Legend />
                  <Bar dataKey="Chronic Heat" stackId="a" fill={T.red}    />
                  <Bar dataKey="Acute Events" stackId="a" fill={T.amber}  />
                  <Bar dataKey="Sea Level"    stackId="a" fill={T.blue}   />
                  <Bar dataKey="Precipitation"stackId="a" fill={T.purple} />
                </BarChart>
              </ResponsiveContainer>
            </>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 20 }}>
            {card(
              <>
                <SectionHeader title="Item 1500 Physical Risk Disclosure" sub="Advisory reference for voluntary climate reporting" />
                {[
                  { label: "Acute risks", desc: "Short-duration extreme events: hurricanes, floods, wildfires, heatwaves", icon: "⚡" },
                  { label: "Chronic risks", desc: "Long-term shifts: sea level rise, temperature increases, changing precipitation patterns", icon: "🌡" },
                  { label: "Time horizons", desc: "Short (0-3yr), medium (3-10yr), long (>10yr) — consistent with strategic planning cycles", icon: "📅" },
                  { label: "Materiality threshold", desc: "Quantitative and qualitative assessment; SEC originally proposed 1% threshold for financial statement line items", icon: "📊" },
                ].map(r => (
                  <div key={r.label} style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: "1px solid #f1f5f9" }}>
                    <span style={{ fontSize: 18 }}>{r.icon}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 12, color: T.navy }}>{r.label}</div>
                      <div style={{ fontSize: 11, color: T.slate, lineHeight: 1.5 }}>{r.desc}</div>
                    </div>
                  </div>
                ))}
              </>
            )}
            {card(
              <>
                <SectionHeader title="Reg S-X §14 Financial Effects" sub="Advisory threshold: >1% of relevant P&L / balance sheet line" />
                {[
                  { item: "Capitalised costs", eg: "Resilience capex, energy-efficient equipment" },
                  { item: "Capitalised expenditures", eg: "Purchased offsets, REC premiums, abatement OPEX" },
                  { item: "Losses, charges, write-downs", eg: "Asset impairments from physical damage, stranded-asset write-offs" },
                  { item: "Risk discounts, premiums", eg: "Elevated insurance costs, carbon pricing hedges" },
                  { item: "Revenue impacts", eg: "Demand shifts from changing consumer preferences, cap-and-trade allowances" },
                ].map((r, i) => (
                  <div key={i} style={{ padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                    <div style={{ fontWeight: 600, fontSize: 12, color: T.navy }}>{r.item}</div>
                    <div style={{ fontSize: 11, color: T.slate, marginTop: 2 }}>e.g. {r.eg}</div>
                  </div>
                ))}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

/* ── Tab 4: TCFD / ISSB Cross-Reference ─────────────────────────────────────── */
const CrossReference = () => {
  const issb = [
    { ref: "IFRS S2 §6–9",   tcfd: "Governance",         sec: "Item 1501", desc: "Board oversight, management role, climate expertise" },
    { ref: "IFRS S2 §10–19", tcfd: "Strategy",           sec: "Items 1500, 1502", desc: "Risks, opportunities, business model impact, resilience" },
    { ref: "IFRS S2 §20–25", tcfd: "Risk Management",    sec: "Items 1500, 1503", desc: "Risk ID/assessment processes, integration into ERM" },
    { ref: "IFRS S2 §29–37", tcfd: "Metrics (GHG)",      sec: "Item 1504", desc: "Scope 1, 2 (loc+mkt), 3 GHG emissions, GHG intensity" },
    { ref: "IFRS S2 §38–41", tcfd: "Metrics (Targets)",  sec: "Item 1505", desc: "Climate targets, milestones, offsets, net zero commitments" },
    { ref: "IFRS S2 §26–28", tcfd: "Strategy (Fin)",     sec: "Reg S-X §14", desc: "Fin. effects of climate risks/opportunities on F/S" },
    { ref: "IFRS S2 App B",  tcfd: "Industry metrics",   sec: "N/A (SASB-aligned)", desc: "SASB industry-based metrics incorporated into ISSB S2" },
    { ref: "IFRS S1 §10–17", tcfd: "All pillars",        sec: "N/A",       desc: "General sustainability disclosure — materiality, connectivity" },
  ];

  const gaps = [
    { topic: "Scope 3 GHG",           sec: "Item 1504 (LAF only, rescinded)", issb: "IFRS S2 §29(b)", tcfd: "Metrics", note: "ISSB requires Scope 3; SEC rescinded Scope 3 requirement" },
    { topic: "Assurance",             sec: "Reasonable/Limited (rescinded)",  issb: "Recommended (not mandated)", tcfd: "N/A", note: "ISSB encourages but does not require third-party assurance" },
    { topic: "Climate resilience",    sec: "Item 1502 scenario analysis",     issb: "IFRS S2 §22–24", tcfd: "Strategy", note: "Both require qualitative/quantitative scenario analysis" },
    { topic: "Industry-specific",     sec: "N/A",                            issb: "IFRS S2 App B (SASB)", tcfd: "N/A", note: "ISSB incorporates SASB industry metrics not in SEC rule" },
    { topic: "Value chain",           sec: "Scope 3 (rescinded)",             issb: "IFRS S2 §29(b)", tcfd: "Metrics", note: "Value chain GHG required by ISSB; excluded by SEC" },
    { topic: "Time horizons",         sec: "Defined short/med/long in strategy", issb: "Entity-defined", tcfd: "Recommended", note: "SEC specified S/M/L horizons; ISSB defers to entity" },
  ];

  return (
    <div>
      <RescissionBanner />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {card(
          <>
            <SectionHeader title="TCFD Pillar Map" sub="SEC items mapped to TCFD framework (independently valid)" />
            {TCFD_MAP.map(p => (
              <div key={p.pillar} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: p.color }} />
                  <span style={{ fontWeight: 700, fontSize: 13, color: T.navy }}>{p.pillar}</span>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", paddingLeft: 18 }}>
                  {p.items.map(it => pill(it, p.color))}
                </div>
              </div>
            ))}
          </>
        )}
        {card(
          <>
            <SectionHeader title="Voluntary Framework Adoption" sub="Issuer adoption rates by framework (sample set)" />
            {[
              { label: "TCFD-aligned reporting",   pct: 72 },
              { label: "ISSB S2 voluntary",        pct: 31 },
              { label: "GRI climate standards",    pct: 65 },
              { label: "SASB industry metrics",    pct: 48 },
              { label: "SBTi commitment",          pct: 44 },
              { label: "Net Zero pledge",          pct: 38 },
              { label: "Third-party assurance",    pct: 27 },
              { label: "TCFD scenario analysis",   pct: 55 },
            ].map(r => (
              <div key={r.label} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                  <span style={{ color: T.navy }}>{r.label}</span>
                  <span style={{ fontFamily: T.mono, fontWeight: 700, color: T.navy }}>{r.pct}%</span>
                </div>
                <div style={{ background: "#e2e8f0", borderRadius: 3, height: 7 }}>
                  <div style={{ width: `${r.pct}%`, background: T.gold, borderRadius: 3, height: 7 }} />
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {card(
        <>
          <SectionHeader title="SEC vs ISSB S2 Gap Analysis" sub="Key divergences — use ISSB S2 as the globally applicable voluntary standard" />
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.cream }}>
                {["Topic","SEC (rescinded)","ISSB S2","TCFD","Commentary"].map(h => (
                  <th key={h} style={{ padding: "7px 10px", textAlign: "left", fontWeight: 700, color: T.navy, borderBottom: `2px solid ${T.gold}`, fontFamily: T.mono, fontSize: 11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {gaps.map((g, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : T.cream }}>
                  <td style={{ padding: "7px 10px", fontWeight: 700, color: T.navy }}>{g.topic}</td>
                  <td style={{ padding: "7px 10px", color: T.red, fontFamily: T.mono, fontSize: 11 }}>{g.sec}</td>
                  <td style={{ padding: "7px 10px", color: T.green, fontFamily: T.mono, fontSize: 11 }}>{g.issb}</td>
                  <td style={{ padding: "7px 10px", color: T.blue, fontFamily: T.mono, fontSize: 11 }}>{g.tcfd}</td>
                  <td style={{ padding: "7px 10px", color: T.slate, fontSize: 11 }}>{g.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {card(
        <>
          <SectionHeader title="TCFD–ISSB S2 Cross-Reference Table" sub="Valid voluntary framework — independent of rescinded SEC rule" />
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.cream }}>
                {["ISSB S2 Ref","TCFD Pillar","SEC Item (ref only)","Disclosure Requirement"].map(h => (
                  <th key={h} style={{ padding: "7px 10px", textAlign: "left", fontWeight: 700, color: T.navy, borderBottom: `2px solid ${T.gold}`, fontFamily: T.mono, fontSize: 11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {issb.map((r, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : T.cream }}>
                  <td style={{ padding: "7px 10px", fontFamily: T.mono, fontSize: 11, color: T.green, fontWeight: 700 }}>{r.ref}</td>
                  <td style={{ padding: "7px 10px" }}>{pill(r.tcfd, T.blue)}</td>
                  <td style={{ padding: "7px 10px", fontFamily: T.mono, fontSize: 11, color: T.amber }}>{r.sec}</td>
                  <td style={{ padding: "7px 10px", color: T.slate, fontSize: 11 }}>{r.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

/* ── Page Shell ─────────────────────────────────────────────────────────────── */
const TABS = [
  { key: "items",    label: "Disclosure Items"    },
  { key: "registry", label: "Issuer GHG Registry" },
  { key: "scenario", label: "Scenario Analysis"   },
  { key: "xref",     label: "TCFD / ISSB Cross-Ref" },
];

export default function SecClimateDisclosurePage() {
  const [tab, setTab] = useState("items");

  return (
    <div style={{ fontFamily: T.font, background: T.cream, minHeight: "100vh", padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.navy }}>
            SEC Climate Disclosure Panel
          </h1>
          {pill("EP-BA2", T.navy)}
          {pill("RESCINDED", "#dc2626")}
          {pill("Advisory Only", T.amber)}
        </div>
        <div style={{ fontSize: 13, color: T.slate }}>
          Release No. 33-11275 / 34-99678 — rescinded 27 March 2025 · Voluntary TCFD + ISSB S2 reference framework
        </div>
      </div>

      {/* Tab bar */}
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

      {/* Tab content */}
      {tab === "items"    && <ItemsOverview />}
      {tab === "registry" && <IssuerRegistry />}
      {tab === "scenario" && <ScenarioAnalysis />}
      {tab === "xref"     && <CrossReference />}
    </div>
  );
}
