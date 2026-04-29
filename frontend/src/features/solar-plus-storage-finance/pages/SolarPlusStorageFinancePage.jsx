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

const STATES = ['Texas', 'California', 'Arizona', 'Nevada', 'Florida', 'New Mexico', 'Colorado', 'Hawaii', 'Georgia', 'North Carolina'];
const COUPLING_TYPES = ['AC-Coupled', 'DC-Coupled', 'Hybrid (Both)'];

const PROJECTS = Array.from({ length: 22 }, (_, i) => {
  const capacityMwAc = 50 + Math.round(sr(i * 7) * 450);
  const dcAcRatio = 1.15 + sr(i * 11) * 0.45;
  const storageMwh = capacityMwAc * (1.0 + sr(i * 13) * 3.0);
  const itcAddedPct = 6 + sr(i * 17) * 4;
  const clippingLossPct = 2 + sr(i * 19) * 5;
  const baseItc = 30;
  const totalItcPct = baseItc + itcAddedPct;
  const energyRevM = capacityMwAc * 0.22 * 8760 * 48 / 1e6;
  const capacityRevM = capacityMwAc * 5.5 / 1e3;
  const ancillaryRevM = storageMwh * 0.8 / 1e3;
  const irrBase = 7.5 + sr(i * 23) * 4.5;
  const irrWithStorage = irrBase + 1.5 + sr(i * 29) * 2.0;
  const augmentationYr = 8 + Math.round(sr(i * 31) * 5);
  return {
    id: `EC3-${String(i + 1).padStart(2, '0')}`,
    name: `SS-${STATES[i % STATES.length].slice(0, 3).toUpperCase()}-${String(i + 1).padStart(3, '0')}`,
    state: STATES[i % STATES.length],
    capacityMwAc,
    storageMwh: +storageMwh.toFixed(0),
    dcAcRatio: +dcAcRatio.toFixed(2),
    coupling: COUPLING_TYPES[i % COUPLING_TYPES.length],
    itcAddedPct: +itcAddedPct.toFixed(1),
    totalItcPct: +totalItcPct.toFixed(1),
    clippingLossPct: +clippingLossPct.toFixed(1),
    revenueStack: {
      energy: +energyRevM.toFixed(2),
      capacity: +capacityRevM.toFixed(2),
      ancillary: +ancillaryRevM.toFixed(2),
    },
    irrBase: +irrBase.toFixed(2),
    irrWithStorage: +irrWithStorage.toFixed(2),
    augmentationYr,
    augmentationCapex: +(storageMwh * (55 + sr(i * 37) * 30) / 1e3).toFixed(2),
  };
});

const DEGRADATION_CURVE = Array.from({ length: 20 }, (_, yr) => ({
  year: `Yr ${yr + 1}`,
  solarDeg: +(100 - yr * 0.55 - sr(yr * 7) * 0.3).toFixed(1),
  bessDeg: +(100 - yr * 2.1 - sr(yr * 11) * 0.8).toFixed(1),
  withAugmentation: yr < 10 ? +(100 - yr * 2.1 - sr(yr * 11) * 0.8).toFixed(1) : +(100 - (yr - 10) * 2.1 - sr(yr * 11) * 0.8 + 30).toFixed(1),
}));

const ITC_TIERS = [
  { tier: 'Base ITC', rate: 30, requirement: 'Prevailing Wage + Apprenticeship', color: T.blue },
  { tier: '+ Domestic Content', rate: 10, requirement: '40% US-manufactured content (IRA §48E)', color: T.green },
  { tier: '+ Energy Community', rate: 10, requirement: 'Located in coal/oil community census tract', color: T.teal },
  { tier: '+ Low-Income', rate: 20, requirement: 'Qualified low-income community project', color: T.gold },
];

const KPI_CARD = ({ label, value, unit, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 20px', flex: 1, minWidth: 150 }}>
    <div style={{ fontSize: 12, color: T.sub, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.text }}>{value}</div>
    {unit && <div style={{ fontSize: 11, color: T.sub }}>{unit}</div>}
  </div>
);

const TABS = [
  { id: 'portfolio', label: 'Portfolio Dashboard' },
  { id: 'coupling', label: 'DC vs AC Coupling' },
  { id: 'itc', label: 'IRA Tax Credit Optimizer' },
  { id: 'revenue', label: 'Revenue Stacking' },
  { id: 'degradation', label: 'Degradation & Augmentation' },
  { id: 'ppa', label: 'PPA Structure' },
];

export default function SolarPlusStorageFinancePage() {
  const [activeTab, setActiveTab] = useState('portfolio');
  const [selectedState, setSelectedState] = useState('All');

  const filtered = useMemo(() =>
    selectedState === 'All' ? PROJECTS : PROJECTS.filter(p => p.state === selectedState),
    [selectedState]
  );

  const kpis = useMemo(() => {
    const totalMwAc = filtered.reduce((s, p) => s + p.capacityMwAc, 0);
    const totalMwh = filtered.reduce((s, p) => s + p.storageMwh, 0);
    const avgDcAc = filtered.length ? filtered.reduce((s, p) => s + p.dcAcRatio, 0) / filtered.length : 0;
    const avgIrrBase = filtered.length ? filtered.reduce((s, p) => s + p.irrBase, 0) / filtered.length : 0;
    const avgIrrStorage = filtered.length ? filtered.reduce((s, p) => s + p.irrWithStorage, 0) / filtered.length : 0;
    const avgItc = filtered.length ? filtered.reduce((s, p) => s + p.totalItcPct, 0) / filtered.length : 0;
    return { totalMwAc, totalMwh, avgDcAc, avgIrrBase, avgIrrStorage, avgItc };
  }, [filtered]);

  const revenueData = useMemo(() =>
    filtered.slice(0, 12).map(p => ({
      name: p.name,
      energy: p.revenueStack.energy,
      capacity: p.revenueStack.capacity,
      ancillary: p.revenueStack.ancillary,
      total: +(p.revenueStack.energy + p.revenueStack.capacity + p.revenueStack.ancillary).toFixed(2),
    })), [filtered]);

  const irrComparison = useMemo(() =>
    filtered.slice(0, 14).map(p => ({
      name: p.name,
      irrBase: p.irrBase,
      irrStorage: p.irrWithStorage,
      uplift: +(p.irrWithStorage - p.irrBase).toFixed(2),
    })), [filtered]);

  const couplingComparison = [
    { metric: 'Clipping Loss', acCoupled: 4.2, dcCoupled: 1.8, hybrid: 2.4 },
    { metric: 'Round-trip Efficiency', acCoupled: 88, dcCoupled: 92, hybrid: 90 },
    { metric: 'ITC Eligibility', acCoupled: 30, dcCoupled: 40, hybrid: 35 },
    { metric: 'Dispatch Flexibility', acCoupled: 95, dcCoupled: 85, hybrid: 90 },
    { metric: 'CAPEX Premium (%)', acCoupled: 0, dcCoupled: 3, hybrid: 2 },
  ];

  const ppaStructures = [
    { type: 'Fixed-Price PPA', term: 20, shadowPrice: 'N/A', escalator: '0%', comment: 'Price certainty; limits upside' },
    { type: 'Escalating PPA', term: 20, shadowPrice: 'N/A', escalator: '1–2%/yr', comment: 'Inflation-linked; lower initial price' },
    { type: 'Merchant + PPA Sleeve', term: 10, shadowPrice: '$42/MWh', escalator: 'N/A', comment: 'Floor + upside participation' },
    { type: 'Tolling Agreement', term: 15, shadowPrice: 'Variable', escalator: 'Market', comment: 'Offtake bears price risk; dev keeps Spark' },
    { type: 'Capacity + Energy (CES)', term: 20, shadowPrice: 'N/A', escalator: '0%', comment: 'Bundled BESS cap. + solar energy revenue' },
  ];

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: T.sub, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>EP-EC3 · Solar Energy Finance</div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: T.text, margin: 0 }}>Solar + Storage (Co-located BESS) Finance</h1>
          <p style={{ color: T.sub, marginTop: 6, fontSize: 14 }}>
            Integrated solar-plus-storage project analytics — IRA tax credit optimisation, DC/AC coupling, revenue stacking and BESS augmentation economics.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <select value={selectedState} onChange={e => setSelectedState(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.card, fontSize: 13 }}>
            <option value="All">All States</option>
            {STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <div style={{ marginLeft: 'auto', fontSize: 13, color: T.sub, alignSelf: 'center' }}>
            {filtered.length} projects · IRA §48E Storage ITC: up to 70% all-in
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <KPI_CARD label="Total Solar (AC)" value={kpis.totalMwAc.toLocaleString()} unit="MWac" color={T.blue} />
          <KPI_CARD label="Total Storage" value={kpis.totalMwh.toLocaleString()} unit="MWh" color={T.teal} />
          <KPI_CARD label="Avg DC:AC Ratio" value={kpis.avgDcAc.toFixed(2)} unit="ratio" color={T.green} />
          <KPI_CARD label="Avg IRR (Solar-Only)" value={kpis.avgIrrBase.toFixed(2)} unit="%" color={T.sub} />
          <KPI_CARD label="Avg IRR (with BESS)" value={kpis.avgIrrStorage.toFixed(2)} unit="%" color={T.gold} />
          <KPI_CARD label="Avg Total ITC" value={kpis.avgItc.toFixed(1)} unit="% credit" color={T.indigo} />
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

        {activeTab === 'portfolio' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: T.navy, color: '#fff' }}>
                  {['ID', 'Name', 'State', 'MW (AC)', 'MWh', 'DC:AC', 'Coupling', 'ITC Adder %', 'Total ITC %', 'Clipping %', 'IRR Base', 'IRR+BESS', 'Aug. Yr'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, fontSize: 11, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr key={p.id} style={{ background: i % 2 === 0 ? T.card : '#F9F8F5', borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '8px 12px', color: T.sub, fontFamily: 'monospace', fontSize: 11 }}>{p.id}</td>
                    <td style={{ padding: '8px 12px', fontWeight: 600 }}>{p.name}</td>
                    <td style={{ padding: '8px 12px' }}>{p.state}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right' }}>{p.capacityMwAc}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', color: T.teal }}>{p.storageMwh.toLocaleString()}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right' }}>{p.dcAcRatio}</td>
                    <td style={{ padding: '8px 12px', fontSize: 11 }}>{p.coupling}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', color: T.indigo }}>{p.itcAddedPct}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: T.green }}>{p.totalItcPct}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', color: T.amber }}>{p.clippingLossPct}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right' }}>{p.irrBase}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', color: T.gold, fontWeight: 700 }}>{p.irrWithStorage}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right' }}>{p.augmentationYr}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'coupling' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>DC vs AC Coupling Comparison</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: T.bg }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, fontSize: 12 }}>Metric</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center', color: T.blue, fontWeight: 700 }}>AC-Coupled</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center', color: T.green, fontWeight: 700 }}>DC-Coupled</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center', color: T.teal, fontWeight: 700 }}>Hybrid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {couplingComparison.map((r, i) => (
                      <tr key={r.metric} style={{ background: i % 2 === 0 ? T.card : '#F9F8F5', borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '8px 12px', fontWeight: 500 }}>{r.metric}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>{r.acCoupled}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'center', color: T.green, fontWeight: 600 }}>{r.dcCoupled}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>{r.hybrid}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>IRR Uplift: Solar-Only vs Solar+BESS</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={irrComparison.slice(0, 10)} margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                  <YAxis domain={[5, 16]} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v, n) => [`${v}%`, n]} />
                  <Legend />
                  <Bar dataKey="irrBase" name="Solar-Only IRR" fill={T.sub} opacity={0.7} />
                  <Bar dataKey="irrStorage" name="Solar+BESS IRR" fill={T.gold} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'itc' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>IRA §48E ITC Adder Stack</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {ITC_TIERS.map((tier, i) => (
                  <div key={tier.tier} style={{ padding: '14px 16px', borderRadius: 8, borderLeft: `4px solid ${tier.color}`, background: T.bg }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, color: tier.color, fontSize: 14 }}>{tier.tier}</span>
                      <span style={{ fontWeight: 700, fontSize: 18, color: tier.color }}>+{tier.rate}%</span>
                    </div>
                    <div style={{ fontSize: 12, color: T.sub, marginTop: 4 }}>{tier.requirement}</div>
                    {i === ITC_TIERS.length - 1 && (
                      <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px dashed ${T.border}`, fontSize: 13, fontWeight: 700, color: T.text }}>
                        Maximum Stack: <span style={{ color: T.green }}>70% ITC</span> (excl. Low-Income adder)
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>ITC Distribution Across Portfolio</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={filtered.map(p => ({ name: p.name, itc: p.totalItcPct }))} margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                  <YAxis domain={[28, 42]} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={v => [`${v}%`, 'Total ITC']} />
                  <Bar dataKey="itc" name="Total ITC %">
                    {filtered.map((p, i) => <Cell key={i} fill={p.totalItcPct >= 38 ? T.green : p.totalItcPct >= 35 ? T.teal : T.blue} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div style={{ marginTop: 12, padding: 10, background: '#EFF6FF', borderRadius: 8, fontSize: 12, color: T.text }}>
                <strong style={{ color: T.blue }}>Wood Mackenzie (2023):</strong> IRA domestic content adder adds 1.2–2.1% IRR to utility solar+storage projects. First-year cash benefit = ITC% × project CAPEX.
              </div>
            </div>
          </div>
        )}

        {activeTab === 'revenue' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Revenue Stack by Project (M$/yr)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueData} margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v, n) => [`$${v}M`, n]} />
                  <Legend />
                  <Bar dataKey="energy" name="Energy (PPA/Merchant)" stackId="a" fill={T.blue} />
                  <Bar dataKey="capacity" name="Capacity Market" stackId="a" fill={T.green} />
                  <Bar dataKey="ancillary" name="Ancillary Services (FFR/Reg)" stackId="a" fill={T.gold} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Revenue Split</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={[
                    { name: 'Energy', value: +(revenueData.reduce((s, p) => s + p.energy, 0)).toFixed(1), fill: T.blue },
                    { name: 'Capacity', value: +(revenueData.reduce((s, p) => s + p.capacity, 0)).toFixed(1), fill: T.green },
                    { name: 'Ancillary', value: +(revenueData.reduce((s, p) => s + p.ancillary, 0)).toFixed(1), fill: T.gold },
                  ]} cx="50%" cy="50%" outerRadius={85} dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} />
                  <Tooltip formatter={v => [`$${v}M`, '']} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ marginTop: 8, fontSize: 12, color: T.sub, textAlign: 'center' }}>
                BESS ancillary revenue: <strong style={{ color: T.gold }}>$0.6–2.8/MWh</strong> (BNEF 2023)
              </div>
            </div>
          </div>
        )}

        {activeTab === 'degradation' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>20-Year Capacity Degradation (%)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={DEGRADATION_CURVE} margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 10 }} interval={2} />
                  <YAxis domain={[55, 102]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="solarDeg" name="Solar Module" stroke={T.blue} dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="bessDeg" name="BESS (No Aug.)" stroke={T.red} dot={false} strokeWidth={2} strokeDasharray="6 3" />
                  <Line type="monotone" dataKey="withAugmentation" name="BESS (with Aug. Yr 10)" stroke={T.green} dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Augmentation Economics</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'LFP Cell Degradation Rate', value: '2–2.5%/yr capacity fade', color: T.amber },
                  { label: 'NMC Cell Degradation Rate', value: '3–4%/yr capacity fade', color: T.red },
                  { label: 'Typical Augmentation Trigger', value: '80% state-of-health (SoH)', color: T.teal },
                  { label: 'Augmentation Cost (2023)', value: '$60–90/kWh added capacity', color: T.green },
                  { label: 'Augmentation Cost (2030E)', value: '$35–55/kWh (BNEF forecast)', color: T.blue },
                  { label: 'IRR Impact of Augmentation', value: '+0.4–1.2% vs no aug.', color: T.gold },
                ].map(item => (
                  <div key={item.label} style={{ padding: '10px 14px', background: T.bg, borderRadius: 8, display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                    <span style={{ fontSize: 12, color: T.text }}>{item.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: item.color, whiteSpace: 'nowrap' }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ppa' && (
          <div>
            <div style={{ background: T.card, borderRadius: 10, border: `1px solid ${T.border}`, overflow: 'hidden', marginBottom: 20 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: T.navy, color: '#fff' }}>
                    {['PPA Structure', 'Term (yrs)', 'Price Floor', 'Escalator', 'Key Consideration'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, fontSize: 12 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ppaStructures.map((p, i) => (
                    <tr key={p.type} style={{ background: i % 2 === 0 ? T.card : '#F9F8F5', borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '10px 16px', fontWeight: 600, color: T.blue }}>{p.type}</td>
                      <td style={{ padding: '10px 16px', textAlign: 'right' }}>{p.term}</td>
                      <td style={{ padding: '10px 16px' }}>{p.shadowPrice}</td>
                      <td style={{ padding: '10px 16px' }}>{p.escalator}</td>
                      <td style={{ padding: '10px 16px', color: T.sub, fontSize: 12 }}>{p.comment}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                { title: 'Solar+BESS PPA Trend (US)', value: '$28–42/MWh', sub: 'Bundled energy + storage (2023)', color: T.blue },
                { title: 'BESS Capacity Market Rate', value: '$4–7/kW-month', sub: 'CAISO/PJM/MISO (2023)', color: T.green },
                { title: 'FFR/Ancillary Revenue', value: '$8–22/MW/hr', sub: 'Frequency regulation (ISO-NE)', color: T.gold },
              ].map(item => (
                <div key={item.title} style={{ background: T.card, borderRadius: 10, padding: 18, border: `1px solid ${T.border}`, borderTop: `3px solid ${item.color}` }}>
                  <div style={{ fontSize: 11, color: T.sub }}>{item.title}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: item.color, marginTop: 4 }}>{item.value}</div>
                  <div style={{ fontSize: 11, color: T.sub, marginTop: 4 }}>{item.sub}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: 32, padding: '16px 0', borderTop: `1px solid ${T.border}`, fontSize: 11, color: T.sub }}>
          Data sources: BNEF H2 2023 BESS Market Outlook · IRA §48E/§48C Investment Tax Credit Guide (US Treasury 2023) · Wood Mackenzie Solar+Storage Market Monitor Q3 2023 · NREL Storage Value Estimation Tool · CAISO/PJM Ancillary Services Market Data
        </div>
      </div>
    </div>
  );
}
