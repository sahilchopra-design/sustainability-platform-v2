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
  font: "'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono: "'JetBrains Mono','SF Mono','Fira Code',monospace"
};

// PCAF Asset Classes with methodology
const PCAF_CLASSES = [
  {
    id: 'listed_equity', name: 'Listed Equity', pcaf: 'PCAF Cat. 1', quality: 2.1, color: T.blue,
    outstanding: 4200, evic: 12400, attribution: 0.339,
    scope1: 8.24, scope2: 2.18, scope3: 14.62, financed: 8.48,
    target_2025: 7.20, target_2030: 4.80, target_2050: 0.85, on_track: false,
    waci: 68.4, companies: [
      { name: 'Shell', financed_mt: 1.84, attribution: 0.148, quality: 2 },
      { name: 'Glencore', financed_mt: 1.42, attribution: 0.112, quality: 3 },
      { name: 'BASF', financed_mt: 0.98, attribution: 0.089, quality: 2 },
      { name: 'BP', financed_mt: 1.64, attribution: 0.132, quality: 1 },
      { name: 'ArcelorMittal', financed_mt: 2.60, attribution: 0.204, quality: 3 },
    ],
    formula: 'Attribution = Outstanding Amount / EVIC; Financed Emissions = Attribution × (S1+S2+S3)',
  },
  {
    id: 'corporate_bonds', name: 'Corporate Bonds', pcaf: 'PCAF Cat. 2', quality: 2.4, color: T.teal,
    outstanding: 2800, evic: 9600, attribution: 0.292,
    scope1: 5.12, scope2: 1.44, scope3: 8.28, financed: 4.32,
    target_2025: 3.80, target_2030: 2.50, target_2050: 0.40, on_track: true,
    waci: 54.2, companies: [
      { name: 'EDF', financed_mt: 0.92, attribution: 0.082, quality: 2 },
      { name: 'Vattenfall', financed_mt: 0.76, attribution: 0.068, quality: 2 },
      { name: 'Heidelberg', financed_mt: 1.24, attribution: 0.112, quality: 3 },
    ],
    formula: 'Attribution = Outstanding / (Debt + Equity); Applied per PCAF standard bond methodology',
  },
  {
    id: 'project_finance', name: 'Project Finance', pcaf: 'PCAF Cat. 3', quality: 1.8, color: T.amber,
    outstanding: 680, evic: null, attribution: 1.00,
    scope1: 1.84, scope2: 0.28, scope3: 0.68, financed: 2.80,
    target_2025: 2.20, target_2030: 1.40, target_2050: 0.20, on_track: false,
    waci: 412.0, companies: [
      { name: 'Coal Plant (Indonesia)', financed_mt: 1.84, attribution: 1.00, quality: 2 },
      { name: 'LNG Terminal', financed_mt: 0.96, attribution: 1.00, quality: 1 },
    ],
    formula: 'Attribution = 100% of project emissions × loan share of total project finance',
  },
  {
    id: 'commercial_re', name: 'Commercial Real Estate', pcaf: 'PCAF Cat. 4', quality: 3.2, color: T.purple,
    outstanding: 1200, evic: null, attribution: null,
    scope1: 0.24, scope2: 0.58, scope3: 0.00, financed: 0.99,
    target_2025: 0.85, target_2030: 0.55, target_2050: 0.08, on_track: true,
    waci: 82.5, companies: [
      { name: 'Office Portfolio EU', financed_mt: 0.42, attribution: 0.35, quality: 4 },
      { name: 'Retail UK', financed_mt: 0.57, attribution: 0.41, quality: 3 },
    ],
    formula: 'Attribution = Outstanding / Property Value; Emissions per CRREM/GRESB intensity',
  },
  {
    id: 'mortgages', name: 'Residential Mortgages', pcaf: 'PCAF Cat. 6', quality: 4.0, color: T.sage,
    outstanding: 3400, evic: null, attribution: null,
    scope1: 0.08, scope2: 0.62, scope3: 0.00, financed: 1.84,
    target_2025: 1.60, target_2030: 1.00, target_2050: 0.12, on_track: true,
    waci: 54.1, companies: [
      { name: 'UK Residential', financed_mt: 1.84, attribution: null, quality: 4 },
    ],
    formula: 'Emissions based on EPC energy consumption × grid carbon factor × attribution fraction',
  },
];

const TABS = ['PCAF Dashboard', 'Attribution Methodology', 'Targets & Trajectories', 'Company Drill-Down', 'WACI Benchmarking'];

export default function FinancedEmissionsAttributorPage() {
  const [tab, setTab] = useState(0);
  const [selectedClass, setSelectedClass] = useState('listed_equity');
  const [year, setYear] = useState(2024);

  const cls = PCAF_CLASSES.find(c => c.id === selectedClass);
  const totalFinanced = PCAF_CLASSES.reduce((s, c) => s + c.financed, 0);
  const totalOutstanding = PCAF_CLASSES.reduce((s, c) => s + c.outstanding, 0);
  const totalTarget2030 = PCAF_CLASSES.reduce((s, c) => s + c.target_2030, 0);
  const offTrack = PCAF_CLASSES.filter(c => !c.on_track).length;

  const trajectoryData = useMemo(() => [
    { year: 2020, actual: totalFinanced * 1.28 },
    { year: 2021, actual: totalFinanced * 1.18 },
    { year: 2022, actual: totalFinanced * 1.10 },
    { year: 2023, actual: totalFinanced * 1.04 },
    { year: 2024, actual: totalFinanced },
    { year: 2025, target: PCAF_CLASSES.reduce((s, c) => s + c.target_2025, 0) },
    { year: 2030, target: totalTarget2030 },
    { year: 2050, target: PCAF_CLASSES.reduce((s, c) => s + c.target_2050, 0) },
  ], [totalFinanced]);

  const pieData = PCAF_CLASSES.map(c => ({ name: c.name, value: c.financed, color: c.color }));

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh' }}>
      <div style={{ background: T.navy, padding: '24px 32px 0', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ color: T.gold, fontFamily: T.mono, fontSize: 11, letterSpacing: 2, marginBottom: 4 }}>EP-CC2 · FINANCED EMISSIONS ATTRIBUTOR</div>
            <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: 0 }}>Financed Emissions Attribution — PCAF Standard</h1>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>
              5 PCAF Asset Classes · Scope 1+2+3 Attribution · WACI · 2025/2030/2050 Targets · Data Quality Scoring
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {[
              { label: 'Total Financed Emissions', val: `${totalFinanced.toFixed(1)} MtCO₂e`, col: T.red },
              { label: 'Total Outstanding', val: `$${(totalOutstanding/1000).toFixed(1)}B` },
              { label: 'Off-Track Targets', val: `${offTrack}/${PCAF_CLASSES.length}`, col: T.amber },
            ].map(m => (
              <div key={m.label} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 16px', textAlign: 'right' }}>
                <div style={{ color: '#94a3b8', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{m.label}</div>
                <div style={{ color: m.col || T.gold, fontSize: 16, fontWeight: 700, fontFamily: T.mono }}>{m.val}</div>
              </div>
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24 }}>
                <h3 style={{ color: T.navy, margin: '0 0 16px', fontSize: 15 }}>Financed Emissions by Asset Class (MtCO₂e)</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name.split(' ')[0]} ${(percent*100).toFixed(0)}%`} labelLine>
                      {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip formatter={v => [`${v.toFixed(2)} MtCO₂e`]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24 }}>
                <h3 style={{ color: T.navy, margin: '0 0 16px', fontSize: 15 }}>PCAF Asset Class Summary</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {PCAF_CLASSES.map(c => (
                    <div key={c.id} onClick={() => setSelectedClass(c.id)} style={{
                      display: 'flex', gap: 12, alignItems: 'center', padding: '8px 12px',
                      background: selectedClass === c.id ? c.color + '11' : T.bg,
                      borderRadius: 8, border: `1px solid ${selectedClass === c.id ? c.color : 'transparent'}`,
                      cursor: 'pointer'
                    }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: c.color }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: T.navy }}>{c.name}</div>
                        <div style={{ fontSize: 11, color: T.textSec }}>{c.pcaf} · Quality: {c.quality}/5</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: T.mono, fontWeight: 700, color: T.red, fontSize: 14 }}>{c.financed.toFixed(2)} Mt</div>
                        <div style={{ fontSize: 10, color: c.on_track ? T.green : T.red }}>{c.on_track ? '✓ On Track' : '✗ Off Track'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Selected class detail */}
            <div style={{ background: T.surface, borderRadius: 10, border: `2px solid ${cls.color}44`, padding: 24 }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ color: T.navy, margin: 0, fontSize: 16 }}>{cls.name} — {cls.pcaf}</h3>
                <span style={{ background: cls.color + '22', color: cls.color, padding: '3px 10px', borderRadius: 10, fontSize: 12, fontWeight: 700 }}>
                  Data Quality {cls.quality}/5
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }}>
                {[
                  { label: 'Outstanding', val: `$${(cls.outstanding/1000).toFixed(1)}B` },
                  { label: 'Scope 1', val: `${cls.scope1} Mt` },
                  { label: 'Scope 2', val: `${cls.scope2} Mt` },
                  { label: 'Scope 3', val: `${cls.scope3 > 0 ? cls.scope3 + ' Mt' : 'N/A'}` },
                  { label: 'Financed Total', val: `${cls.financed} Mt`, col: T.red },
                ].map(m => (
                  <div key={m.label} style={{ background: T.bg, borderRadius: 8, padding: 12, textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: T.textMut, textTransform: 'uppercase' }}>{m.label}</div>
                    <div style={{ fontFamily: T.mono, fontSize: 15, fontWeight: 700, color: m.col || T.navy, marginTop: 4 }}>{m.val}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 1 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
              {PCAF_CLASSES.map(c => (
                <button key={c.id} onClick={() => setSelectedClass(c.id)} style={{
                  padding: '6px 12px', borderRadius: 20, border: `2px solid ${selectedClass === c.id ? c.color : 'transparent'}`,
                  background: selectedClass === c.id ? c.color + '22' : T.surface,
                  color: selectedClass === c.id ? c.color : T.textSec, cursor: 'pointer', fontSize: 12, fontWeight: 600
                }}>{c.name.split(' ')[0]}</button>
              ))}
            </div>
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24 }}>
              <h3 style={{ color: T.navy, margin: '0 0 8px', fontSize: 15 }}>{cls.name} — PCAF Attribution Methodology</h3>
              <div style={{ fontFamily: T.mono, fontSize: 13, background: T.bg, padding: 16, borderRadius: 8, color: T.navy, marginBottom: 16, lineHeight: 1.8 }}>
                {cls.formula}
              </div>
              {cls.evic && (
                <div style={{ fontFamily: T.mono, fontSize: 12, background: '#f0f8ff', padding: 12, borderRadius: 6, color: T.navy, marginBottom: 12 }}>
                  Attribution Factor = ${cls.outstanding}M / ${cls.evic}M EVIC = {cls.attribution.toFixed(3)}<br />
                  Financed Emissions = {cls.attribution.toFixed(3)} × ({cls.scope1} + {cls.scope2} + {cls.scope3}) MtCO₂e<br />
                  = {cls.attribution.toFixed(3)} × {(cls.scope1 + cls.scope2 + cls.scope3).toFixed(2)} = {cls.financed.toFixed(2)} MtCO₂e
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                {[
                  { label: 'Attribution Factor', val: cls.attribution ? cls.attribution.toFixed(3) : 'Loan/Value', col: T.blue },
                  { label: 'PCAF Data Quality', val: `${cls.quality}/5`, col: cls.quality < 2 ? T.green : cls.quality < 3 ? T.amber : T.red },
                  { label: 'WACI', val: `${cls.waci} tCO₂/$M`, col: T.navy },
                ].map(m => (
                  <div key={m.label} style={{ background: T.bg, borderRadius: 8, padding: 14, textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: T.textMut }}>{m.label}</div>
                    <div style={{ fontFamily: T.mono, fontSize: 18, fontWeight: 700, color: m.col, marginTop: 6 }}>{m.val}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 2 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24, marginBottom: 20 }}>
              <h3 style={{ color: T.navy, margin: '0 0 16px', fontSize: 15 }}>Total Financed Emissions — Trajectory vs. Net-Zero Path</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trajectoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={v => `${v.toFixed(0)} Mt`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={v => v ? [`${v.toFixed(2)} MtCO₂e`] : ['N/A']} />
                  <Legend />
                  <Line dataKey="actual" name="Actual Financed Emissions" stroke={T.red} strokeWidth={2.5} connectNulls={false} dot={{ r: 4 }} />
                  <Line dataKey="target" name="Net-Zero Target Path" stroke={T.green} strokeWidth={2} strokeDasharray="6 3" connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }}>
              {PCAF_CLASSES.map(c => (
                <div key={c.id} style={{ background: T.surface, borderRadius: 8, border: `1px solid ${T.border}`, padding: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 8 }}>{c.name}</div>
                  {[['Now', c.financed, T.red], ['2025T', c.target_2025, T.amber], ['2030T', c.target_2030, T.blue], ['2050T', c.target_2050, T.green]].map(([yr, val, col]) => (
                    <div key={yr} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: T.textMut }}>{yr}</span>
                      <span style={{ fontFamily: T.mono, fontSize: 11, fontWeight: 700, color: col }}>{val.toFixed(2)} Mt</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.on_track ? T.green : T.red }} />
                    <span style={{ fontSize: 11, color: c.on_track ? T.green : T.red, fontWeight: 600 }}>{c.on_track ? 'On Track' : 'Off Track'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 3 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
              {PCAF_CLASSES.map(c => (
                <button key={c.id} onClick={() => setSelectedClass(c.id)} style={{
                  padding: '6px 12px', borderRadius: 20, border: `2px solid ${selectedClass === c.id ? c.color : 'transparent'}`,
                  background: selectedClass === c.id ? c.color + '22' : T.surface,
                  color: selectedClass === c.id ? c.color : T.textSec, cursor: 'pointer', fontSize: 12, fontWeight: 600
                }}>{c.name.split(' ')[0]}</button>
              ))}
            </div>
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24 }}>
              <h3 style={{ color: T.navy, margin: '0 0 16px', fontSize: 15 }}>Company-Level Attribution — {cls.name}</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: T.navy }}>
                    {['Company', 'Attribution Factor', 'Financed Emissions (MtCO₂e)', 'Data Quality', 'Share of Class'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', color: '#fff', fontWeight: 600, textAlign: 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cls.companies.map((c2, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.bg }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: T.navy }}>{c2.name}</td>
                      <td style={{ padding: '10px 12px', fontFamily: T.mono }}>{c2.attribution ? c2.attribution.toFixed(3) : '—'}</td>
                      <td style={{ padding: '10px 12px', fontFamily: T.mono, color: T.red, fontWeight: 700 }}>{c2.financed_mt.toFixed(2)}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ fontFamily: T.mono, background: c2.quality <= 2 ? T.green + '22' : c2.quality <= 3 ? T.amber + '22' : T.red + '22', color: c2.quality <= 2 ? T.green : c2.quality <= 3 ? T.amber : T.red, padding: '2px 8px', borderRadius: 8 }}>{c2.quality}/5</span>
                      </td>
                      <td style={{ padding: '10px 12px', fontFamily: T.mono }}>{((c2.financed_mt / cls.financed) * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 4 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24, marginBottom: 20 }}>
              <h3 style={{ color: T.navy, margin: '0 0 16px', fontSize: 15 }}>Weighted Average Carbon Intensity (WACI) by Asset Class</h3>
              <p style={{ color: T.textSec, fontSize: 12, margin: '0 0 16px' }}>WACI = Σ (weight × company WACI) · Units: tCO₂e per $M revenue (equity/bonds) or per m² (RE/mortgages)</p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={PCAF_CLASSES.map(c => ({ name: c.name.split(' ')[0], waci: c.waci, color: c.color }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={v => `${v}`} tick={{ fontSize: 11 }} label={{ value: 'tCO₂/$M', angle: -90, position: 'insideLeft', fill: T.textSec, fontSize: 11 }} />
                  <Tooltip formatter={v => [`${v} tCO₂/$M`, 'WACI']} />
                  <Bar dataKey="waci" name="WACI (tCO₂e/$M)" radius={[6,6,0,0]}>
                    {PCAF_CLASSES.map((c, i) => <Cell key={i} fill={c.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
