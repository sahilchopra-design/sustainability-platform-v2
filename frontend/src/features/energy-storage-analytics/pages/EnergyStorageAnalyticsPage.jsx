import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, AreaChart, Area, Legend, Cell,
} from 'recharts';

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f6f4f0',
  navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f',
  teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c',
  surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace',
};

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const TECHNOLOGIES = ['Li-ion', 'Flow Battery', 'Compressed Air', 'Gravity', 'Hydrogen LDES'];
const STORAGE_COUNTRIES = ['USA', 'China', 'Germany', 'Australia', 'UK', 'South Korea', 'Japan', 'India', 'Canada', 'Spain'];
const APPLICATIONS = ['Grid', 'Behind-Meter', 'EV', 'Industrial'];
const STATUSES = ['Operating', 'Pipeline', 'Announced'];

const TECH_COLORS = [T.blue, T.green, T.amber, T.purple, T.teal];

const PROJECTS = Array.from({ length: 60 }, (_, i) => {
  const technology = TECHNOLOGIES[Math.floor(sr(i * 7) * TECHNOLOGIES.length)];
  const country = STORAGE_COUNTRIES[Math.floor(sr(i * 11) * STORAGE_COUNTRIES.length)];
  const capacity = Math.round(10 + sr(i * 13) * 2990);
  const power = Math.round(5 + sr(i * 17) * 995);
  const durationBase = { 'Li-ion': 4, 'Flow Battery': 8, 'Compressed Air': 12, 'Gravity': 6, 'Hydrogen LDES': 168 }[technology];
  const duration = parseFloat((durationBase * (0.5 + sr(i * 19) * 1.5)).toFixed(1));
  const lcoesBase = { 'Li-ion': 150, 'Flow Battery': 180, 'Compressed Air': 100, 'Gravity': 130, 'Hydrogen LDES': 250 }[technology];
  const lcoes = Math.round(lcoesBase * (0.7 + sr(i * 23) * 0.6));
  const capexBase = { 'Li-ion': 250, 'Flow Battery': 350, 'Compressed Air': 150, 'Gravity': 200, 'Hydrogen LDES': 500 }[technology];
  const capexKwh = Math.round(capexBase * (0.7 + sr(i * 29) * 0.6));
  const cycleLifeBase = { 'Li-ion': 4000, 'Flow Battery': 15000, 'Compressed Air': 30000, 'Gravity': 50000, 'Hydrogen LDES': 20000 }[technology];
  const cycleLife = Math.round(cycleLifeBase * (0.8 + sr(i * 31) * 0.4));
  const application = APPLICATIONS[Math.floor(sr(i * 37) * APPLICATIONS.length)];
  const status = STATUSES[Math.floor(sr(i * 41) * STATUSES.length)];
  const carbonOffset = Math.round(100 + sr(i * 43) * 9900);
  const names = ['Hornsdale', 'Crimson Storage', 'Moss Landing', 'Big Battery', 'Lake Bonney', 'Neoen Project',
    'GridScale', 'PowerWall Hub', 'FlexGrid', 'TeslaGrid', 'FluxStore', 'IronFlow', 'AirEnergy',
    'GravityPower', 'H2Store', 'LongDuration', 'VoltVault', 'GridSpark'];
  const name = `${names[i % names.length]} ${['I', 'II', 'III', 'A', 'B'][Math.floor(sr(i * 53) * 5)]}`;
  return { id: i + 1, name, technology, country, capacity, power, duration, lcoes, capexKwh, cycleLife, application, status, carbonOffset };
});

const COST_TREND = [2018, 2020, 2022, 2024, 2026, 2028, 2030].map((yr, i) => ({
  year: yr,
  liion: Math.round(400 - i * 35 + sr(i * 17) * 20),
  flow: Math.round(500 - i * 25 + sr(i * 23) * 20),
  gravity: Math.round(300 - i * 20 + sr(i * 29) * 15),
}));

const TABS = [
  'Market Overview', 'Technology Comparison', 'Cost Trends', 'Duration Analysis',
  'Grid Applications', 'EV Integration', 'Material Risk', 'Investment Outlook',
];

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '18px 22px', flex: 1, minWidth: 180 }}>
    <div style={{ fontSize: 12, color: T.textSec, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 800, color: color || T.navy, fontFamily: T.fontMono }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>{sub}</div>}
  </div>
);

export default function EnergyStorageAnalyticsPage() {
  const [tab, setTab] = useState(0);
  const [techFilter, setTechFilter] = useState('All');
  const [countryFilter, setCountryFilter] = useState('All');
  const [appFilter, setAppFilter] = useState('All');
  const [battPrice, setBattPrice] = useState(130);
  const [elecPrice, setElecPrice] = useState(60);

  const filtered = useMemo(() => PROJECTS.filter(p =>
    (techFilter === 'All' || p.technology === techFilter) &&
    (countryFilter === 'All' || p.country === countryFilter) &&
    (appFilter === 'All' || p.application === appFilter)
  ), [techFilter, countryFilter, appFilter]);

  const totalCapacityGwh = (filtered.reduce((s, p) => s + p.capacity, 0) / 1000).toFixed(1);
  const avgLcoes = filtered.length ? Math.round(filtered.reduce((s, p) => s + p.lcoes, 0) / filtered.length) : 0;
  const totalCapexM = filtered.reduce((s, p) => s + (p.capacity * p.capexKwh / 1000), 0);
  const avgCycleLife = filtered.length ? Math.round(filtered.reduce((s, p) => s + p.cycleLife, 0) / filtered.length) : 0;

  const techData = TECHNOLOGIES.map(t => ({
    tech: t.length > 10 ? t.substring(0, 10) + '…' : t,
    fullTech: t,
    capacity: (filtered.filter(p => p.technology === t).reduce((s, p) => s + p.capacity, 0) / 1000).toFixed(1),
    count: filtered.filter(p => p.technology === t).length,
    avgLcoes: (() => { const a = filtered.filter(p => p.technology === t); return a.length ? Math.round(a.reduce((s, p) => s + p.lcoes, 0) / a.length) : 0; })(),
  }));

  const durationData = filtered.map(p => ({ x: p.duration, y: p.lcoes, name: p.name, tech: p.technology, capacity: p.capacity }));

  const appData = APPLICATIONS.map(a => ({
    app: a,
    count: filtered.filter(p => p.application === a).length,
    capacity: (filtered.filter(p => p.application === a).reduce((s, p) => s + p.capacity, 0) / 1000).toFixed(1),
  }));

  const evData = filtered.filter(p => p.application === 'EV' || p.technology === 'Li-ion');

  // Adjusted LCOES with battery price
  const adjLcoes = TECHNOLOGIES.map((t, ti) => {
    const base = { 'Li-ion': 150, 'Flow Battery': 180, 'Compressed Air': 100, 'Gravity': 130, 'Hydrogen LDES': 250 }[t];
    const adj = t === 'Li-ion' ? (battPrice - 130) * 0.3 : t === 'Flow Battery' ? (battPrice - 130) * 0.2 : 0;
    const elAdj = (elecPrice - 60) * 0.5;
    return { tech: t.length > 10 ? t.substring(0, 10) + '…' : t, lcoes: Math.max(50, Math.round(base + adj + elAdj)) };
  });

  const materialRisks = [
    { material: 'Lithium', criticality: 78, supply: 45, price: 32000, yoyChg: -28, tech: 'Li-ion' },
    { material: 'Cobalt', criticality: 85, supply: 38, price: 28000, yoyChg: -15, tech: 'Li-ion' },
    { material: 'Nickel', criticality: 62, supply: 55, price: 16000, yoyChg: -22, tech: 'Li-ion / Flow' },
    { material: 'Vanadium', criticality: 70, supply: 42, price: 9000, yoyChg: 8, tech: 'Flow Battery' },
    { material: 'Iron', criticality: 20, supply: 88, price: 120, yoyChg: 3, tech: 'Gravity / LFP' },
  ];

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, system-ui, sans-serif', padding: '28px 32px' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: T.navy }}>⚡ Energy Storage Analytics</span>
          <span style={{ fontSize: 11, background: T.amber, color: '#fff', borderRadius: 4, padding: '2px 8px', fontWeight: 700 }}>EP-DF4</span>
        </div>
        <div style={{ fontSize: 13, color: T.textSec }}>60 storage projects · 5 technologies · LCOES, duration analysis, material risk & cost learning curves</div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20, background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 18px' }}>
        {[
          { label: 'Technology', value: techFilter, setter: setTechFilter, opts: ['All', ...TECHNOLOGIES] },
          { label: 'Country', value: countryFilter, setter: setCountryFilter, opts: ['All', ...STORAGE_COUNTRIES] },
          { label: 'Application', value: appFilter, setter: setAppFilter, opts: ['All', ...APPLICATIONS] },
        ].map(({ label, value, setter, opts }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: T.textSec, fontWeight: 600 }}>{label}</span>
            <select value={value} onChange={e => setter(e.target.value)}
              style={{ fontSize: 12, border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 8px', background: T.bg, color: T.textPri }}>
              {opts.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: T.textSec, fontWeight: 600 }}>Battery: ${battPrice}/kWh</span>
          <input type="range" min={60} max={250} value={battPrice} onChange={e => setBattPrice(+e.target.value)} style={{ width: 100 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: T.textSec, fontWeight: 600 }}>Electricity: ${elecPrice}/MWh</span>
          <input type="range" min={20} max={120} value={elecPrice} onChange={e => setElecPrice(+e.target.value)} style={{ width: 100 }} />
        </div>
        <span style={{ fontSize: 12, color: T.textSec, alignSelf: 'center' }}>{filtered.length} projects</span>
      </div>

      {/* KPIs */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 22, flexWrap: 'wrap' }}>
        <KpiCard label="Total Capacity Pipeline" value={`${totalCapacityGwh} GWh`} sub="filtered projects" color={T.amber} />
        <KpiCard label="Avg LCOES" value={`$${avgLcoes}/MWh`} sub="levelised cost of storage" color={T.blue} />
        <KpiCard label="Total Capex Est." value={`$${(totalCapexM / 1000).toFixed(1)}Bn`} sub="capacity × $/kWh" color={T.indigo} />
        <KpiCard label="Avg Cycle Life" value={avgCycleLife.toLocaleString()} sub="cycles" color={T.green} />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            style={{ padding: '7px 14px', borderRadius: 7, border: `1px solid ${tab === i ? T.amber : T.border}`, background: tab === i ? T.amber : T.card, color: tab === i ? '#fff' : T.textSec, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            {t}
          </button>
        ))}
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24 }}>
        {tab === 0 && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Market Overview — Capacity by Technology</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={techData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="tech" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'Capacity (GWh)', angle: -90, position: 'insideLeft', fontSize: 11, fill: T.textSec }} />
                <Tooltip formatter={(v) => [`${v} GWh`, 'Capacity']} />
                <Bar dataKey="capacity" radius={[4, 4, 0, 0]}>
                  {techData.map((_, idx) => <Cell key={idx} fill={TECH_COLORS[idx % TECH_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 1 && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Technology Comparison — Capacity, LCOES & Cycle Life</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Technology', 'Projects', 'Capacity (GWh)', 'Avg LCOES ($/MWh)', 'Avg Duration (hrs)', 'Avg Cycle Life'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: T.textSec, fontWeight: 700, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TECHNOLOGIES.map((t, ti) => {
                  const tp = filtered.filter(p => p.technology === t);
                  const avgDur = tp.length ? (tp.reduce((s, p) => s + p.duration, 0) / tp.length).toFixed(1) : 0;
                  const avgCyc = tp.length ? Math.round(tp.reduce((s, p) => s + p.cycleLife, 0) / tp.length) : 0;
                  return (
                    <tr key={t} style={{ background: ti % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '9px 12px', color: TECH_COLORS[ti], fontWeight: 700 }}>{t}</td>
                      <td style={{ padding: '9px 12px', fontFamily: T.fontMono }}>{tp.length}</td>
                      <td style={{ padding: '9px 12px', fontFamily: T.fontMono, color: T.amber }}>{(tp.reduce((s, p) => s + p.capacity, 0) / 1000).toFixed(1)} GWh</td>
                      <td style={{ padding: '9px 12px', fontFamily: T.fontMono, color: tp.length ? (tp.reduce((s, p) => s + p.lcoes, 0) / tp.length < 150 ? T.green : T.amber) : T.textSec }}>${techData[ti].avgLcoes}</td>
                      <td style={{ padding: '9px 12px', fontFamily: T.fontMono }}>{avgDur} hrs</td>
                      <td style={{ padding: '9px 12px', fontFamily: T.fontMono, color: T.blue }}>{avgCyc.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {tab === 2 && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Cost Learning Curves (2018–2030, $/kWh)</div>
            <div style={{ fontSize: 12, color: T.textSec, marginBottom: 16 }}>Price-adjusted LCOES at right · Historical capex learning rates at left</div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={COST_TREND} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec }} label={{ value: '$/kWh', angle: -90, position: 'insideLeft', fontSize: 11, fill: T.textSec }} />
                <Tooltip formatter={(v) => [`$${v}/kWh`]} />
                <Area type="monotone" dataKey="liion" name="Li-ion" stroke={T.blue} fill={T.blue + '22'} />
                <Area type="monotone" dataKey="flow" name="Flow Battery" stroke={T.green} fill={T.green + '22'} />
                <Area type="monotone" dataKey="gravity" name="Gravity" stroke={T.purple} fill={T.purple + '22'} />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Price-Adjusted LCOES at Current Inputs</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={adjLcoes} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="tech" tick={{ fontSize: 10, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                  <Tooltip formatter={(v) => [`$${v}/MWh`, 'LCOES']} />
                  <Bar dataKey="lcoes" radius={[4, 4, 0, 0]}>
                    {adjLcoes.map((_, idx) => <Cell key={idx} fill={TECH_COLORS[idx % TECH_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 3 && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Duration Analysis — Duration (hrs) vs LCOES ($/MWh)</div>
            <ResponsiveContainer width="100%" height={340}>
              <ScatterChart margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="x" name="Duration (hrs)" label={{ value: 'Duration (hrs)', position: 'bottom', fontSize: 11, fill: T.textSec }} tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis dataKey="y" name="LCOES ($/MWh)" label={{ value: 'LCOES ($/MWh)', angle: -90, position: 'insideLeft', fontSize: 11, fill: T.textSec }} tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip formatter={(v, n) => [v, n]} />
                <Scatter data={durationData} fill={T.amber} fillOpacity={0.65} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 4 && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Grid Applications — Projects by End-Use</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={appData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="app" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip />
                <Bar yAxisId="left" dataKey="count" name="Projects" fill={T.blue} radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="capacity" name="Capacity (GWh)" fill={T.amber} radius={[4, 4, 0, 0]} />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 5 && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 16 }}>EV Integration — Li-ion & EV Application Projects</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Project', 'Technology', 'Country', 'Capacity (MWh)', 'Duration (hrs)', 'Capex ($/kWh)', 'Carbon Offset (tCO₂/yr)', 'Status'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.textSec, fontWeight: 700, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {evData.slice(0, 15).map((p, i) => (
                  <tr key={p.id} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                    <td style={{ padding: '7px 10px', color: T.navy, fontWeight: 600 }}>{p.name}</td>
                    <td style={{ padding: '7px 10px', color: TECH_COLORS[TECHNOLOGIES.indexOf(p.technology)], fontWeight: 600 }}>{p.technology}</td>
                    <td style={{ padding: '7px 10px', color: T.textSec }}>{p.country}</td>
                    <td style={{ padding: '7px 10px', fontFamily: T.fontMono }}>{p.capacity.toLocaleString()}</td>
                    <td style={{ padding: '7px 10px', fontFamily: T.fontMono }}>{p.duration}</td>
                    <td style={{ padding: '7px 10px', fontFamily: T.fontMono, color: p.capexKwh < 200 ? T.green : T.amber }}>${p.capexKwh}</td>
                    <td style={{ padding: '7px 10px', fontFamily: T.fontMono, color: T.teal }}>{p.carbonOffset.toLocaleString()}</td>
                    <td style={{ padding: '7px 10px' }}><span style={{ color: p.status === 'Operating' ? T.green : p.status === 'Pipeline' ? T.blue : T.amber, fontWeight: 600, fontSize: 11 }}>{p.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 6 && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Material Risk — Critical Minerals for Storage Technologies</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Material', 'Applicable Tech', 'Criticality Score', 'Supply Concentration', 'Spot Price ($/t)', 'YoY Change'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: T.textSec, fontWeight: 700, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {materialRisks.map((m, i) => (
                  <tr key={m.material} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                    <td style={{ padding: '10px 12px', color: T.navy, fontWeight: 700 }}>{m.material}</td>
                    <td style={{ padding: '10px 12px', color: T.textSec }}>{m.tech}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 60, height: 6, background: T.border, borderRadius: 3 }}>
                          <div style={{ width: `${m.criticality}%`, height: 6, background: m.criticality >= 70 ? T.red : m.criticality >= 50 ? T.amber : T.green, borderRadius: 3 }} />
                        </div>
                        <span style={{ fontFamily: T.fontMono, fontSize: 11 }}>{m.criticality}</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px', fontFamily: T.fontMono, color: m.supply < 50 ? T.red : T.amber }}>{m.supply}%</td>
                    <td style={{ padding: '10px 12px', fontFamily: T.fontMono }}>${m.price.toLocaleString()}</td>
                    <td style={{ padding: '10px 12px', fontFamily: T.fontMono, color: m.yoyChg > 0 ? T.green : T.red, fontWeight: 700 }}>{m.yoyChg > 0 ? '+' : ''}{m.yoyChg}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 7 && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Investment Outlook — Capacity by Country</div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={STORAGE_COUNTRIES.map(cn => ({
                country: cn,
                capacity: parseFloat((filtered.filter(p => p.country === cn).reduce((s, p) => s + p.capacity, 0) / 1000).toFixed(2)),
              })).filter(d => d.capacity > 0)} margin={{ top: 10, right: 20, left: 10, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="country" tick={{ fontSize: 10, fill: T.textSec }} angle={-30} textAnchor="end" />
                <YAxis tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'GWh', angle: -90, position: 'insideLeft', fontSize: 11, fill: T.textSec }} />
                <Tooltip formatter={(v) => [`${v} GWh`, 'Capacity']} />
                <Bar dataKey="capacity" fill={T.amber} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
