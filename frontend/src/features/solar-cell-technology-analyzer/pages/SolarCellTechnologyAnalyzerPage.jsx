/**
 * EP-ED2 — Solar Cell Technology Comparison & Market Analysis
 * NREL record efficiencies: TOPCon 26.1%, HJT 26.8%, IBC 26.7%, Tandem 33.9%
 * Market share transition: PERC 83% (2022) → TOPCon 40% (2024)
 * Wright's Law: 24% learning rate per doubling of cumulative capacity
 */
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

const TECHNOLOGIES = [
  { id: 1, name: 'PERC', efficiencyRecord: 24.5, commercialEff: 22.8, costPerWp: 0.18, tempCoeff: -0.36, bifaciality: 75, degradationYr: 0.55, maturity: 5, trl: 9, keyPlayer: 'LONGi, JA Solar, Trina', marketShare2024: 35, color: T.blue },
  { id: 2, name: 'TOPCon', efficiencyRecord: 26.1, commercialEff: 24.2, costPerWp: 0.22, tempCoeff: -0.30, bifaciality: 80, degradationYr: 0.45, maturity: 4, trl: 9, keyPlayer: 'Jinko, LONGi, REC', marketShare2024: 40, color: T.teal },
  { id: 3, name: 'HJT', efficiencyRecord: 26.8, commercialEff: 24.5, costPerWp: 0.28, tempCoeff: -0.24, bifaciality: 92, degradationYr: 0.40, maturity: 4, trl: 9, keyPlayer: 'Huasun, REC, Panasonic', marketShare2024: 8, color: T.green },
  { id: 4, name: 'IBC', efficiencyRecord: 26.7, commercialEff: 24.0, costPerWp: 0.35, tempCoeff: -0.29, bifaciality: 95, degradationYr: 0.38, maturity: 3, trl: 9, keyPlayer: 'SunPower, Maxeon, LONGi', marketShare2024: 3, color: T.indigo },
  { id: 5, name: 'Perovskite-Si Tandem', efficiencyRecord: 33.9, commercialEff: 28.5, costPerWp: 0.45, tempCoeff: -0.20, bifaciality: 85, degradationYr: 1.20, maturity: 2, trl: 6, keyPlayer: 'Oxford PV, Heliatek, Saule', marketShare2024: 0.1, color: T.gold },
  { id: 6, name: 'BSF Monofacial', efficiencyRecord: 22.3, commercialEff: 20.5, costPerWp: 0.14, tempCoeff: -0.40, bifaciality: 0, degradationYr: 0.65, maturity: 5, trl: 9, keyPlayer: 'Legacy manufacturers', marketShare2024: 10, color: T.sub },
  { id: 7, name: 'CdTe', efficiencyRecord: 22.3, commercialEff: 19.8, costPerWp: 0.20, tempCoeff: -0.28, bifaciality: 0, degradationYr: 0.50, maturity: 5, trl: 9, keyPlayer: 'First Solar', marketShare2024: 3, color: T.amber },
  { id: 8, name: 'CIGS', efficiencyRecord: 23.4, commercialEff: 17.5, costPerWp: 0.32, tempCoeff: -0.32, bifaciality: 0, degradationYr: 0.60, maturity: 4, trl: 8, keyPlayer: 'Solar Frontier, Avancis', marketShare2024: 1, color: T.sage },
];

const EFFICIENCY_ROADMAP = [
  { year: 2010, PERC: 19.0, TOPCon: null, HJT: 20.0, IBC: 23.5, CdTe: 16.0, CIGS: 16.5 },
  { year: 2012, PERC: 19.5, TOPCon: null, HJT: 20.8, IBC: 23.8, CdTe: 16.5, CIGS: 17.0 },
  { year: 2014, PERC: 20.5, TOPCon: 21.0, HJT: 21.5, IBC: 24.2, CdTe: 17.5, CIGS: 18.0 },
  { year: 2016, PERC: 21.5, TOPCon: 22.5, HJT: 22.5, IBC: 24.5, CdTe: 18.5, CIGS: 19.5 },
  { year: 2018, PERC: 22.0, TOPCon: 23.2, HJT: 23.2, IBC: 25.0, CdTe: 19.5, CIGS: 20.5 },
  { year: 2020, PERC: 22.5, TOPCon: 24.0, HJT: 24.0, IBC: 25.5, CdTe: 21.0, CIGS: 21.5 },
  { year: 2022, PERC: 23.2, TOPCon: 25.0, HJT: 25.5, IBC: 26.0, CdTe: 22.0, CIGS: 22.5 },
  { year: 2024, PERC: 24.5, TOPCon: 26.1, HJT: 26.8, IBC: 26.7, CdTe: 22.3, CIGS: 23.4 },
  { year: 2025, PERC: 24.8, TOPCon: 26.5, HJT: 27.2, IBC: 27.0, CdTe: 22.8, CIGS: 23.8 },
];

const TABS = [
  'Technology Comparison', 'Efficiency Roadmap', 'Cost Curve',
  'Manufacturing Complexity', 'Market Share', 'Investment Thesis'
];

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 18px', flex: 1, minWidth: 140 }}>
    <div style={{ fontSize: 12, color: T.sub, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.text }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{sub}</div>}
  </div>
);

export default function SolarCellTechnologyAnalyzerPage() {
  const [tab, setTab] = useState(0);
  const [selectedTech, setSelectedTech] = useState(null);

  const filtered = selectedTech ? TECHNOLOGIES.filter(t => t.name === selectedTech) : TECHNOLOGIES;

  const radarData = useMemo(() => [
    { metric: 'Efficiency', ...Object.fromEntries(TECHNOLOGIES.map(t => [t.name, t.commercialEff])) },
    { metric: 'Bifaciality', ...Object.fromEntries(TECHNOLOGIES.map(t => [t.name, t.bifaciality])) },
    { metric: 'Maturity', ...Object.fromEntries(TECHNOLOGIES.map(t => [t.name, t.maturity * 20])) },
    { metric: 'Low Degradation', ...Object.fromEntries(TECHNOLOGIES.map(t => [t.name, Math.max(0, 100 - t.degradationYr * 60)])) },
    { metric: 'Low TempCoeff', ...Object.fromEntries(TECHNOLOGIES.map(t => [t.name, Math.max(0, 100 + t.tempCoeff * 150)])) },
  ], []);

  const marketShareData = useMemo(() => TECHNOLOGIES.map(t => ({ name: t.name, value: t.marketShare2024 })), []);

  const COLORS = TECHNOLOGIES.map(t => t.color);

  const costEffData = useMemo(() => TECHNOLOGIES.map(t => ({
    name: t.name,
    costPerWp: t.costPerWp,
    commercialEff: t.commercialEff,
    marketShare: t.marketShare2024,
    color: t.color,
  })), []);

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: '24px 28px', color: T.text }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: T.sub, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>EP-ED2 · NREL / Fraunhofer ISE / BloombergNEF</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: T.navy }}>Solar Cell Technology Comparison & Investment Analytics</h1>
        <p style={{ color: T.sub, marginTop: 6, fontSize: 13 }}>PERC→TOPCon market transition · HJT bifaciality >90% · Tandem >30% efficiency target 2027</p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <KpiCard label="Best Record Efficiency" value="33.9%" sub="Perovskite-Si Tandem (NREL)" color={T.gold} />
        <KpiCard label="TOPCon Market Share 2024" value="~40%" sub="Fastest-growing technology" color={T.teal} />
        <KpiCard label="Lowest Degradation" value="0.38%/yr" sub="IBC technology" color={T.green} />
        <KpiCard label="Lowest Cost/Wp" value="$0.14" sub="BSF Monofacial (legacy)" color={T.blue} />
        <KpiCard label="HJT Bifaciality" value="92%" sub="Highest among commercial" color={T.indigo} />
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{
            padding: '7px 16px', borderRadius: 20, fontSize: 13, fontWeight: tab === i ? 700 : 500,
            background: tab === i ? T.navy : T.card, color: tab === i ? '#FFF' : T.sub,
            border: `1px solid ${tab === i ? T.navy : T.border}`, cursor: 'pointer'
          }}>{t}</button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <button onClick={() => setSelectedTech(null)} style={{
          padding: '5px 12px', borderRadius: 14, fontSize: 12, fontWeight: !selectedTech ? 700 : 400,
          background: !selectedTech ? T.navy : T.card, color: !selectedTech ? '#FFF' : T.sub,
          border: `1px solid ${!selectedTech ? T.navy : T.border}`, cursor: 'pointer'
        }}>All Technologies</button>
        {TECHNOLOGIES.map(tech => (
          <button key={tech.name} onClick={() => setSelectedTech(tech.name === selectedTech ? null : tech.name)} style={{
            padding: '5px 12px', borderRadius: 14, fontSize: 12, fontWeight: selectedTech === tech.name ? 700 : 400,
            background: selectedTech === tech.name ? tech.color : T.card, color: selectedTech === tech.name ? '#FFF' : T.sub,
            border: `1px solid ${selectedTech === tech.name ? tech.color : T.border}`, cursor: 'pointer'
          }}>{tech.name}</button>
        ))}
      </div>

      {tab === 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>Record vs Commercial Efficiency (%)</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={filtered}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
                <YAxis domain={[14, 36]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="efficiencyRecord" name="Record Efficiency (%)" fill={T.indigo} radius={[4, 4, 0, 0]} />
                <Bar dataKey="commercialEff" name="Commercial Efficiency (%)" fill={T.teal} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>Temperature Coefficient & Degradation</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={filtered}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="degradationYr" name="Annual Degradation (%/yr)" fill={T.red} radius={[4, 4, 0, 0]} />
                <Bar dataKey="bifaciality" name="Bifaciality (%)" fill={T.green} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}`, gridColumn: '1/-1' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700 }}>Technology Benchmark Table</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.bg }}>
                    {['Technology', 'Record Eff.', 'Commercial Eff.', 'Cost/Wp', 'Temp Coeff (%/°C)', 'Bifaciality (%)', 'Degradation (%/yr)', 'Maturity', 'TRL', 'Key Players'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.sub, fontWeight: 600, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t, i) => (
                    <tr key={t.id} style={{ background: i % 2 === 0 ? T.card : T.bg }}>
                      <td style={{ padding: '7px 10px', fontWeight: 700, color: t.color }}>{t.name}</td>
                      <td style={{ padding: '7px 10px' }}>{t.efficiencyRecord}%</td>
                      <td style={{ padding: '7px 10px' }}>{t.commercialEff}%</td>
                      <td style={{ padding: '7px 10px', fontWeight: 600 }}>${t.costPerWp}/Wp</td>
                      <td style={{ padding: '7px 10px', color: t.tempCoeff < -0.35 ? T.red : T.green }}>{t.tempCoeff}%/°C</td>
                      <td style={{ padding: '7px 10px' }}>{t.bifaciality}%</td>
                      <td style={{ padding: '7px 10px', color: t.degradationYr > 0.8 ? T.red : T.green }}>{t.degradationYr}%/yr</td>
                      <td style={{ padding: '7px 10px' }}>{'★'.repeat(t.maturity)}{'☆'.repeat(5 - t.maturity)}</td>
                      <td style={{ padding: '7px 10px' }}>TRL-{t.trl}</td>
                      <td style={{ padding: '7px 10px', fontSize: 11, color: T.sub }}>{t.keyPlayer}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>Efficiency Roadmap by Technology (2010–2025)</h3>
            <ResponsiveContainer width="100%" height={340}>
              <LineChart data={EFFICIENCY_ROADMAP}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis domain={[15, 35]} tick={{ fontSize: 11 }} label={{ value: 'Efficiency (%)', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="PERC" stroke={T.blue} strokeWidth={2} dot={{ r: 3 }} connectNulls />
                <Line type="monotone" dataKey="TOPCon" stroke={T.teal} strokeWidth={2} dot={{ r: 3 }} connectNulls />
                <Line type="monotone" dataKey="HJT" stroke={T.green} strokeWidth={2} dot={{ r: 3 }} connectNulls />
                <Line type="monotone" dataKey="IBC" stroke={T.indigo} strokeWidth={2} dot={{ r: 3 }} connectNulls />
                <Line type="monotone" dataKey="CdTe" stroke={T.amber} strokeWidth={2} dot={{ r: 3 }} connectNulls />
                <Line type="monotone" dataKey="CIGS" stroke={T.sage} strokeWidth={2} dot={{ r: 3 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>Efficiency Gap: Record vs Commercial</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={TECHNOLOGIES.map(t => ({ name: t.name, gap: (t.efficiencyRecord - t.commercialEff).toFixed(1), color: t.color }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 11 }} label={{ value: 'Efficiency Gap (%)', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v}%`, 'Efficiency Gap']} />
                <Bar dataKey="gap" radius={[4, 4, 0, 0]}>
                  {TECHNOLOGIES.map((t, i) => <Cell key={i} fill={t.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 2 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>Cost vs Commercial Efficiency</h3>
            <ResponsiveContainer width="100%" height={280}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="costPerWp" name="Cost ($/Wp)" label={{ value: 'Cost ($/Wp)', position: 'insideBottom', offset: -4, fontSize: 11 }} tick={{ fontSize: 11 }} />
                <YAxis dataKey="commercialEff" name="Efficiency (%)" label={{ value: 'Efficiency (%)', angle: -90, position: 'insideLeft', fontSize: 11 }} tick={{ fontSize: 11 }} domain={[18, 30]} />
                <ZAxis dataKey="marketShare" range={[40, 400]} />
                <Tooltip content={({ payload }) => {
                  if (!payload?.length) return null;
                  const d = payload[0]?.payload;
                  return (
                    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
                      <div style={{ fontWeight: 700, color: d.color }}>{d.name}</div>
                      <div>Cost: ${d.costPerWp}/Wp</div>
                      <div>Efficiency: {d.commercialEff}%</div>
                      <div>Market Share: {d.marketShare}%</div>
                    </div>
                  );
                }} />
                {costEffData.map((t, i) => (
                  <Scatter key={i} data={[t]} fill={t.color} name={t.name} />
                ))}
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>Cost per Watt-peak by Technology</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={[...TECHNOLOGIES].sort((a, b) => a.costPerWp - b.costPerWp)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`$${v}/Wp`, 'Cost']} />
                <Bar dataKey="costPerWp" radius={[0, 4, 4, 0]}>
                  {[...TECHNOLOGIES].sort((a, b) => a.costPerWp - b.costPerWp).map((t, i) => <Cell key={i} fill={t.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 3 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>Technology Radar — Multi-Attribute Score</h3>
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={radarData}>
                <PolarGrid stroke={T.border} />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
                {['PERC', 'TOPCon', 'HJT', 'IBC'].map((name, i) => {
                  const tech = TECHNOLOGIES.find(t => t.name === name);
                  return <Radar key={name} name={name} dataKey={name} stroke={tech?.color} fill={tech?.color} fillOpacity={0.1} />;
                })}
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>Commercial Maturity & TRL Level</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {TECHNOLOGIES.map((t, i) => (
                <div key={i} style={{ padding: '10px 14px', borderRadius: 8, background: T.bg, borderLeft: `4px solid ${t.color}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: t.color }}>{t.name}</span>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <span style={{ fontSize: 11, background: T.card, padding: '2px 8px', borderRadius: 10, border: `1px solid ${T.border}` }}>Maturity {t.maturity}/5</span>
                      <span style={{ fontSize: 11, background: T.card, padding: '2px 8px', borderRadius: 10, border: `1px solid ${T.border}` }}>TRL-{t.trl}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: T.sub, marginTop: 4 }}>{t.keyPlayer}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 4 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>2024 Market Share by Technology</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={marketShareData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => value > 2 ? `${name} ${value}%` : ''}>
                  {marketShareData.map((_, i) => <Cell key={i} fill={TECHNOLOGIES[i].color} />)}
                </Pie>
                <Tooltip formatter={(v) => [`${v}%`, 'Market Share']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>PERC → TOPCon Transition Timeline</h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={[
                { year: 2020, PERC: 80, TOPCon: 2, HJT: 3, IBC: 2, Other: 13 },
                { year: 2021, PERC: 83, TOPCon: 5, HJT: 4, IBC: 2, Other: 6 },
                { year: 2022, PERC: 78, TOPCon: 12, HJT: 5, IBC: 2, Other: 3 },
                { year: 2023, PERC: 60, TOPCon: 28, HJT: 7, IBC: 2, Other: 3 },
                { year: 2024, PERC: 35, TOPCon: 40, HJT: 8, IBC: 3, Other: 14 },
                { year: 2025, PERC: 22, TOPCon: 50, HJT: 12, IBC: 4, Other: 12 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="PERC" stackId="1" stroke={T.blue} fill={T.blue} fillOpacity={0.7} />
                <Area type="monotone" dataKey="TOPCon" stackId="1" stroke={T.teal} fill={T.teal} fillOpacity={0.7} />
                <Area type="monotone" dataKey="HJT" stackId="1" stroke={T.green} fill={T.green} fillOpacity={0.7} />
                <Area type="monotone" dataKey="IBC" stackId="1" stroke={T.indigo} fill={T.indigo} fillOpacity={0.7} />
                <Area type="monotone" dataKey="Other" stackId="1" stroke={T.sub} fill={T.sub} fillOpacity={0.4} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 5 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            {TECHNOLOGIES.map((tech, i) => (
              <div key={i} style={{ background: T.card, borderRadius: 12, padding: 18, border: `2px solid ${tech.color}20`, borderLeft: `4px solid ${tech.color}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: tech.color }}>{tech.name}</h3>
                  <span style={{ fontSize: 12, fontWeight: 600, background: `${tech.color}15`, color: tech.color, padding: '3px 10px', borderRadius: 12 }}>
                    {tech.marketShare2024}% share
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                  {[
                    { label: 'Commercial Eff.', val: `${tech.commercialEff}%` },
                    { label: 'Cost/Wp', val: `$${tech.costPerWp}` },
                    { label: 'Bifaciality', val: `${tech.bifaciality}%` },
                    { label: 'Degradation', val: `${tech.degradationYr}%/yr` },
                  ].map((m, j) => (
                    <div key={j} style={{ background: T.bg, borderRadius: 6, padding: '6px 10px' }}>
                      <div style={{ fontSize: 10, color: T.sub }}>{m.label}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{m.val}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: T.sub }}><strong>Key Players:</strong> {tech.keyPlayer}</div>
              </div>
            ))}
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>Investment Thesis by Technology</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {[
                { tech: 'TOPCon', rating: 'Strong Buy', horizon: '2024–2027', thesis: 'Dominant market share growth from PERC migration; cost parity with PERC 2025E; bifaciality advantage in utility scale', risk: 'Commoditisation risk as Chinese capacity floods market', color: T.teal },
                { tech: 'HJT', rating: 'Buy', horizon: '2025–2028', thesis: 'Best-in-class bifaciality (92%) and temperature coefficient; IRA domestic manufacturing incentive beneficiary; RE-powered manufacturing sharply reduces carbon premium', risk: 'Higher silver paste consumption (40mg/cell) vs TOPCon; capex 30% higher', color: T.green },
                { tech: 'IBC', rating: 'Hold', horizon: '2026–2030', thesis: 'Highest efficiency and lowest degradation; premium residential market; Maxeon 40-year linear warranty sets industry standard', risk: 'Niche market; cannot compete on cost with TOPCon at utility scale', color: T.indigo },
                { tech: 'Perovskite-Si Tandem', rating: 'Speculative', horizon: '2027–2032', thesis: '>30% efficiency unlocks new LCOE record; if stability/scalability hurdles cleared, transforms module value proposition', risk: 'Degradation 1.2%/yr unacceptable; encapsulation unsolved; lead concerns for RoHS compliance', color: T.gold },
              ].map((inv, i) => (
                <div key={i} style={{ background: T.bg, borderRadius: 10, padding: 14, border: `1px solid ${T.border}` }}>
                  <div style={{ color: inv.color, fontWeight: 800, fontSize: 15, marginBottom: 6 }}>{inv.tech}</div>
                  <div style={{ background: inv.color, color: '#fff', borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 700, display: 'inline-block', marginBottom: 8 }}>{inv.rating}</div>
                  <div style={{ fontSize: 11, color: T.sub, marginBottom: 4 }}>Horizon: {inv.horizon}</div>
                  <div style={{ fontSize: 11, color: T.text, marginBottom: 6 }}>{inv.thesis}</div>
                  <div style={{ fontSize: 10, color: T.red, borderTop: `1px solid ${T.border}`, paddingTop: 6 }}>Risk: {inv.risk}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
