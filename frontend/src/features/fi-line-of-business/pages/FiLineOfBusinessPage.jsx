/**
 * EP-CT3 — FI Line of Business Risk Attribution
 * Sprint CT · Financial Institution Profiler
 *
 * LoB risk attribution with overview, risk attribution, revenue vs risk,
 * marginal contribution, benchmarking, and action items.
 */
import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine
} from 'recharts';

const T = { bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb', orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a', card:'#ffffff',sub:'#5c6b7e',indigo:'#4f46e5',font:"'DM Sans','SF Pro Display',system-ui,sans-serif", mono:"'JetBrains Mono','SF Mono','Fira Code',monospace" };

const TABS = ['LoB Overview', 'Risk Attribution', 'Revenue vs Risk', 'Marginal Contribution', 'LoB Benchmarking', 'Action Items'];
const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const LOB_COLORS = [T.navy, T.blue, T.teal, T.green, T.amber, T.orange];

const LOBS = [
  { name: 'Corporate Banking', exposure: 12400, revenue: 680, score: 52, clients: 180, rwa: 9200 },
  { name: 'Investment Banking', exposure: 8200, revenue: 520, score: 61, clients: 45, rwa: 6100 },
  { name: 'Wealth Management', exposure: 5800, revenue: 340, score: 72, clients: 2200, rwa: 2900 },
  { name: 'Insurance', exposure: 4200, revenue: 280, score: 48, clients: 120, rwa: 3800 },
  { name: 'Transaction Banking', exposure: 3600, revenue: 220, score: 68, clients: 850, rwa: 1800 },
  { name: 'Markets', exposure: 6800, revenue: 450, score: 58, clients: 65, rwa: 5200 },
];

const TOTAL_EXPOSURE = LOBS.reduce((s, l) => s + l.exposure, 0);
const TOTAL_REVENUE = LOBS.reduce((s, l) => s + l.revenue, 0);

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

export default function FiLineOfBusinessPage() {
  const [tab, setTab] = useState(TABS[0]);
  const [marginalAmount, setMarginalAmount] = useState(100);

  const lobsEnriched = useMemo(() => LOBS.map((l, i) => {
    const riskContrib = (l.exposure * (100 - l.score)) / LOBS.reduce((s, l2) => s + l2.exposure * (100 - l2.score), 0) * 100;
    const revShare = (l.revenue / TOTAL_REVENUE) * 100;
    const efficiency = revShare / riskContrib;
    return { ...l, riskContrib: Math.round(riskContrib * 10) / 10, revShare: Math.round(revShare * 10) / 10, efficiency: Math.round(efficiency * 100) / 100, color: LOB_COLORS[i] };
  }), []);

  const radarData = useMemo(() => ['Exposure', 'Revenue', 'Score', 'Clients', 'RWA', 'Efficiency'].map(dim => {
    const row = { dimension: dim };
    lobsEnriched.forEach(l => {
      const maxVals = { Exposure: 15000, Revenue: 700, Score: 100, Clients: 2500, RWA: 10000, Efficiency: 2 };
      const val = dim === 'Efficiency' ? l.efficiency : l[dim.toLowerCase()];
      row[l.name] = Math.round((val / maxVals[dim]) * 100);
    });
    return row;
  }), [lobsEnriched]);

  const marginalData = useMemo(() => lobsEnriched.map(l => {
    const newExposure = l.exposure + marginalAmount;
    const oldPortScore = LOBS.reduce((s, lb) => s + lb.exposure * lb.score, 0) / TOTAL_EXPOSURE;
    const newPortScore = (LOBS.reduce((s, lb) => s + lb.exposure * lb.score, 0) + marginalAmount * l.score) / (TOTAL_EXPOSURE + marginalAmount);
    return { lob: l.name, currentScore: l.score, marginalImpact: Math.round((newPortScore - oldPortScore) * 100) / 100, newExposure, color: l.color };
  }), [lobsEnriched, marginalAmount]);

  const benchmarkData = useMemo(() => lobsEnriched.map(l => ({
    lob: l.name, ours: l.score, peer25: Math.round(l.score - 10 + sr(l.name.charCodeAt(0)) * 5), peer50: Math.round(l.score - 2 + sr(l.name.charCodeAt(1)) * 8), peer75: Math.round(l.score + 8 + sr(l.name.charCodeAt(2)) * 6),
  })), [lobsEnriched]);

  const actions = useMemo(() => lobsEnriched.filter(l => l.score < 60 || l.efficiency < 1).map(l => ({
    lob: l.name, score: l.score, efficiency: l.efficiency,
    action: l.score < 50 ? 'Immediate engagement plan required' : l.efficiency < 0.8 ? 'Review revenue-risk alignment' : 'Enhanced monitoring',
    priority: l.score < 50 ? 'HIGH' : l.efficiency < 0.8 ? 'MEDIUM' : 'LOW',
    deadline: l.score < 50 ? 'Q2 2026' : 'Q3 2026',
  })), [lobsEnriched]);

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: T.mono, fontSize: 11, color: T.textMut, marginBottom: 4 }}>EP-CT3 · SPRINT CT</div>
          <h1 style={{ fontSize: 26, color: T.navy, margin: 0 }}>FI Line of Business Risk Attribution</h1>
          <p style={{ color: T.textSec, fontSize: 14, margin: '6px 0 0' }}>
            {LOBS.length} lines of business · ${(TOTAL_EXPOSURE / 1000).toFixed(1)}B exposure · ${(TOTAL_REVENUE).toLocaleString()}M revenue
          </p>
        </div>

        <TabBar tabs={TABS} active={tab} onSelect={setTab} />

        {/* Tab 1: Overview */}
        {tab === TABS[0] && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
              {lobsEnriched.map((l, i) => (
                <Card key={i} style={{ padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{l.name}</span>
                    <span style={{ fontFamily: T.mono, fontWeight: 700, fontSize: 18, color: l.score >= 60 ? T.green : l.score >= 45 ? T.amber : T.red }}>{l.score}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
                    <div><span style={{ color: T.textMut }}>Exposure:</span> <span style={{ fontFamily: T.mono }}>${l.exposure.toLocaleString()}M</span></div>
                    <div><span style={{ color: T.textMut }}>Revenue:</span> <span style={{ fontFamily: T.mono }}>${l.revenue}M</span></div>
                    <div><span style={{ color: T.textMut }}>Clients:</span> <span style={{ fontFamily: T.mono }}>{l.clients}</span></div>
                    <div><span style={{ color: T.textMut }}>Efficiency:</span> <span style={{ fontFamily: T.mono, color: l.efficiency >= 1 ? T.green : T.red }}>{l.efficiency}x</span></div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Tab 2: Risk Attribution */}
        {tab === TABS[1] && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Card title="Risk Contribution by LoB">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={lobsEnriched.map((l, i) => ({ name: l.name, value: l.riskContrib, fill: l.color }))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110}
                    label={({ name, value }) => `${name.split(' ')[0]}: ${value}%`}>
                    {lobsEnriched.map((l, i) => <Cell key={i} fill={l.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Risk = Exposure x (100 - Score) / Total">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.font }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                    <th style={{ textAlign: 'left', padding: 6 }}>LoB</th>
                    <th style={{ textAlign: 'right', padding: 6 }}>Exposure</th>
                    <th style={{ textAlign: 'right', padding: 6 }}>Score</th>
                    <th style={{ textAlign: 'right', padding: 6 }}>Risk Contrib %</th>
                  </tr>
                </thead>
                <tbody>
                  {lobsEnriched.map((l, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: 6, fontWeight: 600 }}>{l.name}</td>
                      <td style={{ padding: 6, textAlign: 'right', fontFamily: T.mono }}>${l.exposure.toLocaleString()}M</td>
                      <td style={{ padding: 6, textAlign: 'right', fontFamily: T.mono }}>{l.score}</td>
                      <td style={{ padding: 6, textAlign: 'right', fontFamily: T.mono, fontWeight: 700, color: l.riskContrib > 20 ? T.red : T.navy }}>{l.riskContrib}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}

        {/* Tab 3: Revenue vs Risk */}
        {tab === TABS[2] && (
          <Card title="Revenue Share vs Risk Contribution (Efficiency = Revenue/Risk)">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={lobsEnriched}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontFamily: T.font, fontSize: 10 }} angle={-15} textAnchor="end" height={50} />
                <YAxis domain={[0, 40]} tick={{ fontFamily: T.mono, fontSize: 11 }} />
                <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontFamily: T.font, fontSize: 11 }} />
                <Bar dataKey="revShare" fill={T.green} name="Revenue Share %" radius={[4, 4, 0, 0]} />
                <Bar dataKey="riskContrib" fill={T.red} name="Risk Contribution %" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ marginTop: 12, padding: 12, background: '#f0f4f8', borderRadius: 6, fontSize: 12, color: T.navy }}>
              <strong>Interpretation:</strong> Efficiency &gt; 1.0x means revenue share exceeds risk contribution (favorable). LoBs with efficiency &lt; 1.0x are risk-heavy relative to revenue.
            </div>
          </Card>
        )}

        {/* Tab 4: Marginal Contribution */}
        {tab === TABS[3] && (
          <Card title={`Marginal Risk Impact — Adding $${marginalAmount}M to each LoB`}>
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <label style={{ fontSize: 12, color: T.textSec }}>Amount ($M):</label>
              <input type="range" min={50} max={500} step={50} value={marginalAmount} onChange={e => setMarginalAmount(+e.target.value)}
                style={{ width: 200, accentColor: T.gold }} />
              <span style={{ fontFamily: T.mono, fontWeight: 700, color: T.navy }}>${marginalAmount}M</span>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={marginalData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="lob" tick={{ fontFamily: T.font, fontSize: 10 }} angle={-15} textAnchor="end" height={50} />
                <YAxis tick={{ fontFamily: T.mono, fontSize: 11 }} />
                <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} />
                <ReferenceLine y={0} stroke={T.navy} strokeWidth={2} />
                <Bar dataKey="marginalImpact" name="Score Impact (bps)" radius={[4, 4, 0, 0]}>
                  {marginalData.map((d, i) => <Cell key={i} fill={d.marginalImpact >= 0 ? T.green : T.red} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Tab 5: Benchmarking */}
        {tab === TABS[4] && (
          <Card title="LoB Score vs Peer Benchmarks (25th / 50th / 75th percentile)">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={benchmarkData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="lob" tick={{ fontFamily: T.font, fontSize: 10 }} angle={-15} textAnchor="end" height={50} />
                <YAxis domain={[0, 100]} tick={{ fontFamily: T.mono, fontSize: 11 }} />
                <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontFamily: T.font, fontSize: 11 }} />
                <Bar dataKey="peer25" fill="#e5e7eb" name="Peer 25th" radius={[2, 2, 0, 0]} />
                <Bar dataKey="peer50" fill="#9ca3af" name="Peer 50th" radius={[2, 2, 0, 0]} />
                <Bar dataKey="ours" fill={T.navy} name="Our Score" radius={[4, 4, 0, 0]} />
                <Bar dataKey="peer75" fill={T.gold} name="Peer 75th" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Tab 6: Action Items */}
        {tab === TABS[5] && (
          <Card title="LoB Action Items" style={{ borderColor: actions.some(a => a.priority === 'HIGH') ? T.red : T.border }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.font }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  <th style={{ textAlign: 'left', padding: 6 }}>LoB</th>
                  <th style={{ textAlign: 'right', padding: 6 }}>Score</th>
                  <th style={{ textAlign: 'right', padding: 6 }}>Efficiency</th>
                  <th style={{ textAlign: 'center', padding: 6 }}>Priority</th>
                  <th style={{ textAlign: 'left', padding: 6 }}>Action</th>
                  <th style={{ textAlign: 'center', padding: 6 }}>Deadline</th>
                </tr>
              </thead>
              <tbody>
                {actions.map((a, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: a.priority === 'HIGH' ? '#fee2e2' : 'transparent' }}>
                    <td style={{ padding: 6, fontWeight: 600 }}>{a.lob}</td>
                    <td style={{ padding: 6, textAlign: 'right', fontFamily: T.mono }}>{a.score}</td>
                    <td style={{ padding: 6, textAlign: 'right', fontFamily: T.mono }}>{a.efficiency}x</td>
                    <td style={{ textAlign: 'center', padding: 6 }}>
                      <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, color: '#fff', background: a.priority === 'HIGH' ? T.red : a.priority === 'MEDIUM' ? T.amber : T.green }}>{a.priority}</span>
                    </td>
                    <td style={{ padding: 6, color: T.textSec }}>{a.action}</td>
                    <td style={{ textAlign: 'center', padding: 6, fontFamily: T.mono }}>{a.deadline}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        <div style={{ marginTop: 24, padding: '12px 16px', background: T.surface, borderRadius: 8, border: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: T.mono, color: T.textMut }}>
          <span>EP-CT3 · FI Line of Business Risk Attribution</span>
          <span>Sprint CT · {new Date().toISOString().split('T')[0]}</span>
        </div>
      </div>
    </div>
  );
}
