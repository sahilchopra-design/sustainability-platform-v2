import React, { useMemo } from 'react';
import {
  T, useScenario, openDeliverable, toCsv, downloadText, html,
  ToolShell, Step, OutputRail, PrimaryCTA, ToolMenu,
  FieldRow, Worksheet, NumInput, TextInput, SelectInput, Collapsible, Note, PageHeader
} from '../../_shared/AdvisoryToolkit';

const METHODS = ['Solar PV (utility)', 'Solar rooftop', 'Wind onshore', 'Small hydro', 'Biomass', 'Waste heat recovery', 'Energy efficiency', 'Fuel switching'];
const CCC_TIERS = { 'Low (₹500/t)': 500, 'Mid (₹1,200/t)': 1200, 'High (₹2,500/t)': 2500 };

const DEFAULTS = {
  projectName: 'ACME 150 MW Solar Portfolio',
  hostEntity: 'ACME Renewables Pvt Ltd',
  crediting: 10,
  discount: 8,
  priceTier: 'Mid (₹1,200/t)',
  assets: [
    { _id: 1, site: 'Rajasthan PV-1', method: 'Solar PV (utility)', mw: 50, mwh: 98500, baselineEF: 0.82, projectEF: 0.00, vintage: 2025 },
    { _id: 2, site: 'Gujarat PV-2', method: 'Solar PV (utility)', mw: 40, mwh: 78000, baselineEF: 0.79, projectEF: 0.00, vintage: 2025 },
    { _id: 3, site: 'Karnataka PV-3', method: 'Solar PV (utility)', mw: 35, mwh: 69000, baselineEF: 0.75, projectEF: 0.00, vintage: 2026 },
    { _id: 4, site: 'Tamil Nadu Rooftop', method: 'Solar rooftop', mw: 25, mwh: 44000, baselineEF: 0.77, projectEF: 0.00, vintage: 2026 },
  ],
  addn: { invest: true, tech: true, common: false, regBarrier: true },
};

export default function CctsOffsetRegistrationPage() {
  const sc = useScenario('ccts-offset', DEFAULTS);
  const s = sc.state;

  const rows = useMemo(() => s.assets.map(a => ({ ...a, eru: Math.max(0, a.mwh * (a.baselineEF - a.projectEF)) })), [s.assets]);
  const totalEru = rows.reduce((x, r) => x + r.eru, 0);
  const totalMw = s.assets.reduce((x, a) => x + a.mw, 0);
  const price = CCC_TIERS[s.priceTier] || 1200;
  const revenueYr = totalEru * price;
  const disc = s.discount > 0 ? (1 - Math.pow(1 + s.discount / 100, -s.crediting)) / (s.discount / 100) : s.crediting;
  const npv = revenueYr * disc;
  const addnPass = Object.values(s.addn).filter(Boolean).length;
  const addnOk = addnPass >= 3;
  const ready = addnOk && totalEru > 0 && s.projectName.trim();

  const upd = (k) => (v) => sc.update({ [k]: v });
  const updAsset = (i, k, v) => sc.update({ assets: s.assets.map((a, j) => j === i ? { ...a, [k]: v } : a) });
  const addAsset = () => sc.update({ assets: [...s.assets, { _id: Date.now(), site: 'New site', method: 'Solar PV (utility)', mw: 10, mwh: 20000, baselineEF: 0.78, projectEF: 0, vintage: 2026 }] });
  const delAsset = (i) => sc.update({ assets: s.assets.filter((_, j) => j !== i) });

  const onDeliver = () => {
    const body = [
      html.h1(`CCTS Registration Dossier — ${s.projectName}`),
      html.meta({ Entity: s.hostEntity, Crediting: `${s.crediting} years`, 'Price tier': s.priceTier, Generated: new Date().toLocaleDateString() }),
      html.h2('1. Executive Summary'),
      html.p(`Portfolio of ${s.assets.length} project activities totalling ${totalMw.toFixed(1)} MW, generating an estimated <b>${totalEru.toFixed(0)} CCC/year</b> under BEE-approved methodologies.`),
      html.p(`Indicative NPV at ${s.priceTier}: <b>₹${(npv / 1e7).toFixed(2)} Cr</b> over ${s.crediting}-year crediting period (${s.discount}% discount).`),
      html.h2('2. Project Portfolio'),
      html.table(['Site', 'Method', 'MW', 'MWh/yr', 'Baseline EF', 'Project EF', 'ERU/yr (tCO₂e)'],
        rows.map(r => [r.site, r.method, r.mw, r.mwh.toLocaleString(), r.baselineEF.toFixed(3), r.projectEF.toFixed(3), r.eru.toFixed(0)])),
      html.h2('3. Additionality Assessment (4-prong)'),
      html.p(`<b>${addnPass}/4 tests passed</b> — ${addnOk ? html.badge('green', 'ELIGIBLE') : html.badge('red', 'NOT ELIGIBLE')}`),
      html.table(['Test', 'Status'], [
        ['Investment barrier', s.addn.invest ? '✓ Pass' : '✗ Fail'],
        ['Technology barrier', s.addn.tech ? '✓ Pass' : '✗ Fail'],
        ['Common practice', s.addn.common ? '✓ Pass' : '✗ Fail'],
        ['Regulatory barrier', s.addn.regBarrier ? '✓ Pass' : '✗ Fail'],
      ]),
      html.h2('4. Price NPV Scenarios'),
      html.table(['Tier', '₹/t', 'Rev/yr (₹ Cr)', `NPV ${s.crediting}y (₹ Cr)`],
        Object.entries(CCC_TIERS).map(([n, p]) => [n, p, ((totalEru * p) / 1e7).toFixed(2), ((totalEru * p * disc) / 1e7).toFixed(2)])),
      html.h2('5. Registration Cycle'),
      html.p('PDD → Validation (DoE) → CCTS Registry → Verification → CCC issuance. Est. 10–14 months to first issuance.'),
      html.h2('6. Recommendation'),
      html.p(ready ? html.badge('green', 'PROCEED') + ' — advance to PDD preparation.' : html.badge('red', 'HOLD') + ' — resolve additionality gaps or increase ERU.'),
    ].join('');
    openDeliverable(body, `CCTS Dossier — ${s.projectName}`);
  };

  return (
    <ToolShell
      header={<PageHeader code="EP-EB2 · CCTS" title="Offset Registration Tool" subtitle="Size ERUs, test additionality, price credits — produces a filing-ready CCTS registration dossier." />}
      steps={
        <>
          <Step n={1} title="Project scope" hint="Identify the host entity and crediting horizon.">
            <FieldRow label="Project name"><TextInput value={s.projectName} onChange={upd('projectName')} style={{ width: 360 }} /></FieldRow>
            <FieldRow label="Host entity"><TextInput value={s.hostEntity} onChange={upd('hostEntity')} style={{ width: 360 }} /></FieldRow>
            <FieldRow label="Crediting period" hint="Typical 7–10 years, renewable once."><NumInput value={s.crediting} onChange={upd('crediting')} min={1} max={21} suffix="years" /></FieldRow>
            <FieldRow label="Discount rate" hint="For NPV of future credit revenue."><NumInput value={s.discount} onChange={upd('discount')} step={0.5} min={0} max={25} suffix="%" /></FieldRow>
          </Step>

          <Step n={2} title="Project activities & ERU calculation" hint="ERU = output × (baseline EF − project EF). Edit cells inline.">
            <Worksheet
              cols={[
                { h: 'Site', width: '1.3fr', edit: (r, i) => <TextInput value={r.site} onChange={v => updAsset(i, 'site', v)} style={{ width: '100%' }} /> },
                { h: 'Method', width: '1.4fr', edit: (r, i) => <SelectInput value={r.method} onChange={v => updAsset(i, 'method', v)} options={METHODS} style={{ width: '100%' }} /> },
                { h: 'MW', width: '60px', edit: (r, i) => <NumInput value={r.mw} onChange={v => updAsset(i, 'mw', v)} style={{ width: 50 }} /> },
                { h: 'MWh/yr', width: '100px', edit: (r, i) => <NumInput value={r.mwh} onChange={v => updAsset(i, 'mwh', v)} step={100} style={{ width: 86 }} /> },
                { h: 'Base EF', width: '80px', edit: (r, i) => <NumInput value={r.baselineEF} onChange={v => updAsset(i, 'baselineEF', v)} step={0.01} style={{ width: 62 }} /> },
                { h: 'Proj EF', width: '80px', edit: (r, i) => <NumInput value={r.projectEF} onChange={v => updAsset(i, 'projectEF', v)} step={0.01} style={{ width: 62 }} /> },
                { h: 'ERU/yr', width: '90px', edit: (r) => <span style={{ fontFamily: T.mono, color: T.gold, fontSize: 12 }}>{Math.max(0, r.mwh * (r.baselineEF - r.projectEF)).toFixed(0)}</span> },
              ]}
              rows={rows}
              onAdd={addAsset}
              onDel={delAsset}
            />
          </Step>

          <Step n={3} title="Additionality — 4-prong test" hint="Minimum 3 of 4 must pass for registration eligibility." done={addnOk}>
            {[
              ['invest', 'Investment barrier', 'IRR < hurdle rate without carbon revenue'],
              ['tech', 'Technology barrier', 'First-of-kind or < 20% penetration'],
              ['common', 'Common practice', '< 20% regional uptake of similar activity'],
              ['regBarrier', 'Regulatory barrier', 'No mandate; voluntary action']
            ].map(([k, lbl, hint]) => (
              <FieldRow key={k} label={lbl} hint={hint}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, color: s.addn[k] ? T.green : T.textMut }}>
                  <input type="checkbox" checked={s.addn[k]} onChange={e => sc.update({ addn: { ...s.addn, [k]: e.target.checked } })} />
                  {s.addn[k] ? 'Pass' : 'Fail'}
                </label>
              </FieldRow>
            ))}
            {!addnOk && <Note level="warn">Only {addnPass}/4 passing. Strengthen additionality narrative.</Note>}
          </Step>

          <Step n={4} title="Price scenario" hint="CCC trading has not yet deepened in India; stress across tiers.">
            <FieldRow label="Reference tier">
              <SelectInput value={s.priceTier} onChange={upd('priceTier')} options={Object.keys(CCC_TIERS)} />
            </FieldRow>
            <Collapsible title="Cross-tier NPV sensitivity">
              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                <thead><tr style={{ color: T.textMut, textAlign: 'left' }}><th style={{ padding: 6 }}>Tier</th><th style={{ padding: 6 }}>₹/t</th><th style={{ padding: 6 }}>Rev/yr</th><th style={{ padding: 6 }}>NPV</th></tr></thead>
                <tbody>{Object.entries(CCC_TIERS).map(([n, p]) => (
                  <tr key={n} style={{ borderTop: `1px solid ${T.borderL}`, fontFamily: T.mono }}>
                    <td style={{ padding: 6, color: T.textSec, fontFamily: T.font }}>{n}</td>
                    <td style={{ padding: 6 }}>{p}</td>
                    <td style={{ padding: 6, color: T.gold }}>₹{((totalEru * p) / 1e7).toFixed(2)} Cr</td>
                    <td style={{ padding: 6, color: T.gold }}>₹{((totalEru * p * disc) / 1e7).toFixed(2)} Cr</td>
                  </tr>))}
                </tbody>
              </table>
            </Collapsible>
          </Step>

          <Step n={5} title="Review & generate dossier">
            {!ready && <Note level="bad">Not ready: {!s.projectName.trim() ? 'add project name. ' : ''}{totalEru <= 0 ? 'portfolio ERU is zero. ' : ''}{!addnOk ? 'additionality < 3/4.' : ''}</Note>}
            {ready && <Note level="ok">All checks passed. Click the button to generate the printable registration dossier.</Note>}
          </Step>
        </>
      }
      rail={
        <OutputRail
          label="LIVE CCTS RESULT"
          stats={[
            { label: 'Annual ERU', value: totalEru.toFixed(0), sub: 'tCO₂e / yr', color: T.gold },
            { label: 'Portfolio MW', value: totalMw.toFixed(0), sub: `${s.assets.length} sites` },
            { label: 'Revenue/yr', value: `₹${(revenueYr / 1e7).toFixed(2)}Cr`, sub: s.priceTier, color: T.green },
            { label: `NPV ${s.crediting}y`, value: `₹${(npv / 1e7).toFixed(2)}Cr`, sub: `@ ${s.discount}%`, color: T.green },
          ]}
          preview={
            <div>
              <div><b style={{ color: T.text }}>{s.projectName}</b></div>
              <div style={{ marginTop: 4 }}>Additionality <b style={{ color: addnOk ? T.green : T.red }}>{addnPass}/4</b> · {addnOk ? 'eligible' : 'not eligible'}</div>
              <div>Methodologies: {Array.from(new Set(s.assets.map(a => a.method))).length}</div>
              {s.assets.length > 0 && <div>Vintages: {Math.min(...s.assets.map(a => a.vintage))}–{Math.max(...s.assets.map(a => a.vintage))}</div>}
            </div>
          }
          cta={<PrimaryCTA onClick={onDeliver}>Generate CCTS Dossier →</PrimaryCTA>}
          menu={
            <ToolMenu
              scenario={sc}
              onExportCsv={() => downloadText('ccts-portfolio.csv', toCsv(rows), 'text/csv')}
              onExportJson={() => downloadText('ccts-scenario.json', JSON.stringify(s, null, 2), 'application/json')}
              onImportCsv={(r) => sc.update({ assets: r.map((x, i) => ({ _id: Date.now() + i, site: x.site || 'Imported', method: x.method || 'Solar PV (utility)', mw: +x.mw || 0, mwh: +x.mwh || 0, baselineEF: +x.baselineEF || 0.78, projectEF: +x.projectEF || 0, vintage: +x.vintage || 2026 })) })}
              importLabel="Import portfolio CSV"
            />
          }
        />
      }
    />
  );
}
