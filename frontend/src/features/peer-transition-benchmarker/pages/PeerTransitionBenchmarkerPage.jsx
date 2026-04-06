import React, { useState, useMemo } from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell, ScatterChart, Scatter, ZAxis
} from 'recharts';

const T = {
  bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c',
  navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae',
  red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb',
  orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a',
  font:"'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"
};

const PILLARS = ['Carbon','Technology','Policy','Market','Capital','Social'];
const PILLAR_WEIGHTS = [22, 18, 20, 18, 12, 10];

const PEER_GROUPS = {
  Energy: [
    { name:'Shell', scores:[45,40,35,50,42,38] },
    { name:'BP', scores:[40,35,30,45,38,35] },
    { name:'TotalEnergies', scores:[48,50,40,52,45,40] },
    { name:'Enel', scores:[75,80,70,72,68,65] },
    { name:'Orsted', scores:[92,90,88,85,82,78] },
  ],
  Materials: [
    { name:'BASF', scores:[55,50,45,48,42,40] },
    { name:'Linde', scores:[65,62,58,55,50,48] },
    { name:'HeidelbergCement', scores:[30,28,25,32,22,20] },
    { name:'ArcelorMittal', scores:[25,22,20,28,18,15] },
    { name:'Air Liquide', scores:[70,68,62,60,55,52] },
  ],
  Technology: [
    { name:'Microsoft', scores:[88,92,85,82,78,75] },
    { name:'Apple', scores:[82,85,78,80,72,70] },
    { name:'Alphabet', scores:[85,88,80,78,75,72] },
    { name:'Amazon', scores:[60,65,55,58,52,48] },
    { name:'Samsung', scores:[55,58,48,52,45,42] },
  ],
  Automotive: [
    { name:'BMW', scores:[72,75,68,70,65,62] },
    { name:'Volkswagen', scores:[65,68,60,62,58,55] },
    { name:'Mercedes', scores:[68,70,62,65,60,58] },
    { name:'Toyota', scores:[45,48,42,50,40,38] },
    { name:'GM', scores:[50,55,45,48,42,40] },
  ],
  Finance: [
    { name:'BNP Paribas', scores:[72,55,68,65,60,58] },
    { name:'HSBC', scores:[58,45,52,55,48,45] },
    { name:'JPMorgan', scores:[52,48,45,58,42,40] },
    { name:'ING', scores:[78,60,72,68,65,62] },
    { name:'Nordea', scores:[68,52,62,60,55,52] },
  ],
  Utilities: [
    { name:'Iberdrola', scores:[88,85,82,80,78,75] },
    { name:'NextEra', scores:[82,80,75,78,72,70] },
    { name:'EDF', scores:[65,60,58,62,55,52] },
    { name:'RWE', scores:[55,52,48,50,45,42] },
    { name:'Duke Energy', scores:[42,40,38,45,35,32] },
  ],
};

Object.values(PEER_GROUPS).flat().forEach(c => {
  c.total = c.scores.reduce((a, s, i) => a + s * PILLAR_WEIGHTS[i] / 100, 0);
});

function quartile(score, peers) {
  const sorted = peers.map(p => p.total).sort((a, b) => b - a);
  const rank = sorted.indexOf(score) + 1;
  return rank <= Math.ceil(sorted.length * 0.25) ? 'Q1' : rank <= Math.ceil(sorted.length * 0.5) ? 'Q2' : rank <= Math.ceil(sorted.length * 0.75) ? 'Q3' : 'Q4';
}

const TABS = ['Sector Peer Groups','Transition Score Comparison','Best-in-Class Identification','Laggard Screening','Convergence Analysis','Engagement Priority Matrix'];
const card = { background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20, marginBottom: 16 };
const lbl = { fontSize: 10, color: T.textMut, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 };

export default function PeerTransitionBenchmarkerPage() {
  const [tab, setTab] = useState(0);
  const [sector, setSector] = useState('Energy');
  const [selPeer, setSelPeer] = useState(0);
  const [watchlist, setWatchlist] = useState([]);

  const peers = PEER_GROUPS[sector];
  const sorted = useMemo(() => [...peers].sort((a, b) => b.total - a.total), [sector]);
  const bestInClass = Object.entries(PEER_GROUPS).map(([s, p]) => {
    const best = [...p].sort((a, b) => b.total - a.total)[0];
    return { sector: s, company: best.name, score: best.total.toFixed(1) };
  });
  const laggards = Object.entries(PEER_GROUPS).flatMap(([s, p]) => p.filter(c => quartile(c.total, p) === 'Q4').map(c => ({ ...c, sector: s })));

  const convergenceData = ['2020','2021','2022','2023','2024'].map(y => {
    const base = { year: y };
    peers.forEach((p, i) => {
      const drift = (2024 - parseInt(y)) * (i % 2 === 0 ? 2.5 : -1.5);
      base[p.name] = Math.max(10, Math.min(95, p.total + drift));
    });
    return base;
  });

  const colors = [T.navy, T.red, T.green, T.blue, T.purple];

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh' }}>
      <div style={{ background: T.navy, padding: '24px 32px 0', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ color: T.gold, fontFamily: T.mono, fontSize: 11, letterSpacing: 2, marginBottom: 4 }}>EP-CM6 · PEER TRANSITION BENCHMARKER</div>
            <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: 0 }}>Peer Transition Benchmarking Engine</h1>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>6 GICS Sectors · 5 Peers Each · 6 Transition Pillars · Convergence Analysis</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {[
              { label: 'Sector Best', val: sorted[0]?.name, col: T.green },
              { label: 'Spread', val: `${(sorted[0]?.total - sorted[sorted.length - 1]?.total).toFixed(0)}pts`, col: T.amber },
              { label: 'Peer Count', val: peers.length, col: T.gold },
            ].map(m => (
              <div key={m.label} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 16px', textAlign: 'right' }}>
                <div style={{ color: '#94a3b8', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{m.label}</div>
                <div style={{ color: m.col, fontSize: 18, fontWeight: 700, fontFamily: T.mono }}>{m.val}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {Object.keys(PEER_GROUPS).map(s => (
            <button key={s} onClick={() => { setSector(s); setSelPeer(0); }} style={{
              padding: '6px 12px', borderRadius: 20, border: `2px solid ${sector === s ? T.gold : 'transparent'}`,
              background: sector === s ? T.gold + '22' : 'rgba(255,255,255,0.06)',
              color: sector === s ? T.gold : '#94a3b8', cursor: 'pointer', fontSize: 11, fontWeight: 600
            }}>{s}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 0 }}>
          {TABS.map((t2, i) => (
            <button key={i} onClick={() => setTab(i)} style={{
              padding: '10px 18px', border: 'none', background: 'transparent', cursor: 'pointer',
              color: tab === i ? T.gold : '#94a3b8', fontWeight: tab === i ? 700 : 400, fontSize: 12,
              borderBottom: tab === i ? `2px solid ${T.gold}` : '2px solid transparent'
            }}>{t2}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '24px 32px 32px' }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <button onClick={() => alert('Export PDF')} style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${T.navy}`, background: 'transparent', color: T.navy, cursor: 'pointer', fontSize: 11 }}>Export PDF</button>
          <button onClick={() => alert('Export CSV')} style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${T.navy}`, background: 'transparent', color: T.navy, cursor: 'pointer', fontSize: 11 }}>Export CSV</button>
        </div>

        {tab === 0 && (<div>
          <div style={card}>
            <div style={lbl}>Peer Group — {sector} (Ranked by Weighted Score)</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={sorted}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip /><Bar dataKey="total" name="Weighted Score" radius={[4, 4, 0, 0]}>
                  {sorted.map((c, i) => <Cell key={i} fill={i === 0 ? T.green : i === sorted.length - 1 ? T.red : T.navy} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <div style={lbl}>Radar Overlay — All Peers ({sector})</div>
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={PILLARS.map((p, i) => { const row = { pillar: p }; peers.forEach(c => { row[c.name] = c.scores[i]; }); return row; })}>
                <PolarGrid stroke={T.border} /><PolarAngleAxis dataKey="pillar" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 8 }} />
                {peers.map((c, i) => <Radar key={c.name} name={c.name} dataKey={c.name} stroke={colors[i]} fill={colors[i]} fillOpacity={0.08} />)}
                <Tooltip /><Legend wrapperStyle={{ fontSize: 10 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>)}

        {tab === 1 && (<div>
          <div style={card}>
            <div style={lbl}>6-Pillar Score Comparison — {sector}</div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={PILLARS.map((p, i) => { const row = { pillar: p }; peers.forEach(c => { row[c.name] = c.scores[i]; }); return row; })}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="pillar" tick={{ fontSize: 10 }} /><YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip /><Legend wrapperStyle={{ fontSize: 10 }} />
                {peers.map((c, i) => <Bar key={c.name} dataKey={c.name} fill={colors[i]} />)}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>)}

        {tab === 2 && (<div>
          <div style={card}>
            <div style={lbl}>Best-in-Class per Sector</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={bestInClass}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="sector" tick={{ fontSize: 10 }} /><YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip /><Bar dataKey="score" name="Best Score" fill={T.green} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <div style={lbl}>Best-in-Class Table</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead><tr style={{ borderBottom: `2px solid ${T.border}` }}>{['Sector','Company','Score'].map(h => <th key={h} style={{ textAlign: 'left', padding: '8px 6px', color: T.textMut }}>{h}</th>)}</tr></thead>
              <tbody>{bestInClass.map(b => (
                <tr key={b.sector} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: 6 }}>{b.sector}</td><td style={{ padding: 6, fontWeight: 600 }}>{b.company}</td>
                  <td style={{ padding: 6, fontFamily: T.mono, color: T.green, fontWeight: 700 }}>{b.score}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>)}

        {tab === 3 && (<div>
          <div style={card}>
            <div style={lbl}>Laggard Screening — Bottom Quartile Across All Sectors</div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={laggards.sort((a, b) => a.total - b.total)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10 }} />
                <Tooltip /><Bar dataKey="total" name="Total Score" fill={T.red} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>)}

        {tab === 4 && (<div>
          <div style={card}>
            <div style={lbl}>Convergence Analysis — {sector} Peer Scores Over Time</div>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={convergenceData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} /><YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip /><Legend wrapperStyle={{ fontSize: 10 }} />
                {peers.map((p, i) => <Line key={p.name} type="monotone" dataKey={p.name} stroke={colors[i]} strokeWidth={2} dot={{ r: 3 }} />)}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ ...card, background: T.navy + '08', border: `1px solid ${T.gold}33` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.navy, marginBottom: 4 }}>Convergence Note</div>
            <div style={{ fontSize: 11, color: T.textSec, lineHeight: 1.6 }}>If peer scores are converging, the sector is improving together (beta transition). If diverging, leaders are pulling ahead (alpha differentiation opportunity). Watch for regime shifts when laggards make rapid improvements.</div>
          </div>
        </div>)}

        {tab === 5 && (<div>
          <div style={card}>
            <div style={lbl}>Engagement Priority Matrix — Score vs Engagement Feasibility</div>
            <ResponsiveContainer width="100%" height={320}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="x" name="Current Score" tick={{ fontSize: 10 }} label={{ value: 'Transition Score', position: 'bottom', fontSize: 10 }} />
                <YAxis dataKey="y" name="Engagement Potential" tick={{ fontSize: 10 }} label={{ value: 'Engagement Potential', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                <ZAxis dataKey="z" range={[60, 200]} /><Tooltip />
                <Scatter data={peers.map((p, pi) => ({ x: Math.round(p.total), y: Math.round(100 - p.total + Math.abs(Math.sin(pi*2.7+1))*20), z: 100, name: p.name }))} fill={T.navy} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <div style={lbl}>Engagement Priorities Table</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead><tr style={{ borderBottom: `2px solid ${T.border}` }}>{['Company','Score','Quartile','Priority'].map(h => <th key={h} style={{ textAlign: 'left', padding: '8px 6px', color: T.textMut }}>{h}</th>)}</tr></thead>
              <tbody>{sorted.map(c => {
                const q = quartile(c.total, peers);
                const pri = q === 'Q4' ? 'HIGH' : q === 'Q3' ? 'MEDIUM' : 'LOW';
                return (
                  <tr key={c.name} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: 6, fontWeight: 600 }}>{c.name}</td>
                    <td style={{ padding: 6, fontFamily: T.mono }}>{c.total.toFixed(1)}</td>
                    <td style={{ padding: 6 }}>{q}</td>
                    <td style={{ padding: 6 }}><span style={{ padding: '2px 10px', borderRadius: 10, fontSize: 10, fontWeight: 700, background: pri === 'HIGH' ? T.red + '22' : pri === 'MEDIUM' ? T.amber + '22' : T.green + '22', color: pri === 'HIGH' ? T.red : pri === 'MEDIUM' ? T.amber : T.green }}>{pri}</span></td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        </div>)}
      </div>
    </div>
  );
}
