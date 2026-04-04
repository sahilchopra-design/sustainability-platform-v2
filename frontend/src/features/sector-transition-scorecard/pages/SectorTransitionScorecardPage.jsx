import React, { useState, useMemo } from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Cell, ReferenceLine
} from 'recharts';

const T = {
  bg: '#f6f4f0', surface: '#ffffff', surfaceH: '#f0ede7', border: '#e5e0d8',
  navy: '#1b3a5c', navyL: '#2c5a8c', gold: '#c5a96a', sage: '#5a8a6a',
  text: '#1b3a5c', textSec: '#5c6b7e', textMut: '#9aa3ae', red: '#dc2626',
  green: '#16a34a', amber: '#d97706', blue: '#2563eb', orange: '#ea580c',
  purple: '#7c3aed', teal: '#0891b2',
  font: "'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono: "'JetBrains Mono','SF Mono','Fira Code',monospace"
};

// ─── SECTOR DATA ─────────────────────────────────────────────────────────────
const SECTORS = [
  {
    id: 'energy', gics: 'Energy', sub: 'Oil, Gas, Coal, Power',
    color: T.red, icon: '⚡',
    pace: { physical: 72, abatement: 38, carbon_cost: 85, energy_price: 65 },
    sbti_aligned_pct: 22, pathway: 'Not Aligned', temp_2100: 3.8,
    emissions_2019: 15800, emissions_2030_target: 8900, emissions_2050_target: 0,
    green_revenue_pct: 8, brown_revenue_pct: 82, transition_capex_pct: 18,
    stranded_risk: 'Critical', rating: 'E',
    abatement_curve: [
      { measure: 'Methane leak fix', abatement: 820, cost: -15 },
      { measure: 'Solar PV', abatement: 1200, cost: 12 },
      { measure: 'Wind', abatement: 980, cost: 18 },
      { measure: 'CCS on power', abatement: 2400, cost: 65 },
      { measure: 'Blue H₂', abatement: 1100, cost: 90 },
      { measure: 'DAC', abatement: 450, cost: 280 },
    ],
    trajectory: [2019, 2020, 2021, 2022, 2023, 2025, 2030].map((yr, i) => ({
      year: yr,
      actual: [15800, 13200, 14100, 14600, 14900, null, null][i],
      target: [15800, 15100, 14400, 13700, 13000, 11800, 8900][i],
    })),
  },
  {
    id: 'materials', gics: 'Materials', sub: 'Steel, Cement, Chemicals, Mining',
    color: T.orange, icon: '⚙️',
    pace: { physical: 58, abatement: 55, carbon_cost: 70, energy_price: 72 },
    sbti_aligned_pct: 34, pathway: 'Below 2°C', temp_2100: 2.8,
    emissions_2019: 8400, emissions_2030_target: 5800, emissions_2050_target: 1200,
    green_revenue_pct: 12, brown_revenue_pct: 72, transition_capex_pct: 24,
    stranded_risk: 'High', rating: 'D',
    abatement_curve: [
      { measure: 'EAF steel', abatement: 1100, cost: 20 },
      { measure: 'Clinker reduction', abatement: 680, cost: 8 },
      { measure: 'Industrial heat pump', abatement: 420, cost: 35 },
      { measure: 'Green H₂ steel', abatement: 1800, cost: 95 },
      { measure: 'Carbon capture cement', abatement: 950, cost: 120 },
    ],
    trajectory: [2019, 2020, 2021, 2022, 2023, 2025, 2030].map((yr, i) => ({
      year: yr,
      actual: [8400, 7600, 8100, 8300, 8200, null, null][i],
      target: [8400, 8100, 7800, 7500, 7200, 6800, 5800][i],
    })),
  },
  {
    id: 'industrials', gics: 'Industrials', sub: 'Aviation, Shipping, Rail, Waste',
    color: T.amber, icon: '🏭',
    pace: { physical: 48, abatement: 62, carbon_cost: 55, energy_price: 58 },
    sbti_aligned_pct: 41, pathway: 'Well-below 2°C', temp_2100: 2.2,
    emissions_2019: 4200, emissions_2030_target: 3100, emissions_2050_target: 400,
    green_revenue_pct: 22, brown_revenue_pct: 58, transition_capex_pct: 32,
    stranded_risk: 'Medium', rating: 'C',
    abatement_curve: [
      { measure: 'Operational efficiency', abatement: 380, cost: -8 },
      { measure: 'SAF aviation', abatement: 520, cost: 85 },
      { measure: 'Green ammonia shipping', abatement: 680, cost: 110 },
      { measure: 'Electric rail', abatement: 290, cost: 25 },
    ],
    trajectory: [2019, 2020, 2021, 2022, 2023, 2025, 2030].map((yr, i) => ({
      year: yr,
      actual: [4200, 3100, 3600, 3900, 4000, null, null][i],
      target: [4200, 4000, 3800, 3600, 3400, 3200, 3100][i],
    })),
  },
  {
    id: 'utilities', gics: 'Utilities', sub: 'Electric, Gas, Water Utilities',
    color: T.blue, icon: '🔌',
    pace: { physical: 65, abatement: 75, carbon_cost: 60, energy_price: 80 },
    sbti_aligned_pct: 58, pathway: 'Well-below 2°C', temp_2100: 2.0,
    emissions_2019: 9800, emissions_2030_target: 4900, emissions_2050_target: 200,
    green_revenue_pct: 42, brown_revenue_pct: 38, transition_capex_pct: 55,
    stranded_risk: 'Medium', rating: 'C',
    abatement_curve: [
      { measure: 'Solar PV scale-up', abatement: 2200, cost: 10 },
      { measure: 'Onshore wind', abatement: 1800, cost: 14 },
      { measure: 'Battery storage', abatement: 900, cost: 45 },
      { measure: 'Coal retirement', abatement: 1600, cost: 0 },
      { measure: 'Offshore wind', abatement: 1400, cost: 55 },
    ],
    trajectory: [2019, 2020, 2021, 2022, 2023, 2025, 2030].map((yr, i) => ({
      year: yr,
      actual: [9800, 8900, 8400, 7800, 7200, null, null][i],
      target: [9800, 9000, 8200, 7400, 6600, 5800, 4900][i],
    })),
  },
  {
    id: 'real_estate', gics: 'Real Estate', sub: 'Commercial, Residential, Industrial RE',
    color: T.purple, icon: '🏢',
    pace: { physical: 55, abatement: 68, carbon_cost: 40, energy_price: 62 },
    sbti_aligned_pct: 29, pathway: 'Below 2°C', temp_2100: 2.5,
    emissions_2019: 3900, emissions_2030_target: 2400, emissions_2050_target: 300,
    green_revenue_pct: 18, brown_revenue_pct: 52, transition_capex_pct: 28,
    stranded_risk: 'High', rating: 'D',
    abatement_curve: [
      { measure: 'EPC upgrades', abatement: 620, cost: 22 },
      { measure: 'Heat pump retrofit', abatement: 580, cost: 38 },
      { measure: 'Solar PV on buildings', abatement: 340, cost: 15 },
      { measure: 'NZEB new builds', abatement: 480, cost: 55 },
    ],
    trajectory: [2019, 2020, 2021, 2022, 2023, 2025, 2030].map((yr, i) => ({
      year: yr,
      actual: [3900, 3600, 3750, 3800, 3750, null, null][i],
      target: [3900, 3700, 3500, 3300, 3100, 2900, 2400][i],
    })),
  },
  {
    id: 'financials', gics: 'Financials', sub: 'Banks, Insurance, Asset Managers',
    color: T.sage, icon: '🏦',
    pace: { physical: 30, abatement: 48, carbon_cost: 35, energy_price: 28 },
    sbti_aligned_pct: 52, pathway: 'Well-below 2°C', temp_2100: 2.3,
    emissions_2019: 280, emissions_2030_target: 180, emissions_2050_target: 20,
    green_revenue_pct: 28, brown_revenue_pct: 18, transition_capex_pct: 15,
    stranded_risk: 'Low', rating: 'B',
    abatement_curve: [
      { measure: 'Green bond issuance', abatement: 45, cost: 0 },
      { measure: 'Financed emissions target', abatement: 82, cost: 5 },
      { measure: 'Fossil divestment', abatement: 65, cost: 8 },
      { measure: 'Climate stewardship', abatement: 38, cost: 2 },
    ],
    trajectory: [2019, 2020, 2021, 2022, 2023, 2025, 2030].map((yr, i) => ({
      year: yr,
      actual: [280, 240, 260, 255, 248, null, null][i],
      target: [280, 265, 250, 235, 220, 200, 180][i],
    })),
  },
];

function paceComposite(s) {
  return ((s.pace.physical + s.pace.abatement + s.pace.carbon_cost + s.pace.energy_price) / 4).toFixed(1);
}

const RATING_COLOR = { A: T.green, B: '#22c55e', C: T.amber, D: T.orange, E: T.red };
const RISK_COLOR = { Low: T.green, Medium: T.amber, High: T.orange, Critical: T.red };

const TABS = ['Sector Scorecards', 'PACE Analysis', 'SBTi Pathways', 'Abatement Cost Curves', 'Emissions Trajectories'];

export default function SectorTransitionScorecardPage() {
  const [tab, setTab] = useState(0);
  const [selected, setSelected] = useState('energy');

  const sector = SECTORS.find(s => s.id === selected);

  const radarData = useMemo(() => [
    { subject: 'Physical Risk', fullMark: 100, ...Object.fromEntries(SECTORS.map(s => [s.id, s.pace.physical])) },
    { subject: 'Abatement', fullMark: 100, ...Object.fromEntries(SECTORS.map(s => [s.id, s.pace.abatement])) },
    { subject: 'Carbon Cost', fullMark: 100, ...Object.fromEntries(SECTORS.map(s => [s.id, s.pace.carbon_cost])) },
    { subject: 'Energy Price', fullMark: 100, ...Object.fromEntries(SECTORS.map(s => [s.id, s.pace.energy_price])) },
    { subject: 'Composite', fullMark: 100, ...Object.fromEntries(SECTORS.map(s => [s.id, parseFloat(paceComposite(s))])) },
  ], []);

  const abatementData = useMemo(() => {
    let cum = 0;
    return sector.abatement_curve.map(m => {
      cum += m.abatement;
      return { ...m, cumulative: cum };
    });
  }, [sector]);

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh' }}>
      <div style={{ background: T.navy, padding: '24px 32px 0', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ color: T.gold, fontFamily: T.mono, fontSize: 11, letterSpacing: 2, marginBottom: 4 }}>EP-CB1 · SECTOR TRANSITION SCORECARD</div>
            <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: 0 }}>GICS Sector Transition Risk Scorecards</h1>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>
              6 GICS Sectors · PACE Framework · SBTi Pathways · MAC Abatement Curves · Emissions Trajectory
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {SECTORS.map(s => (
              <button key={s.id} onClick={() => setSelected(s.id)} style={{
                padding: '6px 12px', borderRadius: 20, border: `2px solid ${selected === s.id ? s.color : 'transparent'}`,
                background: selected === s.id ? s.color + '22' : 'rgba(255,255,255,0.06)',
                color: selected === s.id ? s.color : '#94a3b8', cursor: 'pointer', fontSize: 12, fontWeight: 600
              }}>{s.icon} {s.gics}</button>
            ))}
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

        {/* TAB 0: Sector Scorecards */}
        {tab === 0 && (
          <div style={{ paddingTop: 24 }}>
            {/* Selected sector detail */}
            <div style={{ background: T.surface, borderRadius: 10, border: `2px solid ${sector.color}44`, padding: 24, marginBottom: 20 }}>
              <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                <div style={{ fontSize: 40 }}>{sector.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 4 }}>
                    <h2 style={{ color: T.navy, margin: 0, fontSize: 20 }}>{sector.gics}</h2>
                    <span style={{ background: RATING_COLOR[sector.rating] + '22', color: RATING_COLOR[sector.rating], padding: '2px 10px', borderRadius: 12, fontSize: 13, fontWeight: 700 }}>
                      Rating {sector.rating}
                    </span>
                    <span style={{ background: RISK_COLOR[sector.stranded_risk] + '22', color: RISK_COLOR[sector.stranded_risk], padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                      {sector.stranded_risk} Stranded Risk
                    </span>
                  </div>
                  <div style={{ color: T.textSec, fontSize: 13, marginBottom: 16 }}>{sector.sub}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 10 }}>
                    {[
                      { label: 'PACE Score', val: `${paceComposite(sector)}/100`, col: sector.color },
                      { label: 'Temp by 2100', val: `${sector.temp_2100}°C`, col: sector.temp_2100 < 2 ? T.green : sector.temp_2100 < 2.5 ? T.amber : T.red },
                      { label: 'SBTi Aligned', val: `${sector.sbti_aligned_pct}%`, col: T.blue },
                      { label: 'Green Revenue', val: `${sector.green_revenue_pct}%`, col: T.green },
                      { label: 'Brown Revenue', val: `${sector.brown_revenue_pct}%`, col: T.red },
                      { label: 'Trans. CapEx', val: `${sector.transition_capex_pct}%`, col: T.gold },
                    ].map(m => (
                      <div key={m.label} style={{ background: T.bg, borderRadius: 8, padding: 12, textAlign: 'center' }}>
                        <div style={{ fontSize: 10, color: T.textMut, textTransform: 'uppercase', letterSpacing: 1 }}>{m.label}</div>
                        <div style={{ fontFamily: T.mono, fontSize: 16, fontWeight: 700, color: m.col, marginTop: 4 }}>{m.val}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* All sectors comparison */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
              {SECTORS.map(s => (
                <div key={s.id} onClick={() => setSelected(s.id)} style={{
                  background: T.surface, borderRadius: 10, border: `1px solid ${selected === s.id ? s.color : T.border}`,
                  padding: 16, cursor: 'pointer'
                }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 24 }}>{s.icon}</span>
                    <div>
                      <div style={{ fontWeight: 700, color: T.navy }}>{s.gics}</div>
                      <div style={{ fontSize: 11, color: T.textSec }}>{s.sub.split(',')[0]}</div>
                    </div>
                    <div style={{ marginLeft: 'auto' }}>
                      <span style={{ fontSize: 18, fontWeight: 700, fontFamily: T.mono, color: RATING_COLOR[s.rating] }}>{s.rating}</span>
                    </div>
                  </div>
                  {['physical', 'abatement', 'carbon_cost', 'energy_price'].map(k => (
                    <div key={k} style={{ marginBottom: 5 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                        <span style={{ fontSize: 10, color: T.textMut, textTransform: 'uppercase' }}>{k.replace('_', ' ')}</span>
                        <span style={{ fontSize: 10, fontFamily: T.mono, color: s.color }}>{s.pace[k]}</span>
                      </div>
                      <div style={{ height: 4, background: T.border, borderRadius: 2 }}>
                        <div style={{ height: '100%', width: `${s.pace[k]}%`, background: s.color, borderRadius: 2 }} />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 1: PACE Analysis */}
        {tab === 1 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24 }}>
                <h3 style={{ color: T.navy, margin: '0 0 8px', fontSize: 15 }}>PACE Radar — {sector.gics}</h3>
                <p style={{ color: T.textSec, fontSize: 12, margin: '0 0 16px' }}>Physical, Abatement, Carbon Cost, Energy Price exposure (0=low exposure, 100=high exposure)</p>
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={[
                    { subject: 'Physical Risk', val: sector.pace.physical },
                    { subject: 'Abatement', val: sector.pace.abatement },
                    { subject: 'Carbon Cost', val: sector.pace.carbon_cost },
                    { subject: 'Energy Price', val: sector.pace.energy_price },
                    { subject: 'Composite', val: parseFloat(paceComposite(sector)) },
                  ]}>
                    <PolarGrid stroke={T.border} />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: T.textSec, fontSize: 11 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                    <Radar dataKey="val" stroke={sector.color} fill={sector.color} fillOpacity={0.25} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24 }}>
                <h3 style={{ color: T.navy, margin: '0 0 16px', fontSize: 15 }}>PACE Composite — All Sectors</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={SECTORS.map(s => ({ name: s.gics, score: parseFloat(paceComposite(s)), color: s.color }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={v => [`${v}`, 'PACE Score']} />
                    <Bar dataKey="score" radius={[6,6,0,0]}>
                      {SECTORS.map((s, i) => <Cell key={i} fill={s.color} />)}
                    </Bar>
                    <ReferenceLine y={50} stroke={T.textMut} strokeDasharray="4 4" label={{ value: 'Avg', fill: T.textMut, fontSize: 10 }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SBTi Pathways */}
        {tab === 2 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
              {SECTORS.map(s => (
                <div key={s.id} style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: 22 }}>{s.icon}</span>
                    <div>
                      <div style={{ fontWeight: 700, color: T.navy }}>{s.gics}</div>
                      <div style={{ fontSize: 11, color: T.textSec }}>{s.pathway}</div>
                    </div>
                    <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                      <div style={{ fontFamily: T.mono, fontSize: 18, fontWeight: 700, color: s.temp_2100 < 2 ? T.green : s.temp_2100 < 2.5 ? T.amber : T.red }}>
                        {s.temp_2100}°C
                      </div>
                      <div style={{ fontSize: 10, color: T.textMut }}>implied 2100</div>
                    </div>
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: T.textSec }}>SBTi Companies</span>
                      <span style={{ fontFamily: T.mono, color: T.blue, fontWeight: 700 }}>{s.sbti_aligned_pct}%</span>
                    </div>
                    <div style={{ height: 6, background: T.border, borderRadius: 3 }}>
                      <div style={{ height: '100%', width: `${s.sbti_aligned_pct}%`, background: T.blue, borderRadius: 3 }} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                    {[['2019', s.emissions_2019], ['2030T', s.emissions_2030_target], ['2050T', s.emissions_2050_target]].map(([yr, val]) => (
                      <div key={yr} style={{ background: T.bg, borderRadius: 6, padding: 8, textAlign: 'center' }}>
                        <div style={{ fontSize: 9, color: T.textMut }}>{yr}</div>
                        <div style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 700, color: T.navy }}>{(val/1000).toFixed(1)}Gt</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 10, fontSize: 11, color: T.textSec }}>
                    Required reduction: <strong style={{ color: T.red }}>{(((s.emissions_2019 - s.emissions_2030_target) / s.emissions_2019) * 100).toFixed(0)}%</strong> by 2030
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: Abatement Cost Curves */}
        {tab === 3 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
              {SECTORS.map(s => (
                <button key={s.id} onClick={() => setSelected(s.id)} style={{
                  padding: '6px 12px', borderRadius: 20, border: `2px solid ${selected === s.id ? s.color : 'transparent'}`,
                  background: selected === s.id ? s.color + '22' : T.surface,
                  color: selected === s.id ? s.color : T.textSec, cursor: 'pointer', fontSize: 12, fontWeight: 600
                }}>{s.icon} {s.gics}</button>
              ))}
            </div>
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24, marginBottom: 20 }}>
              <h3 style={{ color: T.navy, margin: '0 0 4px', fontSize: 15 }}>Marginal Abatement Cost Curve — {sector.gics}</h3>
              <p style={{ color: T.textSec, fontSize: 12, margin: '0 0 16px' }}>
                Width = abatement potential (MtCO₂e) · Height = cost (USD/tCO₂e). Measures below zero are cost-saving.
              </p>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={abatementData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="measure" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} label={{ value: 'Cost ($/tCO₂)', angle: -90, position: 'insideLeft', fill: T.textSec, fontSize: 11 }} />
                  <Tooltip formatter={(v, n) => [n === 'cost' ? `$${v}/tCO₂` : `${v} MtCO₂e`, n === 'cost' ? 'Abatement Cost' : n]} />
                  <Legend />
                  <Bar dataKey="cost" name="Cost ($/tCO₂)" radius={[4,4,0,0]}>
                    {abatementData.map((e, i) => <Cell key={i} fill={e.cost < 0 ? T.green : e.cost < 50 ? T.amber : T.red} />)}
                  </Bar>
                  <ReferenceLine y={0} stroke={T.navy} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14 }}>
              {abatementData.map(m => (
                <div key={m.measure} style={{ background: T.bg, borderRadius: 8, padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: m.cost < 0 ? T.green : m.cost < 50 ? T.amber : T.red, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.navy }}>{m.measure}</div>
                    <div style={{ fontSize: 11, color: T.textSec }}>Potential: {m.abatement} MtCO₂e · Cumulative: {m.cumulative} MtCO₂e</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: T.mono, fontWeight: 700, color: m.cost < 0 ? T.green : m.cost < 50 ? T.amber : T.red }}>
                      {m.cost < 0 ? '-' : '+'}${Math.abs(m.cost)}/t
                    </div>
                    <div style={{ fontSize: 10, color: T.textMut }}>{m.cost < 0 ? 'cost saving' : 'cost'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: Emissions Trajectories */}
        {tab === 4 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
              {SECTORS.map(s => (
                <button key={s.id} onClick={() => setSelected(s.id)} style={{
                  padding: '6px 12px', borderRadius: 20, border: `2px solid ${selected === s.id ? s.color : 'transparent'}`,
                  background: selected === s.id ? s.color + '22' : T.surface,
                  color: selected === s.id ? s.color : T.textSec, cursor: 'pointer', fontSize: 12, fontWeight: 600
                }}>{s.icon} {s.gics}</button>
              ))}
            </div>
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24 }}>
              <h3 style={{ color: T.navy, margin: '0 0 4px', fontSize: 15 }}>{sector.gics} Emissions Trajectory vs. SBTi Target</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={sector.trajectory}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={v => `${(v/1000).toFixed(1)}Gt`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={v => v ? [`${(v/1000).toFixed(2)} GtCO₂e`] : ['N/A']} />
                  <Legend />
                  <Line dataKey="actual" name="Actual" stroke={sector.color} strokeWidth={2.5} connectNulls={false} />
                  <Line dataKey="target" name="SBTi Target" stroke={T.blue} strokeWidth={2} strokeDasharray="6 3" connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
