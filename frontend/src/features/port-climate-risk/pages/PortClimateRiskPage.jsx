import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
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

const REGIONS = ['Asia Pacific', 'Europe', 'North America', 'Latin America', 'Middle East', 'Africa'];

const PORT_NAMES = [
  'Shanghai', 'Singapore', 'Rotterdam', 'Ningbo-Zhoushan', 'Busan', 'Guangzhou', 'Qingdao', 'Hong Kong',
  'Tianjin', 'Port Klang', 'Antwerp', 'Dubai', 'Tanjung Pelepas', 'Laem Chabang', 'Bremen/Bremerhaven',
  'Los Angeles', 'Long Beach', 'New York/NJ', 'Savannah', 'Houston', 'Seattle', 'Vancouver', 'Halifax',
  'Santos', 'Buenos Aires', 'Callao', 'Cartagena', 'Colon', 'Manzanillo', 'Veracruz',
  'Jebel Ali', 'Dammam', 'Shuaiba', 'Salalah', 'Bandar Abbas', 'Colombo', 'Mumbai', 'Chennai',
  'Durban', 'Cape Town', 'Dar es Salaam', 'Mombasa', 'Lagos', 'Dakar', 'Casablanca',
  'Yokohama', 'Kobe', 'Nagoya', 'Tokyo', 'Kaohsiung', 'Taipei', 'Manila', 'Jakarta', 'Tanjung Priok', 'Surabaya',
];

const getAvgRisk = p => +((p.floodRisk + p.stormSurgeRisk + p.heatRisk + p.droughtRisk) / 4).toFixed(1);

const PORTS = Array.from({ length: 55 }, (_, i) => {
  const region = REGIONS[i % REGIONS.length];
  const floodR = +(1 + sr(i * 3) * 9).toFixed(1);
  const stormR = +(1 + sr(i * 7) * 9).toFixed(1);
  const heatR = +(1 + sr(i * 11) * 9).toFixed(1);
  const droughtR = +(1 + sr(i * 13) * 9).toFixed(1);
  const greenInfra = +(1 + sr(i * 17) * 9).toFixed(1);
  return {
    id: i,
    name: PORT_NAMES[i] || `Port ${i + 1}`,
    country: region.split(' ').pop(),
    region,
    throughputMt: Math.round(10 + sr(i * 5) * 790),
    cargoValue: +(5 + sr(i * 19) * 495).toFixed(1),
    floodRisk: floodR,
    stormSurgeRisk: stormR,
    seaLevelExposure: +(0.5 + sr(i * 23) * 4.5).toFixed(1),
    heatRisk: heatR,
    droughtRisk: droughtR,
    adaptationCapex: +(10 + sr(i * 29) * 490).toFixed(0),
    operationalDisruptionRisk: +(5 + sr(i * 31) * 65).toFixed(1),
    greenShippingInfra: greenInfra,
    shorepower: sr(i * 37) > 0.5,
    lngBunkering: sr(i * 41) > 0.45,
    renewableEnergyPct: +(5 + sr(i * 43) * 75).toFixed(1),
    avgPhysicalRisk: getAvgRisk({ floodRisk: floodR, stormSurgeRisk: stormR, heatRisk: heatR, droughtRisk: droughtR }),
    riskLevel: (() => {
      const avg = (floodR + stormR + heatR + droughtR) / 4;
      if (avg >= 7.5) return 'Extreme';
      if (avg >= 5.5) return 'High';
      if (avg >= 3.5) return 'Medium';
      return 'Low';
    })(),
  };
});

const TABS = [
  'Port Overview', 'Physical Risk Profile', 'Flood & Storm Surge', 'Heat & Drought Risk',
  'Operational Disruption', 'Adaptation Investment', 'Green Infrastructure', 'Decarbonisation Readiness',
];

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px', flex: 1, minWidth: 160 }}>
    <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: color || T.navy }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{sub}</div>}
  </div>
);

const RISK_COLORS = { Extreme: '#dc2626', High: '#ea580c', Medium: '#d97706', Low: '#16a34a' };

export default function PortClimateRiskPage() {
  const [tab, setTab] = useState(0);
  const [filterRegion, setFilterRegion] = useState('All');
  const [filterRisk, setFilterRisk] = useState('All');
  const [filterGreen, setFilterGreen] = useState('All');
  const [slrScenario, setSlrScenario] = useState(50);
  const [stormIntensity, setStormIntensity] = useState(10);

  const filtered = useMemo(() => PORTS.filter(p =>
    (filterRegion === 'All' || p.region === filterRegion) &&
    (filterRisk === 'All' || p.riskLevel === filterRisk) &&
    (filterGreen === 'All' || (filterGreen === 'Green' ? p.greenShippingInfra >= 6 : p.greenShippingInfra < 6))
  ), [filterRegion, filterRisk, filterGreen]);

  const totalThroughput = filtered.reduce((a, p) => a + p.throughputMt, 0);
  const avgPhysicalRisk = filtered.length
    ? (filtered.reduce((a, p) => a + p.avgPhysicalRisk, 0) / filtered.length).toFixed(1)
    : '0';
  const totalAdaptCapex = filtered.reduce((a, p) => a + +p.adaptationCapex, 0);
  const greenInfraPct = filtered.length
    ? ((filtered.filter(p => p.shorepower || p.lngBunkering).length / filtered.length) * 100).toFixed(1)
    : '0';

  const throughputData = [...filtered].sort((a, b) => b.throughputMt - a.throughputMt).slice(0, 15).map(p => ({
    name: p.name,
    throughput: p.throughputMt,
  }));

  const radarData = [
    { metric: 'Flood Risk', value: filtered.length ? +(filtered.reduce((a, p) => a + p.floodRisk, 0) / filtered.length).toFixed(1) : 0 },
    { metric: 'Storm Surge', value: filtered.length ? +(filtered.reduce((a, p) => a + p.stormSurgeRisk, 0) / filtered.length).toFixed(1) : 0 },
    { metric: 'Heat Risk', value: filtered.length ? +(filtered.reduce((a, p) => a + p.heatRisk, 0) / filtered.length).toFixed(1) : 0 },
    { metric: 'Drought Risk', value: filtered.length ? +(filtered.reduce((a, p) => a + p.droughtRisk, 0) / filtered.length).toFixed(1) : 0 },
    { metric: 'SLR Exposure', value: filtered.length ? +(filtered.reduce((a, p) => a + p.seaLevelExposure, 0) / filtered.length).toFixed(1) : 0 },
  ];

  const adaptVsRisk = filtered.map(p => ({
    x: +p.avgPhysicalRisk.toFixed(1),
    y: +p.adaptationCapex,
    name: p.name,
  }));

  const greenInfraData = REGIONS.map(r => {
    const ps = filtered.filter(p => p.region === r);
    return {
      region: r.split(' ').slice(0, 2).join(' '),
      avgGreen: ps.length ? +(ps.reduce((a, p) => a + p.greenShippingInfra, 0) / ps.length).toFixed(1) : 0,
      renewables: ps.length ? +(ps.reduce((a, p) => a + p.renewableEnergyPct, 0) / ps.length).toFixed(1) : 0,
    };
  });

  const floodStormData = [...filtered].sort((a, b) => b.floodRisk + b.stormSurgeRisk - a.floodRisk - a.stormSurgeRisk).slice(0, 15).map(p => ({
    name: p.name,
    flood: +(p.floodRisk * (1 + (slrScenario - 50) / 200)).toFixed(1),
    storm: +(p.stormSurgeRisk * (1 + stormIntensity / 100)).toFixed(1),
  }));

  const heatDroughtData = [...filtered].sort((a, b) => b.heatRisk + b.droughtRisk - a.heatRisk - a.droughtRisk).slice(0, 15).map(p => ({
    name: p.name,
    heat: +p.heatRisk.toFixed(1),
    drought: +p.droughtRisk.toFixed(1),
  }));

  const disruptionData = [...filtered].sort((a, b) => b.operationalDisruptionRisk - a.operationalDisruptionRisk).slice(0, 15).map(p => ({
    name: p.name,
    disruption: +p.operationalDisruptionRisk.toFixed(1),
    value: +(p.cargoValue * p.operationalDisruptionRisk / 100).toFixed(1),
  }));

  const adaptData = [...filtered].sort((a, b) => b.adaptationCapex - a.adaptationCapex).slice(0, 15).map(p => ({
    name: p.name,
    capex: +p.adaptationCapex,
    disruption: +p.operationalDisruptionRisk.toFixed(1),
  }));

  const decarb = [...filtered].sort((a, b) => b.renewableEnergyPct - a.renewableEnergyPct).slice(0, 15).map(p => ({
    name: p.name,
    renewables: +p.renewableEnergyPct.toFixed(1),
    green: +p.greenShippingInfra.toFixed(1),
  }));

  const sel = { background: '#0c4a6e', color: '#fff', border: `1px solid #0c4a6e` };
  const unsel = { background: T.card, color: T.textPri, border: `1px solid ${T.border}` };

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: T.textPri }}>
      <div style={{ background: T.navy, padding: '24px 32px', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 11, color: T.gold, fontFamily: T.fontMono, letterSpacing: 2, marginBottom: 6 }}>
              EP-DJ5 · OCEAN, SHIPPING & BLUE ECONOMY
            </div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#fff' }}>Port Climate Risk Analytics</h1>
            <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>55 Major Ports · Physical Risk · SLR · Adaptation Capex · Green Infrastructure · Decarbonisation</div>
          </div>
          <div style={{ textAlign: 'right', color: '#94a3b8', fontSize: 11, fontFamily: T.fontMono }}>
            <div>SLR: {slrScenario}cm</div>
            <div>Storm Intensity: +{stormIntensity}%</div>
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
          <select value={filterGreen} onChange={e => setFilterGreen(e.target.value)}
            style={{ padding: '6px 12px', border: `1px solid ${T.border}`, borderRadius: 6, background: T.card, fontSize: 13 }}>
            <option value="All">All Green Infra</option>
            <option value="Green">Green Infra ≥6</option>
            <option value="Standard">Standard (&lt;6)</option>
          </select>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 'auto' }}>
            <label style={{ fontSize: 12, color: T.textSec }}>SLR: <strong>{slrScenario}cm</strong></label>
            <input type="range" min={20} max={200} step={5} value={slrScenario} onChange={e => setSlrScenario(+e.target.value)} style={{ width: 100 }} />
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <label style={{ fontSize: 12, color: T.textSec }}>Storm: <strong>+{stormIntensity}%</strong></label>
            <input type="range" min={0} max={100} step={5} value={stormIntensity} onChange={e => setStormIntensity(+e.target.value)} style={{ width: 100 }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          <KpiCard label="Total Throughput" value={`${(totalThroughput / 1000).toFixed(0)}Gt/yr`} sub="cargo handled" color={T.blue} />
          <KpiCard label="Avg Physical Risk" value={`${avgPhysicalRisk}/10`} sub="composite" color={T.red} />
          <KpiCard label="Total Adaptation Capex" value={`$${(totalAdaptCapex / 1000).toFixed(1)}Bn`} sub="required" color={T.amber} />
          <KpiCard label="With Green Infrastructure" value={`${greenInfraPct}%`} sub="shorepower or LNG" color={T.green} />
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
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Top 15 Ports by Throughput (Mt/yr)</div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={throughputData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-35} textAnchor="end" height={55} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="throughput" fill={T.navy} radius={[3, 3, 0, 0]} name="Throughput (Mt/yr)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1, minWidth: 280, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Average Risk Dimensions</div>
                <ResponsiveContainer width="100%" height={240}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke={T.borderL} />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fontSize: 9 }} />
                    <Radar name="Avg Risk" dataKey="value" stroke={T.red} fill={T.red} fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Port', 'Region', 'Risk Level', 'Throughput (Mt)', 'Flood Risk', 'Storm Surge', 'Heat Risk', 'Adapt Capex ($M)', 'Shorepower', 'Renewables (%)'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: T.textSec, fontSize: 11, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 20).map((p, i) => (
                    <tr key={p.id} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '8px 12px', fontWeight: 500 }}>{p.name}</td>
                      <td style={{ padding: '8px 12px', color: T.textSec }}>{p.region}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{ background: RISK_COLORS[p.riskLevel] + '22', color: RISK_COLORS[p.riskLevel], padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>{p.riskLevel}</span>
                      </td>
                      <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>{p.throughputMt}</td>
                      <td style={{ padding: '8px 12px', color: p.floodRisk >= 7 ? T.red : p.floodRisk >= 5 ? T.amber : T.green, fontWeight: 600 }}>{p.floodRisk}</td>
                      <td style={{ padding: '8px 12px', color: p.stormSurgeRisk >= 7 ? T.red : p.stormSurgeRisk >= 5 ? T.amber : T.green, fontWeight: 600 }}>{p.stormSurgeRisk}</td>
                      <td style={{ padding: '8px 12px', color: p.heatRisk >= 7 ? T.red : p.heatRisk >= 5 ? T.amber : T.green, fontWeight: 600 }}>{p.heatRisk}</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>${p.adaptationCapex}M</td>
                      <td style={{ padding: '8px 12px', color: p.shorepower ? T.green : T.red, fontWeight: 600 }}>{p.shorepower ? 'Yes' : 'No'}</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>{p.renewableEnergyPct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 1 && (
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 320, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Risk Dimensions Radar (Avg)</div>
              <ResponsiveContainer width="100%" height={320}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke={T.borderL} />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fontSize: 10 }} />
                  <Radar name="Avg Risk" dataKey="value" stroke="#0c4a6e" fill="#0c4a6e" fillOpacity={0.35} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, minWidth: 260 }}>
              {['Extreme', 'High', 'Medium', 'Low'].map(rl => {
                const count = filtered.filter(p => p.riskLevel === rl).length;
                const value = filtered.filter(p => p.riskLevel === rl).reduce((a, p) => a + p.cargoValue, 0).toFixed(0);
                return (
                  <div key={rl} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 18px', marginBottom: 10, borderLeft: `4px solid ${RISK_COLORS[rl]}` }}>
                    <div style={{ fontWeight: 700, color: RISK_COLORS[rl] }}>{rl} Risk</div>
                    <div style={{ fontSize: 13, color: T.textSec, marginTop: 4 }}>{count} ports · ${(+value / 1000).toFixed(1)}Tn cargo value</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 2 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Flood & Storm Surge Risk — SLR: {slrScenario}cm, Storm: +{stormIntensity}%</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={floodStormData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-35} textAnchor="end" height={55} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="flood" fill={T.blue} radius={[3, 3, 0, 0]} name="Flood Risk (adj.)" />
                  <Bar dataKey="storm" fill={T.red} radius={[3, 3, 0, 0]} name="Storm Surge (adj.)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 3 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Heat & Drought Risk — Top 15 Ports</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={heatDroughtData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-35} textAnchor="end" height={55} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="heat" fill={T.orange} radius={[3, 3, 0, 0]} name="Heat Risk (0-10)" />
                  <Bar dataKey="drought" fill={T.amber} radius={[3, 3, 0, 0]} name="Drought Risk (0-10)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 4 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Operational Disruption Risk & Value at Risk — Top 15</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={disruptionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-35} textAnchor="end" height={55} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="disruption" fill={T.red} radius={[3, 3, 0, 0]} name="Disruption Risk (%)" />
                  <Bar dataKey="value" fill={T.amber} radius={[3, 3, 0, 0]} name="Value at Risk ($Bn)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 5 && (
          <div>
            <div style={{ display: 'flex', gap: 20, marginBottom: 20, flexWrap: 'wrap' }}>
              <div style={{ flex: 2, minWidth: 320, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Adaptation Capex vs Physical Risk</div>
                <ResponsiveContainer width="100%" height={260}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="x" name="Avg Physical Risk (0-10)" tick={{ fontSize: 11 }} label={{ value: 'Avg Physical Risk', position: 'insideBottom', offset: -2, fontSize: 11 }} />
                    <YAxis dataKey="y" name="Adapt Capex ($M)" tick={{ fontSize: 11 }} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter data={adaptVsRisk} fill={T.amber} opacity={0.7} />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 2, minWidth: 320, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Adaptation Capex — Top 15 Ports</div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={adaptData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-35} textAnchor="end" height={55} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="capex" fill={T.amber} radius={[3, 3, 0, 0]} name="Capex ($M)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {tab === 6 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Green Infrastructure Score by Region</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={greenInfraData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="region" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="avgGreen" fill={T.green} radius={[3, 3, 0, 0]} name="Green Infra Score (0-10)" />
                  <Bar dataKey="renewables" fill={T.teal} radius={[3, 3, 0, 0]} name="Renewables (%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <KpiCard label="With Shorepower" value={filtered.filter(p => p.shorepower).length} sub="ports" color={T.green} />
              <KpiCard label="With LNG Bunkering" value={filtered.filter(p => p.lngBunkering).length} sub="ports" color={T.blue} />
              <KpiCard label="Avg Renewables" value={`${filtered.length ? (filtered.reduce((a, p) => a + p.renewableEnergyPct, 0) / filtered.length).toFixed(1) : '0'}%`} sub="" color={T.teal} />
              <KpiCard label="Avg Green Infra Score" value={`${filtered.length ? (filtered.reduce((a, p) => a + p.greenShippingInfra, 0) / filtered.length).toFixed(1) : '0'}/10`} sub="" color={T.sage} />
            </div>
          </div>
        )}

        {tab === 7 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Renewables % & Green Infrastructure — Top 15</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={decarb}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-35} textAnchor="end" height={55} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="renewables" fill={T.teal} radius={[3, 3, 0, 0]} name="Renewable Energy (%)" />
                  <Bar dataKey="green" fill={T.green} radius={[3, 3, 0, 0]} name="Green Infra Score (0-10)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
