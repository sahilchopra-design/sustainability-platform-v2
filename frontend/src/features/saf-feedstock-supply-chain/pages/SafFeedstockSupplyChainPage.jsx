import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const T = { bg: '#FAFAF7', card: '#FFFFFF', border: '#E5E2D9', text: '#1A1A2E', sub: '#6B7280', indigo: '#4F46E5', green: '#065F46', red: '#991B1B', blue: '#1E40AF', amber: '#92400E', teal: '#0F766E', sky: '#0369A1' };
const TABS = ['Supply Overview', 'Feedstock Markets', 'Supply Chain Risk', 'Sustainability Scoring', 'Price Forecasts', 'Supplier Intelligence'];

const FEEDSTOCKS = [
  { id: 'UCO', name: 'Used Cooking Oil (UCO)', pathway: 'HEFA', price2024: 780, price2030: 950, supply_mt: 6.0, growth: 2.5, ci: 28, dbl_count: true, risk: 72, countries: ['EU', 'USA', 'China', 'SE Asia'] },
  { id: 'Tallow', name: 'Animal Tallow', pathway: 'HEFA', price2024: 620, price2030: 680, supply_mt: 4.5, growth: 1.2, ci: 35, dbl_count: true, risk: 55, countries: ['USA', 'Brazil', 'Australia'] },
  { id: 'Cellulosic', name: 'Cellulosic Ethanol', pathway: 'AtJ', price2024: 420, price2030: 360, supply_mt: 120, growth: 8.5, ci: 12, dbl_count: false, risk: 35, countries: ['USA', 'Brazil', 'EU'] },
  { id: 'MSW', name: 'Municipal Solid Waste', pathway: 'FT-MSW', price2024: 80, price2030: 70, supply_mt: 800, growth: 1.8, ci: 5, dbl_count: false, risk: 30, countries: ['USA', 'EU', 'Japan', 'UK'] },
  { id: 'AgriRes', name: 'Agricultural Residues', pathway: 'FT-ATJ', price2024: 95, price2030: 85, supply_mt: 500, growth: 3.2, ci: 8, dbl_count: false, risk: 25, countries: ['USA', 'Brazil', 'India', 'EU'] },
  { id: 'GreenH2', name: 'Green Hydrogen (PtL)', pathway: 'PtL', price2024: 4200, price2030: 2200, supply_mt: 0.05, growth: 95, ci: -70, dbl_count: false, risk: 85, countries: ['Norway', 'Chile', 'UAE', 'Australia'] },
];

const SUPPLIERS = Array.from({ length: 18 }, (_, i) => {
  const fs = FEEDSTOCKS[Math.floor(sr(i * 7 + 1) * FEEDSTOCKS.length)];
  const country = ['USA', 'EU', 'Brazil', 'Australia', 'Malaysia', 'China', 'UK', 'Indonesia'][Math.floor(sr(i * 11 + 2) * 8)];
  const vol_t = Math.round((10000 + sr(i * 13 + 3) * 290000));
  const price = Math.round(fs.price2024 * (0.85 + sr(i * 17 + 4) * 0.35));
  const quality = parseFloat((60 + sr(i * 19 + 5) * 38).toFixed(1));
  const cert = ['ISCC+', 'RSB', 'ISCC', 'REDcert²', 'None'][Math.floor(sr(i * 23 + 6) * 5)];
  const hhi = parseFloat((sr(i * 29 + 7) * 0.8).toFixed(2));
  return { id: i + 1, name: `${country}-${fs.id}-Supplier${i + 1}`, feedstock: fs.id, country, vol_t, price, quality, cert, hhi };
});

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 20px', flex: '1 1 150px' }}>
    <div style={{ fontSize: 11, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.text }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{sub}</div>}
  </div>
);

export default function SafFeedstockSupplyChainPage() {
  const [tab, setTab] = useState(0);
  const [selFeed, setSelFeed] = useState('ALL');
  const [scenYear, setScenYear] = useState(2027);

  const filtered = useMemo(() => SUPPLIERS.filter(s => selFeed === 'ALL' || s.feedstock === selFeed), [selFeed]);
  const avgPrice = useMemo(() => filtered.length ? Math.round(filtered.reduce((s, f) => s + f.price, 0) / filtered.length) : 0, [filtered]);
  const avgQuality = useMemo(() => filtered.length ? (filtered.reduce((s, f) => s + f.quality, 0) / filtered.length).toFixed(1) : '—', [filtered]);
  const totalVol = useMemo(() => filtered.reduce((s, f) => s + f.vol_t, 0), [filtered]);

  const priceForecast = FEEDSTOCKS.map(f => {
    const t = (scenYear - 2024) / 6;
    const forecast = Math.round(f.price2024 + (f.price2030 - f.price2024) * t);
    return { name: f.id, price2024: f.price2024, forecast, price2030: f.price2030 };
  });

  const riskRadar = FEEDSTOCKS.map(f => ({ subject: f.id, risk: f.risk, supply: Math.min(100, Math.round(f.supply_mt / 8)), growth: Math.min(100, Math.round(f.growth * 5)) }));

  const sustainChart = FEEDSTOCKS.map(f => ({
    name: f.id,
    ci: Math.abs(f.ci),
    doubleCount: f.dbl_count ? 80 : 20,
    risk: 100 - f.risk,
  }));

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: 'Inter, sans-serif', color: T.text }}>
      <div style={{ background: '#0C1A2E', padding: '20px 32px', borderBottom: `3px solid ${T.sky}` }}>
        <div style={{ fontSize: 11, color: '#94A3B8', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>EP-EF3 · SAF Finance Suite</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: '#F1F5F9' }}>SAF Feedstock & Supply Chain Analytics</div>
        <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>UCO · Tallow · Cellulosic · MSW · AgriRes · Green H₂ · 18 Suppliers · ISCC+ · RSB</div>
      </div>
      <div style={{ background: '#0C1A2E', display: 'flex', gap: 0, padding: '0 32px', borderBottom: `1px solid #1E3A5F` }}>
        {TABS.map((t, i) => <button key={t} onClick={() => setTab(i)} style={{ padding: '12px 18px', fontSize: 12, fontWeight: tab === i ? 700 : 400, color: tab === i ? T.sky : '#94A3B8', background: 'none', border: 'none', borderBottom: tab === i ? `2px solid ${T.sky}` : '2px solid transparent', cursor: 'pointer', whiteSpace: 'nowrap' }}>{t}</button>)}
      </div>
      <div style={{ padding: '28px 32px' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          <KpiCard label="Avg Feedstock Price" value={`$${avgPrice}/t`} sub="Filtered suppliers" color={T.sky} />
          <KpiCard label="Suppliers" value={filtered.length} sub={`${totalVol.toLocaleString()} t vol`} color={T.indigo} />
          <KpiCard label="Avg Quality Score" value={`${avgQuality}/100`} sub="Cert + supply chain" color={T.green} />
          <KpiCard label="Forecast Year" value={scenYear} sub="Price forecast" color={T.amber} />
          <KpiCard label="Fastest Growing" value="Green H₂" sub="+95%/yr to 2030" color={T.teal} />
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          <select value={selFeed} onChange={e => setSelFeed(e.target.value)} style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: '7px 12px', fontSize: 12, background: T.card, color: T.text }}>
            <option value="ALL">All Feedstocks</option>
            {FEEDSTOCKS.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.sub }}>
            <span>Forecast Year: {scenYear}</span>
            <input type="range" min={2024} max={2030} value={scenYear} onChange={e => setScenYear(+e.target.value)} style={{ width: 100 }} />
          </div>
        </div>

        {tab === 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Global SAF Feedstock Supply (Mt/yr)</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={FEEDSTOCKS.map(f => ({ name: f.id, supply: f.supply_mt, growth: f.growth }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="l" tick={{ fontSize: 11 }} unit=" Mt" />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} unit="%/yr" />
                  <Tooltip />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="l" dataKey="supply" name="Supply (Mt)" fill={T.sky} />
                  <Bar yAxisId="r" dataKey="growth" name="Growth %/yr" fill={T.green} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Feedstock Carbon Intensities (gCO₂eq/MJ)</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={FEEDSTOCKS.map(f => ({ name: f.id, ci: f.ci }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit=" gCO₂/MJ" />
                  <Tooltip formatter={v => [`${v} gCO₂/MJ`, 'CI']} />
                  <Bar dataKey="ci" name="Carbon Intensity" fill={T.teal} radius={[4, 4, 0, 0]} />
                  <ReferenceLine y={0} stroke={T.border} />
                  <ReferenceLine y={89} stroke={T.amber} strokeDasharray="4 2" label={{ value: 'Jet-A baseline', fontSize: 10 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 1 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Feedstock Market Data</div>
              {FEEDSTOCKS.map(f => (
                <div key={f.id} style={{ padding: '10px 0', borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{f.name}</div>
                  <div style={{ display: 'flex', gap: 14, fontSize: 11, color: T.sub, marginTop: 4, flexWrap: 'wrap' }}>
                    <span>Pathway: {f.pathway}</span>
                    <span style={{ color: T.amber, fontWeight: 600 }}>${f.price2024}/t</span>
                    <span>Supply: {f.supply_mt < 10 ? f.supply_mt : f.supply_mt} Mt/yr</span>
                    <span>CI: {f.ci} gCO₂/MJ</span>
                    <span>Double count: {f.dbl_count ? '✓' : '—'}</span>
                  </div>
                  <div style={{ fontSize: 11, color: T.sub, marginTop: 3 }}>Countries: {f.countries.join(', ')}</div>
                </div>
              ))}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Supplier Table</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead><tr style={{ background: '#F8F7F4' }}>
                    {['Supplier', 'Feedstock', 'Country', 'Vol (t)', 'Price $/t', 'Quality', 'Cert'].map(h => <th key={h} style={{ padding: '7px 10px', textAlign: 'left', color: T.sub, fontWeight: 600 }}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {filtered.map((s, i) => (
                      <tr key={s.id} style={{ borderTop: `1px solid ${T.border}`, background: i % 2 ? '#FAFAF7' : T.card }}>
                        <td style={{ padding: '7px 10px', fontWeight: 500 }}>{s.name}</td>
                        <td style={{ padding: '7px 10px', color: T.sub }}>{s.feedstock}</td>
                        <td style={{ padding: '7px 10px' }}>{s.country}</td>
                        <td style={{ padding: '7px 10px' }}>{s.vol_t.toLocaleString()}</td>
                        <td style={{ padding: '7px 10px', fontWeight: 600 }}>${s.price}</td>
                        <td style={{ padding: '7px 10px', color: s.quality > 80 ? T.green : T.amber }}>{s.quality}</td>
                        <td style={{ padding: '7px 10px' }}>{s.cert}</td>
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
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Supply Chain Risk Radar</div>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={riskRadar} outerRadius={100}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                  <Radar name="Risk" dataKey="risk" stroke={T.red} fill={T.red} fillOpacity={0.2} />
                  <Radar name="Supply" dataKey="supply" stroke={T.sky} fill={T.sky} fillOpacity={0.2} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Supply Concentration (HHI) Risk</div>
              {FEEDSTOCKS.map(f => (
                <div key={f.id} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                    <span>{f.id}</span>
                    <span style={{ color: f.risk > 70 ? T.red : f.risk > 45 ? T.amber : T.green, fontWeight: 600 }}>Risk: {f.risk}</span>
                  </div>
                  <div style={{ background: T.border, borderRadius: 4, height: 8, overflow: 'hidden' }}>
                    <div style={{ width: `${f.risk}%`, background: f.risk > 70 ? T.red : f.risk > 45 ? T.amber : T.green, height: '100%', borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 3 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Sustainability Score Components</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={sustainChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="ci" name="Low CI Score" stackId="a" fill={T.green} />
                  <Bar dataKey="doubleCount" name="Double Count Eligible" stackId="a" fill={T.sky} />
                  <Bar dataKey="risk" name="Supply Chain Safety" stackId="a" fill={T.teal} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Certification Landscape</div>
              {[{ cert: 'ISCC+ (International Sustainability & Carbon Certification Plus)', scope: 'All pathways', markets: 'EU, UK, Japan', premium: '+$30–80/t' }, { cert: 'RSB (Roundtable on Sustainable Biomaterials)', scope: 'HEFA, AtJ, FT', markets: 'Global', premium: '+$20–50/t' }, { cert: 'ISCC EU', scope: 'EU-regulatory only', markets: 'EU', premium: '+$15–40/t' }, { cert: 'REDcert²', scope: 'EU', markets: 'EU', premium: '+$10–30/t' }, { cert: 'CORSIA eligible', scope: 'All ASTM D7566', markets: 'ICAO', premium: '+$5–25/t' }].map(c => (
                <div key={c.cert} style={{ padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ fontWeight: 600, fontSize: 12 }}>{c.cert}</div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 11, color: T.sub, marginTop: 3 }}>
                    <span>{c.scope}</span><span>{c.markets}</span><span style={{ color: T.green }}>{c.premium}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 4 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Price Forecast to 2030 ($/t)</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={priceForecast}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit=" $/t" />
                  <Tooltip formatter={v => [`$${v}/t`]} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="price2024" name="2024 Price" fill={T.sky} />
                  <Bar dataKey="forecast" name={`${scenYear} Forecast`} fill={T.amber} />
                  <Bar dataKey="price2030" name="2030 Base" fill={T.green} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>UCO Price Scenario Analysis</div>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={Array.from({ length: 7 }, (_, i) => {
                  const yr = 2024 + i;
                  return { year: yr, base: Math.round(780 + i * 25), bull: Math.round(780 + i * 45), bear: Math.round(780 + i * 10) };
                })}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit=" $/t" />
                  <Tooltip formatter={v => [`$${v}/t`]} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="bull" name="Bull" stroke={T.green} fill={T.green} fillOpacity={0.1} />
                  <Area type="monotone" dataKey="base" name="Base" stroke={T.sky} fill={T.sky} fillOpacity={0.15} />
                  <Area type="monotone" dataKey="bear" name="Bear" stroke={T.red} fill={T.red} fillOpacity={0.1} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 5 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Key Supplier Intelligence ({filtered.length} suppliers)</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              {filtered.map(s => (
                <div key={s.id} style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: 14 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</div>
                  <div style={{ color: T.sub, fontSize: 11, marginTop: 4 }}>{s.feedstock} · {s.country}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12 }}>
                    <span>Vol: <strong>{s.vol_t.toLocaleString()} t</strong></span>
                    <span>Price: <strong style={{ color: T.amber }}>${s.price}/t</strong></span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 12 }}>
                    <span>Quality: <strong style={{ color: s.quality > 80 ? T.green : T.amber }}>{s.quality}</strong></span>
                    <span>Cert: <strong>{s.cert}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
