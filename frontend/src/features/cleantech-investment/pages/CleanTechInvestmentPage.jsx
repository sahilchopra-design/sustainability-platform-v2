import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, LineChart, Line, Legend, Cell,
} from 'recharts';

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f6f4f0',
  navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f',
  teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c',
  surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace',
};

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const SECTORS = ['Solar', 'Wind', 'Storage', 'EV', 'Hydrogen', 'CCS', 'Smart Grid', 'Agri-Tech'];
const STAGES = ['Seed', 'Series A', 'Series B', 'Growth', 'Public'];
const COUNTRIES = ['USA', 'Germany', 'China', 'UK', 'India', 'Australia', 'France', 'Japan', 'Canada', 'Brazil'];

const COMPANIES = Array.from({ length: 75 }, (_, i) => {
  const sector = SECTORS[Math.floor(sr(i * 7) * SECTORS.length)];
  const stage = STAGES[Math.floor(sr(i * 11) * STAGES.length)];
  const country = COUNTRIES[Math.floor(sr(i * 13) * COUNTRIES.length)];
  const investmentRaised = Math.round(50 + sr(i * 17) * 2950);
  const valuation = Math.round(investmentRaised * (1.5 + sr(i * 23) * 8));
  const revenueGrowth = Math.round(10 + sr(i * 29) * 120);
  const carbonAbatement = parseFloat((0.1 + sr(i * 31) * 4.9).toFixed(2));
  const irr = Math.round(8 + sr(i * 37) * 42);
  const trl = Math.min(9, Math.max(1, Math.round(1 + sr(i * 41) * 8)));
  const ipoReadiness = Math.round(sr(i * 43) * 100);
  const climateAligned = sr(i * 47) > 0.25;
  const names = ['SolarNova', 'WindForce', 'GridSpark', 'EcoStorage', 'HydroGen', 'CarbonX',
    'SmartWatt', 'AgriCarbon', 'SunTech', 'AeroWind', 'VoltCell', 'CleanDrive',
    'H2Future', 'CaptureX', 'NexGrid', 'FarmNeutral', 'BrightSolar', 'TorqueWind',
    'FluxStore', 'IonMobility', 'ElysiumH2', 'TerraDAC', 'GridMind', 'CropCarbon',
    'SolisEnergy', 'GaleForce', 'PowerVault', 'EVolution', 'ProtonPure', 'PointZero'];
  const name = `${names[i % names.length]} ${['Inc', 'Ltd', 'Corp', 'AG', 'GmbH', 'PLC', 'SA'][Math.floor(sr(i * 53) * 7)]}`;
  return { id: i + 1, name, sector, stage, country, investmentRaised, valuation, revenueGrowth, carbonAbatement, irr, trl, ipoReadiness, climateAligned };
});

const YEAR_DATA = [2018, 2019, 2020, 2021, 2022, 2023, 2024].map((yr, i) => ({
  year: yr,
  investment: Math.round(800 + sr(i * 17) * 3200 + i * 600),
}));

const TABS = [
  'Portfolio Overview', 'Sector Breakdown', 'Stage Analysis', 'Carbon Abatement',
  'IRR Analysis', 'TRL Readiness', 'Geographic Distribution', 'Exit Pipeline',
];

const SECTOR_COLORS = ['#0369a1', '#16a34a', '#d97706', '#7c3aed', '#ea580c', '#0f766e', '#4f46e5', '#b8860b'];

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '18px 22px', flex: 1, minWidth: 180 }}>
    <div style={{ fontSize: 12, color: T.textSec, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 800, color: color || T.navy, fontFamily: T.fontMono }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>{sub}</div>}
  </div>
);

export default function CleanTechInvestmentPage() {
  const [tab, setTab] = useState(0);
  const [sectorFilter, setSectorFilter] = useState('All');
  const [stageFilter, setStageFilter] = useState('All');
  const [countryFilter, setCountryFilter] = useState('All');
  const [minIrr, setMinIrr] = useState(0);
  const [minTrl, setMinTrl] = useState(1);

  const filtered = useMemo(() => COMPANIES.filter(c =>
    (sectorFilter === 'All' || c.sector === sectorFilter) &&
    (stageFilter === 'All' || c.stage === stageFilter) &&
    (countryFilter === 'All' || c.country === countryFilter) &&
    c.irr >= minIrr &&
    c.trl >= minTrl
  ), [sectorFilter, stageFilter, countryFilter, minIrr, minTrl]);

  const totalInvestment = filtered.reduce((s, c) => s + c.investmentRaised, 0);
  const avgIrr = filtered.length ? (filtered.reduce((s, c) => s + c.irr, 0) / filtered.length).toFixed(1) : '0.0';
  const totalAbatement = filtered.reduce((s, c) => s + c.carbonAbatement, 0).toFixed(1);
  const avgTrl = filtered.length ? (filtered.reduce((s, c) => s + c.trl, 0) / filtered.length).toFixed(1) : '0.0';

  const sectorData = SECTORS.map(s => ({
    sector: s,
    investment: filtered.filter(c => c.sector === s).reduce((sum, c) => sum + c.investmentRaised, 0),
    count: filtered.filter(c => c.sector === s).length,
  }));

  const stageData = STAGES.map(st => ({
    stage: st,
    count: filtered.filter(c => c.stage === st).length,
    avgIrr: (() => { const a = filtered.filter(c => c.stage === st); return a.length ? (a.reduce((s, c) => s + c.irr, 0) / a.length).toFixed(1) : 0; })(),
  }));

  const trlDist = Array.from({ length: 9 }, (_, i) => ({
    trl: `TRL ${i + 1}`,
    count: filtered.filter(c => c.trl === i + 1).length,
  }));

  const scatterData = filtered.map(c => ({ x: c.carbonAbatement, y: c.irr, name: c.name, sector: c.sector, inv: c.investmentRaised }));

  const geoData = COUNTRIES.map(cn => ({
    country: cn,
    count: filtered.filter(c => c.country === cn).length,
    investment: filtered.filter(c => c.country === cn).reduce((s, c) => s + c.investmentRaised, 0),
  })).filter(d => d.count > 0);

  const exitPipeline = [...filtered].sort((a, b) => b.ipoReadiness - a.ipoReadiness).slice(0, 15);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, system-ui, sans-serif', padding: '28px 32px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: T.navy }}>⚡ CleanTech Investment Analytics</span>
          <span style={{ fontSize: 11, background: T.indigo, color: '#fff', borderRadius: 4, padding: '2px 8px', fontWeight: 700 }}>EP-DF1</span>
        </div>
        <div style={{ fontSize: 13, color: T.textSec }}>75 cleantech companies · 8 sectors · Portfolio IRR, TRL readiness & carbon abatement intelligence</div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20, background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 18px' }}>
        {[
          { label: 'Sector', value: sectorFilter, setter: setSectorFilter, opts: ['All', ...SECTORS] },
          { label: 'Stage', value: stageFilter, setter: setStageFilter, opts: ['All', ...STAGES] },
          { label: 'Country', value: countryFilter, setter: setCountryFilter, opts: ['All', ...COUNTRIES] },
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
          <span style={{ fontSize: 12, color: T.textSec, fontWeight: 600 }}>Min IRR: {minIrr}%</span>
          <input type="range" min={0} max={40} value={minIrr} onChange={e => setMinIrr(+e.target.value)} style={{ width: 100 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: T.textSec, fontWeight: 600 }}>Min TRL: {minTrl}</span>
          <input type="range" min={1} max={9} value={minTrl} onChange={e => setMinTrl(+e.target.value)} style={{ width: 80 }} />
        </div>
        <span style={{ fontSize: 12, color: T.textSec, alignSelf: 'center' }}>{filtered.length} companies</span>
      </div>

      {/* KPIs */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 22, flexWrap: 'wrap' }}>
        <KpiCard label="Total Investment Raised" value={`$${(totalInvestment / 1000).toFixed(1)}Bn`} sub="across filtered portfolio" color={T.blue} />
        <KpiCard label="Avg Portfolio IRR" value={`${avgIrr}%`} sub="internal rate of return" color={T.green} />
        <KpiCard label="Total Carbon Abatement" value={`${totalAbatement} MtCO₂/yr`} sub="annual avoided emissions" color={T.teal} />
        <KpiCard label="Avg TRL Score" value={avgTrl} sub="technology readiness level" color={T.indigo} />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            style={{ padding: '7px 14px', borderRadius: 7, border: `1px solid ${tab === i ? T.indigo : T.border}`, background: tab === i ? T.indigo : T.card, color: tab === i ? '#fff' : T.textSec, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24 }}>
        {tab === 0 && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Portfolio Overview — Top 20 Companies</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Company', 'Sector', 'Stage', 'Country', 'Investment ($M)', 'Valuation ($M)', 'IRR (%)', 'TRL', 'CO₂ Abat.'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.textSec, fontWeight: 700, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 20).map((c, i) => (
                  <tr key={c.id} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                    <td style={{ padding: '7px 10px', color: T.navy, fontWeight: 600 }}>{c.name}</td>
                    <td style={{ padding: '7px 10px', color: T.textSec }}>{c.sector}</td>
                    <td style={{ padding: '7px 10px' }}><span style={{ background: T.indigo + '22', color: T.indigo, borderRadius: 4, padding: '2px 6px', fontSize: 11, fontWeight: 600 }}>{c.stage}</span></td>
                    <td style={{ padding: '7px 10px', color: T.textSec }}>{c.country}</td>
                    <td style={{ padding: '7px 10px', fontFamily: T.fontMono, color: T.textPri }}>${c.investmentRaised.toLocaleString()}</td>
                    <td style={{ padding: '7px 10px', fontFamily: T.fontMono, color: T.textPri }}>${c.valuation.toLocaleString()}</td>
                    <td style={{ padding: '7px 10px', fontFamily: T.fontMono, color: c.irr >= 20 ? T.green : T.amber }}>{c.irr}%</td>
                    <td style={{ padding: '7px 10px', fontFamily: T.fontMono, color: T.blue }}>{c.trl}</td>
                    <td style={{ padding: '7px 10px', fontFamily: T.fontMono, color: T.teal }}>{c.carbonAbatement} Mt</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 1 && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Sector Breakdown — Investment by Sector ($M)</div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={sectorData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="sector" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip formatter={(v) => [`$${v.toLocaleString()}M`, 'Investment']} />
                <Bar dataKey="investment" radius={[4, 4, 0, 0]}>
                  {sectorData.map((_, idx) => <Cell key={idx} fill={SECTOR_COLORS[idx % SECTOR_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 2 && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Stage Analysis — Company Count & Avg IRR by Stage</div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={stageData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="stage" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip />
                <Bar yAxisId="left" dataKey="count" name="Companies" fill={T.blue} radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="avgIrr" name="Avg IRR (%)" fill={T.green} radius={[4, 4, 0, 0]} />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 3 && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Carbon Abatement vs IRR — Bubble: Investment Size ($M)</div>
            <ResponsiveContainer width="100%" height={360}>
              <ScatterChart margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="x" name="Carbon Abatement (MtCO₂/yr)" label={{ value: 'Carbon Abatement (MtCO₂/yr)', position: 'bottom', fontSize: 11, fill: T.textSec }} tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis dataKey="y" name="IRR (%)" label={{ value: 'IRR (%)', angle: -90, position: 'insideLeft', fontSize: 11, fill: T.textSec }} tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(v, n) => [v, n]} />
                <Scatter data={scatterData} fill={T.indigo} fillOpacity={0.6} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 4 && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 16 }}>IRR Analysis — Top Companies by IRR</div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={[...filtered].sort((a, b) => b.irr - a.irr).slice(0, 15).map(c => ({ name: c.name.split(' ')[0], irr: c.irr, sector: c.sector }))}
                layout="vertical" margin={{ top: 10, right: 40, left: 80, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} width={80} />
                <Tooltip formatter={(v) => [`${v}%`, 'IRR']} />
                <Bar dataKey="irr" fill={T.green} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 5 && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 16 }}>TRL Readiness Distribution</div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trlDist} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="trl" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip formatter={(v) => [v, 'Companies']} />
                <Bar dataKey="count" fill={T.teal} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[
                { range: 'TRL 1–3', label: 'Research Phase', color: T.amber },
                { range: 'TRL 4–6', label: 'Development Phase', color: T.blue },
                { range: 'TRL 7–9', label: 'Commercial Ready', color: T.green },
              ].map(({ range, label, color }) => {
                const [lo, hi] = range.includes('1') ? [1, 3] : range.includes('4') ? [4, 6] : [7, 9];
                const cnt = filtered.filter(c => c.trl >= lo && c.trl <= hi).length;
                return (
                  <div key={range} style={{ background: color + '18', border: `1px solid ${color}44`, borderRadius: 8, padding: '12px 16px' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color }}>{range}</div>
                    <div style={{ fontSize: 11, color: T.textSec }}>{label}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color, fontFamily: T.fontMono }}>{cnt}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 6 && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Geographic Distribution — Companies & Investment by Country</div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={geoData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="country" tick={{ fontSize: 11, fill: T.textSec }} angle={-30} textAnchor="end" />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip />
                <Bar yAxisId="left" dataKey="count" name="Companies" fill={T.blue} radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="investment" name="Investment ($M)" fill={T.sage} radius={[4, 4, 0, 0]} />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 7 && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Exit Pipeline — Top Companies by IPO Readiness</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {exitPipeline.map((c, i) => (
                <div key={c.id} style={{ background: T.sub, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 16px' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 4 }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: T.textSec, marginBottom: 8 }}>{c.sector} · {c.country} · {c.stage}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: T.textSec }}>IPO Readiness</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: c.ipoReadiness >= 70 ? T.green : T.amber, fontFamily: T.fontMono }}>{c.ipoReadiness}%</span>
                  </div>
                  <div style={{ background: T.border, borderRadius: 4, height: 4 }}>
                    <div style={{ width: `${c.ipoReadiness}%`, height: 4, background: c.ipoReadiness >= 70 ? T.green : T.amber, borderRadius: 4 }} />
                  </div>
                  <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                    <span style={{ fontSize: 11, color: T.green, fontFamily: T.fontMono }}>IRR: {c.irr}%</span>
                    <span style={{ fontSize: 11, color: T.blue, fontFamily: T.fontMono }}>TRL: {c.trl}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Cumulative Investment Pipeline (2018–2024)</div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={YEAR_DATA} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                  <Tooltip formatter={(v) => [`$${v.toLocaleString()}M`, 'Investment']} />
                  <Line type="monotone" dataKey="investment" stroke={T.indigo} strokeWidth={2} dot={{ fill: T.indigo, r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
