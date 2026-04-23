import React, { useState, useMemo, useCallback } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, ScatterChart, Scatter, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const T = {
  bg: '#0f172a', surface: '#1e293b', surfaceH: '#263248', border: '#334155', borderL: '#2d3f55',
  navy: '#60a5fa', navyL: '#93c5fd', gold: '#fbbf24', goldL: '#fcd34d',
  sage: '#34d399', sageL: '#6ee7b7', teal: '#2dd4bf', text: '#f1f5f9',
  textSec: '#94a3b8', textMut: '#64748b', red: '#f87171', green: '#4ade80',
  amber: '#fb923c', font: "'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",
  mono: "'JetBrains Mono','SF Mono','Fira Code',monospace"
};

const sr = (s) => Math.abs(Math.sin(s * 9301 + 49297) * 233280) % 1;
const ACCENT = '#34d399';
const COLORS = [T.navy, T.gold, T.sage, T.teal, T.amber, T.red, T.navyL, T.goldL, '#a78bfa', '#f472b6'];
const tip = { contentStyle: { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 11, fontFamily: T.font }, labelStyle: { color: T.textSec, fontSize: 10 } };

const TABS = ['Portfolio Builder', 'Efficient Frontier', 'ITR Analysis', 'Constraint Analysis', 'Rebalancing', 'Engagement', 'Reporting'];
const SECTORS = ['All', 'Technology', 'Financials', 'Healthcare', 'Energy', 'Consumer', 'Industrials', 'Materials', 'Utilities'];
const PAGE = 12;

const NAMES = ['Apple','Microsoft','Alphabet','Amazon','NVIDIA','Meta','Tesla','JPMorgan','Visa','UnitedHealth','J&J','Walmart','P&G','Mastercard','Chevron','Home Depot','Coca-Cola','Pfizer','Abbott','Eli Lilly','PepsiCo','Costco','Broadcom','Cisco','Merck','Accenture','McDonalds','Adobe','Salesforce','AMD','Qualcomm','Intel','Goldman Sachs','Caterpillar','Amgen','Honeywell','Lockheed','Deere','IBM','GE','Medtronic','Shell','BP','TotalEnergies','Nestle','Roche','Novartis','SAP','Siemens','LVMH','Unilever','HSBC','BHP','Rio Tinto','Toyota','Samsung','TSMC','Novo Nordisk','AbbVie','Netflix','Starbucks','Booking','Intuit','Uber','Airbnb','PayPal','ServiceNow','CrowdStrike','Snowflake','Datadog','NextEra','Enel','Iberdrola','Orsted','Duke Energy','Southern Co','Xcel Energy','AES Corp','Dominion','Brookfield'];
const SECS = ['Technology','Technology','Technology','Technology','Technology','Technology','Technology','Financials','Financials','Healthcare','Healthcare','Consumer','Consumer','Financials','Energy','Consumer','Consumer','Healthcare','Healthcare','Healthcare','Consumer','Consumer','Technology','Technology','Healthcare','Technology','Consumer','Technology','Technology','Technology','Technology','Technology','Financials','Industrials','Healthcare','Industrials','Industrials','Industrials','Technology','Industrials','Healthcare','Energy','Energy','Energy','Consumer','Healthcare','Healthcare','Technology','Industrials','Consumer','Consumer','Financials','Materials','Materials','Industrials','Technology','Technology','Healthcare','Healthcare','Technology','Consumer','Consumer','Technology','Technology','Technology','Financials','Technology','Technology','Technology','Technology','Utilities','Utilities','Utilities','Utilities','Utilities','Utilities','Utilities','Utilities','Utilities','Utilities'];

const HOLDINGS = Array.from({ length: 80 }, (_, i) => {
  const wt = +(sr(i * 7) * 3 + 0.2).toFixed(2);
  const itr = +(sr(i * 11) * 3 + 0.8).toFixed(1);
  const ci = Math.round(sr(i * 13) * 300 + 10);
  const ret = +((sr(i * 17) - 0.3) * 20).toFixed(1);
  const vol = +(sr(i * 19) * 15 + 5).toFixed(1);
  return {
    id: i + 1, name: NAMES[i], sector: SECS[i], weightPct: wt, itr,
    carbonIntensity: ci, greenRevPct: Math.round(sr(i * 23) * 50),
    sbti: sr(i * 29) < 0.4 ? 'Approved' : sr(i * 29) < 0.7 ? 'Committed' : 'None',
    expectedReturn: ret, volatility: vol, sharpe: +(ret / Math.max(1, vol)).toFixed(2),
    esgScore: Math.round(sr(i * 31) * 40 + 50),
    trackingError: +(sr(i * 37) * 3 + 0.5).toFixed(1),
    beta: +(sr(i * 41) * 0.5 + 0.7).toFixed(2),
    divYield: +(sr(i * 43) * 4).toFixed(1),
    engagementStatus: sr(i * 53) < 0.3 ? 'Escalated' : sr(i * 53) < 0.6 ? 'Active' : 'Monitoring',
    targetYear: 2030 + Math.round(sr(i * 59) * 20),
    reductionPct: Math.round(sr(i * 61) * 50 + 20),
  };
});

const FRONTIER = Array.from({ length: 20 }, (_, i) => ({
  risk: +(3 + i * 0.8).toFixed(1),
  returnNZ: +(2 + i * 0.55 + sr(i * 7) * 0.5).toFixed(1),
  returnBM: +(1.5 + i * 0.6 + sr(i * 11) * 0.4).toFixed(1),
}));

const PATHWAY_DATA = Array.from({ length: 11 }, (_, i) => ({
  year: `${2020 + i * 2}`,
  'Portfolio ITR': +(2.8 - i * 0.12 + sr(i * 7) * 0.06).toFixed(2),
  '1.5°C Target': 1.5,
  '2°C Target': 2.0,
  'Sector Avg': +(3.1 - i * 0.08 + sr(i * 11) * 0.05).toFixed(2),
}));

const ENGAGEMENT_DATA = Array.from({ length: 12 }, (_, i) => ({
  month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
  meetings: Math.round(sr(i * 7) * 8 + 4),
  milestones: Math.round(sr(i * 11) * 3 + 1),
  escalations: Math.round(sr(i * 13) * 2),
}));

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 18px', flex: 1, minWidth: 130 }}>
    <div style={{ fontSize: 10, color: T.textMut, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.navy, marginTop: 4 }}>{value}</div>
    {sub && <div style={{ fontSize: 10, color: T.textSec, marginTop: 2 }}>{sub}</div>}
  </div>
);

const cS = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 };

export default function NetZeroPortfolioBuilderPage() {
  const [tab, setTab] = useState('Portfolio Builder');
  const [search, setSearch] = useState('');
  const [sectorF, setSectorF] = useState('All');
  const [sortCol, setSortCol] = useState('weightPct');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [maxCarbon, setMaxCarbon] = useState(150);
  const [minGreen, setMinGreen] = useState(10);
  const [maxITR, setMaxITR] = useState(2.0);

  const filtered = useMemo(() => {
    let d = [...HOLDINGS];
    if (search) d = d.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));
    if (sectorF !== 'All') d = d.filter(r => r.sector === sectorF);
    d.sort((a, b) => sortDir === 'asc' ? (a[sortCol] > b[sortCol] ? 1 : -1) : (a[sortCol] < b[sortCol] ? 1 : -1));
    return d;
  }, [search, sectorF, sortCol, sortDir]);

  const constrained = useMemo(() =>
    filtered.filter(h => h.carbonIntensity <= maxCarbon && h.greenRevPct >= minGreen && h.itr <= maxITR),
    [filtered, maxCarbon, minGreen, maxITR]);

  const paged = useMemo(() => constrained.slice((page - 1) * PAGE, page * PAGE), [constrained, page]);
  const totalPages = Math.ceil(constrained.length / PAGE);

  const doSort = col => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
    setPage(1);
  };

  const stats = useMemo(() => {
    const d = constrained;
    const n = Math.max(1, d.length);
    const totalWt = Math.max(0.01, d.reduce((s, r) => s + r.weightPct, 0));
    return {
      count: d.length,
      avgITR: (d.reduce((s, r) => s + r.itr, 0) / n).toFixed(1),
      avgCI: Math.round(d.reduce((s, r) => s + r.carbonIntensity, 0) / n),
      avgGreen: Math.round(d.reduce((s, r) => s + r.greenRevPct, 0) / n),
      avgRet: (d.reduce((s, r) => s + r.expectedReturn, 0) / n).toFixed(1),
      avgVol: (d.reduce((s, r) => s + r.volatility, 0) / n).toFixed(1),
      sbtiApproved: d.filter(r => r.sbti === 'Approved').length,
      sbtiCommitted: d.filter(r => r.sbti === 'Committed').length,
      weightedITR: (d.reduce((s, r) => s + r.itr * r.weightPct, 0) / totalWt).toFixed(2),
    };
  }, [constrained]);

  const sectorAlloc = useMemo(() => {
    const m = {};
    constrained.forEach(h => { m[h.sector] = (m[h.sector] || 0) + h.weightPct; });
    return Object.entries(m).map(([k, v]) => ({ sector: k, weight: +v.toFixed(1) })).sort((a, b) => b.weight - a.weight);
  }, [constrained]);

  const exportCSV = useCallback((data, fn) => {
    if (!data.length) return;
    const keys = Object.keys(data[0]);
    const csv = [keys.join(','), ...data.map(r => keys.map(k => `"${r[k]}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = fn; a.click();
    URL.revokeObjectURL(url);
  }, []);

  const si = (col, cur, dir) => cur === col ? (dir === 'asc' ? ' ▲' : ' ▼') : ' ○';

  const tabBtn = t => ({
    padding: '7px 14px', border: `1px solid ${tab === t ? ACCENT : T.border}`,
    borderRadius: 6, fontSize: 12, fontFamily: T.font, cursor: 'pointer',
    background: tab === t ? ACCENT : T.surface, color: tab === t ? '#0f172a' : T.textSec, fontWeight: tab === t ? 600 : 400,
  });
  const thS = { padding: '8px 10px', fontSize: 11, fontFamily: T.mono, color: T.textSec, cursor: 'pointer', borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap', userSelect: 'none', textAlign: 'left', background: T.surfaceH };
  const tdS = { padding: '7px 10px', fontSize: 12, fontFamily: T.font, borderBottom: `1px solid ${T.border}`, color: T.text };
  const inpS = { padding: '6px 12px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12, fontFamily: T.font, background: T.surface, color: T.text, outline: 'none', width: 180 };
  const selS = { padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 11, fontFamily: T.font, background: T.surface, color: T.text };
  const sliderS = { width: '100%', accentColor: ACCENT };
  const pgB = { padding: '4px 10px', border: `1px solid ${T.border}`, borderRadius: 4, fontSize: 11, cursor: 'pointer', background: T.surface, color: T.text };

  const Panel = ({ item, onClose }) => {
    if (!item) return null;
    return (
      <div style={{ position: 'fixed', top: 0, right: 0, width: 440, height: '100vh', background: T.surface, borderLeft: `2px solid ${ACCENT}`, zIndex: 1000, overflowY: 'auto', boxShadow: '-4px 0 24px rgba(0,0,0,0.3)' }}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{item.name}</div><div style={{ fontSize: 12, color: T.textSec }}>{item.sector}</div></div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: T.textMut }}>✕</button>
        </div>
        <div style={{ padding: '16px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[['Weight', item.weightPct + '%'], ['ITR', item.itr + '°C'], ['Carbon', item.carbonIntensity], ['Green Rev', item.greenRevPct + '%'], ['SBTi', item.sbti], ['E[Return]', item.expectedReturn + '%'], ['Volatility', item.volatility + '%'], ['Sharpe', item.sharpe], ['ESG', item.esgScore + '/100'], ['TE', item.trackingError + '%'], ['Beta', item.beta], ['Div Yield', item.divYield + '%'], ['Engagement', item.engagementStatus], ['Target Yr', item.targetYear], ['Reduction', item.reductionPct + '%']].map(([k, v], j) => (
              <div key={j} style={{ background: T.surfaceH, borderRadius: 6, padding: '8px 10px' }}>
                <div style={{ fontSize: 9, color: T.textMut, fontFamily: T.mono }}>{k}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginTop: 2 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: '24px 32px', fontFamily: T.font, background: T.bg, minHeight: '100vh' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text, margin: 0 }}>Net Zero Portfolio Builder</h1>
        <p style={{ fontSize: 12, color: T.textSec, margin: '4px 0 0' }}>80 holdings · ITR constraint optimization · Efficient frontier · Engagement tracker</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map(t => <button key={t} onClick={() => setTab(t)} style={tabBtn(t)}>{t}</button>)}
      </div>

      {tab === 'Portfolio Builder' && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <KpiCard label="Holdings" value={stats.count} />
            <KpiCard label="Weighted ITR" value={`${stats.weightedITR}°C`} color={+stats.weightedITR < 1.5 ? T.green : +stats.weightedITR < 2 ? T.sage : T.amber} />
            <KpiCard label="Avg Carbon Intensity" value={stats.avgCI} color={T.amber} sub="tCO₂e/$M revenue" />
            <KpiCard label="Avg Green Revenue" value={`${stats.avgGreen}%`} color={T.sage} />
            <KpiCard label="E[Return]" value={`${stats.avgRet}%`} />
            <KpiCard label="SBTi Approved" value={stats.sbtiApproved} color={T.green} />
          </div>
          <div style={{ ...cS, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>Portfolio Constraints</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>Max Carbon Intensity: <strong style={{ color: T.text }}>{maxCarbon}</strong></div>
                <input type="range" min={50} max={500} value={maxCarbon} onChange={e => { setMaxCarbon(+e.target.value); setPage(1); }} style={sliderS} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>Min Green Revenue: <strong style={{ color: T.text }}>{minGreen}%</strong></div>
                <input type="range" min={0} max={50} value={minGreen} onChange={e => { setMinGreen(+e.target.value); setPage(1); }} style={sliderS} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>Max ITR: <strong style={{ color: T.text }}>{maxITR}°C</strong></div>
                <input type="range" min={10} max={40} value={Math.round(maxITR * 10)} onChange={e => { setMaxITR(+(e.target.value / 10).toFixed(1)); setPage(1); }} style={sliderS} />
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search holdings..." style={inpS} />
            <select value={sectorF} onChange={e => { setSectorF(e.target.value); setPage(1); }} style={selS}>
              {SECTORS.map(s => <option key={s}>{s}</option>)}
            </select>
            <button onClick={() => exportCSV(constrained, 'nz_portfolio.csv')} style={{ padding: '6px 16px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12, background: T.surface, color: T.text, cursor: 'pointer' }}>Export CSV</button>
          </div>
          <div style={{ overflowX: 'auto', ...cS, padding: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>{[['name', 'Holding'], ['sector', 'Sector'], ['weightPct', 'Wt%'], ['itr', 'ITR'], ['carbonIntensity', 'Carbon'], ['greenRevPct', 'Green%'], ['expectedReturn', 'E[R]%'], ['esgScore', 'ESG'], ['sbti', 'SBTi']].map(([k, l]) => (
                  <th key={k} onClick={() => doSort(k)} style={thS}>{l}{si(k, sortCol, sortDir)}</th>
                ))}</tr>
              </thead>
              <tbody>
                {paged.map(r => (
                  <tr key={r.id} onClick={() => setSelected(r)} style={{ cursor: 'pointer', background: selected?.id === r.id ? T.surfaceH : 'transparent' }}>
                    <td style={{ ...tdS, fontWeight: 600 }}>{r.name}</td>
                    <td style={tdS}>{r.sector}</td>
                    <td style={{ ...tdS, fontFamily: T.mono }}>{r.weightPct}%</td>
                    <td style={tdS}><span style={{ color: r.itr < 1.5 ? T.green : r.itr < 2 ? T.sage : r.itr < 2.5 ? T.amber : T.red, fontWeight: 600 }}>{r.itr}°C</span></td>
                    <td style={{ ...tdS, fontFamily: T.mono }}>{r.carbonIntensity}</td>
                    <td style={{ ...tdS, fontFamily: T.mono }}>{r.greenRevPct}%</td>
                    <td style={{ ...tdS, fontFamily: T.mono, color: r.expectedReturn > 0 ? T.green : T.red }}>{r.expectedReturn}%</td>
                    <td style={tdS}>{r.esgScore}</td>
                    <td style={tdS}><span style={{ color: r.sbti === 'Approved' ? T.green : r.sbti === 'Committed' ? T.amber : T.textMut, fontSize: 11 }}>{r.sbti}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: 6, marginTop: 12, alignItems: 'center', justifyContent: 'center' }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={pgB}>«</button>
              <span style={{ fontSize: 11, color: T.textSec, fontFamily: T.mono }}>Page {page}/{totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={pgB}>»</button>
            </div>
          )}
        </div>
      )}

      {tab === 'Efficient Frontier' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Efficient Frontier: Net Zero vs Benchmark</div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={FRONTIER}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="risk" tick={{ fontSize: 9, fill: T.textSec }} label={{ value: 'Risk (%)', position: 'bottom', fontSize: 10, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 9, fill: T.textSec }} label={{ value: 'Return (%)', angle: -90, position: 'left', fontSize: 10, fill: T.textSec }} />
                  <Tooltip {...tip} />
                  <Legend />
                  <Line type="monotone" dataKey="returnNZ" stroke={ACCENT} strokeWidth={2} name="Net Zero" dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="returnBM" stroke={T.textMut} strokeWidth={2} name="Benchmark" dot={{ r: 3 }} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Sector Allocation</div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={sectorAlloc} cx="50%" cy="50%" outerRadius={100} dataKey="weight" nameKey="sector">
                    {sectorAlloc.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip {...tip} />
                  <Legend formatter={v => <span style={{ fontSize: 10, color: T.textSec }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ ...cS, gridColumn: '1/3' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Return vs Carbon Intensity</div>
              <ResponsiveContainer width="100%" height={260}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="x" name="Carbon" tick={{ fontSize: 9, fill: T.textSec }} label={{ value: 'Carbon Intensity', position: 'bottom', fontSize: 9, fill: T.textSec }} />
                  <YAxis dataKey="y" name="E[R]" tick={{ fontSize: 9, fill: T.textSec }} />
                  <Tooltip {...tip} />
                  <Scatter data={constrained.map(h => ({ name: h.name, x: h.carbonIntensity, y: h.expectedReturn }))} fill={ACCENT} fillOpacity={0.5} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 'ITR Analysis' && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <KpiCard label="Weighted ITR" value={`${stats.weightedITR}°C`} color={+stats.weightedITR < 1.5 ? T.green : +stats.weightedITR < 2 ? T.sage : T.amber} />
            <KpiCard label="Aligned ≤1.5°C" value={constrained.filter(h => h.itr <= 1.5).length} color={T.green} sub="holdings" />
            <KpiCard label="Aligned ≤2.0°C" value={constrained.filter(h => h.itr <= 2.0).length} color={T.sage} sub="holdings" />
            <KpiCard label="High Risk >3°C" value={constrained.filter(h => h.itr > 3.0).length} color={T.red} sub="holdings" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Portfolio ITR Pathway vs Targets</div>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={PATHWAY_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 9, fill: T.textSec }} />
                  <YAxis domain={[1, 4]} tick={{ fontSize: 9, fill: T.textSec }} />
                  <Tooltip {...tip} />
                  <Legend />
                  <Line type="monotone" dataKey="Portfolio ITR" stroke={T.navy} strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="1.5°C Target" stroke={T.green} strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                  <Line type="monotone" dataKey="2°C Target" stroke={T.amber} strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                  <Line type="monotone" dataKey="Sector Avg" stroke={T.red} strokeWidth={1} strokeDasharray="2 4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>ITR Distribution</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={[
                  { r: '≤1.5°C', c: constrained.filter(h => h.itr <= 1.5).length },
                  { r: '1.5–2.0', c: constrained.filter(h => h.itr > 1.5 && h.itr <= 2).length },
                  { r: '2.0–2.5', c: constrained.filter(h => h.itr > 2 && h.itr <= 2.5).length },
                  { r: '2.5–3.0', c: constrained.filter(h => h.itr > 2.5 && h.itr <= 3).length },
                  { r: '>3.0', c: constrained.filter(h => h.itr > 3).length },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="r" tick={{ fontSize: 9, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 9, fill: T.textSec }} />
                  <Tooltip {...tip} />
                  <Bar dataKey="c" radius={[4, 4, 0, 0]}>
                    {[T.green, T.sage, T.amber, T.gold, T.red].map((c, i) => <Cell key={i} fill={c} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 'Constraint Analysis' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>SBTi Status</div>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={[
                    { n: 'Approved', v: constrained.filter(h => h.sbti === 'Approved').length },
                    { n: 'Committed', v: constrained.filter(h => h.sbti === 'Committed').length },
                    { n: 'None', v: constrained.filter(h => h.sbti === 'None').length },
                  ]} cx="50%" cy="50%" outerRadius={90} dataKey="v" nameKey="n" label={({ n, v }) => `${n}: ${v}`}>
                    {[T.green, T.amber, T.red].map((c, i) => <Cell key={i} fill={c} />)}
                  </Pie>
                  <Tooltip {...tip} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Green Revenue Distribution</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={[
                  { r: '0–10%', c: constrained.filter(h => h.greenRevPct < 10).length },
                  { r: '10–25%', c: constrained.filter(h => h.greenRevPct >= 10 && h.greenRevPct < 25).length },
                  { r: '25–50%', c: constrained.filter(h => h.greenRevPct >= 25 && h.greenRevPct < 50).length },
                  { r: '≥50%', c: constrained.filter(h => h.greenRevPct >= 50).length },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="r" tick={{ fontSize: 9, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 9, fill: T.textSec }} />
                  <Tooltip {...tip} />
                  <Bar dataKey="c" fill={T.sage} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 'Rebalancing' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Top 15 Holdings by Weight</div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={[...constrained].sort((a, b) => b.weightPct - a.weightPct).slice(0, 15)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 9, fill: T.textSec }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 8, fill: T.textSec }} width={80} />
                  <Tooltip {...tip} />
                  <Bar dataKey="weightPct" fill={T.navy} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>ESG Score vs Weight</div>
              <ResponsiveContainer width="100%" height={320}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="x" name="ESG" tick={{ fontSize: 9, fill: T.textSec }} />
                  <YAxis dataKey="y" name="Weight%" tick={{ fontSize: 9, fill: T.textSec }} />
                  <Tooltip {...tip} />
                  <Scatter data={constrained.map(h => ({ name: h.name, x: h.esgScore, y: h.weightPct }))} fill={T.gold} fillOpacity={0.5} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 'Engagement' && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <KpiCard label="Under Engagement" value={constrained.filter(h => h.engagementStatus !== 'Monitoring').length} />
            <KpiCard label="Escalated" value={constrained.filter(h => h.engagementStatus === 'Escalated').length} color={T.red} />
            <KpiCard label="Active Dialogue" value={constrained.filter(h => h.engagementStatus === 'Active').length} color={T.amber} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Engagement Activity 2025</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={ENGAGEMENT_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="month" tick={{ fontSize: 9, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 9, fill: T.textSec }} />
                  <Tooltip {...tip} />
                  <Legend />
                  <Bar dataKey="meetings" fill={T.navy} radius={[4, 4, 0, 0]} name="Meetings" />
                  <Bar dataKey="milestones" fill={T.sage} radius={[4, 4, 0, 0]} name="Milestones" />
                  <Bar dataKey="escalations" fill={T.red} radius={[4, 4, 0, 0]} name="Escalations" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 10 }}>Priority Engagement Queue</div>
              <div style={{ overflowY: 'auto', maxHeight: 260 }}>
                {constrained.filter(h => h.engagementStatus === 'Escalated').slice(0, 10).map((h, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{h.name}</div>
                      <div style={{ fontSize: 10, color: T.textSec }}>{h.sector} · ITR: {h.itr}°C · Target: {h.targetYear}</div>
                    </div>
                    <span style={{ color: T.red, fontSize: 11, fontFamily: T.mono }}>Escalated</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'Reporting' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 10 }}>Portfolio Climate KPIs</div>
              {[
                { label: 'Weighted Average ITR', value: `${stats.weightedITR}°C`, benchmark: '2.8°C (S&P 500)', good: +stats.weightedITR < 2 },
                { label: 'Portfolio Carbon Footprint', value: `${stats.avgCI} tCO₂e/$M`, benchmark: '210 (MSCI World)', good: +stats.avgCI < 150 },
                { label: 'SBTi Coverage', value: `${Math.round((stats.sbtiApproved + stats.sbtiCommitted) / Math.max(1, stats.count) * 100)}%`, benchmark: '18% (MSCI ACWI)', good: true },
                { label: 'Green Revenue Exposure', value: `${stats.avgGreen}%`, benchmark: '12% (MSCI World)', good: +stats.avgGreen > 12 },
                { label: 'Paris-Aligned Holdings (≤1.5°C)', value: `${constrained.filter(h => h.itr <= 1.5).length}/${stats.count}`, benchmark: 'Target: >50%', good: constrained.filter(h => h.itr <= 1.5).length > stats.count * 0.5 },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${T.border}` }}>
                  <div>
                    <div style={{ fontSize: 12, color: T.text }}>{row.label}</div>
                    <div style={{ fontSize: 10, color: T.textSec }}>{row.benchmark}</div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: row.good ? T.green : T.amber, fontFamily: T.mono }}>{row.value}</div>
                </div>
              ))}
            </div>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 10 }}>Regulatory Framework Alignment</div>
              {[
                { framework: 'EU SFDR Art. 9', status: 'Partial', detail: 'Missing PAI indicators 15–18' },
                { framework: 'EU Taxonomy Alignment', status: 'Partial', detail: 'Green revenue proxy (Taxonomy turnover n/a)' },
                { framework: 'TCFD Disclosure', status: 'Aligned', detail: 'Scenario analysis: 1.5°C / 2°C / BAU' },
                { framework: 'SBTi Corporate Standard', status: 'Aligned', detail: `${stats.sbtiApproved} approved targets in portfolio` },
                { framework: 'Net Zero Asset Managers', status: 'Aligned', detail: 'NZAM signatory portfolio construct' },
                { framework: 'Paris Alignment (PAT)', status: 'In Progress', detail: 'PAII methodology; ITR below 2°C target' },
              ].map((f, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
                  <div>
                    <div style={{ fontSize: 12, color: T.text }}>{f.framework}</div>
                    <div style={{ fontSize: 10, color: T.textSec }}>{f.detail}</div>
                  </div>
                  <span style={{ color: f.status === 'Aligned' ? T.green : f.status === 'Partial' ? T.amber : T.gold, fontSize: 11, fontWeight: 600 }}>{f.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <Panel item={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
