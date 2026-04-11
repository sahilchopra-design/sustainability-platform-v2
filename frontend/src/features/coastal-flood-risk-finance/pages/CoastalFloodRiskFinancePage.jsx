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

const REGIONS = ['Asia Pacific', 'North America', 'Europe', 'Latin America', 'Africa', 'Middle East', 'South Asia', 'Pacific Islands'];

const CITY_NAMES = [
  'Miami', 'Jakarta', 'Mumbai', 'Shanghai', 'Bangkok', 'Ho Chi Minh City', 'Dhaka', 'Manila',
  'New York', 'London', 'Amsterdam', 'Rotterdam', 'New Orleans', 'Houston', 'Venice', 'Copenhagen',
  'Tokyo', 'Osaka', 'Guangzhou', 'Shenzhen', 'Tianjin', 'Hangzhou', 'Wuhan', 'Nanjing',
  'Lagos', 'Alexandria', 'Casablanca', 'Dakar', 'Maputo', 'Mombasa', 'Dar es Salaam', 'Abidjan',
  'Buenos Aires', 'Rio de Janeiro', 'Recife', 'Fortaleza', 'Cartagena', 'Lima', 'Guayaquil', 'Santos',
  'Singapore', 'Kuala Lumpur', 'Ho Chi Minh', 'Kolkata', 'Chennai', 'Colombo', 'Chittagong', 'Karachi',
  'Abu Dhabi', 'Dubai', 'Doha', 'Kuwait City', 'Basra', 'Alexandria', 'Suez', 'Port Said',
  'Sydney', 'Melbourne', 'Brisbane', 'Auckland', 'Suva', 'Honiara', 'Port Moresby', 'Nuku\'alofa', 'Apia',
];

const getRiskLevel = (stormSurge, flood) => {
  const score = (stormSurge + flood) / 2;
  if (score >= 7.5) return 'Extreme';
  if (score >= 5.5) return 'High';
  if (score >= 3.5) return 'Medium';
  return 'Low';
};

const CITIES = Array.from({ length: 65 }, (_, i) => {
  const region = REGIONS[i % REGIONS.length];
  const stormSurge = +(1 + sr(i * 7) * 9).toFixed(1);
  const floodFreq = Math.round(1 + sr(i * 5) * 19);
  const exposed = +(5 + sr(i * 3) * 245).toFixed(1);
  const adapt = +(1 + sr(i * 17) * 29).toFixed(1);
  const slr = Math.round(10 + sr(i * 11) * 70);
  const stormRisk = +(1 + sr(i * 13) * 9).toFixed(1);
  return {
    id: i,
    name: CITY_NAMES[i] || `Coastal City ${i + 1}`,
    country: region.split(' ').pop(),
    region,
    exposedAssets: exposed,
    seaLevelRise2050: slr,
    floodFrequency: floodFreq,
    stormSurgeRisk: stormRisk,
    populationAtRisk: +(0.1 + sr(i * 19) * 9.9).toFixed(2),
    adaptationCost: adapt,
    residualRisk: +(adapt * 0.3 + sr(i * 23) * 5).toFixed(1),
    insurancePenetration: +(5 + sr(i * 29) * 85).toFixed(1),
    natureSolutionsPotential: +(1 + sr(i * 31) * 9).toFixed(1),
    seawallHeight: +(0.5 + sr(i * 37) * 9.5).toFixed(1),
    retreatRisk: +(1 + sr(i * 41) * 9).toFixed(1),
    riskLevel: getRiskLevel(stormRisk, sr(i * 7) * 10),
  };
});

const TABS = [
  'City Overview', 'Sea Level Rise', 'Storm Surge Risk', 'Asset Exposure',
  'Population at Risk', 'Adaptation Costs', 'Nature-Based Solutions', 'Insurance Gap',
];

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px', flex: 1, minWidth: 160 }}>
    <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: color || T.navy }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{sub}</div>}
  </div>
);

const RISK_COLORS = { Extreme: '#dc2626', High: '#ea580c', Medium: '#d97706', Low: '#16a34a' };

export default function CoastalFloodRiskFinancePage() {
  const [tab, setTab] = useState(0);
  const [filterRegion, setFilterRegion] = useState('All');
  const [filterRisk, setFilterRisk] = useState('All');
  const [slrScenario, setSlrScenario] = useState(50);
  const [adaptInvest, setAdaptInvest] = useState(100);

  const filtered = useMemo(() => CITIES.filter(c =>
    (filterRegion === 'All' || c.region === filterRegion) &&
    (filterRisk === 'All' || c.riskLevel === filterRisk)
  ), [filterRegion, filterRisk]);

  const totalExposed = filtered.reduce((a, c) => a + c.exposedAssets, 0).toFixed(1);
  const totalPop = filtered.reduce((a, c) => a + c.populationAtRisk, 0).toFixed(1);
  const totalAdapt = filtered.reduce((a, c) => a + c.adaptationCost, 0).toFixed(1);
  const avgInsurance = filtered.length
    ? (filtered.reduce((a, c) => a + c.insurancePenetration, 0) / filtered.length).toFixed(1)
    : '0.0';

  const exposedByCity = [...filtered].sort((a, b) => b.exposedAssets - a.exposedAssets).slice(0, 15).map(c => ({
    name: c.name,
    assets: +c.exposedAssets.toFixed(1),
  }));

  const slrVsAdapt = filtered.map(c => ({
    x: +c.seaLevelRise2050.toFixed(0),
    y: +c.adaptationCost.toFixed(1),
    name: c.name,
  }));

  const popByRegion = REGIONS.map(r => ({
    region: r.split(' ').slice(0, 2).join(' '),
    population: +filtered.filter(c => c.region === r).reduce((a, c) => a + c.populationAtRisk, 0).toFixed(2),
  }));

  const insuranceGap = [...filtered].sort((a, b) => a.insurancePenetration - b.insurancePenetration).slice(0, 15).map(c => ({
    name: c.name,
    gap: +(100 - c.insurancePenetration).toFixed(1),
    penetration: +c.insurancePenetration.toFixed(1),
  }));

  const stormData = filtered.slice(0, 15).map(c => ({
    name: c.name,
    stormRisk: +c.stormSurgeRisk.toFixed(1),
    slr: +c.seaLevelRise2050.toFixed(0),
  }));

  const nbsData = filtered.slice(0, 20).map(c => ({
    name: c.name,
    nbs: +c.natureSolutionsPotential.toFixed(1),
    adaptCost: +c.adaptationCost.toFixed(1),
  }));

  const adjustedExposure = filtered.slice(0, 15).map(c => ({
    name: c.name,
    baseline: +c.exposedAssets.toFixed(1),
    adjusted: +(c.exposedAssets * (1 + (slrScenario - 50) / 200)).toFixed(1),
  }));

  const sel = { background: T.blue, color: '#fff', border: `1px solid ${T.blue}` };
  const unsel = { background: T.card, color: T.textPri, border: `1px solid ${T.border}` };

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: T.textPri }}>
      <div style={{ background: T.navy, padding: '24px 32px', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 11, color: T.gold, fontFamily: T.fontMono, letterSpacing: 2, marginBottom: 6 }}>
              EP-DJ3 · OCEAN, SHIPPING & BLUE ECONOMY
            </div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#fff' }}>Coastal Flood Risk Finance</h1>
            <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>65 Coastal Cities · Sea Level Rise · Storm Surge · Adaptation Finance · Insurance Gap</div>
          </div>
          <div style={{ textAlign: 'right', color: '#94a3b8', fontSize: 11, fontFamily: T.fontMono }}>
            <div>SLR Scenario: {slrScenario}cm by 2100</div>
            <div>Adapt. Investment: ${adaptInvest}Bn</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '24px 32px' }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={filterRegion} onChange={e => setFilterRegion(e.target.value)}
            style={{ padding: '6px 12px', border: `1px solid ${T.border}`, borderRadius: 6, background: T.card, fontSize: 13 }}>
            <option value="All">All Regions</option>
            {REGIONS.map(r => <option key={r}>{r}</option>)}
          </select>
          <select value={filterRisk} onChange={e => setFilterRisk(e.target.value)}
            style={{ padding: '6px 12px', border: `1px solid ${T.border}`, borderRadius: 6, background: T.card, fontSize: 13 }}>
            <option value="All">All Risk Levels</option>
            {['Extreme', 'High', 'Medium', 'Low'].map(r => <option key={r}>{r}</option>)}
          </select>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 'auto' }}>
            <label style={{ fontSize: 12, color: T.textSec }}>SLR 2100: <strong>{slrScenario}cm</strong></label>
            <input type="range" min={20} max={200} step={5} value={slrScenario} onChange={e => setSlrScenario(+e.target.value)} style={{ width: 100 }} />
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <label style={{ fontSize: 12, color: T.textSec }}>Adapt: <strong>${adaptInvest}Bn</strong></label>
            <input type="range" min={10} max={1000} step={10} value={adaptInvest} onChange={e => setAdaptInvest(+e.target.value)} style={{ width: 100 }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          <KpiCard label="Total Exposed Assets" value={`$${(+totalExposed).toLocaleString()}Bn`} sub="coastal asset base" color={T.red} />
          <KpiCard label="Population at Risk" value={`${totalPop}M`} sub="persons" color={T.orange} />
          <KpiCard label="Total Adaptation Cost" value={`$${totalAdapt}Bn`} sub="investment needed" color={T.amber} />
          <KpiCard label="Avg Insurance Penetration" value={`${avgInsurance}%`} sub="of exposed assets" color={T.blue} />
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 24, flexWrap: 'wrap' }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)}
              style={{ padding: '7px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13, ...(tab === i ? sel : unsel) }}>
              {t}
            </button>
          ))}
        </div>

        {tab === 0 && (
          <div>
            <div style={{ display: 'flex', gap: 20, marginBottom: 20, flexWrap: 'wrap' }}>
              <div style={{ flex: 2, minWidth: 320, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Top 15 Cities by Exposed Assets ($Bn)</div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={exposedByCity}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-35} textAnchor="end" height={55} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="assets" fill={T.blue} radius={[3, 3, 0, 0]} name="Exposed Assets ($Bn)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 2, minWidth: 320, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Sea Level Rise vs Adaptation Cost</div>
                <ResponsiveContainer width="100%" height={240}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="x" name="SLR 2050 (cm)" tick={{ fontSize: 11 }} label={{ value: 'SLR 2050 (cm)', position: 'insideBottom', offset: -2, fontSize: 11 }} />
                    <YAxis dataKey="y" name="Adapt Cost ($Bn)" tick={{ fontSize: 11 }} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter data={slrVsAdapt} fill={T.red} opacity={0.65} />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['City', 'Region', 'Risk Level', 'Exposed ($Bn)', 'SLR 2050 (cm)', 'Storm Surge', 'Pop at Risk (M)', 'Adapt Cost ($Bn)', 'Insurance (%)'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: T.textSec, fontSize: 11, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 20).map((c, i) => (
                    <tr key={c.id} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '8px 12px', fontWeight: 500 }}>{c.name}</td>
                      <td style={{ padding: '8px 12px', color: T.textSec }}>{c.region}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{ background: RISK_COLORS[c.riskLevel] + '22', color: RISK_COLORS[c.riskLevel], padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>{c.riskLevel}</span>
                      </td>
                      <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>{c.exposedAssets}</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>{c.seaLevelRise2050}</td>
                      <td style={{ padding: '8px 12px', color: c.stormSurgeRisk >= 7 ? T.red : c.stormSurgeRisk >= 5 ? T.amber : T.green, fontWeight: 600 }}>{c.stormSurgeRisk}/10</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>{c.populationAtRisk}</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>{c.adaptationCost}</td>
                      <td style={{ padding: '8px 12px', color: c.insurancePenetration < 30 ? T.red : c.insurancePenetration < 60 ? T.amber : T.green, fontWeight: 600 }}>{c.insurancePenetration}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 1 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>SLR Scenario Exposure Adjustment ({slrScenario}cm vs 50cm baseline) — Top 15</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={adjustedExposure}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-35} textAnchor="end" height={55} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="baseline" fill={T.blue} radius={[3, 3, 0, 0]} name="Baseline ($Bn)" />
                  <Bar dataKey="adjusted" fill={T.red} radius={[3, 3, 0, 0]} name={`SLR ${slrScenario}cm ($Bn)`} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {REGIONS.map(r => {
                const cities = filtered.filter(c => c.region === r);
                const avgSlr = cities.length ? (cities.reduce((a, c) => a + c.seaLevelRise2050, 0) / cities.length).toFixed(0) : '—';
                return (
                  <div key={r} style={{ flex: 1, minWidth: 160, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '12px 16px' }}>
                    <div style={{ fontSize: 11, color: T.textSec }}>{r}</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: T.blue }}>{avgSlr}cm</div>
                    <div style={{ fontSize: 11, color: T.textSec }}>avg SLR 2050</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 2 && (
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: 2, minWidth: 340, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Storm Surge Risk & SLR — Top 15 Cities</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={stormData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-35} textAnchor="end" height={55} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="stormRisk" fill={T.red} radius={[3, 3, 0, 0]} name="Storm Surge Risk (0-10)" />
                  <Bar dataKey="slr" fill={T.blue} radius={[3, 3, 0, 0]} name="SLR 2050 (cm)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, minWidth: 260 }}>
              {['Extreme', 'High', 'Medium', 'Low'].map(rl => {
                const count = filtered.filter(c => c.riskLevel === rl).length;
                return (
                  <div key={rl} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 18px', marginBottom: 10, borderLeft: `4px solid ${RISK_COLORS[rl]}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 700, color: RISK_COLORS[rl] }}>{rl}</span>
                      <span style={{ fontSize: 14 }}>{count} cities</span>
                    </div>
                    <div style={{ marginTop: 6, height: 5, background: T.border, borderRadius: 3 }}>
                      <div style={{ width: `${filtered.length ? (count / filtered.length * 100) : 0}%`, height: '100%', background: RISK_COLORS[rl], borderRadius: 3 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 3 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Exposed Assets by City (Top 15, $Bn)</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={exposedByCity}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-35} textAnchor="end" height={55} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="assets" fill={T.navy} radius={[3, 3, 0, 0]} name="Exposed Assets ($Bn)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 4 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Population at Risk by Region (M persons)</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={popByRegion}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="region" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="population" fill={T.orange} radius={[4, 4, 0, 0]} name="Population at Risk (M)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 5 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>SLR vs Adaptation Cost (Scatter)</div>
              <ResponsiveContainer width="100%" height={280}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="x" name="SLR 2050 (cm)" tick={{ fontSize: 11 }} label={{ value: 'SLR 2050 (cm)', position: 'insideBottom', offset: -2, fontSize: 11 }} />
                  <YAxis dataKey="y" name="Adapt Cost ($Bn)" tick={{ fontSize: 11 }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter data={slrVsAdapt} fill={T.amber} opacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Adaptation Budget Allocation (Investment: ${adaptInvest}Bn)</div>
              <div style={{ fontSize: 13, color: T.textSec }}>
                Total adaptation need: <strong style={{ color: T.red }}>${totalAdapt}Bn</strong> |
                Investment allocated: <strong style={{ color: T.green }}>${adaptInvest}Bn</strong> |
                Residual gap: <strong style={{ color: T.amber }}>${Math.max(0, +totalAdapt - adaptInvest).toFixed(1)}Bn</strong>
              </div>
            </div>
          </div>
        )}

        {tab === 6 && (
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: 2, minWidth: 340, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Nature-Based Solutions Potential vs Adaptation Cost</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={nbsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-35} textAnchor="end" height={55} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="nbs" fill={T.sage} radius={[3, 3, 0, 0]} name="NbS Potential (0-10)" />
                  <Bar dataKey="adaptCost" fill={T.amber} radius={[3, 3, 0, 0]} name="Adapt Cost ($Bn)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, minWidth: 240, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>NbS Summary</div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: T.textSec }}>High NbS Potential (≥7)</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: T.sage }}>{filtered.filter(c => c.natureSolutionsPotential >= 7).length} cities</div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: T.textSec }}>Avg NbS Potential</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: T.green }}>
                  {filtered.length ? (filtered.reduce((a, c) => a + c.natureSolutionsPotential, 0) / filtered.length).toFixed(1) : '0'}/10
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: T.textSec }}>Cost savings potential</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: T.teal }}>
                  ${(filtered.reduce((a, c) => a + c.adaptationCost * (c.natureSolutionsPotential / 10) * 0.3, 0)).toFixed(1)}Bn
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 7 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Insurance Gap by City (Top 15 most underinsured)</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={insuranceGap}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-35} textAnchor="end" height={55} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="gap" fill={T.red} radius={[3, 3, 0, 0]} name="Insurance Gap (%)" />
                  <Bar dataKey="penetration" fill={T.green} radius={[3, 3, 0, 0]} name="Insurance Penetration (%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <KpiCard label="Severely Underinsured (<30%)" value={filtered.filter(c => c.insurancePenetration < 30).length} sub="cities" color={T.red} />
              <KpiCard label="Moderately Insured (30-60%)" value={filtered.filter(c => c.insurancePenetration >= 30 && c.insurancePenetration < 60).length} sub="cities" color={T.amber} />
              <KpiCard label="Well Insured (>60%)" value={filtered.filter(c => c.insurancePenetration >= 60).length} sub="cities" color={T.green} />
              <KpiCard label="Uninsured Exposure" value={`$${(filtered.reduce((a, c) => a + c.exposedAssets * (1 - c.insurancePenetration / 100), 0)).toFixed(1)}Bn`} sub="unprotected" color={T.orange} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
