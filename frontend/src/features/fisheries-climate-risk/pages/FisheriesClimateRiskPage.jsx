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

const REGIONS = ['Asia Pacific', 'North Atlantic', 'South Atlantic', 'Indian Ocean', 'Pacific Americas', 'Arctic', 'Mediterranean', 'West Africa'];

const FISHERY_NAMES = [
  'Norway Cod Fishery', 'Iceland Capelin', 'Faroe Islands Herring', 'Canada Grand Banks', 'Greenland Halibut',
  'Alaska Pollock', 'Pacific Salmon', 'Bering Sea Crab', 'Gulf of Mexico Shrimp', 'New England Groundfish',
  'Peru Anchovy', 'Chile Jack Mackerel', 'Argentina Hake', 'Brazil Tuna', 'Mexico Pacific',
  'Japan Tuna Fishery', 'South Korea Squid', 'China East Sea', 'Philippines Tuna', 'Indonesia Pelagic',
  'India Penaeid Shrimp', 'Bangladesh Hilsa', 'Sri Lanka Skipjack', 'Myanmar Demersal', 'Vietnam Shrimp',
  'Australia Southern Bluefin', 'New Zealand Hoki', 'Papua Guinea Tuna', 'Fiji Snapper', 'Palau Deep Sea',
  'Senegal Octopus', 'Ghana Small Pelagics', 'Nigeria Demersal', 'Morocco Sardines', 'Mauritania Cephalopods',
  'Kenya Lake Victoria', 'Tanzania Tilapia', 'Mozambique Prawns', 'South Africa Anchovy', 'Namibia Pilchard',
  'UK North Sea Herring', 'France Atlantic Sardine', 'Spain Mediterranean', 'Italy Adriatic', 'Greece Aegean',
  'Turkey Black Sea', 'Ukraine Sea of Azov', 'Russia Barents Sea', 'Finland Baltic Cod', 'Poland Baltic Sprat',
  'Canada Pacific Halibut', 'USA Atlantic Menhaden', 'Ecuador Shrimp', 'Colombia Caribbean', 'Venezuela Tuna',
  'Egypt Mediterranean', 'Libya Small Pelagic', 'Tunisia Bluefin Tuna', 'Algeria Sardines', 'Morocco Atlantic',
];

const getStockHealth = score => {
  if (score >= 7) return 'Healthy';
  if (score >= 4) return 'Moderate';
  return 'Depleted';
};

const FISHERIES = Array.from({ length: 60 }, (_, i) => {
  const region = REGIONS[i % REGIONS.length];
  const stockHealth = +(1 + sr(i * 7) * 9).toFixed(1);
  const catchVol = +(0.1 + sr(i * 3) * 9.9).toFixed(2);
  return {
    id: i,
    name: FISHERY_NAMES[i] || `Fishery ${i + 1}`,
    country: region.split(' ').slice(0, 2).join(' '),
    region,
    catchVolume: catchVol,
    catchValue: +(0.1 + sr(i * 5) * 29.9).toFixed(2),
    fishStockHealth: stockHealth,
    climateExposure: +(1 + sr(i * 11) * 9).toFixed(1),
    overexploitationRisk: +(1 + sr(i * 13) * 9).toFixed(1),
    aquacultureShare: +(5 + sr(i * 17) * 75).toFixed(1),
    smallScaleFishersDependence: +(0.05 + sr(i * 19) * 4.95).toFixed(2),
    adaptationCapacity: +(1 + sr(i * 23) * 9).toFixed(1),
    marineSpatialPlanningScore: +(1 + sr(i * 29) * 9).toFixed(1),
    climateProjectedCatchChange: +(-60 + sr(i * 31) * 50).toFixed(1),
    subsidiesM: +(5 + sr(i * 37) * 1495).toFixed(0),
    stockStatus: getStockHealth(stockHealth),
  };
});

const TABS = [
  'Fishery Overview', 'Stock Health', 'Climate Exposure', 'Overexploitation Risk',
  'Aquaculture Transition', 'Small-Scale Fishers', 'Adaptation Capacity', 'Subsidy Reform',
];

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px', flex: 1, minWidth: 160 }}>
    <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: color || T.navy }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{sub}</div>}
  </div>
);

const STOCK_COLORS = { Healthy: '#16a34a', Moderate: '#d97706', Depleted: '#dc2626' };

export default function FisheriesClimateRiskPage() {
  const [tab, setTab] = useState(0);
  const [filterRegion, setFilterRegion] = useState('All');
  const [filterStock, setFilterStock] = useState('All');
  const [filterAdapt, setFilterAdapt] = useState('All');
  const [tempScenario, setTempScenario] = useState(1.5);
  const [fishingEffortReduction, setFishingEffortReduction] = useState(20);

  const filtered = useMemo(() => FISHERIES.filter(f =>
    (filterRegion === 'All' || f.region === filterRegion) &&
    (filterStock === 'All' || f.stockStatus === filterStock) &&
    (filterAdapt === 'All' || (filterAdapt === 'High' ? f.adaptationCapacity >= 7 : filterAdapt === 'Low' ? f.adaptationCapacity < 4 : true))
  ), [filterRegion, filterStock, filterAdapt]);

  const totalCatch = filtered.reduce((a, f) => a + f.catchVolume, 0).toFixed(2);
  const avgStockHealth = filtered.length
    ? (filtered.reduce((a, f) => a + f.fishStockHealth, 0) / filtered.length).toFixed(1)
    : '0';
  const totalSmallScale = filtered.reduce((a, f) => a + f.smallScaleFishersDependence, 0).toFixed(2);
  const avgProjectedChange = filtered.length
    ? (filtered.reduce((a, f) => a + f.climateProjectedCatchChange, 0) / filtered.length).toFixed(1)
    : '0';

  const catchByRegion = REGIONS.map(r => ({
    region: r.split(' ').slice(0, 2).join(' '),
    catch: +filtered.filter(f => f.region === r).reduce((a, f) => a + f.catchVolume, 0).toFixed(2),
  }));

  const climateVsStock = filtered.map(f => ({
    x: +f.climateExposure.toFixed(1),
    y: +f.fishStockHealth.toFixed(1),
    name: f.name,
  }));

  const projectedChangeData = [...filtered].sort((a, b) => a.climateProjectedCatchChange - b.climateProjectedCatchChange).slice(0, 20).map(f => ({
    name: f.name.split(' ').slice(0, 3).join(' '),
    change: +(f.climateProjectedCatchChange * (1 + (tempScenario - 1.5) * 0.15)).toFixed(1),
  }));

  const aquacultureByRegion = REGIONS.map(r => {
    const fs = filtered.filter(f => f.region === r);
    return {
      region: r.split(' ').slice(0, 2).join(' '),
      avgAquaculture: fs.length ? +(fs.reduce((a, f) => a + f.aquacultureShare, 0) / fs.length).toFixed(1) : 0,
    };
  });

  const smallScaleData = [...filtered].sort((a, b) => b.smallScaleFishersDependence - a.smallScaleFishersDependence).slice(0, 15).map(f => ({
    name: f.name.split(' ').slice(0, 3).join(' '),
    fishers: +f.smallScaleFishersDependence.toFixed(2),
    adaptCapacity: +f.adaptationCapacity.toFixed(1),
  }));

  const adaptData = [...filtered].sort((a, b) => a.adaptationCapacity - b.adaptationCapacity).slice(0, 15).map(f => ({
    name: f.name.split(' ').slice(0, 3).join(' '),
    adapt: +f.adaptationCapacity.toFixed(1),
    msp: +f.marineSpatialPlanningScore.toFixed(1),
  }));

  const subsidyData = [...filtered].sort((a, b) => b.subsidiesM - a.subsidiesM).slice(0, 15).map(f => ({
    name: f.name.split(' ').slice(0, 3).join(' '),
    subsidies: +f.subsidiesM,
    overexploitation: +f.overexploitationRisk.toFixed(1),
  }));

  const overexploitData = [...filtered].sort((a, b) => b.overexploitationRisk - a.overexploitationRisk).slice(0, 15).map(f => ({
    name: f.name.split(' ').slice(0, 3).join(' '),
    risk: +f.overexploitationRisk.toFixed(1),
    adjusted: +(f.overexploitationRisk * (1 - fishingEffortReduction / 200)).toFixed(1),
  }));

  const sel = { background: '#0c4a6e', color: '#fff', border: `1px solid #0c4a6e` };
  const unsel = { background: T.card, color: T.textPri, border: `1px solid ${T.border}` };

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: T.textPri }}>
      <div style={{ background: T.navy, padding: '24px 32px', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 11, color: T.gold, fontFamily: T.fontMono, letterSpacing: 2, marginBottom: 6 }}>
              EP-DJ6 · OCEAN, SHIPPING & BLUE ECONOMY
            </div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#fff' }}>Fisheries Climate Risk Analytics</h1>
            <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>60 Fishing Nations/Regions · Stock Health · Climate Exposure · Aquaculture · Subsidy Reform</div>
          </div>
          <div style={{ textAlign: 'right', color: '#94a3b8', fontSize: 11, fontFamily: T.fontMono }}>
            <div>Temp Scenario: +{tempScenario}°C</div>
            <div>Effort Reduction: {fishingEffortReduction}%</div>
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
          <select value={filterStock} onChange={e => setFilterStock(e.target.value)}
            style={{ padding: '6px 12px', border: `1px solid ${T.border}`, borderRadius: 6, background: T.card, fontSize: 13 }}>
            <option value="All">All Stock Status</option>
            {['Healthy', 'Moderate', 'Depleted'].map(s => <option key={s}>{s}</option>)}
          </select>
          <select value={filterAdapt} onChange={e => setFilterAdapt(e.target.value)}
            style={{ padding: '6px 12px', border: `1px solid ${T.border}`, borderRadius: 6, background: T.card, fontSize: 13 }}>
            <option value="All">All Adapt. Capacity</option>
            <option value="High">High (≥7)</option>
            <option value="Low">Low (&lt;4)</option>
          </select>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 'auto' }}>
            <label style={{ fontSize: 12, color: T.textSec }}>Temp: <strong>+{tempScenario}°C</strong></label>
            <input type="range" min={0.5} max={4} step={0.1} value={tempScenario} onChange={e => setTempScenario(+e.target.value)} style={{ width: 100 }} />
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <label style={{ fontSize: 12, color: T.textSec }}>Effort Red.: <strong>{fishingEffortReduction}%</strong></label>
            <input type="range" min={0} max={80} step={5} value={fishingEffortReduction} onChange={e => setFishingEffortReduction(+e.target.value)} style={{ width: 100 }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          <KpiCard label="Total Catch Volume" value={`${totalCatch}Mt/yr`} sub="" color={T.blue} />
          <KpiCard label="Avg Stock Health" value={`${avgStockHealth}/10`} sub="" color={+avgStockHealth >= 7 ? T.green : +avgStockHealth >= 4 ? T.amber : T.red} />
          <KpiCard label="Small-Scale Fishers" value={`${totalSmallScale}M`} sub="persons dependent" color={T.orange} />
          <KpiCard label="Avg Projected Change" value={`${avgProjectedChange}%`} sub="catch by 2050" color={+avgProjectedChange < 0 ? T.red : T.green} />
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
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Catch Volume by Region (Mt/yr)</div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={catchByRegion}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="region" tick={{ fontSize: 10 }} interval={0} angle={-30} textAnchor="end" height={50} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="catch" fill={T.blue} radius={[4, 4, 0, 0]} name="Catch (Mt/yr)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 2, minWidth: 320, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Climate Exposure vs Stock Health</div>
                <ResponsiveContainer width="100%" height={240}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="x" name="Climate Exposure" tick={{ fontSize: 11 }} label={{ value: 'Climate Exposure (0-10)', position: 'insideBottom', offset: -2, fontSize: 11 }} />
                    <YAxis dataKey="y" name="Stock Health" tick={{ fontSize: 11 }} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter data={climateVsStock} fill={T.teal} opacity={0.65} />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Fishery', 'Region', 'Stock Status', 'Catch (Mt/yr)', 'Stock Health', 'Climate Exp.', 'Overexploit.', 'Aquaculture %', 'Proj. Change (%)'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: T.textSec, fontSize: 11, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 20).map((f, i) => (
                    <tr key={f.id} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '8px 12px', fontWeight: 500 }}>{f.name}</td>
                      <td style={{ padding: '8px 12px', color: T.textSec }}>{f.region}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{ background: STOCK_COLORS[f.stockStatus] + '22', color: STOCK_COLORS[f.stockStatus], padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>{f.stockStatus}</span>
                      </td>
                      <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>{f.catchVolume}</td>
                      <td style={{ padding: '8px 12px', color: STOCK_COLORS[f.stockStatus], fontWeight: 600 }}>{f.fishStockHealth}/10</td>
                      <td style={{ padding: '8px 12px', color: f.climateExposure >= 7 ? T.red : f.climateExposure >= 5 ? T.amber : T.green, fontWeight: 600 }}>{f.climateExposure}/10</td>
                      <td style={{ padding: '8px 12px', color: f.overexploitationRisk >= 7 ? T.red : f.overexploitationRisk >= 5 ? T.amber : T.green, fontWeight: 600 }}>{f.overexploitationRisk}/10</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>{f.aquacultureShare}%</td>
                      <td style={{ padding: '8px 12px', color: f.climateProjectedCatchChange < -20 ? T.red : f.climateProjectedCatchChange < 0 ? T.amber : T.green, fontWeight: 600 }}>
                        {f.climateProjectedCatchChange > 0 ? '+' : ''}{f.climateProjectedCatchChange}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 1 && (
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: 2, minWidth: 340, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Stock Health Distribution</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={['Healthy', 'Moderate', 'Depleted'].map(s => ({ status: s, count: filtered.filter(f => f.stockStatus === s).length }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="status" tick={{ fontSize: 13 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill={T.teal} radius={[6, 6, 0, 0]} name="Fisheries" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, minWidth: 260 }}>
              {['Healthy', 'Moderate', 'Depleted'].map(s => {
                const fs = filtered.filter(f => f.stockStatus === s);
                const pct = filtered.length ? ((fs.length / filtered.length) * 100).toFixed(1) : '0';
                const catchPct = +totalCatch > 0 ? ((fs.reduce((a, f) => a + f.catchVolume, 0) / +totalCatch) * 100).toFixed(1) : '0';
                return (
                  <div key={s} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 18px', marginBottom: 10, borderLeft: `4px solid ${STOCK_COLORS[s]}` }}>
                    <div style={{ fontWeight: 700, color: STOCK_COLORS[s], marginBottom: 4 }}>{s}</div>
                    <div style={{ fontSize: 12, color: T.textSec }}>{fs.length} fisheries ({pct}%) · {catchPct}% of catch</div>
                    <div style={{ marginTop: 6, height: 5, background: T.border, borderRadius: 3 }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: STOCK_COLORS[s], borderRadius: 3 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 2 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Climate Exposure vs Stock Health (Scatter)</div>
              <ResponsiveContainer width="100%" height={280}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="x" name="Climate Exposure (0-10)" tick={{ fontSize: 11 }} label={{ value: 'Climate Exposure (0-10)', position: 'insideBottom', offset: -2, fontSize: 11 }} />
                  <YAxis dataKey="y" name="Stock Health (0-10)" tick={{ fontSize: 11 }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter data={climateVsStock} fill={T.teal} opacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <KpiCard label="High Climate Exposure (≥7)" value={filtered.filter(f => f.climateExposure >= 7).length} sub="fisheries" color={T.red} />
              <KpiCard label="Avg Climate Exposure" value={`${filtered.length ? (filtered.reduce((a, f) => a + f.climateExposure, 0) / filtered.length).toFixed(1) : '0'}/10`} sub="" color={T.amber} />
              <KpiCard label="High Exposure + Depleted" value={filtered.filter(f => f.climateExposure >= 7 && f.stockStatus === 'Depleted').length} sub="critical" color={T.red} />
            </div>
          </div>
        )}

        {tab === 3 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Overexploitation Risk — Current vs Effort Reduction {fishingEffortReduction}%</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={overexploitData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-35} textAnchor="end" height={55} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="risk" fill={T.red} radius={[3, 3, 0, 0]} name="Current Risk (0-10)" />
                  <Bar dataKey="adjusted" fill={T.green} radius={[3, 3, 0, 0]} name={`With ${fishingEffortReduction}% Effort Reduction`} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 4 && (
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: 2, minWidth: 340, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Aquaculture Share by Region (%)</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={aquacultureByRegion}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="region" tick={{ fontSize: 10 }} interval={0} angle={-30} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="avgAquaculture" fill={T.teal} radius={[4, 4, 0, 0]} name="Avg Aquaculture Share (%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, minWidth: 260 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 18px', marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: T.textSec }}>Avg Aquaculture Share</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: T.teal }}>
                  {filtered.length ? (filtered.reduce((a, f) => a + f.aquacultureShare, 0) / filtered.length).toFixed(1) : '0'}%
                </div>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 18px', marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: T.textSec }}>High Aquaculture (≥50%)</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: T.blue }}>{filtered.filter(f => f.aquacultureShare >= 50).length} fisheries</div>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 18px' }}>
                <div style={{ fontSize: 12, color: T.textSec }}>Low Aquaculture (&lt;20%)</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: T.amber }}>{filtered.filter(f => f.aquacultureShare < 20).length} fisheries</div>
                <div style={{ fontSize: 11, color: T.textSec }}>highest transition risk</div>
              </div>
            </div>
          </div>
        )}

        {tab === 5 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Small-Scale Fishers Dependence (M persons) — Top 15</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={smallScaleData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-35} textAnchor="end" height={55} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="fishers" fill={T.orange} radius={[3, 3, 0, 0]} name="Fishers (M persons)" />
                  <Bar dataKey="adaptCapacity" fill={T.blue} radius={[3, 3, 0, 0]} name="Adapt. Capacity (0-10)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <KpiCard label="Total Small-Scale Dependent" value={`${totalSmallScale}M`} sub="persons" color={T.orange} />
              <KpiCard label="Low Adapt + High Dependence" value={filtered.filter(f => f.adaptationCapacity < 4 && f.smallScaleFishersDependence > 1).length} sub="vulnerable fisheries" color={T.red} />
            </div>
          </div>
        )}

        {tab === 6 && (
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: 2, minWidth: 340, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Adaptation Capacity & Marine Spatial Planning — Lowest 15</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={adaptData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-35} textAnchor="end" height={55} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="adapt" fill={T.sage} radius={[3, 3, 0, 0]} name="Adaptation Capacity" />
                  <Bar dataKey="msp" fill={T.blue} radius={[3, 3, 0, 0]} name="MSP Score" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, minWidth: 260 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 18px', marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: T.textSec }}>High Adapt. Capacity (≥7)</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: T.green }}>{filtered.filter(f => f.adaptationCapacity >= 7).length}</div>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 18px', marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: T.textSec }}>Low Adapt. Capacity (&lt;4)</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: T.red }}>{filtered.filter(f => f.adaptationCapacity < 4).length}</div>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 18px' }}>
                <div style={{ fontSize: 12, color: T.textSec }}>Avg MSP Score</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: T.blue }}>
                  {filtered.length ? (filtered.reduce((a, f) => a + f.marineSpatialPlanningScore, 0) / filtered.length).toFixed(1) : '0'}/10
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 7 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Subsidy Levels & Overexploitation Correlation — Top 15</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={subsidyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-35} textAnchor="end" height={55} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="subsidies" fill={T.amber} radius={[3, 3, 0, 0]} name="Subsidies ($M/yr)" />
                  <Bar dataKey="overexploitation" fill={T.red} radius={[3, 3, 0, 0]} name="Overexploitation Risk (0-10)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Projected Catch Change by 2050 — +{tempScenario}°C Scenario (Top 20 most impacted)</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={projectedChangeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-35} textAnchor="end" height={55} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="change" radius={[3, 3, 0, 0]} name="Projected Catch Change (%)"
                    fill={T.red}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <KpiCard label="Total Subsidies" value={`$${(filtered.reduce((a, f) => a + +f.subsidiesM, 0) / 1000).toFixed(1)}Bn`} sub="per year" color={T.amber} />
              <KpiCard label="Harmful Subsidy Risk" value={filtered.filter(f => f.subsidiesM > 500 && f.overexploitationRisk > 6).length} sub="fisheries with harmful subsidies" color={T.red} />
              <KpiCard label="Reform Potential" value={`$${(filtered.filter(f => f.subsidiesM > 200 && f.overexploitationRisk > 5).reduce((a, f) => a + +f.subsidiesM, 0) / 1000).toFixed(1)}Bn`} sub="subsidy reform target" color={T.green} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
