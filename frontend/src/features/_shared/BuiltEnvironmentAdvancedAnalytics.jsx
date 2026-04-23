import React, { useMemo, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts';

// ─── Deterministic PRNG ─────────────────────────────────────────────────────
const sr = s => { const x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

// ─── Theme normaliser ────────────────────────────────────────────────────────
const nT = (t = {}) => ({
  bg: t.bg || '#F8F6F0', surface: t.surface || '#FFFFFF', surfaceH: t.surfaceH || '#F1EDE4',
  border: t.border || '#E2DED5', borderL: t.borderL || '#EDE9E0',
  navy: t.navy || '#1E3A5F', navyL: t.navyL || '#2D5282',
  gold: t.gold || '#B8860B', goldL: t.goldL || '#D4A017',
  sage: t.sage || '#4D7C5F', sageL: t.sageL || '#6AAD84', teal: t.teal || '#0F766E',
  text: t.text || '#1A1A2E', textSec: t.textSec || '#6B7280', textMut: t.textMut || '#9CA3AF',
  red: t.red || '#DC2626', green: t.green || '#16A34A', amber: t.amber || '#D97706',
  font: t.font || 'DM Sans, sans-serif', mono: t.mono || 'JetBrains Mono, monospace',
  ...t,
});

// ─── CRREM Pathways — Carbon intensity (kgCO₂e/m²/yr) ──────────────────────
const CRREM_PATHS = {
  Office:        { 2025: 42, 2030: 28, 2035: 18, 2040: 10, 2045: 5, 2050: 0 },
  Retail:        { 2025: 38, 2030: 24, 2035: 14, 2040: 8,  2045: 3, 2050: 0 },
  Residential:   { 2025: 30, 2030: 20, 2035: 12, 2040: 6,  2045: 2, 2050: 0 },
  Industrial:    { 2025: 65, 2030: 45, 2035: 28, 2040: 16, 2045: 7, 2050: 0 },
  Hotel:         { 2025: 55, 2030: 36, 2035: 22, 2040: 12, 2045: 5, 2050: 0 },
  DataCenter:    { 2025: 180, 2030: 110, 2035: 65, 2040: 35, 2045: 15, 2050: 0 },
};

// ─── Asset portfolio (seeded) ────────────────────────────────────────────────
const ASSETS = Array.from({ length: 32 }, (_, i) => {
  const types = ['Office', 'Retail', 'Residential', 'Industrial', 'Hotel', 'DataCenter'];
  const cities = ['London', 'Paris', 'Frankfurt', 'Amsterdam', 'Madrid', 'Warsaw', 'Stockholm', 'Singapore'];
  const type = types[i % types.length];
  const baseCI = CRREM_PATHS[type][2025];
  return {
    id: `A${String(i + 1).padStart(3, '0')}`,
    name: `${cities[i % cities.length]} ${type} ${String.fromCharCode(65 + (i % 5))}`,
    type,
    city: cities[i % cities.length],
    area: Math.round(1500 + sr(i * 11) * 12000),
    currentCI: +(baseCI * (0.7 + sr(i * 7) * 0.9)).toFixed(1),
    epcRating: ['A', 'B', 'C', 'D', 'E', 'F', 'G'][Math.floor(sr(i * 3 + 1) * 7)],
    age: Math.round(1970 + sr(i * 13) * 50),
    value: +(sr(i * 5) * 180 + 20).toFixed(1),
    physRiskScore: +(sr(i * 17 + 2) * 100).toFixed(0),
    retrofitCost: +(sr(i * 9 + 4) * 1500 + 300).toFixed(0),
    greenPremium: +(sr(i * 19 + 6) * 8 + 1).toFixed(1),
  };
});

// ─── Physical hazard types ───────────────────────────────────────────────────
const HAZARDS = [
  { id: 'heat',    label: 'Extreme Heat',   color: '#ef4444' },
  { id: 'flood',   label: 'Fluvial Flood',  color: '#3b82f6' },
  { id: 'coastal', label: 'Coastal Inundation', color: '#1d4ed8' },
  { id: 'wind',    label: 'Wind / Storm',   color: '#6b7280' },
  { id: 'drought', label: 'Drought',        color: '#d97706' },
  { id: 'wildfire',label: 'Wildfire',       color: '#f97316' },
];

// ─── Retrofit measures ───────────────────────────────────────────────────────
const RETROFITS = [
  { id: 'insulation', label: 'Insulation upgrade',      capex: 45, ciReduction: 22, payback: 8  },
  { id: 'hvac',       label: 'HVAC replacement (HP)',   capex: 85, ciReduction: 35, payback: 11 },
  { id: 'glazing',    label: 'Triple glazing',          capex: 65, ciReduction: 14, payback: 14 },
  { id: 'pv',         label: 'Rooftop PV (100kWp)',     capex: 90, ciReduction: 18, payback: 9  },
  { id: 'bms',        label: 'Smart BMS / controls',   capex: 30, ciReduction: 12, payback: 5  },
  { id: 'lighting',   label: 'LED + daylight sensors', capex: 20, ciReduction: 8,  payback: 3  },
  { id: 'evsolar',    label: 'EV charge + solar PPA',  capex: 55, ciReduction: 10, payback: 7  },
  { id: 'greenroof',  label: 'Green roof / wall',      capex: 120, ciReduction: 5, payback: 22 },
];

// ─── Monte Carlo helpers ─────────────────────────────────────────────────────
const mcTriangular = (fn, vars, n = 800) => {
  const out = [];
  for (let i = 0; i < n; i++) {
    const s = {};
    for (const k in vars) {
      const { min, mode, max } = vars[k];
      const u = Math.random();
      const c = (mode - min) / (max - min || 1);
      s[k] = u < c
        ? min + Math.sqrt(u * (max - min) * (mode - min))
        : max - Math.sqrt((1 - u) * (max - min) * (max - mode));
    }
    out.push(fn(s));
  }
  out.sort((a, b) => a - b);
  return { p05: out[Math.floor(n * 0.05)], p50: out[Math.floor(n * 0.50)], p95: out[Math.floor(n * 0.95)], mean: out.reduce((a, v) => a + v, 0) / n, samples: out };
};

// ─── Primitive UI ────────────────────────────────────────────────────────────
const Card = ({ title, children, T, style = {} }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px', ...style }}>
    {title && <div style={{ fontSize: 11, fontFamily: T.mono, fontWeight: 700, color: T.navy, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14, borderBottom: `1px solid ${T.borderL}`, paddingBottom: 8 }}>{title}</div>}
    {children}
  </div>
);

const Kpi = ({ label, value, sub, color, T }) => (
  <div style={{ background: T.surfaceH, border: `1px solid ${T.borderL}`, borderRadius: 6, padding: '12px 16px', minWidth: 140, flex: '1 1 140px' }}>
    <div style={{ fontSize: 10, fontFamily: T.mono, color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.navy, fontFamily: T.mono }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 3 }}>{sub}</div>}
  </div>
);

// ─── Main export ─────────────────────────────────────────────────────────────
export default function BuiltEnvironmentAdvancedAnalytics({ T: Traw, moduleId = 'DE1', moduleName = 'Built Environment' }) {
  const T = nT(Traw);
  const [activeSection, setActiveSection] = useState('crrem');
  const [selType, setSelType] = useState('Office');
  const [selRetrofits, setSelRetrofits] = useState(['insulation', 'hvac', 'pv']);
  const [mcRuns, setMcRuns] = useState(null);

  const SECTIONS = [
    { id: 'crrem',    label: 'CRREM Pathways' },
    { id: 'physical', label: 'Physical Risk' },
    { id: 'retrofit', label: 'Retrofit Economics' },
    { id: 'premium',  label: 'Green Premium' },
    { id: 'climatevar', label: 'Climate VaR' },
    { id: 'netzero',  label: 'Net Zero Roadmap' },
  ];

  const CRREM_YEARS = [2025, 2030, 2035, 2040, 2045, 2050];

  // ── CRREM stranding analysis ───────────────────────────────────────────────
  const crremData = useMemo(() => CRREM_YEARS.map(yr => {
    const row = { year: yr };
    Object.entries(CRREM_PATHS).forEach(([type, path]) => { row[type] = path[yr]; });
    // Avg portfolio CI
    row['Portfolio (avg)'] = +(ASSETS.reduce((sum, a) => sum + a.currentCI * Math.max(0, 1 - (yr - 2025) * 0.03), 0) / ASSETS.length).toFixed(1);
    return row;
  }), []);

  const strandingByType = useMemo(() => Object.keys(CRREM_PATHS).map(type => {
    const typeAssets = ASSETS.filter(a => a.type === type);
    if (!typeAssets.length) return { type, stranded25: 0, stranded35: 0, stranded50: 0 };
    const strand = yr => typeAssets.filter(a => a.currentCI > CRREM_PATHS[type][yr]).length;
    return { type, stranded25: strand(2025), stranded35: strand(2035), stranded50: strand(2050), total: typeAssets.length };
  }), []);

  // ── Physical risk heatmap ─────────────────────────────────────────────────
  const physData = useMemo(() => HAZARDS.map((h, hi) => {
    const row = { hazard: h.label };
    ['2030', '2040', '2050'].forEach(yr => {
      const ssp126 = +(sr(hi * 7 + parseInt(yr) % 10) * 60 + 10).toFixed(0);
      const ssp585 = +(ssp126 * (1.3 + sr(hi * 11 + parseInt(yr) % 10) * 0.5)).toFixed(0);
      row[`${yr} (SSP1-2.6)`] = ssp126;
      row[`${yr} (SSP5-8.5)`] = Math.min(100, ssp585);
    });
    return row;
  }), []);

  const assetPhysRisk = useMemo(() => [...ASSETS]
    .sort((a, b) => b.physRiskScore - a.physRiskScore)
    .slice(0, 15)
    .map((a, i) => ({
      ...a,
      heatRisk:   +(sr(i * 7) * 80 + 20).toFixed(0),
      floodRisk:  +(sr(i * 11 + 1) * 70 + 10).toFixed(0),
      windRisk:   +(sr(i * 13 + 2) * 50 + 10).toFixed(0),
      droughtRisk:+(sr(i * 17 + 3) * 60 + 5).toFixed(0),
    })), []);

  // ── Retrofit economics ────────────────────────────────────────────────────
  const selectedRetrofits = RETROFITS.filter(r => selRetrofits.includes(r.id));
  const totalRetrofitCapex = selectedRetrofits.reduce((s, r) => s + r.capex, 0);
  const totalCiReduction = selectedRetrofits.reduce((s, r) => s + r.ciReduction, 0);
  const avgPayback = selectedRetrofits.length > 0 ? (selectedRetrofits.reduce((s, r) => s + r.payback, 0) / selectedRetrofits.length) : 0;
  const energySaving = totalCiReduction * 0.8;
  const annualSaving = energySaving * 0.12;
  const retrofitIrr = totalRetrofitCapex > 0 && annualSaving > 0 ? (annualSaving / totalRetrofitCapex * 100) : 0;

  const retrofitCashflow = useMemo(() => Array.from({ length: 21 }, (_, yr) => ({
    year: 2025 + yr,
    cumCashflow: yr === 0 ? -totalRetrofitCapex : +(annualSaving * yr - totalRetrofitCapex).toFixed(1),
    annualSaving: yr === 0 ? 0 : +annualSaving.toFixed(1),
  })), [totalRetrofitCapex, annualSaving]);

  const toggleRetrofit = r => setSelRetrofits(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);

  // ── Green premium / brown discount ────────────────────────────────────────
  const greenPremiumData = useMemo(() => {
    const grades = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    return grades.map((g, gi) => {
      const assets = ASSETS.filter(a => a.epcRating === g);
      const avgPrem = assets.length > 0 ? +(assets.reduce((s, a) => s + a.greenPremium, 0) / assets.length).toFixed(1) : 0;
      const color = gi < 2 ? T.green : gi < 4 ? T.amber : T.red;
      return { grade: `EPC ${g}`, assets: assets.length, avgPremium: avgPrem, color };
    });
  }, [T.green, T.amber, T.red]);

  const premiumScatter = useMemo(() => ASSETS.map(a => ({
    x: a.currentCI,
    y: a.value,
    epc: a.epcRating,
    name: a.name,
    fill: ['A', 'B'].includes(a.epcRating) ? T.green : ['C', 'D'].includes(a.epcRating) ? T.amber : T.red,
  })), [T.green, T.amber, T.red]);

  // ── Climate VaR attribution ───────────────────────────────────────────────
  const climateVarData = useMemo(() => ASSETS.slice(0, 12).map((a, i) => {
    const transVaR = +(sr(i * 7 + 1) * 15 + 2).toFixed(1);
    const physVaR  = +(sr(i * 11 + 2) * 12 + 1).toFixed(1);
    const total    = +(transVaR + physVaR).toFixed(1);
    return { name: a.id, transition: transVaR, physical: physVaR, total, type: a.type };
  }), []);

  const vaRSummary = useMemo(() => {
    const sumT = climateVarData.reduce((s, r) => s + r.transition, 0);
    const sumP = climateVarData.reduce((s, r) => s + r.physical, 0);
    const n = climateVarData.length || 1;
    return { avgTotal: +((sumT + sumP) / n).toFixed(1), avgTrans: +(sumT / n).toFixed(1), avgPhys: +(sumP / n).toFixed(1), transShare: +((sumT / (sumT + sumP)) * 100).toFixed(0) };
  }, [climateVarData]);

  // ── Net Zero Roadmap ──────────────────────────────────────────────────────
  const nzRoadmap = useMemo(() => {
    const baseCI = ASSETS.reduce((s, a) => s + a.currentCI, 0) / ASSETS.length;
    return Array.from({ length: 6 }, (_, i) => {
      const yr = 2025 + i * 5;
      const parisPath = CRREM_PATHS[selType][yr] || 0;
      const bau       = +(baseCI * Math.pow(0.98, yr - 2025)).toFixed(1);
      const nzPath    = +(baseCI * Math.pow(1 - 0.15, i)).toFixed(1);
      const capex     = i === 0 ? 0 : +(totalRetrofitCapex * (0.3 + sr(i * 7) * 0.4)).toFixed(0);
      return { year: yr, 'Paris Pathway': parisPath, 'BAU Trajectory': bau, 'NZ Optimised': nzPath, capexM: capex };
    });
  }, [selType, totalRetrofitCapex]);

  // ── MC Retrofit NPV ───────────────────────────────────────────────────────
  const runMC = () => {
    const res = mcTriangular(
      s => {
        let npv = -s.capex;
        for (let yr = 1; yr <= 20; yr++) {
          const save = s.energySave * s.energyPrice * (1 + s.energyEsc / 100);
          const rentPrem = s.area * s.rentPremium;
          npv += (save + rentPrem) / Math.pow(1 + s.discount / 100, yr);
        }
        return +npv.toFixed(0);
      },
      {
        capex:       { min: totalRetrofitCapex * 0.8, mode: totalRetrofitCapex, max: totalRetrofitCapex * 1.4 },
        energySave:  { min: energySaving * 0.7, mode: energySaving, max: energySaving * 1.3 },
        energyPrice: { min: 0.10, mode: 0.16, max: 0.26 },
        energyEsc:   { min: 1,    mode: 3,    max: 6   },
        area:        { min: 1000, mode: 3500,  max: 8000 },
        rentPremium: { min: 0.5,  mode: 2.5,   max: 6.0  },
        discount:    { min: 5,    mode: 7.5,   max: 11   },
      }, 800
    );
    setMcRuns(res);
  };

  const histData = useMemo(() => {
    if (!mcRuns) return [];
    const { samples } = mcRuns;
    const mn = Math.min(...samples), mx = Math.max(...samples);
    const bw = (mx - mn) / 28;
    return Array.from({ length: 28 }, (_, i) => {
      const lo = mn + i * bw, hi = lo + bw;
      return { bin: +((lo + hi) / 2).toFixed(0), count: samples.filter(v => v >= lo && v < hi).length };
    });
  }, [mcRuns]);

  const typeColors = { Office: T.navy, Retail: T.amber, Residential: T.teal, Industrial: T.textSec, Hotel: T.sage, DataCenter: T.red };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontFamily: T.font }}>

      {/* Sub-section nav */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)} style={{ padding: '7px 14px', borderRadius: 6, border: `1px solid ${activeSection === s.id ? T.navy : T.border}`, background: activeSection === s.id ? T.navy : T.surface, color: activeSection === s.id ? '#fff' : T.textSec, fontFamily: T.font, fontSize: 12, fontWeight: activeSection === s.id ? 600 : 400, cursor: 'pointer' }}>{s.label}</button>
        ))}
      </div>

      {/* ── CRREM Pathways ────────────────────────────────────────────────── */}
      {activeSection === 'crrem' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {Object.keys(CRREM_PATHS).map(t => (
              <button key={t} onClick={() => setSelType(t)} style={{ padding: '6px 12px', borderRadius: 5, border: `1px solid ${selType === t ? T.navy : T.border}`, background: selType === t ? T.navy : T.surface, color: selType === t ? '#fff' : T.textSec, fontFamily: T.font, fontSize: 11, cursor: 'pointer' }}>{t}</button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Kpi T={T} label={`${selType} CRREM 2030`} value={`${CRREM_PATHS[selType][2030]} kgCO₂e/m²`} sub="Paris-aligned pathway" color={T.navy} />
            <Kpi T={T} label={`${selType} CRREM 2050`} value={`${CRREM_PATHS[selType][2050]} kgCO₂e/m²`} sub="Net zero target" color={T.green} />
            <Kpi T={T} label="Stranded @ 2035" value={`${strandingByType.find(r => r.type === selType)?.stranded35 || 0} assets`} sub="Above CRREM threshold" color={T.red} />
            <Kpi T={T} label="Portfolio Avg CI" value={`${(ASSETS.reduce((s, a) => s + a.currentCI, 0) / ASSETS.length).toFixed(1)} kgCO₂/m²`} sub="Current (2025)" color={T.amber} />
          </div>

          <Card T={T} title="CRREM Decarbonisation Pathways vs Portfolio Trajectory (kgCO₂e/m²/yr)">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={crremData} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="year" tick={{ fontSize: 11, fontFamily: T.mono }} />
                <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} unit=" kg" />
                <Tooltip formatter={(v, name) => [`${v} kgCO₂e/m²`, name]} />
                <Legend />
                {Object.keys(CRREM_PATHS).map(type => (
                  <Line key={type} dataKey={type} stroke={typeColors[type] || T.navy} strokeWidth={type === selType ? 2.5 : 1} strokeDasharray={type === selType ? undefined : '4 2'} dot={false} />
                ))}
                <Line dataKey="Portfolio (avg)" stroke={T.red} strokeWidth={2} strokeDasharray="6 3" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card T={T} title="Stranding Risk by Asset Type — CRREM Threshold Crossings">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={strandingByType} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="type" tick={{ fontSize: 10, fontFamily: T.mono }} />
                <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="stranded25" name="Stranded 2025" fill={T.amber} />
                <Bar dataKey="stranded35" name="Stranded 2035" fill={T.red} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* ── Physical Risk ─────────────────────────────────────────────────── */}
      {activeSection === 'physical' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Kpi T={T} label="High Risk Assets (>70)" value={ASSETS.filter(a => a.physRiskScore > 70).length} sub="Physical risk score" color={T.red} />
            <Kpi T={T} label="Avg Physical Risk" value={`${Math.round(ASSETS.reduce((s, a) => s + a.physRiskScore, 0) / ASSETS.length)}/100`} sub="Portfolio average" color={T.amber} />
            <Kpi T={T} label="At Risk AUM" value={`€${(ASSETS.filter(a => a.physRiskScore > 70).reduce((s, a) => s + a.value, 0)).toFixed(0)}M`} sub=">70 risk score" color={T.navy} />
          </div>

          <Card T={T} title="Multi-Hazard Physical Risk — SSP1-2.6 vs SSP5-8.5 (2030–2050)">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr style={{ background: T.surfaceH }}>
                  {['Hazard', '2030 (SSP1-2.6)', '2030 (SSP5-8.5)', '2040 (SSP1-2.6)', '2040 (SSP5-8.5)', '2050 (SSP1-2.6)', '2050 (SSP5-8.5)'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontFamily: T.mono, fontSize: 10, color: T.navy, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{physData.map((r, i) => (
                  <tr key={r.hazard} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                    <td style={{ padding: '7px 12px', fontWeight: 600 }}>{HAZARDS[i]?.label}</td>
                    {['2030 (SSP1-2.6)', '2030 (SSP5-8.5)', '2040 (SSP1-2.6)', '2040 (SSP5-8.5)', '2050 (SSP1-2.6)', '2050 (SSP5-8.5)'].map(col => {
                      const val = r[col] || 0;
                      const color = val > 70 ? T.red : val > 40 ? T.amber : T.green;
                      return (
                        <td key={col} style={{ padding: '7px 12px', fontFamily: T.mono, color }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 40, height: 6, background: T.borderL, borderRadius: 3 }}>
                              <div style={{ width: `${val}%`, height: 6, background: color, borderRadius: 3 }} />
                            </div>
                            {val}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </Card>

          <Card T={T} title="Top 15 Highest Physical Risk Assets">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr style={{ background: T.surfaceH }}>
                  {['Asset ID', 'Name', 'Type', 'City', 'Overall Score', 'Heat Risk', 'Flood Risk', 'Wind Risk', 'Value €M'].map(h => (
                    <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontFamily: T.mono, fontSize: 10, color: T.navy, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{assetPhysRisk.map((a, i) => (
                  <tr key={a.id} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                    <td style={{ padding: '6px 10px', fontFamily: T.mono }}>{a.id}</td>
                    <td style={{ padding: '6px 10px', fontSize: 11 }}>{a.name}</td>
                    <td style={{ padding: '6px 10px', fontSize: 11 }}>{a.type}</td>
                    <td style={{ padding: '6px 10px', fontSize: 11, color: T.textSec }}>{a.city}</td>
                    <td style={{ padding: '6px 10px', fontFamily: T.mono, fontWeight: 700, color: a.physRiskScore > 70 ? T.red : a.physRiskScore > 40 ? T.amber : T.green }}>{a.physRiskScore}</td>
                    <td style={{ padding: '6px 10px', fontFamily: T.mono, color: a.heatRisk > 60 ? T.red : T.text }}>{a.heatRisk}</td>
                    <td style={{ padding: '6px 10px', fontFamily: T.mono, color: a.floodRisk > 50 ? T.red : T.text }}>{a.floodRisk}</td>
                    <td style={{ padding: '6px 10px', fontFamily: T.mono }}>{a.windRisk}</td>
                    <td style={{ padding: '6px 10px', fontFamily: T.mono }}>€{a.value}M</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ── Retrofit Economics ────────────────────────────────────────────── */}
      {activeSection === 'retrofit' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Card T={T} title="Select Retrofit Measures (toggle to build package)">
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {RETROFITS.map(r => (
                <button key={r.id} onClick={() => toggleRetrofit(r.id)} style={{ padding: '8px 14px', borderRadius: 6, border: `1px solid ${selRetrofits.includes(r.id) ? T.teal : T.border}`, background: selRetrofits.includes(r.id) ? `${T.teal}15` : T.surface, color: selRetrofits.includes(r.id) ? T.teal : T.textSec, fontFamily: T.font, fontSize: 12, cursor: 'pointer' }}>
                  {r.label} <span style={{ fontFamily: T.mono, fontSize: 10 }}>€{r.capex}/m²</span>
                </button>
              ))}
            </div>
          </Card>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Kpi T={T} label="Total Capex" value={`€${totalRetrofitCapex}/m²`} sub="Selected package" color={T.navy} />
            <Kpi T={T} label="CI Reduction" value={`-${totalCiReduction} kgCO₂/m²`} sub="Vs current intensity" color={T.green} />
            <Kpi T={T} label="Avg Payback" value={`${avgPayback.toFixed(1)} yrs`} sub="Simple payback" color={T.amber} />
            <Kpi T={T} label="Est. IRR" value={`${retrofitIrr.toFixed(1)}%`} sub="20-yr unlevered" color={retrofitIrr > 8 ? T.green : T.red} />
            <Kpi T={T} label="Annual Saving" value={`€${annualSaving.toFixed(1)}/m²`} sub="Energy + rent premium" color={T.teal} />
          </div>

          <Card T={T} title="Cumulative Cash Flow — Retrofit Package (€/m², 2025–2045)">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={retrofitCashflow} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="year" tick={{ fontSize: 11, fontFamily: T.mono }} />
                <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} unit="€" />
                <Tooltip formatter={v => [`€${v}/m²`]} />
                <ReferenceLine y={0} stroke={T.red} strokeDasharray="4 2" />
                <Area dataKey="cumCashflow" name="Cumulative cashflow" stroke={T.teal} fill={`${T.teal}20`} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          <Card T={T} title="Retrofit Measures — Cost vs Carbon Reduction Benchmark">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr style={{ background: T.surfaceH }}>
                  {['Measure', 'Capex €/m²', 'CI Reduction kg/m²', 'Simple Payback', 'Cost/Carbon €/kg', 'Status'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontFamily: T.mono, fontSize: 10, color: T.navy, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{RETROFITS.map((r, i) => {
                  const selected = selRetrofits.includes(r.id);
                  const costPerCarbon = r.ciReduction > 0 ? (r.capex / r.ciReduction).toFixed(1) : '—';
                  return (
                    <tr key={r.id} style={{ background: selected ? `${T.teal}08` : i % 2 === 0 ? T.surface : T.surfaceH }}>
                      <td style={{ padding: '7px 12px', fontWeight: selected ? 700 : 400 }}>{r.label}</td>
                      <td style={{ padding: '7px 12px', fontFamily: T.mono }}>€{r.capex}</td>
                      <td style={{ padding: '7px 12px', fontFamily: T.mono, color: T.green }}>-{r.ciReduction}</td>
                      <td style={{ padding: '7px 12px', fontFamily: T.mono, color: r.payback <= 8 ? T.green : r.payback <= 14 ? T.amber : T.red }}>{r.payback} yrs</td>
                      <td style={{ padding: '7px 12px', fontFamily: T.mono }}>€{costPerCarbon}</td>
                      <td style={{ padding: '7px 12px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 3, fontSize: 10, fontWeight: 600, background: selected ? `${T.teal}20` : T.surfaceH, color: selected ? T.teal : T.textSec }}>{selected ? '✓ Selected' : 'Available'}</span>
                      </td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
          </Card>

          {/* Monte Carlo retrofit NPV */}
          <Card T={T} title="Monte Carlo Retrofit NPV — Triangular Sampling (800 runs)">
            {!mcRuns ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <button onClick={runMC} style={{ padding: '10px 28px', background: T.navy, color: '#fff', border: 'none', borderRadius: 6, fontFamily: T.font, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Run Monte Carlo</button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
                  <Kpi T={T} label="P5 NPV" value={`€${mcRuns.p05.toFixed(0)}/m²`} sub="Downside" color={T.red} />
                  <Kpi T={T} label="Median NPV" value={`€${mcRuns.p50.toFixed(0)}/m²`} sub="Base case" color={T.navy} />
                  <Kpi T={T} label="P95 NPV" value={`€${mcRuns.p95.toFixed(0)}/m²`} sub="Upside" color={T.green} />
                  <Kpi T={T} label="% Positive" value={`${((mcRuns.samples.filter(v => v > 0).length / mcRuns.samples.length) * 100).toFixed(0)}%`} sub="NPV > 0" color={T.teal} />
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={histData} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="bin" tick={{ fontSize: 10, fontFamily: T.mono }} unit="€" />
                    <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} />
                    <ReferenceLine x={0} stroke={T.red} strokeDasharray="4 2" />
                    <Bar dataKey="count" name="Simulations" fill={T.teal} radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </>
            )}
          </Card>
        </div>
      )}

      {/* ── Green Premium / Brown Discount ────────────────────────────────── */}
      {activeSection === 'premium' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Kpi T={T} label="EPC A Green Premium" value={`+${greenPremiumData[0].avgPremium}%`} sub="Avg rent premium" color={T.green} />
            <Kpi T={T} label="EPC E-G Brown Discount" value={`-${(greenPremiumData.slice(4).reduce((s, r) => s + r.avgPremium, 0) / 3).toFixed(1)}%`} sub="Avg rent discount" color={T.red} />
            <Kpi T={T} label="A–G Spread" value={`${(greenPremiumData[0].avgPremium + Math.abs(greenPremiumData[5].avgPremium)).toFixed(1)} pp`} sub="EPC premium/discount spread" color={T.navy} />
          </div>

          <Card T={T} title="Green Premium / Brown Discount by EPC Rating (Avg Rent %)">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={greenPremiumData} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="grade" tick={{ fontSize: 11, fontFamily: T.mono }} />
                <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} unit="%" />
                <Tooltip formatter={v => [`${v}%`, 'Avg Premium/Discount']} />
                <Bar dataKey="avgPremium" name="Green Premium / Brown Discount %" radius={[4, 4, 0, 0]}>
                  {greenPremiumData.map((r, i) => (
                    <rect key={i} fill={r.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card T={T} title="Carbon Intensity vs Asset Value — EPC Rating Scatter">
            <ResponsiveContainer width="100%" height={280}>
              <ScatterChart margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="x" name="Carbon Intensity" unit=" kg/m²" tick={{ fontSize: 10, fontFamily: T.mono }} label={{ value: 'Carbon Intensity (kgCO₂/m²)', position: 'insideBottom', offset: -5, fontSize: 10, fill: T.textSec }} />
                <YAxis dataKey="y" name="Asset Value" unit="M€" tick={{ fontSize: 10, fontFamily: T.mono }} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ payload }) => {
                  if (!payload?.length) return null;
                  const d = payload[0]?.payload;
                  return <div style={{ background: T.surface, border: `1px solid ${T.border}`, padding: '8px 12px', fontSize: 11, fontFamily: T.font }}><div style={{ fontWeight: 600 }}>{d?.name}</div><div>EPC: {d?.epc} · CI: {d?.x} kg/m² · €{d?.y}M</div></div>;
                }} />
                <Scatter data={premiumScatter} fill={T.navy}>
                  {premiumScatter.map((d, i) => (
                    <circle key={i} cx={0} cy={0} r={4} fill={d.fill} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 11, color: T.textSec }}>
              <span><span style={{ color: T.green, fontWeight: 700 }}>●</span> EPC A–B</span>
              <span><span style={{ color: T.amber, fontWeight: 700 }}>●</span> EPC C–D</span>
              <span><span style={{ color: T.red, fontWeight: 700 }}>●</span> EPC E–G</span>
            </div>
          </Card>
        </div>
      )}

      {/* ── Climate VaR Attribution ───────────────────────────────────────── */}
      {activeSection === 'climatevar' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Kpi T={T} label="Portfolio Climate VaR" value={`${vaRSummary.avgTotal}%`} sub="Avg asset-level (95%)" color={T.navy} />
            <Kpi T={T} label="Transition VaR" value={`${vaRSummary.avgTrans}%`} sub="Carbon price / policy risk" color={T.amber} />
            <Kpi T={T} label="Physical VaR" value={`${vaRSummary.avgPhys}%`} sub="Hazard / stranding risk" color={T.red} />
            <Kpi T={T} label="Transition Share" value={`${vaRSummary.transShare}%`} sub="Of total Climate VaR" color={T.teal} />
          </div>

          <Card T={T} title="Climate VaR Attribution — Transition vs Physical Risk (% of Asset Value, 95% CI)">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={climateVarData} margin={{ top: 5, right: 20, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fontFamily: T.mono, angle: -40, textAnchor: 'end' }} />
                <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} unit="%" />
                <Tooltip formatter={v => [`${v}%`, '']} />
                <Legend />
                <Bar dataKey="transition" name="Transition VaR %" stackId="a" fill={T.amber} />
                <Bar dataKey="physical" name="Physical VaR %" stackId="a" fill={T.red} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card T={T} title="Climate VaR by Asset — Detailed Breakdown">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr style={{ background: T.surfaceH }}>
                  {['Asset', 'Type', 'Transition VaR', 'Physical VaR', 'Total Climate VaR', 'Risk Band'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontFamily: T.mono, fontSize: 10, color: T.navy, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{climateVarData.map((r, i) => {
                  const band = r.total > 20 ? 'HIGH' : r.total > 10 ? 'MEDIUM' : 'LOW';
                  const bandColor = { HIGH: T.red, MEDIUM: T.amber, LOW: T.green }[band];
                  return (
                    <tr key={r.name} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                      <td style={{ padding: '7px 12px', fontFamily: T.mono }}>{r.name}</td>
                      <td style={{ padding: '7px 12px', fontSize: 11 }}>{r.type}</td>
                      <td style={{ padding: '7px 12px', fontFamily: T.mono, color: T.amber }}>{r.transition}%</td>
                      <td style={{ padding: '7px 12px', fontFamily: T.mono, color: T.red }}>{r.physical}%</td>
                      <td style={{ padding: '7px 12px', fontFamily: T.mono, fontWeight: 700 }}>{r.total}%</td>
                      <td style={{ padding: '7px 12px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 3, fontSize: 10, fontWeight: 600, background: `${bandColor}20`, color: bandColor }}>{band}</span>
                      </td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ── Net Zero Roadmap ──────────────────────────────────────────────── */}
      {activeSection === 'netzero' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {Object.keys(CRREM_PATHS).map(t => (
              <button key={t} onClick={() => setSelType(t)} style={{ padding: '6px 12px', borderRadius: 5, border: `1px solid ${selType === t ? T.navy : T.border}`, background: selType === t ? T.navy : T.surface, color: selType === t ? '#fff' : T.textSec, fontFamily: T.font, fontSize: 11, cursor: 'pointer' }}>{t}</button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Kpi T={T} label="Required CI Drop by 2030" value={`${((ASSETS.reduce((s, a) => s + a.currentCI, 0) / ASSETS.length - CRREM_PATHS[selType][2030]) / (ASSETS.reduce((s, a) => s + a.currentCI, 0) / ASSETS.length) * 100).toFixed(0)}%`} sub="Vs 2025 portfolio avg" color={T.navy} />
            <Kpi T={T} label="Total Capex Required" value={`€${totalRetrofitCapex}/m²`} sub="Selected retrofit package" color={T.amber} />
            <Kpi T={T} label="Net Zero Target" value="2050" sub="Paris 1.5°C aligned" color={T.green} />
          </div>

          <Card T={T} title={`Net Zero Decarbonisation Roadmap — ${selType} (kgCO₂e/m²/yr)`}>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={nzRoadmap} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="year" tick={{ fontSize: 11, fontFamily: T.mono }} />
                <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} unit=" kg" />
                <Tooltip formatter={(v, name) => [`${v} kgCO₂/m²`, name]} />
                <Legend />
                <Line dataKey="Paris Pathway" stroke={T.green} strokeWidth={2.5} dot={{ r: 4, fill: T.green }} />
                <Line dataKey="BAU Trajectory" stroke={T.red} strokeWidth={1.5} strokeDasharray="5 3" dot={false} />
                <Line dataKey="NZ Optimised" stroke={T.navy} strokeWidth={2} dot={{ r: 3, fill: T.navy }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card T={T} title="Decarbonisation Capex Schedule (€/m², 5-yr tranches)">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={nzRoadmap.filter(r => r.capexM > 0)} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="year" tick={{ fontSize: 11, fontFamily: T.mono }} />
                <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} unit="€" />
                <Tooltip formatter={v => [`€${v}/m²`, 'Retrofit Capex']} />
                <Bar dataKey="capexM" name="Capex €/m²" fill={T.navy} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card T={T} title="Net Zero Action Plan — Key Milestones">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { yr: '2025', action: 'Baseline carbon intensity audit + EPC assessment for all assets', status: 'complete', color: T.green },
                { yr: '2026', action: 'Deploy LED + BMS + smart metering across portfolio (quick wins)', status: 'complete', color: T.green },
                { yr: '2027', action: 'Begin HVAC upgrades and insulation retrofit — highest CI assets first', status: 'in-progress', color: T.amber },
                { yr: '2028', action: 'Rooftop PV installations + EV charging infrastructure rollout', status: 'planned', color: T.textSec },
                { yr: '2030', action: 'Achieve CRREM 2030 pathway threshold — full Paris 1.5°C alignment', status: 'planned', color: T.textSec },
                { yr: '2035', action: 'Residual Scope 1/2 emissions offset via certified carbon credits', status: 'planned', color: T.textSec },
                { yr: '2040', action: 'Portfolio net zero operations; begin Scope 3 (embodied carbon) programme', status: 'planned', color: T.textSec },
                { yr: '2050', action: 'Full lifecycle net zero — embodied + operational carbon aligned to GRESB', status: 'planned', color: T.textSec },
              ].map((m, i) => (
                <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '10px 14px', background: T.surfaceH, borderRadius: 6, border: `1px solid ${T.borderL}` }}>
                  <div style={{ fontFamily: T.mono, fontWeight: 700, color: T.navy, minWidth: 40 }}>{m.yr}</div>
                  <div style={{ flex: 1, fontSize: 12 }}>{m.action}</div>
                  <span style={{ padding: '2px 8px', borderRadius: 3, fontSize: 10, fontWeight: 600, background: `${m.color}20`, color: m.color, whiteSpace: 'nowrap' }}>{m.status}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
