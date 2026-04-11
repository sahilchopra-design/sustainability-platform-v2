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

const REGIONS = ['North America', 'Europe', 'Asia-Pacific', 'Latin America', 'Middle East & Africa'];
const TIERS = ['Emerging', 'Developing', 'Advanced', 'Leading'];

const CITY_NAMES = [
  'Singapore', 'Amsterdam', 'Zurich', 'Oslo', 'Copenhagen',
  'Helsinki', 'Stockholm', 'Vienna', 'Seoul', 'Tokyo',
  'Barcelona', 'London', 'Paris', 'Berlin', 'New York',
  'San Francisco', 'Boston', 'Toronto', 'Sydney', 'Melbourne',
  'Dubai', 'Abu Dhabi', 'Songdo', 'Masdar City', 'Shenzhen',
  'Shanghai', 'Beijing', 'Hangzhou', 'Chengdu', 'Guangzhou',
  'Curitiba', 'Medellín', 'Bogotá', 'São Paulo', 'Buenos Aires',
  'Nairobi', 'Cape Town', 'Lagos', 'Accra', 'Kigali',
  'Tallinn', 'Vilnius', 'Riga', 'Prague', 'Warsaw',
  'Munich', 'Hamburg', 'Frankfurt', 'Lyon', 'Marseille',
  'Milan', 'Rome', 'Madrid', 'Lisbon', 'Athens',
];

const CITIES = Array.from({ length: 55 }, (_, i) => {
  const region = REGIONS[i % REGIONS.length];
  const tier = TIERS[Math.floor(sr(i * 7) * 4)];
  const pop = +(0.5 + sr(i * 3) * 19.5).toFixed(1);
  const score = Math.round(40 + sr(i * 11) * 60);
  const iot = Math.round(10 + sr(i * 13) * 490);
  const techInv = +(0.2 + sr(i * 17) * 9.8).toFixed(1);
  const carbonRed = +(5 + sr(i * 19) * 45).toFixed(1);
  const energySav = Math.round(100 + sr(i * 23) * 4900);
  const ppv = +(0.1 + sr(i * 29) * 4.9).toFixed(1);
  const resil = Math.round(30 + sr(i * 31) * 70);
  return {
    id: i,
    name: CITY_NAMES[i] || `Smart City ${i + 1}`,
    country: region.split(' ').pop(),
    region,
    population: pop,
    smartCityScore: score,
    smartCityTier: tier,
    iotSensors: iot,
    energySmartGrid: sr(i * 37) > 0.45,
    smartTransport: sr(i * 41) > 0.35,
    digitalTwinCity: sr(i * 43) > 0.6,
    climateMonitoring: sr(i * 47) > 0.3,
    smartWasteManagement: sr(i * 53) > 0.5,
    techInvestment: techInv,
    carbonReduction: carbonRed,
    energySavings: energySav,
    privatePartnershipValue: ppv,
    climateResilienceScore: resil,
  };
});

const TABS = [
  'City Overview', 'Smart Infrastructure', 'IoT & Monitoring',
  'Energy & Grid', 'Transport', 'Waste Management',
  'Investment Analytics', 'Climate Outcomes',
];

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px', flex: 1, minWidth: 180 }}>
    <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 700, color: color || T.navy }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{sub}</div>}
  </div>
);

const FeatureBadge = ({ active, label }) => (
  <span style={{
    display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
    background: active ? T.green + '20' : T.red + '15',
    color: active ? T.green : T.textSec,
    marginRight: 4, marginBottom: 2,
  }}>{active ? '✓' : '✗'} {label}</span>
);

export default function SmartCityClimateFinancePage() {
  const [tab, setTab] = useState(0);
  const [filterRegion, setFilterRegion] = useState('All');
  const [filterTier, setFilterTier] = useState('All');
  const [minTechInv, setMinTechInv] = useState(0);
  const [minCarbonRed, setMinCarbonRed] = useState(0);

  const filtered = useMemo(() => CITIES.filter(c =>
    (filterRegion === 'All' || c.region === filterRegion) &&
    (filterTier === 'All' || c.smartCityTier === filterTier) &&
    c.techInvestment >= minTechInv &&
    c.carbonReduction >= minCarbonRed
  ), [filterRegion, filterTier, minTechInv, minCarbonRed]);

  const avgScore = filtered.length ? (filtered.reduce((s, c) => s + c.smartCityScore, 0) / filtered.length).toFixed(0) : '0';
  const totalTech = filtered.reduce((s, c) => s + c.techInvestment, 0).toFixed(1);
  const avgCarbon = filtered.length ? (filtered.reduce((s, c) => s + c.carbonReduction, 0) / filtered.length).toFixed(1) : '0';
  const totalEnergy = filtered.reduce((s, c) => s + c.energySavings, 0);

  const regionScores = REGIONS.map(r => {
    const arr = filtered.filter(c => c.region === r);
    return { name: r.split(' ')[0], avgScore: arr.length ? Math.round(arr.reduce((s, c) => s + c.smartCityScore, 0) / arr.length) : 0 };
  });

  const scatterData = filtered.map(c => ({ x: c.techInvestment, y: c.carbonReduction, name: c.name }));

  const featureAdoption = [
    { feature: 'Smart Grid', pct: Math.round(filtered.filter(c => c.energySmartGrid).length / Math.max(1, filtered.length) * 100) },
    { feature: 'Smart Transport', pct: Math.round(filtered.filter(c => c.smartTransport).length / Math.max(1, filtered.length) * 100) },
    { feature: 'Digital Twin', pct: Math.round(filtered.filter(c => c.digitalTwinCity).length / Math.max(1, filtered.length) * 100) },
    { feature: 'Climate Monitor', pct: Math.round(filtered.filter(c => c.climateMonitoring).length / Math.max(1, filtered.length) * 100) },
    { feature: 'Smart Waste', pct: Math.round(filtered.filter(c => c.smartWasteManagement).length / Math.max(1, filtered.length) * 100) },
  ];

  const topEnergy = [...filtered].sort((a, b) => b.energySavings - a.energySavings).slice(0, 15)
    .map(c => ({ name: c.name.split(' ')[0], energy: c.energySavings }));

  const sel = { background: T.navy, color: '#fff', border: `1px solid ${T.navy}` };
  const unsel = { background: T.card, color: T.textPri, border: `1px solid ${T.border}` };

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: T.textPri }}>
      <div style={{ background: T.navy, padding: '20px 32px', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ fontSize: 11, color: T.gold, fontFamily: T.fontMono, marginBottom: 4 }}>EP-DM2 · URBAN & CITY CLIMATE FINANCE</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>Smart City Climate Finance</div>
        <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>55 Cities · IoT Infrastructure · Smart Grid · Digital Twin · Carbon Reduction Analytics</div>
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
            <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>Smart City Tier</div>
            <select value={filterTier} onChange={e => setFilterTier(e.target.value)} style={{ padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 6, background: T.sub }}>
              <option>All</option>{TIERS.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>Min Tech Investment: ${minTechInv}Bn</div>
            <input type="range" min={0} max={5} step={0.5} value={minTechInv} onChange={e => setMinTechInv(+e.target.value)} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>Min Carbon Reduction: {minCarbonRed}%</div>
            <input type="range" min={0} max={30} step={5} value={minCarbonRed} onChange={e => setMinCarbonRed(+e.target.value)} />
          </div>
          <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono }}>{filtered.length} / {CITIES.length} cities</div>
        </div>

        {/* KPIs */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
          <KpiCard label="AVG SMART CITY SCORE" value={`${avgScore}/100`} sub="composite index" color={T.navy} />
          <KpiCard label="TOTAL TECH INVESTMENT" value={`$${totalTech}Bn`} sub="cumulative" color={T.indigo} />
          <KpiCard label="AVG CARBON REDUCTION" value={`${avgCarbon}%`} sub="vs baseline" color={T.green} />
          <KpiCard label="TOTAL ENERGY SAVINGS" value={`${(totalEnergy / 1000).toFixed(0)} TWh/yr`} sub="smart grid gains" color={T.teal} />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap' }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)} style={{ ...i === tab ? sel : unsel, padding: '7px 14px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>{t}</button>
          ))}
        </div>

        {tab === 0 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Smart City Overview</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['City', 'Region', 'Tier', 'Score', 'Pop (M)', 'Tech Inv ($Bn)', 'Carbon Red (%)', 'IoT Sensors (k)', 'Resilience'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: T.textSec, fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...filtered].sort((a, b) => b.smartCityScore - a.smartCityScore).slice(0, 25).map((c, i) => (
                    <tr key={c.id} style={{ borderBottom: `1px solid ${T.borderL}`, background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>{c.name}</td>
                      <td style={{ padding: '8px 12px', color: T.textSec }}>{c.region}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{ background: c.smartCityTier === 'Leading' ? T.green + '20' : T.indigo + '15', color: c.smartCityTier === 'Leading' ? T.green : T.indigo, padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>{c.smartCityTier}</span>
                      </td>
                      <td style={{ padding: '8px 12px', fontFamily: T.fontMono, fontWeight: 700, color: c.smartCityScore >= 70 ? T.green : T.textPri }}>{c.smartCityScore}</td>
                      <td style={{ padding: '8px 12px' }}>{c.population}</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>${c.techInvestment}</td>
                      <td style={{ padding: '8px 12px', color: T.green }}>{c.carbonReduction}%</td>
                      <td style={{ padding: '8px 12px' }}>{c.iotSensors}k</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>{c.climateResilienceScore}/100</td>
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
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Smart Feature Adoption (%)</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={featureAdoption}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="feature" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={v => `${v}%`} />
                  <Bar dataKey="pct" fill={T.teal} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>City Feature Matrix — Top 15</div>
              <div style={{ overflowX: 'auto' }}>
                {[...filtered].sort((a, b) => b.smartCityScore - a.smartCityScore).slice(0, 15).map(c => (
                  <div key={c.id} style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 3 }}>{c.name}</div>
                    <div>
                      <FeatureBadge active={c.energySmartGrid} label="Grid" />
                      <FeatureBadge active={c.smartTransport} label="Transport" />
                      <FeatureBadge active={c.digitalTwinCity} label="Digital Twin" />
                      <FeatureBadge active={c.climateMonitoring} label="Monitor" />
                      <FeatureBadge active={c.smartWasteManagement} label="Waste" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 2 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>IoT Sensor Deployment — Top 20 Cities</div>
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={[...filtered].sort((a, b) => b.iotSensors - a.iotSensors).slice(0, 20).map(c => ({ name: c.name.split(' ')[0], iot: c.iotSensors }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v}k`} />
                <Tooltip formatter={v => `${v}k sensors`} />
                <Bar dataKey="iot" fill={T.indigo} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 3 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Energy Savings by City — Top 15 (GWh/yr)</div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={topEnergy}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={v => `${v} GWh/yr`} />
                  <Bar dataKey="energy" fill={T.amber} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Smart Grid Adoption by Region</div>
              {REGIONS.map(r => {
                const arr = filtered.filter(c => c.region === r);
                const gridPct = arr.length ? Math.round(arr.filter(c => c.energySmartGrid).length / arr.length * 100) : 0;
                return (
                  <div key={r} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12 }}>{r}</span>
                      <span style={{ fontSize: 12, fontFamily: T.fontMono, color: T.teal }}>{gridPct}%</span>
                    </div>
                    <div style={{ background: T.borderL, borderRadius: 4, height: 6 }}>
                      <div style={{ width: `${gridPct}%`, background: T.teal, borderRadius: 4, height: 6 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 4 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Smart Transport Adoption by City</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {filtered.filter(c => c.smartTransport).slice(0, 18).map(c => (
                <div key={c.id} style={{ background: T.sub, border: `1px solid ${T.border}`, borderRadius: 6, padding: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{c.region}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                    <span style={{ fontSize: 11, color: T.teal }}>Score: {c.smartCityScore}</span>
                    <span style={{ fontSize: 11, color: T.green }}>-{c.carbonReduction}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 5 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Smart Waste Management — {filtered.filter(c => c.smartWasteManagement).length} cities adopted</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {filtered.filter(c => c.smartWasteManagement).map(c => (
                <div key={c.id} style={{ background: T.sub, borderRadius: 6, padding: 10, border: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: T.green, marginTop: 2 }}>Smart Waste ✓</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 6 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Avg Smart City Score by Region</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={regionScores}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="avgScore" fill={T.navy} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Tech Investment ($Bn) vs Carbon Reduction (%)</div>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="x" name="Tech Inv ($Bn)" tick={{ fontSize: 11 }} label={{ value: 'Tech Inv ($Bn)', position: 'insideBottom', offset: -5 }} />
                  <YAxis dataKey="y" name="Carbon Red (%)" tick={{ fontSize: 11 }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter data={scatterData} fill={T.green} opacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 7 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Climate Resilience Score by City (Top 15)</div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={[...filtered].sort((a, b) => b.climateResilienceScore - a.climateResilienceScore).slice(0, 15).map(c => ({ name: c.name.split(' ')[0], score: c.climateResilienceScore }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="score" fill={T.sage} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Private Partnership Value by Tier ($Bn)</div>
              {TIERS.map(tier => {
                const arr = filtered.filter(c => c.smartCityTier === tier);
                const val = arr.reduce((s, c) => s + c.privatePartnershipValue, 0).toFixed(1);
                return (
                  <div key={tier} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{tier}</span>
                      <span style={{ fontSize: 13, fontFamily: T.fontMono, color: T.indigo }}>${val}Bn · {arr.length} cities</span>
                    </div>
                    <div style={{ background: T.borderL, borderRadius: 4, height: 8 }}>
                      <div style={{ width: `${Math.min(100, +val * 5)}%`, background: T.indigo, borderRadius: 4, height: 8 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
