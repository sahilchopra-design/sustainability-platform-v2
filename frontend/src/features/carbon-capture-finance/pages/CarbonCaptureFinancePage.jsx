import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, LineChart, Line, Legend, Cell,
} from 'recharts';

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f6f4f0',
  navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f',
  teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c',
  surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace',
};

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const TYPES = ['Point Source CCS', 'BECCS', 'DAC', 'Mineralisation'];
const CCS_COUNTRIES = ['USA', 'Norway', 'UK', 'Australia', 'Canada', 'Netherlands', 'Germany', 'Saudi Arabia', 'Japan'];
const STATUSES = ['Operating', 'Construction', 'Development', 'Concept'];
const STORAGE_TYPES = ['Geological', 'Ocean', 'Mineral'];

const TYPE_COLORS = [T.blue, T.green, T.indigo, T.teal];
const STATUS_COLORS = { Operating: T.green, Construction: T.blue, Development: T.amber, Concept: T.textSec };

const PROJECTS = Array.from({ length: 40 }, (_, i) => {
  const type = TYPES[Math.floor(sr(i * 7) * TYPES.length)];
  const country = CCS_COUNTRIES[Math.floor(sr(i * 11) * CCS_COUNTRIES.length)];
  const captureCapacity = parseFloat((0.05 + sr(i * 13) * 4.95).toFixed(2));
  const capex = parseFloat((0.1 + sr(i * 17) * 9.9).toFixed(2));
  const opexBase = { 'Point Source CCS': 50, BECCS: 80, DAC: 350, Mineralisation: 120 }[type];
  const opex = Math.round(opexBase * (0.7 + sr(i * 19) * 0.6));
  const tax45Q = ['USA'].includes(country) && sr(i * 23) > 0.3;
  const storageType = STORAGE_TYPES[Math.floor(sr(i * 29) * STORAGE_TYPES.length)];
  const status = STATUSES[Math.floor(sr(i * 31) * STATUSES.length)];
  const netzeroContribution = parseFloat((1 + sr(i * 37) * 99).toFixed(1));
  const projectIrr = Math.round(type === 'DAC' ? 2 + sr(i * 41) * 8 : 5 + sr(i * 41) * 20);
  const names = ['Sleipner', 'Quest CCS', 'Boundary Dam', 'SaskPower', 'Northern Lights', 'Orca DAC', 'Mammoth DAC',
    'Porthos', 'Hynet', 'Acorn CCS', 'Tomakomai', 'CarbonSafe', 'Summit AG', 'Tallgrass', 'Wolf Mid'];
  const name = `${names[i % names.length]} ${['I', 'II', 'III', 'Phase 1', 'Phase 2', 'A', 'B'][Math.floor(sr(i * 53) * 7)]}`;
  return { id: i + 1, name, type, country, captureCapacity, capex, opex, tax45Q, storageType, status, netzeroContribution, projectIrr };
});

const COST_LEARNING = [2020, 2022, 2024, 2026, 2028, 2030].map((yr, i) => ({
  year: yr,
  dac: Math.round(1000 - i * 110 + sr(i * 17) * 40),
  beccs: Math.round(150 - i * 12 + sr(i * 23) * 15),
  pointSource: Math.round(80 - i * 5 + sr(i * 29) * 8),
}));

const TABS = [
  'Project Overview', 'Technology Comparison', 'Cost Curves', 'Storage Analytics',
  'Policy (45Q)', 'Net Zero Contribution', 'Risk Assessment', 'Investment Case',
];

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '18px 22px', flex: 1, minWidth: 180 }}>
    <div style={{ fontSize: 12, color: T.textSec, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 800, color: color || T.navy, fontFamily: T.fontMono }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>{sub}</div>}
  </div>
);

export default function CarbonCaptureFinancePage() {
  const [tab, setTab] = useState(0);
  const [typeFilter, setTypeFilter] = useState('All');
  const [countryFilter, setCountryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [carbonPrice, setCarbonPrice] = useState(100);
  const [creditVal45Q, setCreditVal45Q] = useState(85);

  const filtered = useMemo(() => PROJECTS.filter(p =>
    (typeFilter === 'All' || p.type === typeFilter) &&
    (countryFilter === 'All' || p.country === countryFilter) &&
    (statusFilter === 'All' || p.status === statusFilter)
  ), [typeFilter, countryFilter, statusFilter]);

  const totalCapture = filtered.reduce((s, p) => s + p.captureCapacity, 0).toFixed(2);
  const avgCost = filtered.length ? (filtered.reduce((s, p) => s + p.opex, 0) / filtered.length).toFixed(0) : '0';
  const totalCapex = filtered.reduce((s, p) => s + p.capex, 0).toFixed(1);
  const pctOperating = filtered.length ? ((filtered.filter(p => p.status === 'Operating').length / filtered.length) * 100).toFixed(0) : '0';

  const typeCapture = TYPES.map((t, ti) => ({
    type: t,
    capacity: filtered.filter(p => p.type === t).reduce((s, p) => s + p.captureCapacity, 0).toFixed(2),
    count: filtered.filter(p => p.type === t).length,
    avgOpex: (() => { const a = filtered.filter(p => p.type === t); return a.length ? Math.round(a.reduce((s, p) => s + p.opex, 0) / a.length) : 0; })(),
  }));

  const storageData = STORAGE_TYPES.map(st => ({
    storage: st,
    count: filtered.filter(p => p.storageType === st).length,
    capacity: parseFloat(filtered.filter(p => p.storageType === st).reduce((s, p) => s + p.captureCapacity, 0).toFixed(2)),
  }));

  const nzData = [...filtered].sort((a, b) => b.netzeroContribution - a.netzeroContribution).slice(0, 12);

  const riskData = TYPES.map((t, ti) => ({
    type: t,
    techRisk: Math.round(20 + sr(ti * 17) * 60),
    marketRisk: Math.round(15 + sr(ti * 23) * 55),
    regRisk: Math.round(10 + sr(ti * 29) * 50),
  }));

  // Adjusted IRR with carbon price
  const adjIrrData = filtered.slice(0, 12).map(p => ({
    name: p.name.split(' ')[0],
    baseIrr: p.projectIrr,
    adjIrr: Math.min(35, p.projectIrr + (carbonPrice - 100) * 0.05 + (p.tax45Q ? (creditVal45Q - 85) * 0.03 : 0)),
  }));

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, system-ui, sans-serif', padding: '28px 32px' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: T.navy }}>⚡ Carbon Capture Finance</span>
          <span style={{ fontSize: 11, background: T.teal, color: '#fff', borderRadius: 4, padding: '2px 8px', fontWeight: 700 }}>EP-DF3</span>
        </div>
        <div style={{ fontSize: 13, color: T.textSec }}>40 CCS/BECCS/DAC projects · Cost curves, storage analytics, 45Q policy & net zero contribution</div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20, background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 18px' }}>
        {[
          { label: 'Type', value: typeFilter, setter: setTypeFilter, opts: ['All', ...TYPES] },
          { label: 'Country', value: countryFilter, setter: setCountryFilter, opts: ['All', ...CCS_COUNTRIES] },
          { label: 'Status', value: statusFilter, setter: setStatusFilter, opts: ['All', ...STATUSES] },
        ].map(({ label, value, setter, opts }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: T.textSec, fontWeight: 600 }}>{label}</span>
            <select value={value} onChange={e => setter(e.target.value)}
              style={{ fontSize: 12, border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 8px', background: T.bg, color: T.textPri }}>
              {opts.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: T.textSec, fontWeight: 600 }}>Carbon: ${carbonPrice}/tCO₂</span>
          <input type="range" min={0} max={250} value={carbonPrice} onChange={e => setCarbonPrice(+e.target.value)} style={{ width: 100 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: T.textSec, fontWeight: 600 }}>45Q: ${creditVal45Q}/tCO₂</span>
          <input type="range" min={50} max={180} value={creditVal45Q} onChange={e => setCreditVal45Q(+e.target.value)} style={{ width: 100 }} />
        </div>
        <span style={{ fontSize: 12, color: T.textSec, alignSelf: 'center' }}>{filtered.length} projects</span>
      </div>

      {/* KPIs */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 22, flexWrap: 'wrap' }}>
        <KpiCard label="Total Capture Capacity" value={`${totalCapture} MtCO₂/yr`} sub="filtered projects" color={T.teal} />
        <KpiCard label="Avg Opex" value={`$${avgCost}/tCO₂`} sub="operating cost per tonne" color={T.blue} />
        <KpiCard label="Total Capex" value={`$${totalCapex}Bn`} sub="capital expenditure" color={T.indigo} />
        <KpiCard label="Operational" value={`${pctOperating}%`} sub="of filtered projects" color={T.green} />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            style={{ padding: '7px 14px', borderRadius: 7, border: `1px solid ${tab === i ? T.teal : T.border}`, background: tab === i ? T.teal : T.card, color: tab === i ? '#fff' : T.textSec, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            {t}
          </button>
        ))}
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24 }}>
        {tab === 0 && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Project Overview</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Project', 'Type', 'Country', 'Capture (MtCO₂/yr)', 'Capex ($Bn)', 'Opex ($/tCO₂)', 'Storage', 'Status', '45Q', 'Net Zero %'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.textSec, fontWeight: 700, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 18).map((p, i) => (
                  <tr key={p.id} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                    <td style={{ padding: '7px 10px', color: T.navy, fontWeight: 600 }}>{p.name}</td>
                    <td style={{ padding: '7px 10px' }}><span style={{ background: TYPE_COLORS[TYPES.indexOf(p.type)] + '22', color: TYPE_COLORS[TYPES.indexOf(p.type)], borderRadius: 4, padding: '2px 6px', fontSize: 10, fontWeight: 700 }}>{p.type}</span></td>
                    <td style={{ padding: '7px 10px', color: T.textSec }}>{p.country}</td>
                    <td style={{ padding: '7px 10px', fontFamily: T.fontMono, color: T.teal }}>{p.captureCapacity}</td>
                    <td style={{ padding: '7px 10px', fontFamily: T.fontMono }}>${p.capex}</td>
                    <td style={{ padding: '7px 10px', fontFamily: T.fontMono, color: p.opex > 200 ? T.red : p.opex > 100 ? T.amber : T.green }}>${p.opex}</td>
                    <td style={{ padding: '7px 10px', color: T.textSec }}>{p.storageType}</td>
                    <td style={{ padding: '7px 10px' }}><span style={{ color: STATUS_COLORS[p.status], fontWeight: 600, fontSize: 11 }}>{p.status}</span></td>
                    <td style={{ padding: '7px 10px', color: p.tax45Q ? T.green : T.textSec, fontWeight: p.tax45Q ? 700 : 400 }}>{p.tax45Q ? '✓' : '–'}</td>
                    <td style={{ padding: '7px 10px', fontFamily: T.fontMono, color: T.blue }}>{p.netzeroContribution}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 1 && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Technology Comparison — Capture Capacity & Avg Opex by Type</div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={typeCapture} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="type" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip />
                <Bar yAxisId="left" dataKey="capacity" name="Capacity (MtCO₂/yr)" radius={[4, 4, 0, 0]}>
                  {typeCapture.map((_, idx) => <Cell key={idx} fill={TYPE_COLORS[idx % TYPE_COLORS.length]} />)}
                </Bar>
                <Bar yAxisId="right" dataKey="avgOpex" name="Avg Opex ($/tCO₂)" fill={T.amber} radius={[4, 4, 0, 0]} />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 2 && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Cost Learning Curves (2020–2030)</div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={COST_LEARNING} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec }} label={{ value: '$/tCO₂', angle: -90, position: 'insideLeft', fontSize: 11, fill: T.textSec }} />
                <Tooltip formatter={(v) => [`$${v}/tCO₂`]} />
                <Line type="monotone" dataKey="dac" name="DAC" stroke={T.indigo} strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="beccs" name="BECCS" stroke={T.green} strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="pointSource" name="Point Source CCS" stroke={T.blue} strokeWidth={2} dot={{ r: 3 }} />
                <Legend />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 3 && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Storage Analytics — Projects by Storage Type</div>
            <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
              {storageData.map((sd, i) => (
                <div key={sd.storage} style={{ flex: 1, background: TYPE_COLORS[i % TYPE_COLORS.length] + '18', border: `1px solid ${TYPE_COLORS[i % TYPE_COLORS.length]}44`, borderRadius: 10, padding: '18px 20px' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: TYPE_COLORS[i % TYPE_COLORS.length] }}>{sd.storage}</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: TYPE_COLORS[i % TYPE_COLORS.length], fontFamily: T.fontMono }}>{sd.count}</div>
                  <div style={{ fontSize: 11, color: T.textSec }}>projects · {sd.capacity} MtCO₂/yr capacity</div>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={storageData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="storage" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip />
                <Bar dataKey="capacity" name="Capacity (MtCO₂/yr)" radius={[4, 4, 0, 0]}>
                  {storageData.map((_, idx) => <Cell key={idx} fill={TYPE_COLORS[idx % TYPE_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 4 && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 16 }}>US 45Q Tax Credit Analysis</div>
            <div style={{ background: T.blue + '12', border: `1px solid ${T.blue}33`, borderRadius: 10, padding: '16px 20px', marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>45Q Credit at ${creditVal45Q}/tCO₂ (slider adjustable)</div>
              <div style={{ display: 'flex', gap: 20 }}>
                <div><span style={{ fontSize: 12, color: T.textSec }}>Eligible projects:</span> <strong style={{ color: T.blue }}>{filtered.filter(p => p.tax45Q).length}</strong></div>
                <div><span style={{ fontSize: 12, color: T.textSec }}>Total capacity eligible:</span> <strong style={{ color: T.blue }}>{filtered.filter(p => p.tax45Q).reduce((s, p) => s + p.captureCapacity, 0).toFixed(2)} MtCO₂/yr</strong></div>
                <div><span style={{ fontSize: 12, color: T.textSec }}>Annual credit value:</span> <strong style={{ color: T.green }}>${(filtered.filter(p => p.tax45Q).reduce((s, p) => s + p.captureCapacity, 0) * creditVal45Q).toFixed(0)}M/yr</strong></div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <ScatterChart margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="x" name="Capex ($Bn)" label={{ value: 'Capex ($Bn)', position: 'bottom', fontSize: 11, fill: T.textSec }} tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis dataKey="y" name="Capture Capacity (MtCO₂/yr)" label={{ value: 'Capture (MtCO₂/yr)', angle: -90, position: 'insideLeft', fontSize: 11, fill: T.textSec }} tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip />
                <Scatter data={filtered.map(p => ({ x: p.capex, y: p.captureCapacity, name: p.name, eligible: p.tax45Q }))} fill={T.blue} fillOpacity={0.65} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 5 && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Net Zero Contribution — Top Projects</div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={nzData.map(p => ({ name: p.name.split(' ')[0], nz: p.netzeroContribution, type: p.type }))}
                layout="vertical" margin={{ top: 10, right: 40, left: 100, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} width={100} />
                <Tooltip formatter={(v) => [`${v}%`, 'Net Zero Contribution']} />
                <Bar dataKey="nz" radius={[0, 4, 4, 0]}>
                  {nzData.map((p, idx) => <Cell key={idx} fill={TYPE_COLORS[TYPES.indexOf(p.type) % TYPE_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 6 && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Risk Assessment — Technology Risk Matrix</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Technology', 'Technology Risk', 'Market Risk', 'Regulatory Risk', 'Composite Risk'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: T.textSec, fontWeight: 700, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {riskData.map((r, i) => {
                  const composite = Math.round((r.techRisk + r.marketRisk + r.regRisk) / 3);
                  const col = composite >= 60 ? T.red : composite >= 40 ? T.amber : T.green;
                  return (
                    <tr key={r.type} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '10px 12px', color: T.navy, fontWeight: 600 }}>{r.type}</td>
                      {[r.techRisk, r.marketRisk, r.regRisk].map((rv, ri) => (
                        <td key={ri} style={{ padding: '10px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 60, height: 6, background: T.border, borderRadius: 3 }}>
                              <div style={{ width: `${rv}%`, height: 6, background: rv >= 60 ? T.red : rv >= 40 ? T.amber : T.green, borderRadius: 3 }} />
                            </div>
                            <span style={{ fontFamily: T.fontMono, fontSize: 12 }}>{rv}</span>
                          </div>
                        </td>
                      ))}
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: col, fontFamily: T.fontMono }}>{composite}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {tab === 7 && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Investment Case — IRR Sensitivity to Carbon Price & 45Q</div>
            <div style={{ fontSize: 12, color: T.textSec, marginBottom: 16 }}>Carbon: ${carbonPrice}/tCO₂ · 45Q: ${creditVal45Q}/tCO₂ — IRR adjusted dynamically</div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={adjIrrData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} angle={-30} textAnchor="end" />
                <YAxis tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'IRR (%)', angle: -90, position: 'insideLeft', fontSize: 11, fill: T.textSec }} />
                <Tooltip formatter={(v) => [`${typeof v === 'number' ? v.toFixed(1) : v}%`]} />
                <Bar dataKey="baseIrr" name="Base IRR" fill={T.textSec + '88'} radius={[4, 4, 0, 0]} />
                <Bar dataKey="adjIrr" name="Adjusted IRR" fill={T.teal} radius={[4, 4, 0, 0]} />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
