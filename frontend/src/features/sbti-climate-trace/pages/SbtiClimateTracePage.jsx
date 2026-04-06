import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, ScatterChart, Scatter, ZAxis, Legend, ReferenceLine, Cell,
} from 'recharts';

const T = {
  navy: '#1b3a5c', gold: '#c5a96a', cream: '#f7f4ef',
  teal: '#0f766e', green: '#15803d', red: '#b91c1c',
  amber: '#b45309', purple: '#6d28d9', slate: '#334155',
  font: 'DM Sans, sans-serif', mono: 'JetBrains Mono, monospace',
};

const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

// ── SBTi Registry — 50 companies ─────────────────────────────────────────────
const SECTORS_SBTI = ['Power','Steel','Cement','Chemicals','Transport','Buildings','Agri-Food','Financial','ICT','Retail'];
const SBTI_METHODS = ['Absolute Contraction','Sectoral Decarbonisation','Paris Agreement Capital Transition','1.5°C Absolute','Well-below 2°C Absolute'];
const SBTI_STATUS  = ['Targets Set','Committed','Targets Set','Targets Set','Committed','Removed','Targets Set'];

const SBTI_COMPANIES = Array.from({ length: 50 }, (_, i) => {
  const sector = SECTORS_SBTI[i % 10];
  const method = SBTI_METHODS[i % 5];
  const status = SBTI_STATUS[i % 7];
  const baseYear = 2015 + Math.floor(sr(i) * 5);
  const targetYear = 2030 + Math.floor(sr(i + 50) * 20);
  const scope1Base = 500 + sr(i * 3) * 9500;
  const scope12Base = scope1Base * (1.2 + sr(i * 3 + 1) * 0.8);
  const reductionPct = 30 + sr(i * 3 + 2) * 55;
  const nearTermPct  = reductionPct * (0.4 + sr(i * 4) * 0.3);
  return {
    id: `SBTI-${String(i + 1).padStart(3, '0')}`,
    company: `Company ${String.fromCharCode(65 + i % 26)}${Math.floor(i / 26) + 1}`,
    sector,
    method,
    status,
    baseYear,
    targetYear,
    scope1Base: +scope1Base.toFixed(0),
    scope12Base: +scope12Base.toFixed(0),
    reductionPct: +reductionPct.toFixed(1),
    nearTermPct: +nearTermPct.toFixed(1),
    temp: status === 'Targets Set' ? (sr(i + 100) > 0.6 ? '1.5°C' : 'Well-below 2°C') : '—',
    validated: status === 'Targets Set',
    longTerm: sr(i + 200) > 0.55,
  };
});

// ── Climate TRACE — facility-level emissions by sector ────────────────────────
const CT_SECTORS = [
  { sector: 'Power',           emissions_Mt: 14800, facilities: 82400, sources: ['satellite','ground station','financial proxy'] },
  { sector: 'Transportation',  emissions_Mt: 8100,  facilities: 0,      sources: ['AIS','flight tracking','road model'] },
  { sector: 'Agriculture',     emissions_Mt: 5700,  facilities: 38000, sources: ['remote sensing','livestock model'] },
  { sector: 'Buildings',       emissions_Mt: 2800,  facilities: 1200000,sources: ['building permits','energy model'] },
  { sector: 'Manufacturing',   emissions_Mt: 6200,  facilities: 71000, sources: ['satellite','permit data'] },
  { sector: 'Fossil Fuels',    emissions_Mt: 5400,  facilities: 24000, sources: ['satellite methane','flaring'] },
  { sector: 'Waste',           emissions_Mt: 1600,  facilities: 180000,sources: ['waste model','satellite CH₄'] },
  { sector: 'Shipping',        emissions_Mt: 1100,  facilities: 0,      sources: ['AIS vessel tracking'] },
  { sector: 'Aviation',        emissions_Mt: 920,   facilities: 0,      sources: ['flight data','fuel consumption'] },
  { sector: 'Steel',           emissions_Mt: 2900,  facilities: 1400,  sources: ['satellite','financial proxy'] },
  { sector: 'Cement',          emissions_Mt: 2600,  facilities: 3800,  sources: ['satellite','production data'] },
  { sector: 'Mining',          emissions_Mt: 1100,  facilities: 29000, sources: ['satellite','operations data'] },
];

// ── Sector decarbonisation pathways (2020–2050) ───────────────────────────────
const PATH_YEARS = [2020, 2025, 2030, 2035, 2040, 2045, 2050];
const PATHWAY_DATA = PATH_YEARS.map((yr, yi) => {
  const row = { year: yr };
  SECTORS_SBTI.forEach((s, si) => {
    const startEmit = 100;
    const sbtiPath = startEmit * Math.max(0.05, 1 - (yr - 2020) / 30 * (0.6 + sr(si * 10) * 0.35));
    row[s] = +sbtiPath.toFixed(1);
  });
  return row;
});

const SECTOR_COLORS = ['#0f766e','#b45309','#b91c1c','#6d28d9','#0284c7','#15803d','#dc2626','#9333ea','#0891b2','#d97706'];

const pill = (label, color) => (
  <span style={{ background: color + '22', color, border: `1px solid ${color}44`,
    borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>
    {label}
  </span>
);

const card = (label, value, sub, color = T.navy) => (
  <div style={{ background: '#fff', border: `1px solid ${T.navy}22`, borderRadius: 8,
    padding: '14px 18px', flex: 1, minWidth: 140 }}>
    <div style={{ fontSize: 11, color: T.slate, fontFamily: T.mono, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color, fontFamily: T.mono }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.slate, marginTop: 2 }}>{sub}</div>}
  </div>
);

export default function SbtiClimateTracePage() {
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedSectors, setSelectedSectors] = useState(['Power','Steel','Transport','Buildings']);

  const tabs = ['SBTi Target Registry', 'Climate TRACE Emissions', 'Sector Pathways', 'Data Reference'];

  const filteredSbti = useMemo(() => SBTI_COMPANIES.filter(c => {
    if (search && !c.company.toLowerCase().includes(search.toLowerCase()) && !c.sector.toLowerCase().includes(search.toLowerCase())) return false;
    if (sectorFilter !== 'ALL' && c.sector !== sectorFilter) return false;
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
    return true;
  }), [search, sectorFilter, statusFilter]);

  const sbtiStats = useMemo(() => ({
    total: SBTI_COMPANIES.length,
    set: SBTI_COMPANIES.filter(c => c.status === 'Targets Set').length,
    committed: SBTI_COMPANIES.filter(c => c.status === 'Committed').length,
    removed: SBTI_COMPANIES.filter(c => c.status === 'Removed').length,
    net0: SBTI_COMPANIES.filter(c => c.longTerm).length,
    avgReduction: SBTI_COMPANIES.length > 0 ? +(SBTI_COMPANIES.reduce((s,c)=>s+c.reductionPct,0)/SBTI_COMPANIES.length).toFixed(1) : 0,
  }), []);

  const sectorBreakdown = useMemo(() => SECTORS_SBTI.map(s => ({
    sector: s,
    set: SBTI_COMPANIES.filter(c=>c.sector===s && c.status==='Targets Set').length,
    committed: SBTI_COMPANIES.filter(c=>c.sector===s && c.status==='Committed').length,
  })), []);

  const totalCt = CT_SECTORS.reduce((s, r) => s + r.emissions_Mt, 0);

  const toggleSector = (s) => setSelectedSectors(prev =>
    prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
  );

  const STATUS_COLOR = { 'Targets Set': T.green, 'Committed': T.teal, 'Removed': T.red };

  return (
    <div style={{ fontFamily: T.font, background: T.cream, minHeight: '100vh', padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ background: T.green, color: '#fff', borderRadius: 8, padding: '6px 14px',
          fontFamily: T.mono, fontSize: 12, fontWeight: 700 }}>EP-BG1</div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.navy }}>
          SBTi Registry &amp; Climate TRACE Explorer
        </h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {pill('SBTi v2.0', T.green)}
          {pill('Climate TRACE 2023', T.teal)}
          {pill('50 Companies', T.navy)}
          {pill('12 CT Sectors', T.amber)}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `2px solid ${T.navy}22` }}>
        {tabs.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{
            background: tab === i ? T.green : 'transparent',
            color: tab === i ? '#fff' : T.slate,
            border: 'none', borderRadius: '6px 6px 0 0', padding: '8px 16px',
            fontFamily: T.font, fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>{t}</button>
        ))}
      </div>

      {/* ── Tab 0: SBTi Registry ── */}
      {tab === 0 && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            {card('Total Companies', sbtiStats.total, 'In SBTi registry')}
            {card('Targets Set', sbtiStats.set, 'Validated & active', T.green)}
            {card('Committed', sbtiStats.committed, 'Pledged, not yet validated', T.teal)}
            {card('Net-Zero Pledges', sbtiStats.net0, 'Long-term target filed', T.purple)}
            {card('Avg Near-Term Cut', sbtiStats.avgReduction + '%', 'Scope 1+2 by 2030', T.amber)}
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search company or sector…"
              style={{ padding: '7px 12px', border: `1px solid ${T.navy}33`, borderRadius: 6,
                fontFamily: T.mono, fontSize: 12, width: 240 }} />
            <div style={{ display: 'flex', gap: 4 }}>
              {['ALL', ...SECTORS_SBTI].map(s => (
                <button key={s} onClick={() => setSectorFilter(s)} style={{
                  background: sectorFilter === s ? T.navy : '#fff', color: sectorFilter === s ? '#fff' : T.slate,
                  border: `1px solid ${T.navy}33`, borderRadius: 5, padding: '4px 8px', fontSize: 10, cursor: 'pointer',
                }}>{s}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {['ALL', 'Targets Set', 'Committed', 'Removed'].map(s => (
                <button key={s} onClick={() => setStatusFilter(s)} style={{
                  background: statusFilter === s ? (STATUS_COLOR[s] || T.navy) : '#fff',
                  color: statusFilter === s ? '#fff' : T.slate,
                  border: `1px solid ${(STATUS_COLOR[s] || T.navy)}44`, borderRadius: 5, padding: '4px 9px', fontSize: 11, cursor: 'pointer',
                }}>{s}</button>
              ))}
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${T.navy}22`, overflow: 'hidden', marginBottom: 16 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: T.navy, color: '#fff' }}>
                  {['ID','Company','Sector','Status','Method','Base Yr','Target Yr','Scope 1 Base (kt)','Near-Term Cut','Full-Term Cut','Temp','Net-Zero'].map(h => (
                    <th key={h} style={{ padding: '10px 10px', textAlign: 'left', fontFamily: T.mono, fontSize: 10 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredSbti.map((c, i) => (
                  <tr key={c.id} style={{ background: i % 2 === 0 ? '#fff' : T.cream + '80',
                    borderBottom: `1px solid ${T.navy}11` }}>
                    <td style={{ padding: '8px 10px', fontFamily: T.mono, color: T.slate, fontSize: 10 }}>{c.id}</td>
                    <td style={{ padding: '8px 10px', fontWeight: 600, color: T.navy }}>{c.company}</td>
                    <td style={{ padding: '8px 10px' }}>{pill(c.sector, T.teal)}</td>
                    <td style={{ padding: '8px 10px' }}>{pill(c.status, STATUS_COLOR[c.status] || T.slate)}</td>
                    <td style={{ padding: '8px 10px', fontSize: 10, color: T.slate }}>{c.method}</td>
                    <td style={{ padding: '8px 10px', fontFamily: T.mono }}>{c.baseYear}</td>
                    <td style={{ padding: '8px 10px', fontFamily: T.mono }}>{c.targetYear}</td>
                    <td style={{ padding: '8px 10px', fontFamily: T.mono, textAlign: 'right' }}>{c.scope1Base.toLocaleString()}</td>
                    <td style={{ padding: '8px 10px' }}>{pill(c.nearTermPct.toFixed(1) + '%', T.amber)}</td>
                    <td style={{ padding: '8px 10px' }}>{pill(c.reductionPct.toFixed(1) + '%', T.green)}</td>
                    <td style={{ padding: '8px 10px' }}>{pill(c.temp, c.temp === '1.5°C' ? T.green : T.teal)}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>{c.longTerm ? '✓' : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Sector bar */}
          <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${T.navy}22`, padding: 16 }}>
            <div style={{ fontWeight: 700, color: T.navy, marginBottom: 12 }}>SBTi Adoption by Sector</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={sectorBreakdown}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="sector" tick={{ fontSize: 10, fontFamily: T.mono }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="set" name="Targets Set" fill={T.green} stackId="a" />
                <Bar dataKey="committed" name="Committed" fill={T.teal} stackId="a" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Tab 1: Climate TRACE Emissions ── */}
      {tab === 1 && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            {card('Global GHG (2022)', (totalCt / 1000).toFixed(1) + ' GtCO₂e', 'Climate TRACE estimate')}
            {card('Tracked Facilities', CT_SECTORS.reduce((s,r)=>s+r.facilities,0).toLocaleString(), 'Asset-level monitoring', T.teal)}
            {card('Largest Sector', 'Power 14.8 Gt', '29.3% of total', T.red)}
            {card('Sectors Covered', CT_SECTORS.length, 'Including Agri, Shipping, Aviation', T.navy)}
          </div>

          <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${T.navy}22`, padding: 16, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, color: T.navy, marginBottom: 12 }}>Sector Emissions (MtCO₂e) — Climate TRACE 2022</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={[...CT_SECTORS].sort((a,b)=>b.emissions_Mt-a.emissions_Mt)} layout="vertical" margin={{ left: 120 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => (v/1000).toFixed(1)+'Gt'} />
                <YAxis type="category" dataKey="sector" tick={{ fontSize: 11, fontFamily: T.mono }} width={120} />
                <Tooltip formatter={v => [(v/1000).toFixed(2)+' GtCO₂e', 'Emissions']} />
                <Bar dataKey="emissions_Mt" radius={[0,4,4,0]}>
                  {[...CT_SECTORS].sort((a,b)=>b.emissions_Mt-a.emissions_Mt).map((_, i) => (
                    <Cell key={i} fill={SECTOR_COLORS[i % SECTOR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${T.navy}22`, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.navy, color: '#fff' }}>
                  {['Sector','Emissions (MtCO₂e)','Share of Total','Tracked Facilities','Data Sources','Ingester Status'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontFamily: T.mono, fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CT_SECTORS.sort((a,b)=>b.emissions_Mt-a.emissions_Mt).map((s, i) => (
                  <tr key={s.sector} style={{ background: i % 2 === 0 ? '#fff' : T.cream + '80',
                    borderBottom: `1px solid ${T.navy}11` }}>
                    <td style={{ padding: '9px 12px', fontWeight: 600, color: T.navy }}>{s.sector}</td>
                    <td style={{ padding: '9px 12px', fontFamily: T.mono, textAlign: 'right' }}>{s.emissions_Mt.toLocaleString()}</td>
                    <td style={{ padding: '9px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, background: T.navy + '22', borderRadius: 4, height: 6 }}>
                          <div style={{ width: (s.emissions_Mt / totalCt * 100) + '%',
                            background: SECTOR_COLORS[i % SECTOR_COLORS.length], height: '100%', borderRadius: 4 }} />
                        </div>
                        <span style={{ fontFamily: T.mono, fontSize: 11 }}>{(s.emissions_Mt / totalCt * 100).toFixed(1)}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '9px 12px', fontFamily: T.mono, textAlign: 'right' }}>{s.facilities.toLocaleString()}</td>
                    <td style={{ padding: '9px 12px', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {s.sources.map(src => (
                        <span key={src} style={{ background: T.teal+'15', color: T.teal, fontSize: 9,
                          borderRadius: 3, padding: '1px 5px', fontFamily: T.mono }}>{src}</span>
                      ))}
                    </td>
                    <td style={{ padding: '9px 12px' }}>
                      {pill(i === 0 ? 'FAILED — No Data' : 'Active', i === 0 ? T.red : T.green)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab 2: Sector Pathways ── */}
      {tab === 2 && (
        <div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {SECTORS_SBTI.map((s, i) => (
              <button key={s} onClick={() => toggleSector(s)} style={{
                background: selectedSectors.includes(s) ? SECTOR_COLORS[i] : '#fff',
                color: selectedSectors.includes(s) ? '#fff' : T.slate,
                border: `1px solid ${SECTOR_COLORS[i]}`,
                borderRadius: 16, padding: '3px 10px', fontSize: 11,
                fontFamily: T.mono, cursor: 'pointer',
              }}>{s}</button>
            ))}
          </div>

          <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${T.navy}22`, padding: 16, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, color: T.navy, marginBottom: 4 }}>
              SBTi Sector Decarbonisation Pathways 2020–2050 (Indexed, 2020=100)
            </div>
            <div style={{ fontSize: 12, color: T.slate, marginBottom: 12 }}>
              Based on SBTi Sectoral Decarbonisation Approach (SDA) and Absolute Contraction trajectories
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={PATHWAY_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 11, fontFamily: T.mono }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => v + '%'} domain={[0, 110]} />
                <Tooltip formatter={(v, n) => [v + '%', n]} />
                <Legend />
                <ReferenceLine y={50} stroke={T.amber} strokeDasharray="4 2" label={{ value: '50% cut', fontSize: 10, fill: T.amber }} />
                <ReferenceLine y={10} stroke={T.red} strokeDasharray="4 2" label={{ value: 'Net-Zero', fontSize: 10, fill: T.red }} />
                {SECTORS_SBTI.filter(s => selectedSectors.includes(s)).map((s, i) => (
                  <Line key={s} type="monotone" dataKey={s}
                    stroke={SECTOR_COLORS[SECTORS_SBTI.indexOf(s)]} strokeWidth={2} dot={{ r: 4 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
            {SECTORS_SBTI.map((s, i) => {
              const end = PATHWAY_DATA[PATHWAY_DATA.length - 1][s];
              const mid = PATHWAY_DATA[3][s];
              return (
                <div key={s} style={{ background: '#fff', borderRadius: 8,
                  border: `2px solid ${SECTOR_COLORS[i]}33`, padding: 12 }}>
                  <div style={{ fontWeight: 700, color: SECTOR_COLORS[i], fontSize: 12, marginBottom: 6 }}>{s}</div>
                  <div style={{ fontSize: 11, color: T.slate }}>2035 level: <strong>{mid.toFixed(0)}%</strong></div>
                  <div style={{ fontSize: 11, color: T.slate }}>2050 level: <strong style={{ color: end < 20 ? T.green : T.amber }}>{end.toFixed(0)}%</strong></div>
                  <div style={{ fontSize: 11, color: T.slate }}>Cut: {pill((100-end).toFixed(0)+'%', SECTOR_COLORS[i])}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Tab 3: Data Reference ── */}
      {tab === 3 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[
            {
              title: 'SBTi — Science Based Targets initiative', color: T.green,
              items: [
                'Near-term targets: 5–10 year Scope 1+2+3 reductions (≥4.2%/yr for 1.5°C)',
                'Long-term (Net-Zero): residual emissions ≤5–10% of base-year',
                'Validation: SBTi Technical team reviews methodology alignment',
                'Methods: Absolute Contraction (AC), SDA, Paris Agreement Capital Transition (PACTA)',
                'SBTi v2.0: mandatory Scope 3 for high-impact sectors (steel, cement, transport)',
                'Removal: targets removed if company exceeds 3-year trajectory by >5%',
              ],
            },
            {
              title: 'Climate TRACE — Tracking Real-time Atmospheric Carbon Emissions', color: T.teal,
              items: [
                'Coalition: WattTime, Google, Carbon Tracker, CarbonPlan and 10+ partners',
                'Methodology: satellite remote sensing + machine learning + ground truth validation',
                'Coverage: 352M+ individual emission sources (facilities, vessels, aircraft)',
                'Asset-level resolution: GPS coordinates, operator, activity type',
                'Temporal: annual inventory (2015–2022), monthly for power sector',
                'GHG: CO₂, CH₄, N₂O, F-gases in CO₂e (GWP100 AR6)',
                'API: api.climatetrace.org — JSON, GeoJSON output',
              ],
            },
            {
              title: 'SBTi Sectoral Decarbonisation Approach (SDA)', color: T.amber,
              items: [
                'Allocates carbon budget per sector based on technology feasibility',
                'Intensity targets (per unit of activity): tCO₂/MWh, tCO₂/t steel',
                'Sectors: power, iron & steel, cement, pulp & paper, buildings, transport',
                'Power sector: IEA NZE 2050 trajectory (near-zero grid by 2035 developed)',
                'Steel SDA: 35% intensity reduction by 2030 vs 2018 baseline',
                'Pathway convergence: all sectors reach residual by 2050',
              ],
            },
            {
              title: 'Data Pipeline — SBTi & Climate TRACE Ingesters', color: T.navy,
              items: [
                'SbtiIngester: weekly Monday 03:00 — scrapes SBTi Companies dashboard API',
                'Stores: company, country, sector, status, near_term_target, long_term_target',
                'ClimateTraceIngester: monthly 1st 02:00 — REST API api.climatetrace.org/v4/emissions',
                'Filters: year=2022, gas=co2e100, resolution=sector (+ facility for top 10k)',
                'Target tables: sbti_targets (9,312 rows), climate_trace_emit (currently 0 — ingester failed)',
                'Failure mode: Climate TRACE API v4 auth token expired — renew via dashboard',
              ],
            },
          ].map(item => (
            <div key={item.title} style={{ background: '#fff', borderRadius: 10,
              border: `2px solid ${item.color}33`, padding: 16 }}>
              <div style={{ fontWeight: 800, color: item.color, fontSize: 13, marginBottom: 10 }}>{item.title}</div>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {item.items.map((s, i) => (
                  <li key={i} style={{ fontSize: 11, color: T.slate, marginBottom: 5, lineHeight: 1.5 }}>{s}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
