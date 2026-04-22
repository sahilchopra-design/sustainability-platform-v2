import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const T = { bg:'#0f1117', surface:'#1a1d27', surfaceH:'#22263a', border:'#2a2f45', borderL:'#1e2235', navy:'#1e3a5f', gold:'#d4a843', sage:'#2d6a4f', teal:'#0d4f5c', text:'#e8e0d0', textSec:'#a89880', textMut:'#6b6050', red:'#c0392b', green:'#27ae60', amber:'#e67e22', font:"'DM Sans',sans-serif", mono:"'JetBrains Mono',monospace" };

const FACILITY = {
  name: 'Integrated RE-IPP Client (anonymised)', portfolioGw: 7.4, underConstrMw: 4265,
  techSplit: [ { k: 'Solar PV', v: 5.8 }, { k: 'Wind', v: 0.8 }, { k: 'FDRE/BESS', v: 0.5 }, { k: 'Green H2/NH3', v: 0.3 } ],
  mfgCapGw: 1.2, mfgSite: 'North India', mfgTech: 'TOPCon mono-PERC'
};

const LCA_STAGES_MFG = [
  { stage: 'Raw materials (polysilicon)', co2: 168, share: 42, iso: 'A1' },
  { stage: 'Wafer & cell manufacturing', co2: 72, share: 18, iso: 'A3' },
  { stage: 'Module assembly (glass+frame+EVA)', co2: 88, share: 22, iso: 'A3' },
  { stage: 'Packaging', co2: 12, share: 3, iso: 'A3' },
  { stage: 'Transport to site', co2: 24, share: 6, iso: 'A4' },
  { stage: 'Installation', co2: 16, share: 4, iso: 'A5' },
  { stage: 'EoL/recycling', co2: 20, share: 5, iso: 'C1-C4' },
];

const LCA_GEN_STAGES = [
  { stage: 'Module embedded (amortised)', cikWh: 18.2, pct: 58 },
  { stage: 'BoS + inverter (amortised)', cikWh: 6.5, pct: 21 },
  { stage: 'O&M (water/cleaning/diesel)', cikWh: 3.8, pct: 12 },
  { stage: 'Transport/logistics', cikWh: 1.4, pct: 4 },
  { stage: 'EoL decommissioning', cikWh: 1.5, pct: 5 },
];

const PEER_BENCHMARK = [
  { peer: 'Jinko Neo 610W', ci: 395, country: 'CN' },
  { peer: 'Trina Vertex 670W', ci: 382, country: 'CN' },
  { peer: 'Longi Hi-MO6', ci: 404, country: 'CN' },
  { peer: 'Saatvik TOPCon', ci: 268, country: 'IN' },
  { peer: 'Waaree 600W', ci: 289, country: 'IN' },
  { peer: 'Adani Solar', ci: 301, country: 'IN' },
  { peer: 'Client (target)', ci: 256, country: 'IN', self: true },
];

const EPD_STANDARDS = [
  { std: 'ISO 14040:2006', scope: 'LCA Principles & Framework', status: 'Aligned' },
  { std: 'ISO 14044:2006', scope: 'LCA Requirements', status: 'Aligned' },
  { std: 'ISO 14025:2006', scope: 'Type III Env. Declarations', status: 'Target' },
  { std: 'EN 15804+A2', scope: 'Construction products', status: 'Target' },
  { std: 'IEC 63274:2024', scope: 'PV module EPD PCR', status: 'Target' },
  { std: 'PCR 2019:14', scope: 'International EPD System PCR', status: 'In-scope' },
];

const TABS = ['Overview', 'Manufacturing LCA (Cradle-to-Gate)', 'Generation LCA (per kWh)', 'Peer Benchmark', 'EPD Pathway', 'What-If Calculator', 'Deliverables & Timeline'];

const Kpi = ({ label, value, sub, color }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: '14px 18px', flex: 1, minWidth: 140 }}>
    <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.gold, fontFamily: T.mono }}>{value}</div>
    {sub && <div style={{ fontSize: 10, color: T.textSec, marginTop: 3 }}>{sub}</div>}
  </div>
);

export default function RenewableLcaEpdPage() {
  const [tab, setTab] = useState(0);
  const [gridEf, setGridEf] = useState(0.71);
  const [captiveRePct, setCaptiveRePct] = useState(40);
  const [logisticKm, setLogisticKm] = useState(1200);

  const totalMfgCo2 = LCA_STAGES_MFG.reduce((a, b) => a + b.co2, 0);
  const totalGenCi = LCA_GEN_STAGES.reduce((a, b) => a + b.cikWh, 0).toFixed(1);

  const whatif = useMemo(() => {
    const baseline = totalMfgCo2;
    const gridSaving = (1 - captiveRePct / 100) * gridEf / 0.82 * baseline * 0.35;
    const transportSaving = logisticKm / 1200 * baseline * 0.06;
    const final = gridSaving + transportSaving + baseline * 0.59;
    return { baseline, final: Math.round(final), delta: Math.round(baseline - final) };
  }, [gridEf, captiveRePct, logisticKm, totalMfgCo2]);

  const sty = {
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '8px 10px', fontSize: 10, fontFamily: T.mono, color: T.gold, borderBottom: `1px solid ${T.border}` },
    td: { padding: '8px 10px', fontSize: 11, color: T.text, borderBottom: `1px solid ${T.borderL}` },
    panel: { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 14 },
    input: { background: T.surface, border: `1px solid ${T.border}`, color: T.text, borderRadius: 4, padding: '5px 8px', fontFamily: T.mono, fontSize: 11, width: 90 },
  };

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: T.font, color: T.text, padding: 24 }}>
      <div style={{ borderBottom: `2px solid ${T.gold}`, paddingBottom: 12, marginBottom: 20 }}>
        <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, letterSpacing: 2 }}>EP-EB1 · IMPACT ADVISORY — BALANCE-SHEET VALUE FROM SUSTAINABILITY</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: '4px 0', color: T.text }}>RE Portfolio Life Cycle Assessment & EPD</h1>
        <div style={{ fontSize: 12, color: T.textSec }}>ISO 14040/44 · ISO 14025 · IEC 63274 · Cradle-to-Gate (Mfg) · Cradle-to-Grave (Generation) · International EPD System · 7 Tabs</div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <Kpi label="PORTFOLIO" value={`${FACILITY.portfolioGw} GW`} sub="Integrated RE-IPP · 4 tech" />
        <Kpi label="MFG CAPACITY" value={`${FACILITY.mfgCapGw} GW/yr`} sub={`${FACILITY.mfgTech} · ${FACILITY.mfgSite}`} />
        <Kpi label="MFG CI (TARGET)" value={`${totalMfgCo2} kgCO₂e/kWp`} sub="Cradle-to-Gate A1-A5" color={T.green} />
        <Kpi label="GEN CI (TARGET)" value={`${totalGenCi} gCO₂e/kWh`} sub="Cradle-to-Grave" color={T.green} />
        <Kpi label="EPD STATUS" value="Target FY27" sub="IEC 63274 PCR" color={T.amber} />
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `1px solid ${T.border}`, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <div key={i} onClick={() => setTab(i)} style={{ padding: '10px 16px', fontSize: 11, fontFamily: T.mono, cursor: 'pointer', borderBottom: tab === i ? `2px solid ${T.gold}` : 'none', color: tab === i ? T.gold : T.textSec }}>{t}</div>
        ))}
      </div>

      {tab === 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={sty.panel}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.gold, marginBottom: 8 }}>Strategic Rationale</div>
            <p style={{ fontSize: 12, color: T.textSec, lineHeight: 1.6 }}>LCA converts existing environmental performance into verified, audit-grade figures that are ingestible into CCTS baselines, SLF KPIs, ESG rater data submissions, and EPDs. No incremental capex required — the performance and data already exist.</p>
            <div style={{ fontSize: 11, color: T.textMut, marginTop: 10, lineHeight: 1.7 }}>
              <b style={{ color: T.gold }}>Two studies, two applications:</b><br/>
              → Manufacturing cradle-to-gate — EPD per Wp of module produced<br/>
              → Generation cradle-to-grave — gCO₂e/kWh for CCTS baseline & SLF KPI
            </div>
          </div>
          <div style={sty.panel}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.gold, marginBottom: 8 }}>Portfolio Technology Mix (GW)</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={FACILITY.techSplit}><CartesianGrid stroke={T.border} strokeDasharray="3 3" /><XAxis dataKey="k" stroke={T.textSec} tick={{ fontSize: 11 }} /><YAxis stroke={T.textSec} tick={{ fontSize: 11 }} /><Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}` }} /><Bar dataKey="v" fill={T.gold} /></BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ ...sty.panel, gridColumn: '1 / span 2' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.gold, marginBottom: 10 }}>Downstream Uses of LCA Output</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, fontSize: 11 }}>
              {[
                { u: 'CCTS Offset Registration', d: 'Verified baseline for Project Design Document' },
                { u: 'SLF KPI', d: 'Third-party assured gCO₂e/kWh feeds bond coupon adjustment' },
                { u: 'ESG Rater Input', d: 'MSCI carbon intensity sub-issue; Sustainalytics residual risk' },
                { u: 'EPD for Procurement', d: 'Green public procurement; offtaker Scope-3 programmes' },
              ].map((c, i) => (
                <div key={i} style={{ background: T.surfaceH, padding: 10, borderRadius: 4 }}>
                  <div style={{ color: T.gold, fontWeight: 700 }}>{c.u}</div>
                  <div style={{ color: T.textSec, marginTop: 4 }}>{c.d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div>
          <div style={{ fontSize: 12, color: T.textSec, marginBottom: 10 }}>Cradle-to-Gate assessment per Wp of module produced. ISO 14040/44. Functional unit: 1 kWp.</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={LCA_STAGES_MFG}><CartesianGrid stroke={T.border} strokeDasharray="3 3" /><XAxis dataKey="stage" stroke={T.textSec} tick={{ fontSize: 10 }} angle={-20} height={80} textAnchor="end" /><YAxis stroke={T.textSec} tick={{ fontSize: 11 }} /><Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}` }} /><Bar dataKey="co2" fill={T.gold} name="kgCO₂e/kWp">{LCA_STAGES_MFG.map((d, i) => <Cell key={i} fill={d.share >= 20 ? T.red : d.share >= 10 ? T.gold : T.green} />)}</Bar></BarChart>
          </ResponsiveContainer>
          <table style={{ ...sty.table, marginTop: 16 }}>
            <thead><tr><th style={sty.th}>Stage</th><th style={sty.th}>ISO Module</th><th style={sty.th}>kgCO₂e/kWp</th><th style={sty.th}>Share</th></tr></thead>
            <tbody>{LCA_STAGES_MFG.map((r, i) => <tr key={i}><td style={sty.td}>{r.stage}</td><td style={{ ...sty.td, fontFamily: T.mono, color: T.gold }}>{r.iso}</td><td style={{ ...sty.td, fontFamily: T.mono }}>{r.co2}</td><td style={sty.td}>{r.share}%</td></tr>)}</tbody>
          </table>
        </div>
      )}

      {tab === 2 && (
        <div>
          <div style={{ fontSize: 12, color: T.textSec, marginBottom: 10 }}>Generation cradle-to-grave — gCO₂e per kWh delivered across 25-yr PPA life.</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={LCA_GEN_STAGES}><CartesianGrid stroke={T.border} strokeDasharray="3 3" /><XAxis dataKey="stage" stroke={T.textSec} tick={{ fontSize: 10 }} angle={-15} height={70} textAnchor="end" /><YAxis stroke={T.textSec} tick={{ fontSize: 11 }} /><Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}` }} /><Bar dataKey="cikWh" fill={T.teal} name="gCO₂e/kWh" /></BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
            <Kpi label="TOTAL CI" value={`${totalGenCi} g/kWh`} sub="vs India grid 710 g/kWh" color={T.green} />
            <Kpi label="vs GRID" value="96% below" sub="LCA-verified delta" color={T.green} />
            <Kpi label="CBAM REPORT" value="Ready" sub="Scope 2 Clean Energy Guaranteed" />
          </div>
        </div>
      )}

      {tab === 3 && (
        <div>
          <div style={{ fontSize: 12, color: T.textSec, marginBottom: 10 }}>Peer manufacturer benchmarking (modules — cradle-to-gate, kgCO₂e/kWp).</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={PEER_BENCHMARK} layout="vertical"><CartesianGrid stroke={T.border} strokeDasharray="3 3" /><XAxis type="number" stroke={T.textSec} tick={{ fontSize: 11 }} /><YAxis type="category" dataKey="peer" stroke={T.textSec} tick={{ fontSize: 11 }} width={150} /><Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}` }} /><Bar dataKey="ci">{PEER_BENCHMARK.map((d, i) => <Cell key={i} fill={d.self ? T.green : d.country === 'IN' ? T.gold : T.red} />)}</Bar></BarChart>
          </ResponsiveContainer>
          <div style={{ ...sty.panel, marginTop: 14 }}>
            <div style={{ fontSize: 11, color: T.gold, marginBottom: 6 }}>India advantage</div>
            <div style={{ fontSize: 11, color: T.textSec, lineHeight: 1.6 }}>Indian-manufactured + installed modules carry a structural carbon advantage: no transport emission premium vs Chinese imports, plus captive RE for manufacturing compresses embedded CO₂. This is unquantified today — LCA makes it visible and defensible.</div>
          </div>
        </div>
      )}

      {tab === 4 && (
        <div>
          <div style={{ fontSize: 12, color: T.textSec, marginBottom: 10 }}>Environmental Product Declaration pathway — International EPD System · ISO 14025 Type III.</div>
          <table style={sty.table}>
            <thead><tr><th style={sty.th}>Standard</th><th style={sty.th}>Scope</th><th style={sty.th}>Status</th></tr></thead>
            <tbody>{EPD_STANDARDS.map((r, i) => <tr key={i}><td style={{ ...sty.td, color: T.gold, fontFamily: T.mono }}>{r.std}</td><td style={sty.td}>{r.scope}</td><td style={{ ...sty.td, color: r.status === 'Aligned' ? T.green : r.status === 'Target' ? T.gold : T.textSec }}>{r.status}</td></tr>)}</tbody>
          </table>
          <div style={{ ...sty.panel, marginTop: 14 }}>
            <div style={{ fontSize: 12, color: T.gold, fontWeight: 700, marginBottom: 6 }}>Competitive benchmark</div>
            <div style={{ fontSize: 11, color: T.textSec }}>Saatvik Green Energy obtained EPD certification for its TOPCon module in early 2026, establishing the Indian benchmark. A ~1.2 GW facility is positioned to address this within 10–14 months.</div>
          </div>
        </div>
      )}

      {tab === 5 && (
        <div>
          <div style={{ fontSize: 12, color: T.textSec, marginBottom: 14 }}>What-if — compress manufacturing CI through captive RE and logistics optimisation.</div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <label style={{ fontSize: 11, color: T.textSec }}>Grid EF (kg/kWh) <input type="number" step="0.01" value={gridEf} onChange={e=>setGridEf(+e.target.value)} style={sty.input} /></label>
            <label style={{ fontSize: 11, color: T.textSec }}>Captive RE % <input type="number" value={captiveRePct} onChange={e=>setCaptiveRePct(+e.target.value)} style={sty.input} /></label>
            <label style={{ fontSize: 11, color: T.textSec }}>Logistics km <input type="number" value={logisticKm} onChange={e=>setLogisticKm(+e.target.value)} style={sty.input} /></label>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Kpi label="BASELINE CI" value={`${whatif.baseline} kg/kWp`} sub="Current mix" />
            <Kpi label="OPTIMISED CI" value={`${whatif.final} kg/kWp`} sub="After levers" color={T.green} />
            <Kpi label="Δ REDUCTION" value={`${whatif.delta} kg/kWp`} sub={`${((whatif.delta/whatif.baseline)*100).toFixed(1)}%`} color={T.gold} />
            <Kpi label="EPD RATING" value={whatif.final < 280 ? 'A+' : whatif.final < 330 ? 'A' : 'B'} sub="Peer quartile" color={T.gold} />
          </div>
        </div>
      )}

      {tab === 6 && (
        <div>
          <div style={{ fontSize: 12, color: T.textSec, marginBottom: 10 }}>Deliverables & Timeline — ~14-week engagement.</div>
          <table style={sty.table}>
            <thead><tr><th style={sty.th}>Phase</th><th style={sty.th}>Deliverable</th><th style={sty.th}>Week</th><th style={sty.th}>Owner</th></tr></thead>
            <tbody>{[
              ['Goal & scope', 'ISO 14040 scope definition · functional unit', 'W1', 'Advisory'],
              ['Inventory analysis', 'LCI collection · site audits · supply chain data', 'W2-5', 'Joint'],
              ['Impact assessment', 'LCIA using CML/ReCiPe · uncertainty analysis', 'W6-8', 'Advisory'],
              ['Interpretation', 'Hotspot analysis · sensitivity · peer benchmark', 'W9-10', 'Advisory'],
              ['Critical review', 'ISO 14044 panel review (external)', 'W11-12', 'External'],
              ['EPD registration', 'International EPD System submission · IEC 63274 PCR', 'W13-14', 'Advisory'],
              ['Handover', 'EPD certificate · downstream-module data pack', 'W14', 'Advisory'],
            ].map((r, i) => <tr key={i}><td style={{ ...sty.td, color: T.gold }}>{r[0]}</td><td style={sty.td}>{r[1]}</td><td style={{ ...sty.td, fontFamily: T.mono }}>{r[2]}</td><td style={sty.td}>{r[3]}</td></tr>)}</tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: 24, padding: '10px 16px', background: T.surfaceH, borderRadius: 6, display: 'flex', justifyContent: 'space-between', fontFamily: T.mono, fontSize: 11, color: T.textMut }}>
        <span>EP-EB1 · RE Portfolio LCA & EPD · Impact Advisory Suite</span>
        <span>ISO 14040/44/25 · IEC 63274 · International EPD System · 7 Tabs</span>
      </div>
    </div>
  );
}
