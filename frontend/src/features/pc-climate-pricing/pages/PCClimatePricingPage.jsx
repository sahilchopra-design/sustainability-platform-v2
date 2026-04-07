import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, ComposedChart, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', text: '#1a1a2e',
  sub: '#f6f4f0', muted: '#6b7280', indigo: '#4f46e5', gold: '#b8860b',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706',
  navy: '#1e3a5f', teal: '#0f766e', purple: '#7c3aed', orange: '#ea580c',
};

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const PERILS = [
  { id: 'flood',    name: 'Flood',         baseRate: 0.0035, climateLoading: sr(0) * 0.002 + 0.001, returnPeriod: 100, lossRatio: sr(0) * 0.25 + 0.55, color: '#0369a1' },
  { id: 'wildfire', name: 'Wildfire',       baseRate: 0.0028, climateLoading: sr(1) * 0.003 + 0.002, returnPeriod: 50,  lossRatio: sr(1) * 0.20 + 0.60, color: '#dc2626' },
  { id: 'wind',     name: 'Tropical Wind',  baseRate: 0.0045, climateLoading: sr(2) * 0.001 + 0.0005,returnPeriod: 200, lossRatio: sr(2) * 0.22 + 0.52, color: '#7c3aed' },
  { id: 'drought',  name: 'Drought',        baseRate: 0.0018, climateLoading: sr(3) * 0.0015 + 0.0008,returnPeriod: 25, lossRatio: sr(3) * 0.18 + 0.48, color: '#d97706' },
  { id: 'hail',     name: 'Hail',           baseRate: 0.0022, climateLoading: sr(4) * 0.001 + 0.0003, returnPeriod: 30, lossRatio: sr(4) * 0.15 + 0.50, color: '#0f766e' },
  { id: 'slr',      name: 'Sea Level Rise', baseRate: 0.0012, climateLoading: sr(5) * 0.002 + 0.0015, returnPeriod: 500,lossRatio: sr(5) * 0.30 + 0.65, color: '#1e3a5f' },
];

const SCENARIO_MULTS = { '1.5°C': 1.0, '2°C': 1.18, '3°C': 1.42, '4°C': 1.78 };
const SCENARIOS = Object.keys(SCENARIO_MULTS);

const ZONES = Array.from({ length: 30 }, (_, i) => {
  const peril = PERILS[i % 6];
  return {
    name: 'Zone ' + String.fromCharCode(65 + i),
    exposureUSD: sr(i * 13) * 500 + 50,
    predominantPeril: peril.id,
    perilColor: peril.color,
    latitude: sr(i * 17) * 60 - 10,
    riskScore: sr(i * 23) * 70 + 15,
    premiumRate: peril.baseRate + peril.climateLoading * sr(i * 29),
    adequacyRatio: sr(i * 31) * 0.4 + 0.7,
    climateScenario: SCENARIOS[Math.floor(sr(i * 37) * 4)],
  };
});

const TABS = [
  'Pricing Dashboard',
  'Peril Rate Analysis',
  'Zone Concentration',
  'Scenario Rate Stress',
  'Portfolio Rate Adequacy',
];

const kpiCard = (label, value, sub, color = T.indigo) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px', flex: 1, minWidth: 160 }}>
    <div style={{ fontSize: 11, fontWeight: 600, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color, fontFamily: "'JetBrains Mono', monospace" }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>{sub}</div>}
  </div>
);

const sectionTitle = title => (
  <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14, borderLeft: `3px solid ${T.indigo}`, paddingLeft: 10 }}>{title}</div>
);

const adequacyColor = ratio => ratio >= 0.95 ? T.green : ratio >= 0.80 ? T.amber : T.red;
const adequacyLabel = ratio => ratio >= 0.95 ? 'Adequate' : ratio >= 0.80 ? 'Near-Adequate' : 'Inadequate';

export default function PCClimatePricingPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedPerilFilter, setSelectedPerilFilter] = useState('all');
  const [selectedScenario, setSelectedScenario] = useState('2°C');
  const [selectedPerilStress, setSelectedPerilStress] = useState(0);

  const filteredZones = useMemo(() =>
    selectedPerilFilter === 'all' ? ZONES : ZONES.filter(z => z.predominantPeril === selectedPerilFilter),
    [selectedPerilFilter]
  );

  const kpis = useMemo(() => {
    if (!ZONES.length) return { totalExposure: 0, avgAdequacy: 0, pctInadequate: 0, avgClimateLoading: 0 };
    const totalExposure = ZONES.reduce((s, z) => s + z.exposureUSD, 0);
    const totalWeightedAdequacy = ZONES.reduce((s, z) => s + z.adequacyRatio * z.exposureUSD, 0);
    const avgAdequacy = totalExposure > 0 ? totalWeightedAdequacy / totalExposure : 0;
    const pctInadequate = ZONES.length ? (ZONES.filter(z => z.adequacyRatio < 0.80).length / ZONES.length) * 100 : 0;
    const avgClimateLoading = PERILS.length ? PERILS.reduce((s, p) => s + p.climateLoading, 0) / PERILS.length : 0;
    return { totalExposure, avgAdequacy, pctInadequate, avgClimateLoading };
  }, []);

  const sortedZonesByAdequacy = useMemo(() =>
    [...filteredZones].sort((a, b) => a.adequacyRatio - b.adequacyRatio).slice(0, 20),
    [filteredZones]
  );

  const perilRateData = useMemo(() => {
    const mult = SCENARIO_MULTS[selectedScenario];
    return PERILS.map(p => ({
      name: p.name,
      baseRate: p.baseRate * 10000,
      climateLoading: p.climateLoading * 10000,
      adjustedRate: (p.baseRate + p.climateLoading) * mult * 10000,
      lossRatio: p.lossRatio * 100,
      returnPeriod: p.returnPeriod,
      rateChangePct: ((p.climateLoading / p.baseRate) * 100).toFixed(1),
      color: p.color,
    }));
  }, [selectedScenario]);

  const scatterData = useMemo(() =>
    ZONES.map(z => ({
      name: z.name,
      riskScore: z.riskScore,
      adequacyRatio: z.adequacyRatio,
      exposureUSD: z.exposureUSD,
      predominantPeril: z.predominantPeril,
      color: z.perilColor,
    })),
    []
  );

  const underPricedZones = useMemo(() =>
    [...ZONES].filter(z => z.adequacyRatio < 0.85).sort((a, b) => a.adequacyRatio - b.adequacyRatio).slice(0, 10),
    []
  );

  const stressPeril = PERILS[selectedPerilStress];
  const stressData = useMemo(() => {
    return SCENARIOS.map(scen => {
      const mult = SCENARIO_MULTS[scen];
      const p = stressPeril;
      const technicalRate = (p.baseRate + p.climateLoading) * mult;
      const breakEven = technicalRate / 0.95;
      return {
        scenario: scen,
        baseRate: p.baseRate * 10000,
        climateLoading: p.climateLoading * mult * 10000,
        technicalRate: technicalRate * 10000,
        breakEven: breakEven * 10000,
        rateChangePct: ((mult - 1) * 100).toFixed(1),
      };
    });
  }, [selectedPerilStress, stressPeril]);

  const adequacyCategoryData = useMemo(() => {
    const adequate = ZONES.filter(z => z.adequacyRatio >= 0.95);
    const nearAdequate = ZONES.filter(z => z.adequacyRatio >= 0.80 && z.adequacyRatio < 0.95);
    const inadequate = ZONES.filter(z => z.adequacyRatio < 0.80);
    const totalExp = ZONES.reduce((s, z) => s + z.exposureUSD, 0);
    return [
      { name: 'Adequate (≥0.95)', count: adequate.length, exposure: adequate.reduce((s, z) => s + z.exposureUSD, 0), fill: T.green },
      { name: 'Near-Adequate (0.80-0.94)', count: nearAdequate.length, exposure: nearAdequate.reduce((s, z) => s + z.exposureUSD, 0), fill: T.amber },
      { name: 'Inadequate (<0.80)', count: inadequate.length, exposure: inadequate.reduce((s, z) => s + z.exposureUSD, 0), fill: T.red },
    ].map(d => ({ ...d, pct: totalExp > 0 ? (d.exposure / totalExp * 100).toFixed(1) : '0.0' }));
  }, []);

  const premiumGapTable = useMemo(() =>
    [...ZONES]
      .map(z => ({ ...z, gapUSD: z.exposureUSD * (1 - z.adequacyRatio) }))
      .sort((a, b) => b.gapUSD - a.gapUSD)
      .slice(0, 15),
    []
  );

  const cumulativeSufficiency = useMemo(() => {
    const sorted = [...ZONES].sort((a, b) => b.exposureUSD - a.exposureUSD);
    let cumExp = 0;
    let cumPrem = 0;
    const total = sorted.reduce((s, z) => s + z.exposureUSD, 0);
    return sorted.map((z, i) => {
      cumExp += z.exposureUSD;
      cumPrem += z.exposureUSD * z.premiumRate * z.adequacyRatio;
      return {
        zone: z.name,
        rank: i + 1,
        cumExposurePct: total > 0 ? (cumExp / total) * 100 : 0,
        cumPremiumRate: cumExp > 0 ? (cumPrem / cumExp) * 10000 : 0,
      };
    });
  }, []);

  const tabStyle = i => ({
    padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
    background: 'none', border: 'none',
    borderBottom: activeTab === i ? `2px solid ${T.indigo}` : '2px solid transparent',
    color: activeTab === i ? T.indigo : T.muted,
    whiteSpace: 'nowrap',
  });

  const selectStyle = {
    background: T.card, border: `1px solid ${T.border}`, borderRadius: 6,
    padding: '6px 10px', fontSize: 12, color: T.text, cursor: 'pointer',
  };

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: "'DM Sans', system-ui, sans-serif", color: T.text }}>
      {/* Header */}
      <div style={{ background: T.navy, padding: '20px 28px', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <span style={{ background: T.gold, color: T.navy, fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 4, letterSpacing: '0.1em' }}>EP-DC2</span>
          <span style={{ color: '#94a3b8', fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>pc-climate-pricing</span>
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#ffffff' }}>P&amp;C Climate Pricing Engine</div>
        <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>Climate-adjusted technical rates · Rate adequacy scoring · NFIP/Lloyd's loading methodology · 6 peril lines</div>
      </div>

      {/* Tab Bar */}
      <div style={{ background: T.card, borderBottom: `1px solid ${T.border}`, display: 'flex', gap: 0, padding: '0 28px', overflowX: 'auto' }}>
        {TABS.map((t, i) => (
          <button key={t} style={tabStyle(i)} onClick={() => setActiveTab(i)}>{t}</button>
        ))}
      </div>

      <div style={{ padding: '24px 28px', maxWidth: 1400 }}>

        {/* TAB 0: PRICING DASHBOARD */}
        {activeTab === 0 && (
          <div>
            <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
              {kpiCard('Total Insured Exposure', `$${(kpis.totalExposure / 1000).toFixed(1)}B`, '30 zones, 6 peril lines', T.navy)}
              {kpiCard('Avg Adequacy Ratio', kpis.avgAdequacy.toFixed(3), 'exposure-weighted across all zones', adequacyColor(kpis.avgAdequacy))}
              {kpiCard('Inadequate Zones (<0.80)', `${kpis.pctInadequate.toFixed(0)}%`, `${ZONES.filter(z => z.adequacyRatio < 0.80).length} of 30 zones under-priced`, T.red)}
              {kpiCard('Avg Climate Loading', `${(kpis.avgClimateLoading * 10000).toFixed(1)}bps`, 'basis points above base technical rate', T.amber)}
            </div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 12, color: T.muted, fontWeight: 600 }}>Filter by Peril:</div>
              <button onClick={() => setSelectedPerilFilter('all')} style={{
                padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: selectedPerilFilter === 'all' ? T.navy : T.sub,
                color: selectedPerilFilter === 'all' ? '#fff' : T.muted,
                border: `1px solid ${selectedPerilFilter === 'all' ? T.navy : T.border}`,
              }}>All Perils</button>
              {PERILS.map(p => (
                <button key={p.id} onClick={() => setSelectedPerilFilter(p.id)} style={{
                  padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  background: selectedPerilFilter === p.id ? p.color : T.sub,
                  color: selectedPerilFilter === p.id ? '#fff' : T.muted,
                  border: `1px solid ${selectedPerilFilter === p.id ? p.color : T.border}`,
                }}>{p.name}</button>
              ))}
            </div>

            {sectionTitle(`Adequacy Ratio by Zone (Top 20 by Under-pricing) — ${selectedPerilFilter === 'all' ? 'All Perils' : PERILS.find(p => p.id === selectedPerilFilter)?.name}`)}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 0 8px', marginBottom: 20 }}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sortedZonesByAdequacy} margin={{ left: 10, right: 20, top: 4, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.muted }} angle={-35} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 11, fill: T.muted }} domain={[0.5, 1.2]} tickFormatter={v => v.toFixed(2)} />
                  <Tooltip formatter={(v, n) => [v.toFixed(3), n]} />
                  <ReferenceLine y={0.95} stroke={T.green} strokeDasharray="4 4" label={{ value: 'Adequate', fill: T.green, fontSize: 10, position: 'right' }} />
                  <ReferenceLine y={0.80} stroke={T.red} strokeDasharray="4 4" label={{ value: 'Inadequate', fill: T.red, fontSize: 10, position: 'right' }} />
                  <Bar dataKey="adequacyRatio" name="Adequacy Ratio" radius={[3, 3, 0, 0]}>
                    {sortedZonesByAdequacy.map((z, i) => (
                      <Cell key={i} fill={adequacyColor(z.adequacyRatio)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', paddingTop: 8, flexWrap: 'wrap' }}>
                {[['Adequate (≥0.95)', T.green], ['Near-Adequate (0.80–0.94)', T.amber], ['Inadequate (<0.80)', T.red]].map(([l, c]) => (
                  <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: T.muted }}>
                    <div style={{ width: 12, height: 12, borderRadius: 2, background: c }} />{l}
                  </div>
                ))}
              </div>
            </div>

            {sectionTitle('Zone Summary Table')}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Zone','Exposure ($M)','Predominant Peril','Risk Score','Premium Rate (bps)','Adequacy Ratio','Status','Scenario'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: T.navy, borderBottom: `1px solid ${T.border}`, fontSize: 11, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedZonesByAdequacy.map((z, i) => (
                    <tr key={z.name} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '8px 14px', fontWeight: 600, color: T.navy }}>{z.name}</td>
                      <td style={{ padding: '8px 14px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>${z.exposureUSD.toFixed(1)}M</td>
                      <td style={{ padding: '8px 14px' }}>
                        <span style={{ background: z.perilColor + '20', color: z.perilColor, padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>
                          {PERILS.find(p => p.id === z.predominantPeril)?.name}
                        </span>
                      </td>
                      <td style={{ padding: '8px 14px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{z.riskScore.toFixed(0)}</td>
                      <td style={{ padding: '8px 14px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{(z.premiumRate * 10000).toFixed(1)}</td>
                      <td style={{ padding: '8px 14px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: adequacyColor(z.adequacyRatio), fontWeight: 700 }}>{z.adequacyRatio.toFixed(3)}</td>
                      <td style={{ padding: '8px 14px' }}>
                        <span style={{ background: adequacyColor(z.adequacyRatio), color: '#fff', borderRadius: 4, padding: '2px 8px', fontSize: 10, fontWeight: 700 }}>{adequacyLabel(z.adequacyRatio)}</span>
                      </td>
                      <td style={{ padding: '8px 14px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{z.climateScenario}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 1: PERIL RATE ANALYSIS */}
        {activeTab === 1 && (
          <div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: T.muted, fontWeight: 600 }}>Climate Scenario:</div>
              {SCENARIOS.map(s => (
                <button key={s} onClick={() => setSelectedScenario(s)} style={{
                  padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  background: selectedScenario === s ? T.indigo : T.sub,
                  color: selectedScenario === s ? '#fff' : T.muted,
                  border: `1px solid ${selectedScenario === s ? T.indigo : T.border}`,
                }}>{s}</button>
              ))}
            </div>
            {sectionTitle(`Peril Rate Components under ${selectedScenario} Scenario (basis points)`)}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 0 8px', marginBottom: 20 }}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={perilRateData} margin={{ left: 10, right: 20, top: 4, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: T.muted }} />
                  <YAxis tick={{ fontSize: 11, fill: T.muted }} tickFormatter={v => `${v.toFixed(0)}bps`} />
                  <Tooltip formatter={(v, n) => [`${v.toFixed(1)} bps`, n]} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="baseRate" name="Base Rate" fill={T.navy} stackId="a" />
                  <Bar dataKey="climateLoading" name="Climate Loading" fill={T.orange} stackId="a" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {sectionTitle('Peril Parameters Table')}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'auto', marginBottom: 20 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Peril','Base Rate (bps)','Climate Loading (bps)','Adjusted Rate (bps)','Loss Ratio','Return Period (yrs)','Climate Rate Change %'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: T.navy, borderBottom: `1px solid ${T.border}`, fontSize: 11, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {perilRateData.map((p, i) => (
                    <tr key={p.name} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '8px 14px' }}>
                        <span style={{ background: p.color + '20', color: p.color, padding: '2px 10px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>{p.name}</span>
                      </td>
                      <td style={{ padding: '8px 14px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{p.baseRate.toFixed(1)}</td>
                      <td style={{ padding: '8px 14px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: T.orange }}>{p.climateLoading.toFixed(1)}</td>
                      <td style={{ padding: '8px 14px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: T.indigo, fontWeight: 700 }}>{p.adjustedRate.toFixed(1)}</td>
                      <td style={{ padding: '8px 14px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: p.lossRatio > 80 ? T.red : T.amber }}>{p.lossRatio.toFixed(1)}%</td>
                      <td style={{ padding: '8px 14px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{p.returnPeriod}</td>
                      <td style={{ padding: '8px 14px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: T.red }}>+{p.rateChangePct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {sectionTitle('Loss Ratio by Peril')}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 0 8px' }}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={perilRateData} margin={{ left: 10, right: 20, top: 4, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: T.muted }} />
                  <YAxis tick={{ fontSize: 11, fill: T.muted }} tickFormatter={v => `${v.toFixed(0)}%`} domain={[0, 110]} />
                  <Tooltip formatter={v => [`${v.toFixed(1)}%`, 'Loss Ratio']} />
                  <ReferenceLine y={100} stroke={T.red} strokeDasharray="4 4" label={{ value: 'Break-even', fill: T.red, fontSize: 10, position: 'right' }} />
                  <Bar dataKey="lossRatio" name="Loss Ratio" radius={[3, 3, 0, 0]}>
                    {perilRateData.map((p, i) => <Cell key={i} fill={p.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* TAB 2: ZONE CONCENTRATION */}
        {activeTab === 2 && (
          <div>
            {sectionTitle('Risk Score vs Adequacy Ratio (bubble = exposure $M)')}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 0 8px', marginBottom: 20 }}>
              <ResponsiveContainer width="100%" height={350}>
                <ScatterChart margin={{ left: 20, right: 20, top: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="riskScore" name="Risk Score" tick={{ fontSize: 11, fill: T.muted }} label={{ value: 'Risk Score', position: 'insideBottom', offset: -10, fill: T.muted, fontSize: 11 }} />
                  <YAxis dataKey="adequacyRatio" name="Adequacy Ratio" tick={{ fontSize: 11, fill: T.muted }} domain={[0.5, 1.3]} tickFormatter={v => v.toFixed(2)} label={{ value: 'Adequacy Ratio', angle: -90, position: 'insideLeft', fill: T.muted, fontSize: 11 }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ payload }) => {
                    if (!payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: '10px 14px', fontSize: 11 }}>
                        <div style={{ fontWeight: 700, color: T.navy, marginBottom: 4 }}>{d.name}</div>
                        <div>Risk Score: <b>{d.riskScore.toFixed(1)}</b></div>
                        <div>Adequacy: <b style={{ color: adequacyColor(d.adequacyRatio) }}>{d.adequacyRatio.toFixed(3)}</b></div>
                        <div>Exposure: <b>${d.exposureUSD.toFixed(1)}M</b></div>
                        <div>Peril: <b style={{ color: d.color }}>{PERILS.find(p => p.id === d.predominantPeril)?.name}</b></div>
                      </div>
                    );
                  }} />
                  <ReferenceLine y={0.95} stroke={T.green} strokeDasharray="4 4" />
                  <ReferenceLine y={0.80} stroke={T.red} strokeDasharray="4 4" />
                  {PERILS.map(p => {
                    const zones = scatterData.filter(z => z.predominantPeril === p.id);
                    return (
                      <Scatter key={p.id} name={p.name} data={zones} fill={p.color} opacity={0.75}>
                        {zones.map((z, i) => (
                          <Cell key={i} fill={p.color} r={Math.sqrt(z.exposureUSD) * 0.6} />
                        ))}
                      </Scatter>
                    );
                  })}
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            {sectionTitle('Top 10 Under-Priced Zones (Adequacy < 0.85)')}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Zone','Exposure ($M)','Predominant Peril','Risk Score','Premium Rate (bps)','Adequacy Ratio','Premium Gap ($M)'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: T.navy, borderBottom: `1px solid ${T.border}`, fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {underPricedZones.map((z, i) => {
                    const techRate = PERILS.find(p => p.id === z.predominantPeril);
                    const gapUSD = z.exposureUSD * (1 - z.adequacyRatio);
                    return (
                      <tr key={z.name} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                        <td style={{ padding: '8px 14px', fontWeight: 600, color: T.navy }}>{z.name}</td>
                        <td style={{ padding: '8px 14px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>${z.exposureUSD.toFixed(1)}M</td>
                        <td style={{ padding: '8px 14px' }}>
                          <span style={{ background: z.perilColor + '20', color: z.perilColor, padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>
                            {PERILS.find(p => p.id === z.predominantPeril)?.name}
                          </span>
                        </td>
                        <td style={{ padding: '8px 14px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{z.riskScore.toFixed(0)}</td>
                        <td style={{ padding: '8px 14px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{(z.premiumRate * 10000).toFixed(1)}</td>
                        <td style={{ padding: '8px 14px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: T.red, fontWeight: 700 }}>{z.adequacyRatio.toFixed(3)}</td>
                        <td style={{ padding: '8px 14px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: T.red, fontWeight: 700 }}>${gapUSD.toFixed(1)}M</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: SCENARIO RATE STRESS */}
        {activeTab === 3 && (
          <div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: T.muted, fontWeight: 600 }}>Peril:</div>
              {PERILS.map((p, i) => (
                <button key={p.id} onClick={() => setSelectedPerilStress(i)} style={{
                  padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  background: selectedPerilStress === i ? p.color : T.sub,
                  color: selectedPerilStress === i ? '#fff' : T.muted,
                  border: `1px solid ${selectedPerilStress === i ? p.color : T.border}`,
                }}>{p.name}</button>
              ))}
            </div>
            {sectionTitle(`Rate Stress — ${stressPeril.name} across Climate Scenarios`)}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 0 8px', marginBottom: 20 }}>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={stressData} margin={{ left: 10, right: 20, top: 4, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="scenario" tick={{ fontSize: 12, fill: T.muted }} />
                  <YAxis tick={{ fontSize: 11, fill: T.muted }} tickFormatter={v => `${v.toFixed(0)}bps`} />
                  <Tooltip formatter={(v, n) => [`${v.toFixed(1)} bps`, n]} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="baseRate" name="Base Rate" fill={T.navy} stackId="a" />
                  <Bar dataKey="climateLoading" name="Climate Loading" fill={stressPeril.color} stackId="a" radius={[3, 3, 0, 0]} />
                  <Line type="monotone" dataKey="breakEven" name="Break-Even Rate" stroke={T.red} strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4, fill: T.red }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            {sectionTitle('Rate Change Table & Break-Even Analysis')}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'auto', marginBottom: 20 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Scenario','Scenario Mult','Base Rate (bps)','Climate Loading (bps)','Technical Rate (bps)','Break-Even Rate (bps)','Rate Change vs 1.5°C'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: T.navy, borderBottom: `1px solid ${T.border}`, fontSize: 11, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stressData.map((row, i) => (
                    <tr key={row.scenario} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '8px 14px', fontWeight: 700, color: T.navy }}>{row.scenario}</td>
                      <td style={{ padding: '8px 14px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{SCENARIO_MULTS[row.scenario].toFixed(2)}×</td>
                      <td style={{ padding: '8px 14px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{row.baseRate.toFixed(1)}</td>
                      <td style={{ padding: '8px 14px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: stressPeril.color }}>{row.climateLoading.toFixed(1)}</td>
                      <td style={{ padding: '8px 14px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: T.indigo, fontWeight: 700 }}>{row.technicalRate.toFixed(1)}</td>
                      <td style={{ padding: '8px 14px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: T.red }}>{row.breakEven.toFixed(1)}</td>
                      <td style={{ padding: '8px 14px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: i === 0 ? T.muted : T.red }}>
                        {i === 0 ? '—' : `+${row.rateChangePct}%`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              {stressData.map(row => (
                <div key={row.scenario} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 18px', flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 6 }}>{row.scenario} Scenario</div>
                  <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: T.indigo }}>{row.technicalRate.toFixed(1)} bps</div>
                  <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>technical rate</div>
                  <div style={{ fontSize: 14, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: T.red, marginTop: 8 }}>{row.breakEven.toFixed(1)} bps</div>
                  <div style={{ fontSize: 11, color: T.muted }}>break-even (adequate)</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: PORTFOLIO RATE ADEQUACY */}
        {activeTab === 4 && (
          <div>
            <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
              {adequacyCategoryData.map(cat => kpiCard(cat.name, `${cat.count} zones`, `$${(cat.exposure / 1000).toFixed(1)}B — ${cat.pct}% of exposure`, cat.fill))}
            </div>
            {sectionTitle('Portfolio Adequacy Composition by Exposure')}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 0 8px', marginBottom: 20 }}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={adequacyCategoryData} layout="vertical" margin={{ left: 200, right: 60, top: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: T.muted }} tickFormatter={v => `$${(v / 1000).toFixed(1)}B`} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: T.muted }} width={190} />
                  <Tooltip formatter={v => [`$${(v / 1000).toFixed(1)}B`, 'Exposure']} />
                  <Bar dataKey="exposure" name="Exposure ($M)" radius={[0, 4, 4, 0]}>
                    {adequacyCategoryData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {sectionTitle('Largest Exposure Premium Adequacy Gap (Top 15 zones by $M gap)')}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'auto', marginBottom: 20 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Zone','Exposure ($M)','Peril','Adequacy Ratio','Status','Premium Gap ($M)','Gap %'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: T.navy, borderBottom: `1px solid ${T.border}`, fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {premiumGapTable.map((z, i) => (
                    <tr key={z.name} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '8px 14px', fontWeight: 600, color: T.navy }}>{z.name}</td>
                      <td style={{ padding: '8px 14px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>${z.exposureUSD.toFixed(1)}M</td>
                      <td style={{ padding: '8px 14px' }}>
                        <span style={{ background: z.perilColor + '20', color: z.perilColor, padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>
                          {PERILS.find(p => p.id === z.predominantPeril)?.name}
                        </span>
                      </td>
                      <td style={{ padding: '8px 14px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: adequacyColor(z.adequacyRatio), fontWeight: 700 }}>{z.adequacyRatio.toFixed(3)}</td>
                      <td style={{ padding: '8px 14px' }}>
                        <span style={{ background: adequacyColor(z.adequacyRatio), color: '#fff', borderRadius: 4, padding: '2px 8px', fontSize: 10, fontWeight: 700 }}>{adequacyLabel(z.adequacyRatio)}</span>
                      </td>
                      <td style={{ padding: '8px 14px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: T.red, fontWeight: 700 }}>${z.gapUSD.toFixed(1)}M</td>
                      <td style={{ padding: '8px 14px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: T.amber }}>{((1 - z.adequacyRatio) * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {sectionTitle('Cumulative Premium Rate by Exposure Concentration')}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 0 8px' }}>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={cumulativeSufficiency} margin={{ left: 10, right: 20, top: 4, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="cumExposurePct" tick={{ fontSize: 10, fill: T.muted }} tickFormatter={v => `${v.toFixed(0)}%`} label={{ value: 'Cumulative Exposure %', position: 'insideBottom', offset: -12, fill: T.muted, fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11, fill: T.muted }} tickFormatter={v => `${v.toFixed(1)}bps`} />
                  <Tooltip formatter={(v, n) => [`${v.toFixed(2)} bps`, n]} labelFormatter={v => `Exposure: ${Number(v).toFixed(1)}%`} />
                  <Line type="monotone" dataKey="cumPremiumRate" name="Cum. Avg Premium Rate" stroke={T.indigo} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
