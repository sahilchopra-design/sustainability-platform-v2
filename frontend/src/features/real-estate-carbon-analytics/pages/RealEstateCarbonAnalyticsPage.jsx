import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, LineChart, Line, AreaChart, Area,
  CartesianGrid, Legend,
} from 'recharts';

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f6f4f0',
  navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f',
  teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c',
  surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace',
};

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const BUILD_TYPES = ['Office', 'Retail', 'Residential', 'Industrial', 'Hotel', 'Mixed-Use', 'Logistics'];
const CITIES = ['London', 'Manchester', 'Birmingham', 'Bristol', 'Leeds', 'Edinburgh', 'Glasgow', 'Cardiff'];
const CERTS_LIST = [['BREEAM'], ['LEED'], ['WELL'], ['BREEAM', 'LEED'], ['None'], ['NABERS'], ['None'], ['WELL', 'LEED']];

const BUILDINGS = Array.from({ length: 70 }, (_, i) => {
  const type = BUILD_TYPES[Math.floor(sr(i * 7) * BUILD_TYPES.length)];
  const city = CITIES[Math.floor(sr(i * 11) * CITIES.length)];
  const embodiedCarbon = Math.round(200 + sr(i * 3) * 800);
  const operationalCarbon = parseFloat((15 + sr(i * 5) * 85).toFixed(1));
  const size = Math.round(500 + sr(i * 9) * 9500);
  const totalLifecycleCarbon = Math.round(embodiedCarbon * size / 1000 + operationalCarbon * size * 30 / 1000);
  const netZeroYear = sr(i * 13) > 0.3 ? 2030 + Math.round(sr(i * 17) * 30) : null;
  const retrofitCost = parseFloat((0.5 + sr(i * 19) * 14.5).toFixed(2));
  const carbonSaving = Math.round(10 + sr(i * 23) * 490);
  const certifications = CERTS_LIST[Math.floor(sr(i * 29) * CERTS_LIST.length)];
  const scope1 = Math.round(50 + sr(i * 31) * 450);
  const scope2 = Math.round(100 + sr(i * 37) * 900);
  const scope3 = Math.round(200 + sr(i * 41) * 1800);
  const netZeroStatus = netZeroYear !== null && netZeroYear <= 2040 ? 'Aligned' : netZeroYear !== null ? 'Partially' : 'Not Aligned';
  return {
    id: i + 1,
    name: `${type} ${city} ${i + 1}`,
    type, city, embodiedCarbon, operationalCarbon, totalLifecycleCarbon,
    netZeroYear, retrofitCost, carbonSaving, certifications, scope1, scope2, scope3, netZeroStatus,
  };
});

const TABS = [
  'Carbon Overview', 'Embodied Carbon', 'Operational Carbon', 'Lifecycle Analysis',
  'Retrofit Pathway', 'Net Zero Timeline', 'Scope Breakdown', 'Benchmark Analysis',
];

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px', flex: 1, minWidth: 160 }}>
    <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: color || T.navy }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>{sub}</div>}
  </div>
);

export default function RealEstateCarbonAnalyticsPage() {
  const [tab, setTab] = useState('Carbon Overview');
  const [filterType, setFilterType] = useState('All');
  const [filterCity, setFilterCity] = useState('All');
  const [filterNZStatus, setFilterNZStatus] = useState('All');
  const [carbonPrice, setCarbonPrice] = useState(75);
  const [retrofitBudget, setRetrofitBudget] = useState(50);

  const filtered = useMemo(() => BUILDINGS.filter(b => {
    if (filterType !== 'All' && b.type !== filterType) return false;
    if (filterCity !== 'All' && b.city !== filterCity) return false;
    if (filterNZStatus !== 'All' && b.netZeroStatus !== filterNZStatus) return false;
    return true;
  }), [filterType, filterCity, filterNZStatus]);

  const totalLifecycle = filtered.length ? filtered.reduce((s, b) => s + b.totalLifecycleCarbon, 0).toLocaleString() : '0';
  const avgEmbodied = filtered.length ? (filtered.reduce((s, b) => s + b.embodiedCarbon, 0) / filtered.length).toFixed(0) : '0';
  const avgOperational = filtered.length ? (filtered.reduce((s, b) => s + b.operationalCarbon, 0) / filtered.length).toFixed(1) : '0.0';
  const netZeroPct = filtered.length ? ((filtered.filter(b => b.netZeroStatus === 'Aligned').length / filtered.length) * 100).toFixed(1) : '0.0';

  const carbonByType = useMemo(() => BUILD_TYPES.map(t => {
    const arr = filtered.filter(b => b.type === t);
    return {
      name: t,
      'Avg Embodied (kgCO2e/sqm)': arr.length ? parseFloat((arr.reduce((s, b) => s + b.embodiedCarbon, 0) / arr.length).toFixed(0)) : 0,
      'Avg Operational (kgCO2e/sqm/yr)': arr.length ? parseFloat((arr.reduce((s, b) => s + b.operationalCarbon, 0) / arr.length).toFixed(1)) : 0,
    };
  }), [filtered]);

  const scatterData = useMemo(() => filtered.map(b => ({
    x: b.embodiedCarbon, y: b.operationalCarbon, name: b.name,
  })), [filtered]);

  const reductionPathway = useMemo(() => {
    const years = [2025, 2028, 2031, 2034, 2037, 2040, 2043, 2046, 2049, 2052, 2055];
    const avgOp = filtered.length ? filtered.reduce((s, b) => s + b.operationalCarbon, 0) / filtered.length : 50;
    return years.map((yr, i) => ({
      year: yr,
      'Portfolio Avg (kgCO2e/sqm/yr)': parseFloat((avgOp * Math.pow(0.93, i)).toFixed(1)),
      'Net Zero Pathway': parseFloat((avgOp * Math.pow(0.87, i)).toFixed(1)),
    }));
  }, [filtered]);

  const scopeAreaData = useMemo(() => {
    const byType = BUILD_TYPES.map(t => {
      const arr = filtered.filter(b => b.type === t);
      return {
        name: t,
        'Scope 1': arr.length ? Math.round(arr.reduce((s, b) => s + b.scope1, 0) / arr.length) : 0,
        'Scope 2': arr.length ? Math.round(arr.reduce((s, b) => s + b.scope2, 0) / arr.length) : 0,
        'Scope 3': arr.length ? Math.round(arr.reduce((s, b) => s + b.scope3, 0) / arr.length) : 0,
      };
    });
    return byType;
  }, [filtered]);

  const nzTimelineData = useMemo(() => {
    const years = {};
    filtered.filter(b => b.netZeroYear).forEach(b => { years[b.netZeroYear] = (years[b.netZeroYear] || 0) + 1; });
    return Object.entries(years).sort((a, b) => +a[0] - +b[0]).map(([yr, cnt]) => ({ year: yr, 'Buildings': cnt }));
  }, [filtered]);

  const retrofitAffordable = useMemo(() => {
    return filtered.filter(b => b.retrofitCost <= retrofitBudget).slice(0, 15).map(b => ({
      name: b.name.slice(0, 16),
      'Retrofit Cost £M': b.retrofitCost,
      'Carbon Saving tCO2e/yr': b.carbonSaving,
      'Carbon Value £M/yr': parseFloat((b.carbonSaving * carbonPrice / 1000000).toFixed(3)),
    }));
  }, [filtered, retrofitBudget, carbonPrice]);

  const embodiedByCity = useMemo(() => CITIES.map(c => {
    const arr = filtered.filter(b => b.city === c);
    return { name: c, 'Avg Embodied Carbon': arr.length ? parseFloat((arr.reduce((s, b) => s + b.embodiedCarbon, 0) / arr.length).toFixed(0)) : 0 };
  }), [filtered]);

  const opByCity = useMemo(() => CITIES.map(c => {
    const arr = filtered.filter(b => b.city === c);
    return { name: c, 'Avg Operational (kgCO2e/sqm/yr)': arr.length ? parseFloat((arr.reduce((s, b) => s + b.operationalCarbon, 0) / arr.length).toFixed(1)) : 0 };
  }), [filtered]);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: T.textPri }}>
      <div style={{ background: T.navy, padding: '20px 32px', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ fontSize: 11, color: T.gold, fontFamily: T.fontMono, letterSpacing: 2, marginBottom: 4 }}>EP-DE6 · GREEN REAL ESTATE & BUILT ENVIRONMENT</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>Real Estate Carbon Analytics</div>
        <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>70 buildings · Embodied & operational carbon · Lifecycle analysis · Retrofit pathways · Net zero timeline</div>
      </div>

      <div style={{ background: T.cream, borderBottom: `1px solid ${T.border}`, padding: '12px 32px', display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {[['Type', filterType, setFilterType, ['All', ...BUILD_TYPES]],
          ['City', filterCity, setFilterCity, ['All', ...CITIES]],
          ['Net Zero Status', filterNZStatus, setFilterNZStatus, ['All', 'Aligned', 'Partially', 'Not Aligned']]].map(([label, val, setter, opts]) => (
          <label key={label} style={{ fontSize: 12, color: T.textSec, display: 'flex', alignItems: 'center', gap: 6 }}>
            {label}:
            <select value={val} onChange={e => setter(e.target.value)}
              style={{ fontSize: 12, padding: '3px 8px', borderRadius: 4, border: `1px solid ${T.border}`, background: T.card }}>
              {opts.map(o => <option key={o}>{o}</option>)}
            </select>
          </label>
        ))}
        <label style={{ fontSize: 12, color: T.textSec, display: 'flex', alignItems: 'center', gap: 6 }}>
          Carbon £{carbonPrice}/tCO2:
          <input type="range" min={20} max={200} value={carbonPrice} onChange={e => setCarbonPrice(+e.target.value)} style={{ width: 100 }} />
        </label>
        <label style={{ fontSize: 12, color: T.textSec, display: 'flex', alignItems: 'center', gap: 6 }}>
          Retrofit Budget £{retrofitBudget}M:
          <input type="range" min={1} max={100} value={retrofitBudget} onChange={e => setRetrofitBudget(+e.target.value)} style={{ width: 100 }} />
        </label>
        <span style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono }}>{filtered.length} / {BUILDINGS.length} buildings</span>
      </div>

      <div style={{ display: 'flex', gap: 16, padding: '20px 32px', flexWrap: 'wrap' }}>
        <KpiCard label="Total Lifecycle Carbon" value={`${totalLifecycle} tCO2e`} sub="filtered buildings" color={T.navy} />
        <KpiCard label="Avg Embodied Carbon" value={`${avgEmbodied} kgCO2e/sqm`} sub="construction phase" color={T.red} />
        <KpiCard label="Avg Operational Carbon" value={`${avgOperational} kgCO2e/sqm/yr`} sub="in-use emissions" color={T.amber} />
        <KpiCard label="Net Zero Aligned" value={`${netZeroPct}%`} sub="target by 2040" color={T.green} />
      </div>

      <div style={{ display: 'flex', gap: 0, padding: '0 32px', borderBottom: `1px solid ${T.border}` }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '10px 14px', fontSize: 12, fontWeight: tab === t ? 700 : 400, background: 'none', border: 'none',
              borderBottom: tab === t ? `3px solid ${T.gold}` : '3px solid transparent',
              color: tab === t ? T.navy : T.textSec, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {t}
          </button>
        ))}
      </div>

      <div style={{ padding: '24px 32px' }}>
        {tab === 'Carbon Overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: T.navy }}>Carbon Intensity by Building Type</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={carbonByType}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Avg Embodied (kgCO2e/sqm)" fill={T.red} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Avg Operational (kgCO2e/sqm/yr)" fill={T.amber} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: T.navy }}>Embodied vs Operational Carbon (Scatter)</div>
              <ResponsiveContainer width="100%" height={280}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="x" name="Embodied kgCO2e/sqm" tick={{ fontSize: 11 }} label={{ value: 'Embodied', position: 'insideBottom', offset: -5, fontSize: 11 }} />
                  <YAxis dataKey="y" name="Operational kgCO2e/sqm/yr" tick={{ fontSize: 11 }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter data={scatterData} fill={T.teal} fillOpacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 'Embodied Carbon' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: T.navy }}>Avg Embodied Carbon by City (kgCO2e/sqm)</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={embodiedByCity}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="Avg Embodied Carbon" fill={T.red} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: T.navy }}>Highest Embodied Carbon Buildings</div>
              {[...filtered].sort((a, b) => b.embodiedCarbon - a.embodiedCarbon).slice(0, 10).map(b => (
                <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${T.borderL}`, fontSize: 12 }}>
                  <span>{b.name}</span>
                  <span style={{ fontFamily: T.fontMono, color: b.embodiedCarbon > 700 ? T.red : T.amber, fontSize: 11 }}>{b.embodiedCarbon} kgCO2e/sqm</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'Operational Carbon' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: T.navy }}>Avg Operational Carbon by City (kgCO2e/sqm/yr)</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={opByCity}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="Avg Operational (kgCO2e/sqm/yr)" fill={T.amber} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: T.navy }}>Embodied vs Operational (Scatter)</div>
              <ResponsiveContainer width="100%" height={280}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="x" name="Embodied" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="y" name="Operational" tick={{ fontSize: 11 }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter data={scatterData} fill={T.indigo} fillOpacity={0.6} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 'Lifecycle Analysis' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: T.navy }}>Carbon Intensity by Building Type</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={carbonByType}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Avg Embodied (kgCO2e/sqm)" fill={T.red} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Avg Operational (kgCO2e/sqm/yr)" fill={T.amber} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: T.navy }}>Highest Lifecycle Carbon Buildings</div>
              {[...filtered].sort((a, b) => b.totalLifecycleCarbon - a.totalLifecycleCarbon).slice(0, 10).map(b => (
                <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${T.borderL}`, fontSize: 12 }}>
                  <span>{b.name}</span>
                  <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.red }}>{b.totalLifecycleCarbon.toLocaleString()} tCO2e</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'Retrofit Pathway' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: T.navy }}>Affordable Retrofits (Budget £{retrofitBudget}M) — Carbon Value at £{carbonPrice}/tCO2</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={retrofitAffordable.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Retrofit Cost £M" fill={T.orange} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Carbon Saving tCO2e/yr" fill={T.green} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: T.navy }}>Best ROI Retrofits ({retrofitAffordable.length} affordable)</div>
              {retrofitAffordable.slice(0, 10).map((r, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${T.borderL}`, fontSize: 12 }}>
                  <span>{r.name}</span>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: T.fontMono, fontSize: 11, color: T.green }}>{r['Carbon Saving tCO2e/yr'].toLocaleString()} tCO2e/yr</div>
                    <div style={{ fontSize: 10, color: T.textSec }}>£{r['Retrofit Cost £M']}M cost</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'Net Zero Timeline' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: T.navy }}>Net Zero Target Year Distribution</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={nzTimelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="Buildings" fill={T.teal} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: T.navy }}>Net Zero Status Summary</div>
              {[
                { status: 'Aligned (by 2040)', count: filtered.filter(b => b.netZeroStatus === 'Aligned').length, color: T.green },
                { status: 'Partially (2041-2060)', count: filtered.filter(b => b.netZeroStatus === 'Partially').length, color: T.amber },
                { status: 'Not Aligned', count: filtered.filter(b => b.netZeroStatus === 'Not Aligned').length, color: T.red },
              ].map(s => (
                <div key={s.status} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${T.borderL}`, fontSize: 13 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, display: 'inline-block' }} />
                    {s.status}
                  </span>
                  <span style={{ fontFamily: T.fontMono, fontWeight: 700, color: s.color }}>{s.count}</span>
                </div>
              ))}
              <div style={{ marginTop: 16, padding: 12, background: T.sub, borderRadius: 6 }}>
                <div style={{ fontSize: 12, color: T.textSec }}>Carbon exposure (not aligned)</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: T.red, fontFamily: T.fontMono, marginTop: 4 }}>
                  £{(filtered.filter(b => b.netZeroStatus === 'Not Aligned').reduce((s, b) => s + b.totalLifecycleCarbon, 0) * carbonPrice / 1e9).toFixed(1)}Bn
                </div>
                <div style={{ fontSize: 11, color: T.textSec }}>at £{carbonPrice}/tCO2</div>
              </div>
            </div>
          </div>
        )}

        {tab === 'Scope Breakdown' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: T.navy }}>Scope 1 / 2 / 3 Breakdown by Building Type (tCO2e avg)</div>
              <ResponsiveContainer width="100%" height={340}>
                <AreaChart data={scopeAreaData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="Scope 1" stroke={T.red} fill={T.red} fillOpacity={0.4} stackId="1" />
                  <Area type="monotone" dataKey="Scope 2" stroke={T.amber} fill={T.amber} fillOpacity={0.4} stackId="1" />
                  <Area type="monotone" dataKey="Scope 3" stroke={T.indigo} fill={T.indigo} fillOpacity={0.4} stackId="1" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 'Benchmark Analysis' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: T.navy }}>Carbon Reduction Pathway vs Net Zero Trajectory</div>
              <ResponsiveContainer width="100%" height={340}>
                <LineChart data={reductionPathway}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="Portfolio Avg (kgCO2e/sqm/yr)" stroke={T.amber} strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="Net Zero Pathway" stroke={T.green} strokeWidth={2} dot={{ r: 4 }} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
