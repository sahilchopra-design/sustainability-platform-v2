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

const FUEL_TYPES = ['Coal', 'Oil', 'Gas', 'Mixed'];
const REGIONS = ['Asia-Pacific', 'Europe', 'North America', 'Latin America', 'Middle East', 'Africa'];

const REGION_NAMES = [
  'Ruhr Valley Germany', 'Appalachian USA', 'Jharkhand India', 'Shanxi China', 'Donbas Ukraine',
  'Silesia Poland', 'Mpumalanga SA', 'Hunter Valley Australia', 'Cerrejon Colombia', 'Bowen Basin Australia',
  'Alberta Canada', 'Permian Basin USA', 'Gulf Coast USA', 'North Sea UK', 'Athabasca Canada',
  'Surgut Russia', 'Samara Russia', 'Kashagan Kazakhstan', 'Tengiz Kazakhstan', 'Baku Azerbaijan',
  'Niger Delta Nigeria', 'Cabinda Angola', 'Sonatrach Algeria', 'Sirte Libya', 'Jubilee Ghana',
  'Groningen Netherlands', 'Yamal Russia', 'Shtokman Russia', 'LNG Queensland Australia', 'Sabah Malaysia',
  'Cantarell Mexico', 'Camisea Peru', 'Vaca Muerta Argentina', 'Presalt Brazil', 'Oriente Ecuador',
  'Maracaibo Venezuela', 'Western Siberia Russia', 'Ninian North Sea', 'Magnus North Sea', 'Forties North Sea',
  'Ghawar Saudi Arabia', 'Rumaila Iraq', 'South Pars Iran', 'Safaniya Saudi Arabia', 'Kirkuk Iraq',
  'Haradh Saudi Arabia', 'Khurais Saudi Arabia', 'Zubair Iraq', 'West Qurna Iraq', 'Majnoon Iraq',
];

const FOSSIL_REGIONS = Array.from({ length: 50 }, (_, i) => {
  const fuelType = FUEL_TYPES[i % FUEL_TYPES.length];
  const region = REGIONS[i % REGIONS.length];
  const workersEmployed = +(5 + sr(i * 7) * 120).toFixed(1);
  const projectedJobLoss2030 = +(workersEmployed * (0.1 + sr(i * 11) * 0.4)).toFixed(1);
  const projectedJobLoss2040 = +(projectedJobLoss2030 * (1.2 + sr(i * 13) * 0.8)).toFixed(1);
  const retrainingEligible = +(projectedJobLoss2030 * (0.4 + sr(i * 17) * 0.5)).toFixed(1);
  const alternativeJobsAvailable = +(retrainingEligible * (0.3 + sr(i * 19) * 0.9)).toFixed(1);
  const timelineRisk = +(1 + sr(i * 23) * 9).toFixed(1);
  return {
    id: i,
    name: REGION_NAMES[i] || `Region ${i + 1}`,
    country: region,
    region,
    fuelType,
    workersEmployed,
    projectedJobLoss2030,
    projectedJobLoss2040,
    retrainingEligible,
    avgWage: +(35 + sr(i * 29) * 65).toFixed(1),
    alternativeJobsAvailable,
    transitionFundAllocated: +(10 + sr(i * 31) * 490).toFixed(0),
    communityImpactScore: +(1 + sr(i * 37) * 9).toFixed(1),
    timelineRisk,
    unionisationRate: +(10 + sr(i * 41) * 80).toFixed(1),
  };
});

const TABS = [
  'Region Overview', 'Job Loss Projections', 'Retraining Capacity', 'Alternative Employment',
  'Wage Impact', 'Community Resilience', 'Transition Funding', 'Policy Framework',
];

const getTimelineRiskLabel = v => v >= 7 ? 'High' : v >= 4 ? 'Medium' : 'Low';
const RISK_COLORS = { Low: T.green, Medium: T.amber, High: T.red };

export default function FossilFuelWorkerTransitionPage() {
  const [tab, setTab] = useState(0);
  const [regionFilter, setRegionFilter] = useState('All');
  const [fuelFilter, setFuelFilter] = useState('All');
  const [timelineRiskFilter, setTimelineRiskFilter] = useState('All');
  const [transitionSpeed, setTransitionSpeed] = useState(2035);
  const [retrainingInvestment, setRetrainingInvestment] = useState(50);

  const filtered = useMemo(() => {
    return FOSSIL_REGIONS.filter(r => {
      if (regionFilter !== 'All' && r.region !== regionFilter) return false;
      if (fuelFilter !== 'All' && r.fuelType !== fuelFilter) return false;
      if (timelineRiskFilter !== 'All' && getTimelineRiskLabel(r.timelineRisk) !== timelineRiskFilter) return false;
      return true;
    });
  }, [regionFilter, fuelFilter, timelineRiskFilter]);

  const speedMultiplier = transitionSpeed === 2030 ? 1.3 : transitionSpeed === 2035 ? 1.0 : 0.7;
  const retrainingBoost = retrainingInvestment / 50;

  const totalWorkers = filtered.reduce((s, r) => s + r.workersEmployed, 0);
  const totalJobLoss2030 = filtered.reduce((s, r) => s + r.projectedJobLoss2030 * speedMultiplier, 0);
  const avgFund = filtered.length ? filtered.reduce((s, r) => s + r.transitionFundAllocated, 0) / filtered.length : 0;
  const retrainingPct = totalJobLoss2030 > 0
    ? (filtered.reduce((s, r) => s + r.retrainingEligible * retrainingBoost, 0) / totalJobLoss2030) * 100
    : 0;
  const totalAltJobs = filtered.reduce((s, r) => s + r.alternativeJobsAvailable * retrainingBoost, 0);

  const topJobLoss = [...filtered]
    .sort((a, b) => b.projectedJobLoss2030 - a.projectedJobLoss2030)
    .slice(0, 15)
    .map(r => ({ name: r.name.split(' ').slice(0, 2).join(' '), jobLoss: +(r.projectedJobLoss2030 * speedMultiplier).toFixed(1) }));

  const scatterData = filtered.map(r => ({
    x: r.workersEmployed,
    y: r.transitionFundAllocated,
    name: r.name,
  }));

  const altJobsData = filtered.slice(0, 15).map(r => ({
    name: r.name.split(' ').slice(0, 2).join(' '),
    jobLoss: +(r.projectedJobLoss2030 * speedMultiplier).toFixed(1),
    altJobs: +(r.alternativeJobsAvailable * retrainingBoost).toFixed(1),
  }));

  const communityData = [...filtered]
    .sort((a, b) => b.communityImpactScore - a.communityImpactScore)
    .slice(0, 12)
    .map(r => ({ name: r.name.split(' ').slice(0, 2).join(' '), score: r.communityImpactScore }));

  const kpis = [
    { label: 'Total Workers at Risk', value: `${totalWorkers.toFixed(0)}k`, color: T.navy },
    { label: 'Avg Transition Funding', value: `$${avgFund.toFixed(0)}M`, color: T.gold },
    { label: '% Retraining Eligible', value: `${Math.min(100, retrainingPct).toFixed(1)}%`, color: T.teal },
    { label: 'Total Alternative Jobs', value: `${totalAltJobs.toFixed(0)}k`, color: T.green },
  ];

  return (
    <div style={{ background: T.bg, minHeight: '100vh', padding: '24px', fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.gold, letterSpacing: 1 }}>EP-DI1</span>
            <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.textSec }}>CLIMATE WORKFORCE & JUST TRANSITION</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: T.navy, margin: 0 }}>Fossil Fuel Worker Transition</h1>
          <p style={{ color: T.textSec, fontSize: 13, margin: '4px 0 0' }}>
            50 coal/oil/gas regions · Job loss projections · Retraining pathways · Community resilience · Transition funding
          </p>
        </div>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {kpis.map(k => (
            <div key={k.label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px' }}>
              <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono, marginBottom: 6 }}>{k.label.toUpperCase()}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 20, display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {[
            { label: 'Region', val: regionFilter, set: setRegionFilter, opts: ['All', ...REGIONS] },
            { label: 'Fuel Type', val: fuelFilter, set: setFuelFilter, opts: ['All', ...FUEL_TYPES] },
            { label: 'Timeline Risk', val: timelineRiskFilter, set: setTimelineRiskFilter, opts: ['All', 'Low', 'Medium', 'High'] },
          ].map(f => (
            <div key={f.label}>
              <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4, fontFamily: T.fontMono }}>{f.label}</div>
              <select value={f.val} onChange={e => f.set(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.sub, fontSize: 13, color: T.textPri }}>
                {f.opts.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
          <div>
            <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4, fontFamily: T.fontMono }}>Transition Speed</div>
            <select value={transitionSpeed} onChange={e => setTransitionSpeed(Number(e.target.value))} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.sub, fontSize: 13, color: T.textPri }}>
              {[2030, 2035, 2040].map(y => <option key={y}>{y}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4, fontFamily: T.fontMono }}>Retraining Investment: ${retrainingInvestment}Bn</div>
            <input type="range" min={10} max={200} value={retrainingInvestment} onChange={e => setRetrainingInvestment(Number(e.target.value))} style={{ width: '100%' }} />
          </div>
          <div style={{ fontFamily: T.fontMono, fontSize: 12, color: T.textSec }}>{filtered.length} regions</div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap' }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)} style={{ padding: '8px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: tab === i ? 600 : 400, background: tab === i ? T.navy : T.card, color: tab === i ? '#fff' : T.textSec }}>
              {t}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {tab === 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 16 }}>Top 15 Regions — Job Loss by 2030 (k workers)</h3>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={topJobLoss} margin={{ left: -10, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} angle={-40} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Bar dataKey="jobLoss" fill={T.red} radius={[3, 3, 0, 0]} name="Job Loss (k)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 16 }}>Workers vs Transition Fund Allocation</h3>
              <ResponsiveContainer width="100%" height={320}>
                <ScatterChart margin={{ left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="x" name="Workers (k)" tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'Workers (k)', position: 'insideBottom', offset: -5, fontSize: 11 }} />
                  <YAxis dataKey="y" name="Fund ($M)" tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'Fund ($M)', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ payload }) => payload?.length ? <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: '8px 12px', fontSize: 12 }}><b>{payload[0]?.payload?.name}</b><br />Workers: {payload[0]?.payload?.x}k<br />Fund: ${payload[0]?.payload?.y}M</div> : null} />
                  <Scatter data={scatterData} fill={T.indigo} opacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 1 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 16 }}>Job Loss Projections — 2030 vs 2040 by Region</h3>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={filtered.slice(0, 20).map(r => ({ name: r.name.split(' ').slice(0, 2).join(' '), '2030': +(r.projectedJobLoss2030 * speedMultiplier).toFixed(1), '2040': +(r.projectedJobLoss2040 * speedMultiplier).toFixed(1) }))} margin={{ bottom: 60, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} angle={-35} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="2030" fill={T.amber} radius={[3, 3, 0, 0]} />
                <Bar dataKey="2040" fill={T.red} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 2 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 16 }}>Retraining Capacity — Eligible vs Job Loss</h3>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={filtered.slice(0, 20).map(r => ({ name: r.name.split(' ').slice(0, 2).join(' '), jobLoss: +(r.projectedJobLoss2030 * speedMultiplier).toFixed(1), retraining: +(r.retrainingEligible * retrainingBoost).toFixed(1) }))} margin={{ bottom: 60, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} angle={-35} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="jobLoss" fill={T.red} radius={[3, 3, 0, 0]} name="Job Loss (k)" />
                <Bar dataKey="retraining" fill={T.teal} radius={[3, 3, 0, 0]} name="Retraining Eligible (k)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 3 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 16 }}>Alternative Employment Gap — Top 15 Regions</h3>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={altJobsData} margin={{ bottom: 60, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} angle={-35} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="jobLoss" fill={T.red} radius={[3, 3, 0, 0]} name="Jobs Lost (k)" />
                <Bar dataKey="altJobs" fill={T.green} radius={[3, 3, 0, 0]} name="Alternative Jobs (k)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 4 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 16 }}>Average Wage by Region (k$/yr)</h3>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={[...filtered].sort((a, b) => b.avgWage - a.avgWage).slice(0, 20).map(r => ({ name: r.name.split(' ').slice(0, 2).join(' '), wage: r.avgWage, fuelType: r.fuelType }))} margin={{ bottom: 60, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} angle={-35} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="wage" fill={T.gold} radius={[3, 3, 0, 0]} name="Avg Wage (k$/yr)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 5 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 16 }}>Community Impact Score by Region</h3>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={communityData} margin={{ bottom: 50, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} angle={-35} textAnchor="end" interval={0} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="score" fill={T.orange} radius={[3, 3, 0, 0]} name="Community Impact (0-10)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 6 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 16 }}>Transition Fund Allocated by Region (Top 15, $M)</h3>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={[...filtered].sort((a, b) => b.transitionFundAllocated - a.transitionFundAllocated).slice(0, 15).map(r => ({ name: r.name.split(' ').slice(0, 2).join(' '), fund: r.transitionFundAllocated }))} margin={{ bottom: 60, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} angle={-35} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="fund" fill={T.green} radius={[3, 3, 0, 0]} name="Fund ($M)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 7 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 12 }}>Policy Framework Summary</h3>
              {[
                { label: 'ILO Just Transition Guidelines', status: 'Active', color: T.green },
                { label: 'EU Just Transition Fund (€17.5Bn)', status: 'Active', color: T.green },
                { label: 'JETP Agreements', status: 'Active — 8 Countries', color: T.green },
                { label: 'US Inflation Reduction Act', status: 'Active', color: T.green },
                { label: 'Coal Phase-out Fund', status: 'Pending', color: T.amber },
                { label: 'Global Fossil Fuel Worker Registry', status: 'Proposed', color: T.orange },
              ].map(p => (
                <div key={p.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <span style={{ fontSize: 13, color: T.textPri }}>{p.label}</span>
                  <span style={{ fontSize: 12, color: p.color, fontWeight: 600 }}>{p.status}</span>
                </div>
              ))}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 12 }}>Unionisation Rate by Fuel Type</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={FUEL_TYPES.map(ft => {
                  const subset = filtered.filter(r => r.fuelType === ft);
                  return { ft, rate: subset.length ? +(subset.reduce((s, r) => s + r.unionisationRate, 0) / subset.length).toFixed(1) : 0 };
                })} margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="ft" tick={{ fontSize: 12, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Bar dataKey="rate" fill={T.purple} radius={[3, 3, 0, 0]} name="Unionisation %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Table */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20, overflowX: 'auto' }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 12 }}>Region Detail Table</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.sub }}>
                {['Region', 'Country', 'Fuel', 'Workers (k)', 'Job Loss 2030 (k)', 'Retraining (k)', 'Alt Jobs (k)', 'Avg Wage ($k)', 'Fund ($M)', 'Timeline Risk'].map(h => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.textSec, fontWeight: 600, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 25).map(r => (
                <tr key={r.id} style={{ borderBottom: `1px solid ${T.borderL}` }}>
                  <td style={{ padding: '7px 10px', color: T.textPri, fontWeight: 500 }}>{r.name}</td>
                  <td style={{ padding: '7px 10px', color: T.textSec }}>{r.country}</td>
                  <td style={{ padding: '7px 10px' }}><span style={{ background: T.sub, padding: '2px 8px', borderRadius: 10, fontSize: 11 }}>{r.fuelType}</span></td>
                  <td style={{ padding: '7px 10px', color: T.textPri }}>{r.workersEmployed}</td>
                  <td style={{ padding: '7px 10px', color: T.red, fontWeight: 600 }}>{(r.projectedJobLoss2030 * speedMultiplier).toFixed(1)}</td>
                  <td style={{ padding: '7px 10px', color: T.teal }}>{(r.retrainingEligible * retrainingBoost).toFixed(1)}</td>
                  <td style={{ padding: '7px 10px', color: T.green }}>{(r.alternativeJobsAvailable * retrainingBoost).toFixed(1)}</td>
                  <td style={{ padding: '7px 10px', color: T.textPri }}>{r.avgWage}</td>
                  <td style={{ padding: '7px 10px', color: T.gold }}>${r.transitionFundAllocated}</td>
                  <td style={{ padding: '7px 10px' }}>
                    <span style={{ color: RISK_COLORS[getTimelineRiskLabel(r.timelineRisk)], fontWeight: 600, fontSize: 11 }}>{getTimelineRiskLabel(r.timelineRisk)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
