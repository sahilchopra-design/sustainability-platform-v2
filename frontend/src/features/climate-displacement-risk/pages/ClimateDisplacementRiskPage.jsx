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

const REGIONS = ['Sub-Saharan Africa', 'South Asia', 'Southeast Asia', 'MENA', 'Latin America', 'Pacific Islands', 'East Africa', 'Central America'];
const DRIVERS = ['Sea Level', 'Drought', 'Flood', 'Heat', 'Conflict-Climate'];

const COUNTRY_NAMES = [
  'Bangladesh', 'Somalia', 'South Sudan', 'Ethiopia', 'Sudan', 'Yemen', 'Myanmar', 'Haiti',
  'Mozambique', 'Zimbabwe', 'Niger', 'Mali', 'Chad', 'Central African Rep', 'DRC Congo',
  'Nigeria', 'Pakistan', 'Afghanistan', 'Philippines', 'Indonesia',
  'Vietnam', 'India', 'Cambodia', 'Laos', 'Nepal',
  'Guatemala', 'Honduras', 'El Salvador', 'Nicaragua', 'Colombia',
  'Peru', 'Bolivia', 'Ecuador', 'Senegal', 'Gambia',
  'Sierra Leone', 'Liberia', 'Guinea', 'Burkina Faso', 'Mauritania',
  'Madagascar', 'Malawi', 'Zambia', 'Tanzania', 'Kenya',
  'Uganda', 'Rwanda', 'Burundi', 'Eritrea', 'Djibouti',
  'Kiribati', 'Tuvalu', 'Marshall Islands', 'Maldives', 'Fiji',
  'Papua New Guinea', 'Timor-Leste', 'Vanuatu', 'Samoa', 'Tonga',
  'Syria', 'Iraq', 'Libya', 'Jordan', 'Lebanon',
  'Tajikistan', 'Kyrgyzstan',
];

const DISPLACEMENT_COUNTRIES = Array.from({ length: 65 }, (_, i) => {
  const region = REGIONS[i % REGIONS.length];
  const driver = DRIVERS[i % DRIVERS.length];
  const currentDisplacedM = +(0.1 + sr(i * 7) * 9.9).toFixed(2);
  const displacementRiskScore = Math.round(10 + sr(i * 11) * 85);
  return {
    id: i,
    name: COUNTRY_NAMES[i] || `Country ${i + 1}`,
    region,
    currentDisplacedM,
    projected2040M: +(currentDisplacedM * (1.5 + sr(i * 13) * 3.5)).toFixed(2),
    projected2060M: +(currentDisplacedM * (2.5 + sr(i * 17) * 7)).toFixed(2),
    displacementDriver: driver,
    adaptationFunding: +(0.05 + sr(i * 19) * 4.95).toFixed(2),
    migrationCorridors: +(1 + sr(i * 23) * 9).toFixed(1),
    socialCohesionRisk: +(1 + sr(i * 29) * 9).toFixed(1),
    hostCountryCapacity: +(1 + sr(i * 31) * 9).toFixed(1),
    remittanceGdpPct: +(1 + sr(i * 37) * 29).toFixed(1),
    climateRefugeeRecognition: sr(i * 41) > 0.6,
    financialSectorExposure: +(0.1 + sr(i * 43) * 19.9).toFixed(1),
    displacementRiskScore,
  };
});

const TABS = [
  'Country Risk', 'Displacement Projections', 'Driver Analysis', 'Migration Corridors',
  'Social Cohesion', 'Adaptation Funding', 'Financial Sector Exposure', 'Policy Responses',
];

const getRiskLabel = score => score >= 75 ? 'Critical' : score >= 50 ? 'High' : score >= 25 ? 'Medium' : 'Low';
const RISK_COLORS = { Low: T.green, Medium: T.amber, High: T.orange, Critical: T.red };

const HIST_YEARS = [2010, 2015, 2020, 2025, 2030, 2035, 2040, 2050, 2060];

export default function ClimateDisplacementRiskPage() {
  const [tab, setTab] = useState(0);
  const [regionFilter, setRegionFilter] = useState('All');
  const [riskFilter, setRiskFilter] = useState('All');
  const [refugeeFilter, setRefugeeFilter] = useState('All');
  const [tempScenario, setTempScenario] = useState(2.0);
  const [financeTarget, setFinanceTarget] = useState(100);

  const filtered = useMemo(() => {
    return DISPLACEMENT_COUNTRIES.filter(c => {
      if (regionFilter !== 'All' && c.region !== regionFilter) return false;
      if (riskFilter !== 'All' && getRiskLabel(c.displacementRiskScore) !== riskFilter) return false;
      if (refugeeFilter === 'Yes' && !c.climateRefugeeRecognition) return false;
      if (refugeeFilter === 'No' && c.climateRefugeeRecognition) return false;
      return true;
    });
  }, [regionFilter, riskFilter, refugeeFilter]);

  const tempMultiplier = 1 + (tempScenario - 1.5) * 0.15;
  const financeBoost = financeTarget / 100;

  const totalDisplaced = filtered.reduce((s, c) => s + c.currentDisplacedM, 0);
  const totalProjected2040 = filtered.reduce((s, c) => s + c.projected2040M * tempMultiplier, 0);
  const avgAdaptFunding = filtered.length ? filtered.reduce((s, c) => s + c.adaptationFunding * financeBoost, 0) / filtered.length : 0;
  const refugeePct = filtered.length ? (filtered.filter(c => c.climateRefugeeRecognition).length / filtered.length) * 100 : 0;

  const top15Projection = [...filtered]
    .sort((a, b) => b.projected2040M * tempMultiplier - a.projected2040M * tempMultiplier)
    .slice(0, 15)
    .map(c => ({ name: c.name.slice(0, 12), current: c.currentDisplacedM, proj2040: +(c.projected2040M * tempMultiplier).toFixed(2) }));

  const scatterData = filtered.map(c => ({
    x: +(c.adaptationFunding * financeBoost).toFixed(2),
    y: +(c.projected2040M * tempMultiplier).toFixed(2),
    name: c.name,
  }));

  const driverBreakdown = DRIVERS.map(d => ({
    driver: d,
    count: filtered.filter(c => c.displacementDriver === d).length,
    avgDisplaced: (() => { const sub = filtered.filter(c => c.displacementDriver === d); return sub.length ? +(sub.reduce((s, c) => s + c.currentDisplacedM, 0) / sub.length).toFixed(2) : 0; })(),
  }));

  const globalTrend = HIST_YEARS.map((yr, idx) => {
    const baseFactor = 0.4 + idx * 0.1;
    return { year: yr, displaced: +(filtered.reduce((s, c) => s + c.currentDisplacedM * baseFactor * (yr >= 2025 ? tempMultiplier : 1), 0)).toFixed(1) };
  });

  const kpis = [
    { label: 'Total Displaced (Current)', value: `${totalDisplaced.toFixed(1)}M`, color: T.red },
    { label: 'Total Projected 2040', value: `${totalProjected2040.toFixed(1)}M`, color: T.orange },
    { label: 'Avg Adaptation Funding', value: `$${avgAdaptFunding.toFixed(2)}Bn`, color: T.teal },
    { label: '% Climate Refugee Recognition', value: `${refugeePct.toFixed(1)}%`, color: T.navy },
  ];

  return (
    <div style={{ background: T.bg, minHeight: '100vh', padding: '24px', fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.gold, letterSpacing: 1 }}>EP-DI4</span>
            <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.textSec }}>CLIMATE WORKFORCE & JUST TRANSITION</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: T.navy, margin: 0 }}>Climate Displacement Risk</h1>
          <p style={{ color: T.textSec, fontSize: 13, margin: '4px 0 0' }}>
            65 countries · Displacement projections to 2060 · Sea level/drought/flood/heat drivers · Financial sector exposure
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {kpis.map(k => (
            <div key={k.label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px' }}>
              <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono, marginBottom: 6 }}>{k.label.toUpperCase()}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 20, display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {[
            { label: 'Region', val: regionFilter, set: setRegionFilter, opts: ['All', ...REGIONS] },
            { label: 'Displacement Risk', val: riskFilter, set: setRiskFilter, opts: ['All', 'Low', 'Medium', 'High', 'Critical'] },
            { label: 'Refugee Recognition', val: refugeeFilter, set: setRefugeeFilter, opts: ['All', 'Yes', 'No'] },
          ].map(f => (
            <div key={f.label}>
              <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4, fontFamily: T.fontMono }}>{f.label}</div>
              <select value={f.val} onChange={e => f.set(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.sub, fontSize: 13, color: T.textPri }}>
                {f.opts.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
          <div style={{ flex: 1, minWidth: 160 }}>
            <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4, fontFamily: T.fontMono }}>Temperature Scenario: +{tempScenario}°C</div>
            <input type="range" min={1.5} max={4.0} step={0.5} value={tempScenario} onChange={e => setTempScenario(Number(e.target.value))} style={{ width: '100%' }} />
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4, fontFamily: T.fontMono }}>Finance Mobilisation: ${financeTarget}Bn</div>
            <input type="range" min={10} max={500} value={financeTarget} onChange={e => setFinanceTarget(Number(e.target.value))} style={{ width: '100%' }} />
          </div>
          <div style={{ fontFamily: T.fontMono, fontSize: 12, color: T.textSec }}>{filtered.length} countries</div>
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap' }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)} style={{ padding: '8px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: tab === i ? 600 : 400, background: tab === i ? T.navy : T.card, color: tab === i ? '#fff' : T.textSec }}>
              {t}
            </button>
          ))}
        </div>

        {tab === 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 16 }}>Risk Distribution by Category</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={['Low', 'Medium', 'High', 'Critical'].map(l => ({ label: l, count: filtered.filter(c => getRiskLabel(c.displacementRiskScore) === l).length }))} margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Bar dataKey="count" fill={T.red} radius={[3, 3, 0, 0]} name="Countries" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 16 }}>Adaptation Funding vs Projected Displacement (2040)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <ScatterChart margin={{ left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="x" name="Adaptation Funding ($Bn)" tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'Adapt Funding ($Bn)', position: 'insideBottom', offset: -5, fontSize: 10 }} />
                  <YAxis dataKey="y" name="Proj Displaced 2040 (M)" tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'Proj 2040 (M)', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ payload }) => payload?.length ? <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: '8px 12px', fontSize: 12 }}><b>{payload[0]?.payload?.name}</b><br />Funding: ${payload[0]?.payload?.x}Bn<br />Proj: {payload[0]?.payload?.y}M</div> : null} />
                  <Scatter data={scatterData} fill={T.indigo} opacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 1 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 16 }}>Top 15 Countries — Current vs Projected 2040 Displacement (M persons)</h3>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={top15Projection} margin={{ bottom: 60, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} angle={-35} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="current" fill={T.amber} radius={[3, 3, 0, 0]} name="Current (M)" />
                <Bar dataKey="proj2040" fill={T.red} radius={[3, 3, 0, 0]} name="Projected 2040 (M)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 2 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 16 }}>Displacement Drivers — Countries Affected & Avg Displaced</h3>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={driverBreakdown} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="driver" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar yAxisId="left" dataKey="count" fill={T.orange} radius={[3, 3, 0, 0]} name="Countries (#)" />
                <Bar yAxisId="right" dataKey="avgDisplaced" fill={T.red} radius={[3, 3, 0, 0]} name="Avg Displaced (M)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 3 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 16 }}>Migration Corridor Score by Region</h3>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={REGIONS.map(r => { const sub = filtered.filter(c => c.region === r); return { region: r.split(' ').slice(0, 2).join(' '), corridor: sub.length ? +(sub.reduce((s, c) => s + c.migrationCorridors, 0) / sub.length).toFixed(1) : 0 }; }).filter(d => d.corridor > 0)} margin={{ bottom: 40, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="region" tick={{ fontSize: 11, fill: T.textSec }} angle={-20} textAnchor="end" interval={0} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="corridor" fill={T.teal} radius={[3, 3, 0, 0]} name="Migration Corridor Score (0-10)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 4 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 16 }}>Social Cohesion Risk by Region</h3>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={REGIONS.map(r => { const sub = filtered.filter(c => c.region === r); return { region: r.split(' ').slice(0, 2).join(' '), cohesion: sub.length ? +(sub.reduce((s, c) => s + c.socialCohesionRisk, 0) / sub.length).toFixed(1) : 0 }; }).filter(d => d.cohesion > 0)} margin={{ bottom: 40, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="region" tick={{ fontSize: 11, fill: T.textSec }} angle={-20} textAnchor="end" interval={0} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="cohesion" fill={T.purple} radius={[3, 3, 0, 0]} name="Social Cohesion Risk (0-10)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 5 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 16 }}>Adaptation Funding by Country (Top 15, $Bn)</h3>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={[...filtered].sort((a, b) => b.adaptationFunding - a.adaptationFunding).slice(0, 15).map(c => ({ name: c.name.slice(0, 12), funding: +(c.adaptationFunding * financeBoost).toFixed(2) }))} margin={{ bottom: 60, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} angle={-35} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="funding" fill={T.green} radius={[3, 3, 0, 0]} name="Adaptation Funding ($Bn)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 6 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 16 }}>Financial Sector Exposure (Top 15, $Bn)</h3>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={[...filtered].sort((a, b) => b.financialSectorExposure - a.financialSectorExposure).slice(0, 15).map(c => ({ name: c.name.slice(0, 12), exposure: c.financialSectorExposure }))} margin={{ bottom: 60, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} angle={-35} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="exposure" fill={T.amber} radius={[3, 3, 0, 0]} name="Financial Sector Exposure ($Bn)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 7 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 16 }}>Global Displacement Trend (M persons)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={globalTrend} margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="displaced" stroke={T.red} strokeWidth={2.5} dot={{ r: 4 }} name="Displaced (M)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 12 }}>Policy Landscape</h3>
              {[
                { label: 'UNHCR Climate Displacement Mandate', status: 'Partial' },
                { label: 'Global Compact on Refugees', status: 'Active' },
                { label: 'Nansen Initiative / Platform', status: 'Active' },
                { label: 'Paris Agreement Loss & Damage', status: 'Active — COP27' },
                { label: 'Climate Refugee Legal Status', status: 'Proposed' },
                { label: 'World Bank Climate Migration Fund', status: 'Active' },
                { label: 'Task Force on Displacement', status: 'Active' },
              ].map(p => (
                <div key={p.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <span style={{ fontSize: 12, color: T.textPri }}>{p.label}</span>
                  <span style={{ fontSize: 11, color: p.status === 'Active' || p.status.startsWith('Active') ? T.green : p.status === 'Partial' ? T.amber : T.orange, fontWeight: 600 }}>{p.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20, overflowX: 'auto' }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 12 }}>Country Detail Table</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.sub }}>
                {['Country', 'Region', 'Current (M)', 'Proj 2040 (M)', 'Driver', 'Adapt Funding ($Bn)', 'Migration Score', 'Social Risk', 'Fin Exposure ($Bn)', 'Refugee Recog.'].map(h => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.textSec, fontWeight: 600, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 25).map(c => (
                <tr key={c.id} style={{ borderBottom: `1px solid ${T.borderL}` }}>
                  <td style={{ padding: '7px 10px', color: T.textPri, fontWeight: 500 }}>{c.name}</td>
                  <td style={{ padding: '7px 10px', color: T.textSec, fontSize: 11 }}>{c.region}</td>
                  <td style={{ padding: '7px 10px', color: T.amber, fontWeight: 600 }}>{c.currentDisplacedM}</td>
                  <td style={{ padding: '7px 10px', color: T.red, fontWeight: 600 }}>{(c.projected2040M * tempMultiplier).toFixed(2)}</td>
                  <td style={{ padding: '7px 10px' }}><span style={{ background: T.sub, padding: '2px 8px', borderRadius: 10, fontSize: 10 }}>{c.displacementDriver}</span></td>
                  <td style={{ padding: '7px 10px', color: T.green }}>{(c.adaptationFunding * financeBoost).toFixed(2)}</td>
                  <td style={{ padding: '7px 10px', color: T.textPri }}>{c.migrationCorridors}</td>
                  <td style={{ padding: '7px 10px', color: c.socialCohesionRisk >= 7 ? T.red : c.socialCohesionRisk >= 4 ? T.amber : T.green }}>{c.socialCohesionRisk}</td>
                  <td style={{ padding: '7px 10px', color: T.textPri }}>{c.financialSectorExposure}</td>
                  <td style={{ padding: '7px 10px', color: c.climateRefugeeRecognition ? T.green : T.red, fontWeight: 600 }}>{c.climateRefugeeRecognition ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
