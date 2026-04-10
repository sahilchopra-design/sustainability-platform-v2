/**
 * EP-CS2 — Assessment Engine Dashboard
 * Sprint CS · Taxonomy & Assessment Engine Core
 *
 * Score aggregation dashboard with portfolio overview, entity deep-dive,
 * score distribution, scenario comparison, trend analysis, and heatmap.
 */
import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, LineChart, Line, ScatterChart, Scatter
} from 'recharts';
import TAXONOMY_TREE, {
  flattenTaxonomy, getLeafNodes, countByLevel, aggregateScores,
  scoreToRating, REFERENCE_DATA_SOURCES, HIGH_IMPACT_SECTORS, GEOGRAPHIC_REGIONS
} from '../../../data/taxonomyTree';

const T = { bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb', orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a', card:'#ffffff',sub:'#5c6b7e',indigo:'#4f46e5',font:"'DM Sans','SF Pro Display',system-ui,sans-serif", mono:"'JetBrains Mono','SF Mono','Fira Code',monospace" };

const TABS = ['Portfolio Overview', 'Entity Deep-Dive', 'Score Distribution', 'Scenario Comparison', 'Trend Analysis', 'Heatmap'];
const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const RATING_COLORS = { A: T.green, B: '#22c55e', C: T.amber, D: T.orange, E: T.red };
const L1_COLORS = [T.navy, T.blue, T.teal, T.green, T.amber, T.orange, T.purple, T.sage];

const ENTITIES = Array.from({ length: 10 }, (_, i) => {
  const names = ['Shell plc', 'BP plc', 'TotalEnergies', 'Enel SpA', 'NextEra Energy', 'Rio Tinto', 'ArcelorMittal', 'HeidelbergCement', 'Maersk', 'Deutsche Bank'];
  const sectors = ['Energy', 'Energy', 'Energy', 'Utilities', 'Utilities', 'Mining', 'Steel', 'Cement', 'Transport', 'Finance'];
  const scores = {};
  TAXONOMY_TREE.forEach((t, j) => { scores[t.code] = Math.round(25 + sr(i * 8 + j * 3) * 65); });
  const overall = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / Math.max(1, TAXONOMY_TREE.length));
  const rt = scoreToRating(overall);
  return { id: i + 1, name: names[i], sector: sectors[i], scores, overall, rating: rt.label, ratingColor: rt.color };
});

const SCENARIOS = ['Current Policies', 'NGFS Below 2°C', 'NGFS Net Zero 2050', 'Delayed Transition', 'Fragmented World', 'Low Demand'];
const QUARTERS = ['Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024', 'Q1 2025', 'Q2 2025', 'Q3 2025', 'Q4 2025'];

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

const RatingBadge = ({ rating }) => (
  <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 6, fontSize: 13, fontWeight: 700, fontFamily: T.mono, color: '#fff', background: RATING_COLORS[rating] || T.textMut }}>{rating}</span>
);

export default function AssessmentEngineDashboardPage() {
  const [tab, setTab] = useState(TABS[0]);
  const [selectedEntity, setSelectedEntity] = useState(ENTITIES[0]);
  const [selectedScenario, setSelectedScenario] = useState(SCENARIOS[0]);

  const portfolioAvg = useMemo(() => Math.round(ENTITIES.reduce((s, e) => s + e.overall, 0) / Math.max(1, ENTITIES.length)), []);
  const portfolioRating = useMemo(() => { const r = scoreToRating(portfolioAvg); return r.label; }, [portfolioAvg]);

  const sunburstData = useMemo(() => TAXONOMY_TREE.map((l1, i) => ({
    name: l1.code, fullName: l1.name, value: Math.round(l1.weight * 100),
    fill: L1_COLORS[i % L1_COLORS.length],
    children: (l1.children || []).slice(0, 5).map((l2, j) => ({
      name: l2.code, fullName: l2.name, value: Math.round(l2.weight * l1.weight * 1000) / 10,
      fill: L1_COLORS[i % L1_COLORS.length] + (j % 2 === 0 ? '' : 'cc'),
    })),
  })), []);

  const radarData = useMemo(() => TAXONOMY_TREE.map(t => ({
    topic: t.code, fullName: t.name,
    [selectedEntity.name]: selectedEntity.scores[t.code],
    'Portfolio Avg': Math.round(ENTITIES.reduce((s, e) => s + e.scores[t.code], 0) / Math.max(1, ENTITIES.length)),
  })), [selectedEntity]);

  const distributionData = useMemo(() => {
    const buckets = Array.from({ length: 10 }, (_, i) => ({ range: `${i * 10}-${(i + 1) * 10}`, count: 0 }));
    ENTITIES.forEach(e => { const idx = Math.min(Math.floor(e.overall / 10), 9); buckets[idx].count++; });
    return buckets;
  }, []);

  const scenarioData = useMemo(() => SCENARIOS.map((sc, i) => ({
    scenario: sc,
    portfolioScore: Math.round(portfolioAvg + (sr(i * 7) - 0.5) * 30),
    bestCase: Math.round(portfolioAvg + sr(i * 11) * 20),
    worstCase: Math.round(portfolioAvg - sr(i * 13) * 25),
  })), [portfolioAvg]);

  const trendData = useMemo(() => QUARTERS.map((q, i) => ({
    quarter: q, portfolioScore: Math.round(portfolioAvg + i * 1.5 + (sr(i * 5) - 0.5) * 8),
    ...Object.fromEntries(ENTITIES.slice(0, 4).map(e => [e.name, Math.round(e.overall + i * 1.2 + (sr(e.id * 3 + i) - 0.5) * 10)])),
  })), [portfolioAvg]);

  const heatmapData = useMemo(() => ENTITIES.map(e => ({
    entity: e.name, ...e.scores,
  })), []);

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: T.mono, fontSize: 11, color: T.textMut, marginBottom: 4 }}>EP-CS2 · SPRINT CS</div>
          <h1 style={{ fontSize: 26, color: T.navy, margin: 0 }}>Assessment Engine Dashboard</h1>
          <p style={{ color: T.textSec, fontSize: 14, margin: '6px 0 0' }}>
            Score aggregation across {ENTITIES.length} entities · {TAXONOMY_TREE.length} L1 topics · {getLeafNodes().length} indicators
          </p>
        </div>

        {/* KPI Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Portfolio Score', value: portfolioAvg, sub: <RatingBadge rating={portfolioRating} /> },
            { label: 'Entities Assessed', value: ENTITIES.length, sub: 'active' },
            { label: 'Best Performer', value: ENTITIES.reduce((b, e) => e.overall > b.overall ? e : b).name, small: true, sub: <RatingBadge rating={ENTITIES.reduce((b, e) => e.overall > b.overall ? e : b).rating} /> },
            { label: 'Worst Performer', value: ENTITIES.reduce((w, e) => e.overall < w.overall ? e : w).name, small: true, sub: <RatingBadge rating={ENTITIES.reduce((w, e) => e.overall < w.overall ? e : w).rating} /> },
            { label: 'Data Coverage', value: '87%', sub: 'of L4 nodes' },
          ].map((k, i) => (
            <Card key={i} style={{ textAlign: 'center', padding: 14 }}>
              <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono }}>{k.label.toUpperCase()}</div>
              <div style={{ fontSize: k.small ? 16 : 28, fontWeight: 800, color: T.navy, margin: '4px 0' }}>{k.value}</div>
              <div style={{ fontSize: 11, color: T.textSec }}>{k.sub}</div>
            </Card>
          ))}
        </div>

        <TabBar tabs={TABS} active={tab} onSelect={setTab} />

        {/* Tab 1: Portfolio Overview */}
        {tab === TABS[0] && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Card title="L1 Topic Weight Distribution (Sunburst)">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={sunburstData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name }) => name}>
                    {sunburstData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Pie>
                  <Pie data={sunburstData.flatMap(d => d.children || [])} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={85} outerRadius={120}>
                    {sunburstData.flatMap(d => d.children || []).map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Entity Rankings">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.font }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                    <th style={{ textAlign: 'left', padding: 6 }}>#</th>
                    <th style={{ textAlign: 'left', padding: 6 }}>Entity</th>
                    <th style={{ textAlign: 'left', padding: 6 }}>Sector</th>
                    <th style={{ textAlign: 'right', padding: 6 }}>Score</th>
                    <th style={{ textAlign: 'center', padding: 6 }}>Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {[...ENTITIES].sort((a, b) => b.overall - a.overall).map((e, i) => (
                    <tr key={e.id} style={{ borderBottom: `1px solid ${T.border}`, cursor: 'pointer', background: selectedEntity.id === e.id ? '#f0f4f8' : 'transparent' }}
                      onClick={() => setSelectedEntity(e)}>
                      <td style={{ padding: 6, fontFamily: T.mono, color: T.textMut }}>{i + 1}</td>
                      <td style={{ padding: 6, fontWeight: 600 }}>{e.name}</td>
                      <td style={{ padding: 6, color: T.textSec }}>{e.sector}</td>
                      <td style={{ padding: 6, textAlign: 'right', fontFamily: T.mono, fontWeight: 700 }}>{e.overall}</td>
                      <td style={{ textAlign: 'center', padding: 6 }}><RatingBadge rating={e.rating} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}

        {/* Tab 2: Entity Deep-Dive */}
        {tab === TABS[1] && (
          <>
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: T.textSec }}>Select Entity:</label>
                <select value={selectedEntity.id} onChange={e => setSelectedEntity(ENTITIES.find(en => en.id === +e.target.value))}
                  style={{ padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 4, fontFamily: T.font, fontSize: 13 }}>
                  {ENTITIES.map(e => <option key={e.id} value={e.id}>{e.name} ({e.sector})</option>)}
                </select>
                <RatingBadge rating={selectedEntity.rating} />
                <span style={{ fontFamily: T.mono, fontWeight: 700, fontSize: 18, color: T.navy }}>{selectedEntity.overall}/100</span>
              </div>
            </Card>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Card title="Radar — L1 Topic Scores vs Portfolio Average">
                <ResponsiveContainer width="100%" height={320}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke={T.border} />
                    <PolarAngleAxis dataKey="topic" tick={{ fontFamily: T.mono, fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Radar name={selectedEntity.name} dataKey={selectedEntity.name} stroke={T.navy} fill={T.navy} fillOpacity={0.2} />
                    <Radar name="Portfolio Avg" dataKey="Portfolio Avg" stroke={T.gold} fill={T.gold} fillOpacity={0.1} />
                    <Legend wrapperStyle={{ fontFamily: T.font, fontSize: 11 }} />
                    <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </Card>
              <Card title="L1 Score Breakdown">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.font }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                      <th style={{ textAlign: 'left', padding: 6 }}>Topic</th>
                      <th style={{ textAlign: 'right', padding: 6 }}>Score</th>
                      <th style={{ textAlign: 'center', padding: 6 }}>Rating</th>
                      <th style={{ textAlign: 'left', padding: 6 }}>Bar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {TAXONOMY_TREE.map((t, i) => {
                      const sc = selectedEntity.scores[t.code];
                      const rt = scoreToRating(sc);
                      return (
                        <tr key={t.code} style={{ borderBottom: `1px solid ${T.border}` }}>
                          <td style={{ padding: 6 }}><span style={{ fontFamily: T.mono, color: T.textMut, marginRight: 8 }}>{t.code}</span>{t.name}</td>
                          <td style={{ padding: 6, textAlign: 'right', fontFamily: T.mono, fontWeight: 700 }}>{sc}</td>
                          <td style={{ textAlign: 'center', padding: 6 }}><RatingBadge rating={rt.label} /></td>
                          <td style={{ padding: 6 }}>
                            <div style={{ width: '100%', height: 10, background: T.border, borderRadius: 5 }}>
                              <div style={{ width: `${sc}%`, height: '100%', background: rt.color || RATING_COLORS[rt.label], borderRadius: 5 }} />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Card>
            </div>
          </>
        )}

        {/* Tab 3: Score Distribution */}
        {tab === TABS[2] && (
          <Card title="Entity Score Distribution (0-100)">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={distributionData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="range" tick={{ fontFamily: T.mono, fontSize: 11 }} />
                <YAxis tick={{ fontFamily: T.mono, fontSize: 11 }} />
                <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} />
                <Bar dataKey="count" fill={T.navy} radius={[4, 4, 0, 0]}>
                  {distributionData.map((d, i) => <Cell key={i} fill={i < 4 ? T.red : i < 7 ? T.amber : T.green} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ marginTop: 12, display: 'flex', gap: 20, fontSize: 12, color: T.textSec }}>
              <span><span style={{ display: 'inline-block', width: 12, height: 12, background: T.red, borderRadius: 2, marginRight: 4 }} /> 0-40: E/D ratings</span>
              <span><span style={{ display: 'inline-block', width: 12, height: 12, background: T.amber, borderRadius: 2, marginRight: 4 }} /> 40-70: C/B ratings</span>
              <span><span style={{ display: 'inline-block', width: 12, height: 12, background: T.green, borderRadius: 2, marginRight: 4 }} /> 70-100: A rating</span>
            </div>
          </Card>
        )}

        {/* Tab 4: Scenario Comparison */}
        {tab === TABS[3] && (
          <Card title="Portfolio Score under NGFS Scenarios">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={scenarioData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="scenario" tick={{ fontFamily: T.font, fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                <YAxis domain={[0, 100]} tick={{ fontFamily: T.mono, fontSize: 11 }} />
                <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontFamily: T.font, fontSize: 11 }} />
                <Bar dataKey="worstCase" fill={T.red} name="Worst Case" radius={[4, 4, 0, 0]} />
                <Bar dataKey="portfolioScore" fill={T.navy} name="Central" radius={[4, 4, 0, 0]} />
                <Bar dataKey="bestCase" fill={T.green} name="Best Case" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Tab 5: Trend Analysis */}
        {tab === TABS[4] && (
          <Card title="Quarterly Score Trend (Portfolio + Top 4 Entities)">
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="quarter" tick={{ fontFamily: T.mono, fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontFamily: T.mono, fontSize: 11 }} />
                <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontFamily: T.font, fontSize: 11 }} />
                <Line dataKey="portfolioScore" stroke={T.gold} strokeWidth={3} name="Portfolio" dot={{ r: 4 }} />
                {ENTITIES.slice(0, 4).map((e, i) => (
                  <Line key={e.id} dataKey={e.name} stroke={L1_COLORS[i]} strokeWidth={1.5} strokeDasharray={i > 0 ? '5 5' : undefined} dot={{ r: 2 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Tab 6: Heatmap */}
        {tab === TABS[5] && (
          <Card title="Entity x L1 Topic Score Heatmap">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: T.font }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                    <th style={{ textAlign: 'left', padding: 6, position: 'sticky', left: 0, background: T.surface }}>Entity</th>
                    {TAXONOMY_TREE.map(t => <th key={t.code} style={{ textAlign: 'center', padding: 4, fontFamily: T.mono }}>{t.code}</th>)}
                    <th style={{ textAlign: 'center', padding: 4, fontFamily: T.mono, fontWeight: 700 }}>AVG</th>
                  </tr>
                </thead>
                <tbody>
                  {ENTITIES.map(e => (
                    <tr key={e.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: 6, fontWeight: 600, position: 'sticky', left: 0, background: T.surface, whiteSpace: 'nowrap' }}>{e.name}</td>
                      {TAXONOMY_TREE.map(t => {
                        const sc = e.scores[t.code];
                        const bg = sc >= 70 ? '#dcfce7' : sc >= 50 ? '#fef9c3' : sc >= 30 ? '#fed7aa' : '#fee2e2';
                        return <td key={t.code} style={{ textAlign: 'center', padding: 4, fontFamily: T.mono, fontWeight: 600, background: bg }}>{sc}</td>;
                      })}
                      <td style={{ textAlign: 'center', padding: 4, fontFamily: T.mono, fontWeight: 700, background: '#f0f4f8' }}>{e.overall}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        <div style={{ marginTop: 24, padding: '12px 16px', background: T.surface, borderRadius: 8, border: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: T.mono, color: T.textMut }}>
          <span>EP-CS2 · Assessment Engine Dashboard</span>
          <span>Sprint CS · {new Date().toISOString().split('T')[0]}</span>
        </div>
      </div>
    </div>
  );
}
