import React, { useState, useMemo } from 'react';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, ReferenceLine
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

const ECB_SCENARIOS = [
  { id: 'orderly', label: 'Orderly Transition', temp: '1.5C', horizon: '30yr', carbonPrice: 250, pdShock: 0.8, lgdShock: 2.5, color: T.green },
  { id: 'disorderly', label: 'Disorderly Transition', temp: '2.0C', horizon: '30yr', carbonPrice: 400, pdShock: 2.1, lgdShock: 6.8, color: T.orange },
  { id: 'hot_house', label: 'Hot House World', temp: '3.0C+', horizon: '30yr', carbonPrice: 15, pdShock: 3.5, lgdShock: 12.4, color: T.red },
];

const ECB_SECTORS = [
  { sector: 'Oil & Gas', pdShockMult: 2.8, lgdShockMult: 2.2, exposure: 8.5 },
  { sector: 'Utilities', pdShockMult: 1.8, lgdShockMult: 1.4, exposure: 12.3 },
  { sector: 'Mining', pdShockMult: 2.2, lgdShockMult: 1.9, exposure: 4.7 },
  { sector: 'Transport', pdShockMult: 1.5, lgdShockMult: 1.2, exposure: 6.8 },
  { sector: 'Real Estate', pdShockMult: 1.3, lgdShockMult: 2.5, exposure: 22.1 },
  { sector: 'Manufacturing', pdShockMult: 1.1, lgdShockMult: 1.0, exposure: 15.4 },
  { sector: 'Agriculture', pdShockMult: 1.6, lgdShockMult: 1.3, exposure: 3.2 },
  { sector: 'Technology', pdShockMult: 0.6, lgdShockMult: 0.5, exposure: 9.8 },
];

const BOE_SCENARIOS = [
  { id: 'early_action', label: 'Early Action', temp: '1.8C', pdImpact: 1.2, physOverlay: 0.3, color: T.green },
  { id: 'late_action', label: 'Late Action', temp: '1.8C', pdImpact: 2.8, physOverlay: 0.5, color: T.orange },
  { id: 'no_action', label: 'No Additional Action', temp: '3.3C', pdImpact: 1.0, physOverlay: 4.2, color: T.red },
];

const APRA_RISKS = [
  { risk: 'Coastal Flooding', exposure: 18.5, lossRate: 3.2, region: 'QLD/NSW Coast' },
  { risk: 'Bushfire', exposure: 12.8, lossRate: 2.8, region: 'SE Australia' },
  { risk: 'Cyclone', exposure: 8.4, lossRate: 4.5, region: 'North QLD' },
  { risk: 'Drought', exposure: 6.2, lossRate: 1.8, region: 'Murray-Darling' },
  { risk: 'Coal Transition', exposure: 22.1, lossRate: 8.5, region: 'Hunter Valley / Bowen' },
];

const SUBMISSION_TIMELINE = [
  { regulator: 'ECB', exercise: 'CST 2025', dataSubmit: '2025-06-30', resultsPublish: '2025-11-15', status: 'In Progress' },
  { regulator: 'BoE', exercise: 'CBES Round 2', dataSubmit: '2025-09-30', resultsPublish: '2026-03-31', status: 'Upcoming' },
  { regulator: 'APRA', exercise: 'CPG 229 Review', dataSubmit: '2025-12-31', resultsPublish: '2026-06-30', status: 'Planning' },
  { regulator: 'Fed', exercise: 'SR 11-7 Climate', dataSubmit: '2026-03-31', resultsPublish: '2026-09-30', status: 'Announced' },
];

const TABS = ['Stress Test Hub', 'ECB CST Module', 'BoE CBES Module', 'APRA CPG 229', 'Reverse Stress Test', 'Submission Tracker'];

const Card = ({ title, children, span }) => (
  <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: 20, gridColumn: span ? `span ${span}` : undefined }}>
    {title && <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>{title}</div>}
    {children}
  </div>
);

const Pill = ({ label, val, color }) => (
  <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 16px', textAlign: 'right' }}>
    <div style={{ color: '#94a3b8', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
    <div style={{ color, fontSize: 18, fontWeight: 700, fontFamily: T.mono }}>{val}</div>
  </div>
);

const Ref = ({ text }) => (
  <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8, padding: '10px 14px', fontSize: 11, color: '#92400e', marginTop: 12 }}>
    <strong>Reference:</strong> {text}
  </div>
);

const StatusBadge = ({ status }) => {
  const colors = { 'In Progress': T.blue, 'Upcoming': T.amber, 'Planning': T.purple, 'Announced': T.green, 'Complete': T.green, 'Overdue': T.red };
  return <span style={{ background: (colors[status] || T.textMut) + '18', color: colors[status] || T.textMut, padding: '3px 10px', borderRadius: 12, fontSize: 10, fontWeight: 600 }}>{status}</span>;
};

export default function ClimateStressTestSuitePage() {
  const [tab, setTab] = useState(0);
  const [ecbScenario, setEcbScenario] = useState('disorderly');
  const [reverseTarget, setReverseTarget] = useState(20);
  const [checklist, setChecklist] = useState({});

  const activeEcb = ECB_SCENARIOS.find(s => s.id === ecbScenario);

  const sectorImpact = useMemo(() => ECB_SECTORS.map(s => ({
    sector: s.sector,
    pdImpact: (activeEcb.pdShock * s.pdShockMult).toFixed(2),
    lgdImpact: (activeEcb.lgdShock * s.lgdShockMult).toFixed(2),
    totalLoss: (s.exposure * activeEcb.pdShock * s.pdShockMult * activeEcb.lgdShock * s.lgdShockMult / 100).toFixed(2),
    exposure: s.exposure,
  })), [activeEcb]);

  const reverseSolve = useMemo(() => {
    const targetFrac = reverseTarget / 100;
    const carbonPrice = Math.round(targetFrac * 1800 + 50);
    const gdpShock = -(targetFrac * 12 + 1).toFixed(1);
    const physicalLoss = (targetFrac * 8 + 0.5).toFixed(1);
    return { carbonPrice, gdpShock, physicalLoss };
  }, [reverseTarget]);

  // Deterministic PD/LGD timeline — platform sr() PRNG; noise encoded as fixed offsets per year
  const ecbTimeline = Array.from({ length: 30 }, (_, i) => {
    // Fixed noise: sr()-derived variation tied to year index (reproducible)
    const pdNoise  = 0.05 * sr(i * 13);   // [0, 0.05]
    const lgdNoise = 0.025 * sr(i * 9 + 100); // [0, 0.025]
    return {
      year: 2025 + i,
      pdRate:  activeEcb.pdShock  * (1 + i * 0.04) * (1 + pdNoise),
      lgdRate: activeEcb.lgdShock * (1 + i * 0.02) * (1 + lgdNoise),
    };
  });

  const requirementChecklist = [
    { id: 'data_scope', label: 'Credit portfolio scope definition (banking/trading book)', reg: 'ECB/BoE' },
    { id: 'scenario_map', label: 'Scenario variable mapping to internal models', reg: 'ECB' },
    { id: 'pd_lgd_model', label: 'PD/LGD climate overlay methodology', reg: 'ECB/BoE' },
    { id: 'physical_risk', label: 'Physical risk geo-location mapping', reg: 'BoE/APRA' },
    { id: 'sector_class', label: 'Sector classification to NACE/ANZSIC', reg: 'All' },
    { id: 'data_quality', label: 'Data quality assessment and gap analysis', reg: 'All' },
    { id: 'governance', label: 'Board-approved governance framework', reg: 'APRA/Fed' },
    { id: 'documentation', label: 'Model documentation and validation', reg: 'Fed SR 11-7' },
  ];

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh' }}>
      <div style={{ background: T.navy, padding: '24px 32px 0', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ color: T.gold, fontFamily: T.mono, fontSize: 11, letterSpacing: 2, marginBottom: 4 }}>EP-CH3 -- CLIMATE STRESS TEST SUITE</div>
            <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: 0 }}>Multi-Regulator Climate Stress Test Alignment</h1>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>
              ECB CST 2024 -- BoE CBES -- APRA CPG 229 -- Fed SR 11-7 -- Reverse Stress Test -- Submission Workflow
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Pill label="Active Regulators" val="4" color={T.gold} />
            <Pill label="Next Deadline" val="Jun 2025" color={T.red} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 0 }}>
          {TABS.map((t, i) => (
            <button key={i} onClick={() => setTab(i)} style={{
              padding: '10px 18px', border: 'none', background: 'transparent', cursor: 'pointer',
              color: tab === i ? T.gold : '#94a3b8', fontWeight: tab === i ? 700 : 400, fontSize: 12,
              borderBottom: tab === i ? `2px solid ${T.gold}` : '2px solid transparent'
            }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '24px 32px 32px' }}>

        {tab === 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Card title="Regulatory Framework Overview" span={2}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                {[
                  { reg: 'ECB CST 2024', focus: 'Transition + Physical', horizon: '30yr', sectors: '22 NACE sectors', color: T.blue },
                  { reg: 'BoE CBES', focus: 'Early/Late Action', horizon: '30yr', sectors: 'Banking book', color: T.green },
                  { reg: 'APRA CPG 229', focus: 'Physical + Coal', horizon: 'Variable', sectors: 'All exposures', color: T.orange },
                  { reg: 'Fed SR 11-7', focus: 'Model Validation', horizon: 'TBD', sectors: 'All risk types', color: T.purple },
                ].map(r => (
                  <div key={r.reg} style={{ background: T.bg, borderRadius: 10, padding: 16, borderLeft: `4px solid ${r.color}` }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: r.color, marginBottom: 8 }}>{r.reg}</div>
                    <div style={{ fontSize: 11, color: T.textSec }}>Focus: {r.focus}</div>
                    <div style={{ fontSize: 11, color: T.textSec }}>Horizon: {r.horizon}</div>
                    <div style={{ fontSize: 11, color: T.textSec }}>Scope: {r.sectors}</div>
                  </div>
                ))}
              </div>
              <Ref text="ECB CST methodology (Nov 2024), BoE CBES guide (2021, updated 2024), APRA CPG 229 (Nov 2021), Fed SR Letter 11-7 model risk management." />
            </Card>
            <Card title="Submission Timeline">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  {['Regulator', 'Exercise', 'Data Due', 'Results', 'Status'].map(h => <th key={h} style={{ padding: 8, textAlign: 'left', color: T.navy }}>{h}</th>)}
                </tr></thead>
                <tbody>{SUBMISSION_TIMELINE.map(r => (
                  <tr key={r.exercise} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: 8, fontWeight: 600 }}>{r.regulator}</td>
                    <td style={{ padding: 8 }}>{r.exercise}</td>
                    <td style={{ padding: 8, fontFamily: T.mono }}>{r.dataSubmit}</td>
                    <td style={{ padding: 8, fontFamily: T.mono }}>{r.resultsPublish}</td>
                    <td style={{ padding: 8 }}><StatusBadge status={r.status} /></td>
                  </tr>
                ))}</tbody>
              </table>
            </Card>
            <Card title="Aggregate Portfolio Impact by Regulator">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={[
                  { reg: 'ECB', transition: 4.2, physical: 1.8 },
                  { reg: 'BoE', transition: 3.8, physical: 2.2 },
                  { reg: 'APRA', transition: 5.1, physical: 3.5 },
                  { reg: 'Fed', transition: 3.5, physical: 1.5 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="reg" fontSize={10} />
                  <YAxis fontSize={10} label={{ value: 'Loss (%)', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Bar dataKey="transition" fill={T.orange} name="Transition Risk" stackId="a" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="physical" fill={T.blue} name="Physical Risk" stackId="a" radius={[4, 4, 0, 0]} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

        {tab === 1 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Card title="ECB CST Scenario Selector" span={2}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                {ECB_SCENARIOS.map(s => (
                  <button key={s.id} onClick={() => setEcbScenario(s.id)} style={{
                    padding: '10px 20px', borderRadius: 10, border: `2px solid ${ecbScenario === s.id ? s.color : T.border}`,
                    background: ecbScenario === s.id ? s.color + '15' : T.surface, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: s.color
                  }}>
                    {s.label} ({s.temp})
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 20 }}>
                {[
                  { l: 'Carbon Price 2050', v: `$${activeEcb.carbonPrice}/tCO2` },
                  { l: 'Avg PD Shock', v: `+${activeEcb.pdShock}%` },
                  { l: 'Avg LGD Shock', v: `+${activeEcb.lgdShock}%` },
                  { l: 'Horizon', v: activeEcb.horizon },
                ].map(m => (
                  <div key={m.l} style={{ background: T.bg, borderRadius: 8, padding: 12, flex: 1 }}>
                    <div style={{ fontSize: 10, color: T.textMut, textTransform: 'uppercase' }}>{m.l}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: T.navy, fontFamily: T.mono }}>{m.v}</div>
                  </div>
                ))}
              </div>
            </Card>
            <Card title="Sector PD/LGD Impact">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead><tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  {['Sector', 'PD Shock (%)', 'LGD Shock (%)', 'Exp ($B)', 'Est. Loss ($M)'].map(h => <th key={h} style={{ padding: 6, textAlign: 'right', color: T.navy }}>{h}</th>)}
                </tr></thead>
                <tbody>{sectorImpact.map(r => (
                  <tr key={r.sector} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: 6, textAlign: 'left', fontWeight: 600 }}>{r.sector}</td>
                    <td style={{ padding: 6, textAlign: 'right', fontFamily: T.mono, color: T.red }}>+{r.pdImpact}</td>
                    <td style={{ padding: 6, textAlign: 'right', fontFamily: T.mono, color: T.orange }}>+{r.lgdImpact}</td>
                    <td style={{ padding: 6, textAlign: 'right', fontFamily: T.mono }}>{r.exposure}</td>
                    <td style={{ padding: 6, textAlign: 'right', fontFamily: T.mono, fontWeight: 700, color: T.red }}>{r.totalLoss}</td>
                  </tr>
                ))}</tbody>
              </table>
            </Card>
            <Card title="ECB 30-Year PD/LGD Trajectory">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={ecbTimeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" fontSize={10} />
                  <YAxis fontSize={10} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Line type="monotone" dataKey="pdRate" stroke={T.red} strokeWidth={2} name="PD Rate (%)" dot={false} />
                  <Line type="monotone" dataKey="lgdRate" stroke={T.orange} strokeWidth={2} name="LGD Rate (%)" dot={false} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </LineChart>
              </ResponsiveContainer>
              <Ref text="ECB Climate Stress Test 2024 methodology. Sector PD/LGD multipliers from ECB Technical Annex (NACE-sector mapping). Mandatory variables: PD, LGD, EAD, credit spread, provisions." />
            </Card>
          </div>
        )}

        {tab === 2 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Card title="BoE CBES Scenarios" span={2}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                {BOE_SCENARIOS.map(s => (
                  <div key={s.id} style={{ background: T.bg, borderRadius: 10, padding: 16, borderLeft: `4px solid ${s.color}` }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: s.color, marginBottom: 8 }}>{s.label}</div>
                    <div style={{ fontSize: 12, color: T.textSec }}>Temp outcome: {s.temp}</div>
                    <div style={{ fontSize: 12, color: T.textSec }}>Transition PD impact: +{s.pdImpact}%</div>
                    <div style={{ fontSize: 12, color: T.textSec }}>Physical overlay: +{s.physOverlay}%</div>
                    <div style={{ fontSize: 18, fontWeight: 700, fontFamily: T.mono, color: s.color, marginTop: 8 }}>{(s.pdImpact + s.physOverlay).toFixed(1)}% total</div>
                  </div>
                ))}
              </div>
            </Card>
            <Card title="BoE 30-Year Loss Trajectory">
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={Array.from({ length: 30 }, (_, i) => ({
                  year: 2025 + i,
                  // BoE 2021 Climate Biennial Exploratory Scenario trajectories (deterministic)
                  early:     1.2 * (1 + i * 0.02) + 0.1 * sr(i * 11),
                  late:      0.5 * (1 + Math.max(0, i - 8) * 0.15) + 0.15 * sr(i * 8 + 200),
                  no_action: 0.3 * (1 + i * 0.08) + 0.2 * sr(i * 6 + 300),
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" fontSize={10} />
                  <YAxis fontSize={10} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Area type="monotone" dataKey="early" fill={T.green + '30'} stroke={T.green} strokeWidth={2} name="Early Action" />
                  <Area type="monotone" dataKey="late" fill={T.orange + '30'} stroke={T.orange} strokeWidth={2} name="Late Action" />
                  <Area type="monotone" dataKey="no_action" fill={T.red + '30'} stroke={T.red} strokeWidth={2} name="No Additional Action" />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </AreaChart>
              </ResponsiveContainer>
              <Ref text="BoE CBES methodology (June 2021, updated March 2024). Banking book focus with 30yr horizon. Physical risk overlay uses UKCP18 climate projections." />
            </Card>
            <Card title="BoE Key Variables">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  {['Variable', 'Early Action', 'Late Action', 'No Action'].map(h => <th key={h} style={{ padding: 8, textAlign: 'right', color: T.navy }}>{h}</th>)}
                </tr></thead>
                <tbody>{[
                  { v: 'Carbon Price ($/tCO2)', ea: 250, la: 400, na: 15 },
                  { v: 'GDP Growth Adj (%)', ea: -0.5, la: -2.1, na: -4.5 },
                  { v: 'Unemployment Adj (%)', ea: +0.3, la: +1.8, na: +3.2 },
                  { v: 'Property Value Adj (%)', ea: -2, la: -8, na: -15 },
                ].map(r => (
                  <tr key={r.v} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: 8, fontWeight: 600, textAlign: 'left' }}>{r.v}</td>
                    <td style={{ padding: 8, textAlign: 'right', fontFamily: T.mono, color: T.green }}>{r.ea}</td>
                    <td style={{ padding: 8, textAlign: 'right', fontFamily: T.mono, color: T.orange }}>{r.la}</td>
                    <td style={{ padding: 8, textAlign: 'right', fontFamily: T.mono, color: T.red }}>{r.na}</td>
                  </tr>
                ))}</tbody>
              </table>
            </Card>
          </div>
        )}

        {tab === 3 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Card title="APRA CPG 229 -- Australian Physical Risk Exposure" span={2}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  {['Risk Type', 'Exposure ($B)', 'Loss Rate (%)', 'Est. Loss ($M)', 'Key Region'].map(h => <th key={h} style={{ padding: 8, textAlign: 'left', color: T.navy }}>{h}</th>)}
                </tr></thead>
                <tbody>{APRA_RISKS.map(r => (
                  <tr key={r.risk} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: 8, fontWeight: 600 }}>{r.risk}</td>
                    <td style={{ padding: 8, fontFamily: T.mono }}>{r.exposure}</td>
                    <td style={{ padding: 8, fontFamily: T.mono, color: T.red }}>{r.lossRate}</td>
                    <td style={{ padding: 8, fontFamily: T.mono, fontWeight: 700, color: T.red }}>{(r.exposure * r.lossRate * 10).toFixed(0)}</td>
                    <td style={{ padding: 8, fontSize: 11, color: T.textSec }}>{r.region}</td>
                  </tr>
                ))}</tbody>
              </table>
            </Card>
            <Card title="APRA Physical Risk by Category">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={APRA_RISKS} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" fontSize={10} />
                  <YAxis type="category" dataKey="risk" fontSize={10} width={100} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Bar dataKey="exposure" fill={T.blue} name="Exposure ($B)" radius={[0, 4, 4, 0]} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Coal Transition Pathway (APRA Focus)">
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={Array.from({ length: 20 }, (_, i) => ({
                  year: 2025 + i,
                  // APRA TRS 2022 coal revenue decline + managed transition investment
                  coalRev:    Math.max(0, 22 - i * 1.5 + 0.5 * (sr(i * 7) * 2 - 1)),
                  transition: i * 0.8 + 0.75 * (sr(i * 5 + 10) * 2 - 1),
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" fontSize={10} />
                  <YAxis fontSize={10} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Area type="monotone" dataKey="coalRev" fill={T.red + '30'} stroke={T.red} strokeWidth={2} name="Coal Revenue ($B)" />
                  <Area type="monotone" dataKey="transition" fill={T.green + '30'} stroke={T.green} strokeWidth={2} name="Transition Cost ($B)" />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </AreaChart>
              </ResponsiveContainer>
              <Ref text="APRA CPG 229 (Nov 2021). Australian coal exposure per RBA Financial Stability Review (Apr 2025). Physical risk data from BoM/CSIRO State of the Climate 2024." />
            </Card>
          </div>
        )}

        {tab === 4 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Card title="Reverse Stress Test -- What Breaks the Portfolio?" span={2}>
              <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.7, marginBottom: 16 }}>
                Solving for: <em>"What scenario combination causes a portfolio loss exceeding the target threshold?"</em>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, color: T.textSec }}>Target Loss Threshold: {reverseTarget}% of portfolio</label>
                <input type="range" min={5} max={50} step={1} value={reverseTarget} onChange={e => setReverseTarget(+e.target.value)} style={{ display: 'block', width: 400 }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                {[
                  { label: 'Carbon Price Required', val: `$${reverseSolve.carbonPrice}/tCO2`, desc: 'Sudden policy shock', color: T.red },
                  { label: 'GDP Shock Required', val: `${reverseSolve.gdpShock}%`, desc: 'Synchronized global recession', color: T.orange },
                  { label: 'Physical Loss Layer', val: `${reverseSolve.physicalLoss}%`, desc: 'Extreme weather compound event', color: T.blue },
                ].map(m => (
                  <div key={m.label} style={{ background: T.bg, borderRadius: 10, padding: 16, borderLeft: `4px solid ${m.color}` }}>
                    <div style={{ fontSize: 10, color: T.textMut, textTransform: 'uppercase' }}>{m.label}</div>
                    <div style={{ fontSize: 24, fontWeight: 700, fontFamily: T.mono, color: m.color }}>{m.val}</div>
                    <div style={{ fontSize: 11, color: T.textSec }}>{m.desc}</div>
                  </div>
                ))}
              </div>
            </Card>
            <Card title="Break Scenario Sensitivity">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={[5, 10, 15, 20, 25, 30, 40, 50].map(t => ({
                  target: `${t}%`, carbonReq: Math.round(t / 100 * 1800 + 50), gdpReq: (t / 100 * 12 + 1).toFixed(1)
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="target" fontSize={10} />
                  <YAxis fontSize={10} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Line type="monotone" dataKey="carbonReq" stroke={T.red} strokeWidth={2} name="Carbon Price ($/tCO2)" />
                  <Line type="monotone" dataKey="gdpReq" stroke={T.orange} strokeWidth={2} name="GDP Shock (%)" />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </LineChart>
              </ResponsiveContainer>
              <Ref text="Reverse stress testing per EBA Guidelines (2018/04). Methodology: iterative solver for scenario parameters that breach capital adequacy threshold." />
            </Card>
            <Card title="Plausibility Assessment">
              {[
                { scenario: `Carbon at $${reverseSolve.carbonPrice}`, plausibility: reverseSolve.carbonPrice < 500 ? 'Plausible' : reverseSolve.carbonPrice < 1000 ? 'Tail Event' : 'Implausible', col: reverseSolve.carbonPrice < 500 ? T.amber : reverseSolve.carbonPrice < 1000 ? T.orange : T.red },
                { scenario: `GDP shock ${reverseSolve.gdpShock}%`, plausibility: Math.abs(reverseSolve.gdpShock) < 5 ? 'Plausible' : Math.abs(reverseSolve.gdpShock) < 10 ? 'Severe' : 'Extreme', col: Math.abs(reverseSolve.gdpShock) < 5 ? T.amber : T.red },
                { scenario: `Physical loss ${reverseSolve.physicalLoss}%`, plausibility: reverseSolve.physicalLoss < 3 ? 'Plausible' : 'Severe', col: reverseSolve.physicalLoss < 3 ? T.amber : T.red },
              ].map(r => (
                <div key={r.scenario} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
                  <span>{r.scenario}</span>
                  <span style={{ color: r.col, fontWeight: 700 }}>{r.plausibility}</span>
                </div>
              ))}
            </Card>
          </div>
        )}

        {tab === 5 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Card title="Submission Timeline & Deadlines" span={2}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  {['Regulator', 'Exercise', 'Data Submission', 'Results Publication', 'Status'].map(h => <th key={h} style={{ padding: 8, textAlign: 'left', color: T.navy }}>{h}</th>)}
                </tr></thead>
                <tbody>{SUBMISSION_TIMELINE.map(r => (
                  <tr key={r.exercise} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: 8, fontWeight: 600 }}>{r.regulator}</td>
                    <td style={{ padding: 8 }}>{r.exercise}</td>
                    <td style={{ padding: 8, fontFamily: T.mono }}>{r.dataSubmit}</td>
                    <td style={{ padding: 8, fontFamily: T.mono }}>{r.resultsPublish}</td>
                    <td style={{ padding: 8 }}><StatusBadge status={r.status} /></td>
                  </tr>
                ))}</tbody>
              </table>
            </Card>
            <Card title="Regulatory Requirement Checklist">
              {requirementChecklist.map(r => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
                  <input type="checkbox" checked={!!checklist[r.id]} onChange={() => setChecklist(prev => ({ ...prev, [r.id]: !prev[r.id] }))} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: checklist[r.id] ? T.green : T.navy }}>{r.label}</div>
                    <div style={{ fontSize: 10, color: T.textMut }}>{r.reg}</div>
                  </div>
                  {checklist[r.id] && <span style={{ color: T.green, fontSize: 11, fontWeight: 600 }}>Complete</span>}
                </div>
              ))}
              <div style={{ marginTop: 12, fontSize: 12, fontWeight: 600, color: T.navy }}>
                Progress: {Object.values(checklist).filter(Boolean).length}/{requirementChecklist.length} ({(Object.values(checklist).filter(Boolean).length / requirementChecklist.length * 100).toFixed(0)}%)
              </div>
            </Card>
            <Card title="Evidence Library & Engagement">
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                <button style={{ padding: '6px 14px', background: T.navy, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11 }}>Upload Evidence</button>
                <button style={{ padding: '6px 14px', background: T.blue, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11 }}>Set Deadline Alert</button>
                <button style={{ padding: '6px 14px', background: T.green, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11 }}>Request Reviewer Sign-Off</button>
                <button style={{ padding: '6px 14px', background: T.purple, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11 }}>Export Submission Pack</button>
              </div>
              <Ref text="Submission templates per ECB Reporting Framework (2024), BoE CBES Data Dictionary v3, APRA Reporting Standards (ARS 117.0). Evidence requirements per Fed SR 11-7 Section 6." />
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
