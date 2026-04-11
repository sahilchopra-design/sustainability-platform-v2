import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, AreaChart, Area, Legend,
} from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f6f4f0',
  navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f',
  teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c',
  surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace',
};

const REGIONS = ['Western Europe', 'Emerging Markets', 'East Asia', 'Latin America', 'MENA', 'North America'];
const PROCEEDS = ['Climate Mitigation', 'Adaptation', 'Biodiversity', 'Water', 'Energy Efficiency'];
const VERIFIERS = ['S&P', "Moody's", 'Sustainalytics', 'CICERO', 'ISS'];
const YEARS = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024];
const CURRENCIES = ['EUR', 'USD', 'GBP', 'JPY', 'CNY', 'BRL', 'AUD'];

const ISSUERS = [
  'France','Germany','Netherlands','Sweden','Belgium','Denmark','UK','Spain','Italy','Poland',
  'Hungary','Chile','Mexico','Brazil','Colombia','Peru','Indonesia','Philippines','India','China',
  'Japan','South Korea','Australia','Canada','USA','Egypt','Morocco','Saudi Arabia','UAE','Israel',
  'New Zealand','Singapore','Hong Kong','Taiwan','Malaysia','Thailand','Vietnam','Czech Republic','Austria','Finland',
  'Ireland','Norway','Switzerland','Portugal','Slovakia','Romania','Lithuania','Estonia','Latvia','Slovenia',
  'Luxembourg','Iceland','Cyprus','Greece','Czechia','Argentina','Ecuador','Costa Rica','Panama','Uruguay',
  'Guatemala','Dominican Republic','Trinidad','Jamaica',
];

const BONDS = Array.from({ length: 65 }, (_, i) => ({
  id: i,
  name: `${ISSUERS[i % ISSUERS.length]}-SGB-${2016 + (i % 9)}`,
  country: ISSUERS[i % ISSUERS.length],
  region: REGIONS[i % REGIONS.length],
  issuanceYear: 2016 + Math.floor(sr(i * 7) * 9),
  size: +(0.5 + sr(i * 11) * 14.5).toFixed(2),
  currency: CURRENCIES[i % CURRENCIES.length],
  tenor: Math.round(5 + sr(i * 13) * 25),
  greenium: +(-2 + sr(i * 17) * 22).toFixed(1),
  useOfProceeds: PROCEEDS[i % PROCEEDS.length],
  verifier: VERIFIERS[i % VERIFIERS.length],
  oversubscription: +(1.2 + sr(i * 19) * 6.8).toFixed(1),
  secondPartyOpinion: sr(i * 23) > 0.2,
  parisAligned: sr(i * 29) > 0.35,
  postIssuanceReport: sr(i * 31) > 0.25,
}));

const TABS = [
  'Bond Overview', 'Issuance Trends', 'Greenium Analysis', 'Use of Proceeds',
  'Tenor Distribution', 'Verifier Landscape', 'Oversubscription', 'Paris Alignment',
];

const kpi = (label, value, sub, color) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 20px', minWidth: 160, flex: 1 }}>
    <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 700, color: color || T.navy, marginTop: 4 }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{sub}</div>}
  </div>
);

export default function SovereignGreenBondAnalyticsPage() {
  const [tab, setTab] = useState(0);
  const [regionFilter, setRegionFilter] = useState('All');
  const [proceedsFilter, setProceedsFilter] = useState('All');
  const [yearFrom, setYearFrom] = useState(2016);
  const [yearTo, setYearTo] = useState(2024);
  const [minGreenium, setMinGreenium] = useState(-5);
  const [minSize, setMinSize] = useState(0);

  const filtered = useMemo(() => BONDS.filter(b => {
    if (regionFilter !== 'All' && b.region !== regionFilter) return false;
    if (proceedsFilter !== 'All' && b.useOfProceeds !== proceedsFilter) return false;
    if (b.issuanceYear < yearFrom || b.issuanceYear > yearTo) return false;
    if (b.greenium < minGreenium) return false;
    if (b.size < minSize) return false;
    return true;
  }), [regionFilter, proceedsFilter, yearFrom, yearTo, minGreenium, minSize]);

  const totalVolume = filtered.reduce((a, b) => a + b.size, 0);
  const avgGreenium = filtered.length ? filtered.reduce((a, b) => a + b.greenium, 0) / filtered.length : 0;
  const avgOversubscription = filtered.length ? filtered.reduce((a, b) => a + b.oversubscription, 0) / filtered.length : 0;
  const parisAlignedPct = filtered.length ? (filtered.filter(b => b.parisAligned).length / filtered.length * 100).toFixed(1) : '0.0';

  const selStyle = active => ({
    padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
    background: active ? T.navy : T.sub, color: active ? '#fff' : T.textSec,
    border: `1px solid ${active ? T.navy : T.border}`, fontFamily: T.fontMono,
  });

  // Cumulative issuance by year
  const cumIssuanceData = YEARS.map(yr => {
    const yearBonds = filtered.filter(b => b.issuanceYear <= yr);
    return { year: yr, cumulative: +yearBonds.reduce((a, b) => a + b.size, 0).toFixed(2), annual: +filtered.filter(b => b.issuanceYear === yr).reduce((a, b) => a + b.size, 0).toFixed(2) };
  });

  const greeniumByProceeds = PROCEEDS.map(p => ({
    proceeds: p.split(' ')[0],
    avgGreenium: +(filtered.filter(b => b.useOfProceeds === p).reduce((a, b) => a + b.greenium, 0) /
      Math.max(1, filtered.filter(b => b.useOfProceeds === p).length)).toFixed(2),
  })).filter(d => filtered.some(b => b.useOfProceeds === d.proceeds || b.useOfProceeds.startsWith(d.proceeds)));

  const issuanceByRegion = REGIONS.map(r => ({
    region: r.split(' ')[0],
    volume: +filtered.filter(b => b.region === r).reduce((a, b) => a + b.size, 0).toFixed(2),
  })).filter(d => d.volume > 0);

  const sizeVsOversubScatter = filtered.map(b => ({ x: b.size, y: b.oversubscription, name: b.name }));

  const tenorData = [5, 10, 15, 20, 30].map(t => ({
    tenor: `${t}yr`,
    count: filtered.filter(b => Math.abs(b.tenor - t) <= 2).length,
    volume: +filtered.filter(b => Math.abs(b.tenor - t) <= 2).reduce((a, b) => a + b.size, 0).toFixed(2),
  }));

  const verifierData = VERIFIERS.map(v => ({
    verifier: v,
    count: filtered.filter(b => b.verifier === v).length,
    volume: +filtered.filter(b => b.verifier === v).reduce((a, b) => a + b.size, 0).toFixed(2),
  })).filter(d => d.count > 0);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: "'DM Sans',sans-serif", color: T.textPri }}>
      <div style={{ background: T.navy, padding: '24px 32px', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ fontSize: 11, color: T.gold, fontFamily: T.fontMono, letterSpacing: 2, marginBottom: 4 }}>EP-DH6 · EMERGING MARKETS & DEVELOPMENT FINANCE</div>
        <div style={{ fontSize: 26, fontWeight: 700, color: '#fff' }}>Sovereign Green Bond Analytics</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 4 }}>
          65 Sovereign Green/Sustainability Bonds · Greenium Analysis · Use of Proceeds · Paris Alignment · Oversubscription
        </div>
      </div>

      <div style={{ background: T.card, borderBottom: `1px solid ${T.border}`, padding: '12px 32px', display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, background: T.sub }}>
          <option value="All">All Regions</option>
          {REGIONS.map(r => <option key={r}>{r}</option>)}
        </select>
        <select value={proceedsFilter} onChange={e => setProceedsFilter(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, background: T.sub }}>
          <option value="All">All Use of Proceeds</option>
          {PROCEEDS.map(p => <option key={p}>{p}</option>)}
        </select>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: T.textSec }}>Year:</span>
          <select value={yearFrom} onChange={e => setYearFrom(+e.target.value)} style={{ padding: '4px 8px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, background: T.sub }}>
            {YEARS.map(y => <option key={y}>{y}</option>)}
          </select>
          <span style={{ fontSize: 12, color: T.textSec }}>to</span>
          <select value={yearTo} onChange={e => setYearTo(+e.target.value)} style={{ padding: '4px 8px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, background: T.sub }}>
            {YEARS.map(y => <option key={y}>{y}</option>)}
          </select>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 24, alignItems: 'center' }}>
          <label style={{ fontSize: 12, color: T.textSec }}>
            Min Greenium: <strong style={{ color: T.navy }}>{minGreenium}bps</strong>
            <input type="range" min={-5} max={20} value={minGreenium} onChange={e => setMinGreenium(+e.target.value)} style={{ marginLeft: 8, width: 80 }} />
          </label>
          <label style={{ fontSize: 12, color: T.textSec }}>
            Min Size: <strong style={{ color: T.navy }}>${minSize}Bn</strong>
            <input type="range" min={0} max={10} step={0.5} value={minSize} onChange={e => setMinSize(+e.target.value)} style={{ marginLeft: 8, width: 80 }} />
          </label>
        </div>
      </div>

      <div style={{ padding: '20px 32px', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {kpi('Total Issuance Volume', `$${totalVolume.toFixed(1)}Bn`, `${filtered.length} bonds`, T.green)}
        {kpi('Avg Greenium', `${avgGreenium.toFixed(1)}bps`, 'vs conventional bonds', avgGreenium > 5 ? T.green : avgGreenium > 0 ? T.amber : T.textSec)}
        {kpi('Avg Oversubscription', `${avgOversubscription.toFixed(1)}×`, 'investor demand', T.blue)}
        {kpi('Paris Aligned', `${parisAlignedPct}%`, `${filtered.filter(b => b.parisAligned).length} bonds verified`, T.teal)}
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
                  {['Bond','Country','Year','Size ($Bn)','Currency','Tenor (yr)','Greenium (bps)','Use of Proceeds','Verifier','Oversubscription','Paris'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.textSec, fontWeight: 600, borderBottom: `1px solid ${T.border}`, fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 20).map((b, i) => (
                  <tr key={b.id} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                    <td style={{ padding: '7px 10px', fontWeight: 600, fontSize: 11, fontFamily: T.fontMono }}>{b.name}</td>
                    <td style={{ padding: '7px 10px', fontSize: 11 }}>{b.country}</td>
                    <td style={{ padding: '7px 10px', fontFamily: T.fontMono }}>{b.issuanceYear}</td>
                    <td style={{ padding: '7px 10px', fontFamily: T.fontMono, color: T.green }}>{b.size.toFixed(2)}</td>
                    <td style={{ padding: '7px 10px', fontSize: 11 }}>{b.currency}</td>
                    <td style={{ padding: '7px 10px', fontFamily: T.fontMono }}>{b.tenor}</td>
                    <td style={{ padding: '7px 10px', fontFamily: T.fontMono, color: b.greenium > 5 ? T.green : b.greenium > 0 ? T.amber : T.textSec }}>{b.greenium > 0 ? '+' : ''}{b.greenium.toFixed(1)}</td>
                    <td style={{ padding: '7px 10px', fontSize: 10 }}><span style={{ background: T.indigo + '20', color: T.indigo, padding: '2px 5px', borderRadius: 4 }}>{b.useOfProceeds.split(' ')[0]}</span></td>
                    <td style={{ padding: '7px 10px', fontSize: 11 }}>{b.verifier}</td>
                    <td style={{ padding: '7px 10px', fontFamily: T.fontMono, color: b.oversubscription >= 3 ? T.green : T.textPri }}>{b.oversubscription.toFixed(1)}×</td>
                    <td style={{ padding: '7px 10px', textAlign: 'center' }}><span style={{ color: b.parisAligned ? T.green : T.textSec }}>{b.parisAligned ? '✓' : '—'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length > 20 && <div style={{ padding: '10px 16px', fontSize: 12, color: T.textSec, background: T.sub }}>Showing 20 of {filtered.length} bonds</div>}
          </div>
        )}

        {tab === 1 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 16, color: T.navy }}>Cumulative Sovereign Green Bond Issuance ($Bn)</div>
            <ResponsiveContainer width="100%" height={360}>
              <AreaChart data={cumIssuanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="Bn" />
                <Tooltip formatter={v => `$${v}Bn`} />
                <Legend />
                <Area type="monotone" dataKey="cumulative" stroke={T.green} fill={T.green + '30'} name="Cumulative ($Bn)" />
                <Bar dataKey="annual" fill={T.teal} name="Annual ($Bn)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 2 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 16, color: T.navy }}>Average Greenium by Use of Proceeds (bps)</div>
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={PROCEEDS.map(p => ({ proceeds: p.split(' ')[0], avgGreenium: +(filtered.filter(b => b.useOfProceeds === p).reduce((a, b) => a + b.greenium, 0) / Math.max(1, filtered.filter(b => b.useOfProceeds === p).length)).toFixed(2) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="proceeds" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="bps" />
                <Tooltip formatter={v => `${v}bps`} />
                <Bar dataKey="avgGreenium" name="Avg Greenium" radius={[4, 4, 0, 0]}>
                  {PROCEEDS.map((_, i) => <React.Fragment key={i} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 3 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 16, color: T.navy }}>Issuance Volume by Region ($Bn)</div>
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={issuanceByRegion}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="region" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="Bn" />
                <Tooltip formatter={v => `$${v}Bn`} />
                <Bar dataKey="volume" fill={T.indigo} name="Issuance Volume" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ marginTop: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {PROCEEDS.map(p => {
                const count = filtered.filter(b => b.useOfProceeds === p).length;
                const vol = filtered.filter(b => b.useOfProceeds === p).reduce((a, b) => a + b.size, 0);
                return (
                  <div key={p} style={{ background: T.sub, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 14px', flex: 1, minWidth: 120 }}>
                    <div style={{ fontSize: 11, color: T.textSec }}>{p}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: T.navy, fontFamily: T.fontMono }}>${vol.toFixed(1)}Bn</div>
                    <div style={{ fontSize: 11, color: T.textSec }}>{count} bonds</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 4 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 16, color: T.navy }}>Tenor Distribution — Bond Count & Volume</div>
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={tenorData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="tenor" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} unit="Bn" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="count" fill={T.navy} name="Bond Count" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="volume" fill={T.gold} name="Volume ($Bn)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 5 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 16, color: T.navy }}>Verifier Landscape — Bonds & Volume</div>
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={verifierData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="verifier" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} unit="Bn" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="count" fill={T.blue} name="Bond Count" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="volume" fill={T.teal} name="Volume ($Bn)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 6 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 16, color: T.navy }}>Bond Size vs Oversubscription</div>
            <ResponsiveContainer width="100%" height={380}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="x" name="Size ($Bn)" label={{ value: 'Bond Size ($Bn)', position: 'insideBottom', offset: -5, fontSize: 11 }} />
                <YAxis dataKey="y" name="Oversubscription (×)" label={{ value: 'Oversubscription (×)', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ payload }) => payload?.[0] ? (
                  <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: '8px 12px', fontSize: 12, borderRadius: 6 }}>
                    <div style={{ fontWeight: 700 }}>{payload[0].payload.name}</div>
                    <div>Size: ${payload[0].payload.x}Bn</div>
                    <div>Oversubscription: {payload[0].payload.y}×</div>
                  </div>
                ) : null} />
                <Scatter data={sizeVsOversubScatter} fill={T.purple} fillOpacity={0.7} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 7 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, marginBottom: 16, color: T.navy }}>Paris Alignment Status</div>
              <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
                <div style={{ flex: 1, background: T.sub, borderRadius: 8, padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: T.green }}>{filtered.filter(b => b.parisAligned).length}</div>
                  <div style={{ fontSize: 12, color: T.textSec }}>Paris Aligned</div>
                </div>
                <div style={{ flex: 1, background: T.sub, borderRadius: 8, padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: T.blue }}>{filtered.filter(b => b.secondPartyOpinion).length}</div>
                  <div style={{ fontSize: 12, color: T.textSec }}>SPO</div>
                </div>
                <div style={{ flex: 1, background: T.sub, borderRadius: 8, padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: T.teal }}>{filtered.filter(b => b.postIssuanceReport).length}</div>
                  <div style={{ fontSize: 12, color: T.textSec }}>Post-Issuance Reports</div>
                </div>
              </div>
              {filtered.filter(b => b.parisAligned).slice(0, 8).map(b => (
                <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{b.country}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ fontSize: 11, color: T.textSec }}>{b.issuanceYear}</span>
                    <span style={{ fontSize: 11, fontFamily: T.fontMono, color: T.green }}>${b.size.toFixed(2)}Bn</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, marginBottom: 16, color: T.navy }}>Top Greenium Bonds (bps)</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[...filtered].sort((a, b) => b.greenium - a.greenium).slice(0, 12).map(b => ({ name: `${b.country.slice(0, 6)}-${b.issuanceYear}`, greenium: b.greenium }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 11 }} unit="bps" />
                  <Tooltip formatter={v => `${v}bps`} />
                  <Bar dataKey="greenium" fill={T.sage} name="Greenium (bps)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
