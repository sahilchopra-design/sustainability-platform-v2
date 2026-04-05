import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, Legend, ReferenceLine, PieChart, Pie
} from 'recharts';

const T = {
  bg: '#f6f4f0', surface: '#ffffff', border: '#e5e0d8', navy: '#1b3a5c',
  navyL: '#2c5a8c', gold: '#c5a96a', textSec: '#5c6b7e', textMut: '#9aa3ae',
  red: '#dc2626', green: '#16a34a', amber: '#d97706', blue: '#2563eb',
  orange: '#ea580c', purple: '#7c3aed', teal: '#0891b2', sage: '#5a8a6a',
  font: "'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono: "'JetBrains Mono','SF Mono','Fira Code',monospace"
};

// ─── Nature-Based Solutions (NbS) for Adaptation ─────────────────────────
const NBS_SOLUTIONS = [
  {
    id: 'NbS-01', name: 'Mangrove Restoration', ecosystem: 'Coastal',
    hazard: 'Storm Surge / Coastal Flood', area_ha: 12500,
    protection_value_m: 420, carbon_value_m: 85, biodiversity_score: 92, community_jobs: 1850,
    cost_per_ha: 8500, total_cost_m: 106, bcr: 4.76,
    co_benefits: { carbon_tco2: 62500, biodiversity: 92, fisheries_m: 28, tourism_m: 15, water_quality: 78 },
    surge_reduction_pct: 65, wave_attenuation_pct: 70,
    timeline: '5–15 years', maturity: 'Proven', region: 'Southeast Asia',
    sdgs: [13, 14, 15, 1, 8],
  },
  {
    id: 'NbS-02', name: 'Urban Green Infrastructure', ecosystem: 'Urban',
    hazard: 'Heat Island / Urban Flood', area_ha: 800,
    protection_value_m: 180, carbon_value_m: 12, biodiversity_score: 55, community_jobs: 920,
    cost_per_ha: 45000, total_cost_m: 36, bcr: 5.33,
    co_benefits: { carbon_tco2: 4800, biodiversity: 55, health_m: 42, property_premium_m: 68, air_quality: 72 },
    surge_reduction_pct: 0, wave_attenuation_pct: 0,
    timeline: '2–5 years', maturity: 'Proven', region: 'Europe',
    sdgs: [11, 13, 3, 15],
  },
  {
    id: 'NbS-03', name: 'Floodplain Reconnection', ecosystem: 'Freshwater',
    hazard: 'River Flood', area_ha: 5200,
    protection_value_m: 290, carbon_value_m: 35, biodiversity_score: 85, community_jobs: 420,
    cost_per_ha: 6200, total_cost_m: 32, bcr: 10.16,
    co_benefits: { carbon_tco2: 26000, biodiversity: 85, fisheries_m: 8, recreation_m: 12, water_quality: 88 },
    surge_reduction_pct: 0, wave_attenuation_pct: 0,
    timeline: '3–8 years', maturity: 'Scaling', region: 'Western Europe',
    sdgs: [6, 13, 15, 11],
  },
  {
    id: 'NbS-04', name: 'Coral Reef Rehabilitation', ecosystem: 'Marine',
    hazard: 'Wave Erosion / Storm Surge', area_ha: 3800,
    protection_value_m: 350, carbon_value_m: 5, biodiversity_score: 98, community_jobs: 2200,
    cost_per_ha: 12000, total_cost_m: 46, bcr: 7.72,
    co_benefits: { carbon_tco2: 2300, biodiversity: 98, fisheries_m: 45, tourism_m: 82, coastal_prot: 90 },
    surge_reduction_pct: 0, wave_attenuation_pct: 85,
    timeline: '5–20 years', maturity: 'Scaling', region: 'Pacific Islands',
    sdgs: [14, 13, 1, 8, 15],
  },
  {
    id: 'NbS-05', name: 'Agroforestry & Windbreaks', ecosystem: 'Agricultural',
    hazard: 'Drought / Soil Erosion / Wind', area_ha: 18000,
    protection_value_m: 220, carbon_value_m: 120, biodiversity_score: 72, community_jobs: 3400,
    cost_per_ha: 3200, total_cost_m: 58, bcr: 5.86,
    co_benefits: { carbon_tco2: 108000, biodiversity: 72, crop_yield_m: 35, soil_health: 82, water_retention: 75 },
    surge_reduction_pct: 0, wave_attenuation_pct: 0,
    timeline: '3–10 years', maturity: 'Proven', region: 'Sub-Saharan Africa',
    sdgs: [2, 13, 15, 1, 8],
  },
  {
    id: 'NbS-06', name: 'Peatland Rewetting', ecosystem: 'Wetland',
    hazard: 'Wildfire / Carbon Loss', area_ha: 8500,
    protection_value_m: 140, carbon_value_m: 195, biodiversity_score: 78, community_jobs: 280,
    cost_per_ha: 2800, total_cost_m: 24, bcr: 13.96,
    co_benefits: { carbon_tco2: 255000, biodiversity: 78, water_filtration_m: 18, flood_buffer_m: 25, air_quality: 65 },
    surge_reduction_pct: 0, wave_attenuation_pct: 0,
    timeline: '2–5 years', maturity: 'Scaling', region: 'Northern Europe',
    sdgs: [13, 15, 6, 11],
  },
];

const ECOSYSTEM_VALUES = [
  { ecosystem: 'Mangrove', value_per_ha: 33600, services: 'Coastal protection, Carbon, Fisheries, Tourism' },
  { ecosystem: 'Coral Reef', value_per_ha: 352000, services: 'Wave attenuation, Fisheries, Tourism, Biodiversity' },
  { ecosystem: 'Freshwater Wetland', value_per_ha: 25600, services: 'Flood buffer, Water filtration, Carbon, Biodiversity' },
  { ecosystem: 'Tropical Forest', value_per_ha: 5400, services: 'Carbon, Biodiversity, Water cycle, NTFPs' },
  { ecosystem: 'Peatland', value_per_ha: 14200, services: 'Carbon storage, Water regulation, Biodiversity' },
  { ecosystem: 'Seagrass', value_per_ha: 28900, services: 'Carbon, Coastal protection, Nursery habitat, Water quality' },
];

const SDG_COLORS = {
  1: '#E5243B', 2: '#DDA63A', 3: '#4C9F38', 6: '#26BDE2', 8: '#A21942',
  11: '#FD9D24', 13: '#3F7E44', 14: '#0A97D9', 15: '#56C02B',
};

const TABS = ['NbS Portfolio', 'Co-Benefit Valuation', 'Ecosystem Services', 'SDG Alignment', 'Investment Case'];

export default function NatureBasedAdaptationPage() {
  const [tab, setTab] = useState(0);
  const [selectedNbs, setSelectedNbs] = useState(NBS_SOLUTIONS[0]);

  const totalProtection = NBS_SOLUTIONS.reduce((s, n) => s + n.protection_value_m, 0);
  const totalCarbon = NBS_SOLUTIONS.reduce((s, n) => s + n.carbon_value_m, 0);
  const totalCost = NBS_SOLUTIONS.reduce((s, n) => s + n.total_cost_m, 0);
  const totalJobs = NBS_SOLUTIONS.reduce((s, n) => s + n.community_jobs, 0);
  const totalCarbonTons = NBS_SOLUTIONS.reduce((s, n) => s + n.co_benefits.carbon_tco2, 0);

  const radarData = selectedNbs ? [
    { axis: 'Protection', val: Math.min(100, selectedNbs.protection_value_m / 4.2) },
    { axis: 'Carbon', val: Math.min(100, selectedNbs.carbon_value_m / 2) },
    { axis: 'Biodiversity', val: selectedNbs.biodiversity_score },
    { axis: 'Community', val: Math.min(100, selectedNbs.community_jobs / 34) },
    { axis: 'BCR', val: Math.min(100, selectedNbs.bcr * 7) },
    { axis: 'Scalability', val: Math.min(100, selectedNbs.area_ha / 180) },
  ] : [];

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh' }}>
      <div style={{ background: T.navy, padding: '24px 32px 0', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ color: T.gold, fontFamily: T.mono, fontSize: 11, letterSpacing: 2, marginBottom: 4 }}>EP-CF3 · NATURE-BASED ADAPTATION</div>
            <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: 0 }}>Nature-Based Adaptation Solutions</h1>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>
              6 NbS Projects · Co-Benefit Valuation · Ecosystem Services · SDG Alignment · Investment Case
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 0 }}>
          {TABS.map((t2, i) => (
            <button key={i} onClick={() => setTab(i)} style={{
              padding: '10px 20px', border: 'none', background: 'transparent', cursor: 'pointer',
              color: tab === i ? T.gold : '#94a3b8', fontWeight: tab === i ? 700 : 400, fontSize: 13,
              borderBottom: tab === i ? `2px solid ${T.gold}` : '2px solid transparent'
            }}>{t2}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 32px 32px' }}>

        {/* ══ TAB 0: NbS Portfolio ══ */}
        {tab === 0 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Protection Value', value: `$${totalProtection}M`, sub: 'avoided physical losses', color: T.blue },
                { label: 'Carbon Value', value: `$${totalCarbon}M`, sub: `${(totalCarbonTons/1000).toFixed(0)}K tCO\u2082 sequestered`, color: T.green },
                { label: 'Total Investment', value: `$${totalCost}M`, sub: '6 NbS projects', color: T.navy },
                { label: 'Avg BCR', value: `${(NBS_SOLUTIONS.reduce((s, n) => s + n.bcr, 0) / NBS_SOLUTIONS.length).toFixed(1)}x`, sub: 'benefit-cost ratio', color: T.teal },
                { label: 'Community Jobs', value: totalJobs.toLocaleString(), sub: 'direct employment created', color: T.purple },
              ].map(k => (
                <div key={k.label} style={{ flex: 1, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 18px' }}>
                  <div style={{ fontFamily: T.mono, fontSize: 22, fontWeight: 700, color: k.color }}>{k.value}</div>
                  <div style={{ color: T.textSec, fontSize: 11, marginTop: 2 }}>{k.label}</div>
                  <div style={{ color: T.textMut, fontSize: 10, marginTop: 2 }}>{k.sub}</div>
                </div>
              ))}
            </div>

            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24 }}>
              <h3 style={{ color: T.navy, margin: '0 0 16px', fontSize: 15 }}>Nature-Based Solutions Portfolio</h3>
              <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: T.navy }}>
                    {['ID', 'Solution', 'Ecosystem', 'Hazard', 'Area (ha)', 'Protection $M', 'Carbon $M', 'Cost $M', 'BCR', 'Region'].map(h => (
                      <th key={h} style={{ padding: '8px', color: '#fff', textAlign: h === 'Solution' ? 'left' : 'center', fontSize: 10 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {NBS_SOLUTIONS.map((n, i) => (
                    <tr key={n.id} onClick={() => setSelectedNbs(n)} style={{
                      background: selectedNbs?.id === n.id ? T.gold + '11' : i % 2 === 0 ? T.bg : T.surface,
                      cursor: 'pointer', borderBottom: `1px solid ${T.border}`
                    }}>
                      <td style={{ padding: '8px', fontFamily: T.mono, color: T.gold, fontWeight: 700, textAlign: 'center' }}>{n.id}</td>
                      <td style={{ padding: '8px', fontWeight: 600, color: T.navy }}>{n.name}</td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <span style={{ background: T.green + '15', color: T.green, padding: '2px 6px', borderRadius: 4, fontSize: 9, fontWeight: 700 }}>{n.ecosystem}</span>
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center', color: T.textSec, fontSize: 10 }}>{n.hazard}</td>
                      <td style={{ padding: '8px', textAlign: 'center', fontFamily: T.mono }}>{n.area_ha.toLocaleString()}</td>
                      <td style={{ padding: '8px', textAlign: 'center', fontFamily: T.mono, color: T.blue }}>${n.protection_value_m}M</td>
                      <td style={{ padding: '8px', textAlign: 'center', fontFamily: T.mono, color: T.green }}>${n.carbon_value_m}M</td>
                      <td style={{ padding: '8px', textAlign: 'center', fontFamily: T.mono }}>${n.total_cost_m}M</td>
                      <td style={{ padding: '8px', textAlign: 'center', fontFamily: T.mono, fontWeight: 700, color: n.bcr >= 8 ? T.green : n.bcr >= 5 ? T.teal : T.amber }}>{n.bcr}x</td>
                      <td style={{ padding: '8px', textAlign: 'center', color: T.textSec, fontSize: 10 }}>{n.region}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══ TAB 1: Co-Benefit Valuation ══ */}
        {tab === 1 && selectedNbs && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 16, marginBottom: 16 }}>
              <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20 }}>
                <h3 style={{ color: T.navy, margin: '0 0 6px', fontSize: 14 }}>{selectedNbs.id} — {selectedNbs.name}</h3>
                <p style={{ color: T.textSec, fontSize: 11, margin: '0 0 14px' }}>{selectedNbs.ecosystem} · {selectedNbs.region}</p>
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke={T.border} />
                    <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                    <Radar dataKey="val" stroke={T.green} fill={T.green} fillOpacity={0.25} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20 }}>
                <h3 style={{ color: T.navy, margin: '0 0 14px', fontSize: 14 }}>Co-Benefits Breakdown</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {Object.entries(selectedNbs.co_benefits).map(([k, v]) => {
                    const labels = { carbon_tco2: 'Carbon Sequestration', biodiversity: 'Biodiversity Score', fisheries_m: 'Fisheries Value', tourism_m: 'Tourism Value', water_quality: 'Water Quality', health_m: 'Health Benefits', property_premium_m: 'Property Premium', air_quality: 'Air Quality', crop_yield_m: 'Crop Yield', soil_health: 'Soil Health', water_retention: 'Water Retention', water_filtration_m: 'Water Filtration', flood_buffer_m: 'Flood Buffer', recreation_m: 'Recreation', coastal_prot: 'Coastal Protection' };
                    const unit = k.endsWith('_m') ? `$${v}M` : k === 'carbon_tco2' ? `${(v/1000).toFixed(0)}K tCO\u2082` : `${v}/100`;
                    const isScore = !k.endsWith('_m') && k !== 'carbon_tco2';
                    return (
                      <div key={k} style={{ background: T.bg, padding: '10px 12px', borderRadius: 8, textAlign: 'center' }}>
                        <div style={{ fontFamily: T.mono, fontSize: 18, fontWeight: 700, color: isScore ? (v >= 80 ? T.green : v >= 60 ? T.teal : T.amber) : T.navy }}>{unit}</div>
                        <div style={{ fontSize: 10, color: T.textSec, marginTop: 4 }}>{labels[k] || k}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Co-benefit comparison across all NbS */}
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20 }}>
              <h3 style={{ color: T.navy, margin: '0 0 14px', fontSize: 14 }}>Biodiversity Score vs. Carbon Value — All NbS</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={NBS_SOLUTIONS}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="id" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="l" domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="r" orientation="right" domain={[0, 250]} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="l" dataKey="biodiversity_score" name="Biodiversity (0–100)" fill={T.green} opacity={0.8} radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="r" dataKey="carbon_value_m" name="Carbon Value ($M)" fill={T.teal} opacity={0.7} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ══ TAB 2: Ecosystem Services ══ */}
        {tab === 2 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24, marginBottom: 16 }}>
              <h3 style={{ color: T.navy, margin: '0 0 4px', fontSize: 15 }}>Ecosystem Service Valuation — $ per Hectare per Year</h3>
              <p style={{ color: T.textSec, fontSize: 12, margin: '0 0 16px' }}>Source: Costanza et al. (2014), de Groot et al. (2012), TEEB database · Values in 2024 USD</p>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={ECOSYSTEM_VALUES} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} />
                  <YAxis type="category" dataKey="ecosystem" tick={{ fontSize: 11 }} width={140} />
                  <Tooltip formatter={v => [`$${v.toLocaleString()}/ha/yr`, 'Service Value']} />
                  <Bar dataKey="value_per_ha" radius={[0, 6, 6, 0]}>
                    {ECOSYSTEM_VALUES.map((e, i) => <Cell key={i} fill={[T.teal, T.blue, T.green, T.sage, T.purple, T.navy][i]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Service breakdown table */}
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24 }}>
              <h3 style={{ color: T.navy, margin: '0 0 16px', fontSize: 14 }}>Ecosystem Services by Type</h3>
              <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.navy }}>
                    <th style={{ padding: '10px 14px', color: '#fff', textAlign: 'left' }}>Ecosystem</th>
                    <th style={{ padding: '10px 14px', color: '#fff', textAlign: 'center' }}>Value ($/ha/yr)</th>
                    <th style={{ padding: '10px 14px', color: '#fff', textAlign: 'left' }}>Key Services</th>
                  </tr>
                </thead>
                <tbody>
                  {ECOSYSTEM_VALUES.map((e, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? T.bg : T.surface, borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '10px 14px', fontWeight: 700, color: T.navy }}>{e.ecosystem}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'center', fontFamily: T.mono, fontWeight: 700, color: T.teal }}>${e.value_per_ha.toLocaleString()}</td>
                      <td style={{ padding: '10px 14px', color: T.textSec }}>{e.services}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ color: T.textSec, fontSize: 12, marginTop: 14 }}>
                <strong>Key insight:</strong> Coral reefs provide the highest per-hectare ecosystem service value ($352,000/ha/yr) driven by fisheries, tourism, and coastal protection. However, they are also the most climate-vulnerable ecosystem. Mangroves ($33,600/ha/yr) offer the best value-for-money in adaptation investment due to proven restoration techniques and multiple co-benefits.
              </p>
            </div>
          </div>
        )}

        {/* ══ TAB 3: SDG Alignment ══ */}
        {tab === 3 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24 }}>
              <h3 style={{ color: T.navy, margin: '0 0 16px', fontSize: 15 }}>SDG Contribution by NbS Solution</h3>
              {NBS_SOLUTIONS.map(n => (
                <div key={n.id} style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${T.border}` }}>
                  <span style={{ fontFamily: T.mono, color: T.gold, fontWeight: 700, width: 55 }}>{n.id}</span>
                  <span style={{ fontWeight: 600, color: T.navy, width: 200 }}>{n.name}</span>
                  <div style={{ display: 'flex', gap: 6, flex: 1 }}>
                    {n.sdgs.map(sdg => (
                      <span key={sdg} style={{
                        background: SDG_COLORS[sdg] || T.navy, color: '#fff', width: 32, height: 32,
                        borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700
                      }}>{sdg}</span>
                    ))}
                  </div>
                  <span style={{ fontFamily: T.mono, color: T.teal, fontWeight: 700, width: 50, textAlign: 'right' }}>{n.sdgs.length} SDGs</span>
                </div>
              ))}

              <div style={{ marginTop: 20, padding: 16, background: T.bg, borderRadius: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 8 }}>SDG Coverage Summary</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {Object.entries(
                    NBS_SOLUTIONS.flatMap(n => n.sdgs).reduce((acc, sdg) => { acc[sdg] = (acc[sdg] || 0) + 1; return acc; }, {})
                  ).sort((a, b) => b[1] - a[1]).map(([sdg, count]) => (
                    <div key={sdg} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span style={{ background: SDG_COLORS[sdg] || T.navy, color: '#fff', width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{sdg}</span>
                      <span style={{ fontSize: 11, color: T.textSec }}>{count} projects</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ TAB 4: Investment Case ══ */}
        {tab === 4 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20 }}>
                <h3 style={{ color: T.navy, margin: '0 0 14px', fontSize: 14 }}>BCR by NbS Solution</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={[...NBS_SOLUTIONS].sort((a, b) => b.bcr - a.bcr)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis type="number" domain={[0, 16]} tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={180} />
                    <Tooltip formatter={v => [`${v}x`, 'BCR']} />
                    <Bar dataKey="bcr" radius={[0, 6, 6, 0]}>
                      {[...NBS_SOLUTIONS].sort((a, b) => b.bcr - a.bcr).map((n, i) =>
                        <Cell key={i} fill={n.bcr >= 8 ? T.green : n.bcr >= 5 ? T.teal : T.amber} />
                      )}
                    </Bar>
                    <ReferenceLine x={5} stroke={T.teal} strokeDasharray="4 4" label={{ value: '5x threshold', fill: T.teal, fontSize: 10 }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20 }}>
                <h3 style={{ color: T.navy, margin: '0 0 14px', fontSize: 14 }}>Cost vs. Total Benefit ($M)</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={NBS_SOLUTIONS}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="id" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="total_cost_m" name="Cost ($M)" fill={T.red} opacity={0.6} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="protection_value_m" name="Protection ($M)" fill={T.blue} opacity={0.7} />
                    <Bar dataKey="carbon_value_m" name="Carbon ($M)" fill={T.green} opacity={0.8} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24 }}>
              <h3 style={{ color: T.navy, margin: '0 0 14px', fontSize: 14 }}>Investment Thesis — Why NbS for Climate Adaptation?</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                {[
                  { title: 'Superior BCR', detail: 'NbS deliver 5\u201314x benefit-cost ratios vs. 2\u20134x for engineered-only solutions. Peatland rewetting achieves 14x BCR \u2014 the highest of any adaptation strategy.', color: T.green },
                  { title: 'Triple Dividend', detail: 'Avoided losses (protection) + Carbon revenue ($452M across portfolio) + Community co-benefits (9,070 jobs). No grey infrastructure delivers all three simultaneously.', color: T.teal },
                  { title: 'Regulatory Tailwind', detail: 'EU Nature Restoration Law (2024), TNFD v1.0, CBD Kunming-Montreal 30x30 target, and ISSB S2 nature risk disclosure create a structural demand shift toward NbS investment.', color: T.blue },
                ].map(t => (
                  <div key={t.title} style={{ padding: 16, background: t.color + '08', border: `1px solid ${t.color}22`, borderRadius: 10 }}>
                    <div style={{ fontWeight: 700, color: t.color, marginBottom: 8, fontSize: 13 }}>{t.title}</div>
                    <div style={{ color: T.textSec, fontSize: 11, lineHeight: 1.7 }}>{t.detail}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
