import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const T = { bg:'#0f1117', surface:'#1a1d27', surfaceH:'#22263a', border:'#2a2f45', borderL:'#1e2235', navy:'#1e3a5f', gold:'#d4a843', sage:'#2d6a4f', teal:'#0d4f5c', text:'#e8e0d0', textSec:'#a89880', textMut:'#6b6050', red:'#c0392b', green:'#27ae60', amber:'#e67e22', font:"'DM Sans',sans-serif", mono:"'JetBrains Mono',monospace" };

const ASSETS = [
  { id: 'RAJ-SOL-1', state: 'Rajasthan', tech: 'Solar PV', mw: 1200, heat: 92, water: 88, dust: 78, cyclone: 8, flood: 12, lat: 27.0, lon: 74.2 },
  { id: 'RAJ-SOL-2', state: 'Rajasthan', tech: 'Solar + BESS', mw: 450, heat: 94, water: 82, dust: 72, cyclone: 6, flood: 8, lat: 26.8, lon: 73.8 },
  { id: 'GUJ-WND-1', state: 'Gujarat', tech: 'Wind', mw: 620, heat: 58, water: 62, dust: 48, cyclone: 82, flood: 44, lat: 23.0, lon: 69.5 },
  { id: 'GUJ-SOL-1', state: 'Gujarat', tech: 'Solar PV', mw: 850, heat: 72, water: 70, dust: 54, cyclone: 68, flood: 38, lat: 23.2, lon: 71.0 },
  { id: 'ODI-FDR-1', state: 'Odisha', tech: 'FDRE + Green H2', mw: 1800, heat: 42, water: 58, dust: 22, cyclone: 88, flood: 72, lat: 20.3, lon: 85.8 },
  { id: 'TN-WND-1', state: 'Tamil Nadu', tech: 'Wind', mw: 380, heat: 48, water: 52, dust: 28, cyclone: 52, flood: 42, lat: 11.0, lon: 78.3 },
  { id: 'MP-SOL-1', state: 'Madhya Pradesh', tech: 'Solar PV', mw: 550, heat: 68, water: 58, dust: 48, cyclone: 12, flood: 28, lat: 23.5, lon: 77.2 },
  { id: 'KA-SOL-1', state: 'Karnataka', tech: 'Solar PV', mw: 420, heat: 62, water: 72, dust: 32, cyclone: 18, flood: 48, lat: 15.2, lon: 76.8 },
  { id: 'AP-SOL-1', state: 'Andhra Pradesh', tech: 'Solar PV', mw: 380, heat: 64, water: 58, dust: 38, cyclone: 68, flood: 58, lat: 15.8, lon: 78.8 },
  { id: 'OMN-NH3', state: 'Oman', tech: 'Green NH3', mw: 5200, heat: 95, water: 92, dust: 88, cyclone: 32, flood: 18, lat: 23.0, lon: 58.0 },
];

const HAZARDS = [
  { h: 'Chronic heat', ssp126_2030: 1.2, ssp245_2030: 1.5, ssp585_2030: 1.8, ssp126_2050: 1.4, ssp245_2050: 2.3, ssp585_2050: 3.4, unit: '°C avg' },
  { h: 'Water stress', ssp126_2030: 1.08, ssp245_2030: 1.15, ssp585_2030: 1.22, ssp126_2050: 1.12, ssp245_2050: 1.28, ssp585_2050: 1.48, unit: 'x baseline' },
  { h: 'Cyclone intensity', ssp126_2030: 1.04, ssp245_2030: 1.09, ssp585_2030: 1.14, ssp126_2050: 1.08, ssp245_2050: 1.18, ssp585_2050: 1.32, unit: 'x cat' },
  { h: 'Flood frequency', ssp126_2030: 1.10, ssp245_2030: 1.18, ssp585_2030: 1.28, ssp126_2050: 1.15, ssp245_2050: 1.35, ssp585_2050: 1.68, unit: 'x events/decade' },
  { h: 'Dust storms', ssp126_2030: 1.02, ssp245_2030: 1.06, ssp585_2030: 1.10, ssp126_2050: 1.05, ssp245_2050: 1.14, ssp585_2050: 1.22, unit: 'x AOD' },
];

const FINANCIAL_IMPACT = [
  { yr: 2030, ssp126: 2.1, ssp245: 3.8, ssp585: 5.9 },
  { yr: 2035, ssp126: 3.2, ssp245: 6.1, ssp585: 9.8 },
  { yr: 2040, ssp126: 4.4, ssp245: 8.9, ssp585: 14.5 },
  { yr: 2045, ssp126: 5.8, ssp245: 12.1, ssp585: 20.8 },
  { yr: 2050, ssp126: 7.2, ssp245: 15.8, ssp585: 29.2 },
];

const ADAPTATION_ROADMAP = [
  { asset: 'RAJ-SOL-1/2', intervention: 'Robotic waterless cleaning + sub-5°C inverter cooling', capex: 18, opex: -2.1, risk: 'Heat + water + dust', payback: 8.6 },
  { asset: 'GUJ-WND-1', intervention: 'Cyclone Cat-IV rated turbines (retrofit blades)', capex: 42, opex: 0.6, risk: 'Cyclone', payback: 6.2 },
  { asset: 'ODI-FDR-1', intervention: 'Elevated platform + cyclone shelter + rapid restart', capex: 65, opex: 0.8, risk: 'Cyclone + flood', payback: 5.8 },
  { asset: 'GUJ-SOL-1', intervention: 'Flood-grade inverter pedestals + trackers reinforcement', capex: 24, opex: 0.4, risk: 'Cyclone + flood', payback: 7.1 },
  { asset: 'OMN-NH3', intervention: 'Desalination redundancy + HVAC upgrade + dust shielding', capex: 95, opex: 1.2, risk: 'Heat + water + dust', payback: 4.9 },
];

const TABS = ['Overview', 'Asset Heat Map', 'SSP Scenario Projections', 'Financial Impact (RaR)', 'TCFD Four Pillars', 'Adaptation Roadmap', 'Scenario Stress Test'];

const Kpi = ({ label, value, sub, color }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: '14px 18px', flex: 1, minWidth: 140 }}>
    <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.gold, fontFamily: T.mono }}>{value}</div>
    {sub && <div style={{ fontSize: 10, color: T.textSec, marginTop: 3 }}>{sub}</div>}
  </div>
);

export default function TcfdPhysicalRiskAssessmentPage() {
  const [tab, setTab] = useState(0);
  const [scenario, setScenario] = useState('ssp245');

  const revenue2030 = 5800;
  const rarYr2030 = useMemo(() => FINANCIAL_IMPACT[0][scenario], [scenario]);
  const rar2050 = useMemo(() => FINANCIAL_IMPACT[4][scenario], [scenario]);
  const totalMw = ASSETS.reduce((a, b) => a + b.mw, 0);

  const heatMapCells = useMemo(() => {
    const cells = [];
    ASSETS.forEach(a => {
      ['heat', 'water', 'dust', 'cyclone', 'flood'].forEach(h => {
        cells.push({ asset: a.id, hazard: h, val: a[h] });
      });
    });
    return cells;
  }, []);

  const sty = {
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '8px 10px', fontSize: 10, fontFamily: T.mono, color: T.gold, borderBottom: `1px solid ${T.border}` },
    td: { padding: '8px 10px', fontSize: 11, color: T.text, borderBottom: `1px solid ${T.borderL}` },
    panel: { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 14 },
    btn: (on) => ({ padding: '5px 12px', borderRadius: 4, fontSize: 11, fontFamily: T.mono, cursor: 'pointer', background: on ? T.gold : T.surface, color: on ? T.bg : T.textSec, border: `1px solid ${T.border}` }),
    cellBg: (v) => v >= 80 ? 'rgba(192,57,43,0.45)' : v >= 60 ? 'rgba(230,126,34,0.35)' : v >= 40 ? 'rgba(212,168,67,0.25)' : 'rgba(39,174,96,0.20)',
  };

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: T.font, color: T.text, padding: 24 }}>
      <div style={{ borderBottom: `2px solid ${T.gold}`, paddingBottom: 12, marginBottom: 20 }}>
        <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, letterSpacing: 2 }}>EP-EB5 · IMPACT ADVISORY — BALANCE-SHEET VALUE FROM SUSTAINABILITY</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: '4px 0', color: T.text }}>TCFD Physical Climate Risk Assessment — Asset-Level RaR</h1>
        <div style={{ fontSize: 12, color: T.textSec }}>IFRS S2 · TCFD 4 pillars · CMIP6 SSP1-2.6/2-4.5/5-8.5 · 2030/2040/2050 horizons · Asset-level geo-referenced · 7 Tabs</div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <Kpi label="ASSETS ASSESSED" value={ASSETS.length} sub={`${totalMw.toLocaleString()} MW · 9 states + Oman`} />
        <Kpi label="HIGH RISK (≥80)" value={ASSETS.filter(a => Math.max(a.heat, a.water, a.cyclone, a.flood) >= 80).length} sub="any single hazard" color={T.red} />
        <Kpi label="RaR 2030 (SSP2-4.5)" value={`${FINANCIAL_IMPACT[0].ssp245}%`} sub="of portfolio revenue" color={T.amber} />
        <Kpi label="RaR 2050 (SSP5-8.5)" value={`${FINANCIAL_IMPACT[4].ssp585}%`} sub="high-emissions tail" color={T.red} />
        <Kpi label="TCFD MATURITY" value="Phase 3" sub="Scenario + Financial" color={T.green} />
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `1px solid ${T.border}`, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <div key={i} onClick={() => setTab(i)} style={{ padding: '10px 16px', fontSize: 11, fontFamily: T.mono, cursor: 'pointer', borderBottom: tab === i ? `2px solid ${T.gold}` : 'none', color: tab === i ? T.gold : T.textSec }}>{t}</div>
        ))}
      </div>

      {tab === 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={sty.panel}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.gold, marginBottom: 8 }}>BRSR Floor vs TCFD Depth</div>
            <p style={{ fontSize: 12, color: T.textSec, lineHeight: 1.6 }}>BRSR addresses climate risk <b>qualitatively at entity level</b>. TCFD delivers <b>asset-level, scenario-modelled, financially quantified</b> risk — revenue-at-risk, opex implications, asset impairment probability — across 2030/2040/2050 horizons. This is the output long-tenor lenders and insurance underwriters require.</p>
          </div>
          <div style={sty.panel}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.gold, marginBottom: 8 }}>Why Location Matters</div>
            <p style={{ fontSize: 12, color: T.textSec, lineHeight: 1.6 }}>Rajasthan → chronic heat + water + dust (panel efficiency, cleaning, inverter thermal). Gujarat → cyclone corridor. Odisha → highest-frequency cyclone belt in India. Oman → acute heat + desalination dependency. PPA tenor 25yr + debt tenor 15-20yr require forward-looking climate adjustment.</p>
          </div>
          <div style={{ ...sty.panel, gridColumn: '1 / span 2' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.gold, marginBottom: 10 }}>Portfolio MW by State</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={Object.values(ASSETS.reduce((a, b) => { a[b.state] = a[b.state] || { state: b.state, mw: 0 }; a[b.state].mw += b.mw; return a; }, {}))}><CartesianGrid stroke={T.border} strokeDasharray="3 3" /><XAxis dataKey="state" stroke={T.textSec} tick={{ fontSize: 11 }} angle={-15} height={60} textAnchor="end" /><YAxis stroke={T.textSec} tick={{ fontSize: 11 }} /><Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}` }} /><Bar dataKey="mw" fill={T.gold} /></BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div>
          <div style={{ fontSize: 12, color: T.textSec, marginBottom: 10 }}>Hazard heat map · score 0-100 · scoring geo-referenced against CMIP6 multi-model mean, IBAT layers, and national hazard atlases.</div>
          <table style={sty.table}>
            <thead><tr><th style={sty.th}>Asset</th><th style={sty.th}>State</th><th style={sty.th}>Tech</th><th style={sty.th}>MW</th><th style={sty.th}>Heat</th><th style={sty.th}>Water</th><th style={sty.th}>Dust</th><th style={sty.th}>Cyclone</th><th style={sty.th}>Flood</th></tr></thead>
            <tbody>{ASSETS.map((a, i) => <tr key={i}><td style={{ ...sty.td, color: T.gold }}>{a.id}</td><td style={sty.td}>{a.state}</td><td style={sty.td}>{a.tech}</td><td style={{ ...sty.td, fontFamily: T.mono }}>{a.mw}</td>{['heat', 'water', 'dust', 'cyclone', 'flood'].map(h => <td key={h} style={{ ...sty.td, background: sty.cellBg(a[h]), fontFamily: T.mono, textAlign: 'center', fontWeight: 700 }}>{a[h]}</td>)}</tr>)}</tbody>
          </table>
        </div>
      )}

      {tab === 2 && (
        <div>
          <div style={{ fontSize: 12, color: T.textSec, marginBottom: 10 }}>CMIP6 SSP scenarios — hazard multipliers vs 2020 baseline. SSP1-2.6 (Paris) · SSP2-4.5 (policies) · SSP5-8.5 (high).</div>
          <table style={sty.table}>
            <thead><tr><th style={sty.th}>Hazard</th><th style={sty.th}>Unit</th><th style={sty.th}>SSP1-2.6 2030</th><th style={sty.th}>SSP2-4.5 2030</th><th style={sty.th}>SSP5-8.5 2030</th><th style={sty.th}>SSP1-2.6 2050</th><th style={sty.th}>SSP2-4.5 2050</th><th style={sty.th}>SSP5-8.5 2050</th></tr></thead>
            <tbody>{HAZARDS.map((h, i) => <tr key={i}><td style={{ ...sty.td, color: T.gold }}>{h.h}</td><td style={sty.td}>{h.unit}</td><td style={{ ...sty.td, fontFamily: T.mono }}>{h.ssp126_2030}</td><td style={{ ...sty.td, fontFamily: T.mono, color: T.gold }}>{h.ssp245_2030}</td><td style={{ ...sty.td, fontFamily: T.mono, color: T.amber }}>{h.ssp585_2030}</td><td style={{ ...sty.td, fontFamily: T.mono }}>{h.ssp126_2050}</td><td style={{ ...sty.td, fontFamily: T.mono, color: T.gold }}>{h.ssp245_2050}</td><td style={{ ...sty.td, fontFamily: T.mono, color: T.red, fontWeight: 700 }}>{h.ssp585_2050}</td></tr>)}</tbody>
          </table>
        </div>
      )}

      {tab === 3 && (
        <div>
          <div style={{ fontSize: 12, color: T.textSec, marginBottom: 10 }}>Revenue-at-Risk — % of portfolio revenue exposed under each SSP scenario.</div>
          <div style={{ marginBottom: 10, display: 'flex', gap: 6 }}>
            {['ssp126', 'ssp245', 'ssp585'].map(s => <div key={s} onClick={() => setScenario(s)} style={sty.btn(scenario === s)}>{s.toUpperCase().replace('SSP', 'SSP')}</div>)}
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={FINANCIAL_IMPACT}><CartesianGrid stroke={T.border} strokeDasharray="3 3" /><XAxis dataKey="yr" stroke={T.textSec} tick={{ fontSize: 11 }} /><YAxis stroke={T.textSec} tick={{ fontSize: 11 }} unit="%" /><Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}` }} /><Legend /><Area type="monotone" dataKey="ssp585" stroke="#c0392b" fill="#c0392b" fillOpacity={0.3} name="SSP5-8.5" /><Area type="monotone" dataKey="ssp245" stroke={T.gold} fill={T.gold} fillOpacity={0.3} name="SSP2-4.5" /><Area type="monotone" dataKey="ssp126" stroke="#27ae60" fill="#27ae60" fillOpacity={0.3} name="SSP1-2.6" /></AreaChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
            <Kpi label="PORTFOLIO REV" value={`₹${revenue2030} Cr`} sub="FY30 projected" />
            <Kpi label={`RaR 2030 (${scenario.toUpperCase()})`} value={`${rarYr2030}%`} sub={`₹${(revenue2030 * rarYr2030 / 100).toFixed(0)} Cr exposed`} color={T.amber} />
            <Kpi label={`RaR 2050 (${scenario.toUpperCase()})`} value={`${rar2050}%`} sub="late-horizon tail" color={T.red} />
            <Kpi label="PV OF RaR" value={`₹${(revenue2030 * rar2050 / 100 / Math.pow(1.09, 25)).toFixed(0)} Cr`} sub="NPV @ 9%, 25-yr" />
          </div>
        </div>
      )}

      {tab === 4 && (
        <div>
          <div style={{ fontSize: 12, color: T.textSec, marginBottom: 10 }}>TCFD four-pillar maturity · IFRS S2-aligned.</div>
          <table style={sty.table}>
            <thead><tr><th style={sty.th}>Pillar</th><th style={sty.th}>Scope</th><th style={sty.th}>Current</th><th style={sty.th}>Target</th><th style={sty.th}>Deliverable</th></tr></thead>
            <tbody>{[
              ['Governance', 'Board climate oversight · mgmt responsibility', 'Phase 1', 'Phase 3', 'Board ESG Committee · Climate Risk Officer · formal delegation'],
              ['Strategy', 'Scenario analysis · business model impact', 'Phase 1', 'Phase 3', 'SSP1-2.6/2-4.5/5-8.5 × 2030/2040/2050 × asset-level RaR'],
              ['Risk Management', 'Identification · assessment · integration', 'Phase 1', 'Phase 3', 'Integrated ERM · KRI dashboard · quarterly board reporting'],
              ['Metrics & Targets', 'GHG · climate KPIs · Scope 1/2/3 · targets', 'Phase 2', 'Phase 3', 'SBTi target · Scope 3 screening · transition plan'],
            ].map((r, i) => <tr key={i}><td style={{ ...sty.td, color: T.gold, fontWeight: 700 }}>{r[0]}</td><td style={sty.td}>{r[1]}</td><td style={{ ...sty.td, color: T.red }}>{r[2]}</td><td style={{ ...sty.td, color: T.green }}>{r[3]}</td><td style={{ ...sty.td, fontSize: 10 }}>{r[4]}</td></tr>)}</tbody>
          </table>
        </div>
      )}

      {tab === 5 && (
        <div>
          <div style={{ fontSize: 12, color: T.textSec, marginBottom: 10 }}>Adaptation roadmap — engineering interventions prioritised by risk reduction × payback. Capex in ₹ Cr, opex ± ₹ Cr/yr.</div>
          <table style={sty.table}>
            <thead><tr><th style={sty.th}>Asset</th><th style={sty.th}>Intervention</th><th style={sty.th}>Capex</th><th style={sty.th}>ΔOpex</th><th style={sty.th}>Risk addressed</th><th style={sty.th}>Payback (yr)</th></tr></thead>
            <tbody>{ADAPTATION_ROADMAP.map((r, i) => <tr key={i}><td style={{ ...sty.td, color: T.gold }}>{r.asset}</td><td style={sty.td}>{r.intervention}</td><td style={{ ...sty.td, fontFamily: T.mono }}>₹{r.capex}</td><td style={{ ...sty.td, fontFamily: T.mono, color: r.opex < 0 ? T.green : T.amber }}>{r.opex > 0 ? '+' : ''}{r.opex}</td><td style={sty.td}>{r.risk}</td><td style={{ ...sty.td, fontFamily: T.mono, color: r.payback < 6 ? T.green : r.payback < 8 ? T.gold : T.red, fontWeight: 700 }}>{r.payback}</td></tr>)}</tbody>
          </table>
        </div>
      )}

      {tab === 6 && (
        <div>
          <div style={{ fontSize: 12, color: T.textSec, marginBottom: 10 }}>Portfolio stress test — compounded hazard exposure vs SSP scenarios. DSCR degradation by asset.</div>
          <ResponsiveContainer width="100%" height={320}>
            <ScatterChart><CartesianGrid stroke={T.border} strokeDasharray="3 3" /><XAxis type="number" dataKey="x" name="Hazard score" stroke={T.textSec} tick={{ fontSize: 11 }} domain={[0, 100]} unit="" /><YAxis type="number" dataKey="y" name="DSCR degradation" stroke={T.textSec} tick={{ fontSize: 11 }} unit="pp" /><ZAxis type="number" dataKey="z" range={[80, 600]} /><Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}` }} cursor={{ strokeDasharray: '3 3' }} /><Scatter data={ASSETS.map(a => {
              const combo = (a.heat + a.water + a.cyclone + a.flood) / 4;
              const dscrHit = combo * 0.03;
              return { x: combo, y: dscrHit, z: a.mw, name: a.id };
            })} fill={T.gold}>{ASSETS.map((a, i) => { const combo = (a.heat + a.water + a.cyclone + a.flood) / 4; return <Cell key={i} fill={combo >= 70 ? T.red : combo >= 50 ? T.gold : T.green} />; })}</Scatter></ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      <div style={{ marginTop: 24, padding: '10px 16px', background: T.surfaceH, borderRadius: 6, display: 'flex', justifyContent: 'space-between', fontFamily: T.mono, fontSize: 11, color: T.textMut }}>
        <span>EP-EB5 · TCFD Physical Climate Risk · Impact Advisory</span>
        <span>IFRS S2 · CMIP6 SSP · 2030/2040/2050 · Asset-level RaR · 7 Tabs</span>
      </div>
    </div>
  );
}
