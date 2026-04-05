import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend, ReferenceLine, ZAxis
} from 'recharts';

const T = {
  bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c',
  navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae',
  red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb',
  orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a',
  font:"'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"
};

const DIMS = ['Voice & Accountability','Political Stability','Govt Effectiveness','Regulatory Quality','Rule of Law','Control of Corruption'];
const REGIONS = ['North America','Western Europe','Eastern Europe','Middle East','Sub-Saharan Africa','North Africa','South Asia','East Asia','Southeast Asia','Central Asia','Latin America','Oceania'];

const COUNTRIES = [
  { name:'USA', region:'North America', va:78, ps:55, ge:82, rq:85, rl:80, cc:76, sanctions:5, conflict:8, trade:15, trend:[72,73,74,73,72] },
  { name:'Canada', region:'North America', va:88, ps:82, ge:90, rq:92, rl:91, cc:89, sanctions:2, conflict:2, trade:8, trend:[85,86,87,88,88] },
  { name:'UK', region:'Western Europe', va:85, ps:62, ge:86, rq:90, rl:88, cc:84, sanctions:4, conflict:5, trade:10, trend:[80,81,82,81,82] },
  { name:'Germany', region:'Western Europe', va:90, ps:72, ge:88, rq:91, rl:90, cc:88, sanctions:3, conflict:3, trade:8, trend:[85,86,87,87,86] },
  { name:'France', region:'Western Europe', va:82, ps:58, ge:84, rq:82, rl:84, cc:78, sanctions:3, conflict:6, trade:9, trend:[78,79,80,79,78] },
  { name:'Japan', region:'East Asia', va:80, ps:85, ge:88, rq:84, rl:86, cc:82, sanctions:4, conflict:3, trade:12, trend:[82,83,83,84,84] },
  { name:'Australia', region:'Oceania', va:88, ps:80, ge:88, rq:92, rl:90, cc:86, sanctions:3, conflict:2, trade:15, trend:[85,86,87,87,86] },
  { name:'South Korea', region:'East Asia', va:72, ps:52, ge:82, rq:80, rl:78, cc:68, sanctions:8, conflict:15, trade:14, trend:[70,71,72,72,71] },
  { name:'Singapore', region:'Southeast Asia', va:42, ps:92, ge:96, rq:98, rl:95, cc:94, sanctions:2, conflict:1, trade:5, trend:[88,89,90,91,92] },
  { name:'UAE', region:'Middle East', va:18, ps:72, ge:82, rq:76, rl:74, cc:72, sanctions:8, conflict:10, trade:12, trend:[65,67,69,70,71] },
  { name:'Saudi Arabia', region:'Middle East', va:5, ps:42, ge:58, rq:52, rl:55, cc:48, sanctions:12, conflict:18, trade:20, trend:[42,44,46,48,49] },
  { name:'China', region:'East Asia', va:5, ps:38, ge:68, rq:42, rl:45, cc:42, sanctions:25, conflict:12, trade:35, trend:[38,37,36,35,34] },
  { name:'India', region:'South Asia', va:58, ps:22, ge:55, rq:42, rl:48, cc:38, sanctions:5, conflict:20, trade:18, trend:[42,43,44,44,44] },
  { name:'Brazil', region:'Latin America', va:62, ps:30, ge:42, rq:38, rl:42, cc:35, sanctions:3, conflict:12, trade:10, trend:[40,39,40,41,42] },
  { name:'Mexico', region:'Latin America', va:48, ps:15, ge:45, rq:52, rl:30, cc:22, sanctions:5, conflict:25, trade:15, trend:[34,33,32,32,33] },
  { name:'South Africa', region:'Sub-Saharan Africa', va:65, ps:25, ge:48, rq:52, rl:50, cc:42, sanctions:4, conflict:15, trade:8, trend:[45,44,43,42,42] },
  { name:'Nigeria', region:'Sub-Saharan Africa', va:35, ps:8, ge:18, rq:15, rl:18, cc:12, sanctions:8, conflict:35, trade:12, trend:[18,17,16,16,15] },
  { name:'Russia', region:'Eastern Europe', va:8, ps:15, ge:42, rq:28, rl:22, cc:18, sanctions:45, conflict:40, trade:45, trend:[28,22,18,15,12] },
  { name:'Turkey', region:'Middle East', va:22, ps:18, ge:45, rq:42, rl:35, cc:32, sanctions:12, conflict:22, trade:18, trend:[38,36,34,33,32] },
  { name:'Poland', region:'Eastern Europe', va:68, ps:65, ge:62, rq:72, rl:58, cc:58, sanctions:3, conflict:5, trade:8, trend:[62,63,64,64,63] },
  { name:'Indonesia', region:'Southeast Asia', va:48, ps:28, ge:52, rq:48, rl:42, cc:38, sanctions:3, conflict:12, trade:10, trend:[42,43,44,44,45] },
  { name:'Thailand', region:'Southeast Asia', va:22, ps:18, ge:58, rq:55, rl:48, cc:35, sanctions:4, conflict:15, trade:10, trend:[40,39,38,38,39] },
  { name:'Vietnam', region:'Southeast Asia', va:8, ps:52, ge:52, rq:42, rl:45, cc:35, sanctions:5, conflict:8, trade:15, trend:[40,41,42,43,44] },
  { name:'Egypt', region:'North Africa', va:12, ps:15, ge:28, rq:22, rl:30, cc:25, sanctions:6, conflict:18, trade:12, trend:[24,23,22,22,23] },
  { name:'Pakistan', region:'South Asia', va:28, ps:5, ge:22, rq:25, rl:22, cc:18, sanctions:8, conflict:38, trade:15, trend:[18,17,16,15,15] },
  { name:'Kenya', region:'Sub-Saharan Africa', va:42, ps:15, ge:35, rq:38, rl:32, cc:18, sanctions:3, conflict:18, trade:8, trend:[28,29,30,30,30] },
  { name:'Colombia', region:'Latin America', va:48, ps:10, ge:38, rq:55, rl:35, cc:32, sanctions:5, conflict:25, trade:8, trend:[35,34,35,36,37] },
  { name:'Chile', region:'Latin America', va:78, ps:45, ge:72, rq:82, rl:78, cc:72, sanctions:2, conflict:5, trade:8, trend:[72,71,72,73,74] },
  { name:'Israel', region:'Middle East', va:62, ps:8, ge:78, rq:80, rl:72, cc:70, sanctions:8, conflict:42, trade:15, trend:[60,55,50,48,45] },
  { name:'Taiwan', region:'East Asia', va:75, ps:30, ge:82, rq:85, rl:82, cc:78, sanctions:10, conflict:25, trade:30, trend:[72,70,68,66,65] },
  { name:'Ukraine', region:'Eastern Europe', va:42, ps:2, ge:32, rq:38, rl:28, cc:22, sanctions:5, conflict:48, trade:20, trend:[35,28,18,12,10] },
  { name:'Iran', region:'Middle East', va:5, ps:12, ge:28, rq:8, rl:18, cc:18, sanctions:48, conflict:30, trade:42, trend:[14,13,12,11,10] },
  { name:'Venezuela', region:'Latin America', va:8, ps:8, ge:5, rq:2, rl:2, cc:2, sanctions:35, conflict:28, trade:25, trend:[6,5,5,4,4] },
  { name:'Myanmar', region:'Southeast Asia', va:5, ps:2, ge:12, rq:8, rl:8, cc:5, sanctions:30, conflict:42, trade:18, trend:[15,10,8,6,5] },
  { name:'Argentina', region:'Latin America', va:62, ps:38, ge:35, rq:22, rl:38, cc:28, sanctions:3, conflict:5, trade:12, trend:[35,34,33,34,36] },
  { name:'Bangladesh', region:'South Asia', va:22, ps:15, ge:28, rq:22, rl:25, cc:12, sanctions:4, conflict:12, trade:10, trend:[22,22,23,23,22] },
  { name:'Philippines', region:'Southeast Asia', va:42, ps:18, ge:48, rq:45, rl:35, cc:28, sanctions:3, conflict:18, trade:8, trend:[35,36,36,37,38] },
  { name:'Morocco', region:'North Africa', va:28, ps:38, ge:42, rq:38, rl:42, cc:42, sanctions:2, conflict:5, trade:6, trend:[38,39,40,41,42] },
  { name:'Kazakhstan', region:'Central Asia', va:12, ps:42, ge:45, rq:38, rl:32, cc:22, sanctions:8, conflict:8, trade:12, trend:[32,33,34,35,35] },
  { name:'Ethiopia', region:'Sub-Saharan Africa', va:12, ps:5, ge:25, rq:18, rl:22, cc:28, sanctions:8, conflict:35, trade:10, trend:[22,20,18,16,15] },
  { name:'DR Congo', region:'Sub-Saharan Africa', va:8, ps:2, ge:5, rq:5, rl:5, cc:5, sanctions:12, conflict:45, trade:8, trend:[6,5,5,5,5] },
  { name:'Norway', region:'Western Europe', va:95, ps:88, ge:92, rq:88, rl:95, cc:95, sanctions:2, conflict:2, trade:5, trend:[92,93,93,94,94] },
  { name:'Switzerland', region:'Western Europe', va:92, ps:90, ge:95, rq:92, rl:95, cc:92, sanctions:3, conflict:1, trade:5, trend:[92,93,93,93,94] },
  { name:'New Zealand', region:'Oceania', va:92, ps:92, ge:90, rq:95, rl:92, cc:95, sanctions:1, conflict:1, trade:4, trend:[92,93,93,94,94] },
  { name:'Finland', region:'Western Europe', va:95, ps:78, ge:92, rq:92, rl:95, cc:95, sanctions:2, conflict:4, trade:6, trend:[92,92,91,91,92] },
  { name:'Denmark', region:'Western Europe', va:95, ps:72, ge:92, rq:92, rl:95, cc:95, sanctions:2, conflict:3, trade:5, trend:[92,93,93,93,93] },
  { name:'Uzbekistan', region:'Central Asia', va:5, ps:35, ge:32, rq:22, rl:18, cc:12, sanctions:5, conflict:8, trade:8, trend:[18,20,22,24,25] },
  { name:'Algeria', region:'North Africa', va:15, ps:22, ge:25, rq:12, rl:22, cc:22, sanctions:5, conflict:12, trade:10, trend:[22,22,21,21,22] },
  { name:'Ghana', region:'Sub-Saharan Africa', va:58, ps:42, ge:42, rq:42, rl:48, cc:42, sanctions:2, conflict:5, trade:5, trend:[45,45,46,46,45] },
  { name:'Peru', region:'Latin America', va:52, ps:15, ge:32, rq:55, rl:28, cc:28, sanctions:2, conflict:15, trade:8, trend:[35,34,33,32,33] },
];

const WEIGHTS_DEFAULT = { va: 12, ps: 20, ge: 12, rq: 12, rl: 12, cc: 12, sanctions: 8, conflict: 8, trade: 4 };

function computeScore(c, w) {
  const totalW = Object.values(w).reduce((s, v) => s + v, 0);
  const govScore = (c.va * w.va + c.ps * w.ps + c.ge * w.ge + c.rq * w.rq + c.rl * w.rl + c.cc * w.cc) / (w.va + w.ps + w.ge + w.rq + w.rl + w.cc);
  const riskPenalty = (c.sanctions * w.sanctions + c.conflict * w.conflict + c.trade * w.trade) / (w.sanctions + w.conflict + w.trade);
  return Math.round(govScore * 0.7 + (100 - riskPenalty) * 0.3);
}

const TABS = ['Global Risk Map','Country Rankings','6-Dimension Analysis','Trend & Forecast','Custom Weights','Regional Deep-Dive'];

export default function GeopoliticalRiskIndexPage() {
  const [tab, setTab] = useState(0);
  const [weights, setWeights] = useState(WEIGHTS_DEFAULT);
  const [selectedCountry, setSelectedCountry] = useState('USA');
  const [regionFilter, setRegionFilter] = useState('All');

  const scored = useMemo(() =>
    COUNTRIES.map(c => ({ ...c, composite: computeScore(c, weights) })).sort((a, b) => b.composite - a.composite),
    [weights]
  );

  const filtered = useMemo(() =>
    regionFilter === 'All' ? scored : scored.filter(c => c.region === regionFilter),
    [scored, regionFilter]
  );

  const sel = scored.find(c => c.name === selectedCountry) || scored[0];

  const card = (label, value, sub, color = T.navy) => (
    <div style={{ background: T.surface, borderRadius: 10, padding: '14px 18px', border: `1px solid ${T.border}`, flex: '1 1 150px' }}>
      <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color, marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{sub}</div>}
    </div>
  );

  const riskColor = s => s >= 70 ? T.green : s >= 50 ? T.amber : s >= 30 ? T.orange : T.red;

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <span style={{ background: '#7c2d12', color: '#fff', fontFamily: T.mono, fontSize: 11, padding: '3px 10px', borderRadius: 6 }}>EP-CV1</span>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: T.navy, margin: 0 }}>Geopolitical Risk Index</h1>
      </div>
      <p style={{ color: T.textSec, fontSize: 13, marginBottom: 16 }}>
        Composite country-level risk index across 6 WGI dimensions + sanctions, conflict, and trade policy exposure.
        <span style={{ fontFamily: T.mono, marginLeft: 8, fontSize: 11, color: T.textMut }}>Source: World Bank WGI 2024 | OFAC | ACLED | WTO</span>
      </p>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        {card('Countries Covered', scored.length, '50 across 12 regions')}
        {card('Highest Risk', scored[scored.length - 1].name, `Score: ${scored[scored.length - 1].composite}`, T.red)}
        {card('Lowest Risk', scored[0].name, `Score: ${scored[0].composite}`, T.green)}
        {card('Avg Score', Math.round(scored.reduce((s, c) => s + c.composite, 0) / scored.length), 'Global average')}
      </div>

      <div style={{ display: 'flex', gap: 0, borderBottom: `2px solid ${T.border}`, marginBottom: 18 }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{
            padding: '10px 16px', border: 'none', cursor: 'pointer', fontFamily: T.font, fontSize: 13, fontWeight: tab === i ? 700 : 500,
            color: tab === i ? T.navy : T.textSec, background: tab === i ? T.surface : 'transparent',
            borderBottom: tab === i ? `2px solid ${T.gold}` : '2px solid transparent', marginBottom: -2, borderRadius: '6px 6px 0 0'
          }}>{t}</button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 13 }}>
          <option>All</option>
          {REGIONS.map(r => <option key={r}>{r}</option>)}
        </select>
        <select value={selectedCountry} onChange={e => setSelectedCountry(e.target.value)} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 13 }}>
          {scored.map(c => <option key={c.name}>{c.name}</option>)}
        </select>
      </div>

      {tab === 0 && (
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ color: T.navy, fontSize: 15, marginBottom: 12 }}>Risk Score by Country (Scatter by Governance vs Risk Penalty)</h3>
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="composite" name="Composite Score" domain={[0, 100]} tick={{ fontSize: 11 }} label={{ value: 'Composite Score', position: 'bottom', fontSize: 11 }} />
              <YAxis dataKey={d => (d.sanctions + d.conflict + d.trade) / 3} name="Risk Exposure" domain={[0, 50]} tick={{ fontSize: 11 }} label={{ value: 'Risk Exposure', angle: -90, position: 'left', fontSize: 11 }} />
              <ZAxis range={[50, 50]} />
              <Tooltip content={({ payload }) => {
                if (!payload?.length) return null;
                const d = payload[0].payload;
                return (<div style={{ background: '#fff', border: `1px solid ${T.border}`, padding: 10, borderRadius: 8, fontSize: 12 }}>
                  <div style={{ fontWeight: 700 }}>{d.name} ({d.region})</div>
                  <div>Composite: {d.composite} | Sanctions: {d.sanctions} | Conflict: {d.conflict}</div>
                </div>);
              }} />
              <Scatter data={filtered}>
                {filtered.map(c => <Cell key={c.name} fill={riskColor(c.composite)} />)}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 1 && (
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ color: T.navy, fontSize: 15, marginBottom: 12 }}>Country Rankings (Top & Bottom 15)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <h4 style={{ color: T.green, fontSize: 12, marginBottom: 8 }}>LOWEST RISK (TOP 15)</h4>
              {scored.slice(0, 15).map((c, i) => (
                <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
                  <span><span style={{ fontFamily: T.mono, color: T.textMut, width: 24, display: 'inline-block' }}>{i + 1}.</span> {c.name}</span>
                  <span style={{ fontFamily: T.mono, fontWeight: 700, color: riskColor(c.composite) }}>{c.composite}</span>
                </div>
              ))}
            </div>
            <div>
              <h4 style={{ color: T.red, fontSize: 12, marginBottom: 8 }}>HIGHEST RISK (BOTTOM 15)</h4>
              {scored.slice(-15).reverse().map((c, i) => (
                <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
                  <span><span style={{ fontFamily: T.mono, color: T.textMut, width: 24, display: 'inline-block' }}>{scored.length - i}.</span> {c.name}</span>
                  <span style={{ fontFamily: T.mono, fontWeight: 700, color: riskColor(c.composite) }}>{c.composite}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 2 && (
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ color: T.navy, fontSize: 15, marginBottom: 12 }}>6-Dimension Analysis: {sel.name}</h3>
          <ResponsiveContainer width="100%" height={350}>
            <RadarChart data={DIMS.map((d, i) => ({ dim: d, value: [sel.va, sel.ps, sel.ge, sel.rq, sel.rl, sel.cc][i] }))} outerRadius={120}>
              <PolarGrid stroke={T.border} />
              <PolarAngleAxis dataKey="dim" tick={{ fontSize: 9 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
              <Radar dataKey="value" stroke={T.navy} fill={T.navy} fillOpacity={0.2} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 10 }}>
            {[['Voice & Accountability', sel.va],['Political Stability', sel.ps],['Govt Effectiveness', sel.ge],['Regulatory Quality', sel.rq],['Rule of Law', sel.rl],['Control of Corruption', sel.cc]].map(([label, val]) => (
              <div key={label} style={{ padding: 8, background: T.bg, borderRadius: 6, fontSize: 12 }}>
                <span style={{ color: T.textMut }}>{label}:</span> <strong style={{ color: riskColor(val) }}>{val}</strong>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 3 && (
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ color: T.navy, fontSize: 15, marginBottom: 12 }}>5-Year Trend: {sel.name}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={sel.trend.map((v, i) => ({ year: 2021 + i, score: v }))}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => [`${v}/100`]} />
              <Line type="monotone" dataKey="score" stroke={T.navy} strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 12, padding: 12, background: T.bg, borderRadius: 8, fontSize: 12, color: T.textSec }}>
            <strong>Trend:</strong> {sel.name} score moved from {sel.trend[0]} to {sel.trend[4]} over 5 years ({sel.trend[4] > sel.trend[0] ? 'improving' : sel.trend[4] < sel.trend[0] ? 'deteriorating' : 'stable'}).
          </div>
        </div>
      )}

      {tab === 4 && (
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ color: T.navy, fontSize: 15, marginBottom: 12 }}>Custom Weight Configuration</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
            {Object.entries(weights).map(([key, val]) => (
              <div key={key} style={{ padding: 10, background: T.bg, borderRadius: 8 }}>
                <label style={{ fontSize: 11, fontFamily: T.mono, color: T.textMut, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>{key.replace('_', ' ')}</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="range" min={0} max={30} value={val} onChange={e => setWeights({ ...weights, [key]: +e.target.value })} style={{ flex: 1 }} />
                  <span style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 700, width: 24, textAlign: 'right' }}>{val}</span>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => setWeights(WEIGHTS_DEFAULT)} style={{ padding: '6px 16px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.surface, cursor: 'pointer', fontSize: 12 }}>Reset to Defaults</button>
          <div style={{ marginTop: 14, fontSize: 12, color: T.textSec }}>
            <strong>Top 5 with current weights:</strong> {scored.slice(0, 5).map(c => `${c.name} (${c.composite})`).join(' | ')}
          </div>
        </div>
      )}

      {tab === 5 && (
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ color: T.navy, fontSize: 15, marginBottom: 12 }}>Regional Deep-Dive</h3>
          {(() => {
            const regionData = REGIONS.map(r => {
              const rc = scored.filter(c => c.region === r);
              if (!rc.length) return null;
              return { region: r, avg: Math.round(rc.reduce((s, c) => s + c.composite, 0) / rc.length), count: rc.length, best: rc[0].name, worst: rc[rc.length - 1].name };
            }).filter(Boolean).sort((a, b) => b.avg - a.avg);
            return (
              <>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={regionData} layout="vertical" margin={{ left: 130 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="region" tick={{ fontSize: 11 }} width={125} />
                    <Tooltip formatter={v => [`${v}/100`]} />
                    <Bar dataKey="avg" radius={[0, 4, 4, 0]}>
                      {regionData.map(r => <Cell key={r.region} fill={riskColor(r.avg)} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginTop: 14 }}>
                  <thead><tr style={{ background: T.bg }}>
                    {['Region','Avg Score','Countries','Best','Most At-Risk'].map(h => (
                      <th key={h} style={{ padding: '6px 10px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, fontFamily: T.mono, fontSize: 10 }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {regionData.map(r => (
                      <tr key={r.region} style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '4px 10px', fontWeight: 600 }}>{r.region}</td>
                        <td style={{ padding: '4px 10px', fontFamily: T.mono, color: riskColor(r.avg), fontWeight: 700 }}>{r.avg}</td>
                        <td style={{ padding: '4px 10px' }}>{r.count}</td>
                        <td style={{ padding: '4px 10px', color: T.green }}>{r.best}</td>
                        <td style={{ padding: '4px 10px', color: T.red }}>{r.worst}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            );
          })()}
        </div>
      )}

      <div style={{ marginTop: 20, padding: 14, background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 11, color: T.textMut }}>
        <strong>Data Sources:</strong> World Bank WGI 2024 | OFAC SDN List | ACLED Conflict Data | WTO Trade Policy Review.
        <span style={{ float: 'right', fontFamily: T.mono }}>EP-CV1 v1.0 | Geopolitical Risk Index</span>
      </div>
    </div>
  );
}
