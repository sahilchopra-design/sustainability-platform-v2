import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Legend } from 'recharts';
import { T, useScenario, ToolkitBar, NumInput, TextInput, Kpi, Panel, Table, td, TabBar, PageHeader, Badge, downloadText, toCsv, openDeliverable, html } from '../../_shared/AdvisoryToolkit';

const INSTRUMENTS = ['Green Bond', 'Sustainability-Linked Bond', 'Sustainability-Linked Loan', 'Transition Bond', 'Blue Bond'];
const SPOS = ['Sustainalytics', 'S&P Global', "Moody's ESG", 'CICERO', 'CRISIL', 'ISS ESG'];

const DEFAULTS = {
  issuerName: 'Integrated RE-IPP Client (anonymised)',
  faceAmount: 2500,
  currency: 'INR Cr',
  baseCoupon: 8.15,
  tenorYrs: 7,
  stepUpBps: 25,
  spo: 'Sustainalytics',
  kpis: [
    { kpi: 'Portfolio GHG intensity (Scope 1+2)', unit: 'tCO₂e/MWh', baseline: 0.052, spt: 0.028, year: 2030, weight: 40, achieved: 0.048 },
    { kpi: 'Renewable capacity share', unit: '%', baseline: 62, spt: 85, year: 2030, weight: 25, achieved: 68 },
    { kpi: 'Module LCA-verified intensity', unit: 'g CO₂e/kWh', baseline: 42, spt: 28, year: 2030, weight: 20, achieved: 40 },
    { kpi: 'Water withdrawal intensity', unit: 'm³/MWh', baseline: 0.35, spt: 0.20, year: 2030, weight: 10, achieved: 0.31 },
    { kpi: 'Safety — LTIFR', unit: '/Mhrs', baseline: 0.48, spt: 0.15, year: 2030, weight: 5, achieved: 0.41 },
  ],
};

const TABS = ['Issuance Inputs', 'KPI Library', 'SPT Trajectory', 'Cost-Savings Calculator', 'Framework Alignment', 'Deliverables'];

export default function SustainabilityLinkedFinancePage() {
  const sc = useScenario('eb3_slf', DEFAULTS);
  const [tab, setTab] = useState(0);
  const s = sc.state;

  const kpisWithScore = useMemo(() => s.kpis.map(k => {
    const range = k.baseline - k.spt;
    const done = k.baseline - k.achieved;
    const prog = range !== 0 ? done / range : 0;
    const prog01 = Math.max(0, Math.min(1, prog));
    return { ...k, progress: prog01 * 100, onTrack: prog01 >= 0.3 };
  }), [s.kpis]);

  const weightedProgress = kpisWithScore.reduce((a, k) => a + (k.progress * k.weight), 0) / Math.max(1, kpisWithScore.reduce((a, k) => a + k.weight, 0));
  const missRisk = weightedProgress < 50;

  // Expected cost-of-debt savings: if SPT met, no step-up; if missed, coupon steps up
  const annualInterestBase = s.faceAmount * s.baseCoupon / 100;
  const annualInterestStepUp = s.faceAmount * (s.baseCoupon + s.stepUpBps / 100) / 100;
  const stepUpPenaltyPerYr = annualInterestStepUp - annualInterestBase;
  const yearsAfterSpt = Math.max(0, s.tenorYrs - (DEFAULTS.kpis[0].year - 2026));
  const expectedPenalty = missRisk ? stepUpPenaltyPerYr * yearsAfterSpt : 0;
  // "Greenium" — observed 3–7 bps pricing advantage vs vanilla on issuance
  const assumedGreenium = 5;
  const totalGreeniumBenefit = s.faceAmount * (assumedGreenium / 10000) * s.tenorYrs;

  const upd = (i, k, v) => sc.update(st => ({ kpis: st.kpis.map((x, j) => j === i ? { ...x, [k]: v } : x) }));
  const addKpi = () => sc.update(st => ({ kpis: [...st.kpis, { kpi: 'New KPI', unit: '', baseline: 0, spt: 0, year: 2030, weight: 0, achieved: 0 }] }));
  const delKpi = (i) => sc.update(st => ({ kpis: st.kpis.filter((_, j) => j !== i) }));

  const exportCsv = () => downloadText(`EB3_SLF_${sc.scenarioName}.csv`, toCsv(kpisWithScore.map(k => ({
    kpi: k.kpi, unit: k.unit, baseline: k.baseline, spt: k.spt, spt_year: k.year, weight_pct: k.weight, achieved: k.achieved, progress_pct: +k.progress.toFixed(1), on_track: k.onTrack ? 'Yes' : 'No',
  }))), 'text/csv');
  const exportJson = () => downloadText(`EB3_${sc.scenarioName}.json`, JSON.stringify({ module: 'EB3', scenario: sc.scenarioName, state: s }, null, 2), 'application/json');

  const generateFramework = () => {
    const content = [
      html.h1('Sustainability-Linked Finance Framework'),
      html.meta({ Issuer: s.issuerName, Instrument: 'Sustainability-Linked Bond (SLB)', 'Face amount': `${s.currency} ${s.faceAmount.toLocaleString()}`, Tenor: `${s.tenorYrs} years`, 'Base coupon': `${s.baseCoupon}%`, 'Step-up': `${s.stepUpBps} bps`, SPO: s.spo, Aligned: 'ICMA SLBP 2024 + LMA SLLP 2024', Scenario: sc.scenarioName }),
      html.h2('1. Rationale & Strategy'),
      html.p('This framework links the cost-of-debt of the Issuer to the achievement of material, ambitious KPIs aligned to the net-zero pathway of the Issuer and the science-based decarbonisation trajectory of the Indian power sector.'),
      html.h2('2. Selection of KPIs'),
      html.p('KPIs are selected to be: (i) <b>Core & material</b> to the Issuer\'s business model, (ii) <b>Measurable & quantifiable</b> on a consistent methodological basis, (iii) <b>Externally verifiable</b> by the SPO and an assurance provider, and (iv) <b>Benchmarkable</b> against peers and industry references.'),
      html.table(['KPI', 'Unit', 'Baseline', 'SPT', 'SPT year', 'Weight %'], s.kpis.map(k => [k.kpi, k.unit, k.baseline, k.spt, k.year, k.weight])),
      html.h2('3. Sustainability Performance Targets (SPTs)'),
      html.p(`Each KPI has a pre-defined SPT with annual trigger observation dates. Weighted aggregate SPT progress to date: <b>${weightedProgress.toFixed(1)}%</b>. Aggregate determination: if <b>any</b> SPT is missed at trigger date, bond coupon steps up by <b>${s.stepUpBps} bps</b> for the remaining tenor.`),
      html.h2('4. Bond Financial Characteristics'),
      html.kpi('Face amount', `${s.currency} ${s.faceAmount.toLocaleString()}`) + html.kpi('Base coupon', `${s.baseCoupon}%`) + html.kpi('Tenor', `${s.tenorYrs} yrs`) + html.kpi('Step-up', `${s.stepUpBps} bps`) + html.kpi('Annual interest (base)', `${s.currency} ${annualInterestBase.toFixed(0)}`) + html.kpi('Annual interest (stepped)', `${s.currency} ${annualInterestStepUp.toFixed(0)}`),
      html.h2('5. Reporting & Verification'),
      html.p(`The Issuer will publish an annual Sustainability Performance Report aligned to ICMA SLBP Reporting Annex. Assurance: limited assurance (ISAE 3000) in Yr1, reasonable assurance (ISAE 3410) from SPT trigger onwards. SPO: <b>${s.spo}</b>.`),
      html.h2('6. Framework Alignment'),
      html.p('This framework is aligned to: ICMA Sustainability-Linked Bond Principles 2024; LMA Sustainability-Linked Loan Principles 2024; SEBI Circular on ESG Debt Securities 2023; applicable sections of the EU Green Bond Standard 2024 (for EU-placed tranches).'),
      html.h2('7. Economic Summary'),
      html.p(`Expected greenium benefit: <b>${s.currency} ${totalGreeniumBenefit.toFixed(1)}</b> over tenor (${assumedGreenium} bps × ${s.tenorYrs} yrs). Expected step-up penalty (if current trajectory holds): <b>${s.currency} ${expectedPenalty.toFixed(1)}</b>. Net expected advantage: <b>${s.currency} ${(totalGreeniumBenefit - expectedPenalty).toFixed(1)}</b>.`),
    ].join('');
    openDeliverable(content, `SLB Framework — ${s.issuerName}`);
  };

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: T.font, color: T.text, padding: '28px 40px' }}>
      <PageHeader code="EP-EB3" title="Sustainability-Linked Finance Framework" subtitle={`${s.issuerName} · ICMA SLBP · LMA SLLP · SEBI ESG Debt Circular · ${s.currency} ${s.faceAmount.toLocaleString()} facility`} />
      <ToolkitBar moduleCode="EB3" scenario={sc} onExportCsv={exportCsv} onExportJson={exportJson} onDeliverable={generateFramework}
        importLabel="Import KPI CSV"
        onImportCsv={(rows) => { if (rows.length) sc.update({ kpis: rows.map(r => ({
          kpi: r.kpi, unit: r.unit, baseline: Number(r.baseline) || 0, spt: Number(r.spt) || 0, year: Number(r.spt_year || r.year) || 2030, weight: Number(r.weight_pct || r.weight) || 0, achieved: Number(r.achieved) || 0,
        })) }); }} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 18 }}>
        <Kpi label="Facility size" value={`${s.faceAmount.toLocaleString()}`} sub={s.currency} />
        <Kpi label="Base coupon" value={`${s.baseCoupon}%`} sub={`${s.tenorYrs}y tenor`} />
        <Kpi label="Weighted SPT progress" value={`${weightedProgress.toFixed(1)}%`} sub={missRisk ? 'Miss risk' : 'On track'} color={missRisk ? T.red : T.green} />
        <Kpi label="Expected greenium" value={`${s.currency} ${totalGreeniumBenefit.toFixed(1)}`} sub={`${assumedGreenium} bps × tenor`} color={T.gold} />
        <Kpi label="Expected step-up" value={`${s.currency} ${expectedPenalty.toFixed(1)}`} sub={`${s.stepUpBps} bps × post-SPT yrs`} color={expectedPenalty > 0 ? T.red : T.green} />
      </div>

      <TabBar tabs={TABS} tab={tab} setTab={setTab} />

      {tab === 0 && (
        <Panel title="Issuance parameters">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, maxWidth: 800 }}>
            <L label="Issuer name"><TextInput value={s.issuerName} onChange={v => sc.update({ issuerName: v })} style={{ width: 220 }} /></L>
            <L label="Face amount"><NumInput value={s.faceAmount} onChange={v => sc.update({ faceAmount: v })} step={50} /></L>
            <L label="Currency"><TextInput value={s.currency} onChange={v => sc.update({ currency: v })} style={{ width: 100 }} /></L>
            <L label="Base coupon"><NumInput value={s.baseCoupon} onChange={v => sc.update({ baseCoupon: v })} step={0.05} suffix="%" /></L>
            <L label="Tenor"><NumInput value={s.tenorYrs} onChange={v => sc.update({ tenorYrs: v })} suffix="yrs" /></L>
            <L label="Step-up on miss"><NumInput value={s.stepUpBps} onChange={v => sc.update({ stepUpBps: v })} step={5} suffix="bps" /></L>
            <L label="SPO provider"><select value={s.spo} onChange={e => sc.update({ spo: e.target.value })} style={selS}>{SPOS.map(o => <option key={o}>{o}</option>)}</select></L>
          </div>
        </Panel>
      )}

      {tab === 1 && (
        <Panel title={`KPI library (${s.kpis.length}) — total weight ${s.kpis.reduce((a,k)=>a+k.weight,0)}%`} right={<button style={addBtn} onClick={addKpi}>+ Add KPI</button>}>
          <Table cols={['KPI', 'Unit', 'Baseline', 'SPT', 'SPT Year', 'Weight %', 'Achieved', 'Progress', 'Status', '']}>
            {kpisWithScore.map((k, i) => (
              <tr key={i}>
                <td style={td}><TextInput value={k.kpi} onChange={v => upd(i, 'kpi', v)} style={{ width: 200 }} /></td>
                <td style={td}><TextInput value={k.unit} onChange={v => upd(i, 'unit', v)} style={{ width: 100 }} /></td>
                <td style={td}><NumInput value={k.baseline} onChange={v => upd(i, 'baseline', v)} step={0.01} /></td>
                <td style={td}><NumInput value={k.spt} onChange={v => upd(i, 'spt', v)} step={0.01} /></td>
                <td style={td}><NumInput value={k.year} onChange={v => upd(i, 'year', v)} style={{ width: 60 }} /></td>
                <td style={td}><NumInput value={k.weight} onChange={v => upd(i, 'weight', v)} style={{ width: 60 }} /></td>
                <td style={td}><NumInput value={k.achieved} onChange={v => upd(i, 'achieved', v)} step={0.01} /></td>
                <td style={{ ...td, fontFamily: T.mono, color: k.onTrack ? T.green : T.amber }}>{k.progress.toFixed(1)}%</td>
                <td style={td}>{k.onTrack ? <Badge level="good">On track</Badge> : <Badge level="warn">Behind</Badge>}</td>
                <td style={td}><button onClick={() => delKpi(i)} style={delBtn}>✕</button></td>
              </tr>
            ))}
          </Table>
        </Panel>
      )}

      {tab === 2 && (
        <Panel title="SPT trajectory — baseline → achieved → target">
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={kpisWithScore.map(k => ({ kpi: k.kpi, baseline: k.baseline, achieved: k.achieved, spt: k.spt }))}>
              <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
              <XAxis dataKey="kpi" tick={{ fill: T.textSec, fontSize: 10 }} angle={-20} textAnchor="end" height={100} interval={0} />
              <YAxis tick={{ fill: T.textSec, fontSize: 11 }} />
              <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}` }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="baseline" fill={T.textMut} />
              <Bar dataKey="achieved" fill={T.gold} />
              <Bar dataKey="spt" fill={T.green} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      )}

      {tab === 3 && (
        <Panel title="Cost-of-debt economics (live)">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Table cols={['Metric', 'Value']}>
              <tr><td style={td}>Annual interest (base coupon)</td><td style={{ ...td, fontFamily: T.mono, color: T.gold }}>{s.currency} {annualInterestBase.toFixed(2)}</td></tr>
              <tr><td style={td}>Annual interest (stepped up)</td><td style={{ ...td, fontFamily: T.mono, color: T.red }}>{s.currency} {annualInterestStepUp.toFixed(2)}</td></tr>
              <tr><td style={td}>Step-up penalty / yr</td><td style={{ ...td, fontFamily: T.mono }}>{s.currency} {stepUpPenaltyPerYr.toFixed(2)}</td></tr>
              <tr><td style={td}>Expected total step-up (current traj.)</td><td style={{ ...td, fontFamily: T.mono, color: expectedPenalty > 0 ? T.red : T.green }}>{s.currency} {expectedPenalty.toFixed(2)}</td></tr>
              <tr><td style={td}>Greenium advantage (~{assumedGreenium} bps)</td><td style={{ ...td, fontFamily: T.mono, color: T.green }}>{s.currency} {totalGreeniumBenefit.toFixed(2)}</td></tr>
              <tr style={{ background: T.surfaceH }}><td style={{ ...td, fontWeight: 600 }}>Net expected advantage</td><td style={{ ...td, fontFamily: T.mono, color: T.gold, fontWeight: 600 }}>{s.currency} {(totalGreeniumBenefit - expectedPenalty).toFixed(2)}</td></tr>
            </Table>
            <Panel title="Scenario comparison — miss vs meet">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={[
                  { s: 'Base vanilla', interest: +(annualInterestBase * s.tenorYrs).toFixed(1) },
                  { s: 'SLB (SPT met)', interest: +(annualInterestBase * s.tenorYrs - totalGreeniumBenefit).toFixed(1) },
                  { s: 'SLB (SPT missed)', interest: +(annualInterestBase * s.tenorYrs - totalGreeniumBenefit + stepUpPenaltyPerYr * yearsAfterSpt).toFixed(1) },
                ]}>
                  <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
                  <XAxis dataKey="s" tick={{ fill: T.textSec, fontSize: 11 }} />
                  <YAxis tick={{ fill: T.textSec, fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}` }} />
                  <Bar dataKey="interest" fill={T.gold} />
                </BarChart>
              </ResponsiveContainer>
            </Panel>
          </div>
        </Panel>
      )}

      {tab === 4 && (
        <Panel title="Framework alignment (live checklist)">
          <Table cols={['Standard', 'Required element', 'Status', 'Reference']}>
            {[
              ['ICMA SLBP 2024', 'KPI selection rationale (5 pillars)', 'met', 'Section 2 of framework'],
              ['ICMA SLBP 2024', 'SPT ambition & science-alignment', s.kpis.some(k => k.spt === 0) ? 'partial' : 'met', 'Section 3'],
              ['ICMA SLBP 2024', 'Bond characteristics (step-up)', 'met', `${s.stepUpBps} bps`],
              ['ICMA SLBP 2024', 'Reporting cadence (annual)', 'met', 'Section 5'],
              ['ICMA SLBP 2024', 'External verification (SPO + assurance)', 'met', s.spo],
              ['LMA SLLP 2024', 'Margin ratchet mechanism', 'met', 'Step-up analog'],
              ['SEBI ESG Debt 2023', 'Disclosure of KPIs in OD/PPM', 'met', 'Annex to framework'],
              ['CBI Climate Bonds', 'Project eligibility (use of proceeds)', 'info', 'N/A for SLB — general corporate'],
            ].map(([st, req, status, ref], i) => (
              <tr key={i}>
                <td style={td}><b style={{ fontSize: 12 }}>{st}</b></td>
                <td style={td}>{req}</td>
                <td style={td}>{status === 'met' ? <Badge level="good">Met</Badge> : status === 'partial' ? <Badge level="warn">Partial</Badge> : <Badge level="info">Info</Badge>}</td>
                <td style={{ ...td, fontSize: 11, color: T.textMut }}>{ref}</td>
              </tr>
            ))}
          </Table>
        </Panel>
      )}

      {tab === 5 && (
        <Panel title="Client deliverable stack">
          <ul style={{ lineHeight: 1.9, fontSize: 13, color: T.textSec }}>
            <li><b style={{ color: T.text }}>KPI progress CSV</b> — for annual SPR. <button style={btnInline} onClick={exportCsv}>Download</button></li>
            <li><b style={{ color: T.text }}>Scenario state JSON</b>. <button style={btnInline} onClick={exportJson}>Download</button></li>
            <li><b style={{ color: T.text }}>SLB Framework Document (HTML/PDF)</b> — ICMA SLBP 2024 aligned, ready for SPO engagement. <button style={{ ...btnInline, background: T.gold, color: T.navy, borderColor: T.gold }} onClick={generateFramework}>Generate</button></li>
          </ul>
        </Panel>
      )}
    </div>
  );
}

function L({ label, children }) { return <label style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 12, color: T.textSec }}><span style={{ minWidth: 140 }}>{label}</span>{children}</label>; }
const selS = { background: T.surface, color: T.text, border: `1px solid ${T.border}`, padding: '4px 6px', fontSize: 12, borderRadius: 2 };
const addBtn = { background: T.teal, color: T.text, border: 'none', padding: '4px 12px', fontSize: 11, cursor: 'pointer', borderRadius: 3 };
const delBtn = { background: 'transparent', color: T.red, border: 'none', cursor: 'pointer', fontSize: 14 };
const btnInline = { background: T.surface, color: T.gold, border: `1px solid ${T.gold}`, padding: '3px 10px', fontSize: 11, cursor: 'pointer', borderRadius: 3, marginLeft: 8 };
