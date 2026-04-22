import React, { useMemo } from 'react';
import {
  T, useScenario, openDeliverable, toCsv, downloadText, html,
  ToolShell, Step, OutputRail, PrimaryCTA, ToolMenu,
  FieldRow, Worksheet, NumInput, TextInput, SelectInput, Collapsible, Note, PageHeader,
  Gantt, Heatmap, ProgressRing, Sparkline
} from '../../_shared/AdvisoryToolkit';
import {
  MSCI_ISSUE_WEIGHTS, SECTOR_MEDIAN_SCORES, PRI_UPLIFT_LIBRARY, AUM_UNLOCK,
  AGENCY_CROSSWALK, controversyImpact, CONTROVERSY_CATEGORIES, INDEX_ELIGIBILITY, ACTION_DEPS
} from '../../_shared/AdvisoryReference';

const SECTORS = Object.keys(MSCI_ISSUE_WEIGHTS);

const letterForAgency = (agency, score) => {
  const bands = AGENCY_CROSSWALK[agency] || [];
  for (const [mn, mx, letter] of bands) if (score >= mn && score <= mx) return letter;
  return bands[bands.length - 1]?.[2] || '—';
};

const DEFAULTS = {
  issuer: 'ACME Group',
  sector: 'Utilities — Renewables',
  aumPassive: 4500,
  controversy: { level: 'Low', category: 'Environmental - climate', details: 'One regional water permit dispute, resolved 2024' },
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
    { _id: 1, action: 'TCFD-aligned climate report', issue: 'Climate Risk Exposure', uplift: 12, costMn: 0.8, months: 6, start: 0 },
    { _id: 2, action: 'SBTi 1.5°C validation', issue: 'Carbon Emissions', uplift: 18, costMn: 1.2, months: 9, start: 3 },
    { _id: 3, action: 'Water-positive pledge + disclosure', issue: 'Water Stress', uplift: 10, costMn: 0.4, months: 4, start: 0 },
    { _id: 4, action: 'Supplier ESG audit programme', issue: 'Supply Chain Labour', uplift: 14, costMn: 1.5, months: 12, start: 6 },
    { _id: 5, action: 'Board ESG committee formalisation', issue: 'Corporate Governance', uplift: 6, costMn: 0.2, months: 3, start: 0 },
    { _id: 6, action: 'Scope 3 Cat 11 disclosure', issue: 'Carbon Emissions', uplift: 5, costMn: 0.3, months: 4, start: 0 },
  ],
};

export default function EsgRatingsUpliftPage() {
  const sc = useScenario('esg-uplift', DEFAULTS);
  const s = sc.state;

  const totalW = s.issues.reduce((x, i) => x + i.weight, 0) || 1;
  const currentScoreRaw = s.issues.reduce((x, i) => x + i.current * i.weight, 0) / totalW;
  const peerScore = s.issues.reduce((x, i) => x + i.peer * i.weight, 0) / totalW;
  const controvAdj = controversyImpact(s.controversy.level);
  const currentScore = Math.max(0, Math.min(100, currentScoreRaw + controvAdj));
  const gap = peerScore - currentScore;

  const plan = useMemo(() => [...s.actions].map(a => ({ ...a, roi: a.costMn > 0 ? a.uplift / a.costMn : 0 })).sort((a, b) => b.roi - a.roi), [s.actions]);
  const totalUplift = plan.reduce((x, a) => x + a.uplift, 0) * (totalW > 0 ? 15 / totalW : 0);
  const projectedScore = Math.min(100, currentScore + totalUplift);
  const totalCost = plan.reduce((x, a) => x + a.costMn, 0);

  // Multi-agency crosswalk
  const agencyCurrent = useMemo(() => Object.keys(AGENCY_CROSSWALK).reduce((x, ag) => {
    x[ag] = letterForAgency(ag, currentScore); return x;
  }, {}), [currentScore]);
  const agencyProjected = useMemo(() => Object.keys(AGENCY_CROSSWALK).reduce((x, ag) => {
    x[ag] = letterForAgency(ag, projectedScore); return x;
  }, {}), [projectedScore]);

  // MSCI-style letter for notch-based AUM math (use MSCI crosswalk)
  const MSCI_ORDER = AGENCY_CROSSWALK.MSCI.map(b => b[2]);
  const curMsciIdx = MSCI_ORDER.indexOf(agencyCurrent.MSCI);
  const projMsciIdx = MSCI_ORDER.indexOf(agencyProjected.MSCI);
  const uplifts = Math.max(0, projMsciIdx - curMsciIdx);

  // Dependency/critical path resolution
  const depResolution = useMemo(() => {
    const actionNames = s.actions.map(a => a.action);
    const issues = [];
    s.actions.forEach(a => {
      const deps = ACTION_DEPS[a.action] || [];
      deps.forEach(d => {
        const depAct = s.actions.find(x => x.action === d);
        if (!depAct) {
          issues.push({ action: a.action, missing: d, type: 'missing' });
        } else if (depAct.start >= a.start) {
          issues.push({ action: a.action, missing: d, type: 'order', depStart: depAct.start });
        }
      });
    });
    return issues;
  }, [s.actions]);

  // Index eligibility matrix
  const indexElig = useMemo(() => Object.entries(INDEX_ELIGIBILITY).map(([name, cfg]) => {
    const curEligible = currentScore >= cfg.minScore && !controversyExceeds(s.controversy.level, cfg.excludeControv);
    const projEligible = projectedScore >= cfg.minScore && !controversyExceeds(s.controversy.level, cfg.excludeControv);
    const unlock = projEligible && !curEligible ? s.aumPassive * (cfg.flowPctPerNotch / 100) * 3 : (projEligible ? s.aumPassive * (cfg.flowPctPerNotch / 100) * uplifts : 0);
    return { name, cfg, curEligible, projEligible, unlock };
  }), [currentScore, projectedScore, s.controversy.level, s.aumPassive, uplifts]);
  const totalIndexUnlock = indexElig.reduce((x, r) => x + r.unlock, 0);

  const sectorMedian = SECTOR_MEDIAN_SCORES[s.sector] ?? 55;
  const percentile = Math.round(Math.max(0, Math.min(100, 50 + (currentScore - sectorMedian) * 2)));

  const ready = s.issues.length >= 5 && s.issuer.trim();

  const updIssue = (i, k, v) => sc.update({ issues: s.issues.map((x, j) => j === i ? { ...x, [k]: v } : x) });
  const updAct = (i, k, v) => sc.update({ actions: s.actions.map((x, j) => j === i ? { ...x, [k]: v } : x) });

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
  const addPriAction = (a) => {
    sc.update({ actions: [...s.actions, { _id: Date.now(), action: a.action, issue: a.issue, uplift: a.uplift, costMn: a.costMn, months: a.months, start: Math.max(...s.actions.map(x => (x.start || 0) + x.months), 0) / 2 }] });
  };

  // Engagement Gantt
  const ganttTasks = useMemo(() => {
    const colors = [T.teal, T.gold, T.sage, T.amber, T.green, T.navyL];
    return plan.map((a, i) => ({ label: a.action, start: a.start || 0, duration: a.months, color: colors[i % colors.length] }));
  }, [plan]);
  const ganttSpan = Math.max(...plan.map(a => (a.start || 0) + a.months), 12);

  const onDeliver = () => {
    const body = [
      html.h1(`ESG Ratings Uplift Roadmap — ${s.issuer}`),
      html.meta({ Sector: s.sector, MSCI: `${agencyCurrent.MSCI}→${agencyProjected.MSCI}`, Sustainalytics: `${agencyCurrent.Sustainalytics}→${agencyProjected.Sustainalytics}`, Generated: new Date().toLocaleDateString() }),
      html.h2('1. Starting Position'),
      html.p(`Raw weighted score: <b>${currentScoreRaw.toFixed(1)}</b> · Controversy adj (${s.controversy.level}): <b>${controvAdj.toFixed(1)}</b> → Effective: <b>${currentScore.toFixed(1)}</b>`),
      html.p(`Peer median: ${peerScore.toFixed(1)} · Sector median: ${sectorMedian} · Percentile: <b>${percentile}</b>th`),
      html.h2('2. Multi-Agency Crosswalk'),
      html.table(['Agency', 'Current', 'Projected', 'Notch change'],
        Object.keys(AGENCY_CROSSWALK).map(ag => [ag, agencyCurrent[ag], agencyProjected[ag], agencyCurrent[ag] === agencyProjected[ag] ? '—' : '↑'])),
      html.h2('3. Controversy Overlay'),
      html.p(`Category: <b>${s.controversy.category}</b> · Severity: <b>${s.controversy.level}</b> (${controvAdj} pts). ${s.controversy.details}`),
      html.h2('4. Issue-Level Scoring'),
      html.table(['Issue', 'Wt %', 'Current', 'Peer', 'Δ'],
        s.issues.map(i => [i.issue, i.weight, i.current, i.peer, (i.current - i.peer).toFixed(0)])),
      html.h2('5. Remediation Plan (sorted by ROI)'),
      html.table(['#', 'Action', 'Target', 'Uplift', '$M', 'Mo', 'Start', 'ROI'],
        plan.map((a, i) => [i + 1, a.action, a.issue, a.uplift, a.costMn.toFixed(2), a.months, `m${a.start || 0}`, a.roi.toFixed(1)])),
      depResolution.length ? html.p(html.badge('amber', `${depResolution.length} dependency issues`)) : '',
      depResolution.length ? html.table(['Action', 'Missing prerequisite', 'Type'], depResolution.map(d => [d.action, d.missing, d.type])) : '',
      html.h2('6. Index Eligibility Matrix'),
      html.table(['Index', 'Min score', 'Controv. cap', 'Current', 'Projected', 'AUM unlock'],
        indexElig.map(r => [r.name, r.cfg.minScore, r.cfg.excludeControv, r.curEligible ? '✓' : '✗', r.projEligible ? '✓' : '✗', `$${r.unlock.toFixed(1)}M`])),
      html.p(`Total projected AUM unlock across indices: <b>$${totalIndexUnlock.toFixed(0)}M</b>.`),
      html.h2('7. Projected Outcome'),
      html.p(`Projected score: <b>${projectedScore.toFixed(1)}</b> · MSCI: <b>${agencyCurrent.MSCI} → ${agencyProjected.MSCI}</b> (${uplifts > 0 ? html.badge('green', `+${uplifts} notch`) : html.badge('amber', 'no change')})`),
      html.p(`Total investment: $${totalCost.toFixed(2)}M. Critical-path duration: ${ganttSpan} months.`),
      html.h2('8. Engagement Playbook'),
      html.p('1) Pre-engagement briefing with rating agencies (MSCI, Sustainalytics, ISS, CDP) · 2) Data room preparation · 3) Rationale memo per issue uplift · 4) Post-action re-submission with evidence pack.'),
    ].join('');
    openDeliverable(body, `Ratings Uplift — ${s.issuer}`);
  };

  return (
    <ToolShell
      header={<PageHeader code="EP-EB4 · Ratings Uplift" title="ESG Rating Improvement Tool" subtitle="Multi-agency crosswalk (MSCI/Sustainalytics/ISS/CDP), controversy overlay, ROI-prioritised remediation with dependency checks, index eligibility matrix, engagement Gantt." />}
      steps={
        <>
          <Step n={1} title="Issuer context" hint="Sector selector auto-loads MSCI key issues with sector weights.">
            <FieldRow label="Issuer"><TextInput value={s.issuer} onChange={v => sc.update({ issuer: v })} style={{ width: 320 }} /></FieldRow>
            <FieldRow label="Sector">
              <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                <SelectInput value={s.sector} onChange={loadSector} options={SECTORS} style={{ width: 260 }} />
                <button onClick={() => loadSector(s.sector)} style={{ background: T.surfaceH, color: T.gold, border: `1px solid ${T.border}`, padding: '4px 10px', fontSize: 11, cursor: 'pointer', borderRadius: 2, fontFamily: T.mono }}>↻ reload</button>
              </span>
            </FieldRow>
            <FieldRow label="Passive AUM tracked"><NumInput value={s.aumPassive} onChange={v => sc.update({ aumPassive: v })} step={100} suffix="$ M" /></FieldRow>
            <Note level="info">Sector median: <b style={{ color: T.gold }}>{sectorMedian}</b> · Your percentile: <b style={{ color: percentile >= 50 ? T.green : T.amber }}>{percentile}th</b></Note>
          </Step>

          <Step n={2} title="Controversy overlay" hint="Severity applies an agency-standard score penalty (MSCI-style).">
            <FieldRow label="Category"><SelectInput value={s.controversy.category} onChange={v => sc.update({ controversy: { ...s.controversy, category: v } })} options={CONTROVERSY_CATEGORIES} style={{ width: 300 }} /></FieldRow>
            <FieldRow label="Severity"><SelectInput value={s.controversy.level} onChange={v => sc.update({ controversy: { ...s.controversy, level: v } })} options={['None', 'Low', 'Medium', 'High', 'Severe']} /></FieldRow>
            <FieldRow label="Score impact"><span style={{ fontFamily: T.mono, color: controvAdj < 0 ? T.red : T.textSec }}>{controvAdj} points</span></FieldRow>
            <FieldRow label="Details"><TextInput value={s.controversy.details} onChange={v => sc.update({ controversy: { ...s.controversy, details: v } })} style={{ width: 400 }} /></FieldRow>
          </Step>

          <Step n={3} title="Current issue scoring">
            <Worksheet
              cols={[
                { h: 'Issue', width: '2fr', edit: (r, i) => <TextInput value={r.issue} onChange={v => updIssue(i, 'issue', v)} style={{ width: '100%' }} /> },
                { h: 'Wt %', width: '70px', edit: (r, i) => <NumInput value={r.weight} onChange={v => updIssue(i, 'weight', v)} style={{ width: 52 }} /> },
                { h: 'Current', width: '80px', edit: (r, i) => <NumInput value={r.current} onChange={v => updIssue(i, 'current', v)} style={{ width: 60 }} /> },
                { h: 'Peer', width: '70px', edit: (r, i) => <NumInput value={r.peer} onChange={v => updIssue(i, 'peer', v)} style={{ width: 52 }} /> },
                { h: 'Gap', width: '60px', edit: (r) => {
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

          <Step n={4} title="Multi-agency crosswalk" hint="Same 0-100 score mapped to letter bands across 4 major agencies.">
            <Heatmap
              data={[
                [curMsciIdx, sortIdx('Sustainalytics', agencyCurrent.Sustainalytics), sortIdx('ISS', agencyCurrent.ISS), sortIdx('CDP', agencyCurrent.CDP)],
                [projMsciIdx, sortIdx('Sustainalytics', agencyProjected.Sustainalytics), sortIdx('ISS', agencyProjected.ISS), sortIdx('CDP', agencyProjected.CDP)],
              ]}
              rows={['Current', 'Projected']}
              cols={['MSCI', 'Sustainalytics', 'ISS', 'CDP']}
              fmt={() => ''}
              min={0}
              max={8}
              loColor={T.red}
              hiColor={T.green}
            />
            <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse', marginTop: 12 }}>
              <thead><tr style={{ color: T.textMut, textAlign: 'left' }}><th style={{ padding: 6 }}>Agency</th><th>Current</th><th>Projected</th></tr></thead>
              <tbody>{Object.keys(AGENCY_CROSSWALK).map(ag => (
                <tr key={ag} style={{ borderTop: `1px solid ${T.borderL}`, fontFamily: T.mono }}>
                  <td style={{ padding: 6, fontFamily: T.font, color: T.textSec }}>{ag}</td>
                  <td style={{ padding: 6, color: T.amber }}>{agencyCurrent[ag]}</td>
                  <td style={{ padding: 6, color: T.green }}>{agencyProjected[ag]}</td>
                </tr>))}
              </tbody>
            </table>
          </Step>

          <Step n={5} title="Remediation actions" hint="Append from PRI library or edit. Auto-sorted by ROI.">
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
                { h: 'Target', width: '1.3fr', edit: (r, i) => <TextInput value={r.issue} onChange={v => updAct(i, 'issue', v)} style={{ width: '100%' }} /> },
                { h: 'Uplift', width: '70px', edit: (r, i) => <NumInput value={r.uplift} onChange={v => updAct(i, 'uplift', v)} style={{ width: 50 }} /> },
                { h: 'Cost $M', width: '85px', edit: (r, i) => <NumInput value={r.costMn} onChange={v => updAct(i, 'costMn', v)} step={0.1} style={{ width: 60 }} /> },
                { h: 'Mo', width: '55px', edit: (r, i) => <NumInput value={r.months} onChange={v => updAct(i, 'months', v)} style={{ width: 42 }} /> },
                { h: 'Start m', width: '65px', edit: (r, i) => <NumInput value={r.start || 0} onChange={v => updAct(i, 'start', v)} style={{ width: 48 }} /> },
                { h: 'ROI', width: '55px', edit: (r) => <span style={{ fontFamily: T.mono, color: T.gold, fontSize: 12 }}>{(r.costMn > 0 ? r.uplift / r.costMn : 0).toFixed(1)}</span> },
              ]}
              rows={s.actions}
              onAdd={() => sc.update({ actions: [...s.actions, { _id: Date.now(), action: 'New action', issue: 'Corporate Governance', uplift: 5, costMn: 0.3, months: 6, start: 0 }] })}
              onDel={(i) => sc.update({ actions: s.actions.filter((_, j) => j !== i) })}
            />
            {depResolution.length > 0 && (
              <Note level="warn">
                <b>{depResolution.length} dependency issue{depResolution.length > 1 ? 's' : ''}:</b> {depResolution.map(d => `"${d.action}" needs "${d.missing}" (${d.type})`).join(' · ')}
              </Note>
            )}
          </Step>

          <Step n={6} title="Engagement Gantt" hint="Months from project start. Critical path = longest finish time.">
            <Gantt tasks={ganttTasks} totalSpan={ganttSpan} />
            <Note level="info">Span to completion: <b>{ganttSpan} months</b>. Sequencing respects ACTION_DEPS prerequisite graph.</Note>
          </Step>

          <Step n={7} title="Index eligibility matrix" hint="Combines min score + controversy cap per major index.">
            <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
              <thead><tr style={{ color: T.textMut }}><th style={{ padding: 4, textAlign: 'left' }}>Index</th><th>Min</th><th>Controv cap</th><th>Current</th><th>Projected</th><th>Flow %/notch</th><th>Unlock $M</th></tr></thead>
              <tbody>{indexElig.map(r => (
                <tr key={r.name} style={{ borderTop: `1px solid ${T.borderL}`, fontFamily: T.mono }}>
                  <td style={{ padding: 4, fontFamily: T.font, color: T.textSec }}>{r.name}</td>
                  <td style={{ padding: 4, textAlign: 'center' }}>{r.cfg.minScore}</td>
                  <td style={{ padding: 4, textAlign: 'center' }}>{r.cfg.excludeControv}</td>
                  <td style={{ padding: 4, textAlign: 'center', color: r.curEligible ? T.green : T.red }}>{r.curEligible ? '✓' : '✗'}</td>
                  <td style={{ padding: 4, textAlign: 'center', color: r.projEligible ? T.green : T.red }}>{r.projEligible ? '✓' : '✗'}</td>
                  <td style={{ padding: 4, textAlign: 'right' }}>{r.cfg.flowPctPerNotch}</td>
                  <td style={{ padding: 4, textAlign: 'right', color: r.unlock > 0 ? T.green : T.textMut }}>${r.unlock.toFixed(1)}</td>
                </tr>))}
              </tbody>
            </table>
            <Note level="info">Total projected AUM unlock: <b style={{ color: T.green }}>${totalIndexUnlock.toFixed(0)}M</b></Note>
          </Step>

          <Step n={8} title="Generate roadmap">
            {!ready && <Note level="bad">Add issuer and ≥5 scored issues.</Note>}
            {ready && <Note level="ok">Ready. Roadmap covers multi-agency crosswalk, controversy, dependencies, index unlock, and Gantt.</Note>}
          </Step>
        </>
      }
      rail={
        <OutputRail
          label="LIVE RATING PATH"
          stats={[
            { label: 'MSCI now', value: agencyCurrent.MSCI, sub: currentScore.toFixed(0), color: T.amber },
            { label: 'MSCI → ', value: agencyProjected.MSCI, sub: projectedScore.toFixed(0), color: T.green },
            { label: 'Index unlock', value: `$${totalIndexUnlock.toFixed(0)}M`, sub: `+${uplifts} notch${uplifts !== 1 ? 'es' : ''}`, color: T.green },
            { label: 'Controv', value: s.controversy.level, sub: `${controvAdj} pts`, color: controvAdj < 0 ? T.red : T.textSec },
          ]}
          preview={
            <div>
              <div><b style={{ color: T.text }}>{s.issuer}</b></div>
              <div style={{ marginTop: 4 }}>Sus: {agencyCurrent.Sustainalytics}→{agencyProjected.Sustainalytics} · ISS: {agencyCurrent.ISS}→{agencyProjected.ISS} · CDP: {agencyCurrent.CDP}→{agencyProjected.CDP}</div>
              <div>{s.actions.length} actions · ${totalCost.toFixed(1)}M cost</div>
              <div>Top: <i>{plan[0]?.action || '—'}</i></div>
              <div style={{ marginTop: 6 }}><ProgressRing pct={percentile} size={48} color={T.gold} label="Pctile" /></div>
            </div>
          }
          cta={<PrimaryCTA onClick={onDeliver}>Generate Uplift Roadmap →</PrimaryCTA>}
          menu={
            <ToolMenu
              scenario={sc}
              onExportCsv={() => downloadText('esg-remediation.csv', toCsv(plan), 'text/csv')}
              onExportJson={() => downloadText('esg-uplift.json', JSON.stringify(s, null, 2), 'application/json')}
              onImportCsv={(r) => sc.update({ actions: r.map((x, i) => ({ _id: Date.now() + i, action: x.action || 'Action', issue: x.issue || '', uplift: +x.uplift || 0, costMn: +x.costMn || 0, months: +x.months || 6, start: +x.start || 0 })) })}
              importLabel="Import actions CSV"
            />
          }
        />
      }
    />
  );
}

// helpers
function sortIdx(agency, letter) {
  const bands = AGENCY_CROSSWALK[agency] || [];
  const idx = bands.findIndex(b => b[2] === letter);
  return idx >= 0 ? idx : 0;
}
function controversyExceeds(level, cap) {
  const order = ['None', 'Low', 'Medium', 'High', 'Severe'];
  return order.indexOf(level) >= order.indexOf(cap);
}
