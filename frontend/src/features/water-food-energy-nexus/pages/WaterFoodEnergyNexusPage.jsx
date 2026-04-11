import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, AreaChart, Area, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Legend,
} from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f6f4f0',
  navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f',
  teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c',
  surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace',
};

const REGIONS = ['South Asia', 'MENA', 'Sub-Saharan Africa', 'East Asia', 'Latin America', 'Central Asia', 'Europe'];
const STRESS_LEVELS = ['Low', 'Medium', 'High', 'Extremely High'];

const BASIN_NAMES = [
  'Ganges-Brahmaputra', 'Indus Basin', 'Nile Delta', 'Tigris-Euphrates', 'Yellow River',
  'Mekong', 'Amazon Basin', 'Murray-Darling', 'Colorado River', 'Jordan River',
  'Volta Basin', 'Niger Basin', 'Senegal River', 'Orange-Vaal', 'Limpopo Basin',
  'Danube', 'Rhine-Meuse', 'Po Valley', 'Ebro', 'Tagus',
  'Amu Darya', 'Syr Darya', 'Chu River', 'Lake Chad', 'Okavango',
  'Zambezi', 'Congo Basin', 'Irrawaddy', 'Chao Phraya', 'Red River',
  'Pearl River', 'Yangtze', 'Ob-Irtysh', 'Amur', 'Songhua',
  'Sacramento', 'San Joaquin', 'Rio Grande', 'Lerma-Santiago', 'Orinoco',
  'Parana-Plata', 'Sao Francisco', 'Tocantins', 'Atrato', 'Magdalena',
  'Cauvery', 'Krishna', 'Godavari', 'Mahanadi', 'Sabarmati',
];

const BASINS = Array.from({ length: 50 }, (_, i) => {
  const region = REGIONS[i % REGIONS.length];
  const stressIdx = Math.floor(sr(i * 7) * 4);
  const waterStressIndex = +(0.5 + sr(i * 7) * 4.4).toFixed(2);
  return {
    id: i,
    name: BASIN_NAMES[i] || `Basin ${i + 1}`,
    country: region.split(' ').pop(),
    region,
    waterStressIndex,
    stressLevel: STRESS_LEVELS[stressIdx],
    irrigationEfficiency: +(30 + sr(i * 11) * 60).toFixed(1),
    energyForIrrigation: +(1 + sr(i * 13) * 14).toFixed(1),
    cropWaterProductivity: +(0.3 + sr(i * 17) * 1.8).toFixed(2),
    groundwaterDepletion: +(sr(i * 5) * 120).toFixed(0),
    hydropowerDependency: +(sr(i * 19) * 85).toFixed(1),
    foodProduction: +(sr(i * 23) * 80).toFixed(1),
    nexusRiskScore: Math.round(15 + sr(i * 29) * 80),
    adaptationInvestment: +(sr(i * 31) * 500).toFixed(0),
    climateImpactOnWater: +(-40 + sr(i * 37) * 80).toFixed(1),
  };
});

const TABS = [
  'Nexus Overview', 'Water Stress', 'Irrigation Analytics', 'Energy-Water Link',
  'Food Production Risk', 'Groundwater Depletion', 'Adaptation Finance', 'Scenario Analysis',
];

const SCENARIOS = [
  { name: 'Current', water: 100, food: 100, energy: 100, nexusRisk: 45 },
  { name: '+1.5°C', water: 88, food: 93, energy: 105, nexusRisk: 55 },
  { name: '+2°C', water: 76, food: 85, energy: 112, nexusRisk: 66 },
  { name: '+3°C', water: 61, food: 72, energy: 124, nexusRisk: 80 },
  { name: '+4°C', water: 45, food: 58, energy: 138, nexusRisk: 92 },
];

export default function WaterFoodEnergyNexusPage() {
  const [tab, setTab] = useState(0);
  const [regionFilter, setRegionFilter] = useState('All');
  const [stressFilter, setStressFilter] = useState('All');
  const [tempScenario, setTempScenario] = useState(2);
  const [waterPrice, setWaterPrice] = useState(0.5);

  const filtered = useMemo(() => {
    return BASINS.filter(b => {
      if (regionFilter !== 'All' && b.region !== regionFilter) return false;
      if (stressFilter !== 'All' && b.stressLevel !== stressFilter) return false;
      return true;
    });
  }, [regionFilter, stressFilter]);

  const kpis = useMemo(() => {
    const n = Math.max(1, filtered.length);
    const avgStress = filtered.reduce((a, b) => a + b.waterStressIndex, 0) / n;
    const avgNexus = filtered.reduce((a, b) => a + b.nexusRiskScore, 0) / n;
    const totalFood = filtered.reduce((a, b) => a + b.foodProduction, 0);
    const avgGW = filtered.reduce((a, b) => a + b.groundwaterDepletion, 0) / n;
    return { avgStress: avgStress.toFixed(2), avgNexus: avgNexus.toFixed(0), totalFood: totalFood.toFixed(0), avgGW: avgGW.toFixed(0) };
  }, [filtered]);

  const stressTop15 = useMemo(() =>
    [...filtered].sort((a, b) => b.waterStressIndex - a.waterStressIndex).slice(0, 15)
      .map(b => ({ name: b.name.split('-')[0], stress: b.waterStressIndex })), [filtered]);

  const irrScatter = useMemo(() =>
    filtered.slice(0, 40).map(b => ({ x: b.irrigationEfficiency, y: b.foodProduction, name: b.name })), [filtered]);

  const gwTrend = useMemo(() =>
    Array.from({ length: 6 }, (_, i) => ({
      year: 2025 + i * 5,
      depletion: +(filtered.reduce((a, b) => a + b.groundwaterDepletion * (1 + i * 0.05), 0) / Math.max(1, filtered.length)).toFixed(0),
    })), [filtered]);

  const nexusRadar = useMemo(() => {
    const n = Math.max(1, filtered.length);
    return [
      { dimension: 'Water Stress', value: Math.round(filtered.reduce((a, b) => a + b.waterStressIndex, 0) / n * 20) },
      { dimension: 'Food Risk', value: Math.round(filtered.reduce((a, b) => a + b.nexusRiskScore, 0) / n) },
      { dimension: 'Energy Use', value: Math.round(filtered.reduce((a, b) => a + b.energyForIrrigation, 0) / n * 6) },
      { dimension: 'GW Depletion', value: Math.round(Math.min(100, filtered.reduce((a, b) => a + b.groundwaterDepletion, 0) / n / 1.2)) },
      { dimension: 'Adaptation', value: Math.round(filtered.reduce((a, b) => a + b.adaptationInvestment, 0) / n / 5) },
    ];
  }, [filtered]);

  const scenarioData = useMemo(() => {
    const idx = Math.min(4, Math.round((tempScenario - 1) / 0.75));
    return SCENARIOS.slice(0, idx + 2);
  }, [tempScenario]);

  const s = { fontFamily: "'DM Sans', system-ui, sans-serif" };

  return (
    <div style={{ ...s, background: T.bg, minHeight: '100vh', padding: '24px' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono, marginBottom: 4 }}>EP-DG5 · Food, Agriculture & Land Use</div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: T.navy, margin: 0 }}>Water-Food-Energy Nexus</h1>
        <p style={{ color: T.textSec, fontSize: 13, margin: '4px 0 0' }}>Interdependency analytics across 50 river basins — water stress, irrigation, energy linkages and groundwater depletion</p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Avg Water Stress Index', value: `${kpis.avgStress}/5`, color: T.red },
          { label: 'Avg Nexus Risk Score', value: `${kpis.avgNexus}/100`, color: T.orange },
          { label: 'Total Food Production (Mt)', value: `${kpis.totalFood}`, color: T.sage },
          { label: 'Avg Groundwater Depletion', value: `${kpis.avgGW} mm/yr`, color: T.blue },
        ].map(k => (
          <div key={k.label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 18px' }}>
            <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>{k.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 20px', marginBottom: 20, display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {[
          { label: 'Region', value: regionFilter, set: setRegionFilter, opts: ['All', ...REGIONS] },
          { label: 'Water Stress Level', value: stressFilter, set: setStressFilter, opts: ['All', ...STRESS_LEVELS] },
        ].map(f => (
          <div key={f.label}>
            <div style={{ fontSize: 11, color: T.textSec, marginBottom: 3 }}>{f.label}</div>
            <select value={f.value} onChange={e => f.set(e.target.value)} style={{ fontSize: 13, border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 8px', background: T.bg, color: T.textPri }}>
              {f.opts.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        ))}
        <div>
          <div style={{ fontSize: 11, color: T.textSec, marginBottom: 3 }}>Temp Scenario: +{tempScenario}°C</div>
          <input type="range" min={1} max={4} step={0.5} value={tempScenario} onChange={e => setTempScenario(+e.target.value)} style={{ width: 120 }} />
        </div>
        <div>
          <div style={{ fontSize: 11, color: T.textSec, marginBottom: 3 }}>Water Price: ${waterPrice.toFixed(2)}/m³</div>
          <input type="range" min={0.1} max={3} step={0.1} value={waterPrice} onChange={e => setWaterPrice(+e.target.value)} style={{ width: 120 }} />
        </div>
        <div style={{ fontSize: 12, color: T.textSec, marginLeft: 'auto' }}>{filtered.length} basins</div>
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

      {tab === 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>Nexus Risk Dimensions</div>
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={nexusRadar}>
                <PolarGrid />
                <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Radar name="Nexus Risk" dataKey="value" stroke={T.red} fill={T.red} fillOpacity={0.3} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 8 }}>Basin Overview</div>
            <div style={{ overflowY: 'auto', maxHeight: 260 }}>
              {filtered.slice(0, 20).map(b => (
                <div key={b.id} style={{ padding: '5px 0', borderBottom: `1px solid ${T.borderL}`, display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, flex: 1, color: T.textPri }}>{b.name}</span>
                  <span style={{ fontSize: 11, color: T.textSec }}>{b.stressLevel}</span>
                  <span style={{ fontSize: 12, fontFamily: T.fontMono, color: b.nexusRiskScore > 60 ? T.red : T.amber }}>{b.nexusRiskScore}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 4 }}>Water Stress Index — Top 15 Basins</div>
          <div style={{ fontSize: 11, color: T.textSec, marginBottom: 12 }}>WRI Aqueduct scale 0–5 (≥4 = Extremely High)</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stressTop15} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={130} />
              <Tooltip formatter={v => [`${v}`, 'Stress Index']} />
              <Bar dataKey="stress" fill={T.red} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 2 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 4 }}>Irrigation Efficiency vs Food Production</div>
          <div style={{ fontSize: 11, color: T.textSec, marginBottom: 12 }}>Crop water productivity benefits from increased irrigation efficiency</div>
          <ResponsiveContainer width="100%" height={320}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="x" name="Irrigation Efficiency %" tick={{ fontSize: 11 }} label={{ value: 'Irrigation Efficiency %', position: 'insideBottom', offset: -5, fontSize: 11 }} />
              <YAxis dataKey="y" name="Food Production (Mt)" tick={{ fontSize: 11 }} label={{ value: 'Food Production (Mt)', angle: -90, position: 'insideLeft', fontSize: 11 }} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={irrScatter} fill={T.teal} fillOpacity={0.6} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 3 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>Energy for Irrigation by Region (GJ/ha)</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={REGIONS.map(reg => {
              const items = filtered.filter(b => b.region === reg);
              const n = Math.max(1, items.length);
              return { region: reg.split(' ').slice(-1)[0], energy: +(items.reduce((a, b) => a + b.energyForIrrigation, 0) / n).toFixed(1), cost: +(items.reduce((a, b) => a + b.energyForIrrigation, 0) / n * waterPrice * 10).toFixed(1) };
            })}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="region" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="energy" name="Energy (GJ/ha)" fill={T.amber} radius={[4, 4, 0, 0]} />
              <Bar dataKey="cost" name={`Water Cost ($${waterPrice}/m³, est $M/ha)`} fill={T.orange} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 4 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>Food Production at Risk — High Stress Basins</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[...filtered].filter(b => b.waterStressIndex > 3).sort((a, b) => b.foodProduction - a.foodProduction).slice(0, 15).map(b => ({ name: b.name.split('-')[0], food: b.foodProduction, risk: b.nexusRiskScore }))}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="food" name="Food Production (Mt)" fill={T.sage} radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="risk" name="Nexus Risk Score" fill={T.red} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 5 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 4 }}>Groundwater Depletion Trend 2025–2050 (mm/yr avg)</div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={gwTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => [`${v} mm/yr`, 'Avg Depletion']} />
              <Area type="monotone" dataKey="depletion" stroke={T.blue} fill={T.blue + '33'} strokeWidth={2} name="GW Depletion" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 6 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>Adaptation Investment by Basin ($M)</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[...filtered].sort((a, b) => b.adaptationInvestment - a.adaptationInvestment).slice(0, 15).map(b => ({ name: b.name.split('-')[0], inv: +b.adaptationInvestment }))}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => [`$${v}M`, 'Investment']} />
              <Bar dataKey="inv" fill={T.indigo} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 7 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 4 }}>Nexus Scenario Analysis — +{tempScenario}°C Temperature Impact</div>
          <div style={{ fontSize: 11, color: T.textSec, marginBottom: 12 }}>Index values relative to current baseline (100 = current)</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={scenarioData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 150]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="water" name="Water Availability" fill={T.blue} radius={[4, 4, 0, 0]} />
              <Bar dataKey="food" name="Food Production" fill={T.sage} radius={[4, 4, 0, 0]} />
              <Bar dataKey="energy" name="Energy Demand" fill={T.amber} radius={[4, 4, 0, 0]} />
              <Bar dataKey="nexusRisk" name="Nexus Risk" fill={T.red} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
