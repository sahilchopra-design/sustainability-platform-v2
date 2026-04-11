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

const TYPES = ['AgriTech', 'Regenerative Ag', 'Precision Farming', 'Ag Finance', 'Vertical Farming', 'Alternative Protein'];
const STAGES = ['Seed', 'Growth', 'Scale', 'Listed'];
const COUNTRIES = ['USA', 'Netherlands', 'Israel', 'India', 'Brazil', 'Germany', 'UK', 'Singapore', 'Australia', 'Canada'];

const COMPANY_NAMES = [
  'GrowthPath', 'RegenFarm', 'PrecisionAg', 'AgriLend', 'VertiFarm', 'ProteinX',
  'SoilTech', 'RegenEarth', 'CropSense', 'FieldFinance', 'SkyFarm', 'AltMeat',
  'AgriData', 'CarbonSoil', 'SmartIrrigate', 'AgriBlend', 'TowerGreens', 'PlantBurger',
  'SoilCare', 'LandRegain', 'YieldMap', 'CropCapital', 'HydroGrow', 'ProteinLab',
  'RootTech', 'FarmRestore', 'DroneAg', 'RuralCredit', 'AeroFarm', 'InsectFarm',
  'BioCrop', 'CoverCrop', 'SatelliteFarm', 'GreenLoan', 'ClimateGrow', 'CellMeat',
  'NitroBio', 'WildEarth', 'FarmOS', 'BlendedAgri', 'NutriTower', 'AlgaeProtein',
  'SoilMetrics', 'RestorationX', 'ClimateYield', 'AgriImpact', 'UrbanHarvest', 'SoyFree',
  'CarbonFarm', 'EcoRestore', 'SatCrop', 'GreenBridge', 'SkyHydro', 'StemMeat',
  'TerraCycle', 'CleanField', 'AgriXR', 'ClimateFund', 'RooftopFarm', 'PlantCo',
];

const INVESTMENTS = Array.from({ length: 60 }, (_, i) => {
  const type = TYPES[i % TYPES.length];
  const stage = STAGES[i % STAGES.length];
  const country = COUNTRIES[i % COUNTRIES.length];
  return {
    id: i,
    name: COMPANY_NAMES[i] || `Investment ${i + 1}`,
    type,
    country,
    aum: +(5 + sr(i * 7) * 995).toFixed(0),
    irr: +(5 + sr(i * 11) * 30).toFixed(1),
    carbonSequestration: +(0.5 + sr(i * 13) * 9).toFixed(2),
    yieldImprovement: +(5 + sr(i * 17) * 50).toFixed(1),
    waterReduction: +(5 + sr(i * 19) * 60).toFixed(1),
    stage,
    sdgAlignment: [2, 6, 13, 15].filter((_, j) => sr(i * (j + 5)) > 0.3),
    blendedFinance: sr(i * 23) > 0.55,
    impactScore: Math.round(20 + sr(i * 29) * 75),
  };
});

const TABS = [
  'Investment Overview', 'Technology Types', 'Carbon Sequestration', 'Yield & Water Impact',
  'SDG Alignment', 'Blended Finance', 'IRR Analysis', 'Impact Scoring',
];

const TYPE_COLORS = { 'AgriTech': T.blue, 'Regenerative Ag': T.sage, 'Precision Farming': T.indigo, 'Ag Finance': T.gold, 'Vertical Farming': T.teal, 'Alternative Protein': T.purple };
const GROWTH_DATA = [
  { year: 2019, cumulative: 800 }, { year: 2020, cumulative: 1400 }, { year: 2021, cumulative: 2600 },
  { year: 2022, cumulative: 4100 }, { year: 2023, cumulative: 6300 }, { year: 2024, cumulative: 9200 },
];

export default function SustainableAgricultureInvestmentPage() {
  const [tab, setTab] = useState(0);
  const [typeFilter, setTypeFilter] = useState('All');
  const [countryFilter, setCountryFilter] = useState('All');
  const [stageFilter, setStageFilter] = useState('All');
  const [minIrr, setMinIrr] = useState(0);
  const [carbonPrice, setCarbonPrice] = useState(30);

  const filtered = useMemo(() => {
    return INVESTMENTS.filter(inv => {
      if (typeFilter !== 'All' && inv.type !== typeFilter) return false;
      if (countryFilter !== 'All' && inv.country !== countryFilter) return false;
      if (stageFilter !== 'All' && inv.stage !== stageFilter) return false;
      if (inv.irr < minIrr) return false;
      return true;
    });
  }, [typeFilter, countryFilter, stageFilter, minIrr]);

  const kpis = useMemo(() => {
    const n = Math.max(1, filtered.length);
    const totalAum = filtered.reduce((a, inv) => a + inv.aum, 0);
    const avgIrr = filtered.reduce((a, inv) => a + inv.irr, 0) / n;
    const avgCarbon = filtered.reduce((a, inv) => a + inv.carbonSequestration, 0) / n;
    const avgImpact = filtered.reduce((a, inv) => a + inv.impactScore, 0) / n;
    return { totalAum: totalAum.toFixed(0), avgIrr: avgIrr.toFixed(1), avgCarbon: avgCarbon.toFixed(2), avgImpact: avgImpact.toFixed(0) };
  }, [filtered]);

  const aumByType = useMemo(() =>
    TYPES.map(t => {
      const items = filtered.filter(inv => inv.type === t);
      return { type: t.split(' ')[0], aum: items.reduce((a, inv) => a + inv.aum, 0) };
    }), [filtered]);

  const irrScatter = useMemo(() =>
    filtered.map(inv => ({ x: inv.irr, y: inv.impactScore, aum: inv.aum, name: inv.name })), [filtered]);

  const carbonByType = useMemo(() =>
    TYPES.map(t => {
      const items = filtered.filter(inv => inv.type === t);
      const n = Math.max(1, items.length);
      const seq = items.reduce((a, inv) => a + inv.carbonSequestration, 0) / n;
      const value = seq * carbonPrice;
      return { type: t.split(' ')[0], sequestration: +seq.toFixed(2), value: +value.toFixed(0) };
    }), [filtered, carbonPrice]);

  const sdgCounts = useMemo(() => {
    const counts = { 2: 0, 6: 0, 13: 0, 15: 0 };
    filtered.forEach(inv => inv.sdgAlignment.forEach(s => { if (counts[s] !== undefined) counts[s]++; }));
    return [
      { sdg: 'SDG 2 Zero Hunger', count: counts[2] },
      { sdg: 'SDG 6 Clean Water', count: counts[6] },
      { sdg: 'SDG 13 Climate Action', count: counts[13] },
      { sdg: 'SDG 15 Life on Land', count: counts[15] },
    ];
  }, [filtered]);

  const s = { fontFamily: "'DM Sans', system-ui, sans-serif" };

  return (
    <div style={{ ...s, background: T.bg, minHeight: '100vh', padding: '24px' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono, marginBottom: 4 }}>EP-DG4 · Food, Agriculture & Land Use</div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: T.navy, margin: 0 }}>Sustainable Agriculture Investment</h1>
        <p style={{ color: T.textSec, fontSize: 13, margin: '4px 0 0' }}>AgriTech, regenerative ag, precision farming and alternative protein investment analytics across 60 companies/funds</p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total AUM', value: `$${(+kpis.totalAum / 1000).toFixed(1)}Bn`, color: T.navy },
          { label: 'Avg IRR', value: `${kpis.avgIrr}%`, color: T.green },
          { label: 'Avg Carbon Sequestration', value: `${kpis.avgCarbon} tCO2/ha/yr`, color: T.sage },
          { label: 'Avg Impact Score', value: `${kpis.avgImpact}/100`, color: T.indigo },
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
          { label: 'Type', value: typeFilter, set: setTypeFilter, opts: ['All', ...TYPES] },
          { label: 'Country', value: countryFilter, set: setCountryFilter, opts: ['All', ...COUNTRIES] },
          { label: 'Stage', value: stageFilter, set: setStageFilter, opts: ['All', ...STAGES] },
        ].map(f => (
          <div key={f.label}>
            <div style={{ fontSize: 11, color: T.textSec, marginBottom: 3 }}>{f.label}</div>
            <select value={f.value} onChange={e => f.set(e.target.value)} style={{ fontSize: 13, border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 8px', background: T.bg, color: T.textPri }}>
              {f.opts.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        ))}
        <div>
          <div style={{ fontSize: 11, color: T.textSec, marginBottom: 3 }}>Min IRR: {minIrr}%</div>
          <input type="range" min={0} max={30} step={1} value={minIrr} onChange={e => setMinIrr(+e.target.value)} style={{ width: 120 }} />
        </div>
        <div>
          <div style={{ fontSize: 11, color: T.textSec, marginBottom: 3 }}>Carbon Price: ${carbonPrice}/tCO2</div>
          <input type="range" min={5} max={150} step={5} value={carbonPrice} onChange={e => setCarbonPrice(+e.target.value)} style={{ width: 120 }} />
        </div>
        <div style={{ fontSize: 12, color: T.textSec, marginLeft: 'auto' }}>{filtered.length} investments</div>
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
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>Investment Portfolio</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Name', 'Type', 'Country', 'AUM ($M)', 'IRR %', 'Carbon Seq.', 'Stage', 'Impact', 'Blended'].map(h => (
                    <th key={h} style={{ padding: '7px 9px', textAlign: 'left', color: T.textSec, fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 20).map(inv => (
                  <tr key={inv.id} style={{ borderBottom: `1px solid ${T.borderL}` }}>
                    <td style={{ padding: '5px 9px', color: T.textPri, fontWeight: 500 }}>{inv.name}</td>
                    <td style={{ padding: '5px 9px' }}><span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 10, background: (TYPE_COLORS[inv.type] || T.blue) + '22', color: TYPE_COLORS[inv.type] || T.blue, fontWeight: 600 }}>{inv.type}</span></td>
                    <td style={{ padding: '5px 9px', color: T.textSec }}>{inv.country}</td>
                    <td style={{ padding: '5px 9px', fontFamily: T.fontMono }}>{inv.aum}</td>
                    <td style={{ padding: '5px 9px', color: T.green, fontFamily: T.fontMono, fontWeight: 600 }}>{inv.irr}%</td>
                    <td style={{ padding: '5px 9px', fontFamily: T.fontMono }}>{inv.carbonSequestration}</td>
                    <td style={{ padding: '5px 9px', color: T.textSec }}>{inv.stage}</td>
                    <td style={{ padding: '5px 9px', fontFamily: T.fontMono }}>{inv.impactScore}</td>
                    <td style={{ padding: '5px 9px', color: inv.blendedFinance ? T.green : T.textSec, fontWeight: 600 }}>{inv.blendedFinance ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>AUM by Investment Type ($M)</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={aumByType}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="type" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => [`$${v}M`, 'Total AUM']} />
              <Bar dataKey="aum" fill={T.teal} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 2 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 4 }}>Carbon Sequestration by Technology (tCO2/ha/yr)</div>
          <div style={{ fontSize: 11, color: T.textSec, marginBottom: 12 }}>At ${carbonPrice}/tCO2 estimated value shown as overlay</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={carbonByType}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="type" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} label={{ value: 'tCO2/ha/yr', angle: -90, position: 'insideLeft', fontSize: 10 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} label={{ value: `Value ($/ha/yr)`, angle: 90, position: 'insideRight', fontSize: 10 }} />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="sequestration" name="Sequestration (tCO2/ha)" fill={T.sage} radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="value" name={`Value ($/ha at $${carbonPrice}/t)`} fill={T.gold} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 3 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>Yield Improvement by Type (%)</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={TYPES.map(t => {
                const items = filtered.filter(inv => inv.type === t);
                const n = Math.max(1, items.length);
                return { type: t.split(' ')[0], yield: +(items.reduce((a, inv) => a + inv.yieldImprovement, 0) / n).toFixed(1) };
              })}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="type" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" />
                <Tooltip formatter={v => [`${v}%`, 'Yield Improvement']} />
                <Bar dataKey="yield" fill={T.green} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>Water Reduction by Type (%)</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={TYPES.map(t => {
                const items = filtered.filter(inv => inv.type === t);
                const n = Math.max(1, items.length);
                return { type: t.split(' ')[0], water: +(items.reduce((a, inv) => a + inv.waterReduction, 0) / n).toFixed(1) };
              })}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="type" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" />
                <Tooltip formatter={v => [`${v}%`, 'Water Reduction']} />
                <Bar dataKey="water" fill={T.blue} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 4 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>SDG Alignment Coverage</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={sdgCounts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="sdg" type="category" tick={{ fontSize: 12 }} width={180} />
              <Tooltip formatter={v => [v, 'Investments aligned']} />
              <Bar dataKey="count" fill={T.indigo} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 5 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>Blended Finance Investments</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {filtered.filter(inv => inv.blendedFinance).slice(0, 12).map(inv => (
              <div key={inv.id} style={{ background: T.sub, borderRadius: 8, padding: '10px 14px', border: `1px solid ${T.borderL}` }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.textPri, marginBottom: 3 }}>{inv.name}</div>
                <div style={{ fontSize: 11, color: T.textSec, marginBottom: 6 }}>{inv.type} · {inv.stage}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: T.textSec }}>AUM</span>
                  <span style={{ fontFamily: T.fontMono, fontSize: 11 }}>${inv.aum}M</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: T.textSec }}>IRR</span>
                  <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.green, fontWeight: 600 }}>{inv.irr}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 6 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 4 }}>IRR vs Impact Score</div>
          <ResponsiveContainer width="100%" height={320}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="x" name="IRR %" tick={{ fontSize: 11 }} label={{ value: 'IRR %', position: 'insideBottom', offset: -5, fontSize: 11 }} />
              <YAxis dataKey="y" name="Impact Score" tick={{ fontSize: 11 }} label={{ value: 'Impact Score', angle: -90, position: 'insideLeft', fontSize: 11 }} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={irrScatter} fill={T.orange} fillOpacity={0.6} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 7 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>Cumulative Investment Growth ($M) 2019–2024</div>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={GROWTH_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={v => [`$${v}M`, 'Cumulative']} />
                <Line type="monotone" dataKey="cumulative" stroke={T.green} strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 8 }}>Top Impact Investments</div>
            <div style={{ overflowY: 'auto', maxHeight: 240 }}>
              {[...filtered].sort((a, b) => b.impactScore - a.impactScore).slice(0, 12).map((inv, i) => (
                <div key={inv.id} style={{ padding: '6px 0', borderBottom: `1px solid ${T.borderL}`, display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: T.textSec, width: 20 }}>#{i + 1}</span>
                  <span style={{ fontSize: 12, flex: 1, color: T.textPri }}>{inv.name}</span>
                  <span style={{ fontSize: 11, color: T.textSec }}>{inv.type.split(' ')[0]}</span>
                  <span style={{ fontSize: 12, color: T.indigo, fontFamily: T.fontMono, fontWeight: 600 }}>{inv.impactScore}/100</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
