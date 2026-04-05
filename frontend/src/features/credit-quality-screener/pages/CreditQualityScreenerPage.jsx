import React, { useState, useMemo } from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, PieChart, Pie, ScatterChart, Scatter, ZAxis
} from 'recharts';

const T = {
  bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c',
  navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae',
  red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb',
  orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a',
  font:"'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"
};

const CCP_PRINCIPLES = ['Additionality','Permanence','Robust Quantification','No Double Counting','Sustainable Development'];

function genCredit(id, name, method, region, vintage) {
  const s = (id * 7 + 13) % 100;
  const add = 3 + (s % 8); const perm = 2 + ((s * 3) % 9); const quant = 3 + ((s * 5) % 8);
  const ndc = 4 + ((s * 2) % 7); const sd = 2 + ((s * 4) % 9);
  const leak = ((s * 6) % 40) + 5; const sdgCount = 1 + (s % 6);
  const flags = [];
  if (add < 5) flags.push('Low additionality');
  if (perm < 4) flags.push('Permanence concern');
  if (leak > 30) flags.push('High leakage risk');
  if (vintage < 2020) flags.push('Aged vintage');
  return { id, name, method, region, vintage, ccp: [add, perm, quant, ndc, sd], ccpTotal: add + perm + quant + ndc + sd, leakage: leak, sdgCount, flags, quality: Math.round((add + perm + quant + ndc + sd) * 2) };
}

const CREDITS = [
  genCredit(1,'Amazon REDD+ Acre','REDD+','Brazil',2023), genCredit(2,'Kalimantan REDD+','REDD+','Indonesia',2022),
  genCredit(3,'Congo Basin REDD+','REDD+','DRC',2024), genCredit(4,'Maya Forest REDD+','REDD+','Guatemala',2021),
  genCredit(5,'Cerrado ARR','ARR','Brazil',2024), genCredit(6,'Ethiopian ARR','ARR','Ethiopia',2023),
  genCredit(7,'India ARR Teak','ARR','India',2022), genCredit(8,'Boreal IFM Canada','IFM','Canada',2023),
  genCredit(9,'Pacific NW IFM','IFM','USA',2024), genCredit(10,'Ghana Cookstove','Cookstove','Ghana',2024),
  genCredit(11,'Kenya Cookstove','Cookstove','Kenya',2023), genCredit(12,'Nepal Cookstove','Cookstove','Nepal',2022),
  genCredit(13,'Solar Rajasthan','Renewable','India',2021), genCredit(14,'Wind Shandong','Renewable','China',2020),
  genCredit(15,'Hydro Mekong','Renewable','Vietnam',2022), genCredit(16,'Climeworks DAC','DAC','Iceland',2024),
  genCredit(17,'Carbon Engineering','DAC','Canada',2024), genCredit(18,'Oregon Biochar','Biochar','USA',2024),
  genCredit(19,'CarbonCure CCS','CCS','Canada',2024), genCredit(20,'Project Vesta Min','Mineralization','USA',2024),
  genCredit(21,'Sundarbans Mangrove','Blue Carbon','Bangladesh',2023), genCredit(22,'Yucatan Mangrove','Blue Carbon','Mexico',2024),
  genCredit(23,'Iowa Soil Carbon','Soil','USA',2023), genCredit(24,'UK Peatland','Peatland','UK',2024),
  genCredit(25,'Landfill US Midwest','Waste','USA',2022),
  ...Array.from({length:75}, (_, i) => genCredit(26+i, `Credit-${26+i}`, ['REDD+','ARR','Cookstove','Renewable','DAC','Biochar'][i%6], ['Brazil','India','USA','Kenya','Indonesia','China'][i%6], 2020 + (i%5)))
];

const TABS = ['Quality Screener','ICVCM CCP Alignment','Additionality Assessment','Leakage Risk','Co-Benefit Scoring','Red Flag Detector'];
const card = { background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20, marginBottom: 16 };
const lbl = { fontSize: 10, color: T.textMut, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 };

export default function CreditQualityScreenerPage() {
  const [tab, setTab] = useState(0);
  const [minQuality, setMinQuality] = useState(50);
  const [methodFilter, setMethodFilter] = useState('All');
  const [sortBy, setSortBy] = useState('quality');
  const [selCredit, setSelCredit] = useState(CREDITS[0]);
  const [watchlist, setWatchlist] = useState([]);

  const methods = ['All', ...new Set(CREDITS.map(c => c.method))];
  const filtered = useMemo(() => {
    let d = CREDITS.filter(c => c.quality >= minQuality);
    if (methodFilter !== 'All') d = d.filter(c => c.method === methodFilter);
    d.sort((a, b) => sortBy === 'quality' ? b.quality - a.quality : sortBy === 'leakage' ? a.leakage - b.leakage : a.name.localeCompare(b.name));
    return d.slice(0, 30);
  }, [minQuality, methodFilter, sortBy]);

  const ccpRadar = CCP_PRINCIPLES.map((p, i) => ({ principle: p.length > 12 ? p.slice(0, 12) + '..' : p, score: selCredit.ccp[i], max: 10 }));
  const flaggedCredits = CREDITS.filter(c => c.flags.length > 0);
  const methodDist = [...new Set(CREDITS.map(c => c.method))].map(m => ({ method: m, count: CREDITS.filter(c => c.method === m).length, avgQ: Math.round(CREDITS.filter(c => c.method === m).reduce((a, c) => a + c.quality, 0) / CREDITS.filter(c => c.method === m).length) }));

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh' }}>
      <div style={{ background: T.navy, padding: '24px 32px 0', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ color: T.gold, fontFamily: T.mono, fontSize: 11, letterSpacing: 2, marginBottom: 4 }}>EP-CN4 · CREDIT QUALITY SCREENER</div>
            <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: 0 }}>Carbon Credit Quality Screening Engine</h1>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>100 Credits · ICVCM CCP · Additionality · Leakage · Co-Benefits · Red Flags</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {[
              { label: 'Total Credits', val: CREDITS.length, col: T.gold },
              { label: 'Flagged', val: flaggedCredits.length, col: T.red },
              { label: 'Avg Quality', val: Math.round(CREDITS.reduce((a, c) => a + c.quality, 0) / CREDITS.length), col: T.teal },
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
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <div><span style={{ fontSize: 10, color: T.textMut }}>Min Quality: </span>
            <input type="range" min={0} max={90} value={minQuality} onChange={e => setMinQuality(Number(e.target.value))} style={{ width: 120 }} />
            <span style={{ fontFamily: T.mono, fontSize: 12, marginLeft: 4 }}>{minQuality}</span></div>
          <select value={methodFilter} onChange={e => setMethodFilter(e.target.value)} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
            {methods.map(m => <option key={m}>{m}</option>)}
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
            <option value="quality">Sort by Quality</option><option value="leakage">Sort by Leakage</option><option value="name">Sort by Name</option>
          </select>
          <button onClick={() => alert('Export CSV')} style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${T.navy}`, background: 'transparent', color: T.navy, cursor: 'pointer', fontSize: 11 }}>Export CSV</button>
          <button onClick={() => alert('Export PDF')} style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${T.navy}`, background: 'transparent', color: T.navy, cursor: 'pointer', fontSize: 11 }}>Export PDF</button>
        </div>

        {tab === 0 && (<div>
          <div style={card}>
            <div style={lbl}>Credit Quality Ranking (Top 30 Filtered)</div>
            <div style={{ maxHeight: 500, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead><tr style={{ borderBottom: `2px solid ${T.border}`, position: 'sticky', top: 0, background: T.surface }}>
                  {['Credit','Method','Region','Vintage','Quality','Leakage','SDGs','Flags'].map(h => <th key={h} style={{ textAlign: 'left', padding: '8px 4px', color: T.textMut, fontSize: 10 }}>{h}</th>)}
                </tr></thead>
                <tbody>{filtered.map(c => (
                  <tr key={c.id} onClick={() => setSelCredit(c)} style={{ borderBottom: `1px solid ${T.border}`, cursor: 'pointer', background: selCredit.id === c.id ? T.gold + '11' : 'transparent' }}>
                    <td style={{ padding: '4px', fontWeight: 600, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</td>
                    <td style={{ padding: 4 }}>{c.method}</td><td style={{ padding: 4 }}>{c.region}</td>
                    <td style={{ padding: 4, fontFamily: T.mono }}>{c.vintage}</td>
                    <td style={{ padding: 4, fontFamily: T.mono, fontWeight: 700, color: c.quality >= 70 ? T.green : c.quality >= 50 ? T.amber : T.red }}>{c.quality}</td>
                    <td style={{ padding: 4, fontFamily: T.mono, color: c.leakage > 25 ? T.red : T.green }}>{c.leakage}%</td>
                    <td style={{ padding: 4, fontFamily: T.mono }}>{c.sdgCount}</td>
                    <td style={{ padding: 4 }}>{c.flags.length > 0 ? <span style={{ color: T.red, fontSize: 10 }}>{c.flags.length} flags</span> : <span style={{ color: T.green, fontSize: 10 }}>Clear</span>}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
          <div style={card}>
            <div style={lbl}>Quality Distribution by Methodology</div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={methodDist}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="method" tick={{ fontSize: 9 }} /><YAxis tick={{ fontSize: 10 }} />
                <Tooltip /><Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="avgQ" name="Avg Quality" fill={T.navy} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>)}

        {tab === 1 && (<div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={card}>
              <div style={lbl}>ICVCM CCP Radar — {selCredit.name}</div>
              <div style={{ fontSize: 14, fontWeight: 700, fontFamily: T.mono, color: selCredit.ccpTotal >= 35 ? T.green : selCredit.ccpTotal >= 25 ? T.amber : T.red, marginBottom: 8 }}>{selCredit.ccpTotal}/50</div>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={ccpRadar}>
                  <PolarGrid stroke={T.border} /><PolarAngleAxis dataKey="principle" tick={{ fontSize: 9 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fontSize: 8 }} />
                  <Radar dataKey="score" stroke={T.navy} fill={T.navy} fillOpacity={0.2} />
                  <Radar dataKey="max" stroke={T.gold} fill="none" strokeDasharray="4 4" /><Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <div style={lbl}>CCP Total Score Distribution</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={[{range:'0-15',count:CREDITS.filter(c=>c.ccpTotal<15).length},{range:'15-25',count:CREDITS.filter(c=>c.ccpTotal>=15&&c.ccpTotal<25).length},{range:'25-35',count:CREDITS.filter(c=>c.ccpTotal>=25&&c.ccpTotal<35).length},{range:'35-50',count:CREDITS.filter(c=>c.ccpTotal>=35).length}]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="range" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip />
                  <Bar dataKey="count" fill={T.navy} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>)}

        {tab === 2 && (<div>
          <div style={card}>
            <div style={lbl}>Additionality Score by Credit (CCP Principle 1)</div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={CREDITS.slice(0, 25).sort((a, b) => b.ccp[0] - a.ccp[0])}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 8 }} angle={-30} textAnchor="end" height={70} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} /><Tooltip />
                <Bar dataKey={d => d.ccp[0]} name="Additionality" radius={[4, 4, 0, 0]}>
                  {CREDITS.slice(0, 25).map((c, i) => <Cell key={i} fill={c.ccp[0] >= 7 ? T.green : c.ccp[0] >= 4 ? T.amber : T.red} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>)}

        {tab === 3 && (<div>
          <div style={card}>
            <div style={lbl}>Leakage Risk — Sorted by Risk Level</div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={CREDITS.slice(0, 25).sort((a, b) => b.leakage - a.leakage)}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 8 }} angle={-30} textAnchor="end" height={70} />
                <YAxis domain={[0, 50]} tick={{ fontSize: 10 }} /><Tooltip />
                <Bar dataKey="leakage" name="Leakage %" radius={[4, 4, 0, 0]}>
                  {CREDITS.slice(0, 25).map((c, i) => <Cell key={i} fill={c.leakage > 25 ? T.red : c.leakage > 15 ? T.amber : T.green} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>)}

        {tab === 4 && (<div>
          <div style={card}>
            <div style={lbl}>SDG Co-Benefit Count by Credit</div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={CREDITS.slice(0, 25).sort((a, b) => b.sdgCount - a.sdgCount)}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 8 }} angle={-30} textAnchor="end" height={70} />
                <YAxis domain={[0, 8]} tick={{ fontSize: 10 }} /><Tooltip />
                <Bar dataKey="sdgCount" name="SDG Count" fill={T.teal} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <div style={lbl}>Quality vs Co-Benefits Scatter</div>
            <ResponsiveContainer width="100%" height={250}>
              <ScatterChart><CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="x" name="SDGs" tick={{ fontSize: 10 }} /><YAxis dataKey="y" name="Quality" tick={{ fontSize: 10 }} /><Tooltip />
                <Scatter data={CREDITS.slice(0, 50).map(c => ({ x: c.sdgCount, y: c.quality, name: c.name }))} fill={T.sage} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>)}

        {tab === 5 && (<div>
          <div style={card}>
            <div style={lbl}>Red Flag Detector — Credits with Concerns</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead><tr style={{ borderBottom: `2px solid ${T.border}` }}>
                {['Credit','Method','Quality','Flags'].map(h => <th key={h} style={{ textAlign: 'left', padding: '8px 6px', color: T.textMut }}>{h}</th>)}
              </tr></thead>
              <tbody>{flaggedCredits.slice(0, 20).map(c => (
                <tr key={c.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: 6, fontWeight: 600 }}>{c.name}</td>
                  <td style={{ padding: 6 }}>{c.method}</td>
                  <td style={{ padding: 6, fontFamily: T.mono, color: c.quality >= 50 ? T.amber : T.red }}>{c.quality}</td>
                  <td style={{ padding: 6 }}>{c.flags.map(f => <span key={f} style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 10, fontSize: 9, background: T.red + '18', color: T.red, marginRight: 4, marginBottom: 2 }}>{f}</span>)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div style={{ ...card, background: T.navy + '08', border: `1px solid ${T.gold}33` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.navy, marginBottom: 4 }}>Red Flag Methodology</div>
            <div style={{ fontSize: 11, color: T.textSec, lineHeight: 1.6 }}>Flags triggered when: Additionality &lt;5/10, Permanence &lt;4/10, Leakage &gt;30%, Vintage &lt;2020. Based on ICVCM Core Carbon Principles assessment framework. Credits with 2+ flags require enhanced due diligence before procurement.</div>
          </div>
        </div>)}
      </div>
    </div>
  );
}
