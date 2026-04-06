import React, { useState, useMemo } from 'react';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, ReferenceLine
} from 'recharts';
import { hazardRatePD, survivalProb, ngfsCarbonPrice } from '../../../engines/climateRisk';

const T = {
  bg: '#f6f4f0', surface: '#ffffff', surfaceH: '#f0ede7', border: '#e5e0d8',
  borderL: '#d5cfc5', navy: '#1b3a5c', navyL: '#2c5a8c', gold: '#c5a96a',
  goldL: '#d4be8a', sage: '#5a8a6a', text: '#1b3a5c', textSec: '#5c6b7e',
  textMut: '#9aa3ae', red: '#dc2626', green: '#16a34a', amber: '#d97706',
  blue: '#2563eb', orange: '#ea580c', purple: '#7c3aed',
  font: "'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono: "'JetBrains Mono','SF Mono','Fira Code',monospace"
};

const SCENARIOS = ['Current Policies', 'Delayed Transition', 'Below 2°C', 'Net Zero 2050'];
const SCENARIO_COLORS = [T.red, T.orange, T.amber, T.green];

// ─── STRANDED ASSET UNIVERSE ─────────────────────────────────────────────────
const SECTORS = [
  { name: 'Coal Mining & Power',    aum: 4200,  stranded_pct_cp: 65, stranded_pct_dt: 78, stranded_pct_b2c: 88, stranded_pct_nz: 95, write_down_start: 2026, full_stranded: 2035, capex_locked: 2800, color: '#7c3aed' },
  { name: 'Oil Sands & High-Cost',  aum: 8700,  stranded_pct_cp: 28, stranded_pct_dt: 42, stranded_pct_b2c: 58, stranded_pct_nz: 74, write_down_start: 2028, full_stranded: 2040, capex_locked: 5200, color: T.red },
  { name: 'Conventional Oil & Gas', aum: 15400, stranded_pct_cp: 12, stranded_pct_dt: 22, stranded_pct_b2c: 36, stranded_pct_nz: 52, write_down_start: 2030, full_stranded: 2045, capex_locked: 8900, color: T.orange },
  { name: 'Gas-Fired Power',        aum: 6300,  stranded_pct_cp: 8,  stranded_pct_dt: 18, stranded_pct_b2c: 32, stranded_pct_nz: 48, write_down_start: 2032, full_stranded: 2048, capex_locked: 3100, color: T.amber },
  { name: 'Cement & Lime',          aum: 3800,  stranded_pct_cp: 15, stranded_pct_dt: 25, stranded_pct_b2c: 40, stranded_pct_nz: 60, write_down_start: 2029, full_stranded: 2042, capex_locked: 1900, color: '#0891b2' },
  { name: 'Steel (Blast Furnace)',   aum: 4600,  stranded_pct_cp: 18, stranded_pct_dt: 30, stranded_pct_b2c: 45, stranded_pct_nz: 65, write_down_start: 2028, full_stranded: 2041, capex_locked: 2400, color: '#059669' },
  { name: 'Aviation (Long-haul)',    aum: 2900,  stranded_pct_cp: 5,  stranded_pct_dt: 12, stranded_pct_b2c: 22, stranded_pct_nz: 38, write_down_start: 2034, full_stranded: 2050, capex_locked: 1200, color: T.navyL },
  { name: 'Real Estate (EPC F/G)',   aum: 9100,  stranded_pct_cp: 10, stranded_pct_dt: 18, stranded_pct_b2c: 32, stranded_pct_nz: 50, write_down_start: 2027, full_stranded: 2035, capex_locked: 4100, color: '#7c3aed' },
];

const SCENARIO_KEYS = { 'Current Policies': 'cp', 'Delayed Transition': 'dt', 'Below 2°C': 'b2c', 'Net Zero 2050': 'nz' };

// Build write-down schedule
function buildWriteDownSchedule(sector, scenario) {
  const sk = SCENARIO_KEYS[scenario];
  const strandedPct = sector[`stranded_pct_${sk}`] / 100;
  const years = Array.from({ length: 27 }, (_, i) => 2024 + i);
  const start = sector.write_down_start;
  const end = sector.full_stranded;
  return years.map(yr => {
    let cumPct = 0;
    if (yr >= start && yr <= end) {
      const progress = (yr - start) / Math.max(1, end - start);
      cumPct = strandedPct * (1 - Math.exp(-3 * progress));
    } else if (yr > end) {
      cumPct = strandedPct;
    }
    return {
      year: yr,
      cumulative_write_down: sector.aum * cumPct,
      residual_value_pct: 100 - cumPct * 100,
      write_down_pct: cumPct * 100,
    };
  });
}

// Residual value curve (exponential decay)
function residualValueCurve(sector, scenario) {
  const sk = SCENARIO_KEYS[scenario];
  const strandedPct = sector[`stranded_pct_${sk}`] / 100;
  const years = Array.from({ length: 27 }, (_, i) => 2024 + i);
  const halfLife = Math.max(1, (sector.full_stranded - sector.write_down_start) / 2);
  return years.map(yr => {
    const t = Math.max(0, yr - sector.write_down_start);
    const decay = yr < sector.write_down_start ? 1 : Math.max(1 - strandedPct, Math.exp(-Math.log(2) * t / halfLife));
    return { year: yr, residual_pct: decay * 100 };
  });
}

// ─── MERTON HAZARD RATE PARAMETERS — per sector ─────────────────────────────
// lambda_base: baseline annual PD (at CP=0); cp_threshold: price at which
// stranding accelerates exponentially; alpha: price sensitivity (0.8–1.5)
const SECTOR_HAZARD = [
  { lambda_base: 0.060, cp_threshold: 80,  alpha: 1.40 }, // Coal
  { lambda_base: 0.035, cp_threshold: 120, alpha: 1.25 }, // Oil Sands
  { lambda_base: 0.018, cp_threshold: 160, alpha: 1.10 }, // Conv O&G
  { lambda_base: 0.012, cp_threshold: 140, alpha: 1.00 }, // Gas Power
  { lambda_base: 0.015, cp_threshold: 130, alpha: 1.05 }, // Cement
  { lambda_base: 0.020, cp_threshold: 110, alpha: 1.15 }, // Steel
  { lambda_base: 0.008, cp_threshold: 180, alpha: 0.90 }, // Aviation
  { lambda_base: 0.010, cp_threshold: 100, alpha: 0.85 }, // Real Estate
];

// Map local scenario labels to NGFS engine keys
const SCENARIO_NGFS_KEY = {
  'Current Policies': 'CurrPol',
  'Delayed Transition': 'DP',
  'Below 2°C': 'BelowAc',
  'Net Zero 2050': 'NZ2050',
};

const TABS = ['Sector Overview', 'Write-Down Schedule', 'Residual Value Curves', 'Bubble Map', 'Remediation Pathways', 'Default Risk Model'];

export default function StrandedAssetAnalyzerPage() {
  const [tab, setTab] = useState(0);
  const [scenario, setScenario] = useState('Net Zero 2050');
  const [selectedSector, setSelectedSector] = useState(0);

  const sk = SCENARIO_KEYS[scenario];
  const totalAum = SECTORS.reduce((s, x) => s + x.aum, 0);
  const totalStranded = SECTORS.reduce((s, x) => s + x.aum * x[`stranded_pct_${sk}`] / 100, 0);
  const totalCapex = SECTORS.reduce((s, x) => s + x.capex_locked, 0);
  const avgStranded = (totalStranded / totalAum) * 100;

  const writeDownData = useMemo(() =>
    buildWriteDownSchedule(SECTORS[selectedSector], scenario), [selectedSector, scenario]);

  const residualData = useMemo(() =>
    residualValueCurve(SECTORS[selectedSector], scenario), [selectedSector, scenario]);

  const bubbleData = SECTORS.map(s => ({
    name: s.name,
    stranded_pct: s[`stranded_pct_${sk}`],
    capex_locked: s.capex_locked,
    aum: s.aum,
    color: s.color,
    write_down_year: s.write_down_start,
  }));

  // All-scenario comparison for selected sector
  const allScenarioData = SCENARIOS.map((sc, i) => ({
    scenario: sc.replace('Current Policies', 'CP').replace('Delayed Transition', 'DT').replace('Below 2°C', 'B2C').replace('Net Zero 2050', 'NZ'),
    stranded_usd: SECTORS[selectedSector].aum * SECTORS[selectedSector][`stranded_pct_${SCENARIO_KEYS[sc]}`] / 100,
    stranded_pct: SECTORS[selectedSector][`stranded_pct_${SCENARIO_KEYS[sc]}`],
    color: SCENARIO_COLORS[i],
  }));

  const portfolioWriteDown = useMemo(() => {
    const years = Array.from({ length: 27 }, (_, i) => 2024 + i);
    return years.map(yr => {
      const total = SECTORS.reduce((acc, s) => {
        const wd = buildWriteDownSchedule(s, scenario).find(d => d.year === yr);
        return acc + (wd?.cumulative_write_down || 0);
      }, 0);
      return { year: yr, total_write_down: total };
    });
  }, [scenario]);

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: T.navy, padding: '24px 32px 0', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ color: T.gold, fontFamily: T.mono, fontSize: 11, letterSpacing: 2, marginBottom: 4 }}>EP-CA2 · STRANDED ASSET ANALYZER</div>
            <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: 0 }}>Stranded Asset Portfolio Intelligence</h1>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>
              8 Sectors · Write-Down Schedules · Residual Value Decay · Locked-In CAPEX · Remediation Pathways
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {[
              { label: 'Universe AUM', val: `$${(totalAum / 1000).toFixed(1)}B` },
              { label: 'Stranded Exposure', val: `$${(totalStranded / 1000).toFixed(1)}B`, sub: `${avgStranded.toFixed(1)}% of AUM`, col: T.red },
              { label: 'Locked CAPEX', val: `$${(totalCapex / 1000).toFixed(1)}B`, col: T.orange },
            ].map(m => (
              <div key={m.label} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 16px', textAlign: 'right' }}>
                <div style={{ color: '#94a3b8', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{m.label}</div>
                <div style={{ color: m.col || T.gold, fontSize: 20, fontWeight: 700, fontFamily: T.mono }}>{m.val}</div>
                {m.sub && <div style={{ color: '#94a3b8', fontSize: 11 }}>{m.sub}</div>}
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {SCENARIOS.map((s, i) => (
            <button key={s} onClick={() => setScenario(s)} style={{
              padding: '6px 14px', borderRadius: 20, border: `2px solid ${scenario === s ? SCENARIO_COLORS[i] : 'transparent'}`,
              background: scenario === s ? SCENARIO_COLORS[i] + '22' : 'rgba(255,255,255,0.06)',
              color: scenario === s ? SCENARIO_COLORS[i] : '#94a3b8', cursor: 'pointer', fontSize: 12, fontWeight: 600
            }}>{s}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 0 }}>
          {TABS.map((t2, i) => (
            <button key={i} onClick={() => setTab(i)} style={{
              padding: '10px 20px', border: 'none', background: 'transparent', cursor: 'pointer',
              color: tab === i ? T.gold : '#94a3b8', fontWeight: tab === i ? 700 : 400, fontSize: 13,
              borderBottom: tab === i ? `2px solid ${T.gold}` : '2px solid transparent'
            }}>{t2}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 32px 32px' }}>

        {/* TAB 0: Sector Overview */}
        {tab === 0 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24 }}>
                <h3 style={{ color: T.navy, margin: '0 0 16px', fontSize: 15 }}>Stranded Exposure by Sector — {scenario}</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={SECTORS.map(s => ({ name: s.name.split('(')[0].trim(), stranded: s.aum * s[`stranded_pct_${sk}`] / 100, safe: s.aum * (1 - s[`stranded_pct_${sk}`] / 100), color: s.color }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={50} />
                    <YAxis tickFormatter={v => `$${(v/1000).toFixed(1)}B`} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={v => [`$${(v/1000).toFixed(2)}B`]} />
                    <Legend />
                    <Bar dataKey="safe" name="Safe Value" fill={T.green} opacity={0.7} stackId="a" />
                    <Bar dataKey="stranded" name="Stranded" fill={T.red} opacity={0.8} stackId="a" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24 }}>
                <h3 style={{ color: T.navy, margin: '0 0 16px', fontSize: 15 }}>Portfolio Write-Down Schedule — {scenario}</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={portfolioWriteDown}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={v => `$${(v/1000).toFixed(0)}B`} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={v => [`$${(v/1000).toFixed(2)}B`, 'Cumulative Write-Down']} />
                    <Area dataKey="total_write_down" stroke={T.red} fill={T.red} fillOpacity={0.15} name="Cumulative Write-Down" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.navy }}>
                    {['Sector', 'AUM ($M)', 'CP %', 'DT %', 'B2C %', 'NZ %', 'Write-Down Start', 'Fully Stranded', 'Locked CAPEX ($M)', 'Risk'].map(h => (
                      <th key={h} style={{ padding: '10px 10px', color: '#fff', fontWeight: 600, textAlign: 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SECTORS.map((s, i) => {
                    const spct = s[`stranded_pct_${sk}`];
                    const risk = spct > 70 ? 'CRITICAL' : spct > 40 ? 'HIGH' : spct > 20 ? 'MEDIUM' : 'LOW';
                    const rc = risk === 'CRITICAL' ? '#7c3aed' : risk === 'HIGH' ? T.red : risk === 'MEDIUM' ? T.amber : T.green;
                    return (
                      <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.bg }}>
                        <td style={{ padding: '8px 10px', color: T.navy, fontWeight: 500 }}>{s.name}</td>
                        <td style={{ padding: '8px 10px', fontFamily: T.mono }}>${s.aum.toLocaleString()}</td>
                        <td style={{ padding: '8px 10px', fontFamily: T.mono, color: T.red }}>{s.stranded_pct_cp}%</td>
                        <td style={{ padding: '8px 10px', fontFamily: T.mono, color: T.orange }}>{s.stranded_pct_dt}%</td>
                        <td style={{ padding: '8px 10px', fontFamily: T.mono, color: T.amber }}>{s.stranded_pct_b2c}%</td>
                        <td style={{ padding: '8px 10px', fontFamily: T.mono, color: T.green }}>{s.stranded_pct_nz}%</td>
                        <td style={{ padding: '8px 10px', fontFamily: T.mono }}>{s.write_down_start}</td>
                        <td style={{ padding: '8px 10px', fontFamily: T.mono }}>{s.full_stranded}</td>
                        <td style={{ padding: '8px 10px', fontFamily: T.mono, color: T.orange }}>${s.capex_locked.toLocaleString()}</td>
                        <td style={{ padding: '8px 10px' }}>
                          <span style={{ background: rc + '22', color: rc, padding: '2px 6px', borderRadius: 8, fontSize: 10, fontWeight: 700 }}>{risk}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 1: Write-Down Schedule */}
        {tab === 1 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {SECTORS.map((s, i) => (
                <button key={i} onClick={() => setSelectedSector(i)} style={{
                  padding: '6px 14px', borderRadius: 20, border: `2px solid ${selectedSector === i ? s.color : 'transparent'}`,
                  background: selectedSector === i ? s.color + '22' : T.surface,
                  color: selectedSector === i ? s.color : T.textSec, cursor: 'pointer', fontSize: 12, fontWeight: 600
                }}>{s.name}</button>
              ))}
            </div>
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24, marginBottom: 20 }}>
              <h3 style={{ color: T.navy, margin: '0 0 4px', fontSize: 15 }}>{SECTORS[selectedSector].name} — Cumulative Write-Down Schedule</h3>
              <p style={{ color: T.textSec, fontSize: 12, margin: '0 0 16px' }}>
                Write-down begins {SECTORS[selectedSector].write_down_start} · Fully stranded by {SECTORS[selectedSector].full_stranded} · Scenario: {scenario}
              </p>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={writeDownData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={v => `$${(v/1000).toFixed(1)}B`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v, n) => [`$${(v/1000).toFixed(2)}B / ${typeof v === 'number' && n === 'write_down_pct' ? v.toFixed(1) + '%' : ''}`, n]} />
                  <Area dataKey="cumulative_write_down" stroke={T.red} fill={T.red} fillOpacity={0.15} name="Cum. Write-Down ($M)" />
                  <ReferenceLine x={SECTORS[selectedSector].write_down_start} stroke={T.amber} strokeDasharray="4 4" label={{ value: 'WD Start', fill: T.amber, fontSize: 11 }} />
                  <ReferenceLine x={SECTORS[selectedSector].full_stranded} stroke={T.red} strokeDasharray="4 4" label={{ value: 'Fully Stranded', fill: T.red, fontSize: 11 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24 }}>
              <h3 style={{ color: T.navy, margin: '0 0 16px', fontSize: 15 }}>{SECTORS[selectedSector].name} — All-Scenario Comparison</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={allScenarioData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="scenario" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={v => `$${(v/1000).toFixed(1)}B`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={v => [`$${(v/1000).toFixed(2)}B`, 'Stranded Value']} />
                  <Bar dataKey="stranded_usd" name="Stranded ($M)" radius={[6,6,0,0]}>
                    {allScenarioData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* TAB 2: Residual Value Curves */}
        {tab === 2 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {SECTORS.map((s, i) => (
                <button key={i} onClick={() => setSelectedSector(i)} style={{
                  padding: '6px 12px', borderRadius: 20, border: `2px solid ${selectedSector === i ? s.color : 'transparent'}`,
                  background: selectedSector === i ? s.color + '22' : T.surface,
                  color: selectedSector === i ? s.color : T.textSec, cursor: 'pointer', fontSize: 11, fontWeight: 600
                }}>{s.name.split('(')[0].trim()}</button>
              ))}
            </div>
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24, marginBottom: 20 }}>
              <h3 style={{ color: T.navy, margin: '0 0 4px', fontSize: 15 }}>Residual Value Decay Curve — {SECTORS[selectedSector].name}</h3>
              <p style={{ color: T.textSec, fontSize: 12, margin: '0 0 16px' }}>
                Exponential decay model. Half-life = {Math.round((SECTORS[selectedSector].full_stranded - SECTORS[selectedSector].write_down_start)/2)}yr from write-down onset.
              </p>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={residualData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={v => [`${v.toFixed(1)}%`, 'Residual Value']} />
                  <Line dataKey="residual_pct" stroke={SECTORS[selectedSector].color} strokeWidth={2.5} dot={false} name="Residual Value %" />
                  <ReferenceLine y={50} stroke={T.textMut} strokeDasharray="4 4" label={{ value: '50% threshold', fill: T.textMut, fontSize: 10 }} />
                  <ReferenceLine y={20} stroke={T.red} strokeDasharray="4 4" label={{ value: 'Critical (20%)', fill: T.red, fontSize: 10 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* TAB 3: Bubble Map */}
        {tab === 3 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24 }}>
              <h3 style={{ color: T.navy, margin: '0 0 8px', fontSize: 15 }}>Stranded Asset Risk Matrix — {scenario}</h3>
              <p style={{ color: T.textSec, fontSize: 12, margin: '0 0 20px' }}>
                X: Stranded % · Y: Locked CAPEX ($M) · Size: AUM exposure. Upper-right quadrant = highest priority for active remediation.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
                {SECTORS.map((s, i) => {
                  const spct = s[`stranded_pct_${sk}`];
                  const strandedVal = s.aum * spct / 100;
                  return (
                    <div key={i} style={{
                      background: T.bg, borderRadius: 10, border: `2px solid ${s.color}33`, padding: 16,
                      borderLeft: `4px solid ${s.color}`
                    }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 8 }}>{s.name}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                        {[
                          { label: 'AUM', val: `$${(s.aum/1000).toFixed(1)}B` },
                          { label: 'Stranded', val: `${spct}%`, col: T.red },
                          { label: 'Stranded $', val: `$${(strandedVal/1000).toFixed(1)}B`, col: T.red },
                          { label: 'Locked CAPEX', val: `$${(s.capex_locked/1000).toFixed(1)}B`, col: T.orange },
                        ].map(m => (
                          <div key={m.label} style={{ background: T.surface, borderRadius: 6, padding: 8 }}>
                            <div style={{ fontSize: 10, color: T.textMut }}>{m.label}</div>
                            <div style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 700, color: m.col || T.navy }}>{m.val}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ height: 6, flex: 1, background: T.border, borderRadius: 3 }}>
                          <div style={{ height: '100%', width: `${spct}%`, background: s.color, borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 11, color: s.color, fontWeight: 700, fontFamily: T.mono }}>{spct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Remediation Pathways */}
        {tab === 4 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {[
                { title: 'Decarbonization Investment', icon: '🔋', actions: ['CCS retrofit ($45–120/tCO₂)', 'Fuel switching (coal→gas→H₂)', 'Renewable integration', 'Process electrification'], cost: '$280–960B globally', timeline: '2025–2040', effectiveness: 75 },
                { title: 'Asset Repurposing', icon: '🏗️', actions: ['Coal plant → battery storage', 'Oil terminal → green H₂ hub', 'Gas pipeline → CO₂ transport', 'Refinery → SAF production'], cost: '$40–180B globally', timeline: '2026–2035', effectiveness: 55 },
                { title: 'Managed Phase-Out', icon: '📋', actions: ['Accelerated depreciation', 'Early closure payments', 'Worker transition funds', 'Community remediation'], cost: '$90–250B globally', timeline: '2025–2038', effectiveness: 40 },
                { title: 'Portfolio Hedging', icon: '📊', actions: ['Transition bond issuance', 'Carbon offset acquisition', 'Green CapEx ring-fencing', 'Climate insurance products'], cost: '$20–80B globally', timeline: '2024–2030', effectiveness: 30 },
              ].map(p => (
                <div key={p.title} style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: 28 }}>{p.icon}</span>
                    <div>
                      <h4 style={{ color: T.navy, margin: 0, fontSize: 15 }}>{p.title}</h4>
                      <div style={{ color: T.textSec, fontSize: 12 }}>{p.timeline} · {p.cost}</div>
                    </div>
                    <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                      <div style={{ fontSize: 20, fontWeight: 700, fontFamily: T.mono, color: T.green }}>{p.effectiveness}%</div>
                      <div style={{ fontSize: 10, color: T.textMut }}>effectiveness</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {p.actions.map(a => (
                      <div key={a} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: T.bg, borderRadius: 6 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.gold, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: T.navy }}>{a}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 12, height: 6, background: T.border, borderRadius: 3 }}>
                    <div style={{ height: '100%', width: `${p.effectiveness}%`, background: T.green, borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: Default Risk Model (Merton hazard rate) */}
        {tab === 5 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24, marginBottom: 20 }}>
              <h3 style={{ color: T.navy, margin: '0 0 4px', fontSize: 15 }}>Merton Jump-to-Default Hazard Rate Model</h3>
              <p style={{ color: T.textSec, fontSize: 12, margin: '0 0 4px' }}>
                h(t) = λ_base × exp(α × CP(t) / CP_threshold) — carbon price from NGFS Phase 4 · S(T) = exp(−h × T)
              </p>
              <p style={{ color: T.textMut, fontSize: 11, margin: '0 0 20px' }}>
                Scenario: <strong>{scenario}</strong> · Carbon prices: NGFS Phase 4 (Sept 2023), USD/tCO₂e
              </p>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: T.navy }}>
                      {['Sector', 'λ_base (yr⁻¹)', 'CP_threshold', 'α', 'CP(2030)', 'h(2030)', 'S(5yr)', 'S(10yr)', 'Implied PD 10yr', 'Risk'].map(h => (
                        <th key={h} style={{ padding: '10px 10px', color: '#fff', fontWeight: 600, textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {SECTORS.map((s, i) => {
                      const hp = SECTOR_HAZARD[i];
                      const ngfsKey = SCENARIO_NGFS_KEY[scenario] ?? 'CurrPol';
                      const cp2030 = ngfsCarbonPrice(ngfsKey, 2030);
                      const h2030 = hazardRatePD(hp.lambda_base, cp2030, hp.cp_threshold, hp.alpha);
                      const surv5  = survivalProb(h2030, 5);
                      const surv10 = survivalProb(h2030, 10);
                      const pd10   = (1 - surv10) * 100;
                      const risk   = pd10 > 40 ? 'CRITICAL' : pd10 > 20 ? 'HIGH' : pd10 > 8 ? 'MEDIUM' : 'LOW';
                      const rc     = risk === 'CRITICAL' ? '#7c3aed' : risk === 'HIGH' ? T.red : risk === 'MEDIUM' ? T.amber : T.green;
                      return (
                        <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.bg }}>
                          <td style={{ padding: '8px 10px', color: T.navy, fontWeight: 500 }}>{s.name}</td>
                          <td style={{ padding: '8px 10px', fontFamily: T.mono }}>{hp.lambda_base.toFixed(3)}</td>
                          <td style={{ padding: '8px 10px', fontFamily: T.mono }}>${hp.cp_threshold}</td>
                          <td style={{ padding: '8px 10px', fontFamily: T.mono }}>{hp.alpha.toFixed(2)}</td>
                          <td style={{ padding: '8px 10px', fontFamily: T.mono }}>${cp2030.toFixed(0)}</td>
                          <td style={{ padding: '8px 10px', fontFamily: T.mono, color: T.orange }}>{h2030.toFixed(4)}</td>
                          <td style={{ padding: '8px 10px', fontFamily: T.mono }}>{(surv5*100).toFixed(1)}%</td>
                          <td style={{ padding: '8px 10px', fontFamily: T.mono }}>{(surv10*100).toFixed(1)}%</td>
                          <td style={{ padding: '8px 10px', fontFamily: T.mono, color: rc, fontWeight: 600 }}>{pd10.toFixed(1)}%</td>
                          <td style={{ padding: '8px 10px' }}>
                            <span style={{ background: rc + '22', color: rc, padding: '2px 6px', borderRadius: 8, fontSize: 10, fontWeight: 700 }}>{risk}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Survival probability curves */}
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24 }}>
              <h3 style={{ color: T.navy, margin: '0 0 4px', fontSize: 15 }}>Survival Probability Curves — {SECTORS[selectedSector].name}</h3>
              <p style={{ color: T.textSec, fontSize: 12, margin: '0 0 16px' }}>
                S(T) = exp(−h × T) where h uses NGFS carbon price trajectory · Sector selector above applies
              </p>
              <div style={{ marginBottom: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {SECTORS.map((s, i) => (
                  <button key={i} onClick={() => setSelectedSector(i)} style={{
                    padding: '4px 10px', borderRadius: 16, border: `2px solid ${selectedSector === i ? s.color : 'transparent'}`,
                    background: selectedSector === i ? s.color + '22' : T.bg,
                    color: selectedSector === i ? s.color : T.textSec, cursor: 'pointer', fontSize: 11, fontWeight: 600
                  }}>{s.name.split('(')[0].trim()}</button>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={(() => {
                  const hp = SECTOR_HAZARD[selectedSector];
                  return Array.from({ length: 26 }, (_, i) => {
                    const yr = 2025 + i;
                    const row = { year: yr };
                    SCENARIOS.forEach(sc => {
                      const nk = SCENARIO_NGFS_KEY[sc] ?? 'CurrPol';
                      const cp = ngfsCarbonPrice(nk, yr);
                      const h  = hazardRatePD(hp.lambda_base, cp, hp.cp_threshold, hp.alpha);
                      const t  = yr - 2024;
                      row[sc] = +(survivalProb(h, t) * 100).toFixed(2);
                    });
                    return row;
                  });
                })()}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={v => [`${v}%`, 'Survival Prob.']} />
                  <Legend />
                  {SCENARIOS.map((sc, i) => (
                    <Line key={sc} dataKey={sc} stroke={SCENARIO_COLORS[i]} dot={false} strokeWidth={2} name={sc} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
