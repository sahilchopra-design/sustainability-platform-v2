import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, ScatterChart, Scatter, RadarChart, Radar, PolarGrid, PolarAngleAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const T = {
  bg: '#0f172a', card: '#1e293b', border: '#334155', muted: '#94a3b8',
  text: '#f1f5f9', sub: '#cbd5e1', accent: '#0EA5E9',
  green: '#16A34A', amber: '#D97706', red: '#DC2626', indigo: '#6366F1',
  teal: '#0D9488', blue: '#2563EB', purple: '#7C3AED',
};

const KpiCard = ({ label, value, sub, color = T.accent }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '18px 22px' }}>
    <div style={{ color: T.muted, fontSize: 12, marginBottom: 6 }}>{label}</div>
    <div style={{ color, fontSize: 26, fontWeight: 700 }}>{value}</div>
    {sub && <div style={{ color: T.sub, fontSize: 11, marginTop: 4 }}>{sub}</div>}
  </div>
);

const Pill = ({ label, color = T.accent }) => (
  <span style={{ background: color + '22', color, border: `1px solid ${color}55`, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>{label}</span>
);

const REGISTRIES = [
  { name: 'Verra Plastic Waste Reduction', code: 'VWRS', price: 42, volume2024: 18.4, certified: 234, stdBody: 'Verra', grade: 'AA', methodology: 'Ocean-bound', growth: 34 },
  { name: 'Plastic Bank Credit', code: 'PBC', price: 38, volume2024: 12.1, certified: 156, stdBody: 'Plastic Bank', grade: 'AA', methodology: 'Social + collection', growth: 28 },
  { name: 'rePurpose Global', code: 'RPG', price: 35, volume2024: 9.8, certified: 98, stdBody: 'rePurpose', grade: 'A+', methodology: 'Recovery offset', growth: 41 },
  { name: 'ClimateTrade Plastic', code: 'CTP', price: 29, volume2024: 7.2, certified: 74, stdBody: 'ClimateTrade', grade: 'A', methodology: 'Recycling offset', growth: 22 },
  { name: 'CleanHub Ocean Credit', code: 'CHO', price: 55, volume2024: 5.6, certified: 48, stdBody: 'CleanHub', grade: 'AA', methodology: 'Ocean collection', growth: 67 },
  { name: 'Prevented Ocean Plastic', code: 'POP', price: 48, volume2024: 14.3, certified: 182, stdBody: 'BBIA', grade: 'AA', methodology: 'Ocean-bound prevention', growth: 45 },
  { name: 'Zero Plastic Oceans', code: 'ZPO', price: 32, volume2024: 6.9, certified: 61, stdBody: 'ZPO Foundation', grade: 'A', methodology: 'Beach collection', growth: 19 },
  { name: 'PCX Exchange', code: 'PCX', price: 27, volume2024: 4.1, certified: 35, stdBody: 'PCX', grade: 'B+', methodology: 'Exchange-traded', growth: 88 },
];

const EPR_SCHEMES = [
  { country: 'Germany', region: 'EU', scheme: 'VerpackG', plasticTax: 0, targetRecovery: 90, compliance: 94, fee: 1450, penalty: 50000, mandatory: true },
  { country: 'France', region: 'EU', scheme: 'REP France', plasticTax: 10, targetRecovery: 90, compliance: 87, fee: 1200, penalty: 75000, mandatory: true },
  { country: 'UK', region: 'UK', scheme: 'UK EPR 2025', plasticTax: 223, targetRecovery: 85, compliance: 78, fee: 890, penalty: 40000, mandatory: true },
  { country: 'USA (CA)', region: 'US', scheme: 'CA SB 54', plasticTax: 0, targetRecovery: 65, compliance: 45, fee: 680, penalty: 25000, mandatory: true },
  { country: 'Canada', region: 'CA', scheme: 'Fed EPR', plasticTax: 0, targetRecovery: 75, compliance: 62, fee: 520, penalty: 30000, mandatory: true },
  { country: 'Japan', region: 'APAC', scheme: 'Container Packaging', plasticTax: 0, targetRecovery: 88, compliance: 91, fee: 340, penalty: 15000, mandatory: true },
  { country: 'South Korea', region: 'APAC', scheme: 'K-EPR', plasticTax: 0, targetRecovery: 82, compliance: 83, fee: 290, penalty: 12000, mandatory: true },
  { country: 'Brazil', region: 'LATAM', scheme: 'PNRS', plasticTax: 0, targetRecovery: 55, compliance: 41, fee: 180, penalty: 8000, mandatory: false },
];

const PRODUCERS = Array.from({ length: 24 }, (_, i) => ({
  name: ['NestlePkg', 'UnileverPkg', 'P&G', 'Coca-Cola', 'PepsiCo', 'Danone', 'Amcor', 'Berry Global', 'Sealed Air', 'Ball Corp',
    'Tetra Pak', 'Mondi', 'Smurfit', 'DS Smith', 'Coveris', 'Huhtamaki', 'Sonoco', 'AEP Industries', 'Silgan', 'Crown Holdings',
    'Ardagh', 'Graphic Packaging', 'Pactiv', 'Novatek'][i],
  plasticTonnage: Math.round(sr(i * 13) * 450 + 50),
  eprFee: Math.round(sr(i * 7 + 1) * 2000 + 400),
  recycledContent: Math.round(sr(i * 11 + 2) * 55 + 5),
  creditsPurchased: Math.round(sr(i * 9 + 3) * 180 + 10),
  complianceScore: Math.round(sr(i * 5 + 4) * 40 + 55),
  sector: ['Food & Bev', 'FMCG', 'Industrial', 'Retail', 'E-commerce'][Math.floor(sr(i * 3 + 5) * 5)],
}));

const PRICE_HISTORY = Array.from({ length: 36 }, (_, i) => ({
  month: `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i % 12]} ${2022 + Math.floor(i / 12)}`,
  verra: +(28 + sr(i * 17) * 8 + i * 0.4).toFixed(2),
  oceanBound: +(35 + sr(i * 23) * 10 + i * 0.5).toFixed(2),
  eprFee: +(800 + sr(i * 11) * 150 + i * 12).toFixed(0),
}));

const MARKET_FORECAST = [
  { year: '2024', market: 1.2, credits: 0.34, epr: 8.4 },
  { year: '2025', market: 1.9, credits: 0.58, epr: 11.2 },
  { year: '2026', market: 2.8, credits: 0.91, epr: 14.8 },
  { year: '2027', market: 3.9, credits: 1.34, epr: 18.6 },
  { year: '2028', market: 5.4, credits: 1.87, epr: 23.1 },
  { year: '2029', market: 7.2, credits: 2.51, epr: 28.4 },
  { year: '2030', market: 9.8, credits: 3.34, epr: 35.2 },
];

const COMPLIANCE_RADAR = [
  { metric: 'Collection Rate', EU: 88, UK: 72, US: 44, APAC: 79 },
  { metric: 'Recycled Content', EU: 76, UK: 65, US: 38, APAC: 61 },
  { metric: 'EPR Fee Compliance', EU: 91, UK: 78, US: 45, APAC: 82 },
  { metric: 'Reporting Quality', EU: 84, UK: 81, US: 56, APAC: 68 },
  { metric: 'Penalty Enforcement', EU: 89, UK: 74, US: 41, APAC: 71 },
  { metric: 'Extended Scope', EU: 72, UK: 61, US: 28, APAC: 55 },
];

const TABS = ['Market Overview', 'Registry Comparison', 'EPR Schemes', 'Producer Compliance', 'Price Dynamics', 'Investment Intelligence'];

export default function PlasticCreditsEprFinancePage() {
  const [tab, setTab] = useState(0);
  const [sortField, setSortField] = useState('price');
  const [regionFilter, setRegionFilter] = useState('All');
  const [creditQty, setCreditQty] = useState(500);
  const [registry, setRegistry] = useState('Verra Plastic Waste Reduction');

  const selectedReg = REGISTRIES.find(r => r.name === registry) || REGISTRIES[0];
  const creditCost = creditQty * selectedReg.price;
  const co2eq = (creditQty * 0.0028).toFixed(1);

  const filteredEPR = regionFilter === 'All' ? EPR_SCHEMES : EPR_SCHEMES.filter(e => e.region === regionFilter);
  const avgCompliance = filteredEPR.length ? filteredEPR.reduce((a, b) => a + b.compliance, 0) / filteredEPR.length : 0;
  const avgFee = filteredEPR.length ? filteredEPR.reduce((a, b) => a + b.fee, 0) / filteredEPR.length : 0;

  const sortedProducers = useMemo(() => [...PRODUCERS].sort((a, b) => b[sortField] - a[sortField]), [sortField]);
  const sortedRegistries = useMemo(() => [...REGISTRIES].sort((a, b) => b.price - a.price), []);

  const totalVolume = REGISTRIES.reduce((a, b) => a + b.volume2024, 0);
  const avgPrice = REGISTRIES.reduce((a, b) => a + b.price, 0) / REGISTRIES.length;
  const oceanBoundShare = ((REGISTRIES.filter(r => r.methodology.toLowerCase().includes('ocean')).reduce((a, b) => a + b.volume2024, 0)) / totalVolume * 100).toFixed(0);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', color: T.text, fontFamily: 'Inter,sans-serif', padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{ background: T.accent + '22', border: `1px solid ${T.accent}`, borderRadius: 8, padding: '4px 12px', fontSize: 11, color: T.accent, fontWeight: 700 }}>EP-EJ2</div>
          <Pill label="Plastic Credit Markets" color={T.accent} />
          <Pill label="EPR Finance" color={T.teal} />
          <Pill label="Circular Economy" color={T.green} />
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>Plastic Credits & EPR Finance</h1>
        <p style={{ color: T.muted, marginTop: 6, fontSize: 14 }}>Global plastic credit registries, Extended Producer Responsibility schemes, producer compliance, and investment intelligence across the plastic waste finance ecosystem.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        <KpiCard label="Total Market Volume 2024" value={`${totalVolume.toFixed(1)}Mt`} sub="Plastic credits issued" color={T.accent} />
        <KpiCard label="Avg Credit Price" value={`$${avgPrice.toFixed(0)}/t`} sub="Across 8 registries" color={T.green} />
        <KpiCard label="Ocean-Bound Share" value={`${oceanBoundShare}%`} sub="Of total plastic credits" color={T.teal} />
        <KpiCard label="Global EPR Revenue" value="$8.4Bn" sub="Producer fees 2024" color={T.amber} />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{ background: tab === i ? T.accent : T.card, color: tab === i ? '#fff' : T.sub, border: `1px solid ${tab === i ? T.accent : T.border}`, borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{t}</button>
        ))}
      </div>

      {tab === 0 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Market Forecast ($Bn) 2024–2030</h3>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={MARKET_FORECAST}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" stroke={T.muted} tick={{ fontSize: 11 }} />
                  <YAxis stroke={T.muted} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8 }} />
                  <Legend />
                  <Area type="monotone" dataKey="market" name="Plastic Credit Market" stroke={T.accent} fill={T.accent + '33'} />
                  <Area type="monotone" dataKey="epr" name="EPR Fee Revenue" stroke={T.amber} fill={T.amber + '22'} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Volume by Registry (Mt)</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={sortedRegistries} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" stroke={T.muted} tick={{ fontSize: 10 }} />
                  <YAxis dataKey="code" type="category" stroke={T.muted} tick={{ fontSize: 10 }} width={45} />
                  <Tooltip contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8 }} />
                  <Bar dataKey="volume2024" name="Volume 2024 (Mt)" fill={T.accent} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
            {[
              { label: 'Credit Purchase Calculator', desc: 'Model plastic credit procurement cost and CO₂e equivalence for compliance or voluntary neutralisation goals.' },
              { label: 'EPR Compliance Gap', desc: 'Assess producer shortfall vs. national EPR targets; quantify credit volumes needed to bridge gaps.' },
              { label: 'Price Risk Hedging', desc: 'Analyse credit price volatility across registries; model forward curves and hedging strategies.' },
              { label: 'Portfolio Plastic Footprint', desc: 'Aggregate plastic intensity across portfolio companies; benchmark vs. UNEA Resolution 5/14 targets.' },
            ].map(c => (
              <div key={c.label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
                <div style={{ color: T.accent, fontWeight: 700, fontSize: 13, marginBottom: 6 }}>{c.label}</div>
                <div style={{ color: T.sub, fontSize: 12 }}>{c.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 1 && (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Registry Comparison — Pricing & Volume</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                    {['Registry', 'Code', 'Price ($/t)', 'Volume 2024 (Mt)', 'Certified Projects', 'Methodology', 'Grade', 'YoY Growth'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: T.muted, fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {REGISTRIES.map((r, i) => (
                    <tr key={r.code} style={{ borderBottom: `1px solid ${T.border}22`, background: i % 2 === 0 ? T.bg + '55' : 'transparent' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600 }}>{r.name}</td>
                      <td style={{ padding: '10px 14px' }}><Pill label={r.code} color={T.accent} /></td>
                      <td style={{ padding: '10px 14px', color: T.green, fontWeight: 700 }}>${r.price}</td>
                      <td style={{ padding: '10px 14px' }}>{r.volume2024}</td>
                      <td style={{ padding: '10px 14px' }}>{r.certified}</td>
                      <td style={{ padding: '10px 14px', color: T.sub, fontSize: 12 }}>{r.methodology}</td>
                      <td style={{ padding: '10px 14px' }}><Pill label={r.grade} color={r.grade === 'AA' ? T.green : r.grade === 'A+' ? T.accent : T.amber} /></td>
                      <td style={{ padding: '10px 14px', color: r.growth > 40 ? T.green : T.amber, fontWeight: 700 }}>+{r.growth}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, marginTop: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Credit Purchase Calculator</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
              <div>
                <label style={{ color: T.muted, fontSize: 12 }}>Registry</label>
                <select value={registry} onChange={e => setRegistry(e.target.value)} style={{ width: '100%', background: T.bg, color: T.text, border: `1px solid ${T.border}`, borderRadius: 6, padding: '8px 10px', marginTop: 6, fontSize: 13 }}>
                  {REGISTRIES.map(r => <option key={r.code} value={r.name}>{r.name} (${r.price}/t)</option>)}
                </select>
              </div>
              <div>
                <label style={{ color: T.muted, fontSize: 12 }}>Credit Volume (tonnes): {creditQty.toLocaleString()}</label>
                <input type="range" min={50} max={5000} value={creditQty} onChange={e => setCreditQty(+e.target.value)} style={{ width: '100%', marginTop: 10 }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <KpiCard label="Total Cost" value={`$${(creditCost / 1000).toFixed(0)}K`} sub="Credit procurement" color={T.accent} />
                <KpiCard label="CO₂e Equiv." value={`${co2eq}t`} sub="GHG equivalence" color={T.green} />
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 2 && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            {['All', 'EU', 'UK', 'US', 'APAC', 'LATAM'].map(r => (
              <button key={r} onClick={() => setRegionFilter(r)} style={{ background: regionFilter === r ? T.teal : T.card, color: regionFilter === r ? '#fff' : T.sub, border: `1px solid ${regionFilter === r ? T.teal : T.border}`, borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{r}</button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <KpiCard label="Avg Compliance Rate" value={`${avgCompliance.toFixed(0)}%`} sub={`${regionFilter} region`} color={T.green} />
            <KpiCard label="Avg EPR Fee" value={`€${avgFee.toFixed(0)}/t`} sub="Producer contribution" color={T.amber} />
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>EPR Scheme Details</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                    {['Country', 'Scheme', 'Plastic Tax ($/t)', 'Recovery Target', 'Compliance', 'EPR Fee (€/t)', 'Max Penalty (€)', 'Mandatory'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: T.muted, fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredEPR.map((e, i) => (
                    <tr key={e.country} style={{ borderBottom: `1px solid ${T.border}22`, background: i % 2 === 0 ? T.bg + '55' : 'transparent' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>{e.country}</td>
                      <td style={{ padding: '10px 12px', color: T.sub, fontSize: 12 }}>{e.scheme}</td>
                      <td style={{ padding: '10px 12px' }}>{e.plasticTax > 0 ? `$${e.plasticTax}` : '—'}</td>
                      <td style={{ padding: '10px 12px' }}>{e.targetRecovery}%</td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 60, height: 6, background: T.border, borderRadius: 3 }}>
                            <div style={{ width: `${e.compliance}%`, height: '100%', background: e.compliance > 80 ? T.green : e.compliance > 60 ? T.amber : T.red, borderRadius: 3 }} />
                          </div>
                          <span>{e.compliance}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px', color: T.amber, fontWeight: 600 }}>€{e.fee.toLocaleString()}</td>
                      <td style={{ padding: '10px 12px', color: T.red }}>{e.mandatory ? `€${e.penalty.toLocaleString()}` : '—'}</td>
                      <td style={{ padding: '10px 12px' }}><Pill label={e.mandatory ? 'Mandatory' : 'Voluntary'} color={e.mandatory ? T.green : T.amber} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Regional Compliance Radar</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={COMPLIANCE_RADAR}>
                <PolarGrid stroke={T.border} />
                <PolarAngleAxis dataKey="metric" tick={{ fill: T.muted, fontSize: 11 }} />
                <Radar name="EU" dataKey="EU" stroke={T.blue} fill={T.blue + '33'} />
                <Radar name="UK" dataKey="UK" stroke={T.green} fill={T.green + '22'} />
                <Radar name="US" dataKey="US" stroke={T.red} fill={T.red + '22'} />
                <Radar name="APAC" dataKey="APAC" stroke={T.amber} fill={T.amber + '22'} />
                <Legend />
                <Tooltip contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 3 && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            {[['plasticTonnage', 'Plastic Volume'], ['eprFee', 'EPR Fee'], ['recycledContent', 'Recycled Content %'], ['creditsPurchased', 'Credits Purchased'], ['complianceScore', 'Compliance Score']].map(([f, l]) => (
              <button key={f} onClick={() => setSortField(f)} style={{ background: sortField === f ? T.amber : T.card, color: sortField === f ? '#fff' : T.sub, border: `1px solid ${sortField === f ? T.amber : T.border}`, borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{l}</button>
            ))}
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                    {['Producer', 'Sector', 'Plastic (t)', 'EPR Fee (€/t)', 'Recycled Content', 'Credits Purchased', 'Compliance Score'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: T.muted, fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedProducers.map((p, i) => (
                    <tr key={p.name} style={{ borderBottom: `1px solid ${T.border}22`, background: i % 2 === 0 ? T.bg + '55' : 'transparent' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>{p.name}</td>
                      <td style={{ padding: '10px 12px' }}><Pill label={p.sector} color={T.indigo} /></td>
                      <td style={{ padding: '10px 12px' }}>{p.plasticTonnage.toLocaleString()}</td>
                      <td style={{ padding: '10px 12px', color: T.amber }}>€{p.eprFee}</td>
                      <td style={{ padding: '10px 12px' }}>{p.recycledContent}%</td>
                      <td style={{ padding: '10px 12px', color: T.accent }}>{p.creditsPurchased}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 50, height: 6, background: T.border, borderRadius: 3 }}>
                            <div style={{ width: `${p.complianceScore}%`, height: '100%', background: p.complianceScore > 80 ? T.green : p.complianceScore > 65 ? T.amber : T.red, borderRadius: 3 }} />
                          </div>
                          <span>{p.complianceScore}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 4 && (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Plastic Credit Price History (36 months)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={PRICE_HISTORY}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="month" stroke={T.muted} tick={{ fontSize: 9 }} interval={5} />
                <YAxis stroke={T.muted} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8 }} />
                <Legend />
                <Line type="monotone" dataKey="verra" name="Verra PWRS ($/t)" stroke={T.accent} dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="oceanBound" name="Ocean-Bound ($/t)" stroke={T.teal} dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>EPR Fee Trend (€/tonne)</h3>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={PRICE_HISTORY}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="month" stroke={T.muted} tick={{ fontSize: 9 }} interval={5} />
                <YAxis stroke={T.muted} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8 }} />
                <Area type="monotone" dataKey="eprFee" name="Avg EPR Fee (€/t)" stroke={T.amber} fill={T.amber + '33'} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 5 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 20 }}>
          {[
            { title: 'Plastic Credit Verification Standards', items: ['Verra Plastic Waste Reduction Standard (PWRS) — ISO 14064 aligned', 'Plastic Bank Social Plastic methodology — Fair Trade Premium integration', 'Prevented Ocean Plastic (POP) — BBIA specification', 'rePurpose Recovery Assurance Standard (RAS) v2.0', 'CleanHub chain-of-custody verification', 'PCX exchange-grade standardisation'] },
            { title: 'Regulatory Drivers 2024–2030', items: ['EU Packaging & Packaging Waste Regulation (PPWR) — 50% recycled content by 2030', 'UN Global Plastics Treaty (INC-5) — legally binding framework 2025+', 'UK Extended Producer Responsibility (EPR) — full rollout from 2025', 'US REDUCE Act — federal plastic tax proposals', 'ASEAN Regional Action Plan on Combating Marine Debris', 'UNEA Resolution 5/14 — end plastic pollution by 2040'] },
            { title: 'Investment Themes', items: ['Ocean-bound plastic collection: 67% YoY price growth (CleanHub)', 'EPR compliance as recurring revenue stream for collection companies', 'Recycling infrastructure capacity gap: $60Bn investment needed by 2030', 'Chemical recycling plays for end-of-life plastics (pyrolysis, depolymerisation)', 'Plastic credit fintech: registry platforms, MRV software, compliance tools', 'Blended finance for EM waste collection infrastructure'] },
            { title: 'Risk Factors', items: ['Double-counting risk across voluntary and compliance markets', 'Greenwashing scrutiny on "ocean-bound" claims (additionality)', 'Regulatory fragmentation: 60+ national EPR schemes by 2025', 'Price volatility: credit premiums collapse if voluntary demand drops', 'China MEPP import restrictions limiting global recycled feedstock', 'Informal sector displacement risk in EM collection systems'] },
          ].map(s => (
            <div key={s.title} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 14, color: T.accent }}>{s.title}</h3>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {s.items.map(it => <li key={it} style={{ color: T.sub, fontSize: 12, marginBottom: 6 }}>{it}</li>)}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
