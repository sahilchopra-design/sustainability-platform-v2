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

const SECTORS = ['Renewable Energy', 'Energy Efficiency', 'Transport', 'Agriculture', 'Construction', 'Manufacturing', 'Services'];
const COUNTRIES = ['USA', 'Germany', 'China', 'India', 'UK', 'France', 'Brazil', 'Japan', 'Australia', 'Canada', 'Spain', 'Netherlands'];
const ENTRY_BARRIERS = ['Low', 'Medium', 'High'];

const JOB_NAMES = [
  'Solar PV Installer', 'Wind Turbine Tech', 'Battery Storage Eng', 'EV Charging Infra', 'Heat Pump Installer',
  'Building Retrofit Spec', 'Green Hydrogen Tech', 'Carbon Accountant', 'Sustainability Mgr', 'Climate Risk Analyst',
  'ESG Data Analyst', 'EV Powertrain Eng', 'Circular Economy Spec', 'Nature Restoration Tech', 'Green Finance Advisor',
  'Carbon Capture Eng', 'Smart Grid Operator', 'Biomass Energy Tech', 'Green Shipping Analyst', 'Offshore Wind Eng',
  'Agrivoltaic Specialist', 'Urban Forester', 'Green Roof Installer', 'Wetland Restoration Ecol', 'Climate Educator',
  'Sustainable Procurement', 'Net Zero Consultant', 'Biodiversity Analyst', 'CCUS Engineer', 'Geothermal Driller',
  'Tidal Energy Tech', 'Precision Ag Tech', 'Vertical Farm Mgr', 'EV Fleet Mgr', 'Green Mortgage Advisor',
  'Sustainable Tourism Mgr', 'Water Efficiency Tech', 'Waste-to-Energy Eng', 'Life Cycle Analyst', 'Green Architect',
  'Sustainable Textile Spec', 'Electric Aviation Eng', 'Green Port Manager', 'Marine Biologist Cons', 'Peatland Restorer',
  'Solar Farm Asset Mgr', 'Wind Farm Asset Mgr', 'Community Energy Dev', 'Soil Carbon Specialist', 'Food Waste Tech',
  'Sustainable Logistics Mgr', 'LEED Certifier', 'Green Bond Structurer', 'Climate Comms Manager', 'Zero Carbon Chef',
  'Plastic Alternative Dev', 'EV Battery Recycler', 'Smart Meter Installer', 'Demand Response Eng', 'Microalgae Farmer',
];

const GREEN_JOBS = Array.from({ length: 60 }, (_, i) => {
  const sector = SECTORS[i % SECTORS.length];
  const country = COUNTRIES[i % COUNTRIES.length];
  const currentJobs = +(20 + sr(i * 7) * 480).toFixed(0);
  const growthRate = +(5 + sr(i * 11) * 35).toFixed(1);
  return {
    id: i,
    name: JOB_NAMES[i] || `Green Role ${i + 1}`,
    sector,
    country,
    currentJobs,
    projectedJobs2030: +(currentJobs * (1 + growthRate / 100 * 6)).toFixed(0),
    projectedJobs2035: +(currentJobs * (1 + growthRate / 100 * 11)).toFixed(0),
    avgSalary: +(40 + sr(i * 13) * 90).toFixed(0),
    skillsGap: +(1 + sr(i * 17) * 9).toFixed(1),
    geographicConcentration: +(1 + sr(i * 19) * 9).toFixed(1),
    diversityScore: +(1 + sr(i * 23) * 9).toFixed(1),
    unionisationRate: +(5 + sr(i * 29) * 70).toFixed(1),
    entryBarrier: ENTRY_BARRIERS[i % ENTRY_BARRIERS.length],
    growthRate,
  };
});

const TABS = [
  'Jobs Overview', 'Growth Projections', 'Sector Analysis', 'Skills Gap',
  'Geographic Distribution', 'Salary Analysis', 'Diversity & Inclusion', 'Entry Barriers',
];

const YEAR_RANGE = [2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035];

export default function GreenJobsGrowthPage() {
  const [tab, setTab] = useState(0);
  const [sectorFilter, setSectorFilter] = useState('All');
  const [countryFilter, setCountryFilter] = useState('All');
  const [barrierFilter, setBarrierFilter] = useState('All');
  const [policyAmbition, setPolicyAmbition] = useState(3);
  const [investmentMultiplier, setInvestmentMultiplier] = useState(1.0);

  const filtered = useMemo(() => {
    return GREEN_JOBS.filter(j => {
      if (sectorFilter !== 'All' && j.sector !== sectorFilter) return false;
      if (countryFilter !== 'All' && j.country !== countryFilter) return false;
      if (barrierFilter !== 'All' && j.entryBarrier !== barrierFilter) return false;
      return true;
    });
  }, [sectorFilter, countryFilter, barrierFilter]);

  const policyBoost = 1 + (policyAmbition - 1) * 0.1;
  const totalCurrent = filtered.reduce((s, j) => s + j.currentJobs, 0);
  const totalProjected2030 = filtered.reduce((s, j) => s + j.projectedJobs2030 * policyBoost * investmentMultiplier, 0);
  const avgGrowth = filtered.length ? filtered.reduce((s, j) => s + j.growthRate, 0) / filtered.length : 0;
  const avgSkillsGap = filtered.length ? filtered.reduce((s, j) => s + j.skillsGap, 0) / filtered.length : 0;

  const sectorData = SECTORS.map(sec => {
    const sub = filtered.filter(j => j.sector === sec);
    return {
      sector: sec.split(' ').slice(0, 2).join(' '),
      current: sub.reduce((s, j) => s + j.currentJobs, 0),
      projected2030: +(sub.reduce((s, j) => s + j.projectedJobs2030 * policyBoost * investmentMultiplier, 0)).toFixed(0),
    };
  });

  const growthTrend = YEAR_RANGE.map(yr => {
    const frac = (yr - 2024) / 11;
    return {
      year: yr,
      jobs: +(filtered.reduce((s, j) => s + j.currentJobs * Math.pow(1 + j.growthRate / 100 * policyBoost * investmentMultiplier, frac), 0) / 1000).toFixed(0),
    };
  });

  const scatterData = filtered.map(j => ({ x: j.avgSalary, y: j.skillsGap, name: j.name }));

  const growthBySector = SECTORS.map(sec => {
    const sub = filtered.filter(j => j.sector === sec);
    return { sector: sec.split(' ').slice(0, 2).join(' '), growthRate: sub.length ? +(sub.reduce((s, j) => s + j.growthRate, 0) / sub.length).toFixed(1) : 0 };
  });

  const kpis = [
    { label: 'Total Green Jobs (Current)', value: `${(totalCurrent / 1000).toFixed(1)}M`, color: T.green },
    { label: 'Total Projected 2030', value: `${(totalProjected2030 / 1000).toFixed(1)}M`, color: T.navy },
    { label: 'Avg Growth Rate', value: `${avgGrowth.toFixed(1)}%/yr`, color: T.teal },
    { label: 'Avg Skills Gap Score', value: avgSkillsGap.toFixed(1), color: T.amber },
  ];

  return (
    <div style={{ background: T.bg, minHeight: '100vh', padding: '24px', fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.gold, letterSpacing: 1 }}>EP-DI2</span>
            <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.textSec }}>CLIMATE WORKFORCE & JUST TRANSITION</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: T.navy, margin: 0 }}>Green Jobs Growth Analytics</h1>
          <p style={{ color: T.textSec, fontSize: 13, margin: '4px 0 0' }}>
            60 green economy occupations · Growth projections to 2035 · Skills gap · Salary analysis · Diversity tracking
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
            { label: 'Sector', val: sectorFilter, set: setSectorFilter, opts: ['All', ...SECTORS] },
            { label: 'Country', val: countryFilter, set: setCountryFilter, opts: ['All', ...COUNTRIES] },
            { label: 'Entry Barrier', val: barrierFilter, set: setBarrierFilter, opts: ['All', ...ENTRY_BARRIERS] },
          ].map(f => (
            <div key={f.label}>
              <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4, fontFamily: T.fontMono }}>{f.label}</div>
              <select value={f.val} onChange={e => f.set(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.sub, fontSize: 13, color: T.textPri }}>
                {f.opts.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
          <div style={{ flex: 1, minWidth: 160 }}>
            <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4, fontFamily: T.fontMono }}>Policy Ambition: {policyAmbition}/5</div>
            <input type="range" min={1} max={5} step={1} value={policyAmbition} onChange={e => setPolicyAmbition(Number(e.target.value))} style={{ width: '100%' }} />
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4, fontFamily: T.fontMono }}>Investment Multiplier: {investmentMultiplier.toFixed(1)}x</div>
            <input type="range" min={0.5} max={3.0} step={0.1} value={investmentMultiplier} onChange={e => setInvestmentMultiplier(Number(e.target.value))} style={{ width: '100%' }} />
          </div>
          <div style={{ fontFamily: T.fontMono, fontSize: 12, color: T.textSec }}>{filtered.length} occupations</div>
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap' }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)} style={{ padding: '8px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: tab === i ? 600 : 400, background: tab === i ? T.navy : T.card, color: tab === i ? '#fff' : T.textSec }}>
              {t}
            </button>
          ))}
        </div>

        {tab === 0 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 16 }}>Green Jobs by Sector — Current vs Projected 2030</h3>
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={sectorData} margin={{ bottom: 40, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="sector" tick={{ fontSize: 11, fill: T.textSec }} angle={-20} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="current" fill={T.teal} radius={[3, 3, 0, 0]} name="Current Jobs (k)" />
                <Bar dataKey="projected2030" fill={T.green} radius={[3, 3, 0, 0]} name="Projected 2030 (k)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 1 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 16 }}>Global Green Jobs Growth Trend 2024–2035 (M workers)</h3>
            <ResponsiveContainer width="100%" height={360}>
              <LineChart data={growthTrend} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="jobs" stroke={T.green} strokeWidth={2.5} dot={{ r: 4 }} name="Green Jobs (000s)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 2 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 16 }}>Growth Rate by Sector (%/yr)</h3>
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={growthBySector} margin={{ bottom: 40, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="sector" tick={{ fontSize: 11, fill: T.textSec }} angle={-20} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="growthRate" fill={T.indigo} radius={[3, 3, 0, 0]} name="Avg Growth Rate (%/yr)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 3 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 16 }}>Skills Gap by Occupation (top 20)</h3>
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={[...filtered].sort((a, b) => b.skillsGap - a.skillsGap).slice(0, 20).map(j => ({ name: j.name.split(' ').slice(0, 3).join(' '), gap: j.skillsGap }))} margin={{ bottom: 60, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} angle={-35} textAnchor="end" interval={0} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="gap" fill={T.amber} radius={[3, 3, 0, 0]} name="Skills Gap (0-10)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 4 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 16 }}>Geographic Concentration by Country</h3>
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={COUNTRIES.map(c => {
                const sub = filtered.filter(j => j.country === c);
                return { country: c, jobs: sub.reduce((s, j) => s + j.currentJobs, 0) };
              }).sort((a, b) => b.jobs - a.jobs)} margin={{ bottom: 40, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="country" tick={{ fontSize: 11, fill: T.textSec }} angle={-20} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="jobs" fill={T.blue} radius={[3, 3, 0, 0]} name="Current Jobs (k)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 5 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 16 }}>Salary vs Skills Gap — Scatter Analysis</h3>
            <ResponsiveContainer width="100%" height={360}>
              <ScatterChart margin={{ left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="x" name="Avg Salary ($k)" tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'Avg Salary ($k/yr)', position: 'insideBottom', offset: -5, fontSize: 11 }} />
                <YAxis dataKey="y" name="Skills Gap" tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'Skills Gap (0-10)', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ payload }) => payload?.length ? <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: '8px 12px', fontSize: 12 }}><b>{payload[0]?.payload?.name}</b><br />Salary: ${payload[0]?.payload?.x}k<br />Skills Gap: {payload[0]?.payload?.y}</div> : null} />
                <Scatter data={scatterData} fill={T.purple} opacity={0.7} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 6 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 16 }}>Diversity Score by Sector</h3>
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={SECTORS.map(sec => {
                const sub = filtered.filter(j => j.sector === sec);
                return { sector: sec.split(' ').slice(0, 2).join(' '), diversity: sub.length ? +(sub.reduce((s, j) => s + j.diversityScore, 0) / sub.length).toFixed(1) : 0 };
              })} margin={{ bottom: 40, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="sector" tick={{ fontSize: 11, fill: T.textSec }} angle={-20} textAnchor="end" interval={0} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="diversity" fill={T.sage} radius={[3, 3, 0, 0]} name="Diversity Score (0-10)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 7 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 16 }}>Entry Barrier Distribution — Occupations by Barrier Level</h3>
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={ENTRY_BARRIERS.map(b => {
                const sub = filtered.filter(j => j.entryBarrier === b);
                return { barrier: b, count: sub.length, avgSalary: sub.length ? +(sub.reduce((s, j) => s + j.avgSalary, 0) / sub.length).toFixed(0) : 0 };
              })} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="barrier" tick={{ fontSize: 12, fill: T.textSec }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar yAxisId="left" dataKey="count" fill={T.orange} radius={[3, 3, 0, 0]} name="Occupations (#)" />
                <Bar yAxisId="right" dataKey="avgSalary" fill={T.gold} radius={[3, 3, 0, 0]} name="Avg Salary ($k)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20, overflowX: 'auto' }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 12 }}>Occupation Detail Table</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.sub }}>
                {['Occupation', 'Sector', 'Country', 'Current (k)', 'Proj 2030 (k)', 'Growth %/yr', 'Salary ($k)', 'Skills Gap', 'Diversity', 'Entry Barrier'].map(h => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.textSec, fontWeight: 600, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 25).map(j => (
                <tr key={j.id} style={{ borderBottom: `1px solid ${T.borderL}` }}>
                  <td style={{ padding: '7px 10px', color: T.textPri, fontWeight: 500 }}>{j.name}</td>
                  <td style={{ padding: '7px 10px', color: T.textSec }}>{j.sector}</td>
                  <td style={{ padding: '7px 10px', color: T.textSec }}>{j.country}</td>
                  <td style={{ padding: '7px 10px', color: T.textPri }}>{j.currentJobs}</td>
                  <td style={{ padding: '7px 10px', color: T.green, fontWeight: 600 }}>{(j.projectedJobs2030 * policyBoost * investmentMultiplier).toFixed(0)}</td>
                  <td style={{ padding: '7px 10px', color: T.teal }}>{j.growthRate}%</td>
                  <td style={{ padding: '7px 10px', color: T.gold }}>${j.avgSalary}k</td>
                  <td style={{ padding: '7px 10px', color: j.skillsGap >= 7 ? T.red : j.skillsGap >= 4 ? T.amber : T.green }}>{j.skillsGap}</td>
                  <td style={{ padding: '7px 10px', color: T.textPri }}>{j.diversityScore}</td>
                  <td style={{ padding: '7px 10px' }}><span style={{ background: T.sub, padding: '2px 8px', borderRadius: 10, fontSize: 11 }}>{j.entryBarrier}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
