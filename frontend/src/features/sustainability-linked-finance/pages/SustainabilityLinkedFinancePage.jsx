import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

const T = { bg:'#0f1117', surface:'#1a1d27', surfaceH:'#22263a', border:'#2a2f45', borderL:'#1e2235', navy:'#1e3a5f', gold:'#d4a843', sage:'#2d6a4f', teal:'#0d4f5c', text:'#e8e0d0', textSec:'#a89880', textMut:'#6b6050', red:'#c0392b', green:'#27ae60', amber:'#e67e22', font:"'DM Sans',sans-serif", mono:"'JetBrains Mono',monospace" };

const INSTRUMENTS = [
  { k: 'Green Bond (ICMA GBP)', t: 'Use-of-proceeds', issuer: 'Senior unsecured / project', pricing: '-15 to -25bps', eligAssets: 'Solar / wind / BESS / GH2', spoReq: 'Mandatory (CBI/Sustainalytics)' },
  { k: 'Green Loan (LMA GLP)', t: 'Use-of-proceeds', issuer: 'Syndicated / bilateral', pricing: '-10 to -20bps', eligAssets: 'Project-level green assets', spoReq: 'Mandatory (CBI/VigeoEiris)' },
  { k: 'Sustainability-Linked Bond (SLB)', t: 'KPI-linked coupon', issuer: 'General corporate', pricing: 'Step-up/down ±25bps', eligAssets: 'Any (incl. capex)', spoReq: 'Mandatory (Sustainalytics/S&P)' },
  { k: 'Sustainability-Linked Loan (SLL)', t: 'KPI-linked margin', issuer: 'Bilateral syndicated', pricing: 'Margin adj ±5-15bps', eligAssets: 'General corporate', spoReq: 'Recommended (verifier)' },
  { k: 'Transition Bond', t: 'Transition use', issuer: 'High-emitting sectors', pricing: '-5 to -15bps', eligAssets: 'Legacy → low-carbon', spoReq: 'Mandatory' },
  { k: 'Blue Bond', t: 'Ocean use-of-proceeds', issuer: 'Marine RE / coastal', pricing: '-10 to -20bps', eligAssets: 'Offshore wind / blue H2', spoReq: 'Mandatory' },
];

const KPI_LIBRARY = [
  { kpi: 'Portfolio carbon intensity (gCO₂e/kWh)', materiality: 'Core', target2030: 4.0, baseline: 31, source: 'LCA-verified', icmaAlign: '✓' },
  { kpi: 'RE capacity commissioned (GW)', materiality: 'Lagging', target2030: 12, baseline: 7.4, source: 'Financial reporting', icmaAlign: '✓ secondary' },
  { kpi: 'TCFD physical risk-adjusted DSCR', materiality: 'Core', target2030: 1.45, baseline: 1.28, source: 'TCFD SSP2-4.5', icmaAlign: '✓ innovative' },
  { kpi: 'CCTS CCCs generated & retired (kt)', materiality: 'Supplementary', target2030: 800, baseline: 0, source: 'BEE registry', icmaAlign: '✓' },
  { kpi: 'Supply chain scope 3 reduction vs 2024', materiality: 'Core mfg', target2030: 35, baseline: 0, source: 'GHG Protocol Scope 3', icmaAlign: '✓' },
  { kpi: 'Water withdrawal intensity (kL/GWh)', materiality: 'Core operations', target2030: 1.8, baseline: 3.2, source: 'BRSR Core', icmaAlign: '✓' },
  { kpi: 'TNFD LEAP baseline completion (%)', materiality: 'Supplementary', target2030: 100, baseline: 0, source: 'TNFD v1.0', icmaAlign: '✓ innovative' },
];

const SPT_TRAJECTORY = Array.from({ length: 7 }, (_, i) => ({
  yr: 2025 + i,
  ci: +(31 - i * (31 - 4) / 6).toFixed(1),
  target: +(31 - i * (31 - 4) / 6).toFixed(1),
  ambition: +(31 - i * (31 - 4) / 5).toFixed(1),
}));

const SPO_PROVIDERS = [
  { sp: 'Sustainalytics', cov: 'SLB/GB · SPO · CBI licensed', fee: '$45-85k', td: '6-8wk' },
  { sp: 'S&P Global', cov: 'SLB/GB · 2nd party opinion', fee: '$60-120k', td: '8-10wk' },
  { sp: 'Moody\'s ESG', cov: 'SLB · climate scenario', fee: '$55-100k', td: '8-10wk' },
  { sp: 'CICERO Shades', cov: 'GB · climate science-grounded', fee: '$50-90k', td: '6-8wk' },
  { sp: 'CRISIL', cov: 'India-specific · SLL · GB', fee: '₹25-60L', td: '5-7wk' },
  { sp: 'ISS Corporate', cov: 'SLB · ESG data layer', fee: '$40-80k', td: '6-8wk' },
];

const COST_SAVINGS = [
  { scen: 'Conventional INR bond', bps: 0, notional: 2000, cat: 'Baseline', cost: 0 },
  { scen: 'Green Bond (domestic)', bps: -20, notional: 2000, cat: 'Use-of-proceeds', cost: -40 },
  { scen: 'Green Bond (USD)', bps: -35, notional: 2000, cat: 'International', cost: -70 },
  { scen: 'SLB (hit SPT)', bps: -25, notional: 2000, cat: 'KPI step-down', cost: -50 },
  { scen: 'SLB (miss SPT)', bps: 25, notional: 2000, cat: 'Coupon step-up', cost: 50 },
  { scen: 'Transition Bond', bps: -10, notional: 2000, cat: 'Transition eligible', cost: -20 },
];

const TABS = ['Overview', 'Instrument Taxonomy', 'KPI Library', 'SPT Trajectory', 'SPO Provider Matrix', 'Cost Savings Calculator', 'Framework Timeline'];

const Kpi = ({ label, value, sub, color }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: '14px 18px', flex: 1, minWidth: 140 }}>
    <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.gold, fontFamily: T.mono }}>{value}</div>
    {sub && <div style={{ fontSize: 10, color: T.textSec, marginTop: 3 }}>{sub}</div>}
  </div>
);

export default function SustainabilityLinkedFinancePage() {
  const [tab, setTab] = useState(0);
  const [notional, setNotional] = useState(2000);
  const [tenor, setTenor] = useState(7);
  const [instrument, setInstrument] = useState('SLB');

  const savings = useMemo(() => {
    const bpsMap = { GB: -25, SLB: -20, SLL: -12, Transition: -10 };
    const bps = bpsMap[instrument] || -20;
    const annual = (notional * bps / 100 * -1);
    const total = annual * tenor;
    return { bps, annual: annual.toFixed(1), total: total.toFixed(1) };
  }, [notional, tenor, instrument]);

  const sty = {
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '8px 10px', fontSize: 10, fontFamily: T.mono, color: T.gold, borderBottom: `1px solid ${T.border}` },
    td: { padding: '8px 10px', fontSize: 11, color: T.text, borderBottom: `1px solid ${T.borderL}` },
    panel: { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 14 },
    input: { background: T.surface, border: `1px solid ${T.border}`, color: T.text, borderRadius: 4, padding: '5px 8px', fontFamily: T.mono, fontSize: 11, width: 90 },
    btn: (on) => ({ padding: '5px 12px', borderRadius: 4, fontSize: 11, fontFamily: T.mono, cursor: 'pointer', background: on ? T.gold : T.surface, color: on ? T.bg : T.textSec, border: `1px solid ${T.border}` }),
  };

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: T.font, color: T.text, padding: 24 }}>
      <div style={{ borderBottom: `2px solid ${T.gold}`, paddingBottom: 12, marginBottom: 20 }}>
        <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, letterSpacing: 2 }}>EP-EB3 · IMPACT ADVISORY — BALANCE-SHEET VALUE FROM SUSTAINABILITY</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: '4px 0', color: T.text }}>Sustainability-Linked Finance Framework & SPO Advisory</h1>
        <div style={{ fontSize: 12, color: T.textSec }}>ICMA SLBP · GBP · LMA GLP · Green Bond · Green Loan · SLB · SLL · Transition Bond · SPO · KPI Architecture · 7 Tabs</div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <Kpi label="NET DEBT" value="₹7,507 Cr" sub="Client-anonymised RE-IPP FY25" />
        <Kpi label="LT BORROWINGS" value="₹9,857 Cr" sub="Mar 2025" />
        <Kpi label="REFI TRACK RECORD" value="-70bps" sub="₹7,700 Cr refinanced FY25" color={T.green} />
        <Kpi label="SLF UPLIFT TARGET" value="-15 to -25bps" sub="vs conventional INR" color={T.gold} />
        <Kpi label="ELIGIBLE ASSETS" value="₹18,000+ Cr" sub="Solar/Wind/FDRE/BESS/GH2" />
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `1px solid ${T.border}`, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <div key={i} onClick={() => setTab(i)} style={{ padding: '10px 16px', fontSize: 11, fontFamily: T.mono, cursor: 'pointer', borderBottom: tab === i ? `2px solid ${T.gold}` : 'none', color: tab === i ? T.gold : T.textSec }}>{t}</div>
        ))}
      </div>

      {tab === 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={sty.panel}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.gold, marginBottom: 8 }}>Two Instrument Classes</div>
            <p style={{ fontSize: 12, color: T.textSec, lineHeight: 1.6 }}><b>Use-of-proceeds</b> (Green Bond/Loan) earmarks capital for eligible green assets — pool exists, documentation is the gap.<br/><br/><b>KPI-linked</b> (SLB/SLL) ties coupon to pre-defined ESG KPIs with step-up/step-down mechanics. General corporate flexibility retained.</p>
          </div>
          <div style={sty.panel}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.gold, marginBottom: 8 }}>KPI Credibility Challenge</div>
            <p style={{ fontSize: 12, color: T.textSec, lineHeight: 1.6 }}>Generic capacity-addition KPIs are binary and lagging — poor fit for coupon adjustment. LCA-verified gCO₂e/kWh + TCFD-derived climate resilience score produce substantively differentiated KPIs vs peer Indian IPP SLBs.</p>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div>
          <div style={{ fontSize: 12, color: T.textSec, marginBottom: 10 }}>Sustainable finance instrument taxonomy · ICMA/LMA aligned.</div>
          <table style={sty.table}>
            <thead><tr><th style={sty.th}>Instrument</th><th style={sty.th}>Type</th><th style={sty.th}>Issuer form</th><th style={sty.th}>Pricing benefit</th><th style={sty.th}>Eligible assets</th><th style={sty.th}>SPO</th></tr></thead>
            <tbody>{INSTRUMENTS.map((r, i) => <tr key={i}><td style={{ ...sty.td, color: T.gold, fontWeight: 700 }}>{r.k}</td><td style={sty.td}>{r.t}</td><td style={sty.td}>{r.issuer}</td><td style={{ ...sty.td, color: T.green, fontFamily: T.mono }}>{r.pricing}</td><td style={sty.td}>{r.eligAssets}</td><td style={sty.td}>{r.spoReq}</td></tr>)}</tbody>
          </table>
        </div>
      )}

      {tab === 2 && (
        <div>
          <div style={{ fontSize: 12, color: T.textSec, marginBottom: 10 }}>KPI library — methodology-backed, third-party assurable, ICMA SLBP-aligned.</div>
          <table style={sty.table}>
            <thead><tr><th style={sty.th}>KPI</th><th style={sty.th}>Materiality</th><th style={sty.th}>Baseline</th><th style={sty.th}>2030 Target</th><th style={sty.th}>Source</th><th style={sty.th}>ICMA</th></tr></thead>
            <tbody>{KPI_LIBRARY.map((r, i) => <tr key={i}><td style={sty.td}>{r.kpi}</td><td style={{ ...sty.td, color: r.materiality.includes('Core') ? T.green : T.gold }}>{r.materiality}</td><td style={{ ...sty.td, fontFamily: T.mono }}>{r.baseline}</td><td style={{ ...sty.td, fontFamily: T.mono, color: T.gold }}>{r.target2030}</td><td style={sty.td}>{r.source}</td><td style={{ ...sty.td, color: T.green }}>{r.icmaAlign}</td></tr>)}</tbody>
          </table>
        </div>
      )}

      {tab === 3 && (
        <div>
          <div style={{ fontSize: 12, color: T.textSec, marginBottom: 10 }}>Sustainability Performance Target (SPT) trajectory — gCO₂e/kWh. Achievement enables step-down; miss triggers step-up.</div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={SPT_TRAJECTORY}><CartesianGrid stroke={T.border} strokeDasharray="3 3" /><XAxis dataKey="yr" stroke={T.textSec} tick={{ fontSize: 11 }} /><YAxis stroke={T.textSec} tick={{ fontSize: 11 }} /><Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}` }} /><Legend /><Line type="monotone" dataKey="target" stroke={T.gold} strokeWidth={2} name="Target SPT" /><Line type="monotone" dataKey="ambition" stroke="#27ae60" strokeWidth={2} strokeDasharray="4 4" name="Ambition (CBI)" /><ReferenceLine y={4.0} stroke="#27ae60" strokeDasharray="3 3" label={{ value: 'CBI 1.5°C aligned', fill: '#27ae60', fontSize: 10 }} /></LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 4 && (
        <div>
          <div style={{ fontSize: 12, color: T.textSec, marginBottom: 10 }}>SPO provider matrix — selection criteria: jurisdictional fit, methodology depth, turnaround.</div>
          <table style={sty.table}>
            <thead><tr><th style={sty.th}>Provider</th><th style={sty.th}>Coverage</th><th style={sty.th}>Fee range</th><th style={sty.th}>Turnaround</th></tr></thead>
            <tbody>{SPO_PROVIDERS.map((r, i) => <tr key={i}><td style={{ ...sty.td, color: T.gold }}>{r.sp}</td><td style={sty.td}>{r.cov}</td><td style={{ ...sty.td, fontFamily: T.mono }}>{r.fee}</td><td style={{ ...sty.td, fontFamily: T.mono }}>{r.td}</td></tr>)}</tbody>
          </table>
        </div>
      )}

      {tab === 5 && (
        <div>
          <div style={{ fontSize: 12, color: T.textSec, marginBottom: 14 }}>Cost-of-debt calculator — coupon savings against conventional baseline.</div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <label style={{ fontSize: 11, color: T.textSec }}>Notional (₹ Cr) <input type="number" value={notional} onChange={e=>setNotional(+e.target.value)} style={sty.input} /></label>
            <label style={{ fontSize: 11, color: T.textSec }}>Tenor (yr) <input type="number" value={tenor} onChange={e=>setTenor(+e.target.value)} style={sty.input} /></label>
            <div style={{ fontSize: 11, color: T.textSec }}>Instrument:</div>
            {['GB', 'SLB', 'SLL', 'Transition'].map(s => <div key={s} onClick={() => setInstrument(s)} style={sty.btn(instrument === s)}>{s}</div>)}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Kpi label="PRICING BENEFIT" value={`${savings.bps}bps`} sub="vs conventional" color={T.green} />
            <Kpi label="ANNUAL SAVING" value={`₹${savings.annual} Cr`} sub={`${notional} Cr × |${savings.bps}|bps`} color={T.green} />
            <Kpi label="TENOR TOTAL" value={`₹${savings.total} Cr`} sub={`${tenor}-yr cumulative`} color={T.gold} />
            <Kpi label="vs ADVISORY FEE" value="8-15x" sub="payback" />
          </div>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={COST_SAVINGS}><CartesianGrid stroke={T.border} strokeDasharray="3 3" /><XAxis dataKey="scen" stroke={T.textSec} tick={{ fontSize: 10 }} angle={-15} height={70} textAnchor="end" /><YAxis stroke={T.textSec} tick={{ fontSize: 11 }} /><Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}` }} /><Bar dataKey="cost" name="Annual cost saving ₹ Cr (neg=save)">{COST_SAVINGS.map((d, i) => <Cell key={i} fill={d.cost < 0 ? T.green : d.cost > 0 ? T.red : T.textSec} />)}</Bar></BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 6 && (
        <div>
          <div style={{ fontSize: 12, color: T.textSec, marginBottom: 10 }}>Framework & SPO timeline — 14-18 weeks from mandate to issuance-ready.</div>
          <table style={sty.table}>
            <thead><tr><th style={sty.th}>Phase</th><th style={sty.th}>Deliverable</th><th style={sty.th}>Week</th></tr></thead>
            <tbody>{[
              ['Framework draft', 'ICMA-aligned Green/SLB Framework · KPI calibration', 'W1-4'],
              ['Data enablement', 'LCA · TCFD · TNFD inputs harmonised', 'W3-8'],
              ['Pre-SPO gap review', 'Internal gap analysis · remediation', 'W6-8'],
              ['SPO submission', 'Sustainalytics/S&P formal engagement', 'W8-12'],
              ['SPO response & revisions', 'SPO iteration · final draft', 'W12-14'],
              ['Issuance-ready pack', 'Framework · SPO · allocation report · KPI dashboard', 'W14-16'],
              ['Annual covenant reporting', 'KPI tracking · assurance letter · investor report', 'Annual'],
            ].map((r, i) => <tr key={i}><td style={{ ...sty.td, color: T.gold }}>{r[0]}</td><td style={sty.td}>{r[1]}</td><td style={{ ...sty.td, fontFamily: T.mono }}>{r[2]}</td></tr>)}</tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: 24, padding: '10px 16px', background: T.surfaceH, borderRadius: 6, display: 'flex', justifyContent: 'space-between', fontFamily: T.mono, fontSize: 11, color: T.textMut }}>
        <span>EP-EB3 · Sustainability-Linked Finance · Impact Advisory</span>
        <span>ICMA · LMA · GBP · SLBP · SPO · 7 Tabs</span>
      </div>
    </div>
  );
}
