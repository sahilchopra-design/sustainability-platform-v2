import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
  ScatterChart, Scatter, CartesianGrid, Legend, LineChart, Line, ReferenceLine,
} from 'recharts';

const T = {
  bg: '#f6f4f0', surface: '#ffffff', border: '#e5e0d8', navy: '#1b3a5c',
  gold: '#c5a96a', textSec: '#5c6b7e', textMut: '#9aa3ae',
  red: '#dc2626', green: '#16a34a', amber: '#d97706', blue: '#2563eb',
  teal: '#0891b2', purple: '#7c3aed',
  font: "'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono: "'JetBrains Mono','SF Mono','Fira Code',monospace",
};

function sr(seed) { let s = seed; return () => { s = (s * 16807 + 0) % 2147483647; return s / 2147483647; }; }

const TABS = ['Portfolio Overview', 'Use of Proceeds', 'Impact Metrics', 'Greenium Analysis', 'EU GBS Alignment'];

/* ── seed data ── */
const r = sr(4207);
const issuers = [
  'Republic of France','EIB','Iberdrola','Apple Inc','KfW','World Bank','City of Paris',
  'Engie SA','TenneT','Orsted','Republic of Germany','ICBC','SSE plc','Bank of China',
  'Enel SpA','Toyota Motor','Nordic Inv Bank','CLP Holdings','ADB','State of NRW',
];
const ratings = ['AAA','AA+','AA','AA-','A+','A','A-','BBB+','BBB'];
const frameworks = ['ICMA GBP','CBI Certified','EU GBS','Sustainability Bond Framework','Green Bond Framework'];
const spoProviders = ['Sustainalytics','Vigeo Eiris','CICERO','ISS ESG','S&P Global','Moody\'s'];
const uopCategories = ['Renewable Energy','Clean Transport','Energy Efficiency','Green Buildings','Water Management','Pollution Prevention','Biodiversity','Adaptation'];
const sectorTypes = ['Sovereign','Corporate','Supranational','Municipal'];

const holdings = issuers.map((iss, i) => {
  const rv = r();
  return {
    id: i + 1,
    issuer: iss,
    isin: `XS${String(1000000000 + Math.floor(r() * 9000000000)).slice(0,10)}`,
    amount: Math.round(50 + r() * 400),
    coupon: +(1.5 + r() * 4.5).toFixed(2),
    maturity: `${2026 + Math.floor(r() * 12)}-${String(1 + Math.floor(r() * 12)).padStart(2,'0')}-15`,
    rating: ratings[Math.floor(rv * ratings.length)],
    framework: frameworks[Math.floor(r() * frameworks.length)],
    spo: spoProviders[Math.floor(r() * spoProviders.length)],
    uop: uopCategories[Math.floor(r() * uopCategories.length)],
    sector: sectorTypes[Math.floor(r() * sectorTypes.length)],
    greenSpread: +(80 + r() * 120).toFixed(1),
    convSpread: +(90 + r() * 130).toFixed(1),
    allocPct: +(60 + r() * 40).toFixed(1),
  };
});
holdings.forEach(h => { h.greenium = +(h.greenSpread - h.convSpread).toFixed(1); h.zScore = +((h.greenium + 8) / 5).toFixed(2); });
const totalAUM = holdings.reduce((s, h) => s + h.amount, 0);

const uopBreakdown = [
  { category: 'Renewable Energy', pct: 35 }, { category: 'Clean Transport', pct: 20 },
  { category: 'Energy Efficiency', pct: 15 }, { category: 'Green Buildings', pct: 12 },
  { category: 'Water Management', pct: 8 }, { category: 'Pollution Prevention', pct: 5 },
  { category: 'Biodiversity', pct: 3 }, { category: 'Adaptation', pct: 2 },
];

const quarterlyDeploy = ['Q1-24','Q2-24','Q3-24','Q4-24','Q1-25','Q2-25','Q3-25','Q4-25'].map(q => {
  const rv2 = sr(q.charCodeAt(1) * 31 + q.charCodeAt(3) * 7);
  return { quarter: q, 'Renewable Energy': Math.round(rv2() * 120 + 80), 'Clean Transport': Math.round(rv2() * 60 + 30),
    'Energy Efficiency': Math.round(rv2() * 50 + 20), 'Other': Math.round(rv2() * 40 + 15) };
});

const sectorPie = sectorTypes.map(s => ({ name: s, value: holdings.filter(h => h.sector === s).reduce((a, h) => a + h.amount, 0) }));

const greeniumTS = Array.from({ length: 24 }, (_, i) => {
  const rv3 = sr(7700 + i * 13);
  return { month: `${2024 + Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, '0')}`, bps: +(-12 + rv3() * 10).toFixed(1) };
});

const impactSectors = ['Renewable Energy','Clean Transport','Energy Efficiency','Green Buildings','Water Mgmt'].map(s => {
  const rv4 = sr(s.charCodeAt(0) * 97);
  return { sector: s, tCO2perM: Math.round(rv4() * 800 + 200), MWhperM: Math.round(rv4() * 2000 + 500) };
});

const COLORS = [T.navy, T.gold, T.teal, T.blue, T.green, T.amber, T.purple, T.red];
const PILLAR_COLORS = { pass: T.green, partial: T.amber, fail: T.red };

/* ── styles ── */
const sx = {
  page: { fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: '24px 32px', color: T.navy },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  h1: { fontSize: 22, fontWeight: 700, margin: 0 },
  stamp: { fontFamily: T.mono, fontSize: 11, color: T.textMut, letterSpacing: 0.5 },
  goldLine: { height: 2, background: `linear-gradient(90deg, ${T.gold}, transparent)`, marginBottom: 20 },
  tabBar: { display: 'flex', gap: 0, borderBottom: `1px solid ${T.border}`, marginBottom: 20 },
  tab: (a) => ({
    padding: '10px 20px', fontSize: 13, fontWeight: a ? 700 : 500, cursor: 'pointer', border: 'none',
    borderBottom: a ? `2px solid ${T.gold}` : '2px solid transparent', background: 'none', color: a ? T.navy : T.textSec,
    fontFamily: T.font, transition: 'all .15s',
  }),
  card: { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 20, marginBottom: 16 },
  kpiRow: { display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 18 },
  kpi: { flex: '1 1 160px', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: '14px 18px' },
  kpiLabel: { fontSize: 11, fontWeight: 600, color: T.textMut, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  kpiVal: { fontSize: 22, fontWeight: 700, fontFamily: T.mono, color: T.navy },
  tbl: { width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.mono },
  th: { textAlign: 'left', padding: '8px 10px', fontWeight: 600, fontSize: 11, textTransform: 'uppercase',
    color: T.textMut, borderBottom: `2px solid ${T.border}`, letterSpacing: 0.6 },
  td: { padding: '7px 10px', borderBottom: `1px solid ${T.border}`, color: T.navy, fontSize: 12 },
  sectionTitle: { fontSize: 14, fontWeight: 700, marginBottom: 12, color: T.navy },
  badge: (c) => ({
    display: 'inline-block', padding: '2px 8px', borderRadius: 3, fontSize: 10, fontWeight: 700,
    background: c === 'green' ? '#dcfce7' : c === 'amber' ? '#fef3c7' : c === 'red' ? '#fee2e2' : '#e0e7ff',
    color: c === 'green' ? T.green : c === 'amber' ? T.amber : c === 'red' ? T.red : T.blue,
  }),
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 },
  pill: (a) => ({
    display: 'inline-block', padding: '3px 10px', borderRadius: 12, fontSize: 10, fontWeight: 600,
    background: a ? T.green : T.red, color: '#fff', marginRight: 6,
  }),
};

const Kpi = ({ label, value, sub }) => (
  <div style={sx.kpi}>
    <div style={sx.kpiLabel}>{label}</div>
    <div style={sx.kpiVal}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{sub}</div>}
  </div>
);

const ratingColor = (rt) => rt.startsWith('AAA') ? T.green : rt.startsWith('AA') ? T.teal : rt.startsWith('A') ? T.blue : T.amber;

/* ── Tab 1: Portfolio Overview ── */
function PortfolioOverview() {
  return (
    <>
      <div style={sx.kpiRow}>
        <Kpi label="Total Green Bonds AUM" value={`$${(totalAUM / 1000).toFixed(1)}B`} sub={`${holdings.length} holdings`} />
        <Kpi label="Average Yield" value="4.12%" sub="Weighted by notional" />
        <Kpi label="Average Greenium" value="-8 bps" sub="vs conventional peers" />
        <Kpi label="ICMA Compliance" value="94%" sub="15 of 16 aligned" />
        <Kpi label="Avg Maturity" value="5.3 yr" sub="Duration-weighted" />
      </div>

      <div style={sx.grid2}>
        <div style={sx.card}>
          <div style={sx.sectionTitle}>Holdings Register</div>
          <div style={{ overflowX: 'auto', maxHeight: 420 }}>
            <table style={sx.tbl}>
              <thead>
                <tr>
                  {['#','Issuer','ISIN','Amt ($M)','Cpn','Maturity','Rating','Framework','SPO','UoP'].map(h => (
                    <th key={h} style={sx.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {holdings.slice(0, 16).map(h => (
                  <tr key={h.id} style={{ background: h.id % 2 === 0 ? '#fafaf7' : 'transparent' }}>
                    <td style={sx.td}>{h.id}</td>
                    <td style={{ ...sx.td, fontFamily: T.font, fontWeight: 600, minWidth: 130 }}>{h.issuer}</td>
                    <td style={sx.td}>{h.isin}</td>
                    <td style={{ ...sx.td, textAlign: 'right' }}>{h.amount}</td>
                    <td style={sx.td}>{h.coupon}%</td>
                    <td style={sx.td}>{h.maturity}</td>
                    <td style={sx.td}><span style={{ color: ratingColor(h.rating), fontWeight: 700 }}>{h.rating}</span></td>
                    <td style={{ ...sx.td, fontFamily: T.font, fontSize: 11 }}>{h.framework}</td>
                    <td style={{ ...sx.td, fontFamily: T.font, fontSize: 11 }}>{h.spo}</td>
                    <td style={{ ...sx.td, fontFamily: T.font, fontSize: 10 }}>{h.uop}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={sx.card}>
          <div style={sx.sectionTitle}>Sector Allocation</div>
          <ResponsiveContainer width="100%" height={340}>
            <PieChart>
              <Pie data={sectorPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={{ stroke: T.textMut }} stroke={T.surface} strokeWidth={2}>
                {sectorPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => `$${v}M`} contentStyle={{ fontFamily: T.mono, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}

/* ── Tab 2: Use of Proceeds ── */
function UseOfProceeds() {
  const unallocated = holdings.map(h => ({ issuer: h.issuer, unalloc: +(100 - h.allocPct).toFixed(1), allocated: +h.allocPct }));
  return (
    <>
      <div style={sx.grid2}>
        <div style={sx.card}>
          <div style={sx.sectionTitle}>Category Breakdown (%)</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={uopBreakdown} layout="vertical" margin={{ left: 120 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" domain={[0, 40]} tick={{ fontFamily: T.mono, fontSize: 11 }} />
              <YAxis dataKey="category" type="category" tick={{ fontFamily: T.font, fontSize: 11 }} width={115} />
              <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 12 }} />
              <Bar dataKey="pct" fill={T.teal} radius={[0, 4, 4, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={sx.card}>
          <div style={sx.sectionTitle}>Quarterly Deployment ($M)</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={quarterlyDeploy}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="quarter" tick={{ fontFamily: T.mono, fontSize: 11 }} />
              <YAxis tick={{ fontFamily: T.mono, fontSize: 11 }} />
              <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11, fontFamily: T.font }} />
              <Bar dataKey="Renewable Energy" stackId="a" fill={T.green} />
              <Bar dataKey="Clean Transport" stackId="a" fill={T.blue} />
              <Bar dataKey="Energy Efficiency" stackId="a" fill={T.amber} />
              <Bar dataKey="Other" stackId="a" fill={T.textMut} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={sx.card}>
        <div style={sx.sectionTitle}>Per-Bond Proceeds Allocation</div>
        <table style={sx.tbl}>
          <thead>
            <tr>
              {['Issuer','Amount ($M)','Primary UoP','Allocated (%)','Unallocated (%)','Status'].map(h => (
                <th key={h} style={sx.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {holdings.slice(0, 16).map((h, i) => {
              const ua = (100 - h.allocPct).toFixed(1);
              return (
                <tr key={i} style={{ background: i % 2 === 0 ? '#fafaf7' : 'transparent' }}>
                  <td style={{ ...sx.td, fontFamily: T.font, fontWeight: 600 }}>{h.issuer}</td>
                  <td style={{ ...sx.td, textAlign: 'right' }}>{h.amount}</td>
                  <td style={{ ...sx.td, fontFamily: T.font }}>{h.uop}</td>
                  <td style={{ ...sx.td, textAlign: 'right' }}>{h.allocPct}%</td>
                  <td style={{ ...sx.td, textAlign: 'right', color: ua > 15 ? T.amber : T.textSec }}>{ua}%</td>
                  <td style={sx.td}>
                    <span style={sx.badge(ua > 15 ? 'amber' : 'green')}>{ua > 15 ? 'PARTIAL' : 'FULLY ALLOCATED'}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={sx.card}>
        <div style={sx.sectionTitle}>Unallocated Proceeds Tracker</div>
        <div style={sx.kpiRow}>
          <Kpi label="Total Unallocated" value={`$${Math.round(holdings.reduce((s, h) => s + h.amount * (100 - h.allocPct) / 100, 0))}M`} sub="Across all holdings" />
          <Kpi label="Avg Allocation Rate" value={`${(holdings.reduce((s, h) => s + h.allocPct, 0) / holdings.length).toFixed(1)}%`} sub="Portfolio weighted" />
          <Kpi label="Bonds Below 80% Alloc" value={holdings.filter(h => h.allocPct < 80).length} sub="Require attention" />
        </div>
      </div>
    </>
  );
}

/* ── Tab 3: Impact Metrics ── */
function ImpactMetrics() {
  const perBondImpact = holdings.slice(0, 16).map(h => {
    const rv5 = sr(h.id * 331);
    return {
      ...h, tCO2: Math.round(rv5() * 120000 + 10000), mwh: Math.round(rv5() * 400000 + 50000),
      sqm: Math.round(rv5() * 50000), km: Math.round(rv5() * 150), liters: Math.round(rv5() * 3000000),
    };
  });
  return (
    <>
      <div style={sx.kpiRow}>
        <Kpi label="tCO2 Avoided" value="1.2M" sub="Lifetime estimated" />
        <Kpi label="MWh Clean Energy" value="3.8M" sub="Annual generation" />
        <Kpi label="m2 Green Buildings" value="450K" sub="Certified area" />
        <Kpi label="km Clean Transport" value="1,200" sub="Infrastructure built" />
        <Kpi label="Liters Water Treated" value="28M" sub="Annual capacity" />
      </div>

      <div style={sx.grid2}>
        <div style={sx.card}>
          <div style={sx.sectionTitle}>Impact Intensity by Sector (per $M Invested)</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={impactSectors}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="sector" tick={{ fontFamily: T.font, fontSize: 10 }} />
              <YAxis yAxisId="l" tick={{ fontFamily: T.mono, fontSize: 11 }} />
              <YAxis yAxisId="r" orientation="right" tick={{ fontFamily: T.mono, fontSize: 11 }} />
              <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11, fontFamily: T.font }} />
              <Bar yAxisId="l" dataKey="tCO2perM" fill={T.navy} name="tCO2/$M" barSize={20} radius={[4, 4, 0, 0]} />
              <Bar yAxisId="r" dataKey="MWhperM" fill={T.gold} name="MWh/$M" barSize={20} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={sx.card}>
          <div style={sx.sectionTitle}>Per-Bond Impact Summary</div>
          <div style={{ overflowX: 'auto', maxHeight: 320 }}>
            <table style={sx.tbl}>
              <thead>
                <tr>
                  {['Issuer','Amt ($M)','tCO2 Avoided','MWh Generated','m2 Certified','km Infra'].map(h => (
                    <th key={h} style={sx.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {perBondImpact.map((h, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#fafaf7' : 'transparent' }}>
                    <td style={{ ...sx.td, fontFamily: T.font, fontWeight: 600 }}>{h.issuer}</td>
                    <td style={{ ...sx.td, textAlign: 'right' }}>{h.amount}</td>
                    <td style={{ ...sx.td, textAlign: 'right' }}>{h.tCO2.toLocaleString()}</td>
                    <td style={{ ...sx.td, textAlign: 'right' }}>{h.mwh.toLocaleString()}</td>
                    <td style={{ ...sx.td, textAlign: 'right' }}>{h.sqm.toLocaleString()}</td>
                    <td style={{ ...sx.td, textAlign: 'right' }}>{h.km}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div style={sx.card}>
        <div style={sx.sectionTitle}>Impact per $M Invested Benchmarking</div>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {[
            { label: 'tCO2/$M', port: 428, bench: 380, unit: 'tonnes' },
            { label: 'MWh/$M', port: 1357, bench: 1100, unit: 'MWh' },
            { label: 'm2/$M', port: 161, bench: 130, unit: 'm2' },
          ].map(b => (
            <div key={b.label} style={{ flex: '1 1 200px', padding: 14, background: '#f8f7f4', borderRadius: 6, border: `1px solid ${T.border}` }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>{b.label}</div>
              <div style={{ fontFamily: T.mono, fontSize: 18, fontWeight: 700, color: b.port > b.bench ? T.green : T.amber }}>{b.port}</div>
              <div style={{ fontSize: 11, color: T.textSec }}>Benchmark: {b.bench} {b.unit}</div>
              <div style={{ fontSize: 11, color: b.port > b.bench ? T.green : T.amber, fontWeight: 600 }}>
                {b.port > b.bench ? '+' : ''}{((b.port - b.bench) / b.bench * 100).toFixed(1)}% vs peer median
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ── Tab 4: Greenium Analysis ── */
function GreeniumAnalysis() {
  const scatterData = holdings.map(h => ({
    name: h.issuer, greenSpread: h.greenSpread, convSpread: h.convSpread, greenium: h.greenium, amount: h.amount,
  }));
  const histBuckets = ['-20 to -15','-15 to -10','-10 to -5','-5 to 0','0 to 5','5 to 10'].map(b => {
    const lo = parseInt(b); const hi = lo + 5;
    return { bucket: b, count: holdings.filter(h => h.greenium >= lo && h.greenium < hi).length };
  });
  const byRating = ['AAA','AA','A','BBB'].map(rt => ({
    tier: rt, avg: +(holdings.filter(h => h.rating.startsWith(rt)).reduce((s, h, _, a) => s + h.greenium / a.length, 0)).toFixed(1) || +(- 3 - r() * 10).toFixed(1),
  }));
  const byMaturity = ['1-3yr','3-5yr','5-7yr','7-10yr','10yr+'].map((b, i) => ({
    bucket: b, greenium: +(-4 - i * 1.8 + r() * 3).toFixed(1),
  }));
  return (
    <>
      <div style={sx.grid2}>
        <div style={sx.card}>
          <div style={sx.sectionTitle}>Green vs Conventional Spread (bps)</div>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="convSpread" name="Conv Spread" unit=" bps" tick={{ fontFamily: T.mono, fontSize: 11 }} />
              <YAxis dataKey="greenSpread" name="Green Spread" unit=" bps" tick={{ fontFamily: T.mono, fontSize: 11 }} />
              <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11 }} formatter={(v, n) => [`${v} bps`, n]} />
              <Scatter data={scatterData} fill={T.teal}>
                {scatterData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Scatter>
              <ReferenceLine segment={[{ x: 80, y: 80 }, { x: 220, y: 220 }]} stroke={T.textMut} strokeDasharray="5 5" label="Parity" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div style={sx.card}>
          <div style={sx.sectionTitle}>Greenium Distribution (bps)</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={histBuckets}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="bucket" tick={{ fontFamily: T.mono, fontSize: 10 }} />
              <YAxis tick={{ fontFamily: T.mono, fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 12 }} />
              <Bar dataKey="count" fill={T.navy} radius={[4, 4, 0, 0]} barSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={sx.grid2}>
        <div style={sx.card}>
          <div style={sx.sectionTitle}>Greenium Evolution (24mo)</div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={greeniumTS}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="month" tick={{ fontFamily: T.mono, fontSize: 10 }} />
              <YAxis tick={{ fontFamily: T.mono, fontSize: 11 }} domain={[-16, 2]} />
              <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 12 }} />
              <ReferenceLine y={0} stroke={T.textMut} strokeDasharray="4 4" />
              <Line dataKey="bps" stroke={T.navy} strokeWidth={2} dot={{ r: 3, fill: T.gold }} name="Greenium (bps)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={sx.card}>
          <div style={sx.sectionTitle}>Greenium by Rating Tier & Maturity</div>
          <div style={sx.grid2}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>By Rating</div>
              {byRating.map(r => (
                <div key={r.tier} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.border}` }}>
                  <span style={{ fontWeight: 600 }}>{r.tier}</span>
                  <span style={{ fontFamily: T.mono, color: r.avg < 0 ? T.green : T.red }}>{r.avg} bps</span>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>By Maturity</div>
              {byMaturity.map(m => (
                <div key={m.bucket} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.border}` }}>
                  <span style={{ fontWeight: 600 }}>{m.bucket}</span>
                  <span style={{ fontFamily: T.mono, color: m.greenium < 0 ? T.green : T.red }}>{m.greenium} bps</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={sx.card}>
        <div style={sx.sectionTitle}>New Issue Greenium Tracker</div>
        <table style={sx.tbl}>
          <thead>
            <tr>
              {['Issuer','Rating','Green Spread','Conv Spread','Greenium (bps)','Z-Score','Signal'].map(h => (
                <th key={h} style={sx.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {holdings.slice(0, 15).map((h, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? '#fafaf7' : 'transparent' }}>
                <td style={{ ...sx.td, fontFamily: T.font, fontWeight: 600 }}>{h.issuer}</td>
                <td style={sx.td}><span style={{ color: ratingColor(h.rating), fontWeight: 700 }}>{h.rating}</span></td>
                <td style={{ ...sx.td, textAlign: 'right' }}>{h.greenSpread}</td>
                <td style={{ ...sx.td, textAlign: 'right' }}>{h.convSpread}</td>
                <td style={{ ...sx.td, textAlign: 'right', fontWeight: 700, color: h.greenium < 0 ? T.green : T.red }}>
                  {h.greenium > 0 ? '+' : ''}{h.greenium}
                </td>
                <td style={{ ...sx.td, textAlign: 'right' }}>{h.zScore}</td>
                <td style={sx.td}>
                  <span style={sx.badge(h.greenium < -5 ? 'green' : h.greenium < 3 ? 'amber' : 'red')}>
                    {h.greenium < -5 ? 'STRONG' : h.greenium < 3 ? 'NEUTRAL' : 'WIDE'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ── Tab 5: EU GBS Alignment ── */
function EUGBSAlignment() {
  const pillars = [
    { name: 'Taxonomy Alignment', desc: 'Activities eligible under EU Taxonomy Delegated Acts', weight: 30 },
    { name: 'Use of Proceeds', desc: 'Allocation to taxonomy-eligible green expenditures', weight: 25 },
    { name: 'Reporting', desc: 'Annual allocation & impact reporting per EU GBS template', weight: 25 },
    { name: 'External Review', desc: 'Pre- and post-issuance verification by ESMA-registered reviewer', weight: 20 },
  ];
  const bondGBS = holdings.slice(0, 16).map(h => {
    const rv6 = sr(h.id * 577);
    const scores = pillars.map(() => { const v = rv6(); return v > 0.6 ? 'pass' : v > 0.25 ? 'partial' : 'fail'; });
    const pct = Math.round(scores.filter(s => s === 'pass').length / 4 * 70 + scores.filter(s => s === 'partial').length / 4 * 30 + rv6() * 10);
    return { ...h, scores, readiness: Math.min(pct, 100) };
  });
  const gaps = [
    { area: 'DNSH Criteria Documentation', bonds: 8, severity: 'HIGH', action: 'Complete Do No Significant Harm assessment for all 6 objectives' },
    { area: 'Minimum Social Safeguards', bonds: 5, severity: 'MEDIUM', action: 'Align with OECD Guidelines and UN Guiding Principles' },
    { area: 'ESMA-Registered Reviewer', bonds: 12, severity: 'HIGH', action: 'Transition from voluntary SPO to ESMA-registered external reviewer' },
    { area: 'Taxonomy Technical Screening', bonds: 6, severity: 'MEDIUM', action: 'Map proceeds to specific TSC thresholds per delegated act' },
    { area: 'Post-Issuance Impact Report', bonds: 4, severity: 'LOW', action: 'Publish GBS-compliant impact report within 12 months' },
    { area: 'Allocation Report Template', bonds: 3, severity: 'LOW', action: 'Adopt standardised EU GBS allocation report format' },
  ];
  const timeline = [
    { date: '2024-12-21', event: 'EU GBS Regulation enters into force', status: 'done' },
    { date: '2025-06-30', event: 'ESMA publishes reviewer registration RTS', status: 'done' },
    { date: '2025-12-21', event: 'Voluntary EU GBS label available', status: 'current' },
    { date: '2026-06-30', event: 'First EU GBS-labelled issuances expected', status: 'upcoming' },
    { date: '2026-12-31', event: 'Transition period for existing green bonds', status: 'upcoming' },
    { date: '2028-12-21', event: 'Mandatory taxonomy alignment disclosure', status: 'upcoming' },
  ];

  const passCount = bondGBS.filter(b => b.readiness >= 75).length;
  const partialCount = bondGBS.filter(b => b.readiness >= 50 && b.readiness < 75).length;
  const failCount = bondGBS.filter(b => b.readiness < 50).length;

  return (
    <>
      <div style={sx.kpiRow}>
        <Kpi label="EU GBS Ready" value={passCount} sub="Readiness >= 75%" />
        <Kpi label="Partial Alignment" value={partialCount} sub="50-74% readiness" />
        <Kpi label="Gaps Identified" value={failCount} sub="Below 50%" />
        <Kpi label="Avg Readiness" value={`${Math.round(bondGBS.reduce((s, b) => s + b.readiness, 0) / bondGBS.length)}%`} sub="Portfolio-wide" />
      </div>

      <div style={sx.card}>
        <div style={sx.sectionTitle}>4-Pillar Compliance Dashboard</div>
        <div style={{ display: 'flex', gap: 14, marginBottom: 18, flexWrap: 'wrap' }}>
          {pillars.map((p, i) => {
            const passes = bondGBS.filter(b => b.scores[i] === 'pass').length;
            const partials = bondGBS.filter(b => b.scores[i] === 'partial').length;
            return (
              <div key={p.name} style={{ flex: '1 1 200px', padding: 16, background: '#f8f7f4', borderRadius: 6, border: `1px solid ${T.border}` }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{p.name}</div>
                <div style={{ fontSize: 11, color: T.textSec, marginBottom: 8 }}>{p.desc}</div>
                <div style={{ fontFamily: T.mono, fontSize: 11, marginBottom: 4 }}>Weight: {p.weight}%</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <span style={sx.pill(true)}>{passes} Pass</span>
                  <span style={{ ...sx.pill(false), background: T.amber }}>{partials} Partial</span>
                  <span style={sx.pill(false)}>{bondGBS.length - passes - partials} Fail</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={sx.grid2}>
        <div style={sx.card}>
          <div style={sx.sectionTitle}>Per-Bond EU GBS Readiness</div>
          <div style={{ overflowX: 'auto', maxHeight: 380 }}>
            <table style={sx.tbl}>
              <thead>
                <tr>
                  {['Issuer','Taxonomy','UoP','Reporting','Ext Review','Readiness'].map(h => (
                    <th key={h} style={sx.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bondGBS.map((b, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#fafaf7' : 'transparent' }}>
                    <td style={{ ...sx.td, fontFamily: T.font, fontWeight: 600 }}>{b.issuer}</td>
                    {b.scores.map((s, j) => (
                      <td key={j} style={sx.td}>
                        <span style={{ ...sx.badge(s === 'pass' ? 'green' : s === 'partial' ? 'amber' : 'red') }}>
                          {s.toUpperCase()}
                        </span>
                      </td>
                    ))}
                    <td style={sx.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 60, height: 6, background: T.border, borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${b.readiness}%`, height: '100%', borderRadius: 3,
                            background: b.readiness >= 75 ? T.green : b.readiness >= 50 ? T.amber : T.red }} />
                        </div>
                        <span style={{ fontFamily: T.mono, fontSize: 11, fontWeight: 600 }}>{b.readiness}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={sx.card}>
          <div style={sx.sectionTitle}>Gap Analysis</div>
          <table style={sx.tbl}>
            <thead>
              <tr>
                {['Gap Area','Bonds Affected','Severity','Remediation Action'].map(h => (
                  <th key={h} style={sx.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {gaps.map((g, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#fafaf7' : 'transparent' }}>
                  <td style={{ ...sx.td, fontFamily: T.font, fontWeight: 600 }}>{g.area}</td>
                  <td style={{ ...sx.td, textAlign: 'center' }}>{g.bonds}</td>
                  <td style={sx.td}>
                    <span style={sx.badge(g.severity === 'HIGH' ? 'red' : g.severity === 'MEDIUM' ? 'amber' : 'green')}>
                      {g.severity}
                    </span>
                  </td>
                  <td style={{ ...sx.td, fontFamily: T.font, fontSize: 11 }}>{g.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={sx.card}>
        <div style={sx.sectionTitle}>EU GBS Implementation Timeline</div>
        <div style={{ position: 'relative', paddingLeft: 24 }}>
          {timeline.map((t, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 16, position: 'relative' }}>
              <div style={{
                width: 12, height: 12, borderRadius: '50%', position: 'absolute', left: -24, top: 3,
                background: t.status === 'done' ? T.green : t.status === 'current' ? T.gold : T.border,
                border: t.status === 'current' ? `2px solid ${T.navy}` : 'none',
              }} />
              {i < timeline.length - 1 && (
                <div style={{ position: 'absolute', left: -19, top: 15, width: 2, height: 28, background: T.border }} />
              )}
              <div style={{ marginLeft: 8 }}>
                <div style={{ fontFamily: T.mono, fontSize: 11, color: T.textMut, marginBottom: 2 }}>{t.date}</div>
                <div style={{ fontSize: 13, fontWeight: t.status === 'current' ? 700 : 500, color: t.status === 'current' ? T.navy : T.textSec }}>
                  {t.event}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ── Main Page ── */
export default function GreenBondPortfolioAnalyticsPage() {
  const [tab, setTab] = useState(0);

  return (
    <div style={sx.page}>
      <div style={sx.header}>
        <div>
          <h1 style={sx.h1}>Green Bond Portfolio Analytics</h1>
          <div style={sx.stamp}>EP-CZ4 | ICMA GBP | EU GBS | Greenium Intelligence</div>
        </div>
        <div style={{ fontFamily: T.mono, fontSize: 11, color: T.textMut }}>
          AUM ${(totalAUM / 1000).toFixed(1)}B | {holdings.length} bonds | Updated {new Date().toISOString().slice(0, 10)}
        </div>
      </div>
      <div style={sx.goldLine} />

      <div style={sx.tabBar}>
        {TABS.map((t, i) => (
          <button key={t} style={sx.tab(tab === i)} onClick={() => setTab(i)}>{t}</button>
        ))}
      </div>

      {tab === 0 && <PortfolioOverview />}
      {tab === 1 && <UseOfProceeds />}
      {tab === 2 && <ImpactMetrics />}
      {tab === 3 && <GreeniumAnalysis />}
      {tab === 4 && <EUGBSAlignment />}

      <div style={{ textAlign: 'center', padding: '18px 0 8px', fontFamily: T.mono, fontSize: 10, color: T.textMut }}>
        GREEN BOND PORTFOLIO ANALYTICS v1.0 | ICMA Green Bond Principles | EU Green Bond Standard (Reg 2023/2631)
      </div>
    </div>
  );
}
