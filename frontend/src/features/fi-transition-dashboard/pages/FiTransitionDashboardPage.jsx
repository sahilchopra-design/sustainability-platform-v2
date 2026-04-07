/**
 * EP-CT6 — FI Executive Transition Dashboard
 * Sprint CT · Financial Institution Profiler
 *
 * Executive dashboard with KPIs, taxonomy drill-down, client risk map,
 * regulatory readiness, action pipeline, and board report generator.
 */
import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell, ScatterChart, Scatter,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine
} from 'recharts';
import TAXONOMY_TREE, {
  scoreToRating, HIGH_IMPACT_SECTORS, GEOGRAPHIC_REGIONS, REGULATORY_REQUIREMENTS
} from '../../../data/taxonomyTree';

const T = { bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb', orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a', card:'#ffffff',sub:'#5c6b7e',indigo:'#4f46e5',font:"'DM Sans','SF Pro Display',system-ui,sans-serif", mono:"'JetBrains Mono','SF Mono','Fira Code',monospace" };

const TABS = ['Executive KPIs', 'Taxonomy Deep Drill', 'Client Risk Map', 'Regulatory Readiness', 'Action Pipeline', 'Board Report'];
const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const RATING_COLORS = { A: T.green, B: '#22c55e', C: T.amber, D: T.orange, E: T.red };

const CLIENTS = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1, name: `Client-${i + 1}`,
  exposure: Math.round(50 + sr(i * 7) * 450),
  score: Math.round(20 + sr(i * 11) * 70),
  sector: HIGH_IMPACT_SECTORS[i % 12].name,
}));

const TOTAL_EXPOSURE = CLIENTS.reduce((s, c) => s + c.exposure, 0);
const AVG_SCORE = Math.round(CLIENTS.reduce((s, c) => s + c.score, 0) / CLIENTS.length);

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

export default function FiTransitionDashboardPage() {
  const [tab, setTab] = useState(TABS[0]);
  const [drillL1, setDrillL1] = useState(null);
  const [drillL2, setDrillL2] = useState(null);

  const kpis = useMemo(() => [
    { label: 'Portfolio Transition Score', value: AVG_SCORE, unit: '/100', color: AVG_SCORE >= 60 ? T.green : T.amber, trend: '+3.2 QoQ' },
    { label: 'WACI', value: '142', unit: 'tCO2e/$M', color: T.navy, trend: '-8% YoY' },
    { label: 'Green Asset Ratio', value: '34.2', unit: '%', color: T.green, trend: '+2.1pp' },
    { label: 'Climate VaR (95%)', value: `$${Math.round(TOTAL_EXPOSURE * 0.068)}M`, unit: '', color: T.red, trend: '-$120M' },
    { label: 'Capital Adequacy', value: '14.8', unit: '%', color: T.green, trend: '+20bps' },
    { label: 'Client Engagement Rate', value: '72', unit: '%', color: T.teal, trend: '+5pp' },
  ], []);

  const fiTaxScores = useMemo(() => TAXONOMY_TREE.map((l1, i) => ({
    ...l1, fiScore: Math.round(35 + sr(i * 7) * 50),
    children: (l1.children || []).map((l2, j) => ({
      ...l2, fiScore: Math.round(30 + sr(i * 8 + j * 5) * 55),
      children: (l2.children || []).map((l3, k) => ({
        ...l3, fiScore: Math.round(25 + sr(i * 9 + j * 6 + k * 3) * 60),
      })),
    })),
  })), []);

  const drillData = useMemo(() => {
    if (drillL2) {
      const l1 = fiTaxScores.find(t => t.code === drillL1);
      const l2 = l1?.children?.find(c => c.code === drillL2);
      return l2?.children?.map(l3 => ({ code: l3.code, name: l3.name, score: l3.fiScore })) || [];
    }
    if (drillL1) {
      const l1 = fiTaxScores.find(t => t.code === drillL1);
      return l1?.children?.map(l2 => ({ code: l2.code, name: l2.name, score: l2.fiScore })) || [];
    }
    return fiTaxScores.map(l1 => ({ code: l1.code, name: l1.name, score: l1.fiScore }));
  }, [fiTaxScores, drillL1, drillL2]);

  const regReadiness = useMemo(() => Object.entries(REGULATORY_REQUIREMENTS).map(([geo, req]) => ({
    jurisdiction: geo, frameworks: req.frameworks.length, mandatory: req.mandatory,
    readiness: Math.round(40 + sr(geo.charCodeAt(0)) * 55),
    gaps: Math.round(sr(geo.charCodeAt(0) + 5) * 4),
  })), []);

  const pipeline = useMemo(() => [
    { id: 1, action: 'Complete CSRD E1 gap analysis', owner: 'Risk Team', priority: 'HIGH', deadline: '2026-Q2', status: 'IN PROGRESS', completion: 65 },
    { id: 2, action: 'Deploy enhanced climate VaR model', owner: 'Quant Team', priority: 'HIGH', deadline: '2026-Q2', status: 'IN PROGRESS', completion: 40 },
    { id: 3, action: 'Top 20 client engagement program', owner: 'Relationship Mgmt', priority: 'HIGH', deadline: '2026-Q3', status: 'PLANNING', completion: 15 },
    { id: 4, action: 'Basel IV climate RWA calibration', owner: 'Capital Mgmt', priority: 'MEDIUM', deadline: '2026-Q3', status: 'PLANNING', completion: 10 },
    { id: 5, action: 'Green taxonomy alignment review', owner: 'ESG Team', priority: 'MEDIUM', deadline: '2026-Q3', status: 'IN PROGRESS', completion: 55 },
    { id: 6, action: 'Transition plan board submission', owner: 'Strategy', priority: 'HIGH', deadline: '2026-Q4', status: 'NOT STARTED', completion: 0 },
    { id: 7, action: 'PCAF data quality improvement (DQ3 to DQ2)', owner: 'Data Team', priority: 'MEDIUM', deadline: '2026-Q4', status: 'IN PROGRESS', completion: 30 },
    { id: 8, action: 'Pillar 3 climate disclosure draft', owner: 'Finance', priority: 'HIGH', deadline: '2027-Q1', status: 'NOT STARTED', completion: 0 },
  ], []);

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: T.mono, fontSize: 11, color: T.textMut, marginBottom: 4 }}>EP-CT6 · SPRINT CT</div>
          <h1 style={{ fontSize: 26, color: T.navy, margin: 0 }}>FI Executive Transition Dashboard</h1>
          <p style={{ color: T.textSec, fontSize: 14, margin: '6px 0 0' }}>
            ${(TOTAL_EXPOSURE / 1000).toFixed(1)}B portfolio · {CLIENTS.length} clients · {Object.keys(REGULATORY_REQUIREMENTS).length} jurisdictions
          </p>
        </div>

        <TabBar tabs={TABS} active={tab} onSelect={setTab} />

        {/* Tab 1: Executive KPIs */}
        {tab === TABS[0] && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {kpis.map((k, i) => (
              <Card key={i} style={{ textAlign: 'center', padding: 20 }}>
                <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono, marginBottom: 8 }}>{k.label.toUpperCase()}</div>
                <div style={{ fontSize: 36, fontWeight: 800, color: k.color }}>{k.value}<span style={{ fontSize: 14, fontWeight: 400, color: T.textSec }}>{k.unit}</span></div>
                <div style={{ fontSize: 12, color: k.trend.startsWith('+') || k.trend.startsWith('-$') && k.trend.includes('-$') ? T.green : T.textSec, marginTop: 4 }}>
                  {k.trend}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Tab 2: Taxonomy Drill */}
        {tab === TABS[1] && (
          <Card title={`Taxonomy Drill-Down ${drillL1 ? `> ${drillL1}` : ''}${drillL2 ? ` > ${drillL2}` : ''}`}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <button onClick={() => { setDrillL1(null); setDrillL2(null); }}
                style={{ padding: '4px 12px', fontSize: 11, borderRadius: 4, border: `1px solid ${T.border}`, background: !drillL1 ? T.navy : T.surface, color: !drillL1 ? '#fff' : T.navy, cursor: 'pointer', fontFamily: T.font }}>L1 Topics</button>
              {drillL1 && <button onClick={() => setDrillL2(null)}
                style={{ padding: '4px 12px', fontSize: 11, borderRadius: 4, border: `1px solid ${T.border}`, background: !drillL2 ? T.navy : T.surface, color: !drillL2 ? '#fff' : T.navy, cursor: 'pointer', fontFamily: T.mono }}>{drillL1}</button>}
              {drillL2 && <span style={{ padding: '4px 12px', fontSize: 11, borderRadius: 4, background: T.navy, color: '#fff', fontFamily: T.mono }}>{drillL2}</span>}
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={drillData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="code" tick={{ fontFamily: T.mono, fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontFamily: T.mono, fontSize: 11 }} />
                <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} />
                <Bar dataKey="score" radius={[4, 4, 0, 0]}
                  onClick={(d) => {
                    if (!drillL1) setDrillL1(d.code);
                    else if (!drillL2) setDrillL2(d.code);
                  }}
                  cursor="pointer">
                  {drillData.map((d, i) => {
                    const rt = scoreToRating(d.score);
                    return <Cell key={i} fill={RATING_COLORS[rt] || T.navy} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ fontSize: 12, color: T.textSec, marginTop: 8 }}>Click a bar to drill down to the next level.</div>
          </Card>
        )}

        {/* Tab 3: Client Risk Map */}
        {tab === TABS[2] && (
          <Card title="Client Risk Map — Exposure vs Transition Score">
            <ResponsiveContainer width="100%" height={380}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="score" name="Transition Score" domain={[0, 100]} tick={{ fontFamily: T.mono, fontSize: 11 }}
                  label={{ value: 'Transition Score', position: 'insideBottom', offset: -5, fontFamily: T.font, fontSize: 12 }} />
                <YAxis dataKey="exposure" name="Exposure $M" tick={{ fontFamily: T.mono, fontSize: 11 }}
                  label={{ value: 'Exposure ($M)', angle: -90, position: 'insideLeft', fontFamily: T.font, fontSize: 12 }} />
                <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} formatter={(v, name) => name === 'Exposure $M' ? `$${v}M` : v} />
                <ReferenceLine x={40} stroke={T.red} strokeDasharray="5 5" label={{ value: 'Watchlist', fill: T.red, fontSize: 10 }} />
                <Scatter data={CLIENTS} fill={T.navy}>
                  {CLIENTS.map((c, i) => <Cell key={i} fill={c.score < 40 ? T.red : c.score < 60 ? T.amber : T.green} />)}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
            <div style={{ marginTop: 8, display: 'flex', gap: 16, fontSize: 12, color: T.textSec }}>
              <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: T.red, marginRight: 4 }} /> Score &lt; 40 (Watchlist)</span>
              <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: T.amber, marginRight: 4 }} /> Score 40-60</span>
              <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: T.green, marginRight: 4 }} /> Score &gt; 60</span>
            </div>
          </Card>
        )}

        {/* Tab 4: Regulatory Readiness */}
        {tab === TABS[3] && (
          <Card title="Regulatory Readiness by Jurisdiction">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.font }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  <th style={{ textAlign: 'left', padding: 6 }}>Jurisdiction</th>
                  <th style={{ textAlign: 'center', padding: 6 }}># Frameworks</th>
                  <th style={{ textAlign: 'center', padding: 6 }}>Mandatory</th>
                  <th style={{ textAlign: 'center', padding: 6 }}>Readiness</th>
                  <th style={{ textAlign: 'center', padding: 6 }}>Gaps</th>
                </tr>
              </thead>
              <tbody>
                {regReadiness.map((r, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: 6, fontWeight: 600, fontFamily: T.mono }}>{r.jurisdiction}</td>
                    <td style={{ textAlign: 'center', padding: 6, fontFamily: T.mono }}>{r.frameworks}</td>
                    <td style={{ textAlign: 'center', padding: 6 }}>
                      <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600, color: '#fff',
                        background: r.mandatory === true ? T.green : r.mandatory === 'partial' ? T.amber : T.red }}>
                        {r.mandatory === true ? 'YES' : r.mandatory === 'partial' ? 'PARTIAL' : 'NO'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', padding: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                        <div style={{ width: 60, height: 8, background: T.border, borderRadius: 4 }}>
                          <div style={{ width: `${r.readiness}%`, height: '100%', background: r.readiness >= 70 ? T.green : r.readiness >= 50 ? T.amber : T.red, borderRadius: 4 }} />
                        </div>
                        <span style={{ fontFamily: T.mono, fontWeight: 700, fontSize: 11 }}>{r.readiness}%</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center', padding: 6, fontFamily: T.mono, color: T.red, fontWeight: 600 }}>{r.gaps}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        {/* Tab 5: Action Pipeline */}
        {tab === TABS[4] && (
          <Card title="Climate Action Pipeline">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.font }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  <th style={{ textAlign: 'left', padding: 6 }}>Action</th>
                  <th style={{ textAlign: 'left', padding: 6 }}>Owner</th>
                  <th style={{ textAlign: 'center', padding: 6 }}>Priority</th>
                  <th style={{ textAlign: 'center', padding: 6 }}>Deadline</th>
                  <th style={{ textAlign: 'center', padding: 6 }}>Status</th>
                  <th style={{ textAlign: 'center', padding: 6 }}>Progress</th>
                </tr>
              </thead>
              <tbody>
                {pipeline.map(p => (
                  <tr key={p.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: 6, fontWeight: 600 }}>{p.action}</td>
                    <td style={{ padding: 6, color: T.textSec, fontSize: 11 }}>{p.owner}</td>
                    <td style={{ textAlign: 'center', padding: 6 }}>
                      <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, color: '#fff',
                        background: p.priority === 'HIGH' ? T.red : T.amber }}>{p.priority}</span>
                    </td>
                    <td style={{ textAlign: 'center', padding: 6, fontFamily: T.mono, fontSize: 11 }}>{p.deadline}</td>
                    <td style={{ textAlign: 'center', padding: 6 }}>
                      <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600, color: '#fff',
                        background: p.status === 'IN PROGRESS' ? T.blue : p.status === 'PLANNING' ? T.amber : p.status === 'NOT STARTED' ? T.textMut : T.green }}>{p.status}</span>
                    </td>
                    <td style={{ textAlign: 'center', padding: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                        <div style={{ width: 60, height: 8, background: T.border, borderRadius: 4 }}>
                          <div style={{ width: `${p.completion}%`, height: '100%', background: p.completion >= 50 ? T.green : p.completion > 0 ? T.blue : T.textMut, borderRadius: 4 }} />
                        </div>
                        <span style={{ fontFamily: T.mono, fontSize: 11 }}>{p.completion}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        {/* Tab 6: Board Report */}
        {tab === TABS[5] && (
          <Card title="Board Report Generator">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <label style={{ fontSize: 12, color: T.textSec, display: 'block', marginBottom: 6 }}>Report Period</label>
                <select style={{ padding: '8px 12px', border: `1px solid ${T.border}`, borderRadius: 6, fontFamily: T.font, fontSize: 13, width: '100%' }}>
                  <option>Q1 2026</option>
                  <option>Q4 2025</option>
                  <option>FY 2025</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: T.textSec, display: 'block', marginBottom: 6 }}>Board Committee</label>
                <select style={{ padding: '8px 12px', border: `1px solid ${T.border}`, borderRadius: 6, fontFamily: T.font, fontSize: 13, width: '100%' }}>
                  <option>Board Risk Committee</option>
                  <option>Full Board</option>
                  <option>Audit Committee</option>
                  <option>ESG Committee</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: T.textSec, display: 'block', marginBottom: 6 }}>Sections to Include</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                  {['Executive Summary & KPIs', 'Portfolio Transition Score', 'Regulatory Compliance Status', 'Top Risks & Watchlist', 'Action Pipeline Update', 'Forward-Looking Targets'].map(opt => (
                    <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input type="checkbox" defaultChecked /> {opt}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, color: T.textSec, display: 'block', marginBottom: 6 }}>Format</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['PDF', 'PowerPoint', 'Word'].map(fmt => (
                    <button key={fmt} style={{ padding: '8px 20px', fontSize: 13, borderRadius: 6, border: `1px solid ${T.border}`, background: T.surface, cursor: 'pointer', fontFamily: T.font }}>{fmt}</button>
                  ))}
                </div>
              </div>
            </div>
            <button style={{ marginTop: 20, padding: '12px 32px', fontSize: 14, fontWeight: 700, borderRadius: 6, border: 'none', background: T.navy, color: '#fff', cursor: 'pointer', fontFamily: T.font }}>
              Generate Board Report
            </button>
            <div style={{ marginTop: 16, padding: 12, background: '#fffbeb', borderRadius: 6, fontSize: 12, color: T.navy }}>
              <strong>Reference:</strong> Board reporting aligned with TCFD governance recommendations, ECB Guide on climate-related and environmental risks (Nov 2020), and BoE SS3/19 expectations for board oversight.
            </div>
          </Card>
        )}

        <div style={{ marginTop: 24, padding: '12px 16px', background: T.surface, borderRadius: 8, border: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: T.mono, color: T.textMut }}>
          <span>EP-CT6 · FI Executive Transition Dashboard</span>
          <span>Sprint CT · Financial Institution Profiler · {new Date().toISOString().split('T')[0]}</span>
        </div>
      </div>
    </div>
  );
}
