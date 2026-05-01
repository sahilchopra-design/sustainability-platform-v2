import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, ScatterChart, Scatter } from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const T = { bg: '#FAFAF7', card: '#FFFFFF', border: '#E5E2D9', text: '#1A1A2E', sub: '#6B7280', indigo: '#4F46E5', green: '#065F46', red: '#991B1B', blue: '#1E40AF', amber: '#92400E', teal: '#0F766E', sky: '#0369A1' };
const TABS = ['Airline Portfolio', 'Offtake Structures', 'PPA Pricing Engine', 'Book-and-Claim', 'Credit Risk', 'Market Intelligence'];

const AIRLINES = [
  { name: 'Lufthansa Group', region: 'EU', fuel_mt: 9.2, saf_pct: 2.8, saf_mt: 0.26, target2030: 10, pathway: 'HEFA+AtJ', ltc: true, creditRating: 'BBB', compliance: 'ReFuelEU' },
  { name: 'British Airways', region: 'UK', fuel_mt: 5.8, saf_pct: 2.2, saf_mt: 0.13, target2030: 10, pathway: 'HEFA+FT', ltc: true, creditRating: 'BB+', compliance: 'UK SAF' },
  { name: 'Delta Air Lines', region: 'USA', fuel_mt: 13.5, saf_pct: 0.5, saf_mt: 0.07, target2030: 10, pathway: 'HEFA', ltc: false, creditRating: 'BB+', compliance: 'Voluntary' },
  { name: 'United Airlines', region: 'USA', fuel_mt: 12.1, saf_pct: 0.8, saf_mt: 0.10, target2030: 50, pathway: 'AtJ+PtL', ltc: true, creditRating: 'BB', compliance: 'Voluntary' },
  { name: 'Air France-KLM', region: 'EU', fuel_mt: 8.9, saf_pct: 1.8, saf_mt: 0.16, target2030: 10, pathway: 'HEFA', ltc: true, creditRating: 'BB+', compliance: 'ReFuelEU' },
  { name: 'Singapore Airlines', region: 'Asia', fuel_mt: 7.5, saf_pct: 0.5, saf_mt: 0.04, target2030: 5, pathway: 'HEFA', ltc: false, creditRating: 'A', compliance: 'CORSIA' },
  { name: 'Japan Airlines', region: 'Japan', fuel_mt: 6.2, saf_pct: 0.3, saf_mt: 0.02, target2030: 10, pathway: 'HEFA+AtJ', ltc: true, creditRating: 'BBB-', compliance: 'Japan GIF' },
  { name: 'Qantas', region: 'Australia', fuel_mt: 4.1, saf_pct: 0.2, saf_mt: 0.01, target2030: 10, pathway: 'HEFA', ltc: false, creditRating: 'BBB', compliance: 'Proposed AU' },
];

const DEALS = Array.from({ length: 16 }, (_, i) => {
  const al = AIRLINES[Math.floor(sr(i * 7 + 1) * AIRLINES.length)];
  const volume = parseFloat((0.05 + sr(i * 11 + 2) * 0.45).toFixed(2));
  const tenor = 5 + Math.floor(sr(i * 13 + 3) * 15);
  const price = parseFloat((1.80 + sr(i * 17 + 4) * 3.20).toFixed(2));
  const indexation = ['CPI', 'Jet-A linked', 'Fixed', 'Hybrid'][Math.floor(sr(i * 19 + 5) * 4)];
  const status = ['Signed', 'Negotiating', 'Loi', 'Expired'][Math.floor(sr(i * 23 + 6) * 4)];
  const structure = ['LTC-Direct', 'Book-and-Claim', 'SAF Certificate', 'PPA Blended'][Math.floor(sr(i * 29 + 7) * 4)];
  return { id: i + 1, airline: al.name, region: al.region, volume, tenor, price, indexation, status, structure, creditRating: al.creditRating };
});

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 20px', flex: '1 1 150px' }}>
    <div style={{ fontSize: 11, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.text }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{sub}</div>}
  </div>
);
const Pill = ({ v }) => {
  const c = { Signed: T.green, Negotiating: T.sky, Loi: T.amber, Expired: T.sub, 'LTC-Direct': T.indigo, 'Book-and-Claim': T.teal, 'SAF Certificate': T.green, 'PPA Blended': T.sky }[v] || T.sub;
  return <span style={{ background: c, color: '#fff', fontSize: 10, borderRadius: 12, padding: '2px 8px', fontWeight: 600 }}>{v}</span>;
};

export default function AirlineSafProcurementPage() {
  const [tab, setTab] = useState(0);
  const [selRegion, setSelRegion] = useState('ALL');
  const [basePrice, setBasePrice] = useState(2.50);
  const [indexType, setIndexType] = useState('CPI');

  const filtered = useMemo(() => AIRLINES.filter(a => selRegion === 'ALL' || a.region === selRegion), [selRegion]);
  const filteredDeals = useMemo(() => DEALS.filter(d => selRegion === 'ALL' || d.region === selRegion), [selRegion]);

  const totalSafDemand = useMemo(() => filtered.reduce((s, a) => s + a.fuel_mt * a.target2030 / 100, 0).toFixed(1), [filtered]);
  const avgPct = useMemo(() => filtered.length ? (filtered.reduce((s, a) => s + a.saf_pct, 0) / filtered.length).toFixed(1) : '—', [filtered]);
  const ltcCount = useMemo(() => filtered.filter(a => a.ltc).length, [filtered]);

  const ppaScenarios = useMemo(() => [2025, 2027, 2030, 2033, 2035].map(yr => {
    const multiplier = indexType === 'CPI' ? Math.pow(1.03, yr - 2024) : indexType === 'Jet-A linked' ? 1 + (yr - 2024) * 0.015 : 1;
    return { year: yr, price: parseFloat((basePrice * multiplier).toFixed(2)), jetA: parseFloat((0.82 + (yr - 2024) * 0.018).toFixed(2)), premium: parseFloat((basePrice * multiplier - 0.82 - (yr - 2024) * 0.018).toFixed(2)) };
  }), [basePrice, indexType]);

  const creditRiskMap = DEALS.map(d => {
    const rating = { 'A': 1, 'BBB': 2, 'BBB-': 3, 'BB+': 4, 'BB': 5 }[d.creditRating] || 4;
    return { name: d.airline.split(' ')[0], volume: d.volume, tenor: d.tenor, rating, price: d.price };
  });

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: 'Inter, sans-serif', color: T.text }}>
      <div style={{ background: '#0C1A2E', padding: '20px 32px', borderBottom: `3px solid ${T.sky}` }}>
        <div style={{ fontSize: 11, color: '#94A3B8', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>EP-EF5 · SAF Finance Suite</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: '#F1F5F9' }}>Airline SAF Procurement & Offtake</div>
        <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>LTC · Book-and-Claim · PPA Pricing · 8 Airlines · 16 Deals · Credit Risk</div>
      </div>
      <div style={{ background: '#0C1A2E', display: 'flex', gap: 0, padding: '0 32px', borderBottom: `1px solid #1E3A5F` }}>
        {TABS.map((t, i) => <button key={t} onClick={() => setTab(i)} style={{ padding: '12px 18px', fontSize: 12, fontWeight: tab === i ? 700 : 400, color: tab === i ? T.sky : '#94A3B8', background: 'none', border: 'none', borderBottom: tab === i ? `2px solid ${T.sky}` : '2px solid transparent', cursor: 'pointer', whiteSpace: 'nowrap' }}>{t}</button>)}
      </div>
      <div style={{ padding: '28px 32px' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          <KpiCard label="Airlines Tracked" value={filtered.length} sub={`${totalSafDemand} Mt/yr 2030 demand`} color={T.sky} />
          <KpiCard label="Avg SAF % Now" value={`${avgPct}%`} sub="Current blending" color={T.indigo} />
          <KpiCard label="LTC Signed" value={`${ltcCount}/${filtered.length}`} sub="Long-term contracts" color={T.green} />
          <KpiCard label="Deals in System" value={filteredDeals.length} sub="LTC + SAF certificates" color={T.amber} />
          <KpiCard label="Avg Deal Price" value={`$${filteredDeals.length ? (filteredDeals.reduce((s, d) => s + d.price, 0) / filteredDeals.length).toFixed(2) : '—'}/L`} sub="Weighted PPA" color={T.teal} />
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          <select value={selRegion} onChange={e => setSelRegion(e.target.value)} style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: '7px 12px', fontSize: 12, background: T.card, color: T.text }}>
            {['ALL', 'EU', 'UK', 'USA', 'Asia', 'Japan', 'Australia'].map(r => <option key={r} value={r}>{r === 'ALL' ? 'All Regions' : r}</option>)}
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.sub }}><span>SAF PPA Price ($/L): {basePrice}</span><input type="range" min={1.5} max={6.0} step={0.1} value={basePrice} onChange={e => setBasePrice(+e.target.value)} style={{ width: 100 }} /></div>
          <select value={indexType} onChange={e => setIndexType(e.target.value)} style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: '7px 12px', fontSize: 12, background: T.card, color: T.text }}>
            {['CPI', 'Jet-A linked', 'Fixed', 'Hybrid'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {tab === 0 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>SAF % Now vs 2030 Target</div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={filtered.map(a => ({ name: a.name.split(' ')[0], now: a.saf_pct, target: a.target2030 }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} unit="%" />
                    <Tooltip formatter={v => [`${v}%`]} />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="now" name="Current %" fill={T.sky} />
                    <Bar dataKey="target" name="2030 Target" fill={T.green} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>2030 SAF Volume Needed (Mt/yr)</div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={filtered.map(a => ({ name: a.name.split(' ')[0], needed: parseFloat((a.fuel_mt * a.target2030 / 100).toFixed(2)), current: a.saf_mt }))} layout="vertical" margin={{ left: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis type="number" tick={{ fontSize: 11 }} unit=" Mt" />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={60} />
                    <Tooltip formatter={v => [`${v} Mt/yr`]} />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="needed" name="2030 Target" fill={T.amber} />
                    <Bar dataKey="current" name="Current" fill={T.green} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Airline SAF Portfolio</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead><tr style={{ background: '#F8F7F4' }}>
                    {['Airline', 'Region', 'Total Fuel (Mt)', 'SAF Now %', 'SAF Mt', '2030 Target', 'Pathway', 'LTC', 'Rating', 'Compliance'].map(h => <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: T.sub, fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {filtered.map((a, i) => (
                      <tr key={a.name} style={{ borderTop: `1px solid ${T.border}`, background: i % 2 ? '#FAFAF7' : T.card }}>
                        <td style={{ padding: '8px 12px', fontWeight: 600 }}>{a.name}</td>
                        <td style={{ padding: '8px 12px', color: T.sub }}>{a.region}</td>
                        <td style={{ padding: '8px 12px' }}>{a.fuel_mt}</td>
                        <td style={{ padding: '8px 12px', fontWeight: 600, color: a.saf_pct >= 2 ? T.green : T.amber }}>{a.saf_pct}%</td>
                        <td style={{ padding: '8px 12px' }}>{a.saf_mt}</td>
                        <td style={{ padding: '8px 12px', fontWeight: 600, color: T.sky }}>{a.target2030}%</td>
                        <td style={{ padding: '8px 12px', fontSize: 11 }}>{a.pathway}</td>
                        <td style={{ padding: '8px 12px' }}>{a.ltc ? <span style={{ color: T.green }}>✓</span> : '—'}</td>
                        <td style={{ padding: '8px 12px', fontWeight: 600 }}>{a.creditRating}</td>
                        <td style={{ padding: '8px 12px', fontSize: 11, color: T.sub }}>{a.compliance}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab === 1 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Deal Structures by Type</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={['LTC-Direct', 'Book-and-Claim', 'SAF Certificate', 'PPA Blended'].map(s => ({ structure: s, count: DEALS.filter(d => d.structure === s).length, vol: parseFloat(DEALS.filter(d => d.structure === s).reduce((a, d) => a + d.volume, 0).toFixed(2)) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="structure" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="count" name="# Deals" fill={T.sky} />
                  <Bar dataKey="vol" name="Volume Mt" fill={T.green} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Offtake Deal Table</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead><tr style={{ background: '#F8F7F4' }}>
                    {['Airline', 'Vol (Mt)', 'Tenor', 'Price $/L', 'Index', 'Structure', 'Status'].map(h => <th key={h} style={{ padding: '7px 10px', textAlign: 'left', color: T.sub, fontWeight: 600 }}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {filteredDeals.slice(0, 12).map((d, i) => (
                      <tr key={d.id} style={{ borderTop: `1px solid ${T.border}`, background: i % 2 ? '#FAFAF7' : T.card }}>
                        <td style={{ padding: '7px 10px' }}>{d.airline.split(' ')[0]}</td>
                        <td style={{ padding: '7px 10px' }}>{d.volume}</td>
                        <td style={{ padding: '7px 10px' }}>{d.tenor}yr</td>
                        <td style={{ padding: '7px 10px', fontWeight: 600, color: d.price < 2.5 ? T.green : T.amber }}>${d.price}</td>
                        <td style={{ padding: '7px 10px', color: T.sub }}>{d.indexation}</td>
                        <td style={{ padding: '7px 10px' }}><Pill v={d.structure} /></td>
                        <td style={{ padding: '7px 10px' }}><Pill v={d.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab === 2 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>PPA Pricing Evolution ({indexType})</div>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={ppaScenarios}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="$/L" />
                  <Tooltip formatter={v => [`$${v}/L`]} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Line dataKey="price" name="SAF PPA" stroke={T.sky} strokeWidth={2} dot />
                  <Line dataKey="jetA" name="Jet-A" stroke={T.amber} strokeWidth={2} dot={false} strokeDasharray="5 3" />
                  <Line dataKey="premium" name="SAF Premium" stroke={T.red} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>PPA Price Scenarios</div>
              {ppaScenarios.map(p => (
                <div key={p.year} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${T.border}`, fontSize: 13 }}>
                  <span style={{ color: T.sub }}>{p.year}</span>
                  <span>SAF: <strong style={{ color: T.sky }}>${p.price}/L</strong></span>
                  <span>Jet-A: <strong style={{ color: T.amber }}>${p.jetA}/L</strong></span>
                  <span>Premium: <strong style={{ color: p.premium > 2 ? T.red : T.green }}>${p.premium}/L</strong></span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 3 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Book-and-Claim Framework</div>
              {[{ step: '1. SAF Producer', action: 'Produces CORSIA/ISCC+ certified SAF', loc: 'Any refinery globally' }, { step: '2. Certification', action: 'Issues SAF certificate with chain of custody', loc: 'RSB, ISCC+, REDcert²' }, { step: '3. Book', action: 'SAF physically blended at nearest airport', loc: 'Hub airport logistics' }, { step: '4. Claim', action: 'Airline buys certificate, claims GHG reduction', loc: 'Remote airline operation' }, { step: '5. Retirement', action: 'Certificate retired; no double-counting', loc: 'Registry (RSB/ICAO)' }, { step: '6. Reporting', action: 'Airline reports CORSIA/ReFuelEU compliance', loc: 'ICAO / EASA' }].map(s => (
                <div key={s.step} style={{ padding: '10px 0', borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ fontWeight: 600, fontSize: 12 }}>{s.step}</div>
                  <div style={{ fontSize: 11, color: T.sub, marginTop: 3 }}>{s.action}</div>
                  <div style={{ fontSize: 10, color: T.teal, marginTop: 2 }}>{s.loc}</div>
                </div>
              ))}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Book-and-Claim Market Volume (Mt/yr)</div>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={[2024, 2026, 2028, 2030, 2033, 2035].map(yr => ({ year: yr, cert: parseFloat((0.1 + (yr - 2024) * 0.8).toFixed(1)), direct: parseFloat((0.05 + (yr - 2024) * 0.4).toFixed(1)) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit=" Mt" />
                  <Tooltip formatter={v => [`${v} Mt`]} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="cert" name="SAF Certificates" stackId="a" fill={T.sky} stroke={T.sky} fillOpacity={0.6} />
                  <Area type="monotone" dataKey="direct" name="Direct Offtake" stackId="a" fill={T.green} stroke={T.green} fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 4 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Credit Risk vs Deal Volume</div>
              <ResponsiveContainer width="100%" height={280}>
                <ScatterChart margin={{ left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="volume" name="Volume" unit=" Mt" tick={{ fontSize: 11 }} label={{ value: 'Deal Volume (Mt/yr)', position: 'insideBottom', offset: -8, fontSize: 11 }} />
                  <YAxis dataKey="rating" name="Rating" tick={{ fontSize: 11 }} tickFormatter={v => ['', 'A', 'BBB', 'BBB-', 'BB+', 'BB'][v] || ''} />
                  <Tooltip content={({ payload }) => payload && payload[0] ? <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', fontSize: 11 }}><strong>{payload[0].payload.name}</strong><br />Rating: {['', 'A', 'BBB', 'BBB-', 'BB+', 'BB'][payload[0].payload.rating]}<br />Volume: {payload[0].payload.volume} Mt</div> : null} />
                  <Scatter data={creditRiskMap} fill={T.sky} fillOpacity={0.7} />
                  <ReferenceLine y={3.5} stroke={T.amber} strokeDasharray="4 2" label={{ value: 'IG/HY boundary', fontSize: 10 }} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Airline Credit Profiles</div>
              {AIRLINES.map(a => (
                <div key={a.name} style={{ padding: '8px 0', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 12 }}>{a.name}</div>
                    <div style={{ fontSize: 11, color: T.sub }}>{a.region} · {a.pathway}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: ['A'].includes(a.creditRating) ? T.green : ['BBB', 'BBB-'].includes(a.creditRating) ? T.sky : T.amber }}>{a.creditRating}</div>
                    <div style={{ fontSize: 11, color: T.sub }}>{a.ltc ? 'LTC Signed' : 'No LTC'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 5 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Global SAF Market Size (Mt)</div>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={[2023, 2025, 2027, 2030, 2035, 2040, 2050].map(yr => ({ year: yr, supply: parseFloat((0.6 + (yr - 2023) * 3.5).toFixed(1)), demand: parseFloat((0.5 + (yr - 2023) * 6.2).toFixed(1)) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit=" Mt" />
                  <Tooltip formatter={v => [`${v} Mt`]} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="supply" name="Supply" fill={T.green} stroke={T.green} fillOpacity={0.3} />
                  <Area type="monotone" dataKey="demand" name="Demand" fill={T.amber} stroke={T.amber} fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Key Market Intelligence</div>
              {[['Global SAF Production 2024', '~0.6 Mt/yr (IEA estimate)'], ['IATA 2030 Target', '2% SAF of total aviation fuel'], ['EU 2030 demand', '~4.8 Mt/yr (ReFuelEU)'], ['IRA impact', '$1.25B/yr credit pool at current scale'], ['Feedstock bottleneck', 'UCO/Tallow supply constrained at ~10 Mt SAF'], ['PtL scale-up', 'Need 200 GW green H₂ for 10% SAF by 2035'], ['Investment needed', '$1.5T cumulative to 2050 (IATA)'], ['CORSIA Phase II', 'Covers ~80% international flights from 2027']].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${T.border}`, fontSize: 12, flexWrap: 'wrap', gap: 4 }}>
                  <span style={{ color: T.sub }}>{k}</span>
                  <span style={{ fontWeight: 600, color: T.text, maxWidth: '55%', textAlign: 'right' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
