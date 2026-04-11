import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend,
} from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f6f4f0',
  navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f',
  teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c',
  surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace',
};

const COMMODITIES = ['Textiles', 'Electronics', 'Food', 'Automotive', 'Chemicals', 'Construction'];
const REGIONS = ['South Asia', 'Southeast Asia', 'East Asia', 'Sub-Saharan Africa', 'Latin America', 'MENA', 'Eastern Europe'];

const CHAIN_NAMES = [
  'Bangladesh Garments', 'India Textiles', 'Vietnam Apparel', 'Cambodia Garments', 'Myanmar Textiles',
  'China Electronics', 'India Electronics', 'Malaysia Semicon', 'Philippines BPO', 'Taiwan Chips',
  'Brazil Coffee', 'Colombia Flowers', 'Kenya Tea', 'Ivory Coast Cocoa', 'Indonesia Palm Oil',
  'Mexico Auto Parts', 'Thailand Auto', 'South Africa Auto', 'Morocco Auto', 'Serbia Auto',
  'India Chemicals', 'China Chemicals', 'Brazil Chemicals', 'Saudi Petrochem', 'Egypt Petrochem',
  'Philippines Construction', 'India Cement', 'Vietnam Construction', 'Ethiopia Construction', 'Tanzania Infrastructure',
  'Pakistan Textiles', 'Sri Lanka Apparel', 'Nepal Carpets', 'Indonesia Rubber', 'Nigeria Leather',
  'Ghana Electronics', 'Senegal Fish', 'Peru Copper', 'Chile Lithium', 'Argentina Soy',
  'Turkey Textiles', 'Romania Auto', 'Bulgaria Electronics', 'Poland Food Proc', 'Hungary Auto',
  'Bangladesh Seafood', 'Vietnam Shrimp', 'Ecuador Bananas', 'Guatemala Sugar', 'Honduras Textiles',
  'South Korea Steel', 'Japan Automotive', 'Germany Auto Parts', 'France Aerospace', 'UK Finance SC',
  'Tanzania Textiles', 'Malawi Tea', 'Uganda Coffee', 'Rwanda Coltan', 'DRC Cobalt',
  'Bolivia Quinoa', 'Paraguay Soy', 'Uruguay Beef', 'Dominican Rep Sugar', 'Trinidad LNG',
  'Kuwait Petrochem', 'UAE Logistics', 'Oman Al Aluminium', 'Qatar LNG', 'Bahrain Steel',
  'Malaysia Palm Oil', 'Thailand Rice', 'Vietnam Coffee', 'Philippines Coconut',
];

const SUPPLY_CHAINS = Array.from({ length: 70 }, (_, i) => {
  const commodity = COMMODITIES[i % COMMODITIES.length];
  const region = REGIONS[i % REGIONS.length];
  return {
    id: i,
    name: CHAIN_NAMES[i] || `Supply Chain ${i + 1}`,
    commodity,
    country: region,
    region,
    heatStressRisk: +(1 + sr(i * 7) * 9).toFixed(1),
    floodRisk: +(1 + sr(i * 11) * 9).toFixed(1),
    workersAffected: +(0.1 + sr(i * 13) * 4.9).toFixed(2),
    wageRisk: +(5 + sr(i * 17) * 45).toFixed(1),
    laborRightRisk: +(1 + sr(i * 19) * 9).toFixed(1),
    childLaborIndex: +(0 + sr(i * 23) * 8).toFixed(1),
    genderPayGap: +(5 + sr(i * 29) * 45).toFixed(1),
    modernSlaveryRisk: +(0 + sr(i * 31) * 8).toFixed(1),
    climateAdaptationScore: +(1 + sr(i * 37) * 9).toFixed(1),
  };
});

const TABS = [
  'Supply Chain Overview', 'Heat Stress Exposure', 'Flood Risk', 'Labor Rights',
  'Wage Risk', 'Child Labor Risk', 'Modern Slavery', 'Adaptation Capacity',
];

const getRiskLabel = v => v >= 7 ? 'High' : v >= 4 ? 'Medium' : 'Low';
const RISK_COLORS = { Low: T.green, Medium: T.amber, High: T.red };

export default function SupplyChainLaborClimateRiskPage() {
  const [tab, setTab] = useState(0);
  const [commodityFilter, setCommodityFilter] = useState('All');
  const [regionFilter, setRegionFilter] = useState('All');
  const [riskLevelFilter, setRiskLevelFilter] = useState('All');
  const [tempScenario, setTempScenario] = useState(2.0);
  const [ddThreshold, setDdThreshold] = useState(5);

  const filtered = useMemo(() => {
    return SUPPLY_CHAINS.filter(s => {
      if (commodityFilter !== 'All' && s.commodity !== commodityFilter) return false;
      if (regionFilter !== 'All' && s.region !== regionFilter) return false;
      if (riskLevelFilter !== 'All' && getRiskLabel(s.heatStressRisk) !== riskLevelFilter) return false;
      return true;
    });
  }, [commodityFilter, regionFilter, riskLevelFilter]);

  const tempMult = 1 + (tempScenario - 1.5) * 0.1;
  const totalWorkers = filtered.reduce((s, c) => s + c.workersAffected, 0);
  const avgHeatRisk = filtered.length ? filtered.reduce((s, c) => s + c.heatStressRisk * tempMult, 0) / filtered.length : 0;
  const avgLaborRights = filtered.length ? filtered.reduce((s, c) => s + c.laborRightRisk, 0) / filtered.length : 0;
  const avgAdaptation = filtered.length ? filtered.reduce((s, c) => s + c.climateAdaptationScore, 0) / filtered.length : 0;

  const workersByCommodity = COMMODITIES.map(c => ({
    commodity: c,
    workers: +(filtered.filter(s => s.commodity === c).reduce((sum, s) => sum + s.workersAffected, 0)).toFixed(2),
  }));

  const scatterData = filtered.map(s => ({
    x: +(s.heatStressRisk * tempMult).toFixed(1),
    y: s.laborRightRisk,
    name: s.name,
  }));

  const wageRiskByCountry = [...filtered]
    .sort((a, b) => b.wageRisk - a.wageRisk)
    .slice(0, 15)
    .map(s => ({ name: s.name.split(' ').slice(0, 2).join(' '), wageRisk: s.wageRisk }));

  const radarByCommodity = COMMODITIES.map(c => {
    const sub = filtered.filter(s => s.commodity === c);
    const n = Math.max(1, sub.length);
    return {
      commodity: c,
      heatStress: +(sub.reduce((s, x) => s + x.heatStressRisk * tempMult, 0) / n).toFixed(1),
      floodRisk: +(sub.reduce((s, x) => s + x.floodRisk, 0) / n).toFixed(1),
      laborRights: +(sub.reduce((s, x) => s + x.laborRightRisk, 0) / n).toFixed(1),
      wageRisk: +(sub.reduce((s, x) => s + x.wageRisk, 0) / n / 10).toFixed(1),
      modernSlavery: +(sub.reduce((s, x) => s + x.modernSlaveryRisk, 0) / n).toFixed(1),
    };
  });

  const radarDimensions = [
    { key: 'heatStress', label: 'Heat Stress' },
    { key: 'floodRisk', label: 'Flood Risk' },
    { key: 'laborRights', label: 'Labor Rights Risk' },
    { key: 'wageRisk', label: 'Wage Risk (scaled)' },
    { key: 'modernSlavery', label: 'Modern Slavery' },
  ];

  const kpis = [
    { label: 'Total Workers Affected', value: `${totalWorkers.toFixed(1)}M`, color: T.navy },
    { label: 'Avg Heat Stress Risk', value: `${avgHeatRisk.toFixed(1)}/10`, color: T.red },
    { label: 'Avg Labor Rights Score', value: `${avgLaborRights.toFixed(1)}/10`, color: T.amber },
    { label: 'Avg Climate Adaptation', value: `${avgAdaptation.toFixed(1)}/10`, color: T.green },
  ];

  return (
    <div style={{ background: T.bg, minHeight: '100vh', padding: '24px', fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.gold, letterSpacing: 1 }}>EP-DI5</span>
            <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.textSec }}>CLIMATE WORKFORCE & JUST TRANSITION</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: T.navy, margin: 0 }}>Supply Chain Labor & Climate Risk</h1>
          <p style={{ color: T.textSec, fontSize: 13, margin: '4px 0 0' }}>
            70 global supply chains · Heat stress · Flood risk · Labor rights · Wage risk · Modern slavery · Adaptation capacity
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {kpis.map(k => (
            <div key={k.label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px' }}>
              <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono, marginBottom: 6 }}>{k.label.toUpperCase()}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 20, display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {[
            { label: 'Commodity', val: commodityFilter, set: setCommodityFilter, opts: ['All', ...COMMODITIES] },
            { label: 'Region', val: regionFilter, set: setRegionFilter, opts: ['All', ...REGIONS] },
            { label: 'Risk Level', val: riskLevelFilter, set: setRiskLevelFilter, opts: ['All', 'Low', 'Medium', 'High'] },
          ].map(f => (
            <div key={f.label}>
              <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4, fontFamily: T.fontMono }}>{f.label}</div>
              <select value={f.val} onChange={e => f.set(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.sub, fontSize: 13, color: T.textPri }}>
                {f.opts.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
          <div style={{ flex: 1, minWidth: 160 }}>
            <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4, fontFamily: T.fontMono }}>Temperature Scenario: +{tempScenario}°C</div>
            <input type="range" min={1.5} max={4.0} step={0.5} value={tempScenario} onChange={e => setTempScenario(Number(e.target.value))} style={{ width: '100%' }} />
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4, fontFamily: T.fontMono }}>Due Diligence Threshold: {ddThreshold}/10</div>
            <input type="range" min={1} max={10} step={1} value={ddThreshold} onChange={e => setDdThreshold(Number(e.target.value))} style={{ width: '100%' }} />
          </div>
          <div style={{ fontFamily: T.fontMono, fontSize: 12, color: T.textSec }}>{filtered.length} supply chains</div>
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap' }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)} style={{ padding: '8px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: tab === i ? 600 : 400, background: tab === i ? T.navy : T.card, color: tab === i ? '#fff' : T.textSec }}>
              {t}
            </button>
          ))}
        </div>

        {tab === 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 16 }}>Workers Affected by Commodity (M)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={workersByCommodity} margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="commodity" tick={{ fontSize: 11, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Bar dataKey="workers" fill={T.navy} radius={[3, 3, 0, 0]} name="Workers (M)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 16 }}>Risk Dimensions by Commodity — Radar</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarDimensions.map(d => ({
                  dim: d.label,
                  Textiles: radarByCommodity.find(r => r.commodity === 'Textiles')?.[d.key] || 0,
                  Electronics: radarByCommodity.find(r => r.commodity === 'Electronics')?.[d.key] || 0,
                  Food: radarByCommodity.find(r => r.commodity === 'Food')?.[d.key] || 0,
                }))}>
                  <PolarGrid stroke={T.borderL} />
                  <PolarAngleAxis dataKey="dim" tick={{ fontSize: 10, fill: T.textSec }} />
                  <PolarRadiusAxis domain={[0, 10]} tick={{ fontSize: 9 }} />
                  <Radar name="Textiles" dataKey="Textiles" stroke={T.indigo} fill={T.indigo} fillOpacity={0.25} />
                  <Radar name="Electronics" dataKey="Electronics" stroke={T.teal} fill={T.teal} fillOpacity={0.25} />
                  <Radar name="Food" dataKey="Food" stroke={T.amber} fill={T.amber} fillOpacity={0.25} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 1 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 16 }}>Heat Stress Risk by Region (adjusted for +{tempScenario}°C)</h3>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={REGIONS.map(r => { const sub = filtered.filter(s => s.region === r); return { region: r.split(' ').slice(0, 2).join(' '), heatRisk: sub.length ? +(sub.reduce((s, x) => s + x.heatStressRisk * tempMult, 0) / sub.length).toFixed(1) : 0, workers: +(sub.reduce((s, x) => s + x.workersAffected, 0)).toFixed(2) }; }).filter(d => d.workers > 0)} margin={{ bottom: 40, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="region" tick={{ fontSize: 11, fill: T.textSec }} angle={-20} textAnchor="end" interval={0} />
                <YAxis yAxisId="left" domain={[0, 10]} tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar yAxisId="left" dataKey="heatRisk" fill={T.red} radius={[3, 3, 0, 0]} name="Heat Stress Score (0-10)" />
                <Bar yAxisId="right" dataKey="workers" fill={T.amber} radius={[3, 3, 0, 0]} name="Workers Affected (M)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 2 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 16 }}>Flood Risk Score by Commodity</h3>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={COMMODITIES.map(c => { const sub = filtered.filter(s => s.commodity === c); return { commodity: c, floodRisk: sub.length ? +(sub.reduce((s, x) => s + x.floodRisk, 0) / sub.length).toFixed(1) : 0 }; })} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="commodity" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="floodRisk" fill={T.blue} radius={[3, 3, 0, 0]} name="Avg Flood Risk (0-10)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 3 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 16 }}>Heat Stress vs Labor Rights Risk — Scatter</h3>
            <ResponsiveContainer width="100%" height={380}>
              <ScatterChart margin={{ left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="x" name="Heat Stress" tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'Heat Stress Risk (0-10)', position: 'insideBottom', offset: -5, fontSize: 11 }} />
                <YAxis dataKey="y" name="Labor Rights Risk" tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'Labor Rights Risk (0-10)', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ payload }) => payload?.length ? <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: '8px 12px', fontSize: 12 }}><b>{payload[0]?.payload?.name}</b><br />Heat: {payload[0]?.payload?.x}<br />Labor: {payload[0]?.payload?.y}</div> : null} />
                <Scatter data={scatterData} fill={T.purple} opacity={0.7} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 4 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 16 }}>Wage Risk by Country (Top 15, % income at risk)</h3>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={wageRiskByCountry} margin={{ bottom: 60, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} angle={-35} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="wageRisk" fill={T.orange} radius={[3, 3, 0, 0]} name="Wage Risk (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 5 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 16 }}>Child Labor Index by Commodity</h3>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={COMMODITIES.map(c => { const sub = filtered.filter(s => s.commodity === c); return { commodity: c, childLabor: sub.length ? +(sub.reduce((s, x) => s + x.childLaborIndex, 0) / sub.length).toFixed(1) : 0 }; })} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="commodity" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="childLabor" fill={T.red} radius={[3, 3, 0, 0]} name="Child Labor Index (0-10)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 6 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 16 }}>Modern Slavery Risk by Region</h3>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={REGIONS.map(r => { const sub = filtered.filter(s => s.region === r); return { region: r.split(' ').slice(0, 2).join(' '), msr: sub.length ? +(sub.reduce((s, x) => s + x.modernSlaveryRisk, 0) / sub.length).toFixed(1) : 0 }; }).filter(d => d.msr > 0)} margin={{ bottom: 40, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="region" tick={{ fontSize: 11, fill: T.textSec }} angle={-20} textAnchor="end" interval={0} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="msr" fill={T.purple} radius={[3, 3, 0, 0]} name="Modern Slavery Risk (0-10)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 7 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 16 }}>Climate Adaptation Score by Commodity</h3>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={COMMODITIES.map(c => { const sub = filtered.filter(s => s.commodity === c); return { commodity: c, adaptation: sub.length ? +(sub.reduce((s, x) => s + x.climateAdaptationScore, 0) / sub.length).toFixed(1) : 0 }; })} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="commodity" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="adaptation" fill={T.green} radius={[3, 3, 0, 0]} name="Adaptation Score (0-10)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20, overflowX: 'auto' }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 12 }}>Supply Chain Detail Table</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.sub }}>
                {['Supply Chain', 'Commodity', 'Region', 'Workers (M)', 'Heat Risk', 'Flood Risk', 'Labor Rights', 'Wage Risk %', 'Child Labor', 'Modern Slavery', 'Adaptation'].map(h => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.textSec, fontWeight: 600, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.filter(s => s.laborRightRisk > ddThreshold || s.heatStressRisk * tempMult > ddThreshold || true).slice(0, 25).map(s => (
                <tr key={s.id} style={{ borderBottom: `1px solid ${T.borderL}` }}>
                  <td style={{ padding: '7px 10px', color: T.textPri, fontWeight: 500 }}>{s.name}</td>
                  <td style={{ padding: '7px 10px' }}><span style={{ background: T.sub, padding: '2px 8px', borderRadius: 10, fontSize: 11 }}>{s.commodity}</span></td>
                  <td style={{ padding: '7px 10px', color: T.textSec, fontSize: 11 }}>{s.region}</td>
                  <td style={{ padding: '7px 10px', color: T.navy, fontWeight: 600 }}>{s.workersAffected}</td>
                  <td style={{ padding: '7px 10px', color: RISK_COLORS[getRiskLabel(s.heatStressRisk * tempMult)] }}>{(s.heatStressRisk * tempMult).toFixed(1)}</td>
                  <td style={{ padding: '7px 10px', color: RISK_COLORS[getRiskLabel(s.floodRisk)] }}>{s.floodRisk}</td>
                  <td style={{ padding: '7px 10px', color: RISK_COLORS[getRiskLabel(s.laborRightRisk)] }}>{s.laborRightRisk}</td>
                  <td style={{ padding: '7px 10px', color: s.wageRisk > 30 ? T.red : s.wageRisk > 15 ? T.amber : T.green }}>{s.wageRisk}%</td>
                  <td style={{ padding: '7px 10px', color: s.childLaborIndex >= 5 ? T.red : s.childLaborIndex >= 3 ? T.amber : T.green }}>{s.childLaborIndex}</td>
                  <td style={{ padding: '7px 10px', color: s.modernSlaveryRisk >= 5 ? T.red : s.modernSlaveryRisk >= 3 ? T.amber : T.green }}>{s.modernSlaveryRisk}</td>
                  <td style={{ padding: '7px 10px', color: s.climateAdaptationScore >= 7 ? T.green : s.climateAdaptationScore >= 4 ? T.amber : T.red }}>{s.climateAdaptationScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
