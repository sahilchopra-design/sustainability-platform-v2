/**
 * EP-AI2 — Corporate Decarbonisation Roadmap Builder
 * Route: /decarbonisation-roadmap
 * Multi-year corporate decarbonisation pathway planning and milestone tracking
 */

import React, { useState, useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ReferenceLine, ResponsiveContainer, ComposedChart, Line,
} from 'recharts';

/* ─── Theme ─────────────────────────────────────────────────────────────── */
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

/* ─── Deterministic seed ────────────────────────────────────────────────── */
const sr = s => { let x = Math.sin(s+1)*10000; return x - Math.floor(x); };

/* ─── Category colours ──────────────────────────────────────────────────── */
const CAT_COLOR = {
  'Energy Efficiency':       '#2c5a8c',
  'Renewable Energy':        '#5a8a6a',
  'Process Electrification': '#c5a96a',
  'Fuel Switching':          '#7c3aed',
  'Supply Chain':            '#d97706',
  'Carbon Removal':          '#0891b2',
};

/* ─── 25 Decarbonisation measures ──────────────────────────────────────── */
const MEASURES = [
  // Energy Efficiency (5)
  { id:'M01', name:'LED & Smart Lighting Retrofit',          cat:'Energy Efficiency',       capex:18,  opex:-1.2, reduction:12,  year:2024, irr:22, status:'complete'    },
  { id:'M02', name:'Industrial Heat Recovery Systems',       cat:'Energy Efficiency',       capex:45,  opex:-3.8, reduction:28,  year:2025, irr:18, status:'in progress' },
  { id:'M03', name:'Building Energy Management Platform',    cat:'Energy Efficiency',       capex:22,  opex:-2.1, reduction:15,  year:2025, irr:19, status:'in progress' },
  { id:'M04', name:'Compressed Air System Optimisation',     cat:'Energy Efficiency',       capex:12,  opex:-0.9, reduction:8,   year:2024, irr:24, status:'complete'    },
  { id:'M05', name:'Motor & Drive Efficiency Upgrades',      cat:'Energy Efficiency',       capex:38,  opex:-2.8, reduction:22,  year:2026, irr:17, status:'planned'     },
  // Renewable Energy (5)
  { id:'M06', name:'On-site Solar PV — Manufacturing Sites', cat:'Renewable Energy',        capex:120, opex:-8.5, reduction:65,  year:2025, irr:14, status:'in progress' },
  { id:'M07', name:'Offshore Wind PPA (200 MW)',             cat:'Renewable Energy',        capex:0,   opex:-12,  reduction:110, year:2026, irr:16, status:'planned'     },
  { id:'M08', name:'Corporate Renewable Energy Certificates',cat:'Renewable Energy',        capex:2,   opex:-1.5, reduction:40,  year:2024, irr:31, status:'complete'    },
  { id:'M09', name:'Biomass CHP — Flagship Plant',           cat:'Renewable Energy',        capex:85,  opex:2.5,  reduction:55,  year:2027, irr:12, status:'planned'     },
  { id:'M10', name:'Green Hydrogen Pilot',                   cat:'Renewable Energy',        capex:200, opex:8,    reduction:30,  year:2028, irr:8,  status:'planned'     },
  // Process Electrification (4)
  { id:'M11', name:'Electric Arc Furnace Conversion',        cat:'Process Electrification', capex:380, opex:-5,   reduction:145, year:2029, irr:11, status:'planned'     },
  { id:'M12', name:'Electric Boiler & Steam Systems',        cat:'Process Electrification', capex:95,  opex:-4.2, reduction:52,  year:2027, irr:13, status:'planned'     },
  { id:'M13', name:'EV Fleet Transition (HGV)',              cat:'Process Electrification', capex:65,  opex:-3,   reduction:35,  year:2026, irr:15, status:'planned'     },
  { id:'M14', name:'Electric Forklift & Site Vehicles',      cat:'Process Electrification', capex:18,  opex:-1.8, reduction:10,  year:2025, irr:20, status:'in progress' },
  // Fuel Switching (4)
  { id:'M15', name:'Coal-to-Gas Boiler Switch',              cat:'Fuel Switching',          capex:42,  opex:3.2,  reduction:68,  year:2025, irr:9,  status:'in progress' },
  { id:'M16', name:'Natural Gas to Bio-LNG Blending',        cat:'Fuel Switching',          capex:28,  opex:4.5,  reduction:32,  year:2026, irr:10, status:'planned'     },
  { id:'M17', name:'Hydrogen Burner Retrofit (Pilot)',       cat:'Fuel Switching',          capex:55,  opex:6,    reduction:25,  year:2028, irr:7,  status:'planned'     },
  { id:'M18', name:'Sustainable Aviation Fuel Logistics',    cat:'Fuel Switching',          capex:8,   opex:2.8,  reduction:6,   year:2025, irr:5,  status:'planned'     },
  // Supply Chain (4)
  { id:'M19', name:'Supplier Decarbonisation Programme',     cat:'Supply Chain',            capex:35,  opex:4,    reduction:280, year:2026, irr:18, status:'planned'     },
  { id:'M20', name:'Low-Carbon Steel & Aluminium Sourcing',  cat:'Supply Chain',            capex:0,   opex:18,   reduction:120, year:2027, irr:14, status:'planned'     },
  { id:'M21', name:'Circular Economy & Waste Reduction',     cat:'Supply Chain',            capex:22,  opex:-1.5, reduction:45,  year:2025, irr:21, status:'planned'     },
  { id:'M22', name:'Logistics Optimisation & Modal Shift',   cat:'Supply Chain',            capex:15,  opex:-2.2, reduction:38,  year:2024, irr:25, status:'complete'    },
  // Carbon Removal (3)
  { id:'M23', name:'Direct Air Capture Offtake Contract',    cat:'Carbon Removal',          capex:0,   opex:24,   reduction:50,  year:2035, irr:4,  status:'planned'     },
  { id:'M24', name:'Afforestation & Reforestation Credits',  cat:'Carbon Removal',          capex:18,  opex:3,    reduction:80,  year:2030, irr:6,  status:'planned'     },
  { id:'M25', name:'Enhanced Weathering Pilot',              cat:'Carbon Removal',          capex:12,  opex:2.5,  reduction:20,  year:2032, irr:3,  status:'planned'     },
];

/* ─── Emission trajectory 2019-2050 ────────────────────────────────────── */
const BASE_S1 = 820;
const BASE_S2 = 340;
const BASE_S3 = 4200;

const MILESTONES = [
  { year:2025, label:'2025 Interim',   target:0.15, scope:'S1+S2' },
  { year:2030, label:'2030 SBTi',      target:0.46, scope:'S1+S2' },
  { year:2040, label:'2040 Sector',    target:0.70, scope:'S1+S2' },
  { year:2050, label:'2050 Net-Zero',  target:1.00, scope:'All'   },
];

function buildTrajectory() {
  const rows = [];
  // Cumulative reductions by year from measures
  const cumR1 = {}; // scope 1+2 reductions
  const cumR3 = {}; // scope 3 reductions
  for (let y = 2019; y <= 2050; y++) { cumR1[y] = 0; cumR3[y] = 0; }
  MEASURES.forEach(m => {
    for (let y = m.year; y <= 2050; y++) {
      const cat = m.cat;
      if (cat === 'Supply Chain' || cat === 'Carbon Removal') {
        cumR3[y] += m.reduction;
      } else {
        cumR1[y] += m.reduction;
      }
    }
  });

  // 1.5C pathway targets (linear interpolation from base to net-zero)
  const pathway = (y) => {
    if (y <= 2019) return BASE_S1 + BASE_S2 + BASE_S3;
    if (y >= 2050) return 0;
    const t = (y - 2019) / (2050 - 2019);
    return Math.max(0, (BASE_S1 + BASE_S2 + BASE_S3) * (1 - t));
  };

  for (let y = 2019; y <= 2050; y++) {
    const s1 = Math.max(0, BASE_S1 - cumR1[y] * 0.35);
    const s2 = Math.max(0, BASE_S2 - cumR1[y] * 0.15);
    const s3 = Math.max(0, BASE_S3 - cumR3[y] * 0.9);
    rows.push({
      year: y,
      scope1: parseFloat(s1.toFixed(1)),
      scope2: parseFloat(s2.toFixed(1)),
      scope3: parseFloat(s3.toFixed(1)),
      total: parseFloat((s1 + s2 + s3).toFixed(1)),
      pathway: parseFloat(pathway(y).toFixed(1)),
    });
  }
  return rows;
}

const TRAJECTORY = buildTrajectory();

/* ─── Annual capex by year and category ────────────────────────────────── */
function buildCapexByYear() {
  const cats = Object.keys(CAT_COLOR);
  const years = [];
  for (let y = 2024; y <= 2035; y++) {
    const row = { year: y };
    cats.forEach(c => { row[c] = 0; });
    MEASURES.filter(m => m.year === y).forEach(m => { row[m.cat] = (row[m.cat] || 0) + m.capex; });
    years.push(row);
  }
  return years;
}
const CAPEX_DATA = buildCapexByYear();

/* ─── Waterfall data for gap analysis ──────────────────────────────────── */
function buildWaterfall() {
  const base12 = BASE_S1 + BASE_S2;
  const target2030 = base12 * (1 - 0.46);
  let running = base12;
  const bars = [{ name: 'Base 2019', value: base12, start: 0, fill: T.navy }];
  const cats = ['Energy Efficiency','Renewable Energy','Process Electrification','Fuel Switching'];
  cats.forEach(cat => {
    const catMeasures = MEASURES.filter(m => m.cat === cat && m.year <= 2030);
    const total = catMeasures.reduce((s, m) => s + m.reduction, 0);
    if (total > 0) {
      const start = running - total;
      bars.push({ name: cat, value: total, start: Math.max(start, 0), fill: CAT_COLOR[cat], reduction: true });
      running = Math.max(running - total, 0);
    }
  });
  // residual gap
  const residual = running - target2030;
  bars.push({ name: '2030 Projected', value: running, start: 0, fill: T.textSec });
  bars.push({ name: 'SBTi Target', value: target2030, start: 0, fill: T.green });
  if (residual > 0) {
    bars.push({ name: 'Residual Gap', value: residual, start: target2030, fill: T.red });
  }
  return { bars, target2030: parseFloat(target2030.toFixed(0)), residual: parseFloat(residual.toFixed(0)), projected: parseFloat(running.toFixed(0)) };
}
const WATERFALL = buildWaterfall();

/* ─── Milestone progress ────────────────────────────────────────────────── */
function getMilestoneProgress() {
  const base12 = BASE_S1 + BASE_S2;
  return MILESTONES.map(ms => {
    const row2019 = TRAJECTORY.find(r => r.year === 2019);
    const rowY = TRAJECTORY.find(r => r.year === ms.year);
    if (!row2019 || !rowY) return { ...ms, achieved: 0, required: ms.target * 100 };
    const actualReduction = ms.scope === 'All'
      ? (row2019.total - rowY.total) / row2019.total
      : (base12 - (rowY.scope1 + rowY.scope2)) / base12;
    const achieved = Math.min(actualReduction / ms.target * 100, 100);
    return { ...ms, achieved: parseFloat(achieved.toFixed(1)), required: ms.target * 100, actualPct: parseFloat((actualReduction * 100).toFixed(1)) };
  });
}
const MILESTONE_PROGRESS = getMilestoneProgress();

/* ─── Helpers ───────────────────────────────────────────────────────────── */
const fmt1 = n => n.toLocaleString('en-GB', { maximumFractionDigits: 1 });
const fmt0 = n => Math.round(n).toLocaleString('en-GB');

const STATUS_COLOR = { complete:'#16a34a', 'in progress':'#d97706', planned:'#9aa3ae' };
const STATUS_BG    = { complete:'#f0fdf4', 'in progress':'#fffbeb', planned:'#f8f9fa' };

/* ─── Sub-components ────────────────────────────────────────────────────── */

function KpiCard({ label, value, sub, accent }) {
  return (
    <div style={{
      background: T.surface,
      border: `1px solid ${T.border}`,
      borderRadius: 10,
      padding: '16px 20px',
      boxShadow: T.card,
      borderLeft: `3px solid ${accent || T.navy}`,
    }}>
      <div style={{ fontSize: 11, color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: T.text }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function Badge({ status }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
      padding: '2px 8px', borderRadius: 99,
      color: STATUS_COLOR[status], background: STATUS_BG[status],
      border: `1px solid ${STATUS_COLOR[status]}40`,
    }}>{status}</span>
  );
}

function CatPill({ cat }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 99,
      background: (CAT_COLOR[cat] || T.navy) + '18',
      color: CAT_COLOR[cat] || T.navy,
      border: `1px solid ${(CAT_COLOR[cat] || T.navy)}30`,
      whiteSpace: 'nowrap',
    }}>{cat}</span>
  );
}

function SectionHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12, color: T.textSec, marginTop: 2 }}>{subtitle}</div>}
    </div>
  );
}

/* ─── Progress ring ─────────────────────────────────────────────────────── */
function ProgressRing({ pct, size, color, label, sub }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * Math.min(pct / 100, 1);
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap: 6 }}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={T.border} strokeWidth={8} />
        <circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={8}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`}
        />
        <text x={size/2} y={size/2 - 4} textAnchor="middle" fill={T.text} fontSize={14} fontWeight={700}>{Math.round(pct)}%</text>
        <text x={size/2} y={size/2 + 13} textAnchor="middle" fill={T.textSec} fontSize={9}>of target</text>
      </svg>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{label}</div>
        {sub && <div style={{ fontSize: 10, color: T.textSec }}>{sub}</div>}
      </div>
    </div>
  );
}

/* ─── Custom tooltip ────────────────────────────────────────────────────── */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 14px', boxShadow: T.cardH, fontSize: 12 }}>
      <div style={{ fontWeight: 700, color: T.text, marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || T.textSec, marginBottom: 2 }}>
          {p.name}: <strong>{fmt1(p.value)}</strong> {typeof p.value === 'number' && p.value > 100 ? 'ktCO2e' : ''}
        </div>
      ))}
    </div>
  );
}

/* ─── Tab 1: Roadmap Overview ───────────────────────────────────────────── */
function RoadmapOverview() {
  const data = TRAJECTORY.filter(r => r.year % 2 === 0 || [2019,2025,2030,2040,2050].includes(r.year));
  const base = TRAJECTORY[0];
  const proj2030 = TRAJECTORY.find(r => r.year === 2030);
  const s12Base = BASE_S1 + BASE_S2;
  const s12_2030 = proj2030 ? proj2030.scope1 + proj2030.scope2 : s12Base;
  const pctReduction = ((s12Base - s12_2030) / s12Base * 100).toFixed(1);
  const gap = (s12Base * 0.46 - (s12Base - s12_2030)).toFixed(0);

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 }}>
        <KpiCard label="2030 SBTi Target" value="-46%" sub="Scope 1+2 vs. 2019 (1.5°C ACA)" accent={T.navy} />
        <KpiCard label="Planned Reduction by 2030" value="338 ktCO2e" sub="82% of Scope 1+2 SBTi target" accent={T.sage} />
        <KpiCard label="Total Decarbonisation Capex" value="$2.4bn" sub="2024–2035 (25 measures)" accent={T.gold} />
        <KpiCard label="Net-Zero Year (with removals)" value="2048" sub="Scope 1+2+3 incl. DAC offtake" accent={T.navyL} />
      </div>

      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, boxShadow: T.card, marginBottom: 20 }}>
        <SectionHeader title="Emission Trajectory 2019–2050" subtitle="Scope 1, 2, 3 (ktCO2e) vs. 1.5°C science-based pathway" />
        <ResponsiveContainer width="100%" height={340}>
          <ComposedChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.textSec }} />
            <YAxis tick={{ fontSize: 11, fill: T.textSec }} tickFormatter={v => `${Math.round(v/1000)}k`} label={{ value:'ktCO2e', angle:-90, position:'insideLeft', fontSize:10, fill:T.textMut }} />
            <Tooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Area type="monotone" dataKey="scope3" name="Scope 3" stackId="1" fill="#2c5a8c22" stroke="#2c5a8c" strokeWidth={1} />
            <Area type="monotone" dataKey="scope2" name="Scope 2" stackId="1" fill="#c5a96a44" stroke="#c5a96a" strokeWidth={1} />
            <Area type="monotone" dataKey="scope1" name="Scope 1" fill="#5a8a6a44" stroke="#5a8a6a" strokeWidth={2} stackId="1" />
            <Line type="monotone" dataKey="pathway" name="1.5°C Pathway" stroke={T.red} strokeWidth={2} strokeDasharray="6 3" dot={false} />
            {MILESTONES.map(ms => (
              <ReferenceLine key={ms.year} x={ms.year} stroke={T.amber} strokeDasharray="4 2" label={{ value: ms.label, position:'top', fontSize:9, fill:T.amber }} />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, boxShadow: T.card }}>
          <SectionHeader title="2030 Trajectory Summary" subtitle="Scope 1+2 focus" />
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {[
              { label:'Base year (2019) Scope 1+2', val: `${fmt0(s12Base)} ktCO2e`, color: T.navy },
              { label:'2030 SBTi Target', val: `${fmt0(s12Base * 0.54)} ktCO2e`, color: T.green },
              { label:'Planned 2030 Trajectory', val: `${fmt0(s12_2030)} ktCO2e`, color: T.gold },
              { label:'Planned reduction vs. 2019', val: `${pctReduction}%`, color: T.sage },
              { label:'Gap to SBTi target', val: `${Math.max(0, gap)} ktCO2e`, color: T.red },
            ].map((r, i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:`1px solid ${T.border}` }}>
                <span style={{ fontSize:12, color: T.textSec }}>{r.label}</span>
                <span style={{ fontSize:13, fontWeight:700, color: r.color }}>{r.val}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, boxShadow: T.card }}>
          <SectionHeader title="Milestone Flags" subtitle="Key checkpoint targets" />
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {MILESTONES.map((ms, i) => {
              const mp = MILESTONE_PROGRESS[i];
              return (
                <div key={ms.year} style={{ display:'flex', alignItems:'center', gap:12, padding:'8px 12px', borderRadius:8, background: T.surfaceH }}>
                  <div style={{ width: 42, height: 42, borderRadius: 8, background: T.navy, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <span style={{ fontSize: 11, fontWeight:700, color:'#fff' }}>{ms.year}</span>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:600, color:T.text }}>{ms.label}</div>
                    <div style={{ fontSize:11, color:T.textSec }}>-{ms.target*100}% {ms.scope} target</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:13, fontWeight:700, color: mp.achieved >= 80 ? T.green : mp.achieved >= 50 ? T.amber : T.red }}>{mp.actualPct}%</div>
                    <div style={{ fontSize:10, color:T.textMut }}>achieved</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Tab 2: Measure Library ────────────────────────────────────────────── */
function MeasureLibrary() {
  const [catFilter, setCatFilter] = useState('All');
  const [sortKey, setSortKey] = useState('costEff');

  const cats = ['All', ...Object.keys(CAT_COLOR)];

  const processed = useMemo(() => {
    let list = MEASURES.map(m => ({
      ...m,
      costEff: m.capex > 0 ? parseFloat((m.capex * 1000 / m.reduction).toFixed(1)) : 0,
    }));
    if (catFilter !== 'All') list = list.filter(m => m.cat === catFilter);
    list.sort((a, b) => {
      if (sortKey === 'costEff') return a.costEff - b.costEff;
      if (sortKey === 'reduction') return b.reduction - a.reduction;
      if (sortKey === 'capex') return b.capex - a.capex;
      if (sortKey === 'irr') return b.irr - a.irr;
      return 0;
    });
    return list;
  }, [catFilter, sortKey]);

  const totalCapex = processed.reduce((s, m) => s + m.capex, 0);
  const totalReduction = processed.reduce((s, m) => s + m.reduction, 0);

  const colHdr = (label, key) => (
    <th
      onClick={() => setSortKey(key)}
      style={{ padding:'8px 12px', textAlign:'left', fontSize:11, fontWeight:600, color: sortKey===key ? T.navy : T.textSec, cursor:'pointer', borderBottom:`2px solid ${T.border}`, background: T.surfaceH, whiteSpace:'nowrap' }}
    >
      {label} {sortKey===key ? '▲' : ''}
    </th>
  );

  return (
    <div>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16, alignItems:'center' }}>
        <span style={{ fontSize:12, color:T.textSec, marginRight:4 }}>Filter:</span>
        {cats.map(c => (
          <button key={c} onClick={() => setCatFilter(c)} style={{
            padding:'4px 12px', borderRadius:99, border:`1px solid ${catFilter===c ? CAT_COLOR[c]||T.navy : T.border}`,
            background: catFilter===c ? (CAT_COLOR[c]||T.navy)+'18' : T.surface,
            color: catFilter===c ? CAT_COLOR[c]||T.navy : T.textSec,
            fontSize:11, fontWeight:600, cursor:'pointer',
          }}>{c}</button>
        ))}
        <span style={{ marginLeft:'auto', fontSize:11, color:T.textSec }}>
          {processed.length} measures | {fmt0(totalReduction)} ktCO2e/yr | ${fmt0(totalCapex)}M capex
        </span>
      </div>

      <div style={{ background: T.surface, border:`1px solid ${T.border}`, borderRadius:12, overflow:'hidden', boxShadow:T.card }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                {colHdr('ID', 'id')}
                <th style={{ padding:'8px 12px', textAlign:'left', fontSize:11, fontWeight:600, color:T.textSec, borderBottom:`2px solid ${T.border}`, background:T.surfaceH }}>Measure</th>
                <th style={{ padding:'8px 12px', textAlign:'left', fontSize:11, fontWeight:600, color:T.textSec, borderBottom:`2px solid ${T.border}`, background:T.surfaceH }}>Category</th>
                {colHdr('CapEx ($M)', 'capex')}
                {colHdr('CO2e Red. (kt)', 'reduction')}
                {colHdr('$/tCO2e', 'costEff')}
                {colHdr('IRR %', 'irr')}
                <th style={{ padding:'8px 12px', textAlign:'left', fontSize:11, fontWeight:600, color:T.textSec, borderBottom:`2px solid ${T.border}`, background:T.surfaceH }}>Year</th>
                <th style={{ padding:'8px 12px', textAlign:'left', fontSize:11, fontWeight:600, color:T.textSec, borderBottom:`2px solid ${T.border}`, background:T.surfaceH }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {processed.map((m, i) => (
                <tr key={m.id} style={{ background: i%2===0 ? T.surface : T.surfaceH }}>
                  <td style={{ padding:'8px 12px', fontSize:11, color:T.textMut, fontFamily:'monospace' }}>{m.id}</td>
                  <td style={{ padding:'8px 12px', fontSize:12, color:T.text, fontWeight:500, maxWidth:200 }}>{m.name}</td>
                  <td style={{ padding:'8px 12px' }}><CatPill cat={m.cat} /></td>
                  <td style={{ padding:'8px 12px', fontSize:12, color:T.text, textAlign:'right' }}>{m.capex > 0 ? `$${m.capex}M` : '—'}</td>
                  <td style={{ padding:'8px 12px', fontSize:12, fontWeight:600, color:T.sage, textAlign:'right' }}>{m.reduction}</td>
                  <td style={{ padding:'8px 12px', fontSize:12, color: m.costEff < 50 ? T.green : m.costEff < 100 ? T.amber : T.red, textAlign:'right', fontWeight:600 }}>{m.capex > 0 ? `$${m.costEff}` : '—'}</td>
                  <td style={{ padding:'8px 12px', fontSize:12, color: m.irr >= 15 ? T.green : m.irr >= 10 ? T.amber : T.red, textAlign:'right', fontWeight:600 }}>{m.irr}%</td>
                  <td style={{ padding:'8px 12px', fontSize:12, color:T.textSec }}>{m.year}</td>
                  <td style={{ padding:'8px 12px' }}><Badge status={m.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div style={{ fontSize:11, color:T.textMut, marginTop:8 }}>Click column headers to sort. $/tCO2e = abatement cost (capex / annual reduction). IRR includes opex savings over 20-year asset life.</div>
    </div>
  );
}

/* ─── Tab 3: Investment Plan ────────────────────────────────────────────── */
function InvestmentPlan() {
  const cats = Object.keys(CAT_COLOR);

  // Cumulative avoided carbon cost
  const cumData = useMemo(() => {
    let cumCapex = 0;
    let cumReduction = 0;
    return CAPEX_DATA.map(row => {
      const yearCapex = cats.reduce((s, c) => s + (row[c] || 0), 0);
      const yearReduction = MEASURES.filter(m => m.year === row.year).reduce((s, m) => s + m.reduction, 0);
      cumCapex += yearCapex;
      cumReduction += yearReduction;
      return {
        year: row.year,
        cumCapex: parseFloat(cumCapex.toFixed(0)),
        avoided75: parseFloat((cumReduction * 75 / 1000).toFixed(1)),
        avoided150: parseFloat((cumReduction * 150 / 1000).toFixed(1)),
      };
    });
  }, []);

  const totalCapex = MEASURES.reduce((s, m) => s + m.capex, 0);
  const totalReduction = MEASURES.reduce((s, m) => s + m.reduction, 0);
  const avgCost = (totalCapex / totalReduction * 1000).toFixed(0);

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 }}>
        <KpiCard label="Total Decarbonisation Capex" value="$2.4bn" sub="2024–2035 (25 measures)" accent={T.navy} />
        <KpiCard label="Avg Abatement Cost" value={`$${avgCost}/t`} sub="CO2e across all measures" accent={T.gold} />
        <KpiCard label="Annual CO2e Reduction" value={`${fmt0(totalReduction)} kt`} sub="At full implementation" accent={T.sage} />
        <KpiCard label="Shadow Price Breakeven" value="$75/t" sub="Net positive NPV above this" accent={T.navyL} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
        <div style={{ background: T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:20, boxShadow:T.card }}>
          <SectionHeader title="Annual Capex by Category (2024–2035)" subtitle="$M investment per year" />
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={CAPEX_DATA} margin={{ top:5, right:10, left:0, bottom:5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize:10, fill:T.textSec }} />
              <YAxis tick={{ fontSize:10, fill:T.textSec }} tickFormatter={v=>`$${v}M`} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize:10 }} />
              {cats.map(cat => (
                <Bar key={cat} dataKey={cat} stackId="a" fill={CAT_COLOR[cat]} name={cat}>
                  {CAPEX_DATA.map((_, i) => (
                    <Cell key={i} fill={CAT_COLOR[cat]} />
                  ))}
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:20, boxShadow:T.card }}>
          <SectionHeader title="Cumulative Investment vs. Avoided Carbon Cost" subtitle="Cumulative $M (2024–2035)" />
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={cumData} margin={{ top:5, right:10, left:0, bottom:5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize:10, fill:T.textSec }} />
              <YAxis tick={{ fontSize:10, fill:T.textSec }} tickFormatter={v=>`$${v}M`} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize:10 }} />
              <Bar dataKey="cumCapex" name="Cumulative Capex ($M)" fill={T.navy}>
                {cumData.map((_, i) => <Cell key={i} fill={T.navy} />)}
              </Bar>
              <Line type="monotone" dataKey="avoided75" name="Avoided Cost @$75/t" stroke={T.green} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="avoided150" name="Avoided Cost @$150/t" stroke={T.sage} strokeWidth={2} strokeDasharray="5 3" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ background: T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:20, boxShadow:T.card }}>
        <SectionHeader title="Payback Period Analysis by Category" subtitle="Simple payback at $75/tCO2e shadow price" />
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
          {cats.map(cat => {
            const catMeasures = MEASURES.filter(m => m.cat === cat);
            const capex = catMeasures.reduce((s, m) => s + m.capex, 0);
            const red = catMeasures.reduce((s, m) => s + m.reduction, 0);
            const annualValue = red * 75 / 1000 + catMeasures.reduce((s, m) => s + Math.abs(Math.min(m.opex, 0)), 0);
            const payback = annualValue > 0 ? (capex / annualValue).toFixed(1) : 'N/A';
            const avgIrr = catMeasures.length > 0 ? (catMeasures.reduce((s, m) => s + m.irr, 0) / catMeasures.length).toFixed(1) : '0';
            return (
              <div key={cat} style={{ padding:'14px 16px', borderRadius:10, background:T.surfaceH, border:`1px solid ${T.border}` }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                  <div style={{ width:10, height:10, borderRadius:2, background:CAT_COLOR[cat] }} />
                  <div style={{ fontSize:11, fontWeight:700, color:T.text }}>{cat}</div>
                </div>
                <div style={{ fontSize:20, fontWeight:700, color:T.navy }}>{payback !== 'N/A' ? `${payback} yr` : 'N/A'}</div>
                <div style={{ fontSize:11, color:T.textSec, marginTop:4 }}>Avg IRR: {avgIrr}% | {catMeasures.length} measures</div>
                <div style={{ fontSize:11, color:T.textSec }}>Total capex: ${capex}M | {red} ktCO2e/yr</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── Tab 4: Milestone Tracker ──────────────────────────────────────────── */
function MilestoneTracker() {
  const ringColors = [T.amber, T.navyL, T.sage, T.green];

  return (
    <div>
      <div style={{ background: T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:24, boxShadow:T.card, marginBottom:20 }}>
        <SectionHeader title="Milestone Progress Rings" subtitle="% of required reduction achieved at each checkpoint (Scope 1+2 unless noted)" />
        <div style={{ display:'flex', justifyContent:'space-around', flexWrap:'wrap', gap:24, padding:'16px 0' }}>
          {MILESTONE_PROGRESS.map((ms, i) => (
            <ProgressRing
              key={ms.year}
              pct={ms.achieved}
              size={120}
              color={ringColors[i]}
              label={`${ms.year} — ${ms.label}`}
              sub={`${ms.actualPct}% achieved vs. ${ms.required}% req'd`}
            />
          ))}
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        {MILESTONE_PROGRESS.map((ms, mi) => {
          const contributing = MEASURES.filter(m => m.year <= ms.year && (ms.scope === 'All' || !['Supply Chain','Carbon Removal'].includes(m.cat)));
          return (
            <div key={ms.year} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:16, boxShadow:T.card }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color:T.text }}>{ms.year} — {ms.label}</div>
                  <div style={{ fontSize:11, color:T.textSec }}>Target: -{ms.required}% {ms.scope}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:18, fontWeight:700, color: ms.achieved >= 80 ? T.green : ms.achieved >= 50 ? T.amber : T.red }}>{ms.achieved}%</div>
                  <div style={{ fontSize:10, color:T.textMut }}>of target met</div>
                </div>
              </div>
              <div style={{ height:4, borderRadius:99, background:T.border, marginBottom:12 }}>
                <div style={{ height:4, borderRadius:99, background:ringColors[mi], width:`${Math.min(ms.achieved,100)}%` }} />
              </div>
              <div style={{ fontSize:11, fontWeight:600, color:T.textSec, marginBottom:6 }}>Contributing measures ({contributing.length}):</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                {contributing.slice(0, 8).map(m => (
                  <span key={m.id} style={{ fontSize:10, padding:'2px 6px', borderRadius:4, background:T.surfaceH, color:T.textSec, border:`1px solid ${T.border}` }}>{m.id}: {m.name.substring(0, 22)}{m.name.length > 22 ? '...' : ''}</span>
                ))}
                {contributing.length > 8 && <span style={{ fontSize:10, color:T.textMut, padding:'2px 6px' }}>+{contributing.length - 8} more</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Tab 5: Gap Analysis ───────────────────────────────────────────────── */
function GapAnalysis() {
  const { bars, target2030, residual, projected } = WATERFALL;
  const base12 = BASE_S1 + BASE_S2;

  // Build waterfall chart data for Recharts
  const waterfallData = [
    { name: 'Base 2019 S1+S2', value: base12, isBase: true },
    ...['Energy Efficiency','Renewable Energy','Process Electrification','Fuel Switching'].map(cat => {
      const catM = MEASURES.filter(m => m.cat === cat && m.year <= 2030);
      const total = catM.reduce((s, m) => s + m.reduction, 0);
      return { name: cat, value: -total, isReduction: true };
    }),
    { name: '2030 Projected', value: projected, isProjected: true },
  ];

  // Simple bar chart for waterfall-like view
  const simpleData = [
    { name: 'Base 2019', val: base12, color: T.navy },
    { name: 'Energy Eff.', val: MEASURES.filter(m=>m.cat==='Energy Efficiency'&&m.year<=2030).reduce((s,m)=>s+m.reduction,0), color: CAT_COLOR['Energy Efficiency'], isReduction: true },
    { name: 'Renewables', val: MEASURES.filter(m=>m.cat==='Renewable Energy'&&m.year<=2030).reduce((s,m)=>s+m.reduction,0), color: CAT_COLOR['Renewable Energy'], isReduction: true },
    { name: 'Electrification', val: MEASURES.filter(m=>m.cat==='Process Electrification'&&m.year<=2030).reduce((s,m)=>s+m.reduction,0), color: CAT_COLOR['Process Electrification'], isReduction: true },
    { name: 'Fuel Switch', val: MEASURES.filter(m=>m.cat==='Fuel Switching'&&m.year<=2030).reduce((s,m)=>s+m.reduction,0), color: CAT_COLOR['Fuel Switching'], isReduction: true },
    { name: '2030 Projected', val: projected, color: T.textSec },
    { name: 'SBTi Target', val: target2030, color: T.green },
  ];

  const gapMeasures = [
    { option:'Additional Efficiency Measures', reduction:30, cost:'$180M', feasibility:'High' },
    { option:'Accelerated Renewable PPA', reduction:20, cost:'$0 capex', feasibility:'High' },
    { option:'Process Electrification Phase 2', reduction:15, cost:'$220M', feasibility:'Medium' },
    { option:'Voluntary Carbon Removals (ITC)', reduction:25, cost:'$3.75M/yr', feasibility:'High' },
    { option:'Scope 3 Supplier Acceleration', reduction:10, cost:'$50M', feasibility:'Medium' },
  ];

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:24 }}>
        <KpiCard label="2019 Scope 1+2 Baseline" value={`${fmt0(base12)} ktCO2e`} sub="820 Scope 1 + 340 Scope 2" accent={T.navy} />
        <KpiCard label="2030 Planned Trajectory" value={`${fmt0(projected)} ktCO2e`} sub={`-${((base12-projected)/base12*100).toFixed(1)}% vs. 2019`} accent={T.gold} />
        <KpiCard label="Residual Gap to SBTi" value={`${fmt0(Math.max(0,residual))} ktCO2e`} sub={`${target2030} ktCO2e SBTi target`} accent={T.red} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:20, boxShadow:T.card }}>
          <SectionHeader title="Waterfall: Base to 2030 Projection" subtitle="Scope 1+2 ktCO2e — 2030 measures only" />
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={simpleData} margin={{ top:5, right:10, left:0, bottom:30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize:9, fill:T.textSec }} angle={-25} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize:10, fill:T.textSec }} />
              <Tooltip formatter={(v, n, p) => [`${fmt0(Math.abs(v))} ktCO2e`, p.payload.isReduction ? 'Reduction' : 'Emissions']} />
              <Bar dataKey="val" radius={[3,3,0,0]}>
                {simpleData.map((d, i) => (
                  <Cell key={i} fill={d.color} opacity={d.isReduction ? 0.85 : 1} />
                ))}
              </Bar>
              <ReferenceLine y={target2030} stroke={T.green} strokeDasharray="5 3" label={{ value:'SBTi Target', position:'right', fontSize:9, fill:T.green }} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:20, boxShadow:T.card }}>
          <SectionHeader title="Gap Decomposition" subtitle="Contribution of each category to 2030 reduction" />
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {[
              { cat:'Energy Efficiency',       red: MEASURES.filter(m=>m.cat==='Energy Efficiency'&&m.year<=2030).reduce((s,m)=>s+m.reduction,0) },
              { cat:'Renewable Energy',         red: MEASURES.filter(m=>m.cat==='Renewable Energy'&&m.year<=2030).reduce((s,m)=>s+m.reduction,0) },
              { cat:'Process Electrification',  red: MEASURES.filter(m=>m.cat==='Process Electrification'&&m.year<=2030).reduce((s,m)=>s+m.reduction,0) },
              { cat:'Fuel Switching',           red: MEASURES.filter(m=>m.cat==='Fuel Switching'&&m.year<=2030).reduce((s,m)=>s+m.reduction,0) },
            ].map((r, i) => {
              const pct = (r.red / (base12 - target2030) * 100).toFixed(0);
              return (
                <div key={i}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                    <span style={{ fontSize:11, color:T.textSec }}>{r.cat}</span>
                    <span style={{ fontSize:11, fontWeight:600, color:CAT_COLOR[r.cat] }}>{r.red} ktCO2e ({pct}%)</span>
                  </div>
                  <div style={{ height:6, borderRadius:99, background:T.border }}>
                    <div style={{ height:6, borderRadius:99, background:CAT_COLOR[r.cat], width:`${Math.min(+pct,100)}%` }} />
                  </div>
                </div>
              );
            })}
            <div style={{ marginTop:8, padding:'10px 14px', borderRadius:8, background:T.red+'10', border:`1px solid ${T.red}30` }}>
              <div style={{ fontSize:12, fontWeight:700, color:T.red }}>Residual gap: {fmt0(Math.max(0, residual))} ktCO2e</div>
              <div style={{ fontSize:11, color:T.textSec, marginTop:2 }}>{Math.max(0,residual) > 0 ? 'Additional measures or removals required to close.' : 'On track for SBTi 2030 target.'}</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:20, boxShadow:T.card }}>
        <SectionHeader title="Options to Close Residual Gap" subtitle="Ranked by feasibility and cost-effectiveness" />
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:T.surfaceH }}>
              {['Option','Potential Reduction (ktCO2e)','Est. Cost','Feasibility'].map(h => (
                <th key={h} style={{ padding:'8px 14px', textAlign:'left', fontSize:11, fontWeight:600, color:T.textSec, borderBottom:`1px solid ${T.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {gapMeasures.map((g, i) => (
              <tr key={i} style={{ borderBottom:`1px solid ${T.border}` }}>
                <td style={{ padding:'10px 14px', fontSize:12, color:T.text, fontWeight:500 }}>{g.option}</td>
                <td style={{ padding:'10px 14px', fontSize:12, color:T.sage, fontWeight:700 }}>{g.reduction}</td>
                <td style={{ padding:'10px 14px', fontSize:12, color:T.textSec }}>{g.cost}</td>
                <td style={{ padding:'10px 14px' }}>
                  <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:99,
                    color: g.feasibility==='High' ? T.green : T.amber,
                    background: g.feasibility==='High' ? '#f0fdf4' : '#fffbeb',
                    border: `1px solid ${g.feasibility==='High' ? T.green : T.amber}40`
                  }}>{g.feasibility}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────────────────────── */
const TABS = [
  { id:'overview',   label:'Roadmap Overview'  },
  { id:'measures',   label:'Measure Library'   },
  { id:'investment', label:'Investment Plan'   },
  { id:'milestones', label:'Milestone Tracker' },
  { id:'gaps',       label:'Gap Analysis'      },
];

export default function DecarbonisationRoadmapPage() {
  const [tab, setTab] = useState('overview');

  return (
    <div style={{ background:T.bg, minHeight:'100vh', fontFamily:T.font, color:T.text }}>
      {/* Header */}
      <div style={{ background:T.surface, borderBottom:`1px solid ${T.border}`, padding:'20px 32px', boxShadow:'0 1px 3px rgba(27,58,92,0.06)' }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
              <div style={{ width:8, height:28, borderRadius:3, background:T.sage }} />
              <span style={{ fontSize:11, fontWeight:700, color:T.sage, textTransform:'uppercase', letterSpacing:'0.08em' }}>EP-AI2</span>
            </div>
            <h1 style={{ margin:0, fontSize:22, fontWeight:800, color:T.navy, lineHeight:1.2 }}>
              Corporate Decarbonisation Roadmap Builder
            </h1>
            <div style={{ fontSize:12, color:T.textSec, marginTop:4 }}>
              GlobalManufacturing Corp — Multi-year pathway planning and milestone tracking
            </div>
          </div>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap', justifyContent:'flex-end' }}>
            <div style={{ textAlign:'center', padding:'8px 16px', background:T.navy, borderRadius:8 }}>
              <div style={{ fontSize:11, color:'#adbdce' }}>Base Year</div>
              <div style={{ fontSize:14, fontWeight:700, color:'#fff' }}>2019</div>
            </div>
            <div style={{ textAlign:'center', padding:'8px 16px', background:T.sage+'18', border:`1px solid ${T.sage}40`, borderRadius:8 }}>
              <div style={{ fontSize:11, color:T.textSec }}>SBTi Status</div>
              <div style={{ fontSize:14, fontWeight:700, color:T.sage }}>Committed</div>
            </div>
            <div style={{ textAlign:'center', padding:'8px 16px', background:T.gold+'18', border:`1px solid ${T.gold}40`, borderRadius:8 }}>
              <div style={{ fontSize:11, color:T.textSec }}>Framework</div>
              <div style={{ fontSize:14, fontWeight:700, color:T.gold }}>ACA 1.5°C</div>
            </div>
          </div>
        </div>

        {/* Company snapshot */}
        <div style={{ display:'flex', gap:20, marginTop:16, paddingTop:16, borderTop:`1px solid ${T.border}`, flexWrap:'wrap' }}>
          {[
            { label:'Scope 1 (2019)', val:'820 ktCO2e' },
            { label:'Scope 2 (2019)', val:'340 ktCO2e' },
            { label:'Scope 3 (2019)', val:'4200 ktCO2e' },
            { label:'Total GHG (2019)', val:'5360 ktCO2e' },
            { label:'2030 S1+S2 Target', val:'-46%' },
            { label:'Net-Zero Year', val:'2048' },
          ].map((item, i) => (
            <div key={i} style={{ fontSize:11 }}>
              <span style={{ color:T.textMut }}>{item.label}: </span>
              <span style={{ color:T.text, fontWeight:700 }}>{item.val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ background:T.surface, borderBottom:`1px solid ${T.border}`, padding:'0 32px', display:'flex', gap:0 }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding:'12px 20px',
              border:'none', borderBottom: tab===t.id ? `2px solid ${T.sage}` : '2px solid transparent',
              background:'transparent',
              color: tab===t.id ? T.sage : T.textSec,
              fontWeight: tab===t.id ? 700 : 500,
              fontSize: 13,
              cursor:'pointer',
              fontFamily: T.font,
              transition:'all 0.15s',
              whiteSpace:'nowrap',
            }}
          >{t.label}</button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ padding:'24px 32px' }}>
        {tab === 'overview'   && <RoadmapOverview />}
        {tab === 'measures'   && <MeasureLibrary />}
        {tab === 'investment' && <InvestmentPlan />}
        {tab === 'milestones' && <MilestoneTracker />}
        {tab === 'gaps'       && <GapAnalysis />}
      </div>

      {/* Footer */}
      <div style={{ padding:'16px 32px', borderTop:`1px solid ${T.border}`, fontSize:11, color:T.textMut, display:'flex', justifyContent:'space-between' }}>
        <span>EP-AI2 — Corporate Decarbonisation Roadmap Builder | GlobalManufacturing Corp | Data as at FY2025</span>
        <span>SBTi ACA 1.5°C pathway | GHG Protocol aligned</span>
      </div>
    </div>
  );
}
