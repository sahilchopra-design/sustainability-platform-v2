/**
 * EP-BC2 — XBRL Ingestion & Filing Import Workflow
 * Sprint BC | Data & Reporting Infrastructure
 *
 * Coverage: filing upload/import workflow, taxonomy resolution, fact extraction,
 * context/unit parsing, validation pipeline, data warehouse mapping, audit trail.
 */
import React, { useState, useMemo } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell
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

/* ── Data ──────────────────────────────────────────────────────────────────── */
const TAXONOMIES = ["EFRAG ESRS 2024","ESEF 2023","UK IFRS 2023","US GAAP 2024","DRGEP 2024","GRI XBRL 2023"];
const FORMATS    = ["iXBRL","XBRL Instance","Inline XBRL (HTML)","JSON-LD","CSV Taxonomy"];
const REGISTRANTS= ["TechCo PLC","EnergyGroup SA","RetailCorp Ltd","BankHold AG","InfraCo NV","ManufCo SpA","FintechCo Ltd","HealthGroup PLC"];

const genFilings = (n) => Array.from({ length: n }, (_, i) => {
  const facts   = Math.round(120 + sr(i * 7) * 1880);
  const errors  = Math.round(sr(i * 11) * 8);
  const warnings= Math.round(1 + sr(i * 13) * 12);
  const status  = errors === 0 ? (warnings <= 3 ? "Clean" : "Warnings") : "Errors";
  return {
    id: i + 1,
    filingId: `XBR-${String(2024000 + i).slice(1)}`,
    registrant: pick(REGISTRANTS, i * 17),
    taxonomy: pick(TAXONOMIES, i * 19),
    format: pick(FORMATS, i * 23),
    period: `FY${2022 + (i % 3)}`,
    facts,
    contexts: Math.round(facts * 0.15 + sr(i * 29) * 20),
    units: Math.round(3 + sr(i * 31) * 12),
    errors,
    warnings,
    status,
    ingestedAt: `2024-${String(Math.ceil((i+1)/3)).padStart(2,"0")}-${String(1+Math.floor(sr(i*37)*27)).padStart(2,"0")}`,
    mappedPct: Math.round(75 + sr(i * 41) * 24),
    fileSize: +(0.2 + sr(i * 43) * 4.8).toFixed(1),
  };
});

const FILINGS = genFilings(30);

const VALIDATION_RULES = [
  { code: "VAL-001", name: "Namespace prefix resolution",   category: "Taxonomy",  severity: "Error",   passRate: 96 },
  { code: "VAL-002", name: "Context period completeness",   category: "Context",   severity: "Error",   passRate: 94 },
  { code: "VAL-003", name: "Unit type consistency",         category: "Unit",      severity: "Error",   passRate: 98 },
  { code: "VAL-004", name: "Mandatory element presence",    category: "Taxonomy",  severity: "Error",   passRate: 89 },
  { code: "VAL-005", name: "Numeric precision declaration", category: "Fact",      severity: "Warning", passRate: 82 },
  { code: "VAL-006", name: "Label linkbase coverage",       category: "Taxonomy",  severity: "Warning", passRate: 91 },
  { code: "VAL-007", name: "Calculation linkbase balance",  category: "Calc",      severity: "Error",   passRate: 85 },
  { code: "VAL-008", name: "XBRL 2.1 schema compliance",   category: "Schema",    severity: "Error",   passRate: 99 },
  { code: "VAL-009", name: "iXBRL inline embedding rules",  category: "Format",    severity: "Error",   passRate: 93 },
  { code: "VAL-010", name: "Concept dimension hypercube",   category: "Dimension", severity: "Warning", passRate: 78 },
  { code: "VAL-011", name: "Entity identifier scheme",      category: "Context",   severity: "Error",   passRate: 97 },
  { code: "VAL-012", name: "Duplicate fact detection",      category: "Fact",      severity: "Warning", passRate: 88 },
];

const FACT_CONCEPTS = [
  { concept: "ifrs-full:Revenue",                    taxonomy: "EFRAG ESRS 2024", count: 28, mapped: true  },
  { concept: "esrs:GHGEmissionsScope1",              taxonomy: "EFRAG ESRS 2024", count: 24, mapped: true  },
  { concept: "esrs:GHGEmissionsScope2LocationBased", taxonomy: "EFRAG ESRS 2024", count: 22, mapped: true  },
  { concept: "esrs:GHGEmissionsScope3Total",         taxonomy: "EFRAG ESRS 2024", count: 19, mapped: true  },
  { concept: "esrs:NumberOfEmployees",               taxonomy: "EFRAG ESRS 2024", count: 26, mapped: true  },
  { concept: "esrs:WaterConsumption",                taxonomy: "EFRAG ESRS 2024", count: 18, mapped: true  },
  { concept: "esrs:TotalEnergyConsumption",          taxonomy: "EFRAG ESRS 2024", count: 21, mapped: true  },
  { concept: "esrs:BiodiversityImpactScore",         taxonomy: "EFRAG ESRS 2024", count: 11, mapped: false },
  { concept: "esrs:SocialRiskScore",                 taxonomy: "EFRAG ESRS 2024", count: 8,  mapped: false },
  { concept: "esef:CarbonOffset",                    taxonomy: "ESEF 2023",       count: 15, mapped: true  },
  { concept: "us-gaap:NetIncomeLoss",                taxonomy: "US GAAP 2024",    count: 30, mapped: true  },
  { concept: "us-gaap:Assets",                       taxonomy: "US GAAP 2024",    count: 30, mapped: true  },
];

const INGEST_TREND = Array.from({ length: 12 }, (_, i) => ({
  month: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i],
  filings: Math.round(4 + sr(i * 7) * 18),
  facts:   Math.round(800 + sr(i * 11) * 6000),
  errors:  Math.round(sr(i * 13) * 25),
}));

const WAREHOUSE_TABLES = [
  { table: "xbrl_facts",           rows: 142870, lastLoad: "2024-11-28", status: "Live"   },
  { table: "xbrl_contexts",        rows: 21430,  lastLoad: "2024-11-28", status: "Live"   },
  { table: "xbrl_units",           rows: 1240,   lastLoad: "2024-11-28", status: "Live"   },
  { table: "xbrl_filings",         rows: 312,    lastLoad: "2024-11-28", status: "Live"   },
  { table: "xbrl_taxonomy_labels", rows: 48920,  lastLoad: "2024-11-25", status: "Live"   },
  { table: "xbrl_calc_linkbase",   rows: 9870,   lastLoad: "2024-11-25", status: "Live"   },
  { table: "xbrl_validation_log",  rows: 8340,   lastLoad: "2024-11-28", status: "Live"   },
  { table: "xbrl_concept_map",     rows: 2180,   lastLoad: "2024-11-20", status: "Stale"  },
  { table: "xbrl_dim_members",     rows: 6450,   lastLoad: "2024-11-15", status: "Stale"  },
];

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

const statusColor = (s) => ({ Clean: T.green, Warnings: T.amber, Errors: T.red }[s] || T.slate);

/* ── Tab 1: Filing Import Workflow ──────────────────────────────────────── */
const FilingImport = () => {
  const [taxFilter, setTaxFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const filtered = useMemo(() => {
    let d = FILINGS;
    if (taxFilter !== "All") d = d.filter(f => f.taxonomy === taxFilter);
    if (statusFilter !== "All") d = d.filter(f => f.status === statusFilter);
    return d;
  }, [taxFilter, statusFilter]);

  const statusDist = ["Clean","Warnings","Errors"].map(s => ({
    status: s, count: FILINGS.filter(f => f.status === s).length,
  }));

  const taxDist = TAXONOMIES.map(t => ({
    taxonomy: t.split(" ")[0],
    count: FILINGS.filter(f => f.taxonomy === t).length,
  }));

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 20 }}>
        {[
          { label: "Total Filings Ingested", value: FILINGS.length },
          { label: "Total Facts Extracted",  value: FILINGS.reduce((s,f) => s+f.facts, 0).toLocaleString(), color: T.blue },
          { label: "Clean (no errors)",       value: FILINGS.filter(f=>f.status==="Clean").length, color: T.green },
          { label: "Filings with Errors",     value: FILINGS.filter(f=>f.status==="Errors").length, color: T.red },
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
            <SH title="Filing Status Distribution" />
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={statusDist}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="status" tick={{ fontSize: 12, fontFamily: T.mono }} />
                <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} />
                <Tooltip />
                <Bar dataKey="count" name="Filings" radius={[4,4,0,0]}>
                  {statusDist.map((d,i) => <Cell key={i} fill={statusColor(d.status)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
        {card(
          <>
            <SH title="Filings by Taxonomy" />
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={taxDist} margin={{ bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="taxonomy" tick={{ fontSize: 10, fontFamily: T.mono }} angle={-25} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} />
                <Tooltip />
                <Bar dataKey="count" name="Filings" fill={T.navy} />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
      </div>

      {card(
        <>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
            <SH title="Filing Register" sub={null} />
            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              <select value={taxFilter} onChange={e => setTaxFilter(e.target.value)} style={{ fontSize: 12, padding: "4px 8px", borderRadius: 4, border: "1px solid #e2e8f0", fontFamily: T.mono }}>
                <option>All</option>{TAXONOMIES.map(t => <option key={t}>{t}</option>)}
              </select>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ fontSize: 12, padding: "4px 8px", borderRadius: 4, border: "1px solid #e2e8f0", fontFamily: T.mono }}>
                <option>All</option><option>Clean</option><option>Warnings</option><option>Errors</option>
              </select>
            </div>
          </div>
          <div style={{ maxHeight: 340, overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead style={{ position: "sticky", top: 0, background: T.cream }}>
                <tr>
                  {["Filing ID","Registrant","Taxonomy","Format","Period","Facts","Contexts","Errors","Warnings","Mapped %","Size (MB)","Status"].map(h => (
                    <th key={h} style={{ padding: "6px 8px", textAlign: "left", color: T.navy, fontWeight: 700, borderBottom: `2px solid ${T.gold}`, fontFamily: T.mono, fontSize: 10, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((f, i) => (
                  <tr key={f.id} style={{ background: i % 2 === 0 ? "#fff" : T.cream }}>
                    <td style={{ padding: "6px 8px", fontFamily: T.mono, fontSize: 11, color: T.blue, fontWeight: 700 }}>{f.filingId}</td>
                    <td style={{ padding: "6px 8px", fontSize: 11, color: T.navy, fontWeight: 600 }}>{f.registrant}</td>
                    <td style={{ padding: "6px 8px", fontSize: 10, color: T.slate }}>{f.taxonomy.split(" ")[0]}</td>
                    <td style={{ padding: "6px 8px", fontSize: 10, color: T.slate }}>{f.format.split(" ")[0]}</td>
                    <td style={{ padding: "6px 8px", fontFamily: T.mono, fontSize: 11 }}>{f.period}</td>
                    <td style={{ padding: "6px 8px", fontFamily: T.mono, color: T.navy }}>{f.facts.toLocaleString()}</td>
                    <td style={{ padding: "6px 8px", fontFamily: T.mono, color: T.slate }}>{f.contexts}</td>
                    <td style={{ padding: "6px 8px", fontFamily: T.mono, color: f.errors > 0 ? T.red : T.green, fontWeight: 700 }}>{f.errors}</td>
                    <td style={{ padding: "6px 8px", fontFamily: T.mono, color: f.warnings > 5 ? T.amber : T.slate }}>{f.warnings}</td>
                    <td style={{ padding: "6px 8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <div style={{ width: 40, background: "#e2e8f0", borderRadius: 3, height: 5 }}>
                          <div style={{ width: `${f.mappedPct}%`, background: f.mappedPct > 90 ? T.green : T.amber, borderRadius: 3, height: 5 }} />
                        </div>
                        <span style={{ fontSize: 10, fontFamily: T.mono }}>{f.mappedPct}%</span>
                      </div>
                    </td>
                    <td style={{ padding: "6px 8px", fontFamily: T.mono, fontSize: 11, color: T.slate }}>{f.fileSize}</td>
                    <td style={{ padding: "6px 8px" }}>{pill(f.status, statusColor(f.status))}</td>
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

/* ── Tab 2: Validation Pipeline ─────────────────────────────────────────── */
const ValidationPipeline = () => {
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 20 }}>
        {[
          { label: "Validation Rules", value: VALIDATION_RULES.length },
          { label: "Avg Pass Rate", value: `${Math.round(VALIDATION_RULES.reduce((s,r)=>s+r.passRate,0)/VALIDATION_RULES.length)}%`, color: T.green },
          { label: "Error-class rules < 90%", value: VALIDATION_RULES.filter(r=>r.severity==="Error"&&r.passRate<90).length, color: T.red },
        ].map(m => card(
          <>
            <div style={{ fontSize: 11, color: T.slate, marginBottom: 6 }}>{m.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: m.color || T.navy, fontFamily: T.mono }}>{m.value}</div>
          </>
        ))}
      </div>

      {card(
        <>
          <SH title="Validation Rule Pass Rates" sub="% of ingested filings passing each rule" />
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={VALIDATION_RULES} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" domain={[60, 100]} tick={{ fontSize: 10, fontFamily: T.mono }} unit="%" />
              <YAxis dataKey="code" type="category" tick={{ fontSize: 10, fontFamily: T.mono }} width={60} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Bar dataKey="passRate" name="Pass Rate %" radius={[0,4,4,0]}>
                {VALIDATION_RULES.map((r, i) => <Cell key={i} fill={r.passRate >= 95 ? T.green : r.passRate >= 85 ? T.amber : T.red} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </>,
        { marginBottom: 20 }
      )}

      {card(
        <>
          <SH title="Validation Rule Reference" sub="12 rules across taxonomy, fact, context, and format categories" />
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.cream }}>
                {["Rule","Name","Category","Severity","Pass Rate"].map(h => (
                  <th key={h} style={{ padding: "6px 10px", textAlign: "left", fontWeight: 700, color: T.navy, borderBottom: `2px solid ${T.gold}`, fontFamily: T.mono, fontSize: 11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {VALIDATION_RULES.map((r, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : T.cream }}>
                  <td style={{ padding: "6px 10px", fontFamily: T.mono, fontSize: 11, color: T.blue, fontWeight: 700 }}>{r.code}</td>
                  <td style={{ padding: "6px 10px", fontWeight: 600, color: T.navy }}>{r.name}</td>
                  <td style={{ padding: "6px 10px" }}>{pill(r.category, T.teal)}</td>
                  <td style={{ padding: "6px 10px" }}>{pill(r.severity, r.severity === "Error" ? T.red : T.amber)}</td>
                  <td style={{ padding: "6px 10px" }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <div style={{ width: 80, background: "#e2e8f0", borderRadius: 3, height: 7 }}>
                        <div style={{ width: `${r.passRate}%`, background: r.passRate>=95?T.green:r.passRate>=85?T.amber:T.red, borderRadius: 3, height: 7 }} />
                      </div>
                      <span style={{ fontFamily: T.mono, fontSize: 11, fontWeight: 700, color: r.passRate>=95?T.green:r.passRate>=85?T.amber:T.red }}>{r.passRate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

/* ── Tab 3: Fact Extraction & Mapping ───────────────────────────────────── */
const FactMapping = () => {
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 20 }}>
        {[
          { label: "Tracked Concepts", value: FACT_CONCEPTS.length },
          { label: "Mapped to Warehouse", value: FACT_CONCEPTS.filter(c=>c.mapped).length, color: T.green },
          { label: "Unmapped (gap)", value: FACT_CONCEPTS.filter(c=>!c.mapped).length, color: T.amber },
          { label: "Total Fact Occurrences", value: FACT_CONCEPTS.reduce((s,c)=>s+c.count,0), color: T.blue },
        ].map(m => card(
          <>
            <div style={{ fontSize: 11, color: T.slate, marginBottom: 6 }}>{m.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: m.color || T.navy, fontFamily: T.mono }}>{m.value}</div>
          </>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, marginBottom: 20 }}>
        {card(
          <>
            <SH title="Concept Frequency by Filing" sub="Number of filings containing each XBRL concept" />
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={FACT_CONCEPTS} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 10, fontFamily: T.mono }} />
                <YAxis dataKey="concept" type="category" tick={{ fontSize: 9, fontFamily: T.mono }} width={200} />
                <Tooltip />
                <Bar dataKey="count" name="# Filings" radius={[0,4,4,0]}>
                  {FACT_CONCEPTS.map((c,i) => <Cell key={i} fill={c.mapped ? T.navy : T.amber} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
        {card(
          <>
            <SH title="Ingest Volume Trend" sub="Monthly filings + total facts" />
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={INGEST_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 9, fontFamily: T.mono }} interval={1} />
                <YAxis yAxisId="left"  tick={{ fontSize: 9, fontFamily: T.mono }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9, fontFamily: T.mono }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left"  dataKey="filings" name="Filings"   stroke={T.navy}  strokeWidth={2} dot={false} />
                <Line yAxisId="right" dataKey="facts"   name="Facts"     stroke={T.gold}  strokeWidth={2} dot={false} />
                <Line yAxisId="left"  dataKey="errors"  name="Errors"    stroke={T.red}   strokeWidth={1} dot={false} strokeDasharray="3 2" />
              </LineChart>
            </ResponsiveContainer>
          </>
        )}
      </div>

      {card(
        <>
          <SH title="Concept → Warehouse Mapping Status" sub="XBRL concept to data warehouse column mapping" />
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.cream }}>
                {["Concept","Taxonomy","# Filings","Mapped","Warehouse Column"].map(h => (
                  <th key={h} style={{ padding: "6px 10px", textAlign: "left", fontWeight: 700, color: T.navy, borderBottom: `2px solid ${T.gold}`, fontFamily: T.mono, fontSize: 11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FACT_CONCEPTS.map((c, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : T.cream }}>
                  <td style={{ padding: "6px 10px", fontFamily: T.mono, fontSize: 11, color: T.blue }}>{c.concept}</td>
                  <td style={{ padding: "6px 10px", fontSize: 11, color: T.slate }}>{c.taxonomy.split(" ")[0]}</td>
                  <td style={{ padding: "6px 10px", fontFamily: T.mono, color: T.navy }}>{c.count}</td>
                  <td style={{ padding: "6px 10px" }}>{pill(c.mapped ? "Yes" : "Gap", c.mapped ? T.green : T.amber)}</td>
                  <td style={{ padding: "6px 10px", fontFamily: T.mono, fontSize: 11, color: c.mapped ? T.teal : T.slate }}>
                    {c.mapped ? `xbrl_facts.${c.concept.split(":")[1]?.toLowerCase().slice(0,24)}` : "— unmapped —"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

/* ── Tab 4: Data Warehouse & Audit Trail ─────────────────────────────────── */
const DataWarehouse = () => {
  const pipeline = [
    { step: "1. Upload / Fetch",   desc: "HTTP upload or SFTP pull from registrant or regulator portal",       status: "Live",    icon: "📥" },
    { step: "2. Format Detection", desc: "Detect iXBRL, XBRL Instance, JSON-LD; extract embedded documents",  status: "Live",    icon: "🔍" },
    { step: "3. Schema Parse",     desc: "Resolve DTS: load taxonomy schemas, linkbases, label arcs",          status: "Live",    icon: "📐" },
    { step: "4. Fact Extraction",  desc: "Extract numeric/string facts, contexts, units from instance doc",    status: "Live",    icon: "⚗️" },
    { step: "5. Validation",       desc: "Run 12 validation rules; log errors/warnings to xbrl_validation_log",status: "Live",    icon: "✅" },
    { step: "6. Concept Mapping",  desc: "Map XBRL concepts to internal taxonomy / warehouse schema",          status: "Partial", icon: "🗺️" },
    { step: "7. Warehouse Load",   desc: "Upsert to xbrl_facts, xbrl_contexts, xbrl_units, xbrl_filings",     status: "Live",    icon: "🏭" },
    { step: "8. Audit Trail",      desc: "Append immutable log entry: who, what, when, hash, row counts",      status: "Live",    icon: "📋" },
  ];

  return (
    <div>
      {card(
        <>
          <SH title="Ingestion Pipeline Stages" sub="End-to-end XBRL filing import workflow" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {pipeline.map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 12, padding: "12px 14px", background: T.cream, borderRadius: 6, alignItems: "flex-start" }}>
                <span style={{ fontSize: 20 }}>{s.icon}</span>
                <div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 12, color: T.navy, fontFamily: T.mono }}>{s.step}</span>
                    {pill(s.status, s.status === "Live" ? T.green : T.amber)}
                  </div>
                  <div style={{ fontSize: 11, color: T.slate, lineHeight: 1.5 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </>,
        { marginBottom: 20 }
      )}

      {card(
        <>
          <SH title="Data Warehouse Tables" sub="xbrl_* schema — row counts and freshness" />
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.cream }}>
                {["Table","Row Count","Last Load","Status","Size Est."].map(h => (
                  <th key={h} style={{ padding: "6px 10px", textAlign: "left", fontWeight: 700, color: T.navy, borderBottom: `2px solid ${T.gold}`, fontFamily: T.mono, fontSize: 11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {WAREHOUSE_TABLES.map((t, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : T.cream }}>
                  <td style={{ padding: "6px 10px", fontFamily: T.mono, fontSize: 11, color: T.blue, fontWeight: 700 }}>{t.table}</td>
                  <td style={{ padding: "6px 10px", fontFamily: T.mono, color: T.navy, fontWeight: 600 }}>{t.rows.toLocaleString()}</td>
                  <td style={{ padding: "6px 10px", fontFamily: T.mono, fontSize: 11, color: T.slate }}>{t.lastLoad}</td>
                  <td style={{ padding: "6px 10px" }}>{pill(t.status, t.status === "Live" ? T.green : T.amber)}</td>
                  <td style={{ padding: "6px 10px", fontSize: 11, color: T.slate, fontFamily: T.mono }}>
                    {t.rows > 50000 ? `${(t.rows / 1000).toFixed(0)}K rows · ~${(t.rows * 0.0006).toFixed(1)} MB` : `${t.rows.toLocaleString()} rows`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

/* ── Page Shell ──────────────────────────────────────────────────────────── */
const TABS = [
  { key: "import",     label: "Filing Import"      },
  { key: "validation", label: "Validation Pipeline" },
  { key: "facts",      label: "Fact & Mapping"     },
  { key: "warehouse",  label: "Data Warehouse"     },
];

export default function XbrlIngestionPage() {
  const [tab, setTab] = useState("import");

  return (
    <div style={{ fontFamily: T.font, background: T.cream, minHeight: "100vh", padding: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.navy }}>XBRL Ingestion & Filing Import</h1>
          {pill("EP-BC2", T.navy)}
          {pill("Data", T.purple)}
        </div>
        <div style={{ fontSize: 13, color: T.slate }}>
          30 filings · EFRAG ESRS 2024 · ESEF · US GAAP · 12 validation rules · concept mapping · warehouse pipeline
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

      {tab === "import"     && <FilingImport />}
      {tab === "validation" && <ValidationPipeline />}
      {tab === "facts"      && <FactMapping />}
      {tab === "warehouse"  && <DataWarehouse />}
    </div>
  );
}
