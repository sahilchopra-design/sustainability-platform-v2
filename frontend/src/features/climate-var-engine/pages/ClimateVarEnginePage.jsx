import React, { useState, useMemo } from 'react';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, ReferenceLine
} from 'recharts';

const T = {
  bg: '#f6f4f0', surface: '#ffffff', border: '#e5e0d8', navy: '#1b3a5c',
  navyL: '#2c5a8c', gold: '#c5a96a', textSec: '#5c6b7e', textMut: '#9aa3ae',
  red: '#dc2626', green: '#16a34a', amber: '#d97706', blue: '#2563eb',
  orange: '#ea580c', purple: '#7c3aed', teal: '#0891b2', sage: '#5a8a6a',
  font: "'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono: "'JetBrains Mono','SF Mono','Fira Code',monospace"
};

// Climate VaR model: CVaR = transition_var + physical_var + interaction_term
function computeCVaR(aum, scenario, horizon) {
  const params = {
    current_policies:    { trans: 0.028, phys: 0.012, interact: 0.004, correlation: 0.15 },
    delayed_transition:  { trans: 0.042, phys: 0.018, interact: 0.009, correlation: 0.25 },
    below_2c:           { trans: 0.055, phys: 0.010, interact: 0.008, correlation: 0.20 },
    divergent_net_zero: { trans: 0.065, phys: 0.014, interact: 0.012, correlation: 0.28 },
    net_zero_2050:      { trans: 0.072, phys: 0.008, interact: 0.010, correlation: 0.22 },
  };
  const p = params[scenario];
  const horizon_adj = Math.sqrt(horizon / 10);
  const transVaR = aum * p.trans * horizon_adj;
  const physVaR  = aum * p.phys * horizon_adj;
  const interVaR = aum * p.interact * horizon_adj * p.correlation;
  return { transVaR, physVaR, interVaR, totalVaR: transVaR + physVaR + interVaR, pct: (transVaR + physVaR + interVaR) / aum * 100 };
};

const SCENARIOS = {
  current_policies:    { label: 'Current Policies',   short: 'CP',  color: T.red    },
  delayed_transition:  { label: 'Delayed Transition',  short: 'DT',  color: T.orange },
  below_2c:           { label: 'Below 2°C',            short: 'B2C', color: T.amber  },
  divergent_net_zero: { label: 'Divergent NZ',         short: 'DNZ', color: T.blue   },
  net_zero_2050:      { label: 'Net Zero 2050',        short: 'NZ',  color: T.green  },
};

function buildDistribution(mean, std, n = 200) {
  return Array.from({ length: n }, (_, i) => {
    const x = mean - 3 * std + (6 * std * i) / (n - 1);
    const y = Math.exp(-0.5 * Math.pow((x - mean) / std, 2)) / (std * Math.sqrt(2 * Math.PI));
    return { x: x.toFixed(2), y, isVaR: x <= -(mean * 0.85) };
  });
}

const TABS = ['Climate VaR Calculator', 'Loss Distribution', 'Scenario Decomposition', 'Delta CoVaR', 'Stress Test Matrix'];

export default function ClimateVarEnginePage() {
  const [tab, setTab] = useState(0);
  const [aum, setAum] = useState(10000);
  const [scenario, setScenario] = useState('net_zero_2050');
  const [horizon, setHorizon] = useState(10);
  const [confidence, setConfidence] = useState(95);

  const cvar = useMemo(() => computeCVaR(aum, scenario, horizon), [aum, scenario, horizon]);

  const allScenarioCVaR = useMemo(() =>
    Object.keys(SCENARIOS).map(s => ({ ...computeCVaR(aum, s, horizon), ...SCENARIOS[s], id: s })),
    [aum, horizon]);

  const horizonSensitivity = [1, 2, 3, 5, 10, 15, 20, 30].map(h => {
    const r = computeCVaR(aum, scenario, h);
    return { horizon: h, var: r.totalVaR, transition: r.transVaR, physical: r.physVaR };
  });

  const distribution = useMemo(() => buildDistribution(-cvar.totalVaR / aum * 100, 8), [cvar]);

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh' }}>
      <div style={{ background: T.navy, padding: '24px 32px 0', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ color: T.gold, fontFamily: T.mono, fontSize: 11, letterSpacing: 2, marginBottom: 4 }}>EP-CE1 · CLIMATE VaR ENGINE</div>
            <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: 0 }}>Climate Value-at-Risk Engine — Transition + Physical Combined</h1>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>
              5 NGFS Scenarios · Transition VaR · Physical VaR · Interaction Term · Delta CoVaR · Loss Distribution · Stress Matrix
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {[
              { label: 'Total Climate VaR', val: `$${(cvar.totalVaR/1000).toFixed(2)}B`, col: T.red },
              { label: 'As % AUM', val: `${cvar.pct.toFixed(2)}%`, col: T.orange },
              { label: 'Horizon', val: `${horizon}yr`, col: T.gold },
            ].map(m => (
              <div key={m.label} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 16px', textAlign: 'right' }}>
                <div style={{ color: '#94a3b8', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{m.label}</div>
                <div style={{ color: m.col, fontSize: 18, fontWeight: 700, fontFamily: T.mono }}>{m.val}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Scenario tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {Object.entries(SCENARIOS).map(([k, v]) => (
            <button key={k} onClick={() => setScenario(k)} style={{
              padding: '6px 12px', borderRadius: 20, border: `2px solid ${scenario === k ? v.color : 'transparent'}`,
              background: scenario === k ? v.color + '22' : 'rgba(255,255,255,0.06)',
              color: scenario === k ? v.color : '#94a3b8', cursor: 'pointer', fontSize: 11, fontWeight: 600
            }}>{v.short}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 0 }}>
          {TABS.map((t2, i) => (
            <button key={i} onClick={() => setTab(i)} style={{
              padding: '10px 18px', border: 'none', background: 'transparent', cursor: 'pointer',
              color: tab === i ? T.gold : '#94a3b8', fontWeight: tab === i ? 700 : 400, fontSize: 12,
              borderBottom: tab === i ? `2px solid ${T.gold}` : '2px solid transparent'
            }}>{t2}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 32px 32px' }}>

        {tab === 0 && (
          <div style={{ paddingTop: 24 }}>
            {/* Controls */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 20 }}>
              <div style={{ background: T.surface, borderRadius: 8, border: `1px solid ${T.border}`, padding: 16 }}>
                <label style={{ color: T.textSec, fontSize: 12, display: 'block', marginBottom: 8 }}>Portfolio AUM ($M): ${aum.toLocaleString()}</label>
                <input type="range" min={1000} max={50000} step={500} value={aum} onChange={e => setAum(+e.target.value)} style={{ width: '100%' }} />
              </div>
              <div style={{ background: T.surface, borderRadius: 8, border: `1px solid ${T.border}`, padding: 16 }}>
                <label style={{ color: T.textSec, fontSize: 12, display: 'block', marginBottom: 8 }}>Time Horizon: {horizon} years</label>
                <input type="range" min={1} max={30} step={1} value={horizon} onChange={e => setHorizon(+e.target.value)} style={{ width: '100%' }} />
              </div>
              <div style={{ background: T.surface, borderRadius: 8, border: `1px solid ${T.border}`, padding: 16 }}>
                <label style={{ color: T.textSec, fontSize: 12, display: 'block', marginBottom: 8 }}>Confidence Level: {confidence}%</label>
                <input type="range" min={90} max={99} step={1} value={confidence} onChange={e => setConfidence(+e.target.value)} style={{ width: '100%' }} />
              </div>
            </div>

            {/* VaR decomposition */}
            <div style={{ background: T.surface, borderRadius: 10, border: `2px solid ${SCENARIOS[scenario].color}44`, padding: 24, marginBottom: 20 }}>
              <h3 style={{ color: T.navy, margin: '0 0 4px', fontSize: 15 }}>Climate VaR Decomposition — {SCENARIOS[scenario].label} · {horizon}yr · {confidence}% CI</h3>
              <p style={{ color: T.textSec, fontSize: 12, margin: '0 0 16px' }}>
                CVaR_total = CVaR_transition + CVaR_physical + ρ·CVaR_interaction<br />
                Scaled by horizon: √(T/10). Correlation (ρ) = {({ current_policies: 0.15, delayed_transition: 0.25, below_2c: 0.20, divergent_net_zero: 0.28, net_zero_2050: 0.22 }[scenario]).toFixed(2)} under {SCENARIOS[scenario].label}.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
                {[
                  { label: 'Transition VaR', val: `$${(cvar.transVaR/1000).toFixed(3)}B`, sub: `${(cvar.transVaR/cvar.totalVaR*100).toFixed(0)}% of total`, col: T.red },
                  { label: 'Physical VaR', val: `$${(cvar.physVaR/1000).toFixed(3)}B`, sub: `${(cvar.physVaR/cvar.totalVaR*100).toFixed(0)}% of total`, col: T.orange },
                  { label: 'Interaction Term', val: `$${(cvar.interVaR/1000).toFixed(3)}B`, sub: `${(cvar.interVaR/cvar.totalVaR*100).toFixed(0)}% of total`, col: T.amber },
                  { label: 'Total Climate VaR', val: `$${(cvar.totalVaR/1000).toFixed(3)}B`, sub: `${cvar.pct.toFixed(2)}% of AUM`, col: SCENARIOS[scenario].color },
                ].map(m => (
                  <div key={m.label} style={{ background: T.bg, borderRadius: 8, padding: 16, textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: T.textMut, textTransform: 'uppercase' }}>{m.label}</div>
                    <div style={{ fontFamily: T.mono, fontSize: 18, fontWeight: 700, color: m.col, marginTop: 8 }}>{m.val}</div>
                    <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>{m.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Horizon sensitivity */}
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24 }}>
              <h3 style={{ color: T.navy, margin: '0 0 16px', fontSize: 15 }}>Climate VaR — Time Horizon Sensitivity</h3>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={horizonSensitivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="horizon" tick={{ fontSize: 11 }} tickFormatter={v => `${v}yr`} />
                  <YAxis tickFormatter={v => `$${(v/1000).toFixed(1)}B`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={v => [`$${(v/1000).toFixed(3)}B`]} />
                  <Legend />
                  <Area dataKey="transition" name="Transition VaR" stroke={T.red} fill={T.red} fillOpacity={0.15} stackId="a" />
                  <Area dataKey="physical" name="Physical VaR" stroke={T.orange} fill={T.orange} fillOpacity={0.15} stackId="a" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 1 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24 }}>
              <h3 style={{ color: T.navy, margin: '0 0 8px', fontSize: 15 }}>Loss Distribution — {SCENARIOS[scenario].label}</h3>
              <p style={{ color: T.textSec, fontSize: 12, margin: '0 0 16px' }}>
                Normal approximation. VaR at {confidence}% CI = ${(cvar.totalVaR / 1000).toFixed(2)}B. Red tail = exceedance region.
              </p>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={distribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="x" tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} interval={20} />
                  <YAxis hide />
                  <Tooltip formatter={(v, n, p) => [`P(Loss = ${p.payload.x}%)`]} />
                  <Area dataKey="y" stroke={SCENARIOS[scenario].color} fill={SCENARIOS[scenario].color} fillOpacity={0.2} dot={false} name="Loss probability" />
                  <ReferenceLine x={`${(-cvar.pct).toFixed(2)}`} stroke={T.red} strokeDasharray="4 4" label={{ value: `VaR ${confidence}%`, fill: T.red, fontSize: 11 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 2 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24 }}>
              <h3 style={{ color: T.navy, margin: '0 0 16px', fontSize: 15 }}>Climate VaR — All Scenarios Comparison</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={allScenarioCVaR.map(s => ({ name: s.short, transition: s.transVaR, physical: s.physVaR, interaction: s.interVaR, color: s.color }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={v => `$${(v/1000).toFixed(1)}B`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={v => [`$${(v/1000).toFixed(3)}B`]} />
                  <Legend />
                  <Bar dataKey="transition" name="Transition VaR" fill={T.red} stackId="a" opacity={0.9} />
                  <Bar dataKey="physical" name="Physical VaR" fill={T.orange} stackId="a" opacity={0.8} />
                  <Bar dataKey="interaction" name="Interaction" fill={T.amber} stackId="a" radius={[4,4,0,0]} opacity={0.8} />
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginTop: 16 }}>
                {allScenarioCVaR.map(s => (
                  <div key={s.id} style={{ background: T.bg, borderRadius: 8, padding: 12, textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: s.color, fontWeight: 700 }}>{s.short}</div>
                    <div style={{ fontFamily: T.mono, fontSize: 16, fontWeight: 700, color: T.red, marginTop: 4 }}>${(s.totalVaR/1000).toFixed(2)}B</div>
                    <div style={{ fontSize: 11, color: T.textSec }}>{s.pct.toFixed(2)}% AUM</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 3 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24 }}>
              <h3 style={{ color: T.navy, margin: '0 0 8px', fontSize: 15 }}>Delta Climate CoVaR — Systemic Risk Contribution</h3>
              <p style={{ color: T.textSec, fontSize: 12, margin: '0 0 16px' }}>
                ΔCoVaR measures each sector's contribution to systemic climate risk. Defined as VaR_system | sector_in_distress − VaR_system | sector_median.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14 }}>
                {[
                  { sector: 'Oil & Gas', delta_covar_pct: 2.84, exposure_pct: 8.2, color: T.red },
                  { sector: 'Utilities (Coal)', delta_covar_pct: 1.92, exposure_pct: 5.4, color: T.orange },
                  { sector: 'Steel & Cement', delta_covar_pct: 1.45, exposure_pct: 9.8, color: T.amber },
                  { sector: 'Aviation', delta_covar_pct: 0.82, exposure_pct: 4.2, color: T.blue },
                  { sector: 'Real Estate (EPC F/G)', delta_covar_pct: 1.14, exposure_pct: 6.8, color: T.purple },
                  { sector: 'Financials (fossil exp.)', delta_covar_pct: 0.68, exposure_pct: 22.1, color: T.teal },
                ].map(s => (
                  <div key={s.sector} style={{ background: T.bg, borderRadius: 8, padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontWeight: 700, color: T.navy, fontSize: 13 }}>{s.sector}</span>
                      <span style={{ fontFamily: T.mono, fontWeight: 700, color: s.color, fontSize: 16 }}>ΔCoVaR {s.delta_covar_pct}%</span>
                    </div>
                    <div style={{ fontSize: 12, color: T.textSec, marginBottom: 6 }}>Portfolio weight: {s.exposure_pct}%</div>
                    <div style={{ height: 6, background: T.border, borderRadius: 3 }}>
                      <div style={{ height: '100%', width: `${Math.min(100, s.delta_covar_pct * 20)}%`, background: s.color, borderRadius: 3 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 4 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24 }}>
              <h3 style={{ color: T.navy, margin: '0 0 16px', fontSize: 15 }}>Stress Test Matrix — VaR % AUM by Scenario × Horizon</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.navy }}>
                    <th style={{ padding: '10px 16px', color: '#fff', textAlign: 'left' }}>Scenario</th>
                    {[1, 3, 5, 10, 15, 20, 30].map(h => <th key={h} style={{ padding: '10px 10px', color: '#fff', textAlign: 'center' }}>{h}yr</th>)}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(SCENARIOS).map(([k, v], i) => (
                    <tr key={k} style={{ background: i % 2 === 0 ? T.surface : T.bg }}>
                      <td style={{ padding: '9px 16px', fontWeight: 600, color: v.color }}>{v.label}</td>
                      {[1, 3, 5, 10, 15, 20, 30].map(h => {
                        const r = computeCVaR(aum, k, h);
                        const isSelected = k === scenario && h === horizon;
                        return (
                          <td key={h} style={{ padding: '9px 10px', textAlign: 'center', background: isSelected ? v.color + '22' : 'transparent', fontFamily: T.mono, fontWeight: isSelected ? 700 : 400, color: r.pct > 10 ? T.red : r.pct > 5 ? T.amber : T.green, fontSize: isSelected ? 14 : 12 }}>
                            {r.pct.toFixed(1)}%
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
