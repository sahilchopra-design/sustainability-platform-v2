import React, { useMemo, useState } from 'react';
import {
  T, useScenario, openDeliverable, toCsv, downloadText, html,
  ToolShell, Step, OutputRail, PrimaryCTA, ToolMenu,
  FieldRow, Worksheet, NumInput, TextInput, SelectInput, Collapsible, Note, PageHeader,
  Tornado, MonteCarloCard, Gantt, ProgressRing, Sparkline
} from '../../_shared/AdvisoryToolkit';
import {
  CEA_GRID_EF, BEE_METHODS, STATE_PV_PENETRATION, CCC_PRICE_HISTORY,
  STACKING, BUFFER_POOL, VINTAGE_CURVE, REGISTRY_CYCLE, METHOD_COMPLIANCE_WEIGHTS,
  monteCarlo, tornado
} from '../../_shared/AdvisoryReference';

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
  stacking: { 'PAT ESCerts': false, 'I-REC': true, 'Voluntary VCS': false, 'Gold Standard': false, 'Article 6.2 ITMO': false },
  compliance: { baselineRule: 85, conservatism: 90, mrvQuality: 75, additionality: 80, permanence: 70, leakage: 75, stakeholder: 65 },
  mcRuns: 2000,
};

export default function CctsOffsetRegistrationPage() {
  const sc = useScenario('ccts-offset', DEFAULTS);
  const s = sc.state;
  const [mcTrigger, setMcTrigger] = useState(0);

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

  // Buffer pool — weighted by method shares
  const bufferPct = useMemo(() => {
    if (!rows.length || !totalEru) return 0.03;
    return rows.reduce((x, r) => x + (BUFFER_POOL[r.method] ?? 0.05) * (r.eru / totalEru), 0);
  }, [rows, totalEru]);
  const bufferEru = totalEru * bufferPct;
  const netEru = totalEru - bufferEru;

  // Vintage-weighted price (older vintages discounted)
  const vintageMix = useMemo(() => {
    const cy = new Date().getFullYear();
    if (!rows.length) return 1;
    return rows.reduce((x, r) => {
      const age = Math.max(0, cy - r.vintage);
      const mult = age === 0 ? VINTAGE_CURVE.currentYearPremium
        : age === 1 ? VINTAGE_CURVE.oneYearOld
        : age === 2 ? VINTAGE_CURVE.twoYearOld
        : age === 3 ? VINTAGE_CURVE.threeYearOld
        : VINTAGE_CURVE.fiveYearPlus;
      return x + mult * (r.eru / totalEru);
    }, 0);
  }, [rows, totalEru]);
  const vintageAdjPrice = price * vintageMix;

  // Common-practice additionality
  const commonPractice = useMemo(() => s.assets.every(a => {
    const thr = BEE_METHODS[a.method]?.penetrationThreshold ?? 20;
    const pen = STATE_PV_PENETRATION[a.state] ?? 10;
    return pen < thr;
  }), [s.assets]);
  const addnEff = { ...s.addn, common: commonPractice };
  const addnPass = Object.values(addnEff).filter(Boolean).length;
  const addnOk = addnPass >= 3;
  const ready = addnOk && totalEru > 0 && s.projectName.trim();

  const priceBand = useMemo(() => {
    const mids = CCC_PRICE_HISTORY.map(p => p.mid);
    const lows = CCC_PRICE_HISTORY.map(p => p.low);
    const highs = CCC_PRICE_HISTORY.map(p => p.high);
    const avg = (arr) => arr.reduce((x, y) => x + y, 0) / arr.length;
    return { p05: avg(lows), p50: avg(mids), p95: avg(highs) };
  }, []);

  // Monte Carlo NPV — triangular over price × ERU yield × discount
  const mc = useMemo(() => {
    if (totalEru <= 0) return null;
    return monteCarlo(({ pr, yld, dr }) => {
      const discF = dr > 0 ? (1 - Math.pow(1 + dr, -s.crediting)) / dr : s.crediting;
      return (totalEru * netEru / totalEru) * yld * pr * discF / 1e7;
    }, {
      pr: { min: priceBand.p05, mode: priceBand.p50, max: priceBand.p95 },
      yld: { min: 0.88, mode: 1.0, max: 1.08 },
      dr: { min: 0.06, mode: s.discount / 100, max: 0.12 },
    }, s.mcRuns);
  }, [totalEru, netEru, priceBand, s.crediting, s.discount, s.mcRuns, mcTrigger]);

  // Tornado — sensitivity of NPV (Cr) to ±20% in drivers
  const torn = useMemo(() => {
    if (totalEru <= 0) return [];
    const base = { price, eru: totalEru, buffer: 1 - bufferPct, crediting: s.crediting, discount: s.discount / 100 };
    return tornado(base, (v) => {
      const d = v.discount > 0 ? (1 - Math.pow(1 + v.discount, -v.crediting)) / v.discount : v.crediting;
      return (v.eru * v.buffer * v.price * d) / 1e7;
    }, 0.2).map(r => ({ label: r.driver, low: r.low, high: r.high }));
  }, [price, totalEru, bufferPct, s.crediting, s.discount]);

  // Stacking revenue table (assumes 1:1 tCO2e basis)
  const stackRows = useMemo(() => Object.entries(STACKING).map(([k, v]) => {
    const active = s.stacking[k];
    const uplift = active ? v.mid * netEru * v.convertFactor / 1e7 : 0;
    return { instrument: k, unit: v.unit, low: v.low, mid: v.mid, high: v.high, active, upliftCr: uplift };
  }), [s.stacking, netEru]);
  const stackTotalCr = stackRows.reduce((x, r) => x + r.upliftCr, 0);

  // Methodology compliance scorecard
  const complianceScore = useMemo(() => {
    const W = METHOD_COMPLIANCE_WEIGHTS;
    const weighted = Object.keys(W).reduce((x, k) => x + (s.compliance[k] || 0) * W[k] / 100, 0);
    const total = Object.values(W).reduce((x, y) => x + y, 0);
    return Math.min(100, weighted * (100 / total));
  }, [s.compliance]);

  // Registry Gantt
  const ganttTasks = useMemo(() => {
    let cum = 0;
    const colors = [T.teal, T.gold, T.sage, T.textSec, T.amber, T.green];
    return REGISTRY_CYCLE.map((p, i) => {
      const t = { label: p.phase, start: cum, duration: p.months, color: colors[i % colors.length] };
      cum += p.months;
      return t;
    });
  }, []);
  const totalMonths = REGISTRY_CYCLE.reduce((x, p) => x + p.months, 0);

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
      html.p(`Portfolio of ${s.assets.length} project activities totalling ${totalMw.toFixed(1)} MW, generating <b>${totalEru.toFixed(0)} gross CCC/year</b> under BEE-approved methodologies. Net issuance after <b>${(bufferPct * 100).toFixed(1)}%</b> buffer pool: <b>${netEru.toFixed(0)} CCC/year</b>.`),
      html.p(`Indicative NPV at ${s.priceTier}: <b>₹${(npv / 1e7).toFixed(2)} Cr</b> (${s.crediting}yr, ${s.discount}%). Stacked revenue uplift (active instruments): <b>₹${stackTotalCr.toFixed(2)} Cr/yr</b>.`),
      mc ? html.p(`<b>Monte Carlo NPV (${s.mcRuns.toLocaleString()} runs):</b> P5 ₹${mc.p05.toFixed(2)} Cr · P50 ₹${mc.p50.toFixed(2)} Cr · P95 ₹${mc.p95.toFixed(2)} Cr · Mean ₹${mc.mean.toFixed(2)} Cr.`) : '',
      html.h2('2. Project Portfolio'),
      html.table(['Site', 'Method', 'MW', 'MWh/yr', 'Baseline EF', 'Project EF', 'Buffer%', 'ERU/yr (tCO₂e)'],
        rows.map(r => [r.site, r.method, r.mw, r.mwh.toLocaleString(), r.baselineEF.toFixed(3), r.projectEF.toFixed(3), ((BUFFER_POOL[r.method] ?? 0.05) * 100).toFixed(1), r.eru.toFixed(0)])),
      html.h2('3. Additionality Assessment (4-prong)'),
      html.p(`<b>${addnPass}/4 tests passed</b> — ${addnOk ? html.badge('green', 'ELIGIBLE') : html.badge('red', 'NOT ELIGIBLE')}`),
      html.table(['Test', 'Status'], [
        ['Investment barrier', s.addn.invest ? '✓ Pass' : '✗ Fail'],
        ['Technology barrier', s.addn.tech ? '✓ Pass' : '✗ Fail'],
        ['Common practice', addnEff.common ? '✓ Pass' : '✗ Fail'],
        ['Regulatory barrier', s.addn.regBarrier ? '✓ Pass' : '✗ Fail'],
      ]),
      html.h2('4. Methodology Compliance Scorecard'),
      html.p(`Overall score: <b>${complianceScore.toFixed(1)}/100</b> · ${complianceScore >= 75 ? html.badge('green', 'READY') : complianceScore >= 60 ? html.badge('amber', 'REMEDIATE') : html.badge('red', 'NOT READY')}`),
      html.table(['Criterion', 'Weight %', 'Score /100'],
        Object.entries(METHOD_COMPLIANCE_WEIGHTS).map(([k, w]) => [k, w, s.compliance[k] || 0])),
      html.h2('5. Price NPV Scenarios'),
      html.table(['Tier', '₹/t', 'Rev/yr (₹ Cr)', `NPV ${s.crediting}y (₹ Cr)`, `Vintage-adj NPV`],
        Object.entries(CCC_TIERS).map(([n, p]) => [n, p, ((netEru * p) / 1e7).toFixed(2), ((netEru * p * disc) / 1e7).toFixed(2), ((netEru * p * vintageMix * disc) / 1e7).toFixed(2)])),
      html.h2('6. Stacking Opportunities'),
      html.table(['Instrument', 'Active', 'Price (mid)', 'Revenue uplift (₹ Cr/yr)'],
        stackRows.map(r => [r.instrument, r.active ? '✓' : '—', `${r.low}-${r.mid}-${r.high}`, r.upliftCr.toFixed(2)])),
      html.h2('7. Registration Cycle'),
      html.table(['Phase', 'Duration (months)'], REGISTRY_CYCLE.map(p => [p.phase, p.months])),
      html.p(`Total time to first issuance: <b>${totalMonths} months</b>.`),
      html.h2('8. Recommendation'),
      html.p(ready ? html.badge('green', 'PROCEED') + ' — advance to PDD preparation.' : html.badge('red', 'HOLD') + ' — resolve gaps.'),
    ].join('');
    openDeliverable(body, `CCTS Dossier — ${s.projectName}`);
  };

  return (
    <ToolShell
      header={<PageHeader code="EP-EB2 · CCTS" title="Offset Registration Tool" subtitle="Size ERUs, test additionality, model buffer pool + stacking, run Monte Carlo NPV — produces a filing-ready CCTS registration dossier." />}
      steps={
        <>
          <Step n={1} title="Project scope" hint="Identify the host entity and crediting horizon.">
            <FieldRow label="Project name"><TextInput value={s.projectName} onChange={upd('projectName')} style={{ width: 360 }} /></FieldRow>
            <FieldRow label="Host entity"><TextInput value={s.hostEntity} onChange={upd('hostEntity')} style={{ width: 360 }} /></FieldRow>
            <FieldRow label="Crediting period" hint="Typical 7–10 years, renewable once."><NumInput value={s.crediting} onChange={upd('crediting')} min={1} max={21} suffix="years" /></FieldRow>
            <FieldRow label="Discount rate"><NumInput value={s.discount} onChange={upd('discount')} step={0.5} min={0} max={25} suffix="%" /></FieldRow>
          </Step>

          <Step n={2} title="Project activities & ERU calculation" hint="Pick state → baseline EF auto-fills from CEA. Method selects BEE conservatism factor.">
            <Worksheet
              cols={[
                { h: 'Site', width: '1.2fr', edit: (r, i) => <TextInput value={r.site} onChange={v => updAsset(i, 'site', v)} style={{ width: '100%' }} /> },
                { h: 'State', width: '70px', edit: (r, i) => <SelectInput value={r.state} onChange={v => updAsset(i, 'state', v)} options={STATES} style={{ width: '100%' }} /> },
                { h: 'Method', width: '1.2fr', edit: (r, i) => <SelectInput value={r.method} onChange={v => updAsset(i, 'method', v)} options={METHODS} style={{ width: '100%' }} /> },
                { h: 'MW', width: '55px', edit: (r, i) => <NumInput value={r.mw} onChange={v => updAsset(i, 'mw', v)} style={{ width: 44 }} /> },
                { h: 'MWh/yr', width: '90px', edit: (r, i) => <NumInput value={r.mwh} onChange={v => updAsset(i, 'mwh', v)} step={100} style={{ width: 74 }} /> },
                { h: 'Base EF', width: '75px', edit: (r, i) => <NumInput value={r.baselineEF} onChange={v => updAsset(i, 'baselineEF', v)} step={0.01} style={{ width: 58 }} /> },
                { h: 'Proj EF', width: '75px', edit: (r, i) => <NumInput value={r.projectEF} onChange={v => updAsset(i, 'projectEF', v)} step={0.01} style={{ width: 58 }} /> },
                { h: 'Vintage', width: '70px', edit: (r, i) => <NumInput value={r.vintage} onChange={v => updAsset(i, 'vintage', v)} style={{ width: 58 }} /> },
                { h: 'ERU/yr', width: '80px', edit: (r) => {
                    const c = BEE_METHODS[r.method]?.conservatism ?? 1;
                    return <span style={{ fontFamily: T.mono, color: T.gold, fontSize: 12 }}>{Math.max(0, r.mwh * (r.baselineEF - r.projectEF) * c).toFixed(0)}</span>;
                  } },
              ]}
              rows={rows}
              onAdd={addAsset}
              onDel={delAsset}
            />
            <Note level="info">Baseline EFs: CEA v20.0 (FY2023-24). Conservatism factors: BEE CCTS catalog. Rooftop 0.95× vs Utility PV 1.00×.</Note>
          </Step>

          <Step n={3} title="Additionality — 4-prong test" hint="Minimum 3 of 4 must pass. Common-practice auto-evaluated." done={addnOk}>
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
            {!addnOk && <Note level="warn">Only {addnPass}/4 passing. Strengthen additionality narrative.</Note>}
          </Step>

          <Step n={4} title="Buffer pool & vintage pricing" hint="Non-permanence reserve and age-discounted credit pricing.">
            <FieldRow label="Weighted buffer %" hint="ERU-weighted avg across methodology reversal risks">
              <span style={{ fontFamily: T.mono, color: T.amber, fontSize: 13 }}>{(bufferPct * 100).toFixed(2)}%</span>
              <span style={{ fontSize: 11, color: T.textMut, marginLeft: 8 }}>→ {bufferEru.toFixed(0)} tCO₂e/yr retained · {netEru.toFixed(0)} issuable</span>
            </FieldRow>
            <FieldRow label="Vintage mix discount" hint="Older vintages trade at discount">
              <span style={{ fontFamily: T.mono, color: T.gold, fontSize: 13 }}>{(vintageMix * 100).toFixed(1)}% of current-vintage price</span>
              <span style={{ fontSize: 11, color: T.textMut, marginLeft: 8 }}>→ ₹{vintageAdjPrice.toFixed(0)}/t effective</span>
            </FieldRow>
            <Collapsible title="Per-site buffer allocation" defaultOpen={false}>
              <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse', fontFamily: T.mono }}>
                <thead><tr style={{ color: T.textMut }}><th style={{ padding: 4, textAlign: 'left' }}>Site</th><th>Method</th><th>Gross ERU</th><th>Buffer %</th><th>Net ERU</th></tr></thead>
                <tbody>{rows.map(r => {
                  const bp = BUFFER_POOL[r.method] ?? 0.05;
                  return <tr key={r._id} style={{ borderTop: `1px solid ${T.borderL}` }}>
                    <td style={{ padding: 4, fontFamily: T.font, color: T.textSec }}>{r.site}</td>
                    <td style={{ padding: 4, fontFamily: T.font, color: T.textSec }}>{r.method}</td>
                    <td style={{ padding: 4, textAlign: 'right' }}>{r.eru.toFixed(0)}</td>
                    <td style={{ padding: 4, textAlign: 'right', color: T.amber }}>{(bp * 100).toFixed(1)}%</td>
                    <td style={{ padding: 4, textAlign: 'right', color: T.green }}>{(r.eru * (1 - bp)).toFixed(0)}</td>
                  </tr>;
                })}</tbody>
              </table>
            </Collapsible>
          </Step>

          <Step n={5} title="Price scenarios & Monte Carlo NPV" hint="Stress NPV across price×yield×discount distributions.">
            <FieldRow label="Reference tier">
              <SelectInput value={s.priceTier} onChange={upd('priceTier')} options={Object.keys(CCC_TIERS)} />
            </FieldRow>
            <FieldRow label="MC simulations"><NumInput value={s.mcRuns} onChange={upd('mcRuns')} step={500} min={500} max={10000} /></FieldRow>
            <Note level="info">6-yr CCC price band (REC proxy): P05 ₹{priceBand.p05.toFixed(0)} · P50 ₹{priceBand.p50.toFixed(0)} · P95 ₹{priceBand.p95.toFixed(0)} /tCO₂e</Note>
            {mc && <MonteCarloCard title={`MC NPV (${s.mcRuns.toLocaleString()} runs, ₹ Cr)`} stats={mc} fmt={(n) => n.toFixed(2)} unit="triangular: price × yield × discount" />}
            <button onClick={() => setMcTrigger(t => t + 1)} style={{ marginTop: 8, background: T.surfaceH, color: T.gold, border: `1px solid ${T.gold}`, padding: '5px 12px', fontSize: 11, cursor: 'pointer', borderRadius: 3 }}>↻ Re-sample</button>
            <Collapsible title="Tornado — NPV sensitivity (±20% per driver, ₹ Cr)" defaultOpen>
              <div style={{ paddingTop: 8 }}><Tornado rows={torn} fmt={(n) => n.toFixed(1)} /></div>
            </Collapsible>
          </Step>

          <Step n={6} title="Revenue stacking" hint="Parallel instruments that can be monetised alongside CCTS.">
            <Note level="info">Select instruments to stack. Gold Standard / Article 6.2 typically incompatible with CCTS — structural double-count check recommended.</Note>
            <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse', marginTop: 8 }}>
              <thead><tr style={{ color: T.textMut, textAlign: 'left' }}><th style={{ padding: 6 }}>Instrument</th><th>Unit</th><th style={{ textAlign: 'right' }}>Low</th><th style={{ textAlign: 'right' }}>Mid</th><th style={{ textAlign: 'right' }}>High</th><th>Stack</th><th style={{ textAlign: 'right' }}>Uplift ₹Cr/yr</th></tr></thead>
              <tbody>{stackRows.map(r => (
                <tr key={r.instrument} style={{ borderTop: `1px solid ${T.borderL}`, fontFamily: T.mono }}>
                  <td style={{ padding: 6, fontFamily: T.font, color: T.textSec }}>{r.instrument}</td>
                  <td style={{ padding: 6 }}>{r.unit}</td>
                  <td style={{ padding: 6, textAlign: 'right' }}>{r.low}</td>
                  <td style={{ padding: 6, textAlign: 'right', color: T.gold }}>{r.mid}</td>
                  <td style={{ padding: 6, textAlign: 'right' }}>{r.high}</td>
                  <td style={{ padding: 6 }}>
                    <input type="checkbox" checked={r.active} onChange={e => sc.update({ stacking: { ...s.stacking, [r.instrument]: e.target.checked } })} />
                  </td>
                  <td style={{ padding: 6, textAlign: 'right', color: r.active ? T.green : T.textMut }}>{r.upliftCr.toFixed(2)}</td>
                </tr>))}
                <tr style={{ borderTop: `2px solid ${T.border}`, fontFamily: T.mono, background: T.surfaceH }}>
                  <td colSpan={6} style={{ padding: 6, color: T.text, textAlign: 'right', fontFamily: T.font, fontWeight: 600 }}>Total stacked uplift</td>
                  <td style={{ padding: 6, textAlign: 'right', color: T.gold, fontWeight: 600 }}>₹{stackTotalCr.toFixed(2)} Cr/yr</td>
                </tr>
              </tbody>
            </table>
          </Step>

          <Step n={7} title="Methodology compliance scorecard" hint="Weighted score across 7 criteria — drives DoE validation success probability.">
            {Object.entries(METHOD_COMPLIANCE_WEIGHTS).map(([k, w]) => (
              <FieldRow key={k} label={`${k} (${w}%)`}>
                <input type="range" min={0} max={100} value={s.compliance[k] || 0}
                  onChange={e => sc.update({ compliance: { ...s.compliance, [k]: +e.target.value } })}
                  style={{ width: 220 }} />
                <span style={{ fontFamily: T.mono, fontSize: 12, color: (s.compliance[k] || 0) >= 75 ? T.green : (s.compliance[k] || 0) >= 60 ? T.amber : T.red, marginLeft: 10 }}>{s.compliance[k] || 0}/100</span>
              </FieldRow>
            ))}
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 16 }}>
              <ProgressRing pct={complianceScore} size={72} color={complianceScore >= 75 ? T.green : complianceScore >= 60 ? T.amber : T.red} label="Overall" />
              <div style={{ fontSize: 12, color: T.textSec, maxWidth: 420 }}>
                {complianceScore >= 75 ? 'DoE validation high confidence. Proceed to PDD submission.'
                  : complianceScore >= 60 ? 'Remediate low-scoring criteria before DoE engagement.'
                  : 'NOT READY — significant methodology gaps. Engage technical consultant.'}
              </div>
            </div>
          </Step>

          <Step n={8} title="Registration cycle timeline" hint="PDD → Validation → Registration → Monitoring → Verification → Issuance.">
            <Gantt tasks={ganttTasks} totalSpan={totalMonths} />
            <Note level="info">Total to first issuance: <b>{totalMonths} months</b>. Annual issuance thereafter contingent on verification cadence.</Note>
          </Step>

          <Step n={9} title="Review & generate dossier">
            {!ready && <Note level="bad">Not ready: {!s.projectName.trim() ? 'add project name. ' : ''}{totalEru <= 0 ? 'portfolio ERU is zero. ' : ''}{!addnOk ? 'additionality < 3/4.' : ''}</Note>}
            {ready && <Note level="ok">All checks passed. Click to generate the printable dossier with MC analytics, buffer math, stacking P&L, compliance scorecard and registration Gantt.</Note>}
          </Step>
        </>
      }
      rail={
        <OutputRail
          label="LIVE CCTS RESULT"
          stats={[
            { label: 'Gross ERU', value: totalEru.toFixed(0), sub: 'tCO₂e / yr', color: T.gold },
            { label: 'Net (post-buffer)', value: netEru.toFixed(0), sub: `${(bufferPct * 100).toFixed(1)}% reserve`, color: T.green },
            { label: `NPV ${s.crediting}y`, value: `₹${(npv / 1e7).toFixed(2)}Cr`, sub: s.priceTier, color: T.green },
            { label: 'MC P50 NPV', value: mc ? `₹${mc.p50.toFixed(1)}Cr` : '—', sub: mc ? `P5–P95: ${mc.p05.toFixed(1)}–${mc.p95.toFixed(1)}` : '—', color: T.gold },
          ]}
          preview={
            <div>
              <div><b style={{ color: T.text }}>{s.projectName}</b></div>
              <div style={{ marginTop: 4 }}>Additionality <b style={{ color: addnOk ? T.green : T.red }}>{addnPass}/4</b> · {addnOk ? 'eligible' : 'not eligible'}</div>
              <div>Compliance score <b style={{ color: complianceScore >= 75 ? T.green : complianceScore >= 60 ? T.amber : T.red }}>{complianceScore.toFixed(0)}/100</b></div>
              <div>Stacked uplift: ₹{stackTotalCr.toFixed(2)} Cr/yr</div>
              <div style={{ marginTop: 4 }}>Price trend: <Sparkline values={CCC_PRICE_HISTORY.map(p => p.mid)} /></div>
            </div>
          }
          cta={<PrimaryCTA onClick={onDeliver}>Generate CCTS Dossier →</PrimaryCTA>}
          menu={
            <ToolMenu
              scenario={sc}
              onExportCsv={() => downloadText('ccts-portfolio.csv', toCsv(rows), 'text/csv')}
              onExportJson={() => downloadText('ccts-scenario.json', JSON.stringify(s, null, 2), 'application/json')}
              onImportCsv={(r) => sc.update({ assets: r.map((x, i) => ({ _id: Date.now() + i, site: x.site || 'Imported', state: x.state || 'RJ', method: x.method || 'Solar PV (utility)', mw: +x.mw || 0, mwh: +x.mwh || 0, baselineEF: +x.baselineEF || 0.78, projectEF: +x.projectEF || 0, vintage: +x.vintage || 2026 })) })}
              importLabel="Import portfolio CSV"
            />
          }
        />
      }
    />
  );
}
