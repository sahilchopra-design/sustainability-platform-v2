import React, { useState, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, ReferenceLine
} from 'recharts';

const T = {
  bg: '#f6f4f0', surface: '#ffffff', border: '#e5e0d8', navy: '#1b3a5c',
  navyL: '#2c5a8c', gold: '#c5a96a', textSec: '#5c6b7e', textMut: '#9aa3ae',
  red: '#dc2626', green: '#16a34a', amber: '#d97706', blue: '#2563eb',
  orange: '#ea580c', purple: '#7c3aed', teal: '#0891b2', sage: '#5a8a6a',
  font: "'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono: "'JetBrains Mono','SF Mono','Fira Code',monospace"
};

const NGFS = ['Current Policies', 'Delayed Transition', 'Below 2C', 'Net Zero 2050', 'Divergent NZ'];
const NGFS_COLORS = { 'Current Policies': T.red, 'Delayed Transition': T.orange, 'Below 2C': T.amber, 'Net Zero 2050': T.green, 'Divergent NZ': T.blue };

function buildForwardCurve(basePrice, scenario, months = 60) {
  const trends = {
    'Current Policies':    { drift: 0.002, vol: 0.03, peakYear: 8 },
    'Delayed Transition':  { drift: 0.001, vol: 0.04, peakYear: 6 },
    'Below 2C':           { drift: -0.003, vol: 0.035, peakYear: 4 },
    'Net Zero 2050':      { drift: -0.006, vol: 0.04, peakYear: 3 },
    'Divergent NZ':       { drift: -0.004, vol: 0.05, peakYear: 5 },
  };
  const t = trends[scenario];
  return Array.from({ length: months }, (_, i) => {
    const m = i + 1;
    const decayFactor = scenario.includes('Net Zero') || scenario.includes('2C') ? Math.max(0.3, 1 - m / (t.peakYear * 12)) : 1 + t.drift * m;
    const price = basePrice * decayFactor * (1 + (Math.sin(m / 6) * t.vol * 0.5));
    return { month: m, price: +price.toFixed(2) };
  });
}

const COMMODITIES = {
  brent: { name: 'Brent Crude', base: 82, unit: '$/bbl', color: T.navy },
  wti: { name: 'WTI Crude', base: 78, unit: '$/bbl', color: T.blue },
  ttf: { name: 'EU TTF Gas', base: 28, unit: 'EUR/MWh', color: T.teal },
  hh: { name: 'Henry Hub Gas', base: 2.8, unit: '$/MMBtu', color: T.green },
  coal: { name: 'Newcastle Coal', base: 130, unit: '$/t', color: T.red },
  carbon: { name: 'EU ETS Carbon', base: 65, unit: 'EUR/tCO2', color: T.purple },
};

const SPREADS = [
  { name: 'Crack (Oil->Gas)', long: 'brent', short: 'Gasoline', base: 18.5, unit: '$/bbl', color: T.orange },
  { name: 'Dark (Coal->Power)', long: 'Power', short: 'coal', base: 22.0, unit: 'EUR/MWh', color: T.red },
  { name: 'Spark (Gas->Power)', long: 'Power', short: 'ttf', base: 15.5, unit: 'EUR/MWh', color: T.teal },
  { name: 'Clean Spark', long: 'Power', short: 'ttf+carbon', base: 8.2, unit: 'EUR/MWh', color: T.green },
];

function computeClimatePremium(basePrice, scenario, months) {
  const premiumPct = {
    'Current Policies': 0.02, 'Delayed Transition': 0.08, 'Below 2C': 0.15, 'Net Zero 2050': 0.25, 'Divergent NZ': 0.18
  };
  return Array.from({ length: months }, (_, i) => {
    const m = i + 1;
    const fundamental = basePrice * (1 + Math.sin(m / 12) * 0.05);
    const premium = basePrice * premiumPct[scenario] * (m / months);
    return { month: m, fundamental: +fundamental.toFixed(2), premium: +premium.toFixed(2), total: +(fundamental - premium).toFixed(2) };
  });
}

function blackScholes76(F, K, r, T_years, sigma) {
  const d1 = (Math.log(F / K) + 0.5 * sigma * sigma * T_years) / (sigma * Math.sqrt(T_years));
  const d2 = d1 - sigma * Math.sqrt(T_years);
  const Nd1 = 0.5 * (1 + erf(d1 / Math.sqrt(2)));
  const Nd2 = 0.5 * (1 + erf(d2 / Math.sqrt(2)));
  return Math.exp(-r * T_years) * (F * Nd1 - K * Nd2);
}
function erf(x) { const a = [0.254829592, -0.284496736, 1.421413741, -1.453152027, 1.061405429]; const p = 0.3275911; const s = x >= 0 ? 1 : -1; const t = 1 / (1 + p * Math.abs(x)); const y = 1 - (((((a[4] * t + a[3]) * t) + a[2]) * t + a[1]) * t + a[0]) * t * Math.exp(-x * x); return s * y; }

const TABS = ['Energy Curve Dashboard', 'Contango/Backwardation Under Transition', 'Commodity Options Pricing', 'Cross-Commodity Spreads', 'Hedging Strategy Builder', 'Climate Premium Decomposition'];
const card = { background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20, marginBottom: 16 };
const kpi = (label, value, sub, color = T.navy) => (
  <div style={{ background: T.surface, borderRadius: 8, border: `1px solid ${T.border}`, padding: '14px 18px', minWidth: 140, flex: 1 }}>
    <div style={{ fontFamily: T.mono, fontSize: 11, color: T.textMut, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{sub}</div>}
  </div>
);

export default function CommodityDerivativesClimatePage() {
  const [tab, setTab] = useState(0);
  const [scenario, setScenario] = useState('Net Zero 2050');
  const [commodity, setCommodity] = useState('brent');
  const [optStrike, setOptStrike] = useState(80);
  const [optExpiry, setOptExpiry] = useState(1);
  const [hedgeNotional, setHedgeNotional] = useState(100);
  const [alertPrice, setAlertPrice] = useState(70);

  const comm = COMMODITIES[commodity];
  const curveData = useMemo(() => buildForwardCurve(comm.base, scenario, 60), [comm.base, scenario]);

  const allScenarioCurves = useMemo(() => {
    const months = 60;
    return Array.from({ length: months }, (_, i) => {
      const row = { month: i + 1 };
      NGFS.forEach(s => { row[s] = buildForwardCurve(comm.base, s, months)[i].price; });
      return row;
    });
  }, [comm.base]);

  const contangoData = useMemo(() => {
    return curveData.map((d, i) => ({
      month: d.month,
      price: d.price,
      structure: i > 0 ? +(d.price - curveData[i - 1].price).toFixed(2) : 0,
    }));
  }, [curveData]);

  const volSurface = useMemo(() => {
    const strikes = [0.8, 0.9, 0.95, 1.0, 1.05, 1.1, 1.2];
    const expiries = [0.25, 0.5, 1.0, 2.0, 3.0];
    const baseVol = scenario === 'Net Zero 2050' ? 0.40 : scenario === 'Divergent NZ' ? 0.45 : 0.30;
    return expiries.map(exp => {
      const row = { expiry: `${exp}Y` };
      strikes.forEach(k => {
        const skew = Math.abs(k - 1.0) * 0.15;
        const termStruc = Math.sqrt(exp) * 0.05;
        row[`K${(k * 100).toFixed(0)}%`] = +((baseVol + skew + termStruc) * 100).toFixed(1);
      });
      return row;
    });
  }, [scenario]);

  const spreadData = useMemo(() =>
    SPREADS.map(sp => ({
      ...sp,
      ...Object.fromEntries(NGFS.map(s => {
        const factor = s === 'Net Zero 2050' ? -0.6 : s === 'Below 2C' ? -0.3 : s === 'Current Policies' ? 0.1 : 0;
        return [s, +(sp.base * (1 + factor)).toFixed(1)];
      }))
    })), []);

  const premiumData = useMemo(() => computeClimatePremium(comm.base, scenario, 36), [comm.base, scenario]);

  const hedgeStrategies = [
    { name: 'Put Spread', desc: 'Buy ATM put, sell OTM put', cost: +(comm.base * 0.04).toFixed(2), protection: '80-100%', maxLoss: 'Premium paid' },
    { name: 'Collar', desc: 'Buy put floor, sell call cap', cost: +(comm.base * 0.01).toFixed(2), protection: 'Floor to Cap', maxLoss: 'Capped upside' },
    { name: 'Swap (Fixed)', desc: 'Lock in fixed price', cost: 0, protection: '100% locked', maxLoss: 'Opportunity cost' },
    { name: 'Asian Option', desc: 'Avg price over period', cost: +(comm.base * 0.03).toFixed(2), protection: 'Average price', maxLoss: 'Premium paid' },
  ];

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh' }}>
      <div style={{ background: T.navy, padding: '24px 32px 0', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ color: T.gold, fontFamily: T.mono, fontSize: 11, letterSpacing: 2, marginBottom: 4 }}>EP-CI4 . COMMODITY DERIVATIVES CLIMATE</div>
            <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: 0 }}>Commodity Derivatives Climate Pricing</h1>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>
              5 NGFS Scenarios . Forward Curves . Contango/Backwardation . Black-76 Options . Cross-Commodity Spreads . Climate Premium
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <select value={commodity} onChange={e => setCommodity(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
              {Object.entries(COMMODITIES).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
            </select>
            <select value={scenario} onChange={e => setScenario(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
              {NGFS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 0 }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)} style={{
              padding: '10px 14px', fontSize: 11, fontWeight: tab === i ? 700 : 500, cursor: 'pointer',
              background: tab === i ? T.bg : 'transparent', color: tab === i ? T.navy : '#94a3b8',
              border: 'none', borderRadius: '8px 8px 0 0', fontFamily: T.font, borderBottom: tab === i ? `2px solid ${T.gold}` : 'none'
            }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '24px 32px', maxWidth: 1440, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          {kpi('Spot Price', `${comm.base} ${comm.unit}`, comm.name)}
          {kpi('12M Forward', `${curveData[11]?.price} ${comm.unit}`, scenario)}
          {kpi('36M Forward', `${curveData[35]?.price} ${comm.unit}`, scenario, curveData[35]?.price < comm.base ? T.red : T.green)}
          {kpi('EU ETS', `65 EUR/tCO2`, 'carbon price')}
          {kpi('Structure', curveData[11]?.price > comm.base ? 'Contango' : 'Backwardation', `${((curveData[11]?.price / comm.base - 1) * 100).toFixed(1)}%`, curveData[11]?.price > comm.base ? T.amber : T.green)}
        </div>

        {/* Tab 0: Energy Curve Dashboard */}
        {tab === 0 && (
          <div>
            <div style={card}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 12 }}>{comm.name} Forward Curve - All NGFS Scenarios</h3>
              <ResponsiveContainer width="100%" height={420}>
                <LineChart data={allScenarioCurves}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} label={{ value: 'Months Forward', position: 'bottom', fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} label={{ value: comm.unit, angle: -90, position: 'insideLeft', fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  {NGFS.map(s => (
                    <Line key={s} dataKey={s} stroke={NGFS_COLORS[s]} dot={false} strokeWidth={2} name={s} />
                  ))}
                  <ReferenceLine y={comm.base} stroke={T.textMut} strokeDasharray="5 5" label={{ value: 'Spot', fontSize: 10 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
              {Object.entries(COMMODITIES).map(([k, v]) => (
                <div key={k} style={{ ...card, cursor: 'pointer', borderLeft: `3px solid ${commodity === k ? T.gold : 'transparent'}` }} onClick={() => setCommodity(k)}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{v.name}</div>
                  <div style={{ fontFamily: T.mono, fontSize: 20, fontWeight: 700, color: v.color }}>{v.base} {v.unit}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 1: Contango/Backwardation */}
        {tab === 1 && (
          <div style={card}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Term Structure Under {scenario}</h3>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={contangoData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10 }} label={{ value: comm.unit, angle: -90, position: 'insideLeft', fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" dataKey="price" stroke={comm.color} strokeWidth={2} dot={false} name="Forward Price" />
                <Bar yAxisId="right" dataKey="structure" name="M/M Change" opacity={0.5}>
                  {contangoData.map((d, i) => <Cell key={i} fill={d.structure >= 0 ? T.amber : T.green} />)}
                </Bar>
                <ReferenceLine yAxisId="right" y={0} stroke={T.textMut} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Tab 2: Commodity Options Pricing */}
        {tab === 2 && (
          <div>
            <div style={card}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Black-76 Options Pricing - {comm.name}</h3>
              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <label style={{ fontSize: 12 }}>Strike: <input type="number" value={optStrike} onChange={e => setOptStrike(+e.target.value)} style={{ width: 70, padding: '4px 8px', border: `1px solid ${T.border}`, borderRadius: 4, fontFamily: T.mono }} /></label>
                <label style={{ fontSize: 12 }}>Expiry (yr): <input type="number" value={optExpiry} onChange={e => setOptExpiry(+e.target.value)} step={0.25} min={0.25} max={5} style={{ width: 70, padding: '4px 8px', border: `1px solid ${T.border}`, borderRadius: 4, fontFamily: T.mono }} /></label>
              </div>
              <div style={{ fontFamily: T.mono, fontSize: 13, background: '#f8fafc', padding: 12, borderRadius: 6, marginBottom: 12 }}>
                Call Price = e^(-rT) [F*N(d1) - K*N(d2)] where d1 = [ln(F/K) + 0.5*sig^2*T] / (sig*sqrt(T))
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  <th style={{ textAlign: 'left', padding: '8px 6px', color: T.textSec }}>Scenario</th>
                  <th style={{ textAlign: 'left', padding: '8px 6px', color: T.textSec }}>Impl Vol</th>
                  <th style={{ textAlign: 'left', padding: '8px 6px', color: T.textSec }}>Call Price</th>
                  <th style={{ textAlign: 'left', padding: '8px 6px', color: T.textSec }}>Premium %</th>
                </tr></thead>
                <tbody>
                  {NGFS.map(s => {
                    const vol = s === 'Net Zero 2050' ? 0.40 : s === 'Divergent NZ' ? 0.45 : s === 'Below 2C' ? 0.35 : 0.28;
                    const cp = blackScholes76(comm.base, optStrike, 0.04, optExpiry, vol);
                    return (
                      <tr key={s} style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '8px 6px', color: NGFS_COLORS[s], fontWeight: 600 }}>{s}</td>
                        <td style={{ padding: '8px 6px', fontFamily: T.mono }}>{(vol * 100).toFixed(0)}%</td>
                        <td style={{ padding: '8px 6px', fontFamily: T.mono, fontWeight: 700 }}>{cp.toFixed(2)}</td>
                        <td style={{ padding: '8px 6px', fontFamily: T.mono }}>{(cp / comm.base * 100).toFixed(1)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={card}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Implied Vol Surface - {scenario}</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead><tr style={{ borderBottom: `2px solid ${T.border}` }}>
                    <th style={{ textAlign: 'left', padding: '6px' }}>Expiry</th>
                    {['80%', '90%', '95%', '100%', '105%', '110%', '120%'].map(k => (
                      <th key={k} style={{ textAlign: 'center', padding: '6px', color: T.textSec }}>{k}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {volSurface.map(row => (
                      <tr key={row.expiry} style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '6px', fontWeight: 600 }}>{row.expiry}</td>
                        {['K80%', 'K90%', 'K95%', 'K100%', 'K105%', 'K110%', 'K120%'].map(k => (
                          <td key={k} style={{ textAlign: 'center', padding: '6px', fontFamily: T.mono, background: row[k] > 40 ? '#fef2f2' : row[k] > 32 ? '#fefce8' : '#f0fdf4' }}>{row[k]}%</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Cross-Commodity Spreads */}
        {tab === 3 && (
          <div style={card}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Cross-Commodity Spreads Under NGFS Scenarios</h3>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={spreadData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                {NGFS.map(s => <Bar key={s} dataKey={s} fill={NGFS_COLORS[s]} name={s} />)}
              </BarChart>
            </ResponsiveContainer>
            <div style={{ marginTop: 16 }}>
              {SPREADS.map(sp => (
                <div key={sp.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
                  <span style={{ fontWeight: 700, color: sp.color }}>{sp.name}</span>
                  <span>{sp.long} - {sp.short}</span>
                  <span style={{ fontFamily: T.mono }}>Base: {sp.base} {sp.unit}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Hedging Strategy Builder */}
        {tab === 4 && (
          <div>
            <div style={card}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Hedging Strategy Builder</h3>
              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <label style={{ fontSize: 12 }}>Notional ($M): <input type="number" value={hedgeNotional} onChange={e => setHedgeNotional(+e.target.value)} style={{ width: 80, padding: '4px 8px', border: `1px solid ${T.border}`, borderRadius: 4, fontFamily: T.mono }} /></label>
                <label style={{ fontSize: 12 }}>Alert Price: <input type="number" value={alertPrice} onChange={e => setAlertPrice(+e.target.value)} style={{ width: 80, padding: '4px 8px', border: `1px solid ${T.border}`, borderRadius: 4, fontFamily: T.mono }} /></label>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
                {hedgeStrategies.map(h => (
                  <div key={h.name} style={{ ...card, padding: 16, borderLeft: `3px solid ${T.blue}` }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: T.navy }}>{h.name}</div>
                    <div style={{ fontSize: 12, color: T.textSec, margin: '4px 0' }}>{h.desc}</div>
                    <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 11 }}>
                      <span>Cost: <strong style={{ fontFamily: T.mono }}>${h.cost}/unit</strong></span>
                      <span>Protection: <strong>{h.protection}</strong></span>
                    </div>
                    <div style={{ fontSize: 11, color: T.textMut, marginTop: 4 }}>Total cost: ${(h.cost * hedgeNotional * 1000 / comm.base).toFixed(0)}K for ${hedgeNotional}M notional</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={card}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Price Alert System</h3>
              <p style={{ fontSize: 12, color: T.textSec }}>Alert when {comm.name} hits ${alertPrice} ({((alertPrice / comm.base - 1) * 100).toFixed(1)}% from spot). Current: ${comm.base}.</p>
              <div style={{ width: '100%', height: 8, background: T.border, borderRadius: 4, marginTop: 8 }}>
                <div style={{ width: `${(alertPrice / (comm.base * 1.5)) * 100}%`, height: 8, background: alertPrice < comm.base ? T.red : T.green, borderRadius: 4 }} />
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Climate Premium Decomposition */}
        {tab === 5 && (
          <div style={card}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Climate Premium Decomposition - {comm.name} under {scenario}</h3>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={premiumData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} label={{ value: 'Months', position: 'bottom', fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} label={{ value: comm.unit, angle: -90, position: 'insideLeft', fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Area dataKey="fundamental" stackId="1" fill={T.blue} stroke={T.blue} fillOpacity={0.3} name="Fundamental" />
                <Area dataKey="premium" stackId="2" fill={T.red} stroke={T.red} fillOpacity={0.3} name="Climate Transition Premium" />
                <Line dataKey="total" stroke={T.navy} strokeWidth={2} dot={false} name="Net Price" />
              </AreaChart>
            </ResponsiveContainer>
            <div style={{ marginTop: 12, padding: 12, background: '#f8fafc', borderRadius: 6, fontSize: 12 }}>
              <strong>Price = Fundamental + Climate Transition Premium.</strong> Under {scenario}, the transition premium grows to{' '}
              {premiumData[premiumData.length - 1]?.premium.toFixed(1)} {comm.unit} by month 36, representing{' '}
              {(premiumData[premiumData.length - 1]?.premium / comm.base * 100).toFixed(1)}% of spot price.
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 8 }}>
          <div style={card}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Reference Data</h4>
            {['ICE Futures Forward Curves', 'CME Options Market Data', 'IEA World Energy Outlook Demand', 'NGFS Commodity Price Pathways', 'EU ETS Carbon Price History', 'Black-76 Model Framework'].map(r => (
              <div key={r} style={{ fontSize: 11, color: T.textSec, padding: '3px 0', borderBottom: `1px solid ${T.border}` }}>{r}</div>
            ))}
          </div>
          <div style={card}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Engagement Tools</h4>
            {['Custom spread builder', 'Hedging recommendation engine', 'Price alert system', 'Options pricing calculator (Black-76)', 'Contango/backwardation monitor', 'Climate premium decomposition'].map(e => (
              <div key={e} style={{ fontSize: 11, color: T.textSec, padding: '3px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: 3, background: T.gold, display: 'inline-block' }} />{e}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
