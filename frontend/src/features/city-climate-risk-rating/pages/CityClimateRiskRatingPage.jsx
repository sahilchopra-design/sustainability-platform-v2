import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend,
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
const RISK_TIERS = ['Low', 'Medium', 'High', 'Critical'];

const CITY_NAMES = [
  'Miami', 'Houston', 'Phoenix', 'New Orleans', 'Los Angeles',
  'New York', 'Chicago', 'Seattle', 'Boston', 'San Francisco',
  'London', 'Amsterdam', 'Hamburg', 'Copenhagen', 'Rotterdam',
  'Venice', 'Barcelona', 'Lisbon', 'Athens', 'Istanbul',
  'Tokyo', 'Osaka', 'Shanghai', 'Guangzhou', 'Bangkok',
  'Jakarta', 'Manila', 'Ho Chi Minh City', 'Mumbai', 'Kolkata',
  'Dhaka', 'Karachi', 'Chennai', 'Colombo', 'Yangon',
  'Sydney', 'Melbourne', 'Auckland', 'Brisbane', 'Perth',
  'Cairo', 'Alexandria', 'Lagos', 'Accra', 'Dakar',
  'Nairobi', 'Dar es Salaam', 'Maputo', 'Cape Town', 'Durban',
  'Dubai', 'Abu Dhabi', 'Doha', 'Kuwait City', 'Riyadh',
  'Mexico City', 'Guadalajara', 'São Paulo', 'Rio de Janeiro', 'Recife',
  'Buenos Aires', 'Lima', 'Bogotá', 'Santiago', 'Caracas',
  'Guayaquil', 'Panama City', 'Santo Domingo', 'Port-au-Prince', 'Kingston',
  'Mumbai2', 'Delhi', 'Bangalore', 'Hyderabad', 'Pune',
  'Singapore', 'Kuala Lumpur', 'Taipei', 'Seoul', 'Hong Kong',
];

const CITIES = Array.from({ length: 80 }, (_, i) => {
  const region = REGIONS[i % REGIONS.length];
  const physRisk = Math.round(20 + sr(i * 3) * 80);
  const floodR = +(1 + sr(i * 7) * 9).toFixed(1);
  const heatR = +(1 + sr(i * 11) * 9).toFixed(1);
  const slrR = +(1 + sr(i * 13) * 9).toFixed(1);
  const droughtR = +(1 + sr(i * 17) * 9).toFixed(1);
  const airQ = +(1 + sr(i * 19) * 9).toFixed(1);
  const econRes = Math.round(20 + sr(i * 23) * 80);
  const infraVuln = +(1 + sr(i * 29) * 9).toFixed(1);
  const creditImpact = +(sr(i * 31) * 4).toFixed(1);
  const adaptBudget = +(0.1 + sr(i * 37) * 9.9).toFixed(1);
  const climDebt = +(1 + sr(i * 41) * 9).toFixed(1);
  const igRisk = physRisk > 65;
  const riskTier = physRisk < 35 ? 'Low' : physRisk < 55 ? 'Medium' : physRisk < 75 ? 'High' : 'Critical';
  return {
    id: i,
    name: CITY_NAMES[i] || `City ${i + 1}`,
    country: region.split(' ').pop(),
    region,
    population: +(0.5 + sr(i * 43) * 19.5).toFixed(1),
    physicalRiskScore: physRisk,
    floodRisk: floodR,
    heatRisk: heatR,
    seaLevelRisk: slrR,
    droughtRisk: droughtR,
    airQualityRisk: airQ,
    economicResilienceScore: econRes,
    infraVulnerability: infraVuln,
    creditRatingImpact: creditImpact,
    adaptationBudget: adaptBudget,
    climateDebtRisk: climDebt,
    investmentGradeRisk: igRisk,
    riskTier,
  };
});

const TABS = [
  'City Risk Overview', 'Physical Hazard Profile', 'Heat Risk', 'Flood Risk',
  'Sea Level Risk', 'Economic Resilience', 'Credit Impact', 'Investment Grade Risk',
];

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px', flex: 1, minWidth: 180 }}>
    <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 700, color: color || T.navy }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{sub}</div>}
  </div>
);

const riskColor = score => score >= 75 ? T.red : score >= 55 ? T.amber : score >= 35 ? T.gold : T.green;

export default function CityClimateRiskRatingPage() {
  const [tab, setTab] = useState(0);
  const [filterRegion, setFilterRegion] = useState('All');
  const [filterTier, setFilterTier] = useState('All');
  const [filterIGRisk, setFilterIGRisk] = useState('All');
  const [slrScenario, setSlrScenario] = useState(50);
  const [heatScenario, setHeatScenario] = useState(1.5);

  const filtered = useMemo(() => CITIES.filter(c =>
    (filterRegion === 'All' || c.region === filterRegion) &&
    (filterTier === 'All' || c.riskTier === filterTier) &&
    (filterIGRisk === 'All' || (filterIGRisk === 'Yes' ? c.investmentGradeRisk : !c.investmentGradeRisk))
  ), [filterRegion, filterTier, filterIGRisk]);

  const avgPhysRisk = filtered.length ? (filtered.reduce((s, c) => s + c.physicalRiskScore, 0) / filtered.length).toFixed(0) : '0';
  const igRiskPct = filtered.length ? (filtered.filter(c => c.investmentGradeRisk).length / filtered.length * 100).toFixed(0) : '0';
  const totalAdapt = filtered.reduce((s, c) => s + c.adaptationBudget, 0).toFixed(1);
  const avgCredit = filtered.length ? (filtered.reduce((s, c) => s + c.creditRatingImpact, 0) / filtered.length).toFixed(1) : '0';

  const regionRisk = REGIONS.map(r => {
    const arr = filtered.filter(c => c.region === r);
    return { name: r.split(' ')[0], avgRisk: arr.length ? Math.round(arr.reduce((s, c) => s + c.physicalRiskScore, 0) / arr.length) : 0 };
  });

  const top5 = [...filtered].sort((a, b) => b.physicalRiskScore - a.physicalRiskScore).slice(0, 5);
  const radarData = ['floodRisk', 'heatRisk', 'seaLevelRisk', 'droughtRisk', 'airQualityRisk'].map(dim => {
    const entry = { dimension: dim.replace('Risk', '').replace(/([A-Z])/g, ' $1').trim() };
    top5.forEach(c => { entry[c.name.split(' ')[0]] = c[dim]; });
    return entry;
  });

  const scatterData = filtered.map(c => ({ x: c.adaptationBudget, y: c.physicalRiskScore, name: c.name }));
  const creditByRegion = REGIONS.map(r => {
    const arr = filtered.filter(c => c.region === r);
    return { name: r.split(' ')[0], avgImpact: arr.length ? +(arr.reduce((s, c) => s + c.creditRatingImpact, 0) / arr.length).toFixed(1) : 0 };
  });

  const sel = { background: T.navy, color: '#fff', border: `1px solid ${T.navy}` };
  const unsel = { background: T.card, color: T.textPri, border: `1px solid ${T.border}` };
  const COLORS = [T.red, T.amber, T.teal, T.indigo, T.purple];

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: T.textPri }}>
      <div style={{ background: T.navy, padding: '20px 32px', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ fontSize: 11, color: T.gold, fontFamily: T.fontMono, marginBottom: 4 }}>EP-DM3 · URBAN & CITY CLIMATE FINANCE</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>City Climate Risk Rating</div>
        <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>80 Cities · Physical Hazard · Heat · Flood · Sea Level · Credit Impact · Investment Grade Risk</div>
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
            <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>Risk Tier</div>
            <select value={filterTier} onChange={e => setFilterTier(e.target.value)} style={{ padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 6, background: T.sub }}>
              <option>All</option>{RISK_TIERS.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>Investment Grade Risk</div>
            <select value={filterIGRisk} onChange={e => setFilterIGRisk(e.target.value)} style={{ padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 6, background: T.sub }}>
              <option>All</option><option value="Yes">At Risk</option><option value="No">Not at Risk</option>
            </select>
          </div>
          <div>
            <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>SLR Scenario: {slrScenario}cm</div>
            <input type="range" min={10} max={200} step={10} value={slrScenario} onChange={e => setSlrScenario(+e.target.value)} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>Heat Scenario: +{heatScenario}°C</div>
            <input type="range" min={1.5} max={4} step={0.5} value={heatScenario} onChange={e => setHeatScenario(+e.target.value)} />
          </div>
          <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono }}>{filtered.length} / {CITIES.length} cities</div>
        </div>

        {/* KPIs */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
          <KpiCard label="AVG PHYSICAL RISK SCORE" value={`${avgPhysRisk}/100`} sub="composite" color={T.red} />
          <KpiCard label="% AT INVESTMENT GRADE RISK" value={`${igRiskPct}%`} sub="downgrade threat" color={T.amber} />
          <KpiCard label="TOTAL ADAPTATION BUDGET" value={`$${totalAdapt}Bn`} sub="committed" color={T.teal} />
          <KpiCard label="AVG CREDIT RATING IMPACT" value={`-${avgCredit} notches`} sub="projected" color={T.navy} />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap' }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)} style={{ ...i === tab ? sel : unsel, padding: '7px 14px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>{t}</button>
          ))}
        </div>

        {tab === 0 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>City Risk Rankings</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['City', 'Region', 'Risk Tier', 'Physical Risk', 'Flood', 'Heat', 'SLR', 'Eco Resilience', 'Credit Impact', 'IG Risk'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: T.textSec, fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...filtered].sort((a, b) => b.physicalRiskScore - a.physicalRiskScore).slice(0, 25).map((c, i) => (
                    <tr key={c.id} style={{ borderBottom: `1px solid ${T.borderL}`, background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>{c.name}</td>
                      <td style={{ padding: '8px 12px', color: T.textSec }}>{c.region}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{ background: riskColor(c.physicalRiskScore) + '20', color: riskColor(c.physicalRiskScore), padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>{c.riskTier}</span>
                      </td>
                      <td style={{ padding: '8px 12px', fontFamily: T.fontMono, fontWeight: 700, color: riskColor(c.physicalRiskScore) }}>{c.physicalRiskScore}</td>
                      <td style={{ padding: '8px 12px', color: T.blue }}>{c.floodRisk}</td>
                      <td style={{ padding: '8px 12px', color: T.orange }}>{c.heatRisk}</td>
                      <td style={{ padding: '8px 12px', color: T.teal }}>{c.seaLevelRisk}</td>
                      <td style={{ padding: '8px 12px', color: T.green }}>{c.economicResilienceScore}</td>
                      <td style={{ padding: '8px 12px', color: T.red }}>-{c.creditRatingImpact}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{ color: c.investmentGradeRisk ? T.red : T.green, fontWeight: 700 }}>{c.investmentGradeRisk ? 'Yes' : 'No'}</span>
                      </td>
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
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Physical Risk Score by Region</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={regionRisk}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="avgRisk" fill={T.red} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Hazard Radar — Top 5 Highest Risk Cities</div>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 10 }} />
                  <PolarRadiusAxis domain={[0, 10]} tick={{ fontSize: 9 }} />
                  {top5.map((c, i) => (
                    <Radar key={c.id} name={c.name.split(' ')[0]} dataKey={c.name.split(' ')[0]} stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.15} />
                  ))}
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 2 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Heat Risk Score — Top 20 Cities (+{heatScenario}°C scenario)</div>
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={[...filtered].sort((a, b) => b.heatRisk - a.heatRisk).slice(0, 20).map(c => ({
                name: c.name.split(' ')[0],
                base: c.heatRisk,
                stressed: Math.min(10, +(c.heatRisk * (1 + (heatScenario - 1.5) * 0.1)).toFixed(1)),
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="base" name="Base" fill={T.amber} radius={[4, 4, 0, 0]} />
                <Bar dataKey="stressed" name="Stressed" fill={T.red} radius={[4, 4, 0, 0]} />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 3 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Flood Risk Score — Top 20 Cities</div>
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={[...filtered].sort((a, b) => b.floodRisk - a.floodRisk).slice(0, 20).map(c => ({ name: c.name.split(' ')[0], flood: c.floodRisk, infra: c.infraVulnerability }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="flood" name="Flood Risk" fill={T.blue} radius={[4, 4, 0, 0]} />
                <Bar dataKey="infra" name="Infra Vulnerability" fill={T.purple} radius={[4, 4, 0, 0]} />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 4 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Sea Level Rise Risk — {slrScenario}cm scenario</div>
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={[...filtered].sort((a, b) => b.seaLevelRisk - a.seaLevelRisk).slice(0, 20).map(c => ({
                name: c.name.split(' ')[0],
                slr: c.seaLevelRisk,
                stressed: Math.min(10, +(c.seaLevelRisk * (1 + (slrScenario - 50) / 200)).toFixed(1)),
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="slr" name="Base SLR Risk" fill={T.teal} radius={[4, 4, 0, 0]} />
                <Bar dataKey="stressed" name={`${slrScenario}cm Scenario`} fill={T.navy} radius={[4, 4, 0, 0]} />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 5 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Adaptation Budget vs Physical Risk</div>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="x" name="Adapt Budget ($Bn)" tick={{ fontSize: 11 }} label={{ value: 'Adapt Budget ($Bn)', position: 'insideBottom', offset: -5 }} />
                  <YAxis dataKey="y" name="Physical Risk" tick={{ fontSize: 11 }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter data={scatterData} fill={T.teal} opacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Economic Resilience vs Physical Risk</div>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="x" name="Eco Resilience" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="y" name="Physical Risk" tick={{ fontSize: 11 }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter data={filtered.map(c => ({ x: c.economicResilienceScore, y: c.physicalRiskScore, name: c.name }))} fill={T.indigo} opacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 6 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Avg Credit Rating Impact by Region (notches)</div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={creditByRegion}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={v => `-${v} notches`} />
                <Bar dataKey="avgImpact" fill={T.red} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 7 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Investment Grade Risk Cities</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {filtered.filter(c => c.investmentGradeRisk).map(c => (
                <div key={c.id} style={{ background: T.red + '08', border: `1px solid ${T.red}30`, borderRadius: 6, padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</div>
                    <span style={{ background: T.red + '20', color: T.red, padding: '2px 8px', borderRadius: 4, fontSize: 10 }}>IG RISK</span>
                  </div>
                  <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{c.region}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 8 }}>
                    <div><div style={{ fontSize: 10, color: T.textSec }}>Physical Risk</div><div style={{ fontFamily: T.fontMono, fontSize: 14, fontWeight: 700, color: T.red }}>{c.physicalRiskScore}</div></div>
                    <div><div style={{ fontSize: 10, color: T.textSec }}>Credit Impact</div><div style={{ fontFamily: T.fontMono, fontSize: 14, fontWeight: 700, color: T.amber }}>-{c.creditRatingImpact}</div></div>
                    <div><div style={{ fontSize: 10, color: T.textSec }}>Adapt Budget</div><div style={{ fontFamily: T.fontMono, fontSize: 14 }}>${c.adaptationBudget}Bn</div></div>
                    <div><div style={{ fontSize: 10, color: T.textSec }}>Debt Risk</div><div style={{ fontFamily: T.fontMono, fontSize: 14 }}>{c.climateDebtRisk}/10</div></div>
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
