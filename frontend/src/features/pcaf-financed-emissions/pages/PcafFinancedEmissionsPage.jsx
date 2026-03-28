import React, { useState } from 'react';
import {
  BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Legend,
} from 'recharts';
import { SECTOR_EMISSION_INTENSITY } from '../../../data/sectorBenchmarks';

const T = {
  bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7',
  border:'#e5e0d8', borderL:'#d5cfc5',
  navy:'#1b3a5c', navyL:'#2c5a8c',
  gold:'#c5a96a', goldL:'#d4be8a',
  sage:'#5a8a6a', sageL:'#7ba67d',
  text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae',
  red:'#dc2626', green:'#16a34a', amber:'#d97706',
  card:'0 1px 4px rgba(27,58,92,0.06)',
  cardH:'0 4px 16px rgba(27,58,92,0.1)',
  font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif",
};

// Deterministic seed — no random() calls
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

// ── Portfolio positions ────────────────────────────────────────────────────
const POSITIONS = [
  // Listed Equity
  { id: 1,  name: 'Apple Inc',                          assetClass: 'Listed Equity',        sector: 'Technology',        evic: 2740, outstanding: 18.4,  totalEmissions:   22100,    attrFactor: 0.0067, dqs: 2 },
  { id: 2,  name: 'Microsoft Corp',                     assetClass: 'Listed Equity',        sector: 'Technology',        evic: 2910, outstanding: 22.1,  totalEmissions:   14200,    attrFactor: 0.0076, dqs: 2 },
  { id: 3,  name: 'Shell plc',                          assetClass: 'Listed Equity',        sector: 'Oil & Gas',         evic: 245,  outstanding: 31.2,  totalEmissions:   68400000, attrFactor: 0.1273, dqs: 1 },
  { id: 4,  name: 'TotalEnergies SE',                   assetClass: 'Listed Equity',        sector: 'Oil & Gas',         evic: 178,  outstanding: 24.6,  totalEmissions:   53200000, attrFactor: 0.1382, dqs: 1 },
  { id: 5,  name: 'BASF SE',                            assetClass: 'Listed Equity',        sector: 'Chemicals',         evic: 48,   outstanding: 12.8,  totalEmissions:   21800000, attrFactor: 0.2667, dqs: 2 },
  { id: 6,  name: 'BHP Group',                          assetClass: 'Listed Equity',        sector: 'Mining',            evic: 168,  outstanding: 19.3,  totalEmissions:   42300000, attrFactor: 0.1149, dqs: 1 },
  { id: 7,  name: 'Vale S.A.',                          assetClass: 'Listed Equity',        sector: 'Mining',            evic: 72,   outstanding: 15.7,  totalEmissions:   17900000, attrFactor: 0.2181, dqs: 2 },
  { id: 8,  name: 'Nippon Steel Corp',                  assetClass: 'Listed Equity',        sector: 'Steel',             evic: 31,   outstanding: 8.9,   totalEmissions:   58700000, attrFactor: 0.2871, dqs: 3 },
  // Corporate Bonds
  { id: 9,  name: 'Ford Motor 7.45% 2031',              assetClass: 'Corporate Bonds',      sector: 'Automotive',        evic: 54,   outstanding: 14.2,  totalEmissions:    6340000, attrFactor: 0.2630, dqs: 3 },
  { id: 10, name: 'EDF Green Bond 1.625% 2030',         assetClass: 'Corporate Bonds',      sector: 'Electric Utilities',evic: 89,   outstanding: 20.4,  totalEmissions:   42700000, attrFactor: 0.2292, dqs: 2 },
  { id: 11, name: 'Glencore 3.875% 2029',               assetClass: 'Corporate Bonds',      sector: 'Mining',            evic: 94,   outstanding: 17.6,  totalEmissions:   38100000, attrFactor: 0.1872, dqs: 2 },
  { id: 12, name: 'ArcelorMittal 4.25% 2029',           assetClass: 'Corporate Bonds',      sector: 'Steel',             evic: 28,   outstanding: 11.4,  totalEmissions:   72900000, attrFactor: 0.4071, dqs: 3 },
  { id: 13, name: 'Petrobras 6.9% 2049',                assetClass: 'Corporate Bonds',      sector: 'Oil & Gas',         evic: 115,  outstanding: 9.8,   totalEmissions:   24600000, attrFactor: 0.0852, dqs: 3 },
  // Project Finance
  { id: 14, name: 'North Sea Wind Farm (1.2 GW)',        assetClass: 'Project Finance',      sector: 'Renewables',        evic: null, outstanding: 480,   totalEmissions:   12400,    attrFactor: 1.0,    dqs: 3 },
  { id: 15, name: 'Solar Farm — Vietnam (320 MW)',       assetClass: 'Project Finance',      sector: 'Renewables',        evic: null, outstanding: 210,   totalEmissions:    6800,    attrFactor: 1.0,    dqs: 4 },
  { id: 16, name: 'Coal-to-Gas Transition — Indonesia', assetClass: 'Project Finance',      sector: 'Electric Utilities',evic: null, outstanding: 340,   totalEmissions:  4280000,   attrFactor: 1.0,    dqs: 4 },
  { id: 17, name: 'Wastewater Treatment — Brazil',      assetClass: 'Project Finance',      sector: 'Infrastructure',    evic: null, outstanding: 85,    totalEmissions:   31200,    attrFactor: 1.0,    dqs: 4 },
  // Commercial Real Estate
  { id: 18, name: 'Canary Wharf Office Complex, London',assetClass: 'Commercial Real Estate',sector: 'Real Estate',      evic: null, outstanding: 620,   totalEmissions:   18400,    attrFactor: 1.0,    dqs: 3 },
  { id: 19, name: 'Schiphol Logistics Hub, Amsterdam',  assetClass: 'Commercial Real Estate',sector: 'Real Estate',      evic: null, outstanding: 310,   totalEmissions:    9200,    attrFactor: 1.0,    dqs: 4 },
  // Mortgages
  { id: 20, name: 'UK Residential Mortgage Portfolio',  assetClass: 'Mortgages',            sector: 'Residential',       evic: null, outstanding: 2400,  totalEmissions:  189000,    attrFactor: 0.82,   dqs: 4 },
];

const computedPositions = POSITIONS.map(p => ({
  ...p,
  financedEmissions: +(p.attrFactor * p.totalEmissions).toFixed(0),
}));

const assetClassOrder = ['Listed Equity', 'Corporate Bonds', 'Project Finance', 'Commercial Real Estate', 'Mortgages'];
const assetClassColors = {
  'Listed Equity':           '#0ea5e9',
  'Corporate Bonds':         '#06c896',
  'Project Finance':         '#f0a828',
  'Commercial Real Estate':  '#a78bfa',
  'Mortgages':               '#f04060',
};

const assetClassSummary = assetClassOrder.map(ac => {
  const positions = computedPositions.filter(p => p.assetClass === ac);
  const totalFE   = positions.reduce((s, p) => s + p.financedEmissions, 0);
  return { name: ac, financedEmissions: totalFE, count: positions.length, color: assetClassColors[ac] };
});

const sectorMap = {};
computedPositions.forEach(p => { sectorMap[p.sector] = (sectorMap[p.sector] || 0) + p.financedEmissions; });
const SECTOR_PIE_COLORS = ['#0ea5e9','#06c896','#f0a828','#a78bfa','#f04060','#38bdf8','#facc15','#34d399','#fb7185'];
const sectorPieData = Object.entries(sectorMap)
  .sort((a, b) => b[1] - a[1])
  .map(([name, value], i) => ({ name, value, color: SECTOR_PIE_COLORS[i % SECTOR_PIE_COLORS.length] }));

const DQS_DATA = [
  { score: 'Score 1 — Verified',           pct: 8,  desc: 'Third-party verified Scope 1+2 emissions',          action: 'Maintain — request annual re-verification',                                         color: T.green    },
  { score: 'Score 2 — Company-reported',   pct: 34, desc: 'Unverified self-reported GHG inventory',            action: 'Engage companies to obtain third-party assurance (limited or reasonable)',         color: '#38bdf8'  },
  { score: 'Score 3 — Physical proxy',     pct: 28, desc: 'Sector-level physical intensity × production vol',  action: 'Request CDP disclosure or company GHG inventory',                                  color: T.amber    },
  { score: 'Score 4 — Revenue proxy',      pct: 22, desc: 'Revenue-based emission factor from sector database',action: 'Upgrade to physical intensity or company-reported; flag in disclosure',            color: '#f97316'  },
  { score: 'Score 5 — Headcount/B/S proxy',pct: 8,  desc: 'Headcount or balance sheet proxy — lowest quality', action: 'Prioritise data collection; consider engagement or exclusion',                      color: T.red      },
];

const PORTFOLIO_SECTOR_INTENSITIES = [
  { sector: 'Oil & Gas',         portfolioIntensity: 342, sectorKey: 'Oil, Gas & Consumable Fuels'   },
  { sector: 'Chemicals',         portfolioIntensity: 162, sectorKey: 'Chemicals'                      },
  { sector: 'Mining',            portfolioIntensity: 198, sectorKey: 'Mining & Metals (ex-Steel)'     },
  { sector: 'Steel',             portfolioIntensity: 288, sectorKey: 'Steel'                          },
  { sector: 'Automotive',        portfolioIntensity: 54,  sectorKey: 'Automotive'                     },
  { sector: 'Electric Utilities',portfolioIntensity: 860, sectorKey: 'Electric Utilities'             },
  { sector: 'Technology',        portfolioIntensity: 9,   sectorKey: 'Technology & Software'          },
];

const YOY_DATA = [
  { year: '2021',  fe: 1124600, waci: 398, dqs: 3.9, coverage: 71 },
  { year: '2022',  fe: 983200,  waci: 356, dqs: 3.6, coverage: 78 },
  { year: '2023',  fe: 847300,  waci: 312, dqs: 3.2, coverage: 86 },
  { year: '2024E', fe: 720000,  waci: 268, dqs: 2.9, coverage: 91 },
];

const PCAF_ASSET_TABLE = [
  { assetClass: 'Listed Equity',           standard: 'PCAF Standard Part A, §4.1', method: 'EVIC-based attribution',              coverage: '100%', dqs: '1–3', ghgScope: 'Scope 1+2' },
  { assetClass: 'Corporate Bonds',         standard: 'PCAF Standard Part A, §4.2', method: 'EVIC-based attribution',              coverage: '100%', dqs: '2–3', ghgScope: 'Scope 1+2' },
  { assetClass: 'Project Finance',         standard: 'PCAF Standard Part A, §4.5', method: 'Outstanding amount / project EV',    coverage: '100%', dqs: '3–4', ghgScope: 'Scope 1+2' },
  { assetClass: 'Commercial Real Estate',  standard: 'PCAF Standard Part A, §4.6', method: 'Outstanding amount',                 coverage: '100%', dqs: '3–4', ghgScope: 'Scope 1+2' },
  { assetClass: 'Mortgages',               standard: 'PCAF Standard Part A, §4.7', method: 'Original loan-to-value ratio',       coverage: '100%', dqs: '4',   ghgScope: 'Scope 1+2' },
];

// ── Utility formatters ───────────────────────────────────────────────────────
const fmt   = (n, d = 0) => n == null ? '—' : Number(n).toLocaleString('en-GB', { minimumFractionDigits: d, maximumFractionDigits: d });
const fmtKt = n => n >= 1000000 ? `${fmt(n / 1000000, 2)} MtCO2e` : n >= 1000 ? `${fmt(n / 1000, 1)} ktCO2e` : `${fmt(n)} tCO2e`;
const fmtPct= n => `${(n * 100).toFixed(2)}%`;

// ── Shared styles ────────────────────────────────────────────────────────────
const s = {
  page:       { background: T.bg, minHeight: '100vh', fontFamily: T.font, color: T.text, padding: '24px 28px' },
  header:     { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  titleBlock: { display: 'flex', flexDirection: 'column', gap: 4 },
  moduleCode: { fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: T.navy, textTransform: 'uppercase' },
  title:      { fontSize: 20, fontWeight: 700, color: T.text, margin: 0 },
  subtitle:   { fontSize: 12, color: T.textSec, marginTop: 2 },
  badge: (bg, fg) => ({ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 4, background: bg, color: fg, fontSize: 10, fontWeight: 600 }),
  tabBar: { display: 'flex', gap: 2, background: T.surface, borderRadius: 8, padding: 4, border: `1px solid ${T.border}`, marginBottom: 20, width: 'fit-content' },
  tab: active => ({
    padding: '7px 18px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none',
    background: active ? T.surfaceH : 'transparent',
    color: active ? T.text : T.textSec,
    borderBottom: active ? `2px solid ${T.navy}` : '2px solid transparent',
    transition: 'all 0.15s',
  }),
  card:      { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, boxShadow: T.card },
  cardTitle: { fontSize: 11, fontWeight: 700, color: T.textSec, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 },
  grid2:     { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 },
  grid4:     { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 },
  metricCard:  { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 16px' },
  metricLabel: { fontSize: 10, color: T.textSec, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 },
  metricValue: { fontSize: 22, fontWeight: 700, color: T.text },
  metricSub:   { fontSize: 11, color: T.textSec, marginTop: 2 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 11 },
  th:    { textAlign: 'left', padding: '6px 8px', borderBottom: `1px solid ${T.border}`, color: T.textSec, fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap' },
  td:    { padding: '6px 8px', borderBottom: `1px solid ${T.borderL}`, color: T.text, whiteSpace: 'nowrap' },
  tdM:   { padding: '6px 8px', borderBottom: `1px solid ${T.borderL}`, color: T.textSec, whiteSpace: 'nowrap' },
  disclaimer:    { background: 'rgba(240,168,40,0.08)', border: `1px solid rgba(240,168,40,0.3)`, borderRadius: 6, padding: '10px 14px', fontSize: 11, color: '#f0c050', marginBottom: 14 },
  realDataBadge: { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 4, background: 'rgba(6,200,150,0.1)', border: `1px solid rgba(6,200,150,0.3)`, color: T.green, fontSize: 10, fontWeight: 700 },
};

// ── Custom chart tooltip ─────────────────────────────────────────────────────
const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6, padding: '8px 12px', fontSize: 11 }}>
      <div style={{ color: T.textSec, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || T.text }}>{p.name}: <strong>{typeof p.value === 'number' && p.value > 1000 ? fmtKt(p.value) : p.value}</strong></div>
      ))}
    </div>
  );
};

// ── DQS badge ────────────────────────────────────────────────────────────────
const DqsBadge = ({ score }) => {
  const colors = { 1: T.green, 2: '#38bdf8', 3: T.amber, 4: '#f97316', 5: T.red };
  return (
    <span style={{ display: 'inline-block', padding: '1px 7px', borderRadius: 4, background: `${colors[score]}22`, color: colors[score], fontWeight: 700, fontSize: 10 }}>
      DQS {score}
    </span>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// TAB 1 — Portfolio Financed Emissions
// ═══════════════════════════════════════════════════════════════════════════
function TabPortfolio() {
  return (
    <div>
      <div style={s.disclaimer}>
        ⚠ Illustrative Data — Portfolio positions are illustrative. Financed emission calculations follow real PCAF Standard v2 (2022) methodology. Attribution factors are EVIC-based for listed equity/bonds; outstanding loan amount for project finance, CRE and mortgages.
      </div>

      <div style={s.grid4}>
        <div style={s.metricCard}>
          <div style={s.metricLabel}>Total Financed Emissions</div>
          <div style={{ ...s.metricValue, color: T.amber }}>847.3 ktCO2e</div>
          <div style={s.metricSub}>Scope 1+2 attributed, 2023 book</div>
        </div>
        <div style={s.metricCard}>
          <div style={s.metricLabel}>Portfolio WACI</div>
          <div style={{ ...s.metricValue, color: T.sage }}>312 tCO2e/$M</div>
          <div style={s.metricSub}>Weighted avg carbon intensity</div>
        </div>
        <div style={s.metricCard}>
          <div style={s.metricLabel}>EVIC Attribution (avg)</div>
          <div style={{ ...s.metricValue, color: T.navy }}>4.2%</div>
          <div style={s.metricSub}>Attribution-weighted avg EVIC share</div>
        </div>
        <div style={s.metricCard}>
          <div style={s.metricLabel}>PCAF DQS (portfolio)</div>
          <div style={{ ...s.metricValue, color: T.amber }}>3.2</div>
          <div style={s.metricSub}>Coverage-weighted avg score</div>
        </div>
      </div>

      <div style={{ ...s.grid2, marginTop: 14 }}>
        <div style={s.card}>
          <div style={s.cardTitle}>Financed Emissions by Asset Class (tCO2e)</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={assetClassSummary} margin={{ top: 4, right: 8, left: 8, bottom: 44 }}>
              <XAxis dataKey="name" tick={{ fill: T.textSec, fontSize: 9 }} angle={-25} textAnchor="end" interval={0} />
              <YAxis tick={{ fill: T.textSec, fontSize: 9 }} tickFormatter={v => v >= 1000000 ? `${(v/1000000).toFixed(1)}Mt` : v >= 1000 ? `${(v/1000).toFixed(0)}kt` : v} />
              <Tooltip content={<ChartTip />} />
              <Bar dataKey="financedEmissions" name="Financed Emissions" radius={[3,3,0,0]}>
                {assetClassSummary.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={s.card}>
          <div style={s.cardTitle}>Emissions Attribution by Sector</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={sectorPieData} cx="45%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2} dataKey="value">
                {sectorPieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={v => fmtKt(v)} contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, fontSize: 11 }} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 9, color: T.textSec }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ ...s.card, marginTop: 14 }}>
        <div style={s.cardTitle}>Banking Book — 20 Positions (PCAF Attribution Detail)</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>#</th>
                <th style={s.th}>Name</th>
                <th style={s.th}>Asset Class</th>
                <th style={s.th}>Sector</th>
                <th style={{ ...s.th, textAlign: 'right' }}>Outstanding ($M)</th>
                <th style={{ ...s.th, textAlign: 'right' }}>Attr Factor</th>
                <th style={{ ...s.th, textAlign: 'right' }}>Borrower Emissions (tCO2e)</th>
                <th style={{ ...s.th, textAlign: 'right' }}>Financed Emissions (tCO2e)</th>
                <th style={s.th}>DQS</th>
              </tr>
            </thead>
            <tbody>
              {computedPositions.map((p, idx) => (
                <tr key={p.id} style={{ background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                  <td style={s.tdM}>{p.id}</td>
                  <td style={{ ...s.td, maxWidth: 210, overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</td>
                  <td style={s.tdM}>
                    <span style={{ display: 'inline-block', padding: '1px 6px', borderRadius: 3, background: `${assetClassColors[p.assetClass]}22`, color: assetClassColors[p.assetClass], fontSize: 9, fontWeight: 600 }}>
                      {p.assetClass}
                    </span>
                  </td>
                  <td style={s.tdM}>{p.sector}</td>
                  <td style={{ ...s.td, textAlign: 'right' }}>{fmt(p.outstanding, 1)}</td>
                  <td style={{ ...s.tdM, textAlign: 'right' }}>{fmtPct(p.attrFactor)}</td>
                  <td style={{ ...s.tdM, textAlign: 'right' }}>{fmt(p.totalEmissions)}</td>
                  <td style={{ ...s.td, textAlign: 'right', fontWeight: 700, color: p.financedEmissions > 1000000 ? T.red : p.financedEmissions > 100000 ? T.amber : T.text }}>
                    {fmt(p.financedEmissions)}
                  </td>
                  <td style={s.td}><DqsBadge score={p.dqs} /></td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: `1px solid ${T.border}` }}>
                <td colSpan={7} style={{ ...s.td, fontWeight: 700, textAlign: 'right', color: T.textSec }}>Total Portfolio</td>
                <td style={{ ...s.td, textAlign: 'right', fontWeight: 700, color: T.amber }}>
                  {fmt(computedPositions.reduce((a, p) => a + p.financedEmissions, 0))}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 2 — Data Quality Assessment
// ═══════════════════════════════════════════════════════════════════════════
function TabDataQuality() {
  return (
    <div>
      <div style={s.disclaimer}>
        ⚠ PCAF Data Quality Score methodology is real — per PCAF Standard v2 (2022). Portfolio DQS distribution is illustrative. Target: migrate ≥70% of portfolio to DQS 1–2 by 2026.
      </div>

      <div style={s.grid2}>
        <div style={s.card}>
          <div style={s.cardTitle}>DQS Distribution — % of Portfolio by Outstanding Value</div>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={DQS_DATA} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
              <XAxis type="number" tick={{ fill: T.textSec, fontSize: 9 }} tickFormatter={v => `${v}%`} domain={[0, 45]} />
              <YAxis type="category" dataKey="score" tick={{ fill: T.textSec, fontSize: 9 }} width={195} />
              <Tooltip formatter={v => `${v}%`} contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, fontSize: 11 }} />
              <Bar dataKey="pct" name="Portfolio %" radius={[0,3,3,0]}>
                {DQS_DATA.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 10, color: T.textSec }}>Portfolio avg DQS: <strong style={{ color: T.amber }}>3.2</strong></div>
            <div style={{ fontSize: 10, color: T.textSec }}>Target avg DQS: <strong style={{ color: T.green }}>&lt;2.5 by 2026</strong></div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {DQS_DATA.map((d, i) => (
            <div key={i} style={{ ...s.card, padding: '10px 14px', borderLeft: `3px solid ${d.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: d.color }}>{d.score}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{d.pct}%</span>
              </div>
              <div style={{ fontSize: 10, color: T.textSec, marginBottom: 3 }}>{d.desc}</div>
              <div style={{ fontSize: 10, color: T.textMut, fontStyle: 'italic' }}>Action: {d.action}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ ...s.card, marginTop: 14 }}>
        <div style={s.cardTitle}>Data Quality Improvement Roadmap</div>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Priority Tier</th>
              <th style={s.th}>Positions</th>
              <th style={s.th}>Current DQS</th>
              <th style={s.th}>Target DQS</th>
              <th style={s.th}>Required Action</th>
              <th style={s.th}>Timeline</th>
              <th style={{ ...s.th, textAlign: 'right' }}>Financed Emiss. Affected</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ ...s.td, color: T.red, fontWeight: 700 }}>P1 — Critical</td>
              <td style={s.td}>Nippon Steel, ArcelorMittal</td>
              <td style={s.td}><DqsBadge score={3} /></td>
              <td style={s.td}><DqsBadge score={2} /></td>
              <td style={s.td}>Request CDP submission; bilateral engagement</td>
              <td style={s.tdM}>Q2 2024</td>
              <td style={{ ...s.td, textAlign: 'right', color: T.amber }}>208.4 ktCO2e</td>
            </tr>
            <tr style={{ background: 'rgba(255,255,255,0.015)' }}>
              <td style={{ ...s.td, color: T.amber, fontWeight: 700 }}>P2 — High</td>
              <td style={s.td}>Ford, Petrobras, Indonesia project</td>
              <td style={s.td}><DqsBadge score={4} /></td>
              <td style={s.td}><DqsBadge score={3} /></td>
              <td style={s.td}>Project-level emission inventory; lender covenant</td>
              <td style={s.tdM}>Q3 2024</td>
              <td style={{ ...s.td, textAlign: 'right', color: T.amber }}>372.6 ktCO2e</td>
            </tr>
            <tr>
              <td style={{ ...s.td, color: T.sage, fontWeight: 700 }}>P3 — Medium</td>
              <td style={s.td}>UK Mortgage Portfolio, CRE loans</td>
              <td style={s.td}><DqsBadge score={4} /></td>
              <td style={s.td}><DqsBadge score={3} /></td>
              <td style={s.td}>EPC rating data integration; AMI meter data agreement</td>
              <td style={s.tdM}>Q4 2024</td>
              <td style={{ ...s.td, textAlign: 'right', color: T.textSec }}>183.6 ktCO2e</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 3 — Intensity Benchmarks (REAL DATA)
// ═══════════════════════════════════════════════════════════════════════════
function TabBenchmarks() {
  const enriched = PORTFOLIO_SECTOR_INTENSITIES.map(ps => {
    const ref = SECTOR_EMISSION_INTENSITY.find(b => b.sector === ps.sectorKey);
    if (!ref) return { ...ps, median: null, p25: null, p75: null, percentile: null, source: null };
    const { medianIntensity, p25, p75 } = ref;
    let pct;
    if (ps.portfolioIntensity <= p25)             pct = 10 + 15 * (ps.portfolioIntensity / p25);
    else if (ps.portfolioIntensity <= medianIntensity) pct = 25 + 25 * ((ps.portfolioIntensity - p25) / (medianIntensity - p25));
    else if (ps.portfolioIntensity <= p75)         pct = 50 + 25 * ((ps.portfolioIntensity - medianIntensity) / (p75 - medianIntensity));
    else                                           pct = 75 + 20 * Math.min(1, (ps.portfolioIntensity - p75) / p75);
    return { ...ps, median: medianIntensity, p25, p75, percentile: +pct.toFixed(0), source: ref.source };
  });

  const chartData = enriched.map(e => ({ name: e.sector, portfolio: e.portfolioIntensity, median: e.median, p75: e.p75 }));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={s.realDataBadge}>✓ Real Data — Sector benchmarks sourced from MSCI CarbonMetrics, S&P Trucost, IEA CO2 (2023)</span>
      </div>

      <div style={s.card}>
        <div style={s.cardTitle}>Portfolio Intensity vs. Sector Median (tCO2e / $M Revenue)</div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} margin={{ top: 4, right: 20, left: 8, bottom: 44 }}>
            <XAxis dataKey="name" tick={{ fill: T.textSec, fontSize: 9 }} angle={-20} textAnchor="end" interval={0} />
            <YAxis tick={{ fill: T.textSec, fontSize: 9 }} />
            <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, fontSize: 11 }} />
            <Bar dataKey="p75" name="Sector P75" radius={[3,3,0,0]}>
              {chartData.map((_, i) => <Cell key={i} fill="rgba(240,168,40,0.18)" />)}
            </Bar>
            <Bar dataKey="median" name="Sector Median" radius={[3,3,0,0]}>
              {chartData.map((_, i) => <Cell key={i} fill="rgba(14,165,233,0.38)" />)}
            </Bar>
            <Bar dataKey="portfolio" name="Portfolio" radius={[3,3,0,0]}>
              {enriched.map((e, i) => (
                <Cell key={i} fill={e.portfolioIntensity <= e.median ? T.green : e.portfolioIntensity <= e.p75 ? T.amber : T.red} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', gap: 16, marginTop: 4, flexWrap: 'wrap' }}>
          {[['rgba(14,165,233,0.7)','Sector Median'],['rgba(240,168,40,0.5)','Sector P75'],[T.green,'Portfolio — Outperforming'],[T.amber,'Portfolio — In-line'],[T.red,'Portfolio — Underperforming']].map(([c,l],i)=>(
            <span key={i} style={{ fontSize: 9, color: T.textSec }}>■ <span style={{ color: c }}>{l}</span></span>
          ))}
        </div>
      </div>

      <div style={{ ...s.card, marginTop: 14 }}>
        <div style={s.cardTitle}>Sector Intensity Benchmark Detail — Real Data from MSCI / S&P Trucost / IEA</div>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Portfolio Sector</th>
              <th style={s.th}>Benchmark Sector</th>
              <th style={{ ...s.th, textAlign: 'right' }}>Portfolio (tCO2e/$M)</th>
              <th style={{ ...s.th, textAlign: 'right' }}>Sector P25</th>
              <th style={{ ...s.th, textAlign: 'right' }}>Sector Median</th>
              <th style={{ ...s.th, textAlign: 'right' }}>Sector P75</th>
              <th style={{ ...s.th, textAlign: 'right' }}>Est. Percentile</th>
              <th style={s.th}>vs. Median</th>
              <th style={s.th}>Source</th>
            </tr>
          </thead>
          <tbody>
            {enriched.map((e, idx) => {
              const out    = e.portfolioIntensity <= e.median;
              const inline = !out && e.portfolioIntensity <= e.p75;
              return (
                <tr key={idx} style={{ background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                  <td style={{ ...s.td, fontWeight: 600 }}>{e.sector}</td>
                  <td style={s.tdM}>{e.sectorKey}</td>
                  <td style={{ ...s.td, textAlign: 'right', fontWeight: 700 }}>{fmt(e.portfolioIntensity)}</td>
                  <td style={{ ...s.tdM, textAlign: 'right' }}>{fmt(e.p25)}</td>
                  <td style={{ ...s.tdM, textAlign: 'right' }}>{fmt(e.median)}</td>
                  <td style={{ ...s.tdM, textAlign: 'right' }}>{fmt(e.p75)}</td>
                  <td style={{ ...s.td, textAlign: 'right', color: out ? T.green : inline ? T.amber : T.red }}>
                    {e.percentile != null ? `P${e.percentile}` : '—'}
                  </td>
                  <td style={s.td}>
                    <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 9, fontWeight: 700, background: out ? 'rgba(6,200,150,0.1)' : inline ? 'rgba(240,168,40,0.1)' : 'rgba(240,64,96,0.1)', color: out ? T.green : inline ? T.amber : T.red }}>
                      {out ? '▼ Outperforming' : inline ? '~ In-line' : '▲ Underperforming'}
                    </span>
                  </td>
                  <td style={{ ...s.tdM, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 9 }}>
                    {e.source ? e.source.split(';')[0] : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{ fontSize: 10, color: T.textMut, marginTop: 8 }}>
          Intensities in tCO2e per $M USD revenue (Scope 1+2). Sector medians circa 2021–2023. Sources: MSCI ESG CarbonMetrics, S&P Global Trucost, IEA CO2 Emissions 2022/2023.
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 4 — PCAF Reporting Output
// ═══════════════════════════════════════════════════════════════════════════
function TabPcafReport() {
  return (
    <div>
      <div style={s.disclaimer}>
        ⚠ Illustrative Data — This portfolio is illustrative only. Financed emission calculations follow real PCAF Standard v2 methodology. Actual figures require verified borrower/investee emission data. Real sector benchmarks sourced from MSCI/Trucost/IEA.
      </div>

      <div style={s.grid4}>
        <div style={s.metricCard}>
          <div style={s.metricLabel}>Reporting Year</div>
          <div style={{ ...s.metricValue, fontSize: 18 }}>FY 2023</div>
          <div style={s.metricSub}>Base year: FY 2021</div>
        </div>
        <div style={s.metricCard}>
          <div style={s.metricLabel}>Coverage Ratio</div>
          <div style={{ ...s.metricValue, color: T.green, fontSize: 18 }}>86%</div>
          <div style={s.metricSub}>% portfolio with FE calculated</div>
        </div>
        <div style={s.metricCard}>
          <div style={s.metricLabel}>YoY Change (FE)</div>
          <div style={{ ...s.metricValue, color: T.green, fontSize: 18 }}>-13.8%</div>
          <div style={s.metricSub}>2022 → 2023 financed emissions</div>
        </div>
        <div style={s.metricCard}>
          <div style={s.metricLabel}>GHG Protocol Alignment</div>
          <div style={{ ...s.metricValue, fontSize: 14, color: T.sage }}>S3 Cat 15</div>
          <div style={s.metricSub}>Value Chain — Investments</div>
        </div>
      </div>

      <div style={{ ...s.grid2, marginTop: 14 }}>
        <div style={s.card}>
          <div style={s.cardTitle}>Year-on-Year Financed Emissions Trend (ktCO2e)</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={YOY_DATA} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
              <XAxis dataKey="year" tick={{ fill: T.textSec, fontSize: 10 }} />
              <YAxis tick={{ fill: T.textSec, fontSize: 9 }} tickFormatter={v => `${(v/1000).toFixed(0)}kt`} />
              <Tooltip formatter={v => `${(v/1000).toFixed(1)} ktCO2e`} contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, fontSize: 11 }} />
              <Bar dataKey="fe" name="Financed Emissions" radius={[3,3,0,0]}>
                {YOY_DATA.map((entry, i) => (
                  <Cell key={i} fill={entry.year === '2024E' ? `${T.sage}88` : T.sage} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={s.card}>
          <div style={s.cardTitle}>WACI Trend & DQS Improvement</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
            <table style={{ ...s.table, fontSize: 11 }}>
              <thead>
                <tr>
                  <th style={s.th}>Year</th>
                  <th style={{ ...s.th, textAlign: 'right' }}>WACI</th>
                  <th style={{ ...s.th, textAlign: 'right' }}>Δ YoY</th>
                </tr>
              </thead>
              <tbody>
                {YOY_DATA.map((d, i) => {
                  const prev  = YOY_DATA[i - 1];
                  const delta = prev ? (((d.waci - prev.waci) / prev.waci) * 100).toFixed(1) : null;
                  return (
                    <tr key={i}>
                      <td style={s.tdM}>{d.year}</td>
                      <td style={{ ...s.td, textAlign: 'right', fontWeight: 700 }}>{d.waci}</td>
                      <td style={{ ...s.td, textAlign: 'right', color: delta && Number(delta) < 0 ? T.green : T.amber }}>
                        {delta ? `${delta}%` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <table style={{ ...s.table, fontSize: 11 }}>
              <thead>
                <tr>
                  <th style={s.th}>Year</th>
                  <th style={{ ...s.th, textAlign: 'right' }}>Avg DQS</th>
                  <th style={{ ...s.th, textAlign: 'right' }}>Coverage</th>
                </tr>
              </thead>
              <tbody>
                {YOY_DATA.map((d, i) => (
                  <tr key={i}>
                    <td style={s.tdM}>{d.year}</td>
                    <td style={{ ...s.td, textAlign: 'right', color: d.dqs <= 2.5 ? T.green : d.dqs <= 3.2 ? T.amber : T.textSec }}>{d.dqs}</td>
                    <td style={{ ...s.td, textAlign: 'right', color: T.green }}>{d.coverage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div style={{ ...s.card, marginTop: 14 }}>
        <div style={s.cardTitle}>PCAF Standard v2 Asset Class Disclosure (§4 Format)</div>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Asset Class</th>
              <th style={s.th}>PCAF Standard Reference</th>
              <th style={s.th}>Attribution Method</th>
              <th style={{ ...s.th, textAlign: 'right' }}>Coverage</th>
              <th style={s.th}>DQS Range</th>
              <th style={s.th}>GHG Scope</th>
            </tr>
          </thead>
          <tbody>
            {PCAF_ASSET_TABLE.map((row, idx) => (
              <tr key={idx} style={{ background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                <td style={{ ...s.td, fontWeight: 600, color: assetClassColors[row.assetClass] || T.text }}>{row.assetClass}</td>
                <td style={s.tdM}>{row.standard}</td>
                <td style={s.tdM}>{row.method}</td>
                <td style={{ ...s.td, textAlign: 'right', color: T.green }}>{row.coverage}</td>
                <td style={s.td}>{row.dqs}</td>
                <td style={s.tdM}>{row.ghgScope}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ ...s.card, marginTop: 14 }}>
        <div style={s.cardTitle}>Data Quality Narrative & GHG Protocol Alignment</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            ['Methodology', 'Financed emissions are calculated in accordance with the PCAF Global GHG Accounting and Reporting Standard for the Financial Industry, Part A (2022 version). Attribution factors for listed equity and corporate bonds are calculated as outstanding amount divided by the investee company\'s Enterprise Value Including Cash (EVIC).'],
            ['Scope', 'This disclosure covers Scope 1 and Scope 2 (market-based) greenhouse gas emissions for all financed counterparties. Scope 3 emissions are excluded from the primary disclosure but are tracked for engagement purposes.'],
            ['GHG Protocol Alignment', 'Financed emissions are reported as Scope 3 Category 15 (Investments) under the GHG Protocol Corporate Value Chain (Scope 3) Standard. Double counting is managed through attribution-based allocation as specified in PCAF §3.2.'],
            ['Exclusions', 'Sovereign bonds (0% attribution under PCAF §4.4), intragroup positions, and derivative instruments are excluded. Excluded positions represent 14% of total outstanding portfolio value.'],
          ].map(([label, text], i) => (
            <div key={i} style={{ fontSize: 11, color: T.text, lineHeight: 1.65 }}>
              <strong style={{ color: T.textSec }}>{label}: </strong>{text}
            </div>
          ))}
          <div style={{ fontSize: 11, color: T.textSec, lineHeight: 1.65, padding: '10px 14px', background: 'rgba(14,165,233,0.05)', borderRadius: 4, border: `1px solid rgba(14,165,233,0.15)`, marginTop: 4 }}>
            <strong>2024 Commitments:</strong> (1) Increase DQS 1–2 coverage from 42% to 55% by end-2024 through targeted engagement with top-15 emitting counterparties. (2) Extend financed emissions coverage to 92% of AUM. (3) Publish PCAF-aligned financed emissions in Annual Report (TCFD Metrics &amp; Targets section).
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
const TABS = ['Portfolio', 'Data Quality', 'Benchmarks', 'PCAF Report'];

export default function PcafFinancedEmissionsPage() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={s.titleBlock}>
          <span style={s.moduleCode}>EP-AJ1 · Sprint AJ — Financed Emissions &amp; Climate Banking Analytics</span>
          <h1 style={s.title}>PCAF Financed Emissions Calculator</h1>
          <div style={s.subtitle}>Partnership for Carbon Accounting Financials — Standard v2 (2022) · Scope 3 Category 15 Attribution</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
          <span style={s.badge('rgba(6,200,150,0.12)', T.green)}>● PCAF Standard v2</span>
          <span style={s.badge('rgba(14,165,233,0.12)', T.sage)}>GHG Protocol S3C15</span>
          <span style={{ fontSize: 10, color: T.textMut }}>Reference date: 31 Dec 2023</span>
        </div>
      </div>

      <div style={s.tabBar}>
        {TABS.map((tab, i) => (
          <button key={i} style={s.tab(activeTab === i)} onClick={() => setActiveTab(i)}>{tab}</button>
        ))}
      </div>

      {activeTab === 0 && <TabPortfolio />}
      {activeTab === 1 && <TabDataQuality />}
      {activeTab === 2 && <TabBenchmarks />}
      {activeTab === 3 && <TabPcafReport />}
    </div>
  );
}
