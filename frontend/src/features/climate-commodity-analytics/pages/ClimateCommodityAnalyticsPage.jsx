import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, LineChart, Line, Legend,
} from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f6f4f0',
  navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f',
  teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c',
  surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace',
};

const COMMODITIES = ['Wheat', 'Maize', 'Rice', 'Soy', 'Coffee', 'Cocoa', 'Cotton', 'Palm Oil', 'Sugar', 'Cattle'];
const EXPORT_COUNTRIES = ['USA', 'Brazil', 'Argentina', 'Australia', 'Ukraine', 'India', 'Indonesia', 'Vietnam', 'Colombia', 'Ivory Coast'];
const IMPORT_REGIONS = ['Europe', 'China', 'Southeast Asia', 'MENA', 'Japan/Korea', 'West Africa', 'South Asia', 'Latin America'];
const RISK_LEVELS = ['Low', 'Medium', 'High', 'Critical'];

const TRADE_FLOWS = Array.from({ length: 80 }, (_, i) => {
  const commodity = COMMODITIES[i % COMMODITIES.length];
  const exportCountry = EXPORT_COUNTRIES[i % EXPORT_COUNTRIES.length];
  const importCountry = IMPORT_REGIONS[i % IMPORT_REGIONS.length];
  const climateRisk = +(1 + sr(i * 7) * 9).toFixed(1);
  return {
    id: i,
    commodity,
    exportCountry,
    importCountry,
    volume: +(0.5 + sr(i * 11) * 30).toFixed(1),
    price: Math.round(150 + sr(i * 13) * 1200),
    priceVolatility: +(5 + sr(i * 17) * 45).toFixed(1),
    climateRisk,
    supplyChainEmissions: +(0.5 + sr(i * 5) * 25).toFixed(1),
    deforestationRisk: +(sr(i * 19) * 10).toFixed(1),
    tradeRouteRisk: +(1 + sr(i * 23) * 9).toFixed(1),
    priceClimateCorrelation: +(sr(i * 29) * 85).toFixed(1),
    riskLevel: climateRisk >= 7.5 ? 'Critical' : climateRisk >= 5 ? 'High' : climateRisk >= 2.5 ? 'Medium' : 'Low',
  };
});

const TABS = [
  'Trade Overview', 'Commodity Prices', 'Supply Disruption', 'Emissions Intensity',
  'Deforestation Risk', 'Price Volatility', 'Trade Route Risk', 'Portfolio Exposure',
];

const PRICE_HISTORY = [2020, 2021, 2022, 2023, 2024].map((yr, i) => ({
  year: yr,
  Wheat: Math.round(200 + sr(i * 3) * 200 + (i === 2 ? 150 : 0)),
  Maize: Math.round(180 + sr(i * 7) * 160 + (i === 2 ? 100 : 0)),
  Soy: Math.round(350 + sr(i * 11) * 200),
  Coffee: Math.round(1400 + sr(i * 13) * 600),
  Cocoa: Math.round(2200 + sr(i * 17) * 1200),
}));

const COMMODITY_COLORS = ['#0369a1', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#0f766e', '#4d7c5f', '#b8860b', '#ea580c', '#4f46e5'];

export default function ClimateCommodityAnalyticsPage() {
  const [tab, setTab] = useState(0);
  const [commodityFilter, setCommodityFilter] = useState('All');
  const [regionFilter, setRegionFilter] = useState('All');
  const [riskFilter, setRiskFilter] = useState('All');
  const [carbonPrice, setCarbonPrice] = useState(40);
  const [supplyShock, setSupplyShock] = useState(10);

  const filtered = useMemo(() => {
    return TRADE_FLOWS.filter(f => {
      if (commodityFilter !== 'All' && f.commodity !== commodityFilter) return false;
      if (regionFilter !== 'All' && f.exportCountry !== regionFilter) return false;
      if (riskFilter !== 'All' && f.riskLevel !== riskFilter) return false;
      return true;
    });
  }, [commodityFilter, regionFilter, riskFilter]);

  const kpis = useMemo(() => {
    const n = Math.max(1, filtered.length);
    const totalVolume = filtered.reduce((a, f) => a + f.volume, 0);
    const avgClimate = filtered.reduce((a, f) => a + f.climateRisk, 0) / n;
    const avgVolatility = filtered.reduce((a, f) => a + f.priceVolatility, 0) / n;
    const avgEmissions = filtered.reduce((a, f) => a + f.supplyChainEmissions, 0) / n;
    return { totalVolume: totalVolume.toFixed(0), avgClimate: avgClimate.toFixed(1), avgVolatility: avgVolatility.toFixed(1), avgEmissions: avgEmissions.toFixed(1) };
  }, [filtered]);

  const volumeByCommodity = useMemo(() =>
    COMMODITIES.map(c => {
      const items = filtered.filter(f => f.commodity === c);
      const shockAdj = 1 - (items[0]?.climateRisk || 0) / 10 * supplyShock / 100;
      return {
        commodity: c,
        volume: +(items.reduce((a, f) => a + f.volume, 0)).toFixed(1),
        adjusted: +(items.reduce((a, f) => a + f.volume, 0) * Math.max(0.5, shockAdj)).toFixed(1),
      };
    }), [filtered, supplyShock]);

  const climateScatter = useMemo(() =>
    filtered.slice(0, 60).map(f => ({ x: f.climateRisk, y: f.priceVolatility, name: `${f.commodity}/${f.exportCountry}` })), [filtered]);

  const emissionsByCommodity = useMemo(() =>
    COMMODITIES.map(c => {
      const items = filtered.filter(f => f.commodity === c);
      const n = Math.max(1, items.length);
      const emis = items.reduce((a, f) => a + f.supplyChainEmissions, 0) / n;
      return { commodity: c, emissions: +emis.toFixed(1), carbonCost: +(emis * carbonPrice / 1000).toFixed(2) };
    }), [filtered, carbonPrice]);

  const defoRisk = useMemo(() =>
    COMMODITIES.map(c => {
      const items = filtered.filter(f => f.commodity === c);
      const n = Math.max(1, items.length);
      return { commodity: c, defoRisk: +(items.reduce((a, f) => a + f.deforestationRisk, 0) / n).toFixed(1) };
    }), [filtered]);

  const s = { fontFamily: "'DM Sans', system-ui, sans-serif" };

  return (
    <div style={{ ...s, background: T.bg, minHeight: '100vh', padding: '24px' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono, marginBottom: 4 }}>EP-DG6 · Food, Agriculture & Land Use</div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: T.navy, margin: 0 }}>Climate Commodity Analytics</h1>
        <p style={{ color: T.textSec, fontSize: 13, margin: '4px 0 0' }}>Climate risk, price volatility, supply disruption and emissions intensity across 80 soft commodity trade flows</p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Trade Volume (Mt)', value: `${kpis.totalVolume}`, color: T.navy },
          { label: 'Avg Climate Risk Score', value: `${kpis.avgClimate}/10`, color: T.red },
          { label: 'Avg Price Volatility', value: `${kpis.avgVolatility}%`, color: T.amber },
          { label: 'Avg Emissions Intensity', value: `${kpis.avgEmissions} kgCO2e/kg`, color: T.orange },
        ].map(k => (
          <div key={k.label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 18px' }}>
            <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>{k.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 20px', marginBottom: 20, display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {[
          { label: 'Commodity', value: commodityFilter, set: setCommodityFilter, opts: ['All', ...COMMODITIES] },
          { label: 'Exporter', value: regionFilter, set: setRegionFilter, opts: ['All', ...EXPORT_COUNTRIES] },
          { label: 'Risk Level', value: riskFilter, set: setRiskFilter, opts: ['All', ...RISK_LEVELS] },
        ].map(f => (
          <div key={f.label}>
            <div style={{ fontSize: 11, color: T.textSec, marginBottom: 3 }}>{f.label}</div>
            <select value={f.value} onChange={e => f.set(e.target.value)} style={{ fontSize: 13, border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 8px', background: T.bg, color: T.textPri }}>
              {f.opts.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        ))}
        <div>
          <div style={{ fontSize: 11, color: T.textSec, marginBottom: 3 }}>Carbon Price: ${carbonPrice}/tCO2</div>
          <input type="range" min={10} max={200} step={5} value={carbonPrice} onChange={e => setCarbonPrice(+e.target.value)} style={{ width: 120 }} />
        </div>
        <div>
          <div style={{ fontSize: 11, color: T.textSec, marginBottom: 3 }}>Supply Shock: {supplyShock}%</div>
          <input type="range" min={0} max={50} step={5} value={supplyShock} onChange={e => setSupplyShock(+e.target.value)} style={{ width: 120 }} />
        </div>
        <div style={{ fontSize: 12, color: T.textSec, marginLeft: 'auto' }}>{filtered.length} trade flows</div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{
            fontSize: 12, padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
            background: tab === i ? T.navy : T.sub, color: tab === i ? '#fff' : T.textSec, fontWeight: tab === i ? 600 : 400,
          }}>{t}</button>
        ))}
      </div>

      {tab === 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 4 }}>Trade Volume by Commodity (Mt)</div>
            <div style={{ fontSize: 11, color: T.textSec, marginBottom: 12 }}>Baseline vs. supply shock adjusted ({supplyShock}% shock)</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={volumeByCommodity}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="commodity" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="volume" name="Baseline (Mt)" fill={T.blue} radius={[4, 4, 0, 0]} />
                <Bar dataKey="adjusted" name="Shock Adjusted (Mt)" fill={T.red} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 8 }}>Trade Flow Details</div>
            <div style={{ overflowY: 'auto', maxHeight: 260 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Commodity', 'From', 'Vol(Mt)', 'Price($/t)', 'Risk'].map(h => (
                      <th key={h} style={{ padding: '5px 7px', textAlign: 'left', color: T.textSec, fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 20).map(f => (
                    <tr key={f.id} style={{ borderBottom: `1px solid ${T.borderL}` }}>
                      <td style={{ padding: '4px 7px', fontWeight: 500 }}>{f.commodity}</td>
                      <td style={{ padding: '4px 7px', color: T.textSec }}>{f.exportCountry}</td>
                      <td style={{ padding: '4px 7px', fontFamily: T.fontMono }}>{f.volume}</td>
                      <td style={{ padding: '4px 7px', fontFamily: T.fontMono }}>{f.price}</td>
                      <td style={{ padding: '4px 7px' }}>
                        <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 8, fontWeight: 600, background: f.riskLevel === 'Critical' ? T.red + '22' : f.riskLevel === 'High' ? T.orange + '22' : T.amber + '22', color: f.riskLevel === 'Critical' ? T.red : f.riskLevel === 'High' ? T.orange : T.amber }}>
                          {f.riskLevel}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 4 }}>Price Index — Top 5 Commodities (2020–2024)</div>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={PRICE_HISTORY}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              {['Wheat', 'Maize', 'Soy', 'Coffee', 'Cocoa'].map((c, i) => (
                <Line key={c} type="monotone" dataKey={c} stroke={COMMODITY_COLORS[i]} strokeWidth={2} dot={{ r: 3 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 2 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 4 }}>Climate Risk vs Price Volatility</div>
          <ResponsiveContainer width="100%" height={320}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="x" name="Climate Risk" tick={{ fontSize: 11 }} label={{ value: 'Climate Risk (0–10)', position: 'insideBottom', offset: -5, fontSize: 11 }} />
              <YAxis dataKey="y" name="Price Volatility %" tick={{ fontSize: 11 }} label={{ value: 'Price Volatility %', angle: -90, position: 'insideLeft', fontSize: 11 }} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={climateScatter} fill={T.amber} fillOpacity={0.6} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 3 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 4 }}>Supply Chain Emissions Intensity (kgCO2e/kg)</div>
          <div style={{ fontSize: 11, color: T.textSec, marginBottom: 12 }}>Carbon cost overlay at ${carbonPrice}/tCO2</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={emissionsByCommodity}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="commodity" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} label={{ value: 'kgCO2e/kg', angle: -90, position: 'insideLeft', fontSize: 10 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} label={{ value: '$/kg carbon cost', angle: 90, position: 'insideRight', fontSize: 10 }} />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="emissions" name="Emissions (kgCO2e/kg)" fill={T.red} radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="carbonCost" name="Carbon Cost ($/kg)" fill={T.orange} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 4 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>Deforestation Risk by Commodity (0–10)</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={defoRisk} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis type="number" domain={[0, 10]} tick={{ fontSize: 11 }} />
              <YAxis dataKey="commodity" type="category" tick={{ fontSize: 12 }} width={80} />
              <Tooltip formatter={v => [`${v}/10`, 'Deforestation Risk']} />
              <Bar dataKey="defoRisk" fill={T.sage} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 5 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>Price Volatility by Commodity (%)</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={COMMODITIES.map(c => {
              const items = filtered.filter(f => f.commodity === c);
              const n = Math.max(1, items.length);
              return { commodity: c, volatility: +(items.reduce((a, f) => a + f.priceVolatility, 0) / n).toFixed(1) };
            })}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="commodity" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} unit="%" />
              <Tooltip formatter={v => [`${v}%`, 'Avg Volatility']} />
              <Bar dataKey="volatility" fill={T.gold} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 6 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>Trade Route Risk Score (0–10)</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={COMMODITIES.map(c => {
              const items = filtered.filter(f => f.commodity === c);
              const n = Math.max(1, items.length);
              return { commodity: c, routeRisk: +(items.reduce((a, f) => a + f.tradeRouteRisk, 0) / n).toFixed(1) };
            })}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="commodity" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 10]} />
              <Tooltip formatter={v => [`${v}/10`, 'Route Risk']} />
              <Bar dataKey="routeRisk" fill={T.purple} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 7 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 8 }}>Portfolio Exposure Summary</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 16 }}>
            {COMMODITIES.map((c, ci) => {
              const items = filtered.filter(f => f.commodity === c);
              const n = Math.max(1, items.length);
              const totalVol = items.reduce((a, f) => a + f.volume, 0);
              const avgRisk = items.reduce((a, f) => a + f.climateRisk, 0) / n;
              const shockLoss = totalVol * (avgRisk / 10) * (supplyShock / 100);
              return (
                <div key={c} style={{ background: T.sub, borderRadius: 8, padding: '10px 14px', border: `1px solid ${T.borderL}`, display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, width: 16, height: 16, borderRadius: '50%', background: COMMODITY_COLORS[ci], display: 'inline-block' }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.textPri, flex: 1 }}>{c}</span>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: T.textSec }}>Vol: {totalVol.toFixed(1)} Mt</div>
                    <div style={{ fontSize: 11, color: T.red, fontFamily: T.fontMono }}>Shock: -{shockLoss.toFixed(1)} Mt</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
