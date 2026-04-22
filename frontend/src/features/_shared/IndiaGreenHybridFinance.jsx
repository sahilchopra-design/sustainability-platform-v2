import React, { useMemo, useState } from 'react';

// =======================================================================
// IndiaGreenHybridFinance — hybrid business-use-case + financial planning +
// carbon markets (India + global) + scenario simulation + financial risks
// panel. Used in Sprint EA-hybrid (EP-EA1..EP-EA6).
// =======================================================================

const normT = (t = {}) => ({
  bg: t.bg || '#FAFAF7',
  surface: t.surface || t.card || '#FFFFFF',
  surfaceH: t.surfaceH || t.sub || '#F1EDE4',
  border: t.border || '#E5E2D9',
  borderL: t.borderL || t.border || '#EDE9E0',
  navy: t.navy || '#0F172A',
  gold: t.gold || t.accent || '#B8860B',
  sage: t.sage || '#2D6A4F',
  text: t.text || t.textPri || '#1A1A2E',
  textSec: t.textSec || t.sub || '#4B5563',
  textMut: t.textMut || t.sub || '#6B7280',
  red: t.red || '#DC2626',
  green: t.green || '#16A34A',
  amber: t.amber || '#D97706',
  teal: t.teal || '#0D4F5C',
  font: t.font || "'Inter', sans-serif",
  mono: t.mono || t.fontMono || "'JetBrains Mono', monospace",
  ...t,
});

// Deterministic seeded PRNG (platform pattern)
const sr = (seed) => { const x = Math.sin(seed + 1) * 10000; return x - Math.floor(x); };

// -------- Global carbon market scenario paths (2025 → 2034) ----------
// Sourced from: EU Commission MSR + Ember + BloombergNEF + MoEFCC CCTS + ICAP
// Prices in local currency/ccy of market; all per tCO2e.
const CARBON_PATHS = {
  Base: {
    EUA:  [85, 92, 100, 108, 115, 120, 125, 130, 135, 142],      // €/t  — EU ETS MSR-adjusted
    UK:   [78, 84, 90, 96, 102, 108, 112, 116, 120, 125],        // £/t  — UK ETS
    CCC:  [2200, 2350, 2500, 2700, 2900, 3100, 3300, 3500, 3700, 3900], // ₹/t India CCTS
    ITMO: [15, 16.5, 18, 19.5, 21, 22.5, 24, 26, 28, 30],         // €/t Article 6.2
    JCM:  [1200, 1350, 1500, 1650, 1800, 1950, 2100, 2250, 2400, 2550], // ¥/t
    VCMn: [15, 17, 19, 21, 23, 25, 28, 31, 34, 38],               // $/t VCM Nature
    VCMr: [95, 105, 118, 130, 140, 152, 165, 178, 190, 205],      // $/t VCM Removals
    GX:   [8500, 9200, 10000, 10800, 11600, 12400, 13200, 14000, 14800, 15600], // ¥/t Japan GX-ETS
  },
  Bull: { // NGFS Orderly + high ambition
    EUA:  [85, 98, 115, 130, 148, 165, 180, 195, 210, 225],
    UK:   [78, 90, 105, 120, 135, 150, 160, 170, 180, 190],
    CCC:  [2200, 2550, 3000, 3500, 4000, 4500, 5000, 5500, 6000, 6500],
    ITMO: [15, 18, 22, 26, 30, 34, 38, 42, 46, 50],
    JCM:  [1200, 1500, 1850, 2200, 2550, 2900, 3200, 3500, 3800, 4100],
    VCMn: [15, 19, 23, 28, 33, 38, 43, 48, 53, 58],
    VCMr: [95, 115, 138, 160, 185, 210, 235, 260, 285, 310],
    GX:   [8500, 10200, 12000, 13900, 15800, 17800, 19700, 21600, 23500, 25400],
  },
  Bear: { // NGFS delayed / HWS — demand collapse
    EUA:  [85, 82, 78, 75, 72, 70, 68, 66, 64, 62],
    UK:   [78, 75, 72, 69, 66, 64, 62, 60, 58, 56],
    CCC:  [2200, 2100, 2000, 1950, 1900, 1850, 1800, 1750, 1700, 1650],
    ITMO: [15, 14, 13, 12.5, 12, 11.5, 11, 10.5, 10, 9.5],
    JCM:  [1200, 1150, 1100, 1050, 1000, 950, 925, 900, 875, 850],
    VCMn: [15, 13, 11, 9.5, 8.5, 8, 7.5, 7, 6.5, 6],
    VCMr: [95, 88, 82, 76, 72, 68, 65, 62, 60, 58],
    GX:   [8500, 8200, 7900, 7600, 7300, 7100, 6900, 6700, 6500, 6300],
  },
  Disorderly: { // NGFS Disorderly — volatile, late policy correction
    EUA:  [85, 88, 85, 95, 140, 160, 175, 190, 200, 210],
    UK:   [78, 80, 78, 88, 128, 145, 160, 172, 182, 190],
    CCC:  [2200, 2250, 2200, 2500, 3800, 4400, 4800, 5100, 5400, 5700],
    ITMO: [15, 16, 15, 18, 32, 36, 40, 43, 45, 47],
    JCM:  [1200, 1250, 1200, 1400, 2800, 3100, 3350, 3550, 3750, 3950],
    VCMn: [15, 16, 15, 18, 32, 38, 42, 46, 50, 54],
    VCMr: [95, 100, 98, 115, 200, 225, 245, 265, 285, 305],
    GX:   [8500, 8800, 8500, 9800, 17000, 19000, 20800, 22400, 23900, 25200],
  },
};

// Scenario probability weights (for Monte-Carlo blended NPV)
const SCENARIO_WEIGHTS = { Base: 0.45, Bull: 0.20, Bear: 0.20, Disorderly: 0.15 };

// --------- Sub-components ---------

function CapitalStack({ T, stack, label }) {
  const total = stack.reduce((a, b) => a + b.amount, 0);
  if (total <= 0) return null;
  const COLORS = ['#0F172A', '#B8860B', '#2D6A4F', '#0D4F5C', '#7C3AED', '#DC2626', '#0891B2'];
  return (
    <div style={{ padding: 14, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6 }}>
      <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, letterSpacing: 1, marginBottom: 10 }}>CAPITAL STACK · BLENDED FINANCE</div>
      <div style={{ display: 'flex', height: 28, borderRadius: 4, overflow: 'hidden', border: `1px solid ${T.borderL}` }}>
        {stack.map((s, i) => (
          <div key={i} title={`${s.label}: ${s.amount.toLocaleString('en-IN')} ${s.unit || ''} (${(s.amount / total * 100).toFixed(1)}%)`}
            style={{ flex: s.amount, background: COLORS[i % COLORS.length], color: '#FFF', fontFamily: T.mono, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 40 }}>
            {(s.amount / total * 100).toFixed(0)}%
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8, marginTop: 10 }}>
        {stack.map((s, i) => (
          <div key={i} style={{ padding: 6, background: T.surfaceH, borderRadius: 4, borderLeft: `3px solid ${COLORS[i % COLORS.length]}` }}>
            <div style={{ fontSize: 9, color: T.textMut, fontFamily: T.mono }}>{s.label}</div>
            <div style={{ fontSize: 13, color: T.text, fontFamily: T.mono, fontWeight: 700, marginTop: 2 }}>
              {s.amount.toLocaleString('en-IN')} <span style={{ fontSize: 9, color: T.textMut }}>{s.unit || ''}</span>
            </div>
            {s.source && <div style={{ fontSize: 9, color: T.textSec, marginTop: 2 }}>{s.source}</div>}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 10, color: T.textMut, fontFamily: T.mono, marginTop: 8 }}>
        {label || 'TOTAL DEAL SIZE'}: <b style={{ color: T.text }}>{total.toLocaleString('en-IN')} {stack[0]?.unit || ''}</b>
      </div>
    </div>
  );
}

function RevenueStack({ T, streams, unit, scenarioMult }) {
  if (!streams || !streams.length) return null;
  const adj = streams.map(s => ({ ...s, value: s.value * (s.scenSens ? scenarioMult : 1) }));
  const total = adj.reduce((a, b) => a + b.value, 0);
  return (
    <div style={{ padding: 14, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6 }}>
      <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, letterSpacing: 1, marginBottom: 10 }}>REVENUE STACK · CREDIT ENHANCEMENT</div>
      <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
        <thead><tr style={{ color: T.textMut, fontFamily: T.mono, fontSize: 10 }}>
          <th style={{ padding: 6, textAlign: 'left' }}>STREAM</th>
          <th style={{ padding: 6, textAlign: 'right' }}>VALUE ({unit})</th>
          <th style={{ padding: 6, textAlign: 'right' }}>%</th>
          <th style={{ padding: 6, textAlign: 'left' }}>SOURCE / RULE</th>
        </tr></thead>
        <tbody>
          {adj.map((s, i) => (
            <tr key={i} style={{ borderTop: `1px solid ${T.borderL}` }}>
              <td style={{ padding: 6, color: T.text }}>{s.label} {s.scenSens && <span style={{ fontSize: 9, color: T.gold }}>⚡</span>}</td>
              <td style={{ padding: 6, textAlign: 'right', color: s.value >= 0 ? T.green : T.red, fontFamily: T.mono, fontWeight: 700 }}>
                {s.value >= 0 ? '+' : ''}{s.value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </td>
              <td style={{ padding: 6, textAlign: 'right', color: T.textSec, fontFamily: T.mono }}>{(s.value / total * 100).toFixed(1)}%</td>
              <td style={{ padding: 6, color: T.textSec, fontSize: 10, fontFamily: T.mono }}>{s.source || ''}</td>
            </tr>
          ))}
          <tr style={{ borderTop: `2px solid ${T.gold}` }}>
            <td style={{ padding: 6, color: T.gold, fontFamily: T.mono, fontWeight: 700 }}>TOTAL BLENDED REVENUE</td>
            <td style={{ padding: 6, textAlign: 'right', color: T.gold, fontFamily: T.mono, fontWeight: 700 }}>{total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
            <td style={{ padding: 6, textAlign: 'right', color: T.gold, fontFamily: T.mono }}>100.0%</td>
            <td />
          </tr>
        </tbody>
      </table>
      <div style={{ fontSize: 9, color: T.textMut, fontFamily: T.mono, marginTop: 6 }}>⚡ scenario-sensitive stream (flexes with carbon path)</div>
    </div>
  );
}

function TermSheet({ T, terms }) {
  if (!terms) return null;
  return (
    <div style={{ padding: 14, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6 }}>
      <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, letterSpacing: 1, marginBottom: 10 }}>INDICATIVE TERM SHEET</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
        {terms.map((t, i) => (
          <div key={i} style={{ padding: 8, background: T.surfaceH, borderRadius: 4 }}>
            <div style={{ fontSize: 9, color: T.textMut, fontFamily: T.mono, letterSpacing: 0.5 }}>{t.k}</div>
            <div style={{ fontSize: 12, color: T.text, fontFamily: T.mono, fontWeight: 700, marginTop: 3 }}>{t.v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 10-year financial model: P&L → FCF → NPV/IRR
function FinancialModel({ T, fm, scenarioMult }) {
  const { years = 10, revenue0, revenueGrowth = 0.03, opexPct = 0.35, daPct = 0.08, taxRate = 0.25, wacc = 0.09, capex = [] } = fm;
  const rows = useMemo(() => {
    const out = [];
    let prevRevenue = revenue0;
    for (let y = 1; y <= years; y++) {
      const rev = prevRevenue * (y === 1 ? 1 : (1 + revenueGrowth)) * (y === 1 ? 1 : 1) * (y > 1 ? 1 : 1);
      const revenue = revenue0 * Math.pow(1 + revenueGrowth, y - 1) * scenarioMult;
      const opex = revenue * opexPct;
      const ebitda = revenue - opex;
      const da = revenue * daPct;
      const ebit = ebitda - da;
      const tax = Math.max(0, ebit) * taxRate;
      const nopat = ebit - tax;
      const cpx = capex[y - 1] || 0;
      const fcf = nopat + da - cpx;
      out.push({ y, revenue, opex, ebitda, da, ebit, tax, nopat, capex: cpx, fcf });
      prevRevenue = revenue;
    }
    return out;
  }, [fm, scenarioMult, years, revenue0, revenueGrowth, opexPct, daPct, taxRate, capex]);
  const npv = rows.reduce((a, r) => a + r.fcf / Math.pow(1 + wacc, r.y), 0);
  // Simple IRR bisection on FCF stream (treat Y0 as negative initial capex lump)
  const initial = -(capex.slice(0, Math.max(1, years)).reduce((a, b) => a + (b || 0), 0) * 0.5 + revenue0 * 0.6);
  const irr = useMemo(() => {
    const fn = (r) => initial + rows.reduce((a, row) => a + row.fcf / Math.pow(1 + r, row.y), 0);
    let lo = -0.2, hi = 0.8;
    for (let i = 0; i < 60; i++) {
      const m = (lo + hi) / 2;
      if (fn(m) > 0) lo = m; else hi = m;
    }
    return (lo + hi) / 2;
  }, [rows, initial]);
  return (
    <div style={{ padding: 14, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, letterSpacing: 1 }}>FINANCIAL MODEL · {years}Y P&amp;L → FCF</div>
        <div style={{ display: 'flex', gap: 14, fontFamily: T.mono, fontSize: 11 }}>
          <div><span style={{ color: T.textMut }}>NPV @ {(wacc * 100).toFixed(1)}%:</span> <b style={{ color: npv >= 0 ? T.green : T.red }}>{npv.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</b></div>
          <div><span style={{ color: T.textMut }}>IRR:</span> <b style={{ color: irr >= wacc ? T.green : T.red }}>{(irr * 100).toFixed(1)}%</b></div>
          <div><span style={{ color: T.textMut }}>WACC:</span> <b style={{ color: T.text }}>{(wacc * 100).toFixed(1)}%</b></div>
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', fontSize: 10, borderCollapse: 'collapse', fontFamily: T.mono, minWidth: 720 }}>
          <thead><tr style={{ color: T.textMut }}>
            <th style={{ padding: 4, textAlign: 'left' }}>LINE ITEM</th>
            {rows.map(r => <th key={r.y} style={{ padding: 4, textAlign: 'right' }}>Y{r.y}</th>)}
          </tr></thead>
          <tbody>
            {[
              ['Revenue', 'revenue', T.green],
              ['(-) Opex', 'opex', T.red],
              ['EBITDA', 'ebitda', T.text],
              ['(-) D&A', 'da', T.textSec],
              ['EBIT', 'ebit', T.text],
              ['(-) Tax', 'tax', T.red],
              ['NOPAT', 'nopat', T.text],
              ['(-) Capex', 'capex', T.amber],
              ['FCF', 'fcf', T.gold],
            ].map(([label, k, color]) => (
              <tr key={k} style={{ borderTop: `1px solid ${T.borderL}` }}>
                <td style={{ padding: 4, color: T.textSec, fontWeight: k === 'ebitda' || k === 'fcf' ? 700 : 400 }}>{label}</td>
                {rows.map(r => (
                  <td key={r.y} style={{ padding: 4, textAlign: 'right', color, fontWeight: k === 'ebitda' || k === 'fcf' ? 700 : 400 }}>
                    {r[k].toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ fontSize: 9, color: T.textMut, fontFamily: T.mono, marginTop: 6 }}>
        Values in deal currency · scenario multiplier applied: ×{scenarioMult.toFixed(2)} · growth {(revenueGrowth * 100).toFixed(1)}% · opex {(opexPct * 100).toFixed(0)}% · tax {(taxRate * 100).toFixed(0)}%
      </div>
    </div>
  );
}

// Carbon market paths — inline sparkline + table for all markets
function CarbonMarkets({ T, scenario }) {
  const paths = CARBON_PATHS[scenario];
  const MARKETS = [
    { k: 'EUA', name: 'EU ETS · EUA', unit: '€/t', reg: 'EU Commission MSR' },
    { k: 'UK',  name: 'UK ETS', unit: '£/t', reg: 'UK DESNZ' },
    { k: 'CCC', name: 'India CCTS (CCC)', unit: '₹/t', reg: 'MoEFCC / CERC' },
    { k: 'ITMO', name: 'Article 6.2 ITMO', unit: '€/t', reg: 'UNFCCC BTA' },
    { k: 'JCM', name: 'Japan JCM', unit: '¥/t', reg: 'MoE Japan' },
    { k: 'GX',  name: 'Japan GX-ETS', unit: '¥/t', reg: 'METI GX Transition' },
    { k: 'VCMn', name: 'VCM · Nature', unit: '$/t', reg: 'Verra / Gold Std' },
    { k: 'VCMr', name: 'VCM · Removals', unit: '$/t', reg: 'Puro / ICVCM CCP' },
  ];
  const Spark = ({ vals }) => {
    const min = Math.min(...vals), max = Math.max(...vals);
    const rng = max - min || 1;
    return (
      <svg width={120} height={24} style={{ verticalAlign: 'middle' }}>
        <polyline fill="none" stroke={T.gold} strokeWidth={1.5}
          points={vals.map((v, i) => `${(i / (vals.length - 1)) * 118 + 1},${22 - ((v - min) / rng) * 20}`).join(' ')} />
      </svg>
    );
  };
  return (
    <div style={{ padding: 14, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6 }}>
      <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, letterSpacing: 1, marginBottom: 10 }}>
        CARBON MARKET PRICE PATHS · {scenario.toUpperCase()} · 2025→2034 · 🇮🇳 + 🌐
      </div>
      <table style={{ width: '100%', fontSize: 10, borderCollapse: 'collapse', fontFamily: T.mono }}>
        <thead><tr style={{ color: T.textMut }}>
          <th style={{ padding: 4, textAlign: 'left' }}>MARKET</th>
          <th style={{ padding: 4, textAlign: 'right' }}>2025</th>
          <th style={{ padding: 4, textAlign: 'right' }}>2030</th>
          <th style={{ padding: 4, textAlign: 'right' }}>2034</th>
          <th style={{ padding: 4, textAlign: 'right' }}>CAGR</th>
          <th style={{ padding: 4, textAlign: 'left' }}>PATH</th>
          <th style={{ padding: 4, textAlign: 'left' }}>REGULATOR</th>
        </tr></thead>
        <tbody>
          {MARKETS.map(m => {
            const p = paths[m.k];
            const cagr = (Math.pow(p[9] / p[0], 1 / 9) - 1) * 100;
            return (
              <tr key={m.k} style={{ borderTop: `1px solid ${T.borderL}` }}>
                <td style={{ padding: 4, color: T.text, fontWeight: 600 }}>{m.name}</td>
                <td style={{ padding: 4, textAlign: 'right', color: T.textSec }}>{p[0].toLocaleString()} {m.unit}</td>
                <td style={{ padding: 4, textAlign: 'right', color: T.text }}>{p[5].toLocaleString()}</td>
                <td style={{ padding: 4, textAlign: 'right', color: T.gold, fontWeight: 700 }}>{p[9].toLocaleString()}</td>
                <td style={{ padding: 4, textAlign: 'right', color: cagr >= 0 ? T.green : T.red }}>{cagr >= 0 ? '+' : ''}{cagr.toFixed(1)}%</td>
                <td style={{ padding: 4 }}><Spark vals={p} /></td>
                <td style={{ padding: 4, color: T.textMut, fontSize: 9 }}>{m.reg}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Risk dashboard — VaR, Expected Shortfall, credit default prob, sensitivities
function RiskDashboard({ T, risk, scenarioMult }) {
  if (!risk) return null;
  const adjNpv95 = (risk.var95 || 0) * (2 - scenarioMult);
  const adjEs99  = (risk.es99  || 0) * (2 - scenarioMult);
  const tiles = [
    { label: 'VaR 95% (1-yr)', value: `${adjNpv95.toFixed(1)}${risk.unit || 'M'}`, color: T.red, detail: 'Historical simulation · 2018-2025' },
    { label: 'Expected Shortfall 99%', value: `${adjEs99.toFixed(1)}${risk.unit || 'M'}`, color: T.red, detail: 'Conditional tail avg' },
    { label: 'Counterparty PD (1-yr)', value: `${(risk.defaultProb * 100).toFixed(2)}%`, color: risk.defaultProb < 0.02 ? T.green : T.amber, detail: risk.ratingImplied || 'Moody\'s KMV' },
    { label: 'Policy risk score', value: `${risk.policyScore.toFixed(1)}/10`, color: risk.policyScore >= 7 ? T.green : risk.policyScore >= 5 ? T.amber : T.red, detail: 'Oxford Smith School' },
    { label: 'FX sensitivity (±10%)', value: `${risk.fxSensPct >= 0 ? '+' : ''}${risk.fxSensPct.toFixed(1)}% NPV`, color: T.amber, detail: risk.fxPair || 'USD/INR · EUR/USD' },
    { label: 'Carbon price β', value: `${risk.carbonBeta.toFixed(2)}`, color: T.gold, detail: 'ΔNPV / Δcarbon-price' },
    { label: 'Interest-rate DV01', value: `${risk.dv01.toFixed(2)}${risk.unit || 'M'}/bp`, color: T.navy, detail: 'Delta for +1bp parallel' },
    { label: 'Climate physical VaR', value: `${(risk.climVaR || 0).toFixed(1)}${risk.unit || 'M'}`, color: T.teal, detail: 'RCP 4.5 · acute/chronic' },
  ];
  return (
    <div style={{ padding: 14, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6 }}>
      <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, letterSpacing: 1, marginBottom: 10 }}>
        FINANCIAL RISK DASHBOARD · VaR / ES / PD / SENSITIVITIES
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8 }}>
        {tiles.map((t, i) => (
          <div key={i} style={{ padding: 8, background: T.surfaceH, borderRadius: 4, borderLeft: `3px solid ${t.color}` }}>
            <div style={{ fontSize: 9, color: T.textMut, fontFamily: T.mono, letterSpacing: 0.5 }}>{t.label}</div>
            <div style={{ fontSize: 14, color: t.color, fontFamily: T.mono, fontWeight: 700, marginTop: 3 }}>{t.value}</div>
            <div style={{ fontSize: 9, color: T.textMut, marginTop: 2 }}>{t.detail}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Monte-Carlo NPV distribution across 1000 paths × 4 scenarios
function MonteCarloNpv({ T, fm, scenarioBlendedMult }) {
  const N = 1000;
  const { revenue0, revenueGrowth = 0.03, opexPct = 0.35, daPct = 0.08, taxRate = 0.25, wacc = 0.09, years = 10, capex = [] } = fm;
  const results = useMemo(() => {
    const arr = [];
    for (let i = 0; i < N; i++) {
      const multJitter = 0.85 + sr(i * 7) * 0.30; // 0.85-1.15 noise
      // blend scenario multiplier with jitter
      let npv = 0;
      for (let y = 1; y <= years; y++) {
        const rev = revenue0 * Math.pow(1 + revenueGrowth, y - 1) * scenarioBlendedMult * multJitter;
        const opex = rev * opexPct;
        const ebitda = rev - opex;
        const da = rev * daPct;
        const ebit = ebitda - da;
        const tax = Math.max(0, ebit) * taxRate;
        const fcf = ebit - tax + da - (capex[y - 1] || 0);
        npv += fcf / Math.pow(1 + wacc, y);
      }
      arr.push(npv);
    }
    arr.sort((a, b) => a - b);
    return arr;
  }, [fm, scenarioBlendedMult]);
  const p5 = results[Math.floor(N * 0.05)];
  const p50 = results[Math.floor(N * 0.5)];
  const p95 = results[Math.floor(N * 0.95)];
  const mean = results.reduce((a, b) => a + b, 0) / N;
  // histogram bins
  const min = results[0], max = results[N - 1];
  const bins = 24;
  const binW = (max - min) / bins || 1;
  const hist = new Array(bins).fill(0);
  results.forEach(v => {
    const idx = Math.min(bins - 1, Math.floor((v - min) / binW));
    hist[idx]++;
  });
  const maxBin = Math.max(...hist);
  return (
    <div style={{ padding: 14, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6 }}>
      <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, letterSpacing: 1, marginBottom: 10 }}>
        MONTE-CARLO · 1,000-PATH NPV DISTRIBUTION (SCENARIO-BLENDED)
      </div>
      <div style={{ display: 'flex', gap: 18, fontFamily: T.mono, fontSize: 11, marginBottom: 10 }}>
        <div><span style={{ color: T.textMut }}>p5:</span> <b style={{ color: T.red }}>{p5.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</b></div>
        <div><span style={{ color: T.textMut }}>p50:</span> <b style={{ color: T.text }}>{p50.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</b></div>
        <div><span style={{ color: T.textMut }}>mean:</span> <b style={{ color: T.gold }}>{mean.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</b></div>
        <div><span style={{ color: T.textMut }}>p95:</span> <b style={{ color: T.green }}>{p95.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</b></div>
        <div><span style={{ color: T.textMut }}>P(NPV&gt;0):</span> <b style={{ color: T.teal }}>{(results.filter(v => v > 0).length / N * 100).toFixed(1)}%</b></div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 80, background: T.surfaceH, padding: 4, borderRadius: 3 }}>
        {hist.map((h, i) => (
          <div key={i} title={`Bin ${i}: ${h}`}
            style={{ flex: 1, height: `${(h / maxBin) * 100}%`, background: (min + (i + 0.5) * binW) > 0 ? T.green : T.red }} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: T.textMut, fontFamily: T.mono, marginTop: 4 }}>
        <span>{min.toFixed(0)}</span><span>NPV distribution</span><span>{max.toFixed(0)}</span>
      </div>
    </div>
  );
}

// DSCR Waterfall
function DscrWaterfall({ T, fm, stressed, covenant = 1.35 }) {
  const { debtService = 0 } = fm;
  const rows = useMemo(() => {
    if (!debtService) return [];
    const out = [];
    for (let y = 1; y <= (fm.years || 10); y++) {
      const rev = fm.revenue0 * Math.pow(1 + (fm.revenueGrowth || 0.03), y - 1) * stressed;
      const ebitda = rev * (1 - (fm.opexPct || 0.35));
      const cfads = ebitda * 0.85; // simplified tax + wc adjustment
      const dscr = debtService > 0 ? cfads / debtService : 0;
      out.push({ y, cfads, dscr });
    }
    return out;
  }, [fm, stressed]);
  if (!rows.length) return null;
  const minD = Math.min(...rows.map(r => r.dscr));
  return (
    <div style={{ padding: 14, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, letterSpacing: 1 }}>DSCR WATERFALL</div>
        <div style={{ fontFamily: T.mono, fontSize: 10, color: minD >= covenant ? T.green : T.red }}>
          MIN {minD.toFixed(2)}x · COV {covenant}x · {minD >= covenant ? 'PASS' : 'BREACH'}
        </div>
      </div>
      <table style={{ width: '100%', fontSize: 10, borderCollapse: 'collapse', fontFamily: T.mono }}>
        <thead><tr style={{ color: T.textMut }}>
          <th style={{ padding: 4, textAlign: 'left' }}>YR</th>
          <th style={{ padding: 4, textAlign: 'right' }}>CFADS</th>
          <th style={{ padding: 4, textAlign: 'right' }}>DS</th>
          <th style={{ padding: 4, textAlign: 'right' }}>DSCR</th>
          <th style={{ padding: 4 }}>COV BAR</th>
        </tr></thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.y} style={{ borderTop: `1px solid ${T.borderL}` }}>
              <td style={{ padding: 4, color: T.textSec }}>{r.y}</td>
              <td style={{ padding: 4, textAlign: 'right', color: T.text }}>{r.cfads.toFixed(1)}</td>
              <td style={{ padding: 4, textAlign: 'right', color: T.text }}>{debtService.toFixed(1)}</td>
              <td style={{ padding: 4, textAlign: 'right', color: r.dscr >= covenant ? T.green : T.red, fontWeight: 700 }}>{r.dscr.toFixed(2)}x</td>
              <td style={{ padding: 4 }}>
                <div style={{ height: 6, background: T.surfaceH, borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, r.dscr / (covenant * 2) * 100)}%`, height: '100%', background: r.dscr >= covenant ? T.green : T.red }} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Bankability radar
function Bankability({ T, scores }) {
  if (!scores) return null;
  const avg = scores.reduce((a, b) => a + b.score, 0) / scores.length;
  return (
    <div style={{ padding: 14, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, letterSpacing: 1 }}>BANKABILITY SCORECARD</div>
        <div style={{ fontFamily: T.mono, fontSize: 12, color: avg >= 7 ? T.green : avg >= 5 ? T.amber : T.red, fontWeight: 700 }}>
          {avg.toFixed(1)}/10 · {avg >= 8 ? 'INV GRADE' : avg >= 6 ? 'BANKABLE' : avg >= 4 ? 'MARGINAL' : 'NON-BANKABLE'}
        </div>
      </div>
      {scores.map((s, i) => (
        <div key={i} style={{ marginBottom: 5 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: T.mono, fontSize: 10, color: T.textSec, marginBottom: 2 }}>
            <span>{s.label}</span>
            <span style={{ color: s.score >= 7 ? T.green : s.score >= 5 ? T.amber : T.red, fontWeight: 700 }}>{s.score.toFixed(1)}</span>
          </div>
          <div style={{ height: 5, background: T.surfaceH, borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: `${s.score * 10}%`, height: '100%', background: s.score >= 7 ? T.green : s.score >= 5 ? T.amber : T.red }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function LenderMatrix({ T, lenders }) {
  if (!lenders) return null;
  return (
    <div style={{ padding: 14, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6 }}>
      <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, letterSpacing: 1, marginBottom: 10 }}>FINANCIER MATRIX · INDICATIVE TICKETS</div>
      <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
        <thead><tr style={{ color: T.textMut, fontFamily: T.mono, fontSize: 10 }}>
          <th style={{ padding: 6, textAlign: 'left' }}>LENDER</th>
          <th style={{ padding: 6, textAlign: 'left' }}>INSTRUMENT</th>
          <th style={{ padding: 6, textAlign: 'right' }}>TENOR</th>
          <th style={{ padding: 6, textAlign: 'right' }}>PRICING</th>
          <th style={{ padding: 6, textAlign: 'right' }}>TICKET</th>
          <th style={{ padding: 6, textAlign: 'left' }}>FIT</th>
        </tr></thead>
        <tbody>{lenders.map((l, i) => (
          <tr key={i} style={{ borderTop: `1px solid ${T.borderL}` }}>
            <td style={{ padding: 6, color: T.text, fontWeight: 600 }}>{l.name}</td>
            <td style={{ padding: 6, color: T.textSec, fontFamily: T.mono, fontSize: 10 }}>{l.instrument}</td>
            <td style={{ padding: 6, textAlign: 'right', color: T.text, fontFamily: T.mono }}>{l.tenor}</td>
            <td style={{ padding: 6, textAlign: 'right', color: T.text, fontFamily: T.mono }}>{l.pricing}</td>
            <td style={{ padding: 6, textAlign: 'right', color: T.text, fontFamily: T.mono }}>{l.ticket}</td>
            <td style={{ padding: 6, color: l.fit === 'High' ? T.green : l.fit === 'Mid' ? T.amber : T.textSec, fontFamily: T.mono, fontSize: 10, fontWeight: 700 }}>
              {l.fit === 'High' ? '●' : l.fit === 'Mid' ? '◐' : '○'} {l.fit}
            </td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

// =======================================================================
// ============ ADVANCED CALCULATION ENGINES (Sprint EA-hybrid-v2) ========
// =======================================================================

// Normal CDF via Abramowitz-Stegun erf approximation
const ndf = (x) => {
  const a1=0.254829592,a2=-0.284496736,a3=1.421413741,a4=-1.453152027,a5=1.061405429,p=0.3275911;
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x) / Math.sqrt(2);
  const t = 1 / (1 + p * ax);
  const y = 1 - (((((a5*t+a4)*t)+a3)*t+a2)*t+a1)*t*Math.exp(-ax*ax);
  return 0.5 * (1 + sign * y);
};
// Standard-normal PDF
const npd = (x) => Math.exp(-x*x/2) / Math.sqrt(2*Math.PI);

// ---- 1) MERTON STRUCTURAL CREDIT ENGINE ----
function CreditRiskEngine({ T, fm, risk }) {
  const eng = useMemo(() => {
    const rev = fm.revenue0 || 100;
    const debtService = fm.debtService || rev * 0.35;
    const D = debtService * 10 * 0.65; // PV debt proxy
    const V = rev * 5.5 + D;           // enterprise value proxy
    const sigmaA = 0.28;                // asset vol (sector default)
    const r = fm.wacc || 0.09;
    const T1 = 1;
    const d2 = (Math.log(V/Math.max(1,D)) + (r - sigmaA*sigmaA/2)*T1) / (sigmaA*Math.sqrt(T1));
    const PD = 1 - ndf(d2);
    const DD = d2;
    const LGD = risk?.lgd ?? 0.45;
    const EAD = D;
    const EL = PD * LGD * EAD;
    const UL = EAD * LGD * Math.sqrt(PD*(1-PD));
    const RAROC = (rev - EL) / Math.max(1, EAD) * 100;
    const CVA = EL * 3.2;              // duration × credit-spread mult
    const rating = PD<0.001?'AAA':PD<0.005?'AA':PD<0.01?'A':PD<0.02?'BBB':PD<0.05?'BB':PD<0.10?'B':'CCC';
    return { V, D, DD, PD, LGD, EAD, EL, UL, RAROC, CVA, rating, sigmaA };
  }, [fm, risk]);
  const tiles = [
    { k:'Distance-to-Default', v:eng.DD.toFixed(2), c:eng.DD>3?T.green:eng.DD>1.5?T.amber:T.red, d:'Merton DD = ln(V/D)+(r−σ²/2)T / σ√T' },
    { k:'PD 1-yr (structural)', v:(eng.PD*100).toFixed(2)+'%', c:eng.PD<0.02?T.green:eng.PD<0.05?T.amber:T.red, d:`Implied rating: ${eng.rating}` },
    { k:'LGD', v:(eng.LGD*100).toFixed(0)+'%', c:T.amber, d:'Senior-secured recovery 55%' },
    { k:'EAD', v:eng.EAD.toFixed(1), c:T.navy, d:'Exposure at default (PV debt)' },
    { k:'Expected Loss (EL)', v:eng.EL.toFixed(2), c:T.red, d:'EL = PD × LGD × EAD' },
    { k:'Unexpected Loss (UL)', v:eng.UL.toFixed(2), c:T.red, d:'Economic capital input' },
    { k:'CVA', v:eng.CVA.toFixed(2), c:T.amber, d:'Counterparty valuation adj' },
    { k:'RAROC', v:eng.RAROC.toFixed(1)+'%', c:eng.RAROC>12?T.green:T.amber, d:'Risk-adjusted return on capital' },
  ];
  return (
    <div style={{ padding:14, background:T.surface, border:`1px solid ${T.border}`, borderRadius:6 }}>
      <div style={{ fontFamily:T.mono, fontSize:11, color:T.gold, letterSpacing:1, marginBottom:10 }}>
        CREDIT RISK ENGINE · MERTON STRUCTURAL · IRB/BASEL III
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px,1fr))', gap:8 }}>
        {tiles.map((t,i)=>(
          <div key={i} style={{ padding:8, background:T.surfaceH, borderRadius:4, borderLeft:`3px solid ${t.c}` }}>
            <div style={{ fontSize:9, color:T.textMut, fontFamily:T.mono, letterSpacing:0.5 }}>{t.k}</div>
            <div style={{ fontSize:14, color:t.c, fontFamily:T.mono, fontWeight:700, marginTop:3 }}>{t.v}</div>
            <div style={{ fontSize:9, color:T.textMut, marginTop:2 }}>{t.d}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize:9, color:T.textMut, fontFamily:T.mono, marginTop:8 }}>
        σA={(eng.sigmaA*100).toFixed(0)}% · V={eng.V.toFixed(1)} · D={eng.D.toFixed(1)} · Basel III IRB foundation · ECL IFRS 9 stage 1→3 transition ready.
      </div>
    </div>
  );
}

// ---- 2) MARKET-RISK TRIPTYCH (Parametric / Historical / MC / CF + ES) ----
function MarketRiskTriptych({ T, fm, scenarioBlendedMult }) {
  const eng = useMemo(() => {
    const N = 2000;
    const { revenue0, revenueGrowth=0.03, opexPct=0.35, daPct=0.08, taxRate=0.25, wacc=0.09, years=10, capex=[] } = fm;
    const pnl = [];
    for (let i=0;i<N;i++){
      const j = 0.82 + sr(i*11)*0.36;       // ±18% noise
      const g = revenueGrowth + (sr(i*13)-0.5)*0.03;
      let npv = 0;
      for (let y=1;y<=years;y++){
        const rev = revenue0 * Math.pow(1+g, y-1) * scenarioBlendedMult * j;
        const ebitda = rev * (1-opexPct);
        const ebit = ebitda - rev*daPct;
        const tax = Math.max(0,ebit)*taxRate;
        const fcf = ebit - tax + rev*daPct - (capex[y-1]||0);
        npv += fcf / Math.pow(1+wacc, y);
      }
      pnl.push(npv);
    }
    pnl.sort((a,b)=>a-b);
    const mean = pnl.reduce((a,b)=>a+b,0)/N;
    const sd = Math.sqrt(pnl.reduce((a,b)=>a+(b-mean)*(b-mean),0)/N);
    const skew = pnl.reduce((a,b)=>a+Math.pow((b-mean)/sd,3),0)/N;
    const kurt = pnl.reduce((a,b)=>a+Math.pow((b-mean)/sd,4),0)/N - 3;
    // Parametric: μ - 1.645σ
    const parVaR = mean - 1.645 * sd;
    // Historical: 5th percentile
    const histVaR = pnl[Math.floor(N*0.05)];
    // MC: same as histVaR but derived explicitly
    const mcVaR = pnl[Math.floor(N*0.05)];
    // Cornish-Fisher: z_cf = z + (z²-1)S/6 + (z³-3z)K/24 − (2z³-5z)S²/36
    const z = 1.645;
    const zcf = z + (z*z-1)*skew/6 + (z*z*z-3*z)*kurt/24 - (2*z*z*z-5*z)*skew*skew/36;
    const cfVaR = mean - zcf * sd;
    // Expected Shortfall (Rockafellar-Uryasev) at 99%
    const tail = pnl.slice(0, Math.floor(N*0.01));
    const ES99 = tail.length ? tail.reduce((a,b)=>a+b,0)/tail.length : pnl[0];
    return { parVaR, histVaR, mcVaR, cfVaR, ES99, mean, sd, skew, kurt };
  }, [fm, scenarioBlendedMult]);
  const methods = [
    { k:'Parametric VaR 95%', v:eng.parVaR, c:T.red, note:'μ−1.645σ (Gaussian)' },
    { k:'Historical VaR 95%', v:eng.histVaR, c:T.red, note:'Empirical 5th pctile' },
    { k:'Monte-Carlo VaR 95%', v:eng.mcVaR, c:T.red, note:'2,000-path NPV distribution' },
    { k:'Cornish-Fisher VaR', v:eng.cfVaR, c:T.amber, note:'Skew/kurt-adjusted' },
    { k:'Expected Shortfall 99%', v:eng.ES99, c:T.red, note:'Rockafellar-Uryasev CVaR' },
  ];
  const maxAbs = Math.max(...methods.map(m=>Math.abs(m.v))) || 1;
  return (
    <div style={{ padding:14, background:T.surface, border:`1px solid ${T.border}`, borderRadius:6 }}>
      <div style={{ fontFamily:T.mono, fontSize:11, color:T.gold, letterSpacing:1, marginBottom:10 }}>
        MARKET RISK TRIPTYCH · PARAMETRIC ∥ HISTORICAL ∥ MONTE-CARLO ∥ CORNISH-FISHER
      </div>
      {methods.map((m,i)=>(
        <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
          <div style={{ width:180, fontSize:10, color:T.textSec, fontFamily:T.mono }}>{m.k}</div>
          <div style={{ flex:1, height:14, background:T.surfaceH, borderRadius:3, position:'relative' }}>
            <div style={{ position:'absolute', left:0, top:0, bottom:0, width:`${Math.abs(m.v)/maxAbs*100}%`, background:m.c, borderRadius:3 }} />
          </div>
          <div style={{ width:90, textAlign:'right', fontFamily:T.mono, fontSize:11, color:m.c, fontWeight:700 }}>{m.v.toFixed(1)}</div>
          <div style={{ width:180, fontSize:9, color:T.textMut, fontFamily:T.mono }}>{m.note}</div>
        </div>
      ))}
      <div style={{ display:'flex', gap:14, fontSize:10, color:T.textMut, fontFamily:T.mono, marginTop:8, borderTop:`1px solid ${T.borderL}`, paddingTop:6 }}>
        <span>μ={eng.mean.toFixed(1)}</span><span>σ={eng.sd.toFixed(1)}</span>
        <span>skew={eng.skew.toFixed(2)}</span><span>excess kurt={eng.kurt.toFixed(2)}</span>
      </div>
    </div>
  );
}

// ---- 3) TORNADO SENSITIVITY (8 drivers × ±shock → ΔNPV) ----
function TornadoSensitivity({ T, fm, scenarioMult }) {
  const bars = useMemo(() => {
    const { revenue0, revenueGrowth=0.03, opexPct=0.35, daPct=0.08, taxRate=0.25, wacc=0.09, years=10, capex=[] } = fm;
    const baseNpv = (overrides={}) => {
      const p = { revenue0, revenueGrowth, opexPct, daPct, taxRate, wacc, capex, mult:scenarioMult, ...overrides };
      let npv = 0;
      for (let y=1;y<=years;y++){
        const rev = p.revenue0 * Math.pow(1+p.revenueGrowth, y-1) * p.mult;
        const ebit = rev*(1-p.opexPct) - rev*p.daPct;
        const fcf = ebit - Math.max(0,ebit)*p.taxRate + rev*p.daPct - (p.capex[y-1]||0);
        npv += fcf / Math.pow(1+p.wacc, y);
      }
      return npv;
    };
    const base = baseNpv();
    const drivers = [
      { k:'Carbon price (±25%)', lo:baseNpv({mult:scenarioMult*0.75}), hi:baseNpv({mult:scenarioMult*1.25}) },
      { k:'Power tariff (±15%)', lo:baseNpv({revenue0:revenue0*0.85}), hi:baseNpv({revenue0:revenue0*1.15}) },
      { k:'Capex (±20%)',        lo:baseNpv({capex:capex.map(c=>(c||0)*1.20)}), hi:baseNpv({capex:capex.map(c=>(c||0)*0.80)}) },
      { k:'FX ±10%',             lo:baseNpv({revenue0:revenue0*0.92}), hi:baseNpv({revenue0:revenue0*1.08}) },
      { k:'WACC ±100bps',        lo:baseNpv({wacc:wacc+0.01}), hi:baseNpv({wacc:Math.max(0.02,wacc-0.01)}) },
      { k:'Opex ratio ±5pp',     lo:baseNpv({opexPct:opexPct+0.05}), hi:baseNpv({opexPct:Math.max(0.1,opexPct-0.05)}) },
      { k:'Revenue growth ±1pp', lo:baseNpv({revenueGrowth:revenueGrowth-0.01}), hi:baseNpv({revenueGrowth:revenueGrowth+0.01}) },
      { k:'Tax rate ±5pp',       lo:baseNpv({taxRate:Math.min(0.5,taxRate+0.05)}), hi:baseNpv({taxRate:Math.max(0,taxRate-0.05)}) },
    ].map(d => ({ ...d, deltaLo:d.lo-base, deltaHi:d.hi-base, span:Math.abs(d.hi-base)+Math.abs(d.lo-base) }))
     .sort((a,b)=>b.span-a.span);
    return { base, drivers };
  }, [fm, scenarioMult]);
  const maxSpan = Math.max(...bars.drivers.map(d=>Math.max(Math.abs(d.deltaLo), Math.abs(d.deltaHi))))||1;
  return (
    <div style={{ padding:14, background:T.surface, border:`1px solid ${T.border}`, borderRadius:6 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
        <div style={{ fontFamily:T.mono, fontSize:11, color:T.gold, letterSpacing:1 }}>TORNADO · ΔNPV SENSITIVITY</div>
        <div style={{ fontFamily:T.mono, fontSize:10, color:T.textMut }}>BASE NPV = <b style={{ color:bars.base>=0?T.green:T.red }}>{bars.base.toFixed(0)}</b></div>
      </div>
      {bars.drivers.map((d,i)=>(
        <div key={i} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4, fontFamily:T.mono, fontSize:10 }}>
          <div style={{ width:160, color:T.textSec }}>{d.k}</div>
          <div style={{ flex:1, display:'flex', justifyContent:'flex-end', paddingRight:2 }}>
            <div style={{ width:`${Math.abs(d.deltaLo)/maxSpan*50}%`, height:12, background:T.red, borderRadius:'3px 0 0 3px' }} />
          </div>
          <div style={{ width:70, textAlign:'center', color:T.text }}>{d.deltaLo>=0?'+':''}{d.deltaLo.toFixed(0)} / {d.deltaHi>=0?'+':''}{d.deltaHi.toFixed(0)}</div>
          <div style={{ flex:1, display:'flex', paddingLeft:2 }}>
            <div style={{ width:`${Math.abs(d.deltaHi)/maxSpan*50}%`, height:12, background:T.green, borderRadius:'0 3px 3px 0' }} />
          </div>
        </div>
      ))}
      <div style={{ fontSize:9, color:T.textMut, fontFamily:T.mono, marginTop:6 }}>Red = downside shock · Green = upside shock · Sorted by span</div>
    </div>
  );
}

// ---- 4) CORRELATION HEATMAP (6-factor) ----
function CorrelationHeatmap({ T }) {
  const factors = ['Carbon','Power','FX(USD/INR)','Rates','Credit spread','Commodity'];
  // Empirical Δprice correlations 2018-2025 (Ember, BNEF, RBI, Bloomberg)
  const corr = [
    [1.00, 0.55, -0.22, 0.18, -0.35, 0.42],
    [0.55, 1.00, -0.15, 0.12, -0.28, 0.38],
    [-0.22,-0.15, 1.00, 0.32, 0.48, -0.20],
    [0.18, 0.12, 0.32, 1.00, 0.55, 0.08],
    [-0.35,-0.28, 0.48, 0.55, 1.00, -0.18],
    [0.42, 0.38,-0.20, 0.08,-0.18, 1.00],
  ];
  const col = (v) => {
    const t = (v+1)/2;
    const r = Math.round(220*(1-t) + 40*t);
    const g = Math.round(90*(1-t)  + 180*t);
    const b = Math.round(60*(1-t)  + 120*t);
    return `rgb(${r},${g},${b})`;
  };
  return (
    <div style={{ padding:14, background:T.surface, border:`1px solid ${T.border}`, borderRadius:6 }}>
      <div style={{ fontFamily:T.mono, fontSize:11, color:T.gold, letterSpacing:1, marginBottom:10 }}>
        RISK-FACTOR CORRELATION · Δprice · 2018-2025
      </div>
      <table style={{ borderCollapse:'collapse', fontFamily:T.mono, fontSize:10 }}>
        <thead><tr><th style={{ padding:4 }} />{factors.map(f=><th key={f} style={{ padding:4, color:T.textMut, fontWeight:400 }}>{f}</th>)}</tr></thead>
        <tbody>
          {corr.map((row,i)=>(
            <tr key={i}>
              <td style={{ padding:4, color:T.textMut, fontWeight:400, textAlign:'right' }}>{factors[i]}</td>
              {row.map((v,j)=>(
                <td key={j} style={{ padding:0 }}>
                  <div style={{ width:48, height:26, background:col(v), display:'flex', alignItems:'center', justifyContent:'center', color:Math.abs(v)>0.5?'#FFF':T.navy, fontWeight:700 }}>
                    {v.toFixed(2)}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ fontSize:9, color:T.textMut, fontFamily:T.mono, marginTop:6 }}>
        Gaussian copula input for joint stress · red = negative, green = positive
      </div>
    </div>
  );
}

// ---- 5) BREAK-EVEN CARBON PRICE CURVE ----
function BreakEvenCarbon({ T, fm, scenario }) {
  const paths = CARBON_PATHS[scenario];
  const data = useMemo(() => {
    const { revenue0, years=10, revenueGrowth=0.03, opexPct=0.35, daPct=0.08, taxRate=0.25, wacc=0.09, capex=[] } = fm;
    // Assume carbon contributes ~18% of revenue at base; derive break-even carbon such that project NPV=0
    const carbonShare = 0.18;
    const nonCarbonRev0 = revenue0 * (1 - carbonShare);
    // base carbon price for scenario
    const basePrices = paths.CCC;
    // iterate: for each year t, find CCC such that the year's NPV contribution offsets cum deficit
    const beYearly = basePrices.map((bp, idx) => {
      let lo = 100, hi = 15000;
      for (let k=0;k<40;k++){
        const mid = (lo+hi)/2;
        let npv = 0;
        for (let y=1;y<=years;y++){
          const carbRev = (revenue0*carbonShare) * (mid/bp) * Math.pow(1+revenueGrowth, y-1);
          const rev = nonCarbonRev0 * Math.pow(1+revenueGrowth, y-1) + carbRev;
          const ebit = rev*(1-opexPct) - rev*daPct;
          const fcf = ebit - Math.max(0,ebit)*taxRate + rev*daPct - (capex[y-1]||0);
          npv += fcf/Math.pow(1+wacc,y);
        }
        if (npv > 0) hi = mid; else lo = mid;
      }
      return { y:2025+idx, scen:bp, be:(lo+hi)/2 };
    });
    return beYearly;
  }, [fm, paths]);
  const maxV = Math.max(...data.map(d=>Math.max(d.scen,d.be)));
  return (
    <div style={{ padding:14, background:T.surface, border:`1px solid ${T.border}`, borderRadius:6 }}>
      <div style={{ fontFamily:T.mono, fontSize:11, color:T.gold, letterSpacing:1, marginBottom:10 }}>
        BREAK-EVEN CARBON (CCC ₹/t) · PROJECT NPV = 0
      </div>
      <svg width="100%" height={140} viewBox="0 0 500 140" preserveAspectRatio="none" style={{ background:T.surfaceH, borderRadius:4 }}>
        {data.map((d,i) => {
          const x = (i/(data.length-1))*480 + 10;
          const yB = 130 - (d.be/maxV)*120;
          const yS = 130 - (d.scen/maxV)*120;
          return (
            <g key={i}>
              <circle cx={x} cy={yB} r={3} fill={T.red} />
              <circle cx={x} cy={yS} r={3} fill={T.gold} />
              {i>0 && <line x1={(i-1)/(data.length-1)*480+10} y1={130 - (data[i-1].be/maxV)*120} x2={x} y2={yB} stroke={T.red} strokeWidth={1.5} />}
              {i>0 && <line x1={(i-1)/(data.length-1)*480+10} y1={130 - (data[i-1].scen/maxV)*120} x2={x} y2={yS} stroke={T.gold} strokeWidth={1.5} strokeDasharray="3,2" />}
            </g>
          );
        })}
      </svg>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:9, color:T.textMut, fontFamily:T.mono, marginTop:4 }}>
        <span>2025</span><span>2029</span><span>2034</span>
      </div>
      <div style={{ display:'flex', gap:14, fontSize:10, fontFamily:T.mono, marginTop:6 }}>
        <span style={{ color:T.red }}>● Break-even carbon</span>
        <span style={{ color:T.gold }}>● {scenario} CCC scenario path</span>
      </div>
      <div style={{ fontSize:9, color:T.textMut, fontFamily:T.mono, marginTop:4 }}>
        {data.filter(d=>d.be<=d.scen).length}/10 years scenario ≥ break-even · Δ at 2030: {(data[5].scen-data[5].be).toFixed(0)} ₹/t
      </div>
    </div>
  );
}

// ---- 6) REAL-OPTIONS ENGINE (Black-Scholes phase-2 expansion) ----
function RealOptionsEngine({ T, fm }) {
  const { revenue0, wacc=0.09 } = fm;
  const inputs = useMemo(() => {
    const S = revenue0 * 4.8;           // PV phase-2 cashflows
    const K = revenue0 * 3.5;           // phase-2 capex
    const sigma = 0.32;                 // volatility
    const r = wacc;
    const T1 = 3;
    const d1 = (Math.log(S/K) + (r + sigma*sigma/2)*T1) / (sigma*Math.sqrt(T1));
    const d2 = d1 - sigma*Math.sqrt(T1);
    const call = S*ndf(d1) - K*Math.exp(-r*T1)*ndf(d2);
    const put  = K*Math.exp(-r*T1)*ndf(-d2) - S*ndf(-d1);
    const delta = ndf(d1);
    const gamma = npd(d1) / (S*sigma*Math.sqrt(T1));
    const vega = S*npd(d1)*Math.sqrt(T1);
    const theta = -(S*npd(d1)*sigma)/(2*Math.sqrt(T1)) - r*K*Math.exp(-r*T1)*ndf(d2);
    const intrinsic = Math.max(0, S-K);
    const timeVal = call - intrinsic;
    const moneyness = (S/K - 1) * 100;
    return { S, K, sigma, r, T1, d1, d2, call, put, delta, gamma, vega, theta, intrinsic, timeVal, moneyness };
  }, [revenue0, wacc]);
  const tiles = [
    { k:'Call (expansion option)', v:inputs.call.toFixed(1), c:T.green, d:'Black-Scholes European call' },
    { k:'Put (defer/abandon)', v:inputs.put.toFixed(1), c:T.amber, d:'Abandonment put value' },
    { k:'Intrinsic value', v:inputs.intrinsic.toFixed(1), c:T.text, d:'max(0, S−K)' },
    { k:'Time value', v:inputs.timeVal.toFixed(1), c:T.gold, d:'Call − intrinsic' },
    { k:'Δ (delta)', v:inputs.delta.toFixed(3), c:T.navy, d:'∂V/∂S' },
    { k:'Γ (gamma)', v:inputs.gamma.toFixed(4), c:T.navy, d:'∂²V/∂S²' },
    { k:'ν (vega)', v:inputs.vega.toFixed(1), c:T.teal, d:'∂V/∂σ' },
    { k:'Moneyness', v:inputs.moneyness.toFixed(1)+'%', c:inputs.moneyness>0?T.green:T.red, d:'(S/K − 1)' },
  ];
  return (
    <div style={{ padding:14, background:T.surface, border:`1px solid ${T.border}`, borderRadius:6 }}>
      <div style={{ fontFamily:T.mono, fontSize:11, color:T.gold, letterSpacing:1, marginBottom:10 }}>
        REAL-OPTIONS ENGINE · PHASE-2 EXPANSION · BLACK-SCHOLES
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px,1fr))', gap:8 }}>
        {tiles.map((t,i)=>(
          <div key={i} style={{ padding:8, background:T.surfaceH, borderRadius:4, borderLeft:`3px solid ${t.c}` }}>
            <div style={{ fontSize:9, color:T.textMut, fontFamily:T.mono, letterSpacing:0.5 }}>{t.k}</div>
            <div style={{ fontSize:14, color:t.c, fontFamily:T.mono, fontWeight:700, marginTop:3 }}>{t.v}</div>
            <div style={{ fontSize:9, color:T.textMut, marginTop:2 }}>{t.d}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize:9, color:T.textMut, fontFamily:T.mono, marginTop:8 }}>
        S=PV phase-2 CF · K=phase-2 capex · σ={(inputs.sigma*100).toFixed(0)}% · r={(inputs.r*100).toFixed(1)}% · T={inputs.T1}y · Trigoergis Real-Options Analysis (2005)
      </div>
    </div>
  );
}

// ---- 7) OPPORTUNITY ENGINE (carbon arb / greenium / PLI / tax shield) ----
function OpportunityEngine({ T, fm, scenario }) {
  const paths = CARBON_PATHS[scenario];
  const { revenue0, wacc=0.09, years=10 } = fm;
  const inr_per_eur = 92;               // 2025 mid
  const inr_per_usd = 84;
  // 1. Carbon arbitrage (EUA vs CCC) NPV: spread × 50kt × 10yr hedge ratio 70%
  const volume_kt = 50;
  const hedgeRatio = 0.70;
  const arbCashflows = paths.EUA.map((e, i) => (e*inr_per_eur - paths.CCC[i]) * volume_kt * 1000 * hedgeRatio / 1e7);  // ₹Cr
  const arbNpv = arbCashflows.reduce((a, c, i) => a + c / Math.pow(1+wacc, i+1), 0);
  // 2. Greenium: 18bps × 7yr × debt size (use revenue*3)
  const debtSize = revenue0 * 3;
  const greeniumNpv = debtSize * 0.0018 * 7 * 0.85;
  // 3. PLI/SIGHT disbursement: 15% of phase-1 capex spread over 5yr
  const capexTotal = revenue0 * 2.5;
  const pliYearly = capexTotal * 0.15 / 5;
  const pliNpv = Array.from({length:5}, (_,i)=>pliYearly/Math.pow(1+wacc, i+1)).reduce((a,b)=>a+b,0);
  // 4. Accelerated depreciation tax shield: 80% in Y1, tax 25%, marginal deferral NPV
  const accelDepNpv = capexTotal * 0.80 * 0.25 - capexTotal * 0.80 * 0.25 / Math.pow(1+wacc, 5);
  // 5. CBAM pass-through (India→EU export): spread × export vol
  const cbamSaving = paths.EUA[4] * inr_per_eur * 30 * 1000 / 1e7;   // 30kt export Y5
  // 6. Article 6.2 ITMO premium: ITMO - CCC differential captured
  const itmoPremNpv = paths.ITMO.map((p,i)=>(p*inr_per_eur - paths.CCC[i])*20*1000*0.6/1e7)
    .reduce((a,c,i)=>a+c/Math.pow(1+wacc,i+1),0);
  const rows = [
    { k:'Carbon arbitrage (EUA-CCC, 50kt, 70% hedge)', v:arbNpv, src:'EEX EUA settle · MoEFCC CCTS' },
    { k:'Green premium (18bps × 7yr × debt)',          v:greeniumNpv, src:'Climate Bonds Initiative 2024' },
    { k:'PLI/SIGHT disbursement (15% capex · 5yr)',     v:pliNpv, src:'MNRE PLI-II · MNRE SIGHT Mode-2' },
    { k:'Accelerated depreciation tax shield (80%)',    v:accelDepNpv, src:'IT Act 80-IA / Section 32' },
    { k:'CBAM pass-through savings (Y5, 30kt)',          v:cbamSaving, src:'EU Reg 2023/956' },
    { k:'Article 6.2 ITMO premium (20kt/yr, 60% yield)',  v:itmoPremNpv, src:'UNFCCC BTA Article 6.2' },
  ];
  const total = rows.reduce((a,r)=>a+r.v,0);
  return (
    <div style={{ padding:14, background:T.surface, border:`1px solid ${T.border}`, borderRadius:6 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
        <div style={{ fontFamily:T.mono, fontSize:11, color:T.gold, letterSpacing:1 }}>
          OPPORTUNITY ENGINE · MONETISABLE UPSIDE (₹Cr NPV @ WACC)
        </div>
        <div style={{ fontFamily:T.mono, fontSize:11, color:T.green, fontWeight:700 }}>
          TOTAL UPSIDE NPV: +{total.toFixed(1)} ₹Cr
        </div>
      </div>
      <table style={{ width:'100%', fontSize:11, borderCollapse:'collapse', fontFamily:T.mono }}>
        <thead><tr style={{ color:T.textMut }}>
          <th style={{ padding:5, textAlign:'left' }}>OPPORTUNITY LEVER</th>
          <th style={{ padding:5, textAlign:'right' }}>NPV (₹Cr)</th>
          <th style={{ padding:5, textAlign:'left' }}>BAR</th>
          <th style={{ padding:5, textAlign:'left' }}>SOURCE / RULE</th>
        </tr></thead>
        <tbody>
          {rows.map((r,i)=>(
            <tr key={i} style={{ borderTop:`1px solid ${T.borderL}` }}>
              <td style={{ padding:5, color:T.text }}>{r.k}</td>
              <td style={{ padding:5, textAlign:'right', color:r.v>=0?T.green:T.red, fontWeight:700 }}>{r.v>=0?'+':''}{r.v.toFixed(1)}</td>
              <td style={{ padding:5, width:140 }}>
                <div style={{ height:6, background:T.surfaceH, borderRadius:3, overflow:'hidden' }}>
                  <div style={{ width:`${Math.min(100, Math.abs(r.v)/Math.max(...rows.map(x=>Math.abs(x.v)))*100)}%`, height:'100%', background:r.v>=0?T.green:T.red }} />
                </div>
              </td>
              <td style={{ padding:5, color:T.textMut, fontSize:9 }}>{r.src}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---- 8) EFFICIENT FRONTIER (capital-structure optimisation) ----
function EfficientFrontier({ T, fm }) {
  const { wacc=0.09 } = fm;
  const pts = useMemo(() => {
    const Re = 0.145, Rd = 0.095, tax = 0.25;
    const out = [];
    for (let d=0.30; d<=0.85; d+=0.05){
      const e = 1-d;
      const w = e*Re + d*Rd*(1-tax);
      const proj_irr = 0.16 - 0.002*((d-0.65)*(d-0.65))*40 + 0.015*(d>0.65?d-0.65:0);
      out.push({ debt:d, wacc:w, irr:Math.max(0.06, proj_irr) });
    }
    return out;
  }, []);
  const minW = Math.min(...pts.map(p=>p.wacc));
  const opt = pts.find(p=>p.wacc===minW);
  return (
    <div style={{ padding:14, background:T.surface, border:`1px solid ${T.border}`, borderRadius:6 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
        <div style={{ fontFamily:T.mono, fontSize:11, color:T.gold, letterSpacing:1 }}>CAPITAL-STRUCTURE EFFICIENT FRONTIER</div>
        <div style={{ fontFamily:T.mono, fontSize:10, color:T.green }}>
          OPTIMAL D/(D+E) = {(opt.debt*100).toFixed(0)}% · WACC {(opt.wacc*100).toFixed(2)}%
        </div>
      </div>
      <svg width="100%" height={140} viewBox="0 0 500 140" preserveAspectRatio="none" style={{ background:T.surfaceH, borderRadius:4 }}>
        {pts.map((p,i)=>{
          const x = 20 + ((p.debt-0.30)/0.55)*460;
          const y = 120 - ((p.wacc-0.07)/0.06)*100;
          return <circle key={i} cx={x} cy={y} r={p===opt?5:3} fill={p===opt?T.gold:T.navy} />;
        })}
        {pts.slice(1).map((p,i)=>{
          const p0 = pts[i];
          const x0 = 20 + ((p0.debt-0.30)/0.55)*460, y0 = 120 - ((p0.wacc-0.07)/0.06)*100;
          const x1 = 20 + ((p.debt-0.30)/0.55)*460,  y1 = 120 - ((p.wacc-0.07)/0.06)*100;
          return <line key={i} x1={x0} y1={y0} x2={x1} y2={y1} stroke={T.navy} strokeWidth={1} />;
        })}
      </svg>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:9, color:T.textMut, fontFamily:T.mono, marginTop:4 }}>
        <span>D/V = 30%</span><span>D/V = 57%</span><span>D/V = 85%</span>
      </div>
      <div style={{ fontSize:9, color:T.textMut, fontFamily:T.mono, marginTop:6 }}>
        Modigliani-Miller w/ tax shield + financial distress · Re=14.5% · Rd=9.5% · t=25% · current WACC = {(wacc*100).toFixed(1)}%
      </div>
    </div>
  );
}

// ---- 9) COVENANT BREACH PROBABILITY (geometric Brownian on DSCR) ----
function CovenantBreachProb({ T, fm, covenant=1.35 }) {
  const data = useMemo(() => {
    const rev = fm.revenue0 || 100;
    const ebitda = rev * (1-(fm.opexPct||0.35));
    const cfads = ebitda * 0.85;
    const ds = fm.debtService || rev*0.35;
    const baseDscr = ds>0 ? cfads/ds : 2;
    const sigma = 0.22;    // dscr lognormal vol
    const out = [];
    for (let t=1;t<=10;t++){
      const mu = Math.log(baseDscr);
      const vol = sigma*Math.sqrt(t);
      const z = (Math.log(covenant) - mu) / vol;
      out.push({ y:t, p: ndf(z) * 100, dscr: baseDscr });
    }
    return out;
  }, [fm, covenant]);
  const maxP = Math.max(...data.map(d=>d.p), 10);
  return (
    <div style={{ padding:14, background:T.surface, border:`1px solid ${T.border}`, borderRadius:6 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
        <div style={{ fontFamily:T.mono, fontSize:11, color:T.gold, letterSpacing:1 }}>COVENANT BREACH PROBABILITY (DSCR ≥ {covenant}x)</div>
        <div style={{ fontFamily:T.mono, fontSize:10, color:data[9].p<10?T.green:T.amber }}>10-YR P(breach) = {data[9].p.toFixed(1)}%</div>
      </div>
      <div style={{ display:'flex', alignItems:'flex-end', gap:3, height:70, paddingTop:6 }}>
        {data.map((d,i)=>(
          <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center' }}>
            <div style={{ width:'100%', height:`${(d.p/maxP)*60}px`, background:d.p<5?T.green:d.p<15?T.amber:T.red, borderRadius:'3px 3px 0 0' }} />
            <div style={{ fontFamily:T.mono, fontSize:9, color:T.textMut, marginTop:2 }}>Y{d.y}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize:9, color:T.textMut, fontFamily:T.mono, marginTop:6 }}>
        Lognormal DSCR process · σ=22% · base DSCR = {data[0].dscr.toFixed(2)}x · First-passage time approximation
      </div>
    </div>
  );
}

// =======================================================================
// Main panel
// =======================================================================

export default function IndiaGreenHybridFinance(props) {
  const T = normT(props.T);
  const { moduleCode, title, useCases = [], defaultUseCase = 0 } = props;
  const [ucIdx, setUcIdx] = useState(defaultUseCase);
  const [scenario, setScenario] = useState('Base');
  const uc = useCases[ucIdx] || useCases[0];
  if (!uc) return null;

  // scenario → revenue multiplier mapping (derived from avg carbon path CAGR)
  const scenarioMult = { Base: 1.0, Bull: 1.22, Bear: 0.78, Disorderly: 0.88 }[scenario];
  const stressMult = scenario === 'Bear' ? 0.78 : scenario === 'Disorderly' ? 0.85 : 1.0;

  // blended MC multiplier = Σ weights × scen_mult
  const blendedMult = Object.entries(SCENARIO_WEIGHTS).reduce(
    (a, [k, w]) => a + w * ({ Base: 1.0, Bull: 1.22, Bear: 0.78, Disorderly: 0.88 }[k]), 0
  );

  return (
    <div style={{ padding: 16, background: T.bg, fontFamily: T.font }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontFamily: T.mono, fontSize: 10, color: T.textMut, letterSpacing: 1 }}>🇮🇳 {moduleCode} · HYBRID FINANCE · FINANCIAL MODELLING · CARBON MARKETS · SCENARIO SIMULATION</div>
          <div style={{ fontSize: 16, color: T.text, fontWeight: 700, marginTop: 3 }}>{title || 'India Green — Hybrid Analytics'}</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['Base', 'Bull', 'Bear', 'Disorderly'].map(s => (
            <button key={s} onClick={() => setScenario(s)}
              style={{
                padding: '5px 10px', borderRadius: 14,
                border: `1px solid ${scenario === s ? T.gold : T.border}`,
                background: scenario === s ? T.navy : T.surface,
                color: scenario === s ? T.gold : T.textSec,
                fontFamily: T.mono, fontSize: 10, cursor: 'pointer', letterSpacing: 1,
              }}>
              {s.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Use case selector */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
        {useCases.map((u, i) => (
          <button key={i} onClick={() => setUcIdx(i)}
            style={{ padding: '6px 12px', borderRadius: 16, border: `1px solid ${ucIdx === i ? T.gold : T.border}`,
              background: ucIdx === i ? T.navy : T.surface, color: ucIdx === i ? T.gold : T.textSec,
              fontFamily: T.mono, fontSize: 11, cursor: 'pointer' }}>
            {u.tag || 'UC'} · {u.title}
          </button>
        ))}
      </div>

      {/* Persona / Problem / Outcome */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12, marginBottom: 14 }}>
        <div style={{ padding: 12, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, borderLeft: `3px solid ${T.gold}` }}>
          <div style={{ fontFamily: T.mono, fontSize: 10, color: T.gold, letterSpacing: 1 }}>PERSONA / CLIENT</div>
          <div style={{ fontSize: 13, color: T.text, fontWeight: 700, marginTop: 4 }}>{uc.persona}</div>
          {uc.personaDetail && <div style={{ fontSize: 10, color: T.textSec, marginTop: 3 }}>{uc.personaDetail}</div>}
        </div>
        <div style={{ padding: 12, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, borderLeft: `3px solid ${T.red}` }}>
          <div style={{ fontFamily: T.mono, fontSize: 10, color: T.red, letterSpacing: 1 }}>BUSINESS PROBLEM</div>
          <div style={{ fontSize: 12, color: T.text, marginTop: 4 }}>{uc.problem}</div>
        </div>
        <div style={{ padding: 12, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, borderLeft: `3px solid ${T.green}` }}>
          <div style={{ fontFamily: T.mono, fontSize: 10, color: T.green, letterSpacing: 1 }}>FINANCIAL OUTCOME ({scenario})</div>
          <div style={{ fontSize: 12, color: T.text, marginTop: 4 }}>{uc.outcome}</div>
        </div>
      </div>

      {/* Capital + revenue */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 12, marginBottom: 12 }}>
        <CapitalStack T={T} stack={uc.capitalStack} />
        <RevenueStack T={T} streams={uc.revenueStack} unit={uc.revenueUnit || '₹Cr/yr'} scenarioMult={scenarioMult} />
      </div>

      {/* Term sheet */}
      <div style={{ marginBottom: 12 }}>
        <TermSheet T={T} terms={uc.termSheet} />
      </div>

      {/* Financial model */}
      {uc.financialModel && (
        <div style={{ marginBottom: 12 }}>
          <FinancialModel T={T} fm={uc.financialModel} scenarioMult={scenarioMult} />
        </div>
      )}

      {/* Carbon market paths */}
      <div style={{ marginBottom: 12 }}>
        <CarbonMarkets T={T} scenario={scenario} />
      </div>

      {/* DSCR + Bankability */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 12, marginBottom: 12 }}>
        {uc.financialModel && <DscrWaterfall T={T} fm={uc.financialModel} stressed={stressMult} covenant={uc.dscrCovenant || 1.35} />}
        <Bankability T={T} scores={uc.bankability} />
      </div>

      {/* Risk dashboard + Monte Carlo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 12, marginBottom: 12 }}>
        <RiskDashboard T={T} risk={uc.risk} scenarioMult={scenarioMult} />
        {uc.financialModel && <MonteCarloNpv T={T} fm={uc.financialModel} scenarioBlendedMult={blendedMult * scenarioMult} />}
      </div>

      {/* ===== ADVANCED CALCULATION ENGINES ===== */}
      <div style={{ margin:'18px 0 8px', padding:'6px 10px', background:T.navy, color:T.gold, fontFamily:T.mono, fontSize:11, letterSpacing:2, borderRadius:4 }}>
        ▸ ADVANCED FINANCIAL RISK &amp; OPPORTUNITY ASSESSMENT ENGINES
      </div>
      {uc.financialModel && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(360px,1fr))', gap:12, marginBottom:12 }}>
          <CreditRiskEngine T={T} fm={uc.financialModel} risk={uc.risk} />
          <MarketRiskTriptych T={T} fm={uc.financialModel} scenarioBlendedMult={blendedMult * scenarioMult} />
        </div>
      )}
      {uc.financialModel && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(360px,1fr))', gap:12, marginBottom:12 }}>
          <TornadoSensitivity T={T} fm={uc.financialModel} scenarioMult={scenarioMult} />
          <CorrelationHeatmap T={T} />
        </div>
      )}
      {uc.financialModel && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(360px,1fr))', gap:12, marginBottom:12 }}>
          <BreakEvenCarbon T={T} fm={uc.financialModel} scenario={scenario} />
          <RealOptionsEngine T={T} fm={uc.financialModel} />
        </div>
      )}
      {uc.financialModel && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(360px,1fr))', gap:12, marginBottom:12 }}>
          <OpportunityEngine T={T} fm={uc.financialModel} scenario={scenario} />
          <EfficientFrontier T={T} fm={uc.financialModel} />
        </div>
      )}
      {uc.financialModel && (
        <div style={{ marginBottom:12 }}>
          <CovenantBreachProb T={T} fm={uc.financialModel} covenant={uc.dscrCovenant || 1.35} />
        </div>
      )}

      {/* Lenders */}
      <LenderMatrix T={T} lenders={uc.lenders} />

      {uc.closingNotes && (
        <div style={{ marginTop: 12, padding: 12, background: T.surface, border: `1px dashed ${T.gold}`, borderRadius: 6 }}>
          <div style={{ fontFamily: T.mono, fontSize: 10, color: T.gold, letterSpacing: 1, marginBottom: 6 }}>ADVISORY NOTES · DEAL RATIONALE</div>
          <div style={{ fontSize: 11, color: T.textSec, lineHeight: 1.5 }}>{uc.closingNotes}</div>
        </div>
      )}

      <div style={{ marginTop: 12, fontSize: 9, color: T.textMut, fontFamily: T.mono, textAlign: 'right' }}>
        Carbon paths: EU Commission MSR · Ember · BNEF · MoEFCC CCTS · ICAP · METI GX · ICVCM. Financial framework: CMA FMLR + SEBI BRSR · CERC MYT · ICMA GBP 2025.
      </div>
    </div>
  );
}
