import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

const sr = (seed) => { let x = Math.sin(seed + 1) * 10000; return x - Math.floor(x); };
const T = { bg: '#0f1117', surface: '#1a1d27', surfaceH: '#22263a', border: '#2a2f45', borderL: '#1e2235', navy: '#1e3a5f', gold: '#d4a843', sage: '#2d6a4f', teal: '#0d4f5c', text: '#e8e0d0', textSec: '#a89880', textMut: '#6b6050', red: '#c0392b', green: '#27ae60', amber: '#e67e22', font: "'DM Sans', sans-serif", mono: "'JetBrains Mono', monospace" };

const MDBS = [
  { id: 'wb', name: 'World Bank (IBRD)', type: 'Global', aaa: true, climateTarget: 35, totalLending: 73, avgRate: 4.85, avgTenor: 25, guaranteeCap: 6, subSovShare: 28, greenShare: 40, regions: 'Global EM' },
  { id: 'ifc', name: 'IFC (World Bank Group)', type: 'Private sector', aaa: true, climateTarget: 35, totalLending: 42, avgRate: 5.20, avgTenor: 12, guaranteeCap: 10, subSovShare: 55, greenShare: 38, regions: 'Global EM' },
  { id: 'adb', name: 'Asian Development Bank', type: 'Regional', aaa: true, climateTarget: 44, totalLending: 38, avgRate: 4.60, avgTenor: 20, guaranteeCap: 5, subSovShare: 32, greenShare: 52, regions: 'Asia-Pacific' },
  { id: 'aiib', name: 'AIIB', type: 'Regional', aaa: false, climateTarget: 50, totalLending: 16, avgRate: 5.10, avgTenor: 20, guaranteeCap: 3, subSovShare: 40, greenShare: 48, regions: 'Asia & global' },
  { id: 'iadb', name: 'Inter-American Dev. Bank', type: 'Regional', aaa: true, climateTarget: 40, totalLending: 22, avgRate: 4.75, avgTenor: 20, guaranteeCap: 4, subSovShare: 25, greenShare: 35, regions: 'Latin America' },
  { id: 'afdb', name: 'African Development Bank', type: 'Regional', aaa: true, climateTarget: 40, totalLending: 12, avgRate: 4.50, avgTenor: 22, guaranteeCap: 2, subSovShare: 20, greenShare: 45, regions: 'Africa' },
  { id: 'ebrd', name: 'European Bank for Reconstruction', type: 'Regional', aaa: true, climateTarget: 50, totalLending: 15, avgRate: 5.30, avgTenor: 10, guaranteeCap: 3, subSovShare: 62, greenShare: 55, regions: 'Eastern Europe/CA' },
];

const INSTRUMENTS = [
  { name: 'Sovereign Loan (OCR)', pricing: 'Benchmark + 25-80bps', tenor: '10-30yr', guarantee: 'Sovereign guarantee required', currency: 'Hard or local', useCase: 'Infrastructure, social' },
  { name: 'Non-Sovereign Guarantee', pricing: 'Premium 50-150bps', tenor: '5-15yr', guarantee: 'Partial credit guarantee', currency: 'Local preferred', useCase: 'Sub-sovereign, private' },
  { name: 'Green Bond Anchor', pricing: 'At market (greenium benefit)', tenor: '5-20yr', guarantee: 'None / backstop', currency: 'Hard currency', useCase: 'Green projects at sub-sovereign' },
  { name: 'Blended Finance Facility', pricing: 'Concessional + commercial mix', tenor: '10-20yr', guarantee: 'First-loss tranche', currency: 'Varies', useCase: 'Emerging market adaptation' },
  { name: 'Policy-Based Guarantee', pricing: 'Guarantee fee 0.5-1.5%', tenor: 'Up to 20yr', guarantee: 'Partial risk guarantee', currency: 'Hard or local', useCase: 'Regulatory reform-linked' },
  { name: 'Local Currency Loan', pricing: 'Benchmark + 150-300bps', tenor: '5-12yr', guarantee: 'None', currency: 'Local currency', useCase: 'FX risk-free sub-sovereign' },
];

const COUNTRY_ALLOCATIONS = [
  { country: 'India', mdb: 'ADB/WB', amount: 9.8, sector: 'Renewables', climateShare: 62, tenor: 20, rating: 'BBB-' },
  { country: 'Brazil', mdb: 'IADB/WB', amount: 7.2, sector: 'Amazon + Transit', climateShare: 55, tenor: 18, rating: 'BB+' },
  { country: 'Indonesia', mdb: 'ADB/AIIB', amount: 5.6, sector: 'Energy transition', climateShare: 71, tenor: 22, rating: 'BBB' },
  { country: 'South Africa', mdb: 'AIIB/AfDB', amount: 4.1, sector: 'Just transition', climateShare: 80, tenor: 15, rating: 'BB-' },
  { country: 'Egypt', mdb: 'AfDB/IFC', amount: 3.8, sector: 'Solar + water', climateShare: 68, tenor: 18, rating: 'B+' },
  { country: 'Turkey', mdb: 'EBRD/IFC', amount: 3.2, sector: 'EE + renewables', climateShare: 58, tenor: 12, rating: 'B+' },
  { country: 'Colombia', mdb: 'IADB', amount: 2.9, sector: 'Nature + urban', climateShare: 60, tenor: 20, rating: 'BB+' },
  { country: 'Bangladesh', mdb: 'ADB/WB', amount: 2.4, sector: 'Adaptation', climateShare: 85, tenor: 25, rating: 'BB-' },
];

const TABS = ['Overview', 'MDB Landscape', 'Loan Structuring', 'Concessionality Engine', 'Blended Finance', 'Guarantee Instruments', 'Country Allocation', 'ESG Conditionality', 'Currency Risk', 'Portfolio Analytics'];

function calcGrantElement({ faceValue, coupon, benchmarkRate, tenor }) {
  const dr = benchmarkRate / 100;
  const c = coupon / 100;
  const pv = Array.from({ length: tenor }, (_, t) => (faceValue * c) / Math.pow(1 + dr, t + 1)).reduce((a, b) => a + b, 0) + faceValue / Math.pow(1 + dr, tenor);
  const grantElement = ((faceValue - pv) / faceValue) * 100;
  return Math.max(0, grantElement).toFixed(1);
}

function calcConcessionality({ mdbRate, commercialRate, tenor, faceValue }) {
  const annualBenefit = faceValue * (commercialRate - mdbRate) / 100;
  const pvSaving = Array.from({ length: tenor }, (_, t) => annualBenefit / Math.pow(1 + commercialRate / 100, t + 1)).reduce((a, b) => a + b, 0);
  return pvSaving.toFixed(2);
}

const Kpi = ({ label, value, sub, color }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: '14px 18px', flex: 1, minWidth: 140 }}>
    <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.gold, fontFamily: T.mono }}>{value}</div>
    {sub && <div style={{ fontSize: 10, color: T.textSec, marginTop: 3 }}>{sub}</div>}
  </div>
);

export default function MdbSubSovereignLendingPage() {
  const [tab, setTab] = useState('Overview');
  const [selectedMdb, setSelectedMdb] = useState('wb');
  const [loanAmount, setLoanAmount] = useState(100);
  const [mdbRate, setMdbRate] = useState(4.85);
  const [commercialRate, setCommercialRate] = useState(7.5);
  const [tenor, setTenor] = useState(20);
  const [blendRatio, setBlendRatio] = useState(30);

  const mdb = MDBS.find(m => m.id === selectedMdb) || MDBS[0];
  const grantElement = calcGrantElement({ faceValue: loanAmount, coupon: mdbRate, benchmarkRate: 10, tenor });
  const pvSaving = calcConcessionality({ mdbRate, commercialRate, tenor, faceValue: loanAmount });
  const blendedRate = ((blendRatio / 100) * mdbRate + ((100 - blendRatio) / 100) * commercialRate).toFixed(2);

  const totalClimate = MDBS.reduce((s, m) => s + m.totalLending * m.climateTarget / 100, 0);
  const totalLending = MDBS.reduce((s, m) => s + m.totalLending, 0);

  const radarData = [
    { metric: 'Climate Target', value: mdb.climateTarget },
    { metric: 'Green Share', value: mdb.greenShare },
    { metric: 'Sub-Sov Share', value: mdb.subSovShare },
    { metric: 'Tenor (yrs/3)', value: Math.min(100, mdb.avgTenor * 3) },
    { metric: 'Guarantee Cap', value: Math.min(100, mdb.guaranteeCap * 10) },
  ];

  const allocationChart = COUNTRY_ALLOCATIONS.map(c => ({ country: c.country, amount: c.amount, climate: c.climateShare }));

  const costSavingCurve = useMemo(() => Array.from({ length: 10 }, (_, i) => ({
    spread: (commercialRate - mdbRate - i * 0.3).toFixed(2),
    saving: (Number(pvSaving) * (1 - i * 0.08)).toFixed(1),
  })).filter(d => d.spread > 0), [pvSaving, mdbRate, commercialRate]);

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.font, color: T.text, padding: '24px 32px' }}>
      <div style={{ borderBottom: `2px solid ${T.gold}`, paddingBottom: 16, marginBottom: 24 }}>
        <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, letterSpacing: '0.12em', marginBottom: 6 }}>EP-DY3 · MDB SUB-SOVEREIGN LENDING ENGINE</div>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: T.text }}>MDB Sub-Sovereign Lending Engine</h1>
        <div style={{ fontSize: 13, color: T.textSec, marginTop: 6 }}>World Bank · IFC · ADB · AIIB · IADB · AfDB · EBRD · Concessionality · Blended Finance · Guarantee Instruments</div>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 28, flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '7px 14px', borderRadius: 4, border: `1px solid ${tab === t ? T.gold : T.border}`, background: tab === t ? T.gold : T.surface, color: tab === t ? T.bg : T.textSec, fontFamily: T.mono, fontSize: 11, cursor: 'pointer', fontWeight: tab === t ? 700 : 400 }}>{t}</button>
        ))}
      </div>

      {tab === 'Overview' && (
        <div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
            <Kpi label="MDB TOTAL LENDING" value={`$${totalLending}Bn`} sub="All tracked MDBs" />
            <Kpi label="CLIMATE FINANCE" value={`$${totalClimate.toFixed(0)}Bn`} sub="Annual climate target" color={T.green} />
            <Kpi label="AVG MDB RATE" value={`${(MDBS.reduce((s, m) => s + m.avgRate, 0) / MDBS.length).toFixed(2)}%`} sub="vs ~7.5% commercial" color={T.teal} />
            <Kpi label="AVG TENOR" value={`${(MDBS.reduce((s, m) => s + m.avgTenor, 0) / MDBS.length).toFixed(0)}yr`} sub="vs 5-10yr commercial" color={T.amber} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 12 }}>TOTAL LENDING BY MDB ($Bn)</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={[...MDBS].sort((a, b) => b.totalLending - a.totalLending).map(m => ({ name: m.name.split(' ')[0], lending: m.totalLending }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fill: T.textSec, fontSize: 10 }} />
                  <YAxis tick={{ fill: T.textSec, fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  <Bar dataKey="lending" fill={T.teal} name="Total Lending ($Bn)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 12 }}>CLIMATE TARGET vs GREEN SHARE (%)</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={MDBS.map(m => ({ name: m.name.split(' ')[0], target: m.climateTarget, greenShare: m.greenShare }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fill: T.textSec, fontSize: 9 }} />
                  <YAxis tick={{ fill: T.textSec, fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  <Legend />
                  <Bar dataKey="target" fill={T.green} name="Climate Target (%)" />
                  <Bar dataKey="greenShare" fill={T.sage} name="Green Share (%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 'MDB Landscape' && (
        <div>
          <div style={{ marginBottom: 20, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 12 }}>MDB UNIVERSE</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr>{['MDB', 'Type', 'AAA', 'Climate Target', 'Total ($Bn)', 'Avg Rate', 'Avg Tenor', 'Sub-Sov Share'].map(h => <th key={h} style={{ textAlign: 'left', color: T.textSec, fontFamily: T.mono, padding: '6px 10px', borderBottom: `1px solid ${T.border}` }}>{h}</th>)}</tr></thead>
              <tbody>{MDBS.map((m, i) => (
                <tr key={m.id} onClick={() => setSelectedMdb(m.id)} style={{ cursor: 'pointer', background: selectedMdb === m.id ? T.surfaceH : i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                  <td style={{ padding: '7px 10px', color: T.text, fontWeight: 600 }}>{m.name}</td>
                  <td style={{ padding: '7px 10px', color: T.textSec }}>{m.type}</td>
                  <td style={{ padding: '7px 10px', color: m.aaa ? T.green : T.amber }}>{m.aaa ? 'AAA' : 'AA'}</td>
                  <td style={{ padding: '7px 10px', color: T.green }}>{m.climateTarget}%</td>
                  <td style={{ padding: '7px 10px', color: T.gold, fontFamily: T.mono }}>${m.totalLending}Bn</td>
                  <td style={{ padding: '7px 10px', color: T.teal, fontFamily: T.mono }}>{m.avgRate.toFixed(2)}%</td>
                  <td style={{ padding: '7px 10px', color: T.textSec }}>{m.avgTenor}yr</td>
                  <td style={{ padding: '7px 10px', color: T.textSec }}>{m.subSovShare}%</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 16 }}>SELECTED: {mdb.name.toUpperCase()}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Kpi label="CLIMATE TARGET" value={`${mdb.climateTarget}%`} sub="of annual lending" color={T.green} />
                <Kpi label="SUB-SOV SHARE" value={`${mdb.subSovShare}%`} sub="without sov. guarantee" color={T.teal} />
                <Kpi label="REGIONS" value={mdb.regions} sub="Coverage" color={T.text} />
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke={T.border} />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: T.textSec, fontSize: 10 }} />
                  <Radar dataKey="value" stroke={T.teal} fill={T.teal} fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 'Loan Structuring' && (
        <div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 12 }}>MDB INSTRUMENT MENU</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr>{['Instrument', 'Pricing', 'Tenor', 'Guarantee', 'Currency', 'Use Case'].map(h => <th key={h} style={{ textAlign: 'left', color: T.textSec, fontFamily: T.mono, padding: '6px 10px', borderBottom: `1px solid ${T.border}` }}>{h}</th>)}</tr></thead>
              <tbody>{INSTRUMENTS.map((ins, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? T.surfaceH : 'transparent' }}>
                  <td style={{ padding: '7px 10px', color: T.text, fontWeight: 600 }}>{ins.name}</td>
                  <td style={{ padding: '7px 10px', color: T.gold, fontFamily: T.mono, fontSize: 11 }}>{ins.pricing}</td>
                  <td style={{ padding: '7px 10px', color: T.textSec }}>{ins.tenor}</td>
                  <td style={{ padding: '7px 10px', color: T.textSec, fontSize: 11 }}>{ins.guarantee}</td>
                  <td style={{ padding: '7px 10px', color: T.teal }}>{ins.currency}</td>
                  <td style={{ padding: '7px 10px', color: T.textSec, fontSize: 11 }}>{ins.useCase}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'Concessionality Engine' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 16 }}>CONCESSIONALITY CALCULATOR</div>
              {[['Loan Amount ($M)', loanAmount, setLoanAmount, 10, 500], ['MDB Rate (%)', mdbRate, setMdbRate, 1, 8, 0.05], ['Commercial Rate (%)', commercialRate, setCommercialRate, 4, 15, 0.05], ['Tenor (years)', tenor, setTenor, 5, 35]].map(([label, val, setter, min, max, step]) => (
                <div key={label} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>{label}: <span style={{ color: T.gold, fontFamily: T.mono }}>{typeof val === 'number' ? val.toFixed(2) : val}</span></div>
                  <input type="range" min={min} max={max} step={step || 1} value={val} onChange={e => setter(Number(e.target.value))} style={{ width: '100%', accentColor: T.gold }} />
                </div>
              ))}
              <div style={{ background: T.surfaceH, borderRadius: 6, padding: 14, marginTop: 8 }}>
                <div style={{ fontSize: 11, color: T.textSec }}>PV INTEREST SAVING</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: T.green, fontFamily: T.mono }}>${pvSaving}M</div>
                <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>Grant Element: <span style={{ color: T.gold }}>{grantElement}%</span></div>
                <div style={{ fontSize: 11, color: T.textSec }}>Rate Differential: <span style={{ color: T.teal }}>{(commercialRate - mdbRate).toFixed(2)}%</span></div>
              </div>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 12 }}>MDB RATES vs COMMERCIAL RATE COMPARISON</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={MDBS.map(m => ({ name: m.name.split(' ')[0], mdb: m.avgRate, commercial: 7.5, saving: +(7.5 - m.avgRate).toFixed(2) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fill: T.textSec, fontSize: 9 }} />
                  <YAxis tick={{ fill: T.textSec, fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  <Legend />
                  <Bar dataKey="mdb" fill={T.teal} name="MDB Rate (%)" />
                  <Bar dataKey="saving" fill={T.green} name="Rate Saving (%)" />
                  <ReferenceLine y={7.5} stroke={T.amber} strokeDasharray="4 2" label={{ value: 'Commercial', fill: T.amber, fontSize: 10 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 'Blended Finance' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 16 }}>BLENDING RATIO CALCULATOR</div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>MDB Concessional Tranche (%): <span style={{ color: T.gold, fontFamily: T.mono }}>{blendRatio}%</span></div>
                <input type="range" min={5} max={80} value={blendRatio} onChange={e => setBlendRatio(Number(e.target.value))} style={{ width: '100%', accentColor: T.gold }} />
              </div>
              <div style={{ background: T.surfaceH, borderRadius: 6, padding: 14, marginTop: 8 }}>
                <div style={{ fontSize: 11, color: T.textSec }}>BLENDED RATE</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: T.green, fontFamily: T.mono }}>{blendedRate}%</div>
                <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>MDB: {blendRatio}% @ {mdbRate.toFixed(2)}%</div>
                <div style={{ fontSize: 11, color: T.textSec }}>Commercial: {100 - blendRatio}% @ {commercialRate.toFixed(2)}%</div>
                <div style={{ fontSize: 11, color: T.teal, marginTop: 4 }}>vs. full commercial: saves {(commercialRate - Number(blendedRate)).toFixed(2)}%</div>
              </div>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 12 }}>BLENDED RATE vs BLEND RATIO</div>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={Array.from({ length: 16 }, (_, i) => { const r = i * 5; return { blend: `${r}%`, rate: ((r / 100) * mdbRate + ((100 - r) / 100) * commercialRate).toFixed(2) }; })}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="blend" tick={{ fill: T.textSec, fontSize: 10 }} />
                  <YAxis tick={{ fill: T.textSec, fontSize: 11 }} domain={['auto', 'auto']} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  <Line type="monotone" dataKey="rate" stroke={T.green} name="Blended Rate (%)" strokeWidth={2} />
                  <ReferenceLine y={mdbRate} stroke={T.teal} strokeDasharray="4 2" label={{ value: 'MDB Rate', fill: T.teal, fontSize: 10 }} />
                  <ReferenceLine y={commercialRate} stroke={T.amber} strokeDasharray="4 2" label={{ value: 'Commercial', fill: T.amber, fontSize: 10 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 'Guarantee Instruments' && (
        <div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
            <Kpi label="TOTAL GUARANTEE CAPACITY" value={`$${MDBS.reduce((s, m) => s + m.guaranteeCap, 0)}Bn`} sub="All MDBs" />
            <Kpi label="WB PCG UTILIZATION" value="42%" sub="Partial credit guarantee" color={T.teal} />
            <Kpi label="IFC PRG PIPELINE" value="$8.4Bn" sub="Partial risk guarantee" color={T.green} />
            <Kpi label="MIGA EXPOSURE" value="$25Bn" sub="Political risk insurance" color={T.amber} />
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 12 }}>GUARANTEE CAPACITY BY MDB ($Bn)</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={MDBS.map(m => ({ name: m.name.split(' ')[0], cap: m.guaranteeCap }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="name" tick={{ fill: T.textSec, fontSize: 9 }} />
                <YAxis tick={{ fill: T.textSec, fontSize: 11 }} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                <Bar dataKey="cap" fill={T.amber} name="Guarantee Cap ($Bn)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {[['Partial Credit Guarantee (PCG)', 'Covers commercial lenders against sovereign default risk. Allows sub-sovereign entities to access commercial capital markets at sovereign-equivalent terms. Coverage typically 50-100% of debt service.'],
            ['Partial Risk Guarantee (PRG)', 'Covers private lenders against specific risks (regulatory change, expropriation, non-payment by government entities). Used for PPPs and independent power producers.'],
            ['MIGA Political Risk Insurance', 'World Bank Group insurance for cross-border investment against transfer restriction, expropriation, war and civil disturbance, and breach of contract.'],
            ['Enclave Guarantee', 'IFC/MIGA instrument for foreign-currency revenue projects (e.g., export-oriented) in countries with transferability risk. Revenue held offshore.']].map(([title, desc], i) => (
            <div key={i} style={{ marginBottom: 12, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 4 }}>{title}</div>
              <div style={{ fontSize: 11, color: T.textSec, lineHeight: 1.6 }}>{desc}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'Country Allocation' && (
        <div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 12 }}>COUNTRY ALLOCATION TABLE</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr>{['Country', 'Lead MDB', 'Amount ($Bn)', 'Sector', 'Climate Share', 'Tenor', 'Rating'].map(h => <th key={h} style={{ textAlign: 'left', color: T.textSec, fontFamily: T.mono, padding: '6px 10px', borderBottom: `1px solid ${T.border}` }}>{h}</th>)}</tr></thead>
              <tbody>{COUNTRY_ALLOCATIONS.map((c, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? T.surfaceH : 'transparent' }}>
                  <td style={{ padding: '7px 10px', color: T.text, fontWeight: 600 }}>{c.country}</td>
                  <td style={{ padding: '7px 10px', color: T.textSec }}>{c.mdb}</td>
                  <td style={{ padding: '7px 10px', color: T.gold, fontFamily: T.mono }}>${c.amount}Bn</td>
                  <td style={{ padding: '7px 10px', color: T.textSec }}>{c.sector}</td>
                  <td style={{ padding: '7px 10px', color: c.climateShare >= 70 ? T.green : T.amber }}>{c.climateShare}%</td>
                  <td style={{ padding: '7px 10px', color: T.textSec }}>{c.tenor}yr</td>
                  <td style={{ padding: '7px 10px', color: T.teal, fontFamily: T.mono }}>{c.rating}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 12 }}>ALLOCATION & CLIMATE SHARE BY COUNTRY</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={allocationChart}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="country" tick={{ fill: T.textSec, fontSize: 10 }} />
                <YAxis tick={{ fill: T.textSec, fontSize: 11 }} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                <Legend />
                <Bar dataKey="amount" fill={T.teal} name="Amount ($Bn)" />
                <Bar dataKey="climate" fill={T.sage} name="Climate Share (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 'ESG Conditionality' && (
        <div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
            <Kpi label="ENVIRONMENT SAFEGUARDS" value="IFC PS 1-8" sub="Performance Standards" color={T.green} />
            <Kpi label="WORLD BANK ESF" value="ESS 1-10" sub="Environmental & Social" />
            <Kpi label="CLIMATE CO-BENEFIT" value="Required" sub="Paris alignment test" color={T.teal} />
            <Kpi label="GENDER ACTION PLAN" value="75% of loans" sub="WB requirement" color={T.amber} />
          </div>
          {[['IFC Performance Standards (PS 1–8)', 'PS1: Environmental & Social Assessment · PS2: Labor · PS3: Resource Efficiency · PS4: Community Health · PS5: Land Acquisition · PS6: Biodiversity · PS7: Indigenous Peoples · PS8: Cultural Heritage. All IFC investments + sub-sovereign guarantee transactions must comply.'],
            ['World Bank Environmental & Social Framework (ESF)', 'ESS1–10 covers E&S assessment, labor, resource efficiency, community health, land, biodiversity, indigenous peoples, cultural heritage, financial intermediaries, and stakeholder engagement. Applies to all IBRD/IDA projects.'],
            ['Paris Alignment Framework (MDB-wide)', 'All MDB operations assessed for: (a) mitigation (avoiding new emissions), (b) adaptation (climate resilience), (c) alignment with Paris Agreement goals. Excludes coal, upstream oil & gas expansion.'],
            ['Taxonomy Alignment (ADB, EBRD, EIB)', 'Regional MDBs applying EU Taxonomy or equivalent national green taxonomies. EBRD aligns with EU Taxonomy; ADB developing Asia Climate Finance Taxonomy.']].map(([title, desc], i) => (
            <div key={i} style={{ marginBottom: 12, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 4 }}>{title}</div>
              <div style={{ fontSize: 11, color: T.textSec, lineHeight: 1.6 }}>{desc}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'Currency Risk' && (
        <div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
            <Kpi label="LOCAL CCY PRODUCTS" value="42%" sub="of MDB sub-sovereign" color={T.green} />
            <Kpi label="FX SWAP COST (LATAM)" value="~200bps" sub="Annual hedging cost" />
            <Kpi label="TCX FUND" value="$2.4Bn" sub="Currency risk mitigation" color={T.teal} />
            <Kpi label="FX MISMATCHES" value="Major risk" sub="Sub-sovereign exposure" color={T.red} />
          </div>
          {[['Currency Risk in Sub-Sovereign MDB Lending', 'Sub-sovereign entities (municipalities, utilities) typically generate local currency revenue but MDB loans may be denominated in USD/EUR. Currency depreciation increases debt service burden and can trigger fiscal stress.'],
            ['Hedging Solutions Available', 'TCX Fund (Currency Exchange Fund): hedges local currencies in frontier/EM markets. MDB cross-currency swaps: available for high-income EM borrowers. Local currency bond issuance with MDB anchor: avoids FX exposure entirely.'],
            ['IFC Local Currency Program', 'IFC lends in 75+ local currencies using derivative markets. Sub-sovereign borrowers pay local rate (typically higher) but eliminate FX risk. Available in countries with functioning swap markets.'],
            ['Natural Hedging Strategies', 'For water/transit utilities: tariff indexation to inflation/FX provides partial natural hedge. For export-linked projects: USD revenue = natural hedge. For local services: aim for local currency loans despite higher rate.']].map(([title, desc], i) => (
            <div key={i} style={{ marginBottom: 12, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 4 }}>{title}</div>
              <div style={{ fontSize: 11, color: T.textSec, lineHeight: 1.6 }}>{desc}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'Portfolio Analytics' && (
        <div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
            <Kpi label="PORTFOLIO MDBs" value={MDBS.length} sub="Tracked institutions" color={T.teal} />
            <Kpi label="AVG GREEN SHARE" value={`${(MDBS.reduce((s, m) => s + m.greenShare, 0) / MDBS.length).toFixed(0)}%`} sub="of lending" color={T.green} />
            <Kpi label="AVG SUB-SOV SHARE" value={`${(MDBS.reduce((s, m) => s + m.subSovShare, 0) / MDBS.length).toFixed(0)}%`} sub="without sov. guarantee" />
            <Kpi label="AVG CLIMATE TARGET" value={`${(MDBS.reduce((s, m) => s + m.climateTarget, 0) / MDBS.length).toFixed(0)}%`} sub="of annual lending" color={T.amber} />
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 12 }}>MDB PORTFOLIO SCORECARD</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={MDBS.map(m => ({ name: m.name.split(' ')[0], climate: m.climateTarget, green: m.greenShare, subSov: m.subSovShare }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="name" tick={{ fill: T.textSec, fontSize: 9 }} />
                <YAxis tick={{ fill: T.textSec, fontSize: 11 }} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                <Legend />
                <Bar dataKey="climate" fill={T.green} name="Climate Target (%)" />
                <Bar dataKey="green" fill={T.sage} name="Green Share (%)" />
                <Bar dataKey="subSov" fill={T.teal} name="Sub-Sov Share (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
