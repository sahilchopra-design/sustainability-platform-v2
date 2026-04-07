import React, { useState, useMemo, useEffect } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend, ReferenceLine
} from 'recharts';

const T = {
  bg: '#f6f4f0', surface: '#ffffff', border: '#e5e0d8', navy: '#1b3a5c',
  gold: '#c5a96a', textSec: '#5c6b7e', textMut: '#9aa3ae',
  red: '#dc2626', green: '#16a34a', amber: '#d97706', blue: '#2563eb',
  orange: '#ea580c', purple: '#7c3aed', teal: '#0891b2',
  card: '#ffffff', sub: '#5c6b7e', indigo: '#4f46e5', font: "'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono: "'JetBrains Mono','SF Mono','Fira Code',monospace",
};

// ─── Simulated live carbon price data ───────────────────────────────────────
function sr(seed) { let x = Math.sin(seed + 1) * 10000; return x - Math.floor(x); }

const MARKETS = [
  { id: 'eu_ets', name: 'EU ETS', currency: '\u20ac', base: 68.5, vol: 2.8, color: T.blue, unit: '/tCO\u2082' },
  { id: 'uk_ets', name: 'UK ETS', currency: '\u00a3', base: 42.3, vol: 3.1, color: T.teal, unit: '/tCO\u2082' },
  { id: 'ca_cap', name: 'California CaT', currency: '$', base: 38.7, vol: 1.2, color: T.green, unit: '/tCO\u2082' },
  { id: 'rggi', name: 'RGGI', currency: '$', base: 15.4, vol: 0.8, color: T.purple, unit: '/tCO\u2082' },
  { id: 'kr_ets', name: 'Korea ETS', currency: '\u20a9', base: 8200, vol: 450, color: T.orange, unit: '/tCO\u2082' },
  { id: 'cn_ets', name: 'China National ETS', currency: '\u00a5', base: 72.5, vol: 5.2, color: T.red, unit: '/tCO\u2082' },
  { id: 'nz_ets', name: 'NZ ETS', currency: 'NZ$', base: 52.1, vol: 4.5, color: T.navy, unit: '/tCO\u2082' },
  { id: 'vcm', name: 'VCM (Nature-Based Avg)', currency: '$', base: 8.20, vol: 1.8, color: '#059669', unit: '/tCO\u2082' },
];

function generatePriceHistory(market, days = 90) {
  const data = [];
  let price = market.base * 0.92;
  for (let i = 0; i < days; i++) {
    const change = (sr(i * 17 + market.base * 100) - 0.48) * market.vol;
    price = Math.max(price * 0.85, price + change);
    const d = new Date(2026, 0, 5 + i);
    data.push({
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      price: Math.round(price * 100) / 100,
      volume: Math.round(50000 + sr(i * 31 + market.base) * 200000),
      high: Math.round((price + sr(i * 7) * market.vol) * 100) / 100,
      low: Math.round((price - sr(i * 11) * market.vol) * 100) / 100,
    });
  }
  return data;
}

// ─── Portfolio carbon cost exposure ─────────────────────────────────────────
const PORTFOLIO_EXPOSURE = [
  { sector: 'Power Generation', allowances_mt: 12.5, market: 'eu_ets', cost_mn: 856, pct_revenue: 8.2 },
  { sector: 'Steel & Iron', allowances_mt: 4.2, market: 'eu_ets', cost_mn: 288, pct_revenue: 12.5 },
  { sector: 'Cement', allowances_mt: 3.1, market: 'eu_ets', cost_mn: 212, pct_revenue: 15.8 },
  { sector: 'Aviation', allowances_mt: 1.8, market: 'eu_ets', cost_mn: 123, pct_revenue: 2.1 },
  { sector: 'Chemicals', allowances_mt: 2.4, market: 'eu_ets', cost_mn: 164, pct_revenue: 5.4 },
  { sector: 'Refining', allowances_mt: 5.6, market: 'eu_ets', cost_mn: 384, pct_revenue: 6.8 },
  { sector: 'US Power', allowances_mt: 3.2, market: 'ca_cap', cost_mn: 124, pct_revenue: 4.1 },
  { sector: 'UK Industrial', allowances_mt: 1.4, market: 'uk_ets', cost_mn: 59, pct_revenue: 7.3 },
];

// ─── Price alerts ───────────────────────────────────────────────────────────
const ALERTS = [
  { ts: '14:32', market: 'EU ETS', type: 'BREACH', msg: 'EU ETS breached \u20ac70/tCO\u2082 resistance level \u2014 highest since Q3 2023', severity: 'HIGH' },
  { ts: '11:15', market: 'China ETS', type: 'VOLUME', msg: 'China ETS daily volume 2.4x 30-day average \u2014 sector expansion speculation', severity: 'MEDIUM' },
  { ts: '09:48', market: 'VCM', type: 'DROP', msg: 'VCM nature-based average dropped 12% WoW on ICVCM quality concerns', severity: 'HIGH' },
  { ts: '08:22', market: 'RGGI', type: 'POLICY', msg: 'Virginia considering RGGI re-entry \u2014 potential +15% allowance demand', severity: 'MEDIUM' },
  { ts: 'Yesterday', market: 'UK ETS', type: 'POLICY', msg: 'UK CBAM consultation closed \u2014 implementation expected H2 2027', severity: 'LOW' },
  { ts: '2d ago', market: 'EU ETS', type: 'MSR', msg: 'Market Stability Reserve intake reduces auction volume by 24% in Q2', severity: 'HIGH' },
];

const FORWARD_CURVES = [
  { tenor: 'Spot', eu: 68.5, uk: 42.3, ca: 38.7 },
  { tenor: '1M', eu: 69.2, uk: 42.8, ca: 38.9 },
  { tenor: '3M', eu: 71.4, uk: 43.5, ca: 39.4 },
  { tenor: '6M', eu: 74.8, uk: 45.2, ca: 40.1 },
  { tenor: '1Y', eu: 79.5, uk: 48.1, ca: 41.8 },
  { tenor: '2Y', eu: 88.2, uk: 54.5, ca: 44.2 },
  { tenor: '3Y', eu: 98.4, uk: 61.2, ca: 47.5 },
  { tenor: '5Y', eu: 118.5, uk: 72.8, ca: 52.1 },
];

const severityColor = s => ({ HIGH: T.red, MEDIUM: T.amber, LOW: T.green }[s] || T.textMut);

const TABS = ['Market Overview', 'Price Charts', 'Forward Curves', 'Portfolio Exposure', 'Alerts & Signals', 'NGFS Overlay'];

export default function LiveCarbonPriceMonitorPage() {
  const [tab, setTab] = useState(0);
  const [selectedMarket, setSelectedMarket] = useState(MARKETS[0]);
  const [timeRange, setTimeRange] = useState(90);

  // Simulated "live" price tick
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 5000);
    return () => clearInterval(id);
  }, []);

  const livePrices = useMemo(() => MARKETS.map(m => {
    const jitter = (sr(tick * 13 + m.base * 7) - 0.5) * m.vol * 0.3;
    const price = m.base + jitter;
    const change = jitter;
    const changePct = (change / m.base * 100);
    return { ...m, livePrice: Math.round(price * 100) / 100, change: Math.round(change * 100) / 100, changePct: Math.round(changePct * 100) / 100 };
  }), [tick]);

  const priceHistory = useMemo(() => generatePriceHistory(selectedMarket, timeRange), [selectedMarket, timeRange]);

  const totalCarbonCost = PORTFOLIO_EXPOSURE.reduce((s, e) => s + e.cost_mn, 0);

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh' }}>
      <div style={{ background: T.navy, padding: '24px 32px 0', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ color: T.gold, fontFamily: T.mono, fontSize: 11, letterSpacing: 2, marginBottom: 4 }}>EP-CY1 \u00b7 LIVE CARBON PRICE MONITOR</div>
            <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: 0 }}>Live Carbon Price Monitor</h1>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>
              8 Carbon Markets \u00b7 Real-Time Prices \u00b7 Forward Curves \u00b7 Portfolio Exposure \u00b7 NGFS Overlay
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e', animation: 'pulse 2s infinite' }} />
            <span style={{ color: '#22c55e', fontFamily: T.mono, fontSize: 11, fontWeight: 700 }}>LIVE</span>
            <span style={{ color: '#94a3b8', fontFamily: T.mono, fontSize: 10 }}>Refresh: 5s</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 0 }}>
          {TABS.map((t2, i) => (
            <button key={i} onClick={() => setTab(i)} style={{
              padding: '10px 18px', border: 'none', background: 'transparent', cursor: 'pointer',
              color: tab === i ? T.gold : '#94a3b8', fontWeight: tab === i ? 700 : 400, fontSize: 13,
              borderBottom: tab === i ? `2px solid ${T.gold}` : '2px solid transparent'
            }}>{t2}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 32px 32px' }}>

        {/* ══ TAB 0: Market Overview ══ */}
        {tab === 0 && (
          <div style={{ paddingTop: 24 }}>
            {/* Live price ticker strip */}
            <div style={{ display: 'flex', gap: 1, marginBottom: 20, overflowX: 'auto' }}>
              {livePrices.map(m => (
                <div key={m.id} onClick={() => { setSelectedMarket(MARKETS.find(mk => mk.id === m.id)); setTab(1); }} style={{
                  flex: 1, minWidth: 130, background: T.surface, border: `1px solid ${T.border}`,
                  borderRadius: 8, padding: '12px 14px', cursor: 'pointer',
                  borderTop: `3px solid ${m.color}`, transition: 'box-shadow 0.2s',
                }}>
                  <div style={{ fontSize: 10, color: T.textMut, fontWeight: 600, marginBottom: 4 }}>{m.name}</div>
                  <div style={{ fontFamily: T.mono, fontSize: 20, fontWeight: 700, color: T.navy }}>
                    {m.currency}{m.livePrice.toLocaleString()}
                  </div>
                  <div style={{ fontFamily: T.mono, fontSize: 11, fontWeight: 700, color: m.change >= 0 ? T.green : T.red, marginTop: 2 }}>
                    {m.change >= 0 ? '\u25b2' : '\u25bc'} {m.change >= 0 ? '+' : ''}{m.change} ({m.changePct >= 0 ? '+' : ''}{m.changePct}%)
                  </div>
                </div>
              ))}
            </div>

            {/* Portfolio summary KPIs */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Total Carbon Cost', value: `$${Math.round(totalCarbonCost)}M`, sub: 'Annual portfolio allowance cost', color: T.red },
                { label: 'EU ETS Exposure', value: `${PORTFOLIO_EXPOSURE.filter(e => e.market === 'eu_ets').reduce((s, e) => s + e.allowances_mt, 0).toFixed(1)}Mt`, sub: 'Annual allowance need', color: T.blue },
                { label: 'Highest % Revenue', value: `${Math.max(...PORTFOLIO_EXPOSURE.map(e => e.pct_revenue))}%`, sub: 'Cement sector most exposed', color: T.amber },
                { label: 'Markets Tracked', value: '8', sub: 'Compliance + Voluntary', color: T.teal },
                { label: 'Active Alerts', value: String(ALERTS.filter(a => a.severity === 'HIGH').length), sub: 'HIGH severity', color: T.red },
              ].map(k => (
                <div key={k.label} style={{ flex: 1, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 18px' }}>
                  <div style={{ fontFamily: T.mono, fontSize: 24, fontWeight: 700, color: k.color }}>{k.value}</div>
                  <div style={{ color: T.textSec, fontSize: 11, marginTop: 2 }}>{k.label}</div>
                  <div style={{ color: T.textMut, fontSize: 10, marginTop: 2 }}>{k.sub}</div>
                </div>
              ))}
            </div>

            {/* Market comparison chart */}
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20 }}>
              <h3 style={{ color: T.navy, margin: '0 0 14px', fontSize: 14 }}>Carbon Price Comparison — Normalised (Base = 100)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={Array.from({ length: 90 }, (_, i) => {
                  const row = { day: i + 1 };
                  MARKETS.slice(0, 5).forEach(m => {
                    const hist = generatePriceHistory(m, 90);
                    row[m.id] = Math.round((hist[i].price / hist[0].price) * 10000) / 100;
                  });
                  return row;
                })}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} label={{ value: 'Days', fontSize: 10, position: 'bottom' }} />
                  <YAxis domain={[90, 115]} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <ReferenceLine y={100} stroke={T.textMut} strokeDasharray="4 4" />
                  {MARKETS.slice(0, 5).map(m => (
                    <Line key={m.id} type="monotone" dataKey={m.id} name={m.name} stroke={m.color} strokeWidth={2} dot={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ══ TAB 1: Price Charts ══ */}
        {tab === 1 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {MARKETS.map(m => (
                  <button key={m.id} onClick={() => setSelectedMarket(m)} style={{
                    padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    border: `1px solid ${selectedMarket.id === m.id ? m.color : T.border}`,
                    background: selectedMarket.id === m.id ? m.color + '15' : 'transparent',
                    color: selectedMarket.id === m.id ? m.color : T.textSec,
                  }}>{m.name}</button>
                ))}
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                {[30, 60, 90].map(d => (
                  <button key={d} onClick={() => setTimeRange(d)} style={{
                    padding: '4px 10px', borderRadius: 4, fontSize: 10, fontWeight: 600, cursor: 'pointer',
                    border: `1px solid ${timeRange === d ? T.navy : T.border}`,
                    background: timeRange === d ? T.navy : 'transparent',
                    color: timeRange === d ? '#fff' : T.textSec,
                  }}>{d}D</button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* Price + Volume chart */}
              <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20 }}>
                <h3 style={{ color: T.navy, margin: '0 0 4px', fontSize: 14 }}>{selectedMarket.name} — Price History</h3>
                <div style={{ fontFamily: T.mono, fontSize: 28, fontWeight: 700, color: selectedMarket.color, marginBottom: 12 }}>
                  {selectedMarket.currency}{priceHistory[priceHistory.length - 1]?.price}{selectedMarket.unit}
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <ComposedChart data={priceHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="date" tick={{ fontSize: 9 }} interval={Math.floor(timeRange / 8)} />
                    <YAxis yAxisId="price" tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                    <YAxis yAxisId="vol" orientation="right" tick={{ fontSize: 9 }} hide />
                    <Tooltip />
                    <Bar yAxisId="vol" dataKey="volume" fill={T.border} opacity={0.5} />
                    <Area yAxisId="price" type="monotone" dataKey="price" stroke={selectedMarket.color} fill={selectedMarket.color + '15'} strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* High-Low range chart */}
              <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20 }}>
                <h3 style={{ color: T.navy, margin: '0 0 4px', fontSize: 14 }}>{selectedMarket.name} — Daily Range (High/Low)</h3>
                <p style={{ color: T.textSec, fontSize: 11, margin: '0 0 12px' }}>Intraday price range with volatility indicator</p>
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={priceHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="date" tick={{ fontSize: 9 }} interval={Math.floor(timeRange / 8)} />
                    <YAxis tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                    <Tooltip />
                    <Area type="monotone" dataKey="high" stroke={T.red} fill={T.red + '10'} strokeWidth={1} />
                    <Area type="monotone" dataKey="low" stroke={T.green} fill={T.green + '10'} strokeWidth={1} />
                    <Area type="monotone" dataKey="price" stroke={selectedMarket.color} fill="transparent" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Market stats table */}
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20, marginTop: 16 }}>
              <h3 style={{ color: T.navy, margin: '0 0 14px', fontSize: 14 }}>Market Statistics</h3>
              <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.navy }}>
                    {['Market', 'Spot', 'Change', 'Change %', '30D High', '30D Low', '30D Vol', 'YTD'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', color: '#fff', textAlign: h === 'Market' ? 'left' : 'center', fontSize: 10 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {livePrices.map((m, i) => {
                    const hist = generatePriceHistory(m, 30);
                    const high30 = Math.max(...hist.map(h => h.high));
                    const low30 = Math.min(...hist.map(h => h.low));
                    return (
                      <tr key={m.id} style={{ background: i % 2 === 0 ? T.bg : T.surface, borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '8px 12px', fontWeight: 700, color: T.navy }}>
                          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: m.color, marginRight: 8 }} />
                          {m.name}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'center', fontFamily: T.mono, fontWeight: 700 }}>{m.currency}{m.livePrice}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'center', fontFamily: T.mono, fontWeight: 700, color: m.change >= 0 ? T.green : T.red }}>
                          {m.change >= 0 ? '+' : ''}{m.change}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'center', fontFamily: T.mono, fontWeight: 700, color: m.changePct >= 0 ? T.green : T.red }}>
                          {m.changePct >= 0 ? '+' : ''}{m.changePct}%
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'center', fontFamily: T.mono, color: T.textSec }}>{m.currency}{high30.toFixed(2)}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'center', fontFamily: T.mono, color: T.textSec }}>{m.currency}{low30.toFixed(2)}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'center', fontFamily: T.mono, color: T.textSec }}>{m.vol.toFixed(1)}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'center', fontFamily: T.mono, fontWeight: 700, color: T.green }}>+{(sr(m.base * 3) * 25 + 5).toFixed(1)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══ TAB 2: Forward Curves ══ */}
        {tab === 2 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20 }}>
                <h3 style={{ color: T.navy, margin: '0 0 14px', fontSize: 14 }}>Forward Curve — EU ETS vs UK ETS vs California</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={FORWARD_CURVES}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="tenor" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v, n) => [`${n === 'eu' ? '\u20ac' : n === 'uk' ? '\u00a3' : '$'}${v}`, n === 'eu' ? 'EU ETS' : n === 'uk' ? 'UK ETS' : 'California']} />
                    <Legend />
                    <Line type="monotone" dataKey="eu" name="EU ETS (\u20ac)" stroke={T.blue} strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="uk" name="UK ETS (\u00a3)" stroke={T.teal} strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="ca" name="California ($)" stroke={T.green} strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20 }}>
                <h3 style={{ color: T.navy, margin: '0 0 14px', fontSize: 14 }}>EU ETS Forward — Contango Structure</h3>
                <p style={{ color: T.textSec, fontSize: 11, margin: '0 0 12px' }}>
                  Forward prices imply {((FORWARD_CURVES[FORWARD_CURVES.length - 1].eu / FORWARD_CURVES[0].eu - 1) * 100).toFixed(1)}% premium over 5 years
                  \u2014 reflecting expected MSR tightening and CBAM implementation
                </p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={FORWARD_CURVES}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="tenor" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={v => [`\u20ac${v}`, 'EU ETS Forward']} />
                    <Bar dataKey="eu" name="EU ETS Forward (\u20ac)" radius={[6, 6, 0, 0]}>
                      {FORWARD_CURVES.map((_, i) => <Cell key={i} fill={i === 0 ? T.blue : T.blue + (80 + i * 10).toString(16)} />)}
                    </Bar>
                    <ReferenceLine y={FORWARD_CURVES[0].eu} stroke={T.red} strokeDasharray="4 4" label={{ value: 'Spot', fill: T.red, fontSize: 10 }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Forward curve table */}
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20 }}>
              <h3 style={{ color: T.navy, margin: '0 0 14px', fontSize: 14 }}>Forward Curve Data</h3>
              <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.navy }}>
                    {['Tenor', 'EU ETS (\u20ac)', 'vs Spot', 'UK ETS (\u00a3)', 'vs Spot', 'California ($)', 'vs Spot'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', color: '#fff', textAlign: 'center', fontSize: 10 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {FORWARD_CURVES.map((f, i) => (
                    <tr key={f.tenor} style={{ background: i % 2 === 0 ? T.bg : T.surface, borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 700, color: T.navy }}>{f.tenor}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'center', fontFamily: T.mono, fontWeight: 700 }}>\u20ac{f.eu}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'center', fontFamily: T.mono, color: f.eu > FORWARD_CURVES[0].eu ? T.green : T.textMut }}>
                        {i === 0 ? '\u2014' : `+${((f.eu / FORWARD_CURVES[0].eu - 1) * 100).toFixed(1)}%`}
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'center', fontFamily: T.mono, fontWeight: 700 }}>\u00a3{f.uk}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'center', fontFamily: T.mono, color: f.uk > FORWARD_CURVES[0].uk ? T.green : T.textMut }}>
                        {i === 0 ? '\u2014' : `+${((f.uk / FORWARD_CURVES[0].uk - 1) * 100).toFixed(1)}%`}
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'center', fontFamily: T.mono, fontWeight: 700 }}>${f.ca}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'center', fontFamily: T.mono, color: f.ca > FORWARD_CURVES[0].ca ? T.green : T.textMut }}>
                        {i === 0 ? '\u2014' : `+${((f.ca / FORWARD_CURVES[0].ca - 1) * 100).toFixed(1)}%`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══ TAB 3: Portfolio Exposure ══ */}
        {tab === 3 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Total Carbon Cost', value: `$${Math.round(totalCarbonCost)}M`, color: T.red },
                { label: 'Allowances Needed', value: `${PORTFOLIO_EXPOSURE.reduce((s, e) => s + e.allowances_mt, 0).toFixed(1)}Mt`, color: T.navy },
                { label: 'Highest Sector Impact', value: 'Cement (15.8%)', color: T.amber },
                { label: 'EU ETS Share', value: `${Math.round(PORTFOLIO_EXPOSURE.filter(e => e.market === 'eu_ets').reduce((s, e) => s + e.cost_mn, 0) / totalCarbonCost * 100)}%`, color: T.blue },
              ].map(k => (
                <div key={k.label} style={{ flex: 1, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 18px', textAlign: 'center' }}>
                  <div style={{ fontFamily: T.mono, fontSize: 22, fontWeight: 700, color: k.color }}>{k.value}</div>
                  <div style={{ color: T.textSec, fontSize: 11, marginTop: 4 }}>{k.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20 }}>
                <h3 style={{ color: T.navy, margin: '0 0 14px', fontSize: 14 }}>Carbon Cost by Sector ($M)</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={[...PORTFOLIO_EXPOSURE].sort((a, b) => b.cost_mn - a.cost_mn)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="sector" tick={{ fontSize: 9 }} width={120} />
                    <Tooltip formatter={v => [`$${v}M`, 'Carbon Cost']} />
                    <Bar dataKey="cost_mn" radius={[0, 6, 6, 0]}>
                      {PORTFOLIO_EXPOSURE.sort((a, b) => b.cost_mn - a.cost_mn).map((_, i) =>
                        <Cell key={i} fill={[T.red, T.orange, T.amber, T.blue, T.teal, T.green, T.purple, T.navy][i]} />
                      )}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20 }}>
                <h3 style={{ color: T.navy, margin: '0 0 14px', fontSize: 14 }}>Carbon Cost as % Revenue</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={[...PORTFOLIO_EXPOSURE].sort((a, b) => b.pct_revenue - a.pct_revenue)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis type="number" domain={[0, 20]} tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="sector" tick={{ fontSize: 9 }} width={120} />
                    <Tooltip formatter={v => [`${v}%`, '% of Revenue']} />
                    <Bar dataKey="pct_revenue" radius={[0, 6, 6, 0]}>
                      {PORTFOLIO_EXPOSURE.sort((a, b) => b.pct_revenue - a.pct_revenue).map((e, i) =>
                        <Cell key={i} fill={e.pct_revenue > 10 ? T.red : e.pct_revenue > 6 ? T.amber : T.green} />
                      )}
                    </Bar>
                    <ReferenceLine x={10} stroke={T.red} strokeDasharray="4 4" label={{ value: 'Material', fill: T.red, fontSize: 10 }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Exposure table */}
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20 }}>
              <h3 style={{ color: T.navy, margin: '0 0 14px', fontSize: 14 }}>Portfolio Carbon Cost Exposure</h3>
              <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.navy }}>
                    {['Sector', 'Market', 'Allowances (Mt)', 'Cost ($M)', '% Revenue', 'Price Sensitivity (\u00b110%)'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', color: '#fff', textAlign: h === 'Sector' ? 'left' : 'center', fontSize: 10 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PORTFOLIO_EXPOSURE.map((e, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? T.bg : T.surface, borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '8px 12px', fontWeight: 700, color: T.navy }}>{e.sector}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'center', color: T.textSec }}>{MARKETS.find(m => m.id === e.market)?.name}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'center', fontFamily: T.mono }}>{e.allowances_mt}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'center', fontFamily: T.mono, fontWeight: 700, color: T.navy }}>${e.cost_mn}M</td>
                      <td style={{ padding: '8px 12px', textAlign: 'center', fontFamily: T.mono, fontWeight: 700, color: e.pct_revenue > 10 ? T.red : e.pct_revenue > 6 ? T.amber : T.green }}>{e.pct_revenue}%</td>
                      <td style={{ padding: '8px 12px', textAlign: 'center', fontFamily: T.mono, color: T.red }}>\u00b1${Math.round(e.cost_mn * 0.1)}M</td>
                    </tr>
                  ))}
                  <tr style={{ background: T.navy + '11', fontWeight: 700 }}>
                    <td style={{ padding: '8px 12px', fontWeight: 700, color: T.navy }}>TOTAL</td>
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>—</td>
                    <td style={{ padding: '8px 12px', textAlign: 'center', fontFamily: T.mono, fontWeight: 700 }}>{PORTFOLIO_EXPOSURE.reduce((s, e) => s + e.allowances_mt, 0).toFixed(1)}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'center', fontFamily: T.mono, fontWeight: 700, color: T.red }}>${Math.round(totalCarbonCost)}M</td>
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>—</td>
                    <td style={{ padding: '8px 12px', textAlign: 'center', fontFamily: T.mono, color: T.red }}>\u00b1${Math.round(totalCarbonCost * 0.1)}M</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══ TAB 4: Alerts & Signals ══ */}
        {tab === 4 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ color: T.navy, margin: 0, fontSize: 15 }}>Carbon Price Alerts & Market Signals</h3>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['HIGH', 'MEDIUM', 'LOW'].map(s => (
                    <span key={s} style={{ background: severityColor(s) + '22', color: severityColor(s), padding: '3px 10px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>
                      {s}: {ALERTS.filter(a => a.severity === s).length}
                    </span>
                  ))}
                </div>
              </div>

              {ALERTS.map((a, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 14, alignItems: 'flex-start', padding: '12px 0',
                  borderBottom: i < ALERTS.length - 1 ? `1px solid ${T.border}` : 'none',
                }}>
                  <span style={{
                    padding: '3px 10px', borderRadius: 4, fontSize: 9, fontWeight: 700,
                    background: severityColor(a.severity) + '22', color: severityColor(a.severity), whiteSpace: 'nowrap',
                  }}>{a.severity}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontFamily: T.mono, fontSize: 10, color: T.textMut }}>{a.ts}</span>
                      <span style={{ background: T.navy + '11', color: T.navy, padding: '1px 6px', borderRadius: 3, fontSize: 9, fontWeight: 700 }}>{a.market}</span>
                      <span style={{ background: T.teal + '15', color: T.teal, padding: '1px 6px', borderRadius: 3, fontSize: 9, fontWeight: 600 }}>{a.type}</span>
                    </div>
                    <div style={{ fontSize: 12, color: T.navy, lineHeight: 1.5 }}>{a.msg}</div>
                  </div>
                  <button style={{ padding: '4px 10px', borderRadius: 4, border: `1px solid ${T.border}`, background: 'transparent', color: T.textSec, fontSize: 10, cursor: 'pointer' }}>Dismiss</button>
                </div>
              ))}
            </div>

            {/* Alert configuration */}
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24, marginTop: 16 }}>
              <h3 style={{ color: T.navy, margin: '0 0 14px', fontSize: 14 }}>Alert Configuration</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {[
                  { label: 'Price Breach', desc: 'Alert when any market breaches support/resistance level', active: true },
                  { label: 'Volume Spike', desc: 'Alert when daily volume exceeds 2x 30-day average', active: true },
                  { label: 'Policy Change', desc: 'Alert on regulatory announcements affecting carbon markets', active: true },
                  { label: 'MSR Adjustment', desc: 'Alert on EU Market Stability Reserve intake changes', active: true },
                  { label: 'VCM Quality', desc: 'Alert on voluntary market quality/integrity concerns', active: false },
                  { label: 'Cross-Market Spread', desc: 'Alert when EU ETS / UK ETS spread exceeds threshold', active: false },
                ].map(c => (
                  <div key={c.label} style={{ padding: 14, background: T.bg, borderRadius: 8, border: `1px solid ${T.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, color: T.navy, fontSize: 12 }}>{c.label}</span>
                      <span style={{
                        width: 36, height: 18, borderRadius: 9, background: c.active ? T.green : T.border,
                        position: 'relative', display: 'inline-block',
                      }}>
                        <span style={{
                          width: 14, height: 14, borderRadius: '50%', background: '#fff',
                          position: 'absolute', top: 2, left: c.active ? 20 : 2, transition: 'left 0.2s',
                        }} />
                      </span>
                    </div>
                    <div style={{ fontSize: 10, color: T.textSec, lineHeight: 1.5 }}>{c.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ TAB 5: NGFS Overlay ══ */}
        {tab === 5 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24 }}>
              <h3 style={{ color: T.navy, margin: '0 0 4px', fontSize: 15 }}>NGFS Carbon Price Pathways — EU ETS Overlay</h3>
              <p style={{ color: T.textSec, fontSize: 12, margin: '0 0 16px' }}>
                Current spot price overlaid on 5 NGFS Phase 5 long-term carbon price scenarios
              </p>
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={[
                  { year: 2024, spot: 68, cp: 55, dt: 48, b2c: 62, dnz: 58, nz: 68 },
                  { year: 2025, spot: null, cp: 58, dt: 52, b2c: 72, dnz: 65, nz: 82 },
                  { year: 2026, spot: null, cp: 60, dt: 55, b2c: 82, dnz: 75, nz: 98 },
                  { year: 2028, spot: null, cp: 62, dt: 60, b2c: 95, dnz: 88, nz: 125 },
                  { year: 2030, spot: null, cp: 65, dt: 68, b2c: 112, dnz: 105, nz: 155 },
                  { year: 2035, spot: null, cp: 72, dt: 95, b2c: 150, dnz: 140, nz: 220 },
                  { year: 2040, spot: null, cp: 78, dt: 140, b2c: 185, dnz: 175, nz: 280 },
                  { year: 2050, spot: null, cp: 85, dt: 180, b2c: 250, dnz: 240, nz: 400 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} label={{ value: '\u20ac/tCO\u2082', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                  <Tooltip formatter={(v, n) => [v ? `\u20ac${v}` : null, { cp: 'Current Policies', dt: 'Delayed Transition', b2c: 'Below 2\u00b0C', dnz: 'Divergent NZ', nz: 'Net Zero 2050', spot: 'Spot Price' }[n]]} />
                  <Legend />
                  <Area type="monotone" dataKey="nz" name="Net Zero 2050" stroke={T.green} fill={T.green + '10'} strokeWidth={2} />
                  <Area type="monotone" dataKey="b2c" name="Below 2\u00b0C" stroke={T.teal} fill={T.teal + '08'} strokeWidth={2} />
                  <Area type="monotone" dataKey="dnz" name="Divergent NZ" stroke={T.amber} fill="transparent" strokeWidth={1.5} strokeDasharray="4 4" />
                  <Area type="monotone" dataKey="dt" name="Delayed Transition" stroke={T.orange} fill="transparent" strokeWidth={1.5} strokeDasharray="4 4" />
                  <Area type="monotone" dataKey="cp" name="Current Policies" stroke={T.red} fill={T.red + '06'} strokeWidth={2} />
                  <Line type="monotone" dataKey="spot" name="Spot Price" stroke={T.navy} strokeWidth={3} dot={{ r: 6, fill: T.navy }} connectNulls={false} />
                  <ReferenceLine x={2024} stroke={T.gold} strokeDasharray="4 4" label={{ value: 'Today', fill: T.gold, fontSize: 10 }} />
                </AreaChart>
              </ResponsiveContainer>

              <div style={{ marginTop: 16, padding: 16, background: T.bg, borderRadius: 8 }}>
                <div style={{ fontWeight: 700, color: T.navy, fontSize: 13, marginBottom: 8 }}>Key Insight</div>
                <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.7 }}>
                  Current EU ETS spot price (\u20ac68.5) sits between the Below 2\u00b0C and Net Zero 2050 pathways for 2024, suggesting the market is pricing in a transition scenario more ambitious than Current Policies but less aggressive than full Net Zero.
                  Under Net Zero 2050, prices are projected to reach \u20ac155 by 2030 and \u20ac400 by 2050.
                  The portfolio's annual carbon cost of ${Math.round(totalCarbonCost)}M would approximately double under NZ2050 by 2030.
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
