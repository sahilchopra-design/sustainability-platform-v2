import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend, ReferenceLine
} from 'recharts';

const T = {
  bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c',
  navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae',
  red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb',
  orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a',
  font:"'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"
};

const KPIs = [
  { label: 'Green Revenue Ratio', value: '13.1%', target: '15%', delta: '+2.5pp YoY', status: 'amber', detail: 'Renewable + low-carbon revenue / total' },
  { label: 'CapEx Alignment', value: '41.6%', target: '50%', delta: '+7.6pp YoY', status: 'amber', detail: 'Green CapEx vs IEA NZE 2030' },
  { label: 'Portfolio Carbon Intensity', value: '285', target: '<200', delta: '-18 YoY', status: 'red', detail: 'tCO2/GWh weighted average' },
  { label: 'Decom Liability Gap', value: '$4.1B', target: '<$2B', delta: '-$0.3B YoY', status: 'red', detail: 'Unfunded decommissioning' },
  { label: 'Supplier Avg Score', value: '51/100', target: '>60', delta: '+4 YoY', status: 'amber', detail: 'Weighted supplier transition score' },
  { label: 'Implied Temp Rise', value: '2.2C', target: '<1.8C', delta: '-0.1C YoY', status: 'red', detail: 'ITR based on emission pathway' },
];

const STATUS_COLORS = { green: T.green, amber: T.amber, red: T.red };

const ASSET_SCORES = [
  { type: 'Coal Plants', score: 18, count: 6, contribution: -22 },
  { type: 'Gas Plants', score: 52, count: 2, contribution: 5 },
  { type: 'Nuclear', score: 75, count: 2, contribution: 12 },
  { type: 'Hydro', score: 82, count: 2, contribution: 8 },
  { type: 'Wind Farms', score: 92, count: 4, contribution: 18 },
  { type: 'Solar Parks', score: 95, count: 3, contribution: 15 },
  { type: 'Biomass', score: 70, count: 2, contribution: 4 },
  { type: 'Refineries', score: 28, count: 3, contribution: -12 },
  { type: 'LNG Terminals', score: 45, count: 2, contribution: 2 },
  { type: 'Pipelines', score: 35, count: 3, contribution: -5 },
  { type: 'Mines', score: 15, count: 2, contribution: -18 },
];

const DECARB_PATHWAY = [
  { year: 2020, actual: 52.2, nze: 52.2, target: 52.2 },
  { year: 2022, actual: 48.8, nze: 46.0, target: 49.0 },
  { year: 2025, actual: 42.5, nze: 38.0, target: 43.0 },
  { year: 2030, actual: null, nze: 24.0, target: 32.0 },
  { year: 2035, actual: null, nze: 14.0, target: 22.0 },
  { year: 2040, actual: null, nze: 6.0, target: 14.0 },
  { year: 2045, actual: null, nze: 2.0, target: 6.0 },
  { year: 2050, actual: null, nze: 0.0, target: 0.0 },
];

const SUPPLIER_RISK = {
  below_40: 14, pct_below_40: 35, critical_low: 4,
  categories: [
    { cat: 'Drilling & Well Services', avg_score: 38, count: 5, risk: 'HIGH' },
    { cat: 'EPC/Construction', avg_score: 42, count: 6, risk: 'HIGH' },
    { cat: 'Pipeline Equipment', avg_score: 40, count: 4, risk: 'HIGH' },
    { cat: 'Turbine/Rotating Equip', avg_score: 52, count: 3, risk: 'MEDIUM' },
    { cat: 'Refining Catalysts', avg_score: 66, count: 2, risk: 'LOW' },
    { cat: 'IT & Digital', avg_score: 56, count: 3, risk: 'MEDIUM' },
    { cat: 'Environmental Services', avg_score: 67, count: 3, risk: 'LOW' },
    { cat: 'Chemicals & Additives', avg_score: 50, count: 3, risk: 'MEDIUM' },
  ],
};

const PEERS = [
  { name: 'Equinor', score: 72, rank: 1 },
  { name: 'TotalEnergies', score: 65, rank: 2 },
  { name: 'Shell', score: 58, rank: 3 },
  { name: 'Demo Co (Us)', score: 52, rank: 4 },
  { name: 'BP', score: 48, rank: 5 },
  { name: 'Eni', score: 42, rank: 6 },
];

const RADAR_DIMS = [
  { dim: 'Green Revenue', DemoCo: 55, PeerAvg: 58 },
  { dim: 'CapEx Alignment', DemoCo: 72, PeerAvg: 68 },
  { dim: 'Carbon Intensity', DemoCo: 45, PeerAvg: 52 },
  { dim: 'Decom Provision', DemoCo: 55, PeerAvg: 60 },
  { dim: 'Supplier Network', DemoCo: 60, PeerAvg: 55 },
  { dim: 'Policy Readiness', DemoCo: 65, PeerAvg: 62 },
];

const TABS = ['Executive KPIs','Asset Portfolio Score','Decarbonization Pathway','Supplier Risk','Peer Ranking','Board Report'];

export default function EnergyTransitionDashboardPage() {
  const [tab, setTab] = useState(0);
  const [reportDate] = useState(new Date().toISOString().split('T')[0]);
  const [expanded, setExpanded] = useState(null);

  const aggregateScore = useMemo(() => {
    const totalCount = ASSET_SCORES.reduce((s, a) => s + a.count, 0);
    return Math.round(ASSET_SCORES.reduce((s, a) => s + a.score * a.count, 0) / totalCount);
  }, []);

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <span style={{ background: T.navy, color: '#fff', fontFamily: T.mono, fontSize: 11, padding: '3px 10px', borderRadius: 6 }}>EP-CU6</span>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: T.navy, margin: 0 }}>Energy Company Transition Dashboard</h1>
      </div>
      <p style={{ color: T.textSec, fontSize: 13, marginBottom: 16 }}>
        Executive-level view aggregating CU1-CU5 modules: asset registry, segments, suppliers, revenue split, and decommissioning.
        <span style={{ fontFamily: T.mono, marginLeft: 8, fontSize: 11, color: T.textMut }}>Report date: {reportDate}</span>
      </p>

      <div style={{ display: 'flex', gap: 0, borderBottom: `2px solid ${T.border}`, marginBottom: 18 }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{
            padding: '10px 16px', border: 'none', cursor: 'pointer', fontFamily: T.font, fontSize: 13, fontWeight: tab === i ? 700 : 500,
            color: tab === i ? T.navy : T.textSec, background: tab === i ? T.surface : 'transparent',
            borderBottom: tab === i ? `2px solid ${T.gold}` : '2px solid transparent', marginBottom: -2, borderRadius: '6px 6px 0 0'
          }}>{t}</button>
        ))}
      </div>

      {tab === 0 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {KPIs.map(k => (
              <div key={k.label} onClick={() => setExpanded(expanded === k.label ? null : k.label)}
                style={{ background: T.surface, borderRadius: 12, padding: 18, border: `1px solid ${T.border}`, cursor: 'pointer', borderLeft: `4px solid ${STATUS_COLORS[k.status]}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono, textTransform: 'uppercase' }}>{k.label}</span>
                  <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: k.status === 'green' ? '#f0fdf4' : k.status === 'amber' ? '#fffbeb' : '#fef2f2', color: STATUS_COLORS[k.status] }}>
                    {k.status.toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: T.navy, margin: '8px 0 4px' }}>{k.value}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                  <span style={{ color: T.textSec }}>Target: {k.target}</span>
                  <span style={{ color: k.delta.startsWith('+') || k.delta.startsWith('-$') && k.status !== 'green' ? T.amber : T.green, fontWeight: 600 }}>{k.delta}</span>
                </div>
                {expanded === k.label && (
                  <div style={{ marginTop: 10, padding: 8, background: T.bg, borderRadius: 6, fontSize: 11, color: T.textSec }}>{k.detail}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 1 && (
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ color: T.navy, fontSize: 15, margin: 0 }}>Asset Portfolio Transition Score</h3>
            <div style={{ fontSize: 32, fontWeight: 800, color: aggregateScore > 60 ? T.green : aggregateScore > 40 ? T.amber : T.red }}>
              {aggregateScore}/100
            </div>
          </div>
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={ASSET_SCORES} layout="vertical" margin={{ left: 120 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="type" tick={{ fontSize: 11 }} width={115} />
              <Tooltip formatter={(v, name) => [name === 'score' ? `${v}/100` : v, name === 'score' ? 'Score' : 'Contribution']} />
              <ReferenceLine x={50} stroke={T.amber} strokeDasharray="5 5" />
              <Bar dataKey="score" radius={[0,4,4,0]}>
                {ASSET_SCORES.map(a => <Cell key={a.type} fill={a.score >= 70 ? T.green : a.score >= 40 ? T.amber : T.red} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 14, padding: 12, background: T.bg, borderRadius: 8, fontSize: 12, color: T.textSec }}>
            <strong>Key drag:</strong> Coal plants (score 18) and mines (score 15) pull aggregate score down. Divesting or retiring these would lift score to ~65.
          </div>
        </div>
      )}

      {tab === 2 && (
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ color: T.navy, fontSize: 15, marginBottom: 12 }}>Emissions Pathway vs IEA NZE (MtCO2)</h3>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={DECARB_PATHWAY}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 60]} />
              <Tooltip formatter={v => v !== null ? [`${v} Mt`] : ['N/A']} />
              <Legend />
              <Line type="monotone" dataKey="actual" stroke={T.navy} strokeWidth={3} dot={{ r: 5 }} name="Actual" connectNulls={false} />
              <Line type="monotone" dataKey="target" stroke={T.amber} strokeWidth={2} strokeDasharray="8 4" name="Company Target" />
              <Line type="monotone" dataKey="nze" stroke={T.green} strokeWidth={2} strokeDasharray="3 3" name="IEA NZE" />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 14, padding: 12, background: '#fffbeb', borderRadius: 8, fontSize: 12, color: T.amber }}>
            <strong>Gap to NZE:</strong> Current trajectory arrives at 32 Mt by 2030 vs NZE requirement of 24 Mt. An additional 8 Mt reduction required through accelerated coal retirement and renewable CapEx.
          </div>
        </div>
      )}

      {tab === 3 && (
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ color: T.navy, fontSize: 15, marginBottom: 12 }}>Supplier Transition Risk Summary</h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
            <div style={{ background: '#fef2f2', borderRadius: 10, padding: '14px 18px', border: `1px solid #fecaca`, flex: '1 1 160px' }}>
              <div style={{ fontSize: 11, fontFamily: T.mono, color: T.red }}>BELOW 40 SCORE</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: T.red }}>{SUPPLIER_RISK.below_40}</div>
              <div style={{ fontSize: 11, color: T.textSec }}>{SUPPLIER_RISK.pct_below_40}% of supply chain</div>
            </div>
            <div style={{ background: '#fef2f2', borderRadius: 10, padding: '14px 18px', border: `1px solid #fecaca`, flex: '1 1 160px' }}>
              <div style={{ fontSize: 11, fontFamily: T.mono, color: T.red }}>CRITICAL + LOW SCORE</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: T.red }}>{SUPPLIER_RISK.critical_low}</div>
              <div style={{ fontSize: 11, color: T.textSec }}>Critical deps with score &lt; 40</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={SUPPLIER_RISK.categories} layout="vertical" margin={{ left: 160 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" domain={[0, 80]} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="cat" tick={{ fontSize: 10 }} width={155} />
              <Tooltip formatter={v => [`${v}/100`]} />
              <ReferenceLine x={40} stroke={T.red} strokeDasharray="5 5" />
              <Bar dataKey="avg_score" radius={[0,4,4,0]}>
                {SUPPLIER_RISK.categories.map(c => <Cell key={c.cat} fill={c.risk === 'HIGH' ? T.red : c.risk === 'MEDIUM' ? T.amber : T.green} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 4 && (
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ color: T.navy, fontSize: 15, marginBottom: 12 }}>Peer Ranking: Energy Majors Transition Score</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={PEERS}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => [`${v}/100`]} />
              <Bar dataKey="score" radius={[4,4,0,0]}>
                {PEERS.map(p => <Cell key={p.name} fill={p.name.includes('Demo') ? T.gold : T.navy} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <h4 style={{ color: T.navy, fontSize: 13, margin: '20px 0 10px' }}>Radar: Demo Co vs Peer Average</h4>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={RADAR_DIMS} outerRadius={110}>
              <PolarGrid stroke={T.border} />
              <PolarAngleAxis dataKey="dim" tick={{ fontSize: 10 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
              <Tooltip />
              <Legend />
              <Radar name="Demo Co" dataKey="DemoCo" stroke={T.gold} fill={T.gold} fillOpacity={0.2} strokeWidth={2} />
              <Radar name="Peer Avg" dataKey="PeerAvg" stroke={T.navy} fill={T.navy} fillOpacity={0.1} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 5 && (
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ color: T.navy, fontSize: 15, marginBottom: 12 }}>Board Report Summary</h3>
          <div style={{ border: `2px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.textMut, marginBottom: 8 }}>CONFIDENTIAL - FOR BOARD RISK COMMITTEE</div>
            <h4 style={{ color: T.navy, marginBottom: 10 }}>Energy Transition Status Report - {reportDate}</h4>

            <div style={{ marginBottom: 16 }}>
              <h5 style={{ color: T.navy, fontSize: 13, marginBottom: 6 }}>1. Executive Summary</h5>
              <p style={{ fontSize: 12, color: T.textSec, lineHeight: 1.6 }}>
                The company's transition score stands at {aggregateScore}/100, ranking 4th among major energy peers.
                Green revenue ratio reached 13.1% (target 15%) and green CapEx allocation is 41.6% (IEA NZE target 50%).
                Key risks remain in coal asset portfolio (score 18/100) and underfunded decommissioning liabilities ($4.1B gap).
              </p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <h5 style={{ color: T.navy, fontSize: 13, marginBottom: 6 }}>2. Key Actions Required</h5>
              <div style={{ fontSize: 12, color: T.textSec }}>
                {[
                  'Accelerate coal plant retirement schedule by 3-5 years to align with NZE pathway',
                  'Increase green CapEx allocation from 41.6% to 50%+ by 2028',
                  'Address $4.1B decommissioning funding gap through accelerated provisioning',
                  'Engage remaining 35% of suppliers on transition plan submission',
                  'Set interim 2028 carbon intensity target of 220 tCO2/GWh',
                ].map((a, i) => (
                  <div key={i} style={{ padding: '4px 0', display: 'flex', gap: 6 }}>
                    <span style={{ fontFamily: T.mono, color: T.gold }}>{i + 1}.</span>
                    <span>{a}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h5 style={{ color: T.navy, fontSize: 13, marginBottom: 6 }}>3. KPI Traffic Light Summary</h5>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <tbody>
                  {KPIs.map(k => (
                    <tr key={k.label} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '4px 8px', width: 14 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: STATUS_COLORS[k.status], display: 'inline-block' }} /></td>
                      <td style={{ padding: '4px 8px', fontWeight: 600 }}>{k.label}</td>
                      <td style={{ padding: '4px 8px', fontFamily: T.mono }}>{k.value}</td>
                      <td style={{ padding: '4px 8px', color: T.textMut }}>vs {k.target}</td>
                      <td style={{ padding: '4px 8px', fontFamily: T.mono }}>{k.delta}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 20, padding: 14, background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 11, color: T.textMut }}>
        <strong>Data Sources:</strong> Aggregated from EP-CU1 through EP-CU5 modules | IEA NZE 2023 | TPI State of Transition 2025.
        <span style={{ float: 'right', fontFamily: T.mono }}>EP-CU6 v1.0 | Executive Dashboard</span>
      </div>
    </div>
  );
}
