import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, ComposedChart
} from 'recharts';

const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const T = { navy: '#1b3a5c', gold: '#c5a96a', cream: '#f7f4ef', red: '#991b1b', green: '#065f46', gray: '#6b7280', orange: '#c2410c', teal: '#0f766e', purple: '#6d28d9', emerald: '#059669' };
const fmt = (n, d = 1) => { if (n == null || !isFinite(n)) return '—'; return n >= 1e9 ? `${(n / 1e9).toFixed(d)}B` : n >= 1e6 ? `${(n / 1e6).toFixed(d)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(d)}K` : `${n.toFixed(d)}`; };

const REGISTRIES = ['Verra', 'Gold Standard', 'Puro', 'Isometric'];
const REG_COLORS = ['#0f766e', '#b45309', '#6d28d9', '#0369a1'];
const STATUSES = ['Draft', 'Pending', 'Processing', 'Completed', 'Failed', 'Cancelled'];
const STATUS_COLORS = { Draft: '#6b7280', Pending: '#b45309', Processing: '#0369a1', Completed: '#059669', Failed: '#991b1b', Cancelled: '#4b5563' };
const PURPOSE_TYPES = ['Voluntary Offset (Scope 1)', 'Voluntary Offset (Scope 2)', 'Voluntary Offset (Scope 3)', 'Compliance (CORSIA)', 'Compliance (ETS)', 'Product Carbon Neutral', 'Supply Chain', 'Event Offset'];
const PROJECT_NAMES = [
  'Madre de Dios REDD+', 'Rimba Raya Biodiversity', 'Alto Mayo Protected Forest', 'Kariba REDD+',
  'Katingan Mentaya', 'Cordillera Azul', 'Kasigau Corridor', 'Tambopata Bahuaja',
  'Kenya Biogas Programme', 'India Solar Rooftop', 'BC Forest Offset', 'Blue Carbon Senegal',
  'Soil Carbon Great Plains', 'Methane Coal Mine PL', 'Industrial HFC Dest.', 'Cookstove Ethiopia',
  'Acapa Wind Farm', 'Ghana Biomass', 'Vietnam Mangrove', 'UK Peatland Restore'
];

const BENEFICIARIES = [
  { id: 'BEN-001', name: 'Meridian Capital Group', type: 'Corporate', country: 'US', contact: 'j.morrison@meridian.com' },
  { id: 'BEN-002', name: 'Swiss Re AG', type: 'Insurance', country: 'CH', contact: 'klara.bauer@swissre.com' },
  { id: 'BEN-003', name: 'Unilever plc', type: 'FMCG', country: 'UK', contact: 'p.singh@unilever.com' },
  { id: 'BEN-004', name: 'Lufthansa Group', type: 'Aviation', country: 'DE', contact: 'm.weber@lufthansa.com' },
  { id: 'BEN-005', name: 'Nestle SA', type: 'Food & Bev', country: 'CH', contact: 'a.dupont@nestle.com' },
];

const TRANSACTIONS = Array.from({ length: 20 }, (_, i) => {
  const statIdx = i < 3 ? 0 : i < 6 ? 1 : i < 10 ? 2 : i < 16 ? 3 : i < 18 ? 4 : 5;
  return {
    id: `RET-${2024000 + i}`,
    project: PROJECT_NAMES[i],
    registry: REGISTRIES[i % 4],
    beneficiary: BENEFICIARIES[i % 5].name,
    beneficiaryId: BENEFICIARIES[i % 5].id,
    purpose: PURPOSE_TYPES[i % PURPOSE_TYPES.length],
    quantity: Math.round(5000 + sr(i * 7) * 95000),
    vintage: 2018 + Math.floor(sr(i * 11) * 7),
    status: STATUSES[statIdx],
    submitted: `2024-${String(1 + Math.floor(sr(i * 13) * 12)).padStart(2, '0')}-${String(1 + Math.floor(sr(i * 17) * 28)).padStart(2, '0')}`,
    serial_start: `VCS-${1000000 + i * 47321}`,
    serial_end: `VCS-${1000000 + i * 47321 + Math.round(5000 + sr(i * 7) * 95000)}`,
    price_per_t: +(3.5 + sr(i * 19) * 18).toFixed(2),
    total_cost: 0,
    docs_attached: Math.round(1 + sr(i * 23) * 4),
    compliance_map: i % 3 === 0 ? 'CORSIA' : i % 3 === 1 ? 'EU ETS' : 'Voluntary',
  };
});
TRANSACTIONS.forEach(t => { t.total_cost = +(t.quantity * t.price_per_t).toFixed(2); });

// Pipeline stages
const PIPELINE_STAGES = ['Initiated', 'Validated', 'Submitted', 'Confirmed', 'Certified'];

const WIZARD_STEPS = ['Select Credits', 'Choose Beneficiary', 'Select Registry', 'Define Purpose', 'Attach Documents', 'Submit'];

const COMPLIANCE_FRAMEWORKS = [
  { framework: 'CORSIA', scope: 'Aviation offsets', eligible_registries: 'Verra, Gold Standard', unit: 'CORSIA Eligible Emission Units', status: 'Active' },
  { framework: 'EU ETS', scope: 'EU cap-and-trade', eligible_registries: 'Verra (select)', unit: 'EU Allowances (EUA)', status: 'Active' },
  { framework: 'California CaT', scope: 'CA cap-and-trade', eligible_registries: 'ACR, CAR', unit: 'ARB Offset Credits', status: 'Active' },
  { framework: 'UK ETS', scope: 'UK cap-and-trade', eligible_registries: 'Verra (pilot)', unit: 'UK Allowances (UKA)', status: 'Pilot' },
  { framework: 'ICAO LTAG', scope: 'Long-term aviation', eligible_registries: 'All major', unit: 'SAF Credits', status: 'Proposed' },
  { framework: 'Article 6.4', scope: 'Paris Agreement', eligible_registries: 'UN Mechanism', unit: 'A6.4ERs', status: 'Emerging' },
];

const TabBar = ({ tabs, active, onSelect }) => (
  <div style={{ display: 'flex', borderBottom: `2px solid ${T.gold}`, marginBottom: 20 }}>
    {tabs.map(t => (
      <button key={t} onClick={() => onSelect(t)} style={{
        padding: '10px 18px', background: 'none', border: 'none', cursor: 'pointer',
        fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: active === t ? 700 : 400,
        color: active === t ? T.gold : T.navy, borderBottom: active === t ? `3px solid ${T.gold}` : '3px solid transparent',
        marginBottom: -2,
      }}>{t}</button>
    ))}
  </div>
);

const Kpi = ({ label, value, sub, color }) => (
  <div style={{ background: '#fff', border: '1px solid #e5e0d8', borderRadius: 8, padding: '14px 18px', flex: 1 }}>
    <div style={{ fontSize: 11, color: T.gray, fontFamily: 'DM Sans, sans-serif', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: color || T.navy }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.gray, marginTop: 3 }}>{sub}</div>}
  </div>
);

const Section = ({ title, children, badge }) => (
  <div style={{ background: '#fff', border: '1px solid #e5e0d8', borderRadius: 8, padding: 20, marginBottom: 20 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.navy }}>{title}</h3>
      {badge && <span style={{ fontSize: 10, background: T.navy, color: '#fff', padding: '2px 8px', borderRadius: 4, fontFamily: 'JetBrains Mono, monospace' }}>{badge}</span>}
    </div>
    {children}
  </div>
);

const Badge = ({ text, color }) => (
  <span style={{ background: color || T.gray, color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, fontFamily: 'JetBrains Mono, monospace' }}>{text}</span>
);

const DualInput = ({ label, value, onChange, min = 0, max = 100000 }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <span style={{ fontSize: 11, color: T.gray, minWidth: 80 }}>{label}</span>
    <input type="range" min={min} max={max} value={value} onChange={e => onChange(+e.target.value)} style={{ flex: 1 }} />
    <input type="number" min={min} max={max} value={value} onChange={e => onChange(+e.target.value)}
      style={{ width: 70, padding: '3px 6px', border: '1px solid #d1ccc2', borderRadius: 4, fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
  </div>
);

export default function CcRetirementWorkflowPage() {
  const [tab, setTab] = useState('Retirement Dashboard');
  const [statusFilter, setStatusFilter] = useState('All');
  const [registryFilter, setRegistryFilter] = useState('All');
  const [minQty, setMinQty] = useState(0);
  const [wizardStep, setWizardStep] = useState(0);
  const [selectedCredits, setSelectedCredits] = useState([]);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState(null);
  const [selectedRegistry, setSelectedRegistry] = useState(null);
  const [selectedPurpose, setSelectedPurpose] = useState(null);
  const [docsCount, setDocsCount] = useState(0);

  const TABS = ['Retirement Dashboard', 'New Retirement', 'Registry Submission', 'Beneficiary Management', 'Retirement Ledger', 'Compliance Mapping'];

  const filtered = useMemo(() => TRANSACTIONS.filter(t =>
    (statusFilter === 'All' || t.status === statusFilter) &&
    (registryFilter === 'All' || t.registry === registryFilter) &&
    t.quantity >= minQty
  ), [statusFilter, registryFilter, minQty]);

  const pipelineData = useMemo(() => PIPELINE_STAGES.map((stage, i) => ({
    stage,
    count: Math.round(8 + sr(i * 7) * 22),
    value: Math.round((200000 + sr(i * 11) * 800000)),
  })), []);

  const monthlyRetirements = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
    retired: Math.round(50000 + sr(i * 7) * 150000),
    requests: Math.round(8 + sr(i * 11) * 25),
    avg_time_days: Math.round(5 + sr(i * 13) * 18),
  })), []);

  const byPurpose = useMemo(() => PURPOSE_TYPES.map((p, i) => ({
    purpose: p.length > 22 ? p.slice(0, 20) + '...' : p,
    full: p,
    count: Math.round(3 + sr(i * 5) * 15),
    volume: Math.round(20000 + sr(i * 7) * 180000),
  })), []);

  const statusSummary = useMemo(() => {
    const m = {};
    STATUSES.forEach(s => { m[s] = 0; });
    TRANSACTIONS.forEach(t => { m[t.status] = (m[t.status] || 0) + 1; });
    return Object.entries(m).map(([status, count]) => ({ status, count }));
  }, []);

  const totalRetired = useMemo(() => TRANSACTIONS.filter(t => t.status === 'Completed').reduce((a, t) => a + t.quantity, 0), []);
  const totalPending = useMemo(() => TRANSACTIONS.filter(t => ['Pending', 'Processing'].includes(t.status)).reduce((a, t) => a + t.quantity, 0), []);
  const totalValue = useMemo(() => TRANSACTIONS.filter(t => t.status === 'Completed').reduce((a, t) => a + t.total_cost, 0), []);

  const submissionByRegistry = useMemo(() => REGISTRIES.map((r, i) => ({
    registry: r,
    submitted: Math.round(5 + sr(i * 7) * 20),
    confirmed: Math.round(3 + sr(i * 11) * 15),
    avg_days: Math.round(3 + sr(i * 13) * 12),
    pending: Math.round(1 + sr(i * 17) * 6),
    rejection_rate: +(sr(i * 19) * 8).toFixed(1),
  })), []);

  return (
    <div style={{ padding: 24, background: T.cream, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: T.gray, background: '#e9e4db', padding: '3px 8px', borderRadius: 4 }}>EP-BV1</span>
          <span style={{ fontSize: 11, color: T.teal, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>CARBON CREDITS . RETIREMENT</span>
        </div>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: T.navy }}>Retirement Workflow Engine</h1>
        <p style={{ margin: '4px 0 0', color: T.gray, fontSize: 13 }}>Pipeline management . Retirement submission . Beneficiary tracking . Compliance mapping . Registry integration</p>
      </div>

      <TabBar tabs={TABS} active={tab} onSelect={setTab} />

      {/* ─── TAB 1: RETIREMENT DASHBOARD ─── */}
      {tab === 'Retirement Dashboard' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <Kpi label="Initiated" value={pipelineData[0].count} sub={`${fmt(pipelineData[0].value)} tCO2e`} color={T.gray} />
            <Kpi label="Validated" value={pipelineData[1].count} sub={`${fmt(pipelineData[1].value)} tCO2e`} color={T.orange} />
            <Kpi label="Submitted" value={pipelineData[2].count} sub={`${fmt(pipelineData[2].value)} tCO2e`} color={T.teal} />
            <Kpi label="Confirmed" value={pipelineData[3].count} sub={`${fmt(pipelineData[3].value)} tCO2e`} color={T.emerald} />
            <Kpi label="Certified" value={pipelineData[4].count} sub={`${fmt(pipelineData[4].value)} tCO2e`} color={T.gold} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
            <Section title="Monthly Retirements (2024)" badge="tCO2e">
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={monthlyRetirements}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
                  <XAxis dataKey="month" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11 }} />
                  <YAxis yAxisId="l" tickFormatter={v => fmt(v)} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }} />
                  <YAxis yAxisId="r" orientation="right" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }} />
                  <Tooltip formatter={(v, n) => n === 'retired' ? `${fmt(v)} tCO2e` : v} />
                  <Bar yAxisId="l" dataKey="retired" name="Retired Volume" fill={T.teal} radius={[3, 3, 0, 0]} />
                  <Line yAxisId="r" type="monotone" dataKey="requests" name="Requests" stroke={T.gold} strokeWidth={2} dot={{ r: 3 }} />
                  <Legend />
                </ComposedChart>
              </ResponsiveContainer>
            </Section>

            <Section title="By Purpose Type">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={byPurpose} dataKey="volume" nameKey="purpose" cx="50%" cy="50%" outerRadius={95}
                    label={({ purpose, percent }) => `${purpose.slice(0, 12)}.. ${(percent * 100).toFixed(0)}%`}>
                    {byPurpose.map((_, i) => <Cell key={i} fill={[T.teal, T.emerald, T.navy, T.gold, T.orange, T.purple, T.red, '#0369a1'][i]} />)}
                  </Pie>
                  <Tooltip formatter={v => `${fmt(v)} tCO2e`} />
                </PieChart>
              </ResponsiveContainer>
            </Section>
          </div>

          <Section title="Active Retirement Requests">
            <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                style={{ padding: '5px 10px', border: '1px solid #d1ccc2', borderRadius: 4, fontSize: 12, fontFamily: 'DM Sans, sans-serif' }}>
                <option value="All">All Statuses</option>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={registryFilter} onChange={e => setRegistryFilter(e.target.value)}
                style={{ padding: '5px 10px', border: '1px solid #d1ccc2', borderRadius: 4, fontSize: 12, fontFamily: 'DM Sans, sans-serif' }}>
                <option value="All">All Registries</option>
                {REGISTRIES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <DualInput label="Min Qty:" value={minQty} onChange={setMinQty} min={0} max={100000} />
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.navy, color: '#fff' }}>
                    {['ID', 'Project', 'Registry', 'Beneficiary', 'Quantity', 'Purpose', 'Status', 'Submitted'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t, i) => (
                    <tr key={t.id} style={{ background: i % 2 ? '#faf9f6' : '#fff', borderBottom: '1px solid #e5e0d8' }}>
                      <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{t.id}</td>
                      <td style={{ padding: '7px 10px', fontWeight: 600 }}>{t.project}</td>
                      <td style={{ padding: '7px 10px' }}>{t.registry}</td>
                      <td style={{ padding: '7px 10px' }}>{t.beneficiary}</td>
                      <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace' }}>{t.quantity.toLocaleString()}</td>
                      <td style={{ padding: '7px 10px', fontSize: 11 }}>{t.purpose}</td>
                      <td style={{ padding: '7px 10px' }}><Badge text={t.status} color={STATUS_COLORS[t.status]} /></td>
                      <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{t.submitted}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        </>
      )}

      {/* ─── TAB 2: NEW RETIREMENT ─── */}
      {tab === 'New Retirement' && (
        <>
          <Section title="Retirement Request Wizard" badge={`Step ${wizardStep + 1} / ${WIZARD_STEPS.length}`}>
            <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
              {WIZARD_STEPS.map((s, i) => (
                <div key={s} onClick={() => setWizardStep(i)} style={{
                  flex: 1, padding: '8px 6px', textAlign: 'center', cursor: 'pointer',
                  background: i === wizardStep ? T.teal : i < wizardStep ? T.emerald : '#e9e4db',
                  color: i <= wizardStep ? '#fff' : T.navy, borderRadius: 4, fontSize: 11, fontWeight: 600,
                }}>
                  {i + 1}. {s}
                </div>
              ))}
            </div>

            {wizardStep === 0 && (
              <div>
                <h4 style={{ margin: '0 0 12px', color: T.navy, fontSize: 13 }}>Select Credits for Retirement</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: '#f0ece4' }}>
                      {['', 'Project', 'Registry', 'Vintage', 'Available', 'Price/t'].map(h => (
                        <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {TRANSACTIONS.filter(t => t.status === 'Draft' || t.status === 'Completed').slice(0, 8).map((t, i) => (
                      <tr key={t.id} style={{ background: selectedCredits.includes(t.id) ? '#e0f2f1' : i % 2 ? '#faf9f6' : '#fff' }}>
                        <td style={{ padding: '6px 10px' }}>
                          <input type="checkbox" checked={selectedCredits.includes(t.id)}
                            onChange={() => setSelectedCredits(prev => prev.includes(t.id) ? prev.filter(x => x !== t.id) : [...prev, t.id])} />
                        </td>
                        <td style={{ padding: '6px 10px', fontWeight: 600 }}>{t.project}</td>
                        <td style={{ padding: '6px 10px' }}>{t.registry}</td>
                        <td style={{ padding: '6px 10px', fontFamily: 'JetBrains Mono, monospace' }}>{t.vintage}</td>
                        <td style={{ padding: '6px 10px', fontFamily: 'JetBrains Mono, monospace' }}>{t.quantity.toLocaleString()}</td>
                        <td style={{ padding: '6px 10px', fontFamily: 'JetBrains Mono, monospace' }}>${t.price_per_t}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p style={{ fontSize: 11, color: T.gray, marginTop: 8 }}>Selected: {selectedCredits.length} credit batch(es)</p>
              </div>
            )}

            {wizardStep === 1 && (
              <div>
                <h4 style={{ margin: '0 0 12px', color: T.navy, fontSize: 13 }}>Choose Beneficiary</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  {BENEFICIARIES.map(b => (
                    <div key={b.id} onClick={() => setSelectedBeneficiary(b.id)}
                      style={{
                        border: `2px solid ${selectedBeneficiary === b.id ? T.teal : '#e5e0d8'}`,
                        borderRadius: 8, padding: 14, cursor: 'pointer',
                        background: selectedBeneficiary === b.id ? '#e0f2f1' : '#fff',
                      }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: T.navy }}>{b.name}</div>
                      <div style={{ fontSize: 11, color: T.gray, marginTop: 4 }}>{b.type} | {b.country}</div>
                      <div style={{ fontSize: 10, color: T.teal, marginTop: 2, fontFamily: 'JetBrains Mono, monospace' }}>{b.id}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {wizardStep === 2 && (
              <div>
                <h4 style={{ margin: '0 0 12px', color: T.navy, fontSize: 13 }}>Select Target Registry</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                  {REGISTRIES.map((r, i) => (
                    <div key={r} onClick={() => setSelectedRegistry(r)}
                      style={{
                        border: `2px solid ${selectedRegistry === r ? REG_COLORS[i] : '#e5e0d8'}`,
                        borderRadius: 8, padding: 16, cursor: 'pointer', textAlign: 'center',
                        background: selectedRegistry === r ? `${REG_COLORS[i]}11` : '#fff',
                      }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: REG_COLORS[i] }}>{r}</div>
                      <div style={{ fontSize: 11, color: T.gray, marginTop: 4 }}>Avg {Math.round(3 + sr(i * 7) * 10)} days</div>
                      <div style={{ fontSize: 10, color: T.gray, marginTop: 2 }}>Fee: ${(0.03 + sr(i * 11) * 0.12).toFixed(2)}/t</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {wizardStep === 3 && (
              <div>
                <h4 style={{ margin: '0 0 12px', color: T.navy, fontSize: 13 }}>Define Retirement Purpose</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                  {PURPOSE_TYPES.map(p => (
                    <div key={p} onClick={() => setSelectedPurpose(p)}
                      style={{
                        border: `2px solid ${selectedPurpose === p ? T.teal : '#e5e0d8'}`,
                        borderRadius: 6, padding: 12, cursor: 'pointer',
                        background: selectedPurpose === p ? '#e0f2f1' : '#fff',
                      }}>
                      <div style={{ fontWeight: 600, fontSize: 12, color: T.navy }}>{p}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {wizardStep === 4 && (
              <div>
                <h4 style={{ margin: '0 0 12px', color: T.navy, fontSize: 13 }}>Attach Supporting Documents</h4>
                <div style={{ border: '2px dashed #d1ccc2', borderRadius: 8, padding: 30, textAlign: 'center' }}>
                  <div style={{ fontSize: 13, color: T.gray, marginBottom: 8 }}>Drop files here or click to upload</div>
                  <button onClick={() => setDocsCount(prev => prev + 1)}
                    style={{ padding: '8px 20px', background: T.teal, color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>
                    Simulate Upload
                  </button>
                  <p style={{ fontSize: 11, color: T.gray, marginTop: 8 }}>{docsCount} document(s) attached</p>
                </div>
              </div>
            )}

            {wizardStep === 5 && (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <h4 style={{ color: T.navy, fontSize: 14 }}>Review & Submit</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, maxWidth: 500, margin: '16px auto', textAlign: 'left' }}>
                  <div style={{ fontSize: 12, color: T.gray }}>Credits Selected:</div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{selectedCredits.length} batch(es)</div>
                  <div style={{ fontSize: 12, color: T.gray }}>Beneficiary:</div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{BENEFICIARIES.find(b => b.id === selectedBeneficiary)?.name || 'Not selected'}</div>
                  <div style={{ fontSize: 12, color: T.gray }}>Registry:</div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{selectedRegistry || 'Not selected'}</div>
                  <div style={{ fontSize: 12, color: T.gray }}>Purpose:</div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{selectedPurpose || 'Not selected'}</div>
                  <div style={{ fontSize: 12, color: T.gray }}>Documents:</div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{docsCount}</div>
                </div>
                <button style={{ padding: '10px 32px', background: T.emerald, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 700, marginTop: 8 }}>
                  Submit Retirement Request
                </button>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
              <button disabled={wizardStep === 0} onClick={() => setWizardStep(p => Math.max(0, p - 1))}
                style={{ padding: '7px 18px', background: wizardStep === 0 ? '#ccc' : T.navy, color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>
                Previous
              </button>
              <button disabled={wizardStep === WIZARD_STEPS.length - 1} onClick={() => setWizardStep(p => Math.min(WIZARD_STEPS.length - 1, p + 1))}
                style={{ padding: '7px 18px', background: wizardStep === WIZARD_STEPS.length - 1 ? '#ccc' : T.teal, color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>
                Next
              </button>
            </div>
          </Section>
        </>
      )}

      {/* ─── TAB 3: REGISTRY SUBMISSION ─── */}
      {tab === 'Registry Submission' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            {submissionByRegistry.map((r, i) => (
              <Kpi key={r.registry} label={r.registry} value={`${r.confirmed}/${r.submitted}`}
                sub={`Avg ${r.avg_days}d | ${r.rejection_rate}% reject`} color={REG_COLORS[i]} />
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Section title="Submission Pipeline by Registry">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={submissionByRegistry}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
                  <XAxis dataKey="registry" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11 }} />
                  <YAxis style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="submitted" name="Submitted" fill={T.navy} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="confirmed" name="Confirmed" fill={T.emerald} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="pending" name="Pending" fill={T.orange} radius={[3, 3, 0, 0]} />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            </Section>

            <Section title="Average Processing Time (days)">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={submissionByRegistry} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
                  <YAxis dataKey="registry" type="category" width={100} style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11 }} />
                  <XAxis type="number" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="avg_days" name="Avg Days" fill={T.teal} radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Section>
          </div>

          <Section title="Recent Submissions">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.navy, color: '#fff' }}>
                  {['ID', 'Project', 'Registry', 'Quantity', 'Serial Range', 'Status', 'Days in Queue'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TRANSACTIONS.filter(t => ['Pending', 'Processing'].includes(t.status)).map((t, i) => (
                  <tr key={t.id} style={{ background: i % 2 ? '#faf9f6' : '#fff', borderBottom: '1px solid #e5e0d8' }}>
                    <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{t.id}</td>
                    <td style={{ padding: '7px 10px', fontWeight: 600 }}>{t.project}</td>
                    <td style={{ padding: '7px 10px' }}>{t.registry}</td>
                    <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace' }}>{t.quantity.toLocaleString()}</td>
                    <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>{t.serial_start} ... {t.serial_end}</td>
                    <td style={{ padding: '7px 10px' }}><Badge text={t.status} color={STATUS_COLORS[t.status]} /></td>
                    <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace' }}>{Math.round(2 + sr(i * 7) * 14)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </>
      )}

      {/* ─── TAB 4: BENEFICIARY MANAGEMENT ─── */}
      {tab === 'Beneficiary Management' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <Kpi label="Total Beneficiaries" value={BENEFICIARIES.length} color={T.navy} />
            <Kpi label="Active Retirements" value={TRANSACTIONS.filter(t => ['Pending', 'Processing'].includes(t.status)).length} color={T.teal} />
            <Kpi label="Total Retired (All)" value={`${fmt(totalRetired)} tCO2e`} color={T.emerald} />
            <Kpi label="Total Value" value={`$${fmt(totalValue)}`} color={T.gold} />
          </div>

          <Section title="Registered Beneficiaries">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.navy, color: '#fff' }}>
                  {['ID', 'Name', 'Type', 'Country', 'Contact', 'Retirements', 'Total Volume'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {BENEFICIARIES.map((b, i) => {
                  const bTxns = TRANSACTIONS.filter(t => t.beneficiaryId === b.id);
                  const bVol = bTxns.reduce((a, t) => a + t.quantity, 0);
                  return (
                    <tr key={b.id} style={{ background: i % 2 ? '#faf9f6' : '#fff', borderBottom: '1px solid #e5e0d8' }}>
                      <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{b.id}</td>
                      <td style={{ padding: '7px 10px', fontWeight: 600 }}>{b.name}</td>
                      <td style={{ padding: '7px 10px' }}><Badge text={b.type} color={T.teal} /></td>
                      <td style={{ padding: '7px 10px' }}>{b.country}</td>
                      <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>{b.contact}</td>
                      <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace' }}>{bTxns.length}</td>
                      <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace' }}>{bVol.toLocaleString()} tCO2e</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Section>

          <Section title="Retirement Volume by Beneficiary">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={BENEFICIARIES.map(b => ({
                name: b.name.split(' ').slice(0, 2).join(' '),
                volume: TRANSACTIONS.filter(t => t.beneficiaryId === b.id).reduce((a, t) => a + t.quantity, 0),
                count: TRANSACTIONS.filter(t => t.beneficiaryId === b.id).length,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
                <XAxis dataKey="name" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11 }} />
                <YAxis tickFormatter={v => fmt(v)} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }} />
                <Tooltip formatter={v => typeof v === 'number' ? v.toLocaleString() : v} />
                <Bar dataKey="volume" name="Volume (tCO2e)" fill={T.teal} radius={[3, 3, 0, 0]} />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </Section>
        </>
      )}

      {/* ─── TAB 5: RETIREMENT LEDGER ─── */}
      {tab === 'Retirement Ledger' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <Kpi label="Ledger Entries" value={TRANSACTIONS.length} color={T.navy} />
            <Kpi label="Completed" value={TRANSACTIONS.filter(t => t.status === 'Completed').length} color={T.emerald} />
            <Kpi label="Pending Volume" value={`${fmt(totalPending)} tCO2e`} color={T.orange} />
            <Kpi label="Failed/Cancelled" value={TRANSACTIONS.filter(t => ['Failed', 'Cancelled'].includes(t.status)).length} color={T.red} />
          </div>

          <Section title="Full Retirement Ledger" badge="Immutable Record">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: T.navy, color: '#fff' }}>
                    {['ID', 'Project', 'Registry', 'Beneficiary', 'Qty', 'Vintage', 'Serial Start', 'Serial End', 'Price/t', 'Total Cost', 'Status', 'Date'].map(h => (
                      <th key={h} style={{ padding: '7px 8px', textAlign: 'left', fontFamily: 'JetBrains Mono, monospace', fontSize: 9, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TRANSACTIONS.map((t, i) => (
                    <tr key={t.id} style={{ background: i % 2 ? '#faf9f6' : '#fff', borderBottom: '1px solid #e5e0d8' }}>
                      <td style={{ padding: '6px 8px', fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>{t.id}</td>
                      <td style={{ padding: '6px 8px', fontWeight: 600, fontSize: 11 }}>{t.project}</td>
                      <td style={{ padding: '6px 8px' }}>{t.registry}</td>
                      <td style={{ padding: '6px 8px', fontSize: 10 }}>{t.beneficiary}</td>
                      <td style={{ padding: '6px 8px', fontFamily: 'JetBrains Mono, monospace' }}>{t.quantity.toLocaleString()}</td>
                      <td style={{ padding: '6px 8px', fontFamily: 'JetBrains Mono, monospace' }}>{t.vintage}</td>
                      <td style={{ padding: '6px 8px', fontFamily: 'JetBrains Mono, monospace', fontSize: 9 }}>{t.serial_start}</td>
                      <td style={{ padding: '6px 8px', fontFamily: 'JetBrains Mono, monospace', fontSize: 9 }}>{t.serial_end}</td>
                      <td style={{ padding: '6px 8px', fontFamily: 'JetBrains Mono, monospace' }}>${t.price_per_t}</td>
                      <td style={{ padding: '6px 8px', fontFamily: 'JetBrains Mono, monospace' }}>${t.total_cost.toLocaleString()}</td>
                      <td style={{ padding: '6px 8px' }}><Badge text={t.status} color={STATUS_COLORS[t.status]} /></td>
                      <td style={{ padding: '6px 8px', fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>{t.submitted}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="Status Distribution">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusSummary} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80}
                  label={({ status, count }) => `${status}: ${count}`}>
                  {statusSummary.map((s, i) => <Cell key={i} fill={STATUS_COLORS[s.status] || T.gray} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Section>
        </>
      )}

      {/* ─── TAB 6: COMPLIANCE MAPPING ─── */}
      {tab === 'Compliance Mapping' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <Kpi label="Compliance Frameworks" value={COMPLIANCE_FRAMEWORKS.length} color={T.navy} />
            <Kpi label="CORSIA Eligible" value={`${fmt(TRANSACTIONS.filter(t => t.compliance_map === 'CORSIA').reduce((a, t) => a + t.quantity, 0))} tCO2e`} color={T.teal} />
            <Kpi label="ETS Eligible" value={`${fmt(TRANSACTIONS.filter(t => t.compliance_map === 'EU ETS').reduce((a, t) => a + t.quantity, 0))} tCO2e`} color={T.purple} />
            <Kpi label="Voluntary" value={`${fmt(TRANSACTIONS.filter(t => t.compliance_map === 'Voluntary').reduce((a, t) => a + t.quantity, 0))} tCO2e`} color={T.emerald} />
          </div>

          <Section title="Compliance Framework Registry" badge="Regulatory">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.navy, color: '#fff' }}>
                  {['Framework', 'Scope', 'Eligible Registries', 'Unit Type', 'Status'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPLIANCE_FRAMEWORKS.map((f, i) => (
                  <tr key={f.framework} style={{ background: i % 2 ? '#faf9f6' : '#fff', borderBottom: '1px solid #e5e0d8' }}>
                    <td style={{ padding: '7px 12px', fontWeight: 700, color: T.navy }}>{f.framework}</td>
                    <td style={{ padding: '7px 12px' }}>{f.scope}</td>
                    <td style={{ padding: '7px 12px', fontSize: 11 }}>{f.eligible_registries}</td>
                    <td style={{ padding: '7px 12px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{f.unit}</td>
                    <td style={{ padding: '7px 12px' }}><Badge text={f.status} color={f.status === 'Active' ? T.emerald : f.status === 'Pilot' ? T.orange : T.purple} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Section title="Retirements by Compliance Type">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={[
                    { name: 'CORSIA', value: TRANSACTIONS.filter(t => t.compliance_map === 'CORSIA').length },
                    { name: 'EU ETS', value: TRANSACTIONS.filter(t => t.compliance_map === 'EU ETS').length },
                    { name: 'Voluntary', value: TRANSACTIONS.filter(t => t.compliance_map === 'Voluntary').length },
                  ]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    <Cell fill={T.teal} />
                    <Cell fill={T.purple} />
                    <Cell fill={T.emerald} />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Section>

            <Section title="Framework Coverage Heatmap">
              <div style={{ display: 'grid', gridTemplateColumns: 'auto repeat(4, 1fr)', gap: 2 }}>
                <div style={{ padding: 6 }} />
                {REGISTRIES.map(r => (
                  <div key={r} style={{ padding: 6, textAlign: 'center', fontSize: 10, fontWeight: 700, color: T.navy, fontFamily: 'JetBrains Mono, monospace' }}>{r}</div>
                ))}
                {COMPLIANCE_FRAMEWORKS.slice(0, 4).map((f, fi) => (
                  <React.Fragment key={f.framework}>
                    <div style={{ padding: '6px 8px', fontSize: 11, fontWeight: 600, color: T.navy }}>{f.framework}</div>
                    {REGISTRIES.map((r, ri) => {
                      const eligible = sr(fi * 7 + ri * 11) > 0.4;
                      return (
                        <div key={r} style={{
                          padding: 6, textAlign: 'center', borderRadius: 3,
                          background: eligible ? '#d1fae5' : '#fef2f2',
                          color: eligible ? T.emerald : T.red,
                          fontSize: 10, fontWeight: 700,
                        }}>
                          {eligible ? 'YES' : 'NO'}
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </Section>
          </div>
        </>
      )}

      <div style={{ marginTop: 16, padding: '10px 14px', background: '#fff', border: '1px solid #e5e0d8', borderRadius: 6, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.gray, fontFamily: 'JetBrains Mono, monospace' }}>
        <span>EP-BV1 Retirement Workflow Engine</span>
        <span>{TRANSACTIONS.length} transactions | {BENEFICIARIES.length} beneficiaries | {REGISTRIES.length} registries</span>
        <span>Sprint BV - Credit Retirement & Certificates</span>
      </div>
    </div>
  );
}
