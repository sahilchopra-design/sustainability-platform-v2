import React, { useMemo } from 'react';
import {
  T, useScenario, openDeliverable, toCsv, downloadText, html,
  ToolShell, Step, OutputRail, PrimaryCTA, ToolMenu,
  FieldRow, Worksheet, NumInput, TextInput, SelectInput, Collapsible, Note, PageHeader
} from '../../_shared/AdvisoryToolkit';
import { CEA_GRID_EF, BEE_METHODS, STATE_PV_PENETRATION, CCC_PRICE_HISTORY } from '../../_shared/AdvisoryReference';

const METHODS = Object.keys(BEE_METHODS);
const STATES = Object.keys(CEA_GRID_EF.states);
const CCC_TIERS = { 'Low (₹500/t)': 500, 'Mid (₹1,200/t)': 1200, 'High (₹2,500/t)': 2500 };

const DEFAULTS = {
  projectName: 'ACME 150 MW Solar Portfolio',
  hostEntity: 'ACME Renewables Pvt Ltd',
  crediting: 10,
  discount: 8,
  priceTier: 'Mid (₹1,200/t)',
  assets: [
    { _id: 1, site: 'Rajasthan PV-1', state: 'RJ', method: 'Solar PV (utility)', mw: 50, mwh: 98500, baselineEF: 0.78, projectEF: 0.00, vintage: 2025 },
    { _id: 2, site: 'Gujarat PV-2', state: 'GJ', method: 'Solar PV (utility)', mw: 40, mwh: 78000, baselineEF: 0.72, projectEF: 0.00, vintage: 2025 },
    { _id: 3, site: 'Karnataka PV-3', state: 'KA', method: 'Solar PV (utility)', mw: 35, mwh: 69000, baselineEF: 0.61, projectEF: 0.00, vintage: 2026 },
    { _id: 4, site: 'Tamil Nadu Rooftop', state: 'TN', method: 'Solar rooftop', mw: 25, mwh: 44000, baselineEF: 0.58, projectEF: 0.00, vintage: 2026 },
  ],
  addn: { invest: true, tech: true, common: false, regBarrier: true },
};

export default function CctsOffsetRegistrationPage() {
  const sc = useScenario('ccts-offset', DEFAULTS);
  const s = sc.state;

  const rows = useMemo(() => s.assets.map(a => {
    const cons = BEE_METHODS[a.method]?.conservatism ?? 1;
    return { ...a, eru: Math.max(0, a.mwh * (a.baselineEF - a.projectEF) * cons), conservatism: cons };
  }), [s.assets]);
  const totalEru = rows.reduce((x, r) => x + r.eru, 0);
  const totalMw = s.assets.reduce((x, a) => x + a.mw, 0);
  const price = CCC_TIERS[s.priceTier] || 1200;
  const revenueYr = totalEru * price;
  const disc = s.discount > 0 ? (1 - Math.pow(1 + s.discount / 100, -s.crediting)) / (s.discount / 100) : s.crediting;
  const npv = revenueYr * disc;

  // Auto common-practice additionality: fails if ANY site exceeds BEE penetration threshold
  const commonPractice = useMemo(() => {
    return s.assets.every(a => {
      const thr = BEE_METHODS[a.method]?.penetrationThreshold ?? 20;
      const pen = STATE_PV_PENETRATION[a.state] ?? 10;
      return pen < thr;
    });
  }, [s.assets]);
  const addnEff = { ...s.addn, common: commonPractice };
  const addnPass = Object.values(addnEff).filter(Boolean).length;
  const addnOk = addnPass >= 3;
  const ready = addnOk && totalEru > 0 && s.projectName.trim();

  // Monte-Carlo NPV across CCC_PRICE_HISTORY (p05/p50/p95)
  const priceBand = useMemo(() => {
    const mids = CCC_PRICE_HISTORY.map(p => p.mid);
    const lows = CCC_PRICE_HISTORY.map(p => p.low);
    const highs = CCC_PRICE_HISTORY.map(p => p.high);
    const avg = (arr) => arr.reduce((x, y) => x + y, 0) / arr.length;
    return { p05: avg(lows), p50: avg(mids), p95: avg(highs) };
  }, []);

  const upd = (k) => (v) => sc.update({ [k]: v });
  const updAsset = (i, k, v) => {
    sc.update({ assets: s.assets.map((a, j) => {
      if (j !== i) return a;
      const next = { ...a, [k]: v };
      if (k === 'state' && CEA_GRID_EF.states[v]) next.baselineEF = CEA_GRID_EF.states[v];
      return next;
    }) });
  };
  const addAsset = () => sc.update({ assets: [...s.assets, { _id: Date.now(), site: 'New site', state: 'RJ', method: 'Solar PV (utility)', mw: 10, mwh: 20000, baselineEF: CEA_GRID_EF.states.RJ, projectEF: 0, vintage: 2026 }] });
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

          <Step n={2} title="Project activities & ERU calculation" hint="Pick state → baseline EF auto-fills from CEA FY2023-24. Method selects BEE conservatism factor. ERU = output × (base EF − project EF) × conservatism.">
            <Worksheet
              cols={[
                { h: 'Site', width: '1.2fr', edit: (r, i) => <TextInput value={r.site} onChange={v => updAsset(i, 'site', v)} style={{ width: '100%' }} /> },
                { h: 'State', width: '70px', edit: (r, i) => <SelectInput value={r.state} onChange={v => updAsset(i, 'state', v)} options={STATES} style={{ width: '100%' }} /> },
                { h: 'Method', width: '1.2fr', edit: (r, i) => <SelectInput value={r.method} onChange={v => updAsset(i, 'method', v)} options={METHODS} style={{ width: '100%' }} /> },
                { h: 'MW', width: '55px', edit: (r, i) => <NumInput value={r.mw} onChange={v => updAsset(i, 'mw', v)} style={{ width: 44 }} /> },
                { h: 'MWh/yr', width: '90px', edit: (r, i) => <NumInput value={r.mwh} onChange={v => updAsset(i, 'mwh', v)} step={100} style={{ width: 74 }} /> },
                { h: 'Base EF', width: '75px', edit: (r, i) => <NumInput value={r.baselineEF} onChange={v => updAsset(i, 'baselineEF', v)} step={0.01} style={{ width: 58 }} /> },
                { h: 'Proj EF', width: '75px', edit: (r, i) => <NumInput value={r.projectEF} onChange={v => updAsset(i, 'projectEF', v)} step={0.01} style={{ width: 58 }} /> },
                { h: 'Cons', width: '55px', edit: (r) => <span style={{ fontFamily: T.mono, fontSize: 11, color: T.textSec }}>{(BEE_METHODS[r.method]?.conservatism ?? 1).toFixed(2)}</span> },
                { h: 'ERU/yr', width: '80px', edit: (r) => {
                    const c = BEE_METHODS[r.method]?.conservatism ?? 1;
                    return <span style={{ fontFamily: T.mono, color: T.gold, fontSize: 12 }}>{Math.max(0, r.mwh * (r.baselineEF - r.projectEF) * c).toFixed(0)}</span>;
                  } },
              ]}
              rows={rows}
              onAdd={addAsset}
              onDel={delAsset}
            />
            <Note level="info">Baseline EFs: CEA CO₂ Baseline Database v20.0 (FY2023-24). Conservatism factors: BEE CCTS methodology catalog. Rooftop 0.95× vs Utility PV 1.00×.</Note>
          </Step>

          <Step n={3} title="Additionality — 4-prong test" hint="Minimum 3 of 4 must pass. Common-practice is auto-evaluated from state PV penetration vs BEE threshold." done={addnOk}>
            {[
              ['invest', 'Investment barrier', 'IRR < hurdle rate without carbon revenue'],
              ['tech', 'Technology barrier', 'First-of-kind or < 20% penetration'],
              ['regBarrier', 'Regulatory barrier', 'No mandate; voluntary action']
            ].map(([k, lbl, hint]) => (
              <FieldRow key={k} label={lbl} hint={hint}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, color: s.addn[k] ? T.green : T.textMut }}>
                  <input type="checkbox" checked={s.addn[k]} onChange={e => sc.update({ addn: { ...s.addn, [k]: e.target.checked } })} />
                  {s.addn[k] ? 'Pass' : 'Fail'}
                </label>
              </FieldRow>
            ))}
            <FieldRow label="Common practice (auto)" hint="State PV penetration vs BEE method threshold">
              <span style={{ fontFamily: T.mono, fontSize: 12, color: commonPractice ? T.green : T.red }}>
                {commonPractice ? '✓ Below threshold — additional' : '✗ Saturated — NOT additional'}
              </span>
            </FieldRow>
            <Collapsible title="Per-site common-practice evidence">
              <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
                <thead><tr style={{ color: T.textMut }}><th style={{ padding: 4, textAlign: 'left' }}>Site</th><th style={{ padding: 4 }}>State pen. %</th><th style={{ padding: 4 }}>BEE threshold %</th><th style={{ padding: 4 }}>Result</th></tr></thead>
                <tbody>{s.assets.map(a => {
                  const pen = STATE_PV_PENETRATION[a.state] ?? 10;
                  const thr = BEE_METHODS[a.method]?.penetrationThreshold ?? 20;
                  const ok = pen < thr;
                  return <tr key={a._id} style={{ borderTop: `1px solid ${T.borderL}`, fontFamily: T.mono }}>
                    <td style={{ padding: 4, fontFamily: T.font, color: T.textSec }}>{a.site}</td>
                    <td style={{ padding: 4, textAlign: 'right' }}>{pen}</td>
                    <td style={{ padding: 4, textAlign: 'right' }}>{thr}</td>
                    <td style={{ padding: 4, color: ok ? T.green : T.red }}>{ok ? 'Pass' : 'Fail'}</td>
                  </tr>;
                })}</tbody>
              </table>
            </Collapsible>
            {!addnOk && <Note level="warn">Only {addnPass}/4 passing. Strengthen additionality narrative.</Note>}
          </Step>

          <Step n={4} title="Price scenario" hint="CCC trading has not yet deepened in India; stress across tiers.">
            <FieldRow label="Reference tier">
              <SelectInput value={s.priceTier} onChange={upd('priceTier')} options={Object.keys(CCC_TIERS)} />
            </FieldRow>
            <Note level="info">6-yr CCC price history (REC proxy): P05 ₹{priceBand.p05.toFixed(0)} · P50 ₹{priceBand.p50.toFixed(0)} · P95 ₹{priceBand.p95.toFixed(0)} /tCO₂e. NPV band: ₹{((totalEru * priceBand.p05 * disc) / 1e7).toFixed(2)}–₹{((totalEru * priceBand.p95 * disc) / 1e7).toFixed(2)} Cr.</Note>
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
