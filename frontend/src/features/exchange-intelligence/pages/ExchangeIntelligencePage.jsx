import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, ScatterChart, Scatter, ZAxis,
} from 'recharts';
import {
  EXCHANGES, GLOBAL_COMPANY_MASTER, getCompaniesByExchange,
  getGDPCoverage, getGlobalStats, GLOBAL_SECTORS, EXCHANGE_COLORS,
} from '../../../data/globalCompanyMaster';

const T = {
  bg: '#f6f4f0', navy: '#1b3a5c', gold: '#c5a96a', sage: '#5a8a6a',
  card: '#ffffff', border: '#e2ddd5', text: '#2c2c2c', sub: '#6b7280',
  red: '#dc2626', amber: '#d97706', green: '#16a34a', blue: '#2563eb',
  teal: '#0d9488', indigo: '#4f46e5', purple: '#7c3aed',
  font: "'Inter','SF Pro Display',system-ui,-apple-system,sans-serif",
};

const SECTOR_COLORS = {
  'Information Technology': '#4f46e5', 'Financials': '#1b3a5c',
  'Health Care': '#be185d', 'Consumer Discretionary': '#d97706',
  'Consumer Staples': '#16a34a', 'Energy': '#dc2626', 'Materials': '#7c3aed',
  'Industrials': '#0d9488', 'Utilities': '#1d4ed8', 'Real Estate': '#0891b2',
  'Communication Services': '#ea580c', 'Mining': '#92400e',
};

const RISK_C = { 'Very High': '#dc2626', 'High': '#ea580c', 'Medium': '#d97706', 'Low': '#16a34a', 'Very Low': '#0d9488' };

const fmt = (n, unit = '') => n == null ? '—' : `${n.toLocaleString()}${unit}`;
const fmtB = (n) => n == null ? '—' : n >= 1000 ? `$${(n/1000).toFixed(1)}T` : `$${n.toFixed(0)}B`;
const fmtCO2 = n => n == null ? '—' : n >= 1e9 ? `${(n/1e9).toFixed(2)}Gt` : n >= 1e6 ? `${(n/1e6).toFixed(1)}Mt` : `${(n/1000).toFixed(0)}Kt`;

/* ── Sub-components ───────────────────────────────────────────────────────── */
const Chip = ({ label, color = T.navy }) => (
  <span style={{ fontSize: 10, fontWeight: 700, color, background: `${color}15`,
    border: `1px solid ${color}44`, borderRadius: 4, padding: '2px 7px', whiteSpace: 'nowrap' }}>
    {label}
  </span>
);

const KpiCard = ({ label, value, sub, color = T.navy, icon }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10,
    padding: '16px 18px', borderTop: `3px solid ${color}` }}>
    <div style={{ fontSize: 10, color: T.sub, fontWeight: 600, textTransform: 'uppercase', letterSpacing: .5 }}>
      {icon && <span style={{ marginRight: 5 }}>{icon}</span>}{label}
    </div>
    <div style={{ fontSize: 26, fontWeight: 800, color, margin: '6px 0 2px', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    <div style={{ fontSize: 11, color: T.sub }}>{sub}</div>
  </div>
);

/* ── GDP Coverage Badge Row ───────────────────────────────────────────────── */
function GDPCoverageRow({ exchangeId }) {
  const coverage = useMemo(() => getGDPCoverage(exchangeId), [exchangeId]);
  const entries = Object.entries(coverage).sort((a, b) => b[1].gdp_pct - a[1].gdp_pct);
  if (!entries.length) return <div style={{ fontSize: 11, color: T.sub, fontStyle: 'italic' }}>No GDP sector data</div>;
  const allCovered = entries.every(([, v]) => v.covered);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.navy }}>GDP Sector Coverage</div>
        <Chip
          label={allCovered ? '✅ All sectors covered' : `⚠ ${entries.filter(([,v])=>!v.covered).length} gap(s)`}
          color={allCovered ? T.green : T.amber}
        />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {entries.map(([sec, v]) => (
          <div key={sec} style={{ display: 'flex', alignItems: 'center', gap: 5,
            background: v.covered ? `${SECTOR_COLORS[sec] || T.navy}12` : '#fef2f2',
            border: `1px solid ${v.covered ? SECTOR_COLORS[sec] || T.navy : T.red}44`,
            borderRadius: 6, padding: '4px 8px', fontSize: 11 }}>
            <span style={{ color: v.covered ? T.green : T.red, fontWeight: 700 }}>{v.covered ? '●' : '○'}</span>
            <span style={{ fontWeight: 600, color: SECTOR_COLORS[sec] || T.navy }}>{sec.split(' ')[0]}</span>
            <span style={{ color: T.sub }}>{v.gdp_pct}% GDP</span>
            <span style={{ color: T.navy, fontWeight: 700 }}>{v.companies}co</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Sector Pie Chart ─────────────────────────────────────────────────────── */
function SectorPie({ companies }) {
  const data = useMemo(() => {
    const counts = {};
    for (const c of companies) counts[c.sector] = (counts[c.sector] || 0) + 1;
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));
  }, [companies]);

  if (!data.length) return <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.sub, fontSize: 12 }}>No data</div>;

  return (
    <ResponsiveContainer width="100%" height={160}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="45%" cy="50%" outerRadius={65} innerRadius={32}>
          {data.map(entry => (
            <Cell key={entry.name} fill={SECTOR_COLORS[entry.name] || T.sub} />
          ))}
        </Pie>
        <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ fontSize: 11 }} />
        <Legend iconSize={8} wrapperStyle={{ fontSize: 9 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

/* ── Market Cap Waterfall (top companies) ─────────────────────────────────── */
function MarketCapChart({ companies }) {
  const top = useMemo(() =>
    [...companies]
      .filter(c => c.market_cap_usd_mn > 0)
      .sort((a, b) => (b.market_cap_usd_mn || 0) - (a.market_cap_usd_mn || 0))
      .slice(0, 10)
      .map(c => ({ name: c.shortName || c.ticker, value: Math.round((c.market_cap_usd_mn || 0) / 1000), sector: c.sector }))
  , [companies]);

  if (!top.length) return <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.sub, fontSize: 12 }}>No market cap data loaded yet — enrich API keys to fetch live data</div>;

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={top} layout="vertical" margin={{ left: 60, right: 20, top: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
        <XAxis type="number" tickFormatter={v => `$${v}B`} tick={{ fontSize: 10, fill: T.sub }} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: T.navy }} width={58} />
        <Tooltip formatter={(v) => [`$${v}B`, 'Market Cap (USD)']} contentStyle={{ fontSize: 11 }} />
        <Bar dataKey="value" radius={[0, 3, 3, 0]}>
          {top.map(entry => <Cell key={entry.name} fill={SECTOR_COLORS[entry.sector] || T.navy} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ── Climate Risk Scatter ─────────────────────────────────────────────────── */
function ClimateRiskScatter({ companies }) {
  const RISK_RANK = { 'Very Low': 1, 'Low': 2, 'Medium': 3, 'High': 4, 'Very High': 5 };
  const data = useMemo(() =>
    companies
      .filter(c => c.scope1_co2e > 0 && c.market_cap_usd_mn > 0)
      .map(c => ({
        x: RISK_RANK[c.transition_risk] || 3,
        y: Math.round(c.scope1_co2e / 1000),   // Kt CO2e
        z: Math.min(50, Math.sqrt(c.market_cap_usd_mn / 5000) * 5),
        name: c.shortName, sector: c.sector,
      }))
      .slice(0, 40)
  , [companies]);

  if (!data.length) return <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.sub, fontSize: 12 }}>Load GHG data to show climate scatter</div>;

  return (
    <ResponsiveContainer width="100%" height={160}>
      <ScatterChart margin={{ left: 10, right: 10, top: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis type="number" dataKey="x" domain={[0.5, 5.5]} name="T-Risk"
          tickFormatter={v => (['','VLow','Low','Med','High','VHigh'][Math.round(v)] || '')}
          tick={{ fontSize: 9, fill: T.sub }} />
        <YAxis type="number" dataKey="y" name="Scope 1 (Kt)"
          tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}Mt` : `${v}Kt`}
          tick={{ fontSize: 9, fill: T.sub }} />
        <ZAxis type="number" dataKey="z" range={[20, 300]} />
        <Tooltip cursor={{ strokeDasharray: '3 3' }}
          content={({ payload }) => {
            if (!payload?.length) return null;
            const d = payload[0]?.payload;
            return (
              <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 6, padding: '8px 10px', fontSize: 11 }}>
                <div style={{ fontWeight: 700, color: T.navy }}>{d?.name}</div>
                <div style={{ color: T.sub }}>{d?.sector}</div>
                <div>Scope 1: {(d?.y * 1000).toLocaleString()} tCO₂e</div>
              </div>
            );
          }} />
        <Scatter data={data} fill={T.red} fillOpacity={0.6} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

/* ── Company Table ────────────────────────────────────────────────────────── */
function CompanyTable({ companies, title }) {
  const [search, setSearch] = useState('');
  const [sectorF, setSectorF] = useState('All');

  const sectors = useMemo(() => ['All', ...new Set(companies.map(c => c.sector))].sort(), [companies]);

  const filtered = useMemo(() => {
    let list = companies;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.name?.toLowerCase().includes(q) ||
        c.shortName?.toLowerCase().includes(q) ||
        c.ticker?.toLowerCase().includes(q)
      );
    }
    if (sectorF !== 'All') list = list.filter(c => c.sector === sectorF);
    return [...list].sort((a, b) => (b.market_cap_usd_mn || 0) - (a.market_cap_usd_mn || 0));
  }, [companies, search, sectorF]);

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, flex: 1 }}>{title} ({companies.length})</div>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search…"
          style={{ border: `1px solid ${T.border}`, borderRadius: 6, padding: '6px 10px',
            fontSize: 12, fontFamily: T.font, width: 160 }} />
        <select value={sectorF} onChange={e => setSectorF(e.target.value)}
          style={{ border: `1px solid ${T.border}`, borderRadius: 6, padding: '6px 8px', fontSize: 11, fontFamily: T.font }}>
          {sectors.map(s => <option key={s} value={s}>{s.split(' ')[0]}</option>)}
        </select>
      </div>

      {!companies.length ? (
        <div style={{ padding: '24px 0', textAlign: 'center', color: T.sub, fontSize: 12,
          background: '#fafaf9', borderRadius: 8, border: `1px dashed ${T.border}` }}>
          📊 Data loading — background agents are populating this exchange.<br />
          <span style={{ fontSize: 10 }}>Check back in a moment or refresh.</span>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ background: '#f1f0eb' }}>
                {['Company','Sector','Mkt Cap (USD)','Revenue (USD)','Scope 1 CO₂e','T-Risk','DQS','SBTi'].map(h => (
                  <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 700, color: T.sub, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 50).map((c, i) => (
                <tr key={c.id || c.ticker || i}
                  style={{ borderTop: `1px solid ${T.border}`, background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={{ padding: '7px 10px' }}>
                    <div style={{ fontWeight: 700, color: T.navy }}>{c.shortName || c.name}</div>
                    <div style={{ fontSize: 10, color: T.sub }}>{c.ticker} · {c.country}</div>
                  </td>
                  <td style={{ padding: '7px 10px' }}>
                    <Chip label={c.sector?.split(' ')[0]} color={SECTOR_COLORS[c.sector] || T.navy} />
                  </td>
                  <td style={{ padding: '7px 10px', fontWeight: 600, color: T.navy, fontVariantNumeric: 'tabular-nums' }}>
                    {c.market_cap_usd_mn ? fmtB(c.market_cap_usd_mn / 1000) : '—'}
                  </td>
                  <td style={{ padding: '7px 10px', color: T.text, fontVariantNumeric: 'tabular-nums' }}>
                    {c.revenue_usd_mn ? `$${(c.revenue_usd_mn/1000).toFixed(0)}B` : '—'}
                  </td>
                  <td style={{ padding: '7px 10px', color: c.scope1_co2e > 10e6 ? T.red : T.text,
                    fontWeight: c.scope1_co2e > 10e6 ? 700 : 400 }}>
                    {c.scope1_co2e ? fmtCO2(c.scope1_co2e) : '—'}
                  </td>
                  <td style={{ padding: '7px 10px' }}>
                    {c.transition_risk && (
                      <span style={{ fontSize: 10, fontWeight: 700,
                        color: RISK_C[c.transition_risk], background: `${RISK_C[c.transition_risk]}18`,
                        border: `1px solid ${RISK_C[c.transition_risk]}44`,
                        borderRadius: 4, padding: '2px 5px' }}>
                        {c.transition_risk}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '7px 10px' }}>
                    {c.dqs_default && (
                      <span style={{ background: [null,'#16a34a','#65a30d','#d97706','#ea580c','#dc2626'][c.dqs_default],
                        color: '#fff', borderRadius: 10, padding: '2px 7px', fontSize: 10, fontWeight: 700 }}>
                        {c.dqs_default}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '7px 10px' }}>
                    {c.sbti_committed
                      ? <span style={{ color: T.green, fontWeight: 700, fontSize: 12 }}>✅</span>
                      : <span style={{ color: T.sub, fontSize: 12 }}>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length > 50 && (
            <div style={{ padding: '8px 10px', fontSize: 11, color: T.sub, textAlign: 'center' }}>
              Showing 50 of {filtered.length} companies matching filter
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════════════════════════ */
export default function ExchangeIntelligencePage() {
  const [activeExchange, setActiveExchange] = useState(EXCHANGES[0].id);
  const [view, setView] = useState('overview'); // overview | companies | climate

  const ex = useMemo(() => EXCHANGES.find(e => e.id === activeExchange), [activeExchange]);
  const companies = ex?.companies || [];
  const globalStats = useMemo(() => getGlobalStats(), []);

  // Aggregate stats for active exchange
  const exStats = useMemo(() => {
    const total_mktcap = companies.reduce((s, c) => s + (c.market_cap_usd_mn || 0), 0);
    const total_scope1 = companies.reduce((s, c) => s + (c.scope1_co2e || 0), 0);
    const sbti_count   = companies.filter(c => c.sbti_committed).length;
    const high_risk    = companies.filter(c => ['High','Very High'].includes(c.transition_risk)).length;
    return { total_mktcap, total_scope1, sbti_count, high_risk };
  }, [companies]);

  // Sector breakdown bar data
  const sectorBarData = useMemo(() => {
    const counts = {};
    for (const c of companies) {
      if (!counts[c.sector]) counts[c.sector] = { name: c.sector, companies: 0, mktcap: 0 };
      counts[c.sector].companies++;
      counts[c.sector].mktcap += (c.market_cap_usd_mn || 0) / 1000;
    }
    return Object.values(counts).sort((a, b) => b.mktcap - a.mktcap);
  }, [companies]);

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: '24px 28px', color: T.text }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <span style={{ background: T.navy, color: T.gold, borderRadius: 8, padding: '6px 14px', fontSize: 13, fontWeight: 700 }}>E</span>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: T.navy, margin: 0 }}>Global Exchange Intelligence</h1>
          <span style={{ background: '#eff6ff', color: T.blue, border: `1px solid ${T.blue}44`,
            borderRadius: 20, padding: '2px 12px', fontSize: 11, fontWeight: 700 }}>
            Sprint E · {globalStats.total_companies} Companies · {globalStats.exchanges} Exchanges
          </span>
        </div>
        <p style={{ fontSize: 13, color: T.sub, margin: 0 }}>
          Global market reference covering every major exchange and every sector &gt;5% GDP.
          Normalised USD equivalents · PCAF-ready · GICS sector classification · FY2023/FY2024 data.
        </p>
      </div>

      {/* ── Regulatory Context Bar ── */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderLeft: `4px solid ${T.navy}`,
        borderRadius: 8, padding: '10px 16px', marginBottom: 16, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        {[['GICS L3 Classification', T.navy], ['PCAF Asset Attribution', T.teal],
          ['TCFD / ISSB S2', T.blue], ['BRSR Core P6 (India)', T.sage],
          ['EU CSRD / ESRS', T.purple], ['SEC Climate Rule (US)', T.indigo],
          ['FCA TCFD (UK)', T.amber], ['ASX Mandatory 2025', T.green]
        ].map(([l, c]) => (
          <span key={l} style={{ fontSize: 10, fontWeight: 700, color: c, background: `${c}15`,
            border: `1px solid ${c}44`, borderRadius: 4, padding: '2px 7px' }}>{l}</span>
        ))}
        <div style={{ marginLeft: 'auto', fontSize: 11, color: T.sub }}>
          Feeds: <strong style={{ color: T.navy }}>PCAF Calculator · Sector Benchmarking · Portfolio VaR</strong>
        </div>
      </div>

      {/* ── Global KPI Strip ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Companies', value: globalStats.total_companies, sub: 'Across all exchanges', color: T.navy, icon: '🏢' },
          { label: 'Exchanges', value: globalStats.exchanges, sub: '9 major markets', color: T.blue, icon: '🌐' },
          { label: 'Market Cap', value: `$${(globalStats.total_market_cap_usd_bn/1000).toFixed(0)}T`, sub: 'USD equivalent', color: T.teal, icon: '💹' },
          { label: 'SBTi Committed', value: globalStats.sbti_committed, sub: 'Science-based targets', color: T.green, icon: '🎯' },
          { label: 'Total Scope 1', value: `${globalStats.total_scope1_mt_co2e}Mt`, sub: 'tCO₂e in registry', color: T.red, icon: '🌡' },
        ].map(kpi => <KpiCard key={kpi.label} {...kpi} />)}
      </div>

      {/* ── Exchange Tabs ── */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, overflowX: 'auto',
        background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 6 }}>
        {EXCHANGES.map(e => {
          const isActive = e.id === activeExchange;
          const co = e.companies.length;
          return (
            <button key={e.id} onClick={() => setActiveExchange(e.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                borderRadius: 7, border: 'none', cursor: 'pointer', fontFamily: T.font,
                background: isActive ? e.color : 'transparent',
                color: isActive ? '#fff' : T.sub,
                fontWeight: isActive ? 700 : 500, fontSize: 12, whiteSpace: 'nowrap',
                transition: 'all .15s',
              }}>
              <span style={{ fontSize: 16 }}>{e.flag}</span>
              <span>{e.index || e.label.split('—')[1]?.trim()}</span>
              {co > 0 && (
                <span style={{ background: isActive ? 'rgba(255,255,255,.25)' : `${e.color}22`,
                  color: isActive ? '#fff' : e.color, borderRadius: 10, padding: '1px 7px',
                  fontSize: 10, fontWeight: 700 }}>{co}</span>
              )}
              {co === 0 && (
                <span style={{ fontSize: 9, opacity: .6 }}>loading…</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Exchange Header Card ── */}
      {ex && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`,
          borderTop: `4px solid ${ex.color}`, borderRadius: 10,
          padding: '18px 22px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 28 }}>{ex.flag}</span>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: T.navy }}>{ex.label}</div>
                  <div style={{ fontSize: 12, color: T.sub, marginTop: 2 }}>{ex.description}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                <Chip label={`${ex.currency} denominated`} color={ex.color} />
                <Chip label={`GDP Rank #${ex.gdp_rank || '—'}`} color={T.navy} />
                <Chip label={`GDP $${(ex.gdp_usd_bn/1000).toFixed(1)}T`} color={T.teal} />
                <Chip label={`${companies.length} companies`} color={ex.color} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, minWidth: 300 }}>
              {[
                { l: 'Total Mkt Cap', v: fmtB(exStats.total_mktcap / 1000) },
                { l: 'Agg. Scope 1', v: fmtCO2(exStats.total_scope1) },
                { l: 'SBTi Committed', v: `${exStats.sbti_count} / ${companies.length}` },
                { l: 'High T-Risk', v: `${exStats.high_risk} co.` },
              ].map(({ l, v }) => (
                <div key={l} style={{ background: '#f8f7f3', borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ fontSize: 10, color: T.sub, fontWeight: 600 }}>{l}</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: T.navy, marginTop: 2 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* GDP Coverage */}
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${T.border}` }}>
            <GDPCoverageRow exchangeId={ex.id} />
          </div>
        </div>
      )}

      {/* ── View Toggle ── */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 16, background: T.card,
        border: `1px solid ${T.border}`, borderRadius: 8, padding: 4, width: 'fit-content' }}>
        {[['overview','📊 Overview'], ['companies','🏢 Companies'], ['climate','🌡 Climate']].map(([v, l]) => (
          <button key={v} onClick={() => setView(v)}
            style={{ padding: '7px 18px', borderRadius: 6, border: 'none', cursor: 'pointer',
              fontFamily: T.font, fontSize: 12, fontWeight: view === v ? 700 : 500,
              background: view === v ? T.navy : 'transparent',
              color: view === v ? '#fff' : T.sub }}>
            {l}
          </button>
        ))}
      </div>

      {/* ── Overview View ── */}
      {view === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Sector Pie */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '18px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Sector Composition</div>
            <SectorPie companies={companies} />
          </div>

          {/* Market Cap Chart */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '18px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Top 10 by Market Cap (USD)</div>
            <MarketCapChart companies={companies} />
          </div>

          {/* Sector Bar */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '18px 20px', gridColumn: '1 / -1' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Sector Market Cap Breakdown (USD Bn)</div>
            {sectorBarData.length ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={sectorBarData} margin={{ left: 0, right: 20, top: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" tickFormatter={n => n.split(' ')[0]} tick={{ fontSize: 10, fill: T.sub }} />
                  <YAxis tickFormatter={v => `$${v.toFixed(0)}B`} tick={{ fontSize: 10, fill: T.sub }} />
                  <Tooltip formatter={v => [`$${v.toFixed(0)}B`, 'Mkt Cap (USD)']} contentStyle={{ fontSize: 11 }} />
                  <Bar dataKey="mktcap" radius={[3, 3, 0, 0]}>
                    {sectorBarData.map(entry => <Cell key={entry.name} fill={SECTOR_COLORS[entry.name] || T.navy} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.sub, fontSize: 12 }}>
                No data — exchange data being loaded by background pipeline
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Companies View ── */}
      {view === 'companies' && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '18px 20px' }}>
          <CompanyTable companies={companies} title={`${ex?.flag || ''} ${ex?.label || 'Exchange'} — All Companies`} />
        </div>
      )}

      {/* ── Climate View ── */}
      {view === 'climate' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '18px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Scope 1 vs Transition Risk</div>
            <ClimateRiskScatter companies={companies} />
            <div style={{ fontSize: 10, color: T.sub, marginTop: 6 }}>
              Bubble size = market cap. X-axis = transition risk level. Y-axis = Scope 1 tCO₂e (log).
            </div>
          </div>

          {/* SBTi Status */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '18px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Net Zero & SBTi Status</div>
            {[
              { label: 'SBTi Committed', count: companies.filter(c => c.sbti_committed).length, color: T.green },
              { label: 'Net Zero Target Set', count: companies.filter(c => c.carbon_neutral_target_year).length, color: T.teal },
              { label: 'High Transition Risk', count: companies.filter(c => ['High','Very High'].includes(c.transition_risk)).length, color: T.red },
              { label: 'High Physical Risk', count: companies.filter(c => ['High','Very High'].includes(c.physical_risk)).length, color: '#ea580c' },
              { label: 'DQS 1 (Verified GHG)', count: companies.filter(c => c.dqs_default === 1).length, color: T.green },
              { label: 'DQS 2 (Audited)', count: companies.filter(c => c.dqs_default === 2).length, color: '#65a30d' },
              { label: 'DQS 3+ (Reported/Proxy)', count: companies.filter(c => (c.dqs_default || 0) >= 3).length, color: T.amber },
            ].map(({ label, count, color }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
                <span style={{ fontSize: 12, color: T.text }}>{label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: Math.max(4, companies.length ? (count / companies.length) * 80 : 0),
                    height: 6, background: color, borderRadius: 3 }} />
                  <span style={{ fontWeight: 700, color, fontSize: 13, minWidth: 28, textAlign: 'right' }}>{count}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Top emitters table */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '18px 20px', gridColumn: '1 / -1' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Top 15 Scope 1 Emitters</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: '#f1f0eb' }}>
                    {['#','Company','Sector','Scope 1 (tCO₂e)','Scope 2','Scope 3','GHG Source','T-Risk','SBTi'].map(h => (
                      <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 700, color: T.sub }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...companies]
                    .filter(c => c.scope1_co2e > 0)
                    .sort((a, b) => b.scope1_co2e - a.scope1_co2e)
                    .slice(0, 15)
                    .map((c, i) => (
                      <tr key={c.ticker || i} style={{ borderTop: `1px solid ${T.border}`, background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                        <td style={{ padding: '7px 10px', color: T.sub, fontWeight: 700 }}>#{i+1}</td>
                        <td style={{ padding: '7px 10px' }}>
                          <div style={{ fontWeight: 700, color: T.navy }}>{c.shortName || c.ticker}</div>
                          <div style={{ fontSize: 9, color: T.sub }}>{c.ticker}</div>
                        </td>
                        <td style={{ padding: '7px 10px' }}><Chip label={c.sector?.split(' ')[0]} color={SECTOR_COLORS[c.sector] || T.navy} /></td>
                        <td style={{ padding: '7px 10px', fontWeight: 700, color: c.scope1_co2e > 50e6 ? T.red : T.text }}>{fmtCO2(c.scope1_co2e)}</td>
                        <td style={{ padding: '7px 10px', color: T.sub }}>{fmtCO2(c.scope2_co2e)}</td>
                        <td style={{ padding: '7px 10px', color: T.sub }}>{c.scope3_co2e > 0 ? fmtCO2(c.scope3_co2e) : '—'}</td>
                        <td style={{ padding: '7px 10px', fontSize: 10, color: T.sub }}>{c.ghg_source?.split('/')[0]}</td>
                        <td style={{ padding: '7px 10px' }}>
                          {c.transition_risk && <span style={{ fontSize: 10, fontWeight: 700,
                            color: RISK_C[c.transition_risk], background: `${RISK_C[c.transition_risk]}18`,
                            borderRadius: 4, padding: '2px 5px', border: `1px solid ${RISK_C[c.transition_risk]}44` }}>
                            {c.transition_risk}
                          </span>}
                        </td>
                        <td style={{ padding: '7px 10px' }}>
                          {c.sbti_committed ? <span style={{ color: T.green, fontSize: 12 }}>✅</span> : <span style={{ color: T.sub }}>—</span>}
                        </td>
                      </tr>
                    ))}
                  {!companies.filter(c => c.scope1_co2e > 0).length && (
                    <tr><td colSpan={9} style={{ padding: 24, textAlign: 'center', color: T.sub, fontSize: 12 }}>
                      No GHG data for this exchange yet — data loading via background pipeline
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
