import React, { useState, useMemo } from 'react';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  Cell, ReferenceLine, PieChart, Pie, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, ScatterChart, Scatter
} from 'recharts';

const T = {
  bg: '#f6f4f0', surface: '#ffffff', border: '#e5e0d8', navy: '#1b3a5c',
  navyL: '#2c5a8c', gold: '#c5a96a', textSec: '#5c6b7e', textMut: '#9aa3ae',
  red: '#dc2626', green: '#16a34a', amber: '#d97706', blue: '#2563eb',
  orange: '#ea580c', purple: '#7c3aed', teal: '#0891b2', sage: '#5a8a6a',
  card: '#ffffff', sub: '#5c6b7e', indigo: '#4f46e5', font: "'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono: "'JetBrains Mono','SF Mono','Fira Code',monospace"
};

const TABS = ['EM Carbon Market Map', 'Article 6.2 Tracker', 'ITMO Pricing Intelligence', 'Corresponding Adjustments', 'EM Methodology Challenges', 'Africa Carbon Markets Initiative'];

const BILATERAL_DEALS = [
  { buyer: 'Switzerland', seller: 'Peru', sectors: 'Forestry, RE', itmos: 2.5, price: 18, year: 2020, status: 'Active' },
  { buyer: 'Switzerland', seller: 'Ghana', sectors: 'Clean Cooking', itmos: 1.8, price: 15, year: 2020, status: 'Active' },
  { buyer: 'Switzerland', seller: 'Thailand', sectors: 'EV, Solar', itmos: 0.8, price: 20, year: 2022, status: 'Active' },
  { buyer: 'Switzerland', seller: 'Vanuatu', sectors: 'RE', itmos: 0.3, price: 22, year: 2021, status: 'Active' },
  { buyer: 'Japan', seller: 'Mongolia', sectors: 'RE, EE', itmos: 1.2, price: 12, year: 2021, status: 'Active' },
  { buyer: 'Japan', seller: 'Bangladesh', sectors: 'Solar, Waste', itmos: 0.6, price: 10, year: 2022, status: 'Active' },
  { buyer: 'Japan', seller: 'Kenya', sectors: 'Geothermal', itmos: 0.4, price: 14, year: 2023, status: 'Negotiating' },
  { buyer: 'Singapore', seller: 'Papua New Guinea', sectors: 'REDD+', itmos: 2.0, price: 8, year: 2023, status: 'Active' },
  { buyer: 'Singapore', seller: 'Ghana', sectors: 'Clean Cooking', itmos: 1.0, price: 12, year: 2023, status: 'Active' },
  { buyer: 'Singapore', seller: 'Paraguay', sectors: 'Forestry', itmos: 0.5, price: 10, year: 2024, status: 'Negotiating' },
  { buyer: 'South Korea', seller: 'Peru', sectors: 'RE, Forestry', itmos: 1.5, price: 16, year: 2023, status: 'Negotiating' },
  { buyer: 'Sweden', seller: 'Nepal', sectors: 'Hydropower', itmos: 0.3, price: 25, year: 2024, status: 'Negotiating' },
  { buyer: 'Germany', seller: 'Namibia', sectors: 'Green H2', itmos: 0.8, price: 22, year: 2024, status: 'MOU Signed' },
  { buyer: 'Norway', seller: 'Colombia', sectors: 'REDD+', itmos: 1.2, price: 15, year: 2024, status: 'MOU Signed' },
  { buyer: 'UK', seller: 'Rwanda', sectors: 'Clean Cooking', itmos: 0.4, price: 18, year: 2024, status: 'Negotiating' },
];

const ITMO_PRICING = [
  { type: 'REDD+ (High Integrity)', min: 15, max: 25, avg: 20, volume: 45 },
  { type: 'Clean Cooking', min: 8, max: 18, avg: 13, volume: 30 },
  { type: 'Renewable Energy', min: 5, max: 15, avg: 10, volume: 60 },
  { type: 'Soil Carbon', min: 12, max: 22, avg: 17, volume: 15 },
  { type: 'Afforestation', min: 10, max: 20, avg: 15, volume: 25 },
  { type: 'Methane Avoidance', min: 8, max: 16, avg: 12, volume: 20 },
  { type: 'Blue Carbon', min: 18, max: 30, avg: 24, volume: 5 },
];

const CA_STATUS = [
  { country: 'Switzerland', applying: true, credits: 8.5, framework: 'Full bilateral', notes: 'Most advanced Art 6.2 framework' },
  { country: 'Singapore', applying: true, credits: 4.2, framework: 'Hybrid', notes: 'ITMO + domestic carbon tax' },
  { country: 'Japan', applying: true, credits: 3.5, framework: 'JCM bilateral', notes: 'Joint Crediting Mechanism' },
  { country: 'Ghana', applying: true, credits: 2.8, framework: 'Host country', notes: 'First host to apply CAs' },
  { country: 'Peru', applying: true, credits: 2.5, framework: 'Host country', notes: 'Forestry-focused CAs' },
  { country: 'Thailand', applying: false, credits: 0, framework: 'Under review', notes: 'Evaluating NDC impact' },
  { country: 'Indonesia', applying: false, credits: 0, framework: 'Pending', notes: 'Moratorium on ITMO exports' },
  { country: 'Brazil', applying: false, credits: 0, framework: 'No export', notes: 'Prioritizes domestic market' },
];

const ACMI_DATA = {
  targets: [
    { year: 2024, credits: 25, revenue: 0.5, projects: 180 },
    { year: 2025, credits: 50, revenue: 1.2, projects: 350 },
    { year: 2026, credits: 80, revenue: 2.0, projects: 500 },
    { year: 2027, credits: 120, revenue: 3.5, projects: 700 },
    { year: 2028, credits: 180, revenue: 5.0, projects: 950 },
    { year: 2029, credits: 240, revenue: 7.5, projects: 1200 },
    { year: 2030, credits: 300, revenue: 10.0, projects: 1500 },
  ],
  sectors: [
    { name: 'Clean Cooking', share: 28, credits: 84 },
    { name: 'Forestry/REDD+', share: 22, credits: 66 },
    { name: 'Renewables', share: 18, credits: 54 },
    { name: 'Agriculture', share: 12, credits: 36 },
    { name: 'Mangroves/Blue Carbon', share: 8, credits: 24 },
    { name: 'Waste Management', share: 7, credits: 21 },
    { name: 'Other', share: 5, credits: 15 },
  ],
};

const MRV_CHALLENGES = [
  { challenge: 'MRV Capacity', severity: 'Critical', affectedRegions: 'Sub-Saharan Africa, SE Asia', description: 'Limited monitoring infrastructure and trained personnel for emissions measurement' },
  { challenge: 'Baseline Setting', severity: 'High', affectedRegions: 'All EM', description: 'Data-poor environments make establishing credible baselines difficult' },
  { challenge: 'Regulatory Uncertainty', severity: 'High', affectedRegions: 'LatAm, Africa', description: 'Evolving national regulations create compliance risk for project developers' },
  { challenge: 'Additionality Proof', severity: 'Medium', affectedRegions: 'SE Asia, China', description: 'Demonstrating that reductions would not have occurred without carbon finance' },
  { challenge: 'Permanence Risk', severity: 'High', affectedRegions: 'Amazon, Congo Basin', description: 'Deforestation reversal risk for nature-based solutions in politically unstable areas' },
  { challenge: 'Double Counting', severity: 'Critical', affectedRegions: 'All EM', description: 'Risk of both host country and buyer claiming the same reductions towards NDCs' },
  { challenge: 'Community Benefits', severity: 'Medium', affectedRegions: 'Africa, Pacific Islands', description: 'Ensuring equitable benefit sharing with local and indigenous communities' },
];

const READINESS_SCORES = [
  { country: 'Ghana', regulatory: 75, mrv: 60, institutional: 70, market: 65, overall: 68 },
  { country: 'Kenya', regulatory: 70, mrv: 55, institutional: 65, market: 70, overall: 65 },
  { country: 'Peru', regulatory: 65, mrv: 50, institutional: 60, market: 55, overall: 58 },
  { country: 'Vietnam', regulatory: 60, mrv: 65, institutional: 55, market: 60, overall: 60 },
  { country: 'Colombia', regulatory: 55, mrv: 45, institutional: 50, market: 50, overall: 50 },
  { country: 'Rwanda', regulatory: 70, mrv: 40, institutional: 65, market: 45, overall: 55 },
];

const REFERENCES = [
  { id: 'R1', title: 'UNFCCC Article 6.2 Guidance — CMA.3 Decision', url: '#' },
  { id: 'R2', title: 'ICROA Accreditation Guidelines for Article 6', url: '#' },
  { id: 'R3', title: 'ACMI Roadmap Report — Africa Carbon Markets Initiative 2024', url: '#' },
  { id: 'R4', title: 'World Bank Partnership for Market Readiness (PMR)', url: '#' },
  { id: 'R5', title: 'VCMI Claims Code of Practice v2', url: '#' },
  { id: 'R6', title: 'Gold Standard Article 6 Certification Framework', url: '#' },
];

const card = { background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20, marginTop: 16 };
const badge = (c) => ({ display: 'inline-block', padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: c + '18', color: c });

export default function EmCarbonCreditHubPage() {
  const [tab, setTab] = useState(0);
  const [dealFilter, setDealFilter] = useState('all');
  const [priceAlert, setPriceAlert] = useState(15);

  const filteredDeals = useMemo(() => {
    if (dealFilter === 'all') return BILATERAL_DEALS;
    return BILATERAL_DEALS.filter(d => d.status === dealFilter);
  }, [dealFilter]);

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh' }}>
      <div style={{ background: T.navy, padding: '24px 32px 0', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ color: T.gold, fontFamily: T.mono, fontSize: 11, letterSpacing: 2, marginBottom: 4 }}>EP-CJ3 · EM CARBON CREDIT INTELLIGENCE</div>
            <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: 0 }}>Emerging Market Carbon Credit Intelligence Hub</h1>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>
              Article 6.2 Bilateral Tracker · ITMO Pricing · Corresponding Adjustments · ACMI · MRV Challenges
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {[
              { label: 'Article 6.2 Deals', val: '20+', col: T.blue },
              { label: 'ITMO Range', val: '$5-25/t', col: T.green },
              { label: 'ACMI 2030 Target', val: '300M', col: T.gold },
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

        {/* Tab 0 — EM Carbon Market Map */}
        {tab === 0 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              {[
                { label: 'Active Art 6.2 Agreements', val: '15', col: T.blue },
                { label: 'Total ITMO Volume', val: '15.3 MtCO2', col: T.green },
                { label: 'Countries with CAs', val: '5', col: T.teal },
                { label: 'Avg ITMO Price', val: '$14.8/t', col: T.gold },
              ].map(x => (
                <div key={x.label} style={card}>
                  <div style={{ fontSize: 11, color: T.textMut, textTransform: 'uppercase', letterSpacing: 1 }}>{x.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: x.col, fontFamily: T.mono, marginTop: 4 }}>{x.val}</div>
                </div>
              ))}
            </div>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>EM Credit Volume by Region</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={[
                  { region: 'Sub-Saharan Africa', volume: 45, projects: 320 },
                  { region: 'Southeast Asia', volume: 38, projects: 280 },
                  { region: 'Latin America', volume: 32, projects: 190 },
                  { region: 'South Asia', volume: 18, projects: 140 },
                  { region: 'Pacific Islands', volume: 5, projects: 40 },
                  { region: 'Central Asia', volume: 3, projects: 25 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="region" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="volume" fill={T.green} name="Volume (MtCO2)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="projects" fill={T.blue} name="Active Projects" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Tab 1 — Article 6.2 Tracker */}
        {tab === 1 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {['all', 'Active', 'Negotiating', 'MOU Signed'].map(f => (
                <button key={f} onClick={() => setDealFilter(f)} style={{
                  padding: '5px 14px', borderRadius: 16, border: `2px solid ${dealFilter === f ? T.gold : 'transparent'}`,
                  background: dealFilter === f ? T.gold + '18' : T.surface, color: dealFilter === f ? T.navy : T.textSec,
                  cursor: 'pointer', fontSize: 12, fontWeight: 600, textTransform: 'capitalize'
                }}>{f === 'all' ? 'All Deals' : f}</button>
              ))}
            </div>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>Article 6.2 Bilateral Agreements — Deal Pipeline</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: T.bg }}>
                    {['Buyer', 'Seller', 'Sectors', 'ITMOs (Mt)', 'Price ($/t)', 'Year', 'Status'].map(h => (
                      <th key={h} style={{ padding: '7px 8px', textAlign: 'left', borderBottom: `1px solid ${T.border}`, color: T.textSec }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredDeals.map((d, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '7px 8px', fontWeight: 600 }}>{d.buyer}</td>
                      <td style={{ padding: '7px 8px' }}>{d.seller}</td>
                      <td style={{ padding: '7px 8px', fontSize: 10, color: T.textSec }}>{d.sectors}</td>
                      <td style={{ padding: '7px 8px', fontFamily: T.mono }}>{d.itmos}</td>
                      <td style={{ padding: '7px 8px', fontFamily: T.mono }}>${d.price}</td>
                      <td style={{ padding: '7px 8px' }}>{d.year}</td>
                      <td style={{ padding: '7px 8px' }}>
                        <span style={badge(d.status === 'Active' ? T.green : d.status === 'MOU Signed' ? T.blue : T.amber)}>{d.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2 — ITMO Pricing Intelligence */}
        {tab === 2 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: T.textSec }}>ITMO Price Alert Threshold ($/tCO2):</label>
              <input type="range" min={5} max={30} value={priceAlert} onChange={e => setPriceAlert(+e.target.value)} style={{ flex: 1, maxWidth: 300 }} />
              <span style={{ fontFamily: T.mono, fontSize: 14, color: T.navy, fontWeight: 700 }}>${priceAlert}</span>
            </div>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>ITMO Price Ranges by Project Type ($/tCO2)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ITMO_PRICING} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 11 }} domain={[0, 35]} />
                  <YAxis dataKey="type" type="category" tick={{ fontSize: 10 }} width={130} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="min" fill={T.blue + '60'} name="Min Price" stackId="range" />
                  <Bar dataKey="avg" fill={T.green} name="Avg Price" />
                  <Bar dataKey="max" fill={T.red + '60'} name="Max Price" />
                  <ReferenceLine x={priceAlert} stroke={T.gold} strokeWidth={2} strokeDasharray="5 5" label={{ value: `Alert $${priceAlert}`, fontSize: 10, fill: T.gold }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>ITMO Volume by Type (MtCO2)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={ITMO_PRICING} cx="50%" cy="50%" outerRadius={90} dataKey="volume" nameKey="type"
                    label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}>
                    {[T.green, T.amber, T.blue, T.sage, T.teal, T.orange, T.purple].map((c, i) => <Cell key={i} fill={c} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Tab 3 — Corresponding Adjustments */}
        {tab === 3 && (
          <div style={{ paddingTop: 24 }}>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>Corresponding Adjustment Status by Country</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.bg }}>
                    {['Country', 'Applying CAs', 'Credits (MtCO2)', 'Framework', 'Notes'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', borderBottom: `1px solid ${T.border}`, color: T.textSec }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CA_STATUS.map((c, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '8px 10px', fontWeight: 600 }}>{c.country}</td>
                      <td style={{ padding: '8px 10px' }}>
                        <span style={badge(c.applying ? T.green : T.red)}>{c.applying ? 'Yes' : 'No'}</span>
                      </td>
                      <td style={{ padding: '8px 10px', fontFamily: T.mono }}>{c.credits || '--'}</td>
                      <td style={{ padding: '8px 10px' }}>{c.framework}</td>
                      <td style={{ padding: '8px 10px', fontSize: 11, color: T.textSec }}>{c.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>Impact of CAs on Credit Supply</h3>
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={[
                  { year: 2024, withCA: 80, withoutCA: 120, price_withCA: 18, price_withoutCA: 10 },
                  { year: 2025, withCA: 100, withoutCA: 150, price_withCA: 22, price_withoutCA: 12 },
                  { year: 2026, withCA: 130, withoutCA: 200, price_withCA: 25, price_withoutCA: 13 },
                  { year: 2027, withCA: 160, withoutCA: 260, price_withCA: 30, price_withoutCA: 14 },
                  { year: 2028, withCA: 200, withoutCA: 340, price_withCA: 35, price_withoutCA: 15 },
                  { year: 2030, withCA: 280, withoutCA: 500, price_withCA: 45, price_withoutCA: 16 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} label={{ value: 'Supply (Mt)', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} label={{ value: '$/tCO2', angle: 90, position: 'insideRight', fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="withCA" fill={T.green} name="Supply with CAs" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="left" dataKey="withoutCA" fill={T.blue + '60'} name="Supply without CAs" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="price_withCA" stroke={T.red} strokeWidth={2} name="Price with CAs" />
                  <Line yAxisId="right" type="monotone" dataKey="price_withoutCA" stroke={T.amber} strokeDasharray="5 5" name="Price without CAs" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Tab 4 — EM Methodology Challenges */}
        {tab === 4 && (
          <div style={{ paddingTop: 24 }}>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>EM-Specific Methodology Challenges</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.bg }}>
                    {['Challenge', 'Severity', 'Affected Regions', 'Description'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', borderBottom: `1px solid ${T.border}`, color: T.textSec }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MRV_CHALLENGES.map((c, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '8px 10px', fontWeight: 600 }}>{c.challenge}</td>
                      <td style={{ padding: '8px 10px' }}>
                        <span style={badge(c.severity === 'Critical' ? T.red : c.severity === 'High' ? T.orange : T.amber)}>{c.severity}</span>
                      </td>
                      <td style={{ padding: '8px 10px', fontSize: 11 }}>{c.affectedRegions}</td>
                      <td style={{ padding: '8px 10px', fontSize: 11, color: T.textSec }}>{c.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>Country Readiness Scorecard</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={READINESS_SCORES}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="country" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="regulatory" fill={T.blue} name="Regulatory" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="mrv" fill={T.green} name="MRV Capacity" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="institutional" fill={T.purple} name="Institutional" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="market" fill={T.gold} name="Market Access" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Tab 5 — ACMI */}
        {tab === 5 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {[
                { label: '2030 Credit Target', val: '300M/yr', col: T.green },
                { label: '2030 Revenue Target', val: '$10B/yr', col: T.gold },
                { label: 'Current Pipeline', val: '180 projects', col: T.blue },
              ].map(x => (
                <div key={x.label} style={card}>
                  <div style={{ fontSize: 11, color: T.textMut, textTransform: 'uppercase', letterSpacing: 1 }}>{x.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: x.col, fontFamily: T.mono, marginTop: 4 }}>{x.val}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={card}>
                <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>ACMI Growth Trajectory</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <ComposedChart data={ACMI_DATA.targets}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="credits" fill={T.green} name="Credits (MtCO2)" radius={[4, 4, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="revenue" stroke={T.gold} strokeWidth={2} name="Revenue ($B)" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div style={card}>
                <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>ACMI Sector Breakdown (2030 Target)</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={ACMI_DATA.sectors} cx="50%" cy="50%" outerRadius={90} dataKey="share" nameKey="name"
                      label={({ name, percent }) => `${name.split('/')[0]} ${(percent * 100).toFixed(0)}%`}>
                      {[T.amber, T.green, T.blue, T.sage, T.teal, T.orange, T.textMut].map((c, i) => <Cell key={i} fill={c} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
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
