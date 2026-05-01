import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, ScatterChart, Scatter } from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const T = { bg: '#FAFAF7', card: '#FFFFFF', border: '#E5E2D9', text: '#1A1A2E', sub: '#6B7280', indigo: '#4F46E5', green: '#065F46', red: '#991B1B', blue: '#1E40AF', amber: '#92400E', teal: '#0F766E', sky: '#0369A1' };
const TABS = ['Credit Markets', 'CORSIA Credits', 'Book-and-Claim Certs', 'Lifecycle Analysis', 'Revenue Stacking', 'Registry Intelligence'];

const CREDIT_TYPES = [
  { id: 'CORSIA', name: 'CORSIA Eligible Fuel (CEF)', standard: 'ICAO', price: 18, vol_mt: 0.45, vintage: '2024', permanence: 'Permanent (fuel)', additionality: 'Required', registry: 'ICAO Central Registry' },
  { id: 'ISCC_PLUS', name: 'ISCC+ SAF Certificate', standard: 'ISCC', price: 45, vol_mt: 1.2, vintage: '2024', permanence: 'Permanent', additionality: 'Embedded', registry: 'ISCC+ Registry' },
  { id: 'RSB', name: 'RSB SAF Certificate', standard: 'RSB', price: 38, vol_mt: 0.8, vintage: '2024', permanence: 'Permanent', additionality: 'Required', registry: 'RSB Registry' },
  { id: 'VERRA', name: 'Verra SAF VCU', standard: 'VCS', price: 22, vol_mt: 0.15, vintage: '2024', permanence: 'Permanent', additionality: 'Required', registry: 'Verra Registry' },
  { id: 'GOLD_STD', name: 'Gold Standard SAF', standard: 'GS4GG', price: 30, vol_mt: 0.08, vintage: '2024', permanence: 'Permanent', additionality: 'Required', registry: 'Gold Standard' },
  { id: 'EU_ETS', name: 'EU ETS Aviation Allowance', standard: 'EU ETS', price: 62, vol_mt: 2.1, vintage: '2024', permanence: 'Regulatory', additionality: 'N/A', registry: 'EUTL' },
];

const PROJECTS = Array.from({ length: 20 }, (_, i) => {
  const ct = CREDIT_TYPES[Math.floor(sr(i * 7 + 1) * CREDIT_TYPES.length)];
  const volume = parseFloat((1000 + sr(i * 11 + 2) * 99000).toFixed(0));
  const price = parseFloat((ct.price * (0.85 + sr(i * 13 + 3) * 0.35)).toFixed(1));
  const ci = Math.round(10 + sr(i * 17 + 4) * 75);
  const country = ['USA', 'EU', 'UK', 'Australia', 'Norway', 'Japan', 'UAE'][Math.floor(sr(i * 19 + 5) * 7)];
  const pathway = ['HEFA', 'AtJ', 'FT-MSW', 'PtL'][Math.floor(sr(i * 23 + 6) * 4)];
  const vintage = `202${3 + Math.floor(sr(i * 29 + 7) * 2)}`;
  return { id: i + 1, name: `${country}-${pathway}-${i + 1}`, creditType: ct.id, volume, price, ci, country, pathway, vintage };
});

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 20px', flex: '1 1 150px' }}>
    <div style={{ fontSize: 11, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.text }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{sub}</div>}
  </div>
);
const Pill = ({ v, color }) => <span style={{ background: color || T.sky, color: '#fff', fontSize: 10, borderRadius: 12, padding: '2px 8px', fontWeight: 600 }}>{v}</span>;

export default function SafCarbonCreditsPage() {
  const [tab, setTab] = useState(0);
  const [selType, setSelType] = useState('ALL');
  const [annualProd, setAnnualProd] = useState(0.3);
  const [pathway, setPathway] = useState('HEFA');

  const filtered = useMemo(() => PROJECTS.filter(p => selType === 'ALL' || p.creditType === selType), [selType]);
  const avgPrice = useMemo(() => filtered.length ? (filtered.reduce((s, p) => s + p.price, 0) / filtered.length).toFixed(1) : '—', [filtered]);
  const totalVol = useMemo(() => filtered.reduce((s, p) => s + p.volume, 0), [filtered]);

  const ciByPathway = { HEFA: 28, AtJ: 12, 'FT-MSW': 5, PtL: -70 };
  const baselineCI = 89;
  const ciReduction = baselineCI - (ciByPathway[pathway] || 28);
  const gallonsPerMt = 264;
  const totalGallons = annualProd * 1e6 * gallonsPerMt;
  const corsiaCredit = totalGallons * (ciReduction / baselineCI) * 0.0025;
  const isccRevenue = annualProd * 1e6 * 45 / 1e6;

  const priceHistory = Array.from({ length: 8 }, (_, i) => ({
    year: 2017 + i,
    CORSIA: parseFloat((5 + i * 2.2).toFixed(1)),
    ISCC_PLUS: parseFloat((15 + i * 4.5).toFixed(1)),
    RSB: parseFloat((12 + i * 3.8).toFixed(1)),
    EU_ETS: parseFloat((8 + i * 8.2).toFixed(1)),
  }));

  const revenueStack = useMemo(() => [
    { name: 'SAF Sale', value: parseFloat((annualProd * 1e6 * 2.80 * gallonsPerMt / 1e6).toFixed(1)) },
    { name: 'IRA §40B', value: parseFloat((annualProd * 1e6 * gallonsPerMt * 1.50 / 1e6).toFixed(1)) },
    { name: 'ISCC+ Cert', value: parseFloat(isccRevenue.toFixed(1)) },
    { name: 'CORSIA CEF', value: parseFloat((corsiaCredit / 1e6).toFixed(1)) },
    { name: 'EU ETS', value: parseFloat((annualProd * 1e6 * 0.055 * 65 / 1e6).toFixed(1)) },
  ], [annualProd, isccRevenue, corsiaCredit]);

  const lcaData = ['HEFA-UCO', 'HEFA-Tallow', 'AtJ-Cellulosic', 'FT-MSW', 'PtL-Wind'].map(pw => ({
    name: pw.split('-')[0],
    combustion: 74,
    feedstock: pw.includes('UCO') ? -48 : pw.includes('Tallow') ? -42 : pw.includes('Cellulosic') ? -72 : pw.includes('MSW') ? -80 : -145,
    process: pw.includes('PtL') ? 5 : pw.includes('FT') ? 8 : 12,
    net: pw.includes('UCO') ? 28 : pw.includes('Tallow') ? 35 : pw.includes('Cellulosic') ? 12 : pw.includes('MSW') ? 5 : -70,
  }));

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: 'Inter, sans-serif', color: T.text }}>
      <div style={{ background: '#0C1A2E', padding: '20px 32px', borderBottom: `3px solid ${T.sky}` }}>
        <div style={{ fontSize: 11, color: '#94A3B8', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>EP-EF6 · SAF Finance Suite</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: '#F1F5F9' }}>SAF Carbon Credits & Book-and-Claim</div>
        <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>CORSIA · ISCC+ · RSB · EU ETS · LCA · Revenue Stacking · 20 Projects · 6 Credit Types</div>
      </div>
      <div style={{ background: '#0C1A2E', display: 'flex', gap: 0, padding: '0 32px', borderBottom: `1px solid #1E3A5F` }}>
        {TABS.map((t, i) => <button key={t} onClick={() => setTab(i)} style={{ padding: '12px 18px', fontSize: 12, fontWeight: tab === i ? 700 : 400, color: tab === i ? T.sky : '#94A3B8', background: 'none', border: 'none', borderBottom: tab === i ? `2px solid ${T.sky}` : '2px solid transparent', cursor: 'pointer', whiteSpace: 'nowrap' }}>{t}</button>)}
      </div>
      <div style={{ padding: '28px 32px' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          <KpiCard label="Avg Credit Price" value={`$${avgPrice}/tCO₂`} sub="Filtered projects" color={T.sky} />
          <KpiCard label="Projects" value={filtered.length} sub={`${totalVol.toLocaleString()} total vol`} color={T.indigo} />
          <KpiCard label="CI Reduction (HEFA)" value="68%" sub="vs Jet-A baseline 89 gCO₂/MJ" color={T.green} />
          <KpiCard label="CORSIA Price 2024" value="~$18/t" sub="Eligible Fuel Credit" color={T.amber} />
          <KpiCard label="EU ETS Aviation" value="~$62/t" sub="Phase 4 allowance" color={T.teal} />
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          <select value={selType} onChange={e => setSelType(e.target.value)} style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: '7px 12px', fontSize: 12, background: T.card, color: T.text }}>
            <option value="ALL">All Credit Types</option>
            {CREDIT_TYPES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.sub }}><span>Production ({annualProd} Mt)</span><input type="range" min={0.05} max={2.0} step={0.05} value={annualProd} onChange={e => setAnnualProd(+e.target.value)} style={{ width: 100 }} /></div>
          <select value={pathway} onChange={e => setPathway(e.target.value)} style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: '7px 12px', fontSize: 12, background: T.card, color: T.text }}>
            {Object.keys(ciByPathway).map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {tab === 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Credit Types — Price & Volume</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={CREDIT_TYPES.map(c => ({ name: c.id, price: c.price, vol: c.vol_mt }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="l" tick={{ fontSize: 11 }} unit="$/t" />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} unit=" Mt" />
                  <Tooltip />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="l" dataKey="price" name="Price $/t" fill={T.sky} />
                  <Bar yAxisId="r" dataKey="vol" name="Volume Mt" fill={T.green} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Credit Type Comparison</div>
              {CREDIT_TYPES.map(c => (
                <div key={c.id} style={{ padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontWeight: 600, fontSize: 12 }}>{c.name}</span>
                    <span style={{ fontWeight: 700, color: T.amber }}>${c.price}/t</span>
                  </div>
                  <div style={{ fontSize: 11, color: T.sub, display: 'flex', gap: 12 }}>
                    <span>Registry: {c.registry.split(' ')[0]}</span>
                    <span>Vol: {c.vol_mt} Mt</span>
                    <span>Addl: {c.additionality}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 1 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>CORSIA Credit Price History</div>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={priceHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="$/t" />
                  <Tooltip formatter={v => [`$${v}/t`]} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Line dataKey="CORSIA" stroke={T.sky} strokeWidth={2} dot={false} />
                  <Line dataKey="ISCC_PLUS" stroke={T.green} strokeWidth={2} dot={false} />
                  <Line dataKey="RSB" stroke={T.amber} strokeWidth={2} dot={false} />
                  <Line dataKey="EU_ETS" stroke={T.indigo} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>CORSIA Calculator ({pathway}, {annualProd} Mt/yr)</div>
              {[['Annual Production', `${annualProd} Mt/yr`], ['Gallons (264/t)', `${(totalGallons / 1e6).toFixed(1)}M gal`], ['Baseline CI', '89 gCO₂eq/MJ (Jet-A)'], ['SAF CI', `${ciByPathway[pathway]} gCO₂eq/MJ`], ['CI Reduction', `${ciReduction.toFixed(0)} gCO₂eq/MJ (${(ciReduction / baselineCI * 100).toFixed(0)}%)`], ['CORSIA Credits', `${(corsiaCredit / 1000).toFixed(0)} tCO₂ equiv.`], ['Revenue @ $18/t', `$${(corsiaCredit * 18 / 1e9).toFixed(2)}M`]].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
                  <span style={{ color: T.sub }}>{k}</span><span style={{ fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 2 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>SAF Certificate Project Registry</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead><tr style={{ background: '#F8F7F4' }}>
                    {['Project', 'Type', 'Pathway', 'Country', 'Vol (t)', 'Price $/t', 'CI', 'Vintage'].map(h => <th key={h} style={{ padding: '7px 10px', textAlign: 'left', color: T.sub, fontWeight: 600 }}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {filtered.slice(0, 12).map((p, i) => (
                      <tr key={p.id} style={{ borderTop: `1px solid ${T.border}`, background: i % 2 ? '#FAFAF7' : T.card }}>
                        <td style={{ padding: '7px 10px', fontWeight: 500 }}>{p.name}</td>
                        <td style={{ padding: '7px 10px' }}><Pill v={p.creditType} /></td>
                        <td style={{ padding: '7px 10px', color: T.sub }}>{p.pathway}</td>
                        <td style={{ padding: '7px 10px' }}>{p.country}</td>
                        <td style={{ padding: '7px 10px' }}>{p.volume.toLocaleString()}</td>
                        <td style={{ padding: '7px 10px', fontWeight: 600, color: T.amber }}>${p.price}</td>
                        <td style={{ padding: '7px 10px', color: p.ci < 30 ? T.green : T.amber }}>{p.ci}</td>
                        <td style={{ padding: '7px 10px', color: T.sub }}>{p.vintage}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Certificate Price vs CI Scatter</div>
              <ResponsiveContainer width="100%" height={260}>
                <ScatterChart margin={{ left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="ci" name="CI" unit=" g/MJ" tick={{ fontSize: 11 }} label={{ value: 'Carbon Intensity (gCO₂/MJ)', position: 'insideBottom', offset: -8, fontSize: 11 }} />
                  <YAxis dataKey="price" name="Price" unit=" $/t" tick={{ fontSize: 11 }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(v, n) => [n === 'ci' ? `${v} gCO₂/MJ` : `$${v}/t`, n]} />
                  <Scatter data={filtered.map(p => ({ ci: p.ci, price: p.price, name: p.name }))} fill={T.sky} fillOpacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 3 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Lifecycle CI Waterfall (gCO₂eq/MJ)</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={lcaData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit=" g" />
                  <Tooltip formatter={v => [`${v} gCO₂/MJ`]} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="combustion" name="Combustion" stackId="a" fill={T.red} fillOpacity={0.7} />
                  <Bar dataKey="feedstock" name="Feedstock credit" stackId="a" fill={T.green} />
                  <Bar dataKey="process" name="Process" stackId="a" fill={T.amber} />
                  <ReferenceLine y={89} stroke={T.amber} strokeDasharray="4 2" label={{ value: 'Jet-A 89 g/MJ', fontSize: 10 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Net Lifecycle CI by Pathway</div>
              {lcaData.map(pw => (
                <div key={pw.name} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                    <span>{pw.name}</span>
                    <span style={{ fontWeight: 700, color: pw.net < 0 ? T.green : pw.net < 40 ? T.sky : T.amber }}>{pw.net} gCO₂/MJ ({((1 - pw.net / 89) * 100).toFixed(0)}% reduction)</span>
                  </div>
                  <div style={{ background: T.border, borderRadius: 4, height: 8, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, Math.max(0, (1 - pw.net / 89) * 100))}%`, background: pw.net < 0 ? T.green : pw.net < 40 ? T.sky : T.amber, height: '100%', borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 4 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Annual Revenue Stack ($M/yr, {pathway} {annualProd}Mt)</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={revenueStack}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="$M" />
                  <Tooltip formatter={v => [`$${v}M`, 'Revenue']} />
                  <Bar dataKey="value" fill={T.green} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Revenue Stack Detail</div>
              {revenueStack.map(r => (
                <div key={r.name} style={{ padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ fontWeight: 600 }}>{r.name}</span>
                    <span style={{ fontWeight: 700, color: T.green }}>${r.value}M/yr</span>
                  </div>
                  <div style={{ background: T.border, borderRadius: 3, height: 6, marginTop: 5, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, r.value / (revenueStack[0].value || 1) * 100)}%`, background: T.green, height: '100%', borderRadius: 3 }} />
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 12, padding: '10px 12px', background: '#F0FFF4', borderRadius: 8, border: `1px solid ${T.green}` }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.green }}>Total: ${revenueStack.reduce((s, r) => s + r.value, 0).toFixed(1)}M/yr</div>
              </div>
            </div>
          </div>
        )}

        {tab === 5 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>SAF Registry Landscape</div>
              {[{ registry: 'ICAO Central Registry', standard: 'CORSIA', coverage: 'Global (ICAO member states)', credits: 'CEF - Eligible Fuel Credits', note: 'Mandatory Phase II from 2027' }, { registry: 'ISCC+ Registry', standard: 'ISCC+', coverage: 'EU, UK, Japan, USA', credits: 'SAF Certificate (tonne-based)', note: 'Mass balance + book-and-claim' }, { registry: 'RSB Platform', standard: 'RSB', coverage: 'Global', credits: 'RSB Statement of Conformity', note: 'Preferred by US airlines' }, { registry: 'Gold Standard', standard: 'GS4GG', coverage: 'Global VCM', credits: 'Gold Standard VER', note: 'Higher premiums; SDG co-benefits' }, { registry: 'EU ETS (EUTL)', standard: 'EU ETS', coverage: 'EU flights', credits: 'European Aviation Allowance', note: 'Compliance market; SAF offset mechanism' }].map(r => (
                <div key={r.registry} style={{ padding: '10px 0', borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ fontWeight: 600, fontSize: 12 }}>{r.registry}</div>
                  <div style={{ fontSize: 11, color: T.sub, marginTop: 3 }}>{r.coverage} | {r.credits}</div>
                  <div style={{ fontSize: 10, color: T.teal, marginTop: 2 }}>{r.note}</div>
                </div>
              ))}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>SAF Credit Market Volume Forecast (Mt CO₂)</div>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={[2024, 2026, 2028, 2030, 2033, 2035].map(yr => ({ year: yr, CORSIA: parseFloat((0.5 + (yr - 2024) * 4.2).toFixed(1)), ISCC_Plus: parseFloat((0.3 + (yr - 2024) * 2.5).toFixed(1)), Other: parseFloat((0.1 + (yr - 2024) * 0.8).toFixed(1)) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit=" Mt" />
                  <Tooltip formatter={v => [`${v} Mt CO₂`]} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="CORSIA" stackId="a" fill={T.sky} stroke={T.sky} fillOpacity={0.6} />
                  <Area type="monotone" dataKey="ISCC_Plus" stackId="a" fill={T.green} stroke={T.green} fillOpacity={0.6} />
                  <Area type="monotone" dataKey="Other" stackId="a" fill={T.amber} stroke={T.amber} fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
