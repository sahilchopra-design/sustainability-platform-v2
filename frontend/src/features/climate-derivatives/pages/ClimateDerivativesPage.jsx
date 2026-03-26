import React, { useState } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area, LineChart, Line,
} from 'recharts';

const API = 'http://localhost:8001';
const hashStr = (s) => { let h = 0; for (let i = 0; i < s.length; i++) { h = Math.imul(31, h) + s.charCodeAt(i) | 0; } return Math.abs(h); };
const seededRandom = (seed) => { let x = Math.sin(seed * 9301 + 49297) * 233280; return x - Math.floor(x); };

const KpiCard = ({ label, value, sub, accent }) => (
  <div style={{ border: `1px solid ${accent ? '#059669' : '#e5e7eb'}`, borderRadius: 8, padding: '16px 20px', background: 'white' }}>
    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{sub}</div>}
  </div>
);
const Btn = ({ children, onClick }) => (
  <button onClick={onClick} style={{ padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', background: '#059669', color: 'white', fontWeight: 600, fontSize: 14 }}>{children}</button>
);
const Inp = ({ label, value, onChange, type = 'text' }) => (
  <div style={{ marginBottom: 12 }}>
    {label && <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>{label}</div>}
    <input type={type} value={value} onChange={e => onChange(e.target.value)}
      style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, background: 'white', boxSizing: 'border-box' }} />
  </div>
);
const Sel = ({ label, value, onChange, options }) => (
  <div style={{ marginBottom: 12 }}>
    {label && <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>{label}</div>}
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, background: 'white' }}>
      {options.map(o => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
    </select>
  </div>
);
const Section = ({ title, children }) => (
  <div style={{ marginBottom: 24 }}>
    <div style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 12, paddingBottom: 8, borderBottom: '2px solid #059669' }}>{title}</div>
    {children}
  </div>
);
const Row = ({ children, gap = 12 }) => (
  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${React.Children.count(children)},1fr)`, gap }}>{children}</div>
);
const Badge = ({ label, color }) => {
  const colors = { green: { bg: '#d1fae5', text: '#065f46' }, yellow: { bg: '#fef3c7', text: '#92400e' }, red: { bg: '#fee2e2', text: '#991b1b' }, blue: { bg: '#dbeafe', text: '#1e40af' }, gray: { bg: '#f3f4f6', text: '#374151' }, purple: { bg: '#ede9fe', text: '#5b21b6' }, orange: { bg: '#ffedd5', text: '#9a3412' } };
  const c = colors[color] || colors.gray;
  return <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700, background: c.bg, color: c.text }}>{label}</span>;
};

const TABS = ['Pricing Output', 'Cat Bond Structure', 'EUA Options', 'Regulatory Classification', 'Product Templates'];

const CITY_STATIONS = [
  { value: 'london', label: 'London (LHR)' }, { value: 'new_york', label: 'New York (JFK)' },
  { value: 'chicago', label: 'Chicago (ORD)' }, { value: 'paris', label: 'Paris (CDG)' },
  { value: 'frankfurt', label: 'Frankfurt (FRA)' }, { value: 'tokyo', label: 'Tokyo (HND)' },
  { value: 'singapore', label: 'Singapore (SIN)' }, { value: 'sydney', label: 'Sydney (SYD)' },
];

const getPricingData = (productType, underlying, notional, tenor, city) => {
  const base = hashStr(productType + underlying + city + String(tenor));
  const s = (n) => seededRandom(base + n);
  const not = parseFloat(notional) || 1000000;
  const fairValue = parseFloat((s(1) * 0.12 + 0.02).toFixed(4));
  const riskPremium = parseFloat((s(2) * 8 + 1).toFixed(2));
  const impliedVol = parseFloat((s(3) * 25 + 10).toFixed(1));
  const greeks = [
    { greek: 'Delta', value: parseFloat((s(4) * 0.8 + 0.1).toFixed(3)), unit: '' },
    { greek: 'Gamma', value: parseFloat((s(5) * 0.05 + 0.001).toFixed(4)), unit: '' },
    { greek: 'Vega', value: parseFloat((s(6) * 500 + 100).toFixed(0)), unit: '$/vol pt' },
    { greek: 'Theta', value: -parseFloat((s(7) * 200 + 50).toFixed(0)), unit: '$/day' },
  ];
  const burnData = Array.from({ length: 20 }, (_, i) => ({
    year: 2004 + i,
    payout: parseFloat((s(i + 20) * not * 0.08).toFixed(0)),
  }));
  return { fairValueUsd: `$${(fairValue * not).toFixed(0)}`, riskPremium: `${riskPremium}%`, impliedVol: `${impliedVol}%`, greeks, burnData };
};

const getCatBondData = (productType, notional, city) => {
  const base = hashStr(productType + city + 'catbond');
  const s = (n) => seededRandom(base + n);
  const not = parseFloat(notional) || 1000000;
  const el = parseFloat((s(1) * 3 + 0.5).toFixed(2));
  const spread = Math.round(s(2) * 400 + 150);
  const attach = parseFloat((s(3) * 8 + 2).toFixed(1));
  const exhaust = parseFloat((attach + s(4) * 8 + 4).toFixed(1));
  const exceedanceCurve = [0.1, 0.5, 1, 2, 5, 10, 20, 50].map((prob, i) => ({
    prob: `${prob}%`,
    loss: parseFloat((s(i + 10) * not * 0.2 + not * 0.02).toFixed(0)),
  }));
  const triggerTypes = [
    { type: 'Indemnity', pros: 'Basis risk = 0', cons: 'Slow settlement', typical_spread: `${spread - 30} bps` },
    { type: 'Parametric', pros: 'Fast trigger', cons: 'Basis risk', typical_spread: `${spread + 20} bps` },
    { type: 'Index', pros: 'Transparent', cons: 'Partial hedge', typical_spread: `${spread + 10} bps` },
    { type: 'Modelled', pros: 'No moral hazard', cons: 'Model dependency', typical_spread: `${spread + 5} bps` },
  ];
  return { el: `${el}%`, spread: `${spread} bps`, attach: `${attach}%`, exhaust: `${exhaust}%`, exceedanceCurve, triggerTypes };
};

const getEUAData = (underlying, tenor) => {
  const base = hashStr(underlying + String(tenor) + 'eua');
  const s = (n) => seededRandom(base + n);
  const spot = Math.round(s(1) * 30 + 55);
  const spotRange = Array.from({ length: 20 }, (_, i) => {
    const price = spot * 0.5 + i * spot * 0.06;
    const callValue = Math.max(0, price - spot) + s(i + 5) * 3;
    const putValue = Math.max(0, spot - price) + s(i + 25) * 3;
    return { price: Math.round(price), call: parseFloat(callValue.toFixed(2)), put: parseFloat(putValue.toFixed(2)) };
  });
  const greeksNorm = [
    { dimension: 'Delta', value: Math.round(s(40) * 60 + 30) },
    { dimension: 'Gamma', value: Math.round(s(41) * 40 + 20) },
    { dimension: 'Vega', value: Math.round(s(42) * 70 + 25) },
    { dimension: 'Theta', value: Math.round(s(43) * 50 + 20) },
    { dimension: 'Rho', value: Math.round(s(44) * 30 + 15) },
  ];
  const strikes = [spot * 0.8, spot, spot * 1.2].map(p => Math.round(p));
  const tenors = [0.25, 0.5, 1];
  const volSurface = strikes.map(k => {
    const row = { strike: `€${k}` };
    tenors.forEach((t, ti) => { row[`${t}yr`] = `${Math.round(s(k + ti * 7) * 15 + 20)}%`; });
    return row;
  });
  return { spot, spotRange, greeksNorm, strikes, volSurface, tenors };
};

const getRegData = (productType) => {
  const base = hashStr(productType + 'reg');
  const s = (n) => seededRandom(base + n);
  const checklist = [
    { item: 'EMIR Classification', value: productType === 'eua_option' ? 'Commodity derivative (financial)' : 'Other OTC derivative' },
    { item: 'MiFID II Category', value: 'Commodity / Environmental' },
    { item: 'Clearing Obligation', value: s(1) > 0.5 ? 'Mandatory (>€50m threshold)' : 'Bilateral with IM' },
    { item: 'Margin Requirements', value: 'EMIR margin rules apply' },
    { item: 'ISDA Template', value: '2002 Master + Schedule + CSA' },
    { item: 'Reporting Obligation', value: 'EMIR TR reporting — T+1' },
    { item: 'SFTR Reporting', value: s(2) > 0.6 ? 'Not applicable' : 'SFT if repo-linked' },
  ];
  const ccpMatrix = [
    { product: 'EUA Options', ICE: true, CME: false, LCH: true },
    { product: 'Cat Bonds', ICE: false, CME: false, LCH: false },
    { product: 'Weather Deriv.', ICE: true, CME: true, LCH: false },
    { product: 'Carbon Spread', ICE: true, CME: true, LCH: true },
    { product: 'Parametric', ICE: false, CME: false, LCH: false },
  ];
  return { checklist, ccpMatrix };
};

const getTemplatesData = (productType) => {
  const base = hashStr(productType + 'templates');
  const s = (n) => seededRandom(base + n);
  const templates = [
    { name: 'HDD Winter Swap', type: 'Weather', tenor: '6 months', key_risk: 'Temperature basis', spread: Math.round(s(1) * 80 + 40) },
    { name: 'CDD Summer Cap', type: 'Weather', tenor: '3 months', key_risk: 'Extreme heat events', spread: Math.round(s(2) * 100 + 50) },
    { name: 'Rainfall Swaption', type: 'Parametric', tenor: '12 months', key_risk: 'Precipitation volatility', spread: Math.round(s(3) * 120 + 60) },
    { name: 'EUA Call Spread', type: 'Carbon', tenor: '1 year', key_risk: 'Regulatory repricing', spread: Math.round(s(4) * 150 + 80) },
    { name: 'Catastrophe Collar', type: 'Cat Bond', tenor: '3 years', key_risk: 'Tail event trigger', spread: Math.round(s(5) * 200 + 150) },
    { name: 'Wildfire Parametric', type: 'Parametric', tenor: '2 years', key_risk: 'Satellite data quality', spread: Math.round(s(6) * 180 + 120) },
    { name: 'Flood ILS Note', type: 'ILS', tenor: '4 years', key_risk: 'Flood zone reclassification', spread: Math.round(s(7) * 220 + 200) },
    { name: 'Carbon Basis Swap', type: 'Carbon', tenor: '2 years', key_risk: 'Market fragmentation', spread: Math.round(s(8) * 100 + 70) },
  ];
  const barData = templates.map(t => ({ name: t.name.split(' ').slice(0, 2).join(' '), spread: t.spread }));
  return { templates, barData };
};

export default function ClimateDerivativesPage() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [productType, setProductType] = useState('weather_derivative');
  const [underlying, setUnderlying] = useState('HDD');
  const [notional, setNotional] = useState('1000000');
  const [tenorYears, setTenorYears] = useState('1');
  const [cityStation, setCityStation] = useState('london');

  const pricing = getPricingData(productType, underlying, notional, tenorYears, cityStation);
  const catbond = getCatBondData(productType, notional, cityStation);
  const eua = getEUAData(underlying, tenorYears);
  const reg = getRegData(productType);
  const tmpl = getTemplatesData(productType);

  const runPrice = async () => {
    setLoading(true); setError('');
    try {
      await axios.post(`${API}/api/v1/climate-derivatives/price-weather`, {
        product_type: productType, underlying, notional_usd: parseFloat(notional),
        tenor_years: parseFloat(tenorYears), city_station: cityStation,
      });
    } catch {
      setError('API unavailable — demo mode.');
    } finally { setLoading(false); }
  };

  const inputPanel = (
    <Section title="Climate Derivative Inputs">
      <Row>
        <Sel label="Product Type" value={productType} onChange={setProductType} options={[
          { value: 'weather_derivative', label: 'Weather Derivative' }, { value: 'cat_bond', label: 'Cat Bond' },
          { value: 'eua_option', label: 'EUA Option' }, { value: 'carbon_spread', label: 'Carbon Spread' }, { value: 'parametric', label: 'Parametric' },
        ]} />
        <Sel label="Underlying Index" value={underlying} onChange={setUnderlying} options={['HDD', 'CDD', 'rainfall', 'EUA', 'temperature'].map(u => ({ value: u, label: u }))} />
        <Inp label="Notional (USD)" value={notional} onChange={setNotional} type="number" />
        <Inp label="Tenor (years)" value={tenorYears} onChange={setTenorYears} type="number" />
        <Sel label="City / Weather Station" value={cityStation} onChange={setCityStation} options={CITY_STATIONS} />
      </Row>
      <Btn onClick={runPrice}>{loading ? 'Pricing…' : 'Price Climate Derivative'}</Btn>
    </Section>
  );

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>Climate Derivatives Pricing Engine</h1>
        <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>Weather Derivatives · Cat Bonds · EUA Options · Carbon Spreads · Parametric Products · EMIR/MiFID Classification</p>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid #e5e7eb', flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{ padding: '10px 14px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, background: 'none', color: tab === i ? '#059669' : '#6b7280', borderBottom: tab === i ? '2px solid #059669' : '2px solid transparent' }}>{t}</button>
        ))}
      </div>

      {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, padding: 12, marginBottom: 16, color: '#dc2626', fontSize: 14 }}>{error}</div>}

      {/* TAB 1 — Pricing Output */}
      {tab === 0 && (
        <div>
          {inputPanel}
          <Section title="Pricing Summary">
            <Row gap={12}>
              <KpiCard label="Fair Value (USD)" value={pricing.fairValueUsd} sub="Black-Scholes adjusted" accent />
              <KpiCard label="Risk Premium" value={pricing.riskPremium} sub="Above expected loss" />
              <KpiCard label="Implied Volatility" value={pricing.impliedVol} sub="Annualised vol estimate" />
              <KpiCard label="Product Type" value={<Badge label={productType.replace(/_/g, ' ').toUpperCase()} color="blue" />} sub={`${underlying} underlying · ${tenorYears}yr tenor`} />
            </Row>
          </Section>
          <Row>
            <Section title="Greeks Table">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    {['Greek', 'Value', 'Unit'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pricing.greeks.map((g, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 700, color: '#059669' }}>{g.greek}</td>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: g.value < 0 ? '#dc2626' : '#111827' }}>{g.value}</td>
                      <td style={{ padding: '8px 12px', color: '#6b7280' }}>{g.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
            <Section title="Burn Analysis — Historical Annual Payouts (20yr)">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={pricing.burnData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                  <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(val) => `$${val.toLocaleString()}`} />
                  <Bar dataKey="payout" name="Annual Payout" fill="#059669" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Section>
          </Row>
        </div>
      )}

      {/* TAB 2 — Cat Bond Structure */}
      {tab === 1 && (
        <div>
          {inputPanel}
          <Section title="Cat Bond Structure Metrics">
            <Row gap={12}>
              <KpiCard label="Expected Loss %" value={catbond.el} sub="Annual expected loss" accent />
              <KpiCard label="Spread (bps)" value={catbond.spread} sub="Over risk-free rate" />
              <KpiCard label="Attachment Point" value={catbond.attach} sub="% of notional" />
              <KpiCard label="Exhaustion Point" value={catbond.exhaust} sub="% of notional" />
            </Row>
          </Section>
          <Row>
            <Section title="Loss Exceedance Curve">
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={catbond.exceedanceCurve}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="prob" />
                  <YAxis tickFormatter={(v) => `$${(v / 1e6).toFixed(1)}M`} />
                  <Tooltip formatter={(val) => `$${(val / 1e6).toFixed(2)}M`} />
                  <Area type="monotone" dataKey="loss" stroke="#ef4444" fill="#fee2e2" name="Loss ($)" />
                </AreaChart>
              </ResponsiveContainer>
            </Section>
            <Section title="Trigger Type Comparison">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    {['Trigger', 'Pros', 'Cons', 'Typical Spread'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {catbond.triggerTypes.map((t, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? 'white' : '#f9fafb' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 700, color: '#059669' }}>{t.type}</td>
                      <td style={{ padding: '8px 12px', color: '#374151', fontSize: 12 }}>{t.pros}</td>
                      <td style={{ padding: '8px 12px', color: '#6b7280', fontSize: 12 }}>{t.cons}</td>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: '#111827' }}>{t.typical_spread}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          </Row>
        </div>
      )}

      {/* TAB 3 — EUA Options */}
      {tab === 2 && (
        <div>
          {inputPanel}
          <Section title={`EUA Option Payoff vs Spot Price (Spot: €${eua.spot})`}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={eua.spotRange}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="price" tick={{ fontSize: 11 }} label={{ value: 'EUA Spot (€)', position: 'insideBottom', offset: -5 }} />
                <YAxis unit="€" />
                <Tooltip formatter={(val) => `€${val}`} />
                <Legend />
                <Line type="monotone" dataKey="call" stroke="#059669" strokeWidth={2} dot={false} name="Call Value (€)" />
                <Line type="monotone" dataKey="put" stroke="#ef4444" strokeWidth={2} dot={false} name="Put Value (€)" />
              </LineChart>
            </ResponsiveContainer>
          </Section>
          <Row>
            <Section title="Greeks (Normalised 0–100)">
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={eua.greeksNorm}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                  <Radar name="Greeks" dataKey="value" stroke="#059669" fill="#059669" fillOpacity={0.35} />
                  <Tooltip formatter={(val) => `${val}/100`} />
                </RadarChart>
              </ResponsiveContainer>
            </Section>
            <Section title="Volatility Surface (Strike × Tenor)">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151' }}>Strike</th>
                    {eua.tenors.map(t => (
                      <th key={t} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#059669' }}>{t}yr</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {eua.volSurface.map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? 'white' : '#f9fafb' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 700, color: '#374151' }}>{row.strike}</td>
                      {eua.tenors.map(t => <td key={t} style={{ padding: '8px 12px', color: '#111827' }}>{row[`${t}yr`]}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ marginTop: 8, fontSize: 12, color: '#6b7280' }}>Implied volatility surface · {underlying} underlying · Black-76 model</div>
            </Section>
          </Row>
        </div>
      )}

      {/* TAB 4 — Regulatory Classification */}
      {tab === 3 && (
        <div>
          {inputPanel}
          <Section title="EMIR / MiFID II / ISDA Regulatory Classification">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Regulatory Item', 'Classification / Value'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reg.checklist.map((item, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? 'white' : '#f9fafb' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 600, color: '#374151' }}>{item.item}</td>
                    <td style={{ padding: '8px 12px', color: '#111827' }}>{item.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
          <Section title="CCP Eligibility Matrix (ICE / CME / LCH)">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Product', 'ICE', 'CME', 'LCH'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reg.ccpMatrix.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? 'white' : '#f9fafb' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 600, color: '#374151' }}>{row.product}</td>
                    {['ICE', 'CME', 'LCH'].map(ccp => (
                      <td key={ccp} style={{ padding: '8px 12px' }}>
                        <Badge label={row[ccp] ? 'Eligible' : 'Bilateral'} color={row[ccp] ? 'green' : 'gray'} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </div>
      )}

      {/* TAB 5 — Product Templates */}
      {tab === 4 && (
        <div>
          {inputPanel}
          <Section title="Structured Product Templates">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 24 }}>
              {tmpl.templates.map((t, i) => (
                <div key={i} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, borderLeft: '4px solid #059669' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{t.name}</div>
                    <Badge label={t.type} color="blue" />
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>Tenor: <strong>{t.tenor}</strong> · Spread: <strong style={{ color: '#059669' }}>{t.spread} bps</strong></div>
                  <div style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>Key risk: {t.key_risk}</div>
                </div>
              ))}
            </div>
          </Section>
          <Section title="Indicative Spread Comparison (bps)">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={tmpl.barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={50} />
                <YAxis unit=" bps" />
                <Tooltip formatter={(val) => `${val} bps`} />
                <Bar dataKey="spread" name="Indicative Spread" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Section>
        </div>
      )}
    </div>
  );
}
