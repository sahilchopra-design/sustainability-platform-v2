import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const T = {
  bg: '#f6f4f0', surface: '#ffffff', border: '#e5e0d8', navy: '#1b3a5c',
  navyL: '#2c5a8c', gold: '#c5a96a', textSec: '#5c6b7e', textMut: '#9aa3ae',
  red: '#dc2626', green: '#16a34a', amber: '#d97706', blue: '#2563eb',
  orange: '#ea580c', purple: '#7c3aed', teal: '#0891b2', sage: '#5a8a6a',
  card: '#ffffff', sub: '#5c6b7e', indigo: '#4f46e5', font: "'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono: "'JetBrains Mono','SF Mono','Fira Code',monospace"
};

const INSTRUMENTS = [
  { id: 'GB001', name: 'European Investment Bank Green Bond', issuer: 'EIB', type: 'Green Bond', isin: 'XS2448762415', issue: '2022-03', maturity: '2032-03', face_value: 2500, coupon: 1.25, greenium: -8.2, label: 'EU GBS', review: 'Second Opinion', taxonomy_aligned: 78, taxonomy_eligible: 95, paris_aligned: true, itr: 1.6, screening: 'pass', dnsh: { climate: true, water: true, bio: true, circular: true, pollution: true, ecosystems: true }, use_of_proceeds: [{ cat: 'Renewable Energy', pct: 45 }, { cat: 'Clean Transport', pct: 28 }, { cat: 'Energy Efficiency', pct: 18 }, { cat: 'R&D', pct: 9 }] },
  { id: 'SLB001', name: 'Enel S.p.A. SLB 2026', issuer: 'Enel', type: 'Sustainability-Linked Bond', isin: 'XS2281149929', issue: '2021-06', maturity: '2026-06', face_value: 1000, coupon: 1.875, greenium: -6.4, label: 'ICMA SLB', review: 'Second Opinion', taxonomy_aligned: 0, taxonomy_eligible: 42, paris_aligned: true, itr: 2.0, screening: 'pass', step_up: 25, kpis: [{ kpi: 'Renewable Capacity %', baseline: '46%', target: '60%', target_year: 2025 }, { kpi: 'Scope 1 GHG Intensity', baseline: '0.276 tCO₂/MWh', target: '0.210', target_year: 2025 }], dnsh: { climate: true, water: true, bio: true, circular: true, pollution: true, ecosystems: true }, use_of_proceeds: [] },
  { id: 'TB001', name: 'TotalEnergies Transition Bond', issuer: 'TotalEnergies', type: 'Transition Bond', isin: 'FR0014004V72', issue: '2023-01', maturity: '2030-01', face_value: 1200, coupon: 3.25, greenium: -2.8, label: 'ICMA GBP', review: 'Verification', taxonomy_aligned: 22, taxonomy_eligible: 58, paris_aligned: false, itr: 3.1, screening: 'watch', dnsh: { climate: true, water: false, bio: true, circular: false, pollution: true, ecosystems: false }, use_of_proceeds: [{ cat: 'LNG Infrastructure', pct: 40 }, { cat: 'Solar', pct: 35 }, { cat: 'Biofuels', pct: 25 }] },
  { id: 'GB002', name: 'Apple Inc. Green Bond 2030', issuer: 'Apple', type: 'Green Bond', isin: 'US037833EH21', issue: '2021-08', maturity: '2031-08', face_value: 1000, coupon: 1.375, greenium: -12.4, label: 'CBI Certified', review: 'Assurance', taxonomy_aligned: 88, taxonomy_eligible: 98, paris_aligned: true, itr: 1.4, screening: 'pass', dnsh: { climate: true, water: true, bio: true, circular: true, pollution: true, ecosystems: true }, use_of_proceeds: [{ cat: 'Renewable Energy', pct: 62 }, { cat: 'Green Buildings', pct: 20 }, { cat: 'Circular Economy', pct: 18 }] },
  { id: 'BB001', name: 'Global Blue Bond Pacific Ocean', issuer: 'Asian Dev. Bank', type: 'Blue Bond', isin: 'XS2341896042', issue: '2021-10', maturity: '2031-10', face_value: 300, coupon: 1.25, greenium: -9.8, label: 'ASEAN SBF', review: 'Second Opinion', taxonomy_aligned: 65, taxonomy_eligible: 80, paris_aligned: true, itr: 1.8, screening: 'pass', dnsh: { climate: true, water: true, bio: true, circular: true, pollution: false, ecosystems: true }, use_of_proceeds: [{ cat: 'Ocean Conservation', pct: 55 }, { cat: 'Sustainable Fisheries', pct: 30 }, { cat: 'Coastal Resilience', pct: 15 }] },
  { id: 'SB001', name: 'Unilever Sustainability Bond', issuer: 'Unilever', type: 'Sustainability Bond', isin: 'XS2298736918', issue: '2021-02', maturity: '2032-02', face_value: 750, coupon: 0.375, greenium: -11.2, label: 'ICMA SBP', review: 'Second Opinion', taxonomy_aligned: 52, taxonomy_eligible: 68, paris_aligned: true, itr: 2.2, screening: 'pass', dnsh: { climate: true, water: true, bio: true, circular: true, pollution: true, ecosystems: true }, use_of_proceeds: [{ cat: 'Sustainable Agri', pct: 45 }, { cat: 'Clean Water', pct: 30 }, { cat: 'Inclusive Business', pct: 25 }] },
  { id: 'GB003', name: 'Saudi Aramco Green Bond', issuer: 'Saudi Aramco', type: 'Green Bond', isin: 'XS2558399266', issue: '2023-06', maturity: '2030-06', face_value: 1250, coupon: 4.875, greenium: 0.4, label: 'None', review: 'Second Opinion', taxonomy_aligned: 8, taxonomy_eligible: 18, paris_aligned: false, itr: 4.2, screening: 'fail', dnsh: { climate: false, water: true, bio: false, circular: false, pollution: false, ecosystems: false }, use_of_proceeds: [{ cat: 'Flaring Reduction', pct: 60 }, { cat: 'CCS Pilot', pct: 40 }] },
  { id: 'SLB002', name: 'Volkswagen KPX SLB', issuer: 'Volkswagen AG', type: 'Sustainability-Linked Bond', isin: 'XS2364497162', issue: '2022-09', maturity: '2027-09', face_value: 1000, coupon: 2.0, greenium: -5.6, label: 'ICMA SLB', review: 'Second Opinion', taxonomy_aligned: 0, taxonomy_eligible: 55, paris_aligned: true, itr: 2.3, screening: 'pass', step_up: 25, kpis: [{ kpi: 'EV Share of Sales', baseline: '5%', target: '20%', target_year: 2025 }, { kpi: 'CO₂/vehicle', baseline: '118g/km', target: '95g/km', target_year: 2025 }], dnsh: { climate: true, water: true, bio: true, circular: true, pollution: true, ecosystems: true }, use_of_proceeds: [] },
];

const TYPE_COLORS = { 'Green Bond': T.green, 'Sustainability-Linked Bond': T.blue, 'Transition Bond': T.amber, 'Blue Bond': T.teal, 'Sustainability Bond': T.sage };
const SCREENING_COLORS = { pass: T.green, watch: T.amber, fail: T.red };

const TABS = ['Instrument Universe', 'Taxonomy Alignment', 'Greenium Analysis', 'KPI Tracking', 'Portfolio Screening'];

export default function TransitionFinanceScreenerPage() {
  const [tab, setTab] = useState(0);
  const [selected, setSelected] = useState('GB001');
  const [filterType, setFilterType] = useState('All');
  const [filterScreen, setFilterScreen] = useState('All');

  const inst = INSTRUMENTS.find(i => i.id === selected);
  const totalFaceValue = INSTRUMENTS.reduce((s, i) => s + i.face_value, 0);
  const passCount = INSTRUMENTS.filter(i => i.screening === 'pass').length;
  const avgTaxonomy = Math.round(INSTRUMENTS.reduce((s, i) => s + i.taxonomy_aligned, 0) / INSTRUMENTS.length);
  const avgGreenium = (INSTRUMENTS.reduce((s, i) => s + i.greenium, 0) / INSTRUMENTS.length).toFixed(1);

  const filtered = INSTRUMENTS.filter(i =>
    (filterType === 'All' || i.type === filterType) &&
    (filterScreen === 'All' || i.screening === filterScreen)
  );

  const pieData = Object.entries(TYPE_COLORS).map(([type, color]) => ({
    name: type, value: INSTRUMENTS.filter(i => i.type === type).reduce((s, i) => s + i.face_value, 0), color
  })).filter(d => d.value > 0);

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh' }}>
      <div style={{ background: T.navy, padding: '24px 32px 0', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ color: T.gold, fontFamily: T.mono, fontSize: 11, letterSpacing: 2, marginBottom: 4 }}>EP-CC3 · TRANSITION FINANCE SCREENER</div>
            <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: 0 }}>Transition Finance & Green Bond Screener</h1>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>
              8 Instruments · ICMA GBP/SBP/SLB · EU GBS · CBI · Greenium · Taxonomy Alignment · Paris ITR · DNSH Assessment
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {[
              { label: 'Universe', val: `$${(totalFaceValue/1000).toFixed(1)}B` },
              { label: 'Pass Rate', val: `${passCount}/${INSTRUMENTS.length}`, col: T.green },
              { label: 'Avg Taxonomy', val: `${avgTaxonomy}%`, col: T.blue },
              { label: 'Avg Greenium', val: `${avgGreenium}bps`, col: T.teal },
            ].map(m => (
              <div key={m.label} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 14px', textAlign: 'right' }}>
                <div style={{ color: '#94a3b8', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{m.label}</div>
                <div style={{ color: m.col || T.gold, fontSize: 16, fontWeight: 700, fontFamily: T.mono }}>{m.val}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 0 }}>
          {TABS.map((t2, i) => (
            <button key={i} onClick={() => setTab(i)} style={{
              padding: '10px 18px', border: 'none', background: 'transparent', cursor: 'pointer',
              color: tab === i ? T.gold : '#94a3b8', fontWeight: tab === i ? 700 : 400, fontSize: 13,
              borderBottom: tab === i ? `2px solid ${T.gold}` : '2px solid transparent'
            }}>{t2}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 32px 32px' }}>

        {tab === 0 && (
          <div style={{ paddingTop: 24 }}>
            {/* Filters */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ color: T.textSec, fontSize: 12, display: 'block', marginBottom: 4 }}>Type</label>
                <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 6, background: T.surface, fontSize: 12 }}>
                  <option value="All">All Types</option>
                  {Object.keys(TYPE_COLORS).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ color: T.textSec, fontSize: 12, display: 'block', marginBottom: 4 }}>Screening</label>
                <select value={filterScreen} onChange={e => setFilterScreen(e.target.value)} style={{ padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 6, background: T.surface, fontSize: 12 }}>
                  <option value="All">All Results</option>
                  <option value="pass">Pass</option>
                  <option value="watch">Watch</option>
                  <option value="fail">Fail</option>
                </select>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.navy }}>
                    {['Instrument', 'Issuer', 'Type', 'Face Value', 'Coupon', 'Greenium (bps)', 'Taxonomy %', 'ITR', 'Label', 'Result'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', color: '#fff', fontWeight: 600, textAlign: 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((i2, idx) => (
                    <tr key={i2.id} onClick={() => setSelected(i2.id)} style={{ background: selected === i2.id ? i2.type in TYPE_COLORS ? TYPE_COLORS[i2.type] + '08' : T.bg : idx % 2 === 0 ? T.surface : T.bg, cursor: 'pointer' }}>
                      <td style={{ padding: '9px 12px', color: T.navy, fontWeight: 500, maxWidth: 200 }}>{i2.name}</td>
                      <td style={{ padding: '9px 12px', color: T.textSec }}>{i2.issuer}</td>
                      <td style={{ padding: '9px 12px' }}>
                        <span style={{ background: (TYPE_COLORS[i2.type] || T.textMut) + '22', color: TYPE_COLORS[i2.type] || T.textMut, padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700 }}>{i2.type}</span>
                      </td>
                      <td style={{ padding: '9px 12px', fontFamily: T.mono }}>${i2.face_value}M</td>
                      <td style={{ padding: '9px 12px', fontFamily: T.mono }}>{i2.coupon}%</td>
                      <td style={{ padding: '9px 12px', fontFamily: T.mono, color: i2.greenium < 0 ? T.green : i2.greenium > 0 ? T.red : T.textSec, fontWeight: 700 }}>
                        {i2.greenium > 0 ? '+' : ''}{i2.greenium} bps
                      </td>
                      <td style={{ padding: '9px 12px', fontFamily: T.mono, color: i2.taxonomy_aligned > 60 ? T.green : i2.taxonomy_aligned > 30 ? T.amber : T.red }}>
                        {i2.taxonomy_aligned}%
                      </td>
                      <td style={{ padding: '9px 12px', fontFamily: T.mono, color: i2.itr < 2 ? T.green : i2.itr < 2.5 ? T.amber : T.red }}>{i2.itr}°C</td>
                      <td style={{ padding: '9px 12px', fontSize: 11 }}>{i2.label}</td>
                      <td style={{ padding: '9px 12px' }}>
                        <span style={{ background: SCREENING_COLORS[i2.screening] + '22', color: SCREENING_COLORS[i2.screening], padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
                          {i2.screening}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 1 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24 }}>
                <h3 style={{ color: T.navy, margin: '0 0 16px', fontSize: 15 }}>EU Taxonomy Aligned vs. Eligible — All Instruments</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={INSTRUMENTS.map(i => ({ name: i.issuer, aligned: i.taxonomy_aligned, eligible: i.taxonomy_eligible - i.taxonomy_aligned, color: TYPE_COLORS[i.type] || T.textMut }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={55} />
                    <YAxis tickFormatter={v => `${v}%`} domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={v => [`${v}%`]} />
                    <Legend />
                    <Bar dataKey="aligned" name="Taxonomy Aligned" fill={T.green} opacity={0.8} stackId="a" />
                    <Bar dataKey="eligible" name="Eligible (Not Aligned)" fill={T.amber} opacity={0.7} stackId="a" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {inst && (
                <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24 }}>
                  <h3 style={{ color: T.navy, margin: '0 0 12px', fontSize: 15 }}>DNSH Assessment — {inst.issuer}</h3>
                  <p style={{ color: T.textSec, fontSize: 12, margin: '0 0 16px' }}>Do No Significant Harm to 6 environmental objectives (EU Taxonomy Art. 17)</p>
                  {Object.entries({
                    'Climate Mitigation': inst.dnsh.climate,
                    'Water & Marine': inst.dnsh.water,
                    'Biodiversity': inst.dnsh.bio,
                    'Circular Economy': inst.dnsh.circular,
                    'Pollution Prevention': inst.dnsh.pollution,
                    'Ecosystems': inst.dnsh.ecosystems,
                  }).map(([key, pass]) => (
                    <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
                      <span style={{ fontSize: 13, color: T.navy }}>{key}</span>
                      <span style={{ fontWeight: 700, color: pass ? T.green : T.red, fontSize: 13 }}>{pass ? '✓ Pass' : '✗ Fail'}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: T.textSec, fontSize: 13 }}>Overall DNSH Status</span>
                    <span style={{ fontWeight: 700, color: Object.values(inst.dnsh).every(Boolean) ? T.green : T.red, fontSize: 14 }}>
                      {Object.values(inst.dnsh).every(Boolean) ? '✓ All Pass' : `✗ ${Object.values(inst.dnsh).filter(v => !v).length} Fail`}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 2 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24, marginBottom: 20 }}>
              <h3 style={{ color: T.navy, margin: '0 0 8px', fontSize: 15 }}>Greenium by Instrument (bps vs. vanilla equivalent)</h3>
              <p style={{ color: T.textSec, fontSize: 12, margin: '0 0 16px' }}>Negative = green bond yields less than vanilla (issuer benefit). Positive = greenium penalty.</p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={INSTRUMENTS.map(i => ({ name: i.issuer, greenium: i.greenium, color: i.greenium < 0 ? T.green : T.red }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={v => `${v} bps`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={v => [`${v} bps`, 'Greenium']} />
                  <Bar dataKey="greenium" name="Greenium (bps)" radius={[4,4,0,0]}>
                    {INSTRUMENTS.map((i2, idx) => <Cell key={idx} fill={i2.greenium < 0 ? T.green : T.red} />)}
                  </Bar>
                  <ReferenceLine y={0} stroke={T.navy} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 3 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ display: 'grid', gap: 14 }}>
              {INSTRUMENTS.filter(i => i.kpis).map(i => (
                <div key={i.id} style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
                    <div>
                      <div style={{ fontWeight: 700, color: T.navy, fontSize: 15 }}>{i.name}</div>
                      <div style={{ fontSize: 12, color: T.textSec }}>{i.issuer} · {i.type} · Step-up: {i.step_up || 0} bps if missed</div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${i.kpis.length},1fr)`, gap: 12 }}>
                    {i.kpis.map(kpi => (
                      <div key={kpi.kpi} style={{ background: T.bg, borderRadius: 8, padding: 14 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 6 }}>{kpi.kpi}</div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <div>
                            <div style={{ fontSize: 10, color: T.textMut }}>Baseline</div>
                            <div style={{ fontFamily: T.mono, fontSize: 13, color: T.textSec }}>{kpi.baseline}</div>
                          </div>
                          <div style={{ fontSize: 16, color: T.gold, paddingTop: 10 }}>→</div>
                          <div>
                            <div style={{ fontSize: 10, color: T.textMut }}>Target {kpi.target_year}</div>
                            <div style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 700, color: T.green }}>{kpi.target}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 4 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24 }}>
                <h3 style={{ color: T.navy, margin: '0 0 16px', fontSize: 15 }}>Universe by Instrument Type ($M)</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${(percent*100).toFixed(0)}%`}>
                      {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip formatter={v => [`$${v}M`]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24 }}>
                <h3 style={{ color: T.navy, margin: '0 0 12px', fontSize: 15 }}>Screening Summary</h3>
                {['pass', 'watch', 'fail'].map(result => {
                  const count = INSTRUMENTS.filter(i => i.screening === result).length;
                  const val = INSTRUMENTS.filter(i => i.screening === result).reduce((s, i) => s + i.face_value, 0);
                  return (
                    <div key={result} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${T.border}` }}>
                      <span style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <span style={{ background: SCREENING_COLORS[result] + '22', color: SCREENING_COLORS[result], padding: '2px 10px', borderRadius: 10, fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>{result}</span>
                        <span style={{ fontSize: 13, color: T.navy }}>{count} instruments</span>
                      </span>
                      <span style={{ fontFamily: T.mono, fontWeight: 700, color: T.navy }}>${(val/1000).toFixed(2)}B</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
