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

const MANUFACTURERS = [
  { id: 1, company: 'LONGi Green', hq: 'China', capacityGW: 85, utilization: 88, grossMargin: 16.2, opexW: 0.042, capexGW: 0.38, automation: 5, integration: 'poly-to-module', costPerWp: 0.17 },
  { id: 2, company: 'Jinko Solar', hq: 'China', capacityGW: 80, utilization: 85, grossMargin: 14.8, opexW: 0.044, capexGW: 0.36, automation: 5, integration: 'poly-to-module', costPerWp: 0.18 },
  { id: 3, company: 'JA Solar', hq: 'China', capacityGW: 75, utilization: 84, grossMargin: 15.1, opexW: 0.046, capexGW: 0.37, automation: 4, integration: 'cell-to-module', costPerWp: 0.18 },
  { id: 4, company: 'Trina Solar', hq: 'China', capacityGW: 50, utilization: 82, grossMargin: 13.9, opexW: 0.048, capexGW: 0.38, automation: 4, integration: 'cell-to-module', costPerWp: 0.19 },
  { id: 5, company: 'Canadian Solar', hq: 'Canada', capacityGW: 40, utilization: 80, grossMargin: 18.5, opexW: 0.055, capexGW: 0.40, automation: 4, integration: 'cell-to-module', costPerWp: 0.21 },
  { id: 6, company: 'First Solar', hq: 'USA', capacityGW: 18, utilization: 91, grossMargin: 28.4, opexW: 0.038, capexGW: 0.50, automation: 5, integration: 'module_only', costPerWp: 0.20 },
  { id: 7, company: 'Risen Energy', hq: 'China', capacityGW: 30, utilization: 79, grossMargin: 12.8, opexW: 0.050, capexGW: 0.35, automation: 4, integration: 'poly-to-module', costPerWp: 0.19 },
  { id: 8, company: 'Seraphim', hq: 'China', capacityGW: 20, utilization: 76, grossMargin: 11.5, opexW: 0.052, capexGW: 0.34, automation: 3, integration: 'cell-to-module', costPerWp: 0.20 },
  { id: 9, company: 'Hanwha Q CELLS', hq: 'South Korea', capacityGW: 14, utilization: 82, grossMargin: 20.1, opexW: 0.060, capexGW: 0.45, automation: 5, integration: 'cell-to-module', costPerWp: 0.24 },
  { id: 10, company: 'SunPower/Maxeon', hq: 'USA', capacityGW: 5, utilization: 72, grossMargin: 22.8, opexW: 0.075, capexGW: 0.72, automation: 5, integration: 'cell-to-module', costPerWp: 0.35 },
  { id: 11, company: 'REC Group', hq: 'Norway', capacityGW: 4, utilization: 78, grossMargin: 19.2, opexW: 0.068, capexGW: 0.52, automation: 4, integration: 'module_only', costPerWp: 0.26 },
  { id: 12, company: 'Meyer Burger', hq: 'Germany', capacityGW: 2, utilization: 68, grossMargin: 14.5, opexW: 0.085, capexGW: 0.90, automation: 5, integration: 'cell-to-module', costPerWp: 0.38 },
  { id: 13, company: 'Silfab Solar', hq: 'Canada', capacityGW: 3, utilization: 74, grossMargin: 17.8, opexW: 0.070, capexGW: 0.48, automation: 3, integration: 'module_only', costPerWp: 0.28 },
  { id: 14, company: 'Axitec', hq: 'Germany', capacityGW: 1.5, utilization: 71, grossMargin: 16.0, opexW: 0.078, capexGW: 0.55, automation: 3, integration: 'module_only', costPerWp: 0.30 },
  { id: 15, company: 'Vikram Solar', hq: 'India', capacityGW: 3.5, utilization: 75, grossMargin: 15.5, opexW: 0.062, capexGW: 0.42, automation: 3, integration: 'cell-to-module', costPerWp: 0.22 },
];

const BOM_COMPONENTS = [
  { component: 'Solar Cells', costCents: 9.2, pct: 52.0, color: T.blue },
  { component: 'Glass (front)', costCents: 2.8, pct: 15.8, color: T.teal },
  { component: 'Backsheet/Glass', costCents: 1.2, pct: 6.8, color: T.green },
  { component: 'EVA Encapsulant', costCents: 0.8, pct: 4.5, color: T.amber },
  { component: 'Aluminium Frame', costCents: 1.5, pct: 8.5, color: T.indigo },
  { component: 'Junction Box', costCents: 0.6, pct: 3.4, color: T.red },
  { component: 'Interconnect Ribbon', costCents: 0.5, pct: 2.8, color: T.gold },
  { component: 'Other (labour, OH)', costCents: 1.1, pct: 6.2, color: T.sub },
];

const LEARNING_CURVE = [
  { year: 2010, costPerW: 4.00, cumulativeGW: 40 },
  { year: 2012, costPerW: 2.20, cumulativeGW: 100 },
  { year: 2014, costPerW: 1.40, cumulativeGW: 185 },
  { year: 2016, costPerW: 0.80, cumulativeGW: 310 },
  { year: 2018, costPerW: 0.45, cumulativeGW: 520 },
  { year: 2020, costPerW: 0.32, cumulativeGW: 790 },
  { year: 2021, costPerW: 0.28, cumulativeGW: 990 },
  { year: 2022, costPerW: 0.26, cumulativeGW: 1200 },
  { year: 2023, costPerW: 0.16, cumulativeGW: 1550 },
  { year: 2024, costPerW: 0.14, cumulativeGW: 1900 },
  { year: 2025, costPerW: 0.12, cumulativeGW: 2350 },
];

const TABS = [
  'Manufacturer Benchmarks', 'BOM Cost Breakdown', 'Capex & Scale Economics',
  'Automation Analysis', 'Margin Waterfall', 'Learning Curve'
];

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 18px', flex: 1, minWidth: 140 }}>
    <div style={{ fontSize: 12, color: T.sub, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.text }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{sub}</div>}
  </div>
);

export default function SolarModuleManufacturingEconomicsPage() {
  const [tab, setTab] = useState(0);
  const [integrationFilter, setIntegrationFilter] = useState('All');
  const [hqFilter, setHqFilter] = useState('All');

  const hqOptions = useMemo(() => ['All', ...Array.from(new Set(MANUFACTURERS.map(m => m.hq)))], []);

  const filtered = useMemo(() => MANUFACTURERS.filter(m =>
    (integrationFilter === 'All' || m.integration === integrationFilter) &&
    (hqFilter === 'All' || m.hq === hqFilter)
  ), [integrationFilter, hqFilter]);

  const avgMargin = useMemo(() => filtered.length ? (filtered.reduce((a, m) => a + m.grossMargin, 0) / filtered.length).toFixed(1) : '0.0', [filtered]);
  const avgCost = useMemo(() => filtered.length ? (filtered.reduce((a, m) => a + m.costPerWp, 0) / filtered.length).toFixed(2) : '0.00', [filtered]);
  const totalCap = useMemo(() => filtered.reduce((a, m) => a + m.capacityGW, 0), [filtered]);
  const avgUtil = useMemo(() => filtered.length ? (filtered.reduce((a, m) => a + m.utilization, 0) / filtered.length).toFixed(1) : '0.0', [filtered]);

  const marginWaterfall = [
    { stage: 'Module ASP', value: 0.28, type: 'base' },
    { stage: '− Cells', value: -0.092, type: 'cost' },
    { stage: '− Glass', value: -0.028, type: 'cost' },
    { stage: '− Backsheet', value: -0.012, type: 'cost' },
    { stage: '− Frame', value: -0.015, type: 'cost' },
    { stage: '− Other BOM', value: -0.030, type: 'cost' },
    { stage: '− Labour', value: -0.020, type: 'cost' },
    { stage: '− Overhead', value: -0.018, type: 'cost' },
    { stage: 'Gross Profit', value: 0.065, type: 'profit' },
  ];

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: '24px 28px', color: T.text }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: T.sub, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>EP-ED3 · BloombergNEF / Wood Mackenzie / IHS Markit</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: T.navy }}>Solar Module Manufacturing Economics</h1>
        <p style={{ color: T.sub, marginTop: 6, fontSize: 13 }}>Module costs declined from $4/W (2010) → $0.14/W (2024) · Wright's Law 24% learning rate · China dominance in poly-to-module integration</p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <KpiCard label="Avg Gross Margin" value={`${avgMargin}%`} sub="filtered manufacturers" color={T.green} />
        <KpiCard label="Avg Cost/Wp" value={`$${avgCost}`} sub="filtered set" color={T.blue} />
        <KpiCard label="Total Capacity (GW)" value={totalCap.toFixed(0)} sub="filtered nameplate" color={T.teal} />
        <KpiCard label="Avg Utilization" value={`${avgUtil}%`} sub="capacity utilization rate" color={T.amber} />
        <KpiCard label="Learning Rate" value="24%" sub="Wright's Law (solar PV)" color={T.indigo} />
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

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['All', 'poly-to-module', 'cell-to-module', 'module_only'].map(opt => (
          <button key={opt} onClick={() => setIntegrationFilter(opt)} style={{
            padding: '5px 12px', borderRadius: 14, fontSize: 11, fontWeight: integrationFilter === opt ? 700 : 400,
            background: integrationFilter === opt ? T.indigo : T.card, color: integrationFilter === opt ? '#FFF' : T.sub,
            border: `1px solid ${integrationFilter === opt ? T.indigo : T.border}`, cursor: 'pointer'
          }}>{opt === 'All' ? 'All Integrations' : opt}</button>
        ))}
        {hqOptions.map(h => (
          <button key={h} onClick={() => setHqFilter(h)} style={{
            padding: '5px 12px', borderRadius: 14, fontSize: 11, fontWeight: hqFilter === h ? 700 : 400,
            background: hqFilter === h ? T.teal : T.card, color: hqFilter === h ? '#FFF' : T.sub,
            border: `1px solid ${hqFilter === h ? T.teal : T.border}`, cursor: 'pointer'
          }}>{h}</button>
        ))}
      </div>

      {tab === 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>Gross Margin Benchmarks (%)</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={[...filtered].sort((a, b) => b.grossMargin - a.grossMargin)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="company" width={110} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => [`${v}%`, 'Gross Margin']} />
                <Bar dataKey="grossMargin" radius={[0, 4, 4, 0]} fill={T.green} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>Cost per Wp vs Capacity (GW)</h3>
            <ResponsiveContainer width="100%" height={260}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="capacityGW" name="Capacity (GW)" label={{ value: 'Capacity (GW)', position: 'insideBottom', offset: -4, fontSize: 11 }} tick={{ fontSize: 11 }} />
                <YAxis dataKey="costPerWp" name="Cost/Wp ($)" label={{ value: 'Cost/Wp ($)', angle: -90, position: 'insideLeft', fontSize: 11 }} tick={{ fontSize: 11 }} />
                <ZAxis dataKey="grossMargin" range={[30, 200]} />
                <Tooltip content={({ payload }) => {
                  if (!payload?.length) return null;
                  const d = payload[0]?.payload;
                  return (
                    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
                      <div style={{ fontWeight: 700 }}>{d.company}</div>
                      <div>Capacity: {d.capacityGW} GW</div>
                      <div>Cost: ${d.costPerWp}/Wp</div>
                      <div>Margin: {d.grossMargin}%</div>
                    </div>
                  );
                }} />
                <Scatter data={filtered} fill={T.blue} opacity={0.75} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}`, gridColumn: '1/-1' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700 }}>Manufacturer Benchmarks</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.bg }}>
                    {['Company', 'HQ', 'Capacity (GW)', 'Utilization', 'Gross Margin', 'Opex ($/W)', 'Capex/GW ($bn)', 'Automation', 'Integration', 'Cost/Wp'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.sub, fontWeight: 600, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m, i) => (
                    <tr key={m.id} style={{ background: i % 2 === 0 ? T.card : T.bg }}>
                      <td style={{ padding: '7px 10px', fontWeight: 700 }}>{m.company}</td>
                      <td style={{ padding: '7px 10px' }}>{m.hq}</td>
                      <td style={{ padding: '7px 10px' }}>{m.capacityGW}</td>
                      <td style={{ padding: '7px 10px', color: m.utilization >= 85 ? T.green : T.amber }}>{m.utilization}%</td>
                      <td style={{ padding: '7px 10px', color: m.grossMargin >= 20 ? T.green : T.text, fontWeight: 600 }}>{m.grossMargin}%</td>
                      <td style={{ padding: '7px 10px' }}>${m.opexW}</td>
                      <td style={{ padding: '7px 10px' }}>${m.capexGW}bn</td>
                      <td style={{ padding: '7px 10px' }}>{'★'.repeat(m.automation)}{'☆'.repeat(5 - m.automation)}</td>
                      <td style={{ padding: '7px 10px', fontSize: 11 }}>{m.integration}</td>
                      <td style={{ padding: '7px 10px', fontWeight: 700, color: m.costPerWp <= 0.18 ? T.green : m.costPerWp >= 0.30 ? T.red : T.amber }}>${m.costPerWp}</td>
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
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>BOM Cost Breakdown (¢/Wp) — China Manufacturer</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={BOM_COMPONENTS} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="component" width={120} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => [`${v}¢/Wp`, 'Cost']} />
                <Bar dataKey="costCents" radius={[0, 4, 4, 0]}>
                  {BOM_COMPONENTS.map((c, i) => <Cell key={i} fill={c.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>BOM Share (%)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={BOM_COMPONENTS} dataKey="pct" nameKey="component" cx="50%" cy="50%" outerRadius={90} label={({ component, pct }) => pct > 4 ? `${pct}%` : ''}>
                  {BOM_COMPONENTS.map((c, i) => <Cell key={i} fill={c.color} />)}
                </Pie>
                <Tooltip formatter={(v) => [`${v}%`, 'Share']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 2 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>Capex per GW vs Capacity</h3>
            <ResponsiveContainer width="100%" height={260}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="capacityGW" name="Capacity (GW)" label={{ value: 'Capacity (GW)', position: 'insideBottom', offset: -4, fontSize: 11 }} tick={{ fontSize: 11 }} />
                <YAxis dataKey="capexGW" name="Capex/GW ($bn)" label={{ value: 'Capex/GW ($bn)', angle: -90, position: 'insideLeft', fontSize: 11 }} tick={{ fontSize: 11 }} />
                <Tooltip content={({ payload }) => {
                  if (!payload?.length) return null;
                  const d = payload[0]?.payload;
                  return <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', fontSize: 12 }}><div style={{ fontWeight: 700 }}>{d.company}</div><div>${d.capexGW}bn/GW</div></div>;
                }} />
                <Scatter data={filtered} fill={T.indigo} opacity={0.75} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>Scale Economics: Opex vs Capacity</h3>
            <ResponsiveContainer width="100%" height={260}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="capacityGW" name="Capacity (GW)" label={{ value: 'Capacity (GW)', position: 'insideBottom', offset: -4, fontSize: 11 }} tick={{ fontSize: 11 }} />
                <YAxis dataKey="opexW" name="Opex ($/W)" label={{ value: 'Opex ($/W)', angle: -90, position: 'insideLeft', fontSize: 11 }} tick={{ fontSize: 11 }} />
                <Tooltip content={({ payload }) => {
                  if (!payload?.length) return null;
                  const d = payload[0]?.payload;
                  return <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', fontSize: 12 }}><div style={{ fontWeight: 700 }}>{d.company}</div><div>Opex: ${d.opexW}/W</div></div>;
                }} />
                <Scatter data={filtered} fill={T.teal} opacity={0.75} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 3 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>Automation Level by Manufacturer</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={filtered} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="company" width={110} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => [`${v}/5`, 'Automation Level']} />
                <Bar dataKey="automation" radius={[0, 4, 4, 0]}>
                  {filtered.map((m, i) => <Cell key={i} fill={m.automation >= 4 ? T.green : m.automation === 3 ? T.amber : T.red} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>Integration Model Distribution</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={[
                  { name: 'Poly-to-Module', value: MANUFACTURERS.filter(m => m.integration === 'poly-to-module').length },
                  { name: 'Cell-to-Module', value: MANUFACTURERS.filter(m => m.integration === 'cell-to-module').length },
                  { name: 'Module Only', value: MANUFACTURERS.filter(m => m.integration === 'module_only').length },
                ]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name}: ${value}`}>
                  {[T.blue, T.teal, T.amber].map((c, i) => <Cell key={i} fill={c} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 4 && (
        <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>Module Margin Waterfall ($/Wp) — China Tier-1</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={marginWaterfall}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="stage" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [`$${v.toFixed(3)}/Wp`, 'Value']} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {marginWaterfall.map((d, i) => (
                  <Cell key={i} fill={d.type === 'base' ? T.blue : d.type === 'profit' ? T.green : T.red} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 5 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}`, gridColumn: '1/-1' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700 }}>IRA §48C Advanced Manufacturing Tax Credit — Impact Analysis</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 16 }}>
              {[
                { label: 'Credit Rate', value: '30%', desc: 'of qualified investment in advanced energy projects' },
                { label: 'Total Allocation', value: '$10B', desc: 'initial + $10B 2nd round (IRA 2022)' },
                { label: 'Module Credit', value: '$0.04/W', desc: '§48E production credit for modules' },
                { label: 'Cell Credit', value: '$0.04/W', desc: '§48E production credit for cells' },
                { label: 'Domestic Bonus', value: '+10%', desc: 'ITC adder for ≥40% US-content modules' },
              ].map((item, i) => (
                <div key={i} style={{ background: T.bg, borderRadius: 8, padding: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: T.indigo }}>{item.value}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, marginTop: 3 }}>{item.label}</div>
                  <div style={{ fontSize: 10, color: T.sub, marginTop: 3 }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>Wright's Law Learning Curve — Module Cost ($/Wp)</h3>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={LEARNING_CURVE}>
                <defs>
                  <linearGradient id="lcGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={T.blue} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={T.blue} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v, n) => [n === 'costPerW' ? `$${v}/Wp` : `${v} GW`, n === 'costPerW' ? 'Module Cost' : 'Cumulative Volume']} />
                <Area type="monotone" dataKey="costPerW" name="costPerW" stroke={T.blue} fill="url(#lcGrad)" strokeWidth={2.5} dot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>Cumulative Deployment (GW)</h3>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={LEARNING_CURVE}>
                <defs>
                  <linearGradient id="gwGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={T.green} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={T.green} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v} GW`, 'Cumulative']} />
                <Area type="monotone" dataKey="cumulativeGW" stroke={T.green} fill="url(#gwGrad)" strokeWidth={2.5} dot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
