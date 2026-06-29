import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const SDR_LABELS = [
  { id: 'focus', name: 'Sustainability Focus', description: 'Invests in assets with positive sustainability characteristics', products: 142, aum: 38200, consumers: false, disclosure: 'Full' },
  { id: 'improvers', name: 'Sustainability Improvers', description: 'Invests in assets with potential to improve sustainability over time', products: 87, aum: 22800, consumers: false, disclosure: 'Full' },
  { id: 'impact', name: 'Sustainability Impact', description: 'Aims to achieve a positive, measurable sustainability outcome', products: 54, aum: 15600, consumers: true, disclosure: 'Enhanced' },
  { id: 'mixed', name: 'Mixed Goals', description: 'Has both financial and sustainability goals but no label required', products: 312, aum: 84500, consumers: false, disclosure: 'Basic' },
];

const PROVIDERS = ['BlackRock','Schroders','LGIM','Aviva','abrdn','M&G','Fidelity','Jupiter','HSBC AM','Invesco','Vanguard','Baillie Gifford'];

const PRODUCTS = Array.from({ length: 30 }, (_, i) => ({
  name: `${PROVIDERS[i % PROVIDERS.length]} ${['Global Equity','UK Equity','Climate','ESG','Responsible','Sustainable','Impact','Green'][i % 8]} Fund`,
  provider: PROVIDERS[i % PROVIDERS.length],
  label: SDR_LABELS[i % 4].id,
  aum: +(sr(i * 7) * 4000 + 200).toFixed(0),
  greenwashRisk: +(sr(i * 11) * 40 + 15).toFixed(1),
  disclosure: ['Full','Full','Enhanced','Basic'][i % 4],
  entityObjective: ['Sustainability Focus','Sustainability Improvers','Sustainability Impact','No Label'][i % 4],
  consumerFacing: i % 5 === 0,
  complianceScore: +(sr(i * 23) * 30 + 60).toFixed(1),
  lastReview: `Q${(i % 4) + 1} 2024`,
}));

const GREENWASH_FLAGS = [
  { category: 'Vague Sustainability Claims', count: 48, severity: 'High', examples: 'ESG-integrated, sustainability-aware, responsible' },
  { category: 'Misleading Product Names', count: 31, severity: 'High', examples: '"Green", "Clean", "Eco" without substantiation' },
  { category: 'Inconsistent Disclosure', count: 62, severity: 'Medium', examples: 'Portfolio vs product-level data misalignment' },
  { category: 'Missing KPI Targets', count: 89, severity: 'Medium', examples: 'No quantified sustainability objectives' },
  { category: 'Outdated Benchmarks', count: 27, severity: 'Low', examples: 'Comparison to non-comparable indices' },
  { category: 'Scope 3 Omissions', count: 54, severity: 'High', examples: 'Only Scope 1+2 reported; S3 material but absent' },
];

const YEARS = [2021, 2022, 2023, 2024, 2025];
const adoptionTrend = YEARS.map((yr, i) => ({
  year: yr, focus: +(80 + i * 18 + sr(i * 7) * 10).toFixed(0),
  improvers: +(45 + i * 12 + sr(i * 11) * 8).toFixed(0),
  impact: +(28 + i * 8 + sr(i * 17) * 6).toFixed(0),
}));

const T = { bg: '#0f1117', surface: '#1a1d2e', surfaceH: '#252840', border: '#2e3148',
  navy: '#3b4fd8', navyL: '#5a6de8', gold: '#d4a017', goldL: '#e8b830', sage: '#2d7a4f',
  sageL: '#3a9962', teal: '#0d9488', text: '#e8eaf0', textSec: '#9ca3af', textMut: '#6b7280',
  red: '#ef4444', green: '#22c55e', amber: '#f59e0b', font: "'Inter','sans-serif'", mono: "'JetBrains Mono','monospace'" };

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 20px' }}>
    <div style={{ fontSize: 11, color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: color || T.text, fontFamily: T.mono }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>{sub}</div>}
  </div>
);

const TABS = ['Overview', 'Labels', 'Anti-Greenwashing', 'Product Portfolio', 'Disclosure Tracker', 'Comparatives', 'Compliance'];
const card = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, marginBottom: 20 };
const h2 = { fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 16, marginTop: 0 };
const grid = (cols) => ({ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16, marginBottom: 24 });
const select = { background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6, color: T.text, padding: '6px 10px', fontSize: 12 };
const sevColor = (s) => ({ High: T.red, Medium: T.amber, Low: T.gold }[s] || T.textSec);
const labelColor = { focus: T.teal, improvers: T.green, impact: T.navy, mixed: T.textSec };

export default function UkSdrPage() {
  const [tab, setTab] = useState('Overview');
  const [provider, setProvider] = useState('All');
  const [label, setLabel] = useState('All');

  const filteredProducts = useMemo(() => PRODUCTS.filter(p =>
    (provider === 'All' || p.provider === provider) &&
    (label === 'All' || p.label === label)
  ), [provider, label]);

  const labelBarData = useMemo(() => SDR_LABELS.map(l => ({
    name: l.name.split(' ').slice(-1)[0], products: l.products, aum: +(l.aum / 1000).toFixed(1),
  })), []);

  const gwData = useMemo(() => GREENWASH_FLAGS.map(f => ({
    name: f.category.split(' ').slice(0, 2).join(' '), count: f.count,
  })), []);

  const tabBar = { display: 'flex', gap: 4, marginBottom: 28, borderBottom: `1px solid ${T.border}` };
  const tabBtn = (active) => ({ padding: '10px 18px', fontSize: 13, fontWeight: active ? 600 : 400,
    color: active ? T.navyL : T.textSec, borderBottom: active ? `2px solid ${T.navyL}` : '2px solid transparent',
    cursor: 'pointer', background: 'none', border: 'none', marginBottom: -1 });

  return (
    <div style={{ background: T.bg, minHeight: '100vh', color: T.text, fontFamily: T.font, padding: '24px 32px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>UK SDR &amp; Investment Labels</h1>
        <p style={{ margin: 0, color: T.textSec, fontSize: 13 }}>FCA Sustainability Disclosure Requirements — label assessment, anti-greenwashing compliance &amp; product disclosure tracker</p>
      </div>
      <div style={tabBar}>{TABS.map(t => <button key={t} style={tabBtn(tab === t)} onClick={() => setTab(t)}>{t}</button>)}</div>

      {tab === 'Overview' && (
        <>
          <div style={grid(4)}>
            <KpiCard label="SDR Labels" value={SDR_LABELS.filter(l => l.id !== 'mixed').length} sub="Active sustainability labels" color={T.navy} />
            <KpiCard label="Labelled Products" value={SDR_LABELS.filter(l => l.id !== 'mixed').reduce((a, l) => a + l.products, 0)} sub="Total SDR-labelled funds" color={T.green} />
            <KpiCard label="Labelled AUM" value={`£${(SDR_LABELS.filter(l => l.id !== 'mixed').reduce((a, l) => a + l.aum, 0) / 1000).toFixed(0)}Bn`} sub="Across all 3 label categories" color={T.gold} />
            <KpiCard label="Anti-Greenwash" value="Jul 2024" sub="UK anti-greenwashing rule in force" color={T.amber} />
          </div>
          <div style={card}>
            <h2 style={h2}>SDR Label Adoption — Products &amp; AUM</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={labelBarData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 8 }} />
                <Legend />
                <Bar yAxisId="left" dataKey="products" name="Products" fill={T.navy} radius={[3, 3, 0, 0]} />
                <Bar yAxisId="right" dataKey="aum" name="AUM (£Bn)" fill={T.teal} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <h2 style={h2}>SDR Label Adoption Trend</h2>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={adoptionTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 8 }} />
                <Legend />
                <Line type="monotone" dataKey="focus" name="Focus (products)" stroke={T.teal} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="improvers" name="Improvers (products)" stroke={T.green} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="impact" name="Impact (products)" stroke={T.navy} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {tab === 'Labels' && (
        <>
          <div style={grid(3)}>
            {SDR_LABELS.filter(l => l.id !== 'mixed').map(l => (
              <div key={l.id} style={{ ...card, marginBottom: 0, border: `1px solid ${labelColor[l.id]}44` }}>
                <div style={{ fontWeight: 700, color: labelColor[l.id], fontSize: 14, marginBottom: 8 }}>{l.name}</div>
                <div style={{ fontSize: 12, color: T.textSec, marginBottom: 12 }}>{l.description}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[{ label: 'Products', val: l.products, color: T.navy },
                    { label: 'AUM', val: `£${(l.aum / 1000).toFixed(1)}Bn`, color: T.gold },
                    { label: 'Consumer-Facing', val: l.consumers ? 'Required' : 'No', color: l.consumers ? T.amber : T.textSec },
                    { label: 'Disclosure', val: l.disclosure, color: T.teal }].map(m => (
                    <div key={m.label} style={{ background: T.surfaceH, borderRadius: 6, padding: '8px 10px' }}>
                      <div style={{ fontSize: 9, color: T.textMut }}>{m.label}</div>
                      <div style={{ fontFamily: T.mono, fontWeight: 700, color: m.color, fontSize: 14 }}>{m.val}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={card}>
            <h2 style={h2}>SDR Label Requirements Comparison</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead><tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {['Label','Sustainability Objective','Consumer Labels','Ongoing Monitoring','Reporting','Disclosures'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '5px 8px', color: T.textMut, fontWeight: 500 }}>{h}</th>
                ))}</tr></thead>
              <tbody>{[
                { label: 'Sustainability Focus', obj: 'Positive characteristics', consumer: 'Not required', monitor: 'Annual', report: 'Annual', disc: 'Product + entity' },
                { label: 'Sustainability Improvers', obj: 'Improvement trajectory', consumer: 'Not required', monitor: 'Annual', report: 'Annual', disc: 'Product + entity' },
                { label: 'Sustainability Impact', obj: 'Measurable outcomes', consumer: 'Required', monitor: 'Quarterly', report: 'Semi-annual', disc: 'Product + entity + investor' },
              ].map(r => (
                <tr key={r.label} style={{ borderBottom: `1px solid ${T.border}22` }}>
                  {Object.values(r).map((v, i) => (
                    <td key={i} style={{ padding: '5px 8px', color: i === 0 ? T.text : T.textSec, fontWeight: i === 0 ? 600 : 400, fontSize: i === 0 ? 11 : 10 }}>{v}</td>
                  ))}
                </tr>
              ))}</tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'Anti-Greenwashing' && (
        <>
          <div style={grid(4)}>
            <KpiCard label="Flags Identified" value={GREENWASH_FLAGS.reduce((a, f) => a + f.count, 0)} sub="Across monitored products" color={T.red} />
            <KpiCard label="High Severity" value={GREENWASH_FLAGS.filter(f => f.severity === 'High').length} sub="Flag categories rated critical" color={T.red} />
            <KpiCard label="FCA Rule In Force" value="Jul 2024" sub="Anti-greenwashing rule deadline" color={T.amber} />
            <KpiCard label="FCA Cases Open" value="12" sub="Enforcement investigations 2024" color={T.navy} />
          </div>
          <div style={card}>
            <h2 style={h2}>Greenwashing Risk Flags by Category</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={gwData} layout="vertical" margin={{ left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: T.textSec }} width={100} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 8 }} />
                <Bar dataKey="count" name="Flag Count" fill={T.red} radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <h2 style={h2}>Greenwashing Flag Detail</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead><tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {['Category','Count','Severity','Common Examples'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '5px 8px', color: T.textMut, fontWeight: 500 }}>{h}</th>
                ))}</tr></thead>
              <tbody>{GREENWASH_FLAGS.map(f => (
                <tr key={f.category} style={{ borderBottom: `1px solid ${T.border}22` }}>
                  <td style={{ padding: '5px 8px', color: T.text, fontWeight: 500 }}>{f.category}</td>
                  <td style={{ padding: '5px 8px', fontFamily: T.mono, color: T.red }}>{f.count}</td>
                  <td style={{ padding: '5px 8px', color: sevColor(f.severity), fontWeight: 600 }}>{f.severity}</td>
                  <td style={{ padding: '5px 8px', color: T.textSec, fontSize: 10 }}>{f.examples}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'Product Portfolio' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <label style={{ fontSize: 12, color: T.textSec }}>Provider:</label>
              <select style={select} value={provider} onChange={e => setProvider(e.target.value)}>
                {['All', ...PROVIDERS].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <label style={{ fontSize: 12, color: T.textSec }}>Label:</label>
              <select style={select} value={label} onChange={e => setLabel(e.target.value)}>
                <option value="All">All</option>
                {SDR_LABELS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
          </div>
          <div style={grid(3)}>
            <KpiCard label="Products" value={filteredProducts.length} sub="After filters" color={T.navy} />
            <KpiCard label="Total AUM" value={`£${(filteredProducts.reduce((a, p) => a + +p.aum, 0) / 1000).toFixed(1)}Bn`} sub="Filtered product AUM" color={T.gold} />
            <KpiCard label="Avg Greenwash Risk" value={filteredProducts.length > 0 ? `${(filteredProducts.reduce((a, p) => a + p.greenwashRisk, 0) / filteredProducts.length).toFixed(1)}` : '–'} sub="Proprietary risk score (0–100)" color={T.red} />
          </div>
          <div style={card}>
            <h2 style={h2}>Product Portfolio</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead><tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {['Product','Provider','Label','AUM (£M)','Greenwash Risk','Disclosure','Compliance','Last Review'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '5px 8px', color: T.textMut, fontWeight: 500 }}>{h}</th>
                  ))}</tr></thead>
                <tbody>{filteredProducts.map(p => (
                  <tr key={p.name} style={{ borderBottom: `1px solid ${T.border}22` }}>
                    <td style={{ padding: '5px 8px', color: T.text, fontWeight: 500, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</td>
                    <td style={{ padding: '5px 8px', color: T.textSec }}>{p.provider}</td>
                    <td style={{ padding: '5px 8px', color: labelColor[p.label] || T.textSec, fontSize: 10 }}>{SDR_LABELS.find(l => l.id === p.label)?.name.split(' ').slice(-1)[0]}</td>
                    <td style={{ padding: '5px 8px', fontFamily: T.mono, color: T.navy }}>{(+p.aum).toLocaleString()}</td>
                    <td style={{ padding: '5px 8px', fontFamily: T.mono, color: p.greenwashRisk > 35 ? T.red : T.amber }}>{p.greenwashRisk}</td>
                    <td style={{ padding: '5px 8px', color: T.textSec, fontSize: 10 }}>{p.disclosure}</td>
                    <td style={{ padding: '5px 8px', fontFamily: T.mono, color: p.complianceScore >= 80 ? T.green : T.amber }}>{p.complianceScore}</td>
                    <td style={{ padding: '5px 8px', color: T.textSec }}>{p.lastReview}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === 'Disclosure Tracker' && (
        <>
          <div style={grid(4)}>
            <KpiCard label="Entity-Level Disclosures" value="Full" sub="Required for all FCA-authorised firms" color={T.navy} />
            <KpiCard label="Product-Level Disclosures" value="Tiered" sub="Varies by label & consumer-facing status" color={T.teal} />
            <KpiCard label="Deadline (FY2024)" value="May 2025" sub="First annual SDR report due" color={T.amber} />
            <KpiCard label="Compliance Rate" value={`${(PRODUCTS.filter(p => p.complianceScore >= 70).length / PRODUCTS.length * 100).toFixed(0)}%`} sub="Products meeting disclosure threshold" color={T.green} />
          </div>
          <div style={card}>
            <h2 style={h2}>Disclosure Requirements by Label Type</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { level: 'Entity-Level Disclosures', icon: '🏢', items: ['Annual sustainability report','Governance structure for sustainability','Sustainability risk management framework','Engagement and stewardship policies','Summary of products with labels'], required: 'All FCA firms' },
                { level: 'Product-Level (Focus/Improvers)', icon: '📋', items: ['Sustainability objective statement','Investment strategy aligned to objective','KPIs and progress reporting','Pre-contractual disclosure','Annual report on sustainability'], required: 'Labelled products' },
                { level: 'Product-Level (Impact)', icon: '📊', items: ['Theory of change documentation','Quantified impact targets','Additionality evidence','Investor-level disclosure','Quarterly impact reports'], required: 'Impact label only' },
                { level: 'Consumer-Facing Disclosures', icon: '👤', items: ['Two-page summary document','Plain language description','Key risks disclosure','Fund costs and charges','Comparison against benchmark'], required: 'Impact label only' },
              ].map(d => (
                <div key={d.level} style={{ background: T.surfaceH, borderRadius: 8, padding: 14 }}>
                  <div style={{ fontWeight: 600, color: T.navy, fontSize: 12, marginBottom: 4 }}>{d.icon} {d.level}</div>
                  <div style={{ fontSize: 10, color: T.amber, marginBottom: 8 }}>Required for: {d.required}</div>
                  {d.items.map(item => <div key={item} style={{ fontSize: 10, color: T.textSec, marginBottom: 3 }}>• {item}</div>)}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {tab === 'Comparatives' && (
        <>
          <div style={grid(4)}>
            <KpiCard label="EU SFDR Art. 9" value="~€320Bn" sub="Article 9 AUM vs UK SDR Impact" color={T.navy} />
            <KpiCard label="UK SDR Impact AUM" value="£15.6Bn" sub="vs EU's ~€320Bn Article 9" color={T.teal} />
            <KpiCard label="Reg. Divergence" value="High" sub="UK post-Brexit approach vs EU SFDR" color={T.amber} />
            <KpiCard label="IOSCO Aligned" value="Partial" sub="UK SDR partially aligns IOSCO principles" color={T.green} />
          </div>
          <div style={card}>
            <h2 style={h2}>UK SDR vs EU SFDR vs SEC Climate — Regulatory Comparison</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead><tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {['Feature','UK SDR','EU SFDR','SEC Climate Rule','US ESG Disclosure'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '6px 8px', color: T.textMut, fontWeight: 500 }}>{h}</th>
                ))}</tr></thead>
              <tbody>{[
                { feature: 'Label System', uk: '3 mandatory labels', eu: 'Art 6/8/9 classification', sec: 'No labels', us: 'Integration disclosure' },
                { feature: 'Anti-Greenwashing', uk: 'FCA rule (Jul 2024)', eu: 'Greenwashing guidance', sec: 'Names rule', us: 'ESG fund names' },
                { feature: 'Entity Disclosure', uk: 'Required all FCA firms', eu: 'Required SFDR firms', sec: 'Climate risk (firms)', us: 'Proposed' },
                { feature: 'Product Disclosure', uk: 'Tiered by label', eu: 'Template (Annexes II/III)', sec: 'Fund-level ESG', us: 'Fund ESG strategy' },
                { feature: 'Consumer Protection', uk: 'Consumer duty aligned', eu: 'Retail investor focus', sec: 'Investor protection', us: 'Retail focus' },
                { feature: 'Third-Party Verification', uk: 'Encouraged', eu: 'Not mandatory', sec: 'Not required', us: 'Not required' },
              ].map(r => (
                <tr key={r.feature} style={{ borderBottom: `1px solid ${T.border}22` }}>
                  <td style={{ padding: '5px 8px', color: T.text, fontWeight: 600 }}>{r.feature}</td>
                  <td style={{ padding: '5px 8px', color: T.teal }}>{r.uk}</td>
                  <td style={{ padding: '5px 8px', color: T.navy }}>{r.eu}</td>
                  <td style={{ padding: '5px 8px', color: T.amber }}>{r.sec}</td>
                  <td style={{ padding: '5px 8px', color: T.textSec }}>{r.us}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'Compliance' && (
        <>
          <div style={grid(4)}>
            <KpiCard label="FCA SDR Phases" value="3" sub="Phase 1 (labels): Jul 2024; Phase 2: Dec 2024" color={T.navy} />
            <KpiCard label="Compliance Rate" value={`${(PRODUCTS.filter(p => p.complianceScore >= 70).length / PRODUCTS.length * 100).toFixed(0)}%`} sub="Products meeting threshold" color={T.green} />
            <KpiCard label="At Risk" value={PRODUCTS.filter(p => p.complianceScore < 60).length} sub="Products below compliance threshold" color={T.red} />
            <KpiCard label="Enforcement" value="Active" sub="FCA anti-greenwashing enforcement live" color={T.amber} />
          </div>
          <div style={card}>
            <h2 style={h2}>SDR Implementation Timeline</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                { phase: 'Phase 1', date: 'May 2024', focus: 'Anti-greenwashing rule', detail: 'All FCA-authorised firms must ensure sustainability claims are clear, fair, and not misleading', status: 'In Force', color: T.red },
                { phase: 'Phase 2', date: 'Jul 2024', focus: 'Investment Labels', detail: 'Managers may voluntarily use the 3 SDR labels with required disclosures', status: 'In Force', color: T.green },
                { phase: 'Phase 3', date: 'Dec 2024', focus: 'Product Disclosures', detail: 'Pre-contractual, ongoing product-level and consumer-facing disclosures required', status: 'In Force', color: T.teal },
                { phase: 'Phase 4', date: 'Dec 2025', focus: 'Distributor Requirements', detail: 'Distributors must make SDR labels and disclosures available to retail clients', status: 'Upcoming', color: T.amber },
                { phase: 'Phase 5', date: 'Ongoing', focus: 'FCA Review', detail: 'FCA conducting post-implementation review; possible TCFD alignment update', status: 'Planned', color: T.navy },
                { phase: 'Phase 6', date: 'TBD', focus: 'Overseas Funds', detail: 'Extension to overseas funds recognized under FSMA to align with domestic requirements', status: 'Consultation', color: T.gold },
              ].map(p => (
                <div key={p.phase} style={{ background: T.surfaceH, borderRadius: 8, padding: 12, border: `1px solid ${p.color}44` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, color: p.color, fontSize: 12 }}>{p.phase}</span>
                    <span style={{ fontSize: 10, color: T.textSec }}>{p.date}</span>
                  </div>
                  <div style={{ fontWeight: 600, color: T.text, fontSize: 11, marginBottom: 4 }}>{p.focus}</div>
                  <div style={{ fontSize: 10, color: T.textSec, marginBottom: 6 }}>{p.detail}</div>
                  <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: `${p.color}22`, color: p.color }}>{p.status}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
