import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine
} from 'recharts';

const T = {
  bg: '#f6f4f0', surface: '#ffffff', border: '#e5e0d8', navy: '#1b3a5c',
  navyL: '#2c5a8c', gold: '#c5a96a', textSec: '#5c6b7e', textMut: '#9aa3ae',
  red: '#dc2626', green: '#16a34a', amber: '#d97706', blue: '#2563eb',
  orange: '#ea580c', purple: '#7c3aed', teal: '#0891b2', sage: '#5a8a6a',
  card: '#ffffff', sub: '#5c6b7e', indigo: '#4f46e5', font: "'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono: "'JetBrains Mono','SF Mono','Fira Code',monospace"
};

const COMPANIES = [
  { id: 'microsoft', name: 'Microsoft', sector: 'Technology', color: T.blue,
    scope1: 0.15, scope2_mkt: 0.00, scope2_loc: 0.68, scope3: 13.8,
    s3_cats: [{ cat: 'Cat 1 Purchased', mt: 0.82 }, { cat: 'Cat 2 Capital Goods', mt: 0.95 }, { cat: 'Cat 3 Energy', mt: 0.12 }, { cat: 'Cat 11 Use of Products', mt: 8.2 }, { cat: 'Cat 15 Investments', mt: 3.71 }],
    intensity_rev: 28.4, intensity_fte: 8.2, sbti: true,
    trajectory: [{ year: 2019, actual: 16.2 }, { year: 2020, actual: 14.8 }, { year: 2021, actual: 14.1 }, { year: 2022, actual: 14.0 }, { year: 2023, actual: 13.8 }, { year: 2025, target: 12.5 }, { year: 2030, target: 8.0 }],
  },
  { id: 'bp', name: 'BP plc', sector: 'Oil & Gas', color: T.green,
    scope1: 48.2, scope2_mkt: 3.8, scope2_loc: 4.2, scope3: 360.0,
    s3_cats: [{ cat: 'Cat 1 Purchased', mt: 2.8 }, { cat: 'Cat 3 Energy', mt: 3.2 }, { cat: 'Cat 11 Use of Products', mt: 354.0 }],
    intensity_rev: 1480, intensity_fte: 8420, sbti: false,
    trajectory: [{ year: 2019, actual: 415 }, { year: 2020, actual: 395 }, { year: 2021, actual: 400 }, { year: 2022, actual: 412 }, { year: 2023, actual: 412 }, { year: 2025, target: 370 }, { year: 2030, target: 290 }],
  },
  { id: 'apple', name: 'Apple Inc.', sector: 'Technology', color: T.textSec,
    scope1: 0.061, scope2_mkt: 0.000, scope2_loc: 0.58, scope3: 20.6,
    s3_cats: [{ cat: 'Cat 1 Purchased', mt: 3.2 }, { cat: 'Cat 4 Upstream Trans.', mt: 0.54 }, { cat: 'Cat 11 Use of Products', mt: 14.8 }, { cat: 'Cat 12 End of Life', mt: 0.52 }, { cat: 'Cat 15 Investments', mt: 1.54 }],
    intensity_rev: 51.8, intensity_fte: 20.4, sbti: true,
    trajectory: [{ year: 2019, actual: 25.2 }, { year: 2020, actual: 22.6 }, { year: 2021, actual: 23.0 }, { year: 2022, actual: 21.4 }, { year: 2023, actual: 20.6 }, { year: 2025, target: 18.0 }, { year: 2030, target: 5.0 }],
  },
  { id: 'unilever', name: 'Unilever', sector: 'Consumer Staples', color: T.orange,
    scope1: 1.42, scope2_mkt: 0.38, scope2_loc: 0.58, scope3: 59.8,
    s3_cats: [{ cat: 'Cat 1 Purchased', mt: 42.8 }, { cat: 'Cat 3 Energy', mt: 2.4 }, { cat: 'Cat 11 Use of Products', mt: 10.8 }, { cat: 'Cat 12 End of Life', mt: 3.8 }],
    intensity_rev: 820, intensity_fte: 680, sbti: true,
    trajectory: [{ year: 2019, actual: 65.2 }, { year: 2020, actual: 63.8 }, { year: 2021, actual: 61.5 }, { year: 2022, actual: 60.8 }, { year: 2023, actual: 59.8 }, { year: 2025, target: 52.0 }, { year: 2030, target: 32.6 }],
  },
];

const SCOPE3_CATS_META = [
  { cat: 1, name: 'Purchased Goods & Services', typical: 'High' },
  { cat: 2, name: 'Capital Goods', typical: 'Medium' },
  { cat: 3, name: 'Fuel & Energy (indirect)', typical: 'Low' },
  { cat: 4, name: 'Upstream Transportation', typical: 'Medium' },
  { cat: 11, name: 'Use of Sold Products', typical: 'High' },
  { cat: 12, name: 'End of Life Treatment', typical: 'Low' },
  { cat: 15, name: 'Investments', typical: 'High' },
];

const TABS = ['Scope 1/2/3 Dashboard', 'Scope 3 Category Breakdown', 'Intensity Benchmarking', 'Reduction Pathways', 'Peer Comparison'];

export default function CarbonFootprintIntelligencePage() {
  const [tab, setTab] = useState(0);
  const [selected, setSelected] = useState('microsoft');

  const co = COMPANIES.find(c => c.id === selected);
  const totalS123 = co.scope1 + co.scope2_mkt + co.scope3;
  const scope3Pct = totalS123 > 0 ? (co.scope3 / totalS123) * 100 : 0;

  const scopePie = [
    { name: 'Scope 1', value: co.scope1, color: T.red },
    { name: 'Scope 2 (mkt)', value: co.scope2_mkt, color: T.orange },
    { name: 'Scope 3', value: co.scope3, color: T.amber },
  ];

  const intensityData = COMPANIES.map(c => ({
    name: c.name, intensity: c.intensity_rev, color: c.color
  })).sort((a, b) => a.intensity - b.intensity);

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh' }}>
      <div style={{ background: T.navy, padding: '24px 32px 0', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ color: T.gold, fontFamily: T.mono, fontSize: 11, letterSpacing: 2, marginBottom: 4 }}>EP-CD3 · CARBON FOOTPRINT INTELLIGENCE</div>
            <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: 0 }}>Carbon Footprint Intelligence — Scope 1/2/3 Deep-Dive</h1>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>
              4 Companies · GHG Protocol · Scope 3 Categories · Intensity Benchmarking · SBTi Pathways · Peer Comparison
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {COMPANIES.map(c => (
              <button key={c.id} onClick={() => setSelected(c.id)} style={{
                padding: '8px 14px', borderRadius: 8, border: `2px solid ${selected === c.id ? c.color : 'transparent'}`,
                background: selected === c.id ? c.color + '22' : 'rgba(255,255,255,0.08)',
                color: selected === c.id ? c.color : '#94a3b8', cursor: 'pointer', fontSize: 12, fontWeight: 600
              }}>{c.name}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 0 }}>
          {TABS.map((t2, i) => (
            <button key={i} onClick={() => setTab(i)} style={{
              padding: '10px 20px', border: 'none', background: 'transparent', cursor: 'pointer',
              color: tab === i ? T.gold : '#94a3b8', fontWeight: tab === i ? 700 : 400, fontSize: 13,
              borderBottom: tab === i ? `2px solid ${T.gold}` : '2px solid transparent'
            }}>{t2}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 32px 32px' }}>

        {tab === 0 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Scope 1', val: `${co.scope1.toFixed(2)} MtCO₂e`, col: T.red, desc: 'Direct combustion, process' },
                { label: 'Scope 2 (Market)', val: `${co.scope2_mkt.toFixed(2)} MtCO₂e`, col: T.orange, desc: 'Energy attribute certs' },
                { label: 'Scope 3', val: `${co.scope3.toFixed(1)} MtCO₂e`, col: T.amber, desc: `${scope3Pct.toFixed(0)}% of total footprint` },
                { label: 'Total (S1+S2+S3)', val: `${totalS123.toFixed(1)} MtCO₂e`, col: T.navy, desc: co.sbti ? '✓ SBTi Validated' : '✗ No SBTi' },
              ].map(m => (
                <div key={m.label} style={{ background: T.surface, borderRadius: 8, border: `1px solid ${T.border}`, padding: 16 }}>
                  <div style={{ fontSize: 10, color: T.textMut, textTransform: 'uppercase' }}>{m.label}</div>
                  <div style={{ fontFamily: T.mono, fontSize: 16, fontWeight: 700, color: m.col, marginTop: 4 }}>{m.val}</div>
                  <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{m.desc}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24 }}>
                <h3 style={{ color: T.navy, margin: '0 0 16px', fontSize: 15 }}>Scope Distribution — {co.name}</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={scopePie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}>
                      {scopePie.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip formatter={v => [`${v.toFixed(2)} MtCO₂e`]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24 }}>
                <h3 style={{ color: T.navy, margin: '0 0 16px', fontSize: 15 }}>Emissions Trajectory — {co.name}</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={co.trajectory}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => v > 10 ? `${(v/1).toFixed(0)}Mt` : `${v.toFixed(1)}Mt`} />
                    <Tooltip formatter={v => v ? [`${v.toFixed(1)} MtCO₂e`] : ['N/A']} />
                    <Legend />
                    <Line dataKey="actual" name="Actual" stroke={co.color} strokeWidth={2.5} connectNulls={false} dot={{ r: 4 }} />
                    <Line dataKey="target" name="SBTi Target" stroke={T.green} strokeWidth={2} strokeDasharray="6 3" connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {tab === 1 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24, marginBottom: 20 }}>
              <h3 style={{ color: T.navy, margin: '0 0 8px', fontSize: 15 }}>Scope 3 Category Breakdown — {co.name}</h3>
              <p style={{ color: T.textSec, fontSize: 12, margin: '0 0 16px' }}>GHG Protocol Scope 3 Standard. Categories shown reflect material disclosure.</p>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={co.s3_cats} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tickFormatter={v => `${v}Mt`} tick={{ fontSize: 11 }} />
                  <YAxis dataKey="cat" type="category" width={180} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={v => [`${v.toFixed(2)} MtCO₂e`]} />
                  <Bar dataKey="mt" name="Scope 3 Emissions (MtCO₂e)" fill={co.color} radius={[0, 4, 4, 0]} opacity={0.85} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 2 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24, marginBottom: 20 }}>
              <h3 style={{ color: T.navy, margin: '0 0 8px', fontSize: 15 }}>Carbon Intensity — tCO₂e per $M Revenue</h3>
              <p style={{ color: T.textSec, fontSize: 12, margin: '0 0 16px' }}>Lower = more carbon-efficient. WACI benchmark across peer set.</p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={intensityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={v => `${v.toFixed(0)}`} tick={{ fontSize: 11 }} label={{ value: 'tCO₂/$M rev', angle: -90, position: 'insideLeft', fill: T.textSec, fontSize: 11 }} />
                  <Tooltip formatter={v => [`${v.toFixed(1)} tCO₂/$M revenue`]} />
                  <Bar dataKey="intensity" name="Carbon Intensity" radius={[6,6,0,0]}>
                    {intensityData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 3 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {COMPANIES.map(c => {
                const base2023 = c.trajectory.find(d => d.year === 2023)?.actual ?? c.trajectory[4]?.actual ?? 1;
                const target2030val = c.trajectory.find(d => d.year === 2030)?.target ?? 0;
                const reduction2030 = base2023 > 0 ? ((base2023 - target2030val) / base2023 * 100).toFixed(0) : '0';
                return (
                  <div key={c.id} style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20 }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
                      <div style={{ width: 12, height: 12, borderRadius: '50%', background: c.color }} />
                      <div>
                        <div style={{ fontWeight: 700, color: T.navy }}>{c.name}</div>
                        <div style={{ fontSize: 12, color: T.textSec }}>{c.sector} · {c.sbti ? '✓ SBTi' : '✗ No SBTi'}</div>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
                      {[['2023', c.trajectory.find(d => d.year === 2023)?.actual, T.red], ['2025T', c.trajectory.find(d => d.year === 2025)?.target, T.amber], ['2030T', c.trajectory.find(d => d.year === 2030)?.target, T.green]].map(([yr, val, col]) => (
                        <div key={yr} style={{ background: T.bg, borderRadius: 6, padding: 10, textAlign: 'center' }}>
                          <div style={{ fontSize: 10, color: T.textMut }}>{yr}</div>
                          <div style={{ fontFamily: T.mono, fontSize: 14, fontWeight: 700, color: col }}>{val != null ? val.toFixed(1) : 'N/A'}Mt</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: 12, color: T.textSec }}>
                      Required 2030 reduction: <strong style={{ color: T.red }}>{reduction2030}%</strong>
                    </div>
                    <div style={{ height: 6, background: T.border, borderRadius: 3, marginTop: 8 }}>
                      <div style={{ height: '100%', width: '30%', background: T.green, borderRadius: 3 }} />
                    </div>
                    <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>~30% progress toward 2030 target</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 4 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24 }}>
              <h3 style={{ color: T.navy, margin: '0 0 16px', fontSize: 15 }}>Total Footprint Peer Comparison (MtCO₂e)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={COMPANIES.map(c => ({ name: c.name, scope1: c.scope1, scope2: c.scope2_mkt, scope3: c.scope3, color: c.color }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={v => `${v.toFixed(0)}Mt`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={v => [`${v.toFixed(2)} MtCO₂e`]} />
                  <Legend />
                  <Bar dataKey="scope1" name="Scope 1" fill={T.red} stackId="a" opacity={0.9} />
                  <Bar dataKey="scope2" name="Scope 2" fill={T.orange} stackId="a" opacity={0.8} />
                  <Bar dataKey="scope3" name="Scope 3" fill={T.amber} stackId="a" opacity={0.8} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
