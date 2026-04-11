import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, AreaChart, Area, Legend,
} from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f6f4f0',
  navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f',
  teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c',
  surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace',
};

const CROP_TYPES = ['Wheat', 'Maize', 'Rice', 'Soy', 'Cotton', 'Coffee', 'Cocoa'];
const REGIONS = ['Sub-Saharan Africa', 'South Asia', 'East Asia', 'Latin America', 'MENA', 'Europe', 'North America'];

const AGRI_REGIONS = Array.from({ length: 70 }, (_, i) => {
  const cropType = CROP_TYPES[i % CROP_TYPES.length];
  const region = REGIONS[i % REGIONS.length];
  const physicalRiskScore = Math.round(20 + sr(i * 13) * 75);
  const yieldRisk = +(10 + sr(i * 7) * 45).toFixed(1);
  const names = [
    'Punjab India', 'Mato Grosso Brazil', 'Iowa USA', 'Henan China', 'Pampas Argentina',
    'Cerrado Brazil', 'Niger Delta Nigeria', 'Nile Delta Egypt', 'Mekong Vietnam', 'Ganges Plain Bangladesh',
    'Sahel Mali', 'Ethiopian Highlands', 'Andean Peru', 'Central Valley USA', 'Rhine Valley Germany',
    'Murray-Darling Australia', 'Great Plains Kansas', 'Danube Romania', 'Congo Basin DRC', 'Yangtze Delta China',
    'Karnataka India', 'Chiapas Mexico', 'Ivory Coast', 'Ghana Cocoa Belt', 'Sulawesi Indonesia',
    'Sumatra Indonesia', 'Mindanao Philippines', 'Queensland Australia', 'Kruger Lowveld SA', 'Limpopo SA',
    'Tamil Nadu India', 'Andhra Pradesh India', 'Rajasthan India', 'Uttar Pradesh India', 'Bihar India',
    'Kano Nigeria', 'Ogun Nigeria', 'Rift Valley Kenya', 'Northern Tanzania', 'Southern Uganda',
    'Mbeya Tanzania', 'Mpumalanga SA', 'Free State SA', 'Western Cape SA', 'Harare Zimbabwe',
    'Zambia Copperbelt', 'Malawi Shire Highlands', 'Mozambique Zambezi', 'Madagascar Highlands', 'Senegal River',
    'Gambia Delta', 'Sudan Gezira', 'Yemen Highlands', 'Morocco Souss', 'Tunisia Medjerda',
    'Ukraine Kharkiv', 'Russia Krasnodar', 'Kazakhstan Steppe', 'Poland Masovia', 'Hungary Alfold',
    'Romania Dobruja', 'Bulgaria Thrace', 'Turkey Konya', 'Iran Fars', 'Pakistan Sindh',
    'Bangladesh Sylhet', 'Myanmar Irrawaddy', 'Thailand Chao Phraya', 'Cambodia Tonle Sap', 'Laos Mekong',
  ];
  return {
    id: i,
    name: names[i] || `Region ${i + 1}`,
    country: region.split(' ').pop(),
    region,
    cropType,
    yieldRisk,
    extremeHeatDays: Math.round(10 + sr(i * 11) * 80),
    precipitationChange: +(-30 + sr(i * 17) * 60).toFixed(1),
    droughtFrequency: +(1 + sr(i * 5) * 8).toFixed(1),
    soilDegradation: +(1 + sr(i * 3) * 9).toFixed(1),
    adaptationCapacity: +(1 + sr(i * 19) * 9).toFixed(1),
    farmerIncomeRisk: +(5 + sr(i * 23) * 55).toFixed(1),
    irrigationDependency: +(10 + sr(i * 29) * 85).toFixed(1),
    physicalRiskScore,
  };
});

const TABS = [
  'Risk Overview', 'Crop Yield Impact', 'Heat Stress', 'Precipitation Shifts',
  'Drought Risk', 'Soil Health', 'Farmer Vulnerability', 'Adaptation Pathways',
];

const getRiskLevel = score => score >= 75 ? 'Critical' : score >= 55 ? 'High' : score >= 35 ? 'Medium' : 'Low';
const RISK_COLORS = { Low: T.green, Medium: T.amber, High: T.orange, Critical: T.red };

export default function AgriculturalClimateRiskPage() {
  const [tab, setTab] = useState(0);
  const [regionFilter, setRegionFilter] = useState('All');
  const [cropFilter, setCropFilter] = useState('All');
  const [riskLevel, setRiskLevel] = useState('All');
  const [tempScenario, setTempScenario] = useState(2.0);
  const [adaptInvestment, setAdaptInvestment] = useState(50);

  const filtered = useMemo(() => {
    return AGRI_REGIONS.filter(r => {
      if (regionFilter !== 'All' && r.region !== regionFilter) return false;
      if (cropFilter !== 'All' && r.cropType !== cropFilter) return false;
      if (riskLevel !== 'All' && getRiskLevel(r.physicalRiskScore) !== riskLevel) return false;
      return true;
    });
  }, [regionFilter, cropFilter, riskLevel]);

  const kpis = useMemo(() => {
    const n = Math.max(1, filtered.length);
    const avgYield = filtered.reduce((a, r) => a + r.yieldRisk, 0) / n;
    const avgPhysical = filtered.reduce((a, r) => a + r.physicalRiskScore, 0) / n;
    const highRisk = filtered.filter(r => r.physicalRiskScore >= 55).length;
    const cropGroups = CROP_TYPES.map(c => ({
      c, avgRisk: filtered.filter(r => r.cropType === c).reduce((a, r) => a + r.yieldRisk, 0) /
        Math.max(1, filtered.filter(r => r.cropType === c).length),
    }));
    const mostVulnerable = [...cropGroups].sort((a, b) => b.avgRisk - a.avgRisk)[0];
    return { avgYield: avgYield.toFixed(1), avgPhysical: avgPhysical.toFixed(0), highRisk, mostVulnerable: mostVulnerable?.c || 'N/A' };
  }, [filtered]);

  const yieldByCrop = useMemo(() =>
    CROP_TYPES.map(c => {
      const items = filtered.filter(r => r.cropType === c);
      const adj = 1 + (tempScenario - 2) * 0.1;
      return {
        crop: c,
        yieldRisk: items.length ? +(items.reduce((a, r) => a + r.yieldRisk, 0) / items.length * adj).toFixed(1) : 0,
      };
    }), [filtered, tempScenario]);

  const heatScatter = useMemo(() =>
    filtered.slice(0, 40).map(r => ({ x: r.extremeHeatDays, y: r.yieldRisk, z: r.physicalRiskScore, name: r.name })),
    [filtered]);

  const precipData = useMemo(() =>
    REGIONS.map(reg => {
      const items = filtered.filter(r => r.region === reg);
      return { region: reg.split(' ').slice(-1)[0], change: items.length ? +(items.reduce((a, r) => a + r.precipitationChange, 0) / items.length).toFixed(1) : 0 };
    }), [filtered]);

  const droughtTop15 = useMemo(() =>
    [...filtered].sort((a, b) => b.droughtFrequency - a.droughtFrequency).slice(0, 15).map(r => ({
      name: r.name.split(' ')[0],
      drought: r.droughtFrequency,
    })), [filtered]);

  const adaptData = useMemo(() =>
    CROP_TYPES.map(c => {
      const items = filtered.filter(r => r.cropType === c);
      const n = Math.max(1, items.length);
      const base = items.reduce((a, r) => a + r.yieldRisk, 0) / n;
      const adj = adaptInvestment / 100;
      return { crop: c, baseline: +base.toFixed(1), adapted: +(base * (1 - adj * 0.4)).toFixed(1) };
    }), [filtered, adaptInvestment]);

  const s = { fontFamily: "'DM Sans', system-ui, sans-serif" };

  return (
    <div style={{ ...s, background: T.bg, minHeight: '100vh', padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono, marginBottom: 4 }}>EP-DG1 · Food, Agriculture & Land Use</div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: T.navy, margin: 0 }}>Agricultural Climate Risk</h1>
        <p style={{ color: T.textSec, fontSize: 13, margin: '4px 0 0' }}>Crop yield, heat stress, drought and physical risk analytics across 70 agricultural regions</p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Avg Yield Risk', value: `${kpis.avgYield}%`, color: T.red },
          { label: 'Avg Physical Risk', value: `${kpis.avgPhysical}/100`, color: T.orange },
          { label: 'Most Vulnerable Crop', value: kpis.mostVulnerable, color: T.amber },
          { label: 'High Risk Regions', value: `${kpis.highRisk}/${filtered.length}`, color: T.navy },
        ].map(k => (
          <div key={k.label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 18px' }}>
            <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>{k.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Filters + Sliders */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 20px', marginBottom: 20, display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {[
          { label: 'Region', value: regionFilter, set: setRegionFilter, opts: ['All', ...REGIONS] },
          { label: 'Crop Type', value: cropFilter, set: setCropFilter, opts: ['All', ...CROP_TYPES] },
          { label: 'Risk Level', value: riskLevel, set: setRiskLevel, opts: ['All', 'Low', 'Medium', 'High', 'Critical'] },
        ].map(f => (
          <div key={f.label}>
            <div style={{ fontSize: 11, color: T.textSec, marginBottom: 3 }}>{f.label}</div>
            <select value={f.value} onChange={e => f.set(e.target.value)} style={{ fontSize: 13, border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 8px', background: T.bg, color: T.textPri }}>
              {f.opts.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        ))}
        <div>
          <div style={{ fontSize: 11, color: T.textSec, marginBottom: 3 }}>Temp Scenario: +{tempScenario.toFixed(1)}°C</div>
          <input type="range" min={1.5} max={4} step={0.1} value={tempScenario} onChange={e => setTempScenario(+e.target.value)} style={{ width: 120 }} />
        </div>
        <div>
          <div style={{ fontSize: 11, color: T.textSec, marginBottom: 3 }}>Adaptation Investment: ${adaptInvestment}Bn</div>
          <input type="range" min={0} max={200} step={5} value={adaptInvestment} onChange={e => setAdaptInvestment(+e.target.value)} style={{ width: 120 }} />
        </div>
        <div style={{ fontSize: 12, color: T.textSec, marginLeft: 'auto' }}>{filtered.length} regions</div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{
            fontSize: 12, padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
            background: tab === i ? T.navy : T.sub, color: tab === i ? '#fff' : T.textSec, fontWeight: tab === i ? 600 : 400,
          }}>{t}</button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>Yield Risk by Crop Type</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={yieldByCrop}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="crop" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" />
                <Tooltip formatter={v => [`${v}%`, 'Yield Risk']} />
                <Bar dataKey="yieldRisk" fill={T.red} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 8 }}>Regional Risk Summary</div>
            <div style={{ overflowY: 'auto', maxHeight: 260 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Region', 'Crop', 'Yield Risk', 'Physical', 'Level'].map(h => (
                      <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: T.textSec, fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 20).map(r => (
                    <tr key={r.id} style={{ borderBottom: `1px solid ${T.borderL}` }}>
                      <td style={{ padding: '5px 8px', color: T.textPri }}>{r.name}</td>
                      <td style={{ padding: '5px 8px', color: T.textSec }}>{r.cropType}</td>
                      <td style={{ padding: '5px 8px', color: T.red, fontFamily: T.fontMono }}>{r.yieldRisk}%</td>
                      <td style={{ padding: '5px 8px', fontFamily: T.fontMono }}>{r.physicalRiskScore}</td>
                      <td style={{ padding: '5px 8px' }}>
                        <span style={{ background: RISK_COLORS[getRiskLevel(r.physicalRiskScore)] + '22', color: RISK_COLORS[getRiskLevel(r.physicalRiskScore)], padding: '2px 7px', borderRadius: 10, fontSize: 11, fontWeight: 600 }}>
                          {getRiskLevel(r.physicalRiskScore)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 4 }}>Baseline vs Adapted Yield Loss</div>
            <div style={{ fontSize: 11, color: T.textSec, marginBottom: 12 }}>Adaptation investment: ${adaptInvestment}Bn applied</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={adaptData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="crop" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" />
                <Tooltip formatter={v => [`${v}%`]} />
                <Legend />
                <Bar dataKey="baseline" name="Baseline Risk" fill={T.red} radius={[4, 4, 0, 0]} />
                <Bar dataKey="adapted" name="With Adaptation" fill={T.green} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>Top 15 Highest Yield Risk Regions</div>
            <div style={{ overflowY: 'auto', maxHeight: 260 }}>
              {[...filtered].sort((a, b) => b.yieldRisk - a.yieldRisk).slice(0, 15).map((r, i) => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <span style={{ fontSize: 11, color: T.textSec, width: 20 }}>#{i + 1}</span>
                  <span style={{ fontSize: 12, color: T.textPri, flex: 1 }}>{r.name}</span>
                  <span style={{ fontSize: 11, color: T.textSec }}>{r.cropType}</span>
                  <span style={{ fontSize: 12, color: T.red, fontFamily: T.fontMono, fontWeight: 600 }}>{r.yieldRisk}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 2 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 4 }}>Extreme Heat Days vs Yield Risk</div>
          <div style={{ fontSize: 11, color: T.textSec, marginBottom: 12 }}>Scatter plot — bubble size = physical risk score</div>
          <ResponsiveContainer width="100%" height={340}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="x" name="Heat Days/yr" tick={{ fontSize: 11 }} label={{ value: 'Extreme Heat Days/yr by 2050', position: 'insideBottom', offset: -5, fontSize: 11 }} />
              <YAxis dataKey="y" name="Yield Risk %" tick={{ fontSize: 11 }} label={{ value: 'Yield Risk %', angle: -90, position: 'insideLeft', fontSize: 11 }} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(v, n) => [v, n]} />
              <Scatter data={heatScatter} fill={T.red} fillOpacity={0.6} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 3 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 4 }}>Precipitation Change by Region (%)</div>
          <div style={{ fontSize: 11, color: T.textSec, marginBottom: 12 }}>Projected change by 2050 under +{tempScenario.toFixed(1)}°C scenario</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={precipData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="region" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} unit="%" />
              <Tooltip formatter={v => [`${v}%`, 'Precip Change']} />
              <Bar dataKey="change" fill={T.blue} radius={[4, 4, 0, 0]}
                label={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 4 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 4 }}>Drought Frequency — Top 15 Countries (events/decade)</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={droughtTop15} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} />
              <Tooltip formatter={v => [`${v}`, 'Events/decade']} />
              <Bar dataKey="drought" fill={T.amber} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 5 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>Soil Health & Degradation Risk</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[...filtered].sort((a, b) => b.soilDegradation - a.soilDegradation).slice(0, 15).map(r => (
              <div key={r.id} style={{ background: T.sub, borderRadius: 8, padding: '10px 14px', border: `1px solid ${T.borderL}` }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.textPri, marginBottom: 4 }}>{r.name}</div>
                <div style={{ fontSize: 11, color: T.textSec, marginBottom: 6 }}>{r.cropType} · {r.region.split(' ').slice(-1)[0]}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: T.textSec }}>Degradation</span>
                  <span style={{ fontSize: 13, color: r.soilDegradation > 6 ? T.red : T.amber, fontWeight: 600, fontFamily: T.fontMono }}>{r.soilDegradation.toFixed(1)}/10</span>
                </div>
                <div style={{ height: 4, background: T.borderL, borderRadius: 2, marginTop: 6 }}>
                  <div style={{ height: '100%', width: `${r.soilDegradation * 10}%`, background: r.soilDegradation > 6 ? T.red : T.amber, borderRadius: 2 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 6 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>Farmer Income Risk & Irrigation Dependency</div>
          <ResponsiveContainer width="100%" height={320}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="x" name="Irrigation Dependency %" tick={{ fontSize: 11 }} label={{ value: 'Irrigation Dependency %', position: 'insideBottom', offset: -5, fontSize: 11 }} />
              <YAxis dataKey="y" name="Farmer Income Risk %" tick={{ fontSize: 11 }} label={{ value: 'Farmer Income Risk %', angle: -90, position: 'insideLeft', fontSize: 11 }} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={filtered.slice(0, 40).map(r => ({ x: r.irrigationDependency, y: r.farmerIncomeRisk, name: r.name }))} fill={T.purple} fillOpacity={0.6} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 7 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>Adaptation Capacity by Region</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={REGIONS.map(reg => {
                const items = filtered.filter(r => r.region === reg);
                return { region: reg.split(' ').slice(-1)[0], capacity: items.length ? +(items.reduce((a, r) => a + r.adaptationCapacity, 0) / items.length).toFixed(1) : 0 };
              })}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="region" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 10]} />
                <Tooltip />
                <Bar dataKey="capacity" name="Adaptation Capacity" fill={T.green} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 8 }}>Pathway Recommendations</div>
            {[
              { title: 'Drought-Resistant Varieties', impact: 'High', cost: '$2–8Bn', crops: 'Wheat, Maize, Soy' },
              { title: 'Precision Irrigation Systems', impact: 'High', cost: '$5–15Bn', crops: 'Rice, Cotton' },
              { title: 'Agroforestry Integration', impact: 'Medium', cost: '$3–10Bn', crops: 'Coffee, Cocoa' },
              { title: 'Weather Index Insurance', impact: 'Medium', cost: '$1–4Bn', crops: 'All crops' },
              { title: 'Soil Carbon Sequestration', impact: 'High', cost: '$4–12Bn', crops: 'All crops' },
            ].map(p => (
              <div key={p.title} style={{ padding: '8px 0', borderBottom: `1px solid ${T.borderL}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.textPri }}>{p.title}</span>
                  <span style={{ fontSize: 11, color: p.impact === 'High' ? T.green : T.amber }}>{p.impact} Impact</span>
                </div>
                <div style={{ fontSize: 11, color: T.textSec }}>Cost: {p.cost} · Crops: {p.crops}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
