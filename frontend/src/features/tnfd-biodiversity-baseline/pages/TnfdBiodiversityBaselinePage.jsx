import React, { useMemo, useState } from 'react';
import {
  T, useScenario, openDeliverable, toCsv, downloadText, html,
  ToolShell, Step, OutputRail, PrimaryCTA, ToolMenu,
  FieldRow, Worksheet, NumInput, TextInput, SelectInput, Collapsible, Note, PageHeader,
  Heatmap, ProgressRing, MonteCarloCard, Tornado,
} from '../../_shared/AdvisoryToolkit';
import {
  ENCORE_MATRIX, IUCN_DENSITY, SBTN_FLAGS, DISCLOSURE_CROSSWALK,
  MSA_LOSS, WATER_FP, MITIGATION_HIERARCHY, GBF_TARGETS, ES_SECTOR_MULT,
  monteCarlo, tornado,
} from '../../_shared/AdvisoryReference';

const BIOMES = ['Arid / Desert', 'Semi-arid grassland', 'Tropical forest', 'Coastal / Mangrove', 'Temperate forest', 'Wetlands', 'Agricultural mosaic', 'Marine'];
const SECTORS = Object.keys(ENCORE_MATRIX);
const ES_CATS = ['prov', 'reg', 'cult', 'sup'];
const ES_CAT_LABEL = { prov: 'Provisioning', reg: 'Regulating', cult: 'Cultural', sup: 'Supporting' };

// Sector -> GBF relevance key
const GBF_KEY = {
  'Utilities — Renewables': ['utilities', 're'],
  'Mining':                 ['mining'],
  'Agriculture':            ['ag'],
  'Real Estate':            ['re'],
};

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
    { _id: 1, service: 'Water provisioning',          cat: 'prov', dependency: 4, revAtRisk: 120 },
    { _id: 2, service: 'Soil stability',              cat: 'sup',  dependency: 3, revAtRisk: 60 },
    { _id: 3, service: 'Pollination',                 cat: 'reg',  dependency: 2, revAtRisk: 20 },
    { _id: 4, service: 'Climate regulation',          cat: 'reg',  dependency: 3, revAtRisk: 80 },
    { _id: 5, service: 'Natural disaster regulation', cat: 'reg',  dependency: 4, revAtRisk: 150 },
    { _id: 6, service: 'Habitat for biodiversity',    cat: 'sup',  dependency: 3, revAtRisk: 50 },
  ],
  opportunities: [
    { _id: 1, name: 'On-site native grassland restoration', capex: 2.5, npv: 8.0, years: 10 },
    { _id: 2, name: 'Agri-PV with pollinator mix', capex: 4.0, npv: 12.5, years: 15 },
    { _id: 3, name: 'Mangrove co-investment (Odisha)', capex: 6.0, npv: 22.0, years: 20 },
    { _id: 4, name: 'Water stewardship partnership', capex: 1.5, npv: 5.5, years: 10 },
  ],
  mitigation: { avoidPct: 30, minimisePct: 40, restorePct: 20, offsetPct: 10 },
  mcRuns: 800,
};

export default function TnfdBiodiversityBaselinePage() {
  const sc = useScenario('tnfd-biodiversity', DEFAULTS);
  const s = sc.state;
  const [mcTrigger, setMcTrigger] = useState(0);

  const rows = useMemo(() => s.assets.map(a => ({ ...a, priority: priorityOf(a) })), [s.assets]);
  const highPriority = rows.filter(r => r.priority >= 3.5).length;
  const totalArea = s.assets.reduce((x, a) => x + a.areaHa, 0);
  const leapAvg = (s.leap.locate + s.leap.evaluate + s.leap.assess + s.leap.prepare) / 4;
  const pillarAvg = (s.pillars.governance + s.pillars.strategy + s.pillars.riskMgmt + s.pillars.metrics) / 4;

  // MSA footprint — sector × biome × areaHa
  const msaSector = MSA_LOSS[s.sector] ? s.sector : 'Utilities — Renewables';
  const msaRows = s.assets.map(a => {
    const loss = MSA_LOSS[msaSector]?.[a.biome] ?? 0.1;
    return { ...a, msaLoss: loss, msaHa: a.areaHa * loss };
  });
  const totalMsaHa = msaRows.reduce((x, r) => x + r.msaHa, 0);

  // Water footprint — blue/green/grey m³/yr
  const waterRows = s.assets.map(a => {
    const wf = WATER_FP[a.biome] || { blue: 0, green: 0, grey: 0 };
    return { ...a, blue: wf.blue * a.areaHa, green: wf.green * a.areaHa, grey: wf.grey * a.areaHa };
  });
  const totalBlue = waterRows.reduce((x, r) => x + r.blue, 0);
  const totalGreen = waterRows.reduce((x, r) => x + r.green, 0);
  const totalGrey = waterRows.reduce((x, r) => x + r.grey, 0);

  // Mitigation hierarchy cost
  const mitTotalPct = s.mitigation.avoidPct + s.mitigation.minimisePct + s.mitigation.restorePct + s.mitigation.offsetPct;
  const mitRows = MITIGATION_HIERARCHY.map((m, i) => {
    const pct = [s.mitigation.avoidPct, s.mitigation.minimisePct, s.mitigation.restorePct, s.mitigation.offsetPct][i];
    const haAlloc = totalMsaHa * (pct / 100);
    const cost = haAlloc * m.costPerMsaHa;
    return { ...m, pct, haAlloc, cost };
  });
  const totalMitCost = mitRows.reduce((x, r) => x + r.cost, 0);
  const credibility = mitRows.reduce((x, r) => x + (r.credibility * r.pct / 100), 0);

  // Refine eco-service RaR via sector multipliers
  const esMult = ES_SECTOR_MULT[msaSector] || { prov: 1, reg: 1, cult: 1, sup: 1 };
  const refinedServices = s.services.map(x => ({ ...x, refined: x.revAtRisk * (esMult[x.cat] ?? 1) }));
  const totalRaR = refinedServices.reduce((x, r) => x + r.refined, 0);

  const totalNpv = s.opportunities.reduce((x, o) => x + o.npv, 0);
  const totalCapex = s.opportunities.reduce((x, o) => x + o.capex, 0);
  const dnshCount = s.assets.filter(a => a.dnsh).length;

  // Sector × biome MSA heatmap
  const msaHeat = useMemo(() => {
    const d = {};
    SECTORS.forEach(sec => {
      d[sec] = {};
      BIOMES.forEach(b => { d[sec][b] = (MSA_LOSS[sec]?.[b] ?? 0) * 100; });
    });
    return d;
  }, []);

  // GBF alignment
  const gbfKeys = GBF_KEY[msaSector] || ['utilities'];
  const gbfRelevant = GBF_TARGETS.filter(g => g.relevanceFor.some(k => gbfKeys.includes(k)));

  // Monte Carlo on Rev-at-Risk (factor: dependency scalar × sector mult × realisation probability)
  const mc = useMemo(() => {
    void mcTrigger;
    return monteCarlo(
      ({ depScalar, prob, mitCredit }) => {
        const gross = refinedServices.reduce((x, r) => x + r.refined * depScalar, 0);
        return gross * prob * (1 - mitCredit / 100);
      },
      {
        depScalar: { min: 0.7, mode: 1.0, max: 1.4 },
        prob: { min: 0.3, mode: 0.55, max: 0.85 },
        mitCredit: { min: 0, mode: credibility * 0.5, max: credibility },
      },
      s.mcRuns
    );
  }, [mcTrigger, refinedServices, credibility, s.mcRuns]);

  // Tornado
  const torn = useMemo(() => tornado(
    { kbaFlags: rows.filter(r => r.kbaKm < 10).length || 1, iucnAvg: rows.reduce((x, r) => x + r.iucnN, 0) / Math.max(1, rows.length), msaFactor: totalMsaHa || 1, mitPct: mitTotalPct, npv: totalNpv },
    (v) => (v.msaFactor * 0.4 + v.kbaFlags * 10 + v.iucnAvg * 5) * (1 - Math.min(100, v.mitPct) / 200) - v.npv * 2,
    0.20
  ), [rows, totalMsaHa, mitTotalPct, totalNpv]);

  const sbtnFlagged = s.assets.filter(a => a.kbaKm < SBTN_FLAGS.kbaDistanceKm || a.iucnN >= SBTN_FLAGS.iucnSpeciesCount).length;
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
  const setSector = (sector) => {
    sc.update({
      sector,
      assets: s.assets.map(a => {
        const enc = ENCORE_MATRIX[sector]?.[a.biome];
        return enc ? { ...a, dep: enc.dep, imp: enc.imp } : a;
      }),
    });
  };
  const updSvc = (i, k, v) => sc.update({ services: s.services.map((x, j) => j === i ? { ...x, [k]: v } : x) });
  const updOpp = (i, k, v) => sc.update({ opportunities: s.opportunities.map((x, j) => j === i ? { ...x, [k]: v } : x) });
  const updMit = (k, v) => sc.update({ mitigation: { ...s.mitigation, [k]: v } });

  const onDeliver = () => {
    const body = [
      html.h1(`TNFD Biodiversity Disclosure — ${s.entity}`),
      html.meta({ Sector: s.sector, 'Reporting year': s.reportingYear, Assets: s.assets.length, 'Total area (ha)': totalArea, 'MSA loss (ha-equiv)': totalMsaHa.toFixed(0), Generated: new Date().toLocaleDateString() }),
      html.h2('1. Executive Summary'),
      html.p(`Baseline covering <b>${s.assets.length} assets</b> across <b>${totalArea.toLocaleString()} ha</b>. MSA-weighted biodiversity footprint: <b>${totalMsaHa.toFixed(0)} ha-equivalents</b>. Refined ecosystem-service Rev-at-Risk: <b>$${totalRaR.toFixed(0)}M</b> (sector-mult adjusted). ${highPriority} high-priority sites. ${dnshCount} DNSH flags.`),
      html.h2('2. LEAP Progression & Pillar Maturity'),
      html.table(['Phase', 'Completion %'], [['Locate', s.leap.locate + '%'], ['Evaluate', s.leap.evaluate + '%'], ['Assess', s.leap.assess + '%'], ['Prepare', s.leap.prepare + '%']]),
      html.table(['Pillar', 'Maturity (0–5)'], [['Governance', s.pillars.governance], ['Strategy', s.pillars.strategy], ['Risk & Impact Mgmt', s.pillars.riskMgmt], ['Metrics & Targets', s.pillars.metrics]]),
      html.h2('3. Asset Register & Priority'),
      html.table(['Asset', 'Biome', 'Area ha', 'KBA km', 'IUCN #', 'Dep', 'Imp', 'Priority', 'DNSH'],
        rows.map(r => [r.name, r.biome, r.areaHa, r.kbaKm, r.iucnN, r.dep, r.imp, r.priority.toFixed(1), r.dnsh ? html.badge('amber', 'FLAG') : '—'])),
      html.h2('4. MSA Biodiversity Footprint'),
      html.p(`Using MSA_LOSS factors for sector <b>${msaSector}</b>:`),
      html.table(['Asset', 'Biome', 'Area ha', 'MSA loss factor', 'MSA ha-equiv'],
        msaRows.map(r => [r.name, r.biome, r.areaHa, r.msaLoss.toFixed(2), r.msaHa.toFixed(1)])),
      html.h2('5. Water Footprint (m³/yr)'),
      html.p(`Blue <b>${(totalBlue / 1e6).toFixed(2)} Mm³</b> · Green <b>${(totalGreen / 1e6).toFixed(2)} Mm³</b> · Grey <b>${(totalGrey / 1e6).toFixed(2)} Mm³</b>.`),
      html.h2('6. Ecosystem Services — Rev-at-Risk (sector-refined)'),
      html.table(['Service', 'Cat', 'Dep', 'Raw RaR $M', `× ${s.sector} mult`, 'Refined $M'],
        refinedServices.map(x => [x.service, ES_CAT_LABEL[x.cat] || x.cat, x.dependency, x.revAtRisk, (esMult[x.cat] ?? 1).toFixed(2), x.refined.toFixed(1)])),
      html.h2('7. Mitigation Hierarchy'),
      html.table(['Step', 'Description', 'Allocation %', 'MSA ha', '$ / MSA ha', 'Cost $', 'Credibility'],
        mitRows.map(r => [r.step, r.desc, r.pct + '%', r.haAlloc.toFixed(1), '$' + r.costPerMsaHa.toLocaleString(), '$' + r.cost.toLocaleString(), r.credibility + '%'])),
      html.p(`Total mitigation cost: <b>$${totalMitCost.toLocaleString()}</b>. Weighted credibility: <b>${credibility.toFixed(0)}%</b>.`),
      html.h2('8. GBF (Kunming-Montreal) Alignment'),
      html.table(['Target', 'Name'], gbfRelevant.map(g => [g.id, g.name])),
      html.h2('9. Nature-Positive Opportunities'),
      html.table(['Programme', 'Capex $M', 'NPV $M', 'Years', 'ROI x'],
        s.opportunities.map(x => [x.name, x.capex.toFixed(1), x.npv.toFixed(1), x.years, x.capex > 0 ? (x.npv / x.capex).toFixed(1) : '—'])),
      html.h2('10. Monte-Carlo Rev-at-Risk ($M)'),
      html.p(`N=${s.mcRuns}. P5=${mc.p05.toFixed(1)} · P50=${mc.p50.toFixed(1)} · Mean=${mc.mean.toFixed(1)} · P95=${mc.p95.toFixed(1)}.`),
      html.h2('11. Disclosure Crosswalk'),
      html.table(['Requirement', 'Standards'], Object.entries(DISCLOSURE_CROSSWALK).map(([r, std]) => [r, std.join(' · ')])),
      html.h2('12. Recommendation'),
      html.p(`${ready && pillarAvg >= 3 ? html.badge('green', 'ALIGN') : html.badge('amber', 'ADVANCE')} — Prioritise ${highPriority} high-priority sites; upgrade ${s.mitigation.offsetPct}% offset allocation to restore/minimise tier; close LEAP Assess phase before FY${s.reportingYear + 1}.`),
    ].join('');
    openDeliverable(body, `TNFD Disclosure — ${s.entity}`);
  };

  return (
    <ToolShell
      header={<PageHeader code="EP-EB6 · TNFD" title="Biodiversity Baseline (MSA · Water · Mitigation · GBF)" subtitle="LEAP-methodology baseline with MSA footprint, blue/green/grey water accounting, mitigation-hierarchy costing, GBF target alignment, Monte-Carlo RaR." />}
      steps={
        <>
          <Step n={1} title="Reporting entity" hint="Sector selection loads ENCORE dep/imp and MSA_LOSS footprint factors.">
            <FieldRow label="Entity"><TextInput value={s.entity} onChange={upd('entity')} style={{ width: 320 }} /></FieldRow>
            <FieldRow label="Sector"><SelectInput value={s.sector} onChange={setSector} options={SECTORS} style={{ width: 260 }} /></FieldRow>
            <FieldRow label="Reporting year"><NumInput value={s.reportingYear} onChange={upd('reportingYear')} /></FieldRow>
            <Note level="info">SBTN priority flags: <b style={{ color: sbtnFlagged > 0 ? T.amber : T.green }}>{sbtnFlagged}/{s.assets.length}</b> sites (KBA &lt; {SBTN_FLAGS.kbaDistanceKm}km OR IUCN ≥ {SBTN_FLAGS.iucnSpeciesCount}).</Note>
          </Step>

          <Step n={2} title="Asset register & priority scoring" hint="Priority = dep×0.4 + imp×0.4 + KBA<10km×0.8 + IUCN×0.15 (max 5).">
            <Worksheet
              cols={[
                { h: 'Asset', width: '1.6fr', edit: (r, i) => <TextInput value={r.name} onChange={v => updAsset(i, 'name', v)} style={{ width: '100%' }} /> },
                { h: 'Biome', width: '1.3fr', edit: (r, i) => <SelectInput value={r.biome} onChange={v => updAsset(i, 'biome', v)} options={BIOMES} style={{ width: '100%' }} /> },
                { h: 'Ha', width: '70px', edit: (r, i) => <NumInput value={r.areaHa} onChange={v => updAsset(i, 'areaHa', v)} style={{ width: 56 }} /> },
                { h: 'KBA km', width: '70px', edit: (r, i) => <NumInput value={r.kbaKm} onChange={v => updAsset(i, 'kbaKm', v)} style={{ width: 50 }} /> },
                { h: 'IUCN', width: '60px', edit: (r, i) => <NumInput value={r.iucnN} onChange={v => updAsset(i, 'iucnN', v)} style={{ width: 42 }} /> },
                { h: 'Dep', width: '60px', edit: (r, i) => <NumInput value={r.dep} onChange={v => updAsset(i, 'dep', v)} min={0} max={5} style={{ width: 42 }} /> },
                { h: 'Imp', width: '60px', edit: (r, i) => <NumInput value={r.imp} onChange={v => updAsset(i, 'imp', v)} min={0} max={5} style={{ width: 42 }} /> },
                { h: 'Priority', width: '70px', edit: (r) => {
                    const p = priorityOf(r);
                    return <span style={{ fontFamily: T.mono, fontSize: 12, color: p >= 3.5 ? T.red : p >= 2 ? T.amber : T.green }}>{p.toFixed(1)}</span>;
                  } },
                { h: 'DNSH', width: '50px', edit: (r, i) => <input type="checkbox" checked={r.dnsh} onChange={e => updAsset(i, 'dnsh', e.target.checked)} /> },
              ]}
              rows={rows}
              onAdd={() => sc.update({ assets: [...s.assets, { _id: Date.now(), name: 'New asset', biome: 'Semi-arid grassland', areaHa: 50, kbaKm: 20, iucnN: 1, dep: 2, imp: 2, dnsh: false }] })}
              onDel={(i) => sc.update({ assets: s.assets.filter((_, j) => j !== i) })}
            />
          </Step>

          <Step n={3} title="MSA footprint (Mean Species Abundance)" hint="Sector × biome loss factor × area = ha-equivalent biodiversity impact.">
            <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
              <thead><tr style={{ color: T.textMut }}>
                <th style={{ padding: 4, textAlign: 'left' }}>Asset</th>
                <th style={{ padding: 4, textAlign: 'left' }}>Biome</th>
                <th style={{ padding: 4, textAlign: 'right' }}>Ha</th>
                <th style={{ padding: 4, textAlign: 'right' }}>MSA factor</th>
                <th style={{ padding: 4, textAlign: 'right' }}>MSA ha-equiv</th>
              </tr></thead>
              <tbody>{msaRows.map((r, i) => (
                <tr key={i} style={{ borderTop: `1px solid ${T.borderL}` }}>
                  <td style={{ padding: 4, color: T.text }}>{r.name}</td>
                  <td style={{ padding: 4, color: T.textSec }}>{r.biome}</td>
                  <td style={{ padding: 4, textAlign: 'right', fontFamily: T.mono }}>{r.areaHa}</td>
                  <td style={{ padding: 4, textAlign: 'right', fontFamily: T.mono, color: r.msaLoss > 0.5 ? T.red : r.msaLoss > 0.2 ? T.amber : T.green }}>{r.msaLoss.toFixed(2)}</td>
                  <td style={{ padding: 4, textAlign: 'right', fontFamily: T.mono, color: T.gold }}>{r.msaHa.toFixed(1)}</td>
                </tr>
              ))}</tbody>
              <tfoot><tr style={{ borderTop: `2px solid ${T.border}` }}>
                <td colSpan={4} style={{ padding: 4, textAlign: 'right', color: T.textSec }}>Total MSA ha-equivalents:</td>
                <td style={{ padding: 4, textAlign: 'right', fontFamily: T.mono, color: T.gold }}><b>{totalMsaHa.toFixed(1)}</b></td>
              </tr></tfoot>
            </table>
            <Collapsible title="Sector × biome MSA heatmap (reference)">
              <Heatmap data={msaHeat} rows={SECTORS} cols={BIOMES} fmt={(n) => n.toFixed(0) + '%'} loColor={T.green} hiColor={T.red} />
            </Collapsible>
          </Step>

          <Step n={4} title="Water footprint (m³/yr)" hint="WATER_FP blue (irrigation/process) + green (rainfall) + grey (pollution-dilution) per biome × area.">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
              <div style={{ padding: 10, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4 }}>
                <div style={{ fontSize: 10, color: T.textMut }}>BLUE WATER</div>
                <div style={{ fontFamily: T.mono, fontSize: 16, color: T.teal }}>{(totalBlue / 1e6).toFixed(2)} Mm³</div>
              </div>
              <div style={{ padding: 10, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4 }}>
                <div style={{ fontSize: 10, color: T.textMut }}>GREEN WATER</div>
                <div style={{ fontFamily: T.mono, fontSize: 16, color: T.green }}>{(totalGreen / 1e6).toFixed(2)} Mm³</div>
              </div>
              <div style={{ padding: 10, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4 }}>
                <div style={{ fontSize: 10, color: T.textMut }}>GREY WATER</div>
                <div style={{ fontFamily: T.mono, fontSize: 16, color: T.amber }}>{(totalGrey / 1e6).toFixed(2)} Mm³</div>
              </div>
            </div>
          </Step>

          <Step n={5} title="LEAP & pillar maturity">
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

          <Step n={6} title="Ecosystem services (sector-mult refined)" hint={`ES_SECTOR_MULT for ${msaSector}: prov×${esMult.prov} · reg×${esMult.reg} · cult×${esMult.cult} · sup×${esMult.sup}`}>
            <Worksheet
              cols={[
                { h: 'Service', width: '1.8fr', edit: (r, i) => <TextInput value={r.service} onChange={v => updSvc(i, 'service', v)} style={{ width: '100%' }} /> },
                { h: 'Category', width: '110px', edit: (r, i) => <SelectInput value={r.cat || 'reg'} onChange={v => updSvc(i, 'cat', v)} options={ES_CATS} style={{ width: '100%' }} /> },
                { h: 'Dep', width: '70px', edit: (r, i) => <NumInput value={r.dependency} onChange={v => updSvc(i, 'dependency', v)} min={0} max={5} /> },
                { h: 'Raw $M', width: '90px', edit: (r, i) => <NumInput value={r.revAtRisk} onChange={v => updSvc(i, 'revAtRisk', v)} /> },
                { h: 'Refined', width: '90px', edit: (r) => {
                    const mult = esMult[r.cat] ?? 1;
                    return <span style={{ fontFamily: T.mono, color: T.gold, fontSize: 12 }}>${(r.revAtRisk * mult).toFixed(1)}M</span>;
                  } },
              ]}
              rows={s.services}
              onAdd={() => sc.update({ services: [...s.services, { _id: Date.now(), service: 'New service', cat: 'reg', dependency: 2, revAtRisk: 20 }] })}
              onDel={(i) => sc.update({ services: s.services.filter((_, j) => j !== i) })}
            />
          </Step>

          <Step n={7} title="Mitigation hierarchy allocation" hint="Avoid → Minimise → Restore → Offset. Allocations should total 100%.">
            <FieldRow label="Avoid %"><NumInput value={s.mitigation.avoidPct} onChange={v => updMit('avoidPct', v)} min={0} max={100} suffix="%" /></FieldRow>
            <FieldRow label="Minimise %"><NumInput value={s.mitigation.minimisePct} onChange={v => updMit('minimisePct', v)} min={0} max={100} suffix="%" /></FieldRow>
            <FieldRow label="Restore %"><NumInput value={s.mitigation.restorePct} onChange={v => updMit('restorePct', v)} min={0} max={100} suffix="%" /></FieldRow>
            <FieldRow label="Offset %"><NumInput value={s.mitigation.offsetPct} onChange={v => updMit('offsetPct', v)} min={0} max={100} suffix="%" /></FieldRow>
            <Note level={mitTotalPct === 100 ? 'ok' : 'bad'}>
              Total: <b>{mitTotalPct}%</b>{mitTotalPct !== 100 && ' (should be 100)'}
            </Note>
            <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse', marginTop: 8 }}>
              <thead><tr style={{ color: T.textMut }}>
                <th style={{ padding: 4, textAlign: 'left' }}>Step</th>
                <th style={{ padding: 4, textAlign: 'right' }}>Alloc %</th>
                <th style={{ padding: 4, textAlign: 'right' }}>MSA ha</th>
                <th style={{ padding: 4, textAlign: 'right' }}>$/ha</th>
                <th style={{ padding: 4, textAlign: 'right' }}>Cost $</th>
                <th style={{ padding: 4, textAlign: 'right' }}>Cred %</th>
              </tr></thead>
              <tbody>{mitRows.map((r, i) => (
                <tr key={i} style={{ borderTop: `1px solid ${T.borderL}` }}>
                  <td style={{ padding: 4, color: T.text }}>{r.step}</td>
                  <td style={{ padding: 4, textAlign: 'right', fontFamily: T.mono }}>{r.pct}%</td>
                  <td style={{ padding: 4, textAlign: 'right', fontFamily: T.mono }}>{r.haAlloc.toFixed(1)}</td>
                  <td style={{ padding: 4, textAlign: 'right', fontFamily: T.mono }}>${r.costPerMsaHa.toLocaleString()}</td>
                  <td style={{ padding: 4, textAlign: 'right', fontFamily: T.mono, color: T.amber }}>${r.cost.toLocaleString()}</td>
                  <td style={{ padding: 4, textAlign: 'right', fontFamily: T.mono, color: r.credibility > 70 ? T.green : T.amber }}>{r.credibility}</td>
                </tr>
              ))}</tbody>
            </table>
            <div style={{ marginTop: 8, display: 'flex', gap: 16, alignItems: 'center' }}>
              <ProgressRing pct={credibility} size={72} label="credibility" color={credibility >= 70 ? T.green : T.amber} />
              <div style={{ fontFamily: T.mono, fontSize: 12, color: T.textSec }}>
                Total cost: <span style={{ color: T.amber }}>${totalMitCost.toLocaleString()}</span><br />
                Weighted credibility: <span style={{ color: credibility >= 70 ? T.green : T.amber }}>{credibility.toFixed(0)}%</span>
              </div>
            </div>
          </Step>

          <Step n={8} title="GBF (Kunming-Montreal) target alignment">
            <Note level="info">Targets relevant to <b>{msaSector}</b>:</Note>
            <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
              <tbody>{gbfRelevant.map(g => (
                <tr key={g.id} style={{ borderTop: `1px solid ${T.borderL}` }}>
                  <td style={{ padding: 4, fontFamily: T.mono, color: T.gold, width: 50 }}>{g.id}</td>
                  <td style={{ padding: 4, color: T.text }}>{g.name}</td>
                </tr>
              ))}</tbody>
            </table>
          </Step>

          <Step n={9} title="Nature-positive opportunities">
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

          <Step n={10} title="Monte Carlo — Rev-at-Risk distribution">
            <FieldRow label="MC runs"><NumInput value={s.mcRuns} onChange={upd('mcRuns')} step={200} min={100} max={5000} /></FieldRow>
            <button onClick={() => setMcTrigger(x => x + 1)} style={{ background: T.surfaceH, color: T.gold, border: `1px solid ${T.border}`, padding: '4px 10px', fontSize: 11, cursor: 'pointer', borderRadius: 3, fontFamily: T.mono, marginTop: 6 }}>↻ Re-sample</button>
            <div style={{ marginTop: 10 }}>
              <MonteCarloCard title="Realised Rev-at-Risk ($M)" stats={mc} fmt={(n) => n.toFixed(1)} unit=" $M" />
            </div>
            <div style={{ marginTop: 10 }}>
              <Tornado rows={torn.map(t => ({ label: t.driver, low: t.low, high: t.high }))} fmt={(n) => n.toFixed(1)} />
            </div>
          </Step>

          <Step n={11} title="Generate disclosure pack">
            <Collapsible title="ESRS E4 / GRI 304 crosswalk">
              <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
                <tbody>{Object.entries(DISCLOSURE_CROSSWALK).map(([r, std]) => (
                  <tr key={r} style={{ borderTop: `1px solid ${T.borderL}` }}>
                    <td style={{ padding: 4, color: T.text }}>{r}</td>
                    <td style={{ padding: 4, color: T.gold, fontFamily: T.mono }}>{std.join(' · ')}</td>
                  </tr>
                ))}</tbody>
              </table>
            </Collapsible>
            {!ready && <Note level="bad">Add entity name and at least one asset.</Note>}
            {ready && <Note level="ok">Ready. Deliverable: TNFD v1.0 + LEAP + MSA + Water + Mitigation + GBF + MC, crosswalked to ESRS E4 / GRI 304.</Note>}
          </Step>
        </>
      }
      rail={
        <OutputRail
          label="LIVE TNFD RESULT"
          stats={[
            { label: 'High-priority sites', value: `${highPriority}/${s.assets.length}`, sub: 'score ≥ 3.5', color: highPriority > 0 ? T.amber : T.green },
            { label: 'MSA ha-equiv', value: totalMsaHa.toFixed(0), sub: `sector ${msaSector.split('—')[0].trim()}`, color: T.gold },
            { label: 'Refined RaR', value: `$${totalRaR.toFixed(0)}M`, sub: 'sector-mult applied', color: T.amber },
            { label: 'MC P95 RaR', value: `$${mc.p95.toFixed(1)}M`, sub: `P50 $${mc.p50.toFixed(1)}M`, color: T.red },
            { label: 'Mit. credibility', value: `${credibility.toFixed(0)}%`, sub: `$${(totalMitCost / 1e6).toFixed(2)}M cost`, color: credibility >= 70 ? T.green : T.amber },
            { label: 'Water blue', value: `${(totalBlue / 1e6).toFixed(1)} Mm³`, sub: `green ${(totalGreen / 1e6).toFixed(1)}`, color: T.teal },
            { label: 'LEAP avg', value: `${leapAvg.toFixed(0)}%`, sub: 'across 4 phases', color: leapAvg >= 60 ? T.green : T.amber },
            { label: 'Opportunity NPV', value: `$${totalNpv.toFixed(1)}M`, sub: `capex $${totalCapex.toFixed(1)}M`, color: T.green },
          ]}
          preview={
            <div>
              <div><b style={{ color: T.text }}>{s.entity}</b> · FY{s.reportingYear}</div>
              <div style={{ marginTop: 4 }}>{s.assets.length} assets · {totalArea.toLocaleString()} ha</div>
              <div>Pillar maturity: {pillarAvg.toFixed(1)}/5 · DNSH flags: <b style={{ color: dnshCount > 0 ? T.amber : T.green }}>{dnshCount}</b></div>
              <div style={{ fontSize: 11, color: T.textMut, marginTop: 2 }}>GBF targets: {gbfRelevant.length}</div>
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
