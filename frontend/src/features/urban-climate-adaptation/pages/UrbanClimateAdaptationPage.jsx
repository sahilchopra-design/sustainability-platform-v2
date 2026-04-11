import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, LineChart, Line,
  CartesianGrid, Legend,
} from 'recharts';

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f6f4f0',
  navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f',
  teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c',
  surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace',
};

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const REGIONS = ['Europe', 'Asia-Pacific', 'North America', 'South America', 'Africa', 'Middle East'];
const RISK_LEVELS = ['Low', 'Medium', 'High', 'Critical'];

const CITY_NAMES = [
  'London', 'Tokyo', 'New York', 'Mumbai', 'Lagos', 'Cairo', 'Sydney', 'São Paulo',
  'Miami', 'Amsterdam', 'Bangkok', 'Jakarta', 'Shanghai', 'Dhaka', 'Nairobi',
  'Houston', 'Rotterdam', 'Kolkata', 'Ho Chi Minh City', 'New Orleans',
  'Karachi', 'Manila', 'Guangzhou', 'Chennai', 'Copenhagen',
  'Singapore', 'Osaka', 'Melbourne', 'Durban', 'Lima',
  'Cairo', 'Riyadh', 'Johannesburg', 'Accra', 'Dakar',
  'Vienna', 'Barcelona', 'Casablanca', 'Dar es Salaam', 'Bogotá',
];

const CITIES = Array.from({ length: 40 }, (_, i) => {
  const name = CITY_NAMES[i % CITY_NAMES.length] + (i >= CITY_NAMES.length ? ` ${Math.floor(i / CITY_NAMES.length) + 1}` : '');
  const region = REGIONS[Math.floor(sr(i * 7) * REGIONS.length)];
  const country = name;
  const population = parseFloat((0.5 + sr(i * 3) * 29.5).toFixed(1));
  const heatIndex = parseFloat((1 + sr(i * 5) * 9).toFixed(1));
  const floodRisk = parseFloat((1 + sr(i * 9) * 9).toFixed(1));
  const droughtRisk = parseFloat((1 + sr(i * 11) * 9).toFixed(1));
  const adaptationBudget = parseFloat((0.1 + sr(i * 13) * 9.9).toFixed(2));
  const gdpAtRisk = parseFloat((1 + sr(i * 17) * 29).toFixed(1));
  const greenInfraInvestment = parseFloat((0.05 + sr(i * 19) * 2.95).toFixed(2));
  const need = gdpAtRisk * 0.15 + heatIndex * 0.3 + floodRisk * 0.25;
  const adaptationGap = parseFloat(Math.max(0, need - adaptationBudget).toFixed(2));
  const adaptationScore = Math.round(100 - (adaptationGap / (need + 1)) * 60 - heatIndex * 2 + sr(i * 23) * 15);
  const urbanHeatIslandIntensity = parseFloat((0.5 + sr(i * 29) * 4.5).toFixed(1));
  const riskScore = (heatIndex + floodRisk + droughtRisk) / 3;
  const riskLevel = riskScore >= 7.5 ? 'Critical' : riskScore >= 5 ? 'High' : riskScore >= 2.5 ? 'Medium' : 'Low';
  return {
    id: i + 1, name, region, country, population, heatIndex, floodRisk, droughtRisk,
    adaptationBudget, gdpAtRisk, greenInfraInvestment, adaptationGap,
    adaptationScore: Math.max(10, Math.min(100, adaptationScore)),
    urbanHeatIslandIntensity, riskLevel,
  };
});

const TABS = [
  'City Overview', 'Heat Risk', 'Flood Exposure', 'Adaptation Finance',
  'Green Infrastructure', 'GDP at Risk', 'Adaptation Gap', 'Resilience Rankings',
];

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px', flex: 1, minWidth: 160 }}>
    <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: color || T.navy }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>{sub}</div>}
  </div>
);

export default function UrbanClimateAdaptationPage() {
  const [tab, setTab] = useState('City Overview');
  const [filterRegion, setFilterRegion] = useState('All');
  const [filterRisk, setFilterRisk] = useState('All');
  const [tempScenario, setTempScenario] = useState(2.0);
  const [greenMultiplier, setGreenMultiplier] = useState(1.0);

  const filtered = useMemo(() => CITIES.filter(c => {
    if (filterRegion !== 'All' && c.region !== filterRegion) return false;
    if (filterRisk !== 'All' && c.riskLevel !== filterRisk) return false;
    return true;
  }), [filterRegion, filterRisk]);

  const totalBudget = filtered.length ? filtered.reduce((s, c) => s + c.adaptationBudget, 0).toFixed(1) : '0.0';
  const avgGdpAtRisk = filtered.length ? (filtered.reduce((s, c) => s + c.gdpAtRisk, 0) / filtered.length).toFixed(1) : '0.0';
  const totalGap = filtered.length ? filtered.reduce((s, c) => s + c.adaptationGap, 0).toFixed(1) : '0.0';
  const avgResilienceScore = filtered.length ? (filtered.reduce((s, c) => s + c.adaptationScore, 0) / filtered.length).toFixed(0) : '0';

  const scenarioMult = tempScenario / 2.0;

  const adaptGapTop15 = useMemo(() => [...filtered].sort((a, b) => b.adaptationGap - a.adaptationGap).slice(0, 15).map(c => ({
    name: c.name.slice(0, 14), 'Adaptation Gap £Bn': parseFloat((c.adaptationGap * scenarioMult).toFixed(2)),
  })), [filtered, scenarioMult]);

  const scatterData = useMemo(() => filtered.map(c => ({
    x: c.adaptationBudget * greenMultiplier, y: c.gdpAtRisk, name: c.name,
  })), [filtered, greenMultiplier]);

  const heatTrend = useMemo(() => {
    const years = [2025, 2030, 2035, 2040, 2045, 2050];
    const avgHeat = filtered.length ? filtered.reduce((s, c) => s + c.heatIndex, 0) / filtered.length : 5;
    return years.map((yr, i) => ({
      year: yr,
      'Avg Heat Index': parseFloat((avgHeat * (1 + i * 0.04 * scenarioMult)).toFixed(2)),
      'With Green Infra': parseFloat((avgHeat * (1 + i * 0.04 * scenarioMult) * (1 - greenMultiplier * 0.04 * i)).toFixed(2)),
    }));
  }, [filtered, scenarioMult, greenMultiplier]);

  const greenByRegion = useMemo(() => REGIONS.map(r => {
    const arr = filtered.filter(c => c.region === r);
    return { name: r.slice(0, 8), 'Green Infra £Bn': arr.length ? parseFloat((arr.reduce((s, c) => s + c.greenInfraInvestment, 0) * greenMultiplier).toFixed(2)) : 0 };
  }), [filtered, greenMultiplier]);

  const gdpByRegion = useMemo(() => REGIONS.map(r => {
    const arr = filtered.filter(c => c.region === r);
    return { name: r.slice(0, 8), 'Avg GDP at Risk (%)': arr.length ? parseFloat((arr.reduce((s, c) => s + c.gdpAtRisk, 0) / arr.length * scenarioMult).toFixed(1)) : 0 };
  }), [filtered, scenarioMult]);

  const floodData = useMemo(() => REGIONS.map(r => {
    const arr = filtered.filter(c => c.region === r);
    return { name: r.slice(0, 8), 'Avg Flood Risk': arr.length ? parseFloat((arr.reduce((s, c) => s + c.floodRisk, 0) / arr.length).toFixed(1)) : 0 };
  }), [filtered]);

  const rankingsData = useMemo(() => [...filtered].sort((a, b) => b.adaptationScore - a.adaptationScore).slice(0, 20).map(c => ({
    name: c.name.slice(0, 14), Score: c.adaptationScore,
  })), [filtered]);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: T.textPri }}>
      <div style={{ background: T.navy, padding: '20px 32px', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ fontSize: 11, color: T.gold, fontFamily: T.fontMono, letterSpacing: 2, marginBottom: 4 }}>EP-DE5 · GREEN REAL ESTATE & BUILT ENVIRONMENT</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>Urban Climate Adaptation Intelligence</div>
        <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>40 global cities · Heat & flood risk · Adaptation finance · Green infrastructure · Resilience rankings</div>
      </div>

      <div style={{ background: T.cream, borderBottom: `1px solid ${T.border}`, padding: '12px 32px', display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {[['Region', filterRegion, setFilterRegion, ['All', ...REGIONS]],
          ['Risk Level', filterRisk, setFilterRisk, ['All', ...RISK_LEVELS]]].map(([label, val, setter, opts]) => (
          <label key={label} style={{ fontSize: 12, color: T.textSec, display: 'flex', alignItems: 'center', gap: 6 }}>
            {label}:
            <select value={val} onChange={e => setter(e.target.value)}
              style={{ fontSize: 12, padding: '3px 8px', borderRadius: 4, border: `1px solid ${T.border}`, background: T.card }}>
              {opts.map(o => <option key={o}>{o}</option>)}
            </select>
          </label>
        ))}
        <label style={{ fontSize: 12, color: T.textSec, display: 'flex', alignItems: 'center', gap: 6 }}>
          Temp +{tempScenario.toFixed(1)}°C:
          <input type="range" min={1.5} max={4.0} step={0.5} value={tempScenario} onChange={e => setTempScenario(+e.target.value)} style={{ width: 100 }} />
        </label>
        <label style={{ fontSize: 12, color: T.textSec, display: 'flex', alignItems: 'center', gap: 6 }}>
          Green Infra ×{greenMultiplier.toFixed(1)}:
          <input type="range" min={0.5} max={3.0} step={0.5} value={greenMultiplier} onChange={e => setGreenMultiplier(+e.target.value)} style={{ width: 100 }} />
        </label>
        <span style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono }}>{filtered.length} / {CITIES.length} cities</span>
      </div>

      <div style={{ display: 'flex', gap: 16, padding: '20px 32px', flexWrap: 'wrap' }}>
        <KpiCard label="Total Adaptation Budget" value={`£${totalBudget}Bn`} sub="filtered cities" color={T.navy} />
        <KpiCard label="Avg GDP at Risk" value={`${avgGdpAtRisk}%`} sub={`+${tempScenario}°C scenario`} color={T.red} />
        <KpiCard label="Total Adaptation Gap" value={`£${totalGap}Bn`} sub="funding shortfall" color={T.orange} />
        <KpiCard label="Avg Resilience Score" value={`${avgResilienceScore} / 100`} sub="filtered cities" color={T.green} />
      </div>

      <div style={{ display: 'flex', gap: 0, padding: '0 32px', borderBottom: `1px solid ${T.border}` }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '10px 14px', fontSize: 12, fontWeight: tab === t ? 700 : 400, background: 'none', border: 'none',
              borderBottom: tab === t ? `3px solid ${T.gold}` : '3px solid transparent',
              color: tab === t ? T.navy : T.textSec, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {t}
          </button>
        ))}
      </div>

      <div style={{ padding: '24px 32px' }}>
        {tab === 'City Overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: T.navy }}>Adaptation Gap — Top 15 Cities (£Bn)</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={adaptGapTop15} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={90} />
                  <Tooltip />
                  <Bar dataKey="Adaptation Gap £Bn" fill={T.red} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: T.navy }}>GDP at Risk vs Adaptation Budget</div>
              <ResponsiveContainer width="100%" height={280}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="x" name="Budget £Bn" tick={{ fontSize: 11 }} label={{ value: 'Budget £Bn', position: 'insideBottom', offset: -5, fontSize: 11 }} />
                  <YAxis dataKey="y" name="GDP at Risk %" tick={{ fontSize: 11 }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter data={scatterData} fill={T.teal} fillOpacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 'Heat Risk' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: T.navy }}>Heat Risk Trend +{tempScenario.toFixed(1)}°C — Green Infra ×{greenMultiplier.toFixed(1)}</div>
              <ResponsiveContainer width="100%" height={340}>
                <LineChart data={heatTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[0, 12]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="Avg Heat Index" stroke={T.red} strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="With Green Infra" stroke={T.green} strokeWidth={2} dot={{ r: 4 }} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 'Flood Exposure' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: T.navy }}>Avg Flood Risk by Region</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={floodData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[0, 10]} />
                  <Tooltip />
                  <Bar dataKey="Avg Flood Risk" fill={T.blue} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: T.navy }}>Highest Flood Risk Cities</div>
              {[...filtered].sort((a, b) => b.floodRisk - a.floodRisk).slice(0, 12).map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${T.borderL}`, fontSize: 12 }}>
                  <span>{c.name}</span>
                  <span style={{ fontFamily: T.fontMono, color: c.floodRisk > 7 ? T.red : T.amber }}>{c.floodRisk.toFixed(1)} / 10</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'Adaptation Finance' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: T.navy }}>Adaptation Gap — Top 15 (£Bn at +{tempScenario.toFixed(1)}°C)</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={adaptGapTop15} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={90} />
                  <Tooltip />
                  <Bar dataKey="Adaptation Gap £Bn" fill={T.red} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: T.navy }}>Largest Adaptation Gaps</div>
              {[...filtered].sort((a, b) => b.adaptationGap - a.adaptationGap).slice(0, 12).map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${T.borderL}`, fontSize: 12 }}>
                  <div>
                    <div style={{ color: T.textPri }}>{c.name}</div>
                    <div style={{ fontSize: 10, color: T.textSec }}>{c.region}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: T.fontMono, color: T.red, fontSize: 11 }}>Gap £{(c.adaptationGap * scenarioMult).toFixed(2)}Bn</div>
                    <div style={{ fontSize: 10, color: T.textSec }}>Budget £{c.adaptationBudget}Bn</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'Green Infrastructure' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: T.navy }}>Green Infrastructure Investment by Region (£Bn × {greenMultiplier.toFixed(1)} multiplier)</div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={greenByRegion}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="Green Infra £Bn" fill={T.green} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 'GDP at Risk' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: T.navy }}>Avg GDP at Risk by Region (% at +{tempScenario.toFixed(1)}°C)</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={gdpByRegion}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="Avg GDP at Risk (%)" fill={T.orange} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: T.navy }}>GDP at Risk vs Adaptation Budget</div>
              <ResponsiveContainer width="100%" height={280}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="x" name="Budget £Bn" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="y" name="GDP at Risk %" tick={{ fontSize: 11 }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter data={scatterData} fill={T.amber} fillOpacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 'Adaptation Gap' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: T.navy }}>Adaptation Gap by City — Top 15 (£Bn at +{tempScenario.toFixed(1)}°C)</div>
              <ResponsiveContainer width="100%" height={380}>
                <BarChart data={adaptGapTop15} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                  <Tooltip />
                  <Bar dataKey="Adaptation Gap £Bn" fill={T.red} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 'Resilience Rankings' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: T.navy }}>Top 20 Resilience Scores</div>
              <ResponsiveContainer width="100%" height={380}>
                <BarChart data={rankingsData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis type="number" tick={{ fontSize: 11 }} domain={[0, 100]} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={90} />
                  <Tooltip />
                  <Bar dataKey="Score" fill={T.teal} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: T.navy }}>City Resilience — Detail View</div>
              {[...filtered].sort((a, b) => b.adaptationScore - a.adaptationScore).slice(0, 12).map((c, idx) => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${T.borderL}`, fontSize: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: T.fontMono, fontSize: 10, color: T.textSec, width: 20 }}>#{idx + 1}</span>
                    <div>
                      <div style={{ fontWeight: 600 }}>{c.name}</div>
                      <div style={{ fontSize: 10, color: T.textSec }}>{c.region}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: T.fontMono, fontWeight: 700, color: c.adaptationScore >= 70 ? T.green : c.adaptationScore >= 45 ? T.amber : T.red }}>{c.adaptationScore}</div>
                    <div style={{ fontSize: 10, color: T.textSec }}>GDP risk {c.gdpAtRisk}%</div>
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
