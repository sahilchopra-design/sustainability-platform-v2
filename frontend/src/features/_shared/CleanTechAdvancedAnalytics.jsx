import React, { useMemo, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
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

// ─── Wright's Law learning rates by technology ──────────────────────────────
const LEARNING_RATES = {
  'Solar PV':        { lr: 0.23, base2024: 28,  unit: '$/W', color: '#f59e0b' },
  'Onshore Wind':    { lr: 0.12, base2024: 32,  unit: '$/MWh', color: '#3b82f6' },
  'Offshore Wind':   { lr: 0.16, base2024: 85,  unit: '$/MWh', color: '#1d4ed8' },
  'Green Hydrogen':  { lr: 0.18, base2024: 4.5, unit: '$/kg', color: '#10b981' },
  'Li-Ion BESS':     { lr: 0.21, base2024: 140, unit: '$/kWh', color: '#8b5cf6' },
  'Carbon Capture':  { lr: 0.14, base2024: 120, unit: '$/tCO₂', color: '#6b7280' },
  'EV Battery':      { lr: 0.20, base2024: 130, unit: '$/kWh', color: '#ef4444' },
  'Solid-State EV':  { lr: 0.25, base2024: 340, unit: '$/kWh', color: '#f97316' },
  'Electrolysis':    { lr: 0.19, base2024: 900, unit: '$/kW', color: '#06b6d4' },
  'Fuel Cell (PEM)': { lr: 0.20, base2024: 1200, unit: '$/kW', color: '#84cc16' },
};

// ─── IRA / EU Green Deal / India PLI policy baselines ───────────────────────
const POLICY_LEVERS = [
  { id: 'ira45q',  label: 'US 45Q (CCS)',         value: 85,  unit: '$/tCO₂',  flag: '🇺🇸' },
  { id: 'ira45v',  label: 'US 45V (H₂ PTC)',      value: 3.0, unit: '$/kg H₂', flag: '🇺🇸' },
  { id: 'ira48c',  label: 'US 48C (CleanTech ITC)', value: 30, unit: '% ITC',  flag: '🇺🇸' },
  { id: 'euaid',   label: 'EU State Aid (IPCEI)',  value: 45,  unit: '% grant', flag: '🇪🇺' },
  { id: 'euetshyd',label: 'EU ETS H₂ Premium',     value: 2.8, unit: '€/kg',   flag: '🇪🇺' },
  { id: 'inpli',   label: 'India PLI — ACC BESS',  value: 18100, unit: '₹ Cr total', flag: '🇮🇳' },
  { id: 'inplih2', label: 'India NGHM — H₂',       value: 19744, unit: '₹ Cr total', flag: '🇮🇳' },
  { id: 'ukcfds',  label: 'UK CfD (Offshore)',     value: 44,  unit: '£/MWh',  flag: '🇬🇧' },
];

// ─── NGFS / IEA carbon price scenarios ──────────────────────────────────────
const SCENARIOS = {
  'Net Zero 2050':       { 2025: 85, 2030: 160, 2035: 240, 2040: 310, 2045: 385, 2050: 450 },
  'Divergent NZ':        { 2025: 40, 2030: 195, 2035: 330, 2040: 460, 2045: 560, 2050: 640 },
  'Delayed Transition':  { 2025: 15, 2030: 90,  2035: 220, 2040: 350, 2045: 470, 2050: 600 },
  'Current Policies':    { 2025: 15, 2030: 38,  2035: 55,  2040: 80,  2045: 110, 2050: 150 },
  'IEA NZE':             { 2025: 90, 2030: 130, 2035: 185, 2040: 250, 2045: 315, 2050: 380 },
  'STEPS':               { 2025: 20, 2030: 48,  2035: 72,  2040: 98,  2045: 125, 2050: 155 },
};

// ─── Technology maturity dashboard ──────────────────────────────────────────
const TRL_BENCH = [
  { tech: 'Solar PV (Utility)',   trl: 9, commercialYr: 2000, costDown: 99, marketShare: 5.8 },
  { tech: 'Onshore Wind',         trl: 9, commercialYr: 1995, costDown: 72, marketShare: 7.4 },
  { tech: 'Offshore Wind',        trl: 9, commercialYr: 2010, costDown: 60, marketShare: 1.2 },
  { tech: 'Li-Ion BESS (4hr)',    trl: 9, commercialYr: 2015, costDown: 90, marketShare: 0.4 },
  { tech: 'Green Hydrogen',       trl: 7, commercialYr: 2028, costDown: 0,  marketShare: 0.01 },
  { tech: 'Carbon Capture (PCC)', trl: 8, commercialYr: 2017, costDown: 35, marketShare: 0.02 },
  { tech: 'EV (LFP Battery)',     trl: 9, commercialYr: 2018, costDown: 82, marketShare: 3.1 },
  { tech: 'Electrolysis (ALK)',   trl: 9, commercialYr: 2010, costDown: 45, marketShare: 0.05 },
  { tech: 'Solid-State EV',       trl: 5, commercialYr: 2030, costDown: 0,  marketShare: 0.0 },
  { tech: 'DAC (Solid Sorbent)',  trl: 6, commercialYr: 2030, costDown: 15, marketShare: 0.001 },
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

// ─── Primitive UI components ─────────────────────────────────────────────────
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
export default function CleanTechAdvancedAnalytics({ T: Traw, moduleId = 'DF1', moduleName = 'CleanTech' }) {
  const T = nT(Traw);
  const [activeSection, setActiveSection] = useState('learning');
  const [mcRuns, setMcRuns] = useState(null);
  const [selScenario, setSelScenario] = useState('Net Zero 2050');

  const SECTIONS = [
    { id: 'learning',    label: 'Learning Curves' },
    { id: 'policy',      label: 'Policy Sensitivity' },
    { id: 'carbon',      label: 'Carbon Revenue' },
    { id: 'trl',         label: 'Technology Maturity' },
    { id: 'mc',          label: 'Monte Carlo NPV' },
    { id: 'innovation',  label: 'Innovation Pipeline' },
  ];

  // ── Learning curve projections ─────────────────────────────────────────────
  const YEARS = [2024, 2026, 2028, 2030, 2035, 2040, 2045, 2050];
  const cumVolMultiplier = { 2024: 1, 2026: 1.5, 2028: 2.2, 2030: 3.2, 2035: 6.0, 2040: 10, 2045: 16, 2050: 24 };

  const learningData = useMemo(() => YEARS.map(yr => {
    const row = { year: yr };
    Object.entries(LEARNING_RATES).forEach(([tech, { lr, base2024 }]) => {
      const cumMult = cumVolMultiplier[yr];
      row[tech] = +(base2024 * Math.pow(cumMult, -Math.log2(1 - lr))).toFixed(2);
    });
    return row;
  }), []);

  // ── Policy sensitivity tornado ─────────────────────────────────────────────
  const policyImpact = useMemo(() => POLICY_LEVERS.map((p, i) => {
    const base = 12 + sr(i * 13) * 6;
    const uplift = (sr(i * 7 + 3) * 0.4 + 0.1) * base;
    return { ...p, baseIrr: +base.toFixed(1), upliftedIrr: +(base + uplift).toFixed(1), uplift: +uplift.toFixed(1) };
  }), []);

  // ── Carbon revenue overlay ─────────────────────────────────────────────────
  const carbonRevenueData = useMemo(() => {
    const yrs = [2025, 2027, 2029, 2031, 2035, 2040, 2050];
    return yrs.map(yr => {
      const row = { year: yr };
      Object.entries(SCENARIOS).forEach(([s, pts]) => {
        const keys = Object.keys(pts).map(Number).sort((a, b) => a - b);
        const lo = keys.filter(k => k <= yr).pop() || keys[0];
        const hi = keys.filter(k => k >= yr)[0] || keys[keys.length - 1];
        const tInterp = lo === hi ? 0 : (yr - lo) / (hi - lo);
        row[s] = +(pts[lo] + tInterp * (pts[hi] - pts[lo])).toFixed(1);
      });
      return row;
    });
  }, []);

  // ── Monte Carlo NPV ────────────────────────────────────────────────────────
  const runMC = () => {
    const res = mcTriangular(
      s => {
        const capex = s.capex, wacc = s.wacc / 100, rev = s.revenue;
        let npv = -capex;
        for (let yr = 1; yr <= 20; yr++) npv += (rev * (1 - s.opexRatio) * Math.pow(1 + s.revGrowth / 100, yr)) / Math.pow(1 + wacc, yr);
        return +npv.toFixed(0);
      },
      {
        capex:     { min: 80, mode: 120, max: 200 },
        wacc:      { min: 7,  mode: 10,  max: 14  },
        revenue:   { min: 20, mode: 35,  max: 60  },
        opexRatio: { min: 0.20, mode: 0.30, max: 0.45 },
        revGrowth: { min: 2, mode: 5, max: 10 },
      }, 800
    );
    setMcRuns(res);
  };

  const histData = useMemo(() => {
    if (!mcRuns) return [];
    const { samples } = mcRuns;
    const mn = Math.min(...samples), mx = Math.max(...samples);
    const bins = 30, bw = (mx - mn) / bins;
    return Array.from({ length: bins }, (_, i) => {
      const lo = mn + i * bw, hi = lo + bw;
      return { bin: +((lo + hi) / 2).toFixed(0), count: samples.filter(v => v >= lo && v < hi).length };
    });
  }, [mcRuns]);

  // ── Innovation pipeline ────────────────────────────────────────────────────
  const patentData = useMemo(() => [2018, 2019, 2020, 2021, 2022, 2023, 2024].map((yr, i) => ({
    year: yr,
    Solar:     Math.round(4200 + sr(i * 3) * 1800 + i * 600),
    Hydrogen:  Math.round(1800 + sr(i * 7 + 1) * 900 + i * 400),
    BESS:      Math.round(2400 + sr(i * 5 + 2) * 1200 + i * 700),
    CCS:       Math.round(900  + sr(i * 11 + 3) * 500  + i * 120),
    EV:        Math.round(6800 + sr(i * 9 + 4) * 2200 + i * 900),
  })), []);

  const rdSpend = useMemo(() => [
    { entity: 'Solar PV', spend: 18.4, yoy: 12, topFiler: 'LONGi / First Solar' },
    { entity: 'Green H₂', spend: 9.2,  yoy: 34, topFiler: 'Nel / ITM / Plug Power' },
    { entity: 'BESS',      spend: 14.7, yoy: 22, topFiler: 'CATL / Panasonic / Samsung SDI' },
    { entity: 'CCS/CCUS',  spend: 5.1,  yoy: 18, topFiler: 'Shell / TotalEnergies / Equinor' },
    { entity: 'EV Battery',spend: 22.3, yoy: 19, topFiler: 'BYD / CATL / Tesla' },
    { entity: 'Fuel Cell',  spend: 3.8,  yoy: 28, topFiler: 'Ballard / Bloom Energy / Hyundai' },
  ].map((r, i) => ({ ...r, rdi: +(1.5 + sr(i * 13) * 3.5).toFixed(2) })), []);

  const scenarioColors = { 'Net Zero 2050': T.navy, 'Divergent NZ': T.red, 'Delayed Transition': T.amber, 'Current Policies': T.textSec, 'IEA NZE': T.teal, 'STEPS': T.sage };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontFamily: T.font }}>

      {/* Sub-section nav */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)} style={{ padding: '7px 14px', borderRadius: 6, border: `1px solid ${activeSection === s.id ? T.navy : T.border}`, background: activeSection === s.id ? T.navy : T.surface, color: activeSection === s.id ? '#fff' : T.textSec, fontFamily: T.font, fontSize: 12, fontWeight: activeSection === s.id ? 600 : 400, cursor: 'pointer' }}>{s.label}</button>
        ))}
      </div>

      {/* ── Learning Curves ───────────────────────────────────────────────── */}
      {activeSection === 'learning' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Kpi T={T} label="Solar PV 2050 Cost" value={`$${learningData[7]['Solar PV']}/W`} sub="Wright's Law @ 23% LR" color={T.amber} />
            <Kpi T={T} label="Green H₂ 2050 LCOH" value={`$${learningData[7]['Green Hydrogen']}/kg`} sub="From $4.5/kg in 2024" color={T.teal} />
            <Kpi T={T} label="BESS 2050 Cost" value={`$${learningData[7]['Li-Ion BESS']}/kWh`} sub="From $140/kWh in 2024" color={T.sage} />
            <Kpi T={T} label="CCS 2050 Cost" value={`$${learningData[7]['Carbon Capture']}/t`} sub="From $120/t in 2024" color={T.textSec} />
          </div>

          <Card T={T} title="Technology Cost Trajectories — Wright's Law Projections (2024–2050)">
            <div style={{ fontSize: 11, color: T.textSec, marginBottom: 12, fontFamily: T.mono }}>
              Cumulative volume doublings drive cost reduction. LR = Learning Rate (cost reduction per doubling). Source: BloombergNEF / IRENA / IEA WEO methodology.
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={learningData} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="year" tick={{ fontSize: 11, fontFamily: T.mono }} />
                <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} label={{ value: 'Indexed Cost (2024=100 for comparison)', angle: -90, position: 'insideLeft', fontSize: 9, fill: T.textMut }} />
                <Tooltip formatter={(v, name) => [`${v} ${LEARNING_RATES[name]?.unit || ''}`, name]} />
                <Legend />
                {['Solar PV', 'Green Hydrogen', 'Li-Ion BESS', 'Carbon Capture', 'EV Battery'].map(tech => (
                  <Line key={tech} dataKey={tech} stroke={LEARNING_RATES[tech].color} strokeWidth={2} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card T={T} title="Learning Rate Benchmark — Clean Technology Sectors">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr style={{ background: T.surfaceH }}>
                  {['Technology', 'Learning Rate', '2024 Cost', '2030E', '2040E', '2050E', 'Unit', 'Cost Reduction'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontFamily: T.mono, fontSize: 10, color: T.navy, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{Object.entries(LEARNING_RATES).map(([tech, { lr, base2024, unit, color }], i) => {
                  const c30 = learningData.find(r => r.year === 2030)?.[tech];
                  const c40 = learningData.find(r => r.year === 2040)?.[tech];
                  const c50 = learningData.find(r => r.year === 2050)?.[tech];
                  const pctDn = +(((base2024 - c50) / base2024) * 100).toFixed(0);
                  return (
                    <tr key={tech} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                      <td style={{ padding: '7px 12px', fontWeight: 600 }}><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: color, marginRight: 8 }} />{tech}</td>
                      <td style={{ padding: '7px 12px', fontFamily: T.mono, color: T.teal }}>{(lr * 100).toFixed(0)}%</td>
                      <td style={{ padding: '7px 12px', fontFamily: T.mono }}>{base2024}</td>
                      <td style={{ padding: '7px 12px', fontFamily: T.mono }}>{c30}</td>
                      <td style={{ padding: '7px 12px', fontFamily: T.mono }}>{c40}</td>
                      <td style={{ padding: '7px 12px', fontFamily: T.mono, fontWeight: 600, color: T.green }}>{c50}</td>
                      <td style={{ padding: '7px 12px', fontSize: 11, color: T.textSec }}>{unit}</td>
                      <td style={{ padding: '7px 12px', fontFamily: T.mono, color: pctDn > 60 ? T.green : T.amber }}>{pctDn}% ↓</td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ── Policy Sensitivity ────────────────────────────────────────────── */}
      {activeSection === 'policy' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Kpi T={T} label="IRA 45Q (CCS)" value="$85/t" sub="US IRA §45Q tax credit" color={T.navy} />
            <Kpi T={T} label="IRA 45V (H₂)" value="$3.0/kg" sub="Clean H₂ PTC (IRS final rule)" color={T.teal} />
            <Kpi T={T} label="EU State Aid" value="45% grant" sub="IPCEI / NZI Act equivalent" color={T.sage} />
            <Kpi T={T} label="India PLI (ACC)" value="₹18,100 Cr" sub="Over 5-yr scheme period" color={T.amber} />
          </div>

          <Card T={T} title="Policy Lever Impact on Project IRR — Tornado Analysis">
            <div style={{ fontSize: 11, color: T.textSec, marginBottom: 12 }}>Base IRR assumes unsubsidised economics. Uplift = incremental IRR pp from each policy instrument.</div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={[...policyImpact].sort((a, b) => b.uplift - a.uplift)} layout="vertical" margin={{ top: 5, right: 80, left: 150, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fontFamily: T.mono }} unit="%" />
                <YAxis type="category" dataKey="label" tick={{ fontSize: 10, fontFamily: T.mono }} width={145} />
                <Tooltip formatter={v => [`${v}% IRR`]} />
                <Bar dataKey="baseIrr" name="Base IRR" stackId="a" fill={T.borderL} />
                <Bar dataKey="uplift" name="Policy Uplift pp" stackId="a" fill={T.teal} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card T={T} title="Global Policy Benchmark — Clean Technology Incentives">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr style={{ background: T.surfaceH }}>
                  {['Flag', 'Policy / Scheme', 'Instrument', 'Value', 'Target Technology', 'Horizon'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontFamily: T.mono, fontSize: 10, color: T.navy, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{[
                  { flag: '🇺🇸', policy: 'IRA §45Q', instrument: 'Tax Credit', value: '$85/t', tech: 'CCS/CCUS/DAC', horizon: '12yr' },
                  { flag: '🇺🇸', policy: 'IRA §45V', instrument: 'PTC', value: '$3.0/kg', tech: 'Clean Hydrogen', horizon: '10yr' },
                  { flag: '🇺🇸', policy: 'IRA §48C', instrument: 'ITC', value: '30% capex', tech: 'CleanTech Mfg', horizon: '10yr' },
                  { flag: '🇺🇸', policy: 'IRA §45X', instrument: 'PTC (mfg)', value: '$35/kWh', tech: 'Battery cells', horizon: '10yr' },
                  { flag: '🇪🇺', policy: 'IPCEI Hydrogen', instrument: 'Direct Grant', value: '45% capex', tech: 'Green H₂', horizon: '10yr' },
                  { flag: '🇪🇺', policy: 'NZI Act CfD', instrument: 'Guaranteed price', value: '€120/MWh', tech: 'Offshore Wind', horizon: '15yr' },
                  { flag: '🇮🇳', policy: 'PLI Scheme ACC', instrument: 'Prod. Incentive', value: '₹18,100 Cr', tech: 'Adv. Chemistry BESS', horizon: '5yr' },
                  { flag: '🇮🇳', policy: 'NGHM', instrument: 'Demand aggregation', value: '₹19,744 Cr', tech: 'Green Hydrogen', horizon: '5yr' },
                  { flag: '🇬🇧', policy: 'CfD AR6', instrument: 'Strike Price', value: '£44/MWh', tech: 'Offshore Wind', horizon: '15yr' },
                  { flag: '🇯🇵', policy: 'GX-ETS', instrument: 'Carbon Market', value: '¥6,200/t', tech: 'All decarbonisation', horizon: 'Open' },
                ].map((r, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                    <td style={{ padding: '7px 12px', fontSize: 16 }}>{r.flag}</td>
                    <td style={{ padding: '7px 12px', fontWeight: 600, fontSize: 12 }}>{r.policy}</td>
                    <td style={{ padding: '7px 12px', fontSize: 11, color: T.textSec }}>{r.instrument}</td>
                    <td style={{ padding: '7px 12px', fontFamily: T.mono, color: T.green, fontWeight: 600 }}>{r.value}</td>
                    <td style={{ padding: '7px 12px', fontSize: 11 }}>{r.tech}</td>
                    <td style={{ padding: '7px 12px', fontFamily: T.mono, color: T.textSec }}>{r.horizon}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ── Carbon Revenue Overlay ────────────────────────────────────────── */}
      {activeSection === 'carbon' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {Object.keys(SCENARIOS).map(s => (
              <button key={s} onClick={() => setSelScenario(s)} style={{ padding: '6px 12px', borderRadius: 5, border: `1px solid ${selScenario === s ? T.navy : T.border}`, background: selScenario === s ? T.navy : T.surface, color: selScenario === s ? '#fff' : T.textSec, fontFamily: T.font, fontSize: 11, cursor: 'pointer' }}>{s}</button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[2030, 2040, 2050].map(yr => (
              <Kpi key={yr} T={T} label={`Carbon Price ${yr}`} value={`$${SCENARIOS[selScenario][yr]}/t`} sub={selScenario} color={T.navy} />
            ))}
            <Kpi T={T} label="Revenue Uplift (2030)" value={`$${((SCENARIOS[selScenario][2030] - 15) * 0.5).toFixed(0)}M`} sub="Per 0.5 MtCO₂ avoidance" color={T.green} />
          </div>

          <Card T={T} title="Carbon Price Trajectories — NGFS / IEA Scenarios ($/tCO₂e)">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={carbonRevenueData} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="year" tick={{ fontSize: 11, fontFamily: T.mono }} />
                <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} unit="$/t" />
                <Tooltip formatter={(v, name) => [`$${v}/t`, name]} />
                <Legend />
                {Object.keys(SCENARIOS).map(s => (
                  <Line key={s} dataKey={s} stroke={scenarioColors[s]} strokeWidth={s === selScenario ? 2.5 : 1} strokeDasharray={s === selScenario ? undefined : '4 2'} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card T={T} title="Carbon Revenue Waterfall — Selected Scenario vs Baseline ($/tCO₂e)">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={carbonRevenueData} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="year" tick={{ fontSize: 11, fontFamily: T.mono }} />
                <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} />
                <Tooltip />
                <Area dataKey="Current Policies" stroke={T.textSec} fill={T.surfaceH} strokeWidth={1.5} />
                <Area dataKey={selScenario} stroke={T.navy} fill={`${T.navy}20`} strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* ── Technology Maturity ───────────────────────────────────────────── */}
      {activeSection === 'trl' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Kpi T={T} label="TRL 9 Technologies" value={TRL_BENCH.filter(t => t.trl >= 9).length} sub="Fully commercial" color={T.green} />
            <Kpi T={T} label="Avg Cost Reduction" value={`${Math.round(TRL_BENCH.filter(t => t.costDown > 0).reduce((a, t) => a + t.costDown, 0) / TRL_BENCH.filter(t => t.costDown > 0).length)}%`} sub="Since commercialisation" color={T.navy} />
            <Kpi T={T} label="Emerging (TRL 5–7)" value={TRL_BENCH.filter(t => t.trl < 8).length} sub="Pre-commercial" color={T.amber} />
          </div>

          <Card T={T} title="Technology Readiness Level (TRL) Dashboard — Clean Tech Benchmarks">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr style={{ background: T.surfaceH }}>
                  {['Technology', 'TRL', 'TRL Bar', 'Commercial Since', 'Cost Reduction', 'Market Share %', 'Status'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontFamily: T.mono, fontSize: 10, color: T.navy, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{TRL_BENCH.map((t, i) => {
                  const trlPct = (t.trl / 9) * 100;
                  const trlColor = t.trl >= 9 ? T.green : t.trl >= 7 ? T.amber : T.red;
                  return (
                    <tr key={t.tech} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                      <td style={{ padding: '7px 12px', fontWeight: 600 }}>{t.tech}</td>
                      <td style={{ padding: '7px 12px', fontFamily: T.mono, fontWeight: 700, color: trlColor }}>{t.trl}/9</td>
                      <td style={{ padding: '7px 12px', width: 120 }}>
                        <div style={{ background: T.borderL, borderRadius: 4, height: 8, width: '100%' }}>
                          <div style={{ background: trlColor, height: 8, borderRadius: 4, width: `${trlPct}%` }} />
                        </div>
                      </td>
                      <td style={{ padding: '7px 12px', fontFamily: T.mono, color: T.textSec }}>{t.commercialYr}</td>
                      <td style={{ padding: '7px 12px', fontFamily: T.mono, color: t.costDown > 50 ? T.green : t.costDown > 0 ? T.amber : T.textMut }}>{t.costDown > 0 ? `${t.costDown}%` : '—'}</td>
                      <td style={{ padding: '7px 12px', fontFamily: T.mono }}>{t.marketShare}%</td>
                      <td style={{ padding: '7px 12px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 3, fontSize: 10, fontWeight: 600, background: t.trl >= 9 ? `${T.green}20` : t.trl >= 7 ? `${T.amber}20` : `${T.red}20`, color: trlColor }}>{t.trl >= 9 ? 'Commercial' : t.trl >= 7 ? 'Late Demo' : 'Pilot'}</span>
                      </td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
          </Card>

          <Card T={T} title="TRL Distribution — Clean Technology Universe">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={[1, 2, 3, 4, 5, 6, 7, 8, 9].map(level => ({ level: `TRL ${level}`, count: TRL_BENCH.filter(t => t.trl === level).length }))} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="level" tick={{ fontSize: 10, fontFamily: T.mono }} />
                <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" name="Technologies" fill={T.navy} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* ── Monte Carlo NPV ───────────────────────────────────────────────── */}
      {activeSection === 'mc' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Card T={T} title="Monte Carlo NPV Distribution — Triangular Sampling (800 runs)">
            <div style={{ fontSize: 11, color: T.textSec, marginBottom: 12 }}>
              Inputs: CAPEX [$80–$200M, mode $120M], WACC [7–14%, mode 10%], Revenue [$20–$60M/yr, mode $35M], OpEx Ratio [20–45%, mode 30%], Revenue Growth [2–10%, mode 5%]. 20-yr DCF.
            </div>
            {!mcRuns ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <button onClick={runMC} style={{ padding: '10px 28px', background: T.navy, color: '#fff', border: 'none', borderRadius: 6, fontFamily: T.font, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Run Monte Carlo (800 paths)</button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
                  <Kpi T={T} label="P5 NPV" value={`$${(mcRuns.p05 / 1).toFixed(0)}M`} sub="5th percentile" color={T.red} />
                  <Kpi T={T} label="Median NPV" value={`$${(mcRuns.p50 / 1).toFixed(0)}M`} sub="50th percentile" color={T.navy} />
                  <Kpi T={T} label="Mean NPV" value={`$${(mcRuns.mean / 1).toFixed(0)}M`} sub="Expected value" color={T.teal} />
                  <Kpi T={T} label="P95 NPV" value={`$${(mcRuns.p95 / 1).toFixed(0)}M`} sub="95th percentile" color={T.green} />
                  <Kpi T={T} label="% Positive" value={`${((mcRuns.samples.filter(v => v > 0).length / mcRuns.samples.length) * 100).toFixed(0)}%`} sub="NPV > 0" color={mcRuns.samples.filter(v => v > 0).length / mcRuns.samples.length > 0.7 ? T.green : T.red} />
                </div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={histData} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="bin" tick={{ fontSize: 10, fontFamily: T.mono }} unit="M" />
                    <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} />
                    <Tooltip formatter={(v, _, { payload }) => [v, `NPV bin: $${payload?.bin}M`]} />
                    <ReferenceLine x={0} stroke={T.red} strokeDasharray="4 2" label={{ value: 'NPV=0', fontSize: 10, fill: T.red }} />
                    <Bar dataKey="count" name="Simulations" fill={T.navy} radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </>
            )}
          </Card>
        </div>
      )}

      {/* ── Innovation Pipeline ───────────────────────────────────────────── */}
      {activeSection === 'innovation' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Kpi T={T} label="Global CleanTech Patents" value="18,400" sub="2024 filings (est.)" color={T.navy} />
            <Kpi T={T} label="YoY Patent Growth" value="+22%" sub="Solar + EV + H₂ driving" color={T.green} />
            <Kpi T={T} label="Total R&D Spend" value="$73.5Bn" sub="Top-tier sector capex" color={T.teal} />
          </div>

          <Card T={T} title="Clean Technology Patent Filing Trends — Global (2018–2024)">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={patentData} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="year" tick={{ fontSize: 11, fontFamily: T.mono }} />
                <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="EV" name="EV & Mobility" stackId="a" fill={T.red} />
                <Bar dataKey="Solar" name="Solar PV" stackId="a" fill={T.amber} />
                <Bar dataKey="BESS" name="Battery Storage" stackId="a" fill={T.sage} />
                <Bar dataKey="Hydrogen" name="Green Hydrogen" stackId="a" fill={T.teal} />
                <Bar dataKey="CCS" name="CCS/CCUS" stackId="a" fill={T.textSec} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card T={T} title="R&D Intensity & Key Patent Filers by Technology">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr style={{ background: T.surfaceH }}>
                  {['Sector', 'Annual R&D ($Bn)', 'YoY Growth', 'R&D / Revenue', 'Top Patent Filers'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontFamily: T.mono, fontSize: 10, color: T.navy, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{rdSpend.map((r, i) => (
                  <tr key={r.entity} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                    <td style={{ padding: '7px 12px', fontWeight: 600 }}>{r.entity}</td>
                    <td style={{ padding: '7px 12px', fontFamily: T.mono, color: T.navy }}>${r.spend}Bn</td>
                    <td style={{ padding: '7px 12px', fontFamily: T.mono, color: T.green }}>+{r.yoy}%</td>
                    <td style={{ padding: '7px 12px', fontFamily: T.mono }}>{r.rdi}×</td>
                    <td style={{ padding: '7px 12px', fontSize: 11, color: T.textSec }}>{r.topFiler}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
