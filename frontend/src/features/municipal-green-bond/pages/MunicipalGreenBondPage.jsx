import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, ScatterChart, Scatter, Legend,
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
const USE_OF_PROCEEDS = ['Transport', 'Buildings', 'Water', 'Energy', 'Adaptation', 'Biodiversity'];
const CERT_BODIES = ['CICERO', 'Sustainalytics', 'S&P DJI', 'Vigeo Eiris', 'ISS ESG'];
const RATINGS = ['AAA', 'AA+', 'AA', 'AA-', 'A+', 'A', 'A-', 'BBB+', 'BBB'];

const CITY_NAMES = [
  'New York City', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix',
  'London', 'Paris', 'Berlin', 'Amsterdam', 'Stockholm',
  'Copenhagen', 'Vienna', 'Zurich', 'Oslo', 'Helsinki',
  'Tokyo', 'Seoul', 'Singapore', 'Sydney', 'Melbourne',
  'Toronto', 'Vancouver', 'Montreal', 'Mexico City', 'São Paulo',
  'Buenos Aires', 'Bogotá', 'Lima', 'Santiago', 'Rio de Janeiro',
  'Dubai', 'Abu Dhabi', 'Riyadh', 'Cape Town', 'Nairobi',
  'Mumbai', 'Bangalore', 'Delhi', 'Shanghai', 'Beijing',
  'Hong Kong', 'Osaka', 'Taipei', 'Bangkok', 'Jakarta',
  'Barcelona', 'Madrid', 'Rome', 'Milan', 'Brussels',
  'Warsaw', 'Prague', 'Budapest', 'Lisbon', 'Athens',
  'Johannesburg', 'Lagos', 'Accra', 'Dar es Salaam', 'Addis Ababa',
  'Casablanca', 'Cairo', 'Karachi', 'Dhaka', 'Colombo',
  'Kuala Lumpur', 'Manila', 'Ho Chi Minh City', 'Hanoi', 'Phnom Penh',
];

const BONDS = Array.from({ length: 70 }, (_, i) => {
  const region = REGIONS[i % REGIONS.length];
  const use = USE_OF_PROCEEDS[i % USE_OF_PROCEEDS.length];
  const cert = CERT_BODIES[Math.floor(sr(i * 7) * CERT_BODIES.length)];
  const rating = RATINGS[Math.floor(sr(i * 11) * RATINGS.length)];
  const year = 2018 + Math.floor(sr(i * 13) * 7);
  const size = Math.round(50 + sr(i * 3) * 1950);
  const tenor = Math.round(5 + sr(i * 17) * 25);
  const greenium = +(sr(i * 19) * 12).toFixed(1);
  const osub = +(1.5 + sr(i * 23) * 8.5).toFixed(1);
  const projects = Math.round(3 + sr(i * 29) * 47);
  const co2 = Math.round(10 + sr(i * 31) * 990);
  const jobs = +(0.5 + sr(i * 37) * 19.5).toFixed(1);
  const pop = +(0.1 + sr(i * 41) * 4.9).toFixed(2);
  return {
    id: i,
    cityName: CITY_NAMES[i] || `City ${i + 1}`,
    country: region.split(' ').pop(),
    region,
    issuanceSize: size,
    year,
    useOfProceeds: use,
    tenor,
    creditRating: rating,
    greenium,
    certificationBody: cert,
    oversubscription: osub,
    projectsFinanced: projects,
    estimatedCO2Saving: co2,
    jobsCreated: jobs,
    populationServed: pop,
  };
});

const TABS = [
  'Bond Overview', 'Use of Proceeds', 'Greenium Analysis',
  'Geographic Distribution', 'Credit Quality', 'Project Impact',
  'Jobs & People Served', 'Issuance Trends',
];

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px', flex: 1, minWidth: 180 }}>
    <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 700, color: color || T.navy }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{sub}</div>}
  </div>
);

export default function MunicipalGreenBondPage() {
  const [tab, setTab] = useState(0);
  const [filterRegion, setFilterRegion] = useState('All');
  const [filterUse, setFilterUse] = useState('All');
  const [filterYear, setFilterYear] = useState('All');
  const [minSize, setMinSize] = useState(0);
  const [minGreenium, setMinGreenium] = useState(0);

  const filtered = useMemo(() => BONDS.filter(b =>
    (filterRegion === 'All' || b.region === filterRegion) &&
    (filterUse === 'All' || b.useOfProceeds === filterUse) &&
    (filterYear === 'All' || b.year === +filterYear) &&
    b.issuanceSize >= minSize &&
    b.greenium >= minGreenium
  ), [filterRegion, filterUse, filterYear, minSize, minGreenium]);

  const totalVolume = filtered.reduce((s, b) => s + b.issuanceSize, 0);
  const avgGreenium = filtered.length ? (filtered.reduce((s, b) => s + b.greenium, 0) / filtered.length).toFixed(1) : '0.0';
  const totalCO2 = filtered.reduce((s, b) => s + b.estimatedCO2Saving, 0);
  const totalJobs = filtered.reduce((s, b) => s + b.jobsCreated, 0).toFixed(1);

  const useData = USE_OF_PROCEEDS.map(u => ({
    name: u,
    volume: filtered.filter(b => b.useOfProceeds === u).reduce((s, b) => s + b.issuanceSize, 0),
    count: filtered.filter(b => b.useOfProceeds === u).length,
  }));

  const regionGreenium = REGIONS.map(r => ({
    name: r.split(' ')[0],
    avgGreenium: (() => {
      const arr = filtered.filter(b => b.region === r);
      return arr.length ? +(arr.reduce((s, b) => s + b.greenium, 0) / arr.length).toFixed(1) : 0;
    })(),
  }));

  const scatterData = filtered.map(b => ({ x: b.issuanceSize, y: b.estimatedCO2Saving, name: b.cityName }));

  const cumulTrend = (() => {
    const years = [2018, 2019, 2020, 2021, 2022, 2023, 2024];
    let cum = 0;
    return years.map(yr => {
      cum += filtered.filter(b => b.year === yr).reduce((s, b) => s + b.issuanceSize, 0);
      return { year: yr, cumulative: cum };
    });
  })();

  const ratingData = [...new Set(BONDS.map(b => b.creditRating))].map(r => ({
    rating: r,
    count: filtered.filter(b => b.creditRating === r).length,
  })).filter(d => d.count > 0);

  const sel = { background: T.navy, color: '#fff', border: `1px solid ${T.navy}` };
  const unsel = { background: T.card, color: T.textPri, border: `1px solid ${T.border}` };

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: T.textPri }}>
      {/* Header */}
      <div style={{ background: T.navy, padding: '20px 32px', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ fontSize: 11, color: T.gold, fontFamily: T.fontMono, marginBottom: 4 }}>EP-DM1 · URBAN & CITY CLIMATE FINANCE</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>Municipal Green Bond Analytics</div>
        <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>70 Issuances · Use of Proceeds · Greenium · Project Impact · Geographic Distribution</div>
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
            <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>Use of Proceeds</div>
            <select value={filterUse} onChange={e => setFilterUse(e.target.value)} style={{ padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 6, background: T.sub }}>
              <option>All</option>{USE_OF_PROCEEDS.map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>Year</div>
            <select value={filterYear} onChange={e => setFilterYear(e.target.value)} style={{ padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 6, background: T.sub }}>
              <option>All</option>{[2018,2019,2020,2021,2022,2023,2024].map(y => <option key={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>Min Size: ${minSize}M</div>
            <input type="range" min={0} max={1000} step={50} value={minSize} onChange={e => setMinSize(+e.target.value)} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>Min Greenium: {minGreenium}bps</div>
            <input type="range" min={0} max={10} step={0.5} value={minGreenium} onChange={e => setMinGreenium(+e.target.value)} />
          </div>
          <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono }}>
            {filtered.length} / {BONDS.length} bonds
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
          <KpiCard label="TOTAL ISSUANCE VOLUME" value={`$${(totalVolume / 1000).toFixed(1)}Bn`} sub={`${filtered.length} bonds`} color={T.navy} />
          <KpiCard label="AVG GREENIUM" value={`${avgGreenium} bps`} sub="vs conventional" color={T.green} />
          <KpiCard label="TOTAL CO₂ SAVINGS" value={`${(totalCO2 / 1000).toFixed(1)} MtCO₂/yr`} sub="estimated" color={T.teal} />
          <KpiCard label="TOTAL JOBS CREATED" value={`${totalJobs}k`} sub="green jobs" color={T.indigo} />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap' }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)} style={{ ...i === tab ? sel : unsel, padding: '7px 14px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>{t}</button>
          ))}
        </div>

        {/* Tab Content */}
        {tab === 0 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Bond Portfolio Overview</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['City', 'Region', 'Size ($M)', 'Year', 'Use of Proceeds', 'Rating', 'Tenor (yr)', 'Greenium (bps)', 'Cert Body'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: T.textSec, fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 25).map((b, i) => (
                    <tr key={b.id} style={{ borderBottom: `1px solid ${T.borderL}`, background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>{b.cityName}</td>
                      <td style={{ padding: '8px 12px', color: T.textSec }}>{b.region}</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>${b.issuanceSize.toLocaleString()}</td>
                      <td style={{ padding: '8px 12px' }}>{b.year}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{ background: T.indigo + '20', color: T.indigo, padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>{b.useOfProceeds}</span>
                      </td>
                      <td style={{ padding: '8px 12px', fontFamily: T.fontMono, color: T.green }}>{b.creditRating}</td>
                      <td style={{ padding: '8px 12px' }}>{b.tenor}yr</td>
                      <td style={{ padding: '8px 12px', color: b.greenium > 5 ? T.green : T.textPri }}>{b.greenium} bps</td>
                      <td style={{ padding: '8px 12px', color: T.textSec }}>{b.certificationBody}</td>
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
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Volume by Use of Proceeds ($M)</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={useData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={v => `$${v.toLocaleString()}M`} />
                  <Bar dataKey="volume" fill={T.teal} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Bond Count by Use of Proceeds</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={useData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill={T.indigo} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 2 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Avg Greenium by Region (bps)</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={regionGreenium}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={v => `${v} bps`} />
                  <Bar dataKey="avgGreenium" fill={T.green} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Size ($M) vs CO₂ Saving (ktCO₂/yr)</div>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="x" name="Size ($M)" tick={{ fontSize: 11 }} label={{ value: 'Size ($M)', position: 'insideBottom', offset: -5 }} />
                  <YAxis dataKey="y" name="CO₂ Saving" tick={{ fontSize: 11 }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter data={scatterData} fill={T.amber} opacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 3 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {REGIONS.map(r => {
              const arr = filtered.filter(b => b.region === r);
              const vol = arr.reduce((s, b) => s + b.issuanceSize, 0);
              return (
                <div key={r} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{r}</div>
                  <div style={{ display: 'flex', gap: 20 }}>
                    <div><div style={{ fontSize: 11, color: T.textSec }}>Bonds</div><div style={{ fontSize: 20, fontWeight: 700, color: T.navy }}>{arr.length}</div></div>
                    <div><div style={{ fontSize: 11, color: T.textSec }}>Volume</div><div style={{ fontSize: 20, fontWeight: 700, color: T.teal }}>${(vol / 1000).toFixed(1)}Bn</div></div>
                    <div><div style={{ fontSize: 11, color: T.textSec }}>Avg Size</div><div style={{ fontSize: 20, fontWeight: 700, color: T.indigo }}>${arr.length ? Math.round(vol / arr.length) : 0}M</div></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 4 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Bond Count by Credit Rating</div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={[...ratingData].sort((a, b) => b.count - a.count)}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="rating" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill={T.navy} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 5 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Top 15 Cities by CO₂ Savings (ktCO₂/yr)</div>
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={[...filtered].sort((a, b) => b.estimatedCO2Saving - a.estimatedCO2Saving).slice(0, 15).map(b => ({ name: b.cityName.split(' ')[0], co2: b.estimatedCO2Saving }))} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={80} />
                  <Tooltip formatter={v => `${v} ktCO₂/yr`} />
                  <Bar dataKey="co2" fill={T.green} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Projects Financed Summary</div>
              {filtered.slice(0, 12).map(b => (
                <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <span style={{ fontSize: 12 }}>{b.cityName}</span>
                  <span style={{ fontSize: 12, fontFamily: T.fontMono, color: T.teal }}>{b.projectsFinanced} projects · {b.estimatedCO2Saving} ktCO₂/yr</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 6 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Top Cities by Jobs Created (k)</div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={[...filtered].sort((a, b) => b.jobsCreated - a.jobsCreated).slice(0, 12).map(b => ({ name: b.cityName.split(' ')[0], jobs: b.jobsCreated }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={v => `${v}k jobs`} />
                  <Bar dataKey="jobs" fill={T.purple} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Population Served (M) — Top 12</div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={[...filtered].sort((a, b) => b.populationServed - a.populationServed).slice(0, 12).map(b => ({ name: b.cityName.split(' ')[0], pop: b.populationServed }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={v => `${v}M people`} />
                  <Bar dataKey="pop" fill={T.amber} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 7 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Cumulative Issuance Volume by Year ($M)</div>
            <ResponsiveContainer width="100%" height={340}>
              <AreaChart data={cumulTrend}>
                <defs>
                  <linearGradient id="cumGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={T.teal} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={T.teal} stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}Bn`} />
                <Tooltip formatter={v => `$${v.toLocaleString()}M`} />
                <Area type="monotone" dataKey="cumulative" stroke={T.teal} fill="url(#cumGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
