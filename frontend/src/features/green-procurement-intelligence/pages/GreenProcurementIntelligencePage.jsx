import React, { useState, useMemo } from 'react';

const T = { bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f6f4f0', navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280', green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f', teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c', surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace' };

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const STANDARDS = ['EU GPP', 'ISO 14001', 'EMAS', 'Cradle2Cradle', 'FSC', 'Energy Star', 'LEED', 'B Corp'];
const CATEGORIES = ['IT & Digital', 'Facilities', 'Fleet & Transport', 'Catering & Food', 'Construction', 'Professional Services', 'Paper & Office', 'Cleaning & Hygiene'];
const STATUS = ['Compliant', 'Partial', 'Non-Compliant', 'In Progress', 'Pending Review'];
const REGIONS = ['EU', 'UK', 'Americas', 'APAC', 'Global'];

const PROGRAMMES = Array.from({ length: 65 }, (_, i) => ({
  id: i + 1,
  name: `Green Programme ${i + 1}`,
  category: CATEGORIES[Math.floor(sr(i * 3 + 1) * CATEGORIES.length)],
  standard: STANDARDS[Math.floor(sr(i * 5 + 2) * STANDARDS.length)],
  region: REGIONS[Math.floor(sr(i * 7 + 3) * REGIONS.length)],
  totalSpendMn: parseFloat((sr(i * 11 + 4) * 50 + 5).toFixed(1)),
  greenSpendMn: parseFloat((sr(i * 13 + 5) * 40 + 1).toFixed(1)),
  greenSpendPct: 0,
  co2SavedT: Math.round(sr(i * 17 + 6) * 5000 + 100),
  costSavingsMn: parseFloat((sr(i * 19 + 7) * 5 + 0.1).toFixed(2)),
  status: STATUS[Math.floor(sr(i * 23 + 8) * STATUS.length)],
  supplierCount: Math.round(sr(i * 29 + 9) * 20 + 2),
  renewableEnergyPct: parseFloat((sr(i * 31 + 10) * 100).toFixed(1)),
  wasteReductionPct: parseFloat((sr(i * 37 + 11) * 80 + 5).toFixed(1)),
  waterSavingM3: Math.round(sr(i * 41 + 12) * 10000 + 100),
  certScore: parseFloat((sr(i * 43 + 13) * 60 + 40).toFixed(1)),
  paybackYears: parseFloat((sr(i * 47 + 14) * 7 + 0.5).toFixed(1)),
}));

PROGRAMMES.forEach(p => {
  p.greenSpendPct = Math.min(100, parseFloat(((p.greenSpendMn / Math.max(0.01, p.totalSpendMn)) * 100).toFixed(1)));
});

const TABS = ['Programme Overview', 'Standards Compliance', 'Spend Analytics', 'CO₂ Savings', 'Certification Tracker', 'Supplier Engagement', 'Savings Calculator', 'Reporting'];

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px', flex: 1, minWidth: 150 }}>
    <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 700, color: color || T.navy }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 3 }}>{sub}</div>}
  </div>
);

const Bar = ({ pct, color, height = 8 }) => (
  <div style={{ background: T.borderL, borderRadius: 4, height, overflow: 'hidden' }}>
    <div style={{ width: `${Math.min(100, Math.max(0, pct))}%`, background: color || T.green, height: '100%', borderRadius: 4 }} />
  </div>
);

const StatusBadge = ({ status }) => {
  const colors = { Compliant: T.green, Partial: T.amber, 'Non-Compliant': T.red, 'In Progress': T.blue, 'Pending Review': T.textSec };
  return <span style={{ background: `${colors[status] || T.textSec}20`, color: colors[status] || T.textSec, padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600 }}>{status}</span>;
};

export default function GreenProcurementIntelligencePage() {
  const [tab, setTab] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [standardFilter, setStandardFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('greenSpendPct');

  const filtered = useMemo(() => {
    let d = PROGRAMMES;
    if (categoryFilter !== 'All') d = d.filter(p => p.category === categoryFilter);
    if (standardFilter !== 'All') d = d.filter(p => p.standard === standardFilter);
    if (statusFilter !== 'All') d = d.filter(p => p.status === statusFilter);
    return [...d].sort((a, b) => b[sortBy] - a[sortBy]);
  }, [categoryFilter, standardFilter, statusFilter, sortBy]);

  const totalSpend = useMemo(() => PROGRAMMES.reduce((a, p) => a + p.totalSpendMn, 0), []);
  const totalGreenSpend = useMemo(() => PROGRAMMES.reduce((a, p) => a + p.greenSpendMn, 0), []);
  const totalCo2Saved = useMemo(() => PROGRAMMES.reduce((a, p) => a + p.co2SavedT, 0), []);
  const totalSavings = useMemo(() => PROGRAMMES.reduce((a, p) => a + p.costSavingsMn, 0), []);
  const compliantCount = useMemo(() => PROGRAMMES.filter(p => p.status === 'Compliant').length, []);
  const avgGreenPct = useMemo(() => PROGRAMMES.reduce((a, p) => a + p.greenSpendPct, 0) / Math.max(1, PROGRAMMES.length), []);

  const standardBreakdown = useMemo(() => STANDARDS.map(std => {
    const progs = PROGRAMMES.filter(p => p.standard === std);
    const totalGS = progs.reduce((a, p) => a + p.greenSpendMn, 0);
    const avgScore = progs.length ? progs.reduce((a, p) => a + p.certScore, 0) / progs.length : 0;
    const compliant = progs.filter(p => p.status === 'Compliant').length;
    return { standard: std, count: progs.length, totalGS, avgScore, compliantPct: progs.length ? (compliant / progs.length) * 100 : 0 };
  }), []);

  const categoryBreakdown = useMemo(() => CATEGORIES.map(cat => {
    const progs = PROGRAMMES.filter(p => p.category === cat);
    const totalS = progs.reduce((a, p) => a + p.totalSpendMn, 0);
    const totalGS = progs.reduce((a, p) => a + p.greenSpendMn, 0);
    const co2 = progs.reduce((a, p) => a + p.co2SavedT, 0);
    const savings = progs.reduce((a, p) => a + p.costSavingsMn, 0);
    return { cat, count: progs.length, totalS, totalGS, greenPct: totalS > 0 ? (totalGS / totalS) * 100 : 0, co2, savings };
  }), []);

  const savingsAnalysis = useMemo(() => [
    { lever: 'Energy Efficiency in Facilities', saving: Math.round(totalSavings * 0.28 * 100) / 100, co2: Math.round(totalCo2Saved * 0.25) },
    { lever: 'Fleet Electrification', saving: Math.round(totalSavings * 0.22 * 100) / 100, co2: Math.round(totalCo2Saved * 0.20) },
    { lever: 'Sustainable Packaging Switch', saving: Math.round(totalSavings * 0.15 * 100) / 100, co2: Math.round(totalCo2Saved * 0.12) },
    { lever: 'Renewable Energy Procurement', saving: Math.round(totalSavings * 0.20 * 100) / 100, co2: Math.round(totalCo2Saved * 0.30) },
    { lever: 'Circular Economy Materials', saving: Math.round(totalSavings * 0.15 * 100) / 100, co2: Math.round(totalCo2Saved * 0.13) },
  ], [totalSavings, totalCo2Saved]);

  const top10Programmes = useMemo(() => [...PROGRAMMES].sort((a, b) => b.co2SavedT - a.co2SavedT).slice(0, 10), []);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: T.textPri }}>
      <div style={{ background: T.navy, borderBottom: `3px solid ${T.gold}`, padding: '20px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <span style={{ background: T.gold, color: T.navy, fontFamily: T.fontMono, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 3 }}>EP-DN6</span>
          <span style={{ color: T.gold, fontFamily: T.fontMono, fontSize: 11 }}>SUPPLY CHAIN CLIMATE INTELLIGENCE</span>
        </div>
        <h1 style={{ color: '#ffffff', fontSize: 22, fontWeight: 700, margin: 0 }}>Green Procurement Intelligence</h1>
        <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>65 programmes · 8 standards · Spend analytics · CO₂ savings tracking · EU GPP · ISO 14001 · Certification status · Savings calculator</p>
      </div>

      <div style={{ display: 'flex', gap: 12, padding: '16px 32px', background: T.cream, borderBottom: `1px solid ${T.border}`, flexWrap: 'wrap' }}>
        <KpiCard label="Total Procurement Spend" value={`$${(totalSpend / 1000).toFixed(1)}B`} sub="Under sustainability management" color={T.navy} />
        <KpiCard label="Green Spend" value={`$${(totalGreenSpend / 1000).toFixed(1)}B`} sub={`${totalSpend > 0 ? ((totalGreenSpend / totalSpend) * 100).toFixed(1) : 0}% green share`} color={T.green} />
        <KpiCard label="Avg Green Spend %" value={`${avgGreenPct.toFixed(1)}%`} sub="Portfolio average" color={T.teal} />
        <KpiCard label="Total CO₂ Saved" value={`${(totalCo2Saved / 1000).toFixed(0)}k tCO₂e`} sub="Annual savings vs. baseline" color={T.sage} />
        <KpiCard label="Total Cost Savings" value={`$${totalSavings.toFixed(0)}M`} sub="Green premium recoveries" color={T.gold} />
        <KpiCard label="Compliant Programmes" value={`${compliantCount}/${PROGRAMMES.length}`} sub={`${((compliantCount / Math.max(1, PROGRAMMES.length)) * 100).toFixed(0)}% certification rate`} color={T.indigo} />
      </div>

      <div style={{ display: 'flex', gap: 0, padding: '0 32px', background: T.card, borderBottom: `1px solid ${T.border}`, overflowX: 'auto' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{ padding: '12px 16px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: tab === i ? 700 : 400, color: tab === i ? T.navy : T.textSec, borderBottom: tab === i ? `2px solid ${T.navy}` : '2px solid transparent', fontSize: 13, whiteSpace: 'nowrap' }}>{t}</button>
        ))}
      </div>

      <div style={{ padding: '24px 32px' }}>

        {tab === 0 && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              {['All', ...CATEGORIES].map(c => <button key={c} onClick={() => setCategoryFilter(c)} style={{ padding: '5px 12px', border: `1px solid ${categoryFilter === c ? T.green : T.border}`, borderRadius: 20, background: categoryFilter === c ? T.green : T.card, color: categoryFilter === c ? '#fff' : T.textPri, cursor: 'pointer', fontSize: 11 }}>{c}</button>)}
            </div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
              <div style={{ flex: 2, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <div style={{ fontWeight: 700, marginBottom: 12, color: T.navy }}>Green Spend by Category</div>
                {categoryBreakdown.map((cat, i) => (
                  <div key={cat.cat} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600 }}>{cat.cat}</span>
                      <span style={{ fontFamily: T.fontMono, fontSize: 12 }}>{cat.greenPct.toFixed(1)}% green · ${cat.totalGS.toFixed(0)}M of ${cat.totalS.toFixed(0)}M</span>
                    </div>
                    <Bar pct={cat.greenPct} color={[T.green, T.teal, T.blue, T.indigo, T.purple, T.orange, T.sage, T.amber][i]} />
                  </div>
                ))}
              </div>
              <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <div style={{ fontWeight: 700, marginBottom: 12, color: T.navy }}>Programme Status</div>
                {STATUS.map((s, i) => {
                  const cnt = PROGRAMMES.filter(p => p.status === s).length;
                  const colors = [T.green, T.amber, T.red, T.blue, T.textSec];
                  return (
                    <div key={s} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                        <span style={{ color: colors[i] }}>{s}</span>
                        <span style={{ fontFamily: T.fontMono, fontSize: 12 }}>{cnt} · {((cnt / Math.max(1, PROGRAMMES.length)) * 100).toFixed(0)}%</span>
                      </div>
                      <Bar pct={(cnt / Math.max(1, PROGRAMMES.length)) * 100} color={colors[i]} />
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontWeight: 700, marginBottom: 12, color: T.navy }}>Top Programmes by Green Spend % — {filtered.length} programmes</div>
              <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Programme', 'Category', 'Standard', 'Total Spend $M', 'Green Spend $M', 'Green %', 'CO₂ Saved t', 'Status'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: T.textSec, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 20).map((p, i) => (
                    <tr key={p.id} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '8px 10px', fontWeight: 600 }}>{p.name}</td>
                      <td style={{ padding: '8px 10px', fontSize: 11, color: T.textSec }}>{p.category}</td>
                      <td style={{ padding: '8px 10px', fontSize: 11 }}>{p.standard}</td>
                      <td style={{ padding: '8px 10px', fontFamily: T.fontMono, fontSize: 12 }}>{p.totalSpendMn.toFixed(1)}</td>
                      <td style={{ padding: '8px 10px', fontFamily: T.fontMono, fontSize: 12, color: T.green, fontWeight: 700 }}>{p.greenSpendMn.toFixed(1)}</td>
                      <td style={{ padding: '8px 10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 40 }}><Bar pct={p.greenSpendPct} color={p.greenSpendPct >= 70 ? T.green : p.greenSpendPct >= 40 ? T.amber : T.red} /></div>
                          <span style={{ fontFamily: T.fontMono, fontSize: 11, color: p.greenSpendPct >= 70 ? T.green : p.greenSpendPct >= 40 ? T.amber : T.red, fontWeight: 700 }}>{p.greenSpendPct.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '8px 10px', fontFamily: T.fontMono, fontSize: 12, color: T.teal }}>{p.co2SavedT.toLocaleString()}</td>
                      <td style={{ padding: '8px 10px' }}><StatusBadge status={p.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 1 && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              {['All', ...STANDARDS].map(s => <button key={s} onClick={() => setStandardFilter(s)} style={{ padding: '5px 12px', border: `1px solid ${standardFilter === s ? T.indigo : T.border}`, borderRadius: 20, background: standardFilter === s ? T.indigo : T.card, color: standardFilter === s ? '#fff' : T.textPri, cursor: 'pointer', fontSize: 11 }}>{s}</button>)}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontWeight: 700, marginBottom: 12, color: T.navy }}>Standards Compliance — 8 Green Standards</div>
              <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Standard', 'Programmes', 'Green Spend $M', 'Avg Cert Score', 'Compliance Rate', 'Scope', 'Status'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: T.textSec, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...standardBreakdown].sort((a, b) => b.compliantPct - a.compliantPct).map((std, i) => (
                    <tr key={std.standard} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>{std.standard}</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>{std.count}</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.fontMono, color: T.green, fontWeight: 700 }}>{std.totalGS.toFixed(0)}</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.fontMono, color: std.avgScore >= 70 ? T.green : T.amber, fontWeight: 700 }}>{std.avgScore.toFixed(1)}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 50 }}><Bar pct={std.compliantPct} color={std.compliantPct >= 70 ? T.green : std.compliantPct >= 40 ? T.amber : T.red} /></div>
                          <span style={{ fontFamily: T.fontMono, fontSize: 11 }}>{std.compliantPct.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '8px 12px', fontSize: 11, color: T.textSec }}>{std.standard === 'EU GPP' ? 'EU Public Procurement' : std.standard === 'ISO 14001' ? 'Environmental Mgmt' : std.standard === 'EMAS' ? 'EU Eco-Management' : 'Global'}</td>
                      <td style={{ padding: '8px 12px' }}><span style={{ background: std.compliantPct >= 70 ? `${T.green}20` : std.compliantPct >= 40 ? `${T.amber}20` : `${T.red}20`, color: std.compliantPct >= 70 ? T.green : std.compliantPct >= 40 ? T.amber : T.red, padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600 }}>{std.compliantPct >= 70 ? 'Leader' : std.compliantPct >= 40 ? 'Progress' : 'Laggard'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 2 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 12, color: T.navy }}>Green Spend Analytics — Category Breakdown</div>
              {categoryBreakdown.map((cat, i) => (
                <div key={cat.cat} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600 }}>{cat.cat}</span>
                    <span style={{ fontFamily: T.fontMono, fontSize: 12 }}>Green: ${cat.totalGS.toFixed(0)}M · Total: ${cat.totalS.toFixed(0)}M · CO₂: {(cat.co2 / 1000).toFixed(0)}k t · Savings: ${cat.savings.toFixed(0)}M</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <div style={{ flex: cat.totalGS }}><Bar pct={100} color={T.green} /></div>
                    <div style={{ flex: cat.totalS - cat.totalGS }}><Bar pct={100} color={T.borderL} /></div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontWeight: 700, marginBottom: 12, color: T.navy }}>Top 10 by Green Spend Volume</div>
              <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Programme', 'Category', 'Green Spend $M', 'Green %', 'Savings $M', 'Payback Yrs'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: T.textSec, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...PROGRAMMES].sort((a, b) => b.greenSpendMn - a.greenSpendMn).slice(0, 10).map((p, i) => (
                    <tr key={p.id} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>{p.name}</td>
                      <td style={{ padding: '8px 12px', fontSize: 11, color: T.textSec }}>{p.category}</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.fontMono, color: T.green, fontWeight: 700 }}>${p.greenSpendMn.toFixed(1)}</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>{p.greenSpendPct.toFixed(0)}%</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.fontMono, color: T.gold }}>${p.costSavingsMn.toFixed(2)}M</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.fontMono, color: p.paybackYears <= 3 ? T.green : T.amber }}>{p.paybackYears.toFixed(1)} yrs</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 3 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 12, color: T.navy }}>CO₂ Savings by Programme</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                {[
                  { label: 'Total CO₂ Saved', value: `${(totalCo2Saved / 1000).toFixed(0)}k tCO₂e`, color: T.green },
                  { label: 'Renewable Energy %', value: `${(PROGRAMMES.reduce((a, p) => a + p.renewableEnergyPct, 0) / Math.max(1, PROGRAMMES.length)).toFixed(0)}%`, color: T.teal },
                  { label: 'Waste Reduction', value: `${(PROGRAMMES.reduce((a, p) => a + p.wasteReductionPct, 0) / Math.max(1, PROGRAMMES.length)).toFixed(0)}%`, color: T.sage },
                  { label: 'Water Savings', value: `${(PROGRAMMES.reduce((a, p) => a + p.waterSavingM3, 0) / 1000).toFixed(0)}k m³`, color: T.blue },
                  { label: 'Top CO₂ Programme', value: `${(top10Programmes[0]?.co2SavedT / 1000).toFixed(1)}k t`, color: T.orange },
                  { label: 'Avg CO₂ Saving/Prog', value: `${(totalCo2Saved / Math.max(1, PROGRAMMES.length)).toFixed(0)} t`, color: T.indigo },
                ].map(m => (
                  <div key={m.label} style={{ background: T.sub, borderRadius: 8, padding: 14 }}>
                    <div style={{ fontSize: 11, color: T.textSec }}>{m.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: m.color, fontFamily: T.fontMono }}>{m.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontWeight: 700, marginBottom: 12, color: T.navy }}>Top 10 Programmes by CO₂ Savings</div>
              {top10Programmes.map((p, i) => (
                <div key={p.id} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600 }}>{p.name} — {p.category}</span>
                    <span style={{ fontFamily: T.fontMono, fontSize: 12, color: T.teal, fontWeight: 700 }}>{p.co2SavedT.toLocaleString()} tCO₂e saved</span>
                  </div>
                  <Bar pct={(p.co2SavedT / Math.max(1, top10Programmes[0]?.co2SavedT)) * 100} color={T.green} />
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 4 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 12, color: T.navy }}>Certification Tracker — All 65 Programmes</div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              {['All', ...STATUS].map(s => <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: '5px 12px', border: `1px solid ${statusFilter === s ? T.navy : T.border}`, borderRadius: 20, background: statusFilter === s ? T.navy : T.card, color: statusFilter === s ? '#fff' : T.textPri, cursor: 'pointer', fontSize: 11 }}>{s}</button>)}
            </div>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Programme', 'Standard', 'Cert Score', 'Status', 'Category', 'Region', 'Renewable %', 'Suppliers'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: T.textSec, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 25).map((p, i) => (
                  <tr key={p.id} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                    <td style={{ padding: '8px 10px', fontWeight: 600 }}>{p.name}</td>
                    <td style={{ padding: '8px 10px', fontSize: 11 }}>{p.standard}</td>
                    <td style={{ padding: '8px 10px', fontFamily: T.fontMono, color: p.certScore >= 70 ? T.green : p.certScore >= 50 ? T.amber : T.red, fontWeight: 700 }}>{p.certScore.toFixed(1)}</td>
                    <td style={{ padding: '8px 10px' }}><StatusBadge status={p.status} /></td>
                    <td style={{ padding: '8px 10px', fontSize: 11, color: T.textSec }}>{p.category}</td>
                    <td style={{ padding: '8px 10px', fontSize: 11 }}>{p.region}</td>
                    <td style={{ padding: '8px 10px', fontFamily: T.fontMono, fontSize: 11, color: p.renewableEnergyPct >= 70 ? T.green : T.amber }}>{p.renewableEnergyPct.toFixed(0)}%</td>
                    <td style={{ padding: '8px 10px', fontFamily: T.fontMono, fontSize: 11 }}>{p.supplierCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 5 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 12, color: T.navy }}>Supplier Engagement in Green Procurement</div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
              {[
                { label: 'Total Engaged Suppliers', value: PROGRAMMES.reduce((a, p) => a + p.supplierCount, 0), color: T.navy },
                { label: 'Avg per Programme', value: (PROGRAMMES.reduce((a, p) => a + p.supplierCount, 0) / Math.max(1, PROGRAMMES.length)).toFixed(0), color: T.teal },
                { label: 'ISO 14001 Suppliers', value: PROGRAMMES.filter(p => p.standard === 'ISO 14001').reduce((a, p) => a + p.supplierCount, 0), color: T.green },
                { label: 'EU GPP Suppliers', value: PROGRAMMES.filter(p => p.standard === 'EU GPP').reduce((a, p) => a + p.supplierCount, 0), color: T.blue },
              ].map(m => (
                <div key={m.label} style={{ flex: 1, background: T.sub, borderRadius: 8, padding: 16 }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: m.color, fontFamily: T.fontMono }}>{m.value}</div>
                  <div style={{ fontSize: 12, color: T.textSec }}>{m.label}</div>
                </div>
              ))}
            </div>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Programme', 'Standard', 'Suppliers', 'Green %', 'Waste Red.', 'Water Saved m³', 'Cost Savings $M'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: T.textSec, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...PROGRAMMES].sort((a, b) => b.supplierCount - a.supplierCount).slice(0, 20).map((p, i) => (
                  <tr key={p.id} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                    <td style={{ padding: '8px 12px', fontWeight: 600 }}>{p.name}</td>
                    <td style={{ padding: '8px 12px', fontSize: 11 }}>{p.standard}</td>
                    <td style={{ padding: '8px 12px', fontFamily: T.fontMono, fontWeight: 700 }}>{p.supplierCount}</td>
                    <td style={{ padding: '8px 12px', fontFamily: T.fontMono, color: T.green }}>{p.greenSpendPct.toFixed(0)}%</td>
                    <td style={{ padding: '8px 12px', fontFamily: T.fontMono, color: T.teal }}>{p.wasteReductionPct.toFixed(0)}%</td>
                    <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>{p.waterSavingM3.toLocaleString()}</td>
                    <td style={{ padding: '8px 12px', fontFamily: T.fontMono, color: T.gold }}>${p.costSavingsMn.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 6 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 16, color: T.navy }}>Green Procurement Savings Calculator</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 20 }}>
              {savingsAnalysis.map((lever, i) => (
                <div key={lever.lever} style={{ background: T.sub, borderRadius: 8, padding: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: T.navy }}>{lever.lever}</div>
                  <div style={{ display: 'flex', gap: 20 }}>
                    <div>
                      <div style={{ fontSize: 11, color: T.textSec }}>Cost Savings</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: T.gold, fontFamily: T.fontMono }}>${lever.saving.toFixed(1)}M</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: T.textSec }}>CO₂ Avoided</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: T.green, fontFamily: T.fontMono }}>{(lever.co2 / 1000).toFixed(0)}k t</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: T.textSec }}>$ per tCO₂</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: T.teal, fontFamily: T.fontMono }}>${lever.co2 > 0 ? ((lever.saving * 1000000) / lever.co2).toFixed(0) : 0}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: `${T.green}10`, border: `1px solid ${T.green}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontWeight: 700, color: T.green, marginBottom: 12 }}>Total Portfolio Savings Opportunity</div>
              <div style={{ display: 'flex', gap: 20 }}>
                <div><div style={{ fontSize: 11, color: T.textSec }}>Total Annual Savings</div><div style={{ fontSize: 28, fontWeight: 700, color: T.green, fontFamily: T.fontMono }}>${totalSavings.toFixed(0)}M</div></div>
                <div><div style={{ fontSize: 11, color: T.textSec }}>Total CO₂ Avoided</div><div style={{ fontSize: 28, fontWeight: 700, color: T.teal, fontFamily: T.fontMono }}>{(totalCo2Saved / 1000).toFixed(0)}k tCO₂e</div></div>
                <div><div style={{ fontSize: 11, color: T.textSec }}>Green Spend Target (80%)</div><div style={{ fontSize: 28, fontWeight: 700, color: T.navy, fontFamily: T.fontMono }}>${(totalSpend * 0.8).toFixed(0)}M</div></div>
                <div><div style={{ fontSize: 11, color: T.textSec }}>Uplift Required</div><div style={{ fontSize: 28, fontWeight: 700, color: T.amber, fontFamily: T.fontMono }}>${Math.max(0, totalSpend * 0.8 - totalGreenSpend).toFixed(0)}M</div></div>
              </div>
            </div>
          </div>
        )}

        {tab === 7 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 16, color: T.navy }}>Green Procurement Reporting — CSRD / GRI 308/414</div>
            {[
              { metric: 'Green Spend % of Total', value: `${totalSpend > 0 ? ((totalGreenSpend / totalSpend) * 100).toFixed(1) : 0}%`, standard: 'GRI 308, GRI 414', status: 'Reported' },
              { metric: 'Scope 3 Cat 1 Reduction', value: `${(PROGRAMMES.reduce((a, p) => a + p.co2SavedT, 0) / 1000).toFixed(0)}k tCO₂e`, standard: 'GHG Protocol Cat. 1', status: 'Reported' },
              { metric: 'Certified Suppliers (%)', value: `${((compliantCount / Math.max(1, PROGRAMMES.length)) * 100).toFixed(0)}%`, standard: 'ISO 14001 / EMAS', status: 'Partial' },
              { metric: 'Water Reduction', value: `${(PROGRAMMES.reduce((a, p) => a + p.waterSavingM3, 0) / 1000).toFixed(0)}k m³`, standard: 'GRI 303', status: 'Reported' },
              { metric: 'Waste Diversion Rate', value: `${(PROGRAMMES.reduce((a, p) => a + p.wasteReductionPct, 0) / Math.max(1, PROGRAMMES.length)).toFixed(0)}%`, standard: 'GRI 306', status: 'Reported' },
              { metric: 'Renewable Energy in Supply', value: `${(PROGRAMMES.reduce((a, p) => a + p.renewableEnergyPct, 0) / Math.max(1, PROGRAMMES.length)).toFixed(0)}%`, standard: 'GRI 302-2', status: 'In Progress' },
              { metric: 'EU GPP Compliance Rate', value: `${standardBreakdown.find(s => s.standard === 'EU GPP')?.compliantPct.toFixed(0) || 0}%`, standard: 'EU GPP 2023 Criteria', status: 'Partial' },
            ].map((row, i) => (
              <div key={row.metric} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${T.borderL}` }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{row.metric}</div>
                  <div style={{ fontSize: 11, color: T.textSec }}>{row.standard}</div>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ fontFamily: T.fontMono, fontWeight: 700, fontSize: 14 }}>{row.value}</span>
                  <span style={{ background: row.status === 'Reported' ? `${T.green}20` : row.status === 'Partial' ? `${T.amber}20` : `${T.blue}20`, color: row.status === 'Reported' ? T.green : row.status === 'Partial' ? T.amber : T.blue, padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600 }}>{row.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
