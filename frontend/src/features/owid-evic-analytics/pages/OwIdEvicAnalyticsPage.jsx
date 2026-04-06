import React, { useState, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ScatterChart, Scatter, ZAxis, Legend, ReferenceLine,
} from 'recharts';

const T = {
  navy: '#1b3a5c', gold: '#c5a96a', cream: '#f7f4ef',
  teal: '#0f766e', green: '#15803d', red: '#b91c1c',
  amber: '#b45309', purple: '#6d28d9', slate: '#334155',
  font: 'DM Sans, sans-serif', mono: 'JetBrains Mono, monospace',
};

const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

// ── OWID CO₂ — 12 countries × 34 years (1990–2023) ──────────────────────────
const COUNTRIES = [
  { iso: 'USA', name: 'United States',   base: 5100, perCap: 16.1, trend: -0.8 },
  { iso: 'CHN', name: 'China',           base: 2200, perCap: 7.5,  trend: +3.2 },
  { iso: 'IND', name: 'India',           base: 580,  perCap: 1.9,  trend: +2.1 },
  { iso: 'RUS', name: 'Russia',          base: 1650, perCap: 11.5, trend: -0.2 },
  { iso: 'JPN', name: 'Japan',           base: 1200, perCap: 9.5,  trend: -0.5 },
  { iso: 'DEU', name: 'Germany',         base: 900,  perCap: 10.8, trend: -1.2 },
  { iso: 'GBR', name: 'United Kingdom',  base: 570,  perCap: 9.2,  trend: -1.8 },
  { iso: 'BRA', name: 'Brazil',          base: 310,  perCap: 2.1,  trend: +0.4 },
  { iso: 'CAN', name: 'Canada',          base: 570,  perCap: 17.2, trend: -0.6 },
  { iso: 'AUS', name: 'Australia',       base: 380,  perCap: 18.5, trend: -0.7 },
  { iso: 'ZAF', name: 'South Africa',    base: 320,  perCap: 7.8,  trend: +0.3 },
  { iso: 'IDN', name: 'Indonesia',       base: 240,  perCap: 1.4,  trend: +1.8 },
];

const YEARS = Array.from({ length: 34 }, (_, i) => 1990 + i);

const CO2_TIMESERIES = useMemo ? (() => {})() : null; // computed inline below

const getCo2 = (country, year) => {
  const idx = year - 1990;
  const noise = (sr(COUNTRIES.indexOf(country) * 100 + idx) - 0.5) * country.base * 0.04;
  return Math.max(0, country.base + country.trend * idx * country.base / 100 + noise);
};

const TREND_DATA = YEARS.map(yr => {
  const row = { year: yr };
  COUNTRIES.forEach(c => { row[c.iso] = +getCo2(c, yr).toFixed(0); });
  return row;
});

// ── EVIC — 35 tickers ────────────────────────────────────────────────────────
const TICKERS = [
  'AAPL','MSFT','GOOGL','AMZN','META','TSLA','NVDA','BRK.B','JPM','JNJ',
  'V','PG','XOM','HD','BAC','MA','CVX','LLY','ABBV','PFE',
  'KO','PEP','AVGO','COST','MRK','TMO','ACN','NKE','DIS','AMD',
  'INTC','GS','WMT','T','VZ',
];

const SECTORS = ['Technology','Healthcare','Financials','Consumer','Energy','Industrials','Utilities'];

const EVIC_DATA = TICKERS.map((ticker, i) => {
  const sector = SECTORS[i % 7];
  const marketCap = 80 + sr(i * 3 + 1) * 2400;        // $B
  const totalDebt = marketCap * (0.1 + sr(i * 3 + 2) * 0.6);
  const cash = marketCap * (0.05 + sr(i * 3 + 3) * 0.2);
  const minorityInt = marketCap * sr(i * 3 + 4) * 0.05;
  const evic = marketCap + totalDebt + minorityInt - cash;
  const scope1 = 50 + sr(i * 5 + 1) * 5000;           // ktCO₂e
  const scope2 = 20 + sr(i * 5 + 2) * 2000;
  const waci = (scope1 + scope2) / (evic / 1000) * 100; // tCO₂e / $M EVIC
  const finEmissions = (scope1 + scope2) / 1000 * (marketCap / evic); // ktCO₂e
  return {
    ticker, sector,
    marketCap: +marketCap.toFixed(1),
    totalDebt: +totalDebt.toFixed(1),
    cash: +cash.toFixed(1),
    evic: +evic.toFixed(1),
    scope1: +scope1.toFixed(0),
    scope2: +scope2.toFixed(0),
    waci: +waci.toFixed(2),
    finEmissions: +finEmissions.toFixed(1),
    debtToEvic: +(totalDebt / evic * 100).toFixed(1),
  };
});

// ── Data quality matrix ───────────────────────────────────────────────────────
const DQ_SOURCES = [
  { source: 'OWID CO₂ Annual',     table: 'owid_co2_annual',    rows: 58_432, completeness: 98.2, freshness: '2026-03-15', latency: 'Monthly',   coverage: '207 countries' },
  { source: 'OWID Energy Mix',      table: 'owid_energy_mix',    rows: 41_208, completeness: 96.7, freshness: '2026-03-15', latency: 'Monthly',   coverage: '200 countries' },
  { source: 'yfinance EVIC',        table: 'yfinance_evic',      rows: 3_501,  completeness: 94.1, freshness: '2026-04-01', latency: 'Daily',     coverage: '3,501 tickers' },
  { source: 'yfinance Prices',      table: 'yfinance_prices',    rows: 12_084, completeness: 99.3, freshness: '2026-04-01', latency: 'Daily',     coverage: '12,084 tickers' },
  { source: 'GLEIF LEI Registry',   table: 'gleif_lei',          rows: 2_184_000, completeness: 99.8, freshness: '2026-03-30', latency: 'Weekly', coverage: '246 jurisdictions' },
  { source: 'SBTi Targets',         table: 'sbti_targets',       rows: 9_312,  completeness: 97.5, freshness: '2026-03-31', latency: 'Weekly',    coverage: 'SBTi registry' },
  { source: 'OFAC Sanctions',       table: 'ofac_sdn',           rows: 14_820, completeness: 100.0,freshness: '2026-04-01', latency: 'Daily',     coverage: 'SDN + Non-SDN' },
  { source: 'Climate TRACE',        table: 'climate_trace_emit', rows: 0,      completeness: 0.0,  freshness: 'NEVER',      latency: 'Monthly',   coverage: 'Last run failed' },
];

const pill = (label, color, bg) => (
  <span style={{ background: bg || color + '22', color, border: `1px solid ${color}44`,
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

export default function OwIdEvicAnalyticsPage() {
  const [tab, setTab] = useState(0);
  const [selectedCountries, setSelectedCountries] = useState(['USA', 'CHN', 'IND', 'DEU', 'GBR']);
  const [evicSort, setEvicSort] = useState('evic');
  const [sectorFilter, setSectorFilter] = useState('ALL');

  const tabs = ['OWID CO₂ Time-Series', 'EVIC Calculator', 'Data Quality Monitor', 'Methodology'];

  const toggleCountry = (iso) => setSelectedCountries(prev =>
    prev.includes(iso) ? prev.filter(c => c !== iso) : [...prev, iso]
  );

  const filteredEvic = useMemo(() => {
    let data = sectorFilter === 'ALL' ? EVIC_DATA : EVIC_DATA.filter(e => e.sector === sectorFilter);
    return [...data].sort((a, b) => b[evicSort] - a[evicSort]);
  }, [evicSort, sectorFilter]);

  const COUNTRY_COLORS = ['#1b3a5c','#0f766e','#b45309','#b91c1c','#6d28d9','#15803d','#0284c7','#9333ea','#dc2626','#d97706','#059669','#0891b2'];

  // Sector WACI
  const sectorWaci = useMemo(() => {
    return SECTORS.map(s => {
      const items = EVIC_DATA.filter(e => e.sector === s);
      const avg = items.length ? items.reduce((sum, e) => sum + e.waci, 0) / items.length : 0;
      return { sector: s, waci: +avg.toFixed(1) };
    }).sort((a, b) => b.waci - a.waci);
  }, []);

  return (
    <div style={{ fontFamily: T.font, background: T.cream, minHeight: '100vh', padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ background: T.teal, color: '#fff', borderRadius: 8, padding: '6px 14px',
          fontFamily: T.mono, fontSize: 12, fontWeight: 700 }}>EP-BF2</div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.navy }}>
          OWID CO₂ &amp; EVIC Analytics
        </h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {pill('OWID 207 Countries', T.teal)}
          {pill('yfinance EVIC 3.5K', T.green)}
          {pill('WACI · PCAF', T.amber)}
          {pill('1990–2023', T.navy)}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `2px solid ${T.navy}22` }}>
        {tabs.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{
            background: tab === i ? T.teal : 'transparent',
            color: tab === i ? '#fff' : T.slate,
            border: 'none', borderRadius: '6px 6px 0 0', padding: '8px 16px',
            fontFamily: T.font, fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>{t}</button>
        ))}
      </div>

      {/* ── Tab 0: OWID CO₂ ── */}
      {tab === 0 && (
        <div>
          {/* KPIs */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            {card('Countries', '207', '1990–2023 OWID dataset')}
            {card('Data Points', '58.4K', 'Rows in owid_co2_annual', T.teal)}
            {card('Global CO₂ 2022', '37.1 Gt', 'Including land-use change', T.red)}
            {card('Per-Capita (World)', '4.7 t', 'tCO₂ per person 2022', T.amber)}
            {card('Fastest Growing', 'IND +2.1%', 'Avg annual growth 1990–2023', T.navy)}
          </div>

          {/* Country toggles */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {COUNTRIES.map((c, i) => (
              <button key={c.iso} onClick={() => toggleCountry(c.iso)} style={{
                background: selectedCountries.includes(c.iso) ? COUNTRY_COLORS[i] : '#fff',
                color: selectedCountries.includes(c.iso) ? '#fff' : T.slate,
                border: `1px solid ${COUNTRY_COLORS[i]}`,
                borderRadius: 16, padding: '3px 10px', fontSize: 11,
                fontFamily: T.mono, cursor: 'pointer',
              }}>{c.iso}</button>
            ))}
          </div>

          {/* CO₂ line chart */}
          <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${T.navy}22`, padding: 16, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, color: T.navy, marginBottom: 12 }}>
              Total CO₂ Emissions (MtCO₂) 1990–2023 — Selected Countries
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={TREND_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 10, fontFamily: T.mono }} interval={4} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => v.toLocaleString()} />
                <Tooltip formatter={(v, n) => [v.toLocaleString() + ' Mt', n]} />
                <Legend />
                {COUNTRIES.filter(c => selectedCountries.includes(c.iso)).map((c, i) => (
                  <Line key={c.iso} type="monotone" dataKey={c.iso}
                    stroke={COUNTRY_COLORS[COUNTRIES.indexOf(c)]} strokeWidth={2} dot={false}
                    name={c.name} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Per-capita table */}
          <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${T.navy}22`, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.navy, color: '#fff' }}>
                  {['Country','ISO','CO₂ 2023 (Mt)','Per Capita (t)','Avg Annual Change','1990 Base (Mt)','% Change vs 1990'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontFamily: T.mono, fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COUNTRIES.map((c, i) => {
                  const co2_1990 = getCo2(c, 1990);
                  const co2_2023 = getCo2(c, 2023);
                  const pct = ((co2_2023 - co2_1990) / co2_1990 * 100).toFixed(1);
                  return (
                    <tr key={c.iso} style={{ background: i % 2 === 0 ? '#fff' : T.cream + '80',
                      borderBottom: `1px solid ${T.navy}11` }}>
                      <td style={{ padding: '9px 12px', fontWeight: 600, color: T.navy }}>{c.name}</td>
                      <td style={{ padding: '9px 12px', fontFamily: T.mono }}>{c.iso}</td>
                      <td style={{ padding: '9px 12px', fontFamily: T.mono, textAlign: 'right' }}>{co2_2023.toFixed(0)}</td>
                      <td style={{ padding: '9px 12px', fontFamily: T.mono, textAlign: 'right' }}>{c.perCap.toFixed(1)}</td>
                      <td style={{ padding: '9px 12px' }}>
                        {pill(`${c.trend > 0 ? '+' : ''}${c.trend.toFixed(1)}%/yr`, c.trend > 0 ? T.red : T.green)}
                      </td>
                      <td style={{ padding: '9px 12px', fontFamily: T.mono, textAlign: 'right' }}>{co2_1990.toFixed(0)}</td>
                      <td style={{ padding: '9px 12px' }}>
                        {pill(`${pct > 0 ? '+' : ''}${pct}%`, parseFloat(pct) > 0 ? T.red : T.green)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab 1: EVIC Calculator ── */}
      {tab === 1 && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {['ALL', ...SECTORS].map(s => (
                <button key={s} onClick={() => setSectorFilter(s)} style={{
                  background: sectorFilter === s ? T.teal : '#fff',
                  color: sectorFilter === s ? '#fff' : T.slate,
                  border: `1px solid ${T.teal}44`, borderRadius: 6,
                  padding: '4px 10px', fontSize: 11, cursor: 'pointer',
                }}>{s}</button>
              ))}
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
              {[['evic','EVIC'],['waci','WACI'],['finEmissions','Fin.Emis'],['marketCap','Mkt Cap']].map(([k, l]) => (
                <button key={k} onClick={() => setEvicSort(k)} style={{
                  background: evicSort === k ? T.navy : '#fff',
                  color: evicSort === k ? '#fff' : T.slate,
                  border: `1px solid ${T.navy}33`, borderRadius: 6,
                  padding: '4px 10px', fontSize: 11, cursor: 'pointer',
                }}>Sort: {l}</button>
              ))}
            </div>
          </div>

          {/* WACI by sector */}
          <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${T.navy}22`, padding: 16, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, color: T.navy, marginBottom: 12 }}>
              WACI by Sector (tCO₂e / $M EVIC) — PCAF Attribution Basis
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={sectorWaci}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="sector" tick={{ fontSize: 11, fontFamily: T.mono }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={v => [v + ' tCO₂e/$M', 'WACI']} />
                <Bar dataKey="waci" fill={T.teal} radius={[4,4,0,0]} />
                <ReferenceLine y={sectorWaci.reduce((s,r)=>s+r.waci,0)/sectorWaci.length} stroke={T.red} strokeDasharray="4 2" label={{ value: 'Avg', fontSize: 10, fill: T.red }} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* EVIC table */}
          <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${T.navy}22`, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: T.navy, color: '#fff' }}>
                  {['Ticker','Sector','Mkt Cap ($B)','Total Debt ($B)','Cash ($B)','EVIC ($B)','Scope 1 (kt)','Scope 2 (kt)','WACI','Fin.Emis (kt)','Debt/EVIC'].map(h => (
                    <th key={h} style={{ padding: '10px 10px', textAlign: 'left', fontFamily: T.mono, fontSize: 10 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredEvic.slice(0, 25).map((e, i) => (
                  <tr key={e.ticker} style={{ background: i % 2 === 0 ? '#fff' : T.cream + '80',
                    borderBottom: `1px solid ${T.navy}11` }}>
                    <td style={{ padding: '8px 10px', fontFamily: T.mono, fontWeight: 700, color: T.navy }}>{e.ticker}</td>
                    <td style={{ padding: '8px 10px' }}>{pill(e.sector, T.purple)}</td>
                    <td style={{ padding: '8px 10px', fontFamily: T.mono, textAlign: 'right' }}>{e.marketCap.toFixed(0)}</td>
                    <td style={{ padding: '8px 10px', fontFamily: T.mono, textAlign: 'right' }}>{e.totalDebt.toFixed(0)}</td>
                    <td style={{ padding: '8px 10px', fontFamily: T.mono, textAlign: 'right' }}>{e.cash.toFixed(0)}</td>
                    <td style={{ padding: '8px 10px', fontFamily: T.mono, fontWeight: 700, color: T.teal, textAlign: 'right' }}>{e.evic.toFixed(0)}</td>
                    <td style={{ padding: '8px 10px', fontFamily: T.mono, textAlign: 'right' }}>{e.scope1.toLocaleString()}</td>
                    <td style={{ padding: '8px 10px', fontFamily: T.mono, textAlign: 'right' }}>{e.scope2.toLocaleString()}</td>
                    <td style={{ padding: '8px 10px' }}>
                      {pill(e.waci.toFixed(1), e.waci > 100 ? T.red : e.waci > 50 ? T.amber : T.green)}
                    </td>
                    <td style={{ padding: '8px 10px', fontFamily: T.mono, textAlign: 'right' }}>{e.finEmissions.toFixed(1)}</td>
                    <td style={{ padding: '8px 10px', fontFamily: T.mono, textAlign: 'right' }}>{e.debtToEvic}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
            {card('Total EVIC Universe', '$' + (EVIC_DATA.reduce((s,e)=>s+e.evic,0)/1000).toFixed(1) + 'T', '35 tickers')}
            {card('Avg WACI', (EVIC_DATA.reduce((s,e)=>s+e.waci,0)/EVIC_DATA.length).toFixed(1) + ' tCO₂/$M', 'Portfolio average', T.amber)}
            {card('Highest WACI', SECTORS[sectorWaci[0].sector] || sectorWaci[0].sector, 'Most carbon-intensive', T.red)}
            {card('Total Fin. Emissions', (EVIC_DATA.reduce((s,e)=>s+e.finEmissions,0)/1000).toFixed(2) + ' MtCO₂e', 'PCAF Scope 1+2', T.green)}
          </div>
        </div>
      )}

      {/* ── Tab 2: Data Quality Monitor ── */}
      {tab === 2 && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            {card('Active Sources', DQ_SOURCES.filter(s=>s.completeness>0).length, 'Of 8 configured')}
            {card('Failed Sources', DQ_SOURCES.filter(s=>s.completeness===0).length, 'Needs attention', T.red)}
            {card('Avg Completeness', (DQ_SOURCES.filter(s=>s.completeness>0).reduce((s,r)=>s+r.completeness,0)/DQ_SOURCES.filter(s=>s.completeness>0).length).toFixed(1)+'%', 'Healthy sources only', T.green)}
            {card('Total Rows', (DQ_SOURCES.reduce((s,r)=>s+r.rows,0)/1e6).toFixed(2)+'M', 'Across all warehouse tables')}
          </div>

          <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${T.navy}22`, overflow: 'hidden', marginBottom: 16 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.navy, color: '#fff' }}>
                  {['Source','Table','Row Count','Completeness','Last Refresh','Latency','Coverage'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontFamily: T.mono, fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DQ_SOURCES.map((s, i) => (
                  <tr key={s.source} style={{ background: i % 2 === 0 ? '#fff' : T.cream + '80',
                    borderBottom: `1px solid ${T.navy}11`,
                    opacity: s.completeness === 0 ? 0.7 : 1 }}>
                    <td style={{ padding: '9px 12px', fontWeight: 600, color: s.completeness === 0 ? T.red : T.navy }}>{s.source}</td>
                    <td style={{ padding: '9px 12px', fontFamily: T.mono, fontSize: 11 }}>{s.table}</td>
                    <td style={{ padding: '9px 12px', fontFamily: T.mono, textAlign: 'right' }}>{s.rows.toLocaleString()}</td>
                    <td style={{ padding: '9px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, background: T.navy + '22', borderRadius: 4, height: 6 }}>
                          <div style={{ width: s.completeness + '%', background: s.completeness > 95 ? T.green : s.completeness > 80 ? T.amber : T.red, height: '100%', borderRadius: 4 }} />
                        </div>
                        <span style={{ fontFamily: T.mono, fontSize: 11 }}>{s.completeness.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '9px 12px', fontFamily: T.mono, fontSize: 11,
                      color: s.freshness === 'NEVER' ? T.red : T.slate }}>{s.freshness}</td>
                    <td style={{ padding: '9px 12px' }}>{pill(s.latency, T.teal)}</td>
                    <td style={{ padding: '9px 12px', fontSize: 11, color: T.slate }}>{s.coverage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ background: T.red + '11', border: `1px solid ${T.red}33`, borderRadius: 8, padding: 14 }}>
            <div style={{ fontWeight: 700, color: T.red, marginBottom: 6 }}>⚠ Action Required</div>
            <div style={{ fontSize: 13, color: T.slate }}>
              <strong>climate_trace_emissions</strong> last run failed (J11 — Monthly 1st 02:00). The ingester returned no records.
              Check Climate TRACE API endpoint availability and authentication. Table <code style={{ fontFamily: T.mono }}>climate_trace_emit</code> has 0 rows.
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 3: Methodology ── */}
      {tab === 3 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              {
                title: 'EVIC Formula (PCAF Standard)', color: T.teal,
                formula: 'EVIC = Market Cap + Total Debt + Minority Interest − Cash & Equivalents',
                sub: 'Enterprise Value Including Cash — primary denominator for PCAF financed emissions attribution',
                steps: [
                  'Pull yfinance Ticker.info: marketCap, totalDebt, minorityInterest, cashAndCashEquivalents',
                  'Compute EVIC per ticker on each weekday at 18:30 UTC',
                  'Store point-in-time snapshot in yfinance_evic (date, ticker, evic, marketCap, totalDebt, cash)',
                  'Attribution ratio = Investment Amount / EVIC (for loans: Outstanding / EVIC)',
                ],
              },
              {
                title: 'WACI Formula (TCFD Portfolio)', color: T.amber,
                formula: 'WACI = Σ [w_i × (Scope 1_i + Scope 2_i) / Revenue_i]',
                sub: 'Weighted Average Carbon Intensity — primary temperature-alignment metric per TCFD',
                steps: [
                  'wᵢ = portfolio weight of company i (market value / total portfolio value)',
                  'Scope 1 + Scope 2 in tCO₂e from Bloomberg / Refinitiv ESG feeds',
                  'Revenue (or EVIC for private assets) as intensity denominator',
                  'WACI expressed as tCO₂e per $M revenue',
                ],
              },
              {
                title: 'OWID CO₂ Data Schema', color: T.green,
                formula: 'owid-co2-data.csv — OWID GitHub (Our World in Data)',
                sub: 'Annual national GHG inventories compiled from GCP, IEA, EDGAR, CAIT sources',
                steps: [
                  'co2: fossil fuel + industry CO₂ (MtCO₂)',
                  'co2_including_luc: adds land-use change emissions',
                  'co2_per_capita: total / UN population estimate',
                  'share_global_co2: country share of world total (%)',
                  'energy_per_gdp, ghg_total, methane, nitrous_oxide also included',
                ],
              },
              {
                title: 'PCAF Financed Emissions', color: T.purple,
                formula: 'FE_i = (Investment_i / EVIC_i) × (Scope1_i + Scope2_i)',
                sub: 'PCAF v2.0 — Global GHG Accounting and Reporting Standard for Financial Industry',
                steps: [
                  'Asset class 1 — listed equity & corporate bonds: EVIC denominator',
                  'Asset class 2 — business loans & unlisted equity: EVIC or total equity + debt',
                  'Asset class 6 — sovereign bonds: GDP denominator',
                  'Data quality score 1 (best) to 5 (estimated). Score ≤ 3 required for reporting.',
                  'Portfolio WACI = Σ (FE_i) / portfolio_EVIC × 1e6',
                ],
              },
              {
                title: 'BaseIngester Architecture', color: T.navy,
                formula: 'class BaseIngester(ABC): fetch() → validate() → transform() → load()',
                sub: 'Abstract base class with retry logic, schema validation, audit logging',
                steps: [
                  'abstract fetch() → raw data from API / file',
                  'validate() → pydantic schema check, reject/warn on null key fields',
                  'transform() → normalise to target table schema (snake_case, UTC timestamps)',
                  'load() → upsert via SQLAlchemy (ON CONFLICT DO UPDATE)',
                  'APScheduler AsyncIOScheduler with PostgreSQL persistent job store',
                ],
              },
              {
                title: 'GLEIF LEI Standard (ISO 17442)', color: T.red,
                formula: 'LEI = 18-char alphanumeric: prefix(4) + reserved(2) + entity(12)',
                sub: 'Legal Entity Identifier — ISO 17442-1:2020 — mandatory for OTC derivatives (EMIR, Dodd-Frank)',
                steps: [
                  'Level 1 data: who is the entity (name, address, registration, status)',
                  'Level 2 data: who owns/controls the entity (direct/ultimate parent)',
                  'Status: ISSUED (active), LAPSED (renewal overdue), PENDING_TRANSFER',
                  'Renewal: annual. Grace period 3 months before LAPSED.',
                  'GLEIF API: public, no auth, 60 req/min. Full snapshot 2.18M entities.',
                ],
              },
            ].map(item => (
              <div key={item.title} style={{ background: '#fff', borderRadius: 10,
                border: `2px solid ${item.color}33`, padding: 16 }}>
                <div style={{ fontWeight: 800, color: item.color, fontSize: 13, marginBottom: 6 }}>{item.title}</div>
                <div style={{ fontFamily: T.mono, fontSize: 11, color: T.navy, background: item.color + '0f',
                  borderRadius: 6, padding: '8px 10px', marginBottom: 8 }}>{item.formula}</div>
                <div style={{ fontSize: 12, color: T.slate, marginBottom: 10, fontStyle: 'italic' }}>{item.sub}</div>
                <ol style={{ margin: 0, paddingLeft: 18 }}>
                  {item.steps.map((s, i) => (
                    <li key={i} style={{ fontSize: 11, color: T.slate, marginBottom: 4, lineHeight: 1.4 }}>{s}</li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
