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

const KPIS = [
  'SBTi Validation','CapEx Green Ratio','R&D Clean Tech %','Lobbying Alignment','Exec Comp Climate',
  'Board Climate Expertise','Scope 3 Coverage','Offset Dependency','Just Transition','TCFD Quality',
  'CDP Score','RE Procurement %','Methane Management','Supply Chain Engage','Physical Risk Disclosure'
];

const COMPANIES = [
  { name:'Orsted', sector:'Utilities', scores:[10,9,9,9,10,8,10,9,8,9,9,10,8,8,9] },
  { name:'Iberdrola', sector:'Utilities', scores:[10,9,8,8,9,8,9,8,7,9,8,10,7,8,8] },
  { name:'Microsoft', sector:'Tech', scores:[9,8,9,8,8,9,9,9,8,9,9,9,7,8,8] },
  { name:'Apple', sector:'Tech', scores:[9,8,8,7,7,8,8,8,7,8,8,9,6,7,8] },
  { name:'Unilever', sector:'Consumer', scores:[9,7,7,8,8,7,9,7,8,8,8,7,7,8,7] },
  { name:'Danone', sector:'Consumer', scores:[9,7,7,7,8,7,8,6,8,8,7,7,6,7,7] },
  { name:'Schneider', sector:'Industrial', scores:[10,8,8,8,9,8,9,8,7,9,8,8,7,8,8] },
  { name:'Siemens', sector:'Industrial', scores:[9,7,8,7,7,7,8,7,6,8,7,7,6,7,7] },
  { name:'BNP Paribas', sector:'Finance', scores:[9,6,5,7,7,7,8,6,7,8,7,5,5,7,7] },
  { name:'HSBC', sector:'Finance', scores:[8,5,4,6,6,6,7,6,6,7,6,4,5,6,6] },
  { name:'Shell', sector:'Energy', scores:[5,4,4,3,4,5,7,4,4,6,5,3,5,4,5] },
  { name:'BP', sector:'Energy', scores:[5,4,3,3,4,4,6,5,4,5,5,3,4,4,4] },
  { name:'TotalEnergies', sector:'Energy', scores:[4,4,3,2,3,4,5,5,3,5,4,3,4,3,4] },
  { name:'ExxonMobil', sector:'Energy', scores:[2,2,2,1,1,2,3,3,2,3,2,1,3,2,2] },
  { name:'Glencore', sector:'Mining', scores:[3,2,2,2,2,2,4,4,3,3,3,2,3,2,3] },
].map(c => ({ ...c, total: c.scores.reduce((a, v) => a + v, 0) }));

function nzRating(t) { return t >= 120 ? 'A' : t >= 100 ? 'B' : t >= 70 ? 'C' : t >= 40 ? 'D' : 'E'; }
function nzColor(r) { return { A: T.green, B: T.teal, C: T.amber, D: T.orange, E: T.red }[r]; }

const TABS = ['Credibility Index Dashboard','15-KPI Scorecard','CapEx Alignment','Lobbying Consistency','Executive Compensation','Peer Ranking'];
const card = { background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20, marginBottom: 16 };
const lbl = { fontSize: 10, color: T.textMut, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 };

export default function NetZeroCredibilityIndexPage() {
  const [tab, setTab] = useState(0);
  const [selCo, setSelCo] = useState('Orsted');
  const [sortBy, setSortBy] = useState('total');
  const [watchlist, setWatchlist] = useState([]);

  const sorted = useMemo(() => {
    const d = [...COMPANIES];
    d.sort((a, b) => sortBy === 'total' ? b.total - a.total : a.name.localeCompare(b.name));
    return d;
  }, [sortBy]);

  const selData = COMPANIES.find(c => c.name === selCo) || COMPANIES[0];
  const radarData = KPIS.map((k, i) => ({ kpi: k.length > 12 ? k.slice(0, 12) + '..' : k, score: selData.scores[i], max: 10 }));

  const ratingDist = ['A', 'B', 'C', 'D', 'E'].map(r => ({ rating: r, count: COMPANIES.filter(c => nzRating(c.total) === r).length }));

  const capexData = COMPANIES.map(c => ({ name: c.name, capex: c.scores[1], total: c.total })).sort((a, b) => b.capex - a.capex);
  const lobbyData = COMPANIES.map(c => ({ name: c.name, lobby: c.scores[3], total: c.total })).sort((a, b) => b.lobby - a.lobby);
  const execData = COMPANIES.map(c => ({ name: c.name, exec: c.scores[4], board: c.scores[5] })).sort((a, b) => (b.exec + b.board) - (a.exec + a.board));

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh' }}>
      <div style={{ background: T.navy, padding: '24px 32px 0', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ color: T.gold, fontFamily: T.mono, fontSize: 11, letterSpacing: 2, marginBottom: 4 }}>EP-CM3 · NET ZERO CREDIBILITY INDEX</div>
            <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: 0 }}>15-KPI Net Zero Credibility Index</h1>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>
              15 KPIs · 0-150 Total Score · Rating A-E · CapEx + Lobbying + Exec Comp Analysis
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {[
              { label: 'A-Rated', val: ratingDist[0].count, col: T.green },
              { label: 'Index Avg', val: Math.round(COMPANIES.reduce((a, c) => a + c.total, 0) / COMPANIES.length), col: T.gold },
              { label: 'E-Rated', val: ratingDist[4].count, col: T.red },
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
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
          <select value={selCo} onChange={e => setSelCo(e.target.value)} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, fontFamily: T.font }}>
            {COMPANIES.map(c => <option key={c.name}>{c.name}</option>)}
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
            <option value="total">Sort by Score</option><option value="name">Sort by Name</option>
          </select>
          <button onClick={() => setWatchlist(w => w.includes(selCo) ? w.filter(x => x !== selCo) : [...w, selCo])} style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${T.gold}`, background: watchlist.includes(selCo) ? T.gold : 'transparent', color: watchlist.includes(selCo) ? '#fff' : T.gold, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
            {watchlist.includes(selCo) ? 'On Watchlist' : '+ Watchlist'}
          </button>
          <button onClick={() => alert('Export PDF')} style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${T.navy}`, background: 'transparent', color: T.navy, cursor: 'pointer', fontSize: 11 }}>Export PDF</button>
          <button onClick={() => alert('Alert Subscribe')} style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${T.teal}`, background: 'transparent', color: T.teal, cursor: 'pointer', fontSize: 11 }}>Subscribe Alerts</button>
        </div>

        {tab === 0 && (<div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={card}>
              <div style={lbl}>{selData.name} — 15-KPI Radar ({nzRating(selData.total)})</div>
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: T.mono, color: nzColor(nzRating(selData.total)), marginBottom: 8 }}>{selData.total}/150</div>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke={T.border} /><PolarAngleAxis dataKey="kpi" tick={{ fontSize: 8, fill: T.textSec }} />
                  <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fontSize: 8 }} />
                  <Radar name="Score" dataKey="score" stroke={T.navy} fill={T.navy} fillOpacity={0.2} />
                  <Radar name="Max" dataKey="max" stroke={T.gold} fill="none" strokeDasharray="4 4" />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <div style={lbl}>Rating Distribution</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ratingDist}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="rating" tick={{ fontSize: 12, fontWeight: 700 }} /><YAxis tick={{ fontSize: 10 }} />
                  <Tooltip /><Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {ratingDist.map((d, i) => <Cell key={i} fill={nzColor(d.rating)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={card}>
            <div style={lbl}>Full Company Ranking</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead><tr style={{ borderBottom: `2px solid ${T.border}` }}>
                {['Rank','Company','Sector','Total','Rating'].map(h => <th key={h} style={{ textAlign: 'left', padding: '8px 6px', color: T.textMut }}>{h}</th>)}
              </tr></thead>
              <tbody>{sorted.map((c, i) => (
                <tr key={c.name} onClick={() => setSelCo(c.name)} style={{ borderBottom: `1px solid ${T.border}`, cursor: 'pointer', background: c.name === selCo ? T.gold + '11' : 'transparent' }}>
                  <td style={{ padding: 6, fontFamily: T.mono }}>{i + 1}</td>
                  <td style={{ padding: 6, fontWeight: 600 }}>{c.name}</td>
                  <td style={{ padding: 6 }}>{c.sector}</td>
                  <td style={{ padding: 6, fontFamily: T.mono, fontWeight: 700 }}>{c.total}</td>
                  <td style={{ padding: 6 }}><span style={{ padding: '2px 10px', borderRadius: 10, fontSize: 10, fontWeight: 700, background: nzColor(nzRating(c.total)) + '22', color: nzColor(nzRating(c.total)) }}>{nzRating(c.total)}</span></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>)}

        {tab === 1 && (<div>
          <div style={card}>
            <div style={lbl}>15-KPI Scorecard — {selData.name}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
              {KPIS.map((k, i) => (
                <div key={k} style={{ background: T.bg, borderRadius: 8, padding: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 9, color: T.textMut, marginBottom: 4 }}>{k}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, fontFamily: T.mono, color: selData.scores[i] >= 8 ? T.green : selData.scores[i] >= 5 ? T.amber : T.red }}>{selData.scores[i]}</div>
                  <div style={{ fontSize: 9, color: T.textMut }}>/10</div>
                </div>
              ))}
            </div>
          </div>
          <div style={card}>
            <div style={lbl}>KPI Heatmap — All Companies</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', fontSize: 9 }}>
                <thead><tr><th style={{ padding: 4 }}></th>{KPIS.map(k => <th key={k} style={{ padding: 4, writingMode: 'vertical-lr', transform: 'rotate(180deg)', height: 80, color: T.textMut }}>{k}</th>)}</tr></thead>
                <tbody>{sorted.map(c => (
                  <tr key={c.name}><td style={{ padding: '4px 8px', fontWeight: 600, whiteSpace: 'nowrap' }}>{c.name}</td>
                    {c.scores.map((s, i) => <td key={i} style={{ padding: 4, textAlign: 'center', fontFamily: T.mono, fontWeight: 700, background: s >= 8 ? T.green + '22' : s >= 5 ? T.amber + '22' : T.red + '22', color: s >= 8 ? T.green : s >= 5 ? T.amber : T.red }}>{s}</td>)}
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        </div>)}

        {tab === 2 && (<div>
          <div style={card}>
            <div style={lbl}>CapEx Green Ratio Scores (Sorted)</div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={capexData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" domain={[0, 10]} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} />
                <Tooltip /><Bar dataKey="capex" name="CapEx Score" radius={[0, 4, 4, 0]}>
                  {capexData.map((d, i) => <Cell key={i} fill={d.capex >= 7 ? T.green : d.capex >= 4 ? T.amber : T.red} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <div style={lbl}>CapEx vs Total Score Scatter</div>
            <ResponsiveContainer width="100%" height={250}>
              <ScatterChart><CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="x" name="CapEx" tick={{ fontSize: 10 }} /><YAxis dataKey="y" name="Total" tick={{ fontSize: 10 }} /><Tooltip />
                <Scatter data={COMPANIES.map(c => ({ x: c.scores[1], y: c.total, name: c.name }))} fill={T.navy} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>)}

        {tab === 3 && (<div>
          <div style={card}>
            <div style={lbl}>Lobbying Alignment Scores (InfluenceMap-Based)</div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={lobbyData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" domain={[0, 10]} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} />
                <Tooltip /><Bar dataKey="lobby" name="Lobbying Score" radius={[0, 4, 4, 0]}>
                  {lobbyData.map((d, i) => <Cell key={i} fill={d.lobby >= 7 ? T.green : d.lobby >= 4 ? T.amber : T.red} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <div style={lbl}>Lobbying vs Stated Ambition (Consistency Check)</div>
            <ResponsiveContainer width="100%" height={250}>
              <ScatterChart><CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="x" name="Lobbying" tick={{ fontSize: 10 }} /><YAxis dataKey="y" name="SBTi Score" tick={{ fontSize: 10 }} /><Tooltip />
                <Scatter data={COMPANIES.map(c => ({ x: c.scores[3], y: c.scores[0], name: c.name }))} fill={T.purple} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>)}

        {tab === 4 && (<div>
          <div style={card}>
            <div style={lbl}>Executive Compensation Climate Linkage + Board Expertise</div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={execData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={60} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} /><Tooltip /><Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="exec" name="Exec Comp Climate" fill={T.blue} />
                <Bar dataKey="board" name="Board Expertise" fill={T.teal} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>)}

        {tab === 5 && (<div>
          <div style={card}>
            <div style={lbl}>Peer Ranking — Total NZ Credibility Index</div>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={sorted} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" domain={[0, 150]} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} /><Tooltip />
                <Bar dataKey="total" name="Total Score" radius={[0, 4, 4, 0]}>
                  {sorted.map((c, i) => <Cell key={i} fill={nzColor(nzRating(c.total))} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ ...card, background: T.navy + '08', border: `1px solid ${T.gold}33` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.navy, marginBottom: 4 }}>Index Methodology</div>
            <div style={{ fontSize: 11, color: T.textSec, lineHeight: 1.6 }}>
              15 KPIs each scored 0-10 = 150 max. Rating: A(&ge;120), B(&ge;100), C(&ge;70), D(&ge;40), E(&lt;40). Sources: SBTi, CDP, InfluenceMap, company disclosures, TCFD reports, RE100. Updated quarterly.
            </div>
          </div>
        </div>)}
      </div>
    </div>
  );
}
