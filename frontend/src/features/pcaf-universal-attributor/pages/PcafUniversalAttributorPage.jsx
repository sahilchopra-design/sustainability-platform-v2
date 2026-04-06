import React, { useState, useMemo } from 'react';
import {

  BarChart, Bar, LineChart, Line, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, ComposedChart, ReferenceLine
} from 'recharts';

const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const T = {
  bg: '#f6f4f0', surface: '#ffffff', border: '#e5e0d8', navy: '#1b3a5c',
  navyL: '#2c5a8c', gold: '#c5a96a', textSec: '#5c6b7e', textMut: '#9aa3ae',
  red: '#dc2626', green: '#16a34a', amber: '#d97706', blue: '#2563eb',
  orange: '#ea580c', purple: '#7c3aed', teal: '#0891b2', sage: '#5a8a6a',
  font: "'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono: "'JetBrains Mono','SF Mono','Fira Code',monospace"
};

const PCAF_CLASSES = [
  { cls: 1, name: 'Listed Equity & Corporate Bonds', formula: 'Attr = (Outstanding_i / EVIC_i) x Emissions_i', exposure: 4200, emissions: 185000, dq: 2.1,
    dqDesc: 'Reported Scope 1+2 verified by third party', example: 'Microsoft bond: ($50M / $2.1T EVIC) x 12.1M tCO2 = 288 tCO2' },
  { cls: 2, name: 'Business Loans & Unlisted Equity', formula: 'Attr = (Outstanding_i / (EVIC_i or Revenue_i)) x Emissions_i', exposure: 3800, emissions: 245000, dq: 3.2,
    dqDesc: 'Company-reported unverified or estimated from revenue', example: 'SME loan $2M to manufacturer (rev $20M): ($2M/$20M) x 5000 tCO2 = 500 tCO2' },
  { cls: 3, name: 'Project Finance', formula: 'Attr = (Outstanding_i / Total_Project_Cost_i) x Emissions_project', exposure: 1200, emissions: 82000, dq: 2.8,
    dqDesc: 'Project-level data from EIA or monitoring', example: 'Wind farm 20% financed: 0.20 x 1200 tCO2 lifecycle = 240 tCO2' },
  { cls: 4, name: 'Commercial Real Estate', formula: 'Attr = (Outstanding_i / Property_Value_i) x Emissions_building', exposure: 2100, emissions: 125000, dq: 3.5,
    dqDesc: 'EPC-based or floor area estimate', example: 'Office bldg: ($15M / $40M) x 2800 tCO2 = 1050 tCO2' },
  { cls: 5, name: 'Mortgages', formula: 'Attr = (Outstanding_i / Property_Value_i) x Emissions_building', exposure: 5600, emissions: 310000, dq: 3.8,
    dqDesc: 'EPC rating or national avg per floor area', example: 'Mortgage $300K / home $500K value x 8 tCO2/yr = 4.8 tCO2' },
  { cls: 6, name: 'Motor Vehicle Loans', formula: 'Attr = (Outstanding_i / Vehicle_Value_i) x Emissions_vehicle', exposure: 1800, emissions: 95000, dq: 2.5,
    dqDesc: 'Vehicle make/model emission factors', example: 'Auto loan $25K / $35K car x 4.2 tCO2/yr = 3.0 tCO2' },
  { cls: 7, name: 'Sovereign Debt', formula: 'Attr = (Outstanding_i / PPP_GDP_i) x Emissions_country', exposure: 6200, emissions: 420000, dq: 1.8,
    dqDesc: 'National GHG inventory (UNFCCC)', example: 'US Treasury $100M / $25.5T GDP x 5.2Gt CO2 = 20,392 tCO2' },
  { cls: 8, name: 'Other', formula: 'Attr = case-specific attribution based on asset characteristics', exposure: 800, emissions: 38000, dq: 4.2,
    dqDesc: 'Sector-average or estimation model', example: 'Hedge fund allocation: look-through or sector proxy' },
];

const DQ_SCORES = { 1: 'Audited GHG data', 2: 'Reported unverified', 3: 'Physical activity data', 4: 'Revenue-based estimate', 5: 'Asset class proxy' };
const DQ_COLORS = { 1: T.green, 2: '#22c55e', 3: T.amber, 4: T.orange, 5: T.red };

const totalExposure = PCAF_CLASSES.reduce((s, c) => s + c.exposure, 0);
const totalEmissions = PCAF_CLASSES.reduce((s, c) => s + c.emissions, 0);

const TARGET_YEARS = Array.from({ length: 8 }, (_, i) => {
  const year = 2020 + i;
  const target = 100 * Math.pow(0.93, i);
  const actual = 100 * Math.pow(0.95, i) * (1 + (sr(i * 31 + 10) * 2 - 1) * 0.025);
  return { year, target: +target.toFixed(1), actual: +actual.toFixed(1), gap: +(actual - target).toFixed(1) };
});

const WACI_SECTORS = [
  { sector: 'Energy', waci: 342, benchmark: 285, weight: 12 },
  { sector: 'Materials', waci: 198, benchmark: 165, weight: 8 },
  { sector: 'Industrials', waci: 85, benchmark: 72, weight: 15 },
  { sector: 'Utilities', waci: 410, benchmark: 350, weight: 6 },
  { sector: 'Consumer Disc.', waci: 28, benchmark: 32, weight: 14 },
  { sector: 'Consumer Staples', waci: 42, benchmark: 38, weight: 10 },
  { sector: 'Health Care', waci: 15, benchmark: 18, weight: 12 },
  { sector: 'Financials', waci: 8, benchmark: 10, weight: 10 },
  { sector: 'Tech', waci: 12, benchmark: 14, weight: 8 },
  { sector: 'Real Estate', waci: 65, benchmark: 55, weight: 5 },
];

const portfolioWACI = WACI_SECTORS.reduce((s, sec) => s + sec.waci * sec.weight / 100, 0);
const benchmarkWACI = WACI_SECTORS.reduce((s, sec) => s + sec.benchmark * sec.weight / 100, 0);

const TABS = ['Universal Attribution Dashboard', 'All 8 Asset Classes', 'Data Quality Heatmap', 'Attribution Formula Reference', 'Portfolio-Level WACI', 'Target Tracking & Gap Analysis'];
const card = { background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20, marginBottom: 16 };
const kpi = (label, value, sub, color = T.navy) => (
  <div style={{ background: T.surface, borderRadius: 8, border: `1px solid ${T.border}`, padding: '14px 18px', minWidth: 140, flex: 1 }}>
    <div style={{ fontFamily: T.mono, fontSize: 11, color: T.textMut, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{sub}</div>}
  </div>
);

export default function PcafUniversalAttributorPage() {
  const [tab, setTab] = useState(0);
  const [selectedClass, setSelectedClass] = useState(null);
  const [dqFilter, setDqFilter] = useState('All');
  const [improvePlan, setImprovePlan] = useState({});

  const avgDQ = +(PCAF_CLASSES.reduce((s, c) => s + c.dq * c.exposure, 0) / totalExposure).toFixed(1);

  const classChartData = PCAF_CLASSES.map(c => ({
    name: `Cls ${c.cls}`,
    exposure: c.exposure,
    emissions: Math.round(c.emissions / 1000),
    dq: c.dq,
    intensity: Math.round(c.emissions / c.exposure),
  }));

  const dqMatrix = PCAF_CLASSES.map(c => ({
    cls: `Class ${c.cls}`,
    name: c.name.substring(0, 20),
    dq: c.dq,
    score: Math.round(c.dq),
  }));

  const filteredClasses = dqFilter === 'All' ? PCAF_CLASSES : PCAF_CLASSES.filter(c => Math.round(c.dq) === +dqFilter);

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh' }}>
      <div style={{ background: T.navy, padding: '24px 32px 0', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ color: T.gold, fontFamily: T.mono, fontSize: 11, letterSpacing: 2, marginBottom: 4 }}>EP-CI6 . PCAF UNIVERSAL ATTRIBUTOR</div>
            <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: 0 }}>PCAF 8/8 Universal Financed Emissions Attributor</h1>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>
              All 8 Asset Classes . Attribution Formulas . Data Quality Heatmap . WACI . SBTi Target Tracking . Gap Analysis
            </p>
          </div>
          <select value={dqFilter} onChange={e => setDqFilter(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
            <option value="All">All DQ Scores</option>
            {[1, 2, 3, 4, 5].map(d => <option key={d} value={d}>DQ Score {d}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 0 }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)} style={{
              padding: '10px 14px', fontSize: 11, fontWeight: tab === i ? 700 : 500, cursor: 'pointer',
              background: tab === i ? T.bg : 'transparent', color: tab === i ? T.navy : '#94a3b8',
              border: 'none', borderRadius: '8px 8px 0 0', fontFamily: T.font, borderBottom: tab === i ? `2px solid ${T.gold}` : 'none'
            }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '24px 32px', maxWidth: 1440, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          {kpi('Total Exposure', `$${(totalExposure / 1000).toFixed(1)}B`, '8 asset classes')}
          {kpi('Financed Emissions', `${(totalEmissions / 1000).toFixed(0)}K tCO2`, 'attributed')}
          {kpi('Avg DQ Score', avgDQ.toString(), DQ_SCORES[Math.round(avgDQ)], avgDQ < 3 ? T.green : T.amber)}
          {kpi('Portfolio WACI', `${portfolioWACI.toFixed(0)}`, `tCO2/$M rev (BM: ${benchmarkWACI.toFixed(0)})`, portfolioWACI > benchmarkWACI ? T.red : T.green)}
          {kpi('SBTi Gap', `${TARGET_YEARS[TARGET_YEARS.length - 1].gap > 0 ? '+' : ''}${TARGET_YEARS[TARGET_YEARS.length - 1].gap}%`, 'vs target trajectory', TARGET_YEARS[TARGET_YEARS.length - 1].gap > 0 ? T.red : T.green)}
        </div>

        {/* Tab 0: Universal Dashboard */}
        {tab === 0 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={card}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Exposure & Emissions by Asset Class</h3>
                <ResponsiveContainer width="100%" height={380}>
                  <ComposedChart data={classChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 10 }} label={{ value: '$M', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} label={{ value: 'K tCO2', angle: 90, position: 'insideRight', fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="exposure" name="Exposure ($M)" fill={T.blue} opacity={0.5} radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="right" dataKey="emissions" name="Emissions (K tCO2)" fill={T.red} opacity={0.7} radius={[4, 4, 0, 0]} />
                    <Line yAxisId="right" dataKey="intensity" name="Intensity (tCO2/$M)" stroke={T.navy} strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div style={card}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Data Quality by Class</h3>
                <ResponsiveContainer width="100%" height={380}>
                  <BarChart data={classChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={60} />
                    <Tooltip />
                    <ReferenceLine x={3} stroke={T.amber} strokeDasharray="3 3" />
                    <Bar dataKey="dq" name="DQ Score" radius={[0, 4, 4, 0]}>
                      {classChartData.map((c, i) => <Cell key={i} fill={c.dq < 2.5 ? T.green : c.dq < 3.5 ? T.amber : T.red} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Tab 1: All 8 Asset Classes */}
        {tab === 1 && (
          <div>
            {filteredClasses.map(c => (
              <div key={c.cls} style={{ ...card, borderLeft: `4px solid ${DQ_COLORS[Math.round(c.dq)] || T.amber}`, cursor: 'pointer' }}
                onClick={() => setSelectedClass(selectedClass === c.cls ? null : c.cls)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginRight: 8 }}>CLASS {c.cls}</span>
                    <span style={{ fontWeight: 700, fontSize: 15, color: T.navy }}>{c.name}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <span style={{ fontFamily: T.mono, fontSize: 12 }}>Exposure: ${c.exposure}M</span>
                    <span style={{ fontFamily: T.mono, fontSize: 12 }}>Emissions: {(c.emissions / 1000).toFixed(0)}K tCO2</span>
                    <span style={{ padding: '2px 8px', borderRadius: 4, fontFamily: T.mono, fontSize: 11, background: c.dq < 2.5 ? '#dcfce7' : c.dq < 3.5 ? '#fef9c3' : '#fecaca' }}>DQ: {c.dq}</span>
                  </div>
                </div>
                {selectedClass === c.cls && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
                    <div style={{ fontFamily: T.mono, fontSize: 12, background: '#f8fafc', padding: 10, borderRadius: 6, marginBottom: 8 }}>{c.formula}</div>
                    <div style={{ fontSize: 12, color: T.textSec, marginBottom: 4 }}><strong>DQ Description:</strong> {c.dqDesc}</div>
                    <div style={{ fontSize: 12, color: T.textSec }}><strong>Example:</strong> {c.example}</div>
                    <div style={{ fontSize: 12, marginTop: 8 }}>
                      <strong>Intensity:</strong> <span style={{ fontFamily: T.mono }}>{Math.round(c.emissions / c.exposure)} tCO2 / $M exposure</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Data Quality Heatmap */}
        {tab === 2 && (
          <div>
            <div style={card}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Data Quality Heatmap - Portfolio x Asset Class</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8,1fr)', gap: 4, marginBottom: 16 }}>
                {PCAF_CLASSES.map(c => (
                  <div key={c.cls} style={{
                    padding: 12, borderRadius: 6, textAlign: 'center',
                    background: c.dq < 2 ? '#dcfce7' : c.dq < 3 ? '#fef9c3' : c.dq < 4 ? '#fed7aa' : '#fecaca',
                  }}>
                    <div style={{ fontFamily: T.mono, fontSize: 10, marginBottom: 4 }}>Cls {c.cls}</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: c.dq < 2.5 ? T.green : c.dq < 3.5 ? T.amber : T.red }}>{c.dq}</div>
                    <div style={{ fontSize: 9, color: T.textSec }}>{DQ_SCORES[Math.round(c.dq)]?.substring(0, 15)}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', fontSize: 11, color: T.textSec }}>
                {Object.entries(DQ_SCORES).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 12, height: 12, borderRadius: 3, background: DQ_COLORS[k], display: 'inline-block' }} />
                    <span>DQ{k}: {v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={card}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 12 }}>DQ Improvement Action Tracker</h3>
              {PCAF_CLASSES.filter(c => c.dq > 2.5).map(c => (
                <div key={c.cls} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: `1px solid ${T.border}` }}>
                  <input type="checkbox" checked={!!improvePlan[c.cls]} onChange={() => setImprovePlan(p => ({ ...p, [c.cls]: !p[c.cls] }))} />
                  <span style={{ fontWeight: 600, fontSize: 12, width: 200 }}>Class {c.cls}: {c.name.substring(0, 25)}</span>
                  <span style={{ fontFamily: T.mono, fontSize: 11, color: T.red }}>Current: DQ {c.dq}</span>
                  <span style={{ fontFamily: T.mono, fontSize: 11, color: T.green }}>Target: DQ {Math.max(1, c.dq - 1).toFixed(1)}</span>
                  <span style={{ fontSize: 11, color: T.textSec, flex: 1 }}>Action: {c.dq > 3.5 ? 'Collect primary data' : 'Obtain verification'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Attribution Formula Reference */}
        {tab === 3 && (
          <div style={card}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 12 }}>PCAF Attribution Formulas - Complete Reference</h3>
            <div style={{ fontFamily: T.mono, fontSize: 12, background: '#f8fafc', padding: 16, borderRadius: 8, marginBottom: 16 }}>
              <div style={{ marginBottom: 8 }}>General: <strong>Attributed_Emissions_i = Attribution_Factor_i x Emissions_i</strong></div>
              <div>Where: Attribution_Factor = Outstanding_Amount / (EVIC or Total_Equity+Debt or Property_Value or PPP_GDP)</div>
            </div>
            {PCAF_CLASSES.map(c => (
              <div key={c.cls} style={{ marginBottom: 16, padding: 14, background: '#fafaf9', borderRadius: 8, borderLeft: `3px solid ${T.navy}` }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: T.navy, marginBottom: 4 }}>Class {c.cls}: {c.name}</div>
                <div style={{ fontFamily: T.mono, fontSize: 12, marginBottom: 6 }}>{c.formula}</div>
                <div style={{ fontSize: 12, color: T.textSec }}><strong>Example:</strong> {c.example}</div>
              </div>
            ))}
            <div style={{ padding: 12, background: '#eff6ff', borderRadius: 8, fontSize: 12, marginTop: 12 }}>
              <strong>Key References:</strong> PCAF Global GHG Accounting & Reporting Standard v3 | GHG Protocol Scope 3 Category 15 | SBTi Financial Sector Science-Based Target Setting
            </div>
          </div>
        )}

        {/* Tab 4: Portfolio-Level WACI */}
        {tab === 4 && (
          <div>
            <div style={card}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Weighted Average Carbon Intensity (WACI) by Sector</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={WACI_SECTORS}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="sector" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 10 }} label={{ value: 'tCO2/$M Revenue', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="waci" name="Portfolio WACI" fill={T.navy} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="benchmark" name="Benchmark WACI" fill={T.textMut} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              {kpi('Portfolio WACI', `${portfolioWACI.toFixed(0)}`, 'tCO2/$M revenue')}
              {kpi('Benchmark WACI', `${benchmarkWACI.toFixed(0)}`, 'tCO2/$M revenue', T.textSec)}
              {kpi('Relative', `${portfolioWACI > benchmarkWACI ? '+' : ''}${((portfolioWACI / benchmarkWACI - 1) * 100).toFixed(0)}%`, 'vs benchmark', portfolioWACI > benchmarkWACI ? T.red : T.green)}
            </div>
            <div style={{ ...card, marginTop: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Peer Benchmarking</h3>
              {[
                { peer: 'Global Peer Avg', waci: Math.round(benchmarkWACI * 1.1) },
                { peer: 'Best-in-Class', waci: Math.round(benchmarkWACI * 0.6) },
                { peer: 'Your Portfolio', waci: Math.round(portfolioWACI) },
                { peer: 'Paris-Aligned', waci: Math.round(benchmarkWACI * 0.4) },
              ].map(p => (
                <div key={p.peer} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
                  <span style={{ fontWeight: p.peer === 'Your Portfolio' ? 700 : 400, fontSize: 12, width: 140 }}>{p.peer}</span>
                  <div style={{ flex: 1, height: 8, background: T.border, borderRadius: 4 }}>
                    <div style={{ width: `${Math.min(100, p.waci / 2)}%`, height: 8, background: p.peer === 'Your Portfolio' ? T.navy : T.textMut, borderRadius: 4 }} />
                  </div>
                  <span style={{ fontFamily: T.mono, fontSize: 12, width: 50 }}>{p.waci}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 5: Target Tracking */}
        {tab === 5 && (
          <div>
            <div style={card}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 12 }}>SBTi Financed Emissions Target vs Actual Trajectory</h3>
              <ResponsiveContainer width="100%" height={380}>
                <ComposedChart data={TARGET_YEARS}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} domain={[50, 105]} label={{ value: 'Index (2020=100)', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line dataKey="target" stroke={T.green} strokeWidth={2} strokeDasharray="5 5" name="SBTi Target" />
                  <Line dataKey="actual" stroke={T.navy} strokeWidth={3} name="Actual Trajectory" />
                  <Area dataKey="gap" fill={T.red} fillOpacity={0.1} stroke="none" name="Gap" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Gap Analysis Detail</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  {['Year', 'Target (Index)', 'Actual (Index)', 'Gap', 'Status'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 6px', fontWeight: 600, color: T.textSec }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {TARGET_YEARS.map(y => (
                    <tr key={y.year} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '8px 6px', fontWeight: 600 }}>{y.year}</td>
                      <td style={{ padding: '8px 6px', fontFamily: T.mono }}>{y.target}</td>
                      <td style={{ padding: '8px 6px', fontFamily: T.mono }}>{y.actual}</td>
                      <td style={{ padding: '8px 6px', fontFamily: T.mono, color: y.gap > 0 ? T.red : T.green, fontWeight: 700 }}>{y.gap > 0 ? '+' : ''}{y.gap}</td>
                      <td style={{ padding: '8px 6px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600,
                          background: y.gap <= 0 ? '#dcfce7' : y.gap < 3 ? '#fef9c3' : '#fecaca',
                          color: y.gap <= 0 ? T.green : y.gap < 3 ? T.amber : T.red
                        }}>{y.gap <= 0 ? 'On Track' : y.gap < 3 ? 'Marginal' : 'Off Track'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={card}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Regulatory Disclosure Export</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                {['TCFD Metrics (Scope 3 Cat 15)', 'PCAF Disclosure Report', 'SBTi Annual Monitoring', 'CDP Financial Sector', 'SFDR PAI #1-2 Emissions', 'CSRD ESRS E1 Financed'].map(r => (
                  <div key={r} style={{ padding: 12, border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 4, background: T.green }} />
                    {r}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 8 }}>
          <div style={card}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Reference Data</h4>
            {['PCAF Global GHG Accounting Standard v3', 'GHG Protocol Scope 3 Category 15', 'SBTi Financial Sector Framework', 'TCFD Recommendations', 'SFDR PAI Indicators', 'CDP Financial Sector Questionnaire'].map(r => (
              <div key={r} style={{ fontSize: 11, color: T.textSec, padding: '3px 0', borderBottom: `1px solid ${T.border}` }}>{r}</div>
            ))}
          </div>
          <div style={card}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Engagement Tools</h4>
            {['DQ improvement action tracker', 'Peer benchmarking (WACI)', 'Regulatory disclosure export', 'SBTi target gap analyzer', '8-class attribution calculator', 'Portfolio carbon footprint report'].map(e => (
              <div key={e} style={{ fontSize: 11, color: T.textSec, padding: '3px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: 3, background: T.gold, display: 'inline-block' }} />{e}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
