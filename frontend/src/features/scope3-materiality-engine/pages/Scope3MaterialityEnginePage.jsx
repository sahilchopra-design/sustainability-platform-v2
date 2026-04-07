import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, PieChart, Pie
} from 'recharts';

const T = {
  bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c',
  navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae',
  red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb',
  orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a',
  card:'#ffffff',sub:'#5c6b7e',indigo:'#4f46e5',font:"'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"
};

const CATEGORIES = [
  { id:1, name:'Purchased Goods & Services', short:'Cat 1' },
  { id:2, name:'Capital Goods', short:'Cat 2' },
  { id:3, name:'Fuel & Energy Activities', short:'Cat 3' },
  { id:4, name:'Upstream Transport', short:'Cat 4' },
  { id:5, name:'Waste Generated', short:'Cat 5' },
  { id:6, name:'Business Travel', short:'Cat 6' },
  { id:7, name:'Employee Commuting', short:'Cat 7' },
  { id:8, name:'Upstream Leased Assets', short:'Cat 8' },
  { id:9, name:'Downstream Transport', short:'Cat 9' },
  { id:10, name:'Processing of Sold Products', short:'Cat 10' },
  { id:11, name:'Use of Sold Products', short:'Cat 11' },
  { id:12, name:'End-of-Life Treatment', short:'Cat 12' },
  { id:13, name:'Downstream Leased Assets', short:'Cat 13' },
  { id:14, name:'Franchises', short:'Cat 14' },
  { id:15, name:'Investments', short:'Cat 15' },
];

const SECTORS = ['Energy','Tech','Consumer','Auto','Finance','Materials'];

const SECTOR_DATA = {
  Energy:   { mat:[95,25,90,20,10,5,3,5,15,30,98,15,2,1,5],  dq:[3,3,2,4,4,5,5,5,4,4,2,4,5,5,3], engagement:42 },
  Tech:     { mat:[85,60,15,20,8,12,10,5,10,5,70,12,5,2,3],  dq:[3,2,3,4,4,4,4,5,4,5,3,4,5,5,5], engagement:55 },
  Consumer: { mat:[92,20,10,35,15,8,6,3,25,15,45,20,3,5,2],  dq:[2,3,3,3,3,4,4,5,3,4,3,3,5,5,5], engagement:38 },
  Auto:     { mat:[80,45,20,30,12,6,8,3,20,25,95,18,2,1,2],  dq:[3,3,3,3,4,4,4,5,3,3,2,4,5,5,5], engagement:45 },
  Finance:  { mat:[30,15,8,5,3,10,8,15,2,1,5,2,10,3,98],     dq:[4,4,5,5,5,4,4,4,5,5,5,5,4,5,2], engagement:28 },
  Materials:{ mat:[75,40,50,30,20,4,5,3,25,60,40,25,2,1,3],   dq:[3,3,2,3,3,4,5,5,3,3,3,3,5,5,5], engagement:35 },
};

const DQ_LABELS = ['N/A','Primary Supplier','Verified Secondary','Industry Average','Spend-Based','Extrapolated'];
const DQ_COLORS = [T.textMut, T.green, T.teal, T.blue, T.amber, T.red];

const TABS = ['Category Materiality Map','Data Quality by Category','Supplier Engagement Rate','Estimation Methodology','Sector Benchmarks','Improvement Roadmap'];
const card = { background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20, marginBottom: 16 };
const lbl = { fontSize: 10, color: T.textMut, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 };

export default function Scope3MaterialityEnginePage() {
  const [tab, setTab] = useState(0);
  const [sector, setSector] = useState('Energy');
  const [watchlist, setWatchlist] = useState([]);

  const sd = SECTOR_DATA[sector];
  const matData = CATEGORIES.map((c, i) => ({ ...c, materiality: sd.mat[i], dq: sd.dq[i] })).sort((a, b) => b.materiality - a.materiality);
  const top5 = matData.slice(0, 5);
  const dqDist = [1, 2, 3, 4, 5].map(q => ({ level: DQ_LABELS[q], count: sd.dq.filter(d => d === q).length }));

  const roadmap = top5.map(c => ({
    category: c.short, currentDQ: c.dq, targetDQ: Math.max(1, c.dq - 2),
    costM: (c.dq - Math.max(1, c.dq - 2)) * 0.4, benefitPct: (c.dq - Math.max(1, c.dq - 2)) * 12
  }));

  const benchmarkData = CATEGORIES.slice(0, 8).map(c => {
    const row = { category: c.short };
    SECTORS.forEach(s => { row[s] = SECTOR_DATA[s].mat[c.id - 1]; });
    return row;
  });

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh' }}>
      <div style={{ background: T.navy, padding: '24px 32px 0', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ color: T.gold, fontFamily: T.mono, fontSize: 11, letterSpacing: 2, marginBottom: 4 }}>EP-CM4 · SCOPE 3 MATERIALITY ENGINE</div>
            <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: 0 }}>Scope 3 Materiality & Data Quality Engine</h1>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>15 Categories · 6 Sectors · Data Quality 1-5 · Supplier Engagement · Improvement Roadmap</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {[
              { label: 'Avg DQ Score', val: (sd.dq.reduce((a, v) => a + v, 0) / 15).toFixed(1), col: T.amber },
              { label: 'Supplier Engage', val: `${sd.engagement}%`, col: T.teal },
              { label: 'Top Category', val: top5[0]?.short, col: T.gold },
            ].map(m => (
              <div key={m.label} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 16px', textAlign: 'right' }}>
                <div style={{ color: '#94a3b8', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{m.label}</div>
                <div style={{ color: m.col, fontSize: 18, fontWeight: 700, fontFamily: T.mono }}>{m.val}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {SECTORS.map(s => (
            <button key={s} onClick={() => setSector(s)} style={{
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
          <button onClick={() => alert('Export CSV')} style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${T.navy}`, background: 'transparent', color: T.navy, cursor: 'pointer', fontSize: 11 }}>Export CSV</button>
          <button onClick={() => alert('Export PDF')} style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${T.navy}`, background: 'transparent', color: T.navy, cursor: 'pointer', fontSize: 11 }}>Export PDF</button>
          <button onClick={() => alert('Subscribe')} style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${T.teal}`, background: 'transparent', color: T.teal, cursor: 'pointer', fontSize: 11 }}>Subscribe Alerts</button>
        </div>

        {tab === 0 && (<div>
          <div style={card}>
            <div style={lbl}>Category Materiality — {sector} Sector (% of total Scope 3)</div>
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={matData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="short" width={60} tick={{ fontSize: 10 }} />
                <Tooltip content={({ payload }) => payload?.[0] ? <div style={{ background: '#fff', padding: 8, border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 11 }}><strong>{payload[0].payload.name}</strong><br />Materiality: {payload[0].value}%</div> : null} />
                <Bar dataKey="materiality" radius={[0, 4, 4, 0]}>
                  {matData.map((d, i) => <Cell key={i} fill={d.materiality >= 70 ? T.red : d.materiality >= 30 ? T.amber : T.green} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <div style={lbl}>Top 5 Material Categories — {sector}</div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={top5} dataKey="materiality" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ short, materiality }) => `${short}: ${materiality}%`}>
                  {top5.map((_, i) => <Cell key={i} fill={[T.red, T.orange, T.amber, T.blue, T.teal][i]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>)}

        {tab === 1 && (<div>
          <div style={card}>
            <div style={lbl}>Data Quality Score by Category (1=Best, 5=Worst)</div>
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={matData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="short" tick={{ fontSize: 9 }} /><YAxis domain={[0, 5]} tick={{ fontSize: 10 }} reversed />
                <Tooltip /><Bar dataKey="dq" name="Data Quality" radius={[4, 4, 0, 0]}>
                  {matData.map((d, i) => <Cell key={i} fill={DQ_COLORS[d.dq]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <div style={lbl}>DQ Level Distribution</div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={dqDist} dataKey="count" nameKey="level" cx="50%" cy="50%" outerRadius={80} label>
                  {dqDist.map((_, i) => <Cell key={i} fill={DQ_COLORS[i + 1]} />)}
                </Pie>
                <Tooltip /><Legend wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>)}

        {tab === 2 && (<div>
          <div style={card}>
            <div style={lbl}>Supplier Engagement Rate by Sector</div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={SECTORS.map(s => ({ sector: s, engagement: SECTOR_DATA[s].engagement, primary: SECTOR_DATA[s].engagement * 0.6, estimated: 100 - SECTOR_DATA[s].engagement }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="sector" tick={{ fontSize: 10 }} /><YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip /><Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="engagement" name="Engaged %" fill={T.green} radius={[4, 4, 0, 0]} />
                <Bar dataKey="estimated" name="Estimated %" fill={T.amber} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <div style={lbl}>Primary vs Estimated Data Coverage — {sector}</div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={[{ name: 'Primary Data', value: sd.engagement }, { name: 'Estimated', value: 100 - sd.engagement }]} dataKey="value" cx="50%" cy="50%" outerRadius={80} label>
                  <Cell fill={T.green} /><Cell fill={T.amber} />
                </Pie>
                <Tooltip /><Legend wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>)}

        {tab === 3 && (<div>
          <div style={card}>
            <div style={lbl}>Estimation Methodology Distribution — {sector}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 16 }}>
              {[1, 2, 3, 4, 5].map(q => (
                <div key={q} style={{ background: DQ_COLORS[q] + '15', borderRadius: 8, padding: 12, textAlign: 'center', border: `1px solid ${DQ_COLORS[q]}33` }}>
                  <div style={{ fontSize: 9, color: T.textMut }}>{DQ_LABELS[q]}</div>
                  <div style={{ fontSize: 24, fontWeight: 700, fontFamily: T.mono, color: DQ_COLORS[q] }}>{sd.dq.filter(d => d === q).length}</div>
                  <div style={{ fontSize: 9, color: T.textMut }}>categories</div>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dqDist}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="level" tick={{ fontSize: 9 }} /><YAxis tick={{ fontSize: 10 }} />
                <Tooltip /><Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {dqDist.map((_, i) => <Cell key={i} fill={DQ_COLORS[i + 1]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>)}

        {tab === 4 && (<div>
          <div style={card}>
            <div style={lbl}>Cross-Sector Materiality Benchmark (Top 8 Categories)</div>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={benchmarkData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="category" tick={{ fontSize: 9 }} /><YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip /><Legend wrapperStyle={{ fontSize: 10 }} />
                {SECTORS.map((s, i) => <Bar key={s} dataKey={s} fill={[T.red, T.blue, T.green, T.amber, T.purple, T.orange][i]} />)}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>)}

        {tab === 5 && (<div>
          <div style={card}>
            <div style={lbl}>DQ Improvement Roadmap — Top 5 Material Categories ({sector})</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={roadmap}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="category" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} />
                <Tooltip /><Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="costM" name="Est. Cost ($M)" fill={T.red} />
                <Bar dataKey="benefitPct" name="DQ Improvement %" fill={T.green} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <div style={lbl}>Roadmap Detail Table</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead><tr style={{ borderBottom: `2px solid ${T.border}` }}>
                {['Category','Current DQ','Target DQ','Est. Cost','Benefit'].map(h => <th key={h} style={{ textAlign: 'left', padding: '8px 6px', color: T.textMut }}>{h}</th>)}
              </tr></thead>
              <tbody>{roadmap.map(r => (
                <tr key={r.category} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: 6, fontWeight: 600 }}>{r.category}</td>
                  <td style={{ padding: 6, fontFamily: T.mono, color: DQ_COLORS[r.currentDQ] }}>{DQ_LABELS[r.currentDQ]}</td>
                  <td style={{ padding: 6, fontFamily: T.mono, color: DQ_COLORS[r.targetDQ] }}>{DQ_LABELS[r.targetDQ]}</td>
                  <td style={{ padding: 6, fontFamily: T.mono }}>${r.costM.toFixed(1)}M</td>
                  <td style={{ padding: 6, fontFamily: T.mono, color: T.green }}>+{r.benefitPct}%</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div style={{ ...card, background: T.navy + '08', border: `1px solid ${T.gold}33` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.navy, marginBottom: 4 }}>Scope 3 Methodology</div>
            <div style={{ fontSize: 11, color: T.textSec, lineHeight: 1.6 }}>GHG Protocol Corporate Value Chain (Scope 3) Standard. DQ scoring: 1=Primary supplier data, 2=Verified secondary, 3=Industry average, 4=Spend-based estimates, 5=Extrapolated. Materiality threshold: categories &gt;5% of total Scope 3 are material per SBTi criteria.</div>
          </div>
        </div>)}
      </div>
    </div>
  );
}
