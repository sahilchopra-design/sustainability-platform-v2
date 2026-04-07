import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, ScatterChart, Scatter, ComposedChart,
} from 'recharts';

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', text: '#1a1a2e',
  sub: '#f6f4f0', muted: '#6b7280', indigo: '#4f46e5', gold: '#b8860b',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706',
  navy: '#1e3a5f', teal: '#0f766e', purple: '#7c3aed', orange: '#ea580c',
};
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const PERILS = ['Hurricane/Typhoon','Flood','Wildfire','Earthquake','Hail','Drought','Extreme Heat','Freeze/Ice Storm','Subsidence','Tsunami'];
const REGIONS = ['North America','Europe','Asia-Pacific','Latin America','Middle East','Africa','Oceania','South Asia','East Asia','Southeast Asia','Caribbean','Scandinavia','Mediterranean','Central Africa','Australasia'];
const NGFS_SCENARIOS = ['Net Zero 2050','Delayed Transition','Divergent Net Zero','Nationally Determined','Current Policies','Fragmented World'];
const SCEN_COLORS = ['#16a34a','#d97706','#0369a1','#ea580c','#dc2626','#7c3aed'];
const SCEN_FREQ_MULTS = [1.05, 1.12, 1.09, 1.18, 1.28, 1.38];
const SCEN_SEV_MULTS = [1.08, 1.15, 1.12, 1.22, 1.35, 1.45];
const TIME_POINTS = [2025, 2030, 2035, 2040, 2045, 2050, 2055];
const LOSS_DISTRIBUTIONS = ['Normal','LogNormal','Pareto','Weibull'];
const PML_RETURN_PERIODS = [100, 250];

const REGION_PERIL_COMBOS = REGIONS.flatMap((region, ri) =>
  PERILS.map((peril, pi) => {
    const seed = ri * 100 + pi * 7;
    const baseFreq = +(sr(seed + 1) * 0.08 + 0.01).toFixed(4);
    const baseSev = +(sr(seed + 2) * 900 + 50).toFixed(0);
    const clFreqTrend = +(sr(seed + 3) * 0.05 + 0.005).toFixed(4);
    const clSevTrend = +(sr(seed + 4) * 0.04 + 0.005).toFixed(4);
    const catProb = +(sr(seed + 5) * 0.6 + 0.05).toFixed(3);
    const socInfl = +(sr(seed + 6) * 0.04 + 0.01).toFixed(3);
    const demSurge = +(catProb > 0.3 ? sr(seed + 7) * 0.05 + 0.10 : sr(seed + 7) * 0.05).toFixed(3);
    const insGap = +(sr(seed + 8) * 60 + 10).toFixed(1);
    const emergRisk = +(sr(seed + 9) * 0.8).toFixed(3);
    const reinsThreshold = +(baseSev * (sr(seed + 10) * 3 + 5)).toFixed(0);
    const pml100 = +(baseSev * (sr(seed + 11) * 8 + 4) * baseFreq * 100).toFixed(0);
    const pml250 = +(pml100 * (1 + sr(seed + 12) * 0.6 + 0.3)).toFixed(0);
    const inflLoad = +(sr(seed + 13) * 0.03 + 0.02).toFixed(3);
    const lossDistIdx = Math.floor(sr(seed + 14) * 4);
    const annualHistory = Array.from({ length: 5 }, (_, y) => +(baseSev * baseFreq * (0.8 + sr(seed + 15 + y) * 0.4)).toFixed(0));
    const histMean = annualHistory.reduce((a, b) => a + b, 0) / 5;
    const histStdev = Math.sqrt(annualHistory.reduce((s, v) => s + Math.pow(v - histMean, 2), 0) / 5);
    return {
      id: ri * 10 + pi, region, peril, regionIdx: ri, perilIdx: pi,
      baseClaimsFreq: baseFreq,
      baseSeverityK: +baseSev,
      climateFreqTrend: clFreqTrend,
      climateSeverityTrend: clSevTrend,
      exposureGrowth: +(sr(seed + 16) * 0.03 + 0.01).toFixed(3),
      insuranceGap: +insGap,
      catastropheProbability: catProb,
      lossDistribution: LOSS_DISTRIBUTIONS[lossDistIdx],
      reinsuranceTrigger: +reinsThreshold,
      pml100: +pml100,
      pml250: +pml250,
      inflationLoading: inflLoad,
      demandSurge: demSurge,
      socialInflation: socInfl,
      emergingRisk: emergRisk,
      claimsVolatility: +histStdev.toFixed(0),
      lastYearClaims: annualHistory[4],
      annualHistory,
    };
  })
);

function calcProjectedClaims(rp, si, ti) {
  const freqMult = Math.pow(1 + rp.climateFreqTrend * SCEN_FREQ_MULTS[si], ti);
  const sevMult = Math.pow(1 + rp.climateSeverityTrend * SCEN_SEV_MULTS[si], ti);
  const expMult = Math.pow(1 + rp.exposureGrowth, ti);
  const base = rp.baseClaimsFreq * rp.baseSeverityK;
  let proj = base * freqMult * sevMult * expMult;
  if (rp.catastropheProbability > 0.3) proj *= (1 + rp.demandSurge);
  proj *= (1 + rp.inflationLoading * ti);
  return +proj.toFixed(0);
}

function calcNetAfterReins(rp, si, ti) {
  const gross = calcProjectedClaims(rp, si, ti);
  const ceded = gross > rp.reinsuranceTrigger ? (gross - rp.reinsuranceTrigger) * 0.7 : 0;
  return +(gross - ceded).toFixed(0);
}

const KpiCard = ({ label, value, unit, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 18px', flex: 1, minWidth: 130 }}>
    <div style={{ fontSize: 10, color: T.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.text }}>{value}<span style={{ fontSize: 12, color: T.muted, marginLeft: 4 }}>{unit}</span></div>
  </div>
);

const TabBtn = ({ label, active, onClick }) => (
  <button onClick={onClick} style={{ padding: '7px 16px', background: active ? T.indigo : 'transparent', color: active ? '#fff' : T.muted, border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: active ? 700 : 400, fontSize: 12 }}>{label}</button>
);

const TrendArrow = ({ val }) => (
  <span style={{ color: val > 0.02 ? T.red : val > 0.01 ? T.amber : T.green, fontWeight: 700 }}>
    {val > 0.02 ? '▲▲' : val > 0.01 ? '▲' : '→'}
  </span>
);

export default function ClimateClaimsForecastingPage() {
  const [tab, setTab] = useState(0);
  const [scenIdx, setScenIdx] = useState(0);
  const [timeIdx, setTimeIdx] = useState(5);
  const [pmlPeriod, setPmlPeriod] = useState(100);
  const [perilFilter, setPerilFilter] = useState('All');
  const [regionFilter, setRegionFilter] = useState('All');
  const [socialInflToggle, setSocialInflToggle] = useState(true);
  const [demandSurgeToggle, setDemandSurgeToggle] = useState(true);
  const [insGapMin, setInsGapMin] = useState(0);
  const [emergRiskMin, setEmergRiskMin] = useState(0);
  const [search, setSearch] = useState('');
  const [drillIdx, setDrillIdx] = useState(0);
  const [compareA, setCompareA] = useState(0);
  const [compareB, setCompareB] = useState(15);
  const [compareMode, setCompareMode] = useState(false);
  const [sortCol, setSortCol] = useState('pml100');
  const [sortAsc, setSortAsc] = useState(false);

  const filtered = useMemo(() => {
    let d = REGION_PERIL_COMBOS;
    if (perilFilter !== 'All') d = d.filter(r => r.peril === perilFilter);
    if (regionFilter !== 'All') d = d.filter(r => r.region === regionFilter);
    d = d.filter(r => r.insuranceGap >= insGapMin && r.emergingRisk >= emergRiskMin / 100);
    if (search) d = d.filter(r => r.region.toLowerCase().includes(search.toLowerCase()) || r.peril.toLowerCase().includes(search.toLowerCase()));
    return d;
  }, [perilFilter, regionFilter, insGapMin, emergRiskMin, search]);

  const sortedFiltered = useMemo(() => {
    return [...filtered].sort((a, b) => sortAsc ? (a[sortCol] > b[sortCol] ? 1 : -1) : (a[sortCol] < b[sortCol] ? 1 : -1));
  }, [filtered, sortCol, sortAsc]);

  const globalKpis = useMemo(() => {
    if (!filtered.length) return { totalClaims2050: 0, avgFreqTrend: 0, avgSevTrend: 0, totalPML100: 0, highEmergRisk: 0 };
    const totalClaims2050 = filtered.reduce((s, r) => s + calcProjectedClaims(r, scenIdx, 5), 0);
    const avgFreqTrend = filtered.reduce((s, r) => s + r.climateFreqTrend, 0) / filtered.length;
    const avgSevTrend = filtered.reduce((s, r) => s + r.climateSeverityTrend, 0) / filtered.length;
    const totalPML100 = filtered.reduce((s, r) => s + r.pml100, 0);
    const highEmergRisk = filtered.filter(r => r.emergingRisk > 0.6).length;
    return { totalClaims2050: Math.round(totalClaims2050), avgFreqTrend: +avgFreqTrend.toFixed(4), avgSevTrend: +avgSevTrend.toFixed(4), totalPML100: Math.round(totalPML100), highEmergRisk };
  }, [filtered, scenIdx]);

  const forecastData = useMemo(() => TIME_POINTS.map((yr, ti) => {
    const obj = { year: yr };
    NGFS_SCENARIOS.forEach((sc, si) => {
      obj[sc] = filtered.length ? filtered.reduce((s, r) => s + calcProjectedClaims(r, si, ti), 0) : 0;
    });
    return obj;
  }), [filtered]);

  const perilGroupData = useMemo(() => PERILS.map((peril, pi) => {
    const rps = filtered.filter(r => r.peril === peril);
    return {
      peril: peril.split('/')[0].slice(0, 12),
      y2025: rps.length ? rps.reduce((s, r) => s + calcProjectedClaims(r, scenIdx, 0), 0) : 0,
      y2040: rps.length ? rps.reduce((s, r) => s + calcProjectedClaims(r, scenIdx, 3), 0) : 0,
      y2055: rps.length ? rps.reduce((s, r) => s + calcProjectedClaims(r, scenIdx, 6), 0) : 0,
    };
  }), [filtered, scenIdx]);

  const regionData = useMemo(() => REGIONS.map((region, ri) => {
    const rps = filtered.filter(r => r.region === region);
    return {
      region: region.length > 12 ? region.slice(0, 12) + '…' : region,
      claims: rps.length ? rps.reduce((s, r) => s + calcProjectedClaims(r, scenIdx, timeIdx), 0) : 0,
      count: rps.length,
    };
  }).filter(d => d.count > 0), [filtered, scenIdx, timeIdx]);

  const freqSevScatter = useMemo(() => filtered.map(r => ({
    x: r.climateFreqTrend,
    y: r.climateSeverityTrend,
    name: `${r.region.slice(0,8)}/${r.peril.slice(0,6)}`,
    emerging: r.emergingRisk,
  })), [filtered]);

  const emergingHeatmap = useMemo(() => {
    return REGIONS.slice(0, 8).map(region => {
      const row = { region: region.slice(0, 12) };
      PERILS.slice(0, 6).forEach(peril => {
        const rp = REGION_PERIL_COMBOS.find(r => r.region === region && r.peril === peril);
        row[peril.split('/')[0].slice(0, 6)] = rp ? rp.emergingRisk : 0;
      });
      return row;
    });
  }, []);

  const pmlData = useMemo(() => PERILS.map((peril, pi) => {
    const rps = filtered.filter(r => r.peril === peril);
    return {
      peril: peril.split('/')[0].slice(0, 12),
      pml100: rps.length ? rps.reduce((s, r) => s + r.pml100, 0) : 0,
      pml250: rps.length ? rps.reduce((s, r) => s + r.pml250, 0) : 0,
    };
  }), [filtered]);

  const drillRp = REGION_PERIL_COMBOS[drillIdx];

  const decompData = useMemo(() => TIME_POINTS.map((yr, ti) => {
    const base = drillRp.baseClaimsFreq * drillRp.baseSeverityK;
    const freqEffect = base * (Math.pow(1 + drillRp.climateFreqTrend * SCEN_FREQ_MULTS[scenIdx], ti) - 1);
    const sevEffect = base * (Math.pow(1 + drillRp.climateSeverityTrend * SCEN_SEV_MULTS[scenIdx], ti) - 1);
    const expEffect = base * (Math.pow(1 + drillRp.exposureGrowth, ti) - 1);
    const socialEffect = socialInflToggle ? base * drillRp.socialInflation * ti : 0;
    const surgeEffect = demandSurgeToggle && drillRp.catastropheProbability > 0.3 ? base * drillRp.demandSurge : 0;
    return { year: yr, base: +base.toFixed(0), frequency: +freqEffect.toFixed(0), severity: +sevEffect.toFixed(0), exposure: +expEffect.toFixed(0), socialInflation: +socialEffect.toFixed(0), demandSurge: +surgeEffect.toFixed(0) };
  }), [drillIdx, scenIdx, socialInflToggle, demandSurgeToggle]);

  const developmentTriangle = useMemo(() => drillRp.annualHistory.map((v, i) => {
    const devFactor = 1 + sr(drillIdx * 77 + i + 1) * 0.12;
    return { year: `Y${-4 + i}`, paid: v, ultimate: +(v * devFactor).toFixed(0), ibnr: +(v * (devFactor - 1)).toFixed(0) };
  }), [drillIdx]);

  const compareScenData = useMemo(() => {
    const rpA = REGION_PERIL_COMBOS[compareA];
    const rpB = REGION_PERIL_COMBOS[compareB];
    return TIME_POINTS.map((yr, ti) => ({
      year: yr,
      [rpA.region + '/' + rpA.peril.slice(0,4)]: calcProjectedClaims(rpA, scenIdx, ti),
      [rpB.region + '/' + rpB.peril.slice(0,4)]: calcProjectedClaims(rpB, scenIdx, ti),
    }));
  }, [compareA, compareB, scenIdx]);

  const handleSort = useCallback((col) => {
    if (sortCol === col) setSortAsc(v => !v);
    else { setSortCol(col); setSortAsc(false); }
  }, [sortCol]);

  const TABS = ['Claims Forecast Dashboard','Region-Peril Database','Peril Analysis','Regional Claims','PML & Catastrophe','Actuarial Decomposition','Summary & Export'];
  const thS = (col) => ({ padding: '7px 8px', cursor: 'pointer', fontWeight: 700, fontSize: 11, borderBottom: `2px solid ${T.border}`, color: sortCol === col ? T.indigo : T.text, whiteSpace: 'nowrap', textAlign: 'left' });
  const tdS = { padding: '5px 8px', fontSize: 11 };

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: T.text, padding: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 10, color: T.muted, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>EP-DC5 · Sprint DC · Climate-Integrated Actuarial Intelligence Suite</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: T.navy, margin: '0 0 6px' }}>Climate Claims Forecasting Suite</h1>
        <div style={{ fontSize: 12, color: T.muted }}>150 region-peril combinations · 6 NGFS scenarios · 7 time horizons · PML/catastrophe analysis · actuarial decomposition</div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16, background: T.card, padding: 14, borderRadius: 8, border: `1px solid ${T.border}`, alignItems: 'center' }}>
        <select value={scenIdx} onChange={e => setScenIdx(+e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
          {NGFS_SCENARIOS.map((s, i) => <option key={s} value={i}>{s} (F×{SCEN_FREQ_MULTS[i]})</option>)}
        </select>
        <select value={timeIdx} onChange={e => setTimeIdx(+e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
          {TIME_POINTS.map((yr, i) => <option key={yr} value={i}>{yr}</option>)}
        </select>
        <select value={perilFilter} onChange={e => setPerilFilter(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
          <option>All</option>{PERILS.map(p => <option key={p}>{p}</option>)}
        </select>
        <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
          <option>All</option>{REGIONS.map(r => <option key={r}>{r}</option>)}
        </select>
        <select value={pmlPeriod} onChange={e => setPmlPeriod(+e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
          <option value={100}>PML 100yr</option><option value={250}>PML 250yr</option>
        </select>
        <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
          <input type="checkbox" checked={socialInflToggle} onChange={e => setSocialInflToggle(e.target.checked)} /> Social Inflation
        </label>
        <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
          <input type="checkbox" checked={demandSurgeToggle} onChange={e => setDemandSurgeToggle(e.target.checked)} /> Demand Surge
        </label>
        <label style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
          Ins Gap≥ <input type="range" min={0} max={60} value={insGapMin} onChange={e => setInsGapMin(+e.target.value)} style={{ width: 70 }} /> {insGapMin}%
        </label>
        <label style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
          Emerg≥ <input type="range" min={0} max={80} value={emergRiskMin} onChange={e => setEmergRiskMin(+e.target.value)} style={{ width: 70 }} /> {emergRiskMin}%
        </label>
        <input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, width: 130 }} />
        <span style={{ fontSize: 11, color: T.muted }}>{filtered.length} / 150</span>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap', background: T.card, padding: 8, borderRadius: 8, border: `1px solid ${T.border}` }}>
        {TABS.map((t, i) => <TabBtn key={t} label={t} active={tab === i} onClick={() => setTab(i)} />)}
      </div>

      {/* TAB 0: Claims Forecast Dashboard */}
      {tab === 0 && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <KpiCard label={`Total Claims ${TIME_POINTS[timeIdx]}`} value={globalKpis.totalClaims2050.toLocaleString()} unit="$M" color={T.red} />
            <KpiCard label="Avg Freq Trend" value={(globalKpis.avgFreqTrend * 100).toFixed(2)} unit="%/yr" color={T.orange} />
            <KpiCard label="Avg Sev Trend" value={(globalKpis.avgSevTrend * 100).toFixed(2)} unit="%/yr" color={T.amber} />
            <KpiCard label="Total PML 100yr" value={globalKpis.totalPML100.toLocaleString()} unit="$M" color={T.indigo} />
            <KpiCard label="High Emerging Risk" value={globalKpis.highEmergRisk} unit="combos" color={T.purple} />
            <KpiCard label="Combos" value={filtered.length} unit="/ 150" color={T.navy} />
          </div>
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>6-NGFS Claims Forecast 2025–2055</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                {NGFS_SCENARIOS.map((sc, si) => (
                  <Area key={sc} type="monotone" dataKey={sc} fill={SCEN_COLORS[si]} stroke={SCEN_COLORS[si]} fillOpacity={0.2} strokeWidth={2} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Total 2050 Claims by Scenario (Comparison)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={NGFS_SCENARIOS.map((sc, si) => ({
                scenario: sc.split(' ').slice(0,2).join(' '),
                claims: filtered.length ? filtered.reduce((s, r) => s + calcProjectedClaims(r, si, 5), 0) : 0,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="scenario" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="claims" name="Total Claims $M" fill={T.indigo} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TAB 1: Region-Peril Database */}
      {tab === 1 && (
        <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20 }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>Region-Peril Database — {sortedFiltered.length} / 150</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead><tr style={{ background: T.sub }}>
                {[['region','Region'],['peril','Peril'],['baseClaimsFreq','Base Freq'],['baseSeverityK','Base Sev $K'],['climateFreqTrend','Freq Trend'],['climateSeverityTrend','Sev Trend'],['insuranceGap','Ins Gap %'],['catastropheProbability','Cat Prob'],['pml100','PML 100yr'],['pml250','PML 250yr'],['socialInflation','Social Infl'],['emergingRisk','Emerg Risk'],['lossDistribution','Dist']].map(([col, label]) => (
                  <th key={col} onClick={() => handleSort(col)} style={thS(col)}>{label}{sortCol === col ? (sortAsc ? ' ↑' : ' ↓') : ''}</th>
                ))}
                <th style={{ padding: '7px 8px', fontWeight: 700, fontSize: 11, borderBottom: `2px solid ${T.border}` }}>Trend</th>
                <th style={{ padding: '7px 8px', fontWeight: 700, fontSize: 11, borderBottom: `2px solid ${T.border}` }}>{TIME_POINTS[timeIdx]} Claims</th>
              </tr></thead>
              <tbody>{sortedFiltered.map((r, i) => (
                <tr key={r.id} style={{ background: i % 2 === 0 ? T.bg : T.card, cursor: 'pointer' }} onClick={() => setDrillIdx(r.id)}>
                  <td style={tdS}>{r.region.slice(0,14)}</td>
                  <td style={{ ...tdS, fontSize: 10 }}>{r.peril.split('/')[0]}</td>
                  <td style={tdS}>{r.baseClaimsFreq}</td>
                  <td style={tdS}>${r.baseSeverityK}K</td>
                  <td style={{ ...tdS, color: r.climateFreqTrend > 0.03 ? T.red : T.text }}>{(r.climateFreqTrend * 100).toFixed(2)}%</td>
                  <td style={{ ...tdS, color: r.climateSeverityTrend > 0.025 ? T.red : T.text }}>{(r.climateSeverityTrend * 100).toFixed(2)}%</td>
                  <td style={tdS}>{r.insuranceGap}%</td>
                  <td style={{ ...tdS, color: r.catastropheProbability > 0.4 ? T.red : T.text }}>{(r.catastropheProbability * 100).toFixed(1)}%</td>
                  <td style={{ ...tdS, fontWeight: 600 }}>${r.pml100.toLocaleString()}</td>
                  <td style={tdS}>${r.pml250.toLocaleString()}</td>
                  <td style={tdS}>{(r.socialInflation * 100).toFixed(1)}%</td>
                  <td style={{ ...tdS, color: r.emergingRisk > 0.6 ? T.red : r.emergingRisk > 0.3 ? T.amber : T.text }}>{(r.emergingRisk * 100).toFixed(0)}%</td>
                  <td style={tdS}>{r.lossDistribution}</td>
                  <td style={tdS}><TrendArrow val={(r.climateFreqTrend + r.climateSeverityTrend) / 2} /></td>
                  <td style={{ ...tdS, fontWeight: 600, color: T.indigo }}>${calcProjectedClaims(r, scenIdx, timeIdx).toLocaleString()}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Peril Analysis */}
      {tab === 2 && (
        <div>
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Grouped Claims by Peril — 2025 / 2040 / 2055 ({NGFS_SCENARIOS[scenIdx]})</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={perilGroupData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="peril" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="y2025" name="2025" fill={T.teal} />
                <Bar dataKey="y2040" name="2040" fill={T.amber} />
                <Bar dataKey="y2055" name="2055" fill={T.red} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20 }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Social Inflation Impact by Peril</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={PERILS.map((peril, pi) => {
                  const rps = filtered.filter(r => r.peril === peril);
                  return {
                    peril: peril.split('/')[0].slice(0, 10),
                    socialInfl: rps.length ? +(rps.reduce((s, r) => s + r.socialInflation, 0) / rps.length * 100).toFixed(2) : 0,
                  };
                })}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="peril" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip />
                  <Bar dataKey="socialInfl" name="Avg Social Infl %/yr" fill={T.purple} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20 }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Reinsurance Effectiveness by Peril</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={PERILS.map((peril, pi) => {
                  const rps = filtered.filter(r => r.peril === peril);
                  if (!rps.length) return { peril: peril.split('/')[0].slice(0,10), gross: 0, net: 0 };
                  const gross = rps.reduce((s, r) => s + calcProjectedClaims(r, scenIdx, timeIdx), 0);
                  const net = rps.reduce((s, r) => s + calcNetAfterReins(r, scenIdx, timeIdx), 0);
                  return { peril: peril.split('/')[0].slice(0,10), gross: +gross.toFixed(0), net: +net.toFixed(0) };
                })}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="peril" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="gross" name="Gross Claims" fill={T.red} />
                  <Bar dataKey="net" name="Net Claims" fill={T.green} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Regional Claims */}
      {tab === 3 && (
        <div>
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Total Projected Claims by Region — {TIME_POINTS[timeIdx]} ({NGFS_SCENARIOS[scenIdx]})</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart layout="vertical" data={[...regionData].sort((a,b) => b.claims - a.claims)}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="region" type="category" tick={{ fontSize: 10 }} width={110} />
                <Tooltip />
                <Bar dataKey="claims" name="Claims $M" fill={T.indigo} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20 }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Freq Trend vs Sev Trend (Scatter)</h3>
              <ResponsiveContainer width="100%" height={240}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="x" name="Freq Trend" tick={{ fontSize: 10 }} tickFormatter={v => (v*100).toFixed(1)+'%'} />
                  <YAxis dataKey="y" name="Sev Trend" tick={{ fontSize: 10 }} tickFormatter={v => (v*100).toFixed(1)+'%'} />
                  <Tooltip content={({ payload }) => payload?.length ? <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: 8, fontSize: 11 }}><b>{payload[0]?.payload?.name}</b><br/>F: {(payload[0]?.payload?.x*100).toFixed(2)}% S: {(payload[0]?.payload?.y*100).toFixed(2)}%</div> : null} />
                  <Scatter data={freqSevScatter} fill={T.red} opacity={0.6} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20 }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Emerging Risk Heatmap (8 Regions × 6 Perils)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: `auto repeat(6, 1fr)`, gap: 2, fontSize: 10 }}>
                <div></div>
                {PERILS.slice(0,6).map((p,i) => <div key={i} style={{ padding: '3px 2px', textAlign: 'center', fontWeight: 700, color: T.muted, fontSize: 9 }}>{p.slice(0,4)}</div>)}
                {emergingHeatmap.map((row, ri) => [
                  <div key={`r${ri}`} style={{ padding: '3px 4px', fontWeight: 700, color: T.muted, fontSize: 9, whiteSpace: 'nowrap' }}>{row.region}</div>,
                  ...PERILS.slice(0,6).map((p,pi) => {
                    const key = p.split('/')[0].slice(0,6);
                    const val = row[key] || 0;
                    return <div key={`${ri}-${pi}`} style={{ padding: '3px 2px', textAlign: 'center', background: `rgba(220,38,38,${val * 0.8})`, color: val > 0.5 ? '#fff' : T.text, fontSize: 9, borderRadius: 2 }}>{(val * 100).toFixed(0)}%</div>;
                  })
                ])}
              </div>
            </div>
          </div>
          {compareMode && (
            <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginBottom: 16 }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Region-Peril Comparison</h3>
              <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                <select value={compareA} onChange={e => setCompareA(+e.target.value)} style={{ padding: '5px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
                  {REGION_PERIL_COMBOS.map((r, i) => <option key={i} value={i}>{r.region.slice(0,10)}/{r.peril.slice(0,8)}</option>)}
                </select>
                <select value={compareB} onChange={e => setCompareB(+e.target.value)} style={{ padding: '5px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
                  {REGION_PERIL_COMBOS.map((r, i) => <option key={i} value={i}>{r.region.slice(0,10)}/{r.peril.slice(0,8)}</option>)}
                </select>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={compareScenData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  {Object.keys(compareScenData[0] || {}).filter(k => k !== 'year').map((k, i) => (
                    <Line key={k} type="monotone" dataKey={k} stroke={[T.indigo, T.red][i]} strokeWidth={2} dot={{ r: 3 }} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          <button onClick={() => setCompareMode(!compareMode)} style={{ padding: '7px 14px', background: compareMode ? T.red : T.indigo, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
            {compareMode ? 'Exit Compare Mode' : 'Enable Compare Mode'}
          </button>
        </div>
      )}

      {/* TAB 4: PML & Catastrophe */}
      {tab === 4 && (
        <div>
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>PML 100yr vs 250yr by Peril</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={pmlData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="peril" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="pml100" name="PML 100yr $M" fill={T.amber} />
                <Bar dataKey="pml250" name="PML 250yr $M" fill={T.red} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>Catastrophe Probability Table — Top Combinations</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead><tr style={{ background: T.sub }}>
                  {['Region','Peril','Cat Prob %','PML 100yr $M','PML 250yr $M','Ins Gap %','Demand Surge %','Reins Trigger $K','Emerging Risk %','Distribution'].map(h => <th key={h} style={{ padding: '7px 8px', fontWeight: 700, borderBottom: `2px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>)}
                </tr></thead>
                <tbody>{[...filtered].sort((a,b) => b.catastropheProbability - a.catastropheProbability).slice(0,25).map((r, i) => (
                  <tr key={r.id} style={{ background: i % 2 === 0 ? T.bg : T.card }}>
                    <td style={tdS}>{r.region.slice(0,12)}</td>
                    <td style={{ ...tdS, fontSize: 10 }}>{r.peril.split('/')[0]}</td>
                    <td style={{ ...tdS, color: r.catastropheProbability > 0.4 ? T.red : T.amber, fontWeight: 600 }}>{(r.catastropheProbability * 100).toFixed(1)}%</td>
                    <td style={tdS}>${r.pml100.toLocaleString()}</td>
                    <td style={{ ...tdS, color: T.red }}>${r.pml250.toLocaleString()}</td>
                    <td style={tdS}>{r.insuranceGap}%</td>
                    <td style={{ ...tdS, color: r.demandSurge > 0.1 ? T.orange : T.text }}>{(r.demandSurge * 100).toFixed(1)}%</td>
                    <td style={tdS}>${r.reinsuranceTrigger.toLocaleString()}</td>
                    <td style={{ ...tdS, color: r.emergingRisk > 0.6 ? T.red : r.emergingRisk > 0.3 ? T.amber : T.text }}>{(r.emergingRisk * 100).toFixed(0)}%</td>
                    <td style={tdS}>{r.lossDistribution}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Actuarial Decomposition */}
      {tab === 5 && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'center' }}>
            <label style={{ fontSize: 12, fontWeight: 600 }}>Region-Peril: </label>
            <select value={drillIdx} onChange={e => setDrillIdx(+e.target.value)} style={{ padding: '5px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
              {REGION_PERIL_COMBOS.map((r, i) => <option key={i} value={i}>{r.region} / {r.peril}</option>)}
            </select>
          </div>
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Claims Decomposition — {drillRp.region} / {drillRp.peril} ({NGFS_SCENARIOS[scenIdx]})</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={decompData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="base" name="Base Claims" fill={T.navy} stackId="a" />
                <Bar dataKey="frequency" name="Frequency Effect" fill={T.red} stackId="a" />
                <Bar dataKey="severity" name="Severity Effect" fill={T.orange} stackId="a" />
                <Bar dataKey="exposure" name="Exposure Growth" fill={T.amber} stackId="a" />
                <Bar dataKey="socialInflation" name="Social Inflation" fill={T.purple} stackId="a" />
                <Bar dataKey="demandSurge" name="Demand Surge" fill={T.teal} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Claims Development Triangle — {drillRp.region}/{drillRp.peril.split('/')[0]}</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead><tr style={{ background: T.sub }}>
                {['Year','Paid Claims $K','Ultimate $K','IBNR $K','Dev Factor'].map(h => <th key={h} style={{ padding: '7px 10px', fontWeight: 700, borderBottom: `2px solid ${T.border}` }}>{h}</th>)}
              </tr></thead>
              <tbody>{developmentTriangle.map((r, i) => (
                <tr key={r.year} style={{ background: i % 2 === 0 ? T.bg : T.card }}>
                  <td style={{ ...tdS, fontWeight: 600 }}>{r.year}</td>
                  <td style={tdS}>${r.paid.toLocaleString()}</td>
                  <td style={tdS}>${r.ultimate.toLocaleString()}</td>
                  <td style={{ ...tdS, color: T.red }}>${r.ibnr.toLocaleString()}</td>
                  <td style={tdS}>{r.paid > 0 ? (r.ultimate / r.paid).toFixed(3) : '—'}×</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: Summary & Export */}
      {tab === 6 && (
        <div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
            <KpiCard label="Combinations" value={filtered.length} unit="/ 150" color={T.indigo} />
            <KpiCard label="Scenario" value={NGFS_SCENARIOS[scenIdx].split(' ')[0]} unit="" color={T.navy} />
            <KpiCard label="Horizon" value={TIME_POINTS[timeIdx]} unit="" color={T.teal} />
            <KpiCard label="Total Claims" value={globalKpis.totalClaims2050.toLocaleString()} unit="$M" color={T.red} />
            <KpiCard label="Total PML 100yr" value={globalKpis.totalPML100.toLocaleString()} unit="$M" color={T.orange} />
            <KpiCard label="Avg Freq Trend" value={(globalKpis.avgFreqTrend * 100).toFixed(2)} unit="%/yr" color={T.amber} />
            <KpiCard label="High Emerg Risk" value={globalKpis.highEmergRisk} unit="combos" color={T.purple} />
          </div>
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20 }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700 }}>Full Export Table — {filtered.length} Region-Peril Combinations · Scenario: {NGFS_SCENARIOS[scenIdx]}</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead><tr style={{ background: T.sub }}>
                  {['Region','Peril','Base Freq','Base Sev $K','Freq Trend','Sev Trend','Ins Gap %','Cat Prob %','PML 100yr','PML 250yr','Social Infl','Demand Surge','Emerg Risk',`${TIME_POINTS[timeIdx]} Claims $M`,'Net Claims $M','Distribution'].map(h => (
                    <th key={h} style={{ padding: '7px 8px', fontWeight: 700, borderBottom: `2px solid ${T.border}`, whiteSpace: 'nowrap', textAlign: 'left' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{sortedFiltered.map((r, i) => (
                  <tr key={r.id} style={{ background: i % 2 === 0 ? T.bg : T.card }}>
                    <td style={tdS}>{r.region.slice(0,12)}</td>
                    <td style={{ ...tdS, fontSize: 10 }}>{r.peril.split('/')[0]}</td>
                    <td style={tdS}>{r.baseClaimsFreq}</td>
                    <td style={tdS}>${r.baseSeverityK}K</td>
                    <td style={tdS}>{(r.climateFreqTrend*100).toFixed(2)}%</td>
                    <td style={tdS}>{(r.climateSeverityTrend*100).toFixed(2)}%</td>
                    <td style={tdS}>{r.insuranceGap}%</td>
                    <td style={{ ...tdS, color: r.catastropheProbability > 0.4 ? T.red : T.text }}>{(r.catastropheProbability*100).toFixed(1)}%</td>
                    <td style={{ ...tdS, fontWeight: 600 }}>${r.pml100.toLocaleString()}</td>
                    <td style={tdS}>${r.pml250.toLocaleString()}</td>
                    <td style={tdS}>{(r.socialInflation*100).toFixed(1)}%</td>
                    <td style={tdS}>{(r.demandSurge*100).toFixed(1)}%</td>
                    <td style={{ ...tdS, color: r.emergingRisk > 0.6 ? T.red : T.text }}>{(r.emergingRisk*100).toFixed(0)}%</td>
                    <td style={{ ...tdS, fontWeight: 600, color: T.indigo }}>${calcProjectedClaims(r, scenIdx, timeIdx).toLocaleString()}</td>
                    <td style={tdS}>${calcNetAfterReins(r, scenIdx, timeIdx).toLocaleString()}</td>
                    <td style={tdS}>{r.lossDistribution}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
          {/* Scenario × Peril Claims Projection Matrix */}
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginTop: 16 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>Scenario × Peril Projected Claims Matrix ($M) — Horizon: {TIME_POINTS[timeIdx]}</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead><tr style={{ background: T.sub }}>
                  <th style={{ padding: '7px 10px', fontWeight: 700, borderBottom: `2px solid ${T.border}`, textAlign: 'left' }}>Peril</th>
                  {NGFS_SCENARIOS.map(s => <th key={s} style={{ padding: '7px 8px', fontWeight: 700, borderBottom: `2px solid ${T.border}`, textAlign: 'right', whiteSpace: 'nowrap', fontSize: 10 }}>{s.slice(0, 12)}</th>)}
                  <th style={{ padding: '7px 8px', fontWeight: 700, borderBottom: `2px solid ${T.border}`, textAlign: 'right' }}>Max Δ%</th>
                </tr></thead>
                <tbody>{PERILS.map((peril, pi) => {
                  const scenClaims = NGFS_SCENARIOS.map((_, si) => {
                    const combos = REGION_PERIL_COMBOS.filter(r => r.perilIdx === pi);
                    return combos.length ? combos.reduce((s, r) => s + calcProjectedClaims(r, si, timeIdx), 0) / 1000 : 0;
                  });
                  const base = scenClaims[0] || 1;
                  const maxDelta = ((Math.max(...scenClaims) - base) / base * 100).toFixed(1);
                  return (
                    <tr key={peril} style={{ background: pi % 2 === 0 ? T.bg : T.card }}>
                      <td style={{ padding: '6px 10px', fontWeight: 600, fontSize: 11 }}>{peril.split('/')[0]}</td>
                      {scenClaims.map((v, si) => (
                        <td key={si} style={{ padding: '6px 8px', textAlign: 'right', fontWeight: si === scenIdx ? 700 : 400, color: si === scenIdx ? T.indigo : T.text, background: si === scenIdx ? '#f0f0ff' : 'transparent' }}>${v.toFixed(1)}M</td>
                      ))}
                      <td style={{ padding: '6px 8px', textAlign: 'right', color: +maxDelta > 30 ? T.red : T.amber, fontWeight: 700 }}>+{maxDelta}%</td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
          </div>
          {/* CAGR Analysis by Region */}
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginTop: 16 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>Claims CAGR Analysis by Region — Scenario: {NGFS_SCENARIOS[scenIdx]}</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead><tr style={{ background: T.sub }}>
                  {['Region', '2025 Claims $M', '2055 Claims $M', '30Y CAGR %', 'Net CAGR %', 'Social Infl Contrib', 'Demand Surge Contrib', 'Climate Freq Contrib', 'Climate Sev Contrib', 'Risk Rating'].map(h => (
                    <th key={h} style={{ padding: '7px 8px', fontWeight: 700, borderBottom: `2px solid ${T.border}`, textAlign: 'right', whiteSpace: 'nowrap', ...(h === 'Region' ? { textAlign: 'left' } : {}) }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{REGIONS.map((region, ri) => {
                  const combos = REGION_PERIL_COMBOS.filter(r => r.regionIdx === ri);
                  if (!combos.length) return null;
                  const claims2025 = combos.reduce((s, r) => s + calcProjectedClaims(r, scenIdx, 0), 0) / 1000;
                  const claims2055 = combos.reduce((s, r) => s + calcProjectedClaims(r, scenIdx, 6), 0) / 1000;
                  const cagr = claims2025 > 0 ? ((Math.pow(claims2055 / claims2025, 1 / 30) - 1) * 100).toFixed(2) : '0.00';
                  const netClaims2055 = combos.reduce((s, r) => s + calcNetAfterReins(r, scenIdx, 6), 0) / 1000;
                  const netCagr = claims2025 > 0 ? ((Math.pow(netClaims2055 / claims2025, 1 / 30) - 1) * 100).toFixed(2) : '0.00';
                  const avgSocInfl = combos.length ? (combos.reduce((s, r) => s + r.socialInflation, 0) / combos.length * 100).toFixed(1) : 0;
                  const avgDemSurge = combos.length ? (combos.reduce((s, r) => s + r.demandSurge, 0) / combos.length * 100).toFixed(1) : 0;
                  const avgFreqTrend = combos.length ? (combos.reduce((s, r) => s + r.climateFreqTrend, 0) / combos.length * 100).toFixed(2) : 0;
                  const avgSevTrend = combos.length ? (combos.reduce((s, r) => s + r.climateSeverityTrend, 0) / combos.length * 100).toFixed(2) : 0;
                  const cagrNum = parseFloat(cagr);
                  const riskRating = cagrNum > 8 ? 'Critical' : cagrNum > 5 ? 'High' : cagrNum > 3 ? 'Medium' : 'Low';
                  const ratingColor = { Critical: T.red, High: T.orange, Medium: T.amber, Low: T.green }[riskRating];
                  return (
                    <tr key={region} style={{ background: ri % 2 === 0 ? T.bg : T.card }}>
                      <td style={{ padding: '6px 8px', fontWeight: 600 }}>{region}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>${claims2025.toFixed(1)}M</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', color: T.indigo, fontWeight: 600 }}>${claims2055.toFixed(1)}M</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700, color: +cagr > 5 ? T.red : T.amber }}>+{cagr}%</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>+{netCagr}%</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>{avgSocInfl}%</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>{avgDemSurge}%</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>{avgFreqTrend}%</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>{avgSevTrend}%</td>
                      <td style={{ padding: '6px 8px', textAlign: 'center' }}><span style={{ background: ratingColor + '22', color: ratingColor, padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>{riskRating}</span></td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
          </div>
          {/* Social Inflation Decomposition */}
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginTop: 16 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>Social Inflation & Demand Surge Decomposition by Peril</h3>
            <ResponsiveContainer width="100%" height={240}>
              <ComposedChart data={PERILS.map((peril, pi) => {
                const combos = REGION_PERIL_COMBOS.filter(r => r.perilIdx === pi);
                const avgSI = combos.length ? (combos.reduce((s, r) => s + r.socialInflation, 0) / combos.length * 100) : 0;
                const avgDS = combos.length ? (combos.reduce((s, r) => s + r.demandSurge, 0) / combos.length * 100) : 0;
                const avgER = combos.length ? (combos.reduce((s, r) => s + r.emergingRisk, 0) / combos.length * 100) : 0;
                return { name: peril.split('/')[0].slice(0, 8), socialInflation: +avgSI.toFixed(1), demandSurge: +avgDS.toFixed(1), emergingRisk: +avgER.toFixed(1) };
              })} margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-35} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 10 }} unit="%" />
                <Tooltip formatter={(v, n) => [v.toFixed(1) + '%', n]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="socialInflation" name="Social Inflation" fill={T.red} stackId="a" />
                <Bar dataKey="demandSurge" name="Demand Surge" fill={T.amber} stackId="a" />
                <Line type="monotone" dataKey="emergingRisk" name="Emerging Risk %" stroke={T.purple} strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          {/* PML Concentration Analysis */}
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginTop: 16 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>PML Concentration & Insurance Gap Analysis</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <h4 style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: T.muted }}>Top 10 PML 250yr Concentrations</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead><tr style={{ background: T.sub }}>
                    {['Region', 'Peril', 'PML 250yr $M', 'Ins Gap %', 'Cat Prob %'].map(h => (
                      <th key={h} style={{ padding: '5px 7px', fontWeight: 700, borderBottom: `1px solid ${T.border}`, textAlign: h === 'Region' || h === 'Peril' ? 'left' : 'right', fontSize: 10 }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>{[...REGION_PERIL_COMBOS].sort((a, b) => b.pml250 - a.pml250).slice(0, 10).map((r, i) => (
                    <tr key={r.id} style={{ background: i % 2 === 0 ? T.bg : T.card }}>
                      <td style={{ padding: '5px 7px', fontSize: 10 }}>{r.region.slice(0, 14)}</td>
                      <td style={{ padding: '5px 7px', fontSize: 9 }}>{r.peril.split('/')[0].slice(0, 10)}</td>
                      <td style={{ padding: '5px 7px', textAlign: 'right', fontWeight: 700, color: T.red }}>${(r.pml250 / 1000).toFixed(0)}M</td>
                      <td style={{ padding: '5px 7px', textAlign: 'right', color: r.insuranceGap > 50 ? T.red : T.text }}>{r.insuranceGap}%</td>
                      <td style={{ padding: '5px 7px', textAlign: 'right', color: r.catastropheProbability > 0.4 ? T.red : T.amber }}>{(r.catastropheProbability * 100).toFixed(1)}%</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
              <div>
                <h4 style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: T.muted }}>Portfolio Key Metrics Summary</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { label: 'Total Region-Peril Combos', value: REGION_PERIL_COMBOS.length, color: T.indigo },
                    { label: 'Avg Insurance Gap', value: (REGION_PERIL_COMBOS.reduce((s, r) => s + r.insuranceGap, 0) / REGION_PERIL_COMBOS.length).toFixed(1) + '%', color: T.red },
                    { label: 'Total PML 100yr $B', value: '$' + (REGION_PERIL_COMBOS.reduce((s, r) => s + r.pml100, 0) / 1e6).toFixed(1) + 'B', color: T.orange },
                    { label: 'Total PML 250yr $B', value: '$' + (REGION_PERIL_COMBOS.reduce((s, r) => s + r.pml250, 0) / 1e6).toFixed(1) + 'B', color: T.red },
                    { label: 'High Cat Risk Combos', value: REGION_PERIL_COMBOS.filter(r => r.catastropheProbability > 0.4).length, color: T.purple },
                    { label: 'High Emerging Risk', value: REGION_PERIL_COMBOS.filter(r => r.emergingRisk > 0.6).length + ' combos', color: T.amber },
                    { label: 'Avg Freq Trend pa', value: (REGION_PERIL_COMBOS.reduce((s, r) => s + r.climateFreqTrend, 0) / REGION_PERIL_COMBOS.length * 100).toFixed(2) + '%', color: T.teal },
                    { label: 'Avg Severity Trend pa', value: (REGION_PERIL_COMBOS.reduce((s, r) => s + r.climateSeverityTrend, 0) / REGION_PERIL_COMBOS.length * 100).toFixed(2) + '%', color: T.navy },
                    { label: 'Regions Covered', value: REGIONS.length, color: T.green },
                    { label: 'Perils Covered', value: PERILS.length, color: T.blue },
                    { label: 'NGFS Scenarios', value: NGFS_SCENARIOS.length, color: T.gold },
                    { label: 'Time Horizons', value: TIME_POINTS.length, color: T.teal },
                  ].map(m => (
                    <div key={m.label} style={{ background: T.sub, borderRadius: 6, padding: '8px 10px', borderLeft: `3px solid ${m.color}` }}>
                      <div style={{ fontSize: 10, color: T.muted, marginBottom: 2 }}>{m.label}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: m.color }}>{m.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {/* Actuarial Decomposition Summary — 6 scenarios × 10 perils net claims */}
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginTop: 16 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>Actuarial Decomposition: Net Claims by Loss Component — Horizon {TIME_POINTS[timeIdx]}</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={REGIONS.map((region, ri) => {
                const combos = REGION_PERIL_COMBOS.filter(r => r.regionIdx === ri);
                const freqDriven = combos.reduce((s, r) => s + r.baseClaimsFreq * r.baseSeverityK * (1 + r.climateFreqTrend) ** (2030 - 2025) / 1000, 0);
                const sevDriven = combos.reduce((s, r) => s + r.baseClaimsFreq * r.baseSeverityK * (1 + r.climateSeverityTrend) ** (2030 - 2025) / 1000 - r.baseClaimsFreq * r.baseSeverityK / 1000, 0);
                const inflDriven = combos.reduce((s, r) => s + r.baseClaimsFreq * r.baseSeverityK * r.socialInflation / 1000, 0);
                return { name: region.slice(0, 6), freqDriven: +freqDriven.toFixed(0), sevDriven: +Math.max(0, sevDriven).toFixed(0), inflDriven: +inflDriven.toFixed(0) };
              })} margin={{ top: 10, right: 20, left: 0, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-40} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="freqDriven" name="Freq-Driven $K" fill={T.indigo} stackId="a" />
                <Bar dataKey="sevDriven" name="Sev-Driven $K" fill={T.orange} stackId="a" />
                <Bar dataKey="inflDriven" name="Inflation-Driven $K" fill={T.red} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Reinsurance Efficiency & Net Retention Summary */}
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginTop: 16 }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700 }}>Reinsurance Efficiency & Net Retention Summary — by Peril</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
              {PERILS.map((peril, pi) => {
                const combos = REGION_PERIL_COMBOS.filter(r => r.perilIdx === pi);
                const grossClaims = combos.reduce((s, r) => s + calcProjectedClaims(r, scenIdx, timeIdx), 0);
                const netClaims = combos.reduce((s, r) => s + calcNetAfterReins(r, scenIdx, timeIdx), 0);
                const retention = grossClaims > 0 ? (netClaims / grossClaims * 100).toFixed(0) : 100;
                const ceded = grossClaims > 0 ? ((grossClaims - netClaims) / grossClaims * 100).toFixed(0) : 0;
                return (
                  <div key={peril} style={{ background: T.sub, borderRadius: 6, padding: '10px 12px', borderTop: `3px solid ${T.indigo}` }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: T.text, marginBottom: 4 }}>{peril.split('/')[0].slice(0, 12)}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.indigo }}>{retention}% retained</div>
                    <div style={{ fontSize: 10, color: T.muted }}>{ceded}% ceded</div>
                    <div style={{ fontSize: 10, color: T.text, marginTop: 4 }}>${(grossClaims / 1000).toFixed(0)}M gross</div>
                    <div style={{ height: 4, background: T.border, borderRadius: 2, marginTop: 6 }}>
                      <div style={{ height: 4, background: T.indigo, borderRadius: 2, width: retention + '%' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {/* Emerging Risk Watch List */}
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginTop: 16 }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700 }}>Emerging Risk Watch List — Top 15 Highest Emerging Risk Scores</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead><tr style={{ background: T.sub }}>
                  {['Rank', 'Region', 'Peril', 'Emerg Risk %', 'Cat Prob %', 'Ins Gap %', 'PML 100yr', 'Freq Trend', 'Sev Trend', 'Watch Priority'].map(h => (
                    <th key={h} style={{ padding: '6px 8px', fontWeight: 700, borderBottom: `2px solid ${T.border}`, textAlign: h === 'Rank' || h === 'Region' || h === 'Peril' ? 'left' : 'right', whiteSpace: 'nowrap', fontSize: 10 }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{[...REGION_PERIL_COMBOS].sort((a, b) => b.emergingRisk - a.emergingRisk).slice(0, 15).map((r, i) => {
                  const priority = r.emergingRisk > 0.75 ? 'Immediate' : r.emergingRisk > 0.60 ? 'High' : 'Elevated';
                  const pColor = { Immediate: T.red, High: T.orange, Elevated: T.amber }[priority];
                  return (
                    <tr key={r.id} style={{ background: i % 2 === 0 ? T.bg : T.card }}>
                      <td style={{ padding: '5px 8px', fontWeight: 700, color: T.muted }}>{i + 1}</td>
                      <td style={{ padding: '5px 8px', fontWeight: 600 }}>{r.region.slice(0, 14)}</td>
                      <td style={{ padding: '5px 8px', fontSize: 10 }}>{r.peril.split('/')[0].slice(0, 12)}</td>
                      <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 700, color: T.red }}>{(r.emergingRisk * 100).toFixed(0)}%</td>
                      <td style={{ padding: '5px 8px', textAlign: 'right', color: r.catastropheProbability > 0.4 ? T.red : T.amber }}>{(r.catastropheProbability * 100).toFixed(1)}%</td>
                      <td style={{ padding: '5px 8px', textAlign: 'right' }}>{r.insuranceGap}%</td>
                      <td style={{ padding: '5px 8px', textAlign: 'right' }}>${(r.pml100 / 1000).toFixed(0)}M</td>
                      <td style={{ padding: '5px 8px', textAlign: 'right' }}>{(r.climateFreqTrend * 100).toFixed(2)}%pa</td>
                      <td style={{ padding: '5px 8px', textAlign: 'right' }}>{(r.climateSeverityTrend * 100).toFixed(2)}%pa</td>
                      <td style={{ padding: '5px 8px', textAlign: 'center' }}><span style={{ background: pColor + '22', color: pColor, padding: '2px 6px', borderRadius: 4, fontSize: 9, fontWeight: 700 }}>{priority}</span></td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
          </div>
          {/* Claims Frequency vs Severity Scatter */}
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginTop: 16 }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700 }}>Claims Frequency vs Severity — Region-Peril Portfolio Map</h3>
            <ResponsiveContainer width="100%" height={200}>
              <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="freq" name="Base Frequency" type="number" tick={{ fontSize: 10 }} label={{ value: 'Base Claims Frequency', position: 'insideBottom', offset: -5, fontSize: 10 }} />
                <YAxis dataKey="sev" name="Base Severity $K" type="number" tick={{ fontSize: 10 }} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(v, n) => [n === 'freq' ? v.toFixed(0) : '$' + v.toFixed(0) + 'K', n === 'freq' ? 'Frequency' : 'Severity']} />
                <Scatter name="Region-Peril Combos" data={filtered.slice(0, 80).map(r => ({ freq: r.baseClaimsFreq, sev: r.baseSeverityK, name: r.id }))} fill={T.indigo} opacity={0.5} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          {/* Historical Loss Volatility */}
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginTop: 16 }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700 }}>Historical Annual Loss Volatility — Portfolio Trend (2020–2024)</h3>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={[2020, 2021, 2022, 2023, 2024].map((yr, yi) => {
                const total = REGION_PERIL_COMBOS.reduce((s, r) => s + (r.annualHistory?.[yi] || 0), 0) / 1000;
                return { year: yr, totalClaims: +total.toFixed(0) };
              })} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => ['$' + v.toLocaleString() + 'M', 'Total Claims']} />
                <Area type="monotone" dataKey="totalClaims" name="Total Claims $M" stroke={T.indigo} fill={T.indigo} fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {/* Insurance Gap Heat Summary */}
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginTop: 16 }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700 }}>Insurance Protection Gap — Peril Summary</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
              {PERILS.map((peril, pi) => {
                const combos = REGION_PERIL_COMBOS.filter(r => r.perilIdx === pi);
                const avgGap = combos.length ? (combos.reduce((s, r) => s + r.insuranceGap, 0) / combos.length).toFixed(0) : 0;
                const gapNum = +avgGap;
                const color = gapNum > 60 ? T.red : gapNum > 40 ? T.orange : gapNum > 25 ? T.amber : T.green;
                return (
                  <div key={peril} style={{ background: T.sub, borderRadius: 6, padding: '10px 12px', borderTop: `3px solid ${color}` }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: T.text, marginBottom: 4 }}>{peril.split('/')[0].slice(0, 12)}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color }}>{avgGap}%</div>
                    <div style={{ fontSize: 10, color: T.muted }}>avg ins gap</div>
                    <div style={{ fontSize: 10, color: T.text, marginTop: 2 }}>{combos.length} combos</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
