import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, PieChart, Pie
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

const MODULE_TYPES = ['Mono-PERC', 'TOPCon', 'Bifacial HJT', 'Bifacial TOPCon', 'Mono-PERC Bifacial'];
const TRACKER_TYPES = ['SAT (Single-Axis)', 'DAT (Dual-Axis)', 'Fixed-Tilt', 'SAT + Backtracking'];
const EPC_CONTRACTORS = [
  'Primoris Energy', 'McCarthy Building', 'Swinerton Renewable', 'Mortenson Construction',
  'RES Americas', 'SunPower EPC', 'Blattner Energy', 'IEA Energy Services',
  'Cupertino Electric', 'Signal Energy'
];

const PROJECTS = Array.from({ length: 25 }, (_, i) => {
  const capacityMwdc = 50 + Math.round(sr(i * 7) * 750);
  const moduleType = MODULE_TYPES[i % MODULE_TYPES.length];
  const trackerType = TRACKER_TYPES[i % TRACKER_TYPES.length];
  const epsCapex = 0.08 + sr(i * 11) * 0.10; // $/Wdc
  const bosCapex = 0.10 + sr(i * 13) * 0.12;
  const gridCapex = 0.03 + sr(i * 17) * 0.07;
  const moduleCapex = 0.22 + sr(i * 19) * 0.10;
  const inverterCapex = 0.06 + sr(i * 23) * 0.04;
  const installCost = 0.05 + sr(i * 29) * 0.06;
  const totalCapex = epsCapex + bosCapex + gridCapex + moduleCapex + inverterCapex + installCost;
  const scheduleMonths = 12 + Math.round(sr(i * 31) * 18);
  return {
    id: `EC4-${String(i + 1).padStart(2, '0')}`,
    name: `US-${String(i + 1).padStart(3, '0')}`,
    epcContractor: EPC_CONTRACTORS[i % EPC_CONTRACTORS.length],
    capacityMwdc,
    moduleType,
    trackerType,
    epsCapex: +epsCapex.toFixed(3),
    bosCapex: +bosCapex.toFixed(3),
    gridCapex: +gridCapex.toFixed(3),
    moduleCapex: +moduleCapex.toFixed(3),
    inverterCapex: +inverterCapex.toFixed(3),
    installCost: +installCost.toFixed(3),
    totalCapex: +totalCapex.toFixed(3),
    scheduleMonths,
    totalCapexM: +(totalCapex * capacityMwdc * 1000 / 1e6).toFixed(1),
  };
});

const SCHEDULE_RISKS = [
  { risk: 'Module procurement delay', probability: 35, impact: 3, category: 'Supply Chain' },
  { risk: 'Interconnection queue delay', probability: 55, impact: 4, category: 'Grid' },
  { risk: 'Permitting / environmental', probability: 28, impact: 3, category: 'Regulatory' },
  { risk: 'Labour shortage / skilled trades', probability: 42, impact: 3, category: 'Labour' },
  { risk: 'Steel / tracker supply disruption', probability: 22, impact: 3, category: 'Supply Chain' },
  { risk: 'Weather / force majeure', probability: 18, impact: 2, category: 'Force Majeure' },
  { risk: 'Landowner / easement issues', probability: 15, impact: 4, category: 'Land' },
  { risk: 'Transformer lead times', probability: 48, impact: 4, category: 'Supply Chain' },
];

const KPI_CARD = ({ label, value, unit, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 20px', flex: 1, minWidth: 150 }}>
    <div style={{ fontSize: 12, color: T.sub, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.text }}>{value}</div>
    {unit && <div style={{ fontSize: 11, color: T.sub }}>{unit}</div>}
  </div>
);

const TABS = [
  { id: 'benchmarks', label: 'EPC Benchmarks' },
  { id: 'modules', label: 'Module & Tracker' },
  { id: 'bos', label: 'BOS Cost Breakdown' },
  { id: 'contractor', label: 'Contractor Comparison' },
  { id: 'schedule', label: 'Schedule Risk' },
  { id: 'waterfall', label: 'Capex Waterfall' },
];

export default function UtilitySolarEpcIntelligencePage() {
  const [activeTab, setActiveTab] = useState('benchmarks');
  const [selectedContractor, setSelectedContractor] = useState('All');

  const filtered = useMemo(() =>
    selectedContractor === 'All' ? PROJECTS : PROJECTS.filter(p => p.epcContractor === selectedContractor),
    [selectedContractor]
  );

  const kpis = useMemo(() => {
    const totalMwdc = filtered.reduce((s, p) => s + p.capacityMwdc, 0);
    const avgCapex = filtered.length ? filtered.reduce((s, p) => s + p.totalCapex, 0) / filtered.length : 0;
    const avgSchedule = filtered.length ? filtered.reduce((s, p) => s + p.scheduleMonths, 0) / filtered.length : 0;
    const avgBos = filtered.length ? filtered.reduce((s, p) => s + p.bosCapex, 0) / filtered.length : 0;
    const totalPortfolioM = filtered.reduce((s, p) => s + p.totalCapexM, 0);
    return { totalMwdc, avgCapex, avgSchedule, avgBos, totalPortfolioM };
  }, [filtered]);

  const capexByTracker = useMemo(() => {
    const byTracker = {};
    filtered.forEach(p => {
      if (!byTracker[p.trackerType]) byTracker[p.trackerType] = { tracker: p.trackerType, count: 0, sumCapex: 0, sumAep: 0 };
      byTracker[p.trackerType].count++;
      byTracker[p.trackerType].sumCapex += p.totalCapex;
    });
    return Object.values(byTracker).map(t => ({
      tracker: t.tracker,
      avgCapex: t.count ? +(t.sumCapex / t.count).toFixed(3) : 0,
      count: t.count,
    }));
  }, [filtered]);

  const moduleEfficiency = [
    { module: 'Mono-PERC', efficiency: 20.5, costWp: 0.24, degradation: 0.55, marketShare: 38 },
    { module: 'TOPCon', efficiency: 22.3, costWp: 0.27, degradation: 0.40, marketShare: 28 },
    { module: 'Bifacial HJT', efficiency: 23.5, costWp: 0.31, degradation: 0.30, marketShare: 12 },
    { module: 'Bifacial TOPCon', efficiency: 22.8, costWp: 0.28, degradation: 0.38, marketShare: 14 },
    { module: 'Mono-PERC Bifacial', efficiency: 21.0, costWp: 0.25, degradation: 0.52, marketShare: 8 },
  ];

  const bosCostData = useMemo(() => {
    const avg = (key) => filtered.length ? filtered.reduce((s, p) => s + p[key], 0) / filtered.length : 0;
    return [
      { component: 'PV Modules', value: +avg('moduleCapex').toFixed(3), color: T.blue },
      { component: 'Mounting/Trackers', value: +avg('epsCapex').toFixed(3), color: T.teal },
      { component: 'BOS (Wiring/HW)', value: +avg('bosCapex').toFixed(3), color: T.green },
      { component: 'Inverters', value: +avg('inverterCapex').toFixed(3), color: T.gold },
      { component: 'Grid Connection', value: +avg('gridCapex').toFixed(3), color: T.indigo },
      { component: 'Installation Labour', value: +avg('installCost').toFixed(3), color: T.amber },
    ];
  }, [filtered]);

  const contractorBenchmark = useMemo(() => {
    const byContractor = {};
    PROJECTS.forEach(p => {
      if (!byContractor[p.epcContractor]) byContractor[p.epcContractor] = { name: p.epcContractor, count: 0, sumCapex: 0, sumSchedule: 0, totalMw: 0 };
      byContractor[p.epcContractor].count++;
      byContractor[p.epcContractor].sumCapex += p.totalCapex;
      byContractor[p.epcContractor].sumSchedule += p.scheduleMonths;
      byContractor[p.epcContractor].totalMw += p.capacityMwdc;
    });
    return Object.values(byContractor).map(c => ({
      name: c.name.split(' ')[0],
      avgCapex: c.count ? +(c.sumCapex / c.count).toFixed(3) : 0,
      avgSchedule: c.count ? +(c.sumSchedule / c.count).toFixed(1) : 0,
      mw: c.totalMw,
      projects: c.count,
    }));
  }, []);

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: T.sub, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>EP-EC4 · Solar Energy Finance</div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: T.text, margin: 0 }}>Utility-Scale Solar EPC Intelligence</h1>
          <p style={{ color: T.sub, marginTop: 6, fontSize: 14 }}>
            EPC contractor benchmarking, module & tracker selection analytics, BOS cost breakdown and schedule risk for utility-scale solar projects.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <select value={selectedContractor} onChange={e => setSelectedContractor(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.card, fontSize: 13 }}>
            <option value="All">All Contractors</option>
            {EPC_CONTRACTORS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div style={{ marginLeft: 'auto', fontSize: 13, color: T.sub, alignSelf: 'center' }}>
            {filtered.length} projects · Utility CAPEX range: $0.55–0.85/Wdc (NREL 2023)
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <KPI_CARD label="Total Capacity" value={kpis.totalMwdc.toLocaleString()} unit="MWdc" color={T.blue} />
          <KPI_CARD label="Avg Total CAPEX" value={`$${(kpis.avgCapex).toFixed(3)}`} unit="/Wdc" color={T.teal} />
          <KPI_CARD label="Avg BOS Cost" value={`$${kpis.avgBos.toFixed(3)}`} unit="/Wdc" color={T.green} />
          <KPI_CARD label="Avg Schedule" value={kpis.avgSchedule.toFixed(1)} unit="months" color={T.amber} />
          <KPI_CARD label="Portfolio Value" value={`$${(kpis.totalPortfolioM / 1000).toFixed(1)}B`} unit="total CAPEX" color={T.gold} />
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `1px solid ${T.border}` }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              style={{
                padding: '8px 16px', border: 'none',
                background: activeTab === t.id ? T.blue : 'transparent',
                color: activeTab === t.id ? '#fff' : T.sub,
                borderRadius: '6px 6px 0 0', cursor: 'pointer',
                fontWeight: activeTab === t.id ? 600 : 400, fontSize: 13
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'benchmarks' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.navy, color: '#fff' }}>
                  {['ID', 'EPC Contractor', 'MWdc', 'Module', 'Tracker', 'EPS $/W', 'BOS $/W', 'Grid $/W', 'Module $/W', 'Inverter $/W', 'Install $/W', 'Total $/W', 'Schedule (mo)'].map(h => (
                    <th key={h} style={{ padding: '10px 10px', textAlign: 'left', fontWeight: 600, fontSize: 11, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr key={p.id} style={{ background: i % 2 === 0 ? T.card : '#F9F8F5', borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '7px 10px', color: T.sub, fontFamily: 'monospace', fontSize: 11 }}>{p.id}</td>
                    <td style={{ padding: '7px 10px', fontWeight: 600, fontSize: 12 }}>{p.epcContractor.split(' ')[0]}</td>
                    <td style={{ padding: '7px 10px', textAlign: 'right' }}>{p.capacityMwdc}</td>
                    <td style={{ padding: '7px 10px', fontSize: 11 }}>{p.moduleType}</td>
                    <td style={{ padding: '7px 10px', fontSize: 11 }}>{p.trackerType.split(' ')[0]}</td>
                    <td style={{ padding: '7px 10px', textAlign: 'right' }}>{p.epsCapex}</td>
                    <td style={{ padding: '7px 10px', textAlign: 'right' }}>{p.bosCapex}</td>
                    <td style={{ padding: '7px 10px', textAlign: 'right' }}>{p.gridCapex}</td>
                    <td style={{ padding: '7px 10px', textAlign: 'right' }}>{p.moduleCapex}</td>
                    <td style={{ padding: '7px 10px', textAlign: 'right' }}>{p.inverterCapex}</td>
                    <td style={{ padding: '7px 10px', textAlign: 'right' }}>{p.installCost}</td>
                    <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 700, color: p.totalCapex < 0.70 ? T.green : p.totalCapex < 0.78 ? T.teal : T.amber }}>{p.totalCapex}</td>
                    <td style={{ padding: '7px 10px', textAlign: 'right' }}>{p.scheduleMonths}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'modules' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Module Efficiency vs Cost ($/Wp)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={moduleEfficiency} margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="module" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} label={{ value: 'Efficiency %', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} label={{ value: '$/Wp', angle: 90, position: 'insideRight', fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="efficiency" name="Efficiency %" fill={T.blue} />
                  <Bar yAxisId="right" dataKey="costWp" name="Cost $/Wp" fill={T.amber} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Tracker Type vs Avg CAPEX ($/W)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={capexByTracker} margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="tracker" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0.5, 0.9]} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v, n) => [`$${v}/W`, n]} />
                  <Bar dataKey="avgCapex" name="Avg CAPEX $/W">
                    {capexByTracker.map((_, i) => <Cell key={i} fill={[T.blue, T.teal, T.green, T.gold][i % 4]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 10, padding: 16, border: `1px solid ${T.border}`, gridColumn: '1/-1' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 15 }}>SAT vs Fixed-Tilt: AEP Impact</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {[
                  { metric: 'SAT AEP Premium', value: '+4–6%', note: 'vs fixed-tilt (NREL)', color: T.green },
                  { metric: 'DAT AEP Premium', value: '+20–25%', note: 'vs fixed-tilt (high DNI sites)', color: T.blue },
                  { metric: 'SAT CAPEX Premium', value: '$0.06–0.10/W', note: 'vs fixed-tilt installed', color: T.amber },
                  { metric: 'SAT Payback vs Fixed', value: '3–6 years', note: 'Incremental AEP revenue', color: T.teal },
                ].map(item => (
                  <div key={item.metric} style={{ padding: 14, background: T.bg, borderRadius: 8, borderTop: `3px solid ${item.color}` }}>
                    <div style={{ fontWeight: 700, fontSize: 16, color: item.color }}>{item.value}</div>
                    <div style={{ fontSize: 12, color: T.text, marginTop: 2 }}>{item.metric}</div>
                    <div style={{ fontSize: 11, color: T.sub, marginTop: 4 }}>{item.note}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'bos' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Avg BOS Component Costs ($/Wdc)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={bosCostData} layout="vertical" margin={{ left: 100 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="component" type="category" tick={{ fontSize: 11 }} />
                  <Tooltip formatter={v => [`$${v}/W`]} />
                  <Bar dataKey="value" name="$/Wdc">
                    {bosCostData.map((item, i) => <Cell key={i} fill={item.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>CAPEX Component Share</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={bosCostData} cx="50%" cy="50%" outerRadius={100} dataKey="value"
                    label={({ component, percent }) => `${component.split(' ')[0]} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {bosCostData.map((item, i) => <Cell key={i} fill={item.color} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [`$${v}/W`, n]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'contractor' && (
          <div>
            <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}`, marginBottom: 20 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Contractor CAPEX vs Schedule Benchmark</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={contractorBenchmark} margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="left" domain={[0.5, 0.9]} tick={{ fontSize: 11 }} label={{ value: '$/W', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} label={{ value: 'Months', angle: 90, position: 'insideRight', fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="avgCapex" name="Avg CAPEX $/W" fill={T.blue} />
                  <Bar yAxisId="right" dataKey="avgSchedule" name="Avg Schedule (mo)" fill={T.amber} opacity={0.7} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: T.navy, color: '#fff' }}>
                    {['Contractor', 'Projects', 'Total MWdc', 'Avg CAPEX $/W', 'Avg Schedule (mo)', 'CAPEX Rating'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, fontSize: 12 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {contractorBenchmark.map((c, i) => (
                    <tr key={c.name} style={{ background: i % 2 === 0 ? T.card : '#F9F8F5', borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '10px 16px', fontWeight: 600 }}>{c.name}</td>
                      <td style={{ padding: '10px 16px', textAlign: 'right' }}>{c.projects}</td>
                      <td style={{ padding: '10px 16px', textAlign: 'right' }}>{c.mw}</td>
                      <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 700, color: c.avgCapex < 0.68 ? T.green : c.avgCapex < 0.75 ? T.teal : T.amber }}>${c.avgCapex}</td>
                      <td style={{ padding: '10px 16px', textAlign: 'right' }}>{c.avgSchedule}</td>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: c.avgCapex < 0.68 ? '#D1FAE5' : c.avgCapex < 0.75 ? '#DBEAFE' : '#FEF3C7', color: c.avgCapex < 0.68 ? T.green : c.avgCapex < 0.75 ? T.blue : T.amber }}>
                          {c.avgCapex < 0.68 ? 'Best-in-Class' : c.avgCapex < 0.75 ? 'Competitive' : 'Above Average'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'schedule' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Schedule Risk Matrix</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: T.bg }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Risk</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600 }}>Category</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600 }}>Prob %</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600 }}>Impact (1-5)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...SCHEDULE_RISKS].sort((a, b) => b.probability - a.probability).map((r, i) => (
                      <tr key={r.risk} style={{ background: i % 2 === 0 ? T.card : '#F9F8F5', borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '8px 12px', fontSize: 12 }}>{r.risk}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                          <span style={{ padding: '2px 6px', borderRadius: 4, fontSize: 10, background: '#EFF6FF', color: T.blue }}>{r.category}</span>
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 700, color: r.probability >= 45 ? T.red : r.probability >= 30 ? T.amber : T.green }}>{r.probability}%</td>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                          {'★'.repeat(r.impact) + '☆'.repeat(5 - r.impact)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Schedule Risk Probability</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={[...SCHEDULE_RISKS].sort((a, b) => b.probability - a.probability)} layout="vertical" margin={{ left: 160 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" domain={[0, 60]} tick={{ fontSize: 11 }} />
                  <YAxis dataKey="risk" type="category" tick={{ fontSize: 10 }} width={160} />
                  <Tooltip formatter={v => [`${v}%`, 'Probability']} />
                  <Bar dataKey="probability" name="Probability %">
                    {[...SCHEDULE_RISKS].sort((a, b) => b.probability - a.probability).map((r, i) => (
                      <Cell key={i} fill={r.probability >= 45 ? T.red : r.probability >= 30 ? T.amber : T.green} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'waterfall' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>CAPEX Waterfall by Component — Portfolio Average</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={bosCostData} margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="component" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} label={{ value: '$/Wdc', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                  <Tooltip formatter={v => [`$${v}/W`, 'Cost']} />
                  <Bar dataKey="value" name="$/Wdc">
                    {bosCostData.map((item, i) => <Cell key={i} fill={item.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 15 }}>NREL 2023 Benchmarks</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Utility Solar (Fixed)', range: '$0.55–0.72/W', color: T.blue },
                  { label: 'Utility Solar (SAT)', range: '$0.60–0.82/W', color: T.teal },
                  { label: 'C&I Rooftop', range: '$0.85–1.25/W', color: T.green },
                  { label: 'Residential', range: '$2.50–3.20/W', color: T.gold },
                  { label: 'Offshore Wind (ref)', range: '$2.80–4.20/W', color: T.sub },
                ].map(item => (
                  <div key={item.label} style={{ padding: '10px 14px', background: T.bg, borderRadius: 8, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: T.text }}>{item.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: item.color }}>{item.range}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div style={{ marginTop: 32, padding: '16px 0', borderTop: `1px solid ${T.border}`, fontSize: 11, color: T.sub }}>
          Data sources: NREL Q3 2023 Solar Industry Update · Wood Mackenzie US Solar Market Insight Q3 2023 · BloombergNEF Solar Module Price Index · Lawrence Berkeley LBNL Utility-Scale Solar 2023 · S&P Global Market Intelligence EPC Tracker
        </div>
      </div>
    </div>
  );
}
