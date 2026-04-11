import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, Legend,
} from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f6f4f0',
  navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f',
  teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c',
  surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace',
};

const TYPES = ['Guarantee', 'Concessional Loan', 'First-Loss', 'Grant', 'Risk Insurance'];
const REGIONS = ['Sub-Saharan Africa', 'South Asia', 'East Asia', 'Latin America', 'MENA', 'Eastern Europe'];
const SECTORS = ['Renewable Energy', 'Agriculture', 'Water', 'Urban', 'Health', 'Nature'];
const COUNTRIES = [
  'Nigeria','Kenya','Ethiopia','Tanzania','Ghana','India','Bangladesh','Vietnam','Philippines','Indonesia',
  'Brazil','Colombia','Peru','Morocco','Egypt','Ukraine','Georgia','Moldova','Cambodia','Laos',
  'Mozambique','Zambia','Uganda','Senegal','Rwanda','Pakistan','Sri Lanka','Myanmar','Bolivia','Ecuador',
  'Jordan','Tunisia','Armenia','Serbia','Albania','Papua New Guinea','Fiji','Costa Rica','Honduras','Paraguay',
  'Madagascar','Malawi','Zimbabwe','Namibia','Nepal','Mongolia','Kyrgyzstan','Tajikistan','Yemen','Samoa',
];

const TRANSACTIONS = Array.from({ length: 50 }, (_, i) => {
  const type = TYPES[i % TYPES.length];
  const region = REGIONS[i % REGIONS.length];
  const sector = SECTORS[i % SECTORS.length];
  const totalSize = +(10 + sr(i * 7) * 490).toFixed(1);
  const publicShare = +(0.2 + sr(i * 11) * 0.6).toFixed(2);
  const publicFinance = +(totalSize * publicShare).toFixed(1);
  const privateFinance = +(totalSize * (1 - publicShare)).toFixed(1);
  return {
    id: i,
    name: `${sector.split(' ')[0]}-${region.split(' ')[0].slice(0, 3).toUpperCase()}-${String(i + 1).padStart(2, '0')}`,
    type,
    region,
    totalSize,
    publicFinance,
    privateFinance,
    leverageRatio: +(1 + sr(i * 13) * 9).toFixed(2),
    sector,
    country: COUNTRIES[i] || 'EM Country',
    irr: +(3 + sr(i * 17) * 17).toFixed(1),
    sdgImpact: +(3 + sr(i * 19) * 7).toFixed(1),
    climateImpact: +(0.05 + sr(i * 23) * 4.95).toFixed(2),
    genderLens: sr(i * 29) > 0.55,
  };
});

const TABS = [
  'Transaction Overview', 'Structure Types', 'Leverage Analytics', 'Sector Allocation',
  'Regional Distribution', 'SDG Impact', 'Climate Impact', 'Gender Lens Finance',
];

const TYPE_COLORS = {
  'Guarantee': T.blue,
  'Concessional Loan': T.teal,
  'First-Loss': T.amber,
  'Grant': T.green,
  'Risk Insurance': T.purple,
};

const kpi = (label, value, sub, color) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 20px', minWidth: 160, flex: 1 }}>
    <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 700, color: color || T.navy, marginTop: 4 }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{sub}</div>}
  </div>
);

export default function ClimateBlendedFinancePage() {
  const [tab, setTab] = useState(0);
  const [typeFilter, setTypeFilter] = useState('All');
  const [regionFilter, setRegionFilter] = useState('All');
  const [sectorFilter, setSectorFilter] = useState('All');
  const [leverageTarget, setLeverageTarget] = useState(3);
  const [grantElement, setGrantElement] = useState(20);

  const filtered = useMemo(() => TRANSACTIONS.filter(t => {
    if (typeFilter !== 'All' && t.type !== typeFilter) return false;
    if (regionFilter !== 'All' && t.region !== regionFilter) return false;
    if (sectorFilter !== 'All' && t.sector !== sectorFilter) return false;
    return true;
  }), [typeFilter, regionFilter, sectorFilter]);

  const totalVolume = filtered.reduce((a, t) => a + t.totalSize, 0);
  const avgLeverage = filtered.length ? filtered.reduce((a, t) => a + t.leverageRatio, 0) / filtered.length : 0;
  const totalClimateImpact = filtered.reduce((a, t) => a + t.climateImpact, 0);
  const avgSdg = filtered.length ? filtered.reduce((a, t) => a + t.sdgImpact, 0) / filtered.length : 0;

  const selStyle = active => ({
    padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
    background: active ? T.navy : T.sub, color: active ? '#fff' : T.textSec,
    border: `1px solid ${active ? T.navy : T.border}`, fontFamily: T.fontMono,
  });

  const volumeByType = TYPES.map(tp => ({
    type: tp.split(' ')[0],
    volume: +filtered.filter(t => t.type === tp).reduce((a, t) => a + t.totalSize, 0).toFixed(1),
  })).filter(d => d.volume > 0);

  const scatterLeverage = filtered.map(t => ({ x: t.leverageRatio, y: t.climateImpact, name: t.name, type: t.type }));

  const volumeBySector = SECTORS.map(s => ({
    sector: s.split(' ')[0],
    volume: +filtered.filter(t => t.sector === s).reduce((a, t) => a + t.totalSize, 0).toFixed(1),
    count: filtered.filter(t => t.sector === s).length,
  })).filter(d => d.volume > 0);

  const leverageByRegion = REGIONS.map(r => ({
    region: r.split(' ')[0],
    avgLev: +(filtered.filter(t => t.region === r).reduce((a, t) => a + t.leverageRatio, 0) /
      Math.max(1, filtered.filter(t => t.region === r).length)).toFixed(2),
  })).filter(d => d.avgLev > 0);

  const genderTransactions = filtered.filter(t => t.genderLens);
  const grantEligible = filtered.filter(t => t.publicFinance / Math.max(0.1, t.totalSize) * 100 >= grantElement);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: "'DM Sans',sans-serif", color: T.textPri }}>
      <div style={{ background: T.navy, padding: '24px 32px', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ fontSize: 11, color: T.gold, fontFamily: T.fontMono, letterSpacing: 2, marginBottom: 4 }}>EP-DH4 · EMERGING MARKETS & DEVELOPMENT FINANCE</div>
        <div style={{ fontSize: 26, fontWeight: 700, color: '#fff' }}>Climate Blended Finance Analytics</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 4 }}>
          50 Transactions · Guarantees · Concessional Loans · First-Loss · Leverage Analytics · SDG Impact
        </div>
      </div>

      <div style={{ background: T.card, borderBottom: `1px solid ${T.border}`, padding: '12px 32px', display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, background: T.sub }}>
          <option value="All">All Types</option>
          {TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
        <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, background: T.sub }}>
          <option value="All">All Regions</option>
          {REGIONS.map(r => <option key={r}>{r}</option>)}
        </select>
        <select value={sectorFilter} onChange={e => setSectorFilter(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, background: T.sub }}>
          <option value="All">All Sectors</option>
          {SECTORS.map(s => <option key={s}>{s}</option>)}
        </select>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 24, alignItems: 'center' }}>
          <label style={{ fontSize: 12, color: T.textSec }}>
            Leverage Target: <strong style={{ color: T.navy }}>{leverageTarget}×</strong>
            <input type="range" min={1} max={10} value={leverageTarget} onChange={e => setLeverageTarget(+e.target.value)} style={{ marginLeft: 8, width: 80 }} />
          </label>
          <label style={{ fontSize: 12, color: T.textSec }}>
            Grant Element: <strong style={{ color: T.navy }}>{grantElement}%</strong>
            <input type="range" min={0} max={80} value={grantElement} onChange={e => setGrantElement(+e.target.value)} style={{ marginLeft: 8, width: 80 }} />
          </label>
        </div>
      </div>

      <div style={{ padding: '20px 32px', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {kpi('Total Transaction Volume', `$${(totalVolume / 1000).toFixed(1)}Bn`, `${filtered.length} transactions`, T.blue)}
        {kpi('Avg Leverage Ratio', `${avgLeverage.toFixed(2)}×`, `Target: ${leverageTarget}×`, avgLeverage >= leverageTarget ? T.green : T.amber)}
        {kpi('Total Climate Impact', `${totalClimateImpact.toFixed(1)}MtCO₂`, 'abated', T.teal)}
        {kpi('Avg SDG Impact Score', avgSdg.toFixed(1), 'out of 10', T.indigo)}
      </div>

      <div style={{ padding: '0 32px 16px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => <button key={t} onClick={() => setTab(i)} style={selStyle(tab === i)}>{t}</button>)}
      </div>

      <div style={{ padding: '0 32px 40px' }}>
        {tab === 0 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Transaction','Type','Country','Size ($M)','Public ($M)','Private ($M)','Leverage','IRR %','SDG','Climate (MtCO₂)'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: T.textSec, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 20).map((t, i) => (
                  <tr key={t.id} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                    <td style={{ padding: '8px 12px', fontWeight: 600, fontFamily: T.fontMono, fontSize: 11 }}>{t.name}</td>
                    <td style={{ padding: '8px 12px' }}><span style={{ background: (TYPE_COLORS[t.type] || T.navy) + '20', color: TYPE_COLORS[t.type] || T.navy, padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600 }}>{t.type.split(' ')[0]}</span></td>
                    <td style={{ padding: '8px 12px', fontSize: 11, color: T.textSec }}>{t.country}</td>
                    <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>{t.totalSize.toFixed(0)}</td>
                    <td style={{ padding: '8px 12px', fontFamily: T.fontMono, color: T.blue }}>{t.publicFinance.toFixed(0)}</td>
                    <td style={{ padding: '8px 12px', fontFamily: T.fontMono, color: T.green }}>{t.privateFinance.toFixed(0)}</td>
                    <td style={{ padding: '8px 12px', fontFamily: T.fontMono, color: t.leverageRatio >= leverageTarget ? T.green : T.amber }}>{t.leverageRatio.toFixed(2)}×</td>
                    <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>{t.irr.toFixed(1)}%</td>
                    <td style={{ padding: '8px 12px', fontFamily: T.fontMono, color: T.indigo }}>{t.sdgImpact.toFixed(1)}</td>
                    <td style={{ padding: '8px 12px', fontFamily: T.fontMono, color: T.teal }}>{t.climateImpact.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length > 20 && <div style={{ padding: '10px 16px', fontSize: 12, color: T.textSec, background: T.sub }}>Showing 20 of {filtered.length} transactions</div>}
          </div>
        )}

        {tab === 1 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 16, color: T.navy }}>Transaction Volume by Structure Type ($M)</div>
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={volumeByType}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="type" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="M" />
                <Tooltip formatter={v => `$${v}M`} />
                <Bar dataKey="volume" fill={T.indigo} name="Transaction Volume" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 2 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 16, color: T.navy }}>Leverage Ratio vs Climate Impact (MtCO₂)</div>
            <ResponsiveContainer width="100%" height={360}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="x" name="Leverage Ratio" label={{ value: 'Leverage Ratio (×)', position: 'insideBottom', offset: -5, fontSize: 11 }} />
                <YAxis dataKey="y" name="Climate Impact" label={{ value: 'Climate Impact (MtCO₂)', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ payload }) => payload?.[0] ? (
                  <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: '8px 12px', fontSize: 12, borderRadius: 6 }}>
                    <div style={{ fontWeight: 700 }}>{payload[0].payload.name}</div>
                    <div>Leverage: {payload[0].payload.x}×</div>
                    <div>Climate Impact: {payload[0].payload.y}MtCO₂</div>
                  </div>
                ) : null} />
                <Scatter data={scatterLeverage} fill={T.teal} fillOpacity={0.7} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 3 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 16, color: T.navy }}>Transaction Volume by Sector ($M)</div>
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={volumeBySector}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="sector" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="M" />
                <Tooltip formatter={v => `$${v}M`} />
                <Bar dataKey="volume" fill={T.green} name="Volume ($M)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 4 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 16, color: T.navy }}>Average Leverage Ratio by Region</div>
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={leverageByRegion}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="region" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="×" />
                <Tooltip formatter={v => `${v}×`} />
                <Bar dataKey="avgLev" fill={T.amber} name="Avg Leverage" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 5 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 16, color: T.navy }}>SDG Impact Distribution</div>
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={[...filtered].sort((a, b) => b.sdgImpact - a.sdgImpact).slice(0, 20).map(t => ({ name: t.name.slice(0, 12), sdg: t.sdgImpact, climate: t.climateImpact }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={60} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} domain={[0, 10]} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="sdg" fill={T.indigo} name="SDG Impact (0-10)" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="climate" fill={T.teal} name="Climate Impact (MtCO₂)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 6 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 16, color: T.navy }}>Top 15 Transactions by Climate Impact (MtCO₂)</div>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={[...filtered].sort((a, b) => b.climateImpact - a.climateImpact).slice(0, 15).map(t => ({ name: t.name.slice(0, 12), impact: t.climateImpact, sector: t.sector.split(' ')[0] }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} unit="Mt" />
                <Tooltip formatter={v => `${v}MtCO₂`} />
                <Bar dataKey="impact" fill={T.teal} name="Climate Impact" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 7 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, marginBottom: 16, color: T.navy }}>Gender Lens Finance</div>
              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <div style={{ flex: 1, background: T.sub, borderRadius: 8, padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: T.purple }}>{genderTransactions.length}</div>
                  <div style={{ fontSize: 12, color: T.textSec }}>Gender-Lens Transactions</div>
                </div>
                <div style={{ flex: 1, background: T.sub, borderRadius: 8, padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: T.green }}>${genderTransactions.reduce((a, t) => a + t.totalSize, 0).toFixed(0)}M</div>
                  <div style={{ fontSize: 12, color: T.textSec }}>Total Gender-Lens Volume</div>
                </div>
              </div>
              {genderTransactions.slice(0, 8).map(t => (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{t.name}</div>
                  <div style={{ fontSize: 12, fontFamily: T.fontMono, color: T.green }}>${t.totalSize.toFixed(0)}M</div>
                </div>
              ))}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, marginBottom: 16, color: T.navy }}>Grant Element ≥ {grantElement}%</div>
              <div style={{ marginBottom: 16, padding: 16, background: T.sub, borderRadius: 8, display: 'flex', gap: 24 }}>
                <div>
                  <div style={{ fontSize: 12, color: T.textSec }}>Eligible Transactions</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: T.amber, fontFamily: T.fontMono }}>{grantEligible.length}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: T.textSec }}>Total Volume</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: T.blue, fontFamily: T.fontMono }}>${grantEligible.reduce((a, t) => a + t.totalSize, 0).toFixed(0)}M</div>
                </div>
              </div>
              {grantEligible.slice(0, 8).map(t => (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{t.name}</span>
                    <span style={{ fontSize: 11, color: T.textSec, marginLeft: 6 }}>{t.country}</span>
                  </div>
                  <div style={{ fontSize: 12, fontFamily: T.fontMono, color: T.amber }}>{(t.publicFinance / Math.max(0.1, t.totalSize) * 100).toFixed(0)}%</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
