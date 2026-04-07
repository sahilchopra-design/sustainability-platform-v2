import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, ScatterChart, Scatter, ComposedChart, Area,
} from 'recharts';

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', text: '#1a1a2e',
  sub: '#f6f4f0', muted: '#6b7280', indigo: '#4f46e5', gold: '#b8860b',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706',
  navy: '#1e3a5f', teal: '#0f766e', purple: '#7c3aed', orange: '#ea580c',
};
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const PERILS = ['Hurricane/Typhoon','Flood','Wildfire','Earthquake','Hail','Drought','Extreme Heat','Freeze/Ice Storm','Subsidence','Tsunami Risk'];
const PERIL_COLORS = ['#4f46e5','#0369a1','#dc2626','#d97706','#7c3aed','#ea580c','#16a34a','#0f766e','#b8860b','#6b7280'];
const REGIONS = ['North America','Europe','Asia-Pacific','Latin America','Middle East','Africa','Oceania'];
const SCENARIOS = ['Orderly Transition','Disorderly Transition','Hot House World','Delayed Policy'];
const SCEN_MULTS = [1.08, 1.18, 1.35, 1.25];
const REINSURANCE_AVAIL = ['Full','Limited','Restricted'];

const PERIL_DATA = PERILS.map((p, pi) => ({
  name: p,
  baseRate: +(sr(pi * 17 + 1) * 0.04 + 0.005).toFixed(4),
  climateLoading: +(sr(pi * 17 + 2) * 0.025 + 0.003).toFixed(4),
  returnPeriod: Math.round(sr(pi * 17 + 3) * 200 + 25),
  lossRatio: +(sr(pi * 17 + 4) * 35 + 45).toFixed(1),
  severityTrend: +(sr(pi * 17 + 5) * 0.04 + 0.01).toFixed(3),
  frequencyTrend: +(sr(pi * 17 + 6) * 0.03 + 0.005).toFixed(3),
  correlation: Array.from({ length: 10 }, (_, j) => +(pi === j ? 1 : sr(pi * 100 + j * 7) * 0.6).toFixed(2)),
  reinsuranceAvailability: REINSURANCE_AVAIL[Math.floor(sr(pi * 17 + 8) * 3)],
}));

const ZONES = Array.from({ length: 100 }, (_, i) => {
  const perilidx = Math.floor(sr(i * 13 + 1) * 10);
  const regionIdx = Math.floor(sr(i * 13 + 2) * 7);
  const premiumRate = +(sr(i * 13 + 3) * 0.06 + 0.008).toFixed(4);
  const expenseRatio = +(sr(i * 13 + 4) * 0.15 + 0.20).toFixed(3);
  const lossRatio = +(sr(i * 13 + 5) * 35 + 40).toFixed(1);
  const catLoading = +(sr(i * 13 + 6) * 0.08 + 0.02).toFixed(3);
  const combinedRatio = +(+lossRatio + expenseRatio * 100).toFixed(1);
  const expLoss = +(sr(i * 13 + 7) * 0.035 + 0.005).toFixed(4);
  const techRate = +(expLoss + catLoading + expenseRatio * 0.5 + 0.02).toFixed(4);
  return {
    id: i,
    name: `Zone-${String(i + 1).padStart(3, '0')}`,
    region: REGIONS[regionIdx],
    country: `Country-${Math.floor(sr(i * 13 + 8) * 30) + 1}`,
    predominantPeril: PERILS[perilidx],
    perilIdx: perilidx,
    exposureUSD: +(sr(i * 13 + 9) * 900 + 50).toFixed(1),
    premiumRate,
    technicalRate: techRate,
    adequacyRatio: +(premiumRate / (techRate > 0 ? techRate : 0.001) * 100).toFixed(1),
    lossRatio: +lossRatio,
    expenseRatio,
    catLoadingPct: catLoading,
    combinedRatio,
    returnOnEquity: +((premiumRate - expLoss - expenseRatio) / (0.08 + expenseRatio) * 100).toFixed(2),
    claimsHistory5Y: Array.from({ length: 5 }, (_, j) => +(sr(i * 200 + j * 37) * 30 + 40).toFixed(1)),
    renewalRetentionPct: +(sr(i * 13 + 10) * 25 + 70).toFixed(1),
    marketPenetrationPct: +(sr(i * 13 + 11) * 40 + 10).toFixed(1),
    riskScore: +(sr(i * 13 + 12) * 60 + 30).toFixed(1),
    reinsurancePct: +(sr(i * 13 + 0) * 0.30 + 0.05).toFixed(3),
  };
});

const KpiCard = ({ label, value, unit, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 18px', flex: 1, minWidth: 130 }}>
    <div style={{ fontSize: 10, color: T.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.text }}>{value}<span style={{ fontSize: 12, color: T.muted, marginLeft: 4 }}>{unit}</span></div>
  </div>
);

const TabBtn = ({ label, active, onClick }) => (
  <button onClick={onClick} style={{ padding: '7px 16px', background: active ? T.indigo : 'transparent', color: active ? '#fff' : T.muted, border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: active ? 700 : 400, fontSize: 12 }}>{label}</button>
);

const Sparkline = ({ data }) => {
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const w = 60, h = 22;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
  return <svg width={w} height={h}><polyline points={pts} fill="none" stroke={T.indigo} strokeWidth={1.5} /></svg>;
};

export default function PCClimatePricingPage() {
  const [tab, setTab] = useState(0);
  const [scenIdx, setScenIdx] = useState(0);
  const [regionFilter, setRegionFilter] = useState('All');
  const [selectedPerils, setSelectedPerils] = useState(new Set(PERILS));
  const [adequacyFilter, setAdequacyFilter] = useState('All');
  const [combinedRatioMax, setCombinedRatioMax] = useState(130);
  const [reinsFilter, setReinsFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [drillZone, setDrillZone] = useState(null);
  const [scenA, setScenA] = useState(0);
  const [scenB, setScenB] = useState(2);
  const [sortCol, setSortCol] = useState('riskScore');
  const [sortAsc, setSortAsc] = useState(false);
  const [inputExposure, setInputExposure] = useState(100);
  const [selectedPerilCalc, setSelectedPerilCalc] = useState(0);

  const togglePeril = useCallback((p) => {
    setSelectedPerils(prev => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  }, []);

  const filtered = useMemo(() => {
    let d = ZONES;
    if (regionFilter !== 'All') d = d.filter(z => z.region === regionFilter);
    if (selectedPerils.size < 10) d = d.filter(z => selectedPerils.has(z.predominantPeril));
    if (adequacyFilter === 'Adequate') d = d.filter(z => z.adequacyRatio >= 100);
    else if (adequacyFilter === 'Inadequate') d = d.filter(z => z.adequacyRatio < 100);
    d = d.filter(z => z.combinedRatio <= combinedRatioMax);
    if (reinsFilter !== 'All') d = d.filter(z => PERIL_DATA[z.perilIdx].reinsuranceAvailability === reinsFilter);
    if (search) d = d.filter(z => z.name.toLowerCase().includes(search.toLowerCase()) || z.region.toLowerCase().includes(search.toLowerCase()));
    return d;
  }, [regionFilter, selectedPerils, adequacyFilter, combinedRatioMax, reinsFilter, search]);

  const sortedFiltered = useMemo(() => {
    return [...filtered].sort((a, b) => sortAsc ? (a[sortCol] > b[sortCol] ? 1 : -1) : (a[sortCol] < b[sortCol] ? 1 : -1));
  }, [filtered, sortCol, sortAsc]);

  const globalKpis = useMemo(() => {
    if (!filtered.length) return { avgAdequacy: 0, avgCombined: 0, avgROE: 0, totalExposure: 0, avgLoss: 0 };
    const avgAdequacy = filtered.reduce((s, z) => s + z.adequacyRatio, 0) / filtered.length;
    const avgCombined = filtered.reduce((s, z) => s + z.combinedRatio, 0) / filtered.length;
    const avgROE = filtered.reduce((s, z) => s + z.returnOnEquity, 0) / filtered.length;
    const totalExposure = filtered.reduce((s, z) => s + z.exposureUSD, 0);
    const avgLoss = filtered.reduce((s, z) => s + z.lossRatio, 0) / filtered.length;
    return { avgAdequacy: +avgAdequacy.toFixed(1), avgCombined: +avgCombined.toFixed(1), avgROE: +avgROE.toFixed(2), totalExposure: +totalExposure.toFixed(0), avgLoss: +avgLoss.toFixed(1) };
  }, [filtered]);

  const perilRateData = useMemo(() => PERIL_DATA.map((p, pi) => ({
    name: p.name.split('/')[0].slice(0, 12),
    base: p.baseRate,
    loading: +(p.climateLoading * SCEN_MULTS[scenIdx]).toFixed(4),
    total: +(p.baseRate + p.climateLoading * SCEN_MULTS[scenIdx]).toFixed(4),
    lossRatio: p.lossRatio,
  })), [scenIdx]);

  const correlationMatrix = useMemo(() => PERIL_DATA.map(p => p.correlation), []);

  const combinedTrend = useMemo(() => ZONES.slice(0, 20).map(z => ({
    name: z.name,
    combined: z.combinedRatio,
    benchmark: 95,
  })), []);

  // Technical rate calculator
  const calcEngine = useMemo(() => {
    const p = PERIL_DATA[selectedPerilCalc];
    const expLoss = p.baseRate * inputExposure * 1000;
    const catLoad = p.climateLoading * SCEN_MULTS[scenIdx] * inputExposure * 1000;
    const expRatio = 0.25;
    const profitLoad = 0.05;
    const techPremium = (expLoss + catLoad) / (1 - expRatio - profitLoad);
    const rolCalc = techPremium > 0 ? +(techPremium / (expLoss + catLoad)).toFixed(3) : 0;
    const breakEven = +(1 - expRatio).toFixed(3);
    const minAdqRate = (expLoss + catLoad) > 0 ? +((expLoss + catLoad) / (inputExposure * 1000 * (1 - expRatio - profitLoad))).toFixed(4) : 0;
    return { expLoss: +expLoss.toFixed(0), catLoad: +catLoad.toFixed(0), techPremium: +techPremium.toFixed(0), rolCalc, breakEven, minAdqRate };
  }, [inputExposure, scenIdx, selectedPerilCalc]);

  const catLoadingData = useMemo(() => PERIL_DATA.map((p, pi) => ({
    name: p.name.split('/')[0].slice(0, 12),
    catLoad: +(p.climateLoading * SCEN_MULTS[scenIdx] * 100).toFixed(2),
    rol: +(p.baseRate / (p.lossRatio / 100)).toFixed(3),
    reins: p.reinsuranceAvailability,
  })), [scenIdx]);

  const scenCompareData = useMemo(() => PERIL_DATA.map((p, pi) => ({
    name: p.name.split('/')[0].slice(0, 10),
    [SCENARIOS[scenA]]: +(p.baseRate + p.climateLoading * SCEN_MULTS[scenA]).toFixed(4),
    [SCENARIOS[scenB]]: +(p.baseRate + p.climateLoading * SCEN_MULTS[scenB]).toFixed(4),
  })), [scenA, scenB]);

  const roeData = useMemo(() => [...filtered].sort((a,b) => b.returnOnEquity - a.returnOnEquity).slice(0,20).map(z => ({
    name: z.name,
    roe: z.returnOnEquity,
    combined: z.combinedRatio,
  })), [filtered]);

  const profitBridgeData = useMemo(() => {
    if (!filtered.length) return [];
    const avgPremium = filtered.reduce((s,z) => s + z.premiumRate, 0) / filtered.length;
    const avgLoss = filtered.reduce((s,z) => s + z.lossRatio / 100 * z.premiumRate, 0) / filtered.length;
    const avgExpense = filtered.reduce((s,z) => s + z.expenseRatio * z.premiumRate, 0) / filtered.length;
    const avgCat = filtered.reduce((s,z) => s + z.catLoadingPct * z.premiumRate, 0) / filtered.length;
    const profit = avgPremium - avgLoss - avgExpense - avgCat;
    return [
      { name: 'Premium', value: +avgPremium.toFixed(5) },
      { name: '- Loss', value: +-avgLoss.toFixed(5) },
      { name: '- Expense', value: +-avgExpense.toFixed(5) },
      { name: '- Cat Load', value: +-avgCat.toFixed(5) },
      { name: 'Profit', value: +profit.toFixed(5) },
    ];
  }, [filtered]);

  const handleSort = useCallback((col) => {
    if (sortCol === col) setSortAsc(v => !v);
    else { setSortCol(col); setSortAsc(false); }
  }, [sortCol]);

  const TABS = ['Pricing Dashboard','Zone Database','Peril Rate Analysis','Actuarial Calculations','Catastrophe Loading','Profitability Analytics','Summary & Export'];
  const thS = (col) => ({ padding: '7px 8px', textAlign: 'left', cursor: 'pointer', fontWeight: 700, fontSize: 11, borderBottom: `2px solid ${T.border}`, color: sortCol === col ? T.indigo : T.text, whiteSpace: 'nowrap' });
  const tdS = { padding: '5px 8px', fontSize: 11 };

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: T.text, padding: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 10, color: T.muted, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>EP-DC2 · Sprint DC · Climate-Integrated Actuarial Intelligence Suite</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: T.navy, margin: '0 0 6px' }}>P&C Climate Pricing Engine</h1>
        <div style={{ fontSize: 12, color: T.muted }}>10 perils · 100 zones · actuarial technical rate calculator · combined ratio analysis · profitability bridge</div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16, background: T.card, padding: 14, borderRadius: 8, border: `1px solid ${T.border}`, alignItems: 'center' }}>
        <select value={scenIdx} onChange={e => setScenIdx(+e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
          {SCENARIOS.map((s, i) => <option key={s} value={i}>{s} (×{SCEN_MULTS[i]})</option>)}
        </select>
        <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
          <option>All</option>{REGIONS.map(r => <option key={r}>{r}</option>)}
        </select>
        <select value={adequacyFilter} onChange={e => setAdequacyFilter(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
          <option>All</option><option>Adequate</option><option>Inadequate</option>
        </select>
        <select value={reinsFilter} onChange={e => setReinsFilter(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
          <option>All</option>{REINSURANCE_AVAIL.map(r => <option key={r}>{r}</option>)}
        </select>
        <label style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
          CR≤<input type="range" min={80} max={130} value={combinedRatioMax} onChange={e => setCombinedRatioMax(+e.target.value)} style={{ width: 80 }} />{combinedRatioMax}%
        </label>
        <input placeholder="Search zone/region…" value={search} onChange={e => setSearch(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, width: 150 }} />
        <span style={{ fontSize: 11, color: T.muted }}>{filtered.length} / 100 zones</span>
      </div>

      {/* Peril Filters */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16, background: T.card, padding: 10, borderRadius: 8, border: `1px solid ${T.border}`, alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: T.muted, fontWeight: 600 }}>Perils:</span>
        {PERILS.map((p, pi) => (
          <button key={p} onClick={() => togglePeril(p)} style={{ padding: '4px 10px', background: selectedPerils.has(p) ? PERIL_COLORS[pi] : T.bg, color: selectedPerils.has(p) ? '#fff' : T.muted, border: `1px solid ${T.border}`, borderRadius: 4, cursor: 'pointer', fontSize: 10 }}>
            {p.split('/')[0].slice(0, 8)}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap', background: T.card, padding: 8, borderRadius: 8, border: `1px solid ${T.border}` }}>
        {TABS.map((t, i) => <TabBtn key={t} label={t} active={tab === i} onClick={() => setTab(i)} />)}
      </div>

      {/* TAB 0: Pricing Dashboard */}
      {tab === 0 && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <KpiCard label="Avg Adequacy Ratio" value={globalKpis.avgAdequacy} unit="%" color={globalKpis.avgAdequacy < 100 ? T.red : T.green} />
            <KpiCard label="Avg Combined Ratio" value={globalKpis.avgCombined} unit="%" color={globalKpis.avgCombined > 100 ? T.red : T.green} />
            <KpiCard label="Avg ROE" value={globalKpis.avgROE} unit="%" color={globalKpis.avgROE < 0 ? T.red : T.green} />
            <KpiCard label="Total Exposure" value={globalKpis.totalExposure.toLocaleString()} unit="$M" color={T.navy} />
            <KpiCard label="Avg Loss Ratio" value={globalKpis.avgLoss} unit="%" color={T.amber} />
            <KpiCard label="Scenario Mult" value={SCEN_MULTS[scenIdx]} unit="×" color={T.indigo} />
            <KpiCard label="Zones Analyzed" value={filtered.length} unit="/ 100" color={T.teal} />
          </div>
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Rate Adequacy by Zone (sorted ascending) — {SCENARIOS[scenIdx]}</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={[...filtered].sort((a,b) => a.adequacyRatio - b.adequacyRatio).map(z => ({ name: z.name, adequacy: z.adequacyRatio }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={false} />
                <YAxis tick={{ fontSize: 11 }} unit="%" />
                <Tooltip />
                <Bar dataKey="adequacy" name="Adequacy %" fill={T.indigo} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Combined Ratio Distribution</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={[
                { bucket: '<85%', count: filtered.filter(z => z.combinedRatio < 85).length },
                { bucket: '85-95%', count: filtered.filter(z => z.combinedRatio >= 85 && z.combinedRatio < 95).length },
                { bucket: '95-100%', count: filtered.filter(z => z.combinedRatio >= 95 && z.combinedRatio < 100).length },
                { bucket: '100-110%', count: filtered.filter(z => z.combinedRatio >= 100 && z.combinedRatio < 110).length },
                { bucket: '≥110%', count: filtered.filter(z => z.combinedRatio >= 110).length },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" name="Zones" fill={T.teal} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TAB 1: Zone Database */}
      {tab === 1 && (
        <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20 }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>Zone Database — {sortedFiltered.length} / 100</span>
            <span style={{ fontSize: 11, color: T.muted }}>Click header to sort · Click row to drill down</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead><tr style={{ background: T.sub }}>
                {[['name','Zone'],['region','Region'],['predominantPeril','Peril'],['exposureUSD','Exposure $M'],['premiumRate','Premium Rate'],['technicalRate','Tech Rate'],['adequacyRatio','PTR %'],['lossRatio','Loss Ratio %'],['expenseRatio','Expense Ratio'],['combinedRatio','Combined %'],['returnOnEquity','ROE %'],['riskScore','Risk Score'],['renewalRetentionPct','Retention %']].map(([col, label]) => (
                  <th key={col} onClick={() => handleSort(col)} style={thS(col)}>{label}{sortCol === col ? (sortAsc ? ' ↑' : ' ↓') : ''}</th>
                ))}
                <th style={{ padding: '7px 8px', fontWeight: 700, fontSize: 11, borderBottom: `2px solid ${T.border}` }}>5Y Claims</th>
              </tr></thead>
              <tbody>{sortedFiltered.map((z, i) => (
                <tr key={z.id} style={{ background: i % 2 === 0 ? T.bg : T.card, cursor: drillZone === z.id ? undefined : 'pointer' }} onClick={() => setDrillZone(drillZone === z.id ? null : z.id)}>
                  <td style={{ ...tdS, fontWeight: 600 }}>{z.name}</td>
                  <td style={tdS}>{z.region}</td>
                  <td style={{ ...tdS, fontSize: 10 }}>{z.predominantPeril.split('/')[0]}</td>
                  <td style={tdS}>${z.exposureUSD}M</td>
                  <td style={tdS}>{z.premiumRate}</td>
                  <td style={tdS}>{z.technicalRate}</td>
                  <td style={{ ...tdS, color: z.adequacyRatio < 95 ? T.red : z.adequacyRatio > 110 ? T.green : T.amber, fontWeight: 600 }}>{z.adequacyRatio}%</td>
                  <td style={tdS}>{z.lossRatio}%</td>
                  <td style={tdS}>{(z.expenseRatio * 100).toFixed(1)}%</td>
                  <td style={{ ...tdS, color: z.combinedRatio > 100 ? T.red : T.green }}>{z.combinedRatio}%</td>
                  <td style={{ ...tdS, color: z.returnOnEquity < 0 ? T.red : T.green }}>{z.returnOnEquity}%</td>
                  <td style={tdS}>{z.riskScore}</td>
                  <td style={tdS}>{z.renewalRetentionPct}%</td>
                  <td style={tdS}><Sparkline data={z.claimsHistory5Y} /></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Peril Rate Analysis */}
      {tab === 2 && (
        <div>
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>10-Peril Rate Decomposition — Base + Climate Loading ({SCENARIOS[scenIdx]})</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={perilRateData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => v.toFixed(3)} />
                <Tooltip formatter={(v) => v.toFixed(4)} />
                <Legend />
                <Bar dataKey="base" name="Base Rate" fill={T.navy} stackId="a" />
                <Bar dataKey="loading" name="Climate Loading" fill={T.red} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>Technical Rate Table</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead><tr style={{ background: T.sub }}>
                  {['Peril','Base Rate','Climate Load','Total Rate','Loss Ratio','RoL','Reinsurance'].map(h => <th key={h} style={{ padding: '6px 8px', fontWeight: 700, textAlign: 'left', borderBottom: `2px solid ${T.border}` }}>{h}</th>)}
                </tr></thead>
                <tbody>{PERIL_DATA.map((p, pi) => {
                  const load = +(p.climateLoading * SCEN_MULTS[scenIdx]).toFixed(4);
                  const total = +(p.baseRate + load).toFixed(4);
                  const rol = p.lossRatio > 0 ? +(total / (p.lossRatio / 100)).toFixed(3) : 0;
                  return (
                    <tr key={p.name} style={{ background: pi % 2 === 0 ? T.bg : T.card }}>
                      <td style={{ ...tdS, fontWeight: 600, color: PERIL_COLORS[pi] }}>{p.name.split('/')[0]}</td>
                      <td style={tdS}>{p.baseRate}</td>
                      <td style={{ ...tdS, color: T.red }}>{load}</td>
                      <td style={{ ...tdS, fontWeight: 600 }}>{total}</td>
                      <td style={tdS}>{p.lossRatio}%</td>
                      <td style={tdS}>{rol}</td>
                      <td style={tdS}>
                        <span style={{ background: p.reinsuranceAvailability === 'Full' ? '#dcfce7' : p.reinsuranceAvailability === 'Limited' ? '#fef3c7' : '#fee2e2', color: p.reinsuranceAvailability === 'Full' ? T.green : p.reinsuranceAvailability === 'Limited' ? T.amber : T.red, padding: '2px 7px', borderRadius: 4, fontSize: 10 }}>{p.reinsuranceAvailability}</span>
                      </td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
            <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>Peril Correlation Matrix (10×10)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(11, auto)`, gap: 1, fontSize: 8 }}>
                <div></div>
                {PERILS.map((p, pi) => <div key={pi} style={{ padding: '3px 2px', textAlign: 'center', fontWeight: 700, color: T.muted, overflow: 'hidden', maxWidth: 30 }}>{p.split('/')[0].slice(0,4)}</div>)}
                {PERIL_DATA.map((p, pi) => [
                  <div key={`label-${pi}`} style={{ padding: '3px 2px', fontWeight: 700, color: T.muted, whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: 40 }}>{p.name.split('/')[0].slice(0,4)}</div>,
                  ...p.correlation.map((v, ci) => {
                    const intensity = Math.round(v * 200);
                    return <div key={`${pi}-${ci}`} style={{ padding: '3px 2px', textAlign: 'center', background: pi === ci ? T.navy : `rgba(79,70,229,${v * 0.7})`, color: pi === ci ? '#fff' : v > 0.5 ? '#fff' : T.text }}>{v.toFixed(1)}</div>;
                  })
                ])}
              </div>
            </div>
          </div>
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Scenario Comparison: {SCENARIOS[scenA]} vs {SCENARIOS[scenB]}</h3>
            <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
              <select value={scenA} onChange={e => setScenA(+e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
                {SCENARIOS.map((s, i) => <option key={s} value={i}>{s}</option>)}
              </select>
              <select value={scenB} onChange={e => setScenB(+e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
                {SCENARIOS.map((s, i) => <option key={s} value={i}>{s}</option>)}
              </select>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={scenCompareData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => v.toFixed(3)} />
                <Tooltip formatter={(v) => v.toFixed(4)} />
                <Legend />
                <Bar dataKey={SCENARIOS[scenA]} fill={T.indigo} />
                <Bar dataKey={SCENARIOS[scenB]} fill={T.red} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TAB 3: Actuarial Calculations */}
      {tab === 3 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700 }}>Technical Rate Calculator</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <label style={{ fontSize: 12 }}>Peril:
                  <select value={selectedPerilCalc} onChange={e => setSelectedPerilCalc(+e.target.value)} style={{ marginLeft: 8, padding: '5px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
                    {PERILS.map((p, i) => <option key={p} value={i}>{p}</option>)}
                  </select>
                </label>
                <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  Exposure ($M): <input type="range" min={10} max={500} value={inputExposure} onChange={e => setInputExposure(+e.target.value)} style={{ width: 120 }} /> ${inputExposure}M
                </label>
                <label style={{ fontSize: 12 }}>Scenario:
                  <select value={scenIdx} onChange={e => setScenIdx(+e.target.value)} style={{ marginLeft: 8, padding: '5px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
                    {SCENARIOS.map((s, i) => <option key={s} value={i}>{s}</option>)}
                  </select>
                </label>
              </div>
              <div style={{ marginTop: 16, padding: 14, background: T.sub, borderRadius: 8 }}>
                {[
                  { label: 'Expected Loss', value: '$' + calcEngine.expLoss.toLocaleString() },
                  { label: 'Cat Loading', value: '$' + calcEngine.catLoad.toLocaleString() },
                  { label: 'Required Technical Premium', value: '$' + calcEngine.techPremium.toLocaleString(), color: T.indigo, bold: true },
                  { label: 'Rate-on-Line (RoL)', value: calcEngine.rolCalc + '×' },
                  { label: 'Break-even Loss Ratio', value: (calcEngine.breakEven * 100).toFixed(1) + '%' },
                  { label: 'Minimum Adequate Rate', value: calcEngine.minAdqRate },
                  { label: 'Peril Return Period', value: PERIL_DATA[selectedPerilCalc].returnPeriod + ' yrs' },
                  { label: 'Reinsurance Availability', value: PERIL_DATA[selectedPerilCalc].reinsuranceAvailability },
                ].map(({ label, value, color, bold }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
                    <span style={{ color: T.muted }}>{label}</span>
                    <span style={{ fontWeight: bold ? 700 : 600, color: color || T.text }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700 }}>Break-even Analysis — All Scenarios</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={SCENARIOS.map((sc, si) => ({
                  scenario: sc.split(' ')[0],
                  techRate: +(PERIL_DATA[selectedPerilCalc].baseRate + PERIL_DATA[selectedPerilCalc].climateLoading * SCEN_MULTS[si]).toFixed(4),
                  breakEven: +(PERIL_DATA[selectedPerilCalc].lossRatio / 100 + 0.25).toFixed(3),
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="scenario" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => v.toFixed(3)} />
                  <Tooltip formatter={(v) => v.toFixed(4)} />
                  <Legend />
                  <Bar dataKey="techRate" name="Technical Rate" fill={T.indigo} />
                  <Bar dataKey="breakEven" name="Break-even Rate" fill={T.amber} />
                </BarChart>
              </ResponsiveContainer>
              <h3 style={{ margin: '16px 0 12px', fontSize: 14, fontWeight: 700 }}>Combined Ratio Trend — Top 20 Zones</h3>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={combinedTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={false} />
                  <YAxis domain={[70, 130]} tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="combined" name="Combined Ratio %" stroke={T.red} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="benchmark" name="100% Benchmark" stroke={T.amber} strokeWidth={1} strokeDasharray="5 5" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Catastrophe Loading */}
      {tab === 4 && (
        <div>
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Cat Loading by Peril ({SCENARIOS[scenIdx]})</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={catLoadingData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} unit="%" />
                <Tooltip />
                <Bar dataKey="catLoad" name="Cat Loading %" fill={T.red} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>Rate-on-Line Comparison</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={catLoadingData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => v.toFixed(3) + '×'} />
                  <Bar dataKey="rol" name="RoL ×" fill={T.indigo} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>Reinsurance Availability Analysis</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead><tr style={{ background: T.sub }}>
                  {['Peril','Cat Load %','RoL','Return Period','Reinsurance','Severity Trend'].map(h => <th key={h} style={{ padding: '6px 8px', fontWeight: 700, borderBottom: `2px solid ${T.border}` }}>{h}</th>)}
                </tr></thead>
                <tbody>{PERIL_DATA.map((p, pi) => (
                  <tr key={p.name} style={{ background: pi % 2 === 0 ? T.bg : T.card }}>
                    <td style={{ ...tdS, fontWeight: 600, color: PERIL_COLORS[pi] }}>{p.name.split('/')[0]}</td>
                    <td style={tdS}>{(p.climateLoading * SCEN_MULTS[scenIdx] * 100).toFixed(2)}%</td>
                    <td style={tdS}>{(p.baseRate / (p.lossRatio > 0 ? p.lossRatio / 100 : 0.5)).toFixed(3)}×</td>
                    <td style={tdS}>{p.returnPeriod}yr</td>
                    <td style={tdS}><span style={{ background: p.reinsuranceAvailability === 'Full' ? '#dcfce7' : p.reinsuranceAvailability === 'Limited' ? '#fef3c7' : '#fee2e2', color: p.reinsuranceAvailability === 'Full' ? T.green : p.reinsuranceAvailability === 'Limited' ? T.amber : T.red, padding: '2px 7px', borderRadius: 4, fontSize: 10 }}>{p.reinsuranceAvailability}</span></td>
                    <td style={tdS}>{(p.severityTrend * 100).toFixed(1)}%/yr</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Profitability Analytics */}
      {tab === 5 && (
        <div>
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>ROE by Zone — Top 20</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={roeData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" />
                <Tooltip />
                <Bar dataKey="roe" name="ROE %" fill={T.green} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20 }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>ROE vs Combined Ratio (Scatter)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="combined" name="Combined %" tick={{ fontSize: 10 }} />
                  <YAxis dataKey="roe" name="ROE %" tick={{ fontSize: 10 }} />
                  <Tooltip content={({ payload }) => payload?.length ? <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: 8, fontSize: 11 }}><b>{payload[0]?.payload?.name}</b><br/>CR: {payload[0]?.payload?.combined}%<br/>ROE: {payload[0]?.payload?.roe}%</div> : null} />
                  <Scatter data={filtered.map(z => ({ name: z.name, combined: z.combinedRatio, roe: z.returnOnEquity }))} fill={T.indigo} opacity={0.6} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20 }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Profit Bridge (Avg Zone)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={profitBridgeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => v.toFixed(4)} />
                  <Tooltip formatter={(v) => v.toFixed(5)} />
                  <Bar dataKey="value" name="Value" fill={T.teal} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: Summary & Export */}
      {tab === 6 && (
        <div>
          {/* Sensitivity Analysis */}
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Pricing Sensitivity Analysis — Combined Ratio vs Climate Scenario</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={SCENARIOS.map((sc, si) => ({
                scenario: sc.split(' ')[0],
                avgCombined: filtered.length ? +(filtered.reduce((s, z) => s + z.lossRatio + z.expenseRatio * 100 + z.catLoadingPct * 100 * SCEN_MULTS[si], 0) / filtered.length).toFixed(1) : 0,
                adequateZones: filtered.filter(z => z.premiumRate >= z.technicalRate * SCEN_MULTS[si]).length,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="scenario" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} unit="%" />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="avgCombined" name="Avg Combined Ratio %" stroke={T.red} strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="right" type="monotone" dataKey="adequateZones" name="Adequate Zones" stroke={T.green} strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {/* ROE Distribution */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20 }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>ROE Distribution by Region</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={REGIONS.map(r => {
                  const rZones = filtered.filter(z => z.region === r);
                  return { region: r.slice(0,10), avgROE: rZones.length ? +(rZones.reduce((s, z) => s + z.returnOnEquity, 0) / rZones.length).toFixed(1) : 0, count: rZones.length };
                }).filter(d => d.count > 0)}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="region" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip />
                  <Bar dataKey="avgROE" name="Avg ROE %" fill={T.teal} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20 }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Adequacy Status Summary</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[
                  { status: 'Under-priced (<95%)', count: filtered.filter(z => z.adequacyRatio < 95).length },
                  { status: 'Near-adequate (95-100%)', count: filtered.filter(z => z.adequacyRatio >= 95 && z.adequacyRatio < 100).length },
                  { status: 'Adequate (100-110%)', count: filtered.filter(z => z.adequacyRatio >= 100 && z.adequacyRatio < 110).length },
                  { status: 'Over-priced (≥110%)', count: filtered.filter(z => z.adequacyRatio >= 110).length },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="status" tick={{ fontSize: 8 }} angle={-15} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" name="Zones" fill={T.indigo} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          {/* Peril-Level Summary Table */}
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>Peril-Level Performance Summary</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead><tr style={{ background: T.sub }}>
                {['Peril','Zones','Avg Adequacy %','Avg Loss Ratio %','Avg Combined %','Avg ROE %','Avg Risk Score','Reinsurance'].map(h => (
                  <th key={h} style={{ padding: '7px 8px', fontWeight: 700, borderBottom: `2px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>{PERILS.map((peril, pi) => {
                const pZones = filtered.filter(z => z.predominantPeril === peril);
                if (!pZones.length) return null;
                const avgAdq = +(pZones.reduce((s, z) => s + z.adequacyRatio, 0) / pZones.length).toFixed(1);
                const avgLR = +(pZones.reduce((s, z) => s + z.lossRatio, 0) / pZones.length).toFixed(1);
                const avgCR = +(pZones.reduce((s, z) => s + z.combinedRatio, 0) / pZones.length).toFixed(1);
                const avgROE = +(pZones.reduce((s, z) => s + z.returnOnEquity, 0) / pZones.length).toFixed(1);
                const avgRisk = +(pZones.reduce((s, z) => s + z.riskScore, 0) / pZones.length).toFixed(1);
                return (
                  <tr key={peril} style={{ background: pi % 2 === 0 ? T.bg : T.card }}>
                    <td style={{ padding: '5px 8px', fontSize: 11, fontWeight: 600, color: PERIL_COLORS[pi] }}>{peril.split('/')[0]}</td>
                    <td style={{ padding: '5px 8px', fontSize: 11 }}>{pZones.length}</td>
                    <td style={{ padding: '5px 8px', fontSize: 11, color: avgAdq < 95 ? T.red : T.green, fontWeight: 600 }}>{avgAdq}%</td>
                    <td style={{ padding: '5px 8px', fontSize: 11 }}>{avgLR}%</td>
                    <td style={{ padding: '5px 8px', fontSize: 11, color: avgCR > 100 ? T.red : T.green }}>{avgCR}%</td>
                    <td style={{ padding: '5px 8px', fontSize: 11, color: avgROE < 0 ? T.red : T.green }}>{avgROE}%</td>
                    <td style={{ padding: '5px 8px', fontSize: 11 }}>{avgRisk}</td>
                    <td style={{ padding: '5px 8px', fontSize: 11 }}>{PERIL_DATA[pi].reinsuranceAvailability}</td>
                  </tr>
                );
              }).filter(Boolean)}</tbody>
            </table>
          </div>
          {/* What-If Calculator */}
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>Portfolio-Level Metrics Summary</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {[
                { label: 'Zones Below Break-even', value: filtered.filter(z => z.combinedRatio > 100).length, color: T.red },
                { label: 'Zones with Restricted Reins', value: filtered.filter(z => PERIL_DATA[z.perilIdx].reinsuranceAvailability === 'Restricted').length, color: T.orange },
                { label: 'Avg Market Penetration', value: filtered.length ? (filtered.reduce((s,z) => s + z.marketPenetrationPct, 0) / filtered.length).toFixed(1) + '%' : '0%', color: T.blue },
                { label: 'High Risk Score (>70)', value: filtered.filter(z => z.riskScore > 70).length, color: T.amber },
                { label: 'Positive ROE Zones', value: filtered.filter(z => z.returnOnEquity > 0).length, color: T.green },
                { label: 'Renewal Retention >85%', value: filtered.filter(z => z.renewalRetentionPct > 85).length, color: T.teal },
                { label: 'Total Premium Volume', value: '$' + filtered.reduce((s,z) => s + z.exposureUSD * z.premiumRate, 0).toFixed(0) + 'M', color: T.navy },
                { label: 'Climate Load Total', value: '$' + PERIL_DATA.reduce((s,p) => s + p.climateLoading * SCEN_MULTS[scenIdx] * filtered.reduce((ss,z) => ss + z.exposureUSD, 0), 0).toFixed(0) + 'M', color: T.red },
              ].map(item => (
                <div key={item.label} style={{ background: T.sub, borderRadius: 6, padding: '12px 14px' }}>
                  <div style={{ fontSize: 10, color: T.muted, marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: item.color }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
            <KpiCard label="Zones Analyzed" value={filtered.length} unit="/ 100" color={T.indigo} />
            <KpiCard label="Active Scenario" value={SCENARIOS[scenIdx]} unit="" color={T.navy} />
            <KpiCard label="Avg Adequacy" value={globalKpis.avgAdequacy} unit="%" color={globalKpis.avgAdequacy < 100 ? T.red : T.green} />
            <KpiCard label="Avg Combined Ratio" value={globalKpis.avgCombined} unit="%" color={globalKpis.avgCombined > 100 ? T.red : T.green} />
            <KpiCard label="Avg ROE" value={globalKpis.avgROE} unit="%" color={globalKpis.avgROE < 0 ? T.red : T.green} />
            <KpiCard label="Total Exposure" value={globalKpis.totalExposure.toLocaleString()} unit="$M" color={T.teal} />
            <KpiCard label="Avg Loss Ratio" value={globalKpis.avgLoss} unit="%" color={T.amber} />
          </div>
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20 }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700 }}>Full KPI Export — {filtered.length} Zones · Scenario: {SCENARIOS[scenIdx]}</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead><tr style={{ background: T.sub }}>
                  {['Zone','Region','Peril','Exposure $M','Premium Rate','Tech Rate','PTR %','Loss Ratio %','Expense Ratio','Cat Loading','Combined %','ROE %','Risk Score','Retention %','Reinsurance %'].map(h => (
                    <th key={h} style={{ padding: '7px 8px', fontWeight: 700, textAlign: 'left', borderBottom: `2px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{sortedFiltered.map((z, i) => (
                  <tr key={z.id} style={{ background: i % 2 === 0 ? T.bg : T.card }}>
                    <td style={{ ...tdS, fontWeight: 600 }}>{z.name}</td>
                    <td style={tdS}>{z.region}</td>
                    <td style={{ ...tdS, fontSize: 10 }}>{z.predominantPeril.split('/')[0]}</td>
                    <td style={tdS}>${z.exposureUSD}M</td>
                    <td style={tdS}>{z.premiumRate}</td>
                    <td style={tdS}>{z.technicalRate}</td>
                    <td style={{ ...tdS, color: z.adequacyRatio < 95 ? T.red : T.green, fontWeight: 600 }}>{z.adequacyRatio}%</td>
                    <td style={tdS}>{z.lossRatio}%</td>
                    <td style={tdS}>{(z.expenseRatio * 100).toFixed(1)}%</td>
                    <td style={tdS}>{(z.catLoadingPct * 100).toFixed(2)}%</td>
                    <td style={{ ...tdS, color: z.combinedRatio > 100 ? T.red : T.green }}>{z.combinedRatio}%</td>
                    <td style={{ ...tdS, color: z.returnOnEquity < 0 ? T.red : T.green }}>{z.returnOnEquity}%</td>
                    <td style={tdS}>{z.riskScore}</td>
                    <td style={tdS}>{z.renewalRetentionPct}%</td>
                    <td style={tdS}>{(z.reinsurancePct * 100).toFixed(1)}%</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
          {/* Scenario Rate Comparison matrix */}
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginTop: 16 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Technical Rate Matrix — All 4 Scenarios × 10 Perils</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead><tr style={{ background: T.sub }}>
                  <th style={{ padding: '7px 10px', fontWeight: 700, borderBottom: `2px solid ${T.border}`, textAlign: 'left' }}>Peril</th>
                  {SCENARIOS.map(s => <th key={s} style={{ padding: '7px 10px', fontWeight: 700, borderBottom: `2px solid ${T.border}`, textAlign: 'right', whiteSpace: 'nowrap' }}>{s.split(' ')[0]}</th>)}
                  <th style={{ padding: '7px 10px', fontWeight: 700, borderBottom: `2px solid ${T.border}`, textAlign: 'right' }}>Max Uplift</th>
                  <th style={{ padding: '7px 10px', fontWeight: 700, borderBottom: `2px solid ${T.border}`, textAlign: 'right' }}>Return Period</th>
                  <th style={{ padding: '7px 10px', fontWeight: 700, borderBottom: `2px solid ${T.border}`, textAlign: 'left' }}>Severity Trend</th>
                </tr></thead>
                <tbody>{PERIL_DATA.map((p, pi) => {
                  const rates = SCENARIOS.map((_, si) => +(p.baseRate + p.climateLoading * SCEN_MULTS[si]).toFixed(4));
                  const maxUplift = rates[3] > rates[0] ? +(((rates[3] - rates[0]) / rates[0]) * 100).toFixed(1) : 0;
                  return (
                    <tr key={p.name} style={{ background: pi % 2 === 0 ? T.bg : T.card }}>
                      <td style={{ padding: '5px 10px', fontWeight: 600, color: PERIL_COLORS[pi] }}>{p.name.split('/')[0]}</td>
                      {rates.map((r, si) => <td key={si} style={{ padding: '5px 10px', textAlign: 'right', color: si === 3 ? T.red : T.text }}>{r}</td>)}
                      <td style={{ padding: '5px 10px', textAlign: 'right', color: maxUplift > 20 ? T.red : T.amber, fontWeight: 600 }}>+{maxUplift}%</td>
                      <td style={{ padding: '5px 10px', textAlign: 'right' }}>{p.returnPeriod}yr</td>
                      <td style={{ padding: '5px 10px' }}>{(p.severityTrend * 100).toFixed(1)}%/yr</td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
          </div>
          {/* Region performance table */}
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginTop: 16 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Region Performance Summary</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead><tr style={{ background: T.sub }}>
                {['Region','Zones','Avg Adequacy %','Avg Combined %','Avg ROE %','Total Exposure $M','Under-priced','Over-priced','Avg Risk Score'].map(h => (
                  <th key={h} style={{ padding: '7px 8px', fontWeight: 700, borderBottom: `2px solid ${T.border}`, whiteSpace: 'nowrap', textAlign: 'left' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>{REGIONS.map((region, ri) => {
                const rzs = filtered.filter(z => z.region === region);
                if (!rzs.length) return null;
                const avgAdq = +(rzs.reduce((s,z) => s + z.adequacyRatio, 0) / rzs.length).toFixed(1);
                const avgCR = +(rzs.reduce((s,z) => s + z.combinedRatio, 0) / rzs.length).toFixed(1);
                const avgROE = +(rzs.reduce((s,z) => s + z.returnOnEquity, 0) / rzs.length).toFixed(1);
                const totalExp = +(rzs.reduce((s,z) => s + z.exposureUSD, 0)).toFixed(0);
                const underP = rzs.filter(z => z.adequacyRatio < 95).length;
                const overP = rzs.filter(z => z.adequacyRatio > 110).length;
                const avgRisk = +(rzs.reduce((s,z) => s + z.riskScore, 0) / rzs.length).toFixed(1);
                return (
                  <tr key={region} style={{ background: ri % 2 === 0 ? T.bg : T.card }}>
                    <td style={{ padding: '5px 8px', fontWeight: 600 }}>{region}</td>
                    <td style={{ padding: '5px 8px' }}>{rzs.length}</td>
                    <td style={{ padding: '5px 8px', color: avgAdq < 95 ? T.red : T.green, fontWeight: 600 }}>{avgAdq}%</td>
                    <td style={{ padding: '5px 8px', color: avgCR > 100 ? T.red : T.green }}>{avgCR}%</td>
                    <td style={{ padding: '5px 8px', color: avgROE < 0 ? T.red : T.green }}>{avgROE}%</td>
                    <td style={{ padding: '5px 8px' }}>${totalExp}M</td>
                    <td style={{ padding: '5px 8px', color: underP > 0 ? T.red : T.green }}>{underP}</td>
                    <td style={{ padding: '5px 8px' }}>{overP}</td>
                    <td style={{ padding: '5px 8px' }}>{avgRisk}</td>
                  </tr>
                );
              }).filter(Boolean)}</tbody>
            </table>
          </div>
          {/* What-if pricing calculator output */}
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginTop: 16 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>Portfolio Pricing Actions — Zones Requiring Rate Adjustment</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead><tr style={{ background: T.sub }}>
                  {['Zone','Region','Peril','Current Rate','Technical Rate','Required Adjustment','Combined %','ROE %','Action Priority'].map(h => (
                    <th key={h} style={{ padding: '7px 8px', fontWeight: 700, borderBottom: `2px solid ${T.border}`, whiteSpace: 'nowrap', textAlign: 'left' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{[...filtered].filter(z => z.adequacyRatio < 100).sort((a,b) => a.adequacyRatio - b.adequacyRatio).slice(0,20).map((z, i) => {
                  const adjNeeded = +(z.technicalRate - z.premiumRate).toFixed(4);
                  const adjPct = z.premiumRate > 0 ? +((adjNeeded / z.premiumRate) * 100).toFixed(1) : 0;
                  return (
                    <tr key={z.id} style={{ background: i % 2 === 0 ? T.bg : T.card }}>
                      <td style={{ padding: '5px 8px', fontWeight: 600 }}>{z.name}</td>
                      <td style={{ padding: '5px 8px' }}>{z.region}</td>
                      <td style={{ padding: '5px 8px', fontSize: 10 }}>{z.predominantPeril.split('/')[0]}</td>
                      <td style={{ padding: '5px 8px' }}>{z.premiumRate}</td>
                      <td style={{ padding: '5px 8px' }}>{z.technicalRate}</td>
                      <td style={{ padding: '5px 8px', color: T.red, fontWeight: 600 }}>+{adjPct}% (+{adjNeeded})</td>
                      <td style={{ padding: '5px 8px', color: z.combinedRatio > 100 ? T.red : T.green }}>{z.combinedRatio}%</td>
                      <td style={{ padding: '5px 8px', color: z.returnOnEquity < 0 ? T.red : T.green }}>{z.returnOnEquity}%</td>
                      <td style={{ padding: '5px 8px' }}>
                        <span style={{ background: adjPct > 20 ? '#fee2e2' : adjPct > 10 ? '#fef3c7' : '#dbeafe', color: adjPct > 20 ? T.red : adjPct > 10 ? T.amber : T.blue, padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600 }}>
                          {adjPct > 20 ? 'Urgent' : adjPct > 10 ? 'High' : 'Medium'}
                        </span>
                      </td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
          </div>
          {/* Pricing Portfolio Summary */}
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginTop: 16 }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700 }}>Pricing Portfolio Key Statistics</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {[
                { label: 'Total Zones', value: ZONES.length, color: T.indigo },
                { label: 'Perils Modelled', value: PERIL_DATA.length, color: T.blue },
                { label: 'Avg Technical Rate', value: '$' + (ZONES.reduce((s, z) => s + z.technicalRate, 0) / ZONES.length).toFixed(1), color: T.green },
                { label: 'Avg PTR', value: (ZONES.reduce((s, z) => s + z.pricingToTechnicalRatio, 0) / ZONES.length).toFixed(0) + '%', color: T.orange },
                { label: 'Zones Underpriced', value: ZONES.filter(z => z.pricingToTechnicalRatio < 95).length, color: T.red },
                { label: 'Avg Combined Ratio', value: (ZONES.reduce((s, z) => s + z.combinedRatio, 0) / ZONES.length).toFixed(0) + '%', color: T.amber },
                { label: 'Avg Cat Loading', value: '$' + (ZONES.reduce((s, z) => s + z.catLoad, 0) / ZONES.length).toFixed(1), color: T.purple },
                { label: 'Avg ROE', value: (ZONES.reduce((s, z) => s + z.roe, 0) / ZONES.length).toFixed(1) + '%', color: T.teal },
                { label: 'High Climate Hazard', value: ZONES.filter(z => z.climateHazardScore > 70).length + ' zones', color: T.red },
                { label: 'Avg Loss Ratio', value: (ZONES.reduce((s, z) => s + z.lossRatio, 0) / ZONES.length * 100).toFixed(0) + '%', color: T.orange },
                { label: 'Active Scenario', value: CLIMATE_SCENARIOS[climateScenIdx]?.name?.slice(0, 14) || 'Base', color: T.indigo },
                { label: 'Avg Expense Ratio', value: (ZONES.reduce((s, z) => s + z.expenseRatio, 0) / ZONES.length * 100).toFixed(0) + '%', color: T.navy },
              ].map(m => (
                <div key={m.label} style={{ background: T.sub, borderRadius: 6, padding: '8px 10px', borderLeft: `3px solid ${m.color}` }}>
                  <div style={{ fontSize: 10, color: T.muted, marginBottom: 2 }}>{m.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: m.color }}>{m.value}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Peril Combined Ratio vs Technical Rate Scatter */}
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginTop: 16 }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700 }}>Peril Technical Rate vs Combined Ratio — Profitability Scatter</h3>
            <ResponsiveContainer width="100%" height={220}>
              <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="techRate" name="Technical Rate $" type="number" tick={{ fontSize: 10 }} label={{ value: 'Technical Rate $', position: 'insideBottom', offset: -5, fontSize: 10 }} />
                <YAxis dataKey="combinedRatio" name="Combined Ratio %" type="number" tick={{ fontSize: 10 }} domain={[60, 140]} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(v, n) => [n === 'combinedRatio' ? v.toFixed(0) + '%' : '$' + v.toFixed(0), n === 'combinedRatio' ? 'Combined Ratio' : 'Technical Rate']} />
                <Scatter name="Perils" data={PERIL_DATA.map((p, pi) => ({
                  techRate: +(p.baseRate * (1 + p.climateLoading)).toFixed(1),
                  combinedRatio: +(p.lossRatio * 100 + 25).toFixed(0),
                  name: p.name,
                  fill: [T.indigo, T.teal, T.green, T.amber, T.orange, T.red, T.purple, T.blue, T.navy, T.gold][pi],
                }))} fill={T.indigo} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          {/* Zone Adequacy Status Strip */}
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginTop: 16 }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700 }}>Zone Pricing Adequacy Status — All {ZONES.length} Zones</h3>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
              {[
                { label: 'Adequate (PTR ≥95%)', count: ZONES.filter(z => z.pricingToTechnicalRatio >= 95).length, color: T.green },
                { label: 'Marginal (80–95%)', count: ZONES.filter(z => z.pricingToTechnicalRatio >= 80 && z.pricingToTechnicalRatio < 95).length, color: T.amber },
                { label: 'Deficient (<80%)', count: ZONES.filter(z => z.pricingToTechnicalRatio < 80).length, color: T.red },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6, background: s.color + '18', border: `1px solid ${s.color}30`, borderRadius: 6, padding: '6px 12px' }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: s.color }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: s.color }}>{s.count} zones</span>
                  <span style={{ fontSize: 10, color: T.muted }}>{s.label}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              {ZONES.map(z => {
                const ptr = z.pricingToTechnicalRatio;
                const color = ptr >= 95 ? T.green : ptr >= 80 ? T.amber : T.red;
                return (
                  <div key={z.id} title={`${z.id}: PTR ${ptr.toFixed(0)}%`} style={{ width: 12, height: 12, borderRadius: 2, background: color, opacity: 0.7 }} />
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
