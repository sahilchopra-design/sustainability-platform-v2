import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, AreaChart, Area, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell,
} from 'recharts';

/* ── PRNG ── */
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

/* ── Theme ── */
const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f6f4f0',
  navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f',
  teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c',
  surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace',
};

/* ── Data ── */
const REGIONS = ['EU','North America','Asia Pacific','Latin America','Middle East & Africa','UK'];
const POLICY_TYPES = ['Carbon Tax','ETS','Disclosure','Taxonomy','Transition Plan','Due Diligence','Building','Transport'];
const STATUSES = ['In Force','Pending','Proposed','Consultation'];
const JURISDICTIONS = ['EU','USA','UK','Germany','France','Japan','Canada','Australia','China','Singapore','Brazil','South Korea','Netherlands','Sweden','New Zealand'];
const SECTORS_ALL = ['Energy','Finance','Industry','Transport','Agriculture','Buildings','Technology','All Sectors'];

const POLICIES = Array.from({ length: 75 }, (_, i) => {
  const type = POLICY_TYPES[Math.floor(sr(i * 7) * POLICY_TYPES.length)];
  const region = REGIONS[Math.floor(sr(i * 11) * REGIONS.length)];
  const jurisdiction = JURISDICTIONS[Math.floor(sr(i * 13) * JURISDICTIONS.length)];
  const status = STATUSES[Math.floor(sr(i * 17) * STATUSES.length)];
  const effectiveYear = 2020 + Math.floor(sr(i * 19) * 8);
  const carbonPriceEquivalent = type === 'Carbon Tax' || type === 'ETS' ? parseFloat((5 + sr(i * 23) * 195).toFixed(0)) : parseFloat((sr(i * 23) * 50).toFixed(0));
  const affectedSectorCount = 1 + Math.floor(sr(i * 29) * 4);
  const complianceCost = parseFloat((0.1 + sr(i * 31) * 49.9).toFixed(1));
  const policyAmbitiousness = parseFloat((2 + sr(i * 37) * 8).toFixed(1));
  const alignedWithParis = policyAmbitiousness >= 6 ? sr(i * 41) > 0.25 : sr(i * 41) > 0.65;
  const enforcementRisk = parseFloat((1 + sr(i * 43) * 9).toFixed(1));
  const businessImpactScore = parseFloat((1 + sr(i * 47) * 9).toFixed(1));
  return {
    id: i + 1,
    name: `${type} — ${jurisdiction} ${2018 + Math.floor(sr(i * 53) * 7)}`,
    jurisdiction, region, type, status, effectiveYear,
    carbonPriceEquivalent: +carbonPriceEquivalent, affectedSectorCount,
    complianceCost, policyAmbitiousness, alignedWithParis,
    enforcementRisk, businessImpactScore,
  };
});

const TABS = [
  'Policy Overview','By Jurisdiction','Carbon Pricing','Disclosure Mandates',
  'Taxonomy Frameworks','Compliance Costs','Policy Ambition','Timeline',
];

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px', flex: 1, minWidth: 160 }}>
    <div style={{ fontSize: 11, color: T.textSec, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: color || T.navy, fontFamily: T.fontMono }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>{sub}</div>}
  </div>
);

export default function ClimateRegPolicyTrackerPage() {
  const [tab, setTab] = useState(0);
  const [filterRegion, setFilterRegion] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterYear, setFilterYear] = useState('All');
  const [minPrice, setMinPrice] = useState(0);
  const [minAmbition, setMinAmbition] = useState(0);

  const filtered = useMemo(() => POLICIES.filter(p =>
    (filterRegion === 'All' || p.region === filterRegion) &&
    (filterType === 'All' || p.type === filterType) &&
    (filterStatus === 'All' || p.status === filterStatus) &&
    (filterYear === 'All' || p.effectiveYear === +filterYear) &&
    p.carbonPriceEquivalent >= minPrice &&
    p.policyAmbitiousness >= minAmbition
  ), [filterRegion, filterType, filterStatus, filterYear, minPrice, minAmbition]);

  const n = Math.max(1, filtered.length);
  const avgPrice = (filtered.reduce((a, p) => a + p.carbonPriceEquivalent, 0) / n).toFixed(0);
  const pctParis = ((filtered.filter(p => p.alignedWithParis).length / n) * 100).toFixed(0);
  const totalCost = filtered.reduce((a, p) => a + p.complianceCost, 0).toFixed(1);

  /* by type */
  const byType = POLICY_TYPES.map(t => ({
    type: t,
    count: filtered.filter(p => p.type === t).length,
  })).filter(d => d.count > 0);

  /* by jurisdiction */
  const byJurisdiction = JURISDICTIONS.map(j => {
    const jc = filtered.filter(p => p.jurisdiction === j);
    if (!jc.length) return null;
    return {
      jurisdiction: j,
      avgPrice: parseFloat((jc.reduce((a, p) => a + p.carbonPriceEquivalent, 0) / jc.length).toFixed(0)),
      count: jc.length,
    };
  }).filter(Boolean).sort((a, b) => b.avgPrice - a.avgPrice).slice(0, 12);

  /* ambition vs cost scatter */
  const scatterData = filtered.map(p => ({ x: p.policyAmbitiousness, y: p.complianceCost, name: p.name, paris: p.alignedWithParis }));

  /* timeline area chart */
  const timelineData = Array.from({ length: 8 }, (_, i) => {
    const yr = 2020 + i;
    return {
      year: yr.toString(),
      inForce: POLICIES.filter(p => p.effectiveYear === yr && p.status === 'In Force').length,
      pending: POLICIES.filter(p => p.effectiveYear === yr && p.status === 'Pending').length,
      proposed: POLICIES.filter(p => p.effectiveYear === yr && (p.status === 'Proposed' || p.status === 'Consultation')).length,
    };
  });

  const YEARS_RANGE = [2020,2021,2022,2023,2024,2025,2026,2027];

  const sel = { background: T.indigo, color: '#fff', border: `1px solid ${T.indigo}` };
  const unsel = { background: T.card, color: T.textPri, border: `1px solid ${T.border}` };

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, system-ui, sans-serif', color: T.textPri }}>
      <div style={{ background: T.navy, padding: '20px 32px' }}>
        <div style={{ color: T.gold, fontSize: 11, fontFamily: T.fontMono, letterSpacing: '0.1em', marginBottom: 4 }}>EP-DK6 · SPRINT DK</div>
        <div style={{ color: '#fff', fontSize: 22, fontWeight: 700 }}>Climate Reg & Policy Tracker</div>
        <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 2 }}>75 policies · Carbon tax · ETS · Disclosure mandates · Taxonomy frameworks · Compliance costs</div>
      </div>

      {/* Filters */}
      <div style={{ background: T.sub, borderBottom: `1px solid ${T.border}`, padding: '12px 32px', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        {[['Region', REGIONS, filterRegion, setFilterRegion], ['Type', POLICY_TYPES, filterType, setFilterType], ['Status', STATUSES, filterStatus, setFilterStatus]].map(([label, opts, val, set]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: T.textSec }}>{label}:</span>
            <select value={val} onChange={e => set(e.target.value)} style={{ fontSize: 12, padding: '4px 8px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.card }}>
              <option value="All">All</option>
              {opts.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: T.textSec }}>Year:</span>
          <select value={filterYear} onChange={e => setFilterYear(e.target.value)} style={{ fontSize: 12, padding: '4px 8px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.card }}>
            <option value="All">All</option>
            {YEARS_RANGE.map(y => <option key={y}>{y}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: T.textSec }}>Min Price $/tCO2: {minPrice}</span>
          <input type="range" min={0} max={150} step={5} value={minPrice} onChange={e => setMinPrice(+e.target.value)} style={{ width: 100 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: T.textSec }}>Min Ambition: {minAmbition}</span>
          <input type="range" min={0} max={10} step={0.5} value={minAmbition} onChange={e => setMinAmbition(+e.target.value)} style={{ width: 100 }} />
        </div>
        <span style={{ fontSize: 12, color: T.textSec, marginLeft: 'auto' }}>{filtered.length} / {POLICIES.length} policies</span>
      </div>

      {/* KPIs */}
      <div style={{ padding: '20px 32px', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <KpiCard label="Total Policies Tracked" value={filtered.length} sub="across jurisdictions" color={T.navy} />
        <KpiCard label="Avg Carbon Price Equiv." value={`$${avgPrice}`} sub="per tCO2e" color={T.indigo} />
        <KpiCard label="% Aligned with Paris" value={`${pctParis}%`} sub="of tracked policies" color={T.green} />
        <KpiCard label="Total Compliance Cost" value={`$${totalCost}Bn`} sub="estimated aggregate" color={T.orange} />
      </div>

      {/* Tabs */}
      <div style={{ padding: '0 32px', display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{ ...i === tab ? sel : unsel, padding: '6px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer', transition: 'all 0.15s' }}>{t}</button>
        ))}
      </div>

      <div style={{ padding: '0 32px 40px' }}>

        {tab === 0 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.border}`, fontWeight: 600, fontSize: 14 }}>Policy Overview — {filtered.length} Regulations</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Policy','Jurisdiction','Region','Type','Status','Eff. Year','Carbon Price','Ambition','Paris?','Enforcement','Biz Impact'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: T.textSec, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 25).map((p, i) => (
                    <tr key={p.id} style={{ borderTop: `1px solid ${T.borderL}`, background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '9px 12px', fontWeight: 600, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</td>
                      <td style={{ padding: '9px 12px' }}>{p.jurisdiction}</td>
                      <td style={{ padding: '9px 12px' }}>{p.region}</td>
                      <td style={{ padding: '9px 12px' }}><span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 8, background: '#ede9fe', color: T.indigo }}>{p.type}</span></td>
                      <td style={{ padding: '9px 12px' }}><span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, background: p.status === 'In Force' ? '#dcfce7' : p.status === 'Pending' ? '#dbeafe' : p.status === 'Proposed' ? '#fef9c3' : '#f3f4f6', color: p.status === 'In Force' ? T.green : p.status === 'Pending' ? T.blue : p.status === 'Proposed' ? T.amber : T.textSec }}>{p.status}</span></td>
                      <td style={{ padding: '9px 12px', fontFamily: T.fontMono }}>{p.effectiveYear}</td>
                      <td style={{ padding: '9px 12px', fontFamily: T.fontMono, fontWeight: 700, color: p.carbonPriceEquivalent >= 100 ? T.green : p.carbonPriceEquivalent >= 50 ? T.teal : T.amber }}>${p.carbonPriceEquivalent}</td>
                      <td style={{ padding: '9px 12px', fontFamily: T.fontMono, color: p.policyAmbitiousness >= 7 ? T.green : p.policyAmbitiousness >= 5 ? T.teal : T.amber }}>{p.policyAmbitiousness.toFixed(1)}</td>
                      <td style={{ padding: '9px 12px', color: p.alignedWithParis ? T.green : T.red }}>{p.alignedWithParis ? '✓' : '✗'}</td>
                      <td style={{ padding: '9px 12px', fontFamily: T.fontMono, color: p.enforcementRisk >= 7 ? T.red : p.enforcementRisk >= 5 ? T.amber : T.green }}>{p.enforcementRisk.toFixed(1)}</td>
                      <td style={{ padding: '9px 12px', fontFamily: T.fontMono, color: p.businessImpactScore >= 7 ? T.red : p.businessImpactScore >= 5 ? T.amber : T.green }}>{p.businessImpactScore.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 1 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 16 }}>Avg Carbon Price Equivalent by Jurisdiction (Top 12)</div>
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={byJurisdiction} margin={{ left: 0, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="jurisdiction" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} label={{ value: '$/tCO2', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                <Tooltip formatter={v => [`$${v}/tCO2`, 'Avg Carbon Price']} />
                <Bar dataKey="avgPrice" radius={[4,4,0,0]} name="Avg Carbon Price">
                  {byJurisdiction.map((e, idx) => <Cell key={idx} fill={e.avgPrice >= 100 ? T.green : e.avgPrice >= 50 ? T.teal : e.avgPrice >= 20 ? T.amber : T.red} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 2 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.border}`, fontWeight: 600, fontSize: 14 }}>Carbon Pricing Policies — Sorted by Price</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Policy','Jurisdiction','Type','Status','Carbon Price ($/tCO2)','Ambition','Paris Aligned','Eff. Year'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: T.textSec }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...filtered].filter(p => p.type === 'Carbon Tax' || p.type === 'ETS').sort((a, b) => b.carbonPriceEquivalent - a.carbonPriceEquivalent).slice(0, 20).map((p, i) => (
                  <tr key={p.id} style={{ borderTop: `1px solid ${T.borderL}`, background: i % 2 === 0 ? T.card : T.sub }}>
                    <td style={{ padding: '9px 12px', fontWeight: 600, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</td>
                    <td style={{ padding: '9px 12px' }}>{p.jurisdiction}</td>
                    <td style={{ padding: '9px 12px' }}>{p.type}</td>
                    <td style={{ padding: '9px 12px' }}><span style={{ padding: '2px 6px', borderRadius: 8, fontSize: 11, background: p.status === 'In Force' ? '#dcfce7' : '#dbeafe', color: p.status === 'In Force' ? T.green : T.blue }}>{p.status}</span></td>
                    <td style={{ padding: '9px 12px', fontFamily: T.fontMono, fontWeight: 700, color: p.carbonPriceEquivalent >= 100 ? T.green : p.carbonPriceEquivalent >= 50 ? T.teal : T.amber }}>${p.carbonPriceEquivalent}</td>
                    <td style={{ padding: '9px 12px', fontFamily: T.fontMono }}>{p.policyAmbitiousness.toFixed(1)}</td>
                    <td style={{ padding: '9px 12px', color: p.alignedWithParis ? T.green : T.red }}>{p.alignedWithParis ? '✓' : '✗'}</td>
                    <td style={{ padding: '9px 12px', fontFamily: T.fontMono }}>{p.effectiveYear}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 3 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.border}`, fontWeight: 600, fontSize: 14 }}>Disclosure Mandates — {filtered.filter(p => p.type === 'Disclosure').length} policies</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Policy','Jurisdiction','Status','Eff. Year','Ambition','Paris?','Enforcement Risk','Business Impact'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: T.textSec }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.filter(p => p.type === 'Disclosure').map((p, i) => (
                  <tr key={p.id} style={{ borderTop: `1px solid ${T.borderL}`, background: i % 2 === 0 ? T.card : T.sub }}>
                    <td style={{ padding: '9px 12px', fontWeight: 600, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</td>
                    <td style={{ padding: '9px 12px' }}>{p.jurisdiction}</td>
                    <td style={{ padding: '9px 12px' }}><span style={{ padding: '2px 6px', borderRadius: 8, fontSize: 11, fontWeight: 600, background: p.status === 'In Force' ? '#dcfce7' : '#dbeafe', color: p.status === 'In Force' ? T.green : T.blue }}>{p.status}</span></td>
                    <td style={{ padding: '9px 12px', fontFamily: T.fontMono }}>{p.effectiveYear}</td>
                    <td style={{ padding: '9px 12px', fontFamily: T.fontMono, color: p.policyAmbitiousness >= 7 ? T.green : p.policyAmbitiousness >= 5 ? T.teal : T.amber }}>{p.policyAmbitiousness.toFixed(1)}</td>
                    <td style={{ padding: '9px 12px', color: p.alignedWithParis ? T.green : T.red }}>{p.alignedWithParis ? '✓' : '✗'}</td>
                    <td style={{ padding: '9px 12px', fontFamily: T.fontMono, color: p.enforcementRisk >= 7 ? T.red : p.enforcementRisk >= 5 ? T.amber : T.green }}>{p.enforcementRisk.toFixed(1)}</td>
                    <td style={{ padding: '9px 12px', fontFamily: T.fontMono, color: p.businessImpactScore >= 7 ? T.red : p.businessImpactScore >= 5 ? T.amber : T.green }}>{p.businessImpactScore.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 4 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.border}`, fontWeight: 600, fontSize: 14 }}>Taxonomy Frameworks — {filtered.filter(p => p.type === 'Taxonomy').length} policies</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Policy','Jurisdiction','Region','Status','Eff. Year','Ambition','Compliance Cost ($Bn)','Paris Aligned'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: T.textSec }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.filter(p => p.type === 'Taxonomy').map((p, i) => (
                  <tr key={p.id} style={{ borderTop: `1px solid ${T.borderL}`, background: i % 2 === 0 ? T.card : T.sub }}>
                    <td style={{ padding: '9px 12px', fontWeight: 600, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</td>
                    <td style={{ padding: '9px 12px' }}>{p.jurisdiction}</td>
                    <td style={{ padding: '9px 12px' }}>{p.region}</td>
                    <td style={{ padding: '9px 12px' }}><span style={{ padding: '2px 6px', borderRadius: 8, fontSize: 11, fontWeight: 600, background: p.status === 'In Force' ? '#dcfce7' : '#dbeafe', color: p.status === 'In Force' ? T.green : T.blue }}>{p.status}</span></td>
                    <td style={{ padding: '9px 12px', fontFamily: T.fontMono }}>{p.effectiveYear}</td>
                    <td style={{ padding: '9px 12px', fontFamily: T.fontMono }}>{p.policyAmbitiousness.toFixed(1)}</td>
                    <td style={{ padding: '9px 12px', fontFamily: T.fontMono, color: p.complianceCost >= 20 ? T.red : p.complianceCost >= 10 ? T.amber : T.green }}>{p.complianceCost.toFixed(1)}</td>
                    <td style={{ padding: '9px 12px', color: p.alignedWithParis ? T.green : T.red }}>{p.alignedWithParis ? '✓' : '✗'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 5 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 600, marginBottom: 16 }}>Policy Ambition vs Compliance Cost</div>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart margin={{ left: 0, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="x" name="Ambition" label={{ value: 'Ambition (0-10)', position: 'insideBottom', offset: -5, fontSize: 11 }} tick={{ fontSize: 11 }} />
                  <YAxis dataKey="y" name="Cost $Bn" label={{ value: 'Cost ($Bn)', angle: -90, position: 'insideLeft', fontSize: 11 }} tick={{ fontSize: 11 }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ payload }) => payload?.[0] ? <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: '8px 12px', borderRadius: 6, fontSize: 12 }}><div style={{ fontWeight: 600, maxWidth: 200 }}>{payload[0].payload.name}</div><div>Ambition: {payload[0].payload.x.toFixed(1)}</div><div>Cost: ${payload[0].payload.y.toFixed(1)}Bn</div><div style={{ color: payload[0].payload.paris ? T.green : T.red }}>{payload[0].payload.paris ? 'Paris Aligned' : 'Not Paris Aligned'}</div></div> : null} />
                  <Scatter data={scatterData}>
                    {scatterData.map((entry, index) => <Cell key={index} fill={entry.paris ? T.green : T.red} opacity={0.7} />)}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 600, marginBottom: 16 }}>Policies by Type — Count</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={byType} layout="vertical" margin={{ left: 60, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="type" type="category" tick={{ fontSize: 11 }} width={100} />
                  <Tooltip formatter={v => [`${v}`, 'Policies']} />
                  <Bar dataKey="count" fill={T.indigo} radius={[0,4,4,0]} name="Count">
                    {byType.map((e, idx) => <Cell key={idx} fill={[T.indigo, T.teal, T.blue, T.green, T.gold, T.orange, T.purple, T.sage][idx % 8]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 6 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.border}`, fontWeight: 600, fontSize: 14 }}>Policy Ambition Ranking — Top 20 Most Ambitious</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Rank','Policy','Jurisdiction','Type','Status','Ambition','Carbon Price','Paris?','Business Impact'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: T.textSec }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...filtered].sort((a, b) => b.policyAmbitiousness - a.policyAmbitiousness).slice(0, 20).map((p, i) => (
                  <tr key={p.id} style={{ borderTop: `1px solid ${T.borderL}`, background: i % 2 === 0 ? T.card : T.sub }}>
                    <td style={{ padding: '9px 12px', fontFamily: T.fontMono, fontWeight: 700, color: T.gold }}>#{i + 1}</td>
                    <td style={{ padding: '9px 12px', fontWeight: 600, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</td>
                    <td style={{ padding: '9px 12px' }}>{p.jurisdiction}</td>
                    <td style={{ padding: '9px 12px' }}>{p.type}</td>
                    <td style={{ padding: '9px 12px' }}><span style={{ padding: '2px 6px', borderRadius: 8, fontSize: 11, fontWeight: 600, background: p.status === 'In Force' ? '#dcfce7' : '#dbeafe', color: p.status === 'In Force' ? T.green : T.blue }}>{p.status}</span></td>
                    <td style={{ padding: '9px 12px', fontFamily: T.fontMono, fontWeight: 700, color: p.policyAmbitiousness >= 8 ? T.green : p.policyAmbitiousness >= 6 ? T.teal : T.amber }}>{p.policyAmbitiousness.toFixed(1)}</td>
                    <td style={{ padding: '9px 12px', fontFamily: T.fontMono }}>${p.carbonPriceEquivalent}</td>
                    <td style={{ padding: '9px 12px', color: p.alignedWithParis ? T.green : T.red }}>{p.alignedWithParis ? '✓' : '✗'}</td>
                    <td style={{ padding: '9px 12px', fontFamily: T.fontMono, color: p.businessImpactScore >= 7 ? T.red : p.businessImpactScore >= 5 ? T.amber : T.green }}>{p.businessImpactScore.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 7 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 16 }}>Policy Rollout Timeline 2020–2027 (by status)</div>
            <ResponsiveContainer width="100%" height={360}>
              <AreaChart data={timelineData} margin={{ left: 0, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="inForce" name="In Force" stackId="1" stroke={T.green} fill={T.green} fillOpacity={0.4} />
                <Area type="monotone" dataKey="pending" name="Pending" stackId="1" stroke={T.blue} fill={T.blue} fillOpacity={0.4} />
                <Area type="monotone" dataKey="proposed" name="Proposed/Consultation" stackId="1" stroke={T.amber} fill={T.amber} fillOpacity={0.4} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
