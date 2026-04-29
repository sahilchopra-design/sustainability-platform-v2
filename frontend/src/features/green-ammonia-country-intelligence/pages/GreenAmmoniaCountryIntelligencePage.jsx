import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, RadarChart, PolarGrid, PolarAngleAxis, Radar,
  ScatterChart, Scatter, ZAxis
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

const COUNTRIES = [
  { country: 'Australia', region: 'Asia-Pacific', announcedCapacity_mt_yr: 35.0, operationalCapacity_mt_yr: 0.05, electrolyser_gw_pipeline: 90, renewableCostAdvantage: 'solar+wind 2500h+', portInfraScore: 5, waterAvailabilityScore: 2, regulatoryScore: 5, offtakeAgreements: 12, keyProjects: 'NEOM, Murchison, CWP, H2U Eyre' },
  { country: 'Chile', region: 'Latin America', announcedCapacity_mt_yr: 20.0, operationalCapacity_mt_yr: 0.01, electrolyser_gw_pipeline: 50, renewableCostAdvantage: 'solar+wind best in world', portInfraScore: 4, waterAvailabilityScore: 1, regulatoryScore: 4, offtakeAgreements: 8, keyProjects: 'HIF Haru Oni, ENGIE, Andes Mining, Enaex' },
  { country: 'Morocco', region: 'Africa', announcedCapacity_mt_yr: 15.0, operationalCapacity_mt_yr: 0.0, electrolyser_gw_pipeline: 30, renewableCostAdvantage: 'solar 2200h, wind 3000h', portInfraScore: 4, waterAvailabilityScore: 2, regulatoryScore: 4, offtakeAgreements: 6, keyProjects: 'Hive, CWP, IRESEN, OCP' },
  { country: 'Saudi Arabia', region: 'Middle East', announcedCapacity_mt_yr: 15.0, operationalCapacity_mt_yr: 0.08, electrolyser_gw_pipeline: 40, renewableCostAdvantage: 'solar 2600h DNI', portInfraScore: 5, waterAvailabilityScore: 1, regulatoryScore: 3, offtakeAgreements: 9, keyProjects: 'NEOM/Air Products, SABIC, Aramco' },
  { country: 'Oman', region: 'Middle East', announcedCapacity_mt_yr: 12.0, operationalCapacity_mt_yr: 0.01, electrolyser_gw_pipeline: 28, renewableCostAdvantage: 'solar 2400h, wind coast', portInfraScore: 4, waterAvailabilityScore: 1, regulatoryScore: 4, offtakeAgreements: 7, keyProjects: 'Aman, ACME, BP Oman, Hyport Duqm' },
  { country: 'Kazakhstan', region: 'Central Asia', announcedCapacity_mt_yr: 8.0, operationalCapacity_mt_yr: 0.0, electrolyser_gw_pipeline: 20, renewableCostAdvantage: 'wind 3000h+ steppe', portInfraScore: 2, waterAvailabilityScore: 3, regulatoryScore: 3, offtakeAgreements: 3, keyProjects: 'Svevind, H2-KZ, TotalEnergies' },
  { country: 'Canada', region: 'North America', announcedCapacity_mt_yr: 8.0, operationalCapacity_mt_yr: 0.0, electrolyser_gw_pipeline: 22, renewableCostAdvantage: 'wind+hydro E.coast', portInfraScore: 4, waterAvailabilityScore: 5, regulatoryScore: 5, offtakeAgreements: 5, keyProjects: 'EverWind NS, World Energy GH2, Bear Head' },
  { country: 'Namibia', region: 'Africa', announcedCapacity_mt_yr: 5.0, operationalCapacity_mt_yr: 0.0, electrolyser_gw_pipeline: 12, renewableCostAdvantage: 'solar+wind Lüderitz', portInfraScore: 2, waterAvailabilityScore: 1, regulatoryScore: 4, offtakeAgreements: 4, keyProjects: 'Hyphen, ENGIE, Cleanergy Namibia' },
  { country: 'Spain', region: 'Europe', announcedCapacity_mt_yr: 6.0, operationalCapacity_mt_yr: 0.01, electrolyser_gw_pipeline: 14, renewableCostAdvantage: 'solar 2000h S.Spain', portInfraScore: 5, waterAvailabilityScore: 3, regulatoryScore: 5, offtakeAgreements: 7, keyProjects: 'Cepsa, Fertiberia, HydroHub, HyDeal' },
  { country: 'Brazil', region: 'Latin America', announcedCapacity_mt_yr: 7.0, operationalCapacity_mt_yr: 0.0, electrolyser_gw_pipeline: 18, renewableCostAdvantage: 'wind NE coast 4000h+', portInfraScore: 4, waterAvailabilityScore: 5, regulatoryScore: 3, offtakeAgreements: 4, keyProjects: 'Ceará Hub, EDP, Neoenergia, Neon' },
  { country: 'Egypt', region: 'Africa', announcedCapacity_mt_yr: 4.0, operationalCapacity_mt_yr: 0.0, electrolyser_gw_pipeline: 8, renewableCostAdvantage: 'solar 2600h Aswan', portInfraScore: 4, waterAvailabilityScore: 1, regulatoryScore: 3, offtakeAgreements: 3, keyProjects: 'SCZONE, Globeleq, BSREC, Masdar' },
  { country: 'UAE', region: 'Middle East', announcedCapacity_mt_yr: 5.0, operationalCapacity_mt_yr: 0.02, electrolyser_gw_pipeline: 10, renewableCostAdvantage: 'solar Al Dhafra 2600h', portInfraScore: 5, waterAvailabilityScore: 1, regulatoryScore: 4, offtakeAgreements: 6, keyProjects: 'Masdar, ADNOC, EmiratesGreenH2' },
  { country: 'Germany', region: 'Europe', announcedCapacity_mt_yr: 1.5, operationalCapacity_mt_yr: 0.01, electrolyser_gw_pipeline: 5, renewableCostAdvantage: 'offshore wind 4000h', portInfraScore: 5, waterAvailabilityScore: 5, regulatoryScore: 5, offtakeAgreements: 10, keyProjects: 'Yara, Salzgitter, Covestro, RWE' },
  { country: 'Norway', region: 'Europe', announcedCapacity_mt_yr: 1.0, operationalCapacity_mt_yr: 0.01, electrolyser_gw_pipeline: 3, renewableCostAdvantage: 'hydro+wind 90%+ RE', portInfraScore: 4, waterAvailabilityScore: 5, regulatoryScore: 5, offtakeAgreements: 5, keyProjects: 'Yara Porsgrunn, Nel ASA, Statkraft' },
  { country: 'India', region: 'Asia-Pacific', announcedCapacity_mt_yr: 10.0, operationalCapacity_mt_yr: 0.02, electrolyser_gw_pipeline: 25, renewableCostAdvantage: 'solar 2200h Rajasthan', portInfraScore: 4, waterAvailabilityScore: 2, regulatoryScore: 4, offtakeAgreements: 8, keyProjects: 'ACME, Greenko, ReNew, NTPC' },
  { country: 'South Korea', region: 'Asia-Pacific', announcedCapacity_mt_yr: 0.5, operationalCapacity_mt_yr: 0.01, electrolyser_gw_pipeline: 2, renewableCostAdvantage: 'import-focused nation', portInfraScore: 5, waterAvailabilityScore: 3, regulatoryScore: 4, offtakeAgreements: 6, keyProjects: 'POSCO, SK E&S, JERA Korea, Lotte' },
  { country: 'Japan', region: 'Asia-Pacific', announcedCapacity_mt_yr: 0.3, operationalCapacity_mt_yr: 0.005, electrolyser_gw_pipeline: 1, renewableCostAdvantage: 'import-focused nation', portInfraScore: 5, waterAvailabilityScore: 4, regulatoryScore: 5, offtakeAgreements: 9, keyProjects: 'JERA, Sumitomo, Mitsubishi, NYK' },
  { country: 'Netherlands', region: 'Europe', announcedCapacity_mt_yr: 1.0, operationalCapacity_mt_yr: 0.01, electrolyser_gw_pipeline: 4, renewableCostAdvantage: 'offshore wind 3800h', portInfraScore: 5, waterAvailabilityScore: 5, regulatoryScore: 5, offtakeAgreements: 7, keyProjects: 'Rotterdam H2Hub, Yara, OCI, Nouryon' },
  { country: 'Portugal', region: 'Europe', announcedCapacity_mt_yr: 2.0, operationalCapacity_mt_yr: 0.0, electrolyser_gw_pipeline: 5, renewableCostAdvantage: 'solar+wind Alentejo', portInfraScore: 4, waterAvailabilityScore: 3, regulatoryScore: 5, offtakeAgreements: 4, keyProjects: 'Madoqua, EDP, GALP, Sines Hub' },
  { country: 'Kenya', region: 'Africa', announcedCapacity_mt_yr: 2.0, operationalCapacity_mt_yr: 0.0, electrolyser_gw_pipeline: 5, renewableCostAdvantage: 'geothermal+wind Turkana', portInfraScore: 3, waterAvailabilityScore: 3, regulatoryScore: 3, offtakeAgreements: 2, keyProjects: 'H2Kenya, Rift Valley H2, Lake Turkana' },
];

const REGION_COLORS = {
  'Asia-Pacific': T.blue,
  'Latin America': T.green,
  'Africa': T.amber,
  'Middle East': T.gold,
  'Europe': T.indigo,
  'North America': T.teal,
  'Central Asia': T.sage,
};

const TABS = ['Country Dashboard', 'Production Pipeline', 'Cost Competitiveness', 'Infrastructure Readiness', 'Policy Environment', 'Investment Tracker'];

const KpiCard = ({ label, value, unit, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 18px', minWidth: 150 }}>
    <div style={{ fontSize: 11, color: T.sub, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.text }}>{value}</div>
    {unit && <div style={{ fontSize: 11, color: T.sub }}>{unit}</div>}
  </div>
);

export default function GreenAmmoniaCountryIntelligencePage() {
  const [tab, setTab] = useState(0);
  const [regionFilter, setRegionFilter] = useState('All');
  const [selectedCountry, setSelectedCountry] = useState(null);

  const regions = useMemo(() => ['All', ...Array.from(new Set(COUNTRIES.map(c => c.region)))], []);
  const filtered = useMemo(() => regionFilter === 'All' ? COUNTRIES : COUNTRIES.filter(c => c.region === regionFilter), [regionFilter]);

  const totalPipeline = useMemo(() => COUNTRIES.reduce((a, b) => a + b.announcedCapacity_mt_yr, 0), []);
  const totalOperational = useMemo(() => COUNTRIES.reduce((a, b) => a + b.operationalCapacity_mt_yr, 0), []);
  const totalElectrolyser = useMemo(() => COUNTRIES.reduce((a, b) => a + b.electrolyser_gw_pipeline, 0), []);

  const radarData = useMemo(() => {
    const c = selectedCountry ? COUNTRIES.find(x => x.country === selectedCountry) : null;
    if (!c) return [];
    return [
      { metric: 'Port Infra', score: c.portInfraScore },
      { metric: 'Water', score: c.waterAvailabilityScore },
      { metric: 'Regulatory', score: c.regulatoryScore },
      { metric: 'Offtake', score: Math.min(5, c.offtakeAgreements / 3) },
      { metric: 'Pipeline Size', score: Math.min(5, c.announcedCapacity_mt_yr / 8) },
    ];
  }, [selectedCountry]);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: T.font, padding: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <span style={{ background: T.amber, color: '#fff', borderRadius: 6, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>EP-EE4</span>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text, margin: 0 }}>Green Ammonia Country Pipeline & Competitiveness</h1>
        </div>
        <p style={{ color: T.sub, fontSize: 13, margin: 0 }}>20 country pipeline — 158 Mt/yr announced capacity · Source: IRENA 2023, Hydrogen Council, IEA Hydrogen Projects Database, AHB</p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div>
          <label style={{ fontSize: 12, color: T.sub, marginRight: 6 }}>Region</label>
          <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)}
            style={{ border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 8px', fontSize: 13, background: T.card }}>
            {regions.map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, color: T.sub, marginRight: 6 }}>Drill-down Country</label>
          <select value={selectedCountry || ''} onChange={e => setSelectedCountry(e.target.value || null)}
            style={{ border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 8px', fontSize: 13, background: T.card }}>
            <option value="">—</option>
            {COUNTRIES.map(c => <option key={c.country}>{c.country}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
        <KpiCard label="Total Pipeline" value={`${totalPipeline.toFixed(0)} Mt`} unit="announced 2030 capacity" color={T.green} />
        <KpiCard label="Operational Today" value={`${totalOperational.toFixed(2)} Mt`} unit="running capacity" color={T.teal} />
        <KpiCard label="Electrolyser Pipeline" value={`${totalElectrolyser} GW`} unit="global total" color={T.indigo} />
        <KpiCard label="Countries Tracked" value={COUNTRIES.length} unit="producers + importers" />
        <KpiCard label="Filtered Countries" value={filtered.length} unit="in region" color={T.amber} />
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)}
            style={{ padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: tab === i ? 700 : 400, background: tab === i ? T.amber : T.card, color: tab === i ? '#fff' : T.text }}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab 0: Country Dashboard */}
      {tab === 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}`, gridColumn: '1/-1' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Country Pipeline Directory</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.bg }}>
                    {['Country', 'Region', 'Announced Mt/yr', 'Operational Mt/yr', 'Electrolyser GW', 'Port', 'Water', 'Regulatory', 'Offtake', 'Key Projects'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.sub, fontWeight: 600, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...filtered].sort((a, b) => b.announcedCapacity_mt_yr - a.announcedCapacity_mt_yr).map((c, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.card : T.bg }}>
                      <td style={{ padding: '7px 10px', fontWeight: 700, color: T.text }}>{c.country}</td>
                      <td style={{ padding: '7px 10px' }}>
                        <span style={{ background: '#F0F9F4', color: REGION_COLORS[c.region] || T.sub, borderRadius: 4, padding: '2px 6px', fontSize: 10, fontWeight: 600 }}>{c.region}</span>
                      </td>
                      <td style={{ padding: '7px 10px', fontWeight: 700, color: T.green }}>{c.announcedCapacity_mt_yr.toFixed(1)}</td>
                      <td style={{ padding: '7px 10px', color: T.sub }}>{c.operationalCapacity_mt_yr.toFixed(2)}</td>
                      <td style={{ padding: '7px 10px' }}>{c.electrolyser_gw_pipeline}</td>
                      <td style={{ padding: '7px 10px' }}>{'★'.repeat(c.portInfraScore)}</td>
                      <td style={{ padding: '7px 10px' }}>{'●'.repeat(c.waterAvailabilityScore)}</td>
                      <td style={{ padding: '7px 10px' }}>{'✓'.repeat(c.regulatoryScore)}</td>
                      <td style={{ padding: '7px 10px', color: T.teal, fontWeight: 600 }}>{c.offtakeAgreements}</td>
                      <td style={{ padding: '7px 10px', color: T.sub, fontSize: 11, maxWidth: 160 }}>{c.keyProjects}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {selectedCountry && radarData.length > 0 && (
            <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>{selectedCountry} — Competitiveness Radar</h3>
              <ResponsiveContainer width="100%" height={240}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
                  <Radar dataKey="score" stroke={T.amber} fill={T.amber} fillOpacity={0.3} name={selectedCountry} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Tab 1: Production Pipeline */}
      {tab === 1 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}`, gridColumn: '1/-1' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Announced Green NH3 Capacity by Country (Mt/yr, 2030 target)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={[...COUNTRIES].sort((a, b) => b.announcedCapacity_mt_yr - a.announcedCapacity_mt_yr)}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="country" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} unit=" Mt" />
                <Tooltip />
                <Bar dataKey="announcedCapacity_mt_yr" name="Announced Mt/yr">
                  {COUNTRIES.map((c, i) => <Cell key={i} fill={REGION_COLORS[c.region] || T.sub} />)}
                </Bar>
                <Bar dataKey="operationalCapacity_mt_yr" fill={T.green} name="Operational Mt/yr" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Electrolyser GW Pipeline by Country</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={[...COUNTRIES].sort((a, b) => b.electrolyser_gw_pipeline - a.electrolyser_gw_pipeline).slice(0, 12)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize: 10 }} unit=" GW" />
                <YAxis dataKey="country" type="category" tick={{ fontSize: 10 }} width={80} />
                <Tooltip />
                <Bar dataKey="electrolyser_gw_pipeline" name="Electrolyser GW">
                  {[...COUNTRIES].sort((a, b) => b.electrolyser_gw_pipeline - a.electrolyser_gw_pipeline).slice(0, 12).map((c, i) => <Cell key={i} fill={REGION_COLORS[c.region] || T.sub} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Pipeline by Region (Mt/yr announced)</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={Object.entries(COUNTRIES.reduce((acc, c) => {
                acc[c.region] = (acc[c.region] || 0) + c.announcedCapacity_mt_yr; return acc;
              }, {})).map(([region, cap]) => ({ region, cap })).sort((a, b) => b.cap - a.cap)}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="region" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={55} />
                <YAxis tick={{ fontSize: 11 }} unit=" Mt" />
                <Tooltip />
                <Bar dataKey="cap" name="Capacity Mt/yr">
                  {Object.keys(REGION_COLORS).map((r, i) => <Cell key={i} fill={REGION_COLORS[r]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 2: Cost Competitiveness */}
      {tab === 2 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}`, gridColumn: '1/-1' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Estimated LCOA Range by Country (2025 → 2030, USD/t)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={[...COUNTRIES].sort((a, b) => {
                const costA = 380 + (20 - a.portInfraScore * 2) * 5 + sr(a.country.length * 7) * 80;
                const costB = 380 + (20 - b.portInfraScore * 2) * 5 + sr(b.country.length * 7) * 80;
                return costA - costB;
              }).slice(0, 15).map((c, i) => ({
                country: c.country,
                low2025: Math.round(450 + sr(i * 7) * 200),
                low2030: Math.round(380 + sr(i * 11) * 150),
                grey: 275,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="country" tick={{ fontSize: 9 }} angle={-25} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} unit=" $/t" />
                <Tooltip />
                <Legend />
                <Bar dataKey="low2025" fill={T.amber} name="LCOA 2025 est." />
                <Bar dataKey="low2030" fill={T.green} name="LCOA 2030 est." />
                <Bar dataKey="grey" fill={T.sub} name="Grey NH3 ref." />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Renewable Resource Advantage</h3>
            {COUNTRIES.filter(c => ['Australia', 'Chile', 'Morocco', 'Saudi Arabia', 'Oman', 'Norway'].includes(c.country)).map((c, i) => (
              <div key={i} style={{ background: T.bg, borderRadius: 8, padding: 10, marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, color: T.text, fontSize: 13 }}>{c.country}</span>
                  <span style={{ fontSize: 11, color: T.green }}>{c.renewableCostAdvantage}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Offtake Agreements vs. Pipeline Size</h3>
            <ResponsiveContainer width="100%" height={220}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="pipeline" name="Announced Mt/yr" unit=" Mt" tick={{ fontSize: 10 }} />
                <YAxis dataKey="offtake" name="Offtake agreements" tick={{ fontSize: 10 }} />
                <ZAxis range={[40, 120]} />
                <Tooltip />
                <Scatter data={COUNTRIES.map(c => ({ pipeline: c.announcedCapacity_mt_yr, offtake: c.offtakeAgreements, name: c.country }))} fill={T.amber} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 3: Infrastructure Readiness */}
      {tab === 3 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Port Infrastructure Score</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={[...filtered].sort((a, b) => b.portInfraScore - a.portInfraScore)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 10 }} />
                <YAxis dataKey="country" type="category" tick={{ fontSize: 10 }} width={90} />
                <Tooltip />
                <Bar dataKey="portInfraScore" fill={T.teal} name="Port Score /5" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Water Availability vs. Port Infra</h3>
            <ResponsiveContainer width="100%" height={280}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="port" name="Port Score" domain={[0.5, 5.5]} tick={{ fontSize: 10 }} label={{ value: 'Port Infra (1-5)', position: 'insideBottom', offset: -5, fontSize: 11 }} />
                <YAxis dataKey="water" name="Water Score" domain={[0.5, 5.5]} tick={{ fontSize: 10 }} label={{ value: 'Water (1-5)', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                <ZAxis dataKey="pipeline" range={[30, 200]} name="Pipeline Mt/yr" />
                <Tooltip formatter={(v, n) => [n === 'Pipeline Mt/yr' ? `${v} Mt/yr` : `${v}/5`, n]} />
                <Scatter data={filtered.map(c => ({ port: c.portInfraScore, water: c.waterAvailabilityScore, pipeline: c.announcedCapacity_mt_yr, name: c.country }))} fill={T.green} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 4: Policy Environment */}
      {tab === 4 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Regulatory Score by Country</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={[...filtered].sort((a, b) => b.regulatoryScore - a.regulatoryScore)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 10 }} />
                <YAxis dataKey="country" type="category" tick={{ fontSize: 10 }} width={90} />
                <Tooltip />
                <Bar dataKey="regulatoryScore" name="Regulatory Score /5">
                  {[...filtered].sort((a, b) => b.regulatoryScore - a.regulatoryScore).map((c, i) => <Cell key={i} fill={c.regulatoryScore >= 4 ? T.green : c.regulatoryScore >= 3 ? T.teal : T.amber} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Key Policy Programs</h3>
            {[
              { country: 'Australia', scheme: 'Hydrogen Headstart', commitment: 'A$2bn over 7yr', instrument: 'Production credit ~$2/kg H2' },
              { country: 'Chile', scheme: 'National H2 Strategy', commitment: '$25bn private pipeline', instrument: 'Haru Oni offtake' },
              { country: 'EU (Morocco/Namibia)', scheme: 'H2Global', commitment: '€900M tender', instrument: 'Double-auction CfD' },
              { country: 'Germany', scheme: 'National H2 Strategy', commitment: '€9bn + €2bn intl', instrument: 'PtX import quotas' },
              { country: 'Japan', scheme: 'Green Innovation Fund', commitment: '¥2 trillion', instrument: 'NH3 co-firing mandate' },
              { country: 'USA', scheme: 'IRA §45V', commitment: 'Uncapped PTC', instrument: '$3/kg H2 PTC tier 1' },
              { country: 'India', scheme: 'NGHM', commitment: '₹19,744 Cr ($2.4bn)', instrument: 'Viability gap funding' },
            ].map((p, i) => (
              <div key={i} style={{ background: T.bg, borderRadius: 8, padding: 10, marginBottom: 7 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontWeight: 700, fontSize: 12, color: T.text }}>{p.country}</span>
                  <span style={{ fontSize: 11, color: T.green, fontWeight: 600 }}>{p.commitment}</span>
                </div>
                <div style={{ fontSize: 11, color: T.sub }}>{p.scheme} · {p.instrument}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Investment Tracker */}
      {tab === 5 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Offtake Agreements by Country</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={[...filtered].sort((a, b) => b.offtakeAgreements - a.offtakeAgreements)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="country" type="category" tick={{ fontSize: 10 }} width={90} />
                <Tooltip />
                <Bar dataKey="offtakeAgreements" fill={T.indigo} name="Offtake agreements" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Investment Readiness Matrix</h3>
            <ResponsiveContainer width="100%" height={280}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="regulatory" name="Regulatory Score" domain={[0.5, 5.5]} tick={{ fontSize: 10 }} label={{ value: 'Regulatory (1-5)', position: 'insideBottom', offset: -5, fontSize: 10 }} />
                <YAxis dataKey="pipeline" name="Pipeline Mt/yr" tick={{ fontSize: 10 }} label={{ value: 'Pipeline Mt/yr', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                <ZAxis dataKey="offtake" range={[30, 200]} name="Offtake" />
                <Tooltip formatter={(v, n) => [n === 'Pipeline Mt/yr' ? `${v} Mt/yr` : `${v}/5`, n]} />
                <Scatter data={filtered.map(c => ({ regulatory: c.regulatoryScore, pipeline: c.announcedCapacity_mt_yr, offtake: c.offtakeAgreements, name: c.country }))} fill={T.amber} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}`, gridColumn: '1/-1' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Global Green NH3 Investment Ramp ($bn cumulative)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={[2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030].map((yr, i) => ({
                yr,
                committed: Math.round(5 + i * 12 + sr(i * 7) * 8),
                announced: Math.round(30 + i * 35 + sr(i * 11) * 15),
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="yr" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="$bn" />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="announced" stroke={T.amber} fill="#FEF3C7" name="Announced $bn" />
                <Area type="monotone" dataKey="committed" stroke={T.green} fill="#D1FAE5" name="Committed $bn" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Bilateral Deals supplemental panel always visible */}
      <div style={{ marginTop: 24, background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 14 }}>Key Bilateral Green NH3 / H2 Deals & MOUs (2022–2024)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { from: 'Australia', to: 'Japan', deal: 'Australia–Japan H2 Partnership', value: 'A$500M feasibility', year: 2022, status: 'Active' },
            { from: 'Morocco', to: 'Germany', deal: 'H2Global MoU (DKSH)', value: '€900M tender', year: 2022, status: 'Active' },
            { from: 'Namibia', to: 'Germany', deal: 'Hyphen Hydrogen Energy', value: '$10bn FID pending', year: 2023, status: 'FID stage' },
            { from: 'Oman', to: 'Germany', deal: 'OmanH2-Germany MoU', value: 'Up to 1 Mt/yr NH3', year: 2023, status: 'MoU signed' },
            { from: 'Saudi Arabia', to: 'South Korea', deal: 'NEOM–POSCO NH3 supply', value: '0.5 Mt/yr by 2030', year: 2023, status: 'Active' },
            { from: 'Chile', to: 'Netherlands', deal: 'HIF–Rotterdam H2 deal', value: 'e-fuels offtake', year: 2022, status: 'Active' },
            { from: 'India', to: 'Japan', deal: 'ACME–JERA NH3 MoU', value: '0.1 Mt/yr', year: 2024, status: 'MoU signed' },
            { from: 'Australia', to: 'South Korea', deal: 'CWP–POSCO Green H2', value: '0.3 Mt/yr H2', year: 2023, status: 'Active' },
            { from: 'Egypt', to: 'EU', deal: 'SCZONE–EU H2 corridor', value: '0.2 Mt/yr target', year: 2024, status: 'Study phase' },
          ].map((d, i) => (
            <div key={i} style={{ background: T.bg, borderRadius: 8, padding: 12, border: `1px solid ${T.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: T.amber }}>{d.from} → {d.to}</span>
                <span style={{ fontSize: 10, color: d.status === 'Active' ? T.green : d.status === 'FID stage' ? T.teal : T.sub, background: d.status === 'Active' ? '#D1FAE5' : d.status === 'FID stage' ? '#CCFBF1' : T.border + '44', borderRadius: 4, padding: '1px 6px' }}>{d.status}</span>
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 2 }}>{d.deal}</div>
              <div style={{ fontSize: 11, color: T.sub }}>{d.value} · {d.year}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 24, background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 14 }}>Infrastructure Gap Analysis — Top 10 Export Markets</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.bg }}>
                {['Country', 'NH3 Export Port', 'Storage Kt', 'VLGC Berths', 'Desalination Need', 'Grid Connection', 'Gap Score', 'Est. Infra Cost $M'].map(h => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.sub, fontWeight: 600, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { country: 'Australia', port: 'Port Hedland/Darwin', storagekt: 120, vlgc: 4, desalination: 'Moderate', grid: 'Strong', gapScore: 2, infraCostM: 450 },
                { country: 'Morocco', port: 'TanTan/Nador', storagekt: 30, vlgc: 1, desalination: 'High', grid: 'Moderate', gapScore: 4, infraCostM: 1200 },
                { country: 'Chile', port: 'Mejillones', storagekt: 50, vlgc: 2, desalination: 'Moderate', grid: 'Moderate', gapScore: 3, infraCostM: 800 },
                { country: 'Oman', port: 'Duqm', storagekt: 80, vlgc: 3, desalination: 'High', grid: 'Strong', gapScore: 3, infraCostM: 700 },
                { country: 'Namibia', port: 'Lüderitz', storagekt: 10, vlgc: 0, desalination: 'High', grid: 'Weak', gapScore: 5, infraCostM: 2000 },
                { country: 'Saudi Arabia', port: 'Yanbu/NEOM', storagekt: 200, vlgc: 6, desalination: 'Full', grid: 'Strong', gapScore: 2, infraCostM: 380 },
                { country: 'India', port: 'Kandla/Mundra', storagekt: 60, vlgc: 2, desalination: 'Moderate', grid: 'Moderate', gapScore: 3, infraCostM: 650 },
                { country: 'Kazakhstan', port: 'Aktau (Caspian)', storagekt: 0, vlgc: 0, desalination: 'Low', grid: 'Limited', gapScore: 5, infraCostM: 2500 },
              ].map((r, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.card : T.bg }}>
                  <td style={{ padding: '7px 10px', fontWeight: 600 }}>{r.country}</td>
                  <td style={{ padding: '7px 10px', color: T.sub }}>{r.port}</td>
                  <td style={{ padding: '7px 10px' }}>{r.storagekt > 0 ? r.storagekt : '—'}</td>
                  <td style={{ padding: '7px 10px' }}>{r.vlgc}</td>
                  <td style={{ padding: '7px 10px', color: r.desalination === 'High' || r.desalination === 'Full' ? T.amber : T.text }}>{r.desalination}</td>
                  <td style={{ padding: '7px 10px', color: r.grid === 'Weak' || r.grid === 'Limited' ? T.red : r.grid === 'Strong' ? T.green : T.amber }}>{r.grid}</td>
                  <td style={{ padding: '7px 10px' }}>
                    <span style={{ background: r.gapScore >= 5 ? '#FEE2E2' : r.gapScore >= 4 ? '#FEF3C7' : '#D1FAE5', color: r.gapScore >= 5 ? T.red : r.gapScore >= 4 ? T.amber : T.green, borderRadius: 4, padding: '2px 8px', fontWeight: 700 }}>{r.gapScore}/5</span>
                  </td>
                  <td style={{ padding: '7px 10px', color: T.text }}>${r.infraCostM.toLocaleString()}M</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: 20, fontSize: 11, color: T.sub, textAlign: 'center' }}>
        EP-EE4 · Sources: IRENA Global Hydrogen Trade Outlook (2023), Hydrogen Council Project Map, IEA Hydrogen Projects Database, Australia Hydrogen Council
      </div>
    </div>
  );
}
