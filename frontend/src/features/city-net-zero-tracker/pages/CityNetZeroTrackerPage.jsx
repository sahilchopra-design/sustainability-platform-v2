import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, LineChart, Line, Legend,
} from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f6f4f0',
  navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f',
  teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c',
  surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace',
};

const REGIONS = ['North America', 'Europe', 'Asia-Pacific', 'Latin America', 'Middle East & Africa'];
const SECTOR_OPTIONS = ['Buildings', 'Transport', 'Waste', 'Energy', 'Industry'];
const TARGET_BUCKETS = ['2030', '2035', '2040', '2050'];

const CITY_NAMES = [
  'London', 'Paris', 'Amsterdam', 'Copenhagen', 'Stockholm',
  'Oslo', 'Helsinki', 'Vienna', 'Zurich', 'Berlin',
  'Munich', 'Hamburg', 'Barcelona', 'Madrid', 'Rome',
  'Milan', 'Lisbon', 'Brussels', 'Rotterdam', 'Warsaw',
  'New York City', 'Los Angeles', 'Chicago', 'San Francisco', 'Seattle',
  'Boston', 'Washington DC', 'Portland', 'Austin', 'Denver',
  'Toronto', 'Vancouver', 'Montreal', 'Ottawa', 'Calgary',
  'Sydney', 'Melbourne', 'Brisbane', 'Auckland', 'Wellington',
  'Tokyo', 'Seoul', 'Singapore', 'Hong Kong', 'Taipei',
  'Shanghai', 'Beijing', 'Guangzhou', 'Shenzhen', 'Hangzhou',
  'Mumbai', 'Bangalore', 'Delhi', 'Chennai', 'Hyderabad',
  'São Paulo', 'Rio de Janeiro', 'Curitiba', 'Bogotá', 'Lima',
  'Santiago', 'Buenos Aires', 'Mexico City', 'Montevideo', 'Medellín',
  'Nairobi', 'Cape Town', 'Durban', 'Accra', 'Addis Ababa',
  'Dubai', 'Abu Dhabi', 'Amman', 'Casablanca', 'Kigali',
];

const CITIES = Array.from({ length: 75 }, (_, i) => {
  const region = REGIONS[i % REGIONS.length];
  const pop = +(0.3 + sr(i * 3) * 19.7).toFixed(1);
  const tgtYr = [2030, 2035, 2040, 2050][Math.floor(sr(i * 7) * 4)];
  const baseline = +(2 + sr(i * 11) * 28).toFixed(1);
  const redPct = +(10 + sr(i * 13) * 60).toFixed(1);
  const current = +(baseline * (1 - redPct / 100)).toFixed(2);
  const onTrack = sr(i * 17) > 0.4;
  const sectorCount = 2 + Math.floor(sr(i * 19) * 4);
  const sectors = SECTOR_OPTIONS.slice(0, sectorCount);
  const offsetReliance = +(5 + sr(i * 23) * 45).toFixed(1);
  const finGap = +(0.5 + sr(i * 29) * 19.5).toFixed(1);
  const implScore = Math.round(20 + sr(i * 31) * 80);
  const c40 = sr(i * 37) > 0.5;
  const rtz = sr(i * 41) > 0.35;
  const tgtBucket = String(tgtYr);
  return {
    id: i,
    name: CITY_NAMES[i] || `City ${i + 1}`,
    country: region.split(' ').pop(),
    region,
    population: pop,
    netZeroTargetYear: tgtYr,
    targetBucket: tgtBucket,
    baselineEmissions: baseline,
    currentEmissions: current,
    reductionToDate: redPct,
    onTrack,
    sectorCoverage: sectors,
    carbonOffsetReliance: offsetReliance,
    financeGap: finGap,
    implementationScore: implScore,
    c40Member: c40,
    raceToZero: rtz,
  };
});

const TABS = [
  'City Overview', 'Net Zero Targets', 'Emissions Reduction Progress',
  'Sector Coverage', 'On-Track Analysis', 'Finance Gap',
  'C40 & Race to Zero', 'Implementation Scoring',
];

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px', flex: 1, minWidth: 180 }}>
    <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 700, color: color || T.navy }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{sub}</div>}
  </div>
);

export default function CityNetZeroTrackerPage() {
  const [tab, setTab] = useState(0);
  const [filterRegion, setFilterRegion] = useState('All');
  const [filterOnTrack, setFilterOnTrack] = useState('All');
  const [filterC40, setFilterC40] = useState('All');
  const [filterTargetBucket, setFilterTargetBucket] = useState('All');
  const [finMobilisation, setFinMobilisation] = useState(5);
  const [offsetLimit, setOffsetLimit] = useState(20);

  const filtered = useMemo(() => CITIES.filter(c =>
    (filterRegion === 'All' || c.region === filterRegion) &&
    (filterOnTrack === 'All' || (filterOnTrack === 'Yes' ? c.onTrack : !c.onTrack)) &&
    (filterC40 === 'All' || (filterC40 === 'Yes' ? c.c40Member : !c.c40Member)) &&
    (filterTargetBucket === 'All' || c.targetBucket === filterTargetBucket)
  ), [filterRegion, filterOnTrack, filterC40, filterTargetBucket]);

  const totalCities = filtered.length;
  const avgReduction = filtered.length ? (filtered.reduce((s, c) => s + c.reductionToDate, 0) / filtered.length).toFixed(1) : '0';
  const onTrackPct = filtered.length ? (filtered.filter(c => c.onTrack).length / filtered.length * 100).toFixed(0) : '0';
  const totalFinGap = filtered.reduce((s, c) => s + c.financeGap, 0).toFixed(1);

  const topReduction = [...filtered].sort((a, b) => b.reductionToDate - a.reductionToDate).slice(0, 20)
    .map(c => ({ name: c.name.split(' ')[0], reduction: c.reductionToDate, onTrack: c.onTrack ? 1 : 0 }));

  const scatterImpl = filtered.map(c => ({ x: c.implementationScore, y: c.financeGap, name: c.name }));

  const sectorCovData = SECTOR_OPTIONS.map(s => ({
    sector: s,
    count: filtered.filter(c => c.sectorCoverage.includes(s)).length,
    pct: filtered.length ? Math.round(filtered.filter(c => c.sectorCoverage.includes(s)).length / filtered.length * 100) : 0,
  }));

  const cumCommitments = (() => {
    const years = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024];
    let cum = 0;
    return years.map((yr, yi) => {
      cum += Math.round(filtered.length * 0.1 + sr(yi * 7) * filtered.length * 0.08);
      return { year: yr, commitments: Math.min(cum, filtered.length) };
    });
  })();

  const finGapByRegion = REGIONS.map(r => {
    const arr = filtered.filter(c => c.region === r);
    return { name: r.split(' ')[0], gap: arr.length ? +(arr.reduce((s, c) => s + c.financeGap, 0) / arr.length).toFixed(1) : 0 };
  });

  const sel = { background: T.navy, color: '#fff', border: `1px solid ${T.navy}` };
  const unsel = { background: T.card, color: T.textPri, border: `1px solid ${T.border}` };

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: T.textPri }}>
      <div style={{ background: T.navy, padding: '20px 32px', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ fontSize: 11, color: T.gold, fontFamily: T.fontMono, marginBottom: 4 }}>EP-DM6 · URBAN & CITY CLIMATE FINANCE</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>City Net Zero Tracker</div>
        <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>75 Cities · Net Zero Commitments · Emissions Progress · Finance Gap · C40 · Race to Zero</div>
      </div>

      <div style={{ padding: '24px 32px' }}>
        {/* Filters */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px', marginBottom: 20, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>Region</div>
            <select value={filterRegion} onChange={e => setFilterRegion(e.target.value)} style={{ padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 6, background: T.sub }}>
              <option>All</option>{REGIONS.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>On Track</div>
            <select value={filterOnTrack} onChange={e => setFilterOnTrack(e.target.value)} style={{ padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 6, background: T.sub }}>
              <option>All</option><option value="Yes">On Track</option><option value="No">Off Track</option>
            </select>
          </div>
          <div>
            <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>C40 Member</div>
            <select value={filterC40} onChange={e => setFilterC40(e.target.value)} style={{ padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 6, background: T.sub }}>
              <option>All</option><option value="Yes">C40 Member</option><option value="No">Non-Member</option>
            </select>
          </div>
          <div>
            <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>Target Year</div>
            <select value={filterTargetBucket} onChange={e => setFilterTargetBucket(e.target.value)} style={{ padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 6, background: T.sub }}>
              <option>All</option>{TARGET_BUCKETS.map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>Finance Mobilisation: ${finMobilisation}Bn</div>
            <input type="range" min={1} max={50} step={1} value={finMobilisation} onChange={e => setFinMobilisation(+e.target.value)} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>Offset Limit: {offsetLimit}%</div>
            <input type="range" min={0} max={50} step={5} value={offsetLimit} onChange={e => setOffsetLimit(+e.target.value)} />
          </div>
          <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono }}>{filtered.length} / {CITIES.length} cities</div>
        </div>

        {/* KPIs */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
          <KpiCard label="TOTAL CITIES TRACKED" value={totalCities} sub="with NZ commitments" color={T.navy} />
          <KpiCard label="AVG REDUCTION TO DATE" value={`${avgReduction}%`} sub="vs baseline" color={T.green} />
          <KpiCard label="% ON TRACK" value={`${onTrackPct}%`} sub="for NZ target" color={T.teal} />
          <KpiCard label="TOTAL FINANCE GAP" value={`$${totalFinGap}Bn`} sub="funding needed" color={T.red} />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap' }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)} style={{ ...i === tab ? sel : unsel, padding: '7px 14px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>{t}</button>
          ))}
        </div>

        {tab === 0 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>City Net Zero Commitment Register</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['City', 'Region', 'NZ Target', 'Baseline (Mt)', 'Current (Mt)', 'Red %', 'On Track', 'Score', 'Finance Gap ($Bn)', 'C40', 'RtZ'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: T.textSec, fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...filtered].sort((a, b) => b.reductionToDate - a.reductionToDate).slice(0, 25).map((c, i) => (
                    <tr key={c.id} style={{ borderBottom: `1px solid ${T.borderL}`, background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>{c.name}</td>
                      <td style={{ padding: '8px 12px', color: T.textSec }}>{c.region}</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.fontMono, color: c.netZeroTargetYear <= 2030 ? T.green : T.amber }}>{c.netZeroTargetYear}</td>
                      <td style={{ padding: '8px 12px' }}>{c.baselineEmissions}</td>
                      <td style={{ padding: '8px 12px' }}>{c.currentEmissions}</td>
                      <td style={{ padding: '8px 12px', fontWeight: 700, color: c.reductionToDate >= 30 ? T.green : T.textPri }}>{c.reductionToDate}%</td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{ color: c.onTrack ? T.green : T.red, fontWeight: 700 }}>{c.onTrack ? '✓' : '✗'}</span>
                      </td>
                      <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>{c.implementationScore}/100</td>
                      <td style={{ padding: '8px 12px', color: c.financeGap > 10 ? T.red : T.amber }}>${c.financeGap}</td>
                      <td style={{ padding: '8px 12px', color: c.c40Member ? T.teal : T.textSec }}>{c.c40Member ? 'C40' : '—'}</td>
                      <td style={{ padding: '8px 12px', color: c.raceToZero ? T.indigo : T.textSec }}>{c.raceToZero ? 'RtZ' : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 1 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Net Zero Target Year Distribution</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
              {TARGET_BUCKETS.map(b => {
                const arr = filtered.filter(c => c.targetBucket === b);
                return (
                  <div key={b} style={{ background: T.sub, borderRadius: 6, padding: 14, textAlign: 'center' }}>
                    <div style={{ fontSize: 12, color: T.textSec }}>Target: {b}</div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: b === '2030' ? T.green : b === '2050' ? T.amber : T.navy, marginTop: 4 }}>{arr.length}</div>
                    <div style={{ fontSize: 11, color: T.textSec }}>cities</div>
                  </div>
                );
              })}
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={REGIONS.map(r => {
                const arr = filtered.filter(c => c.region === r);
                return {
                  name: r.split(' ')[0],
                  y2030: arr.filter(c => c.targetBucket === '2030').length,
                  y2035: arr.filter(c => c.targetBucket === '2035').length,
                  y2040: arr.filter(c => c.targetBucket === '2040').length,
                  y2050: arr.filter(c => c.targetBucket === '2050').length,
                };
              })}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="y2030" name="2030" stackId="a" fill={T.green} />
                <Bar dataKey="y2035" name="2035" stackId="a" fill={T.teal} />
                <Bar dataKey="y2040" name="2040" stackId="a" fill={T.amber} />
                <Bar dataKey="y2050" name="2050" stackId="a" fill={T.red} radius={[4, 4, 0, 0]} />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 2 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Emissions Reduction Progress — Top 20 Cities</div>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={topReduction}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={v => typeof v === 'number' && v <= 1 ? (v === 1 ? 'On Track' : 'Off Track') : `${v}%`} />
                <Bar dataKey="reduction" name="Reduction %" fill={T.green} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 3 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Sector Coverage Breadth</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sectorCovData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="sector" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="Cities covering sector" fill={T.indigo} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Sector Coverage Summary</div>
              {sectorCovData.map(s => (
                <div key={s.sector} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{s.sector}</span>
                    <span style={{ fontSize: 13, fontFamily: T.fontMono, color: T.teal }}>{s.pct}% · {s.count} cities</span>
                  </div>
                  <div style={{ background: T.borderL, borderRadius: 4, height: 8 }}>
                    <div style={{ width: `${s.pct}%`, background: T.teal, borderRadius: 4, height: 8 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 4 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>On-Track Analysis by Region</div>
              {REGIONS.map(r => {
                const arr = filtered.filter(c => c.region === r);
                const pct = arr.length ? Math.round(arr.filter(c => c.onTrack).length / arr.length * 100) : 0;
                return (
                  <div key={r} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13 }}>{r}</span>
                      <span style={{ fontFamily: T.fontMono, fontSize: 13, color: pct >= 50 ? T.green : T.red }}>{pct}% on track</span>
                    </div>
                    <div style={{ background: T.borderL, borderRadius: 4, height: 8 }}>
                      <div style={{ width: `${pct}%`, background: pct >= 50 ? T.green : T.red, borderRadius: 4, height: 8 }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Offset Reliance — High Risk (>{offsetLimit}%)</div>
              <div style={{ overflowY: 'auto', maxHeight: 280 }}>
                {filtered.filter(c => c.carbonOffsetReliance > offsetLimit).sort((a, b) => b.carbonOffsetReliance - a.carbonOffsetReliance).map(c => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${T.borderL}` }}>
                    <span style={{ fontSize: 12 }}>{c.name}</span>
                    <span style={{ fontFamily: T.fontMono, fontSize: 12, color: T.amber }}>{c.carbonOffsetReliance}% offset</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 5 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Avg Finance Gap by Region ($Bn)</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={finGapByRegion}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={v => `$${v}Bn`} />
                  <Bar dataKey="gap" fill={T.red} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Implementation Score vs Finance Gap</div>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="x" name="Impl Score" tick={{ fontSize: 11 }} label={{ value: 'Implementation Score', position: 'insideBottom', offset: -5 }} />
                  <YAxis dataKey="y" name="Finance Gap ($Bn)" tick={{ fontSize: 11 }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter data={scatterImpl} fill={T.amber} opacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
              <div style={{ marginTop: 12, background: T.sub, borderRadius: 6, padding: 10, fontSize: 12, color: T.textSec }}>
                Finance mobilisation of ${finMobilisation}Bn would close gap for {filtered.filter(c => c.financeGap <= finMobilisation).length} cities ({filtered.length ? Math.round(filtered.filter(c => c.financeGap <= finMobilisation).length / filtered.length * 100) : 0}%)
              </div>
            </div>
          </div>
        )}

        {tab === 6 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>C40 Cities — {filtered.filter(c => c.c40Member).length} members</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {filtered.filter(c => c.c40Member).map(c => (
                  <span key={c.id} style={{ background: T.teal + '20', color: T.teal, padding: '4px 10px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{c.name}</span>
                ))}
              </div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Race to Zero — {filtered.filter(c => c.raceToZero).length} signatories</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {filtered.filter(c => c.raceToZero).map(c => (
                  <span key={c.id} style={{ background: T.indigo + '15', color: T.indigo, padding: '4px 10px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{c.name}</span>
                ))}
              </div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, gridColumn: '1 / -1' }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Cumulative City NZ Commitments by Year</div>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={cumCommitments}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="commitments" stroke={T.navy} strokeWidth={2} dot={{ fill: T.navy }} name="Cumulative Commitments" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 7 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Implementation Score Rankings</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[...filtered].sort((a, b) => b.implementationScore - a.implementationScore).slice(0, 18).map((c, i) => (
                <div key={c.id} style={{
                  background: i < 3 ? T.gold + '15' : T.sub,
                  border: `1px solid ${i < 3 ? T.gold : T.border}`,
                  borderRadius: 6, padding: 14,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, fontFamily: T.fontMono, color: c.implementationScore >= 70 ? T.green : T.amber }}>{c.implementationScore}</div>
                  </div>
                  <div style={{ fontSize: 11, color: T.textSec, marginBottom: 6 }}>{c.region}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10, background: c.onTrack ? T.green + '20' : T.red + '15', color: c.onTrack ? T.green : T.red, padding: '2px 6px', borderRadius: 3 }}>{c.onTrack ? 'On Track' : 'Off Track'}</span>
                    {c.c40Member && <span style={{ fontSize: 10, background: T.teal + '20', color: T.teal, padding: '2px 6px', borderRadius: 3 }}>C40</span>}
                    {c.raceToZero && <span style={{ fontSize: 10, background: T.indigo + '15', color: T.indigo, padding: '2px 6px', borderRadius: 3 }}>RtZ</span>}
                  </div>
                  <div style={{ marginTop: 6, display: 'flex', gap: 10 }}>
                    <span style={{ fontSize: 11, color: T.green }}>-{c.reductionToDate}%</span>
                    <span style={{ fontSize: 11, color: T.red }}>gap: ${c.financeGap}Bn</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
