import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, Legend, ReferenceLine, ZAxis
} from 'recharts';

const T = {
  bg: '#f6f4f0', surface: '#ffffff', border: '#e5e0d8', navy: '#1b3a5c',
  navyL: '#2c5a8c', gold: '#c5a96a', textSec: '#5c6b7e', textMut: '#9aa3ae',
  red: '#dc2626', green: '#16a34a', amber: '#d97706', blue: '#2563eb',
  orange: '#ea580c', purple: '#7c3aed', teal: '#0891b2', sage: '#5a8a6a',
  font: "'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono: "'JetBrains Mono','SF Mono','Fira Code',monospace"
};

// ─── Adaptation strategies by sector ────────────────────────────────────────
const STRATEGIES = [
  {
    id: 'S1', name: 'Coastal Defence Infrastructure', sector: 'Real Estate',
    type: 'Engineered', hazard: 'Sea Level Rise / Coastal Flood',
    cost_m: 450, benefit_m: 1820, bcr: 4.04, irr: 18.2, payback: 7,
    effectiveness: 85, co_benefits: 72, maladapt_risk: 15,
    timeline: '3–7 years', maturity: 'Proven',
    description: 'Sea walls, flood barriers, managed retreat planning for coastal property portfolios',
    ssp_sensitivity: [{ ssp: 'SSP1-2.6', bcr: 5.2 }, { ssp: 'SSP2-4.5', bcr: 4.0 }, { ssp: 'SSP3-7.0', bcr: 3.1 }, { ssp: 'SSP5-8.5', bcr: 2.4 }],
  },
  {
    id: 'S2', name: 'Urban Heat Island Mitigation', sector: 'Real Estate',
    type: 'Nature-Based', hazard: 'Extreme Heat / WBGT',
    cost_m: 120, benefit_m: 680, bcr: 5.67, irr: 24.5, payback: 4,
    effectiveness: 78, co_benefits: 92, maladapt_risk: 5,
    timeline: '2–5 years', maturity: 'Proven',
    description: 'Green roofs, urban canopy expansion, cool pavement, reflective surfaces',
    ssp_sensitivity: [{ ssp: 'SSP1-2.6', bcr: 6.8 }, { ssp: 'SSP2-4.5', bcr: 5.7 }, { ssp: 'SSP3-7.0', bcr: 4.2 }, { ssp: 'SSP5-8.5', bcr: 3.5 }],
  },
  {
    id: 'S3', name: 'Flood-Resilient Supply Chains', sector: 'Industrials',
    type: 'Operational', hazard: 'River Flood / Flash Flood',
    cost_m: 85, benefit_m: 520, bcr: 6.12, irr: 28.1, payback: 3,
    effectiveness: 72, co_benefits: 45, maladapt_risk: 10,
    timeline: '1–3 years', maturity: 'Proven',
    description: 'Dual-sourcing, elevated inventory buffers, flood-mapped route diversification',
    ssp_sensitivity: [{ ssp: 'SSP1-2.6', bcr: 7.5 }, { ssp: 'SSP2-4.5', bcr: 6.1 }, { ssp: 'SSP3-7.0', bcr: 4.8 }, { ssp: 'SSP5-8.5', bcr: 3.9 }],
  },
  {
    id: 'S4', name: 'Drought-Resistant Agriculture', sector: 'Agriculture',
    type: 'Nature-Based', hazard: 'Drought / Water Scarcity',
    cost_m: 200, benefit_m: 940, bcr: 4.70, irr: 21.3, payback: 5,
    effectiveness: 80, co_benefits: 88, maladapt_risk: 8,
    timeline: '2–6 years', maturity: 'Scaling',
    description: 'Drought-tolerant cultivars, precision irrigation, soil moisture management, agroforestry',
    ssp_sensitivity: [{ ssp: 'SSP1-2.6', bcr: 5.8 }, { ssp: 'SSP2-4.5', bcr: 4.7 }, { ssp: 'SSP3-7.0', bcr: 3.6 }, { ssp: 'SSP5-8.5', bcr: 2.8 }],
  },
  {
    id: 'S5', name: 'Wildfire Buffer Zones', sector: 'Utilities',
    type: 'Hybrid', hazard: 'Wildfire',
    cost_m: 160, benefit_m: 890, bcr: 5.56, irr: 22.8, payback: 5,
    effectiveness: 75, co_benefits: 65, maladapt_risk: 12,
    timeline: '3–8 years', maturity: 'Scaling',
    description: 'Vegetation management, grid hardening, undergrounding, early warning systems',
    ssp_sensitivity: [{ ssp: 'SSP1-2.6', bcr: 6.5 }, { ssp: 'SSP2-4.5', bcr: 5.6 }, { ssp: 'SSP3-7.0', bcr: 4.1 }, { ssp: 'SSP5-8.5', bcr: 3.2 }],
  },
  {
    id: 'S6', name: 'Climate-Resilient Water Systems', sector: 'Utilities',
    type: 'Engineered', hazard: 'Drought / Flood',
    cost_m: 380, benefit_m: 1450, bcr: 3.82, irr: 16.5, payback: 8,
    effectiveness: 82, co_benefits: 70, maladapt_risk: 18,
    timeline: '5–12 years', maturity: 'Proven',
    description: 'Reservoir expansion, desalination, water recycling, smart metering, catchment management',
    ssp_sensitivity: [{ ssp: 'SSP1-2.6', bcr: 4.5 }, { ssp: 'SSP2-4.5', bcr: 3.8 }, { ssp: 'SSP3-7.0', bcr: 3.0 }, { ssp: 'SSP5-8.5', bcr: 2.3 }],
  },
  {
    id: 'S7', name: 'Parametric Insurance Programmes', sector: 'Financials',
    type: 'Financial', hazard: 'Multi-Peril',
    cost_m: 45, benefit_m: 310, bcr: 6.89, irr: 32.4, payback: 2,
    effectiveness: 68, co_benefits: 35, maladapt_risk: 20,
    timeline: '0.5–1 year', maturity: 'Proven',
    description: 'Index-based insurance triggers, cat bonds, sovereign risk pools (CCRIF, ARC)',
    ssp_sensitivity: [{ ssp: 'SSP1-2.6', bcr: 8.2 }, { ssp: 'SSP2-4.5', bcr: 6.9 }, { ssp: 'SSP3-7.0', bcr: 5.1 }, { ssp: 'SSP5-8.5', bcr: 4.0 }],
  },
  {
    id: 'S8', name: 'Mangrove & Wetland Restoration', sector: 'Insurance',
    type: 'Nature-Based', hazard: 'Coastal Flood / Storm Surge',
    cost_m: 90, benefit_m: 720, bcr: 8.00, irr: 35.6, payback: 3,
    effectiveness: 76, co_benefits: 95, maladapt_risk: 3,
    timeline: '5–15 years', maturity: 'Scaling',
    description: 'Coastal ecosystem restoration reducing storm surge by 60–80%, plus carbon credits, biodiversity, fisheries',
    ssp_sensitivity: [{ ssp: 'SSP1-2.6', bcr: 9.5 }, { ssp: 'SSP2-4.5', bcr: 8.0 }, { ssp: 'SSP3-7.0', bcr: 6.2 }, { ssp: 'SSP5-8.5', bcr: 4.8 }],
  },
];

const ADAPTATION_FINANCE = [
  { yr: 2020, need: 70, flow: 21, gap: 49 },
  { yr: 2021, need: 80, flow: 23, gap: 57 },
  { yr: 2022, need: 95, flow: 28, gap: 67 },
  { yr: 2023, need: 115, flow: 32, gap: 83 },
  { yr: 2024, need: 140, flow: 38, gap: 102 },
  { yr: 2025, need: 170, flow: 46, gap: 124 },
  { yr: 2030, need: 340, flow: 85, gap: 255 },
];

const MALADAPT_CASES = [
  { name: 'Hard sea walls blocking natural drainage', risk: 'HIGH', sector: 'Infrastructure', hazard: 'Coastal Flood', consequence: 'Increased inland flooding behind barriers during rainfall events', mitigation: 'Integrate SuDS and permeable defences; combine with natural flood management' },
  { name: 'Desalination energy demand', risk: 'MEDIUM', sector: 'Water', hazard: 'Drought', consequence: '3–5 kWh/m³ energy cost may increase emissions if powered by fossil fuels', mitigation: 'Pair with dedicated renewable energy; require 100% RE-powered desalination' },
  { name: 'Air conditioning lock-in', risk: 'HIGH', sector: 'Buildings', hazard: 'Heat', consequence: 'Increased energy demand and refrigerant emissions; heat island amplification from waste heat', mitigation: 'Prioritise passive cooling (insulation, shading, ventilation) before active cooling' },
  { name: 'Monoculture drought-resistant crops', risk: 'MEDIUM', sector: 'Agriculture', hazard: 'Drought', consequence: 'Reduced biodiversity; vulnerability to new pests/diseases; soil degradation', mitigation: 'Diversified crop rotation; agroforestry; integrated pest management' },
  { name: 'Reservoir-induced seismicity', risk: 'LOW', sector: 'Water', hazard: 'Water Scarcity', consequence: 'Large dam construction in seismically active regions can trigger earthquakes', mitigation: 'Geotechnical assessment; prefer distributed small-scale storage where possible' },
];

const RADAR_DATA = [
  { axis: 'Effectiveness', val: 77 },
  { axis: 'BCR', val: 82 },
  { axis: 'Co-Benefits', val: 71 },
  { axis: 'Low Maladapt', val: 88 },
  { axis: 'Maturity', val: 75 },
  { axis: 'Scalability', val: 68 },
];

function bcrColor(bcr) {
  if (bcr >= 6) return T.green;
  if (bcr >= 4) return T.teal;
  if (bcr >= 2) return T.amber;
  return T.red;
}

const TABS = ['Strategy Catalogue', 'Cost-Benefit Analysis', 'Maladaptation Risk', 'Adaptation Finance Gap', 'Scenario Sensitivity'];

export default function ClimateAdaptationPathwaysPage() {
  const [tab, setTab] = useState(0);
  const [selectedStrategy, setSelectedStrategy] = useState(STRATEGIES[0]);
  const [scenario, setScenario] = useState('SSP2-4.5');

  const sortedByBcr = useMemo(() => [...STRATEGIES].sort((a, b) => b.bcr - a.bcr), []);

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh' }}>
      <div style={{ background: T.navy, padding: '24px 32px 0', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ color: T.gold, fontFamily: T.mono, fontSize: 11, letterSpacing: 2, marginBottom: 4 }}>EP-CF1 · CLIMATE ADAPTATION PATHWAYS</div>
            <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: 0 }}>Climate Adaptation Pathways Engine</h1>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>
              8 Strategies · Cost-Benefit Analysis · Maladaptation Risk · Adaptation Finance Gap · SSP Scenario Sensitivity
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['SSP1-2.6', 'SSP2-4.5', 'SSP3-7.0', 'SSP5-8.5'].map(s => (
              <button key={s} onClick={() => setScenario(s)} style={{
                padding: '8px 14px', borderRadius: 8, border: `2px solid ${scenario === s ? T.gold : 'transparent'}`,
                background: scenario === s ? 'rgba(197,169,106,0.15)' : 'rgba(255,255,255,0.08)',
                color: scenario === s ? T.gold : '#94a3b8', cursor: 'pointer', fontSize: 12, fontWeight: 600
              }}>{s}</button>
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

        {/* ══ TAB 0: Strategy Catalogue ══ */}
        {tab === 0 && (
          <div style={{ paddingTop: 24 }}>
            {/* KPI summary */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Strategies Evaluated', value: '8', sub: 'across 6 sectors', color: T.navy },
                { label: 'Avg Benefit-Cost Ratio', value: '5.6x', sub: 'weighted by investment size', color: T.green },
                { label: 'Total Investment Need', value: '$1.53B', sub: 'across all 8 strategies', color: T.blue },
                { label: 'Total Avoided Loss', value: '$7.33B', sub: 'NPV over 20-year horizon', color: T.teal },
                { label: 'Adaptation Finance Gap', value: '$124B/yr', sub: '2025 · UNEP estimate', color: T.red },
              ].map(k => (
                <div key={k.label} style={{ flex: 1, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 18px' }}>
                  <div style={{ fontFamily: T.mono, fontSize: 24, fontWeight: 700, color: k.color }}>{k.value}</div>
                  <div style={{ color: T.textSec, fontSize: 11, marginTop: 2 }}>{k.label}</div>
                  <div style={{ color: T.textMut, fontSize: 10, marginTop: 2 }}>{k.sub}</div>
                </div>
              ))}
            </div>

            {/* Strategy table */}
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24 }}>
              <h3 style={{ color: T.navy, margin: '0 0 16px', fontSize: 15 }}>Adaptation Strategy Catalogue</h3>
              <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.navy }}>
                    {['ID', 'Strategy', 'Sector', 'Type', 'Hazard', 'Cost ($M)', 'Benefit ($M)', 'BCR', 'IRR', 'Payback', 'Maturity'].map(h => (
                      <th key={h} style={{ padding: '10px 8px', color: '#fff', textAlign: h === 'Strategy' ? 'left' : 'center', fontSize: 10 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {STRATEGIES.map((s, i) => (
                    <tr key={s.id} onClick={() => setSelectedStrategy(s)} style={{
                      background: selectedStrategy.id === s.id ? T.gold + '11' : i % 2 === 0 ? T.bg : T.surface,
                      cursor: 'pointer', borderBottom: `1px solid ${T.border}`
                    }}>
                      <td style={{ padding: '8px', fontFamily: T.mono, color: T.gold, fontWeight: 700, textAlign: 'center' }}>{s.id}</td>
                      <td style={{ padding: '8px', fontWeight: 600, color: T.navy }}>{s.name}</td>
                      <td style={{ padding: '8px', textAlign: 'center', color: T.textSec }}>{s.sector}</td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <span style={{ background: s.type === 'Nature-Based' ? T.green + '22' : s.type === 'Engineered' ? T.blue + '22' : s.type === 'Financial' ? T.purple + '22' : T.amber + '22', color: s.type === 'Nature-Based' ? T.green : s.type === 'Engineered' ? T.blue : s.type === 'Financial' ? T.purple : T.amber, padding: '2px 6px', borderRadius: 4, fontSize: 9, fontWeight: 700 }}>{s.type}</span>
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center', color: T.textSec, fontSize: 10 }}>{s.hazard}</td>
                      <td style={{ padding: '8px', textAlign: 'center', fontFamily: T.mono }}>${s.cost_m}M</td>
                      <td style={{ padding: '8px', textAlign: 'center', fontFamily: T.mono, color: T.green }}>${s.benefit_m}M</td>
                      <td style={{ padding: '8px', textAlign: 'center', fontFamily: T.mono, fontWeight: 700, color: bcrColor(s.bcr) }}>{s.bcr}x</td>
                      <td style={{ padding: '8px', textAlign: 'center', fontFamily: T.mono }}>{s.irr}%</td>
                      <td style={{ padding: '8px', textAlign: 'center', fontFamily: T.mono }}>{s.payback}yr</td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <span style={{ background: s.maturity === 'Proven' ? T.green + '22' : T.amber + '22', color: s.maturity === 'Proven' ? T.green : T.amber, padding: '2px 6px', borderRadius: 4, fontSize: 9, fontWeight: 700 }}>{s.maturity}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Selected strategy detail */}
              {selectedStrategy && (
                <div style={{ marginTop: 20, padding: 20, background: T.bg, borderRadius: 10, border: `1px solid ${T.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ color: T.navy, margin: '0 0 6px', fontSize: 16 }}>{selectedStrategy.id} — {selectedStrategy.name}</h4>
                      <p style={{ color: T.textSec, fontSize: 12, margin: '0 0 12px', maxWidth: 600 }}>{selectedStrategy.description}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: T.mono, fontSize: 32, fontWeight: 700, color: bcrColor(selectedStrategy.bcr) }}>{selectedStrategy.bcr}x</div>
                      <div style={{ color: T.textSec, fontSize: 11 }}>Benefit-Cost Ratio</div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
                    {[
                      { label: 'Effectiveness', value: `${selectedStrategy.effectiveness}%`, color: T.teal },
                      { label: 'Co-Benefits Score', value: `${selectedStrategy.co_benefits}/100`, color: T.green },
                      { label: 'Maladaptation Risk', value: `${selectedStrategy.maladapt_risk}%`, color: selectedStrategy.maladapt_risk > 15 ? T.red : T.green },
                      { label: 'Implementation', value: selectedStrategy.timeline, color: T.blue },
                      { label: 'IRR', value: `${selectedStrategy.irr}%`, color: T.purple },
                    ].map(m => (
                      <div key={m.label} style={{ background: T.surface, padding: '10px 12px', borderRadius: 8, textAlign: 'center' }}>
                        <div style={{ fontFamily: T.mono, fontSize: 18, fontWeight: 700, color: m.color }}>{m.value}</div>
                        <div style={{ fontSize: 10, color: T.textSec, marginTop: 4 }}>{m.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ TAB 1: Cost-Benefit Analysis ══ */}
        {tab === 1 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20 }}>
                <h3 style={{ color: T.navy, margin: '0 0 14px', fontSize: 14 }}>Benefit-Cost Ratio by Strategy</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={sortedByBcr} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis type="number" domain={[0, 10]} tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={180} />
                    <Tooltip formatter={v => [`${v}x`, 'BCR']} />
                    <Bar dataKey="bcr" radius={[0, 6, 6, 0]}>
                      {sortedByBcr.map((s, i) => <Cell key={i} fill={bcrColor(s.bcr)} />)}
                    </Bar>
                    <ReferenceLine x={4} stroke={T.amber} strokeDasharray="4 4" label={{ value: '4x threshold', fill: T.amber, fontSize: 10 }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20 }}>
                <h3 style={{ color: T.navy, margin: '0 0 14px', fontSize: 14 }}>Cost vs. Benefit Scatter</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis type="number" dataKey="cost_m" name="Cost ($M)" tick={{ fontSize: 10 }} />
                    <YAxis type="number" dataKey="benefit_m" name="Benefit ($M)" tick={{ fontSize: 10 }} />
                    <ZAxis type="number" dataKey="bcr" range={[60, 300]} />
                    <Tooltip formatter={(v, n) => [`$${v}M`, n]} />
                    <Scatter data={STRATEGIES} fill={T.teal}>
                      {STRATEGIES.map((s, i) => <Cell key={i} fill={bcrColor(s.bcr)} />)}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Portfolio radar */}
            <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 16 }}>
              <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20 }}>
                <h3 style={{ color: T.navy, margin: '0 0 14px', fontSize: 14 }}>Portfolio Adaptation Radar</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <RadarChart data={RADAR_DATA}>
                    <PolarGrid stroke={T.border} />
                    <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                    <Radar dataKey="val" stroke={T.teal} fill={T.teal} fillOpacity={0.25} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20 }}>
                <h3 style={{ color: T.navy, margin: '0 0 14px', fontSize: 14 }}>IRR & Payback by Strategy Type</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={STRATEGIES}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="id" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="l" domain={[0, 40]} tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="r" orientation="right" domain={[0, 12]} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="l" dataKey="irr" name="IRR (%)" fill={T.teal} opacity={0.8} radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="r" dataKey="payback" name="Payback (yr)" fill={T.amber} opacity={0.6} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ══ TAB 2: Maladaptation Risk ══ */}
        {tab === 2 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24, marginBottom: 16 }}>
              <h3 style={{ color: T.navy, margin: '0 0 4px', fontSize: 15 }}>Maladaptation Risk Assessment</h3>
              <p style={{ color: T.textSec, fontSize: 12, margin: '0 0 20px' }}>
                Maladaptation occurs when adaptation actions increase vulnerability, shift risk to other systems, or create lock-in to high-emission pathways (IPCC AR6 WGII, Chapter 16)
              </p>

              {MALADAPT_CASES.map((c, i) => {
                const rc = c.risk === 'HIGH' ? T.red : c.risk === 'MEDIUM' ? T.amber : T.green;
                return (
                  <div key={i} style={{ padding: '16px 20px', background: T.bg, borderRadius: 10, border: `1px solid ${T.border}`, marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <span style={{ background: rc + '22', color: rc, padding: '3px 10px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>{c.risk}</span>
                        <span style={{ fontWeight: 700, color: T.navy, fontSize: 13 }}>{c.name}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <span style={{ background: T.navy + '11', color: T.navy, padding: '2px 8px', borderRadius: 4, fontSize: 10 }}>{c.sector}</span>
                        <span style={{ background: T.blue + '11', color: T.blue, padding: '2px 8px', borderRadius: 4, fontSize: 10 }}>{c.hazard}</span>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div>
                        <div style={{ fontSize: 10, color: T.red, fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Consequence</div>
                        <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.6 }}>{c.consequence}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: T.green, fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Mitigation</div>
                        <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.6 }}>{c.mitigation}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Maladaptation risk bar */}
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20 }}>
              <h3 style={{ color: T.navy, margin: '0 0 14px', fontSize: 14 }}>Maladaptation Risk by Strategy (%)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={STRATEGIES}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="id" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 25]} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={v => [`${v}%`, 'Maladaptation Risk']} />
                  <Bar dataKey="maladapt_risk" name="Maladaptation Risk %" radius={[6, 6, 0, 0]}>
                    {STRATEGIES.map((s, i) => <Cell key={i} fill={s.maladapt_risk > 15 ? T.red : s.maladapt_risk > 10 ? T.amber : T.green} />)}
                  </Bar>
                  <ReferenceLine y={15} stroke={T.red} strokeDasharray="4 4" label={{ value: 'High threshold', fill: T.red, fontSize: 10 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ══ TAB 3: Adaptation Finance Gap ══ */}
        {tab === 3 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Global Adaptation Need (2025)', value: '$170B/yr', color: T.red },
                { label: 'Current Flows', value: '$46B/yr', color: T.green },
                { label: 'Finance Gap', value: '$124B/yr', color: T.orange },
                { label: 'Gap by 2030', value: '$255B/yr', color: T.red },
              ].map(k => (
                <div key={k.label} style={{ flex: 1, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 20px', textAlign: 'center' }}>
                  <div style={{ fontFamily: T.mono, fontSize: 28, fontWeight: 700, color: k.color }}>{k.value}</div>
                  <div style={{ color: T.textSec, fontSize: 11, marginTop: 4 }}>{k.label}</div>
                </div>
              ))}
            </div>

            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24 }}>
              <h3 style={{ color: T.navy, margin: '0 0 4px', fontSize: 15 }}>Adaptation Finance Gap — 2020–2030 ($B/yr)</h3>
              <p style={{ color: T.textSec, fontSize: 12, margin: '0 0 16px' }}>Source: UNEP Adaptation Gap Report 2024 · Gap = Need - Flow</p>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={ADAPTATION_FINANCE}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="yr" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 400]} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v, n) => [`$${v}B`, n === 'need' ? 'Adaptation Need' : n === 'flow' ? 'Current Flows' : 'Finance Gap']} />
                  <Legend />
                  <Area type="monotone" dataKey="need" name="Adaptation Need" stroke={T.red} fill={T.red + '15'} strokeWidth={2} />
                  <Area type="monotone" dataKey="flow" name="Current Flows" stroke={T.green} fill={T.green + '22'} strokeWidth={2} />
                  <Area type="monotone" dataKey="gap" name="Finance Gap" stroke={T.orange} fill={T.orange + '18'} strokeWidth={2} strokeDasharray="6 3" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Finance sources */}
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24, marginTop: 16 }}>
              <h3 style={{ color: T.navy, margin: '0 0 16px', fontSize: 14 }}>Adaptation Finance Sources & Instruments</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {[
                  { source: 'Multilateral Climate Funds', amount: '$12B/yr', instruments: 'GCF, GEF, AF, CIF', color: T.teal },
                  { source: 'MDB Adaptation Lending', amount: '$18B/yr', instruments: 'World Bank, ADB, AfDB, IDB', color: T.blue },
                  { source: 'Private Adaptation Finance', amount: '$8B/yr', instruments: 'Resilience bonds, insurance, PPPs', color: T.purple },
                  { source: 'Domestic Public Budget', amount: '$8B/yr', instruments: 'National adaptation plans, fiscal transfers', color: T.green },
                ].map(f => (
                  <div key={f.source} style={{ padding: 16, background: f.color + '08', border: `1px solid ${f.color}22`, borderRadius: 10 }}>
                    <div style={{ fontFamily: T.mono, fontSize: 22, fontWeight: 700, color: f.color, marginBottom: 6 }}>{f.amount}</div>
                    <div style={{ fontWeight: 700, color: T.navy, fontSize: 12, marginBottom: 8 }}>{f.source}</div>
                    <div style={{ color: T.textSec, fontSize: 11 }}>{f.instruments}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ TAB 4: Scenario Sensitivity ══ */}
        {tab === 4 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24, marginBottom: 16 }}>
              <h3 style={{ color: T.navy, margin: '0 0 4px', fontSize: 15 }}>BCR Sensitivity to SSP Scenarios</h3>
              <p style={{ color: T.textSec, fontSize: 12, margin: '0 0 16px' }}>Higher warming scenarios increase adaptation benefits (avoided loss) but may reduce effectiveness of some strategies</p>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={STRATEGIES.map(s => ({
                  name: s.id,
                  'SSP1-2.6': s.ssp_sensitivity[0].bcr,
                  'SSP2-4.5': s.ssp_sensitivity[1].bcr,
                  'SSP3-7.0': s.ssp_sensitivity[2].bcr,
                  'SSP5-8.5': s.ssp_sensitivity[3].bcr,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 12]} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="SSP1-2.6" fill={T.teal} opacity={0.9} />
                  <Bar dataKey="SSP2-4.5" fill={T.blue} opacity={0.8} />
                  <Bar dataKey="SSP3-7.0" fill={T.amber} opacity={0.8} />
                  <Bar dataKey="SSP5-8.5" fill={T.red} opacity={0.7} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <p style={{ color: T.textSec, fontSize: 12, marginTop: 12 }}>
                <strong>Key insight:</strong> Under SSP1-2.6 (best case), BCR is highest because adaptation costs are similar but the baseline avoided damage per dollar invested is more effective.
                Under SSP5-8.5 (worst case), absolute avoided losses are larger but adaptation measures become overwhelmed by extreme climate impacts, reducing BCR for engineered solutions like coastal defences. Nature-based solutions (S8 mangroves) maintain relatively higher BCR across all scenarios due to self-reinforcing ecosystem services.
              </p>
            </div>

            {/* Strategy-level SSP detail */}
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24 }}>
              <h3 style={{ color: T.navy, margin: '0 0 16px', fontSize: 14 }}>Selected Strategy: {selectedStrategy.name} — SSP Sensitivity</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={selectedStrategy.ssp_sensitivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="ssp" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 12]} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={v => [`${v}x`, 'BCR']} />
                  <Bar dataKey="bcr" name="BCR" radius={[6, 6, 0, 0]}>
                    {selectedStrategy.ssp_sensitivity.map((s, i) => <Cell key={i} fill={[T.teal, T.blue, T.amber, T.red][i]} />)}
                  </Bar>
                  <ReferenceLine y={4} stroke={T.green} strokeDasharray="4 4" label={{ value: 'Investment threshold', fill: T.green, fontSize: 10 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
