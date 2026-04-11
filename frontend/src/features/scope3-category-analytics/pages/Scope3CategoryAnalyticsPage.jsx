import React, { useState, useMemo } from 'react';

const T = { bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f6f4f0', navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280', green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f', teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c', surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace' };

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const SCOPE3_CATEGORIES = [
  { id: 1, name: 'Cat 1: Purchased Goods & Services', type: 'Upstream' },
  { id: 2, name: 'Cat 2: Capital Goods', type: 'Upstream' },
  { id: 3, name: 'Cat 3: Fuel & Energy Activities', type: 'Upstream' },
  { id: 4, name: 'Cat 4: Upstream Transportation', type: 'Upstream' },
  { id: 5, name: 'Cat 5: Waste Generated in Operations', type: 'Upstream' },
  { id: 6, name: 'Cat 6: Business Travel', type: 'Upstream' },
  { id: 7, name: 'Cat 7: Employee Commuting', type: 'Upstream' },
  { id: 8, name: 'Cat 8: Upstream Leased Assets', type: 'Upstream' },
  { id: 9, name: 'Cat 9: Downstream Transportation', type: 'Downstream' },
  { id: 10, name: 'Cat 10: Processing of Sold Products', type: 'Downstream' },
  { id: 11, name: 'Cat 11: Use of Sold Products', type: 'Downstream' },
  { id: 12, name: 'Cat 12: End-of-Life Treatment', type: 'Downstream' },
  { id: 13, name: 'Cat 13: Downstream Leased Assets', type: 'Downstream' },
  { id: 14, name: 'Cat 14: Franchises', type: 'Downstream' },
  { id: 15, name: 'Cat 15: Investments', type: 'Downstream' },
];

const SECTORS = ['Technology', 'Consumer Goods', 'Automotive', 'Financial Services', 'Healthcare', 'Energy', 'Retail', 'Manufacturing', 'Telecoms', 'Food & Bev'];
const DQ_METHODS = ['Primary Data', 'Spend-Based', 'Hybrid', 'Activity-Based', 'IO Analysis', 'Supplier Data'];

const COMPANIES = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  name: `Company ${String.fromCharCode(65 + (i % 26))}${i < 26 ? '' : String.fromCharCode(65 + Math.floor(i / 26) - 1)}`,
  sector: SECTORS[Math.floor(sr(i * 3 + 1) * SECTORS.length)],
  revenue: parseFloat((sr(i * 7 + 2) * 10 + 0.5).toFixed(1)),
  categories: SCOPE3_CATEGORIES.map((cat, j) => ({
    catId: cat.id,
    emissions: cat.id === 1 ? Math.round(sr(i * 11 + j) * 100000 + 5000) : Math.round(sr(i * 13 + j) * 30000 + 1000),
    dataQuality: parseFloat((sr(i * 17 + j + 1) * 4 + 1).toFixed(1)),
    method: DQ_METHODS[Math.floor(sr(i * 19 + j + 2) * DQ_METHODS.length)],
    target2030: Math.round(sr(i * 23 + j + 3) * 50 + 10),
    baseYear: 2020 + Math.floor(sr(i * 29 + j) * 3),
    reported: sr(i * 31 + j) > 0.25,
  })),
}));

const TABS = ['Category Overview', 'Upstream Analysis', 'Downstream Analysis', 'Data Quality', 'Reduction Targets', 'Sector Comparison', 'Methodology', 'Disclosure Status'];

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px', flex: 1, minWidth: 150 }}>
    <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 700, color: color || T.navy }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 3 }}>{sub}</div>}
  </div>
);

const Bar = ({ pct, color, height = 8 }) => (
  <div style={{ background: T.borderL, borderRadius: 4, height, overflow: 'hidden' }}>
    <div style={{ width: `${Math.min(100, Math.max(0, pct))}%`, background: color || T.navy, height: '100%', borderRadius: 4 }} />
  </div>
);

export default function Scope3CategoryAnalyticsPage() {
  const [tab, setTab] = useState(0);
  const [sectorFilter, setSectorFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [catFilter, setCatFilter] = useState('All');

  const filteredCompanies = useMemo(() => {
    if (sectorFilter === 'All') return COMPANIES;
    return COMPANIES.filter(c => c.sector === sectorFilter);
  }, [sectorFilter]);

  const categoryTotals = useMemo(() => SCOPE3_CATEGORIES.map(cat => {
    const totalEm = filteredCompanies.reduce((a, c) => a + c.categories[cat.id - 1].emissions, 0);
    const avgDQ = filteredCompanies.reduce((a, c) => a + c.categories[cat.id - 1].dataQuality, 0) / Math.max(1, filteredCompanies.length);
    const reportedCount = filteredCompanies.filter(c => c.categories[cat.id - 1].reported).length;
    const avgTarget = filteredCompanies.reduce((a, c) => a + c.categories[cat.id - 1].target2030, 0) / Math.max(1, filteredCompanies.length);
    return { ...cat, totalEm, avgDQ, reportedCount, reportingPct: filteredCompanies.length > 0 ? (reportedCount / filteredCompanies.length) * 100 : 0, avgTarget };
  }), [filteredCompanies]);

  const grandTotal = useMemo(() => categoryTotals.reduce((a, c) => a + c.totalEm, 0), [categoryTotals]);
  const upstreamTotal = useMemo(() => categoryTotals.filter(c => c.type === 'Upstream').reduce((a, c) => a + c.totalEm, 0), [categoryTotals]);
  const downstreamTotal = useMemo(() => categoryTotals.filter(c => c.type === 'Downstream').reduce((a, c) => a + c.totalEm, 0), [categoryTotals]);
  const avgOverallDQ = useMemo(() => categoryTotals.reduce((a, c) => a + c.avgDQ, 0) / Math.max(1, categoryTotals.length), [categoryTotals]);
  const cat1Total = useMemo(() => categoryTotals.find(c => c.id === 1)?.totalEm || 0, [categoryTotals]);

  const methodBreakdown = useMemo(() => DQ_METHODS.map(m => {
    let count = 0;
    filteredCompanies.forEach(c => c.categories.forEach(cat => { if (cat.method === m) count++; }));
    return { method: m, count };
  }), [filteredCompanies]);

  const sectorComparison = useMemo(() => SECTORS.map(sec => {
    const sups = COMPANIES.filter(c => c.sector === sec);
    if (sups.length === 0) return { sector: sec, count: 0, avgScope3: 0, avgCat1: 0, avgDQ: 0 };
    const avgScope3 = sups.reduce((a, c) => a + c.categories.reduce((s, cat) => s + cat.emissions, 0), 0) / sups.length;
    const avgCat1 = sups.reduce((a, c) => a + c.categories[0].emissions, 0) / sups.length;
    const avgDQ = sups.reduce((a, c) => a + c.categories.reduce((s, cat) => s + cat.dataQuality, 0) / c.categories.length, 0) / sups.length;
    return { sector: sec, count: sups.length, avgScope3, avgCat1, avgDQ };
  }).filter(s => s.count > 0), []);

  const top5Categories = useMemo(() => [...categoryTotals].sort((a, b) => b.totalEm - a.totalEm).slice(0, 5), [categoryTotals]);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: T.textPri }}>
      <div style={{ background: T.navy, borderBottom: `3px solid ${T.gold}`, padding: '20px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <span style={{ background: T.gold, color: T.navy, fontFamily: T.fontMono, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 3 }}>EP-DN4</span>
          <span style={{ color: T.gold, fontFamily: T.fontMono, fontSize: 11 }}>SUPPLY CHAIN CLIMATE INTELLIGENCE</span>
        </div>
        <h1 style={{ color: '#ffffff', fontSize: 22, fontWeight: 700, margin: 0 }}>Scope 3 Category Analytics</h1>
        <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>All 15 GHG Protocol Scope 3 categories · 50 companies · 10 sectors · Data quality scoring · Reduction targets · CDP-aligned disclosure</p>
      </div>

      <div style={{ display: 'flex', gap: 12, padding: '16px 32px', background: T.cream, borderBottom: `1px solid ${T.border}`, flexWrap: 'wrap' }}>
        <KpiCard label="Total Scope 3 Emissions" value={`${(grandTotal / 1000000).toFixed(2)}M tCO₂e`} sub="All 15 categories tracked" color={T.orange} />
        <KpiCard label="Upstream Emissions" value={`${((upstreamTotal / Math.max(1, grandTotal)) * 100).toFixed(0)}%`} sub={`${(upstreamTotal / 1000000).toFixed(2)}M tCO₂e Cat 1–8`} color={T.navy} />
        <KpiCard label="Cat 1 Dominance" value={`${grandTotal > 0 ? ((cat1Total / grandTotal) * 100).toFixed(0) : 0}%`} sub="Purchased Goods & Services" color={T.red} />
        <KpiCard label="Avg Data Quality" value={`${avgOverallDQ.toFixed(1)}/5`} sub="Across all 15 categories" color={T.teal} />
        <KpiCard label="Companies Reporting" value={`${filteredCompanies.length}`} sub={`Active in analysis`} color={T.green} />
        <KpiCard label="Avg Cat 1 Reduction Target" value={`${categoryTotals.find(c => c.id === 1)?.avgTarget.toFixed(0) || 0}%`} sub="By 2030 vs. base year" color={T.indigo} />
      </div>

      <div style={{ display: 'flex', gap: 12, padding: '12px 32px', background: T.card, borderBottom: `1px solid ${T.border}`, flexWrap: 'wrap' }}>
        {['All', ...SECTORS].map(s => <button key={s} onClick={() => setSectorFilter(s)} style={{ padding: '5px 12px', border: `1px solid ${sectorFilter === s ? T.navy : T.border}`, borderRadius: 20, background: sectorFilter === s ? T.navy : T.sub, color: sectorFilter === s ? '#fff' : T.textPri, cursor: 'pointer', fontSize: 11 }}>{s}</button>)}
      </div>

      <div style={{ display: 'flex', gap: 0, padding: '0 32px', background: T.card, borderBottom: `1px solid ${T.border}`, overflowX: 'auto' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{ padding: '12px 16px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: tab === i ? 700 : 400, color: tab === i ? T.navy : T.textSec, borderBottom: tab === i ? `2px solid ${T.navy}` : '2px solid transparent', fontSize: 13, whiteSpace: 'nowrap' }}>{t}</button>
        ))}
      </div>

      <div style={{ padding: '24px 32px' }}>

        {tab === 0 && (
          <div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
              <div style={{ flex: 2, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <div style={{ fontWeight: 700, marginBottom: 12, color: T.navy }}>All 15 Scope 3 Categories — Emission Volumes</div>
                {categoryTotals.map((cat, i) => (
                  <div key={cat.id} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600 }}>{cat.name}</span>
                      <span style={{ fontFamily: T.fontMono, fontSize: 11 }}>{(cat.totalEm / 1000).toFixed(0)}k tCO₂e · {grandTotal > 0 ? ((cat.totalEm / grandTotal) * 100).toFixed(1) : 0}%</span>
                    </div>
                    <Bar pct={grandTotal > 0 ? (cat.totalEm / grandTotal) * 100 : 0} color={cat.type === 'Upstream' ? T.orange : T.teal} height={10} />
                  </div>
                ))}
                <div style={{ marginTop: 8, fontSize: 11, color: T.textSec, display: 'flex', gap: 16 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 12, height: 12, background: T.orange, borderRadius: 2, display: 'inline-block' }}></span> Upstream (Cat 1–8)</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 12, height: 12, background: T.teal, borderRadius: 2, display: 'inline-block' }}></span> Downstream (Cat 9–15)</span>
                </div>
              </div>
              <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <div style={{ fontWeight: 700, marginBottom: 12, color: T.navy }}>Top 5 Categories</div>
                {top5Categories.map((cat, i) => (
                  <div key={cat.id} style={{ background: T.sub, borderRadius: 6, padding: 12, marginBottom: 8 }}>
                    <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 4 }}>{cat.name.split(':')[0]}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: T.orange, fontFamily: T.fontMono }}>{(cat.totalEm / 1000).toFixed(0)}k tCO₂e</div>
                    <div style={{ fontSize: 11, color: T.textSec }}>{grandTotal > 0 ? ((cat.totalEm / grandTotal) * 100).toFixed(1) : 0}% of total · DQ {cat.avgDQ.toFixed(1)}/5</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 1 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 12, color: T.navy }}>Upstream Categories (Cat 1–8) — Detail</div>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Category', 'Total Emissions', '% of Total S3', 'Avg DQ Score', 'Reporting Rate', 'Avg 2030 Target', 'Priority'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: T.textSec, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {categoryTotals.filter(c => c.type === 'Upstream').map((cat, i) => (
                  <tr key={cat.id} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                    <td style={{ padding: '8px 12px', fontWeight: 600, fontSize: 12 }}>{cat.name}</td>
                    <td style={{ padding: '8px 12px', fontFamily: T.fontMono, color: T.orange, fontWeight: 700 }}>{(cat.totalEm / 1000).toFixed(0)}k tCO₂e</td>
                    <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>{grandTotal > 0 ? ((cat.totalEm / grandTotal) * 100).toFixed(1) : 0}%</td>
                    <td style={{ padding: '8px 12px', fontFamily: T.fontMono, color: cat.avgDQ >= 4 ? T.green : cat.avgDQ >= 3 ? T.amber : T.red, fontWeight: 700 }}>{cat.avgDQ.toFixed(1)}/5</td>
                    <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>{cat.reportingPct.toFixed(0)}%</td>
                    <td style={{ padding: '8px 12px', fontFamily: T.fontMono, color: T.green, fontWeight: 700 }}>{cat.avgTarget.toFixed(0)}%</td>
                    <td style={{ padding: '8px 12px' }}><span style={{ background: cat.id === 1 ? `${T.red}20` : cat.id <= 4 ? `${T.orange}20` : `${T.amber}20`, color: cat.id === 1 ? T.red : cat.id <= 4 ? T.orange : T.amber, padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600 }}>{cat.id === 1 ? 'Critical' : cat.id <= 4 ? 'High' : 'Medium'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 2 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 12, color: T.navy }}>Downstream Categories (Cat 9–15) — Detail</div>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Category', 'Total Emissions', '% of Total S3', 'Avg DQ Score', 'Reporting Rate', 'Avg 2030 Target', 'Use Phase'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: T.textSec, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {categoryTotals.filter(c => c.type === 'Downstream').map((cat, i) => (
                  <tr key={cat.id} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                    <td style={{ padding: '8px 12px', fontWeight: 600, fontSize: 12 }}>{cat.name}</td>
                    <td style={{ padding: '8px 12px', fontFamily: T.fontMono, color: T.teal, fontWeight: 700 }}>{(cat.totalEm / 1000).toFixed(0)}k tCO₂e</td>
                    <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>{grandTotal > 0 ? ((cat.totalEm / grandTotal) * 100).toFixed(1) : 0}%</td>
                    <td style={{ padding: '8px 12px', fontFamily: T.fontMono, color: cat.avgDQ >= 4 ? T.green : cat.avgDQ >= 3 ? T.amber : T.red, fontWeight: 700 }}>{cat.avgDQ.toFixed(1)}/5</td>
                    <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>{cat.reportingPct.toFixed(0)}%</td>
                    <td style={{ padding: '8px 12px', fontFamily: T.fontMono, color: T.green, fontWeight: 700 }}>{cat.avgTarget.toFixed(0)}%</td>
                    <td style={{ padding: '8px 12px' }}><span style={{ color: cat.id === 11 ? T.red : T.teal, fontWeight: 700, fontSize: 12 }}>{cat.id === 11 ? 'Dominant' : cat.id === 15 ? 'Financial' : 'Standard'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 3 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 12, color: T.navy }}>Data Quality by Category & Measurement Method</div>
              {categoryTotals.map((cat, i) => (
                <div key={cat.id} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600 }}>{cat.name.substring(0, 35)}…</span>
                    <span style={{ fontFamily: T.fontMono, fontSize: 11, color: cat.avgDQ >= 4 ? T.green : cat.avgDQ >= 3 ? T.amber : T.red, fontWeight: 700 }}>{cat.avgDQ.toFixed(1)}/5 · {cat.reportingPct.toFixed(0)}% reported</span>
                  </div>
                  <Bar pct={(cat.avgDQ / 5) * 100} color={cat.avgDQ >= 4 ? T.green : cat.avgDQ >= 3 ? T.amber : T.red} />
                </div>
              ))}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontWeight: 700, marginBottom: 12, color: T.navy }}>Measurement Method Distribution</div>
              {methodBreakdown.map((m, i) => (
                <div key={m.method} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span>{m.method}</span>
                    <span style={{ fontFamily: T.fontMono, fontSize: 12 }}>{m.count} data points · {((m.count / Math.max(1, filteredCompanies.length * 15)) * 100).toFixed(0)}%</span>
                  </div>
                  <Bar pct={(m.count / Math.max(1, filteredCompanies.length * 15)) * 100} color={[T.green, T.teal, T.blue, T.indigo, T.amber, T.orange][i]} />
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 4 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 12, color: T.navy }}>2030 Reduction Targets by Category</div>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Category', 'Current Emissions', 'Avg Target', 'Target Emissions', 'Reduction Volume', 'Difficulty'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: T.textSec, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...categoryTotals].sort((a, b) => b.avgTarget - a.avgTarget).map((cat, i) => {
                  const targetEm = cat.totalEm * (1 - cat.avgTarget / 100);
                  const reduction = cat.totalEm - targetEm;
                  return (
                    <tr key={cat.id} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600, fontSize: 12 }}>{cat.name.split(':')[1]?.trim()}</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.fontMono, fontSize: 12 }}>{(cat.totalEm / 1000).toFixed(0)}k tCO₂e</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.fontMono, fontWeight: 700, color: T.green }}>{cat.avgTarget.toFixed(0)}%</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.fontMono, fontSize: 12, color: T.teal }}>{(targetEm / 1000).toFixed(0)}k tCO₂e</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.fontMono, fontSize: 12, color: T.orange, fontWeight: 700 }}>-{(reduction / 1000).toFixed(0)}k tCO₂e</td>
                      <td style={{ padding: '8px 12px' }}><span style={{ background: cat.id === 1 || cat.id === 11 ? `${T.red}20` : `${T.amber}20`, color: cat.id === 1 || cat.id === 11 ? T.red : T.amber, padding: '2px 8px', borderRadius: 10, fontSize: 11 }}>{cat.id === 1 || cat.id === 11 ? 'Hard' : 'Moderate'}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {tab === 5 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 12, color: T.navy }}>Scope 3 Sector Comparison — 10 Sectors</div>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Sector', 'Companies', 'Avg Total S3', 'Avg Cat 1', 'Cat 1 Pct', 'Avg DQ Score', 'Intensity'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: T.textSec, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...sectorComparison].sort((a, b) => b.avgScope3 - a.avgScope3).map((sec, i) => (
                  <tr key={sec.sector} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                    <td style={{ padding: '8px 12px', fontWeight: 600 }}>{sec.sector}</td>
                    <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>{sec.count}</td>
                    <td style={{ padding: '8px 12px', fontFamily: T.fontMono, color: T.orange, fontWeight: 700 }}>{(sec.avgScope3 / 1000).toFixed(0)}k tCO₂e</td>
                    <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>{(sec.avgCat1 / 1000).toFixed(0)}k tCO₂e</td>
                    <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>{sec.avgScope3 > 0 ? ((sec.avgCat1 / sec.avgScope3) * 100).toFixed(0) : 0}%</td>
                    <td style={{ padding: '8px 12px', fontFamily: T.fontMono, color: sec.avgDQ >= 4 ? T.green : sec.avgDQ >= 3 ? T.amber : T.red, fontWeight: 700 }}>{sec.avgDQ.toFixed(1)}/5</td>
                    <td style={{ padding: '8px 12px' }}><span style={{ background: sec.avgScope3 > 100000 ? `${T.red}20` : `${T.amber}20`, color: sec.avgScope3 > 100000 ? T.red : T.amber, padding: '2px 8px', borderRadius: 10, fontSize: 11 }}>{sec.avgScope3 > 100000 ? 'High' : 'Medium'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 6 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 16, color: T.navy }}>GHG Protocol Scope 3 Methodology Notes</div>
            {SCOPE3_CATEGORIES.map((cat, i) => (
              <div key={cat.id} style={{ background: T.sub, borderRadius: 6, padding: 12, marginBottom: 8 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ background: cat.type === 'Upstream' ? T.orange : T.teal, color: '#fff', padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700, minWidth: 24, textAlign: 'center', fontFamily: T.fontMono }}>{cat.id}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 12 }}>{cat.name}</div>
                    <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{cat.type} · Preferred method: {DQ_METHODS[i % DQ_METHODS.length]} · Boundary: {cat.type === 'Upstream' ? 'Purchased inputs & operations' : 'Post-sale product use & disposal'}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 7 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 12, color: T.navy }}>Scope 3 Disclosure Status — {filteredCompanies.length} Companies</div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
              {categoryTotals.map((cat, i) => (
                <div key={cat.id} style={{ flex: '1 1 150px', background: T.sub, borderRadius: 8, padding: 12, textAlign: 'center', border: `1px solid ${cat.reportingPct >= 70 ? T.green : cat.reportingPct >= 50 ? T.amber : T.red}` }}>
                  <div style={{ fontSize: 10, fontFamily: T.fontMono, color: T.textSec, marginBottom: 4 }}>Cat {cat.id}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: cat.reportingPct >= 70 ? T.green : cat.reportingPct >= 50 ? T.amber : T.red, fontFamily: T.fontMono }}>{cat.reportingPct.toFixed(0)}%</div>
                  <div style={{ fontSize: 10, color: T.textSec }}>reporting rate</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
