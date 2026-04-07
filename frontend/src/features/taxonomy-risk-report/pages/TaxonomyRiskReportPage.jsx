/**
 * EP-CS5 — Taxonomy Risk Report Generator
 * Sprint CS · Taxonomy & Assessment Engine Core
 *
 * Report generator with executive summary, entity reports, comparative analysis,
 * regulatory mapping, export center, and scheduling configuration.
 */
import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell
} from 'recharts';
import TAXONOMY_TREE, {
  getLeafNodes, scoreToRating, REFERENCE_DATA_SOURCES, HIGH_IMPACT_SECTORS,
  GEOGRAPHIC_REGIONS, REGULATORY_REQUIREMENTS
} from '../../../data/taxonomyTree';

const T = { bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb', orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a', card:'#ffffff',sub:'#5c6b7e',indigo:'#4f46e5',font:"'DM Sans','SF Pro Display',system-ui,sans-serif", mono:"'JetBrains Mono','SF Mono','Fira Code',monospace" };

const TABS = ['Executive Summary', 'Entity Reports', 'Comparative Analysis', 'Regulatory Mapping', 'Export Center', 'Scheduling'];
const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const RATING_COLORS = { A: T.green, B: '#22c55e', C: T.amber, D: T.orange, E: T.red };

const ENTITIES = ['Shell plc', 'BP plc', 'TotalEnergies', 'Enel SpA', 'NextEra Energy', 'Rio Tinto', 'ArcelorMittal', 'HeidelbergCement', 'Maersk', 'Deutsche Bank'].map((name, i) => {
  const scores = {};
  TAXONOMY_TREE.forEach((t, j) => { scores[t.code] = Math.round(25 + sr(i * 8 + j * 3) * 65); });
  const overall = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / TAXONOMY_TREE.length);
  const rt = scoreToRating(overall);
  return { id: i + 1, name, scores, overall, rating: rt.label, ratingColor: rt.color };
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

const RatingBadge = ({ rating }) => (
  <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 6, fontSize: 13, fontWeight: 700, fontFamily: T.mono, color: '#fff', background: RATING_COLORS[rating] || T.textMut }}>{rating}</span>
);

export default function TaxonomyRiskReportPage() {
  const [tab, setTab] = useState(TABS[0]);
  const [selectedEntity, setSelectedEntity] = useState(ENTITIES[0]);
  const [compareEntities, setCompareEntities] = useState([0, 1, 2]);
  const [exportFormat, setExportFormat] = useState('PDF');
  const [scheduleFreq, setScheduleFreq] = useState('Quarterly');

  const portfolioAvg = useMemo(() => Math.round(ENTITIES.reduce((s, e) => s + e.overall, 0) / ENTITIES.length), []);

  const l1PortfolioScores = useMemo(() => TAXONOMY_TREE.map(t => ({
    topic: t.code, name: t.name,
    score: Math.round(ENTITIES.reduce((s, e) => s + e.scores[t.code], 0) / ENTITIES.length),
    rating: scoreToRating(Math.round(ENTITIES.reduce((s, e) => s + e.scores[t.code], 0) / ENTITIES.length)).label,
  })), []);

  const radarData = useMemo(() => TAXONOMY_TREE.map(t => {
    const row = { topic: t.code };
    compareEntities.forEach(idx => { row[ENTITIES[idx].name] = ENTITIES[idx].scores[t.code]; });
    return row;
  }), [compareEntities]);

  const regData = useMemo(() => Object.entries(REGULATORY_REQUIREMENTS).map(([geo, req]) => ({
    jurisdiction: geo, frameworks: req.frameworks.join(', '),
    mandatory: req.mandatory === true ? 'Yes' : req.mandatory === 'partial' ? 'Partial' : 'No',
    effective: req.effective,
    coverageScore: Math.round(50 + sr(geo.charCodeAt(0)) * 45),
  })), []);

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: T.mono, fontSize: 11, color: T.textMut, marginBottom: 4 }}>EP-CS5 · SPRINT CS</div>
          <h1 style={{ fontSize: 26, color: T.navy, margin: 0 }}>Taxonomy Risk Report Generator</h1>
          <p style={{ color: T.textSec, fontSize: 14, margin: '6px 0 0' }}>
            Comprehensive reporting across {ENTITIES.length} entities · {TAXONOMY_TREE.length} L1 topics · {Object.keys(REGULATORY_REQUIREMENTS).length} jurisdictions
          </p>
        </div>

        <TabBar tabs={TABS} active={tab} onSelect={setTab} />

        {/* Tab 1: Executive Summary */}
        {tab === TABS[0] && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
              <Card style={{ textAlign: 'center', padding: 14 }}>
                <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono }}>PORTFOLIO SCORE</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: T.navy }}>{portfolioAvg}</div>
                <RatingBadge rating={scoreToRating(portfolioAvg).label} />
              </Card>
              <Card style={{ textAlign: 'center', padding: 14 }}>
                <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono }}>ENTITIES</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: T.navy }}>{ENTITIES.length}</div>
                <div style={{ fontSize: 11, color: T.textSec }}>assessed</div>
              </Card>
              <Card style={{ textAlign: 'center', padding: 14 }}>
                <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono }}>RISK TOPICS</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: T.gold }}>{TAXONOMY_TREE.length}</div>
                <div style={{ fontSize: 11, color: T.textSec }}>L1 categories</div>
              </Card>
              <Card style={{ textAlign: 'center', padding: 14 }}>
                <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono }}>JURISDICTIONS</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: T.teal }}>{Object.keys(REGULATORY_REQUIREMENTS).length}</div>
                <div style={{ fontSize: 11, color: T.textSec }}>regulatory</div>
              </Card>
            </div>
            <Card title="Portfolio-Level L1 Scores">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={l1PortfolioScores}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="topic" tick={{ fontFamily: T.mono, fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontFamily: T.mono, fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} />
                  <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                    {l1PortfolioScores.map((d, i) => <Cell key={i} fill={RATING_COLORS[d.rating] || T.navy} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </>
        )}

        {/* Tab 2: Entity Reports */}
        {tab === TABS[1] && (
          <>
            <Card>
              <select value={selectedEntity.id} onChange={e => setSelectedEntity(ENTITIES.find(en => en.id === +e.target.value))}
                style={{ padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 4, fontFamily: T.font, fontSize: 13 }}>
                {ENTITIES.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
              <span style={{ marginLeft: 12, fontFamily: T.mono, fontWeight: 700, fontSize: 18 }}>{selectedEntity.overall}/100</span>
              <span style={{ marginLeft: 8 }}><RatingBadge rating={selectedEntity.rating} /></span>
            </Card>
            <Card title={`${selectedEntity.name} — All 8 L1 Topic Scores`}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.font }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                    <th style={{ textAlign: 'left', padding: 6 }}>Topic</th>
                    <th style={{ textAlign: 'right', padding: 6 }}>Score</th>
                    <th style={{ textAlign: 'center', padding: 6 }}>Rating</th>
                    <th style={{ textAlign: 'left', padding: 6 }}>Assessment</th>
                  </tr>
                </thead>
                <tbody>
                  {TAXONOMY_TREE.map(t => {
                    const sc = selectedEntity.scores[t.code];
                    const rt = scoreToRating(sc);
                    return (
                      <tr key={t.code} style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: 6 }}><span style={{ fontFamily: T.mono, color: T.textMut }}>{t.code}</span> {t.name}</td>
                        <td style={{ padding: 6, textAlign: 'right', fontFamily: T.mono, fontWeight: 700 }}>{sc}</td>
                        <td style={{ textAlign: 'center', padding: 6 }}><RatingBadge rating={rt.label} /></td>
                        <td style={{ padding: 6, color: T.textSec, fontSize: 11 }}>{sc >= 70 ? 'Aligned' : sc >= 50 ? 'Partially aligned' : sc >= 30 ? 'Significant gaps' : 'Critical attention'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          </>
        )}

        {/* Tab 3: Comparative Analysis */}
        {tab === TABS[2] && (
          <>
            <Card>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: T.textSec }}>Compare:</span>
                {[0, 1, 2].map(slot => (
                  <select key={slot} value={compareEntities[slot]}
                    onChange={e => { const next = [...compareEntities]; next[slot] = +e.target.value; setCompareEntities(next); }}
                    style={{ padding: '4px 8px', border: `1px solid ${T.border}`, borderRadius: 4, fontFamily: T.font, fontSize: 12 }}>
                    {ENTITIES.map((en, i) => <option key={i} value={i}>{en.name}</option>)}
                  </select>
                ))}
              </div>
            </Card>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Card title="Radar Comparison">
                <ResponsiveContainer width="100%" height={320}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke={T.border} />
                    <PolarAngleAxis dataKey="topic" tick={{ fontFamily: T.mono, fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                    {compareEntities.map((idx, i) => (
                      <Radar key={idx} name={ENTITIES[idx].name} dataKey={ENTITIES[idx].name}
                        stroke={[T.navy, T.gold, T.teal][i]} fill={[T.navy, T.gold, T.teal][i]} fillOpacity={0.1} />
                    ))}
                    <Legend wrapperStyle={{ fontFamily: T.font, fontSize: 11 }} />
                    <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </Card>
              <Card title="Side-by-Side Scores">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.font }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                      <th style={{ textAlign: 'left', padding: 6 }}>Topic</th>
                      {compareEntities.map(idx => <th key={idx} style={{ textAlign: 'center', padding: 6 }}>{ENTITIES[idx].name.split(' ')[0]}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {TAXONOMY_TREE.map(t => (
                      <tr key={t.code} style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: 6, fontFamily: T.mono }}>{t.code}</td>
                        {compareEntities.map(idx => {
                          const sc = ENTITIES[idx].scores[t.code];
                          return <td key={idx} style={{ textAlign: 'center', padding: 6, fontFamily: T.mono, fontWeight: 700, color: scoreToRating(sc).color }}>{sc}</td>;
                        })}
                      </tr>
                    ))}
                    <tr style={{ borderTop: `2px solid ${T.navy}`, fontWeight: 700 }}>
                      <td style={{ padding: 6 }}>OVERALL</td>
                      {compareEntities.map(idx => <td key={idx} style={{ textAlign: 'center', padding: 6, fontFamily: T.mono }}>{ENTITIES[idx].overall}</td>)}
                    </tr>
                  </tbody>
                </table>
              </Card>
            </div>
          </>
        )}

        {/* Tab 4: Regulatory Mapping */}
        {tab === TABS[3] && (
          <Card title="Regulatory Requirements Coverage">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.font }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  <th style={{ textAlign: 'left', padding: 6 }}>Jurisdiction</th>
                  <th style={{ textAlign: 'left', padding: 6 }}>Frameworks</th>
                  <th style={{ textAlign: 'center', padding: 6 }}>Mandatory</th>
                  <th style={{ textAlign: 'center', padding: 6 }}>Effective</th>
                  <th style={{ textAlign: 'center', padding: 6 }}>Coverage</th>
                </tr>
              </thead>
              <tbody>
                {regData.map((r, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: 6, fontWeight: 600, fontFamily: T.mono }}>{r.jurisdiction}</td>
                    <td style={{ padding: 6, color: T.textSec, fontSize: 11, maxWidth: 300 }}>{r.frameworks}</td>
                    <td style={{ textAlign: 'center', padding: 6 }}>
                      <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, color: '#fff',
                        background: r.mandatory === 'Yes' ? T.green : r.mandatory === 'Partial' ? T.amber : T.red }}>{r.mandatory}</span>
                    </td>
                    <td style={{ textAlign: 'center', padding: 6, fontFamily: T.mono, fontSize: 11 }}>{r.effective}</td>
                    <td style={{ textAlign: 'center', padding: 6, fontFamily: T.mono, fontWeight: 600, color: r.coverageScore >= 75 ? T.green : r.coverageScore >= 50 ? T.amber : T.red }}>{r.coverageScore}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        {/* Tab 5: Export Center */}
        {tab === TABS[4] && (
          <Card title="Export Configuration">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <label style={{ fontSize: 12, color: T.textSec, display: 'block', marginBottom: 6 }}>Format</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['PDF', 'Excel', 'JSON', 'XBRL'].map(fmt => (
                    <button key={fmt} onClick={() => setExportFormat(fmt)} style={{
                      padding: '8px 20px', fontSize: 13, borderRadius: 6, cursor: 'pointer', fontFamily: T.font, fontWeight: 600,
                      background: exportFormat === fmt ? T.navy : T.surface, color: exportFormat === fmt ? '#fff' : T.navy,
                      border: `1px solid ${exportFormat === fmt ? T.navy : T.border}`,
                    }}>{fmt}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, color: T.textSec, display: 'block', marginBottom: 6 }}>Report Scope</label>
                <select style={{ padding: '8px 12px', border: `1px solid ${T.border}`, borderRadius: 6, fontFamily: T.font, fontSize: 13, width: '100%' }}>
                  <option>Full Portfolio Report</option>
                  <option>Executive Summary Only</option>
                  <option>Entity-Level Detail</option>
                  <option>Regulatory Compliance</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: T.textSec, display: 'block', marginBottom: 6 }}>Entities</label>
                <select multiple style={{ padding: '8px 12px', border: `1px solid ${T.border}`, borderRadius: 6, fontFamily: T.font, fontSize: 13, width: '100%', height: 120 }}>
                  {ENTITIES.map(e => <option key={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: T.textSec, display: 'block', marginBottom: 6 }}>Options</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                  {['Include charts', 'Include appendix', 'Include data sources', 'Include methodology'].map(opt => (
                    <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input type="checkbox" defaultChecked /> {opt}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <button style={{ marginTop: 20, padding: '10px 32px', fontSize: 14, fontWeight: 700, borderRadius: 6, border: 'none', background: T.navy, color: '#fff', cursor: 'pointer', fontFamily: T.font }}>
              Generate {exportFormat} Report
            </button>
          </Card>
        )}

        {/* Tab 6: Scheduling */}
        {tab === TABS[5] && (
          <Card title="Report Scheduling">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <label style={{ fontSize: 12, color: T.textSec, display: 'block', marginBottom: 6 }}>Frequency</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['Monthly', 'Quarterly', 'Semi-Annual', 'Annual'].map(f => (
                    <button key={f} onClick={() => setScheduleFreq(f)} style={{
                      padding: '8px 16px', fontSize: 12, borderRadius: 6, cursor: 'pointer', fontFamily: T.font,
                      background: scheduleFreq === f ? T.gold : T.surface, color: scheduleFreq === f ? '#fff' : T.navy,
                      border: `1px solid ${scheduleFreq === f ? T.gold : T.border}`,
                    }}>{f}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, color: T.textSec, display: 'block', marginBottom: 6 }}>Next Scheduled Run</label>
                <div style={{ fontFamily: T.mono, fontSize: 16, fontWeight: 700, color: T.navy }}>2026-07-01 09:00 UTC</div>
              </div>
              <div>
                <label style={{ fontSize: 12, color: T.textSec, display: 'block', marginBottom: 6 }}>Distribution List</label>
                <textarea placeholder="Enter email addresses..." style={{ width: '100%', height: 80, padding: 8, border: `1px solid ${T.border}`, borderRadius: 6, fontFamily: T.font, fontSize: 13, boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: T.textSec, display: 'block', marginBottom: 6 }}>Scheduled Reports</label>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <tbody>
                    {['Q1 2026 — Full Report', 'Q4 2025 — Full Report', 'Q3 2025 — Interim'].map((r, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: 4 }}>{r}</td>
                        <td style={{ padding: 4, textAlign: 'right' }}>
                          <span style={{ padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600, color: '#fff', background: i === 0 ? T.blue : T.green }}>{i === 0 ? 'PENDING' : 'SENT'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        )}

        <div style={{ marginTop: 24, padding: '12px 16px', background: T.surface, borderRadius: 8, border: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: T.mono, color: T.textMut }}>
          <span>EP-CS5 · Taxonomy Risk Report Generator</span>
          <span>Sprint CS · {new Date().toISOString().split('T')[0]}</span>
        </div>
      </div>
    </div>
  );
}
