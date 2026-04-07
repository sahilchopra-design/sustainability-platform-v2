import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, ScatterChart, Scatter, ComposedChart, Area, AreaChart,
} from 'recharts';

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', text: '#1a1a2e',
  sub: '#f6f4f0', muted: '#6b7280', indigo: '#4f46e5', gold: '#b8860b',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706',
  navy: '#1e3a5f', teal: '#0f766e', purple: '#7c3aed', orange: '#ea580c',
};
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const REGIONS = ['Europe', 'Americas', 'Asia-Pacific', 'Africa', 'Middle East'];
const CLIMATE_ZONES = ['Tropical', 'Arid', 'Temperate', 'Continental', 'Polar'];
const NGFS_SCENARIOS = ['Net Zero 2050', 'Delayed Transition', 'Divergent Net Zero', 'Nationally Determined', 'Current Policies', 'Fragmented World'];
const HORIZONS = [2025, 2030, 2035, 2040, 2050];
const AGE_BANDS = ['<50','50-54','55-59','60-64','65-69','70-74','75-79','80-84','85-89','90+'];
const SCENARIO_WARMING = [1.5, 2.0, 1.8, 2.4, 3.2, 3.8];
const SCENARIO_MULT = [1.05, 1.12, 1.08, 1.18, 1.28, 1.38];
const SCEN_COLORS = ['#16a34a','#d97706','#0369a1','#ea580c','#dc2626','#7c3aed'];

const COUNTRY_NAMES = [
  'Germany','France','United Kingdom','Italy','Spain','Netherlands','Sweden','Norway','Denmark','Finland',
  'United States','Canada','Brazil','Mexico','Argentina','Colombia','Chile','Peru','Ecuador','Venezuela',
  'Japan','China','India','Australia','South Korea','Singapore','Indonesia','Thailand','Vietnam','Malaysia',
  'Nigeria','South Africa','Kenya','Egypt','Ethiopia','Ghana','Tanzania','Morocco','Mozambique','Algeria',
  'Saudi Arabia','UAE','Iran','Turkey','Iraq','Qatar','Kuwait','Oman','Jordan','Israel',
  'LatAm Country A','LatAm Country B','APAC Country A','APAC Country B','Africa Country A',
  'Africa Country B','Europe Country A','Europe Country B','ME Country A','ME Country B',
];

const COUNTRIES = COUNTRY_NAMES.map((name, i) => ({
  id: i, name,
  region: REGIONS[Math.floor(sr(i * 3 + 1) * 5)],
  climateZone: CLIMATE_ZONES[Math.floor(sr(i * 3 + 2) * 5)],
  baseQ60: +(0.008 + sr(i * 7 + 1) * 0.018).toFixed(4),
  heatExcessMortPct: +(sr(i * 7 + 2) * 4.5 + 0.5).toFixed(2),
  coldExcessMortPct: +(sr(i * 7 + 3) * 3.0 + 0.3).toFixed(2),
  floodExcessMortPct: +(sr(i * 7 + 4) * 1.5 + 0.1).toFixed(2),
  urbanHeatIsland: +(sr(i * 7 + 5) * 3.5 + 0.5).toFixed(2),
  adaptationCapacity: +(sr(i * 7 + 6) * 80 + 15).toFixed(1),
  longevityImprovement: +(sr(i * 11 + 1) * 0.8 + 0.1).toFixed(4),
  reserveImpact: +(sr(i * 11 + 2) * 8 + 1).toFixed(2),
  heatwaveDays2050: Math.round(sr(i * 11 + 3) * 50 + 10),
  ageStructureIndex: +(sr(i * 11 + 4) * 0.40 + 0.15).toFixed(3),
  healthSystemCapacity: +(sr(i * 11 + 5) * 85 + 10).toFixed(1),
  gdpPerCapita: +(sr(i * 11 + 6) * 65 + 5).toFixed(1),
  airQualityMortPct: +(sr(i * 11 + 7) * 2.5 + 0.2).toFixed(2),
}));

const BASE_MORT_RATES = AGE_BANDS.map((_, i) => +(0.002 + i * 0.004 + sr(i * 13) * 0.003).toFixed(5));

function calcClimateMortRate(c, si) {
  const w = SCENARIO_WARMING[si];
  return +(c.baseQ60 * SCENARIO_MULT[si] * (1 + c.heatExcessMortPct / 100 * w) * (1 + c.airQualityMortPct / 100)).toFixed(6);
}
function calcSMR(c, si) { return c.baseQ60 > 0 ? +(calcClimateMortRate(c, si) / c.baseQ60).toFixed(3) : 1; }
function calcNetLongevity(c, si) { return +(c.longevityImprovement - c.heatExcessMortPct * SCENARIO_WARMING[si] / 100).toFixed(4); }
function calcPVFB(c, si) { return +(c.reserveImpact * c.ageStructureIndex * 1000 * SCENARIO_MULT[si]).toFixed(0); }
function calcLifeExp(c, si) { return +(22 - c.heatExcessMortPct * SCENARIO_WARMING[si] * 0.3).toFixed(2); }
function calcReserveAdequacy(c, si) { return +(100 - c.reserveImpact * SCENARIO_MULT[si]).toFixed(2); }

const KpiCard = ({ label, value, unit, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 18px', flex: 1, minWidth: 130 }}>
    <div style={{ fontSize: 10, color: T.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.text }}>{value}<span style={{ fontSize: 12, color: T.muted, marginLeft: 4 }}>{unit}</span></div>
  </div>
);

const TabBtn = ({ label, active, onClick }) => (
  <button onClick={onClick} style={{ padding: '7px 16px', background: active ? T.indigo : 'transparent', color: active ? '#fff' : T.muted, border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: active ? 700 : 400, fontSize: 12 }}>{label}</button>
);

export default function ClimateMortalityLongevityPage() {
  const [tab, setTab] = useState(0);
  const [scenIdx, setScenIdx] = useState(0);
  const [horizonIdx, setHorizonIdx] = useState(4);
  const [regionFilter, setRegionFilter] = useState('All');
  const [zoneFilter, setZoneFilter] = useState('All');
  const [adaptMin, setAdaptMin] = useState(0);
  const [healthMin, setHealthMin] = useState(0);
  const [gdpMin, setGdpMin] = useState(0);
  const [search, setSearch] = useState('');
  const [compareA, setCompareA] = useState(0);
  const [compareB, setCompareB] = useState(1);
  const [compareMode, setCompareMode] = useState(false);
  const [drillCountry, setDrillCountry] = useState(0);
  const [sortCol, setSortCol] = useState('heatExcessMortPct');
  const [sortAsc, setSortAsc] = useState(false);

  const filtered = useMemo(() => {
    let d = COUNTRIES;
    if (regionFilter !== 'All') d = d.filter(c => c.region === regionFilter);
    if (zoneFilter !== 'All') d = d.filter(c => c.climateZone === zoneFilter);
    d = d.filter(c => c.adaptationCapacity >= adaptMin && c.healthSystemCapacity >= healthMin && c.gdpPerCapita >= gdpMin);
    if (search) d = d.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
    return d;
  }, [regionFilter, zoneFilter, adaptMin, healthMin, gdpMin, search]);

  const sortedFiltered = useMemo(() => {
    return [...filtered].sort((a, b) => sortAsc ? (a[sortCol] > b[sortCol] ? 1 : -1) : (a[sortCol] < b[sortCol] ? 1 : -1));
  }, [filtered, sortCol, sortAsc]);

  const top20Heat = useMemo(() => [...filtered].sort((a, b) => b.heatExcessMortPct - a.heatExcessMortPct).slice(0, 20), [filtered]);

  const globalKpis = useMemo(() => {
    if (!filtered.length) return { avgSMR: 0, avgLifeExp: 0, totalExcessDeaths: 0, avgRA: 0 };
    const avgSMR = filtered.reduce((s, c) => s + calcSMR(c, scenIdx), 0) / filtered.length;
    const avgLifeExp = filtered.reduce((s, c) => s + calcLifeExp(c, scenIdx), 0) / filtered.length;
    const totalExcessDeaths = filtered.reduce((s, c) => s + c.heatExcessMortPct * c.heatwaveDays2050 * 10, 0);
    const avgRA = filtered.reduce((s, c) => s + calcReserveAdequacy(c, scenIdx), 0) / filtered.length;
    return { avgSMR: +avgSMR.toFixed(3), avgLifeExp: +avgLifeExp.toFixed(2), totalExcessDeaths: Math.round(totalExcessDeaths), avgRA: +avgRA.toFixed(2) };
  }, [filtered, scenIdx]);

  const lifeTableData = useMemo(() => {
    const c = COUNTRIES[drillCountry];
    let cumSurv = 1;
    return AGE_BANDS.map((band, i) => {
      const base = BASE_MORT_RATES[i];
      const scen = NGFS_SCENARIOS.map((_, si) => {
        const w = SCENARIO_WARMING[si];
        return +(base * SCENARIO_MULT[si] * (1 + c.heatExcessMortPct / 100 * w)).toFixed(6);
      });
      cumSurv *= (1 - base * 5);
      return { band, base, s0: scen[0], s1: scen[1], s2: scen[2], s3: scen[3], s4: scen[4], s5: scen[5], survival: +(Math.max(0, cumSurv) * 100).toFixed(2) };
    });
  }, [drillCountry]);

  const scenarioTrajectory = useMemo(() => {
    const c = COUNTRIES[drillCountry];
    return HORIZONS.map((yr, hi) => {
      const obj = { year: yr };
      NGFS_SCENARIOS.forEach((sc, si) => {
        const multScale = 1 + (SCENARIO_MULT[si] - 1) * hi / 4;
        const warmScale = SCENARIO_WARMING[si] * (0.3 + hi * 0.175);
        obj[sc] = +(c.baseQ60 * multScale * (1 + c.heatExcessMortPct / 100 * warmScale)).toFixed(6);
      });
      return obj;
    });
  }, [drillCountry]);

  const reserveData = useMemo(() => {
    return [...filtered].sort((a, b) => calcPVFB(b, scenIdx) - calcPVFB(a, scenIdx)).slice(0, 20).map(c => ({
      name: c.name.length > 12 ? c.name.slice(0, 12) + '…' : c.name,
      pvfb: +calcPVFB(c, scenIdx),
      ra: calcReserveAdequacy(c, scenIdx),
    }));
  }, [filtered, scenIdx]);

  const regionExcessDeaths = useMemo(() => {
    const map = {};
    REGIONS.forEach(r => { map[r] = 0; });
    filtered.forEach(c => { map[c.region] = (map[c.region] || 0) + c.heatExcessMortPct * c.heatwaveDays2050 * 10; });
    return REGIONS.map(r => ({ region: r, excessDeaths: +map[r].toFixed(0) }));
  }, [filtered]);

  const compareData = useMemo(() => {
    const cA = COUNTRIES[compareA], cB = COUNTRIES[compareB];
    return NGFS_SCENARIOS.map((sc, si) => ({
      scenario: sc.split(' ').slice(0, 2).join(' '),
      [cA.name]: calcClimateMortRate(cA, si),
      [cB.name]: calcClimateMortRate(cB, si),
    }));
  }, [compareA, compareB]);

  const exportRows = useMemo(() => filtered.map(c => ({
    country: c.name, region: c.region, zone: c.climateZone,
    baseQ60: c.baseQ60, climateMort: calcClimateMortRate(c, scenIdx),
    smr: calcSMR(c, scenIdx), lifeExp60: calcLifeExp(c, scenIdx),
    netLongevity: calcNetLongevity(c, scenIdx), pvfb: calcPVFB(c, scenIdx),
    reserveAdequacy: calcReserveAdequacy(c, scenIdx),
    heatExcess: c.heatExcessMortPct, airQuality: c.airQualityMortPct,
    heatwaveDays: c.heatwaveDays2050, ageStructure: c.ageStructureIndex,
  })), [filtered, scenIdx]);

  const handleSort = useCallback((col) => {
    if (sortCol === col) setSortAsc(v => !v);
    else { setSortCol(col); setSortAsc(false); }
  }, [sortCol]);

  const drillC = COUNTRIES[drillCountry];
  const TABS = ['Mortality Dashboard', 'Country Database', 'Climate Life Tables', 'Country Deep Dive', 'Reserve Impact', 'Population Exposure', 'Summary & Export'];

  const thStyle = (col) => ({ padding: '8px 10px', textAlign: 'left', cursor: 'pointer', fontWeight: 700, whiteSpace: 'nowrap', borderBottom: `2px solid ${T.border}`, color: sortCol === col ? T.indigo : T.text, fontSize: 11 });
  const tdStyle = { padding: '6px 10px', fontSize: 12 };

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: T.text, padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 10, color: T.muted, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>EP-DC1 · Sprint DC · Climate-Integrated Actuarial Intelligence Suite</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: T.navy, margin: '0 0 6px' }}>Climate Mortality & Longevity Engine</h1>
        <div style={{ fontSize: 12, color: T.muted }}>60-country actuarial model · 6 NGFS scenarios · 10 age bands · 5 horizons · reserve & PVFB analysis</div>
      </div>

      {/* Global Controls */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16, background: T.card, padding: 14, borderRadius: 8, border: `1px solid ${T.border}`, alignItems: 'center' }}>
        <select value={scenIdx} onChange={e => setScenIdx(+e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
          {NGFS_SCENARIOS.map((s, i) => <option key={s} value={i}>{s} (+{SCENARIO_WARMING[i]}°C)</option>)}
        </select>
        <select value={horizonIdx} onChange={e => setHorizonIdx(+e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
          {HORIZONS.map((h, i) => <option key={h} value={i}>Horizon: {h}</option>)}
        </select>
        <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
          <option>All</option>{REGIONS.map(r => <option key={r}>{r}</option>)}
        </select>
        <select value={zoneFilter} onChange={e => setZoneFilter(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
          <option>All</option>{CLIMATE_ZONES.map(z => <option key={z}>{z}</option>)}
        </select>
        <input placeholder="Search country…" value={search} onChange={e => setSearch(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, width: 150 }} />
        <label style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
          Adapt≥<input type="range" min={0} max={95} value={adaptMin} onChange={e => setAdaptMin(+e.target.value)} style={{ width: 70 }} />{adaptMin}
        </label>
        <label style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
          Health≥<input type="range" min={0} max={90} value={healthMin} onChange={e => setHealthMin(+e.target.value)} style={{ width: 70 }} />{healthMin}
        </label>
        <label style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
          GDP≥$<input type="range" min={0} max={65} value={gdpMin} onChange={e => setGdpMin(+e.target.value)} style={{ width: 70 }} />{gdpMin}K
        </label>
        <span style={{ fontSize: 11, color: T.muted, marginLeft: 4 }}>{filtered.length} / 60 countries</span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap', background: T.card, padding: 8, borderRadius: 8, border: `1px solid ${T.border}` }}>
        {TABS.map((t, i) => <TabBtn key={t} label={t} active={tab === i} onClick={() => setTab(i)} />)}
      </div>

      {/* ── TAB 0: Mortality Dashboard ── */}
      {tab === 0 && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <KpiCard label="Avg SMR" value={globalKpis.avgSMR} unit="×" color={T.red} />
            <KpiCard label="Avg Life Exp @60" value={globalKpis.avgLifeExp} unit="yrs" color={T.blue} />
            <KpiCard label="Projected Excess Deaths" value={globalKpis.totalExcessDeaths.toLocaleString()} unit="" color={T.orange} />
            <KpiCard label="Avg Reserve Adequacy" value={globalKpis.avgRA} unit="%" color={globalKpis.avgRA < 90 ? T.red : T.green} />
            <KpiCard label="Active Scenario" value={NGFS_SCENARIOS[scenIdx].split(' ')[0]} unit="" color={T.indigo} />
            <KpiCard label="Warming Path" value={SCENARIO_WARMING[scenIdx]} unit="°C" color={T.amber} />
            <KpiCard label="Horizon" value={HORIZONS[horizonIdx]} unit="" color={T.navy} />
          </div>
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Top 20 Countries — Excess Mortality Components ({NGFS_SCENARIOS[scenIdx]})</h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={top20Heat.map(c => ({ name: c.name.length > 10 ? c.name.slice(0,10)+'…' : c.name, heat: c.heatExcessMortPct, cold: c.coldExcessMortPct, air: c.airQualityMortPct, flood: c.floodExcessMortPct }))} margin={{ bottom: 60, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" angle={-40} textAnchor="end" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" />
                <Tooltip formatter={(v) => v.toFixed(2) + '%'} />
                <Legend />
                <Bar dataKey="heat" name="Heat Excess %" fill={T.red} stackId="a" />
                <Bar dataKey="cold" name="Cold Excess %" fill={T.blue} stackId="a" />
                <Bar dataKey="air" name="Air Quality %" fill={T.amber} stackId="a" />
                <Bar dataKey="flood" name="Flood %" fill={T.teal} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20 }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Excess Deaths by Region</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={regionExcessDeaths}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="region" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="excessDeaths" name="Excess Deaths" fill={T.indigo} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20 }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Reserve Adequacy Distribution</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={[
                  { range: '<85% (Deficient)', count: filtered.filter(c => calcReserveAdequacy(c, scenIdx) < 85).length },
                  { range: '85-95% (Watch)', count: filtered.filter(c => { const r = calcReserveAdequacy(c, scenIdx); return r >= 85 && r < 95; }).length },
                  { range: '≥95% (Adequate)', count: filtered.filter(c => calcReserveAdequacy(c, scenIdx) >= 95).length },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="Countries" fill={T.teal} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 1: Country Database ── */}
      {tab === 1 && (
        <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20 }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>Country Database — {sortedFiltered.length} / 60</span>
            <span style={{ fontSize: 11, color: T.muted }}>Click country row to open Deep Dive · Click header to sort</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {[['name','Country'],['region','Region'],['climateZone','Climate Zone'],['baseQ60','Base Q60'],['heatExcessMortPct','Heat Excess %'],['coldExcessMortPct','Cold Excess %'],['airQualityMortPct','Air Quality %'],['adaptationCapacity','Adapt Cap'],['healthSystemCapacity','Health Cap'],['gdpPerCapita','GDP $K'],['heatwaveDays2050','HW Days 2050'],['ageStructureIndex','Age Struct'],['reserveImpact','Reserve Imp %'],['longevityImprovement','Longevity Imp']].map(([col, label]) => (
                    <th key={col} onClick={() => handleSort(col)} style={thStyle(col)}>{label}{sortCol === col ? (sortAsc ? ' ↑' : ' ↓') : ''}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedFiltered.map((c, i) => (
                  <tr key={c.id} style={{ background: i % 2 === 0 ? T.bg : T.card, cursor: 'pointer' }} onClick={() => { setDrillCountry(c.id); setTab(3); }}>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{c.name}</td>
                    <td style={tdStyle}>{c.region}</td>
                    <td style={tdStyle}>{c.climateZone}</td>
                    <td style={tdStyle}>{c.baseQ60}</td>
                    <td style={{ ...tdStyle, color: c.heatExcessMortPct > 3 ? T.red : T.text }}>{c.heatExcessMortPct}%</td>
                    <td style={tdStyle}>{c.coldExcessMortPct}%</td>
                    <td style={tdStyle}>{c.airQualityMortPct}%</td>
                    <td style={tdStyle}>{c.adaptationCapacity}</td>
                    <td style={tdStyle}>{c.healthSystemCapacity}</td>
                    <td style={tdStyle}>${c.gdpPerCapita}K</td>
                    <td style={{ ...tdStyle, color: c.heatwaveDays2050 > 45 ? T.red : T.text }}>+{c.heatwaveDays2050}</td>
                    <td style={tdStyle}>{c.ageStructureIndex}</td>
                    <td style={{ ...tdStyle, color: c.reserveImpact > 6 ? T.red : T.text }}>{c.reserveImpact}%</td>
                    <td style={{ ...tdStyle, color: c.longevityImprovement < 0.2 ? T.amber : T.text }}>{c.longevityImprovement}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 2: Climate Life Tables ── */}
      {tab === 2 && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Country:</label>
            <select value={drillCountry} onChange={e => setDrillCountry(+e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
              {COUNTRIES.map((c, i) => <option key={i} value={i}>{c.name}</option>)}
            </select>
            <span style={{ fontSize: 11, color: T.muted }}>Base mortality rates × scenario loading across 10 age bands</span>
          </div>
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Mortality Rates by Age Band — Base vs 6 NGFS Scenarios ({drillC.name})</h3>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={lifeTableData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="band" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => v.toFixed(4)} />
                <Tooltip formatter={(v) => v.toFixed(6)} />
                <Legend />
                <Bar dataKey="base" name="Baseline" fill={T.navy} opacity={0.5} />
                {NGFS_SCENARIOS.map((sc, si) => (
                  <Line key={sc} type="monotone" dataKey={`s${si}`} name={sc} stroke={SCEN_COLORS[si]} dot={false} strokeWidth={2} />
                ))}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Survival Curve — Cohort starting at {drillC.name}</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={lifeTableData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="band" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                <Tooltip formatter={(v) => v.toFixed(2) + '%'} />
                <Line type="monotone" dataKey="survival" name="Survival %" stroke={T.teal} strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20 }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700 }}>Life Table Detail</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead><tr style={{ background: T.sub }}>
                  <th style={{ ...thStyle('band'), cursor: 'default' }}>Age Band</th>
                  <th style={{ ...thStyle('base'), cursor: 'default' }}>Base Rate</th>
                  {NGFS_SCENARIOS.map((s, si) => <th key={si} style={{ padding: '7px 8px', textAlign: 'right', fontSize: 10, fontWeight: 700, color: SCEN_COLORS[si], whiteSpace: 'nowrap', borderBottom: `2px solid ${T.border}` }}>{s}</th>)}
                  <th style={{ padding: '7px 8px', textAlign: 'right', fontWeight: 700, fontSize: 11, borderBottom: `2px solid ${T.border}` }}>Survival %</th>
                </tr></thead>
                <tbody>{lifeTableData.map((r, i) => (
                  <tr key={r.band} style={{ background: i % 2 === 0 ? T.bg : T.card }}>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{r.band}</td>
                    <td style={tdStyle}>{r.base}</td>
                    {[r.s0,r.s1,r.s2,r.s3,r.s4,r.s5].map((v, si) => (
                      <td key={si} style={{ ...tdStyle, textAlign: 'right', color: v > r.base * 1.1 ? T.red : T.text }}>{v}</td>
                    ))}
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>{r.survival}%</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: Country Deep Dive ── */}
      {tab === 3 && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Country:</label>
            <select value={drillCountry} onChange={e => setDrillCountry(+e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
              {COUNTRIES.map((c, i) => <option key={i} value={i}>{c.name}</option>)}
            </select>
            <button onClick={() => setCompareMode(!compareMode)} style={{ padding: '6px 14px', background: compareMode ? T.indigo : T.card, color: compareMode ? '#fff' : T.text, border: `1px solid ${T.border}`, borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
              {compareMode ? 'Exit Compare' : 'Compare 2 Countries'}
            </button>
            {compareMode && <>
              <select value={compareA} onChange={e => setCompareA(+e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
                {COUNTRIES.map((c, i) => <option key={i} value={i}>{c.name}</option>)}
              </select>
              <span style={{ fontSize: 12, color: T.muted }}>vs</span>
              <select value={compareB} onChange={e => setCompareB(+e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
                {COUNTRIES.map((c, i) => <option key={i} value={i}>{c.name}</option>)}
              </select>
            </>}
          </div>

          {compareMode ? (
            <div>
              <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginBottom: 16 }}>
                <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Climate Mortality Rate Comparison: {COUNTRIES[compareA].name} vs {COUNTRIES[compareB].name}</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={compareData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="scenario" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => v.toFixed(4)} />
                    <Tooltip formatter={(v) => v.toFixed(6)} />
                    <Legend />
                    <Bar dataKey={COUNTRIES[compareA].name} fill={T.indigo} />
                    <Bar dataKey={COUNTRIES[compareB].name} fill={T.teal} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[compareA, compareB].map(ci => {
                  const cc = COUNTRIES[ci];
                  return (
                    <div key={ci} style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 16 }}>
                      <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: T.navy }}>{cc.name} — Actuarial Summary</h4>
                      {[
                        { label: 'Region / Zone', value: `${cc.region} / ${cc.climateZone}` },
                        { label: 'Base Q60', value: cc.baseQ60 },
                        { label: `Climate Q60 (${NGFS_SCENARIOS[scenIdx].split(' ')[0]})`, value: calcClimateMortRate(cc, scenIdx) },
                        { label: 'SMR', value: calcSMR(cc, scenIdx) + '×', color: T.orange },
                        { label: 'Life Exp @60', value: calcLifeExp(cc, scenIdx) + ' yrs', color: T.blue },
                        { label: 'PVFB Impact', value: '$' + calcPVFB(cc, scenIdx).toLocaleString(), color: T.amber },
                        { label: 'Reserve Adequacy', value: calcReserveAdequacy(cc, scenIdx) + '%', color: calcReserveAdequacy(cc, scenIdx) < 90 ? T.red : T.green },
                        { label: 'Adaptation Capacity', value: cc.adaptationCapacity },
                        { label: 'Heatwave Days 2050', value: '+' + cc.heatwaveDays2050 + ' days', color: T.red },
                      ].map(({ label, value, color }) => (
                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
                          <span style={{ color: T.muted }}>{label}</span>
                          <span style={{ fontWeight: 600, color: color || T.text }}>{value}</span>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
                {[
                  { label: 'Country', value: drillC.name, color: T.navy },
                  { label: 'Base Q60', value: drillC.baseQ60 },
                  { label: `SMR (${NGFS_SCENARIOS[scenIdx].split(' ')[0]})`, value: calcSMR(drillC, scenIdx) + '×', color: T.orange },
                  { label: 'Life Exp @60', value: calcLifeExp(drillC, scenIdx) + ' yrs', color: T.blue },
                  { label: 'PVFB Impact', value: '$' + calcPVFB(drillC, scenIdx).toLocaleString(), color: T.amber },
                  { label: 'Reserve Adequacy', value: calcReserveAdequacy(drillC, scenIdx) + '%', color: calcReserveAdequacy(drillC, scenIdx) < 90 ? T.red : T.green },
                  { label: 'Heat Excess', value: drillC.heatExcessMortPct + '%', color: T.red },
                  { label: 'Heatwave Days 2050', value: '+' + drillC.heatwaveDays2050, color: T.orange },
                ].map(k => <KpiCard key={k.label} label={k.label} value={k.value} unit="" color={k.color} />)}
              </div>
              <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginBottom: 16 }}>
                <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>6-Scenario Mortality Trajectory — {drillC.name} (2025–2050)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={scenarioTrajectory}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => v.toFixed(4)} />
                    <Tooltip formatter={(v) => v.toFixed(6)} />
                    <Legend />
                    {NGFS_SCENARIOS.map((sc, si) => (
                      <Line key={sc} type="monotone" dataKey={sc} stroke={SCEN_COLORS[si]} strokeWidth={2} dot={{ r: 3 }} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 16 }}>
                  <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700 }}>Risk Profile</h4>
                  {[
                    { label: 'Region', value: drillC.region },
                    { label: 'Climate Zone', value: drillC.climateZone },
                    { label: 'Health System Capacity', value: drillC.healthSystemCapacity },
                    { label: 'GDP Per Capita', value: '$' + drillC.gdpPerCapita + 'K' },
                    { label: 'Age Structure Index', value: drillC.ageStructureIndex },
                    { label: 'Urban Heat Island', value: '+' + drillC.urbanHeatIsland + '°C' },
                    { label: 'Cold Excess Mort', value: drillC.coldExcessMortPct + '%' },
                    { label: 'Flood Excess Mort', value: drillC.floodExcessMortPct + '%' },
                    { label: 'Air Quality Mort', value: drillC.airQualityMortPct + '%' },
                    { label: 'Net Longevity Impact', value: calcNetLongevity(drillC, scenIdx).toFixed(4) },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
                      <span style={{ color: T.muted }}>{label}</span>
                      <span style={{ fontWeight: 600 }}>{value}</span>
                    </div>
                  ))}
                </div>
                <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 16 }}>
                  <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700 }}>Actuarial Summary — All Scenarios</h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                    <thead><tr style={{ background: T.sub }}>
                      <th style={{ padding: '6px 8px', textAlign: 'left' }}>Scenario</th>
                      <th style={{ padding: '6px 8px', textAlign: 'right' }}>Climate Q60</th>
                      <th style={{ padding: '6px 8px', textAlign: 'right' }}>SMR</th>
                      <th style={{ padding: '6px 8px', textAlign: 'right' }}>Life Exp</th>
                      <th style={{ padding: '6px 8px', textAlign: 'right' }}>Res Adq %</th>
                    </tr></thead>
                    <tbody>{NGFS_SCENARIOS.map((sc, si) => (
                      <tr key={sc} style={{ background: si % 2 === 0 ? T.bg : T.card }}>
                        <td style={{ padding: '5px 8px', fontWeight: 600, color: SCEN_COLORS[si], fontSize: 11 }}>{sc}</td>
                        <td style={{ padding: '5px 8px', textAlign: 'right' }}>{calcClimateMortRate(drillC, si)}</td>
                        <td style={{ padding: '5px 8px', textAlign: 'right' }}>{calcSMR(drillC, si)}</td>
                        <td style={{ padding: '5px 8px', textAlign: 'right' }}>{calcLifeExp(drillC, si)}</td>
                        <td style={{ padding: '5px 8px', textAlign: 'right', color: calcReserveAdequacy(drillC, si) < 90 ? T.red : T.green }}>{calcReserveAdequacy(drillC, si)}%</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── TAB 4: Reserve Impact ── */}
      {tab === 4 && (
        <div>
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Present Value of Future Benefits Impact — Top 20 Countries (Scenario: {NGFS_SCENARIOS[scenIdx]})</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reserveData} margin={{ bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" angle={-35} textAnchor="end" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="pvfb" name="PVFB Impact ($)" fill={T.indigo} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Reserve Adequacy — All Countries</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={[...filtered].map(c => ({ name: c.name.slice(0,10), ra: calcReserveAdequacy(c, scenIdx) })).sort((a,b) => a.ra - b.ra)} margin={{ bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" angle={-40} textAnchor="end" tick={{ fontSize: 9 }} />
                <YAxis domain={[80, 105]} tick={{ fontSize: 11 }} unit="%" />
                <Tooltip />
                <Bar dataKey="ra" name="Reserve Adequacy %" fill={T.teal} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20 }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700 }}>PVFB Impact Table — Full Detail</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead><tr style={{ background: T.sub }}>
                  {['Country','Region','Reserve Impact %','Age Struct Index','PVFB ($)','Reserve Adequacy %','SMR','Status'].map(h => (
                    <th key={h} style={{ padding: '7px 8px', textAlign: 'left', fontWeight: 700, borderBottom: `2px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{[...filtered].sort((a,b) => calcPVFB(b, scenIdx) - calcPVFB(a, scenIdx)).map((c, i) => {
                  const ra = calcReserveAdequacy(c, scenIdx);
                  const status = ra < 85 ? 'Deficient' : ra < 95 ? 'Watch' : 'Adequate';
                  const statusColor = ra < 85 ? T.red : ra < 95 ? T.amber : T.green;
                  return (
                    <tr key={c.id} style={{ background: i % 2 === 0 ? T.bg : T.card }}>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{c.name}</td>
                      <td style={tdStyle}>{c.region}</td>
                      <td style={tdStyle}>{c.reserveImpact}%</td>
                      <td style={tdStyle}>{c.ageStructureIndex}</td>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>${(+calcPVFB(c, scenIdx)).toLocaleString()}</td>
                      <td style={{ ...tdStyle, color: ra < 90 ? T.red : T.green, fontWeight: 600 }}>{ra}%</td>
                      <td style={tdStyle}>{calcSMR(c, scenIdx)}×</td>
                      <td style={tdStyle}>
                        <span style={{ background: ra < 85 ? '#fee2e2' : ra < 95 ? '#fef3c7' : '#dcfce7', color: statusColor, padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600 }}>{status}</span>
                      </td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: Population Exposure Analytics ── */}
      {tab === 5 && (
        <div>
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Heatwave Days 2050 vs Projected Excess Deaths (Scatter)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="x" name="Heatwave Days" tick={{ fontSize: 11 }} label={{ value: 'Heatwave Days 2050', position: 'insideBottom', offset: -4, fontSize: 11 }} />
                <YAxis dataKey="y" name="Excess Deaths" tick={{ fontSize: 11 }} />
                <Tooltip content={({ payload }) => payload?.length ? (
                  <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: 10, fontSize: 11 }}>
                    <div style={{ fontWeight: 700 }}>{payload[0]?.payload?.name}</div>
                    <div>Heatwave Days: {payload[0]?.payload?.x}</div>
                    <div>Excess Deaths: {payload[0]?.payload?.y?.toLocaleString()}</div>
                    <div>Age Struct: {payload[0]?.payload?.age}</div>
                  </div>
                ) : null} />
                <Scatter data={filtered.map(c => ({ x: c.heatwaveDays2050, y: +(c.heatExcessMortPct * c.heatwaveDays2050 * 10).toFixed(0), name: c.name, age: c.ageStructureIndex }))} fill={T.red} opacity={0.7} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20 }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Age Structure Impact — Top 20 Countries</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart layout="vertical" data={[...filtered].sort((a,b) => b.ageStructureIndex - a.ageStructureIndex).slice(0,20).map(c => ({ name: c.name.slice(0,12), ageIdx: c.ageStructureIndex }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={85} />
                  <Tooltip />
                  <Bar dataKey="ageIdx" name="Age Structure Index" fill={T.navy} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20 }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Total Excess Deaths by Region</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={regionExcessDeaths}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="region" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="excessDeaths" name="Excess Deaths" fill={T.orange} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20 }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700 }}>Population Exposure Full Table — {filtered.length} Countries</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead><tr style={{ background: T.sub }}>
                  {['Country','Region','Heatwave Days 2050','Heat Excess %','Air Quality %','Flood %','Age Struct Index','Adaptation Cap','Excess Deaths (proj)'].map(h => (
                    <th key={h} style={{ padding: '7px 8px', fontWeight: 700, textAlign: 'left', borderBottom: `2px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{[...filtered].sort((a,b) => b.heatExcessMortPct * b.heatwaveDays2050 - a.heatExcessMortPct * a.heatwaveDays2050).map((c, i) => (
                  <tr key={c.id} style={{ background: i % 2 === 0 ? T.bg : T.card }}>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{c.name}</td>
                    <td style={tdStyle}>{c.region}</td>
                    <td style={{ ...tdStyle, color: c.heatwaveDays2050 > 45 ? T.red : T.text }}>+{c.heatwaveDays2050}</td>
                    <td style={tdStyle}>{c.heatExcessMortPct}%</td>
                    <td style={tdStyle}>{c.airQualityMortPct}%</td>
                    <td style={tdStyle}>{c.floodExcessMortPct}%</td>
                    <td style={tdStyle}>{c.ageStructureIndex}</td>
                    <td style={tdStyle}>{c.adaptationCapacity}</td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{(c.heatExcessMortPct * c.heatwaveDays2050 * 10).toFixed(0)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 6: Summary & Export ── */}
      {tab === 6 && (
        <div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
            <KpiCard label="Countries Analyzed" value={filtered.length} unit="/ 60" color={T.indigo} />
            <KpiCard label="Active Scenario" value={NGFS_SCENARIOS[scenIdx]} unit="" color={T.navy} />
            <KpiCard label="Warming Path" value={SCENARIO_WARMING[scenIdx]} unit="°C" color={T.red} />
            <KpiCard label="Avg SMR" value={globalKpis.avgSMR} unit="×" color={T.orange} />
            <KpiCard label="Avg Life Exp @60" value={globalKpis.avgLifeExp} unit="yrs" color={T.blue} />
            <KpiCard label="Avg Reserve Adequacy" value={globalKpis.avgRA} unit="%" color={globalKpis.avgRA < 90 ? T.red : T.green} />
            <KpiCard label="Total Excess Deaths" value={globalKpis.totalExcessDeaths.toLocaleString()} unit="" color={T.amber} />
            <KpiCard label="Horizon" value={HORIZONS[horizonIdx]} unit="" color={T.teal} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 16 }}>
              <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700 }}>Reserve Adequacy by Scenario</h4>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={NGFS_SCENARIOS.map((sc, si) => ({
                  scenario: sc.split(' ')[0],
                  avgRA: filtered.length ? +(filtered.reduce((s,c) => s + calcReserveAdequacy(c, si), 0) / filtered.length).toFixed(2) : 0,
                  avgSMR: filtered.length ? +(filtered.reduce((s,c) => s + calcSMR(c, si), 0) / filtered.length).toFixed(3) : 0,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="scenario" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} unit="%" />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="avgRA" name="Avg Reserve Adq %" stroke={T.green} strokeWidth={2} dot={{ r: 4 }} />
                  <Line yAxisId="right" type="monotone" dataKey="avgSMR" name="Avg SMR ×" stroke={T.red} strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 16 }}>
              <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700 }}>PVFB vs Reserve Impact Scatter</h4>
              <ResponsiveContainer width="100%" height={220}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="reserveImpact" name="Reserve Impact %" tick={{ fontSize: 10 }} />
                  <YAxis dataKey="pvfb" name="PVFB ($)" tick={{ fontSize: 10 }} />
                  <Tooltip content={({ payload }) => payload?.length ? <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: 8, fontSize: 11 }}><b>{payload[0]?.payload?.name}</b><br/>Res Imp: {payload[0]?.payload?.reserveImpact}%<br/>PVFB: ${payload[0]?.payload?.pvfb?.toLocaleString()}</div> : null} />
                  <Scatter data={filtered.map(c => ({ name: c.name, reserveImpact: c.reserveImpact, pvfb: +calcPVFB(c, scenIdx) }))} fill={T.indigo} opacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20 }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700 }}>Full KPI Export Table — {filtered.length} Countries · Scenario: {NGFS_SCENARIOS[scenIdx]}</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead><tr style={{ background: T.sub }}>
                  {['Country','Region','Zone','Base Q60','Climate Q60','SMR','Life Exp @60','Net Longevity','PVFB ($)','Reserve Adq %','Heat %','Air %','HW Days','Age Struct'].map(h => (
                    <th key={h} style={{ padding: '7px 8px', fontWeight: 700, textAlign: 'left', borderBottom: `2px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{exportRows.map((r, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? T.bg : T.card }}>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{r.country}</td>
                    <td style={tdStyle}>{r.region}</td>
                    <td style={tdStyle}>{r.zone}</td>
                    <td style={tdStyle}>{r.baseQ60}</td>
                    <td style={tdStyle}>{r.climateMort}</td>
                    <td style={{ ...tdStyle, color: r.smr > 1.1 ? T.red : T.text }}>{r.smr}</td>
                    <td style={tdStyle}>{r.lifeExp60}</td>
                    <td style={{ ...tdStyle, color: r.netLongevity < 0 ? T.red : T.green }}>{r.netLongevity}</td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>${r.pvfb.toLocaleString()}</td>
                    <td style={{ ...tdStyle, color: r.reserveAdequacy < 90 ? T.red : T.green, fontWeight: 600 }}>{r.reserveAdequacy}%</td>
                    <td style={tdStyle}>{r.heatExcess}%</td>
                    <td style={tdStyle}>{r.airQuality}%</td>
                    <td style={tdStyle}>{r.heatwaveDays}</td>
                    <td style={tdStyle}>{r.ageStructure}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
          {/* Actuarial Scenario Matrix */}
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginTop: 16 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Actuarial Scenario Matrix — All 6 Scenarios vs Key Metrics</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead><tr style={{ background: T.sub }}>
                  <th style={{ padding: '7px 10px', fontWeight: 700, borderBottom: `2px solid ${T.border}` }}>Scenario</th>
                  <th style={{ padding: '7px 10px', fontWeight: 700, borderBottom: `2px solid ${T.border}`, textAlign: 'right' }}>Warming</th>
                  <th style={{ padding: '7px 10px', fontWeight: 700, borderBottom: `2px solid ${T.border}`, textAlign: 'right' }}>Mult</th>
                  <th style={{ padding: '7px 10px', fontWeight: 700, borderBottom: `2px solid ${T.border}`, textAlign: 'right' }}>Avg SMR</th>
                  <th style={{ padding: '7px 10px', fontWeight: 700, borderBottom: `2px solid ${T.border}`, textAlign: 'right' }}>Avg Life Exp</th>
                  <th style={{ padding: '7px 10px', fontWeight: 700, borderBottom: `2px solid ${T.border}`, textAlign: 'right' }}>Avg Reserve Adq %</th>
                  <th style={{ padding: '7px 10px', fontWeight: 700, borderBottom: `2px solid ${T.border}`, textAlign: 'right' }}>Total PVFB $M</th>
                  <th style={{ padding: '7px 10px', fontWeight: 700, borderBottom: `2px solid ${T.border}`, textAlign: 'right' }}>Deficient Countries</th>
                </tr></thead>
                <tbody>{NGFS_SCENARIOS.map((sc, si) => {
                  const avgSMR = filtered.length ? +(filtered.reduce((s, c) => s + calcSMR(c, si), 0) / filtered.length).toFixed(3) : 0;
                  const avgLE = filtered.length ? +(filtered.reduce((s, c) => s + calcLifeExp(c, si), 0) / filtered.length).toFixed(2) : 0;
                  const avgRA = filtered.length ? +(filtered.reduce((s, c) => s + calcReserveAdequacy(c, si), 0) / filtered.length).toFixed(2) : 0;
                  const totalPVFB = filtered.length ? Math.round(filtered.reduce((s, c) => s + +calcPVFB(c, si), 0)) : 0;
                  const deficient = filtered.filter(c => calcReserveAdequacy(c, si) < 85).length;
                  return (
                    <tr key={sc} style={{ background: si % 2 === 0 ? T.bg : T.card }}>
                      <td style={{ padding: '6px 10px', fontWeight: 600, color: SCEN_COLORS[si] }}>{sc}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right' }}>{SCENARIO_WARMING[si]}°C</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right' }}>×{SCENARIO_MULT[si]}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', color: avgSMR > 1.1 ? T.red : T.text }}>{avgSMR}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right' }}>{avgLE} yrs</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', color: avgRA < 90 ? T.red : T.green, fontWeight: 600 }}>{avgRA}%</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 600 }}>${totalPVFB.toLocaleString()}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', color: deficient > 0 ? T.red : T.green }}>{deficient}</td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
          </div>
          {/* Summary statistics cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 16 }}>
            {[
              { label: 'Countries with SMR > 1.1', value: filtered.filter(c => calcSMR(c, scenIdx) > 1.1).length, color: T.red },
              { label: 'Countries with Neg Net Longevity', value: filtered.filter(c => calcNetLongevity(c, scenIdx) < 0).length, color: T.orange },
              { label: 'Avg Heatwave Days 2050', value: filtered.length ? Math.round(filtered.reduce((s,c) => s + c.heatwaveDays2050, 0) / filtered.length) : 0, color: T.amber },
              { label: 'High Air Quality Risk (>1.5%)', value: filtered.filter(c => c.airQualityMortPct > 1.5).length, color: T.purple },
              { label: 'Low Adaptation (<30)', value: filtered.filter(c => c.adaptationCapacity < 30).length, color: T.red },
              { label: 'Low Health System (<30)', value: filtered.filter(c => c.healthSystemCapacity < 30).length, color: T.orange },
              { label: 'Polar/Arid Climate Zones', value: filtered.filter(c => c.climateZone === 'Polar' || c.climateZone === 'Arid').length, color: T.blue },
              { label: 'Tropical Climate Zones', value: filtered.filter(c => c.climateZone === 'Tropical').length, color: T.teal },
              { label: 'Americas Region', value: filtered.filter(c => c.region === 'Americas').length, color: T.navy },
              { label: 'Africa Region', value: filtered.filter(c => c.region === 'Africa').length, color: T.gold },
              { label: 'High Age Structure (>0.4)', value: filtered.filter(c => c.ageStructureIndex > 0.4).length, color: T.indigo },
              { label: 'GDP < $20K', value: filtered.filter(c => c.gdpPerCapita < 20).length, color: T.muted },
            ].map(item => (
              <div key={item.label} style={{ background: T.sub, borderRadius: 6, padding: '12px 14px' }}>
                <div style={{ fontSize: 10, color: T.muted, marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: item.color }}>{item.value}</div>
              </div>
            ))}
          </div>
          {/* Region breakdown */}
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginTop: 16 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Region-Level Actuarial Summary</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead><tr style={{ background: T.sub }}>
                {['Region','Countries','Avg Base Q60','Avg Climate Q60','Avg SMR','Avg Life Exp','Avg PVFB $','Avg Reserve Adq %','Avg Heatwave Days'].map(h => (
                  <th key={h} style={{ padding: '7px 8px', fontWeight: 700, borderBottom: `2px solid ${T.border}`, whiteSpace: 'nowrap', textAlign: 'left' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>{REGIONS.map((region, ri) => {
                const rcs = filtered.filter(c => c.region === region);
                if (!rcs.length) return null;
                const avgBase = +(rcs.reduce((s,c) => s + c.baseQ60, 0) / rcs.length).toFixed(5);
                const avgClim = +(rcs.reduce((s,c) => s + calcClimateMortRate(c, scenIdx), 0) / rcs.length).toFixed(6);
                const avgSMR = +(rcs.reduce((s,c) => s + calcSMR(c, scenIdx), 0) / rcs.length).toFixed(3);
                const avgLE = +(rcs.reduce((s,c) => s + calcLifeExp(c, scenIdx), 0) / rcs.length).toFixed(2);
                const avgPVFB = Math.round(rcs.reduce((s,c) => s + +calcPVFB(c, scenIdx), 0) / rcs.length);
                const avgRA = +(rcs.reduce((s,c) => s + calcReserveAdequacy(c, scenIdx), 0) / rcs.length).toFixed(1);
                const avgHW = Math.round(rcs.reduce((s,c) => s + c.heatwaveDays2050, 0) / rcs.length);
                return (
                  <tr key={region} style={{ background: ri % 2 === 0 ? T.bg : T.card }}>
                    <td style={{ padding: '5px 8px', fontWeight: 600 }}>{region}</td>
                    <td style={{ padding: '5px 8px' }}>{rcs.length}</td>
                    <td style={{ padding: '5px 8px' }}>{avgBase}</td>
                    <td style={{ padding: '5px 8px' }}>{avgClim}</td>
                    <td style={{ padding: '5px 8px', color: avgSMR > 1.1 ? T.red : T.text }}>{avgSMR}</td>
                    <td style={{ padding: '5px 8px' }}>{avgLE} yrs</td>
                    <td style={{ padding: '5px 8px' }}>${avgPVFB.toLocaleString()}</td>
                    <td style={{ padding: '5px 8px', color: avgRA < 90 ? T.red : T.green, fontWeight: 600 }}>{avgRA}%</td>
                    <td style={{ padding: '5px 8px' }}>+{avgHW}</td>
                  </tr>
                );
              }).filter(Boolean)}</tbody>
            </table>
          </div>
          {/* Portfolio Key Actuarial Statistics */}
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginTop: 16 }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700 }}>Portfolio Key Actuarial Statistics</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {[
                { label: 'Countries Covered', value: COUNTRIES.length, color: T.indigo },
                { label: 'NGFS Scenarios', value: NGFS_SCENARIOS.length, color: T.blue },
                { label: 'Age Bands', value: AGE_BANDS.length, color: T.teal },
                { label: 'Avg Climate Mort Rate', value: (COUNTRIES.reduce((s, c) => s + calcClimateMortRate(c, scenIdx), 0) / COUNTRIES.length * 1000).toFixed(1) + '‰', color: T.red },
                { label: 'Avg SMR', value: (COUNTRIES.reduce((s, c) => s + calcSMR(c, scenIdx), 0) / COUNTRIES.length).toFixed(3), color: T.orange },
                { label: 'Avg Net Longevity', value: (COUNTRIES.reduce((s, c) => s + calcNetLongevity(c, scenIdx), 0) / COUNTRIES.length).toFixed(2) + '%', color: T.green },
                { label: 'Avg Life Exp', value: (COUNTRIES.reduce((s, c) => s + calcLifeExp(c, scenIdx), 0) / COUNTRIES.length).toFixed(1) + ' yrs', color: T.navy },
                { label: 'Avg PVFB $M', value: '$' + (COUNTRIES.reduce((s, c) => s + calcPVFB(c, scenIdx), 0) / COUNTRIES.length).toFixed(0) + 'M', color: T.purple },
                { label: 'Avg Reserve Adequacy', value: (COUNTRIES.reduce((s, c) => s + calcReserveAdequacy(c, scenIdx), 0) / COUNTRIES.length).toFixed(1) + '%', color: T.amber },
                { label: 'Countries SMR>1.1', value: COUNTRIES.filter(c => calcSMR(c, scenIdx) > 1.1).length, color: T.red },
                { label: 'Active Scenario', value: NGFS_SCENARIOS[scenIdx].slice(0, 16), color: T.indigo },
                { label: 'Warming (2100)', value: NGFS_WARMINGS[scenIdx] + '°C', color: T.orange },
              ].map(m => (
                <div key={m.label} style={{ background: T.sub, borderRadius: 6, padding: '8px 10px', borderLeft: `3px solid ${m.color}` }}>
                  <div style={{ fontSize: 10, color: T.muted, marginBottom: 2 }}>{m.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: m.color }}>{m.value}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Mortality Trend by Region Chart */}
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginTop: 16 }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700 }}>Climate Mortality Rate by Region — All Scenarios Comparison</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={['Europe','North America','Asia Pacific','Latin America','Africa & ME','South Asia','Southeast Asia','Oceania','Central Asia','Nordic'].map((region, ri) => {
                const cs = COUNTRIES.filter(c => c.region === region || (ri === 0 && ['Western Europe','Northern Europe','Southern Europe','Central Europe'].some(r => c.region?.includes?.(r.split(' ')[0]))));
                if (!cs.length) return null;
                const obj = { name: region.slice(0, 6) };
                NGFS_SCENARIOS.forEach((s, si) => {
                  obj[s.slice(0, 8)] = cs.length ? +(cs.reduce((sum, c) => sum + calcClimateMortRate(c, si) * 1000, 0) / cs.length).toFixed(2) : 0;
                });
                return obj;
              }).filter(Boolean)} margin={{ top: 10, right: 20, left: 0, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} unit="‰" />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                {NGFS_SCENARIOS.map((s, si) => (
                  <Bar key={s} dataKey={s.slice(0, 8)} fill={[T.green, T.blue, T.teal, T.amber, T.orange, T.red][si]} opacity={si === scenIdx ? 1 : 0.4} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Scenario Comparison: SMR vs Life Expectancy */}
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginTop: 16 }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700 }}>SMR vs Life Expectancy Scatter — Current Scenario</h3>
            <ResponsiveContainer width="100%" height={220}>
              <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="smr" name="SMR" type="number" domain={[0.8, 1.6]} tick={{ fontSize: 10 }} label={{ value: 'Standardised Mortality Ratio', position: 'insideBottom', offset: -5, fontSize: 10 }} />
                <YAxis dataKey="lifeExp" name="Life Exp (yrs)" type="number" tick={{ fontSize: 10 }} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(v, n) => [n === 'smr' ? v.toFixed(3) : v.toFixed(1) + ' yrs', n === 'smr' ? 'SMR' : 'Life Expectancy']} />
                <Scatter name="Countries" data={COUNTRIES.map(c => ({
                  smr: +calcSMR(c, scenIdx).toFixed(3),
                  lifeExp: +calcLifeExp(c, scenIdx).toFixed(1),
                  name: c.name,
                }))} fill={T.indigo} opacity={0.7} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
