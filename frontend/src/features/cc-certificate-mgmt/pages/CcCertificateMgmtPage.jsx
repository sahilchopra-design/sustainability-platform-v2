import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, ComposedChart
} from 'recharts';

const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const T = { navy: '#1b3a5c', gold: '#c5a96a', cream: '#f7f4ef', red: '#991b1b', green: '#065f46', gray: '#6b7280', orange: '#c2410c', teal: '#0f766e', purple: '#6d28d9', emerald: '#059669' };
const fmt = (n, d = 1) => n >= 1e9 ? `${(n / 1e9).toFixed(d)}B` : n >= 1e6 ? `${(n / 1e6).toFixed(d)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(d)}K` : `${n.toFixed(d)}`;

const CREDIT_STATUSES = ['Available', 'Reserved', 'Retired', 'Cancelled'];
const STATUS_COLORS = { Available: '#059669', Reserved: '#b45309', Retired: '#0f766e', Cancelled: '#991b1b' };
const REGISTRIES = ['Verra', 'Gold Standard', 'Puro', 'Isometric'];
const REG_COLORS = ['#0f766e', '#b45309', '#6d28d9', '#0369a1'];
const METHODOLOGIES = ['VM0015 (REDD+)', 'VM0006 (Biomass)', 'GS Cookstove', 'Puro Biochar', 'VM0042 (Blue Carbon)', 'ACM0002 (Grid RE)', 'AMS-I.E (Solar)', 'Iso CDR-001'];
const VINTAGES = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024];
const PROJECT_NAMES = [
  'Madre de Dios REDD+', 'Rimba Raya Biodiversity', 'Alto Mayo Forest', 'Kariba REDD+',
  'Kenya Biogas Programme', 'India Solar Rooftop', 'BC Forest Offset', 'Blue Carbon Senegal',
  'Soil Carbon Great Plains', 'Methane Coal Mine PL', 'Cookstove Ethiopia', 'Ghana Biomass',
  'Vietnam Mangrove', 'UK Peatland Restore', 'Acapa Wind Farm', 'Nordic Biochar',
  'Iceland DAC Pilot', 'Swiss CDR', 'Brazil Reforestation', 'Tasmania Blue Carbon',
  'Chile Wind Corridor', 'Mongolia Solar Park', 'Rwanda Clean Cook', 'Peru Agroforestry',
  'Colombia REDD+ East', 'DRC Community Forest', 'Indonesia Peat Rewet', 'Madagascar Mangrove',
  'Costa Rica Reforest', 'Philippines Tidal'
];

// 30 credits
const CREDITS = Array.from({ length: 30 }, (_, i) => {
  const qty = Math.round(5000 + sr(i * 7) * 95000);
  const statIdx = i < 12 ? 0 : i < 18 ? 1 : i < 26 ? 2 : 3;
  return {
    id: `CRD-${100000 + i * 317}`,
    serial_start: `${REGISTRIES[i % 4].slice(0, 3).toUpperCase()}-${2000000 + i * 47321}`,
    serial_end: `${REGISTRIES[i % 4].slice(0, 3).toUpperCase()}-${2000000 + i * 47321 + qty}`,
    project: PROJECT_NAMES[i],
    registry: REGISTRIES[i % 4],
    methodology: METHODOLOGIES[i % METHODOLOGIES.length],
    vintage: 2016 + Math.floor(sr(i * 11) * 9),
    quantity: qty,
    status: CREDIT_STATUSES[statIdx],
    price: +(2.5 + sr(i * 13) * 22).toFixed(2),
    batch_id: `BATCH-${String.fromCharCode(65 + (i % 8))}${Math.floor(i / 8) + 1}`,
    country: ['Peru', 'Indonesia', 'Kenya', 'India', 'Canada', 'Senegal', 'USA', 'Ghana', 'Vietnam', 'UK',
      'Mexico', 'Finland', 'Iceland', 'Switzerland', 'Brazil', 'Australia', 'Chile', 'Mongolia', 'Rwanda', 'Peru',
      'Colombia', 'DRC', 'Indonesia', 'Madagascar', 'Costa Rica', 'Philippines', 'Ethiopia', 'Norway', 'Japan', 'Fiji'][i],
    sdgs: Math.round(3 + sr(i * 17) * 10),
    beneficiary: i >= 18 ? ['Meridian Capital', 'Swiss Re AG', 'Unilever plc', 'Lufthansa Group', 'Nestle SA', 'BHP Group', 'Shell plc', 'Barclays'][i % 8] : null,
    retired_date: i >= 18 ? `2024-${String(1 + Math.floor(sr(i * 19) * 12)).padStart(2, '0')}-${String(1 + Math.floor(sr(i * 23) * 28)).padStart(2, '0')}` : null,
  };
});

// 8 batches
const BATCHES = Array.from({ length: 8 }, (_, i) => {
  const bCredits = CREDITS.filter(c => c.batch_id === `BATCH-${String.fromCharCode(65 + i)}1` || c.batch_id === `BATCH-${String.fromCharCode(65 + i)}2`);
  return {
    id: `BATCH-${String.fromCharCode(65 + i)}`,
    registry: REGISTRIES[i % 4],
    project_count: Math.round(2 + sr(i * 7) * 5),
    total_credits: bCredits.reduce((a, c) => a + c.quantity, 0) || Math.round(50000 + sr(i * 11) * 200000),
    avg_vintage: Math.round(2019 + sr(i * 13) * 4),
    status: i < 5 ? 'Active' : i < 7 ? 'Pending Transfer' : 'Archived',
    created: `2024-${String(1 + Math.floor(sr(i * 17) * 11)).padStart(2, '0')}-${String(1 + Math.floor(sr(i * 19) * 28)).padStart(2, '0')}`,
    value: 0,
  };
});
BATCHES.forEach(b => { b.value = +(b.total_credits * (5 + sr(BATCHES.indexOf(b) * 7) * 12)).toFixed(2); });

// Transfer log
const TRANSFERS = Array.from({ length: 12 }, (_, i) => ({
  id: `TXF-${300000 + i * 211}`,
  credit_id: CREDITS[i % 30].id,
  from: ['Internal Treasury', 'Verra Registry', 'Broker A', 'Client Holding'][i % 4],
  to: ['Client Holding', 'Retirement Account', 'Internal Treasury', 'Broker B'][i % 4],
  quantity: Math.round(2000 + sr(i * 7) * 30000),
  date: `2024-${String(1 + Math.floor(sr(i * 11) * 12)).padStart(2, '0')}-${String(1 + Math.floor(sr(i * 13) * 28)).padStart(2, '0')}`,
  status: i < 9 ? 'Completed' : 'Pending',
  custody_chain: `${Math.round(2 + sr(i * 17) * 4)} hops`,
}));

// Audit trail
const AUDIT_ENTRIES = Array.from({ length: 15 }, (_, i) => ({
  id: `AUD-${400000 + i * 137}`,
  timestamp: `2024-${String(1 + Math.floor(sr(i * 7) * 12)).padStart(2, '0')}-${String(1 + Math.floor(sr(i * 11) * 28)).padStart(2, '0')} ${String(8 + Math.floor(sr(i * 13) * 10)).padStart(2, '0')}:${String(Math.floor(sr(i * 17) * 59)).padStart(2, '0')}`,
  action: ['Credit Issued', 'Batch Created', 'Transfer Initiated', 'Retirement Requested', 'Certificate Generated',
    'Status Updated', 'Serial Range Assigned', 'Quality Score Updated', 'Beneficiary Linked', 'Registry Sync',
    'Credit Issued', 'Batch Merged', 'Transfer Completed', 'Certificate Revoked', 'Audit Flagged'][i],
  entity: CREDITS[i % 30].id,
  user: ['system', 'j.morrison', 'k.bauer', 'p.singh', 'admin'][i % 5],
  details: `${['Created', 'Updated', 'Verified', 'Approved', 'Flagged'][i % 5]} ${CREDITS[i % 30].project.slice(0, 20)}`,
}));

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

export default function CcCertificateMgmtPage() {
  const [tab, setTab] = useState('Credit Inventory');
  const [statusFilter, setStatusFilter] = useState('All');
  const [registryFilter, setRegistryFilter] = useState('All');
  const [vintageMin, setVintageMin] = useState(2016);
  const [selectedCert, setSelectedCert] = useState(null);

  const TABS = ['Credit Inventory', 'Certificate Generator', 'Batch Management', 'Transfer & Custody', 'Vintage Analysis', 'Audit Trail'];

  const filtered = useMemo(() => CREDITS.filter(c =>
    (statusFilter === 'All' || c.status === statusFilter) &&
    (registryFilter === 'All' || c.registry === registryFilter) &&
    c.vintage >= vintageMin
  ), [statusFilter, registryFilter, vintageMin]);

  const totalAvailable = useMemo(() => CREDITS.filter(c => c.status === 'Available').reduce((a, c) => a + c.quantity, 0), []);
  const totalReserved = useMemo(() => CREDITS.filter(c => c.status === 'Reserved').reduce((a, c) => a + c.quantity, 0), []);
  const totalRetired = useMemo(() => CREDITS.filter(c => c.status === 'Retired').reduce((a, c) => a + c.quantity, 0), []);
  const totalValue = useMemo(() => CREDITS.reduce((a, c) => a + c.quantity * c.price, 0), []);

  const vintageData = useMemo(() => VINTAGES.map((yr, i) => {
    const yrCredits = CREDITS.filter(c => c.vintage === yr);
    return {
      year: yr,
      available: yrCredits.filter(c => c.status === 'Available').reduce((a, c) => a + c.quantity, 0),
      reserved: yrCredits.filter(c => c.status === 'Reserved').reduce((a, c) => a + c.quantity, 0),
      retired: yrCredits.filter(c => c.status === 'Retired').reduce((a, c) => a + c.quantity, 0),
      cancelled: yrCredits.filter(c => c.status === 'Cancelled').reduce((a, c) => a + c.quantity, 0),
      avg_price: yrCredits.length > 0 ? +(yrCredits.reduce((a, c) => a + c.price, 0) / yrCredits.length).toFixed(2) : 0,
      count: yrCredits.length,
    };
  }), []);

  const agingAnalysis = useMemo(() => VINTAGES.map((yr, i) => {
    const age = 2024 - yr;
    const yrCredits = CREDITS.filter(c => c.vintage === yr && c.status === 'Available');
    return {
      vintage: yr,
      age_years: age,
      unsold_qty: yrCredits.reduce((a, c) => a + c.quantity, 0),
      avg_price: yrCredits.length > 0 ? +(yrCredits.reduce((a, c) => a + c.price, 0) / yrCredits.length).toFixed(2) : 0,
      risk: age > 5 ? 'High' : age > 3 ? 'Medium' : 'Low',
    };
  }), []);

  const inventoryByRegistry = useMemo(() => REGISTRIES.map((r, i) => ({
    registry: r,
    available: CREDITS.filter(c => c.registry === r && c.status === 'Available').reduce((a, c) => a + c.quantity, 0),
    reserved: CREDITS.filter(c => c.registry === r && c.status === 'Reserved').reduce((a, c) => a + c.quantity, 0),
    retired: CREDITS.filter(c => c.registry === r && c.status === 'Retired').reduce((a, c) => a + c.quantity, 0),
  })), []);

  return (
    <div style={{ padding: 24, background: T.cream, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: T.gray, background: '#e9e4db', padding: '3px 8px', borderRadius: 4 }}>EP-BV2</span>
          <span style={{ fontSize: 11, color: T.teal, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>CARBON CREDITS . CERTIFICATES</span>
        </div>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: T.navy }}>Certificate & Inventory Management</h1>
        <p style={{ margin: '4px 0 0', color: T.gray, fontSize: 13 }}>Credit inventory . Certificate generation . Batch management . Transfer custody . Vintage analysis . Audit trail</p>
      </div>

      <TabBar tabs={TABS} active={tab} onSelect={setTab} />

      {/* ─── TAB 1: CREDIT INVENTORY ─── */}
      {tab === 'Credit Inventory' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <Kpi label="Available Credits" value={`${fmt(totalAvailable)} tCO2e`} sub={`${CREDITS.filter(c => c.status === 'Available').length} batches`} color={T.emerald} />
            <Kpi label="Reserved" value={`${fmt(totalReserved)} tCO2e`} sub="Pending retirement" color={T.orange} />
            <Kpi label="Retired" value={`${fmt(totalRetired)} tCO2e`} sub="Permanently cancelled" color={T.teal} />
            <Kpi label="Portfolio Value" value={`$${fmt(totalValue)}`} sub="Mark-to-market" color={T.gold} />
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              style={{ padding: '5px 10px', border: '1px solid #d1ccc2', borderRadius: 4, fontSize: 12, fontFamily: 'DM Sans, sans-serif' }}>
              <option value="All">All Statuses</option>
              {CREDIT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={registryFilter} onChange={e => setRegistryFilter(e.target.value)}
              style={{ padding: '5px 10px', border: '1px solid #d1ccc2', borderRadius: 4, fontSize: 12, fontFamily: 'DM Sans, sans-serif' }}>
              <option value="All">All Registries</option>
              {REGISTRIES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <DualInput label="Min Vintage:" value={vintageMin} onChange={setVintageMin} min={2016} max={2024} />
          </div>

          <Section title="Credit Inventory" badge={`${filtered.length} credits`}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: T.navy, color: '#fff' }}>
                    {['ID', 'Serial Range', 'Project', 'Registry', 'Methodology', 'Vintage', 'Qty', 'Price/t', 'Status'].map(h => (
                      <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontFamily: 'JetBrains Mono, monospace', fontSize: 9, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, i) => (
                    <tr key={c.id} style={{ background: i % 2 ? '#faf9f6' : '#fff', borderBottom: '1px solid #e5e0d8', cursor: 'pointer' }}
                      onClick={() => setSelectedCert(c)}>
                      <td style={{ padding: '6px 10px', fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>{c.id}</td>
                      <td style={{ padding: '6px 10px', fontFamily: 'JetBrains Mono, monospace', fontSize: 9 }}>{c.serial_start}...{c.serial_end.split('-').pop()}</td>
                      <td style={{ padding: '6px 10px', fontWeight: 600 }}>{c.project}</td>
                      <td style={{ padding: '6px 10px' }}>{c.registry}</td>
                      <td style={{ padding: '6px 10px', fontSize: 10 }}>{c.methodology}</td>
                      <td style={{ padding: '6px 10px', fontFamily: 'JetBrains Mono, monospace' }}>{c.vintage}</td>
                      <td style={{ padding: '6px 10px', fontFamily: 'JetBrains Mono, monospace' }}>{c.quantity.toLocaleString()}</td>
                      <td style={{ padding: '6px 10px', fontFamily: 'JetBrains Mono, monospace' }}>${c.price}</td>
                      <td style={{ padding: '6px 10px' }}><Badge text={c.status} color={STATUS_COLORS[c.status]} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="Inventory by Registry">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={inventoryByRegistry}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
                <XAxis dataKey="registry" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11 }} />
                <YAxis tickFormatter={v => fmt(v)} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }} />
                <Tooltip formatter={v => `${fmt(v)} tCO2e`} />
                <Bar dataKey="available" name="Available" stackId="a" fill={T.emerald} />
                <Bar dataKey="reserved" name="Reserved" stackId="a" fill={T.orange} />
                <Bar dataKey="retired" name="Retired" stackId="a" fill={T.teal} radius={[3, 3, 0, 0]} />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </Section>
        </>
      )}

      {/* ─── TAB 2: CERTIFICATE GENERATOR ─── */}
      {tab === 'Certificate Generator' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <Kpi label="Certificates Issued" value={CREDITS.filter(c => c.status === 'Retired').length} color={T.teal} />
            <Kpi label="Pending Generation" value={CREDITS.filter(c => c.status === 'Reserved').length} color={T.orange} />
            <Kpi label="Total Certified Volume" value={`${fmt(totalRetired)} tCO2e`} color={T.emerald} />
          </div>

          {selectedCert ? (
            <Section title="Certificate Preview" badge="DRAFT">
              <div style={{ border: '2px solid #e5e0d8', borderRadius: 12, padding: 24, background: '#fefdfb', maxWidth: 640 }}>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <div style={{ fontSize: 10, color: T.teal, fontFamily: 'JetBrains Mono, monospace', letterSpacing: 2, marginBottom: 4 }}>CARBON CREDIT RETIREMENT CERTIFICATE</div>
                  <div style={{ width: 60, height: 3, background: T.gold, margin: '0 auto 12px' }} />
                  <div style={{ fontSize: 18, fontWeight: 800, color: T.navy }}>{selectedCert.project}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12 }}>
                  <div><span style={{ color: T.gray }}>Certificate ID:</span> <strong style={{ fontFamily: 'JetBrains Mono, monospace' }}>{selectedCert.id}</strong></div>
                  <div><span style={{ color: T.gray }}>Registry:</span> <strong>{selectedCert.registry}</strong></div>
                  <div><span style={{ color: T.gray }}>Methodology:</span> <strong style={{ fontSize: 11 }}>{selectedCert.methodology}</strong></div>
                  <div><span style={{ color: T.gray }}>Vintage:</span> <strong style={{ fontFamily: 'JetBrains Mono, monospace' }}>{selectedCert.vintage}</strong></div>
                  <div><span style={{ color: T.gray }}>Quantity:</span> <strong style={{ fontFamily: 'JetBrains Mono, monospace' }}>{selectedCert.quantity.toLocaleString()} tCO2e</strong></div>
                  <div><span style={{ color: T.gray }}>Country:</span> <strong>{selectedCert.country}</strong></div>
                  <div><span style={{ color: T.gray }}>Serial Start:</span> <strong style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>{selectedCert.serial_start}</strong></div>
                  <div><span style={{ color: T.gray }}>Serial End:</span> <strong style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>{selectedCert.serial_end}</strong></div>
                  <div><span style={{ color: T.gray }}>Beneficiary:</span> <strong>{selectedCert.beneficiary || 'Unassigned'}</strong></div>
                  <div><span style={{ color: T.gray }}>SDG Alignment:</span> <strong>{selectedCert.sdgs} SDGs</strong></div>
                  {selectedCert.retired_date && <div><span style={{ color: T.gray }}>Retired Date:</span> <strong style={{ fontFamily: 'JetBrains Mono, monospace' }}>{selectedCert.retired_date}</strong></div>}
                  <div><span style={{ color: T.gray }}>Status:</span> <Badge text={selectedCert.status} color={STATUS_COLORS[selectedCert.status]} /></div>
                </div>
                <div style={{ textAlign: 'center', marginTop: 20 }}>
                  <div style={{ width: 60, height: 3, background: T.gold, margin: '0 auto 8px' }} />
                  <div style={{ fontSize: 9, color: T.gray, fontFamily: 'JetBrains Mono, monospace' }}>Verified by {selectedCert.registry} Registry | Hash: 0x{Array.from({length:8},(_,j)=>Math.floor(sr(j*7+parseInt(selectedCert.id.slice(-3)))*16).toString(16)).join('')}</div>
                </div>
              </div>
              <button onClick={() => setSelectedCert(null)} style={{ marginTop: 12, padding: '6px 14px', background: T.navy, color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>
                Close Preview
              </button>
            </Section>
          ) : (
            <Section title="Select a Credit to Generate Certificate">
              <p style={{ color: T.gray, fontSize: 12 }}>Click any row in the inventory table to preview a certificate. Switch to the Credit Inventory tab to browse credits, or select from retired credits below.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 12 }}>
                {CREDITS.filter(c => c.status === 'Retired').slice(0, 6).map(c => (
                  <div key={c.id} onClick={() => setSelectedCert(c)}
                    style={{ border: '1px solid #e5e0d8', borderRadius: 8, padding: 14, cursor: 'pointer', background: '#fff' }}>
                    <div style={{ fontWeight: 700, fontSize: 12, color: T.navy }}>{c.project}</div>
                    <div style={{ fontSize: 11, color: T.gray, marginTop: 4 }}>{c.registry} | {c.vintage} | {c.quantity.toLocaleString()} tCO2e</div>
                    <div style={{ fontSize: 10, color: T.teal, marginTop: 2, fontFamily: 'JetBrains Mono, monospace' }}>{c.id}</div>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </>
      )}

      {/* ─── TAB 3: BATCH MANAGEMENT ─── */}
      {tab === 'Batch Management' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <Kpi label="Active Batches" value={BATCHES.filter(b => b.status === 'Active').length} color={T.emerald} />
            <Kpi label="Pending Transfer" value={BATCHES.filter(b => b.status === 'Pending Transfer').length} color={T.orange} />
            <Kpi label="Total Batch Volume" value={`${fmt(BATCHES.reduce((a, b) => a + b.total_credits, 0))} tCO2e`} color={T.navy} />
            <Kpi label="Batch Value" value={`$${fmt(BATCHES.reduce((a, b) => a + b.value, 0))}`} color={T.gold} />
          </div>

          <Section title="Batch Registry" badge={`${BATCHES.length} batches`}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.navy, color: '#fff' }}>
                  {['Batch ID', 'Registry', 'Projects', 'Total Credits', 'Avg Vintage', 'Value', 'Status', 'Created'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {BATCHES.map((b, i) => (
                  <tr key={b.id} style={{ background: i % 2 ? '#faf9f6' : '#fff', borderBottom: '1px solid #e5e0d8' }}>
                    <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 11 }}>{b.id}</td>
                    <td style={{ padding: '7px 10px' }}>{b.registry}</td>
                    <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace' }}>{b.project_count}</td>
                    <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace' }}>{b.total_credits.toLocaleString()}</td>
                    <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace' }}>{b.avg_vintage}</td>
                    <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace' }}>${fmt(b.value)}</td>
                    <td style={{ padding: '7px 10px' }}><Badge text={b.status} color={b.status === 'Active' ? T.emerald : b.status === 'Pending Transfer' ? T.orange : T.gray} /></td>
                    <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{b.created}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Section title="Batch Volume by Registry">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={BATCHES}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
                <XAxis dataKey="id" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }} />
                <YAxis tickFormatter={v => fmt(v)} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }} />
                <Tooltip formatter={v => typeof v === 'number' ? v.toLocaleString() : v} />
                <Bar dataKey="total_credits" name="Credits" fill={T.teal} radius={[3, 3, 0, 0]}>
                  {BATCHES.map((b, i) => <Cell key={i} fill={REG_COLORS[REGISTRIES.indexOf(b.registry)] || T.teal} />)}
                </Bar>
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </Section>
        </>
      )}

      {/* ─── TAB 4: TRANSFER & CUSTODY ─── */}
      {tab === 'Transfer & Custody' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <Kpi label="Completed Transfers" value={TRANSFERS.filter(t => t.status === 'Completed').length} color={T.emerald} />
            <Kpi label="Pending" value={TRANSFERS.filter(t => t.status === 'Pending').length} color={T.orange} />
            <Kpi label="Volume Transferred" value={`${fmt(TRANSFERS.reduce((a, t) => a + t.quantity, 0))} tCO2e`} color={T.navy} />
          </div>

          <Section title="Transfer Log" badge="Chain of Custody">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.navy, color: '#fff' }}>
                  {['Transfer ID', 'Credit ID', 'From', 'To', 'Quantity', 'Date', 'Custody Chain', 'Status'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TRANSFERS.map((t, i) => (
                  <tr key={t.id} style={{ background: i % 2 ? '#faf9f6' : '#fff', borderBottom: '1px solid #e5e0d8' }}>
                    <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{t.id}</td>
                    <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>{t.credit_id}</td>
                    <td style={{ padding: '7px 10px' }}>{t.from}</td>
                    <td style={{ padding: '7px 10px' }}>{t.to}</td>
                    <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace' }}>{t.quantity.toLocaleString()}</td>
                    <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{t.date}</td>
                    <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>{t.custody_chain}</td>
                    <td style={{ padding: '7px 10px' }}><Badge text={t.status} color={t.status === 'Completed' ? T.emerald : T.orange} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Section title="Transfer Flow by Account Type">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={[
                { account: 'Internal Treasury', inbound: Math.round(80000 + sr(1) * 120000), outbound: Math.round(60000 + sr(2) * 100000) },
                { account: 'Client Holding', inbound: Math.round(60000 + sr(3) * 90000), outbound: Math.round(40000 + sr(4) * 70000) },
                { account: 'Retirement Acct', inbound: Math.round(40000 + sr(5) * 60000), outbound: 0 },
                { account: 'Registry Direct', inbound: Math.round(30000 + sr(6) * 50000), outbound: Math.round(20000 + sr(7) * 40000) },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
                <XAxis dataKey="account" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11 }} />
                <YAxis tickFormatter={v => fmt(v)} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }} />
                <Tooltip formatter={v => `${v.toLocaleString()} tCO2e`} />
                <Bar dataKey="inbound" name="Inbound" fill={T.emerald} radius={[3, 3, 0, 0]} />
                <Bar dataKey="outbound" name="Outbound" fill={T.orange} radius={[3, 3, 0, 0]} />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </Section>
        </>
      )}

      {/* ─── TAB 5: VINTAGE ANALYSIS ─── */}
      {tab === 'Vintage Analysis' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <Kpi label="Oldest Vintage" value="2016" sub="8 years aged" color={T.red} />
            <Kpi label="Newest Vintage" value="2024" sub="Current year" color={T.emerald} />
            <Kpi label="Avg Vintage Age" value="3.8 yrs" color={T.navy} />
            <Kpi label="Avg Price Spread" value={`$${(CREDITS.reduce((a, c) => a + c.price, 0) / CREDITS.length).toFixed(2)}/t`} color={T.gold} />
          </div>

          <Section title="Credits by Vintage Year (Stacked)" badge="tCO2e + Price">
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={vintageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
                <XAxis dataKey="year" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                <YAxis yAxisId="l" tickFormatter={v => fmt(v)} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }} />
                <YAxis yAxisId="r" orientation="right" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }} />
                <Tooltip formatter={(v, n) => n === 'avg_price' ? `$${v}` : `${fmt(v)} tCO2e`} />
                <Bar yAxisId="l" dataKey="available" name="Available" stackId="s" fill={T.emerald} />
                <Bar yAxisId="l" dataKey="reserved" name="Reserved" stackId="s" fill={T.orange} />
                <Bar yAxisId="l" dataKey="retired" name="Retired" stackId="s" fill={T.teal} />
                <Bar yAxisId="l" dataKey="cancelled" name="Cancelled" stackId="s" fill={T.red} radius={[3, 3, 0, 0]} />
                <Line yAxisId="r" type="monotone" dataKey="avg_price" name="Avg Price ($/t)" stroke={T.gold} strokeWidth={2} dot={{ r: 4 }} />
                <Legend />
              </ComposedChart>
            </ResponsiveContainer>
          </Section>

          <Section title="Aging Analysis" badge="Unsold Inventory Risk">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.navy, color: '#fff' }}>
                  {['Vintage', 'Age (Years)', 'Unsold Qty', 'Avg Price', 'Risk Level'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {agingAnalysis.map((a, i) => (
                  <tr key={a.vintage} style={{ background: i % 2 ? '#faf9f6' : '#fff', borderBottom: '1px solid #e5e0d8' }}>
                    <td style={{ padding: '7px 12px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>{a.vintage}</td>
                    <td style={{ padding: '7px 12px', fontFamily: 'JetBrains Mono, monospace' }}>{a.age_years}</td>
                    <td style={{ padding: '7px 12px', fontFamily: 'JetBrains Mono, monospace' }}>{a.unsold_qty.toLocaleString()}</td>
                    <td style={{ padding: '7px 12px', fontFamily: 'JetBrains Mono, monospace' }}>${a.avg_price}</td>
                    <td style={{ padding: '7px 12px' }}>
                      <Badge text={a.risk} color={a.risk === 'High' ? T.red : a.risk === 'Medium' ? T.orange : T.emerald} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Section title="Price by Vintage">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={vintageData.filter(v => v.avg_price > 0)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
                <XAxis dataKey="year" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                <YAxis style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }} />
                <Tooltip formatter={v => `$${v}/t`} />
                <Bar dataKey="avg_price" name="Avg Price ($/t)" fill={T.gold} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Section>
        </>
      )}

      {/* ─── TAB 6: AUDIT TRAIL ─── */}
      {tab === 'Audit Trail' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <Kpi label="Audit Entries" value={AUDIT_ENTRIES.length} color={T.navy} />
            <Kpi label="System Actions" value={AUDIT_ENTRIES.filter(a => a.user === 'system').length} color={T.teal} />
            <Kpi label="User Actions" value={AUDIT_ENTRIES.filter(a => a.user !== 'system').length} color={T.gold} />
            <Kpi label="Flagged" value={AUDIT_ENTRIES.filter(a => a.action.includes('Flagged') || a.action.includes('Revoked')).length} color={T.red} />
          </div>

          <Section title="Immutable Audit Log" badge="Tamper-proof">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.navy, color: '#fff' }}>
                  {['Audit ID', 'Timestamp', 'Action', 'Entity', 'User', 'Details'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {AUDIT_ENTRIES.map((a, i) => (
                  <tr key={a.id} style={{ background: a.action.includes('Flagged') || a.action.includes('Revoked') ? '#fef2f2' : i % 2 ? '#faf9f6' : '#fff', borderBottom: '1px solid #e5e0d8' }}>
                    <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>{a.id}</td>
                    <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>{a.timestamp}</td>
                    <td style={{ padding: '7px 10px', fontWeight: 600 }}>{a.action}</td>
                    <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>{a.entity}</td>
                    <td style={{ padding: '7px 10px' }}>{a.user}</td>
                    <td style={{ padding: '7px 10px', fontSize: 11, color: T.gray }}>{a.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Section title="Activity by Action Type">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={(() => {
                const counts = {};
                AUDIT_ENTRIES.forEach(a => { counts[a.action] = (counts[a.action] || 0) + 1; });
                return Object.entries(counts).map(([action, count]) => ({ action: action.length > 18 ? action.slice(0, 16) + '..' : action, count }));
              })()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
                <XAxis dataKey="action" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 9 }} angle={-30} textAnchor="end" height={60} />
                <YAxis style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" name="Occurrences" fill={T.navy} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Section>
        </>
      )}

      <div style={{ marginTop: 16, padding: '10px 14px', background: '#fff', border: '1px solid #e5e0d8', borderRadius: 6, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.gray, fontFamily: 'JetBrains Mono, monospace' }}>
        <span>EP-BV2 Certificate & Inventory Management</span>
        <span>{CREDITS.length} credits | {BATCHES.length} batches | Vintages {VINTAGES[0]}-{VINTAGES[VINTAGES.length - 1]}</span>
        <span>Sprint BV - Credit Retirement & Certificates</span>
      </div>
    </div>
  );
}
