import React, { useMemo } from 'react';
import {
  T, useScenario, openDeliverable, toCsv, downloadText, html,
  ToolShell, Step, OutputRail, PrimaryCTA, ToolMenu,
  FieldRow, Worksheet, NumInput, TextInput, SelectInput, Collapsible, Note, PageHeader
} from '../../_shared/AdvisoryToolkit';
import { ENCORE_MATRIX, IUCN_DENSITY, SBTN_FLAGS, DISCLOSURE_CROSSWALK } from '../../_shared/AdvisoryReference';

const BIOMES = ['Arid / Desert', 'Semi-arid grassland', 'Tropical forest', 'Coastal / Mangrove', 'Temperate forest', 'Wetlands', 'Agricultural mosaic', 'Marine'];
const SECTORS = Object.keys(ENCORE_MATRIX);

const priorityOf = (a) => Math.min(5, a.dep * 0.4 + a.imp * 0.4 + (a.kbaKm < 10 ? 0.8 : 0.2) + Math.min(1, a.iucnN * 0.15));

const DEFAULTS = {
  entity: 'ACME Renewables',
  sector: 'Utilities — Renewables',
  reportingYear: 2025,
  assets: [
    { _id: 1, name: 'Rajasthan 50 MW PV', biome: 'Arid / Desert', areaHa: 180, kbaKm: 15, iucnN: 2, dep: 2, imp: 3, dnsh: false },
    { _id: 2, name: 'Gujarat 40 MW PV', biome: 'Semi-arid grassland', areaHa: 160, kbaKm: 8, iucnN: 4, dep: 2, imp: 4, dnsh: true },
    { _id: 3, name: 'Karnataka 35 MW PV', biome: 'Temperate forest', areaHa: 140, kbaKm: 22, iucnN: 1, dep: 3, imp: 3, dnsh: false },
    { _id: 4, name: 'Odisha 30 MW PV', biome: 'Coastal / Mangrove', areaHa: 120, kbaKm: 4, iucnN: 6, dep: 4, imp: 5, dnsh: true },
    { _id: 5, name: 'TN Rooftop', biome: 'Agricultural mosaic', areaHa: 60, kbaKm: 40, iucnN: 0, dep: 1, imp: 1, dnsh: false },
    { _id: 6, name: 'MP 25 MW PV', biome: 'Tropical forest', areaHa: 100, kbaKm: 12, iucnN: 3, dep: 3, imp: 4, dnsh: false },
    { _id: 7, name: 'AP 30 MW PV', biome: 'Semi-arid grassland', areaHa: 110, kbaKm: 18, iucnN: 1, dep: 2, imp: 3, dnsh: false },
    { _id: 8, name: 'Oman NH₃', biome: 'Arid / Desert', areaHa: 250, kbaKm: 30, iucnN: 2, dep: 2, imp: 3, dnsh: false },
  ],
  leap: { locate: 85, evaluate: 60, assess: 40, prepare: 20 },
  pillars: { governance: 3, strategy: 3, riskMgmt: 2, metrics: 2 },
  services: [
    { _id: 1, service: 'Water provisioning', dependency: 4, revAtRisk: 120 },
    { _id: 2, service: 'Soil stability', dependency: 3, revAtRisk: 60 },
    { _id: 3, service: 'Pollination', dependency: 2, revAtRisk: 20 },
    { _id: 4, service: 'Climate regulation', dependency: 3, revAtRisk: 80 },
    { _id: 5, service: 'Natural disaster regulation', dependency: 4, revAtRisk: 150 },
    { _id: 6, service: 'Habitat for biodiversity', dependency: 3, revAtRisk: 50 },
  ],
  opportunities: [
    { _id: 1, name: 'On-site native grassland restoration', capex: 2.5, npv: 8.0, years: 10 },
    { _id: 2, name: 'Agri-PV with pollinator mix', capex: 4.0, npv: 12.5, years: 15 },
    { _id: 3, name: 'Mangrove co-investment (Odisha)', capex: 6.0, npv: 22.0, years: 20 },
    { _id: 4, name: 'Water stewardship partnership', capex: 1.5, npv: 5.5, years: 10 },
  ],
};

export default function TnfdBiodiversityBaselinePage() {
  const sc = useScenario('tnfd-biodiversity', DEFAULTS);
  const s = sc.state;

  const rows = useMemo(() => s.assets.map(a => ({ ...a, priority: priorityOf(a) })), [s.assets]);
  const highPriority = rows.filter(r => r.priority >= 3.5).length;
  const totalArea = s.assets.reduce((x, a) => x + a.areaHa, 0);
  const leapAvg = (s.leap.locate + s.leap.evaluate + s.leap.assess + s.leap.prepare) / 4;
  const pillarAvg = (s.pillars.governance + s.pillars.strategy + s.pillars.riskMgmt + s.pillars.metrics) / 4;
  const totalRaR = s.services.reduce((x, s2) => x + s2.revAtRisk, 0);
  const totalNpv = s.opportunities.reduce((x, o) => x + o.npv, 0);
  const totalCapex = s.opportunities.reduce((x, o) => x + o.capex, 0);
  const dnshCount = s.assets.filter(a => a.dnsh).length;
  const ready = s.assets.length >= 1 && s.entity.trim();

  const upd = (k) => (v) => sc.update({ [k]: v });
  const updAsset = (i, k, v) => {
    sc.update({ assets: s.assets.map((a, j) => {
      if (j !== i) return a;
      const next = { ...a, [k]: v };
      if (k === 'biome') {
        const enc = ENCORE_MATRIX[s.sector]?.[v];
        if (enc) { next.dep = enc.dep; next.imp = enc.imp; }
        next.iucnN = IUCN_DENSITY[v] ?? next.iucnN;
      }
      return next;
    }) });
  };

  // Rebuild dep/imp for all assets from ENCORE when sector changes
  const setSector = (sector) => {
    sc.update({
      sector,
      assets: s.assets.map(a => {
        const enc = ENCORE_MATRIX[sector]?.[a.biome];
        return enc ? { ...a, dep: enc.dep, imp: enc.imp } : a;
      }),
    });
  };

  const sbtnFlagged = s.assets.filter(a => a.kbaKm < SBTN_FLAGS.kbaDistanceKm || a.iucnN >= SBTN_FLAGS.iucnSpeciesCount).length;
  const updSvc = (i, k, v) => sc.update({ services: s.services.map((x, j) => j === i ? { ...x, [k]: v } : x) });
  const updOpp = (i, k, v) => sc.update({ opportunities: s.opportunities.map((x, j) => j === i ? { ...x, [k]: v } : x) });

  const onDeliver = () => {
    const body = [
      html.h1(`TNFD Biodiversity Disclosure — ${s.entity}`),
      html.meta({ 'Reporting year': s.reportingYear, Assets: s.assets.length, 'Total area (ha)': totalArea, Generated: new Date().toLocaleDateString() }),
      html.h2('1. Executive Summary'),
      html.p(`Baseline assessment covering ${s.assets.length} assets across ${totalArea.toLocaleString()} hectares. ${highPriority} site${highPriority !== 1 ? 's' : ''} flagged as high priority. ${dnshCount} site${dnshCount !== 1 ? 's' : ''} with potential DNSH (Do No Significant Harm) flags.`),
      html.h2('2. LEAP Progression'),
      html.table(['Phase', 'Completion %'], [
        ['Locate', `${s.leap.locate}%`], ['Evaluate', `${s.leap.evaluate}%`], ['Assess', `${s.leap.assess}%`], ['Prepare', `${s.leap.prepare}%`]
      ]),
      html.h2('3. TNFD Pillar Maturity'),
      html.table(['Pillar', 'Maturity (0–5)'], [
        ['Governance', s.pillars.governance], ['Strategy', s.pillars.strategy], ['Risk & Impact Mgmt', s.pillars.riskMgmt], ['Metrics & Targets', s.pillars.metrics]
      ]),
      html.h2('4. Asset Register'),
      html.table(['Asset', 'Biome', 'Area ha', 'KBA km', 'IUCN #', 'Dep', 'Imp', 'Priority', 'DNSH'],
        rows.map(r => [r.name, r.biome, r.areaHa, r.kbaKm, r.iucnN, r.dep, r.imp, r.priority.toFixed(1), r.dnsh ? html.badge('amber', 'FLAG') : '—'])),
      html.h2('5. Ecosystem Services Materiality'),
      html.table(['Service', 'Dependency', 'Revenue at Risk ($M)'], s.services.map(x => [x.service, x.dependency, x.revAtRisk])),
      html.h2('6. Nature-Positive Opportunities'),
      html.table(['Programme', 'Capex $M', 'NPV $M', 'Years'], s.opportunities.map(x => [x.name, x.capex.toFixed(1), x.npv.toFixed(1), x.years])),
      html.h2('7. DNSH Summary'),
      html.p(dnshCount > 0 ? `${dnshCount} site${dnshCount > 1 ? 's' : ''} require mitigation plans: ${s.assets.filter(a => a.dnsh).map(a => a.name).join(', ')}.` : 'No DNSH flags raised at current baseline.'),
      html.h2('8. Recommendation'),
      html.p(`${ready && pillarAvg >= 3 ? html.badge('green', 'ALIGN') : html.badge('amber', 'ADVANCE')} — Continue LEAP progression; prioritise ${highPriority} high-priority sites for species surveys in FY${s.reportingYear + 1}.`),
    ].join('');
    openDeliverable(body, `TNFD Disclosure — ${s.entity}`);
  };

  return (
    <ToolShell
      header={<PageHeader code="EP-EB6 · TNFD" title="Biodiversity Baseline Tool" subtitle="LEAP-methodology biodiversity baseline: asset scoring, ecosystem service materiality, nature-positive opportunity pipeline." />}
      steps={
        <>
          <Step n={1} title="Reporting entity" hint="Sector selection loads ENCORE-derived dependency/impact scores per biome.">
            <FieldRow label="Entity"><TextInput value={s.entity} onChange={upd('entity')} style={{ width: 320 }} /></FieldRow>
            <FieldRow label="Sector"><SelectInput value={s.sector} onChange={setSector} options={SECTORS} style={{ width: 260 }} /></FieldRow>
            <FieldRow label="Reporting year"><NumInput value={s.reportingYear} onChange={upd('reportingYear')} /></FieldRow>
            <Note level="info">SBTN priority flags: <b style={{ color: sbtnFlagged > 0 ? T.amber : T.green }}>{sbtnFlagged}/{s.assets.length}</b> sites (KBA &lt; {SBTN_FLAGS.kbaDistanceKm}km OR IUCN ≥ {SBTN_FLAGS.iucnSpeciesCount} species)</Note>
          </Step>

          <Step n={2} title="Asset register & priority scoring" hint="Priority = dep×0.4 + imp×0.4 + KBA<10km×0.8 + IUCN×0.15 (max 5).">
            <Worksheet
              cols={[
                { h: 'Asset', width: '1.6fr', edit: (r, i) => <TextInput value={r.name} onChange={v => updAsset(i, 'name', v)} style={{ width: '100%' }} /> },
                { h: 'Biome', width: '1.3fr', edit: (r, i) => <SelectInput value={r.biome} onChange={v => updAsset(i, 'biome', v)} options={BIOMES} style={{ width: '100%' }} /> },
                { h: 'Ha', width: '70px', edit: (r, i) => <NumInput value={r.areaHa} onChange={v => updAsset(i, 'areaHa', v)} style={{ width: 56 }} /> },
                { h: 'KBA km', width: '70px', edit: (r, i) => <NumInput value={r.kbaKm} onChange={v => updAsset(i, 'kbaKm', v)} style={{ width: 50 }} /> },
                { h: 'IUCN', width: '60px', edit: (r, i) => <NumInput value={r.iucnN} onChange={v => updAsset(i, 'iucnN', v)} style={{ width: 42 }} /> },
                { h: 'Dep 0–5', width: '70px', edit: (r, i) => <NumInput value={r.dep} onChange={v => updAsset(i, 'dep', v)} min={0} max={5} style={{ width: 42 }} /> },
                { h: 'Imp 0–5', width: '70px', edit: (r, i) => <NumInput value={r.imp} onChange={v => updAsset(i, 'imp', v)} min={0} max={5} style={{ width: 42 }} /> },
                { h: 'Priority', width: '80px', edit: (r) => {
                    const p = priorityOf(r);
                    return <span style={{ fontFamily: T.mono, fontSize: 12, color: p >= 3.5 ? T.red : p >= 2 ? T.amber : T.green }}>{p.toFixed(1)}</span>;
                  } },
                { h: 'DNSH?', width: '60px', edit: (r, i) => <input type="checkbox" checked={r.dnsh} onChange={e => updAsset(i, 'dnsh', e.target.checked)} /> },
              ]}
              rows={rows}
              onAdd={() => sc.update({ assets: [...s.assets, { _id: Date.now(), name: 'New asset', biome: 'Semi-arid grassland', areaHa: 50, kbaKm: 20, iucnN: 1, dep: 2, imp: 2, dnsh: false }] })}
              onDel={(i) => sc.update({ assets: s.assets.filter((_, j) => j !== i) })}
            />
          </Step>

          <Step n={3} title="LEAP & pillar maturity" hint="TNFD methodology: Locate → Evaluate → Assess → Prepare. Pillars are maturity 0–5.">
            <FieldRow label="Locate %"><NumInput value={s.leap.locate} onChange={v => sc.update({ leap: { ...s.leap, locate: v } })} min={0} max={100} /></FieldRow>
            <FieldRow label="Evaluate %"><NumInput value={s.leap.evaluate} onChange={v => sc.update({ leap: { ...s.leap, evaluate: v } })} min={0} max={100} /></FieldRow>
            <FieldRow label="Assess %"><NumInput value={s.leap.assess} onChange={v => sc.update({ leap: { ...s.leap, assess: v } })} min={0} max={100} /></FieldRow>
            <FieldRow label="Prepare %"><NumInput value={s.leap.prepare} onChange={v => sc.update({ leap: { ...s.leap, prepare: v } })} min={0} max={100} /></FieldRow>
            <Collapsible title="Pillar maturity (Gov / Strat / Risk / Metrics)">
              <FieldRow label="Governance"><NumInput value={s.pillars.governance} onChange={v => sc.update({ pillars: { ...s.pillars, governance: v } })} min={0} max={5} /></FieldRow>
              <FieldRow label="Strategy"><NumInput value={s.pillars.strategy} onChange={v => sc.update({ pillars: { ...s.pillars, strategy: v } })} min={0} max={5} /></FieldRow>
              <FieldRow label="Risk & Impact Mgmt"><NumInput value={s.pillars.riskMgmt} onChange={v => sc.update({ pillars: { ...s.pillars, riskMgmt: v } })} min={0} max={5} /></FieldRow>
              <FieldRow label="Metrics & Targets"><NumInput value={s.pillars.metrics} onChange={v => sc.update({ pillars: { ...s.pillars, metrics: v } })} min={0} max={5} /></FieldRow>
            </Collapsible>
          </Step>

          <Step n={4} title="Ecosystem services">
            <Worksheet
              cols={[
                { h: 'Service', width: '2fr', edit: (r, i) => <TextInput value={r.service} onChange={v => updSvc(i, 'service', v)} style={{ width: '100%' }} /> },
                { h: 'Dependency', width: '110px', edit: (r, i) => <NumInput value={r.dependency} onChange={v => updSvc(i, 'dependency', v)} min={0} max={5} /> },
                { h: 'RaR ($M)', width: '100px', edit: (r, i) => <NumInput value={r.revAtRisk} onChange={v => updSvc(i, 'revAtRisk', v)} /> },
              ]}
              rows={s.services}
              onAdd={() => sc.update({ services: [...s.services, { _id: Date.now(), service: 'New service', dependency: 2, revAtRisk: 20 }] })}
              onDel={(i) => sc.update({ services: s.services.filter((_, j) => j !== i) })}
            />
          </Step>

          <Step n={5} title="Nature-positive opportunities">
            <Worksheet
              cols={[
                { h: 'Programme', width: '2fr', edit: (r, i) => <TextInput value={r.name} onChange={v => updOpp(i, 'name', v)} style={{ width: '100%' }} /> },
                { h: 'Capex $M', width: '90px', edit: (r, i) => <NumInput value={r.capex} onChange={v => updOpp(i, 'capex', v)} step={0.1} /> },
                { h: 'NPV $M', width: '90px', edit: (r, i) => <NumInput value={r.npv} onChange={v => updOpp(i, 'npv', v)} step={0.1} /> },
                { h: 'Years', width: '70px', edit: (r, i) => <NumInput value={r.years} onChange={v => updOpp(i, 'years', v)} /> },
                { h: 'ROI', width: '70px', edit: (r) => <span style={{ fontFamily: T.mono, color: T.gold, fontSize: 12 }}>{r.capex > 0 ? (r.npv / r.capex).toFixed(1) : '—'}x</span> },
              ]}
              rows={s.opportunities}
              onAdd={() => sc.update({ opportunities: [...s.opportunities, { _id: Date.now(), name: 'New programme', capex: 1, npv: 3, years: 10 }] })}
              onDel={(i) => sc.update({ opportunities: s.opportunities.filter((_, j) => j !== i) })}
            />
          </Step>

          <Step n={6} title="Generate disclosure pack">
            <Collapsible title="ESRS E4 / GRI 304 disclosure crosswalk">
              <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
                <thead><tr style={{ color: T.textMut }}><th style={{ padding: 4, textAlign: 'left' }}>Requirement</th><th style={{ padding: 4, textAlign: 'left' }}>Standards</th></tr></thead>
                <tbody>{Object.entries(DISCLOSURE_CROSSWALK).map(([r, std]) => (
                  <tr key={r} style={{ borderTop: `1px solid ${T.borderL}` }}>
                    <td style={{ padding: 4, color: T.text }}>{r}</td>
                    <td style={{ padding: 4, color: T.gold, fontFamily: T.mono }}>{std.join(' · ')}</td>
                  </tr>
                ))}</tbody>
              </table>
            </Collapsible>
            {!ready && <Note level="bad">Add entity name and at least one asset.</Note>}
            {ready && <Note level="ok">Ready. Deliverable is TNFD v1.0 aligned with LEAP evidence table + ESRS E4 / GRI 304 crosswalk.</Note>}
          </Step>
        </>
      }
      rail={
        <OutputRail
          label="LIVE TNFD RESULT"
          stats={[
            { label: 'High-priority sites', value: `${highPriority}/${s.assets.length}`, sub: 'score ≥ 3.5', color: highPriority > 0 ? T.amber : T.green },
            { label: 'LEAP avg', value: `${leapAvg.toFixed(0)}%`, sub: 'across 4 phases', color: leapAvg >= 60 ? T.green : T.amber },
            { label: 'Pillar maturity', value: `${pillarAvg.toFixed(1)}/5`, sub: 'TNFD 4 pillars', color: pillarAvg >= 3 ? T.green : T.amber },
            { label: 'Opportunity NPV', value: `$${totalNpv.toFixed(1)}M`, sub: `capex $${totalCapex.toFixed(1)}M`, color: T.green },
          ]}
          preview={
            <div>
              <div><b style={{ color: T.text }}>{s.entity}</b> · FY{s.reportingYear}</div>
              <div style={{ marginTop: 4 }}>{s.assets.length} assets · {totalArea.toLocaleString()} ha</div>
              <div>Rev-at-risk (eco services): ${totalRaR}M</div>
              <div>DNSH flags: <b style={{ color: dnshCount > 0 ? T.amber : T.green }}>{dnshCount}</b></div>
            </div>
          }
          cta={<PrimaryCTA onClick={onDeliver}>Generate TNFD Pack →</PrimaryCTA>}
          menu={
            <ToolMenu
              scenario={sc}
              onExportCsv={() => downloadText('tnfd-assets.csv', toCsv(rows), 'text/csv')}
              onExportJson={() => downloadText('tnfd-scenario.json', JSON.stringify(s, null, 2), 'application/json')}
              onImportCsv={(r) => sc.update({ assets: r.map((x, i) => ({ _id: Date.now() + i, name: x.name || 'Asset', biome: x.biome || 'Semi-arid grassland', areaHa: +x.areaHa || 0, kbaKm: +x.kbaKm || 20, iucnN: +x.iucnN || 0, dep: +x.dep || 2, imp: +x.imp || 2, dnsh: x.dnsh === 'true' || x.dnsh === true })) })}
              importLabel="Import assets CSV"
            />
          }
        />
      }
    />
  );
}
