import React, { useState, useMemo } from 'react';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  Cell, ReferenceLine, PieChart, Pie, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

const T = {
  bg: '#f6f4f0', surface: '#ffffff', border: '#e5e0d8', navy: '#1b3a5c',
  navyL: '#2c5a8c', gold: '#c5a96a', textSec: '#5c6b7e', textMut: '#9aa3ae',
  red: '#dc2626', green: '#16a34a', amber: '#d97706', blue: '#2563eb',
  orange: '#ea580c', purple: '#7c3aed', teal: '#0891b2', sage: '#5a8a6a',
  font: "'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono: "'JetBrains Mono','SF Mono','Fira Code',monospace"
};

const TABS = ['Regional Overview', 'ASEAN Taxonomy (Traffic Light)', 'GCC Net Zero Targets', 'Coal Retirement (VN/ID/PH)', 'Green Sukuk & Islamic Finance', 'Hydrogen Export Hubs'];

const ASEAN_COUNTRIES = [
  { country: 'Indonesia', gdp: 1.32, emissions: 0.62, reTarget: 23, coalGW: 42, jetpFunding: 20, ndc: '31.89% (unconditional)' },
  { country: 'Vietnam', gdp: 0.41, emissions: 0.35, reTarget: 30, coalGW: 25, jetpFunding: 15.5, ndc: '15.8% (unconditional)' },
  { country: 'Thailand', gdp: 0.50, emissions: 0.26, reTarget: 30, coalGW: 6, jetpFunding: 0, ndc: '30% below BAU' },
  { country: 'Philippines', gdp: 0.40, emissions: 0.16, reTarget: 35, coalGW: 12, jetpFunding: 0, ndc: '75% (conditional)' },
  { country: 'Malaysia', gdp: 0.40, emissions: 0.27, reTarget: 31, coalGW: 13, jetpFunding: 0, ndc: '45% intensity' },
  { country: 'Singapore', gdp: 0.40, emissions: 0.05, reTarget: 4, coalGW: 0, jetpFunding: 0, ndc: 'Peak ~65 Mt by 2030' },
];

const GCC_TARGETS = [
  { country: 'UAE', netZeroYear: 2050, currentEmissions: 0.22, h2Target: '1.4 MMTPA', greenBonds: 12.5, ndc: 'Net zero 2050', color: T.green },
  { country: 'Saudi Arabia', netZeroYear: 2060, currentEmissions: 0.67, h2Target: '4 MMTPA', greenBonds: 8.0, ndc: 'Net zero 2060', color: T.blue },
  { country: 'Qatar', netZeroYear: 2030, currentEmissions: 0.11, h2Target: '0.5 MMTPA', greenBonds: 3.2, ndc: '25% by 2030 (CCS)', color: T.teal },
  { country: 'Bahrain', netZeroYear: 2060, currentEmissions: 0.04, h2Target: '0.1 MMTPA', greenBonds: 0.8, ndc: 'Net zero 2060', color: T.purple },
  { country: 'Oman', netZeroYear: 2050, currentEmissions: 0.08, h2Target: '1 MMTPA', greenBonds: 1.5, ndc: 'Net zero 2050', color: T.orange },
  { country: 'Kuwait', netZeroYear: 2060, currentEmissions: 0.10, h2Target: '0.2 MMTPA', greenBonds: 0.5, ndc: 'Net zero 2060', color: T.amber },
];

const TAXONOMY_COMPARISON = [
  { sector: 'Energy', eu: 'Green', asean: 'Green', notes: 'Solar, wind, hydro aligned' },
  { sector: 'Gas Power', eu: 'Transitional', asean: 'Amber', notes: 'ASEAN allows transition path' },
  { sector: 'Coal (existing)', eu: 'Red', asean: 'Red', notes: 'Both exclude new coal' },
  { sector: 'Coal Retrofit CCS', eu: 'Red', asean: 'Amber', notes: 'ASEAN allows CCS pathway' },
  { sector: 'Palm Oil', eu: 'Not covered', asean: 'Amber', notes: 'ASEAN-specific with RSPO cert' },
  { sector: 'Nuclear', eu: 'Transitional', asean: 'Not covered', notes: 'No ASEAN nuclear framework' },
  { sector: 'Agriculture', eu: 'Limited', asean: 'Amber/Green', notes: 'Rice methane, sustainable palm' },
  { sector: 'Transport EV', eu: 'Green', asean: 'Green', notes: 'EV manufacture and charging' },
];

const COAL_PHASE = {
  vietnam: [
    { year: 2024, capacity: 25, scenario_jetp: 25, scenario_base: 25, scenario_delay: 25 },
    { year: 2028, capacity: 20, scenario_jetp: 18, scenario_base: 22, scenario_delay: 26 },
    { year: 2032, capacity: 15, scenario_jetp: 10, scenario_base: 18, scenario_delay: 27 },
    { year: 2036, capacity: 10, scenario_jetp: 5, scenario_base: 14, scenario_delay: 25 },
    { year: 2040, capacity: 5, scenario_jetp: 0, scenario_base: 8, scenario_delay: 22 },
    { year: 2045, capacity: 0, scenario_jetp: 0, scenario_base: 3, scenario_delay: 15 },
  ],
  indonesia: [
    { year: 2024, capacity: 42, scenario_jetp: 42, scenario_base: 42, scenario_delay: 42 },
    { year: 2028, capacity: 40, scenario_jetp: 35, scenario_base: 40, scenario_delay: 44 },
    { year: 2032, capacity: 35, scenario_jetp: 25, scenario_base: 36, scenario_delay: 45 },
    { year: 2036, capacity: 28, scenario_jetp: 15, scenario_base: 30, scenario_delay: 42 },
    { year: 2040, capacity: 18, scenario_jetp: 5, scenario_base: 22, scenario_delay: 38 },
    { year: 2045, capacity: 8, scenario_jetp: 0, scenario_base: 12, scenario_delay: 30 },
  ],
  philippines: [
    { year: 2024, capacity: 12, scenario_jetp: 12, scenario_base: 12, scenario_delay: 12 },
    { year: 2028, capacity: 12, scenario_jetp: 10, scenario_base: 12, scenario_delay: 13 },
    { year: 2032, capacity: 10, scenario_jetp: 7, scenario_base: 11, scenario_delay: 13 },
    { year: 2036, capacity: 8, scenario_jetp: 4, scenario_base: 9, scenario_delay: 12 },
    { year: 2040, capacity: 5, scenario_jetp: 1, scenario_base: 6, scenario_delay: 11 },
    { year: 2045, capacity: 2, scenario_jetp: 0, scenario_base: 3, scenario_delay: 9 },
  ],
};

const SUKUK_PIPELINE = [
  { issuer: 'Saudi Arabia (PIF)', size: 5.0, type: 'Green Sukuk', year: 2024, sector: 'RE + H2', rating: 'A1' },
  { issuer: 'Indonesia (Sovereign)', size: 3.2, type: 'Green Sukuk', year: 2024, sector: 'Transport + RE', rating: 'Baa2' },
  { issuer: 'UAE (Masdar)', size: 2.5, type: 'Green Sukuk', year: 2025, sector: 'Solar + Wind', rating: 'AA-' },
  { issuer: 'Malaysia (CIMB)', size: 1.8, type: 'SRI Sukuk', year: 2024, sector: 'Social Housing', rating: 'A3' },
  { issuer: 'Qatar (QNB)', size: 1.5, type: 'Green Sukuk', year: 2025, sector: 'CCS + LNG', rating: 'Aa3' },
  { issuer: 'Turkey (TSKB)', size: 0.8, type: 'Green Sukuk', year: 2025, sector: 'Wind', rating: 'B3' },
];

const H2_PROJECTS = [
  { project: 'NEOM Green H2', country: 'Saudi Arabia', capacity: '1.2 MMTPA', investment: 8.4, status: 'Under Construction', partner: 'ACWA/Air Products', timeline: '2026' },
  { project: 'AMAN Green H2', country: 'Oman', capacity: '0.5 MMTPA', investment: 4.0, status: 'FID', partner: 'ACME/Tabreed', timeline: '2027' },
  { project: 'Masdar H2', country: 'UAE', capacity: '0.2 MMTPA', investment: 2.1, status: 'Planning', partner: 'Masdar/ENGIE', timeline: '2028' },
  { project: 'Duqm Green H2', country: 'Oman', capacity: '0.3 MMTPA', investment: 3.5, status: 'FID', partner: 'Intercontinental Energy', timeline: '2027' },
  { project: 'Saudi Blue H2', country: 'Saudi Arabia', capacity: '2.0 MMTPA', investment: 5.0, status: 'Operating', partner: 'Aramco/SABIC', timeline: '2024' },
];

const REFERENCES = [
  { id: 'R1', title: 'ASEAN Taxonomy Board — Version 2 (2024)', url: '#' },
  { id: 'R2', title: 'UAE NDC (Updated 2023) — Net Zero 2050 Strategy', url: '#' },
  { id: 'R3', title: 'Saudi Vision 2030 — Green Economy Pillar', url: '#' },
  { id: 'R4', title: 'IRENA RE Statistics — MENA & ASEAN 2024', url: '#' },
  { id: 'R5', title: 'Indonesia JETP Comprehensive Investment Plan', url: '#' },
  { id: 'R6', title: 'IIFM Green Sukuk Market Report 2024', url: '#' },
];

const card = { background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20, marginTop: 16 };
const badge = (c) => ({ display: 'inline-block', padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: c + '18', color: c });
const trafficLight = (c) => {
  const map = { Green: T.green, Amber: T.amber, Red: T.red, 'Transitional': T.blue, 'Not covered': T.textMut, 'Limited': T.textMut, 'Amber/Green': T.sage };
  return badge(map[c] || T.textMut);
};

export default function AseanGccTransitionPage() {
  const [tab, setTab] = useState(0);
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [coalPhaseCountry, setCoalPhaseCountry] = useState('indonesia');
  const [jetpMode, setJetpMode] = useState('scenario_jetp');

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh' }}>
      <div style={{ background: T.navy, padding: '24px 32px 0', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ color: T.gold, fontFamily: T.mono, fontSize: 11, letterSpacing: 2, marginBottom: 4 }}>EP-CJ2 · ASEAN & GCC TRANSITION HUB</div>
            <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: 0 }}>ASEAN & GCC Transition Intelligence</h1>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>
              ASEAN Taxonomy · GCC Net Zero · Coal Retirement · Green Sukuk · Hydrogen Export Hubs
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {[
              { label: 'ASEAN Coal', val: '79 GW', col: T.red },
              { label: 'Green Sukuk Market', val: '$50B+', col: T.green },
              { label: 'H2 Pipeline', val: '$23B', col: T.teal },
            ].map(x => (
              <div key={x.label} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 16px', textAlign: 'right' }}>
                <div style={{ color: '#94a3b8', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{x.label}</div>
                <div style={{ color: x.col, fontSize: 18, fontWeight: 700, fontFamily: T.mono }}>{x.val}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 0 }}>
          {TABS.map((t2, i) => (
            <button key={i} onClick={() => setTab(i)} style={{
              padding: '10px 18px', border: 'none', background: 'transparent', cursor: 'pointer',
              color: tab === i ? T.gold : '#94a3b8', fontWeight: tab === i ? 700 : 400, fontSize: 12,
              borderBottom: tab === i ? `2px solid ${T.gold}` : '2px solid transparent'
            }}>{t2}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 32px 32px' }}>

        {/* Tab 0 — Regional Overview */}
        {tab === 0 && (
          <div style={{ paddingTop: 24 }}>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>ASEAN Country Dashboard</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.bg }}>
                    {['Country', 'GDP ($T)', 'Emissions (GtCO2)', 'RE Target %', 'Coal (GW)', 'JETP ($B)', 'NDC'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', borderBottom: `1px solid ${T.border}`, color: T.textSec, fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ASEAN_COUNTRIES.map((c, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '8px 10px', fontWeight: 600 }}>{c.country}</td>
                      <td style={{ padding: '8px 10px', fontFamily: T.mono }}>{c.gdp}</td>
                      <td style={{ padding: '8px 10px', fontFamily: T.mono }}>{c.emissions}</td>
                      <td style={{ padding: '8px 10px' }}>{c.reTarget}%</td>
                      <td style={{ padding: '8px 10px', fontFamily: T.mono }}>{c.coalGW}</td>
                      <td style={{ padding: '8px 10px', fontFamily: T.mono }}>{c.jetpFunding || '--'}</td>
                      <td style={{ padding: '8px 10px', fontSize: 10, color: T.textSec }}>{c.ndc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>GCC Net Zero Commitments</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={GCC_TARGETS}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="country" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="currentEmissions" fill={T.red} name="Current Emissions (GtCO2)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="greenBonds" fill={T.green} name="Green Bonds ($B)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Tab 1 — ASEAN Taxonomy */}
        {tab === 1 && (
          <div style={{ paddingTop: 24 }}>
            <div style={card}>
              <h3 style={{ margin: '0 0 16px', color: T.navy, fontSize: 15 }}>ASEAN vs EU Taxonomy — Traffic Light Comparison</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.bg }}>
                    {['Sector', 'EU Classification', 'ASEAN Classification', 'Notes'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: `1px solid ${T.border}`, color: T.textSec }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TAXONOMY_COMPARISON.map((r, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>{r.sector}</td>
                      <td style={{ padding: '8px 12px' }}><span style={trafficLight(r.eu)}>{r.eu}</span></td>
                      <td style={{ padding: '8px 12px' }}><span style={trafficLight(r.asean)}>{r.asean}</span></td>
                      <td style={{ padding: '8px 12px', fontSize: 11, color: T.textSec }}>{r.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>ASEAN Taxonomy Sector Coverage</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={[
                    { name: 'Green', value: 35, fill: T.green },
                    { name: 'Amber', value: 40, fill: T.amber },
                    { name: 'Red', value: 15, fill: T.red },
                    { name: 'Not Covered', value: 10, fill: T.textMut },
                  ]} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {[T.green, T.amber, T.red, T.textMut].map((c, i) => <Cell key={i} fill={c} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Tab 2 — GCC Net Zero */}
        {tab === 2 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {GCC_TARGETS.slice(0, 3).map(g => (
                <div key={g.country} style={card}>
                  <div style={{ fontWeight: 700, fontSize: 16, color: T.navy }}>{g.country}</div>
                  <div style={{ fontFamily: T.mono, fontSize: 24, fontWeight: 700, color: g.color, margin: '8px 0' }}>Net Zero {g.netZeroYear}</div>
                  <div style={{ fontSize: 12, color: T.textSec, marginBottom: 4 }}>Emissions: {g.currentEmissions} GtCO2/yr</div>
                  <div style={{ fontSize: 12, color: T.textSec, marginBottom: 4 }}>H2 Target: {g.h2Target}</div>
                  <div style={{ fontSize: 12, color: T.textSec }}>Green Bonds: ${g.greenBonds}B</div>
                </div>
              ))}
            </div>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>GCC Emissions Reduction Pathways</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={[
                  { year: 2024, uae: 220, saudi: 670, qatar: 110, oman: 80 },
                  { year: 2030, uae: 190, saudi: 600, qatar: 85, oman: 65 },
                  { year: 2035, uae: 150, saudi: 500, qatar: 65, oman: 50 },
                  { year: 2040, uae: 100, saudi: 380, qatar: 45, oman: 35 },
                  { year: 2045, uae: 55, saudi: 250, qatar: 25, oman: 18 },
                  { year: 2050, uae: 0, saudi: 130, qatar: 10, oman: 0 },
                  { year: 2055, uae: 0, saudi: 60, qatar: 0, oman: 0 },
                  { year: 2060, uae: 0, saudi: 0, qatar: 0, oman: 0 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} label={{ value: 'MtCO2', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="uae" stroke={T.green} strokeWidth={2} name="UAE" />
                  <Line type="monotone" dataKey="saudi" stroke={T.blue} strokeWidth={2} name="Saudi Arabia" />
                  <Line type="monotone" dataKey="qatar" stroke={T.teal} strokeWidth={2} name="Qatar" />
                  <Line type="monotone" dataKey="oman" stroke={T.orange} strokeWidth={2} name="Oman" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Tab 3 — Coal Retirement */}
        {tab === 3 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              {['vietnam', 'indonesia', 'philippines'].map(c => (
                <button key={c} onClick={() => setCoalPhaseCountry(c)} style={{
                  padding: '6px 14px', borderRadius: 16, border: `2px solid ${coalPhaseCountry === c ? T.gold : 'transparent'}`,
                  background: coalPhaseCountry === c ? T.gold + '18' : T.surface, color: coalPhaseCountry === c ? T.navy : T.textSec,
                  cursor: 'pointer', fontSize: 12, fontWeight: 600, textTransform: 'capitalize'
                }}>{c}</button>
              ))}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                {[
                  { key: 'scenario_jetp', label: 'JETP Scenario', col: T.green },
                  { key: 'scenario_base', label: 'Baseline', col: T.blue },
                  { key: 'scenario_delay', label: 'Delayed', col: T.red },
                ].map(s => (
                  <button key={s.key} onClick={() => setJetpMode(s.key)} style={{
                    padding: '5px 12px', borderRadius: 16, border: `2px solid ${jetpMode === s.key ? s.col : 'transparent'}`,
                    background: jetpMode === s.key ? s.col + '18' : T.surface, color: jetpMode === s.key ? s.col : T.textSec,
                    cursor: 'pointer', fontSize: 11, fontWeight: 600
                  }}>{s.label}</button>
                ))}
              </div>
            </div>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>{coalPhaseCountry.charAt(0).toUpperCase() + coalPhaseCountry.slice(1)} — Coal Phase-Out (GW)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={COAL_PHASE[coalPhaseCountry]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey={jetpMode} fill={jetpMode === 'scenario_jetp' ? T.green + '40' : jetpMode === 'scenario_base' ? T.blue + '40' : T.red + '40'}
                    stroke={jetpMode === 'scenario_jetp' ? T.green : jetpMode === 'scenario_base' ? T.blue : T.red} name="Capacity (GW)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <h3 style={{ margin: '0 0 8px', color: T.navy, fontSize: 15 }}>JETP Financing Tracker</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {[
                  { country: 'Indonesia', total: 20, disbursed: 4.2, year: 2022, status: 'Active' },
                  { country: 'Vietnam', total: 15.5, disbursed: 2.8, year: 2022, status: 'Active' },
                  { country: 'Philippines', total: 0, disbursed: 0, year: 'N/A', status: 'Moratorium Only' },
                ].map(j => (
                  <div key={j.country} style={{ background: T.bg, borderRadius: 8, padding: 14 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: T.navy }}>{j.country}</div>
                    <div style={{ fontFamily: T.mono, fontSize: 20, color: j.total > 0 ? T.green : T.textMut, marginTop: 4 }}>${j.total}B</div>
                    <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>Disbursed: ${j.disbursed}B ({j.total > 0 ? ((j.disbursed / j.total) * 100).toFixed(0) : 0}%)</div>
                    <span style={badge(j.status === 'Active' ? T.green : T.textMut)}>{j.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4 — Green Sukuk */}
        {tab === 4 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {[
                { label: 'Total Green Sukuk Market', val: '$50B+', col: T.green },
                { label: '2024 Issuance', val: '$18.5B', col: T.blue },
                { label: 'Shariah-Compliant RE Finance', val: '$12B/yr', col: T.teal },
              ].map(x => (
                <div key={x.label} style={card}>
                  <div style={{ fontSize: 11, color: T.textMut, textTransform: 'uppercase', letterSpacing: 1 }}>{x.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: x.col, fontFamily: T.mono, marginTop: 4 }}>{x.val}</div>
                </div>
              ))}
            </div>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>Sukuk Pipeline Monitor</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.bg }}>
                    {['Issuer', 'Size ($B)', 'Type', 'Year', 'Sector', 'Rating'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', borderBottom: `1px solid ${T.border}`, color: T.textSec }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SUKUK_PIPELINE.map((s, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '8px 10px', fontWeight: 600 }}>{s.issuer}</td>
                      <td style={{ padding: '8px 10px', fontFamily: T.mono }}>{s.size}</td>
                      <td style={{ padding: '8px 10px' }}><span style={badge(T.green)}>{s.type}</span></td>
                      <td style={{ padding: '8px 10px' }}>{s.year}</td>
                      <td style={{ padding: '8px 10px', fontSize: 11, color: T.textSec }}>{s.sector}</td>
                      <td style={{ padding: '8px 10px', fontFamily: T.mono }}>{s.rating}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>Green Sukuk Issuance Growth</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={[
                  { year: 2018, issuance: 3.2 }, { year: 2019, issuance: 5.1 }, { year: 2020, issuance: 6.8 },
                  { year: 2021, issuance: 9.5 }, { year: 2022, issuance: 12.3 }, { year: 2023, issuance: 15.8 },
                  { year: 2024, issuance: 18.5 }, { year: 2025, issuance: 22 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} label={{ value: '$B', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="issuance" fill={T.green} name="Issuance ($B)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Tab 5 — Hydrogen Export Hubs */}
        {tab === 5 && (
          <div style={{ paddingTop: 24 }}>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>GCC Hydrogen Mega-Projects</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.bg }}>
                    {['Project', 'Country', 'Capacity', 'Investment ($B)', 'Status', 'Partner', 'Timeline'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', borderBottom: `1px solid ${T.border}`, color: T.textSec }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {H2_PROJECTS.map((p, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '8px 10px', fontWeight: 600 }}>{p.project}</td>
                      <td style={{ padding: '8px 10px' }}>{p.country}</td>
                      <td style={{ padding: '8px 10px', fontFamily: T.mono }}>{p.capacity}</td>
                      <td style={{ padding: '8px 10px', fontFamily: T.mono }}>${p.investment}B</td>
                      <td style={{ padding: '8px 10px' }}>
                        <span style={badge(p.status === 'Operating' ? T.green : p.status === 'Under Construction' ? T.blue : p.status === 'FID' ? T.amber : T.textMut)}>{p.status}</span>
                      </td>
                      <td style={{ padding: '8px 10px', fontSize: 11, color: T.textSec }}>{p.partner}</td>
                      <td style={{ padding: '8px 10px' }}>{p.timeline}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>H2 Export Cost Competitiveness ($/kg delivered)</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={[
                  { destination: 'Japan', neom: 3.8, oman: 4.2, australia: 5.1, chile: 5.5 },
                  { destination: 'S. Korea', neom: 3.5, oman: 4.0, australia: 4.8, chile: 5.2 },
                  { destination: 'EU', neom: 3.2, oman: 3.5, australia: 5.8, chile: 4.0 },
                  { destination: 'India', neom: 2.8, oman: 3.0, australia: 5.2, chile: 5.8 },
                ]} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="destination" type="category" tick={{ fontSize: 11 }} width={70} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="neom" fill={T.blue} name="Saudi NEOM" />
                  <Bar dataKey="oman" fill={T.teal} name="Oman" />
                  <Bar dataKey="australia" fill={T.orange} name="Australia" />
                  <Bar dataKey="chile" fill={T.purple} name="Chile" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <h3 style={{ margin: '0 0 8px', color: T.navy, fontSize: 15 }}>References</h3>
              {REFERENCES.map(r => (
                <div key={r.id} style={{ fontSize: 12, padding: '4px 0', color: T.textSec }}>
                  <span style={{ fontFamily: T.mono, color: T.navy, marginRight: 8 }}>[{r.id}]</span>{r.title}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
