/**
 * EP-CS6 — Assessment Configuration
 * Sprint CS · Taxonomy & Assessment Engine Core
 *
 * Calibration & configuration with weight editor, threshold config,
 * rating scale, scenario setup, data quality rules, and audit log.
 */
import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import TAXONOMY_TREE, {
  getLeafNodes, scoreToRating, REFERENCE_DATA_SOURCES
} from '../../../data/taxonomyTree';

const T = { bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb', orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a', font:"'DM Sans','SF Pro Display',system-ui,sans-serif", mono:"'JetBrains Mono','SF Mono','Fira Code',monospace" };

const TABS = ['Weight Editor', 'Threshold Config', 'Rating Scale', 'Scenario Setup', 'Data Quality Rules', 'Audit Log'];
const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const RATING_COLORS = { A: T.green, B: '#22c55e', C: T.amber, D: T.orange, E: T.red };

const NGFS_SCENARIOS = [
  { id: 'nze', name: 'Net Zero 2050', description: 'Ambitious, early action; 1.5°C', multiplier: 1.0, color: T.green },
  { id: 'b2c', name: 'Below 2°C', description: 'Gradual strengthening of policies', multiplier: 0.85, color: T.teal },
  { id: 'div', name: 'Divergent Net Zero', description: 'Higher costs due to divergent policies', multiplier: 1.15, color: T.blue },
  { id: 'del', name: 'Delayed Transition', description: 'Policies delayed until 2030', multiplier: 1.30, color: T.amber },
  { id: 'ndcs', name: 'NDCs', description: 'Nationally Determined Contributions only', multiplier: 0.70, color: T.orange },
  { id: 'cp', name: 'Current Policies', description: 'Only existing policies', multiplier: 0.55, color: T.red },
];

const AUDIT_LOG = Array.from({ length: 15 }, (_, i) => {
  const actions = ['Updated L1 weights', 'Changed A threshold to 80', 'Enabled NZE scenario', 'Set min DQ to 3', 'Updated B/C boundary', 'Added data quality rule', 'Reset to defaults', 'Changed multiplier for Delayed'];
  const users = ['admin@risk-analytics.com', 'j.smith@bank.com', 'a.jones@bank.com'];
  const d = new Date(2026, 3, 4, 10 - Math.floor(i / 2), 30 - i * 4);
  return { id: i + 1, timestamp: d.toISOString().replace('T', ' ').slice(0, 19), user: users[i % 3], action: actions[i % actions.length] };
});

const TabBar = ({ tabs, active, onSelect }) => (
  <div style={{ display: 'flex', borderBottom: `2px solid ${T.gold}`, marginBottom: 20, flexWrap: 'wrap' }}>
    {tabs.map(t => (
      <button key={t} onClick={() => onSelect(t)} style={{
        padding: '10px 18px', background: 'none', border: 'none', cursor: 'pointer',
        fontFamily: T.font, fontSize: 13, fontWeight: active === t ? 700 : 400,
        color: active === t ? T.gold : T.navy,
        borderBottom: active === t ? `3px solid ${T.gold}` : '3px solid transparent',
      }}>{t}</button>
    ))}
  </div>
);

const Card = ({ title, children, style }) => (
  <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20, marginBottom: 16, ...style }}>
    {title && <div style={{ fontFamily: T.font, fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 12 }}>{title}</div>}
    {children}
  </div>
);

export default function AssessmentConfigurationPage() {
  const [tab, setTab] = useState(TABS[0]);

  const initWeights = useMemo(() => {
    const w = {};
    TAXONOMY_TREE.forEach(t => { w[t.code] = Math.round(t.weight * 100); });
    return w;
  }, []);
  const [weights, setWeights] = useState(initWeights);

  const [thresholds, setThresholds] = useState({ A: 80, B: 65, C: 50, D: 35 });
  const [scenarioMultipliers, setScenarioMultipliers] = useState(Object.fromEntries(NGFS_SCENARIOS.map(s => [s.id, s.multiplier])));
  const [minDQ, setMinDQ] = useState(3);
  const [dqTarget, setDqTarget] = useState(2);

  const totalWeight = useMemo(() => Object.values(weights).reduce((a, b) => a + b, 0), [weights]);
  const weightData = useMemo(() => TAXONOMY_TREE.map(t => ({ code: t.code, name: t.name, weight: weights[t.code] })), [weights]);

  const handleWeightChange = useCallback((code, val) => {
    setWeights(prev => ({ ...prev, [code]: Math.max(0, Math.min(100, val)) }));
  }, []);

  const ratingBands = useMemo(() => [
    { rating: 'A', min: thresholds.A, max: 100, color: RATING_COLORS.A },
    { rating: 'B', min: thresholds.B, max: thresholds.A - 1, color: RATING_COLORS.B },
    { rating: 'C', min: thresholds.C, max: thresholds.B - 1, color: RATING_COLORS.C },
    { rating: 'D', min: thresholds.D, max: thresholds.C - 1, color: RATING_COLORS.D },
    { rating: 'E', min: 0, max: thresholds.D - 1, color: RATING_COLORS.E },
  ], [thresholds]);

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: T.mono, fontSize: 11, color: T.textMut, marginBottom: 4 }}>EP-CS6 · SPRINT CS</div>
          <h1 style={{ fontSize: 26, color: T.navy, margin: 0 }}>Assessment Configuration</h1>
          <p style={{ color: T.textSec, fontSize: 14, margin: '6px 0 0' }}>
            Calibrate weights, thresholds, scenarios, and data quality rules
          </p>
        </div>

        <TabBar tabs={TABS} active={tab} onSelect={setTab} />

        {/* Tab 1: Weight Editor */}
        {tab === TABS[0] && (
          <>
            <Card title="L1 Topic Weights (must sum to 100%)">
              <div style={{ marginBottom: 12, fontSize: 13 }}>
                Total: <span style={{ fontFamily: T.mono, fontWeight: 700, color: totalWeight === 100 ? T.green : T.red }}>{totalWeight}%</span>
                {totalWeight !== 100 && <span style={{ color: T.red, marginLeft: 8 }}>Weights must sum to 100%</span>}
              </div>
              {TAXONOMY_TREE.map(t => (
                <div key={t.code} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <span style={{ fontFamily: T.mono, fontSize: 12, color: T.textSec, width: 40 }}>{t.code}</span>
                  <span style={{ fontSize: 13, width: 200 }}>{t.name}</span>
                  <input type="range" min={0} max={40} value={weights[t.code]}
                    onChange={e => handleWeightChange(t.code, +e.target.value)}
                    style={{ flex: 1, accentColor: T.gold }} />
                  <span style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 700, color: T.navy, width: 40, textAlign: 'right' }}>{weights[t.code]}%</span>
                </div>
              ))}
              <button onClick={() => setWeights(initWeights)} style={{ marginTop: 12, padding: '6px 16px', fontSize: 12, borderRadius: 4, border: `1px solid ${T.border}`, background: T.surface, cursor: 'pointer', fontFamily: T.font }}>
                Reset to Defaults
              </button>
            </Card>
            <Card title="Weight Distribution">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={weightData} dataKey="weight" nameKey="code" cx="50%" cy="50%" outerRadius={90}
                    label={({ code, weight }) => `${code}: ${weight}%`}>
                    {weightData.map((_, i) => <Cell key={i} fill={[T.navy, T.blue, T.teal, T.green, T.amber, T.orange, T.purple, T.sage][i % 8]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </>
        )}

        {/* Tab 2: Threshold Config */}
        {tab === TABS[1] && (
          <Card title="Rating Band Thresholds (adjustable)">
            {['A', 'B', 'C', 'D'].map(rating => (
              <div key={rating} style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <span style={{ padding: '4px 12px', borderRadius: 6, fontWeight: 700, fontFamily: T.mono, fontSize: 16, color: '#fff', background: RATING_COLORS[rating], width: 40, textAlign: 'center' }}>{rating}</span>
                <span style={{ fontSize: 13, color: T.textSec, width: 120 }}>Min score:</span>
                <input type="range" min={0} max={100} value={thresholds[rating]}
                  onChange={e => setThresholds(prev => ({ ...prev, [rating]: +e.target.value }))}
                  style={{ flex: 1, accentColor: RATING_COLORS[rating] }} />
                <span style={{ fontFamily: T.mono, fontWeight: 700, fontSize: 16, color: T.navy, width: 40, textAlign: 'right' }}>{thresholds[rating]}</span>
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ padding: '4px 12px', borderRadius: 6, fontWeight: 700, fontFamily: T.mono, fontSize: 16, color: '#fff', background: RATING_COLORS.E, width: 40, textAlign: 'center' }}>E</span>
              <span style={{ fontSize: 13, color: T.textSec }}>Score range: 0 — {thresholds.D - 1}</span>
            </div>
            <div style={{ marginTop: 20, padding: 16, background: '#f0f4f8', borderRadius: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Rating Scale Preview</div>
              <div style={{ display: 'flex', height: 24, borderRadius: 4, overflow: 'hidden' }}>
                {ratingBands.map(b => (
                  <div key={b.rating} style={{ flex: b.max - b.min + 1, background: b.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: T.mono, fontSize: 11, fontWeight: 700 }}>
                    {b.rating} ({b.min}-{b.max})
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Tab 3: Rating Scale */}
        {tab === TABS[2] && (
          <Card title="Rating Scale Definitions">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontFamily: T.font }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  <th style={{ textAlign: 'center', padding: 8 }}>Rating</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Label</th>
                  <th style={{ textAlign: 'center', padding: 8 }}>Score Range</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Description</th>
                  <th style={{ textAlign: 'center', padding: 8 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { r: 'A', label: 'Leader', desc: 'Best-in-class transition readiness; minimal residual risk', action: 'Monitor' },
                  { r: 'B', label: 'Advanced', desc: 'Strong performance with minor gaps in specific areas', action: 'Maintain' },
                  { r: 'C', label: 'Transitioning', desc: 'Moderate progress; material gaps in key risk areas', action: 'Engage' },
                  { r: 'D', label: 'Lagging', desc: 'Significant deficiencies; elevated transition risk exposure', action: 'Escalate' },
                  { r: 'E', label: 'Critical', desc: 'Critical risk; immediate attention required for compliance', action: 'Remediate' },
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ textAlign: 'center', padding: 8 }}>
                      <span style={{ padding: '4px 12px', borderRadius: 6, fontWeight: 700, fontFamily: T.mono, color: '#fff', background: RATING_COLORS[row.r] }}>{row.r}</span>
                    </td>
                    <td style={{ padding: 8, fontWeight: 600 }}>{row.label}</td>
                    <td style={{ textAlign: 'center', padding: 8, fontFamily: T.mono }}>{ratingBands.find(b => b.rating === row.r)?.min}-{ratingBands.find(b => b.rating === row.r)?.max}</td>
                    <td style={{ padding: 8, color: T.textSec, fontSize: 12 }}>{row.desc}</td>
                    <td style={{ textAlign: 'center', padding: 8 }}>
                      <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: '#f0f4f8' }}>{row.action}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        {/* Tab 4: Scenario Setup */}
        {tab === TABS[3] && (
          <Card title="NGFS Scenario Configuration">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontFamily: T.font }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  <th style={{ textAlign: 'left', padding: 8 }}>Scenario</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Description</th>
                  <th style={{ textAlign: 'center', padding: 8 }}>Multiplier</th>
                  <th style={{ textAlign: 'center', padding: 8 }}>Adjust</th>
                </tr>
              </thead>
              <tbody>
                {NGFS_SCENARIOS.map(sc => (
                  <tr key={sc.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: 8 }}>
                      <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: sc.color, marginRight: 8 }} />
                      <span style={{ fontWeight: 600 }}>{sc.name}</span>
                    </td>
                    <td style={{ padding: 8, color: T.textSec, fontSize: 12 }}>{sc.description}</td>
                    <td style={{ textAlign: 'center', padding: 8, fontFamily: T.mono, fontWeight: 700 }}>{scenarioMultipliers[sc.id].toFixed(2)}x</td>
                    <td style={{ textAlign: 'center', padding: 8 }}>
                      <input type="range" min={0.1} max={2.0} step={0.05} value={scenarioMultipliers[sc.id]}
                        onChange={e => setScenarioMultipliers(prev => ({ ...prev, [sc.id]: +e.target.value }))}
                        style={{ width: 120, accentColor: sc.color }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <ResponsiveContainer width="100%" height={220} style={{ marginTop: 16 }}>
              <BarChart data={NGFS_SCENARIOS.map(s => ({ name: s.name, multiplier: scenarioMultipliers[s.id] }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontFamily: T.font, fontSize: 10 }} />
                <YAxis domain={[0, 2]} tick={{ fontFamily: T.mono, fontSize: 11 }} />
                <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} />
                <Bar dataKey="multiplier" radius={[4, 4, 0, 0]}>
                  {NGFS_SCENARIOS.map((s, i) => <Cell key={i} fill={s.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Tab 5: Data Quality Rules */}
        {tab === TABS[4] && (
          <Card title="Data Quality Configuration">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <label style={{ fontSize: 13, color: T.textSec, display: 'block', marginBottom: 8 }}>Minimum DQ Level for Inclusion</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[1, 2, 3, 4, 5].map(q => (
                    <button key={q} onClick={() => setMinDQ(q)} style={{
                      padding: '8px 16px', fontSize: 13, borderRadius: 6, cursor: 'pointer', fontFamily: T.mono, fontWeight: 700,
                      background: minDQ === q ? T.navy : T.surface, color: minDQ === q ? '#fff' : T.navy,
                      border: `1px solid ${minDQ === q ? T.navy : T.border}`,
                    }}>DQ{q}</button>
                  ))}
                </div>
                <div style={{ fontSize: 12, color: T.textSec, marginTop: 6 }}>Nodes below DQ{minDQ} will use proxy values</div>
              </div>
              <div>
                <label style={{ fontSize: 13, color: T.textSec, display: 'block', marginBottom: 8 }}>Target DQ Level</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[1, 2, 3].map(q => (
                    <button key={q} onClick={() => setDqTarget(q)} style={{
                      padding: '8px 16px', fontSize: 13, borderRadius: 6, cursor: 'pointer', fontFamily: T.mono, fontWeight: 700,
                      background: dqTarget === q ? T.gold : T.surface, color: dqTarget === q ? '#fff' : T.navy,
                      border: `1px solid ${dqTarget === q ? T.gold : T.border}`,
                    }}>DQ{q}</button>
                  ))}
                </div>
                <div style={{ fontSize: 12, color: T.textSec, marginTop: 6 }}>Improvement target for next assessment cycle</div>
              </div>
            </div>
            <div style={{ marginTop: 20 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.font }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                    <th style={{ textAlign: 'left', padding: 6 }}>Rule</th>
                    <th style={{ textAlign: 'center', padding: 6 }}>Status</th>
                    <th style={{ textAlign: 'left', padding: 6 }}>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { rule: 'Min DQ threshold', status: 'ACTIVE', desc: `Exclude nodes below DQ${minDQ}` },
                    { rule: 'Source priority', status: 'ACTIVE', desc: 'Primary source preferred over secondary' },
                    { rule: 'Freshness check', status: 'ACTIVE', desc: 'Flag data older than 12 months' },
                    { rule: 'Cross-validation', status: 'ACTIVE', desc: 'Require 2+ sources for DQ1-2' },
                    { rule: 'Proxy fallback', status: 'ACTIVE', desc: 'Sector average for missing data' },
                  ].map((r, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: 6, fontWeight: 600 }}>{r.rule}</td>
                      <td style={{ textAlign: 'center', padding: 6 }}>
                        <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600, color: '#fff', background: T.green }}>{r.status}</span>
                      </td>
                      <td style={{ padding: 6, color: T.textSec }}>{r.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Tab 6: Audit Log */}
        {tab === TABS[5] && (
          <Card title="Configuration Change Audit Log">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.font }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  <th style={{ textAlign: 'center', padding: 6 }}>#</th>
                  <th style={{ textAlign: 'left', padding: 6 }}>Timestamp</th>
                  <th style={{ textAlign: 'left', padding: 6 }}>User</th>
                  <th style={{ textAlign: 'left', padding: 6 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {AUDIT_LOG.map(log => (
                  <tr key={log.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ textAlign: 'center', padding: 6, fontFamily: T.mono, color: T.textMut }}>{log.id}</td>
                    <td style={{ padding: 6, fontFamily: T.mono, fontSize: 11 }}>{log.timestamp}</td>
                    <td style={{ padding: 6, color: T.textSec }}>{log.user}</td>
                    <td style={{ padding: 6 }}>{log.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        <div style={{ marginTop: 24, padding: '12px 16px', background: T.surface, borderRadius: 8, border: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: T.mono, color: T.textMut }}>
          <span>EP-CS6 · Assessment Configuration</span>
          <span>Sprint CS · {new Date().toISOString().split('T')[0]}</span>
        </div>
      </div>
    </div>
  );
}
