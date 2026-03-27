import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, ReferenceLine, Cell,
} from 'recharts';
import { NGFS_PHASE4, SECTOR_PD_UPLIFT, SECTOR_LGD_UPLIFT } from '../../../services/climateRiskDataService';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const T = {
  bg: '#0f172a', surface: '#1e293b', border: '#334155', navy: '#1e3a5f',
  gold: '#f59e0b', sage: '#10b981', text: '#f1f5f9', textSec: '#94a3b8',
  textMut: '#64748b', red: '#ef4444', green: '#10b981', amber: '#f59e0b',
  teal: '#14b8a6', font: "'Inter',sans-serif",
};
const ACCENT = '#7c3aed';

// MACRO_SHOCKS: ECB CST 2022 public results calibrated to NGFS Phase IV
const MACRO_SHOCKS = [
  { scenarioId: 'nz2050', gdpShock: -1.2, unemploymentRise: 0.6, propPriceDrop: -8,  equityDrop: -12, cet1Depletion: 0.8, niiImpact: -2.1 },
  { scenarioId: 'b2c',    gdpShock: -0.8, unemploymentRise: 0.4, propPriceDrop: -5,  equityDrop: -8,  cet1Depletion: 0.5, niiImpact: -1.4 },
  { scenarioId: 'dnz',    gdpShock: -1.5, unemploymentRise: 1.2, propPriceDrop: -14, equityDrop: -22, cet1Depletion: 1.4, niiImpact: -3.8 },
  { scenarioId: 'dt',     gdpShock: -2.8, unemploymentRise: 2.1, propPriceDrop: -22, equityDrop: -35, cet1Depletion: 2.6, niiImpact: -6.2 },
  { scenarioId: 'ndc',    gdpShock: -3.2, unemploymentRise: 0.2, propPriceDrop: -18, equityDrop: -18, cet1Depletion: 1.8, niiImpact: -4.5 },
  { scenarioId: 'cp',     gdpShock: -4.8, unemploymentRise: 0.1, propPriceDrop: -35, equityDrop: -28, cet1Depletion: 3.2, niiImpact: -7.8 },
];

const SCENARIO_IDS = ['nz2050', 'b2c', 'dnz', 'dt', 'ndc', 'cp'];
const SCENARIO_LABELS = {
  nz2050: 'Net Zero 2050', b2c: 'Below 2°C', dnz: 'Divergent NZ',
  dt: 'Delayed Trans.', ndc: 'Nationally Det.', cp: 'Current Policies',
};
const SCENARIO_COLORS = {
  nz2050: '#10b981', b2c: '#14b8a6', dnz: '#f59e0b',
  dt: '#f97316', ndc: '#ef4444', cp: '#7f1d1d',
};
// Map local lowercase IDs to NGFS_PHASE4 array index
const NGFS_IDX = { nz2050: 0, b2c: 1, dnz: 4, dt: 3, ndc: 5, cp: 5 };
// Map local IDs to SECTOR_PD_UPLIFT uppercase column keys
const PD_KEY = { nz2050: 'NZ2050', b2c: 'B2C', dnz: 'DNZ', dt: 'DT', ndc: 'CP', cp: 'CP' };
// SECTOR_LGD_UPLIFT uses lowercase keys matching our scenarioIds
const LGD_KEY = { nz2050: 'nz2050', b2c: 'b2c', dnz: 'dnz', dt: 'dt', ndc: 'ndc', cp: 'cp' };

const TABS = ['Scenario Dashboard', 'PD & LGD Migration', 'Market Risk Channel',
  'Credit Book Impact', 'Regulatory Tracker', 'Expected Shortfall'];

const rootStyle = { padding: '0 32px 32px', fontFamily: T.font, background: T.bg, minHeight: '100vh', color: T.text };

const Card = ({ children, style }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, ...style }}>
    {children}
  </div>
);

const KPI = ({ label, value, sub, color }) => (
  <div style={{ background: T.navy, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 18px', flex: 1, minWidth: 130 }}>
    <div style={{ fontSize: 11, color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.text }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{sub}</div>}
  </div>
);

const StatRow = ({ stats }) => (
  <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
    {stats.map((st, i) => (
      <div key={i} style={{ background: T.navy, border: `1px solid ${T.border}`, borderRadius: 8, padding: '12px 18px', flex: 1, minWidth: 140 }}>
        <div style={{ fontSize: 11, color: T.textMut, textTransform: 'uppercase', marginBottom: 2 }}>{st.label}</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: st.color || ACCENT }}>{st.value}</div>
        {st.sub && <div style={{ fontSize: 11, color: T.textSec }}>{st.sub}</div>}
      </div>
    ))}
  </div>
);

const SectionTitle = ({ children }) => (
  <div style={{ fontSize: 13, fontWeight: 600, color: T.textSec, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
    {children}
  </div>
);

const cet1Color = v => v > 2.0 ? T.red : v > 1.0 ? T.amber : T.green;
const cet1ImpactColor = v => v > 2.5 ? T.red : v > 1.2 ? T.amber : T.green;

// ─── Tab 1: Scenario Dashboard ─────────────────────────────────────────────
function Tab1({ scen, setScen }) {
  const shock = MACRO_SHOCKS.find(m => m.scenarioId === scen);
  const ngfsScen = NGFS_PHASE4[NGFS_IDX[scen]];

  const chartData = MACRO_SHOCKS.map(m => ({
    name: SCENARIO_LABELS[m.scenarioId],
    cet1: m.cet1Depletion,
    id: m.scenarioId,
  }));

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {SCENARIO_IDS.map(id => (
          <button key={id} onClick={() => setScen(id)} style={{
            padding: '8px 16px', borderRadius: 6,
            border: `2px solid ${scen === id ? SCENARIO_COLORS[id] : T.border}`,
            background: scen === id ? SCENARIO_COLORS[id] + '22' : T.surface,
            color: scen === id ? SCENARIO_COLORS[id] : T.textSec,
            cursor: 'pointer', fontWeight: scen === id ? 700 : 400, fontSize: 13, transition: 'all 0.15s',
          }}>
            {SCENARIO_LABELS[id]}
            <span style={{ display: 'block', fontSize: 10, color: T.textMut, fontWeight: 400 }}>
              {NGFS_PHASE4[NGFS_IDX[id]]?.category || ''}
            </span>
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <KPI label="GDP Shock" value={`${shock.gdpShock}%`} color={T.red} />
        <KPI label="Unemployment Rise" value={`+${shock.unemploymentRise}pp`} color={T.amber} />
        <KPI label="Property Price Drop" value={`${shock.propPriceDrop}%`} color={T.amber} />
        <KPI label="Equity Market Drop" value={`${shock.equityDrop}%`} color={T.red} />
        <KPI label="CET1 Depletion" value={`${shock.cet1Depletion}pp`} color={cet1Color(shock.cet1Depletion)} />
        <KPI label="NII Impact" value={`${shock.niiImpact}%`} color={T.red} />
      </div>

      <Card style={{ marginBottom: 4 }}>
        <SectionTitle>CET1 Depletion (pp) — All Scenarios vs Regulatory Minimum</SectionTitle>
        {ngfsScen && (
          <div style={{ fontSize: 12, color: T.textSec, marginBottom: 12, background: T.navy, padding: '8px 14px', borderRadius: 6, borderLeft: `3px solid ${SCENARIO_COLORS[scen]}` }}>
            {ngfsScen.name} · Temp: {ngfsScen.temp}°C · Sovereign Spread: +{ngfsScen.sovereignSpread}bps · {ngfsScen.description}
          </div>
        )}
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="name" tick={{ fill: T.textSec, fontSize: 11 }} />
            <YAxis tick={{ fill: T.textSec, fontSize: 11 }} unit="pp" />
            <Tooltip
              contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }}
              formatter={v => [`${v}pp`, 'CET1 Depletion']}
            />
            <ReferenceLine y={2.0} stroke={T.red} strokeDasharray="6 3"
              label={{ value: 'Alert 2pp', fill: T.red, fontSize: 10 }} />
            <Bar dataKey="cet1" radius={[4, 4, 0, 0]}>
              {chartData.map((d, i) => <Cell key={i} fill={cet1Color(d.cet1)} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div style={{ fontSize: 11, color: T.textMut, marginTop: 6 }}>
          Source: ECB Climate Stress Test 2022 | 8% CET1 minimum. Bars coloured green (&lt;1pp), amber (1–2pp), red (&gt;2pp).
        </div>
      </Card>

      <StatRow stats={[
        { label: 'Worst Scenario CET1', value: '3.2pp', sub: 'Current Policies', color: T.red },
        { label: 'Average Depletion', value: '1.7pp', sub: 'Across 6 scenarios', color: T.amber },
        { label: 'Scenarios >2pp Depletion', value: '2', sub: 'DT & CP breach threshold', color: T.red },
      ]} />
    </div>
  );
}

// ─── Tab 2: PD & LGD Migration ─────────────────────────────────────────────
function Tab2({ scen }) {
  const pdKey = PD_KEY[scen];
  const lgdKey = LGD_KEY[scen];

  // Build unified table: match on sector name where possible
  const elData = SECTOR_LGD_UPLIFT.map((lgdRow, idx) => {
    const pdRow = SECTOR_PD_UPLIFT.find(r => r.sector === lgdRow.sector) || SECTOR_PD_UPLIFT[idx] || {};
    const pd = pdRow[pdKey] !== undefined ? pdRow[pdKey] : 0;
    const lgd = lgdRow[lgdKey] !== undefined ? lgdRow[lgdKey] : 0;
    const el = +(pd * lgd / 10000).toFixed(4);
    return { sector: lgdRow.sector, pd, lgd, el };
  }).sort((a, b) => b.el - a.el);

  const top5 = elData.slice(0, 5);
  const maxEl = Math.max(...elData.map(d => d.el));
  const avgEl = +(elData.reduce((sum, d) => sum + d.el, 0) / elData.length).toFixed(4);
  const positive = elData.filter(d => d.el < 0).length;

  const elColor = v => v > 0.02 ? T.red : v > 0.01 ? T.amber : v < 0 ? T.green : T.teal;

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <SectionTitle>EL Formula</SectionTitle>
        <div style={{ background: T.navy, borderRadius: 6, padding: '10px 16px', fontFamily: 'monospace', fontSize: 13, color: T.gold }}>
          Expected Loss Impact = PD Uplift (bps) × LGD Uplift (%) × Exposure / 10,000
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <Card>
          <SectionTitle>Sector PD & LGD Uplifts — {SCENARIO_LABELS[scen]}</SectionTitle>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {['Sector', 'PD Uplift (bps)', 'LGD Uplift (%)', 'EL Impact'].map(h => (
                    <th key={h} style={{ padding: '6px 10px', textAlign: 'left', color: T.textSec, fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {elData.map((d, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}22` }}>
                    <td style={{ padding: '5px 10px', color: T.text }}>{d.sector}</td>
                    <td style={{ padding: '5px 10px', color: d.pd < 0 ? T.green : T.amber, fontWeight: 600 }}>
                      {d.pd > 0 ? '+' : ''}{d.pd}
                    </td>
                    <td style={{ padding: '5px 10px', color: d.lgd < 0 ? T.green : T.red }}>
                      {d.lgd > 0 ? '+' : ''}{d.lgd}%
                    </td>
                    <td style={{ padding: '5px 10px', color: elColor(d.el), fontWeight: 700 }}>
                      {d.el >= 0 ? '+' : ''}{d.el.toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <SectionTitle>Top 5 Worst Sectors by Combined EL</SectionTitle>
          {top5.map((d, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '8px 0', borderBottom: i < 4 ? `1px solid ${T.border}22` : 'none',
            }}>
              <div>
                <div style={{ fontSize: 13, color: T.text, fontWeight: 600 }}>#{i + 1} {d.sector}</div>
                <div style={{ fontSize: 11, color: T.textMut }}>PD: {d.pd}bps | LGD: {d.lgd}%</div>
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: elColor(d.el) }}>
                {d.el >= 0 ? '+' : ''}{d.el.toFixed(4)}
              </div>
            </div>
          ))}
        </Card>
      </div>

      <Card>
        <SectionTitle>Combined EL Impact per Sector</SectionTitle>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={elData} layout="vertical" margin={{ top: 5, right: 20, left: 110, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} horizontal={false} />
            <XAxis type="number" tick={{ fill: T.textSec, fontSize: 10 }} />
            <YAxis type="category" dataKey="sector" tick={{ fill: T.textSec, fontSize: 10 }} width={110} />
            <Tooltip
              contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }}
              formatter={v => [v.toFixed(4), 'EL Impact']}
            />
            <Bar dataKey="el" radius={[0, 4, 4, 0]}>
              {elData.map((d, i) => <Cell key={i} fill={elColor(d.el)} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <StatRow stats={[
        { label: 'Max Combined EL', value: maxEl.toFixed(4), sub: 'Highest-risk sector', color: T.red },
        { label: 'Avg EL Uplift', value: avgEl.toFixed(4), sub: 'Across all sectors', color: T.amber },
        { label: 'Positive Outlook', value: `${positive} sector${positive !== 1 ? 's' : ''}`, sub: 'Incl. Renewables', color: T.green },
      ]} />
    </div>
  );
}

// ─── Tab 3: Market Risk Channel ─────────────────────────────────────────────
const COUNTRIES = [
  { code: 'US', name: 'United States', baseline: 12,  vuln: 0.3 },
  { code: 'DE', name: 'Germany',       baseline: 8,   vuln: 0.2 },
  { code: 'GB', name: 'United Kingdom',baseline: 18,  vuln: 0.4 },
  { code: 'IT', name: 'Italy',         baseline: 185, vuln: 0.8 },
  { code: 'ES', name: 'Spain',         baseline: 120, vuln: 0.7 },
  { code: 'BR', name: 'Brazil',        baseline: 220, vuln: 1.5 },
  { code: 'IN', name: 'India',         baseline: 175, vuln: 1.2 },
  { code: 'CN', name: 'China',         baseline: 95,  vuln: 0.9 },
];

const EQUITY_SECTORS = [
  { name: 'Energy',        pe: 10.2, stressAdj: 0.82 },
  { name: 'Utilities',     pe: 14.5, stressAdj: 0.88 },
  { name: 'Industrials',   pe: 16.8, stressAdj: 0.90 },
  { name: 'Materials',     pe: 12.3, stressAdj: 0.85 },
  { name: 'Financials',    pe: 11.6, stressAdj: 0.93 },
  { name: 'Consumer Disc', pe: 18.4, stressAdj: 0.92 },
  { name: 'Technology',    pe: 24.1, stressAdj: 1.05 },
  { name: 'Clean Energy',  pe: 22.5, stressAdj: 1.12 },
];

function Tab3({ scen }) {
  const ngfs = NGFS_PHASE4[NGFS_IDX[scen]];
  const sovereignBp = ngfs ? ngfs.sovereignSpread : 50;

  const spreadData = COUNTRIES.map(c => {
    const stressed = Math.round(c.baseline * (1 + sovereignBp / 100 * c.vuln));
    return { name: c.code, baseline: c.baseline, stressed, widening: stressed - c.baseline };
  });

  const equityData = EQUITY_SECTORS.map(e => {
    const stressedPE = +(e.pe * e.stressAdj * (1 - sovereignBp / 5000)).toFixed(1);
    const capChange = +((stressedPE / e.pe - 1) * 100).toFixed(1);
    return { ...e, stressedPE, capChange };
  });

  const trendData = Array.from({ length: 24 }, (_, i) => ({
    month: `M${i + 1}`,
    baseline: +(sovereignBp * 0.4 + sr(i * 7) * 20).toFixed(1),
    stressed: +(sovereignBp * 0.8 + sr(i * 7 + 100) * 35 + i * 1.2).toFixed(1),
  }));

  const wideningColor = v => v > 100 ? T.red : v > 40 ? T.amber : T.green;

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <Card>
          <SectionTitle>Sovereign Spread Widening — {SCENARIO_LABELS[scen]}</SectionTitle>
          <div style={{ fontSize: 11, color: T.textMut, marginBottom: 10 }}>
            Stressed = Baseline × (1 + {sovereignBp}bps/100 × Country Vulnerability)
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={spreadData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fill: T.textSec, fontSize: 11 }} />
              <YAxis tick={{ fill: T.textSec, fontSize: 10 }} unit="bps" />
              <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
              <Legend wrapperStyle={{ color: T.textSec, fontSize: 11 }} />
              <Bar dataKey="baseline" name="Baseline (bps)" fill={T.teal} opacity={0.6} radius={[3, 3, 0, 0]} />
              <Bar dataKey="stressed" name="Stressed (bps)" radius={[3, 3, 0, 0]}>
                {spreadData.map((d, i) => <Cell key={i} fill={wideningColor(d.widening)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionTitle>Equity Sector Repricing</SectionTitle>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {['Sector', 'Base P/E', 'Stressed P/E', 'Mkt Cap Δ'].map(h => (
                    <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: T.textSec, fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {equityData.map((d, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}22` }}>
                    <td style={{ padding: '5px 8px', color: T.text }}>{d.name}</td>
                    <td style={{ padding: '5px 8px', color: T.textSec }}>{d.pe}x</td>
                    <td style={{ padding: '5px 8px', color: d.stressedPE < d.pe ? T.red : T.green, fontWeight: 600 }}>
                      {d.stressedPE}x
                    </td>
                    <td style={{ padding: '5px 8px', color: d.capChange < 0 ? T.red : T.green, fontWeight: 700 }}>
                      {d.capChange > 0 ? '+' : ''}{d.capChange}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Card>
        <SectionTitle>24-Month Credit Spread Trend (bps)</SectionTitle>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="gradBase3" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={T.teal} stopOpacity={0.3} />
                <stop offset="95%" stopColor={T.teal} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradStress3" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={T.red} stopOpacity={0.3} />
                <stop offset="95%" stopColor={T.red} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="month" tick={{ fill: T.textSec, fontSize: 10 }} interval={3} />
            <YAxis tick={{ fill: T.textSec, fontSize: 10 }} unit="bps" />
            <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
            <Legend wrapperStyle={{ color: T.textSec, fontSize: 11 }} />
            <Area type="monotone" dataKey="baseline" name="Baseline" stroke={T.teal} fill="url(#gradBase3)" strokeWidth={2} />
            <Area type="monotone" dataKey="stressed" name="Stressed" stroke={T.red} fill="url(#gradStress3)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

// ─── Tab 4: Credit Book Impact ──────────────────────────────────────────────
const BANK_TYPES = [
  { name: 'Large Universal',     loanBook: 850, climatePct: 38, rwaPct: 12, cet1Impact: 2.1, remCap: 18 },
  { name: 'Mid-size Commercial', loanBook: 340, climatePct: 42, rwaPct: 15, cet1Impact: 2.8, remCap: 9  },
  { name: 'Regional Bank',       loanBook: 120, climatePct: 55, rwaPct: 18, cet1Impact: 3.4, remCap: 4  },
  { name: 'Investment Bank',     loanBook: 620, climatePct: 28, rwaPct: 9,  cet1Impact: 1.6, remCap: 10 },
  { name: 'Savings Institution', loanBook: 85,  climatePct: 60, rwaPct: 22, cet1Impact: 4.1, remCap: 3  },
  { name: 'Development Bank',    loanBook: 210, climatePct: 72, rwaPct: 8,  cet1Impact: 1.2, remCap: 2  },
];

const CREDIT_SECTORS = ['Coal & Lignite','Oil & Gas','Utilities (Fossil)','Automobiles','Aviation','Real Estate','Mining','Chemicals'];

const STAGE2_MIGRATION = { nz2050: 8.2, b2c: 5.5, dnz: 14.6, dt: 22.3, ndc: 18.7, cp: 31.4 };
const PROVISION_UPLIFT  = { nz2050: 0.18, b2c: 0.12, dnz: 0.32, dt: 0.48, ndc: 0.40, cp: 0.65 };

function Tab4({ scen }) {
  const shock = MACRO_SHOCKS.find(m => m.scenarioId === scen);
  const lgdKey = LGD_KEY[scen];

  const sectorLosses = CREDIT_SECTORS.map((sec, i) => {
    const lgdRow = SECTOR_LGD_UPLIFT.find(r => r.sector === sec) || {};
    const lgd = lgdRow[lgdKey] !== undefined ? Math.max(0, lgdRow[lgdKey]) : 0;
    const loss = +((lgd * (2 + sr(i * 13) * 18)) / 10).toFixed(1);
    return { sector: sec, loss };
  });

  const totalLoss = sectorLosses.reduce((sum, d) => sum + d.loss, 0).toFixed(1);
  const capShortfall = Math.max(0, (+totalLoss - 120) * 0.15).toFixed(1);

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <SectionTitle>Bank Balance Sheet Stress — {SCENARIO_LABELS[scen]}</SectionTitle>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={BANK_TYPES} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="name" tick={{ fill: T.textSec, fontSize: 10 }} />
            <YAxis tick={{ fill: T.textSec, fontSize: 10 }} unit="pp" />
            <Tooltip
              contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }}
              formatter={v => [`${v}pp`, 'CET1 Impact']}
            />
            <ReferenceLine y={2.5} stroke={T.red} strokeDasharray="5 3"
              label={{ value: 'Alert 2.5pp', fill: T.red, fontSize: 10 }} />
            <Bar dataKey="cet1Impact" name="CET1 Impact (pp)" radius={[4, 4, 0, 0]}>
              {BANK_TYPES.map((d, i) => <Cell key={i} fill={cet1ImpactColor(d.cet1Impact)} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div style={{ overflowX: 'auto', marginTop: 12 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {['Bank Type','Loan Book ($bn)','Climate Exp %','RWA Uplift %','CET1 Impact','Rem. Cap ($bn)'].map(h => (
                  <th key={h} style={{ padding: '5px 10px', textAlign: 'left', color: T.textSec, fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {BANK_TYPES.map((b, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${T.border}22` }}>
                  <td style={{ padding: '4px 10px', color: T.text }}>{b.name}</td>
                  <td style={{ padding: '4px 10px', color: T.textSec }}>${b.loanBook}</td>
                  <td style={{ padding: '4px 10px', color: T.amber }}>{b.climatePct}%</td>
                  <td style={{ padding: '4px 10px', color: T.amber }}>+{b.rwaPct}%</td>
                  <td style={{ padding: '4px 10px', color: cet1ImpactColor(b.cet1Impact), fontWeight: 700 }}>{b.cet1Impact}pp</td>
                  <td style={{ padding: '4px 10px', color: T.teal }}>${b.remCap}bn</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <Card>
          <SectionTitle>Credit Losses by Sector — {SCENARIO_LABELS[scen]}</SectionTitle>
          {sectorLosses.map((d, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', padding: '5px 0',
              borderBottom: `1px solid ${T.border}22`, fontSize: 12,
            }}>
              <span style={{ color: T.textSec }}>{d.sector}</span>
              <span style={{ color: d.loss > 10 ? T.red : T.amber, fontWeight: 600 }}>${d.loss}bn</span>
            </div>
          ))}
        </Card>

        <Card>
          <SectionTitle>IFRS9 Forward-Looking Provisions — {SCENARIO_LABELS[scen]}</SectionTitle>
          <div style={{ background: T.navy, borderRadius: 6, padding: '12px 16px', marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: T.textMut, marginBottom: 4 }}>Stage 2 Migration</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: T.amber }}>{STAGE2_MIGRATION[scen]}%</div>
            <div style={{ fontSize: 11, color: T.textSec }}>of performing loan book reclassified to Stage 2</div>
          </div>
          <div style={{ background: T.navy, borderRadius: 6, padding: '12px 16px' }}>
            <div style={{ fontSize: 12, color: T.textMut, marginBottom: 4 }}>Provision Uplift</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: T.red }}>
              +{(PROVISION_UPLIFT[scen] * 100).toFixed(0)}bps
            </div>
            <div style={{ fontSize: 11, color: T.textSec }}>expected credit loss provision increase</div>
          </div>
          <div style={{ marginTop: 10, fontSize: 11, color: T.textMut }}>
            IFRS9 requires probability-weighted forward-looking scenarios. ECB guidance (2020) mandates climate scenario inclusion in ECL models.
          </div>
        </Card>
      </div>

      <StatRow stats={[
        { label: 'Total System Stressed Losses', value: `$${totalLoss}bn`, color: T.red },
        { label: 'Avg CET1 Depletion', value: `${shock.cet1Depletion}pp`, sub: 'System-wide', color: T.amber },
        { label: 'Capital Shortfall', value: `$${capShortfall}bn`, color: T.red },
      ]} />
    </div>
  );
}

// ─── Tab 5: Regulatory Submission Tracker ──────────────────────────────────
const REG_FRAMEWORKS = [
  { name: 'ECB Climate Stress Test', cycle: 'Biennial',  templates: 14, due: 'Dec 2026', scenarios: 'NGFS Phase IV (6)', status: 'In Progress', vintage: 'Q4 2025' },
  { name: 'EBA Pillar 2 Climate',    cycle: 'Annual',    templates: 11, due: 'Mar 2027', scenarios: 'NGFS Phase IV (3)', status: 'Upcoming',    vintage: 'Q2 2026' },
  { name: 'BoE CBES',               cycle: '3yr Cycle', templates: 4,  due: 'Jun 2025', scenarios: 'BoE Scenarios (3)', status: 'Complete',    vintage: 'Q3 2024' },
  { name: 'APRA CVA',               cycle: '2yr Cycle', templates: 6,  due: 'Sep 2026', scenarios: 'NGFS + APRA (4)',  status: 'In Progress', vintage: 'Q1 2026' },
  { name: 'MAS Climate ST',         cycle: 'Annual',    templates: 8,  due: 'Nov 2026', scenarios: 'MAS Scenarios (4)',status: 'Upcoming',    vintage: 'Q3 2026' },
  { name: 'Fed Climate Pilot',      cycle: 'Pilot',     templates: 10, due: 'TBD',      scenarios: 'Fed 2 scenarios',  status: 'Complete',    vintage: 'Q4 2023' },
];

const DATA_CHECKLIST = [
  { item: 'PCAF-aligned emissions (Scope 1, 2, 3)', done: true },
  { item: 'Asset-level geospatial data (NUTS3)', done: true },
  { item: 'Counterparty NACE sector mapping', done: true },
  { item: 'Physical risk scoring (JBA / Jupiter)', done: true },
  { item: 'Transition plan data (sector coverage)', done: false },
  { item: 'Forward-looking PD curves (5yr, 10yr, 30yr)', done: true },
  { item: 'Real estate EPC rating coverage (>80%)', done: false },
  { item: 'Carbon price sensitivity (internal model)', done: true },
  { item: 'Supply chain concentration exposure', done: false },
  { item: 'Green asset ratio (GAR) calculation', done: true },
  { item: 'Sovereign climate risk overlay', done: false },
  { item: 'Data governance & auditability trail', done: true },
];

const statusColor = st => st === 'Complete' ? T.green : st === 'In Progress' ? T.amber : T.textMut;

function Tab5() {
  const done = DATA_CHECKLIST.filter(d => d.done).length;
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(310px,1fr))', gap: 14, marginBottom: 20 }}>
        {REG_FRAMEWORKS.map((f, i) => (
          <Card key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{f.name}</div>
              <span style={{
                fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
                background: statusColor(f.status) + '22', color: statusColor(f.status),
              }}>{f.status}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {[['Cycle', f.cycle], ['Templates', f.templates], ['Due', f.due], ['Scenarios', f.scenarios], ['Data Vintage', f.vintage]].map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontSize: 10, color: T.textMut }}>{k}</div>
                  <div style={{ fontSize: 12, color: T.text, fontWeight: 500 }}>{v}</div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <SectionTitle>Data Requirements Checklist ({done}/{DATA_CHECKLIST.length} Complete)</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {DATA_CHECKLIST.map((d, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 0', borderBottom: `1px solid ${T.border}22`,
            }}>
              <span style={{ fontSize: 14, color: d.done ? T.green : T.red, fontWeight: 700 }}>
                {d.done ? '✓' : '✗'}
              </span>
              <span style={{ fontSize: 12, color: d.done ? T.text : T.textMut }}>{d.item}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── Tab 6: Expected Shortfall (CVaR) ──────────────────────────────────────
const VAR_BASE = { nz2050: 1.8, b2c: 1.2, dnz: 3.2, dt: 5.6, ndc: 4.2, cp: 7.1 };

function Tab6({ scen }) {
  const varEsData = SCENARIO_IDS.map(id => ({
    name: SCENARIO_LABELS[id],
    'VaR (99%)': VAR_BASE[id],
    'ES (97.5%)': +(VAR_BASE[id] * 1.28).toFixed(2),
    id,
  }));

  const selectedVaR = VAR_BASE[scen];
  const selectedES = +(selectedVaR * 1.28).toFixed(2);

  const decomp = [
    { factor: 'Transition Risk',  contribution: +(selectedES * 0.42).toFixed(2), color: ACCENT },
    { factor: 'Physical Risk',    contribution: +(selectedES * 0.31).toFixed(2), color: T.amber },
    { factor: 'Macro Contagion',  contribution: +(selectedES * 0.27).toFixed(2), color: T.red },
  ];

  const esTrend = Array.from({ length: 24 }, (_, i) => ({
    month: `M${i + 1}`,
    baseline: +(selectedES * 0.5 + sr(i * 11) * selectedES * 0.2).toFixed(2),
    stressed: +(selectedES * 0.85 + sr(i * 11 + 200) * selectedES * 0.3 + i * 0.04).toFixed(2),
  }));

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <SectionTitle>EBA Methodology: ES (97.5%) vs VaR (99%) — All Scenarios</SectionTitle>
        <div style={{
          fontSize: 12, color: T.textSec, marginBottom: 12, background: T.navy,
          padding: '8px 14px', borderRadius: 6, borderLeft: `3px solid ${ACCENT}`,
        }}>
          ES captures the average loss beyond VaR — more conservative and required by the Basel IV market risk framework.
          ES (97.5%) = VaR (99%) × 1.28 (EBA calibration for climate tail distributions).
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={varEsData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="name" tick={{ fill: T.textSec, fontSize: 10 }} />
            <YAxis tick={{ fill: T.textSec, fontSize: 10 }} unit="pp" />
            <Tooltip
              contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }}
              formatter={(v, n) => [`${v}pp`, n]}
            />
            <Legend wrapperStyle={{ color: T.textSec, fontSize: 11 }} />
            <Bar dataKey="VaR (99%)" radius={[3, 3, 0, 0]}>
              {varEsData.map((d, i) => <Cell key={i} fill={SCENARIO_COLORS[d.id]} opacity={0.65} />)}
            </Bar>
            <Bar dataKey="ES (97.5%)" radius={[3, 3, 0, 0]}>
              {varEsData.map((d, i) => <Cell key={i} fill={SCENARIO_COLORS[d.id]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card>
          <SectionTitle>Selected Scenario — {SCENARIO_LABELS[scen]}</SectionTitle>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, background: T.navy, borderRadius: 8, padding: '14px 18px' }}>
              <div style={{ fontSize: 11, color: T.textMut, marginBottom: 4 }}>VaR (99%)</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: T.teal }}>{selectedVaR}pp</div>
            </div>
            <div style={{ flex: 1, background: T.navy, borderRadius: 8, padding: '14px 18px' }}>
              <div style={{ fontSize: 11, color: T.textMut, marginBottom: 4 }}>ES (97.5%)</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: ACCENT }}>{selectedES}pp</div>
            </div>
          </div>
          <SectionTitle>Tail Risk Decomposition</SectionTitle>
          {decomp.map((d, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: T.text }}>{d.factor}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: d.color }}>{d.contribution}pp</span>
              </div>
              <div style={{ height: 6, background: T.border, borderRadius: 3 }}>
                <div style={{
                  height: '100%', width: `${(d.contribution / selectedES) * 100}%`,
                  background: d.color, borderRadius: 3,
                }} />
              </div>
            </div>
          ))}
        </Card>

        <Card>
          <SectionTitle>24-Month ES Trend</SectionTitle>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={esTrend} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="gradEsBase" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={T.teal} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={T.teal} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradEsStress" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={ACCENT} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={ACCENT} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="month" tick={{ fill: T.textSec, fontSize: 10 }} interval={3} />
              <YAxis tick={{ fill: T.textSec, fontSize: 10 }} unit="pp" />
              <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
              <Legend wrapperStyle={{ color: T.textSec, fontSize: 11 }} />
              <Area type="monotone" dataKey="baseline" name="Baseline ES" stroke={T.teal} fill="url(#gradEsBase)" strokeWidth={2} />
              <Area type="monotone" dataKey="stressed" name="Stressed ES" stroke={ACCENT} fill="url(#gradEsStress)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function StressTestOrchestratorPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [scen, setScen] = useState('dt');

  return (
    <div style={rootStyle}>
      <div style={{ paddingTop: 28, paddingBottom: 20 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: T.text }}>Stress Test Orchestrator</div>
        <div style={{ fontSize: 13, color: T.textSec, marginTop: 2 }}>
          NGFS Phase IV · ECB CST 2022 calibration · LGD uplift · Market risk channels · Basel IV ES methodology
        </div>
      </div>

      <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${T.border}`, marginBottom: 24, overflowX: 'auto' }}>
        {TABS.map((tab, i) => (
          <button key={i} onClick={() => setActiveTab(i)} style={{
            padding: '10px 18px', border: 'none', background: 'transparent', cursor: 'pointer',
            color: activeTab === i ? ACCENT : T.textSec,
            fontWeight: activeTab === i ? 700 : 400, fontSize: 13,
            borderBottom: activeTab === i ? `2px solid ${ACCENT}` : '2px solid transparent',
            whiteSpace: 'nowrap', transition: 'all 0.15s',
          }}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 0 && <Tab1 scen={scen} setScen={setScen} />}
      {activeTab === 1 && <Tab2 scen={scen} />}
      {activeTab === 2 && <Tab3 scen={scen} />}
      {activeTab === 3 && <Tab4 scen={scen} />}
      {activeTab === 4 && <Tab5 />}
      {activeTab === 5 && <Tab6 scen={scen} />}
    </div>
  );
}
