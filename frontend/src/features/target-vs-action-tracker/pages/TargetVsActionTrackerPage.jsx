import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, ReferenceLine
} from 'recharts';

const T = {
  bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c',
  navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae',
  red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb',
  orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a',
  card:'#ffffff',sub:'#5c6b7e',indigo:'#4f46e5',font:"'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"
};

const COMPANIES = [
  { name:'Shell', target:'50% by 2030', targetPct:50, baseYear:2019, achieved:12, years:5, greenCapex:18, techDeployed:'moderate', lobbyAlign:'misaligned' },
  { name:'BP', target:'35-40% by 2030', targetPct:37, baseYear:2019, achieved:8, years:5, greenCapex:15, techDeployed:'low', lobbyAlign:'misaligned' },
  { name:'TotalEnergies', target:'30% by 2030', targetPct:30, baseYear:2019, achieved:10, years:5, greenCapex:20, techDeployed:'moderate', lobbyAlign:'mixed' },
  { name:'Enel', target:'80% by 2030', targetPct:80, baseYear:2017, achieved:55, years:7, greenCapex:72, techDeployed:'high', lobbyAlign:'aligned' },
  { name:'Orsted', target:'98% by 2025', targetPct:98, baseYear:2006, achieved:92, years:18, greenCapex:85, techDeployed:'high', lobbyAlign:'aligned' },
  { name:'Microsoft', target:'Carbon neg. by 2030', targetPct:100, baseYear:2020, achieved:42, years:4, greenCapex:45, techDeployed:'high', lobbyAlign:'aligned' },
  { name:'Amazon', target:'NZ by 2040', targetPct:100, baseYear:2019, achieved:18, years:5, greenCapex:35, techDeployed:'moderate', lobbyAlign:'mixed' },
  { name:'Volkswagen', target:'NZ by 2050', targetPct:100, baseYear:2018, achieved:15, years:6, greenCapex:42, techDeployed:'moderate', lobbyAlign:'mixed' },
  { name:'ArcelorMittal', target:'25% by 2030', targetPct:25, baseYear:2018, achieved:5, years:6, greenCapex:8, techDeployed:'low', lobbyAlign:'misaligned' },
  { name:'HeidelbergCement', target:'30% by 2030', targetPct:30, baseYear:2019, achieved:7, years:5, greenCapex:10, techDeployed:'low', lobbyAlign:'mixed' },
  { name:'Unilever', target:'NZ by 2039', targetPct:100, baseYear:2015, achieved:35, years:9, greenCapex:40, techDeployed:'moderate', lobbyAlign:'aligned' },
  { name:'Nestle', target:'50% by 2030', targetPct:50, baseYear:2018, achieved:14, years:6, greenCapex:22, techDeployed:'moderate', lobbyAlign:'mixed' },
].map(c => {
  const yearsLeft = (c.target.includes('2030') ? 2030 : c.target.includes('2040') ? 2040 : c.target.includes('2050') ? 2050 : 2039) - 2024;
  const annualRate = c.achieved / c.years;
  const projectedFinal = c.achieved + annualRate * yearsLeft;
  const gapPct = Math.max(0, c.targetPct - projectedFinal);
  const onTrack = projectedFinal >= c.targetPct * 0.9;
  return { ...c, yearsLeft, annualRate: annualRate.toFixed(1), projectedFinal: Math.round(projectedFinal), gapPct: Math.round(gapPct), onTrack };
});

const TABS = ['Gap Dashboard','Emissions Trajectory','CapEx Tracking','Technology Deployment','Policy Advocacy Check','Engagement Action Items'];
const card = { background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20, marginBottom: 16 };
const lbl = { fontSize: 10, color: T.textMut, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 };

export default function TargetVsActionTrackerPage() {
  const [tab, setTab] = useState(0);
  const [selCo, setSelCo] = useState('Shell');
  const [watchlist, setWatchlist] = useState([]);

  const sel = COMPANIES.find(c => c.name === selCo) || COMPANIES[0];

  const trajectoryData = useMemo(() => {
    const data = [];
    for (let y = sel.baseYear; y <= 2035; y++) {
      const elapsed = y - sel.baseYear;
      const actual = y <= 2024 ? Math.min(sel.achieved, sel.achieved * elapsed / sel.years) : null;
      const projected = sel.achieved + parseFloat(sel.annualRate) * Math.max(0, y - 2024);
      const targetLine = sel.targetPct * elapsed / ((sel.target.includes('2030') ? 2030 : 2050) - sel.baseYear);
      data.push({ year: y, actual: actual !== null ? Math.round(actual) : null, projected: Math.round(projected), target: Math.round(targetLine) });
    }
    return data;
  }, [selCo]);

  const capexData = COMPANIES.map(c => ({ name: c.name, greenCapex: c.greenCapex, gap: c.gapPct })).sort((a, b) => b.greenCapex - a.greenCapex);

  const techData = COMPANIES.map(c => ({ name: c.name, tech: c.techDeployed === 'high' ? 3 : c.techDeployed === 'moderate' ? 2 : 1, label: c.techDeployed }));

  const lobbyData = COMPANIES.map(c => ({ name: c.name, align: c.lobbyAlign === 'aligned' ? 3 : c.lobbyAlign === 'mixed' ? 2 : 1, label: c.lobbyAlign }));

  const engagementItems = COMPANIES.filter(c => !c.onTrack).map(c => ({
    company: c.name, action: `Request updated transition plan — gap of ${c.gapPct}%`, priority: c.gapPct > 30 ? 'HIGH' : 'MEDIUM'
  }));

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh' }}>
      <div style={{ background: T.navy, padding: '24px 32px 0', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ color: T.gold, fontFamily: T.mono, fontSize: 11, letterSpacing: 2, marginBottom: 4 }}>EP-CM5 · TARGET vs ACTION TRACKER</div>
            <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: 0 }}>Target vs. Action Gap Tracker</h1>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>12 Companies · Emissions Trajectory · CapEx · Technology · Lobbying · Engagement</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {[
              { label: 'On Track', val: COMPANIES.filter(c => c.onTrack).length, col: T.green },
              { label: 'Off Track', val: COMPANIES.filter(c => !c.onTrack).length, col: T.red },
              { label: 'Avg Gap', val: `${Math.round(COMPANIES.reduce((a, c) => a + c.gapPct, 0) / COMPANIES.length)}%`, col: T.amber },
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
          <button onClick={() => setWatchlist(w => w.includes(selCo) ? w.filter(x => x !== selCo) : [...w, selCo])} style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${T.gold}`, background: watchlist.includes(selCo) ? T.gold : 'transparent', color: watchlist.includes(selCo) ? '#fff' : T.gold, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
            {watchlist.includes(selCo) ? 'On Watchlist' : '+ Watchlist'}
          </button>
          <button onClick={() => alert('Export PDF')} style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${T.navy}`, background: 'transparent', color: T.navy, cursor: 'pointer', fontSize: 11 }}>Export PDF</button>
          <button onClick={() => alert('Export CSV')} style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${T.navy}`, background: 'transparent', color: T.navy, cursor: 'pointer', fontSize: 11 }}>Export CSV</button>
        </div>

        {tab === 0 && (<div>
          <div style={card}>
            <div style={lbl}>Target vs Projected Achievement — All Companies</div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={COMPANIES.sort((a, b) => b.gapPct - a.gapPct)}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={60} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} /><Tooltip /><Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="targetPct" name="Target %" fill={T.blue} />
                <Bar dataKey="projectedFinal" name="Projected %" fill={d => d.onTrack ? T.green : T.red}>
                  {COMPANIES.map((c, i) => <Cell key={i} fill={c.onTrack ? T.green : T.red} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <div style={lbl}>Gap Size (percentage points company will miss by)</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={COMPANIES.filter(c => c.gapPct > 0).sort((a, b) => b.gapPct - a.gapPct)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize: 10 }} /><YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10 }} />
                <Tooltip /><Bar dataKey="gapPct" name="Gap %" fill={T.red} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>)}

        {tab === 1 && (<div>
          <div style={card}>
            <div style={lbl}>Emissions Reduction Trajectory — {sel.name}</div>
            <div style={{ fontSize: 12, color: T.textSec, marginBottom: 8 }}>Target: {sel.target} | Achieved: {sel.achieved}% in {sel.years}yr | Rate: {sel.annualRate}%/yr | Projected: {sel.projectedFinal}%</div>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={trajectoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} /><YAxis domain={[0, Math.max(100, sel.targetPct + 10)]} tick={{ fontSize: 10 }} />
                <Tooltip /><Legend wrapperStyle={{ fontSize: 10 }} />
                <Line type="monotone" dataKey="target" stroke={T.green} strokeWidth={2} strokeDasharray="6 3" name="Target Path" dot={false} />
                <Line type="monotone" dataKey="actual" stroke={T.navy} strokeWidth={2} name="Actual" dot={{ r: 3 }} connectNulls={false} />
                <Line type="monotone" dataKey="projected" stroke={T.red} strokeWidth={2} strokeDasharray="4 4" name="Projected" dot={false} />
                <ReferenceLine x={2024} stroke={T.gold} strokeDasharray="4 4" label={{ value: 'Today', fontSize: 10 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>)}

        {tab === 2 && (<div>
          <div style={card}>
            <div style={lbl}>Green CapEx % — Sorted by Investment Level</div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={capexData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10 }} />
                <Tooltip /><Bar dataKey="greenCapex" name="Green CapEx %" radius={[0, 4, 4, 0]}>
                  {capexData.map((d, i) => <Cell key={i} fill={d.greenCapex >= 50 ? T.green : d.greenCapex >= 25 ? T.amber : T.red} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <div style={lbl}>CapEx vs Gap Correlation</div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={capexData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 10 }} /><Tooltip /><Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="greenCapex" name="Green CapEx %" fill={T.green} />
                <Bar dataKey="gap" name="Target Gap %" fill={T.red} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>)}

        {tab === 3 && (<div>
          <div style={card}>
            <div style={lbl}>Technology Deployment Level</div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={techData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={60} />
                <YAxis domain={[0, 3]} ticks={[1, 2, 3]} tickFormatter={v => ['', 'Low', 'Moderate', 'High'][v]} tick={{ fontSize: 10 }} />
                <Tooltip formatter={v => ['', 'Low', 'Moderate', 'High'][v]} />
                <Bar dataKey="tech" name="Tech Level" radius={[4, 4, 0, 0]}>
                  {techData.map((d, i) => <Cell key={i} fill={d.tech === 3 ? T.green : d.tech === 2 ? T.amber : T.red} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>)}

        {tab === 4 && (<div>
          <div style={card}>
            <div style={lbl}>Policy Advocacy Alignment</div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={lobbyData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={60} />
                <YAxis domain={[0, 3]} ticks={[1, 2, 3]} tickFormatter={v => ['', 'Misaligned', 'Mixed', 'Aligned'][v]} tick={{ fontSize: 10 }} />
                <Tooltip formatter={v => ['', 'Misaligned', 'Mixed', 'Aligned'][v]} />
                <Bar dataKey="align" name="Lobby Alignment" radius={[4, 4, 0, 0]}>
                  {lobbyData.map((d, i) => <Cell key={i} fill={d.align === 3 ? T.green : d.align === 2 ? T.amber : T.red} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ ...card, background: T.navy + '08', border: `1px solid ${T.gold}33` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.navy, marginBottom: 4 }}>Policy Advocacy Reference</div>
            <div style={{ fontSize: 11, color: T.textSec, lineHeight: 1.6 }}>Alignment assessed via InfluenceMap scores. "Misaligned" = company lobbies against climate regulation while claiming net-zero targets. "Mixed" = some positive, some negative positions. "Aligned" = lobbying consistent with stated climate targets.</div>
          </div>
        </div>)}

        {tab === 5 && (<div>
          <div style={card}>
            <div style={lbl}>Engagement Action Items — Companies Off Track</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead><tr style={{ borderBottom: `2px solid ${T.border}` }}>
                {['Company','Action','Priority'].map(h => <th key={h} style={{ textAlign: 'left', padding: '8px 6px', color: T.textMut }}>{h}</th>)}
              </tr></thead>
              <tbody>{engagementItems.map(e => (
                <tr key={e.company} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: 6, fontWeight: 600 }}>{e.company}</td>
                  <td style={{ padding: 6 }}>{e.action}</td>
                  <td style={{ padding: 6 }}><span style={{ padding: '2px 10px', borderRadius: 10, fontSize: 10, fontWeight: 700, background: e.priority === 'HIGH' ? T.red + '22' : T.amber + '22', color: e.priority === 'HIGH' ? T.red : T.amber }}>{e.priority}</span></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div style={card}>
            <div style={lbl}>Gap Distribution Across Portfolio</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={[{ range: '0-10%', count: COMPANIES.filter(c => c.gapPct <= 10).length }, { range: '10-30%', count: COMPANIES.filter(c => c.gapPct > 10 && c.gapPct <= 30).length }, { range: '30-50%', count: COMPANIES.filter(c => c.gapPct > 30 && c.gapPct <= 50).length }, { range: '50%+', count: COMPANIES.filter(c => c.gapPct > 50).length }]}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="range" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} />
                <Tooltip /><Bar dataKey="count" name="Companies" fill={T.navy} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>)}
      </div>
    </div>
  );
}
