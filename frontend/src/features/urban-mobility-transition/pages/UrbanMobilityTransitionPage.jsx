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
const TRANSITION_LEVELS = ['Early', 'Developing', 'Advanced', 'Leader'];

const CITY_NAMES = [
  'Oslo', 'Amsterdam', 'Copenhagen', 'Zurich', 'Stockholm',
  'Vienna', 'Helsinki', 'Berlin', 'Paris', 'London',
  'Rotterdam', 'Antwerp', 'Brussels', 'Lyon', 'Barcelona',
  'Madrid', 'Lisbon', 'Milan', 'Munich', 'Frankfurt',
  'Seoul', 'Tokyo', 'Singapore', 'Shanghai', 'Shenzhen',
  'Beijing', 'Hangzhou', 'Taipei', 'Hong Kong', 'Osaka',
  'San Francisco', 'Los Angeles', 'New York', 'Chicago', 'Seattle',
  'Portland', 'Boston', 'Denver', 'Toronto', 'Vancouver',
  'Sydney', 'Melbourne', 'Auckland', 'Brisbane', 'Perth',
  'São Paulo', 'Curitiba', 'Bogotá', 'Medellín', 'Santiago',
  'Buenos Aires', 'Lima', 'Mexico City', 'Guadalajara', 'Monterrey',
  'Nairobi', 'Cape Town', 'Lagos', 'Accra', 'Kigali',
  'Dubai', 'Abu Dhabi', 'Riyadh', 'Doha', 'Kuwait City',
];

const CITIES = Array.from({ length: 60 }, (_, i) => {
  const region = REGIONS[i % REGIONS.length];
  const level = TRANSITION_LEVELS[Math.floor(sr(i * 7) * 4)];
  const evShare = +(5 + sr(i * 3) * 75).toFixed(1);
  const evFleet = +(2 + sr(i * 11) * 48).toFixed(1);
  const transitShare = +(10 + sr(i * 13) * 60).toFixed(1);
  const cycling = Math.round(20 + sr(i * 17) * 980);
  const carFree = +(0.5 + sr(i * 19) * 29.5).toFixed(1);
  const congCharge = sr(i * 23) > 0.6;
  const lez = sr(i * 29) > 0.4;
  const emissions = +(0.5 + sr(i * 31) * 9.5).toFixed(2);
  const transScore = Math.round(20 + sr(i * 37) * 80);
  const chargingPts = +(5 + sr(i * 41) * 145).toFixed(0);
  const activeScore = +(2 + sr(i * 43) * 8).toFixed(1);
  const mobInv = +(0.2 + sr(i * 47) * 9.8).toFixed(1);
  const emisRed = +(5 + sr(i * 53) * 55).toFixed(1);
  return {
    id: i,
    name: CITY_NAMES[i] || `City ${i + 1}`,
    country: region.split(' ').pop(),
    region,
    transitionLevel: level,
    evShareNewSales: evShare,
    evFleetPct: evFleet,
    publicTransitShare: transitShare,
    cyclingInfraKm: cycling,
    carFreeZonesSqKm: carFree,
    congestionCharge: congCharge,
    lowEmissionZone: lez,
    transportEmissions: emissions,
    transitionScore: transScore,
    chargingPointsPer100k: +chargingPts,
    activeTransportScore: activeScore,
    mobilityInvestment: mobInv,
    emissionsReduction: emisRed,
  };
});

const TABS = [
  'City Overview', 'EV Adoption', 'Public Transit',
  'Active Mobility', 'Low Emission Zones', 'Charging Infrastructure',
  'Emissions Reduction', 'Investment Analytics',
];

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px', flex: 1, minWidth: 180 }}>
    <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 700, color: color || T.navy }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{sub}</div>}
  </div>
);

export default function UrbanMobilityTransitionPage() {
  const [tab, setTab] = useState(0);
  const [filterRegion, setFilterRegion] = useState('All');
  const [filterLevel, setFilterLevel] = useState('All');
  const [evTarget, setEvTarget] = useState(30);
  const [carbonPrice, setCarbonPrice] = useState(50);

  const filtered = useMemo(() => CITIES.filter(c =>
    (filterRegion === 'All' || c.region === filterRegion) &&
    (filterLevel === 'All' || c.transitionLevel === filterLevel)
  ), [filterRegion, filterLevel]);

  const avgEV = filtered.length ? (filtered.reduce((s, c) => s + c.evShareNewSales, 0) / filtered.length).toFixed(1) : '0';
  const avgTransit = filtered.length ? (filtered.reduce((s, c) => s + c.publicTransitShare, 0) / filtered.length).toFixed(1) : '0';
  const totalMobInv = filtered.reduce((s, c) => s + c.mobilityInvestment, 0).toFixed(1);
  const avgEmisRed = filtered.length ? (filtered.reduce((s, c) => s + c.emissionsReduction, 0) / filtered.length).toFixed(1) : '0';

  const regionEV = REGIONS.map(r => {
    const arr = filtered.filter(c => c.region === r);
    return { name: r.split(' ')[0], avgEV: arr.length ? +(arr.reduce((s, c) => s + c.evShareNewSales, 0) / arr.length).toFixed(1) : 0 };
  });

  const scatterTransit = filtered.map(c => ({ x: c.publicTransitShare, y: c.emissionsReduction, name: c.name }));

  const topCharging = [...filtered].sort((a, b) => b.chargingPointsPer100k - a.chargingPointsPer100k).slice(0, 15)
    .map(c => ({ name: c.name.split(' ')[0], charging: c.chargingPointsPer100k }));

  // Emission trend (synthetic: year 2019-2024 based on transition level progression)
  const emissionTrend = [2019, 2020, 2021, 2022, 2023, 2024].map((yr, yi) => {
    const avg = filtered.length ? filtered.reduce((s, c) => s + c.transportEmissions * (1 - yr * 0.02 * (c.transitionScore / 100)), 0) / filtered.length : 0;
    return { year: yr, avg: +avg.toFixed(2) };
  });

  const sel = { background: T.navy, color: '#fff', border: `1px solid ${T.navy}` };
  const unsel = { background: T.card, color: T.textPri, border: `1px solid ${T.border}` };

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: T.textPri }}>
      <div style={{ background: T.navy, padding: '20px 32px', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ fontSize: 11, color: T.gold, fontFamily: T.fontMono, marginBottom: 4 }}>EP-DM4 · URBAN & CITY CLIMATE FINANCE</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>Urban Mobility Transition</div>
        <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>60 Cities · EV Adoption · Public Transit · Active Mobility · LEZ · Charging Infrastructure</div>
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
            <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>Transition Level</div>
            <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)} style={{ padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 6, background: T.sub }}>
              <option>All</option>{TRANSITION_LEVELS.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>EV Adoption Target: {evTarget}%</div>
            <input type="range" min={10} max={100} step={5} value={evTarget} onChange={e => setEvTarget(+e.target.value)} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>Carbon Price: ${carbonPrice}/tCO₂</div>
            <input type="range" min={10} max={200} step={10} value={carbonPrice} onChange={e => setCarbonPrice(+e.target.value)} />
          </div>
          <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono }}>{filtered.length} / {CITIES.length} cities</div>
        </div>

        {/* KPIs */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
          <KpiCard label="AVG EV SHARE (NEW SALES)" value={`${avgEV}%`} sub="new vehicle sales" color={T.green} />
          <KpiCard label="AVG TRANSIT SHARE" value={`${avgTransit}%`} sub="modal share" color={T.teal} />
          <KpiCard label="TOTAL MOBILITY INVESTMENT" value={`$${totalMobInv}Bn`} sub="committed" color={T.navy} />
          <KpiCard label="AVG EMISSIONS REDUCTION" value={`${avgEmisRed}%`} sub="vs 2019 baseline" color={T.indigo} />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap' }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)} style={{ ...i === tab ? sel : unsel, padding: '7px 14px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>{t}</button>
          ))}
        </div>

        {tab === 0 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>City Mobility Transition Overview</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['City', 'Level', 'EV Share %', 'EV Fleet %', 'Transit %', 'Score', 'Mob Inv ($Bn)', 'Emis Red %', 'LEZ', 'Cong Charge'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: T.textSec, fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...filtered].sort((a, b) => b.transitionScore - a.transitionScore).slice(0, 25).map((c, i) => (
                    <tr key={c.id} style={{ borderBottom: `1px solid ${T.borderL}`, background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>{c.name}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{ background: c.transitionLevel === 'Leader' ? T.green + '20' : T.indigo + '15', color: c.transitionLevel === 'Leader' ? T.green : T.indigo, padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>{c.transitionLevel}</span>
                      </td>
                      <td style={{ padding: '8px 12px', fontFamily: T.fontMono, color: c.evShareNewSales >= evTarget ? T.green : T.textPri }}>{c.evShareNewSales}%</td>
                      <td style={{ padding: '8px 12px' }}>{c.evFleetPct}%</td>
                      <td style={{ padding: '8px 12px', color: T.teal }}>{c.publicTransitShare}%</td>
                      <td style={{ padding: '8px 12px', fontWeight: 700 }}>{c.transitionScore}</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>${c.mobilityInvestment}</td>
                      <td style={{ padding: '8px 12px', color: T.green }}>{c.emissionsReduction}%</td>
                      <td style={{ padding: '8px 12px', color: c.lowEmissionZone ? T.green : T.textSec }}>{c.lowEmissionZone ? '✓' : '✗'}</td>
                      <td style={{ padding: '8px 12px', color: c.congestionCharge ? T.teal : T.textSec }}>{c.congestionCharge ? '✓' : '✗'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 1 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Avg EV Share (New Sales) by Region (%)</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={regionEV}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={v => `${v}%`} />
                  <Bar dataKey="avgEV" fill={T.green} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>EV Target Gap Analysis ({evTarget}% target)</div>
              <div style={{ overflowY: 'auto', maxHeight: 300 }}>
                {[...filtered].sort((a, b) => b.evShareNewSales - a.evShareNewSales).slice(0, 20).map(c => {
                  const gap = evTarget - c.evShareNewSales;
                  return (
                    <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.borderL}` }}>
                      <span style={{ fontSize: 12 }}>{c.name}</span>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <span style={{ fontFamily: T.fontMono, fontSize: 12, color: c.evShareNewSales >= evTarget ? T.green : T.amber }}>{c.evShareNewSales}%</span>
                        {gap > 0 && <span style={{ fontSize: 11, color: T.red }}>gap: {gap.toFixed(1)}%</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {tab === 2 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Transit Share vs Emissions Reduction</div>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="x" name="Transit Share (%)" tick={{ fontSize: 11 }} label={{ value: 'Transit Share (%)', position: 'insideBottom', offset: -5 }} />
                  <YAxis dataKey="y" name="Emis Red (%)" tick={{ fontSize: 11 }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter data={scatterTransit} fill={T.teal} opacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Top Transit Cities</div>
              {[...filtered].sort((a, b) => b.publicTransitShare - a.publicTransitShare).slice(0, 12).map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <span style={{ fontSize: 12 }}>{c.name}</span>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <span style={{ fontFamily: T.fontMono, fontSize: 12, color: T.teal }}>{c.publicTransitShare}% transit</span>
                    <span style={{ fontSize: 12, color: T.green }}>-{c.emissionsReduction}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 3 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Cycling Infrastructure (km) — Top 20 Cities</div>
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={[...filtered].sort((a, b) => b.cyclingInfraKm - a.cyclingInfraKm).slice(0, 20).map(c => ({ name: c.name.split(' ')[0], cycling: c.cyclingInfraKm, activeScore: c.activeTransportScore * 100 }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 1000]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar yAxisId="left" dataKey="cycling" name="Cycling km" fill={T.sage} radius={[4, 4, 0, 0]} />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 4 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Low Emission Zone & Congestion Charge Adoption</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 13, color: T.textSec, marginBottom: 8 }}>LEZ Adoption by Region</div>
                {REGIONS.map(r => {
                  const arr = filtered.filter(c => c.region === r);
                  const pct = arr.length ? Math.round(arr.filter(c => c.lowEmissionZone).length / arr.length * 100) : 0;
                  return (
                    <div key={r} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ fontSize: 12 }}>{r.split(' ')[0]}</span>
                        <span style={{ fontSize: 12, fontFamily: T.fontMono, color: T.teal }}>{pct}%</span>
                      </div>
                      <div style={{ background: T.borderL, borderRadius: 4, height: 6 }}>
                        <div style={{ width: `${pct}%`, background: T.teal, borderRadius: 4, height: 6 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div>
                <div style={{ fontSize: 13, color: T.textSec, marginBottom: 8 }}>Congestion Charge Cities</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {filtered.filter(c => c.congestionCharge).map(c => (
                    <span key={c.id} style={{ background: T.indigo + '15', color: T.indigo, padding: '4px 10px', borderRadius: 4, fontSize: 11 }}>{c.name}</span>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ background: T.sub, borderRadius: 6, padding: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Carbon Price Impact on LEZ Revenue</div>
              <div style={{ fontSize: 12, color: T.textSec }}>At ${carbonPrice}/tCO₂, estimated annual LEZ revenue uplift per city: <strong style={{ color: T.green }}>${(carbonPrice * 0.15).toFixed(0)}M/yr</strong></div>
            </div>
          </div>
        )}

        {tab === 5 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>EV Charging Points per 100k Residents — Top 15</div>
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={topCharging}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={v => `${v} per 100k`} />
                <Bar dataKey="charging" fill={T.amber} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 6 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Transport Emissions Reduction Trend</div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={emissionTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={v => `${v} MtCO₂/yr`} />
                  <Line type="monotone" dataKey="avg" stroke={T.green} strokeWidth={2} dot={{ fill: T.green }} name="Avg Emissions" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Top Cities by Emissions Reduction (%)</div>
              {[...filtered].sort((a, b) => b.emissionsReduction - a.emissionsReduction).slice(0, 12).map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <span style={{ fontSize: 12 }}>{c.name}</span>
                  <span style={{ fontFamily: T.fontMono, fontSize: 12, color: T.green }}>-{c.emissionsReduction}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 7 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Mobility Investment by Transition Level ($Bn)</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                {TRANSITION_LEVELS.map(level => {
                  const arr = filtered.filter(c => c.transitionLevel === level);
                  const inv = arr.reduce((s, c) => s + c.mobilityInvestment, 0).toFixed(1);
                  return (
                    <div key={level} style={{ marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{level}</span>
                        <span style={{ fontSize: 13, fontFamily: T.fontMono, color: T.navy }}>${inv}Bn · {arr.length} cities</span>
                      </div>
                      <div style={{ background: T.borderL, borderRadius: 4, height: 10 }}>
                        <div style={{ width: `${Math.min(100, +inv * 3)}%`, background: T.navy, borderRadius: 4, height: 10 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Investment Returns Scenario</div>
                <div style={{ background: T.sub, borderRadius: 6, padding: 12, marginBottom: 8 }}>
                  <div style={{ fontSize: 12, color: T.textSec }}>Carbon Price: ${carbonPrice}/tCO₂</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: T.green, marginTop: 4 }}>
                    ${(filtered.reduce((s, c) => s + c.emissionsReduction * carbonPrice * 0.01, 0)).toFixed(0)}M
                  </div>
                  <div style={{ fontSize: 11, color: T.textSec }}>estimated annual carbon value created</div>
                </div>
                <div style={{ background: T.sub, borderRadius: 6, padding: 12 }}>
                  <div style={{ fontSize: 12, color: T.textSec }}>Cities meeting EV target ({evTarget}%)</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: T.teal, marginTop: 4 }}>
                    {filtered.filter(c => c.evShareNewSales >= evTarget).length} / {filtered.length}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
