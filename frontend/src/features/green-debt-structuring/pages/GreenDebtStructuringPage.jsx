/* EP-DD2: Green Debt Structuring — Sprint DD */
import React, { useState, useMemo } from 'react';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell, LineChart, Line, AreaChart, Area, ScatterChart, Scatter, ZAxis, PieChart, Pie
} from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const SECTORS = ['Energy', 'Transport', 'Buildings', 'Water', 'Waste', 'Agri', 'Industry', 'Technology'];
const TYPES = ['Green Bond', 'Sustainability-Linked Bond', 'Transition Bond', 'Blue Bond', 'SDG Bond', 'Social Bond', 'Sustainability Bond'];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'AUD'];
const REGIONS = ['North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East'];
const VERIFIERS = ['Sustainalytics', 'Vigeo Eiris', 'DNV GL', 'ISS ESG', 'CICERO', 'Climate Bonds Initiative'];
const FRAMEWORKS = ['ICMA Green Bond Principles', 'ICMA SLB Principles', 'EU Green Bond Standard', 'Climate Bonds Standard', 'LMA Green Loan Principles'];
const SDG_TAGS = ['SDG 6', 'SDG 7', 'SDG 8', 'SDG 9', 'SDG 11', 'SDG 12', 'SDG 13', 'SDG 14', 'SDG 15'];

const INSTRUMENTS = Array.from({ length: 70 }, (_, i) => {
  const sec = SECTORS[i % 8];
  const type = TYPES[i % 7];
  const notional = 0.2 + sr(i * 7) * 4.8;
  const greenium = -(2 + sr(i * 11) * 20);
  const kpiTarget = 20 + sr(i * 13) * 60;
  const kpiActual = kpiTarget * (0.6 + sr(i * 17) * 0.7);
  const coupon = 1.5 + sr(i * 19) * 4;
  const oversubRatio = 1.2 + sr(i * 23) * 4.8;
  const sdgCount = 2 + Math.floor(sr(i * 29) * 4);
  return {
    id: i + 1,
    name: `${['Horizon', 'Vertex', 'Apex', 'Summit', 'Crest'][i % 5]} ${type.split(' ')[0]} ${2024 + (i % 3)}`,
    issuer: `${['NatPower', 'GreenBank', 'EcoTrans', 'BlueWater', 'ClimateRE', 'SustainCo', 'NetZero', 'GreenCap'][i % 8]} ${['Corp', 'Group', 'AG', 'SA', 'Plc'][i % 5]}`,
    sector: sec,
    type,
    notional: +notional.toFixed(2),
    coupon: +coupon.toFixed(2),
    maturity: 2026 + Math.floor(sr(i * 31) * 10),
    greenium: +greenium.toFixed(1),
    kpiTarget: +kpiTarget.toFixed(1),
    kpiActual: +kpiActual.toFixed(1),
    useOfProceeds: sec === 'Energy' ? 'Renewable Energy' : sec === 'Transport' ? 'Clean Transport' : sec === 'Buildings' ? 'Green Buildings' : sec === 'Water' ? 'Water Management' : 'Pollution Prevention',
    verifier: VERIFIERS[i % 6],
    framework: FRAMEWORKS[i % 5],
    spoBond: sr(i * 37) > 0.3,
    rating: ['AAA', 'AA+', 'AA', 'A+', 'A', 'BBB+'][Math.floor(sr(i * 41) * 6)],
    currency: CURRENCIES[i % 6],
    region: REGIONS[i % 5],
    sdgAlignment: Array.from({ length: sdgCount }, (_, j) => SDG_TAGS[(i + j * 3) % 9]),
    oversubRatio: +oversubRatio.toFixed(1),
    bidCover: +(1.5 + sr(i * 43) * 3.5).toFixed(1),
    climateImpact: +(notional * (0.5 + sr(i * 47) * 2)).toFixed(1),
  };
});

const TABS = ['Issuance Dashboard', 'Framework Analyzer', 'Use of Proceeds', 'KPI Engine', 'Greenium Pricing', 'Market Benchmarks', 'Investor Profiling', 'Reporting Suite'];
const SECTOR_COLORS = { Energy: '#dc2626', Transport: '#2563eb', Buildings: '#d97706', Water: '#0891b2', Waste: '#7c3aed', Agri: '#059669', Industry: '#db2777', Technology: '#65a30d' };
const TYPE_COLORS = { 'Green Bond': '#059669', 'Sustainability-Linked Bond': '#2563eb', 'Transition Bond': '#d97706', 'Blue Bond': '#0891b2', 'SDG Bond': '#7c3aed', 'Social Bond': '#db2777', 'Sustainability Bond': '#65a30d' };

const T = { bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f6f4f0', navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280', green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f', teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c', surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace' };
export default function GreenDebtStructuringPage() {

  const [tab, setTab] = useState(0);
  const [filterType, setFilterType] = useState('All');
  const [filterSector, setFilterSector] = useState('All');
  const [carbonStepUp, setCarbonStepUp] = useState(25);
  const [kpiMiss, setKpiMiss] = useState(50);

  const KpiCard = ({ label, value, sub, color }) => (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px', minWidth: 140 }}>
      <div style={{ fontSize: 11, color: T.textSec, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: color || T.navy, margin: '4px 0' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: T.textSec }}>{sub}</div>}
    </div>
  );

  const filtered = useMemo(() => INSTRUMENTS.filter(d => (filterType === 'All' || d.type === filterType) && (filterSector === 'All' || d.sector === filterSector)), [filterType, filterSector]);

  const totalNotional = filtered.reduce((s, d) => s + d.notional, 0);
  const avgGreenium = filtered.length ? filtered.reduce((s, d) => s + d.greenium, 0) / filtered.length : 0;
  const avgOverSub = filtered.length ? filtered.reduce((s, d) => s + d.oversubRatio, 0) / filtered.length : 0;
  const totalImpact = filtered.reduce((s, d) => s + d.climateImpact, 0);
  const kpiOnTrack = filtered.filter(d => d.kpiActual >= d.kpiTarget * (kpiMiss / 100)).length;
  const spo = filtered.filter(d => d.spoBond).length;

  const typeBreakdown = useMemo(() => TYPES.map(t => {
    const arr = INSTRUMENTS.filter(d => d.type === t);
    return {
      type: t.replace('Sustainability-Linked Bond', 'SLB').replace('Sustainability Bond', 'Sust. Bond'),
      count: arr.length,
      notional: +(arr.reduce((s, d) => s + d.notional, 0)).toFixed(1),
      greenium: arr.length ? +(arr.reduce((s, d) => s + d.greenium, 0) / arr.length).toFixed(1) : 0,
    };
  }), []);

  const sectorBreakdown = useMemo(() => SECTORS.map(s => {
    const arr = INSTRUMENTS.filter(d => d.sector === s);
    return {
      sector: s,
      notional: +(arr.reduce((s2, d) => s2 + d.notional, 0)).toFixed(1),
      impact: +(arr.reduce((s2, d) => s2 + d.climateImpact, 0)).toFixed(1),
      greenium: arr.length ? +(arr.reduce((s2, d) => s2 + d.greenium, 0) / arr.length).toFixed(1) : 0,
    };
  }), []);

  const kpiStepCalc = useMemo(() => filtered.slice(0, 12).map(d => {
    const miss = Math.max(0, d.kpiTarget - d.kpiActual) / Math.max(0.1, d.kpiTarget) * 100;
    const stepUp = miss > 0 ? +(miss * carbonStepUp / 100).toFixed(2) : 0;
    const stepDown = d.kpiActual > d.kpiTarget ? +(((d.kpiActual - d.kpiTarget) / Math.max(0.1, d.kpiTarget)) * 100 * 0.3).toFixed(2) : 0;
    return {
      name: d.name.substring(0, 18),
      kpiTarget: d.kpiTarget,
      kpiActual: +d.kpiActual.toFixed(1),
      stepUp,
      stepDown,
      achievement: +Math.min(150, (d.kpiActual / Math.max(0.1, d.kpiTarget) * 100)).toFixed(1),
    };
  }), [filtered, carbonStepUp]);

  const greeniumBySector = useMemo(() => SECTORS.map(s => {
    const arr = INSTRUMENTS.filter(d => d.sector === s);
    return { sector: s, greenium: arr.length ? +(arr.reduce((sum, d) => sum + d.greenium, 0) / arr.length).toFixed(1) : 0 };
  }), []);

  const demandCurve = useMemo(() => Array.from({ length: 10 }, (_, i) => ({
    yield: +(1.5 + i * 0.4).toFixed(1),
    demand: +(8 - i * 0.7 + sr(i * 11) * 0.5).toFixed(1),
    supply: +(3 + i * 0.3).toFixed(1),
  })), []);

  const investorProfiles = useMemo(() => [
    { type: 'Pension Funds', aum: 12.4, esgMandate: 85, greenAlloc: 18, preference: 'Green Bond' },
    { type: 'Insurance', aum: 8.7, esgMandate: 72, greenAlloc: 12, preference: 'SLB' },
    { type: 'Asset Managers', aum: 24.1, esgMandate: 68, greenAlloc: 22, preference: 'Green Bond' },
    { type: 'SWFs', aum: 9.2, esgMandate: 91, greenAlloc: 31, preference: 'Sustainability Bond' },
    { type: 'Banks', aum: 6.3, esgMandate: 55, greenAlloc: 9, preference: 'Transition Bond' },
    { type: 'DFIs', aum: 3.8, esgMandate: 98, greenAlloc: 45, preference: 'SDG Bond' },
    { type: 'Retail/ETF', aum: 4.1, esgMandate: 61, greenAlloc: 14, preference: 'Green Bond' },
  ], []);

  const reportingMetrics = useMemo(() => [
    { metric: 'Renewable Energy Capacity', value: +(filtered.filter(d => d.sector === 'Energy').reduce((s, d) => s + d.notional * 0.8, 0)).toFixed(1), unit: 'GW financed', change: '+12%' },
    { metric: 'GHG Emissions Avoided', value: +(totalImpact * 0.4).toFixed(0), unit: 'ktCO₂e/yr', change: '+18%' },
    { metric: 'Clean Transport Projects', value: +(filtered.filter(d => d.sector === 'Transport').reduce((s, d) => s + d.notional, 0)).toFixed(1), unit: '$Bn deployed', change: '+9%' },
    { metric: 'Green Buildings Certified', value: filtered.filter(d => d.sector === 'Buildings').length * 12, unit: 'buildings', change: '+22%' },
    { metric: 'Water Treated', value: +(filtered.filter(d => d.sector === 'Water').reduce((s, d) => s + d.notional * 50, 0)).toFixed(0), unit: 'Mn m³/yr', change: '+7%' },
    { metric: 'SDG Touchpoints', value: filtered.reduce((s, d) => s + d.sdgAlignment.length, 0), unit: 'total', change: '+15%' },
  ], [filtered, totalImpact]);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', padding: 24, fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono, marginBottom: 4 }}>EP-DD2 · CORPORATE FINANCE & CAPITAL MARKETS</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: T.navy, margin: 0 }}>Green Debt Structuring</h1>
        <div style={{ fontSize: 13, color: T.textSec, marginTop: 4 }}>70 instruments · 7 instrument types · Greenium pricing · KPI step-up/down engine · Impact reporting</div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.card, color: T.textPri, fontSize: 13 }}>
          <option value="All">All Types</option>
          {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filterSector} onChange={e => setFilterSector(e.target.value)} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.card, color: T.textPri, fontSize: 13 }}>
          <option value="All">All Sectors</option>
          {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: T.textSec }}>KPI Step-Up: +{carbonStepUp}bps</span>
          <input type="range" min={5} max={75} value={carbonStepUp} onChange={e => setCarbonStepUp(+e.target.value)} style={{ width: 100 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: T.textSec }}>KPI Threshold: {kpiMiss}%</span>
          <input type="range" min={10} max={100} value={kpiMiss} onChange={e => setKpiMiss(+e.target.value)} style={{ width: 100 }} />
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <KpiCard label="Total Issuance" value={`$${totalNotional.toFixed(0)}Bn`} sub={`${filtered.length} instruments`} color={T.navy} />
        <KpiCard label="Avg Greenium" value={`${avgGreenium.toFixed(1)}bps`} sub="vs vanilla peers" color={T.green} />
        <KpiCard label="Avg Oversubscription" value={`${avgOverSub.toFixed(1)}×`} sub="Investor demand" color={T.indigo} />
        <KpiCard label="Climate Impact" value={`${totalImpact.toFixed(0)}Mn`} sub="tCO₂e avoided equiv." color={T.teal} />
        <KpiCard label="KPI On-Track" value={`${kpiOnTrack}/${filtered.length}`} sub={`≥${kpiMiss}% achievement`} color={T.amber} />
        <KpiCard label="SPO Coverage" value={`${spo}/${filtered.length}`} sub="2nd party opinion" color={T.blue} />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: `2px solid ${T.border}`, paddingBottom: 0, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{ padding: '8px 16px', background: 'none', border: 'none', borderBottom: tab === i ? `3px solid ${T.gold}` : '3px solid transparent', color: tab === i ? T.navy : T.textSec, fontWeight: tab === i ? 700 : 400, cursor: 'pointer', fontSize: 13 }}>{t}</button>
        ))}
      </div>

      {/* Tab 0: Issuance Dashboard */}
      {tab === 0 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Issuance by Instrument Type ($Bn)</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={typeBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="type" tick={{ fontSize: 9, fill: T.textSec }} angle={-20} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 10, fill: T.textSec }} tickFormatter={v => `$${v}Bn`} />
                  <Tooltip formatter={v => `$${v}Bn`} />
                  <Bar dataKey="notional" name="Notional $Bn">
                    {typeBreakdown.map((e, i) => <Cell key={i} fill={Object.values(TYPE_COLORS)[i % 7]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Greenium by Instrument Type (bps)</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={typeBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="type" tick={{ fontSize: 9, fill: T.textSec }} angle={-20} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 10, fill: T.textSec }} tickFormatter={v => `${v}bps`} />
                  <Tooltip formatter={v => `${v}bps`} />
                  <Bar dataKey="greenium" name="Avg Greenium (bps)">
                    {typeBreakdown.map((e, i) => <Cell key={i} fill={T.green} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Instrument Registry</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.surfaceH }}>
                    {['Name', 'Issuer', 'Type', 'Notional', 'Coupon', 'Maturity', 'Greenium', 'Rating', 'SPO', 'Region'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: T.textSec, fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 15).map((d, i) => (
                    <tr key={d.id} style={{ borderTop: `1px solid ${T.border}`, background: i % 2 === 0 ? 'transparent' : T.surfaceH }}>
                      <td style={{ padding: '7px 12px', color: T.navy, fontWeight: 600, fontSize: 11 }}>{d.name}</td>
                      <td style={{ padding: '7px 12px', color: T.textPri, fontSize: 11 }}>{d.issuer}</td>
                      <td style={{ padding: '7px 12px' }}><span style={{ background: TYPE_COLORS[d.type] + '22', color: TYPE_COLORS[d.type], padding: '2px 7px', borderRadius: 4, fontSize: 10, whiteSpace: 'nowrap' }}>{d.type}</span></td>
                      <td style={{ padding: '7px 12px', fontFamily: T.fontMono }}>${d.notional}Bn</td>
                      <td style={{ padding: '7px 12px', fontFamily: T.fontMono }}>{d.coupon.toFixed(2)}%</td>
                      <td style={{ padding: '7px 12px', fontFamily: T.fontMono }}>{d.maturity}</td>
                      <td style={{ padding: '7px 12px', fontFamily: T.fontMono, color: T.green }}>{d.greenium}bps</td>
                      <td style={{ padding: '7px 12px', fontFamily: T.fontMono, color: T.teal }}>{d.rating}</td>
                      <td style={{ padding: '7px 12px', color: d.spoBond ? T.green : T.textSec }}>{d.spoBond ? '✓' : '—'}</td>
                      <td style={{ padding: '7px 12px', fontSize: 11, color: T.textSec }}>{d.region}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 1: Framework Analyzer */}
      {tab === 1 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Framework Coverage</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {FRAMEWORKS.map((fw, i) => {
                  const count = INSTRUMENTS.filter(d => d.framework === fw).length;
                  const pct = (count / INSTRUMENTS.length * 100).toFixed(0);
                  return (
                    <div key={fw}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: T.textPri }}>{fw}</span>
                        <span style={{ fontSize: 12, fontFamily: T.fontMono, color: T.navy }}>{count} ({pct}%)</span>
                      </div>
                      <div style={{ height: 8, background: T.border, borderRadius: 4 }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: [T.green, T.blue, T.indigo, T.teal, T.amber][i], borderRadius: 4 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Verifier Market Share</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {VERIFIERS.map((v, i) => {
                  const count = INSTRUMENTS.filter(d => d.verifier === v).length;
                  const pct = (count / INSTRUMENTS.length * 100).toFixed(0);
                  return (
                    <div key={v}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: T.textPri }}>{v}</span>
                        <span style={{ fontSize: 12, fontFamily: T.fontMono, color: T.navy }}>{count} ({pct}%)</span>
                      </div>
                      <div style={{ height: 8, background: T.border, borderRadius: 4 }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: [T.navy, T.indigo, T.teal, T.green, T.amber, T.blue][i], borderRadius: 4 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Second-Party Opinion Scoring</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.surfaceH }}>
                  {['Instrument', 'Framework', 'Verifier', 'SPO Score', 'Use of Proceeds', 'KPI Robustness', 'Reporting Commitment'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: T.textSec, fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 12).map((d, i) => {
                  const spoScore = 60 + sr(d.id * 11) * 35;
                  return (
                    <tr key={d.id} style={{ borderTop: `1px solid ${T.border}`, background: i % 2 === 0 ? 'transparent' : T.surfaceH }}>
                      <td style={{ padding: '7px 12px', color: T.navy, fontWeight: 600, fontSize: 11 }}>{d.name}</td>
                      <td style={{ padding: '7px 12px', fontSize: 10, color: T.textSec }}>{d.framework.replace('ICMA ', '').replace(' Principles', '')}</td>
                      <td style={{ padding: '7px 12px', fontSize: 11 }}>{d.verifier}</td>
                      <td style={{ padding: '7px 12px', fontFamily: T.fontMono, color: spoScore > 80 ? T.green : spoScore > 65 ? T.amber : T.red }}>{spoScore.toFixed(0)}/100</td>
                      <td style={{ padding: '7px 12px', fontSize: 11 }}>{d.useOfProceeds}</td>
                      <td style={{ padding: '7px 12px', fontFamily: T.fontMono, color: T.teal }}>{(70 + sr(d.id * 13) * 25).toFixed(0)}/100</td>
                      <td style={{ padding: '7px 12px', color: d.spoBond ? T.green : T.amber, fontSize: 11 }}>{d.spoBond ? 'Annual + Event' : 'Annual'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Use of Proceeds */}
      {tab === 2 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Use of Proceeds Waterfall ($Bn)</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sectorBreakdown} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: T.textSec }} tickFormatter={v => `$${v}Bn`} />
                  <YAxis type="category" dataKey="sector" tick={{ fontSize: 10, fill: T.textSec }} width={70} />
                  <Tooltip formatter={v => `$${v}Bn`} />
                  <Bar dataKey="notional" name="Notional $Bn">
                    {sectorBreakdown.map((e, i) => <Cell key={i} fill={SECTOR_COLORS[e.sector]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Climate Impact by Sector</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sectorBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="sector" tick={{ fontSize: 10, fill: T.textSec }} angle={-25} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
                  <Tooltip />
                  <Bar dataKey="impact" name="Climate Impact (Mn tCO₂e)">
                    {sectorBreakdown.map((e, i) => <Cell key={i} fill={SECTOR_COLORS[e.sector]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: KPI Engine */}
      {tab === 3 && (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 4 }}>KPI Step-Up/Down Calculator — Step-Up: +{carbonStepUp}bps on miss</div>
            <input type="range" min={5} max={75} value={carbonStepUp} onChange={e => setCarbonStepUp(+e.target.value)} style={{ width: '100%', marginBottom: 16 }} />
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={kpiStepCalc}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: T.textSec }} angle={-20} textAnchor="end" height={55} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="kpiTarget" name="KPI Target" fill={T.blue} />
                <Bar dataKey="kpiActual" name="KPI Actual" fill={T.green} />
                <Bar dataKey="stepUp" name="Step-Up (bps)" fill={T.red} />
                <Bar dataKey="stepDown" name="Step-Down (bps)" fill={T.teal} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.surfaceH }}>
                  {['Instrument', 'KPI Target', 'KPI Actual', 'Achievement', 'Step Coupon Adj', 'Status'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: T.textSec, fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {kpiStepCalc.map((d, i) => (
                  <tr key={i} style={{ borderTop: `1px solid ${T.border}`, background: i % 2 === 0 ? 'transparent' : T.surfaceH }}>
                    <td style={{ padding: '7px 12px', color: T.navy, fontWeight: 600, fontSize: 11 }}>{d.name}</td>
                    <td style={{ padding: '7px 12px', fontFamily: T.fontMono }}>{d.kpiTarget.toFixed(1)}%</td>
                    <td style={{ padding: '7px 12px', fontFamily: T.fontMono }}>{d.kpiActual}%</td>
                    <td style={{ padding: '7px 12px' }}>
                      <div style={{ height: 8, background: T.border, borderRadius: 4, width: 80 }}>
                        <div style={{ height: '100%', width: `${Math.min(100, d.achievement)}%`, background: d.achievement >= 100 ? T.green : d.achievement >= 75 ? T.amber : T.red, borderRadius: 4 }} />
                      </div>
                      <span style={{ fontFamily: T.fontMono, fontSize: 10 }}>{d.achievement}%</span>
                    </td>
                    <td style={{ padding: '7px 12px', fontFamily: T.fontMono, color: d.stepUp > 0 ? T.red : T.green }}>{d.stepUp > 0 ? `+${d.stepUp}bps` : d.stepDown > 0 ? `-${d.stepDown}bps` : '0'}</td>
                    <td style={{ padding: '7px 12px', fontSize: 11, color: d.achievement >= 100 ? T.green : d.achievement >= 75 ? T.amber : T.red }}>{d.achievement >= 100 ? '✓ On Track' : d.achievement >= 75 ? '⚠ Lagging' : '✗ Step-Up'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Greenium Pricing */}
      {tab === 4 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Greenium by Sector (bps)</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={greeniumBySector}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="sector" tick={{ fontSize: 10, fill: T.textSec }} angle={-25} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 10, fill: T.textSec }} tickFormatter={v => `${v}bps`} />
                  <Tooltip formatter={v => `${v}bps`} />
                  <Bar dataKey="greenium" name="Avg Greenium (bps)">
                    {greeniumBySector.map((e, i) => <Cell key={i} fill={SECTOR_COLORS[e.sector]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Investor Demand Curve</div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={demandCurve}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="yield" tick={{ fontSize: 10, fill: T.textSec }} label={{ value: 'Yield (%)', position: 'insideBottom', offset: -5, fontSize: 11, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 10, fill: T.textSec }} label={{ value: '$Bn', angle: -90, position: 'insideLeft', fontSize: 11, fill: T.textSec }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="demand" stroke={T.green} strokeWidth={2} name="Demand ($Bn)" dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="supply" stroke={T.navy} strokeWidth={2} name="Supply ($Bn)" dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Market Benchmarks */}
      {tab === 5 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Oversubscription by Type</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={typeBreakdown.map(t => ({ ...t, overSub: +(1.5 + sr(TYPES.indexOf(t.type.replace('SLB', 'Sustainability-Linked Bond').replace('Sust. Bond', 'Sustainability Bond')) * 7) * 4).toFixed(1) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="type" tick={{ fontSize: 9, fill: T.textSec }} angle={-20} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 10, fill: T.textSec }} tickFormatter={v => `${v}×`} />
                  <Tooltip formatter={v => `${v}×`} />
                  <Bar dataKey="overSub" name="Avg Oversubscription">
                    {typeBreakdown.map((e, i) => <Cell key={i} fill={Object.values(TYPE_COLORS)[i % 7]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Regional Distribution</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={REGIONS.map(r => {
                  const arr = INSTRUMENTS.filter(d => d.region === r);
                  return { region: r, notional: +(arr.reduce((s, d) => s + d.notional, 0)).toFixed(1), count: arr.length };
                })}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="region" tick={{ fontSize: 10, fill: T.textSec }} angle={-20} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 10, fill: T.textSec }} tickFormatter={v => `$${v}Bn`} />
                  <Tooltip formatter={v => `$${v}Bn`} />
                  <Bar dataKey="notional" name="Notional $Bn" fill={T.indigo} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Investor Profiling */}
      {tab === 6 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Investor AUM & ESG Mandate</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={investorProfiles}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="type" tick={{ fontSize: 10, fill: T.textSec }} angle={-20} textAnchor="end" height={60} />
                  <YAxis yAxisId="l" tick={{ fontSize: 10, fill: T.textSec }} tickFormatter={v => `$${v}Bn`} />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 10, fill: T.textSec }} tickFormatter={v => `${v}%`} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="l" dataKey="aum" name="AUM $Bn" fill={T.navy} />
                  <Bar yAxisId="r" dataKey="esgMandate" name="ESG Mandate %" fill={T.green} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Green Allocation % by Investor Type</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={investorProfiles} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: T.textSec }} tickFormatter={v => `${v}%`} />
                  <YAxis type="category" dataKey="type" tick={{ fontSize: 10, fill: T.textSec }} width={90} />
                  <Tooltip formatter={v => `${v}%`} />
                  <Bar dataKey="greenAlloc" name="Green Allocation %" fill={T.teal} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Tab 7: Reporting Suite */}
      {tab === 7 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
            {reportingMetrics.map((m, i) => (
              <div key={i} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 11, color: T.textSec, textTransform: 'uppercase', letterSpacing: 1 }}>{m.metric}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: T.navy, margin: '6px 0' }}>{m.value.toLocaleString()}</div>
                <div style={{ fontSize: 11, color: T.textSec }}>{m.unit}</div>
                <div style={{ fontSize: 11, color: T.green, marginTop: 4 }}>{m.change} YoY</div>
              </div>
            ))}
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Impact Reporting by Instrument</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.surfaceH }}>
                  {['Instrument', 'Sector', 'Notional', 'Climate Impact', 'SDG Alignment', 'Bid Cover', 'Status'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: T.textSec, fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 12).map((d, i) => (
                  <tr key={d.id} style={{ borderTop: `1px solid ${T.border}`, background: i % 2 === 0 ? 'transparent' : T.surfaceH }}>
                    <td style={{ padding: '7px 12px', color: T.navy, fontWeight: 600, fontSize: 11 }}>{d.name}</td>
                    <td style={{ padding: '7px 12px' }}><span style={{ background: SECTOR_COLORS[d.sector] + '22', color: SECTOR_COLORS[d.sector], padding: '2px 7px', borderRadius: 4, fontSize: 10 }}>{d.sector}</span></td>
                    <td style={{ padding: '7px 12px', fontFamily: T.fontMono }}>${d.notional}Bn</td>
                    <td style={{ padding: '7px 12px', fontFamily: T.fontMono, color: T.green }}>{d.climateImpact.toFixed(0)}Mn tCO₂e</td>
                    <td style={{ padding: '7px 12px', fontSize: 10 }}>{d.sdgAlignment.join(', ')}</td>
                    <td style={{ padding: '7px 12px', fontFamily: T.fontMono }}>{d.bidCover}×</td>
                    <td style={{ padding: '7px 12px', color: d.kpiActual >= d.kpiTarget * 0.9 ? T.green : T.amber, fontSize: 11 }}>{d.kpiActual >= d.kpiTarget * 0.9 ? '✓ Compliant' : '⚠ Review'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
