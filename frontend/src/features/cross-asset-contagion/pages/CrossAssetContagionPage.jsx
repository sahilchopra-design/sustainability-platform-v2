import React, { useState } from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area, LineChart, Line } from 'recharts';

const T = { bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7', border:'#e5e0d8', navy:'#1b3a5c', gold:'#c5a96a', sage:'#5a8a6a', text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', teal:'#0f766e', font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif" };
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const tip = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 11 };
const PURPLE = '#7c3aed';

const CLIMATE_SHOCKS = [
  { shock: 'Carbon Price Spike', probability: 28, severity: 'High', equityImpact: -12.4, creditSpread: 185, fxImpact: -3.2, commodityImpact: 8.7, propagationSpeed: 7 },
  { shock: 'Physical Catastrophe', probability: 18, severity: 'Extreme', equityImpact: -18.6, creditSpread: 310, fxImpact: -5.8, commodityImpact: 14.2, propagationSpeed: 14 },
  { shock: 'Policy Reversal', probability: 35, severity: 'Medium', equityImpact: -7.8, creditSpread: 95, fxImpact: -1.9, commodityImpact: -4.3, propagationSpeed: 21 },
  { shock: 'Technology Disruption', probability: 22, severity: 'Medium', equityImpact: -9.2, creditSpread: 120, fxImpact: -2.4, commodityImpact: -11.6, propagationSpeed: 45 },
  { shock: 'Sovereign Downgrade', probability: 15, severity: 'High', equityImpact: -15.1, creditSpread: 275, fxImpact: -8.3, commodityImpact: 3.4, propagationSpeed: 30 },
  { shock: 'Liquidity Freeze', probability: 12, severity: 'Extreme', equityImpact: -22.3, creditSpread: 420, fxImpact: -6.7, commodityImpact: -8.9, propagationSpeed: 3 },
];

const ASSET_CLASS_IMPACT = [
  { asset: 'Equities', baseline_var: 8.2, climate_addon: 3.4, total_var: 11.6, worst_scenario: 'Physical Catastrophe', diversification_benefit: 1.8 },
  { asset: 'IG Credit', baseline_var: 3.1, climate_addon: 1.2, total_var: 4.3, worst_scenario: 'Sovereign Downgrade', diversification_benefit: 0.6 },
  { asset: 'HY Credit', baseline_var: 7.8, climate_addon: 3.9, total_var: 11.7, worst_scenario: 'Liquidity Freeze', diversification_benefit: 1.4 },
  { asset: 'EM Debt', baseline_var: 6.4, climate_addon: 2.8, total_var: 9.2, worst_scenario: 'Sovereign Downgrade', diversification_benefit: 1.1 },
  { asset: 'Commodities', baseline_var: 12.1, climate_addon: 4.6, total_var: 16.7, worst_scenario: 'Physical Catastrophe', diversification_benefit: 2.3 },
  { asset: 'Real Estate', baseline_var: 5.6, climate_addon: 2.1, total_var: 7.7, worst_scenario: 'Physical Catastrophe', diversification_benefit: 0.9 },
];

const PROPAGATION_SEQUENCE = [
  { day: 'T+0', equities: 0, credit: 0, fx: 0, commodities: 0 },
  { day: 'T+3', equities: -4.2, credit: -1.1, fx: -0.8, commodities: 2.1 },
  { day: 'T+7', equities: -8.6, credit: -3.4, fx: -2.3, commodities: 5.8 },
  { day: 'T+14', equities: -12.1, credit: -6.2, fx: -3.9, commodities: 8.4 },
  { day: 'T+30', equities: -14.8, credit: -9.7, fx: -5.2, commodities: 10.1 },
  { day: 'T+60', equities: -16.3, credit: -12.4, fx: -6.1, commodities: 11.6 },
  { day: 'T+90', equities: -15.7, credit: -13.8, fx: -5.8, commodities: 10.9 },
  { day: 'T+180', equities: -11.2, credit: -10.1, fx: -3.4, commodities: 7.3 },
];

const CORRELATION_DATA = [
  { asset1: 'Equities', asset2: 'IG Credit', correlation: 0.42 },
  { asset1: 'Equities', asset2: 'HY Credit', correlation: 0.71 },
  { asset1: 'Equities', asset2: 'EM Debt', correlation: 0.65 },
  { asset1: 'Equities', asset2: 'Commodities', correlation: 0.38 },
  { asset1: 'Equities', asset2: 'Real Estate', correlation: 0.54 },
  { asset1: 'IG Credit', asset2: 'HY Credit', correlation: 0.68 },
  { asset1: 'IG Credit', asset2: 'EM Debt', correlation: 0.59 },
  { asset1: 'IG Credit', asset2: 'Commodities', correlation: 0.22 },
  { asset1: 'IG Credit', asset2: 'Real Estate', correlation: 0.47 },
  { asset1: 'HY Credit', asset2: 'EM Debt', correlation: 0.82 },
  { asset1: 'HY Credit', asset2: 'Commodities', correlation: 0.44 },
  { asset1: 'HY Credit', asset2: 'Real Estate', correlation: 0.61 },
  { asset1: 'EM Debt', asset2: 'Commodities', correlation: 0.39 },
  { asset1: 'EM Debt', asset2: 'Real Estate', correlation: 0.56 },
  { asset1: 'Commodities', asset2: 'Real Estate', correlation: 0.31 },
];

const ASSETS = ['Equities', 'IG Credit', 'HY Credit', 'EM Debt', 'Commodities', 'Real Estate'];

const VAR_TREND = Array.from({ length: 18 }, (_, i) => {
  const base = 8.0 + sr(i * 3) * 2.0;
  const addon = 2.8 + sr(i * 7) * 1.6;
  return {
    month: `M${String(i + 1).padStart(2, '0')}`,
    baseline: parseFloat(base.toFixed(2)),
    climate_addon: parseFloat(addon.toFixed(2)),
    total: parseFloat((base + addon).toFixed(2)),
  };
});

const TABS = ['Overview', 'Shock Propagation', 'Asset Class Impact', 'Correlation Matrix', 'VaR Attribution'];

const sev = s => {
  if (s === 'Extreme') return T.red;
  if (s === 'High') return T.amber;
  if (s === 'Medium') return PURPLE;
  return T.sage;
};

const corrColor = c => {
  if (c >= 0.7) return '#fef2f2';
  if (c >= 0.5) return '#fffbeb';
  return '#f0fdf4';
};
const corrText = c => {
  if (c >= 0.7) return T.red;
  if (c >= 0.5) return T.amber;
  return T.sage;
};

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 18px', flex: 1, minWidth: 150 }}>
      <div style={{ fontSize: 11, color: T.textMut, fontWeight: 500, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: color || PURPLE }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function SectionTitle({ children }) {
  return <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 12, borderLeft: `3px solid ${PURPLE}`, paddingLeft: 10 }}>{children}</div>;
}

function OverviewTab() {
  const speedData = CLIMATE_SHOCKS.map(s => ({ name: s.shock.replace(' ', '\n'), speed: s.propagationSpeed, fill: sev(s.severity) }));
  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <StatCard label="Climate VaR Add-on" value="+340 bps" sub="Portfolio-wide" color={PURPLE} />
        <StatCard label="Fastest Propagation" value="3 days" sub="Liquidity Freeze" color={T.red} />
        <StatCard label="Highest Correlation" value="0.82" sub="HY Credit – EM Debt" color={T.amber} />
        <StatCard label="Physical Risk Share" value="38%" sub="of climate VaR" color={T.teal} />
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 420px', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
          <SectionTitle>Climate Shock Register</SectionTitle>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.surfaceH }}>
                {['Shock Type', 'Probability', 'Severity', 'Eq. Impact', 'Credit Sprd', 'Speed (d)'].map(h => (
                  <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: T.textSec, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CLIMATE_SHOCKS.map((s, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '7px 8px', fontWeight: 600, color: T.text }}>{s.shock}</td>
                  <td style={{ padding: '7px 8px', color: T.textSec }}>{s.probability}%</td>
                  <td style={{ padding: '7px 8px' }}>
                    <span style={{ background: sev(s.severity) + '20', color: sev(s.severity), borderRadius: 4, padding: '2px 7px', fontWeight: 600, fontSize: 11 }}>{s.severity}</span>
                  </td>
                  <td style={{ padding: '7px 8px', color: s.equityImpact < 0 ? T.red : T.green, fontWeight: 600 }}>{s.equityImpact > 0 ? '+' : ''}{s.equityImpact}%</td>
                  <td style={{ padding: '7px 8px', color: T.amber, fontWeight: 600 }}>{s.creditSpread} bps</td>
                  <td style={{ padding: '7px 8px', color: T.textSec }}>{s.propagationSpeed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ flex: '1 1 280px', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
          <SectionTitle>Propagation Speed by Shock</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={speedData} layout="vertical" margin={{ left: 10, right: 20, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: T.textMut }} tickFormatter={v => `${v}d`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} width={110} />
              <Tooltip contentStyle={tip} formatter={v => [`${v} days`, 'Propagation']} />
              <Bar dataKey="speed" radius={[0, 4, 4, 0]}>
                {speedData.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function ShockPropagationTab() {
  const [selected, setSelected] = useState(0);
  const shock = CLIMATE_SHOCKS[selected];
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {CLIMATE_SHOCKS.map((s, i) => (
          <button key={i} onClick={() => setSelected(i)} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${i === selected ? PURPLE : T.border}`, background: i === selected ? PURPLE + '15' : T.surface, color: i === selected ? PURPLE : T.textSec, fontSize: 12, fontWeight: i === selected ? 700 : 500, cursor: 'pointer' }}>
            {s.shock}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 16 }}>
        {[
          { label: 'Probability', value: `${shock.probability}%` },
          { label: 'Severity', value: shock.severity, color: sev(shock.severity) },
          { label: 'Propagation Speed', value: `${shock.propagationSpeed} days` },
          { label: 'FX Impact', value: `${shock.fxImpact}%`, color: T.red },
          { label: 'Commodity Impact', value: `${shock.commodityImpact > 0 ? '+' : ''}${shock.commodityImpact}%`, color: shock.commodityImpact > 0 ? T.green : T.red },
        ].map((item, i) => (
          <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 14px', minWidth: 110 }}>
            <div style={{ fontSize: 10, color: T.textMut, marginBottom: 3 }}>{item.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: item.color || PURPLE }}>{item.value}</div>
          </div>
        ))}
      </div>
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
        <SectionTitle>Cross-Asset Propagation Timeline — {shock.shock}</SectionTitle>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={PROPAGATION_SEQUENCE} margin={{ top: 8, right: 24, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: T.textMut }} />
            <YAxis tick={{ fontSize: 10, fill: T.textMut }} tickFormatter={v => `${v}%`} />
            <Tooltip contentStyle={tip} formatter={(v, n) => [`${v}%`, n.charAt(0).toUpperCase() + n.slice(1)]} />
            <Line type="monotone" dataKey="equities" stroke={PURPLE} strokeWidth={2} dot={false} name="Equities" />
            <Line type="monotone" dataKey="credit" stroke={T.amber} strokeWidth={2} dot={false} name="Credit" />
            <Line type="monotone" dataKey="fx" stroke={T.teal} strokeWidth={2} dot={false} name="FX" />
            <Line type="monotone" dataKey="commodities" stroke={T.sage} strokeWidth={2} dot={false} name="Commodities" />
          </LineChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap' }}>
          {[['Equities', PURPLE], ['Credit', T.amber], ['FX', T.teal], ['Commodities', T.sage]].map(([l, c]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: T.textSec }}>
              <div style={{ width: 20, height: 3, background: c, borderRadius: 2 }} />{l}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AssetClassImpactTab() {
  return (
    <div>
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
        <SectionTitle>Baseline vs Climate-Adjusted VaR by Asset Class</SectionTitle>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={ASSET_CLASS_IMPACT} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="asset" tick={{ fontSize: 10, fill: T.textMut }} />
            <YAxis tick={{ fontSize: 10, fill: T.textMut }} tickFormatter={v => `${v}%`} />
            <Tooltip contentStyle={tip} formatter={v => [`${v}%`]} />
            <Bar dataKey="baseline_var" name="Baseline VaR" fill={T.teal} radius={[3, 3, 0, 0]} />
            <Bar dataKey="climate_addon" name="Climate Add-on" fill={PURPLE} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
          {[['Baseline VaR', T.teal], ['Climate Add-on', PURPLE]].map(([l, c]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: T.textSec }}>
              <div style={{ width: 14, height: 14, background: c, borderRadius: 3 }} />{l}
            </div>
          ))}
        </div>
      </div>
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
        <SectionTitle>Diversification Benefit &amp; Worst-Case Scenario</SectionTitle>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: T.surfaceH }}>
              {['Asset Class', 'Baseline VaR', 'Climate Add-on', 'Total VaR', 'Worst Scenario', 'Div. Benefit'].map(h => (
                <th key={h} style={{ padding: '7px 10px', textAlign: 'left', color: T.textSec, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ASSET_CLASS_IMPACT.map((a, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                <td style={{ padding: '7px 10px', fontWeight: 600, color: T.text }}>{a.asset}</td>
                <td style={{ padding: '7px 10px', color: T.textSec }}>{a.baseline_var}%</td>
                <td style={{ padding: '7px 10px', color: PURPLE, fontWeight: 600 }}>+{a.climate_addon}%</td>
                <td style={{ padding: '7px 10px', color: T.red, fontWeight: 700 }}>{a.total_var}%</td>
                <td style={{ padding: '7px 10px', color: T.textSec, fontSize: 11 }}>{a.worst_scenario}</td>
                <td style={{ padding: '7px 10px', color: T.sage, fontWeight: 600 }}>-{a.diversification_benefit}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CorrelationMatrixTab() {
  const getCorr = (a1, a2) => {
    if (a1 === a2) return 1.0;
    const found = CORRELATION_DATA.find(d => (d.asset1 === a1 && d.asset2 === a2) || (d.asset1 === a2 && d.asset2 === a1));
    return found ? found.correlation : null;
  };
  return (
    <div>
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
        <SectionTitle>Cross-Asset Climate Correlation Matrix</SectionTitle>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', fontSize: 12, minWidth: 520 }}>
            <thead>
              <tr>
                <th style={{ padding: '8px 12px', background: T.surfaceH, color: T.textSec, fontWeight: 600, borderBottom: `1px solid ${T.border}`, borderRight: `1px solid ${T.border}`, textAlign: 'left' }}>Asset</th>
                {ASSETS.map(a => (
                  <th key={a} style={{ padding: '8px 12px', background: T.surfaceH, color: T.textSec, fontWeight: 600, borderBottom: `1px solid ${T.border}`, borderRight: `1px solid ${T.border}`, textAlign: 'center', fontSize: 11 }}>{a}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ASSETS.map((a1, ri) => (
                <tr key={ri}>
                  <td style={{ padding: '8px 12px', fontWeight: 600, color: T.text, borderBottom: `1px solid ${T.border}`, borderRight: `1px solid ${T.border}`, background: T.surfaceH, whiteSpace: 'nowrap' }}>{a1}</td>
                  {ASSETS.map((a2, ci) => {
                    const c = getCorr(a1, a2);
                    const isDiag = a1 === a2;
                    return (
                      <td key={ci} style={{ padding: '8px 12px', textAlign: 'center', borderBottom: `1px solid ${T.border}`, borderRight: `1px solid ${T.border}`, background: isDiag ? PURPLE + '18' : corrColor(c), color: isDiag ? PURPLE : corrText(c), fontWeight: isDiag ? 700 : 600, fontSize: 12 }}>
                        {c !== null ? c.toFixed(2) : '—'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 14, flexWrap: 'wrap' }}>
          {[['≥ 0.70 High Correlation', '#fef2f2', T.red], ['0.50–0.69 Moderate', '#fffbeb', T.amber], ['< 0.50 Low', '#f0fdf4', T.sage]].map(([l, bg, tc]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: T.textSec }}>
              <div style={{ width: 16, height: 16, background: bg, border: `1px solid ${tc}30`, borderRadius: 3 }} />
              <span style={{ color: tc, fontWeight: 600 }}>{l}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
        <SectionTitle>Highest Climate Correlations</SectionTitle>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[...CORRELATION_DATA].sort((a, b) => b.correlation - a.correlation).slice(0, 6).map((d, i) => (
            <div key={i} style={{ background: corrColor(d.correlation), border: `1px solid ${corrText(d.correlation)}30`, borderRadius: 8, padding: '10px 14px', minWidth: 160 }}>
              <div style={{ fontSize: 11, color: T.textSec, marginBottom: 2 }}>{d.asset1} — {d.asset2}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: corrText(d.correlation) }}>{d.correlation.toFixed(2)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function VarAttributionTab() {
  const shockBreakdown = [
    { label: 'Physical Risk', share: 38, color: T.red },
    { label: 'Carbon Transition', share: 27, color: PURPLE },
    { label: 'Policy Risk', share: 18, color: T.amber },
    { label: 'Sovereign/Credit', share: 11, color: T.teal },
    { label: 'Liquidity', share: 6, color: T.textSec },
  ];
  return (
    <div>
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
        <SectionTitle>Portfolio VaR Trend — Baseline vs Climate-Adjusted (18 months)</SectionTitle>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={VAR_TREND} margin={{ top: 8, right: 24, left: 0, bottom: 4 }}>
            <defs>
              <linearGradient id="gradBase" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={T.teal} stopOpacity={0.3} />
                <stop offset="95%" stopColor={T.teal} stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="gradAddon" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={PURPLE} stopOpacity={0.4} />
                <stop offset="95%" stopColor={PURPLE} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: T.textMut }} />
            <YAxis tick={{ fontSize: 10, fill: T.textMut }} tickFormatter={v => `${v}%`} />
            <Tooltip contentStyle={tip} formatter={v => [`${v}%`]} />
            <Area type="monotone" dataKey="baseline" name="Baseline VaR" stroke={T.teal} fill="url(#gradBase)" strokeWidth={2} />
            <Area type="monotone" dataKey="climate_addon" name="Climate Add-on" stroke={PURPLE} fill="url(#gradAddon)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
          {[['Baseline VaR', T.teal], ['Climate Add-on', PURPLE]].map(([l, c]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: T.textSec }}>
              <div style={{ width: 20, height: 3, background: c, borderRadius: 2 }} />{l}
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 320px', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
          <SectionTitle>Climate VaR Attribution Breakdown</SectionTitle>
          {shockBreakdown.map((s, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: T.text, fontWeight: 500 }}>{s.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{s.share}%</span>
              </div>
              <div style={{ height: 7, background: T.border, borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: `${s.share}%`, height: '100%', background: s.color, borderRadius: 4, transition: 'width 0.5s' }} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ flex: '1 1 260px', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
          <SectionTitle>Key VaR Metrics</SectionTitle>
          {[
            { label: 'Total Portfolio VaR (95%)', value: '11.8%', color: T.red },
            { label: 'Climate VaR Add-on', value: '+340 bps', color: PURPLE },
            { label: 'Worst-case Climate VaR', value: '18.4%', color: T.red },
            { label: 'Expected Shortfall (CVaR)', value: '15.2%', color: T.amber },
            { label: 'Diversification Benefit', value: '-8.1%', color: T.sage },
            { label: 'Avg. Monthly VaR Drift', value: '+0.18 bps', color: T.textSec },
          ].map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 5 ? `1px solid ${T.border}` : 'none' }}>
              <span style={{ fontSize: 12, color: T.textSec }}>{m.label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: m.color }}>{m.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CrossAssetContagionPage() {
  const [tab, setTab] = useState(0);

  const tabContent = [
    <OverviewTab key="overview" />,
    <ShockPropagationTab key="propagation" />,
    <AssetClassImpactTab key="asset" />,
    <CorrelationMatrixTab key="corr" />,
    <VarAttributionTab key="var" />,
  ];

  return (
    <div style={{ background: T.bg, minHeight: '100vh', padding: '28px 32px', fontFamily: T.font }}>
      {/* Header */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: PURPLE + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={PURPLE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: T.navy }}>Cross-Asset Climate Contagion Engine</h1>
              <span style={{ background: PURPLE + '18', color: PURPLE, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 5 }}>EP-AB6</span>
            </div>
            <div style={{ fontSize: 12, color: T.textSec, marginTop: 2 }}>
              Multi-asset shock propagation, correlation dynamics and climate-adjusted Value at Risk
            </div>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `2px solid ${T.border}`, paddingBottom: 0 }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{ padding: '8px 16px', border: 'none', borderBottom: i === tab ? `2px solid ${PURPLE}` : '2px solid transparent', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: i === tab ? 700 : 500, color: i === tab ? PURPLE : T.textSec, marginBottom: -2, transition: 'all 0.15s' }}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>{tabContent[tab]}</div>
    </div>
  );
}
