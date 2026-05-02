import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ScatterChart, Scatter, RadarChart, Radar, PolarGrid, PolarAngleAxis
} from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const T = {
  bg: '#F8FAFC', card: '#FFFFFF', border: '#E2E8F0', text: '#0F172A',
  sub: '#64748B', accent: '#3B82F6', blue: '#2563EB', indigo: '#4F46E5',
  green: '#059669', amber: '#D97706', red: '#DC2626', purple: '#7C3AED',
  teal: '#0D9488', sky: '#0284C7', muted: '#94A3B8',
};

const OPERATORS = [
  { id: 1, name: 'National Grid ESO', region: 'UK', rab: 14800, voltage: '400kV', length: 7200, allowed_roe: 5.1, earned_roe: 4.9, capex: 1240, opex: 380, dscr: 1.62, ffo_debt: 0.142, lines: 820, rating: 'Baa1', age: 38, congestion_cost: 312 },
  { id: 2, name: 'RTE France', region: 'France', rab: 28400, voltage: '400kV', length: 105000, allowed_roe: 5.3, earned_roe: 5.2, capex: 2100, opex: 890, dscr: 1.71, ffo_debt: 0.158, lines: 1820, rating: 'A2', age: 42, congestion_cost: 580 },
  { id: 3, name: 'Terna SpA', region: 'Italy', rab: 18200, voltage: '380kV', length: 74500, allowed_roe: 5.7, earned_roe: 5.4, capex: 1680, opex: 520, dscr: 1.68, ffo_debt: 0.151, lines: 1260, rating: 'Baa2', age: 44, congestion_cost: 420 },
  { id: 4, name: 'REE Spain', region: 'Spain', rab: 11600, voltage: '400kV', length: 44900, allowed_roe: 5.0, earned_roe: 4.8, capex: 980, opex: 310, dscr: 1.59, ffo_debt: 0.136, lines: 930, rating: 'Baa1', age: 40, congestion_cost: 290 },
  { id: 5, name: 'TenneT Netherlands', region: 'Netherlands', rab: 9800, voltage: '380kV', length: 23900, allowed_roe: 5.4, earned_roe: 5.1, capex: 820, opex: 270, dscr: 1.65, ffo_debt: 0.148, lines: 710, rating: 'A3', age: 36, congestion_cost: 210 },
  { id: 6, name: 'Amprion GmbH', region: 'Germany', rab: 16400, voltage: '380kV', length: 11000, allowed_roe: 5.1, earned_roe: 4.7, capex: 1420, opex: 440, dscr: 1.55, ffo_debt: 0.131, lines: 920, rating: 'Baa1', age: 47, congestion_cost: 380 },
  { id: 7, name: 'TransnetBW', region: 'Germany', rab: 7200, voltage: '380kV', length: 3600, allowed_roe: 5.1, earned_roe: 4.9, capex: 680, opex: 190, dscr: 1.58, ffo_debt: 0.138, lines: 440, rating: 'A3', age: 43, congestion_cost: 160 },
  { id: 8, name: 'Elia Group', region: 'Belgium', rab: 8400, voltage: '380kV', length: 8900, allowed_roe: 5.2, earned_roe: 5.0, capex: 760, opex: 240, dscr: 1.67, ffo_debt: 0.153, lines: 590, rating: 'A3', age: 39, congestion_cost: 195 },
  { id: 9, name: 'PSE Poland', region: 'Poland', rab: 5200, voltage: '400kV', length: 14200, allowed_roe: 5.8, earned_roe: 5.5, capex: 490, opex: 165, dscr: 1.61, ffo_debt: 0.144, lines: 620, rating: 'Baa2', age: 50, congestion_cost: 135 },
  { id: 10, name: 'CEPS Czech', region: 'Czech Rep.', rab: 3100, voltage: '400kV', length: 3700, allowed_roe: 5.6, earned_roe: 5.3, capex: 290, opex: 95, dscr: 1.64, ffo_debt: 0.149, lines: 340, rating: 'Baa1', age: 48, congestion_cost: 82 },
  { id: 11, name: 'Statnett Norway', region: 'Norway', rab: 11200, voltage: '420kV', length: 11300, allowed_roe: 5.0, earned_roe: 4.8, capex: 1050, opex: 310, dscr: 1.73, ffo_debt: 0.162, lines: 780, rating: 'Aa2', age: 35, congestion_cost: 240 },
  { id: 12, name: 'Svenska Kraftnät', region: 'Sweden', rab: 9600, voltage: '400kV', length: 15700, allowed_roe: 4.9, earned_roe: 4.7, capex: 890, opex: 285, dscr: 1.70, ffo_debt: 0.156, lines: 680, rating: 'Aa3', age: 41, congestion_cost: 215 },
];

const CAPEX_PROGRAMS = [
  { name: 'Offshore HVDC Links', type: 'Growth', cost: 8400, timeline: '2024-2032', irr: 6.8, voltage: '525kV', length_km: 1400, status: 'In Progress' },
  { name: 'Grid Reinforcement N-1', type: 'Replacement', cost: 3200, timeline: '2023-2027', irr: 5.9, voltage: '400kV', length_km: 420, status: 'In Progress' },
  { name: 'Onshore Backbone HV', type: 'Growth', cost: 5600, timeline: '2025-2033', irr: 7.1, voltage: '400kV', length_km: 980, status: 'Planning' },
  { name: 'Substation Modernisation', type: 'Replacement', cost: 1800, timeline: '2023-2026', irr: 5.4, voltage: 'Mixed', length_km: 0, status: 'In Progress' },
  { name: 'Smart Grid Sensors', type: 'Technology', cost: 620, timeline: '2024-2026', irr: 8.2, voltage: 'N/A', length_km: 0, status: 'Approved' },
  { name: 'Cross-Border Interconnect', type: 'Growth', cost: 4100, timeline: '2026-2034', irr: 7.4, voltage: '400kV', length_km: 680, status: 'Planning' },
  { name: 'Cable Replacement EHV', type: 'Replacement', cost: 2400, timeline: '2024-2028', irr: 5.6, voltage: '275kV', length_km: 310, status: 'In Progress' },
  { name: 'Reactive Power Compensation', type: 'Technology', cost: 380, timeline: '2024-2025', irr: 6.1, voltage: 'N/A', length_km: 0, status: 'Approved' },
];

const REVENUE_WATERFALL = [
  { label: 'Allowed Revenue', value: 4200, type: 'base' },
  { label: 'Pass-Through Costs', value: 890, type: 'add' },
  { label: 'Incentive Income', value: 145, type: 'add' },
  { label: 'Connection Charges', value: 310, type: 'add' },
  { label: 'Totex Efficiency Gain', value: 82, type: 'add' },
  { label: 'IQI Adjustment', value: -38, type: 'deduct' },
  { label: 'Demand Outperformance', value: -55, type: 'deduct' },
  { label: 'Total Revenue Requirement', value: 5534, type: 'total' },
];

const MONTHLY_CONGESTION = Array.from({ length: 36 }, (_, i) => ({
  month: `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i % 12]} ${2023 + Math.floor(i / 12)}`,
  redispatch_cost: Math.round(180 + sr(i * 7) * 320 + (i > 20 ? 80 : 0)),
  curtailment_mwh: Math.round(1200 + sr(i * 11) * 2800),
  congestion_rent: Math.round(90 + sr(i * 13) * 180),
  vre_share: Math.round(28 + sr(i * 5) * 22 + i * 0.6),
}));

const CREDIT_METRICS = Array.from({ length: 12 }, (_, i) => ({
  year: 2019 + i * 0.5,
  ffo_debt: parseFloat((0.128 + sr(i * 9) * 0.04 + (i > 6 ? 0.01 : 0)).toFixed(3)),
  dscr: parseFloat((1.52 + sr(i * 11) * 0.28).toFixed(2)),
  gearing: parseFloat((0.58 - sr(i * 7) * 0.08).toFixed(2)),
  interest_cover: parseFloat((3.1 + sr(i * 13) * 1.4).toFixed(1)),
}));

const RAB_BRIDGE = [
  { year: 2020, opening: 8200, capex: 980, depreciation: -420, indexation: 285, closing: 9045 },
  { year: 2021, opening: 9045, capex: 1120, depreciation: -450, indexation: 380, closing: 10095 },
  { year: 2022, opening: 10095, capex: 1340, depreciation: -480, indexation: 620, closing: 11575 },
  { year: 2023, opening: 11575, capex: 1560, depreciation: -510, indexation: 540, closing: 13165 },
  { year: 2024, opening: 13165, capex: 1780, depreciation: -545, indexation: 490, closing: 14890 },
  { year: 2025, opening: 14890, capex: 2100, depreciation: -580, indexation: 520, closing: 16930 },
];

const INTERCONNECTORS = [
  { name: 'IFA2 UK-France', capacity_mw: 1000, utilisation: 78, congestion_rent: 142, owner: 'RTE/NGT', voltage: 'HVDC', length: 240, status: 'Operational', irr: 7.2 },
  { name: 'ElecLink UK-France', capacity_mw: 1000, utilisation: 72, congestion_rent: 128, owner: 'ElecLink', voltage: 'HVDC', length: 73, status: 'Operational', irr: 6.9 },
  { name: 'NEMO UK-Belgium', capacity_mw: 1000, utilisation: 81, congestion_rent: 158, owner: 'National Grid/Elia', voltage: 'HVDC', length: 140, status: 'Operational', irr: 7.4 },
  { name: 'Viking UK-Denmark', capacity_mw: 1400, utilisation: 0, congestion_rent: 0, owner: 'NGT/Energinet', voltage: 'HVDC', length: 760, status: 'Under Construction', irr: 8.1 },
  { name: 'NordLink Norway-Germany', capacity_mw: 1400, utilisation: 85, congestion_rent: 210, owner: 'Statnett/TenneT', voltage: 'HVDC', length: 623, status: 'Operational', irr: 7.8 },
  { name: 'NSL Norway-UK', capacity_mw: 1400, utilisation: 88, congestion_rent: 225, owner: 'Statnett/NGT', voltage: 'HVDC', length: 714, status: 'Operational', irr: 8.0 },
];

const RADAR_METRICS = [
  { axis: 'Asset Condition', value: 72 },
  { axis: 'Revenue Certainty', value: 88 },
  { axis: 'Credit Quality', value: 81 },
  { axis: 'Capex Efficiency', value: 65 },
  { axis: 'Decarbonisation Readiness', value: 74 },
  { axis: 'Regulatory Relationship', value: 83 },
];

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 20px', flex: 1, minWidth: 160 }}>
    <div style={{ fontSize: 11, color: T.sub, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: color || T.text }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>{sub}</div>}
  </div>
);

const Pill = ({ label, color }) => (
  <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
    background: `${color}20`, color, border: `1px solid ${color}40`, marginRight: 4 }}>{label}</span>
);

export default function PowerGridTransmissionFinancePage() {
  const [tab, setTab] = useState(0);
  const [selectedOp, setSelectedOp] = useState(0);
  const [scenario, setScenario] = useState('Base');
  const [wacc, setWacc] = useState(5.1);
  const [capexBudget, setCapexBudget] = useState(1500);
  const [gearingTarget, setGearingTarget] = useState(60);

  const op = OPERATORS[selectedOp];
  const totalRAB = useMemo(() => OPERATORS.reduce((s, o) => s + o.rab, 0), []);
  const avgDSCR = useMemo(() => (OPERATORS.reduce((s, o) => s + o.dscr, 0) / OPERATORS.length).toFixed(2), []);
  const totalCapex = useMemo(() => OPERATORS.reduce((s, o) => s + o.capex, 0), []);
  const avgCongestion = useMemo(() => Math.round(OPERATORS.reduce((s, o) => s + o.congestion_cost, 0) / OPERATORS.length), []);

  const scenarioMultiplier = { Base: 1, Upside: 1.12, Downside: 0.88 }[scenario];
  const allowedReturn = ((op.rab * wacc / 100) * scenarioMultiplier / 1000).toFixed(1);
  const revenueRequirement = ((op.rab * wacc / 100 + op.opex + op.capex * 0.15) * scenarioMultiplier / 1000).toFixed(1);
  const equityValue = ((op.rab * (1 - gearingTarget / 100)) * 1.12).toFixed(0);

  const tabs = ['RAB & Operators', 'Capex Programme', 'Revenue Waterfall', 'Congestion Analytics', 'Credit Metrics', 'Interconnectors', 'Valuation Model'];

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', background: T.bg, minHeight: '100vh', padding: 32 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>⚡</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.text }}>Power Grid & Transmission Finance</h1>
            <p style={{ margin: 0, fontSize: 13, color: T.sub }}>EP-EL1 · RAB model · FERC/Ofgem/ACER · Congestion economics · Interconnector analytics</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
        <KpiCard label="Aggregate RAB" value={`€${(totalRAB / 1000).toFixed(1)}B`} sub="12 TSOs surveyed" color={T.accent} />
        <KpiCard label="Avg DSCR" value={avgDSCR} sub="Debt service coverage" color={T.green} />
        <KpiCard label="Total Annual Capex" value={`€${(totalCapex / 1000).toFixed(1)}B`} sub="Investment 2024" color={T.purple} />
        <KpiCard label="Avg Congestion Cost" value={`€${avgCongestion}M`} sub="Per TSO per year" color={T.amber} />
        <KpiCard label="HVDC Projects" value="14 Active" sub="Across Europe" color={T.teal} />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {tabs.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{
            padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            background: tab === i ? T.accent : T.card, color: tab === i ? '#fff' : T.sub,
            boxShadow: tab === i ? `0 2px 8px ${T.accent}40` : 'none',
          }}>{t}</button>
        ))}
      </div>

      {tab === 0 && (
        <div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
            <div style={{ flex: 2, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, minWidth: 340 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: T.text }}>Transmission System Operators — RAB & Financial Summary</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: '#F1F5F9' }}>
                      {['Operator','Region','RAB €M','Allowed ROE','Earned ROE','CAPEX €M','DSCR','FFO/Debt','Rating','Congestion €M'].map(h => (
                        <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.sub, fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {OPERATORS.map((o, i) => (
                      <tr key={o.id} onClick={() => setSelectedOp(i)} style={{ cursor: 'pointer', background: selectedOp === i ? `${T.accent}10` : 'transparent', borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '8px 10px', fontWeight: 600, color: T.text }}>{o.name}</td>
                        <td style={{ padding: '8px 10px', color: T.sub }}>{o.region}</td>
                        <td style={{ padding: '8px 10px', fontWeight: 600, color: T.accent }}>{o.rab.toLocaleString()}</td>
                        <td style={{ padding: '8px 10px', color: T.green }}>{o.allowed_roe}%</td>
                        <td style={{ padding: '8px 10px', color: o.earned_roe >= o.allowed_roe ? T.green : T.amber }}>{o.earned_roe}%</td>
                        <td style={{ padding: '8px 10px' }}>{o.capex}</td>
                        <td style={{ padding: '8px 10px', color: o.dscr >= 1.6 ? T.green : T.amber }}>{o.dscr}</td>
                        <td style={{ padding: '8px 10px' }}>{(o.ffo_debt * 100).toFixed(1)}%</td>
                        <td style={{ padding: '8px 10px' }}><Pill label={o.rating} color={o.rating.startsWith('A') ? T.green : T.amber} /></td>
                        <td style={{ padding: '8px 10px', color: T.red }}>{o.congestion_cost}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, minWidth: 280 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: T.text }}>Regulatory Quality Index</h3>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={RADAR_METRICS}>
                  <PolarGrid stroke={T.border} />
                  <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11, fill: T.sub }} />
                  <Radar name="Score" dataKey="value" stroke={T.accent} fill={T.accent} fillOpacity={0.2} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: T.text }}>RAB vs Capex Intensity — Peer Comparison</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={OPERATORS} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.sub }} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11, fill: T.sub }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="rab" name="RAB €M" fill={T.accent} radius={[3,3,0,0]} />
                <Bar dataKey="capex" name="Capex €M" fill={T.teal} radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 2, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, minWidth: 360 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: T.text }}>Capex Programme — Major Grid Investment Projects</h3>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 12, color: T.sub }}>Budget Filter: <strong style={{ color: T.text }}>€{capexBudget}M+</strong></div>
              <input type="range" min={200} max={8000} step={100} value={capexBudget} onChange={e => setCapexBudget(+e.target.value)} style={{ width: 180 }} />
            </div>
            {CAPEX_PROGRAMS.filter(p => p.cost >= capexBudget).map((p, i) => (
              <div key={i} style={{ background: '#F8FAFC', borderRadius: 8, padding: '12px 14px', marginBottom: 10, border: `1px solid ${T.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{p.timeline} · {p.voltage} {p.length_km > 0 ? `· ${p.length_km} km` : ''}</div>
                  </div>
                  <Pill label={p.status} color={p.status === 'Operational' ? T.green : p.status === 'In Progress' ? T.accent : T.amber} />
                </div>
                <div style={{ display: 'flex', gap: 20, marginTop: 8 }}>
                  <div><span style={{ fontSize: 11, color: T.sub }}>Cost </span><span style={{ fontSize: 13, fontWeight: 700, color: T.accent }}>€{p.cost.toLocaleString()}M</span></div>
                  <div><span style={{ fontSize: 11, color: T.sub }}>Type </span><span style={{ fontSize: 12, color: T.text }}>{p.type}</span></div>
                  <div><span style={{ fontSize: 11, color: T.sub }}>Project IRR </span><span style={{ fontSize: 13, fontWeight: 700, color: T.green }}>{p.irr}%</span></div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, minWidth: 280 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: T.text }}>Capex by Programme Type</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={[
                { type: 'Growth', total: CAPEX_PROGRAMS.filter(p=>p.type==='Growth').reduce((s,p)=>s+p.cost,0) },
                { type: 'Replacement', total: CAPEX_PROGRAMS.filter(p=>p.type==='Replacement').reduce((s,p)=>s+p.cost,0) },
                { type: 'Technology', total: CAPEX_PROGRAMS.filter(p=>p.type==='Technology').reduce((s,p)=>s+p.cost,0) },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="type" tick={{ fontSize: 11, fill: T.sub }} />
                <YAxis tick={{ fontSize: 11, fill: T.sub }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="total" name="Total €M" fill={T.accent} radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ marginTop: 20 }}>
              <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: T.text }}>Project IRR Distribution</h4>
              <ResponsiveContainer width="100%" height={160}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="cost" name="Cost €M" tick={{ fontSize: 10, fill: T.sub }} label={{ value: 'Cost €M', position: 'insideBottom', offset: -4, style: { fontSize: 10 } }} />
                  <YAxis dataKey="irr" name="IRR %" tick={{ fontSize: 10, fill: T.sub }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ fontSize: 11 }} />
                  <Scatter data={CAPEX_PROGRAMS} fill={T.purple} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 2 && (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, minWidth: 320 }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: T.text }}>Revenue Requirement Waterfall</h3>
            <p style={{ margin: '0 0 16px', fontSize: 12, color: T.sub }}>RIIO-T2 / equivalent regulatory framework</p>
            {REVENUE_WATERFALL.map((r, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 13, fontWeight: r.type === 'total' ? 700 : 400, color: r.type === 'total' ? T.text : T.sub }}>{r.label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: r.type === 'deduct' ? T.red : r.type === 'total' ? T.accent : T.green }}>
                  {r.type === 'deduct' ? '' : r.type === 'add' ? '+' : ''}€{Math.abs(r.value)}M
                </div>
              </div>
            ))}
          </div>
          <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, minWidth: 320 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: T.text }}>RAB Bridge — Opening to Closing</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={RAB_BRIDGE} stackOffset="sign">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.sub }} />
                <YAxis tick={{ fontSize: 11, fill: T.sub }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="capex" name="Capex" stackId="a" fill={T.green} />
                <Bar dataKey="indexation" name="Indexation" stackId="a" fill={T.accent} />
                <Bar dataKey="depreciation" name="Depreciation" stackId="a" fill={T.red} />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ marginTop: 16, background: '#F0F9FF', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.sky, marginBottom: 6 }}>RAB Valuation Sensitivity</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[['Premium to RAB', '1.12×'], ['Implied EV', '€16.8B'], ['RAB CAGR (5yr)', '+12.4%'], ['Inflation Pass-Through', '100%']].map(([l, v]) => (
                  <div key={l} style={{ fontSize: 11 }}>
                    <span style={{ color: T.sub }}>{l}: </span>
                    <span style={{ fontWeight: 700, color: T.text }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 3 && (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: T.text }}>Monthly Redispatch Cost & VRE Curtailment (36-Month Trend)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={MONTHLY_CONGESTION} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="month" tick={{ fontSize: 9, fill: T.sub }} interval={5} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: T.sub }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: T.sub }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area yAxisId="left" type="monotone" dataKey="redispatch_cost" name="Redispatch €M" stroke={T.red} fill={`${T.red}20`} />
                <Area yAxisId="right" type="monotone" dataKey="curtailment_mwh" name="Curtailment MWh" stroke={T.amber} fill={`${T.amber}15`} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, minWidth: 280 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: T.text }}>VRE Share vs Congestion Cost</h3>
              <ResponsiveContainer width="100%" height={220}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="vre_share" name="VRE Share %" tick={{ fontSize: 10, fill: T.sub }} label={{ value: 'VRE %', position: 'insideBottom', offset: -4, style: { fontSize: 10 } }} />
                  <YAxis dataKey="redispatch_cost" name="Redispatch €M" tick={{ fontSize: 10, fill: T.sub }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ fontSize: 11 }} />
                  <Scatter data={MONTHLY_CONGESTION} fill={T.purple} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, minWidth: 280 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: T.text }}>Congestion Rent per Operator</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={OPERATORS} layout="vertical" margin={{ top: 0, right: 16, left: 120, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: T.sub }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: T.sub }} width={120} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Bar dataKey="congestion_cost" name="Congestion €M" fill={T.teal} radius={[0,3,3,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 4 && (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: T.text }}>Credit Metric Evolution — FFO/Debt, DSCR & Gearing</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={CREDIT_METRICS} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.sub }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: T.sub }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: T.sub }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line yAxisId="left" type="monotone" dataKey="dscr" name="DSCR" stroke={T.green} strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="gearing" name="Gearing" stroke={T.red} strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="interest_cover" name="Interest Cover" stroke={T.accent} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            {[["Moody's Baa1 FFO/Debt Threshold",'≥ 13%', T.green],['Fitch BBB DSCR Minimum','≥ 1.50×', T.accent],['S&P A- Gearing Cap','≤ 65%', T.purple],['Interest Coverage Floor','≥ 3.0×', T.amber]].map(([l,v,c]) => (
              <div key={l} style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 16px', minWidth: 180 }}>
                <div style={{ fontSize: 11, color: T.sub, marginBottom: 6 }}>{l}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: c }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: T.text }}>Peer Credit Positioning</h3>
            <ResponsiveContainer width="100%" height={220}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="ffo_debt" name="FFO/Debt" tick={{ fontSize: 10, fill: T.sub }} label={{ value: 'FFO/Debt', position: 'insideBottom', offset: -4, style: { fontSize: 10 } }} />
                <YAxis dataKey="dscr" name="DSCR" tick={{ fontSize: 10, fill: T.sub }} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ fontSize: 11 }} formatter={(v, n) => [n === 'DSCR' ? v.toFixed(2) : `${(v*100).toFixed(1)}%`, n]} />
                <Scatter data={OPERATORS} fill={T.accent} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 5 && (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: T.text }}>Cross-Border Interconnector Portfolio</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#F1F5F9' }}>
                  {['Name','Capacity MW','Utilisation','Congestion Rent €M','Owner','Voltage','Length km','Status','IRR'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.sub, fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {INTERCONNECTORS.map((ic, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '8px 10px', fontWeight: 600, color: T.text }}>{ic.name}</td>
                    <td style={{ padding: '8px 10px', color: T.accent }}>{ic.capacity_mw.toLocaleString()}</td>
                    <td style={{ padding: '8px 10px', color: ic.utilisation > 75 ? T.green : T.amber }}>{ic.utilisation}%</td>
                    <td style={{ padding: '8px 10px', color: T.purple }}>{ic.congestion_rent > 0 ? `€${ic.congestion_rent}M` : '—'}</td>
                    <td style={{ padding: '8px 10px', color: T.sub }}>{ic.owner}</td>
                    <td style={{ padding: '8px 10px' }}>{ic.voltage}</td>
                    <td style={{ padding: '8px 10px' }}>{ic.length}</td>
                    <td style={{ padding: '8px 10px' }}><Pill label={ic.status} color={ic.status === 'Operational' ? T.green : T.amber} /></td>
                    <td style={{ padding: '8px 10px', fontWeight: 700, color: T.green }}>{ic.irr}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, minWidth: 280 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: T.text }}>Utilisation vs Congestion Rent</h3>
              <ResponsiveContainer width="100%" height={200}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="utilisation" name="Utilisation %" tick={{ fontSize: 10, fill: T.sub }} />
                  <YAxis dataKey="congestion_rent" name="Congestion €M" tick={{ fontSize: 10, fill: T.sub }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ fontSize: 11 }} />
                  <Scatter data={INTERCONNECTORS.filter(i=>i.utilisation>0)} fill={T.teal} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, background: '#F0FDF4', border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, minWidth: 280 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: T.green }}>Interconnector Investment Case</h3>
              {[['Total Rated Capacity','7.2 GW'],['Avg Utilisation (Operational)','81%'],['Total Congestion Rent','€851M/yr'],['Avg Project IRR','7.6%'],['Market Price Convergence','EU Internal Energy Mkt'],['Merchant Revenue Risk','Partial — FTRs available'],['Regulatory Approvals','ACER / National Regulators'],['Key Risk','Policy changes to energy trade']].map(([l,v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
                  <span style={{ color: T.sub }}>{l}</span><span style={{ fontWeight: 600, color: T.text }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 6 && (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, minWidth: 320 }}>
            <h3 style={{ margin: '0 0 20px', fontSize: 14, fontWeight: 700, color: T.text }}>RAB-Based Valuation Model</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: T.sub, display: 'block', marginBottom: 6 }}>Selected Operator</label>
              <select value={selectedOp} onChange={e => setSelectedOp(+e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13 }}>
                {OPERATORS.map((o, i) => <option key={i} value={i}>{o.name}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: T.sub, display: 'block', marginBottom: 4 }}>WACC: <strong>{wacc}%</strong></label>
              <input type="range" min={3.5} max={7.5} step={0.1} value={wacc} onChange={e => setWacc(+e.target.value)} style={{ width: '100%' }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: T.sub, display: 'block', marginBottom: 4 }}>Gearing Target: <strong>{gearingTarget}%</strong></label>
              <input type="range" min={40} max={80} step={5} value={gearingTarget} onChange={e => setGearingTarget(+e.target.value)} style={{ width: '100%' }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: T.sub, display: 'block', marginBottom: 4 }}>Scenario</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['Base','Upside','Downside'].map(s => (
                  <button key={s} onClick={() => setScenario(s)} style={{ flex: 1, padding: '7px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: scenario === s ? T.accent : '#F1F5F9', color: scenario === s ? '#fff' : T.sub }}>{s}</button>
                ))}
              </div>
            </div>
            <div style={{ background: '#F0F9FF', borderRadius: 10, padding: '16px 18px', marginTop: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.sky, marginBottom: 10 }}>Valuation Output — {op.name}</div>
              {[['RAB', `€${op.rab.toLocaleString()}M`],['Allowed Return', `€${allowedReturn}B`],['Revenue Requirement', `€${revenueRequirement}B`],['Equity Value (RAB-based)', `€${Number(equityValue).toLocaleString()}M`],['DSCR', op.dscr],['FFO/Debt', `${(op.ffo_debt*100).toFixed(1)}%`],['Implied Rating', op.rating]].map(([l,v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid #BFDBFE`, fontSize: 12 }}>
                  <span style={{ color: T.sub }}>{l}</span><span style={{ fontWeight: 700, color: T.text }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, minWidth: 280 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: T.text }}>WACC Sensitivity — Equity Value</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={[3.5,4.0,4.5,5.0,5.5,6.0,6.5,7.0,7.5].map(w => ({
                wacc: `${w}%`,
                equity: Math.round(op.rab * (1 - gearingTarget/100) * (1 + (5.1 - w) * 0.08)),
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="wacc" tick={{ fontSize: 11, fill: T.sub }} />
                <YAxis tick={{ fontSize: 11, fill: T.sub }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="equity" name="Equity €M" stroke={T.accent} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
            <div style={{ marginTop: 16 }}>
              <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: T.text }}>Key Investment Considerations</h4>
              {[['Inflation linkage','RAB indexed to RPI/CPI — natural inflation hedge'],['Regulatory certainty','5–8 year price controls, predictable cash flows'],['Green capex premium','HVDC offshore links attract higher allowed returns'],['Merchant risk','Limited — most revenue is regulated and certain'],['ESG appeal','Zero direct emissions, enabler of VRE integration'],['Refinancing risk','Long-duration — matched liability funding available']].map(([t,d]) => (
                <div key={t} style={{ marginBottom: 8, fontSize: 12 }}>
                  <span style={{ fontWeight: 700, color: T.text }}>{t}: </span>
                  <span style={{ color: T.sub }}>{d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
