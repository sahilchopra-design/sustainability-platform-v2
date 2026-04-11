import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, Legend,
} from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f6f4f0',
  navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f',
  teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c',
  surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace',
};

const MDB_NAMES = ['World Bank','ADB','AfDB','IDB','EBRD','EIB','IFC','AIIB','IsDB','NDB','CAF','FONPLATA'];
const BORROWER_NAMES = [
  'India','Nigeria','Bangladesh','Kenya','Ethiopia','Egypt','Morocco','Pakistan','Philippines','Vietnam',
  'Indonesia','Ghana','Tanzania','Uganda','Mozambique','Peru','Colombia','Bolivia','Ecuador','Paraguay',
  'Jordan','Tunisia','Armenia','Georgia','Moldova','Ukraine','Serbia','North Macedonia','Albania','Kosovo',
  'Cambodia','Laos','Myanmar','Papua New Guinea','Timor-Leste','Fiji','Vanuatu','Tonga','Samoa','Kiribati',
  'Brazil','Argentina','Mexico','Guatemala','Honduras','El Salvador','Nicaragua','Costa Rica','Panama','Cuba',
];
const SECTORS = ['Renewable Energy', 'Transport', 'Agriculture', 'Water', 'Urban'];
const REGIONS = ['Sub-Saharan Africa', 'South Asia', 'East Asia', 'Latin America', 'MENA', 'Eastern Europe'];

const ENTITIES = [
  ...Array.from({ length: 12 }, (_, i) => ({
    id: i,
    name: MDB_NAMES[i],
    type: 'MDB',
    region: REGIONS[i % REGIONS.length],
    sector: SECTORS[i % SECTORS.length],
    climateFinanceCommitted: +(5 + sr(i * 11) * 45).toFixed(1),
    mitigationShare: Math.round(40 + sr(i * 7) * 45),
    adaptationShare: Math.round(15 + sr(i * 13) * 40),
    privateCapitalMobilized: +(1 + sr(i * 17) * 29).toFixed(1),
    capitalAdequacyPct: +(12 + sr(i * 19) * 18).toFixed(1),
    mdbLending: 0,
    projectCount: 0,
    grantShare: 0,
    concessionality: 0,
  })),
  ...Array.from({ length: 48 }, (_, i) => ({
    id: i + 12,
    name: BORROWER_NAMES[i] || `Country ${i + 1}`,
    type: 'Borrower',
    region: REGIONS[i % REGIONS.length],
    sector: SECTORS[i % SECTORS.length],
    climateFinanceCommitted: 0,
    mitigationShare: 0,
    adaptationShare: 0,
    privateCapitalMobilized: 0,
    capitalAdequacyPct: 0,
    mdbLending: +(0.2 + sr(i * 23) * 9.8).toFixed(2),
    projectCount: Math.round(1 + sr(i * 29) * 19),
    grantShare: Math.round(5 + sr(i * 31) * 60),
    concessionality: +(1 + sr(i * 37) * 9).toFixed(1),
  })),
];

const TABS = [
  'MDB Overview', 'Climate Finance Flows', 'Mitigation vs Adaptation', 'Private Capital Mobilisation',
  'Country Pipelines', 'Sector Allocation', 'Concessionality Analysis', 'Additionality Assessment',
];

const kpi = (label, value, sub, color) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 20px', minWidth: 160, flex: 1 }}>
    <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 700, color: color || T.navy, marginTop: 4 }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{sub}</div>}
  </div>
);

export default function MDBClimateFinancePage() {
  const [tab, setTab] = useState(0);
  const [typeFilter, setTypeFilter] = useState('All');
  const [regionFilter, setRegionFilter] = useState('All');
  const [sectorFilter, setSectorFilter] = useState('All');
  const [concessionality, setConcessionality] = useState(20);
  const [leverageTarget, setLeverageTarget] = useState(3);

  const filtered = useMemo(() => ENTITIES.filter(e => {
    if (typeFilter !== 'All' && e.type !== typeFilter) return false;
    if (regionFilter !== 'All' && e.region !== regionFilter) return false;
    if (sectorFilter !== 'All' && e.sector !== sectorFilter) return false;
    return true;
  }), [typeFilter, regionFilter, sectorFilter]);

  const mdbs = filtered.filter(e => e.type === 'MDB');
  const borrowers = filtered.filter(e => e.type === 'Borrower');

  const totalClimateFinance = mdbs.reduce((a, e) => a + e.climateFinanceCommitted, 0);
  const avgPrivateMobilised = mdbs.length ? mdbs.reduce((a, e) => a + e.privateCapitalMobilized, 0) / mdbs.length : 0;
  const totalProjects = borrowers.reduce((a, e) => a + e.projectCount, 0);
  const avgAdaptShare = mdbs.length ? mdbs.reduce((a, e) => a + e.adaptationShare, 0) / mdbs.length : 0;

  const selStyle = active => ({
    padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
    background: active ? T.navy : T.sub, color: active ? '#fff' : T.textSec,
    border: `1px solid ${active ? T.navy : T.border}`, fontFamily: T.fontMono,
  });

  const mdbFinanceData = mdbs.map(e => ({ name: e.name.replace(' Bank', '').slice(0, 8), committed: e.climateFinanceCommitted, private: e.privateCapitalMobilized }));
  const mitigAdaptData = mdbs.map(e => ({ name: e.name.slice(0, 6), mitigation: e.mitigationShare, adaptation: e.adaptationShare }));
  const top15Borrowers = [...borrowers].sort((a, b) => b.mdbLending - a.mdbLending).slice(0, 15).map(e => ({ name: e.name.slice(0, 10), lending: e.mdbLending }));
  const privateMobilData = mdbs.map(e => ({ x: e.climateFinanceCommitted, y: e.privateCapitalMobilized, name: e.name }));

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: "'DM Sans',sans-serif", color: T.textPri }}>
      <div style={{ background: T.navy, padding: '24px 32px', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ fontSize: 11, color: T.gold, fontFamily: T.fontMono, letterSpacing: 2, marginBottom: 4 }}>EP-DH2 · EMERGING MARKETS & DEVELOPMENT FINANCE</div>
        <div style={{ fontSize: 26, fontWeight: 700, color: '#fff' }}>MDB Climate Finance Analytics</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 4 }}>
          12 MDBs · 48 Borrower Countries · Climate Finance Flows · Private Capital Mobilisation · Concessionality
        </div>
      </div>

      <div style={{ background: T.card, borderBottom: `1px solid ${T.border}`, padding: '12px 32px', display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, background: T.sub }}>
          <option value="All">All Types</option>
          <option value="MDB">MDBs Only</option>
          <option value="Borrower">Borrowers Only</option>
        </select>
        <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, background: T.sub }}>
          <option value="All">All Regions</option>
          {REGIONS.map(r => <option key={r}>{r}</option>)}
        </select>
        <select value={sectorFilter} onChange={e => setSectorFilter(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, background: T.sub }}>
          <option value="All">All Sectors</option>
          {SECTORS.map(s => <option key={s}>{s}</option>)}
        </select>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 24, alignItems: 'center' }}>
          <label style={{ fontSize: 12, color: T.textSec }}>
            Concessionality Rate: <strong style={{ color: T.navy }}>{concessionality}%</strong>
            <input type="range" min={0} max={100} value={concessionality} onChange={e => setConcessionality(+e.target.value)} style={{ marginLeft: 8, width: 80 }} />
          </label>
          <label style={{ fontSize: 12, color: T.textSec }}>
            Leverage Target: <strong style={{ color: T.navy }}>{leverageTarget}×</strong>
            <input type="range" min={1} max={10} value={leverageTarget} onChange={e => setLeverageTarget(+e.target.value)} style={{ marginLeft: 8, width: 80 }} />
          </label>
        </div>
      </div>

      <div style={{ padding: '20px 32px', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {kpi('Total MDB Climate Finance', `$${totalClimateFinance.toFixed(1)}Bn/yr`, `${mdbs.length} MDBs`, T.blue)}
        {kpi('Avg Private Capital Mobilised', `$${avgPrivateMobilised.toFixed(1)}Bn`, 'per MDB', T.green)}
        {kpi('Total Projects', totalProjects.toLocaleString(), `${borrowers.length} countries`, T.indigo)}
        {kpi('Avg Adaptation Share', `${avgAdaptShare.toFixed(1)}%`, 'of climate finance', T.amber)}
      </div>

      <div style={{ padding: '0 32px 16px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => <button key={t} onClick={() => setTab(i)} style={selStyle(tab === i)}>{t}</button>)}
      </div>

      <div style={{ padding: '0 32px 40px' }}>
        {tab === 0 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Name','Type','Region','Climate Finance ($Bn)','Mitigation %','Adaptation %','Private Capital ($Bn)','Capital Adequacy'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: T.textSec, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 20).map((e, i) => (
                  <tr key={e.id} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                    <td style={{ padding: '8px 12px', fontWeight: 600 }}>{e.name}</td>
                    <td style={{ padding: '8px 12px' }}><span style={{ background: e.type === 'MDB' ? T.blue + '20' : T.green + '20', color: e.type === 'MDB' ? T.blue : T.green, padding: '2px 6px', borderRadius: 4, fontSize: 11 }}>{e.type}</span></td>
                    <td style={{ padding: '8px 12px', color: T.textSec, fontSize: 11 }}>{e.region.split(' ')[0]}</td>
                    <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>{e.type === 'MDB' ? `$${e.climateFinanceCommitted}` : `$${e.mdbLending}`}</td>
                    <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>{e.type === 'MDB' ? `${e.mitigationShare}%` : '—'}</td>
                    <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>{e.type === 'MDB' ? `${e.adaptationShare}%` : `${e.grantShare}%`}</td>
                    <td style={{ padding: '8px 12px', fontFamily: T.fontMono, color: T.green }}>{e.type === 'MDB' ? `$${e.privateCapitalMobilized}` : `${e.projectCount} proj`}</td>
                    <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>{e.type === 'MDB' ? `${e.capitalAdequacyPct}%` : `${e.concessionality}×`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length > 20 && <div style={{ padding: '10px 16px', fontSize: 12, color: T.textSec, background: T.sub }}>Showing 20 of {filtered.length} entities</div>}
          </div>
        )}

        {tab === 1 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 16, color: T.navy }}>MDB Climate Finance Committed vs Private Capital Mobilised ($Bn/yr)</div>
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={mdbFinanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="Bn" />
                <Tooltip formatter={v => `$${v}Bn`} />
                <Legend />
                <Bar dataKey="committed" fill={T.blue} name="Climate Finance Committed" radius={[4, 4, 0, 0]} />
                <Bar dataKey="private" fill={T.green} name="Private Capital Mobilised" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 2 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 16, color: T.navy }}>Mitigation vs Adaptation Share by MDB (%)</div>
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={mitigAdaptData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                <Tooltip formatter={v => `${v}%`} />
                <Legend />
                <Bar dataKey="mitigation" fill={T.teal} name="Mitigation" radius={[4, 4, 0, 0]} stackId="a" />
                <Bar dataKey="adaptation" fill={T.amber} name="Adaptation" radius={[0, 0, 0, 0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 3 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 16, color: T.navy }}>Private Capital Mobilisation vs Climate Finance Committed</div>
            <ResponsiveContainer width="100%" height={360}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="x" name="Climate Finance ($Bn)" label={{ value: 'Climate Finance ($Bn)', position: 'insideBottom', offset: -5, fontSize: 11 }} />
                <YAxis dataKey="y" name="Private Mobilised ($Bn)" label={{ value: 'Private Mobilised ($Bn)', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ payload }) => payload?.[0] ? (
                  <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: '8px 12px', fontSize: 12, borderRadius: 6 }}>
                    <div style={{ fontWeight: 700 }}>{payload[0].payload.name}</div>
                    <div>Committed: ${payload[0].payload.x}Bn</div>
                    <div>Private: ${payload[0].payload.y}Bn</div>
                    <div>Leverage: {(payload[0].payload.y / Math.max(0.1, payload[0].payload.x)).toFixed(2)}×</div>
                  </div>
                ) : null} />
                <Scatter data={privateMobilData} fill={T.purple} fillOpacity={0.7} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 4 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 16, color: T.navy }}>Top 15 Borrowing Countries — MDB Lending ($Bn)</div>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={top15Borrowers}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} unit="Bn" />
                <Tooltip formatter={v => `$${v}Bn`} />
                <Bar dataKey="lending" fill={T.indigo} name="MDB Lending" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 5 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 16, color: T.navy }}>Climate Finance by Sector Focus</div>
            {SECTORS.map(sec => {
              const secEntities = filtered.filter(e => e.sector === sec);
              const total = secEntities.reduce((a, e) => a + (e.type === 'MDB' ? e.climateFinanceCommitted : e.mdbLending), 0);
              return (
                <div key={sec} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '10px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <div style={{ width: 160, fontSize: 13, fontWeight: 600 }}>{sec}</div>
                  <div style={{ flex: 1, background: T.sub, borderRadius: 4, height: 20, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: T.teal, width: `${Math.min(100, total * 2)}%`, borderRadius: 4 }} />
                  </div>
                  <div style={{ width: 80, textAlign: 'right', fontFamily: T.fontMono, fontSize: 13, fontWeight: 700 }}>${total.toFixed(1)}Bn</div>
                  <div style={{ width: 60, textAlign: 'right', fontSize: 12, color: T.textSec }}>{secEntities.length} entities</div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 6 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 16, color: T.navy }}>Concessionality Analysis — Borrowers</div>
            <div style={{ marginBottom: 16, padding: 16, background: T.sub, borderRadius: 8, display: 'flex', gap: 32 }}>
              <div>
                <div style={{ fontSize: 12, color: T.textSec }}>Target Concessionality Rate</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: T.navy, fontFamily: T.fontMono }}>{concessionality}%</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: T.textSec }}>Eligible Borrowers (≥ target)</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: T.green, fontFamily: T.fontMono }}>
                  {borrowers.filter(b => b.grantShare >= concessionality).length}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: T.textSec }}>Avg Leverage (MDBs)</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: T.amber, fontFamily: T.fontMono }}>
                  {(mdbs.reduce((a, m) => a + m.privateCapitalMobilized / Math.max(0.1, m.climateFinanceCommitted), 0) / Math.max(1, mdbs.length)).toFixed(2)}×
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: T.textSec }}>Leverage Target</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: T.indigo, fontFamily: T.fontMono }}>{leverageTarget}×</div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[...borrowers].sort((a, b) => b.grantShare - a.grantShare).slice(0, 15).map(b => ({ name: b.name.slice(0, 10), grant: b.grantShare, concessionality: b.concessionality }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} unit="%" />
                <Tooltip />
                <Bar dataKey="grant" fill={T.gold} name="Grant Share %" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 7 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, marginBottom: 16, color: T.navy }}>Additionality Score — MDB Private Mobilisation</div>
              {mdbs.map(m => {
                const additionality = Math.min(100, m.privateCapitalMobilized / Math.max(0.1, m.climateFinanceCommitted) * 100 / leverageTarget * 100);
                return (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: `1px solid ${T.borderL}` }}>
                    <div style={{ width: 70, fontSize: 12, fontWeight: 600 }}>{m.name.slice(0, 8)}</div>
                    <div style={{ flex: 1, background: T.sub, borderRadius: 4, height: 14 }}>
                      <div style={{ height: '100%', background: additionality >= 80 ? T.green : additionality >= 50 ? T.amber : T.red, width: `${Math.min(100, additionality)}%`, borderRadius: 4 }} />
                    </div>
                    <div style={{ width: 50, textAlign: 'right', fontSize: 12, fontFamily: T.fontMono, color: T.navy }}>{additionality.toFixed(0)}%</div>
                  </div>
                );
              })}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, marginBottom: 16, color: T.navy }}>Capital Adequacy by MDB (%)</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={mdbs.map(m => ({ name: m.name.slice(0, 6), cap: m.capitalAdequacyPct }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip formatter={v => `${v}%`} />
                  <Bar dataKey="cap" fill={T.sage} name="Capital Adequacy" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
