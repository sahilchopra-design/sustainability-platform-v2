import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis, Cell, ReferenceLine, RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts';
import { GLOBAL_COMPANY_MASTER, GLOBAL_SECTORS, EXCHANGES } from '../../../data/globalCompanyMaster';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',card:'#ffffff',sub:'#5c6b7e',indigo:'#4f46e5',blue:'#2563eb',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const EXCHANGE_COLORS = Object.fromEntries(EXCHANGES.map(e => [e.id, e.color]));
const EXCHANGE_FLAGS  = Object.fromEntries(EXCHANGES.map(e => [e._displayExchange || e.label, e.flag]));

const SECTOR_COLORS = {
  'Information Technology': '#4f46e5', 'Financials': '#1b3a5c', 'Health Care': '#be185d',
  'Consumer Discretionary': '#d97706', 'Consumer Staples': '#16a34a', 'Energy': '#dc2626',
  'Materials': '#7c3aed', 'Industrials': '#0d9488', 'Utilities': '#1d4ed8',
  'Real Estate': '#0891b2', 'Communication Services': '#ea580c', 'Mining': '#92400e',
};

const RISK_C = { 'Very High': '#dc2626', 'High': '#ea580c', 'Medium': '#d97706', 'Low': '#16a34a', 'Very Low': '#0d9488' };

// Descriptive labels for known sectors
const SECTOR_DESCRIPTIONS = {
  'Information Technology': 'Software, hardware, semiconductors, IT services & cloud platforms',
  'Financials': 'Banks, insurance, asset management, payment processors & exchanges',
  'Energy': 'Oil & gas E&P, integrated majors, refining, LNG & energy services',
  'Materials': 'Metals, mining, chemicals, forest products & construction materials',
  'Industrials': 'Aerospace, defence, engineering, transport & logistics, capital goods',
  'Consumer Discretionary': 'Automobiles, retail, travel, luxury goods & media',
  'Consumer Staples': 'Food & beverage, tobacco, household products & supermarkets',
  'Health Care': 'Pharmaceuticals, biotech, medical devices, managed care & hospitals',
  'Utilities': 'Electric power, gas distribution, water, renewable energy',
  'Real Estate': 'REITs, developers, commercial real estate services',
  'Communication Services': 'Telecom operators, internet platforms & media conglomerates',
  'Mining': 'Coal, iron ore, diversified mining (separate from Materials in some indices)',
};

const pct = (v) => v != null ? `${v.toFixed(1)}%` : '—';
const fmtB = (v) => v == null ? '—' : `$${(v/1000).toFixed(1)}B`;
const fmtCO2 = n => n == null ? '—' : n >= 1e9 ? `${(n/1e9).toFixed(2)} Gt` : n >= 1e6 ? `${(n/1e6).toFixed(1)} Mt` : `${(n/1000).toFixed(0)} Kt`;

const median = arr => {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const mean = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

/* ── Sub-components ─────────────────────────────────────────────────────── */
const Chip = ({ label, color = T.navy }) => (
  <span style={{ fontSize: 10, fontWeight: 700, color, background: `${color}15`,
    border: `1px solid ${color}44`, borderRadius: 4, padding: '2px 7px', whiteSpace: 'nowrap' }}>{label}</span>
);

const StatCard = ({ label, value, sub, color = T.navy, delta }) => (
  <div style={{ background: '#f8f7f3', borderRadius: 8, padding: '12px 14px' }}>
    <div style={{ fontSize: 10, color: T.sub, fontWeight: 600, textTransform: 'uppercase', letterSpacing: .4 }}>{label}</div>
    <div style={{ fontSize: 20, fontWeight: 800, color, margin: '4px 0 2px', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    {sub && <div style={{ fontSize: 10, color: T.sub }}>{sub}</div>}
    {delta != null && (
      <div style={{ fontSize: 10, color: delta >= 0 ? T.green : T.red, fontWeight: 600 }}>
        {delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}% vs. cross-exchange median
      </div>
    )}
  </div>
);

/* ── Multi-metric comparison table ─────────────────────────────────────── */
function ComparisonTable({ companies, sector }) {
  const [sort, setSort] = useState('market_cap_usd_mn');
  const [dir, setDir]   = useState('desc');

  const sorted = useMemo(() =>
    [...companies].sort((a, b) => {
      const av = a[sort] ?? -Infinity, bv = b[sort] ?? -Infinity;
      return dir === 'desc' ? bv - av : av - bv;
    })
  , [companies, sort, dir]);

  const toggleSort = (k) => {
    if (sort === k) setDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSort(k); setDir('desc'); }
  };

  const Th = ({ k, label }) => (
    <th onClick={() => toggleSort(k)}
      style={{ padding: '8px 10px', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap',
        textAlign: 'left', fontWeight: 700, fontSize: 11,
        color: sort === k ? T.navy : T.sub,
        background: sort === k ? '#eef2ff' : '#f1f0eb' }}>
      {label} {sort === k ? (dir === 'desc' ? '↓' : '↑') : ''}
    </th>
  );

  // compute medians for benchmark highlights
  const peValues    = companies.map(c => c.pe_ratio).filter(Boolean);
  const ghgValues   = companies.map(c => c.ghg_intensity_usd_mn || c.ghg_intensity_tco2e_cr).filter(Boolean);
  const medPE       = median(peValues);
  const medGHG      = median(ghgValues);

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
        <thead>
          <tr>
            <Th k="name" label="Company" />
            <Th k="_displayExchange" label="Exchange" />
            <Th k="market_cap_usd_mn" label="Mkt Cap (USD)" />
            <Th k="revenue_usd_mn" label="Revenue (USD)" />
            <Th k="pe_ratio" label="PE" />
            <Th k="roe_pct" label="ROE %" />
            <Th k="ebitda_margin_pct" label="EBITDA %" />
            <Th k="debt_equity_ratio" label="D/E" />
            <Th k="scope1_co2e" label="Scope 1 CO₂e" />
            <Th k="ghg_intensity_usd_mn" label="GHG Intensity" />
            <Th k="transition_risk" label="T-Risk" />
            <th style={{ padding: '8px 10px', fontWeight: 700, color: T.sub, background: '#f1f0eb' }}>SBTi</th>
            <th style={{ padding: '8px 10px', fontWeight: 700, color: T.sub, background: '#f1f0eb' }}>DQS</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((c, i) => {
            const ghgInt = c.ghg_intensity_usd_mn || c.ghg_intensity_tco2e_cr;
            const isHighPE = medPE && c.pe_ratio > medPE * 1.5;
            const isLowGHG = medGHG && ghgInt && ghgInt < medGHG * 0.5;
            return (
              <tr key={c.id || c.ticker || i}
                style={{ borderTop: `1px solid ${T.border}`, background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                <td style={{ padding: '7px 10px' }}>
                  <div style={{ fontWeight: 700, color: T.navy }}>{c.shortName || c.name}</div>
                  <div style={{ fontSize: 9, color: T.sub }}>{c.ticker} · {c.countryCode || c.country}</div>
                </td>
                <td style={{ padding: '7px 10px' }}>
                  <span style={{ fontSize: 14 }}>{EXCHANGES.find(e => e.id === c.exchange || e.id === c._displayExchange?.replace('/', '_'))?.flag || ''}</span>
                  <span style={{ fontSize: 10, color: T.sub, marginLeft: 4 }}>{c._displayExchange || c.exchange}</span>
                </td>
                <td style={{ padding: '7px 10px', fontWeight: 600, color: T.navy }}>
                  {c.market_cap_usd_mn ? fmtB(c.market_cap_usd_mn) : '—'}
                </td>
                <td style={{ padding: '7px 10px', color: T.text }}>
                  {c.revenue_usd_mn ? `$${(c.revenue_usd_mn/1000).toFixed(0)}B` : '—'}
                </td>
                <td style={{ padding: '7px 10px', fontWeight: isHighPE ? 700 : 400,
                  color: isHighPE ? T.amber : T.text }}>
                  {c.pe_ratio != null ? `${c.pe_ratio}x` : '—'}
                </td>
                <td style={{ padding: '7px 10px',
                  color: c.roe_pct > 20 ? T.green : c.roe_pct > 10 ? T.text : T.red }}>
                  {c.roe_pct != null ? pct(c.roe_pct) : '—'}
                </td>
                <td style={{ padding: '7px 10px' }}>
                  {c.ebitda_margin_pct != null ? pct(c.ebitda_margin_pct) : '—'}
                </td>
                <td style={{ padding: '7px 10px',
                  color: c.debt_equity_ratio > 2 ? T.red : c.debt_equity_ratio > 0.5 ? T.amber : T.green }}>
                  {c.debt_equity_ratio != null ? c.debt_equity_ratio.toFixed(2) : '—'}
                </td>
                <td style={{ padding: '7px 10px',
                  color: c.scope1_co2e > 10e6 ? T.red : c.scope1_co2e > 1e6 ? '#ea580c' : T.text,
                  fontWeight: c.scope1_co2e > 10e6 ? 700 : 400 }}>
                  {fmtCO2(c.scope1_co2e)}
                </td>
                <td style={{ padding: '7px 10px',
                  color: isLowGHG ? T.green : ghgInt > medGHG * 1.5 ? T.red : T.text,
                  fontWeight: isLowGHG || ghgInt > medGHG * 1.5 ? 700 : 400 }}>
                  {ghgInt != null ? `${ghgInt.toFixed(1)}` : '—'}
                </td>
                <td style={{ padding: '7px 10px' }}>
                  {c.transition_risk && (
                    <span style={{ fontSize: 10, fontWeight: 700,
                      color: RISK_C[c.transition_risk], background: `${RISK_C[c.transition_risk]}18`,
                      border: `1px solid ${RISK_C[c.transition_risk]}44`,
                      borderRadius: 4, padding: '2px 5px' }}>{c.transition_risk}</span>
                  )}
                </td>
                <td style={{ padding: '7px 10px', textAlign: 'center' }}>
                  {c.sbti_committed ? '✅' : <span style={{ color: T.sub }}>—</span>}
                </td>
                <td style={{ padding: '7px 10px', textAlign: 'center' }}>
                  {c.dqs_default && (
                    <span style={{ background: [null,'#16a34a','#65a30d','#d97706','#ea580c','#dc2626'][c.dqs_default],
                      color: '#fff', borderRadius: 10, padding: '2px 7px', fontSize: 10, fontWeight: 700 }}>
                      {c.dqs_default}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {!sorted.length && (
        <div style={{ padding: 32, textAlign: 'center', color: T.sub, fontSize: 12 }}>
          No companies in this sector yet — exchange data loading via background pipeline
        </div>
      )}
    </div>
  );
}

/* ── GHG Intensity Cross-Exchange Bar ──────────────────────────────────── */
function GHGIntensityChart({ companies }) {
  const data = useMemo(() =>
    companies
      .map(c => ({
        name: c.shortName || c.ticker,
        value: c.ghg_intensity_usd_mn || c.ghg_intensity_tco2e_cr || 0,
        exchange: c._displayExchange || c.exchange,
        sector: c.sector,
      }))
      .filter(d => d.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 20)
  , [companies]);

  const med = median(data.map(d => d.value));

  if (!data.length) return (
    <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.sub, fontSize: 12 }}>
      No GHG intensity data — loading
    </div>
  );

  return (
    <ResponsiveContainer width="100%" height={Math.max(200, data.length * 22)}>
      <BarChart data={data} layout="vertical" margin={{ left: 90, right: 40, top: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
        <XAxis type="number" tickFormatter={v => `${v.toFixed(0)}`}
          tick={{ fontSize: 10, fill: T.sub }}
          label={{ value: 'GHG Intensity (tCO₂e per USD Mn revenue)', position: 'insideBottom', offset: -4, fontSize: 10, fill: T.sub }} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: T.navy }} width={88} />
        {med && <ReferenceLine x={med} stroke={T.amber} strokeDasharray="4 4"
          label={{ value: `Med: ${med.toFixed(0)}`, position: 'top', fontSize: 9, fill: T.amber }} />}
        <Tooltip formatter={(v, n, p) => [`${v.toFixed(1)}`, 'GHG Intensity']}
          content={({ payload }) => {
            if (!payload?.length) return null;
            const d = payload[0]?.payload;
            return (
              <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 6, padding: '8px 10px', fontSize: 11 }}>
                <div style={{ fontWeight: 700 }}>{d?.name}</div>
                <div style={{ color: T.sub }}>{d?.exchange}</div>
                <div>GHG Intensity: <strong>{d?.value?.toFixed(1)}</strong></div>
                {med && <div style={{ color: d?.value > med ? T.red : T.green }}>
                  {d?.value > med ? `▲ ${((d.value - med)/med*100).toFixed(0)}% above median` : `▼ ${((med - d.value)/med*100).toFixed(0)}% below median`}
                </div>}
              </div>
            );
          }} />
        <Bar dataKey="value" radius={[0, 3, 3, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={med && entry.value > med * 1.5 ? T.red : med && entry.value < med * 0.5 ? T.green : T.amber} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ── PE vs ROE Scatter ─────────────────────────────────────────────────── */
function ValuationScatter({ companies }) {
  const data = useMemo(() =>
    companies
      .filter(c => c.pe_ratio > 0 && c.pe_ratio < 200 && c.roe_pct != null)
      .map(c => ({
        x: c.roe_pct,
        y: c.pe_ratio,
        z: Math.min(60, Math.sqrt((c.market_cap_usd_mn || 1000) / 5000) * 5),
        name: c.shortName,
        exchange: c._displayExchange || c.exchange,
      }))
  , [companies]);

  if (!data.length) return (
    <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.sub, fontSize: 12 }}>
      No PE / ROE data available
    </div>
  );

  return (
    <ResponsiveContainer width="100%" height={180}>
      <ScatterChart margin={{ left: 10, right: 20, top: 10, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis type="number" dataKey="x" name="ROE %"
          label={{ value: 'ROE %', position: 'insideBottom', offset: -4, fontSize: 10, fill: T.sub }}
          tick={{ fontSize: 9, fill: T.sub }} />
        <YAxis type="number" dataKey="y" name="PE Ratio"
          label={{ value: 'PE', angle: -90, position: 'insideLeft', offset: 10, fontSize: 10, fill: T.sub }}
          tick={{ fontSize: 9, fill: T.sub }} />
        <ZAxis type="number" dataKey="z" range={[20, 400]} />
        <Tooltip content={({ payload }) => {
          if (!payload?.length) return null;
          const d = payload[0]?.payload;
          return (
            <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 6, padding: '8px 10px', fontSize: 11 }}>
              <div style={{ fontWeight: 700 }}>{d?.name}</div>
              <div>PE: {d?.y?.toFixed(1)}x · ROE: {d?.x?.toFixed(1)}%</div>
              <div style={{ color: T.sub }}>{d?.exchange}</div>
            </div>
          );
        }} />
        <Scatter data={data} fill={T.navy} fillOpacity={0.6} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

/* ── Paris Alignment Gap ─────────────────────────────────────────────────── */
function ParisAlignmentPanel({ companies, sector }) {
  // Simplified Paris budget proxies by sector (tCO2e / USD Mn revenue, 2030 target)
  const PARIS_2030 = {
    'Energy': 45, 'Materials': 60, 'Mining': 80, 'Utilities': 120, 'Industrials': 30,
    'Information Technology': 5, 'Financials': 2, 'Health Care': 8,
    'Consumer Discretionary': 20, 'Consumer Staples': 15, 'Real Estate': 25, 'Communication Services': 6,
  };
  const target = PARIS_2030[sector];

  const companiesWithGHG = useMemo(() =>
    companies
      .filter(c => c.ghg_intensity_usd_mn > 0 || c.ghg_intensity_tco2e_cr > 0)
      .map(c => ({
        ...c,
        ghg_int: c.ghg_intensity_usd_mn || c.ghg_intensity_tco2e_cr,
      }))
      .sort((a, b) => a.ghg_int - b.ghg_int)
  , [companies]);

  if (!companiesWithGHG.length || !target) {
    return (
      <div style={{ padding: 16, textAlign: 'center', color: T.sub, fontSize: 12, fontStyle: 'italic' }}>
        {!target ? 'Paris alignment benchmark not available for this sector' : 'No GHG intensity data'}
      </div>
    );
  }

  const aligned = companiesWithGHG.filter(c => c.ghg_int <= target);
  const overBudget = companiesWithGHG.filter(c => c.ghg_int > target);

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ background: `${T.green}15`, border: `1px solid ${T.green}44`, borderRadius: 8, padding: '10px 14px', flex: 1 }}>
          <div style={{ fontSize: 10, color: T.green, fontWeight: 700 }}>PARIS-ALIGNED ≤{target} tCO₂e/USD Mn</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: T.green }}>{aligned.length}</div>
          <div style={{ fontSize: 10, color: T.sub }}>of {companiesWithGHG.length} with GHG data</div>
        </div>
        <div style={{ background: `${T.red}15`, border: `1px solid ${T.red}44`, borderRadius: 8, padding: '10px 14px', flex: 1 }}>
          <div style={{ fontSize: 10, color: T.red, fontWeight: 700 }}>OVER BUDGET &gt;{target}</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: T.red }}>{overBudget.length}</div>
          <div style={{ fontSize: 10, color: T.sub }}>companies need decarbonisation</div>
        </div>
      </div>

      {companiesWithGHG.slice(0, 12).map(c => {
        const gap = c.ghg_int - target;
        const pctGap = (gap / target) * 100;
        const barWidth = Math.min(100, Math.max(4, (c.ghg_int / (target * 3)) * 100));
        const isAligned = gap <= 0;
        return (
          <div key={c.ticker || c.name} style={{ marginBottom: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
              <span style={{ fontWeight: 600, color: T.navy }}>{c.shortName || c.ticker}</span>
              <span style={{ color: isAligned ? T.green : T.red, fontWeight: 700 }}>
                {c.ghg_int.toFixed(1)} {isAligned ? '✓' : `▲ +${pctGap.toFixed(0)}%`}
              </span>
            </div>
            <div style={{ height: 7, borderRadius: 4, background: '#e5e7eb', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, height: '100%',
                width: `${barWidth}%`,
                background: isAligned ? T.green : gap > target ? T.red : T.amber,
                borderRadius: 4, transition: 'width .3s' }} />
              <div style={{ position: 'absolute', left: `${Math.min(95, (target / (target * 3)) * 100)}%`,
                top: 0, height: '100%', width: 2, background: T.navy, opacity: .5 }} />
            </div>
          </div>
        );
      })}
      <div style={{ fontSize: 10, color: T.sub, marginTop: 8 }}>
        ▌ = 2030 Paris sector budget ({target} tCO₂e/USD Mn rev) · Source: PCAF sector pathways / IEA NZE 2050
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════════════════════════ */
export default function SectorBenchmarkingPage() {
  const [sector, setSector]     = useState('Energy');
  const [exchFilter, setExch]   = useState('All');
  const [view, setView]         = useState('comparison'); // comparison | ghg | valuation | paris

  // Derive available sectors from global master
  const sectors = useMemo(() =>
    [...new Set(GLOBAL_COMPANY_MASTER.map(c => c.sector))].filter(Boolean).sort()
  , []);

  // Exchanges that have data for this sector
  const exchangesWithData = useMemo(() =>
    EXCHANGES.filter(ex => ex.companies.some(c => c.sector === sector))
  , [sector]);

  // Filtered company pool
  const companies = useMemo(() => {
    let pool = GLOBAL_COMPANY_MASTER.filter(c => c.sector === sector);
    if (exchFilter !== 'All') {
      pool = pool.filter(c => (c._displayExchange || c.exchange) === exchFilter || c._region === exchFilter);
    }
    return pool;
  }, [sector, exchFilter]);

  // Sector-level aggregate stats
  const stats = useMemo(() => {
    const mktcaps  = companies.map(c => c.market_cap_usd_mn).filter(Boolean);
    const revenues = companies.map(c => c.revenue_usd_mn).filter(Boolean);
    const pe_vals  = companies.map(c => c.pe_ratio).filter(Boolean);
    const roe_vals = companies.map(c => c.roe_pct).filter(Boolean);
    const ghg_vals = companies.map(c => c.scope1_co2e).filter(Boolean);
    return {
      count: companies.length,
      exchanges: new Set(companies.map(c => c._displayExchange || c.exchange)).size,
      total_mktcap: mktcaps.reduce((s, v) => s + v, 0),
      median_pe: median(pe_vals),
      mean_pe: mean(pe_vals),
      median_roe: median(roe_vals),
      total_scope1: ghg_vals.reduce((s, v) => s + v, 0),
      sbti_pct: companies.length ? Math.round(companies.filter(c => c.sbti_committed).length / companies.length * 100) : 0,
      high_risk_pct: companies.length ? Math.round(companies.filter(c => ['High','Very High'].includes(c.transition_risk)).length / companies.length * 100) : 0,
    };
  }, [companies]);

  const sectorColor = SECTOR_COLORS[sector] || T.navy;

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: '24px 28px', color: T.text }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <span style={{ background: T.navy, color: T.gold, borderRadius: 8, padding: '6px 14px', fontSize: 13, fontWeight: 700 }}>E</span>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: T.navy, margin: 0 }}>Global Sector Benchmarking</h1>
          <span style={{ background: `${sectorColor}18`, color: sectorColor, border: `1px solid ${sectorColor}44`,
            borderRadius: 20, padding: '2px 12px', fontSize: 11, fontWeight: 700 }}>
            {sector} · {stats.count} Companies · {stats.exchanges} Exchanges
          </span>
        </div>
        <p style={{ fontSize: 13, color: T.sub, margin: 0 }}>
          Cross-exchange peer comparison within a single GICS sector — valuation multiples, GHG intensity,
          Paris alignment gap, and climate risk ratings side-by-side.
        </p>
      </div>

      {/* ── Regulatory Context ── */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderLeft: `4px solid ${sectorColor}`,
        borderRadius: 8, padding: '10px 16px', marginBottom: 16, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        {[['GICS Sector Classification', T.navy], ['PCAF Sector Attribution', T.teal],
          ['IEA NZE 2050 Pathways', T.red], ['SBTi Sector Guidance', T.green],
          ['TCFD Sector Supplement', T.blue], ['CRREM Real Estate (if RE)', T.purple]
        ].map(([l, c]) => (
          <span key={l} style={{ fontSize: 10, fontWeight: 700, color: c, background: `${c}15`,
            border: `1px solid ${c}44`, borderRadius: 4, padding: '2px 7px' }}>{l}</span>
        ))}
        <div style={{ marginLeft: 'auto', fontSize: 11, color: T.sub }}>
          Feeds: <strong style={{ color: T.navy }}>Portfolio PCAF · Climate VaR · CSRD ESRS E1</strong>
        </div>
      </div>

      {/* ── Sector + Exchange selectors ── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* Sector grid */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 14, minWidth: 260 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 10 }}>Select Sector</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {sectors.map(s => {
              const count = GLOBAL_COMPANY_MASTER.filter(c => c.sector === s).length;
              const isActive = s === sector;
              const sc = SECTOR_COLORS[s] || T.navy;
              return (
                <button key={s} onClick={() => setSector(s)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '7px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
                    fontFamily: T.font, fontSize: 12, textAlign: 'left',
                    background: isActive ? `${sc}18` : 'transparent',
                    fontWeight: isActive ? 700 : 400,
                    color: isActive ? sc : T.text,
                    borderLeft: isActive ? `3px solid ${sc}` : '3px solid transparent',
                  }}>
                  <span>{s}</span>
                  <span style={{ fontSize: 10, color: isActive ? sc : T.sub, fontWeight: 700 }}>{count}</span>
                </button>
              );
            })}
            {!sectors.length && (
              <div style={{ fontSize: 11, color: T.sub, fontStyle: 'italic', padding: 8 }}>
                Loading sector data…
              </div>
            )}
          </div>
        </div>

        {/* Main panel */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Sector description */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`,
            borderTop: `4px solid ${sectorColor}`, borderRadius: 10, padding: '16px 20px', marginBottom: 14 }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: sectorColor, marginBottom: 4 }}>{sector}</div>
                <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.5 }}>{SECTOR_DESCRIPTIONS[sector] || ''}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                  {exchangesWithData.map(e => (
                    <span key={e.id} style={{ fontSize: 10, fontWeight: 700, color: e.color,
                      background: `${e.color}15`, border: `1px solid ${e.color}44`, borderRadius: 4, padding: '2px 7px' }}>
                      {e.flag} {e.id.split('_')[0]}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <StatCard label="Companies" value={stats.count} sub={`${stats.exchanges} exchanges`} color={sectorColor} />
                <StatCard label="Total Mkt Cap" value={fmtB(stats.total_mktcap)} sub="USD equivalent" color={T.navy} />
                <StatCard label="Median PE" value={stats.median_pe ? `${stats.median_pe.toFixed(1)}x` : '—'} sub="P/E ratio" color={T.teal} />
                <StatCard label="SBTi Committed" value={`${stats.sbti_pct}%`} sub="of sector universe" color={T.green} />
              </div>
            </div>
          </div>

          {/* Exchange filter row */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ fontSize: 11, color: T.sub, marginRight: 4 }}>Filter exchange:</div>
            <button onClick={() => setExch('All')}
              style={{ padding: '5px 12px', borderRadius: 6, border: `1px solid ${exchFilter === 'All' ? T.navy : T.border}`,
                background: exchFilter === 'All' ? T.navy : '#fff', color: exchFilter === 'All' ? '#fff' : T.sub,
                fontFamily: T.font, fontSize: 11, cursor: 'pointer', fontWeight: exchFilter === 'All' ? 700 : 400 }}>
              All ({GLOBAL_COMPANY_MASTER.filter(c => c.sector === sector).length})
            </button>
            {exchangesWithData.map(e => {
              const cnt = e.companies.filter(c => c.sector === sector).length;
              const isActive = exchFilter === e.id || exchFilter === e._displayExchange;
              return (
                <button key={e.id} onClick={() => setExch(isActive ? 'All' : e.id)}
                  style={{ padding: '5px 12px', borderRadius: 6,
                    border: `1px solid ${isActive ? e.color : T.border}`,
                    background: isActive ? `${e.color}18` : '#fff',
                    color: isActive ? e.color : T.sub,
                    fontFamily: T.font, fontSize: 11, cursor: 'pointer',
                    fontWeight: isActive ? 700 : 400 }}>
                  {e.flag} {e.index || e.id} ({cnt})
                </button>
              );
            })}
          </div>

          {/* View toggle */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 16, background: T.card,
            border: `1px solid ${T.border}`, borderRadius: 8, padding: 4, width: 'fit-content' }}>
            {[['comparison','🏆 Peer Comparison'],['ghg','🌡 GHG Intensity'],['valuation','💹 Valuation'],['paris','🎯 Paris Alignment']].map(([v, l]) => (
              <button key={v} onClick={() => setView(v)}
                style={{ padding: '7px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
                  fontFamily: T.font, fontSize: 12, fontWeight: view === v ? 700 : 500,
                  background: view === v ? sectorColor : 'transparent',
                  color: view === v ? '#fff' : T.sub, whiteSpace: 'nowrap' }}>
                {l}
              </button>
            ))}
          </div>

          {/* Comparison Table */}
          {view === 'comparison' && (
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 20px' }}>
              <ComparisonTable companies={companies} sector={sector} />
            </div>
          )}

          {/* GHG Intensity Chart */}
          {view === 'ghg' && (
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '18px 20px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 4 }}>GHG Intensity — Cross-Exchange Comparison</div>
              <div style={{ fontSize: 11, color: T.sub, marginBottom: 14 }}>
                tCO₂e per USD Mn revenue · Amber = sector median · Red = 1.5× above · Green = 0.5× below · ▌ = median
              </div>
              <GHGIntensityChart companies={companies} />
            </div>
          )}

          {/* Valuation Scatter */}
          {view === 'valuation' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '18px 20px' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>PE vs ROE — Value/Quality Matrix</div>
                <ValuationScatter companies={companies} />
                <div style={{ fontSize: 10, color: T.sub, marginTop: 8 }}>
                  Bubble size = market cap. Top-left = undervalued quality. Bottom-right = overvalued low-quality.
                </div>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '18px 20px' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Sector Multiples Summary</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { l: 'Median PE', v: stats.median_pe ? `${stats.median_pe.toFixed(1)}x` : '—' },
                    { l: 'Mean PE', v: stats.mean_pe ? `${stats.mean_pe.toFixed(1)}x` : '—' },
                    { l: 'Median ROE', v: stats.median_roe ? pct(stats.median_roe) : '—' },
                    { l: 'Total Market Cap', v: fmtB(stats.total_mktcap) },
                    { l: 'High T-Risk %', v: `${stats.high_risk_pct}%` },
                    { l: 'SBTi Committed %', v: `${stats.sbti_pct}%` },
                    { l: 'Total Scope 1', v: fmtCO2(stats.total_scope1) },
                  ].map(({ l, v }) => (
                    <div key={l} style={{ display: 'flex', justifyContent: 'space-between',
                      padding: '8px 0', borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
                      <span style={{ color: T.sub }}>{l}</span>
                      <span style={{ fontWeight: 700, color: T.navy }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Paris Alignment */}
          {view === 'paris' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '18px 20px' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 4 }}>Paris 1.5°C Alignment Gap</div>
                <div style={{ fontSize: 11, color: T.sub, marginBottom: 14 }}>
                  Sector-specific GHG intensity budget based on IEA NZE 2050 / PCAF sector pathways
                </div>
                <ParisAlignmentPanel companies={companies} sector={sector} />
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '18px 20px' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Climate Commitment Breakdown</div>
                {[
                  { l: '✅ SBTi Committed', n: companies.filter(c => c.sbti_committed).length, c: T.green },
                  { l: '🎯 Net Zero Target', n: companies.filter(c => c.carbon_neutral_target_year).length, c: T.teal },
                  { l: '🔴 Very High T-Risk', n: companies.filter(c => c.transition_risk === 'Very High').length, c: T.red },
                  { l: '🟠 High T-Risk', n: companies.filter(c => c.transition_risk === 'High').length, c: '#ea580c' },
                  { l: '🟡 Medium T-Risk', n: companies.filter(c => c.transition_risk === 'Medium').length, c: T.amber },
                  { l: '🟢 Low T-Risk', n: companies.filter(c => ['Low','Very Low'].includes(c.transition_risk)).length, c: T.green },
                  { l: '📋 DQS-1 Verified GHG', n: companies.filter(c => c.dqs_default === 1).length, c: T.green },
                  { l: '📋 DQS-2 Audited GHG', n: companies.filter(c => c.dqs_default === 2).length, c: '#65a30d' },
                  { l: '📋 DQS-3+ Proxy/Est.', n: companies.filter(c => (c.dqs_default || 0) >= 3).length, c: T.amber },
                ].map(({ l, n, c }) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '7px 0', borderBottom: `1px solid ${T.border}` }}>
                    <span style={{ fontSize: 12 }}>{l}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: companies.length ? Math.max(4, (n / companies.length) * 80) : 4, height: 6, background: c, borderRadius: 3 }} />
                      <span style={{ fontWeight: 700, color: c, fontSize: 13, minWidth: 24, textAlign: 'right' }}>{n}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
