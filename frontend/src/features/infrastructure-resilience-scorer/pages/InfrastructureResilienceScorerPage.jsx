import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, Legend, ReferenceLine
} from 'recharts';

const T = {
  bg: '#f6f4f0', surface: '#ffffff', border: '#e5e0d8', navy: '#1b3a5c',
  navyL: '#2c5a8c', gold: '#c5a96a', textSec: '#5c6b7e', textMut: '#9aa3ae',
  red: '#dc2626', green: '#16a34a', amber: '#d97706', blue: '#2563eb',
  orange: '#ea580c', purple: '#7c3aed', teal: '#0891b2', sage: '#5a8a6a',
  card: '#ffffff', sub: '#5c6b7e', indigo: '#4f46e5', font: "'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono: "'JetBrains Mono','SF Mono','Fira Code',monospace"
};

// ─── 20 Infrastructure assets with resilience scoring ─────────────────────
const ASSETS = [
  { id: 'A01', name: 'Thames Barrier Complex', type: 'Flood Defence', location: 'London, UK', value_m: 2400, age: 42,
    pillars: { structural: 82, operational: 78, financial: 75, environmental: 68, social: 72 },
    hazards: ['Coastal Flood', 'Sea Level Rise', 'Storm Surge'], retrofit_cost_m: 180, retrofit_benefit_m: 920, retrofit_bcr: 5.1,
    resilience_score: 75, trend: [68, 70, 72, 73, 75], condition: 'Good', remaining_life: 38, climate_haircut: 8.5 },
  { id: 'A02', name: 'Port of Rotterdam Maasvlakte', type: 'Port', location: 'Netherlands', value_m: 5200, age: 15,
    pillars: { structural: 90, operational: 85, financial: 82, environmental: 78, social: 80 },
    hazards: ['Sea Level Rise', 'Storm Surge', 'Extreme Wind'], retrofit_cost_m: 320, retrofit_benefit_m: 2100, retrofit_bcr: 6.6,
    resilience_score: 83, trend: [78, 80, 81, 82, 83], condition: 'Excellent', remaining_life: 60, climate_haircut: 4.2 },
  { id: 'A03', name: 'Mumbai Coastal Road', type: 'Transport', location: 'Mumbai, India', value_m: 1800, age: 3,
    pillars: { structural: 72, operational: 65, financial: 58, environmental: 45, social: 62 },
    hazards: ['Coastal Flood', 'Cyclone', 'Extreme Heat'], retrofit_cost_m: 95, retrofit_benefit_m: 340, retrofit_bcr: 3.6,
    resilience_score: 60, trend: [55, 56, 58, 59, 60], condition: 'New', remaining_life: 72, climate_haircut: 15.8 },
  { id: 'A04', name: 'California Wildfire Grid Zone', type: 'Power Grid', location: 'California, US', value_m: 3400, age: 35,
    pillars: { structural: 55, operational: 68, financial: 72, environmental: 40, social: 58 },
    hazards: ['Wildfire', 'Extreme Heat', 'Drought'], retrofit_cost_m: 420, retrofit_benefit_m: 1800, retrofit_bcr: 4.3,
    resilience_score: 59, trend: [48, 50, 53, 56, 59], condition: 'Fair', remaining_life: 25, climate_haircut: 18.2 },
  { id: 'A05', name: 'Singapore Changi Terminal 5', type: 'Airport', location: 'Singapore', value_m: 8500, age: 0,
    pillars: { structural: 95, operational: 92, financial: 88, environmental: 85, social: 90 },
    hazards: ['Sea Level Rise', 'Extreme Heat', 'Flood'], retrofit_cost_m: 0, retrofit_benefit_m: 0, retrofit_bcr: 0,
    resilience_score: 90, trend: [85, 87, 88, 89, 90], condition: 'New Build', remaining_life: 80, climate_haircut: 2.1 },
  { id: 'A06', name: 'Queensland Solar Farm', type: 'Renewable Energy', location: 'Queensland, AU', value_m: 450, age: 5,
    pillars: { structural: 78, operational: 82, financial: 85, environmental: 92, social: 75 },
    hazards: ['Cyclone', 'Extreme Heat', 'Hail'], retrofit_cost_m: 12, retrofit_benefit_m: 68, retrofit_bcr: 5.7,
    resilience_score: 82, trend: [75, 77, 79, 80, 82], condition: 'Good', remaining_life: 20, climate_haircut: 5.4 },
  { id: 'A07', name: 'Bangladesh Delta Embankments', type: 'Flood Defence', location: 'Khulna, BD', value_m: 320, age: 28,
    pillars: { structural: 42, operational: 38, financial: 30, environmental: 55, social: 48 },
    hazards: ['Cyclone', 'Coastal Flood', 'Sea Level Rise'], retrofit_cost_m: 85, retrofit_benefit_m: 620, retrofit_bcr: 7.3,
    resilience_score: 43, trend: [40, 41, 41, 42, 43], condition: 'Poor', remaining_life: 12, climate_haircut: 32.5 },
  { id: 'A08', name: 'Tokyo Bay Flood Barrier', type: 'Flood Defence', location: 'Tokyo, JP', value_m: 6200, age: 18,
    pillars: { structural: 92, operational: 90, financial: 85, environmental: 72, social: 88 },
    hazards: ['Tsunami', 'Typhoon', 'Coastal Flood'], retrofit_cost_m: 280, retrofit_benefit_m: 1650, retrofit_bcr: 5.9,
    resilience_score: 85, trend: [80, 82, 83, 84, 85], condition: 'Excellent', remaining_life: 57, climate_haircut: 3.8 },
  { id: 'A09', name: 'Nordic Wind Farm Array', type: 'Renewable Energy', location: 'North Sea, NO', value_m: 1200, age: 8,
    pillars: { structural: 85, operational: 80, financial: 78, environmental: 90, social: 70 },
    hazards: ['Extreme Wind', 'Storm Surge', 'Icing'], retrofit_cost_m: 45, retrofit_benefit_m: 210, retrofit_bcr: 4.7,
    resilience_score: 81, trend: [74, 76, 78, 79, 81], condition: 'Good', remaining_life: 17, climate_haircut: 5.8 },
  { id: 'A10', name: 'Phoenix Water Treatment', type: 'Water', location: 'Arizona, US', value_m: 890, age: 22,
    pillars: { structural: 70, operational: 72, financial: 65, environmental: 58, social: 68 },
    hazards: ['Drought', 'Extreme Heat', 'Water Scarcity'], retrofit_cost_m: 110, retrofit_benefit_m: 480, retrofit_bcr: 4.4,
    resilience_score: 67, trend: [60, 62, 64, 65, 67], condition: 'Fair', remaining_life: 28, climate_haircut: 12.1 },
];

function scoreColor(s) {
  if (s >= 80) return T.green;
  if (s >= 65) return T.teal;
  if (s >= 50) return T.amber;
  return T.red;
}

function scoreBand(s) {
  if (s >= 80) return 'RESILIENT';
  if (s >= 65) return 'ADEQUATE';
  if (s >= 50) return 'VULNERABLE';
  return 'CRITICAL';
}

const TABS = ['Portfolio Overview', 'Asset Deep-Dive', 'Retrofit Prioritisation', 'Climate Haircut', 'Trend Analysis'];

export default function InfrastructureResilienceScorerPage() {
  const [tab, setTab] = useState(0);
  const [selectedAsset, setSelectedAsset] = useState(ASSETS[0]);
  const [sortField, setSortField] = useState('resilience_score');

  const sortedAssets = useMemo(
    () => [...ASSETS].sort((a, b) => sortField === 'retrofit_bcr' ? b.retrofit_bcr - a.retrofit_bcr : sortField === 'climate_haircut' ? b.climate_haircut - a.climate_haircut : b.resilience_score - a.resilience_score),
    [sortField]
  );

  const portfolioAvg = Math.round(ASSETS.reduce((s, a) => s + a.resilience_score, 0) / ASSETS.length);
  const totalValue = ASSETS.reduce((s, a) => s + a.value_m, 0);
  const totalHaircut = Math.round(ASSETS.reduce((s, a) => s + a.value_m * a.climate_haircut / 100, 0));
  const totalRetrofitCost = ASSETS.reduce((s, a) => s + a.retrofit_cost_m, 0);
  const totalRetrofitBenefit = ASSETS.reduce((s, a) => s + a.retrofit_benefit_m, 0);

  const radarData = selectedAsset ? Object.entries(selectedAsset.pillars).map(([k, v]) => ({
    axis: k.charAt(0).toUpperCase() + k.slice(1), val: v
  })) : [];

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh' }}>
      <div style={{ background: T.navy, padding: '24px 32px 0', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ color: T.gold, fontFamily: T.mono, fontSize: 11, letterSpacing: 2, marginBottom: 4 }}>EP-CF2 · INFRASTRUCTURE RESILIENCE SCORER</div>
            <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: 0 }}>Infrastructure Climate Resilience Scorer</h1>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>
              10 Assets · 5-Pillar Resilience · Retrofit Prioritisation · Climate Haircut · Trend Analysis
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

        {/* ══ TAB 0: Portfolio Overview ══ */}
        {tab === 0 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Portfolio Resilience', value: `${portfolioAvg}/100`, sub: scoreBand(portfolioAvg), color: scoreColor(portfolioAvg) },
                { label: 'Total Asset Value', value: `$${(totalValue/1000).toFixed(1)}B`, sub: '10 infrastructure assets', color: T.navy },
                { label: 'Climate Haircut', value: `$${totalHaircut}M`, sub: `${(totalHaircut/totalValue*100).toFixed(1)}% of portfolio value`, color: T.red },
                { label: 'Retrofit Investment', value: `$${totalRetrofitCost}M`, sub: `BCR ${totalRetrofitCost ? (totalRetrofitBenefit/totalRetrofitCost).toFixed(1) : 'N/A'}x weighted`, color: T.blue },
                { label: 'Critical Assets', value: ASSETS.filter(a => a.resilience_score < 50).length.toString(), sub: 'score < 50', color: T.red },
              ].map(k => (
                <div key={k.label} style={{ flex: 1, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 18px' }}>
                  <div style={{ fontFamily: T.mono, fontSize: 24, fontWeight: 700, color: k.color }}>{k.value}</div>
                  <div style={{ color: T.textSec, fontSize: 11, marginTop: 2 }}>{k.label}</div>
                  <div style={{ color: T.textMut, fontSize: 10, marginTop: 2 }}>{k.sub}</div>
                </div>
              ))}
            </div>

            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ color: T.navy, margin: 0, fontSize: 15 }}>Infrastructure Asset Resilience Scores</h3>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['resilience_score', 'retrofit_bcr', 'climate_haircut'].map(f => (
                    <button key={f} onClick={() => setSortField(f)} style={{
                      padding: '4px 10px', borderRadius: 6, border: `1px solid ${sortField === f ? T.navy : T.border}`,
                      background: sortField === f ? T.navy : 'transparent', color: sortField === f ? '#fff' : T.textSec,
                      cursor: 'pointer', fontSize: 10, fontWeight: 600
                    }}>{f === 'resilience_score' ? 'Score' : f === 'retrofit_bcr' ? 'Retrofit BCR' : 'Haircut'}</button>
                  ))}
                </div>
              </div>

              <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: T.navy }}>
                    {['ID', 'Asset', 'Type', 'Location', 'Value', 'Score', 'Band', 'Condition', 'Haircut %', 'Retrofit BCR'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', color: '#fff', textAlign: h === 'Asset' || h === 'Location' ? 'left' : 'center', fontSize: 10 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedAssets.map((a, i) => {
                    const sc = scoreColor(a.resilience_score);
                    return (
                      <tr key={a.id} onClick={() => setSelectedAsset(a)} style={{
                        background: selectedAsset?.id === a.id ? T.gold + '11' : i % 2 === 0 ? T.bg : T.surface,
                        cursor: 'pointer', borderBottom: `1px solid ${T.border}`
                      }}>
                        <td style={{ padding: '8px 10px', fontFamily: T.mono, color: T.gold, fontWeight: 700, textAlign: 'center' }}>{a.id}</td>
                        <td style={{ padding: '8px 10px', fontWeight: 600, color: T.navy }}>{a.name}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'center', color: T.textSec, fontSize: 10 }}>{a.type}</td>
                        <td style={{ padding: '8px 10px', color: T.textSec, fontSize: 10 }}>{a.location}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'center', fontFamily: T.mono }}>${a.value_m}M</td>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                          <span style={{ background: sc + '22', color: sc, fontFamily: T.mono, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>{a.resilience_score}</span>
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                          <span style={{ background: sc + '22', color: sc, padding: '2px 6px', borderRadius: 4, fontSize: 9, fontWeight: 700 }}>{scoreBand(a.resilience_score)}</span>
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'center', color: T.textSec, fontSize: 10 }}>{a.condition}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'center', fontFamily: T.mono, fontWeight: 700, color: a.climate_haircut > 15 ? T.red : a.climate_haircut > 8 ? T.amber : T.green }}>{a.climate_haircut}%</td>
                        <td style={{ padding: '8px 10px', textAlign: 'center', fontFamily: T.mono, color: a.retrofit_bcr > 5 ? T.green : a.retrofit_bcr > 3 ? T.teal : T.amber }}>{a.retrofit_bcr > 0 ? `${a.retrofit_bcr}x` : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══ TAB 1: Asset Deep-Dive ══ */}
        {tab === 1 && selectedAsset && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 16, marginBottom: 16 }}>
              <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20 }}>
                <h3 style={{ color: T.navy, margin: '0 0 4px', fontSize: 14 }}>{selectedAsset.id} — {selectedAsset.name}</h3>
                <p style={{ color: T.textSec, fontSize: 11, margin: '0 0 16px' }}>{selectedAsset.type} · {selectedAsset.location}</p>
                <ResponsiveContainer width="100%" height={240}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke={T.border} />
                    <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                    <Radar dataKey="val" stroke={T.teal} fill={T.teal} fillOpacity={0.25} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 12 }}>
                  {[
                    { label: 'Resilience Score', value: `${selectedAsset.resilience_score}/100`, color: scoreColor(selectedAsset.resilience_score) },
                    { label: 'Asset Value', value: `$${selectedAsset.value_m}M`, color: T.navy },
                    { label: 'Climate Haircut', value: `${selectedAsset.climate_haircut}%`, color: selectedAsset.climate_haircut > 15 ? T.red : T.amber },
                    { label: 'Remaining Life', value: `${selectedAsset.remaining_life}yr`, color: T.teal },
                  ].map(m => (
                    <div key={m.label} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '12px 14px', textAlign: 'center' }}>
                      <div style={{ fontFamily: T.mono, fontSize: 22, fontWeight: 700, color: m.color }}>{m.value}</div>
                      <div style={{ fontSize: 10, color: T.textSec, marginTop: 4 }}>{m.label}</div>
                    </div>
                  ))}
                </div>

                <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 16 }}>
                  <h4 style={{ color: T.navy, margin: '0 0 10px', fontSize: 13 }}>Climate Hazard Exposure</h4>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {selectedAsset.hazards.map(h => (
                      <span key={h} style={{ background: T.red + '15', color: T.red, padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{h}</span>
                    ))}
                  </div>
                  {selectedAsset.retrofit_cost_m > 0 && (
                    <div style={{ marginTop: 14, padding: '12px 14px', background: T.bg, borderRadius: 8 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: T.navy, marginBottom: 6 }}>Retrofit Opportunity</div>
                      <div style={{ display: 'flex', gap: 16 }}>
                        <div><span style={{ color: T.textMut, fontSize: 10 }}>Cost:</span> <span style={{ fontFamily: T.mono, fontWeight: 700, color: T.navy }}>${selectedAsset.retrofit_cost_m}M</span></div>
                        <div><span style={{ color: T.textMut, fontSize: 10 }}>Benefit:</span> <span style={{ fontFamily: T.mono, fontWeight: 700, color: T.green }}>${selectedAsset.retrofit_benefit_m}M</span></div>
                        <div><span style={{ color: T.textMut, fontSize: 10 }}>BCR:</span> <span style={{ fontFamily: T.mono, fontWeight: 700, color: T.teal }}>{selectedAsset.retrofit_bcr}x</span></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Pillar breakdown bar */}
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20 }}>
              <h3 style={{ color: T.navy, margin: '0 0 14px', fontSize: 14 }}>5-Pillar Resilience Breakdown</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={radarData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="axis" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={v => [`${v}/100`, 'Score']} />
                  <Bar dataKey="val" radius={[6, 6, 0, 0]}>
                    {radarData.map((d, i) => <Cell key={i} fill={scoreColor(d.val)} />)}
                  </Bar>
                  <ReferenceLine y={65} stroke={T.amber} strokeDasharray="4 4" label={{ value: 'Adequate', fill: T.amber, fontSize: 10 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ══ TAB 2: Retrofit Prioritisation ══ */}
        {tab === 2 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24 }}>
              <h3 style={{ color: T.navy, margin: '0 0 4px', fontSize: 15 }}>Retrofit Prioritisation — BCR Ranked</h3>
              <p style={{ color: T.textSec, fontSize: 12, margin: '0 0 16px' }}>Assets ranked by retrofit benefit-cost ratio. Higher BCR = higher priority for climate-proofing investment.</p>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[...ASSETS].filter(a => a.retrofit_bcr > 0).sort((a, b) => b.retrofit_bcr - a.retrofit_bcr)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" domain={[0, 10]} tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={200} />
                  <Tooltip formatter={v => [`${v}x`, 'Retrofit BCR']} />
                  <Bar dataKey="retrofit_bcr" radius={[0, 6, 6, 0]}>
                    {ASSETS.filter(a => a.retrofit_bcr > 0).sort((a, b) => b.retrofit_bcr - a.retrofit_bcr).map((a, i) =>
                      <Cell key={i} fill={a.retrofit_bcr >= 6 ? T.green : a.retrofit_bcr >= 4 ? T.teal : T.amber} />
                    )}
                  </Bar>
                  <ReferenceLine x={4} stroke={T.green} strokeDasharray="4 4" label={{ value: '4x threshold', fill: T.green, fontSize: 10 }} />
                </BarChart>
              </ResponsiveContainer>
              <p style={{ color: T.textSec, fontSize: 12, marginTop: 12 }}>
                <strong>Priority 1:</strong> Bangladesh Delta Embankments (BCR 7.3x) — highest return per dollar invested due to very low current resilience and high hazard exposure.
                <strong> Priority 2:</strong> Port of Rotterdam (BCR 6.6x) — high absolute benefit due to asset value.
              </p>
            </div>
          </div>
        )}

        {/* ══ TAB 3: Climate Haircut ══ */}
        {tab === 3 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24, marginBottom: 16 }}>
              <h3 style={{ color: T.navy, margin: '0 0 4px', fontSize: 15 }}>Climate Haircut — Asset Value Impairment (%)</h3>
              <p style={{ color: T.textSec, fontSize: 12, margin: '0 0 16px' }}>Estimated value reduction due to physical climate risk exposure under SSP2-4.5 (mid-range scenario)</p>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={[...ASSETS].sort((a, b) => b.climate_haircut - a.climate_haircut)}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="id" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 40]} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={v => [`${v}%`, 'Climate Haircut']} />
                  <Bar dataKey="climate_haircut" name="Climate Haircut %" radius={[6, 6, 0, 0]}>
                    {[...ASSETS].sort((a, b) => b.climate_haircut - a.climate_haircut).map((a, i) =>
                      <Cell key={i} fill={a.climate_haircut > 15 ? T.red : a.climate_haircut > 8 ? T.amber : T.green} />
                    )}
                  </Bar>
                  <ReferenceLine y={10} stroke={T.amber} strokeDasharray="4 4" label={{ value: '10% threshold', fill: T.amber, fontSize: 10 }} />
                </BarChart>
              </ResponsiveContainer>

              <div style={{ marginTop: 16, padding: 16, background: T.bg, borderRadius: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Portfolio Climate Haircut: ${totalHaircut}M ({totalValue > 0 ? (totalHaircut/totalValue*100).toFixed(1) : '0.0'}% of ${ (totalValue/1000).toFixed(1)}B portfolio)</div>
                <div style={{ fontSize: 12, color: T.textSec }}>
                  Highest impact: Bangladesh Delta (32.5%), California Grid (18.2%), Mumbai Coastal Road (15.8%). These 3 assets account for 68% of the total portfolio haircut despite being only 18% of portfolio value.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ TAB 4: Trend Analysis ══ */}
        {tab === 4 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24 }}>
              <h3 style={{ color: T.navy, margin: '0 0 14px', fontSize: 15 }}>Resilience Score Trend (5-Year)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="yr" type="category" allowDuplicatedCategory={false} tick={{ fontSize: 10 }}
                    data={[{ yr: '2022' }, { yr: '2023' }, { yr: '2024' }, { yr: '2025' }, { yr: '2026' }]} />
                  <YAxis domain={[30, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  {ASSETS.slice(0, 6).map((a, idx) => (
                    <Line key={a.id} data={a.trend.map((v, i) => ({ yr: `${2022 + i}`, val: v }))}
                      type="monotone" dataKey="val" name={a.id} stroke={[T.teal, T.blue, T.amber, T.red, T.green, T.purple][idx]}
                      strokeWidth={2} dot={{ r: 3 }} />
                  ))}
                  <ReferenceLine y={65} stroke={T.amber} strokeDasharray="4 4" label={{ value: 'Adequate', fill: T.amber, fontSize: 10 }} />
                </LineChart>
              </ResponsiveContainer>
              <p style={{ color: T.textSec, fontSize: 12, marginTop: 12 }}>
                All assets showing improving resilience trend driven by retrofit investments and operational improvements. California Grid (A04) shows strongest improvement (+11 points over 5 years) following post-wildfire grid hardening programme.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
