/**
 * BigClimateDatabasePage — CONCITO Big Climate Database Explorer
 *
 * 10-tab explorer for 2,700 food-product lifecycle emission factors.
 * Source: CONCITO / 2-0 LCA, CC-BY, v1.2 (2024).
 * Units: tCO2e per tonne product. Countries: DK/GB/FR/ES/NL.
 */
import React, { useState, useMemo } from 'react';
import { useBigClimateDb } from '../../../contexts/BigClimateDbContext';
import {
  BarChart, LineChart, AreaChart, ComposedChart, ScatterChart, PieChart, RadarChart,
  Cell, ReferenceLine, Tooltip, Legend, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  Area, Bar, Line, Scatter, Pie, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

/* ── deterministic PRNG ─────────────────────────────────────────── */
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

/* ── theme ───────────────────────────────────────────────────────── */
const T = {
  surface: '#fafaf7', border: '#e2e0d8', navy: '#1b2a4a', gold: '#b8962e',
  text: '#1a1a2e', sub: '#64748b', card: '#ffffff', indigo: '#4f46e5',
  green: '#065f46', red: '#991b1b', amber: '#92400e',
};
const PHASE_COLORS = { Agriculture: '#16a34a', iLUC: '#ca8a04', Processing: '#0284c7', Packaging: '#9333ea', Transport: '#dc2626', Retail: '#f97316' };
const PHASES = ['agriculture', 'iluc', 'processing', 'packaging', 'transport', 'retail'];
const PHASE_LABELS = ['Agriculture', 'iLUC', 'Processing', 'Packaging', 'Transport', 'Retail'];
const CAT_COLORS = ['#1b2a4a', '#b8962e', '#4f46e5', '#065f46', '#991b1b', '#0284c7', '#9333ea', '#dc2626', '#f97316', '#16a34a', '#ca8a04', '#64748b', '#7c3aed', '#059669', '#b45309', '#6366f1'];
const COUNTRY_COLORS = { DK: '#c8102e', GB: '#003078', FR: '#0055a4', ES: '#f1bf00', NL: '#ff6600' };

/* ── shared UI primitives ────────────────────────────────────────── */
const TabBar = ({ tabs, active, onChange }) => (
  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 16, borderBottom: `2px solid ${T.border}`, paddingBottom: 8 }}>
    {tabs.map(t => (
      <button key={t} onClick={() => onChange(t)} style={{
        padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: active === t ? 700 : 500,
        background: active === t ? T.navy : 'transparent', color: active === t ? '#fff' : T.sub, transition: 'all .15s',
      }}>{t}</button>
    ))}
  </div>
);
const Card = ({ title, children, style }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, ...style }}>
    {title && <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8, fontFamily: "'DM Sans',sans-serif" }}>{title}</div>}
    {children}
  </div>
);
const KPI = ({ label, value, sub }) => (
  <Card style={{ textAlign: 'center', minWidth: 140 }}>
    <div style={{ fontSize: 22, fontWeight: 700, color: T.navy, fontFamily: "'JetBrains Mono',monospace" }}>{value}</div>
    <div style={{ fontSize: 12, color: T.sub, marginTop: 2 }}>{label}</div>
    {sub && <div style={{ fontSize: 11, color: T.gold, marginTop: 2 }}>{sub}</div>}
  </Card>
);
const Select = ({ value, onChange, options, placeholder, style }) => (
  <select value={value} onChange={e => onChange(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 13, background: T.card, color: T.text, ...style }}>
    {placeholder && <option value="">{placeholder}</option>}
    {options.map(o => <option key={typeof o === 'string' ? o : o.value} value={typeof o === 'string' ? o : o.value}>{typeof o === 'string' ? o : o.label}</option>)}
  </select>
);

const TABS = [
  'Food Carbon Dashboard', 'Product Explorer', 'Country Comparison', 'Category Deep-Dive',
  'Lifecycle Phase Analysis', 'Hotspot Identification', 'Protein Comparison',
  'Plant-Based Swap Calculator', 'Data Quality & Methodology', 'Benchmarking & Targets',
];

/* ════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════════════════════ */
export default function BigClimateDatabasePage() {
  const db = useBigClimateDb();
  const [tab, setTab] = useState(TABS[0]);

  /* ── Tab 2 state ─── */
  const [searchQ, setSearchQ] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [sortCol, setSortCol] = useState('total');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(0);
  const [expandedRow, setExpandedRow] = useState(null);

  /* ── Tab 3 state ─── */
  const [compProduct, setCompProduct] = useState('');

  /* ── Tab 4 state ─── */
  const [deepCat, setDeepCat] = useState(db.categories[0] || '');

  /* ── Tab 5 state ─── */
  const [selPhase, setSelPhase] = useState('agriculture');

  /* ── Tab 7 state ─── */
  const [proteinCountry, setProteinCountry] = useState('DK');

  /* ── Tab 8 state ─── */
  const [swapFrom, setSwapFrom] = useState('');
  const [swapTo, setSwapTo] = useState('');
  const [swapKgWeek, setSwapKgWeek] = useState(1);

  /* ── Tab 10 state ─── */
  const [benchCat, setBenchCat] = useState(db.categories[0] || '');
  const [reductionPct, setReductionPct] = useState(30);

  /* ── unique product names for dropdowns ─── */
  const uniqueNames = useMemo(() => [...new Set(db.products.map(p => p.name))].sort(), [db.products]);

  /* ══════════════════════════════════════════════════════════════════
     TAB 1 — Food Carbon Dashboard
     ══════════════════════════════════════════════════════════════════ */
  const renderDashboard = () => {
    const all = db.products;
    const avgTotal = all.length > 0 ? (all.reduce((s, p) => s + p.total, 0) / all.length) : 0;
    const highest = all.length > 0 ? [...all].sort((a, b) => b.total - a.total)[0] : null;
    const lowest = all.length > 0 ? [...all].sort((a, b) => a.total - b.total)[0] : null;

    /* avg total by category */
    const catAvg = db.categories.map(cat => {
      const items = db.getProductsByCategory(cat);
      return { name: cat.length > 25 ? cat.slice(0, 22) + '...' : cat, fullName: cat, avg: items.length > 0 ? items.reduce((s, p) => s + p.total, 0) / items.length : 0 };
    });
    const catAvgSorted = [...catAvg].sort((a, b) => b.avg - a.avg);

    /* lifecycle phase pie */
    const phaseSum = { Agriculture: 0, iLUC: 0, Processing: 0, Packaging: 0, Transport: 0, Retail: 0 };
    all.forEach(p => { phaseSum.Agriculture += p.agriculture; phaseSum.iLUC += p.iluc; phaseSum.Processing += p.processing; phaseSum.Packaging += p.packaging; phaseSum.Transport += p.transport; phaseSum.Retail += p.retail; });
    const pieData = Object.entries(phaseSum).map(([name, value]) => ({ name, value: +value.toFixed(2) }));

    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
          <KPI label="Total Products" value={db.stats.totalProducts.toLocaleString()} />
          <KPI label="Countries" value={db.stats.countries} />
          <KPI label="Categories" value={db.stats.categories} />
          <KPI label="Avg Total EF" value={avgTotal.toFixed(3)} sub="tCO2e/t" />
          <KPI label="Highest EF" value={highest ? highest.total.toFixed(2) : '-'} sub={highest ? highest.name.slice(0, 30) : ''} />
          <KPI label="Lowest EF" value={lowest ? lowest.total.toFixed(2) : '-'} sub={lowest ? lowest.name.slice(0, 30) : ''} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <Card title="Average Total EF by Category (tCO2e/t)">
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={catAvgSorted} layout="vertical" margin={{ left: 120, right: 20, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={115} />
                <Tooltip formatter={v => v.toFixed(3)} />
                <Bar dataKey="avg" fill={T.navy} radius={[0, 4, 4, 0]}>
                  {catAvgSorted.map((_, i) => <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card title="Lifecycle Phase Contribution (All Products)">
            <ResponsiveContainer width="100%" height={360}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={130} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`} labelLine={{ strokeWidth: 1 }}>
                  {pieData.map((entry) => <Cell key={entry.name} fill={PHASE_COLORS[entry.name]} />)}
                </Pie>
                <Tooltip formatter={v => v.toLocaleString()} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <Card title="Attribution" style={{ maxWidth: 500 }}>
          <div style={{ fontSize: 13, color: T.text }}>
            <strong>Database:</strong> The Big Climate Database {db.version}<br />
            <strong>Publisher:</strong> {db.attribution}<br />
            <strong>Units:</strong> tCO2e per tonne of product<br />
            <strong>Coverage:</strong> {db.stats.uniqueProducts} unique food products across {db.stats.countries} European countries
          </div>
        </Card>
      </div>
    );
  };

  /* ══════════════════════════════════════════════════════════════════
     TAB 2 — Product Explorer
     ══════════════════════════════════════════════════════════════════ */
  const renderProductExplorer = () => {
    let filtered = db.products;
    if (searchQ) { const q = searchQ.toLowerCase(); filtered = filtered.filter(p => p.name.toLowerCase().includes(q)); }
    if (filterCat) filtered = filtered.filter(p => p.category === filterCat);
    if (filterCountry) filtered = filtered.filter(p => p.country === filterCountry);

    const sorted = [...filtered].sort((a, b) => {
      const av = a[sortCol], bv = b[sortCol];
      if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === 'asc' ? av - bv : bv - av;
    });
    const PER_PAGE = 20;
    const totalPages = Math.max(1, Math.ceil(sorted.length / PER_PAGE));
    const safePage = Math.min(page, totalPages - 1);
    const pageItems = sorted.slice(safePage * PER_PAGE, (safePage + 1) * PER_PAGE);

    const handleSort = col => { if (sortCol === col) { setSortDir(d => d === 'asc' ? 'desc' : 'asc'); } else { setSortCol(col); setSortDir('desc'); } };
    const SortIcon = ({ col }) => sortCol === col ? (sortDir === 'asc' ? ' \u25B2' : ' \u25BC') : '';

    return (
      <div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
          <input value={searchQ} onChange={e => { setSearchQ(e.target.value); setPage(0); }} placeholder="Search products..." style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 13, width: 220 }} />
          <Select value={filterCat} onChange={v => { setFilterCat(v); setPage(0); }} options={db.categories} placeholder="All Categories" />
          <Select value={filterCountry} onChange={v => { setFilterCountry(v); setPage(0); }} options={db.countries.map(c => ({ value: c.code, label: c.label }))} placeholder="All Countries" />
          <span style={{ fontSize: 12, color: T.sub, alignSelf: 'center' }}>{sorted.length} results</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.navy, color: '#fff' }}>
                {[['name', 'Product'], ['country', 'Country'], ['category', 'Category'], ['total', 'Total'], ['agriculture', 'Agri'], ['transport', 'Transport'], ['packaging', 'Packaging']].map(([key, label]) => (
                  <th key={key} onClick={() => handleSort(key)} style={{ padding: '8px 10px', cursor: 'pointer', textAlign: 'left', whiteSpace: 'nowrap' }}>
                    {label}<SortIcon col={key} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageItems.map(p => (
                <React.Fragment key={p.id}>
                  <tr onClick={() => setExpandedRow(expandedRow === p.id ? null : p.id)} style={{ cursor: 'pointer', background: expandedRow === p.id ? '#f0f0ea' : 'transparent', borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '6px 10px', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</td>
                    <td style={{ padding: '6px 10px' }}>{p.country}</td>
                    <td style={{ padding: '6px 10px', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.category}</td>
                    <td style={{ padding: '6px 10px', fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>{p.total.toFixed(3)}</td>
                    <td style={{ padding: '6px 10px', fontFamily: "'JetBrains Mono',monospace" }}>{p.agriculture.toFixed(3)}</td>
                    <td style={{ padding: '6px 10px', fontFamily: "'JetBrains Mono',monospace" }}>{p.transport.toFixed(3)}</td>
                    <td style={{ padding: '6px 10px', fontFamily: "'JetBrains Mono',monospace" }}>{p.packaging.toFixed(3)}</td>
                  </tr>
                  {expandedRow === p.id && (
                    <tr><td colSpan={7} style={{ padding: 16, background: '#f8f8f4' }}>
                      <div style={{ maxWidth: 500 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: T.navy }}>{p.name} ({p.country}) - Lifecycle Breakdown</div>
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={db.getBreakdown(p.id)} margin={{ left: 10, right: 10, top: 5, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="phase" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip formatter={v => v.toFixed(4)} />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                              {db.getBreakdown(p.id).map((entry) => <Cell key={entry.phase} fill={PHASE_COLORS[entry.phase]} />)}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </td></tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center', justifyContent: 'center' }}>
          <button onClick={() => setPage(Math.max(0, safePage - 1))} disabled={safePage === 0} style={{ padding: '4px 12px', borderRadius: 4, border: `1px solid ${T.border}`, background: T.card, cursor: 'pointer', fontSize: 12 }}>Prev</button>
          <span style={{ fontSize: 12, color: T.sub }}>Page {safePage + 1} of {totalPages}</span>
          <button onClick={() => setPage(Math.min(totalPages - 1, safePage + 1))} disabled={safePage >= totalPages - 1} style={{ padding: '4px 12px', borderRadius: 4, border: `1px solid ${T.border}`, background: T.card, cursor: 'pointer', fontSize: 12 }}>Next</button>
        </div>
      </div>
    );
  };

  /* ══════════════════════════════════════════════════════════════════
     TAB 3 — Country Comparison
     ══════════════════════════════════════════════════════════════════ */
  const renderCountryComparison = () => {
    const comparison = compProduct ? db.getProductComparison(compProduct) : [];
    const grouped = comparison.length > 0 ? comparison.map(p => ({
      country: p.country,
      total: p.total, agriculture: p.agriculture, iluc: p.iluc, processing: p.processing,
      packaging: p.packaging, transport: p.transport, retail: p.retail,
    })) : [];

    return (
      <div>
        <div style={{ marginBottom: 14 }}>
          <Select value={compProduct} onChange={setCompProduct} options={uniqueNames.map(n => ({ value: n, label: n }))} placeholder="Select a product to compare..." style={{ width: 400 }} />
        </div>

        {grouped.length > 0 && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <Card title="Total EF by Country (tCO2e/t)">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={grouped} margin={{ left: 10, right: 10, top: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="country" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={v => v.toFixed(4)} />
                    <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                      {grouped.map(g => <Cell key={g.country} fill={COUNTRY_COLORS[g.country] || T.navy} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              <Card title="Lifecycle Phase Breakdown by Country">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={grouped} margin={{ left: 10, right: 10, top: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="country" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={v => v.toFixed(4)} />
                    <Legend />
                    {PHASES.map((ph, i) => <Bar key={ph} dataKey={ph} stackId="a" fill={PHASE_COLORS[PHASE_LABELS[i]]} />)}
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>

            <Card title="Detailed Emission Factors">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.navy, color: '#fff' }}>
                    <th style={{ padding: '6px 10px', textAlign: 'left' }}>Country</th>
                    {PHASE_LABELS.map(l => <th key={l} style={{ padding: '6px 10px', textAlign: 'right' }}>{l}</th>)}
                    <th style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 800 }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {grouped.map(g => (
                    <tr key={g.country} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '6px 10px', fontWeight: 600 }}>{g.country}</td>
                      {PHASES.map(ph => <td key={ph} style={{ padding: '6px 10px', textAlign: 'right', fontFamily: "'JetBrains Mono',monospace" }}>{g[ph].toFixed(4)}</td>)}
                      <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>{g.total.toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 16 }}>
              <Card title="Transport Variance">
                <div style={{ fontSize: 12, color: T.sub }}>Differences in transport EF reflect distance from production origin, cold chain requirements, and modal mix (road vs. sea vs. air).</div>
              </Card>
              <Card title="Agricultural Variance">
                <div style={{ fontSize: 12, color: T.sub }}>Farm-level EF varies by yield, fertilizer intensity, energy grid carbon intensity, and climate zone affecting irrigation needs.</div>
              </Card>
              <Card title="Energy Grid Effect">
                <div style={{ fontSize: 12, color: T.sub }}>Processing and retail EFs differ due to national electricity grid carbon intensity (FR nuclear vs NL gas vs DK wind).</div>
              </Card>
            </div>
          </>
        )}
        {!compProduct && <div style={{ textAlign: 'center', padding: 40, color: T.sub, fontSize: 14 }}>Select a product above to compare across all 5 countries.</div>}
      </div>
    );
  };

  /* ══════════════════════════════════════════════════════════════════
     TAB 4 — Category Deep-Dive
     ══════════════════════════════════════════════════════════════════ */
  const renderCategoryDeepDive = () => {
    const items = db.getProductsByCategory(deepCat);

    /* avg total by country */
    const countryAvg = db.countries.map(c => {
      const sub = items.filter(p => p.country === c.code);
      return { country: c.code, avg: sub.length > 0 ? sub.reduce((s, p) => s + p.total, 0) / sub.length : 0 };
    });

    /* top/bottom 10 */
    const sorted = [...items].sort((a, b) => b.total - a.total);
    const top10 = sorted.slice(0, 10).map(p => ({ name: (p.name.length > 30 ? p.name.slice(0, 27) + '...' : p.name) + ` (${p.country})`, total: p.total }));
    const bottom10 = [...items].sort((a, b) => a.total - b.total).slice(0, 10).map(p => ({ name: (p.name.length > 30 ? p.name.slice(0, 27) + '...' : p.name) + ` (${p.country})`, total: p.total }));

    /* radar: category average by phase */
    const n = items.length || 1;
    const radarData = PHASE_LABELS.map((label, i) => ({
      phase: label,
      value: items.reduce((s, p) => s + (p[PHASES[i]] || 0), 0) / n,
    }));

    /* distribution histogram */
    const totals = items.map(p => p.total);
    const maxT = totals.length > 0 ? Math.max(...totals) : 1;
    const bucketCount = 12;
    const bucketSize = maxT > 0 ? maxT / bucketCount : 1;
    const buckets = Array.from({ length: bucketCount }, (_, i) => ({ range: `${(i * bucketSize).toFixed(1)}-${((i + 1) * bucketSize).toFixed(1)}`, count: 0 }));
    totals.forEach(t => { const bi = Math.min(bucketCount - 1, Math.floor(t / bucketSize)); buckets[bi].count++; });

    return (
      <div>
        <div style={{ marginBottom: 14 }}>
          <Select value={deepCat} onChange={setDeepCat} options={db.categories} placeholder="Select category" style={{ width: 350 }} />
          <span style={{ fontSize: 12, color: T.sub, marginLeft: 12 }}>{items.length} products in category</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <Card title="Average Total EF by Country">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={countryAvg}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="country" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={v => v.toFixed(3)} />
                <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
                  {countryAvg.map(c => <Cell key={c.country} fill={COUNTRY_COLORS[c.country] || T.navy} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card title="Lifecycle Phase Radar (Category Average)">
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="phase" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis tick={{ fontSize: 9 }} />
                <Radar dataKey="value" stroke={T.indigo} fill={T.indigo} fillOpacity={0.3} />
                <Tooltip formatter={v => v.toFixed(4)} />
              </RadarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <Card title="Top 10 Highest Emitting Products">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={top10} layout="vertical" margin={{ left: 140, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={135} />
                <Tooltip formatter={v => v.toFixed(3)} />
                <Bar dataKey="total" fill={T.red} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card title="Top 10 Lowest Emitting Products">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={bottom10} layout="vertical" margin={{ left: 140, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={135} />
                <Tooltip formatter={v => v.toFixed(3)} />
                <Bar dataKey="total" fill={T.green} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <Card title="Distribution of Total EF Values">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={buckets}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill={T.indigo} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    );
  };

  /* ══════════════════════════════════════════════════════════════════
     TAB 5 — Lifecycle Phase Analysis
     ══════════════════════════════════════════════════════════════════ */
  const renderPhaseAnalysis = () => {
    const phIdx = PHASES.indexOf(selPhase);
    const phLabel = PHASE_LABELS[phIdx] || selPhase;
    const all = db.products;

    /* top 20 products for phase */
    const top20 = [...all].sort((a, b) => (b[selPhase] || 0) - (a[selPhase] || 0)).slice(0, 20).map(p => ({
      name: (p.name.length > 25 ? p.name.slice(0, 22) + '...' : p.name) + ` (${p.country})`, value: p[selPhase] || 0,
    }));

    /* phase as % of total scatter */
    const scatterData = all.filter(p => p.total > 0).map((p, i) => ({
      x: p.total, y: p.total > 0 ? ((p[selPhase] || 0) / p.total) * 100 : 0, name: p.name, country: p.country,
    }));

    /* category avg for phase */
    const catPhaseAvg = db.categories.map(cat => {
      const items = db.getProductsByCategory(cat);
      const avg = items.length > 0 ? items.reduce((s, p) => s + (p[selPhase] || 0), 0) / items.length : 0;
      return { name: cat.length > 20 ? cat.slice(0, 17) + '...' : cat, avg };
    });
    const catPhaseSorted = [...catPhaseAvg].sort((a, b) => b.avg - a.avg);

    /* country avg for phase */
    const countryPhaseAvg = db.countries.map(c => {
      const items = db.getProductsByCountry(c.code);
      return { country: c.code, avg: items.length > 0 ? items.reduce((s, p) => s + (p[selPhase] || 0), 0) / items.length : 0 };
    });

    return (
      <div>
        <div style={{ marginBottom: 14 }}>
          <span style={{ fontSize: 13, fontWeight: 600, marginRight: 10 }}>Phase:</span>
          {PHASES.map((ph, i) => (
            <button key={ph} onClick={() => setSelPhase(ph)} style={{
              padding: '5px 12px', borderRadius: 5, border: 'none', cursor: 'pointer', marginRight: 6, fontSize: 12,
              background: selPhase === ph ? PHASE_COLORS[PHASE_LABELS[i]] : '#e8e8e0', color: selPhase === ph ? '#fff' : T.text, fontWeight: selPhase === ph ? 700 : 400,
            }}>{PHASE_LABELS[i]}</button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <Card title={`Top 20 Products by ${phLabel} EF`}>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={top20} layout="vertical" margin={{ left: 130, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={125} />
                <Tooltip formatter={v => v.toFixed(4)} />
                <Bar dataKey="value" fill={PHASE_COLORS[phLabel] || T.navy} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card title={`${phLabel} as % of Total EF`}>
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="x" name="Total EF" tick={{ fontSize: 10 }} label={{ value: 'Total EF (tCO2e/t)', position: 'insideBottom', offset: -5, fontSize: 10 }} />
                <YAxis dataKey="y" name={`${phLabel} %`} tick={{ fontSize: 10 }} label={{ value: `${phLabel} % of Total`, angle: -90, position: 'insideLeft', fontSize: 10 }} />
                <Tooltip formatter={v => typeof v === 'number' ? v.toFixed(2) : v} />
                <Scatter data={scatterData} fill={PHASE_COLORS[phLabel] || T.navy} fillOpacity={0.5} r={3} />
              </ScatterChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Card title={`Category Average — ${phLabel}`}>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={catPhaseSorted} layout="vertical" margin={{ left: 120, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={115} />
                <Tooltip formatter={v => v.toFixed(4)} />
                <Bar dataKey="avg" fill={PHASE_COLORS[phLabel] || T.navy} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card title={`Country Average — ${phLabel}`}>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={countryPhaseAvg}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="country" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={v => v.toFixed(4)} />
                <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
                  {countryPhaseAvg.map(c => <Cell key={c.country} fill={COUNTRY_COLORS[c.country] || T.navy} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>
    );
  };

  /* ══════════════════════════════════════════════════════════════════
     TAB 6 — Hotspot Identification
     ══════════════════════════════════════════════════════════════════ */
  const renderHotspots = () => {
    const all = db.products.filter(p => p.total > 0);

    /* scatter: agri vs transport colored by category */
    const scatterData = all.map((p, i) => ({
      agriculture: p.agriculture, transport: p.transport, total: p.total,
      name: p.name, country: p.country, category: p.category,
      catIdx: db.categories.indexOf(p.category),
    }));

    /* import-heavy: transport > agriculture */
    const importHeavy = [...all].filter(p => p.transport > p.agriculture).sort((a, b) => (b.transport - b.agriculture) - (a.transport - a.agriculture)).slice(0, 15);

    /* agriculture-dominated: livestock */
    const agriDom = [...all].filter(p => p.total > 0 && p.agriculture / p.total > 0.6).sort((a, b) => b.agriculture - a.agriculture).slice(0, 15);

    /* hotspot: any single phase > 50% */
    const hotspots = all.filter(p => {
      return PHASES.some(ph => p.total > 0 && (p[ph] || 0) / p.total > 0.5);
    }).map(p => {
      const dominant = PHASES.reduce((best, ph) => (p[ph] || 0) > (p[best] || 0) ? ph : best, PHASES[0]);
      const domIdx = PHASES.indexOf(dominant);
      return { ...p, dominantPhase: PHASE_LABELS[domIdx], dominantPct: p.total > 0 ? ((p[dominant] / p.total) * 100).toFixed(1) : '0' };
    }).slice(0, 30);

    return (
      <div>
        <Card title="Agriculture EF vs Transport EF (colored by category, sized by total)" style={{ marginBottom: 16 }}>
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="agriculture" name="Agriculture" tick={{ fontSize: 10 }} label={{ value: 'Agriculture EF', position: 'insideBottom', offset: -5, fontSize: 10 }} />
              <YAxis dataKey="transport" name="Transport" tick={{ fontSize: 10 }} label={{ value: 'Transport EF', angle: -90, position: 'insideLeft', fontSize: 10 }} />
              <Tooltip content={({ payload }) => { if (!payload || !payload[0]) return null; const d = payload[0].payload; return (<div style={{ background: '#fff', border: `1px solid ${T.border}`, padding: 8, borderRadius: 6, fontSize: 11 }}><div style={{ fontWeight: 700 }}>{d.name} ({d.country})</div><div>Agri: {d.agriculture.toFixed(3)} | Transport: {d.transport.toFixed(3)} | Total: {d.total.toFixed(3)}</div></div>); }} />
              <ReferenceLine stroke={T.sub} strokeDasharray="5 5" segment={[{ x: 0, y: 0 }, { x: Math.max(...scatterData.map(d => d.agriculture), 1), y: Math.max(...scatterData.map(d => d.agriculture), 1) }]} />
              <Scatter data={scatterData} fillOpacity={0.6}>
                {scatterData.map((d, i) => <Cell key={i} fill={CAT_COLORS[d.catIdx % CAT_COLORS.length]} r={Math.max(3, Math.min(12, d.total * 1.5))} />)}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
          <div style={{ fontSize: 11, color: T.sub, marginTop: 4 }}>Products above the diagonal line have higher transport than agriculture emissions (import-heavy).</div>
        </Card>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <Card title="Import-Heavy: Transport > Agriculture">
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead><tr style={{ background: T.navy, color: '#fff' }}><th style={{ padding: '4px 8px', textAlign: 'left' }}>Product</th><th style={{ padding: '4px 8px' }}>Country</th><th style={{ padding: '4px 8px', textAlign: 'right' }}>Agri</th><th style={{ padding: '4px 8px', textAlign: 'right' }}>Transport</th></tr></thead>
                <tbody>{importHeavy.map(p => (
                  <tr key={p.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '4px 8px', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</td>
                    <td style={{ padding: '4px 8px', textAlign: 'center' }}>{p.country}</td>
                    <td style={{ padding: '4px 8px', textAlign: 'right', fontFamily: "'JetBrains Mono',monospace" }}>{p.agriculture.toFixed(3)}</td>
                    <td style={{ padding: '4px 8px', textAlign: 'right', fontFamily: "'JetBrains Mono',monospace", color: T.red }}>{p.transport.toFixed(3)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </Card>

          <Card title="Agriculture-Dominated (>60% of Total)">
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead><tr style={{ background: T.navy, color: '#fff' }}><th style={{ padding: '4px 8px', textAlign: 'left' }}>Product</th><th style={{ padding: '4px 8px' }}>Country</th><th style={{ padding: '4px 8px', textAlign: 'right' }}>Agri</th><th style={{ padding: '4px 8px', textAlign: 'right' }}>Total</th></tr></thead>
                <tbody>{agriDom.map(p => (
                  <tr key={p.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '4px 8px', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</td>
                    <td style={{ padding: '4px 8px', textAlign: 'center' }}>{p.country}</td>
                    <td style={{ padding: '4px 8px', textAlign: 'right', fontFamily: "'JetBrains Mono',monospace", color: T.green }}>{p.agriculture.toFixed(3)}</td>
                    <td style={{ padding: '4px 8px', textAlign: 'right', fontFamily: "'JetBrains Mono',monospace" }}>{p.total.toFixed(3)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </Card>
        </div>

        <Card title="Hotspot Table: Products Where Any Single Phase > 50% of Total">
          <div style={{ maxHeight: 350, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead><tr style={{ background: T.navy, color: '#fff' }}><th style={{ padding: '4px 8px', textAlign: 'left' }}>Product</th><th style={{ padding: '4px 8px' }}>Country</th><th style={{ padding: '4px 8px' }}>Dominant Phase</th><th style={{ padding: '4px 8px', textAlign: 'right' }}>Phase %</th><th style={{ padding: '4px 8px', textAlign: 'right' }}>Total</th></tr></thead>
              <tbody>{hotspots.map(p => (
                <tr key={p.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '4px 8px', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</td>
                  <td style={{ padding: '4px 8px', textAlign: 'center' }}>{p.country}</td>
                  <td style={{ padding: '4px 8px', fontWeight: 600 }}>{p.dominantPhase}</td>
                  <td style={{ padding: '4px 8px', textAlign: 'right', fontFamily: "'JetBrains Mono',monospace" }}>{p.dominantPct}%</td>
                  <td style={{ padding: '4px 8px', textAlign: 'right', fontFamily: "'JetBrains Mono',monospace" }}>{p.total.toFixed(3)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  };

  /* ══════════════════════════════════════════════════════════════════
     TAB 7 — Protein Comparison
     ══════════════════════════════════════════════════════════════════ */
  const renderProteinComparison = () => {
    const PROTEIN_CATS = ['Meat/poultry/other animals', 'Seafood', 'Milk/butter/cream/yougurts/cheese/eggs/substitutes', 'Milk/eggs/substitute products'];
    const proteinProducts = db.products.filter(p => PROTEIN_CATS.includes(p.category) && p.country === proteinCountry);

    /* group into protein families by keyword */
    const classify = (name) => {
      const n = name.toLowerCase();
      if (n.includes('beef') || n.includes('cattle') || n.includes('veal')) return 'Beef';
      if (n.includes('pork') || n.includes('pig') || n.includes('ham') || n.includes('bacon') || n.includes('sausage')) return 'Pork';
      if (n.includes('chicken') || n.includes('poultry') || n.includes('turkey') || n.includes('duck')) return 'Poultry';
      if (n.includes('fish') || n.includes('cod') || n.includes('salmon') || n.includes('trout') || n.includes('tuna') || n.includes('herring') || n.includes('mackerel') || n.includes('shrimp') || n.includes('prawn') || n.includes('mussel') || n.includes('lobster')) return 'Fish/Seafood';
      if (n.includes('egg')) return 'Eggs';
      if (n.includes('lamb') || n.includes('sheep') || n.includes('mutton')) return 'Lamb';
      if (n.includes('plant') || n.includes('soy') || n.includes('tofu') || n.includes('seitan') || n.includes('tempeh') || n.includes('substitute') || n.includes('oat drink') || n.includes('soya')) return 'Plant-Based';
      if (n.includes('milk') || n.includes('cheese') || n.includes('yogurt') || n.includes('yoghurt') || n.includes('cream') || n.includes('butter')) return 'Dairy';
      return 'Other';
    };

    const grouped = {};
    proteinProducts.forEach(p => {
      const family = classify(p.name);
      if (!grouped[family]) grouped[family] = [];
      grouped[family].push(p);
    });

    const familyAvg = Object.entries(grouped).map(([family, items]) => {
      const n = items.length || 1;
      return {
        family,
        total: items.reduce((s, p) => s + p.total, 0) / n,
        agriculture: items.reduce((s, p) => s + p.agriculture, 0) / n,
        iluc: items.reduce((s, p) => s + p.iluc, 0) / n,
        processing: items.reduce((s, p) => s + p.processing, 0) / n,
        packaging: items.reduce((s, p) => s + p.packaging, 0) / n,
        transport: items.reduce((s, p) => s + p.transport, 0) / n,
        retail: items.reduce((s, p) => s + p.retail, 0) / n,
        count: items.length,
      };
    });
    const familySorted = [...familyAvg].sort((a, b) => b.total - a.total);

    /* swap impact: from highest to plant-based if available */
    const beefAvg = familyAvg.find(f => f.family === 'Beef');
    const plantAvg = familyAvg.find(f => f.family === 'Plant-Based');

    return (
      <div>
        <div style={{ marginBottom: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Country:</span>
          <Select value={proteinCountry} onChange={setProteinCountry} options={db.countries.map(c => ({ value: c.code, label: c.label }))} />
          <span style={{ fontSize: 12, color: T.sub }}>{proteinProducts.length} protein products</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <Card title="Average Total EF by Protein Family (tCO2e/t)">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={familySorted} margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="family" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={v => v.toFixed(3)} />
                <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                  {familySorted.map((f, i) => <Cell key={f.family} fill={CAT_COLORS[i % CAT_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card title="Lifecycle Phase Breakdown by Protein Family">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={familySorted} margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="family" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={v => v.toFixed(4)} />
                <Legend />
                {PHASES.map((ph, i) => <Bar key={ph} dataKey={ph} stackId="a" fill={PHASE_COLORS[PHASE_LABELS[i]]} />)}
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {beefAvg && plantAvg && (
          <Card title="Swap Impact: Beef to Plant-Based" style={{ marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: 11, color: T.sub }}>Beef Average</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: T.red, fontFamily: "'JetBrains Mono',monospace" }}>{beefAvg.total.toFixed(2)}</div>
                <div style={{ fontSize: 11, color: T.sub }}>tCO2e/t</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: T.sub }}>Savings</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: T.green, fontFamily: "'JetBrains Mono',monospace" }}>{(beefAvg.total - plantAvg.total).toFixed(2)}</div>
                <div style={{ fontSize: 11, color: T.sub }}>tCO2e/t saved</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: T.sub }}>Plant-Based Average</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: T.green, fontFamily: "'JetBrains Mono',monospace" }}>{plantAvg.total.toFixed(2)}</div>
                <div style={{ fontSize: 11, color: T.sub }}>tCO2e/t</div>
              </div>
            </div>
          </Card>
        )}

        <Card title="Protein Family Details">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead><tr style={{ background: T.navy, color: '#fff' }}><th style={{ padding: '4px 8px', textAlign: 'left' }}>Family</th><th style={{ padding: '4px 8px', textAlign: 'right' }}>Count</th><th style={{ padding: '4px 8px', textAlign: 'right' }}>Avg Total</th><th style={{ padding: '4px 8px', textAlign: 'right' }}>Avg Agri</th><th style={{ padding: '4px 8px', textAlign: 'right' }}>Avg Transport</th><th style={{ padding: '4px 8px', textAlign: 'right' }}>Avg Processing</th></tr></thead>
            <tbody>{familySorted.map(f => (
              <tr key={f.family} style={{ borderBottom: `1px solid ${T.border}` }}>
                <td style={{ padding: '4px 8px', fontWeight: 600 }}>{f.family}</td>
                <td style={{ padding: '4px 8px', textAlign: 'right' }}>{f.count}</td>
                <td style={{ padding: '4px 8px', textAlign: 'right', fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>{f.total.toFixed(3)}</td>
                <td style={{ padding: '4px 8px', textAlign: 'right', fontFamily: "'JetBrains Mono',monospace" }}>{f.agriculture.toFixed(3)}</td>
                <td style={{ padding: '4px 8px', textAlign: 'right', fontFamily: "'JetBrains Mono',monospace" }}>{f.transport.toFixed(3)}</td>
                <td style={{ padding: '4px 8px', textAlign: 'right', fontFamily: "'JetBrains Mono',monospace" }}>{f.processing.toFixed(3)}</td>
              </tr>
            ))}</tbody>
          </table>
        </Card>
      </div>
    );
  };

  /* ══════════════════════════════════════════════════════════════════
     TAB 8 — Plant-Based Swap Calculator
     ══════════════════════════════════════════════════════════════════ */
  const renderSwapCalculator = () => {
    const fromProduct = swapFrom ? db.products.find(p => p.name === swapFrom && p.country === 'DK') || db.products.find(p => p.name === swapFrom) : null;
    const toProduct = swapTo ? db.products.find(p => p.name === swapTo && p.country === 'DK') || db.products.find(p => p.name === swapTo) : null;

    const annualKg = swapKgWeek * 52;
    const annualSavings = fromProduct && toProduct ? (fromProduct.total - toProduct.total) * annualKg / 1000 : 0;

    /* waterfall data */
    const waterfallData = fromProduct && toProduct ? PHASE_LABELS.map((label, i) => ({
      phase: label, saving: (fromProduct[PHASES[i]] || 0) - (toProduct[PHASES[i]] || 0),
    })) : [];

    /* batch swaps */
    const BATCH_SWAPS = useMemo(() => {
      const swaps = [
        { from: 'Beef, minced, 15-20% fat, raw', to: 'Tofu, firm', label: 'Beef mince to Tofu' },
        { from: 'Pork, minced, 5-10% fat, raw', to: 'Tofu, firm', label: 'Pork mince to Tofu' },
        { from: 'Cheese, Gouda, 45+, fatty', to: 'Tofu, firm', label: 'Gouda to Tofu' },
        { from: 'Butter, unsalted', to: 'Oil, rapeseed', label: 'Butter to Rapeseed Oil' },
      ];
      return swaps.map(s => {
        const fp = db.products.find(p => p.name === s.from && p.country === 'DK') || db.products.find(p => p.name === s.from);
        const tp = db.products.find(p => p.name === s.to && p.country === 'DK') || db.products.find(p => p.name === s.to);
        const saving = fp && tp ? fp.total - tp.total : 0;
        return { ...s, fromEF: fp ? fp.total : 0, toEF: tp ? tp.total : 0, saving, annual: saving * 52 / 1000 };
      }).filter(s => s.fromEF > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [db.products]);

    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <Card title="Current Food">
            <Select value={swapFrom} onChange={setSwapFrom} options={uniqueNames.map(n => ({ value: n, label: n }))} placeholder="Select current food..." style={{ width: '100%', marginBottom: 10 }} />
            {fromProduct && (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={db.getBreakdown(fromProduct.id)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="phase" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={v => v.toFixed(4)} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {db.getBreakdown(fromProduct.id).map(e => <Cell key={e.phase} fill={PHASE_COLORS[e.phase]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          <Card title="Alternative Food">
            <Select value={swapTo} onChange={setSwapTo} options={uniqueNames.map(n => ({ value: n, label: n }))} placeholder="Select alternative..." style={{ width: '100%', marginBottom: 10 }} />
            {toProduct && (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={db.getBreakdown(toProduct.id)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="phase" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={v => v.toFixed(4)} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {db.getBreakdown(toProduct.id).map(e => <Cell key={e.phase} fill={PHASE_COLORS[e.phase]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </div>

        {fromProduct && toProduct && (
          <>
            <Card title="Phase-by-Phase Savings Waterfall" style={{ marginBottom: 16 }}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={waterfallData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="phase" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={v => v.toFixed(4)} />
                  <ReferenceLine y={0} stroke={T.sub} />
                  <Bar dataKey="saving" radius={[4, 4, 0, 0]}>
                    {waterfallData.map((d, i) => <Cell key={i} fill={d.saving >= 0 ? T.green : T.red} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div style={{ fontSize: 11, color: T.sub, marginTop: 4 }}>Positive bars = emission saved by switching; negative = alternative is higher for that phase.</div>
            </Card>

            <Card title="Annual Impact Calculator" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                <label style={{ fontSize: 13 }}>Consumption (kg/week):
                  <input type="number" value={swapKgWeek} onChange={e => setSwapKgWeek(Math.max(0.1, parseFloat(e.target.value) || 0.1))} min={0.1} step={0.5} style={{ marginLeft: 8, padding: '4px 8px', width: 80, borderRadius: 4, border: `1px solid ${T.border}`, fontFamily: "'JetBrains Mono',monospace" }} />
                </label>
                <div style={{ fontSize: 14 }}>Annual consumption: <strong>{annualKg.toFixed(1)} kg</strong></div>
                <div style={{ fontSize: 14, color: annualSavings >= 0 ? T.green : T.red, fontWeight: 700 }}>
                  Annual CO2 saving: <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 18 }}>{annualSavings.toFixed(3)}</span> tCO2e
                </div>
              </div>
            </Card>
          </>
        )}

        <Card title="Batch Swap Suggestions (1 kg/week each, DK)">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead><tr style={{ background: T.navy, color: '#fff' }}><th style={{ padding: '6px 10px', textAlign: 'left' }}>Swap</th><th style={{ padding: '6px 10px', textAlign: 'right' }}>From EF</th><th style={{ padding: '6px 10px', textAlign: 'right' }}>To EF</th><th style={{ padding: '6px 10px', textAlign: 'right' }}>Saving/t</th><th style={{ padding: '6px 10px', textAlign: 'right' }}>Annual tCO2e</th></tr></thead>
            <tbody>{BATCH_SWAPS.map((s, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                <td style={{ padding: '6px 10px' }}>{s.label}</td>
                <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: "'JetBrains Mono',monospace" }}>{s.fromEF.toFixed(3)}</td>
                <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: "'JetBrains Mono',monospace" }}>{s.toEF.toFixed(3)}</td>
                <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: "'JetBrains Mono',monospace", color: T.green }}>{s.saving.toFixed(3)}</td>
                <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>{s.annual.toFixed(4)}</td>
              </tr>
            ))}</tbody>
            <tfoot><tr style={{ background: '#f0f0ea', fontWeight: 700 }}>
              <td style={{ padding: '6px 10px' }}>Cumulative</td><td /><td /><td />
              <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: "'JetBrains Mono',monospace", color: T.green }}>{BATCH_SWAPS.reduce((s, x) => s + x.annual, 0).toFixed(4)}</td>
            </tr></tfoot>
          </table>
        </Card>
      </div>
    );
  };

  /* ══════════════════════════════════════════════════════════════════
     TAB 9 — Data Quality & Methodology
     ══════════════════════════════════════════════════════════════════ */
  const renderMethodology = () => {
    /* coverage matrix: categories x countries */
    const coverageMatrix = db.categories.map(cat => {
      const row = { category: cat.length > 30 ? cat.slice(0, 27) + '...' : cat };
      db.countries.forEach(c => {
        row[c.code] = db.products.filter(p => p.category === cat && p.country === c.code).length;
      });
      return row;
    });

    const totalPerCountry = db.countries.map(c => ({ code: c.code, label: c.label, count: db.getProductsByCountry(c.code).length }));

    /* data completeness: check for zero-total or negative values */
    const zeroTotal = db.products.filter(p => p.total === 0).length;
    const negativeValues = db.products.filter(p => PHASES.some(ph => (p[ph] || 0) < 0)).length;

    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
          <KPI label="Total Products" value={db.stats.totalProducts.toLocaleString()} />
          <KPI label="Unique Products" value={db.stats.uniqueProducts} />
          <KPI label="Zero-Total Products" value={zeroTotal} sub={zeroTotal > 0 ? 'may indicate data gaps' : 'none'} />
          <KPI label="Negative Phase Values" value={negativeValues} sub="carbon sequestration credits" />
          <KPI label="Countries" value={db.stats.countries} />
          <KPI label="Categories" value={db.stats.categories} />
        </div>

        <Card title="Coverage Matrix (Products per Category per Country)" style={{ marginBottom: 16 }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead><tr style={{ background: T.navy, color: '#fff' }}>
                <th style={{ padding: '4px 8px', textAlign: 'left' }}>Category</th>
                {db.countries.map(c => <th key={c.code} style={{ padding: '4px 8px', textAlign: 'center' }}>{c.code}</th>)}
              </tr></thead>
              <tbody>{coverageMatrix.map((row, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? '#fff' : '#fafaf7' }}>
                  <td style={{ padding: '4px 8px', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.category}</td>
                  {db.countries.map(c => <td key={c.code} style={{ padding: '4px 8px', textAlign: 'center', fontFamily: "'JetBrains Mono',monospace", color: row[c.code] === 0 ? T.red : T.text }}>{row[c.code]}</td>)}
                </tr>
              ))}</tbody>
              <tfoot><tr style={{ background: '#f0f0ea', fontWeight: 700 }}>
                <td style={{ padding: '4px 8px' }}>Total</td>
                {totalPerCountry.map(c => <td key={c.code} style={{ padding: '4px 8px', textAlign: 'center', fontFamily: "'JetBrains Mono',monospace" }}>{c.count}</td>)}
              </tr></tfoot>
            </table>
          </div>
        </Card>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <Card title="Methodology Summary">
            <div style={{ fontSize: 12, color: T.text, lineHeight: 1.7 }}>
              <strong>Approach:</strong> Consequential Life Cycle Assessment (LCA)<br />
              <strong>System Boundary:</strong> Cradle-to-retail (farm gate through retail shelf)<br />
              <strong>Functional Unit:</strong> 1 tonne of product as consumed<br />
              <strong>Allocation:</strong> System expansion for co-products<br />
              <strong>Phases:</strong> Agriculture, indirect Land Use Change (iLUC), Processing, Packaging, Transport, Retail<br />
              <strong>Impact Category:</strong> Global Warming Potential (GWP100), unit tCO2e<br />
              <strong>LCA Software:</strong> 2-0 LCA Consultants methodology<br />
              <strong>Reference Year:</strong> 2024
            </div>
          </Card>

          <Card title="Attribution & License">
            <div style={{ fontSize: 12, color: T.text, lineHeight: 1.7 }}>
              <strong>Database:</strong> The Big Climate Database {db.version}<br />
              <strong>Publisher:</strong> CONCITO (Denmark's green think tank)<br />
              <strong>LCA Provider:</strong> 2-0 LCA Consultants<br />
              <strong>License:</strong> Creative Commons Attribution (CC-BY)<br />
              <strong>Coverage:</strong> {db.stats.uniqueProducts} food products, {db.stats.countries} EU countries<br />
              <strong>Note:</strong> Negative phase values represent carbon sequestration credits (e.g., plant uptake during agriculture phase). These are legitimate LCA results, not data errors.
            </div>
          </Card>
        </div>
      </div>
    );
  };

  /* ══════════════════════════════════════════════════════════════════
     TAB 10 — Benchmarking & Targets
     ══════════════════════════════════════════════════════════════════ */
  const renderBenchmarks = () => {
    const catItems = db.getProductsByCategory(benchCat);
    const totals = [...catItems].sort((a, b) => a.total - b.total).map(p => p.total);
    const n = totals.length;

    const percentile = (arr, pct) => {
      if (arr.length === 0) return 0;
      const idx = (pct / 100) * (arr.length - 1);
      const lo = Math.floor(idx), hi = Math.ceil(idx);
      return lo === hi ? arr[lo] : arr[lo] + (arr[hi] - arr[lo]) * (idx - lo);
    };

    const avg = n > 0 ? totals.reduce((s, v) => s + v, 0) / n : 0;
    const p25 = percentile(totals, 25);
    const p50 = percentile(totals, 50);
    const p75 = percentile(totals, 75);

    /* product scoring */
    const scored = catItems.map(p => {
      let rating = 'green';
      if (p.total > p75) rating = 'red';
      else if (p.total > p50) rating = 'amber';
      return { ...p, rating };
    });
    const scoredSorted = [...scored].sort((a, b) => b.total - a.total).slice(0, 30);

    /* benchmark chart data */
    const benchData = [
      { name: 'P25 (Low)', value: p25 },
      { name: 'P50 (Median)', value: p50 },
      { name: 'Average', value: avg },
      { name: 'P75 (High)', value: p75 },
    ];

    /* target: which products exceed target */
    const targetEF = avg * (1 - reductionPct / 100);
    const exceedTarget = catItems.filter(p => p.total > targetEF).length;
    const meetTarget = catItems.length - exceedTarget;

    /* SBTi FLAG benchmark references */
    const flagData = db.categories.map(cat => {
      const items = db.getProductsByCategory(cat);
      const catAvg = items.length > 0 ? items.reduce((s, p) => s + p.total, 0) / items.length : 0;
      return { category: cat.length > 20 ? cat.slice(0, 17) + '...' : cat, avg: catAvg };
    });
    const flagSorted = [...flagData].sort((a, b) => b.avg - a.avg);

    return (
      <div>
        <div style={{ marginBottom: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Category:</span>
          <Select value={benchCat} onChange={setBenchCat} options={db.categories} style={{ width: 300 }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
          <KPI label="P25 (Low)" value={p25.toFixed(3)} sub="tCO2e/t" />
          <KPI label="P50 (Median)" value={p50.toFixed(3)} sub="tCO2e/t" />
          <KPI label="Average" value={avg.toFixed(3)} sub="tCO2e/t" />
          <KPI label="P75 (High)" value={p75.toFixed(3)} sub="tCO2e/t" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <Card title="Category Benchmarks">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={benchData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={v => v.toFixed(4)} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {benchData.map((_, i) => <Cell key={i} fill={[T.green, T.gold, T.navy, T.red][i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card title="Product Scoring vs Category Benchmark">
            <div style={{ maxHeight: 260, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead><tr style={{ background: T.navy, color: '#fff' }}><th style={{ padding: '4px 8px', textAlign: 'left' }}>Product</th><th style={{ padding: '4px 8px' }}>Country</th><th style={{ padding: '4px 8px', textAlign: 'right' }}>Total</th><th style={{ padding: '4px 8px', textAlign: 'center' }}>Rating</th></tr></thead>
                <tbody>{scoredSorted.map(p => (
                  <tr key={p.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '4px 8px', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</td>
                    <td style={{ padding: '4px 8px', textAlign: 'center' }}>{p.country}</td>
                    <td style={{ padding: '4px 8px', textAlign: 'right', fontFamily: "'JetBrains Mono',monospace" }}>{p.total.toFixed(3)}</td>
                    <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                      <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: p.rating === 'green' ? T.green : p.rating === 'amber' ? T.gold : T.red }} />
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </Card>
        </div>

        <Card title="SBTi FLAG Category Averages" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: T.sub, marginBottom: 8 }}>SBTi Forest, Land and Agriculture (FLAG) guidance requires commodity-level benchmarking. Category averages provide a starting reference.</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={flagSorted} layout="vertical" margin={{ left: 120, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="category" tick={{ fontSize: 9 }} width={115} />
              <Tooltip formatter={v => v.toFixed(3)} />
              <Bar dataKey="avg" fill={T.indigo} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Reduction Target Simulator">
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
            <label style={{ fontSize: 13 }}>Reduction target (%):
              <input type="range" min={5} max={80} value={reductionPct} onChange={e => setReductionPct(parseInt(e.target.value, 10))} style={{ marginLeft: 10, width: 200 }} />
              <span style={{ marginLeft: 8, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>{reductionPct}%</span>
            </label>
            <div style={{ fontSize: 13 }}>Target EF: <strong style={{ fontFamily: "'JetBrains Mono',monospace" }}>{targetEF.toFixed(3)}</strong> tCO2e/t</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <KPI label="Products Exceeding Target" value={exceedTarget} sub="need substitution" />
            <KPI label="Products Meeting Target" value={meetTarget} sub="already compliant" />
            <KPI label="Compliance Rate" value={catItems.length > 0 ? ((meetTarget / catItems.length) * 100).toFixed(1) + '%' : '0%'} />
          </div>
        </Card>
      </div>
    );
  };

  /* ══════════════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ padding: 24, background: T.surface, minHeight: '100vh', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 1300, margin: '0 auto' }}>
        <div style={{ marginBottom: 18 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: T.navy, margin: 0 }}>Big Climate Database</h1>
          <div style={{ fontSize: 12, color: T.sub, marginTop: 4 }}>CONCITO / 2-0 LCA | {db.version} | {db.stats.totalProducts.toLocaleString()} food products | {db.stats.countries} countries | CC-BY</div>
        </div>

        <TabBar tabs={TABS} active={tab} onChange={setTab} />

        <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: T.sub }}>Loading...</div>}>
          {tab === TABS[0] && renderDashboard()}
          {tab === TABS[1] && renderProductExplorer()}
          {tab === TABS[2] && renderCountryComparison()}
          {tab === TABS[3] && renderCategoryDeepDive()}
          {tab === TABS[4] && renderPhaseAnalysis()}
          {tab === TABS[5] && renderHotspots()}
          {tab === TABS[6] && renderProteinComparison()}
          {tab === TABS[7] && renderSwapCalculator()}
          {tab === TABS[8] && renderMethodology()}
          {tab === TABS[9] && renderBenchmarks()}
        </Suspense>
      </div>
    </div>
  );
}
