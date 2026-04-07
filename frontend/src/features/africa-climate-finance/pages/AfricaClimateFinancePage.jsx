import React, { useState, useMemo } from 'react';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  Cell, ReferenceLine, PieChart, Pie, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

const T = {
  bg: '#f6f4f0', surface: '#ffffff', border: '#e5e0d8', navy: '#1b3a5c',
  navyL: '#2c5a8c', gold: '#c5a96a', textSec: '#5c6b7e', textMut: '#9aa3ae',
  red: '#dc2626', green: '#16a34a', amber: '#d97706', blue: '#2563eb',
  orange: '#ea580c', purple: '#7c3aed', teal: '#0891b2', sage: '#5a8a6a',
  card: '#ffffff', sub: '#5c6b7e', indigo: '#4f46e5', font: "'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono: "'JetBrains Mono','SF Mono','Fira Code',monospace"
};

const TABS = ['Continent Overview', 'Electrification Pathways', 'Climate Finance Flows', 'Loss & Damage', 'Adaptation Priority Matrix', 'Green Minerals Opportunity'];

const AFRICA_REGIONS = [
  { region: 'West Africa', population: 430, withoutElectricity: 180, gdp: 0.75, emissions: 0.35, reCapacity: 8, financeReceived: 4.5 },
  { region: 'East Africa', population: 480, withoutElectricity: 200, gdp: 0.38, emissions: 0.18, reCapacity: 12, financeReceived: 5.2 },
  { region: 'Southern Africa', population: 210, withoutElectricity: 80, gdp: 0.45, emissions: 0.48, reCapacity: 15, financeReceived: 6.8 },
  { region: 'Central Africa', population: 200, withoutElectricity: 120, gdp: 0.15, emissions: 0.08, reCapacity: 2, financeReceived: 1.5 },
  { region: 'North Africa', population: 250, withoutElectricity: 20, gdp: 0.62, emissions: 0.42, reCapacity: 18, financeReceived: 8.0 },
];

const ELECTRIFICATION = {
  pathways: [
    { year: 2024, grid: 610, miniGrid: 25, shs: 45, total: 680, target: 1400 },
    { year: 2026, grid: 660, miniGrid: 50, shs: 80, total: 790, target: 1400 },
    { year: 2028, grid: 720, miniGrid: 90, shs: 130, total: 940, target: 1400 },
    { year: 2030, grid: 800, miniGrid: 150, shs: 200, total: 1150, target: 1400 },
    { year: 2035, grid: 920, miniGrid: 250, shs: 230, total: 1400, target: 1400 },
  ],
  economics: [
    { solution: 'Grid Extension', costPerConn: 1800, timeToConnect: '24-48 months', suitability: 'Urban/peri-urban', scalability: 'Medium' },
    { solution: 'Mini-Grid (Solar)', costPerConn: 650, timeToConnect: '6-12 months', suitability: 'Rural clusters', scalability: 'High' },
    { solution: 'Solar Home System', costPerConn: 150, timeToConnect: '1-3 months', suitability: 'Remote dispersed', scalability: 'Very High' },
    { solution: 'Hydro Mini-Grid', costPerConn: 900, timeToConnect: '12-24 months', suitability: 'Near rivers', scalability: 'Low' },
  ],
};

const CLIMATE_FINANCE = {
  flows: [
    { year: 2018, received: 18.5, needed: 200, mitigation: 12.0, adaptation: 6.5, gcf: 2.8 },
    { year: 2019, received: 20.2, needed: 210, mitigation: 13.5, adaptation: 6.7, gcf: 3.1 },
    { year: 2020, received: 22.8, needed: 220, mitigation: 15.0, adaptation: 7.8, gcf: 3.5 },
    { year: 2021, received: 25.5, needed: 230, mitigation: 17.2, adaptation: 8.3, gcf: 4.0 },
    { year: 2022, received: 28.0, needed: 240, mitigation: 18.8, adaptation: 9.2, gcf: 4.5 },
    { year: 2023, received: 30.0, needed: 250, mitigation: 20.0, adaptation: 10.0, gcf: 5.0 },
  ],
  sources: [
    { source: 'MDBs (World Bank, AfDB)', amount: 12.5, share: 42 },
    { source: 'Bilateral (EU, US, UK)', amount: 8.0, share: 27 },
    { source: 'GCF/GEF', amount: 5.0, share: 17 },
    { source: 'Private Sector', amount: 3.0, share: 10 },
    { source: 'Domestic', amount: 1.5, share: 5 },
  ],
};

const LOSS_DAMAGE = {
  events: [
    { event: 'Cyclone Freddy (2023)', region: 'SE Africa', losses: 3.2, deaths: 1434, affected: 2300000, insurance: 0.1 },
    { event: 'Horn of Africa Drought (2022-23)', region: 'East Africa', losses: 8.5, deaths: 4200, affected: 36000000, insurance: 0.3 },
    { event: 'West Africa Floods (2022)', region: 'West Africa', losses: 2.8, deaths: 600, affected: 8000000, insurance: 0.05 },
    { event: 'Madagascar Cyclones (2022)', region: 'Indian Ocean', losses: 1.2, deaths: 200, affected: 1500000, insurance: 0.02 },
    { event: 'South Africa Floods (2022)', region: 'Southern Africa', losses: 3.5, deaths: 459, affected: 400000, insurance: 0.8 },
  ],
  fundStatus: [
    { item: 'COP28 L&D Fund Pledges', value: '$770M', status: 'Pledged', col: T.amber },
    { item: 'Disbursed to Date', value: '$120M', status: 'Active', col: T.green },
    { item: 'Africa Share', value: '~40%', status: 'Expected', col: T.blue },
    { item: 'Parametric Insurance (ARC)', value: '$1.2B coverage', status: 'Active', col: T.teal },
    { item: 'CCRIF Caribbean-Africa', value: '$850M', status: 'Active', col: T.purple },
  ],
};

const ADAPTATION_MATRIX = [
  { sector: 'Agriculture', priority: 95, investmentNeed: 45, currentFinance: 5.2, gap: 39.8, readiness: 'Medium' },
  { sector: 'Water Security', priority: 90, investmentNeed: 35, currentFinance: 4.0, gap: 31.0, readiness: 'Low' },
  { sector: 'Health Systems', priority: 85, investmentNeed: 20, currentFinance: 2.5, gap: 17.5, readiness: 'Low' },
  { sector: 'Infrastructure', priority: 80, investmentNeed: 55, currentFinance: 8.0, gap: 47.0, readiness: 'Medium' },
  { sector: 'Coastal Protection', priority: 75, investmentNeed: 15, currentFinance: 1.8, gap: 13.2, readiness: 'Low' },
  { sector: 'Ecosystems/NbS', priority: 70, investmentNeed: 12, currentFinance: 2.0, gap: 10.0, readiness: 'Medium' },
  { sector: 'Early Warning Systems', priority: 85, investmentNeed: 5, currentFinance: 1.5, gap: 3.5, readiness: 'High' },
  { sector: 'Urban Resilience', priority: 65, investmentNeed: 25, currentFinance: 3.0, gap: 22.0, readiness: 'Low' },
];

const GREEN_MINERALS = [
  { mineral: 'Cobalt', country: 'DRC', globalShare: 73, reserves: '3.5 Mt', use: 'EV batteries', investmentOpp: 25, esgRisk: 'Very High' },
  { mineral: 'Platinum', country: 'South Africa', globalShare: 72, reserves: '63,000 t', use: 'Fuel cells, catalysts', investmentOpp: 15, esgRisk: 'Medium' },
  { mineral: 'Manganese', country: 'South Africa', globalShare: 37, reserves: '640 Mt', use: 'EV batteries, steel', investmentOpp: 8, esgRisk: 'Medium' },
  { mineral: 'Graphite', country: 'Mozambique', globalShare: 12, reserves: '25 Mt', use: 'EV battery anodes', investmentOpp: 12, esgRisk: 'Low' },
  { mineral: 'Bauxite', country: 'Guinea', globalShare: 22, reserves: '7.4 Bt', use: 'Aluminium (solar frames)', investmentOpp: 18, esgRisk: 'High' },
  { mineral: 'Copper', country: 'DRC/Zambia', globalShare: 10, reserves: '105 Mt', use: 'Wiring, electrification', investmentOpp: 20, esgRisk: 'High' },
  { mineral: 'Rare Earths', country: 'Tanzania/SA', globalShare: 3, reserves: '1.2 Mt', use: 'Wind turbine magnets', investmentOpp: 5, esgRisk: 'Medium' },
];

const REFERENCES = [
  { id: 'R1', title: 'AfDB African Economic Outlook 2024', url: '#' },
  { id: 'R2', title: 'IRENA Africa Energy Transition Outlook 2024', url: '#' },
  { id: 'R3', title: 'IEA Africa Energy Outlook 2024', url: '#' },
  { id: 'R4', title: 'UNEP Africa Adaptation Gap Report 2024', url: '#' },
  { id: 'R5', title: 'GCF Results Portfolio — Africa Region', url: '#' },
  { id: 'R6', title: 'IEA Critical Minerals for Clean Energy Transitions', url: '#' },
];

const card = { background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20, marginTop: 16 };
const badge = (c) => ({ display: 'inline-block', padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: c + '18', color: c });

export default function AfricaClimateFinancePage() {
  const [tab, setTab] = useState(0);
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [gapThreshold, setGapThreshold] = useState(10);

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh' }}>
      <div style={{ background: T.navy, padding: '24px 32px 0', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ color: T.gold, fontFamily: T.mono, fontSize: 11, letterSpacing: 2, marginBottom: 4 }}>EP-CJ5 · AFRICA CLIMATE FINANCE & ADAPTATION HUB</div>
            <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: 0 }}>Africa Climate Finance & Adaptation Hub</h1>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>
              Electrification Pathways · Climate Finance · Loss & Damage · Adaptation Matrix · Green Minerals
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {[
              { label: 'Without Electricity', val: '600M', col: T.red },
              { label: 'Finance Gap', val: '$220B/yr', col: T.amber },
              { label: 'Green Minerals', val: '$103B opp', col: T.green },
            ].map(x => (
              <div key={x.label} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 16px', textAlign: 'right' }}>
                <div style={{ color: '#94a3b8', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{x.label}</div>
                <div style={{ color: x.col, fontSize: 18, fontWeight: 700, fontFamily: T.mono }}>{x.val}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 0 }}>
          {TABS.map((t2, i) => (
            <button key={i} onClick={() => setTab(i)} style={{
              padding: '10px 18px', border: 'none', background: 'transparent', cursor: 'pointer',
              color: tab === i ? T.gold : '#94a3b8', fontWeight: tab === i ? 700 : 400, fontSize: 12,
              borderBottom: tab === i ? `2px solid ${T.gold}` : '2px solid transparent'
            }}>{t2}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 32px 32px' }}>

        {/* Tab 0 — Continent Overview */}
        {tab === 0 && (
          <div style={{ paddingTop: 24 }}>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>Regional Comparison Dashboard</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.bg }}>
                    {['Region', 'Population (M)', 'Without Electricity (M)', 'GDP ($T)', 'Emissions (Gt)', 'RE (GW)', 'Finance ($B)'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', borderBottom: `1px solid ${T.border}`, color: T.textSec, fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {AFRICA_REGIONS.map((r, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '8px 10px', fontWeight: 600 }}>{r.region}</td>
                      <td style={{ padding: '8px 10px', fontFamily: T.mono }}>{r.population}</td>
                      <td style={{ padding: '8px 10px', fontFamily: T.mono, color: T.red }}>{r.withoutElectricity}</td>
                      <td style={{ padding: '8px 10px', fontFamily: T.mono }}>{r.gdp}</td>
                      <td style={{ padding: '8px 10px', fontFamily: T.mono }}>{r.emissions}</td>
                      <td style={{ padding: '8px 10px', fontFamily: T.mono }}>{r.reCapacity}</td>
                      <td style={{ padding: '8px 10px', fontFamily: T.mono }}>{r.financeReceived}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>Electrification vs Climate Finance by Region</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={AFRICA_REGIONS}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="region" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="withoutElectricity" fill={T.red} name="Without Electricity (M)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="financeReceived" fill={T.green} name="Finance Received ($B)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Tab 1 — Electrification Pathways */}
        {tab === 1 && (
          <div style={{ paddingTop: 24 }}>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>Electrification Pathway to Universal Access (Millions connected)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={ELECTRIFICATION.pathways}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="grid" stackId="1" fill={T.blue + '60'} stroke={T.blue} name="Grid Extension (M)" />
                  <Area type="monotone" dataKey="miniGrid" stackId="1" fill={T.green + '60'} stroke={T.green} name="Mini-Grid (M)" />
                  <Area type="monotone" dataKey="shs" stackId="1" fill={T.gold + '60'} stroke={T.gold} name="Solar Home Systems (M)" />
                  <Line type="monotone" dataKey="target" stroke={T.red} strokeDasharray="5 5" name="Universal Access Target" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>Solution Economics Comparison</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.bg }}>
                    {['Solution', 'Cost/Connection ($)', 'Time to Connect', 'Suitability', 'Scalability'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: `1px solid ${T.border}`, color: T.textSec }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ELECTRIFICATION.economics.map((e, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>{e.solution}</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.mono }}>${e.costPerConn.toLocaleString()}</td>
                      <td style={{ padding: '8px 12px' }}>{e.timeToConnect}</td>
                      <td style={{ padding: '8px 12px', fontSize: 11, color: T.textSec }}>{e.suitability}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={badge(e.scalability === 'Very High' ? T.green : e.scalability === 'High' ? T.blue : e.scalability === 'Medium' ? T.amber : T.red)}>{e.scalability}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2 — Climate Finance Flows */}
        {tab === 2 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={card}>
                <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>Finance Gap Calculator ($B/yr)</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={CLIMATE_FINANCE.flows}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="received" fill={T.green} name="Received ($B)" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="needed" stroke={T.red} strokeWidth={2} name="Needed ($B)" strokeDasharray="5 5" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div style={card}>
                <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>Finance Sources Breakdown</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={CLIMATE_FINANCE.sources} cx="50%" cy="50%" outerRadius={100} dataKey="share" nameKey="source"
                      label={({ source, share }) => `${source.split(' ')[0]} ${share}%`}>
                      {[T.blue, T.teal, T.green, T.orange, T.purple].map((c, i) => <Cell key={i} fill={c} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>Mitigation vs Adaptation Split</h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={CLIMATE_FINANCE.flows}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="mitigation" stackId="1" fill={T.blue + '60'} stroke={T.blue} name="Mitigation ($B)" />
                  <Area type="monotone" dataKey="adaptation" stackId="1" fill={T.green + '60'} stroke={T.green} name="Adaptation ($B)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Tab 3 — Loss & Damage */}
        {tab === 3 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
              {LOSS_DAMAGE.fundStatus.map(f => (
                <div key={f.item} style={card}>
                  <div style={{ fontSize: 10, color: T.textMut, textTransform: 'uppercase', letterSpacing: 1 }}>{f.item}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: f.col, fontFamily: T.mono, marginTop: 4 }}>{f.value}</div>
                  <span style={badge(f.col)}>{f.status}</span>
                </div>
              ))}
            </div>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>Major Climate Disaster Events</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.bg }}>
                    {['Event', 'Region', 'Losses ($B)', 'Deaths', 'Affected', 'Insurance ($B)'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', borderBottom: `1px solid ${T.border}`, color: T.textSec }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {LOSS_DAMAGE.events.map((e, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '8px 10px', fontWeight: 600 }}>{e.event}</td>
                      <td style={{ padding: '8px 10px' }}>{e.region}</td>
                      <td style={{ padding: '8px 10px', fontFamily: T.mono, color: T.red }}>${e.losses}B</td>
                      <td style={{ padding: '8px 10px', fontFamily: T.mono }}>{e.deaths.toLocaleString()}</td>
                      <td style={{ padding: '8px 10px', fontFamily: T.mono }}>{(e.affected / 1e6).toFixed(1)}M</td>
                      <td style={{ padding: '8px 10px', fontFamily: T.mono, color: e.insurance < 0.5 ? T.red : T.green }}>${e.insurance}B</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4 — Adaptation Priority Matrix */}
        {tab === 4 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: T.textSec }}>Finance Gap Threshold ($B):</label>
              <input type="range" min={1} max={50} value={gapThreshold} onChange={e => setGapThreshold(+e.target.value)} style={{ flex: 1, maxWidth: 300 }} />
              <span style={{ fontFamily: T.mono, fontSize: 13, color: T.navy, fontWeight: 700 }}>${gapThreshold}B</span>
            </div>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>Adaptation Investment Priority Matrix</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.bg }}>
                    {['Sector', 'Priority Score', 'Investment Need ($B)', 'Current Finance ($B)', 'Gap ($B)', 'Readiness'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', borderBottom: `1px solid ${T.border}`, color: T.textSec }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ADAPTATION_MATRIX.filter(a => a.gap >= gapThreshold).map((a, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '8px 10px', fontWeight: 600 }}>{a.sector}</td>
                      <td style={{ padding: '8px 10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 80, height: 8, background: T.border, borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ width: `${a.priority}%`, height: '100%', background: a.priority > 85 ? T.red : a.priority > 70 ? T.amber : T.green, borderRadius: 4 }} />
                          </div>
                          <span style={{ fontFamily: T.mono, fontSize: 11 }}>{a.priority}</span>
                        </div>
                      </td>
                      <td style={{ padding: '8px 10px', fontFamily: T.mono }}>${a.investmentNeed}B</td>
                      <td style={{ padding: '8px 10px', fontFamily: T.mono }}>${a.currentFinance}B</td>
                      <td style={{ padding: '8px 10px', fontFamily: T.mono, color: T.red }}>${a.gap}B</td>
                      <td style={{ padding: '8px 10px' }}>
                        <span style={badge(a.readiness === 'High' ? T.green : a.readiness === 'Medium' ? T.amber : T.red)}>{a.readiness}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>Adaptation Finance Gap by Sector</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={ADAPTATION_MATRIX} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="sector" type="category" tick={{ fontSize: 10 }} width={120} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="currentFinance" fill={T.green} name="Current ($B)" stackId="a" />
                  <Bar dataKey="gap" fill={T.red + '80'} name="Gap ($B)" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Tab 5 — Green Minerals Opportunity */}
        {tab === 5 && (
          <div style={{ paddingTop: 24 }}>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>Africa Green Minerals for Energy Transition</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.bg }}>
                    {['Mineral', 'Country', 'Global Share %', 'Reserves', 'Use Case', 'Opp ($B)', 'ESG Risk'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', borderBottom: `1px solid ${T.border}`, color: T.textSec, fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {GREEN_MINERALS.map((m, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '8px 10px', fontWeight: 600 }}>{m.mineral}</td>
                      <td style={{ padding: '8px 10px' }}>{m.country}</td>
                      <td style={{ padding: '8px 10px', fontFamily: T.mono }}>{m.globalShare}%</td>
                      <td style={{ padding: '8px 10px', fontFamily: T.mono, fontSize: 11 }}>{m.reserves}</td>
                      <td style={{ padding: '8px 10px', fontSize: 11, color: T.textSec }}>{m.use}</td>
                      <td style={{ padding: '8px 10px', fontFamily: T.mono }}>${m.investmentOpp}B</td>
                      <td style={{ padding: '8px 10px' }}>
                        <span style={badge(m.esgRisk === 'Very High' ? T.red : m.esgRisk === 'High' ? T.orange : m.esgRisk === 'Medium' ? T.amber : T.green)}>{m.esgRisk}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>Investment Opportunity by Mineral ($B)</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={GREEN_MINERALS}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="mineral" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="investmentOpp" name="Investment ($B)" radius={[4, 4, 0, 0]}>
                    {GREEN_MINERALS.map((m, i) => <Cell key={i} fill={m.esgRisk === 'Very High' ? T.red : m.esgRisk === 'High' ? T.orange : m.esgRisk === 'Medium' ? T.amber : T.green} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <h3 style={{ margin: '0 0 8px', color: T.navy, fontSize: 15 }}>References</h3>
              {REFERENCES.map(r => (
                <div key={r.id} style={{ fontSize: 12, padding: '4px 0', color: T.textSec }}>
                  <span style={{ fontFamily: T.mono, color: T.navy, marginRight: 8 }}>[{r.id}]</span>{r.title}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
