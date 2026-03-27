import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell, LineChart, Line, AreaChart, Area, Legend,
} from 'recharts';
import { NGFS_PHASE4, SECTOR_PD_UPLIFT, SECTOR_LGD_UPLIFT } from '../../../services/climateRiskDataService';

// ─── Theme ───────────────────────────────────────────────────────────────────
const T = {
  bg:'#0f172a', surface:'#1e293b', border:'#334155', navy:'#1e3a5f',
  gold:'#f59e0b', sage:'#10b981', text:'#f1f5f9', textSec:'#94a3b8',
  textMut:'#64748b', red:'#ef4444', green:'#10b981', amber:'#f59e0b',
  teal:'#14b8a6', font:"'Inter',sans-serif",
};
const ACCENT = '#ef4444';

// ─── Seeded random ────────────────────────────────────────────────────────────
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

// ─── NGFS Phase IV scenarios (aligned to data service) ───────────────────────
const SCENARIOS = [
  { id:'nz2050', name:'Net Zero 2050',        category:'Orderly',    color:'#10b981',
    temp:1.5,  carbon2030:130, carbon2050:450, gdp:-1.1, physRisk:2.8, transRisk:8.2,
    compoundFactor:0.04, urgency:1.0 },
  { id:'b2c',   name:'Below 2°C',             category:'Orderly',    color:'#3b82f6',
    temp:1.8,  carbon2030:95,  carbon2050:340, gdp:-1.5, physRisk:3.9, transRisk:6.8,
    compoundFactor:0.035, urgency:0.85 },
  { id:'dnz',   name:'Divergent Net Zero',    category:'Disorderly', color:'#ec4899',
    temp:1.5,  carbon2030:120, carbon2050:380, gdp:-3.2, physRisk:5.2, transRisk:9.1,
    compoundFactor:0.06, urgency:1.3 },
  { id:'dt',    name:'Delayed Transition',    category:'Disorderly', color:'#f97316',
    temp:1.8,  carbon2030:60,  carbon2050:430, gdp:-2.8, physRisk:4.6, transRisk:9.8,
    compoundFactor:0.08, urgency:1.6 },
  { id:'ndc',   name:'Nationally Determined', category:'Hot House',  color:'#a78bfa',
    temp:2.5,  carbon2030:45,  carbon2050:190, gdp:-5.5, physRisk:7.4, transRisk:5.2,
    compoundFactor:0.07, urgency:1.2 },
  { id:'cp',    name:'Current Policies',      category:'Hot House',  color:'#ef4444',
    temp:3.0,  carbon2030:30,  carbon2050:120, gdp:-8.1, physRisk:9.5, transRisk:3.1,
    compoundFactor:0.09, urgency:0.7 },
];

// ─── Sector equity shocks (NGFS Phase IV calibrated) ─────────────────────────
const SECTOR_EQUITY_SHOCKS = {
  'Mining & Coal Extraction':   { nz2050:-62, b2c:-48, dnz:-68, dt:-78, ndc:-28, cp:-12 },
  'Oil & Gas Extraction':       { nz2050:-48, b2c:-36, dnz:-55, dt:-72, ndc:-22, cp:-8  },
  'Electricity Generation':     { nz2050:-18, b2c:-12, dnz:-22, dt:-45, ndc:-14, cp:-8  },
  'Steel & Primary Metals':     { nz2050:-28, b2c:-20, dnz:-32, dt:-52, ndc:-18, cp:-10 },
  'Cement & Construction Mats': { nz2050:-24, b2c:-18, dnz:-28, dt:-48, ndc:-16, cp:-9  },
  'Chemicals & Petrochemicals': { nz2050:-20, b2c:-14, dnz:-24, dt:-40, ndc:-14, cp:-7  },
  'Automotive Manufacturing':   { nz2050:-12, b2c:-8,  dnz:-16, dt:-28, ndc:-10, cp:-5  },
  'Renewables & Clean Energy':  { nz2050:+45, b2c:+32, dnz:+38, dt:+18, ndc:+8,  cp:+4  },
  'Real Estate (Commercial)':   { nz2050:-16, b2c:-12, dnz:-18, dt:-38, ndc:-28, cp:-40 },
  'Banking & Insurance':        { nz2050:-8,  b2c:-6,  dnz:-10, dt:-22, ndc:-14, cp:-18 },
  'ICT & Technology':           { nz2050:+8,  b2c:+6,  dnz:+5,  dt:-4,  ndc:-3,  cp:-5  },
  'Agriculture & Food':         { nz2050:-10, b2c:-8,  dnz:-12, dt:-20, ndc:-22, cp:-32 },
};

// ─── Portfolio holdings ───────────────────────────────────────────────────────
const HOLDINGS = [
  { name:'Reliance',         sector:'Chemicals & Petrochemicals', weight:0.12, marketCap:220 },
  { name:'Coal India',       sector:'Mining & Coal Extraction',   weight:0.08, marketCap:95  },
  { name:'NTPC',             sector:'Electricity Generation',     weight:0.10, marketCap:130 },
  { name:'Adani Green',      sector:'Renewables & Clean Energy',  weight:0.07, marketCap:80  },
  { name:'JSW Steel',        sector:'Steel & Primary Metals',     weight:0.09, marketCap:110 },
  { name:'L&T',              sector:'Cement & Construction Mats', weight:0.08, marketCap:105 },
  { name:'Rio Tinto',        sector:'Mining & Coal Extraction',   weight:0.10, marketCap:180 },
  { name:'Shell',            sector:'Oil & Gas Extraction',       weight:0.12, marketCap:250 },
  { name:'Siemens Energy',   sector:'Renewables & Clean Energy',  weight:0.06, marketCap:70  },
  { name:'ArcelorMittal',    sector:'Steel & Primary Metals',     weight:0.08, marketCap:100 },
  { name:'EDF',              sector:'Electricity Generation',     weight:0.06, marketCap:90  },
  { name:'Tata Motors',      sector:'Automotive Manufacturing',   weight:0.04, marketCap:55  },
];

const TOTAL_PORTFOLIO = HOLDINGS.reduce((s, h) => s + h.marketCap * h.weight, 0);

// ─── Credit sector mapping ────────────────────────────────────────────────────
const CREDIT_SECTORS = SECTOR_PD_UPLIFT.map((pd, i) => ({
  ...pd,
  lgd: SECTOR_LGD_UPLIFT[i],
  exposure: +(sr(i * 7) * 100 + 50).toFixed(1),
}));

// ─── Transmission channels ────────────────────────────────────────────────────
const CHANNELS = [
  { id:'carbon',   label:'Carbon Price',       color:'#f59e0b',
    desc:'Rising carbon costs compress margins for high-emission corporates, reducing cash flow and creditworthiness.',
    affected:'Oil & Gas, Coal, Cement, Steel', leadTime:'2025–2030', base:28 },
  { id:'stranded', label:'Stranded Assets',    color:'#ef4444',
    desc:'Fossil fuel reserves and infrastructure become uneconomical; balance sheet impairments accelerate.',
    affected:'Coal, Oil & Gas, Utilities (Fossil)', leadTime:'2028–2035', base:22 },
  { id:'physical', label:'Physical Damage',    color:'#14b8a6',
    desc:'Direct asset damage from extreme weather and chronic physical risks disrupt operations.',
    affected:'Agriculture, Real Estate, Insurance', leadTime:'2030–2050', base:18 },
  { id:'macro',    label:'Macro/GDP',          color:'#a78bfa',
    desc:'Second-order demand destruction as climate shocks reduce household and government spending.',
    affected:'Broad economy', leadTime:'2035–2050', base:20 },
  { id:'contagion',label:'Financial Contagion',color:'#ec4899',
    desc:'Credit tightening and equity correlation spikes amplify losses across the financial system.',
    affected:'Banking, Insurance, Financials', leadTime:'2030–2045', base:12 },
];

const CHANNEL_SCENARIO_MULTIPLIERS = {
  nz2050:{ carbon:1.4, stranded:0.6, physical:0.4, macro:0.5, contagion:0.6 },
  b2c:   { carbon:1.1, stranded:0.7, physical:0.6, macro:0.7, contagion:0.7 },
  dnz:   { carbon:1.3, stranded:1.0, physical:0.7, macro:0.9, contagion:1.1 },
  dt:    { carbon:1.0, stranded:1.2, physical:0.8, macro:1.1, contagion:1.3 },
  ndc:   { carbon:0.7, stranded:0.9, physical:1.3, macro:1.3, contagion:1.0 },
  cp:    { carbon:0.4, stranded:0.8, physical:1.8, macro:1.6, contagion:1.2 },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (v, d = 1) => v == null ? '—' : v.toFixed(d);
const fmtB = v => `$${Math.abs(v).toFixed(1)}B`;
const fmtM = v => `$${Math.abs(v).toFixed(0)}M`;

function Card({ children, style }) {
  return (
    <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8,
      padding:'16px 20px', ...style }}>
      {children}
    </div>
  );
}

function StatCard({ label, value, sub, color }) {
  return (
    <Card style={{ flex:1, minWidth:160 }}>
      <div style={{ color:T.textMut, fontSize:11, marginBottom:4 }}>{label}</div>
      <div style={{ color: color || T.text, fontSize:22, fontWeight:700 }}>{value}</div>
      {sub && <div style={{ color:T.textSec, fontSize:11, marginTop:3 }}>{sub}</div>}
    </Card>
  );
}

function SectionTitle({ children }) {
  return <div style={{ color:T.text, fontWeight:700, fontSize:15, marginBottom:12,
    borderLeft:`3px solid ${ACCENT}`, paddingLeft:10 }}>{children}</div>;
}

function Badge({ label, color }) {
  return (
    <span style={{ background: color + '22', color, border:`1px solid ${color}66`,
      borderRadius:4, padding:'2px 8px', fontSize:11, fontWeight:600 }}>
      {label}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ScenarioStressTestPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [selected, setSelected] = useState(['nz2050', 'dt', 'cp']);

  const tabs = [
    'Scenario Selector', 'Equity Stress', 'Credit Channel',
    'Scenario Timeline', 'Expected Shortfall', 'Transmission Channels',
  ];

  const toggleScenario = id => {
    setSelected(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const selScenarios = SCENARIOS.filter(s => selected.includes(s.id));

  // ─── Tab 1 helpers ────────────────────────────────────────────────────────
  const gdpChartData = SCENARIOS.map(s => ({
    name: s.name.replace('Nationally Determined','NDC').replace('Current Policies','Curr. Pol.'),
    gdp: s.gdp, color: s.gdp < -3 ? T.red : s.gdp < -1 ? T.amber : T.green,
  }));

  // ─── Tab 2 helpers ────────────────────────────────────────────────────────
  const equityData = HOLDINGS.map(h => {
    const row = { name: h.name };
    selScenarios.forEach(sc => {
      const shock = SECTOR_EQUITY_SHOCKS[h.sector]?.[sc.id] ?? 0;
      row[sc.id] = +(h.marketCap * h.weight * shock / 100).toFixed(1);
    });
    return row;
  });

  const portfolioEqLoss = selScenarios.map(sc => {
    const total = HOLDINGS.reduce((sum, h) => {
      const shock = SECTOR_EQUITY_SHOCKS[h.sector]?.[sc.id] ?? 0;
      return sum + h.marketCap * h.weight * shock / 100;
    }, 0);
    return { name: sc.name, loss: +total.toFixed(1), color: sc.color };
  });

  // ─── Tab 3 helpers ────────────────────────────────────────────────────────
  const firstSel = selScenarios[0] || SCENARIOS[0];
  const creditRows = CREDIT_SECTORS.map((cs, i) => {
    const scId = firstSel.id;
    const pdBase = 50; const lgdBase = 40;
    const baseEL = +(pdBase * lgdBase / 10000 * cs.exposure * 10).toFixed(1);
    const stressEL = +((pdBase + cs[scId]) * (lgdBase + cs.lgd[scId]) / 10000 * cs.exposure * 10).toFixed(1);
    const uplift = +(stressEL - baseEL).toFixed(1);
    const pct = baseEL > 0 ? +((uplift / baseEL) * 100).toFixed(0) : 0;
    return { sector: cs.sector, baseEL, stressEL, uplift, pct,
      flag: uplift > 500 ? 'HIGH' : uplift > 200 ? 'MED' : uplift < 0 ? 'IMPR' : 'LOW',
      color: uplift > 500 ? T.red : uplift > 200 ? T.amber : uplift < 0 ? T.green : T.textSec };
  });

  const totalCreditUplift = creditRows.reduce((s, r) => s + r.uplift, 0);
  const maxCreditSector = creditRows.reduce((m, r) => r.uplift > m.uplift ? r : m, creditRows[0]);
  const improvedSectors = creditRows.filter(r => r.uplift < 0).length;

  const waterfall = selScenarios.map(sc => {
    const eq = HOLDINGS.reduce((sum, h) => {
      const shock = SECTOR_EQUITY_SHOCKS[h.sector]?.[sc.id] ?? 0;
      return sum + h.marketCap * h.weight * shock / 100;
    }, 0);
    const cr = CREDIT_SECTORS.reduce((sum, cs, i) => {
      const pdBase = 50; const lgdBase = 40;
      return sum + ((pdBase + cs[sc.id]) * (lgdBase + cs.lgd[sc.id]) / 10000
        - pdBase * lgdBase / 10000) * cs.exposure * 10;
    }, 0);
    return { name: sc.name, equity: +eq.toFixed(1), credit: +cr.toFixed(1),
      total: +(eq + cr).toFixed(1), color: sc.color };
  });

  // ─── Tab 4 helpers ────────────────────────────────────────────────────────
  const YEARS = [2025, 2030, 2035, 2040, 2045, 2050];
  const baseLoss = HOLDINGS.reduce((sum, h) =>
    sum + h.marketCap * h.weight * Math.abs(SECTOR_EQUITY_SHOCKS[h.sector]?.nz2050 ?? 0) / 100, 0);

  const timelineData = YEARS.map(yr => {
    const row = { year: String(yr) };
    selScenarios.forEach(sc => {
      const offset = (yr - 2025) / 25;
      let shock = SECTOR_EQUITY_SHOCKS;
      const scenarioBase = HOLDINGS.reduce((sum, h) => {
        const s = SECTOR_EQUITY_SHOCKS[h.sector]?.[sc.id] ?? 0;
        return sum + h.marketCap * h.weight * Math.abs(s) / 100;
      }, 0);
      row[sc.id] = +(scenarioBase * (1 + sc.compoundFactor * 25 * offset)).toFixed(1);
    });
    return row;
  });

  const carbonChartData = YEARS.map(yr => {
    const row = { year: String(yr) };
    selScenarios.forEach(sc => {
      const paths = { nz2050:{2025:55,2030:130,2035:200,2040:280,2045:360,2050:450},
        b2c:{2025:40,2030:95,2035:150,2040:210,2045:270,2050:340},
        dt:{2025:25,2030:60,2035:140,2040:230,2045:330,2050:430},
        dnz:{2025:50,2030:120,2035:180,2040:240,2045:300,2050:380},
        ndc:{2025:20,2030:45,2035:75,2040:110,2045:150,2050:190},
        cp:{2025:15,2030:30,2035:50,2040:70,2045:95,2050:120} };
      row[sc.id] = paths[sc.id]?.[yr] ?? 0;
    });
    return row;
  });

  const worstSc = selScenarios.reduce((m, sc) => {
    const last = timelineData[timelineData.length - 1][sc.id] || 0;
    return last > (timelineData[timelineData.length - 1][m?.id] || 0) ? sc : m;
  }, selScenarios[0]);
  const cumulative = worstSc ? YEARS.reduce((s, yr, i) =>
    s + (timelineData[i][worstSc.id] || 0), 0) : 0;

  // ─── Tab 5 helpers ────────────────────────────────────────────────────────
  const esData = SCENARIOS.map((sc, i) => {
    const baseL = HOLDINGS.reduce((sum, h) => {
      const s = SECTOR_EQUITY_SHOCKS[h.sector]?.[sc.id] ?? 0;
      return sum + Math.abs(h.marketCap * h.weight * s / 100);
    }, 0);
    return {
      name: sc.name.split(' ').slice(0,2).join(' '),
      color: sc.color,
      var95: +(baseL * 0.72).toFixed(1),
      var99: +(baseL * 0.88).toFixed(1),
      es975: +(baseL * 1.0).toFixed(1),
    };
  });

  const selES = esData.find(e => e.name === firstSel.name.split(' ').slice(0,2).join(' ')) || esData[0];
  const maxES = esData.reduce((m, e) => e.es975 > m.es975 ? e : m, esData[0]);
  const avgVar99 = esData.reduce((s, e) => s + e.var99, 0) / esData.length;
  const esVarRatio = +(maxES.es975 / maxES.var99).toFixed(2);

  const tailDecomp = [
    { name:'Equity Repricing', value:42, color:'#ef4444' },
    { name:'Credit Migration', value:28, color:'#f59e0b' },
    { name:'Physical Damage',  value:18, color:'#14b8a6' },
    { name:'Macro Contagion',  value:12, color:'#a78bfa' },
  ];

  const top3Holdings = HOLDINGS.slice(0, 3).map(h => ({
    name: h.name,
    share: +((h.marketCap * h.weight / TOTAL_PORTFOLIO) * 100).toFixed(0),
  }));
  const top3Concentration = top3Holdings.reduce((s, h) => s + h.share, 0);

  // ─── Tab 6 helpers ────────────────────────────────────────────────────────
  const channelContrib = (scId) => {
    const mults = CHANNEL_SCENARIO_MULTIPLIERS[scId] || {};
    const raw = CHANNELS.map(ch => ({ ...ch, mag: ch.base * (mults[ch.id] || 1) }));
    const total = raw.reduce((s, c) => s + c.mag, 0);
    return raw.map(c => ({ ...c, pct: +((c.mag / total) * 100).toFixed(1) }));
  };

  const stackedData = selScenarios.map(sc => {
    const contrib = channelContrib(sc.id);
    const row = { name: sc.name.split(' ').slice(0,2).join(' ') };
    contrib.forEach(c => { row[c.id] = c.pct; });
    return row;
  });

  const top2ChannelData = SCENARIOS.map(sc => {
    const mults = CHANNEL_SCENARIO_MULTIPLIERS[sc.id] || {};
    return {
      name: sc.name.split(' ').slice(0,2).join(' '),
      carbon: +(CHANNELS[0].base * (mults.carbon || 1)).toFixed(1),
      stranded: +(CHANNELS[1].base * (mults.stranded || 1)).toFixed(1),
      color: sc.color,
    };
  });

  // ─── Shared tooltip style ─────────────────────────────────────────────────
  const tooltipStyle = {
    contentStyle:{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:6,
      color:T.text, fontSize:12 },
    labelStyle:{ color:T.textSec },
  };

  return (
    <div style={{ background:T.bg, minHeight:'100vh', fontFamily:T.font, color:T.text, padding:'24px 32px' }}>
      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:6 }}>
          <div style={{ width:4, height:32, background:ACCENT, borderRadius:2 }} />
          <div>
            <h1 style={{ margin:0, fontSize:24, fontWeight:800 }}>Scenario Stress Test</h1>
            <div style={{ color:T.textSec, fontSize:13, marginTop:2 }}>
              NGFS Phase IV · Credit Channel · Expected Shortfall · EBA Benchmark
            </div>
          </div>
          <Badge label="NGFS Phase IV" color={T.teal} />
          <Badge label="ES 97.5%" color={T.amber} />
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display:'flex', gap:4, marginBottom:24, borderBottom:`1px solid ${T.border}`,
        paddingBottom:0, flexWrap:'wrap' }}>
        {tabs.map((t, i) => (
          <button key={i} onClick={() => setActiveTab(i)} style={{
            background: activeTab === i ? ACCENT : 'transparent',
            color: activeTab === i ? '#fff' : T.textSec,
            border: 'none', padding:'8px 16px', borderRadius:'6px 6px 0 0',
            cursor:'pointer', fontSize:13, fontWeight: activeTab === i ? 700 : 400,
            transition:'all 0.15s',
          }}>{t}</button>
        ))}
      </div>

      {/* ── TAB 1: Scenario Selector ─────────────────────────────────────────── */}
      {activeTab === 0 && (
        <div>
          <SectionTitle>Select Up to 3 NGFS Phase IV Scenarios</SectionTitle>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:24 }}>
            {SCENARIOS.map(sc => {
              const isSel = selected.includes(sc.id);
              return (
                <div key={sc.id} onClick={() => toggleScenario(sc.id)} style={{
                  background: isSel ? sc.color + '22' : T.surface,
                  border: `2px solid ${isSel ? sc.color : T.border}`,
                  borderRadius:10, padding:16, cursor:'pointer', transition:'all 0.15s',
                }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                    <div style={{ fontWeight:700, fontSize:14, color: isSel ? sc.color : T.text }}>{sc.name}</div>
                    <input type="checkbox" checked={isSel} readOnly style={{ accentColor: sc.color, width:16, height:16 }} />
                  </div>
                  <Badge label={sc.category} color={sc.color} />
                  <div style={{ marginTop:10, display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                    {[
                      ['Temp', `${sc.temp}°C`],
                      ['GDP 2050', `${sc.gdp}%`],
                      ['Carbon 2030', `$${sc.carbon2030}/t`],
                      ['Carbon 2050', `$${sc.carbon2050}/t`],
                      ['Physical Risk', `${sc.physRisk}/10`],
                      ['Trans. Risk', `${sc.transRisk}/10`],
                    ].map(([k, v]) => (
                      <div key={k} style={{ background:T.bg, borderRadius:4, padding:'4px 8px' }}>
                        <div style={{ color:T.textMut, fontSize:10 }}>{k}</div>
                        <div style={{ color:T.text, fontSize:13, fontWeight:600 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <SectionTitle>GDP Impact 2050 — All Scenarios</SectionTitle>
          <Card style={{ marginBottom:24 }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={gdpChartData} margin={{ top:5, right:20, bottom:5, left:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fill:T.textSec, fontSize:11 }} />
                <YAxis tick={{ fill:T.textSec, fontSize:11 }} unit="%" />
                <Tooltip {...tooltipStyle} formatter={v => [`${v}%`, 'GDP Impact']} />
                <Bar dataKey="gdp" radius={[4,4,0,0]}>
                  {gdpChartData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <div style={{ display:'flex', gap:12 }}>
            <StatCard label="GDP Loss Range (all scenarios)"
              value={`${Math.min(...SCENARIOS.map(s=>s.gdp))}% to ${Math.max(...SCENARIOS.map(s=>s.gdp))}%`}
              sub="2050 GDP impact"  color={T.amber} />
            <StatCard label="Worst Physical Risk"
              value={SCENARIOS.reduce((m,s)=>s.physRisk>m.physRisk?s:m,SCENARIOS[0]).name.split(' ').slice(0,2).join(' ')}
              sub={`Score: ${Math.max(...SCENARIOS.map(s=>s.physRisk))}/10`} color={T.red} />
            <StatCard label="Worst Transition Risk"
              value={SCENARIOS.reduce((m,s)=>s.transRisk>m.transRisk?s:m,SCENARIOS[0]).name.split(' ').slice(0,2).join(' ')}
              sub={`Score: ${Math.max(...SCENARIOS.map(s=>s.transRisk))}/10`} color={T.amber} />
          </div>
        </div>
      )}

      {/* ── TAB 2: Equity Stress Results ──────────────────────────────────────── */}
      {activeTab === 1 && (
        <div>
          <SectionTitle>Equity Loss by Holding — Selected Scenarios</SectionTitle>
          <Card style={{ marginBottom:20, overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr style={{ borderBottom:`1px solid ${T.border}` }}>
                  <th style={{ textAlign:'left', color:T.textSec, padding:'6px 10px', fontWeight:600 }}>Holding</th>
                  <th style={{ textAlign:'left', color:T.textSec, padding:'6px 10px', fontWeight:600 }}>Sector</th>
                  <th style={{ textAlign:'right', color:T.textSec, padding:'6px 10px', fontWeight:600 }}>Wt</th>
                  {selScenarios.map(sc => (
                    <th key={sc.id} style={{ textAlign:'right', color:sc.color, padding:'6px 10px', fontWeight:700 }}>
                      {sc.name.split(' ').slice(0,2).join(' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {equityData.map((row, i) => (
                  <tr key={i} style={{ borderBottom:`1px solid ${T.border}33` }}>
                    <td style={{ padding:'6px 10px', fontWeight:600 }}>{row.name}</td>
                    <td style={{ padding:'6px 10px', color:T.textSec, fontSize:11 }}>{HOLDINGS[i].sector}</td>
                    <td style={{ padding:'6px 10px', textAlign:'right', color:T.textSec }}>{(HOLDINGS[i].weight*100).toFixed(0)}%</td>
                    {selScenarios.map(sc => {
                      const v = row[sc.id] || 0;
                      const c = v < -5 ? T.red : v < 0 ? T.amber : T.green;
                      return <td key={sc.id} style={{ padding:'6px 10px', textAlign:'right', color:c, fontWeight:600 }}>
                        {v > 0 ? '+' : ''}{fmtM(Math.abs(v))} {v < 0 ? '▼' : '▲'}
                      </td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <SectionTitle>Total Portfolio Equity Loss per Scenario</SectionTitle>
          <Card style={{ marginBottom:20 }}>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={portfolioEqLoss} margin={{ top:5, right:20, bottom:5, left:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fill:T.textSec, fontSize:11 }} />
                <YAxis tick={{ fill:T.textSec, fontSize:11 }} unit="$B" />
                <Tooltip {...tooltipStyle} formatter={v => [`$${Math.abs(v).toFixed(1)}B`, 'Equity Loss']} />
                <Bar dataKey="loss" radius={[4,4,0,0]}>
                  {portfolioEqLoss.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <div style={{ display:'flex', gap:12 }}>
            <StatCard label="Worst Scenario Equity Loss"
              value={fmtB(Math.min(...portfolioEqLoss.map(s=>s.loss)))}
              sub={portfolioEqLoss.reduce((m,s)=>s.loss<m.loss?s:m,portfolioEqLoss[0])?.name}
              color={T.red} />
            <StatCard label="Best Selected Scenario"
              value={fmtB(Math.max(...portfolioEqLoss.map(s=>s.loss)))}
              sub={portfolioEqLoss.reduce((m,s)=>s.loss>m.loss?s:m,portfolioEqLoss[0])?.name}
              color={T.green} />
            <StatCard label="Holdings in Loss (worst sc.)"
              value={equityData.filter(r => (r[selScenarios[0]?.id]||0) < 0).length}
              sub="of 12 holdings" color={T.amber} />
          </div>
        </div>
      )}

      {/* ── TAB 3: Credit Channel Stress ──────────────────────────────────────── */}
      {activeTab === 2 && (
        <div>
          <SectionTitle>Credit EL Stress — Scenario: {firstSel.name}</SectionTitle>
          <Card style={{ marginBottom:20, overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr style={{ borderBottom:`1px solid ${T.border}` }}>
                  {['Sector','Exposure ($B)','Base EL ($M)','Stressed EL ($M)','Uplift ($M)','% Inc','Flag'].map(h => (
                    <th key={h} style={{ textAlign:'left', color:T.textSec, padding:'6px 10px', fontWeight:600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {creditRows.map((r, i) => (
                  <tr key={i} style={{ borderBottom:`1px solid ${T.border}33` }}>
                    <td style={{ padding:'6px 10px', fontWeight:600 }}>{r.sector}</td>
                    <td style={{ padding:'6px 10px', color:T.textSec }}>${CREDIT_SECTORS[i].exposure}B</td>
                    <td style={{ padding:'6px 10px', color:T.textSec }}>${r.baseEL.toFixed(0)}M</td>
                    <td style={{ padding:'6px 10px', color:r.color }}>${r.stressEL.toFixed(0)}M</td>
                    <td style={{ padding:'6px 10px', color:r.color, fontWeight:700 }}>
                      {r.uplift > 0 ? '+' : ''}{r.uplift.toFixed(0)}M
                    </td>
                    <td style={{ padding:'6px 10px', color:r.color }}>{r.pct > 0 ? '+' : ''}{r.pct}%</td>
                    <td style={{ padding:'6px 10px' }}><Badge label={r.flag} color={r.color} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <SectionTitle>EL Uplift by Sector</SectionTitle>
          <Card style={{ marginBottom:20 }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={creditRows.map(r=>({name:r.sector.split(' ')[0],uplift:r.uplift,color:r.color}))}
                margin={{ top:5, right:20, bottom:5, left:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fill:T.textSec, fontSize:10 }} />
                <YAxis tick={{ fill:T.textSec, fontSize:11 }} unit="$M" />
                <Tooltip {...tooltipStyle} formatter={v => [`$${v.toFixed(0)}M`, 'EL Uplift']} />
                <Bar dataKey="uplift" radius={[4,4,0,0]}>
                  {creditRows.map((r, i) => <Cell key={i} fill={r.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <SectionTitle>Combined Equity + Credit Loss Waterfall</SectionTitle>
          <Card style={{ marginBottom:20 }}>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={waterfall} margin={{ top:5, right:20, bottom:5, left:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fill:T.textSec, fontSize:11 }} />
                <YAxis tick={{ fill:T.textSec, fontSize:11 }} unit="$B" />
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ color:T.textSec, fontSize:11 }} />
                <Bar dataKey="equity" name="Equity Loss ($B)" fill={T.red} radius={[2,2,0,0]} />
                <Bar dataKey="credit" name="Credit EL Uplift ($B)" fill={T.amber} radius={[2,2,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <div style={{ display:'flex', gap:12 }}>
            <StatCard label="Total Credit EL Uplift" value={`$${Math.abs(totalCreditUplift).toFixed(0)}M`}
              sub={`Scenario: ${firstSel.name}`} color={T.red} />
            <StatCard label="Max Sector Credit Hit" value={maxCreditSector?.sector?.split(' ')[0]}
              sub={`+$${maxCreditSector?.uplift?.toFixed(0)}M uplift`} color={T.amber} />
            <StatCard label="Sectors with Improved EL" value={improvedSectors}
              sub="Renewables / Technology" color={T.green} />
          </div>
        </div>
      )}

      {/* ── TAB 4: Scenario Timeline ──────────────────────────────────────────── */}
      {activeTab === 3 && (
        <div>
          <SectionTitle>Portfolio Loss Trajectory 2025–2050</SectionTitle>
          <Card style={{ marginBottom:20 }}>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={timelineData} margin={{ top:5, right:20, bottom:5, left:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fill:T.textSec, fontSize:12 }} />
                <YAxis tick={{ fill:T.textSec, fontSize:11 }} unit="$B" />
                <Tooltip {...tooltipStyle} formatter={v => [`$${v.toFixed(1)}B`, '']} />
                <Legend wrapperStyle={{ color:T.textSec, fontSize:11 }} />
                {selScenarios.map(sc => (
                  <Line key={sc.id} type="monotone" dataKey={sc.id} name={sc.name}
                    stroke={sc.color} strokeWidth={2.5} dot={{ r:4, fill:sc.color }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <SectionTitle>Carbon Price Path — Selected Scenarios</SectionTitle>
          <Card style={{ marginBottom:20 }}>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={carbonChartData} margin={{ top:5, right:20, bottom:5, left:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fill:T.textSec, fontSize:12 }} />
                <YAxis tick={{ fill:T.textSec, fontSize:11 }} unit="$/t" />
                <Tooltip {...tooltipStyle} formatter={v => [`$${v}/t CO₂`, 'Carbon Price']} />
                <Legend wrapperStyle={{ color:T.textSec, fontSize:11 }} />
                {selScenarios.map(sc => (
                  <Area key={sc.id} type="monotone" dataKey={sc.id} name={sc.name}
                    stroke={sc.color} fill={sc.color + '22'} strokeWidth={2} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          <div style={{ display:'flex', gap:12 }}>
            <StatCard label="Cumulative Loss 2025–2050 (worst)"
              value={`$${cumulative.toFixed(0)}B`}
              sub={worstSc?.name} color={T.red} />
            <StatCard label="Max Annual Loss Year"
              value="2050" sub="Peak in all disorderly scenarios" color={T.amber} />
            <StatCard label="Loss Acceleration Post-2035"
              value="Delayed Trans." sub="1.6× post-2035 compounding" color={T.teal} />
          </div>
        </div>
      )}

      {/* ── TAB 5: Expected Shortfall ─────────────────────────────────────────── */}
      {activeTab === 4 && (
        <div>
          <div style={{ background:T.navy, border:`1px solid ${T.teal}66`, borderRadius:8,
            padding:'10px 16px', marginBottom:20, fontSize:12, color:T.textSec }}>
            <span style={{ color:T.teal, fontWeight:700 }}>ES Methodology: </span>
            Average loss in worst 2.5% tail — EBA supervisory benchmark (ES 97.5%)
          </div>

          <SectionTitle>VaR 95% · VaR 99% · ES 97.5% — All Scenarios</SectionTitle>
          <Card style={{ marginBottom:20 }}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={esData} margin={{ top:5, right:20, bottom:5, left:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fill:T.textSec, fontSize:11 }} />
                <YAxis tick={{ fill:T.textSec, fontSize:11 }} unit="$B" />
                <Tooltip {...tooltipStyle} formatter={v => [`$${v.toFixed(1)}B`, '']} />
                <Legend wrapperStyle={{ color:T.textSec, fontSize:11 }} />
                <Bar dataKey="var95" name="VaR 95%" fill="#3b82f6" radius={[2,2,0,0]} />
                <Bar dataKey="var99" name="VaR 99%" fill={T.amber} radius={[2,2,0,0]} />
                <Bar dataKey="es975" name="ES 97.5%" fill={T.red} radius={[2,2,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
            <div>
              <SectionTitle>Tail Decomposition — {firstSel.name}</SectionTitle>
              <Card>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={tailDecomp} layout="vertical" margin={{ top:5, right:20, bottom:5, left:20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis type="number" tick={{ fill:T.textSec, fontSize:11 }} unit="%" />
                    <YAxis type="category" dataKey="name" tick={{ fill:T.textSec, fontSize:11 }} width={120} />
                    <Tooltip {...tooltipStyle} formatter={v => [`${v}%`, 'ES Share']} />
                    <Bar dataKey="value" radius={[0,4,4,0]}>
                      {tailDecomp.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>
            <div>
              <SectionTitle>Top 3 Holdings — Tail Risk Concentration</SectionTitle>
              <Card>
                {top3Holdings.map((h, i) => (
                  <div key={i} style={{ marginBottom:12 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                      <span style={{ color:T.text, fontWeight:600 }}>{h.name}</span>
                      <span style={{ color:T.amber, fontWeight:700 }}>{h.share}%</span>
                    </div>
                    <div style={{ background:T.border, borderRadius:4, height:6 }}>
                      <div style={{ background:T.amber, width:`${h.share}%`, height:'100%', borderRadius:4 }} />
                    </div>
                  </div>
                ))}
                <div style={{ color:T.textSec, fontSize:11, marginTop:8 }}>
                  Top 3 combined tail concentration: <span style={{ color:T.red, fontWeight:700 }}>{top3Concentration}%</span>
                </div>
              </Card>
            </div>
          </div>

          <div style={{ display:'flex', gap:12 }}>
            <StatCard label="Max ES 97.5% (Delayed Trans.)"
              value={`$${maxES.es975.toFixed(1)}B`} sub="Worst tail scenario" color={T.red} />
            <StatCard label="ES / VaR 99% Ratio"
              value={`${esVarRatio}×`} sub="Tail risk amplification" color={T.amber} />
            <StatCard label="Top 3 Holdings Tail Concentration"
              value={`${top3Concentration}%`} sub="of portfolio ES" color={T.teal} />
          </div>
        </div>
      )}

      {/* ── TAB 6: Transmission Channel Analysis ─────────────────────────────── */}
      {activeTab === 5 && (
        <div>
          <SectionTitle>Transmission Channel Contribution — Selected Scenarios</SectionTitle>
          {selScenarios.length > 0 && (
            <Card style={{ marginBottom:20 }}>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={stackedData} layout="vertical" margin={{ top:5, right:20, bottom:5, left:80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fill:T.textSec, fontSize:11 }} unit="%" />
                  <YAxis type="category" dataKey="name" tick={{ fill:T.textSec, fontSize:11 }} />
                  <Tooltip {...tooltipStyle} formatter={v => [`${v}%`, '']} />
                  <Legend wrapperStyle={{ color:T.textSec, fontSize:11 }} />
                  <Bar dataKey="carbon"    name="Carbon Price"    stackId="a" fill={CHANNELS[0].color} />
                  <Bar dataKey="stranded"  name="Stranded Assets" stackId="a" fill={CHANNELS[1].color} />
                  <Bar dataKey="physical"  name="Physical Damage" stackId="a" fill={CHANNELS[2].color} />
                  <Bar dataKey="macro"     name="Macro/GDP"       stackId="a" fill={CHANNELS[3].color} />
                  <Bar dataKey="contagion" name="Fin. Contagion"  stackId="a" fill={CHANNELS[4].color} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}

          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 }}>
            {CHANNELS.map(ch => {
              const scId = firstSel.id;
              const mult = CHANNEL_SCENARIO_MULTIPLIERS[scId]?.[ch.id] || 1;
              const mag = (ch.base * mult).toFixed(1);
              return (
                <Card key={ch.id}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                    <div style={{ width:10, height:10, borderRadius:'50%', background:ch.color }} />
                    <span style={{ color:ch.color, fontWeight:700, fontSize:13 }}>{ch.label}</span>
                  </div>
                  <div style={{ color:T.textSec, fontSize:11, marginBottom:8, lineHeight:1.5 }}>{ch.desc}</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:4, fontSize:11 }}>
                    <div><span style={{ color:T.textMut }}>Magnitude:</span>
                      <span style={{ color:T.amber, fontWeight:600, marginLeft:4 }}>{mag} index pts</span></div>
                    <div><span style={{ color:T.textMut }}>Lead time:</span>
                      <span style={{ color:T.text, marginLeft:4 }}>{ch.leadTime}</span></div>
                    <div style={{ gridColumn:'1/-1' }}><span style={{ color:T.textMut }}>Affected: </span>
                      <span style={{ color:T.textSec }}>{ch.affected}</span></div>
                  </div>
                </Card>
              );
            })}
          </div>

          <SectionTitle>Top 2 Channels — Magnitude Across All Scenarios</SectionTitle>
          <Card style={{ marginBottom:20 }}>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={top2ChannelData} margin={{ top:5, right:20, bottom:5, left:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fill:T.textSec, fontSize:11 }} />
                <YAxis tick={{ fill:T.textSec, fontSize:11 }} unit=" pts" />
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ color:T.textSec, fontSize:11 }} />
                <Bar dataKey="carbon"   name="Carbon Price Channel"  fill={CHANNELS[0].color} radius={[2,2,0,0]} />
                <Bar dataKey="stranded" name="Stranded Asset Channel" fill={CHANNELS[1].color} radius={[2,2,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <div style={{ display:'flex', gap:12 }}>
            <StatCard label="Dominant Channel (Orderly)"
              value="Carbon Price" sub="Highest in Net Zero, Below 2°C" color={T.gold} />
            <StatCard label="Dominant Channel (Hot House)"
              value="Physical Damage" sub="Peaks in Current Policies (1.8×)" color={T.red} />
            <StatCard label="Fastest Onset Channel"
              value="Stranded Assets" sub="Bites from 2028 in disorderly" color={T.amber} />
          </div>
        </div>
      )}
    </div>
  );
}
