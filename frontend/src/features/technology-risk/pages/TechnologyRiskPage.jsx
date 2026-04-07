/**
 * EP-BB2 — Technology Risk Panel
 * Sprint BB | Risk & Sector Intelligence
 *
 * Coverage: cyber risk scoring, AI/model risk, operational technology risk,
 * supply chain concentration, vendor dependency, tech obsolescence, regulatory exposure.
 */
import React, { useState, useMemo } from "react";
import {
  BarChart, Bar, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
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
  green: "#059669",
  red:   "#dc2626",
  amber: "#d97706",
  blue:  "#2563eb",
  purple:"#7c3aed",
  teal:  "#0e7490",
  pink:  "#db2777",
};

/* ── Seeded random ──────────────────────────────────────────────────────────── */
const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const pick = (arr, s) => arr[Math.floor(sr(s) * arr.length)];

/* ── Data ──────────────────────────────────────────────────────────────────── */
const SECTORS = ["Banking","Insurance","Asset Management","Fintech","Healthcare","Energy","Industrials","Consumer Tech","Telecom","Government"];
const RISK_CATS = ["Cyber / Ransomware","AI / Model Risk","Cloud Concentration","Third-Party / Vendor","OT / ICS Security","Data Privacy","Supply Chain SW","Legacy Tech Debt","Insider Threat","Regulatory Tech"];
const REGS = ["EU AI Act","NIS2 Directive","DORA (EU)","SEC Cyber Rule","NIST CSF 2.0","ISO 27001:2022","GDPR Art 32","UK NCSC CAF","NYDFS 500","FCA Operational Resilience"];

const genCompanies = (n) => Array.from({ length: n }, (_, i) => ({
  id: i + 1,
  name: `${pick(SECTORS, i*7).slice(0,4).toUpperCase()}-TechCo-${String(i+1).padStart(2,"0")}`,
  sector: pick(SECTORS, i * 7),
  cyberScore:   Math.round(30 + sr(i * 3)  * 65),
  aiRisk:       Math.round(20 + sr(i * 7)  * 75),
  cloudConc:    Math.round(25 + sr(i * 11) * 70),
  vendorRisk:   Math.round(20 + sr(i * 13) * 70),
  otRisk:       Math.round(15 + sr(i * 17) * 80),
  dataPrivacy:  Math.round(30 + sr(i * 19) * 65),
  legacyDebt:   Math.round(20 + sr(i * 23) * 70),
  overallRisk:  Math.round(30 + sr(i * 29) * 60),
  incidents12m: Math.round(sr(i * 31) * 8),
  patchLag:     Math.round(5 + sr(i * 37) * 85),   // days
  cloudProvider: pick(["AWS","Azure","GCP","Multi-Cloud","On-Prem"], i * 41),
  aiMaturity:   pick(["None","Experimental","Deployed","Enterprise"], i * 43),
  doraCovered:  sr(i * 47) > 0.45,
  nisCovered:   sr(i * 53) > 0.4,
}));

const COMPANIES = genCompanies(45);

const INCIDENT_TREND = Array.from({ length: 12 }, (_, i) => ({
  month: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i],
  "Ransomware":   Math.round(3 + sr(i * 3) * 12),
  "Data Breach":  Math.round(2 + sr(i * 7) * 8),
  "Supply Chain": Math.round(1 + sr(i * 11) * 5),
  "OT Attack":    Math.round(0 + sr(i * 13) * 4),
  "Phishing":     Math.round(5 + sr(i * 17) * 15),
}));

const RADAR_DATA = [
  { axis: "Cyber Defence",  value: 62 },
  { axis: "AI Governance",  value: 44 },
  { axis: "Cloud Security", value: 58 },
  { axis: "Vendor DD",      value: 51 },
  { axis: "OT Hardening",   value: 38 },
  { axis: "Data Privacy",   value: 67 },
  { axis: "Patching",       value: 55 },
];

const MATURITY_DATA = RISK_CATS.map((c, i) => ({
  category: c.split(" ")[0],
  score: Math.round(30 + sr(i * 17) * 60),
  benchmark: Math.round(45 + sr(i * 23) * 30),
}));

const VENDOR_CONC = [
  { vendor: "Microsoft", exposure: 82, risk: "High" },
  { vendor: "AWS", exposure: 71, risk: "High" },
  { vendor: "Palo Alto", exposure: 45, risk: "Med" },
  { vendor: "Broadcom/VMware", exposure: 63, risk: "High" },
  { vendor: "Oracle", exposure: 51, risk: "Med" },
  { vendor: "SAP", exposure: 44, risk: "Med" },
  { vendor: "Crowdstrike", exposure: 38, risk: "Med" },
  { vendor: "Cisco", exposure: 56, risk: "High" },
];

const REG_READINESS = REGS.map((r, i) => ({
  reg: r,
  readiness: Math.round(30 + sr(i * 29) * 65),
  deadline: ["2025-08","2025-01","2025-01","2024-12","2024-02","Ongoing","Ongoing","Ongoing","2025-11","2025-03"][i],
  status: sr(i * 37) > 0.55 ? "Compliant" : sr(i * 37) > 0.3 ? "In Progress" : "Gap",
}));

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

const riskColor = (score) => score > 70 ? T.red : score > 45 ? T.amber : T.green;
const statusColor = (s) => s === "Compliant" ? T.green : s === "In Progress" ? T.amber : T.red;

/* ── Tab 1: Cyber Risk Scorecard ──────────────────────────────────────────── */
const CyberScorecard = () => {
  const [sectorF, setSectorF] = useState("All");
  const [sort, setSort] = useState("overallRisk");

  const filtered = useMemo(() => {
    let d = sectorF === "All" ? COMPANIES : COMPANIES.filter(c => c.sector === sectorF);
    return [...d].sort((a, b) => b[sort] - a[sort]);
  }, [sectorF, sort]);

  const sectorAvg = SECTORS.map(s => {
    const sc = COMPANIES.filter(c => c.sector === s);
    return { sector: s.slice(0,7), avg: sc.length ? Math.round(sc.reduce((a,b) => a+b.overallRisk,0)/sc.length) : 0 };
  }).sort((a,b) => b.avg - a.avg);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 20 }}>
        {[
          { label: "Entities Scored", value: COMPANIES.length },
          { label: "High Risk (>65)", value: COMPANIES.filter(c=>c.overallRisk>65).length, color: T.red },
          { label: "Total Incidents (12m)", value: COMPANIES.reduce((s,c)=>s+c.incidents12m,0), color: T.amber },
          { label: "DORA-Covered", value: COMPANIES.filter(c=>c.doraCovered).length, color: T.blue },
        ].map(m => card(
          <>
            <div style={{ fontSize: 11, color: T.slate, marginBottom: 6 }}>{m.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: m.color || T.navy, fontFamily: T.mono }}>{m.value}</div>
          </>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {card(
          <>
            <SH title="Average Cyber Risk by Sector" />
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={sectorAvg} margin={{ bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="sector" tick={{ fontSize: 10, fontFamily: T.mono }} angle={-35} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} domain={[0,100]} />
                <Tooltip />
                <Bar dataKey="avg" name="Avg Risk Score" radius={[4,4,0,0]}>
                  {sectorAvg.map((d,i) => <Cell key={i} fill={riskColor(d.avg)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
        {card(
          <>
            <SH title="Sector Risk Radar (Average)" sub="7 risk dimensions — market average" />
            <ResponsiveContainer width="100%" height={230}>
              <RadarChart data={RADAR_DATA} cx="50%" cy="50%" outerRadius={90}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10, fontFamily: T.mono }} />
                <Radar name="Avg Score" dataKey="value" stroke={T.navy} fill={T.navy} fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
          </>
        )}
      </div>

      {card(
        <>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
            <SH title="Entity Cyber Risk Register" sub={null} />
            <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
              <select value={sectorF} onChange={e => setSectorF(e.target.value)} style={{ fontSize: 12, padding: "4px 8px", borderRadius: 4, border: "1px solid #e2e8f0", fontFamily: T.mono }}>
                <option>All</option>{SECTORS.map(s => <option key={s}>{s}</option>)}
              </select>
              <select value={sort} onChange={e => setSort(e.target.value)} style={{ fontSize: 12, padding: "4px 8px", borderRadius: 4, border: "1px solid #e2e8f0", fontFamily: T.mono }}>
                <option value="overallRisk">Overall Risk</option>
                <option value="cyberScore">Cyber</option>
                <option value="aiRisk">AI Risk</option>
                <option value="legacyDebt">Legacy</option>
                <option value="incidents12m">Incidents</option>
              </select>
            </div>
          </div>
          <div style={{ maxHeight: 360, overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead style={{ position: "sticky", top: 0, background: T.cream }}>
                <tr>
                  {["Entity","Sector","Overall","Cyber","AI Risk","Cloud","Vendor","OT","Incidents","Patch Lag","DORA"].map(h => (
                    <th key={h} style={{ padding: "6px 10px", textAlign: "left", color: T.navy, fontWeight: 700, borderBottom: `2px solid ${T.gold}`, fontFamily: T.mono, fontSize: 11, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c.id} style={{ background: i % 2 === 0 ? "#fff" : T.cream }}>
                    <td style={{ padding: "6px 10px", fontFamily: T.mono, fontSize: 11, fontWeight: 700, color: T.navy }}>{c.name}</td>
                    <td style={{ padding: "6px 10px", fontSize: 11, color: T.slate }}>{c.sector}</td>
                    <td style={{ padding: "6px 10px" }}>{pill(c.overallRisk, riskColor(c.overallRisk))}</td>
                    <td style={{ padding: "6px 10px", fontFamily: T.mono, color: riskColor(c.cyberScore) }}>{c.cyberScore}</td>
                    <td style={{ padding: "6px 10px", fontFamily: T.mono, color: riskColor(c.aiRisk) }}>{c.aiRisk}</td>
                    <td style={{ padding: "6px 10px", fontFamily: T.mono, color: riskColor(c.cloudConc) }}>{c.cloudConc}</td>
                    <td style={{ padding: "6px 10px", fontFamily: T.mono, color: riskColor(c.vendorRisk) }}>{c.vendorRisk}</td>
                    <td style={{ padding: "6px 10px", fontFamily: T.mono, color: riskColor(c.otRisk) }}>{c.otRisk}</td>
                    <td style={{ padding: "6px 10px", fontFamily: T.mono, color: c.incidents12m > 4 ? T.red : T.navy }}>{c.incidents12m}</td>
                    <td style={{ padding: "6px 10px", fontFamily: T.mono, color: c.patchLag > 45 ? T.red : c.patchLag > 20 ? T.amber : T.green }}>{c.patchLag}d</td>
                    <td style={{ padding: "6px 10px", textAlign: "center" }}>{c.doraCovered ? pill("Yes", T.green) : pill("No", T.slate)}</td>
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

/* ── Tab 2: AI & Model Risk ───────────────────────────────────────────────── */
const AiModelRisk = () => {
  const maturityDist = ["None","Experimental","Deployed","Enterprise"].map(m => ({
    maturity: m,
    count: COMPANIES.filter(c => c.aiMaturity === m).length,
  }));

  const aiRiskByMaturity = maturityDist.map((m, i) => ({
    ...m,
    avgRisk: Math.round(COMPANIES.filter(c => c.aiMaturity === m.maturity).reduce((s,c) => s + c.aiRisk, 0) /
      (COMPANIES.filter(c => c.aiMaturity === m.maturity).length || 1)),
  }));

  const euAiActItems = [
    { article: "Art 6 / Annex III", title: "High-Risk AI Systems",        status: "Applies to: credit scoring, biometrics, employment, essential services", risk: "High" },
    { article: "Art 9",             title: "Risk Management System",       status: "Continuous iterative process required for high-risk AI",                   risk: "High" },
    { article: "Art 10",            title: "Training Data Governance",     status: "Data quality, relevance, representativeness, freedom from bias",           risk: "Med" },
    { article: "Art 11",            title: "Technical Documentation",      status: "Lifecycle documentation; updated throughout system lifetime",               risk: "Med" },
    { article: "Art 13",            title: "Transparency & Explainability",status: "Output explanation capability for high-risk systems",                       risk: "High" },
    { article: "Art 14",            title: "Human Oversight",              status: "Capability for human monitoring, intervention, override",                  risk: "High" },
    { article: "Art 17",            title: "Quality Management System",    status: "QMS proportionate to risk level and size of provider",                     risk: "Med" },
    { article: "Art 51",            title: "GPAI Model Obligations",       status: "Systemic-risk GPAI: adversarial testing, incident reporting",              risk: "High" },
  ];

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {card(
          <>
            <SH title="AI Maturity Distribution" sub="45 entities across sectors" />
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={aiRiskByMaturity} margin={{ bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="maturity" tick={{ fontSize: 11, fontFamily: T.mono }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fontFamily: T.mono }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fontFamily: T.mono }} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left"  dataKey="count"   name="# Entities" fill={T.navy} />
                <Bar yAxisId="right" dataKey="avgRisk" name="Avg AI Risk" fill={T.purple} />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
        {card(
          <>
            <SH title="Risk Maturity Benchmark" sub="Entity avg vs sector benchmark (0–100)" />
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={MATURITY_DATA} margin={{ bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="category" tick={{ fontSize: 9, fontFamily: T.mono }} angle={-35} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="score"     name="Entity Score"     fill={T.navy}  />
                <Bar dataKey="benchmark" name="Sector Benchmark" fill={T.gold}  />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
      </div>

      {card(
        <>
          <SH title="EU AI Act — Key Obligations Reference" sub="In force Aug 2024; phased obligations through 2027" />
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.cream }}>
                {["Article","Obligation","Detail","Risk Level"].map(h => (
                  <th key={h} style={{ padding: "6px 10px", textAlign: "left", fontWeight: 700, color: T.navy, borderBottom: `2px solid ${T.gold}`, fontFamily: T.mono, fontSize: 11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {euAiActItems.map((item, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : T.cream }}>
                  <td style={{ padding: "6px 10px", fontFamily: T.mono, fontSize: 11, fontWeight: 700, color: T.blue }}>{item.article}</td>
                  <td style={{ padding: "6px 10px", fontWeight: 600, color: T.navy }}>{item.title}</td>
                  <td style={{ padding: "6px 10px", color: T.slate, fontSize: 11 }}>{item.status}</td>
                  <td style={{ padding: "6px 10px" }}>{pill(item.risk, item.risk === "High" ? T.red : T.amber)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

/* ── Tab 3: Incident & Threat Landscape ──────────────────────────────────── */
const IncidentLandscape = () => {
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 20 }}>
        {[
          { label: "Incidents YTD (sample)", value: INCIDENT_TREND.slice(0,6).reduce((s,m)=>s+m["Ransomware"]+m["Data Breach"],0), color: T.red },
          { label: "Avg Patch Lag (days)", value: Math.round(COMPANIES.reduce((s,c)=>s+c.patchLag,0)/COMPANIES.length), color: T.amber },
          { label: "Cloud-only entities", value: COMPANIES.filter(c=>c.cloudProvider!=="On-Prem").length, color: T.blue },
          { label: "Multi-cloud entities", value: COMPANIES.filter(c=>c.cloudProvider==="Multi-Cloud").length, color: T.teal },
        ].map(m => card(
          <>
            <div style={{ fontSize: 11, color: T.slate, marginBottom: 6 }}>{m.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: m.color, fontFamily: T.mono }}>{m.value}</div>
          </>
        ))}
      </div>

      {card(
        <>
          <SH title="Incident Trend by Attack Type (12 months)" sub="Simulated threat intelligence feed — entity sample set" />
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={INCIDENT_TREND} margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fontFamily: T.mono }} />
              <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} />
              <Tooltip />
              <Legend />
              <Area dataKey="Phishing"     stackId="a" stroke={T.amber}  fill={T.amber}  fillOpacity={0.5} />
              <Area dataKey="Ransomware"   stackId="a" stroke={T.red}    fill={T.red}    fillOpacity={0.5} />
              <Area dataKey="Data Breach"  stackId="a" stroke={T.purple} fill={T.purple} fillOpacity={0.4} />
              <Area dataKey="Supply Chain" stackId="a" stroke={T.teal}   fill={T.teal}   fillOpacity={0.4} />
              <Area dataKey="OT Attack"    stackId="a" stroke={T.pink}   fill={T.pink}   fillOpacity={0.4} />
            </AreaChart>
          </ResponsiveContainer>
        </>,
        { marginBottom: 20 }
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {card(
          <>
            <SH title="Vendor Concentration Risk" sub="% of entities with material dependency on top vendors" />
            {VENDOR_CONC.map((v, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.navy }}>{v.vendor}</span>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    {pill(v.risk, v.risk === "High" ? T.red : T.amber)}
                    <span style={{ fontSize: 12, fontFamily: T.mono, color: T.slate }}>{v.exposure}%</span>
                  </div>
                </div>
                <div style={{ background: "#e2e8f0", borderRadius: 3, height: 6 }}>
                  <div style={{ width: `${v.exposure}%`, background: v.risk === "High" ? T.red : T.amber, borderRadius: 3, height: 6 }} />
                </div>
              </div>
            ))}
          </>
        )}
        {card(
          <>
            <SH title="Cloud Provider Distribution" sub="45 entities by primary cloud provider" />
            {["AWS","Azure","GCP","Multi-Cloud","On-Prem"].map((cp, i) => {
              const cnt = COMPANIES.filter(c => c.cloudProvider === cp).length;
              const pct = (cnt / COMPANIES.length * 100).toFixed(0);
              return (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 12, color: T.navy, fontWeight: 600 }}>{cp}</span>
                    <span style={{ fontSize: 12, fontFamily: T.mono, color: T.slate }}>{cnt} entities ({pct}%)</span>
                  </div>
                  <div style={{ background: "#e2e8f0", borderRadius: 3, height: 6 }}>
                    <div style={{ width: `${pct}%`, background: [T.amber, T.blue, T.green, T.purple, T.slate][i], borderRadius: 3, height: 6 }} />
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};

/* ── Tab 4: Regulatory Compliance ────────────────────────────────────────── */
const RegulatoryCompliance = () => {
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 20 }}>
        {[
          { label: "Regs Tracked", value: REGS.length, color: T.navy },
          { label: "Fully Compliant", value: REG_READINESS.filter(r=>r.status==="Compliant").length, color: T.green },
          { label: "Gaps / Not Started", value: REG_READINESS.filter(r=>r.status==="Gap").length, color: T.red },
        ].map(m => card(
          <>
            <div style={{ fontSize: 11, color: T.slate, marginBottom: 6 }}>{m.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: m.color, fontFamily: T.mono }}>{m.value}</div>
          </>
        ))}
      </div>

      {card(
        <>
          <SH title="Tech Regulatory Readiness" sub="10 key frameworks — readiness score and implementation status" />
          <div style={{ marginBottom: 20 }}>
            {REG_READINESS.map((r, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #f1f5f9" }}>
                <div style={{ minWidth: 180, fontWeight: 700, fontSize: 12, color: T.navy }}>{r.reg}</div>
                <div style={{ minWidth: 80, fontSize: 11, fontFamily: T.mono, color: T.slate }}>By {r.deadline}</div>
                <div style={{ flex: 1, background: "#e2e8f0", borderRadius: 4, height: 8 }}>
                  <div style={{ width: `${r.readiness}%`, background: statusColor(r.status), borderRadius: 4, height: 8, transition: "width 0.3s" }} />
                </div>
                <div style={{ minWidth: 30, fontFamily: T.mono, fontSize: 12, textAlign: "right", color: T.slate }}>{r.readiness}%</div>
                {pill(r.status, statusColor(r.status))}
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {card(
          <>
            <SH title="DORA (EU) 2022/2554 — Key Pillars" sub="Digital Operational Resilience Act — applies to financial entities from Jan 2025" />
            {[
              { pillar: "ICT Risk Management", art: "Art 5-16", desc: "Governance, strategy, policies, tools, recovery plans" },
              { pillar: "Incident Reporting",  art: "Art 17-23",desc: "Major ICT incident classification, timeliness, content, RCA" },
              { pillar: "Digital Resilience Testing", art: "Art 24-27", desc: "TLPT for significant entities; basic testing for others" },
              { pillar: "Third-Party Risk",    art: "Art 28-44",desc: "CTP register, contractual clauses, oversight framework" },
              { pillar: "Info Sharing",        art: "Art 45-46",desc: "Voluntary cyber threat intelligence sharing arrangements" },
            ].map((p, i) => (
              <div key={i} style={{ padding: "9px 0", borderBottom: "1px solid #f1f5f9" }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontFamily: T.mono, fontSize: 11, color: T.blue, fontWeight: 700 }}>{p.art}</span>
                  <span style={{ fontWeight: 700, fontSize: 12, color: T.navy }}>{p.pillar}</span>
                </div>
                <div style={{ fontSize: 11, color: T.slate }}>{p.desc}</div>
              </div>
            ))}
          </>
        )}
        {card(
          <>
            <SH title="NIS2 Directive — Sector Scope" sub="EU 2022/2555 — transposed nationally by Oct 2024" />
            {[
              { sector: "Energy", tier: "Essential", desc: "Electricity, oil, gas, hydrogen" },
              { sector: "Transport", tier: "Essential", desc: "Air, rail, water, road" },
              { sector: "Banking", tier: "Essential", desc: "Credit institutions" },
              { sector: "Financial Market Infra", tier: "Essential", desc: "Trading venues, CCPs" },
              { sector: "Health", tier: "Essential", desc: "Hospitals, pharma, medical devices" },
              { sector: "Digital Infrastructure", tier: "Essential", desc: "IXPs, DNS, TLDs, cloud, CDN" },
              { sector: "Public Administration", tier: "Essential", desc: "Central government" },
              { sector: "Postal Services", tier: "Important", desc: "Delivery, courier" },
              { sector: "Waste Management", tier: "Important", desc: "Municipal waste" },
              { sector: "Manufacturing", tier: "Important", desc: "Medical devices, vehicles, machines" },
            ].map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", padding: "6px 0", borderBottom: "1px solid #f1f5f9" }}>
                <div style={{ fontWeight: 600, fontSize: 12, color: T.navy, minWidth: 160 }}>{s.sector}</div>
                {pill(s.tier, s.tier === "Essential" ? T.navy : T.blue)}
                <div style={{ fontSize: 11, color: T.slate }}>{s.desc}</div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

/* ── Page Shell ──────────────────────────────────────────────────────────── */
const TABS = [
  { key: "cyber",   label: "Cyber Risk Scorecard"  },
  { key: "ai",      label: "AI & Model Risk"        },
  { key: "incident",label: "Incident Landscape"    },
  { key: "reg",     label: "Regulatory Compliance" },
];

export default function TechnologyRiskPage() {
  const [tab, setTab] = useState("cyber");

  return (
    <div style={{ fontFamily: T.font, background: T.cream, minHeight: "100vh", padding: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.navy }}>Technology Risk Panel</h1>
          {pill("EP-BB2", T.navy)}
          {pill("Risk & Sector", T.purple)}
        </div>
        <div style={{ fontSize: 13, color: T.slate }}>
          45 entities · cyber / AI / OT / vendor risk · DORA · NIS2 · EU AI Act · incident trend · cloud concentration
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

      {tab === "cyber"    && <CyberScorecard />}
      {tab === "ai"       && <AiModelRisk />}
      {tab === "incident" && <IncidentLandscape />}
      {tab === "reg"      && <RegulatoryCompliance />}
    </div>
  );
}
