import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis
} from 'recharts';
import DataUploadPanel from '../../../components/DataUploadPanel';
import { useTestData } from '../../../context/TestDataContext';

const API = 'http://localhost:8001';
const T = {
  bg: '#f6f4f0', navy: '#1b3a5c', gold: '#c5a96a', sage: '#5a8a6a',
  card: '#ffffff', border: '#e2ddd5', text: '#2c2c2c', sub: '#6b7280',
  red: '#dc2626', amber: '#d97706', green: '#16a34a', blue: '#2563eb', indigo: '#4f46e5',
  font: "'Inter','SF Pro Display',system-ui,-apple-system,sans-serif",
};
const CAT_COLOR = { Orderly: T.sage, Disorderly: T.amber, 'Hot House World': T.red };

const BASE_SCENARIOS = [
  { id: 'NGFS_P3_NET_ZERO_2050',    name: 'Net Zero 2050',         category: 'Orderly',        temp: 1.5, c30: 190, c50: 795, gdp: -4.2,  str: 1400, tr: 9.1, pr: 2.1 },
  { id: 'NGFS_P3_BELOW_2C',         name: 'Below 2°C',             category: 'Orderly',        temp: 1.8, c30: 135, c50: 490, gdp: -2.8,  str: 950,  tr: 7.2, pr: 3.4 },
  { id: 'NGFS_P3_LOW_DEMAND',       name: 'Low Energy Demand',     category: 'Orderly',        temp: 1.4, c30: 210, c50: 850, gdp: -3.1,  str: 1600, tr: 9.4, pr: 1.8 },
  { id: 'NGFS_P3_DELAYED_2C',       name: 'Delayed Transition',    category: 'Disorderly',     temp: 1.8, c30: 55,  c50: 680, gdp: -4.8,  str: 1200, tr: 8.5, pr: 3.4 },
  { id: 'NGFS_P3_DIVERGENT_NZ',     name: 'Divergent Net Zero',    category: 'Disorderly',     temp: 1.5, c30: 120, c50: 820, gdp: -5.5,  str: 1550, tr: 8.8, pr: 2.1 },
  { id: 'NGFS_P3_NATIONALLY_NDC',   name: 'Nationally Determined', category: 'Hot House World',temp: 2.5, c30: 30,  c50: 60,  gdp: -8.1,  str: 600,  tr: 3.2, pr: 6.8 },
  { id: 'NGFS_P3_CURRENT_POLICIES', name: 'Current Policies',      category: 'Hot House World',temp: 3.0, c30: 20,  c50: 25,  gdp: -10.4, str: 350,  tr: 1.5, pr: 8.9 },
  { id: 'NGFS_P3_HIGH_DEMAND',      name: 'High Demand',           category: 'Hot House World',temp: 3.2, c30: 15,  c50: 18,  gdp: -12.1, str: 280,  tr: 1.1, pr: 9.2 },
];

const BADGE = (label, color) => (
  <span style={{ fontSize: 10, fontWeight: 700, color, background: `${color}18`,
    border: `1px solid ${color}44`, borderRadius: 4, padding: '2px 6px' }}>{label}</span>
);

const MANUAL_FIELDS = [
  { key: 'scenario_id',   label: 'Scenario ID',           type: 'text',   defaultValue: 'CUSTOM_001' },
  { key: 'name',          label: 'Scenario Name',         type: 'text',   defaultValue: 'Custom Scenario' },
  { key: 'category',      label: 'Category',              type: 'select', options: ['Orderly','Disorderly','Hot House World'], defaultValue: 'Orderly' },
  { key: 'temp',          label: 'Temp 2100 (°C)',        type: 'number', defaultValue: 1.8 },
  { key: 'c30',           label: 'Carbon Price 2030 ($)', type: 'number', defaultValue: 100 },
  { key: 'c50',           label: 'Carbon Price 2050 ($)', type: 'number', defaultValue: 500 },
  { key: 'gdp',           label: 'GDP Impact 2050 (%)',   type: 'number', defaultValue: -3.5 },
  { key: 'str',           label: 'Stranded Assets ($bn)', type: 'number', defaultValue: 900 },
];

export default function NGFSScenariosPage() {
  const ctx = useTestData();
  const [scenarios, setScenarios]   = useState(BASE_SCENARIOS);
  const [catFilter, setCatFilter]   = useState('All');
  const [compareMode, setCompareMode] = useState(false);
  const [selected, setSelected]     = useState([]);
  const [inputOpen, setInputOpen]   = useState(false);
  const [bridgeData, setBridgeData] = useState(null);
  const [bridgeId, setBridgeId]     = useState(null);

  // Weights for blended scenario
  const [weights, setWeights] = useState(
    Object.fromEntries(BASE_SCENARIOS.map(s => [s.id, 0]))
  );
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  const blendedC50 = totalWeight > 0
    ? BASE_SCENARIOS.reduce((acc, s) => acc + (weights[s.id] / totalWeight) * s.c50, 0)
    : 0;
  const blendedGDP = totalWeight > 0
    ? BASE_SCENARIOS.reduce((acc, s) => acc + (weights[s.id] / totalWeight) * s.gdp, 0)
    : 0;

  useEffect(() => {
    axios.get(`${API}/api/v1/ngfs-scenarios/`)
      .then(r => { if (r.data?.scenarios?.length) setScenarios(r.data.scenarios); })
      .catch(() => {});
  }, []);

  const handleDataParsed = (rows) => {
    const normalized = rows.map(r => ({
      id: r.scenario_id || r.id || `CUSTOM_${Date.now()}`,
      name: r.name || r.scenario_name || 'Custom',
      category: r.category || 'Orderly',
      temp: Number(r.temp_2100 || r.temp || 2.0),
      c30: Number(r.carbon_2030 || r.c30 || 50),
      c50: Number(r.carbon_2050 || r.c50 || 300),
      gdp: Number(r.gdp_impact || r.gdp || -3),
      str: Number(r.stranded_bn || r.str || 800),
      tr: Number(r.trans_risk || r.tr || ((850 - Number(r.carbon_2050 || 300)) / 85).toFixed(1)),
      pr: Number(r.phys_risk || r.pr || (Number(r.temp_2100 || 2) * 2.5).toFixed(1)),
    }));
    setScenarios(prev => {
      const ids = new Set(prev.map(s => s.id));
      return [...prev, ...normalized.filter(s => !ids.has(s.id))];
    });
  };

  const selectScenario = (s) => {
    ctx.setSelectedNgfsScenario(s.id, s);
    setBridgeId(s.id);
    axios.get(`${API}/api/v1/ngfs-scenarios/${s.id}/stranded-bridge`)
      .then(r => setBridgeData(r.data))
      .catch(() => setBridgeData({ demo: true, ngfs_scenario_id: s.id, iea_scenario_key: 'NZE', message: 'Demo mode' }));
  };

  const toggleCompare = (id) => {
    setSelected(prev => prev.includes(id)
      ? prev.filter(x => x !== id)
      : prev.length < 3 ? [...prev, id] : prev
    );
  };

  const filtered = catFilter === 'All' ? scenarios : scenarios.filter(s => s.category === catFilter);
  const compareScenarios = scenarios.filter(s => selected.includes(s.id));

  const radarData = [
    { axis: 'Trans Risk', ...Object.fromEntries(scenarios.slice(0,5).map(s => [s.name.split(' ')[0], s.tr])) },
    { axis: 'Phys Risk',  ...Object.fromEntries(scenarios.slice(0,5).map(s => [s.name.split(' ')[0], s.pr])) },
    { axis: 'Stranded/100', ...Object.fromEntries(scenarios.slice(0,5).map(s => [s.name.split(' ')[0], s.str/100])) },
    { axis: 'C-Price/100', ...Object.fromEntries(scenarios.slice(0,5).map(s => [s.name.split(' ')[0], s.c50/100])) },
    { axis: 'GDP Impact', ...Object.fromEntries(scenarios.slice(0,5).map(s => [s.name.split(' ')[0], Math.abs(s.gdp)])) },
  ];
  const radarColors = [T.sage, T.navy, T.blue, T.amber, T.red];

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1320, margin: '0 auto', fontFamily: T.font, color: T.text }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: T.navy, margin: 0 }}>NGFS Scenario Browser</h1>
          <p style={{ color: T.sub, fontSize: 12, margin: '4px 0 0' }}>
            NGFS Phase 3 · 8 Scenarios · Upload custom pathways · Select → syncs to all modules · EP-D6
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {ctx.selectedNgfsScenarioId && (
            <div style={{ fontSize: 11, color: T.sage, background: '#f0fdf4', padding: '4px 10px',
              borderRadius: 6, border: '1px solid #bbf7d0', fontWeight: 600 }}>
              ✓ Active: {ctx.selectedNgfsScenarioId.replace('NGFS_P3_','').replace(/_/g,' ')}
            </div>
          )}
          <button onClick={() => setCompareMode(!compareMode)} style={{
            padding: '6px 14px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer',
            background: compareMode ? T.indigo : T.card, color: compareMode ? '#fff' : T.sub,
            border: `1px solid ${compareMode ? T.indigo : T.border}`,
          }}>⇄ Compare Mode {compareMode && `(${selected.length}/3)`}</button>
        </div>
      </div>

      {/* Regulatory Context Bar */}
      <div style={{
        background: `${T.navy}08`, border: `1px solid ${T.navy}20`,
        borderLeft: `3px solid ${T.navy}`, borderRadius: 8,
        padding: '8px 16px', marginBottom: 14,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.07em', marginRight: 4 }}>REGULATORY BASIS</span>
          {[
            { label: 'ECB SSM 2022 Climate Stress Test', color: T.red },
            { label: 'EBA Pillar 2 / CRD6 2024', color: T.amber },
            { label: 'NGFS Phase 3 Taxonomy', color: T.navy },
            { label: 'RBI Climate Risk Circular 2023', color: T.blue },
          ].map(r => (
            <span key={r.label} style={{ fontSize: 10, fontWeight: 700, color: r.color,
              background: `${r.color}12`, border: `1px solid ${r.color}30`,
              borderRadius: 4, padding: '2px 7px', whiteSpace: 'nowrap' }}>{r.label}</span>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.07em' }}>METHOD</span>
          <span style={{ fontSize: 11, color: T.navy, fontWeight: 600 }}>NGFS Phase 3 · 8-Scenario Taxonomy · IEA WEO 2023 Bridge</span>
          <span style={{ fontSize: 9, color: T.amber, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 3, padding: '1px 6px' }}>NGFS Sep-2022</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.07em' }}>PRIMARY USER</span>
          <span style={{ fontSize: 11, color: T.navy, fontWeight: 600, background: `${T.gold}22`, border: `1px solid ${T.gold}44`, borderRadius: 4, padding: '2px 8px' }}>Scenario Governance / Risk Strategy</span>
        </div>
      </div>

      {/* 3-Step Workflow Guide */}
      <div style={{
        background: 'linear-gradient(135deg, #1b3a5c 0%, #2c4f7a 100%)',
        borderRadius: 12, padding: '16px 20px', marginBottom: 20,
        border: '1px solid #244a6e',
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.gold, marginBottom: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          How to use the NGFS Scenario Browser
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
          {[
            { step: '1', icon: '🔍', title: 'Browse Pathways', desc: 'Explore 8 NGFS Phase 3 scenarios across Orderly, Disorderly, and Hot House World categories. Use filters and the Carbon Price chart to compare trajectories.' },
            { step: '2', icon: '⚡', title: 'Activate Scenario', desc: 'Click "Select →" on any row to set it as the platform-wide active scenario. This instantly syncs to Portfolio Climate VaR (updates shock multipliers) and Stranded Asset Analyzer (updates scenario toggle).' },
            { step: '3', icon: '🔀', title: 'Advanced Analysis', desc: 'Enable Compare Mode to diff up to 3 scenarios side-by-side. Use the Blended Builder to mix scenario weights and compute a probability-weighted carbon price and GDP impact.' },
          ].map(s => (
            <div key={s.step} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', background: T.gold,
                color: T.navy, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: 13, flexShrink: 0,
              }}>{s.step}</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 3 }}>{s.icon} {s.title}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Scenario Cross-Module Status */}
      {ctx.selectedNgfsScenarioId && (
        <div style={{
          background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10,
          padding: '10px 16px', marginBottom: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.sage }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: T.sage }}>
              Active Scenario: {scenarios.find(s => s.id === ctx.selectedNgfsScenarioId)?.name || ctx.selectedNgfsScenarioId.replace('NGFS_P3_','').replace(/_/g,' ')}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[
              { module: 'Portfolio Climate VaR', path: '/portfolio-climate-var', status: 'Shock multipliers updated', code: 'EP-D7' },
              { module: 'Stranded Asset Analyzer', path: '/stranded-assets', status: 'Scenario toggle synced', code: 'EP-D1' },
            ].map(m => (
              <div key={m.module} style={{
                fontSize: 10, color: T.navy, background: '#fff',
                border: '1px solid #bbf7d0', borderRadius: 6, padding: '4px 10px',
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                <span style={{ color: T.sage, fontWeight: 700 }}>✓</span>
                <span style={{ fontWeight: 600 }}>{m.module}</span>
                <span style={{ color: T.sub }}>— {m.status}</span>
                <span style={{ fontSize: 9, color: T.sage, background: '#f0fdf4', padding: '1px 5px', borderRadius: 3, fontWeight: 700 }}>{m.code}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Input Panel */}
      <DataUploadPanel
        isOpen={inputOpen}
        onToggle={() => setInputOpen(o => !o)}
        title="Custom Scenario Upload"
        manualFields={MANUAL_FIELDS}
        csvTemplate="scenario_id,name,category,temp_2100,carbon_2030,carbon_2050,gdp_impact,stranded_bn,trans_risk,phys_risk"
        onDataParsed={handleDataParsed}
      />

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Total Scenarios',  value: scenarios.length,               sub: 'NGFS Phase 3' },
          { label: 'Orderly',          value: scenarios.filter(s=>s.category==='Orderly').length, sub: 'Low-disruption transition' },
          { label: 'Disorderly',       value: scenarios.filter(s=>s.category==='Disorderly').length, sub: 'High transition risk' },
          { label: 'Hot House World',  value: scenarios.filter(s=>s.category==='Hot House World').length, sub: 'Physical risk dominant' },
          { label: 'Max C-Price 2050', value: `$${Math.max(...scenarios.map(s=>s.c50))}`, sub: 'Low Energy Demand' },
          totalWeight > 0
            ? { label: 'Blended C-Price 2050', value: `$${blendedC50.toFixed(0)}`, sub: `GDP: ${blendedGDP.toFixed(1)}%`, highlight: true }
            : { label: 'Custom Scenarios',      value: scenarios.length - 8,    sub: 'Uploaded by user' },
        ].map((k, i) => (
          <div key={i} style={{
            background: T.card, border: `1px solid ${k.highlight ? T.gold : T.border}`, borderRadius: 10,
            borderTop: `3px solid ${k.highlight ? T.gold : T.navy}`, padding: '12px 14px',
            boxShadow: '0 1px 4px rgba(27,58,92,0.06)',
          }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: T.navy }}>{k.value}</div>
            <div style={{ fontSize: 10, color: T.sub, marginTop: 3, lineHeight: 1.3 }}>{k.label}</div>
            <div style={{ fontSize: 10, color: T.sage, marginTop: 1 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 18, marginBottom: 20 }}>
        {/* Carbon Price Chart */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '16px 18px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 14 }}>Carbon Price: 2030 vs 2050 ($/tCO₂)</div>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={scenarios.map(s => ({ name: s.name.split(' ').slice(0,2).join(' '), '2030': s.c30, '2050': s.c50 }))}
              margin={{ top: 4, right: 12, bottom: 28, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 8 }} angle={-30} textAnchor="end" />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={v => [`$${v}/tCO₂`]} contentStyle={{ fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="2030" fill={T.sage}  radius={[2,2,0,0]} />
              <Bar dataKey="2050" fill={T.navy}  radius={[2,2,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Radar */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '16px 18px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Risk Profile Radar (Top 5 Scenarios)</div>
          <ResponsiveContainer width="100%" height={210}>
            <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
              <PolarGrid />
              <PolarAngleAxis dataKey="axis" tick={{ fontSize: 9 }} />
              {scenarios.slice(0,5).map((s, i) => (
                <Radar key={s.id} name={s.name.split(' ')[0]} dataKey={s.name.split(' ')[0]}
                  stroke={radarColors[i]} fill={radarColors[i]} fillOpacity={0.1} strokeWidth={1.5} />
              ))}
              <Legend wrapperStyle={{ fontSize: 9 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Blended Scenario Weights */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '16px 18px', marginBottom: 20 }}>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 4 }}>
            Blended Scenario Builder
            {totalWeight > 0 && (
              <span style={{ fontSize: 11, fontWeight: 400, color: T.sub, marginLeft: 10 }}>
                Blended C-Price 2050: <strong style={{ color: T.navy }}>${blendedC50.toFixed(0)}/tCO₂</strong>
                {' '}· GDP Impact: <strong style={{ color: T.red }}>{blendedGDP.toFixed(1)}%</strong>
                {' '}· Total weight: <strong style={{ color: totalWeight === 100 ? T.sage : T.amber }}>{totalWeight}%</strong>
                {totalWeight !== 100 && <span style={{ color: T.amber }}> (set weights to 100% for a valid blend)</span>}
              </span>
            )}
          </div>
          <div style={{ fontSize: 11, color: T.sub, lineHeight: 1.5 }}>
            Drag the sliders below to assign probability weights across scenarios (e.g. 60% Net Zero + 40% Delayed = a blended view).
            The weighted-average carbon price and GDP impact are shown above. This does NOT activate a scenario — use "Select →" in the table above for that.
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {scenarios.slice(0, 8).map(s => (
            <div key={s.id} style={{ padding: '10px 12px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.navy, marginBottom: 6 }}>{s.name}</div>
              <input type="range" min={0} max={100} step={5} value={weights[s.id] || 0}
                onChange={e => setWeights(p => ({ ...p, [s.id]: Number(e.target.value) }))}
                style={{ width: '100%', accentColor: CAT_COLOR[s.category] }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginTop: 2 }}>
                <span style={{ color: T.sub }}>{BADGE(s.category, CAT_COLOR[s.category])}</span>
                <strong style={{ color: CAT_COLOR[s.category] }}>{weights[s.id] || 0}%</strong>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter + Scenario Table */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '16px 18px', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>
            Pathway Table
            <span style={{ fontSize: 11, fontWeight: 400, color: T.sub, marginLeft: 8 }}>
              {compareMode
                ? <span style={{ color: T.indigo }}>☑ Check up to 3 rows to compare → scroll down for comparison table</span>
                : <span>Click <strong style={{ color: T.navy }}>"Select →"</strong> to activate a scenario platform-wide (syncs to Portfolio VaR + Stranded Assets)</span>
              }
            </span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['All','Orderly','Disorderly','Hot House World'].map(cat => (
              <button key={cat} onClick={() => setCatFilter(cat)} style={{
                padding: '4px 10px', borderRadius: 5, fontSize: 10, fontWeight: 600, cursor: 'pointer',
                background: catFilter === cat ? T.navy : T.card, color: catFilter === cat ? '#fff' : T.sub,
                border: `1px solid ${catFilter === cat ? T.navy : T.border}`,
              }}>{cat}</button>
            ))}
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: '#f8f7f4' }}>
              {[compareMode && '☑', 'Scenario','Category','Temp 2100','C-Price 2030','C-Price 2050','GDP Impact','Stranded $bn','T-Risk','P-Risk','Action'].filter(Boolean).map(h => (
                <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontSize: 10, fontWeight: 600,
                  color: T.sub, borderBottom: `1px solid ${T.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((s, i) => {
              const isActive = ctx.selectedNgfsScenarioId === s.id;
              const isChecked = selected.includes(s.id);
              return (
                <tr key={s.id} style={{
                  background: isActive ? '#f0f9ff' : isChecked ? '#f5f3ff' : i % 2 === 0 ? '#fff' : '#fafaf8',
                  borderBottom: `1px solid ${T.border}`,
                  outline: isActive ? `2px solid ${T.blue}` : isChecked ? `1px solid ${T.indigo}` : 'none',
                }}>
                  {compareMode && (
                    <td style={{ padding: '7px 10px' }}>
                      <input type="checkbox" checked={isChecked} onChange={() => toggleCompare(s.id)} />
                    </td>
                  )}
                  <td style={{ padding: '7px 10px', fontWeight: 600, color: T.navy }}>{s.name}</td>
                  <td style={{ padding: '7px 10px' }}>{BADGE(s.category, CAT_COLOR[s.category])}</td>
                  <td style={{ padding: '7px 10px', fontWeight: 700, color: s.temp >= 3 ? T.red : s.temp >= 2 ? T.amber : T.sage }}>{s.temp}°C</td>
                  <td style={{ padding: '7px 10px', color: T.text }}>${s.c30}</td>
                  <td style={{ padding: '7px 10px', fontWeight: 600, color: T.text }}>${s.c50}</td>
                  <td style={{ padding: '7px 10px', color: T.red }}>{s.gdp}%</td>
                  <td style={{ padding: '7px 10px', fontWeight: 700, color: T.text }}>${s.str}bn</td>
                  <td style={{ padding: '7px 10px', fontWeight: 700, color: s.tr >= 8 ? T.red : T.amber }}>{s.tr}</td>
                  <td style={{ padding: '7px 10px', fontWeight: 700, color: s.pr >= 7 ? T.red : T.sub }}>{s.pr}</td>
                  <td style={{ padding: '7px 10px' }}>
                    <button onClick={() => selectScenario(s)} style={{
                      fontSize: 10, padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontWeight: 700,
                      background: isActive ? T.sage : T.navy, color: '#fff', border: 'none',
                    }}>{isActive ? '✓ Active' : 'Select →'}</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Comparison Panel */}
      {compareMode && compareScenarios.length >= 2 && (
        <div style={{ background: T.card, border: `1px solid ${T.indigo}`, borderRadius: 12, padding: '16px 18px', marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.indigo, marginBottom: 12 }}>Scenario Comparison</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#f5f3ff' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: T.sub, borderBottom: `1px solid ${T.border}` }}>Metric</th>
                {compareScenarios.map(s => (
                  <th key={s.id} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.indigo, borderBottom: `1px solid ${T.border}` }}>{s.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['Category',         s => s.category],
                ['Temperature 2100', s => `${s.temp}°C`],
                ['Carbon Price 2030',s => `$${s.c30}/tCO₂`],
                ['Carbon Price 2050',s => `$${s.c50}/tCO₂`],
                ['GDP Impact 2050',  s => `${s.gdp}%`],
                ['Stranded Assets',  s => `$${s.str}bn`],
                ['Transition Risk',  s => `${s.tr}/10`],
                ['Physical Risk',    s => `${s.pr}/10`],
              ].map(([label, fn]) => (
                <tr key={label} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '7px 12px', fontWeight: 600, color: T.sub, fontSize: 11 }}>{label}</td>
                  {compareScenarios.map(s => (
                    <td key={s.id} style={{ padding: '7px 12px', color: T.navy }}>{fn(s)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Bridge Panel */}
      {bridgeData && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>
              Stranded Asset Bridge Mapping
              <span style={{ fontSize: 11, fontWeight: 400, color: T.sub, marginLeft: 8 }}>
                How the NGFS scenario maps to IEA WEO pathways used in the Stranded Asset Analyzer
              </span>
            </div>
            {bridgeData.demo && BADGE('Demo Mode', T.amber)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
            {[
              { label: 'NGFS Scenario ID',   value: bridgeData.ngfs_scenario_id || bridgeId,     color: T.indigo },
              { label: 'IEA Scenario Key',   value: bridgeData.iea_scenario_key || 'NZE',         color: T.navy  },
              { label: 'Carbon Budget',       value: bridgeData.carbon_budget_gt ? `${bridgeData.carbon_budget_gt} GtCO₂` : '—', color: T.red },
              { label: 'Phase-Out Override',  value: bridgeData.phase_out_year || '—',             color: T.amber },
              { label: 'Stranded Fraction',   value: bridgeData.stranded_fraction ? `${(bridgeData.stranded_fraction*100).toFixed(0)}%` : '—', color: T.sage },
              { label: 'Bridge Version',      value: bridgeData.version || 'NGFS P3 / IEA WEO 2023', color: T.sub },
            ].map(f => (
              <div key={f.label} style={{
                padding: '10px 12px', background: T.bg, borderRadius: 8,
                border: `1px solid ${T.border}`,
              }}>
                <div style={{ fontSize: 10, color: T.sub, marginBottom: 3, fontWeight: 600 }}>{f.label}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: f.color }}>{f.value}</div>
              </div>
            ))}
          </div>
          {bridgeData.message && (
            <div style={{ marginTop: 10, fontSize: 11, color: T.sub, background: '#fffbeb',
              border: '1px solid #fde68a', borderRadius: 6, padding: '6px 10px' }}>
              ℹ {bridgeData.message}
            </div>
          )}
        </div>
      )}

      <div style={{ fontSize: 11, color: T.sub, marginTop: 12, borderTop: `1px solid ${T.border}`, paddingTop: 8 }}>
        NGFS Phase 3 · dme_ngfs_scenario_pathways · 8 base scenarios + custom uploads · Selecting syncs to Portfolio VaR & Stranded Assets · EP-D6
      </div>
    </div>
  );
}
