import React, { useState, useMemo } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, ReferenceLine
} from 'recharts';

const T = {
  bg: '#f6f4f0', surface: '#ffffff', surfaceH: '#f0ede7', border: '#e5e0d8',
  navy: '#1b3a5c', navyL: '#2c5a8c', gold: '#c5a96a', sage: '#5a8a6a',
  text: '#1b3a5c', textSec: '#5c6b7e', textMut: '#9aa3ae', red: '#dc2626',
  green: '#16a34a', amber: '#d97706', blue: '#2563eb', orange: '#ea580c',
  purple: '#7c3aed', teal: '#0891b2',
  card: '#ffffff', sub: '#5c6b7e', indigo: '#4f46e5', font: "'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono: "'JetBrains Mono','SF Mono','Fira Code',monospace"
};

// ─── S-CURVE MODEL: f(t) = L / (1 + exp(-k(t - t_mid))) ────────────────────
function sCurve(t, k, t_mid, L) {
  return L / (1 + Math.exp(-k * (t - t_mid)));
}

// Learning curve cost reduction: LCOE(t) = LCOE_0 * (1 - r)^t
function learningCurve(t, lcoe0, rate) {
  return lcoe0 * Math.pow(1 - rate, t);
}

// ─── TECHNOLOGY UNIVERSE ─────────────────────────────────────────────────────
const TECHNOLOGIES = [
  {
    id: 'solar',     name: 'Solar PV',            incumbent: 'Coal Power',          sector: 'Power',
    color: T.amber,  icon: '☀️',
    s_curve: { k: 0.22, t_mid: 2028, L: 45 },   // % market share by 2050
    lcoe: { base: 38, rate: 0.12 },               // USD/MWh, 12%/yr cost reduction
    current_share: 4.5,
    stranded_capacity_gw: 2100,
    stranded_value_usd_bn: 890,
    job_displacement_k: 420,
    green_jobs_k: 1200,
    crossover_year: 2031,
    scenario_crossover: { 'Current Policies': 2038, 'Below 2°C': 2031, 'Net Zero 2050': 2028 },
  },
  {
    id: 'wind',      name: 'Wind (Onshore+Off)',  incumbent: 'Gas Power',           sector: 'Power',
    color: T.blue,   icon: '💨',
    s_curve: { k: 0.18, t_mid: 2030, L: 38 },
    lcoe: { base: 45, rate: 0.09 },
    current_share: 7.2,
    stranded_capacity_gw: 1400,
    stranded_value_usd_bn: 620,
    job_displacement_k: 280,
    green_jobs_k: 850,
    crossover_year: 2034,
    scenario_crossover: { 'Current Policies': 2040, 'Below 2°C': 2034, 'Net Zero 2050': 2030 },
  },
  {
    id: 'ev',        name: 'Electric Vehicles',   incumbent: 'ICE Vehicles',         sector: 'Transport',
    color: T.green,  icon: '⚡',
    s_curve: { k: 0.25, t_mid: 2029, L: 95 },
    lcoe: { base: 220, rate: 0.08 },              // USD/MWh equiv (battery cost $/kWh×65)
    current_share: 15,
    stranded_capacity_gw: 0,
    stranded_value_usd_bn: 1800,                   // stranded ICE production assets
    job_displacement_k: 1400,
    green_jobs_k: 1800,
    crossover_year: 2030,
    scenario_crossover: { 'Current Policies': 2036, 'Below 2°C': 2030, 'Net Zero 2050': 2027 },
  },
  {
    id: 'heat_pump', name: 'Heat Pumps',          incumbent: 'Gas Boilers',          sector: 'Buildings',
    color: T.orange, icon: '🏠',
    s_curve: { k: 0.20, t_mid: 2031, L: 80 },
    lcoe: { base: 180, rate: 0.07 },
    current_share: 8,
    stranded_capacity_gw: 0,
    stranded_value_usd_bn: 320,
    job_displacement_k: 180,
    green_jobs_k: 420,
    crossover_year: 2033,
    scenario_crossover: { 'Current Policies': 2040, 'Below 2°C': 2033, 'Net Zero 2050': 2030 },
  },
  {
    id: 'green_h2',  name: 'Green Hydrogen',      incumbent: 'Grey Hydrogen / Fossil', sector: 'Industry',
    color: T.teal,   icon: '⚗️',
    s_curve: { k: 0.14, t_mid: 2035, L: 55 },
    lcoe: { base: 5.5, rate: 0.10 },              // USD/kg
    current_share: 0.3,
    stranded_capacity_gw: 0,
    stranded_value_usd_bn: 540,
    job_displacement_k: 95,
    green_jobs_k: 480,
    crossover_year: 2038,
    scenario_crossover: { 'Current Policies': 2045, 'Below 2°C': 2038, 'Net Zero 2050': 2034 },
  },
  {
    id: 'dac',       name: 'Direct Air Capture',  incumbent: 'Residual Emissions',    sector: 'CDR',
    color: T.purple, icon: '🔬',
    s_curve: { k: 0.16, t_mid: 2038, L: 20 },
    lcoe: { base: 400, rate: 0.15 },              // USD/tCO2
    current_share: 0.01,
    stranded_capacity_gw: 0,
    stranded_value_usd_bn: 0,
    job_displacement_k: 0,
    green_jobs_k: 280,
    crossover_year: 2042,
    scenario_crossover: { 'Current Policies': 2050, 'Below 2°C': 2042, 'Net Zero 2050': 2038 },
  },
];

function buildTechTrajectory(tech, scenario) {
  const years = Array.from({ length: 27 }, (_, i) => 2024 + i);
  return years.map(yr => {
    const share = sCurve(yr, tech.s_curve.k, tech.s_curve.t_mid, tech.s_curve.L);
    const cost = learningCurve(yr - 2024, tech.lcoe.base, tech.lcoe.rate);
    const incumbentStart = 100 - (tech.current_share || 0);
    const incumbentShare = Math.max(0, incumbentStart - share * 0.9);
    return { year: yr, market_share: share, incumbent_share: incumbentShare, cost_reduction: cost };
  });
}

const SCENARIOS_LIST = ['Current Policies', 'Below 2°C', 'Net Zero 2050'];
const TABS = ['S-Curve Adoption', 'Cost Learning Curves', 'Disruption Timeline', 'Job Transition', 'Scenario Sensitivity'];

export default function TechDisplacementModelerPage() {
  const [tab, setTab] = useState(0);
  const [selectedTech, setSelectedTech] = useState('solar');
  const [scenario, setScenario] = useState('Net Zero 2050');

  const tech = TECHNOLOGIES.find(t => t.id === selectedTech);
  const trajectory = useMemo(() => buildTechTrajectory(tech, scenario), [tech, scenario]);

  // All tech S-curves for comparison
  const allTechData = useMemo(() => {
    const years = Array.from({ length: 27 }, (_, i) => 2024 + i);
    return years.map(yr => {
      const row = { year: yr };
      TECHNOLOGIES.forEach(t => {
        row[t.id] = sCurve(yr, t.s_curve.k, t.s_curve.t_mid, t.s_curve.L);
      });
      return row;
    });
  }, []);

  // Cost learning data
  const costData = useMemo(() => {
    const years = Array.from({ length: 27 }, (_, i) => 2024 + i);
    return years.map(yr => {
      const row = { year: yr };
      TECHNOLOGIES.forEach(t => {
        row[t.id] = learningCurve(yr - 2024, t.lcoe.base, t.lcoe.rate);
      });
      return row;
    });
  }, []);

  const disruption = useMemo(() =>
    TECHNOLOGIES.map(t => ({
      name: t.name,
      icon: t.icon,
      color: t.color,
      incumbent: t.incumbent,
      sector: t.sector,
      crossover: t.scenario_crossover[scenario],
      stranded_value: t.stranded_value_usd_bn,
      displacement: t.job_displacement_k,
      green_jobs: t.green_jobs_k,
      current_share: t.current_share,
    })), [scenario]);

  const totalStrandedVal = TECHNOLOGIES.reduce((s, t) => s + t.stranded_value_usd_bn, 0);
  const totalDisplacement = TECHNOLOGIES.reduce((s, t) => s + t.job_displacement_k, 0);
  const totalGreenJobs = TECHNOLOGIES.reduce((s, t) => s + t.green_jobs_k, 0);

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: T.navy, padding: '24px 32px 0', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ color: T.gold, fontFamily: T.mono, fontSize: 11, letterSpacing: 2, marginBottom: 4 }}>EP-CA3 · TECH DISPLACEMENT MODELER</div>
            <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: 0 }}>Technology Displacement & Disruption Intelligence</h1>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>
              6 Technologies · S-Curve Adoption · Learning Curves · Crossover Analysis · Job Transition · Scenario Sensitivity
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {[
              { label: 'Stranded Assets', val: `$${(totalStrandedVal / 1000).toFixed(1)}T`, col: T.red },
              { label: 'Jobs Displaced', val: `${(totalDisplacement / 1000).toFixed(1)}M`, col: T.orange },
              { label: 'Green Jobs Created', val: `${(totalGreenJobs / 1000).toFixed(1)}M`, col: T.green },
            ].map(m => (
              <div key={m.label} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 16px', textAlign: 'right' }}>
                <div style={{ color: '#94a3b8', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{m.label}</div>
                <div style={{ color: m.col, fontSize: 20, fontWeight: 700, fontFamily: T.mono }}>{m.val}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Scenario selector */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {SCENARIOS_LIST.map(s => (
            <button key={s} onClick={() => setScenario(s)} style={{
              padding: '6px 14px', borderRadius: 20, border: `2px solid ${scenario === s ? T.gold : 'transparent'}`,
              background: scenario === s ? T.gold + '22' : 'rgba(255,255,255,0.06)',
              color: scenario === s ? T.gold : '#94a3b8', cursor: 'pointer', fontSize: 12, fontWeight: 600
            }}>{s}</button>
          ))}
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

        {/* TAB 0: S-Curve Adoption */}
        {tab === 0 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              {TECHNOLOGIES.map(t => (
                <button key={t.id} onClick={() => setSelectedTech(t.id)} style={{
                  padding: '6px 14px', borderRadius: 20, border: `2px solid ${selectedTech === t.id ? t.color : 'transparent'}`,
                  background: selectedTech === t.id ? t.color + '22' : T.surface,
                  color: selectedTech === t.id ? t.color : T.textSec, cursor: 'pointer', fontSize: 12, fontWeight: 600
                }}>{t.icon} {t.name}</button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>
              <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24 }}>
                <h3 style={{ color: T.navy, margin: '0 0 4px', fontSize: 15 }}>{tech.name} — S-Curve Adoption vs. {tech.incumbent}</h3>
                <p style={{ color: T.textSec, fontSize: 12, margin: '0 0 16px' }}>
                  Logistic growth: f(t) = L / [1 + exp(−k·(t − t_mid))] · k={tech.s_curve.k} · t_mid={tech.s_curve.t_mid} · L={tech.s_curve.L}%
                </p>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={trajectory}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={v => [`${v.toFixed(1)}%`]} />
                    <Legend />
                    <Area dataKey="market_share" name={tech.name} stroke={tech.color} fill={tech.color} fillOpacity={0.2} strokeWidth={2} />
                    <Area dataKey="incumbent_share" name={tech.incumbent} stroke={T.red} fill={T.red} fillOpacity={0.1} strokeWidth={2} strokeDasharray="4 4" />
                    <ReferenceLine x={tech.scenario_crossover[scenario]} stroke={T.gold} strokeDasharray="4 4"
                      label={{ value: `Crossover ${tech.scenario_crossover[scenario]}`, fill: T.gold, fontSize: 11 }} />
                    <ReferenceLine y={50} stroke={T.textMut} strokeDasharray="2 2" label={{ value: '50%', fill: T.textMut, fontSize: 10, position: 'left' }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: 'Current Market Share', val: `${tech.current_share}%`, col: tech.color },
                  { label: `Market Crossover (${scenario})`, val: tech.scenario_crossover[scenario], col: T.gold },
                  { label: 'Max Penetration', val: `${tech.s_curve.L}%`, col: T.green },
                  { label: 'Incumbent at Risk', val: tech.incumbent, col: T.red },
                  { label: 'Stranded Value', val: `$${tech.stranded_value_usd_bn}B`, col: T.orange },
                ].map(m => (
                  <div key={m.label} style={{ background: T.surface, borderRadius: 8, border: `1px solid ${T.border}`, padding: 14 }}>
                    <div style={{ fontSize: 10, color: T.textMut, textTransform: 'uppercase', letterSpacing: 1 }}>{m.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, fontFamily: T.mono, color: m.col, marginTop: 4 }}>{m.val}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* All tech comparison */}
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24 }}>
              <h3 style={{ color: T.navy, margin: '0 0 16px', fontSize: 15 }}>All Technology S-Curves — Comparative Adoption (2024–2050)</h3>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={allTechData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v, n) => [`${v.toFixed(1)}%`, TECHNOLOGIES.find(t => t.id === n)?.name || n]} />
                  <Legend formatter={n => TECHNOLOGIES.find(t => t.id === n)?.name || n} />
                  {TECHNOLOGIES.map(t => (
                    <Line key={t.id} dataKey={t.id} stroke={t.color} strokeWidth={2} dot={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* TAB 1: Cost Learning Curves */}
        {tab === 1 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24, marginBottom: 20 }}>
              <h3 style={{ color: T.navy, margin: '0 0 4px', fontSize: 15 }}>Technology Cost Learning Curves — 2024–2050</h3>
              <p style={{ color: T.textSec, fontSize: 12, margin: '0 0 16px' }}>
                Exponential Cost Learning Model: LCOE(t) = LCOE₀ × (1 − r)^t where r = annual learning rate
              </p>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={costData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} label={{ value: 'Cost ($/unit)', angle: -90, position: 'insideLeft', fill: T.textSec, fontSize: 11 }} />
                  <Tooltip formatter={(v, n) => [`${v.toFixed(1)}`, TECHNOLOGIES.find(t => t.id === n)?.name || n]} />
                  <Legend formatter={n => TECHNOLOGIES.find(t => t.id === n)?.name || n} />
                  {TECHNOLOGIES.map(t => (
                    <Line key={t.id} dataKey={t.id} stroke={t.color} strokeWidth={2} dot={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
              {TECHNOLOGIES.map(t => {
                const cost2030 = learningCurve(6, t.lcoe.base, t.lcoe.rate);
                const cost2040 = learningCurve(16, t.lcoe.base, t.lcoe.rate);
                const cost2050 = learningCurve(26, t.lcoe.base, t.lcoe.rate);
                return (
                  <div key={t.id} style={{ background: T.surface, borderRadius: 8, border: `1px solid ${T.border}`, padding: 16 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                      <span style={{ fontSize: 20 }}>{t.icon}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>{t.name}</div>
                        <div style={{ fontSize: 11, color: T.textSec }}>Learning rate: {(t.lcoe.rate * 100).toFixed(0)}%/yr</div>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                      {[['2024', t.lcoe.base], ['2030', cost2030], ['2040', cost2040], ['2050', cost2050]].slice(0, 3).map(([yr, val]) => (
                        <div key={yr} style={{ background: T.bg, borderRadius: 6, padding: 8, textAlign: 'center' }}>
                          <div style={{ fontSize: 10, color: T.textMut }}>{yr}</div>
                          <div style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 700, color: t.color }}>{val.toFixed(0)}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: 8, fontSize: 11, color: T.textSec }}>
                      2050: <span style={{ color: T.green, fontWeight: 700, fontFamily: T.mono }}>{cost2050.toFixed(1)}</span> ({t.lcoe.base > 0 ? ((1 - cost2050/t.lcoe.base)*100).toFixed(0) : '—'}% reduction)
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: Disruption Timeline */}
        {tab === 2 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24, marginBottom: 20 }}>
              <h3 style={{ color: T.navy, margin: '0 0 8px', fontSize: 15 }}>Market Crossover Timeline — {scenario}</h3>
              <p style={{ color: T.textSec, fontSize: 12, margin: '0 0 20px' }}>Year when new technology reaches 50% market share, displacing incumbent.</p>
              <div style={{ position: 'relative', paddingLeft: 20 }}>
                <div style={{ position: 'absolute', left: 20, top: 0, bottom: 0, width: 2, background: T.border }} />
                {disruption.sort((a, b) => a.crossover - b.crossover).map((d, i) => (
                  <div key={d.name} style={{ display: 'flex', gap: 16, marginBottom: 20, position: 'relative', paddingLeft: 40 }}>
                    <div style={{ position: 'absolute', left: 12, top: 8, width: 18, height: 18, borderRadius: '50%', background: d.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>
                      {d.icon}
                    </div>
                    <div style={{ flex: 1, background: T.bg, borderRadius: 8, padding: '12px 16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontWeight: 700, color: T.navy, fontSize: 14 }}>{d.name}</div>
                          <div style={{ fontSize: 12, color: T.textSec }}>Displaces: {d.incumbent}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontFamily: T.mono, fontSize: 22, fontWeight: 700, color: d.color }}>{d.crossover}</div>
                          <div style={{ fontSize: 11, color: T.textMut }}>50% crossover</div>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginTop: 10 }}>
                        <div style={{ background: T.surface, borderRadius: 6, padding: 8 }}>
                          <div style={{ fontSize: 10, color: T.textMut }}>Stranded Value</div>
                          <div style={{ fontFamily: T.mono, fontWeight: 700, color: T.red }}>${d.stranded_value}B</div>
                        </div>
                        <div style={{ background: T.surface, borderRadius: 6, padding: 8 }}>
                          <div style={{ fontSize: 10, color: T.textMut }}>Jobs Displaced</div>
                          <div style={{ fontFamily: T.mono, fontWeight: 700, color: T.orange }}>{d.displacement}K</div>
                        </div>
                        <div style={{ background: T.surface, borderRadius: 6, padding: 8 }}>
                          <div style={{ fontSize: 10, color: T.textMut }}>Green Jobs</div>
                          <div style={{ fontFamily: T.mono, fontWeight: 700, color: T.green }}>{d.green_jobs}K</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Job Transition */}
        {tab === 3 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24 }}>
                <h3 style={{ color: T.navy, margin: '0 0 16px', fontSize: 15 }}>Job Displacement vs. Green Job Creation</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={TECHNOLOGIES.map(t => ({ name: t.name.split(' ')[0], displaced: -t.job_displacement_k, created: t.green_jobs_k, color: t.color }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={v => `${v}K`} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => [`${Math.abs(v)}K jobs`]} />
                    <Legend />
                    <Bar dataKey="created" name="Green Jobs Created" fill={T.green} opacity={0.8} radius={[4,4,0,0]} />
                    <Bar dataKey="displaced" name="Jobs Displaced" fill={T.red} opacity={0.7} radius={[0,0,4,4]} />
                    <ReferenceLine y={0} stroke={T.navy} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24 }}>
                <h3 style={{ color: T.navy, margin: '0 0 12px', fontSize: 15 }}>Net Employment Impact</h3>
                {TECHNOLOGIES.map(t => {
                  const net = t.green_jobs_k - t.job_displacement_k;
                  return (
                    <div key={t.id} style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: T.navy }}>{t.icon} {t.name}</span>
                        <span style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 700, color: net > 0 ? T.green : T.red }}>
                          {net > 0 ? '+' : ''}{net}K
                        </span>
                      </div>
                      <div style={{ height: 6, background: T.border, borderRadius: 3 }}>
                        <div style={{ height: '100%', width: `${Math.min(100, Math.abs(net) / 5)}%`, background: net > 0 ? T.green : T.red, borderRadius: 3 }} />
                      </div>
                    </div>
                  );
                })}
                <div style={{ marginTop: 16, padding: 12, background: T.green + '11', borderRadius: 8, border: `1px solid ${T.green}33` }}>
                  <div style={{ fontSize: 12, color: T.textSec }}>Total Net Employment</div>
                  <div style={{ fontFamily: T.mono, fontSize: 22, fontWeight: 700, color: T.green }}>
                    +{((totalGreenJobs - totalDisplacement) / 1000).toFixed(1)}M jobs
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Scenario Sensitivity */}
        {tab === 4 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24 }}>
              <h3 style={{ color: T.navy, margin: '0 0 16px', fontSize: 15 }}>Crossover Year Sensitivity — All Technologies × All Scenarios</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: T.navy }}>
                      <th style={{ padding: '10px 16px', color: '#fff', textAlign: 'left' }}>Technology</th>
                      {SCENARIOS_LIST.map(s => <th key={s} style={{ padding: '10px 16px', color: '#fff', textAlign: 'center' }}>{s}</th>)}
                      <th style={{ padding: '10px 16px', color: '#fff', textAlign: 'center' }}>Δ Years (CP→NZ)</th>
                      <th style={{ padding: '10px 16px', color: '#fff', textAlign: 'right' }}>Stranded Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {TECHNOLOGIES.map((t, i) => {
                      const delta = t.scenario_crossover['Current Policies'] - t.scenario_crossover['Net Zero 2050'];
                      return (
                        <tr key={t.id} style={{ background: i % 2 === 0 ? T.surface : T.bg }}>
                          <td style={{ padding: '10px 16px' }}>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                              <span>{t.icon}</span>
                              <div>
                                <div style={{ fontWeight: 600, color: T.navy }}>{t.name}</div>
                                <div style={{ fontSize: 11, color: T.textSec }}>{t.sector}</div>
                              </div>
                            </div>
                          </td>
                          {SCENARIOS_LIST.map(s => (
                            <td key={s} style={{ padding: '10px 16px', textAlign: 'center', fontFamily: T.mono, fontWeight: 700, color: s === scenario ? t.color : T.navy }}>
                              {t.scenario_crossover[s]}
                            </td>
                          ))}
                          <td style={{ padding: '10px 16px', textAlign: 'center', fontFamily: T.mono, fontWeight: 700, color: T.green }}>
                            +{delta} yr faster
                          </td>
                          <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: T.mono, color: T.red, fontWeight: 700 }}>
                            ${t.stranded_value_usd_bn}B
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
