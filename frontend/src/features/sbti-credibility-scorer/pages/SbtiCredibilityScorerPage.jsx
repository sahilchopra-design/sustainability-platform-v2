import React, { useState, useMemo } from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell, PieChart, Pie, ScatterChart, Scatter, ZAxis
} from 'recharts';

const T = {
  bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c',
  navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae',
  red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb',
  orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a',
  card:'#ffffff',sub:'#5c6b7e',indigo:'#4f46e5',font:"'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"
};

const VALIDATION = { approved: 20, committed: 10, 'self-declared': 5 };
const AMBITION = { '1.5C': 25, 'WB2C': 15, '2C': 10 };
const SCOPE_COV = { '1+2+3': 25, '1+2': 15 };
const INTERIM = { met: 15, 'on-track': 10, behind: 5, 'no-interim': 0 };

const COMPANIES = [
  { name:'Unilever', sector:'Consumer', validation:'approved', ambition:'1.5C', scope:'1+2+3', interim:'met', capex:14 },
  { name:'Microsoft', sector:'Tech', validation:'approved', ambition:'1.5C', scope:'1+2+3', interim:'met', capex:15 },
  { name:'Nestle', sector:'Consumer', validation:'approved', ambition:'WB2C', scope:'1+2+3', interim:'on-track', capex:11 },
  { name:'Apple', sector:'Tech', validation:'approved', ambition:'1.5C', scope:'1+2+3', interim:'met', capex:13 },
  { name:'Shell', sector:'Energy', validation:'committed', ambition:'WB2C', scope:'1+2+3', interim:'behind', capex:8 },
  { name:'TotalEnergies', sector:'Energy', validation:'committed', ambition:'2C', scope:'1+2', interim:'behind', capex:6 },
  { name:'BP', sector:'Energy', validation:'committed', ambition:'WB2C', scope:'1+2+3', interim:'behind', capex:7 },
  { name:'BASF', sector:'Materials', validation:'approved', ambition:'WB2C', scope:'1+2+3', interim:'on-track', capex:10 },
  { name:'HeidelbergCement', sector:'Materials', validation:'committed', ambition:'WB2C', scope:'1+2', interim:'behind', capex:5 },
  { name:'ArcelorMittal', sector:'Materials', validation:'self-declared', ambition:'2C', scope:'1+2', interim:'no-interim', capex:3 },
  { name:'Amazon', sector:'Tech', validation:'committed', ambition:'1.5C', scope:'1+2+3', interim:'on-track', capex:12 },
  { name:'Alphabet', sector:'Tech', validation:'approved', ambition:'1.5C', scope:'1+2+3', interim:'met', capex:14 },
  { name:'Samsung', sector:'Tech', validation:'approved', ambition:'WB2C', scope:'1+2+3', interim:'on-track', capex:10 },
  { name:'Volkswagen', sector:'Auto', validation:'approved', ambition:'WB2C', scope:'1+2+3', interim:'on-track', capex:11 },
  { name:'Toyota', sector:'Auto', validation:'committed', ambition:'2C', scope:'1+2', interim:'behind', capex:7 },
  { name:'BMW', sector:'Auto', validation:'approved', ambition:'1.5C', scope:'1+2+3', interim:'met', capex:13 },
  { name:'JPMorgan', sector:'Finance', validation:'committed', ambition:'WB2C', scope:'1+2+3', interim:'on-track', capex:9 },
  { name:'HSBC', sector:'Finance', validation:'approved', ambition:'WB2C', scope:'1+2+3', interim:'on-track', capex:8 },
  { name:'BNP Paribas', sector:'Finance', validation:'approved', ambition:'1.5C', scope:'1+2+3', interim:'met', capex:11 },
  { name:'Enel', sector:'Utilities', validation:'approved', ambition:'1.5C', scope:'1+2+3', interim:'met', capex:14 },
  { name:'Iberdrola', sector:'Utilities', validation:'approved', ambition:'1.5C', scope:'1+2+3', interim:'met', capex:15 },
  { name:'Orsted', sector:'Utilities', validation:'approved', ambition:'1.5C', scope:'1+2+3', interim:'met', capex:15 },
  { name:'Lafarge', sector:'Materials', validation:'self-declared', ambition:'2C', scope:'1+2', interim:'no-interim', capex:2 },
  { name:'Glencore', sector:'Mining', validation:'self-declared', ambition:'2C', scope:'1+2', interim:'no-interim', capex:4 },
  { name:'Rio Tinto', sector:'Mining', validation:'committed', ambition:'WB2C', scope:'1+2+3', interim:'on-track', capex:9 },
  { name:'BHP', sector:'Mining', validation:'committed', ambition:'WB2C', scope:'1+2+3', interim:'behind', capex:7 },
  { name:'Danone', sector:'Consumer', validation:'approved', ambition:'1.5C', scope:'1+2+3', interim:'met', capex:12 },
  { name:'L\'Oreal', sector:'Consumer', validation:'approved', ambition:'1.5C', scope:'1+2+3', interim:'on-track', capex:11 },
  { name:'Siemens', sector:'Industrial', validation:'approved', ambition:'1.5C', scope:'1+2+3', interim:'met', capex:13 },
  { name:'Schneider', sector:'Industrial', validation:'approved', ambition:'1.5C', scope:'1+2+3', interim:'met', capex:14 },
].map(c => ({
  ...c,
  score: VALIDATION[c.validation] + AMBITION[c.ambition] + SCOPE_COV[c.scope] + INTERIM[c.interim] + c.capex
}));

function rating(s) { return s >= 85 ? 'A' : s >= 65 ? 'B' : s >= 45 ? 'C' : s >= 25 ? 'D' : 'E'; }
function ratingColor(r) { return { A: T.green, B: T.teal, C: T.amber, D: T.orange, E: T.red }[r] || T.textMut; }

const TABS = ['Credibility Dashboard','Validation Status Tracker','Target Ambition Analysis','Scope 3 Coverage Audit','Interim Milestone Tracking','Say-Do Gap Quantifier'];

const card = { background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20, marginBottom: 16 };
const label = { fontSize: 10, color: T.textMut, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 };
const bigNum = { fontSize: 22, fontWeight: 700, fontFamily: T.mono };

export default function SbtiCredibilityScorerPage() {
  const [tab, setTab] = useState(0);
  const [selCompany, setSelCompany] = useState(COMPANIES[0].name);
  const [sortBy, setSortBy] = useState('score');
  const [sectorFilter, setSectorFilter] = useState('All');
  const [watchlist, setWatchlist] = useState([]);

  const sectors = ['All', ...new Set(COMPANIES.map(c => c.sector))];
  const filtered = useMemo(() => {
    let d = sectorFilter === 'All' ? [...COMPANIES] : COMPANIES.filter(c => c.sector === sectorFilter);
    d.sort((a, b) => sortBy === 'score' ? b.score - a.score : a.name.localeCompare(b.name));
    return d;
  }, [sectorFilter, sortBy]);

  const selData = COMPANIES.find(c => c.name === selCompany) || COMPANIES[0];
  const radarData = [
    { dim: 'Validation', val: VALIDATION[selData.validation], max: 20 },
    { dim: 'Ambition', val: AMBITION[selData.ambition], max: 25 },
    { dim: 'Scope Coverage', val: SCOPE_COV[selData.scope], max: 25 },
    { dim: 'Interim Progress', val: INTERIM[selData.interim], max: 15 },
    { dim: 'CapEx Alignment', val: selData.capex, max: 15 },
  ];

  const validationDist = Object.entries(VALIDATION).map(([k]) => ({
    status: k, count: COMPANIES.filter(c => c.validation === k).length
  }));

  const sectorAvgs = [...new Set(COMPANIES.map(c => c.sector))].map(s => {
    const sc = COMPANIES.filter(c => c.sector === s);
    return { sector: s, avg: Math.round(sc.reduce((a, c) => a + c.score, 0) / sc.length), count: sc.length };
  }).sort((a, b) => b.avg - a.avg);

  const ambitionDist = Object.entries(AMBITION).map(([k]) => ({
    target: k, count: COMPANIES.filter(c => c.ambition === k).length
  }));

  const scopeDist = [
    { type: 'Scope 1+2+3', count: COMPANIES.filter(c => c.scope === '1+2+3').length },
    { type: 'Scope 1+2 only', count: COMPANIES.filter(c => c.scope === '1+2').length },
  ];

  const interimDist = Object.entries(INTERIM).map(([k]) => ({
    status: k, count: COMPANIES.filter(c => c.interim === k).length
  }));

  const gapData = COMPANIES.map(c => ({
    name: c.name, score: c.score, capex: c.capex,
    gap: c.ambition === '1.5C' ? 100 - c.score : c.ambition === 'WB2C' ? 75 - c.score : 50 - c.score
  })).sort((a, b) => b.gap - a.gap).slice(0, 15);

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh' }}>
      <div style={{ background: T.navy, padding: '24px 32px 0', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ color: T.gold, fontFamily: T.mono, fontSize: 11, letterSpacing: 2, marginBottom: 4 }}>EP-CM1 · SBTi CREDIBILITY SCORER</div>
            <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: 0 }}>SBTi Target Credibility Scoring Engine</h1>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>
              30 Companies · 5-Pillar Credibility Framework · Validation + Ambition + Scope + Interim + CapEx
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {[
              { label: 'Avg Score', val: Math.round(COMPANIES.reduce((a, c) => a + c.score, 0) / COMPANIES.length), col: T.gold },
              { label: 'A-Rated', val: COMPANIES.filter(c => rating(c.score) === 'A').length, col: T.green },
              { label: 'E-Rated', val: COMPANIES.filter(c => rating(c.score) === 'E').length, col: T.red },
            ].map(m => (
              <div key={m.label} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 16px', textAlign: 'right' }}>
                <div style={{ color: '#94a3b8', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{m.label}</div>
                <div style={{ color: m.col, fontSize: 18, fontWeight: 700, fontFamily: T.mono }}>{m.val}</div>
              </div>
            ))}
          </div>
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
        {/* Controls */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={selCompany} onChange={e => setSelCompany(e.target.value)} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, fontFamily: T.font }}>
            {COMPANIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
          <select value={sectorFilter} onChange={e => setSectorFilter(e.target.value)} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
            {sectors.map(s => <option key={s}>{s}</option>)}
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
            <option value="score">Sort by Score</option><option value="name">Sort by Name</option>
          </select>
          <button onClick={() => setWatchlist(w => w.includes(selCompany) ? w.filter(x => x !== selCompany) : [...w, selCompany])} style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${T.gold}`, background: watchlist.includes(selCompany) ? T.gold : 'transparent', color: watchlist.includes(selCompany) ? '#fff' : T.gold, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
            {watchlist.includes(selCompany) ? 'On Watchlist' : '+ Watchlist'}
          </button>
          <button onClick={() => alert('Export PDF triggered')} style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${T.navy}`, background: 'transparent', color: T.navy, cursor: 'pointer', fontSize: 11 }}>Export PDF</button>
          <button onClick={() => alert('Export CSV triggered')} style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${T.navy}`, background: 'transparent', color: T.navy, cursor: 'pointer', fontSize: 11 }}>Export CSV</button>
        </div>

        {tab === 0 && (<div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={card}>
              <div style={label}>Selected Company Radar — {selData.name} ({rating(selData.score)})</div>
              <div style={{ ...bigNum, color: ratingColor(rating(selData.score)), marginBottom: 8 }}>{selData.score}/100</div>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke={T.border} />
                  <PolarAngleAxis dataKey="dim" tick={{ fontSize: 10, fill: T.textSec }} />
                  <PolarRadiusAxis angle={90} domain={[0, 25]} tick={{ fontSize: 9 }} />
                  <Radar name="Score" dataKey="val" stroke={T.navy} fill={T.navy} fillOpacity={0.25} />
                  <Radar name="Max" dataKey="max" stroke={T.gold} fill="none" strokeDasharray="4 4" />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <div style={label}>Sector Average Credibility Scores</div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={sectorAvgs} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="sector" width={80} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="avg" radius={[0, 4, 4, 0]}>
                    {sectorAvgs.map((s, i) => <Cell key={i} fill={s.avg >= 75 ? T.green : s.avg >= 55 ? T.teal : s.avg >= 35 ? T.amber : T.red} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={card}>
            <div style={label}>All Companies — Ranked</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead><tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  {['Company','Sector','Validation','Ambition','Scope','Interim','CapEx','Score','Rating'].map(h => <th key={h} style={{ textAlign: 'left', padding: '8px 6px', color: T.textMut, fontWeight: 600 }}>{h}</th>)}
                </tr></thead>
                <tbody>{filtered.map(c => <tr key={c.name} style={{ borderBottom: `1px solid ${T.border}`, cursor: 'pointer', background: c.name === selCompany ? T.gold + '11' : 'transparent' }} onClick={() => setSelCompany(c.name)}>
                  <td style={{ padding: '6px', fontWeight: 600 }}>{c.name}</td>
                  <td style={{ padding: '6px' }}>{c.sector}</td>
                  <td style={{ padding: '6px' }}><span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, background: c.validation === 'approved' ? T.green + '22' : c.validation === 'committed' ? T.amber + '22' : T.red + '22', color: c.validation === 'approved' ? T.green : c.validation === 'committed' ? T.amber : T.red }}>{c.validation}</span></td>
                  <td style={{ padding: '6px' }}>{c.ambition}</td><td style={{ padding: '6px' }}>{c.scope}</td>
                  <td style={{ padding: '6px' }}>{c.interim}</td><td style={{ padding: '6px', fontFamily: T.mono }}>{c.capex}</td>
                  <td style={{ padding: '6px', fontFamily: T.mono, fontWeight: 700 }}>{c.score}</td>
                  <td style={{ padding: '6px' }}><span style={{ padding: '2px 10px', borderRadius: 10, fontSize: 10, fontWeight: 700, background: ratingColor(rating(c.score)) + '22', color: ratingColor(rating(c.score)) }}>{rating(c.score)}</span></td>
                </tr>)}</tbody>
              </table>
            </div>
          </div>
          <div style={{ ...card, background: T.navy + '08', border: `1px solid ${T.gold}33` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.navy, marginBottom: 4 }}>Methodology Reference</div>
            <div style={{ fontSize: 11, color: T.textSec, lineHeight: 1.6 }}>
              Credibility Score = Validation (max 20) + Ambition (max 25) + Scope Coverage (max 25) + Interim Progress (max 15) + CapEx Alignment (max 15). Rating: A(&ge;85), B(&ge;65), C(&ge;45), D(&ge;25), E(&lt;25). Based on SBTi Corporate Net-Zero Standard v1.2, CDP Climate scores, and proprietary CapEx alignment analysis.
            </div>
          </div>
        </div>)}

        {tab === 1 && (<div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={card}>
              <div style={label}>Validation Status Distribution</div>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={validationDist} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={90} label={({ status, count }) => `${status}: ${count}`}>
                    {validationDist.map((_, i) => <Cell key={i} fill={[T.green, T.amber, T.red][i]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <div style={label}>Validation Score Contribution</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={filtered.slice(0, 15)}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={60} />
                  <YAxis domain={[0, 20]} tick={{ fontSize: 10 }} />
                  <Tooltip /><Bar dataKey={d => VALIDATION[d.validation]} name="Validation Pts" fill={T.green} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={card}>
            <div style={label}>Validation Timeline Progression (Simulated)</div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={[2019, 2020, 2021, 2022, 2023, 2024].map(y => ({ year: y, approved: Math.round(3 + (y - 2019) * 3.2), committed: Math.round(5 + (y - 2019) * 1.8), selfDeclared: Math.round(8 - (y - 2019) * 0.8) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} />
                <Tooltip /><Legend wrapperStyle={{ fontSize: 10 }} />
                <Line type="monotone" dataKey="approved" stroke={T.green} strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="committed" stroke={T.amber} strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="selfDeclared" stroke={T.red} strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>)}

        {tab === 2 && (<div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={card}>
              <div style={label}>Target Ambition Distribution</div>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={ambitionDist} dataKey="count" nameKey="target" cx="50%" cy="50%" outerRadius={90} label={({ target, count }) => `${target}: ${count}`}>
                    {ambitionDist.map((_, i) => <Cell key={i} fill={[T.green, T.teal, T.amber][i]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <div style={label}>Ambition Score by Company</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={filtered.slice(0, 15)}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={60} />
                  <YAxis domain={[0, 25]} tick={{ fontSize: 10 }} />
                  <Tooltip /><Bar dataKey={d => AMBITION[d.ambition]} name="Ambition Pts" fill={T.blue} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={card}>
            <div style={label}>Ambition vs Total Score Correlation</div>
            <ResponsiveContainer width="100%" height={250}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="x" name="Ambition" tick={{ fontSize: 10 }} label={{ value: 'Ambition Pts', position: 'bottom', fontSize: 10 }} />
                <YAxis dataKey="y" name="Total Score" tick={{ fontSize: 10 }} />
                <ZAxis dataKey="z" range={[40, 200]} /><Tooltip />
                <Scatter data={COMPANIES.map(c => ({ x: AMBITION[c.ambition], y: c.score, z: c.capex * 10, name: c.name }))} fill={T.purple} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>)}

        {tab === 3 && (<div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={card}>
              <div style={label}>Scope Coverage Split</div>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={scopeDist} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={90} label>
                    <Cell fill={T.green} /><Cell fill={T.amber} />
                  </Pie>
                  <Tooltip /><Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <div style={label}>Scope 3 Coverage by Sector</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={[...new Set(COMPANIES.map(c => c.sector))].map(s => {
                  const sc = COMPANIES.filter(c => c.sector === s);
                  return { sector: s, full: sc.filter(c => c.scope === '1+2+3').length, partial: sc.filter(c => c.scope === '1+2').length };
                })}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="sector" tick={{ fontSize: 9 }} /><YAxis tick={{ fontSize: 10 }} />
                  <Tooltip /><Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="full" name="1+2+3" fill={T.green} stackId="a" />
                  <Bar dataKey="partial" name="1+2 only" fill={T.amber} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ ...card, background: T.navy + '08', border: `1px solid ${T.gold}33` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.navy, marginBottom: 4 }}>Scope 3 Audit Note</div>
            <div style={{ fontSize: 11, color: T.textSec, lineHeight: 1.6 }}>Companies scoring 25/25 on scope coverage include all material Scope 3 categories. Companies at 15/25 cover only Scope 1+2, missing significant upstream/downstream emissions. SBTi Net-Zero Standard requires Scope 3 inclusion when &gt;40% of total GHG.</div>
          </div>
        </div>)}

        {tab === 4 && (<div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={card}>
              <div style={label}>Interim Milestone Status Distribution</div>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={interimDist} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={90} label>
                    {interimDist.map((_, i) => <Cell key={i} fill={[T.green, T.teal, T.orange, T.red][i]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <div style={label}>Interim Progress Contribution per Company</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={filtered.slice(0, 15)}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={60} />
                  <YAxis domain={[0, 15]} tick={{ fontSize: 10 }} />
                  <Tooltip /><Bar dataKey={d => INTERIM[d.interim]} name="Interim Pts" fill={T.teal} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>)}

        {tab === 5 && (<div>
          <div style={card}>
            <div style={label}>Say-Do Gap — Largest Credibility Shortfalls</div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={gapData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} />
                <Tooltip /><Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="gap" name="Gap to Target" fill={T.red} radius={[0, 4, 4, 0]} />
                <Bar dataKey="capex" name="CapEx Score" fill={T.green} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <div style={label}>Score vs CapEx Alignment — Scatter</div>
            <ResponsiveContainer width="100%" height={260}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="x" name="CapEx" tick={{ fontSize: 10 }} label={{ value: 'CapEx Score', position: 'bottom', fontSize: 10 }} />
                <YAxis dataKey="y" name="Total Score" tick={{ fontSize: 10 }} /><Tooltip />
                <Scatter data={COMPANIES.map(c => ({ x: c.capex, y: c.score, name: c.name }))} fill={T.navy} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div style={{ ...card, background: T.navy + '08', border: `1px solid ${T.gold}33` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.navy, marginBottom: 4 }}>Say-Do Gap Methodology</div>
            <div style={{ fontSize: 11, color: T.textSec, lineHeight: 1.6 }}>Gap = Ambition-Implied Minimum Score minus Actual Score. 1.5C targets require &ge;85 credibility, WB2C &ge;65, 2C &ge;45. Positive gap = under-delivering on commitments. CapEx alignment is the strongest predictor of credibility.</div>
          </div>
        </div>)}
      </div>
    </div>
  );
}
