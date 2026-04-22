import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { T, useScenario, ToolkitBar, NumInput, TextInput, Kpi, Panel, Table, td, TabBar, PageHeader, Badge, downloadText, toCsv, openDeliverable, html } from '../../_shared/AdvisoryToolkit';

const METHODS = {
  'M-001 Grid RE': { baseline: 0.71, crediting: 7 },
  'M-002 Solar thermal': { baseline: 0.71, crediting: 10 },
  'M-003 BESS': { baseline: 0.50, crediting: 7 },
  'M-004 Green H₂': { baseline: 10.5, crediting: 10 },
  'M-005 Green NH₃': { baseline: 2.8, crediting: 10 },
  'M-006 EE industry': { baseline: 0.55, crediting: 7 },
  'M-007 Biomass/BECCS': { baseline: 0.85, crediting: 20 },
  'M-008 ARR/AFOLU': { baseline: 0, crediting: 20 },
};

const DEFAULTS = {
  portfolioName: 'Integrated RE-IPP Client (anonymised)',
  priceScenarios: { low: 650, mid: 1100, high: 1850 },
  discountRate: 10,
  projects: [
    { id: 'BESS-A', name: 'BESS 250 MW (Rajasthan)', method: 'M-003 BESS', mw: 250, annualOutputMwh: 500000, projectEf: 0.08, startYr: 2026, vintageYrs: 7, ccc: 'Mid', additionality: { invest: true, tech: true, common: true, regBarrier: false } },
    { id: 'BESS-B', name: 'BESS 150 MW (Gujarat)',   method: 'M-003 BESS', mw: 150, annualOutputMwh: 300000, projectEf: 0.08, startYr: 2026, vintageYrs: 7, ccc: 'Mid', additionality: { invest: true, tech: true, common: true, regBarrier: true } },
    { id: 'FDRE-IV', name: 'FDRE 500 MW (Odisha)',    method: 'M-001 Grid RE', mw: 500, annualOutputMwh: 2400000, projectEf: 0.05, startYr: 2027, vintageYrs: 7, ccc: 'High', additionality: { invest: true, tech: true, common: false, regBarrier: true } },
    { id: 'GH2-1',  name: 'Green H₂ 50 MW electrolyser', method: 'M-004 Green H₂', mw: 50, annualOutputMwh: 7200, projectEf: 1.2, startYr: 2027, vintageYrs: 10, ccc: 'High', additionality: { invest: true, tech: true, common: true, regBarrier: true } },
    { id: 'NH3-1',  name: 'Green NH₃ 200 ktpa',          method: 'M-005 Green NH₃', mw: 500, annualOutputMwh: 200000, projectEf: 0.4, startYr: 2028, vintageYrs: 10, ccc: 'High', additionality: { invest: true, tech: true, common: true, regBarrier: true } },
    { id: 'MFG-CAP', name: 'Captive solar 120 MW (Mfg)',  method: 'M-001 Grid RE', mw: 120, annualOutputMwh: 280000, projectEf: 0.05, startYr: 2026, vintageYrs: 7, ccc: 'Low', additionality: { invest: false, tech: false, common: false, regBarrier: false } },
  ],
};

function calcEru(p) {
  const m = METHODS[p.method]; if (!m) return { eru: 0, baseline: 0, project: 0 };
  const baseline = p.annualOutputMwh * m.baseline;
  const project = p.annualOutputMwh * p.projectEf;
  return { eru: Math.max(0, baseline - project), baseline, project };
}
function addlCount(a) { return Object.values(a).filter(Boolean).length; }
function npv(cashflows, rate) { return cashflows.reduce((acc, cf, t) => acc + cf / Math.pow(1 + rate, t + 1), 0); }
const TABS = ['Inputs & Projects', 'ERU Calculations', 'Additionality', 'Price Scenarios', 'Registration Cycle', 'Deliverables'];

export default function CctsOffsetRegistrationPage() {
  const sc = useScenario('eb2_ccts', DEFAULTS);
  const [tab, setTab] = useState(0);
  const s = sc.state;

  const projects = useMemo(() => s.projects.map(p => {
    const e = calcEru(p);
    const aCount = addlCount(p.additionality);
    const passes = aCount >= 3;
    const lifetimeEru = e.eru * p.vintageYrs;
    const cf = new Array(p.vintageYrs).fill(e.eru * s.priceScenarios[p.ccc === 'High' ? 'high' : p.ccc === 'Low' ? 'low' : 'mid']);
    const pv = npv(cf, s.discountRate / 100);
    return { ...p, ...e, aCount, passes, lifetimeEru, pv };
  }), [s.projects, s.priceScenarios, s.discountRate]);

  const totalAnnualEru = projects.reduce((a, p) => a + (p.passes ? p.eru : 0), 0);
  const totalLifetimeEru = projects.reduce((a, p) => a + (p.passes ? p.lifetimeEru : 0), 0);
  const totalNpv = projects.reduce((a, p) => a + (p.passes ? p.pv : 0), 0);
  const passedCount = projects.filter(p => p.passes).length;

  const upd = (i, k, v) => sc.update(st => ({ projects: st.projects.map((p, j) => j === i ? { ...p, [k]: v } : p) }));
  const updAddl = (i, k, v) => sc.update(st => ({ projects: st.projects.map((p, j) => j === i ? { ...p, additionality: { ...p.additionality, [k]: v } } : p) }));
  const addProj = () => sc.update(st => ({ projects: [...st.projects, { id: `NEW-${st.projects.length+1}`, name: 'New project', method: 'M-001 Grid RE', mw: 100, annualOutputMwh: 200000, projectEf: 0.05, startYr: 2026, vintageYrs: 7, ccc: 'Mid', additionality: { invest: false, tech: false, common: false, regBarrier: false } }] }));
  const delProj = (i) => sc.update(st => ({ projects: st.projects.filter((_, j) => j !== i) }));

  const exportCsv = () => downloadText(`EB2_CCTS_${sc.scenarioName}.csv`, toCsv(projects.map(p => ({
    id: p.id, name: p.name, method: p.method, mw: p.mw, annual_mwh: p.annualOutputMwh, baseline_ef: METHODS[p.method]?.baseline,
    project_ef: p.projectEf, annual_eru_tco2: +p.eru.toFixed(0), lifetime_eru: +p.lifetimeEru.toFixed(0),
    additionality_prongs: p.aCount, passes: p.passes ? 'Yes' : 'No', ccc_tier: p.ccc, npv_inr: +p.pv.toFixed(0),
  }))), 'text/csv');
  const exportJson = () => downloadText(`EB2_${sc.scenarioName}.json`, JSON.stringify({ module: 'EB2', scenario: sc.scenarioName, state: s, projects }, null, 2), 'application/json');

  const generateDossier = () => {
    const rows = projects.map(p => [p.id, p.name, p.method, (p.eru/1000).toFixed(1) + ' kt/yr', p.aCount + '/4', p.passes ? 'PASS' : 'FAIL', p.ccc, '₹' + (p.pv/1e7).toFixed(2) + ' Cr']);
    const content = [
      html.h1('CCTS Offset Registration Dossier'),
      html.meta({ Portfolio: s.portfolioName, Issuer: 'Bureau of Energy Efficiency', Scheme: 'Carbon Credit Trading Scheme (India)', Scenario: sc.scenarioName }),
      html.h2('Executive Summary'),
      html.kpi('Projects in scope', projects.length) + html.kpi('Additionality-passing', passedCount) + html.kpi('Annual ERUs', (totalAnnualEru/1000).toFixed(1) + ' kt') + html.kpi('Lifetime ERUs', (totalLifetimeEru/1e6).toFixed(2) + ' Mt') + html.kpi('Portfolio NPV', '₹' + (totalNpv/1e7).toFixed(1) + ' Cr'),
      html.h2('1. Project Portfolio'),
      html.table(['ID', 'Project', 'Methodology', 'Annual ERU', 'Additionality', 'Status', 'CCC Tier', 'NPV'], rows),
      html.h2('2. Methodology Mapping (BEE-approved)'),
      html.p('All projects mapped to published BEE methodologies. Baseline emission factors: India CEA weighted-avg grid EF 0.71 tCO₂/MWh; Green H₂ baseline via SMR proxy 10.5 tCO₂/tH₂; Green NH₃ via grey-NH₃ proxy 2.8 tCO₂/t.'),
      html.h2('3. Additionality Assessment — 4-Prong Test'),
      html.p('Methodology: UNFCCC CDM Tool 01 adapted to CCTS. Projects passing ≥3 of 4 prongs (Investment barrier, Technology barrier, Common practice, Regulatory barrier) qualify for registration. Captive-like projects with weak additionality are flagged for deep-dive review before submission.'),
      html.table(['ID', 'Investment', 'Technology', 'Common practice', 'Regulatory', 'Pass'],
        projects.map(p => [p.id, p.additionality.invest ? '✓' : '✗', p.additionality.tech ? '✓' : '✗', p.additionality.common ? '✓' : '✗', p.additionality.regBarrier ? '✓' : '✗', p.passes ? 'PASS' : 'FAIL'])),
      html.h2('4. Price Scenarios & NPV'),
      html.table(['Tier', '₹/ERU'], [['Low', s.priceScenarios.low], ['Mid', s.priceScenarios.mid], ['High', s.priceScenarios.high]]),
      html.p(`Discount rate: ${s.discountRate}% (nominal). NPV computed over project crediting period per BEE methodology defaults (7y RE, 10y H₂/NH₃, 20y AFOLU).`),
      html.h2('5. Registration Cycle & Timeline'),
      html.p('Stage 1 — Project Concept Note (BEE) · Stage 2 — Project Design Document per methodology template · Stage 3 — Third-party validation (DOE-accredited VVB) · Stage 4 — Registration at Indian Carbon Market registry · Stage 5 — Monitoring per PoA · Stage 6 — Verification + CCC issuance · Stage 7 — Auction / bilateral sale.'),
      html.h2('6. Recommendation'),
      html.p(`${passedCount}/${projects.length} projects cleared additionality. Prioritise high-integrity CCC Tier projects (H₂/NH₃/FDRE) for registration — estimated portfolio NPV ₹${(totalNpv/1e7).toFixed(1)} Cr over crediting periods. Captive/weak-additionality projects should be re-scoped or withdrawn.`),
    ].join('');
    openDeliverable(content, `CCTS Registration Dossier — ${sc.scenarioName}`);
  };

  // Project NPV curve across CCC tiers
  const curveData = [s.priceScenarios.low, s.priceScenarios.mid, s.priceScenarios.high].map((price, idx) => ({
    tier: ['Low', 'Mid', 'High'][idx],
    price,
    npv: projects.filter(p => p.passes).reduce((a, p) => a + npv(new Array(p.vintageYrs).fill(p.eru * price), s.discountRate / 100), 0) / 1e7,
  }));

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: T.font, color: T.text, padding: '28px 40px' }}>
      <PageHeader code="EP-EB2" title="CCTS Offset Registration & Trading" subtitle={`${s.portfolioName} · Bureau of Energy Efficiency · 8 BEE-approved methodologies · 4-prong additionality`} />
      <ToolkitBar moduleCode="EB2" scenario={sc} onExportCsv={exportCsv} onExportJson={exportJson} onDeliverable={generateDossier}
        importLabel="Import Project CSV"
        onImportCsv={(rows) => { if (rows.length) sc.update({ projects: rows.map(r => ({
          id: r.id, name: r.name, method: r.method || 'M-001 Grid RE', mw: Number(r.mw) || 0, annualOutputMwh: Number(r.annualOutputMwh) || 0,
          projectEf: Number(r.projectEf) || 0, startYr: Number(r.startYr) || 2026, vintageYrs: Number(r.vintageYrs) || 7, ccc: r.ccc || 'Mid',
          additionality: { invest: String(r.invest).toLowerCase() === 'true', tech: String(r.tech).toLowerCase() === 'true', common: String(r.common).toLowerCase() === 'true', regBarrier: String(r.regBarrier).toLowerCase() === 'true' },
        })) }); }} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 18 }}>
        <Kpi label="Projects" value={projects.length} sub={`${passedCount} additionality pass`} />
        <Kpi label="Annual ERUs" value={`${(totalAnnualEru/1000).toFixed(1)} kt`} sub="Passing projects only" />
        <Kpi label="Lifetime ERUs" value={`${(totalLifetimeEru/1e6).toFixed(2)} Mt`} sub="Over crediting periods" />
        <Kpi label="Portfolio NPV" value={`₹${(totalNpv/1e7).toFixed(1)} Cr`} sub={`Disc ${s.discountRate}%`} color={T.gold} />
        <Kpi label="Pass rate" value={`${projects.length ? (passedCount/projects.length*100).toFixed(0) : 0}%`} sub="3+/4 prongs required" />
      </div>

      <TabBar tabs={TABS} tab={tab} setTab={setTab} />

      {tab === 0 && (
        <Panel title="Portfolio-level assumptions" right={<button style={addBtn} onClick={addProj}>+ Add project</button>}>
          <div style={{ display: 'flex', gap: 30, marginBottom: 14, flexWrap: 'wrap', fontSize: 12 }}>
            <L label="Portfolio name"><TextInput value={s.portfolioName} onChange={v => sc.update({ portfolioName: v })} style={{ width: 220 }} /></L>
            <L label="Discount rate"><NumInput value={s.discountRate} onChange={v => sc.update({ discountRate: v })} step={0.5} suffix="%" /></L>
            <L label="Low price"><NumInput value={s.priceScenarios.low} onChange={v => sc.update({ priceScenarios: { ...s.priceScenarios, low: v } })} suffix="₹/ERU" /></L>
            <L label="Mid price"><NumInput value={s.priceScenarios.mid} onChange={v => sc.update({ priceScenarios: { ...s.priceScenarios, mid: v } })} suffix="₹/ERU" /></L>
            <L label="High price"><NumInput value={s.priceScenarios.high} onChange={v => sc.update({ priceScenarios: { ...s.priceScenarios, high: v } })} suffix="₹/ERU" /></L>
          </div>
          <Table cols={['ID', 'Name', 'Methodology', 'MW', 'Annual MWh', 'Project EF', 'Vintage yrs', 'CCC tier', '']}>
            {projects.map((p, i) => (
              <tr key={i}>
                <td style={{ ...td, fontFamily: T.mono, fontSize: 11 }}>{p.id}</td>
                <td style={td}><TextInput value={p.name} onChange={v => upd(i, 'name', v)} /></td>
                <td style={td}><select value={p.method} onChange={e => upd(i, 'method', e.target.value)} style={selS}>{Object.keys(METHODS).map(k => <option key={k}>{k}</option>)}</select></td>
                <td style={td}><NumInput value={p.mw} onChange={v => upd(i, 'mw', v)} style={{ width: 70 }} /></td>
                <td style={td}><NumInput value={p.annualOutputMwh} onChange={v => upd(i, 'annualOutputMwh', v)} step={1000} style={{ width: 90 }} /></td>
                <td style={td}><NumInput value={p.projectEf} onChange={v => upd(i, 'projectEf', v)} step={0.01} style={{ width: 60 }} /></td>
                <td style={td}><NumInput value={p.vintageYrs} onChange={v => upd(i, 'vintageYrs', v)} style={{ width: 50 }} /></td>
                <td style={td}><select value={p.ccc} onChange={e => upd(i, 'ccc', e.target.value)} style={selS}><option>Low</option><option>Mid</option><option>High</option></select></td>
                <td style={td}><button onClick={() => delProj(i)} style={delBtn}>✕</button></td>
              </tr>
            ))}
          </Table>
        </Panel>
      )}

      {tab === 1 && (
        <Panel title="ERU calculations (baseline − project)">
          <Table cols={['ID', 'Method', 'Baseline EF', 'Baseline tCO₂/yr', 'Project tCO₂/yr', 'Annual ERU', 'Lifetime ERU', 'Pass']}>
            {projects.map((p, i) => (
              <tr key={i}>
                <td style={{ ...td, fontFamily: T.mono, fontSize: 11 }}>{p.id}</td>
                <td style={{ ...td, fontSize: 12 }}>{p.method}</td>
                <td style={{ ...td, fontFamily: T.mono }}>{METHODS[p.method]?.baseline}</td>
                <td style={{ ...td, fontFamily: T.mono }}>{p.baseline.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                <td style={{ ...td, fontFamily: T.mono }}>{p.project.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                <td style={{ ...td, fontFamily: T.mono, color: T.gold }}>{p.eru.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                <td style={{ ...td, fontFamily: T.mono, color: T.gold }}>{p.lifetimeEru.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                <td style={td}>{p.passes ? <Badge level="good">Pass</Badge> : <Badge level="bad">Fail</Badge>}</td>
              </tr>
            ))}
          </Table>
        </Panel>
      )}

      {tab === 2 && (
        <Panel title="4-prong additionality test (toggle per project)">
          <Table cols={['ID', 'Project', 'Investment barrier', 'Technology barrier', 'Common practice', 'Regulatory barrier', 'Prongs', 'Result']}>
            {projects.map((p, i) => (
              <tr key={i}>
                <td style={{ ...td, fontFamily: T.mono }}>{p.id}</td>
                <td style={td}>{p.name}</td>
                {['invest', 'tech', 'common', 'regBarrier'].map(k => (
                  <td key={k} style={{ ...td, textAlign: 'center' }}>
                    <input type="checkbox" checked={p.additionality[k]} onChange={e => updAddl(i, k, e.target.checked)} />
                  </td>
                ))}
                <td style={{ ...td, fontFamily: T.mono }}>{p.aCount}/4</td>
                <td style={td}>{p.passes ? <Badge level="good">Pass</Badge> : <Badge level="bad">Fail</Badge>}</td>
              </tr>
            ))}
          </Table>
          <div style={{ marginTop: 14, padding: 12, background: T.surfaceH, borderRadius: 3, fontSize: 12, color: T.textSec }}>
            <b style={{ color: T.gold }}>Rule:</b> Projects passing ≥3 of 4 prongs qualify. Captive solar assets typically fail "common practice" and "investment barrier" — they would not qualify for CCTS registration but may still be eligible for RECs or I-RECs.
          </div>
        </Panel>
      )}

      {tab === 3 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Panel title="Portfolio NPV vs CCC price tier">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={curveData}>
                <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
                <XAxis dataKey="price" tick={{ fill: T.textSec, fontSize: 11 }} label={{ value: '₹/ERU', position: 'insideBottom', offset: -5, fill: T.textSec, fontSize: 11 }} />
                <YAxis tick={{ fill: T.textSec, fontSize: 11 }} label={{ value: 'NPV ₹Cr', angle: -90, position: 'insideLeft', fill: T.textSec, fontSize: 11 }} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}` }} />
                <Line dataKey="npv" stroke={T.gold} strokeWidth={2} dot={{ fill: T.gold, r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </Panel>
          <Panel title="Per-project NPV (mid scenario)">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={projects.filter(p => p.passes).map(p => ({ id: p.id, npv: +(p.pv / 1e7).toFixed(2) }))}>
                <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
                <XAxis dataKey="id" tick={{ fill: T.textSec, fontSize: 11 }} />
                <YAxis tick={{ fill: T.textSec, fontSize: 11 }} label={{ value: '₹ Cr', angle: -90, position: 'insideLeft', fill: T.textSec, fontSize: 11 }} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}` }} />
                <Bar dataKey="npv" fill={T.gold} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        </div>
      )}

      {tab === 4 && (
        <Panel title="CCTS registration cycle (BEE/ICM)">
          <Table cols={['Stage', 'Activity', 'Duration', 'Artefact']}>
            {[
              ['1', 'Project Concept Note → BEE scoping', '2–3 wks', 'PCN letter'],
              ['2', 'Project Design Document (methodology-specific)', '6–8 wks', 'PDD (this tool)'],
              ['3', 'Validation by DOE-accredited VVB', '8–10 wks', 'Validation report'],
              ['4', 'Registration at Indian Carbon Market registry', '4 wks', 'Registered PoA'],
              ['5', 'Monitoring per MRV plan (continuous)', 'Ongoing', 'MR reports'],
              ['6', 'Verification + CCC issuance', '4–6 wks / cycle', 'CCC certificates'],
              ['7', 'Auction (ICEX/IEX) or bilateral OTC', 'As market', 'Settlement statement'],
            ].map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} style={j===0 ? { ...td, fontFamily: T.mono, color: T.gold } : td}>{c}</td>)}</tr>)}
          </Table>
        </Panel>
      )}

      {tab === 5 && (
        <Panel title="Client deliverable stack">
          <ul style={{ lineHeight: 1.9, fontSize: 13, color: T.textSec }}>
            <li><b style={{ color: T.text }}>Project portfolio CSV</b> — ERU projections and additionality flags for BEE submission. <button style={btnInline} onClick={exportCsv}>Download</button></li>
            <li><b style={{ color: T.text }}>Scenario state JSON</b> — reproducible inputs for regulator / internal review. <button style={btnInline} onClick={exportJson}>Download</button></li>
            <li><b style={{ color: T.text }}>CCTS Registration Dossier (HTML/PDF)</b> — full 6-section document ready for VVB engagement. <button style={{ ...btnInline, background: T.gold, color: T.navy, borderColor: T.gold }} onClick={generateDossier}>Generate</button></li>
          </ul>
        </Panel>
      )}
    </div>
  );
}

function L({ label, children }) { return <label style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 12, color: T.textSec }}><span style={{ minWidth: 120 }}>{label}</span>{children}</label>; }
const selS = { background: T.surface, color: T.text, border: `1px solid ${T.border}`, padding: '4px 6px', fontSize: 12, borderRadius: 2 };
const addBtn = { background: T.teal, color: T.text, border: 'none', padding: '4px 12px', fontSize: 11, cursor: 'pointer', borderRadius: 3 };
const delBtn = { background: 'transparent', color: T.red, border: 'none', cursor: 'pointer', fontSize: 14 };
const btnInline = { background: T.surface, color: T.gold, border: `1px solid ${T.gold}`, padding: '3px 10px', fontSize: 11, cursor: 'pointer', borderRadius: 3, marginLeft: 8 };
