import React, { useState, useMemo } from 'react';

const T = { bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f6f4f0', navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280', green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f', teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c', surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace' };

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const TIERS = ['Tier 1', 'Tier 2', 'Tier 3', 'Tier 4', 'Tier 5', 'Tier 6'];
const CATEGORIES = ['Raw Materials', 'Manufacturing', 'Logistics', 'Packaging', 'Energy', 'Services', 'Agriculture', 'Chemicals'];
const SECTORS = ['Automotive', 'Electronics', 'Food & Bev', 'Apparel', 'Pharma', 'Retail', 'Industrial', 'Chemicals'];
const PATHWAYS = ['Science-Based', 'Net Zero 2040', 'Net Zero 2050', 'Carbon Neutral', 'Business As Usual'];
const REGIONS = ['EU', 'APAC', 'Americas', 'Middle East', 'Africa', 'South Asia'];

const SUPPLIERS = Array.from({ length: 80 }, (_, i) => ({
  id: i + 1,
  name: `Supplier ${String.fromCharCode(65 + (i % 26))}${Math.floor(i / 26) + 1}`,
  tier: Math.floor(sr(i * 3) * 6) + 1,
  category: CATEGORIES[Math.floor(sr(i * 7 + 2) * CATEGORIES.length)],
  sector: SECTORS[Math.floor(sr(i * 11 + 1) * SECTORS.length)],
  region: REGIONS[Math.floor(sr(i * 5 + 4) * REGIONS.length)],
  scope1: Math.round(sr(i * 13 + 2) * 5000 + 200),
  scope2: Math.round(sr(i * 17 + 3) * 3000 + 100),
  scope3Upstream: Math.round(sr(i * 19 + 5) * 15000 + 500),
  spendMn: parseFloat((sr(i * 23 + 6) * 50 + 2).toFixed(1)),
  dataQuality: parseFloat((sr(i * 29 + 7) * 4 + 1).toFixed(1)),
  pathway: PATHWAYS[Math.floor(sr(i * 31 + 8) * PATHWAYS.length)],
  sbtiCommitted: sr(i * 37 + 9) > 0.5,
  reductionTarget: Math.round(sr(i * 41 + 10) * 50 + 10),
  engagementScore: Math.round(sr(i * 43 + 11) * 100),
}));

const TABS = ['Overview', 'Tier Mapping', 'Hotspot Analysis', 'Decarbonisation Pathways', 'Engagement Tracker', 'Data Quality', 'Reduction Scenarios', 'Export'];

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px', flex: 1, minWidth: 150 }}>
    <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 700, color: color || T.navy }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 3 }}>{sub}</div>}
  </div>
);

const Bar = ({ pct, color, height = 8 }) => (
  <div style={{ background: T.borderL, borderRadius: 4, height, overflow: 'hidden' }}>
    <div style={{ width: `${Math.min(100, pct)}%`, background: color || T.navy, height: '100%', borderRadius: 4, transition: 'width 0.3s' }} />
  </div>
);

export default function SupplyChainEmissionsMapperPage() {
  const [tab, setTab] = useState(0);
  const [tierFilter, setTierFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sectorFilter, setSectorFilter] = useState('All');
  const [pathwayFilter, setPathwayFilter] = useState('All');
  const [sortBy, setSortBy] = useState('scope3Upstream');
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  const filtered = useMemo(() => {
    let d = SUPPLIERS;
    if (tierFilter !== 'All') d = d.filter(s => `Tier ${s.tier}` === tierFilter);
    if (categoryFilter !== 'All') d = d.filter(s => s.category === categoryFilter);
    if (sectorFilter !== 'All') d = d.filter(s => s.sector === sectorFilter);
    if (pathwayFilter !== 'All') d = d.filter(s => s.pathway === pathwayFilter);
    return [...d].sort((a, b) => b[sortBy] - a[sortBy]);
  }, [tierFilter, categoryFilter, sectorFilter, pathwayFilter, sortBy]);

  const totalScope3 = useMemo(() => SUPPLIERS.reduce((s, x) => s + x.scope3Upstream, 0), []);
  const totalScope1 = useMemo(() => SUPPLIERS.reduce((s, x) => s + x.scope1, 0), []);
  const totalSpend = useMemo(() => SUPPLIERS.reduce((s, x) => s + x.spendMn, 0), []);
  const sbtiCount = useMemo(() => SUPPLIERS.filter(s => s.sbtiCommitted).length, []);
  const avgDQ = useMemo(() => SUPPLIERS.reduce((s, x) => s + x.dataQuality, 0) / Math.max(1, SUPPLIERS.length), []);

  const tierBreakdown = useMemo(() => TIERS.map(t => {
    const sups = SUPPLIERS.filter(s => `Tier ${s.tier}` === t);
    const em = sups.reduce((a, s) => a + s.scope3Upstream, 0);
    return { tier: t, count: sups.length, emissions: em, pct: totalScope3 > 0 ? (em / totalScope3) * 100 : 0 };
  }), [totalScope3]);

  const categoryBreakdown = useMemo(() => CATEGORIES.map(c => {
    const sups = SUPPLIERS.filter(s => s.category === c);
    const em = sups.reduce((a, s) => a + s.scope3Upstream, 0);
    return { cat: c, count: sups.length, emissions: em, pct: totalScope3 > 0 ? (em / totalScope3) * 100 : 0 };
  }).sort((a, b) => b.emissions - a.emissions), [totalScope3]);

  const pathwayBreakdown = useMemo(() => PATHWAYS.map(p => {
    const sups = SUPPLIERS.filter(s => s.pathway === p);
    const em = sups.reduce((a, s) => a + s.scope3Upstream, 0);
    return { pathway: p, count: sups.length, emissions: em, avgTarget: sups.length ? sups.reduce((a, s) => a + s.reductionTarget, 0) / sups.length : 0 };
  }), []);

  const scenarioReductions = useMemo(() => [
    { name: '1.5°C (SBTi)', reduction: 42, cost: 38, timeline: 2030 },
    { name: '2°C Orderly', reduction: 28, cost: 22, timeline: 2030 },
    { name: 'Net Zero 2050', reduction: 65, cost: 55, timeline: 2050 },
    { name: 'Partial Engagement', reduction: 18, cost: 12, timeline: 2035 },
  ], []);

  const top10Hotspots = useMemo(() => [...SUPPLIERS].sort((a, b) => b.scope3Upstream - a.scope3Upstream).slice(0, 10), []);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: T.textPri }}>
      {/* Header */}
      <div style={{ background: T.navy, borderBottom: `3px solid ${T.gold}`, padding: '20px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <span style={{ background: T.gold, color: T.navy, fontFamily: T.fontMono, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 3 }}>EP-DN1</span>
          <span style={{ color: T.gold, fontFamily: T.fontMono, fontSize: 11 }}>SUPPLY CHAIN CLIMATE INTELLIGENCE</span>
        </div>
        <h1 style={{ color: '#ffffff', fontSize: 22, fontWeight: 700, margin: 0 }}>Supply Chain Emissions Mapper</h1>
        <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>Scope 3 mapping across 6 tiers · 80 suppliers · Hotspot identification · Decarbonisation pathways · GHG Protocol Cat. 1–15</p>
      </div>

      {/* KPI Bar */}
      <div style={{ display: 'flex', gap: 12, padding: '16px 32px', background: T.cream, borderBottom: `1px solid ${T.border}`, flexWrap: 'wrap' }}>
        <KpiCard label="Total Scope 3 Upstream" value={`${(totalScope3 / 1000).toFixed(0)}k tCO₂e`} sub="All 80 suppliers" color={T.orange} />
        <KpiCard label="Total Scope 1+2" value={`${((totalScope1) / 1000).toFixed(0)}k tCO₂e`} sub="Direct supplier emissions" color={T.navy} />
        <KpiCard label="SBTi Committed" value={`${sbtiCount}/80`} sub={`${((sbtiCount / 80) * 100).toFixed(0)}% adoption rate`} color={T.green} />
        <KpiCard label="Total Spend Tracked" value={`$${totalSpend.toFixed(0)}M`} sub="Under emissions management" color={T.gold} />
        <KpiCard label="Avg Data Quality" value={`${avgDQ.toFixed(1)}/5`} sub="DQ Score across supply base" color={T.teal} />
        <KpiCard label="Tier 1 Hotspot Pct" value={`${tierBreakdown[0]?.pct.toFixed(1)}%`} sub="Of total upstream emissions" color={T.red} />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, padding: '0 32px', background: T.card, borderBottom: `1px solid ${T.border}`, overflowX: 'auto' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{ padding: '12px 18px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: tab === i ? 700 : 400, color: tab === i ? T.navy : T.textSec, borderBottom: tab === i ? `2px solid ${T.navy}` : '2px solid transparent', fontSize: 13, whiteSpace: 'nowrap' }}>{t}</button>
        ))}
      </div>

      <div style={{ padding: '24px 32px' }}>

        {/* Overview */}
        {tab === 0 && (
          <div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
              <div style={{ flex: 2, minWidth: 300, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <div style={{ fontWeight: 700, marginBottom: 12, color: T.navy }}>Emissions by Tier</div>
                {tierBreakdown.map((t, i) => (
                  <div key={t.tier} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                      <span style={{ fontWeight: 600 }}>{t.tier}</span>
                      <span style={{ fontFamily: T.fontMono, fontSize: 12 }}>{(t.emissions / 1000).toFixed(0)}k tCO₂e · {t.count} suppliers · {t.pct.toFixed(1)}%</span>
                    </div>
                    <Bar pct={t.pct} color={[T.red, T.orange, T.amber, T.gold, T.sage, T.teal][i]} />
                  </div>
                ))}
              </div>
              <div style={{ flex: 1, minWidth: 240, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <div style={{ fontWeight: 700, marginBottom: 12, color: T.navy }}>Pathway Distribution</div>
                {pathwayBreakdown.map((p, i) => (
                  <div key={p.pathway} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                      <span style={{ fontWeight: 600, fontSize: 11 }}>{p.pathway}</span>
                      <span style={{ fontFamily: T.fontMono, color: T.textSec }}>{p.count} suppliers</span>
                    </div>
                    <Bar pct={totalScope3 > 0 ? (p.emissions / totalScope3) * 100 : 0} color={[T.green, T.teal, T.blue, T.indigo, T.red][i]} />
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontWeight: 700, marginBottom: 12, color: T.navy }}>Top 10 Emission Hotspots</div>
              <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Supplier', 'Tier', 'Sector', 'Scope 3 Upstream', '% of Total', 'Pathway', 'SBTi'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, fontSize: 11, color: T.textSec, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {top10Hotspots.map((s, i) => (
                    <tr key={s.id} style={{ background: i % 2 === 0 ? T.card : T.sub, cursor: 'pointer' }} onClick={() => setSelectedSupplier(s)}>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>{s.name}</td>
                      <td style={{ padding: '8px 12px' }}><span style={{ background: T.surfaceH, padding: '2px 8px', borderRadius: 12, fontSize: 11 }}>{`Tier ${s.tier}`}</span></td>
                      <td style={{ padding: '8px 12px', color: T.textSec }}>{s.sector}</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.fontMono, fontWeight: 700, color: T.orange }}>{s.scope3Upstream.toLocaleString()} tCO₂e</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>{totalScope3 > 0 ? ((s.scope3Upstream / totalScope3) * 100).toFixed(2) : '0.00'}%</td>
                      <td style={{ padding: '8px 12px', fontSize: 11 }}>{s.pathway}</td>
                      <td style={{ padding: '8px 12px' }}><span style={{ color: s.sbtiCommitted ? T.green : T.red, fontWeight: 700 }}>{s.sbtiCommitted ? 'Yes' : 'No'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tier Mapping */}
        {tab === 1 && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              {['All', ...TIERS].map(t => (
                <button key={t} onClick={() => setTierFilter(t)} style={{ padding: '6px 14px', border: `1px solid ${tierFilter === t ? T.navy : T.border}`, borderRadius: 20, background: tierFilter === t ? T.navy : T.card, color: tierFilter === t ? '#fff' : T.textPri, cursor: 'pointer', fontSize: 12 }}>{t}</button>
              ))}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontWeight: 700, marginBottom: 12, color: T.navy }}>Supplier Tier Map — {filtered.length} suppliers</div>
              <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Supplier', 'Tier', 'Category', 'Region', 'Scope 1', 'Scope 2', 'Scope 3 Up', 'Spend ($M)', 'DQ Score'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: T.textSec, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 30).map((s, i) => (
                    <tr key={s.id} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '7px 10px', fontWeight: 600 }}>{s.name}</td>
                      <td style={{ padding: '7px 10px' }}><span style={{ background: `${T.navy}20`, color: T.navy, padding: '1px 7px', borderRadius: 10, fontSize: 11 }}>T{s.tier}</span></td>
                      <td style={{ padding: '7px 10px', fontSize: 12, color: T.textSec }}>{s.category}</td>
                      <td style={{ padding: '7px 10px', fontSize: 12 }}>{s.region}</td>
                      <td style={{ padding: '7px 10px', fontFamily: T.fontMono, fontSize: 12 }}>{s.scope1.toLocaleString()}</td>
                      <td style={{ padding: '7px 10px', fontFamily: T.fontMono, fontSize: 12 }}>{s.scope2.toLocaleString()}</td>
                      <td style={{ padding: '7px 10px', fontFamily: T.fontMono, fontSize: 12, color: T.orange, fontWeight: 700 }}>{s.scope3Upstream.toLocaleString()}</td>
                      <td style={{ padding: '7px 10px', fontFamily: T.fontMono, fontSize: 12 }}>{s.spendMn}</td>
                      <td style={{ padding: '7px 10px' }}><span style={{ color: s.dataQuality >= 4 ? T.green : s.dataQuality >= 3 ? T.amber : T.red, fontWeight: 700, fontFamily: T.fontMono, fontSize: 12 }}>{s.dataQuality.toFixed(1)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Hotspot Analysis */}
        {tab === 2 && (
          <div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
              {categoryBreakdown.map((c, i) => (
                <div key={c.cat} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, flex: '1 1 200px', minWidth: 180 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 8 }}>{c.cat}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: T.orange, fontFamily: T.fontMono, marginBottom: 4 }}>{(c.emissions / 1000).toFixed(0)}k tCO₂e</div>
                  <div style={{ fontSize: 11, color: T.textSec, marginBottom: 8 }}>{c.count} suppliers · {c.pct.toFixed(1)}% of total</div>
                  <Bar pct={c.pct} color={[T.red, T.orange, T.amber, T.gold, T.green, T.teal, T.blue, T.indigo][i]} />
                </div>
              ))}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontWeight: 700, marginBottom: 12, color: T.navy }}>Hotspot Concentration Analysis — Scope 3 Category Breakdown</div>
              <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Category', 'Suppliers', 'Total Emissions', '% of Scope 3', 'Avg Emissions', 'Spend $M', 'Priority'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: T.textSec, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {categoryBreakdown.map((c, i) => (
                    <tr key={c.cat} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>{c.cat}</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>{c.count}</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.fontMono, color: T.orange, fontWeight: 700 }}>{(c.emissions / 1000).toFixed(1)}k tCO₂e</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>{c.pct.toFixed(1)}%</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>{c.count > 0 ? (c.emissions / c.count).toFixed(0) : 0} tCO₂e</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>{SUPPLIERS.filter(s => s.category === c.cat).reduce((a, s) => a + s.spendMn, 0).toFixed(0)}</td>
                      <td style={{ padding: '8px 12px' }}><span style={{ background: c.pct > 20 ? `${T.red}20` : c.pct > 10 ? `${T.amber}20` : `${T.green}20`, color: c.pct > 20 ? T.red : c.pct > 10 ? T.amber : T.green, padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600 }}>{c.pct > 20 ? 'Critical' : c.pct > 10 ? 'High' : 'Medium'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Decarbonisation Pathways */}
        {tab === 3 && (
          <div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
              {pathwayBreakdown.map((p, i) => (
                <div key={p.pathway} style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.textSec, marginBottom: 4 }}>{p.pathway}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: [T.green, T.teal, T.blue, T.indigo, T.red][i], fontFamily: T.fontMono }}>{p.count}</div>
                  <div style={{ fontSize: 11, color: T.textSec }}>suppliers · avg {p.avgTarget.toFixed(0)}% target</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: 2, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <div style={{ fontWeight: 700, marginBottom: 12, color: T.navy }}>Scenario Reduction Analysis</div>
                {scenarioReductions.map((sc, i) => (
                  <div key={sc.name} style={{ background: T.sub, borderRadius: 8, padding: 16, marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontWeight: 700, color: T.navy }}>{sc.name}</span>
                      <span style={{ fontFamily: T.fontMono, fontSize: 12, color: T.textSec }}>By {sc.timeline}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 20 }}>
                      <div>
                        <div style={{ fontSize: 11, color: T.textSec }}>Reduction Target</div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: T.green, fontFamily: T.fontMono }}>{sc.reduction}%</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: T.textSec }}>Estimated Cost ($M)</div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: T.amber, fontFamily: T.fontMono }}>${sc.cost}M</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: T.textSec }}>Abated tCO₂e</div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: T.teal, fontFamily: T.fontMono }}>{((totalScope3 * sc.reduction) / 100 / 1000).toFixed(0)}k</div>
                      </div>
                    </div>
                    <div style={{ marginTop: 8 }}><Bar pct={sc.reduction} color={[T.green, T.teal, T.blue, T.indigo][i]} /></div>
                  </div>
                ))}
              </div>
              <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <div style={{ fontWeight: 700, marginBottom: 12, color: T.navy }}>SBTi & Commitment Status</div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                    <span>SBTi Committed</span><span style={{ fontFamily: T.fontMono, color: T.green, fontWeight: 700 }}>{sbtiCount} suppliers</span>
                  </div>
                  <Bar pct={(sbtiCount / 80) * 100} color={T.green} />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                    <span>Not Yet Committed</span><span style={{ fontFamily: T.fontMono, color: T.red, fontWeight: 700 }}>{80 - sbtiCount} suppliers</span>
                  </div>
                  <Bar pct={((80 - sbtiCount) / 80) * 100} color={T.red} />
                </div>
                <div style={{ background: T.sub, borderRadius: 8, padding: 12, marginTop: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Key Pathway Metrics</div>
                  {[
                    { label: 'Avg Reduction Target', value: `${(SUPPLIERS.reduce((a, s) => a + s.reductionTarget, 0) / 80).toFixed(0)}%` },
                    { label: 'Science-Based Coverage', value: `${SUPPLIERS.filter(s => s.pathway === 'Science-Based').length} suppliers` },
                    { label: 'BAU Risk Exposure', value: `${(SUPPLIERS.filter(s => s.pathway === 'Business As Usual').reduce((a, s) => a + s.scope3Upstream, 0) / 1000).toFixed(0)}k tCO₂e` },
                  ].map(m => (
                    <div key={m.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', borderBottom: `1px solid ${T.borderL}` }}>
                      <span style={{ color: T.textSec }}>{m.label}</span>
                      <span style={{ fontFamily: T.fontMono, fontWeight: 700 }}>{m.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Engagement Tracker */}
        {tab === 4 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontWeight: 700, marginBottom: 12, color: T.navy }}>Supplier Engagement Scores — Top 25 Suppliers by Emission Intensity</div>
              <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Supplier', 'Tier', 'Engagement Score', 'SBTi', 'Reduction Target', 'Pathway', 'Action'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: T.textSec, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...SUPPLIERS].sort((a, b) => b.scope3Upstream - a.scope3Upstream).slice(0, 25).map((s, i) => (
                    <tr key={s.id} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>{s.name}</td>
                      <td style={{ padding: '8px 12px' }}><span style={{ background: T.surfaceH, padding: '1px 7px', borderRadius: 10, fontSize: 11 }}>T{s.tier}</span></td>
                      <td style={{ padding: '8px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1 }}><Bar pct={s.engagementScore} color={s.engagementScore >= 70 ? T.green : s.engagementScore >= 40 ? T.amber : T.red} /></div>
                          <span style={{ fontFamily: T.fontMono, fontSize: 11, minWidth: 28, color: s.engagementScore >= 70 ? T.green : s.engagementScore >= 40 ? T.amber : T.red, fontWeight: 700 }}>{s.engagementScore}</span>
                        </div>
                      </td>
                      <td style={{ padding: '8px 12px' }}><span style={{ color: s.sbtiCommitted ? T.green : T.red, fontWeight: 700 }}>{s.sbtiCommitted ? '✓' : '✗'}</span></td>
                      <td style={{ padding: '8px 12px', fontFamily: T.fontMono, fontSize: 12 }}>{s.reductionTarget}%</td>
                      <td style={{ padding: '8px 12px', fontSize: 11 }}>{s.pathway}</td>
                      <td style={{ padding: '8px 12px' }}><span style={{ background: s.engagementScore < 40 ? `${T.red}20` : `${T.green}20`, color: s.engagementScore < 40 ? T.red : T.green, padding: '2px 8px', borderRadius: 10, fontSize: 11 }}>{s.engagementScore < 40 ? 'Escalate' : 'Active'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Data Quality */}
        {tab === 5 && (
          <div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
              {[1, 2, 3, 4, 5].map(score => {
                const count = SUPPLIERS.filter(s => Math.floor(s.dataQuality) === score).length;
                return (
                  <div key={score} style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, textAlign: 'center' }}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: score >= 4 ? T.green : score >= 3 ? T.amber : T.red, fontFamily: T.fontMono }}>{score}</div>
                    <div style={{ fontSize: 12, color: T.textSec, marginBottom: 4 }}>DQ Score</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: T.navy }}>{count}</div>
                    <div style={{ fontSize: 11, color: T.textSec }}>suppliers</div>
                  </div>
                );
              })}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontWeight: 700, marginBottom: 12, color: T.navy }}>Data Quality Distribution by Category</div>
              {CATEGORIES.map(cat => {
                const sups = SUPPLIERS.filter(s => s.category === cat);
                const avgDQ = sups.length ? sups.reduce((a, s) => a + s.dataQuality, 0) / sups.length : 0;
                return (
                  <div key={cat} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span>{cat}</span>
                      <span style={{ fontFamily: T.fontMono, fontSize: 12, color: avgDQ >= 4 ? T.green : avgDQ >= 3 ? T.amber : T.red, fontWeight: 700 }}>{avgDQ.toFixed(1)}/5 · {sups.length} suppliers</span>
                    </div>
                    <Bar pct={(avgDQ / 5) * 100} color={avgDQ >= 4 ? T.green : avgDQ >= 3 ? T.amber : T.red} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Reduction Scenarios */}
        {tab === 6 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
              <div style={{ fontWeight: 700, marginBottom: 16, color: T.navy }}>Scope 3 Reduction Scenario Modelling</div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {scenarioReductions.map((sc, i) => (
                  <div key={sc.name} style={{ flex: 1, minWidth: 200, background: T.sub, borderRadius: 8, padding: 16, border: `1px solid ${T.border}` }}>
                    <div style={{ fontWeight: 700, color: T.navy, marginBottom: 12 }}>{sc.name}</div>
                    {[
                      { label: 'Target Year', val: sc.timeline, color: T.navy },
                      { label: 'Reduction %', val: `${sc.reduction}%`, color: T.green },
                      { label: 'Abated tCO₂e', val: `${((totalScope3 * sc.reduction) / 100 / 1000).toFixed(0)}k`, color: T.teal },
                      { label: 'Investment $M', val: `$${sc.cost}M`, color: T.amber },
                      { label: 'Residual Scope 3', val: `${((totalScope3 * (100 - sc.reduction)) / 100 / 1000).toFixed(0)}k tCO₂e`, color: T.orange },
                    ].map(m => (
                      <div key={m.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', borderBottom: `1px solid ${T.borderL}` }}>
                        <span style={{ color: T.textSec }}>{m.label}</span>
                        <span style={{ fontFamily: T.fontMono, fontWeight: 700, color: m.color }}>{m.val}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontWeight: 700, marginBottom: 12, color: T.navy }}>Reduction Potential by Sector</div>
              {SECTORS.map((sec, i) => {
                const sups = SUPPLIERS.filter(s => s.sector === sec);
                const em = sups.reduce((a, s) => a + s.scope3Upstream, 0);
                const avgTarget = sups.length ? sups.reduce((a, s) => a + s.reductionTarget, 0) / sups.length : 0;
                return (
                  <div key={sec} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600 }}>{sec}</span>
                      <span style={{ fontFamily: T.fontMono, fontSize: 12 }}>{(em / 1000).toFixed(0)}k tCO₂e · avg {avgTarget.toFixed(0)}% target</span>
                    </div>
                    <Bar pct={avgTarget * 2} color={[T.green, T.teal, T.blue, T.indigo, T.purple, T.orange, T.red, T.amber][i]} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Export */}
        {tab === 7 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 32, maxWidth: 600 }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: T.navy, marginBottom: 16 }}>Export Supply Chain Emissions Data</div>
            {[
              { label: 'Full Supplier Emissions Dataset (CSV)', desc: '80 suppliers · All tiers · Scope 1/2/3 breakdown', badge: 'CSV' },
              { label: 'Tier Mapping Report (XLSX)', desc: 'Tier 1–6 hierarchy · Category · Region · DQ Scores', badge: 'XLSX' },
              { label: 'Hotspot Analysis Report (PDF)', desc: 'Top 20 hotspots · Category analysis · Charts', badge: 'PDF' },
              { label: 'GHG Protocol Scope 3 Disclosure (PDF)', desc: 'Category 1–15 · Boundary setting · Methodology notes', badge: 'PDF' },
              { label: 'SBTi Supplier Engagement Tracker (XLSX)', desc: 'Engagement scores · Commitments · Reduction targets', badge: 'XLSX' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: `1px solid ${T.borderL}` }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: T.textSec }}>{item.desc}</div>
                </div>
                <span style={{ background: T.navy, color: '#fff', padding: '3px 10px', borderRadius: 4, fontSize: 11, fontFamily: T.fontMono, cursor: 'pointer' }}>{item.badge}</span>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
