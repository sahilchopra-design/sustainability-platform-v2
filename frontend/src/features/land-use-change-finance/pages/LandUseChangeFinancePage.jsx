import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const sr = (s) => Math.abs(Math.sin(s * 9301 + 49297) * 233280) % 1;

const COUNTRIES = Array.from({ length: 24 }, (_, i) => ({
  name: ['Brazil','Indonesia','DR Congo','Peru','Colombia','Bolivia','Malaysia','Papua NG','Cameroon','Myanmar',
    'Madagascar','Mozambique','Angola','Zambia','Tanzania','Nigeria','Ethiopia','Ghana','Ivory Coast','Paraguay',
    'Argentina','Mexico','India','Vietnam'][i],
  region: ['LATAM','APAC','Africa','LATAM','LATAM','LATAM','APAC','APAC','Africa','APAC',
    'Africa','Africa','Africa','Africa','Africa','Africa','Africa','Africa','Africa','LATAM',
    'LATAM','LATAM','APAC','APAC'][i],
  deforestRateHa: +(sr(i * 7) * 500 + 50).toFixed(0),
  carbonStockMtCO2: +(sr(i * 11) * 8000 + 200).toFixed(0),
  eudrRisk: ['High','High','Critical','High','High','Medium','High','High','Medium','High',
    'Medium','Medium','Low','Medium','Medium','Medium','Low','Medium','High','High',
    'Medium','Low','Low','Medium'][i],
  reddPlus: i % 3 !== 2,
  exposureMn: +(sr(i * 19) * 600 + 30).toFixed(0),
  complianceScore: +(sr(i * 23) * 60 + 25).toFixed(1),
}));

const EUDR_COMMODITIES = [
  { name: 'Cattle / Beef', riskPct: 68, traceability: 32, volumeMt: 11.2 },
  { name: 'Soy', riskPct: 55, traceability: 48, volumeMt: 360 },
  { name: 'Palm Oil', riskPct: 72, traceability: 28, volumeMt: 78 },
  { name: 'Timber / Wood', riskPct: 61, traceability: 41, volumeMt: 420 },
  { name: 'Cocoa', riskPct: 58, traceability: 44, volumeMt: 5.6 },
  { name: 'Coffee', riskPct: 42, traceability: 55, volumeMt: 10.7 },
  { name: 'Rubber', riskPct: 45, traceability: 38, volumeMt: 14.2 },
];

const REDD_PROJECTS = Array.from({ length: 12 }, (_, i) => ({
  id: `REDD-${1000 + i}`,
  country: COUNTRIES[i % COUNTRIES.length].name,
  vintage: 2020 + (i % 5),
  credits: +(sr(i * 13) * 2000 + 100).toFixed(0),
  priceUSD: +(sr(i * 17) * 12 + 4).toFixed(2),
  verification: ['Gold Standard', 'VCS', 'Plan Vivo', 'CCB'][i % 4],
  permanence: +(sr(i * 29) * 30 + 60).toFixed(0),
  leakageRisk: ['Low', 'Medium', 'High'][i % 3],
}));

const YEARS = [2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030];

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

const TABS = ['Overview', 'Deforestation Risk', 'EUDR Compliance', 'REDD+ Finance', 'Carbon Markets', 'Portfolio Exposure', 'Mitigation'];
const card = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, marginBottom: 20 };
const h2 = { fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 16, marginTop: 0 };
const grid = (cols) => ({ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16, marginBottom: 24 });
const select = { background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6, color: T.text, padding: '6px 10px', fontSize: 12 };
const riskColor = (r) => ({ Critical: T.red, High: T.amber, Medium: T.gold, Low: T.green }[r] || T.textSec);

export default function LandUseChangeFinancePage() {
  const [tab, setTab] = useState('Overview');
  const [region, setRegion] = useState('All');
  const [reddSort, setReddSort] = useState('credits');

  const regions = ['All', ...new Set(COUNTRIES.map(c => c.region))];
  const filteredCountries = region === 'All' ? COUNTRIES : COUNTRIES.filter(c => c.region === region);

  const deforestData = useMemo(() => [...filteredCountries]
    .sort((a, b) => b.deforestRateHa - a.deforestRateHa)
    .slice(0, 10)
    .map(c => ({ name: c.name.slice(0, 8), deforest: c.deforestRateHa, carbon: +(c.carbonStockMtCO2 / 1000).toFixed(1) })),
    [filteredCountries]);

  const eudrData = useMemo(() => EUDR_COMMODITIES.map(c => ({ name: c.name.split(' ')[0], risk: c.riskPct, trace: c.traceability })), []);

  const carbonTrend = useMemo(() => YEARS.map((yr, i) => ({
    year: yr,
    volume: +(sr(i * 31) * 50 + 20).toFixed(1),
    price: +(4 + i * 1.5 + sr(i * 7) * 2).toFixed(2),
  })), []);

  const portfolioData = useMemo(() => filteredCountries
    .slice(0, 10)
    .map(c => ({ name: c.name.slice(0, 8), exposure: +c.exposureMn, score: c.complianceScore })),
    [filteredCountries]);

  const sortedRedd = useMemo(() => [...REDD_PROJECTS].sort((a, b) => b[reddSort] - a[reddSort]), [reddSort]);

  const totalExposure = filteredCountries.reduce((a, c) => a + +c.exposureMn, 0);
  const highRiskExposure = filteredCountries.filter(c => ['High', 'Critical'].includes(c.eudrRisk)).reduce((a, c) => a + +c.exposureMn, 0);

  const tabBar = { display: 'flex', gap: 4, marginBottom: 28, borderBottom: `1px solid ${T.border}` };
  const tabBtn = (active) => ({ padding: '10px 18px', fontSize: 13, fontWeight: active ? 600 : 400,
    color: active ? T.navyL : T.textSec, borderBottom: active ? `2px solid ${T.navyL}` : '2px solid transparent',
    cursor: 'pointer', background: 'none', border: 'none', marginBottom: -1 });

  return (
    <div style={{ background: T.bg, minHeight: '100vh', color: T.text, fontFamily: T.font, padding: '24px 32px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px', color: T.text }}>Land Use Change Finance</h1>
        <p style={{ margin: 0, color: T.textSec, fontSize: 13 }}>Deforestation risk, EUDR compliance, REDD+ linkage &amp; land conversion finance analytics</p>
      </div>
      <div style={tabBar}>{TABS.map(t => <button key={t} style={tabBtn(tab === t)} onClick={() => setTab(t)}>{t}</button>)}</div>

      {tab === 'Overview' && (
        <>
          <div style={grid(4)}>
            <KpiCard label="Total Forest Loss" value="4.7M ha" sub="2024 annual global primary loss" color={T.red} />
            <KpiCard label="Carbon at Risk" value={`${(COUNTRIES.reduce((a, c) => a + c.carbonStockMtCO2, 0) / 1000).toFixed(0)} GtCO₂`} sub="Total tracked carbon stock" color={T.amber} />
            <KpiCard label="EUDR Deadline" value="Dec 2025" sub="Large operators compliance date" color={T.navy} />
            <KpiCard label="REDD+ Active" value={COUNTRIES.filter(c => c.reddPlus).length} sub={`of ${COUNTRIES.length} tracked nations`} color={T.green} />
          </div>
          <div style={card}>
            <h2 style={h2}>Top 10 Deforestation Hotspots (ha/yr)</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={deforestData} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 8 }} />
                <Bar dataKey="deforest" name="Deforestation (ha/yr)" fill={T.red} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={card}>
              <h2 style={h2}>EUDR Commodity Risk</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={eudrData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
                  <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 8 }} />
                  <Legend />
                  <Bar dataKey="risk" name="Deforestation Risk %" fill={T.red} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="trace" name="Traceability %" fill={T.green} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <h2 style={h2}>Country Risk Summary</h2>
              <div style={{ overflowY: 'auto', maxHeight: 220 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead><tr style={{ borderBottom: `1px solid ${T.border}` }}>
                    {['Country','Region','EUDR Risk','REDD+','Exposure'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '4px 8px', color: T.textMut, fontWeight: 500 }}>{h}</th>
                    ))}</tr></thead>
                  <tbody>{COUNTRIES.slice(0, 10).map(c => (
                    <tr key={c.name} style={{ borderBottom: `1px solid ${T.border}22` }}>
                      <td style={{ padding: '4px 8px', color: T.text }}>{c.name}</td>
                      <td style={{ padding: '4px 8px', color: T.textSec }}>{c.region}</td>
                      <td style={{ padding: '4px 8px', color: riskColor(c.eudrRisk), fontWeight: 600 }}>{c.eudrRisk}</td>
                      <td style={{ padding: '4px 8px', color: c.reddPlus ? T.green : T.textMut }}>{c.reddPlus ? '✓' : '–'}</td>
                      <td style={{ padding: '4px 8px', fontFamily: T.mono, color: T.amber }}>${c.exposureMn}M</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {tab === 'Deforestation Risk' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <label style={{ fontSize: 12, color: T.textSec }}>Region:</label>
            <select style={select} value={region} onChange={e => setRegion(e.target.value)}>
              {regions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div style={grid(3)}>
            <KpiCard label="Countries Tracked" value={filteredCountries.length} sub={`${region} region`} color={T.navy} />
            <KpiCard label="Total Exposure" value={`$${totalExposure.toLocaleString()}M`} sub="Portfolio financial exposure" color={T.amber} />
            <KpiCard label="High/Critical Risk" value={`${totalExposure > 0 ? ((highRiskExposure / totalExposure) * 100).toFixed(1) : 0}%`} sub="Exposure in elevated risk countries" color={T.red} />
          </div>
          <div style={card}>
            <h2 style={h2}>Deforestation Rate vs Carbon Stock at Risk</h2>
            <ResponsiveContainer width="100%" height={280}>
              <ScatterChart margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="deforestRateHa" name="Deforestation Rate (ha/yr)" label={{ value: 'Deforestation ha/yr', position: 'insideBottom', offset: -5, fill: T.textSec, fontSize: 11 }} tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis dataKey="carbonStockMtCO2" name="Carbon Stock (MtCO₂)" label={{ value: 'Carbon Stock MtCO₂', angle: -90, position: 'insideLeft', fill: T.textSec, fontSize: 11 }} tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 8 }} />
                <Scatter data={filteredCountries} fill={T.red} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <h2 style={h2}>Country Risk Heatmap</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead><tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {['Country','Region','Defor. Rate','Carbon Stock','EUDR Risk','REDD+','Compliance Score'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '6px 8px', color: T.textMut, fontWeight: 500 }}>{h}</th>
                ))}</tr></thead>
              <tbody>{filteredCountries.map(c => (
                <tr key={c.name} style={{ borderBottom: `1px solid ${T.border}22` }}>
                  <td style={{ padding: '5px 8px', color: T.text, fontWeight: 500 }}>{c.name}</td>
                  <td style={{ padding: '5px 8px', color: T.textSec }}>{c.region}</td>
                  <td style={{ padding: '5px 8px', fontFamily: T.mono, color: T.red }}>{c.deforestRateHa.toLocaleString()}</td>
                  <td style={{ padding: '5px 8px', fontFamily: T.mono, color: T.amber }}>{c.carbonStockMtCO2.toLocaleString()} Mt</td>
                  <td style={{ padding: '5px 8px', color: riskColor(c.eudrRisk), fontWeight: 600 }}>{c.eudrRisk}</td>
                  <td style={{ padding: '5px 8px', color: c.reddPlus ? T.green : T.textMut }}>{c.reddPlus ? '✓ Active' : '–'}</td>
                  <td style={{ padding: '5px 8px', fontFamily: T.mono, color: T.navyL }}>{c.complianceScore}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'EUDR Compliance' && (
        <>
          <div style={grid(4)}>
            <KpiCard label="EUDR Deadline" value="Dec 2025" sub="Large operators (>250 employees)" color={T.navy} />
            <KpiCard label="High-Risk Commodities" value={EUDR_COMMODITIES.filter(c => c.riskPct > 55).length} sub={`of ${EUDR_COMMODITIES.length} regulated commodities`} color={T.red} />
            <KpiCard label="Avg Traceability" value={`${(EUDR_COMMODITIES.reduce((a, c) => a + c.traceability, 0) / EUDR_COMMODITIES.length).toFixed(0)}%`} sub="Across all EUDR commodities" color={T.amber} />
            <KpiCard label="Compliance Gap" value={`${(100 - EUDR_COMMODITIES.reduce((a, c) => a + c.traceability, 0) / EUDR_COMMODITIES.length).toFixed(0)}%`} sub="Average traceability shortfall" color={T.red} />
          </div>
          <div style={card}>
            <h2 style={h2}>EUDR Commodity Deforestation Risk vs Traceability</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={EUDR_COMMODITIES.map(c => ({ name: c.name.split(' ')[0], risk: c.riskPct, trace: c.traceability, gap: 100 - c.traceability }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 8 }} />
                <Legend />
                <Bar dataKey="risk" name="Deforestation Risk %" fill={T.red} radius={[3, 3, 0, 0]} />
                <Bar dataKey="trace" name="Traceability %" fill={T.green} radius={[3, 3, 0, 0]} />
                <Bar dataKey="gap" name="Compliance Gap %" fill={T.amber} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <h2 style={h2}>EUDR Commodity Detail</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {['Commodity','Deforest. Risk %','Traceability %','Compliance Gap','Volume (Mt/yr)'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px', color: T.textMut, fontWeight: 500 }}>{h}</th>
                ))}</tr></thead>
              <tbody>{EUDR_COMMODITIES.map(c => (
                <tr key={c.name} style={{ borderBottom: `1px solid ${T.border}22` }}>
                  <td style={{ padding: '7px 8px', color: T.text, fontWeight: 500 }}>{c.name}</td>
                  <td style={{ padding: '7px 8px', fontFamily: T.mono, color: c.riskPct > 60 ? T.red : T.amber }}>{c.riskPct}%</td>
                  <td style={{ padding: '7px 8px', fontFamily: T.mono, color: T.green }}>{c.traceability}%</td>
                  <td style={{ padding: '7px 8px', fontFamily: T.mono, color: T.red }}>{100 - c.traceability}%</td>
                  <td style={{ padding: '7px 8px', fontFamily: T.mono, color: T.textSec }}>{c.volumeMt}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'REDD+ Finance' && (
        <>
          <div style={grid(3)}>
            <KpiCard label="Active REDD+ Projects" value={REDD_PROJECTS.length} sub="In tracked portfolio" color={T.green} />
            <KpiCard label="Total Credits" value={`${REDD_PROJECTS.reduce((a, p) => a + p.credits, 0).toLocaleString()} ktCO₂`} sub="Across all active projects" color={T.navy} />
            <KpiCard label="Avg Price" value={`$${(REDD_PROJECTS.reduce((a, p) => a + p.priceUSD, 0) / REDD_PROJECTS.length).toFixed(2)}`} sub="USD per tCO₂ (REDD+ portfolio)" color={T.gold} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: T.textSec }}>Sort by:</label>
            <select style={select} value={reddSort} onChange={e => setReddSort(e.target.value)}>
              <option value="credits">Credits Volume</option>
              <option value="priceUSD">Price</option>
              <option value="permanence">Permanence</option>
            </select>
          </div>
          <div style={card}>
            <h2 style={h2}>REDD+ Project Portfolio</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead><tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {['Project ID','Country','Vintage','Credits (ktCO₂)','Price USD','Standard','Permanence %','Leakage'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '6px 8px', color: T.textMut, fontWeight: 500 }}>{h}</th>
                ))}</tr></thead>
              <tbody>{sortedRedd.map(p => (
                <tr key={p.id} style={{ borderBottom: `1px solid ${T.border}22` }}>
                  <td style={{ padding: '5px 8px', fontFamily: T.mono, color: T.navyL }}>{p.id}</td>
                  <td style={{ padding: '5px 8px', color: T.text }}>{p.country}</td>
                  <td style={{ padding: '5px 8px', fontFamily: T.mono, color: T.textSec }}>{p.vintage}</td>
                  <td style={{ padding: '5px 8px', fontFamily: T.mono, color: T.green }}>{p.credits.toLocaleString()}</td>
                  <td style={{ padding: '5px 8px', fontFamily: T.mono, color: T.gold }}>${p.priceUSD}</td>
                  <td style={{ padding: '5px 8px', color: T.textSec }}>{p.verification}</td>
                  <td style={{ padding: '5px 8px', fontFamily: T.mono, color: T.teal }}>{p.permanence}%</td>
                  <td style={{ padding: '5px 8px', color: riskColor(p.leakageRisk) }}>{p.leakageRisk}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'Carbon Markets' && (
        <>
          <div style={grid(4)}>
            <KpiCard label="VCM Volume 2024" value="~200 MtCO₂" sub="Voluntary Carbon Market" color={T.navy} />
            <KpiCard label="Avg Land Use Price" value="$8–18" sub="USD per tCO₂ (REDD+/IFM)" color={T.gold} />
            <KpiCard label="Article 6 Linkage" value="Active" sub="Paris Agreement bilateral pilots" color={T.green} />
            <KpiCard label="Biodiversity Co-benefit" value="CCB+" sub="Climate, Community & Biodiversity" color={T.teal} />
          </div>
          <div style={card}>
            <h2 style={h2}>Land Use Carbon Credit Volume &amp; Price Trend</h2>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={carbonTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 8 }} />
                <Legend />
                <Area yAxisId="left" type="monotone" dataKey="volume" name="Volume (MtCO₂)" stroke={T.navy} fill={`${T.navy}33`} strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="price" name="Price (USD/tCO₂)" stroke={T.gold} strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <h2 style={h2}>Market Standards Comparison</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {[
                { std: 'VCS / Verra', integrity: 78, coBenefit: 42, liquidity: 82, mktShare: 38 },
                { std: 'Gold Standard', integrity: 88, coBenefit: 85, liquidity: 61, mktShare: 22 },
                { std: 'Plan Vivo', integrity: 82, coBenefit: 91, liquidity: 35, mktShare: 8 },
                { std: 'CCB Standard', integrity: 80, coBenefit: 94, liquidity: 28, mktShare: 6 },
              ].map(std => (
                <div key={std.std} style={{ background: T.surfaceH, borderRadius: 8, padding: 14 }}>
                  <div style={{ fontWeight: 600, color: T.navy, marginBottom: 10, fontSize: 12 }}>{std.std}</div>
                  {[{ label: 'Integrity', val: std.integrity }, { label: 'Co-Benefits', val: std.coBenefit },
                    { label: 'Liquidity', val: std.liquidity }, { label: 'Market Share %', val: std.mktShare }].map(m => (
                    <div key={m.label} style={{ marginBottom: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                        <span style={{ fontSize: 10, color: T.textMut }}>{m.label}</span>
                        <span style={{ fontFamily: T.mono, fontSize: 10, color: T.text }}>{m.val}</span>
                      </div>
                      <div style={{ background: T.border, borderRadius: 2, height: 4 }}>
                        <div style={{ width: `${m.val}%`, background: T.navyL, borderRadius: 2, height: '100%' }} />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {tab === 'Portfolio Exposure' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <label style={{ fontSize: 12, color: T.textSec }}>Region:</label>
            <select style={select} value={region} onChange={e => setRegion(e.target.value)}>
              {regions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div style={grid(3)}>
            <KpiCard label="Total Exposure" value={`$${totalExposure.toLocaleString()}M`} sub={`${filteredCountries.length} countries tracked`} color={T.navy} />
            <KpiCard label="High-Risk Exposure" value={`$${highRiskExposure.toLocaleString()}M`} sub="High/Critical EUDR risk countries" color={T.red} />
            <KpiCard label="Avg Compliance Score" value={filteredCountries.length > 0 ? (filteredCountries.reduce((a, c) => a + c.complianceScore, 0) / filteredCountries.length).toFixed(1) : '–'} sub="Portfolio weighted average" color={T.amber} />
          </div>
          <div style={card}>
            <h2 style={h2}>Exposure by Country (Top 10)</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={portfolioData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 8 }} />
                <Legend />
                <Bar yAxisId="left" dataKey="exposure" name="Exposure ($M)" fill={T.navy} radius={[3, 3, 0, 0]} />
                <Bar yAxisId="right" dataKey="score" name="Compliance Score" fill={T.amber} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {tab === 'Mitigation' && (
        <>
          <div style={grid(4)}>
            <KpiCard label="REDD+ Eligible" value="$1.2Tn" sub="Gross value of avoided deforestation" color={T.green} />
            <KpiCard label="IFM Potential" value="820 MtCO₂/yr" sub="Improved Forest Management" color={T.sage} />
            <KpiCard label="ARR Projects" value="340+" sub="A/R active globally (CDM + VCM)" color={T.teal} />
            <KpiCard label="EUDR Reduction" value="−71 Mt" sub="Est. annual GHG reduction if enforced" color={T.navy} />
          </div>
          <div style={card}>
            <h2 style={h2}>Mitigation Finance Pathways</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              {[
                { name: 'REDD+', mechanism: 'Avoided deforestation & degradation', scale: 'GtCO₂/yr', finance: '$4–20/tCO₂', suitable: 'Article 6 ITMOs, VCM', color: T.green },
                { name: 'IFM', mechanism: 'Improved forest management', scale: 'MtCO₂/yr', finance: '$6–15/tCO₂', suitable: 'VCM, CORSIA', color: T.sage },
                { name: 'ARR', mechanism: 'Afforestation / Reforestation', scale: 'MtCO₂/yr', finance: '$8–25/tCO₂', suitable: 'CDM, VCM, CBDCs', color: T.teal },
                { name: 'Agroforestry', mechanism: 'Trees integrated in farmland', scale: 'MtCO₂/yr', finance: '$5–18/tCO₂', suitable: 'SLLs, CSA bonds', color: T.amber },
                { name: 'Soil Carbon', mechanism: 'Sequestration in agricultural soils', scale: 'MtCO₂/yr', finance: '$10–35/tCO₂', suitable: 'VCM, inset credits', color: T.gold },
                { name: 'Wetland / Peatland', mechanism: 'Peatland rewetting & protection', scale: 'MtCO₂/yr', finance: '$12–40/tCO₂', suitable: 'Blended finance', color: T.navy },
              ].map(m => (
                <div key={m.name} style={{ background: T.surfaceH, borderRadius: 8, padding: 14, border: `1px solid ${m.color}44` }}>
                  <div style={{ fontWeight: 700, color: m.color, fontSize: 13, marginBottom: 6 }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: T.textSec, marginBottom: 8 }}>{m.mechanism}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {[{ label: 'Scale', val: m.scale }, { label: 'Price', val: m.finance }, { label: 'Instruments', val: m.suitable }].map(f => (
                      <div key={f.label} style={{ gridColumn: f.label === 'Instruments' ? 'span 2' : 'auto' }}>
                        <div style={{ fontSize: 9, color: T.textMut }}>{f.label}</div>
                        <div style={{ fontFamily: T.mono, fontSize: 11, color: T.text }}>{f.val}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
