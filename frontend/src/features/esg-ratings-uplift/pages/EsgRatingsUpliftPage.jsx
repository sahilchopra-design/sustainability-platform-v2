import React, { useMemo } from 'react';
import {
  T, useScenario, openDeliverable, toCsv, downloadText, html,
  ToolShell, Step, OutputRail, PrimaryCTA, ToolMenu,
  FieldRow, Worksheet, NumInput, TextInput, SelectInput, Collapsible, Note, PageHeader
} from '../../_shared/AdvisoryToolkit';
import { MSCI_ISSUE_WEIGHTS, SECTOR_MEDIAN_SCORES, PRI_UPLIFT_LIBRARY, AUM_UNLOCK } from '../../_shared/AdvisoryReference';

const LETTERS = ['CCC', 'B', 'BB', 'BBB', 'A', 'AA', 'AAA'];
const SECTORS = Object.keys(MSCI_ISSUE_WEIGHTS);
const letterFor = (s) => LETTERS[Math.max(0, Math.min(6, Math.floor(s / 14.3)))];

const DEFAULTS = {
  issuer: 'ACME Group',
  sector: 'Utilities — Renewables',
  aumPassive: 4500,    // $ M
  issues: [
    { _id: 1, issue: 'Carbon Emissions', weight: 15, current: 38, peer: 62 },
    { _id: 2, issue: 'Climate Risk Exposure', weight: 10, current: 45, peer: 65 },
    { _id: 3, issue: 'Renewable Energy', weight: 8, current: 72, peer: 68 },
    { _id: 4, issue: 'Water Stress', weight: 6, current: 55, peer: 60 },
    { _id: 5, issue: 'Biodiversity & Land Use', weight: 5, current: 40, peer: 55 },
    { _id: 6, issue: 'Labour Management', weight: 10, current: 60, peer: 65 },
    { _id: 7, issue: 'Health & Safety', weight: 8, current: 50, peer: 63 },
    { _id: 8, issue: 'Community Relations', weight: 6, current: 58, peer: 60 },
    { _id: 9, issue: 'Supply Chain Labour', weight: 7, current: 42, peer: 55 },
    { _id: 10, issue: 'Corporate Governance', weight: 15, current: 65, peer: 70 },
    { _id: 11, issue: 'Business Ethics', weight: 10, current: 55, peer: 65 },
  ],
  actions: [
    { _id: 1, action: 'Publish TCFD-aligned climate report', issue: 'Climate Risk Exposure', uplift: 12, costMn: 0.8, months: 6 },
    { _id: 2, action: 'SBTi 1.5°C validation', issue: 'Carbon Emissions', uplift: 18, costMn: 1.2, months: 9 },
    { _id: 3, action: 'Water-positive pledge + disclosure', issue: 'Water Stress', uplift: 10, costMn: 0.4, months: 4 },
    { _id: 4, action: 'Supplier ESG audit program', issue: 'Supply Chain Labour', uplift: 14, costMn: 1.5, months: 12 },
    { _id: 5, action: 'Board ESG committee formalisation', issue: 'Corporate Governance', uplift: 6, costMn: 0.2, months: 3 },
  ],
};

export default function EsgRatingsUpliftPage() {
  const sc = useScenario('esg-uplift', DEFAULTS);
  const s = sc.state;

  const totalW = s.issues.reduce((x, i) => x + i.weight, 0) || 1;
  const currentScore = s.issues.reduce((x, i) => x + i.current * i.weight, 0) / totalW;
  const peerScore = s.issues.reduce((x, i) => x + i.peer * i.weight, 0) / totalW;
  const gap = peerScore - currentScore;

  const plan = useMemo(() => [...s.actions].map(a => ({ ...a, roi: a.costMn > 0 ? a.uplift / a.costMn : 0 })).sort((a, b) => b.roi - a.roi), [s.actions]);
  const totalUplift = plan.reduce((x, a) => x + a.uplift, 0) * (totalW > 0 ? 15 / totalW : 0);  // scaled to overall
  const projectedScore = Math.min(100, currentScore + totalUplift);
  const totalCost = plan.reduce((x, a) => x + a.costMn, 0);

  const currentLetter = letterFor(currentScore);
  const projectedLetter = letterFor(projectedScore);
  const uplifts = LETTERS.indexOf(projectedLetter) - LETTERS.indexOf(currentLetter);

  const aumUnlock = uplifts > 0 ? s.aumPassive * 0.02 * uplifts : 0;   // 2% passive flow per notch
  const ready = s.issues.length >= 5 && s.issuer.trim();

  const updIssue = (i, k, v) => sc.update({ issues: s.issues.map((x, j) => j === i ? { ...x, [k]: v } : x) });
  const updAct = (i, k, v) => sc.update({ actions: s.actions.map((x, j) => j === i ? { ...x, [k]: v } : x) });

  // Load MSCI sector template — auto-populate issues with correct weights and peer median as starting peer
  const loadSector = (sector) => {
    const weights = MSCI_ISSUE_WEIGHTS[sector];
    const median = SECTOR_MEDIAN_SCORES[sector] ?? 55;
    if (!weights) return;
    sc.update({
      sector,
      issues: weights.map((w, i) => ({
        _id: Date.now() + i, issue: w.issue, weight: w.weight,
        current: Math.max(20, median - 15 + (i % 3) * 5), peer: median,
      })),
    });
  };

  // Append a PRI library action
  const addPriAction = (a) => {
    sc.update({ actions: [...s.actions, { _id: Date.now(), action: a.action, issue: a.issue, uplift: a.uplift, costMn: a.costMn, months: a.months }] });
  };

  const sectorMedian = SECTOR_MEDIAN_SCORES[s.sector] ?? 55;
  const medianLetter = letterFor(sectorMedian);
  const percentile = Math.round(Math.max(0, Math.min(100, 50 + (currentScore - sectorMedian) * 2)));

  const onDeliver = () => {
    const body = [
      html.h1(`ESG Ratings Uplift Roadmap — ${s.issuer}`),
      html.meta({ Sector: s.sector, 'Current letter': currentLetter, 'Projected letter': projectedLetter, Generated: new Date().toLocaleDateString() }),
      html.h2('1. Starting Position'),
      html.p(`Weighted ESG score: <b>${currentScore.toFixed(1)} (${currentLetter})</b> · Peer median: ${peerScore.toFixed(1)} (${letterFor(peerScore)}) · Gap: <b>${gap.toFixed(1)} points</b>`),
      html.h2('2. Issue-Level Scoring'),
      html.table(['Issue', 'Weight %', 'Current', 'Peer', 'Δ'],
        s.issues.map(i => [i.issue, i.weight, i.current, i.peer, (i.current - i.peer).toFixed(0)])),
      html.h2('3. Remediation Plan (sorted by ROI)'),
      html.table(['Priority', 'Action', 'Target issue', 'Uplift pts', 'Cost ($M)', 'Months', 'ROI'],
        plan.map((a, i) => [i + 1, a.action, a.issue, a.uplift, a.costMn.toFixed(2), a.months, a.roi.toFixed(1)])),
      html.h2('4. Projected Outcome'),
      html.p(`Projected score: <b>${projectedScore.toFixed(1)} (${projectedLetter})</b> — ${uplifts > 0 ? html.badge('green', `+${uplifts} notch${uplifts > 1 ? 'es' : ''}`) : html.badge('amber', 'no letter change')}`),
      html.p(`Total investment: $${totalCost.toFixed(2)}M · Passive AUM unlock: <b>$${aumUnlock.toFixed(0)}M</b> (at ~2% flow per notch uplift)`),
      html.h2('5. Engagement Playbook'),
      html.p('1) Pre-engagement briefing with rating agencies (MSCI, Sustainalytics, ISS) · 2) Data room preparation · 3) Rationale memo for each issue uplift · 4) Post-action re-submission with evidence pack.'),
    ].join('');
    openDeliverable(body, `Ratings Uplift — ${s.issuer}`);
  };

  return (
    <ToolShell
      header={<PageHeader code="EP-EB4 · Ratings Uplift" title="ESG Rating Improvement Tool" subtitle="Model current MSCI-equivalent score, prioritise remediation by ROI, produce a client-shareable uplift roadmap." />}
      steps={
        <>
          <Step n={1} title="Issuer context" hint="Sector selector auto-loads MSCI key issues with sector weights and sets peer = sector median.">
            <FieldRow label="Issuer"><TextInput value={s.issuer} onChange={v => sc.update({ issuer: v })} style={{ width: 320 }} /></FieldRow>
            <FieldRow label="Sector">
              <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                <SelectInput value={s.sector} onChange={loadSector} options={SECTORS} style={{ width: 260 }} />
                <button onClick={() => loadSector(s.sector)} style={{ background: T.surfaceH, color: T.gold, border: `1px solid ${T.border}`, padding: '4px 10px', fontSize: 11, cursor: 'pointer', borderRadius: 2, fontFamily: T.mono }}>↻ reload issues</button>
              </span>
            </FieldRow>
            <FieldRow label="Passive AUM tracked" hint="For unlock estimate — index-inclusion AUM"><NumInput value={s.aumPassive} onChange={v => sc.update({ aumPassive: v })} step={100} suffix="$ M" /></FieldRow>
            <Note level="info">Sector median (MSCI-equivalent, 2024): <b style={{ color: T.gold }}>{sectorMedian} ({medianLetter})</b> · Your score percentile: <b style={{ color: percentile >= 50 ? T.green : T.amber }}>{percentile}th</b></Note>
          </Step>

          <Step n={2} title="Current issue scoring" hint="Enter current score (0–100) per MSCI key issue alongside peer median.">
            <Worksheet
              cols={[
                { h: 'Issue', width: '2fr', edit: (r, i) => <TextInput value={r.issue} onChange={v => updIssue(i, 'issue', v)} style={{ width: '100%' }} /> },
                { h: 'Weight %', width: '90px', edit: (r, i) => <NumInput value={r.weight} onChange={v => updIssue(i, 'weight', v)} style={{ width: 60 }} /> },
                { h: 'Current', width: '80px', edit: (r, i) => <NumInput value={r.current} onChange={v => updIssue(i, 'current', v)} style={{ width: 60 }} /> },
                { h: 'Peer', width: '80px', edit: (r, i) => <NumInput value={r.peer} onChange={v => updIssue(i, 'peer', v)} style={{ width: 60 }} /> },
                { h: 'Gap', width: '70px', edit: (r) => {
                    const d = r.current - r.peer;
                    return <span style={{ fontFamily: T.mono, fontSize: 12, color: d >= 0 ? T.green : T.red }}>{d > 0 ? '+' : ''}{d.toFixed(0)}</span>;
                  } },
              ]}
              rows={s.issues}
              onAdd={() => sc.update({ issues: [...s.issues, { _id: Date.now(), issue: 'New issue', weight: 5, current: 50, peer: 55 }] })}
              onDel={(i) => sc.update({ issues: s.issues.filter((_, j) => j !== i) })}
            />
            {totalW !== 100 && <Note level="warn">Weights sum to {totalW}% — should total 100%.</Note>}
          </Step>

          <Step n={3} title="Remediation actions" hint="Append from the PRI engagement library or edit inline. Plan auto-sorts by ROI (uplift / cost).">
            <Collapsible title="PRI engagement library (click to append)" defaultOpen>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {PRI_UPLIFT_LIBRARY.map(a => (
                  <button key={a.action} onClick={() => addPriAction(a)} style={{ background: T.surfaceH, color: T.gold, border: `1px solid ${T.border}`, padding: '4px 10px', fontSize: 10, cursor: 'pointer', borderRadius: 2, fontFamily: T.mono }}>
                    + {a.action} <span style={{ color: T.textMut }}>({a.uplift}pt / ${a.costMn}M)</span>
                  </button>
                ))}
              </div>
            </Collapsible>
            <Worksheet
              cols={[
                { h: 'Action', width: '2.2fr', edit: (r, i) => <TextInput value={r.action} onChange={v => updAct(i, 'action', v)} style={{ width: '100%' }} /> },
                { h: 'Target issue', width: '1.4fr', edit: (r, i) => <TextInput value={r.issue} onChange={v => updAct(i, 'issue', v)} style={{ width: '100%' }} /> },
                { h: 'Uplift', width: '70px', edit: (r, i) => <NumInput value={r.uplift} onChange={v => updAct(i, 'uplift', v)} style={{ width: 50 }} /> },
                { h: 'Cost $M', width: '90px', edit: (r, i) => <NumInput value={r.costMn} onChange={v => updAct(i, 'costMn', v)} step={0.1} style={{ width: 64 }} /> },
                { h: 'Months', width: '70px', edit: (r, i) => <NumInput value={r.months} onChange={v => updAct(i, 'months', v)} style={{ width: 50 }} /> },
                { h: 'ROI', width: '70px', edit: (r) => <span style={{ fontFamily: T.mono, color: T.gold, fontSize: 12 }}>{(r.costMn > 0 ? r.uplift / r.costMn : 0).toFixed(1)}</span> },
              ]}
              rows={s.actions}
              onAdd={() => sc.update({ actions: [...s.actions, { _id: Date.now(), action: 'New action', issue: 'Corporate Governance', uplift: 5, costMn: 0.3, months: 6 }] })}
              onDel={(i) => sc.update({ actions: s.actions.filter((_, j) => j !== i) })}
            />
          </Step>

          <Step n={4} title="AUM unlock curves" hint="Passive flow multipliers calibrated to index-inclusion cutoffs.">
            <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
              <thead><tr style={{ color: T.textMut }}><th style={{ padding: 4, textAlign: 'left' }}>Index</th><th style={{ padding: 4 }}>Cutoff letter</th><th style={{ padding: 4 }}>% flow / notch</th><th style={{ padding: 4 }}>Projected unlock</th></tr></thead>
              <tbody>{Object.entries(AUM_UNLOCK).map(([name, cfg]) => {
                const eligible = LETTERS.indexOf(projectedLetter) >= LETTERS.indexOf(cfg.cutoffLetter);
                const unlock = eligible && uplifts > 0 ? s.aumPassive * (cfg.flowPctPerNotch / 100) * uplifts : 0;
                return <tr key={name} style={{ borderTop: `1px solid ${T.borderL}`, fontFamily: T.mono }}>
                  <td style={{ padding: 4, fontFamily: T.font, color: T.textSec }}>{name}</td>
                  <td style={{ padding: 4, textAlign: 'center' }}>{cfg.cutoffLetter}</td>
                  <td style={{ padding: 4, textAlign: 'right' }}>{cfg.flowPctPerNotch}</td>
                  <td style={{ padding: 4, color: eligible ? T.green : T.textMut, textAlign: 'right' }}>{eligible ? `$${unlock.toFixed(1)}M` : 'not eligible'}</td>
                </tr>;
              })}</tbody>
            </table>
          </Step>

          <Step n={5} title="Generate roadmap">
            {!ready && <Note level="bad">Add issuer and ≥5 scored issues.</Note>}
            {ready && <Note level="ok">Ready. Roadmap is sorted by cost-per-uplift-point (quick wins first).</Note>}
          </Step>
        </>
      }
      rail={
        <OutputRail
          label="LIVE RATING PATH"
          stats={[
            { label: 'Current', value: currentLetter, sub: currentScore.toFixed(1), color: T.amber },
            { label: 'Projected', value: projectedLetter, sub: projectedScore.toFixed(1), color: uplifts > 0 ? T.green : T.textSec },
            { label: 'Peer gap', value: gap.toFixed(1), sub: 'pts below', color: T.textSec },
            { label: 'AUM unlock', value: `$${aumUnlock.toFixed(0)}M`, sub: `+${uplifts} notch${uplifts !== 1 ? 'es' : ''}`, color: T.green },
          ]}
          preview={
            <div>
              <div><b style={{ color: T.text }}>{s.issuer}</b></div>
              <div style={{ marginTop: 4 }}>{s.actions.length} remediation actions · ${totalCost.toFixed(1)}M total cost</div>
              <div>Top action: <i>{plan[0]?.action || '—'}</i></div>
            </div>
          }
          cta={<PrimaryCTA onClick={onDeliver}>Generate Uplift Roadmap →</PrimaryCTA>}
          menu={
            <ToolMenu
              scenario={sc}
              onExportCsv={() => downloadText('esg-remediation.csv', toCsv(plan), 'text/csv')}
              onExportJson={() => downloadText('esg-uplift.json', JSON.stringify(s, null, 2), 'application/json')}
              onImportCsv={(r) => sc.update({ actions: r.map((x, i) => ({ _id: Date.now() + i, action: x.action || 'Action', issue: x.issue || '', uplift: +x.uplift || 0, costMn: +x.costMn || 0, months: +x.months || 6 })) })}
              importLabel="Import actions CSV"
            />
          }
        />
      }
    />
  );
}
