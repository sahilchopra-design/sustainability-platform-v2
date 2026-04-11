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
const TARGET_YEARS_BUCKET = ['Near (≤2030)', 'Mid (2031-2040)', 'Long (2041-2050)'];
const COMPLIANCE_BUCKETS = ['Low (<50%)', 'Medium (50-79%)', 'High (≥80%)'];

const JURISDICTION_NAMES = [
  'California', 'New York State', 'Massachusetts', 'Washington DC', 'Colorado',
  'New Jersey', 'Oregon', 'Illinois', 'Michigan', 'Texas',
  'UK', 'Germany', 'France', 'Netherlands', 'Denmark',
  'Sweden', 'Norway', 'Finland', 'Austria', 'Switzerland',
  'Belgium', 'Spain', 'Italy', 'Portugal', 'Ireland',
  'Singapore', 'Japan', 'South Korea', 'Australia', 'New Zealand',
  'Hong Kong', 'Taiwan', 'China (National)', 'India ECBC', 'Malaysia',
  'Brazil', 'Chile', 'Colombia', 'Argentina', 'Mexico',
  'Peru', 'Uruguay', 'Costa Rica', 'Panama', 'Ecuador',
  'UAE', 'Saudi Arabia', 'South Africa', 'Kenya', 'Morocco',
  'Canada (National)', 'Canada BC', 'Canada Ontario', 'Canada Quebec', 'Canada Alberta',
  'Poland', 'Czech Republic', 'Hungary', 'Romania', 'Greece',
  'Turkey', 'Israel', 'Egypt', 'Jordan', 'Pakistan',
];

const JURISDICTIONS = Array.from({ length: 65 }, (_, i) => {
  const region = REGIONS[i % REGIONS.length];
  const codeVer = 2010 + Math.floor(sr(i * 7) * 14);
  const nzTarget = 2025 + Math.floor(sr(i * 11) * 25);
  const retrofitYr = 2025 + Math.floor(sr(i * 13) * 15);
  const energyStd = Math.round(30 + sr(i * 17) * 170);
  const embodiedC = Math.round(100 + sr(i * 19) * 400);
  const greenCertShare = +(5 + sr(i * 23) * 65).toFixed(1);
  const compliance = +(30 + sr(i * 29) * 70).toFixed(1);
  const enforcement = +(2 + sr(i * 31) * 8).toFixed(1);
  const retrofitFund = +(0.2 + sr(i * 37) * 9.8).toFixed(1);
  const newBuildComp = +(40 + sr(i * 41) * 60).toFixed(1);
  const strandedStock = +(5 + sr(i * 43) * 45).toFixed(1);
  const carbonSavings = +(0.1 + sr(i * 47) * 4.9).toFixed(2);
  const tgtBucket = nzTarget <= 2030 ? 'Near (≤2030)' : nzTarget <= 2040 ? 'Mid (2031-2040)' : 'Long (2041-2050)';
  const compBucket = compliance < 50 ? 'Low (<50%)' : compliance < 80 ? 'Medium (50-79%)' : 'High (≥80%)';
  return {
    id: i,
    name: JURISDICTION_NAMES[i] || `Jurisdiction ${i + 1}`,
    country: region.split(' ').pop(),
    region,
    buildingCodeVersion: codeVer,
    netZeroBuildingTarget: nzTarget,
    retrofitMandateYear: retrofitYr,
    energyEfficiencyStandard: energyStd,
    embodiedCarbonLimit: embodiedC,
    greenBuildingCertificationShare: greenCertShare,
    complianceRate: compliance,
    enforcementStrength: enforcement,
    retrofitFunding: retrofitFund,
    newBuildCompliance: newBuildComp,
    strandedBuildingStock: strandedStock,
    carbonSavingsFromCode: carbonSavings,
    targetYearBucket: tgtBucket,
    complianceBucket: compBucket,
  };
});

const TABS = [
  'Jurisdiction Overview', 'Net Zero Building Targets', 'Energy Standards',
  'Embodied Carbon Limits', 'Retrofit Programs', 'Compliance & Enforcement',
  'Stranded Building Stock', 'Carbon Savings',
];

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px', flex: 1, minWidth: 180 }}>
    <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 700, color: color || T.navy }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{sub}</div>}
  </div>
);

export default function GreenBuildingCodeFinancePage() {
  const [tab, setTab] = useState(0);
  const [filterRegion, setFilterRegion] = useState('All');
  const [filterTargetYear, setFilterTargetYear] = useState('All');
  const [filterCompliance, setFilterCompliance] = useState('All');
  const [carbonPrice, setCarbonPrice] = useState(50);
  const [retrofitSubsidy, setRetrofitSubsidy] = useState(20);

  const filtered = useMemo(() => JURISDICTIONS.filter(j =>
    (filterRegion === 'All' || j.region === filterRegion) &&
    (filterTargetYear === 'All' || j.targetYearBucket === filterTargetYear) &&
    (filterCompliance === 'All' || j.complianceBucket === filterCompliance)
  ), [filterRegion, filterTargetYear, filterCompliance]);

  const avgEnergy = filtered.length ? Math.round(filtered.reduce((s, j) => s + j.energyEfficiencyStandard, 0) / filtered.length) : 0;
  const nzTargetSet = filtered.length ? Math.round(filtered.filter(j => j.netZeroBuildingTarget <= 2050).length / filtered.length * 100) : 0;
  const totalRetrofitFund = filtered.reduce((s, j) => s + j.retrofitFunding, 0).toFixed(1);
  const totalCarbonSavings = filtered.reduce((s, j) => s + j.carbonSavingsFromCode, 0).toFixed(2);

  const energyByRegion = REGIONS.map(r => {
    const arr = filtered.filter(j => j.region === r);
    return { name: r.split(' ')[0], avgEnergy: arr.length ? Math.round(arr.reduce((s, j) => s + j.energyEfficiencyStandard, 0) / arr.length) : 0 };
  });

  const scatterCompliance = filtered.map(j => ({ x: j.complianceRate, y: j.carbonSavingsFromCode, name: j.name }));

  const retrofitByCountry = [...JURISDICTIONS.reduce((acc, j) => {
    const key = j.region;
    if (!acc.has(key)) acc.set(key, { name: j.region.split(' ')[0], fund: 0 });
    acc.get(key).fund += j.retrofitFunding;
    return acc;
  }, new Map()).values()].map(d => ({ ...d, fund: +d.fund.toFixed(1) }));

  const strandedByRegion = REGIONS.map(r => {
    const arr = filtered.filter(j => j.region === r);
    return { name: r.split(' ')[0], stranded: arr.length ? +(arr.reduce((s, j) => s + j.strandedBuildingStock, 0) / arr.length).toFixed(1) : 0 };
  });

  const sel = { background: T.navy, color: '#fff', border: `1px solid ${T.navy}` };
  const unsel = { background: T.card, color: T.textPri, border: `1px solid ${T.border}` };

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: T.textPri }}>
      <div style={{ background: T.navy, padding: '20px 32px', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ fontSize: 11, color: T.gold, fontFamily: T.fontMono, marginBottom: 4 }}>EP-DM5 · URBAN & CITY CLIMATE FINANCE</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>Green Building Code Finance</div>
        <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>65 Jurisdictions · Energy Standards · Embodied Carbon · Retrofit Mandates · Stranded Stock</div>
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
            <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>Target Year</div>
            <select value={filterTargetYear} onChange={e => setFilterTargetYear(e.target.value)} style={{ padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 6, background: T.sub }}>
              <option>All</option>{TARGET_YEARS_BUCKET.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>Compliance Rate</div>
            <select value={filterCompliance} onChange={e => setFilterCompliance(e.target.value)} style={{ padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 6, background: T.sub }}>
              <option>All</option>{COMPLIANCE_BUCKETS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>Carbon Price: ${carbonPrice}/tCO₂</div>
            <input type="range" min={10} max={200} step={10} value={carbonPrice} onChange={e => setCarbonPrice(+e.target.value)} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>Retrofit Subsidy Rate: {retrofitSubsidy}%</div>
            <input type="range" min={0} max={60} step={5} value={retrofitSubsidy} onChange={e => setRetrofitSubsidy(+e.target.value)} />
          </div>
          <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono }}>{filtered.length} / {JURISDICTIONS.length}</div>
        </div>

        {/* KPIs */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
          <KpiCard label="AVG ENERGY STANDARD" value={`${avgEnergy} kWh/m²/yr`} sub="mean across jurisdictions" color={T.amber} />
          <KpiCard label="% WITH NZ TARGET SET" value={`${nzTargetSet}%`} sub="by 2050" color={T.green} />
          <KpiCard label="TOTAL RETROFIT FUNDING" value={`$${totalRetrofitFund}Bn`} sub="committed" color={T.navy} />
          <KpiCard label="TOTAL CARBON SAVINGS" value={`${totalCarbonSavings} MtCO₂/yr`} sub="from building codes" color={T.teal} />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap' }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)} style={{ ...i === tab ? sel : unsel, padding: '7px 14px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>{t}</button>
          ))}
        </div>

        {tab === 0 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Jurisdiction Overview</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Jurisdiction', 'Region', 'Code Ver', 'NZ Target', 'Energy Std', 'Embodied C', 'Compliance %', 'Enforcement', 'Retrofit $Bn', 'Stranded %'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: T.textSec, fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...filtered].sort((a, b) => a.energyEfficiencyStandard - b.energyEfficiencyStandard).slice(0, 25).map((j, i) => (
                    <tr key={j.id} style={{ borderBottom: `1px solid ${T.borderL}`, background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>{j.name}</td>
                      <td style={{ padding: '8px 12px', color: T.textSec }}>{j.region}</td>
                      <td style={{ padding: '8px 12px' }}>{j.buildingCodeVersion}</td>
                      <td style={{ padding: '8px 12px', color: j.netZeroBuildingTarget <= 2030 ? T.green : T.amber }}>{j.netZeroBuildingTarget}</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.fontMono, color: j.energyEfficiencyStandard < 80 ? T.green : T.textPri }}>{j.energyEfficiencyStandard}</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>{j.embodiedCarbonLimit}</td>
                      <td style={{ padding: '8px 12px', color: j.complianceRate >= 80 ? T.green : j.complianceRate >= 50 ? T.amber : T.red }}>{j.complianceRate}%</td>
                      <td style={{ padding: '8px 12px' }}>{j.enforcementStrength}/10</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>${j.retrofitFunding}</td>
                      <td style={{ padding: '8px 12px', color: j.strandedBuildingStock > 30 ? T.red : T.textPri }}>{j.strandedBuildingStock}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 1 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Net Zero Building Target Distribution</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
              {TARGET_YEARS_BUCKET.map(b => {
                const arr = filtered.filter(j => j.targetYearBucket === b);
                return (
                  <div key={b} style={{ background: T.sub, borderRadius: 6, padding: 16, textAlign: 'center' }}>
                    <div style={{ fontSize: 12, color: T.textSec }}>{b}</div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: T.navy, marginTop: 4 }}>{arr.length}</div>
                    <div style={{ fontSize: 11, color: T.textSec }}>jurisdictions</div>
                  </div>
                );
              })}
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={REGIONS.map(r => {
                const arr = filtered.filter(j => j.region === r);
                return {
                  name: r.split(' ')[0],
                  near: arr.filter(j => j.targetYearBucket === 'Near (≤2030)').length,
                  mid: arr.filter(j => j.targetYearBucket === 'Mid (2031-2040)').length,
                  long: arr.filter(j => j.targetYearBucket === 'Long (2041-2050)').length,
                };
              })}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="near" name="Near ≤2030" stackId="a" fill={T.green} />
                <Bar dataKey="mid" name="Mid 2031-40" stackId="a" fill={T.amber} />
                <Bar dataKey="long" name="Long 2041-50" stackId="a" fill={T.red} radius={[4, 4, 0, 0]} />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 2 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Energy Efficiency Standard by Region (kWh/m²/yr)</div>
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={energyByRegion}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={v => `${v} kWh/m²/yr`} />
                <Bar dataKey="avgEnergy" fill={T.amber} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 3 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Embodied Carbon Limits (kgCO₂e/m²) — Top 20 Strictest</div>
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={[...filtered].sort((a, b) => a.embodiedCarbonLimit - b.embodiedCarbonLimit).slice(0, 20).map(j => ({ name: j.name.split(' ')[0], limit: j.embodiedCarbonLimit }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={v => `${v} kgCO₂e/m²`} />
                <Bar dataKey="limit" fill={T.teal} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 4 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Retrofit Funding by Region ($Bn)</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={retrofitByCountry}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={v => `$${v}Bn`} />
                  <Bar dataKey="fund" fill={T.indigo} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Retrofit Subsidy Scenario ({retrofitSubsidy}%)</div>
              {filtered.slice(0, 10).map(j => {
                const subsidized = j.retrofitFunding * (1 + retrofitSubsidy / 100);
                return (
                  <div key={j.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.borderL}` }}>
                    <span style={{ fontSize: 12 }}>{j.name}</span>
                    <span style={{ fontFamily: T.fontMono, fontSize: 12, color: T.green }}>${subsidized.toFixed(1)}Bn</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 5 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Compliance Rate vs Carbon Savings</div>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="x" name="Compliance (%)" tick={{ fontSize: 11 }} label={{ value: 'Compliance (%)', position: 'insideBottom', offset: -5 }} />
                  <YAxis dataKey="y" name="Carbon Savings (MtCO₂/yr)" tick={{ fontSize: 11 }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter data={scatterCompliance} fill={T.green} opacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Enforcement Strength Ranking — Top 15</div>
              {[...filtered].sort((a, b) => b.enforcementStrength - a.enforcementStrength).slice(0, 15).map(j => (
                <div key={j.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <span style={{ fontSize: 12 }}>{j.name}</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ fontFamily: T.fontMono, fontSize: 12, color: T.teal }}>{j.enforcementStrength}/10</span>
                    <span style={{ fontSize: 11, color: T.textSec }}>{j.complianceRate}% compliant</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 6 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Stranded Building Stock by Region (% of total stock)</div>
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={strandedByRegion}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={v => `${v}%`} />
                <Bar dataKey="stranded" fill={T.red} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ marginTop: 16, background: T.sub, borderRadius: 6, padding: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Carbon Price Impact on Stranded Assets</div>
              <div style={{ fontSize: 12, color: T.textSec }}>At ${carbonPrice}/tCO₂, estimated stranded asset loss: <strong style={{ color: T.red }}>${(carbonPrice * +totalCarbonSavings * 0.5).toFixed(0)}M avg per jurisdiction</strong></div>
            </div>
          </div>
        )}

        {tab === 7 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Carbon Savings from Building Code (MtCO₂/yr) — Top 15</div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={[...filtered].sort((a, b) => b.carbonSavingsFromCode - a.carbonSavingsFromCode).slice(0, 15).map(j => ({ name: j.name.split(' ')[0], co2: j.carbonSavingsFromCode }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={v => `${v} MtCO₂/yr`} />
                  <Bar dataKey="co2" fill={T.teal} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Carbon Value at ${carbonPrice}/tCO₂</div>
              {filtered.slice(0, 12).map(j => {
                const val = (j.carbonSavingsFromCode * 1000 * carbonPrice / 1000).toFixed(1);
                return (
                  <div key={j.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.borderL}` }}>
                    <span style={{ fontSize: 12 }}>{j.name}</span>
                    <span style={{ fontFamily: T.fontMono, fontSize: 12, color: T.green }}>${val}M/yr</span>
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
