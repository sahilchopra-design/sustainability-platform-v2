/**
 * EP-CS1 — Transition Risk Taxonomy Browser
 * Sprint CS · Taxonomy & Assessment Engine Core
 *
 * Interactive 4-level taxonomy tree viewer with drill-down, coverage matrix,
 * data source mapping, sector overlay, and configuration controls.
 */
import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Treemap
} from 'recharts';
import TAXONOMY_TREE, {
  flattenTaxonomy, getLeafNodes, countByLevel, aggregateScores,
  scoreToRating, REFERENCE_DATA_SOURCES, HIGH_IMPACT_SECTORS, GEOGRAPHIC_REGIONS
} from '../../../data/taxonomyTree';

const T = { bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb', orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a', card:'#ffffff',sub:'#5c6b7e',indigo:'#4f46e5',font:"'DM Sans','SF Pro Display',system-ui,sans-serif", mono:"'JetBrains Mono','SF Mono','Fira Code',monospace" };

const TABS = ['Taxonomy Tree', 'Level Detail', 'Coverage Matrix', 'Data Source Map', 'Sector Overlay', 'Configuration'];
const DQ_COLORS = { 1: T.green, 2: '#22c55e', 3: T.amber, 4: T.orange, 5: T.red };
const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

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

const Badge = ({ color, label }) => (
  <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, fontFamily: T.mono, color: '#fff', background: color }}>{label}</span>
);

/* ─── Tree Node Component ─── */
const TreeNode = ({ node, depth = 0, expandedSet, toggle }) => {
  const isExpanded = expandedSet.has(node.code);
  const hasChildren = node.children && node.children.length > 0;
  return (
    <div style={{ marginLeft: depth * 22 }}>
      <div onClick={() => hasChildren && toggle(node.code)} style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', borderRadius: 6, cursor: hasChildren ? 'pointer' : 'default',
        background: depth === 0 ? '#f0f4f8' : 'transparent', marginBottom: 2,
        fontFamily: T.font, fontSize: 13, color: T.navy,
      }}>
        {hasChildren && <span style={{ fontFamily: T.mono, fontSize: 11, width: 16 }}>{isExpanded ? '▾' : '▸'}</span>}
        {!hasChildren && <span style={{ width: 16 }} />}
        <span style={{ fontFamily: T.mono, fontSize: 11, color: T.textSec, minWidth: 90 }}>{node.code}</span>
        <span style={{ fontWeight: depth === 0 ? 700 : 400 }}>{node.name}</span>
        <span style={{ marginLeft: 'auto', fontFamily: T.mono, fontSize: 11, color: T.textMut }}>w={(node.weight * 100).toFixed(0)}%</span>
        {node.quality && <Badge color={DQ_COLORS[node.quality]} label={`DQ${node.quality}`} />}
      </div>
      {isExpanded && hasChildren && node.children.map(c => (
        <TreeNode key={c.code} node={c} depth={depth + 1} expandedSet={expandedSet} toggle={toggle} />
      ))}
    </div>
  );
};

export default function TransitionRiskTaxonomyBrowserPage() {
  const [tab, setTab] = useState(TABS[0]);
  const [expanded, setExpanded] = useState(new Set(TAXONOMY_TREE.map(n => n.code)));
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [selectedL1, setSelectedL1] = useState(TAXONOMY_TREE[0]?.code || 'CE');

  const toggle = useCallback((code) => {
    setExpanded(prev => { const next = new Set(prev); next.has(code) ? next.delete(code) : next.add(code); return next; });
  }, []);

  const flat = useMemo(() => flattenTaxonomy(), []);
  const leaves = useMemo(() => getLeafNodes(), []);
  const levelCounts = useMemo(() => countByLevel(), []);

  const filteredTree = useMemo(() => {
    if (!searchTerm) return TAXONOMY_TREE;
    const term = searchTerm.toLowerCase();
    const filterNode = (node) => {
      if (node.name.toLowerCase().includes(term) || node.code.toLowerCase().includes(term)) return node;
      if (node.children) {
        const fc = node.children.map(filterNode).filter(Boolean);
        if (fc.length > 0) return { ...node, children: fc };
      }
      return null;
    };
    return TAXONOMY_TREE.map(filterNode).filter(Boolean);
  }, [searchTerm]);

  const levelData = useMemo(() => Object.entries(levelCounts).map(([lvl, count]) => ({ level: `L${lvl}`, count })), [levelCounts]);

  const coverageData = useMemo(() => {
    const sources = REFERENCE_DATA_SOURCES.slice(0, 12);
    return TAXONOMY_TREE.map(l1 => {
      const row = { topic: l1.name };
      sources.forEach(src => { row[src.name] = Math.round(40 + sr(l1.code.charCodeAt(0) + src.name.charCodeAt(0)) * 60); });
      return row;
    });
  }, []);

  const dqDistribution = useMemo(() => {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    leaves.forEach(l => { if (l.quality) counts[l.quality]++; });
    return Object.entries(counts).map(([q, c]) => ({ quality: `DQ ${q}`, count: c, fill: DQ_COLORS[q] }));
  }, [leaves]);

  const sectorOverlay = useMemo(() => HIGH_IMPACT_SECTORS.map((sec, i) => ({
    ...sec, affectedTopics: TAXONOMY_TREE.filter((_, j) => sr(i * 8 + j) > 0.3).map(t => t.code),
    exposure: Math.round(20 + sr(i * 13) * 80),
  })), []);

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: T.mono, fontSize: 11, color: T.textMut, marginBottom: 4 }}>EP-CS1 · SPRINT CS</div>
          <h1 style={{ fontSize: 26, color: T.navy, margin: 0 }}>Transition Risk Taxonomy Browser</h1>
          <p style={{ color: T.textSec, fontSize: 14, margin: '6px 0 0' }}>
            Interactive 4-level taxonomy tree with {leaves.length} leaf nodes across {TAXONOMY_TREE.length} L1 topics
          </p>
        </div>

        {/* KPI Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
          {Object.entries(levelCounts).map(([lvl, cnt]) => (
            <Card key={lvl} style={{ textAlign: 'center', padding: 14 }}>
              <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono }}>LEVEL {lvl}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: T.navy }}>{cnt}</div>
              <div style={{ fontSize: 11, color: T.textSec }}>nodes</div>
            </Card>
          ))}
          <Card style={{ textAlign: 'center', padding: 14 }}>
            <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono }}>DATA SOURCES</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: T.gold }}>{REFERENCE_DATA_SOURCES.length}</div>
            <div style={{ fontSize: 11, color: T.textSec }}>registered</div>
          </Card>
        </div>

        <TabBar tabs={TABS} active={tab} onSelect={setTab} />

        {/* ═══ Tab 1: Taxonomy Tree ═══ */}
        {tab === TABS[0] && (
          <Card title="4-Level Taxonomy Tree (click to expand/collapse)">
            <div style={{ marginBottom: 12 }}>
              <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search nodes by name or code..." style={{
                  width: '100%', padding: '8px 12px', border: `1px solid ${T.border}`, borderRadius: 6,
                  fontFamily: T.font, fontSize: 13, boxSizing: 'border-box',
                }} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <button onClick={() => { const all = new Set(); flat.forEach(n => all.add(n.code)); setExpanded(all); }}
                style={{ padding: '4px 12px', fontSize: 11, borderRadius: 4, border: `1px solid ${T.border}`, background: T.surface, cursor: 'pointer', fontFamily: T.font }}>
                Expand All
              </button>
              <button onClick={() => setExpanded(new Set())}
                style={{ padding: '4px 12px', fontSize: 11, borderRadius: 4, border: `1px solid ${T.border}`, background: T.surface, cursor: 'pointer', fontFamily: T.font }}>
                Collapse All
              </button>
            </div>
            <div style={{ maxHeight: 500, overflowY: 'auto', border: `1px solid ${T.border}`, borderRadius: 6, padding: 8 }}>
              {filteredTree.map(node => (
                <TreeNode key={node.code} node={node} expandedSet={expanded} toggle={toggle} />
              ))}
            </div>
          </Card>
        )}

        {/* ═══ Tab 2: Level Detail ═══ */}
        {tab === TABS[1] && (
          <>
            <Card title="Node Count by Level">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={levelData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="level" tick={{ fontFamily: T.mono, fontSize: 11 }} />
                  <YAxis tick={{ fontFamily: T.mono, fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} />
                  <Bar dataKey="count" fill={T.navy} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card title={`Level ${selectedLevel} Nodes`}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                {[1, 2, 3, 4].map(l => (
                  <button key={l} onClick={() => setSelectedLevel(l)} style={{
                    padding: '4px 14px', fontSize: 12, borderRadius: 4, cursor: 'pointer', fontFamily: T.mono,
                    background: selectedLevel === l ? T.navy : T.surface, color: selectedLevel === l ? '#fff' : T.navy,
                    border: `1px solid ${T.border}`,
                  }}>L{l}</button>
                ))}
              </div>
              <div style={{ maxHeight: 350, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.font }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                      <th style={{ textAlign: 'left', padding: 6, fontFamily: T.mono }}>Code</th>
                      <th style={{ textAlign: 'left', padding: 6 }}>Name</th>
                      <th style={{ textAlign: 'right', padding: 6 }}>Weight</th>
                      {selectedLevel === 4 && <th style={{ textAlign: 'center', padding: 6 }}>DQ</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {flat.filter(n => n.level === selectedLevel).slice(0, 60).map(n => (
                      <tr key={n.code} style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: 6, fontFamily: T.mono, color: T.textSec }}>{n.code}</td>
                        <td style={{ padding: 6 }}>{n.name}</td>
                        <td style={{ padding: 6, textAlign: 'right', fontFamily: T.mono }}>{(n.weight * 100).toFixed(0)}%</td>
                        {selectedLevel === 4 && <td style={{ textAlign: 'center', padding: 6 }}>{n.quality ? <Badge color={DQ_COLORS[n.quality]} label={`${n.quality}`} /> : '—'}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}

        {/* ═══ Tab 3: Coverage Matrix ═══ */}
        {tab === TABS[2] && (
          <Card title="Taxonomy × Data Source Coverage (%)">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: T.font, minWidth: 900 }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                    <th style={{ textAlign: 'left', padding: 6, position: 'sticky', left: 0, background: T.surface }}>L1 Topic</th>
                    {REFERENCE_DATA_SOURCES.slice(0, 12).map(s => (
                      <th key={s.name} style={{ textAlign: 'center', padding: 4, fontSize: 10, fontFamily: T.mono, writingMode: 'vertical-lr', height: 100 }}>{s.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {coverageData.map((row, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: 6, fontWeight: 600, position: 'sticky', left: 0, background: T.surface }}>{row.topic}</td>
                      {REFERENCE_DATA_SOURCES.slice(0, 12).map(s => {
                        const v = row[s.name];
                        const bg = v >= 80 ? '#dcfce7' : v >= 50 ? '#fef9c3' : '#fee2e2';
                        return <td key={s.name} style={{ textAlign: 'center', padding: 4, fontFamily: T.mono, fontSize: 11, background: bg }}>{v}%</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* ═══ Tab 4: Data Source Map ═══ */}
        {tab === TABS[3] && (
          <>
            <Card title="Data Quality Distribution">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={dqDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="quality" tick={{ fontFamily: T.mono, fontSize: 11 }} />
                  <YAxis tick={{ fontFamily: T.mono, fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {dqDistribution.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Reference Data Source Catalog">
              <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.font }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                      <th style={{ textAlign: 'left', padding: 6 }}>Source</th>
                      <th style={{ textAlign: 'left', padding: 6 }}>Provider</th>
                      <th style={{ textAlign: 'center', padding: 6 }}>Coverage</th>
                      <th style={{ textAlign: 'center', padding: 6 }}>Quality</th>
                      <th style={{ textAlign: 'center', padding: 6 }}>Refresh</th>
                    </tr>
                  </thead>
                  <tbody>
                    {REFERENCE_DATA_SOURCES.map((s, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: 6, fontWeight: 600 }}>{s.name}</td>
                        <td style={{ padding: 6, color: T.textSec }}>{s.provider || 'Various'}</td>
                        <td style={{ textAlign: 'center', padding: 6, fontFamily: T.mono }}>{s.coverage || 'Global'}</td>
                        <td style={{ textAlign: 'center', padding: 6 }}><Badge color={DQ_COLORS[s.avgQuality || 2]} label={`DQ${s.avgQuality || 2}`} /></td>
                        <td style={{ textAlign: 'center', padding: 6, fontFamily: T.mono, fontSize: 11 }}>{s.refreshFrequency || 'Annual'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}

        {/* ═══ Tab 5: Sector Overlay ═══ */}
        {tab === TABS[4] && (
          <>
            <Card title="High-Impact Sectors × L1 Taxonomy Topics">
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.font }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                      <th style={{ textAlign: 'left', padding: 6 }}>Sector</th>
                      <th style={{ textAlign: 'center', padding: 6 }}>NACE</th>
                      <th style={{ textAlign: 'center', padding: 6 }}>Sensitivity</th>
                      <th style={{ textAlign: 'left', padding: 6 }}>Affected L1 Topics</th>
                      <th style={{ textAlign: 'right', padding: 6 }}>Exposure %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sectorOverlay.map((sec, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: 6, fontWeight: 600 }}>{sec.name}</td>
                        <td style={{ textAlign: 'center', padding: 6, fontFamily: T.mono }}>{sec.nace}</td>
                        <td style={{ textAlign: 'center', padding: 6 }}>
                          <Badge color={sec.climateSensitivity === 'VERY_HIGH' ? T.red : sec.climateSensitivity === 'HIGH' ? T.orange : sec.climateSensitivity === 'MEDIUM' ? T.amber : T.green} label={sec.climateSensitivity} />
                        </td>
                        <td style={{ padding: 6 }}>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {sec.affectedTopics.map(c => <span key={c} style={{ padding: '1px 6px', borderRadius: 4, background: '#e0e7ff', fontFamily: T.mono, fontSize: 10 }}>{c}</span>)}
                          </div>
                        </td>
                        <td style={{ textAlign: 'right', padding: 6, fontFamily: T.mono, fontWeight: 600, color: sec.exposure > 60 ? T.red : T.navy }}>{sec.exposure}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
            <Card title="Sector Exposure Distribution">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sectorOverlay} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontFamily: T.mono, fontSize: 11 }} />
                  <YAxis dataKey="code" type="category" tick={{ fontFamily: T.mono, fontSize: 11 }} width={40} />
                  <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} />
                  <Bar dataKey="exposure" fill={T.navy} radius={[0, 4, 4, 0]}>
                    {sectorOverlay.map((s, i) => <Cell key={i} fill={s.climateSensitivity === 'VERY_HIGH' ? T.red : s.climateSensitivity === 'HIGH' ? T.orange : T.blue} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </>
        )}

        {/* ═══ Tab 6: Configuration ═══ */}
        {tab === TABS[5] && (
          <>
            <Card title="Taxonomy Display Settings">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, color: T.textSec, display: 'block', marginBottom: 4 }}>Default Expansion Level</label>
                  <select style={{ padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 4, fontFamily: T.font, fontSize: 13, width: '100%' }}>
                    <option>L1 Only (Topics)</option>
                    <option>L1 + L2 (Sub-topics)</option>
                    <option>Full Expansion</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: T.textSec, display: 'block', marginBottom: 4 }}>Color Scheme</label>
                  <select style={{ padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 4, fontFamily: T.font, fontSize: 13, width: '100%' }}>
                    <option>Data Quality (DQ 1-5)</option>
                    <option>Weight Intensity</option>
                    <option>Completeness</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: T.textSec, display: 'block', marginBottom: 4 }}>Minimum Data Quality</label>
                  <select style={{ padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 4, fontFamily: T.font, fontSize: 13, width: '100%' }}>
                    {[1, 2, 3, 4, 5].map(q => <option key={q}>DQ {q} — {q === 1 ? 'Reported' : q === 2 ? 'Verified' : q === 3 ? 'Estimated' : q === 4 ? 'Modelled' : 'Proxy'}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: T.textSec, display: 'block', marginBottom: 4 }}>Export Format</label>
                  <select style={{ padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 4, fontFamily: T.font, fontSize: 13, width: '100%' }}>
                    <option>JSON (Hierarchical)</option>
                    <option>CSV (Flat)</option>
                    <option>Excel (Multi-sheet)</option>
                  </select>
                </div>
              </div>
            </Card>
            <Card title="Reference Data Callout" style={{ background: '#fffbeb', borderColor: T.gold }}>
              <div style={{ fontSize: 13, color: T.navy, lineHeight: 1.7 }}>
                <strong>Taxonomy Specification:</strong> 4-level hierarchical framework covering {leaves.length} leaf-level indicators across {TAXONOMY_TREE.length} L1 topics.
                Weights are calibrated per EU CSRD Delegated Act Annex I sector classifications and TCFD/ISSB disclosure requirements.
                Data quality scoring follows PCAF 1-5 scale. Coverage spans {HIGH_IMPACT_SECTORS.length} high-impact sectors and {GEOGRAPHIC_REGIONS.length} geographic regions.
              </div>
            </Card>
          </>
        )}

        {/* Footer */}
        <div style={{ marginTop: 24, padding: '12px 16px', background: T.surface, borderRadius: 8, border: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: T.mono, color: T.textMut }}>
          <span>EP-CS1 · Transition Risk Taxonomy Browser</span>
          <span>Sprint CS · Taxonomy & Assessment Engine Core · {new Date().toISOString().split('T')[0]}</span>
        </div>
      </div>
    </div>
  );
}
