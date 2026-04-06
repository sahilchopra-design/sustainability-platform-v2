import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell
} from 'recharts';

const T = {
  bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c',
  navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae',
  red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb',
  orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a',
  font:"'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"
};

const HOLDINGS = [
  { id:1, name:'Amazon REDD+ Acre', type:'REDD+', vintage:2023, tonnes:15000, costBasis:12, currentPrice:14.5, retired:3000, scheduled:5000 },
  { id:2, name:'Kalimantan REDD+', type:'REDD+', vintage:2022, tonnes:12000, costBasis:10, currentPrice:11.2, retired:4000, scheduled:4000 },
  { id:3, name:'Ethiopian ARR', type:'ARR', vintage:2024, tonnes:8000, costBasis:18, currentPrice:21, retired:0, scheduled:2000 },
  { id:4, name:'Cerrado ARR', type:'ARR', vintage:2023, tonnes:10000, costBasis:15, currentPrice:17.5, retired:2000, scheduled:3000 },
  { id:5, name:'Ghana Cookstove', type:'Cookstove', vintage:2024, tonnes:20000, costBasis:8, currentPrice:9.5, retired:5000, scheduled:8000 },
  { id:6, name:'Nepal Cookstove', type:'Cookstove', vintage:2022, tonnes:10000, costBasis:6, currentPrice:5.8, retired:6000, scheduled:3000 },
  { id:7, name:'Climeworks DAC', type:'DAC', vintage:2024, tonnes:500, costBasis:450, currentPrice:480, retired:100, scheduled:200 },
  { id:8, name:'Oregon Biochar', type:'Biochar', vintage:2024, tonnes:2000, costBasis:85, currentPrice:92, retired:0, scheduled:500 },
  { id:9, name:'Solar Rajasthan', type:'Renewable', vintage:2021, tonnes:25000, costBasis:3, currentPrice:2.2, retired:15000, scheduled:5000 },
  { id:10, name:'Sundarbans Mangrove', type:'Blue Carbon', vintage:2023, tonnes:5000, costBasis:25, currentPrice:28, retired:1000, scheduled:2000 },
  { id:11, name:'Iowa Soil Carbon', type:'Soil', vintage:2023, tonnes:8000, costBasis:18, currentPrice:16, retired:2000, scheduled:3000 },
  { id:12, name:'CarbonCure CCS', type:'CCS', vintage:2024, tonnes:3000, costBasis:120, currentPrice:130, retired:500, scheduled:1000 },
  { id:13, name:'Wind Shandong', type:'Renewable', vintage:2020, tonnes:18000, costBasis:2.5, currentPrice:1.8, retired:12000, scheduled:4000 },
  { id:14, name:'UK Peatland', type:'Peatland', vintage:2024, tonnes:4000, costBasis:22, currentPrice:24, retired:0, scheduled:1500 },
  { id:15, name:'Landfill US', type:'Waste', vintage:2022, tonnes:15000, costBasis:5, currentPrice:4.5, retired:8000, scheduled:4000 },
  { id:16, name:'Boreal IFM', type:'IFM', vintage:2023, tonnes:6000, costBasis:10, currentPrice:11, retired:1500, scheduled:2000 },
  { id:17, name:'Congo REDD+', type:'REDD+', vintage:2024, tonnes:10000, costBasis:14, currentPrice:15.5, retired:0, scheduled:3000 },
  { id:18, name:'India ARR Teak', type:'ARR', vintage:2022, tonnes:7000, costBasis:12, currentPrice:10.5, retired:3000, scheduled:2000 },
  { id:19, name:'Kenya Cookstove', type:'Cookstove', vintage:2023, tonnes:12000, costBasis:7, currentPrice:8.2, retired:4000, scheduled:5000 },
  { id:20, name:'Yucatan Mangrove', type:'Blue Carbon', vintage:2024, tonnes:3000, costBasis:28, currentPrice:32, retired:0, scheduled:1000 },
  { id:21, name:'Hydro Mekong', type:'Renewable', vintage:2022, tonnes:10000, costBasis:4, currentPrice:3.2, retired:5000, scheduled:3000 },
  { id:22, name:'Pacific NW IFM', type:'IFM', vintage:2024, tonnes:5000, costBasis:12, currentPrice:13.5, retired:0, scheduled:2000 },
  { id:23, name:'Carbon Eng DAC', type:'DAC', vintage:2024, tonnes:300, costBasis:500, currentPrice:520, retired:50, scheduled:100 },
  { id:24, name:'Project Vesta', type:'Mineralization', vintage:2024, tonnes:1000, costBasis:95, currentPrice:105, retired:0, scheduled:500 },
  { id:25, name:'Maya REDD+', type:'REDD+', vintage:2021, tonnes:8000, costBasis:8, currentPrice:7.5, retired:5000, scheduled:2000 },
].map(h => ({
  ...h, mtm: h.tonnes * h.currentPrice, costTotal: h.tonnes * h.costBasis,
  pnl: h.tonnes * (h.currentPrice - h.costBasis), unretired: h.tonnes - h.retired
}));

const totalMTM = HOLDINGS.reduce((a, h) => a + h.mtm, 0);
const totalPnL = HOLDINGS.reduce((a, h) => a + h.pnl, 0);
const totalTonnes = HOLDINGS.reduce((a, h) => a + h.tonnes, 0);
const totalRetired = HOLDINGS.reduce((a, h) => a + h.retired, 0);

const TABS = ['Portfolio Dashboard','Holdings by Type','Vintage Distribution','Retirement Schedule','Performance vs. Plan','Compliance Reporting'];
const card = { background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20, marginBottom: 16 };
const lbl = { fontSize: 10, color: T.textMut, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 };

export default function OffsetPortfolioTrackerPage() {
  const [tab, setTab] = useState(0);
  const [sortBy, setSortBy] = useState('mtm');
  const [typeFilter, setTypeFilter] = useState('All');
  const [watchlist, setWatchlist] = useState([]);

  const types = ['All', ...new Set(HOLDINGS.map(h => h.type))];
  const filtered = useMemo(() => {
    let d = typeFilter === 'All' ? [...HOLDINGS] : HOLDINGS.filter(h => h.type === typeFilter);
    d.sort((a, b) => sortBy === 'mtm' ? b.mtm - a.mtm : sortBy === 'pnl' ? b.pnl - a.pnl : a.name.localeCompare(b.name));
    return d;
  }, [typeFilter, sortBy]);

  const typeAgg = [...new Set(HOLDINGS.map(h => h.type))].map(t => {
    const hs = HOLDINGS.filter(h => h.type === t);
    return { type: t, mtm: hs.reduce((a, h) => a + h.mtm, 0), tonnes: hs.reduce((a, h) => a + h.tonnes, 0), count: hs.length };
  }).sort((a, b) => b.mtm - a.mtm);

  const vintageDist = [2020, 2021, 2022, 2023, 2024].map(v => ({
    vintage: v, tonnes: HOLDINGS.filter(h => h.vintage === v).reduce((a, h) => a + h.tonnes, 0)
  }));

  const retireSched = [2024, 2025, 2026, 2027, 2028].map((y, i) => ({
    year: y, planned: Math.round(totalTonnes * (0.12 + i * 0.05)), actual: i === 0 ? totalRetired : null
  }));

  const perfData = [2022, 2023, 2024, 2025, 2026].map((y, i) => ({
    year: y, planned: 30000 + i * 15000, actual: i <= 2 ? 25000 + i * 12000 + Math.round(Math.abs(Math.sin(i*2.3+1))*5000) : null
  }));

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh' }}>
      <div style={{ background: T.navy, padding: '24px 32px 0', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ color: T.gold, fontFamily: T.mono, fontSize: 11, letterSpacing: 2, marginBottom: 4 }}>EP-CN5 · OFFSET PORTFOLIO TRACKER</div>
            <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: 0 }}>Offset Portfolio Management & Tracking</h1>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>25 Positions · Mark-to-Market · Vintage Distribution · Retirement Schedule · Compliance</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {[
              { label: 'Total MTM', val: `$${(totalMTM / 1e6).toFixed(1)}M`, col: T.gold },
              { label: 'P&L', val: `${totalPnL >= 0 ? '+' : ''}$${(totalPnL / 1e6).toFixed(2)}M`, col: totalPnL >= 0 ? T.green : T.red },
              { label: 'Retired', val: `${Math.round(totalRetired / 1000)}k tCO2`, col: T.teal },
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
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
            {types.map(t => <option key={t}>{t}</option>)}
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
            <option value="mtm">Sort by MTM</option><option value="pnl">Sort by P&L</option><option value="name">Sort by Name</option>
          </select>
          <button onClick={() => alert('Export PDF')} style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${T.navy}`, background: 'transparent', color: T.navy, cursor: 'pointer', fontSize: 11 }}>Export PDF</button>
          <button onClick={() => alert('Export CSV')} style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${T.navy}`, background: 'transparent', color: T.navy, cursor: 'pointer', fontSize: 11 }}>Export CSV</button>
        </div>

        {tab === 0 && (<div>
          <div style={card}>
            <div style={lbl}>Holdings — Mark-to-Market</div>
            <div style={{ maxHeight: 500, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
                <thead><tr style={{ borderBottom: `2px solid ${T.border}`, position: 'sticky', top: 0, background: T.surface }}>
                  {['Credit','Type','Vintage','Tonnes','Cost Basis','Spot','MTM','P&L','Retired'].map(h => <th key={h} style={{ textAlign: 'left', padding: '6px 4px', color: T.textMut }}>{h}</th>)}
                </tr></thead>
                <tbody>{filtered.map(h => (
                  <tr key={h.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '4px', fontWeight: 600, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.name}</td>
                    <td style={{ padding: 4 }}>{h.type}</td>
                    <td style={{ padding: 4, fontFamily: T.mono }}>{h.vintage}</td>
                    <td style={{ padding: 4, fontFamily: T.mono }}>{h.tonnes.toLocaleString()}</td>
                    <td style={{ padding: 4, fontFamily: T.mono }}>${h.costBasis}</td>
                    <td style={{ padding: 4, fontFamily: T.mono }}>${h.currentPrice}</td>
                    <td style={{ padding: 4, fontFamily: T.mono, fontWeight: 700 }}>${(h.mtm / 1000).toFixed(0)}k</td>
                    <td style={{ padding: 4, fontFamily: T.mono, color: h.pnl >= 0 ? T.green : T.red }}>{h.pnl >= 0 ? '+' : ''}${(h.pnl / 1000).toFixed(0)}k</td>
                    <td style={{ padding: 4, fontFamily: T.mono }}>{h.retired.toLocaleString()}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
          <div style={card}>
            <div style={lbl}>MTM by Position (Top 15)</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={filtered.slice(0, 15)}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 8 }} angle={-25} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 10 }} /><Tooltip formatter={v => `$${(Number(v) / 1000).toFixed(0)}k`} />
                <Bar dataKey="mtm" name="MTM ($)" fill={T.navy} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>)}

        {tab === 1 && (<div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={card}>
              <div style={lbl}>Holdings by Type — MTM</div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={typeAgg} dataKey="mtm" nameKey="type" cx="50%" cy="50%" outerRadius={100} label={({ type }) => type}>
                    {typeAgg.map((_, i) => <Cell key={i} fill={[T.green, T.blue, T.teal, T.amber, T.purple, T.orange, T.red, T.navy, T.sage, '#8b5cf6'][i % 10]} />)}
                  </Pie>
                  <Tooltip formatter={v => `$${(Number(v) / 1000).toFixed(0)}k`} /><Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <div style={lbl}>Tonnes by Type</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={typeAgg}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="type" tick={{ fontSize: 9 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip />
                  <Bar dataKey="tonnes" name="Tonnes" fill={T.teal} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>)}

        {tab === 2 && (<div>
          <div style={card}>
            <div style={lbl}>Vintage Distribution (tCO2 by Year)</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={vintageDist}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="vintage" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip />
                <Bar dataKey="tonnes" name="Tonnes" fill={T.blue} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <div style={lbl}>Vintage Split</div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={vintageDist} dataKey="tonnes" nameKey="vintage" cx="50%" cy="50%" outerRadius={80} label>
                  {vintageDist.map((_, i) => <Cell key={i} fill={[T.red, T.orange, T.amber, T.teal, T.green][i]} />)}
                </Pie>
                <Tooltip /><Legend wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>)}

        {tab === 3 && (<div>
          <div style={card}>
            <div style={lbl}>Retirement Schedule (Planned vs Actual)</div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={retireSched}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} />
                <Tooltip /><Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="planned" name="Planned Retirements" fill={T.blue} />
                <Bar dataKey="actual" name="Actual Retirements" fill={T.green} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>)}

        {tab === 4 && (<div>
          <div style={card}>
            <div style={lbl}>Portfolio Performance — Planned vs Actual Retirements</div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={perfData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} />
                <Tooltip /><Legend wrapperStyle={{ fontSize: 10 }} />
                <Line type="monotone" dataKey="planned" stroke={T.blue} strokeWidth={2} strokeDasharray="6 3" name="Planned" />
                <Line type="monotone" dataKey="actual" stroke={T.green} strokeWidth={2} name="Actual" connectNulls={false} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>)}

        {tab === 5 && (<div>
          <div style={card}>
            <div style={lbl}>Compliance Reporting Summary</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                { framework: 'SFDR', status: 'Compliant', detail: `Offset dependency: ${Math.round(totalRetired / totalTonnes * 100)}% retired`, color: T.green },
                { framework: 'CSRD ESRS E1', status: 'Partial', detail: 'Offset disclosure prepared, pending audit', color: T.amber },
                { framework: 'SBTi NZ Std', status: 'Review', detail: 'Offsets <10% of near-term target — within SBTi limits', color: T.teal },
              ].map(c => (
                <div key={c.framework} style={{ background: c.color + '08', borderRadius: 8, padding: 16, border: `1px solid ${c.color}33` }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.navy }}>{c.framework}</div>
                  <div style={{ fontSize: 10, color: c.color, fontWeight: 600, marginTop: 4 }}>{c.status}</div>
                  <div style={{ fontSize: 10, color: T.textSec, marginTop: 4 }}>{c.detail}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={card}>
            <div style={lbl}>Offset Dependency Ratio Over Time</div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={[2022, 2023, 2024, 2025, 2026].map((y, i) => ({ year: y, ratio: 15 - i * 2 + Math.round(Math.abs(Math.sin(i*1.7))*2) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} /><YAxis domain={[0, 20]} tick={{ fontSize: 10 }} />
                <Tooltip /><Line type="monotone" dataKey="ratio" stroke={T.amber} strokeWidth={2} name="Offset Dependency %" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ ...card, background: T.navy + '08', border: `1px solid ${T.gold}33` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.navy, marginBottom: 4 }}>Compliance Note</div>
            <div style={{ fontSize: 11, color: T.textSec, lineHeight: 1.6 }}>SBTi Net-Zero Standard limits offset use to residual emissions only (&lt;10% of base year). SFDR Article 9 funds must disclose offset dependency. CSRD ESRS E1-6 requires separate reporting of gross vs net emissions with offset details.</div>
          </div>
        </div>)}
      </div>
    </div>
  );
}
