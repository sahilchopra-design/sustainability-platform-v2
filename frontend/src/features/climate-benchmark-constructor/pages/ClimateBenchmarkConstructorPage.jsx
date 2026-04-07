import React, { useState } from 'react';
import {
  LineChart, BarChart, AreaChart, PieChart, Line, Bar, Area, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts';

const T = {
  bg: '#f6f4f0', surface: '#ffffff', border: '#e5e0d8', navy: '#1b3a5c',
  gold: '#c5a96a', textSec: '#5c6b7e', textMut: '#9aa3ae',
  red: '#dc2626', green: '#16a34a', amber: '#d97706', blue: '#2563eb',
  teal: '#0891b2', purple: '#7c3aed',
  card: '#ffffff', sub: '#5c6b7e', indigo: '#4f46e5', font: "'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono: "'JetBrains Mono','SF Mono','Fira Code',monospace",
};

function sr(seed) { let s = seed; return () => { s = (s * 16807 + 0) % 2147483647; return s / 2147483647; }; }

const TABS = ['Benchmark Overview', 'PAB / CTB Builder', 'Tracking Error', 'Carbon Pathway', 'Constituent Analysis'];
const SECTORS = ['Technology', 'Healthcare', 'Financials', 'Consumer Disc.', 'Industrials', 'Energy', 'Materials', 'Utilities', 'Comm. Services', 'Real Estate', 'Consumer Staples'];
const BENCH_COLORS = [T.navy, T.gold, T.teal, T.purple];

/* ── seed data generators ── */
const r1 = sr(42);
const benchmarks = [
  { name: 'MSCI World PAB', type: 'PAB', parent: 'MSCI World', carbonInt: 68, returnYtd: 8.4, te: 0.92, constituents: 1247, reduction: 58, status: 'Active' },
  { name: 'S&P 500 CTB', type: 'CTB', parent: 'S&P 500', carbonInt: 112, returnYtd: 11.2, te: 0.48, constituents: 478, reduction: 34, status: 'Active' },
  { name: 'Custom ESG-Tilted', type: 'CTB', parent: 'STOXX Europe 600', carbonInt: 85, returnYtd: 6.1, te: 1.35, constituents: 523, reduction: 47, status: 'Active' },
  { name: 'Fossil-Free Core', type: 'PAB', parent: 'FTSE All-World', carbonInt: 42, returnYtd: 7.8, te: 1.72, constituents: 2104, reduction: 71, status: 'Active' },
];

const r2 = sr(101);
const teTimeSeries = Array.from({ length: 36 }, (_, i) => {
  const m = i + 1;
  return {
    month: `M${m}`,
    'MSCI World PAB': +(0.7 + r2() * 0.6 + Math.sin(i / 6) * 0.15).toFixed(2),
    'S&P 500 CTB': +(0.3 + r2() * 0.35 + Math.sin(i / 5) * 0.08).toFixed(2),
    'Custom ESG-Tilted': +(1.0 + r2() * 0.7 + Math.sin(i / 4) * 0.2).toFixed(2),
    'Fossil-Free Core': +(1.3 + r2() * 0.8 + Math.sin(i / 7) * 0.25).toFixed(2),
  };
});

const r3 = sr(200);
const carbonPathway = Array.from({ length: 11 }, (_, i) => {
  const yr = 2020 + i;
  const target = 162 * Math.pow(0.93, i);
  return {
    year: yr,
    target: +target.toFixed(1),
    'MSCI World PAB': +(target * (0.95 + r3() * 0.12)).toFixed(1),
    'S&P 500 CTB': +(target * (1.15 + r3() * 0.15)).toFixed(1),
    'Custom ESG-Tilted': +(target * (1.02 + r3() * 0.1)).toFixed(1),
    'Fossil-Free Core': +(target * (0.82 + r3() * 0.1)).toFixed(1),
  };
});

const r4 = sr(303);
const sectorWeights = SECTORS.map(s => {
  const parent = +(3 + r4() * 18).toFixed(1);
  const climate = +(parent * (0.6 + r4() * 0.8)).toFixed(1);
  return { sector: s, parent, climate, delta: +(climate - parent).toFixed(1) };
});

const r5 = sr(404);
const factors = ['Value', 'Growth', 'Size', 'Momentum', 'Quality', 'Low-Vol'].map(f => ({
  factor: f, parent: +(r5() * 0.6 - 0.3).toFixed(2), pab: +(r5() * 0.8 - 0.2).toFixed(2), ctb: +(r5() * 0.5 - 0.15).toFixed(2),
}));

const r6 = sr(505);
const countries = ['United States', 'Japan', 'United Kingdom', 'France', 'Germany', 'Switzerland', 'Canada', 'Australia', 'Netherlands', 'Sweden'];
const constituents = Array.from({ length: 50 }, (_, i) => {
  const names = ['NovaTech Corp', 'GreenField Energy', 'Pacific Renewables', 'Nordic Clean Power', 'Alpine Materials', 'Cascade Biotech', 'SolarEdge Holdings', 'BlueWave Infra', 'TerraCarbon Inc', 'Meridian Finance',
    'Zenith Healthcare', 'EverGreen Capital', 'Apex Wind Systems', 'Quantum Storage', 'Cirrus Cloud Tech', 'AquaPure Systems', 'Helix Genomics', 'Phoenix Batteries', 'Stratos Aerospace', 'Lumen Networks',
    'Catalyst Pharma', 'Boreal Mining', 'Nexus Semiconductors', 'Harbor Logistics', 'Pinnacle Insurance', 'Aurora Chemicals', 'Vanguard Robotics', 'Summit Real Estate', 'Horizon Telecom', 'Atlas Utilities',
    'Prism Analytics', 'EcoMotion Auto', 'Tidal Power Co', 'Vertex Diagnostics', 'Nova Materials', 'SilverLine Rail', 'ClearSky Aviation', 'BrightPath Solar', 'IronForge Steel', 'SafeHarbor Bank',
    'Redwood Timber', 'DigiPay Finance', 'BioFuel Dynamics', 'CloudNine Software', 'GreenLink Infra', 'PureAir Tech', 'Cobalt Resources', 'WaveRider Marine', 'TrueNorth ESG', 'Solaris Power'];
  const w = +(3.5 - i * 0.055 + r6() * 0.3).toFixed(2);
  const parentW = +(w + (r6() - 0.5) * 0.8).toFixed(2);
  const tiltReasons = ['Low carbon intensity', 'Green revenue >50%', 'SBTi validated', 'Transition leader', 'Renewable capacity', 'Scope 3 reduction', 'Circular economy'];
  return {
    rank: i + 1, name: names[i], sector: SECTORS[Math.floor(r6() * SECTORS.length)],
    country: countries[Math.floor(r6() * countries.length)],
    weight: Math.max(0.05, w), parentWeight: Math.max(0.05, parentW),
    delta: +(w - parentW).toFixed(2), carbonInt: Math.round(20 + r6() * 280),
    tiltReason: tiltReasons[Math.floor(r6() * tiltReasons.length)],
  };
});

const excluded = [
  { name: 'PetroGlobal Corp', sector: 'Energy', reason: 'Fossil fuel revenue >10%' },
  { name: 'CoalPower Ltd', sector: 'Utilities', reason: 'Coal-fired generation >5%' },
  { name: 'TarSands Inc', sector: 'Energy', reason: 'Unconventional O&G extraction' },
  { name: 'DeepDrill Offshore', sector: 'Energy', reason: 'Arctic drilling operations' },
  { name: 'BrownField Mining', sector: 'Materials', reason: 'Thermal coal mining >1% revenue' },
  { name: 'HeavyCrude Refining', sector: 'Energy', reason: 'No credible transition plan' },
  { name: 'CementMax Global', sector: 'Materials', reason: 'Carbon intensity >95th percentile' },
  { name: 'LegacyGas Holdings', sector: 'Utilities', reason: 'Gas expansion capex >30%' },
];

const geoData = countries.map(c => {
  const pw = +(2 + r6() * 20).toFixed(1);
  return { country: c, parent: pw, climate: +(pw * (0.7 + r6() * 0.6)).toFixed(1) };
});

/* ── style helpers ── */
const card = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 };
const kpiCard = { ...card, textAlign: 'center', flex: 1, minWidth: 140 };
const label = { fontSize: 11, color: T.textMut, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 };
const bigNum = { fontSize: 26, fontWeight: 700, color: T.navy, fontFamily: T.font, lineHeight: 1.2 };
const subText = { fontSize: 12, color: T.textSec, fontFamily: T.font };
const tableHead = { fontSize: 11, fontFamily: T.mono, color: T.textMut, textTransform: 'uppercase', letterSpacing: 0.6, padding: '8px 10px', borderBottom: `2px solid ${T.navy}`, textAlign: 'left', whiteSpace: 'nowrap' };
const tableCell = { fontSize: 13, fontFamily: T.font, color: T.navy, padding: '7px 10px', borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' };
const sectionTitle = { fontSize: 14, fontWeight: 700, color: T.navy, fontFamily: T.font, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 };
const badge = (bg, fg) => ({ display: 'inline-block', fontSize: 10, fontFamily: T.mono, fontWeight: 600, padding: '2px 7px', borderRadius: 3, background: bg, color: fg });

/* ── Tab panels ── */
function BenchmarkOverview() {
  const kpis = [
    { label: 'Active Benchmarks', value: '4', sub: '2 PAB / 2 CTB' },
    { label: 'Avg Carbon Reduction', value: '52%', sub: 'vs parent indices' },
    { label: 'TE Range', value: '0.3-1.8%', sub: 'annualized' },
    { label: 'Total Constituents', value: '500+', sub: 'across benchmarks' },
    { label: 'Rebalance Freq.', value: 'Quarterly', sub: 'next: 2026-06-30' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {kpis.map((k, i) => (
          <div key={i} style={kpiCard}>
            <div style={label}>{k.label}</div>
            <div style={bigNum}>{k.value}</div>
            <div style={subText}>{k.sub}</div>
          </div>
        ))}
      </div>
      <div style={card}>
        <div style={sectionTitle}>Climate Benchmark Registry</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              {['Benchmark', 'Type', 'Parent Index', 'Carbon Int. (tCO2e/$M)', 'YTD Return', 'TE (ann.)', 'Constituents', 'Reduction', 'Status'].map(h => (
                <th key={h} style={tableHead}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {benchmarks.map((b, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.bg }}>
                  <td style={{ ...tableCell, fontWeight: 600 }}>{b.name}</td>
                  <td style={tableCell}><span style={badge(b.type === 'PAB' ? '#dbeafe' : '#fef3c7', b.type === 'PAB' ? T.blue : T.amber)}>{b.type}</span></td>
                  <td style={tableCell}>{b.parent}</td>
                  <td style={{ ...tableCell, fontFamily: T.mono }}>{b.carbonInt}</td>
                  <td style={{ ...tableCell, color: b.returnYtd >= 0 ? T.green : T.red, fontFamily: T.mono }}>{b.returnYtd > 0 ? '+' : ''}{b.returnYtd}%</td>
                  <td style={{ ...tableCell, fontFamily: T.mono }}>{b.te}%</td>
                  <td style={{ ...tableCell, fontFamily: T.mono }}>{b.constituents.toLocaleString()}</td>
                  <td style={{ ...tableCell, fontFamily: T.mono, color: T.green }}>{b.reduction}%</td>
                  <td style={tableCell}><span style={badge('#dcfce7', T.green)}>{b.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ ...card, flex: 1 }}>
          <div style={sectionTitle}>Carbon Intensity Comparison</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={benchmarks} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fontFamily: T.mono, fill: T.textSec }} interval={0} angle={-15} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 10, fontFamily: T.mono, fill: T.textMut }} />
              <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12, border: `1px solid ${T.border}` }} />
              <Bar dataKey="carbonInt" name="Carbon Intensity" radius={[3, 3, 0, 0]}>
                {benchmarks.map((_, i) => <Cell key={i} fill={BENCH_COLORS[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ ...card, flex: 1 }}>
          <div style={sectionTitle}>Reduction vs Parent (%)</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={benchmarks} barSize={28} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{ fontSize: 10, fontFamily: T.mono, fill: T.textMut }} domain={[0, 80]} />
              <YAxis dataKey="name" type="category" width={130} tick={{ fontSize: 10, fontFamily: T.mono, fill: T.textSec }} />
              <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12, border: `1px solid ${T.border}` }} />
              <Bar dataKey="reduction" name="Reduction %" radius={[0, 3, 3, 0]}>
                {benchmarks.map((_, i) => <Cell key={i} fill={BENCH_COLORS[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function PabCtbBuilder() {
  const [mode, setMode] = useState('PAB');
  const [parentIdx, setParentIdx] = useState('MSCI World');
  const [sectorNeutral, setSectorNeutral] = useState(true);
  const parents = ['MSCI World', 'S&P 500', 'STOXX Europe 600', 'FTSE All-World', 'MSCI EM'];
  const pabRules = [
    { rule: 'Minimum carbon reduction vs parent', value: '50%' },
    { rule: 'Year-on-year decarbonization', value: '7% p.a.' },
    { rule: 'Fossil fuel exclusion (coal)', value: '>1% revenue' },
    { rule: 'Fossil fuel exclusion (O&G)', value: '>10% revenue' },
    { rule: 'Controversial weapons', value: 'Full exclusion' },
    { rule: 'UN Global Compact violators', value: 'Full exclusion' },
  ];
  const ctbRules = [
    { rule: 'Minimum carbon reduction vs parent', value: '30%' },
    { rule: 'Year-on-year decarbonization', value: '7% p.a.' },
    { rule: 'Fossil fuel exclusion', value: 'No hard exclusion' },
    { rule: 'Sector constraints', value: 'Soft tilt only' },
    { rule: 'Controversial weapons', value: 'Full exclusion' },
  ];
  const rules = mode === 'PAB' ? pabRules : ctbRules;
  const tiltFactors = [
    { factor: 'Carbon Intensity Tilt', weight: 35, desc: 'Overweight low-carbon, underweight high-carbon' },
    { factor: 'Green Revenue Tilt', weight: 25, desc: 'Favor companies with >20% green revenue' },
    { factor: 'SBTi Target Tilt', weight: 20, desc: 'Overweight science-based target holders' },
    { factor: 'Transition Readiness', weight: 15, desc: 'Capex alignment to low-carbon transition' },
    { factor: 'Physical Risk Discount', weight: 5, desc: 'Underweight high physical risk exposure' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ ...card, flex: 1 }}>
          <div style={sectionTitle}>EU BMR Benchmark Mode</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            {['PAB', 'CTB'].map(m => (
              <button key={m} onClick={() => setMode(m)} style={{ padding: '6px 20px', borderRadius: 4, fontFamily: T.mono, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: `1px solid ${mode === m ? T.navy : T.border}`, background: mode === m ? T.navy : T.surface, color: mode === m ? '#fff' : T.textSec, transition: 'all .15s' }}>{m === 'PAB' ? 'Paris-Aligned (PAB)' : 'Climate Transition (CTB)'}</button>
            ))}
          </div>
          <div style={{ fontSize: 12, color: T.textSec, fontFamily: T.font, marginBottom: 12 }}>
            {mode === 'PAB' ? 'EU BMR Art. 19a(1) Paris-Aligned Benchmark: stringent decarbonization with hard fossil fuel exclusions aligned to 1.5C pathway.' : 'EU BMR Art. 19a(1) Climate Transition Benchmark: moderate decarbonization with sector exposure maintained through tilt-based reweighting.'}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={tableHead}>Rule</th><th style={tableHead}>Threshold</th></tr></thead>
            <tbody>{rules.map((r, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.bg }}>
                <td style={tableCell}>{r.rule}</td>
                <td style={{ ...tableCell, fontFamily: T.mono, fontWeight: 600 }}>{r.value}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div style={{ ...card, flex: 1 }}>
          <div style={sectionTitle}>Builder Configuration</div>
          <div style={{ marginBottom: 12 }}>
            <div style={label}>Parent Index</div>
            <select value={parentIdx} onChange={e => setParentIdx(e.target.value)} style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 13, color: T.navy, background: T.surface }}>
              {parents.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={label}>Sector Neutrality</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div onClick={() => setSectorNeutral(!sectorNeutral)} style={{ width: 36, height: 20, borderRadius: 10, background: sectorNeutral ? T.green : T.border, cursor: 'pointer', position: 'relative', transition: 'all .2s' }}>
                <div style={{ width: 16, height: 16, borderRadius: 8, background: '#fff', position: 'absolute', top: 2, left: sectorNeutral ? 18 : 2, transition: 'all .2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
              </div>
              <span style={{ fontSize: 12, fontFamily: T.font, color: T.textSec }}>{sectorNeutral ? 'Enabled' : 'Disabled'} - constrains sector deviations to +/-5%</span>
            </div>
          </div>
          <div style={sectionTitle}>Tilt Factors</div>
          {tiltFactors.map((tf, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ flex: 1, fontSize: 12, fontFamily: T.font, color: T.navy }}>{tf.factor}</div>
              <div style={{ width: 120, height: 6, borderRadius: 3, background: T.border, position: 'relative' }}>
                <div style={{ width: `${tf.weight}%`, height: '100%', borderRadius: 3, background: T.gold }} />
              </div>
              <div style={{ width: 32, fontSize: 11, fontFamily: T.mono, color: T.textSec, textAlign: 'right' }}>{tf.weight}%</div>
            </div>
          ))}
        </div>
      </div>
      <div style={card}>
        <div style={sectionTitle}>Sector Weight Preview: {parentIdx} {mode}</div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={sectorWeights} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="sector" tick={{ fontSize: 9, fontFamily: T.mono, fill: T.textSec }} interval={0} angle={-20} textAnchor="end" height={55} />
            <YAxis tick={{ fontSize: 10, fontFamily: T.mono, fill: T.textMut }} unit="%" />
            <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12, border: `1px solid ${T.border}` }} />
            <Legend wrapperStyle={{ fontSize: 11, fontFamily: T.font }} />
            <Bar dataKey="parent" name="Parent" fill={T.textMut} barSize={16} radius={[2, 2, 0, 0]} />
            <Bar dataKey="climate" name={`${mode} Benchmark`} fill={mode === 'PAB' ? T.blue : T.amber} barSize={16} radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function TrackingError() {
  const teDecomp = [
    { component: 'Sector Allocation TE', pab: 0.31, ctb: 0.14, esg: 0.52, ff: 0.68 },
    { component: 'Stock Selection TE', pab: 0.28, ctb: 0.18, esg: 0.41, ff: 0.55 },
    { component: 'Climate Tilt TE', pab: 0.33, ctb: 0.16, esg: 0.42, ff: 0.49 },
    { component: 'Total TE', pab: 0.92, ctb: 0.48, esg: 1.35, ff: 1.72 },
  ];
  const teBudget = benchmarks.map(b => ({ name: b.name, budget: 2.0, actual: b.te, utilization: +((b.te / 2.0) * 100).toFixed(0) }));
  const activeShare = [
    { name: 'MSCI World PAB', share: 38.2 },
    { name: 'S&P 500 CTB', share: 22.7 },
    { name: 'Custom ESG-Tilted', share: 45.1 },
    { name: 'Fossil-Free Core', share: 52.8 },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={card}>
        <div style={sectionTitle}>Tracking Error vs Parent (36-Month Rolling)</div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={teTimeSeries}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="month" tick={{ fontSize: 9, fontFamily: T.mono, fill: T.textMut }} interval={5} />
            <YAxis tick={{ fontSize: 10, fontFamily: T.mono, fill: T.textMut }} unit="%" domain={[0, 'auto']} />
            <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12, border: `1px solid ${T.border}` }} />
            <Legend wrapperStyle={{ fontSize: 11, fontFamily: T.font }} />
            {benchmarks.map((b, i) => (
              <Line key={i} type="monotone" dataKey={b.name} stroke={BENCH_COLORS[i]} strokeWidth={2} dot={false} />
            ))}
            <ReferenceLine y={2.0} stroke={T.red} strokeDasharray="6 3" label={{ value: 'TE Budget 2.0%', fill: T.red, fontSize: 10, fontFamily: T.mono }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ ...card, flex: 1.2 }}>
          <div style={sectionTitle}>TE Decomposition</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <th style={tableHead}>Component</th>
              <th style={tableHead}>MSCI PAB</th>
              <th style={tableHead}>S&P CTB</th>
              <th style={tableHead}>ESG-Tilted</th>
              <th style={tableHead}>Fossil-Free</th>
            </tr></thead>
            <tbody>{teDecomp.map((r, i) => (
              <tr key={i} style={{ background: i === teDecomp.length - 1 ? '#f0f4ff' : i % 2 === 0 ? T.surface : T.bg }}>
                <td style={{ ...tableCell, fontWeight: i === teDecomp.length - 1 ? 700 : 400 }}>{r.component}</td>
                <td style={{ ...tableCell, fontFamily: T.mono }}>{r.pab}%</td>
                <td style={{ ...tableCell, fontFamily: T.mono }}>{r.ctb}%</td>
                <td style={{ ...tableCell, fontFamily: T.mono }}>{r.esg}%</td>
                <td style={{ ...tableCell, fontFamily: T.mono }}>{r.ff}%</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div style={{ ...card, flex: 0.8 }}>
          <div style={sectionTitle}>TE Budget Utilization</div>
          {teBudget.map((b, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 11, fontFamily: T.font, color: T.navy }}>{b.name}</span>
                <span style={{ fontSize: 11, fontFamily: T.mono, color: b.utilization > 80 ? T.red : b.utilization > 50 ? T.amber : T.green }}>{b.utilization}%</span>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: T.border }}>
                <div style={{ height: '100%', borderRadius: 4, width: `${Math.min(b.utilization, 100)}%`, background: b.utilization > 80 ? T.red : b.utilization > 50 ? T.amber : T.green, transition: 'width .3s' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ ...card, flex: 1 }}>
          <div style={sectionTitle}>Active Share</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={activeShare} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fontFamily: T.mono, fill: T.textSec }} interval={0} angle={-12} textAnchor="end" height={45} />
              <YAxis tick={{ fontSize: 10, fontFamily: T.mono, fill: T.textMut }} unit="%" domain={[0, 70]} />
              <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12, border: `1px solid ${T.border}` }} />
              <Bar dataKey="share" name="Active Share" radius={[3, 3, 0, 0]}>
                {activeShare.map((_, i) => <Cell key={i} fill={BENCH_COLORS[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ ...card, flex: 1 }}>
          <div style={sectionTitle}>Factor Exposure Comparison</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={factors} barGap={1}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="factor" tick={{ fontSize: 9, fontFamily: T.mono, fill: T.textSec }} interval={0} />
              <YAxis tick={{ fontSize: 10, fontFamily: T.mono, fill: T.textMut }} domain={[-0.5, 0.7]} />
              <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12, border: `1px solid ${T.border}` }} />
              <Legend wrapperStyle={{ fontSize: 10, fontFamily: T.font }} />
              <Bar dataKey="parent" name="Parent" fill={T.textMut} barSize={10} radius={[2, 2, 0, 0]} />
              <Bar dataKey="pab" name="PAB" fill={T.blue} barSize={10} radius={[2, 2, 0, 0]} />
              <Bar dataKey="ctb" name="CTB" fill={T.amber} barSize={10} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function CarbonPathway() {
  const deviations = benchmarks.map(b => {
    const last = carbonPathway[carbonPathway.length - 1];
    const actual = last[b.name];
    const target = last.target;
    return { name: b.name, actual, target, deviation: +((actual - target) / target * 100).toFixed(1) };
  });
  const budgetRemaining = [
    { name: 'MSCI World PAB', budgetTotal: 820, used: 512, remaining: 308 },
    { name: 'S&P 500 CTB', budgetTotal: 1050, used: 745, remaining: 305 },
    { name: 'Custom ESG-Tilted', budgetTotal: 900, used: 588, remaining: 312 },
    { name: 'Fossil-Free Core', budgetTotal: 680, used: 352, remaining: 328 },
  ];
  const attribution = [
    { name: 'MSCI World PAB', constituentImprovement: 62, rebalancing: 38 },
    { name: 'S&P 500 CTB', constituentImprovement: 45, rebalancing: 55 },
    { name: 'Custom ESG-Tilted', constituentImprovement: 55, rebalancing: 45 },
    { name: 'Fossil-Free Core', constituentImprovement: 70, rebalancing: 30 },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={card}>
        <div style={sectionTitle}>Carbon Intensity Trajectory (tCO2e / $M Revenue)</div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={carbonPathway}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="year" tick={{ fontSize: 10, fontFamily: T.mono, fill: T.textMut }} />
            <YAxis tick={{ fontSize: 10, fontFamily: T.mono, fill: T.textMut }} domain={[0, 'auto']} />
            <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12, border: `1px solid ${T.border}` }} />
            <Legend wrapperStyle={{ fontSize: 11, fontFamily: T.font }} />
            <Area type="monotone" dataKey="Fossil-Free Core" fill={T.purple} fillOpacity={0.08} stroke={T.purple} strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="MSCI World PAB" fill={T.navy} fillOpacity={0.08} stroke={T.navy} strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="Custom ESG-Tilted" fill={T.teal} fillOpacity={0.06} stroke={T.teal} strokeWidth={1.5} dot={false} />
            <Area type="monotone" dataKey="S&P 500 CTB" fill={T.gold} fillOpacity={0.06} stroke={T.gold} strokeWidth={1.5} dot={false} />
            <Line type="monotone" dataKey="target" stroke={T.red} strokeWidth={2} strokeDasharray="6 4" dot={false} name="7% YoY Target" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ ...card, flex: 1 }}>
          <div style={sectionTitle}>Actual vs Target Deviation (2030)</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              {['Benchmark', 'Actual', 'Target', 'Deviation'].map(h => <th key={h} style={tableHead}>{h}</th>)}
            </tr></thead>
            <tbody>{deviations.map((d, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.bg }}>
                <td style={{ ...tableCell, fontWeight: 600 }}>{d.name}</td>
                <td style={{ ...tableCell, fontFamily: T.mono }}>{d.actual}</td>
                <td style={{ ...tableCell, fontFamily: T.mono }}>{d.target}</td>
                <td style={{ ...tableCell, fontFamily: T.mono, color: d.deviation <= 0 ? T.green : d.deviation < 10 ? T.amber : T.red }}>
                  {d.deviation > 0 ? '+' : ''}{d.deviation}%
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div style={{ ...card, flex: 1 }}>
          <div style={sectionTitle}>Carbon Budget Remaining (tCO2e cumul.)</div>
          {budgetRemaining.map((b, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 11, fontFamily: T.font, color: T.navy }}>{b.name}</span>
                <span style={{ fontSize: 11, fontFamily: T.mono, color: T.textSec }}>{b.remaining} / {b.budgetTotal}</span>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: T.border }}>
                <div style={{ height: '100%', borderRadius: 4, width: `${(b.remaining / b.budgetTotal * 100).toFixed(0)}%`, background: b.remaining / b.budgetTotal > 0.4 ? T.green : b.remaining / b.budgetTotal > 0.2 ? T.amber : T.red }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={card}>
        <div style={sectionTitle}>Decarbonization Attribution</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={attribution} layout="vertical" barGap={0}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis type="number" tick={{ fontSize: 10, fontFamily: T.mono, fill: T.textMut }} unit="%" domain={[0, 100]} />
            <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 10, fontFamily: T.mono, fill: T.textSec }} />
            <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12, border: `1px solid ${T.border}` }} />
            <Legend wrapperStyle={{ fontSize: 11, fontFamily: T.font }} />
            <Bar dataKey="constituentImprovement" name="Constituent Improvement" stackId="a" fill={T.teal} barSize={18} />
            <Bar dataKey="rebalancing" name="Rebalancing Effect" stackId="a" fill={T.gold} barSize={18} radius={[0, 3, 3, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function ConstituentAnalysis() {
  const [page, setPage] = useState(0);
  const perPage = 15;
  const pageData = constituents.slice(page * perPage, (page + 1) * perPage);
  const totalPages = Math.ceil(constituents.length / perPage);
  const pieColors = [T.navy, T.gold, T.teal, T.purple, T.blue, T.amber, T.green, T.red, '#6366f1', '#ec4899', '#78716c'];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={sectionTitle}>Top 50 Constituents (MSCI World PAB)</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)} style={{ padding: '3px 10px', borderRadius: 3, border: `1px solid ${T.border}`, background: T.surface, fontFamily: T.mono, fontSize: 11, cursor: page === 0 ? 'default' : 'pointer', opacity: page === 0 ? 0.4 : 1 }}>Prev</button>
            <span style={{ fontSize: 11, fontFamily: T.mono, color: T.textSec }}>{page + 1}/{totalPages}</span>
            <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} style={{ padding: '3px 10px', borderRadius: 3, border: `1px solid ${T.border}`, background: T.surface, fontFamily: T.mono, fontSize: 11, cursor: page >= totalPages - 1 ? 'default' : 'pointer', opacity: page >= totalPages - 1 ? 0.4 : 1 }}>Next</button>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              {['#', 'Name', 'Sector', 'Country', 'Weight %', 'Parent Wt %', 'Delta', 'Carbon Int.', 'Tilt Reason'].map(h => (
                <th key={h} style={tableHead}>{h}</th>
              ))}
            </tr></thead>
            <tbody>{pageData.map((c, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.bg }}>
                <td style={{ ...tableCell, fontFamily: T.mono, color: T.textMut }}>{c.rank}</td>
                <td style={{ ...tableCell, fontWeight: 600 }}>{c.name}</td>
                <td style={tableCell}>{c.sector}</td>
                <td style={tableCell}>{c.country}</td>
                <td style={{ ...tableCell, fontFamily: T.mono }}>{c.weight.toFixed(2)}</td>
                <td style={{ ...tableCell, fontFamily: T.mono }}>{c.parentWeight.toFixed(2)}</td>
                <td style={{ ...tableCell, fontFamily: T.mono, color: c.delta >= 0 ? T.green : T.red }}>{c.delta > 0 ? '+' : ''}{c.delta}</td>
                <td style={{ ...tableCell, fontFamily: T.mono }}>{c.carbonInt}</td>
                <td style={tableCell}><span style={badge('#f0fdf4', T.green)}>{c.tiltReason}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ ...card, flex: 1 }}>
          <div style={sectionTitle}>Sector Breakdown (Parent vs Climate)</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={sectorWeights} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="sector" tick={{ fontSize: 8, fontFamily: T.mono, fill: T.textSec }} interval={0} angle={-25} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 10, fontFamily: T.mono, fill: T.textMut }} unit="%" />
              <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12, border: `1px solid ${T.border}` }} />
              <Legend wrapperStyle={{ fontSize: 10, fontFamily: T.font }} />
              <Bar dataKey="parent" name="Parent" fill={T.textMut} barSize={14} radius={[2, 2, 0, 0]} />
              <Bar dataKey="climate" name="Climate Benchmark" fill={T.navy} barSize={14} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ ...card, flex: 0.7 }}>
          <div style={sectionTitle}>Geographic Distribution</div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={geoData} dataKey="climate" nameKey="country" cx="50%" cy="50%" innerRadius={45} outerRadius={85} paddingAngle={2} label={({ name, value }) => `${name.slice(0, 3)} ${value}%`} labelLine={false} style={{ fontSize: 8, fontFamily: T.mono }}>
                {geoData.map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12, border: `1px solid ${T.border}` }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ ...card, flex: 1 }}>
          <div style={sectionTitle}>Excluded Companies</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              {['Company', 'Sector', 'Exclusion Reason'].map(h => <th key={h} style={tableHead}>{h}</th>)}
            </tr></thead>
            <tbody>{excluded.map((e, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.bg }}>
                <td style={{ ...tableCell, fontWeight: 600 }}>{e.name}</td>
                <td style={tableCell}>{e.sector}</td>
                <td style={tableCell}><span style={badge('#fef2f2', T.red)}>{e.reason}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div style={{ ...card, flex: 1 }}>
          <div style={sectionTitle}>New Additions from Climate Tilt</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              {['Company', 'Sector', 'Climate Rationale'].map(h => <th key={h} style={tableHead}>{h}</th>)}
            </tr></thead>
            <tbody>
              {constituents.filter(c => c.delta > 0.3).slice(0, 8).map((c, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.bg }}>
                  <td style={{ ...tableCell, fontWeight: 600 }}>{c.name}</td>
                  <td style={tableCell}>{c.sector}</td>
                  <td style={tableCell}><span style={badge('#f0fdf4', T.green)}>{c.tiltReason}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function ClimateBenchmarkConstructorPage() {
  const [tab, setTab] = useState(0);
  const panels = [BenchmarkOverview, PabCtbBuilder, TrackingError, CarbonPathway, ConstituentAnalysis];
  const Panel = panels[tab];
  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: '0 0 32px 0' }}>
      {/* header */}
      <div style={{ background: T.navy, padding: '18px 28px 0 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: 0.3 }}>Climate Benchmark Constructor</div>
            <div style={{ fontSize: 11, fontFamily: T.mono, color: T.gold, letterSpacing: 0.6, marginTop: 2 }}>EP-CZ3 // EU BMR PAB &amp; CTB Construction &amp; Monitoring</div>
          </div>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <span style={{ fontSize: 10, fontFamily: T.mono, color: 'rgba(255,255,255,.5)' }}>LAST REBAL: 2026-03-31</span>
            <span style={{ fontSize: 10, fontFamily: T.mono, color: T.gold }}>NEXT: 2026-06-30</span>
          </div>
        </div>
        <div style={{ borderTop: `1px solid ${T.gold}`, display: 'flex', gap: 0 }}>
          {TABS.map((t, i) => (
            <button key={i} onClick={() => setTab(i)} style={{
              padding: '10px 18px', border: 'none', cursor: 'pointer', fontFamily: T.mono,
              fontSize: 11, letterSpacing: 0.4, fontWeight: tab === i ? 700 : 400,
              color: tab === i ? T.gold : 'rgba(255,255,255,.55)',
              background: tab === i ? 'rgba(197,169,106,.12)' : 'transparent',
              borderBottom: tab === i ? `2px solid ${T.gold}` : '2px solid transparent',
              transition: 'all .15s',
            }}>{t}</button>
          ))}
        </div>
      </div>
      {/* gold accent line */}
      <div style={{ height: 2, background: `linear-gradient(90deg, ${T.gold}, transparent)` }} />
      {/* content */}
      <div style={{ padding: '16px 28px', maxWidth: 1400, margin: '0 auto' }}>
        <Panel />
      </div>
      {/* terminal bar */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: 26, background: T.navy, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', zIndex: 50 }}>
        <span style={{ fontSize: 10, fontFamily: T.mono, color: 'rgba(255,255,255,.45)' }}>CLIMATE_BENCH v3.2.0</span>
        <span style={{ fontSize: 10, fontFamily: T.mono, color: T.gold }}>4 benchmarks active // TE budget OK // Next rebalance T-86d</span>
        <span style={{ fontSize: 10, fontFamily: T.mono, color: 'rgba(255,255,255,.35)' }}>EU BMR Art.19a compliant</span>
      </div>
    </div>
  );
}
