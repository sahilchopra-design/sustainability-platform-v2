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
  font: "'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono: "'JetBrains Mono','SF Mono','Fira Code',monospace"
};

const TABS = ['SIDS Vulnerability Index', 'Pacific Islands Climate Exposure', 'Caribbean Hurricane Risk Finance', 'Climate Debt Sustainability', 'Sovereign Parametric Insurance', 'Blue Economy Opportunity'];

const SIDS_DATA = [
  { nation: 'Tuvalu', population: 11200, seaLevelRisk: 98, gdp: 0.06, debtGDP: 12, coralDep: 85, v20: true, hdi: 0.641 },
  { nation: 'Kiribati', population: 119000, seaLevelRisk: 96, gdp: 0.22, debtGDP: 18, coralDep: 80, v20: true, hdi: 0.624 },
  { nation: 'Marshall Islands', population: 59000, seaLevelRisk: 95, gdp: 0.27, debtGDP: 25, coralDep: 75, v20: true, hdi: 0.639 },
  { nation: 'Maldives', population: 521000, seaLevelRisk: 92, gdp: 6.0, debtGDP: 115, coralDep: 90, v20: true, hdi: 0.747 },
  { nation: 'Fiji', population: 936000, seaLevelRisk: 78, gdp: 5.1, debtGDP: 82, coralDep: 60, v20: true, hdi: 0.730 },
  { nation: 'Vanuatu', population: 314000, seaLevelRisk: 85, gdp: 0.95, debtGDP: 45, coralDep: 55, v20: true, hdi: 0.607 },
  { nation: 'Barbados', population: 281000, seaLevelRisk: 65, gdp: 5.6, debtGDP: 120, coralDep: 40, v20: false, hdi: 0.790 },
  { nation: 'Belize', population: 405000, seaLevelRisk: 70, gdp: 2.4, debtGDP: 62, coralDep: 45, v20: false, hdi: 0.683 },
  { nation: 'Samoa', population: 219000, seaLevelRisk: 80, gdp: 0.83, debtGDP: 48, coralDep: 50, v20: true, hdi: 0.707 },
  { nation: 'Tonga', population: 106000, seaLevelRisk: 82, gdp: 0.50, debtGDP: 42, coralDep: 55, v20: true, hdi: 0.717 },
  { nation: 'Antigua & Barbuda', population: 93000, seaLevelRisk: 60, gdp: 1.6, debtGDP: 95, coralDep: 35, v20: false, hdi: 0.778 },
  { nation: 'Grenada', population: 113000, seaLevelRisk: 62, gdp: 1.2, debtGDP: 68, coralDep: 30, v20: false, hdi: 0.795 },
];

const PACIFIC_EXPOSURE = [
  { nation: 'Tuvalu', slr_1m: 100, slr_05m: 80, cyclone: 65, drought: 45, adaptation: 'Planned relocation', cost: 0.3 },
  { nation: 'Kiribati', slr_1m: 95, slr_05m: 75, cyclone: 50, drought: 60, adaptation: 'Land purchase (Fiji)', cost: 0.5 },
  { nation: 'Marshall Islands', slr_1m: 90, slr_05m: 70, cyclone: 55, drought: 40, adaptation: 'Compact of Free Association', cost: 0.8 },
  { nation: 'Fiji', slr_1m: 45, slr_05m: 25, cyclone: 85, drought: 30, adaptation: 'Managed retreat policy', cost: 2.5 },
  { nation: 'Vanuatu', slr_1m: 50, slr_05m: 30, cyclone: 90, drought: 35, adaptation: 'ICJ advisory opinion', cost: 1.2 },
  { nation: 'Samoa', slr_1m: 40, slr_05m: 22, cyclone: 80, drought: 25, adaptation: 'Village relocation', cost: 0.6 },
  { nation: 'Tonga', slr_1m: 42, slr_05m: 24, cyclone: 75, drought: 30, adaptation: 'Early warning systems', cost: 0.4 },
];

const CARIBBEAN_HURRICANE = [
  { category: 'Cat 1', windSpeed: '119-153 km/h', avgLoss: 0.5, frequency: 8.2, insurancePenetration: 35 },
  { category: 'Cat 2', windSpeed: '154-177 km/h', avgLoss: 1.5, frequency: 4.5, insurancePenetration: 28 },
  { category: 'Cat 3', windSpeed: '178-208 km/h', avgLoss: 5.0, frequency: 2.8, insurancePenetration: 22 },
  { category: 'Cat 4', windSpeed: '209-251 km/h', avgLoss: 15.0, frequency: 1.2, insurancePenetration: 15 },
  { category: 'Cat 5', windSpeed: '252+ km/h', avgLoss: 40.0, frequency: 0.4, insurancePenetration: 8 },
];

const CCRIF_DATA = [
  { year: 2019, coverage: 850, payouts: 12.5, members: 19, claims: 8 },
  { year: 2020, coverage: 900, payouts: 24.0, members: 21, claims: 12 },
  { year: 2021, coverage: 950, payouts: 8.5, members: 22, claims: 5 },
  { year: 2022, coverage: 1000, payouts: 18.0, members: 23, claims: 9 },
  { year: 2023, coverage: 1050, payouts: 32.0, members: 24, claims: 11 },
  { year: 2024, coverage: 1100, payouts: 15.0, members: 25, claims: 7 },
];

const DEBT_SWAPS = [
  { country: 'Belize', year: 2021, debtRestructured: 553, conservationPledge: 180, instrument: 'TNC Blue Bond', marineArea: '30% of ocean', savings: 12 },
  { country: 'Ecuador', year: 2023, debtRestructured: 1628, conservationPledge: 450, instrument: 'Debt-for-Nature', marineArea: 'Galapagos expansion', savings: 18 },
  { country: 'Barbados', year: 2022, debtRestructured: 150, conservationPledge: 50, instrument: 'Blue Bond', marineArea: '30% by 2030', savings: 3.5 },
  { country: 'Cabo Verde', year: 2024, debtRestructured: 200, conservationPledge: 65, instrument: 'Climate Swap', marineArea: 'EEZ protection', savings: 4.0 },
  { country: 'Seychelles', year: 2018, debtRestructured: 21.6, conservationPledge: 12, instrument: 'Blue Bond (first)', marineArea: '30% marine', savings: 2.8 },
];

const PARAMETRIC_INSURANCE = [
  { scheme: 'ARC (African Risk Capacity)', type: 'Drought/Flood', coverage: 1.2, members: 35, trigger: 'Rainfall index', payoutSpeed: '2-4 weeks', premiumRange: '1.5-4%' },
  { scheme: 'CCRIF SPC', type: 'Hurricane/EQ/Rainfall', coverage: 1.1, members: 25, trigger: 'Windspeed/Rain model', payoutSpeed: '14 days', premiumRange: '2-5%' },
  { scheme: 'PCRIC', type: 'Cyclone/EQ/Tsunami', coverage: 0.45, members: 8, trigger: 'Parametric model', payoutSpeed: '7-14 days', premiumRange: '2-6%' },
  { scheme: 'SEADRIF', type: 'Flood', coverage: 0.15, members: 5, trigger: 'Rainfall/flood model', payoutSpeed: '14 days', premiumRange: '3-7%' },
];

const BLUE_ECONOMY = [
  { sector: 'Sustainable Fisheries', value: 12.5, growth: 4.2, sidsShare: 15, potential: 'High' },
  { sector: 'Marine Tourism', value: 35.0, growth: 6.8, sidsShare: 45, potential: 'Very High' },
  { sector: 'Blue Carbon (Mangroves)', value: 2.5, growth: 15.0, sidsShare: 8, potential: 'Very High' },
  { sector: 'Aquaculture', value: 8.0, growth: 7.5, sidsShare: 5, potential: 'High' },
  { sector: 'Ocean Energy', value: 1.2, growth: 22.0, sidsShare: 2, potential: 'Medium' },
  { sector: 'Marine Biotechnology', value: 0.8, growth: 18.0, sidsShare: 1, potential: 'Medium' },
  { sector: 'Shipping & Ports', value: 15.0, growth: 3.5, sidsShare: 12, potential: 'Medium' },
];

const REFERENCES = [
  { id: 'R1', title: 'UNDP Human Development Index — SIDS Report 2024', url: '#' },
  { id: 'R2', title: 'World Bank SIDS Climate & Disaster Risk Finance', url: '#' },
  { id: 'R3', title: 'AOSIS Negotiating Position — COP28 Loss & Damage', url: '#' },
  { id: 'R4', title: 'IMF Climate Debt Sustainability Assessment Framework', url: '#' },
  { id: 'R5', title: 'CCRIF SPC Annual Report 2024', url: '#' },
  { id: 'R6', title: 'World Bank Blue Economy Report — SIDS', url: '#' },
];

const card = { background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20, marginTop: 16 };
const badge = (c) => ({ display: 'inline-block', padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: c + '18', color: c });

export default function FrontierMarketClimatePage() {
  const [tab, setTab] = useState(0);
  const [slrScenario, setSlrScenario] = useState('slr_05m');
  const [vulnerabilitySortBy, setVulnerabilitySortBy] = useState('seaLevelRisk');
  const [debtSwapMin, setDebtSwapMin] = useState(0);

  const sortedSids = useMemo(() =>
    [...SIDS_DATA].sort((a, b) => b[vulnerabilitySortBy] - a[vulnerabilitySortBy]),
    [vulnerabilitySortBy]
  );

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh' }}>
      <div style={{ background: T.navy, padding: '24px 32px 0', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ color: T.gold, fontFamily: T.mono, fontSize: 11, letterSpacing: 2, marginBottom: 4 }}>EP-CJ6 · FRONTIER & SIDS CLIMATE RISK</div>
            <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: 0 }}>Frontier Market & Small Island Climate Risk Intelligence</h1>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>
              SIDS Vulnerability · Pacific Exposure · Caribbean Hurricane Finance · Climate Debt · Parametric Insurance · Blue Economy
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {[
              { label: 'SIDS Nations', val: '39', col: T.blue },
              { label: 'V20 Members', val: '58', col: T.red },
              { label: 'Blue Economy', val: '$75B', col: T.teal },
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

        {/* Tab 0 — SIDS Vulnerability Index */}
        {tab === 0 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: T.textSec }}>Sort by:</label>
              {[
                { key: 'seaLevelRisk', label: 'Sea Level Risk' },
                { key: 'debtGDP', label: 'Debt/GDP' },
                { key: 'coralDep', label: 'Coral Dependency' },
                { key: 'hdi', label: 'HDI' },
              ].map(s => (
                <button key={s.key} onClick={() => setVulnerabilitySortBy(s.key)} style={{
                  padding: '5px 12px', borderRadius: 16, border: `2px solid ${vulnerabilitySortBy === s.key ? T.gold : 'transparent'}`,
                  background: vulnerabilitySortBy === s.key ? T.gold + '18' : T.surface, color: vulnerabilitySortBy === s.key ? T.navy : T.textSec,
                  cursor: 'pointer', fontSize: 11, fontWeight: 600
                }}>{s.label}</button>
              ))}
            </div>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>SIDS Vulnerability Comparator</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: T.bg }}>
                    {['Nation', 'Pop.', 'SLR Risk', 'GDP ($B)', 'Debt/GDP %', 'Coral Dep.', 'V20', 'HDI'].map(h => (
                      <th key={h} style={{ padding: '7px 8px', textAlign: 'left', borderBottom: `1px solid ${T.border}`, color: T.textSec }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedSids.map((s, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '7px 8px', fontWeight: 600 }}>{s.nation}</td>
                      <td style={{ padding: '7px 8px', fontFamily: T.mono }}>{(s.population / 1000).toFixed(0)}K</td>
                      <td style={{ padding: '7px 8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 50, height: 6, background: T.border, borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ width: `${s.seaLevelRisk}%`, height: '100%', background: s.seaLevelRisk > 85 ? T.red : s.seaLevelRisk > 70 ? T.orange : T.amber, borderRadius: 3 }} />
                          </div>
                          <span style={{ fontFamily: T.mono, fontSize: 10 }}>{s.seaLevelRisk}</span>
                        </div>
                      </td>
                      <td style={{ padding: '7px 8px', fontFamily: T.mono }}>{s.gdp}</td>
                      <td style={{ padding: '7px 8px', fontFamily: T.mono, color: s.debtGDP > 80 ? T.red : T.textSec }}>{s.debtGDP}%</td>
                      <td style={{ padding: '7px 8px', fontFamily: T.mono }}>{s.coralDep}%</td>
                      <td style={{ padding: '7px 8px' }}><span style={badge(s.v20 ? T.red : T.textMut)}>{s.v20 ? 'Yes' : 'No'}</span></td>
                      <td style={{ padding: '7px 8px', fontFamily: T.mono }}>{s.hdi}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 1 — Pacific Islands Climate Exposure */}
        {tab === 1 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {[
                { key: 'slr_05m', label: '0.5m SLR', col: T.amber },
                { key: 'slr_1m', label: '1.0m SLR', col: T.red },
              ].map(s => (
                <button key={s.key} onClick={() => setSlrScenario(s.key)} style={{
                  padding: '5px 14px', borderRadius: 16, border: `2px solid ${slrScenario === s.key ? s.col : 'transparent'}`,
                  background: slrScenario === s.key ? s.col + '18' : T.surface, color: slrScenario === s.key ? s.col : T.textSec,
                  cursor: 'pointer', fontSize: 12, fontWeight: 600
                }}>{s.label}</button>
              ))}
            </div>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>Pacific Islands — Land Loss & Hazard Exposure (%)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={PACIFIC_EXPOSURE}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="nation" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey={slrScenario} fill={slrScenario === 'slr_1m' ? T.red : T.amber} name={slrScenario === 'slr_1m' ? 'Land Loss @ 1m SLR' : 'Land Loss @ 0.5m SLR'} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cyclone" fill={T.purple} name="Cyclone Exposure" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="drought" fill={T.orange} name="Drought Exposure" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>Adaptation Strategies & Cost</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.bg }}>
                    {['Nation', 'Strategy', 'Estimated Cost ($B)', 'SLR @1m Land Loss %'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: `1px solid ${T.border}`, color: T.textSec }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PACIFIC_EXPOSURE.map((p, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>{p.nation}</td>
                      <td style={{ padding: '8px 12px', fontSize: 11, color: T.textSec }}>{p.adaptation}</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.mono }}>${p.cost}B</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.mono, color: p.slr_1m > 80 ? T.red : T.amber }}>{p.slr_1m}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2 — Caribbean Hurricane Risk Finance */}
        {tab === 2 && (
          <div style={{ paddingTop: 24 }}>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>Hurricane Category — Loss & Insurance Gap</h3>
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={CARIBBEAN_HURRICANE}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} domain={[0, 50]} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="avgLoss" fill={T.red} name="Avg Loss ($B)" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="insurancePenetration" stroke={T.green} strokeWidth={2} name="Insurance Penetration %" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>CCRIF SPC Performance</h3>
              <ResponsiveContainer width="100%" height={250}>
                <ComposedChart data={CCRIF_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="payouts" fill={T.teal} name="Payouts ($M)" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="members" stroke={T.gold} strokeWidth={2} name="Members" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>Insurance Coverage Gap Calculator</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={CARIBBEAN_HURRICANE}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="insurancePenetration" name="Insured %" fill={T.green} radius={[4, 4, 0, 0]}>
                    {CARIBBEAN_HURRICANE.map((h, i) => <Cell key={i} fill={h.insurancePenetration > 25 ? T.green : h.insurancePenetration > 15 ? T.amber : T.red} />)}
                  </Bar>
                  <ReferenceLine y={50} stroke={T.blue} strokeDasharray="5 5" label={{ value: 'Adequate coverage', fontSize: 10, fill: T.blue }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Tab 3 — Climate Debt Sustainability */}
        {tab === 3 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: T.textSec }}>Min. Debt Restructured ($M):</label>
              <input type="range" min={0} max={1500} step={50} value={debtSwapMin} onChange={e => setDebtSwapMin(+e.target.value)} style={{ flex: 1, maxWidth: 300 }} />
              <span style={{ fontFamily: T.mono, fontSize: 13, color: T.navy, fontWeight: 700 }}>${debtSwapMin}M</span>
            </div>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>Debt-for-Climate Swap Modeler</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.bg }}>
                    {['Country', 'Year', 'Debt Restructured ($M)', 'Conservation Pledge ($M)', 'Instrument', 'Marine Commitment', 'Savings ($M/yr)'].map(h => (
                      <th key={h} style={{ padding: '8px 8px', textAlign: 'left', borderBottom: `1px solid ${T.border}`, color: T.textSec, fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DEBT_SWAPS.filter(d => d.debtRestructured >= debtSwapMin).map((d, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '8px 8px', fontWeight: 600 }}>{d.country}</td>
                      <td style={{ padding: '8px 8px' }}>{d.year}</td>
                      <td style={{ padding: '8px 8px', fontFamily: T.mono }}>${d.debtRestructured}M</td>
                      <td style={{ padding: '8px 8px', fontFamily: T.mono, color: T.green }}>${d.conservationPledge}M</td>
                      <td style={{ padding: '8px 8px' }}><span style={badge(T.blue)}>{d.instrument}</span></td>
                      <td style={{ padding: '8px 8px', fontSize: 11, color: T.textSec }}>{d.marineArea}</td>
                      <td style={{ padding: '8px 8px', fontFamily: T.mono }}>${d.savings}M</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>SIDS Debt/GDP vs Climate Vulnerability</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={SIDS_DATA.filter(s => s.debtGDP > 40).sort((a, b) => b.debtGDP - a.debtGDP)}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="nation" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="debtGDP" fill={T.red} name="Debt/GDP %" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="seaLevelRisk" fill={T.blue} name="SLR Risk Score" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Tab 4 — Sovereign Parametric Insurance */}
        {tab === 4 && (
          <div style={{ paddingTop: 24 }}>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>Sovereign Parametric Insurance Schemes</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.bg }}>
                    {['Scheme', 'Type', 'Coverage ($B)', 'Members', 'Trigger', 'Payout Speed', 'Premium'].map(h => (
                      <th key={h} style={{ padding: '8px 8px', textAlign: 'left', borderBottom: `1px solid ${T.border}`, color: T.textSec, fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PARAMETRIC_INSURANCE.map((p, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '8px 8px', fontWeight: 600 }}>{p.scheme}</td>
                      <td style={{ padding: '8px 8px', fontSize: 11 }}>{p.type}</td>
                      <td style={{ padding: '8px 8px', fontFamily: T.mono }}>${p.coverage}B</td>
                      <td style={{ padding: '8px 8px', fontFamily: T.mono }}>{p.members}</td>
                      <td style={{ padding: '8px 8px', fontSize: 11, color: T.textSec }}>{p.trigger}</td>
                      <td style={{ padding: '8px 8px' }}><span style={badge(T.green)}>{p.payoutSpeed}</span></td>
                      <td style={{ padding: '8px 8px', fontFamily: T.mono }}>{p.premiumRange}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>Coverage vs Gap Analysis</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={PARAMETRIC_INSURANCE}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="scheme" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="coverage" fill={T.green} name="Coverage ($B)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="members" fill={T.blue} name="Members" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Tab 5 — Blue Economy Opportunity */}
        {tab === 5 && (
          <div style={{ paddingTop: 24 }}>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>Blue Economy Sectors for SIDS</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.bg }}>
                    {['Sector', 'Global Value ($B)', 'Growth %/yr', 'SIDS Share %', 'Potential'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: `1px solid ${T.border}`, color: T.textSec }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {BLUE_ECONOMY.map((b, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>{b.sector}</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.mono }}>${b.value}B</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.mono, color: b.growth > 10 ? T.green : T.textSec }}>{b.growth}%</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.mono }}>{b.sidsShare}%</td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={badge(b.potential === 'Very High' ? T.green : b.potential === 'High' ? T.blue : T.amber)}>{b.potential}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={card}>
                <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>Blue Economy Value Distribution</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={BLUE_ECONOMY} cx="50%" cy="50%" outerRadius={95} dataKey="value" nameKey="sector"
                      label={({ sector, percent }) => `${sector.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}>
                      {[T.blue, T.teal, T.green, T.sage, T.purple, T.orange, T.amber].map((c, i) => <Cell key={i} fill={c} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={card}>
                <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>Growth Rate by Sector (%/yr)</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={BLUE_ECONOMY.sort((a, b) => b.growth - a.growth)}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="sector" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="growth" name="Growth %/yr" radius={[4, 4, 0, 0]}>
                      {BLUE_ECONOMY.map((b, i) => <Cell key={i} fill={b.growth > 15 ? T.green : b.growth > 5 ? T.blue : T.amber} />)}
                    </Bar>
                  </BarChart>
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
