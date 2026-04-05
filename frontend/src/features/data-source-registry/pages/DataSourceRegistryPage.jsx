/**
 * EP-CS3 — Data Source Registry
 * Sprint CS · Taxonomy & Assessment Engine Core
 *
 * Reference data registry with source catalog, quality monitoring,
 * coverage gaps, refresh status, integration log, and new source identifier.
 */
import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import TAXONOMY_TREE, {
  flattenTaxonomy, getLeafNodes, countByLevel,
  REFERENCE_DATA_SOURCES, HIGH_IMPACT_SECTORS, GEOGRAPHIC_REGIONS
} from '../../../data/taxonomyTree';

const T = { bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb', orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a', font:"'DM Sans','SF Pro Display',system-ui,sans-serif", mono:"'JetBrains Mono','SF Mono','Fira Code',monospace" };

const TABS = ['Source Catalog', 'Quality Monitor', 'Coverage Gaps', 'Refresh Status', 'Integration Log', 'New Source Identifier'];
const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const DQ_COLORS = { 1: T.green, 2: '#22c55e', 3: T.amber, 4: T.orange, 5: T.red };
const DQ_LABELS = { 1: 'Reported', 2: 'Verified', 3: 'Estimated', 4: 'Modelled', 5: 'Proxy' };

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

const INTEGRATION_LOG = Array.from({ length: 20 }, (_, i) => {
  const src = REFERENCE_DATA_SOURCES[i % REFERENCE_DATA_SOURCES.length];
  const statuses = ['SUCCESS', 'SUCCESS', 'SUCCESS', 'WARNING', 'FAILED'];
  const status = statuses[Math.floor(sr(i * 7) * 5)];
  const d = new Date(2026, 3, 4 - Math.floor(i / 3));
  return {
    id: i + 1, source: src?.name || 'CDP', timestamp: d.toISOString().replace('T', ' ').slice(0, 16),
    status, records: Math.round(1000 + sr(i * 11) * 50000),
    duration: `${Math.round(2 + sr(i * 13) * 28)}s`,
  };
});

const RECOMMENDED_SOURCES = [
  { name: 'Climate TRACE', type: 'Satellite/ML', coverage: 'Global', gap: 'Scope 1 verification', quality: 2 },
  { name: 'MSCI ESG Research', type: 'Proprietary', coverage: 'Global 8,500+', gap: 'Governance scores', quality: 2 },
  { name: 'Sustainalytics', type: 'Proprietary', coverage: 'Global 4,500+', gap: 'Physical risk scores', quality: 2 },
  { name: 'S&P Trucost', type: 'Proprietary', coverage: 'Global 15,000+', gap: 'Environmental cost', quality: 2 },
  { name: 'NGFS Scenarios', type: 'Public', coverage: 'Global macro', gap: 'Scenario parameters', quality: 1 },
  { name: 'Copernicus CDS', type: 'Public', coverage: 'Global climate data', gap: 'Physical hazard layers', quality: 1 },
  { name: 'OpenStreetMap', type: 'Public', coverage: 'Global spatial', gap: 'Asset geolocation', quality: 3 },
  { name: 'World Bank WDI', type: 'Public', coverage: '217 countries', gap: 'Macro indicators', quality: 1 },
];

export default function DataSourceRegistryPage() {
  const [tab, setTab] = useState(TABS[0]);
  const [filterQuality, setFilterQuality] = useState('all');
  const [searchSrc, setSearchSrc] = useState('');

  const leaves = useMemo(() => getLeafNodes(), []);

  const dqDistribution = useMemo(() => {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    leaves.forEach(l => { if (l.quality) counts[l.quality]++; });
    return Object.entries(counts).map(([q, c]) => ({ quality: `DQ ${q} — ${DQ_LABELS[q]}`, count: c, fill: DQ_COLORS[q], level: +q }));
  }, [leaves]);

  const coverageGaps = useMemo(() => {
    return leaves.filter(l => !l.dataSources || l.dataSources.length === 0 || (l.quality && l.quality >= 4)).slice(0, 25).map(l => ({
      code: l.code, name: l.name, quality: l.quality || 5,
      issue: (!l.dataSources || l.dataSources.length === 0) ? 'No primary source' : 'Low quality (DQ4+)',
    }));
  }, [leaves]);

  const refreshData = useMemo(() => REFERENCE_DATA_SOURCES.map((s, i) => {
    const freqs = ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annual'];
    const freq = freqs[Math.floor(sr(i * 7) * 5)];
    const daysAgo = Math.floor(sr(i * 11) * 90);
    const isOverdue = (freq === 'Daily' && daysAgo > 2) || (freq === 'Weekly' && daysAgo > 10) || (freq === 'Monthly' && daysAgo > 35);
    return { ...s, frequency: s.refreshFrequency || freq, lastRefresh: `${daysAgo}d ago`, overdue: isOverdue, records: Math.round(5000 + sr(i * 13) * 95000) };
  }), []);

  const filteredSources = useMemo(() => {
    let src = REFERENCE_DATA_SOURCES;
    if (searchSrc) src = src.filter(s => s.name.toLowerCase().includes(searchSrc.toLowerCase()));
    return src;
  }, [searchSrc]);

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: T.mono, fontSize: 11, color: T.textMut, marginBottom: 4 }}>EP-CS3 · SPRINT CS</div>
          <h1 style={{ fontSize: 26, color: T.navy, margin: 0 }}>Data Source Registry</h1>
          <p style={{ color: T.textSec, fontSize: 14, margin: '6px 0 0' }}>
            {REFERENCE_DATA_SOURCES.length} registered sources · {leaves.length} taxonomy leaf nodes
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Total Sources', value: REFERENCE_DATA_SOURCES.length, color: T.navy },
            { label: 'Avg DQ Score', value: '2.4', color: T.green },
            { label: 'Coverage Gaps', value: coverageGaps.length, color: T.red },
            { label: 'Overdue Refresh', value: refreshData.filter(r => r.overdue).length, color: T.amber },
          ].map((k, i) => (
            <Card key={i} style={{ textAlign: 'center', padding: 14 }}>
              <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono }}>{k.label.toUpperCase()}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: k.color }}>{k.value}</div>
            </Card>
          ))}
        </div>

        <TabBar tabs={TABS} active={tab} onSelect={setTab} />

        {/* Tab 1: Source Catalog */}
        {tab === TABS[0] && (
          <Card title="Reference Data Source Catalog">
            <input value={searchSrc} onChange={e => setSearchSrc(e.target.value)}
              placeholder="Search sources..." style={{ width: '100%', padding: '8px 12px', border: `1px solid ${T.border}`, borderRadius: 6, fontFamily: T.font, fontSize: 13, marginBottom: 12, boxSizing: 'border-box' }} />
            <div style={{ maxHeight: 450, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.font }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                    <th style={{ textAlign: 'left', padding: 6 }}>Source Name</th>
                    <th style={{ textAlign: 'left', padding: 6 }}>Provider</th>
                    <th style={{ textAlign: 'center', padding: 6 }}>Avg Quality</th>
                    <th style={{ textAlign: 'center', padding: 6 }}>Coverage</th>
                    <th style={{ textAlign: 'center', padding: 6 }}>Refresh</th>
                    <th style={{ textAlign: 'center', padding: 6 }}>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSources.map((s, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: 6, fontWeight: 600 }}>{s.name}</td>
                      <td style={{ padding: 6, color: T.textSec }}>{s.provider || 'Various'}</td>
                      <td style={{ textAlign: 'center', padding: 6 }}><Badge color={DQ_COLORS[s.avgQuality || 2]} label={`DQ${s.avgQuality || 2}`} /></td>
                      <td style={{ textAlign: 'center', padding: 6, fontFamily: T.mono, fontSize: 11 }}>{s.coverage || 'Global'}</td>
                      <td style={{ textAlign: 'center', padding: 6, fontFamily: T.mono, fontSize: 11 }}>{s.refreshFrequency || 'Annual'}</td>
                      <td style={{ textAlign: 'center', padding: 6 }}><Badge color={T.blue} label={s.type || 'Public'} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Tab 2: Quality Monitor */}
        {tab === TABS[1] && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Card title="Data Quality Distribution (Leaf Nodes)">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={dqDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="quality" tick={{ fontFamily: T.font, fontSize: 10 }} />
                  <YAxis tick={{ fontFamily: T.mono, fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {dqDistribution.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Quality by DQ Level">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={dqDistribution} dataKey="count" nameKey="quality" cx="50%" cy="50%" outerRadius={100} label={({ quality, count }) => `${quality}: ${count}`}>
                    {dqDistribution.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

        {/* Tab 3: Coverage Gaps */}
        {tab === TABS[2] && (
          <Card title={`Coverage Gaps — ${coverageGaps.length} nodes need attention`}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.font }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  <th style={{ textAlign: 'left', padding: 6 }}>Code</th>
                  <th style={{ textAlign: 'left', padding: 6 }}>Node Name</th>
                  <th style={{ textAlign: 'center', padding: 6 }}>Current DQ</th>
                  <th style={{ textAlign: 'left', padding: 6 }}>Issue</th>
                  <th style={{ textAlign: 'center', padding: 6 }}>Priority</th>
                </tr>
              </thead>
              <tbody>
                {coverageGaps.map((g, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: 6, fontFamily: T.mono, color: T.textSec }}>{g.code}</td>
                    <td style={{ padding: 6, fontWeight: 600 }}>{g.name}</td>
                    <td style={{ textAlign: 'center', padding: 6 }}><Badge color={DQ_COLORS[g.quality]} label={`DQ${g.quality}`} /></td>
                    <td style={{ padding: 6, color: T.red }}>{g.issue}</td>
                    <td style={{ textAlign: 'center', padding: 6 }}><Badge color={g.quality >= 5 ? T.red : T.amber} label={g.quality >= 5 ? 'HIGH' : 'MEDIUM'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        {/* Tab 4: Refresh Status */}
        {tab === TABS[3] && (
          <Card title="Data Refresh Status">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.font }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  <th style={{ textAlign: 'left', padding: 6 }}>Source</th>
                  <th style={{ textAlign: 'center', padding: 6 }}>Frequency</th>
                  <th style={{ textAlign: 'center', padding: 6 }}>Last Refresh</th>
                  <th style={{ textAlign: 'right', padding: 6 }}>Records</th>
                  <th style={{ textAlign: 'center', padding: 6 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {refreshData.map((r, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: 6, fontWeight: 600 }}>{r.name}</td>
                    <td style={{ textAlign: 'center', padding: 6, fontFamily: T.mono, fontSize: 11 }}>{r.frequency}</td>
                    <td style={{ textAlign: 'center', padding: 6, fontFamily: T.mono, fontSize: 11 }}>{r.lastRefresh}</td>
                    <td style={{ textAlign: 'right', padding: 6, fontFamily: T.mono }}>{r.records.toLocaleString()}</td>
                    <td style={{ textAlign: 'center', padding: 6 }}><Badge color={r.overdue ? T.red : T.green} label={r.overdue ? 'OVERDUE' : 'CURRENT'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        {/* Tab 5: Integration Log */}
        {tab === TABS[4] && (
          <Card title="Recent Integration Events">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.font }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  <th style={{ textAlign: 'center', padding: 6 }}>#</th>
                  <th style={{ textAlign: 'left', padding: 6 }}>Timestamp</th>
                  <th style={{ textAlign: 'left', padding: 6 }}>Source</th>
                  <th style={{ textAlign: 'center', padding: 6 }}>Status</th>
                  <th style={{ textAlign: 'right', padding: 6 }}>Records</th>
                  <th style={{ textAlign: 'center', padding: 6 }}>Duration</th>
                </tr>
              </thead>
              <tbody>
                {INTEGRATION_LOG.map(log => (
                  <tr key={log.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ textAlign: 'center', padding: 6, fontFamily: T.mono, color: T.textMut }}>{log.id}</td>
                    <td style={{ padding: 6, fontFamily: T.mono, fontSize: 11 }}>{log.timestamp}</td>
                    <td style={{ padding: 6, fontWeight: 600 }}>{log.source}</td>
                    <td style={{ textAlign: 'center', padding: 6 }}><Badge color={log.status === 'SUCCESS' ? T.green : log.status === 'WARNING' ? T.amber : T.red} label={log.status} /></td>
                    <td style={{ textAlign: 'right', padding: 6, fontFamily: T.mono }}>{log.records.toLocaleString()}</td>
                    <td style={{ textAlign: 'center', padding: 6, fontFamily: T.mono }}>{log.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        {/* Tab 6: New Source Identifier */}
        {tab === TABS[5] && (
          <Card title="Recommended Public Data Sources to Close Gaps">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.font }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  <th style={{ textAlign: 'left', padding: 6 }}>Source</th>
                  <th style={{ textAlign: 'left', padding: 6 }}>Type</th>
                  <th style={{ textAlign: 'center', padding: 6 }}>Coverage</th>
                  <th style={{ textAlign: 'left', padding: 6 }}>Gap Addressed</th>
                  <th style={{ textAlign: 'center', padding: 6 }}>Est. DQ</th>
                  <th style={{ textAlign: 'center', padding: 6 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {RECOMMENDED_SOURCES.map((s, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: 6, fontWeight: 600 }}>{s.name}</td>
                    <td style={{ padding: 6 }}><Badge color={s.type === 'Public' ? T.blue : T.purple} label={s.type} /></td>
                    <td style={{ textAlign: 'center', padding: 6, fontFamily: T.mono, fontSize: 11 }}>{s.coverage}</td>
                    <td style={{ padding: 6, color: T.textSec }}>{s.gap}</td>
                    <td style={{ textAlign: 'center', padding: 6 }}><Badge color={DQ_COLORS[s.quality]} label={`DQ${s.quality}`} /></td>
                    <td style={{ textAlign: 'center', padding: 6 }}>
                      <button style={{ padding: '3px 10px', fontSize: 11, borderRadius: 4, border: `1px solid ${T.navy}`, background: T.navy, color: '#fff', cursor: 'pointer', fontFamily: T.font }}>Register</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: 16, padding: 12, background: '#fffbeb', borderRadius: 6, fontSize: 12, color: T.navy }}>
              <strong>Reference:</strong> Source recommendations based on PCAF data quality hierarchy, TCFD implementation guidance, and ISSB IFRS S2 data requirements.
            </div>
          </Card>
        )}

        <div style={{ marginTop: 24, padding: '12px 16px', background: T.surface, borderRadius: 8, border: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: T.mono, color: T.textMut }}>
          <span>EP-CS3 · Data Source Registry</span>
          <span>Sprint CS · {new Date().toISOString().split('T')[0]}</span>
        </div>
      </div>
    </div>
  );
}
