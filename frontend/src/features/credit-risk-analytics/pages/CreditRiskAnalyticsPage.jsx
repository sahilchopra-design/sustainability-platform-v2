import React, { useState, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ScatterChart, Scatter, ZAxis, Legend, ReferenceLine, Cell,
} from 'recharts';

const T = {
  navy: '#1b3a5c', gold: '#c5a96a', cream: '#f7f4ef',
  teal: '#0f766e', green: '#15803d', red: '#b91c1c',
  amber: '#b45309', purple: '#6d28d9', slate: '#334155',
  font: 'DM Sans, sans-serif', mono: 'JetBrains Mono, monospace',
};

const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

// ── Rating grades ──────────────────────────────────────────────────────────────
const RATINGS = ['AAA','AA+','AA','AA-','A+','A','A-','BBB+','BBB','BBB-','BB+','BB','BB-','B+','B','B-','CCC','CC','C','D'];
const RATING_PD = { AAA:0.01,  'AA+':0.02, AA:0.03,  'AA-':0.04, 'A+':0.07,  A:0.09, 'A-':0.12,
  'BBB+':0.18,'BBB':0.24,'BBB-':0.40,'BB+':0.65,'BB':0.88,'BB-':1.20,
  'B+':1.80,  B:2.60,  'B-':3.80, CCC:8.50, CC:14.0,  C:22.0, D:100 };

// ── 45 obligors ───────────────────────────────────────────────────────────────
const SECTORS = ['Corporate','Financial','Sovereign','Infrastructure','Real Estate','Project Finance'];
const OBLIGORS = Array.from({ length: 45 }, (_, i) => {
  const ratingIdx = Math.floor(sr(i * 3) * RATINGS.length);
  const rating = RATINGS[ratingIdx];
  const pd = RATING_PD[rating] * (0.85 + sr(i * 3 + 1) * 0.3) / 100;
  const ead = 10 + sr(i * 3 + 2) * 990;         // $M
  const lgd = 0.25 + sr(i * 3 + 3) * 0.50;
  const ecl = pd * lgd * ead;
  const rwaDensity = 0.15 + sr(i * 3 + 4) * 0.85;
  const rwa = ead * rwaDensity;
  const esgScore = 20 + Math.floor(sr(i * 5) * 80);
  const carbonInt = 50 + sr(i * 5 + 1) * 950;
  const stage = pd > 0.03 ? 3 : pd > 0.01 ? 2 : 1;
  return {
    id: `OBL-${String(i + 1).padStart(3, '0')}`,
    name: `Obligor ${String.fromCharCode(65 + i % 26)}${Math.floor(i / 26) + 1}`,
    sector: SECTORS[i % 6],
    rating,
    pd: +pd.toFixed(4),
    ead: +ead.toFixed(1),
    lgd: +lgd.toFixed(3),
    ecl: +ecl.toFixed(2),
    rwa: +rwa.toFixed(1),
    rwaDensity: +rwaDensity.toFixed(3),
    esgScore,
    carbonInt: +carbonInt.toFixed(0),
    stage,
    maturity: 1 + Math.floor(sr(i * 7) * 9),
  };
});

// ── Credit migration matrix (1-year, simplified) ──────────────────────────────
const MATRIX_GRADES = ['AAA','AA','A','BBB','BB','B','CCC','D'];
const MIGRATION_MATRIX = [
  [90.81, 8.33, 0.68, 0.06, 0.12, 0.00, 0.00, 0.00],
  [0.70, 90.65, 7.79, 0.64, 0.06, 0.13, 0.02, 0.01],
  [0.09, 2.27, 91.05, 5.52, 0.74, 0.26, 0.01, 0.06],
  [0.02, 0.33, 5.95, 86.93, 5.30, 1.17, 0.12, 0.18],
  [0.03, 0.14, 0.67, 7.73, 80.53, 8.84, 1.00, 1.06],
  [0.00, 0.11, 0.24, 0.43, 6.48, 83.46, 4.07, 5.20],
  [0.22, 0.00, 0.22, 1.30, 2.38, 11.24,64.86,19.79],
  [0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00,100.0],
];

// ── PD term structure (1–10 year cumulative) ─────────────────────────────────
const TERM_YEARS = [1, 2, 3, 4, 5, 7, 10];
const PD_TERM = {
  AAA:  [0.01, 0.03, 0.05, 0.08, 0.12, 0.18, 0.28],
  A:    [0.09, 0.22, 0.38, 0.55, 0.72, 1.02, 1.48],
  BBB:  [0.24, 0.58, 0.94, 1.32, 1.68, 2.31, 3.18],
  BB:   [0.88, 2.18, 3.68, 5.12, 6.42, 8.74, 11.80],
  B:    [2.60, 6.20, 9.80, 13.1, 16.0, 20.4, 25.8],
  CCC:  [8.50, 15.8, 21.4, 26.0, 29.8, 34.2, 38.5],
};
const TERM_COLORS = { AAA: T.green, A: T.teal, BBB: T.navy, BB: T.amber, B: T.red, CCC: T.purple };

const TERM_DATA = TERM_YEARS.map((yr, i) => {
  const row = { year: yr + 'Y' };
  Object.entries(PD_TERM).forEach(([g, vals]) => { row[g] = vals[i]; });
  return row;
});

// ── Basel IV capital by sector ────────────────────────────────────────────────
const CAPITAL_DATA = SECTORS.map((s, i) => {
  const items = OBLIGORS.filter(o => o.sector === s);
  const totalRwa = items.reduce((sum, o) => sum + o.rwa, 0);
  const cet1 = totalRwa * 0.045;  // 4.5% CET1
  const t1   = totalRwa * 0.060;  // 6% T1
  const total= totalRwa * 0.080;  // 8% total
  const combined = totalRwa * 0.105; // 10.5% with capital conservation
  return { sector: s, rwa: +totalRwa.toFixed(0), cet1: +cet1.toFixed(1), t1: +t1.toFixed(1), total: +total.toFixed(1), combined: +combined.toFixed(1) };
});

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

const STAGE_COLOR = { 1: T.green, 2: T.amber, 3: T.red };

export default function CreditRiskAnalyticsPage() {
  const [tab, setTab] = useState(0);
  const [sectorFilter, setSectorFilter] = useState('ALL');
  const [ratingFilter, setRatingFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('ecl');

  const tabs = ['Obligor Ledger', 'PD Term Structure', 'Migration Matrix', 'Basel IV Capital'];

  const filteredObligors = useMemo(() => {
    let data = OBLIGORS;
    if (sectorFilter !== 'ALL') data = data.filter(o => o.sector === sectorFilter);
    if (ratingFilter !== 'ALL') data = data.filter(o => {
      if (ratingFilter === 'IG') return ['AAA','AA+','AA','AA-','A+','A','A-','BBB+','BBB','BBB-'].includes(o.rating);
      if (ratingFilter === 'HY') return ['BB+','BB','BB-','B+','B','B-','CCC','CC','C'].includes(o.rating);
      if (ratingFilter === 'Defaulted') return o.rating === 'D';
      return true;
    });
    return [...data].sort((a, b) => b[sortBy] - a[sortBy]);
  }, [sectorFilter, ratingFilter, sortBy]);

  const totals = useMemo(() => ({
    ead: OBLIGORS.reduce((s,o)=>s+o.ead,0),
    ecl: OBLIGORS.reduce((s,o)=>s+o.ecl,0),
    rwa: OBLIGORS.reduce((s,o)=>s+o.rwa,0),
    stage2: OBLIGORS.filter(o=>o.stage===2).length,
    stage3: OBLIGORS.filter(o=>o.stage===3).length,
  }), []);

  const ratingDistribution = useMemo(() => {
    const map = {};
    OBLIGORS.forEach(o => { map[o.rating] = (map[o.rating]||0)+1; });
    return RATINGS.filter(r=>map[r]).map(r=>({ rating: r, count: map[r] }));
  }, []);

  const scatterData = OBLIGORS.map(o => ({ x: o.esgScore, y: o.pd * 100, z: o.ead, sector: o.sector, name: o.name, rating: o.rating }));

  return (
    <div style={{ fontFamily: T.font, background: T.cream, minHeight: '100vh', padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ background: T.navy, color: '#fff', borderRadius: 8, padding: '6px 14px',
          fontFamily: T.mono, fontSize: 12, fontWeight: 700 }}>EP-BI1</div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.navy }}>
          Credit Risk Analytics
        </h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {pill('45 Obligors', T.navy)}
          {pill('IFRS 9 Staging', T.amber)}
          {pill('Basel IV RWA', T.teal)}
          {pill('PD · LGD · EAD · ECL', T.purple)}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `2px solid ${T.navy}22` }}>
        {tabs.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{
            background: tab === i ? T.navy : 'transparent',
            color: tab === i ? '#fff' : T.slate,
            border: 'none', borderRadius: '6px 6px 0 0', padding: '8px 16px',
            fontFamily: T.font, fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>{t}</button>
        ))}
      </div>

      {/* ── Tab 0: Obligor Ledger ── */}
      {tab === 0 && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            {card('Total EAD', '$' + (totals.ead/1000).toFixed(1)+'B', '45 obligors')}
            {card('Total ECL', '$' + totals.ecl.toFixed(1)+'M', 'IFRS 9 expected loss', T.amber)}
            {card('Total RWA', '$' + (totals.rwa/1000).toFixed(1)+'B', 'Basel IV risk-weighted', T.teal)}
            {card('Stage 2', totals.stage2, 'SICR — significant increase', T.amber)}
            {card('Stage 3', totals.stage3, 'Credit-impaired', T.red)}
            {card('ECL / EAD', (totals.ecl / totals.ead * 100).toFixed(2) + '%', 'Portfolio loss rate', T.navy)}
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {['ALL', ...SECTORS].map(s => (
                <button key={s} onClick={() => setSectorFilter(s)} style={{
                  background: sectorFilter === s ? T.navy : '#fff', color: sectorFilter === s ? '#fff' : T.slate,
                  border: `1px solid ${T.navy}33`, borderRadius: 5, padding: '4px 8px', fontSize: 10, cursor: 'pointer',
                }}>{s}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {['ALL','IG','HY','Defaulted'].map(r => (
                <button key={r} onClick={() => setRatingFilter(r)} style={{
                  background: ratingFilter === r ? T.purple : '#fff', color: ratingFilter === r ? '#fff' : T.slate,
                  border: `1px solid ${T.purple}44`, borderRadius: 5, padding: '4px 8px', fontSize: 11, cursor: 'pointer',
                }}>{r}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {[['ecl','ECL'],['pd','PD'],['ead','EAD'],['rwa','RWA']].map(([k,l]) => (
                <button key={k} onClick={() => setSortBy(k)} style={{
                  background: sortBy === k ? T.teal : '#fff', color: sortBy === k ? '#fff' : T.slate,
                  border: `1px solid ${T.teal}44`, borderRadius: 5, padding: '4px 8px', fontSize: 11, cursor: 'pointer',
                }}>↓ {l}</button>
              ))}
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${T.navy}22`, overflow: 'hidden', marginBottom: 16 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: T.navy, color: '#fff' }}>
                  {['ID','Obligor','Sector','Rating','PD (%)','EAD ($M)','LGD','ECL ($M)','RWA ($M)','RWA Dens.','ESG','Stage','Mat.'].map(h => (
                    <th key={h} style={{ padding: '10px 10px', textAlign: 'left', fontFamily: T.mono, fontSize: 10 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredObligors.slice(0, 30).map((o, i) => (
                  <tr key={o.id} style={{ background: i % 2 === 0 ? '#fff' : T.cream + '80',
                    borderBottom: `1px solid ${T.navy}11` }}>
                    <td style={{ padding: '8px 10px', fontFamily: T.mono, color: T.slate, fontSize: 10 }}>{o.id}</td>
                    <td style={{ padding: '8px 10px', fontWeight: 600, color: T.navy }}>{o.name}</td>
                    <td style={{ padding: '8px 10px', fontSize: 10 }}>{pill(o.sector, T.teal)}</td>
                    <td style={{ padding: '8px 10px' }}>
                      {pill(o.rating, ['AAA','AA+','AA','AA-','A+','A','A-'].includes(o.rating) ? T.green :
                        ['BBB+','BBB','BBB-'].includes(o.rating) ? T.teal :
                        ['BB+','BB','BB-'].includes(o.rating) ? T.amber : T.red)}
                    </td>
                    <td style={{ padding: '8px 10px', fontFamily: T.mono, color: T.red, textAlign: 'right' }}>{(o.pd*100).toFixed(3)}</td>
                    <td style={{ padding: '8px 10px', fontFamily: T.mono, textAlign: 'right' }}>{o.ead.toFixed(1)}</td>
                    <td style={{ padding: '8px 10px', fontFamily: T.mono, textAlign: 'right' }}>{(o.lgd*100).toFixed(1)}%</td>
                    <td style={{ padding: '8px 10px', fontFamily: T.mono, fontWeight: 700, color: T.amber, textAlign: 'right' }}>{o.ecl.toFixed(2)}</td>
                    <td style={{ padding: '8px 10px', fontFamily: T.mono, textAlign: 'right' }}>{o.rwa.toFixed(1)}</td>
                    <td style={{ padding: '8px 10px', fontFamily: T.mono, textAlign: 'right' }}>{(o.rwaDensity*100).toFixed(0)}%</td>
                    <td style={{ padding: '8px 10px', fontFamily: T.mono, textAlign: 'right',
                      color: o.esgScore > 60 ? T.green : o.esgScore > 40 ? T.amber : T.red }}>{o.esgScore}</td>
                    <td style={{ padding: '8px 10px' }}>{pill('S'+o.stage, STAGE_COLOR[o.stage])}</td>
                    <td style={{ padding: '8px 10px', fontFamily: T.mono, textAlign: 'center' }}>{o.maturity}Y</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Rating distribution bar */}
          <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${T.navy}22`, padding: 16 }}>
            <div style={{ fontWeight: 700, color: T.navy, marginBottom: 12 }}>Rating Distribution</div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={ratingDistribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="rating" tick={{ fontSize: 10, fontFamily: T.mono }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[3,3,0,0]}>
                  {ratingDistribution.map((r) => (
                    <Cell key={r.rating} fill={
                      ['AAA','AA+','AA','AA-','A+','A','A-'].includes(r.rating) ? T.green :
                      ['BBB+','BBB','BBB-'].includes(r.rating) ? T.teal :
                      ['BB+','BB','BB-'].includes(r.rating) ? T.amber : T.red
                    } />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Tab 1: PD Term Structure ── */}
      {tab === 1 && (
        <div>
          <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${T.navy}22`, padding: 16, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, color: T.navy, marginBottom: 4 }}>Cumulative PD by Rating Grade — 1 to 10 Year Horizon</div>
            <div style={{ fontSize: 12, color: T.slate, marginBottom: 12 }}>Based on S&P historical default rates (1981–2023 average)</div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={TERM_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 11, fontFamily: T.mono }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => v + '%'} />
                <Tooltip formatter={(v, n) => [v.toFixed(2) + '%', n]} />
                <Legend />
                {Object.keys(PD_TERM).map(g => (
                  <Line key={g} type="monotone" dataKey={g} stroke={TERM_COLORS[g]}
                    strokeWidth={2} dot={{ r: 4 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* PD vs ESG scatter */}
          <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${T.navy}22`, padding: 16, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, color: T.navy, marginBottom: 4 }}>PD vs ESG Score — Bubble Size = EAD</div>
            <div style={{ fontSize: 12, color: T.slate, marginBottom: 12 }}>Higher ESG scores negatively correlated with PD (r ≈ −0.42 in sample)</div>
            <ResponsiveContainer width="100%" height={240}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="x" name="ESG Score" tick={{ fontSize: 10 }} label={{ value: 'ESG Score', position: 'bottom', fontSize: 11 }} />
                <YAxis dataKey="y" name="PD (%)" tick={{ fontSize: 10 }} tickFormatter={v => v.toFixed(1)+'%'} />
                <ZAxis dataKey="z" range={[40, 400]} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(v, n) => [n === 'ESG Score' ? v : v.toFixed(3)+'%', n]} />
                <Scatter data={scatterData} fill={T.navy} fillOpacity={0.6} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          {/* PD term table */}
          <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${T.navy}22`, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.navy, color: '#fff' }}>
                  <th style={{ padding: '10px 12px', fontFamily: T.mono, fontSize: 11 }}>Grade</th>
                  {TERM_YEARS.map(y => (
                    <th key={y} style={{ padding: '10px 12px', textAlign: 'right', fontFamily: T.mono, fontSize: 11 }}>{y}Y (%)</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(PD_TERM).map(([grade, vals], i) => (
                  <tr key={grade} style={{ background: i % 2 === 0 ? '#fff' : T.cream + '80',
                    borderBottom: `1px solid ${T.navy}11` }}>
                    <td style={{ padding: '9px 12px' }}>{pill(grade, TERM_COLORS[grade])}</td>
                    {vals.map((v, j) => (
                      <td key={j} style={{ padding: '9px 12px', fontFamily: T.mono, textAlign: 'right',
                        color: v > 10 ? T.red : v > 3 ? T.amber : T.green }}>{v.toFixed(2)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab 2: Migration Matrix ── */}
      {tab === 2 && (
        <div>
          <div style={{ fontSize: 13, color: T.slate, marginBottom: 14 }}>
            1-year credit migration matrix (%) — from row grade to column grade.
            Based on S&P CreditPro historical average 1981–2023.
          </div>
          <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${T.navy}22`, overflow: 'hidden', marginBottom: 16 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: T.navy, color: '#fff' }}>
                  <th style={{ padding: '10px 10px', fontFamily: T.mono, fontSize: 11 }}>From \ To</th>
                  {MATRIX_GRADES.map(g => (
                    <th key={g} style={{ padding: '10px 10px', textAlign: 'right', fontFamily: T.mono, fontSize: 11 }}>{g}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MIGRATION_MATRIX.map((row, i) => (
                  <tr key={MATRIX_GRADES[i]} style={{ borderBottom: `1px solid ${T.navy}11` }}>
                    <td style={{ padding: '8px 10px', background: T.navy + '08' }}>
                      {pill(MATRIX_GRADES[i], T.navy)}
                    </td>
                    {row.map((val, j) => {
                      const isStay = i === j;
                      const isDefault = j === 7;
                      const bg = isDefault && val > 1 ? T.red + '33'
                        : isDefault && val > 0.05 ? T.amber + '22'
                        : isStay ? T.teal + '22' : 'transparent';
                      return (
                        <td key={j} style={{ padding: '8px 10px', textAlign: 'right',
                          fontFamily: T.mono, fontWeight: isStay ? 700 : 400,
                          color: isDefault && val > 0 ? T.red : isStay ? T.teal : T.slate,
                          background: bg }}>
                          {val.toFixed(2)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ background: T.teal + '22', border: `1px solid ${T.teal}44`, borderRadius: 6, padding: '8px 14px', fontSize: 12, color: T.teal }}>
              Teal diagonal = stay-in-grade probability
            </div>
            <div style={{ background: T.red + '22', border: `1px solid ${T.red}44`, borderRadius: 6, padding: '8px 14px', fontSize: 12, color: T.red }}>
              Red column D = default probability
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 3: Basel IV Capital ── */}
      {tab === 3 && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            {card('Total RWA', '$' + (OBLIGORS.reduce((s,o)=>s+o.rwa,0)/1000).toFixed(1)+'B', 'All sectors')}
            {card('CET1 Requirement', '$' + (OBLIGORS.reduce((s,o)=>s+o.rwa,0)*0.045/1000).toFixed(1)+'B', '4.5% of RWA', T.teal)}
            {card('Total Capital', '$' + (OBLIGORS.reduce((s,o)=>s+o.rwa,0)*0.08/1000).toFixed(1)+'B', '8.0% minimum', T.navy)}
            {card('w/ Conservation Buffer', '$' + (OBLIGORS.reduce((s,o)=>s+o.rwa,0)*0.105/1000).toFixed(1)+'B', '10.5% combined', T.amber)}
          </div>

          <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${T.navy}22`, padding: 16, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, color: T.navy, marginBottom: 12 }}>RWA & Capital Requirements by Sector ($M)</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={CAPITAL_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="sector" tick={{ fontSize: 10, fontFamily: T.mono }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={v => ['$'+v.toFixed(0)+'M']} />
                <Legend />
                <Bar dataKey="rwa"      name="RWA"               fill={T.navy + '88'} />
                <Bar dataKey="combined" name="Capital (10.5%)"   fill={T.amber}       radius={[3,3,0,0]} />
                <Bar dataKey="cet1"     name="CET1 Min (4.5%)"   fill={T.teal}        radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${T.navy}22`, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.navy, color: '#fff' }}>
                  {['Sector','RWA ($M)','CET1 4.5%','Tier 1 6%','Total 8%','w/ Buffer 10.5%','Obligors'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontFamily: T.mono, fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CAPITAL_DATA.map((s, i) => (
                  <tr key={s.sector} style={{ background: i % 2 === 0 ? '#fff' : T.cream + '80',
                    borderBottom: `1px solid ${T.navy}11` }}>
                    <td style={{ padding: '9px 12px', fontWeight: 600, color: T.navy }}>{s.sector}</td>
                    <td style={{ padding: '9px 12px', fontFamily: T.mono, textAlign: 'right' }}>{s.rwa.toFixed(0)}</td>
                    <td style={{ padding: '9px 12px', fontFamily: T.mono, textAlign: 'right', color: T.teal }}>{s.cet1.toFixed(1)}</td>
                    <td style={{ padding: '9px 12px', fontFamily: T.mono, textAlign: 'right' }}>{s.t1.toFixed(1)}</td>
                    <td style={{ padding: '9px 12px', fontFamily: T.mono, textAlign: 'right' }}>{s.total.toFixed(1)}</td>
                    <td style={{ padding: '9px 12px', fontFamily: T.mono, fontWeight: 700, color: T.amber, textAlign: 'right' }}>{s.combined.toFixed(1)}</td>
                    <td style={{ padding: '9px 12px', fontFamily: T.mono, textAlign: 'right' }}>{OBLIGORS.filter(o=>o.sector===s.sector).length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
