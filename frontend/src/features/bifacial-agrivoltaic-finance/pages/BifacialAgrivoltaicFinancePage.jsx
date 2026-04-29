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

const CROP_TYPES = ['Wheat', 'Lettuce', 'Tomatoes', 'Grapes', 'Lavender', 'Berries', 'Potatoes', 'Spinach'];
const COUNTRIES = ['Germany', 'Japan', 'India', 'France', 'USA', 'Netherlands', 'South Korea', 'Italy', 'Spain', 'Australia'];
const IRRIGATION_SYSTEMS = ['Drip', 'Sprinkler', 'Furrow', 'Subsurface Drip'];

const PROJECTS = Array.from({ length: 20 }, (_, i) => {
  const capacityMw = 5 + Math.round(sr(i * 7) * 145);
  const bifacialGainPct = 3 + sr(i * 13) * 9;
  const albedoCoeff = 0.15 + sr(i * 17) * 0.30;
  const groundClearanceM = 1.5 + sr(i * 11) * 2.0;
  const agriYieldRetentionPct = 60 + sr(i * 19) * 25;
  const lcoe = 28 + sr(i * 23) * 27;
  const irr = 6.5 + sr(i * 29) * 7.0;
  const irrigationSaving = 15 + sr(i * 31) * 35;
  const cropRevenue = 800 + sr(i * 37) * 2200;
  const solarRevenue = capacityMw * (38 + sr(i * 41) * 22) * 1000;
  return {
    id: `EC1-${String(i + 1).padStart(2, '0')}`,
    name: `AV-${COUNTRIES[i % COUNTRIES.length]}-${String(i + 1).padStart(3, '0')}`,
    country: COUNTRIES[i % COUNTRIES.length],
    capacityMw,
    bifacialGainPct: +bifacialGainPct.toFixed(1),
    albedoCoeff: +albedoCoeff.toFixed(2),
    groundClearanceM: +groundClearanceM.toFixed(1),
    agriYieldRetentionPct: +agriYieldRetentionPct.toFixed(1),
    lcoe: +lcoe.toFixed(1),
    irr: +irr.toFixed(2),
    cropType: CROP_TYPES[i % CROP_TYPES.length],
    irrigationSaving: +irrigationSaving.toFixed(1),
    cropRevenue: +cropRevenue.toFixed(0),
    solarRevenue: +solarRevenue.toFixed(0),
    irrigationSystem: IRRIGATION_SYSTEMS[i % IRRIGATION_SYSTEMS.length],
    landAreaHa: +(capacityMw * (0.9 + sr(i * 53) * 0.6)).toFixed(1),
  };
});

const POLICY_DATA = [
  { country: 'Germany', policy: 'EEG Agrivoltaics Premium', tariff: 12.5, year: 2023, status: 'Active' },
  { country: 'Japan', policy: 'Solar Sharing FIT', tariff: 18.0, year: 2013, status: 'Active' },
  { country: 'India', policy: 'PM-KUSUM Scheme', tariff: 0, year: 2019, status: 'Active' },
  { country: 'France', policy: 'AO Agrivoltaique', tariff: 11.0, year: 2023, status: 'Active' },
  { country: 'Netherlands', policy: 'SDE++ Agrivoltaics', tariff: 9.8, year: 2022, status: 'Active' },
  { country: 'South Korea', policy: 'RPS Agrivoltaic Multiplier', tariff: 14.0, year: 2021, status: 'Active' },
  { country: 'USA', policy: 'IRA Agri-Solar ITC Bonus', tariff: 0, year: 2023, status: 'Active' },
  { country: 'Italy', policy: 'Agrivoltaico Piano Nazionale', tariff: 10.5, year: 2023, status: 'Proposed' },
];

const CF_BY_COUNTRY = {
  Germany: 0.11, Japan: 0.13, India: 0.19, France: 0.14, USA: 0.20,
  Netherlands: 0.10, 'South Korea': 0.14, Italy: 0.16, Spain: 0.18, Australia: 0.21
};

const KPI_CARD = ({ label, value, unit, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 20px', flex: 1, minWidth: 150 }}>
    <div style={{ fontSize: 12, color: T.sub, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.text }}>{value}</div>
    {unit && <div style={{ fontSize: 11, color: T.sub }}>{unit}</div>}
  </div>
);

const TABS = [
  { id: 'portfolio', label: 'Project Portfolio' },
  { id: 'bifacial', label: 'Bifacial Gain Model' },
  { id: 'agri', label: 'Agrivoltaic Co-Benefits' },
  { id: 'land', label: 'Land Economics' },
  { id: 'financing', label: 'Financing Structure' },
  { id: 'policy', label: 'Policy Landscape' },
];

export default function BifacialAgrivoltaicFinancePage() {
  const [activeTab, setActiveTab] = useState('portfolio');
  const [selectedCountry, setSelectedCountry] = useState('All');

  const filtered = useMemo(() =>
    selectedCountry === 'All' ? PROJECTS : PROJECTS.filter(p => p.country === selectedCountry),
    [selectedCountry]
  );

  const kpis = useMemo(() => {
    const totalMw = filtered.reduce((s, p) => s + p.capacityMw, 0);
    const avgBifacialGain = filtered.length ? filtered.reduce((s, p) => s + p.bifacialGainPct, 0) / filtered.length : 0;
    const avgLcoe = filtered.length ? filtered.reduce((s, p) => s + p.lcoe, 0) / filtered.length : 0;
    const avgIrr = filtered.length ? filtered.reduce((s, p) => s + p.irr, 0) / filtered.length : 0;
    const avgAgriRetention = filtered.length ? filtered.reduce((s, p) => s + p.agriYieldRetentionPct, 0) / filtered.length : 0;
    const totalLandHa = filtered.reduce((s, p) => s + p.landAreaHa, 0);
    return { totalMw, avgBifacialGain, avgLcoe, avgIrr, avgAgriRetention, totalLandHa };
  }, [filtered]);

  const bifacialGainData = useMemo(() =>
    filtered.map(p => {
      const cf = CF_BY_COUNTRY[p.country] || 0.15;
      const baseAep = p.capacityMw * cf * 8760;
      const bifacialAep = baseAep * (1 + p.bifacialGainPct / 100);
      return {
        name: p.name.slice(-6),
        baseAep: +(baseAep / 1000).toFixed(1),
        bifacialAep: +(bifacialAep / 1000).toFixed(1),
        gain: p.bifacialGainPct,
      };
    }), [filtered]);

  const albedoScatter = useMemo(() =>
    filtered.map(p => ({ albedo: p.albedoCoeff, gain: p.bifacialGainPct, name: p.name })),
    [filtered]);

  const landEconomicsData = useMemo(() =>
    filtered.slice(0, 12).map(p => {
      const solarRev = p.solarRevenue / 1e6;
      const cropRev = (p.cropRevenue * p.landAreaHa * p.agriYieldRetentionPct / 100) / 1e6;
      return {
        name: p.name.slice(-6),
        solarRevM: +solarRev.toFixed(2),
        cropRevM: +cropRev.toFixed(2),
        totalRevM: +(solarRev + cropRev).toFixed(2),
      };
    }), [filtered]);

  const cobenefitsData = useMemo(() => [
    { benefit: 'Irrigation Savings', value: +(filtered.length ? filtered.reduce((s, p) => s + p.irrigationSaving, 0) / filtered.length : 0).toFixed(1), unit: '% Water Saved' },
    { benefit: 'Agri Yield Retention', value: +(filtered.length ? filtered.reduce((s, p) => s + p.agriYieldRetentionPct, 0) / filtered.length : 0).toFixed(1), unit: '% of Baseline' },
    { benefit: 'CO2 Displaced/MW', value: +(0.45 * 8760 * 0.15 / 1000).toFixed(2), unit: 'ktCO2e/MW/yr' },
    { benefit: 'Land Dual-Use', value: 100, unit: '% Land Active' },
  ], [filtered]);

  const debtEquitySplit = [
    { name: 'Senior Debt', value: 65, color: T.blue },
    { name: 'Mezzanine', value: 10, color: T.teal },
    { name: 'Tax Equity', value: 15, color: T.gold },
    { name: 'Sponsor Equity', value: 10, color: T.green },
  ];

  const irrSensitivity = useMemo(() => [
    { scenario: 'Base', irr: kpis.avgIrr.toFixed(1) },
    { scenario: '+5% Bifacial', irr: (kpis.avgIrr * 1.03).toFixed(1) },
    { scenario: '+10% Crop Rev', irr: (kpis.avgIrr * 1.04).toFixed(1) },
    { scenario: '-10% CAPEX', irr: (kpis.avgIrr * 1.06).toFixed(1) },
    { scenario: 'Combined Upside', irr: (kpis.avgIrr * 1.12).toFixed(1) },
    { scenario: '-5% Energy Yield', irr: (kpis.avgIrr * 0.94).toFixed(1) },
    { scenario: 'CAPEX +10%', irr: (kpis.avgIrr * 0.93).toFixed(1) },
  ], [kpis]);

  const countryPipeline = useMemo(() => {
    const byCountry = {};
    PROJECTS.forEach(p => {
      if (!byCountry[p.country]) byCountry[p.country] = { country: p.country, projects: 0, mw: 0 };
      byCountry[p.country].projects++;
      byCountry[p.country].mw += p.capacityMw;
    });
    return Object.values(byCountry).sort((a, b) => b.mw - a.mw);
  }, []);

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: T.sub, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>EP-EC1 · Solar Energy Finance</div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: T.text, margin: 0 }}>Bifacial PV & Agrivoltaic Finance Analytics</h1>
          <p style={{ color: T.sub, marginTop: 6, fontSize: 14 }}>
            Dual land-use solar finance — bifacial gain modelling, agrivoltaic co-benefits, land economics and policy landscape.
          </p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <select value={selectedCountry} onChange={e => setSelectedCountry(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.card, fontSize: 13 }}>
            <option value="All">All Countries</option>
            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div style={{ marginLeft: 'auto', fontSize: 13, color: T.sub, alignSelf: 'center' }}>
            Showing {filtered.length} of {PROJECTS.length} projects
          </div>
        </div>

        {/* KPI Row */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <KPI_CARD label="Total Capacity" value={kpis.totalMw.toLocaleString()} unit="MW" color={T.blue} />
          <KPI_CARD label="Avg Bifacial Gain" value={kpis.avgBifacialGain.toFixed(1)} unit="%" color={T.green} />
          <KPI_CARD label="Avg LCOE" value={kpis.avgLcoe.toFixed(1)} unit="$/MWh" color={T.teal} />
          <KPI_CARD label="Avg Project IRR" value={kpis.avgIrr.toFixed(2)} unit="%" color={T.gold} />
          <KPI_CARD label="Avg Agri Retention" value={kpis.avgAgriRetention.toFixed(1)} unit="% yield" color={T.sage} />
          <KPI_CARD label="Total Land" value={kpis.totalLandHa.toLocaleString()} unit="ha" color={T.indigo} />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `1px solid ${T.border}`, paddingBottom: 0 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              style={{
                padding: '8px 16px', border: 'none', background: activeTab === t.id ? T.blue : 'transparent',
                color: activeTab === t.id ? '#fff' : T.sub, borderRadius: '6px 6px 0 0',
                cursor: 'pointer', fontWeight: activeTab === t.id ? 600 : 400, fontSize: 13
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Panels */}
        {activeTab === 'portfolio' && (
          <div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: T.navy, color: '#fff' }}>
                    {['ID', 'Name', 'Country', 'MW', 'Bifacial %', 'Albedo', 'Clearance (m)', 'Crop', 'Agri Ret. %', 'LCOE $/MWh', 'IRR %'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, fontSize: 12 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p, i) => (
                    <tr key={p.id} style={{ background: i % 2 === 0 ? T.card : '#F9F8F5', borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '8px 12px', color: T.sub, fontFamily: 'monospace', fontSize: 11 }}>{p.id}</td>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>{p.name}</td>
                      <td style={{ padding: '8px 12px' }}>{p.country}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right' }}>{p.capacityMw}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', color: T.green, fontWeight: 600 }}>{p.bifacialGainPct}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right' }}>{p.albedoCoeff}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right' }}>{p.groundClearanceM}</td>
                      <td style={{ padding: '8px 12px' }}>{p.cropType}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right' }}>{p.agriYieldRetentionPct}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right' }}>{p.lcoe}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', color: T.teal, fontWeight: 600 }}>{p.irr}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'bifacial' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15, color: T.text }}>AEP: Base vs Bifacial Gain (GWh)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={bifacialGainData.slice(0, 12)} margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v, n) => [`${v} GWh`, n]} />
                  <Legend />
                  <Bar dataKey="baseAep" name="Base AEP" fill={T.blue} />
                  <Bar dataKey="bifacialAep" name="Bifacial AEP" fill={T.green} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15, color: T.text }}>Albedo Coefficient vs Bifacial Gain (%)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={[...albedoScatter].sort((a, b) => a.albedo - b.albedo)} margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="albedo" tickFormatter={v => v.toFixed(2)} tick={{ fontSize: 10 }} label={{ value: 'Albedo', position: 'insideBottom', offset: -2, fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} label={{ value: 'Gain %', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                  <Tooltip formatter={(v) => [`${v}%`, 'Gain']} />
                  <Bar dataKey="gain" name="Bifacial Gain %" fill={T.teal}>
                    {albedoScatter.map((_, idx) => <Cell key={idx} fill={T.teal} opacity={0.6 + idx * 0.02} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}`, gridColumn: '1/-1' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 15, color: T.text }}>Bifacial Gain by Ground Clearance — NREL Model Reference</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 12 }}>
                {[
                  { clearance: '1.0–1.5m', gain: '3–5%', note: 'Low clearance — limited rear irradiance', color: T.amber },
                  { clearance: '1.5–2.0m', gain: '5–8%', note: 'Standard agrivoltaic height', color: T.teal },
                  { clearance: '2.0–2.5m', gain: '7–10%', note: 'Tall vegetation clearance', color: T.green },
                  { clearance: '>2.5m', gain: '9–12%', note: 'Maximum bifacial gain zone', color: T.blue },
                ].map(item => (
                  <div key={item.clearance} style={{ background: T.bg, borderRadius: 8, padding: 14, borderLeft: `3px solid ${item.color}` }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: item.color }}>{item.gain}</div>
                    <div style={{ fontSize: 12, color: T.text, marginTop: 2 }}>{item.clearance}</div>
                    <div style={{ fontSize: 11, color: T.sub, marginTop: 4 }}>{item.note}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'agri' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15, color: T.text }}>Co-Benefits Summary</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {cobenefitsData.map(b => (
                  <div key={b.benefit} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: T.bg, borderRadius: 8 }}>
                    <span style={{ fontSize: 13, color: T.text }}>{b.benefit}</span>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 16, fontWeight: 700, color: T.green }}>{b.value}</span>
                      <span style={{ fontSize: 11, color: T.sub, marginLeft: 4 }}>{b.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16, padding: 12, background: '#EFF6FF', borderRadius: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.blue }}>Fraunhofer ISE Finding</div>
                <div style={{ fontSize: 12, color: T.text, marginTop: 4 }}>
                  Agrivoltaic systems can retain 60–97% of crop yield while producing ~1,500 kWh/ha/yr of solar energy (Fraunhofer ISE, 2020).
                </div>
              </div>
            </div>
            <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15, color: T.text }}>Crop Yield Retention by Type</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={[
                  { crop: 'Lettuce', retention: 97 }, { crop: 'Spinach', retention: 92 },
                  { crop: 'Lavender', retention: 89 }, { crop: 'Berries', retention: 83 },
                  { crop: 'Grapes', retention: 80 }, { crop: 'Wheat', retention: 75 },
                  { crop: 'Tomatoes', retention: 72 }, { crop: 'Potatoes', retention: 65 },
                ]} margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="crop" tick={{ fontSize: 11 }} />
                  <YAxis domain={[50, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={v => [`${v}%`, 'Yield Retention']} />
                  <Bar dataKey="retention" name="Yield Retention %">
                    {[97, 92, 89, 83, 80, 75, 72, 65].map((v, i) => (
                      <Cell key={i} fill={v > 85 ? T.green : v > 75 ? T.teal : T.amber} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}`, gridColumn: '1/-1' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15, color: T.text }}>Irrigation Savings by System Type</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {IRRIGATION_SYSTEMS.map((sys, i) => {
                  const ps = PROJECTS.filter(p => p.irrigationSystem === sys);
                  const avg = ps.length ? ps.reduce((s, p) => s + p.irrigationSaving, 0) / ps.length : 0;
                  return (
                    <div key={sys} style={{ background: T.bg, borderRadius: 8, padding: 14, textAlign: 'center', borderTop: `3px solid ${[T.blue, T.green, T.teal, T.gold][i]}` }}>
                      <div style={{ fontSize: 11, color: T.sub }}>{sys}</div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: T.text, marginTop: 4 }}>{avg.toFixed(1)}%</div>
                      <div style={{ fontSize: 11, color: T.sub }}>Avg Water Saved</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'land' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15, color: T.text }}>Dual Land-Use Revenue (M$)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={landEconomicsData} margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v, n) => [`$${v}M`, n]} />
                  <Legend />
                  <Bar dataKey="solarRevM" name="Solar Revenue" stackId="a" fill={T.blue} />
                  <Bar dataKey="cropRevM" name="Crop Revenue" stackId="a" fill={T.green} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15, color: T.text }}>Revenue Breakdown</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={[
                    { name: 'Solar Revenue', value: landEconomicsData.reduce((s, p) => s + p.solarRevM, 0), fill: T.blue },
                    { name: 'Crop Revenue', value: landEconomicsData.reduce((s, p) => s + p.cropRevM, 0), fill: T.green },
                  ]} cx="50%" cy="50%" outerRadius={85} dataKey="value" label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`} labelLine={false} />
                  <Tooltip formatter={v => [`$${v.toFixed(1)}M`]} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ marginTop: 12, fontSize: 12, color: T.sub, textAlign: 'center' }}>
                Avg land value uplift: <strong style={{ color: T.green }}>2.3–4.1×</strong> vs single-use
              </div>
            </div>
          </div>
        )}

        {activeTab === 'financing' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15, color: T.text }}>Typical Capital Stack</h3>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={debtEquitySplit} cx="50%" cy="50%" outerRadius={90} dataKey="value"
                    label={({ name, value }) => `${name} ${value}%`} labelLine={false}>
                    {debtEquitySplit.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={v => [`${v}%`]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15, color: T.text }}>IRR Sensitivity Analysis</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={irrSensitivity} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" domain={['dataMin - 0.5', 'dataMax + 0.5']} tick={{ fontSize: 11 }} />
                  <YAxis dataKey="scenario" type="category" tick={{ fontSize: 11 }} />
                  <Tooltip formatter={v => [`${v}%`, 'IRR']} />
                  <Bar dataKey="irr" name="Project IRR %">
                    {irrSensitivity.map((s, i) => (
                      <Cell key={i} fill={s.scenario === 'Base' ? T.blue : parseFloat(s.irr) > parseFloat(irrSensitivity[0].irr) ? T.green : T.red} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'policy' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
              {countryPipeline.slice(0, 4).map((c, i) => (
                <KPI_CARD key={c.country} label={c.country} value={c.mw.toLocaleString()} unit={`MW · ${c.projects} projects`} color={[T.blue, T.green, T.teal, T.gold][i]} />
              ))}
            </div>
            <div style={{ background: T.card, borderRadius: 10, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: T.navy, color: '#fff' }}>
                    {['Country', 'Policy / Programme', 'FIT / Tariff (€ct/kWh)', 'Year Enacted', 'Status'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, fontSize: 12 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {POLICY_DATA.map((p, i) => (
                    <tr key={p.country} style={{ background: i % 2 === 0 ? T.card : '#F9F8F5', borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '10px 16px', fontWeight: 600 }}>{p.country}</td>
                      <td style={{ padding: '10px 16px' }}>{p.policy}</td>
                      <td style={{ padding: '10px 16px', textAlign: 'right' }}>{p.tariff > 0 ? p.tariff : '—'}</td>
                      <td style={{ padding: '10px 16px', textAlign: 'right' }}>{p.year}</td>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{ background: p.status === 'Active' ? '#D1FAE5' : '#FEF3C7', color: p.status === 'Active' ? T.green : T.amber, padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: 32, padding: '16px 0', borderTop: `1px solid ${T.border}`, fontSize: 11, color: T.sub }}>
          Data sources: NREL Bifacial PV Gain Database (2023) · Fraunhofer ISE Agrivoltaics Studies (2020–2023) · IEA PVPS Task 8 · Japan MAFF Solar Sharing Survey · BMWi EEG Agrivoltaics Premium Guidance · ITC/IRA Domestic Content Bonus (26 USC §48E) · World Bank Agrivoltaics Potential Study
        </div>
      </div>
    </div>
  );
}
