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

const SECTORS = [
  { name:'Energy', weight:18, itrContrib:0.82, scope1:0.35, scope2:0.12, scope3:0.35, color:T.red },
  { name:'Materials', weight:12, itrContrib:0.31, scope1:0.14, scope2:0.06, scope3:0.11, color:T.orange },
  { name:'Industrials', weight:10, itrContrib:0.18, scope1:0.06, scope2:0.04, scope3:0.08, color:T.amber },
  { name:'Utilities', weight:8, itrContrib:0.24, scope1:0.15, scope2:0.02, scope3:0.07, color:T.purple },
  { name:'Consumer Disc.', weight:9, itrContrib:0.12, scope1:0.03, scope2:0.02, scope3:0.07, color:T.blue },
  { name:'Consumer Staples', weight:7, itrContrib:0.08, scope1:0.02, scope2:0.01, scope3:0.05, color:T.teal },
  { name:'Healthcare', weight:6, itrContrib:0.04, scope1:0.01, scope2:0.01, scope3:0.02, color:T.sage },
  { name:'Technology', weight:15, itrContrib:-0.18, scope1:-0.02, scope2:-0.04, scope3:-0.12, color:T.green },
  { name:'Financials', weight:10, itrContrib:0.06, scope1:0.01, scope2:0.01, scope3:0.04, color:T.navyL },
  { name:'Real Estate', weight:5, itrContrib:0.08, scope1:0.03, scope2:0.03, scope3:0.02, color:'#8b5cf6' },
];

const COMPANIES = [
  { name:'ExxonMobil', sector:'Energy', itr:3.2, weight:4.2, scope1:1.8, scope2:0.3, scope3:1.1 },
  { name:'Chevron', sector:'Energy', itr:3.0, weight:3.1, scope1:1.5, scope2:0.2, scope3:1.3 },
  { name:'Shell', sector:'Energy', itr:2.8, weight:2.8, scope1:1.2, scope2:0.3, scope3:1.3 },
  { name:'BASF', sector:'Materials', itr:2.6, weight:2.2, scope1:1.0, scope2:0.4, scope3:1.2 },
  { name:'HeidelbergCement', sector:'Materials', itr:3.1, weight:1.5, scope1:1.8, scope2:0.2, scope3:1.1 },
  { name:'Microsoft', sector:'Technology', itr:1.3, weight:5.0, scope1:0.1, scope2:0.1, scope3:1.1 },
  { name:'Apple', sector:'Technology', itr:1.5, weight:4.8, scope1:0.1, scope2:0.2, scope3:1.2 },
  { name:'NextEra', sector:'Utilities', itr:1.8, weight:2.0, scope1:0.6, scope2:0.1, scope3:1.1 },
  { name:'RWE', sector:'Utilities', itr:2.9, weight:1.5, scope1:1.6, scope2:0.2, scope3:1.1 },
  { name:'JPMorgan', sector:'Financials', itr:2.5, weight:3.2, scope1:0.1, scope2:0.1, scope3:2.3 },
  { name:'Nestle', sector:'Consumer Staples', itr:2.2, weight:2.5, scope1:0.3, scope2:0.2, scope3:1.7 },
  { name:'Amazon', sector:'Consumer Disc.', itr:2.1, weight:3.5, scope1:0.4, scope2:0.3, scope3:1.4 },
];

const BASE_ITR = 1.5;
const PORTFOLIO_ITR = useMemoCalc();
function useMemoCalc() {
  return BASE_ITR + SECTORS.reduce((a, s) => a + s.itrContrib, 0);
}

const TABS = ['ITR Waterfall','Sector Contribution','Company Drill-Down','Scope Decomposition','What-If Simulator','Target Gap Analysis'];
const card = { background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20, marginBottom: 16 };
const label = { fontSize: 10, color: T.textMut, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 };

export default function TemperatureAlignmentWaterfallPage() {
  const [tab, setTab] = useState(0);
  const [selectedSector, setSelectedSector] = useState('Energy');
  const [excludeList, setExcludeList] = useState([]);
  const [watchlist, setWatchlist] = useState([]);

  const portfolioITR = useMemo(() => {
    const activeSectors = SECTORS.filter(s => !excludeList.includes(s.name));
    return BASE_ITR + activeSectors.reduce((a, s) => a + s.itrContrib, 0);
  }, [excludeList]);

  const waterfallData = useMemo(() => {
    let running = BASE_ITR;
    const items = [{ name: 'Base (1.5C)', value: BASE_ITR, fill: T.green, running: BASE_ITR }];
    SECTORS.sort((a, b) => b.itrContrib - a.itrContrib).forEach(s => {
      if (!excludeList.includes(s.name)) {
        running += s.itrContrib;
        items.push({ name: s.name, value: s.itrContrib, fill: s.itrContrib > 0 ? T.red : T.green, running });
      }
    });
    items.push({ name: 'Portfolio ITR', value: running, fill: running > 2.0 ? T.red : running > 1.8 ? T.amber : T.green, running });
    return items;
  }, [excludeList]);

  const sectorCompanies = COMPANIES.filter(c => c.sector === selectedSector);

  const gapData = SECTORS.map(s => ({
    sector: s.name, current: (BASE_ITR + s.itrContrib).toFixed(2),
    target: 1.5, gap: Math.max(0, s.itrContrib).toFixed(2)
  }));

  const scopeDecomp = SECTORS.map(s => ({ sector: s.name, scope1: s.scope1, scope2: s.scope2, scope3: s.scope3 }));

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh' }}>
      <div style={{ background: T.navy, padding: '24px 32px 0', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ color: T.gold, fontFamily: T.mono, fontSize: 11, letterSpacing: 2, marginBottom: 4 }}>EP-CM2 · TEMPERATURE ALIGNMENT WATERFALL</div>
            <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: 0 }}>Portfolio ITR Waterfall Decomposition</h1>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>
              10 Sectors · 12 Holdings · Scope 1/2/3 · What-If Simulator · Waterfall Charts
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {[
              { label: 'Portfolio ITR', val: `${portfolioITR.toFixed(2)}C`, col: portfolioITR > 2.0 ? T.red : T.amber },
              { label: 'Paris Gap', val: `+${(portfolioITR - 1.5).toFixed(2)}C`, col: T.red },
              { label: 'Sectors', val: SECTORS.length - excludeList.length, col: T.gold },
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
          <select value={selectedSector} onChange={e => setSelectedSector(e.target.value)} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
            {SECTORS.map(s => <option key={s.name}>{s.name}</option>)}
          </select>
          <button onClick={() => alert('Export PDF')} style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${T.navy}`, background: 'transparent', color: T.navy, cursor: 'pointer', fontSize: 11 }}>Export PDF</button>
          <button onClick={() => alert('Export CSV')} style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${T.navy}`, background: 'transparent', color: T.navy, cursor: 'pointer', fontSize: 11 }}>Export CSV</button>
        </div>

        {tab === 0 && (<div>
          <div style={card}>
            <div style={label}>ITR Waterfall — Sector Contributions to Portfolio Temperature</div>
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={waterfallData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={60} />
                <YAxis domain={[0, 3.5]} tick={{ fontSize: 10 }} />
                <Tooltip formatter={v => `${v > 0 ? '+' : ''}${Number(v).toFixed(2)}C`} />
                <ReferenceLine y={1.5} stroke={T.green} strokeDasharray="4 4" label={{ value: '1.5C Target', position: 'right', fontSize: 10 }} />
                <ReferenceLine y={2.0} stroke={T.amber} strokeDasharray="4 4" label={{ value: '2.0C', position: 'right', fontSize: 10 }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {waterfallData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <div style={label}>Running Total — Cumulative ITR Build-Up</div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={waterfallData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} /><YAxis tick={{ fontSize: 10 }} domain={[1, 3.5]} />
                <Tooltip /><ReferenceLine y={1.5} stroke={T.green} strokeDasharray="4 4" />
                <Line type="monotone" dataKey="running" stroke={T.navy} strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>)}

        {tab === 1 && (<div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={card}>
              <div style={label}>Sector ITR Contribution (Sorted)</div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={[...SECTORS].sort((a, b) => b.itrContrib - a.itrContrib)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 10 }} /><YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={v => `${v > 0 ? '+' : ''}${Number(v).toFixed(2)}C`} />
                  <ReferenceLine x={0} stroke={T.navy} />
                  <Bar dataKey="itrContrib" name="ITR Contribution">
                    {SECTORS.map((s, i) => <Cell key={i} fill={s.itrContrib > 0 ? T.red : T.green} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <div style={label}>Sector Weight vs ITR Impact</div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={SECTORS}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 10 }} /><Tooltip /><Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="weight" name="Weight %" fill={T.blue} />
                  <Bar dataKey={d => Math.abs(d.itrContrib) * 100} name="|ITR Impact| bps" fill={T.orange} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>)}

        {tab === 2 && (<div>
          <div style={card}>
            <div style={label}>Company Drill-Down — {selectedSector}</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={sectorCompanies}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} domain={[0, 4]} />
                <Tooltip /><ReferenceLine y={1.5} stroke={T.green} strokeDasharray="4 4" />
                <ReferenceLine y={2.0} stroke={T.amber} strokeDasharray="4 4" />
                <Bar dataKey="itr" name="Company ITR" radius={[4, 4, 0, 0]}>
                  {sectorCompanies.map((c, i) => <Cell key={i} fill={c.itr > 2.5 ? T.red : c.itr > 2.0 ? T.orange : c.itr > 1.5 ? T.amber : T.green} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <div style={label}>Company Detail Table — {selectedSector}</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead><tr style={{ borderBottom: `2px solid ${T.border}` }}>
                {['Company','ITR (C)','Weight %','Scope 1','Scope 2','Scope 3'].map(h => <th key={h} style={{ textAlign: 'left', padding: '8px 6px', color: T.textMut }}>{h}</th>)}
              </tr></thead>
              <tbody>{sectorCompanies.map(c => (
                <tr key={c.name} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: 6, fontWeight: 600 }}>{c.name}</td>
                  <td style={{ padding: 6, fontFamily: T.mono, color: c.itr > 2.0 ? T.red : T.green }}>{c.itr}C</td>
                  <td style={{ padding: 6, fontFamily: T.mono }}>{c.weight}%</td>
                  <td style={{ padding: 6, fontFamily: T.mono }}>{c.scope1}</td>
                  <td style={{ padding: 6, fontFamily: T.mono }}>{c.scope2}</td>
                  <td style={{ padding: 6, fontFamily: T.mono }}>{c.scope3}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>)}

        {tab === 3 && (<div>
          <div style={card}>
            <div style={label}>Scope 1/2/3 Decomposition by Sector</div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={scopeDecomp}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="sector" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 10 }} /><Tooltip /><Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="scope1" name="Scope 1" fill={T.red} stackId="a" />
                <Bar dataKey="scope2" name="Scope 2" fill={T.amber} stackId="a" />
                <Bar dataKey="scope3" name="Scope 3" fill={T.blue} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <div style={label}>Scope 3 Dominance Ratio</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={scopeDecomp.map(s => ({ ...s, ratio: ((s.scope3 / (Math.abs(s.scope1) + Math.abs(s.scope2) + Math.abs(s.scope3))) * 100).toFixed(0) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="sector" tick={{ fontSize: 9 }} /><YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                <Tooltip /><Bar dataKey="ratio" name="Scope 3 % of Total" fill={T.purple} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>)}

        {tab === 4 && (<div>
          <div style={card}>
            <div style={label}>What-If Simulator — Toggle Sectors to See ITR Impact</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {SECTORS.map(s => (
                <button key={s.name} onClick={() => setExcludeList(l => l.includes(s.name) ? l.filter(x => x !== s.name) : [...l, s.name])} style={{
                  padding: '6px 14px', borderRadius: 20, border: `2px solid ${excludeList.includes(s.name) ? T.textMut : s.color}`,
                  background: excludeList.includes(s.name) ? T.textMut + '22' : s.color + '22',
                  color: excludeList.includes(s.name) ? T.textMut : s.color, cursor: 'pointer', fontSize: 11, fontWeight: 600,
                  textDecoration: excludeList.includes(s.name) ? 'line-through' : 'none'
                }}>{s.name} ({s.itrContrib > 0 ? '+' : ''}{s.itrContrib.toFixed(2)}C)</button>
              ))}
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: portfolioITR > 2.0 ? T.red : portfolioITR > 1.5 ? T.amber : T.green, fontFamily: T.mono, marginBottom: 12 }}>
              Simulated Portfolio ITR: {portfolioITR.toFixed(2)}C {excludeList.length > 0 && `(excl. ${excludeList.length} sectors)`}
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={waterfallData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={60} />
                <YAxis domain={[0, 3.5]} tick={{ fontSize: 10 }} />
                <Tooltip /><ReferenceLine y={1.5} stroke={T.green} strokeDasharray="4 4" />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {waterfallData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>)}

        {tab === 5 && (<div>
          <div style={card}>
            <div style={label}>Target Gap Analysis — Current ITR vs 1.5C by Sector</div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={gapData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="sector" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 10 }} /><Tooltip /><Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="gap" name="Gap to 1.5C (C)" fill={T.red} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ ...card, background: T.navy + '08', border: `1px solid ${T.gold}33` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.navy, marginBottom: 4 }}>ITR Methodology Reference</div>
            <div style={{ fontSize: 11, color: T.textSec, lineHeight: 1.6 }}>
              Implied Temperature Rise (ITR) calculated per TCFD Portfolio Alignment Team methodology. Portfolio ITR = Base 1.5C + sum of sector-weighted emission overshoot contributions. Each sector's contribution reflects its carbon budget alignment gap scaled by portfolio weight.
            </div>
          </div>
        </div>)}
      </div>
    </div>
  );
}
