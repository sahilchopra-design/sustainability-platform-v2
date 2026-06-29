import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, ScatterChart, Scatter, RadarChart, Radar, PolarGrid, PolarAngleAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const T = {
  bg: '#0f172a', surface: '#1e293b', surfaceH: '#334155', border: '#334155', borderL: '#475569',
  navy: '#3b82f6', navyL: '#93c5fd', gold: '#f59e0b', goldL: '#fcd34d',
  sage: '#10b981', sageL: '#6ee7b7', teal: '#14b8a6', text: '#f1f5f9',
  textSec: '#94a3b8', textMut: '#64748b', red: '#ef4444', green: '#22c55e',
  amber: '#f59e0b', font: 'Inter,sans-serif', mono: 'JetBrains Mono,monospace'
};

const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const KpiCard = ({ label, value, sub, color = T.navy }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px', flex: 1, minWidth: 160 }}>
    <div style={{ fontSize: 11, color: T.textSec, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color, marginTop: 4 }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: T.textMut, marginTop: 2 }}>{sub}</div>}
  </div>
);

const SCENARIOS = [
  { id: 'nature-positive', name: 'Nature Positive', family: 'Restorative', tempTarget: 1.5, biodiversityLoss2030: -5, biodiversityLoss2050: 10, waterAvail: 8, soilHealth: 9, carbonSeq: 8.2, gdpImpact: 1.8, description: 'Halt and reverse nature loss by 2030; GBF Target 3 met', color: '#22c55e' },
  { id: 'sustainable-use', name: 'Sustainable Use', family: 'Transitional', tempTarget: 2.0, biodiversityLoss2030: 2, biodiversityLoss2050: -2, waterAvail: 6, soilHealth: 7, carbonSeq: 5.8, gdpImpact: 0.9, description: 'Balanced use of natural resources; moderate restoration effort', color: '#14b8a6' },
  { id: 'net-zero-nature', name: 'Net Zero + Nature', family: 'Integrated', tempTarget: 1.8, biodiversityLoss2030: 0, biodiversityLoss2050: 5, waterAvail: 7, soilHealth: 8, carbonSeq: 9.1, gdpImpact: 1.4, description: 'Climate and nature goals co-optimised; NbS-heavy', color: '#3b82f6' },
  { id: 'current-trajectory', name: 'Current Trajectory', family: 'Baseline', tempTarget: 2.8, biodiversityLoss2030: 12, biodiversityLoss2050: -18, waterAvail: 4, soilHealth: 4, carbonSeq: 2.1, gdpImpact: -0.4, description: 'NDC-only implementation; biodiversity loss continues', color: '#f59e0b' },
  { id: 'restoration', name: 'Restoration Focus', family: 'Restorative', tempTarget: 2.0, biodiversityLoss2030: -8, biodiversityLoss2050: 18, waterAvail: 9, soilHealth: 9, carbonSeq: 10.4, gdpImpact: 2.1, description: 'Ecosystem restoration at scale; 30×30 + EU Nature Restoration Law', color: '#10b981' },
  { id: 'degradation', name: 'Continued Degradation', family: 'Negative', tempTarget: 3.5, biodiversityLoss2030: 22, biodiversityLoss2050: -35, waterAvail: 2, soilHealth: 2, carbonSeq: -1.4, gdpImpact: -3.8, description: 'Business-as-usual land use; accelerating ecosystem loss', color: '#ef4444' },
  { id: 'managed-decline', name: 'Managed Decline', family: 'Adaptive', tempTarget: 3.0, biodiversityLoss2030: 8, biodiversityLoss2050: -10, waterAvail: 3, soilHealth: 3, carbonSeq: 0.8, gdpImpact: -1.2, description: 'Damage limitation; protected area compliance only', color: '#94a3b8' },
  { id: 'collapse', name: 'Ecosystem Collapse', family: 'Critical', tempTarget: 4.0, biodiversityLoss2030: 35, biodiversityLoss2050: -58, waterAvail: 1, soilHealth: 1, carbonSeq: -4.2, gdpImpact: -8.4, description: 'Tipping points crossed; irreversible biosphere degradation', color: '#dc2626' },
];

const BIOMES = [
  { id: 'tropical-forests', name: 'Tropical Forests', area: 1900, intactPct: 42, degradedPct: 38, restoredPct: 8, lossRateHaYr: 11_000_000, carbonStockGt: 228, biodiversityScore: 9.8, gbfCoverage: 18, threatLevel: 'Critical' },
  { id: 'temperate-forests', name: 'Temperate Forests', area: 750, intactPct: 55, degradedPct: 28, restoredPct: 14, lossRateHaYr: 1_200_000, carbonStockGt: 68, biodiversityScore: 7.4, gbfCoverage: 26, threatLevel: 'High' },
  { id: 'marine', name: 'Ocean Ecosystems', area: 36100, intactPct: 38, degradedPct: 42, restoredPct: 4, lossRateHaYr: 2_800_000, carbonStockGt: 38, biodiversityScore: 9.2, gbfCoverage: 8, threatLevel: 'Critical' },
  { id: 'grasslands', name: 'Grasslands & Savannas', area: 4000, intactPct: 48, degradedPct: 35, restoredPct: 6, lossRateHaYr: 4_200_000, carbonStockGt: 18, biodiversityScore: 7.8, gbfCoverage: 14, threatLevel: 'High' },
  { id: 'freshwater', name: 'Freshwater', area: 250, intactPct: 28, degradedPct: 52, restoredPct: 5, lossRateHaYr: 680_000, carbonStockGt: 12, biodiversityScore: 9.4, gbfCoverage: 12, threatLevel: 'Critical' },
  { id: 'wetlands', name: 'Wetlands & Peatlands', area: 1280, intactPct: 35, degradedPct: 48, restoredPct: 9, lossRateHaYr: 1_800_000, carbonStockGt: 94, biodiversityScore: 8.8, gbfCoverage: 22, threatLevel: 'Critical' },
  { id: 'dryland', name: 'Drylands & Deserts', area: 5200, intactPct: 62, degradedPct: 24, restoredPct: 3, lossRateHaYr: 12_000_000, carbonStockGt: 8, biodiversityScore: 5.8, gbfCoverage: 16, threatLevel: 'Medium' },
  { id: 'mountain', name: 'Mountain Ecosystems', area: 540, intactPct: 68, degradedPct: 18, restoredPct: 4, lossRateHaYr: 380_000, carbonStockGt: 14, biodiversityScore: 8.2, gbfCoverage: 28, threatLevel: 'High' },
  { id: 'polar', name: 'Polar & Tundra', area: 1100, intactPct: 72, degradedPct: 12, restoredPct: 1, lossRateHaYr: 180_000, carbonStockGt: 142, biodiversityScore: 7.2, gbfCoverage: 34, threatLevel: 'High' },
  { id: 'mangroves', name: 'Mangroves', area: 14, intactPct: 44, degradedPct: 38, restoredPct: 12, lossRateHaYr: 74_000, carbonStockGt: 6, biodiversityScore: 9.1, gbfCoverage: 32, threatLevel: 'Critical' },
];

const GBF_TARGETS = [
  { id: 'T3', name: '30×30 Protected Areas', progress: 17.6, target: 30, deadline: 2030, type: 'Area' },
  { id: 'T1', name: 'Spatial Planning & Land Use', progress: 28, target: 100, deadline: 2030, type: 'Policy' },
  { id: 'T2', name: 'Restore 30% Degraded Ecosystems', progress: 8.4, target: 30, deadline: 2030, type: 'Area' },
  { id: 'T4', name: 'Halt Species Extinction', progress: 35, target: 100, deadline: 2030, type: 'Outcome' },
  { id: 'T7', name: 'Sustainable Agriculture & Forestry', progress: 22, target: 100, deadline: 2030, type: 'Policy' },
  { id: 'T10', name: 'Reef & Coastal Ecosystem Management', progress: 18, target: 100, deadline: 2030, type: 'Area' },
  { id: 'T14', name: 'Biodiversity Mainstreaming', progress: 12, target: 100, deadline: 2030, type: 'Policy' },
  { id: 'T15', name: 'Nature-Related Financial Disclosures', progress: 8, target: 100, deadline: 2030, type: 'Finance' },
  { id: 'T19', name: 'Mobilise $200B+/yr Biodiversity Finance', progress: 14, target: 100, deadline: 2030, type: 'Finance' },
  { id: 'T20', name: 'DSI Benefit Sharing (Nagoya)', progress: 42, target: 100, deadline: 2030, type: 'Policy' },
];

const NATURE_CREDITS = [
  { id: 'bc-vcs', name: 'Biodiversity VCS', standard: 'Verra CCB', unit: 'BU', price: 28, supply2024: 4800, demand2024: 8200, qualityScore: 8.8, additionality: 'High', permanence: 25, region: 'Tropical' },
  { id: 'bc-gs', name: 'Gold Standard Nature', standard: 'Gold Standard', unit: 'BU', price: 38, supply2024: 2200, demand2024: 4800, qualityScore: 9.2, additionality: 'High', permanence: 30, region: 'Mixed' },
  { id: 'habs', name: 'Habitat Banking (EU)', standard: 'EU Biodiversity Net Gain', unit: 'HBU', price: 185, supply2024: 420, demand2024: 680, qualityScore: 9.4, additionality: 'Very High', permanence: 50, region: 'Europe' },
  { id: 'seascape', name: 'Blue Carbon Mangrove', standard: 'Plan Vivo Ocean', unit: 'tCO₂e + BU', price: 52, supply2024: 1100, demand2024: 2400, qualityScore: 9.0, additionality: 'High', permanence: 20, region: 'Coastal' },
  { id: 'soil', name: 'Soil Biodiversity Credit', standard: 'FAO GSOC', unit: 'SBU', price: 14, supply2024: 620, demand2024: 980, qualityScore: 7.4, additionality: 'Medium', permanence: 10, region: 'Agri' },
  { id: 'freshwater', name: 'Freshwater Biodiversity', standard: 'Ramsar BioCredit', unit: 'FBU', price: 68, supply2024: 280, demand2024: 540, qualityScore: 8.6, additionality: 'High', permanence: 25, region: 'Wetland' },
];

const PATHWAY_TIME = Array.from({ length: 6 }, (_, i) => ({
  year: 2025 + i * 5,
  'Nature Positive': 8 + i * 4.5 + sr(i) * 2,
  'Sustainable Use': 17 + i * 1.2 + sr(i + 6) * 1.5,
  'Current Trajectory': 17 + i * 3.8 + sr(i + 12) * 2,
  'Degradation': 17 + i * 7.2 + sr(i + 18) * 3,
  'Restoration Focus': 17 - i * 1.8 + sr(i + 24) * 1.2,
}));

const TABS = ['Overview', 'Scenario Dashboard', 'Biome Assessment', 'GBF Targets', 'Nature Credits', 'Portfolio Stress', 'TNFD Pathways'];

export default function NatureScenariosPage() {
  const [tab, setTab] = useState('Overview');
  const [scenFilter, setScenFilter] = useState('all');
  const [selectedScen, setSelectedScen] = useState(SCENARIOS[0]);

  const filtered = useMemo(() =>
    scenFilter === 'all' ? SCENARIOS : SCENARIOS.filter(s => s.family === scenFilter),
    [scenFilter]);

  const tabBar = { display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 20 };
  const tabBtn = (t) => ({
    padding: '6px 14px', borderRadius: 6, fontSize: 13, cursor: 'pointer', border: 'none',
    background: tab === t ? T.navy : T.surfaceH, color: tab === t ? '#fff' : T.textSec, fontWeight: tab === t ? 600 : 400,
  });

  const threatColor = (t) => ({ Critical: T.red, High: T.amber, Medium: T.gold, Low: T.green }[t] || T.textSec);
  const gbfPct = (p, tgt) => Math.min(100, (p / tgt) * 100).toFixed(0);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', padding: 24, fontFamily: T.font, color: T.text }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 22, fontWeight: 700 }}>Nature Scenario Modelling</div>
        <div style={{ fontSize: 13, color: T.textSec, marginTop: 4 }}>TNFD pathways, GBF 30×30, biodiversity risk & nature credit markets — EP-DH6</div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <KpiCard label="Species at Risk" value="~1M" sub="IPBES 2024 assessment" color={T.red} />
        <KpiCard label="Ecosystem Degraded" value="75%" sub="of terrestrial surface" color={T.amber} />
        <KpiCard label="30×30 Progress" value="17.6%" sub="protected area; target 30% by 2030" color={T.navy} />
        <KpiCard label="Biodiversity Finance Gap" value="$700B/yr" sub="annual funding shortfall" color={T.gold} />
        <KpiCard label="NbS Carbon Potential" value="11 GtCO₂/yr" sub="by 2030 — 30% of mitigation" color={T.sage} />
      </div>

      <div style={tabBar}>{TABS.map(t => <button key={t} style={tabBtn(t)} onClick={() => setTab(t)}>{t}</button>)}</div>

      {tab === 'Overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ background: T.surface, borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Biodiversity Loss by Scenario — 2050 (% species lost)</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={[...SCENARIOS].sort((a, b) => a.biodiversityLoss2050 - b.biodiversityLoss2050)}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" stroke={T.textSec} fontSize={9} angle={-25} textAnchor="end" height={55} />
                <YAxis stroke={T.textSec} fontSize={11} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: 'none', color: T.text }} />
                <Bar dataKey="biodiversityLoss2050" radius={[4, 4, 0, 0]} name="Biodiversity Change 2050 (%)"
                  fill={T.navy}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.surface, borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Biome Threat Level Overview</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={BIOMES} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" domain={[0, 100]} stroke={T.textSec} fontSize={11} />
                <YAxis type="category" dataKey="name" stroke={T.textSec} fontSize={10} width={110} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: 'none', color: T.text }} />
                <Bar dataKey="intactPct" stackId="a" fill={T.sage} name="Intact %" />
                <Bar dataKey="restoredPct" stackId="a" fill={T.teal} name="Restored %" />
                <Bar dataKey="degradedPct" stackId="a" fill={T.red} name="Degraded %" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.surface, borderRadius: 10, padding: 20, gridColumn: '1 / -1' }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Ecosystem Loss Trajectory 2025–2050 (% of intact area lost)</div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={PATHWAY_TIME}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" stroke={T.textSec} fontSize={11} />
                <YAxis stroke={T.textSec} fontSize={11} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: 'none', color: T.text }} />
                <Legend wrapperStyle={{ color: T.textSec, fontSize: 11 }} />
                {['Nature Positive', 'Restoration Focus', 'Sustainable Use', 'Current Trajectory', 'Degradation'].map((s, i) => (
                  <Line key={s} type="monotone" dataKey={s} stroke={SCENARIOS.find(sc => sc.name === s)?.color || [T.sage, T.teal, T.amber, T.gold, T.red][i]} strokeWidth={2} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 'Scenario Dashboard' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {['all', 'Restorative', 'Transitional', 'Integrated', 'Baseline', 'Negative', 'Adaptive', 'Critical'].map(f => (
              <button key={f} onClick={() => setScenFilter(f)} style={{ ...tabBtn(f), background: scenFilter === f ? T.teal : T.surfaceH, color: scenFilter === f ? '#fff' : T.textSec }}>
                {f === 'all' ? 'All' : f}
              </button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
            {filtered.map(sc => (
              <div key={sc.id} onClick={() => setSelectedScen(sc)} style={{ background: T.surface, borderRadius: 10, padding: 18, cursor: 'pointer', border: `2px solid ${selectedScen?.id === sc.id ? sc.color : 'transparent'}`, borderLeft: `4px solid ${sc.color}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: sc.color }}>{sc.name}</div>
                    <div style={{ fontSize: 11, color: T.textSec }}>{sc.family}</div>
                  </div>
                  <span style={{ fontSize: 11, background: `${sc.color}20`, color: sc.color, padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>{sc.tempTarget}°C</span>
                </div>
                <div style={{ fontSize: 12, color: T.textSec, marginBottom: 12 }}>{sc.description}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { l: 'Biodiversity 2030', v: `${sc.biodiversityLoss2030 > 0 ? '+' : ''}${sc.biodiversityLoss2030}%`, c: sc.biodiversityLoss2030 > 0 ? T.red : T.green },
                    { l: 'Biodiversity 2050', v: `${sc.biodiversityLoss2050 > 0 ? '+' : ''}${sc.biodiversityLoss2050}%`, c: sc.biodiversityLoss2050 > 0 ? T.red : T.green },
                    { l: 'Carbon Sequestration', v: `${sc.carbonSeq > 0 ? '+' : ''}${sc.carbonSeq} GtCO₂/yr`, c: sc.carbonSeq > 0 ? T.sage : T.amber },
                    { l: 'GDP Impact', v: `${sc.gdpImpact > 0 ? '+' : ''}${sc.gdpImpact}%`, c: sc.gdpImpact > 0 ? T.green : T.red },
                  ].map(({ l, v, c }) => (
                    <div key={l}>
                      <div style={{ fontSize: 10, color: T.textSec, textTransform: 'uppercase' }}>{l}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: c }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'Biome Assessment' && (
        <div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: T.surfaceH }}>
                  {['Biome', 'Area (Mha)', 'Intact %', 'Degraded %', 'Restored %', 'Loss Rate (ha/yr)', 'Carbon Stock (GtCO₂)', 'Biodiversity Score', 'GBF Coverage %', 'Threat'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: T.textSec, fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {BIOMES.map((b, i) => (
                  <tr key={b.id} style={{ background: i % 2 === 0 ? T.surface : 'transparent' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>{b.name}</td>
                    <td style={{ padding: '10px 12px', color: T.textSec }}>{b.area.toLocaleString()}</td>
                    <td style={{ padding: '10px 12px', color: T.sage }}>{b.intactPct}%</td>
                    <td style={{ padding: '10px 12px', color: T.red }}>{b.degradedPct}%</td>
                    <td style={{ padding: '10px 12px', color: T.teal }}>{b.restoredPct}%</td>
                    <td style={{ padding: '10px 12px', color: T.textSec }}>{b.lossRateHaYr.toLocaleString()}</td>
                    <td style={{ padding: '10px 12px', color: T.navy }}>{b.carbonStockGt}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: b.biodiversityScore >= 9 ? T.green : b.biodiversityScore >= 7 ? T.amber : T.red }}>{b.biodiversityScore.toFixed(1)}</td>
                    <td style={{ padding: '10px 12px', color: T.gold }}>{b.gbfCoverage}%</td>
                    <td style={{ padding: '10px 12px' }}><span style={{ color: threatColor(b.threatLevel), fontSize: 11, fontWeight: 600 }}>{b.threatLevel}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'GBF Targets' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
            <KpiCard label="On Track Targets" value={GBF_TARGETS.filter(t => (t.progress / t.target) >= 0.6).length} sub={`of ${GBF_TARGETS.length} Kunming-Montreal GBF`} color={T.green} />
            <KpiCard label="Lagging Targets" value={GBF_TARGETS.filter(t => (t.progress / t.target) < 0.3).length} sub="below 30% progress" color={T.red} />
            <KpiCard label="Finance Gap" value="$700B/yr" sub="vs ~$150B current mobilised" color={T.amber} />
          </div>
          <div style={{ background: T.surface, borderRadius: 10, padding: 20 }}>
            {GBF_TARGETS.map(tgt => {
              const pct = (tgt.progress / tgt.target) * 100;
              const color = pct >= 60 ? T.green : pct >= 30 ? T.amber : T.red;
              return (
                <div key={tgt.id} style={{ marginBottom: 14, padding: 14, background: T.surfaceH, borderRadius: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: T.gold, marginRight: 8 }}>{tgt.id}</span>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{tgt.name}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: T.textSec }}>{tgt.type}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color }}>
                        {tgt.progress}{tgt.type === 'Area' ? '%' : '%'} / {tgt.target}%
                      </span>
                    </div>
                  </div>
                  <div style={{ background: T.bg, borderRadius: 4, height: 8 }}>
                    <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', background: color, borderRadius: 4 }} />
                  </div>
                  <div style={{ fontSize: 11, color: T.textMut, marginTop: 4 }}>Deadline: {tgt.deadline}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'Nature Credits' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14, marginBottom: 20 }}>
            {NATURE_CREDITS.map(nc => {
              const supplyGap = nc.demand2024 - nc.supply2024;
              return (
                <div key={nc.id} style={{ background: T.surface, borderRadius: 10, padding: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{nc.name}</div>
                      <div style={{ fontSize: 11, color: T.textSec }}>{nc.standard} · {nc.region}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: T.gold }}>${nc.price}</div>
                      <div style={{ fontSize: 10, color: T.textSec }}>per {nc.unit}</div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 10, color: T.textSec, textTransform: 'uppercase' }}>Supply 2024</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{nc.supply2024.toLocaleString()} units</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: T.textSec, textTransform: 'uppercase' }}>Demand 2024</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.navy }}>{nc.demand2024.toLocaleString()} units</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: T.textSec, textTransform: 'uppercase' }}>Supply Gap</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: supplyGap > 0 ? T.red : T.green }}>{supplyGap > 0 ? `+${supplyGap.toLocaleString()}` : supplyGap.toLocaleString()}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: T.textSec, textTransform: 'uppercase' }}>Quality Score</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: nc.qualityScore >= 9 ? T.green : T.amber }}>{nc.qualityScore}/10</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: T.textSec, textTransform: 'uppercase' }}>Additionality</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.teal }}>{nc.additionality}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: T.textSec, textTransform: 'uppercase' }}>Permanence (yrs)</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.textSec }}>{nc.permanence}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ background: T.surface, borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Supply vs Demand by Credit Type</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={NATURE_CREDITS}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" stroke={T.textSec} fontSize={10} angle={-20} textAnchor="end" height={50} />
                <YAxis stroke={T.textSec} fontSize={11} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: 'none', color: T.text }} />
                <Legend wrapperStyle={{ color: T.textSec, fontSize: 11 }} />
                <Bar dataKey="supply2024" fill={T.sage} name="Supply 2024" />
                <Bar dataKey="demand2024" fill={T.navy} name="Demand 2024" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 'Portfolio Stress' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ background: T.surface, borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Nature-Related Financial Risk by Scenario</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {SCENARIOS.map(sc => {
                const physicalRisk = Math.min(100, Math.max(0, sc.biodiversityLoss2050 * 1.8 + 15));
                const transitionRisk = sc.tempTarget > 2.5 ? 40 : 15;
                const legalRisk = sc.family === 'Negative' || sc.family === 'Critical' ? 60 : 15;
                return (
                  <div key={sc.id} style={{ padding: '12px 14px', background: T.surfaceH, borderRadius: 8, borderLeft: `3px solid ${sc.color}` }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: sc.color, marginBottom: 6 }}>{sc.name}</div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      {[['Physical Risk', physicalRisk], ['Transition Risk', transitionRisk], ['Legal Risk', legalRisk]].map(([l, v]) => (
                        <div key={l} style={{ flex: 1 }}>
                          <div style={{ fontSize: 10, color: T.textSec }}>{l}</div>
                          <div style={{ background: T.bg, borderRadius: 3, height: 6, marginTop: 3 }}>
                            <div style={{ width: `${v}%`, height: '100%', background: v >= 50 ? T.red : v >= 30 ? T.amber : T.green, borderRadius: 3 }} />
                          </div>
                          <div style={{ fontSize: 11, color: T.textMut, marginTop: 2 }}>{v.toFixed(0)}%</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ background: T.surface, borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>GDP Impact by Scenario</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={[...SCENARIOS].sort((a, b) => b.gdpImpact - a.gdpImpact)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" stroke={T.textSec} fontSize={11} />
                <YAxis type="category" dataKey="name" stroke={T.textSec} fontSize={10} width={130} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: 'none', color: T.text }} />
                <Bar dataKey="gdpImpact" name="GDP Impact (%)" radius={[0, 4, 4, 0]}
                  fill={T.navy}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 'TNFD Pathways' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
            {[
              { title: 'TNFD LEAP Framework', steps: ['Locate interface with nature', 'Evaluate dependencies & impacts', 'Assess material risks & opportunities', 'Prepare to respond & disclose'], color: T.navy },
              { title: 'Nature-Related Opportunities', steps: ['Nature-based solutions', 'Sustainable supply chains', 'Blue/green infrastructure', 'Nature credit markets', 'Biodiversity net gain offsets'], color: T.sage },
              { title: 'Key Disclosure Requirements', steps: ['Biodiversity footprint', 'Ecosystem service dependencies', 'Nature-related risk quantification', 'GBF alignment reporting', 'Finance flows to nature'], color: T.gold },
            ].map(card => (
              <div key={card.title} style={{ background: T.surface, borderRadius: 10, padding: 18, borderTop: `3px solid ${card.color}` }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: card.color, marginBottom: 12 }}>{card.title}</div>
                {card.steps.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: card.color, fontWeight: 700, minWidth: 20 }}>{i + 1}.</span>
                    <span style={{ fontSize: 12, color: T.textSec }}>{s}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ background: T.surface, borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Scenario Water & Soil Health Scores</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={SCENARIOS}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" stroke={T.textSec} fontSize={9} angle={-20} textAnchor="end" height={55} />
                <YAxis domain={[0, 10]} stroke={T.textSec} fontSize={11} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: 'none', color: T.text }} />
                <Legend wrapperStyle={{ color: T.textSec, fontSize: 11 }} />
                <Bar dataKey="waterAvail" fill={T.navy} name="Water Availability" />
                <Bar dataKey="soilHealth" fill={T.sage} name="Soil Health" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
