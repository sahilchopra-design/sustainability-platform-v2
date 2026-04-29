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

const PROJECT_TYPES = ['Rooftop Commercial', 'Rooftop Residential', 'Carport', 'Community Solar', 'Ground-Mount C&I'];
const US_STATES = ['Massachusetts', 'New York', 'New Jersey', 'Illinois', 'Maryland', 'Colorado', 'Minnesota', 'California', 'Virginia', 'Washington DC'];
const NET_METERING_POLICIES = ['Full NEM 1:1', 'NEM 2.0 (TOU)', 'NEM 3.0 (Export Rate)', 'Virtual NEM', 'Avoided Cost Only'];

const PROJECTS = Array.from({ length: 20 }, (_, i) => {
  const capacitykW = 10 + Math.round(sr(i * 7) * 4990);
  const isCommunitySolar = i % PROJECT_TYPES.length === 3;
  const subscriberCount = isCommunitySolar ? 20 + Math.round(sr(i * 11) * 480) : 1;
  const avgBillSavingPct = 15 + sr(i * 13) * 30;
  const systemCostPerW = 2.8 + sr(i * 17) * 1.4;
  const annualSavingsPerSubscriber = 400 + sr(i * 19) * 800;
  const itcPct = 30 + sr(i * 23) * 10;
  const srecPrice = 50 + sr(i * 29) * 200;
  const paybackYr = 5 + sr(i * 31) * 8;
  const lcoe = 55 + sr(i * 37) * 55;
  const lmiShare = 15 + sr(i * 41) * 30;
  const localJobs = Math.round(capacitykW / 1000 * (2 + sr(i * 43) * 4));
  return {
    id: `EC5-${String(i + 1).padStart(2, '0')}`,
    name: `DCS-${US_STATES[i % US_STATES.length].slice(0, 2).toUpperCase()}-${String(i + 1).padStart(3, '0')}`,
    state: US_STATES[i % US_STATES.length],
    projectType: PROJECT_TYPES[i % PROJECT_TYPES.length],
    capacitykW,
    netMeteringPolicy: NET_METERING_POLICIES[i % NET_METERING_POLICIES.length],
    subscriberCount,
    avgBillSavingPct: +avgBillSavingPct.toFixed(1),
    systemCostPerW: +systemCostPerW.toFixed(2),
    paybackYr: +paybackYr.toFixed(1),
    lcoe: +lcoe.toFixed(1),
    itcPct: +itcPct.toFixed(1),
    srecPrice: +srecPrice.toFixed(0),
    srecRevenueAnnual: +(capacitykW * 0.15 * srecPrice / 1000).toFixed(1),
    annualSavingsPerSubscriber: +annualSavingsPerSubscriber.toFixed(0),
    lmiSharePct: +lmiShare.toFixed(1),
    localJobsCreated: localJobs,
    totalSystemCostM: +(systemCostPerW * capacitykW / 1e6).toFixed(2),
  };
});

const SREC_MARKET_DATA = [
  { state: 'Massachusetts', price: 285, market: 'SREC II', status: 'Active' },
  { state: 'New Jersey', price: 230, market: 'SREC I/II', status: 'Active' },
  { state: 'Maryland', price: 75, market: 'SREC', status: 'Active' },
  { state: 'Washington DC', price: 420, market: 'DC SREC', status: 'Active' },
  { state: 'Illinois', price: 70, market: 'SREC', status: 'Active' },
  { state: 'Pennsylvania', price: 40, market: 'SREC', status: 'Active' },
  { state: 'Virginia', price: 55, market: 'SREC', status: 'Developing' },
  { state: 'Colorado', price: 0, market: 'REC (No Premium)', status: 'No Program' },
];

const NET_METERING_IMPACT = [
  { policy: 'Full NEM 1:1', billReduction: 90, payback: 6.5, solarValue: 'Full retail rate credit' },
  { policy: 'NEM 2.0 (TOU)', billReduction: 78, payback: 7.8, solarValue: 'TOU-adjusted retail' },
  { policy: 'NEM 3.0 (Export Rate)', billReduction: 55, payback: 9.5, solarValue: 'Avoided cost export' },
  { policy: 'Virtual NEM', billReduction: 70, payback: 8.2, solarValue: 'Bill credit transfer' },
  { policy: 'Avoided Cost Only', billReduction: 35, payback: 12.0, solarValue: 'Wholesale/avoided cost' },
];

const LMI_PROGRAMS = [
  { program: 'IRA §48E LMI Adder', benefit: '+20% ITC bonus', eligibility: 'Low-income community/QLICE zone', state: 'Federal' },
  { program: 'MASH / SASH (CA)', benefit: '$1.00–2.00/W rebate', eligibility: 'Income <80% AMI', state: 'California' },
  { program: 'NY-Sun LMI Adder', benefit: '$0.40/W bonus', eligibility: 'Income-qualified households', state: 'New York' },
  { program: 'MA SMART LMI Adder', benefit: '+$0.05/kWh', eligibility: 'Low-income community solar', state: 'Massachusetts' },
  { program: 'IL Solar for All', benefit: '50% bill credit', eligibility: 'Income <80% AMI', state: 'Illinois' },
  { program: 'CO EnergySmart LMI', benefit: '$1,500 rebate', eligibility: 'Income-qualified, rural', state: 'Colorado' },
];

const KPI_CARD = ({ label, value, unit, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 20px', flex: 1, minWidth: 140 }}>
    <div style={{ fontSize: 12, color: T.sub, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.text }}>{value}</div>
    {unit && <div style={{ fontSize: 11, color: T.sub }}>{unit}</div>}
  </div>
);

const TABS = [
  { id: 'portfolio', label: 'Portfolio Map' },
  { id: 'netmetering', label: 'Net Metering Economics' },
  { id: 'community', label: 'Community Solar Subs' },
  { id: 'srec', label: 'SREC Market' },
  { id: 'lmi', label: 'Low-Income Access' },
  { id: 'policy', label: 'Policy Tracker' },
];

export default function DistributedCommunitySolarPage() {
  const [activeTab, setActiveTab] = useState('portfolio');
  const [selectedState, setSelectedState] = useState('All');
  const [selectedType, setSelectedType] = useState('All');

  const filtered = useMemo(() => {
    let data = PROJECTS;
    if (selectedState !== 'All') data = data.filter(p => p.state === selectedState);
    if (selectedType !== 'All') data = data.filter(p => p.projectType === selectedType);
    return data;
  }, [selectedState, selectedType]);

  const kpis = useMemo(() => {
    const totalKw = filtered.reduce((s, p) => s + p.capacitykW, 0);
    const avgBillSaving = filtered.length ? filtered.reduce((s, p) => s + p.avgBillSavingPct, 0) / filtered.length : 0;
    const avgPayback = filtered.length ? filtered.reduce((s, p) => s + p.paybackYr, 0) / filtered.length : 0;
    const totalSubscribers = filtered.reduce((s, p) => s + p.subscriberCount, 0);
    const avgLcoe = filtered.length ? filtered.reduce((s, p) => s + p.lcoe, 0) / filtered.length : 0;
    const totalJobs = filtered.reduce((s, p) => s + p.localJobsCreated, 0);
    return { totalKw, avgBillSaving, avgPayback, totalSubscribers, avgLcoe, totalJobs };
  }, [filtered]);

  const srecRevenueData = useMemo(() =>
    filtered.filter(p => p.srecPrice > 50).slice(0, 12).map(p => ({
      name: p.name,
      srecRev: p.srecRevenueAnnual,
      srecPrice: p.srecPrice,
    })), [filtered]);

  const paybackByPolicy = NET_METERING_IMPACT;

  const billSavingByType = useMemo(() => {
    const byType = {};
    filtered.forEach(p => {
      if (!byType[p.projectType]) byType[p.projectType] = { type: p.projectType, count: 0, sumSaving: 0 };
      byType[p.projectType].count++;
      byType[p.projectType].sumSaving += p.avgBillSavingPct;
    });
    return Object.values(byType).map(t => ({
      type: t.type.split(' ')[0],
      avgSaving: t.count ? +(t.sumSaving / t.count).toFixed(1) : 0,
    }));
  }, [filtered]);

  const lmiData = useMemo(() =>
    filtered.slice(0, 12).map(p => ({
      name: p.name,
      lmiShare: p.lmiSharePct,
      subscribers: p.subscriberCount,
    })), [filtered]);

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: T.sub, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>EP-EC5 · Solar Energy Finance</div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: T.text, margin: 0 }}>Distributed & Community Solar Analytics</h1>
          <p style={{ color: T.sub, marginTop: 6, fontSize: 14 }}>
            Rooftop, carport and community solar project finance — net metering economics, SREC markets, subscriber analytics and LMI access programmes.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <select value={selectedState} onChange={e => setSelectedState(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.card, fontSize: 13 }}>
            <option value="All">All States</option>
            {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={selectedType} onChange={e => setSelectedType(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.card, fontSize: 13 }}>
            <option value="All">All Types</option>
            {PROJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <div style={{ marginLeft: 'auto', fontSize: 13, color: T.sub, alignSelf: 'center' }}>
            {filtered.length} projects · US Community Solar: 6.5 GW installed (SEIA Q2 2023)
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <KPI_CARD label="Total Capacity" value={(kpis.totalKw / 1000).toFixed(1)} unit="MWp" color={T.blue} />
          <KPI_CARD label="Avg Bill Saving" value={kpis.avgBillSaving.toFixed(1)} unit="%" color={T.green} />
          <KPI_CARD label="Avg Payback" value={kpis.avgPayback.toFixed(1)} unit="years" color={T.teal} />
          <KPI_CARD label="Total Subscribers" value={kpis.totalSubscribers.toLocaleString()} unit="households/businesses" color={T.gold} />
          <KPI_CARD label="Avg LCOE" value={kpis.avgLcoe.toFixed(1)} unit="$/MWh" color={T.indigo} />
          <KPI_CARD label="Local Jobs" value={kpis.totalJobs.toLocaleString()} unit="FTE created" color={T.sage} />
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
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.navy, color: '#fff' }}>
                  {['ID', 'Name', 'State', 'Type', 'kWp', 'Net Metering', 'Subscribers', 'Bill Saving %', 'Payback (yr)', 'ITC %', 'SREC $/REC', 'SREC Rev $k', 'LMI %', 'Jobs'].map(h => (
                    <th key={h} style={{ padding: '10px 10px', textAlign: 'left', fontWeight: 600, fontSize: 11, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr key={p.id} style={{ background: i % 2 === 0 ? T.card : '#F9F8F5', borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '7px 10px', color: T.sub, fontFamily: 'monospace', fontSize: 11 }}>{p.id}</td>
                    <td style={{ padding: '7px 10px', fontWeight: 600 }}>{p.name}</td>
                    <td style={{ padding: '7px 10px' }}>{p.state}</td>
                    <td style={{ padding: '7px 10px', fontSize: 11 }}>{p.projectType}</td>
                    <td style={{ padding: '7px 10px', textAlign: 'right' }}>{p.capacitykW.toLocaleString()}</td>
                    <td style={{ padding: '7px 10px', fontSize: 11 }}>{p.netMeteringPolicy.split(' ')[0]}</td>
                    <td style={{ padding: '7px 10px', textAlign: 'right' }}>{p.subscriberCount}</td>
                    <td style={{ padding: '7px 10px', textAlign: 'right', color: T.green, fontWeight: 600 }}>{p.avgBillSavingPct}</td>
                    <td style={{ padding: '7px 10px', textAlign: 'right' }}>{p.paybackYr}</td>
                    <td style={{ padding: '7px 10px', textAlign: 'right', color: T.indigo }}>{p.itcPct}</td>
                    <td style={{ padding: '7px 10px', textAlign: 'right', color: p.srecPrice > 100 ? T.gold : T.sub }}>{p.srecPrice}</td>
                    <td style={{ padding: '7px 10px', textAlign: 'right' }}>{p.srecRevenueAnnual}</td>
                    <td style={{ padding: '7px 10px', textAlign: 'right', color: p.lmiSharePct >= 25 ? T.teal : T.sub }}>{p.lmiSharePct}</td>
                    <td style={{ padding: '7px 10px', textAlign: 'right' }}>{p.localJobsCreated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'netmetering' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Bill Reduction & Payback by NEM Policy</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={paybackByPolicy} margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="policy" tick={{ fontSize: 9 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} label={{ value: '% Bill Red.', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} label={{ value: 'Payback yr', angle: 90, position: 'insideRight', fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="billReduction" name="Bill Reduction %" fill={T.green} />
                  <Bar yAxisId="right" dataKey="payback" name="Payback (yr)" fill={T.amber} opacity={0.8} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Avg Bill Saving % by Project Type</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={billSavingByType} margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="type" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={v => [`${v}%`, 'Avg Bill Saving']} />
                  <Bar dataKey="avgSaving" name="Avg Bill Saving %">
                    {billSavingByType.map((_, i) => <Cell key={i} fill={[T.blue, T.green, T.teal, T.gold, T.indigo][i % 5]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 10, padding: 16, border: `1px solid ${T.border}`, gridColumn: '1/-1' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: T.bg }}>
                      {['NEM Policy', 'Bill Reduction', 'Payback (yr)', 'Solar Value Mechanism'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, fontSize: 12 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {NET_METERING_IMPACT.map((p, i) => (
                      <tr key={p.policy} style={{ background: i % 2 === 0 ? T.card : '#F9F8F5', borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '8px 12px', fontWeight: 600 }}>{p.policy}</td>
                        <td style={{ padding: '8px 12px', color: T.green, fontWeight: 600 }}>{p.billReduction}%</td>
                        <td style={{ padding: '8px 12px' }}>{p.payback} yrs</td>
                        <td style={{ padding: '8px 12px', color: T.sub, fontSize: 12 }}>{p.solarValue}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'community' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Subscriber Count by Project</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={filtered.slice(0, 14).map(p => ({ name: p.name, subscribers: p.subscriberCount }))} margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={v => [v, 'Subscribers']} />
                  <Bar dataKey="subscribers" name="Subscribers">
                    {filtered.slice(0, 14).map((p, i) => <Cell key={i} fill={p.subscriberCount > 200 ? T.blue : p.subscriberCount > 100 ? T.teal : T.green} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Annual Savings per Subscriber ($)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={filtered.slice(0, 12).map(p => ({ name: p.name, savings: p.annualSavingsPerSubscriber }))} margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={v => [`$${v}`, 'Annual Savings']} />
                  <Bar dataKey="savings" name="Annual Savings $">
                    {filtered.slice(0, 12).map((p, i) => <Cell key={i} fill={T.gold} opacity={0.6 + i * 0.03} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 10, padding: 16, border: `1px solid ${T.border}`, gridColumn: '1/-1' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 15 }}>Community Solar Key Metrics (SEIA Q2 2023)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {[
                  { metric: 'US CS Installed', value: '6.5 GW', note: 'Cumulative through Q2 2023', color: T.blue },
                  { metric: 'CS Subscribers (US)', value: '900k+', note: 'Households & businesses', color: T.green },
                  { metric: 'Avg Subscription Size', value: '1–10 kW', note: 'Virtual net metering share', color: T.teal },
                  { metric: 'IRA LMI CS Adder', value: '+20% ITC', note: 'Income-qualified projects', color: T.gold },
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

        {activeTab === 'srec' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>SREC Price by State ($/REC)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={[...SREC_MARKET_DATA].sort((a, b) => b.price - a.price)} margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="state" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={v => [`$${v}`, 'SREC Price']} />
                  <Bar dataKey="price" name="SREC $/REC">
                    {[...SREC_MARKET_DATA].sort((a, b) => b.price - a.price).map((d, i) => (
                      <Cell key={i} fill={d.price > 200 ? T.gold : d.price > 50 ? T.teal : T.sub} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>SREC Annual Revenue by Project ($k)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={srecRevenueData.slice(0, 10)} margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v, n) => [n === 'srecRev' ? `$${v}k` : `$${v}/REC`, n]} />
                  <Legend />
                  <Bar dataKey="srecRev" name="SREC Rev ($k)" fill={T.gold} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 10, border: `1px solid ${T.border}`, overflow: 'hidden', gridColumn: '1/-1' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: T.navy, color: '#fff' }}>
                    {['State', 'Program', 'SREC Price ($/REC)', 'Market Status'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SREC_MARKET_DATA.map((s, i) => (
                    <tr key={s.state} style={{ background: i % 2 === 0 ? T.card : '#F9F8F5', borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '10px 16px', fontWeight: 600 }}>{s.state}</td>
                      <td style={{ padding: '10px 16px' }}>{s.market}</td>
                      <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 700, color: s.price > 200 ? T.gold : s.price > 0 ? T.teal : T.sub }}>${s.price}</td>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: s.status === 'Active' ? '#D1FAE5' : s.status === 'Developing' ? '#DBEAFE' : '#F3F4F6', color: s.status === 'Active' ? T.green : s.status === 'Developing' ? T.blue : T.sub }}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'lmi' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>LMI Share (%) by Project</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={lmiData} margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                  <YAxis domain={[0, 50]} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v, n) => [n === 'lmiShare' ? `${v}%` : v, n === 'lmiShare' ? 'LMI Share' : 'Subscribers']} />
                  <Legend />
                  <Bar dataKey="lmiShare" name="LMI Share %" fill={T.teal} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>LMI Programme Summary</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {LMI_PROGRAMS.map((p, i) => (
                  <div key={p.program} style={{ padding: '10px 14px', background: T.bg, borderRadius: 8, borderLeft: `3px solid ${[T.blue, T.green, T.teal, T.gold, T.indigo, T.sage][i % 6]}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{p.program}</span>
                      <span style={{ fontSize: 12, color: T.sub }}>{p.state}</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.green, marginTop: 2 }}>{p.benefit}</div>
                    <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{p.eligibility}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'policy' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
              {[
                { title: 'IRA §48E Residential ITC', value: '30%', sub: '+20% LMI adder available', color: T.blue },
                { title: 'Net Metering States', value: '38', sub: 'States with full/partial NEM', color: T.green },
                { title: 'Community Solar States', value: '22', sub: 'Active CS program states', color: T.teal },
              ].map(item => (
                <KPI_CARD key={item.title} label={item.title} value={item.value} unit={item.sub} color={item.color} />
              ))}
            </div>
            <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Payback Period by Net Metering Policy Type</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={NET_METERING_IMPACT} margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="policy" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 14]} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={v => [`${v} yrs`, 'Payback']} />
                  <Bar dataKey="payback" name="Payback (yr)">
                    {NET_METERING_IMPACT.map((p, i) => (
                      <Cell key={i} fill={p.payback < 8 ? T.green : p.payback < 10 ? T.teal : T.amber} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div style={{ marginTop: 32, padding: '16px 0', borderTop: `1px solid ${T.border}`, fontSize: 11, color: T.sub }}>
          Data sources: SEIA Q2 2023 Solar Market Insight · Lawrence Berkeley LBNL Tracking the Sun (2023) · NRDC Community Solar Playbook · DSIRE.org Net Metering Policy Database · Generation180 Community Solar Subscriber Report · IRA §48E/§25D Residential Credit Guidance (US Treasury 2023)
        </div>
      </div>
    </div>
  );
}
