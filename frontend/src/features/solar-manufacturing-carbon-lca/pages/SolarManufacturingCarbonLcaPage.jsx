import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, PieChart, Pie,
  ScatterChart, Scatter, ZAxis,
  RadarChart, PolarGrid, PolarAngleAxis, Radar
} from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const T = {
  bg: '#F7F6F2', card: '#FFFFFF', border: '#E5E2D9',
  text: '#1A1A2E', sub: '#6B7280', accent: '#B8860B',
  green: '#065F46', red: '#991B1B', blue: '#1E40AF',
  teal: '#0F766E', amber: '#92400E', navy: '#0F172A',
  indigo: '#4F46E5', gold: '#C59A1E', sage: '#4A7C59',
  font: "'DM Sans',system-ui,sans-serif"
};

const LCA_PRODUCTS = [
  { id: 1, technology: 'Mono-Si PERC (China grid)', energyUse: 28.5, carbonFp: 42.0, carbonPayback: 1.8, waterLPw: 18.5, rawMatIntensity: 3.8, eolRecyclability: 82, gridCarbon: 550 },
  { id: 2, technology: 'Mono-Si PERC (EU grid)', energyUse: 28.5, carbonFp: 22.0, carbonPayback: 0.9, waterLPw: 18.5, rawMatIntensity: 3.8, eolRecyclability: 82, gridCarbon: 290 },
  { id: 3, technology: 'Mono-Si TOPCon (China grid)', energyUse: 32.0, carbonFp: 48.0, carbonPayback: 2.0, waterLPw: 20.1, rawMatIntensity: 3.9, eolRecyclability: 84, gridCarbon: 550 },
  { id: 4, technology: 'HJT (China grid)', energyUse: 35.0, carbonFp: 52.0, carbonPayback: 2.1, waterLPw: 22.0, rawMatIntensity: 4.0, eolRecyclability: 86, gridCarbon: 550 },
  { id: 5, technology: 'HJT (RE powered)', energyUse: 35.0, carbonFp: 8.5, carbonPayback: 0.4, waterLPw: 22.0, rawMatIntensity: 4.0, eolRecyclability: 86, gridCarbon: 28 },
  { id: 6, technology: 'IBC (RE powered)', energyUse: 38.0, carbonFp: 9.2, carbonPayback: 0.4, waterLPw: 24.0, rawMatIntensity: 4.2, eolRecyclability: 88, gridCarbon: 28 },
  { id: 7, technology: 'CdTe (First Solar US)', energyUse: 11.5, carbonFp: 18.0, carbonPayback: 0.7, waterLPw: 8.2, rawMatIntensity: 2.1, eolRecyclability: 92, gridCarbon: 380 },
  { id: 8, technology: 'CIGS (Germany)', energyUse: 16.0, carbonFp: 14.5, carbonPayback: 0.6, waterLPw: 10.5, rawMatIntensity: 2.5, eolRecyclability: 88, gridCarbon: 290 },
  { id: 9, technology: 'Perovskite-Si Tandem (lab)', energyUse: 40.0, carbonFp: 55.0, carbonPayback: 1.8, waterLPw: 26.0, rawMatIntensity: 4.8, eolRecyclability: 70, gridCarbon: 550 },
  { id: 10, technology: 'Multi-Si BSF (China grid)', energyUse: 24.0, carbonFp: 36.0, carbonPayback: 1.5, waterLPw: 16.0, rawMatIntensity: 3.5, eolRecyclability: 78, gridCarbon: 550 },
  { id: 11, technology: 'Bifacial PERC (low lat.)', energyUse: 28.5, carbonFp: 22.5, carbonPayback: 0.8, waterLPw: 18.5, rawMatIntensity: 3.8, eolRecyclability: 82, gridCarbon: 290 },
  { id: 12, technology: 'TOPCon (RE powered)', energyUse: 32.0, carbonFp: 9.8, carbonPayback: 0.4, waterLPw: 20.1, rawMatIntensity: 3.9, eolRecyclability: 84, gridCarbon: 28 },
];

const STAGE_BREAKDOWN = [
  { stage: 'Polysilicon', gco2e: 14.5, water: 8.2, color: T.red },
  { stage: 'Wafer', gco2e: 7.8, water: 4.1, color: T.amber },
  { stage: 'Cell Processing', gco2e: 8.2, water: 2.8, color: T.gold },
  { stage: 'Module Assembly', gco2e: 4.5, water: 1.5, color: T.blue },
  { stage: 'BOS & Install', gco2e: 3.2, water: 0.8, color: T.teal },
  { stage: 'Transport', gco2e: 2.1, water: 0.5, color: T.indigo },
  { stage: 'O&M (25yr)', gco2e: 1.2, water: 0.3, color: T.sage },
  { stage: 'End-of-Life', gco2e: -0.8, water: 0.1, color: T.green },
];

const PAYBACK_SCENARIOS = [
  { year: 0, china550: 0, eu290: 0, re28: 0 },
  { year: 0.5, china550: 27.7, eu290: 24.4, re28: 21.2 },
  { year: 1, china550: 55.5, eu290: 48.9, re28: 42.5 },
  { year: 1.5, china550: 83.3, eu290: 73.3, re28: 63.8 },
  { year: 1.8, china550: 100, eu290: 87.9, re28: 76.5 },
  { year: 2, china550: 111.1, eu290: 97.8, re28: 85.0 },
  { year: 3, china550: 166.6, eu290: 146.7, re28: 127.5 },
  { year: 5, china550: 277.7, eu290: 244.4, re28: 212.5 },
  { year: 10, china550: 555.5, eu290: 488.9, re28: 425.0 },
  { year: 25, china550: 1388.7, eu290: 1222.2, re28: 1062.5 },
];

const TABS = [
  'LCA Overview', 'Stage Breakdown', 'Carbon Payback Period',
  'Water Footprint', 'Circularity & EoL', 'EPD Comparison'
];

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 18px', flex: 1, minWidth: 140 }}>
    <div style={{ fontSize: 12, color: T.sub, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.text }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{sub}</div>}
  </div>
);

export default function SolarManufacturingCarbonLcaPage() {
  const [tab, setTab] = useState(0);
  const [gridFilter, setGridFilter] = useState('All');

  const filtered = useMemo(() => {
    if (gridFilter === 'All') return LCA_PRODUCTS;
    if (gridFilter === 'China') return LCA_PRODUCTS.filter(p => p.gridCarbon >= 500);
    if (gridFilter === 'EU') return LCA_PRODUCTS.filter(p => p.gridCarbon >= 200 && p.gridCarbon < 500);
    if (gridFilter === 'RE') return LCA_PRODUCTS.filter(p => p.gridCarbon < 100);
    return LCA_PRODUCTS;
  }, [gridFilter]);

  const avgCarbon = useMemo(() => filtered.length ? (filtered.reduce((a, p) => a + p.carbonFp, 0) / filtered.length).toFixed(1) : '0.0', [filtered]);
  const avgPayback = useMemo(() => filtered.length ? (filtered.reduce((a, p) => a + p.carbonPayback, 0) / filtered.length).toFixed(2) : '0.00', [filtered]);
  const avgRecyclability = useMemo(() => filtered.length ? (filtered.reduce((a, p) => a + p.eolRecyclability, 0) / filtered.length).toFixed(1) : '0.0', [filtered]);
  const minPayback = useMemo(() => filtered.length ? Math.min(...filtered.map(p => p.carbonPayback)).toFixed(1) : '0.0', [filtered]);

  const totalStageCO2 = STAGE_BREAKDOWN.reduce((a, s) => a + s.gco2e, 0);

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: '24px 28px', color: T.text }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: T.sub, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>EP-ED4 · NREL LCA Harmonization / JRC EU Science Hub / ISO 14040 / Fraunhofer ISE</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: T.navy }}>Solar Manufacturing Carbon Footprint & LCA</h1>
        <p style={{ color: T.sub, marginTop: 6, fontSize: 13 }}>Solar PV lifecycle: 20–50 gCO2e/kWh · Carbon payback 0.5–2 years · EoL recyclability target >90% by 2030 · IEC 63274</p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <KpiCard label="Avg Carbon Footprint" value={`${avgCarbon} gCO2e/Wp`} sub="filtered technologies" color={T.red} />
        <KpiCard label="Avg Carbon Payback" value={`${avgPayback} yrs`} sub="break-even vs grid electricity" color={T.amber} />
        <KpiCard label="Min Payback (RE)" value={`${minPayback} yrs`} sub="renewable-powered manufacturing" color={T.green} />
        <KpiCard label="Avg EoL Recyclability" value={`${avgRecyclability}%`} sub="end-of-life material recovery" color={T.teal} />
        <KpiCard label="Polysilicon Stage" value="14.5 gCO2e/Wp" sub="largest LCA contributor" color={T.indigo} />
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{
            padding: '7px 16px', borderRadius: 20, fontSize: 13, fontWeight: tab === i ? 700 : 500,
            background: tab === i ? T.navy : T.card, color: tab === i ? '#FFF' : T.sub,
            border: `1px solid ${tab === i ? T.navy : T.border}`, cursor: 'pointer'
          }}>{t}</button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['All', 'China', 'EU', 'RE'].map(g => (
          <button key={g} onClick={() => setGridFilter(g)} style={{
            padding: '5px 12px', borderRadius: 14, fontSize: 12, fontWeight: gridFilter === g ? 700 : 400,
            background: gridFilter === g ? T.teal : T.card, color: gridFilter === g ? '#FFF' : T.sub,
            border: `1px solid ${gridFilter === g ? T.teal : T.border}`, cursor: 'pointer'
          }}>{g === 'All' ? 'All Grids' : g === 'China' ? 'China Grid (~550g)' : g === 'EU' ? 'EU Grid (~290g)' : 'RE Powered (<30g)'}</button>
        ))}
      </div>

      {tab === 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>Carbon Footprint by Technology (gCO2e/Wp)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={[...filtered].sort((a, b) => b.carbonFp - a.carbonFp)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="technology" width={160} tick={{ fontSize: 9 }} />
                <Tooltip formatter={(v) => [`${v} gCO2e/Wp`, 'Carbon Footprint']} />
                <Bar dataKey="carbonFp" radius={[0, 4, 4, 0]}>
                  {[...filtered].sort((a, b) => b.carbonFp - a.carbonFp).map((p, i) => (
                    <Cell key={i} fill={p.carbonFp > 40 ? T.red : p.carbonFp > 20 ? T.amber : T.green} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>Carbon Payback Period by Technology</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={[...filtered].sort((a, b) => a.carbonPayback - b.carbonPayback)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="technology" width={160} tick={{ fontSize: 9 }} />
                <Tooltip formatter={(v) => [`${v} years`, 'Payback Period']} />
                <Bar dataKey="carbonPayback" radius={[0, 4, 4, 0]}>
                  {[...filtered].sort((a, b) => a.carbonPayback - b.carbonPayback).map((p, i) => (
                    <Cell key={i} fill={p.carbonPayback < 0.8 ? T.green : p.carbonPayback < 1.5 ? T.teal : T.amber} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}`, gridColumn: '1/-1' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700 }}>LCA Benchmark Table</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.bg }}>
                    {['Technology', 'Energy Use (kWh/Wp)', 'Carbon (gCO2e/Wp)', 'Payback (yrs)', 'Water (L/Wp)', 'Raw Mat. Intensity', 'EoL Recyclability'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.sub, fontWeight: 600, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p, i) => (
                    <tr key={p.id} style={{ background: i % 2 === 0 ? T.card : T.bg }}>
                      <td style={{ padding: '7px 10px', fontWeight: 600, fontSize: 11 }}>{p.technology}</td>
                      <td style={{ padding: '7px 10px' }}>{p.energyUse}</td>
                      <td style={{ padding: '7px 10px', color: p.carbonFp > 40 ? T.red : p.carbonFp < 15 ? T.green : T.amber, fontWeight: 600 }}>{p.carbonFp}</td>
                      <td style={{ padding: '7px 10px', color: p.carbonPayback < 0.8 ? T.green : T.amber }}>{p.carbonPayback}</td>
                      <td style={{ padding: '7px 10px' }}>{p.waterLPw}</td>
                      <td style={{ padding: '7px 10px' }}>{p.rawMatIntensity}</td>
                      <td style={{ padding: '7px 10px', color: p.eolRecyclability >= 88 ? T.green : T.amber }}>{p.eolRecyclability}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>Life Cycle Stage CO2 Contribution (gCO2e/Wp)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={STAGE_BREAKDOWN}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="stage" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v} gCO2e/Wp`, 'Stage Emissions']} />
                <Bar dataKey="gco2e" radius={[4, 4, 0, 0]}>
                  {STAGE_BREAKDOWN.map((s, i) => <Cell key={i} fill={s.gco2e < 0 ? T.green : s.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>Stage Share of Total Footprint</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={STAGE_BREAKDOWN.filter(s => s.gco2e > 0)} dataKey="gco2e" nameKey="stage" cx="50%" cy="50%" outerRadius={90}
                  label={({ stage, gco2e }) => `${((gco2e / totalStageCO2) * 100).toFixed(0)}%`}>
                  {STAGE_BREAKDOWN.filter(s => s.gco2e > 0).map((s, i) => <Cell key={i} fill={s.color} />)}
                </Pie>
                <Tooltip formatter={(v) => [`${v} gCO2e/Wp`, 'Emissions']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 2 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}`, gridColumn: '1/-1' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>Carbon Payback — Cumulative CO2 Avoided vs Manufacturing Emissions (% of breakeven)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={PAYBACK_SCENARIOS}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} label={{ value: 'Operating Year', position: 'insideBottom', offset: -4, fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} label={{ value: '% of Payback', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v.toFixed(1)}%`, '% Payback']} />
                <Legend />
                <Line type="monotone" dataKey="china550" name="China Grid (550 gCO2/kWh)" stroke={T.red} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="eu290" name="EU Grid (290 gCO2/kWh)" stroke={T.blue} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="re28" name="RE Grid (28 gCO2/kWh)" stroke={T.green} strokeWidth={2} dot={false} strokeDasharray="5 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700 }}>Payback Benchmarks</h3>
            {[
              { scenario: 'RE-powered HJT', payback: '0.4 yrs', avoidance: '820 × 25 = 20,500 gCO2e/Wp vs 8 gCO2e mfg', color: T.green },
              { scenario: 'EU Grid Mono-Si', payback: '0.9 yrs', avoidance: 'EU average grid 290 gCO2/kWh; PERC 22 gCO2e/Wp', color: T.teal },
              { scenario: 'China Grid PERC', payback: '1.8 yrs', avoidance: 'China grid 550 gCO2/kWh; PERC 42 gCO2e/Wp', color: T.amber },
              { scenario: 'China Grid Perovskite-Si', payback: '2.1 yrs', avoidance: 'High mfg energy + current grid still reaches payback', color: T.red },
              { scenario: 'CdTe First Solar', payback: '0.7 yrs', avoidance: 'Low energy process; 18 gCO2e/Wp; best non-RE option', color: T.blue },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '8px 12px', borderRadius: 8, background: T.bg, marginBottom: 8, borderLeft: `3px solid ${s.color}` }}>
                <div style={{ minWidth: 80 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: s.color }}>{s.payback}</div>
                  <div style={{ fontSize: 10, color: T.sub }}>payback</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{s.scenario}</div>
                  <div style={{ fontSize: 11, color: T.sub }}>{s.avoidance}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700 }}>CO2 Comparison: Solar vs Fossil Fuels (gCO2e/kWh)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={[
                { source: 'Coal', value: 820, color: T.red },
                { source: 'Gas CCGT', value: 490, color: T.amber },
                { source: 'Oil', value: 650, color: T.gold },
                { source: 'Solar (China grid)', value: 42, color: T.sub },
                { source: 'Solar (EU grid)', value: 22, color: T.teal },
                { source: 'Solar (RE mfg)', value: 8.5, color: T.green },
                { source: 'Wind (onshore)', value: 7, color: T.blue },
                { source: 'Nuclear', value: 12, color: T.indigo },
              ]} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="source" width={120} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => [`${v} gCO2e/kWh`, 'Carbon Intensity']} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {[
                    { color: T.red }, { color: T.amber }, { color: T.gold }, { color: T.sub },
                    { color: T.teal }, { color: T.green }, { color: T.blue }, { color: T.indigo },
                  ].map((c, i) => <Cell key={i} fill={c.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 3 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>Water Footprint by Technology (L/Wp)</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={[...filtered].sort((a, b) => b.waterLPw - a.waterLPw)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="technology" width={160} tick={{ fontSize: 9 }} />
                <Tooltip formatter={(v) => [`${v} L/Wp`, 'Water Use']} />
                <Bar dataKey="waterLPw" radius={[0, 4, 4, 0]}>
                  {[...filtered].sort((a, b) => b.waterLPw - a.waterLPw).map((p, i) => (
                    <Cell key={i} fill={p.waterLPw > 22 ? T.red : p.waterLPw > 15 ? T.amber : T.teal} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>Stage Water Breakdown (L/Wp)</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={STAGE_BREAKDOWN} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="stage" width={110} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => [`${v} L/Wp`, 'Water']} />
                <Bar dataKey="water" radius={[0, 4, 4, 0]}>
                  {STAGE_BREAKDOWN.map((s, i) => <Cell key={i} fill={s.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 4 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>End-of-Life Recyclability (%)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={[...filtered].sort((a, b) => b.eolRecyclability - a.eolRecyclability)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" domain={[60, 100]} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="technology" width={160} tick={{ fontSize: 9 }} />
                <Tooltip formatter={(v) => [`${v}%`, 'EoL Recyclability']} />
                <Bar dataKey="eolRecyclability" radius={[0, 4, 4, 0]}>
                  {[...filtered].sort((a, b) => b.eolRecyclability - a.eolRecyclability).map((p, i) => (
                    <Cell key={i} fill={p.eolRecyclability >= 88 ? T.green : p.eolRecyclability >= 82 ? T.teal : T.amber} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>Circular Economy Roadmap</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Current recyclability (avg)', val: `${avgRecyclability}%`, target: false },
                { label: 'EU WEEE target 2030', val: '>90%', target: true },
                { label: 'IEC 63274 scope', val: 'PV module recycling methods', target: false },
                { label: 'Silicon wafer recovery', val: '95%+ achievable', target: false },
                { label: 'Frame aluminium recovery', val: '98%+ (mature stream)', target: false },
                { label: 'Glass recovery', val: '85–90% current', target: false },
                { label: 'Silver paste recovery', val: '<60% (active R&D)', target: false },
                { label: 'Backsheet polymer', val: '40% — main gap to 90%', target: false },
              ].map((r, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 12px', borderRadius: 8, background: r.target ? `${T.green}15` : T.bg, borderLeft: r.target ? `3px solid ${T.green}` : 'none' }}>
                  <span style={{ fontSize: 12, color: T.sub }}>{r.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: r.target ? T.green : T.text }}>{r.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 5 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}`, gridColumn: '1/-1' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700 }}>Carbon Reduction Levers — Impact Ranking</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 0 }}>
              {[
                { lever: 'Switch to RE Manufacturing', reduction: '70–85%', example: 'HJT from 52→8 gCO2e/Wp; ~44 gCO2e/Wp saved', priority: 1, color: T.green },
                { lever: 'Reduce Polysilicon Energy', reduction: '20–35%', example: 'FBR process cuts poly stage from 14.5→8 gCO2e/Wp', priority: 2, color: T.teal },
                { lever: 'Increase Module Efficiency', reduction: '10–20%', example: 'Higher eff → more kWh/module → better carbon payback', priority: 3, color: T.blue },
                { lever: 'Improve EoL Recyclability', reduction: '5–10%', example: 'Backsheet recycling closes circular gap; 90% target by 2030', priority: 4, color: T.indigo },
              ].map((l, i) => (
                <div key={i} style={{ background: T.bg, borderRadius: 8, padding: 14, borderTop: `3px solid ${l.color}` }}>
                  <div style={{ color: l.color, fontWeight: 800, fontSize: 22 }}>#{l.priority}</div>
                  <div style={{ fontWeight: 700, fontSize: 13, marginTop: 4 }}>{l.lever}</div>
                  <div style={{ color: l.color, fontSize: 18, fontWeight: 800, margin: '6px 0' }}>{l.reduction}</div>
                  <div style={{ fontSize: 11, color: T.sub }}>{l.example}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>EPD Comparison: Carbon Footprint by Source</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={[
                { source: 'NREL Harmonized Median', low: 20, mid: 40, high: 58 },
                { source: 'JRC EU Science Hub', low: 18, mid: 35, high: 50 },
                { source: 'Fraunhofer ISE', low: 16, mid: 30, high: 46 },
                { source: 'IEA LCA Review', low: 22, mid: 38, high: 55 },
                { source: 'Industry EPDs (avg)', low: 24, mid: 42, high: 60 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="source" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} label={{ value: 'gCO2e/Wp', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="low" name="Low Estimate" fill={T.green} stackId="a" />
                <Bar dataKey="mid" name="Median" fill={T.amber} stackId="b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>Key LCA Standards & References</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { std: 'ISO 14040/14044', desc: 'LCA framework, principles and requirements' },
                { std: 'IEC 63274', desc: 'PV module LCA standard methodology' },
                { std: 'NREL Harmonization', desc: 'Systematic review of 400+ PV LCA studies' },
                { std: 'JRC EU Science Hub', desc: 'EU reference LCA values for PV products' },
                { std: 'EN 15804+A2', desc: 'Core EPD product category rules' },
                { std: 'PCR 2019:14', desc: 'Product category rules for PV panels' },
                { std: 'Fraunhofer ISE', desc: 'Annual manufacturing carbon benchmarks' },
              ].map((s, i) => (
                <div key={i} style={{ padding: '8px 12px', borderRadius: 8, background: T.bg }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.indigo }}>{s.std}</div>
                  <div style={{ fontSize: 11, color: T.sub }}>{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
