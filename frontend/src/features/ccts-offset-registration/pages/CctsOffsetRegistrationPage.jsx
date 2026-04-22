import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const T = { bg:'#0f1117', surface:'#1a1d27', surfaceH:'#22263a', border:'#2a2f45', borderL:'#1e2235', navy:'#1e3a5f', gold:'#d4a843', sage:'#2d6a4f', teal:'#0d4f5c', text:'#e8e0d0', textSec:'#a89880', textMut:'#6b6050', red:'#c0392b', green:'#27ae60', amber:'#e67e22', font:"'DM Sans',sans-serif", mono:"'JetBrains Mono',monospace" };

const METHODS = [
  { id: 'BEE-RE-001', name: 'Renewable Energy with Storage (BESS/FDRE)', add: 'High', elig: 'Eligible', applicable: true },
  { id: 'BEE-GH2-002', name: 'Green H2 production via electrolysis', add: 'High', elig: 'Eligible', applicable: true },
  { id: 'BEE-IEE-003', name: 'Industrial Energy Efficiency', add: 'Med', elig: 'Eligible', applicable: true },
  { id: 'BEE-WTE-004', name: 'Waste-to-Energy', add: 'Med', elig: 'Eligible', applicable: false },
  { id: 'BEE-AFOL-005', name: 'Afforestation / Land-Use', add: 'Med', elig: 'Eligible', applicable: false },
  { id: 'BEE-GRID-006', name: 'Grid-connected utility solar (stand-alone)', add: 'LOW', elig: 'Eligible w/ scrutiny', applicable: false },
  { id: 'BEE-WIND-007', name: 'Onshore wind (stand-alone)', add: 'LOW', elig: 'Eligible w/ scrutiny', applicable: false },
  { id: 'BEE-EV-008', name: 'Transport & EV charging', add: 'Med', elig: 'Eligible', applicable: false },
];

const ELIGIBLE_ASSETS = [
  { asset: 'BESS-A (33 MW · Rajasthan)', method: 'BEE-RE-001', baseline: 0.71, proj: 0.05, mtCo2Yr: 42, addStatus: 'Pass' },
  { asset: 'BESS-B (76 MW · Rajasthan)', method: 'BEE-RE-001', baseline: 0.71, proj: 0.05, mtCo2Yr: 96, addStatus: 'Pass' },
  { asset: 'FDRE-IV (450 MW/1,800 MWh)', method: 'BEE-RE-001', baseline: 0.71, proj: 0.06, mtCo2Yr: 540, addStatus: 'Pass' },
  { asset: 'Green NH3 export (100 ktpa)', method: 'BEE-GH2-002', baseline: 2.4, proj: 0.15, mtCo2Yr: 225, addStatus: 'Pass' },
  { asset: 'Green H2 (Odisha FDRE-linked)', method: 'BEE-GH2-002', baseline: 2.4, proj: 0.18, mtCo2Yr: 72, addStatus: 'Pass' },
  { asset: 'Module Mfg captive solar', method: 'BEE-IEE-003', baseline: 0.71, proj: 0.10, mtCo2Yr: 28, addStatus: 'Pass' },
];

const PRICE_SCENARIOS = [
  { yr: '2026', low: 5.5, mid: 7.8, high: 10.5 },
  { yr: '2027', low: 6.2, mid: 8.8, high: 12.0 },
  { yr: '2028', low: 7.0, mid: 9.9, high: 14.2 },
  { yr: '2029', low: 7.8, mid: 11.3, high: 16.8 },
  { yr: '2030', low: 8.5, mid: 12.8, high: 19.5 },
];

const PROJECT_CYCLE = [
  { step: 'PDD Authoring', wk: '1-4', output: 'Project Design Document (BEE template)' },
  { step: 'ACVA Validation', wk: '5-8', output: 'Accredited Carbon Verification Agency sign-off' },
  { step: 'BEE Registration', wk: '9-10', output: 'Registry ID · crediting period activation' },
  { step: 'Annual MRV', wk: 'Year 1+', output: 'Monitoring report · CCC issuance request' },
  { step: 'ACVA Verification', wk: 'Year 1+', output: 'Third-party verification of reductions' },
  { step: 'CCC Issuance', wk: 'Year 1+', output: 'Credits issued to registry account' },
  { step: 'Exchange Listing', wk: 'Year 1+', output: 'CERC power exchange · banking · trading' },
];

const TABS = ['Overview', 'Methodology Map', 'Eligible Asset Portfolio', 'Additionality Test', 'Price Scenarios & Revenue', 'Project Cycle', 'MRV & Banking Strategy'];

const Kpi = ({ label, value, sub, color }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: '14px 18px', flex: 1, minWidth: 140 }}>
    <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.gold, fontFamily: T.mono }}>{value}</div>
    {sub && <div style={{ fontSize: 10, color: T.textSec, marginTop: 3 }}>{sub}</div>}
  </div>
);

export default function CctsOffsetRegistrationPage() {
  const [tab, setTab] = useState(0);
  const [priceScenario, setPriceScenario] = useState('mid');
  const [bankYears, setBankYears] = useState(3);

  const totalMtYr = ELIGIBLE_ASSETS.reduce((a, b) => a + b.mtCo2Yr, 0);
  const priceIdx = { low: 0, mid: 1, high: 2 };

  const revenue2030 = useMemo(() => {
    const price = PRICE_SCENARIOS.find(p => p.yr === '2030')[priceScenario];
    return (totalMtYr * price).toFixed(1);
  }, [priceScenario, totalMtYr]);

  const bankedValue = useMemo(() => {
    const p2030 = PRICE_SCENARIOS[PRICE_SCENARIOS.length - 1][priceScenario];
    const p2026 = PRICE_SCENARIOS[0][priceScenario];
    return { saleNow: (totalMtYr * p2026 * bankYears).toFixed(1), saleBanked: (totalMtYr * p2030 * bankYears).toFixed(1) };
  }, [priceScenario, bankYears, totalMtYr]);

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
        <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, letterSpacing: 2 }}>EP-EB2 · IMPACT ADVISORY — BALANCE-SHEET VALUE FROM SUSTAINABILITY</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: '4px 0', color: T.text }}>CCTS Offset Mechanism — Registration, Trading & Banking Strategy</h1>
        <div style={{ fontSize: 12, color: T.textSec }}>India Carbon Market · BEE 8 methodologies (Mar 2025) · CCC issuance · CERC exchange · Banking strategy · Additionality discipline · 7 Tabs</div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <Kpi label="ELIGIBLE PORTFOLIO" value={`${ELIGIBLE_ASSETS.length} assets`} sub="BESS · FDRE · GH2 · Mfg EE" color={T.green} />
        <Kpi label="CCC/YR (MID)" value={`${(totalMtYr/1000).toFixed(1)} k`} sub="tonnes CO₂e avoided" />
        <Kpi label="2030 REVENUE" value={`₹${revenue2030} L`} sub={`${priceScenario} scenario`} color={T.gold} />
        <Kpi label="PRICE RANGE" value="₹450–900" sub="per CCC · BEE-indicative" />
        <Kpi label="ADDITIONALITY" value="6/6 PASS" sub="storage + GH2 + captive RE" color={T.green} />
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `1px solid ${T.border}`, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <div key={i} onClick={() => setTab(i)} style={{ padding: '10px 16px', fontSize: 11, fontFamily: T.mono, cursor: 'pointer', borderBottom: tab === i ? `2px solid ${T.gold}` : 'none', color: tab === i ? T.gold : T.textSec }}>{t}</div>
        ))}
      </div>

      {tab === 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={sty.panel}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.gold, marginBottom: 8 }}>Non-Obligated Credit Generator</div>
            <p style={{ fontSize: 12, color: T.textSec, lineHeight: 1.6 }}>A pure-play RE-IPP carries no compliance burden under CCTS but is structurally positioned as a <b>credit generator and seller</b>. The Offset Mechanism — accepting registrations since June 2025 — converts real-world abatement into tradable CCCs on CERC exchanges.</p>
          </div>
          <div style={sty.panel}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.gold, marginBottom: 8 }}>Critical Additionality Discipline</div>
            <p style={{ fontSize: 12, color: T.textSec, lineHeight: 1.6 }}>Standard utility solar under SECI/NTPC PPAs FAILS financial additionality at current tariffs — a registration here invites BEE scrutiny and credit-quality discount. The engagement is explicitly scoped to 3 high-integrity categories: <b>BESS/FDRE</b>, <b>Green H2/NH3</b>, and <b>Manufacturing decarbonisation actions</b>.</p>
          </div>
          <div style={{ ...sty.panel, gridColumn: '1 / span 2' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.gold, marginBottom: 10 }}>Annual CCC Pipeline (ktCO₂e/yr)</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ELIGIBLE_ASSETS}><CartesianGrid stroke={T.border} strokeDasharray="3 3" /><XAxis dataKey="asset" stroke={T.textSec} tick={{ fontSize: 10 }} angle={-15} height={60} textAnchor="end" /><YAxis stroke={T.textSec} tick={{ fontSize: 11 }} /><Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}` }} /><Bar dataKey="mtCo2Yr" fill={T.gold} /></BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div>
          <div style={{ fontSize: 12, color: T.textSec, marginBottom: 10 }}>BEE-approved methodologies (March 2025). Applicability flagged based on RE-IPP + solar mfg + green H2 archetype.</div>
          <table style={sty.table}>
            <thead><tr><th style={sty.th}>Method ID</th><th style={sty.th}>Name</th><th style={sty.th}>Additionality</th><th style={sty.th}>Eligibility</th><th style={sty.th}>Applicable</th></tr></thead>
            <tbody>{METHODS.map((m, i) => <tr key={i} style={{ background: m.applicable ? 'rgba(212,168,67,0.07)' : 'transparent' }}><td style={{ ...sty.td, fontFamily: T.mono, color: T.gold }}>{m.id}</td><td style={sty.td}>{m.name}</td><td style={{ ...sty.td, color: m.add === 'High' ? T.green : m.add === 'Med' ? T.gold : T.red }}>{m.add}</td><td style={sty.td}>{m.elig}</td><td style={{ ...sty.td, color: m.applicable ? T.green : T.textMut, fontWeight: 700 }}>{m.applicable ? '✓' : '—'}</td></tr>)}</tbody>
          </table>
        </div>
      )}

      {tab === 2 && (
        <div>
          <div style={{ fontSize: 12, color: T.textSec, marginBottom: 10 }}>Eligible asset portfolio — emissions reduction per year vs grid baseline (0.71 tCO₂/MWh) or grey NH3 (2.4 tCO₂/t NH3).</div>
          <table style={sty.table}>
            <thead><tr><th style={sty.th}>Asset</th><th style={sty.th}>Methodology</th><th style={sty.th}>Baseline</th><th style={sty.th}>Project</th><th style={sty.th}>ktCO₂e/yr</th><th style={sty.th}>Additionality</th></tr></thead>
            <tbody>{ELIGIBLE_ASSETS.map((r, i) => <tr key={i}><td style={sty.td}>{r.asset}</td><td style={{ ...sty.td, color: T.gold, fontFamily: T.mono }}>{r.method}</td><td style={sty.td}>{r.baseline}</td><td style={sty.td}>{r.proj}</td><td style={{ ...sty.td, fontFamily: T.mono }}>{r.mtCo2Yr}</td><td style={{ ...sty.td, color: T.green, fontWeight: 700 }}>{r.addStatus}</td></tr>)}</tbody>
          </table>
        </div>
      )}

      {tab === 3 && (
        <div>
          <div style={{ fontSize: 12, color: T.textSec, marginBottom: 10 }}>Additionality 4-prong test — applied per asset class. Failure on any single test invalidates registration.</div>
          <table style={sty.table}>
            <thead><tr><th style={sty.th}>Test</th><th style={sty.th}>BESS/FDRE</th><th style={sty.th}>Green H2/NH3</th><th style={sty.th}>Mfg Captive Solar</th><th style={sty.th}>Utility Solar (excluded)</th></tr></thead>
            <tbody>{[
              { t: 'Regulatory', b: '✓ Voluntary beyond RPO', h: '✓ No mandate', m: '✓ Beyond PAT', u: '✗ Tariff-mandated' },
              { t: 'Financial', b: '✓ IRR<hurdle without', h: '✓ Capex not viable', m: '✓ Positive NPV requires', u: '✗ IRR≥hurdle' },
              { t: 'Barrier', b: '✓ Storage capex premium', h: '✓ First-of-kind scale', m: '✓ Switching cost', u: '✗ Mature tech' },
              { t: 'Common Practice', b: '✓ <3% penetration', h: '✓ <1% penetration', m: '✓ <5% penetration', u: '✗ >15% penetration' },
            ].map((r, i) => <tr key={i}><td style={{ ...sty.td, color: T.gold }}>{r.t}</td><td style={{ ...sty.td, color: T.green }}>{r.b}</td><td style={{ ...sty.td, color: T.green }}>{r.h}</td><td style={{ ...sty.td, color: T.green }}>{r.m}</td><td style={{ ...sty.td, color: T.red }}>{r.u}</td></tr>)}</tbody>
          </table>
        </div>
      )}

      {tab === 4 && (
        <div>
          <div style={{ fontSize: 12, color: T.textSec, marginBottom: 10 }}>CCC price scenarios 2026-2030 (BEE-linked market sources — indicative).</div>
          <div style={{ marginBottom: 10, display: 'flex', gap: 6 }}>
            {['low', 'mid', 'high'].map(s => <div key={s} onClick={() => setPriceScenario(s)} style={sty.btn(priceScenario === s)}>{s.toUpperCase()}</div>)}
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={PRICE_SCENARIOS}><CartesianGrid stroke={T.border} strokeDasharray="3 3" /><XAxis dataKey="yr" stroke={T.textSec} tick={{ fontSize: 11 }} /><YAxis stroke={T.textSec} tick={{ fontSize: 11 }} /><Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}` }} /><Legend /><Area type="monotone" dataKey="high" stroke="#27ae60" fill="#27ae60" fillOpacity={0.3} name="High" /><Area type="monotone" dataKey="mid" stroke={T.gold} fill={T.gold} fillOpacity={0.4} name="Mid" /><Area type="monotone" dataKey="low" stroke="#c0392b" fill="#c0392b" fillOpacity={0.3} name="Low" /></AreaChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
            <Kpi label="CCC/YR TOTAL" value={`${totalMtYr.toLocaleString()} t`} sub="across 6 eligible assets" />
            <Kpi label="REVENUE 2026" value={`₹${(totalMtYr * PRICE_SCENARIOS[0][priceScenario]/100).toFixed(1)} Cr`} sub={`${priceScenario} price ₹${PRICE_SCENARIOS[0][priceScenario]*100}/CCC`} />
            <Kpi label="REVENUE 2030" value={`₹${(totalMtYr * PRICE_SCENARIOS[4][priceScenario]/100).toFixed(1)} Cr`} sub={`${priceScenario} price ₹${PRICE_SCENARIOS[4][priceScenario]*100}/CCC`} color={T.gold} />
            <Kpi label="5YR CUM" value={`₹${((totalMtYr * PRICE_SCENARIOS.reduce((a,b)=>a+b[priceScenario],0)/100)).toFixed(1)} Cr`} sub="banking-neutral" color={T.green} />
          </div>
        </div>
      )}

      {tab === 5 && (
        <div>
          <div style={{ fontSize: 12, color: T.textSec, marginBottom: 10 }}>CCTS Project Cycle — PDD → ACVA → BEE registry → MRV → CCC issuance → exchange. End-to-end advisory-managed.</div>
          <table style={sty.table}>
            <thead><tr><th style={sty.th}>Step</th><th style={sty.th}>Week</th><th style={sty.th}>Output</th></tr></thead>
            <tbody>{PROJECT_CYCLE.map((r, i) => <tr key={i}><td style={{ ...sty.td, color: T.gold, fontWeight: 700 }}>{r.step}</td><td style={{ ...sty.td, fontFamily: T.mono }}>{r.wk}</td><td style={sty.td}>{r.output}</td></tr>)}</tbody>
          </table>
        </div>
      )}

      {tab === 6 && (
        <div>
          <div style={{ fontSize: 12, color: T.textSec, marginBottom: 14 }}>Banking strategy — CCTS permits unlimited banking. Hold vs sell optimisation under price trajectory.</div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <label style={{ fontSize: 11, color: T.textSec }}>Banking horizon (yrs) <input type="number" value={bankYears} onChange={e=>setBankYears(+e.target.value)} style={sty.input} /></label>
            <div style={{ fontSize: 11, color: T.textSec }}>Scenario:</div>
            {['low', 'mid', 'high'].map(s => <div key={s} onClick={() => setPriceScenario(s)} style={sty.btn(priceScenario === s)}>{s.toUpperCase()}</div>)}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Kpi label="SELL NOW (2026)" value={`₹${bankedValue.saleNow} L`} sub={`${bankYears} vintages at 2026 price`} />
            <Kpi label="BANK TO 2030" value={`₹${bankedValue.saleBanked} L`} sub={`${bankYears} vintages at 2030 price`} color={T.green} />
            <Kpi label="BANKING UPLIFT" value={`${(((+bankedValue.saleBanked - +bankedValue.saleNow) / +bankedValue.saleNow) * 100).toFixed(0)}%`} sub="vs sell-now" color={T.gold} />
          </div>
          <div style={{ ...sty.panel, marginTop: 14 }}>
            <div style={{ fontSize: 11, color: T.gold, fontWeight: 700, marginBottom: 6 }}>MRV & Annual Monitoring</div>
            <div style={{ fontSize: 11, color: T.textSec, lineHeight: 1.7 }}>
              • Quarterly inverter-level telemetry + SCADA integration (digital MRV tier 3)<br/>
              • Annual ACVA verification with site audit<br/>
              • CCC issuance request filed within 60 days of annual MRV<br/>
              • Portfolio tracked in BEE registry account · exchange-ready for liquidity events
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 24, padding: '10px 16px', background: T.surfaceH, borderRadius: 6, display: 'flex', justifyContent: 'space-between', fontFamily: T.mono, fontSize: 11, color: T.textMut }}>
        <span>EP-EB2 · CCTS Offset Mechanism · Impact Advisory</span>
        <span>BEE · CERC · CCC · Additionality · MRV · Banking · 7 Tabs</span>
      </div>
    </div>
  );
}
