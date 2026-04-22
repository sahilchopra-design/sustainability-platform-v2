import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend } from 'recharts';
import { T, useScenario, ToolkitBar, NumInput, TextInput, Kpi, Panel, Table, td, TabBar, PageHeader, Badge, downloadText, toCsv, openDeliverable, html } from '../../_shared/AdvisoryToolkit';

const LETTERS = ['CCC', 'B', 'BB', 'BBB', 'A', 'AA', 'AAA'];
const letterFromScore = (s) => LETTERS[Math.max(0, Math.min(6, Math.floor(s / 10)))];

const DEFAULTS = {
  issuerName: 'Integrated RE-IPP Client (anonymised)',
  targetLetter: 'A',
  passiveAumUnlock: 12000,
  issues: [
    { issue: 'Carbon emissions', weight: 14, score: 52, peer: 68, cost: 12, months: 12 },
    { issue: 'Climate risk mgmt', weight: 12, score: 48, peer: 65, cost: 8, months: 9 },
    { issue: 'Renewable energy', weight: 10, score: 72, peer: 70, cost: 2, months: 3 },
    { issue: 'Water stress', weight: 8, score: 55, peer: 62, cost: 5, months: 9 },
    { issue: 'Biodiversity & land use', weight: 7, score: 38, peer: 50, cost: 15, months: 18 },
    { issue: 'Labour mgmt', weight: 8, score: 64, peer: 66, cost: 3, months: 6 },
    { issue: 'Health & safety', weight: 7, score: 58, peer: 64, cost: 6, months: 9 },
    { issue: 'Community relations', weight: 6, score: 55, peer: 60, cost: 4, months: 9 },
    { issue: 'Supply chain labour', weight: 8, score: 45, peer: 55, cost: 10, months: 15 },
    { issue: 'Governance', weight: 12, score: 61, peer: 68, cost: 6, months: 9 },
    { issue: 'Business ethics', weight: 8, score: 60, peer: 64, cost: 4, months: 6 },
  ],
  sustainalytics: { score: 28.4, target: 18.0 },
};

const TABS = ['Inputs & Issues', 'Rating Gap', 'Remediation Plan', 'Passive AUM Unlock', 'Engagement Playbook', 'Deliverables'];

export default function EsgRatingsUpliftPage() {
  const sc = useScenario('eb4_ratings', DEFAULTS);
  const [tab, setTab] = useState(0);
  const s = sc.state;

  const weighted = useMemo(() => {
    const sumW = s.issues.reduce((a, x) => a + x.weight, 0);
    const wScore = s.issues.reduce((a, x) => a + x.score * x.weight, 0) / Math.max(1, sumW);
    const wPeer = s.issues.reduce((a, x) => a + x.peer * x.weight, 0) / Math.max(1, sumW);
    const totalCost = s.issues.reduce((a, x) => a + x.cost, 0);
    return { wScore, wPeer, totalCost, sumW };
  }, [s.issues]);
  const currentLetter = letterFromScore(weighted.wScore);
  const targetScore = LETTERS.indexOf(s.targetLetter) * 10 + 5;
  const gapPoints = Math.max(0, targetScore - weighted.wScore);
  const remediation = useMemo(() => [...s.issues].map(x => ({ ...x, gap: Math.max(0, x.peer - x.score), uplift: Math.max(0, x.peer - x.score) * x.weight / 100, cpi: x.cost / Math.max(0.01, Math.max(0, x.peer - x.score)) })).sort((a, b) => a.cpi - b.cpi), [s.issues]);

  const upd = (i, k, v) => sc.update(st => ({ issues: st.issues.map((x, j) => j === i ? { ...x, [k]: v } : x) }));
  const addIss = () => sc.update(st => ({ issues: [...st.issues, { issue: 'New issue', weight: 0, score: 0, peer: 0, cost: 0, months: 0 }] }));
  const delIss = (i) => sc.update(st => ({ issues: st.issues.filter((_, j) => j !== i) }));

  const exportCsv = () => downloadText(`EB4_ratings_${sc.scenarioName}.csv`, toCsv(remediation.map(r => ({
    issue: r.issue, weight_pct: r.weight, current_score: r.score, peer_score: r.peer, gap: r.gap, weighted_uplift: +r.uplift.toFixed(2), cost_cr: r.cost, months: r.months, cost_per_uplift: +r.cpi.toFixed(2),
  }))), 'text/csv');
  const exportJson = () => downloadText(`EB4_${sc.scenarioName}.json`, JSON.stringify({ module: 'EB4', state: s, weighted }, null, 2), 'application/json');

  const generateRoadmap = () => {
    const content = [
      html.h1('ESG Ratings Uplift Roadmap'),
      html.meta({ Issuer: s.issuerName, 'Current (MSCI-equivalent)': currentLetter, Target: s.targetLetter, Scenario: sc.scenarioName }),
      html.h2('Executive Summary'),
      html.kpi('Weighted current score', weighted.wScore.toFixed(1)) + html.kpi('Target score', targetScore.toFixed(1)) + html.kpi('Gap (points)', gapPoints.toFixed(1)) + html.kpi('Total remediation cost', `₹${weighted.totalCost.toFixed(1)} Cr`) + html.kpi('Passive AUM unlock', `${s.passiveAumUnlock.toLocaleString()} $Bn (at BBB+)`),
      html.h2('1. Current Rating Snapshot'),
      html.p(`Weighted MSCI-equivalent score <b>${weighted.wScore.toFixed(1)}</b> (${currentLetter}) vs peer-median <b>${weighted.wPeer.toFixed(1)}</b>. Sustainalytics residual: <b>${s.sustainalytics.score}</b> (target ${s.sustainalytics.target}).`),
      html.h2('2. Issue-Level Gap Analysis'),
      html.table(['Issue', 'Weight %', 'Score', 'Peer', 'Gap', 'Wtd uplift', '₹Cr', 'Months'], remediation.map(r => [r.issue, r.weight, r.score, r.peer, r.gap, r.uplift.toFixed(2), r.cost, r.months])),
      html.h2('3. Remediation Sequencing (Cost per Uplift Point)'),
      html.p('Issues sorted by cost-per-uplift-point (ascending). Quick wins: renewable energy (+0 gap already ahead), labour/governance. High-leverage: carbon emissions, climate risk mgmt, biodiversity. Most expensive per uplift: biodiversity (long-tenor, requires LEAP, field surveys, mitigation).'),
      html.h2('4. Passive Flow Unlock'),
      html.p(`MSCI ACWI SRI / FTSE4Good / DJSI index thresholds at BBB+ (score ≥35). Estimated passive AUM eligible: <b>$${s.passiveAumUnlock.toLocaleString()} Bn</b>. Sustainalytics "Medium Risk" (<20) unlocks additional active-ESG mandates.`),
      html.h2('5. Engagement Playbook'),
      html.p('Schedule MSCI / Sustainalytics consultative meetings at Q+1 post-remediation-milestone. Submit corrected controversies (1–2y lookback). Engage with Proxinvest, ISS on governance. Prepare 40–60-slide Analyst Day covering Scope 3, climate transition plan, biodiversity LEAP.'),
    ].join('');
    openDeliverable(content, `ESG Uplift Roadmap — ${s.issuerName}`);
  };

  const radarData = s.issues.map(x => ({ issue: x.issue.length > 18 ? x.issue.substring(0, 17) + '…' : x.issue, current: x.score, peer: x.peer }));

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: T.font, color: T.text, padding: '28px 40px' }}>
      <PageHeader code="EP-EB4" title="ESG Ratings Uplift Programme" subtitle={`${s.issuerName} · MSCI ESG · Sustainalytics · Issue-weighted · Remediation cost engine`} />
      <ToolkitBar moduleCode="EB4" scenario={sc} onExportCsv={exportCsv} onExportJson={exportJson} onDeliverable={generateRoadmap}
        importLabel="Import Issues CSV"
        onImportCsv={(rows) => { if (rows.length) sc.update({ issues: rows.map(r => ({
          issue: r.issue, weight: Number(r.weight_pct || r.weight) || 0, score: Number(r.current_score || r.score) || 0, peer: Number(r.peer_score || r.peer) || 0, cost: Number(r.cost_cr || r.cost) || 0, months: Number(r.months) || 0,
        })) }); }} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 18 }}>
        <Kpi label="Current rating" value={currentLetter} sub={`Score ${weighted.wScore.toFixed(1)}`} color={T.amber} />
        <Kpi label="Target rating" value={s.targetLetter} sub={`Score ${targetScore}`} color={T.green} />
        <Kpi label="Gap to target" value={`${gapPoints.toFixed(1)} pts`} sub={gapPoints === 0 ? 'Met' : 'Remaining'} color={gapPoints > 0 ? T.red : T.green} />
        <Kpi label="Total cost" value={`₹${weighted.totalCost.toFixed(1)} Cr`} sub={`${s.issues.length} issues`} color={T.gold} />
        <Kpi label="Passive AUM unlock" value={`$${s.passiveAumUnlock.toLocaleString()} Bn`} sub="At BBB+ threshold" />
      </div>

      <TabBar tabs={TABS} tab={tab} setTab={setTab} />

      {tab === 0 && (
        <Panel title="Issue-level inputs" right={<button style={addBtn} onClick={addIss}>+ Add issue</button>}>
          <div style={{ display: 'flex', gap: 20, marginBottom: 14, flexWrap: 'wrap' }}>
            <L label="Issuer"><TextInput value={s.issuerName} onChange={v => sc.update({ issuerName: v })} style={{ width: 220 }} /></L>
            <L label="Target letter"><select value={s.targetLetter} onChange={e => sc.update({ targetLetter: e.target.value })} style={selS}>{LETTERS.map(l => <option key={l}>{l}</option>)}</select></L>
            <L label="Passive AUM unlock $Bn"><NumInput value={s.passiveAumUnlock} onChange={v => sc.update({ passiveAumUnlock: v })} /></L>
            <L label="Sustainalytics current"><NumInput value={s.sustainalytics.score} onChange={v => sc.update({ sustainalytics: { ...s.sustainalytics, score: v } })} step={0.1} /></L>
            <L label="Sustainalytics target"><NumInput value={s.sustainalytics.target} onChange={v => sc.update({ sustainalytics: { ...s.sustainalytics, target: v } })} step={0.1} /></L>
          </div>
          <Table cols={['Issue', 'Weight %', 'Current score', 'Peer', 'Remediation ₹Cr', 'Months', '']}>
            {s.issues.map((x, i) => (
              <tr key={i}>
                <td style={td}><TextInput value={x.issue} onChange={v => upd(i, 'issue', v)} style={{ width: 200 }} /></td>
                <td style={td}><NumInput value={x.weight} onChange={v => upd(i, 'weight', v)} style={{ width: 60 }} /></td>
                <td style={td}><NumInput value={x.score} onChange={v => upd(i, 'score', v)} style={{ width: 70 }} /></td>
                <td style={td}><NumInput value={x.peer} onChange={v => upd(i, 'peer', v)} style={{ width: 70 }} /></td>
                <td style={td}><NumInput value={x.cost} onChange={v => upd(i, 'cost', v)} step={0.5} style={{ width: 70 }} /></td>
                <td style={td}><NumInput value={x.months} onChange={v => upd(i, 'months', v)} style={{ width: 60 }} /></td>
                <td style={td}><button onClick={() => delIss(i)} style={delBtn}>✕</button></td>
              </tr>
            ))}
          </Table>
        </Panel>
      )}

      {tab === 1 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Panel title="Issue-level radar vs peer">
            <ResponsiveContainer width="100%" height={360}>
              <RadarChart data={radarData}>
                <PolarGrid stroke={T.border} />
                <PolarAngleAxis dataKey="issue" tick={{ fill: T.textSec, fontSize: 10 }} />
                <PolarRadiusAxis tick={{ fill: T.textMut, fontSize: 10 }} />
                <Radar name="Current" dataKey="current" stroke={T.gold} fill={T.gold} fillOpacity={0.3} />
                <Radar name="Peer" dataKey="peer" stroke={T.sage} fill={T.sage} fillOpacity={0.15} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}` }} />
              </RadarChart>
            </ResponsiveContainer>
          </Panel>
          <Panel title="Weighted score progression">
            <Table cols={['Metric', 'Value']}>
              <tr><td style={td}>Weighted score (current)</td><td style={{ ...td, fontFamily: T.mono, color: T.gold }}>{weighted.wScore.toFixed(2)} ({currentLetter})</td></tr>
              <tr><td style={td}>Weighted peer score</td><td style={{ ...td, fontFamily: T.mono }}>{weighted.wPeer.toFixed(2)}</td></tr>
              <tr><td style={td}>Target score ({s.targetLetter})</td><td style={{ ...td, fontFamily: T.mono, color: T.green }}>{targetScore.toFixed(1)}</td></tr>
              <tr><td style={td}>Weight sum check</td><td style={{ ...td, fontFamily: T.mono }}>{weighted.sumW}%</td></tr>
              <tr><td style={td}>Sustainalytics current → target</td><td style={{ ...td, fontFamily: T.mono }}>{s.sustainalytics.score} → {s.sustainalytics.target}</td></tr>
            </Table>
          </Panel>
        </div>
      )}

      {tab === 2 && (
        <Panel title="Remediation plan — sorted by cost-per-uplift-point">
          <Table cols={['Rank', 'Issue', 'Gap', 'Wtd uplift', 'Cost ₹Cr', '₹Cr / point', 'Months']}>
            {remediation.map((r, i) => (
              <tr key={i}>
                <td style={{ ...td, fontFamily: T.mono, color: i < 3 ? T.green : T.textSec }}>{i + 1}</td>
                <td style={td}>{r.issue}</td>
                <td style={{ ...td, fontFamily: T.mono }}>{r.gap.toFixed(1)}</td>
                <td style={{ ...td, fontFamily: T.mono, color: T.gold }}>{r.uplift.toFixed(2)}</td>
                <td style={{ ...td, fontFamily: T.mono }}>{r.cost}</td>
                <td style={{ ...td, fontFamily: T.mono, color: i < 3 ? T.green : r.cpi > 2 ? T.red : T.textSec }}>{r.cpi.toFixed(2)}</td>
                <td style={{ ...td, fontFamily: T.mono }}>{r.months}</td>
              </tr>
            ))}
          </Table>
          <div style={{ marginTop: 12, padding: 12, background: T.surfaceH, borderRadius: 3, fontSize: 12, color: T.textSec }}>
            <b style={{ color: T.gold }}>Interpretation:</b> Focus on top-3 (lowest ₹Cr per uplift point) first — typically gets ~60% of the rating gap closed at ~30% of the total cost. Bottom-ranked items (biodiversity, supply chain) require multi-year remediation and should be sequenced across tenor.
          </div>
        </Panel>
      )}

      {tab === 3 && (
        <Panel title="Passive AUM unlock at ratings thresholds">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={LETTERS.map((l, i) => ({ letter: l, unlock: i * i * 400, current: letterFromScore(weighted.wScore) === l ? 1 : 0, target: s.targetLetter === l ? 1 : 0 }))}>
              <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
              <XAxis dataKey="letter" tick={{ fill: T.textSec, fontSize: 11 }} />
              <YAxis tick={{ fill: T.textSec, fontSize: 11 }} label={{ value: '$Bn AUM (illustrative)', angle: -90, position: 'insideLeft', fill: T.textSec, fontSize: 11 }} />
              <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}` }} />
              <Bar dataKey="unlock" fill={T.gold} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 10, fontSize: 12, color: T.textSec }}>Illustrative — actual unlock depends on specific index inclusion rules (MSCI ACWI SRI, FTSE4Good, DJSI) and fund eligibility. Estimated additional passive flow at BBB+: <b style={{ color: T.gold }}>${s.passiveAumUnlock.toLocaleString()} Bn</b>.</div>
        </Panel>
      )}

      {tab === 4 && (
        <Panel title="Engagement playbook (quarterly)">
          <Table cols={['Quarter', 'Action', 'Stakeholder', 'Artefact']}>
            {[
              ['Q1', 'Submit corrected controversies to MSCI (1–2y lookback)', 'MSCI Controversies team', 'Controversy response pack'],
              ['Q1', 'Publish first SPR vs SLB KPIs', 'Debt investors, SPO', 'Sustainability Performance Report'],
              ['Q2', 'MSCI consultative meeting on top-3 remediated issues', 'MSCI ESG Research', '40-slide deep-dive deck'],
              ['Q2', 'Sustainalytics engagement — residual risk re-scoring', 'Sustainalytics analyst', 'Risk response memo'],
              ['Q3', 'Analyst Day — ESG transition, Scope 3, LEAP', 'Equity + debt investors', '60-slide Analyst Day deck'],
              ['Q3', 'Proxinvest / ISS governance engagement', 'Proxy advisors', 'Governance Q&A'],
              ['Q4', 'Refresh ESG ratings (MSCI + Sustainalytics)', 'Rating agencies', 'Updated scorecards'],
            ].map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} style={j===0 ? { ...td, fontFamily: T.mono, color: T.gold } : td}>{c}</td>)}</tr>)}
          </Table>
        </Panel>
      )}

      {tab === 5 && (
        <Panel title="Client deliverable stack">
          <ul style={{ lineHeight: 1.9, fontSize: 13, color: T.textSec }}>
            <li><b style={{ color: T.text }}>Issue-level CSV</b> — for internal steering + board. <button style={btnInline} onClick={exportCsv}>Download</button></li>
            <li><b style={{ color: T.text }}>Scenario state JSON</b>. <button style={btnInline} onClick={exportJson}>Download</button></li>
            <li><b style={{ color: T.text }}>Uplift Roadmap (HTML/PDF)</b> — board-ready remediation plan. <button style={{ ...btnInline, background: T.gold, color: T.navy, borderColor: T.gold }} onClick={generateRoadmap}>Generate</button></li>
          </ul>
        </Panel>
      )}
    </div>
  );
}

function L({ label, children }) { return <label style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 12, color: T.textSec }}><span style={{ minWidth: 150 }}>{label}</span>{children}</label>; }
const selS = { background: T.surface, color: T.text, border: `1px solid ${T.border}`, padding: '4px 6px', fontSize: 12, borderRadius: 2 };
const addBtn = { background: T.teal, color: T.text, border: 'none', padding: '4px 12px', fontSize: 11, cursor: 'pointer', borderRadius: 3 };
const delBtn = { background: 'transparent', color: T.red, border: 'none', cursor: 'pointer', fontSize: 14 };
const btnInline = { background: T.surface, color: T.gold, border: `1px solid ${T.gold}`, padding: '3px 10px', fontSize: 11, cursor: 'pointer', borderRadius: 3, marginLeft: 8 };
