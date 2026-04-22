import React, { useMemo, useState } from 'react';
import {
  T, useScenario, openDeliverable, toCsv, downloadText, html,
  ToolShell, Step, OutputRail, PrimaryCTA, ToolMenu,
  FieldRow, Worksheet, NumInput, TextInput, SelectInput, Collapsible, Note, PageHeader,
  Tornado, MonteCarloCard, ProgressRing, Sparkline
} from '../../_shared/AdvisoryToolkit';
import {
  ICMA_KPI_LIBRARY, CBI_GREENIUM_BPS, sbtiAmbitionCheck,
  SLBP_COMPONENTS, SLF_PEER_DEALS, monteCarlo, tornado
} from '../../_shared/AdvisoryReference';

const INSTRUMENTS = ['Green Bond', 'Sustainability-Linked Bond', 'Sustainability-Linked Loan', 'Transition Bond', 'Blue Bond'];
const SECTORS = Object.keys(ICMA_KPI_LIBRARY);
const RATINGS = ['AAA', 'AA', 'A', 'BBB', 'BB'];

const DEFAULTS = {
  issuer: 'ACME Group',
  sector: 'Utilities — Power',
  rating: 'A',
  instrument: 'Sustainability-Linked Bond',
  notional: 5000,
  tenor: 7,
  coupon: 7.50,
  greeniumBps: 5,
  stepUpBps: 25,
  stepDownBps: 10,
  twoWay: true,
  tranches: [
    { _id: 1, name: 'Senior 5y', notional: 3000, tenor: 5, couponPct: 7.25, greeniumBps: 5, stepUpBps: 25 },
    { _id: 2, name: 'Senior 10y', notional: 2000, tenor: 10, couponPct: 7.80, greeniumBps: 7, stepUpBps: 35 },
  ],
  kpis: [
    { _id: 1, name: 'Scope 1+2 emissions intensity', baseline: 620, spt: 310, unit: 'kgCO₂e/MWh', year: 2030, weight: 40, achieved: 465, trend: 0.08 },
    { _id: 2, name: 'Renewable electricity share', baseline: 12, spt: 65, unit: '%', year: 2030, weight: 35, achieved: 28, trend: 0.10 },
    { _id: 3, name: 'Water withdrawal reduction', baseline: 100, spt: 70, unit: 'Index (100=base)', year: 2030, weight: 25, achieved: 88, trend: 0.05 },
  ],
  slbp: { KPI: 85, SPT: 70, CF: 90, RPT: 75, VER: 65 },
  mcRuns: 2000,
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
  const [mcTrigger, setMcTrigger] = useState(0);

  const weighted = useMemo(() => {
    const totW = s.kpis.reduce((x, k) => x + k.weight, 0) || 1;
    return s.kpis.reduce((x, k) => x + progressPct(k) * k.weight, 0) / totW;
  }, [s.kpis]);

  const onTrack = weighted >= 70;
  const annualIntBase = (s.notional * s.coupon) / 100;
  const greenium = (s.notional * s.greeniumBps / 10000) * s.tenor;
  const stepUpPenalty = onTrack ? 0 : (s.notional * s.stepUpBps / 10000) * Math.max(0, s.tenor - 2);
  const stepDownBenefit = s.twoWay && weighted >= 85 ? (s.notional * s.stepDownBps / 10000) * Math.max(0, s.tenor - 2) : 0;
  const netBenefit = greenium - stepUpPenalty + stepDownBenefit;
  const ready = s.kpis.length >= 1 && s.issuer.trim();

  // Multi-tranche economics
  const trancheRows = useMemo(() => s.tranches.map(tr => {
    const baseInt = (tr.notional * tr.couponPct) / 100;
    const trGreenium = (tr.notional * tr.greeniumBps / 10000) * tr.tenor;
    const trStepUp = onTrack ? 0 : (tr.notional * tr.stepUpBps / 10000) * Math.max(0, tr.tenor - 2);
    return { ...tr, baseInt, trGreenium, trStepUp, trNet: trGreenium - trStepUp };
  }), [s.tranches, onTrack]);
  const trancheTotal = trancheRows.reduce((x, r) => x + r.trNet, 0);

  // SLBP 5-component scorecard
  const slbpScore = useMemo(() => {
    return SLBP_COMPONENTS.reduce((x, c) => x + (s.slbp[c.id] || 0) * c.weight / 100, 0);
  }, [s.slbp]);

  // Monte Carlo SPT achievement probability
  const mc = useMemo(() => {
    return monteCarlo(({ trendMult, volShock }) => {
      const totW = s.kpis.reduce((x, k) => x + k.weight, 0) || 1;
      const forecast = s.kpis.reduce((x, k) => {
        const yearsToSpt = Math.max(1, k.year - new Date().getFullYear());
        const currentMoved = k.achieved - k.baseline;
        const span = k.spt - k.baseline;
        const projected = currentMoved + (span * (k.trend || 0.08) * yearsToSpt * trendMult) + volShock * span * 0.1;
        const p = span !== 0 ? Math.max(0, Math.min(100, (projected / span) * 100)) : 100;
        return x + p * k.weight;
      }, 0) / totW;
      return forecast;
    }, {
      trendMult: { min: 0.75, mode: 1.0, max: 1.2 },
      volShock: { min: -1.0, mode: 0, max: 1.0 },
    }, s.mcRuns);
  }, [s.kpis, s.mcRuns, mcTrigger]);

  const sptProb = useMemo(() => {
    if (!mc?.samples) return 0;
    return mc.samples.filter(v => v >= 100).length / mc.samples.length * 100;
  }, [mc]);

  // Tornado — net benefit sensitivity
  const torn = useMemo(() => {
    const inputs = { notional: s.notional, coupon: s.coupon, greenium: s.greeniumBps, stepUp: s.stepUpBps, tenor: s.tenor };
    return tornado(inputs, (v) => {
      const gr = (v.notional * v.greenium / 10000) * v.tenor;
      const su = onTrack ? 0 : (v.notional * v.stepUp / 10000) * Math.max(0, v.tenor - 2);
      return gr - su;
    }, 0.2).map(r => ({ label: r.driver, low: r.low, high: r.high }));
  }, [s.notional, s.coupon, s.greeniumBps, s.stepUpBps, s.tenor, onTrack]);

  // Peer deal comps
  const peerDeals = useMemo(() => SLF_PEER_DEALS.filter(d => d.sector === s.sector || d.sector.includes(s.sector.split(' ')[0])), [s.sector]);
  const peerAvgGreenium = peerDeals.length ? peerDeals.reduce((x, d) => x + d.greeniumBps, 0) / peerDeals.length : null;
  const peerAvgStepUp = peerDeals.length ? peerDeals.reduce((x, d) => x + d.stepUp, 0) / peerDeals.length : null;

  const upd = (k) => (v) => sc.update({ [k]: v });
  const updKpi = (i, k, v) => sc.update({ kpis: s.kpis.map((x, j) => j === i ? { ...x, [k]: v } : x) });
  const updTr = (i, k, v) => sc.update({ tranches: s.tranches.map((x, j) => j === i ? { ...x, [k]: v } : x) });

  const loadSector = (sector) => {
    const lib = ICMA_KPI_LIBRARY[sector];
    if (!lib) return;
    const cbi = CBI_GREENIUM_BPS[sector]?.[s.rating] ?? 5;
    sc.update({
      sector,
      greeniumBps: cbi,
      kpis: lib.map((k, i) => ({
        _id: Date.now() + i,
        name: k.kpi, baseline: k.baseline, spt: k.spt2030,
        unit: k.unit, year: 2030, weight: Math.round(100 / lib.length),
        achieved: k.baseline + (k.spt2030 - k.baseline) * 0.3, trend: 0.08,
      })),
    });
  };
  const setRating = (r) => {
    const cbi = CBI_GREENIUM_BPS[s.sector]?.[r] ?? s.greeniumBps;
    sc.update({ rating: r, greeniumBps: cbi });
  };

  const sbtiChecks = s.kpis.map(k => sbtiAmbitionCheck(s.sector, k.baseline, k.spt, k.year));
  const alignedCount = sbtiChecks.filter(c => c.aligned).length;

  const onDeliver = () => {
    const body = [
      html.h1(`${s.instrument} Framework — ${s.issuer}`),
      html.meta({ Notional: `₹${s.notional.toLocaleString()} Cr`, Tenor: `${s.tenor}y`, Coupon: `${s.coupon}%`, Generated: new Date().toLocaleDateString() }),
      html.h2('1. Rationale'),
      html.p(`${s.issuer} is issuing a ${s.tenor}-year ${s.instrument} of ₹${s.notional.toLocaleString()} Cr, structured as a ${s.twoWay ? 'two-way (step-up + step-down)' : 'one-way step-up'} sustainability-linked instrument across ${s.tranches.length} tranches.`),
      html.h2('2. Key Performance Indicators'),
      html.table(['KPI', 'Baseline', 'SPT', 'Current', 'Wt %', 'Progress'],
        s.kpis.map(k => [k.name, `${k.baseline} ${k.unit}`, `${k.spt} ${k.unit}`, `${k.achieved} ${k.unit}`, k.weight, progressPct(k).toFixed(0) + '%'])),
      html.p(`Weighted progress: <b>${weighted.toFixed(1)}%</b> — ${onTrack ? html.badge('green', 'ON TRACK') : html.badge('amber', 'MISS RISK')}`),
      html.p(`Monte Carlo SPT achievement probability (${s.mcRuns.toLocaleString()} runs): <b>${sptProb.toFixed(1)}%</b>.`),
      html.h2('3. SLBP 5-Component Scorecard'),
      html.p(`Overall: <b>${slbpScore.toFixed(1)}/100</b>`),
      html.table(['Component', 'Weight %', 'Score', 'Description'],
        SLBP_COMPONENTS.map(c => [c.label, c.weight, s.slbp[c.id] || 0, c.desc])),
      html.h2('4. Multi-Tranche Structure'),
      html.table(['Tranche', '₹ Cr', 'Tenor', 'Coupon', 'Greenium bps', 'Step-up bps', 'Net benefit (₹ Cr)'],
        trancheRows.map(tr => [tr.name, tr.notional, tr.tenor, tr.couponPct + '%', tr.greeniumBps, tr.stepUpBps, tr.trNet.toFixed(1)])),
      html.h2('5. Peer Deal Comparables'),
      peerDeals.length ? html.table(['Issuer', 'Sector', '₹Mn', 'Tenor', 'Coupon %', 'Greenium', 'Step-up'],
        peerDeals.map(d => [d.issuer, d.sector, d.notionalMn, d.tenor, d.couponPct, d.greeniumBps + ' bps', d.stepUp + ' bps']))
        : html.p('No directly comparable peer deals in database for this sector.'),
      peerAvgGreenium !== null ? html.p(`Peer average greenium: <b>${peerAvgGreenium.toFixed(1)} bps</b> · Peer average step-up: <b>${peerAvgStepUp.toFixed(1)} bps</b>.`) : '',
      html.h2('6. Cost Economics'),
      html.p(`Base annual interest: ₹${annualIntBase.toFixed(1)} Cr · Lifetime greenium benefit: <b style="color:#155724">₹${greenium.toFixed(1)} Cr</b> · Step-up penalty (if miss): <b style="color:#721c24">₹${stepUpPenalty.toFixed(1)} Cr</b> · Step-down benefit (if exceed): <b style="color:#155724">₹${stepDownBenefit.toFixed(1)} Cr</b> · <b>Net financing benefit: ₹${netBenefit.toFixed(1)} Cr</b>`),
      html.h2('7. Reporting & Verification'),
      html.p('Annual KPI reporting with independent limited assurance. Post-issuance external review (SPO) from ICMA-accredited provider.'),
      html.h2('8. Framework Alignment'),
      html.p(`Aligned with ICMA SLBP 2024. SBTi alignment: <b>${alignedCount}/${s.kpis.length}</b> KPIs on 1.5°C pathway.`),
    ].join('');
    openDeliverable(body, `${s.instrument} Framework — ${s.issuer}`);
  };

  return (
    <ToolShell
      header={<PageHeader code="EP-EB3 · SLF" title="Sustainability-Linked Finance Tool" subtitle="Structure SLB/SLL framework with two-way pricing, multi-tranche economics, SLBP 5-component scorecard, Monte Carlo SPT probability, and peer deal comps." />}
      steps={
        <>
          <Step n={1} title="Issuer & instrument" hint="Sector + rating auto-loads ICMA KPI template and CBI greenium.">
            <FieldRow label="Issuer"><TextInput value={s.issuer} onChange={upd('issuer')} style={{ width: 320 }} /></FieldRow>
            <FieldRow label="Sector">
              <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                <SelectInput value={s.sector} onChange={loadSector} options={SECTORS} />
                <button onClick={() => loadSector(s.sector)} style={{ background: T.surfaceH, color: T.gold, border: `1px solid ${T.border}`, padding: '4px 10px', fontSize: 11, cursor: 'pointer', borderRadius: 2, fontFamily: T.mono }}>↻ reload</button>
              </span>
            </FieldRow>
            <FieldRow label="Credit rating"><SelectInput value={s.rating} onChange={setRating} options={RATINGS} /></FieldRow>
            <FieldRow label="Instrument"><SelectInput value={s.instrument} onChange={upd('instrument')} options={INSTRUMENTS} /></FieldRow>
            <FieldRow label="Notional (parent)"><NumInput value={s.notional} onChange={upd('notional')} step={100} suffix="₹ Cr" /></FieldRow>
            <FieldRow label="Tenor"><NumInput value={s.tenor} onChange={upd('tenor')} suffix="years" /></FieldRow>
            <FieldRow label="Coupon"><NumInput value={s.coupon} onChange={upd('coupon')} step={0.1} suffix="%" /></FieldRow>
            <Note level="info">CBI 2024 greenium for <b>{s.sector}</b> / <b>{s.rating}</b>: <b style={{ color: T.gold }}>{CBI_GREENIUM_BPS[s.sector]?.[s.rating] ?? '—'} bps</b>.</Note>
          </Step>

          <Step n={2} title="KPI library" hint="Each KPI has baseline, SPT, current, and implicit historic trend driving MC forecast.">
            <Worksheet
              cols={[
                { h: 'KPI', width: '2fr', edit: (r, i) => <TextInput value={r.name} onChange={v => updKpi(i, 'name', v)} style={{ width: '100%' }} /> },
                { h: 'Unit', width: '1fr', edit: (r, i) => <TextInput value={r.unit} onChange={v => updKpi(i, 'unit', v)} style={{ width: '100%' }} /> },
                { h: 'Base', width: '70px', edit: (r, i) => <NumInput value={r.baseline} onChange={v => updKpi(i, 'baseline', v)} style={{ width: 56 }} /> },
                { h: 'SPT', width: '70px', edit: (r, i) => <NumInput value={r.spt} onChange={v => updKpi(i, 'spt', v)} style={{ width: 56 }} /> },
                { h: 'Curr', width: '70px', edit: (r, i) => <NumInput value={r.achieved} onChange={v => updKpi(i, 'achieved', v)} style={{ width: 56 }} /> },
                { h: 'Year', width: '60px', edit: (r, i) => <NumInput value={r.year} onChange={v => updKpi(i, 'year', v)} style={{ width: 48 }} /> },
                { h: 'Trend', width: '70px', edit: (r, i) => <NumInput value={r.trend || 0.08} onChange={v => updKpi(i, 'trend', v)} step={0.01} style={{ width: 52 }} /> },
                { h: 'Wt%', width: '55px', edit: (r, i) => <NumInput value={r.weight} onChange={v => updKpi(i, 'weight', v)} style={{ width: 40 }} /> },
                { h: 'Prog', width: '70px', edit: (r) => {
                    const p = progressPct(r);
                    return <span style={{ fontFamily: T.mono, fontSize: 12, color: p >= 70 ? T.green : p >= 40 ? T.amber : T.red }}>{p.toFixed(0)}%</span>;
                  } },
              ]}
              rows={s.kpis}
              onAdd={() => sc.update({ kpis: [...s.kpis, { _id: Date.now(), name: 'New KPI', baseline: 100, spt: 50, unit: 'unit', year: 2030, weight: 20, achieved: 100, trend: 0.08 }] })}
              onDel={(i) => sc.update({ kpis: s.kpis.filter((_, j) => j !== i) })}
            />
            {(s.kpis.reduce((x, k) => x + k.weight, 0) !== 100) && <Note level="warn">Weights sum to {s.kpis.reduce((x, k) => x + k.weight, 0)}% — should total 100%.</Note>}
            <Collapsible title={`SBTi 1.5°C alignment (${alignedCount}/${s.kpis.length} KPIs aligned)`}>
              <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
                <thead><tr style={{ color: T.textMut }}><th style={{ padding: 4, textAlign: 'left' }}>KPI</th><th style={{ padding: 4 }}>Required Δ</th><th style={{ padding: 4 }}>Target Δ</th><th style={{ padding: 4 }}>Aligned</th></tr></thead>
                <tbody>{s.kpis.map((k, i) => {
                  const c = sbtiChecks[i];
                  return <tr key={k._id} style={{ borderTop: `1px solid ${T.borderL}`, fontFamily: T.mono }}>
                    <td style={{ padding: 4, fontFamily: T.font, color: T.textSec }}>{k.name}</td>
                    <td style={{ padding: 4, textAlign: 'right' }}>{(c.required * 100).toFixed(1)}%</td>
                    <td style={{ padding: 4, textAlign: 'right' }}>{(c.actual * 100).toFixed(1)}%</td>
                    <td style={{ padding: 4, color: c.aligned ? T.green : T.amber }}>{c.aligned ? '✓' : '✗'}</td>
                  </tr>;
                })}</tbody>
              </table>
            </Collapsible>
          </Step>

          <Step n={3} title="Coupon mechanics — two-way pricing">
            <FieldRow label="Two-way pricing">
              <label style={{ cursor: 'pointer', fontSize: 12, color: s.twoWay ? T.green : T.textMut }}>
                <input type="checkbox" checked={s.twoWay} onChange={e => sc.update({ twoWay: e.target.checked })} style={{ marginRight: 6 }} />
                {s.twoWay ? 'Step-up + step-down' : 'Step-up only'}
              </label>
            </FieldRow>
            <FieldRow label="Greenium (bps)"><NumInput value={s.greeniumBps} onChange={upd('greeniumBps')} suffix="bps" /></FieldRow>
            <FieldRow label="Step-up on miss"><NumInput value={s.stepUpBps} onChange={upd('stepUpBps')} suffix="bps" /></FieldRow>
            {s.twoWay && <FieldRow label="Step-down on over-achievement"><NumInput value={s.stepDownBps} onChange={upd('stepDownBps')} suffix="bps" /></FieldRow>}
            <Collapsible title="Cashflow summary" defaultOpen>
              <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.7, fontFamily: T.mono }}>
                Base annual interest: ₹{annualIntBase.toFixed(1)} Cr<br />
                Lifetime greenium: <span style={{ color: T.green }}>₹{greenium.toFixed(1)} Cr</span><br />
                Step-up penalty (if miss): <span style={{ color: T.red }}>₹{stepUpPenalty.toFixed(1)} Cr</span><br />
                Step-down benefit (if &gt;85%): <span style={{ color: T.green }}>₹{stepDownBenefit.toFixed(1)} Cr</span><br />
                <b style={{ color: T.gold }}>Net financing benefit: ₹{netBenefit.toFixed(1)} Cr</b>
              </div>
            </Collapsible>
          </Step>

          <Step n={4} title="Multi-tranche structure" hint="Parent notional can be split into tranches with independent tenors & pricing.">
            <Worksheet
              cols={[
                { h: 'Tranche', width: '1.5fr', edit: (r, i) => <TextInput value={r.name} onChange={v => updTr(i, 'name', v)} style={{ width: '100%' }} /> },
                { h: 'Notional', width: '90px', edit: (r, i) => <NumInput value={r.notional} onChange={v => updTr(i, 'notional', v)} step={100} /> },
                { h: 'Tenor', width: '70px', edit: (r, i) => <NumInput value={r.tenor} onChange={v => updTr(i, 'tenor', v)} /> },
                { h: 'Coupon%', width: '80px', edit: (r, i) => <NumInput value={r.couponPct} onChange={v => updTr(i, 'couponPct', v)} step={0.1} /> },
                { h: 'Greenium', width: '80px', edit: (r, i) => <NumInput value={r.greeniumBps} onChange={v => updTr(i, 'greeniumBps', v)} /> },
                { h: 'Step-up', width: '80px', edit: (r, i) => <NumInput value={r.stepUpBps} onChange={v => updTr(i, 'stepUpBps', v)} /> },
                { h: 'Net ₹Cr', width: '75px', edit: (r) => {
                    const gr = (r.notional * r.greeniumBps / 10000) * r.tenor;
                    const su = onTrack ? 0 : (r.notional * r.stepUpBps / 10000) * Math.max(0, r.tenor - 2);
                    return <span style={{ fontFamily: T.mono, color: T.gold, fontSize: 12 }}>{(gr - su).toFixed(1)}</span>;
                  } },
              ]}
              rows={s.tranches}
              onAdd={() => sc.update({ tranches: [...s.tranches, { _id: Date.now(), name: 'New tranche', notional: 1000, tenor: 7, couponPct: 7.5, greeniumBps: 5, stepUpBps: 25 }] })}
              onDel={(i) => sc.update({ tranches: s.tranches.filter((_, j) => j !== i) })}
            />
            <Note level="info">Tranche-aggregate net benefit: <b style={{ color: T.gold }}>₹{trancheTotal.toFixed(1)} Cr</b>.</Note>
          </Step>

          <Step n={5} title="SLBP 5-Component Scorecard" hint="ICMA SLBP 2024 compliance — required for SPO provider sign-off.">
            {SLBP_COMPONENTS.map(c => (
              <FieldRow key={c.id} label={`${c.label} (${c.weight}%)`} hint={c.desc}>
                <input type="range" min={0} max={100} value={s.slbp[c.id] || 0}
                  onChange={e => sc.update({ slbp: { ...s.slbp, [c.id]: +e.target.value } })}
                  style={{ width: 220 }} />
                <span style={{ fontFamily: T.mono, fontSize: 12, color: (s.slbp[c.id] || 0) >= 75 ? T.green : (s.slbp[c.id] || 0) >= 60 ? T.amber : T.red, marginLeft: 10 }}>{s.slbp[c.id] || 0}</span>
              </FieldRow>
            ))}
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 16 }}>
              <ProgressRing pct={slbpScore} size={72} color={slbpScore >= 75 ? T.green : slbpScore >= 60 ? T.amber : T.red} label="SLBP" />
              <div style={{ fontSize: 12, color: T.textSec, maxWidth: 420 }}>
                {slbpScore >= 75 ? 'SPO sign-off likely — proceed to external review.'
                  : slbpScore >= 60 ? 'Strengthen low-scoring components before SPO engagement.'
                  : 'Material gaps — framework not ready for external review.'}
              </div>
            </div>
          </Step>

          <Step n={6} title="SPT achievement — Monte Carlo" hint="Simulates forecast weighted progress at SPT date under trend × vol uncertainty.">
            <FieldRow label="MC simulations"><NumInput value={s.mcRuns} onChange={upd('mcRuns')} step={500} min={500} max={10000} /></FieldRow>
            {mc && <MonteCarloCard title="Weighted progress at SPT date (%)" stats={mc} fmt={(n) => n.toFixed(0)} />}
            <Note level={sptProb >= 70 ? 'ok' : sptProb >= 40 ? 'warn' : 'bad'}>
              <b>SPT achievement probability: {sptProb.toFixed(1)}%</b> (weighted ≥ 100% in MC sample). {sptProb >= 70 ? 'Greenium well-earned.' : sptProb >= 40 ? 'Step-up risk material — price carefully.' : 'High miss probability — either ambition-down SPT or widen step-up.'}
            </Note>
            <button onClick={() => setMcTrigger(t => t + 1)} style={{ marginTop: 8, background: T.surfaceH, color: T.gold, border: `1px solid ${T.gold}`, padding: '5px 12px', fontSize: 11, cursor: 'pointer', borderRadius: 3 }}>↻ Re-sample</button>
            <Collapsible title="Tornado — net benefit sensitivity" defaultOpen>
              <div style={{ paddingTop: 8 }}><Tornado rows={torn} fmt={(n) => n.toFixed(1)} /></div>
            </Collapsible>
          </Step>

          <Step n={7} title="Peer deal comparables" hint="Compare against publicly-disclosed SLB/SLL deals.">
            {peerDeals.length ? (
              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                <thead><tr style={{ color: T.textMut, textAlign: 'left' }}><th style={{ padding: 6 }}>Issuer</th><th>Sector</th><th>$Mn</th><th>Tenor</th><th>Coupon</th><th>Greenium</th><th>Step-up</th><th>Year</th></tr></thead>
                <tbody>{peerDeals.map(d => (
                  <tr key={d.issuer} style={{ borderTop: `1px solid ${T.borderL}`, fontFamily: T.mono }}>
                    <td style={{ padding: 6, fontFamily: T.font, color: T.text }}>{d.issuer}</td>
                    <td style={{ padding: 6, fontFamily: T.font, color: T.textSec }}>{d.sector}</td>
                    <td style={{ padding: 6 }}>{d.notionalMn}</td>
                    <td style={{ padding: 6 }}>{d.tenor}y</td>
                    <td style={{ padding: 6 }}>{d.couponPct}%</td>
                    <td style={{ padding: 6, color: T.green }}>{d.greeniumBps} bps</td>
                    <td style={{ padding: 6, color: T.amber }}>{d.stepUp} bps</td>
                    <td style={{ padding: 6 }}>{d.yr}</td>
                  </tr>))}
                </tbody>
              </table>
            ) : (
              <Note level="info">No direct sector matches in database. All {SLF_PEER_DEALS.length} peers shown in deliverable.</Note>
            )}
            {peerAvgGreenium !== null && <Note level="info">Peer avg greenium <b>{peerAvgGreenium.toFixed(1)} bps</b> vs yours <b>{s.greeniumBps} bps</b> · Peer avg step-up <b>{peerAvgStepUp.toFixed(1)} bps</b> vs yours <b>{s.stepUpBps} bps</b>.</Note>}
          </Step>

          <Step n={8} title="Generate framework">
            {!ready && <Note level="bad">Add issuer name and at least one KPI.</Note>}
            {ready && <Note level="ok">Ready. Deliverable covers ICMA SLBP 5 components, two-way pricing, MC SPT probability, peer comps.</Note>}
          </Step>
        </>
      }
      rail={
        <OutputRail
          label="LIVE SLF ECONOMICS"
          stats={[
            { label: 'SPT Prob', value: `${sptProb.toFixed(0)}%`, sub: 'MC achievement', color: sptProb >= 70 ? T.green : sptProb >= 40 ? T.amber : T.red },
            { label: 'SLBP', value: `${slbpScore.toFixed(0)}/100`, sub: 'framework compl.', color: slbpScore >= 75 ? T.green : T.amber },
            { label: 'Net benefit', value: `₹${netBenefit.toFixed(1)}Cr`, sub: s.twoWay ? 'two-way' : 'one-way', color: netBenefit > 0 ? T.green : T.red },
            { label: 'Tranche net', value: `₹${trancheTotal.toFixed(1)}Cr`, sub: `${s.tranches.length} tranches` },
          ]}
          preview={
            <div>
              <div><b style={{ color: T.text }}>{s.issuer}</b> · {s.instrument}</div>
              <div style={{ marginTop: 4 }}>₹{s.notional.toLocaleString()} Cr · {s.tenor}y · {s.coupon}%</div>
              <div>Weighted progress: {weighted.toFixed(0)}% <Sparkline values={s.kpis.map(k => progressPct(k))} /></div>
              <div>SBTi aligned: {alignedCount}/{s.kpis.length} KPIs</div>
              <div>Peer avg greenium: {peerAvgGreenium !== null ? `${peerAvgGreenium.toFixed(1)} bps` : '—'}</div>
            </div>
          }
          cta={<PrimaryCTA onClick={onDeliver}>Generate SLF Framework →</PrimaryCTA>}
          menu={
            <ToolMenu
              scenario={sc}
              onExportCsv={() => downloadText('slf-kpis.csv', toCsv(s.kpis), 'text/csv')}
              onExportJson={() => downloadText('slf-scenario.json', JSON.stringify(s, null, 2), 'application/json')}
              onImportCsv={(r) => sc.update({ kpis: r.map((x, i) => ({ _id: Date.now() + i, name: x.name || 'KPI', baseline: +x.baseline || 0, spt: +x.spt || 0, unit: x.unit || '', year: +x.year || 2030, weight: +x.weight || 0, achieved: +x.achieved || 0, trend: +x.trend || 0.08 })) })}
              importLabel="Import KPIs CSV"
            />
          }
        />
      }
    />
  );
}
