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
