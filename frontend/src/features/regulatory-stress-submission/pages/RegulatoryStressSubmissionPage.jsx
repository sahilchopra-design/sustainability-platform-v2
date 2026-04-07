import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell
} from 'recharts';

const T = {
  bg: '#f6f4f0', surface: '#ffffff', border: '#e5e0d8', navy: '#1b3a5c',
  navyL: '#2c5a8c', gold: '#c5a96a', textSec: '#5c6b7e', textMut: '#9aa3ae',
  red: '#dc2626', green: '#16a34a', amber: '#d97706', blue: '#2563eb',
  orange: '#ea580c', purple: '#7c3aed', teal: '#0891b2', sage: '#5a8a6a',
  card: '#ffffff', sub: '#5c6b7e', indigo: '#4f46e5', font: "'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono: "'JetBrains Mono','SF Mono','Fira Code',monospace"
};

const SUBMISSION_TRACKER = [
  { id: 'ecb_cst_2025', regulator: 'ECB', exercise: 'Climate Stress Test 2025', deadline: '2025-06-30', status: 'In Progress', completeness: 72, reviewer: 'M. Schmidt', approved: false },
  { id: 'boe_cbes_r2', regulator: 'BoE', exercise: 'CBES Round 2', deadline: '2025-09-30', status: 'Data Collection', completeness: 35, reviewer: 'J. Williams', approved: false },
  { id: 'apra_cpg229', regulator: 'APRA', exercise: 'CPG 229 Compliance', deadline: '2025-12-31', status: 'Planning', completeness: 15, reviewer: 'S. Chen', approved: false },
  { id: 'fed_pilot', regulator: 'Fed', exercise: 'Climate Pilot Exercise', deadline: '2026-03-31', status: 'Not Started', completeness: 0, reviewer: 'TBD', approved: false },
];

const ECB_TEMPLATE_FIELDS = [
  { section: 'A. Portfolio Scope', fields: ['Total credit exposure', 'Sector breakdown (NACE)', 'Geographic distribution', 'Asset class split'], completeness: 85 },
  { section: 'B. Scenario Variables', fields: ['Carbon price pathway', 'GDP trajectory', 'Energy price assumptions', 'Technology cost curves'], completeness: 90 },
  { section: 'C. Credit Risk', fields: ['PD migration matrices', 'LGD under stress', 'EAD projections', 'ECL impact'], completeness: 65 },
  { section: 'D. Market Risk', fields: ['Credit spread widening', 'Equity price shocks', 'Commodity price changes', 'FX stress'], completeness: 50 },
  { section: 'E. Operational', fields: ['Governance framework', 'Model documentation', 'Data quality statement', 'Internal audit sign-off'], completeness: 40 },
];

const BOE_TEMPLATE_FIELDS = [
  { section: 'Early Action', fields: ['30yr PD/LGD pathway', 'Physical risk overlay', 'Sector loss estimates', 'Capital impact'], completeness: 45 },
  { section: 'Late Action', fields: ['Transition shock timing', 'Stranded asset exposure', 'Abrupt repricing impact', 'Liquidity stress'], completeness: 30 },
  { section: 'No Additional Action', fields: ['Physical damage curves', 'Sea level rise exposure', 'Heat stress labor impact', 'Agricultural disruption'], completeness: 25 },
];

const DATA_QUALITY_CHECKS = [
  { check: 'Completeness: All mandatory fields populated', status: 'pass', detail: '142/145 fields complete (98%)' },
  { check: 'Consistency: PD/LGD within regulatory bounds', status: 'pass', detail: 'All values within [0, 1] range' },
  { check: 'Consistency: Total exposure matches balance sheet', status: 'warning', detail: 'Diff of $45M (0.3%) -- within tolerance' },
  { check: 'Plausibility: Sector loss rates vs peer benchmarks', status: 'warning', detail: 'Oil & Gas LGD 2.1 std above peer median' },
  { check: 'Plausibility: Scenario pathway within NGFS bounds', status: 'pass', detail: 'All pathways within NGFS Phase 5 envelope' },
  { check: 'Temporal: Year-on-year changes < 50% threshold', status: 'pass', detail: 'Max YoY change: 32%' },
  { check: 'Cross-check: Sum of sector exposures = total', status: 'fail', detail: 'Gap of $120M -- needs reconciliation' },
  { check: 'Cross-check: Provisions >= ECL estimates', status: 'pass', detail: 'Provisions exceed ECL by 12%' },
];

const AUDIT_TRAIL = [
  { ts: '2025-04-04 14:32', user: 'M. Schmidt', action: 'Updated PD migration matrix for Energy sector', module: 'ECB CST Module', version: 'v3.2' },
  { ts: '2025-04-04 11:15', user: 'J. Williams', action: 'Uploaded physical risk overlay data', module: 'BoE CBES Module', version: 'v2.1' },
  { ts: '2025-04-03 16:48', user: 'A. Patel', action: 'Ran data quality validation suite', module: 'DQ Engine', version: 'v1.8' },
  { ts: '2025-04-03 09:22', user: 'S. Chen', action: 'Initiated APRA CPG 229 template population', module: 'APRA Module', version: 'v1.0' },
  { ts: '2025-04-02 15:30', user: 'M. Schmidt', action: 'Approved Scenario B assumptions', module: 'Scenario Engine', version: 'v4.1' },
  { ts: '2025-04-02 10:05', user: 'L. Thompson', action: 'Internal audit review -- Section A complete', module: 'Audit', version: 'v1.0' },
  { ts: '2025-04-01 14:18', user: 'J. Williams', action: 'Reconciled sector exposure totals', module: 'Data Hub', version: 'v2.5' },
];

const SUBMISSION_HISTORY = [
  { id: 'ecb_2024_final', exercise: 'ECB CST 2024', date: '2024-06-28', status: 'Accepted', version: 'v4.2', findings: 2 },
  { id: 'boe_cbes_r1', exercise: 'BoE CBES Round 1', date: '2022-03-15', status: 'Accepted with Comments', version: 'v3.1', findings: 5 },
  { id: 'ecb_2022', exercise: 'ECB CST 2022', date: '2022-06-30', status: 'Accepted', version: 'v2.8', findings: 1 },
];

const TABS = ['Submission Tracker', 'ECB Template Filler', 'BoE CBES Template', 'Data Quality Check', 'Audit Trail', 'Submission History'];

const Card = ({ title, children, span }) => (
  <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: 20, gridColumn: span ? `span ${span}` : undefined }}>
    {title && <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>{title}</div>}
    {children}
  </div>
);

const Pill = ({ label, val, color }) => (
  <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 16px', textAlign: 'right' }}>
    <div style={{ color: '#94a3b8', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
    <div style={{ color, fontSize: 18, fontWeight: 700, fontFamily: T.mono }}>{val}</div>
  </div>
);

const Ref = ({ text }) => (
  <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8, padding: '10px 14px', fontSize: 11, color: '#92400e', marginTop: 12 }}>
    <strong>Reference:</strong> {text}
  </div>
);

const StatusBadge = ({ status }) => {
  const colors = { 'In Progress': T.blue, 'Data Collection': T.amber, 'Planning': T.purple, 'Not Started': T.textMut, 'Accepted': T.green, 'Accepted with Comments': T.amber, pass: T.green, warning: T.amber, fail: T.red };
  return <span style={{ background: (colors[status] || T.textMut) + '18', color: colors[status] || T.textMut, padding: '3px 10px', borderRadius: 12, fontSize: 10, fontWeight: 600 }}>{status}</span>;
};

export default function RegulatoryStressSubmissionPage() {
  const [tab, setTab] = useState(0);
  const [submissions, setSubmissions] = useState(SUBMISSION_TRACKER);
  const [signoffs, setSignoffs] = useState({});
  const [deadlineAlerts, setDeadlineAlerts] = useState([]);

  const overallCompleteness = useMemo(() => {
    const total = submissions.reduce((s, sub) => s + sub.completeness, 0);
    return (total / submissions.length).toFixed(0);
  }, [submissions]);

  const dqPassRate = useMemo(() => {
    const passed = DATA_QUALITY_CHECKS.filter(c => c.status === 'pass').length;
    return ((passed / DATA_QUALITY_CHECKS.length) * 100).toFixed(0);
  }, []);

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh' }}>
      <div style={{ background: T.navy, padding: '24px 32px 0', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ color: T.gold, fontFamily: T.mono, fontSize: 11, letterSpacing: 2, marginBottom: 4 }}>EP-CH6 -- REGULATORY STRESS SUBMISSION</div>
            <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: 0 }}>Regulatory Stress Test Submission Workflow</h1>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>
              ECB/BoE/APRA Templates -- Data Quality Engine -- Audit Trail -- Reviewer Approval -- Submission History
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Pill label="Overall Completeness" val={`${overallCompleteness}%`} color={+overallCompleteness > 70 ? T.green : T.amber} />
            <Pill label="DQ Pass Rate" val={`${dqPassRate}%`} color={+dqPassRate > 80 ? T.green : T.amber} />
            <Pill label="Next Deadline" val="Jun 30" color={T.red} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 0 }}>
          {TABS.map((t, i) => (
            <button key={i} onClick={() => setTab(i)} style={{
              padding: '10px 18px', border: 'none', background: 'transparent', cursor: 'pointer',
              color: tab === i ? T.gold : '#94a3b8', fontWeight: tab === i ? 700 : 400, fontSize: 12,
              borderBottom: tab === i ? `2px solid ${T.gold}` : '2px solid transparent'
            }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '24px 32px 32px' }}>

        {tab === 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
            <Card title="Active Submissions">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  {['Regulator', 'Exercise', 'Deadline', 'Completeness', 'Reviewer', 'Status', 'Actions'].map(h => <th key={h} style={{ padding: 8, textAlign: 'left', color: T.navy }}>{h}</th>)}
                </tr></thead>
                <tbody>{submissions.map(s => (
                  <tr key={s.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: 8, fontWeight: 700 }}>{s.regulator}</td>
                    <td style={{ padding: 8 }}>{s.exercise}</td>
                    <td style={{ padding: 8, fontFamily: T.mono }}>{s.deadline}</td>
                    <td style={{ padding: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 80, height: 6, background: T.border, borderRadius: 3 }}>
                          <div style={{ width: `${s.completeness}%`, height: 6, background: s.completeness > 70 ? T.green : s.completeness > 40 ? T.amber : T.red, borderRadius: 3 }} />
                        </div>
                        <span style={{ fontFamily: T.mono, fontSize: 11 }}>{s.completeness}%</span>
                      </div>
                    </td>
                    <td style={{ padding: 8, fontSize: 11 }}>{s.reviewer}</td>
                    <td style={{ padding: 8 }}><StatusBadge status={s.status} /></td>
                    <td style={{ padding: 8 }}>
                      <button onClick={() => setDeadlineAlerts(prev => [...prev, s.deadline])} style={{ padding: '3px 10px', background: T.navy, color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 10 }}>Set Alert</button>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </Card>
            <Card title="Completeness by Submission">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={submissions.map(s => ({ name: s.regulator, completeness: s.completeness, remaining: 100 - s.completeness }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" fontSize={10} />
                  <YAxis fontSize={10} domain={[0, 100]} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Bar dataKey="completeness" fill={T.green} name="Complete" stackId="a" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="remaining" fill={T.border} name="Remaining" stackId="a" radius={[4, 4, 0, 0]} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </BarChart>
              </ResponsiveContainer>
              <Ref text="Submission deadlines per ECB SSM calendar (2025), BoE PRA expectations letter (Dec 2024), APRA SPS 220 timeline, Fed Climate Pilot (SR 24-1)." />
            </Card>
          </div>
        )}

        {tab === 1 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
            <Card title="ECB Climate Stress Test -- Template Filler">
              {ECB_TEMPLATE_FIELDS.map(section => (
                <div key={section.section} style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>{section.section}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 100, height: 6, background: T.border, borderRadius: 3 }}>
                        <div style={{ width: `${section.completeness}%`, height: 6, background: section.completeness > 80 ? T.green : section.completeness > 50 ? T.amber : T.red, borderRadius: 3 }} />
                      </div>
                      <span style={{ fontFamily: T.mono, fontSize: 11, color: section.completeness > 80 ? T.green : T.amber }}>{section.completeness}%</span>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                    {section.fields.map(field => (
                      <div key={field} style={{ background: T.bg, borderRadius: 8, padding: '8px 12px', fontSize: 11, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{field}</span>
                        <span style={{ color: (field.charCodeAt(0) % 10 > 2) ? T.green : T.amber, fontSize: 10, fontWeight: 600 }}>{(field.charCodeAt(0) % 10 > 2) ? 'Populated' : 'Pending'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <Ref text="ECB Reporting Framework (Nov 2024). Template structure per ECB Technical Annex Tables C1-C5. NACE Rev.2 sector classification." />
            </Card>
          </div>
        )}

        {tab === 2 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
            <Card title="BoE CBES -- Template Sections">
              {BOE_TEMPLATE_FIELDS.map(section => (
                <div key={section.section} style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>{section.section}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 100, height: 6, background: T.border, borderRadius: 3 }}>
                        <div style={{ width: `${section.completeness}%`, height: 6, background: section.completeness > 60 ? T.green : section.completeness > 30 ? T.amber : T.red, borderRadius: 3 }} />
                      </div>
                      <span style={{ fontFamily: T.mono, fontSize: 11 }}>{section.completeness}%</span>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                    {section.fields.map(field => (
                      <div key={field} style={{ background: T.bg, borderRadius: 8, padding: '8px 12px', fontSize: 11, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{field}</span>
                        <span style={{ color: (field.charCodeAt(0) % 2 === 0) ? T.green : T.amber, fontSize: 10, fontWeight: 600 }}>{(field.charCodeAt(0) % 2 === 0) ? 'Populated' : 'Pending'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <Ref text="BoE CBES Data Dictionary v3 (March 2024). Template aligned with PRA PS2/22 climate-related financial risks. Banking book focus per PRA SS3/19." />
            </Card>
          </div>
        )}

        {tab === 3 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
            <Card title="Data Quality Validation Results">
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 16 }}>
                  {[
                    { label: 'Passed', count: DATA_QUALITY_CHECKS.filter(c => c.status === 'pass').length, color: T.green },
                    { label: 'Warnings', count: DATA_QUALITY_CHECKS.filter(c => c.status === 'warning').length, color: T.amber },
                    { label: 'Failed', count: DATA_QUALITY_CHECKS.filter(c => c.status === 'fail').length, color: T.red },
                  ].map(s => (
                    <div key={s.label} style={{ background: s.color + '12', borderRadius: 8, padding: '10px 20px', textAlign: 'center' }}>
                      <div style={{ fontSize: 24, fontWeight: 700, color: s.color, fontFamily: T.mono }}>{s.count}</div>
                      <div style={{ fontSize: 10, color: s.color, fontWeight: 600 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  {['Check', 'Status', 'Detail'].map(h => <th key={h} style={{ padding: 8, textAlign: 'left', color: T.navy }}>{h}</th>)}
                </tr></thead>
                <tbody>{DATA_QUALITY_CHECKS.map((c, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: c.status === 'fail' ? T.red + '08' : 'transparent' }}>
                    <td style={{ padding: 8, fontWeight: 600 }}>{c.check}</td>
                    <td style={{ padding: 8 }}><StatusBadge status={c.status} /></td>
                    <td style={{ padding: 8, fontSize: 11, color: T.textSec }}>{c.detail}</td>
                  </tr>
                ))}</tbody>
              </table>
              <Ref text="Data quality framework per ECB Guide on ICAAP (2024). Plausibility bounds from EBA 2023 Transparency Exercise. Consistency checks per BCBS 239 Principles." />
            </Card>
          </div>
        )}

        {tab === 4 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Card title="Complete Audit Trail" span={2}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead><tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  {['Timestamp', 'User', 'Action', 'Module', 'Version'].map(h => <th key={h} style={{ padding: 8, textAlign: 'left', color: T.navy }}>{h}</th>)}
                </tr></thead>
                <tbody>{AUDIT_TRAIL.map((a, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: 8, fontFamily: T.mono, fontSize: 10, color: T.textMut }}>{a.ts}</td>
                    <td style={{ padding: 8, fontWeight: 600 }}>{a.user}</td>
                    <td style={{ padding: 8 }}>{a.action}</td>
                    <td style={{ padding: 8, fontSize: 10, color: T.textSec }}>{a.module}</td>
                    <td style={{ padding: 8, fontFamily: T.mono, fontSize: 10 }}>{a.version}</td>
                  </tr>
                ))}</tbody>
              </table>
              <Ref text="Audit trail per MiFID II Article 16 record-keeping. Every data point traced to source module with timestamp. Immutable log for regulatory examination." />
            </Card>
            <Card title="Reviewer Sign-Off Workflow">
              {submissions.map(s => (
                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${T.border}` }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.navy }}>{s.exercise}</div>
                    <div style={{ fontSize: 10, color: T.textMut }}>Reviewer: {s.reviewer}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {signoffs[s.id] ? (
                      <span style={{ background: T.green + '18', color: T.green, padding: '4px 12px', borderRadius: 12, fontSize: 10, fontWeight: 600 }}>Signed Off</span>
                    ) : (
                      <button onClick={() => setSignoffs(prev => ({ ...prev, [s.id]: true }))} style={{ padding: '4px 12px', background: T.green, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 10 }}>Approve & Sign</button>
                    )}
                  </div>
                </div>
              ))}
            </Card>
            <Card title="Deadline Alerts">
              {deadlineAlerts.length === 0 && <div style={{ fontSize: 11, color: T.textMut }}>No alerts configured. Click "Set Alert" on the Submission Tracker.</div>}
              {deadlineAlerts.map((d, i) => (
                <div key={i} style={{ background: T.amber + '12', borderRadius: 8, padding: '8px 12px', marginBottom: 6, fontSize: 11 }}>
                  Alert set for deadline: <strong>{d}</strong>
                </div>
              ))}
            </Card>
          </div>
        )}

        {tab === 5 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
            <Card title="Past Submissions">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  {['Exercise', 'Submission Date', 'Version', 'Status', 'Findings', 'Actions'].map(h => <th key={h} style={{ padding: 8, textAlign: 'left', color: T.navy }}>{h}</th>)}
                </tr></thead>
                <tbody>{SUBMISSION_HISTORY.map(s => (
                  <tr key={s.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: 8, fontWeight: 600 }}>{s.exercise}</td>
                    <td style={{ padding: 8, fontFamily: T.mono }}>{s.date}</td>
                    <td style={{ padding: 8, fontFamily: T.mono }}>{s.version}</td>
                    <td style={{ padding: 8 }}><StatusBadge status={s.status} /></td>
                    <td style={{ padding: 8, fontFamily: T.mono }}>{s.findings}</td>
                    <td style={{ padding: 8 }}>
                      <button style={{ padding: '3px 10px', background: T.blue + '22', color: T.blue, border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 10 }}>View</button>
                      <button style={{ padding: '3px 10px', background: T.purple + '22', color: T.purple, border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 10, marginLeft: 4 }}>Compare</button>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </Card>
            <Card title="Version Comparison -- ECB CST 2024 vs 2022">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={[
                  { metric: 'Total Exposure', v2024: 155, v2022: 142 },
                  { metric: 'Avg PD Shock', v2024: 2.8, v2022: 2.1 },
                  { metric: 'Avg LGD Shock', v2024: 6.5, v2022: 5.2 },
                  { metric: 'ECL Impact (bps)', v2024: 85, v2022: 62 },
                  { metric: 'Data Quality Score', v2024: 92, v2022: 78 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="metric" fontSize={10} />
                  <YAxis fontSize={10} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Bar dataKey="v2022" fill={T.blue + '66'} name="2022 Submission" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="v2024" fill={T.blue} name="2024 Submission" radius={[4, 4, 0, 0]} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </BarChart>
              </ResponsiveContainer>
              <Ref text="Version comparison per ECB supervisory expectations on comparability. Submission formats: ECB XBRL taxonomy v3.0, BoE SRF returns, APRA D2A reporting." />
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
