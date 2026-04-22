import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend } from 'recharts';
import { T, useScenario, ToolkitBar, NumInput, TextInput, Kpi, Panel, Table, td, TabBar, PageHeader, Badge, downloadText, toCsv, openDeliverable, html } from '../../_shared/AdvisoryToolkit';

const DEFAULTS = {
  portfolioName: 'Integrated RE-IPP Client (anonymised)',
  leapProgress: { locate: 92, evaluate: 78, assess: 64, prepare: 48 },
  pillarMaturity: { governance: 62, strategy: 55, risk: 48, metrics: 41 },
  assets: [
    { id: 'OMN-NH3', name: 'Green NH₃ (Oman)', biome: 'Hyper-arid desert', areaKm2: 92, kbaProximityKm: 12, iucnSpecies: 2, depScore: 4.6, impScore: 4.2, priority: 'Critical', dnshRisk: true },
    { id: 'ODI-FDR', name: 'Odisha FDRE', biome: 'Tropical forest edge', areaKm2: 48, kbaProximityKm: 5, iucnSpecies: 2, depScore: 3.8, impScore: 3.6, priority: 'High', dnshRisk: false },
    { id: 'RAJ-SOL', name: 'Rajasthan Solar', biome: 'Thar semi-arid', areaKm2: 74, kbaProximityKm: 0, iucnSpecies: 2, depScore: 3.1, impScore: 4.5, priority: 'Critical', dnshRisk: true },
    { id: 'GUJ-WND', name: 'Gujarat Wind (Kutch)', biome: 'Saline coastal', areaKm2: 31, kbaProximityKm: 0, iucnSpecies: 2, depScore: 2.4, impScore: 3.9, priority: 'High', dnshRisk: false },
    { id: 'JPR-MFG', name: 'Jaipur Module Mfg', biome: 'Urban industrial', areaKm2: 1.2, kbaProximityKm: 25, iucnSpecies: 0, depScore: 3.6, impScore: 2.8, priority: 'Medium', dnshRisk: false },
    { id: 'TN-WND', name: 'Tamil Nadu Wind', biome: 'Western Ghats foothill', areaKm2: 18, kbaProximityKm: 8, iucnSpecies: 1, depScore: 2.9, impScore: 3.2, priority: 'High', dnshRisk: false },
    { id: 'AP-SOL', name: 'AP Solar', biome: 'Dry deciduous', areaKm2: 22, kbaProximityKm: 18, iucnSpecies: 1, depScore: 2.6, impScore: 2.9, priority: 'Medium', dnshRisk: false },
    { id: 'MP-SOL', name: 'MP Solar', biome: 'Central Indian dry', areaKm2: 26, kbaProximityKm: 10, iucnSpecies: 2, depScore: 2.8, impScore: 3.1, priority: 'High', dnshRisk: false },
  ],
  ecoServices: [
    { svc: 'Freshwater provisioning', dependency: 4.6, revenueAtRiskCr: 18 },
    { svc: 'Climate regulation (local)', dependency: 3.8, revenueAtRiskCr: 12 },
    { svc: 'Soil stability', dependency: 3.6, revenueAtRiskCr: 9 },
    { svc: 'Air quality / dust suppression', dependency: 3.2, revenueAtRiskCr: 8 },
    { svc: 'Flood regulation', dependency: 2.8, revenueAtRiskCr: 6 },
    { svc: 'Pollination', dependency: 2.1, revenueAtRiskCr: 3 },
  ],
  opportunities: [
    { opp: 'Agrivoltaic co-benefit (RAJ/MP/AP)', npvCr: 142, status: 'Scoping' },
    { opp: 'Thar grassland restoration credit', npvCr: 38, status: 'MoU drafted' },
    { opp: 'Mangrove offset Gujarat coastal', npvCr: 24, status: 'Pre-feasibility' },
    { opp: 'Odisha Similipal PES', npvCr: 17, status: 'Conceptual' },
    { opp: 'Oman acacia afforestation A6.4', npvCr: 56, status: 'Engaged consultant' },
  ],
};

function priorityScore(a) { return a.depScore * 0.4 + a.impScore * 0.4 + (a.kbaProximityKm < 10 ? 0.8 : 0.2) + (a.iucnSpecies * 0.15); }
const TABS = ['Inputs & Assets', 'LEAP & Pillars', 'Ecosystem Services', 'Opportunities (NPV)', 'DNSH Flags', 'Deliverables'];

export default function TnfdBiodiversityBaselinePage() {
  const sc = useScenario('eb6_tnfd', DEFAULTS);
  const [tab, setTab] = useState(0);
  const s = sc.state;

  const assets = useMemo(() => s.assets.map(a => ({ ...a, priorityScore: priorityScore(a) })), [s.assets]);
  const critical = assets.filter(a => a.priority === 'Critical').length;
  const dnshAtRisk = assets.filter(a => a.dnshRisk).length;
  const avgDep = (assets.reduce((x, a) => x + a.depScore, 0) / Math.max(1, assets.length)).toFixed(2);
  const avgImp = (assets.reduce((x, a) => x + a.impScore, 0) / Math.max(1, assets.length)).toFixed(2);
  const totalArea = assets.reduce((x, a) => x + a.areaKm2, 0);
  const oppNpv = s.opportunities.reduce((x, o) => x + o.npvCr, 0);
  const ecoRaR = s.ecoServices.reduce((x, e) => x + e.revenueAtRiskCr, 0);
  const leapAvg = Object.values(s.leapProgress).reduce((a, b) => a + b, 0) / 4;
  const pillarAvg = Object.values(s.pillarMaturity).reduce((a, b) => a + b, 0) / 4;

  const upd = (i, k, v) => sc.update(st => ({ assets: st.assets.map((a, j) => j === i ? { ...a, [k]: v } : a) }));
  const addA = () => sc.update(st => ({ assets: [...st.assets, { id: `NEW-${st.assets.length+1}`, name: 'New', biome: '', areaKm2: 0, kbaProximityKm: 99, iucnSpecies: 0, depScore: 2, impScore: 2, priority: 'Medium', dnshRisk: false }] }));
  const delA = (i) => sc.update(st => ({ assets: st.assets.filter((_, j) => j !== i) }));

  const exportCsv = () => downloadText(`EB6_TNFD_${sc.scenarioName}.csv`, toCsv(assets.map(a => ({
    id: a.id, name: a.name, biome: a.biome, area_km2: a.areaKm2, kba_km: a.kbaProximityKm, iucn_species: a.iucnSpecies,
    dep_score: a.depScore, imp_score: a.impScore, priority_score: +a.priorityScore.toFixed(2), priority: a.priority, dnsh_at_risk: a.dnshRisk ? 'Yes' : 'No',
  }))), 'text/csv');
  const exportJson = () => downloadText(`EB6_${sc.scenarioName}.json`, JSON.stringify({ module: 'EB6', state: s, assets }, null, 2), 'application/json');

  const generateDisclosure = () => {
    const content = [
      html.h1('TNFD Biodiversity Baseline & Disclosure Pack'),
      html.meta({ Portfolio: s.portfolioName, Standard: 'TNFD v2.0 (Sep 2025) · LEAP · SBTN v1.0', Scenario: sc.scenarioName }),
      html.h2('Executive Summary'),
      html.kpi('Assets assessed', assets.length) + html.kpi('Critical priority', critical) + html.kpi('DNSH at-risk', dnshAtRisk) + html.kpi('Area km²', totalArea.toFixed(0)) + html.kpi('Opp NPV', `₹${oppNpv.toFixed(0)} Cr`) + html.kpi('Eco-svc RaR', `₹${ecoRaR.toFixed(0)} Cr/yr`),
      html.h2('1. LEAP Phase Progress'),
      html.table(['Phase', '% Complete'], [['L — Locate', s.leapProgress.locate + '%'], ['E — Evaluate', s.leapProgress.evaluate + '%'], ['A — Assess', s.leapProgress.assess + '%'], ['P — Prepare', s.leapProgress.prepare + '%']]),
      html.h2('2. TNFD 4-Pillar Maturity'),
      html.table(['Pillar', 'Maturity %'], [['Governance', s.pillarMaturity.governance + '%'], ['Strategy', s.pillarMaturity.strategy + '%'], ['Risk & Impact Mgmt', s.pillarMaturity.risk + '%'], ['Metrics & Targets', s.pillarMaturity.metrics + '%']]),
      html.h2('3. Priority Assets (sensitive locations)'),
      html.table(['ID', 'Name', 'Biome', 'Area km²', 'KBA km', 'IUCN spp', 'Dep', 'Imp', 'Priority', 'DNSH'],
        assets.map(a => [a.id, a.name, a.biome, a.areaKm2, a.kbaProximityKm === 0 ? 'Overlap' : a.kbaProximityKm + 'km', a.iucnSpecies, a.depScore, a.impScore, a.priority, a.dnshRisk ? 'At Risk' : 'Aligned'])),
      html.h2('4. Ecosystem Service Dependencies (ENCORE v2)'),
      html.table(['Service', 'Dependency 1–5', 'Rev at risk ₹Cr/yr'], s.ecoServices.map(e => [e.svc, e.dependency, e.revenueAtRiskCr])),
      html.h2('5. Nature-Positive Opportunities'),
      html.table(['Opportunity', 'NPV ₹Cr', 'Status'], s.opportunities.map(o => [o.opp, o.npvCr, o.status])),
      html.h2('6. DNSH to Biodiversity (EU Taxonomy)'),
      html.p(`${dnshAtRisk} of ${assets.length} assets flagged At-Risk on biodiversity DNSH. Mitigation hierarchy (Avoid → Minimise → Restore → Offset) required for Rajasthan GIB corridor and Oman NH₃ KBA proximity. ~₹1,820 Cr of green-bond issuance tied to these assets pending remediation.`),
      html.h2('7. SBTN v1.0 Progression'),
      html.p('Step 1 (Assess) complete. Step 2 (Interpret & Prioritise) in progress. Steps 3–5 (Measure, Act, Track) scheduled FY27. Targets will cover freshwater withdrawal intensity, land-footprint/MW, and no-deforestation supply chain.'),
      html.h2('8. Recommendation'),
      html.p(`Priority 1: mitigation hierarchy execution at ${critical} Critical assets. Priority 2: launch ₹${oppNpv.toFixed(0)} Cr nature-positive opportunity portfolio — agrivoltaics and grassland restoration deliver highest risk-adjusted NPV. Priority 3: SBTN target-setting by Q4 to unlock SLB KPI credibility and CSDDD readiness.`),
    ].join('');
    openDeliverable(content, `TNFD Disclosure Pack — ${s.portfolioName}`);
  };

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: T.font, color: T.text, padding: '28px 40px' }}>
      <PageHeader code="EP-EB6" title="TNFD Biodiversity Baseline & LEAP" subtitle={`${s.portfolioName} · TNFD v2.0 · LEAP · SBTN v1.0 · ${assets.length} priority assets · ${totalArea.toFixed(0)} km²`} />
      <ToolkitBar moduleCode="EB6" scenario={sc} onExportCsv={exportCsv} onExportJson={exportJson} onDeliverable={generateDisclosure}
        importLabel="Import Assets CSV"
        onImportCsv={(rows) => { if (rows.length) sc.update({ assets: rows.map(r => ({
          id: r.id, name: r.name, biome: r.biome || '', areaKm2: Number(r.area_km2 || r.areaKm2) || 0, kbaProximityKm: Number(r.kba_km || r.kbaProximityKm) || 99, iucnSpecies: Number(r.iucn_species || r.iucnSpecies) || 0,
          depScore: Number(r.dep_score || r.depScore) || 0, impScore: Number(r.imp_score || r.impScore) || 0, priority: r.priority || 'Medium', dnshRisk: String(r.dnsh_at_risk || r.dnshRisk).toLowerCase() === 'yes' || String(r.dnsh_at_risk).toLowerCase() === 'true',
        })) }); }} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 18 }}>
        <Kpi label="Priority assets" value={assets.length} sub={`${critical} Critical · ${totalArea.toFixed(0)} km²`} />
        <Kpi label="LEAP progress (avg)" value={`${leapAvg.toFixed(0)}%`} sub="Across 4 phases" color={leapAvg > 70 ? T.green : T.amber} />
        <Kpi label="Pillar maturity (avg)" value={`${pillarAvg.toFixed(0)}%`} sub="TNFD 4 pillars" color={pillarAvg > 55 ? T.green : T.amber} />
        <Kpi label="DNSH at-risk" value={dnshAtRisk} sub="EU Taxonomy biodiversity" color={dnshAtRisk > 0 ? T.red : T.green} />
        <Kpi label="Opp NPV" value={`₹${oppNpv} Cr`} sub={`${s.opportunities.length} opportunities`} color={T.gold} />
      </div>

      <TabBar tabs={TABS} tab={tab} setTab={setTab} />

      {tab === 0 && (
        <Panel title={`Asset-level biodiversity register (${assets.length}) — depscore/impscore 1–5`} right={<button style={addBtn} onClick={addA}>+ Add</button>}>
          <div style={{ display: 'flex', gap: 20, marginBottom: 14, flexWrap: 'wrap' }}>
            <L label="Portfolio"><TextInput value={s.portfolioName} onChange={v => sc.update({ portfolioName: v })} style={{ width: 220 }} /></L>
            <span style={{ fontSize: 11, color: T.textMut, alignSelf: 'center' }}>Mean dep {avgDep} · mean imp {avgImp}</span>
          </div>
          <Table cols={['ID', 'Name', 'Biome', 'Area km²', 'KBA km', 'IUCN spp', 'Dep', 'Imp', 'Priority score', 'Priority', 'DNSH risk', '']}>
            {assets.map((a, i) => (
              <tr key={i}>
                <td style={{ ...td, fontFamily: T.mono, fontSize: 11 }}>{a.id}</td>
                <td style={td}><TextInput value={a.name} onChange={v => upd(i, 'name', v)} style={{ width: 160 }} /></td>
                <td style={td}><TextInput value={a.biome} onChange={v => upd(i, 'biome', v)} style={{ width: 160 }} /></td>
                <td style={td}><NumInput value={a.areaKm2} onChange={v => upd(i, 'areaKm2', v)} step={0.5} style={{ width: 60 }} /></td>
                <td style={td}><NumInput value={a.kbaProximityKm} onChange={v => upd(i, 'kbaProximityKm', v)} style={{ width: 50 }} /></td>
                <td style={td}><NumInput value={a.iucnSpecies} onChange={v => upd(i, 'iucnSpecies', v)} style={{ width: 45 }} /></td>
                <td style={td}><NumInput value={a.depScore} onChange={v => upd(i, 'depScore', v)} min={0} max={5} step={0.1} style={{ width: 50 }} /></td>
                <td style={td}><NumInput value={a.impScore} onChange={v => upd(i, 'impScore', v)} min={0} max={5} step={0.1} style={{ width: 50 }} /></td>
                <td style={{ ...td, fontFamily: T.mono, color: T.gold }}>{a.priorityScore.toFixed(2)}</td>
                <td style={td}>
                  <select value={a.priority} onChange={e => upd(i, 'priority', e.target.value)} style={selS}>
                    <option>Critical</option><option>High</option><option>Medium</option><option>Low</option>
                  </select>
                </td>
                <td style={{ ...td, textAlign: 'center' }}><input type="checkbox" checked={a.dnshRisk} onChange={e => upd(i, 'dnshRisk', e.target.checked)} /></td>
                <td style={td}><button onClick={() => delA(i)} style={delBtn}>✕</button></td>
              </tr>
            ))}
          </Table>
        </Panel>
      )}

      {tab === 1 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Panel title="LEAP phase completion">
            {Object.entries(s.leapProgress).map(([k, v]) => (
              <div key={k} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <b style={{ color: T.gold, textTransform: 'capitalize' }}>{k}</b>
                  <NumInput value={v} onChange={nv => sc.update({ leapProgress: { ...s.leapProgress, [k]: nv } })} min={0} max={100} suffix="%" />
                </div>
                <div style={{ background: T.border, height: 8, borderRadius: 4 }}>
                  <div style={{ background: v >= 70 ? T.green : v >= 50 ? T.amber : T.red, height: '100%', width: `${v}%`, borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </Panel>
          <Panel title="TNFD pillar maturity">
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={Object.entries(s.pillarMaturity).map(([k, v]) => ({ pillar: k, maturity: v, target: 85 }))}>
                <PolarGrid stroke={T.border} />
                <PolarAngleAxis dataKey="pillar" tick={{ fill: T.text, fontSize: 11 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fill: T.textMut, fontSize: 10 }} />
                <Radar name="Current" dataKey="maturity" stroke={T.gold} fill={T.gold} fillOpacity={0.4} />
                <Radar name="Target" dataKey="target" stroke={T.sage} fill={T.sage} fillOpacity={0.15} />
                <Legend wrapperStyle={{ fontSize: 11, color: T.textSec }} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}` }} />
              </RadarChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {Object.entries(s.pillarMaturity).map(([k, v]) => (
                <label key={k} style={{ fontSize: 11, color: T.textSec }}>{k} <NumInput value={v} onChange={nv => sc.update({ pillarMaturity: { ...s.pillarMaturity, [k]: nv } })} min={0} max={100} style={{ width: 55 }} /></label>
              ))}
            </div>
          </Panel>
        </div>
      )}

      {tab === 2 && (
        <Panel title="Ecosystem service dependency & revenue at risk">
          <Table cols={['Service', 'Dependency 1–5', 'Rev at risk ₹Cr/yr', '']}>
            {s.ecoServices.map((e, i) => (
              <tr key={i}>
                <td style={td}>{e.svc}</td>
                <td style={td}><NumInput value={e.dependency} onChange={v => sc.update(st => ({ ecoServices: st.ecoServices.map((x, j) => j === i ? { ...x, dependency: v } : x) }))} min={0} max={5} step={0.1} /></td>
                <td style={td}><NumInput value={e.revenueAtRiskCr} onChange={v => sc.update(st => ({ ecoServices: st.ecoServices.map((x, j) => j === i ? { ...x, revenueAtRiskCr: v } : x) }))} step={1} /></td>
                <td style={td}><button style={delBtn} onClick={() => sc.update(st => ({ ecoServices: st.ecoServices.filter((_, j) => j !== i) }))}>✕</button></td>
              </tr>
            ))}
          </Table>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={s.ecoServices}>
              <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
              <XAxis dataKey="svc" tick={{ fill: T.textSec, fontSize: 10 }} angle={-20} textAnchor="end" height={80} interval={0} />
              <YAxis tick={{ fill: T.textSec, fontSize: 11 }} />
              <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}` }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="dependency" fill={T.gold} name="Dependency" />
              <Bar dataKey="revenueAtRiskCr" fill={T.teal} name="₹Cr/yr RaR" />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      )}

      {tab === 3 && (
        <Panel title={`Nature-positive opportunities — cumulative NPV ₹${oppNpv} Cr`}>
          <Table cols={['Opportunity', 'NPV ₹Cr', 'Status', '']}>
            {s.opportunities.map((o, i) => (
              <tr key={i}>
                <td style={td}><TextInput value={o.opp} onChange={v => sc.update(st => ({ opportunities: st.opportunities.map((x, j) => j === i ? { ...x, opp: v } : x) }))} style={{ width: 300 }} /></td>
                <td style={td}><NumInput value={o.npvCr} onChange={v => sc.update(st => ({ opportunities: st.opportunities.map((x, j) => j === i ? { ...x, npvCr: v } : x) }))} /></td>
                <td style={td}><TextInput value={o.status} onChange={v => sc.update(st => ({ opportunities: st.opportunities.map((x, j) => j === i ? { ...x, status: v } : x) }))} /></td>
                <td style={td}><button style={delBtn} onClick={() => sc.update(st => ({ opportunities: st.opportunities.filter((_, j) => j !== i) }))}>✕</button></td>
              </tr>
            ))}
          </Table>
          <button style={{ ...addBtn, marginTop: 10 }} onClick={() => sc.update(st => ({ opportunities: [...st.opportunities, { opp: 'New opportunity', npvCr: 0, status: 'Scoping' }] }))}>+ Add opportunity</button>
        </Panel>
      )}

      {tab === 4 && (
        <Panel title="EU Taxonomy DNSH — biodiversity environmental objective">
          <Table cols={['Asset', 'KBA proximity', 'IUCN species', 'DNSH flag']}>
            {assets.map((a, i) => (
              <tr key={i}>
                <td style={td}><b>{a.name}</b></td>
                <td style={{ ...td, fontFamily: T.mono, color: a.kbaProximityKm < 5 ? T.red : a.kbaProximityKm < 15 ? T.amber : T.green }}>{a.kbaProximityKm === 0 ? 'Overlap' : a.kbaProximityKm + ' km'}</td>
                <td style={{ ...td, fontFamily: T.mono }}>{a.iucnSpecies}</td>
                <td style={td}>{a.dnshRisk ? <Badge level="bad">At Risk</Badge> : <Badge level="good">Aligned</Badge>}</td>
              </tr>
            ))}
          </Table>
          <div style={{ marginTop: 14, padding: 12, background: T.surfaceH, borderRadius: 3, fontSize: 12, color: T.textSec }}>
            <b style={{ color: T.gold }}>Mitigation hierarchy:</b> Avoid → Minimise → Restore → Offset. Assets flagged At Risk cannot qualify for EU-Taxonomy-aligned green bond proceeds until DNSH remediation is verified. ~₹1,820 Cr of planned issuance is contingent on this pathway.
          </div>
        </Panel>
      )}

      {tab === 5 && (
        <Panel title="Client deliverable stack">
          <ul style={{ lineHeight: 1.9, fontSize: 13, color: T.textSec }}>
            <li><b style={{ color: T.text }}>Asset register CSV</b> — for ERM / audit. <button style={btnInline} onClick={exportCsv}>Download</button></li>
            <li><b style={{ color: T.text }}>Scenario state JSON</b>. <button style={btnInline} onClick={exportJson}>Download</button></li>
            <li><b style={{ color: T.text }}>TNFD Disclosure Pack (HTML/PDF)</b> — LEAP + SBTN + DNSH + opportunity portfolio. <button style={{ ...btnInline, background: T.gold, color: T.navy, borderColor: T.gold }} onClick={generateDisclosure}>Generate</button></li>
          </ul>
        </Panel>
      )}
    </div>
  );
}

function L({ label, children }) { return <label style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 12, color: T.textSec }}><span style={{ minWidth: 110 }}>{label}</span>{children}</label>; }
const selS = { background: T.surface, color: T.text, border: `1px solid ${T.border}`, padding: '4px 6px', fontSize: 12, borderRadius: 2 };
const addBtn = { background: T.teal, color: T.text, border: 'none', padding: '4px 12px', fontSize: 11, cursor: 'pointer', borderRadius: 3 };
const delBtn = { background: 'transparent', color: T.red, border: 'none', cursor: 'pointer', fontSize: 14 };
const btnInline = { background: T.surface, color: T.gold, border: `1px solid ${T.gold}`, padding: '3px 10px', fontSize: 11, cursor: 'pointer', borderRadius: 3, marginLeft: 8 };
