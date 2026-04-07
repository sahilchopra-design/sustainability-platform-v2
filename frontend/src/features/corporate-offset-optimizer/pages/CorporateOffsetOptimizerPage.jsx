import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, ZAxis, ReferenceLine, PieChart, Pie
} from 'recharts';

const T = {
  bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c',
  navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae',
  red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb',
  orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a',
  card:'#ffffff',sub:'#5c6b7e',indigo:'#4f46e5',font:"'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"
};

const CREDITS = [
  { name:'REDD+ Verra', quality:65, cost:12, corsia:true, euEts:false, voluntary:true },
  { name:'ARR Gold Std', quality:78, cost:18, corsia:true, euEts:false, voluntary:true },
  { name:'Cookstove GS', quality:72, cost:9, corsia:true, euEts:false, voluntary:true },
  { name:'Solar CDM', quality:40, cost:3, corsia:false, euEts:false, voluntary:true },
  { name:'Wind CDM', quality:38, cost:2.5, corsia:false, euEts:false, voluntary:true },
  { name:'DAC Puro', quality:95, cost:450, corsia:true, euEts:true, voluntary:true },
  { name:'Biochar', quality:88, cost:85, corsia:true, euEts:false, voluntary:true },
  { name:'CCS Industrial', quality:92, cost:120, corsia:true, euEts:true, voluntary:true },
  { name:'Mangrove', quality:80, cost:25, corsia:true, euEts:false, voluntary:true },
  { name:'Soil Carbon', quality:55, cost:18, corsia:false, euEts:false, voluntary:true },
  { name:'Landfill Gas', quality:50, cost:5, corsia:true, euEts:false, voluntary:true },
  { name:'Mineralization', quality:96, cost:95, corsia:true, euEts:true, voluntary:true },
];

const YEARS = [2025, 2026, 2027, 2028, 2029, 2030];

const TABS = ['Procurement Dashboard','Quality-Cost Frontier','Vintage Management','Regulatory Acceptance Matrix','Blend Optimizer','Multi-Year Strategy'];
const card = { background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20, marginBottom: 16 };
const lbl = { fontSize: 10, color: T.textMut, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 };

export default function CorporateOffsetOptimizerPage() {
  const [tab, setTab] = useState(0);
  const [budget, setBudget] = useState(5);
  const [minQuality, setMinQuality] = useState(50);
  const [jurisdiction, setJurisdiction] = useState('voluntary');
  const [watchlist, setWatchlist] = useState([]);

  const eligible = useMemo(() => {
    let d = CREDITS.filter(c => c.quality >= minQuality);
    if (jurisdiction === 'corsia') d = d.filter(c => c.corsia);
    if (jurisdiction === 'euEts') d = d.filter(c => c.euEts);
    return d.sort((a, b) => (b.quality / b.cost) - (a.quality / a.cost));
  }, [minQuality, jurisdiction]);

  const blendResult = useMemo(() => {
    const budgetM = budget * 1000000;
    const blend = [];
    let remaining = budgetM;
    for (const c of eligible) {
      const tonnes = Math.min(remaining / c.cost, 50000);
      if (tonnes > 100) {
        blend.push({ ...c, tonnes: Math.round(tonnes), spend: Math.round(tonnes * c.cost) });
        remaining -= tonnes * c.cost;
      }
      if (remaining < 100) break;
    }
    return blend;
  }, [budget, eligible]);

  const totalTonnes = blendResult.reduce((a, b) => a + b.tonnes, 0);
  const avgQuality = blendResult.length ? Math.round(blendResult.reduce((a, b) => a + b.quality * b.tonnes, 0) / Math.max(1, totalTonnes)) : 0;

  const multiYear = YEARS.map((y, i) => ({
    year: y, target: 50000 + i * 10000, price: Math.round(15 * Math.pow(1.08, i)),
    cost: Math.round((50000 + i * 10000) * 15 * Math.pow(1.08, i) / 1000000 * 10) / 10
  }));

  const frontierData = CREDITS.map(c => ({ x: c.cost, y: c.quality, name: c.name, z: 80 }));

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh' }}>
      <div style={{ background: T.navy, padding: '24px 32px 0', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ color: T.gold, fontFamily: T.mono, fontSize: 11, letterSpacing: 2, marginBottom: 4 }}>EP-CN3 · CORPORATE OFFSET OPTIMIZER</div>
            <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: 0 }}>Corporate Offset Procurement Strategy Optimizer</h1>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>12 Credit Types · Quality-Cost Frontier · Blend Optimization · Regulatory Acceptance · Multi-Year</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {[
              { label: 'Budget', val: `$${budget}M`, col: T.gold },
              { label: 'Opt Tonnes', val: totalTonnes.toLocaleString(), col: T.teal },
              { label: 'Avg Quality', val: avgQuality, col: avgQuality >= 70 ? T.green : T.amber },
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
        <div style={{ display: 'flex', gap: 16, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <div><span style={{ fontSize: 10, color: T.textMut }}>Budget ($M): </span>
            <input type="range" min={1} max={50} value={budget} onChange={e => setBudget(Number(e.target.value))} style={{ width: 140 }} />
            <span style={{ fontFamily: T.mono, fontSize: 12, marginLeft: 6 }}>${budget}M</span></div>
          <div><span style={{ fontSize: 10, color: T.textMut }}>Min Quality: </span>
            <input type="range" min={0} max={90} value={minQuality} onChange={e => setMinQuality(Number(e.target.value))} style={{ width: 140 }} />
            <span style={{ fontFamily: T.mono, fontSize: 12, marginLeft: 6 }}>{minQuality}</span></div>
          <select value={jurisdiction} onChange={e => setJurisdiction(e.target.value)} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
            <option value="voluntary">Voluntary</option><option value="corsia">CORSIA</option><option value="euEts">EU ETS</option>
          </select>
          <button onClick={() => alert('Export PDF')} style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${T.navy}`, background: 'transparent', color: T.navy, cursor: 'pointer', fontSize: 11 }}>Export PDF</button>
          <button onClick={() => alert('Export CSV')} style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${T.navy}`, background: 'transparent', color: T.navy, cursor: 'pointer', fontSize: 11 }}>Export CSV</button>
        </div>

        {tab === 0 && (<div>
          <div style={card}>
            <div style={lbl}>Eligible Credits — Quality vs Cost (Ranked by Efficiency)</div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={eligible}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-25} textAnchor="end" height={60} />
                <YAxis yAxisId="l" domain={[0, 100]} tick={{ fontSize: 10 }} /><YAxis yAxisId="r" orientation="right" tick={{ fontSize: 10 }} />
                <Tooltip /><Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar yAxisId="l" dataKey="quality" name="Quality Score" fill={T.green} />
                <Bar yAxisId="r" dataKey="cost" name="Cost ($/tCO2)" fill={T.red} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <div style={lbl}>Optimized Blend Allocation (Budget: ${budget}M)</div>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={blendResult} dataKey="tonnes" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, tonnes }) => `${name}: ${(tonnes / 1000).toFixed(0)}k`}>
                  {blendResult.map((_, i) => <Cell key={i} fill={[T.green, T.blue, T.teal, T.amber, T.purple, T.orange, T.red, T.navy, T.sage][i % 9]} />)}
                </Pie>
                <Tooltip /><Legend wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>)}

        {tab === 1 && (<div>
          <div style={card}>
            <div style={lbl}>Efficient Frontier — Quality vs Cost per tCO2</div>
            <ResponsiveContainer width="100%" height={350}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="x" name="Cost ($/tCO2)" tick={{ fontSize: 10 }} label={{ value: 'Cost ($/tCO2)', position: 'bottom', fontSize: 10 }} />
                <YAxis dataKey="y" name="Quality" domain={[0, 100]} tick={{ fontSize: 10 }} label={{ value: 'Quality Score', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                <ZAxis dataKey="z" range={[60, 200]} /><Tooltip />
                <ReferenceLine y={minQuality} stroke={T.amber} strokeDasharray="4 4" label={{ value: `Min Q: ${minQuality}`, fontSize: 10 }} />
                <Scatter data={frontierData} fill={T.navy} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>)}

        {tab === 2 && (<div>
          <div style={card}>
            <div style={lbl}>Vintage Management — Price Trajectory by Year</div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={[2020, 2021, 2022, 2023, 2024].map(v => ({ vintage: v, premium: (v - 2020) * 5, discount: Math.max(0, (2024 - v) * 8) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="vintage" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} />
                <Tooltip /><Legend wrapperStyle={{ fontSize: 10 }} />
                <Line type="monotone" dataKey="premium" stroke={T.green} strokeWidth={2} name="Freshness Premium %" />
                <Line type="monotone" dataKey="discount" stroke={T.red} strokeWidth={2} name="Age Discount %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ ...card, background: T.navy + '08', border: `1px solid ${T.gold}33` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.navy, marginBottom: 4 }}>Vintage Strategy</div>
            <div style={{ fontSize: 11, color: T.textSec, lineHeight: 1.6 }}>Newer vintages command premiums due to higher integrity standards. Older vintages may offer value if additionality is verified. Strategy: buy forward for guaranteed supply, spot for flexibility. CORSIA requires vintages no older than 2016.</div>
          </div>
        </div>)}

        {tab === 3 && (<div>
          <div style={card}>
            <div style={lbl}>Regulatory Acceptance Matrix</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead><tr style={{ borderBottom: `2px solid ${T.border}` }}>
                {['Credit Type','CORSIA','EU ETS','Voluntary','Quality'].map(h => <th key={h} style={{ textAlign: 'left', padding: '8px 6px', color: T.textMut }}>{h}</th>)}
              </tr></thead>
              <tbody>{CREDITS.map(c => (
                <tr key={c.name} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: 6, fontWeight: 600 }}>{c.name}</td>
                  {[c.corsia, c.euEts, c.voluntary].map((v, i) => (
                    <td key={i} style={{ padding: 6 }}><span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, background: v ? T.green + '22' : T.red + '22', color: v ? T.green : T.red }}>{v ? 'Yes' : 'No'}</span></td>
                  ))}
                  <td style={{ padding: 6, fontFamily: T.mono, fontWeight: 700, color: c.quality >= 80 ? T.green : c.quality >= 60 ? T.amber : T.red }}>{c.quality}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>)}

        {tab === 4 && (<div>
          <div style={card}>
            <div style={lbl}>Optimized Blend — {blendResult.length} Credits Selected</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead><tr style={{ borderBottom: `2px solid ${T.border}` }}>
                {['Credit','Quality','$/tCO2','Tonnes','Spend'].map(h => <th key={h} style={{ textAlign: 'left', padding: '8px 6px', color: T.textMut }}>{h}</th>)}
              </tr></thead>
              <tbody>{blendResult.map(b => (
                <tr key={b.name} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: 6, fontWeight: 600 }}>{b.name}</td>
                  <td style={{ padding: 6, fontFamily: T.mono }}>{b.quality}</td>
                  <td style={{ padding: 6, fontFamily: T.mono }}>${b.cost}</td>
                  <td style={{ padding: 6, fontFamily: T.mono }}>{b.tonnes.toLocaleString()}</td>
                  <td style={{ padding: 6, fontFamily: T.mono }}>${(b.spend / 1000000).toFixed(2)}M</td>
                </tr>
              ))}</tbody>
              <tfoot><tr style={{ borderTop: `2px solid ${T.border}`, fontWeight: 700 }}>
                <td style={{ padding: 6 }}>TOTAL</td><td style={{ padding: 6, fontFamily: T.mono }}>{avgQuality} avg</td><td></td>
                <td style={{ padding: 6, fontFamily: T.mono }}>{totalTonnes.toLocaleString()}</td>
                <td style={{ padding: 6, fontFamily: T.mono }}>${(blendResult.reduce((a, b) => a + b.spend, 0) / 1000000).toFixed(2)}M</td>
              </tr></tfoot>
            </table>
          </div>
          <div style={card}>
            <div style={lbl}>Blend Quality vs Cost Distribution</div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={blendResult}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 10 }} /><Tooltip /><Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="quality" name="Quality" fill={T.green} /><Bar dataKey="cost" name="$/tCO2" fill={T.red} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>)}

        {tab === 5 && (<div>
          <div style={card}>
            <div style={lbl}>Multi-Year Procurement Strategy (2025-2030)</div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={multiYear}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="l" tick={{ fontSize: 10 }} /><YAxis yAxisId="r" orientation="right" tick={{ fontSize: 10 }} />
                <Tooltip /><Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar yAxisId="l" dataKey="target" name="Target tCO2" fill={T.blue} />
                <Bar yAxisId="r" dataKey="cost" name="Est. Cost ($M)" fill={T.red} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <div style={lbl}>Price Trajectory — Average $/tCO2</div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={multiYear}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} />
                <Tooltip /><Line type="monotone" dataKey="price" stroke={T.amber} strokeWidth={2} dot={{ r: 4 }} name="Avg $/tCO2" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>)}
      </div>
    </div>
  );
}
