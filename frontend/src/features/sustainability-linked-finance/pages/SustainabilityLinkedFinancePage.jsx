import React, { useMemo } from 'react';
import {
  T, useScenario, openDeliverable, toCsv, downloadText, html,
  ToolShell, Step, OutputRail, PrimaryCTA, ToolMenu,
  FieldRow, Worksheet, NumInput, TextInput, SelectInput, Collapsible, Note, PageHeader
} from '../../_shared/AdvisoryToolkit';

const INSTRUMENTS = ['Green Bond', 'Sustainability-Linked Bond', 'Sustainability-Linked Loan', 'Transition Bond', 'Blue Bond'];

const DEFAULTS = {
  issuer: 'ACME Group',
  instrument: 'Sustainability-Linked Bond',
  notional: 5000,      // ₹ Cr
  tenor: 7,
  coupon: 7.50,
  greeniumBps: 5,
  stepUpBps: 25,
  kpis: [
    { _id: 1, name: 'Scope 1+2 emissions intensity', baseline: 620, spt: 310, unit: 'kgCO₂e/MWh', year: 2030, weight: 40, achieved: 465 },
    { _id: 2, name: 'Renewable electricity share', baseline: 12, spt: 65, unit: '%', year: 2030, weight: 35, achieved: 28 },
    { _id: 3, name: 'Water withdrawal reduction', baseline: 100, spt: 70, unit: 'Index (100=base)', year: 2030, weight: 25, achieved: 88 },
  ],
};

const progressPct = (k) => {
  const span = k.spt - k.baseline;
  if (span === 0) return 100;
  const moved = k.achieved - k.baseline;
  return Math.max(0, Math.min(100, (moved / span) * 100));
};

export default function SustainabilityLinkedFinancePage() {
  const sc = useScenario('slf', DEFAULTS);
  const s = sc.state;

  const weighted = useMemo(() => {
    const totW = s.kpis.reduce((x, k) => x + k.weight, 0) || 1;
    return s.kpis.reduce((x, k) => x + progressPct(k) * k.weight, 0) / totW;
  }, [s.kpis]);

  const onTrack = weighted >= 70;
  const annualIntBase = (s.notional * s.coupon) / 100;
  const greenium = (s.notional * s.greeniumBps / 10000) * s.tenor;    // lifetime bps saving
  const stepUpPenalty = onTrack ? 0 : (s.notional * s.stepUpBps / 10000) * Math.max(0, s.tenor - 2);
  const netBenefit = greenium - stepUpPenalty;
  const ready = s.kpis.length >= 1 && s.issuer.trim();

  const upd = (k) => (v) => sc.update({ [k]: v });
  const updKpi = (i, k, v) => sc.update({ kpis: s.kpis.map((x, j) => j === i ? { ...x, [k]: v } : x) });

  const onDeliver = () => {
    const body = [
      html.h1(`${s.instrument} Framework — ${s.issuer}`),
      html.meta({ Notional: `₹${s.notional.toLocaleString()} Cr`, Tenor: `${s.tenor}y`, Coupon: `${s.coupon}%`, Generated: new Date().toLocaleDateString() }),
      html.h2('1. Rationale'),
      html.p(`${s.issuer} is issuing a ${s.tenor}-year ${s.instrument} of ₹${s.notional.toLocaleString()} Cr to link financing cost to measurable sustainability outcomes, aligning incentives with transition strategy.`),
      html.h2('2. Key Performance Indicators'),
      html.table(['KPI', 'Baseline', 'SPT ' + (s.kpis[0]?.year || ''), 'Current', 'Weight %', 'Progress %'],
        s.kpis.map(k => [k.name, `${k.baseline} ${k.unit}`, `${k.spt} ${k.unit}`, `${k.achieved} ${k.unit}`, k.weight, progressPct(k).toFixed(0) + '%'])),
      html.h2('3. Sustainability Performance Targets'),
      html.p(`Weighted progress: <b>${weighted.toFixed(1)}%</b> — ${onTrack ? html.badge('green', 'ON TRACK') : html.badge('amber', 'MISS RISK')}`),
      html.h2('4. Bond Characteristics'),
      html.p(`Coupon: ${s.coupon}% p.a. · Greenium: ${s.greeniumBps} bps · Step-up on SPT miss: ${s.stepUpBps} bps (activates from year 3).`),
      html.h2('5. Reporting & Verification'),
      html.p('Annual KPI reporting with independent limited assurance. Post-issuance external review (SPO) recommended from ICMA-accredited provider.'),
      html.h2('6. Framework Alignment'),
      html.p('Aligned with ICMA Sustainability-Linked Bond Principles 2024 (5 components). SFDR Article 8/9 eligibility subject to fund-level disclosure.'),
      html.h2('7. Cost Economics'),
      html.p(`Base interest: ₹${annualIntBase.toFixed(1)} Cr/yr · Lifetime greenium benefit: <b style="color:#155724">₹${greenium.toFixed(1)} Cr</b> · Potential step-up penalty: <b style="color:#721c24">₹${stepUpPenalty.toFixed(1)} Cr</b> · Net financing benefit: <b>₹${netBenefit.toFixed(1)} Cr</b>`),
    ].join('');
    openDeliverable(body, `${s.instrument} Framework — ${s.issuer}`);
  };

  return (
    <ToolShell
      header={<PageHeader code="EP-EB3 · SLF" title="Sustainability-Linked Finance Tool" subtitle="Structure SLB / SLL framework, model greenium economics, produce issuance-ready framework document." />}
      steps={
        <>
          <Step n={1} title="Issuer & instrument">
            <FieldRow label="Issuer"><TextInput value={s.issuer} onChange={upd('issuer')} style={{ width: 320 }} /></FieldRow>
            <FieldRow label="Instrument"><SelectInput value={s.instrument} onChange={upd('instrument')} options={INSTRUMENTS} /></FieldRow>
            <FieldRow label="Notional"><NumInput value={s.notional} onChange={upd('notional')} step={100} suffix="₹ Cr" /></FieldRow>
            <FieldRow label="Tenor"><NumInput value={s.tenor} onChange={upd('tenor')} suffix="years" /></FieldRow>
            <FieldRow label="Coupon"><NumInput value={s.coupon} onChange={upd('coupon')} step={0.1} suffix="%" /></FieldRow>
          </Step>

          <Step n={2} title="KPI library" hint="Define 2–5 KPIs, each with a baseline, SPT, and current achievement. Weights must sum to 100.">
            <Worksheet
              cols={[
                { h: 'KPI', width: '2fr', edit: (r, i) => <TextInput value={r.name} onChange={v => updKpi(i, 'name', v)} style={{ width: '100%' }} /> },
                { h: 'Unit', width: '1fr', edit: (r, i) => <TextInput value={r.unit} onChange={v => updKpi(i, 'unit', v)} style={{ width: '100%' }} /> },
                { h: 'Baseline', width: '80px', edit: (r, i) => <NumInput value={r.baseline} onChange={v => updKpi(i, 'baseline', v)} style={{ width: 64 }} /> },
                { h: 'SPT', width: '80px', edit: (r, i) => <NumInput value={r.spt} onChange={v => updKpi(i, 'spt', v)} style={{ width: 64 }} /> },
                { h: 'Current', width: '80px', edit: (r, i) => <NumInput value={r.achieved} onChange={v => updKpi(i, 'achieved', v)} style={{ width: 64 }} /> },
                { h: 'Year', width: '70px', edit: (r, i) => <NumInput value={r.year} onChange={v => updKpi(i, 'year', v)} style={{ width: 56 }} /> },
                { h: 'Wt %', width: '60px', edit: (r, i) => <NumInput value={r.weight} onChange={v => updKpi(i, 'weight', v)} style={{ width: 46 }} /> },
                { h: 'Progress', width: '80px', edit: (r) => {
                    const p = progressPct(r);
                    return <span style={{ fontFamily: T.mono, fontSize: 12, color: p >= 70 ? T.green : p >= 40 ? T.amber : T.red }}>{p.toFixed(0)}%</span>;
                  } },
              ]}
              rows={s.kpis}
              onAdd={() => sc.update({ kpis: [...s.kpis, { _id: Date.now(), name: 'New KPI', baseline: 100, spt: 50, unit: 'unit', year: 2030, weight: 20, achieved: 100 }] })}
              onDel={(i) => sc.update({ kpis: s.kpis.filter((_, j) => j !== i) })}
            />
            {(s.kpis.reduce((x, k) => x + k.weight, 0) !== 100) && <Note level="warn">Weights sum to {s.kpis.reduce((x, k) => x + k.weight, 0)}% — should total 100%.</Note>}
          </Step>

          <Step n={3} title="Coupon mechanics">
            <FieldRow label="Greenium (pricing benefit)" hint="Typical 2–10 bps below comparable vanilla"><NumInput value={s.greeniumBps} onChange={upd('greeniumBps')} suffix="bps" /></FieldRow>
            <FieldRow label="Step-up on SPT miss" hint="ICMA SLB typical: 25 bps from year 3"><NumInput value={s.stepUpBps} onChange={upd('stepUpBps')} suffix="bps" /></FieldRow>
            <Collapsible title="Cashflow summary">
              <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.7, fontFamily: T.mono }}>
                Base annual interest: ₹{annualIntBase.toFixed(1)} Cr<br />
                Lifetime greenium benefit: <span style={{ color: T.green }}>₹{greenium.toFixed(1)} Cr</span><br />
                Step-up penalty (if miss): <span style={{ color: T.red }}>₹{stepUpPenalty.toFixed(1)} Cr</span><br />
                <b style={{ color: T.gold }}>Net financing benefit: ₹{netBenefit.toFixed(1)} Cr</b>
              </div>
            </Collapsible>
          </Step>

          <Step n={4} title="Generate framework">
            {!ready && <Note level="bad">Add issuer name and at least one KPI.</Note>}
            {ready && <Note level="ok">Ready. Deliverable is ICMA-SLBP 2024 aligned and suitable for SPO provider review.</Note>}
          </Step>
        </>
      }
      rail={
        <OutputRail
          label="LIVE SLF ECONOMICS"
          stats={[
            { label: 'Weighted progress', value: `${weighted.toFixed(0)}%`, sub: onTrack ? 'on track' : 'miss risk', color: onTrack ? T.green : T.amber },
            { label: 'KPIs', value: s.kpis.length, sub: `weights ${s.kpis.reduce((x, k) => x + k.weight, 0)}%` },
            { label: 'Greenium', value: `₹${greenium.toFixed(1)}Cr`, sub: 'lifetime benefit', color: T.green },
            { label: 'Net benefit', value: `₹${netBenefit.toFixed(1)}Cr`, sub: `step-up ${stepUpPenalty.toFixed(1)}`, color: netBenefit > 0 ? T.green : T.red },
          ]}
          preview={
            <div>
              <div><b style={{ color: T.text }}>{s.issuer}</b> · {s.instrument}</div>
              <div style={{ marginTop: 4 }}>₹{s.notional.toLocaleString()} Cr · {s.tenor}y · {s.coupon}%</div>
              <div>SPT horizon: {Math.max(...s.kpis.map(k => k.year))}</div>
            </div>
          }
          cta={<PrimaryCTA onClick={onDeliver}>Generate SLF Framework →</PrimaryCTA>}
          menu={
            <ToolMenu
              scenario={sc}
              onExportCsv={() => downloadText('slf-kpis.csv', toCsv(s.kpis), 'text/csv')}
              onExportJson={() => downloadText('slf-scenario.json', JSON.stringify(s, null, 2), 'application/json')}
              onImportCsv={(r) => sc.update({ kpis: r.map((x, i) => ({ _id: Date.now() + i, name: x.name || 'KPI', baseline: +x.baseline || 0, spt: +x.spt || 0, unit: x.unit || '', year: +x.year || 2030, weight: +x.weight || 0, achieved: +x.achieved || 0 })) })}
              importLabel="Import KPIs CSV"
            />
          }
        />
      }
    />
  );
}
