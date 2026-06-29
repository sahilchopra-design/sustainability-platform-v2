import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const COMMODITIES = [
  { id: 'wheat', name: 'Wheat', type: 'Grain', exchange: 'CBOT', basePrice: 550, unit: 'bu', climateVaR95: 18.2, yieldSens: -4.2, heatThresh: 30, waterNeed: 'Medium' },
  { id: 'corn', name: 'Corn (Maize)', type: 'Grain', exchange: 'CBOT', basePrice: 480, unit: 'bu', climateVaR95: 15.8, yieldSens: -5.1, heatThresh: 35, waterNeed: 'High' },
  { id: 'soy', name: 'Soybeans', type: 'Oilseed', exchange: 'CBOT', basePrice: 1350, unit: 'bu', climateVaR95: 16.4, yieldSens: -3.8, heatThresh: 34, waterNeed: 'Medium' },
  { id: 'rice', name: 'Rice', type: 'Grain', exchange: 'CME', basePrice: 620, unit: 'cwt', climateVaR95: 14.6, yieldSens: -2.9, heatThresh: 38, waterNeed: 'Very High' },
  { id: 'cocoa', name: 'Cocoa', type: 'Soft', exchange: 'ICE', basePrice: 4200, unit: 'ton', climateVaR95: 28.4, yieldSens: -8.2, heatThresh: 32, waterNeed: 'High' },
  { id: 'coffee', name: 'Coffee (Arabica)', type: 'Soft', exchange: 'ICE', basePrice: 1.85, unit: 'lb', climateVaR95: 32.1, yieldSens: -9.4, heatThresh: 28, waterNeed: 'Medium' },
  { id: 'sugar', name: 'Sugar (Raw)', type: 'Soft', exchange: 'ICE', basePrice: 24.5, unit: 'lb', climateVaR95: 22.7, yieldSens: -5.5, heatThresh: 36, waterNeed: 'High' },
  { id: 'cotton', name: 'Cotton', type: 'Fiber', exchange: 'ICE', basePrice: 0.82, unit: 'lb', climateVaR95: 20.3, yieldSens: -6.1, heatThresh: 38, waterNeed: 'Very High' },
  { id: 'palm', name: 'Palm Oil', type: 'Oilseed', exchange: 'BMD', basePrice: 870, unit: 'ton', climateVaR95: 24.8, yieldSens: -4.4, heatThresh: 33, waterNeed: 'Very High' },
  { id: 'rubber', name: 'Rubber', type: 'Industrial', exchange: 'SGX', basePrice: 1.65, unit: 'kg', climateVaR95: 19.6, yieldSens: -3.2, heatThresh: 35, waterNeed: 'High' },
];

const PRICE_SERIES = Array.from({ length: 36 }, (_, i) => {
  const yr = 2022 + Math.floor(i / 12);
  const mo = (i % 12) + 1;
  return {
    period: `${yr}-${String(mo).padStart(2, '0')}`,
    wheat: +(550 + sr(i * 7) * 120 - 60 + i * 1.2).toFixed(0),
    corn: +(480 + sr(i * 11) * 100 - 50 + i * 0.8).toFixed(0),
    cocoa: +(3200 + sr(i * 13) * 1800 - 400 + i * 32).toFixed(0),
    coffee: +(1.6 + sr(i * 17) * 0.8 - 0.2 + i * 0.01).toFixed(2),
    sugar: +(20 + sr(i * 19) * 10 - 3 + i * 0.12).toFixed(1),
  };
});

const CLIMATE_SCENARIOS = [
  { name: '+1.5°C', wheat: -3, corn: -5, soy: -4, rice: -2, cocoa: -8, coffee: -12 },
  { name: '+2.0°C', wheat: -7, corn: -10, soy: -7, rice: -5, cocoa: -15, coffee: -22 },
  { name: '+3.0°C', wheat: -14, corn: -18, soy: -13, rice: -11, cocoa: -26, coffee: -38 },
  { name: '+4.0°C', wheat: -22, corn: -28, soy: -20, rice: -18, cocoa: -40, coffee: -55 },
];

const HEDGE_INSTRUMENTS = [
  { type: 'CBOT Wheat Futures', ticker: 'ZW', contract: '5,000 bu', margin: 2250, liquidity: 'High', correlation: 0.94 },
  { type: 'CBOT Corn Options', ticker: 'OZC', contract: '5,000 bu', margin: 1800, liquidity: 'High', correlation: 0.91 },
  { type: 'ICE Cocoa Futures', ticker: 'CC', contract: '10 MT', margin: 1750, liquidity: 'Medium', correlation: 0.88 },
  { type: 'ICE Coffee Futures', ticker: 'KC', contract: '37,500 lb', margin: 3500, liquidity: 'Medium', correlation: 0.86 },
  { type: 'Carbon Credit Futures', ticker: 'EUA', contract: '1,000 tCO₂', margin: 4200, liquidity: 'High', correlation: -0.45 },
  { type: 'Weather Derivatives', ticker: 'HDD/CDD', contract: 'Index', margin: 5000, liquidity: 'Low', correlation: 0.72 },
];

const YEARS = [2024, 2025, 2026, 2027, 2028, 2029, 2030];

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

const TABS = ['Overview', 'Price Risk', 'Climate Futures', 'Hedging', 'Supply Disruption', 'Market Intelligence', 'Portfolio Risk'];
const card = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, marginBottom: 20 };
const h2 = { fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 16, marginTop: 0 };
const grid = (cols) => ({ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16, marginBottom: 24 });
const select = { background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6, color: T.text, padding: '6px 10px', fontSize: 12 };

export default function ClimateCommodityAnalyticsPage() {
  const [tab, setTab] = useState('Overview');
  const [selectedCom, setSelectedCom] = useState('wheat');
  const [scenarioIdx, setScenarioIdx] = useState(1);

  const com = COMMODITIES.find(c => c.id === selectedCom);
  const sc = CLIMATE_SCENARIOS[scenarioIdx];

  const priceData = useMemo(() => PRICE_SERIES.slice(0, 24).map(p => ({
    period: p.period.slice(2), wheat: p.wheat, corn: p.corn, cocoa: p.cocoa,
  })), []);

  const varData = useMemo(() => COMMODITIES.map(c => ({ name: c.name.split(' ')[0], var95: c.climateVaR95, yieldSens: Math.abs(c.yieldSens) })), []);

  const climateImpactData = useMemo(() => COMMODITIES.filter(c => c[c.id] !== undefined || true).map(c => ({
    name: c.name.split(' ')[0],
    impact15: sc ? (sc[c.id] || sc.wheat) : -5,
    impact20: CLIMATE_SCENARIOS[1][c.id] || CLIMATE_SCENARIOS[1].wheat,
    impact30: CLIMATE_SCENARIOS[2][c.id] || CLIMATE_SCENARIOS[2].wheat,
  })), [sc]);

  const supplyData = useMemo(() => YEARS.map((yr, i) => ({
    year: yr,
    drought: +(sr(i * 7) * 30 + 5).toFixed(1),
    flood: +(sr(i * 11) * 20 + 3).toFixed(1),
    pest: +(sr(i * 17) * 15 + 2).toFixed(1),
    geopolitical: +(sr(i * 23) * 25 + 5).toFixed(1),
  })), []);

  const tabBar = { display: 'flex', gap: 4, marginBottom: 28, borderBottom: `1px solid ${T.border}` };
  const tabBtn = (active) => ({ padding: '10px 18px', fontSize: 13, fontWeight: active ? 600 : 400,
    color: active ? T.navyL : T.textSec, borderBottom: active ? `2px solid ${T.navyL}` : '2px solid transparent',
    cursor: 'pointer', background: 'none', border: 'none', marginBottom: -1 });

  return (
    <div style={{ background: T.bg, minHeight: '100vh', color: T.text, fontFamily: T.font, padding: '24px 32px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px', color: T.text }}>Climate Commodity Analytics</h1>
        <p style={{ margin: 0, color: T.textSec, fontSize: 13 }}>Climate-adjusted soft commodity price risk, futures analytics &amp; supply disruption intelligence</p>
      </div>
      <div style={tabBar}>{TABS.map(t => <button key={t} style={tabBtn(tab === t)} onClick={() => setTab(t)}>{t}</button>)}</div>

      {tab === 'Overview' && (
        <>
          <div style={grid(4)}>
            <KpiCard label="Commodities Tracked" value={COMMODITIES.length} sub="Soft, grain, oilseed & fiber" color={T.navy} />
            <KpiCard label="Avg Climate VaR 95" value={`${(COMMODITIES.reduce((a, c) => a + c.climateVaR95, 0) / COMMODITIES.length).toFixed(1)}%`} sub="Annual price risk from climate" color={T.red} />
            <KpiCard label="Most Exposed" value="Coffee" sub="−9.4% yield per °C warming" color={T.amber} />
            <KpiCard label="Market Cap at Risk" value="$2.1Tn" sub="Global soft commodity value" color={T.gold} />
          </div>
          <div style={card}>
            <h2 style={h2}>Climate VaR 95% by Commodity</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={varData} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 8 }} />
                <Legend />
                <Bar dataKey="var95" name="Climate VaR 95% (%)" fill={T.red} radius={[3, 3, 0, 0]} />
                <Bar dataKey="yieldSens" name="|Yield Sensitivity %/°C|" fill={T.amber} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <h2 style={h2}>Commodity Summary</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead><tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {['Commodity','Type','Exchange','Base Price','Climate VaR 95%','Yield Sens /°C','Heat Thresh °C','Water Need'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '5px 8px', color: T.textMut, fontWeight: 500 }}>{h}</th>
                ))}</tr></thead>
              <tbody>{COMMODITIES.map(c => (
                <tr key={c.id} style={{ borderBottom: `1px solid ${T.border}22` }}>
                  <td style={{ padding: '4px 8px', color: T.text, fontWeight: 500 }}>{c.name}</td>
                  <td style={{ padding: '4px 8px', color: T.textSec, fontSize: 10 }}>{c.type}</td>
                  <td style={{ padding: '4px 8px', color: T.navyL, fontSize: 10 }}>{c.exchange}</td>
                  <td style={{ padding: '4px 8px', fontFamily: T.mono, color: T.gold }}>{c.basePrice}</td>
                  <td style={{ padding: '4px 8px', fontFamily: T.mono, color: c.climateVaR95 > 25 ? T.red : T.amber }}>{c.climateVaR95}%</td>
                  <td style={{ padding: '4px 8px', fontFamily: T.mono, color: T.red }}>{c.yieldSens}%</td>
                  <td style={{ padding: '4px 8px', fontFamily: T.mono, color: T.textSec }}>{c.heatThresh}°C</td>
                  <td style={{ padding: '4px 8px', color: c.waterNeed === 'Very High' ? T.red : T.textSec }}>{c.waterNeed}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'Price Risk' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <label style={{ fontSize: 12, color: T.textSec }}>Commodity:</label>
            <select style={select} value={selectedCom} onChange={e => setSelectedCom(e.target.value)}>
              {COMMODITIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          {com && <div style={grid(4)}>
            <KpiCard label="Current Price" value={com.basePrice} sub={`USD / ${com.unit}`} color={T.gold} />
            <KpiCard label="Climate VaR 95%" value={`${com.climateVaR95}%`} sub="Annual 1-in-20 loss from climate" color={T.red} />
            <KpiCard label="Yield Sensitivity" value={`${com.yieldSens}%/°C`} sub="Per degree warming impact" color={T.amber} />
            <KpiCard label="Heat Threshold" value={`${com.heatThresh}°C`} sub="Critical temperature for yield loss" color={T.navy} />
          </div>}
          <div style={card}>
            <h2 style={h2}>Soft Commodity Price History (2022–2024)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={priceData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="period" tick={{ fontSize: 9, fill: T.textSec }} interval={3} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 8 }} />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="wheat" name="Wheat ($/bu)" stroke={T.gold} strokeWidth={2} dot={false} />
                <Line yAxisId="left" type="monotone" dataKey="corn" name="Corn ($/bu)" stroke={T.amber} strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="cocoa" name="Cocoa ($/ton)" stroke={T.red} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {tab === 'Climate Futures' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <label style={{ fontSize: 12, color: T.textSec }}>Warming Scenario:</label>
            <select style={select} value={scenarioIdx} onChange={e => setScenarioIdx(+e.target.value)}>
              {CLIMATE_SCENARIOS.map((s, i) => <option key={s.name} value={i}>{s.name}</option>)}
            </select>
          </div>
          <div style={grid(4)}>
            {['wheat', 'corn', 'cocoa', 'coffee'].map(key => {
              const c = COMMODITIES.find(c2 => c2.id === key);
              const impact = sc ? sc[key] : 0;
              return <KpiCard key={key} label={c ? c.name : key} value={`${impact}%`} sub={`Yield impact at ${sc?.name}`} color={T.red} />;
            })}
          </div>
          <div style={card}>
            <h2 style={h2}>Climate-Adjusted Yield Impact — {sc?.name} Scenario</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={COMMODITIES.map(c => ({
                name: c.name.split(' ')[0],
                impact: sc ? (sc[c.id] !== undefined ? sc[c.id] : sc.wheat) : 0,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 8 }} />
                <Bar dataKey="impact" name="Yield Impact %" fill={T.red} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <h2 style={h2}>Scenario Comparison — Key Commodities</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr style={{ borderBottom: `1px solid ${T.border}` }}>
                <th style={{ textAlign: 'left', padding: '8px', color: T.textMut, fontWeight: 500 }}>Scenario</th>
                {['wheat', 'corn', 'soy', 'rice', 'cocoa', 'coffee'].map(k => (
                  <th key={k} style={{ textAlign: 'left', padding: '8px', color: T.textMut, fontWeight: 500, textTransform: 'capitalize' }}>{k}</th>
                ))}
              </tr></thead>
              <tbody>{CLIMATE_SCENARIOS.map(s => (
                <tr key={s.name} style={{ borderBottom: `1px solid ${T.border}22` }}>
                  <td style={{ padding: '7px 8px', color: T.text, fontWeight: 600 }}>{s.name}</td>
                  {['wheat', 'corn', 'soy', 'rice', 'cocoa', 'coffee'].map(k => (
                    <td key={k} style={{ padding: '7px 8px', fontFamily: T.mono, color: s[k] < -20 ? T.red : s[k] < -10 ? T.amber : T.gold }}>{s[k]}%</td>
                  ))}
                </tr>
              ))}</tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'Hedging' && (
        <>
          <div style={grid(3)}>
            <KpiCard label="Available Instruments" value={HEDGE_INSTRUMENTS.length} sub="Futures, options & derivatives" color={T.navy} />
            <KpiCard label="Avg Hedge Correlation" value={`${(HEDGE_INSTRUMENTS.filter(h => h.correlation > 0).reduce((a, h) => a + h.correlation, 0) / HEDGE_INSTRUMENTS.filter(h => h.correlation > 0).length).toFixed(2)}`} sub="Price-hedge correlation (directional)" color={T.green} />
            <KpiCard label="Weather Derivatives" value="Low Liq." sub="Growing market; bespoke structures" color={T.amber} />
          </div>
          <div style={card}>
            <h2 style={h2}>Hedge Instrument Universe</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {['Instrument','Ticker','Contract Size','Initial Margin ($)','Liquidity','Correlation'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px', color: T.textMut, fontWeight: 500 }}>{h}</th>
                ))}</tr></thead>
              <tbody>{HEDGE_INSTRUMENTS.map(h => (
                <tr key={h.ticker} style={{ borderBottom: `1px solid ${T.border}22` }}>
                  <td style={{ padding: '7px 8px', color: T.text, fontWeight: 500 }}>{h.type}</td>
                  <td style={{ padding: '7px 8px', fontFamily: T.mono, color: T.navyL }}>{h.ticker}</td>
                  <td style={{ padding: '7px 8px', color: T.textSec }}>{h.contract}</td>
                  <td style={{ padding: '7px 8px', fontFamily: T.mono, color: T.amber }}>${h.margin.toLocaleString()}</td>
                  <td style={{ padding: '7px 8px', color: h.liquidity === 'High' ? T.green : h.liquidity === 'Medium' ? T.amber : T.red }}>{h.liquidity}</td>
                  <td style={{ padding: '7px 8px', fontFamily: T.mono, color: h.correlation < 0 ? T.teal : T.green }}>{h.correlation}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div style={card}>
            <h2 style={h2}>Carbon Credit as Commodity Hedge</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              {[
                { title: 'EUA Correlation to Agri', val: '−0.45', desc: 'Negative correlation provides natural hedge against commodity-driven climate risk', color: T.teal },
                { title: 'ACCU (Australia)', val: '−0.38', desc: 'Climate-impacted ag regions → ACCU demand spike; natural cross-hedge', color: T.sage },
                { title: 'VCM REDD+', val: '−0.32', desc: 'Deforestation-linked soft commodities vs REDD+ credits inverse relationship', color: T.navy },
              ].map(h => (
                <div key={h.title} style={{ background: T.surfaceH, borderRadius: 8, padding: 14, border: `1px solid ${h.color}44` }}>
                  <div style={{ fontWeight: 600, color: h.color, fontSize: 13, marginBottom: 6 }}>{h.title}</div>
                  <div style={{ fontFamily: T.mono, fontSize: 22, fontWeight: 700, color: T.text, marginBottom: 8 }}>{h.val}</div>
                  <div style={{ fontSize: 11, color: T.textSec }}>{h.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {tab === 'Supply Disruption' && (
        <>
          <div style={grid(4)}>
            <KpiCard label="Drought Risk Events" value="+34%" sub="Increase in severe drought 2020–24" color={T.amber} />
            <KpiCard label="Flood Disruptions" value="+28%" sub="YoY increase in flood crop losses" color={T.teal} />
            <KpiCard label="Pest/Disease" value="+19%" sub="Climate-linked pest spread expansion" color={T.red} />
            <KpiCard label="Geo-Political" value="Elevated" sub="Black Sea, MENA, SE Asia corridors" color={T.navy} />
          </div>
          <div style={card}>
            <h2 style={h2}>Supply Disruption Risk by Driver (2024–2030)</h2>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={supplyData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 8 }} />
                <Legend />
                <Area type="monotone" dataKey="drought" name="Drought Events %" stroke={T.amber} fill={`${T.amber}33`} strokeWidth={2} />
                <Area type="monotone" dataKey="flood" name="Flood Events %" stroke={T.teal} fill={`${T.teal}33`} strokeWidth={2} />
                <Area type="monotone" dataKey="pest" name="Pest/Disease %" stroke={T.red} fill={`${T.red}22`} strokeWidth={2} />
                <Area type="monotone" dataKey="geopolitical" name="Geopolitical %" stroke={T.navy} fill={`${T.navy}22`} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <h2 style={h2}>Key Supply Chain Chokepoints</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                { region: 'Black Sea Corridor', commodities: 'Wheat, Corn, Sunflower', risk: 'Geopolitical', impact: 'High', color: T.red },
                { region: 'Gulf of Guinea', commodities: 'Cocoa, Coffee, Palm', risk: 'Climate + Social', impact: 'Critical', color: T.red },
                { region: 'SE Asia (Indochina)', commodities: 'Rice, Rubber, Palm', risk: 'Climate', impact: 'High', color: T.amber },
                { region: 'Brazil Cerrado', commodities: 'Soy, Corn, Cotton', risk: 'Deforestation + EUDR', impact: 'High', color: T.amber },
                { region: 'Sahel Region', commodities: 'Groundnuts, Cotton', risk: 'Desertification', impact: 'Severe', color: T.red },
                { region: 'Murray-Darling', commodities: 'Wheat, Livestock', risk: 'Drought', impact: 'Medium', color: T.gold },
              ].map(cp => (
                <div key={cp.region} style={{ background: T.surfaceH, borderRadius: 8, padding: 12, border: `1px solid ${cp.color}44` }}>
                  <div style={{ fontWeight: 600, color: cp.color, fontSize: 12, marginBottom: 6 }}>{cp.region}</div>
                  <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}><span style={{ color: T.textMut }}>Commodities:</span> {cp.commodities}</div>
                  <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}><span style={{ color: T.textMut }}>Risk Driver:</span> {cp.risk}</div>
                  <div style={{ fontSize: 11 }}><span style={{ color: T.textMut }}>Impact: </span><span style={{ fontWeight: 600, color: cp.color }}>{cp.impact}</span></div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {tab === 'Market Intelligence' && (
        <>
          <div style={grid(4)}>
            <KpiCard label="El Niño Impact" value="+12–18%" sub="Price premium in next 6–18 mo" color={T.amber} />
            <KpiCard label="Carbon Border Tax" value="2026" sub="CBAM Phase 2 — food items" color={T.navy} />
            <KpiCard label="EUDR Market Shift" value="−$4.2Bn" sub="Est. trade diversion by 2025" color={T.red} />
            <KpiCard label="Precision Ag Adoption" value="+28%" sub="YoY in large-scale operations" color={T.green} />
          </div>
          <div style={card}>
            <h2 style={h2}>Key Market Signals — 2025–2030 Horizon</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              {[
                { signal: 'El Niño / ENSO Cycle', impact: 'Bullish soft commodities (cocoa, coffee, sugar)', horizon: '2025–2026', magnitude: 'High', dir: 'up' },
                { signal: 'EUDR Implementation', impact: 'Palm oil, soy, cocoa price premiums for compliant supply', horizon: '2025', magnitude: 'Medium', dir: 'mixed' },
                { signal: 'India Wheat Export Ban', impact: 'Global wheat price support; Middle East import competition', horizon: 'Ongoing', magnitude: 'Medium', dir: 'up' },
                { signal: 'Climate Attribution Litigation', impact: 'Liability premiums across entire agri value chain', horizon: '2026–2030', magnitude: 'Growing', dir: 'up' },
                { signal: 'Carbon Inset Credits', impact: 'Scope 3 inset demand reducing commodity premium needed', horizon: '2025–2028', magnitude: 'Low-Med', dir: 'down' },
                { signal: 'AI Precision Ag Scale-Up', impact: 'Yield improvements offsetting climate loss in OECD markets', horizon: '2027–2030', magnitude: 'Medium', dir: 'down' },
              ].map(sig => (
                <div key={sig.signal} style={{ background: T.surfaceH, borderRadius: 8, padding: 12, border: `1px solid ${T.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ fontWeight: 600, color: T.text, fontSize: 12 }}>{sig.signal}</div>
                    <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: sig.dir === 'up' ? `${T.green}22` : sig.dir === 'down' ? `${T.red}22` : `${T.amber}22`, color: sig.dir === 'up' ? T.green : sig.dir === 'down' ? T.red : T.amber }}>
                      {sig.dir === 'up' ? '↑' : sig.dir === 'down' ? '↓' : '↕'}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>{sig.impact}</div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <span style={{ fontSize: 10, color: T.textMut }}>Horizon: <span style={{ color: T.teal }}>{sig.horizon}</span></span>
                    <span style={{ fontSize: 10, color: T.textMut }}>Magnitude: <span style={{ color: T.amber }}>{sig.magnitude}</span></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {tab === 'Portfolio Risk' && (
        <>
          <div style={grid(4)}>
            <KpiCard label="Portfolio Climate VaR" value="21.4%" sub="95% CI annual loss estimate" color={T.red} />
            <KpiCard label="Concentration Risk" value="Soft Commod." value="Soft" sub="Cocoa + coffee = 38% of VaR" color={T.amber} />
            <KpiCard label="Hedge Ratio" value="42%" sub="Current effective hedge coverage" color={T.green} />
            <KpiCard label="Optimal Hedge" value="68%" sub="Model-recommended coverage" color={T.navy} />
          </div>
          <div style={card}>
            <h2 style={h2}>Climate VaR Attribution by Commodity</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={COMMODITIES.map(c => ({ name: c.name.split(' ')[0], transition: +(c.climateVaR95 * 0.4).toFixed(1), physical: +(c.climateVaR95 * 0.6).toFixed(1) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 8 }} />
                <Legend />
                <Bar dataKey="physical" name="Physical Risk VaR %" fill={T.red} stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="transition" name="Transition Risk VaR %" fill={T.amber} stackId="a" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <h2 style={h2}>Climate Scenario Portfolio Impact Summary</h2>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={CLIMATE_SCENARIOS.map(sc => ({
                scenario: sc.name,
                avgImpact: +([sc.wheat, sc.corn, sc.soy, sc.rice, sc.cocoa, sc.coffee].reduce((a, v) => a + v, 0) / 6).toFixed(1),
                worstCase: Math.min(sc.wheat, sc.corn, sc.soy, sc.rice, sc.cocoa, sc.coffee),
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="scenario" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 8 }} />
                <Legend />
                <Bar dataKey="avgImpact" name="Avg Portfolio Impact %" fill={T.amber} radius={[3, 3, 0, 0]} />
                <Bar dataKey="worstCase" name="Worst Commodity %" fill={T.red} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
