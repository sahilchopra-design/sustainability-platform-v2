import React, { useState, useMemo } from 'react';
import { useReferenceData } from '../../../contexts/ReferenceDataContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ScatterChart, Scatter, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, LineChart, Line, Legend, AreaChart, Area } from 'recharts';

/* ── deterministic PRNG ─────────────────────────────────────────── */
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

/* ── theme ──────────────────────────────────────────────────────── */
const T = {
  bg: '#f6f4f0', surface: '#ffffff', surfaceH: '#f0ede7', border: '#e5e0d8', borderL: '#d5cfc5',
  navy: '#1b3a5c', navyD: '#122a44', navyL: '#2c5a8c', gold: '#c5a96a', goldL: '#d4be8a', goldD: '#a8903a',
  sage: '#5a8a6a', sageL: '#7ba67d', text: '#1b3a5c', textSec: '#5c6b7e', textMut: '#9aa3ae',
  red: '#dc2626', green: '#16a34a', amber: '#d97706',
  card: '0 1px 3px rgba(27,58,92,0.04), 0 0 0 1px rgba(27,58,92,0.03)',
  cardH: '0 8px 24px rgba(27,58,92,0.08), 0 0 0 1px rgba(27,58,92,0.06)',
  font: "'DM Sans', system-ui, sans-serif", mono: "'JetBrains Mono', monospace",
  indigo: '#4f46e5', blue: '#2563eb', teal: '#0d9488', purple: '#7c3aed',
};
const PALETTE = ['#4a7faa', '#5a9aaa', '#5a8a6a', '#7ba67d', '#8a7a5a', '#a08a5a', '#c5a96a', '#4f46e5', '#dc2626', '#d97706', '#0d9488', '#7c3aed', '#16a34a', '#2c5a8c', '#065f46', '#b91c1c', '#92400e', '#1e40af', '#6d28d9', '#0e7490'];

const TABS = [
  'Dashboard', 'Country Intelligence', 'OWID CO2 Explorer', 'OWID Energy Explorer',
  'SBTi Targets', 'CEDA Sector Analysis', 'CBAM Vulnerability', 'Food Carbon',
  'Cross-Source Analytics', 'Source Documentation'
];

/* ── shared UI atoms ────────────────────────────────────────────── */
const Card = ({ children, style }) => (
  <div style={{ background: T.surface, borderRadius: 10, boxShadow: T.card, padding: 20, ...style }}>{children}</div>
);
const Kpi = ({ label, value, sub, color }) => (
  <Card style={{ textAlign: 'center', minWidth: 140 }}>
    <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
    <div style={{ fontSize: 28, fontWeight: 700, color: color || T.navy, margin: '4px 0' }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec }}>{sub}</div>}
  </Card>
);
const SectionTitle = ({ children }) => (
  <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, margin: '20px 0 10px', fontFamily: T.mono }}>{children}</h3>
);
const Badge = ({ children, color }) => (
  <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 600, color: color || T.navy, background: (color || T.navy) + '12', padding: '2px 8px', borderRadius: 4, fontFamily: T.mono }}>{children}</span>
);
const fmt = n => n == null ? 'N/A' : typeof n === 'number' ? (n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'K' : n % 1 === 0 ? n.toLocaleString() : n.toFixed(2)) : String(n);
const pct = (n) => n == null ? 'N/A' : n.toFixed(1) + '%';
const safe = (num, den, fallback = 0) => den > 0 ? num / den : fallback;

/* ════════════════════════════════════════════════════════════════════
   TAB 1 — DASHBOARD
   ════════════════════════════════════════════════════════════════════ */
function DashboardTab({ data }) {
  const { sources, globalStats } = data;
  const domainSet = ['emissions', 'energy', 'food', 'trade', 'targets', 'vulnerability', 'lifecycle', 'industry', 'renewables', 'decarbonisation'];
  const matrix = sources.map(src => {
    const row = { source: src.name };
    domainSet.forEach(d => { row[d] = src.domains.includes(d) ? 1 : 0; });
    return row;
  });
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 12, marginBottom: 24 }}>
        <Kpi label="Total Records" value={fmt(globalStats.totalRecords)} sub="across all sources" color={T.navy} />
        <Kpi label="Data Sources" value={globalStats.totalSources} sub="unified" color={T.indigo} />
        <Kpi label="Countries" value={globalStats.totalCountries} sub="covered" color={T.sage} />
        <Kpi label="Data Fields" value={globalStats.totalFields} sub="total columns" color={T.gold} />
      </div>
      <SectionTitle>Source Cards</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 14 }}>
        {sources.map((s, i) => (
          <Card key={s.id} style={{ borderLeft: `3px solid ${PALETTE[i]}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontWeight: 700, color: T.navy, fontSize: 14 }}>{s.name}</span>
              <Badge color={PALETTE[i]}>{s.version}</Badge>
            </div>
            <div style={{ fontSize: 12, color: T.textSec, marginBottom: 6 }}>{s.provider}</div>
            <div style={{ fontSize: 11, color: T.textMut, marginBottom: 8 }}>{s.description}</div>
            <div style={{ display: 'flex', gap: 12, fontSize: 11, fontFamily: T.mono }}>
              <span><strong>{fmt(s.recordCount)}</strong> records</span>
              <span><strong>{s.fieldCount}</strong> fields</span>
              <Badge>{s.license}</Badge>
            </div>
            <div style={{ marginTop: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {s.domains.map(d => <Badge key={d} color={T.sage}>{d}</Badge>)}
            </div>
          </Card>
        ))}
      </div>
      <SectionTitle>Coverage Matrix (Sources x Domains)</SectionTitle>
      <Card>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse', fontFamily: T.mono }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                <th style={{ textAlign: 'left', padding: 6 }}>Source</th>
                {domainSet.map(d => <th key={d} style={{ padding: 6, textAlign: 'center', textTransform: 'capitalize' }}>{d}</th>)}
              </tr>
            </thead>
            <tbody>
              {matrix.map((row, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: 6, fontWeight: 600 }}>{row.source}</td>
                  {domainSet.map(d => (
                    <td key={d} style={{ textAlign: 'center', padding: 6 }}>
                      {row[d] ? <span style={{ color: T.green, fontWeight: 700 }}>&#10003;</span> : <span style={{ color: T.textMut }}>-</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   TAB 2 — COUNTRY INTELLIGENCE
   ════════════════════════════════════════════════════════════════════ */
function CountryIntelligenceTab({ data }) {
  const { owidCo2, owidEnergy, ceda, cbam, sbti, getCountryProfile } = data;
  const allCountries = useMemo(() => {
    const map = {};
    owidCo2.latestByCountry.forEach(c => { if (c.iso) map[c.iso] = c.country; });
    owidEnergy.latestByCountry.forEach(c => { if (c.iso) map[c.iso] = c.country; });
    return Object.entries(map).map(([iso, name]) => ({ iso, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [owidCo2, owidEnergy]);
  const [sel, setSel] = useState('USA');
  const profile = useMemo(() => getCountryProfile(sel), [sel, getCountryProfile]);

  const cedaTop10 = useMemo(() => {
    if (!profile.ceda || !profile.ceda.efs) return [];
    return Object.entries(profile.ceda.efs)
      .map(([code, ef]) => ({ code, ef, name: (ceda.sectors.find(s => s.code === code) || {}).name || code }))
      .sort((a, b) => b.ef - a.ef).slice(0, 10);
  }, [profile, ceda.sectors]);

  const cbamRadar = useMemo(() => {
    if (!profile.cbam) return [];
    return [
      { axis: 'Export Dep.', val: (profile.cbam.depExports || 0) * 100 },
      { axis: 'CBAM Exp. Dep.', val: (profile.cbam.depCbamExports || 0) * 100 },
      { axis: 'EU Market Dep.', val: (profile.cbam.depEuMarket || 0) * 100 },
      { axis: 'Emission Int.', val: (profile.cbam.emissionIntensity || 0) * 100 },
      { axis: 'Carbon Price Signal', val: (profile.cbam.carbonPriceSignal || 0) * 100 },
    ];
  }, [profile]);

  const sbtiInCountry = useMemo(() => {
    const countryName = profile.co2 ? profile.co2.country : '';
    return sbti.companies.filter(c => c.l && c.l.toLowerCase().includes(countryName.toLowerCase())).slice(0, 20);
  }, [profile, sbti.companies]);

  const energyMix = useMemo(() => {
    if (!profile.energy) return [];
    const e = profile.energy;
    return [
      { name: 'Coal', value: e.coal_share_pct || 0 },
      { name: 'Gas', value: e.gas_share_pct || 0 },
      { name: 'Oil', value: e.oil_share_pct || 0 },
      { name: 'Nuclear', value: e.nuclear_share_pct || 0 },
      { name: 'Solar', value: e.solar_share_pct || 0 },
      { name: 'Wind', value: e.wind_share_pct || 0 },
      { name: 'Hydro', value: e.hydro_share_pct || 0 },
    ].filter(d => d.value > 0);
  }, [profile]);

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <label style={{ fontWeight: 600, color: T.navy, fontSize: 13 }}>Select Country:</label>
          <select value={sel} onChange={e => setSel(e.target.value)} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: T.font, minWidth: 220 }}>
            {allCountries.map(c => <option key={c.iso} value={c.iso}>{c.name} ({c.iso})</option>)}
          </select>
        </div>
      </Card>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 12, marginBottom: 16 }}>
        {profile.co2 && <>
          <Kpi label="CO2 (Mt)" value={fmt(profile.co2.co2_mt)} color={T.red} />
          <Kpi label="CO2/Capita" value={profile.co2.co2_per_capita ? profile.co2.co2_per_capita.toFixed(2) + 't' : 'N/A'} color={T.amber} />
          <Kpi label="Global Share" value={pct(profile.co2.share_global_co2)} color={T.navy} />
        </>}
        {profile.energy && <>
          <Kpi label="Renewables" value={pct(profile.energy.renewables_share_pct)} color={T.green} />
          <Kpi label="Carbon Int." value={profile.energy.carbon_intensity_kwh ? profile.energy.carbon_intensity_kwh.toFixed(0) + ' g/kWh' : 'N/A'} color={T.textSec} />
        </>}
        <Kpi label="SBTi Cos" value={sbtiInCountry.length} color={T.indigo} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {/* Energy Mix Pie */}
        <Card>
          <SectionTitle>Energy Mix</SectionTitle>
          {energyMix.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={energyMix} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name} ${value.toFixed(1)}%`}>
                  {energyMix.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                </Pie>
                <Tooltip formatter={v => pct(v)} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div style={{ color: T.textMut, fontSize: 12, padding: 20 }}>No energy mix data available</div>}
        </Card>
        {/* CBAM Vulnerability Radar */}
        <Card>
          <SectionTitle>CBAM Vulnerability</SectionTitle>
          {cbamRadar.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={cbamRadar} outerRadius={70}>
                <PolarGrid />
                <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                <Radar dataKey="val" stroke={T.red} fill={T.red} fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
          ) : <div style={{ color: T.textMut, fontSize: 12, padding: 20 }}>No CBAM data for this country</div>}
        </Card>
        {/* CEDA Top 10 Sectors */}
        <Card style={{ gridColumn: '1 / -1' }}>
          <SectionTitle>Top 10 Emission-Intensive Sectors (CEDA)</SectionTitle>
          {cedaTop10.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={cedaTop10} layout="vertical" margin={{ left: 160 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={155} />
                <Tooltip formatter={v => v.toFixed(4) + ' kgCO2e/$'} />
                <Bar dataKey="ef" fill={T.navy} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div style={{ color: T.textMut, fontSize: 12, padding: 20 }}>No CEDA data for this country</div>}
        </Card>
      </div>
      {/* SBTi companies table */}
      {sbtiInCountry.length > 0 && (
        <Card style={{ marginTop: 14 }}>
          <SectionTitle>SBTi Companies ({sbtiInCountry.length})</SectionTitle>
          <div style={{ overflowX: 'auto', maxHeight: 240, overflowY: 'auto' }}>
            <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse', fontFamily: T.mono }}>
              <thead><tr style={{ borderBottom: `1px solid ${T.border}` }}>
                <th style={{ textAlign: 'left', padding: 4 }}>Company</th>
                <th style={{ textAlign: 'left', padding: 4 }}>Sector</th>
                <th style={{ padding: 4 }}>Classification</th>
                <th style={{ padding: 4 }}>Target Year</th>
              </tr></thead>
              <tbody>
                {sbtiInCountry.map((c, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: 4 }}>{c.n}</td>
                    <td style={{ padding: 4, color: T.textSec }}>{c.s}</td>
                    <td style={{ padding: 4, textAlign: 'center' }}><Badge color={c.c === '1.5\u00b0C' ? T.green : T.amber}>{c.c}</Badge></td>
                    <td style={{ padding: 4, textAlign: 'center' }}>{c.y}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   TAB 3 — OWID CO2 EXPLORER
   ════════════════════════════════════════════════════════════════════ */
function OwidCo2Tab({ data }) {
  const { owidCo2 } = data;
  const top20 = useMemo(() => owidCo2.getTopEmitters(20), [owidCo2]);
  const tsCountries = useMemo(() => Object.keys(owidCo2.top20TimeSeries).sort(), [owidCo2]);
  const [tsSel, setTsSel] = useState(tsCountries[0] || 'CHN');
  const tsData = useMemo(() => owidCo2.top20TimeSeries[tsSel] || [], [tsSel, owidCo2]);

  const perCapScatter = useMemo(() => owidCo2.latestByCountry.filter(c => c.co2_per_capita && c.gdp && c.gdp > 0).map(c => ({
    name: c.country, x: c.gdp / (c.population > 0 ? c.population : 1), y: c.co2_per_capita, co2: c.co2_mt,
  })), [owidCo2]);

  const globalSharePie = useMemo(() => top20.slice(0, 8).map(c => ({ name: c.country, value: c.share_global_co2 || 0 })), [top20]);
  const restShare = 100 - globalSharePie.reduce((s, c) => s + c.value, 0);
  const pieData = [...globalSharePie, { name: 'Rest of World', value: Math.max(0, restShare) }];

  const cumulBar = useMemo(() => [...owidCo2.latestByCountry].filter(c => c.cumulative_co2 > 0).sort((a, b) => b.cumulative_co2 - a.cumulative_co2).slice(0, 15).map(c => ({ country: c.country, cumCo2: c.cumulative_co2 })), [owidCo2]);

  const methaneComp = useMemo(() => owidCo2.latestByCountry.filter(c => c.methane > 0).sort((a, b) => b.methane - a.methane).slice(0, 10).map(c => ({ country: c.country, methane: c.methane, n2o: c.nitrous_oxide || 0 })), [owidCo2]);

  const [sortCol, setSortCol] = useState('co2_mt');
  const [sortDir, setSortDir] = useState('desc');
  const sorted = useMemo(() => [...owidCo2.latestByCountry].sort((a, b) => sortDir === 'desc' ? (b[sortCol] || 0) - (a[sortCol] || 0) : (a[sortCol] || 0) - (b[sortCol] || 0)), [owidCo2, sortCol, sortDir]);
  const doSort = col => { if (col === sortCol) setSortDir(d => d === 'desc' ? 'asc' : 'desc'); else { setSortCol(col); setSortDir('desc'); } };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 16 }}>
        <Kpi label="Countries" value={owidCo2.stats.totalCountries} color={T.navy} />
        <Kpi label="Top Emitter" value={top20[0] ? top20[0].country : 'N/A'} sub={top20[0] ? fmt(top20[0].co2_mt) + ' Mt' : ''} color={T.red} />
        <Kpi label="Global CO2" value={fmt(owidCo2.latestByCountry.reduce((s, c) => s + (c.co2_mt || 0), 0))} sub="Mt CO2" color={T.amber} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {/* Top 20 bar */}
        <Card>
          <SectionTitle>Top 20 Emitters (Mt CO2)</SectionTitle>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={top20} margin={{ bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="country" tick={{ fontSize: 9, angle: -45 }} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={v => fmt(v) + ' Mt'} />
              <Bar dataKey="co2_mt" fill={T.navy} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        {/* Global share pie */}
        <Card>
          <SectionTitle>Global CO2 Share</SectionTitle>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => value > 3 ? `${name} ${value.toFixed(1)}%` : ''}>
                {pieData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
              </Pie>
              <Tooltip formatter={v => pct(v)} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
        {/* Per-capita scatter */}
        <Card>
          <SectionTitle>CO2/Capita vs GDP/Capita</SectionTitle>
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" dataKey="x" name="GDP/Cap" tick={{ fontSize: 10 }} label={{ value: 'GDP/Capita ($)', position: 'bottom', fontSize: 10 }} />
              <YAxis type="number" dataKey="y" name="CO2/Cap" tick={{ fontSize: 10 }} label={{ value: 'tCO2/cap', angle: -90, position: 'insideLeft', fontSize: 10 }} />
              <Tooltip content={({ active, payload }) => active && payload && payload.length ? <div style={{ background: '#fff', padding: 8, border: '1px solid #ddd', fontSize: 11 }}><strong>{payload[0].payload.name}</strong><br />GDP/Cap: ${fmt(payload[0].payload.x)}<br />CO2/Cap: {payload[0].payload.y.toFixed(2)}t</div> : null} />
              <Scatter data={perCapScatter} fill={T.indigo} fillOpacity={0.6} r={4} />
            </ScatterChart>
          </ResponsiveContainer>
        </Card>
        {/* Time series */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <SectionTitle>CO2 Time Series</SectionTitle>
            <select value={tsSel} onChange={e => setTsSel(e.target.value)} style={{ padding: '4px 8px', borderRadius: 4, border: `1px solid ${T.border}`, fontSize: 11, fontFamily: T.mono }}>
              {tsCountries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={tsData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={v => fmt(v) + ' Mt'} />
              <Line type="monotone" dataKey="co2_mt" stroke={T.navy} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        {/* Cumulative CO2 */}
        <Card>
          <SectionTitle>Cumulative CO2 (Top 15)</SectionTitle>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={cumulBar} margin={{ bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="country" tick={{ fontSize: 9, angle: -45 }} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={v => fmt(v) + ' Mt'} />
              <Bar dataKey="cumCo2" fill={T.gold} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        {/* Methane / N2O */}
        <Card>
          <SectionTitle>Methane & N2O (Top 10)</SectionTitle>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={methaneComp} margin={{ bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="country" tick={{ fontSize: 9, angle: -45 }} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="methane" fill={T.amber} name="CH4 (Mt)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="n2o" fill={T.sage} name="N2O (Mt)" radius={[4, 4, 0, 0]} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
      {/* Full table */}
      <Card style={{ marginTop: 14 }}>
        <SectionTitle>All Countries ({sorted.length})</SectionTitle>
        <div style={{ overflowX: 'auto', maxHeight: 360, overflowY: 'auto' }}>
          <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse', fontFamily: T.mono }}>
            <thead><tr style={{ borderBottom: `2px solid ${T.border}`, position: 'sticky', top: 0, background: T.surface }}>
              {[['country', 'Country'], ['co2_mt', 'CO2 Mt'], ['co2_per_capita', 'CO2/Cap'], ['share_global_co2', 'Share %'], ['methane', 'CH4'], ['total_ghg', 'GHG Mt'], ['cumulative_co2', 'Cum CO2']].map(([k, l]) => (
                <th key={k} style={{ padding: 4, textAlign: k === 'country' ? 'left' : 'right', cursor: 'pointer', color: sortCol === k ? T.navy : T.textMut }} onClick={() => doSort(k)}>{l}{sortCol === k ? (sortDir === 'desc' ? ' \u25bc' : ' \u25b2') : ''}</th>
              ))}
            </tr></thead>
            <tbody>
              {sorted.slice(0, 80).map((c, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: 4 }}>{c.country}</td>
                  <td style={{ padding: 4, textAlign: 'right' }}>{fmt(c.co2_mt)}</td>
                  <td style={{ padding: 4, textAlign: 'right' }}>{c.co2_per_capita ? c.co2_per_capita.toFixed(2) : '-'}</td>
                  <td style={{ padding: 4, textAlign: 'right' }}>{pct(c.share_global_co2)}</td>
                  <td style={{ padding: 4, textAlign: 'right' }}>{fmt(c.methane)}</td>
                  <td style={{ padding: 4, textAlign: 'right' }}>{fmt(c.total_ghg)}</td>
                  <td style={{ padding: 4, textAlign: 'right' }}>{fmt(c.cumulative_co2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   TAB 4 — OWID ENERGY EXPLORER
   ════════════════════════════════════════════════════════════════════ */
function OwidEnergyTab({ data }) {
  const { owidEnergy } = data;
  const countries = owidEnergy.latestByCountry;
  const [sel, setSel] = useState('USA');

  const renewBar = useMemo(() => [...countries].filter(c => c.renewables_share_pct != null && c.renewables_share_pct > 0).sort((a, b) => b.renewables_share_pct - a.renewables_share_pct).slice(0, 30).map(c => ({ country: c.country, pct: c.renewables_share_pct })), [countries]);

  const selCountry = useMemo(() => owidEnergy.getCountryEnergy(sel), [sel, owidEnergy]);
  const radarData = useMemo(() => {
    if (!selCountry) return [];
    return ['coal', 'gas', 'oil', 'nuclear', 'solar', 'wind', 'hydro'].map(f => ({
      axis: f.charAt(0).toUpperCase() + f.slice(1), val: selCountry[f + '_share_pct'] || 0,
    }));
  }, [selCountry]);

  const carbonIntBar = useMemo(() => [...countries].filter(c => c.carbon_intensity_kwh > 0).sort((a, b) => b.carbon_intensity_kwh - a.carbon_intensity_kwh).slice(0, 20).map(c => ({ country: c.country, ci: c.carbon_intensity_kwh })), [countries]);

  const solarWindScatter = useMemo(() => countries.filter(c => c.solar_capacity_gw > 0 && c.wind_capacity_gw > 0).map(c => ({ name: c.country, x: c.solar_capacity_gw, y: c.wind_capacity_gw })), [countries]);

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 16 }}>
        <Kpi label="Countries" value={owidEnergy.stats.totalCountries} color={T.navy} />
        <Kpi label="Avg Renewables" value={pct(safe(countries.reduce((s, c) => s + (c.renewables_share_pct || 0), 0), countries.filter(c => c.renewables_share_pct != null).length))} color={T.green} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {/* Renewables bar */}
        <Card style={{ gridColumn: '1 / -1' }}>
          <SectionTitle>Renewables Share by Country (Top 30)</SectionTitle>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={renewBar} margin={{ bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="country" tick={{ fontSize: 8, angle: -45 }} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
              <Tooltip formatter={v => pct(v)} />
              <Bar dataKey="pct" fill={T.sage} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        {/* Energy mix radar */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <SectionTitle>Energy Mix Radar</SectionTitle>
            <select value={sel} onChange={e => setSel(e.target.value)} style={{ padding: '4px 8px', borderRadius: 4, border: `1px solid ${T.border}`, fontSize: 11, fontFamily: T.mono }}>
              {countries.map(c => <option key={c.iso} value={c.iso}>{c.country}</option>)}
            </select>
          </div>
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={radarData} outerRadius={80}>
                <PolarGrid />
                <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                <Radar dataKey="val" stroke={T.indigo} fill={T.indigo} fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
          ) : <div style={{ color: T.textMut, padding: 20, fontSize: 12 }}>No data</div>}
        </Card>
        {/* Carbon intensity */}
        <Card>
          <SectionTitle>Carbon Intensity (g CO2/kWh) Top 20</SectionTitle>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={carbonIntBar} layout="vertical" margin={{ left: 100 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="country" tick={{ fontSize: 9 }} width={95} />
              <Tooltip formatter={v => v.toFixed(0) + ' g/kWh'} />
              <Bar dataKey="ci" fill={T.red} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        {/* Solar + Wind scatter */}
        <Card style={{ gridColumn: '1 / -1' }}>
          <SectionTitle>Solar vs Wind Capacity (GW)</SectionTitle>
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" dataKey="x" name="Solar GW" tick={{ fontSize: 10 }} label={{ value: 'Solar (GW)', position: 'bottom', fontSize: 10 }} />
              <YAxis type="number" dataKey="y" name="Wind GW" tick={{ fontSize: 10 }} label={{ value: 'Wind (GW)', angle: -90, position: 'insideLeft', fontSize: 10 }} />
              <Tooltip content={({ active, payload }) => active && payload && payload.length ? <div style={{ background: '#fff', padding: 8, border: '1px solid #ddd', fontSize: 11 }}><strong>{payload[0].payload.name}</strong><br />Solar: {payload[0].payload.x.toFixed(1)} GW<br />Wind: {payload[0].payload.y.toFixed(1)} GW</div> : null} />
              <Scatter data={solarWindScatter} fill={T.amber} fillOpacity={0.7} r={5} />
            </ScatterChart>
          </ResponsiveContainer>
        </Card>
      </div>
      {/* Full table */}
      <Card style={{ marginTop: 14 }}>
        <SectionTitle>All Countries</SectionTitle>
        <div style={{ overflowX: 'auto', maxHeight: 320, overflowY: 'auto' }}>
          <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse', fontFamily: T.mono }}>
            <thead><tr style={{ borderBottom: `2px solid ${T.border}`, position: 'sticky', top: 0, background: T.surface }}>
              {['Country', 'Renewables %', 'Fossil %', 'Nuclear %', 'Carbon Int.', 'Elec Gen (TWh)', 'Solar GW', 'Wind GW'].map(h => <th key={h} style={{ padding: 4, textAlign: 'right', fontSize: 10 }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {countries.slice(0, 80).map((c, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: 4, textAlign: 'left' }}>{c.country}</td>
                  <td style={{ padding: 4, textAlign: 'right' }}>{pct(c.renewables_share_pct)}</td>
                  <td style={{ padding: 4, textAlign: 'right' }}>{pct(c.fossil_share_pct)}</td>
                  <td style={{ padding: 4, textAlign: 'right' }}>{pct(c.nuclear_share_pct)}</td>
                  <td style={{ padding: 4, textAlign: 'right' }}>{c.carbon_intensity_kwh ? c.carbon_intensity_kwh.toFixed(0) : '-'}</td>
                  <td style={{ padding: 4, textAlign: 'right' }}>{fmt(c.electricity_generation_twh)}</td>
                  <td style={{ padding: 4, textAlign: 'right' }}>{c.solar_capacity_gw ? c.solar_capacity_gw.toFixed(1) : '-'}</td>
                  <td style={{ padding: 4, textAlign: 'right' }}>{c.wind_capacity_gw ? c.wind_capacity_gw.toFixed(1) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   TAB 5 — SBTi TARGET DASHBOARD
   ════════════════════════════════════════════════════════════════════ */
function SbtiTab({ data }) {
  const { sbti } = data;
  const companies = sbti.companies;
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);
  const total = companies.length;
  const aligned15 = companies.filter(c => c.c === '1.5\u00b0C').length;
  const wb2 = companies.filter(c => c.c === 'Well-below 2\u00b0C').length;

  const bySectorBar = useMemo(() => {
    const map = {};
    companies.forEach(c => { map[c.s] = (map[c.s] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([s, n]) => ({ sector: s.length > 30 ? s.slice(0, 28) + '..' : s, count: n }));
  }, [companies]);

  const byRegionPie = useMemo(() => {
    const map = {};
    companies.forEach(c => { map[c.r] = (map[c.r] || 0) + 1; });
    return Object.entries(map).map(([r, n]) => ({ name: r, value: n }));
  }, [companies]);

  const byClassBar = useMemo(() => {
    const map = {};
    companies.forEach(c => { map[c.c] = (map[c.c] || 0) + 1; });
    return Object.entries(map).map(([c, n]) => ({ classification: c, count: n }));
  }, [companies]);

  const targetYearHist = useMemo(() => {
    const map = {};
    companies.forEach(c => { if (c.y) map[c.y] = (map[c.y] || 0) + 1; });
    return Object.entries(map).sort((a, b) => a[0] - b[0]).map(([y, n]) => ({ year: y, count: n }));
  }, [companies]);

  const sectorCoverage = useMemo(() => {
    const sectorTotals = {}; const sector15 = {};
    companies.forEach(c => { sectorTotals[c.s] = (sectorTotals[c.s] || 0) + 1; if (c.c === '1.5\u00b0C') sector15[c.s] = (sector15[c.s] || 0) + 1; });
    return Object.entries(sectorTotals).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([s, t]) => ({ sector: s.length > 25 ? s.slice(0, 23) + '..' : s, pct: safe((sector15[s] || 0), t) * 100 }));
  }, [companies]);

  const filtered = useMemo(() => search ? sbti.searchCompany(search).slice(0, 50) : companies.slice(0, 50), [search, sbti, companies]);

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 16 }}>
        <Kpi label="Total Companies" value={fmt(total)} color={T.navy} />
        <Kpi label="1.5\u00b0C Aligned" value={fmt(aligned15)} sub={pct(safe(aligned15, total) * 100)} color={T.green} />
        <Kpi label="Well-below 2\u00b0C" value={fmt(wb2)} color={T.amber} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Card>
          <SectionTitle>By Sector (Top 15)</SectionTitle>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={bySectorBar} layout="vertical" margin={{ left: 140 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="sector" tick={{ fontSize: 9 }} width={135} />
              <Tooltip />
              <Bar dataKey="count" fill={T.navy} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <SectionTitle>By Region</SectionTitle>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={byRegionPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => value > 200 ? `${name}` : ''}>
                {byRegionPie.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <SectionTitle>By Classification</SectionTitle>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={byClassBar}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="classification" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="count" fill={T.indigo} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <SectionTitle>Target Year Distribution</SectionTitle>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={targetYearHist}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="count" fill={T.gold} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card style={{ gridColumn: '1 / -1' }}>
          <SectionTitle>Sector-Level 1.5 C Coverage %</SectionTitle>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={sectorCoverage} layout="vertical" margin={{ left: 140 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="sector" tick={{ fontSize: 9 }} width={135} />
              <Tooltip formatter={v => pct(v)} />
              <Bar dataKey="pct" fill={T.green} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
      {/* Company search */}
      <Card style={{ marginTop: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <SectionTitle>Company Search</SectionTitle>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search companies..." style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, flex: 1, maxWidth: 300 }} />
        </div>
        <div style={{ overflowX: 'auto', maxHeight: 300, overflowY: 'auto' }}>
          <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse', fontFamily: T.mono }}>
            <thead><tr style={{ borderBottom: `2px solid ${T.border}` }}>
              <th style={{ textAlign: 'left', padding: 4 }}>Company</th>
              <th style={{ textAlign: 'left', padding: 4 }}>Sector</th>
              <th style={{ padding: 4 }}>Region</th>
              <th style={{ padding: 4 }}>Classification</th>
              <th style={{ padding: 4 }}>Target Year</th>
            </tr></thead>
            <tbody>
              {filtered.map((c, i) => (
                <React.Fragment key={i}>
                  <tr style={{ borderBottom: `1px solid ${T.border}`, cursor: 'pointer', background: expanded === i ? T.surfaceH : 'transparent' }} onClick={() => setExpanded(expanded === i ? null : i)}>
                    <td style={{ padding: 4, fontWeight: 600 }}>{c.n}</td>
                    <td style={{ padding: 4, color: T.textSec }}>{c.s}</td>
                    <td style={{ padding: 4, textAlign: 'center' }}>{c.r}</td>
                    <td style={{ padding: 4, textAlign: 'center' }}><Badge color={c.c === '1.5\u00b0C' ? T.green : T.amber}>{c.c}</Badge></td>
                    <td style={{ padding: 4, textAlign: 'center' }}>{c.y}</td>
                  </tr>
                  {expanded === i && (
                    <tr><td colSpan={5} style={{ padding: 8, background: T.surfaceH, fontSize: 11 }}>
                      <strong>ISIN:</strong> {c.i || 'N/A'} | <strong>Location:</strong> {c.l} | <strong>Full Sector:</strong> {c.s}
                    </td></tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   TAB 6 — CEDA SECTOR ANALYSIS
   ════════════════════════════════════════════════════════════════════ */
function CedaTab({ data }) {
  const { ceda } = data;
  const [search, setSearch] = useState('');
  const [selSector, setSelSector] = useState(ceda.sectors[0] ? ceda.sectors[0].code : '');

  const industryGrouped = useMemo(() => {
    const groups = {};
    ceda.sectors.forEach(s => {
      const prefix = s.code.slice(0, 2);
      const groupName = ceda.industryGroups[prefix] || 'Other';
      (groups[groupName] = groups[groupName] || []).push(s);
    });
    return groups;
  }, [ceda]);

  const top20Global = useMemo(() => {
    return ceda.sectors.map(s => {
      const vals = ceda.countries.map(c => c.efs ? (c.efs[s.code] || 0) : 0);
      const avg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      return { code: s.code, name: s.name.length > 35 ? s.name.slice(0, 33) + '..' : s.name, avgEf: avg };
    }).sort((a, b) => b.avgEf - a.avgEf).slice(0, 20);
  }, [ceda]);

  const countryComparison = useMemo(() => {
    return ceda.countries.slice(0, 20).map(c => ({
      country: c.name, ef: c.efs ? (c.efs[selSector] || 0) : 0,
    })).filter(c => c.ef > 0).sort((a, b) => b.ef - a.ef);
  }, [selSector, ceda]);

  const searchResults = useMemo(() => search ? ceda.searchSectors(search) : [], [search, ceda]);

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 16 }}>
        <Kpi label="Sectors" value={ceda.stats.totalSectors} color={T.navy} />
        <Kpi label="Countries" value={ceda.stats.totalCountries} color={T.sage} />
        <Kpi label="Industry Groups" value={Object.keys(ceda.industryGroups).length} color={T.indigo} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {/* Top 20 most intensive */}
        <Card style={{ gridColumn: '1 / -1' }}>
          <SectionTitle>Top 20 Most Intensive Sectors (Global Avg kgCO2e/$)</SectionTitle>
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={top20Global} layout="vertical" margin={{ left: 200 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={195} />
              <Tooltip formatter={v => v.toFixed(4) + ' kgCO2e/$'} />
              <Bar dataKey="avgEf" fill={T.navy} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        {/* Country comparison for selected sector */}
        <Card style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <SectionTitle>Country Comparison for Sector</SectionTitle>
            <select value={selSector} onChange={e => setSelSector(e.target.value)} style={{ padding: '4px 8px', borderRadius: 4, border: `1px solid ${T.border}`, fontSize: 11, fontFamily: T.mono, maxWidth: 300 }}>
              {ceda.sectors.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
            </select>
          </div>
          {countryComparison.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={countryComparison} margin={{ bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="country" tick={{ fontSize: 9, angle: -35 }} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={v => v.toFixed(4) + ' kgCO2e/$'} />
                <Bar dataKey="ef" fill={T.amber} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div style={{ color: T.textMut, padding: 20, fontSize: 12 }}>No data for this sector</div>}
        </Card>
        {/* Industry groups */}
        <Card style={{ gridColumn: '1 / -1' }}>
          <SectionTitle>Sectors by Industry Group</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 8 }}>
            {Object.entries(industryGrouped).slice(0, 12).map(([group, sectors]) => (
              <div key={group} style={{ background: T.surfaceH, borderRadius: 6, padding: 10 }}>
                <div style={{ fontWeight: 600, fontSize: 12, color: T.navy, marginBottom: 4 }}>{group}</div>
                <div style={{ fontSize: 11, color: T.textSec }}>{sectors.length} sectors</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      {/* Search */}
      <Card style={{ marginTop: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <SectionTitle>Search Sectors</SectionTitle>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="e.g. cement, steel..." style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, flex: 1, maxWidth: 300 }} />
        </div>
        {searchResults.length > 0 && (
          <div style={{ maxHeight: 240, overflowY: 'auto' }}>
            {searchResults.slice(0, 20).map((s, i) => (
              <div key={i} style={{ padding: '6px 0', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: T.navy }}>{s.name}</span>
                <Badge>{s.code}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   TAB 7 — CBAM VULNERABILITY VIEWER
   ════════════════════════════════════════════════════════════════════ */
function CbamTab({ data }) {
  const { cbam } = data;
  const countries = cbam.countries;
  const [sel, setSel] = useState(countries[0] ? countries[0].iso3 : '');

  const top20Vuln = useMemo(() => [...countries].sort((a, b) => b.vulnerabilityIndex - a.vulnerabilityIndex).slice(0, 20).map(c => ({ country: c.name, vi: c.vulnerabilityIndex * 100 })), [countries]);

  const selCountry = useMemo(() => cbam.getCountryVulnerability(sel), [sel, cbam]);
  const radarData = useMemo(() => {
    if (!selCountry) return [];
    return [
      { axis: 'Export Dep.', val: (selCountry.depExports || 0) * 100 },
      { axis: 'CBAM Exp.', val: (selCountry.depCbamExports || 0) * 100 },
      { axis: 'EU Market', val: (selCountry.depEuMarket || 0) * 100 },
      { axis: 'Emission Int.', val: (selCountry.emissionIntensity || 0) * 100 },
      { axis: 'Carbon Price', val: (selCountry.carbonPriceSignal || 0) * 100 },
    ];
  }, [selCountry]);

  const vulnHist = useMemo(() => {
    const bins = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
    return bins.slice(0, -1).map((low, i) => ({
      range: `${(low * 100).toFixed(0)}-${(bins[i + 1] * 100).toFixed(0)}%`,
      count: countries.filter(c => c.vulnerabilityIndex >= low && c.vulnerabilityIndex < bins[i + 1]).length,
    }));
  }, [countries]);

  const commodityBar = useMemo(() => {
    const map = {};
    cbam.tradeFlows.forEach(tf => { map[tf.commodity] = (map[tf.commodity] || 0) + (tf.totalEmissions_tco2 || 0); });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([c, v]) => ({ commodity: c, emissions: v }));
  }, [cbam]);

  const tradeFlowTop = useMemo(() => [...cbam.tradeFlows].sort((a, b) => (b.exports_kusd || 0) - (a.exports_kusd || 0)).slice(0, 15), [cbam]);

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 16 }}>
        <Kpi label="Countries" value={cbam.stats.totalCountries} color={T.navy} />
        <Kpi label="Trade Flows" value={fmt(cbam.stats.totalTradeFlows)} color={T.indigo} />
        <Kpi label="CBAM Commodities" value={cbam.stats.totalCommodities} color={T.gold} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {/* Top 20 vulnerable */}
        <Card>
          <SectionTitle>Top 20 Most Vulnerable</SectionTitle>
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={top20Vuln} layout="vertical" margin={{ left: 100 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="country" tick={{ fontSize: 9 }} width={95} />
              <Tooltip formatter={v => pct(v)} />
              <Bar dataKey="vi" fill={T.red} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        {/* Sub-index radar */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <SectionTitle>Sub-Index Radar</SectionTitle>
            <select value={sel} onChange={e => setSel(e.target.value)} style={{ padding: '4px 8px', borderRadius: 4, border: `1px solid ${T.border}`, fontSize: 11, fontFamily: T.mono }}>
              {countries.map(c => <option key={c.iso3} value={c.iso3}>{c.name}</option>)}
            </select>
          </div>
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData} outerRadius={90}>
                <PolarGrid />
                <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                <Radar dataKey="val" stroke={T.red} fill={T.red} fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
          ) : <div style={{ color: T.textMut, padding: 20, fontSize: 12 }}>Select a country</div>}
        </Card>
        {/* Vulnerability histogram */}
        <Card>
          <SectionTitle>Vulnerability Distribution</SectionTitle>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={vulnHist}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="range" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="count" fill={T.amber} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        {/* Commodity emissions */}
        <Card>
          <SectionTitle>Commodity Exposure (tCO2)</SectionTitle>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={commodityBar}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="commodity" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={v => fmt(v) + ' tCO2'} />
              <Bar dataKey="emissions" fill={T.navy} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        {/* Trade flow table */}
        <Card style={{ gridColumn: '1 / -1' }}>
          <SectionTitle>Top Trade Flows</SectionTitle>
          <div style={{ overflowX: 'auto', maxHeight: 240, overflowY: 'auto' }}>
            <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse', fontFamily: T.mono }}>
              <thead><tr style={{ borderBottom: `2px solid ${T.border}` }}>
                <th style={{ textAlign: 'left', padding: 4 }}>Origin</th><th style={{ padding: 4 }}>Dest</th><th style={{ padding: 4 }}>Commodity</th><th style={{ padding: 4, textAlign: 'right' }}>Exports (k$)</th><th style={{ padding: 4, textAlign: 'right' }}>Emissions (tCO2)</th>
              </tr></thead>
              <tbody>
                {tradeFlowTop.map((tf, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: 4 }}>{tf.iso3}</td><td style={{ padding: 4, textAlign: 'center' }}>{tf.dest}</td><td style={{ padding: 4 }}>{tf.commodity}</td><td style={{ padding: 4, textAlign: 'right' }}>{fmt(tf.exports_kusd)}</td><td style={{ padding: 4, textAlign: 'right' }}>{fmt(tf.totalEmissions_tco2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        {/* Phase-in timeline */}
        <Card style={{ gridColumn: '1 / -1' }}>
          <SectionTitle>CBAM Phase-In Timeline</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={cbam.phaseIn}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} domain={[0, 1]} tickFormatter={v => (v * 100).toFixed(0) + '%'} />
              <Tooltip formatter={v => (v * 100).toFixed(1) + '%'} />
              <Area type="monotone" dataKey="factor" stroke={T.navy} fill={T.navy} fillOpacity={0.15} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   TAB 8 — FOOD CARBON (BIG CLIMATE DB)
   ════════════════════════════════════════════════════════════════════ */
function FoodCarbonTab({ data }) {
  const { bigClimate } = data;
  const products = bigClimate.products;
  const [search, setSearch] = useState('');

  const categoryAvg = useMemo(() => {
    const map = {};
    products.forEach(p => {
      if (!map[p.category]) map[p.category] = { sum: 0, count: 0 };
      map[p.category].sum += p.total; map[p.category].count += 1;
    });
    return Object.entries(map).map(([cat, d]) => ({ category: cat.length > 25 ? cat.slice(0, 23) + '..' : cat, avgTotal: safe(d.sum, d.count) })).sort((a, b) => b.avgTotal - a.avgTotal);
  }, [products]);

  const top20 = useMemo(() => [...products].sort((a, b) => b.total - a.total).slice(0, 20).map(p => ({ name: p.name.length > 30 ? p.name.slice(0, 28) + '..' : p.name, total: p.total })), [products]);

  const [selProduct, setSelProduct] = useState(products[0] ? products[0].name : '');
  const countryComp = useMemo(() => {
    return products.filter(p => p.name === selProduct).map(p => ({ country: p.country, total: p.total }));
  }, [selProduct, products]);

  const lifecycleData = useMemo(() => {
    const phases = ['agriculture', 'iluc', 'processing', 'packaging', 'transport', 'retail'];
    const map = {};
    bigClimate.categories.forEach(cat => {
      const items = bigClimate.getByCategory(cat);
      if (items.length === 0) return;
      const row = { category: cat.length > 20 ? cat.slice(0, 18) + '..' : cat };
      phases.forEach(p => { row[p] = safe(items.reduce((s, i) => s + (i[p] || 0), 0), items.length); });
      map[cat] = row;
    });
    return Object.values(map).sort((a, b) => (b.agriculture + b.transport) - (a.agriculture + a.transport));
  }, [bigClimate]);

  const proteinItems = useMemo(() => products.filter(p => p.category && p.category.toLowerCase().includes('meat')).slice(0, 15).map(p => ({ name: p.name.length > 25 ? p.name.slice(0, 23) + '..' : p.name, total: p.total })).sort((a, b) => b.total - a.total), [products]);

  const searchResults = useMemo(() => search ? bigClimate.searchProducts(search).slice(0, 30) : [], [search, bigClimate]);

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 16 }}>
        <Kpi label="Products" value={fmt(bigClimate.stats.totalProducts)} color={T.navy} />
        <Kpi label="Categories" value={bigClimate.stats.totalCategories} color={T.sage} />
        <Kpi label="Countries" value={bigClimate.stats.totalCountries} color={T.indigo} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {/* Category average */}
        <Card>
          <SectionTitle>Average CO2e by Category</SectionTitle>
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={categoryAvg} layout="vertical" margin={{ left: 140 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="category" tick={{ fontSize: 9 }} width={135} />
              <Tooltip formatter={v => v.toFixed(2) + ' kgCO2e/kg'} />
              <Bar dataKey="avgTotal" fill={T.sage} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        {/* Top 20 highest */}
        <Card>
          <SectionTitle>Top 20 Highest Emission Foods</SectionTitle>
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={top20} layout="vertical" margin={{ left: 160 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={155} />
              <Tooltip formatter={v => v.toFixed(2) + ' kgCO2e/kg'} />
              <Bar dataKey="total" fill={T.red} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        {/* Country comparison */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <SectionTitle>Country Comparison</SectionTitle>
            <select value={selProduct} onChange={e => setSelProduct(e.target.value)} style={{ padding: '4px 8px', borderRadius: 4, border: `1px solid ${T.border}`, fontSize: 10, fontFamily: T.mono, maxWidth: 220 }}>
              {[...new Set(products.map(p => p.name))].slice(0, 100).map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          {countryComp.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={countryComp}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="country" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={v => v.toFixed(3) + ' kgCO2e/kg'} />
                <Bar dataKey="total" fill={T.gold} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div style={{ color: T.textMut, padding: 20, fontSize: 12 }}>Select a product</div>}
        </Card>
        {/* Protein comparison */}
        <Card>
          <SectionTitle>Protein Carbon Comparison</SectionTitle>
          {proteinItems.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={proteinItems} layout="vertical" margin={{ left: 130 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={125} />
                <Tooltip formatter={v => v.toFixed(2) + ' kgCO2e/kg'} />
                <Bar dataKey="total" fill={T.amber} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div style={{ color: T.textMut, padding: 20, fontSize: 12 }}>No meat/protein data</div>}
        </Card>
        {/* Lifecycle stacked bar */}
        <Card style={{ gridColumn: '1 / -1' }}>
          <SectionTitle>Lifecycle Phase Breakdown by Category</SectionTitle>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={lifecycleData} layout="vertical" margin={{ left: 120 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="category" tick={{ fontSize: 9 }} width={115} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="agriculture" stackId="a" fill={PALETTE[0]} name="Agriculture" />
              <Bar dataKey="iluc" stackId="a" fill={PALETTE[1]} name="ILUC" />
              <Bar dataKey="processing" stackId="a" fill={PALETTE[2]} name="Processing" />
              <Bar dataKey="packaging" stackId="a" fill={PALETTE[3]} name="Packaging" />
              <Bar dataKey="transport" stackId="a" fill={PALETTE[4]} name="Transport" />
              <Bar dataKey="retail" stackId="a" fill={PALETTE[5]} name="Retail" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
      {/* Product search */}
      <Card style={{ marginTop: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <SectionTitle>Search Products</SectionTitle>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="e.g. beef, milk, bread..." style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, flex: 1, maxWidth: 300 }} />
        </div>
        {searchResults.length > 0 && (
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse', fontFamily: T.mono }}>
              <thead><tr style={{ borderBottom: `2px solid ${T.border}` }}>
                <th style={{ textAlign: 'left', padding: 4 }}>Product</th><th style={{ padding: 4 }}>Country</th><th style={{ padding: 4 }}>Category</th><th style={{ padding: 4, textAlign: 'right' }}>Total kgCO2e</th>
              </tr></thead>
              <tbody>
                {searchResults.map((p, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: 4 }}>{p.name}</td><td style={{ padding: 4, textAlign: 'center' }}>{p.country}</td><td style={{ padding: 4 }}>{p.category}</td><td style={{ padding: 4, textAlign: 'right' }}>{p.total.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   TAB 9 — CROSS-SOURCE ANALYTICS
   ════════════════════════════════════════════════════════════════════ */
function CrossSourceTab({ data }) {
  const { owidCo2, owidEnergy, ceda, cbam, sbti } = data;

  /* CO2/cap vs CEDA avg emission intensity */
  const co2VsCeda = useMemo(() => {
    return owidCo2.latestByCountry.filter(c => c.co2_per_capita && c.iso).map(c => {
      const cedaC = ceda.countries.find(cc => cc.code === c.iso);
      if (!cedaC || !cedaC.efs) return null;
      const vals = Object.values(cedaC.efs);
      const avgEf = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      return { name: c.country, co2cap: c.co2_per_capita, cedaAvg: avgEf };
    }).filter(Boolean).slice(0, 60);
  }, [owidCo2, ceda]);

  /* Renewables share vs carbon intensity */
  const renewVsCarbon = useMemo(() => {
    return owidEnergy.latestByCountry.filter(c => c.renewables_share_pct != null && c.carbon_intensity_kwh > 0).map(c => ({
      name: c.country, renew: c.renewables_share_pct, ci: c.carbon_intensity_kwh,
    }));
  }, [owidEnergy]);

  /* SBTi coverage vs CO2 */
  const sbtiVsCo2 = useMemo(() => {
    const regionCo2 = {};
    owidCo2.latestByCountry.forEach(c => { regionCo2[c.country] = c.co2_mt; });
    const regionSbti = {};
    sbti.companies.forEach(c => { regionSbti[c.r] = (regionSbti[c.r] || 0) + 1; });
    return Object.entries(regionSbti).map(([r, count]) => ({ region: r, sbtiCount: count }));
  }, [owidCo2, sbti]);

  /* Multi-source enrichment table for 20 key countries */
  const keyCountries = useMemo(() => {
    const top = owidCo2.getTopEmitters(20);
    return top.map(c => {
      const en = owidEnergy.getCountryEnergy(c.iso);
      const cb = cbam.getCountryVulnerability(c.iso);
      const sbtiCount = sbti.companies.filter(s => s.l && s.l.toLowerCase().includes(c.country.toLowerCase())).length;
      return {
        country: c.country, co2: c.co2_mt, co2cap: c.co2_per_capita,
        renewables: en ? en.renewables_share_pct : null,
        carbonInt: en ? en.carbon_intensity_kwh : null,
        cbamVuln: cb ? (cb.vulnerabilityIndex * 100).toFixed(1) : null,
        sbtiCount,
      };
    });
  }, [owidCo2, owidEnergy, cbam, sbti]);

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {/* CO2/cap vs CEDA */}
        <Card>
          <SectionTitle>CO2/Capita vs CEDA Emission Intensity</SectionTitle>
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" dataKey="co2cap" name="CO2/Cap" tick={{ fontSize: 10 }} label={{ value: 'tCO2/capita', position: 'bottom', fontSize: 10 }} />
              <YAxis type="number" dataKey="cedaAvg" name="CEDA Avg" tick={{ fontSize: 10 }} label={{ value: 'Avg kgCO2e/$', angle: -90, position: 'insideLeft', fontSize: 10 }} />
              <Tooltip content={({ active, payload }) => active && payload && payload.length ? <div style={{ background: '#fff', padding: 8, border: '1px solid #ddd', fontSize: 11 }}><strong>{payload[0].payload.name}</strong><br />CO2/Cap: {payload[0].payload.co2cap.toFixed(2)}t<br />CEDA: {payload[0].payload.cedaAvg.toFixed(4)}</div> : null} />
              <Scatter data={co2VsCeda} fill={T.navy} fillOpacity={0.6} r={4} />
            </ScatterChart>
          </ResponsiveContainer>
        </Card>
        {/* Renewables vs carbon intensity */}
        <Card>
          <SectionTitle>Renewables Share vs Carbon Intensity</SectionTitle>
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" dataKey="renew" name="Renewables %" tick={{ fontSize: 10 }} label={{ value: 'Renewables %', position: 'bottom', fontSize: 10 }} />
              <YAxis type="number" dataKey="ci" name="g CO2/kWh" tick={{ fontSize: 10 }} label={{ value: 'g CO2/kWh', angle: -90, position: 'insideLeft', fontSize: 10 }} />
              <Tooltip content={({ active, payload }) => active && payload && payload.length ? <div style={{ background: '#fff', padding: 8, border: '1px solid #ddd', fontSize: 11 }}><strong>{payload[0].payload.name}</strong><br />Renew: {pct(payload[0].payload.renew)}<br />CI: {payload[0].payload.ci.toFixed(0)} g/kWh</div> : null} />
              <Scatter data={renewVsCarbon} fill={T.sage} fillOpacity={0.6} r={4} />
            </ScatterChart>
          </ResponsiveContainer>
        </Card>
        {/* SBTi by region */}
        <Card>
          <SectionTitle>SBTi Coverage by Region</SectionTitle>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={sbtiVsCo2}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="region" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="sbtiCount" fill={T.indigo} name="SBTi Companies" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        {/* CBAM vuln vs EU trade (countries that have CBAM data) */}
        <Card>
          <SectionTitle>CBAM Vulnerability vs Export Dependence</SectionTitle>
          <ResponsiveContainer width="100%" height={240}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" dataKey="x" name="Export Dep." tick={{ fontSize: 10 }} />
              <YAxis type="number" dataKey="y" name="Vulnerability" tick={{ fontSize: 10 }} />
              <Tooltip content={({ active, payload }) => active && payload && payload.length ? <div style={{ background: '#fff', padding: 8, border: '1px solid #ddd', fontSize: 11 }}><strong>{payload[0].payload.name}</strong><br />Export: {pct(payload[0].payload.x * 100)}<br />Vuln: {pct(payload[0].payload.y * 100)}</div> : null} />
              <Scatter data={cbam.countries.map(c => ({ name: c.name, x: c.depExports || 0, y: c.vulnerabilityIndex || 0 }))} fill={T.red} fillOpacity={0.6} r={4} />
            </ScatterChart>
          </ResponsiveContainer>
        </Card>
        {/* Multi-source enrichment table */}
        <Card style={{ gridColumn: '1 / -1' }}>
          <SectionTitle>Multi-Source Enrichment (Top 20 Emitters)</SectionTitle>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse', fontFamily: T.mono }}>
              <thead><tr style={{ borderBottom: `2px solid ${T.border}` }}>
                <th style={{ textAlign: 'left', padding: 4 }}>Country</th>
                <th style={{ padding: 4, textAlign: 'right' }}>CO2 (Mt)</th>
                <th style={{ padding: 4, textAlign: 'right' }}>CO2/Cap</th>
                <th style={{ padding: 4, textAlign: 'right' }}>Renewables %</th>
                <th style={{ padding: 4, textAlign: 'right' }}>Carbon Int.</th>
                <th style={{ padding: 4, textAlign: 'right' }}>CBAM Vuln %</th>
                <th style={{ padding: 4, textAlign: 'right' }}>SBTi Cos</th>
              </tr></thead>
              <tbody>
                {keyCountries.map((c, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: 4, fontWeight: 600 }}>{c.country}</td>
                    <td style={{ padding: 4, textAlign: 'right' }}>{fmt(c.co2)}</td>
                    <td style={{ padding: 4, textAlign: 'right' }}>{c.co2cap ? c.co2cap.toFixed(2) : '-'}</td>
                    <td style={{ padding: 4, textAlign: 'right' }}>{c.renewables != null ? pct(c.renewables) : '-'}</td>
                    <td style={{ padding: 4, textAlign: 'right' }}>{c.carbonInt ? c.carbonInt.toFixed(0) + ' g' : '-'}</td>
                    <td style={{ padding: 4, textAlign: 'right' }}>{c.cbamVuln || '-'}</td>
                    <td style={{ padding: 4, textAlign: 'right' }}>{c.sbtiCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   TAB 10 — SOURCE DOCUMENTATION
   ════════════════════════════════════════════════════════════════════ */
function SourceDocTab({ data }) {
  const { sources } = data;
  const [expanded, setExpanded] = useState(null);
  const docs = [
    { id: 'ceda', methodology: 'Spend-based emission factors using EEIO (Environmentally Extended Input-Output) modelling. Covers 400 NAICS sectors across 149 countries. Factors expressed in kgCO2e per USD of economic output.', url: 'https://www.ceda.co.uk', updateFreq: 'Annual', quality: 'High (peer-reviewed EEIO methodology)', coverage: 'Global (149 countries), all NAICS sectors', fields: 'Sector code, Sector name, Description, Emission factor (kgCO2e/$), Country' },
    { id: 'bigClimate', methodology: 'Life-cycle assessment (LCA) carbon footprints for food products. Covers agriculture, ILUC, processing, packaging, transport, and retail phases. Data from CONCITO Big Climate Database v1.2.', url: 'https://denstoreklimadatabase.dk', updateFreq: 'Annual', quality: 'High (ISO 14040/14044 compliant LCA)', coverage: '5 European countries (DK, GB, FR, ES, NL), 16 food categories', fields: 'Product name, Country, Category, Agriculture, ILUC, Processing, Packaging, Transport, Retail, Total (kgCO2e/kg)' },
    { id: 'cbam', methodology: 'EU Carbon Border Adjustment Mechanism vulnerability assessment. Composite index from export dependence, CBAM commodity exposure, EU market dependence, emission intensity, and carbon price signal.', url: 'https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism_en', updateFreq: 'Quarterly', quality: 'High (official EU trade data + emission inventories)', coverage: '105 non-EU countries, 6 CBAM commodities', fields: 'Country, ISO3, Vulnerability Index, Sub-indices (5), Trade flows, Default values, Phase-in schedule' },
    { id: 'owidCo2', methodology: 'Comprehensive CO2 and greenhouse gas emissions dataset from Global Carbon Project, EDGAR, and national inventories. Includes CO2, methane, N2O, per-capita, cumulative, and sectoral breakdowns.', url: 'https://ourworldindata.org/co2-and-greenhouse-gas-emissions', updateFreq: 'Annual', quality: 'Very High (multiple peer-reviewed sources)', coverage: '213 countries, 1990-2024 time series for top 20', fields: 'CO2 (Mt), Per capita, Per GDP, Coal/Oil/Gas/Cement CO2, Methane, N2O, Total GHG, Share global, Cumulative' },
    { id: 'owidEnergy', methodology: 'Energy production, consumption, and mix data from IEA, IRENA, and national statistics. Covers primary energy, electricity generation, renewable capacity, and carbon intensity of electricity.', url: 'https://ourworldindata.org/energy', updateFreq: 'Annual', quality: 'Very High (IEA/IRENA official statistics)', coverage: '138 countries', fields: 'Primary energy (TWh), Per capita, Electricity gen, Renewables/Fossil/Nuclear share, Solar/Wind/Hydro/Coal/Gas/Oil share, Carbon intensity, Capacity (GW)' },
    { id: 'sbti', methodology: 'Science Based Targets initiative company database. Companies with validated near-term and/or net-zero targets aligned with 1.5C or well-below 2C pathways. Classification based on SBTi assessment methodology.', url: 'https://sciencebasedtargets.org/companies-taking-action', updateFreq: 'Monthly', quality: 'Very High (independently validated targets)', coverage: '10,700+ companies across all regions and sectors', fields: 'Company name, ISIN, Location, Region, Sector, Classification (1.5C/WB2C/2C), Target year' },
  ];

  return (
    <div>
      <SectionTitle>Source Documentation</SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {docs.map((doc, i) => {
          const src = sources.find(s => s.id === doc.id) || {};
          const isOpen = expanded === i;
          return (
            <Card key={doc.id} style={{ borderLeft: `3px solid ${PALETTE[i]}`, cursor: 'pointer' }} onClick={() => setExpanded(isOpen ? null : i)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontWeight: 700, color: T.navy, fontSize: 14 }}>{src.name || doc.id}</span>
                  <span style={{ marginLeft: 8 }}><Badge color={PALETTE[i]}>{src.version}</Badge></span>
                  <span style={{ marginLeft: 8 }}><Badge>{src.license}</Badge></span>
                </div>
                <span style={{ fontSize: 12, color: T.textMut }}>{isOpen ? '\u25b2' : '\u25bc'}</span>
              </div>
              <div style={{ fontSize: 12, color: T.textSec, marginTop: 4 }}>{src.provider}</div>
              {isOpen && (
                <div style={{ marginTop: 12, fontSize: 12, lineHeight: 1.6 }}>
                  <div style={{ marginBottom: 8 }}><strong style={{ color: T.navy }}>Methodology:</strong> <span style={{ color: T.textSec }}>{doc.methodology}</span></div>
                  <div style={{ marginBottom: 8 }}><strong style={{ color: T.navy }}>Update Frequency:</strong> <span style={{ color: T.textSec }}>{doc.updateFreq}</span></div>
                  <div style={{ marginBottom: 8 }}><strong style={{ color: T.navy }}>Data Quality:</strong> <span style={{ color: T.textSec }}>{doc.quality}</span></div>
                  <div style={{ marginBottom: 8 }}><strong style={{ color: T.navy }}>Coverage:</strong> <span style={{ color: T.textSec }}>{doc.coverage}</span></div>
                  <div style={{ marginBottom: 8 }}><strong style={{ color: T.navy }}>Fields:</strong> <span style={{ color: T.textSec }}>{doc.fields}</span></div>
                  <div style={{ marginBottom: 8 }}><strong style={{ color: T.navy }}>Records:</strong> <span style={{ color: T.textSec }}>{fmt(src.recordCount)}</span></div>
                  <div><strong style={{ color: T.navy }}>URL:</strong> <span style={{ color: T.indigo, fontFamily: T.mono, fontSize: 11 }}>{doc.url}</span></div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ════════════════════════════════════════════════════════════════════ */
export default function ReferenceDataExplorerPage() {
  const data = useReferenceData();
  const [tab, setTab] = useState(0);

  return (
    <div style={{ fontFamily: T.font, color: T.text, background: T.bg, minHeight: '100vh', padding: '24px 32px' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: T.navy, margin: 0 }}>Reference Data Explorer</h1>
        <p style={{ fontSize: 13, color: T.textSec, margin: '4px 0 0', fontFamily: T.mono }}>
          {data.globalStats.totalSources} sources | {fmt(data.globalStats.totalRecords)} records | {data.globalStats.totalCountries} countries
        </p>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 20, overflowX: 'auto', borderBottom: `2px solid ${T.border}`, paddingBottom: 0 }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{
            padding: '8px 14px', fontSize: 12, fontWeight: tab === i ? 700 : 500, fontFamily: T.font,
            color: tab === i ? T.navy : T.textMut, background: tab === i ? T.surface : 'transparent',
            border: 'none', borderBottom: tab === i ? `2px solid ${T.gold}` : '2px solid transparent',
            cursor: 'pointer', whiteSpace: 'nowrap', marginBottom: -2, borderRadius: '6px 6px 0 0',
            transition: 'all 0.15s',
          }}>{t}</button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 0 && <DashboardTab data={data} />}
      {tab === 1 && <CountryIntelligenceTab data={data} />}
      {tab === 2 && <OwidCo2Tab data={data} />}
      {tab === 3 && <OwidEnergyTab data={data} />}
      {tab === 4 && <SbtiTab data={data} />}
      {tab === 5 && <CedaTab data={data} />}
      {tab === 6 && <CbamTab data={data} />}
      {tab === 7 && <FoodCarbonTab data={data} />}
      {tab === 8 && <CrossSourceTab data={data} />}
      {tab === 9 && <SourceDocTab data={data} />}
    </div>
  );
}
