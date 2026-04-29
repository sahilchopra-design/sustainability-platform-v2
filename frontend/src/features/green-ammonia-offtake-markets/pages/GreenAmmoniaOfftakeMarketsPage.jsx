import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, PieChart, Pie,
  ScatterChart, Scatter, ZAxis
} from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const T = {
  bg: '#F7F6F2', card: '#FFFFFF', border: '#E5E2D9',
  text: '#1A1A2E', sub: '#6B7280', accent: '#B8860B',
  green: '#065F46', red: '#991B1B', blue: '#1E40AF',
  teal: '#0F766E', amber: '#92400E', navy: '#0F172A',
  indigo: '#4F46E5', gold: '#C59A1E', sage: '#4A7C59',
  font: "'DM Sans',system-ui,sans-serif"
};

const MARKETS = [
  { sector: 'Fertiliser - Urea', endUse: 'fertiliser', volumeMt_2030_potential: 8.5, currentPrice_usd_t: 310, willingness_to_pay_usd_t: 360, priceGap_usd_t: 0, policySupport: 3, marketReadiness: 5, country: 'Global' },
  { sector: 'Fertiliser - Nitric Acid', endUse: 'fertiliser', volumeMt_2030_potential: 4.2, currentPrice_usd_t: 290, willingness_to_pay_usd_t: 340, priceGap_usd_t: 0, policySupport: 3, marketReadiness: 4, country: 'EU' },
  { sector: 'Marine Fuel - VLSFO Sub', endUse: 'shipping_fuel', volumeMt_2030_potential: 6.0, currentPrice_usd_t: 650, willingness_to_pay_usd_t: 750, priceGap_usd_t: 80, policySupport: 4, marketReadiness: 3, country: 'International' },
  { sector: 'Marine Fuel - Bulk Carrier', endUse: 'shipping_fuel', volumeMt_2030_potential: 3.5, currentPrice_usd_t: 620, willingness_to_pay_usd_t: 720, priceGap_usd_t: 90, policySupport: 4, marketReadiness: 2, country: 'Japan' },
  { sector: 'Power - NH3 Co-firing', endUse: 'power_generation', volumeMt_2030_potential: 3.0, currentPrice_usd_t: 450, willingness_to_pay_usd_t: 550, priceGap_usd_t: 30, policySupport: 5, marketReadiness: 4, country: 'Japan' },
  { sector: 'Power - NH3 Co-firing', endUse: 'power_generation', volumeMt_2030_potential: 1.5, currentPrice_usd_t: 420, willingness_to_pay_usd_t: 510, priceGap_usd_t: 40, policySupport: 4, marketReadiness: 3, country: 'South Korea' },
  { sector: 'Power - Dedicated NH3', endUse: 'power_generation', volumeMt_2030_potential: 0.8, currentPrice_usd_t: 480, willingness_to_pay_usd_t: 600, priceGap_usd_t: 0, policySupport: 3, marketReadiness: 2, country: 'Germany' },
  { sector: 'Industrial - Steel DRI', endUse: 'industrial_feedstock', volumeMt_2030_potential: 2.5, currentPrice_usd_t: 380, willingness_to_pay_usd_t: 440, priceGap_usd_t: 50, policySupport: 4, marketReadiness: 2, country: 'EU' },
  { sector: 'H2 Carrier - Reconv.', endUse: 'hydrogen_carrier', volumeMt_2030_potential: 4.0, currentPrice_usd_t: 700, willingness_to_pay_usd_t: 850, priceGap_usd_t: 60, policySupport: 5, marketReadiness: 2, country: 'Germany' },
  { sector: 'H2 Carrier - Japan', endUse: 'hydrogen_carrier', volumeMt_2030_potential: 3.0, currentPrice_usd_t: 680, willingness_to_pay_usd_t: 820, priceGap_usd_t: 70, policySupport: 5, marketReadiness: 3, country: 'Japan' },
  { sector: 'Refining - Desulph.', endUse: 'industrial_feedstock', volumeMt_2030_potential: 2.0, currentPrice_usd_t: 340, willingness_to_pay_usd_t: 390, priceGap_usd_t: 30, policySupport: 2, marketReadiness: 3, country: 'Global' },
  { sector: 'Chemicals - Caprolactam', endUse: 'industrial_feedstock', volumeMt_2030_potential: 0.5, currentPrice_usd_t: 360, willingness_to_pay_usd_t: 420, priceGap_usd_t: 40, policySupport: 2, marketReadiness: 3, country: 'EU' },
  { sector: 'Shipping - Container', endUse: 'shipping_fuel', volumeMt_2030_potential: 2.5, currentPrice_usd_t: 670, willingness_to_pay_usd_t: 780, priceGap_usd_t: 100, policySupport: 4, marketReadiness: 2, country: 'International' },
  { sector: 'Aviation - SAF indirect', endUse: 'industrial_feedstock', volumeMt_2030_potential: 1.0, currentPrice_usd_t: 580, willingness_to_pay_usd_t: 700, priceGap_usd_t: 120, policySupport: 3, marketReadiness: 1, country: 'EU' },
  { sector: 'Fertiliser - AN', endUse: 'fertiliser', volumeMt_2030_potential: 3.5, currentPrice_usd_t: 300, willingness_to_pay_usd_t: 350, priceGap_usd_t: 0, policySupport: 3, marketReadiness: 5, country: 'Global' },
  { sector: 'Mining - Blasting', endUse: 'industrial_feedstock', volumeMt_2030_potential: 1.2, currentPrice_usd_t: 320, willingness_to_pay_usd_t: 370, priceGap_usd_t: 10, policySupport: 2, marketReadiness: 4, country: 'Australia' },
  { sector: 'Power - Peaker plants', endUse: 'power_generation', volumeMt_2030_potential: 0.6, currentPrice_usd_t: 520, willingness_to_pay_usd_t: 650, priceGap_usd_t: 20, policySupport: 3, marketReadiness: 2, country: 'USA' },
  { sector: 'Marine - Tanker', endUse: 'shipping_fuel', volumeMt_2030_potential: 1.8, currentPrice_usd_t: 640, willingness_to_pay_usd_t: 740, priceGap_usd_t: 95, policySupport: 4, marketReadiness: 2, country: 'International' },
  { sector: 'H2 - Mobility (bus)', endUse: 'hydrogen_carrier', volumeMt_2030_potential: 0.3, currentPrice_usd_t: 720, willingness_to_pay_usd_t: 900, priceGap_usd_t: 50, policySupport: 4, marketReadiness: 2, country: 'EU' },
  { sector: 'Fertiliser - India', endUse: 'fertiliser', volumeMt_2030_potential: 5.0, currentPrice_usd_t: 280, willingness_to_pay_usd_t: 330, priceGap_usd_t: 0, policySupport: 4, marketReadiness: 4, country: 'India' },
  { sector: 'Steel - Korea DRI', endUse: 'industrial_feedstock', volumeMt_2030_potential: 1.5, currentPrice_usd_t: 400, willingness_to_pay_usd_t: 460, priceGap_usd_t: 60, policySupport: 4, marketReadiness: 2, country: 'South Korea' },
  { sector: 'Power - Germany', endUse: 'power_generation', volumeMt_2030_potential: 1.2, currentPrice_usd_t: 500, willingness_to_pay_usd_t: 620, priceGap_usd_t: 20, policySupport: 4, marketReadiness: 2, country: 'Germany' },
  { sector: 'Chemicals - Nylon', endUse: 'industrial_feedstock', volumeMt_2030_potential: 0.4, currentPrice_usd_t: 370, willingness_to_pay_usd_t: 430, priceGap_usd_t: 45, policySupport: 2, marketReadiness: 3, country: 'Global' },
  { sector: 'H2 - Industrial heat', endUse: 'hydrogen_carrier', volumeMt_2030_potential: 2.2, currentPrice_usd_t: 660, willingness_to_pay_usd_t: 800, priceGap_usd_t: 55, policySupport: 4, marketReadiness: 2, country: 'EU' },
  { sector: 'Mining - Chile', endUse: 'industrial_feedstock', volumeMt_2030_potential: 0.9, currentPrice_usd_t: 310, willingness_to_pay_usd_t: 360, priceGap_usd_t: 15, policySupport: 3, marketReadiness: 3, country: 'Chile' },
];

const END_USE_COLORS = {
  fertiliser: T.green,
  shipping_fuel: T.blue,
  power_generation: T.amber,
  industrial_feedstock: T.teal,
  hydrogen_carrier: T.indigo,
};

const TABS = ['Market Sizing', 'Fertiliser Sector', 'Shipping Fuel Demand', 'Power Generation', 'Industrial & Export', 'Price Premium Analysis'];

const KpiCard = ({ label, value, unit, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 18px', minWidth: 150 }}>
    <div style={{ fontSize: 11, color: T.sub, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.text }}>{value}</div>
    {unit && <div style={{ fontSize: 11, color: T.sub }}>{unit}</div>}
  </div>
);

export default function GreenAmmoniaOfftakeMarketsPage() {
  const [tab, setTab] = useState(0);
  const [endUseFilter, setEndUseFilter] = useState('All');
  const [countryFilter, setCountryFilter] = useState('All');

  const countries = useMemo(() => ['All', ...Array.from(new Set(MARKETS.map(m => m.country)))], []);
  const endUses = ['All', 'fertiliser', 'shipping_fuel', 'power_generation', 'industrial_feedstock', 'hydrogen_carrier'];

  const filtered = useMemo(() => {
    let d = MARKETS;
    if (endUseFilter !== 'All') d = d.filter(m => m.endUse === endUseFilter);
    if (countryFilter !== 'All') d = d.filter(m => m.country === countryFilter);
    return d;
  }, [endUseFilter, countryFilter]);

  const totalVolume = useMemo(() => filtered.reduce((a, b) => a + b.volumeMt_2030_potential, 0), [filtered]);
  const avgWTP = useMemo(() => filtered.length ? filtered.reduce((a, b) => a + b.willingness_to_pay_usd_t, 0) / filtered.length : 0, [filtered]);
  const avgReadiness = useMemo(() => filtered.length ? filtered.reduce((a, b) => a + b.marketReadiness, 0) / filtered.length : 0, [filtered]);

  // By end-use aggregation
  const endUseSummary = useMemo(() => {
    const groups = {};
    MARKETS.forEach(m => {
      if (!groups[m.endUse]) groups[m.endUse] = { endUse: m.endUse, volume: 0, count: 0, wtpSum: 0 };
      groups[m.endUse].volume += m.volumeMt_2030_potential;
      groups[m.endUse].count += 1;
      groups[m.endUse].wtpSum += m.willingness_to_pay_usd_t;
    });
    return Object.values(groups).map(g => ({ ...g, avgWTP: g.count ? Math.round(g.wtpSum / g.count) : 0 }));
  }, []);

  // Japan shipping demand projection
  const japanDemand = useMemo(() =>
    [2023, 2025, 2027, 2028, 2030, 2032, 2035].map((yr, i) => ({
      yr,
      cofiring: Math.round(0.1 + i * 0.4 + sr(i * 9) * 0.2),
      dedicated: Math.round(Math.max(0, i * 0.15 - 0.3 + sr(i * 13) * 0.1)),
      shipping: Math.round(Math.max(0, i * 0.12 - 0.2 + sr(i * 7) * 0.1)),
    })),
    []);

  // Price gap scatter
  const priceGapData = useMemo(() =>
    MARKETS.map((m, i) => ({
      wtp: m.willingness_to_pay_usd_t,
      readiness: m.marketReadiness,
      volume: m.volumeMt_2030_potential,
      name: m.sector,
      endUse: m.endUse,
    })),
    []);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: T.font, padding: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <span style={{ background: T.indigo, color: '#fff', borderRadius: 6, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>EP-EE3</span>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text, margin: 0 }}>Green Ammonia Offtake Market Intelligence</h1>
        </div>
        <p style={{ color: T.sub, fontSize: 13, margin: 0 }}>25 end-use sectors · global demand ~185 Mt/yr (2023) · Japan 2030 target: 3 Mt/yr co-firing · Source: IEA, IRENA, Yara, IMO GHG Strategy 2023</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div>
          <label style={{ fontSize: 12, color: T.sub, marginRight: 6 }}>End Use</label>
          <select value={endUseFilter} onChange={e => setEndUseFilter(e.target.value)}
            style={{ border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 8px', fontSize: 13, background: T.card }}>
            {endUses.map(v => <option key={v}>{v}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, color: T.sub, marginRight: 6 }}>Country/Region</label>
          <select value={countryFilter} onChange={e => setCountryFilter(e.target.value)}
            style={{ border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 8px', fontSize: 13, background: T.card }}>
            {countries.map(v => <option key={v}>{v}</option>)}
          </select>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
        <KpiCard label="2030 Volume Potential" value={`${totalVolume.toFixed(1)} Mt`} unit="filtered segments" color={T.indigo} />
        <KpiCard label="Avg Willingness to Pay" value={`$${Math.round(avgWTP)}`} unit="USD/t NH3" color={T.green} />
        <KpiCard label="Avg Market Readiness" value={`${avgReadiness.toFixed(1)}/5`} unit="1=low, 5=high" color={T.teal} />
        <KpiCard label="Total NH3 Demand (2023)" value="~185 Mt" unit="global (all grades)" color={T.text} />
        <KpiCard label="Green Share Target 2030" value="~30 Mt" unit="IEA Net Zero pathway" color={T.amber} />
        <KpiCard label="Segments (filtered)" value={filtered.length} unit="of 25" />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)}
            style={{ padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: tab === i ? 700 : 400, background: tab === i ? T.indigo : T.card, color: tab === i ? '#fff' : T.text }}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab 0: Market Sizing */}
      {tab === 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>2030 Green NH3 Demand by End Use (Mt/yr)</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={[...endUseSummary].sort((a, b) => b.volume - a.volume)}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="endUse" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={55} />
                <YAxis tick={{ fontSize: 11 }} unit=" Mt" />
                <Tooltip />
                <Bar dataKey="volume" name="Volume Mt/yr 2030">
                  {endUseSummary.map((s, i) => <Cell key={i} fill={END_USE_COLORS[s.endUse] || T.sub} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Demand Share by Sector (2030 potential)</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={endUseSummary} dataKey="volume" nameKey="endUse" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>
                  {endUseSummary.map((s, i) => <Cell key={i} fill={END_USE_COLORS[s.endUse] || T.sub} />)}
                </Pie>
                <Tooltip formatter={v => [`${v.toFixed(1)} Mt`, 'Volume']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}`, gridColumn: '1/-1' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Market Segments — Full View</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.bg }}>
                    {['Sector', 'End Use', 'Country', 'Vol 2030 (Mt)', 'Current $/t', 'WTP $/t', 'Policy (1-5)', 'Readiness (1-5)'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.sub, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...filtered].sort((a, b) => b.volumeMt_2030_potential - a.volumeMt_2030_potential).map((m, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.card : T.bg }}>
                      <td style={{ padding: '7px 10px', fontWeight: 600, color: T.text }}>{m.sector}</td>
                      <td style={{ padding: '7px 10px' }}>
                        <span style={{ background: '#F0F9F4', color: END_USE_COLORS[m.endUse] || T.sub, borderRadius: 4, padding: '2px 6px', fontSize: 11 }}>{m.endUse.replace(/_/g, ' ')}</span>
                      </td>
                      <td style={{ padding: '7px 10px', color: T.sub }}>{m.country}</td>
                      <td style={{ padding: '7px 10px', fontWeight: 700 }}>{m.volumeMt_2030_potential.toFixed(1)}</td>
                      <td style={{ padding: '7px 10px' }}>${m.currentPrice_usd_t}</td>
                      <td style={{ padding: '7px 10px', color: T.green, fontWeight: 600 }}>${m.willingness_to_pay_usd_t}</td>
                      <td style={{ padding: '7px 10px' }}>{'★'.repeat(m.policySupport)}</td>
                      <td style={{ padding: '7px 10px' }}>{'●'.repeat(m.marketReadiness)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 1: Fertiliser */}
      {tab === 1 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}`, gridColumn: '1/-1' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Fertiliser Demand — Global Green NH3 Outlook (Mt/yr)</h3>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={[2022, 2024, 2026, 2028, 2030, 2032, 2035, 2040, 2050].map((yr, i) => ({
                yr,
                greenNH3: Math.round(0.5 + i * 2.2 + sr(i * 7) * 0.8),
                greyNH3: Math.round(145 - i * 5 + sr(i * 11) * 3),
                blueNH3: Math.round(5 + i * 2.5 + sr(i * 13) * 1),
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="yr" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit=" Mt" />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="greyNH3" stackId="a" stroke={T.sub} fill="#F3F4F6" name="Grey NH3" />
                <Area type="monotone" dataKey="blueNH3" stackId="a" stroke={T.blue} fill="#DBEAFE" name="Blue NH3" />
                <Area type="monotone" dataKey="greenNH3" stackId="a" stroke={T.green} fill="#D1FAE5" name="Green NH3" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Key Fertiliser Markets — Premium Acceptance</h3>
            {[
              { market: 'EU (CBAM 2026)', currentPremium: '$40-80/t', driver: 'CBAM carbon levy on non-green', readiness: 4 },
              { market: 'India (subsidy reform)', currentPremium: '$20-50/t', driver: 'Urea subsidy restructuring', readiness: 3 },
              { market: 'USA (IRA §45V)', currentPremium: '$60-100/t', driver: 'ITC for green fertiliser plants', readiness: 3 },
              { market: 'Japan (GoF mandate)', currentPremium: '$30-60/t', driver: 'Green food labelling premium', readiness: 3 },
              { market: 'Australia', currentPremium: '$25-55/t', driver: 'Carbon farming credits', readiness: 3 },
            ].map((m, i) => (
              <div key={i} style={{ background: T.bg, borderRadius: 8, padding: 10, marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, color: T.text, fontSize: 13 }}>{m.market}</span>
                  <span style={{ color: T.green, fontWeight: 600, fontSize: 12 }}>{m.currentPremium}</span>
                </div>
                <div style={{ fontSize: 11, color: T.sub }}>{m.driver}</div>
              </div>
            ))}
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>CBAM Fertiliser Impact (EU 2026+)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={[
                { country: 'Russia', carbonCost: 85, volume_mt: 3.2 },
                { country: 'Egypt', carbonCost: 72, volume_mt: 0.8 },
                { country: 'Algeria', carbonCost: 68, volume_mt: 0.5 },
                { country: 'Saudi Arabia', carbonCost: 75, volume_mt: 0.4 },
                { country: 'Qatar', carbonCost: 70, volume_mt: 0.3 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="country" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} unit=" $/t" />
                <Tooltip />
                <Bar dataKey="carbonCost" fill={T.red} name="CBAM levy est. $/t" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 2: Shipping Fuel */}
      {tab === 2 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}`, gridColumn: '1/-1' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Green NH3 as Shipping Fuel — IMO 2023 GHG Strategy Pathway (Mt/yr)</h3>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={[2023, 2025, 2027, 2030, 2032, 2035, 2040, 2050].map((yr, i) => ({
                yr,
                nh3Fuel: Math.round(0.05 + i * 0.9 + sr(i * 7) * 0.4),
                methanol: Math.round(0.1 + i * 0.7 + sr(i * 11) * 0.3),
                lng: Math.round(8 + i * 1.5 + sr(i * 13) * 0.5),
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="yr" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit=" Mt" />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="lng" stroke={T.sub} fill="#F3F4F6" name="LNG (ref)" />
                <Area type="monotone" dataKey="methanol" stroke={T.teal} fill="#CCFBF1" name="Methanol/e-methanol" />
                <Area type="monotone" dataKey="nh3Fuel" stroke={T.green} fill="#D1FAE5" name="NH3 fuel" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>NH3 Fuel — Key Parameters</h3>
            {[
              { param: 'Energy density (LHV)', value: '18.8 MJ/kg', note: 'vs. MGO 42.7 MJ/kg (44% lower)' },
              { param: 'GHG intensity (WtW)', value: '0 gCO2e/MJ', note: 'Green NH3, full chain' },
              { param: 'Fuel cost premium', value: '+$200-400/t oil-equiv', note: 'vs. VLSFO 2025 prices' },
              { param: 'Engine modification', value: '$2-8M per vessel', note: 'Dual-fuel retrofit cost' },
              { param: 'NOx emissions', value: 'High without SCR', note: 'Requires SCR or EGR system' },
              { param: 'FuelEU penalty avoided', value: '€100-200/tCO2', note: 'EU shipping ETS from 2024' },
              { param: 'IMO CII benefit', value: 'A-rating achievable', note: 'Carbon Intensity Indicator' },
            ].map((p, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${T.border}`, padding: '7px 0', fontSize: 12 }}>
                <div>
                  <div style={{ fontWeight: 600, color: T.text }}>{p.param}</div>
                  <div style={{ color: T.sub, fontSize: 11 }}>{p.note}</div>
                </div>
                <div style={{ fontWeight: 700, color: T.green, whiteSpace: 'nowrap', marginLeft: 8 }}>{p.value}</div>
              </div>
            ))}
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Shipping Segment Demand Potential 2030 (Mt/yr)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={MARKETS.filter(m => m.endUse === 'shipping_fuel').map(m => ({ name: m.sector, volume: m.volumeMt_2030_potential, wtp: m.willingness_to_pay_usd_t }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={55} />
                <YAxis tick={{ fontSize: 11 }} unit=" Mt" />
                <Tooltip />
                <Bar dataKey="volume" fill={T.blue} name="Volume Mt/yr" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 3: Power Generation */}
      {tab === 3 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Japan NH3 Co-Firing Demand Ramp (Mt/yr)</h3>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={japanDemand}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="yr" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit=" Mt" />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="cofiring" stroke={T.amber} fill="#FEF3C7" name="Co-firing (20% mix)" stackId="a" />
                <Area type="monotone" dataKey="dedicated" stroke={T.green} fill="#D1FAE5" name="Dedicated NH3 power" stackId="a" />
                <Area type="monotone" dataKey="shipping" stroke={T.blue} fill="#DBEAFE" name="Marine bunkering" stackId="a" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Power Sector Programs</h3>
            {[
              { country: 'Japan', program: 'Green Innovation Fund', target: '3 Mt/yr by 2030', cofiring: '20% (rising to 50%)', budget: '¥2 trillion (~$14bn)' },
              { country: 'South Korea', program: 'CCUS-NH3 Policy', target: '1.5 Mt/yr by 2030', cofiring: '20% coal plants', budget: 'KRW 8 trillion (~$6bn)' },
              { country: 'Germany', program: 'H2Global Import', target: '~0.5-1 Mt/yr by 2030', cofiring: 'Gas turbine blending', budget: '€900M H2Global' },
              { country: 'Australia', program: 'ARENA + CEFC', target: 'Export focus', cofiring: 'Limited domestic', budget: 'A$3bn over 10yr' },
            ].map((p, i) => (
              <div key={i} style={{ background: T.bg, borderRadius: 8, padding: 10, marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, color: T.text }}>{p.country}</span>
                  <span style={{ fontSize: 11, color: T.amber, fontWeight: 600 }}>{p.target}</span>
                </div>
                <div style={{ fontSize: 12, color: T.sub }}>{p.program} · {p.budget}</div>
                <div style={{ fontSize: 11, color: T.text, marginTop: 3 }}>Co-firing: {p.cofiring}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Industrial & Export */}
      {tab === 4 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Industrial Use Volume 2030 (Mt/yr)</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={MARKETS.filter(m => m.endUse === 'industrial_feedstock').map(m => ({ name: m.sector.slice(0, 14), vol: m.volumeMt_2030_potential })).sort((a, b) => b.vol - a.vol)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize: 10 }} unit=" Mt" />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={120} />
                <Tooltip />
                <Bar dataKey="vol" fill={T.teal} name="Volume Mt/yr" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Hydrogen Carrier Demand (Mt NH3 equiv.)</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={MARKETS.filter(m => m.endUse === 'hydrogen_carrier').map(m => ({ name: m.sector.slice(0, 16), vol: m.volumeMt_2030_potential, wtp: m.willingness_to_pay_usd_t }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={55} />
                <YAxis tick={{ fontSize: 11 }} unit=" Mt" />
                <Tooltip />
                <Bar dataKey="vol" fill={T.indigo} name="Volume Mt/yr" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 5: Price Premium Analysis */}
      {tab === 5 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}`, gridColumn: '1/-1' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>WTP vs. Market Readiness (bubble = volume Mt/yr)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="readiness" name="Market Readiness" domain={[0.5, 5.5]} tick={{ fontSize: 10 }} label={{ value: 'Market Readiness (1-5)', position: 'insideBottom', offset: -5, fontSize: 11 }} />
                <YAxis dataKey="wtp" name="WTP $/t" tick={{ fontSize: 10 }} unit="$/t" domain={[250, 950]} />
                <ZAxis dataKey="volume" range={[30, 200]} name="Volume Mt" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(v, n) => [n === 'WTP $/t' ? `$${v}/t` : n === 'Market Readiness' ? `${v}/5` : `${v} Mt`, n]} />
                <Scatter data={priceGapData}>
                  {priceGapData.map((p, i) => <Cell key={i} fill={END_USE_COLORS[p.endUse] || T.sub} />)}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>WTP vs. Current Price by Sector</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={[...MARKETS].sort((a, b) => b.willingness_to_pay_usd_t - a.willingness_to_pay_usd_t).slice(0, 8).map(m => ({ name: m.sector.slice(0, 12), current: m.currentPrice_usd_t, wtp: m.willingness_to_pay_usd_t }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-25} textAnchor="end" height={55} />
                <YAxis tick={{ fontSize: 11 }} unit="$/t" />
                <Tooltip />
                <Legend />
                <Bar dataKey="current" fill={T.sub} name="Current NH3 price" />
                <Bar dataKey="wtp" fill={T.green} name="Willingness to pay" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Policy Support Score by Segment</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={[...MARKETS].sort((a, b) => b.policySupport - a.policySupport).slice(0, 10).map(m => ({ name: m.sector.slice(0, 14), policy: m.policySupport, readiness: m.marketReadiness }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-25} textAnchor="end" height={55} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 5]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="policy" fill={T.indigo} name="Policy support" />
                <Bar dataKey="readiness" fill={T.teal} name="Market readiness" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div style={{ marginTop: 20, fontSize: 11, color: T.sub, textAlign: 'center' }}>
        EP-EE3 · Sources: IEA Ammonia Technology Roadmap (2021), IRENA (2022), Yara/CF Industries, IMO GHG Strategy 2023, Japan GIF Program
      </div>
    </div>
  );
}
