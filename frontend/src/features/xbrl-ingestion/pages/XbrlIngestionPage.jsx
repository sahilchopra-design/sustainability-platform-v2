/**
 * EP-BC2 — XBRL Ingestion & Filing Import Workflow
 * Sprint BC | Data & Reporting Infrastructure
 *
 * Wired to the real backend parser: services/xbrl_ingestion_engine.py
 * (regex-based iXBRL / XBRL-XML fact extraction via CONCEPT_TO_DP taxonomy
 * mapping table), exposed at POST /api/v1/xbrl/ingest{,/ixbrl,/xbrl-xml}.
 *
 * Coverage: filing upload/paste workflow, live parsing against the real
 * engine, taxonomy resolution, fact extraction, context/unit parsing,
 * concept-mapping reference data, and an ingestion register built from
 * genuinely parsed filings (no fabricated data).
 */
import React, { useState, useMemo, useEffect } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell
} from "recharts";

const API = "http://localhost:8001";

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

/* ── Real demo iXBRL fragment ──────────────────────────────────────────────
 * A genuine, minimal ESRS-tagged iXBRL document. This is not a screenshot or
 * mock — it is valid input the backend regex parser (xbrl_ingestion_engine.py)
 * actually extracts entity/LEI/period/facts from. Users can replace this with
 * their own filing via paste or upload.
 */
const DEMO_IXBRL = `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml"
      xmlns:ix="http://www.xbrl.org/2013/inlineXBRL"
      xmlns:xbrli="http://www.xbrl.org/2003/instance"
      xmlns:esrs="http://xbrl.efrag.org/taxonomy/esrs/2024"
      xmlns:iso4217="http://www.xbrl.org/2003/iso4217">
<head>
  <title>ESRS Report - Demo Industrials SE</title>
</head>
<body>
<ix:header>
  <ix:hidden>
    <ix:nonNumeric name="esrs:EntityName" contextRef="ctx_entity">Demo Industrials SE</ix:nonNumeric>
  </ix:hidden>
</ix:header>
<xbrli:context id="ctx_2024">
  <xbrli:entity>
    <xbrli:identifier scheme="http://standards.iso.org/iso/17442">529900T8BM49AURSDO55</xbrli:identifier>
  </xbrli:entity>
  <xbrli:period>
    <xbrli:startDate>2024-01-01</xbrli:startDate>
    <xbrli:endDate>2024-12-31</xbrli:endDate>
  </xbrli:period>
</xbrli:context>
<p>Gross Scope 1 GHG emissions:
<ix:nonFraction name="esrs:GrossScope1GHGEmissions" contextRef="ctx_2024" unitRef="u_tco2e" decimals="0">12,450</ix:nonFraction> tCO2e
</p>
<p>Total Scope 3 GHG emissions:
<ix:nonFraction name="esrs:TotalScope3GHGEmissions" contextRef="ctx_2024" unitRef="u_tco2e" decimals="0">84,200</ix:nonFraction> tCO2e
</p>
<p>Total energy consumption:
<ix:nonFraction name="esrs:TotalEnergyConsumption" contextRef="ctx_2024" unitRef="u_mwh" decimals="0">64100</ix:nonFraction> MWh
</p>
<p>Unmapped custom concept:
<ix:nonFraction name="esrs:SomeUnmappedFutureConcept" contextRef="ctx_2024" unitRef="u_pure" decimals="0">7</ix:nonFraction>
</p>
</body>
</html>`;

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

const statusOf = (h) => (h.facts === 0 ? "Empty" : h.unmapped === 0 ? "Clean" : h.mapped === 0 ? "Unmapped" : "Partial");
const statusColor = (s) => ({ Clean: T.green, Partial: T.amber, Unmapped: T.red, Empty: T.slate }[s] || T.slate);

/* ── API helper ───────────────────────────────────────────────────────────── */
async function callIngestApi(content, formatHint) {
  const path = formatHint === "ixbrl" ? "/ingest/ixbrl" : formatHint === "xbrl_xml" ? "/ingest/xbrl-xml" : "/ingest";
  const r = await fetch(`${API}/api/v1/xbrl${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, format_hint: formatHint === "auto" ? null : formatHint }),
  });
  if (!r.ok) {
    let detail = `HTTP ${r.status}`;
    try { const j = await r.json(); if (j.detail) detail = j.detail; } catch (_e) { /* ignore */ }
    throw new Error(detail);
  }
  return r.json();
}

/* ── Tab 1: Live Filing Parser + real ingestion register ────────────────── */
const FilingImport = ({ history, setHistory, conceptMap }) => {
  const [content, setContent] = useState(DEMO_IXBRL);
  const [formatHint, setFormatHint] = useState("auto");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [taxFilter, setTaxFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const runParse = async (sourceContent, hint) => {
    setLoading(true);
    setError(null);
    try {
      const data = await callIngestApi(sourceContent, hint);
      setResult(data);
      setHistory((h) => [{
        id: h.length + 1,
        parsedAt: new Date().toLocaleString(),
        entityName: data.entity_name || "(entity name not found)",
        entityId: data.entity_id || "—",
        taxonomy: data.detected_taxonomy,
        format: data.source_format,
        period: data.reporting_period,
        facts: data.total_facts_extracted,
        mapped: data.mapped_facts,
        unmapped: data.unmapped_facts,
        mappingRate: data.mapping_rate_pct,
        readyForDb: data.ready_for_db,
        rawFacts: data.facts,
        warnings: data.warnings,
      }, ...h]);
    } catch (e) {
      setError(e.message || `Could not reach XBRL ingestion API at ${API}. Is the backend running (backend/server.py, port 8001)?`);
    } finally {
      setLoading(false);
    }
  };

  const handleFile = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setContent(String(ev.target.result || ""));
    reader.readAsText(file);
  };

  const taxonomies = useMemo(() => ["All", ...Array.from(new Set(history.map(h => h.taxonomy)))], [history]);

  const filtered = useMemo(() => {
    let d = history;
    if (taxFilter !== "All") d = d.filter(f => f.taxonomy === taxFilter);
    if (statusFilter !== "All") d = d.filter(f => statusOf(f) === statusFilter);
    return d;
  }, [history, taxFilter, statusFilter]);

  const totalFacts = history.reduce((s, f) => s + f.facts, 0);
  const cleanCount = history.filter(f => statusOf(f) === "Clean").length;
  const unmappedCount = history.filter(f => statusOf(f) === "Unmapped").length;
  const avgMappingRate = history.length ? (history.reduce((s, f) => s + f.mappingRate, 0) / history.length) : 0;

  const statusDist = ["Clean", "Partial", "Unmapped", "Empty"].map(s => ({
    status: s, count: history.filter(f => statusOf(f) === s).length,
  })).filter(d => d.count > 0);

  const taxDist = Array.from(new Set(history.map(h => h.taxonomy))).map(t => ({
    taxonomy: t, count: history.filter(f => f.taxonomy === t).length,
  }));

  return (
    <div>
      {/* Real live parser */}
      {card(
        <>
          <SH title="Parse a Filing" sub="Paste iXBRL/HTML or XBRL-XML content, or upload a file. This calls the real backend parser (XBRLIngestionEngine.ingest_ixbrl / ingest_xbrl_xml) — no synthetic data." />
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
            <select value={formatHint} onChange={e => setFormatHint(e.target.value)}
              style={{ fontSize: 12, padding: "6px 10px", borderRadius: 4, border: "1px solid #e2e8f0", fontFamily: T.mono }}>
              <option value="auto">Auto-detect format</option>
              <option value="ixbrl">iXBRL (inline HTML)</option>
              <option value="xbrl_xml">XBRL XML instance</option>
            </select>
            <label style={{ fontSize: 12, padding: "6px 12px", borderRadius: 4, border: `1px solid ${T.navy}`, color: T.navy, cursor: "pointer", background: "#fff" }}>
              Upload file
              <input type="file" accept=".html,.htm,.xml,.xbrl,.txt" onChange={handleFile} style={{ display: "none" }} />
            </label>
            <button onClick={() => setContent(DEMO_IXBRL)}
              style={{ fontSize: 12, padding: "6px 12px", borderRadius: 4, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", color: T.slate }}>
              Load demo iXBRL fragment
            </button>
            <button onClick={() => setContent("")}
              style={{ fontSize: 12, padding: "6px 12px", borderRadius: 4, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", color: T.slate }}>
              Clear
            </button>
            <button onClick={() => runParse(content, formatHint)} disabled={loading || !content.trim()}
              style={{ fontSize: 13, fontWeight: 700, padding: "8px 20px", borderRadius: 4, border: "none", background: loading ? "#94a3b8" : T.navy, color: "#fff", cursor: loading ? "default" : "pointer", marginLeft: "auto" }}>
              {loading ? "Parsing…" : "Parse Filing"}
            </button>
          </div>
          <textarea value={content} onChange={e => setContent(e.target.value)} rows={10} spellCheck={false}
            placeholder="Paste iXBRL HTML or XBRL XML instance document content here…"
            style={{ width: "100%", boxSizing: "border-box", fontFamily: T.mono, fontSize: 11, padding: 12, borderRadius: 6, border: "1px solid #e2e8f0", background: T.cream, color: T.navy, resize: "vertical" }} />
          {error && (
            <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 6, background: "#fef2f2", border: "1px solid #fecaca", color: T.red, fontSize: 12 }}>
              {error}
            </div>
          )}
        </>,
        { marginBottom: 20 }
      )}

      {/* Real extracted-fact detail for the most recent parse */}
      {result && card(
        <>
          <SH title="Extracted Facts — Latest Parse" sub={`${result.entity_name || "(no entity name found)"} · ${result.entity_id || "no LEI found"} · ${result.reporting_period} · ${result.source_format} · detected taxonomy: ${result.detected_taxonomy}`} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 14 }}>
            {[
              { label: "Facts Extracted", value: result.total_facts_extracted },
              { label: "Mapped to Platform DP", value: result.mapped_facts, color: T.green },
              { label: "Unmapped", value: result.unmapped_facts, color: result.unmapped_facts > 0 ? T.amber : T.slate },
              { label: "Mapping Rate", value: `${result.mapping_rate_pct}%`, color: result.mapping_rate_pct >= 75 ? T.green : T.amber },
            ].map((m, i) => (
              <div key={i} style={{ background: T.cream, borderRadius: 6, padding: "10px 14px" }}>
                <div style={{ fontSize: 10, color: T.slate }}>{m.label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: m.color || T.navy, fontFamily: T.mono }}>{m.value}</div>
              </div>
            ))}
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.cream }}>
                {["Concept", "Value", "Unit", "Context", "Period", "Platform DP", "ESRS/DR", "Mapped"].map(h => (
                  <th key={h} style={{ padding: "6px 10px", textAlign: "left", fontWeight: 700, color: T.navy, borderBottom: `2px solid ${T.gold}`, fontFamily: T.mono, fontSize: 10 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.facts.length === 0 && (
                <tr><td colSpan={8} style={{ padding: "12px 10px", color: T.slate, fontSize: 12 }}>No numeric facts found in this document.</td></tr>
              )}
              {result.facts.map((f, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : T.cream }}>
                  <td style={{ padding: "6px 10px", fontFamily: T.mono, fontSize: 11, color: T.blue }}>{f.concept}</td>
                  <td style={{ padding: "6px 10px", fontFamily: T.mono, fontWeight: 700, color: T.navy }}>{f.value.toLocaleString()}</td>
                  <td style={{ padding: "6px 10px", fontFamily: T.mono, fontSize: 11, color: T.slate }}>{f.unit}</td>
                  <td style={{ padding: "6px 10px", fontFamily: T.mono, fontSize: 10, color: T.slate }}>{f.context_id}</td>
                  <td style={{ padding: "6px 10px", fontFamily: T.mono, fontSize: 10, color: T.slate }}>{f.period_type === "duration" ? `${f.period_start} → ${f.period_end}` : f.period_end}</td>
                  <td style={{ padding: "6px 10px", fontFamily: T.mono, fontSize: 11, color: T.teal }}>{f.dp_id || "—"}</td>
                  <td style={{ padding: "6px 10px", fontSize: 11, color: T.slate }}>{f.esrs ? `${f.esrs} / ${f.dr}` : "—"}</td>
                  <td style={{ padding: "6px 10px" }}>{pill(f.mapped ? "Yes" : "Gap", f.mapped ? T.green : T.amber)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {result.warnings && result.warnings.length > 0 && (
            <div style={{ marginTop: 10, fontSize: 11, color: T.amber }}>
              Parser warnings: {result.warnings.join("; ")}
            </div>
          )}
        </>,
        { marginBottom: 20 }
      )}

      {/* Real ingestion register — built only from filings the user has actually parsed */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 20 }}>
        {[
          { label: "Filings Parsed This Session", value: history.length },
          { label: "Total Facts Extracted", value: totalFacts.toLocaleString(), color: T.blue },
          { label: "Fully Mapped (Clean)", value: cleanCount, color: T.green },
          { label: "Avg Mapping Rate", value: `${avgMappingRate.toFixed(1)}%`, color: unmappedCount > 0 ? T.amber : T.green },
        ].map(m => card(
          <>
            <div style={{ fontSize: 11, color: T.slate, marginBottom: 6 }}>{m.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: m.color || T.navy, fontFamily: T.mono }}>{m.value}</div>
          </>
        ))}
      </div>

      {history.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
          {card(
            <>
              <SH title="Filing Status Distribution" sub="Computed from filings actually parsed this session" />
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={statusDist}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="status" tick={{ fontSize: 12, fontFamily: T.mono }} />
                  <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" name="Filings" radius={[4, 4, 0, 0]}>
                    {statusDist.map((d, i) => <Cell key={i} fill={statusColor(d.status)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </>
          )}
          {card(
            <>
              <SH title="Filings by Detected Taxonomy" sub="Detected from namespace/prefix in the parsed document" />
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={taxDist} margin={{ bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="taxonomy" tick={{ fontSize: 10, fontFamily: T.mono }} angle={-25} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" name="Filings" fill={T.navy} />
                </BarChart>
              </ResponsiveContainer>
            </>
          )}
        </div>
      )}

      {card(
        <>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
            <SH title="Filing Register (this session)" sub={null} />
            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              <select value={taxFilter} onChange={e => setTaxFilter(e.target.value)} style={{ fontSize: 12, padding: "4px 8px", borderRadius: 4, border: "1px solid #e2e8f0", fontFamily: T.mono }}>
                {taxonomies.map(t => <option key={t}>{t}</option>)}
              </select>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ fontSize: 12, padding: "4px 8px", borderRadius: 4, border: "1px solid #e2e8f0", fontFamily: T.mono }}>
                <option>All</option><option>Clean</option><option>Partial</option><option>Unmapped</option><option>Empty</option>
              </select>
            </div>
          </div>
          {history.length === 0 ? (
            <div style={{ padding: "24px 10px", textAlign: "center", color: T.slate, fontSize: 13 }}>
              No filings parsed yet this session. Use "Parse a Filing" above — try the pre-loaded demo iXBRL fragment.
            </div>
          ) : (
            <div style={{ maxHeight: 340, overflowY: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead style={{ position: "sticky", top: 0, background: T.cream }}>
                  <tr>
                    {["#", "Entity", "LEI/Entity ID", "Taxonomy", "Format", "Period", "Facts", "Mapped", "Unmapped", "Mapping %", "Ready for DB", "Parsed At"].map(h => (
                      <th key={h} style={{ padding: "6px 8px", textAlign: "left", color: T.navy, fontWeight: 700, borderBottom: `2px solid ${T.gold}`, fontFamily: T.mono, fontSize: 10, whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((f, i) => (
                    <tr key={f.id} style={{ background: i % 2 === 0 ? "#fff" : T.cream }}>
                      <td style={{ padding: "6px 8px", fontFamily: T.mono, fontSize: 11, color: T.blue, fontWeight: 700 }}>{f.id}</td>
                      <td style={{ padding: "6px 8px", fontSize: 11, color: T.navy, fontWeight: 600 }}>{f.entityName}</td>
                      <td style={{ padding: "6px 8px", fontSize: 10, color: T.slate, fontFamily: T.mono }}>{f.entityId}</td>
                      <td style={{ padding: "6px 8px", fontSize: 10, color: T.slate }}>{f.taxonomy}</td>
                      <td style={{ padding: "6px 8px", fontSize: 10, color: T.slate }}>{f.format}</td>
                      <td style={{ padding: "6px 8px", fontFamily: T.mono, fontSize: 11 }}>{f.period}</td>
                      <td style={{ padding: "6px 8px", fontFamily: T.mono, color: T.navy }}>{f.facts}</td>
                      <td style={{ padding: "6px 8px", fontFamily: T.mono, color: T.green }}>{f.mapped}</td>
                      <td style={{ padding: "6px 8px", fontFamily: T.mono, color: f.unmapped > 0 ? T.amber : T.slate }}>{f.unmapped}</td>
                      <td style={{ padding: "6px 8px", fontFamily: T.mono }}>{f.mappingRate}%</td>
                      <td style={{ padding: "6px 8px" }}>{pill(f.readyForDb ? "Yes" : "No", f.readyForDb ? T.green : T.slate)}</td>
                      <td style={{ padding: "6px 8px", fontFamily: T.mono, fontSize: 10, color: T.slate }}>{f.parsedAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

/* ── Tab 2: Validation Pipeline (reference architecture) ─────────────────
 * The ingestion engine does not itself compute per-rule pass rates (it only
 * extracts and maps facts). This tab documents the validation stages a
 * production ESEF/EFRAG pipeline runs; pass-rate figures are illustrative
 * reference targets, not fabricated per-filing measurements.
 */
const ValidationPipeline = () => {
  const VALIDATION_RULES = [
    { code: "VAL-001", name: "Namespace prefix resolution",   category: "Taxonomy",  severity: "Error"   },
    { code: "VAL-002", name: "Context period completeness",   category: "Context",   severity: "Error"   },
    { code: "VAL-003", name: "Unit type consistency",         category: "Unit",      severity: "Error"   },
    { code: "VAL-004", name: "Mandatory element presence",    category: "Taxonomy",  severity: "Error"   },
    { code: "VAL-005", name: "Numeric precision declaration", category: "Fact",      severity: "Warning" },
    { code: "VAL-006", name: "Label linkbase coverage",       category: "Taxonomy",  severity: "Warning" },
    { code: "VAL-007", name: "Calculation linkbase balance",  category: "Calc",      severity: "Error"   },
    { code: "VAL-008", name: "XBRL 2.1 schema compliance",    category: "Schema",    severity: "Error"   },
    { code: "VAL-009", name: "iXBRL inline embedding rules",   category: "Format",    severity: "Error"   },
    { code: "VAL-010", name: "Concept dimension hypercube",    category: "Dimension", severity: "Warning" },
    { code: "VAL-011", name: "Entity identifier scheme",       category: "Context",   severity: "Error"   },
    { code: "VAL-012", name: "Duplicate fact detection",       category: "Fact",      severity: "Warning" },
  ];
  return (
    <div>
      <div style={{ marginBottom: 16, padding: "10px 14px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 6, fontSize: 12, color: "#1e40af" }}>
        Reference architecture — these are the validation stages a production ESEF/EFRAG ingestion
        pipeline runs. The live engine wired on the "Filing Import" tab performs stages VAL-001 (namespace
        detection), VAL-002/VAL-011 (context/entity extraction) and VAL-012 (duplicate-safe fact
        extraction) today; per-rule pass-rate scoring is a roadmap item, not simulated here.
      </div>
      {card(
        <>
          <SH title="Validation Rule Reference" sub="12 rules across taxonomy, fact, context, and format categories" />
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.cream }}>
                {["Rule", "Name", "Category", "Severity"].map(h => (
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
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

/* ── Tab 3: Fact & Mapping — real CONCEPT_TO_DP taxonomy + observed facts ── */
const FactMapping = ({ history, conceptMap }) => {
  const conceptCounts = useMemo(() => {
    const counts = {};
    history.forEach(h => (h.rawFacts || []).forEach(f => { counts[f.concept] = (counts[f.concept] || 0) + 1; }));
    return counts;
  }, [history]);

  const mappingRows = useMemo(() => Object.entries(conceptMap || {}).map(([concept, info]) => ({
    concept, ...info, observed: conceptCounts[concept] || 0,
  })), [conceptMap, conceptCounts]);

  const observedUnmapped = useMemo(() => {
    const set = new Set();
    history.forEach(h => (h.rawFacts || []).forEach(f => { if (!f.mapped) set.add(f.concept); }));
    return Array.from(set).map(concept => ({
      concept, observed: conceptCounts[concept] || 0,
    }));
  }, [history, conceptCounts]);

  const totalConcepts = mappingRows.length;
  const observedCount = mappingRows.filter(r => r.observed > 0).length;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 20 }}>
        {[
          { label: "Known Taxonomy Concepts", value: totalConcepts },
          { label: "Observed in Parsed Filings", value: observedCount, color: T.green },
          { label: "Unmapped Concepts Seen", value: observedUnmapped.length, color: observedUnmapped.length > 0 ? T.amber : T.slate },
          { label: "Total Fact Occurrences", value: Object.values(conceptCounts).reduce((s, c) => s + c, 0), color: T.blue },
        ].map(m => card(
          <>
            <div style={{ fontSize: 11, color: T.slate, marginBottom: 6 }}>{m.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: m.color || T.navy, fontFamily: T.mono }}>{m.value}</div>
          </>
        ))}
      </div>

      {card(
        <>
          <SH title="Concept → Platform Data-Point Mapping (live backend taxonomy)" sub={`Fetched from GET /api/v1/xbrl/ref/concept-mappings — CONCEPT_TO_DP table in xbrl_ingestion_engine.py (${totalConcepts} concepts)`} />
          {totalConcepts === 0 ? (
            <div style={{ padding: "16px 10px", color: T.slate, fontSize: 12 }}>
              Concept mapping table not loaded — check that the backend is running on {API}.
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.cream }}>
                  {["Concept", "ESRS/DR", "Platform DP", "Label", "Unit", "Observed This Session"].map(h => (
                    <th key={h} style={{ padding: "6px 10px", textAlign: "left", fontWeight: 700, color: T.navy, borderBottom: `2px solid ${T.gold}`, fontFamily: T.mono, fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mappingRows.map((c, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : T.cream }}>
                    <td style={{ padding: "6px 10px", fontFamily: T.mono, fontSize: 11, color: T.blue }}>{c.concept}</td>
                    <td style={{ padding: "6px 10px", fontSize: 11, color: T.slate }}>{c.esrs} / {c.dr}</td>
                    <td style={{ padding: "6px 10px", fontFamily: T.mono, fontSize: 11, color: T.teal }}>{c.dp_id}</td>
                    <td style={{ padding: "6px 10px", fontSize: 11 }}>{c.label}</td>
                    <td style={{ padding: "6px 10px", fontFamily: T.mono, fontSize: 10, color: T.slate }}>{c.unit}</td>
                    <td style={{ padding: "6px 10px" }}>{c.observed > 0 ? pill(`${c.observed}×`, T.green) : pill("0", "#94a3b8")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>,
        { marginBottom: 20 }
      )}

      {observedUnmapped.length > 0 && card(
        <>
          <SH title="Unmapped Concepts Observed" sub="Concepts extracted from parsed filings with no entry in CONCEPT_TO_DP — candidates for taxonomy expansion" />
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.cream }}>
                {["Concept", "Occurrences This Session"].map(h => (
                  <th key={h} style={{ padding: "6px 10px", textAlign: "left", fontWeight: 700, color: T.navy, borderBottom: `2px solid ${T.gold}`, fontFamily: T.mono, fontSize: 11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {observedUnmapped.map((c, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : T.cream }}>
                  <td style={{ padding: "6px 10px", fontFamily: T.mono, fontSize: 11, color: T.amber }}>{c.concept}</td>
                  <td style={{ padding: "6px 10px", fontFamily: T.mono, color: T.navy }}>{c.observed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

/* ── Tab 4: Data Warehouse & Audit Trail (architecture reference) ────────── */
const DataWarehouse = () => {
  const pipeline = [
    { step: "1. Upload / Paste",   desc: "File upload or paste raw iXBRL/XBRL-XML text (this page)",             status: "Live",    icon: "📥" },
    { step: "2. Format Detection", desc: "ingest_auto() sniffs iXBRL vs XBRL-XML from document markers",         status: "Live",    icon: "🔍" },
    { step: "3. Entity/Period",    desc: "Regex extraction of EntityName, LEI, context startDate/endDate",       status: "Live",    icon: "📐" },
    { step: "4. Fact Extraction",  desc: "ix:nonFraction / prefixed-element regex extracts concept+value+unit",  status: "Live",    icon: "⚗️" },
    { step: "5. Concept Mapping",  desc: "CONCEPT_TO_DP lookup maps XBRL concepts to platform dp_id",            status: "Live",    icon: "🗺️" },
    { step: "6. Warehouse Load",   desc: "Persist mapped facts to xbrl_facts / xbrl_filings tables",             status: "Planned", icon: "🏭" },
    { step: "7. Audit Trail",      desc: "Append immutable log entry: who, what, when, hash, row counts",        status: "Planned", icon: "📋" },
  ];

  return (
    <div>
      {card(
        <>
          <SH title="Ingestion Pipeline Stages" sub="Steps 1–5 are wired to the real engine on this page; 6–7 are not yet implemented" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {pipeline.map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 12, padding: "12px 14px", background: T.cream, borderRadius: 6, alignItems: "flex-start" }}>
                <span style={{ fontSize: 20 }}>{s.icon}</span>
                <div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 12, color: T.navy, fontFamily: T.mono }}>{s.step}</span>
                    {pill(s.status, s.status === "Live" ? T.green : T.slate)}
                  </div>
                  <div style={{ fontSize: 11, color: T.slate, lineHeight: 1.5 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
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
  const [history, setHistory] = useState([]);
  const [conceptMap, setConceptMap] = useState({});

  // Fetch the real concept-mapping taxonomy from the backend once on mount.
  useEffect(() => {
    fetch(`${API}/api/v1/xbrl/ref/concept-mappings`)
      .then(r => (r.ok ? r.json() : {}))
      .then(setConceptMap)
      .catch(() => setConceptMap({}));
  }, []);

  return (
    <div style={{ fontFamily: T.font, background: T.cream, minHeight: "100vh", padding: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.navy }}>XBRL Ingestion & Filing Import</h1>
          {pill("EP-BC2", T.navy)}
          {pill("Live Engine", T.green)}
        </div>
        <div style={{ fontSize: 13, color: T.slate }}>
          Real iXBRL/XBRL-XML parser (backend/services/xbrl_ingestion_engine.py) · EFRAG ESRS 2024 · ESEF · US GAAP · concept mapping · session ingestion register
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

      {tab === "import"     && <FilingImport history={history} setHistory={setHistory} conceptMap={conceptMap} />}
      {tab === "validation" && <ValidationPipeline />}
      {tab === "facts"      && <FactMapping history={history} conceptMap={conceptMap} />}
      {tab === "warehouse"  && <DataWarehouse />}
    </div>
  );
}
