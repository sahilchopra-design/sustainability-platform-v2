import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  Cell, ReferenceLine, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const T = {
  navy: '#1b3a5c', gold: '#c5a96a', cream: '#f7f4ef', bg: '#f0ede8',
  red: '#991b1b', green: '#065f46', gray: '#6b7280', orange: '#c2410c',
  blue: '#1d4ed8', teal: '#0f766e', purple: '#6d28d9', amber: '#b45309',
  lightNavy: '#e8eef5', border: '#d6cfc4'
};
const fmt = (n) => n >= 1e9 ? `$${(n / 1e9).toFixed(2)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : `$${(n / 1e3).toFixed(0)}K`;
const pct = (n, d = 1) => `${(n * 100).toFixed(d)}%`;

// ─── Portfolio Holdings ────────────────────────────────────────────────────
const PERILS = ['Flood', 'Wildfire', 'Heat', 'Wind', 'Drought', 'SLR'];
const REGIONS = ['North America', 'Europe', 'Asia-Pacific', 'LatAm', 'MENA'];
const ASSET_CLASSES = ['Residential RE', 'Commercial RE', 'Infrastructure', 'Agriculture', 'Energy'];
const SCENARIOS_MAP = { current: 1.0, ssp1_26: 1.15, ssp2_45: 1.35, ssp5_85: 1.68, ssp5_2100: 2.42 };

const PORTFOLIO = Array.from({ length: 30 }, (_, i) => {
  const region = REGIONS[i % REGIONS.length];
  const assetClass = ASSET_CLASSES[i % ASSET_CLASSES.length];
  const value = Math.round((sr(i * 17) * 400 + 100) * 1e6);
  const perilScores = Object.fromEntries(PERILS.map((p, j) => [p, Math.round(sr(i * 9 + j) * 80 + 15)]));
  const compositeHazard = Math.round(Object.values(perilScores).reduce((a, b) => a + b, 0) / PERILS.length);
  const aal = Math.round(value * 0.001 * (compositeHazard / 50) * (0.8 + sr(i * 23) * 0.4));
  const pml100 = Math.round(value * 0.08 * (compositeHazard / 50) * (0.9 + sr(i * 31) * 0.2));
  const insured = sr(i * 7) > 0.35;
  return { id: i + 1, name: `${assetClass} ${String.fromCharCode(65 + i)}`, region, assetClass, value, ...perilScores, compositeHazard, aal, pml100, insured };
});

const REGULATORY_THRESHOLDS = [
  { name: 'ECB CST 2022', metric: 'PML 100yr / Tier 1', threshold: 0.05, description: 'Add-on required if > 5% of Tier 1 Capital' },
  { name: 'BoE CBES 2021', metric: 'AAL / RWA', threshold: 0.01, description: 'Monitor closely if > 1% of Risk-Weighted Assets' },
  { name: 'APRA CPG 229', metric: 'High-Risk Assets / Portfolio', threshold: 0.20, description: 'Escalate board reporting if > 20% high-risk' },
  { name: 'ECB DFAST 2024', metric: 'Physical Risk Concentration', threshold: 0.30, description: 'Single-region cap at 30% of total exposure' },
];

const TabBar = ({ tabs, active, onChange }) => (
  <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `2px solid ${T.border}` }}>
    {tabs.map(t => (
      <button key={t} onClick={() => onChange(t)}
        style={{ padding: '8px 18px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
          color: active === t ? T.navy : T.gray, fontFamily: 'inherit',
          borderBottom: active === t ? `3px solid ${T.gold}` : '3px solid transparent', marginBottom: -2 }}>
        {t}
      </button>
    ))}
  </div>
);

const KpiCard = ({ label, value, sub, color, alert }) => (
  <div style={{ background: '#fff', border: `1.5px solid ${alert ? T.red : T.border}`, borderRadius: 8, padding: '14px 18px', minWidth: 130,
    boxShadow: alert ? `0 0 0 3px ${T.red}22` : 'none' }}>
    <div style={{ fontSize: 11, color: T.gray, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.navy, fontFamily: 'JetBrains Mono, monospace' }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: alert ? T.red : T.gray, marginTop: 2 }}>{sub}</div>}
  </div>
);

export default function PhysicalRiskPortfolioPage() {
  const [tab, setTab] = useState('Portfolio Exposure');
  const [scenario, setScenario] = useState('ssp2_45');
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [sortBy, setSortBy] = useState('pml100');

  const mult = SCENARIOS_MAP[scenario] || 1;
  const scenarioLabels = { current: 'Current', ssp1_26: 'SSP1-2.6 (2050)', ssp2_45: 'SSP2-4.5 (2050)', ssp5_85: 'SSP5-8.5 (2050)', ssp5_2100: 'SSP5-8.5 (2100)' };

  const filtered = useMemo(() => selectedRegion === 'All' ? PORTFOLIO : PORTFOLIO.filter(a => a.region === selectedRegion), [selectedRegion]);

  const totalExposure = filtered.reduce((s, a) => s + a.value, 0);
  const totalAAL = Math.round(filtered.reduce((s, a) => s + a.aal, 0) * mult);
  const totalPML100 = Math.round(filtered.reduce((s, a) => s + a.pml100, 0) * mult);
  const insuredExp = filtered.filter(a => a.insured).reduce((s, a) => s + a.value, 0);
  const uninsuredAAL = Math.round(filtered.filter(a => !a.insured).reduce((s, a) => s + a.aal, 0) * mult);
  const highRisk = filtered.filter(a => Math.round(a.compositeHazard * mult) > 65);

  // By region
  const byRegion = REGIONS.map(r => {
    const assets = filtered.filter(a => a.region === r);
    return {
      region: r.replace('North ', 'N. '),
      exposure: assets.reduce((s, a) => s + a.value, 0),
      aal: Math.round(assets.reduce((s, a) => s + a.aal, 0) * mult),
      pml100: Math.round(assets.reduce((s, a) => s + a.pml100, 0) * mult),
      count: assets.length,
    };
  }).filter(r => r.count > 0);

  // By peril
  const byPeril = PERILS.map(p => ({
    peril: p,
    avgScore: filtered.length ? Math.round(filtered.reduce((s, a) => s + (a[p] || 0), 0) / filtered.length * mult) : 0,
    highRiskCount: filtered.filter(a => Math.round((a[p] || 0) * mult) > 65).length,
  }));

  // Double-hit scenario: physical + transition
  const doubleHit = useMemo(() => SCENARIOS_MAP, []);

  // Regulatory metrics — guard: empty filter (totalExposure = 0) → tier1 = 0 → divide-by-zero in regChecks
  const tier1 = Math.max(totalExposure * 0.12, 1);
  const rwa   = Math.max(totalExposure * 0.85, 1);
  const highRiskPct = filtered.length ? highRisk.length / filtered.length : 0;
  const maxRegionExp = totalExposure > 0 ? Math.max(...byRegion.map(r => r.exposure / totalExposure)) : 0;

  const regChecks = [
    { ...REGULATORY_THRESHOLDS[0], actual: totalPML100 / tier1, breach: totalPML100 / tier1 > 0.05 },
    { ...REGULATORY_THRESHOLDS[1], actual: totalAAL / rwa, breach: totalAAL / rwa > 0.01 },
    { ...REGULATORY_THRESHOLDS[2], actual: highRiskPct, breach: highRiskPct > 0.20 },
    { ...REGULATORY_THRESHOLDS[3], actual: maxRegionExp, breach: maxRegionExp > 0.30 },
  ];

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    if (sortBy === 'pml100') return Math.round(b.pml100 * mult) - Math.round(a.pml100 * mult);
    if (sortBy === 'aal') return Math.round(b.aal * mult) - Math.round(a.aal * mult);
    if (sortBy === 'hazard') return Math.round(b.compositeHazard * mult) - Math.round(a.compositeHazard * mult);
    return b.value - a.value;
  }), [filtered, sortBy, mult]);

  return (
    <div style={{ padding: '24px 28px', background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: T.gray, fontFamily: 'JetBrains Mono, monospace' }}>EP-BX3</span>
          <span style={{ fontSize: 11, color: T.gray }}>·</span>
          <span style={{ fontSize: 11, color: T.gray }}>ECB CST · BoE CBES · APRA CPG 229 · Peril Correlation · Insurance Gap · Double-Hit</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.navy }}>Physical Risk Portfolio Aggregator</h1>
            <div style={{ fontSize: 12, color: T.gray, marginTop: 3 }}>Portfolio-level loss aggregation · Peril correlation · Regulatory stress tests · Insurance gap analysis</div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <select value={scenario} onChange={e => setScenario(e.target.value)}
              style={{ padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12, fontFamily: 'inherit' }}>
              {Object.entries(scenarioLabels).map(([k, v]) => <option key={k} value={k}>{v} ({SCENARIOS_MAP[k].toFixed(2)}×)</option>)}
            </select>
            <select value={selectedRegion} onChange={e => setSelectedRegion(e.target.value)}
              style={{ padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12, fontFamily: 'inherit' }}>
              <option value="All">All Regions</option>
              {REGIONS.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <KpiCard label="Total Exposure" value={fmt(totalExposure)} sub={`${filtered.length} assets`} />
        <KpiCard label="Total AAL" value={fmt(totalAAL)} sub={`${scenarioLabels[scenario]}`} color={T.orange} />
        <KpiCard label="PML 100yr" value={fmt(totalPML100)} sub="1% AEP · Regulatory benchmark" color={T.red} />
        <KpiCard label="High Risk Assets" value={`${highRisk.length}`}
          sub={`${pct(highRiskPct)} of portfolio`}
          color={T.red} alert={highRiskPct > 0.20} />
        <KpiCard label="Insurance Gap" value={fmt(uninsuredAAL)}
          sub={`${pct(1 - insuredExp / totalExposure)} uninsured`}
          color={T.purple} alert={uninsuredAAL > totalAAL * 0.4} />
        <KpiCard label="Reg. Breaches" value={regChecks.filter(r => r.breach).length}
          sub="ECB/BoE/APRA thresholds"
          color={regChecks.filter(r => r.breach).length > 0 ? T.red : T.green}
          alert={regChecks.filter(r => r.breach).length > 0} />
      </div>

      <TabBar tabs={['Portfolio Exposure', 'Aggregated Losses', 'Insurance Gap', 'Regulatory Stress', 'Engagement Priority']}
        active={tab} onChange={setTab} />

      {/* --- PORTFOLIO EXPOSURE --- */}
      {tab === 'Portfolio Exposure' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 18, marginBottom: 18 }}>
            {/* Exposure by region */}
            <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 8, padding: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 14 }}>Exposure & AAL by Region · {scenarioLabels[scenario]}</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={byRegion}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="region" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="exp" tickFormatter={v => `$${(v / 1e9).toFixed(1)}B`} tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="aal" orientation="right" tickFormatter={v => `$${(v / 1e6).toFixed(0)}M`} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v, n) => [fmt(v), n === 'exposure' ? 'Exposure' : 'AAL']} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                  <Bar yAxisId="exp" dataKey="exposure" name="Exposure" fill={T.lightNavy} stroke={T.navy} strokeWidth={1} radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="aal" dataKey="aal" name="AAL" fill={T.orange} radius={[4, 4, 0, 0]} opacity={0.85} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Peril heat radar */}
            <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 8, padding: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 14 }}>Portfolio Peril Exposure Radar</div>
              <ResponsiveContainer width="100%" height={240}>
                <RadarChart data={byPeril}>
                  <PolarGrid stroke={T.border} />
                  <PolarAngleAxis dataKey="peril" tick={{ fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                  <Radar name="Avg Hazard Score" dataKey="avgScore" stroke={T.navy} fill={T.navy} fillOpacity={0.15} strokeWidth={2} />
                  <Tooltip formatter={(v) => [`${v}/100`, 'Avg Score']} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top holdings table */}
          <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 8, padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.navy }}>Portfolio Holdings — Physical Risk Scores</div>
                <div style={{ fontSize: 11, color: T.gray }}>{scenarioLabels[scenario]} · {filtered.length} assets</div>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: T.gray }}>Sort by:</span>
                {['pml100', 'aal', 'hazard', 'value'].map(s => (
                  <button key={s} onClick={() => setSortBy(s)}
                    style={{ padding: '4px 10px', borderRadius: 5, border: `1px solid ${sortBy === s ? T.navy : T.border}`,
                      background: sortBy === s ? T.navy : '#fff', color: sortBy === s ? '#fff' : T.navy,
                      fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {s === 'pml100' ? 'PML 100yr' : s.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: T.lightNavy }}>
                    {['Asset', 'Region', 'Class', 'Value', ...PERILS.map(p => p.slice(0, 4)), 'Composite', 'AAL', 'PML 100yr', 'Insured'].map(h => (
                      <th key={h} style={{ padding: '7px 8px', fontWeight: 600, color: T.navy, borderBottom: `1px solid ${T.border}`, textAlign: 'right', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sorted.slice(0, 20).map((a, i) => {
                    const adj = Math.min(100, Math.round(a.compositeHazard * mult));
                    const tier = adj > 65 ? T.red : adj > 40 ? T.amber : T.green;
                    return (
                      <tr key={a.id} style={{ background: i % 2 === 0 ? '#fff' : T.bg }}>
                        <td style={{ padding: '6px 8px', fontWeight: 600, color: T.navy, textAlign: 'left' }}>{a.name}</td>
                        <td style={{ padding: '6px 8px', color: T.gray, textAlign: 'left' }}>{a.region}</td>
                        <td style={{ padding: '6px 8px', color: T.gray, textAlign: 'left', whiteSpace: 'nowrap' }}>{a.assetClass}</td>
                        <td style={{ padding: '6px 8px', fontFamily: 'JetBrains Mono, monospace', textAlign: 'right' }}>{fmt(a.value)}</td>
                        {PERILS.map(p => {
                          const s = Math.min(100, Math.round((a[p] || 0) * mult));
                          const bg = s > 65 ? '#fee2e2' : s > 40 ? '#fef9c3' : '#f0fdf4';
                          return <td key={p} style={{ padding: '6px 8px', background: bg, textAlign: 'center', fontFamily: 'JetBrains Mono, monospace' }}>{s}</td>;
                        })}
                        <td style={{ padding: '6px 8px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: tier, textAlign: 'center' }}>{adj}</td>
                        <td style={{ padding: '6px 8px', fontFamily: 'JetBrains Mono, monospace', textAlign: 'right' }}>{fmt(Math.round(a.aal * mult))}</td>
                        <td style={{ padding: '6px 8px', fontFamily: 'JetBrains Mono, monospace', textAlign: 'right', fontWeight: 600, color: T.red }}>{fmt(Math.round(a.pml100 * mult))}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'center' }}>{a.insured ? '✅' : '❌'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- AGGREGATED LOSSES --- */}
      {tab === 'Aggregated Losses' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            {/* Loss by scenario */}
            <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 8, padding: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 14 }}>Aggregated AAL & PML Across Scenarios</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={Object.entries(scenarioLabels).map(([k, label]) => ({
                  label: label.split(' (')[0],
                  aal: Math.round(filtered.reduce((s, a) => s + a.aal, 0) * SCENARIOS_MAP[k]),
                  pml100: Math.round(filtered.reduce((s, a) => s + a.pml100, 0) * SCENARIOS_MAP[k]),
                  fill: { current: T.green, ssp1_26: T.blue, ssp2_45: T.amber, ssp5_85: T.orange, ssp5_2100: T.red }[k],
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis tickFormatter={v => `$${(v / 1e6).toFixed(0)}M`} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v) => [fmt(v), '']} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="aal" name="AAL" fill={T.orange} opacity={0.7} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pml100" name="PML 100yr" fill={T.red} opacity={0.85} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Loss by peril contribution */}
            <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 8, padding: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 14 }}>AAL Attribution by Peril · {scenarioLabels[scenario]}</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={byPeril.sort((a, b) => b.avgScore - a.avgScore)} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `${v}`} />
                  <YAxis type="category" dataKey="peril" tick={{ fontSize: 11 }} width={55} />
                  <Tooltip formatter={(v, n) => [n === 'avgScore' ? `${v}/100` : v, n === 'avgScore' ? 'Avg Hazard' : 'High Risk Count']} />
                  <Bar dataKey="avgScore" name="Avg Hazard Score" radius={[0, 4, 4, 0]}>
                    {byPeril.sort((a, b) => b.avgScore - a.avgScore).map((e, i) => (
                      <Cell key={i} fill={e.avgScore > 65 ? T.red : e.avgScore > 40 ? T.amber : T.green} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Correlation note */}
          <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 8, padding: 18, marginTop: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 10 }}>Peril Correlation Matrix</div>
            <div style={{ fontSize: 11, color: T.gray, marginBottom: 14 }}>
              Correlation-adjusted portfolio AAL accounts for correlated peril events (e.g., compound flood+drought, heat+wildfire).
              Based on IPCC AR6 WG1 Chapter 11 compound event assessments.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4, fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}>
              {['', ...PERILS].map((h, i) => (
                <div key={i} style={{ padding: '4px 6px', fontWeight: 700, color: T.navy, textAlign: 'center', background: i === 0 ? 'transparent' : T.lightNavy }}>{h}</div>
              ))}
              {PERILS.map((row, ri) => (
                <React.Fragment key={row}>
                  <div style={{ padding: '4px 6px', fontWeight: 700, color: T.navy, background: T.lightNavy, textAlign: 'right' }}>{row}</div>
                  {PERILS.map((col, ci) => {
                    const corr = ri === ci ? 1.0 : Math.round((0.1 + sr(ri * 13 + ci * 7) * 0.55) * 100) / 100;
                    const bg = ri === ci ? T.navy : corr > 0.5 ? '#fee2e2' : corr > 0.3 ? '#fef9c3' : '#f0fdf4';
                    const color = ri === ci ? '#fff' : corr > 0.5 ? T.red : corr > 0.3 ? T.amber : T.green;
                    return <div key={col} style={{ padding: '4px 6px', background: bg, color, textAlign: 'center', borderRadius: 3 }}>{ri === ci ? '1.00' : corr.toFixed(2)}</div>;
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- INSURANCE GAP --- */}
      {tab === 'Insurance Gap' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            {/* Insurance coverage */}
            <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 8, padding: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 14 }}>Insurance Coverage vs. Exposure</div>
              {['Insured', 'Uninsured'].map(label => {
                const assets = filtered.filter(a => a.insured === (label === 'Insured'));
                const exp = assets.reduce((s, a) => s + a.value, 0);
                const aal = Math.round(assets.reduce((s, a) => s + a.aal, 0) * mult);
                return (
                  <div key={label} style={{ marginBottom: 16, padding: '12px 14px', background: T.bg, borderRadius: 8, border: `1px solid ${T.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: label === 'Insured' ? T.green : T.red }}>{label}</span>
                      <span style={{ fontSize: 12, color: T.gray }}>{assets.length} assets</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 11, color: T.gray }}>Exposure</div>
                        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: T.navy }}>{fmt(exp)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: T.gray }}>AAL</div>
                        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: T.orange }}>{fmt(aal)}</div>
                      </div>
                    </div>
                    <div style={{ height: 8, background: '#fff', borderRadius: 4, marginTop: 8 }}>
                      <div style={{ width: `${(exp / totalExposure) * 100}%`, height: '100%',
                        background: label === 'Insured' ? T.green : T.red, borderRadius: 4 }} />
                    </div>
                    <div style={{ fontSize: 11, color: T.gray, marginTop: 4 }}>{pct(exp / totalExposure)} of total exposure</div>
                  </div>
                );
              })}

              <div style={{ padding: '10px 12px', background: '#fef2f2', border: `1px solid ${T.red}40`, borderRadius: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.red, marginBottom: 4 }}>Protection Gap</div>
                <div style={{ fontSize: 18, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: T.red }}>{fmt(uninsuredAAL)}</div>
                <div style={{ fontSize: 11, color: T.gray }}>Annual uninsured expected loss · {scenarioLabels[scenario]}</div>
              </div>
            </div>

            {/* Double-hit calculator */}
            <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 8, padding: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 4 }}>Physical × Transition Double-Hit</div>
              <div style={{ fontSize: 11, color: T.gray, marginBottom: 14 }}>Combined physical risk + stranded asset / carbon cost shock. NGFS disorderly transition scenario overlay.</div>
              {[
                { label: 'Physical AAL', value: totalAAL, color: T.blue, note: `${scenarioLabels[scenario]}` },
                { label: 'Carbon Price Shock (40% increase)', value: Math.round(totalExposure * 0.0045), color: T.orange, note: 'NGFS disorderly · $120/tCO₂ → $168' },
                { label: 'Stranded Asset Write-down', value: Math.round(totalExposure * 0.038), color: T.amber, note: 'Fossil fuel assets at 2050 stranding' },
                { label: 'Insurance Premium Increase', value: Math.round(uninsuredAAL * 0.25), color: T.purple, note: '25% premium uplift estimate' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 10px', borderBottom: `1px solid ${T.border}` }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.navy }}>{item.label}</div>
                    <div style={{ fontSize: 10, color: T.gray }}>{item.note}</div>
                  </div>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, fontWeight: 700, color: item.color }}>{fmt(item.value)}</span>
                </div>
              ))}
              <div style={{ padding: '10px 12px', background: '#fef2f2', borderRadius: 8, marginTop: 12, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, color: T.red, fontSize: 13 }}>Total Combined Shock</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 16, color: T.red }}>
                  {fmt(totalAAL + Math.round(totalExposure * 0.0045) + Math.round(totalExposure * 0.038) + Math.round(uninsuredAAL * 0.25))}
                </span>
              </div>
            </div>
          </div>

          {/* Insurance gap by region */}
          <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 8, padding: 18, marginTop: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 14 }}>Insurance Gap by Region</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={byRegion.map(r => {
                const assets = filtered.filter(a => a.region.replace('North ', 'N. ') === r.region);
                const insured = assets.filter(a => a.insured).reduce((s, a) => s + a.value, 0);
                return { ...r, insured, uninsured: r.exposure - insured, gap: r.exposure > 0 ? Math.round((r.exposure - insured) / r.exposure * r.aal) : 0 };
              })}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="region" tick={{ fontSize: 10 }} />
                <YAxis tickFormatter={v => `$${(v / 1e9).toFixed(1)}B`} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => [fmt(v), '']} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="insured" name="Insured" stackId="a" fill={T.green} opacity={0.8} />
                <Bar dataKey="uninsured" name="Uninsured" stackId="a" fill={T.red} opacity={0.8} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* --- REGULATORY STRESS --- */}
      {tab === 'Regulatory Stress' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
            {regChecks.map(r => (
              <div key={r.name} style={{ background: '#fff', border: `1.5px solid ${r.breach ? T.red : T.border}`,
                borderRadius: 8, padding: 18, boxShadow: r.breach ? `0 0 0 3px ${T.red}20` : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.navy }}>{r.name}</div>
                    <div style={{ fontSize: 11, color: T.gray, marginTop: 2 }}>{r.description}</div>
                  </div>
                  <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700,
                    background: r.breach ? '#fef2f2' : '#f0fdf4', color: r.breach ? T.red : T.green }}>
                    {r.breach ? '⚠ BREACH' : '✓ PASS'}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: T.gray, marginBottom: 6 }}>{r.metric}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 11, color: T.gray }}>Actual</div>
                    <div style={{ fontSize: 18, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
                      color: r.breach ? T.red : T.navy }}>{pct(r.actual, 2)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: T.gray }}>Threshold</div>
                    <div style={{ fontSize: 18, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: T.gray }}>{pct(r.threshold, 0)}</div>
                  </div>
                </div>
                <div style={{ height: 10, background: T.bg, borderRadius: 5 }}>
                  <div style={{ width: `${Math.min(100, (r.actual / (r.threshold * 2)) * 100)}%`, height: '100%',
                    background: r.breach ? T.red : T.green, borderRadius: 5, transition: 'width 0.4s' }} />
                </div>
                <div style={{ height: 0, borderLeft: `2px dashed ${T.gray}`, marginLeft: `${50}%`, marginTop: -10, height: 14 }} />
              </div>
            ))}
          </div>

          {/* Stress test by regulatory body */}
          <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 8, padding: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 14 }}>Regulatory Capital Add-On Estimates</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.lightNavy }}>
                  {['Regulator', 'Framework', 'Scenario', 'Metric', 'Capital Add-On', 'Breach'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', fontWeight: 600, color: T.navy, borderBottom: `1px solid ${T.border}`, textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { reg: 'ECB', framework: 'CST 2022 Short-term', scenario: '3°C (Disorderly)', metric: 'NII impact', addon: `${pct(totalPML100 / (totalExposure * 0.12))} of Tier 1`, breach: totalPML100 / (totalExposure * 0.12) > 0.05 },
                  { reg: 'BoE', framework: 'CBES 2021 ELE', scenario: 'Late Action', metric: 'AAL / RWA', addon: `${pct(totalAAL / (totalExposure * 0.85), 3)}`, breach: totalAAL / (totalExposure * 0.85) > 0.01 },
                  { reg: 'APRA', framework: 'CPG 229', scenario: 'Orderly Transition', metric: 'High-Risk Concentration', addon: `${pct(highRiskPct)} of portfolio`, breach: highRiskPct > 0.2 },
                  { reg: 'ECB', framework: 'DFAST 2024', scenario: 'Physical Shock', metric: 'Regional Concentration', addon: `${pct(maxRegionExp)} top region`, breach: maxRegionExp > 0.3 },
                  { reg: 'PRA', framework: 'SS3/19', scenario: 'Long-run (30yr)', metric: 'Physical Risk Score', addon: `${filtered.length ? Math.round(filtered.reduce((s, a) => s + a.compositeHazard, 0) / filtered.length * mult) : 0}/100`, breach: false },
                ].map((r, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : T.bg }}>
                    <td style={{ padding: '7px 10px', fontWeight: 700, color: T.navy }}>{r.reg}</td>
                    <td style={{ padding: '7px 10px', color: T.gray }}>{r.framework}</td>
                    <td style={{ padding: '7px 10px', color: T.gray }}>{r.scenario}</td>
                    <td style={{ padding: '7px 10px', color: T.gray }}>{r.metric}</td>
                    <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: r.breach ? T.red : T.navy }}>{r.addon}</td>
                    <td style={{ padding: '7px 10px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                        background: r.breach ? '#fef2f2' : '#f0fdf4', color: r.breach ? T.red : T.green }}>
                        {r.breach ? '⚠ BREACH' : '✓ OK'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- ENGAGEMENT PRIORITY --- */}
      {tab === 'Engagement Priority' && (
        <div>
          <div style={{ background: '#fff8ef', border: `1px solid ${T.gold}`, borderRadius: 8, padding: '10px 16px', marginBottom: 18, fontSize: 12 }}>
            <strong>Engagement Logic:</strong> Priority Score = (Composite Hazard × 0.4) + (PML 100yr / Portfolio PML × 100 × 0.35) + (Uninsured ? 25 : 0) × 0.25
          </div>
          <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 8, padding: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 14 }}>Priority Engagement Targets · {scenarioLabels[scenario]}</div>
            {sorted.slice(0, 12).map((a, i) => {
              const adjHazard = Math.min(100, Math.round(a.compositeHazard * mult));
              const totalPml = filtered.reduce((s, x) => s + x.pml100, 0);
              const pmlShare = totalPml > 0 ? a.pml100 / totalPml : 0; // guard: prevents Infinity when all PML100 = 0
              // Priority Score = (Composite × 0.4) + (PML Share × 100 × 0.35) + (Uninsured ? 25 : 0) × 0.25
              const priority = Math.round(adjHazard * 0.4 + pmlShare * 100 * 0.35 + (a.insured ? 0 : 25) * 0.25);
              const tier = priority > 60 ? 'Critical' : priority > 35 ? 'High' : 'Medium';
              const tierColor = tier === 'Critical' ? T.red : tier === 'High' ? T.orange : T.amber;
              return (
                <div key={a.id} style={{ display: 'flex', gap: 16, alignItems: 'center',
                  padding: '10px 14px', marginBottom: 8, borderRadius: 8, background: T.bg, border: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: T.gray, minWidth: 28, textAlign: 'center' }}>#{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 2 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>{a.name}</span>
                      <span style={{ padding: '1px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700,
                        background: tier === 'Critical' ? '#fef2f2' : tier === 'High' ? '#fff7ed' : '#fffbeb',
                        color: tierColor }}>{tier}</span>
                      {!a.insured && <span style={{ padding: '1px 8px', borderRadius: 10, fontSize: 10, background: '#fef2f2', color: T.red }}>Uninsured</span>}
                    </div>
                    <div style={{ fontSize: 11, color: T.gray }}>{a.region} · {a.assetClass} · {fmt(a.value)}</div>
                  </div>
                  <div style={{ textAlign: 'center', minWidth: 60 }}>
                    <div style={{ fontSize: 11, color: T.gray }}>Hazard</div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: adjHazard > 65 ? T.red : T.amber }}>{adjHazard}</div>
                  </div>
                  <div style={{ textAlign: 'center', minWidth: 70 }}>
                    <div style={{ fontSize: 11, color: T.gray }}>PML 100yr</div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: T.navy, fontSize: 12 }}>{fmt(Math.round(a.pml100 * mult))}</div>
                  </div>
                  <div style={{ textAlign: 'center', minWidth: 80 }}>
                    <div style={{ fontSize: 11, color: T.gray, marginBottom: 2 }}>Priority Score</div>
                    <div style={{ fontSize: 20, fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, color: tierColor }}>{priority}</div>
                    <div style={{ height: 4, background: '#fff', borderRadius: 2, width: 60 }}>
                      <div style={{ width: `${Math.min(100, priority)}%`, height: '100%', background: tierColor, borderRadius: 2 }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
